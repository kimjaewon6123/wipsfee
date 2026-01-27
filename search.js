const COUNTRY_MAP = {
  한국: "KR",
  일본: "JP",
  미국: "US",
  중국: "CN",
  유럽: "EP",
  베트남: "VN",
  태국: "TH",
  인도: "IN",
  독일: "DE",
  영국: "GB",
  프랑스: "FR",
  캐나다: "CA",
  호주: "AU",
  싱가포르: "SG",
  대만: "TW"
};

const INTENT_MAP = {
  접수: "receipt",
  건: "case",
  연차: "renewal",
  납부: "renewal"
};

const COUNTRY_CODES = ["KR", "JP", "US", "EP", "CN", "VN", "TH", "IN", "DE", "GB", "FR", "CA", "AU", "SG", "TW"];

// 국가 코드 별칭 매핑 (EU -> EP 등)
const COUNTRY_ALIAS = {
  "EU": "EP"
};

const MONTH_KEYWORDS = [
  { label: "지난달", offset: -1 },
  { label: "지난 달", offset: -1 },
  { label: "저번달", offset: -1 },
  { label: "저번 달", offset: -1 },
  { label: "전달", offset: -1 },
  { label: "이번달", offset: 0 },
  { label: "이번 달", offset: 0 },
  { label: "당월", offset: 0 },
  { label: "금월", offset: 0 },
  { label: "이달", offset: 0 },
  { label: "다음달", offset: 1 },
  { label: "다음 달", offset: 1 },
  { label: "차월", offset: 1 },
  { label: "익월", offset: 1 },
  { label: "다다음달", offset: 2 },
  { label: "다다음 달", offset: 2 },
  { label: "다음다음달", offset: 2 },
  { label: "다음다음 달", offset: 2 },
  { label: "익익월", offset: 2 }
];

const getYearMonthByOffset = (offset) => {
  const base = new Date();
  const target = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const year = String(target.getFullYear());
  const month = String(target.getMonth() + 1).padStart(2, "0");
  return { year, month };
};

export function parseQuery(query) {
  const text = (query || "").trim();
  if (!text) return {};

  let country = null;
  let countryRequested = false; // 국가 검색이 명시적으로 요청되었는지
  
  // 국가명 매칭 (더 정확한 매칭을 위해 긴 이름부터 확인)
  const sortedCountryKeys = Object.keys(COUNTRY_MAP).sort((a, b) => b.length - a.length);
  const countryKey = sortedCountryKeys.find((key) => text.includes(key));
  if (countryKey) {
    country = COUNTRY_MAP[countryKey];
    countryRequested = true;
  } else {
    const u = text.toUpperCase();
    // 먼저 별칭 확인 (EU -> EP)
    const alias = Object.keys(COUNTRY_ALIAS).find((a) => u.includes(a));
    if (alias) {
      country = COUNTRY_ALIAS[alias];
      countryRequested = true;
    } else {
      // 국가 코드 직접 매칭 (더 정확하게)
      const codeMatch = COUNTRY_CODES.find((c) => {
        // 단어 경계를 고려한 정확한 매칭
        const regex = new RegExp(`\\b${c}\\b`, 'i');
        return regex.test(u);
      });
      if (codeMatch) {
        country = codeMatch;
        countryRequested = true;
      }
    }
  }

  const intentKey = Object.keys(INTENT_MAP).find((key) => text.includes(key));
  const intent = intentKey ? INTENT_MAP[intentKey] : null;

  const status = text.includes("임박")
    ? "임박"
    : text.includes("예정")
      ? "예정"
      : null;

  // 상대 월 키워드 (이번달/다음달/다다음달)
  const monthKeyword = MONTH_KEYWORDS.find((item) => text.includes(item.label));
  const monthOffset = monthKeyword ? monthKeyword.offset : null;
  const monthRange = monthOffset != null ? getYearMonthByOffset(monthOffset) : null;

  // 특허유지 검색 (권리구분 + 건상세상태)
  const isPatentMaintain = text.includes("특허유지") || text.includes("특허 유지");
  const rightType = isPatentMaintain ? "특허" : null;
  const caseDetailStatus = isPatentMaintain ? "유지" : null;
  const normalizedIntent = isPatentMaintain ? "case" : intent;

  // 발송일자 검색 파싱 (예: "2026년 1월 발송일자건", "2026-01 발송일자")
  let sendDateYear = null;
  let sendDateMonth = null;
  const yearMatch = text.match(/(\d{4})\s*년/);
  const monthMatch = text.match(/(\d{1,2})\s*월/);
  const dateMatch = text.match(/(\d{4})-(\d{1,2})/);
  
  if (yearMatch) sendDateYear = yearMatch[1];
  if (monthMatch) sendDateMonth = monthMatch[1].padStart(2, '0');
  if (dateMatch) {
    sendDateYear = dateMatch[1];
    sendDateMonth = dateMatch[2].padStart(2, '0');
  }

  // 발송일자 관련 검색인지 확인
  const isSendDateSearch = text.includes("발송일자") || text.includes("발송") || (sendDateYear && sendDateMonth);

  // 검색 키워드 추출 (명시적 필터 외의 잔여 텍스트)
  let keyword = text;
  MONTH_KEYWORDS.forEach((item) => {
    keyword = keyword.replaceAll(item.label, "");
  });
  sortedCountryKeys.forEach((key) => {
    keyword = keyword.replaceAll(key, "");
  });
  Object.keys(COUNTRY_ALIAS).forEach((key) => {
    keyword = keyword.replaceAll(key, "");
  });
  COUNTRY_CODES.forEach((code) => {
    const regex = new RegExp(`\\b${code}\\b`, "gi");
    keyword = keyword.replace(regex, "");
  });
  Object.keys(INTENT_MAP).forEach((key) => {
    keyword = keyword.replaceAll(key, "");
  });
  keyword = keyword.replaceAll("임박", "").replaceAll("예정", "");
  keyword = keyword.replaceAll("납부예정", "").replaceAll("납부 예정", "");
  keyword = keyword.replaceAll("특허유지", "").replaceAll("특허 유지", "");
  keyword = keyword.replaceAll("발송일자", "").replaceAll("발송", "");
  keyword = keyword.replace(/\d{4}\s*년/g, "").replace(/\d{1,2}\s*월/g, "");
  keyword = keyword.replace(/\d{4}-\d{1,2}/g, "");
  keyword = keyword.replace(/\s+/g, " ").trim();
  if (keyword === "") keyword = null;

  // 명시적인 필터 조건이 있는지 확인 (intent만 있는 것은 전체 검색으로 간주)
  const hasAnyFilter =
    countryRequested ||
    status !== null ||
    isSendDateSearch ||
    Boolean(keyword) ||
    monthOffset != null ||
    Boolean(rightType) ||
    Boolean(caseDetailStatus);

  return { 
    country, 
    intent: normalizedIntent, 
    status, 
    sendDateYear, 
    sendDateMonth, 
    isSendDateSearch,
    dueYear: monthRange?.year || null,
    dueMonth: monthRange?.month || null,
    dueMonthRequested: monthOffset != null,
    rightType,
    caseDetailStatus,
    countryRequested, // 국가 검색이 명시적으로 요청되었는지 플래그
    hasAnyFilter, // 명시적인 필터 조건이 있는지
    keyword, // 잔여 검색 키워드
    raw: text 
  };
}

function hasKeywordMatch(value, keyword) {
  if (!keyword) return true;
  return String(value || "").toLowerCase().includes(keyword.toLowerCase());
}

function filterCases(data, filters, caseFilters) {
  const list = data.cases || [];
  if (!list.length) return [];

  if (caseFilters != null) {
    return list.filter((item) => {
      const from = (v) => (v == null || v === "" ? true : v);
      if (from(caseFilters.접수일자From) !== true && item.접수일자 < caseFilters.접수일자From) return false;
      if (from(caseFilters.접수일자To) !== true && item.접수일자 > caseFilters.접수일자To) return false;
      if (from(caseFilters.출원일자From) !== true && item.출원일자 < caseFilters.출원일자From) return false;
      if (from(caseFilters.출원일자To) !== true && item.출원일자 > caseFilters.출원일자To) return false;
      if (from(caseFilters.출원번호) !== true && !String(item.출원번호 || "").includes(String(caseFilters.출원번호))) return false;
      if (from(caseFilters.국가) !== true && String(item.국가 || "").toUpperCase() !== String(caseFilters.국가).toUpperCase()) return false;
      const types = caseFilters.권리구분;
      if (Array.isArray(types) && types.length) {
        const map = { 특허: "특허", 실용: "실용신안", 디자인: "디자인" };
        const ok = types.some((t) => (item.권리구분 || "") === (map[t] || t));
        if (!ok) return false;
      }
      if (from(caseFilters.청구분류) !== true && !String(item.청구분류 || "").includes(String(caseFilters.청구분류))) return false;
      if (from(caseFilters.건상세상태) !== true && !String(item.건상세상태 || "").includes(String(caseFilters.건상세상태))) return false;
      return true;
    });
  }

  const country = filters?.country;
  const countryRequested = filters?.countryRequested;
  const hasAnyFilter = filters?.hasAnyFilter;
  const keyword = filters?.keyword;
  const rightType = filters?.rightType;
  const caseDetailStatus = filters?.caseDetailStatus;
  
  // 명시적인 필터 조건이 있는 경우에만 필터링
  if (hasAnyFilter) {
    let filtered = list;
    
    // 국가 필터 (명시적으로 요청된 경우만)
    if (countryRequested && country) {
      filtered = filtered.filter((item) => {
        return (item.국가 || item.country) === country;
      });
    } else if (countryRequested && !country) {
      // 국가가 명시되었는데 매칭되지 않으면 빈 배열
      return [];
    }

    if (keyword) {
      filtered = filtered.filter((item) => {
        return (
          hasKeywordMatch(item.출원번호, keyword) ||
          hasKeywordMatch(item.고객관리번호, keyword) ||
          hasKeywordMatch(item.등록번호, keyword) ||
          hasKeywordMatch(item.권리구분, keyword) ||
          hasKeywordMatch(item.청구분류, keyword) ||
          hasKeywordMatch(item.건상태, keyword) ||
          hasKeywordMatch(item.건상세상태, keyword) ||
          hasKeywordMatch(item.국가, keyword) ||
          hasKeywordMatch(item.접수일자, keyword)
        );
      });
    }

    if (rightType) {
      filtered = filtered.filter((item) => (item.권리구분 || "") === rightType);
    }

    if (caseDetailStatus) {
      filtered = filtered.filter((item) => String(item.건상세상태 || "").includes(caseDetailStatus));
    }
    
    // 검색 조건이 명시되었는데 결과가 없으면 빈 배열 반환
    return filtered;
  }
  
  // 필터 조건이 전혀 없을 때만 전체 데이터 반환 (빈 쿼리일 때)
  return list;
}

function filterReceipts(receipts, receiptFilters, cases) {
  if (!receipts || !receipts.length) return [];
  const from = (v) => (v == null || v === "" ? true : v);
  const caseMap = {};
  (cases || []).forEach((c) => { caseMap[c.No] = c; });

  return receipts.filter((r) => {
    if (from(receiptFilters.접수일자From) !== true && (r.접수일자 || "") < receiptFilters.접수일자From) return false;
    if (from(receiptFilters.접수일자To) !== true && (r.접수일자 || "") > receiptFilters.접수일자To) return false;
    if (from(receiptFilters.출원대리인) !== true && !String(r.출원대리인 || "").includes(String(receiptFilters.출원대리인))) return false;

    const types = receiptFilters.권리구분;
    const hasCaseFilter = from(receiptFilters.국가) !== true || from(receiptFilters.출원번호) !== true || (Array.isArray(types) && types.length) || from(receiptFilters.건상세상태) !== true;
    if (hasCaseFilter && r.caseNos && r.caseNos.length) {
      const map = { 특허: "특허", 실용: "실용신안", 디자인: "디자인" };
      const ok = r.caseNos.some((no) => {
        const c = caseMap[no];
        if (!c) return false;
        if (from(receiptFilters.국가) !== true && (c.국가 || "") !== (receiptFilters.국가 || "")) return false;
        if (from(receiptFilters.출원번호) !== true && !String(c.출원번호 || "").includes(String(receiptFilters.출원번호))) return false;
        if (Array.isArray(types) && types.length) {
          const mt = types.some((t) => (c.권리구분 || "") === (map[t] || t));
          if (!mt) return false;
        }
        if (from(receiptFilters.건상세상태) !== true && !String(c.건상세상태 || "").includes(String(receiptFilters.건상세상태))) return false;
        return true;
      });
      if (!ok) return false;
    }

    return true;
  });
}

function filterRenewals(renewals, renewalFilters) {
  if (!renewals || !renewals.length) return [];
  const from = (v) => (v == null || v === "" ? true : v);

  return renewals.filter((r) => {
    if (from(renewalFilters.납부기한From) !== true && (r.납부기한 || "") < renewalFilters.납부기한From) return false;
    if (from(renewalFilters.납부기한To) !== true && (r.납부기한 || "") > renewalFilters.납부기한To) return false;
    if (from(renewalFilters.출원번호) !== true && !String(r.출원번호 || "").includes(String(renewalFilters.출원번호))) return false;
    if (from(renewalFilters.국가) !== true && String(r.국가 || "").toUpperCase() !== String(renewalFilters.국가 || "").toUpperCase()) return false;
    return true;
  });
}

export function filterData(data, filters, caseFilters, receiptFilters, renewalFilters) {
  const status = filters?.status;
  const countryRequested = filters?.countryRequested;
  const country = filters?.country;
  const hasAnyFilter = filters?.hasAnyFilter;
  const keyword = filters?.keyword;
  const dueYear = filters?.dueYear;
  const dueMonth = filters?.dueMonth;
  const dueMonthRequested = filters?.dueMonthRequested;
  
  const cases = filterCases(data, filters, caseFilters);

  let receipts;
  if (receiptFilters != null) {
    receipts = filterReceipts(data.receipts || [], receiptFilters, data.cases || []);
  } else {
    const caseMap = {};
    (data.cases || []).forEach((c) => { caseMap[c.No] = c; });
    
    // 명시적인 필터 조건이 있는 경우에만 필터링
    if (hasAnyFilter) {
      receipts = (data.receipts || []).filter((r) => {
        // 국가가 명시적으로 요청되었을 때만 필터링
        if (countryRequested && country) {
          if (!(r.caseNos || []).some((no) => (caseMap[no] || {}).국가 === country)) return false;
        }
        if (keyword) {
          const matchReceipt =
            hasKeywordMatch(r.접수번호, keyword) ||
            hasKeywordMatch(r.출원대리인, keyword) ||
            hasKeywordMatch(r.이관주체, keyword) ||
            hasKeywordMatch(r.발신자, keyword) ||
            hasKeywordMatch(r.ACK발송일자, keyword) ||
            hasKeywordMatch(r.접수일자, keyword);
          if (!matchReceipt) return false;
        }
        return true;
      });
    } else {
      // 필터 조건이 없으면 전체 반환
      receipts = data.receipts || [];
    }
  }

  let renewals;
  if (renewalFilters != null) {
    renewals = filterRenewals(data.renewals || [], renewalFilters);
  } else {
    // 명시적인 필터 조건이 있는 경우에만 필터링
    if (hasAnyFilter) {
      renewals = (data.renewals || []).filter((r) => {
        // 국가가 명시적으로 요청되었을 때만 필터링
        if (countryRequested && country && (r.국가 || r.country) !== country) return false;
        if (status && (r.상태 || r.status) !== status) return false;
        if (dueMonthRequested && dueYear && dueMonth) {
          if (!String(r.납부기한 || "").startsWith(`${dueYear}-${dueMonth}`)) return false;
        }
        if (keyword) {
          const matchRenewal =
            hasKeywordMatch(r.출원번호, keyword) ||
            hasKeywordMatch(r.관리번호, keyword) ||
            hasKeywordMatch(r.국가, keyword) ||
            hasKeywordMatch(r.상태, keyword) ||
            hasKeywordMatch(r.연차, keyword) ||
            hasKeywordMatch(r.납부기한, keyword);
          if (!matchRenewal) return false;
        }
        return true;
      });
    } else {
      // 필터 조건이 없으면 전체 반환
      renewals = data.renewals || [];
    }
  }

  return { cases, receipts, renewals };
}

export function getCaseFiltersFromForm(form) {
  if (!form) return null;
  const q = (sel) => form.querySelector(`[data-filter="${sel}"]`);
  const val = (el) => (el && el.value != null ? String(el.value).trim() : "");
  const from = q("case-접수일자-from");
  const to = q("case-접수일자-to");
  const out = q("case-출원일자-from");
  const outTo = q("case-출원일자-to");
  const types = [];
  if (q("case-특허")?.checked) types.push("특허");
  if (q("case-실용")?.checked) types.push("실용");
  if (q("case-디자인")?.checked) types.push("디자인");
  return {
    접수일자From: val(from) || null,
    접수일자To: val(to) || null,
    출원일자From: val(out) || null,
    출원일자To: val(outTo) || null,
    출원번호: val(q("case-출원번호")) || null,
    국가: val(q("case-국가")) || null,
    권리구분: types,
    청구분류: val(q("case-청구분류")) || null,
    건상세상태: val(q("case-건상세상태")) || null
  };
}

export function getReceiptFiltersFromForm(container) {
  if (!container) return null;
  const q = (sel) => container.querySelector(`[data-filter="${sel}"]`);
  const val = (el) => (el && el.value != null ? String(el.value).trim() : "");
  const types = [];
  if (q("receipt-특허")?.checked) types.push("특허");
  if (q("receipt-실용")?.checked) types.push("실용");
  if (q("receipt-디자인")?.checked) types.push("디자인");
  return {
    접수일자From: val(q("receipt-접수일자-from")) || null,
    접수일자To: val(q("receipt-접수일자-to")) || null,
    국가: val(q("receipt-국가")) || null,
    출원대리인: val(q("receipt-출원대리인")) || null,
    출원번호: val(q("receipt-출원번호")) || null,
    권리구분: types,
    건상세상태: val(q("receipt-건상세상태")) || null
  };
}

export function getRenewalFiltersFromForm(container) {
  if (!container) return null;
  const q = (sel) => container.querySelector(`[data-filter="${sel}"]`);
  const val = (el) => (el && el.value != null ? String(el.value).trim() : "");
  return {
    납부기한From: val(q("renewal-납부기한-from")) || null,
    납부기한To: val(q("renewal-납부기한-to")) || null,
    출원번호: val(q("renewal-출원번호")) || null,
    국가: val(q("renewal-국가")) || null
  };
}
