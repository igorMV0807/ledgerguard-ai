# Application package

## One-line pitch

I built LedgerGuard AI, a production-shaped finance operations demo that reconciles synthetic e-commerce payouts with Next.js, Supabase RLS and Edge Functions, n8n, deterministic TypeScript, bounded Claude analysis, and human approval.

## CV bullets

- Built a Next.js and TypeScript finance-operations product that explains synthetic payout variances and keeps monetary calculation deterministic.
- Modelled a multi-tenant Supabase Postgres schema with explicit grants, RLS, indexes, anonymous demo sessions, reviewer-owned decisions, and an append-only audit trail.
- Implemented HMAC-signed, idempotent Edge Function ingestion plus disabled n8n workflow exports with retry, duplicate handling, safe error metadata, and correlation IDs.
- Added bounded Claude tool output with a transparent deterministic fallback and a human-in-the-loop control that cannot move money.
- Protected delivery with CI checks covering reconciliation logic, webhook signatures, database security contracts, TypeScript, linting, and production builds.

## Application answer — English

I created LedgerGuard AI specifically to demonstrate the product and engineering problems in this role. It is a synthetic multi-brand finance operations workflow built with Next.js, TypeScript, Supabase Postgres/RLS/Edge Functions, n8n, and a bounded Claude analysis step. The monetary calculation is deterministic, incoming events are HMAC-signed and idempotent, AI output is validated and advisory, and a human owns the final investigation decision. The repository includes migrations, security boundaries, tests, a Vercel demo, architecture documentation, and a record of design mistakes caught before release. No production or customer data is used.

## Recruiter viewing path

1. Open the live dashboard and understand the problem from the four summary cards.
2. Open `LG-1042` and compare the expected and actual payout.
3. Approve the investigation and open the audit log.
4. Review the architecture diagram and the tests in GitHub.
5. Read `WHAT_CLAUDE_GOT_WRONG.md` for evidence of critical review rather than blind AI acceptance.

## Honest scope statement

This is a portfolio-safe implementation with synthetic data. It demonstrates integration and security boundaries; it does not claim experience with a live NetSuite, Patchworks, Shopify, or customer financial account.
