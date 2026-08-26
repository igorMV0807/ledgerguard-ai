"use client";

import { useMemo, useState } from "react";
import {
  auditEvents,
  automationRuns,
  brands,
  financeExceptions,
  periodSummary,
} from "@/lib/demo-data";
import { formatMoney, reconcilePayout } from "@/lib/reconciliation";

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

  const visibleExceptions = useMemo(
    () =>
      brandId === "all"
        ? financeExceptions
        : financeExceptions.filter((item) => item.brandId === brandId),
    [brandId],
  );

  const selectedException = financeExceptions.find(
    (item) => item.id === selectedExceptionId,
  );

  function changeView(nextView: View) {
    setView(nextView);
    setSelectedExceptionId(null);
    setDecision("pending");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openException(exceptionId: string) {
    setSelectedExceptionId(exceptionId);
    setDecision("pending");
    setView("exceptions");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const reconciliationRate =
    (periodSummary.matchedOrderCount / periodSummary.orderCount) * 100;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="product-name">
          <span className="product-mark" aria-hidden="true">
            L
          </span>
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
          Finance operations
          <br />
          Portfolio edition
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
                  setDecision("pending");
                }}
              >
                {brands.map((brand) => (
                  <option value={brand.id} key={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="avatar" aria-label="Signed in as finance manager">
              IM
            </div>
          </div>
        </header>

        <div className="workspace-content">
          <div className="demo-banner" role="status">
            <span>
              <strong>Synthetic demo data</strong> · No external financial system connected
            </span>
            <span>Last reconciliation: 09:42 UTC</span>
          </div>

          {view === "overview" && (
            <Overview
              rate={reconciliationRate}
              visibleExceptions={visibleExceptions}
              onOpenException={openException}
            />
          )}

          {view === "exceptions" && !selectedException && (
            <ExceptionsList
              visibleExceptions={visibleExceptions}
              onOpenException={openException}
            />
          )}

          {view === "exceptions" && selectedException && (
            <ExceptionDetail
              financeException={selectedException}
              decision={decision}
              onDecision={setDecision}
              onBack={() => setSelectedExceptionId(null)}
            />
          )}

          {view === "automations" && <Automations />}
          {view === "audit" && <AuditLog />}
        </div>
      </section>
    </main>
  );
}

function Overview({
  rate,
  visibleExceptions,
  onOpenException,
}: {
  rate: number;
  visibleExceptions: typeof financeExceptions;
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
        <Metric
          label="Reconciliation rate"
          value={`${rate.toFixed(1)}%`}
          context={`${periodSummary.matchedOrderCount} of ${periodSummary.orderCount} orders`}
        />
        <Metric
          label="Expected"
          value={formatMoney(periodSummary.expectedPayoutPence)}
          context="Current demo period"
        />
        <Metric
          label="Received"
          value={formatMoney(periodSummary.actualPayoutPence)}
          context="Current demo period"
        />
        <Metric
          label="Open variance"
          value={formatMoney(periodSummary.openVariancePence)}
          context={`${periodSummary.openExceptionCount} cases need review`}
          tone="danger"
        />
      </section>

      <section className="data-panel" aria-labelledby="overview-exceptions-title">
        <div className="panel-heading">
          <div>
            <h3 id="overview-exceptions-title">Exceptions requiring review</h3>
            <p>AI can explain a case, but a person owns the decision.</p>
          </div>
          <span>{visibleExceptions.length} shown</span>
        </div>
        <ExceptionRows
          visibleExceptions={visibleExceptions}
          onOpenException={onOpenException}
        />
      </section>
    </>
  );
}

function Metric({
  label,
  value,
  context,
  tone = "default",
}: {
  label: string;
  value: string;
  context: string;
  tone?: "default" | "danger";
}) {
  return (
    <article className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" data-tone={tone}>
        {value}
      </div>
      <div className="metric-context">{context}</div>
    </article>
  );
}

function ExceptionsList({
  visibleExceptions,
  onOpenException,
}: {
  visibleExceptions: typeof financeExceptions;
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
        <ExceptionRows
          visibleExceptions={visibleExceptions}
          onOpenException={onOpenException}
        />
      </section>
    </>
  );
}

function ExceptionRows({
  visibleExceptions,
  onOpenException,
}: {
  visibleExceptions: typeof financeExceptions;
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
            <div className="money-value danger-text">
              {formatMoney(Math.abs(result.variancePence))}
            </div>
            <span className="status" data-tone="warning">
              Needs review
            </span>
            <button
              className="secondary-button"
              type="button"
              onClick={() => onOpenException(item.id)}
            >
              Open case
            </button>
          </article>
        );
      })}
    </div>
  );
}

function ExceptionDetail({
  financeException,
  decision,
  onDecision,
  onBack,
}: {
  financeException: (typeof financeExceptions)[number];
  decision: Decision;
  onDecision: (decision: Decision) => void;
  onBack: () => void;
}) {
  const result = reconcilePayout(financeException.input);
  const brand = brands.find((candidate) => candidate.id === financeException.brandId);
  const decisionCopy =
    decision === "approved"
      ? "Decision recorded in the local synthetic audit state."
      : decision === "rejected"
        ? "Proposal rejected. No external action was taken."
        : "";

  return (
    <>
      <button className="text-button" type="button" onClick={onBack}>
        ← Back to exceptions
      </button>

      <section className="detail-heading">
        <div>
          <p className="eyebrow">Human review required</p>
          <h2>Exception {financeException.id}</h2>
          <p>
            Order {financeException.orderId} · {brand?.name} · Opened by reconciliation
            workflow
          </p>
        </div>
        <span
          className="status"
          data-tone={decision === "pending" ? "warning" : decision}
        >
          {decision === "approved"
            ? "Investigation approved"
            : decision === "rejected"
              ? "Proposal rejected"
              : "Needs review"}
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
          <p className="agent-label">AI-assisted analysis</p>
          <h3 id="analysis-title">Refund may have been deducted twice</h3>
          <p className="analysis-copy">
            The {formatMoney(Math.abs(result.variancePence))} variance matches the
            recorded refund amount. This is a hypothesis for human review, not a
            financial decision.
          </p>
          <ul className="evidence-list">
            <li>
              <strong>Order:</strong> {formatMoney(result.grossAmountPence)} gross value
            </li>
            <li>
              <strong>Refund:</strong> one {formatMoney(result.refundAmountPence)} refund
              recorded
            </li>
            <li>
              <strong>Payout:</strong> {formatMoney(Math.abs(result.variancePence))} below
              deterministic expectation
            </li>
          </ul>
        </section>
      </div>

      <section className="proposal-card" aria-labelledby="proposal-title">
        <div>
          <p className="eyebrow">Proposed action</p>
          <h3 id="proposal-title">Open a finance investigation</h3>
          <p>
            Request the payout breakdown and compare the refund line. No order or
            payment will be changed.
          </p>
        </div>
        <div className="decision-actions">
          <button
            className="danger-button"
            type="button"
            onClick={() => onDecision("rejected")}
          >
            Reject proposal
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => onDecision("approved")}
          >
            Approve investigation
          </button>
        </div>
        <p className="decision-message" aria-live="polite">
          {decisionCopy}
        </p>
      </section>
    </>
  );
}

function CalculationRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="calculation-row">
      <span>{label}</span>
      <strong className={danger ? "danger-text" : undefined}>{formatMoney(value)}</strong>
    </div>
  );
}

function Automations() {
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
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Correlation</th>
                <th>Status</th>
                <th>Attempt</th>
                <th>Duration</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {automationRuns.map((run) => (
                <tr key={run.correlationId}>
                  <td>{run.workflow}</td>
                  <td className="code-value">{run.correlationId}</td>
                  <td>
                    <span className="status" data-tone={run.status}>
                      {run.status}
                    </span>
                  </td>
                  <td>{run.attempt}</td>
                  <td>{run.duration}</td>
                  <td>{run.startedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AuditLog() {
  return (
    <>
      <section className="section-heading">
        <div>
          <p className="eyebrow">Traceable decisions</p>
          <h2>Audit log</h2>
          <p>Important system, agent and human actions in one immutable-looking view.</p>
        </div>
      </section>

      <section className="data-panel" aria-label="Synthetic audit log">
        <div className="audit-list">
          {auditEvents.map((event) => (
            <article className="audit-row" key={`${event.entity}-${event.timestamp}`}>
              <div className="audit-marker" aria-hidden="true" />
              <div>
                <div className="primary-value">{event.action}</div>
                <div className="secondary-value">
                  {event.actor} · {event.entity}
                </div>
              </div>
              <time>{event.timestamp}</time>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
