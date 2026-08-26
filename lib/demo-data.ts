import type { AuditEvent, AutomationRun, Brand, FinanceException } from "@/lib/types";

export const brands: Brand[] = [
  { id: "all", name: "All brands" },
  { id: "aurora-home", name: "Aurora Home" },
  { id: "northwind-kids", name: "Northwind Kids" },
];

export const periodSummary = {
  orderCount: 172,
  matchedOrderCount: 162,
  expectedPayoutPence: 1_824_050,
  actualPayoutPence: 1_796_550,
  openVariancePence: 27_500,
  openExceptionCount: 10,
};

export const financeExceptions: FinanceException[] = [
  {
    id: "EX-1042",
    orderId: "LG-1042",
    brandId: "aurora-home",
    issue: "Refund mismatch",
    hypothesis: "The recorded refund may have been deducted twice.",
    input: {
      grossAmountPence: 12_000,
      refundAmountPence: 2_000,
      feeAmountPence: 350,
      actualPayoutPence: 7_650,
    },
    openedAt: "2026-08-26T09:42:00.000Z",
  },
  {
    id: "EX-1068",
    orderId: "LG-1068",
    brandId: "northwind-kids",
    issue: "Missing payout item",
    hypothesis: "The order is not present in the current payout breakdown.",
    input: {
      grossAmountPence: 21_000,
      refundAmountPence: 0,
      feeAmountPence: 2_600,
      actualPayoutPence: 14_900,
    },
    openedAt: "2026-08-26T09:40:00.000Z",
  },
];

export const automationRuns: AutomationRun[] = [
  {
    workflow: "Payout reconciliation",
    correlationId: "run_01LG42",
    status: "completed",
    attempt: 1,
    duration: "18.4s",
    startedAt: "09:42 UTC",
  },
  {
    workflow: "Exception analysis",
    correlationId: "run_01LG41",
    status: "completed",
    attempt: 1,
    duration: "7.2s",
    startedAt: "09:41 UTC",
  },
  {
    workflow: "Commerce event processing",
    correlationId: "run_01LG39",
    status: "retrying",
    attempt: 2,
    duration: "3.8s",
    startedAt: "09:39 UTC",
  },
];

export const auditEvents: AuditEvent[] = [
  {
    actor: "Reconciliation workflow",
    action: "Opened exception",
    entity: "EX-1042",
    timestamp: "09:42:18 UTC",
  },
  {
    actor: "Reconciliation Analyst agent",
    action: "Added evidence-backed hypothesis",
    entity: "EX-1042",
    timestamp: "09:42:25 UTC",
  },
  {
    actor: "System",
    action: "Ignored duplicate event",
    entity: "evt_demo_0182",
    timestamp: "09:39:04 UTC",
  },
];
