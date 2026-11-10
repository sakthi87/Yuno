-- Performance indexes for platform metadata queries

CREATE INDEX IF NOT EXISTS idx_universes_cloud_env ON universes (cloud, environment);
CREATE INDEX IF NOT EXISTS idx_universes_name ON universes (name);
CREATE INDEX IF NOT EXISTS idx_nodes_universe_id ON nodes (universe_id);
CREATE INDEX IF NOT EXISTS idx_infrastructure_universe_id ON infrastructure (universe_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_sort_time ON audit_log (sort_time DESC);
CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_at ON platform_settings (updated_at DESC);
