const setText = (selector, value) => {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
};

export function renderHomeInsights(data, meta) {
  setText("[data-ipazon-status]", meta?.ipazonStatus || "정상");
}

export function renderSearchSummary(query, filtered, intent, filters = {}) {
  setText("[data-ai-query]", query ? `"${query}"` : "");
  if (!query) {
    setText("[data-ai-summary]", "연차료 관련 검색어를 입력하거나 아래 빠른 검색을 이용해 보세요.");
    return;
  }
  
  // 실제 배열 길이 확인 (undefined나 null 체크)
  const cases = Array.isArray(filtered.cases) ? filtered.cases.length : 0;
  const receipts = Array.isArray(filtered.receipts) ? filtered.receipts.length : 0;
  const renewals = Array.isArray(filtered.renewals) ? filtered.renewals.length : 0;
  const billingPay = Array.isArray(filtered.billingPay) ? filtered.billingPay.length : 0;

  let msg;
  if (filters?.isSendDateSearch) {
    msg = billingPay > 0 ? `납부 발송 ${billingPay}건을 찾았습니다.` : "해당 건이 없습니다.";
  } else if (intent === "case") {
    msg = cases > 0 ? `건 ${cases}건을 찾았습니다.` : "해당 건이 없습니다.";
  } else if (intent === "receipt") {
    msg = receipts > 0 ? `접수 ${receipts}건을 찾았습니다.` : "해당 건이 없습니다.";
  } else if (intent === "renewal") {
    msg = renewals > 0 ? `연차 ${renewals}건을 찾았습니다.` : "해당 건이 없습니다.";
  } else {
    const total = cases + receipts + renewals + billingPay;
    if (total === 0) {
      msg = "해당 건이 없습니다.";
    } else {
      const parts = [];
      if (cases > 0) parts.push(`건 ${cases}`);
      if (receipts > 0) parts.push(`접수 ${receipts}`);
      if (renewals > 0) parts.push(`연차 ${renewals}`);
      if (billingPay > 0) parts.push(`납부 발송 ${billingPay}`);
      msg = `${parts.join(", ")} (총 ${total}건)`;
    }
  }
  setText("[data-ai-summary]", msg);
  
  // Sparkpage 스타일 인사이트 카드 생성
  renderSearchInsights(filtered, intent, filters);
  
  // 검색 결과 미리보기 생성
  renderSearchPreview(filtered, intent, filters);
}

// Sparkpage 스타일 인사이트 카드
function renderSearchInsights(filtered, intent, filters = {}) {
  const insightsEl = document.querySelector("[data-result-insights]");
  if (!insightsEl) return;
  
  const cases = Array.isArray(filtered.cases) ? filtered.cases.length : 0;
  const receipts = Array.isArray(filtered.receipts) ? filtered.receipts.length : 0;
  const renewals = Array.isArray(filtered.renewals) ? filtered.renewals.length : 0;
  const billingPay = Array.isArray(filtered.billingPay) ? filtered.billingPay.length : 0;
  
  const insights = [];
  
  if (!filters?.isSendDateSearch && cases > 0) {
    const byCountry = {};
    (filtered.cases || []).slice(0, 10).forEach(item => {
      const country = item.국가 || "기타";
      byCountry[country] = (byCountry[country] || 0) + 1;
    });
    const topCountry = Object.entries(byCountry).sort((a, b) => b[1] - a[1])[0];
    
    insights.push({
      title: "건",
      value: cases,
      desc: topCountry ? `가장 많은 국가: ${topCountry[0]} (${topCountry[1]}건)` : "연차료 건 정보"
    });
  }
  
  if (!filters?.isSendDateSearch && receipts > 0) {
    insights.push({
      title: "접수",
      value: receipts,
      desc: "접수된 연차료 건"
    });
  }
  
  if (!filters?.isSendDateSearch && renewals > 0) {
    const urgent = (filtered.renewals || []).filter(r => r.상태 === "임박").length;
    insights.push({
      title: "연차",
      value: renewals,
      desc: urgent > 0 ? `납부 임박: ${urgent}건` : "연차료 납부 정보"
    });
  }
  
  if (billingPay > 0) {
    insights.push({
      title: "납부 발송",
      value: billingPay,
      desc: "납부 안내 발송 건"
    });
  }
  
  if (insights.length === 0) {
    insightsEl.innerHTML = "";
    return;
  }
  
  insightsEl.innerHTML = insights.map(insight => `
    <div class="insight-card">
      <div class="insight-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        ${insight.title}
      </div>
      <div class="insight-value">${insight.value}</div>
      <div class="insight-desc">${insight.desc}</div>
    </div>
  `).join("");
}

// 검색 결과 미리보기 테이블
function renderSearchPreview(filtered, intent, filters = {}) {
  const previewEl = document.querySelector("[data-result-preview]");
  if (!previewEl) return;

  if (filters?.isSendDateSearch) {
    previewEl.innerHTML = "";
    return;
  }
  
  const cases = filtered.cases || [];
  const receipts = filtered.receipts || [];
  const renewals = filtered.renewals || [];
  
  let previewHTML = "";
  
  if (intent === "case" && cases.length > 0) {
    previewHTML = `
      <div class="preview-section">
        <h3 class="preview-title">건 미리보기</h3>
        <table class="preview-table">
          <thead>
            <tr>
              <th>출원번호</th>
              <th>국가</th>
              <th>청구분류</th>
              <th>건상태</th>
            </tr>
          </thead>
          <tbody>
            ${cases.slice(0, 5).map(item => `
              <tr>
                <td>${item.출원번호 || "-"}</td>
                <td>${item.국가 || "-"}</td>
                <td>${item.청구분류 || "-"}</td>
                <td>${item.건상태 || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        ${cases.length > 5 ? `<p class="preview-more">외 ${cases.length - 5}건 더 보기</p>` : ""}
      </div>
    `;
  } else if (intent === "renewal" && renewals.length > 0) {
    previewHTML = `
      <div class="preview-section">
        <h3 class="preview-title">연차 미리보기</h3>
        <table class="preview-table">
          <thead>
            <tr>
              <th>납부기한</th>
              <th>국가</th>
              <th>연차</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            ${renewals.slice(0, 5).map(item => `
              <tr>
                <td>${item.납부기한 || "-"}</td>
                <td>${item.국가 || "-"}</td>
                <td>${item.연차 || "-"}</td>
                <td>${item.상태 || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        ${renewals.length > 5 ? `<p class="preview-more">외 ${renewals.length - 5}건 더 보기</p>` : ""}
      </div>
    `;
  } else if (!intent) {
    // 통합 미리보기
    const allItems = [
      ...cases.slice(0, 3).map(c => ({ type: "건", ...c })),
      ...renewals.slice(0, 2).map(r => ({ type: "연차", ...r }))
    ];
    
    if (allItems.length > 0) {
      previewHTML = `
        <div class="preview-section">
          <h3 class="preview-title">검색 결과 미리보기</h3>
          <table class="preview-table">
            <thead>
              <tr>
                <th>유형</th>
                <th>출원번호/납부기한</th>
                <th>국가</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              ${allItems.map(item => `
                <tr>
                  <td>${item.type}</td>
                  <td>${item.출원번호 || item.납부기한 || "-"}</td>
                  <td>${item.국가 || "-"}</td>
                  <td>${item.건상태 || item.상태 || "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    }
  }
  
  previewEl.innerHTML = previewHTML;
}

export function renderResultActions(intent, query) {
  const searchLink = document.querySelector("[data-result-search]");
  const billingLink = document.querySelector("[data-result-billing]");
  if (searchLink) {
    // 맥락 유지 - 검색 쿼리를 URL에 포함
    const url = query ? `search.html?q=${encodeURIComponent(query)}` : "search.html";
    searchLink.href = url;
    // 링크 클릭 시 히스토리에 저장
    searchLink.addEventListener("click", () => {
      if (query) {
        try {
          const history = JSON.parse(localStorage.getItem("wips_search_history") || "[]");
          if (!history.find(h => h.query === query)) {
            history.unshift({ query, timestamp: Date.now(), date: new Date().toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) });
            localStorage.setItem("wips_search_history", JSON.stringify(history.slice(0, 10)));
          }
        } catch (e) {}
      }
    });
  }
  if (billingLink) {
    // 맥락 유지 - 검색 쿼리를 URL에 포함
    const url = query ? `billing.html?q=${encodeURIComponent(query)}` : "billing.html";
    billingLink.href = url;
    billingLink.textContent = intent === "renewal" ? "납부 화면으로" : "납부/청구";
  }
}

export function renderMetrics() {
  return;
}

function countBy(arr, key) {
  const m = {};
  (arr || []).forEach((x) => {
    const v = (x && x[key]) ?? "";
    m[v] = (m[v] || 0) + 1;
  });
  return m;
}

const CHART_COLORS = ["var(--color-primary)", "#78c26b", "#63b5f6", "#f5b35b", "#f06a6a", "#5d6bd4", "#556fe6"];

export function renderOverview(data) {
  const cases = data?.cases || [];
  const receipts = data?.receipts || [];
  const caseMap = {};
  cases.forEach((c) => { caseMap[c.No] = c; });

  const total = cases.length;
  const receiptCnt = (receipts || []).length;
  const managed = cases.filter((c) => (c.건상태 || "") === "등록").length;

  const receiptRights = { 특허: 0, 실용신안: 0, 디자인: 0 };
  (receipts || []).forEach((r) => {
    (r.caseNos || []).forEach((no) => {
      const c = caseMap[no];
      if (!c) return;
      const k = c.권리구분 || "";
      if (k === "특허") receiptRights.특허++;
      else if (k === "실용신안") receiptRights.실용신안++;
      else if (k === "디자인") receiptRights.디자인++;
    });
  });
  const managedRights = { 특허: 0, 실용신안: 0, 디자인: 0 };
  cases.filter((c) => (c.건상태 || "") === "등록").forEach((c) => {
    const k = c.권리구분 || "";
    if (k === "특허") managedRights.특허++;
    else if (k === "실용신안") managedRights.실용신안++;
    else if (k === "디자인") managedRights.디자인++;
  });

  setText("[data-overview-total]", String(total));
  setText("[data-overview-receipt]", String(receiptCnt));
  setText("[data-overview-managed]", String(managed));

  const mBody = document.querySelector("[data-overview-matrix]");
  if (mBody) {
    mBody.innerHTML = `<tr><td>건수</td><td>${receiptRights.특허}</td><td>${receiptRights.실용신안}</td><td>${receiptRights.디자인}</td><td>${managedRights.특허}</td><td>${managedRights.실용신안}</td><td>${managedRights.디자인}</td></tr>`;
  }

  const byCountry = countBy(cases, "국가");
  const byRight = countBy(cases, "권리구분");
  const byAgent = countBy(receipts, "출원대리인");
  const byStatus = countBy(cases, "건상세상태");

  const entries = (m, excludeBlank = true) =>
    Object.entries(m)
      .filter(([k]) => !excludeBlank || (k && k !== ""))
      .sort((a, b) => b[1] - a[1]);

  const fillLegend = (sel, items) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.innerHTML = items
      .map(([name, cnt], i) => `<div class="legend-item"><span class="legend-dot" style="--color: ${CHART_COLORS[i % CHART_COLORS.length]}"></span>${name || "(없음)"} ${cnt}</div>`)
      .join("");
  };
  const fillMini = (sel, items) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.innerHTML = items.map(([name, cnt]) => `<tr><td>${name || "(없음)"}</td><td>${cnt}</td></tr>`).join("");
  };

  fillLegend("[data-overview-chart-country]", entries(byCountry));
  fillLegend("[data-overview-chart-right]", entries(byRight));
  fillLegend("[data-overview-chart-agent]", entries(byAgent));
  fillLegend("[data-overview-chart-status]", entries(byStatus));

  fillMini("[data-overview-mini-country]", entries(byCountry));
  fillMini("[data-overview-mini-right]", entries(byRight));
  fillMini("[data-overview-mini-agent]", entries(byAgent));
  fillMini("[data-overview-mini-status]", entries(byStatus));
}

export function renderCaseCharts(data) {
  const cases = data?.cases || [];
  const byCountry = {};
  cases.forEach((c) => { byCountry[c.국가 || ""] = (byCountry[c.국가 || ""] || 0) + 1; });
  const byYear = {};
  cases.forEach((c) => {
    const d = (c.차기납부기한 || "").slice(0, 4);
    if (d) byYear[d] = (byYear[d] || 0) + 1;
  });
  const countryRows = Object.entries(byCountry).filter(([k]) => k).sort((a, b) => b[1] - a[1]);
  const yearRows = Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0]));

  const tb = (sel, rows, hasCost = true) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const sum = (n) => (hasCost ? (n * 1000000).toLocaleString() : "-");
    el.innerHTML = (rows.length ? rows : [["-", 0]]).map(([k, v]) => `<tr><td>${k || "-"}</td><td>${v}</td><td>KRW</td><td>${sum(v)}</td></tr>`).join("");
  };
  tb("[data-chart-case-country]", countryRows);
  tb("[data-chart-case-year]", yearRows);
}

export function renderRenewalCharts(data) {
  const renewals = data?.renewals || [];
  const byCountry = {};
  const byYear = {};
  renewals.forEach((r) => {
    const c = r.국가 || "";
    const y = (r.납부기한 || "").slice(0, 4);
    if (c) byCountry[c] = (byCountry[c] || 0) + 1;
    if (y) byYear[y] = (byYear[y] || 0) + 1;
  });
  const countryRows = Object.entries(byCountry).filter(([k]) => k).sort((a, b) => b[1] - a[1]);
  const yearRows = Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0]));

  const tb = (sel, rows) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const sum = (n) => (n * 500000).toLocaleString();
    el.innerHTML = (rows.length ? rows : [["-", 0]]).map(([k, v]) => `<tr><td>${k || "-"}</td><td>${v}</td><td>KRW</td><td>${sum(v)}</td></tr>`).join("");
  };
  tb("[data-chart-renewal-country]", countryRows);
  tb("[data-chart-renewal-year]", yearRows);
}

const fillRow = (cells, values) => {
  return values.map((value, index) => `<td>${value ?? "-"}</td>`).concat(
    Array.from({ length: Math.max(0, cells - values.length) }, () => "<td>-</td>")
  ).join("");
};

const setCaseCount = (n) => {
  const el = document.querySelector("[data-case-count]");
  if (el) el.textContent = n;
};

const setReceiptSummary = (receipts) => {
  const rc = document.querySelector("[data-receipt-count]");
  if (rc) rc.textContent = (receipts || []).length;
  const rt = document.querySelector("[data-receipt-total]");
  if (rt) rt.textContent = (receipts || []).reduce((s, r) => s + (r.이관건수 || 0), 0);
};

const setRenewalCount = (n) => {
  const el = document.querySelector("[data-renewal-count]");
  if (el) el.textContent = n;
};

const PAGE_SIZE = 10;

export function updatePaginationUI(key, total, page) {
  const wrap = document.querySelector(`[data-pagination="${key}"]`);
  if (!wrap) return;
  if (total <= PAGE_SIZE) {
    wrap.hidden = true;
    wrap.innerHTML = "";
    return;
  }
  wrap.hidden = false;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const p = Math.max(1, Math.min(page, totalPages));
  wrap.innerHTML = `
    <button type="button" class="pagination-btn" data-pagination-prev ${p <= 1 ? "disabled" : ""}>이전</button>
    <span class="pagination-info">${p} / ${totalPages}</span>
    <button type="button" class="pagination-btn" data-pagination-next ${p >= totalPages ? "disabled" : ""}>다음</button>
  `;
}

export function renderTables(filtered, pagination = {}, sortStates = {}) {
  const caseBody = document.querySelector('[data-table-body="cases"]');
  if (caseBody) {
    let cases = filtered.cases || [];
    // 정렬 상태가 있으면 정렬 적용 (외부에서 정렬된 리스트를 전달받음)
    const p = Math.max(1, pagination.cases || 1);
    const pageList = cases.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
    setCaseCount(cases.length);
    caseBody.innerHTML = pageList.length
      ? pageList
          .map((item) =>
            `<tr>${fillRow(caseBody.closest("table").querySelectorAll("th").length, [
              item.No,
              item.접수일자,
              item.청구분류,
              item.고객관리번호,
              item.국가,
              item.권리구분,
              item.출원번호,
              item.출원일자,
              item.등록번호,
              item.등록일자,
              item.권리만료일자,
              item.청구항수,
              item.디자인번호 ?? "",
              item.건상태,
              item.건상세상태,
              item.차기연차,
              item.차기납부기한,
              item.PCT출원번호,
              item.PCT출원일자
            ])}</tr>`
          )
          .join("")
      : '<tr><td colspan="19" class="empty-state">조회 결과가 없습니다.</td></tr>';
    updatePaginationUI("cases", cases.length, p);
  }

  const receiptBody = document.querySelector('[data-table-body="receipts"]');
  if (receiptBody) {
    const receipts = filtered.receipts || [];
    const pr = Math.max(1, pagination.receipts || 1);
    const receiptPageList = receipts.slice((pr - 1) * PAGE_SIZE, pr * PAGE_SIZE);
    setReceiptSummary(receipts);
    receiptBody.innerHTML = receiptPageList.length
      ? receiptPageList
          .map((item) =>
            `<tr>${fillRow(receiptBody.closest("table").querySelectorAll("th").length, [
              item.접수번호,
              item.접수일자,
              item.출원대리인,
              item.이관주체,
              item.발신자,
              item.ACK발송일자,
              item.이관건수,
              item.완료,
              item["반려(중복)"],
              item["반려(긴급)"]
            ])}</tr>`
          )
          .join("")
      : '<tr><td colspan="10" class="empty-state">조회 결과가 없습니다.</td></tr>';
    updatePaginationUI("receipts", receipts.length, pr);
  }

  const renewalBody = document.querySelector('[data-table-body="renewals"]');
  if (renewalBody) {
    const renewals = filtered.renewals || [];
    const pn = Math.max(1, pagination.renewals || 1);
    const renewalPageList = renewals.slice((pn - 1) * PAGE_SIZE, pn * PAGE_SIZE);
    setRenewalCount(renewals.length);
    renewalBody.innerHTML = renewalPageList.length
      ? renewalPageList
          .map((item) =>
            `<tr>${fillRow(renewalBody.closest("table").querySelectorAll("th").length, [
              item.납부기한,
              item.관리번호,
              item.국가,
              item.연차,
              item.상태,
              item.비고
            ])}</tr>`
          )
          .join("")
      : '<tr><td colspan="6" class="empty-state">조회 결과가 없습니다.</td></tr>';
    updatePaginationUI("renewals", renewals.length, pn);
  }
}
