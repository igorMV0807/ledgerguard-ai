# What Claude got wrong

This file records meaningful implementation errors and the correction applied before merge.

Do not fabricate entries. A useful record contains:

- date and pull request;
- task and relevant context;
- incorrect assumption or implementation;
- how the issue was detected;
- corrected design or code;
- test or rule added to prevent recurrence.

## Entries

### 2026-08-26 — shared demo state

- **Task:** persist a recruiter's approve/reject action in Supabase.
- **Incorrect first design:** the first trigger version updated the shared exception status. One anonymous visitor could therefore close the case for every later visitor.
- **Detection:** threat-modelling the multi-visitor demo before deploying the migration.
- **Correction:** keep the synthetic exception reusable, scope each decision to `reviewer_id = auth.uid()`, and redact the anonymous actor identifier in the shared audit view.
- **Regression control:** RLS and migration contract tests verify that browser users can insert decisions but cannot update finance records.

### 2026-08-26 — misleading AI label

- **Task:** add optional Claude analysis without making the demo depend on an API key.
- **Incorrect first design:** the interface always said “AI-assisted analysis,” even when the result came from deterministic fallback logic.
- **Detection:** publication-claim review.
- **Correction:** persist `analysis_source` and label the UI as either Claude-assisted or deterministic fallback.
- **Regression control:** the fallback unit test asserts its source explicitly.
