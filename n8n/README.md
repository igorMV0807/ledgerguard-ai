# n8n portfolio workflows

Two disabled, sanitized exports are included under `n8n/workflows/`:

- `ledgerguard-reconciliation.json` accepts or generates a synthetic event, serializes it once, signs that exact body with HMAC SHA-256, calls the Edge Function, retries transient failures, and distinguishes duplicates;
- `ledgerguard-error-handler.json` receives execution errors and reduces them to safe operator-review metadata.

Before import into an isolated n8n instance:

1. set `N8N_WEBHOOK_SECRET` and `LEDGERGUARD_EDGE_FUNCTION_URL` in the instance environment;
2. import both JSON files while they remain disabled;
3. set the error workflow in the reconciliation workflow settings;
4. run the fixture from `n8n/fixtures/payout-variance-event.json` manually;
5. replay the same event and confirm `duplicate: true`;
6. activate only inside the isolated demo instance.

No credential, private URL, or production workflow is stored in these exports.
