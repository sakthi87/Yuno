# Platform Agents

Agents and integrations **must not write to PostgreSQL directly**. Use the ingest API with `AGENT_API_TOKEN`.

## Configuration (from install)

```bash
COLLECTOR_URL=https://<your-host>/api/v1/ingest
AGENT_API_TOKEN=<from /etc/yuno/secrets.env>
```

## Headers

```http
Authorization: Bearer <AGENT_API_TOKEN>
Content-Type: application/json
```

## Primary endpoints

| Endpoint | Use |
|----------|-----|
| `POST /ingest/universes` | YBA inventory sync |
| `POST /ingest/heartbeat` | Node/agent liveness (every ~30s) |
| `POST /ingest/metrics` | Universe metrics snapshots |
| `POST /ingest/vulnerabilities` | Nessus CVE bulk upsert |
| `POST /ingest/patch-jobs` | Tanium patch jobs |

Full reference: `docs/API_REFERENCE.md`

## Validate after install

```bash
source /etc/yuno/secrets.env
./scripts/test-ingest-api.sh
```
