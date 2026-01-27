import casesData from "./cases.json";
import receiptsData from "./receipts.json";
import renewalsData from "./renewals.json";
import billingPayData from "./billing-pay.json";
import billingReceiptData from "./billing-receipt.json";
import billingClaimData from "./billing-claim.json";

export const DATA = {
  cases: casesData,
  receipts: receiptsData,
  renewals: renewalsData,
  billingPay: billingPayData,
  billingReceipt: billingReceiptData,
  billingClaim: billingClaimData,
  rules: [
    "KR 특허청 수수료 변경",
    "JP 연차료 계산 방식 업데이트",
    "US Docket 일정 변경"
  ]
};

export const META = {
  ipazonStatus: "정상"
};
