# Golden Path — Build Order Along the Product Spine

**Version:** 1.1  
**Last updated:** September 2026  
**Status:** **Sequencing guide only** — does **not** replace or shrink the complete product.  
**Product target:** [PRODUCT_TARGET.md](./PRODUCT_TARGET.md) · Full checklist: [COMPLETE_PRODUCT_BUILD.md](./COMPLETE_PRODUCT_BUILD.md)

---

## Important

The spine below is **how we order engineering** so the product stays end-to-end.

It is **not** permission to drop Connector Hub, distribution, intelligent Home/personas, notifications, provisioning, Marketplace/on-prem packaging, or other complete-product scope.

```text
Login → Setup Wizard → Connect YBA → Discover universes
  → Enroll agent → Heartbeat → Compute health
  → Insights → FinOps → Security
```

For full product rings around this spine, see [PRODUCT_TARGET.md](./PRODUCT_TARGET.md).

---

## Strategy lock

**Build the complete product, spine-first.**

**Definition of done for sales usability:**

> Sit with a prospect and either (A) open a hosted URL and show a full estate control-plane story in **minutes**, or (B) connect a real/sandbox YBA and get live ops + security + cost through the **same** APIs a customer would use.

Two demo modes (both required):

| Mode | When | What runs |
|------|------|-----------|
| **A — Instant demo** | Sales call, website “Try demo” | Hosted env + **YBA mock** (or pre-synced sandbox) feeding **real ingest/health/insight** path — no unexplained seed |
| **B — Live connect** | Pilot / technical evaluation | Real YBA URL + token → sync → agents → live UI |

---

## Ordered build steps (Wave 1 detail)

### Step 0 — Baseline hygiene (1–2 days)

| # | Task | Concrete deliverable |
|---|------|----------------------|
| 0.1 | Prod/demo flags | `DEMO_MODE` vs prod; `AUTO_SEED=false` for demo/prod paths |
| 0.2 | Provenance schema | `source`, `collected_at` on universes/nodes/metrics/vulns/certs |
| 0.3 | `scripts/demo-ingest` | Load ComplyAdvantage-scale estate **only via `/ingest/*`** |
| 0.4 | UI chips | Show source + last collected; never silent seed |

**Exit:** Refresh UI after ingest script → data marked `ingest`, not mystery seed.

---

### Step 1 — YBA connectivity (1–2 weeks)

| # | Task | Concrete deliverable |
|---|------|----------------------|
| 1.1 | Integrations settings store | `platform_settings.integrations.yba` |
| 1.2 | Admin APIs | `GET/PUT /api/v1/admin/integrations/yba`, `POST .../test`, `POST .../sync` |
| 1.3 | Connection test | Validate URL + API token; clear errors |
| 1.4 | YBA sync worker | Poll universes/nodes → upsert via same logic as ingest |
| 1.5 | Provenance | Every row `source=yba`, `collected_at=now` |
| 1.6 | Sync status | Last success/failure, counts, duration in UI |
| 1.7 | **YBA mock server** | Local/demo fixture for Mode A |

**Exit:** Connect YBA → Test → Sync → universes/nodes with `source=yba`.

YBA is the **first** connector — not the **only** connector in the product target.

---

### Step 2 — Agent loop (1–2 weeks)

| # | Task | Concrete deliverable |
|---|------|----------------------|
| 2.1 | Enrollment token API | Create/revoke short-lived token |
| 2.2 | Register + heartbeat | Extend `/ingest/heartbeat` |
| 2.3 | Minimal agent | Heartbeat 30s, CPU/mem/disk, optional cert |
| 2.4 | Install one-liner | `agent-install.sh` |
| 2.5 | Agent fleet UI | Connected count, last heartbeat |
| 2.6 | Auto-enroll commands | Per-node install after YBA sync (full push in Wave 2) |

**Exit:** Live agent count and heartbeats.

---

### Step 3 — Computed health + Overview (1 week)

| # | Task | Concrete deliverable |
|---|------|----------------------|
| 3.1 | Health rules engine | Nodes/metrics/certs → health + alerts |
| 3.2 | Overview from SQL | Replace static `app_config` KPIs |
| 3.3 | Outcome scores | Uptime / performance / capacity / security / cost |
| 3.4 | Stale detection | Warn if sync/heartbeat too old |

**Exit:** Overview changes when estate degrades.

---

### Step 4 — Insight layer (3–5 days)

| # | Task | Concrete deliverable |
|---|------|----------------------|
| 4.1 | Rules catalog | 10–20 deterministic rules (expand in Wave 2) |
| 4.2 | Insight objects | why, impact, whatToDo, evidence |
| 4.3 | Home / Overview panel | Ranked insights |
| 4.4 | Intentional failures in demo-ingest | Disk, lag, cert, CVE |

**Exit:** Control-plane “aha,” not blank KPIs.

---

### Step 5 — Security on the spine (3–5 days)

| # | Task | Concrete deliverable |
|---|------|----------------------|
| 5.1 | Push path | Token + vulns ingest + Wizard sample |
| 5.2 | Wire health/insight | CRITICAL CVE → outcome + insight |
| 5.3 | Connect path | Nessus/Tenable in Wave 2 (still in complete product) |

**Exit:** Security from real ingest path.

---

### Step 6 — FinOps on live estate (2–3 days)

| # | Task | Concrete deliverable |
|---|------|----------------------|
| 6.1 | Finance from live nodes/metrics | Post-sync inputs |
| 6.2 | Consumer-usage via ingest | Multi-consumer demo |
| 6.3 | Overview finance KPIs | Same estate as health |

**Exit:** Cost / idle tied to live estate.

---

### Step 7 — Auth (1 week)

| # | Task | Concrete deliverable |
|---|------|----------------------|
| 7.1 | Login gate | OIDC or demo user/pass |
| 7.2 | Protect read APIs | Session/JWT |
| 7.3 | Minimal RBAC | Full scopes in Wave 2 |
| 7.4 | Tokens in Wizard | Secure display/rotate |

**Exit:** Login required.

---

### Step 8 — Hosted complete demo shell (1–2 weeks)

| # | Task | Concrete deliverable |
|---|------|----------------------|
| 8.1 | Hosted single-tenant stack | AWS or GCP |
| 8.2 | ComplyAdvantage-scale scenario | 20+ universes, intentional issues |
| 8.3 | Deploy story | Helm or Terraform (Marketplace in Wave 3) |
| 8.4 | Sales kit | One-pagers + demo script |
| 8.5 | E2E test | Spine automated |

**Exit:** URL shows complete spine + rings built so far, in minutes.

---

## After Wave 1 — continue complete product

Continue [PRODUCT_TARGET.md](./PRODUCT_TARGET.md) Waves 2–4 (Integrations Hub, Prometheus, auto-agent, personas, notifications, drift, Marketplace, provisioning, enterprise hardening).

---

## First PR when coding starts

1. Provenance + demo-ingest (Step 0)  
2. YBA connect + mock + sync (Step 1)  
3. Setup Wizard UI  
4. Steps 2–8, then Wave 2+
