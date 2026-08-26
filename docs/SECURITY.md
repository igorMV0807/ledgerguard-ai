# Security and publication boundary

## Current state

The current foundation contains synthetic data and makes no request to Supabase, Shopify, n8n, Claude, or a financial system.

## Required controls before an integration milestone

- Separate accounts, projects, and credentials from every production system.
- Store secrets only in approved environment stores.
- Never prefix a server secret with `NEXT_PUBLIC_`.
- Enable RLS on every exposed table.
- Revoke broad defaults and grant only required operations.
- Use a policy per operation and test both allowed and denied access.
- Use `USING` and `WITH CHECK` for updates.
- Avoid authorisation based on user-editable metadata.
- Verify webhook signatures before trusting payload fields.
- Enforce idempotency and handle out-of-order events.
- Avoid logging credentials, auth headers, raw personal data, or complete sensitive payloads.
- Keep AI advisory and require human approval.
- Make the public demo use fixed synthetic data with no external calls.

## Public release gate

- [ ] Synthetic data only
- [ ] `.env.example` contains placeholders only
- [ ] Secret scan passes on files and Git history
- [ ] n8n exports are disabled, sanitised, and credential-free
- [ ] Supabase migrations, grants, policies, and tests were reviewed
- [ ] Supabase security and performance advisors were reviewed
- [ ] Preview and production use separate environment values
- [ ] Public demo network inspection shows no external calls
- [ ] No unsupported business, scale, accuracy, or integration claim
- [ ] Ownership and licensing are confirmed
