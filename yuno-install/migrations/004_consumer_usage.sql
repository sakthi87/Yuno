-- Consumer-level usage for finance chargeback (Phase 3)
CREATE TABLE IF NOT EXISTS consumer_usage (
  id TEXT PRIMARY KEY,
  universe_id TEXT NOT NULL REFERENCES universes(id) ON DELETE CASCADE,
  database_name TEXT NOT NULL,
  consumer TEXT,
  owner TEXT,
  raw_usage_pct REAL NOT NULL DEFAULT 0,
  usage_json TEXT NOT NULL DEFAULT '{}',
  trend_pct REAL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(universe_id, database_name)
);

CREATE INDEX IF NOT EXISTS idx_consumer_usage_universe ON consumer_usage(universe_id);
