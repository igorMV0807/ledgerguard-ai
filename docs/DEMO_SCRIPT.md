# 90-second portfolio demo

The recording must show only the synthetic application, source code, tests, architecture, and safe portfolio artifacts. Do not open a production account or reveal a credential.

## 0–12 seconds — the problem

**Screen:** Overview.

**Narration:**

> Finance teams lose time investigating why an e-commerce payout does not match the expected value. I built LedgerGuard AI to centralise the evidence and guide that investigation.

## 12–30 seconds — deterministic result

**Screen:** Open order `LG-1042`.

**Narration:**

> This synthetic order has a gross value of £120, a £20 refund, and a £3.50 fee. Deterministic TypeScript calculates a £96.50 expected payout. The actual payout is £76.50, so the system opens a £20 exception.

## 30–48 seconds — bounded AI

**Screen:** AI-assisted analysis and evidence list.

**Narration:**

> AI does not calculate the money. It receives the existing evidence, proposes that the refund may have been deducted twice, and points to the order, refund, and payout used for that hypothesis.

## 48–62 seconds — human control

**Screen:** Approve investigation.

**Narration:**

> The agent cannot move money or approve itself. A finance manager decides whether to open an investigation, and that decision is designed to enter the audit log.

## 62–76 seconds — operational evidence

**Screen:** Automations and Audit log.

**Narration:**

> Workflow runs expose correlation IDs, attempts, and failure state. The audit view keeps system, agent, and human actions traceable.

## 76–90 seconds — engineering evidence

**Screen:** GitHub pull request, Vercel Preview, tests, and architecture.

**Narration:**

> The product uses Next.js and TypeScript, with a Vercel preview workflow and automated checks. The next milestone adds an isolated Supabase project with migrations, tested RLS, and a webhook Edge Function, followed by an n8n reconciliation workflow.

End with the portfolio and repository links.

## Recording gate

- [ ] Synthetic banner visible
- [ ] No production screen or customer data
- [ ] No secret, token, private URL, or environment value
- [ ] No unsupported claim about Shopify, Supabase, n8n, Claude, or business results
- [ ] Cursor movements rehearsed
- [ ] Narration understandable without technical background
- [ ] Final length between 75 and 100 seconds
