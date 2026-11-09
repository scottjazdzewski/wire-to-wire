/**
 * WTW-only remote D1 geographic read-model preflight and post-import certification.
 * Does not update any historical entity, winner, edition, name or finance table.
 * Run via manually dispatched protected workflow with the existing WTW D1 token.
 */
import fs from 'node:fs';
import path from 'node:path';
const mode=process.argv[2];
if(!['preflight','verify'].includes(mode))throw Error('Use preflight or verify');
const account=process.env.CLOUDFLARE_ACCOUNT_ID||'';
const token=process.env.CLOUDFLARE_API_TOKEN||'';
const uuid=process.env.WTW_D1_UUID||'';
if(!/^[0-9a-f]{32}$/i.test(account)||!/^[0-9a-f-]{36}$/i.test(uuid)||!token)
 throw Error('Missing verified WTW-only D1 credentials');
const base='https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database/'+uuid+'/query';
const root='generated/private-d1/geography';
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
async function query(sql){
 const response=await fetch(base,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({sql})});
 if(!response.ok)throw Error('D1 read-only geography audit HTTP '+response.status);
 const result=await response.json();
 if(!result.success||!result.result?.[0]?.success||!Array.isArray(result.result[0].results))
   throw Error('D1 geography query failed');
 return result.result[0].results;
}
async function count(sql){const rows=await query(sql);return Number(rows[0]?.n);}
const historical=['entities','races','results','connections','horse_details','edition_details'];
async function historicalCounts(){const out={};for(const t of historical)out[t]=await count('SELECT COUNT(*) AS n FROM '+t);return out;}
if(mode==='preflight'){
 const existing=await count('SELECT COUNT(*) AS n FROM wtw_geo_read_records');
 const manifestCount=await count('SELECT COUNT(*) AS n FROM wtw_geo_import_manifest');
 if(existing!==0||manifestCount!==0)throw Error('Refusing geography import: read model already has data or a prior import manifest. Do not overwrite.');
 const baseline=await historicalCounts();
 fs.writeFileSync(path.join(root,'remote-preflight.json'),JSON.stringify({database:'wtw-canon-desk-db',baseline,manifestDigest:manifest.digest},null,2)+'\n');
 console.log('Geography preflight PASS: destination empty, historical D1 row counts recorded; no history rows changed.');
}else{
 const before=JSON.parse(fs.readFileSync(path.join(root,'remote-preflight.json'),'utf8'));
 if(before.database!=='wtw-canon-desk-db'||before.manifestDigest!==manifest.digest)throw Error('Source digest preflight mismatch');
 const total=await count('SELECT COUNT(*) AS n FROM wtw_geo_read_records');
 if(total!==manifest.total)throw Error('Total geography rows '+total+' do not match '+manifest.total);
 const map={horse_current:'Horse_Geography',horse_foaling:'Horse_Foaling_Geography',participant_geography:'Participant_Geography',organization_geography:'Organization_Geography',track_geography:'Track_Geography'};
 for(const [key,sheet] of Object.entries(map)){
  const countOnServer=await count("SELECT COUNT(*) AS n FROM wtw_geo_read_records WHERE source_sheet='"+sheet+"'");
  if(countOnServer!==manifest.counts[key])throw Error(sheet+' count '+countOnServer+' expected '+manifest.counts[key]);
 }
 const sampleChecks=[
  ["SELECT COUNT(DISTINCT entity_id) AS n FROM wtw_geo_read_records WHERE source_sheet='Horse_Geography'",2488],
  ["SELECT COUNT(DISTINCT entity_id) AS n FROM wtw_geo_read_records WHERE source_sheet='Horse_Foaling_Geography'",2991],
  ["SELECT COUNT(DISTINCT entity_id) AS n FROM wtw_geo_read_records WHERE source_sheet='Organization_Geography'",108],
  ["SELECT COUNT(*) AS n FROM wtw_geo_read_records WHERE geography_status='WTW_PROPOSED_PLACEMENT'",8],
  ["SELECT COUNT(*) AS n FROM wtw_geo_read_records WHERE geography_status='BOUNDARY_PROVISIONAL'",5],
  ["SELECT COUNT(*) AS n FROM wtw_geo_read_records WHERE source_record_id='HG-000486' AND entity_id='H-1993-000007' AND travel_node LIKE 'Little Fork%'",1]
 ];
 for(const [sql,expected] of sampleChecks)if((await count(sql))!==expected)throw Error('Geography identity/source-status audit failed: '+sql);
 const imp=await query("SELECT source_digest_sha256, total_records, source_sheet_url FROM wtw_geo_import_manifest WHERE batch_id='"+manifest.batch_id+"'");
 if(imp.length!==1||imp[0].source_digest_sha256!==manifest.digest||Number(imp[0].total_records)!==manifest.total||imp[0].source_sheet_url!==manifest.authority_url)
  throw Error('Drive geography import manifest digest or authority mismatch');
 const after=await historicalCounts();
 for(const table of historical)if(before.baseline[table]!==after[table])throw Error('History table changed during geography import: '+table);
 console.log('Protected geography D1 import PASS: '+total+' rows, exact category counts, unique IDs, WTW canon/source labels, sealed digest; historical counts unchanged.');
}
