const DATA_URL = "./data/latest.json";

const CATEGORY_ORDER = [
  "Energy",
  "Supply Chain and Logistics",
  "Technology and Digital Infrastructure",
  "Public Health and Biosecurity",
  "Geopolitics and Trade",
  "Policy and Regulation",
  "Environment and Sustainability",
  "Investment and FDI",
  "Labor and Human Capital",
  "Competitive Landscape"
];

const VALID_CATEGORIES = new Set(CATEGORY_ORDER);
const HOME_CATEGORY_ORDER = [...CATEGORY_ORDER];
const WATCHLIST_CATEGORY_ORDER = [...CATEGORY_ORDER];

const LEGACY_CATEGORY_MAP = {
  "Supply Chain": "Supply Chain and Logistics",
  Geopolitics: "Geopolitics and Trade",
  "Technology & Digital Infrastructure": "Technology and Digital Infrastructure",
  "Public Health & Biosecurity": "Public Health and Biosecurity",
  Domestic: "Policy and Regulation"
};

const VALID_RISK_LEVELS = new Set(["Low", "Medium", "High", "Critical"]);
const VALID_DIRECTIONS = new Set(["Rising", "Stable", "Easing", "Unknown"]);
let briefingData = null;
let currentCategory = "";
let newsDetailOrigin = "home";
let kriDetailReturnView = "home";
let selectedF1MetricKey = "";
let grcActiveTab = "categories";
let grcValuePerformanceType = "VC";
let grcExpandedCategoryCode = "";
let grcSearchQuery = "";
let grcCategoryFilter = "";
let grcStatusFilter = "";
let selectedWatchlistCategory = "";
let swipeBackGesture = null;
let swipeBackListenersBound = false;

const SWIPE_BACK_EDGE_WIDTH = 24;
const SWIPE_BACK_DISTANCE = 90;
const SWIPE_BACK_MAX_VERTICAL_DRIFT = 70;
const SWIPE_BACK_MAX_DURATION = 800;
const SWIPE_BACK_HORIZONTAL_RATIO = 1.25;

const CATEGORY_META = {
  Energy: {
    icon: '<path d="M13 2 5 13h6l-1 9 8-12h-6l1-8Z"></path>',
    color: "#b7791f",
    background: "#fff6df",
    border: "#efd89a"
  },
  "Supply Chain and Logistics": {
    icon: '<path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z"></path><circle cx="7" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle>',
    color: "#6d55b3",
    background: "#f3efff",
    border: "#dbd2ff"
  },
  "Technology and Digital Infrastructure": {
    icon: '<rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M20 9h3M1 15h3M20 15h3"></path>',
    color: "#177f78",
    background: "#e8f7f5",
    border: "#c4e7e2"
  },
  "Public Health and Biosecurity": {
    icon: '<path d="M20.8 9.2c0 5.6-8.8 10.2-8.8 10.2S3.2 14.8 3.2 9.2A4.6 4.6 0 0 1 12 7.1a4.6 4.6 0 0 1 8.8 2.1Z"></path><path d="M7.2 12h2l1.2-2.3 2.1 4.5 1.3-2.2h3"></path>',
    color: "#b94e66",
    background: "#fff0f3",
    border: "#f1c8d0"
  },
  "Geopolitics and Trade": {
    icon: '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"></path>',
    color: "#3268be",
    background: "#edf4ff",
    border: "#c9dbf8"
  },
  "Policy and Regulation": {
    icon: '<path d="M7 3h8l4 4v14H7z"></path><path d="M15 3v5h5M10 12h7M10 16h7"></path>',
    color: "#51677f",
    background: "#f0f5f9",
    border: "#d5e0ea"
  },
  "Environment and Sustainability": {
    icon: '<path d="M5 20c8-1 13-7 14-16-8 1-14 6-14 14v2Z"></path><path d="M5 18c4-4 7-6 13-9"></path>',
    color: "#2d8752",
    background: "#eaf8ef",
    border: "#c8e8d2"
  },
  "Investment and FDI": {
    icon: '<path d="M4 19h16M6 16l4-4 3 3 5-7"></path><path d="M15 8h3v3"></path>',
    color: "#b86b20",
    background: "#fff3e7",
    border: "#efd2b1"
  },
  "Labor and Human Capital": {
    icon: '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM15 21v-2a6 6 0 0 0-12 0v2"></path><path d="M17 11a3 3 0 1 0 0-6M21 21v-2a5 5 0 0 0-4-4.9"></path>',
    color: "#5b5fb8",
    background: "#f0f1ff",
    border: "#d6d8fa"
  },
  "Competitive Landscape": {
    icon: '<path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z"></path><path d="M9 4v14M15 6v14"></path>',
    color: "#536b83",
    background: "#f1f5f9",
    border: "#d8e1ea"
  }
};

function safeText(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function firstSafeText(...values) {
  for (const value of values) {
    const text = safeText(value, "");
    if (text) return text;
  }

  return "";
}

function getWatchpointTitle(item = {}) {
  return firstSafeText(
    item.watchpoint_short,
    item.watchpoint_full,
    item.headline_short,
    item.theme
  );
}

function getWatchpointDetail(item = {}, context = "home") {
  const watchpointFields = context === "watchlist"
    ? [item.watchpoint_full, item.watchpoint_detail]
    : [item.watchpoint_detail, item.watchpoint_full];

  return firstSafeText(
    ...watchpointFields,
    item.headline_detail,
    item.executive_takeaway
  );
}

function safeLink(value) {
  const link = safeText(value, "");
  return /^https?:\/\//i.test(link) ? link : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeCategory(category) {
  const value = safeText(category, "");
  if (!value) return "";
  return LEGACY_CATEGORY_MAP[value] || value;
}

function getPrimaryCategory(item) {
  return normalizeCategory(item?.primary_category || item?.category) || "Geopolitics and Trade";
}

function parseJoinedList(value) {
  return safeText(value, "")
    .split("|")
    .map((item) => normalizeCategory(item))
    .filter(Boolean);
}

function getRelatedCategories(item) {
  const primaryCategory = getPrimaryCategory(item);
  return [...new Set(parseJoinedList(item?.related_categories_joined))]
    .filter((category) => category !== primaryCategory);
}

function parseRelatedCategories(item) {
  return getRelatedCategories(item);
}

function itemTouchesCategory(item, selectedCategory) {
  const category = normalizeCategory(selectedCategory);
  if (!category) return false;

  return getPrimaryCategory(item) === category || getRelatedCategories(item).includes(category);
}

function getCategoryMatchPriority(item, selectedCategory) {
  const category = normalizeCategory(selectedCategory);
  if (getPrimaryCategory(item) === category) return 0;
  if (getRelatedCategories(item).includes(category)) return 1;
  return 2;
}

function newsDedupeKey(item) {
  return (
    safeText(item?.theme_id, "") ||
    safeText(item?.news_key, "") ||
    safeText(item?.headline_short, "")
  );
}

function dedupeNewsItems(items) {
  const seen = new Set();

  return items.filter((item, index) => {
    const key = newsDedupeKey(item) || `news-${index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function categoryOrderIndex(category) {
  const index = CATEGORY_ORDER.indexOf(normalizeCategory(category));
  return index === -1 ? CATEGORY_ORDER.length : index;
}

function safeCategory(value) {
  return normalizeCategory(value) || "Geopolitics and Trade";
}

function getCategoryMeta(category) {
  const displayCategory = normalizeCategory(category);
  return CATEGORY_META[displayCategory] || CATEGORY_META["Geopolitics and Trade"];
}

function safeRisk(value) {
  return VALID_RISK_LEVELS.has(value) ? value : "Medium";
}

function safeDirection(value) {
  return VALID_DIRECTIONS.has(value) ? value : "Unknown";
}

function className(value) {
  return String(value).toLowerCase().replaceAll(" ", "-").replaceAll("&", "and");
}

function formatThaiDate(dateValue) {
  if (!dateValue) return "ไม่ระบุวันที่";

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return safeText(dateValue, "ไม่ระบุวันที่");

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(parsedDate);
}

function formatReportDate(dateValue) {
  if (!dateValue) return "DATE NOT AVAILABLE";

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return safeText(dateValue, "DATE NOT AVAILABLE");

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })
    .format(parsedDate)
    .toUpperCase();
}

function renderBriefMeta(data) {
  const reportDate = document.querySelector("#report-date");
  const summary = document.querySelector("#executive-summary");
  const updatedTime = document.querySelector("#updated-time");

  reportDate.textContent = formatReportDate(data.report_date);
  reportDate.dateTime = safeText(data.report_date, "");
  summary.textContent = safeText(
    data.executive_summary,
    "ยังไม่มีบทสรุปผู้บริหารสำหรับรายงานฉบับนี้"
  );
  if (updatedTime) {
    updatedTime.textContent = safeText(data.updated_time, "--:-- น.");
  }
}

function createCategoryIcon(category) {
  const meta = getCategoryMeta(category);
  return `
    <span class="category-icon" style="--icon-bg:${meta.background};--icon-color:${meta.color}" aria-hidden="true">
      <svg viewBox="0 0 24 24">${meta.icon}</svg>
    </span>
  `;
}

function directionLabel(direction) {
  return {
    Rising: "Risk Increased",
    Easing: "Risk Decreased",
    Stable: "Stable Risk",
    Unknown: "No Recent Signal"
  }[direction] || "No Recent Signal";
}

function createRiskDirectionSparkline(direction, index) {
  const safeValue = safeDirection(direction);
  const paths = {
    Rising: {
      line: "M2 29 C8 30 11 25 17 26 S26 20 32 22 S41 14 48 16 S57 9 66 5",
      area: "M2 29 C8 30 11 25 17 26 S26 20 32 22 S41 14 48 16 S57 9 66 5 L66 35 L2 35 Z"
    },
    Stable: {
      line: "M2 20 C9 17 14 22 20 19 S29 16 36 19 S46 22 53 18 S61 17 66 19",
      area: "M2 20 C9 17 14 22 20 19 S29 16 36 19 S46 22 53 18 S61 17 66 19 L66 35 L2 35 Z"
    },
    Easing: {
      line: "M2 6 C9 8 12 13 18 12 S27 20 34 17 S43 25 50 23 S59 29 66 30",
      area: "M2 6 C9 8 12 13 18 12 S27 20 34 17 S43 25 50 23 S59 29 66 30 L66 35 L2 35 Z"
    },
    Unknown: {
      line: "M2 20 C11 19 16 21 24 20 S38 19 45 20 S58 21 66 20",
      area: "M2 20 C11 19 16 21 24 20 S38 19 45 20 S58 21 66 20 L66 35 L2 35 Z"
    }
  };
  const path = paths[safeValue] || paths.Unknown;
  const gradientId = `risk-spark-${className(safeValue)}-${index}`;

  return `
    <svg class="risk-direction-sparkline risk-direction-sparkline-${className(safeValue)}" viewBox="0 0 68 36" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="currentColor" stop-opacity="0.28"></stop>
          <stop offset="100%" stop-color="currentColor" stop-opacity="0"></stop>
        </linearGradient>
      </defs>
      <path class="risk-sparkline-area" d="${path.area}" fill="url(#${gradientId})"></path>
      <path class="risk-sparkline-line" d="${path.line}"></path>
    </svg>
  `;
}

function createCategoryChip(category, options = {}) {
  const displayCategory = normalizeCategory(category);
  if (!displayCategory) return "";

  const meta = getCategoryMeta(displayCategory);
  const kind = options.primary ? "primary" : "related";
  return `
    <span
      class="category-chip category-chip-${kind}"
      style="--category-chip-bg:${meta.background};--category-chip-color:${meta.color};--category-chip-border:${meta.border}"
    >${escapeHtml(displayCategory)}</span>
  `;
}

function createCategoryChipRow(item, options = {}) {
  const primaryCategory = getPrimaryCategory(item);
  const categories = [primaryCategory, ...parseRelatedCategories(item)];
  const uniqueCategories = [...new Set(categories)].filter(Boolean);
  if (uniqueCategories.length === 0) return "";

  return `
    <span class="category-chip-row${options.compact ? " category-chip-row-compact" : ""}" aria-label="Categories">
      ${uniqueCategories
        .map((category, index) => createCategoryChip(category, { primary: index === 0 }))
        .join("")}
    </span>
  `;
}

function renderRiskOverview(items) {
  const container = document.querySelector("#risk-overview");
  const visibleItems = Array.isArray(items)
    ? [...items]
        .map((item) => ({
          ...item,
          category: getPrimaryCategory(item)
        }))
        .sort((a, b) => {
          const orderA = Number.isFinite(Number(a.category_order))
            ? Number(a.category_order)
            : categoryOrderIndex(a.category) + 100;
          const orderB = Number.isFinite(Number(b.category_order))
            ? Number(b.category_order)
            : categoryOrderIndex(b.category) + 100;
          return orderA - orderB || categoryOrderIndex(a.category) - categoryOrderIndex(b.category);
        })
    : [];

  if (visibleItems.length === 0) {
    container.innerHTML = '<div class="loading-card">ยังไม่มีข้อมูลความเสี่ยงรายหมวดหมู่</div>';
    return;
  }

  container.innerHTML = visibleItems
    .map((item, index) => {
      const category = safeCategory(item.category);
      const riskLevel = safeRisk(item.risk_level);
      const direction = safeDirection(item.risk_direction);
      const meta = getCategoryMeta(category);

      return `
        <button
          class="risk-row"
          type="button"
          data-category="${escapeHtml(category)}"
          aria-label="ดูข่าวหมวด ${escapeHtml(category)}"
          style="--risk-category-color:${meta.color};--risk-category-tint:${meta.background};--risk-category-border:${meta.border}"
        >
          <div class="risk-card-header">
            <div class="risk-main">
              ${createCategoryIcon(category)}
              <div class="category-copy">
                <h3 class="category-name">${escapeHtml(category)}</h3>
              </div>
            </div>
            <span class="risk-badge risk-${className(riskLevel)}">${riskLevel}</span>
          </div>
          <p class="category-subtitle">${escapeHtml(safeText(item.subtitle_th, "ไม่มีรายละเอียดเพิ่มเติม"))}</p>
          <div class="risk-card-footer">
            <div class="risk-signal">
              <span class="direction direction-${className(direction)}">${directionLabel(direction)}</span>
              <span class="direction-note">จากเมื่อวาน</span>
            </div>
            <span class="risk-card-visual">
              ${createRiskDirectionSparkline(direction, index)}
              <span class="risk-card-chevron" aria-hidden="true">→</span>
            </span>
          </div>
        </button>
      `;
    })
    .join("");
}

function findCategorySummary(category) {
  return briefingData?.risk_overview?.find((item) => getPrimaryCategory(item) === category) || {
    category,
    subtitle_th: "ไม่มีรายละเอียดเพิ่มเติม",
    risk_level: "Medium",
    risk_direction: "Unknown"
  };
}

function renderCategoryNews(category) {
  const list = document.querySelector("#category-news-list");
  const count = document.querySelector("#category-news-count");
  const selectedCategory = normalizeCategory(category);
  const newsItems = Array.isArray(briefingData?.web_category_news)
    ? dedupeNewsItems(
        briefingData.web_category_news.filter((item) => itemTouchesCategory(item, selectedCategory))
      )
        .sort((a, b) => {
          const dateOrder = safeText(b.report_date, "").localeCompare(safeText(a.report_date, ""));
          if (dateOrder) return dateOrder;

          const matchOrder =
            getCategoryMatchPriority(a, selectedCategory) -
            getCategoryMatchPriority(b, selectedCategory);
          if (matchOrder) return matchOrder;

          return Number(a.news_rank || 999) - Number(b.news_rank || 999);
        })
    : [];

  count.textContent = String(newsItems.length);

  if (newsItems.length === 0) {
    list.innerHTML = '<div class="empty-news-card">ยังไม่มีข่าวย้อนหลังสำหรับหมวดหมู่นี้</div>';
    return;
  }

  list.innerHTML = newsItems
    .map((item) => {
      const riskLevel = safeRisk(item.risk_level);
      const direction = safeDirection(item.risk_direction);
      const watchpoint = safeText(item.watchpoint_short, "");
      const themeId = safeText(item.theme_id, "");
      const categoryChips = createCategoryChipRow(item, { compact: true });

      return `
        <button class="category-news-card" type="button" data-news-theme="${escapeHtml(themeId)}">
          <div class="news-card-topline">
            <time datetime="${escapeHtml(safeText(item.report_date, ""))}">
              ${escapeHtml(formatThaiDate(item.report_date))}
            </time>
            <div class="news-card-risk">
              <span class="direction direction-${className(direction)}">${direction}</span>
              <span class="risk-badge risk-${className(riskLevel)}">${riskLevel}</span>
            </div>
          </div>
          ${categoryChips}
          <h3>${escapeHtml(safeText(item.headline_short, "ไม่มีชื่อประเด็นข่าว"))}</h3>
          <p class="news-detail">${escapeHtml(safeText(item.headline_detail, "ไม่มีรายละเอียดข่าวเพิ่มเติม"))}</p>
          ${
            watchpoint
              ? `<div class="news-watchpoint">
                  <span>WATCHPOINT</span>
                  <p>${escapeHtml(watchpoint)}</p>
                </div>`
              : ""
          }
          <span class="news-card-open">อ่านรายละเอียด <span aria-hidden="true">→</span></span>
        </button>
      `;
    })
    .join("");
}

function showCategoryDetail(category, updateHash = true) {
  resetSwipeBackGesture();
  const selectedCategory = normalizeCategory(category);
  if (!selectedCategory || !briefingData) return;

  const summary = findCategorySummary(selectedCategory);
  const riskLevel = safeRisk(summary.risk_level);
  const direction = safeDirection(summary.risk_direction);

  document.querySelector("#category-detail-icon").innerHTML = createCategoryIcon(selectedCategory);
  document.querySelector("#category-detail-title").textContent = selectedCategory;
  document.querySelector("#category-detail-subtitle").textContent = safeText(
    summary.subtitle_th,
    "ไม่มีรายละเอียดเพิ่มเติม"
  );

  const directionElement = document.querySelector("#category-detail-direction");
  directionElement.className = `direction direction-${className(direction)}`;
  directionElement.textContent = direction;

  const badge = document.querySelector("#category-detail-badge");
  badge.className = `risk-badge risk-${className(riskLevel)}`;
  badge.textContent = riskLevel;

  renderCategoryNews(selectedCategory);
  currentCategory = selectedCategory;
  document.querySelector("#home-view").hidden = true;
  document.querySelector("#category-view").hidden = false;
  document.querySelector("#today-headlines-view").hidden = true;
  document.querySelector("#news-detail-view").hidden = true;
  document.querySelector("#watchlist-view").hidden = true;
  document.querySelector("#reports-view").hidden = true;
  document.querySelector("#kri-dashboard-view").hidden = true;
  document.querySelector("#kri-detail-view").hidden = true;
  document.querySelector("#grc-page-view").hidden = true;
  document.body.classList.add("detail-open");
  setActiveNav("");
  document.title = `${selectedCategory} | IEAT Intelligence`;
  window.scrollTo({ top: 0, behavior: "auto" });

  if (updateHash) {
    history.pushState({ category: selectedCategory }, "", `#category=${encodeURIComponent(selectedCategory)}`);
  }
}

function showHome(updateHash = true) {
  resetSwipeBackGesture();
  clearGrcHash();
  document.querySelector("#category-view").hidden = true;
  document.querySelector("#today-headlines-view").hidden = true;
  document.querySelector("#news-detail-view").hidden = true;
  document.querySelector("#watchlist-view").hidden = true;
  document.querySelector("#reports-view").hidden = true;
  document.querySelector("#kri-dashboard-view").hidden = true;
  document.querySelector("#kri-detail-view").hidden = true;
  document.querySelector("#grc-page-view").hidden = true;
  document.querySelector("#home-view").hidden = false;
  document.body.classList.remove("detail-open");
  setActiveNav("home");
  document.title = "IEAT Intelligence";
  window.scrollTo({ top: 0, behavior: "auto" });

  if (updateHash) {
    history.pushState({}, "", `${window.location.pathname}${window.location.search}`);
  }
}

function getWebCategoryNews() {
  return Array.isArray(briefingData?.web_category_news) ? briefingData.web_category_news : [];
}

function findFullNews(item) {
  if (!item) return null;

  const themeId = safeText(item.theme_id, "");
  if (!themeId) return item;

  return getWebCategoryNews().find((news) => news.theme_id === themeId) || item;
}

function findNewsByTheme(themeId) {
  return getWebCategoryNews().find((item) => item.theme_id === themeId) || null;
}

function getTodayHeadlineItems() {
  const webTopHeadlines = Array.isArray(briefingData?.web_top_headlines)
    ? briefingData.web_top_headlines.map(findFullNews).filter(Boolean)
    : [];
  const categoryNews = getWebCategoryNews();
  const combinedNews = [...webTopHeadlines, ...categoryNews];
  const latestDate = combinedNews.reduce(
    (latest, item) => (safeText(item.report_date, "") > latest ? item.report_date : latest),
    ""
  );
  const seen = new Set();

  return combinedNews
    .filter((item) => item.report_date === latestDate)
    .filter((item) => {
      const key = safeText(item.theme_id, "") || safeText(item.headline_short, "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Number(a.news_rank || 0) - Number(b.news_rank || 0));
}

function renderTodayHeadlines() {
  const list = document.querySelector("#today-headlines-list");
  const date = document.querySelector("#today-headlines-date");
  const count = document.querySelector("#today-headlines-count");
  const items = getTodayHeadlineItems();
  const latestDate = items[0]?.report_date || briefingData?.report_date;

  date.textContent = `อัปเดตล่าสุด ${formatThaiDate(latestDate)}`;
  count.textContent = String(items.length);

  if (items.length === 0) {
    list.innerHTML = '<div class="empty-news-card">ยังไม่มีข่าวสำหรับวันนี้</div>';
    return;
  }

  list.innerHTML = items
    .map((item, index) => {
      const riskLevel = safeRisk(item.risk_level);
      const direction = safeDirection(item.risk_direction);
      const themeId = safeText(item.theme_id, "");
      const categoryChips = createCategoryChipRow(item);

      return `
        <button
          class="today-headline-card"
          type="button"
          data-today-index="${index}"
          data-news-theme="${escapeHtml(themeId)}"
          aria-label="เปิดรายละเอียดข่าว ${index + 1}: ${escapeHtml(safeText(item.headline_short, "ไม่มีชื่อประเด็นข่าว"))}"
        >
          <div class="today-headline-number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</div>
          <div class="today-headline-copy">
            <h2>${escapeHtml(safeText(item.headline_short, "ไม่มีชื่อประเด็นข่าว"))}</h2>
            <p>${escapeHtml(safeText(item.headline_detail, "ไม่มีรายละเอียดข่าวเพิ่มเติม"))}</p>
            ${categoryChips}
            <div class="today-headline-meta">
              <time datetime="${escapeHtml(safeText(item.report_date, ""))}">${escapeHtml(formatThaiDate(item.report_date || latestDate))}</time>
              <span class="direction direction-${className(direction)}">${direction}</span>
              <span class="risk-badge risk-${className(riskLevel)}">${riskLevel}</span>
            </div>
          </div>
          <span class="headline-chevron" aria-hidden="true">›</span>
        </button>
      `;
    })
    .join("");
}

function showTodayHeadlines() {
  resetSwipeBackGesture();
  renderTodayHeadlines();
  document.querySelector("#home-view").hidden = true;
  document.querySelector("#category-view").hidden = true;
  document.querySelector("#news-detail-view").hidden = true;
  document.querySelector("#watchlist-view").hidden = true;
  document.querySelector("#reports-view").hidden = true;
  document.querySelector("#kri-dashboard-view").hidden = true;
  document.querySelector("#kri-detail-view").hidden = true;
  document.querySelector("#grc-page-view").hidden = true;
  document.querySelector("#today-headlines-view").hidden = false;
  document.body.classList.add("detail-open");
  setActiveNav("home");
  document.title = "ข่าวทั้งหมดวันนี้ | IEAT Intelligence";
  window.scrollTo({ top: 0, behavior: "auto" });
}

function getNewsSources(news) {
  const sourceCandidates = [];
  const sourcesJson = safeText(news.sources_json, "");

  if (sourcesJson) {
    try {
      const parsedSources = JSON.parse(sourcesJson);
      if (Array.isArray(parsedSources)) {
        parsedSources
          .filter((source) => source && typeof source === "object")
          .forEach((source) => {
            sourceCandidates.push({
              name: safeText(source.source_name, ""),
              link: safeLink(source.source_link)
            });
          });
      }
    } catch {}
  }

  const joinedNames = safeText(news.source_names_joined, "");
  const joinedLinks = safeText(news.source_links_joined, "");

  if (joinedNames || joinedLinks) {
    const names = joinedNames ? joinedNames.split(" | ") : [];
    const links = joinedLinks ? joinedLinks.split(" | ") : [];
    const sourceTotal = Math.max(names.length, links.length);

    Array.from({ length: sourceTotal }, (_, index) => ({
      name: safeText(names[index], ""),
      link: safeLink(links[index])
    })).forEach((source) => sourceCandidates.push(source));
  }

  const primarySource = safeText(news.primary_source, "");
  const primaryLink = safeLink(news.primary_link);

  if (primarySource || primaryLink) {
    sourceCandidates.push({ name: primarySource, link: primaryLink });
  }

  const seen = new Set();

  return sourceCandidates
    .filter((source) => source.name || source.link)
    .map((source) => ({
      name: safeText(source.name, "แหล่งข่าวต้นฉบับ"),
      link: safeLink(source.link)
    }))
    .filter((source) => {
      const key = `${source.name}\u0000${source.link}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function renderSourceList(sources) {
  if (sources.length === 0) {
    return '<p class="article-source-empty">ไม่พบข้อมูลแหล่งข่าวอ้างอิง</p>';
  }

  return `
    <ol class="article-source-list">
      ${sources
        .map(
          (source) => `
            <li>
              ${
                source.link
                  ? `<a href="${escapeHtml(source.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.name)}</a>`
                  : `<span>${escapeHtml(source.name)}</span>`
              }
            </li>
          `
        )
        .join("")}
    </ol>
  `;
}

function getKeySignals(news = {}) {
  const signalsJson = safeText(news.key_signals_json, "");

  if (signalsJson) {
    try {
      const parsedSignals = JSON.parse(signalsJson);
      if (Array.isArray(parsedSignals)) {
        const signals = parsedSignals
          .map((signal) => safeText(signal, ""))
          .filter(Boolean);

        if (signals.length > 0) return signals;
      }
    } catch {}
  }

  const joinedSignals = safeText(news.key_signals_joined, "");
  if (!joinedSignals) return [];

  return joinedSignals
    .split("|")
    .map((signal) => safeText(signal, ""))
    .filter(Boolean);
}

function renderKeySignals(signals) {
  if (signals.length === 0) return "";

  return `
    <section class="article-briefing-section article-key-signals">
      <p class="section-kicker">KEY SIGNALS</p>
      <h2>สัญญาณสำคัญจากข่าว</h2>
      <ul class="article-signal-list">
        ${signals.map((signal) => `<li>${escapeHtml(signal)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderArticleMetadataRow(label, value, icon, classNameValue = "") {
  if (!value) return "";

  return `
    <div class="news-metadata-row${classNameValue ? ` ${classNameValue}` : ""}">
      <span class="news-metadata-icon" aria-hidden="true">${icon}</span>
      <span class="news-metadata-label">${escapeHtml(label)}</span>
      <span class="news-metadata-value">${value}</span>
    </div>
  `;
}

function renderArticleMetadataSources(sources) {
  if (sources.length === 0) return "";

  return `
    <div class="news-metadata-row news-metadata-sources">
      <span class="news-metadata-icon" aria-hidden="true">${articleMetadataIcon("source")}</span>
      <span class="news-metadata-label">แหล่งข่าว</span>
      <div class="news-source-pairs">
        ${sources
          .map(
            (source) => `
              <div class="news-source-pair">
                <span class="news-source-name">${escapeHtml(source.name)}</span>
                ${
                  source.link
                    ? `<a href="${escapeHtml(source.link)}" target="_blank" rel="noopener noreferrer" aria-label="เปิดอ่านข่าวจาก ${escapeHtml(source.name)}">เปิดอ่าน <span aria-hidden="true">↗</span></a>`
                    : ""
                }
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function articleMetadataIcon(type) {
  const icons = {
    date: '<svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14" rx="2"></rect><path d="M8 3.5v4M16 3.5v4M4 9.5h16"></path></svg>',
    primary: '<svg viewBox="0 0 24 24"><path d="m12 3 8 4-8 4-8-4 8-4Z"></path><path d="m4 12 8 4 8-4M4 17l8 4 8-4"></path></svg>',
    related: '<svg viewBox="0 0 24 24"><path d="M20 12 12 20l-8-8V5a1 1 0 0 1 1-1h7l8 8Z"></path><circle cx="8.5" cy="8.5" r="1"></circle></svg>',
    source: '<svg viewBox="0 0 24 24"><path d="M6 3.5h9l3 3v14H6z"></path><path d="M15 3.5v4h4M9 12h6M9 16h6"></path></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="m9.5 14.5 5-5"></path><path d="M7.5 17.5 6 19a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0"></path><path d="m16.5 6.5 1.5-1.5a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0"></path></svg>'
  };

  return icons[type] || icons.source;
}

function renderNewsDetail(item) {
  const container = document.querySelector("#news-detail-content");
  const news = findFullNews(item) || {};
  const riskLevel = safeRisk(news.risk_level);
  const direction = safeDirection(news.risk_direction);
  const headline = safeText(
    news.headline_full,
    safeText(news.headline_short, "ไม่มีชื่อประเด็นข่าว")
  );
  const intro = safeText(
    news.headline_detail_full,
    safeText(news.headline_detail, "")
  );
  const executiveTakeaway = safeText(news.executive_takeaway_full, "");
  const keySignals = getKeySignals(news);
  const thailandImpact = safeText(news.thailand_impact_full, "");
  const ieatRelevance = safeText(news.ieat_relevance_full, "");
  const watchpoint = safeText(
    news.watchpoint_full,
    safeText(news.watchpoint_short, "")
  );
  const sources = getNewsSources(news);
  const primaryCategory = getPrimaryCategory(news);
  const relatedCategories = [...new Set(parseRelatedCategories(news))]
    .filter((category) => category && category !== primaryCategory);
  const sourceCount =
    news.source_count !== undefined &&
    news.source_count !== null &&
    Number.isFinite(Number(news.source_count))
      ? Number(news.source_count)
      : null;

  const articleBody = `
    ${
      executiveTakeaway
        ? `<section class="article-briefing-section article-summary">
            <p class="section-kicker">EXECUTIVE SUMMARY</p>
            <h2>สรุปประเด็น</h2>
            <p>${escapeHtml(executiveTakeaway)}</p>
          </section>`
        : ""
    }
    ${renderKeySignals(keySignals)}
    ${
      thailandImpact
        ? `<section class="article-briefing-section">
            <p class="section-kicker">THAILAND IMPACT</p>
            <h2>ผลกระทบต่อไทย</h2>
            <p>${escapeHtml(thailandImpact)}</p>
          </section>`
        : ""
    }
    ${
      ieatRelevance
        ? `<section class="article-briefing-section">
            <p class="section-kicker">IEAT RELEVANCE</p>
            <h2>ความเกี่ยวข้องกับ กนอ.</h2>
            <p>${escapeHtml(ieatRelevance)}</p>
          </section>`
        : ""
    }
    ${
      watchpoint
        ? `<section class="article-watchpoint">
            <p class="section-kicker">EXECUTIVE WATCHPOINT</p>
            <h2>ประเด็นที่ต้องติดตาม</h2>
            <p>${escapeHtml(watchpoint)}</p>
          </section>`
        : ""
    }
    <section class="article-source">
      <p class="section-kicker">REFERENCE</p>
      <h2>แหล่งข่าวอ้างอิง</h2>
      ${sourceCount !== null ? `<p class="article-source-count">${sourceCount} แหล่งข่าวประกอบ</p>` : ""}
      ${renderSourceList(sources)}
    </section>
  `;

  const metadataRows = [
    renderArticleMetadataRow(
      "อัปเดตล่าสุด",
      escapeHtml(formatThaiDate(news.report_date || briefingData?.report_date)),
      articleMetadataIcon("date")
    ),
    renderArticleMetadataRow(
      "หมวดหมู่หลัก",
      primaryCategory ? escapeHtml(primaryCategory) : "",
      articleMetadataIcon("primary")
    ),
    renderArticleMetadataRow(
      "หมวดหมู่รอง",
      relatedCategories.length > 0 ? escapeHtml(relatedCategories.join(", ")) : "",
      articleMetadataIcon("related")
    ),
    renderArticleMetadataSources(sources)
  ].join("");

  container.innerHTML = `
    <div class="news-detail-layout">
      <header class="news-article-header">
        ${createCategoryChipRow(news)}
        <time datetime="${escapeHtml(safeText(news.report_date, ""))}">
          ${escapeHtml(formatThaiDate(news.report_date || briefingData?.report_date))}
        </time>
        <h1 id="news-detail-title">${escapeHtml(headline)}</h1>
        ${intro ? `<p class="news-article-lead">${escapeHtml(intro)}</p>` : ""}
      </header>
      <aside class="news-article-metadata" aria-label="ข้อมูลข่าว">
        <div class="news-article-risk">
          <span class="direction direction-${className(direction)}">${direction}</span>
          <span class="risk-badge risk-${className(riskLevel)}">${riskLevel}</span>
        </div>
        <div class="news-metadata-rows">${metadataRows}</div>
      </aside>
      <div class="news-article-body">${articleBody}</div>
    </div>
  `;
}

function showNewsDetail(item, origin) {
  if (!item) return;

  resetSwipeBackGesture();
  newsDetailOrigin = origin;
  renderNewsDetail(item);
  document.querySelector("#home-view").hidden = true;
  document.querySelector("#category-view").hidden = true;
  document.querySelector("#today-headlines-view").hidden = true;
  document.querySelector("#watchlist-view").hidden = true;
  document.querySelector("#reports-view").hidden = true;
  document.querySelector("#kri-dashboard-view").hidden = true;
  document.querySelector("#kri-detail-view").hidden = true;
  document.querySelector("#grc-page-view").hidden = true;
  document.querySelector("#news-detail-view").hidden = false;
  document.body.classList.add("detail-open");
  setActiveNav(origin === "watchlist" ? "watchlist" : "home");
  const news = findFullNews(item) || item;
  document.title = `${safeText(
    news.headline_full,
    safeText(news.headline_short, "News Detail")
  )} | IEAT Intelligence`;
  window.scrollTo({ top: 0, behavior: "auto" });
}

function backFromNewsDetail() {
  if (newsDetailOrigin === "category" && currentCategory) {
    showCategoryDetail(currentCategory, false);
    return;
  }

  if (newsDetailOrigin === "today") {
    showTodayHeadlines();
    return;
  }

  if (newsDetailOrigin === "watchlist") {
    showWatchlist();
    return;
  }

  showHome(false);
}

function backFromCategoryDetail() {
  showHome(false);
  history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
}

function backFromTodayHeadlines() {
  showHome(false);
}

function setActiveNav(activeView) {
  const home = document.querySelector("#nav-home");
  const erm = document.querySelector("#nav-erm");
  const grc = document.querySelector("#nav-grc");
  const reports = document.querySelector("#nav-reports");
  const watchlist = document.querySelector("#nav-watchlist");

  home.classList.toggle("active", activeView === "home");
  erm.classList.toggle("active", activeView === "erm");
  grc.classList.toggle("active", activeView === "grc");
  reports.classList.toggle("active", activeView === "reports");
  watchlist.classList.toggle("active", activeView === "watchlist");

  if (activeView === "home") {
    home.setAttribute("aria-current", "page");
  } else {
    home.removeAttribute("aria-current");
  }

  if (activeView === "erm") {
    erm.setAttribute("aria-current", "page");
  } else {
    erm.removeAttribute("aria-current");
  }

  if (activeView === "grc") {
    grc.setAttribute("aria-current", "page");
  } else {
    grc.removeAttribute("aria-current");
  }

  if (activeView === "reports") {
    reports.setAttribute("aria-current", "page");
  } else {
    reports.removeAttribute("aria-current");
  }

  if (activeView === "watchlist") {
    watchlist.setAttribute("aria-current", "page");
  } else {
    watchlist.removeAttribute("aria-current");
  }

  document.querySelectorAll("[data-shell-nav]").forEach((item) => {
    const isActive = item.dataset.shellNav === activeView;
    item.classList.toggle("active", isActive);
    if (isActive) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });
}

function getWatchlistItems() {
  const categoryNews = getWebCategoryNews();
  const sourceItems =
    categoryNews.length > 0
      ? categoryNews
      : Array.isArray(briefingData?.web_watchlist)
        ? briefingData.web_watchlist
        : [];

  return sourceItems
    .map((item, sourceIndex) => {
      const title = getWatchpointTitle(item);

      return {
        ...item,
        category: getPrimaryCategory(item),
        title,
        detail: getWatchpointDetail(item, "watchlist"),
        rank: Number(item.news_rank ?? item.watch_rank ?? 0),
        sourceIndex
      };
    })
    .filter((item) => WATCHLIST_CATEGORY_ORDER.includes(item.category))
    .filter((item) => item.title)
    .sort((a, b) => {
      const aDate = getWatchlistDateValue(a.report_date);
      const bDate = getWatchlistDateValue(b.report_date);

      if (aDate === null && bDate === null) return a.sourceIndex - b.sourceIndex;
      if (aDate === null) return 1;
      if (bDate === null) return -1;
      return bDate - aDate || a.sourceIndex - b.sourceIndex;
    });
}

function getWatchlistDateValue(value) {
  const dateValue = safeText(value, "");
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.getTime();
}

function formatWatchlistDate(value) {
  return getWatchlistDateValue(value) === null ? "ไม่ระบุวันที่" : formatThaiDate(value);
}

function findWatchlistNews(item) {
  const themeId = safeText(item.theme_id, "");
  const newsKey = safeText(item.news_key, safeText(item.watch_key, ""));

  return (
    getWebCategoryNews().find(
      (news) =>
        (themeId && news.theme_id === themeId) ||
        (newsKey && news.news_key === newsKey)
    ) || null
  );
}

function createWatchlistTags(item) {
  const tags = safeText(item?.topic_tags_joined, "")
    .split("|")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (tags.length === 0) return "";

  const visibleTags = tags.slice(0, 3);
  const remainingCount = tags.length - visibleTags.length;

  return `
    <span class="watchlist-tag-list" aria-label="หัวข้อที่เกี่ยวข้อง">
      ${visibleTags.map((tag) => `<span class="watchlist-tag">${escapeHtml(tag)}</span>`).join("")}
      ${remainingCount > 0 ? `<span class="watchlist-tag watchlist-tag-more">+${remainingCount}</span>` : ""}
    </span>
  `;
}

function renderWatchlistCategoryFilters(items) {
  const container = document.querySelector("#watchlist-category-filters");
  const availableCategories = new Set(items.map((item) => item.category));
  const categories = WATCHLIST_CATEGORY_ORDER.filter((category) => availableCategories.has(category));

  if (selectedWatchlistCategory && !availableCategories.has(selectedWatchlistCategory)) {
    selectedWatchlistCategory = "";
  }

  container.innerHTML = ["", ...categories]
    .map((category) => {
      const isActive = category === selectedWatchlistCategory;
      const label = category || "ทั้งหมด";

      return `
        <button
          class="watchlist-category-filter${isActive ? " is-active" : ""}"
          type="button"
          data-watchlist-category-filter="${escapeHtml(category)}"
          aria-pressed="${isActive}"
        >${escapeHtml(label)}</button>
      `;
    })
    .join("");
}

function renderWatchlist() {
  const container = document.querySelector("#watchlist-items");
  const count = document.querySelector("#watchlist-count");
  const allItems = getWatchlistItems();
  renderWatchlistCategoryFilters(allItems);
  const items = selectedWatchlistCategory
    ? allItems.filter((item) => item.category === selectedWatchlistCategory)
    : allItems;
  count.textContent = String(items.length);

  if (items.length === 0) {
    container.innerHTML = '<div class="empty-news-card">ยังไม่มีประเด็นที่ต้องติดตาม</div>';
    return;
  }

  const rows = items.map((item, index) => {
    const news = findWatchlistNews(item) || item;
    const watchpointContent = { ...news, ...item };
    const category = getPrimaryCategory(item);
    const title = getWatchpointTitle(watchpointContent);
    const detail = getWatchpointDetail(watchpointContent, "watchlist");
    const summary = detail !== title ? detail : "";
    const themeId = safeText(news.theme_id, "");
    const displayDate = formatWatchlistDate(item.report_date);
    const dateTime = getWatchlistDateValue(item.report_date) === null
      ? ""
      : safeText(item.report_date, "");
    const rowContent = `
      <span class="watchlist-rank" aria-label="ลำดับ ${index + 1}">${String(index + 1).padStart(2, "0")}</span>
      <span class="watchlist-item-copy">
        <strong class="watchlist-item-title">${escapeHtml(title)}</strong>
        ${summary ? `<span class="watchlist-item-summary">${escapeHtml(summary)}</span>` : ""}
        ${createWatchlistTags(news)}
      </span>
      <span class="watchlist-item-category">
        ${createCategoryIcon(category)}
        <span>${escapeHtml(category)}</span>
      </span>
      <span class="watchlist-item-meta">
        <time class="watchlist-item-date"${dateTime ? ` datetime="${escapeHtml(dateTime)}"` : ""}>${escapeHtml(displayDate)}</time>
      </span>
      <span class="watchlist-link-mark" aria-hidden="true">›</span>
    `;

    return themeId
      ? `<button class="watchlist-item" type="button" data-watchlist-theme="${escapeHtml(themeId)}" aria-label="เปิดรายละเอียด: ${escapeHtml(title)}, หมวด ${escapeHtml(category)}, อัปเดต ${escapeHtml(displayDate)}">${rowContent}</button>`
      : `<article class="watchlist-item watchlist-item-static">${rowContent}</article>`;
  }).join("");

  container.innerHTML = `
    <div class="watchlist-table-heading" aria-hidden="true">
      <span>ลำดับ</span>
      <span>ประเด็นสำคัญ</span>
      <span>หมวดหมู่</span>
      <span>อัปเดตล่าสุด</span>
      <span></span>
    </div>
    <div class="watchlist-list">${rows}</div>
  `;
}

function showWatchlist() {
  resetSwipeBackGesture();
  clearGrcHash();
  renderWatchlist();
  document.querySelector("#home-view").hidden = true;
  document.querySelector("#category-view").hidden = true;
  document.querySelector("#today-headlines-view").hidden = true;
  document.querySelector("#news-detail-view").hidden = true;
  document.querySelector("#reports-view").hidden = true;
  document.querySelector("#kri-dashboard-view").hidden = true;
  document.querySelector("#kri-detail-view").hidden = true;
  document.querySelector("#grc-page-view").hidden = true;
  document.querySelector("#watchlist-view").hidden = false;
  document.body.classList.remove("detail-open");
  setActiveNav("watchlist");
  document.title = "Watchlist | IEAT Intelligence";
  window.scrollTo({ top: 0, behavior: "auto" });
}

function showReports() {
  resetSwipeBackGesture();
  clearGrcHash();
  renderReportsMeta();
  document.querySelector("#home-view").hidden = true;
  document.querySelector("#category-view").hidden = true;
  document.querySelector("#today-headlines-view").hidden = true;
  document.querySelector("#news-detail-view").hidden = true;
  document.querySelector("#watchlist-view").hidden = true;
  document.querySelector("#reports-view").hidden = false;
  document.querySelector("#kri-dashboard-view").hidden = true;
  document.querySelector("#kri-detail-view").hidden = true;
  document.querySelector("#grc-page-view").hidden = true;
  document.body.classList.remove("detail-open");
  setActiveNav("reports");
  document.title = "Reports | IEAT Intelligence";
  window.scrollTo({ top: 0, behavior: "auto" });
}

function renderReportsMeta() {
  const reportDate = document.querySelector("#reports-latest-date");
  const dateValue = safeText(
    briefingData?.web_reports_index?.report_date,
    safeText(briefingData?.report_date, "")
  );

  reportDate.textContent = formatThaiDate(dateValue);
  reportDate.dateTime = dateValue;
  syncReportsUrl();
}

const DEFAULT_REPORT_URL = "https://ieat-daily-brief-new.pages.dev/";

function getReportsUrl() {
  const candidate = safeText(
    briefingData?.web_reports_index?.report_url,
    DEFAULT_REPORT_URL
  );

  try {
    const url = new URL(candidate, window.location.href);
    return ["http:", "https:"].includes(url.protocol)
      ? url.href
      : DEFAULT_REPORT_URL;
  } catch {
    return DEFAULT_REPORT_URL;
  }
}

function syncReportsUrl() {
  const reportUrl = getReportsUrl();
  const frame = document.querySelector("#reports-frame");
  const shell = document.querySelector("#reports-frame-shell");
  const loading = document.querySelector("#reports-frame-loading");

  document.querySelectorAll("[data-report-link]").forEach((link) => {
    link.href = reportUrl;
  });

  if (frame.dataset.reportUrl === reportUrl) return;

  shell.classList.add("is-loading");
  shell.classList.remove("is-loaded");
  loading.hidden = false;
  frame.dataset.reportUrl = reportUrl;
  frame.src = reportUrl;
}

function bindReportsFrame() {
  const frame = document.querySelector("#reports-frame");
  const shell = document.querySelector("#reports-frame-shell");
  const loading = document.querySelector("#reports-frame-loading");

  frame.addEventListener(
    "load",
    () => {
      shell.classList.remove("is-loading");
      shell.classList.add("is-loaded");
      loading.hidden = true;
    }
  );

  syncReportsUrl();
}

function showGrcPage(updateHash = true) {
  resetSwipeBackGesture();
  grcActiveTab = "categories";
  grcValuePerformanceType = "VC";
  grcExpandedCategoryCode = "";
  grcSearchQuery = "";
  grcCategoryFilter = "";
  grcStatusFilter = "";
  renderGrcPage();

  document.querySelector("#home-view").hidden = true;
  document.querySelector("#category-view").hidden = true;
  document.querySelector("#today-headlines-view").hidden = true;
  document.querySelector("#news-detail-view").hidden = true;
  document.querySelector("#watchlist-view").hidden = true;
  document.querySelector("#reports-view").hidden = true;
  document.querySelector("#kri-dashboard-view").hidden = true;
  document.querySelector("#kri-detail-view").hidden = true;
  document.querySelector("#grc-page-view").hidden = false;
  document.body.classList.add("detail-open");
  setActiveNav("grc");
  document.title = "GRC | IEAT Intelligence";
  window.scrollTo({ top: 0, behavior: "auto" });

  if (updateHash && window.location.hash !== "#grc") {
    history.pushState({ view: "grc" }, "", "#grc");
  }
}

function backFromGrcPage() {
  showHome(false);
  history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
}

function clearGrcHash() {
  if (window.location.hash === "#grc") {
    history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
  }
}

function showKriDashboard() {
  resetSwipeBackGesture();
  clearGrcHash();
  renderKriDashboard();
  document.querySelector("#home-view").hidden = true;
  document.querySelector("#category-view").hidden = true;
  document.querySelector("#today-headlines-view").hidden = true;
  document.querySelector("#news-detail-view").hidden = true;
  document.querySelector("#watchlist-view").hidden = true;
  document.querySelector("#reports-view").hidden = true;
  document.querySelector("#kri-dashboard-view").hidden = false;
  document.querySelector("#kri-detail-view").hidden = true;
  document.querySelector("#grc-page-view").hidden = true;
  document.body.classList.add("detail-open");
  setActiveNav("erm");
  document.title = "ERM Dashboard | IEAT Intelligence";
  window.scrollTo({ top: 0, behavior: "auto" });
}

function showKriDetail(kriCode, returnView = "home") {
  const item = getKriItemByCode(kriCode);
  if (!item) return;

  resetSwipeBackGesture();
  kriDetailReturnView = returnView;
  renderKriDetail(item);
  document.querySelector("#home-view").hidden = true;
  document.querySelector("#category-view").hidden = true;
  document.querySelector("#today-headlines-view").hidden = true;
  document.querySelector("#news-detail-view").hidden = true;
  document.querySelector("#watchlist-view").hidden = true;
  document.querySelector("#reports-view").hidden = true;
  document.querySelector("#kri-dashboard-view").hidden = true;
  document.querySelector("#kri-detail-view").hidden = false;
  document.querySelector("#grc-page-view").hidden = true;
  document.body.classList.add("detail-open");
  setActiveNav("erm");
  document.title = `${safeText(item.kri_code, "KRI")} | IEAT Intelligence`;
  window.scrollTo({ top: 0, behavior: "auto" });
}

function backFromKriDetail() {
  if (kriDetailReturnView === "kri-dashboard") {
    showKriDashboard();
    return;
  }

  showHome(false);
}

function resetSwipeBackGesture() {
  swipeBackGesture = null;
}

function getSwipeBackAction() {
  const newsDetailView = document.querySelector("#news-detail-view");
  if (newsDetailView && !newsDetailView.hidden) return backFromNewsDetail;

  const categoryView = document.querySelector("#category-view");
  if (categoryView && !categoryView.hidden) return backFromCategoryDetail;

  const todayView = document.querySelector("#today-headlines-view");
  if (todayView && !todayView.hidden) return backFromTodayHeadlines;

  const kriDetailView = document.querySelector("#kri-detail-view");
  if (kriDetailView && !kriDetailView.hidden) return backFromKriDetail;

  return null;
}

function canSwipeBack() {
  const isMobileLayout = window.matchMedia("(max-width: 767px)").matches;
  const hasTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;

  return isMobileLayout && hasTouch && Boolean(getSwipeBackAction());
}

function shouldIgnoreSwipeBackTarget(target) {
  const element = target instanceof Element ? target : target?.parentElement;
  if (!element) return true;

  if (
    element.closest(
      'input, textarea, select, button, a, iframe, canvas, video, audio, [contenteditable="true"], [role="slider"], .no-swipe-back'
    )
  ) {
    return true;
  }

  let current = element;
  while (current && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const canScrollHorizontally =
      current.scrollWidth > current.clientWidth + 1 && /^(auto|scroll)$/.test(style.overflowX);

    if (canScrollHorizontally) return true;
    current = current.parentElement;
  }

  return false;
}

function performSafeBackNavigation() {
  const action = getSwipeBackAction();
  resetSwipeBackGesture();
  if (action) action();
}

function bindSwipeBackGesture() {
  if (swipeBackListenersBound) return;
  swipeBackListenersBound = true;

  document.addEventListener(
    "touchstart",
    (event) => {
      resetSwipeBackGesture();
      if (event.defaultPrevented || event.touches.length !== 1 || !canSwipeBack()) return;

      const touch = event.touches[0];
      if (touch.clientX > SWIPE_BACK_EDGE_WIDTH || shouldIgnoreSwipeBackTarget(event.target)) return;

      swipeBackGesture = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        cancelled: false,
        fired: false
      };
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      if (!swipeBackGesture || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - swipeBackGesture.startX;
      const deltaY = touch.clientY - swipeBackGesture.startY;
      const verticalDrift = Math.abs(deltaY);

      if (
        deltaX < -10 ||
        verticalDrift > SWIPE_BACK_MAX_VERTICAL_DRIFT ||
        (verticalDrift > 18 && verticalDrift >= Math.max(deltaX, 0) * 0.8)
      ) {
        swipeBackGesture.cancelled = true;
      }
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (event) => {
      if (!swipeBackGesture || swipeBackGesture.fired || event.changedTouches.length !== 1) {
        resetSwipeBackGesture();
        return;
      }

      const gesture = swipeBackGesture;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;
      const verticalDrift = Math.abs(deltaY);
      const duration = Date.now() - gesture.startTime;
      const isValidSwipe =
        !gesture.cancelled &&
        duration <= SWIPE_BACK_MAX_DURATION &&
        deltaX >= SWIPE_BACK_DISTANCE &&
        deltaX > verticalDrift * SWIPE_BACK_HORIZONTAL_RATIO &&
        verticalDrift <= SWIPE_BACK_MAX_VERTICAL_DRIFT &&
        canSwipeBack();

      if (!isValidSwipe) {
        resetSwipeBackGesture();
        return;
      }

      gesture.fired = true;
      performSafeBackNavigation();
    },
    { passive: true }
  );

  document.addEventListener("touchcancel", resetSwipeBackGesture, { passive: true });
  window.addEventListener("blur", resetSwipeBackGesture);
}

function categoryFromHash() {
  const match = window.location.hash.match(/^#category=(.+)$/);
  if (!match) return "";

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return "";
  }
}

function bindNavigation() {
  bindReportsFrame();

  document.querySelector("#risk-overview").addEventListener("click", (event) => {
    const row = event.target.closest("[data-category]");
    if (row) showCategoryDetail(row.dataset.category);
  });

  document.querySelector("#category-back").addEventListener("click", backFromCategoryDetail);

  document.querySelector("#category-news-list").addEventListener("click", (event) => {
    const card = event.target.closest("[data-news-theme]");
    if (!card) return;

    showNewsDetail(findNewsByTheme(card.dataset.newsTheme), "category");
  });

  document.querySelector("#headlines-list").addEventListener("click", (event) => {
    const row = event.target.closest("[data-headline-index]");
    if (!row) return;

    const item = briefingData?.top_headlines?.[Number(row.dataset.headlineIndex)];
    showNewsDetail(findFullNews(item), "home");
  });

  document.querySelector("#headlines-list").addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const row = event.target.closest("[data-headline-index]");
    if (!row) return;

    event.preventDefault();
    row.click();
  });

  document.querySelector("#view-all-headlines").addEventListener("click", showTodayHeadlines);
  document.querySelector("#today-headlines-back").addEventListener("click", backFromTodayHeadlines);
  document.querySelector("#news-detail-back").addEventListener("click", backFromNewsDetail);
  document.querySelector("#watchlist-back").addEventListener("click", () => showHome(false));
  document.querySelector("#reports-back").addEventListener("click", () => showHome(false));
  document.querySelector("#view-grc-page").addEventListener("click", () => showGrcPage(true));
  document.querySelector("#grc-page-back").addEventListener("click", backFromGrcPage);
  document.querySelector("#kri-dashboard-back").addEventListener("click", () => showHome(false));
  document.querySelector("#view-kri-dashboard").addEventListener("click", showKriDashboard);
  document.querySelector("#kri-detail-back").addEventListener("click", backFromKriDetail);
  document.querySelector("#nav-home").addEventListener("click", () => showHome(false));
  document.querySelector("#nav-erm").addEventListener("click", showKriDashboard);
  document.querySelector("#nav-grc").addEventListener("click", () => showGrcPage(true));
  document.querySelector("#nav-reports").addEventListener("click", showReports);
  document.querySelector("#nav-watchlist").addEventListener("click", showWatchlist);
  document.querySelector(".desktop-primary-nav").addEventListener("click", (event) => {
    const item = event.target.closest("[data-shell-nav]");
    if (!item) return;

    const actions = {
      home: () => showHome(false),
      erm: showKriDashboard,
      grc: () => showGrcPage(true),
      reports: showReports,
      watchlist: showWatchlist
    };

    actions[item.dataset.shellNav]?.();
  });
  document.querySelector("#watchpoint-list").addEventListener("click", (event) => {
    if (!event.target.closest(".watchpoint-card")) return;

    showWatchlist();
  });
  document.querySelector("#watchpoint-list").addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!event.target.closest(".watchpoint-card")) return;

    event.preventDefault();
    showWatchlist();
  });

  document.querySelector(".grc-view-tabs").addEventListener("click", (event) => {
    const tab = event.target.closest("[role='tab']");
    if (!tab) return;

    const tabById = {
      "grc-tab-categories": "categories",
      "grc-tab-indicators": "indicators",
      "grc-tab-value": "value"
    };
    setGrcActiveTab(tabById[tab.id] || "categories");
  });

  document.querySelector(".grc-view-tabs").addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    const tabs = Array.from(event.currentTarget.querySelectorAll("[role='tab']"));
    const currentIndex = tabs.indexOf(event.target.closest("[role='tab']"));
    if (currentIndex < 0) return;

    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    const tabById = {
      "grc-tab-categories": "categories",
      "grc-tab-indicators": "indicators",
      "grc-tab-value": "value"
    };

    setGrcActiveTab(tabById[nextTab.id] || "categories");
    nextTab.focus();
  });

  document.querySelector("#grc-category-list").addEventListener("click", (event) => {
    const valueLink = event.target.closest("[data-grc-value-open]");
    if (valueLink) {
      openGrcValuePerformance(valueLink.dataset.grcValueOpen);
      return;
    }

    const toggle = event.target.closest("[data-grc-category-toggle]");
    if (!toggle) return;

    const code = toggle.dataset.grcCategoryToggle;
    grcExpandedCategoryCode = grcExpandedCategoryCode === code ? "" : code;
    renderGrcCategoryOverview();
  });

  document.querySelector("#grc-indicator-search").addEventListener("input", (event) => {
    grcSearchQuery = event.target.value;
    renderGrcAllIndicators();
  });

  document.querySelector("#grc-category-filter").addEventListener("change", (event) => {
    grcCategoryFilter = event.target.value;
    renderGrcAllIndicators();
  });

  document.querySelector("#grc-status-filter").addEventListener("change", (event) => {
    grcStatusFilter = event.target.value;
    renderGrcAllIndicators();
  });

  document.querySelector("#grc-value-panel").addEventListener("click", (event) => {
    const selector = event.target.closest("[data-grc-value-type]");
    if (!selector) return;

    grcValuePerformanceType = selector.dataset.grcValueType === "VE" ? "VE" : "VC";
    renderGrcValuePerformance();
  });

  document.querySelector("#watchlist-items").addEventListener("click", (event) => {
    const item = event.target.closest("[data-watchlist-theme]");
    if (!item) return;

    showNewsDetail(findNewsByTheme(item.dataset.watchlistTheme), "watchlist");
  });

  document.querySelector("#watchlist-category-filters").addEventListener("click", (event) => {
    const filter = event.target.closest("[data-watchlist-category-filter]");
    if (!filter) return;

    selectedWatchlistCategory = filter.dataset.watchlistCategoryFilter || "";
    renderWatchlist();
    Array.from(document.querySelectorAll("[data-watchlist-category-filter]"))
      .find((button) => button.dataset.watchlistCategoryFilter === selectedWatchlistCategory)
      ?.focus();
  });

  document.querySelector("#today-headlines-list").addEventListener("click", (event) => {
    const card = event.target.closest("[data-today-index]");
    if (!card) return;

    const item = getTodayHeadlineItems()[Number(card.dataset.todayIndex)];
    showNewsDetail(findFullNews(item), "today");
  });

  document.querySelector("#kri-snapshot-list").addEventListener("click", (event) => {
    const tile = event.target.closest("[data-kri-code]");
    if (!tile) return;

    showKriDetail(tile.dataset.kriCode, "home");
  });

  document.querySelector("#kri-snapshot-list").addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const tile = event.target.closest("[data-kri-code]");
    if (!tile) return;

    event.preventDefault();
    showKriDetail(tile.dataset.kriCode, "home");
  });

  document.querySelector("#kri-overview-list").addEventListener("click", (event) => {
    const row = event.target.closest("[data-kri-code]");
    if (!row) return;

    showKriDetail(row.dataset.kriCode, "kri-dashboard");
  });

  document.querySelector("#kri-overview-list").addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const row = event.target.closest("[data-kri-code]");
    if (!row) return;

    event.preventDefault();
    showKriDetail(row.dataset.kriCode, "kri-dashboard");
  });

  document.querySelector("#kri-risk-matrix").addEventListener("click", (event) => {
    const marker = event.target.closest("[data-kri-code]");
    if (!marker) return;

    showKriDetail(marker.dataset.kriCode, "kri-dashboard");
  });

  document.querySelector("#kri-detail-content").addEventListener("click", (event) => {
    const tab = event.target.closest(".f1-metric-tab");
    if (!tab) return;

    selectF1Metric(tab.dataset.metricKey);
  });

  document.querySelector("#kri-detail-content").addEventListener("keydown", (event) => {
    const tab = event.target.closest(".f1-metric-tab");
    if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    const tabs = [...tab.closest(".f1-metric-tabs").querySelectorAll(".f1-metric-tab")];
    const currentIndex = tabs.indexOf(tab);
    if (currentIndex < 0) return;

    event.preventDefault();
    let nextIndex = currentIndex;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;

    tabs[nextIndex].focus();
    selectF1Metric(tabs[nextIndex].dataset.metricKey);
  });

  window.addEventListener("popstate", () => {
    const category = categoryFromHash();
    if (category) {
      showCategoryDetail(category, false);
    } else if (window.location.hash === "#grc") {
      showGrcPage(false);
    } else {
      showHome(false);
    }
  });

  bindSwipeBackGesture();
}

function renderHeadlines(items) {
  const list = document.querySelector("#headlines-list");

  if (!Array.isArray(items) || items.length === 0) {
    list.innerHTML = '<li class="loading-card">ยังไม่มีประเด็นข่าวสำคัญในขณะนี้</li>';
    return;
  }

  list.innerHTML = items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .slice(0, 3)
    .map(({ item, originalIndex }, index) => {
      const fullItem = findFullNews(item) || item;
      const categoryChips = createCategoryChipRow(fullItem, { compact: true });
      const riskLevel = safeRisk(item.risk_level);

      return `
        <li class="headline-item" data-headline-index="${originalIndex}" tabindex="0" role="button">
          <span class="headline-rank">${String(index + 1).padStart(2, "0")}</span>
          <div class="headline-copy">
            <h3 class="headline-title">${safeText(item.headline_short, "ไม่มีชื่อประเด็นข่าว")}</h3>
            <div class="headline-meta">
              ${categoryChips}
            </div>
          </div>
          <span class="headline-risk text-${className(riskLevel)}">
            Risk: ${riskLevel}
          </span>
          <span class="headline-chevron" aria-hidden="true">→</span>
        </li>
      `;
    })
    .join("");
}

function getHomepageWatchpoints(value) {
  const reportDate = safeText(briefingData?.report_date, "");
  const watchlistItems = Array.isArray(briefingData?.web_watchlist)
    ? briefingData.web_watchlist
    : [];
  const currentWatchpoints = watchlistItems
    .filter((item) => !reportDate || safeText(item.report_date, "") === reportDate)
    .map((item) => {
      const news = findFullNews(item);
      const watchpointContent = { ...(news || {}), ...item };
      const title = getWatchpointTitle(watchpointContent);
      const detail = getWatchpointDetail(watchpointContent, "home");
      const tags = safeText(news?.topic_tags_joined, "")
        .split("|")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 3);

      return {
        category: getPrimaryCategory(item),
        title,
        detail: detail !== title ? detail : "",
        tags,
        riskLevel: VALID_RISK_LEVELS.has(item.risk_level) ? item.risk_level : "",
        reportDate: safeText(item.report_date, "")
      };
    })
    .filter((item) => item.title);

  if (currentWatchpoints.length > 0) return currentWatchpoints;

  return [
    {
      category: "",
      title: safeText(
        value,
        "ยังไม่มีประเด็นเฝ้าระวังเพิ่มเติมสำหรับวันนี้"
      ),
      detail: "",
      tags: [],
      riskLevel: "",
      reportDate: ""
    }
  ];
}

function renderWatchpoint(value) {
  const watchpointList = document.querySelector("#watchpoint-list");
  const watchpoints = getHomepageWatchpoints(value);

  watchpointList.innerHTML = watchpoints
    .map((item, index) => {
      const category = item.category || "Watchpoint Today";
      const meta = getCategoryMeta(category);
      const tags = item.tags.length
        ? `<div class="watchpoint-tags" aria-label="ประเด็นที่เกี่ยวข้อง">
            ${item.tags
              .map((tag) => `<span class="watchpoint-tag">${escapeHtml(tag)}</span>`)
              .join("")}
          </div>`
        : "";
      const updated = item.reportDate
        ? `<time class="watchpoint-updated" datetime="${escapeHtml(item.reportDate)}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5"></circle>
              <path d="M12 7.5V12l3 2"></path>
            </svg>
            <span>อัปเดต ${escapeHtml(formatThaiDate(item.reportDate))}</span>
          </time>`
        : "";

      return `
        <article
          class="watchpoint-card"
          role="button"
          tabindex="0"
          aria-label="เปิด Watchlist: ${escapeHtml(item.title)}"
          style="--watchpoint-category-color:${meta.color};--watchpoint-category-bg:${meta.background};--watchpoint-category-border:${meta.border}"
        >
          <span class="watchpoint-rank" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
          <div class="watchpoint-identity">
            ${createCategoryIcon(category)}
            <div class="watchpoint-identity-copy">
              ${
                item.riskLevel
                  ? `<span class="risk-badge risk-${className(item.riskLevel)}">${escapeHtml(item.riskLevel)}</span>`
                  : ""
              }
              <span class="watchpoint-category">${escapeHtml(category)}</span>
            </div>
          </div>
          <div class="watchpoint-copy">
            <h3 class="watchpoint-title">${escapeHtml(item.title)}</h3>
            ${
              item.detail
                ? `<p${index === 0 ? ' id="watchpoint-text"' : ' class="watchpoint-text"'}>${escapeHtml(item.detail)}</p>`
                : ""
            }
            ${tags}
          </div>
          ${updated}
          <span class="watchpoint-chevron" aria-hidden="true">→</span>
        </article>
      `;
    })
    .join("");
}

const KRI_RISK_COLOR_MAP = {
  green: "#00B050",
  yellow: "#EAB308",
  orange: "#ED7D31",
  red: "#C00000",
  low: "#00B050",
  medium: "#EAB308",
  high: "#ED7D31",
  very_high: "#C00000",
  extreme: "#C00000"
};

const KRI_RISK_LEVEL_META = {
  low: {
    label: "Low",
    accent: "#3F7C68",
    background: "rgba(63, 124, 104, 0.1)",
    border: "rgba(63, 124, 104, 0.3)",
    matrix: "#3F7C68"
  },
  medium: {
    label: "Medium",
    accent: "#B7831D",
    background: "rgba(210, 164, 59, 0.12)",
    border: "rgba(183, 131, 29, 0.3)",
    matrix: "#D2A43B"
  },
  high: {
    label: "High",
    accent: "#B9562D",
    background: "rgba(204, 106, 55, 0.11)",
    border: "rgba(185, 86, 45, 0.3)",
    matrix: "#CC6A37"
  },
  extreme: {
    label: "Extreme",
    accent: "#95263D",
    background: "rgba(168, 50, 72, 0.1)",
    border: "rgba(149, 38, 61, 0.3)",
    matrix: "#A83248"
  }
};

const KRI_RISK_LEVEL_DESCRIPTIONS = {
  low: "ความเสี่ยงอยู่ในระดับต่ำ",
  medium: "ความเสี่ยงอยู่ในระดับปานกลาง",
  high: "ความเสี่ยงอยู่ในระดับสูง",
  extreme: "ความเสี่ยงอยู่ในระดับสูงมาก"
};

const KRI_HOME_ORDER = [
  "S1",
  "S2",
  "S3",
  "F1",
  "F2",
  "O1",
  "O2",
  "O3",
  "O4",
  "O5"
];

const KRI_PERFORMANCE_ORDER = [
  "appetite",
  "tolerance",
  "in_progress",
  "pending_confirmation",
  "not_meet_ra",
  "not_meet"
];

const KRI_PERFORMANCE_COPY = {
  appetite: {
    label: "Risk Appetite",
    summary: "บรรลุเป้าหมาย Risk Appetite",
    insight: "จำนวนที่บรรลุ Risk Appetite"
  },
  tolerance: {
    label: "Risk Tolerance",
    summary: "บรรลุเป้าหมาย Risk Tolerance",
    insight: "จำนวนที่อยู่ใน Risk Tolerance"
  },
  in_progress: {
    label: "On Track",
    summary: "ดำเนินงานได้ตามแผน",
    insight: "จำนวนที่ดำเนินงานได้ตามแผน"
  },
  pending_confirmation: {
    label: "Pending Confirmation",
    summary: "อยู่ระหว่างตรวจสอบ/ยืนยันผล",
    insight: "จำนวนที่อยู่ระหว่างตรวจสอบหรือยืนยันผล"
  },
  not_meet_ra: {
    label: "Not Meet RA",
    summary: "คาดว่าไม่บรรลุ RA แต่สถานะ RT รอการยืนยัน",
    insight: "จำนวนที่คาดว่าไม่บรรลุ RA และรอยืนยัน RT"
  },
  not_meet: {
    label: "Not Meet",
    summary: "ไม่บรรลุเป้าหมาย RA / RT",
    insight: "จำนวนที่ไม่บรรลุ RA / RT"
  }
};

function safeHexColor(value) {
  const color = safeText(value, "").trim();
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  if (/^[0-9a-f]{6}$/i.test(color)) return `#${color}`;
  return "";
}

function hexToRgba(hex, alpha) {
  const normalized = safeHexColor(hex);
  if (!normalized) return `rgba(102, 51, 163, ${alpha})`;

  const value = normalized.slice(1);
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getKriRiskColor(item) {
  const hexColor = safeHexColor(item.color_hex);
  if (hexColor) return hexColor;

  const riskColor = safeText(item.risk_color, "").toLowerCase();
  return KRI_RISK_COLOR_MAP[riskColor] || "#6633A3";
}

function getKriRiskColorByName(riskColor) {
  const normalized = safeText(riskColor, "").toLowerCase();
  return KRI_RISK_COLOR_MAP[normalized] || "#6633A3";
}

function normalizeKriRiskKey(value) {
  const raw = safeText(value, "").trim();
  const thaiMap = {
    "ต่ำ": "low",
    "ปานกลาง": "medium",
    "สูง": "high",
    "สูงมาก": "extreme"
  };
  if (thaiMap[raw]) return thaiMap[raw];

  const key = raw.toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  const keyMap = {
    green: "low",
    yellow: "medium",
    orange: "high",
    red: "extreme",
    very_high: "extreme",
    extreme: "extreme",
    low: "low",
    medium: "medium",
    high: "high"
  };
  return keyMap[key] || "";
}

function inferKriRiskKeyFromColor(color) {
  const normalized = safeHexColor(color).toUpperCase();
  if (!normalized) return "";

  if (["#00B050", "#16A34A", "#1F9D74", "#42B883"].includes(normalized)) return "low";
  if (["#FFFF00", "#FFF200", "#FFD966", "#F2C94C", "#EAB308", "#D97706"].includes(normalized)) return "medium";
  if (["#ED7D31", "#F97316", "#F58220", "#DF6A3E"].includes(normalized)) return "high";
  if (["#C00000", "#DC2626", "#C53B51", "#F95F67"].includes(normalized)) return "extreme";
  return "";
}

function getKriRiskKey(item) {
  return (
    normalizeKriRiskKey(item.risk_zone) ||
    normalizeKriRiskKey(item.risk_label) ||
    normalizeKriRiskKey(item.risk_color) ||
    inferKriRiskKeyFromColor(item.color_hex) ||
    "medium"
  );
}

function getKriRiskLevelMeta(item) {
  return KRI_RISK_LEVEL_META[getKriRiskKey(item)] || KRI_RISK_LEVEL_META.medium;
}

function normalizeKriRiskVisualColor(color) {
  const normalized = safeHexColor(color).toUpperCase();
  if (!normalized) return "#6633A3";

  if (["#FFFF00", "#FFF200", "#FFD966", "#F2C94C"].includes(normalized)) {
    return "#EAB308";
  }

  return normalized;
}

function getKriRiskVisual(item) {
  const accent = normalizeKriRiskVisualColor(getKriRiskColor(item));
  return {
    accent,
    background: hexToRgba(accent, 0.075),
    border: hexToRgba(accent, 0.3),
    marker: hexToRgba(accent, 0.72)
  };
}

function getKriRiskVisualFromFields(colorHex, riskColor) {
  const key =
    normalizeKriRiskKey(riskColor) ||
    inferKriRiskKeyFromColor(colorHex) ||
    "medium";
  const meta = KRI_RISK_LEVEL_META[key] || KRI_RISK_LEVEL_META.medium;

  return {
    accent: meta.accent,
    background: meta.matrix,
    border: meta.border,
    marker: hexToRgba(meta.accent, 0.72)
  };
}

function getKriRiskKeyFromFields(colorHex, riskColor) {
  return (
    normalizeKriRiskKey(riskColor) ||
    inferKriRiskKeyFromColor(colorHex) ||
    "medium"
  );
}

function normalizePerformanceLevel(value) {
  const level = safeText(value, "in_progress").toLowerCase();
  return KRI_PERFORMANCE_ORDER.includes(level)
    ? level
    : "in_progress";
}

function kriPerformanceIcon(level) {
  if (level === "appetite") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 18.5 6v5.2c0 4.1-2.6 7.8-6.5 9.3-3.9-1.5-6.5-5.2-6.5-9.3V6L12 3.5Z"></path><path d="m9.2 12 1.8 1.8 3.9-4.2"></path></svg>';
  }

  if (level === "tolerance") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 18.5 6v5.2c0 4.1-2.6 7.8-6.5 9.3-3.9-1.5-6.5-5.2-6.5-9.3V6L12 3.5Z"></path><path d="M12 7.2 15.6 8.6v2.9c0 2.1-1.4 4.2-3.6 5.2-2.2-1-3.6-3.1-3.6-5.2V8.6L12 7.2Z"></path></svg>';
  }

  if (level === "pending_confirmation") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10M7 21h10"></path><path d="M8 3c0 4 1.5 6 4 9-2.5 3-4 5-4 9M16 3c0 4-1.5 6-4 9 2.5 3 4 5 4 9"></path></svg>';
  }

  if (level === "not_meet_ra") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 18.5 6v5.2c0 4.1-2.6 7.8-6.5 9.3-3.9-1.5-6.5-5.2-6.5-9.3V6L12 3.5Z"></path><path d="M12 8v5M12 16.5h.01"></path></svg>';
  }

  if (level === "not_meet") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 10 18H2L12 3Z"></path><path d="M12 9v4M12 17h.01"></path></svg>';
  }

  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>';
}

function getCompactPerformanceLabel(level, fallbackLabel) {
  return KRI_PERFORMANCE_COPY[level]?.label || safeText(fallbackLabel, "On Track");
}

function getThaiPerformanceLabel(level, fallbackLabel) {
  return safeText(
    fallbackLabel,
    KRI_PERFORMANCE_COPY[level]?.summary || "ไม่ระบุ"
  );
}

function getKriItemPerformanceLabel(item) {
  const level = normalizePerformanceLevel(item?.performance_level);
  return getThaiPerformanceLabel(level, item?.performance_label);
}

function getKriItems() {
  return Array.isArray(briefingData?.kri?.items) ? briefingData.kri.items : [];
}

function normalizeKriCode(value) {
  return String(value ?? "").trim().toUpperCase();
}

function getKriItemByCode(kriCode) {
  const code = normalizeKriCode(kriCode);
  if (!code) return null;

  return getKriItems().find((item) => normalizeKriCode(item.kri_code) === code) || null;
}

function getKriActionsForItem(item) {
  if (!item) return [];

  if (Array.isArray(item.actions) && item.actions.length > 0) {
    return item.actions;
  }

  const code = normalizeKriCode(item.kri_code);
  const actions = Array.isArray(briefingData?.kri?.actions) ? briefingData.kri.actions : [];

  return actions.filter((action) => normalizeKriCode(action.kri_code) === code);
}

function getGroupedKriActions(item) {
  return getKriActionsForItem(item)
    .filter((action) => safeText(action?.action_text, ""))
    .sort((a, b) => Number(a.display_order || 999) - Number(b.display_order || 999))
    .reduce((groups, action) => {
      const actionType = safeText(action.action_type, "Other");
      if (!groups[actionType]) groups[actionType] = [];
      groups[actionType].push(action);
      return groups;
    }, {});
}

function getKriRiskMatrix() {
  return Array.isArray(briefingData?.kri?.risk_matrix)
    ? briefingData.kri.risk_matrix
    : [];
}

function getKriHomeOrderedItems() {
  const items = getKriItems();
  const usedItems = new Set();
  const itemByCode = items.reduce((lookup, item) => {
    const code = safeText(item.kri_code, "").toUpperCase();
    if (code && !lookup[code]) lookup[code] = item;
    return lookup;
  }, {});

  const orderedItems = KRI_HOME_ORDER
    .map((code) => {
      const item = itemByCode[code];
      if (item) usedItems.add(item);
      return item;
    })
    .filter(Boolean);

  const remainingItems = items.filter((item) => !usedItems.has(item));
  return [...orderedItems, ...remainingItems];
}

function getKriSnapshotItems() {
  const items = Array.isArray(briefingData?.kri?.items)
    ? briefingData.kri.items
    : [];

  const itemByCode = items.reduce((lookup, item) => {
    const code = safeText(item.kri_code, "").toUpperCase();
    if (code && !lookup[code]) lookup[code] = item;
    return lookup;
  }, {});

  const orderedItems = KRI_HOME_ORDER
    .map((code) => itemByCode[code])
    .filter(Boolean);

  if (orderedItems.length > 0) return orderedItems;

  return items;
}

function getKriUpdateTimestamp(value) {
  if (value === null || value === undefined || value === "") return NaN;

  const numericValue = typeof value === "number" ? value : Number(String(value).trim());
  if (Number.isFinite(numericValue) && numericValue > 20000) {
    return Date.UTC(1899, 11, 30) + numericValue * 86400000;
  }

  const parsed = new Date(String(value).trim());
  return Number.isNaN(parsed.getTime()) ? NaN : parsed.getTime();
}

function getLatestKriUpdateValue(items) {
  return items.reduce(
    (latest, item) => {
      const value = item?.last_update;
      const timestamp = getKriUpdateTimestamp(value);
      return Number.isFinite(timestamp) && timestamp > latest.timestamp
        ? { value, timestamp }
        : latest;
    },
    { value: "", timestamp: -Infinity }
  ).value;
}

function getKriPerformanceCounts(items) {
  return items.reduce(
    (counts, item) => {
      const level = normalizePerformanceLevel(item.performance_level);
      counts[level] += 1;
      return counts;
    },
    {
      appetite: 0,
      tolerance: 0,
      in_progress: 0,
      pending_confirmation: 0,
      not_meet_ra: 0,
      not_meet: 0
    }
  );
}

function formatKriLastUpdate(value) {
  if (value === null || value === undefined || value === "") return "ไม่ระบุ";

  const numericValue = typeof value === "number" ? value : Number(String(value).trim());
  if (Number.isFinite(numericValue) && numericValue > 20000) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const parsed = new Date(excelEpoch + numericValue * 86400000);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }
  }

  const stringValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) {
    return formatThaiDate(stringValue.slice(0, 10));
  }

  const parsed = new Date(stringValue);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  return stringValue || "ไม่ระบุ";
}

function getKriTrendMeta(value) {
  const trend = safeText(value, "unknown").toLowerCase();
  const trendMap = {
    improving: { label: "Improving", icon: "↑", className: "improving" },
    stable: { label: "Stable", icon: "→", className: "stable" },
    worsening: { label: "Worsening", icon: "↓", className: "worsening" },
    unknown: { label: "Unknown", icon: "–", className: "unknown" }
  };
  return trendMap[trend] || trendMap.unknown;
}

function getKriRiskLevelLabel(item) {
  return getKriRiskLevelMeta(item).label;
}

function formatNumberedText(value, fallback) {
  const text = safeText(value, fallback);
  return escapeHtml(text)
    .replace(/\s+(?=\d+\.\s)/g, "<br>")
    .replace(/\s+(?=\d+\)\s)/g, "<br>")
    .replace(/\s+(?=-\s)/g, "<br>");
}

function toMetricNumber(value) {
  if (value === null || value === undefined || value === "") return NaN;
  const number = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(number) ? number : NaN;
}

function formatMetricValue(value, unit = "") {
  const number = toMetricNumber(value);
  if (!Number.isFinite(number)) return "ไม่ระบุ";

  const decimals = Math.abs(number) >= 100 ? 2 : 2;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(number);
}

function formatMetricValueWithUnit(value, unit = "") {
  const formattedValue = formatMetricValue(value);
  const cleanUnit = safeText(unit, "");
  if (!cleanUnit || formattedValue === "ไม่ระบุ") return escapeHtml(formattedValue);

  const escapedValue = escapeHtml(formattedValue);
  const escapedUnit = escapeHtml(cleanUnit);
  const spacer = cleanUnit === "%" ? "" : " ";
  return `<span class="financial-metric-value-number">${escapedValue}</span>${spacer}<span class="financial-metric-value-unit">${escapedUnit}</span>`;
}

function getMetricStatusDisplay(metric) {
  const rawStatus = safeText(metric.status, "").toLowerCase();
  const status = KRI_PERFORMANCE_ORDER.includes(rawStatus)
    ? rawStatus
    : "unknown";
  const fallback =
    status === "unknown"
      ? { label: "Unknown", summary: "ไม่ระบุ" }
      : KRI_PERFORMANCE_COPY[status] || KRI_PERFORMANCE_COPY.in_progress;
  return {
    status,
    label: safeText(metric.status_label, fallback.label),
    labelTh: safeText(metric.status_label_th, fallback.summary)
  };
}

function getMetricChartScale(metric) {
  const actual = toMetricNumber(metric.actual_value);
  const appetite = toMetricNumber(metric.risk_appetite_value);
  const tolerance = toMetricNumber(metric.risk_tolerance_value);
  const values = [actual, appetite, tolerance].filter(Number.isFinite);
  if (values.length < 3) return null;

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const range = rawMax - rawMin || Math.max(Math.abs(rawMax), 1);
  const min = Math.max(0, rawMin - range * 0.35);
  const max = rawMax + range * 0.35;
  const span = max - min || 1;
  const pct = (value) => Math.max(0, Math.min(100, ((value - min) / span) * 100));

  return {
    actual,
    appetite,
    tolerance,
    min,
    max,
    actualPct: pct(actual),
    appetitePct: pct(appetite),
    tolerancePct: pct(tolerance)
  };
}

function getMetricIcon(metricKey) {
  const key = safeText(metricKey, "").toLowerCase();
  if (key.includes("revenue")) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9"></path><path d="M10 19V5"></path><path d="M16 19v-7"></path><path d="M21 19H3"></path><path d="m14 7 3-3 3 3"></path></svg>';
  }
  if (key.includes("ebitda") || key.includes("margin")) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v9h9"></path><path d="M19.1 16.7A8 8 0 1 1 7.3 4.9"></path><path d="M7 17 17 7"></path></svg>';
  }
  if (key.includes("cost")) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5 5 19"></path><circle cx="7.5" cy="7.5" r="2.5"></circle><circle cx="16.5" cy="16.5" r="2.5"></circle></svg>';
  }
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16"></path><path d="M6 16l4-4 3 3 5-7"></path><path d="M18 8h-4"></path><path d="M18 8v4"></path></svg>';
}

function renderFinancialMetricChart(metric) {
  const scale = getMetricChartScale(metric);
  if (!scale) {
    return '<div class="financial-chart-empty">ไม่พบข้อมูลกราฟ</div>';
  }

  const direction = safeText(metric.direction, "higher_is_better");
  const lowerIsBetter = direction === "lower_is_better";
  const first = lowerIsBetter ? scale.appetitePct : scale.tolerancePct;
  const second = lowerIsBetter ? scale.tolerancePct : scale.appetitePct;
  const thresholdDistance = Math.abs(scale.appetitePct - scale.tolerancePct);
  const closeThresholdClass = thresholdDistance < 18 ? " financial-threshold-chart-close" : "";
  const unit = safeText(metric.unit, "");
  const ariaUnit = unit === "%" ? "%" : unit ? ` ${unit}` : "";
  const segments = [
    {
      className: lowerIsBetter ? "zone-appetite" : "zone-not-meet",
      label: lowerIsBetter ? "Appetite" : "Not Meet",
      width: Math.max(first, 0)
    },
    {
      className: "zone-tolerance",
      label: "Tolerance",
      width: Math.max(second - first, 0)
    },
    {
      className: lowerIsBetter ? "zone-not-meet" : "zone-appetite",
      label: lowerIsBetter ? "Not Meet" : "Appetite",
      width: Math.max(100 - second, 0)
    }
  ];

  return `
    <div class="financial-threshold-chart${closeThresholdClass}" role="img" aria-label="Actual ${escapeHtml(formatMetricValue(scale.actual))}${escapeHtml(ariaUnit)}, Risk Appetite ${escapeHtml(formatMetricValue(scale.appetite))}${escapeHtml(ariaUnit)}, Risk Tolerance ${escapeHtml(formatMetricValue(scale.tolerance))}${escapeHtml(ariaUnit)}">
      <div class="financial-threshold-labels" aria-hidden="true">
        <span class="financial-threshold-label financial-threshold-label-rt" style="left:${scale.tolerancePct}%">RT ${escapeHtml(formatMetricValue(scale.tolerance))}</span>
        <span class="financial-threshold-label financial-threshold-label-ra" style="left:${scale.appetitePct}%">RA ${escapeHtml(formatMetricValue(scale.appetite))}</span>
      </div>
      <div class="financial-threshold-rail">
        <div class="financial-threshold-bar" aria-hidden="true">
          ${segments
            .map(
              (segment) =>
                `<span class="${segment.className}" style="width:${segment.width}%"><small>${segment.width >= 16 ? segment.label : ""}</small></span>`
            )
            .join("")}
        </div>
        <span class="financial-threshold-guide financial-threshold-guide-rt" style="left:${scale.tolerancePct}%" aria-hidden="true"></span>
        <span class="financial-threshold-guide financial-threshold-guide-ra" style="left:${scale.appetitePct}%" aria-hidden="true"></span>
        <span class="financial-actual-marker" style="left:${scale.actualPct}%" aria-hidden="true"><i></i></span>
      </div>
      <div class="financial-actual-labels" aria-hidden="true">
        <span class="financial-actual-label" style="left:${scale.actualPct}%">Actual ${escapeHtml(formatMetricValue(scale.actual))}</span>
      </div>
    </div>
  `;
}

function renderFinancialMetricRow(metric, index) {
  const status = getMetricStatusDisplay(metric);
  const unit = safeText(metric.unit, "");
  const direction = safeText(metric.direction, "higher_is_better");
  const directionCopy =
    direction === "lower_is_better"
      ? { icon: "↓", label: "Lower is better" }
      : { icon: "↑", label: "Higher is better" };
  return `
    <article class="financial-metric-row">
      <div class="financial-metric-heading">
        <span class="financial-metric-icon">${getMetricIcon(metric.metric_key)}</span>
        <div>
          <span class="financial-metric-index">Metric ${String(index + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(safeText(metric.metric_name, "Metric"))}</h3>
        </div>
      </div>
      <span class="financial-direction financial-direction-${direction}">
        <b aria-hidden="true">${directionCopy.icon}</b>${directionCopy.label}
      </span>
      <div class="financial-metric-visual">
        ${renderFinancialMetricChart(metric)}
      </div>
      <div class="financial-metric-values">
        <div class="financial-value financial-value-actual">
          <span>Actual</span>
          <strong>${formatMetricValueWithUnit(metric.actual_value, unit)}</strong>
        </div>
        <div class="financial-value financial-value-ra">
          <span>Risk Appetite (RA)</span>
          <strong>${formatMetricValueWithUnit(metric.risk_appetite_value, unit)}</strong>
        </div>
        <div class="financial-value financial-value-rt">
          <span>Risk Tolerance (RT)</span>
          <strong>${formatMetricValueWithUnit(metric.risk_tolerance_value, unit)}</strong>
        </div>
        <div class="financial-status financial-status-${status.status}">
          <strong>${escapeHtml(status.label)}</strong>
          <span>${escapeHtml(status.labelTh)}</span>
        </div>
      </div>
    </article>
  `;
}

function getSortedFinancialMetrics(item) {
  const metrics = Array.isArray(item?.metrics) ? item.metrics : [];
  return [...metrics].sort(
    (a, b) => Number(a.display_order || 999) - Number(b.display_order || 999)
  );
}

function getF1MetricByKey(item, metricKey) {
  const metrics = getSortedFinancialMetrics(item);
  const key = safeText(metricKey, "");
  return metrics.find((metric) => safeText(metric.metric_key, "") === key) || metrics[0] || null;
}

function getF1ThresholdMarkerLanes(scale) {
  const lanes = { appetite: 0, tolerance: 0 };
  const thresholdDistance = Math.abs(scale.appetitePct - scale.tolerancePct);
  if (thresholdDistance >= 16) return lanes;

  const appetiteIsLeft = scale.appetitePct <= scale.tolerancePct;
  lanes[appetiteIsLeft ? "tolerance" : "appetite"] = 1;
  return lanes;
}

function renderF1ThresholdRail(metric) {
  const scale = getMetricChartScale(metric);
  if (!scale) {
    return '<div class="f1-metric-empty">ไม่พบข้อมูล Actual, RA และ RT ที่เพียงพอ</div>';
  }

  const lowerIsBetter = safeText(metric.direction, "higher_is_better") === "lower_is_better";
  const firstThreshold = lowerIsBetter ? scale.appetitePct : scale.tolerancePct;
  const secondThreshold = lowerIsBetter ? scale.tolerancePct : scale.appetitePct;
  const first = Math.max(0, Math.min(firstThreshold, secondThreshold));
  const second = Math.min(100, Math.max(firstThreshold, secondThreshold));
  const markerLanes = getF1ThresholdMarkerLanes(scale);
  const unit = safeText(metric.unit, "");
  const ariaUnit = unit === "%" ? "%" : unit ? ` ${unit}` : "";
  const zones = lowerIsBetter
    ? [
        { className: "f1-zone-appetite", label: "อยู่ในเกณฑ์ที่ยอมรับได้", width: first },
        { className: "f1-zone-tolerance", label: "ต้องเฝ้าระวัง", width: second - first },
        { className: "f1-zone-not-meet", label: "ไม่เป็นไปตามเป้าหมาย", width: 100 - second }
      ]
    : [
        { className: "f1-zone-not-meet", label: "ไม่เป็นไปตามเป้าหมาย", width: first },
        { className: "f1-zone-tolerance", label: "ต้องเฝ้าระวัง", width: second - first },
        { className: "f1-zone-appetite", label: "อยู่ในเกณฑ์ที่ยอมรับได้", width: 100 - second }
      ];

  return `
    <div class="f1-threshold-scroll">
      <div class="f1-threshold-chart" role="img" aria-label="Actual ${escapeHtml(formatMetricValue(scale.actual))}${escapeHtml(ariaUnit)}, Risk Appetite ${escapeHtml(formatMetricValue(scale.appetite))}${escapeHtml(ariaUnit)}, Risk Tolerance ${escapeHtml(formatMetricValue(scale.tolerance))}${escapeHtml(ariaUnit)}">
        <div class="f1-actual-marker" style="--marker-position:${scale.actualPct}%" aria-hidden="true">
          <span>Actual</span>
          <strong>${escapeHtml(formatMetricValue(scale.actual))}</strong>
          <i></i>
        </div>
        <div class="f1-threshold-rail" aria-hidden="true">
          <div class="f1-threshold-zones">
            ${zones
              .map(
                (zone) => `
                  <span class="${zone.className}" style="width:${zone.width}%">
                    <small>${zone.width >= 18 ? zone.label : ""}</small>
                  </span>
                `
              )
              .join("")}
          </div>
          <span class="f1-threshold-guide f1-threshold-guide-ra" style="--marker-position:${scale.appetitePct}%"></span>
          <span class="f1-threshold-guide f1-threshold-guide-rt" style="--marker-position:${scale.tolerancePct}%"></span>
        </div>
        <div class="f1-threshold-labels" aria-hidden="true">
          <span class="f1-threshold-label f1-threshold-label-ra f1-threshold-lane-${markerLanes.appetite}" style="--marker-position:${scale.appetitePct}%">
            <b>RA</b><strong>${escapeHtml(formatMetricValue(scale.appetite))}</strong>
          </span>
          <span class="f1-threshold-label f1-threshold-label-rt f1-threshold-lane-${markerLanes.tolerance}" style="--marker-position:${scale.tolerancePct}%">
            <b>RT</b><strong>${escapeHtml(formatMetricValue(scale.tolerance))}</strong>
          </span>
        </div>
      </div>
    </div>
  `;
}

function renderF1MetricValuePanel(metric, item) {
  const status = getMetricStatusDisplay(metric);
  const unit = safeText(metric.unit, "ไม่ระบุ");
  const owner = safeText(item.risk_owner, "ไม่ระบุ");
  const lastUpdate = formatKriLastUpdate(item.last_update);

  return `
    <aside class="f1-metric-value-panel" aria-label="ค่าตัวชี้วัด ${escapeHtml(safeText(metric.metric_name, "Metric"))}">
      <div class="f1-value-actual">
        <span>Actual</span>
        <strong>${formatMetricValueWithUnit(metric.actual_value, unit)}</strong>
        <small>${escapeHtml(lastUpdate)}</small>
      </div>
      <div class="f1-value-thresholds">
        <div class="f1-value-row f1-value-row-ra">
          <span><i></i>Risk Appetite (RA)</span>
          <strong>${formatMetricValueWithUnit(metric.risk_appetite_value, unit)}</strong>
        </div>
        <div class="f1-value-row f1-value-row-rt">
          <span><i></i>Risk Tolerance (RT)</span>
          <strong>${formatMetricValueWithUnit(metric.risk_tolerance_value, unit)}</strong>
        </div>
      </div>
      <dl class="f1-value-meta">
        <div><dt>หน่วยวัด</dt><dd>${escapeHtml(unit)}</dd></div>
        <div><dt>เจ้าของข้อมูล</dt><dd>${escapeHtml(owner)}</dd></div>
      </dl>
      <div class="f1-metric-status f1-metric-status-${status.status}">
        <strong>${escapeHtml(status.label)}</strong>
        <span>${escapeHtml(status.labelTh)}</span>
      </div>
    </aside>
  `;
}

function renderF1MetricStatusStrip(metric, item) {
  const performanceLevel = normalizePerformanceLevel(item.performance_level);
  const performanceCategory = getCompactPerformanceLabel(performanceLevel, item.performance_label);
  const performanceLabel = getKriItemPerformanceLabel(item);
  const trend = getKriTrendMeta(item.trend);
  const lowerIsBetter = safeText(metric.direction, "higher_is_better") === "lower_is_better";
  const comparisonCopy = lowerIsBetter
    ? "ค่าที่ต่ำกว่าสะท้อนผลการดำเนินงานที่ดีกว่า"
    : "ค่าที่สูงกว่าสะท้อนผลการดำเนินงานที่ดีกว่า";

  return `
    <div class="f1-metric-status-strip">
      <div class="f1-status-primary kri-performance-${performanceLevel}">
        <span class="kri-performance-icon" aria-hidden="true">${kriPerformanceIcon(performanceLevel)}</span>
        <div><strong>${escapeHtml(performanceCategory)}</strong><span>${escapeHtml(performanceLabel)}</span></div>
      </div>
      <p>${escapeHtml(safeText(metric.metric_name, "ตัวชี้วัด"))}: ${escapeHtml(comparisonCopy)}</p>
      <div class="f1-status-meta f1-status-trend kri-trend-${trend.className}">
        <span>แนวโน้ม</span><strong>${escapeHtml(trend.label)}</strong>
      </div>
      <div class="f1-status-meta">
        <span>อัปเดตล่าสุด</span><strong>${escapeHtml(formatKriLastUpdate(item.last_update))}</strong>
      </div>
    </div>
  `;
}

function renderF1MetricWorkspace(metric, item) {
  if (!metric) return '<div class="f1-metric-empty">ไม่พบข้อมูลตัวชี้วัด</div>';

  const direction = safeText(metric.direction, "higher_is_better");
  const lowerIsBetter = direction === "lower_is_better";
  const directionLabel = lowerIsBetter ? "Lower is Better" : "Higher is Better";
  const directionIcon = lowerIsBetter ? "↘" : "↗";
  const unit = safeText(metric.unit, "");

  return `
    <div class="f1-metric-workspace-grid">
      <article class="f1-metric-visual-card">
        <div class="f1-metric-visual-heading">
          <div>
            <h3>${escapeHtml(safeText(metric.metric_name, "Metric"))}</h3>
            ${unit ? `<p>หน่วย: ${escapeHtml(unit)}</p>` : ""}
          </div>
          <span class="f1-direction-badge f1-direction-${direction}"><b aria-hidden="true">${directionIcon}</b>${directionLabel}</span>
        </div>
        ${renderF1ThresholdRail(metric)}
      </article>
      ${renderF1MetricValuePanel(metric, item)}
    </div>
    ${renderF1MetricStatusStrip(metric, item)}
  `;
}

function renderF1MetricSelector(item) {
  const metrics = getSortedFinancialMetrics(item);
  if (metrics.length === 0) return "";

  const selectedMetric = getF1MetricByKey(item, selectedF1MetricKey);
  selectedF1MetricKey = safeText(selectedMetric?.metric_key, safeText(metrics[0]?.metric_key, ""));
  const direction = safeText(selectedMetric?.direction, "higher_is_better");
  const lowerIsBetter = direction === "lower_is_better";

  return `
    <section class="kri-detail-card financial-threshold-card f1-metric-card" aria-labelledby="financial-threshold-heading">
      <div class="f1-metric-card-header">
        <div>
          <h2 id="financial-threshold-heading">ตัวชี้วัดและผลการดำเนินงาน</h2>
          <p>เลือกตัวชี้วัดเพื่อดูผลจริง เปรียบเทียบค่าเป้าหมาย และตรวจสอบทิศทางการประเมิน</p>
        </div>
        <span class="f1-card-direction f1-direction-${direction}"><b aria-hidden="true">${lowerIsBetter ? "↘" : "↗"}</b>${lowerIsBetter ? "Lower is Better" : "Higher is Better"}</span>
      </div>
      <div class="f1-metric-tabs" role="tablist" aria-label="เลือกตัวชี้วัด F1">
        ${metrics
          .map((metric, index) => {
            const metricKey = safeText(metric.metric_key, `metric-${index + 1}`);
            const safeId = metricKey.replace(/[^a-z0-9_-]/gi, "-");
            const isSelected = metricKey === selectedF1MetricKey;
            return `
              <button class="f1-metric-tab${isSelected ? " is-selected" : ""}" type="button" role="tab" id="f1-metric-tab-${safeId}" aria-selected="${isSelected}" aria-controls="f1-metric-panel" tabindex="${isSelected ? "0" : "-1"}" data-metric-key="${escapeHtml(metricKey)}">
                <span>${index + 1}</span>
                <strong>${escapeHtml(safeText(metric.metric_name, `Metric ${index + 1}`))}</strong>
                <small>${escapeHtml(safeText(metric.unit, ""))}</small>
                <i aria-hidden="true">${getMetricIcon(metricKey)}</i>
              </button>
            `;
          })
          .join("")}
      </div>
      <div id="f1-metric-panel" class="f1-metric-workspace" role="tabpanel" aria-live="polite">
        ${renderF1MetricWorkspace(selectedMetric, item)}
      </div>
    </section>
  `;
}

function selectF1Metric(metricKey) {
  const item = getKriItemByCode("F1");
  const metric = getF1MetricByKey(item, metricKey);
  const workspace = document.querySelector("#f1-metric-panel");
  if (!item || !metric || !workspace) return;

  selectedF1MetricKey = safeText(metric.metric_key, "");
  document.querySelectorAll(".f1-metric-tab").forEach((tab) => {
    const isSelected = tab.dataset.metricKey === selectedF1MetricKey;
    tab.classList.toggle("is-selected", isSelected);
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
  });

  workspace.innerHTML = renderF1MetricWorkspace(metric, item);

  const direction = safeText(metric.direction, "higher_is_better");
  const cardDirection = document.querySelector(".f1-card-direction");
  if (cardDirection) {
    cardDirection.className = `f1-card-direction f1-direction-${direction}`;
    cardDirection.innerHTML = `<b aria-hidden="true">${direction === "lower_is_better" ? "↘" : "↗"}</b>${direction === "lower_is_better" ? "Lower is Better" : "Higher is Better"}`;
  }
}

function renderFinancialThresholdCard(item) {
  const code = normalizeKriCode(item.kri_code);
  const metrics = getSortedFinancialMetrics(item);
  if (metrics.length === 0) return "";

  if (code === "F1") return renderF1MetricSelector(item);

  return `
    <section class="kri-detail-card financial-threshold-card" aria-labelledby="financial-threshold-heading">
      <div class="financial-threshold-header">
        <div>
          <p class="section-kicker">ACTUAL / RA / RT</p>
          <h2 id="financial-threshold-heading">ค่าตัวชี้วัดเทียบกับค่าเป้าหมาย</h2>
        </div>
        <span>${escapeHtml(code)}</span>
        <p>สถานะผลดำเนินงานเทียบกับ Risk Appetite (RA) และ Risk Tolerance (RT)</p>
      </div>
      <div class="financial-metric-list">
        ${metrics.map((metric, index) => renderFinancialMetricRow(metric, index)).join("")}
      </div>
    </section>
  `;
}

function getFallbackMatrixRiskColor(impact, likelihood) {
  const score = Number(impact) * Number(likelihood);
  if (score <= 4) return "green";
  if (score <= 9) return "yellow";
  if (score <= 16) return "orange";
  return "red";
}

function findKriMatrixCell(matrix, impact, likelihood) {
  return matrix.find(
    (cell) => Number(cell.impact) === Number(impact) && Number(cell.likelihood) === Number(likelihood)
  );
}

function renderKriSummary(container, items, variant = "header") {
  if (!container) return;

  const counts = getKriPerformanceCounts(items);
  container.innerHTML = KRI_PERFORMANCE_ORDER
    .map((level) => {
      const copy = KRI_PERFORMANCE_COPY[level];
      return `
        <article class="kri-summary-card kri-performance-${level}">
          <span class="kri-performance-icon" aria-hidden="true">${kriPerformanceIcon(level)}</span>
          <span class="kri-summary-value">${counts[level]}</span>
          <span class="kri-summary-copy">
            <strong class="kri-summary-label">${escapeHtml(copy.label)}</strong>
            ${variant === "insight" ? `<small>${escapeHtml(copy.summary)}</small>` : ""}
          </span>
        </article>
      `;
    })
    .join("");
}

function renderKriMatrixMarker(item, { interactive = true } = {}) {
  const level = normalizePerformanceLevel(item.performance_level);
  const code = safeText(item.kri_code, "KRI");
  const riskName = safeText(item.risk_name, "ไม่มีชื่อความเสี่ยง");
  const riskLevel = getKriRiskLevelLabel(item);
  const performance = getCompactPerformanceLabel(level, item.performance_label);
  const tagName = interactive ? "button" : "span";
  const attributes = interactive
    ? `type="button" data-kri-code="${escapeHtml(code)}"`
    : "";
  const accessibleLabel = interactive
    ? `เปิดรายละเอียด KRI ${code} ${riskName}, ระดับความเสี่ยง ${riskLevel}, สถานะ ${performance}`
    : `KRI ${code} ${riskName}, ระดับความเสี่ยง ${riskLevel}, สถานะ ${performance}`;

  return `
    <${tagName} class="kri-matrix-marker kri-performance-${level}" ${attributes}
      aria-label="${escapeHtml(accessibleLabel)}"
      title="${escapeHtml(`${code} · ${riskName} · ${riskLevel} · ${performance}`)}">
      <span class="kri-marker-watermark" aria-hidden="true">${kriPerformanceIcon(level)}</span>
      <strong>${escapeHtml(code)}</strong>
    </${tagName}>
  `;
}

function renderKriMatrix(items) {
  const matrixContainer = document.querySelector("#kri-risk-matrix");
  if (!matrixContainer) return;

  const matrix = getKriRiskMatrix();
  const likelihoodLabels = {
    5: "สูงมาก",
    4: "สูง",
    3: "ปานกลาง",
    2: "ต่ำ",
    1: "ต่ำมาก"
  };
  const impactLabels = {
    1: "ต่ำมาก",
    2: "ต่ำ",
    3: "ปานกลาง",
    4: "สูง",
    5: "สูงมาก"
  };

  const cells = [];
  cells.push('<div class="kri-matrix-corner"></div>');

  for (let impact = 1; impact <= 5; impact += 1) {
    cells.push(`<div class="kri-matrix-top-label">${impact}</div>`);
  }

  for (let likelihood = 5; likelihood >= 1; likelihood -= 1) {
    cells.push(`
      <div class="kri-matrix-row-label">
        <strong>${likelihood}</strong>
        <span>${likelihoodLabels[likelihood]}</span>
      </div>
    `);

    for (let impact = 1; impact <= 5; impact += 1) {
      const cell = findKriMatrixCell(matrix, impact, likelihood);
      const riskColor = cell?.risk_color || getFallbackMatrixRiskColor(impact, likelihood);
      const visual = getKriRiskVisualFromFields(cell?.color_hex, riskColor);
      const riskKey = getKriRiskKeyFromFields(cell?.color_hex, riskColor);
      const cellItems = items.filter(
        (item) => Number(item.impact) === impact && Number(item.likelihood) === likelihood
      );
      const markers = cellItems.map((item) => renderKriMatrixMarker(item)).join("");

      cells.push(`
        <div class="kri-matrix-cell kri-risk-${riskKey}" data-risk-level="${riskKey}" style="--cell-bg:${visual.background};--cell-border:${visual.border};--cell-accent:${visual.accent}">
          <div class="kri-matrix-markers" data-count="${cellItems.length}">${markers}</div>
        </div>
      `);
    }
  }

  cells.push('<div class="kri-matrix-axis-spacer"><span>LIKELIHOOD</span></div>');
  for (let impact = 1; impact <= 5; impact += 1) {
    cells.push(`
      <div class="kri-matrix-bottom-label">
        <strong>${impact}</strong>
        <span>${impactLabels[impact]}</span>
      </div>
    `);
  }

  matrixContainer.innerHTML = `
    <div class="kri-matrix-grid">${cells.join("")}</div>
    <div class="kri-matrix-impact-label">IMPACT</div>
  `;
}

function hasKriMatrixPosition(item) {
  const impact = Number(item?.impact);
  const likelihood = Number(item?.likelihood);

  return (
    Number.isFinite(impact) &&
    Number.isFinite(likelihood) &&
    impact >= 1 &&
    impact <= 5 &&
    likelihood >= 1 &&
    likelihood <= 5
  );
}

function renderKriDetailMiniMatrix(item) {
  if (!hasKriMatrixPosition(item)) {
    return '<div class="kri-detail-mini-matrix-empty">ยังไม่มีตำแหน่ง Risk Matrix สำหรับ KRI นี้</div>';
  }

  const matrix = getKriRiskMatrix();
  const currentImpact = Number(item.impact);
  const currentLikelihood = Number(item.likelihood);
  const likelihoodLabels = {
    5: "สูงมาก",
    4: "สูง",
    3: "ปานกลาง",
    2: "ต่ำ",
    1: "ต่ำมาก"
  };
  const impactLabels = {
    1: "ต่ำมาก",
    2: "ต่ำ",
    3: "ปานกลาง",
    4: "สูง",
    5: "สูงมาก"
  };

  const cells = [];
  cells.push('<div class="kri-matrix-corner"></div>');

  for (let impact = 1; impact <= 5; impact += 1) {
    cells.push(`<div class="kri-matrix-top-label">${impact}</div>`);
  }

  for (let likelihood = 5; likelihood >= 1; likelihood -= 1) {
    cells.push(`
      <div class="kri-matrix-row-label">
        <strong>${likelihood}</strong>
        <span>${likelihoodLabels[likelihood]}</span>
      </div>
    `);

    for (let impact = 1; impact <= 5; impact += 1) {
      const cell = findKriMatrixCell(matrix, impact, likelihood);
      const riskColor = cell?.risk_color || getFallbackMatrixRiskColor(impact, likelihood);
      const visual = getKriRiskVisualFromFields(cell?.color_hex, riskColor);
      const riskKey = getKriRiskKeyFromFields(cell?.color_hex, riskColor);
      const hasMarker = impact === currentImpact && likelihood === currentLikelihood;
      const marker =
        hasMarker
          ? renderKriMatrixMarker(item, { interactive: false })
          : "";

      cells.push(`
        <div class="kri-matrix-cell kri-risk-${riskKey}" data-risk-level="${riskKey}" style="--cell-bg:${visual.background};--cell-border:${visual.border};--cell-accent:${visual.accent}">
          <div class="kri-matrix-markers" data-count="${hasMarker ? 1 : 0}">${marker}</div>
        </div>
      `);
    }
  }

  cells.push('<div class="kri-matrix-axis-spacer"><span>LIKELIHOOD</span></div>');
  for (let impact = 1; impact <= 5; impact += 1) {
    cells.push(`
      <div class="kri-matrix-bottom-label">
        <strong>${impact}</strong>
        <span>${impactLabels[impact]}</span>
      </div>
    `);
  }

  return `
    <div class="kri-risk-matrix" aria-label="Current KRI risk matrix position">
      <div class="kri-matrix-grid">${cells.join("")}</div>
      <div class="kri-matrix-impact-label">IMPACT</div>
    </div>
  `;
}

function renderKriRiskLegend() {
  const container = document.querySelector("#kri-risk-legend-list");
  if (!container) return;

  container.innerHTML = ["low", "medium", "high", "extreme"]
    .map((key) => {
      const meta = KRI_RISK_LEVEL_META[key];
      return `
        <div class="kri-risk-legend-item">
          <i style="--risk-color:${meta.matrix}" aria-hidden="true"></i>
          <strong>${escapeHtml(meta.label)}</strong>
          <span>${escapeHtml(KRI_RISK_LEVEL_DESCRIPTIONS[key])}</span>
        </div>
      `;
    })
    .join("");
}

function renderKriPerformanceLegend() {
  const container = document.querySelector("#kri-performance-legend-list");
  if (!container) return;

  container.innerHTML = KRI_PERFORMANCE_ORDER
    .map((level) => {
      const copy = KRI_PERFORMANCE_COPY[level];
      return `
        <div class="kri-legend-item kri-performance-${level}">
          <span class="kri-performance-icon">${kriPerformanceIcon(level)}</span>
          <div>
            <strong>${escapeHtml(copy.label)}</strong>
            <p>${escapeHtml(copy.summary)}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderKriOverviewList(items) {
  const container = document.querySelector("#kri-overview-list");
  if (!container) return;

  container.innerHTML = `
    <div class="kri-overview-row kri-overview-head">
      <span>KRI Code</span>
      <span>KRI Name</span>
      <span>Risk Type</span>
      <span>Risk Level</span>
      <span>Performance Status</span>
      <span>Trend</span>
      <span>Last Update</span>
      <span aria-hidden="true"></span>
    </div>
    ${items
      .map((item) => {
        const riskMeta = getKriRiskLevelMeta(item);
        const level = normalizePerformanceLevel(item.performance_level);
        const performanceCategory = getCompactPerformanceLabel(level, item.performance_label);
        const performanceLabel = getKriItemPerformanceLabel(item);
        const trend = getKriTrendMeta(item.trend);
        const kriCode = safeText(item.kri_code, "KRI");
        const riskName = safeText(item.risk_name, "ไม่มีชื่อความเสี่ยง");
        return `
          <div class="kri-overview-row" role="button" tabindex="0" data-kri-code="${escapeHtml(kriCode)}" aria-label="เปิดรายละเอียด KRI ${escapeHtml(kriCode)} ${escapeHtml(riskName)}">
            <span class="kri-overview-code-cell"><b class="kri-code">${escapeHtml(kriCode)}</b></span>
            <span class="kri-overview-name kri-overview-name-cell">${escapeHtml(riskName)}</span>
            <span class="kri-overview-risk-type">${escapeHtml(safeText(item.risk_type, "ไม่ระบุ"))}</span>
            <span class="kri-overview-risk-level-cell">
              <b class="kri-risk-pill kri-risk-${getKriRiskKey(item)}" style="--kri-risk-color:${riskMeta.accent};--kri-risk-bg:${riskMeta.background};--kri-risk-border:${riskMeta.border}">
                ${escapeHtml(getKriRiskLevelLabel(item))}
              </b>
            </span>
            <span class="kri-overview-performance-cell">
              <b class="kri-performance-pill kri-performance-${level}">
                <span class="kri-performance-icon">${kriPerformanceIcon(level)}</span>
                <span class="kri-performance-pill-copy">
                  <strong>${escapeHtml(performanceCategory)}</strong>
                  <small>${escapeHtml(performanceLabel)}</small>
                </span>
              </b>
            </span>
            <span class="kri-overview-trend-cell">
              <b class="kri-trend kri-trend-${trend.className}">
                <span aria-hidden="true">${trend.icon}</span>
                ${trend.label}
              </b>
            </span>
            <span class="kri-overview-date-cell">${escapeHtml(formatKriLastUpdate(item.last_update))}</span>
            <span class="kri-overview-chevron" aria-hidden="true">→</span>
          </div>
        `;
      })
      .join("")}
  `;
}

function renderKriInsights(items) {
  const container = document.querySelector("#kri-insights-summary");
  if (!container) return;

  const counts = getKriPerformanceCounts(items);
  container.innerHTML = KRI_PERFORMANCE_ORDER
    .map((level) => {
      const copy = KRI_PERFORMANCE_COPY[level];
      return `
        <article class="kri-insight-card kri-performance-${level}">
          <span class="kri-performance-icon">${kriPerformanceIcon(level)}</span>
          <div>
            <strong>${counts[level]} ตัว</strong>
            <h3>${escapeHtml(copy.label)}</h3>
            <p>${escapeHtml(copy.summary)}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderKriDashboard() {
  const items = getKriHomeOrderedItems();
  const empty = document.querySelector("#kri-dashboard-empty");
  const content = document.querySelector("#kri-dashboard-content");
  const latest = document.querySelector("#kri-dashboard-latest");

  renderKriSummary(document.querySelector("#kri-dashboard-summary"), items, "insight");
  if (latest) {
    const latestValue = getLatestKriUpdateValue(items);
    latest.textContent = latestValue
      ? `ข้อมูลล่าสุด: ${formatKriLastUpdate(latestValue)}`
      : "ข้อมูลล่าสุด: —";
  }

  if (items.length === 0) {
    empty.hidden = false;
    content.hidden = true;
    return;
  }

  empty.hidden = true;
  content.hidden = false;
  renderKriMatrix(items);
  renderKriRiskLegend();
  renderKriPerformanceLegend();
  renderKriOverviewList(items);
  renderKriInsights(items);
}

function renderF1ActionText(value) {
  const text = safeText(value, "ไม่ระบุ");
  const match = text.match(/^([A-Z]+\d+):\s*(.+)$/);
  if (!match) return escapeHtml(text);

  return `<strong class="f1-action-id">${escapeHtml(match[1])}</strong><span>${escapeHtml(match[2])}</span>`;
}

function getStandardKriTextLines(value) {
  return safeText(value, "")
    .split(/[\r\n\v]+/)
    .map((line) => line.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean);
}

function renderStandardKriActionText(value) {
  const text = safeText(value, "ไม่ระบุ");
  const match = text.match(/^([A-Z]+(?:-[A-Z0-9]+)*\d*):\s*(.+)$/i);
  if (!match) return `<span>${escapeHtml(text)}</span>`;

  return `<strong class="standard-action-id">${escapeHtml(match[1])}</strong><span>${escapeHtml(match[2])}</span>`;
}

function hasCompleteNumericMetric(metric) {
  return [metric?.actual_value, metric?.risk_appetite_value, metric?.risk_tolerance_value]
    .every((value) => Number.isFinite(toMetricNumber(value)));
}

function renderStandardThresholdRail(metric) {
  const scale = getMetricChartScale(metric);
  if (!scale) return "";

  const lowerIsBetter = safeText(metric.direction, "higher_is_better") === "lower_is_better";
  const firstThreshold = lowerIsBetter ? scale.appetitePct : scale.tolerancePct;
  const secondThreshold = lowerIsBetter ? scale.tolerancePct : scale.appetitePct;
  const first = Math.max(0, Math.min(firstThreshold, secondThreshold));
  const second = Math.min(100, Math.max(firstThreshold, secondThreshold));
  const markerLanes = getF1ThresholdMarkerLanes(scale);
  const unit = safeText(metric.unit, "");
  const ariaUnit = unit === "%" ? "%" : unit ? ` ${unit}` : "";
  const zones = lowerIsBetter
    ? [
        { className: "standard-zone-appetite", label: "อยู่ในเกณฑ์ที่ยอมรับได้", width: first },
        { className: "standard-zone-tolerance", label: "ต้องเฝ้าระวัง", width: second - first },
        { className: "standard-zone-not-meet", label: "ไม่เป็นไปตามเป้าหมาย", width: 100 - second }
      ]
    : [
        { className: "standard-zone-not-meet", label: "ไม่เป็นไปตามเป้าหมาย", width: first },
        { className: "standard-zone-tolerance", label: "ต้องเฝ้าระวัง", width: second - first },
        { className: "standard-zone-appetite", label: "อยู่ในเกณฑ์ที่ยอมรับได้", width: 100 - second }
      ];

  return `
    <div class="standard-threshold-scroll">
      <div class="standard-threshold-chart" role="img" aria-label="Actual ${escapeHtml(formatMetricValue(scale.actual))}${escapeHtml(ariaUnit)}, Risk Appetite ${escapeHtml(formatMetricValue(scale.appetite))}${escapeHtml(ariaUnit)}, Risk Tolerance ${escapeHtml(formatMetricValue(scale.tolerance))}${escapeHtml(ariaUnit)}">
        <div class="standard-actual-marker" style="--marker-position:${scale.actualPct}%" aria-hidden="true">
          <span>Actual</span>
          <strong>${escapeHtml(formatMetricValue(scale.actual))}</strong>
          <i></i>
        </div>
        <div class="standard-threshold-rail" aria-hidden="true">
          <div class="standard-threshold-zones">
            ${zones
              .map(
                (zone) => `
                  <span class="${zone.className}" style="width:${zone.width}%">
                    <small>${zone.width >= 18 ? zone.label : ""}</small>
                  </span>
                `
              )
              .join("")}
          </div>
          <span class="standard-threshold-guide standard-threshold-guide-ra" style="--marker-position:${scale.appetitePct}%"></span>
          <span class="standard-threshold-guide standard-threshold-guide-rt" style="--marker-position:${scale.tolerancePct}%"></span>
        </div>
        <div class="standard-threshold-labels" aria-hidden="true">
          <span class="standard-threshold-label standard-threshold-label-ra standard-threshold-lane-${markerLanes.appetite}" style="--marker-position:${scale.appetitePct}%">
            <b>RA</b><strong>${escapeHtml(formatMetricValue(scale.appetite))}</strong>
          </span>
          <span class="standard-threshold-label standard-threshold-label-rt standard-threshold-lane-${markerLanes.tolerance}" style="--marker-position:${scale.tolerancePct}%">
            <b>RT</b><strong>${escapeHtml(formatMetricValue(scale.tolerance))}</strong>
          </span>
        </div>
      </div>
    </div>
  `;
}

function renderStandardNumericMetric(metric, item) {
  const direction = safeText(metric.direction, "higher_is_better");
  const lowerIsBetter = direction === "lower_is_better";
  const directionLabel = lowerIsBetter ? "Lower is Better" : "Higher is Better";
  const itemPerformanceLevel = normalizePerformanceLevel(item.performance_level);
  const status = getMetricStatusDisplay({
    ...metric,
    status: safeText(metric.status, itemPerformanceLevel),
    status_label: safeText(metric.status_label, getCompactPerformanceLabel(itemPerformanceLevel, item.performance_label)),
    status_label_th: safeText(metric.status_label_th, getKriItemPerformanceLabel(item))
  });
  const unit = safeText(metric.unit, "ไม่ระบุ");
  const metricName = safeText(metric.metric_name, "ตัวชี้วัด");

  return `
    <article class="standard-numeric-metric">
      <div class="standard-metric-workspace">
        <div class="standard-metric-visual">
          <div class="standard-metric-title-row">
            <div>
              <h3>${escapeHtml(metricName)}</h3>
              <p>หน่วย: ${escapeHtml(unit)}</p>
            </div>
            <span class="standard-direction standard-direction-${direction}"><b aria-hidden="true">${lowerIsBetter ? "↘" : "↗"}</b>${directionLabel}</span>
          </div>
          ${renderStandardThresholdRail(metric)}
        </div>
        <aside class="standard-metric-values" aria-label="ค่าตัวชี้วัด ${escapeHtml(metricName)}">
          <div class="standard-value-actual">
            <span>Actual</span>
            <strong>${formatMetricValueWithUnit(metric.actual_value, unit)}</strong>
            <small>${escapeHtml(formatKriLastUpdate(item.last_update))}</small>
          </div>
          <div class="standard-value-row standard-value-ra">
            <span><i></i>Risk Appetite (RA)</span>
            <strong>${formatMetricValueWithUnit(metric.risk_appetite_value, unit)}</strong>
          </div>
          <div class="standard-value-row standard-value-rt">
            <span><i></i>Risk Tolerance (RT)</span>
            <strong>${formatMetricValueWithUnit(metric.risk_tolerance_value, unit)}</strong>
          </div>
          <dl>
            <div><dt>หน่วยวัด</dt><dd>${escapeHtml(unit)}</dd></div>
            <div><dt>เจ้าของข้อมูล</dt><dd>${escapeHtml(safeText(item.risk_owner, "ไม่ระบุ"))}</dd></div>
          </dl>
        </aside>
      </div>
      <div class="standard-metric-state kri-performance-${status.status}">
        <span class="kri-performance-icon" aria-hidden="true">${kriPerformanceIcon(status.status)}</span>
        <div><strong>${escapeHtml(status.label)}</strong><span>${escapeHtml(status.labelTh)}</span></div>
      </div>
    </article>
  `;
}

function renderStandardCriteriaCard(kind, value) {
  const isAppetite = kind === "appetite";
  return `
    <article class="standard-criterion standard-criterion-${kind}">
      <span class="kri-performance-icon" aria-hidden="true">${kriPerformanceIcon(kind)}</span>
      <div>
        <span>${isAppetite ? "TARGET THRESHOLD" : "ACCEPTABLE THRESHOLD"}</span>
        <h3>${isAppetite ? "Risk Appetite" : "Risk Tolerance"}</h3>
        <p class="kri-formatted-text">${formatNumberedText(value, "ไม่ระบุ")}</p>
      </div>
    </article>
  `;
}

function renderStandardMetricSection(item) {
  const metrics = getSortedFinancialMetrics(item);
  const numericMetrics = metrics.filter(hasCompleteNumericMetric);
  const incompleteMetrics = metrics.filter((metric) => !hasCompleteNumericMetric(metric));
  const performanceLevel = normalizePerformanceLevel(item.performance_level);
  const performanceCategory = getCompactPerformanceLabel(performanceLevel, item.performance_label);
  const performanceLabel = getKriItemPerformanceLabel(item);
  const trend = getKriTrendMeta(item.trend);
  const appetite = safeText(item.risk_appetite, "");
  const tolerance = safeText(item.risk_tolerance, "");

  if (numericMetrics.length > 0) {
    return `
      <section class="standard-kri-metric-section standard-kri-numeric-section" aria-labelledby="standard-kri-metric-heading">
        <div class="standard-section-heading">
          <div>
            <h2 id="standard-kri-metric-heading">ตัวชี้วัดและผลการดำเนินงาน</h2>
            <p>ผลจริงเทียบกับ Risk Appetite และ Risk Tolerance จากข้อมูลปัจจุบัน</p>
          </div>
        </div>
        <div class="standard-numeric-metric-list">
          ${numericMetrics.map((metric) => renderStandardNumericMetric(metric, item)).join("")}
        </div>
        ${incompleteMetrics.length > 0
          ? `<div class="standard-incomplete-metrics">${incompleteMetrics
              .map((metric) => `<span>${escapeHtml(safeText(metric.metric_name, "ตัวชี้วัด"))}: ข้อมูล Actual / RA / RT ยังไม่ครบ</span>`)
              .join("")}</div>`
          : ""}
        <div class="standard-performance-strip kri-performance-${performanceLevel}">
          <span class="kri-performance-icon" aria-hidden="true">${kriPerformanceIcon(performanceLevel)}</span>
          <div><strong>${escapeHtml(performanceCategory)}</strong><span>${escapeHtml(performanceLabel)}</span></div>
          <p>${escapeHtml(safeText(item.kri_description, item.risk_name))}</p>
          <div class="standard-strip-meta kri-trend-${trend.className}"><span>แนวโน้ม</span><strong>${escapeHtml(trend.label)}</strong></div>
          <div class="standard-strip-meta"><span>อัปเดตล่าสุด</span><strong>${escapeHtml(formatKriLastUpdate(item.last_update))}</strong></div>
        </div>
      </section>
    `;
  }

  return `
    <section class="standard-kri-metric-section standard-kri-qualitative-section" aria-labelledby="standard-kri-metric-heading">
      <div class="standard-section-heading">
        <div>
          <h2 id="standard-kri-metric-heading">ตัวชี้วัดและผลการดำเนินงาน</h2>
          <p>${escapeHtml(safeText(item.kri_description, item.risk_name))}</p>
        </div>
        <span class="standard-data-mode">เกณฑ์เชิงคุณภาพ</span>
      </div>
      <div class="standard-qualitative-layout">
        <article class="standard-current-state kri-performance-${performanceLevel}">
          <span class="kri-performance-icon" aria-hidden="true">${kriPerformanceIcon(performanceLevel)}</span>
          <div class="standard-current-state-copy">
            <span>สถานะผลการดำเนินงาน</span>
            <h3>${escapeHtml(performanceCategory)}</h3>
            <p>${escapeHtml(performanceLabel)}</p>
          </div>
          <div class="standard-current-state-meta">
            <span>แนวโน้ม</span>
            <strong class="kri-trend-${trend.className}"><b aria-hidden="true">${trend.icon}</b>${escapeHtml(trend.label)}</strong>
          </div>
        </article>
        <div class="standard-criteria-pair${tolerance ? "" : " standard-criteria-single"}">
          ${renderStandardCriteriaCard("appetite", appetite)}
          ${tolerance ? renderStandardCriteriaCard("tolerance", tolerance) : ""}
        </div>
      </div>
    </section>
  `;
}

function renderStandardKriDetail(item) {
  const kriCode = safeText(item.kri_code, "KRI");
  const riskName = safeText(item.risk_name, "ไม่มีชื่อความเสี่ยง");
  const riskType = safeText(item.risk_type, "ไม่ระบุประเภทความเสี่ยง");
  const riskMeta = getKriRiskLevelMeta(item);
  const riskKey = getKriRiskKey(item);
  const riskLabel = getKriRiskLevelLabel(item);
  const performanceLevel = normalizePerformanceLevel(item.performance_level);
  const performanceCategory = getCompactPerformanceLabel(performanceLevel, item.performance_label);
  const performanceLabel = getKriItemPerformanceLabel(item);
  const trend = getKriTrendMeta(item.trend);
  const impact = item.impact === null || item.impact === undefined || item.impact === "" ? "ไม่ระบุ" : String(item.impact);
  const likelihood = item.likelihood === null || item.likelihood === undefined || item.likelihood === "" ? "ไม่ระบุ" : String(item.likelihood);
  const riskOwner = safeText(item.risk_owner, "ไม่ระบุ");
  const lastUpdate = formatKriLastUpdate(item.last_update);
  const updateLines = getStandardKriTextLines(item.update);
  const miniMatrix = renderKriDetailMiniMatrix(item);
  const groupedActions = getGroupedKriActions(item);
  const actionGroupOrder = ["Existing Control", "Mitigation Plan"];
  const actionGroups = Object.entries(groupedActions).sort(([a], [b]) => {
    const orderA = actionGroupOrder.includes(a) ? actionGroupOrder.indexOf(a) : 99;
    const orderB = actionGroupOrder.includes(b) ? actionGroupOrder.indexOf(b) : 99;
    return orderA - orderB || a.localeCompare(b);
  });
  const matrixScaleLabels = { 1: "ต่ำมาก", 2: "ต่ำ", 3: "ปานกลาง", 4: "สูง", 5: "สูงมาก" };

  const summaryItems = [
    {
      className: `kri-performance-${performanceLevel}`,
      icon: kriPerformanceIcon(performanceLevel),
      label: "Performance Status",
      value: performanceCategory,
      supporting: performanceLabel
    },
    {
      className: `kri-detail-summary-risk kri-risk-${riskKey}`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 18.5 6v5.2c0 4.1-2.6 7.8-6.5 9.3-3.9-1.5-6.5-5.2-6.5-9.3V6L12 3.5Z"></path><path d="M12 8v5M12 16.5h.01"></path></svg>',
      label: "Risk Level",
      value: riskLabel,
      supporting: `Likelihood ${likelihood} × Impact ${impact}`,
      style: `--summary-accent:${riskMeta.accent};--summary-bg:${riskMeta.background}`
    },
    {
      className: `kri-detail-summary-trend kri-trend-${trend.className}`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17 10 11l4 4 6-8"></path><path d="M15 7h5v5"></path></svg>',
      label: "Trend",
      value: trend.label,
      supporting: "แนวโน้มล่าสุด"
    },
    {
      className: "kri-detail-summary-date",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z"></path><path d="M8 2v4M16 2v4M5 9h14"></path></svg>',
      label: "ข้อมูลล่าสุด",
      value: lastUpdate,
      supporting: "รอบข้อมูลปัจจุบัน"
    },
    {
      className: "kri-detail-summary-owner",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 21v-2.5c0-3.1 2.5-5.5 5.5-5.5h3c3 0 5.5 2.4 5.5 5.5V21"></path></svg>',
      label: "Owner",
      value: riskOwner,
      supporting: "หน่วยงานรับผิดชอบ"
    }
  ];

  const progressMarkup = updateLines.length > 0
    ? `
      <section class="standard-info-card standard-progress-card" aria-labelledby="standard-progress-heading">
        <div class="standard-card-heading">
          <span class="standard-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 20V10M12 20V4M18 20v-7"></path></svg></span>
          <div><h2 id="standard-progress-heading">Progress Update</h2><p>ความคืบหน้าการดำเนินงาน</p></div>
        </div>
        <ul class="standard-progress-list">
          ${updateLines.map((line) => `<li><span aria-hidden="true"></span><p>${escapeHtml(line)}</p></li>`).join("")}
        </ul>
      </section>
    `
    : "";

  const actionMarkup = actionGroups.length > 0
    ? `
      <section class="standard-actions-section" aria-labelledby="standard-actions-heading">
        <div class="standard-section-heading">
          <div><h2 id="standard-actions-heading">Controls and Mitigation</h2><p>มาตรการควบคุมและแผนจัดการความเสี่ยง</p></div>
        </div>
        <div class="standard-actions-grid">
          ${actionGroups.map(([actionType, actions]) => `
            <article class="standard-action-card">
              <div class="standard-action-card-heading">
                <span class="standard-card-icon" aria-hidden="true">${actionType === "Existing Control" ? kriPerformanceIcon("appetite") : '<svg viewBox="0 0 24 24"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"></path><circle cx="12" cy="12" r="4"></circle></svg>'}</span>
                <h3>${escapeHtml(actionType)}</h3>
                <span>${actions.length} รายการ</span>
              </div>
              <ul>
                ${actions.map((action) => `<li><span class="standard-action-dot" aria-hidden="true"></span><p>${renderStandardKriActionText(action.action_text)}</p></li>`).join("")}
              </ul>
            </article>
          `).join("")}
        </div>
      </section>
    `
    : "";

  return `
    <header class="standard-kri-hero">
      <div class="standard-kri-hero-copy">
        <p class="kri-detail-kicker">ENTERPRISE RISK INDICATOR</p>
        <div class="standard-kri-title-row">
          <span class="kri-detail-code">${escapeHtml(kriCode)}</span>
          <div>
            <span class="standard-risk-type">${escapeHtml(riskType)} Risk</span>
            <h1 id="kri-detail-title" class="kri-detail-title">${escapeHtml(riskName)}</h1>
            <p class="kri-detail-subtitle">${formatNumberedText(item.kri_description, riskType)}</p>
          </div>
        </div>
      </div>
    </header>

    <section class="kri-detail-summary-grid" aria-label="สรุปข้อมูล KRI">
      ${summaryItems.map((summary) => `
        <article class="kri-detail-summary-card ${summary.className}" ${summary.style ? `style="${summary.style}"` : ""}>
          <span class="kri-detail-summary-icon" aria-hidden="true">${summary.icon}</span>
          <div><span>${escapeHtml(summary.label)}</span><strong>${escapeHtml(summary.value)}</strong><small>${escapeHtml(summary.supporting)}</small></div>
        </article>
      `).join("")}
    </section>

    ${renderStandardMetricSection(item)}

    <div class="standard-kri-support-grid${progressMarkup ? "" : " standard-kri-support-grid-no-progress"}">
      <section class="standard-info-card standard-profile-card" aria-labelledby="standard-profile-heading">
        <div class="standard-card-heading">
          <span class="standard-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z"></path><path d="M15 3v4h4M9 11h6M9 15h6"></path></svg></span>
          <div><h2 id="standard-profile-heading">KRI Profile</h2><p>รายละเอียดของตัวชี้วัด</p></div>
        </div>
        <dl class="standard-profile-list">
          <div><dt>รหัสตัวชี้วัด</dt><dd>${escapeHtml(kriCode)}</dd></div>
          <div><dt>ชื่อ KRI</dt><dd>${escapeHtml(riskName)}</dd></div>
          <div><dt>ประเภทความเสี่ยง</dt><dd>${escapeHtml(riskType)}</dd></div>
          <div><dt>รายละเอียดตัวชี้วัด</dt><dd>${formatNumberedText(item.kri_description, "ไม่ระบุ")}</dd></div>
          <div><dt>ผู้รับผิดชอบ</dt><dd>${escapeHtml(riskOwner)}</dd></div>
        </dl>
      </section>

      ${progressMarkup}

      <section class="standard-info-card standard-matrix-card" aria-labelledby="standard-matrix-heading">
        <div class="standard-card-heading">
          <span class="standard-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"></path><path d="m15.5 17 1.5 1.5 3-4"></path></svg></span>
          <div><h2 id="standard-matrix-heading">Risk Matrix Position</h2><p>ตำแหน่งใน Risk Matrix</p></div>
        </div>
        <div class="kri-detail-mini-matrix">${miniMatrix}</div>
        <dl class="standard-matrix-meta">
          <div><dt>Risk Level</dt><dd><span class="standard-risk-pill kri-risk-${riskKey}" style="--risk-accent:${riskMeta.accent};--risk-bg:${riskMeta.background};--risk-border:${riskMeta.border}">${escapeHtml(riskLabel)}</span></dd></div>
          <div><dt>Likelihood</dt><dd><strong>${escapeHtml(likelihood)}</strong> ${escapeHtml(matrixScaleLabels[likelihood] || "")}</dd></div>
          <div><dt>Impact</dt><dd><strong>${escapeHtml(impact)}</strong> ${escapeHtml(matrixScaleLabels[impact] || "")}</dd></div>
          <div><dt>อัปเดตล่าสุด</dt><dd>${escapeHtml(lastUpdate)}</dd></div>
        </dl>
      </section>
    </div>

    ${getSortedFinancialMetrics(item).some(hasCompleteNumericMetric)
      ? `<section class="standard-criteria-footer" aria-label="Risk criteria">${renderStandardCriteriaCard("appetite", item.risk_appetite)}${safeText(item.risk_tolerance, "") ? renderStandardCriteriaCard("tolerance", item.risk_tolerance) : ""}</section>`
      : ""}

    ${actionMarkup}
  `;
}

function renderKriDetail(item) {
  const content = document.querySelector("#kri-detail-content");
  const detailView = document.querySelector("#kri-detail-view");
  const backLabel = document.querySelector("#kri-detail-back-label");
  if (!content || !item) return;

  const kriCode = safeText(item.kri_code, "KRI");
  const isF1Detail = normalizeKriCode(kriCode) === "F1";
  content.classList.toggle("kri-detail-content-f1", isF1Detail);
  content.classList.toggle("kri-detail-content-standard", !isF1Detail);
  detailView?.classList.toggle("kri-detail-f1-view", isF1Detail);
  detailView?.classList.toggle("kri-detail-standard-view", !isF1Detail);
  if (isF1Detail) selectedF1MetricKey = "";
  const riskName = safeText(item.risk_name, "ไม่มีชื่อความเสี่ยง");
  const riskType = safeText(item.risk_type, "ไม่ระบุประเภทความเสี่ยง");
  const riskMeta = getKriRiskLevelMeta(item);
  const riskKey = getKriRiskKey(item);
  const riskLabel = getKriRiskLevelLabel(item);
  const performanceLevel = normalizePerformanceLevel(item.performance_level);
  if (detailView) {
    if (isF1Detail) delete detailView.dataset.kriPerformance;
    else detailView.dataset.kriPerformance = performanceLevel;
  }
  const performanceCategory = getCompactPerformanceLabel(performanceLevel, item.performance_label);
  const performanceLabel = getKriItemPerformanceLabel(item);
  const trend = getKriTrendMeta(item.trend);
  const impact = item.impact === null || item.impact === undefined || item.impact === "" ? "ไม่ระบุ" : String(item.impact);
  const likelihood =
    item.likelihood === null || item.likelihood === undefined || item.likelihood === ""
      ? "ไม่ระบุ"
      : String(item.likelihood);
  const riskOwner = safeText(item.risk_owner, "ไม่ระบุ");
  const lastUpdate = formatKriLastUpdate(item.last_update);
  const groupedActions = getGroupedKriActions(item);
  const actionGroupOrder = ["Existing Control", "Mitigation Plan"];
  const actionGroups = Object.entries(groupedActions).sort(([a], [b]) => {
    const orderA = actionGroupOrder.includes(a) ? actionGroupOrder.indexOf(a) : 99;
    const orderB = actionGroupOrder.includes(b) ? actionGroupOrder.indexOf(b) : 99;
    return orderA - orderB || a.localeCompare(b);
  });

  if (backLabel) {
    backLabel.textContent =
      kriDetailReturnView === "kri-dashboard" ? "กลับหน้า KRI Dashboard" : "กลับหน้าหลัก";
  }

  if (!isF1Detail) {
    content.innerHTML = renderStandardKriDetail(item);
    return;
  }

  const summaryItems = [
    {
      className: `kri-performance-${performanceLevel}`,
      icon: kriPerformanceIcon(performanceLevel),
      label: "Performance Status",
      value: performanceCategory,
      supporting: performanceLabel
    },
    {
      className: `kri-detail-summary-risk kri-risk-${riskKey}`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 18.5 6v5.2c0 4.1-2.6 7.8-6.5 9.3-3.9-1.5-6.5-5.2-6.5-9.3V6L12 3.5Z"></path><path d="M12 8v5M12 16.5h.01"></path></svg>',
      label: "Risk Level",
      value: riskLabel,
      supporting: `Likelihood ${likelihood} × Impact ${impact}`,
      style: `--summary-accent:${riskMeta.accent};--summary-bg:${riskMeta.background}`
    },
    {
      className: `kri-detail-summary-trend kri-trend-${trend.className}`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17 10 11l4 4 6-8"></path><path d="M15 7h5v5"></path></svg>',
      label: "Trend",
      value: trend.label,
      supporting: "แนวโน้มล่าสุด"
    },
    {
      className: "kri-detail-summary-date",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z"></path><path d="M8 2v4M16 2v4M5 9h14"></path></svg>',
      label: "ข้อมูลล่าสุด",
      value: lastUpdate,
      supporting: "รอบข้อมูลปัจจุบัน"
    },
    {
      className: "kri-detail-summary-owner",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 21v-2.5c0-3.1 2.5-5.5 5.5-5.5h3c3 0 5.5 2.4 5.5 5.5V21"></path></svg>',
      label: "Owner",
      value: riskOwner,
      supporting: "หน่วยงานรับผิดชอบ"
    }
  ];
  const miniMatrix = renderKriDetailMiniMatrix(item);
  const updateText = safeText(item.update, "");
  const updateSection = updateText
    ? `
      <section class="kri-detail-card kri-detail-update" aria-labelledby="kri-update-heading">
        <p class="section-kicker">PROGRESS UPDATE</p>
        <h2 id="kri-update-heading">ผลการดำเนินงานล่าสุด</h2>
        <p class="kri-formatted-text kri-update-text">${formatNumberedText(item.update, "")}</p>
      </section>
    `
    : "";
  const financialThresholdSection = renderFinancialThresholdCard(item);

  const actionContent =
    actionGroups.length > 0
      ? actionGroups
          .map(
            ([actionType, actions]) => `
              <article class="kri-action-card">
                <h3>${escapeHtml(actionType)}</h3>
                <ul class="kri-action-list">
                  ${actions
                    .map(
                      (action) => `
                        <li class="kri-action-item">
                          <span class="kri-action-dot" aria-hidden="true"></span>
                          <p${isF1Detail ? ' class="f1-action-copy"' : ""}>${isF1Detail ? renderF1ActionText(action.action_text) : escapeHtml(safeText(action.action_text, "ไม่ระบุ"))}</p>
                        </li>
                      `
                    )
                    .join("")}
                </ul>
              </article>
            `
          )
          .join("")
      : '<div class="kri-detail-card kri-action-empty">ไม่มีข้อมูลมาตรการสำหรับ KRI นี้</div>';

  content.innerHTML = `
    <header class="kri-detail-header kri-detail-hero">
      <div class="kri-detail-copy">
        <p class="kri-detail-kicker">ENTERPRISE RISK INDICATOR</p>
        <div class="kri-detail-title-row">
          <span class="kri-detail-code">${escapeHtml(kriCode)}</span>
          <div>
            <h1 id="kri-detail-title" class="kri-detail-title">${escapeHtml(riskName)}</h1>
            <p class="kri-detail-subtitle">${formatNumberedText(item.kri_description, riskType)}</p>
          </div>
        </div>
        <div class="kri-detail-hero-tags">
          <span>${escapeHtml(riskType)}</span>
          <span>Likelihood ${escapeHtml(likelihood)}</span>
          <span>Impact ${escapeHtml(impact)}</span>
        </div>
      </div>
    </header>

    <section class="kri-detail-summary-grid" aria-label="สรุปข้อมูล KRI">
      ${summaryItems
        .map(
          (summary) => `
            <article class="kri-detail-summary-card ${summary.className}" ${summary.style ? `style="${summary.style}"` : ""}>
              <span class="kri-detail-summary-icon" aria-hidden="true">${summary.icon}</span>
              <div>
                <span>${escapeHtml(summary.label)}</span>
                <strong>${escapeHtml(summary.value)}</strong>
                <small>${escapeHtml(summary.supporting)}</small>
              </div>
            </article>
          `
        )
        .join("")}
    </section>

    ${financialThresholdSection}

    <div class="kri-detail-context-grid ${updateText ? "" : "kri-detail-context-single"}">
      <section class="kri-detail-card kri-detail-description" aria-labelledby="kri-description-heading">
        <p class="section-kicker">KRI PROFILE</p>
        <h2 id="kri-description-heading">รายละเอียดตัวชี้วัด</h2>
        <p class="kri-formatted-text">${formatNumberedText(item.kri_description, "ไม่มีรายละเอียด KRI")}</p>
      </section>
      ${updateSection}
    </div>

    <section class="kri-criteria-grid" aria-label="Risk criteria">
      <article class="kri-criteria-card kri-criteria-appetite">
        <span class="kri-performance-icon">${kriPerformanceIcon("appetite")}</span>
        <div>
          <p class="section-kicker">TARGET THRESHOLD</p>
          <h2>Risk Appetite</h2>
          <span>เป้าหมายที่ต้องการ</span>
          <p class="kri-formatted-text">${formatNumberedText(item.risk_appetite, "ไม่ระบุ")}</p>
        </div>
        <svg class="kri-threshold-watermark" viewBox="0 0 120 120" aria-hidden="true">
          <path d="M60 16 92 28v25c0 23.8-13.1 42.6-32 51-18.9-8.4-32-27.2-32-51V28l32-12Z"></path>
          <path d="m45 61 10.5 10.5L77 48"></path>
        </svg>
      </article>
      <article class="kri-criteria-card kri-criteria-tolerance">
        <span class="kri-performance-icon">${kriPerformanceIcon("tolerance")}</span>
        <div>
          <p class="section-kicker">ACCEPTABLE THRESHOLD</p>
          <h2>Risk Tolerance</h2>
          <span>ระดับที่ยอมรับได้</span>
          <p class="kri-formatted-text">${formatNumberedText(item.risk_tolerance, "ไม่ระบุ")}</p>
        </div>
        <svg class="kri-threshold-watermark" viewBox="0 0 120 120" aria-hidden="true">
          <path d="M60 15 94 28v25.5c0 24.5-13.8 43.8-34 52.5-20.2-8.7-34-28-34-52.5V28l34-13Z"></path>
          <path d="M60 40 77 47v13c0 12.4-6.9 22-17 27-10.1-5-17-14.6-17-27V47l17-7Z"></path>
        </svg>
      </article>
    </section>

    <div class="kri-detail-support-grid">
      <section class="kri-detail-mini-matrix-card" aria-labelledby="kri-detail-matrix-heading">
        <div class="section-heading">
          <div>
            <h2 id="kri-detail-matrix-heading">Risk Matrix Position</h2>
            <p class="section-subtitle">ตำแหน่งตาม Likelihood × Impact ล่าสุด</p>
          </div>
        </div>
        <div class="kri-detail-mini-matrix">${miniMatrix}</div>
      </section>

      <aside class="kri-detail-profile-card" aria-labelledby="kri-profile-meta-heading">
        <div class="section-heading">
          <div>
            <h2 id="kri-profile-meta-heading">ข้อมูลเพิ่มเติม</h2>
            <p class="section-subtitle">ข้อมูลจริงจากชุด KRI ปัจจุบัน</p>
          </div>
        </div>
        <dl>
          <div><dt>ประเภทความเสี่ยง</dt><dd>${escapeHtml(riskType)}</dd></div>
          <div><dt>ระดับความเสี่ยง</dt><dd>${escapeHtml(riskLabel)}</dd></div>
          <div><dt>Likelihood</dt><dd>${escapeHtml(likelihood)}</dd></div>
          <div><dt>Impact</dt><dd>${escapeHtml(impact)}</dd></div>
          <div><dt>หน่วยงานรับผิดชอบ</dt><dd>${escapeHtml(riskOwner)}</dd></div>
          <div><dt>อัปเดตล่าสุด</dt><dd>${escapeHtml(lastUpdate)}</dd></div>
        </dl>
      </aside>
    </div>

    <section class="kri-detail-card kri-actions-section" aria-labelledby="kri-actions-heading">
      <div class="section-heading">
        <div>
          <h2 id="kri-actions-heading">Controls and Mitigation</h2>
          <p class="section-subtitle">มาตรการควบคุมและแผนจัดการความเสี่ยง</p>
        </div>
      </div>
      <div class="kri-actions-grid">${actionContent}</div>
    </section>
  `;
}

function renderKriSnapshot() {
  const list = document.querySelector("#kri-snapshot-list");
  const latestElement = document.querySelector("#kri-snapshot-latest");
  if (!list) return;

  const items = getKriSnapshotItems();
  if (items.length === 0) {
    if (latestElement) latestElement.textContent = "ข้อมูลล่าสุด: —";
    list.innerHTML = '<div class="loading-card">ยังไม่มีข้อมูล KRI สำหรับรอบนี้</div>';
    return;
  }

  const latestUpdate = getLatestKriUpdateValue(items);
  if (latestElement) {
    latestElement.textContent = `ข้อมูลล่าสุด: ${formatKriLastUpdate(latestUpdate)}`;
  }

  list.innerHTML = items
    .map((item) => {
      const riskVisual = getKriRiskVisual(item);
      const performanceLevel = normalizePerformanceLevel(item.performance_level);
      const performanceCategory = getCompactPerformanceLabel(performanceLevel);
      const performanceLabel = getKriItemPerformanceLabel(item);
      const kriCode = safeText(item.kri_code, "KRI");
      const riskName = safeText(item.risk_name, "ไม่มีชื่อความเสี่ยง");
      const riskLabel = getKriRiskLevelLabel(item);

      return `
        <article class="kri-tile kri-tile-performance-${performanceLevel}" role="button" tabindex="0" data-kri-code="${escapeHtml(kriCode)}" aria-label="เปิดรายละเอียด KRI ${escapeHtml(kriCode)} ${escapeHtml(riskName)}, ระดับความเสี่ยง ${escapeHtml(riskLabel)}, สถานะ ${escapeHtml(performanceCategory)}" style="--kri-risk-color:${riskVisual.accent};--kri-risk-bg:${riskVisual.background};--kri-risk-border:${riskVisual.border};--kri-risk-accent:${riskVisual.marker}">
          <div class="kri-tile-top">
            <span class="kri-code">${escapeHtml(kriCode)}</span>
            <span class="kri-risk-indicator" aria-label="Risk level ${escapeHtml(riskLabel)}">
              <span class="kri-risk-label">${escapeHtml(riskLabel)}</span>
            </span>
          </div>
          <h3 class="kri-name">${escapeHtml(riskName)}</h3>
          <div class="kri-tile-footer">
            <div class="kri-performance kri-performance-${performanceLevel}">
              <span class="kri-performance-icon">${kriPerformanceIcon(performanceLevel)}</span>
              <span class="kri-performance-copy">
                <strong>${escapeHtml(performanceCategory)}</strong>
                <small>${escapeHtml(performanceLabel)}</small>
              </span>
            </div>
            <span class="kri-tile-chevron" aria-hidden="true">→</span>
          </div>
        </article>
      `;
    })
    .join("");
}
function firstRecord(value) {
  if (Array.isArray(value)) return value[0] || {};
  return value && typeof value === "object" ? value : {};
}

function normalizeGrcText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizeGrcDisplayOrder(value, fallbackOrder) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim())
  ) {
    return fallbackOrder;
  }

  const displayOrder = Number(value);
  return Number.isFinite(displayOrder) ? displayOrder : fallbackOrder;
}

function normalizeGrcCategories(categories) {
  if (!Array.isArray(categories)) return [];

  return categories
    .map((category, index) => ({
      ...category,
      grc_code: normalizeGrcText(category?.grc_code),
      grc_short_name: normalizeGrcText(category?.grc_short_name),
      grc_name: normalizeGrcText(category?.grc_name),
      display_order: normalizeGrcDisplayOrder(
        category?.display_order,
        categories.length + index + 1
      )
    }))
    .sort((a, b) => a.display_order - b.display_order);
}

function normalizeGrcIndicators(indicators) {
  if (!Array.isArray(indicators)) return [];

  return indicators
    .map((indicator, index) => ({
      ...indicator,
      indicator_id: normalizeGrcText(indicator?.indicator_id),
      grc_code: normalizeGrcText(indicator?.grc_code),
      indicator_name: normalizeGrcText(indicator?.indicator_name),
      target: normalizeGrcText(indicator?.target),
      performance_level: normalizeGrcText(indicator?.performance_level),
      performance_label: normalizeGrcText(indicator?.performance_label),
      performance_detail: normalizeGrcText(indicator?.performance_detail),
      last_update: normalizeGrcText(indicator?.last_update),
      display_order: normalizeGrcDisplayOrder(
        indicator?.display_order,
        indicators.length + index + 1
      )
    }))
    .sort((a, b) => a.display_order - b.display_order);
}

function normalizeGrcNullableNumber(value) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

  const number = Number(String(value).replaceAll(",", "").trim());
  return Number.isFinite(number) ? number : null;
}

function normalizeGrcValuePerformance(metrics) {
  if (!Array.isArray(metrics)) return [];

  return metrics
    .map((metric, index) => ({
      ...metric,
      metric_id: normalizeGrcText(metric?.metric_id),
      indicator_id: normalizeGrcText(metric?.indicator_id),
      value_type: normalizeGrcText(metric?.value_type).toUpperCase(),
      metric_group: normalizeGrcText(metric?.metric_group).toLowerCase(),
      metric_name: normalizeGrcText(metric?.metric_name),
      target_value: normalizeGrcNullableNumber(metric?.target_value),
      target_note: normalizeGrcText(metric?.target_note),
      performance_value: normalizeGrcNullableNumber(metric?.performance_value),
      performance_note: normalizeGrcText(metric?.performance_note),
      unit: normalizeGrcText(metric?.unit),
      performance_direction: normalizeGrcText(metric?.performance_direction).toLowerCase(),
      parent_metric_id: normalizeGrcText(metric?.parent_metric_id),
      parent_metric_name: normalizeGrcText(metric?.parent_metric_name),
      submetric_order: normalizeGrcNullableNumber(metric?.submetric_order),
      update_date: normalizeGrcText(metric?.update_date),
      display_order: normalizeGrcDisplayOrder(
        metric?.display_order,
        metrics.length + index + 1
      )
    }))
    .sort((a, b) => a.display_order - b.display_order);
}

function normalizeGrcData(grc) {
  const source = grc && typeof grc === "object" ? grc : {};

  return {
    categories: normalizeGrcCategories(source.categories),
    indicators: normalizeGrcIndicators(source.indicators),
    value_performance: normalizeGrcValuePerformance(source.value_performance)
  };
}

function getGrcCategories() {
  return Array.isArray(briefingData?.grc?.categories)
    ? [...briefingData.grc.categories]
    : [];
}

function getGrcIndicators() {
  return Array.isArray(briefingData?.grc?.indicators)
    ? [...briefingData.grc.indicators]
    : [];
}

function getGrcIndicatorsByCode(grcCode) {
  const code = normalizeGrcText(grcCode);
  if (!code) return [];

  return getGrcIndicators().filter((indicator) => indicator.grc_code === code);
}

function getGrcValuePerformance() {
  return Array.isArray(briefingData?.grc?.value_performance)
    ? [...briefingData.grc.value_performance]
    : [];
}

function getGrcValuePerformanceByType(valueType) {
  const type = normalizeGrcText(valueType).toUpperCase();
  if (!type) return [];

  return getGrcValuePerformance().filter((metric) => metric.value_type === type);
}

function groupGrcValuePerformance(metrics) {
  const source = Array.isArray(metrics) ? metrics : [];
  const parentCounts = source.reduce((counts, metric) => {
    const parentId = normalizeGrcText(metric?.parent_metric_id);
    if (!parentId) return counts;

    const key = `${normalizeGrcText(metric?.value_type)}|${normalizeGrcText(metric?.indicator_id)}|${parentId}`;
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());
  const compositeGroups = new Map();
  const displayGroups = [];

  source.forEach((metric, sourceIndex) => {
    const parentId = normalizeGrcText(metric?.parent_metric_id);
    const parentKey = `${normalizeGrcText(metric?.value_type)}|${normalizeGrcText(metric?.indicator_id)}|${parentId}`;
    const isComposite = parentId && parentCounts.get(parentKey) > 1;

    if (!isComposite) {
      displayGroups.push({
        display_metric_id: metric.metric_id,
        display_name: metric.metric_name,
        is_composite: false,
        metric_group: metric.metric_group,
        display_order: metric.display_order,
        source_index: sourceIndex,
        submetrics: [metric]
      });
      return;
    }

    let group = compositeGroups.get(parentKey);
    if (!group) {
      group = {
        display_metric_id: parentId,
        display_name: metric.parent_metric_name || metric.metric_name || parentId,
        is_composite: true,
        metric_group: metric.metric_group,
        display_order: metric.display_order,
        source_index: sourceIndex,
        submetrics: []
      };
      compositeGroups.set(parentKey, group);
      displayGroups.push(group);
    }

    group.submetrics.push(metric);
    if (!group.display_name && metric.parent_metric_name) group.display_name = metric.parent_metric_name;
    if (metric.display_order < group.display_order) group.display_order = metric.display_order;
  });

  displayGroups.forEach((group) => {
    group.submetrics.sort((a, b) => {
      const orderA = Number.isFinite(a.submetric_order) ? a.submetric_order : a.display_order;
      const orderB = Number.isFinite(b.submetric_order) ? b.submetric_order : b.display_order;
      return orderA - orderB || a.display_order - b.display_order;
    });
  });

  return displayGroups.sort(
    (a, b) => a.display_order - b.display_order || a.source_index - b.source_index
  );
}

function parseGrcUpdateDate(value) {
  const text = normalizeGrcText(value);
  if (!text) return null;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (dateOnlyMatch) {
    const [, yearText, monthText, dayText] = dateOnlyMatch;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }

    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getLatestGrcUpdateDate(indicators) {
  return indicators.reduce((latestDate, indicator) => {
    const date = parseGrcUpdateDate(indicator?.last_update);
    return date && (!latestDate || date > latestDate) ? date : latestDate;
  }, null);
}

function formatGrcUpdateDate(date) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function grcStatusIcon(status) {
  const icons = {
    achieved:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 18.5 6v5.2c0 4.1-2.6 7.8-6.5 9.3-3.9-1.5-6.5-5.2-6.5-9.3V6L12 3.5Z"></path><path d="m9.2 12 1.8 1.8 3.9-4.2"></path></svg>',
    on_track:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 3.5V6M20.5 12H18M12 18v2.5M6 12H3.5"></path></svg>',
    mixed:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 17H3L12 3Z"></path><path d="M12 9v4M12 17h.01"></path></svg>',
    not_meet:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 18.5 6v5.2c0 4.1-2.6 7.8-6.5 9.3-3.9-1.5-6.5-5.2-6.5-9.3V6L12 3.5Z"></path><path d="m9.5 9.5 5 5M14.5 9.5l-5 5"></path></svg>',
    other:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 8v4M12 16h.01"></path></svg>'
  };

  return icons[status] || icons.other;
}

function grcSnapshotMetricIcon(type) {
  if (type === "categories") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h5l1.5 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z"></path><path d="M7.5 11h9M7.5 15h6"></path></svg>';
  }

  return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2.5"></rect><path d="M8 8h8M8 12h8M8 16h5"></path></svg>';
}

function renderGrcSnapshot() {
  const section = document.querySelector("#grc-snapshot-section");
  const container = document.querySelector("#grc-snapshot");
  const latestElement = document.querySelector("#grc-snapshot-latest");
  if (!section || !container) return;

  const categories = getGrcCategories();
  const indicators = getGrcIndicators();

  if (categories.length === 0 && indicators.length === 0) {
    container.innerHTML = "";
    if (latestElement) latestElement.textContent = "ข้อมูลล่าสุด: —";
    section.hidden = true;
    return;
  }

  const statuses = getGrcDisplayStatuses(indicators);
  const statusCounts = getGrcStatusCounts(indicators);
  const statusData = statuses.map((status) => ({
    ...status,
    count: status.count ?? statusCounts[status.key] ?? 0
  }));
  const totalIndicators = indicators.length;
  const latestUpdate = formatGrcUpdateDate(getLatestGrcUpdateDate(indicators));
  const distributionLabel = statusData
    .map((status) => `${status.label} ${status.count}`)
    .join(", ");

  if (latestElement) latestElement.textContent = `ข้อมูลล่าสุด: ${latestUpdate}`;

  container.innerHTML = `
    <div class="grc-snapshot-counts" aria-label="GRC data totals">
      <article class="grc-count-metric grc-count-categories">
        <span class="grc-count-icon">${grcSnapshotMetricIcon("categories")}</span>
        <span class="grc-count-copy">
          <strong>${categories.length}</strong>
          <b>Categories</b>
          <small>หมวดการกำกับดูแล</small>
        </span>
      </article>
      <article class="grc-count-metric grc-count-indicators">
        <span class="grc-count-icon">${grcSnapshotMetricIcon("indicators")}</span>
        <span class="grc-count-copy">
          <strong>${indicators.length}</strong>
          <b>Indicators</b>
          <small>ตัวชี้วัดสำคัญ</small>
        </span>
      </article>
    </div>

    <div class="grc-snapshot-status-summary">
      <p class="grc-snapshot-panel-label">Status Overview</p>
      <div class="grc-snapshot-statuses">
        ${statusData
          .map((status) => {
            return `
              <div class="grc-status-item grc-status-${status.key.replaceAll("_", "-")}">
                <span class="grc-status-icon">${grcStatusIcon(status.key)}</span>
                <span class="grc-status-copy">
                  <strong>${status.count}</strong>
                  <b>${escapeHtml(status.label)}</b>
                  <small>${escapeHtml(status.labelTh)}</small>
                </span>
              </div>
            `;
          })
          .join("")}
      </div>
      <div class="grc-status-distribution" role="img" aria-label="สัดส่วนสถานะ GRC: ${escapeHtml(distributionLabel)}">
        ${totalIndicators > 0
          ? statusData
              .map((status) => {
                const percentage = (status.count / totalIndicators) * 100;
                const visibleLabel = percentage >= 8 ? `${Math.round(percentage)}%` : "";
                return `<span class="grc-status-segment grc-status-segment-${status.key.replaceAll("_", "-")}" style="--grc-segment-size:${percentage}%" title="${escapeHtml(status.label)} ${Math.round(percentage)}%">${visibleLabel}</span>`;
              })
              .join("")
          : '<span class="grc-status-distribution-empty">ยังไม่มีข้อมูลสถานะ</span>'}
      </div>
    </div>
  `;

  section.hidden = false;
}

function getGrcPrimaryStatuses() {
  return [
    { key: "achieved", label: "Achieved", labelTh: "บรรลุเป้าหมาย" },
    { key: "on_track", label: "On Track", labelTh: "เป็นไปตามเป้าหมาย" },
    { key: "mixed", label: "Mixed", labelTh: "ต้องติดตาม" },
    { key: "not_meet", label: "Not Meet", labelTh: "ไม่เป็นไปตามเป้าหมาย" }
  ];
}

function getGrcStatusMeta(status) {
  const level = normalizeGrcText(status);
  const known = getGrcPrimaryStatuses().find((item) => item.key === level);

  return known || {
    key: "other",
    label: "Other",
    labelTh: "ไม่ระบุ"
  };
}

function getGrcStatusCounts(indicators) {
  return indicators.reduce((counts, indicator) => {
    const level = indicator.performance_level;
    counts[level] = (counts[level] || 0) + 1;
    return counts;
  }, {});
}

function getGrcDisplayStatuses(indicators) {
  const primaryStatuses = getGrcPrimaryStatuses();
  const primaryKeys = new Set(primaryStatuses.map((status) => status.key));
  const statusCounts = getGrcStatusCounts(indicators);
  const otherCount = indicators.reduce(
    (count, indicator) => count + (primaryKeys.has(indicator.performance_level) ? 0 : 1),
    0
  );

  return otherCount > 0
    ? [...primaryStatuses, { key: "other", label: "Other", labelTh: "ไม่ระบุ", count: otherCount }]
    : primaryStatuses;
}

function formatGrcStatusKeyLabel(status) {
  const words = normalizeGrcText(status)
    .split(/[\s_-]+/)
    .filter(Boolean);

  return words.length > 0
    ? words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    : "Unspecified";
}

function getGrcCategoryStatusBadges(indicators) {
  const counts = getGrcStatusCounts(indicators);
  const primaryStatuses = getGrcPrimaryStatuses();
  const primaryKeys = new Set(primaryStatuses.map((status) => status.key));
  const knownBadges = primaryStatuses
    .map((status) => ({ ...status, count: counts[status.key] || 0, styleKey: status.key }))
    .filter((status) => status.count > 0);
  const otherBadges = Object.entries(counts)
    .filter(([key, count]) => normalizeGrcText(key) && !primaryKeys.has(key) && count > 0)
    .map(([key, count]) => ({
      key,
      styleKey: "other",
      label: formatGrcStatusKeyLabel(key),
      count
    }));

  return [...knownBadges, ...otherBadges];
}

function formatGrcIndicatorDate(value) {
  return formatGrcUpdateDate(parseGrcUpdateDate(value));
}

function getGrcCategoryLookup(categories = getGrcCategories()) {
  return new Map(categories.map((category) => [category.grc_code, category]));
}

function getGrcCategoryReference(indicator, categoryLookup) {
  const category = categoryLookup.get(indicator.grc_code);
  if (category) {
    return {
      code: category.grc_code,
      label: category.grc_short_name || category.grc_name || category.grc_code,
      badgeLabel: category.grc_short_name || category.grc_code || "GRC"
    };
  }

  return {
    code: indicator.grc_code,
    label: indicator.grc_code || "ไม่พบข้อมูลหมวด GRC",
    badgeLabel: indicator.grc_code || "GRC"
  };
}

function formatGrcDetailText(value) {
  return escapeHtml(normalizeGrcText(value)).replace(/\r?\n/g, "<br>");
}

function getGrcCategoryVisual(grcCode) {
  const visuals = {
    "1": {
      theme: "governance",
      icon: '<svg viewBox="0 0 24 24"><path d="M3.5 20.5h17M5 18h14M6.5 9.5v7M10.2 9.5v7M13.8 9.5v7M17.5 9.5v7M4.5 8l7.5-4.5L19.5 8H4.5Z"></path></svg>'
    },
    "2": {
      theme: "fairness",
      icon: '<svg viewBox="0 0 24 24"><path d="M12 4v16M7 20h10M5 7h14M7 7l-3 6h6L7 7ZM17 7l-3 6h6l-3-6Z"></path><path d="M4 13c.5 1.5 1.5 2.3 3 2.3s2.5-.8 3-2.3M14 13c.5 1.5 1.5 2.3 3 2.3s2.5-.8 3-2.3"></path></svg>'
    },
    "3": {
      theme: "reporting",
      icon: '<svg viewBox="0 0 24 24"><path d="M6 3.5h9l3 3V20.5H6V3.5Z"></path><path d="M15 3.5V7h3M9 16v-3M12 16v-5M15 16V9M8.5 17.5h7"></path></svg>'
    },
    "4": {
      theme: "control",
      icon: '<svg viewBox="0 0 24 24"><path d="M12 3.5 18.5 6v5.2c0 4.1-2.6 7.8-6.5 9.3-3.9-1.5-6.5-5.2-6.5-9.3V6L12 3.5Z"></path><path d="m9.2 12 1.8 1.8 3.9-4.2"></path></svg>'
    },
    "5": {
      theme: "compliance",
      icon: '<svg viewBox="0 0 24 24"><path d="M8 4.5h8M9 3h6v3H9V3ZM6 5.5h12v15H6v-15Z"></path><path d="m9 12 1.5 1.5 3-3M9 17h6"></path></svg>'
    }
  };

  return visuals[normalizeGrcText(grcCode)] || {
    theme: "default",
    icon: '<svg viewBox="0 0 24 24"><path d="M3.5 7.5h6l2-2h9v13h-17v-11Z"></path><path d="M3.5 10h17"></path></svg>'
  };
}

function renderGrcPageSummary(categories, indicators) {
  const container = document.querySelector("#grc-page-summary");
  const statusCounts = getGrcStatusCounts(indicators);
  const statuses = getGrcDisplayStatuses(indicators);
  const latestUpdate = formatGrcUpdateDate(getLatestGrcUpdateDate(indicators));

  container.innerHTML = `
    <div class="grc-summary-metrics" aria-label="GRC data totals">
      <section class="grc-summary-card grc-summary-metric grc-summary-metric-categories">
        <span class="grc-summary-metric-label"><small>หมวด GRC</small><b>Categories</b></span>
        <div class="grc-summary-metric-main">
          <strong>${categories.length}</strong>
          <span class="grc-summary-total-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3.5 7.5h6l2-2h9v13h-17v-11Z"></path><path d="M3.5 10h17"></path></svg>
          </span>
        </div>
      </section>
      <section class="grc-summary-card grc-summary-metric grc-summary-metric-indicators">
        <span class="grc-summary-metric-label"><small>ตัวชี้วัด</small><b>Indicators</b></span>
        <div class="grc-summary-metric-main">
          <strong>${indicators.length}</strong>
          <span class="grc-summary-total-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M7 3.5h10l3 3V21H7V3.5Z"></path><path d="M17 3.5V7h3M10 11h7M10 15h7"></path></svg>
          </span>
        </div>
      </section>
    </div>

    <section class="grc-summary-card grc-summary-statuses" aria-label="GRC performance status summary">
      <p class="grc-summary-label">สถานะการดำเนินงาน <span>(Indicators)</span></p>
      <div class="grc-summary-status-grid">
        ${statuses
          .map((status) => {
            const count = status.count ?? statusCounts[status.key] ?? 0;
            return `
              <div class="grc-summary-status grc-status-${status.key.replaceAll("_", "-")}">
                <span class="grc-status-icon">${grcStatusIcon(status.key)}</span>
                <strong>${count}</strong>
                <span><b>${escapeHtml(status.label)}</b><small>${escapeHtml(status.labelTh)}</small></span>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>

    <section class="grc-summary-card grc-summary-latest" aria-label="อัปเดตล่าสุด">
      <small class="grc-summary-latest-label">อัปเดตล่าสุด</small>
      <div class="grc-summary-latest-main">
        <span class="grc-update-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"></rect><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17"></path><path d="M8 13h3M8 16h6"></path></svg>
        </span>
        <strong>${escapeHtml(latestUpdate)}</strong>
      </div>
    </section>
  `;
}

function formatGrcValueNumber(value) {
  if (!Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(value);
}

function formatGrcValueWithUnit(value, unit) {
  const formatted = formatGrcValueNumber(value);
  const cleanUnit = normalizeGrcText(unit);
  return cleanUnit ? `${formatted} ${cleanUnit}` : formatted;
}

function getGrcValueAchievement(metric) {
  const actual = metric.performance_value;
  const target = metric.target_value;
  const direction = metric.performance_direction === "lower" ? "lower" : "higher";

  if (!Number.isFinite(actual) || !Number.isFinite(target) || target <= 0) {
    return "";
  }

  if (direction === "lower" && actual <= 0) {
    return "บรรลุเป้าหมาย";
  }

  const achievementPercent = direction === "lower"
    ? (target / actual) * 100
    : (actual / target) * 100;

  return Number.isFinite(achievementPercent)
    ? `${achievementPercent.toFixed(1)}% ของเป้าหมาย`
    : "";
}

function getGrcValuePresentation(metric) {
  const actual = metric.performance_value;
  const target = metric.target_value;
  const hasActual = Number.isFinite(actual);
  const hasTarget = Number.isFinite(target) && target > 0;
  const direction = metric.performance_direction === "lower" ? "lower" : "higher";

  if (!hasActual) {
    return { key: "pending", label: "รอผลการดำเนินงาน", achievement: "" };
  }

  if (!hasTarget) {
    return { key: "neutral", label: "ยังไม่มีค่าเป้าหมาย", achievement: "" };
  }

  const met = direction === "lower" ? actual <= target : actual >= target;

  return {
    key: met ? "met" : "below",
    label: met ? "บรรลุเป้าหมาย" : direction === "lower" ? "ยังสูงกว่าเป้าหมาย" : "ยังต่ำกว่าเป้าหมาย",
    achievement: getGrcValueAchievement(metric)
  };
}

function getGrcValueGroupPresentation(group) {
  const submetrics = Array.isArray(group?.submetrics) ? group.submetrics : [];
  const states = submetrics.map((metric) => getGrcValuePresentation(metric).key);
  const metCount = states.filter((state) => state === "met").length;
  const hasFailure = states.includes("below");
  const hasPending = states.some((state) => state === "pending" || state === "neutral");
  const key = hasFailure ? "below" : hasPending || states.length === 0 ? "pending" : "met";

  return {
    key,
    label: key === "met"
      ? "บรรลุเป้าหมาย"
      : key === "below"
        ? "ยังไม่บรรลุเป้าหมาย"
        : "รอผลบางองค์ประกอบ",
    metCount,
    totalCount: submetrics.length,
    summary: `${metCount} / ${submetrics.length} องค์ประกอบบรรลุเป้าหมาย`
  };
}

function getGrcValueSubmetricStatusLabel(presentationKey) {
  if (presentationKey === "met") return "บรรลุเป้าหมาย";
  if (presentationKey === "below") return "ยังไม่ถึงเป้าหมาย";
  return "รอผล";
}

function getLatestGrcValueUpdateDate(metrics) {
  return (Array.isArray(metrics) ? metrics : []).reduce((latestDate, metric) => {
    const date = parseGrcUpdateDate(metric?.update_date);
    return date && (!latestDate || date > latestDate) ? date : latestDate;
  }, null);
}

function getGrcValueChart(metric) {
  const actual = metric.performance_value;
  const target = metric.target_value;
  const hasActual = Number.isFinite(actual);
  const hasTarget = Number.isFinite(target);
  const direction = metric.performance_direction === "lower" ? "lower" : "higher";
  const safeActual = hasActual ? Math.max(0, actual) : null;
  const safeTarget = hasTarget ? Math.max(0, target) : null;
  const isTargetMet = hasActual && hasTarget && (
    direction === "lower" ? actual <= target : actual >= target
  );
  let scaleMax = 1;

  if (hasActual && hasTarget) {
    if (direction === "lower") {
      scaleMax = actual > target
        ? safeActual * 1.08
        : actual === target
          ? safeTarget
          : safeTarget * 1.08;
    } else {
      scaleMax = actual < target ? safeTarget : safeActual;
    }
  } else if (hasActual) {
    scaleMax = safeActual * 1.08;
  } else if (hasTarget) {
    scaleMax = safeTarget * 1.08;
  }

  scaleMax = Math.max(scaleMax, 1);

  return {
    actualPercent: hasActual
      ? isTargetMet
        ? 100
        : Math.min(100, Math.max(0, (safeActual / scaleMax) * 100))
      : null,
    targetPercent: hasTarget
      ? Math.min(100, Math.max(0, (safeTarget / scaleMax) * 100))
      : null
  };
}

function renderGrcValueBar(metric, compact = false) {
  const presentation = getGrcValuePresentation(metric);
  const chart = getGrcValueChart(metric);
  const actualStyle = chart.actualPercent === null ? "" : ` style="width:${chart.actualPercent.toFixed(2)}%"`;
  const targetStyle = chart.targetPercent === null ? "" : ` style="left:${chart.targetPercent.toFixed(2)}%"`;
  const targetEdgeClass = chart.targetPercent === null
    ? ""
    : chart.targetPercent >= 99
      ? " is-end"
      : chart.targetPercent <= 1
        ? " is-start"
        : "";

  return `
    <div class="grc-value-bar grc-value-state-${presentation.key}${compact ? " grc-value-bar-compact" : ""}" aria-label="Actual ${escapeHtml(formatGrcValueNumber(metric.performance_value))}; Target ${escapeHtml(formatGrcValueNumber(metric.target_value))}">
      <span class="grc-value-bar-track">
        ${chart.actualPercent === null ? "" : `<span class="grc-value-bar-fill"${actualStyle}></span>`}
        ${chart.targetPercent === null ? "" : `<span class="grc-value-target-marker${targetEdgeClass}"${targetStyle}></span>`}
      </span>
      ${compact ? "" : `<span class="grc-value-bar-labels"><small>0</small>${chart.targetPercent === null ? "" : `<small class="grc-value-target-label${targetEdgeClass}"${targetStyle}>Target</small>`}</span>`}
    </div>
  `;
}

function renderGrcCompactValueGroup(group) {
  if (!group.is_composite) {
    const metric = group.submetrics[0];
    return `
      <div class="grc-compact-value-row">
        <strong>${escapeHtml(metric.metric_name || metric.metric_id || "ไม่ระบุ")}</strong>
        <span>
          <b>${escapeHtml(formatGrcValueWithUnit(metric.performance_value, metric.unit))}</b>
          <small>Target ${escapeHtml(formatGrcValueWithUnit(metric.target_value, metric.unit))}</small>
        </span>
        ${renderGrcValueBar(metric, true)}
      </div>
    `;
  }

  const aggregate = getGrcValueGroupPresentation(group);
  return `
    <div class="grc-compact-value-row grc-compact-value-composite grc-value-state-${aggregate.key}">
      <strong>${escapeHtml(group.display_name || group.display_metric_id || "ไม่ระบุ")}</strong>
      <span class="grc-compact-value-aggregate">
        <b>${aggregate.metCount}/${aggregate.totalCount} บรรลุเป้าหมาย</b>
        <small>${escapeHtml(aggregate.label)}</small>
      </span>
      <i class="grc-compact-value-status-cue" aria-hidden="true"></i>
    </div>
  `;
}

function renderGrcCompactValuePreview(metrics, valueType) {
  const label = valueType === "VE" ? "Value Enhancement" : "Value Creation";
  const displayGroups = groupGrcValuePerformance(metrics);
  const previewGroups = displayGroups.slice(0, 2);

  return `
    <div class="grc-compact-value-preview">
      <span class="grc-compact-value-heading">ผลการดำเนินงาน</span>
      <div class="grc-compact-value-list">
        ${previewGroups.map(renderGrcCompactValueGroup).join("")}
      </div>
      <div class="grc-compact-value-footer">
        <span>${label}: ${displayGroups.length} metrics</span>
        <button type="button" data-grc-value-open="${valueType}">ดูรายละเอียด <span aria-hidden="true">→</span></button>
      </div>
    </div>
  `;
}

function renderGrcFullValueMetricRow(metric, nested = false) {
  const presentation = getGrcValuePresentation(metric);
  const hasActual = Number.isFinite(metric.performance_value);
  const actualText = hasActual
    ? formatGrcValueWithUnit(metric.performance_value, metric.unit)
    : metric.performance_note || "ยังไม่มีผลตัวเลข";

  return `
    <div class="grc-full-value-row grc-value-state-${presentation.key}${nested ? " grc-full-value-submetric" : ""}">
      <div class="grc-full-value-row-header">
        <strong>${escapeHtml(metric.metric_name || metric.metric_id || "ไม่ระบุ")}</strong>
        <span>${escapeHtml(nested ? getGrcValueSubmetricStatusLabel(presentation.key) : presentation.label)}</span>
      </div>
      <div class="grc-full-value-comparison">
        <b class="${hasActual ? "" : "is-pending"}">${escapeHtml(actualText)}</b>
        <small>Target ${escapeHtml(formatGrcValueWithUnit(metric.target_value, metric.unit))}</small>
      </div>
      ${renderGrcValueBar(metric, true)}
      ${metric.target_note ? `<p class="grc-full-value-note"><span>ที่มาเป้าหมาย</span>${escapeHtml(metric.target_note)}</p>` : ""}
    </div>
  `;
}

function renderGrcFullValueComposite(group) {
  const aggregate = getGrcValueGroupPresentation(group);
  return `
    <section class="grc-full-value-composite grc-value-state-${aggregate.key}">
      <header class="grc-full-value-composite-header">
        <span class="grc-value-metric-id">${escapeHtml(group.display_metric_id || "—")}</span>
        <span class="grc-value-state-label">${escapeHtml(aggregate.label)}</span>
      </header>
      <h5>${escapeHtml(group.display_name || group.display_metric_id || "ไม่ระบุ")}</h5>
      <small class="grc-full-value-composite-count">${aggregate.totalCount} องค์ประกอบ</small>
      <div class="grc-full-value-composite-list">
        ${group.submetrics.map((metric) => renderGrcFullValueMetricRow(metric, true)).join("")}
      </div>
      <footer><strong>สถานะรวม</strong><span>${escapeHtml(aggregate.summary)}</span></footer>
    </section>
  `;
}

function renderGrcFullValuePreview(metrics, valueType) {
  const label = valueType === "VE" ? "Value Enhancement" : "Value Creation";
  const displayGroups = groupGrcValuePerformance(metrics);
  const groupLabels = {
    financial: { title: "ด้านการเงิน", subtitle: "Financial" },
    non_financial: { title: "ด้านที่ไม่ใช่การเงิน", subtitle: "Non-Financial" }
  };

  const content = valueType === "VE"
    ? [
        ...Object.keys(groupLabels),
        ...new Set(displayGroups.map((group) => group.metric_group).filter((group) => !groupLabels[group]))
      ]
        .map((group) => {
          const groupMetrics = displayGroups.filter((displayGroup) => displayGroup.metric_group === group);
          if (groupMetrics.length === 0) return "";
          const groupLabel = groupLabels[group] || { title: group || "อื่น ๆ", subtitle: "Other" };

          return `
            <section class="grc-full-value-group">
              <h4>${escapeHtml(groupLabel.title)} <small>${escapeHtml(groupLabel.subtitle)}</small></h4>
              <div class="grc-full-value-list">${groupMetrics.map((displayGroup) => displayGroup.is_composite ? renderGrcFullValueComposite(displayGroup) : renderGrcFullValueMetricRow(displayGroup.submetrics[0])).join("")}</div>
            </section>
          `;
        })
        .join("")
    : `<div class="grc-full-value-list">${displayGroups.map((displayGroup) => displayGroup.is_composite ? renderGrcFullValueComposite(displayGroup) : renderGrcFullValueMetricRow(displayGroup.submetrics[0])).join("")}</div>`;

  return `
    <div class="grc-full-value-preview">
      <span class="grc-full-value-heading">ผลการดำเนินงาน ${label}</span>
      ${content}
    </div>
  `;
}

function renderGrcValueMetricCard(metric) {
  const presentation = getGrcValuePresentation(metric);
  const actualText = Number.isFinite(metric.performance_value)
    ? formatGrcValueNumber(metric.performance_value)
    : "ยังไม่มีผลตัวเลข";
  const date = formatGrcUpdateDate(parseGrcUpdateDate(metric.update_date));

  return `
    <article class="grc-value-card grc-value-state-${presentation.key}">
      <header class="grc-value-card-header">
        <span class="grc-value-metric-id">${escapeHtml(metric.metric_id || "—")}</span>
        <span class="grc-value-state-label">${escapeHtml(presentation.label)}</span>
      </header>
      <h3>${escapeHtml(metric.metric_name || "ไม่ระบุชื่อตัวชี้วัด")}</h3>
      <div class="grc-value-actual${Number.isFinite(metric.performance_value) ? "" : " is-pending"}">
        <strong>${escapeHtml(actualText)}</strong>
        ${Number.isFinite(metric.performance_value) && metric.unit ? `<span>${escapeHtml(metric.unit)}</span>` : ""}
      </div>
      ${presentation.achievement ? `<p class="grc-value-delta">${escapeHtml(presentation.achievement)}</p>` : ""}
      ${!Number.isFinite(metric.performance_value) && metric.performance_note ? `<p class="grc-value-pending-note">${escapeHtml(metric.performance_note)}</p>` : ""}
      ${renderGrcValueBar(metric)}
      <dl class="grc-value-card-meta">
        <div><dt>Target</dt><dd>${escapeHtml(formatGrcValueWithUnit(metric.target_value, metric.unit))}</dd></div>
        ${metric.target_note ? `<div><dt>ที่มาเป้าหมาย</dt><dd>${escapeHtml(metric.target_note)}</dd></div>` : ""}
        ${Number.isFinite(metric.performance_value) && metric.performance_note ? `<div><dt>หมายเหตุผลการดำเนินงาน</dt><dd>${escapeHtml(metric.performance_note)}</dd></div>` : ""}
      </dl>
      ${date !== "—" ? `<time class="grc-value-update" datetime="${escapeHtml(metric.update_date)}">อัปเดตล่าสุด ${escapeHtml(date)}</time>` : ""}
    </article>
  `;
}

function renderGrcValueCompositeSubmetric(metric, index) {
  const presentation = getGrcValuePresentation(metric);
  const hasActual = Number.isFinite(metric.performance_value);
  const actualText = hasActual
    ? formatGrcValueNumber(metric.performance_value)
    : "ยังไม่มีผลตัวเลข";
  const date = formatGrcUpdateDate(parseGrcUpdateDate(metric.update_date));

  return `
    <section class="grc-value-composite-submetric grc-value-state-${presentation.key}">
      <header>
        <span>องค์ประกอบ ${index + 1}</span>
        <strong>${escapeHtml(metric.metric_name || metric.metric_id || "ไม่ระบุ")}</strong>
        <em>${escapeHtml(getGrcValueSubmetricStatusLabel(presentation.key))}</em>
      </header>
      <div class="grc-value-actual${hasActual ? "" : " is-pending"}">
        <strong>${escapeHtml(actualText)}</strong>
        ${hasActual && metric.unit ? `<span>${escapeHtml(metric.unit)}</span>` : ""}
      </div>
      ${presentation.achievement ? `<p class="grc-value-delta">${escapeHtml(presentation.achievement)}</p>` : ""}
      ${!hasActual && metric.performance_note ? `<p class="grc-value-pending-note">${escapeHtml(metric.performance_note)}</p>` : ""}
      ${renderGrcValueBar(metric)}
      <dl class="grc-value-card-meta">
        <div><dt>Target</dt><dd>${escapeHtml(formatGrcValueWithUnit(metric.target_value, metric.unit))}</dd></div>
        ${metric.target_note ? `<div><dt>ที่มาเป้าหมาย</dt><dd>${escapeHtml(metric.target_note)}</dd></div>` : ""}
        ${hasActual && metric.performance_note ? `<div><dt>หมายเหตุผลการดำเนินงาน</dt><dd>${escapeHtml(metric.performance_note)}</dd></div>` : ""}
      </dl>
      ${date !== "—" ? `<time class="grc-value-update" datetime="${escapeHtml(metric.update_date)}">อัปเดตล่าสุด ${escapeHtml(date)}</time>` : ""}
    </section>
  `;
}

function renderGrcValueCompositeCard(group) {
  const aggregate = getGrcValueGroupPresentation(group);
  const latestDateText = formatGrcUpdateDate(getLatestGrcValueUpdateDate(group.submetrics));

  return `
    <article class="grc-value-card grc-value-composite-card grc-value-state-${aggregate.key}">
      <header class="grc-value-card-header">
        <span class="grc-value-metric-id">${escapeHtml(group.display_metric_id || "—")}</span>
        <span class="grc-value-state-label">${escapeHtml(aggregate.label)}</span>
      </header>
      <h3>${escapeHtml(group.display_name || group.display_metric_id || "ไม่ระบุชื่อตัวชี้วัด")}</h3>
      <p class="grc-value-composite-count">${aggregate.totalCount} องค์ประกอบ</p>
      <div class="grc-value-composite-submetrics">
        ${group.submetrics.map(renderGrcValueCompositeSubmetric).join("")}
      </div>
      <footer class="grc-value-composite-summary">
        <span><strong>สถานะรวม</strong>${escapeHtml(aggregate.summary)}</span>
        ${latestDateText !== "—" ? `<time>อัปเดตล่าสุด ${escapeHtml(latestDateText)}</time>` : ""}
      </footer>
    </article>
  `;
}

function renderGrcValueDisplayCard(group) {
  return group.is_composite
    ? renderGrcValueCompositeCard(group)
    : renderGrcValueMetricCard(group.submetrics[0]);
}

function renderGrcValuePerformance() {
  const container = document.querySelector("#grc-value-performance-content");
  if (!container) return;

  const type = grcValuePerformanceType === "VE" ? "VE" : "VC";
  const metrics = getGrcValuePerformanceByType(type);
  const displayGroups = groupGrcValuePerformance(metrics);
  document.querySelectorAll("[data-grc-value-type]").forEach((button) => {
    const active = button.dataset.grcValueType === type;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  if (metrics.length === 0) {
    container.innerHTML = '<p class="grc-value-empty">ยังไม่มีข้อมูล Value Performance สำหรับแสดงผล</p>';
    return;
  }

  if (type === "VC") {
    container.innerHTML = `<div class="grc-value-card-grid grc-value-card-grid-vc">${displayGroups.map(renderGrcValueDisplayCard).join("")}</div>`;
    return;
  }

  const groupLabels = {
    financial: { title: "ด้านการเงิน", subtitle: "Financial Performance" },
    non_financial: { title: "ด้านที่ไม่ใช่การเงิน", subtitle: "Non-Financial Performance" }
  };
  const orderedGroups = [
    ...Object.keys(groupLabels),
    ...new Set(displayGroups.map((group) => group.metric_group).filter((group) => !groupLabels[group]))
  ];

  container.innerHTML = orderedGroups
    .map((group) => {
      const groupMetrics = displayGroups.filter((displayGroup) => displayGroup.metric_group === group);
      if (groupMetrics.length === 0) return "";
      const label = groupLabels[group] || { title: group || "อื่น ๆ", subtitle: "Other Performance" };
      return `
        <section class="grc-value-group">
          <header><h3>${escapeHtml(label.title)}</h3><p>${escapeHtml(label.subtitle)}</p></header>
          <div class="grc-value-card-grid">${groupMetrics.map(renderGrcValueDisplayCard).join("")}</div>
        </section>
      `;
    })
    .join("");
}

function openGrcValuePerformance(valueType) {
  grcValuePerformanceType = valueType === "VE" ? "VE" : "VC";
  setGrcActiveTab("value");
  requestAnimationFrame(() => {
    document.querySelector("#grc-value-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function renderGrcIndicatorCard(indicator, categoryLookup, compact = false) {
  const status = getGrcStatusMeta(indicator.performance_level);
  const statusLabel = indicator.performance_label || status.labelTh;
  const category = getGrcCategoryReference(indicator, categoryLookup);
  const categoryVisual = getGrcCategoryVisual(category.code);
  const target = normalizeGrcText(indicator.target);
  const performanceDetail = normalizeGrcText(indicator.performance_detail);
  const lastUpdate = formatGrcIndicatorDate(indicator.last_update);
  const valueType = indicator.indicator_id === "7" ? "VE" : indicator.indicator_id === "8" ? "VC" : "";
  const valueMetrics = valueType
    ? getGrcValuePerformance().filter((metric) => metric.indicator_id === indicator.indicator_id && metric.value_type === valueType)
    : [];

  return `
    <article class="grc-indicator-card${compact ? " grc-indicator-card-compact" : ""}">
      <header class="grc-indicator-card-header">
        <div class="grc-indicator-identity">
          <span class="grc-indicator-id">${escapeHtml(indicator.indicator_id || "—")}</span>
          <span class="grc-indicator-category grc-indicator-category-badge grc-category-theme-${categoryVisual.theme}" aria-label="หมวด GRC: ${escapeHtml(category.badgeLabel)}">${escapeHtml(category.badgeLabel)}</span>
        </div>
        <span class="grc-indicator-status grc-status-${status.key.replaceAll("_", "-")}">
          <span class="grc-status-icon">${grcStatusIcon(status.key)}</span>
          <span><strong>${escapeHtml(statusLabel)}</strong><small>${escapeHtml(status.label)}</small></span>
        </span>
      </header>
      <h3>${escapeHtml(indicator.indicator_name || "ไม่มีชื่อตัวชี้วัด")}</h3>
      <p class="grc-indicator-category-name">${escapeHtml(category.label)}</p>
      <div class="grc-indicator-fields">
        ${
          target
            ? `<div class="grc-indicator-field"><span>เป้าหมาย</span><p>${formatGrcDetailText(target)}</p></div>`
            : ""
        }
        ${valueMetrics.length > 0
          ? compact
            ? renderGrcCompactValuePreview(valueMetrics, valueType)
            : renderGrcFullValuePreview(valueMetrics, valueType)
          : performanceDetail
            ? `<div class="grc-indicator-field grc-indicator-detail"><span>ผลการดำเนินงาน</span><p>${formatGrcDetailText(performanceDetail)}</p></div>`
            : ""}
        <div class="grc-indicator-field grc-indicator-date"><span>อัปเดตล่าสุด</span><p>${escapeHtml(lastUpdate)}</p></div>
      </div>
    </article>
  `;
}

function renderGrcCategoryOverview() {
  const container = document.querySelector("#grc-category-list");
  const categories = getGrcCategories();
  const categoryLookup = getGrcCategoryLookup(categories);

  if (categories.length === 0) {
    container.innerHTML = '<p class="grc-page-inline-empty">ยังไม่มีข้อมูลหมวด GRC</p>';
    return;
  }

  const columnHeader = `
    <div class="grc-category-columns" aria-hidden="true">
      <span class="grc-category-column grc-category-column-main"><strong>หมวด GRC</strong><small>GRC Category</small></span>
      <span class="grc-category-column"><strong>ตัวชี้วัด</strong><small>Indicators</small></span>
      <span class="grc-category-column"><strong>สถานะ</strong><small>Status by Indicator</small></span>
      <span class="grc-category-column"><strong>อัปเดตล่าสุด</strong><small>Last Update</small></span>
      <span class="grc-category-column-spacer"></span>
    </div>
  `;

  container.innerHTML = columnHeader + categories
    .map((category, index) => {
      const indicators = getGrcIndicatorsByCode(category.grc_code);
      const statuses = getGrcCategoryStatusBadges(indicators);
      const visual = getGrcCategoryVisual(category.grc_code);
      const isExpanded = grcExpandedCategoryCode === category.grc_code;
      const detailsId = `grc-category-details-${index + 1}`;
      const latestUpdate = formatGrcUpdateDate(getLatestGrcUpdateDate(indicators));

      return `
        <article class="grc-category-card grc-category-theme-${visual.theme}${isExpanded ? " expanded" : ""}">
          <button class="grc-category-toggle" type="button" data-grc-category-toggle="${escapeHtml(category.grc_code)}" aria-expanded="${isExpanded}" aria-controls="${detailsId}">
            <span class="grc-category-icon" aria-hidden="true">
              ${visual.icon}
            </span>
            <span class="grc-category-copy">
              <span class="grc-category-code">GRC ${escapeHtml(category.grc_code)}</span>
              <strong>${escapeHtml(category.grc_short_name || category.grc_name || category.grc_code)}</strong>
              ${category.grc_name ? `<small>${escapeHtml(category.grc_name)}</small>` : ""}
            </span>
            <span class="grc-category-count"><strong>${indicators.length}</strong><small>ตัวชี้วัด</small></span>
            <span class="grc-category-status-mix" aria-label="สถานะตัวชี้วัด">
              <small class="grc-category-mobile-label">สถานะ</small>
              ${
                statuses.length > 0
                  ? statuses
                      .map(
                        (status) =>
                          `<span class="grc-category-status grc-status-${status.styleKey.replaceAll("_", "-")}"><b>${status.count}</b> <span>${escapeHtml(status.label)}</span></span>`
                      )
                      .join("")
                  : '<span class="grc-category-status-empty" aria-label="ไม่มีสถานะ">—</span>'
              }
            </span>
            <span class="grc-category-update"><small>อัปเดตล่าสุด</small><strong>${escapeHtml(latestUpdate)}</strong></span>
            <span class="grc-category-chevron" aria-hidden="true">⌄</span>
          </button>
          <div id="${detailsId}" class="grc-category-details"${isExpanded ? "" : " hidden"}>
            ${
              indicators.length > 0
                ? `<div class="grc-category-indicators">${indicators
                    .map((indicator) => renderGrcIndicatorCard(indicator, categoryLookup, true))
                    .join("")}</div>`
                : '<p class="grc-page-inline-empty">ไม่พบตัวชี้วัดในหมวดนี้</p>'
            }
          </div>
        </article>
      `;
    })
    .join("");
}

function renderGrcFilterOptions() {
  const categories = getGrcCategories();
  const indicators = getGrcIndicators();
  const categorySelect = document.querySelector("#grc-category-filter");
  const statusSelect = document.querySelector("#grc-status-filter");
  const categoryCodes = new Set(categories.map((category) => category.grc_code));
  const unmatchedCodes = [...new Set(
    indicators
      .map((indicator) => indicator.grc_code)
      .filter((code) => code && !categoryCodes.has(code))
  )];

  categorySelect.innerHTML = `
    <option value="">ทุกหมวด GRC</option>
    ${categories
      .map((category) => `<option value="${escapeHtml(category.grc_code)}">${escapeHtml(category.grc_code)} — ${escapeHtml(category.grc_short_name || category.grc_name || category.grc_code)}</option>`)
      .join("")}
    ${unmatchedCodes
      .map((code) => `<option value="${escapeHtml(code)}">${escapeHtml(code)} — ไม่พบข้อมูลหมวด GRC</option>`)
      .join("")}
  `;

  const presentLevels = [...new Set(indicators.map((indicator) => indicator.performance_level))];
  const preferredKeys = getGrcPrimaryStatuses().map((status) => status.key);
  const orderedLevels = [
    ...preferredKeys.filter((key) => presentLevels.includes(key)),
    ...presentLevels.filter((key) => !preferredKeys.includes(key)).sort((a, b) => a.localeCompare(b))
  ];

  statusSelect.innerHTML = `
    <option value="">ทุกสถานะ</option>
    ${orderedLevels
      .map((level) => {
        const status = getGrcStatusMeta(level);
        const label = status.key === "other" ? level || "ไม่ระบุ" : `${status.label} — ${status.labelTh}`;
        return `<option value="${escapeHtml(level)}">${escapeHtml(label)}</option>`;
      })
      .join("")}
  `;

  categorySelect.value = grcCategoryFilter;
  statusSelect.value = grcStatusFilter;
  document.querySelector("#grc-indicator-search").value = grcSearchQuery;
}

function renderGrcAllIndicators() {
  const container = document.querySelector("#grc-indicator-list");
  const countLabel = document.querySelector("#grc-indicator-result-count");
  const categories = getGrcCategories();
  const categoryLookup = getGrcCategoryLookup(categories);
  const query = normalizeGrcText(grcSearchQuery).toLocaleLowerCase("th-TH");
  const indicators = getGrcIndicators().filter((indicator) => {
    const category = categoryLookup.get(indicator.grc_code);
    const searchableText = [
      indicator.indicator_id,
      indicator.indicator_name,
      indicator.target,
      indicator.performance_detail,
      indicator.grc_code,
      category?.grc_short_name,
      category?.grc_name
    ]
      .map((value) => normalizeGrcText(value).toLocaleLowerCase("th-TH"))
      .join(" ");

    return (
      (!query || searchableText.includes(query)) &&
      (!grcCategoryFilter || indicator.grc_code === grcCategoryFilter) &&
      (!grcStatusFilter || indicator.performance_level === grcStatusFilter)
    );
  });

  countLabel.textContent = `แสดง ${indicators.length} ตัวชี้วัด`;
  container.innerHTML = indicators.length > 0
    ? indicators.map((indicator) => renderGrcIndicatorCard(indicator, categoryLookup)).join("")
    : '<p class="grc-page-inline-empty">ไม่พบตัวชี้วัดที่ตรงกับเงื่อนไข</p>';
}

function renderGrcStatusDistribution(indicators) {
  const container = document.querySelector("#grc-status-distribution");
  const counts = getGrcStatusCounts(indicators);
  const total = indicators.length;
  const statuses = getGrcDisplayStatuses(indicators);

  container.innerHTML = statuses
    .map((status) => {
      const count = status.count ?? counts[status.key] ?? 0;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return `
        <div class="grc-distribution-row grc-status-${status.key.replaceAll("_", "-")}">
          <span class="grc-status-icon">${grcStatusIcon(status.key)}</span>
          <span class="grc-distribution-copy"><strong>${escapeHtml(status.label)}</strong><small>${escapeHtml(status.labelTh)}</small></span>
          <span class="grc-distribution-value"><b>${count}</b><small>${percentage}%</small></span>
          <span class="grc-distribution-track" aria-hidden="true"><i style="width:${percentage}%"></i></span>
        </div>
      `;
    })
    .join("");
}

function renderGrcLatestUpdates(indicators) {
  const container = document.querySelector("#grc-latest-updates");
  const latestIndicators = indicators
    .map((indicator) => ({ indicator, date: parseGrcUpdateDate(indicator.last_update) }))
    .filter((entry) => entry.date)
    .sort((a, b) => b.date - a.date || a.indicator.display_order - b.indicator.display_order)
    .slice(0, 5);

  if (latestIndicators.length === 0) {
    container.innerHTML = '<p class="grc-page-inline-empty">ยังไม่มีข้อมูลวันที่อัปเดต</p>';
    return;
  }

  container.innerHTML = latestIndicators
    .map(({ indicator, date }) => {
      const status = getGrcStatusMeta(indicator.performance_level);
      return `
        <div class="grc-latest-item grc-status-${status.key.replaceAll("_", "-")}">
          <span class="grc-status-icon">${grcStatusIcon(status.key)}</span>
          <span class="grc-latest-copy"><strong>${escapeHtml(indicator.indicator_name || "ไม่มีชื่อตัวชี้วัด")}</strong></span>
          <time datetime="${escapeHtml(indicator.last_update)}">${escapeHtml(formatGrcUpdateDate(date))}</time>
        </div>
      `;
    })
    .join("");
}

function setGrcActiveTab(tabName) {
  grcActiveTab = ["categories", "indicators", "value"].includes(tabName) ? tabName : "categories";
  const views = {
    categories: {
      tab: document.querySelector("#grc-tab-categories"),
      panel: document.querySelector("#grc-category-panel")
    },
    indicators: {
      tab: document.querySelector("#grc-tab-indicators"),
      panel: document.querySelector("#grc-indicator-panel")
    },
    value: {
      tab: document.querySelector("#grc-tab-value"),
      panel: document.querySelector("#grc-value-panel")
    }
  };

  Object.entries(views).forEach(([name, view]) => {
    const active = name === grcActiveTab;
    view.tab.classList.toggle("active", active);
    view.tab.setAttribute("aria-selected", String(active));
    view.tab.tabIndex = active ? 0 : -1;
    view.panel.hidden = !active;
  });

  if (grcActiveTab === "indicators") renderGrcAllIndicators();
  if (grcActiveTab === "value") renderGrcValuePerformance();
}

function renderGrcPage() {
  const categories = getGrcCategories();
  const indicators = getGrcIndicators();
  const emptyState = document.querySelector("#grc-page-empty");
  const dashboard = document.querySelector("#grc-page-dashboard");

  renderGrcPageSummary(categories, indicators);

  if (categories.length === 0 && indicators.length === 0) {
    emptyState.hidden = false;
    dashboard.hidden = true;
    return;
  }

  emptyState.hidden = true;
  dashboard.hidden = false;
  renderGrcCategoryOverview();
  renderGrcFilterOptions();
  renderGrcAllIndicators();
  renderGrcStatusDistribution(indicators);
  renderGrcLatestUpdates(indicators);
  setGrcActiveTab(grcActiveTab);
}

function normalizeBriefingData(data) {
  const home = firstRecord(data.web_home_daily);
  const categoryStatus = Array.isArray(data.web_category_status)
    ? data.web_category_status
    : [];
  const topHeadlines = Array.isArray(data.web_top_headlines)
    ? data.web_top_headlines
    : [];
  const watchlist = Array.isArray(data.web_watchlist) ? data.web_watchlist : [];

  return {
    ...data,
    grc: normalizeGrcData(data.grc),
    report_date: data.report_date || home.report_date,
    updated_time: data.updated_time || home.last_updated,
    executive_summary:
      data.executive_summary ||
      home.executive_summary_short ||
      home.page_subtitle,
    risk_overview:
      (Array.isArray(data.risk_overview) && data.risk_overview.length > 0
        ? data.risk_overview
        : categoryStatus
      ).map((item) => ({
        ...item,
        category: getPrimaryCategory(item),
        subtitle_th:
          item.subtitle_th ||
          item.category_subtitle_th ||
          item.category_th
      })),
    top_headlines:
      Array.isArray(data.top_headlines) && data.top_headlines.length > 0
        ? data.top_headlines
        : topHeadlines,
    watchpoint:
      data.watchpoint ||
      home.main_watchpoint ||
      watchlist[0]?.watchpoint_detail ||
      watchlist[0]?.watchpoint_short ||
      ""
  };
}

function showLoadError() {
  document.querySelector("#data-error").hidden = false;
  renderBriefMeta({});
  renderRiskOverview([]);
  renderHeadlines([]);
  renderGrcSnapshot();
  renderKriSnapshot();
  renderWatchpoint("");
}

async function loadBriefing() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Data request failed: ${response.status}`);

    const raw = await response.json();
    const rawRoot = Array.isArray(raw) ? raw[0] || {} : raw;
    const data = rawRoot.latest_json || rawRoot;

    console.log("latest.json loaded:", {
      web_home_daily: Boolean(data.web_home_daily),
      web_category_status: Array.isArray(data.web_category_status),
      web_top_headlines: Array.isArray(data.web_top_headlines),
      web_watchlist: Array.isArray(data.web_watchlist),
      web_reports_index: Boolean(data.web_reports_index),
      web_category_news: Array.isArray(data.web_category_news)
    });

    const briefing = normalizeBriefingData(data);
    briefingData = briefing;
    renderBriefMeta(briefing);
    renderRiskOverview(briefing.risk_overview);
    renderHeadlines(briefing.top_headlines);
    renderGrcSnapshot();
    renderKriSnapshot();
    renderWatchpoint(briefing.watchpoint);
    bindNavigation();

    const initialCategory = categoryFromHash();
    if (initialCategory) {
      showCategoryDetail(initialCategory, false);
    } else if (window.location.hash === "#grc") {
      showGrcPage(false);
    }
  } catch (error) {
    console.error(`Failed to load ${DATA_URL}:`, error);
    showLoadError();
  }
}

loadBriefing();
