# LedgerGuard AI — Portfolio case

## The value first

LedgerGuard turns a payout mismatch into a traceable investigation: deterministic code calculates the variance, bounded AI explains the evidence, and a human owns the decision.

## The problem

Finance operations teams often compare order, refund, fee, and payout records manually. When the numbers differ, the hard part is not subtraction; it is collecting evidence, avoiding duplicate processing, and documenting who decided what.

## The solution

LedgerGuard accepts a signed synthetic commerce event, rejects duplicates, calculates values in integer minor units, opens an exception, and shows the evidence in a focused review queue. Claude can produce a structured hypothesis when configured. If it is unavailable or invalid, the system labels and uses a deterministic fallback instead of pretending AI ran.

## One concrete example

- gross order: £120.00;
- refund: £20.00;
- processing fee: £3.50;
- expected payout: £96.50;
- actual payout: £76.50;
- variance: −£20.00.

The matching refund and variance create a reviewable hypothesis: the refund may have been deducted twice. The system recommends investigating the source records; it never moves money.

## Engineering decisions

- Next.js and TypeScript for the public product interface;
- Supabase Postgres with explicit grants and RLS for tenant and reviewer boundaries;
- anonymous Auth for a full public demo without exposing tables to unauthenticated callers;
- Edge Function with HMAC verification, payload limits, validation, and event idempotency;
- n8n export with correlation IDs, retry, duplicate handling, and a separate error workflow;
- Claude tool schema for bounded output and a deterministic fallback;
- automated checks for money rules, HMAC, security contracts, and sanitized workflow exports.

## Safety

Every person, company, order, payout, and result is fictional. The application is isolated from the Hotmart automation project and contains no production credentials or customer information.

## What I would build next in a real engagement

I would validate source-system contracts with the finance team, add measured reconciliation SLAs, implement provider-specific out-of-order event handling, run executable RLS integration tests for every role, and define an operational escalation path. Those claims are deliberately not simulated in this portfolio edition.
