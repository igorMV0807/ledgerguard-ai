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

> The agent cannot move money or approve itself. I approve only the investigation. The decision is saved under my isolated demo session and added to the audit trail.

## 62–76 seconds — operational evidence

**Screen:** Automations and Audit log.

**Narration:**

> Workflow runs expose correlation IDs, attempts, and failure state. The audit view keeps system, agent, and human actions traceable.

## 76–90 seconds — engineering evidence

**Screen:** GitHub pull request, Vercel Preview, tests, and architecture.

**Narration:**

> The product uses Next.js and TypeScript on Vercel, Supabase Postgres with RLS, a signed idempotent Edge Function, and a sanitized n8n workflow with retries. Automated checks cover the financial rule, webhook signature, database security contract, and workflow exports.

End with the portfolio and repository links.

## Recording gate

- [ ] Synthetic banner visible
- [ ] No production screen or customer data
- [ ] No secret, token, private URL, or environment value
- [ ] No unsupported claim about Shopify, Supabase, n8n, Claude, or business results
- [ ] Cursor movements rehearsed
- [ ] Narration understandable without technical background
- [ ] Final length between 75 and 100 seconds

## Recording sequence

Open these tabs before recording and never open an environment-settings screen:

1. live dashboard overview;
2. exception `LG-1042` detail;
3. automations view;
4. audit view;
5. GitHub pull request checks and the README architecture diagram.

Record at 1080p, zoom the browser to 110–125%, hide bookmarks and notifications, and use a clean cursor path. Add subtitles because many LinkedIn viewers watch without sound.
