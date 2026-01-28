function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      tabs.forEach((btn) => btn.classList.toggle("active", btn === tab));
      panels.forEach((panel) => {
        panel.classList.toggle("active", panel.id === `tab-${name}`);
      });
    });
  });
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

function setupTableSorting() {
  document.querySelectorAll(".data-table thead th").forEach((th, index) => {
    if (th.textContent.trim() === "") return;
    th.style.cursor = "pointer";
    th.style.userSelect = "none";
    th.classList.add("sortable");
    
    th.addEventListener("click", () => {
      const table = th.closest("table");
      const tbody = table?.querySelector("tbody");
      if (!tbody) return;
      
      const rows = Array.from(tbody.querySelectorAll("tr"));
      if (rows.length === 0) return;
      
      const isAsc = th.classList.contains("asc");
      
      // 모든 헤더의 정렬 클래스 제거
      table.querySelectorAll("thead th").forEach((h) => {
        h.classList.remove("asc", "desc");
      });
      
      // 정렬 방향 설정
      th.classList.add(isAsc ? "desc" : "asc");
      
      // 정렬
      const sorted = rows.sort((a, b) => {
        const aVal = a.cells[index]?.textContent || "";
        const bVal = b.cells[index]?.textContent || "";
        const comparison = String(aVal).localeCompare(String(bVal), "ko", { numeric: true });
        return isAsc ? -comparison : comparison;
      });
      
      // 정렬된 행으로 교체
      sorted.forEach((row) => tbody.appendChild(row));
    });
  });
}

function setupSearch() {
  // 법규 탭 검색
  const lawTab = document.getElementById("tab-law");
  const lawSearchInput = lawTab?.querySelector('input[type="text"]');
  const lawSearchBtn = lawTab?.querySelector('button.btn-primary');
  
  if (lawSearchInput && lawSearchBtn) {
    const performLawSearch = () => {
      const query = lawSearchInput.value.trim().toLowerCase();
      const tbody = lawTab?.querySelector("tbody");
      if (!tbody) return;
      
      const rows = Array.from(tbody.querySelectorAll("tr"));
      rows.forEach((row) => {
        const cells = Array.from(row.cells);
        const text = cells.map((cell) => cell.textContent || "").join(" ").toLowerCase();
        row.style.display = query === "" || text.includes(query) ? "" : "none";
      });
    };
    
    lawSearchBtn.addEventListener("click", performLawSearch);
    lawSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") performLawSearch();
    });
  }
  
  // 관납료 탭 검색
  const feeTab = document.getElementById("tab-fee");
  const feeSearchInput = feeTab?.querySelector('input[type="text"]');
  const feeSearchBtn = feeTab?.querySelector('button.btn-primary');
  
  if (feeSearchInput && feeSearchBtn) {
    const performFeeSearch = () => {
      const query = feeSearchInput.value.trim().toLowerCase();
      const tbody = feeTab?.querySelector("tbody");
      if (!tbody) return;
      
      const rows = Array.from(tbody.querySelectorAll("tr"));
      rows.forEach((row) => {
        const cells = Array.from(row.cells);
        const text = cells.map((cell) => cell.textContent || "").join(" ").toLowerCase();
        row.style.display = query === "" || text.includes(query) ? "" : "none";
      });
    };
    
    feeSearchBtn.addEventListener("click", performFeeSearch);
    feeSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") performFeeSearch();
    });
  }
}

function init() {
  setupTabs();
setupLogoClick();
setupTableSorting();
setupSearch();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
