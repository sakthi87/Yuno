# YugabyteDB Platform — Demo UI

Interactive playbox demonstrating all planned platform features. Styled after ODP360.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

Optional: `?tab=provision` to jump to a specific tab.

## Features (Demo)

| Tab | Features |
|-----|----------|
| **Overview** | Global health matrix, KPIs, critical issues, cloud cards |
| **Universes** | Cloud/env filters, drill-down to universe → node detail |
| **Infrastructure** | VM inventory, agent connectivity |
| **Security & Certs** | Certificate inventory, security agents, compliance |
| **Alerts** | Alert feed, configuration drift detection |
| **Provision Universe** | 7-step wizard, PROD approval, workflow progress |
| **Audit** | Audit log with action filters |
| **Platform Health** | Control plane component status |

## Documentation

- [Production Specification](../docs/PRODUCTION_SPECIFICATION.md)
- [Technical Specification](../docs/TECHNICAL_SPECIFICATION.md)
- [User Experience Flows](../docs/USER_EXPERIENCE_FLOWS.md)

## Notes

This is a **UI preview only** — all data is mock. Backend integration is planned for subsequent phases.
