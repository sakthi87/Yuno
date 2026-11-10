# Complete Product Build Checklist — Customer Demo Ready

**Version:** 1.0  
**Last updated:** September 2026  
**Purpose:** Single checklist of **everything** needed for a **true self-service, demoable, sellable product** (YugabyteDB-first; architecture ready to expand).  
**North star / spine + waves:** [PRODUCT_TARGET.md](./PRODUCT_TARGET.md)  
**Build order along spine:** [GOLDEN_PATH_MILESTONE.md](./GOLDEN_PATH_MILESTONE.md)  
**Not organized by delivery phase** — organized **Conceptual → Logical → Physical**, line by line.  
**Related:** [DISTRIBUTION_AND_ONBOARDING.md](./DISTRIBUTION_AND_ONBOARDING.md) · [SELF_SERVICE_INTEGRATION.md](./SELF_SERVICE_INTEGRATION.md) · [PRODUCT_MATURITY_AND_GTM.md](./PRODUCT_MATURITY_AND_GTM.md) · [PRICING_AND_VALUE.md](./PRICING_AND_VALUE.md) · [TABLES_AND_APIS.md](./TABLES_AND_APIS.md)

**Definition of done (customer demo):**  
A prospect can deploy (or open your hosted demo), complete Setup Wizard, connect YBA, enroll agents, optionally connect/push security & metrics, and see **live** estate health, insights, finance, vulns/certs — with **no seed-as-truth**, **no professional-services dependency** for first value.

| Legend | Meaning |
|--------|---------|
| `[ ]` | Not built / incomplete |
| Status column | `Have` = exists in repo today · `Partial` · `Missing` |

---

# A. CONCEPTUAL (what the product *is*)

Product intent, value, boundaries — independent of tables and code.

| # | Line item | Status | Notes |
|---|-----------|--------|-------|
| C-01 | **Positioning:** Estate control plane on top of YBA — not a YB/YBA replacement | Have | Docs / pitch |
| C-02 | **YugabyteDB-first** market wedge; multi-DB as future engine packs | Have | Vision documented |
| C-03 | **Customer-space data plane** (data stays in their VPC / on-prem) | Have | GTM decision |
| C-04 | **Marketplace = private deploy in their account** (not multi-tenant SaaS) | Have | DISTRIBUTION doc |
| C-05 | **Defer true multi-tenant SaaS** until after private wins | Have | GTM |
| C-06 | **Self-service promise:** install → connect YBA → auto-agent → data appears (&lt;1 hour) | Partial | Spec only |
| C-07 | **Dual integration modes:** Connect (pull) + Push (ingest) per source | Partial | Ingest exists; Connect UI missing |
| C-08 | **Auto-agent enrollment** after discovery (not zero-credential magic) | Missing | Spec only |
| C-09 | **Holistic picture:** inventory + health + security + certs + patches + drift + FinOps + audit | Partial | UI yes; live pipeline no |
| C-10 | **Intelligent ops:** fewer golden signals, plain-language why/what-next, ranked insights | Missing | Design discussed |
| C-11 | **Metrics policy:** fleet snapshots in-product; deep time-series via Grafana/YBA links | Partial | Panel exists; worker missing |
| C-12 | **Persona lenses:** DBA / Security / Finance / Leadership defaults | Partial | Role dropdown cosmetic only |
| C-13 | **Question-first home:** what needs attention / risk / spend / security / certs / changes | Missing | Overview is KPI matrix today |
| C-14 | **Outcome tiles per universe:** Uptime, Performance, Capacity, Security, Cost | Partial | Health dims static |
| C-15 | **Open ecosystem:** any tool can push via contract; pluggable connectors | Partial | Ingest API; no descriptor hub |
| C-16 | **Commercial SKUs:** Ops Console + Integration pack + Managed Private + Enterprise | Have | PRICING doc |
| C-17 | **Honest non-goals for demo product:** no full Grafana clone; no auto-remediation required; no multi-DB claim yet | Have | Documented |
| C-18 | **Partner narrative with Yugabyte:** complementary ISV / co-sell | Have | Strategy only |
| C-19 | **One product, many packages:** local · vendor demo · customer cloud · Marketplace · on-prem | Partial | Mac + RHEL exist |
| C-20 | **Website funnel:** demo / trial / deploy / on-prem request → wizard → paid | Missing | No website/CRM yet |

---

# B. LOGICAL (capabilities, APIs, flows, UX)

What the system must *do* — features and behaviors for a complete demo.

## B1. Identity, access, tenancy

| # | Line item | Status |
|---|-----------|--------|
| L-01 | User login via OIDC / SSO (Entra ID, Okta) | Missing |
| L-02 | LDAP bind path (optional) wired to real auth | Partial (settings save only) |
| L-03 | Session / JWT on all read APIs (no anonymous GET in prod) | Missing |
| L-04 | RBAC roles: Admin, DBA, Ops, Security, Finance, Auditor | Missing (UI preview only) |
| L-05 | Scope by cloud × environment | Missing |
| L-06 | Admin vs Agent API tokens; rotatable; UI-managed | Partial (env secrets) |
| L-07 | Short-lived **agent install / enrollment tokens** | Missing |
| L-08 | Per-integration credentials encrypted; audit on connect/rotate | Missing |
| L-09 | License check (online phone-home **or** offline file) | Missing |
| L-10 | Lightweight **org / billing** record for website trials (not YB data) | Missing |

## B2. Setup Wizard & self-service onboarding

| # | Line item | Status |
|---|-----------|--------|
| L-11 | First-run Setup Wizard (blocks empty Overview) | Missing |
| L-12 | Step: platform health / TLS / connectivity check | Partial (health UI) |
| L-13 | Step: Connect YBA (URL + token) → Test → Sync | Missing |
| L-14 | Step: Enable Auto-Agent **or** copy one-liner | Missing |
| L-15 | Step: Optional Prometheus / security Connect **or** Push | Missing |
| L-16 | Step: Finance defaults (rate card) | Partial (Settings Finance) |
| L-17 | Step: Done checklist (universes N, agents M, last sync) | Missing |
| L-18 | Persist wizard progress in settings (`setup` key) | Missing |
| L-19 | “Awaiting agents” empty-state with clear next action | Partial (install flag only) |

## B3. Connector Hub (Integrations)

| # | Line item | Status |
|---|-----------|--------|
| L-20 | Settings → **Integrations** marketplace cards | Missing |
| L-21 | Card status: Not connected / Connected / Syncing / Error | Missing |
| L-22 | Last sync time + row counts per integration | Missing |
| L-23 | **YBA Connect** (pull) worker | Missing |
| L-24 | **Prometheus Connect** (pull) worker | Missing |
| L-25 | **Nessus/Tenable Connect** (pull) worker | Missing |
| L-26 | **Tanium / patch Connect** (pull) worker | Missing |
| L-27 | **Push mode** UI: endpoint, token, curl sample, schema download | Missing |
| L-28 | Test connection + Sync now + Disconnect + Rotate token | Missing |
| L-29 | Integration descriptor registry (plug-in config schema) | Missing |
| L-30 | Generic `POST /ingest/events` router (future any-platform) | Missing |
| L-31 | Slack / Email / webhook **outbound** notifications | Missing |

## B4. Agent fleet

| # | Line item | Status |
|---|-----------|--------|
| L-32 | Agent binary (Linux) — heartbeat, components, host samples, cert scan | Missing |
| L-33 | One-liner / script install (`agent-install.sh`) | Missing |
| L-34 | Auto-deploy to YBA-discovered nodes (YBA hook / SSM / Run Command) | Missing |
| L-35 | Agent fleet page: Pending / Installing / Connected / Degraded / Outdated | Missing |
| L-36 | Heartbeat → upsert nodes + infrastructure | Partial (API exists) |
| L-37 | Offline agent package in on-prem bundle | Missing |
| L-38 | Agent version drift detection | Missing |

## B5. Inventory & navigation

| # | Line item | Status |
|---|-----------|--------|
| L-39 | Cloud → Environment → Universe → Node → Component drill-down | Have (UI) |
| L-40 | Live inventory from YBA/agent (not seed-as-truth) | Partial |
| L-41 | Universe list filters (cloud, env, status) | Have |
| L-42 | VM / infrastructure flat list + agent connectivity summary | Have (UI) |
| L-43 | Data provenance chip (`yba` / `agent` / `ingest` / `seed`) | Missing |
| L-44 | “Open in YBA” deep link per universe | Missing |
| L-45 | “Open in Grafana” deep link (configurable URL template) | Missing |
| L-46 | Stale data indicator (e.g. last sync &gt; 15 min) | Missing |

## B6. Health, metrics, insights (intelligent ops)

| # | Line item | Status |
|---|-----------|--------|
| L-47 | Golden metrics snapshot per universe (OPS, latency, tablets, CPU, mem, disk, lag) | Partial (demo + table) |
| L-48 | Metrics ingest worker (Prometheus and/or YBA fallback) | Missing |
| L-49 | Server-side metric thresholds → status | Partial (frontend only) |
| L-50 | Multi-dimensional universe health **computed** (not static JSON) | Missing |
| L-51 | Health evaluation service (heartbeat/metrics/certs → alerts/issues) | Missing |
| L-52 | Server-computed Overview KPIs + cloud×env matrix | Missing (app_config static) |
| L-53 | Question-first Home / “Needs attention” | Missing |
| L-54 | Ranked **insight cards** (correlate cert + CVE + lag + spend) | Missing |
| L-55 | Plain-language **Why** + **What to do** on every non-green outcome | Missing |
| L-56 | Outcome tiles: Uptime / Performance / Capacity / Security / Cost | Missing |
| L-57 | Advanced metrics table collapsed (expert layer) | Partial (always visible) |
| L-58 | Persona lens switches default home KPIs | Missing |
| L-59 | Critical issues feed from engine (not static `criticalIssues`) | Missing |

## B7. Security, compliance, drift

| # | Line item | Status |
|---|-----------|--------|
| L-60 | Alerts list + acknowledge/resolve | Partial (CRUD via ingest) |
| L-61 | Vulnerabilities list + summary KPIs | Have (UI) / live data Missing |
| L-62 | Patch jobs list + link to CVEs | Have (UI) / live data Missing |
| L-63 | Certificates inventory + expiry thresholds | Have (UI) / live Missing |
| L-64 | Cert collection via agent | Missing |
| L-65 | Drift items (desired vs actual) | Have (UI) / reconciler Missing |
| L-66 | Reconciler worker | Missing |
| L-67 | Audit log (immutable append) + UI | Partial |
| L-68 | Audit export (compliance retention) | Missing |
| L-69 | Platform self-health (API, DB, connectors, agent connectivity) | Partial (static rows) |

## B8. Finance / FinOps

| # | Line item | Status |
|---|-----------|--------|
| L-70 | Finance rate card Settings UI | Have |
| L-71 | Universe cost compute from policy + topology + metrics | Have |
| L-72 | Consumer usage ingest + Model B active/idle chargeback | Have |
| L-73 | Finance KPIs on Overview | Have |
| L-74 | Finance View (universes + consumers) | Have |
| L-75 | Usage connector or documented Push for chargeback | Partial (API only) |
| L-76 | Budgets / anomalies / CSV export (nice for complete product) | Missing |

## B9. Provisioning & lifecycle (complete product scope)

| # | Line item | Status |
|---|-----------|--------|
| L-77 | Provision wizard UI | Have (fake timer) |
| L-78 | `POST /provisioning` + status API | Missing |
| L-79 | Temporal (or equivalent) workflow engine | Missing |
| L-80 | Terraform / cloud adapters for VM + YBA universe create | Missing |
| L-81 | PROD approval workflow (real approve/reject) | Missing |
| L-82 | Retry / rollback / cancel failed steps | Missing |
| L-83 | Lifecycle: scale, upgrade, decommission | Missing |

## B10. Distribution & commercial onboarding

| # | Line item | Status |
|---|-----------|--------|
| L-84 | Hosted single-tenant **demo environment** (vendor AWS/GCP) | Missing |
| L-85 | Terraform / Helm / CFN **one-click customer deploy** | Missing |
| L-86 | AWS Marketplace listing package | Missing |
| L-87 | GCP Marketplace listing package | Missing |
| L-88 | On-prem offline tarball install (RHEL) | Have (partial; bundle drift risk) |
| L-89 | Managed Private runbook (you operate in their account) | Missing |
| L-90 | Company website CTAs + lead capture | Missing |
| L-91 | Trial → license issuance flow | Missing |
| L-92 | Download portal for air-gap bundles | Missing |

## B11. Demo integrity & polish

| # | Line item | Status |
|---|-----------|--------|
| L-93 | Prod mode: `AUTO_SEED=false`; no demo banner | Partial |
| L-94 | Demo mode clearly labeled when seed is used | Missing |
| L-95 | Demo-ingest script proving real `/ingest/*` path | Missing |
| L-96 | Version stamp in `/health` + UI | Partial |
| L-97 | Docs: install, integrations, API, pricing, distribution | Partial |
| L-98 | Sample payloads + OpenAPI for Push partners | Partial (markdown curls) |

---

# C. PHYSICAL (what to build — systems, code, packages)

Concrete artifacts: services, tables, files, infra.

## C1. Control plane runtime

| # | Line item | Status |
|---|-----------|--------|
| P-01 | API service (Node/Express) hardened for prod | Partial |
| P-02 | React Ops Console (current tabs + new Home/Integrations/Wizard) | Partial |
| P-03 | PostgreSQL metadata store (prod) | Have |
| P-04 | SQLite for local Mac only | Have |
| P-05 | nginx TLS termination | Partial (RHEL path) |
| P-06 | systemd / containers for API + workers | Partial |
| P-07 | Redis cache for overview (optional at scale) | Missing |
| P-08 | Secrets: Vault / AWS SM / GCP SM integration | Missing |
| P-09 | Backup/restore scripts for metadata DB | Missing |
| P-10 | HA metadata DB option (Enterprise) | Missing |

## C2. Data model additions

| # | Line item | Status |
|---|-----------|--------|
| P-11 | Existing tables: universes, nodes, metrics, infra, alerts, drift, vulns, patches, certs, audit, consumer_usage, app_config, platform_settings | Have |
| P-12 | `platform_settings.integrations` (connector configs) | Missing |
| P-13 | `platform_settings.setup` (wizard state) | Missing |
| P-14 | `agent_enrollment` / fleet status table | Missing |
| P-15 | `insights` or computed cache table (optional) | Missing |
| P-16 | `provisioning_request` / `provisioning_step` tables | Missing |
| P-17 | Provenance fields on rows (`source`, `collected_at`) | Missing |
| P-18 | License / org tables (billing plane) | Missing |
| P-19 | Generic `events` ingest staging (optional) | Missing |
| P-20 | Migration: cluster-ready naming aliases (future multi-DB) | Missing |

## C3. Workers & binaries

| # | Line item | Status |
|---|-----------|--------|
| P-21 | `workers/yba-sync` | Missing |
| P-22 | `workers/prometheus-aggregator` | Missing |
| P-23 | `workers/nessus-connector` (or Tenable) | Missing |
| P-24 | `workers/tanium-connector` (or patch API) | Missing |
| P-25 | `workers/health-rules` / insight engine | Missing |
| P-26 | `workers/reconciler` | Missing |
| P-27 | `workers/notifier` (email/Slack/webhook) | Missing |
| P-28 | `agent/` binary + install script | Missing |
| P-29 | `scripts/demo-ingest` (seed via real ingest) | Missing |
| P-30 | Provisioning Temporal workers + Terraform modules | Missing |

## C4. API surface (beyond current)

| # | Line item | Status |
|---|-----------|--------|
| P-31 | Existing `/api/v1/ingest/*` + bootstrap + finance + admin settings | Have |
| P-32 | `GET/PUT /admin/integrations` | Missing |
| P-33 | `POST /admin/integrations/:id/test` and `/sync` | Missing |
| P-34 | `POST /admin/agents/enroll` + fleet `GET` | Missing |
| P-35 | Auth middleware (OIDC) on reads | Missing |
| P-36 | RBAC middleware | Missing |
| P-37 | `GET /insights` or bootstrap insights section | Missing |
| P-38 | Computed `/overview/*` from SQL | Missing |
| P-39 | Provisioning APIs | Missing |
| P-40 | OpenAPI spec published | Missing |

## C5. UI modules to add/change

| # | Line item | Status |
|---|-----------|--------|
| P-41 | Setup Wizard component | Missing |
| P-42 | Integrations hub component | Missing |
| P-43 | Agent fleet component | Missing |
| P-44 | Intelligent Home (questions + insights) | Missing |
| P-45 | Universe outcome tiles + Why panel | Missing |
| P-46 | Collapse metrics to “Advanced” | Missing |
| P-47 | Provenance + stale badges | Missing |
| P-48 | Open in YBA / Grafana buttons | Missing |
| P-49 | Remove MVP demo chrome in prod builds | Missing |
| P-50 | Real provisioning progress from API | Missing |

## C6. Packaging & distribution artifacts

| # | Line item | Status |
|---|-----------|--------|
| P-51 | Mac local dev (`npm run dev:mac`) | Have |
| P-52 | RHEL `yuno-install` offline tarball | Have |
| P-53 | CI: sync `backend/src` → install bundle | Missing |
| P-54 | Helm chart | Missing |
| P-55 | Terraform module (AWS) | Missing |
| P-56 | Terraform module (GCP) | Missing |
| P-57 | CloudFormation / AWS Marketplace AMI pipeline | Missing |
| P-58 | GCP Marketplace package | Missing |
| P-59 | Vendor demo stack IaC (your account) | Missing |
| P-60 | Signed release artifacts + checksums | Partial |

## C7. Website / GTM systems (outside core app)

| # | Line item | Status |
|---|-----------|--------|
| P-61 | Marketing website | Missing |
| P-62 | Lead form / CRM | Missing |
| P-63 | Auth0/Clerk (or similar) for trial orgs | Missing |
| P-64 | License portal / download portal | Missing |
| P-65 | Security one-pager + architecture PDF | Missing |
| P-66 | Partner one-pager for Yugabyte alliances | Missing |

## C8. Quality & operations

| # | Line item | Status |
|---|-----------|--------|
| P-67 | Automated tests for ingest + finance engine | Partial |
| P-68 | E2E demo script (wizard → YBA mock → UI green) | Missing |
| P-69 | Load target: 500+ universes / 5000+ nodes (NFR) | Missing |
| P-70 | Runbooks: backup, restore, rotate tokens, upgrade | Missing |
| P-71 | Observability of the control plane itself | Partial |
| P-72 | Pen-test / security review checklist for pilots | Missing |

---

# D. Acceptance — “Complete product for customer demo”

All must be true for an external **customer demo** without apology:

| # | Acceptance criterion |
|---|----------------------|
| D-01 | Deploy or open demo URL without engineering laptop tour |
| D-02 | Setup Wizard completes with **YBA Connect** (or recorded mock YBA in demo env) |
| D-03 | Agents show Connected (real or demo fleet) with last heartbeat |
| D-04 | Overview KPIs/matrix **computed** from metadata (not unexplained seed) |
| D-05 | At least one insight card with Why + What to do |
| D-06 | Metrics panel shows `collected_at` + source |
| D-07 | Finance works from policy + topology (+ usage if connected) |
| D-08 | One security path live: Connect **or** Push vulns into UI |
| D-09 | SSO or demo login; not “open API on the internet” |
| D-10 | Clear path shown: Marketplace/Helm/on-prem “how you’d deploy” |
| D-11 | Provenance visible when any seed remains |
| D-12 | Pitch line credible: self-service, data in your environment |

---

# E. Roll-up counts (approx.)

| Layer | Have | Partial | Missing |
|-------|------|---------|---------|
| Conceptual (C) | ~10 | ~6 | ~4 |
| Logical (L) | ~15 | ~25 | ~58 |
| Physical (P) | ~12 | ~12 | ~48 |

**Interpretation:** UI and finance/ingest foundations exist. **Self-service connectors, agents, auth, insights, and distribution packaging** are the bulk of remaining build for a complete customer demo.

---

# F. Doc map

| Need | Document |
|------|----------|
| This checklist | [COMPLETE_PRODUCT_BUILD.md](./COMPLETE_PRODUCT_BUILD.md) |
| Website / Marketplace / on-prem | [DISTRIBUTION_AND_ONBOARDING.md](./DISTRIBUTION_AND_ONBOARDING.md) |
| Connect / Push / Auto-agent | [SELF_SERVICE_INTEGRATION.md](./SELF_SERVICE_INTEGRATION.md) |
| Pricing & value | [PRICING_AND_VALUE.md](./PRICING_AND_VALUE.md) |
| Prospects by band | [PROSPECTS_BY_PRICE_BAND.md](./PROSPECTS_BY_PRICE_BAND.md) |
| Tables & APIs | [TABLES_AND_APIS.md](./TABLES_AND_APIS.md) |
| Maturity / GTM | [PRODUCT_MATURITY_AND_GTM.md](./PRODUCT_MATURITY_AND_GTM.md) |
