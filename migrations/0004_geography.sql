-- Additive staging migration for the historical read model.
-- Apply only after import/source review; this does not seed or replace canon.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS geographic_places (
  id TEXT PRIMARY KEY,
  name TEXT,
  city TEXT,
  subdivision TEXT,
  country_code TEXT NOT NULL CHECK (length(country_code) = 2),
  latitude REAL CHECK (latitude BETWEEN -90 AND 90),
  longitude REAL CHECK (longitude BETWEEN -180 AND 180),
  precision TEXT NOT NULL CHECK (precision IN ('FACILITY','CITY','REGION','COUNTRY')),
  source_status TEXT NOT NULL CHECK (source_status IN ('SOURCED','FICTIONAL','PROVISIONAL')),
  source_ref TEXT,
  CHECK (latitude IS NULL OR longitude IS NOT NULL),
  CHECK (longitude IS NULL OR latitude IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS entity_place_links (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL REFERENCES entities(id),
  place_id TEXT NOT NULL REFERENCES geographic_places(id),
  relation TEXT NOT NULL CHECK (relation IN
    ('TRACK_LOCATION','FARM_LOCATION','BARN_LOCATION','BIRTHPLACE','BASE_LOCATION','FOALING_LOCATION')),
  valid_from_year INTEGER,
  valid_to_year INTEGER,
  source_status TEXT NOT NULL CHECK (source_status IN ('SOURCED','FICTIONAL','PROVISIONAL')),
  source_ref TEXT,
  CHECK (valid_from_year IS NULL OR valid_to_year IS NULL OR valid_from_year <= valid_to_year)
);
CREATE INDEX IF NOT EXISTS idx_entity_place_entity ON entity_place_links(entity_id, relation, valid_from_year, valid_to_year);
CREATE INDEX IF NOT EXISTS idx_entity_place_place ON entity_place_links(place_id);
