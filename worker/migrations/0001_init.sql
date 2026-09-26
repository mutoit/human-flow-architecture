-- Registro persistente del servicio (decisión D-registro).
-- Cada llamada a la IA y cada dossier final quedan guardados.
CREATE TABLE IF NOT EXISTS calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  run_id TEXT,
  op TEXT NOT NULL,
  model TEXT,
  prompt_version TEXT,
  ms INTEGER,
  ok INTEGER NOT NULL,
  request TEXT,
  response TEXT,
  error TEXT
);
CREATE INDEX IF NOT EXISTS calls_run ON calls (run_id);
CREATE INDEX IF NOT EXISTS calls_ts ON calls (ts);

CREATE TABLE IF NOT EXISTS dossiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  run_id TEXT,
  input TEXT,
  json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS dossiers_run ON dossiers (run_id);
