-- WTW v3.3 additive, source-preserving geographic READ MODEL.
-- This does not replace the Google Drive canon or change existing history tables.
-- Deliberately no FK to entities: the 1999 production Horse_ID/Person_ID corpus is
-- larger than the old imported historical archive. Never invent placeholder identities.
CREATE TABLE IF NOT EXISTS wtw_geo_read_records (
  source_record_id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_kind TEXT NOT NULL CHECK(entity_kind IN ('horse','person','organization','track')),
  relation_kind TEXT NOT NULL,
  effective_at TEXT,
  city_locality TEXT,
  state_region TEXT,
  country TEXT,
  place_name TEXT,
  travel_node TEXT,
  location_type TEXT,
  geography_status TEXT,
  canon_status TEXT,
  source_sheet TEXT NOT NULL,
  source_basis TEXT,
  evidence_note TEXT,
  metadata_json TEXT NOT NULL,
  record_sha256 TEXT NOT NULL CHECK(length(record_sha256)=64),
  import_batch TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wtw_geo_entity ON wtw_geo_read_records(entity_id,relation_kind,effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_wtw_geo_source ON wtw_geo_read_records(source_sheet,entity_kind);
CREATE INDEX IF NOT EXISTS idx_wtw_geo_places ON wtw_geo_read_records(country,state_region,city_locality);
CREATE TABLE IF NOT EXISTS wtw_geo_import_manifest (
  batch_id TEXT PRIMARY KEY,
  source_sheet_url TEXT NOT NULL,
  source_digest_sha256 TEXT NOT NULL CHECK(length(source_digest_sha256)=64),
  total_records INTEGER NOT NULL CHECK(total_records>0),
  horse_current INTEGER NOT NULL,
  horse_foaling INTEGER NOT NULL,
  participant_geography INTEGER NOT NULL,
  organization_geography INTEGER NOT NULL,
  track_geography INTEGER NOT NULL,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_policy TEXT NOT NULL
);
