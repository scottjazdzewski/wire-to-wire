-- WTW Canon Desk: isolated, source-preserving read model.
-- This D1 database is NOT the gameplay database or the historical Google Drive authority.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('horse','person','organization','track')),
  name TEXT NOT NULL,
  foal_year INTEGER,
  sex TEXT,
  role TEXT,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'SOURCE_SNAPSHOT',
  source TEXT NOT NULL DEFAULT 'WTW_WORKING_IMPORT',
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_entities_kind_name ON entities(kind, name);
CREATE INDEX IF NOT EXISTS idx_entities_foal ON entities(foal_year);
CREATE TABLE IF NOT EXISTS races (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  date TEXT,
  track_name TEXT,
  status TEXT NOT NULL DEFAULT 'SOURCE_SNAPSHOT',
  source TEXT,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_races_year ON races(year, name);
CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  horse_id TEXT NOT NULL REFERENCES entities(id),
  party_id TEXT NOT NULL REFERENCES entities(id),
  year INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('OWNER','TRAINER','JOCKEY','BREEDER','BARN','OTHER')),
  basis TEXT NOT NULL DEFAULT 'SOURCE_SNAPSHOT'
);
CREATE INDEX IF NOT EXISTS idx_connections_horse_year ON connections(horse_id, year);
CREATE INDEX IF NOT EXISTS idx_connections_party_year ON connections(party_id, year);
CREATE TABLE IF NOT EXISTS results (
  edition_id TEXT NOT NULL REFERENCES races(id),
  horse_id TEXT NOT NULL REFERENCES entities(id),
  position INTEGER NOT NULL CHECK(position > 0),
  PRIMARY KEY(edition_id, position),
  UNIQUE(edition_id, horse_id)
);
CREATE INDEX IF NOT EXISTS idx_results_horse ON results(horse_id);
CREATE TABLE IF NOT EXISTS change_requests (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK(target_type IN ('entity','connection','race','result')),
  target_id TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  proposed_value TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED_FOR_PROMOTION','REJECTED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,
  decided_at TEXT,
  decided_by TEXT,
  decision_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_change_status ON change_requests(status, created_at);
CREATE TABLE IF NOT EXISTS change_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL REFERENCES change_requests(id),
  action TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS source_imports (
  id TEXT PRIMARY KEY,
  source_label TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  scope TEXT,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT
);