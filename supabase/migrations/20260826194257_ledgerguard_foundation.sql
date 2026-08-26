create schema if not exists private;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 2 and 120),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('viewer', 'finance_manager', 'admin')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 2 and 120),
  created_at timestamptz not null default now(),
  unique (organization_id, slug),
  unique (id, organization_id)
);

create table public.reconciliation_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  order_count integer not null check (order_count >= 0),
  matched_order_count integer not null check (
    matched_order_count >= 0 and matched_order_count <= order_count
  ),
  expected_payout_pence bigint not null check (expected_payout_pence >= 0),
  actual_payout_pence bigint not null check (actual_payout_pence >= 0),
  open_variance_pence bigint not null check (open_variance_pence >= 0),
  open_exception_count integer not null check (open_exception_count >= 0),
  last_reconciled_at timestamptz not null,
  unique (organization_id, period_start, period_end)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null,
  external_order_id text not null check (char_length(external_order_id) between 1 and 120),
  currency text not null default 'GBP' check (currency ~ '^[A-Z]{3}$'),
  gross_amount_pence bigint not null check (gross_amount_pence >= 0),
  refund_amount_pence bigint not null check (refund_amount_pence >= 0),
  fee_amount_pence bigint not null check (fee_amount_pence >= 0),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (organization_id, external_order_id),
  unique (id, organization_id),
  foreign key (brand_id, organization_id)
    references public.brands(id, organization_id) on delete restrict
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  order_id uuid not null,
  external_payout_id text not null check (char_length(external_payout_id) between 1 and 120),
  actual_payout_pence bigint not null check (actual_payout_pence >= 0),
  paid_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (organization_id, external_payout_id),
  unique (id, organization_id),
  foreign key (order_id, organization_id)
    references public.orders(id, organization_id) on delete restrict
);

create table public.finance_exceptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null,
  order_id uuid not null,
  payout_id uuid not null,
  reference text not null check (char_length(reference) between 3 and 40),
  issue text not null check (char_length(issue) between 3 and 160),
  hypothesis text not null check (char_length(hypothesis) between 3 and 500),
  gross_amount_pence bigint not null check (gross_amount_pence >= 0),
  refund_amount_pence bigint not null check (refund_amount_pence >= 0),
  fee_amount_pence bigint not null check (fee_amount_pence >= 0),
  expected_payout_pence bigint not null check (expected_payout_pence >= 0),
  actual_payout_pence bigint not null check (actual_payout_pence >= 0),
  variance_pence bigint not null,
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  recommended_action text not null check (char_length(recommended_action) between 3 and 500),
  analysis_source text not null check (
    analysis_source in ('claude', 'deterministic_fallback')
  ),
  prompt_version text not null default 'reconciliation-analyst.v1',
  status text not null default 'needs_review' check (
    status in ('needs_review', 'approved', 'rejected')
  ),
  opened_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (organization_id, reference),
  unique (id, organization_id),
  foreign key (brand_id, organization_id)
    references public.brands(id, organization_id) on delete restrict,
  foreign key (order_id, organization_id)
    references public.orders(id, organization_id) on delete restrict,
  foreign key (payout_id, organization_id)
    references public.payouts(id, organization_id) on delete restrict
);

create table public.human_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  exception_id uuid not null,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check (decision in ('approved', 'rejected')),
  rationale text not null check (char_length(rationale) between 3 and 500),
  created_at timestamptz not null default now(),
  unique (exception_id, reviewer_id),
  foreign key (exception_id, organization_id)
    references public.finance_exceptions(id, organization_id) on delete restrict
);

create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow text not null check (char_length(workflow) between 3 and 160),
  correlation_id text not null check (char_length(correlation_id) between 3 and 160),
  status text not null check (status in ('completed', 'retrying', 'failed')),
  attempt smallint not null default 1 check (attempt between 1 and 10),
  duration_ms integer not null check (duration_ms >= 0),
  started_at timestamptz not null,
  completed_at timestamptz,
  error_code text,
  unique (organization_id, correlation_id)
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  external_event_id text not null check (char_length(external_event_id) between 3 and 160),
  event_type text not null check (char_length(event_type) between 3 and 120),
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'received' check (
    status in ('received', 'processed', 'duplicate', 'failed')
  ),
  error_code text,
  unique (organization_id, external_event_id)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_type text not null check (actor_type in ('system', 'workflow', 'agent', 'user')),
  actor_id text not null check (char_length(actor_id) between 1 and 160),
  action text not null check (char_length(action) between 3 and 160),
  entity_type text not null check (char_length(entity_type) between 3 and 80),
  entity_id text not null check (char_length(entity_id) between 1 and 160),
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now()
);

create index organization_memberships_user_id_idx
  on public.organization_memberships (user_id, organization_id);
create index brands_organization_id_idx on public.brands (organization_id);
create index reconciliation_periods_organization_id_idx
  on public.reconciliation_periods (organization_id, period_end desc);
create index orders_brand_id_idx on public.orders (brand_id);
create index orders_organization_id_idx on public.orders (organization_id, occurred_at desc);
create index payouts_order_id_idx on public.payouts (order_id);
create index payouts_organization_id_idx on public.payouts (organization_id, paid_at desc);
create index finance_exceptions_brand_id_idx on public.finance_exceptions (brand_id);
create index finance_exceptions_order_id_idx on public.finance_exceptions (order_id);
create index finance_exceptions_payout_id_idx on public.finance_exceptions (payout_id);
create index finance_exceptions_open_idx
  on public.finance_exceptions (organization_id, opened_at desc)
  where status = 'needs_review';
create index human_decisions_organization_id_idx
  on public.human_decisions (organization_id, created_at desc);
create index human_decisions_reviewer_id_idx on public.human_decisions (reviewer_id);
create index automation_runs_organization_id_idx
  on public.automation_runs (organization_id, started_at desc);
create index webhook_events_organization_id_idx
  on public.webhook_events (organization_id, received_at desc);
create index audit_events_organization_id_idx
  on public.audit_events (organization_id, occurred_at desc);
create index audit_events_entity_idx
  on public.audit_events (entity_type, entity_id, occurred_at desc);

create or replace function private.is_anonymous_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false);
$$;

create or replace function private.can_access_organization(requested_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (
      (
        private.is_anonymous_user()
        and exists (
          select 1
          from public.organizations
          where id = requested_organization_id
            and is_demo = true
        )
      )
      or exists (
        select 1
        from public.organization_memberships
        where organization_id = requested_organization_id
          and user_id = (select auth.uid())
      )
    );
$$;

create or replace function private.can_review_exception(
  requested_exception_id uuid,
  requested_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.can_access_organization(requested_organization_id)
    and exists (
      select 1
      from public.finance_exceptions
      where id = requested_exception_id
        and organization_id = requested_organization_id
        and status = 'needs_review'
    );
$$;

create or replace function private.record_human_decision_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  exception_reference text;
  audit_actor_id text;
begin
  select reference into exception_reference
  from public.finance_exceptions
  where id = new.exception_id
    and organization_id = new.organization_id
    and status = 'needs_review';

  if exception_reference is null then
    raise exception 'The exception is no longer awaiting review';
  end if;

  audit_actor_id := case
    when private.is_anonymous_user() then 'anonymous-demo-reviewer'
    else new.reviewer_id::text
  end;

  insert into public.audit_events (
    organization_id,
    actor_type,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata,
    occurred_at
  ) values (
    new.organization_id,
    'user',
    audit_actor_id,
    case when new.decision = 'approved' then 'Approved investigation' else 'Rejected investigation' end,
    'finance_exception',
    exception_reference,
    jsonb_build_object('rationale', new.rationale, 'decision_id', new.id),
    new.created_at
  );

  return new;
end;
$$;

create trigger human_decision_audit_trigger
after insert on public.human_decisions
for each row execute function private.record_human_decision_audit();

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.brands enable row level security;
alter table public.reconciliation_periods enable row level security;
alter table public.orders enable row level security;
alter table public.payouts enable row level security;
alter table public.finance_exceptions enable row level security;
alter table public.human_decisions enable row level security;
alter table public.automation_runs enable row level security;
alter table public.webhook_events enable row level security;
alter table public.audit_events enable row level security;

create policy organizations_select on public.organizations
for select to authenticated
using (private.can_access_organization(id));

create policy memberships_select on public.organization_memberships
for select to authenticated
using (user_id = (select auth.uid()));

create policy brands_select on public.brands
for select to authenticated
using (private.can_access_organization(organization_id));

create policy reconciliation_periods_select on public.reconciliation_periods
for select to authenticated
using (private.can_access_organization(organization_id));

create policy orders_select on public.orders
for select to authenticated
using (private.can_access_organization(organization_id));

create policy payouts_select on public.payouts
for select to authenticated
using (private.can_access_organization(organization_id));

create policy finance_exceptions_select on public.finance_exceptions
for select to authenticated
using (private.can_access_organization(organization_id));

create policy human_decisions_select on public.human_decisions
for select to authenticated
using (
  reviewer_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships
    where organization_memberships.organization_id = human_decisions.organization_id
      and organization_memberships.user_id = (select auth.uid())
  )
);

create policy human_decisions_insert on public.human_decisions
for insert to authenticated
with check (
  reviewer_id = (select auth.uid())
  and private.can_review_exception(exception_id, organization_id)
);

create policy automation_runs_select on public.automation_runs
for select to authenticated
using (private.can_access_organization(organization_id));

create policy audit_events_select on public.audit_events
for select to authenticated
using (private.can_access_organization(organization_id));

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon;
grant execute on function private.is_anonymous_user() to authenticated;
grant execute on function private.can_access_organization(uuid) to authenticated;
grant execute on function private.can_review_exception(uuid, uuid) to authenticated;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.organizations to authenticated;
grant select on public.organization_memberships to authenticated;
grant select on public.brands to authenticated;
grant select on public.reconciliation_periods to authenticated;
grant select on public.orders to authenticated;
grant select on public.payouts to authenticated;
grant select on public.finance_exceptions to authenticated;
grant select, insert on public.human_decisions to authenticated;
grant select on public.automation_runs to authenticated;
grant select on public.audit_events to authenticated;

grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public revoke all on tables from anon, authenticated;
