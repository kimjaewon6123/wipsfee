import { DATA } from "./data.js";
import { parseQuery, filterData } from "./search.js";
import { renderSearchSummary, renderTables, renderResultActions } from "./render.js";

const searchInput = document.getElementById("home-search");
const searchBtn = document.getElementById("home-search-btn");
const resultPanel = document.querySelector(".search-result-panel");
const historyPanel = document.querySelector("[data-search-history]");
const historyList = document.querySelector("[data-history-list]");

// 검색 히스토리 관리
const SEARCH_HISTORY_KEY = "wips_search_history";
const MAX_HISTORY = 10;

function getSearchHistory() {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(query) {
  if (!query || query.trim() === "") return;
  
  let history = getSearchHistory();
  // 중복 제거
  history = history.filter(h => h.query !== query);
  // 최신 것을 앞에 추가
  history.unshift({ 
    query, 
    timestamp: Date.now(),
    date: new Date().toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  });
  // 최대 개수 제한
  history = history.slice(0, MAX_HISTORY);
  
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn("히스토리 저장 실패:", e);
  }
  
  renderSearchHistory();
}

function renderSearchHistory() {
  if (!historyList) return;
  
  const history = getSearchHistory();
  if (history.length === 0) {
    if (historyPanel) historyPanel.classList.add("is-hidden");
    return;
  }
  
  if (historyPanel) historyPanel.classList.remove("is-hidden");
  
  historyList.innerHTML = history.map((item, index) => `
    <div class="history-item" data-history-index="${index}">
      <span class="history-item-text">${item.query}</span>
      <span class="history-item-time">${item.date}</span>
      <button class="history-item-delete" data-delete-index="${index}" aria-label="삭제">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `).join("");
  
  // 히스토리 클릭 이벤트
  historyList.querySelectorAll(".history-item").forEach(item => {
    const index = parseInt(item.dataset.historyIndex);
    const historyItem = history[index];
    if (historyItem) {
      item.addEventListener("click", (e) => {
        if (!e.target.closest(".history-item-delete")) {
          searchInput.value = historyItem.query;
          applySearch(historyItem.query);
        }
      });
    }
  });
  
  // 삭제 버튼 이벤트
  historyList.querySelectorAll(".history-item-delete").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.deleteIndex);
      let history = getSearchHistory();
      history.splice(index, 1);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
      } catch (e) {
        console.warn("히스토리 저장 실패:", e);
      }
      renderSearchHistory();
    });
  });
}

function clearSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    renderSearchHistory();
  } catch (e) {
    console.warn("히스토리 삭제 실패:", e);
  }
}

function applySearch(query) {
  const filters = parseQuery(query);
  
  // 검색 히스토리에 저장
  if (query && query.trim()) {
    saveSearchHistory(query.trim());
  }
  
  // 발송일자 검색 처리
  let billingPayResults = [];
  if (filters.isSendDateSearch && filters.sendDateYear && filters.sendDateMonth) {
    const billingPay = DATA.billingPay || [];
    billingPayResults = billingPay.filter((item) => {
      const date = item.발송일자 || "";
      return date.startsWith(`${filters.sendDateYear}-${filters.sendDateMonth}`);
    });
    // 발송일자 검색 조건이 명시되었는데 결과가 없으면 빈 배열 (이미 필터링됨)
  } else if (filters.hasAnyFilter) {
    // 다른 필터 조건이 있지만 발송일자 검색이 아닌 경우 빈 배열
    billingPayResults = [];
  }
  
  const filtered = filterData(DATA, filters);
  const intent = filters.intent;
  const display =
    filters.isSendDateSearch
      ? { cases: [], receipts: [], renewals: [], billingPay: billingPayResults }
      : intent === "case"
        ? { ...filtered, receipts: [], renewals: [], billingPay: billingPayResults }
        : intent === "receipt"
          ? { ...filtered, cases: [], renewals: [], billingPay: billingPayResults }
          : intent === "renewal"
            ? { ...filtered, cases: [], receipts: [], billingPay: billingPayResults }
            : { ...filtered, billingPay: billingPayResults };
  
  renderSearchSummary(query, display, intent, filters);
  renderTables(display);
  renderResultActions(intent, query);

  if (resultPanel) {
    if (query) {
      resultPanel.classList.remove("is-hidden");
      // 히스토리 패널 숨기기
      if (historyPanel) historyPanel.classList.add("is-hidden");
    } else {
      resultPanel.classList.add("is-hidden");
      // 히스토리 패널 표시
      renderSearchHistory();
    }
  }
}

function setupSearch() {
  if (!searchInput || !searchBtn) return;
  
  // 검색 입력 포커스 시 히스토리 표시
  searchInput.addEventListener("focus", () => {
    if (!searchInput.value.trim() && historyPanel) {
      renderSearchHistory();
    }
  });
  
  // 검색 입력에서 포커스 아웃 시 히스토리 숨기기 (약간의 지연)
  searchInput.addEventListener("blur", () => {
    setTimeout(() => {
      if (historyPanel && !historyPanel.matches(":hover") && !document.querySelector(".history-item:hover")) {
        historyPanel.classList.add("is-hidden");
      }
    }, 200);
  });
  
  // 히스토리 패널 호버 시 유지
  if (historyPanel) {
    historyPanel.addEventListener("mouseenter", () => {
      historyPanel.classList.remove("is-hidden");
    });
    historyPanel.addEventListener("mouseleave", () => {
      if (document.activeElement !== searchInput) {
        historyPanel.classList.add("is-hidden");
      }
    });
  }
  
  const handler = () => {
    const query = searchInput.value.trim();
    applySearch(query);
  };
  searchBtn.addEventListener("click", handler);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handler();
  });
  
  // 결과 닫기 버튼
  const closeBtn = document.querySelector("[data-result-close]");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (resultPanel) resultPanel.classList.add("is-hidden");
      if (searchInput) searchInput.value = "";
      renderSearchHistory();
    });
  }
  
  // 히스토리 전체 삭제 버튼
  const clearHistoryBtn = document.querySelector("[data-clear-history]");
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("검색 히스토리를 모두 삭제하시겠습니까?")) {
        clearSearchHistory();
      }
    });
  }
  
  // URL 파라미터에서 검색 쿼리 복원 (맥락 유지)
  const urlParams = new URLSearchParams(window.location.search);
  const urlQuery = urlParams.get("q");
  if (urlQuery) {
    searchInput.value = urlQuery;
    applySearch(urlQuery);
  } else {
    renderSearchHistory();
  }
}

function setupChips() {
  const chips = document.querySelectorAll(".chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const query = chip.dataset.chip || chip.textContent || "";
      if (searchInput) searchInput.value = query.trim();
      applySearch(query.trim());
    });
  });
}

function setupSidebar() {
  const menuToggle = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  const layoutContainer = document.querySelector(".layout-container");
  
  if (!menuToggle || !sidebar || !layoutContainer) return;
  
  let overlay = document.querySelector(".sidebar-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    layoutContainer.appendChild(overlay);
  }
  
  const updateOverlay = () => {
    if (window.innerWidth <= 1024) {
      overlay.classList.toggle("active", sidebar.classList.contains("open"));
    } else {
      overlay.classList.remove("active");
    }
  };
  
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("open");
    updateOverlay();
  });
  
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    updateOverlay();
  });
  
  window.addEventListener("resize", updateOverlay);
  updateOverlay();
}

function setupLogoClick() {
  const logos = document.querySelectorAll(".logo-image");
  logos.forEach((logo) => {
    logo.style.cursor = "pointer";
    logo.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  });
}

function init() {
  setupSidebar();
  setupSearch();
  setupChips();
  setupLogoClick();
  
  // 초기 히스토리 렌더링
  renderSearchHistory();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
