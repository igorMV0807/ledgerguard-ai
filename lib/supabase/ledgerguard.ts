import { demoSnapshot } from "@/lib/demo-data";
import { getSupabaseBrowserClient, hasSupabaseEnvironment } from "@/lib/supabase/browser";
import type {
  AuditEvent,
  AutomationRun,
  DashboardConnection,
  FinanceException,
  LedgerGuardSnapshot,
} from "@/lib/types";

const DEMO_ORGANIZATION_SLUG = "ledgerguard-demo";

type LoadResult = {
  snapshot: LedgerGuardSnapshot;
  connection: DashboardConnection;
  message?: string;
};

type BrandRow = { id: string; slug: string; name: string };
type PeriodRow = {
  order_count: number;
  matched_order_count: number;
  expected_payout_pence: number;
  actual_payout_pence: number;
  open_variance_pence: number;
  open_exception_count: number;
  last_reconciled_at: string;
};
type ExceptionRow = {
  id: string;
  reference: string;
  brand_id: string;
  issue: string;
  hypothesis: string;
  evidence: string[];
  recommended_action: string;
  analysis_source: FinanceException["analysisSource"];
  status: FinanceException["status"];
  gross_amount_pence: number;
  refund_amount_pence: number;
  fee_amount_pence: number;
  actual_payout_pence: number;
  opened_at: string;
  orders: { external_order_id: string };
};
type AutomationRunRow = {
  workflow: string;
  correlation_id: string;
  status: AutomationRun["status"];
  attempt: number;
  duration_ms: number;
  started_at: string;
};
type AuditEventRow = {
  actor_id: string;
  action: string;
  entity_id: string;
  occurred_at: string;
};

function fallback(message?: string): LoadResult {
  return {
    snapshot: demoSnapshot,
    connection: "local_fallback",
    message,
  };
}

function formatUtc(timestamp: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(new Date(timestamp)) + " UTC";
}

export async function loadLedgerGuardSnapshot(): Promise<LoadResult> {
  if (!hasSupabaseEnvironment()) {
    return fallback("The public database sandbox is not configured in this deployment.");
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (!sessionData.session) {
      const { error: anonymousError } = await supabase.auth.signInAnonymously();
      if (anonymousError) throw anonymousError;
    }

    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", DEMO_ORGANIZATION_SLUG)
      .single();

    if (organizationError) throw organizationError;

    const organizationId = organization.id as string;
    const [brandResult, periodResult, exceptionResult, runResult, auditResult] =
      await Promise.all([
        supabase
          .from("brands")
          .select("id, slug, name")
          .eq("organization_id", organizationId)
          .order("name"),
        supabase
          .from("reconciliation_periods")
          .select("*")
          .eq("organization_id", organizationId)
          .order("period_end", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("finance_exceptions")
          .select("*, orders!inner(external_order_id)")
          .eq("organization_id", organizationId)
          .order("opened_at", { ascending: false }),
        supabase
          .from("automation_runs")
          .select("*")
          .eq("organization_id", organizationId)
          .order("started_at", { ascending: false })
          .limit(10),
        supabase
          .from("audit_events")
          .select("*")
          .eq("organization_id", organizationId)
          .order("occurred_at", { ascending: false })
          .limit(20),
      ]);

    const firstError = [
      brandResult.error,
      periodResult.error,
      exceptionResult.error,
      runResult.error,
      auditResult.error,
    ].find(Boolean);
    if (firstError) throw firstError;

    const brandRows = (brandResult.data ?? []) as BrandRow[];
    const brandIdByDatabaseId = new Map(
      brandRows.map((brand) => [brand.id as string, brand.slug as string]),
    );

    const financeExceptions: FinanceException[] = (
      (exceptionResult.data ?? []) as ExceptionRow[]
    ).map((item) => {
        const joinedOrder = item.orders;
        return {
          id: item.reference as string,
          databaseId: item.id as string,
          organizationId,
          orderId: joinedOrder.external_order_id,
          brandId: brandIdByDatabaseId.get(item.brand_id as string) ?? "unknown",
          issue: item.issue as string,
          hypothesis: item.hypothesis as string,
          evidence: item.evidence as string[],
          recommendedAction: item.recommended_action as string,
          analysisSource: item.analysis_source as FinanceException["analysisSource"],
          status: item.status as FinanceException["status"],
          input: {
            grossAmountPence: Number(item.gross_amount_pence),
            refundAmountPence: Number(item.refund_amount_pence),
            feeAmountPence: Number(item.fee_amount_pence),
            actualPayoutPence: Number(item.actual_payout_pence),
          },
          openedAt: item.opened_at as string,
        };
      });

    const automationRuns: AutomationRun[] = (
      (runResult.data ?? []) as AutomationRunRow[]
    ).map((item) => ({
      workflow: item.workflow as string,
      correlationId: item.correlation_id as string,
      status: item.status as AutomationRun["status"],
      attempt: Number(item.attempt),
      duration: `${(Number(item.duration_ms) / 1000).toFixed(1)}s`,
      startedAt: formatUtc(item.started_at as string),
    }));

    const auditEvents: AuditEvent[] = ((auditResult.data ?? []) as AuditEventRow[]).map((item) => ({
      actor: item.actor_id as string,
      action: item.action as string,
      entity: item.entity_id as string,
      timestamp: formatUtc(item.occurred_at as string),
    }));

    const period = periodResult.data as PeriodRow;
    return {
      connection: "supabase",
      snapshot: {
        organizationId,
        brands: [
          { id: "all", name: "All brands" },
          ...brandRows.map((brand) => ({
            id: brand.slug as string,
            name: brand.name as string,
          })),
        ],
        periodSummary: {
          orderCount: Number(period.order_count),
          matchedOrderCount: Number(period.matched_order_count),
          expectedPayoutPence: Number(period.expected_payout_pence),
          actualPayoutPence: Number(period.actual_payout_pence),
          openVariancePence: Number(period.open_variance_pence),
          openExceptionCount: Number(period.open_exception_count),
          lastReconciledAt: period.last_reconciled_at as string,
        },
        financeExceptions,
        automationRuns,
        auditEvents,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return fallback(`The sandbox could not be reached: ${message}`);
  }
}

export async function saveHumanDecision(
  financeException: FinanceException,
  decision: "approved" | "rejected",
) {
  if (!financeException.databaseId || !financeException.organizationId) {
    return { persisted: false as const };
  }

  const supabase = getSupabaseBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("No demo reviewer session");

  const { error } = await supabase.from("human_decisions").insert({
    organization_id: financeException.organizationId,
    exception_id: financeException.databaseId,
    reviewer_id: userData.user.id,
    decision,
    rationale:
      decision === "approved"
        ? "Approved investigation only; no automatic financial action."
        : "Rejected the proposed investigation; no financial action taken.",
  });

  if (error) throw error;
  return { persisted: true as const };
}
