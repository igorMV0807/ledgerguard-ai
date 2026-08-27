# RLS test matrix

| Actor | Read demo finance data | Read non-demo data | Insert own decision | Insert another user's decision | Update/delete finance data | Read private webhook events |
|---|---:|---:|---:|---:|---:|---:|
| unauthenticated `anon` | deny | deny | deny | deny | deny | deny |
| anonymous Auth user | allow | deny | allow | deny | deny | deny |
| organisation viewer | allow for membership | deny outside membership | allow for accessible exception | deny | deny | deny |
| service secret / Edge Function | allow | allow | allow | allow | allow | allow |

## Release evidence

- Every public table has RLS enabled in the migration.
- `anon` receives no table grant.
- `authenticated` receives read access only to the UI tables and insert access only to `human_decisions`.
- The insert policy requires `reviewer_id = auth.uid()` and an accessible open exception.
- Anonymous access requires `organizations.is_demo = true`.
- `webhook_events` has no browser policy or browser grant.
- Security and performance advisors must be checked again after the migration is applied remotely.
