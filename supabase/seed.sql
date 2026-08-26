insert into public.organizations (id, slug, name, is_demo)
values ('00000000-0000-4000-8000-000000000001', 'ledgerguard-demo', 'LedgerGuard Demo', true)
on conflict (id) do update set name = excluded.name, is_demo = excluded.is_demo;

insert into public.brands (id, organization_id, slug, name)
values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'aurora-home', 'Aurora Home'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'northwind-kids', 'Northwind Kids')
on conflict (id) do update set name = excluded.name;

insert into public.reconciliation_periods (
  id, organization_id, period_start, period_end, order_count, matched_order_count,
  expected_payout_pence, actual_payout_pence, open_variance_pence,
  open_exception_count, last_reconciled_at
)
values (
  '00000000-0000-4000-8000-000000000111',
  '00000000-0000-4000-8000-000000000001',
  '2026-08-01', '2026-08-31', 172, 162, 1824050, 1796550, 27500, 10,
  '2026-08-26T09:42:25Z'
)
on conflict (id) do update set
  order_count = excluded.order_count,
  matched_order_count = excluded.matched_order_count,
  expected_payout_pence = excluded.expected_payout_pence,
  actual_payout_pence = excluded.actual_payout_pence,
  open_variance_pence = excluded.open_variance_pence,
  open_exception_count = excluded.open_exception_count,
  last_reconciled_at = excluded.last_reconciled_at;

insert into public.orders (
  id, organization_id, brand_id, external_order_id, currency,
  gross_amount_pence, refund_amount_pence, fee_amount_pence, occurred_at
)
values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'LG-1042', 'GBP', 12000, 2000, 350, '2026-08-25T13:12:00Z'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'LG-1068', 'GBP', 21000, 0, 2600, '2026-08-25T14:03:00Z')
on conflict (id) do update set
  gross_amount_pence = excluded.gross_amount_pence,
  refund_amount_pence = excluded.refund_amount_pence,
  fee_amount_pence = excluded.fee_amount_pence;

insert into public.payouts (
  id, organization_id, order_id, external_payout_id, actual_payout_pence, paid_at
)
values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', 'PO-DEMO-1042', 7650, '2026-08-26T09:39:00Z'),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000202', 'PO-DEMO-1068', 14900, '2026-08-26T09:39:30Z')
on conflict (id) do update set actual_payout_pence = excluded.actual_payout_pence;

insert into public.finance_exceptions (
  id, organization_id, brand_id, order_id, payout_id, reference, issue, hypothesis,
  gross_amount_pence, refund_amount_pence, fee_amount_pence,
  expected_payout_pence, actual_payout_pence, variance_pence, evidence,
  recommended_action, analysis_source, prompt_version, status, opened_at
)
values
  (
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000301',
    'EX-1042', 'Refund mismatch',
    'The recorded refund may have been deducted twice.',
    12000, 2000, 350, 9650, 7650, -2000,
    '["Order gross: GBP 120.00", "Refund: GBP 20.00", "Processing fee: GBP 3.50", "Actual payout: GBP 76.50"]'::jsonb,
    'Approve an investigation of the refund ledger. Do not move money automatically.',
    'deterministic_fallback', 'reconciliation-analyst.v1', 'needs_review',
    '2026-08-26T09:42:18Z'
  ),
  (
    '00000000-0000-4000-8000-000000000402',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000202',
    '00000000-0000-4000-8000-000000000302',
    'EX-1068', 'Missing payout item',
    'The order is not present in the current payout breakdown.',
    21000, 0, 2600, 18400, 14900, -3500,
    '["Order gross: GBP 210.00", "Processing fee: GBP 26.00", "Actual payout: GBP 149.00"]'::jsonb,
    'Approve a source-record investigation before contacting the payment provider.',
    'deterministic_fallback', 'reconciliation-analyst.v1', 'needs_review',
    '2026-08-26T09:40:12Z'
  )
on conflict (id) do update set
  hypothesis = excluded.hypothesis,
  evidence = excluded.evidence,
  recommended_action = excluded.recommended_action;

insert into public.automation_runs (
  id, organization_id, workflow, correlation_id, status, attempt,
  duration_ms, started_at, completed_at, error_code
)
values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000001', 'Payout reconciliation', 'run_01LG42', 'completed', 1, 18400, '2026-08-26T09:42:00Z', '2026-08-26T09:42:18.4Z', null),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000001', 'Exception analysis', 'run_01LG41', 'completed', 1, 7200, '2026-08-26T09:41:00Z', '2026-08-26T09:41:07.2Z', null),
  ('00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000001', 'Commerce event processing', 'run_01LG39', 'retrying', 2, 3800, '2026-08-26T09:39:00Z', null, 'UPSTREAM_TIMEOUT')
on conflict (id) do update set
  status = excluded.status,
  attempt = excluded.attempt,
  duration_ms = excluded.duration_ms,
  error_code = excluded.error_code;

insert into public.audit_events (
  organization_id, actor_type, actor_id, action, entity_type, entity_id,
  correlation_id, metadata, occurred_at
)
select * from (
  values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'workflow', 'reconciliation-workflow', 'Opened exception', 'finance_exception', 'EX-1042', 'run_01LG42', '{"synthetic":true}'::jsonb, '2026-08-26T09:42:18Z'::timestamptz),
    ('00000000-0000-4000-8000-000000000001'::uuid, 'agent', 'reconciliation-analyst', 'Added evidence-backed hypothesis', 'finance_exception', 'EX-1042', 'run_01LG41', '{"synthetic":true,"analysis_source":"deterministic_fallback"}'::jsonb, '2026-08-26T09:42:25Z'::timestamptz),
    ('00000000-0000-4000-8000-000000000001'::uuid, 'system', 'webhook-ingestion', 'Ignored duplicate event', 'webhook_event', 'evt_demo_0182', 'run_01LG39', '{"synthetic":true}'::jsonb, '2026-08-26T09:39:04Z'::timestamptz)
) as seed_events(
  organization_id, actor_type, actor_id, action, entity_type, entity_id,
  correlation_id, metadata, occurred_at
)
where not exists (
  select 1
  from public.audit_events existing
  where existing.organization_id = seed_events.organization_id
    and existing.action = seed_events.action
    and existing.entity_id = seed_events.entity_id
    and existing.occurred_at = seed_events.occurred_at
);
