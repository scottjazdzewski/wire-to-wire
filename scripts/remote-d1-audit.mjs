/**
 * Remote D1 preflight / post-import audit.
 * Read-only SELECTs using the WTW-only database UUID discovered by prepare-d1-target.
 */
import fs from 'node:fs';
const NAME='wtw-canon-desk-db';
const ACCOUNT=process.env.CLOUDFLARE_ACCOUNT_ID||'';
const TOKEN=process.env.CLOUDFLARE_API_TOKEN||'';
const uuid=process.env.WTW_D1_UUID||'';
const mode=process.argv[2];
if(!['preflight','verify'].includes(mode))throw Error('Expected preflight or verify');
if(!/^[0-9a-f]{32}$/i.test(ACCOUNT)||!/^[0-9a-f-]{36}$/i.test(uuid)||!TOKEN)
  throw Error('Missing verified WTW D1 authentication or target ID');
const url=`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${uuid}/query`;
async function one(sql){
 const r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({sql})});
 if(!r.ok)throw Error(`WTW read-only query failed with HTTP ${r.status}`);
 const data=await r.json();
 const first=data?.result?.[0];
 if(!data.success||!first?.success||!Array.isArray(first.results))
   throw Error('WTW D1 read-only query did not succeed');
 return first.results[0]||{};
}
const tables=['entities','races','connections','results','horse_details','horse_seasons','edition_details','pedigree_edges','bloodline_profiles','change_requests','source_imports'];
if(mode==='preflight'){
 for(const table of tables){
  const result=await one(`SELECT count(*) AS n FROM ${table}`);
  if(Number(result.n)!==0)throw Error(`Refusing to import: existing WTW table ${table} contains records. No changes were made.`);
 }
 console.log(`Preflight PASS: ${NAME} is initialized and empty; existing WTW data cannot be overwritten.`);
}else{
 const manifest=JSON.parse(fs.readFileSync('generated/private-d1/manifest.json','utf8'));
 for(const [table,expected] of Object.entries(manifest.outputCounts)){
  const result=await one(`SELECT count(*) AS n FROM ${table}`);
  if(Number(result.n)!==Number(expected)) throw Error(`WTW import incomplete for ${table}; expected ${expected}, got ${result.n}`);
 }
 for(const [id,name] of [['H-1950-008016','Double Duty'],['H-1950-008023','Northbound Train'],
                         ['H-1950-008019','Miss Meridian'],['H-1949-008014','Bramble']]){
  const record=await one(`SELECT name FROM entities WHERE id='${id}'`);
  if(record.name!==name)throw Error(`User-approved name mismatch on ${id}`);
 }
 const changeCount=await one('SELECT count(*) AS n FROM change_requests');
 if(Number(changeCount.n)!==0)throw Error('Unexpected change requests in freshly imported database');
 const importRow=await one("SELECT source_sha256 FROM source_imports WHERE id='full_history_2026_11_07'");
 if(importRow.source_sha256!==manifest.digest)throw Error('Source checksum mismatch after import');
 console.log(`WTW remote D1 import verified against private source manifest. All table counts, champion names and digest PASS.`);
}
