/**
 * WTW historical website D1 verification, READ ONLY.
 * Compares actual stored D1 IDs/results against the repository's versioned
 * E-source export. It NEVER applies a source change or mutates D1.
 * Readback is evidence, NOT v3.84 source approval or automatic site promotion.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
const NAME='wtw-canon-desk-db';
const ACCOUNT=process.env.CLOUDFLARE_ACCOUNT_ID||'';
const TOKEN=process.env.CLOUDFLARE_API_TOKEN||'';
const UUID=process.env.WTW_D1_UUID||'';
if(!/^[0-9a-f]{32}$/i.test(ACCOUNT)||!/^[0-9a-f-]{36}$/i.test(UUID)||!TOKEN)
  throw Error('Missing verified WTW readback target credentials');
const endpoint=`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${UUID}/query`;
const srcFile='data/history-source/2026-11-07/stakes-editions.json';
const bytes=fs.readFileSync(srcFile);
const source=JSON.parse(bytes.toString('utf8'));
if(source.spreadsheet_id!=='1H-iCZPYAVfVp3zBgJLGAAhh2YXtZ_Z1Oo8ETsegC51M' ||
   !Array.isArray(source.rows)||source.rows.length!==5370)
  throw Error('Source changed: manual review required');
const heads=source.headers;
for(const col of ['Race_Edition_ID','Race_Name','Race_Year','Race_Date','Track_Name','Canon_Status','Winner_Horse_ID','Second_Horse_ID','Third_Horse_ID'])
  if(!heads.includes(col))throw Error('Missing source field '+col);
const normalize=x=>String(x??'');
const sourceRaces=new Map(),sourceResults=new Map();
for(const values of source.rows){
  const row=Object.fromEntries(heads.map((k,i)=>[k,normalize(values[i])]));
  const id=row.Race_Edition_ID;
  if(!/^([A-Z]+-)?[A-Z0-9-]+$/.test(id)||sourceRaces.has(id))
    throw Error('Invalid/duplicate source edition '+id);
  sourceRaces.set(id,{
    id,name:row.Race_Name,year:normalize(Number(row.Race_Year)),
    date:row.Race_Date,track_name:row.Track_Name,
    status:row.Canon_Status||'SOURCE_SNAPSHOT'
  });
  for(const [position,field] of [[1,'Winner_Horse_ID'],[2,'Second_Horse_ID'],[3,'Third_Horse_ID']]){
    if(!row[field])continue;
    const k=id+'::'+position;
    if(sourceResults.has(k))throw Error('Duplicate source result '+k);
    sourceResults.set(k,{edition_id:id,position:String(position),horse_id:row[field]});
  }
}
const qaList=JSON.parse(fs.readFileSync('data/history-audit/qa-pending-v384-inactive-edition-ids.json','utf8'));
if(qaList.authority.source_status!=='V3.84_QA_PENDING'||
   qaList.excluded.length!==223 ||
   new Set(qaList.excluded.map(x=>x.edition_id)).size!==223)
  throw Error('Quarantine source list mismatch');
const hold=new Set(qaList.excluded.map(x=>x.edition_id));
for(const id of hold){
  if(!sourceRaces.has(id))throw Error('Held edition not in E export: '+id);
}
const query=async(sql)=>{
  if(!/^SELECT\s/i.test(sql))throw Error('Only read-only SELECT allowed');
  const res=await fetch(endpoint,{method:'POST',headers:{
    Authorization:`Bearer ${TOKEN}`,'Content-Type':'application/json'
  },body:JSON.stringify({sql})});
  if(!res.ok)throw Error(`WTW D1 readback HTTP ${res.status}`);
  const payload=await res.json();
  const result=payload?.result?.[0];
  if(!payload.success||!result?.success||!Array.isArray(result.results))
    throw Error('WTW D1 query was not successful');
  return result.results;
};
async function scan(table,columns,order,limit=250){
  if(!(['races','results'].includes(table)))throw Error('Invalid D1 table');
  const all=[];
  for(let offset=0;offset<30000;offset+=limit){
    const got=await query(`SELECT ${columns} FROM ${table} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`);
    all.push(...got);
    if(got.length<limit)return all;
  }
  throw Error('Exceeded D1 pagination bound');
}
const [races,results]=await Promise.all([
  scan('races','id,name,year,date,track_name,status','id'),
  scan('results','edition_id,position,horse_id','edition_id,position')
]);
const keysR=['name','year','date','track_name','status'];
const keysP=['horse_id'];
const compare=(expected,actual,idGetter,keys)=>{
  const actualMap=new Map();
  for(const x of actual){
    const id=idGetter(x);
    if(actualMap.has(id))throw Error('Duplicate D1 ID '+id);
    actualMap.set(id,x);
  }
  const diffs=[],missing=[],extra=[],counts={};
  for(const [id,row] of expected){
    const found=actualMap.get(id);
    if(!found){missing.push(id);continue;}
    const changed={};
    for(const k of keys)if(normalize(row[k])!==normalize(found[k])){
      changed[k]=[row[k],normalize(found[k])];
      counts[k]=(counts[k]||0)+1;
    }
    if(Object.keys(changed).length)diffs.push({id,fields:changed});
  }
  for(const id of actualMap.keys())if(!expected.has(id))extra.push(id);
  return {expected:expected.size,observed:actual.length,matching:expected.size-missing.length-diffs.length,
    differing:diffs.length,missing:missing.length,extra:extra.length,
    differences_by_field:counts,examples:diffs.slice(0,25),
    missing_examples:missing.slice(0,25),extra_examples:extra.slice(0,25)};
};
const raceDelta=compare(sourceRaces,races,x=>x.id,keysR);
const resultDelta=compare(sourceResults,results,x=>x.edition_id+'::'+x.position,keysP);
const visible=rows=>rows.filter(r=>!hold.has(r.id)&&!normalize(r.status).startsWith('QUARANTINED'));
const visibleOld=visible(races);
const visibleIDs=new Set(visibleOld.map(x=>x.id));
const activeResults=results.filter(r=>visibleIDs.has(r.edition_id));
const statusByID=new Map(races.map(x=>[x.id,x.status]));
const heldStaleActive=[...hold].filter(x=>statusByID.has(x)&&!normalize(statusByID.get(x)).startsWith('QUARANTINED'));
const qaSourceQuarantined=[...hold].filter(x=>sourceRaces.get(x)?.status?.startsWith('QUARANTINED'));
const auxiliary={};
for(const table of ['display_name_overrides','name_edit_audit','change_requests','change_audit','wtw_history_org_profiles']){
  try{
    const a=await query(`SELECT count(*) AS n FROM ${table}`);
    auxiliary[table]=Number(a[0]?.n||0);
  }catch(e){
    if(table==='wtw_history_org_profiles')auxiliary[table]='NOT_CREATED_OR_UNREADABLE';
    else throw e;
  }
}
const report={
  kind:'WTW_READONLY_D1_HISTORY_PARITY_AUDIT_NOT_A_CANON_MASTER',
  audited_at:new Date().toISOString(),
  database_name:NAME,
  source_e_export:{path:srcFile,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
    source_workbook_id:source.spreadsheet_id,snapshot_label:source.snapshot_version||''},
  d1_source_of_truth:'Cloudflare D1 website readmodel only',
  qa_pending_authority:'Drive E/W/M v3.84; 223 excluded IDs; race corrections NOT PROMOTED BY THIS AUDIT',
  races:raceDelta,results:resultDelta,
  quarantined:{hold_list_count:hold.size,
    hold_ids_still_active_in_d1:heldStaleActive.length,
    examples:heldStaleActive.slice(0,25),
    source_export_quarantined_of_223:qaSourceQuarantined.length,
    read_model_visible_races:visibleOld.length,
    read_model_visible_results:activeResults.length},
  auxiliary_table_counts:auxiliary,
  proof_of_no_changes:'ALL QUERIES SELECT ONLY; no D1 edits, migrations, imports or name override writes'
};
fs.mkdirSync('generated/private-d1-readbacks',{recursive:true});
fs.writeFileSync('generated/private-d1-readbacks/history-d1-parity.json',JSON.stringify(report,null,2)+'\n');
const brief=[
  '# WTW History D1 readback (read-only)',
  'Source E export (staged) compared against remote WTW-only D1 by permanent ID.',
  `Races: ${raceDelta.observed}/${raceDelta.expected}; changed ${raceDelta.differing}; missing ${raceDelta.missing}; extra ${raceDelta.extra}`,
  `Results: ${resultDelta.observed}/${resultDelta.expected}; changed ${resultDelta.differing}; missing ${resultDelta.missing}; extra ${resultDelta.extra}`,
  `Drive QA holds in stale ACTIVE D1: ${heldStaleActive.length}/${hold.size}`,
  `Read-model visible: ${visibleOld.length} races; ${activeResults.length} placements`,
  `Display name overlays: ${auxiliary.display_name_overrides}; change requests: ${auxiliary.change_requests}`,
  'No writes. Result/date updates require separate reviewed source approval.'
].join('\n');
console.log(brief);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,brief+'\n');
if(raceDelta.missing||raceDelta.extra||resultDelta.missing||resultDelta.extra)
  console.log('WARNING: D1 identity-set mismatch; no automatic repairs.');
