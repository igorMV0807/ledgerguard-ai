import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";
import {
  deterministicAnalysis,
  parseCommerceEvent,
  reconcile,
  sha256Hex,
  verifyHmacSha256,
  type CommerceEvent,
  type ReconciliationAnalysis,
} from "../_shared/reconciliation.ts";

const PROMPT_VERSION = "reconciliation-analyst.v1";
const MAX_BODY_BYTES = 256_000;

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function isAnalysis(value: unknown): value is Omit<ReconciliationAnalysis, "analysis_source"> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.issue === "string" &&
    typeof candidate.hypothesis === "string" &&
    Array.isArray(candidate.evidence) &&
    candidate.evidence.every((item) => typeof item === "string") &&
    typeof candidate.recommended_action === "string"
  );
}

async function analyseWithClaude(
  event: CommerceEvent,
  variancePence: number,
): Promise<ReconciliationAnalysis> {
  const fallback = deterministicAnalysis(event, variancePence);
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return fallback;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-5",
        max_tokens: 600,
        temperature: 0,
        system:
          "You are a finance-operations investigation assistant. The deterministic calculation is authoritative. Never approve or execute financial actions. Use only supplied synthetic evidence.",
        messages: [
          {
            role: "user",
            content: JSON.stringify({ event, deterministic_variance_pence: variancePence }),
          },
        ],
        tools: [
          {
            name: "report_reconciliation_analysis",
            description: "Return a bounded hypothesis and human-review recommendation.",
            input_schema: {
              type: "object",
              additionalProperties: false,
              required: ["issue", "hypothesis", "evidence", "recommended_action"],
              properties: {
                issue: { type: "string", maxLength: 160 },
                hypothesis: { type: "string", maxLength: 500 },
                evidence: {
                  type: "array",
                  minItems: 1,
                  maxItems: 6,
                  items: { type: "string", maxLength: 220 },
                },
                recommended_action: { type: "string", maxLength: 500 },
              },
            },
          },
        ],
        tool_choice: { type: "tool", name: "report_reconciliation_analysis" },
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return fallback;
    const message = await response.json();
    const toolUse = message.content?.find(
      (block: { type?: string; name?: string }) =>
        block.type === "tool_use" && block.name === "report_reconciliation_analysis",
    );
    if (!isAnalysis(toolUse?.input)) return fallback;

    return { ...toolUse.input, analysis_source: "claude" };
  } catch {
    return fallback;
  }
}

const handler = {
  fetch: withSupabase({ auth: "none" }, async (request, context) => {
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const secret = Deno.env.get("LEDGERGUARD_WEBHOOK_SECRET");
    if (!secret) return json({ error: "webhook_secret_not_configured" }, 503);

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) return json({ error: "payload_too_large" }, 413);

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return json({ error: "payload_too_large" }, 413);
    }

    const signature = request.headers.get("x-ledgerguard-signature") ?? "";
    if (!(await verifyHmacSha256(rawBody, signature, secret))) {
      return json({ error: "invalid_signature" }, 401);
    }

    let event: CommerceEvent;
    try {
      event = parseCommerceEvent(JSON.parse(rawBody));
    } catch (error) {
      return json(
        { error: "invalid_payload", message: error instanceof Error ? error.message : "Invalid payload" },
        400,
      );
    }

    const admin = context.supabaseAdmin;
    const { data: organization, error: organizationError } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", event.organization_slug)
      .eq("is_demo", true)
      .single();
    if (organizationError) return json({ error: "demo_organization_not_found" }, 404);

    const payloadSha256 = await sha256Hex(rawBody);
    const { data: webhookEvent, error: webhookError } = await admin
      .from("webhook_events")
      .insert({
        organization_id: organization.id,
        external_event_id: event.event_id,
        event_type: event.type,
        payload_sha256: payloadSha256,
      })
      .select("id")
      .single();

    if (webhookError?.code === "23505") {
      return json({ accepted: true, duplicate: true, event_id: event.event_id });
    }
    if (webhookError) return json({ error: "event_registration_failed" }, 500);

    const { data: brand, error: brandError } = await admin
      .from("brands")
      .select("id")
      .eq("organization_id", organization.id)
      .eq("slug", event.order.brand_slug)
      .single();
    if (brandError) return json({ error: "demo_brand_not_found" }, 404);

    const { data: order, error: orderError } = await admin
      .from("orders")
      .upsert(
        {
          organization_id: organization.id,
          brand_id: brand.id,
          external_order_id: event.order.external_id,
          currency: event.order.currency,
          gross_amount_pence: event.order.gross_amount_pence,
          refund_amount_pence: event.order.refund_amount_pence,
          fee_amount_pence: event.order.fee_amount_pence,
          occurred_at: event.occurred_at,
        },
        { onConflict: "organization_id,external_order_id" },
      )
      .select("id")
      .single();
    if (orderError) return json({ error: "order_upsert_failed" }, 500);

    const { data: payout, error: payoutError } = await admin
      .from("payouts")
      .upsert(
        {
          organization_id: organization.id,
          order_id: order.id,
          external_payout_id: event.payout.external_id,
          actual_payout_pence: event.payout.actual_payout_pence,
          paid_at: event.payout.paid_at,
        },
        { onConflict: "organization_id,external_payout_id" },
      )
      .select("id")
      .single();
    if (payoutError) return json({ error: "payout_upsert_failed" }, 500);

    const { expectedPayoutPence, variancePence } = reconcile(event);
    let exceptionReference: string | null = null;

    if (variancePence !== 0) {
      const analysis = await analyseWithClaude(event, variancePence);
      exceptionReference = `EX-${event.order.external_id.replace(/^LG-/, "")}`;
      const { error: exceptionError } = await admin.from("finance_exceptions").upsert(
        {
          organization_id: organization.id,
          brand_id: brand.id,
          order_id: order.id,
          payout_id: payout.id,
          reference: exceptionReference,
          issue: analysis.issue,
          hypothesis: analysis.hypothesis,
          gross_amount_pence: event.order.gross_amount_pence,
          refund_amount_pence: event.order.refund_amount_pence,
          fee_amount_pence: event.order.fee_amount_pence,
          expected_payout_pence: expectedPayoutPence,
          actual_payout_pence: event.payout.actual_payout_pence,
          variance_pence: variancePence,
          evidence: analysis.evidence,
          recommended_action: analysis.recommended_action,
          analysis_source: analysis.analysis_source,
          prompt_version: PROMPT_VERSION,
          status: "needs_review",
          opened_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,reference" },
      );
      if (exceptionError) return json({ error: "exception_upsert_failed" }, 500);
    }

    const now = new Date().toISOString();
    await admin.from("automation_runs").upsert(
      {
        organization_id: organization.id,
        workflow: "Commerce event processing",
        correlation_id: event.event_id,
        status: "completed",
        attempt: 1,
        duration_ms: 0,
        started_at: now,
        completed_at: now,
      },
      { onConflict: "organization_id,correlation_id" },
    );

    await admin
      .from("webhook_events")
      .update({ status: "processed", processed_at: now })
      .eq("id", webhookEvent.id);

    await admin.from("audit_events").insert({
      organization_id: organization.id,
      actor_type: "workflow",
      actor_id: "signed-webhook-ingestion",
      action: variancePence === 0 ? "Matched payout" : "Opened exception",
      entity_type: variancePence === 0 ? "order" : "finance_exception",
      entity_id: exceptionReference ?? event.order.external_id,
      correlation_id: event.event_id,
      metadata: { synthetic: true, variance_pence: variancePence },
    });

    return json({
      accepted: true,
      duplicate: false,
      event_id: event.event_id,
      reconciliation: {
        expected_payout_pence: expectedPayoutPence,
        actual_payout_pence: event.payout.actual_payout_pence,
        variance_pence: variancePence,
        status: variancePence === 0 ? "matched" : "exception",
        exception_reference: exceptionReference,
      },
    });
  }),
};

export default handler;
