"use client";

import { useEffect, useMemo, useState } from "react";
import { demoSnapshot } from "@/lib/demo-data";
import { formatMoney, reconcilePayout } from "@/lib/reconciliation";
import {
  loadLedgerGuardSnapshot,
  saveHumanDecision,
} from "@/lib/supabase/ledgerguard";
import type {
  AuditEvent,
  AutomationRun,
  Brand,
  DashboardConnection,
  FinanceException,
  LedgerGuardSnapshot,
  PeriodSummary,
} from "@/lib/types";

type View = "overview" | "exceptions" | "automations" | "audit";
type Decision = "pending" | "approved" | "rejected";

const navigation: Array<{ id: View; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "exceptions", label: "Exceptions" },
  { id: "automations", label: "Automations" },
  { id: "audit", label: "Audit log" },
];

const pageTitles: Record<View, string> = {
  overview: "Overview",
  exceptions: "Exceptions",
  automations: "Automations",
  audit: "Audit log",
};

export function LedgerGuardDashboard() {
  const [view, setView] = useState<View>("overview");
  const [brandId, setBrandId] = useState("all");
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision>("pending");
  const [snapshot, setSnapshot] = useState<LedgerGuardSnapshot>(demoSnapshot);
  const [connection, setConnection] = useState<DashboardConnection>("connecting");
  const [connectionMessage, setConnectionMessage] = useState<string>();
  const [savingDecision, setSavingDecision] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState("");

  useEffect(() => {
    let active = true;

    void loadLedgerGuardSnapshot().then((result) => {
      if (!active) return;
      setSnapshot(result.snapshot);
      setConnection(result.connection);
      setConnectionMessage(result.message);
    });

    return () => {
      active = false;
    };
  }, []);

  const visibleExceptions = useMemo(
    () =>
      brandId === "all"
        ? snapshot.financeExceptions
        : snapshot.financeExceptions.filter((item) => item.brandId === brandId),
    [brandId, snapshot.financeExceptions],
  );

  const selectedException = snapshot.financeExceptions.find(
    (item) => item.id === selectedExceptionId,
  );

  function resetDecision() {
    setDecision("pending");
    setDecisionMessage("");
  }

  function changeView(nextView: View) {
    setView(nextView);
    setSelectedExceptionId(null);
    resetDecision();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openException(exceptionId: string) {
    setSelectedExceptionId(exceptionId);
    resetDecision();
    setView("exceptions");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDecision(nextDecision: Exclude<Decision, "pending">) {
    if (!selectedException) return;

    setSavingDecision(true);
    setDecisionMessage("");
    try {
      const result = await saveHumanDecision(selectedException, nextDecision);
      const action =
        nextDecision === "approved" ? "Approved investigation" : "Rejected investigation";

      setDecision(nextDecision);
      setDecisionMessage(
        result.persisted
          ? "Decision saved in Supabase and added to the audit trail."
          : "Decision recorded in this local synthetic session.",
      );
      setSnapshot((current) => ({
        ...current,
        auditEvents: [
          {
            actor: result.persisted ? "anonymous-demo-reviewer" : "Local demo reviewer",
            action,
            entity: selectedException.id,
            timestamp: "just now",
          },
          ...current.auditEvents,
        ],
      }));
    } catch (error) {
      setDecisionMessage(
        error instanceof Error
          ? `Decision was not saved: ${error.message}`
          : "Decision was not saved.",
      );
    } finally {
      setSavingDecision(false);
    }
  }

  const reconciliationRate =
    (snapshot.periodSummary.matchedOrderCount / snapshot.periodSummary.orderCount) * 100;

  const lastReconciledAt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(new Date(snapshot.periodSummary.lastReconciledAt));

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="product-name">
          <span className="product-mark" aria-hidden="true">L</span>
          <span>LedgerGuard AI</span>
        </div>

        <nav className="primary-navigation" aria-label="Primary navigation">
          {navigation.map((item) => (
            <button
              className="navigation-button"
              type="button"
              key={item.id}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => changeView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          Finance operations<br />Portfolio edition
        </div>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div>
            <div className="eyebrow">Finance operations</div>
            <h1>{selectedException ? "Exception detail" : pageTitles[view]}</h1>
          </div>

          <div className="header-actions">
            <label className="brand-field">
              <span className="visually-hidden">Selected brand</span>
              <select
                value={brandId}
                onChange={(event) => {
                  setBrandId(event.target.value);
                  setSelectedExceptionId(null);
                  resetDecision();
                }}
              >
                {snapshot.brands.map((brand) => (
                  <option value={brand.id} key={brand.id}>{brand.name}</option>
                ))}
              </select>
            </label>
            <div className="avatar" aria-label="Signed in as demo finance manager">IM</div>
          </div>
        </header>

        <div className="workspace-content">
          <div className="demo-banner" role="status">
            <span>
              <strong>Synthetic demo data</strong> ·{" "}
              {connection === "supabase"
                ? "Isolated Supabase sandbox connected"
                : connection === "connecting"
                  ? "Connecting to the isolated sandbox…"
                  : "Safe local fallback active"}
            </span>
            <span>Last reconciliation: {lastReconciledAt} UTC</span>
          </div>

          {connectionMessage && connection === "local_fallback" && (
            <p className="connection-note">{connectionMessage}</p>
          )}

          {view === "overview" && (
            <Overview
              rate={reconciliationRate}
              periodSummary={snapshot.periodSummary}
              brands={snapshot.brands}
              visibleExceptions={visibleExceptions}
              onOpenException={openException}
            />
          )}

          {view === "exceptions" && !selectedException && (
            <ExceptionsList
              brands={snapshot.brands}
              visibleExceptions={visibleExceptions}
              onOpenException={openException}
            />
          )}

          {view === "exceptions" && selectedException && (
            <ExceptionDetail
              financeException={selectedException}
              brands={snapshot.brands}
              decision={decision}
              onDecision={handleDecision}
              decisionMessage={decisionMessage}
              savingDecision={savingDecision}
              onBack={() => setSelectedExceptionId(null)}
            />
          )}

          {view === "automations" && <Automations runs={snapshot.automationRuns} />}
          {view === "audit" && <AuditLog events={snapshot.auditEvents} />}
        </div>
      </section>
    </main>
  );
}

function Overview({ rate, periodSummary, brands, visibleExceptions, onOpenException }: {
  rate: number;
  periodSummary: PeriodSummary;
  brands: Brand[];
  visibleExceptions: FinanceException[];
  onOpenException: (exceptionId: string) => void;
}) {
  return (
    <>
      <section className="section-heading">
        <div>
          <p className="eyebrow">Current period</p>
          <h2>Finance health at a glance</h2>
          <p>What matched, what did not, and what needs a human decision.</p>
        </div>
      </section>

      <section className="metric-grid" aria-label="Synthetic finance summary">
        <Metric label="Reconciliation rate" value={`${rate.toFixed(1)}%`} context={`${periodSummary.matchedOrderCount} of ${periodSummary.orderCount} orders`} />
        <Metric label="Expected" value={formatMoney(periodSummary.expectedPayoutPence)} context="Current demo period" />
        <Metric label="Received" value={formatMoney(periodSummary.actualPayoutPence)} context="Current demo period" />
        <Metric label="Open variance" value={formatMoney(periodSummary.openVariancePence)} context={`${periodSummary.openExceptionCount} cases need review`} tone="danger" />
      </section>

      <section className="data-panel" aria-labelledby="overview-exceptions-title">
        <div className="panel-heading">
          <div>
            <h3 id="overview-exceptions-title">Exceptions requiring review</h3>
            <p>AI can explain a case, but a person owns the decision.</p>
          </div>
          <span>{visibleExceptions.length} shown</span>
        </div>
        <ExceptionRows brands={brands} visibleExceptions={visibleExceptions} onOpenException={onOpenException} />
      </section>
    </>
  );
}

function Metric({ label, value, context, tone = "default" }: {
  label: string;
  value: string;
  context: string;
  tone?: "default" | "danger";
}) {
  return (
    <article className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" data-tone={tone}>{value}</div>
      <div className="metric-context">{context}</div>
    </article>
  );
}

function ExceptionsList({ brands, visibleExceptions, onOpenException }: {
  brands: Brand[];
  visibleExceptions: FinanceException[];
  onOpenException: (exceptionId: string) => void;
}) {
  return (
    <>
      <section className="section-heading">
        <div>
          <p className="eyebrow">Human review queue</p>
          <h2>Open exceptions</h2>
          <p>Every suggested action remains pending until a manager decides.</p>
        </div>
      </section>
      <section className="data-panel" aria-label="Open finance exceptions">
        <ExceptionRows brands={brands} visibleExceptions={visibleExceptions} onOpenException={onOpenException} />
      </section>
    </>
  );
}

function ExceptionRows({ brands, visibleExceptions, onOpenException }: {
  brands: Brand[];
  visibleExceptions: FinanceException[];
  onOpenException: (exceptionId: string) => void;
}) {
  if (visibleExceptions.length === 0) {
    return <div className="empty-state">No open exceptions for this brand.</div>;
  }

  return (
    <div className="exception-list">
      {visibleExceptions.map((item) => {
        const result = reconcilePayout(item.input);
        const brand = brands.find((candidate) => candidate.id === item.brandId);
        return (
          <article className="exception-row" key={item.id}>
            <div>
              <div className="primary-value">{item.orderId}</div>
              <div className="secondary-value">{brand?.name}</div>
            </div>
            <div className="exception-description">
              <div>{item.issue}</div>
              <div className="secondary-value">{item.hypothesis}</div>
            </div>
            <div className="money-value danger-text">{formatMoney(Math.abs(result.variancePence))}</div>
            <span className="status" data-tone="warning">Needs review</span>
            <button className="secondary-button" type="button" onClick={() => onOpenException(item.id)}>Open case</button>
          </article>
        );
      })}
    </div>
  );
}

function ExceptionDetail({
  financeException,
  brands,
  decision,
  onDecision,
  decisionMessage,
  savingDecision,
  onBack,
}: {
  financeException: FinanceException;
  brands: Brand[];
  decision: Decision;
  onDecision: (decision: Exclude<Decision, "pending">) => Promise<void>;
  decisionMessage: string;
  savingDecision: boolean;
  onBack: () => void;
}) {
  const result = reconcilePayout(financeException.input);
  const brand = brands.find((candidate) => candidate.id === financeException.brandId);
  const evidence = financeException.evidence ?? [
    `Order gross: ${formatMoney(result.grossAmountPence)}`,
    `Refund: ${formatMoney(result.refundAmountPence)}`,
    `Variance: ${formatMoney(Math.abs(result.variancePence))}`,
  ];

  return (
    <>
      <button className="text-button" type="button" onClick={onBack}>← Back to exceptions</button>
      <section className="detail-heading">
        <div>
          <p className="eyebrow">Human review required</p>
          <h2>Exception {financeException.id}</h2>
          <p>Order {financeException.orderId} · {brand?.name} · Opened by reconciliation workflow</p>
        </div>
        <span className="status" data-tone={decision === "pending" ? "warning" : decision}>
          {decision === "approved" ? "Investigation approved" : decision === "rejected" ? "Proposal rejected" : "Needs review"}
        </span>
      </section>

      <div className="detail-grid">
        <section className="detail-card" aria-labelledby="calculation-title">
          <h3 id="calculation-title">Deterministic calculation</h3>
          <CalculationRow label="Gross order" value={result.grossAmountPence} />
          <CalculationRow label="Refund" value={-result.refundAmountPence} />
          <CalculationRow label="Processing fee" value={-result.feeAmountPence} />
          <CalculationRow label="Expected payout" value={result.expectedPayoutPence} />
          <CalculationRow label="Actual payout" value={result.actualPayoutPence} />
          <CalculationRow label="Variance" value={result.variancePence} danger />
        </section>

        <section className="detail-card" aria-labelledby="analysis-title">
          <p className="agent-label">
            {financeException.analysisSource === "claude" ? "Claude-assisted analysis" : "Deterministic fallback analysis"}
          </p>
          <h3 id="analysis-title">{financeException.issue}</h3>
          <p className="analysis-copy">{financeException.hypothesis} This is a hypothesis for human review, not a financial decision.</p>
          <ul className="evidence-list">
            {evidence.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </div>

      <section className="proposal-card" aria-labelledby="proposal-title">
        <div>
          <p className="eyebrow">Proposed action</p>
          <h3 id="proposal-title">Open a finance investigation</h3>
          <p>{financeException.recommendedAction ?? "Request the payout breakdown and compare the source records. No order or payment will be changed."}</p>
        </div>
        <div className="decision-actions">
          <button className="danger-button" type="button" onClick={() => onDecision("rejected")} disabled={savingDecision || decision !== "pending"}>Reject proposal</button>
          <button className="primary-button" type="button" onClick={() => onDecision("approved")} disabled={savingDecision || decision !== "pending"}>{savingDecision ? "Saving…" : "Approve investigation"}</button>
        </div>
        <p className="decision-message" aria-live="polite">{decisionMessage}</p>
      </section>
    </>
  );
}

function CalculationRow({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="calculation-row">
      <span>{label}</span>
      <strong className={danger ? "danger-text" : undefined}>{formatMoney(value)}</strong>
    </div>
  );
}

function Automations({ runs }: { runs: AutomationRun[] }) {
  return (
    <>
      <section className="section-heading">
        <div>
          <p className="eyebrow">Workflow observability</p>
          <h2>Automation runs</h2>
          <p>Correlation, attempts and sanitized status for each synthetic run.</p>
        </div>
      </section>
      <section className="data-panel" aria-label="Synthetic automation runs">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Workflow</th><th>Correlation</th><th>Status</th><th>Attempt</th><th>Duration</th><th>Started</th></tr></thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.correlationId}>
                  <td>{run.workflow}</td><td className="code-value">{run.correlationId}</td>
                  <td><span className="status" data-tone={run.status}>{run.status}</span></td>
                  <td>{run.attempt}</td><td>{run.duration}</td><td>{run.startedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AuditLog({ events }: { events: AuditEvent[] }) {
  return (
    <>
      <section className="section-heading">
        <div>
          <p className="eyebrow">Traceable decisions</p>
          <h2>Audit log</h2>
          <p>Important system, agent and human actions in one append-only view.</p>
        </div>
      </section>
      <section className="data-panel" aria-label="Synthetic audit log">
        <div className="audit-list">
          {events.map((event) => (
            <article className="audit-row" key={`${event.entity}-${event.timestamp}`}>
              <div className="audit-marker" aria-hidden="true" />
              <div><div className="primary-value">{event.action}</div><div className="secondary-value">{event.actor} · {event.entity}</div></div>
              <time>{event.timestamp}</time>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
