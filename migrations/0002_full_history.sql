-- WTW historical read model expansion. The existing source master remains authoritative.
-- Apply only to the dedicated wire-to-wire D1 database.
CREATE TABLE IF NOT EXISTS horse_details (
  horse_id TEXT PRIMARY KEY REFERENCES entities(id),
  sire_id TEXT,
  dam_id TEXT,
  canon_role TEXT,
  raw_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_horse_details_sire ON horse_details(sire_id);
CREATE INDEX IF NOT EXISTS idx_horse_details_dam ON horse_details(dam_id);
CREATE TABLE IF NOT EXISTS horse_seasons (
  horse_id TEXT NOT NULL REFERENCES entities(id),
  year INTEGER NOT NULL,
  owner_id TEXT,
  trainer_id TEXT,
  jockey_id TEXT,
  breeder_id TEXT,
  stakes_wins INTEGER,
  top3_starts INTEGER,
  season_score REAL,
  region TEXT,
  raw_json TEXT NOT NULL,
  PRIMARY KEY (horse_id,year)
);
CREATE INDEX IF NOT EXISTS idx_horse_seasons_year ON horse_seasons(year);
CREATE INDEX IF NOT EXISTS idx_horse_seasons_owner ON horse_seasons(owner_id,year);
CREATE INDEX IF NOT EXISTS idx_horse_seasons_trainer ON horse_seasons(trainer_id,year);
CREATE TABLE IF NOT EXISTS edition_details (
  edition_id TEXT PRIMARY KEY REFERENCES races(id),
  track_id TEXT,
  surface TEXT,
  distance_f REAL,
  field_size INTEGER,
  race_date_basis TEXT,
  raw_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_edition_details_track ON edition_details(track_id);
CREATE TABLE IF NOT EXISTS pedigree_edges (
  edge_key TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  parent_name TEXT,
  child_name TEXT,
  biology_check TEXT,
  raw_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pedigree_parent ON pedigree_edges(parent_id);
CREATE INDEX IF NOT EXISTS idx_pedigree_child ON pedigree_edges(child_id);
CREATE TABLE IF NOT EXISTS bloodline_profiles (
  horse_id TEXT PRIMARY KEY REFERENCES entities(id),
  raw_json TEXT NOT NULL
);