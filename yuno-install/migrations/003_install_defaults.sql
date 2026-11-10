-- Empty production defaults written at install time (no demo estate data)

INSERT INTO app_config (key, value_json) VALUES
  ('companyName', '"Yugabyte Platform"'),
  ('clouds', '["AWS","Azure"]'),
  ('environments', '["DEV","IT","UAT","PROD"]'),
  ('globalOverview', '[]'),
  ('globalKpis', '{"totalUniverses":0,"totalNodes":0,"healthy":0,"warning":0,"critical":0,"agentsConnected":0,"certsExpiring30d":0}'),
  ('criticalIssues', '[]'),
  ('status', '{"HEALTHY":"HEALTHY","WARNING":"WARNING","CRITICAL":"CRITICAL"}'),
  ('vulnStatus', '{"OPEN":"OPEN","SCHEDULED":"SCHEDULED","IN_PROGRESS":"IN_PROGRESS","REMEDIATED":"REMEDIATED"}'),
  ('patchStatus', '{"SCHEDULED":"SCHEDULED","IN_PROGRESS":"IN_PROGRESS","COMPLETED":"COMPLETED","FAILED":"FAILED"}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO platform_settings (key, value_json) VALUES
  ('auth', '{"ldapEnabled":false,"ssoEnabled":false,"provider":null,"configuredVia":"install"}'),
  ('install', '{"awaitingAgents":true,"configuredVia":"install"}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO platform_health (payload_json) VALUES
  ('{"component":"Platform API","status":"HEALTHY","detail":"API installed and reachable"}'),
  ('{"component":"Metadata Database","status":"HEALTHY","detail":"PostgreSQL schema ready — awaiting agent ingestion"}'),
  ('{"component":"Agent Connectivity","status":"WARNING","detail":"No agents connected yet"}'),
  ('{"component":"LDAP / SSO","status":"WARNING","detail":"Configure via Platform Settings in UI"}')
ON CONFLICT DO NOTHING;
