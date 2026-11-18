import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../', import.meta.url);
const dataFile=new URL('../data/sample-history.json', import.meta.url);
const source=fs.readFileSync(dataFile);
const data=JSON.parse(source.toString('utf8'));
const sha=crypto.createHash('sha256').update(source).digest('hex');
const quote=v=>v==null?'NULL':typeof v==='number'?String(v):`'${String(v).replaceAll("'","''")}'`;
const rows=(table,cols,entries)=>entries.map(row=>`INSERT OR IGNORE INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(c=>quote(row[c])).join(', ')});`);
const out=[
  '-- WIRE TO WIRE: CURATED TEST DATA ONLY. NOT FULL HISTORICAL CANON.',
  '-- Seed into a SEPARATE WTW D1 database; never deploy to existing projects.',
  'BEGIN TRANSACTION;',
  ...rows('entities',['id','kind','name','foal_year','sex','role','summary','status'],data.entities.map(e=>({...e,status:e.status||'SOURCE_SNAPSHOT'}))),
  ...rows('races',['id','name','year','date','track_name','status','source'],data.races),
  ...rows('connections',['id','horse_id','party_id','year','role','basis'],data.connections),
  ...rows('results',['edition_id','horse_id','position'],data.results),
  `INSERT OR IGNORE INTO source_imports(id,source_label,source_sha256,scope,note) VALUES ('sample_1953_1955', 'WTW historical source curated test import', '${sha}', '1953-1955 curated records', 'NOT the full historical master; imported for interface acceptance testing');`,
  'COMMIT;'
].join('\n')+'\n';
fs.writeFileSync(new URL('../data/seed.sql',import.meta.url),out);
console.log(`Seed generated: ${data.entities.length} entities, ${data.races.length} races, ${data.connections.length} season connections, ${data.results.length} results; sha ${sha.slice(0,12)}.`);