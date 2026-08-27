import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function workflow(name: string) {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "n8n", "workflows", name), "utf8"),
  );
}

describe("sanitized n8n exports", () => {
  it("ships disabled and signs before sending with retries", () => {
    const value = workflow("ledgerguard-reconciliation.json");
    const types = value.nodes.map((node: { type: string }) => node.type);
    const request = value.nodes.find(
      (node: { name: string }) => node.name === "Send to isolated Edge Function",
    );

    expect(value.active).toBe(false);
    expect(types).toContain("n8n-nodes-base.webhook");
    expect(types).toContain("n8n-nodes-base.crypto");
    expect(request.retryOnFail).toBe(true);
    expect(request.maxTries).toBe(3);
    expect(JSON.stringify(value)).toContain("N8N_WEBHOOK_SECRET");
    expect(JSON.stringify(value)).not.toMatch(/sb_secret_|sk-ant-|eyJ[a-zA-Z0-9_-]{20}/);
  });

  it("includes a separate sanitized error workflow", () => {
    const value = workflow("ledgerguard-error-handler.json");
    expect(value.active).toBe(false);
    expect(value.nodes.some((node: { type: string }) => node.type === "n8n-nodes-base.errorTrigger")).toBe(true);
    expect(JSON.stringify(value)).toContain("Sanitized workflow failure");
  });
});
