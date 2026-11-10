# YugabyteDB Platform — Technical Specification

**Document Version:** 1.0  
**Status:** Draft for Architecture Review  
**Last Updated:** August 27, 2026

---

## 1. Architecture Overview

```
                         ┌───────────────────────────────┐
                         │       Yugabyte Platform       │
                         │  Operations │ Self-Service    │
                         └───────────────┬───────────────┘
                                         │ HTTPS / REST
                         ┌───────────────▼───────────────┐
                         │          API Gateway          │
                         │ AuthN / AuthZ / Rate Limits   │
                         └───────────────┬───────────────┘
                                         │
                ┌────────────────────────┼────────────────────────┐
                │                        │                        │
       ┌────────▼────────┐     ┌─────────▼─────────┐    ┌────────▼────────┐
       │ Inventory &     │     │ Health &          │    │ Provisioning &  │
       │ Metadata        │     │ Compliance        │    │ Lifecycle       │
       │ Service         │     │ Service           │    │ Orchestrator    │
       └────────┬────────┘     └─────────┬─────────┘    └────────┬────────┘
                └────────────────────────┼────────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │    Metadata Store   │
                              │ (PostgreSQL)        │
                              └──────────┬──────────┘
                                         │
       ┌─────────────────────────────────┼─────────────────────────────────┐
       │                                 │                                 │
┌──────▼──────┐              ┌──────────▼──────────┐              ┌───────▼───────┐
│ AWS Adapter │              │   Azure Adapter     │              │  YBA Adapter  │
└──────┬──────┘              └──────────┬──────────┘              └───────┬───────┘
       │                                 │                                 │
       └─────────────────────────────────┼─────────────────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │ VM / YB Agents      │
                              │ Health Collectors   │
                              └─────────────────────┘
```

**Core principle:** UI → API → Services/Orchestrator → Adapters/Agents → Infrastructure. The UI never SSHs to VMs or directly manipulates cloud resources.

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React 18 + TypeScript (future) / JSX (demo) | Matches ODP360; team familiarity |
| Backend API | Java/Spring Boot or Go | Enterprise-grade, strong ecosystem |
| Workflow Engine | Temporal | Long-running, idempotent provisioning workflows |
| Metadata DB | PostgreSQL | Relational model for inventory; YugabyteDB-compatible |
| Cache | Redis | Session, dashboard aggregation cache |
| Event Bus | Kafka or Azure Service Bus | Health events, audit, notifications |
| VM Agent | Go | Small static binary, low overhead |
| Container Runtime | Kubernetes | Platform deployment |
| IaC | Terraform | Cloud resource provisioning |
| Config Management | Ansible | VM bootstrap where needed |
| Authentication | Enterprise OIDC / Entra ID | SSO integration |
| Secrets | Azure Key Vault / AWS Secrets Manager | No secrets in metadata DB |
| Metrics | Prometheus | Time-series health metrics |
| Logs | Enterprise logging platform | Centralized log aggregation |

---

## 3. Platform Engines

| Engine | Responsibility |
|--------|----------------|
| **Inventory Engine** | Discovery and metadata for clouds, environments, universes, nodes, VMs |
| **Observability Engine** | Health checks, collectors, certificate monitoring, metrics |
| **Automation Engine** | Provisioning, scale, upgrade, decommission workflows |
| **Policy Engine** | RBAC, approval rules, compliance thresholds |
| **Reconciler** | Continuous desired vs actual state comparison |

---

## 4. Metadata Model

### 4.1 Entity Hierarchy

```
Cloud
  └── Account
       └── Environment (DEV | IT | UAT | PROD)
            └── Region
                 └── Universe
                      ├── YBA
                      ├── Node
                      │    └── VM
                      │         └── Component (agent, security, cert, etc.)
                      ├── Certificate
                      ├── BackupConfiguration
                      └── MonitoringConfiguration
```

### 4.2 Core Tables

#### `cloud`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Display name |
| provider | ENUM | AWS, AZURE |
| status | VARCHAR | ACTIVE, INACTIVE |
| created_at | TIMESTAMPTZ | |

#### `environment`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | ENUM | DEV, IT, UAT, PROD |
| cloud_id | UUID | FK → cloud |
| account_id | UUID | FK → account |
| region | VARCHAR | Default region |
| status | VARCHAR | |

#### `universe`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Universe name |
| environment_id | UUID | FK → environment |
| yba_id | VARCHAR | YBA reference |
| yb_version | VARCHAR | YugabyteDB version |
| desired_state | JSONB | Target configuration |
| actual_state | JSONB | Reported configuration |
| status | ENUM | HEALTHY, WARNING, CRITICAL, PROVISIONING, UNKNOWN |
| owner | VARCHAR | Team/owner |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `node`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| universe_id | UUID | FK → universe |
| node_name | VARCHAR | |
| private_ip | INET | |
| public_ip | INET | |
| availability_zone | VARCHAR | |
| role | ENUM | MASTER, TSERVER, MASTER_TSERVER |
| status | ENUM | Health status |

#### `vm`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| node_id | UUID | FK → node |
| cloud_instance_id | VARCHAR | EC2/VM instance ID |
| instance_type | VARCHAR | |
| os | VARCHAR | |
| os_version | VARCHAR | |
| agent_status | ENUM | CONNECTED, DISCONNECTED, UNKNOWN |
| last_heartbeat | TIMESTAMPTZ | |

#### `component` (generic extensibility)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| vm_id | UUID | FK → vm (nullable) |
| universe_id | UUID | FK → universe |
| component_type | ENUM | SECURITY_AGENT, MONITORING_AGENT, BACKUP_AGENT, YB_AGENT, YBA, CERTIFICATE, etc. |
| name | VARCHAR | |
| version | VARCHAR | |
| desired_status | VARCHAR | |
| actual_status | VARCHAR | |
| last_check | TIMESTAMPTZ | |
| message | TEXT | |

#### `certificate`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| resource_type | VARCHAR | UNIVERSE, NODE, YBA, VM |
| resource_id | UUID | |
| cert_type | ENUM | YB_TLS, YBA_TLS, VM_TLS |
| subject | VARCHAR | |
| issuer | VARCHAR | |
| serial_number | VARCHAR | |
| valid_from | TIMESTAMPTZ | |
| expires_at | TIMESTAMPTZ | |
| days_remaining | INT | Computed |
| status | ENUM | HEALTHY, WARNING, CRITICAL, EXPIRED |

#### `health_check_result`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| check_id | VARCHAR | Check identifier |
| resource_id | UUID | |
| resource_type | VARCHAR | |
| status | ENUM | HEALTHY, WARNING, CRITICAL, UNKNOWN, NOT_APPLICABLE |
| severity | INT | |
| message | TEXT | |
| details | JSONB | |
| timestamp | TIMESTAMPTZ | |
| duration_ms | INT | |

#### `provisioning_request`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| requester | VARCHAR | |
| universe_name | VARCHAR | |
| cloud_id | UUID | |
| environment_id | UUID | |
| spec | JSONB | Full request specification |
| status | ENUM | PENDING, APPROVAL_REQUIRED, APPROVED, PROVISIONING, READY, FAILED, CANCELLED |
| workflow_id | VARCHAR | Temporal workflow ID |
| created_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |

#### `provisioning_step`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| request_id | UUID | FK → provisioning_request |
| step_order | INT | |
| step_name | VARCHAR | |
| status | ENUM | PENDING, RUNNING, COMPLETED, FAILED, SKIPPED |
| started_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |
| message | TEXT | |

#### `audit_log`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| actor | VARCHAR | |
| action | VARCHAR | |
| resource_type | VARCHAR | |
| resource_id | UUID | |
| details | JSONB | |
| timestamp | TIMESTAMPTZ | |
| ip_address | INET | |

---

## 5. Health Check Framework

Plugin-based health checks return standardized results:

```json
{
  "check_id": "security_agent_heartbeat",
  "resource_id": "node-03-uuid",
  "resource_type": "NODE",
  "status": "WARNING",
  "severity": 2,
  "message": "Agent heartbeat missing for 37 minutes",
  "timestamp": "2026-08-27T18:30:00Z",
  "duration_ms": 45,
  "details": {
    "last_success": "2026-08-27T17:52:00Z",
    "expected_version": "5.4.2",
    "actual_version": "5.4.1"
  }
}
```

### Check Categories

| Category | Checks |
|----------|--------|
| VM | CPU, memory, disk, OS, network |
| YugabyteDB | Master, TServer, tablet health, replication, version |
| YBA | Connectivity, version, universe status |
| Security | Agent heartbeat, vulnerability scan, OS hardening |
| Certificates | Expiration, issuer, chain validity |
| Monitoring | Agent status, metrics flow |
| Backup | Configuration, last successful backup |

### Universe Health Aggregation

Universe overall status = worst dimension status. Dimensions are independently computed and stored.

---

## 6. Agent Architecture

```
              VM
┌──────────────────────────────────┐
│  YugabyteDB (Master / TServer)   │
│  Enterprise Agents (Sec/Mon)     │
│  ┌────────────────────────────┐  │
│  │ Yugabyte Platform Agent    │  │
│  │ - heartbeat                │  │
│  │ - OS / service checks      │  │
│  │ - cert checks              │  │
│  │ - YB process checks        │  │
│  └────────────┬───────────────┘  │
└───────────────┼──────────────────┘
                │ HTTPS/mTLS (outbound)
                ▼
         Platform Collector API
```

**Design rule:** Agent → Platform (outbound). No inbound SSH from platform to VMs.

---

## 7. API Design

Base path: `/api/v1`

### Inventory
| Method | Path | Description |
|--------|------|-------------|
| GET | `/clouds` | List clouds |
| GET | `/environments` | List environments (filter by cloud) |
| GET | `/universes` | List universes (filter by cloud, env) |
| GET | `/universes/{id}` | Universe detail |
| GET | `/universes/{id}/health` | Multi-dimensional health |
| GET | `/universes/{id}/nodes` | Universe nodes |
| GET | `/universes/{id}/certificates` | Universe certificates |
| GET | `/universes/{id}/components` | Universe components |

### Operations
| Method | Path | Description |
|--------|------|-------------|
| POST | `/universes/{id}/scale` | Scale universe |
| POST | `/universes/{id}/upgrade` | Upgrade YB version |
| POST | `/universes/{id}/remediate` | Trigger remediation |

### Provisioning
| Method | Path | Description |
|--------|------|-------------|
| POST | `/provisioning` | Create universe request |
| GET | `/provisioning/{id}` | Workflow status |
| POST | `/provisioning/{id}/approve` | Approve (PROD) |
| POST | `/provisioning/{id}/cancel` | Cancel workflow |
| POST | `/provisioning/{id}/retry` | Retry failed step |

### Compliance & Audit
| Method | Path | Description |
|--------|------|-------------|
| GET | `/certificates` | Global certificate inventory |
| GET | `/alerts` | Active alerts |
| GET | `/drift` | Configuration drift |
| GET | `/audit` | Audit log |

### Async Response Pattern
```json
POST /provisioning → { "requestId": "abc123", "status": "PROVISIONING" }
GET /provisioning/abc123 → { "status": "PROVISIONING", "steps": [...] }
```

---

## 8. Provisioning Workflow (Temporal)

```
1.  Validate request
2.  Validate cloud/environment permissions
3.  Validate quotas
4.  Create metadata record
5.  Provision network/security prerequisites (Terraform)
6.  Provision VMs (Terraform)
7.  Wait for VMs ready
8.  Install platform agent
9.  Install/configure security components
10. Install/configure monitoring
11. Install/configure certificates
12. Register nodes with YBA
13. Create YugabyteDB universe
14. Configure backup
15. Run health checks
16. Run compliance checks
17. Update metadata
18. Mark READY
```

Each step is idempotent. Failed steps support Retry / Rollback / Cancel.

---

## 9. Event-Driven Model

```
Agent → Health Event → Event Bus → ┬ Health Service
                                   ├ Alert Service
                                   ├ Metadata Service
                                   ├ Audit Service
                                   └ Notification Service
```

Example event: `SECURITY_AGENT_DOWN` triggers health update, alert creation, owner notification, optional remediation.

---

## 10. Security Architecture

```
User → SSO (OIDC) → API Gateway → RBAC + Audit + Policy
                                        │
                                        ▼
                              Workflow Engine
                                        │
                          ┌─────────────┼─────────────┐
                          ▼             ▼             ▼
                    Cloud Creds    YBA Creds     Secrets
                    (Managed ID)   (Vault)       (Key Vault)
```

- mTLS between agents and platform
- No cloud/YBA passwords in metadata DB
- Workload identities / managed identities preferred
- Short-lived credentials for cloud API calls

---

## 11. Data Layer Separation

| Store | Purpose | Technology |
|-------|---------|------------|
| Metadata DB | Current state, configuration, inventory | PostgreSQL |
| Metrics DB | Time-series health metrics | Prometheus / TSDB |
| Event Store | Events, workflow history | Kafka / Event Store |
| Log Platform | Detailed operational logs | Enterprise SIEM |

---

## 12. Demo UI (Current Phase)

The demo UI (`frontend/`) is a **playbox** with mock data demonstrating all planned features. It uses ODP360 styling conventions and does not connect to backend services.

**Run locally:**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173?demo=1` for preview mode.

---

## 13. Infrastructure Layout (Target)

```
terraform/
├── aws/
│   ├── network/
│   ├── security/
│   ├── vm/
│   └── yugabyte/
└── azure/
    ├── network/
    ├── security/
    ├── vm/
    └── yugabyte/
```

Platform supplies variables; Terraform provisions infrastructure; orchestrator manages lifecycle.

---

## 14. Observability of the Platform

Monitor: API availability, workflow engine, metadata DB, message bus, agents, collectors, cloud adapters.

Platform health dashboard exposes component-level status independent of managed infrastructure health.
