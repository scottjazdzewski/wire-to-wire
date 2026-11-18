-- WTW admin-editable display names. Canonical source data and immutable IDs remain untouched.
-- Run in WTW-only D1; safe before or after historical import.
CREATE TABLE IF NOT EXISTS display_name_overrides (
  target_type TEXT NOT NULL CHECK(target_type IN ('entity','race','venue','pedigree')),
  target_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 220),
  original_name TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (target_type,target_id)
);
CREATE INDEX IF NOT EXISTS idx_name_overrides_name ON display_name_overrides (target_type,name);
CREATE TABLE IF NOT EXISTS name_edit_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  old_display_name TEXT NOT NULL,
  new_display_name TEXT NOT NULL,
  source_name TEXT NOT NULL,
  editor_email TEXT NOT NULL,
  edited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_name_edit_audit_target ON name_edit_audit (target_type,target_id,edited_at);
