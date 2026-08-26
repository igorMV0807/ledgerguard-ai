import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  deterministicAnalysis,
  parseCommerceEvent,
  reconcile,
  verifyHmacSha256,
} from "../supabase/functions/_shared/reconciliation";

const event = {
  event_id: "evt_demo_001",
  type: "payout.updated",
  organization_slug: "ledgerguard-demo",
  occurred_at: "2026-08-26T09:42:00.000Z",
  order: {
    external_id: "LG-1042",
    brand_slug: "aurora-home",
    currency: "GBP",
    gross_amount_pence: 12_000,
    refund_amount_pence: 2_000,
    fee_amount_pence: 350,
  },
  payout: {
    external_id: "PO-1042",
    actual_payout_pence: 7_650,
    paid_at: "2026-08-26T09:42:00.000Z",
  },
} as const;

describe("signed commerce event boundary", () => {
  it("validates the event and keeps arithmetic deterministic", () => {
    const parsed = parseCommerceEvent(event);
    expect(reconcile(parsed)).toEqual({
      expectedPayoutPence: 9_650,
      variancePence: -2_000,
    });
  });

  it("rejects fractional minor units", () => {
    expect(() =>
      parseCommerceEvent({
        ...event,
        order: { ...event.order, fee_amount_pence: 3.5 },
      }),
    ).toThrow("order.fee_amount_pence");
  });

  it("detects a refund-sized variance without pretending AI ran", () => {
    const analysis = deterministicAnalysis(parseCommerceEvent(event), -2_000);
    expect(analysis.issue).toBe("Refund mismatch");
    expect(analysis.analysis_source).toBe("deterministic_fallback");
  });

  it("verifies the exact raw body with HMAC SHA-256", async () => {
    const rawBody = JSON.stringify(event);
    const secret = "test-only-secret";
    const signature = createHmac("sha256", secret).update(rawBody).digest("hex");

    await expect(
      verifyHmacSha256(rawBody, `sha256=${signature}`, secret),
    ).resolves.toBe(true);
    await expect(
      verifyHmacSha256(`${rawBody} `, `sha256=${signature}`, secret),
    ).resolves.toBe(false);
  });
});
