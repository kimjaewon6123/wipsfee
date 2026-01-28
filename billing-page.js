import { DATA } from "./data.js";
import { updatePaginationUI } from "./render.js";

const PAGE_SIZE = 10;
const paginationState = {
  "billing-pay": 1,
  "billing-pay-detail": 1,
  "billing-receipt": 1,
  "billing-receipt-detail": 1,
  "billing-claim": 1,
  "billing-claim-detail": 1
};

// 테이블 정렬 상태
const sortState = {
  "billing-pay": { column: null, direction: "asc" },
  "billing-receipt": { column: null, direction: "asc" },
  "billing-claim": { column: null, direction: "asc" }
};

// 정렬된 리스트를 저장
let sortedLists = {
  "billing-pay": null,
  "billing-receipt": null,
  "billing-claim": null
};

/** 선택된 행: 납부/납부접수/청구 메인 테이블에서 클릭한 항목. 없으면 null */
let selectedPayRow = null;
let selectedReceiptRow = null;
let selectedClaimRow = null;

/** 상세 테이블용 리스트 반환. 선택 없으면 [] */
function getDetailList(key) {
  if (key === "billing-pay-detail") {
    if (!selectedPayRow) return [];
    const nos = selectedPayRow.caseNos || [];
    return (DATA.cases || []).filter((c) => nos.includes(c.No));
  }
  if (key === "billing-receipt-detail") {
    if (!selectedReceiptRow) return [];
    const nos = selectedReceiptRow.caseNos || [];
    return (DATA.cases || []).filter((c) => nos.includes(c.No));
  }
  if (key === "billing-claim-detail") {
    if (!selectedClaimRow) return [];
    const nos = selectedClaimRow.caseNos || [];
    return (DATA.cases || []).filter((c) => nos.includes(c.No));
  }
  return [];
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-content");
  const selectTab = (name) => {
    const targetPanel = document.getElementById(`tab-${name}`);
    if (!targetPanel) return;
    const tab = Array.from(tabs).find((t) => t.dataset.tab === name);
    if (tab) {
      tabs.forEach((btn) => btn.classList.toggle("active", btn === tab));
      panels.forEach((panel) => {
        panel.classList.toggle("active", panel === targetPanel);
      });
    }
  };
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => selectTab(tab.dataset.tab));
  });
  const t = new URLSearchParams(location.search).get("tab");
  if (t === "receipt" || t === "claim" || t === "pay") selectTab(t);
}

const fillRow = (cells, values) =>
  values.map((v) => `<td>${v ?? "-"}</td>`).concat(Array.from({ length: Math.max(0, cells - values.length) }, () => "<td>-</td>")).join("");

const SUMMARY_KEYS = { "billing-pay": "billingPay", "billing-receipt": "billingReceipt", "billing-claim": "billingClaim" };

function updateBillingSummaryCounts() {
  // 납부 탭 건수 (필터링된 결과)
  const payEl = document.querySelector('[data-summary="billing-pay"]');
  if (payEl) {
    const strong = payEl.querySelector("strong");
    if (strong) {
      let list = DATA.billingPay || [];
      list = filterBillingPay(list);
      strong.textContent = list.length;
    }
  }
  
  // 납부접수 탭 건수 (필터링된 결과)
  const receiptEl = document.querySelector('[data-summary="billing-receipt"]');
  if (receiptEl) {
    const strong = receiptEl.querySelector("strong");
    if (strong) {
      let list = DATA.billingReceipt || [];
      list = filterBillingReceipt(list);
      strong.textContent = list.length;
    }
  }
  
  // 청구 탭 건수 (필터링된 결과)
  const claimEl = document.querySelector('[data-summary="billing-claim"]');
  if (claimEl) {
    const strong = claimEl.querySelector("strong");
    if (strong) {
      let list = DATA.billingClaim || [];
      list = filterBillingClaim(list);
      strong.textContent = list.length;
    }
  }
}

function getBillingPayFilters() {
  const tab = document.getElementById("tab-pay");
  if (!tab) return null;
  const q = (sel) => tab.querySelector(`[data-filter="${sel}"]`);
  const val = (el) => (el && el.value != null ? String(el.value).trim() : "");
  const checked = (el) => (el && el.checked);
  
  return {
    발송일자From: val(q("pay-발송일자-from")) || null,
    발송일자To: val(q("pay-발송일자-to")) || null,
    출원번호: val(q("pay-출원번호")) || null,
    청구분류: val(q("pay-청구분류")) || null,
    지시여부Y: checked(q("pay-지시여부-Y")),
    지시여부N: checked(q("pay-지시여부-N"))
  };
}

function filterBillingPay(list) {
  const filters = getBillingPayFilters();
  if (!filters) return list;
  
  const caseMap = {};
  (DATA.cases || []).forEach((c) => { caseMap[c.No] = c; });
  
  return list.filter((item) => {
    // 발송일자 필터
    const date = item.발송일자 || "";
    if (filters.발송일자From && date < filters.발송일자From) return false;
    if (filters.발송일자To && date > filters.발송일자To) return false;
    
    // 청구분류 필터
    if (filters.청구분류 && item.청구분류 !== filters.청구분류) return false;
    
    // 지시여부 필터
    const hasInstruction = (item.지시건수 || 0) > 0;
    if (filters.지시여부Y && !filters.지시여부N && !hasInstruction) return false;
    if (filters.지시여부N && !filters.지시여부Y && hasInstruction) return false;
    if (!filters.지시여부Y && !filters.지시여부N) {
      // 둘 다 체크 안 되어 있으면 필터링 안 함
    }
    
    // 출원번호 필터 (caseNos를 통해 검색)
    if (filters.출원번호) {
      const caseNos = item.caseNos || [];
      const hasMatchingCase = caseNos.some((no) => {
        const c = caseMap[no];
        if (!c) return false;
        const 출원번호 = String(c.출원번호 || "");
        return 출원번호.includes(filters.출원번호);
      });
      if (!hasMatchingCase) return false;
    }
    
    return true;
  });
}

function getBillingReceiptFilters() {
  const tab = document.getElementById("tab-receipt");
  if (!tab) return null;
  const q = (sel) => tab.querySelector(`[data-filter="${sel}"]`);
  const val = (el) => (el && el.value != null ? String(el.value).trim() : "");
  
  return {
    회신일자From: val(q("receipt-회신일자-from")) || null,
    회신일자To: val(q("receipt-회신일자-to")) || null,
    출원번호: val(q("receipt-출원번호")) || null,
    청구분류: val(q("receipt-청구분류")) || null
  };
}

function filterBillingReceipt(list) {
  const filters = getBillingReceiptFilters();
  if (!filters) return list;
  
  const caseMap = {};
  (DATA.cases || []).forEach((c) => { caseMap[c.No] = c; });
  
  return list.filter((item) => {
    // 회신일자 필터
    const date = item.회신일자 || "";
    if (filters.회신일자From && date < filters.회신일자From) return false;
    if (filters.회신일자To && date > filters.회신일자To) return false;
    
    // 청구분류 필터
    if (filters.청구분류 && item.청구분류 !== filters.청구분류) return false;
    
    // 출원번호 필터 (caseNos를 통해 검색)
    if (filters.출원번호) {
      const caseNos = item.caseNos || [];
      const hasMatchingCase = caseNos.some((no) => {
        const c = caseMap[no];
        if (!c) return false;
        const 출원번호 = String(c.출원번호 || "");
        return 출원번호.includes(filters.출원번호);
      });
      if (!hasMatchingCase) return false;
    }
    
    return true;
  });
}

function getBillingClaimFilters() {
  const tab = document.getElementById("tab-claim");
  if (!tab) return null;
  const q = (sel) => tab.querySelector(`[data-filter="${sel}"]`);
  const val = (el) => (el && el.value != null ? String(el.value).trim() : "");
  const checked = (el) => (el && el.checked);
  
  return {
    청구일자From: val(q("claim-청구일자-from")) || null,
    청구일자To: val(q("claim-청구일자-to")) || null,
    출원번호: val(q("claim-출원번호")) || null,
    입금확인Y: checked(q("claim-입금확인-Y")),
    입금확인N: checked(q("claim-입금확인-N"))
  };
}

function filterBillingClaim(list) {
  const filters = getBillingClaimFilters();
  if (!filters) return list;
  
  const caseMap = {};
  (DATA.cases || []).forEach((c) => { caseMap[c.No] = c; });
  
  return list.filter((item) => {
    // 청구일자 필터
    const date = item.청구일자 || "";
    if (filters.청구일자From && date < filters.청구일자From) return false;
    if (filters.청구일자To && date > filters.청구일자To) return false;
    
    // 입금확인여부 필터
    const 입금확인 = item.입금확인 || "";
    if (filters.입금확인Y && !filters.입금확인N && 입금확인 !== "Y") return false;
    if (filters.입금확인N && !filters.입금확인Y && 입금확인 !== "N") return false;
    if (!filters.입금확인Y && !filters.입금확인N) {
      // 둘 다 체크 안 되어 있으면 필터링 안 함
    }
    
    // 출원번호 필터 (caseNos를 통해 검색)
    if (filters.출원번호) {
      const caseNos = item.caseNos || [];
      const hasMatchingCase = caseNos.some((no) => {
        const c = caseMap[no];
        if (!c) return false;
        const 출원번호 = String(c.출원번호 || "");
        return 출원번호.includes(filters.출원번호);
      });
      if (!hasMatchingCase) return false;
    }
    
    return true;
  });
}

function renderBillingTables() {
  updateBillingSummaryCounts();
  const payBody = document.querySelector('[data-table-body="billing-pay"]');
  if (payBody) {
    let list = DATA.billingPay || [];
    list = filterBillingPay(list);
    // 정렬이 적용되어 있으면 정렬된 리스트 사용
    if (sortedLists["billing-pay"] && sortState["billing-pay"].column !== null) {
      list = sortedLists["billing-pay"];
    } else {
      sortedLists["billing-pay"] = null;
    }
    const p = Math.max(1, paginationState["billing-pay"] || 1);
    const pageList = list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
    const n = 6;
    payBody.innerHTML = pageList.length
      ? pageList
          .map(
            (r) =>
              `<tr class="clickable${selectedPayRow && selectedPayRow.리마인더발송번호 === r.리마인더발송번호 ? " selected" : ""}" data-row-key="${r.리마인더발송번호 || ""}">${fillRow(n, [r.리마인더발송번호, r.발송일자, r.담당자, r.청구분류, r.발송건수, r.지시건수])}</tr>`
          )
          .join("")
      : '<tr><td colspan="6" class="empty-state">조회 결과가 없습니다.</td></tr>';
    updatePaginationUI("billing-pay", list.length, p);
  }

  const payDetail = document.querySelector('[data-table-body="billing-pay-detail"]');
  if (payDetail) {
    const list = getDetailList("billing-pay-detail");
    const p = Math.max(1, paginationState["billing-pay-detail"] || 1);
    const pageList = list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
    const n = 13;
    payDetail.innerHTML = pageList.length
      ? pageList.map((c, i) => `<tr>${fillRow(n, [(p - 1) * PAGE_SIZE + i + 1, c.건상세상태, c.고객관리번호, c.청구분류, c.국가, c.권리구분, c.출원번호, c.출원일자, c.등록번호, c.등록일자, c.권리만료일자, c.청구항수, c.디자인번호 ?? ""])}</tr>`).join("")
      : '<tr><td colspan="13" class="empty-state">상세 내역이 없습니다.</td></tr>';
    updatePaginationUI("billing-pay-detail", list.length, p);
  }

  const rcptBody = document.querySelector('[data-table-body="billing-receipt"]');
  if (rcptBody) {
    let list = DATA.billingReceipt || [];
    list = filterBillingReceipt(list);
    // 정렬이 적용되어 있으면 정렬된 리스트 사용
    if (sortedLists["billing-receipt"] && sortState["billing-receipt"].column !== null) {
      list = sortedLists["billing-receipt"];
    } else {
      sortedLists["billing-receipt"] = null;
    }
    const p = Math.max(1, paginationState["billing-receipt"] || 1);
    const pageList = list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
    const n = 10;
    rcptBody.innerHTML = pageList.length
      ? pageList
          .map(
            (r) =>
              `<tr class="clickable${selectedReceiptRow && selectedReceiptRow.리마인더회신번호 === r.리마인더회신번호 ? " selected" : ""}" data-row-key="${r.리마인더회신번호 || ""}">${fillRow(n, [r.No, r.리마인더회신번호, r.고객, r.등록자, r.회신건수, r.회신일자, r.납부건수, r.미납건수, r.납부지시건수, r.청구분류])}</tr>`
          )
          .join("")
      : '<tr><td colspan="10" class="empty-state">조회 결과가 없습니다.</td></tr>';
    updatePaginationUI("billing-receipt", list.length, p);
  }

  const rcptDetail = document.querySelector('[data-table-body="billing-receipt-detail"]');
  if (rcptDetail) {
    const list = getDetailList("billing-receipt-detail");
    const p = Math.max(1, paginationState["billing-receipt-detail"] || 1);
    const pageList = list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
    const n = 16;
    rcptDetail.innerHTML = pageList.length
      ? pageList.map((c, i) => `<tr>${fillRow(n, [(p - 1) * PAGE_SIZE + i + 1, "테스트고객사", c.고객관리번호, c.PCT출원번호 || "-", c.국가, c.권리구분, c.출원번호, c.출원일자, c.등록번호, c.등록일자, c.권리만료일자, c.청구항수, c.디자인번호 ?? "", c.차기납부기한, c.고객관리번호, c.건상태])}</tr>`).join("")
      : '<tr><td colspan="16" class="empty-state">상세 내역이 없습니다.</td></tr>';
    updatePaginationUI("billing-receipt-detail", list.length, p);
  }

  const claimBody = document.querySelector('[data-table-body="billing-claim"]');
  if (claimBody) {
    let list = DATA.billingClaim || [];
    list = filterBillingClaim(list);
    // 정렬이 적용되어 있으면 정렬된 리스트 사용
    if (sortedLists["billing-claim"] && sortState["billing-claim"].column !== null) {
      list = sortedLists["billing-claim"];
    } else {
      sortedLists["billing-claim"] = null;
    }
    const p = Math.max(1, paginationState["billing-claim"] || 1);
    const pageList = list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
    const n = 13;
    claimBody.innerHTML = pageList.length
      ? pageList
          .map(
            (r) =>
              `<tr class="clickable${selectedClaimRow && selectedClaimRow.청구번호 === r.청구번호 ? " selected" : ""}" data-row-key="${r.청구번호 || ""}">${fillRow(n, [r.청구번호, r.청구일자, r.입금확인, r.담당자, r.청구분류, r.청구건수, r.세금계산서발행일자, r.합계, r.관납료, r.현지대리인수수료, r.환수수수료, r.VAT, r.기타비용])}</tr>`
          )
          .join("")
      : '<tr><td colspan="13" class="empty-state">조회 결과가 없습니다.</td></tr>';
    updatePaginationUI("billing-claim", list.length, p);
  }

  const claimDetail = document.querySelector('[data-table-body="billing-claim-detail"]');
  if (claimDetail) {
    const list = getDetailList("billing-claim-detail");
    const p = Math.max(1, paginationState["billing-claim-detail"] || 1);
    const pageList = list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
    const n = 15;
    claimDetail.innerHTML = pageList.length
      ? pageList.map((c, i) => `<tr>${fillRow(n, [(p - 1) * PAGE_SIZE + i + 1, c.건상세상태, c.고객관리번호, c.청구분류, c.국가, c.권리구분, c.출원번호, c.출원일자, c.등록번호, c.등록일자, c.권리만료일자, c.청구항수, c.디자인번호 ?? "", "", ""])}</tr>`).join("")
      : '<tr><td colspan="15" class="empty-state">상세 내역이 없습니다.</td></tr>';
    updatePaginationUI("billing-claim-detail", list.length, p);
  }
}

function handleBillingPayRowClick(e) {
  const tr = e.target.closest("tr");
  if (!tr || tr.querySelector(".empty-state") || !tr.dataset.rowKey) return;
  const key = tr.dataset.rowKey;
  // 원본 데이터에서 찾기 (필터와 무관하게)
  const item = (DATA.billingPay || []).find((x) => x.리마인더발송번호 === key);
  if (!item) return;
  selectedPayRow = selectedPayRow && selectedPayRow.리마인더발송번호 === key ? null : item;
  paginationState["billing-pay-detail"] = 1;
  renderBillingTables();
}

function handleBillingReceiptRowClick(e) {
  const tr = e.target.closest("tr");
  if (!tr || tr.querySelector(".empty-state") || !tr.dataset.rowKey) return;
  const key = tr.dataset.rowKey;
  // 원본 데이터에서 찾기 (필터와 무관하게)
  const item = (DATA.billingReceipt || []).find((x) => x.리마인더회신번호 === key);
  if (!item) return;
  selectedReceiptRow = selectedReceiptRow && selectedReceiptRow.리마인더회신번호 === key ? null : item;
  paginationState["billing-receipt-detail"] = 1;
  renderBillingTables();
}

function handleBillingClaimRowClick(e) {
  const tr = e.target.closest("tr");
  if (!tr || tr.querySelector(".empty-state") || !tr.dataset.rowKey) return;
  const key = tr.dataset.rowKey;
  // 원본 데이터에서 찾기 (필터와 무관하게)
  const item = (DATA.billingClaim || []).find((x) => x.청구번호 === key);
  if (!item) return;
  selectedClaimRow = selectedClaimRow && selectedClaimRow.청구번호 === key ? null : item;
  paginationState["billing-claim-detail"] = 1;
  renderBillingTables();
}

function handleBillingPaginationClick(e) {
  const btn = e.target.closest("[data-pagination-prev], [data-pagination-next]");
  if (!btn || btn.disabled) return;
  const wrap = btn.closest("[data-pagination]");
  const key = wrap?.dataset?.pagination;
  if (!key || !paginationState.hasOwnProperty(key)) return;
  const listMap = {
    "billing-pay": () => filterBillingPay(DATA.billingPay || []),
    "billing-pay-detail": () => getDetailList("billing-pay-detail"),
    "billing-receipt": () => filterBillingReceipt(DATA.billingReceipt || []),
    "billing-receipt-detail": () => getDetailList("billing-receipt-detail"),
    "billing-claim": () => filterBillingClaim(DATA.billingClaim || []),
    "billing-claim-detail": () => getDetailList("billing-claim-detail")
  };
  const list = (listMap[key] || (() => []))();
  const totalPages = Math.ceil(list.length / PAGE_SIZE) || 1;
  const cur = paginationState[key] || 1;
  const dir = btn.hasAttribute("data-pagination-prev") ? -1 : 1;
  const next = cur + dir;
  if (next < 1 || next > totalPages) return;
  paginationState[key] = next;
  renderBillingTables();
}

function resetPayFilters() {
  const tab = document.getElementById("tab-pay");
  if (!tab) return;
  tab.querySelectorAll('input[type="date"], input[type="text"]').forEach((el) => {
    el.value = "";
  });
  tab.querySelectorAll('select').forEach((el) => {
    el.value = "";
  });
  tab.querySelectorAll('input[type="checkbox"]').forEach((el) => {
    el.checked = false;
  });
  sortState["billing-pay"] = { column: null, direction: "asc" };
  sortedLists["billing-pay"] = null;
  paginationState["billing-pay"] = 1;
  renderBillingTables();
  
  // 정렬 아이콘 초기화
  const table = tab.querySelector('.data-table');
  table?.querySelectorAll("thead th").forEach((th) => {
    th.classList.remove("asc", "desc");
  });
}

function resetReceiptFilters() {
  const tab = document.getElementById("tab-receipt");
  if (!tab) return;
  tab.querySelectorAll('input[type="date"], input[type="text"]').forEach((el) => {
    el.value = "";
  });
  tab.querySelectorAll('select').forEach((el) => {
    el.value = "";
  });
  sortState["billing-receipt"] = { column: null, direction: "asc" };
  sortedLists["billing-receipt"] = null;
  paginationState["billing-receipt"] = 1;
  renderBillingTables();
  
  // 정렬 아이콘 초기화
  const table = tab.querySelector('.data-table');
  table?.querySelectorAll("thead th").forEach((th) => {
    th.classList.remove("asc", "desc");
  });
}

function resetClaimFilters() {
  const tab = document.getElementById("tab-claim");
  if (!tab) return;
  tab.querySelectorAll('input[type="date"], input[type="text"]').forEach((el) => {
    el.value = "";
  });
  tab.querySelectorAll('input[type="checkbox"]').forEach((el) => {
    el.checked = false;
  });
  sortState["billing-claim"] = { column: null, direction: "asc" };
  sortedLists["billing-claim"] = null;
  paginationState["billing-claim"] = 1;
  renderBillingTables();
  
  // 정렬 아이콘 초기화
  const table = tab.querySelector('.data-table');
  table?.querySelectorAll("thead th").forEach((th) => {
    th.classList.remove("asc", "desc");
  });
}

function sortTable(key, columnIndex, list) {
  const state = sortState[key];
  if (state.column === columnIndex) {
    state.direction = state.direction === "asc" ? "desc" : "asc";
  } else {
    state.column = columnIndex;
    state.direction = "asc";
  }
  
  const sorted = [...list].sort((a, b) => {
    const aVal = Object.values(a)[columnIndex] || "";
    const bVal = Object.values(b)[columnIndex] || "";
    const comparison = String(aVal).localeCompare(String(bVal), "ko", { numeric: true });
    return state.direction === "asc" ? comparison : -comparison;
  });
  
  sortedLists[key] = sorted;
  return sorted;
}

function setupTableSorting() {
  // 테이블 헤더 클릭 시 정렬
  document.querySelectorAll(".data-table thead th").forEach((th, index) => {
    if (th.textContent.trim() === "") return; // 빈 헤더는 제외
    th.style.cursor = "pointer";
    th.style.userSelect = "none";
    th.classList.add("sortable");
    
    th.addEventListener("click", () => {
      const table = th.closest("table");
      const tbody = table?.querySelector("tbody");
      if (!tbody) return;
      
      const tableKey = tbody.dataset.tableBody || tbody.dataset.table;
      if (!tableKey || !["billing-pay", "billing-receipt", "billing-claim"].includes(tableKey)) {
        // 상세 테이블은 정렬하지 않음
        return;
      }
      
      let list = [];
      if (tableKey === "billing-pay") {
        list = filterBillingPay(DATA.billingPay || []);
      } else if (tableKey === "billing-receipt") {
        list = filterBillingReceipt(DATA.billingReceipt || []);
      } else if (tableKey === "billing-claim") {
        list = filterBillingClaim(DATA.billingClaim || []);
      }
      
      if (list.length === 0) return;
      
      sortTable(tableKey, index, list);
      paginationState[tableKey] = 1;
      
      // 정렬 아이콘 업데이트
      table.querySelectorAll("thead th").forEach((h, i) => {
        h.classList.remove("asc", "desc");
        if (i === index) {
          h.classList.add(sortState[tableKey].direction);
        }
      });
      
      // 정렬된 리스트로 다시 렌더링
      renderBillingTables();
    });
  });
}

function setupSearchButtons() {
  // 납부 탭 검색/초기화 버튼
  const payTab = document.getElementById("tab-pay");
  const paySearchBtn = payTab?.querySelector('[data-action="pay-search"]');
  if (paySearchBtn) {
    paySearchBtn.addEventListener("click", () => {
      sortState["billing-pay"] = { column: null, direction: "asc" };
      sortedLists["billing-pay"] = null;
      paginationState["billing-pay"] = 1;
      renderBillingTables();
      
      // 정렬 아이콘 초기화
      const table = payTab.querySelector('.data-table');
      table?.querySelectorAll("thead th").forEach((th) => {
        th.classList.remove("asc", "desc");
      });
    });
  }
  const payResetBtn = payTab?.querySelector('[data-action="pay-reset"]');
  if (payResetBtn) {
    payResetBtn.addEventListener("click", resetPayFilters);
  }
  
  // 납부접수 탭 검색/초기화 버튼
  const receiptTab = document.getElementById("tab-receipt");
  const receiptSearchBtn = receiptTab?.querySelector('[data-action="receipt-search"]');
  if (receiptSearchBtn) {
    receiptSearchBtn.addEventListener("click", () => {
      sortState["billing-receipt"] = { column: null, direction: "asc" };
      sortedLists["billing-receipt"] = null;
      paginationState["billing-receipt"] = 1;
      renderBillingTables();
      
      // 정렬 아이콘 초기화
      const table = receiptTab.querySelector('.data-table');
      table?.querySelectorAll("thead th").forEach((th) => {
        th.classList.remove("asc", "desc");
      });
    });
  }
  const receiptResetBtn = receiptTab?.querySelector('[data-action="receipt-reset"]');
  if (receiptResetBtn) {
    receiptResetBtn.addEventListener("click", resetReceiptFilters);
  }
  
  // 청구 탭 검색/초기화 버튼
  const claimTab = document.getElementById("tab-claim");
  const claimSearchBtn = claimTab?.querySelector('[data-action="claim-search"]');
  if (claimSearchBtn) {
    claimSearchBtn.addEventListener("click", () => {
      sortState["billing-claim"] = { column: null, direction: "asc" };
      sortedLists["billing-claim"] = null;
      paginationState["billing-claim"] = 1;
      renderBillingTables();
      
      // 정렬 아이콘 초기화
      const table = claimTab.querySelector('.data-table');
      table?.querySelectorAll("thead th").forEach((th) => {
        th.classList.remove("asc", "desc");
      });
    });
  }
  const claimResetBtn = claimTab?.querySelector('[data-action="claim-reset"]');
  if (claimResetBtn) {
    claimResetBtn.addEventListener("click", resetClaimFilters);
  }
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
  setupLogoClick();
  
  // URL 파라미터에서 탭 정보 복원 (맥락 유지)
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get("tab");
  if (tabParam && ["pay", "receipt", "claim"].includes(tabParam)) {
    const tabBtn = document.querySelector(`[data-tab="${tabParam}"]`);
    if (tabBtn) tabBtn.click();
  }
  
  renderBillingTables();
  document.addEventListener("click", handleBillingPaginationClick);
  document.querySelector('[data-table-body="billing-pay"]')?.addEventListener("click", handleBillingPayRowClick);
  document.querySelector('[data-table-body="billing-receipt"]')?.addEventListener("click", handleBillingReceiptRowClick);
  document.querySelector('[data-table-body="billing-claim"]')?.addEventListener("click", handleBillingClaimRowClick);
  
  setupSearchButtons();
  setupTableSorting();
  
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
  
  // 탭 변경 시 URL 업데이트 (맥락 유지)
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;
      if (tabName) {
        const url = new URL(window.location);
        url.searchParams.set("tab", tabName);
        window.history.pushState({}, "", url);
      }
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
