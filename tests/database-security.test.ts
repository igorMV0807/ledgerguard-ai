import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase",
    "migrations",
    "20260826194257_ledgerguard_foundation.sql",
  ),
  "utf8",
).toLowerCase();

const exposedTables = [
  "organizations",
  "organization_memberships",
  "brands",
  "reconciliation_periods",
  "orders",
  "payouts",
  "finance_exceptions",
  "human_decisions",
  "automation_runs",
  "webhook_events",
  "audit_events",
];

describe("database security contract", () => {
  it.each(exposedTables)("enables RLS on %s", (table) => {
    expect(migration).toContain(`alter table public.${table} enable row level security`);
  });

  it("does not grant table access to unauthenticated callers", () => {
    expect(migration).toContain(
      "revoke all on all tables in schema public from anon, authenticated",
    );
    expect(migration).not.toMatch(/grant\s+(select|insert|update|delete|all).*\s+to\s+anon/);
  });

  it("allows browser users to insert decisions but not update finance records", () => {
    expect(migration).toContain(
      "grant select, insert on public.human_decisions to authenticated",
    );
    expect(migration).not.toContain(
      "grant update on public.finance_exceptions to authenticated",
    );
  });
});
