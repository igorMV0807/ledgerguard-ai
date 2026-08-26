# Interview walkthrough

## One-sentence explanation

> LedgerGuard AI is a synthetic multi-brand finance operations product that calculates e-commerce payout differences deterministically, uses bounded AI to explain the evidence, and keeps a human responsible for the decision.

## Five-minute walkthrough

### 1. Problem — 30 seconds

Explain that order, refund, fee, and payout evidence is often spread across systems. The product gathers that evidence into a single review case.

### 2. Product — 60 seconds

Show Overview, open `LG-1042`, and explain the £20.00 variance in plain language. Emphasise that every visible value is synthetic.

### 3. Technical design — 75 seconds

Explain the target flow:

```text
commerce event → Edge Function → Postgres → n8n → deterministic rules
→ bounded agents → human approval → audit log → Next.js dashboard
```

State clearly which parts exist and which remain planned.

### 4. Security — 60 seconds

Discuss environment separation, explicit grants, RLS allow/deny tests, server-only secrets, webhook verification, idempotency, and why AI cannot approve an action.

### 5. Delivery — 45 seconds

Show the pull request, Vercel Preview, CI checks, unit tests, and the review instructions for AI-produced code.

### 6. Trade-offs — 30 seconds

- Money is stored and calculated in integer minor units.
- The public demo is disconnected instead of imitating production connectivity.
- The AI hypothesis is useful only when it cites the supplied evidence.
- Scope is intentionally limited to one strong end-to-end case.

## Honest answers to likely questions

### Is this connected to Shopify or NetSuite?

> Not in the current foundation. The integration boundary is designed for a Shopify sandbox or documented synthetic payload. I do not claim NetSuite or Patchworks experience without an authorised implementation.

### Is Supabase already running?

> Not in this milestone. The next pull request will create an isolated schema, explicit grants, tested RLS, and the webhook Edge Function. The public demo remains disconnected.

### Does AI calculate or approve the financial result?

> No. Deterministic code calculates the expected payout and variance. AI explains evidence and proposes an investigation; a person decides.

### Is the £20 result a real business outcome?

> No. It is a documented synthetic scenario created to demonstrate the product and engineering flow.

### What did you review in AI-generated work?

Describe a real entry from `WHAT_CLAUDE_GOT_WRONG.md` after Claude Code is used. Until then, say that no Claude Code session has been claimed for this repository.
