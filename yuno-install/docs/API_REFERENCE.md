# Yugabyte Platform — API Reference

**Version:** 1.0.0  
**Base URL:** `https://<your-host>/api/v1`  
**Content-Type:** `application/json`

---

## 1. Authentication

| Audience | Header | Used for |
|----------|--------|----------|
| **Agents / automation** | `Authorization: Bearer <AGENT_API_TOKEN>` | All `/ingest/*` write endpoints |
| **Administrators** | `Authorization: Bearer <ADMIN_API_TOKEN>` | Settings, reseed |
| **UI / read-only clients** | None (today) | All `GET` read endpoints |

Alternative header: `X-API-Key: <token>`

Tokens are generated at install and stored in `/etc/yuno/secrets.env`.

---

## 2. Design principles

1. **PostgreSQL is never exposed for writes** — all mutations go through this API.
2. **Upsert semantics** — repeated POSTs with the same `id` update existing rows.
3. **Read endpoints** return the same shapes the UI consumes (compatible with bootstrap payload).
4. **Audit** — ingest operations write rows to `audit_log`.

---

## 3. Health and discovery

### GET `/health`

Platform and database liveness.

**Response 200**

```json
{
  "status": "ok",
  "database": "postgresql://yuno:***@127.0.0.1:5432/yuno_platform",
  "driver": "postgres",
  "companyName": "Acme Corp",
  "config": {
    "companyName": "Acme Corp",
    "dbDriver": "postgres",
    "autoSeed": false
  }
}
```

---

## 4. Read APIs (UI and reporting)

No authentication required today. Protect at network layer (VPN / internal LB) in production.

### GET `/bootstrap`

Full payload for UI initial load (all tables aggregated).

**Response 200:** Object containing `universes`, `nodesByUniverse`, `alerts`, `vulnerabilities`, `patchJobs`, `globalKpis`, etc.

---

### GET `/overview/kpis`

```json
{
  "totalUniverses": 0,
  "totalNodes": 0,
  "healthy": 0,
  "warning": 0,
  "critical": 0,
  "agentsConnected": 0,
  "certsExpiring30d": 0
}
```

---

### GET `/overview/matrix`

Cloud × environment summary array.

---

### GET `/overview/issues`

Critical issues feed array.

---

### GET `/universes`

Query params: `cloud`, `environment`

```json
{ "items": [ { "id": "uni-payments-prod", "name": "payments-prod", "cloud": "AWS", "environment": "PROD", "...": "..." } ] }
```

---

### GET `/vms`

Query params: `cloud`, `environment`, `agentStatus`

```json
{
  "items": [ { "id": "vm-001", "agentStatus": "CONNECTED", "...": "..." } ],
  "summary": { "total": 0, "connected": 0, "disconnected": 0 }
}
```

---

### GET `/alerts` · `/drift` · `/certificates`

Returns JSON array of records.

---

### GET `/vulnerabilities` · `/patch-jobs`

Query params: `cloud`, `environment`, `severity`/`status`

```json
{
  "items": [],
  "summary": { "total": 0, "open": 0, "inProgress": 0, "remediated": 0, "critical": 0 }
}
```

---

### GET `/audit`

Audit log entries, newest first.

---

### GET `/platform/health`

Control-plane component health rows.

---

### GET `/settings`

Platform settings (LDAP/SSO, install metadata).

```json
{
  "auth": { "ldapEnabled": false, "ssoEnabled": false, "provider": null },
  "install": { "companyName": "Acme Corp", "awaitingAgents": true }
}
```

---

## 5. Write APIs — Ingest (agents and integrations)

**Authentication:** `AGENT_API_TOKEN` required on every request.

Base path: `/api/v1/ingest`

---

### POST `/ingest/heartbeat`

Periodic agent check-in. Updates node, optional VM/infrastructure record.

**Request**

```json
{
  "universeId": "uni-payments-prod",
  "node": {
    "id": "node-01",
    "name": "node-01",
    "privateIp": "10.0.1.11",
    "publicIp": "—",
    "az": "us-east-1a",
    "role": "LEADER",
    "status": "HEALTHY",
    "components": [
      { "name": "yb-master", "version": "2.25.1.0", "desiredStatus": "RUNNING", "actualStatus": "RUNNING" }
    ],
    "infrastructure": {
      "id": "vm-node-01",
      "cloud": "AWS",
      "environment": "PROD",
      "agentStatus": "CONNECTED"
    }
  }
}
```

**Response 200**

```json
{ "ok": true, "nodeId": "node-01", "receivedAt": "2026-08-27T20:00:00.000Z" }
```

---

### POST `/ingest/universes`

Upsert universe inventory (typically from YBA sync agent).

**Request**

```json
{
  "id": "uni-payments-prod",
  "name": "payments-prod",
  "cloud": "AWS",
  "environment": "PROD",
  "region": "us-east-1",
  "ybVersion": "2.25.1.0",
  "owner": "DBA Team",
  "status": "HEALTHY",
  "health": { "yugabytedb": "HEALTHY", "security": "WARNING" },
  "issues": [ { "severity": "WARNING", "message": "Agent outdated" } ],
  "nodes": ["node-01", "node-02", "node-03"]
}
```

**Response 201:** `{ "ok": true, "id": "uni-payments-prod" }`

---

### POST `/ingest/nodes`

**Request**

```json
{
  "universeId": "uni-payments-prod",
  "node": {
    "id": "node-02",
    "name": "node-02",
    "privateIp": "10.0.1.12",
    "role": "FOLLOWER",
    "status": "HEALTHY",
    "vm": { "instanceType": "m5.xlarge", "os": "RHEL 8" },
    "components": []
  }
}
```

---

### POST `/ingest/metrics`

Universe metrics snapshot (from Prometheus aggregator).

**Request**

```json
{
  "universeId": "uni-payments-prod",
  "metrics": {
    "readOpsPerSec": 1200,
    "writeOpsPerSec": 800,
    "avgReadLatencyMs": 2.1,
    "cpuAvgPct": 45,
    "memoryAvgPct": 62,
    "diskUsedPct": 55
  }
}
```

---

### POST `/ingest/infrastructure`

Upsert VM/agent inventory row.

**Request:** Full VM object with at least `"id"`.

---

### POST `/ingest/alerts`

**Request:** Alert object with `"id"`, `"severity"`, `"title"`, `"resourceLabel"`, etc.

---

### POST `/ingest/drift`

**Request:** Drift item with `"id"`, `"component"`, `"desired"`, `"actual"`.

---

### POST `/ingest/vulnerabilities`

Single object or **array** of CVE records (Nessus worker).

**Request (array example)**

```json
[
  {
    "id": "vuln-001",
    "cveId": "CVE-2024-6119",
    "severity": "CRITICAL",
    "status": "OPEN",
    "cloud": "AWS",
    "environment": "PROD",
    "universe": "payments-prod",
    "node": "node-01",
    "packageName": "openssl",
    "installedVersion": "1.1.1k",
    "fixedVersion": "1.1.1w"
  }
]
```

**Response 201:** `{ "ok": true, "count": 1, "ids": ["vuln-001"] }`

---

### POST `/ingest/patch-jobs`

Single object or array (Tanium worker).

---

### POST `/ingest/certificates`

Certificate inventory record with `"id"`, `"subject"`, `"expiresAt"`, etc.

---

### DELETE `/ingest/alerts/:id`

Remove resolved alert.

**Response 200:** `{ "ok": true, "id": "alert-001" }`

---

### POST `/ingest/consumer-usage`

**Phase 3 — database-level usage for finance chargeback (Model B).**

Single consumer or batch:

```json
{
  "universeId": "uni-payments-prod",
  "consumers": [
    {
      "database": "payments_core",
      "consumer": "Payments Core Team",
      "owner": "payments-core@corp.com",
      "rawUsagePct": 5,
      "usage": { "cpuPct": 5, "storageGb": 820, "readOpsPct": 6, "writeOpsPct": 4 },
      "trendPct": 5.1
    }
  ]
}
```

`rawUsagePct` is share of **universe capacity** (not normalized to 100%). The API computes active/idle pools on bootstrap.

**Response 201:** `{ "ok": true, "universeId": "...", "count": 4, "ids": ["..."] }`

---

### DELETE `/ingest/consumer-usage/:universeId/:database`

Remove a consumer usage record.

---

## 6. Admin APIs

**Authentication:** `ADMIN_API_TOKEN` required.

### PUT `/admin/settings/auth`

Configure LDAP/SSO (also available in **Platform Health → Settings** UI).

**Authentication:** `ADMIN_API_TOKEN`

---

### GET `/admin/settings/finance` · PUT `/admin/settings/finance`

Read or update the **finance rate card** used to compute universe monthly costs.

**GET response:**

```json
{
  "currency": "USD",
  "allocationModel": "usage_plus_idle",
  "hoursPerMonth": 730,
  "rates": {
    "licensePerVcpuMonth": 33.33,
    "computePerVcpuHour": 0.064,
    "storagePerGbMonth": 0.12,
    "networkPerGb": 0.09,
    "backupPctOfStorage": 20,
    "platformOverheadPct": 5,
    "defaultStorageGbPerNode": 500,
    "networkGbPerNodeMonth": 150
  },
  "cloudOverrides": { "Azure": { "computePerVcpuHour": 0.072 } },
  "environmentOverrides": { "DEV": { "licensePerVcpuMonth": 0 } }
}
```

Universe costs on `/bootstrap` and `/finance` are **recomputed** from this policy + node topology + universe metrics. Consumer chargeback uses ingested `consumer_usage` rows.

---

### GET `/finance`

Returns computed finance snapshot (same fields as bootstrap finance section):

```json
{
  "financePolicy": { },
  "universeCosts": [ ],
  "consumerCosts": [ ],
  "financeKpis": { }
}
```

---

### GET `/admin/tls/status` · POST `/admin/tls`

View or replace TLS certificate. POST body:

```json
{
  "certificate": "-----BEGIN CERTIFICATE-----\n...",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n..."
}
```

Automatically runs `nginx -t` and restarts nginx.

---

### GET `/admin/services/status` · POST `/admin/services/restart`

Check or restart `yuno-api`, `nginx`, `postgresql` systemd units.

```json
{ "service": "nginx" }
```

---

### POST `/admin/reseed`

Loads demo data (lab only). Disabled in production unless `ALLOW_RESEED=true`.

---

## 7. Data model reference

| PostgreSQL table | Read endpoint | Write endpoint |
|------------------|---------------|----------------|
| `universes` | `/universes`, `/bootstrap` | `POST /ingest/universes` |
| `nodes` | `/bootstrap`, `/vms` | `POST /ingest/nodes`, `/ingest/heartbeat` |
| `universe_metrics` | `/bootstrap` | `POST /ingest/metrics` |
| `infrastructure` | `/vms` | `POST /ingest/infrastructure`, `/ingest/heartbeat` |
| `alerts` | `/alerts` | `POST /ingest/alerts`, `DELETE /ingest/alerts/:id` |
| `drift_items` | `/drift` | `POST /ingest/drift` |
| `vulnerabilities` | `/vulnerabilities` | `POST /ingest/vulnerabilities` |
| `patch_jobs` | `/patch-jobs` | `POST /ingest/patch-jobs` |
| `certificates` | `/certificates` | `POST /ingest/certificates` |
| `consumer_usage` | `/bootstrap`, `/finance` | `POST /ingest/consumer-usage` |
| `audit_log` | `/audit` | Written automatically on ingest |
| `platform_settings` | `/settings` | `PUT /settings/:key` (admin) |
| `app_config` | `/bootstrap`, `/overview/*` | Updated by aggregators (future) |

Full UI mapping: `yuno-install/config/schema-manifest.json`

**Extended reference** (table columns, integration curl examples, data flow): [docs/TABLES_AND_APIS.md](../../docs/TABLES_AND_APIS.md)

---

## 8. Error responses

| HTTP | Meaning |
|------|---------|
| 400 | Invalid payload (missing required fields) |
| 401 | Missing or invalid API token |
| 403 | Operation disabled (e.g. reseed in production) |
| 404 | Referenced universe not found (heartbeat) |
| 503 | Database unavailable or token not configured |

```json
{ "error": "Invalid or missing agent API token" }
```

---

## 9. Example agent workflow

```bash
BASE="https://platform.example.com/api/v1"
TOKEN="<AGENT_API_TOKEN>"

# 1. Register universe (once)
curl -X POST "$BASE/ingest/universes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @universe.json

# 2. Heartbeat every 30s
curl -X POST "$BASE/ingest/heartbeat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @heartbeat.json

# 3. Push metrics every 5m
curl -X POST "$BASE/ingest/metrics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @metrics.json
```

---

## 10. Versioning

All endpoints are prefixed with `/api/v1`. Breaking changes will increment to `/api/v2` with a documented migration period.
