# Supabase portfolio sandbox

This folder contains the complete local definition for a new isolated demo project:

- `migrations/20260826194257_ledgerguard_foundation.sql` — schema, indexes, explicit privileges, helper functions, RLS, and decision audit trigger;
- `seed.sql` — fixed fictional brands, orders, payouts, exceptions, workflow runs, and audit events;
- `functions/ingest-commerce-event/` — signed and idempotent synthetic webhook ingestion;
- `config.toml` — anonymous demo sign-ins and the webhook-specific JWT exception.

The public browser receives only the publishable key. It signs in anonymously, reads the explicitly flagged demo organisation, and can insert only its own review decision. The Edge Function uses the server-side secret key through `@supabase/server` and verifies `x-ledgerguard-signature` before parsing the request.

The existing Supabase project must not be reused. Provisioning requires a new project, cost confirmation, migration/seed application, security and performance advisor review, then Vercel environment configuration.
