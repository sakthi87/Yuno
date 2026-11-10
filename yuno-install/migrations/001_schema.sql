-- Yugabyte Platform metadata schema (PostgreSQL 15+)
-- Applied by yuno-install step 1

CREATE TABLE IF NOT EXISTS universes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cloud TEXT NOT NULL,
  environment TEXT NOT NULL,
  region TEXT,
  yb_version TEXT,
  owner TEXT,
  status TEXT,
  health_json TEXT NOT NULL DEFAULT '{}',
  issues_json TEXT NOT NULL DEFAULT '[]',
  node_names_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  universe_id TEXT NOT NULL REFERENCES universes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  private_ip TEXT,
  public_ip TEXT,
  az TEXT,
  role TEXT,
  status TEXT,
  vm_json TEXT NOT NULL DEFAULT '{}',
  components_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS universe_metrics (
  universe_id TEXT PRIMARY KEY REFERENCES universes(id) ON DELETE CASCADE,
  metrics_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS infrastructure (
  id TEXT PRIMARY KEY,
  universe_id TEXT,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drift_items (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vulnerabilities (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patch_jobs (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  sort_time TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS platform_health (
  id SERIAL PRIMARY KEY,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
