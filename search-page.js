import { DATA } from "./data.js";
import { parseQuery, filterData, getCaseFiltersFromForm, getReceiptFiltersFromForm, getRenewalFiltersFromForm } from "./search.js";
import { renderSearchSummary, renderTables, renderOverview, renderCaseCharts, renderRenewalCharts } from "./render.js";

let lastFiltered = {};
const paginationState = { cases: 1, receipts: 1, renewals: 1 };
const sortState = { cases: { column: null, direction: "asc" }, receipts: { column: null, direction: "asc" }, renewals: { column: null, direction: "asc" } };
const PAGE_SIZE = 10;

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      const targetPanel = document.getElementById(`tab-${name}`);
      if (!targetPanel) return;
      tabs.forEach((btn) => btn.classList.toggle("active", btn === tab));
      contents.forEach((content) => {
        content.classList.toggle("active", content === targetPanel);
      });
    });
  });
}

function setupSubTabs() {
  const subTabs = document.querySelectorAll(".subtab");
  subTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const container = tab.closest(".tab-content");
      const target = tab.dataset.subtab;
      if (!container || !target) return;
      container.querySelectorAll(".subtab").forEach((btn) => {
        btn.classList.toggle("active", btn === tab);
      });
      container.querySelectorAll(".subtab-content").forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.subtabContent === target);
      });
    });
  });
}

function setActiveTab(name) {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");
  const targetPanel = document.getElementById(`tab-${name}`);
  if (!targetPanel) return;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === name));
  contents.forEach((content) => {
    content.classList.toggle("active", content === targetPanel);
  });
  
  // 맥락 유지 - 탭 상태를 URL에 저장
  const url = new URL(window.location);
  if (name === "overview") {
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("tab", name);
  }
  window.history.pushState({}, "", url);
}

function applySearch(query) {
  const filters = parseQuery(query);
  const filtered = filterData(DATA, filters);
  const intent = filters.intent;
  const display =
    intent === "case"
      ? { ...filtered, receipts: [], renewals: [] }
      : intent === "receipt"
        ? { ...filtered, cases: [], renewals: [] }
        : intent === "renewal"
          ? { ...filtered, cases: [], receipts: [] }
          : filtered;
  lastFiltered = display;
  paginationState.cases = 1;
  paginationState.receipts = 1;
  paginationState.renewals = 1;
  sortState.cases = { column: null, direction: "asc" };
  sortState.receipts = { column: null, direction: "asc" };
  sortState.renewals = { column: null, direction: "asc" };
  renderSearchSummary(query, display, intent, filters);
  renderTables(display, paginationState, sortState);

  if (intent === "receipt") {
    setActiveTab("receipt");
  } else if (intent === "case") {
    setActiveTab("case");
  } else if (intent === "renewal") {
    setActiveTab("renewal");
  } else {
    setActiveTab("overview");
  }
}

function runCaseSearch() {
  const tab = document.getElementById("tab-case");
  const caseFilters = getCaseFiltersFromForm(tab);
  const filtered = filterData(DATA, {}, caseFilters);
  lastFiltered = filtered;
  sortState.cases = { column: null, direction: "asc" };
  paginationState.cases = 1;
  renderTables(lastFiltered, paginationState, sortState);
  
  // 정렬 아이콘 초기화
  document.querySelectorAll('[data-table-body="cases"]').forEach((tbody) => {
    const table = tbody.closest("table");
    table?.querySelectorAll("thead th").forEach((th) => {
      th.classList.remove("asc", "desc");
    });
  });
}

function runReceiptSearch() {
  const tab = document.getElementById("tab-receipt");
  const receiptFilters = getReceiptFiltersFromForm(tab);
  const filtered = filterData(DATA, {}, undefined, receiptFilters);
  lastFiltered = filtered;
  sortState.receipts = { column: null, direction: "asc" };
  paginationState.receipts = 1;
  renderTables(lastFiltered, paginationState, sortState);
  
  // 정렬 아이콘 초기화
  document.querySelectorAll('[data-table-body="receipts"]').forEach((tbody) => {
    const table = tbody.closest("table");
    table?.querySelectorAll("thead th").forEach((th) => {
      th.classList.remove("asc", "desc");
    });
  });
}

function runRenewalSearch() {
  const tab = document.getElementById("tab-renewal");
  const renewalFilters = getRenewalFiltersFromForm(tab);
  const filtered = filterData(DATA, {}, undefined, undefined, renewalFilters);
  lastFiltered = filtered;
  sortState.renewals = { column: null, direction: "asc" };
  paginationState.renewals = 1;
  renderTables(lastFiltered, paginationState, sortState);
  
  // 정렬 아이콘 초기화
  document.querySelectorAll('[data-table-body="renewals"]').forEach((tbody) => {
    const table = tbody.closest("table");
    table?.querySelectorAll("thead th").forEach((th) => {
      th.classList.remove("asc", "desc");
    });
  });
}

function resetCaseFilters() {
  const tab = document.getElementById("tab-case");
  if (!tab) return;
  tab.querySelectorAll('input[type="date"], input[type="text"], select').forEach((el) => {
    if (el.type === "date" || el.type === "text") el.value = "";
    else if (el.tagName === "SELECT") el.value = "";
  });
  tab.querySelectorAll('input[type="checkbox"]').forEach((el) => {
    el.checked = true;
  });
  sortState.cases = { column: null, direction: "asc" };
  runCaseSearch();
}

function resetReceiptFilters() {
  const tab = document.getElementById("tab-receipt");
  if (!tab) return;
  tab.querySelectorAll('input[type="date"], input[type="text"], select').forEach((el) => {
    if (el.type === "date" || el.type === "text") el.value = "";
    else if (el.tagName === "SELECT") el.value = "";
  });
  tab.querySelectorAll('input[type="checkbox"]').forEach((el) => {
    el.checked = true;
  });
  sortState.receipts = { column: null, direction: "asc" };
  runReceiptSearch();
}

function resetRenewalFilters() {
  const tab = document.getElementById("tab-renewal");
  if (!tab) return;
  tab.querySelectorAll('input[type="date"], input[type="text"], select').forEach((el) => {
    if (el.type === "date" || el.type === "text") el.value = "";
    else if (el.tagName === "SELECT") el.value = "";
  });
  sortState.renewals = { column: null, direction: "asc" };
  runRenewalSearch();
}

function handlePaginationClick(e) {
  const btn = e.target.closest("[data-pagination-prev], [data-pagination-next]");
  if (!btn || btn.disabled) return;
  const wrap = btn.closest("[data-pagination]");
  const key = wrap?.dataset?.pagination;
  if (!key || !["cases", "receipts", "renewals"].includes(key)) return;
  const list = (lastFiltered[key] || []);
  const totalPages = Math.ceil(list.length / PAGE_SIZE) || 1;
  const cur = paginationState[key] || 1;
  const dir = btn.hasAttribute("data-pagination-prev") ? -1 : 1;
  const next = cur + dir;
  if (next < 1 || next > totalPages) return;
  paginationState[key] = next;
  renderTables(lastFiltered, paginationState);
}

function setupLogoClick() {
  const logos = document.querySelectorAll(".logo-image");
  logos.forEach((logo) => {
    logo.style.cursor = "pointer";
    logo.addEventListener("click", () => {
      window.location.href = "index.html";
    });
    logo.setAttribute("tabindex", "0");
    logo.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.location.href = "index.html";
      }
    });
  });
}

function init() {
  setupTabs();
  setupSubTabs();
  setupLogoClick();
  renderOverview(DATA);
  renderCaseCharts(DATA);
  renderRenewalCharts(DATA);
  
  // 맥락 유지 - URL 파라미터에서 검색 쿼리와 탭 복원
  const urlParams = new URLSearchParams(window.location.search);
  const queryParam = urlParams.get("q") || "";
  const tabParam = urlParams.get("tab");
  
  if (queryParam) {
    applySearch(queryParam);
  }
  
  // 탭 상태 복원
  if (tabParam && ["case", "receipt", "renewal", "overview"].includes(tabParam)) {
    setActiveTab(tabParam);
  }

  const caseSearchBtn = document.querySelector('[data-action="case-search"]');
  if (caseSearchBtn) caseSearchBtn.addEventListener("click", runCaseSearch);
  const caseResetBtn = document.querySelector('[data-action="case-reset"]');
  if (caseResetBtn) caseResetBtn.addEventListener("click", resetCaseFilters);
  
  const receiptSearchBtn = document.querySelector('[data-action="receipt-search"]');
  if (receiptSearchBtn) receiptSearchBtn.addEventListener("click", runReceiptSearch);
  const receiptResetBtn = document.querySelector('[data-action="receipt-reset"]');
  if (receiptResetBtn) receiptResetBtn.addEventListener("click", resetReceiptFilters);
  
  const renewalSearchBtn = document.querySelector('[data-action="renewal-search"]');
  if (renewalSearchBtn) renewalSearchBtn.addEventListener("click", runRenewalSearch);
  const renewalResetBtn = document.querySelector('[data-action="renewal-reset"]');
  if (renewalResetBtn) renewalResetBtn.addEventListener("click", resetRenewalFilters);
  
  // Enter 키로 검색
  document.querySelectorAll('.filter-panel input[type="text"], .filter-panel input[type="date"]').forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const tab = input.closest(".tab-content");
        if (tab) {
          const searchBtn = tab.querySelector('button.btn-primary');
          if (searchBtn) searchBtn.click();
        }
      }
    });
  });
  
  // 테이블 정렬 기능
  setupTableSorting();

  document.addEventListener("click", handlePaginationClick);
}

function setupTableSorting() {
  document.querySelectorAll(".data-table thead th").forEach((th, index) => {
    if (th.textContent.trim() === "") return; // 빈 헤더는 제외
    th.style.cursor = "pointer";
    th.style.userSelect = "none";
    th.classList.add("sortable");
    
    th.addEventListener("click", () => {
      const tbody = th.closest("table")?.querySelector("tbody");
      if (!tbody) return;
      
      const tableKey = tbody.dataset.tableBody;
      if (!tableKey || !["cases", "receipts", "renewals"].includes(tableKey)) return;
      
      const list = lastFiltered[tableKey] || [];
      if (list.length === 0) return;
      
      const state = sortState[tableKey];
      if (state.column === index) {
        state.direction = state.direction === "asc" ? "desc" : "asc";
      } else {
        state.column = index;
        state.direction = "asc";
      }
      
      // 정렬
      const sorted = [...list].sort((a, b) => {
        const aVal = Object.values(a)[index] || "";
        const bVal = Object.values(b)[index] || "";
        const comparison = String(aVal).localeCompare(String(bVal), "ko", { numeric: true });
        return state.direction === "asc" ? comparison : -comparison;
      });
      
      lastFiltered[tableKey] = sorted;
      paginationState[tableKey] = 1;
      renderTables(lastFiltered, paginationState, sortState);
      
      // 정렬 아이콘 업데이트
      th.closest("table")?.querySelectorAll("thead th").forEach((h, i) => {
        h.classList.remove("asc", "desc");
        if (i === index) {
          h.classList.add(state.direction);
        }
      });
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
