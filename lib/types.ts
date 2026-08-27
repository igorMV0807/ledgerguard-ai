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
  databaseId?: string;
  organizationId?: string;
  orderId: string;
  brandId: string;
  issue: string;
  hypothesis: string;
  evidence?: string[];
  recommendedAction?: string;
  analysisSource?: "claude" | "deterministic_fallback";
  status?: "needs_review" | "approved" | "rejected";
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

export type PeriodSummary = {
  orderCount: number;
  matchedOrderCount: number;
  expectedPayoutPence: number;
  actualPayoutPence: number;
  openVariancePence: number;
  openExceptionCount: number;
  lastReconciledAt: string;
};

export type LedgerGuardSnapshot = {
  organizationId?: string;
  brands: Brand[];
  periodSummary: PeriodSummary;
  financeExceptions: FinanceException[];
  automationRuns: AutomationRun[];
  auditEvents: AuditEvent[];
};

export type DashboardConnection = "connecting" | "supabase" | "local_fallback";
