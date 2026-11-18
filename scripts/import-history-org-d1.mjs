/** WTW production organization history import gate.
 * BEFORE and AFTER only SELECT the existing WTW D1 and hash protected tables.
 * Does NOT run any SQL writes itself. A workflow performs precisely the two
 * reviewed wrangler SQL files between preflight and verify, after saving backup.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
const mode=process.argv[2];
if(!['before','after'].includes(mode))throw Error('Usage: import-history-org-d1.mjs before|after');
const account=process.env.CLOUDFLARE_ACCOUNT_ID||'',token=process.env.CLOUDFLARE_API_TOKEN||'',uuid=process.env.WTW_D1_UUID||'';
if(!/^[0-9a-f]{32}$/i.test(account)||!/^[0-9a-f-]{36}$/i.test(uuid)||!token)throw Error('WTW D1 target not verified');
const endpoint=`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${uuid}/query`;
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const snapshot=JSON.parse(fs.readFileSync('data/history-source/canon-registry-2026-11-10/organization-economic-history.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('generated/private-d1-org-history/history-org-manifest.json','utf8'));
const sql=fs.readFileSync('generated/private-d1-org-history/30_history_org_profiles.sql','utf8');
if(snapshot.rows.length!==108 || manifest.counts.organizations!==108 ||
   manifest.counts.approved_origin_publications!==10 || manifest.counts.identity_only_origin_redactions!==98 ||
   manifest.source.spreadsheet_id!=='1Lhpe6DG1foQ2-zayQBg4bKpTtu4MP_itpM1zo2GRSEA' ||
   manifest.source.sheet_id!==122436628)
 throw Error('Unauthorized source/approval mix');
const inserts=sql.split('\n').filter(l=>l.startsWith('INSERT INTO '));
if(inserts.length!==109||inserts.filter(x=>x.startsWith('INSERT INTO wtw_history_org_profiles ')).length!==108 ||
   inserts.some(x=>!/^INSERT INTO (wtw_history_org_profiles|wtw_history_org_import_manifest) \(/.test(x)))
 throw Error('SQL file contains unreviewed write targets');
const query=async(sql)=>{
 if(!/^SELECT\s/i.test(sql))throw Error('Only read-only SELECT allowed in verification script');
 const response=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({sql})});
 if(!response.ok)throw Error('WTW D1 readback HTTP '+response.status);
 const data=await response.json(),res=data?.result?.[0];
 if(!data.success||!res?.success||!Array.isArray(res.results))throw Error('WTW D1 query failed');
 return res.results;
};
async function table(name){
 const found=await query(`SELECT name FROM sqlite_master WHERE type='table' AND name='${name}'`);
 return found.length>0;
}
async function scan(table,order,columns='*',perPage=250){
 const results=[];
 for(let i=0;i<30000;i+=perPage){
  const chunk=await query(`SELECT ${columns} FROM ${table} ORDER BY ${order} LIMIT ${perPage} OFFSET ${i}`);
  results.push(...chunk);
  if(chunk.length<perPage)return results;
 }
 throw Error('D1 table exceeded safe scan bound '+table);
}
const protectedReads=[
 ['races','id','id,name,year,date,track_name,status',5370],
 ['results','edition_id,position','edition_id,position,horse_id',15561],
 ['entities','id', '*',null],
 ['display_name_overrides','target_type,target_id','*',null],
 ['name_edit_audit','id','*',null],
 ['change_requests','id','*',null],
 ['change_audit','id','*',null]
];
const protectedState={};
for(const [name,order,columns,expected] of protectedReads){
 if(!await table(name))throw Error('Missing protected original D1 table '+name);
 const rows=await scan(name,order,columns);
 if(expected!==null&&rows.length!==expected)throw Error('History D1 guard failed: '+name+' has '+rows.length+' instead of '+expected);
 protectedState[name]={rows:rows.length,sha256:hash(rows)};
}
const dir='generated/private-d1-org-history';
fs.mkdirSync(dir,{recursive:true});
const original=await table('wtw_history_org_profiles')?await scan('wtw_history_org_profiles','organization_id'):[];
const oldManifest=await table('wtw_history_org_import_manifest')?await scan('wtw_history_org_import_manifest','source_sha256'):[];
const cols=snapshot.headers;
const expected=new Map(snapshot.rows.map(arr=>[arr[0],Object.fromEntries(cols.map((key,i)=>[key,String(arr[i]??'')]))]));
if(expected.size!==108)throw Error('Source duplicate Org IDs');
const manifestSha=manifest.source.sha256;
if(mode==='before'){
 if(original.length && (original.length!==108||original.some(x=>x.source_sha256!==manifestSha)))
  throw Error('Existing D1 organization records contain a different source; requires manual reconciliation, do not overwrite');
 const baseline={kind:'WTW_ORG_IMPORT_PRIVATE_ROLLBACK_PREIMAGE',source_sha256:manifestSha,
  protected:protectedState,prior_organization_rows:original,prior_import_manifests:oldManifest,
  target_database:'wtw-canon-desk-db',captured_at:new Date().toISOString()};
 fs.writeFileSync(dir+'/wtw-protected-baseline.json',JSON.stringify(baseline,null,2)+'\n',{mode:0o600});
 // No DELETE on source data; rollback only the newly generated projection rows.
 const q=s=>"'"+String(s).replaceAll("'","''")+"'";
 const restore=(table,rows)=>rows.map(row=>{
  const keys=Object.keys(row);
  return 'INSERT OR REPLACE INTO '+table+' ('+keys.join(',')+') VALUES ('+keys.map(k=>row[k]===null?'NULL':q(row[k])).join(',')+');';
 });
 const rollback=[
  '-- WTW historical website projection rollback ONLY; never touches racing/person/name source.',
  'DELETE FROM wtw_history_org_profiles WHERE source_sha256='+q(manifestSha)+';',
  'DELETE FROM wtw_history_org_import_manifest WHERE source_sha256='+q(manifestSha)+';',
  ...restore('wtw_history_org_profiles',original),
  ...restore('wtw_history_org_import_manifest',oldManifest)
 ];
 fs.writeFileSync(dir+'/wtw-org-projection-rollback.sql',rollback.join('\n')+'\n',{mode:0o600});
 console.log(JSON.stringify({mode,baseline:'saved private backup',protected_table_counts:Object.fromEntries(Object.entries(protectedState).map(([k,v])=>[k,v.rows])),prior_org_rows:original.length,source_records:108,approved:10,identity_only:98}));
}else{
 const b=JSON.parse(fs.readFileSync(dir+'/wtw-protected-baseline.json','utf8'));
 if(b.source_sha256!==manifestSha||b.target_database!=='wtw-canon-desk-db')throw Error('Wrong baseline');
 for(const [k,a] of Object.entries(b.protected)){
  const z=protectedState[k];
  if(z?.rows!==a.rows || z?.sha256!==a.sha256)
   throw Error('Protected original D1 table changed during organization import: '+k+'; investigate, do not modify');
 }
 const list=await scan('wtw_history_org_profiles','organization_id');
 if(list.length!==108||new Set(list.map(z=>z.organization_id)).size!==108)
  throw Error('Organization D1 projection row count/unique ID mismatch');
 let approved=0,withYearEvidence=0;
 const string=x=>String(x??'');
 for(const x of list){
  const row=expected.get(x.organization_id);if(!row)throw Error('Unrecognized inserted org ID '+x.organization_id);
  if(x.canonical_name!==row.Canonical_Name||x.canonical_geography!==row.Canon_Geographic_Base||
    x.source_sha256!==manifestSha||x.source_spreadsheet_id!==manifest.source.spreadsheet_id||
    String(x.source_sheet_id)!=='122436628')throw Error('Org source lineage changed '+x.organization_id);
  if(string(x.historical_year_links).startsWith('YEAR_LEVEL'))withYearEvidence++;
  const yes=['EXISTING_APPROVED_SOURCE','USER_APPROVED_DIRECTION_ONLY'].includes(x.publication_tier);
  if(yes){approved++;if(!x.origin_through_1998)throw Error('Approved history missing '+x.organization_id);}
  else{
   for(const field of ['origin_through_1998','founded_year_source','historical_prestige','momentum_1990s',
     'commercial_appeal','peer_reputation','financial_vulnerability','liquidity_profile_source',
     'capital_class_source','approved_connections','stakes_bloodline_anchor','continuity_constraints']){
     if(x[field])throw Error('Unapproved economic/backstory leaked '+x.organization_id+' field '+field);
   }
  }
 }
 if(approved!==10||withYearEvidence!==99)throw Error('Approval/year-source count mismatch '+approved+'/'+withYearEvidence);
 const manifestRows=await scan('wtw_history_org_import_manifest','source_sha256');
 if(!manifestRows.find(x=>x.source_sha256===manifestSha&&x.record_count===108))
  throw Error('Source import-manifest link missing');
 const summary={status:'VERIFIED',record_count:list.length,approved_histories:approved,redacted_identity_only:list.length-approved,
   historical_association_rows:withYearEvidence,source_sha256:manifestSha,protected_original_tables_unchanged:true,
   rollback_file:'wtw-org-projection-rollback.sql',imported_at:new Date().toISOString()};
 fs.writeFileSync(dir+'/wtw-org-projection-verified.json',JSON.stringify(summary,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify(summary));
}
