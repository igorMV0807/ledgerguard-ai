## Problem

What user or operational problem does this change address?

## Solution

What changed and why is this the smallest safe solution?

## Evidence

- [ ] Screenshots or recording attached when the interface changed
- [ ] Vercel Preview URL attached
- [ ] Synthetic test scenario documented

## Data and security

- [ ] No secrets, production data, or private endpoints added
- [ ] Database changes include migration, grants, RLS, and allow/deny tests
- [ ] Webhook or API changes cover validation, idempotency, and errors
- [ ] AI output remains advisory and consequential actions require a human
- [ ] Public demo mode remains disconnected

## Verification

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test:run`
- [ ] `pnpm build`
- [ ] Manual happy path
- [ ] Manual failure path

## AI-assisted development review

- [ ] I read and understood the generated TypeScript/SQL
- [ ] I questioned architecture and security assumptions
- [ ] Relevant mistakes and corrections were recorded in `docs/WHAT_CLAUDE_GOT_WRONG.md`
