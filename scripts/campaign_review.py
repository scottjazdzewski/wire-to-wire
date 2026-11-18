#!/usr/bin/env python3
"""Flag questionable campaign routes in a Master_Stakes_Calendar CSV export.

The CSV must contain the original 31 columns, in their original order. Findings
are leads for review, not evidence that a historic date or result is wrong.
Only recorded first-, second-, and third-place links are visible in this file.
"""
import argparse
import csv
import datetime as dt
import json
from collections import defaultdict


def review(path):
    horses = defaultdict(list)
    with open(path, encoding='utf-8-sig', newline='') as handle:
        for row in csv.reader(handle):
            if len(row) < 31 or row[29].strip().upper() != 'YES':
                continue
            try:
                date = dt.date.fromisoformat(row[4].strip())
            except ValueError:
                continue
            for index in (18, 20, 22):
                horse = row[index].strip()
                if horse:
                    horses[horse].append({'edition': row[0], 'race': row[2],
                        'date': date, 'track': row[6], 'circuit': row[27],
                        'basis': row[25], 'horse_name': row[index + 1]})
    flags = []
    for horse, races in horses.items():
        races.sort(key=lambda r: (r['date'], r['edition']))
        def add(kind, group):
            flags.append({'kind': kind, 'horse_id': horse,
                'horse_name': group[0]['horse_name'], 'races': [
                    {**r, 'date': r['date'].isoformat()} for r in group]})
        for first, second in zip(races, races[1:]):
            days = (second['date'] - first['date']).days
            if days == 0 and first['track'] != second['track']:
                add('same_day_different_tracks', [first, second])
            elif 0 < days <= 7 and first['circuit'] and second['circuit'] and first['circuit'] != second['circuit']:
                add('one_week_different_circuits', [first, second])
        # Distinct editions, six recorded placings in 49 days across 3 circuits.
        # Overlapping windows are intentionally consolidated to one lead per horse.
        for start in range(len(races)):
            window = [r for r in races[start:] if (r['date'] - races[start]['date']).days <= 49]
            circuits = {r['circuit'] for r in window if r['circuit']}
            if len({r['edition'] for r in window}) >= 6 and len(circuits) >= 3:
                add('dense_multi_circuit_campaign', window)
                break
    return {'horses_reviewed': len(horses), 'findings': flags}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv_path', help='Master_Stakes_Calendar CSV export')
    parser.add_argument('--output', help='Write JSON findings to this file')
    args = parser.parse_args()
    result = json.dumps(review(args.csv_path), indent=2)
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as handle:
            handle.write(result + '\n')
    else:
        print(result)
