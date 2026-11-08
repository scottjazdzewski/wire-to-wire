"""Verify every private historical import SQL file against SQLite before D1 deployment.
No production credentials. Source spreadsheets and existing WTW masters are untouched.
"""
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'generated/private-d1'
manifest = json.loads((SRC / 'manifest.json').read_text())
files = sorted(SRC.glob('*.sql'))
assert files, 'No generated SQL to verify'
conn = sqlite3.connect(':memory:')
conn.executescript((ROOT / 'migrations/0001_initial.sql').read_text())
conn.executescript((ROOT / 'migrations/0002_full_history.sql').read_text())
for file in files:
    try:
        conn.executescript(file.read_text())
    except sqlite3.Error as exc:
        raise RuntimeError(f'Invalid historical import SQL in {file.name}: {exc}') from exc
for table, expected in manifest['outputCounts'].items():
    count = conn.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]
    assert count == expected, f'{table}: got {count}, expected {expected}'
errors = conn.execute('PRAGMA foreign_key_check').fetchall()
assert not errors, f'Foreign key failures: {errors[:20]}'
for ident, name in [
    ('H-1950-008016', 'Double Duty'),
    ('H-1950-008023', 'Northbound Train'),
    ('H-1950-008019', 'Miss Meridian'),
    ('H-1949-008014', 'Bramble'),
]:
    record=conn.execute('SELECT name FROM entities WHERE id=?', (ident,)).fetchone()
    assert record and record[0]==name, f'User-approved horse name drifted: {ident}'
for yr in (1864, 1953, 1954, 1955, 1998):
    n=conn.execute('SELECT count(*) FROM races WHERE year=?',(yr,)).fetchone()[0]
    assert n>0, f'No edition history for {yr}'
print('WTW HISTORY SQL VERIFIED: ' + json.dumps({
    'tables': manifest['outputCounts'],
    'years': manifest['yearCoverage'],
    'foreign_keys': 'PASS',
    'user_approved_names': 'PASS',
},sort_keys=True))