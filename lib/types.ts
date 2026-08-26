export type Brand = {
  id: string;
  name: string;
};

export type ReconciliationInput = {
  grossAmountPence: number;
  refundAmountPence: number;
  feeAmountPence: number;
  actualPayoutPence: number;
};

export type ReconciliationResult = ReconciliationInput & {
  expectedPayoutPence: number;
  variancePence: number;
  status: "matched" | "exception";
};

export type FinanceException = {
  id: string;
  orderId: string;
  brandId: string;
  issue: string;
  hypothesis: string;
  input: ReconciliationInput;
  openedAt: string;
};

export type AutomationRun = {
  workflow: string;
  correlationId: string;
  status: "completed" | "retrying" | "failed";
  attempt: number;
  duration: string;
  startedAt: string;
};

export type AuditEvent = {
  actor: string;
  action: string;
  entity: string;
  timestamp: string;
};
