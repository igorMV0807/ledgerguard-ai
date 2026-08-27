# LedgerGuard AI — Technical Design Document

**Status:** implemented locally; isolated hosted sandbox pending
**Language:** English, for portfolio and interview review  
**Data classification:** synthetic only in the current milestone

## 1. Context

Multi-brand e-commerce finance teams need to understand why an expected payout differs from an actual payout. Relevant evidence can be split across orders, refunds, fees, payouts, workflow runs, and human decisions.

LedgerGuard AI will centralise that evidence, calculate variance deterministically, open an exception, use bounded AI agents to propose an explanation, and require a human decision. The portfolio edition must remain safe to inspect publicly.

## 2. Goals

- Demonstrate a production-shaped Next.js and TypeScript product.
- Demonstrate Supabase Postgres modelling, explicit grants, RLS, and Edge Functions.
- Demonstrate n8n integration, retry, failure, and observability.
- Demonstrate Claude Code and bounded runtime agents with human oversight.
- Demonstrate disciplined GitHub pull requests and Vercel Preview/Production environments.
- Communicate the system clearly to technical and non-technical reviewers.

## 3. Non-goals

- Move money or change a real order.
- Connect a production Shopify, ERP, NetSuite, or Patchworks account without written authority.
- Claim revenue, accuracy, savings, or operational scale without measured evidence.
- Let an LLM perform monetary calculations or approve an action.
- Build a full identity administration product in the portfolio MVP.

## 4. Primary scenario

The synthetic order `LG-1042` has:

- gross amount: £120.00;
- refund: £20.00;
- fee: £3.50;
- expected payout: £96.50;
- actual payout: £76.50;
- variance: −£20.00.

Deterministic TypeScript calculates the variance. The AI layer receives references to the order, refund, and payout and proposes that the refund may have been deducted twice. A finance manager may approve only the creation of an investigation.

## 5. Current implementation

Implemented:

- Next.js App Router and TypeScript foundation;
- responsive synthetic dashboard;
- overview, exceptions, automations, and audit views;
- deterministic reconciliation module;
- anonymous demo authentication boundary;
- schema migration, explicit privileges, RLS policies, indexes, and seed;
- signed and idempotent Edge Function;
- structured Claude tool call with deterministic fallback;
- sanitized n8n success, retry, duplicate, and error workflows;
- unit and security-contract tests;
- CI and review templates;
- Claude Code project and specialist reviewer definitions.

Pending external provisioning:

- the new hosted Supabase sandbox and its project-specific keys;
- deployment of the included Edge Function and secrets;
- Vercel environment values for that sandbox;
- optional Anthropic API key (the deterministic fallback remains functional without it);
- importing the disabled n8n workflow into an isolated instance.

## 6. Target architecture

```mermaid
flowchart LR
    SOURCE[Shopify sandbox or synthetic generator] --> EDGE[Edge Function]
    EDGE --> EVENTS[(integration_events)]
    EVENTS --> DB[(Supabase Postgres)]
    DB --> N8N[n8n workflows]
    N8N --> RULES[Deterministic reconciliation]
    RULES -->|Matched| CLOSED[Close reconciliation]
    RULES -->|Variance| EXCEPTION[Create exception]
    EXCEPTION --> ORCHESTRATOR[AI orchestrator]
    ORCHESTRATOR --> ANALYST[Reconciliation analyst]
    ORCHESTRATOR --> REVIEWER[Risk reviewer]
    ORCHESTRATOR --> PLANNER[Action planner]
    ANALYST --> REPORT[Evidence-backed report]
    REVIEWER --> REPORT
    PLANNER --> REPORT
    REPORT --> HUMAN[Human approval]
    HUMAN --> AUDIT[(audit_logs)]
    DB --> APP[Next.js application]
    AUDIT --> APP
    APP --> VERCEL[Vercel Preview and Production]
```

## 7. Implemented data model

| Table | Purpose | Security boundary |
|---|---|---|
| `organizations` | Tenant boundary and explicit demo flag | demo visitor or membership |
| `organization_memberships` | User and role mapping | own row or trusted server |
| `brands` | Brand inside an organisation | organisation access |
| `reconciliation_periods` | Dashboard aggregate for a fixed period | organisation access |
| `orders` | Normalised synthetic order evidence | organisation access |
| `payouts` | Synthetic payout evidence | organisation access |
| `finance_exceptions` | Deterministic variance and bounded analysis | organisation access; trusted writes |
| `human_decisions` | Reviewer-owned approval/rejection | own demo decision; trusted review |
| `automation_runs` | n8n observability | brand-aware where applicable |
| `webhook_events` | Private idempotency boundary | trusted Edge Function only |
| `audit_events` | Append-only decision trail | organisation read; trusted append only |

The versioned migration is `supabase/migrations/20260826194257_ledgerguard_foundation.sql`.

## 8. Authorisation model

- The unauthenticated `anon` database role has no table grants.
- Public visitors first receive a Supabase anonymous user session and therefore use the `authenticated` role.
- An anonymous user can access only an organisation explicitly marked `is_demo = true`.
- An authenticated user needs an active `brand_memberships` row for the same `brand_id`.
- Demo visitors can insert only a decision with their own `auth.uid()` and cannot update finance records.
- Analysts can investigate and propose but cannot approve.
- Auditors are read-only.
- Updates must use both row selection and resulting-row checks.
- Grants and policies are explicit and versioned together.
- Every exposed table gets allow and deny tests.
- Browser clients never receive a secret/service-role key.

## 9. Edge Function boundary

`ingest-commerce-event` will:

1. restrict method and content type;
2. limit request size;
3. verify the provider signature before trusting fields;
4. validate a versioned payload schema;
5. use the provider event ID for idempotency;
6. write raw synthetic and normalised evidence;
7. return quickly and leave long work to the workflow layer;
8. log correlation and safe error metadata only.

## 10. n8n boundary

Planned workflows:

- event processing;
- payout reconciliation;
- bounded retry and permanent failure handling;
- AI exception analysis;
- daily summary.

Every public export will be disabled, sanitised, and disconnected. Runs will carry a correlation ID. Replay must be idempotent.

## 11. AI boundary

- deterministic code owns calculations;
- agents receive only necessary evidence;
- outputs use a validated structured schema;
- prompts are versioned;
- every conclusion carries evidence references;
- missing evidence is reported, not invented;
- an unavailable or invalid model response falls back to a safe manual-review state;
- agents cannot approve or execute a financial action.

## 12. Environments

| Environment | Data | Services | Purpose |
|---|---|---|---|
| Local | synthetic seed | local/mocks | development |
| Preview | isolated synthetic | sandbox/mocks | pull request review |
| Production demo | fixed synthetic | no external write | public portfolio |

The project will never share credentials, database, n8n instance, or state with the Hotmart project.

## 13. Verification plan

- lint, TypeScript, unit tests, and production build in CI;
- money and rounding unit tests;
- schema and migration verification from a clean database;
- RLS allow/deny tests for every role and unrelated access;
- webhook signature, size, schema, duplicate, and ordering tests;
- n8n success, retry, permanent failure, and replay tests;
- invalid and unavailable AI response tests;
- keyboard, responsive, empty, loading, and error UI states;
- public demo network inspection proving no external request.

## 14. Observability

- correlation ID from intake through reconciliation and exception;
- structured safe logs;
- `automation_runs` for status, attempt, duration, and error code;
- audit entry for meaningful human or trusted system actions;
- no credentials, auth headers, or personal data in logs.

## 15. Rollout

1. foundation and first Vercel Preview;
2. isolated Supabase schema and RLS tests;
3. event intake and idempotency;
4. deterministic reconciliation workflow;
5. bounded agents and human approval;
6. public synthetic hardening;
7. case study, English demo, and application material.

Each step requires a focused pull request and verification evidence.
