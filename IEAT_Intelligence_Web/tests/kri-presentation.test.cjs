const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({ Intl });
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
vm.runInContext(source.replace(/\nloadBriefing\(\);\s*$/, ""), context);
const raw = JSON.parse(fs.readFileSync(path.join(root, "data/latest.json"), "utf8"));
const data = (Array.isArray(raw) ? raw[0] : raw).latest_json;
const blankActualFixture = {
  items: [{
    kri_code: "F1",
    metrics: ["net_profit", "ebitda_margin"].map((key) => ({
      metric_key: key, actual_value: 0, risk_appetite_value: 10,
      risk_tolerance_value: 5, status: "not_meet", status_label: "Not Meet"
    }))
  }],
  metric_thresholds: ["net_profit", "ebitda_margin"].map((key) => ({
    kri_code: "F1", metric_key: key, actual_value: ""
  }))
};

test("blank and invalid numbers are missing, but explicit zero is valid", () => {
  for (const value of ["", " \n ", null, undefined, false, [], "invalid"]) {
    assert.ok(Number.isNaN(context.toMetricNumber(value)));
  }
  assert.equal(context.toMetricNumber(0), 0);
  assert.equal(context.toMetricNumber("0"), 0);
  assert.equal(context.toMetricNumber("3,406"), 3406);
});

test("raw blank actual overrides pipeline zero without changing source data", () => {
  const before = JSON.stringify(blankActualFixture);
  const kri = context.normalizeKriMetricActuals(blankActualFixture);
  const metrics = kri.items.find((item) => item.kri_code === "F1").metrics;
  assert.equal(metrics.length, 2);
  for (const metric of metrics) {
    assert.equal(metric.actual_value, null);
    assert.equal(context.getMetricStatusDisplay(metric).status, "pending_data");
    assert.equal(context.getMetricChartScale(metric), null);
    assert.doesNotMatch(context.renderF1ThresholdRail(metric), /f1-actual-marker/);
    const panel = context.renderF1MetricValuePanel(metric, {});
    assert.match(panel, /ยังไม่มีข้อมูล/);
    assert.doesNotMatch(panel, /Not Meet|ไม่บรรลุเป้าหมาย/);
    assert.match(panel, /Risk Appetite/);
  }
  assert.equal(JSON.stringify(blankActualFixture), before);
});

test("raw explicit zero remains a measured value and retains its assessment", () => {
  const metric = { metric_key: "profit", actual_value: 0, status: "not_meet",
    risk_appetite_value: 10, risk_tolerance_value: 5 };
  const kri = context.normalizeKriMetricActuals({
    items: [{ kri_code: "F1", metrics: [metric] }],
    metric_thresholds: [{ kri_code: "F1", metric_key: "profit", actual_value: "0" }]
  });
  const result = kri.items[0].metrics[0];
  assert.equal(result.actual_value, "0");
  assert.equal(context.getMetricStatusDisplay(result).status, "not_meet");
  assert.equal(context.getMetricChartScale(result).actual, 0);
  assert.match(context.renderF1ThresholdRail(result), /f1-actual-marker/);
});

test("source matching includes both KRI and metric key; legacy values survive", () => {
  const kri = context.normalizeKriMetricActuals({
    items: [{ kri_code: "F1", metrics: [{ metric_key: "same", actual_value: 12 }] }],
    metric_thresholds: [{ kri_code: "F2", metric_key: "same", actual_value: "" }]
  });
  assert.equal(kri.items[0].metrics[0].actual_value, 12);
  assert.equal(context.normalizeKriMetricActuals(undefined), undefined);
});

test("S1 progress groups agreement, indicator and both detail lines", () => {
  const update = "สอดคล้องกับตัวชี้วัดบันทึกข้อตกลง :\n- ตัวชี้วัด 1.3\n- ระดับ 4 รายละเอียดหนึ่ง\n- ระดับ 3 รายละเอียดสอง";
  const html = context.renderKriProgress(update);
  assert.equal((html.match(/class="kri-progress-group"/g) || []).length, 1);
  assert.equal((html.match(/class="kri-progress-indicator"/g) || []).length, 1);
  assert.match(html, /<h3>สอดคล้องกับ/);
  assert.match(html, /<h4>ตัวชี้วัด 1.3<\/h4>/);
  assert.match(html, /class="kri-progress-details">.*<p>ระดับ 4.*<p>ระดับ 3/s);
  assert.doesNotMatch(html, /<li|<ul/);
});

test("F1 progress keeps two contexts and three separate indicators", () => {
  const html = context.renderKriProgress("สอดคล้องกับบันทึกข้อตกลง :\n- ตัวชี้วัด 2.1\n- ตัวชี้วัด 2.2\n\nสอดคล้องกับแผนวิสาหกิจ :\n- ตัวชี้วัด 1");
  assert.equal((html.match(/class="kri-progress-group"/g) || []).length, 2);
  assert.equal((html.match(/class="kri-progress-indicator"/g) || []).length, 3);
});

test("all progress text is preserved and escaped, including unstructured updates", () => {
  for (const item of data.kri.items) {
    const html = context.renderKriProgress(item.update);
    for (const line of context.getStandardKriTextLines(item.update)) {
      assert.ok(html.includes(context.escapeHtml(line)), `${item.kri_code}: ${line}`);
    }
  }
  const html = context.renderKriProgress("General update\n<script>alert(1)</script>");
  assert.match(html, /General update/);
  assert.doesNotMatch(html, /<script>/);
});
