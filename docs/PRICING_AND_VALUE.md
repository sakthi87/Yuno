# Yugabyte Platform — Pricing and Customer Value

**Version:** 1.0  
**Last updated:** September 2026  
**Related:** [PRODUCT_MATURITY_AND_GTM.md](./PRODUCT_MATURITY_AND_GTM.md) · [SELF_SERVICE_INTEGRATION.md](./SELF_SERVICE_INTEGRATION.md) · [DISTRIBUTION_AND_ONBOARDING.md](./DISTRIBUTION_AND_ONBOARDING.md) · [COMPLETE_PRODUCT_BUILD.md](./COMPLETE_PRODUCT_BUILD.md) · [PRODUCTION_SPECIFICATION.md](./PRODUCTION_SPECIFICATION.md)

This document captures **suggested sell pricing**, **SKU packaging**, and **customer benefits / ROI** for commercial conversations. Ranges are indicative — always size to estate, integrations, and compliance scope.

---

## 1. What the customer is buying

Not “more screens.” They are buying a **control plane for their YugabyteDB estate**:

- One place for inventory, health, security, certificates, patching, drift, audit, and chargeback
- Instead of hopping across **YBA + cloud consoles + Nessus/Tanium + spreadsheets + tickets**

**Positioning:**

> YBA runs the database. This platform runs the **estate** (fleet + security + FinOps + compliance).

**Default delivery model:** install in **customer space** (VPC / on-prem). Multi-tenant SaaS is deferred (see GTM doc).

---

## 2. Suggested price bands (implementation)

| Band | Typical estate | Suggested range (USD) | What they typically get |
|------|----------------|----------------------|-------------------------|
| **Small** | ~5–20 universes, 1–2 clouds | **~$150K – $350K** | Ops Console in their environment; core visibility; SSO/RBAC basics; YBA + agent path; light finance chargeback |
| **Mid** | ~20–80 universes, multi-env | **~$350K – $900K** | Full integration pack (metrics, vulns/patches, certs, drift); production hardening; notifications; FinOps; runbooks; pilot → production |
| **Large** | 100+ universes, regulated, multi-team | **~$900K – $2M+** | Enterprise HA; deep SSO/RBAC; mTLS; compliance retention; managed private ops; custom workflows/approvals; training & multi-year support |

**Usually above base Ops Console quote (or in large band):** full self-service provisioning, auto-remediation, heavy custom Temporal/Terraform work.

---

## 3. Recurring revenue options

| Model | Suggested range (USD) | Notes |
|-------|----------------------|-------|
| **Annual platform fee + support** | **~$80K – $250K / year** | Flat; scales with SLA and estate size |
| **Per universe / month** | **~$500 – $2,000 / universe / month** | Aligns price to estate growth |
| **Per node / month** | **~$50 – $150 / node / month** | Example: 30 universes × ~3 nodes × $100 ≈ ~$108K/year |
| **Managed private** (you operate in their cloud) | Often **higher recurring** than license-only | Feels like SaaS; data stays in their account |

---

## 4. Simple commercial SKUs

| SKU | Includes | Defer | Indicative attach |
|-----|----------|-------|-------------------|
| **Starter** | Ops Console, bootstrap API, 1 cloud, YBA + agent ingest path | Full security suite | ~$120K implement + ~$60K/yr |
| **Professional** | + Nessus/Tanium/cert integrations, finance chargeback, LDAP/SSO, RHEL install | Provisioning | ~$350K implement + ~$120K/yr |
| **Enterprise** | + Self-service provisioning (when ready), HA, custom RBAC, SLAs, multi-region, managed private | Auto-remediation | ~$750K+ implement + ~$200K+/yr |

Adjust ±30% for geography, brand, and who hosts (customer vs managed).

---

## 5. Customer benefits (why they pay)

### 5.1 Time and headcount

- DBAs/ops stop tool-hopping across YBA, cloud, security, and Confluence.
- Faster “what’s wrong / where / what next?” — especially with ranked insights and plain-language answers.
- **Value story:** Fragmented work consolidated; even **~0.5–2 FTE** equivalent saved can justify a small/mid deal over a year (at ~$150K loaded cost/FTE).

### 5.2 Risk reduction

- Fewer **surprise cert expiries** on PROD.
- **CVEs and patches** tied to the same universe as health and spend.
- **Audit trail** for change and access.
- **Value story:** One avoided PROD outage or compliance finding often exceeds a mid-tier deal.

### 5.3 Operational clarity

- Cloud × environment × universe view (AWS/Azure, DEV→PROD).
- Multi-dimensional health (YB + infra + security + certs + backup), not a single green/red from YBA alone.
- **Value story:** Mean time to *identify* critical issues drops from hours of meetings toward minutes.

### 5.4 Money visibility (FinOps / chargeback)

- Universe cost from topology + rate card.
- **Usage + idle pool (Model B)** so teams see unused spend.
- **Value story:** Small % recovery of idle capacity on a large estate can dwarf the license.

### 5.5 Control without replacing YBA

- YBA remains the database control plane; this product wraps the **estate**.
- Data stays **in their VPC** (matches regulated buyers).
- **Value story:** Complementary to Yugabyte — not a database rip-and-replace.

### 5.6 Governance

- Role-scoped access, approval path (mid/large), audit for auditors.
- **Value story:** Regulated buyers pay for “we can prove it,” not for another chart.

---

## 6. Value by deal size (pitch framing)

| Band | One-line pitch | Primary benefit |
|------|----------------|-----------------|
| **Small (~$150K–$350K)** | “One pane of glass + chargeback for our YB fleet.” | Stop tribal knowledge and spreadsheets; basic production visibility |
| **Mid (~$350K–$900K)** | “Security + ops + FinOps correlated.” | Production integrations, actionable alerts, finance tied to utilization |
| **Large (~$900K–$2M+)** | “Enterprise control plane for a mission-critical estate.” | Scale, compliance, multi-team RBAC, optional managed ops, customization |

---

## 7. Simple value equation (say out loud)

> You’re not buying screens — you’re buying fewer blind spots, fewer hours hunting across tools, clearer chargeback, and less risk of cert/CVE/outage surprises on a multi-cloud Yugabyte estate.

| Value lever | Rough economic story |
|-------------|----------------------|
| Ops / DBA efficiency | ~0.5–3 FTE/year equivalent as estate grows |
| Incident / cert / CVE risk | Avoided outage or audit failure often >> mid deal |
| Idle / wasted spend | FinOps visibility → capacity and chargeback decisions |
| Provisioning (if sold later) | Fewer manual tickets; faster DEV/UAT delivery |

---

## 8. What they are *not* buying (be honest)

At these prices, do **not** oversell:

- A replacement for **YugabyteDB or YBA**
- A full **Grafana / Prometheus** replacement (fleet snapshots + deep-link out)
- Instant **multi-database** platform (Yugabyte-first; expand later)
- Fully automatic **self-healing** (roadmap / large deals)

Honesty protects price and trust: this is an **operations + FinOps + compliance layer**, not the database itself.

---

## 9. Pricing principles

1. **Scope before number** — Ops Console only vs + integrations vs + provisioning changes the band.
2. **Value-based, not cost-of-code** — Anchor to FTE, risk, and idle spend, not hours burned building the UI.
3. **Customer-space first** — Prefer project + annual support (or managed private) over shared SaaS until P0/P1 maturity and enterprise auth are real.
4. **Don’t compete with Yugabyte Inc.** — Sell the wrapper; partner narrative when possible.
5. **Verify IP / rights** before reselling if built inside another company.

---

## 10. Bottom line

| Question | Answer |
|----------|--------|
| **Small deal** | ~$150K–$350K — visibility + light FinOps |
| **Mid deal** | ~$350K–$900K — correlated security + ops + FinOps |
| **Large deal** | ~$900K–$2M+ — enterprise control plane + managed/compliance |
| **Why they buy** | Time, risk, chargeback, governance — one estate view on top of YBA |
| **How they buy** | Prefer install in their space (+ optional managed private) |

For maturity, SKUs feature list, and go-to-market sequence, see [PRODUCT_MATURITY_AND_GTM.md](./PRODUCT_MATURITY_AND_GTM.md).  
For named YugabyteDB prospects mapped to these bands, see [PROSPECTS_BY_PRICE_BAND.md](./PROSPECTS_BY_PRICE_BAND.md).
