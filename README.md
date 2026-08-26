# LedgerGuard AI

LedgerGuard AI is a portfolio-safe finance operations product for multi-brand e-commerce reconciliation. It shows how order, refund, fee, and payout evidence can be combined into a deterministic calculation, an explainable AI-assisted investigation, and a human approval flow.

> **Current status:** portfolio implementation complete locally. The public site still uses a safe local fallback until the new, isolated Supabase sandbox is provisioned and connected. No production system is used.

**Live demo:** [ledgerguard-ai-three.vercel.app](https://ledgerguard-ai-three.vercel.app)

![Synthetic LedgerGuard AI dashboard](docs/dashboard-overview.png)

## Why this project exists

Finance teams can lose time investigating why an e-commerce payout does not match the expected value. LedgerGuard AI is designed to centralise that evidence, calculate the variance without AI, propose a traceable explanation with AI, and keep a person responsible for the final decision.

## What is implemented

- Next.js App Router with TypeScript;
- responsive finance operations interface;
- overview, exception, automation, and audit views;
- deterministic reconciliation in integer minor units;
- synthetic case `LG-1042` with a £20.00 payout variance;
- anonymous demo sessions and persistent human decisions when Supabase is configured;
- Postgres migrations with explicit grants, RLS, constraints, indexes, and synthetic seed data;
- a signed, idempotent Supabase Edge Function for synthetic commerce events;
- bounded Claude analysis through a forced tool schema, with a transparent deterministic fallback;
- disabled, sanitized n8n workflows with HMAC signing, retry, duplicate handling, and an error workflow;
- automated tests for reconciliation, webhook HMAC, migration controls, and n8n exports;
- CI, pull request template, and an active Vercel deployment;
- Claude Code project guidance and specialist agent definitions;
- no secrets, customer data, production credentials, or production integrations.

## Demo story

1. A synthetic order has a gross value of £120.00.
2. A £20.00 refund and £3.50 processing fee produce a £96.50 expected payout.
3. The synthetic actual payout is £76.50.
4. Deterministic code identifies the £20.00 variance.
5. The interface shows an evidence-backed AI hypothesis.
6. A finance manager approves or rejects an investigation—not a money movement.

All values are fictional and are not business outcomes.

## Run locally

Requirements: Node.js 22+ and pnpm 11.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify

```bash
pnpm check
```

The command runs linting, TypeScript checks, unit tests, and a production build.

## Architecture

```mermaid
flowchart LR
    SOURCE[Synthetic generator or isolated n8n] -->|HMAC signed event| EDGE[Supabase Edge Function]
    EDGE --> DB[(Supabase Postgres + RLS)]
    DB --> N8N[n8n reconciliation]
    N8N --> RULES[Deterministic calculation]
    RULES -->|Variance| AGENTS[Claude agent workflow]
    AGENTS --> HUMAN[Human approval]
    HUMAN --> AUDIT[(Audit log)]
    DB --> APP[Next.js on Vercel]
    AUDIT --> APP
```

The public app signs visitors in anonymously to the isolated demo project. RLS allows them to read only the synthetic demo organisation and insert only their own review decision. The secret key remains inside the Edge Function.

## Repository map

```text
.
├── .claude/agents/        # Specialist Claude Code reviewers
├── .github/               # CI and pull request quality gate
├── app/                   # Next.js application
├── components/            # Product interface
├── docs/                  # TDD, security, and decision evidence
├── lib/                   # Types, synthetic data, deterministic rules
├── n8n/                   # Disabled, sanitized workflow exports
├── prompts/               # Versioned runtime prompt contract
├── supabase/              # Migration, seed, RLS, and Edge Function
└── tests/                 # Rule, security-contract, HMAC, and export tests
```

## Safety boundary

- public mode uses synthetic values only;
- no production service is queried or modified;
- no external integration is implied by placeholder folders;
- database access uses RLS and explicit grants;
- a service-role or secret key must never be exposed to the browser;
- AI output may propose an investigation but cannot approve or execute it;
- NetSuite and Patchworks experience will not be claimed without a real authorised integration.

See the [Technical Design Document](docs/TDD.md), [Security](docs/SECURITY.md),
[90-second demo script](docs/DEMO_SCRIPT.md), [portfolio case](docs/PORTFOLIO_CASE.md),
and [application package](docs/APPLICATION_PACKAGE.md).

## Language

[Português (Brasil)](README.pt-BR.md)
