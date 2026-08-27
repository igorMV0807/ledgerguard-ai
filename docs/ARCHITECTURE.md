# Architecture

```mermaid
flowchart LR
    EVENT[Synthetic payout event] --> N8N[n8n workflow]
    N8N -->|HMAC SHA-256| EDGE[Supabase Edge Function]
    EDGE --> IDEMPOTENCY[(webhook_events)]
    EDGE --> RULES[Deterministic reconciliation]
    RULES -->|variance| ANALYSIS{Anthropic key available?}
    ANALYSIS -->|yes| CLAUDE[Claude tool-schema analysis]
    ANALYSIS -->|no or invalid| FALLBACK[Deterministic fallback]
    CLAUDE --> EXCEPTION[(finance_exceptions)]
    FALLBACK --> EXCEPTION
    EXCEPTION --> APP[Next.js dashboard]
    APP -->|anonymous authenticated user| RLS[Postgres RLS]
    RLS --> DECISION[(human_decisions)]
    DECISION --> AUDIT[(audit_events)]
```

## Trust boundaries

| Boundary | Control |
|---|---|
| public browser → Supabase | publishable key, anonymous Auth session, explicit grants, RLS |
| n8n → Edge Function | HMAC SHA-256 over the exact raw body |
| Edge Function → Postgres | server-side secret key; never shipped to the browser |
| event → reconciliation | schema validation and integer minor units |
| reconciliation → AI | deterministic result is authoritative |
| AI → action | validated tool output is advisory only |
| visitor → decision | decision is bound to `auth.uid()` and cannot update finance rows |

The project has no path that moves money, changes an order, or reaches the Hotmart production system.
