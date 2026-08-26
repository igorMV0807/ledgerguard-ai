# Supabase milestone boundary

No Supabase project, schema, migration, RLS policy, Edge Function, or credential is included in the foundation milestone.

The next database milestone must create these artifacts from an isolated project:

- migrations generated through the supported Supabase workflow;
- explicit grants and RLS policies;
- allow and deny tests under `supabase/tests/`;
- synthetic seed data;
- `ingest-commerce-event` Edge Function;
- local verification and advisor results.

Do not copy a production schema or use the Hotmart project.
