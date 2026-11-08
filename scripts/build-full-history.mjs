/**
 * Offline WTW historical import compiler.
 * Reads the private source exports under data/history-source/; never writes to public/.
 * Generates D1 SQL under generated/private-d1/ only. Does not touch source Sheets.
 * Horse IDs / Person IDs / Race edition IDs are preserved verbatim.
 * Race results are INSERT OR IGNORE: result changes require separate canon governance.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourceRoot=process.env.WTW_SOURCE_DIR || path.join(root,'data/history-source/2026-11-07');
const outRoot=process.env.WTW_OUTPUT_DIR || path.join(root,'generated/private-d1');
const names={
  H:'horse-master',S:'horse-seasons',E:'stakes-editions',P:'pedigree-edges',B:'bloodlines'
};
const sourceMap={};
const sourceChecksums={};
for(const [key,name] of Object.entries(names)){
  const bytes=fs.readFileSync(path.join(sourceRoot,`${name}.json`));
  sourceChecksums[name]=crypto.createHash('sha256').update(bytes).digest('hex');
  const file=JSON.parse(bytes.toString('utf8'));
  if(!Array.isArray(file.headers)||!Array.isArray(file.rows))throw Error(`Invalid source ${name}`);
  const headers=new Set(file.headers);
  for(const mandatory of ({H:['Horse_ID','Registered_Name'],S:['Horse_ID','Race_Year'],E:['Race_Edition_ID','Race_Year'],P:['Parent_ID','Child_ID'],B:['Horse_ID']}[key])){
    if(!headers.has(mandatory))throw Error(`${name}: missing ${mandatory}`);
  }
  const entries=file.rows.filter(a=>Array.isArray(a)&&a[0]).map(a=>Object.fromEntries(file.headers.map((key,i)=>[key,a[i]??null])));
  sourceMap[key]=entries;
}
const [H,S,E,P,B]=Object.keys(names).map(k=>sourceMap[k]);
const q=v=>v===undefined||v===null||v===''?'NULL':typeof v==='number'&&Number.isFinite(v)?String(v):`'${String(v).replaceAll("'","''")}'`;
const num=x=>x===null||x===undefined||x===''||!Number.isFinite(Number(x))?null:Number(x);
const compact=x=>JSON.stringify(x);
const entities=new Map(),races=new Map(),connections=new Map(),results=new Map();
const horseDetails=new Map(),horseSeasons=new Map(),editionDetails=new Map(),pedigree=new Map(),bloodlines=new Map();
const issues=[];
const issue=(code,identity,detail)=>{issues.push({code,identity,detail})};
function addEntity(e){
  if(!e.id) return;
  const existing=entities.get(e.id);
  if(existing){
    if(existing.name!==e.name && e.name)issue('ENTITY_ALIAS_DIFFERENCE',e.id,`${existing.name} vs ${e.name}`);
    return;
  }
  entities.set(e.id,e);
}
function horse(id,name,why){
  if(!id)return;
  if(!entities.has(id)){
    addEntity({id,kind:'horse',name:name||`Unresolved horse (${id})`,foal_year:null,sex:null,role:null,
      summary:`Source-only horse reference from ${why}; not independently certified`,status:'SOURCE_REFERENCE_ONLY',source:why});
    issue('MISSING_HORSE_MASTER',id,why);
  }
}
for(const x of H){
  const id=String(x.Horse_ID),name=String(x.Registered_Name||'').trim();
  if(!id||!name)throw Error(`Horse identity incomplete ${id}`);
  if(entities.has(id))throw Error(`Duplicate Horse_ID in H: ${id}`);
  addEntity({id,kind:'horse',name,foal_year:num(x.Foal_Year),sex:x.Sex,role:null,
    summary:[x.Canon_Role,x.NA_Stakes_Wins?`${x.NA_Stakes_Wins} stakes wins`:null].filter(Boolean).join(' · '),
    status:x.Canon_Status||'SOURCE_SNAPSHOT',source:'H: historical horse master'});
  horseDetails.set(id,{horse_id:id,sire_id:x.Sire_ID,dam_id:x.Dam_ID,canon_role:x.Canon_Role,raw_json:compact(x)});
}
for(const x of S){
  const id=String(x.Horse_ID),year=num(x.Race_Year);
  if(!year)throw Error(`Season year missing: ${id}`);
  horse(id,x.Horse_Name,'S: horse-season summary');
  if(entities.get(id)?.name!==x.Horse_Name) issue('HORSE_SEASON_NAME_DIFFERS',`${id}/${year}`,`${x.Horse_Name} vs canonical ${entities.get(id)?.name}`);
  const key=`${id}/${year}`;
  if(horseSeasons.has(key))throw Error(`Duplicate horse season ${key}`);
  horseSeasons.set(key,{horse_id:id,year,owner_id:x.Owner_ID,trainer_id:x.Trainer_ID,jockey_id:x.Jockey_ID,
    breeder_id:x.Breeder_ID,stakes_wins:num(x.Stakes_Wins),top3_starts:num(x.Top3_Starts),
    season_score:num(x.Season_Score),region:x.Primary_Region,raw_json:compact(x)});
  for(const [role,partyIdField,partyNameField,kind] of [
    ['OWNER','Owner_ID','Owner_Name','organization'],['TRAINER','Trainer_ID','Trainer_Name','person'],
    ['JOCKEY','Jockey_ID','Jockey_Name','person'],['BREEDER','Breeder_ID','Breeder_Name','organization']
  ]){
    const partyId=x[partyIdField],partyName=x[partyNameField];
    if(!partyId)continue;
    addEntity({id:partyId,kind,name:partyName||`Unresolved ${role.toLowerCase()} (${partyId})`,
      foal_year:null,sex:null,role,summary:`Historical ${role.toLowerCase()} connection; year-level evidence`,
      status:'SOURCE_SEASON_LINK',source:'S: horse-season summary'});
    const cid=`HS:${id}:${year}:${role}`;
    connections.set(cid,{id:cid,horse_id:id,party_id:partyId,year,role,basis:'HORSE_SEASON_SOURCE'});
  }
}
for(const x of E){
  const id=String(x.Race_Edition_ID),year=num(x.Race_Year);
  if(races.has(id))throw Error(`Duplicate Race_Edition_ID ${id}`);
  if(!year)throw Error(`Race has no year ${id}`);
  races.set(id,{id,name:x.Race_Name,year,date:x.Race_Date,track_name:x.Track_Name,
    status:x.Canon_Status||'SOURCE_SNAPSHOT',source:'E: stakes edition detail'});
  if(x.Track_ID)addEntity({id:x.Track_ID,kind:'track',name:x.Track_Name||`Unresolved track (${x.Track_ID})`,foal_year:null,
    sex:null,role:'TRACK',summary:'Historical racecourse or track ID',status:'SOURCE_EDITION_LINK',source:'E: stakes edition detail'});
  editionDetails.set(id,{edition_id:id,track_id:x.Track_ID,surface:x.Surface,distance_f:num(x.Distance_F),
    field_size:num(x.Field_Size),race_date_basis:x.Race_Date_Basis,raw_json:compact(x)});
  for(const [position,idField,nameField] of [[1,'Winner_Horse_ID','Winner_Name'],[2,'Second_Horse_ID','Second_Name'],[3,'Third_Horse_ID','Third_Name']]){
    const horseId=x[idField];if(!horseId)continue;
    horse(horseId,x[nameField],'E: placed horse in stakes edition');
    if(entities.get(horseId)?.name!==x[nameField])issue('STAKES_DISPLAY_NAME_DIFFERS',`${id}/${position}`,`${x[nameField]} vs canonical ${entities.get(horseId)?.name}`);
    results.set(`${id}::${position}`,{edition_id:id,horse_id:horseId,position});
  }
}
for(const [index,x] of P.entries()){
  if(!x.Parent_ID||!x.Child_ID||!x.Relation)continue;
  const key=x.Edge_Key||`EDGE:${x.Parent_ID}:${x.Child_ID}:${x.Relation}`;
  if(pedigree.has(key))throw Error(`Duplicate pedigree edge ${key}`);
  pedigree.set(key,{edge_key:key,parent_id:x.Parent_ID,child_id:x.Child_ID,relation:x.Relation,
    parent_name:x.Parent_Name,child_name:x.Child_Name,biology_check:x.Biology_Check,raw_json:compact(x)});
  if(!entities.has(x.Parent_ID)||!entities.has(x.Child_ID))issue('PEDIGREE_REFERENCES_OUTSIDE_H',key,'Edge retained with original identifiers');
}
for(const x of B){
  if(!x.Horse_ID)continue;
  if(bloodlines.has(x.Horse_ID))throw Error(`Duplicate bloodline horse ${x.Horse_ID}`);
  if(!entities.has(x.Horse_ID))horse(x.Horse_ID,x.Horse_Name,'B: bloodline profile');
  bloodlines.set(x.Horse_ID,{horse_id:x.Horse_ID,raw_json:compact(x)});
}
// Integrity: no assumptions about race-day trainer assignments; S connections remain HORSE_SEASON_SOURCE.
const rows={entities:[...entities.values()],races:[...races.values()],connections:[...connections.values()],results:[...results.values()],
  horse_details:[...horseDetails.values()],horse_seasons:[...horseSeasons.values()],edition_details:[...editionDetails.values()],
  pedigree_edges:[...pedigree.values()],bloodline_profiles:[...bloodlines.values()]};
const stages=[
  ['01_entities','entities',['id','kind','name','foal_year','sex','role','summary','status','source']],
  ['02_races','races',['id','name','year','date','track_name','status','source']],
  ['03_horse_details','horse_details',['horse_id','sire_id','dam_id','canon_role','raw_json']],
  ['04_horse_seasons','horse_seasons',['horse_id','year','owner_id','trainer_id','jockey_id','breeder_id','stakes_wins','top3_starts','season_score','region','raw_json']],
  ['05_connections','connections',['id','horse_id','party_id','year','role','basis']],
  ['06_edition_details','edition_details',['edition_id','track_id','surface','distance_f','field_size','race_date_basis','raw_json']],
  ['07_results','results',['edition_id','horse_id','position']],
  ['08_pedigree_edges','pedigree_edges',['edge_key','parent_id','child_id','relation','parent_name','child_name','biology_check','raw_json']],
  ['09_bloodline_profiles','bloodline_profiles',['horse_id','raw_json']]
];
function sqlStatement(table,cols,r){
  const vals=cols.map(c=>q(r[c])).join(', ');
  // Preserve existing race placings until an explicit historical promotion is authorized.
  if(table==='results')return `INSERT OR IGNORE INTO ${table} (${cols.join(',')}) VALUES (${vals});`;
  const keys={entities:['id'],races:['id'],horse_details:['horse_id'],horse_seasons:['horse_id','year'],connections:['id'],edition_details:['edition_id'],pedigree_edges:['edge_key'],bloodline_profiles:['horse_id']}[table];
  const updates=cols.filter(c=>!keys.includes(c)).map(c=>`${c}=excluded.${c}`).join(', ');
  return `INSERT INTO ${table} (${cols.join(',')}) VALUES (${vals}) ON CONFLICT (${keys.join(',')}) DO UPDATE SET ${updates};`;
}
fs.mkdirSync(outRoot,{recursive:true});
let fileCount=0;
for(const [prefix,table,cols] of stages){
  const records=rows[table],size=250;
  for(let i=0;i<records.length;i+=size){
    const statements=records.slice(i,i+size).map(r=>sqlStatement(table,cols,r));
    const filename=`${prefix}_${String(Math.floor(i/size)+1).padStart(3,'0')}.sql`;
    fs.writeFileSync(path.join(outRoot,filename),['-- WTW source-preserving private D1 import; safe, retryable upserts','BEGIN TRANSACTION;',...statements,'COMMIT;',''].join('\n'));
    fileCount++;
  }
}
const digest=crypto.createHash('sha256').update(Object.values(sourceChecksums).join('|')).digest('hex');
const logSql=[
  '-- WTW historical source ledger; staged private master import',
  `INSERT INTO source_imports (id,source_label,source_sha256,scope,note) VALUES ('full_history_2026_11_07','WTW H/S/E/P/B source snapshots',${q(digest)},'Historical horse and stakes records to 1998','Not GOLD-certified. Results changes require separate approval.') ON CONFLICT(id) DO UPDATE SET source_sha256=excluded.source_sha256,imported_at=CURRENT_TIMESTAMP,note=excluded.note;`,
  ''
].join('\n');
fs.writeFileSync(path.join(outRoot,'10_source_import.sql'),logSql);fileCount++;

const editionYears=E.map(x=>num(x.Race_Year)).filter(Number.isFinite),seasonYears=S.map(x=>num(x.Race_Year)).filter(Number.isFinite);
const manifest={version:'WTW-CANON-PRIVATE-HISTORY-2026-11-07',sourceChecksums,digest,origin:{E:'historical stakes edition working ledger: QA PENDING',H:'horse master working',S:'horse seasons working',P:'pedigree edges working',B:'bloodlines working'},
  inputCounts:{horses:H.length,seasons:S.length,stakesEditions:E.length,pedigreeEdges:P.length,bloodlines:B.length},
  outputCounts:Object.fromEntries(Object.entries(rows).map(([k,v])=>[k,v.length])),
  yearCoverage:{stakes:[Math.min(...editionYears),Math.max(...editionYears)],horseSeasons:[Math.min(...seasonYears),Math.max(...seasonYears)]},
  issuesByCode:Object.fromEntries([...new Set(issues.map(i=>i.code))].map(code=>[code,issues.filter(i=>i.code===code).length])),
  issueSample:issues.slice(0,100),sqlFiles:fileCount,
  note:'Snapshot is NOT GOLD certified; source claims are not silently resolved. Approved edit proposals never rewrite source data.'};
fs.writeFileSync(path.join(outRoot,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({outRoot,manifest:{...manifest,issueSample:undefined,sourceChecksums:undefined}},null,2));