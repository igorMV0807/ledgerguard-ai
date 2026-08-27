# Security and publication boundary

## Current state

The repository contains only synthetic data. Supabase and Claude boundaries are implemented, but no production system is referenced. Until the isolated hosted sandbox is configured, the public UI uses local fallback data.

## Implemented controls

- Separate repository and planned Supabase project from every production system.
- Store secrets only in approved environment stores.
- Never prefix a server secret with `NEXT_PUBLIC_`.
- RLS is enabled on every public table.
- Revoke broad defaults and grant only required operations.
- Use a policy per operation and test both allowed and denied access.
- Use `USING` and `WITH CHECK` for updates.
- Avoid authorisation based on user-editable metadata.
- The Edge Function verifies HMAC over the raw body before parsing it.
- A unique organisation/event ID boundary enforces idempotency.
- Avoid logging credentials, auth headers, raw personal data, or complete sensitive payloads.
- Keep AI advisory and require human approval.
- The public app identifies its synthetic data and has no production calls.

## Public release gate

- [x] Synthetic data only
- [x] `.env.example` contains placeholders only
- [x] n8n exports are disabled, sanitised, and credential-free
- [x] Supabase migrations, grants, policies, and contract tests were reviewed
- [ ] Supabase security and performance advisors were reviewed
- [ ] Preview and production use separate environment values
- [ ] Public demo network inspection shows no external calls
- [x] No unsupported business, scale, accuracy, or integration claim
- [ ] Ownership and licensing are confirmed
