# LedgerGuard AI project guidance

## Product goal

Build an inspectable finance operations product that demonstrates safe AI-accelerated product engineering. Preserve the distinction between deterministic financial calculations, AI hypotheses, and human decisions.

## Non-negotiable boundaries

- Never connect, inspect, or modify the existing Hotmart production project.
- Use synthetic data in local, preview, and public portfolio environments.
- Never commit secrets, tokens, private URLs, real customer data, or raw production exports.
- Never expose a Supabase secret or service-role key in client code or a `NEXT_PUBLIC_` variable.
- Do not claim Shopify, NetSuite, Patchworks, or production experience without evidence.
- AI can analyse and propose. A human must approve consequential actions.
- Monetary calculations use integer minor units and deterministic code, not an LLM.
- New exposed Supabase tables require explicit grants, RLS, policies, and allow/deny tests.

## Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
pnpm check
```

## Delivery workflow

1. Read `docs/TDD.md` and `docs/SECURITY.md` before changing architecture or data access.
2. Work on a feature branch.
3. Keep changes small enough for one focused pull request.
4. Run `pnpm check` before requesting review.
5. Document trade-offs, migrations, security impact, and manual verification in the PR.
6. Review AI-produced TypeScript and SQL line by line; do not accept code solely because it builds.

## Review routing

- Use `database-reviewer` for schema, migrations, grants, policies, and queries.
- Use `security-reviewer` for auth, secrets, webhook verification, RLS, and public-release boundaries.
- Use `test-writer` for meaningful allow/deny, failure-path, calculation, and idempotency tests.

## Evidence policy

Record meaningful AI errors and human corrections in `docs/WHAT_CLAUDE_GOT_WRONG.md`. Do not fabricate entries. The file is evidence that the engineer understood and reviewed the generated work.
