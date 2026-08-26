export type CommerceEvent = {
  event_id: string;
  type: "payout.updated";
  organization_slug: string;
  occurred_at: string;
  order: {
    external_id: string;
    brand_slug: string;
    currency: string;
    gross_amount_pence: number;
    refund_amount_pence: number;
    fee_amount_pence: number;
  };
  payout: {
    external_id: string;
    actual_payout_pence: number;
    paid_at: string;
  };
};

export type ReconciliationAnalysis = {
  issue: string;
  hypothesis: string;
  evidence: string[];
  recommended_action: string;
  analysis_source: "claude" | "deterministic_fallback";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || value.length === 0 || value.length > 160) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function requiredMinorUnits(value: unknown, field: string) {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`Invalid ${field}`);
  }
  return value as number;
}

function requiredTimestamp(value: unknown, field: string) {
  const timestamp = requiredString(value, field);
  if (Number.isNaN(Date.parse(timestamp))) throw new Error(`Invalid ${field}`);
  return timestamp;
}

export function parseCommerceEvent(value: unknown): CommerceEvent {
  if (!isRecord(value) || !isRecord(value.order) || !isRecord(value.payout)) {
    throw new Error("Invalid commerce event payload");
  }

  const eventType = requiredString(value.type, "type");
  if (eventType !== "payout.updated") throw new Error("Unsupported event type");

  const currency = requiredString(value.order.currency, "order.currency");
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Invalid order.currency");

  return {
    event_id: requiredString(value.event_id, "event_id"),
    type: eventType,
    organization_slug: requiredString(value.organization_slug, "organization_slug"),
    occurred_at: requiredTimestamp(value.occurred_at, "occurred_at"),
    order: {
      external_id: requiredString(value.order.external_id, "order.external_id"),
      brand_slug: requiredString(value.order.brand_slug, "order.brand_slug"),
      currency,
      gross_amount_pence: requiredMinorUnits(value.order.gross_amount_pence, "order.gross_amount_pence"),
      refund_amount_pence: requiredMinorUnits(value.order.refund_amount_pence, "order.refund_amount_pence"),
      fee_amount_pence: requiredMinorUnits(value.order.fee_amount_pence, "order.fee_amount_pence"),
    },
    payout: {
      external_id: requiredString(value.payout.external_id, "payout.external_id"),
      actual_payout_pence: requiredMinorUnits(value.payout.actual_payout_pence, "payout.actual_payout_pence"),
      paid_at: requiredTimestamp(value.payout.paid_at, "payout.paid_at"),
    },
  };
}

export function reconcile(event: CommerceEvent) {
  const expectedPayoutPence =
    event.order.gross_amount_pence -
    event.order.refund_amount_pence -
    event.order.fee_amount_pence;

  return {
    expectedPayoutPence,
    variancePence: event.payout.actual_payout_pence - expectedPayoutPence,
  };
}

export function deterministicAnalysis(event: CommerceEvent, variancePence: number): ReconciliationAnalysis {
  const absoluteVariance = Math.abs(variancePence);
  const refundMatchesVariance =
    event.order.refund_amount_pence > 0 && absoluteVariance === event.order.refund_amount_pence;

  return {
    issue: refundMatchesVariance ? "Refund mismatch" : "Payout variance",
    hypothesis: refundMatchesVariance
      ? "The recorded refund may have been deducted twice."
      : "The payout breakdown does not match the deterministic order evidence.",
    evidence: [
      `Gross amount: ${event.order.gross_amount_pence} pence`,
      `Refund amount: ${event.order.refund_amount_pence} pence`,
      `Fee amount: ${event.order.fee_amount_pence} pence`,
      `Actual payout: ${event.payout.actual_payout_pence} pence`,
      `Variance: ${variancePence} pence`,
    ],
    recommended_action:
      "Approve an investigation of the source records. Do not move money automatically.",
    analysis_source: "deterministic_fallback",
  };
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyHmacSha256(rawBody: string, suppliedSignature: string, secret: string) {
  const normalized = suppliedSignature.replace(/^sha256=/, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = [...new Uint8Array(signed)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ normalized.charCodeAt(index);
  }
  return difference === 0;
}
