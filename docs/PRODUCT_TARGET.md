# Complete Product Target — Spine, Full Scope, Next Steps

**Version:** 1.0  
**Last updated:** September 2026  
**Purpose:** Single north-star for what we are building. The **golden path is the spine**, not a reduced product. The **complete product** includes everything discussed across GTM, self-service, distribution, intelligent ops, FinOps, and enterprise packaging.

**Related:**  
[COMPLETE_PRODUCT_BUILD.md](./COMPLETE_PRODUCT_BUILD.md) (line-item checklist) ·  
[GOLDEN_PATH_MILESTONE.md](./GOLDEN_PATH_MILESTONE.md) (build order along the spine) ·  
[SELF_SERVICE_INTEGRATION.md](./SELF_SERVICE_INTEGRATION.md) ·  
[DISTRIBUTION_AND_ONBOARDING.md](./DISTRIBUTION_AND_ONBOARDING.md) ·  
[PRICING_AND_VALUE.md](./PRICING_AND_VALUE.md) ·  
[PROSPECTS_BY_PRICE_BAND.md](./PROSPECTS_BY_PRICE_BAND.md)

---

## 1. Goal (non-negotiable)

Build a **complete, self-service, demoable, sellable product** — not a thin MVP that stops at “one insight.”

A prospect (or sales) must be able to:

1. Reach a **hosted demo in minutes**, or **deploy into their account / on-prem**.  
2. Complete **self-service onboarding** without your engineers wiring data by hand.  
3. Walk the **spine** end-to-end with **trustworthy live data**.  
4. See the **full estate control plane**: inventory, intelligent health, security, certs, patches, drift, FinOps, audit, integrations.  
5. Understand **how they would buy and run it** (customer VPC, Marketplace later, on-prem).

**Spine (must work first, and keep working forever):**

```text
Login
  → Setup Wizard
  → Connect YBA
  → Discover universes
  → Enroll agent
  → Receive heartbeat
  → Compute health
  → Show insights (intelligent ops)
  → Show FinOps
  → Show security
```

**Around the spine (complete product — required for “full product,” not optional forever):**

| Layer | What “complete” includes |
|-------|---------------------------|
| **Identity** | SSO/OIDC, RBAC, tokens, enrollment tokens, audit of admin actions |
| **Self-service integrations** | Connector Hub: Connect **and** Push for YBA, Prometheus, Nessus/Tenable, Tanium/patch, usage; status, test, sync, rotate |
| **Agents** | Install script, auto-enroll after discovery, fleet UI, certs from agents, version drift |
| **Intelligence** | Question-first home, outcome tiles, ranked insights (10–20+ rules), Why / Impact / What to do, persona lenses, golden metrics + Advanced depth, Open in YBA/Grafana |
| **Security & compliance** | Vulns, patches, certs, drift, alerts, notifications (email/Slack/webhook), audit export |
| **FinOps** | Live topology + rate card + consumer usage Model B, Overview + Finance views |
| **Metrics** | Fleet snapshots in-product; Prometheus Connect; stale/provenance |
| **Distribution** | Hosted demo, Helm/Terraform, on-prem tarball, Managed Private story, Marketplace when install is one-click, license/trial |
| **Website / commercial** | CTAs, lead capture, deploy vs demo vs on-prem paths |
| **Provisioning** | Real wizard + workflows (part of complete product; can trail spine but not dropped from target) |
| **Future-ready** | Engine-pack architecture for multi-DB later — Yugabyte first in market |

Thin “MVP-only” cuts that **delete** Connector Hub, distribution, persona/home intelligence, or packaging from the **product target** are **wrong**. Sequencing build order ≠ shrinking product scope.

---

## 2. How documents relate

| Document | Role |
|----------|------|
| **This file** | Product target + how spine relates to complete scope + next steps |
| **COMPLETE_PRODUCT_BUILD.md** | Full conceptual / logical / physical checklist (do not abandon) |
| **GOLDEN_PATH_MILESTONE.md** | **Build sequence** along the spine so work stays end-to-end |
| **SELF_SERVICE_INTEGRATION.md** | Connect / Push / Auto-agent design |
| **DISTRIBUTION_AND_ONBOARDING.md** | Website → Marketplace → on-prem |
| **PRICING / PROSPECTS** | Commercial motion |

**Rule:** Use golden path for **order of implementation**. Use complete checklist for **definition of the product**. Never confuse “build YBA first” with “only build YBA.”

---

## 3. Complete product map (spine + rings)

```text
                         ┌─────────────────────────────┐
                         │  Distribution & commercial  │
                         │  Hosted demo · Helm/TF ·    │
                         │  On-prem · Marketplace ·    │
                         │  Website · License          │
                         └──────────────┬──────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         │                 Self-service shell                          │
         │         Login · SSO/RBAC · Setup Wizard · Integrations      │
         └──────────────────────────────┬──────────────────────────────┘
                                        │
    ┌─────────── SPINE (always live) ───┴────────────────────────────────┐
    │ Login → Wizard → YBA → Discover → Agent → Heartbeat → Health        │
    │      → Insights → FinOps → Security                                 │
    └───────────┬─────────────┬─────────────┬─────────────┬───────────────┘
                │             │             │             │
         Inventory      Intelligent    FinOps       Security suite
         Nodes/VMs      Home/Outcomes  Chargeback   Vulns/Patches
         Metrics        Insights       Rate card    Certs/Drift
         Open YBA       Personas       Usage        Alerts/Notify
                                                        Audit
                │
                └─ Provisioning & lifecycle (complete product ring)
```

---

## 4. Demoable in minutes (complete experience)

Not “one happy path screen.” A **complete demo script** a stranger can follow:

| Time | Show |
|------|------|
| 0:00 | Login (real gate) |
| 0:01 | Setup Wizard (completed or live) + Integrations status |
| 0:02 | Overview: **question-first / needs attention**, computed KPIs, provenance |
| 0:03 | Ranked insights (Why / Impact / What to do) |
| 0:04 | Universe drill-down: outcome tiles + golden metrics + Open in YBA |
| 0:05 | Agent fleet: connected count, last heartbeat |
| 0:06 | FinOps: spend, idle pool, consumers |
| 0:07 | Security: CVE + cert + optional patch; correlation into insight |
| 0:08 | Drift / audit briefly |
| 0:09 | “How you’d deploy”: customer VPC / on-prem / Marketplace roadmap |
| 0:10 | Optional: Connect Push sample or live YBA sync |

**Mode A:** Hosted + YBA mock / pre-synced estate through **real pipelines**.  
**Mode B:** Prospect YBA credentials → same spine.

---

## 5. Actual next steps (build the complete product, spine-first)

Work in waves. Each wave **extends the complete product**; none is “instead of” the checklist.

### Wave 1 — Spine foundation (must ship)

| Step | Build | Completes product area |
|------|-------|------------------------|
| 1.1 | Provenance + demo-ingest via `/ingest/*` | Trust / live pipeline |
| 1.2 | Login gate (demo auth → OIDC) | Identity |
| 1.3 | Setup Wizard shell | Self-service |
| 1.4 | YBA Connect + sync + mock | Discovery spine |
| 1.5 | Agent enroll + heartbeat + fleet UI | Agent spine |
| 1.6 | Health engine + computed Overview | Intelligence spine |
| 1.7 | Insight engine (full rule pack 10–20, not one toy) | Intelligent ops |
| 1.8 | FinOps on live estate | FinOps spine |
| 1.9 | Security Push path + wire to insights | Security spine |

**Wave 1 exit:** Spine works end-to-end on hosted demo; no unexplained seed.

### Wave 2 — Complete self-service & ops depth

| Step | Build | Completes product area |
|------|-------|------------------------|
| 2.1 | Integrations Hub UI (all cards; YBA live; others Connect **or** Push ready) | Self-service |
| 2.2 | Prometheus Connect | Metrics |
| 2.3 | Nessus/Tenable Connect (in addition to Push) | Security |
| 2.4 | Tanium/patch Connect or Push | Security |
| 2.5 | Auto-agent deploy to discovered nodes | Self-service agents |
| 2.6 | Question-first Home + persona lenses + outcome tiles | Intelligent ops UX |
| 2.7 | Notifications (Slack/email/webhook) | Ops completeness |
| 2.8 | Drift reconciler | Compliance |
| 2.9 | RBAC scopes (cloud/env) | Enterprise |
| 2.10 | Open in YBA / Grafana links | Metrics policy |

**Wave 2 exit:** Prospect can self-serve connect estate + security + metrics; UI feels like a control plane, not a dashboard dump.

### Wave 3 — Complete distribution & commercial

| Step | Build | Completes product area |
|------|-------|------------------------|
| 3.1 | Hosted single-tenant demo (AWS/GCP) | Sales |
| 3.2 | Helm + Terraform (customer account) | Distribution |
| 3.3 | On-prem bundle hardened + license | On-prem |
| 3.4 | Website funnel CTAs + one-pagers | Commercial |
| 3.5 | Managed Private runbook | SKU |
| 3.6 | AWS Marketplace package (when 3.2 is boring) | Scale GTM |
| 3.7 | Trial/license portal | Onboarding |

**Wave 3 exit:** Demo in minutes; deploy story for pilots without custom engineering.

### Wave 4 — Complete platform (still in product target)

| Step | Build | Completes product area |
|------|-------|------------------------|
| 4.1 | Real provisioning API + workflow | Self-service provision |
| 4.2 | PROD approval + lifecycle | Lifecycle |
| 4.3 | Generic events ingest / OpenAPI | Any-platform |
| 4.4 | Secrets manager, mTLS, audit export, HA options | Enterprise |
| 4.5 | Engine-pack seam for second database | Future multi-DB |
| 4.6 | FinOps budgets/export | FinOps+ |

**Wave 4 exit:** Matches “complete product” for mid/large deals and roadmap honesty.

---

## 6. Immediate actions (this week)

1. **Lock target** = complete product (this doc) — do not shrink scope to pasted MVP-only lists.  
2. **Build Wave 1.1–1.4** in repo: provenance, demo-ingest, Wizard shell, YBA connect + mock.  
3. **Keep** [COMPLETE_PRODUCT_BUILD.md](./COMPLETE_PRODUCT_BUILD.md) as the backlog of record; tick items as Waves land.  
4. **Use** [GOLDEN_PATH_MILESTONE.md](./GOLDEN_PATH_MILESTONE.md) only as **Wave 1 sequencing detail**, not as the product ceiling.

---

## 7. Bottom line

| Question | Answer |
|----------|--------|
| Is the spine the whole product? | **No** — it is the **core workflow** every demo must prove. |
| Is the complete checklist still valid? | **Yes** — that is the product. |
| Do we build 100 items in parallel? | **No** — Waves 1→4, spine first, then rings. |
| What is “done” for demoable to anyone? | Wave **1 + 3.1** minimum; Wave **2** for credible self-service story. |
| What is “done” for complete sellable product? | Waves **1–3** (+ Wave 4 for enterprise/provisioning depth). |

**Next coding move:** Wave **1.1** — provenance + demo-ingest through real `/ingest/*`.
