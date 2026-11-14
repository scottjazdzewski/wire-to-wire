-- Wire to Wire: private AI naming job checkpoint and quota ONLY.
-- No historical, horse, pedigree, game save, source, or ownership tables changed.
-- Each row is a bounded <=16-horse job, not a record for every future name.
CREATE TABLE IF NOT EXISTS wtw_naming_population_jobs (
 job_id TEXT PRIMARY KEY,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 target_year INTEGER NOT NULL CHECK(target_year BETWEEN 1999 AND 2099),
 requested_count INTEGER NOT NULL CHECK(requested_count BETWEEN 1 AND 16),
 horse_ids_json TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('RESERVING','QUEUED','RUNNING','READY','BUDGET_BLOCKED','SCHEMA_REQUIRED','SUBMISSION_FAILED','SUBMISSION_UNCONFIRMED','UNSUPPORTED_RESULT')),
 request_id TEXT,
 results_json TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wtw_naming_jobs_year_state
 ON wtw_naming_population_jobs(target_year,status,created_at);
CREATE TABLE IF NOT EXISTS wtw_naming_ai_daily_usage (
 day TEXT PRIMARY KEY CHECK(length(day)=10),
 inference_count INTEGER NOT NULL CHECK(inference_count BETWEEN 0 AND 100000)
);