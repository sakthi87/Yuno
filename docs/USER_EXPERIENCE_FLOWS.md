# YugabyteDB Platform — User Experience Flows

**Document Version:** 1.0  
**Status:** Draft  
**Last Updated:** August 27, 2026

---

## 1. Navigation Structure

```
HOME (Overview)
│
├── AWS
│    ├── DEV
│    ├── IT
│    ├── UAT
│    └── PROD
│
├── Azure
│    ├── DEV
│    ├── IT
│    ├── UAT
│    └── PROD
│
├── Universes (search + drill-down)
├── Infrastructure (VMs, agents)
├── Security & Certificates
├── Alerts & Compliance
├── Provision Universe
├── Audit
└── Platform Health
```

All items are clickable and drillable. Breadcrumbs appear on detail pages.

---

## 2. Personas

| Persona | Primary Flows |
|---------|---------------|
| **Platform Admin** | Global overview, platform health, provisioning approval, audit |
| **DBA** | Universe detail, health dimensions, remediation, upgrades |
| **Developer** | DEV provisioning request, universe status |
| **Operations** | Alerts, drift, node detail, service status |
| **Security** | Certificate inventory, security compliance, vulnerability status |

---

## 3. Flow: Global Health Overview

**Entry:** Login → Overview tab (default)

**User sees:**
1. KPI row: Total universes, nodes, healthy/warning/critical counts
2. Global health table: Cloud × Environment matrix
3. Cloud summary cards (AWS vs Azure)
4. Critical issues feed (prioritized)
5. Recent provisioning activity

**Actions:**
- Click table row → filter Universes tab to that cloud/environment
- Click issue → navigate to affected universe or certificate
- Click cloud card → Cloud Explorer with environment breakdown

**Demo UI:** `OverviewDashboard` component

---

## 4. Flow: Cloud → Environment → Universe Drill-Down

**Entry:** Universes tab, or click from Overview

**Steps:**
1. User selects **Cloud** (AWS / Azure) from filter bar
2. User selects **Environment** (DEV / IT / UAT / PROD)
3. Tree/list shows universes with status indicators
4. User clicks universe → **Universe Detail** page

**Universe Detail shows:**
- Header: name, cloud, environment, region, owner, YB version
- Overall health badge (aggregated worst dimension)
- Health dimension grid (8 tiles: Infra, YBDB, YBA, Security, Certs, Monitoring, Backup, Compliance)
- Issues list with severity and messages
- Nodes table with per-node status
- Tabs: Overview | Nodes | YBA | Security | Certificates | Services

**Actions:**
- Click node → **Node Detail**
- Click dimension tile → filtered component view
- Click "Remediate" on drift item → confirmation modal (demo)

**Demo UI:** `UniversesView` → `UniverseDetail`

---

## 5. Flow: Node Detail

**Entry:** Universe Detail → click node row

**User sees:**
- Node identity: name, IPs, AZ, role, VM instance ID
- VM health: CPU, memory, disk, OS
- Component list:
  - YugabyteDB processes (Master/TServer)
  - Platform agent (heartbeat, version)
  - Security agent
  - Monitoring agent
  - Certificates on node
- Per-component status, last check, message

**Actions:**
- Restart Agent (demo button)
- View Logs (demo placeholder)
- Create Incident (demo placeholder)

**Demo UI:** `NodeDetail`

---

## 6. Flow: Certificate Monitoring

**Entry:** Security & Certificates tab

**User sees:**
1. Summary KPIs: Total certs, expiring < 30d, critical < 15d, expired
2. Filterable certificate table:
   - Universe, type, location, issuer, expires, days remaining, status, owner
3. Threshold legend
4. Group by universe or sort by expiry

**Actions:**
- Click certificate row → navigate to universe cert section
- Filter by status (Critical, Warning, Healthy)

**Thresholds displayed:**
| Days Remaining | Status |
|----------------|--------|
| > 60 | 🟢 Healthy |
| 30–60 | 🟢/🟡 |
| 15–30 | 🟡 Warning |
| < 15 | 🔴 Critical |
| Expired | 🔴 Critical |

**Demo UI:** `SecurityCertificates`

---

## 7. Flow: Security & Compliance

**Entry:** Security & Certificates tab → Security sub-view, or Alerts tab

**User sees:**
- Security agent status across all universes
- OS hardening compliance
- Firewall rule compliance
- Vulnerability scan results
- Endpoint protection status

**Drill-down example:**
```
Azure → PROD → payments-prod → node-02 → Security
  Security Agent       🔴
  Last heartbeat       42 minutes ago
  Version              5.4.1 (expected 5.4.2)
  Service              STOPPED
```

**Demo UI:** Security section within `SecurityCertificates` and `AlertsCompliance`

---

## 8. Flow: Alerts & Drift Detection

**Entry:** Alerts & Compliance tab

**User sees:**
1. Active alerts feed (severity-sorted)
2. Configuration drift table:
   - Resource, component, desired, actual, detected at
3. Compliance summary by environment

**Example drift:**
```
DRIFT DETECTED 🔴
VM: prod-yb-03
Component: Security Agent
Desired: RUNNING
Actual: STOPPED
[Remediate]
```

**Demo UI:** `AlertsCompliance`

---

## 9. Flow: Self-Service Universe Provisioning

**Entry:** Provision Universe tab

### Wizard Steps

| Step | Title | Fields |
|------|-------|--------|
| 1 | Basic Information | Universe name, owner, description |
| 2 | Cloud & Environment | Cloud (AWS/Azure), Environment, Region |
| 3 | Capacity | Node count, VM size, disk size |
| 4 | YugabyteDB | YB version, replication factor |
| 5 | Security | Encryption, TLS, security agent (required) |
| 6 | Backup & Monitoring | Backup enabled, monitoring enabled, retention |
| 7 | Review & Submit | Summary of all selections |

**After submit (demo simulates workflow):**

```
Provisioning payments-uat

✓ Request validated
✓ Metadata created
✓ Cloud resources selected
✓ VMs provisioned
✓ Network configured
✓ Security agent installed
✓ Monitoring agent installed
✓ Certificates installed
✓ YBA configured
✓ Universe created
✓ Nodes registered
✓ Health checks passed

Universe: payments-uat
Status: READY
```

**PROD flow adds approval step:**
```
Request submitted → Approval Required → [Approve/Reject] → Provisioning
```

**Failed step recovery:**
```
Step 13 FAILED — Create universe
[Retry] [Rollback] [Cancel]
```

**Demo UI:** `ProvisionWizard`

---

## 10. Flow: Infrastructure View

**Entry:** Infrastructure tab

**User sees:**
- VM inventory table: cloud, environment, universe, node, instance ID, type, agent status, last heartbeat
- Agent connectivity summary
- Filter by cloud, environment, agent status

**Demo UI:** `InfrastructureView`

---

## 11. Flow: Audit Trail

**Entry:** Audit tab

**User sees:**
- Chronological audit log: timestamp, actor, action, resource, details
- Filters: actor, action type, date range, environment

**Example entries:**
| Time | Actor | Action | Resource |
|------|-------|--------|----------|
| 10:31 AM | jsmith | PROVISION_APPROVE | payments-prod |
| 10:28 AM | dev-team | PROVISION_REQUEST | payments-prod |
| 09:15 AM | ops-bot | REMEDIATE | node-03 security-agent |

**Demo UI:** `AuditView`

---

## 12. Flow: Platform Health

**Entry:** Platform Health tab

**User sees:**
- Platform component status grid:
  - API, Metadata DB, Workflow Engine, AWS Adapter, Azure Adapter, YBA Adapter, Agent Connectivity, Event Bus
- Last check timestamps
- Agent connectivity percentage

**Demo UI:** `PlatformHealthView`

---

## 13. RBAC Preview (Demo)

The demo UI includes a **Role Preview** selector (matching ODP360 Analytics pattern):

| Role | Visible Tabs | Actions |
|------|--------------|---------|
| Platform Admin | All | All actions |
| DBA | All except Platform Health admin | Remediate, upgrade |
| Developer | Overview, Universes (DEV), Provision (DEV) | Request only |
| Operations | Overview, Universes, Alerts, Infrastructure | Remediate |
| Security | Overview, Security & Certs, Alerts, Audit | Read-only |

---

## 14. Screen Map (Demo UI)

| Tab | Component | Key Features |
|-----|-----------|--------------|
| Overview | `OverviewDashboard` | Global table, KPIs, critical issues, cloud cards |
| Universes | `UniversesView` / `UniverseDetail` / `NodeDetail` | Drill-down hierarchy |
| Infrastructure | `InfrastructureView` | VM inventory, agent status |
| Security & Certs | `SecurityCertificates` | Cert inventory, security status |
| Alerts | `AlertsCompliance` | Alerts feed, drift detection |
| Provision | `ProvisionWizard` | 7-step wizard, workflow progress |
| Audit | `AuditView` | Audit log table |
| Platform Health | `PlatformHealthView` | Platform component health |

---

## 15. Demo Access

```bash
cd frontend
npm install
npm run dev
```

Open: `http://localhost:5173?demo=1`

Optional query params:
- `?demo=1&tab=provision` — jump to Provision tab
- `?demo=1&tab=universes` — jump to Universes tab

The demo banner at the top of each view indicates mock data is in use.
