import {qaPendingInactiveAuthority,qaPendingInactiveEditionIds} from './history-inactive-read-model.js';
// Cloudflare Worker / D1 API. Deliberately separate from all other WTW and non-WTW projects.
// Privacy: every request requires authenticated Cloudflare Access in deployed environments.
const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer'
};
const response = (data, status=200) => new Response(JSON.stringify(data), {status, headers:jsonHeaders});
const allowedFields = {
  entity: new Set(['name','summary','sex','foal_year','role','status']),
  race: new Set(['name','year','date','track_name','status']),
  connection: new Set(['party_id','year','role','basis']),
  result: new Set(['horse_id','position'])
};
function isLocal(request) {
  const url=new URL(request.url);
  return ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
}
async function accessEmail(request, env, ctx) {
  if (isLocal(request) && env.DEV_BYPASS_ACCESS === 'true') return 'local-developer@wtw.local';
  if (!ctx.access) return null;
  const id = await ctx.access.getIdentity();
  if (!id?.email) return null;
  const allowed = String(env.ADMIN_EMAIL || '').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(id.email.toLowerCase()) ? id.email : null;
}
const tableFor = {entity:'entities', race:'races', connection:'connections', result:'results'};
async function loadTarget(db, type, id) {
  if (!allowedFields[type]) return null;
  if (type==='result') {
    const [edition, position] = id.split('::');
    if(!edition || !/^\d+$/.test(position||'')) return null;
    return await db.prepare('SELECT * FROM results WHERE edition_id=? AND position=?').bind(edition,Number(position)).first();
  }
  return await db.prepare(`SELECT * FROM ${tableFor[type]} WHERE id=?`).bind(id).first();
}
function validProposed(field, value) {
  if (typeof value !== 'string' || !value.trim() || value.length>220) return false;
  if (['year','foal_year','position'].includes(field)) return /^\d{1,4}$/.test(value) && Number(value)>0;
  if(field==='date') return /^\d{4}-\d{2}-\d{2}$/.test(value);
  return true;
}
// Display-name edits are an overlay. Never overwrite original imported names or IDs.
const entitySelect = `SELECT e.id,e.kind,COALESCE(n.name,e.name) AS name,e.name AS source_name,e.foal_year,e.sex,e.role,e.summary,e.status,e.source,e.imported_at,CASE WHEN e.kind='horse' THEN json_extract(hd.raw_json,'$.Source') ELSE NULL END AS archive_source FROM entities e LEFT JOIN display_name_overrides n ON n.target_type='entity' AND n.target_id=e.id LEFT JOIN horse_details hd ON e.kind='horse' AND hd.horse_id=e.id`;
const raceSelect = `SELECT r.id,COALESCE(n.name,r.name) AS name,r.name AS source_name,r.year,r.date,COALESCE(v.name,t.name,r.track_name) AS track_name,r.track_name AS source_track_name,d.track_id AS track_id,v.name AS venue_override_name,r.status,r.source,r.imported_at,d.race_date_basis AS date_basis,json_extract(d.raw_json,'$.Chronology_QA') AS chronology_qa FROM races r LEFT JOIN edition_details d ON d.edition_id=r.id LEFT JOIN display_name_overrides n ON n.target_type='race' AND n.target_id=r.id LEFT JOIN display_name_overrides v ON v.target_type='venue' AND v.target_id=r.id LEFT JOIN display_name_overrides t ON t.target_type='entity' AND t.target_id=d.track_id`;
async function readNameTarget(db,type,id) {
  if(type==='entity') return db.prepare("SELECT e.name AS source_name,COALESCE(n.name,e.name) AS display_name FROM entities e LEFT JOIN display_name_overrides n ON n.target_type='entity' AND n.target_id=e.id WHERE e.id=?").bind(id).first();
  if(type==='race') return db.prepare("SELECT r.name AS source_name,COALESCE(n.name,r.name) AS display_name FROM races r LEFT JOIN display_name_overrides n ON n.target_type='race' AND n.target_id=r.id WHERE r.id=?").bind(id).first();
  if(type==='venue') return db.prepare("SELECT r.track_name AS source_name,COALESCE(v.name,t.name,r.track_name) AS display_name,t.name AS track_override FROM races r LEFT JOIN edition_details d ON d.edition_id=r.id LEFT JOIN display_name_overrides v ON v.target_type='venue' AND v.target_id=r.id LEFT JOIN display_name_overrides t ON t.target_type='entity' AND t.target_id=d.track_id WHERE r.id=? AND r.track_name IS NOT NULL").bind(id).first();
  if(type==='pedigree') return db.prepare("SELECT q.source_name,COALESCE(n.name,q.source_name) AS display_name FROM (SELECT parent_id AS ref_id,parent_name AS source_name,0 AS priority FROM pedigree_edges WHERE parent_id=? UNION ALL SELECT child_id AS ref_id,child_name AS source_name,1 AS priority FROM pedigree_edges WHERE child_id=?) q LEFT JOIN display_name_overrides n ON n.target_type='pedigree' AND n.target_id=q.ref_id WHERE q.source_name IS NOT NULL ORDER BY q.priority LIMIT 1").bind(id,id).first();
  return null;
}
export function validDisplayName(value) {
  return typeof value==='string' && value.trim().length>=1 && value.trim().length<=220 && !/[\u0000-\u001f\u007f]/.test(value);
}
// Historical source quarantine is not a racing result. Keep those rows in D1 for
// privileged source review, but exclude them from the active History tab read model.
// This is a visibility guard for the OLD v3.37 D1 snapshot, not a v3.84
// result import. D1's stored status predates later Drive quarantines.
if(qaPendingInactiveAuthority!=='V3.84_QA_PENDING' ||
   qaPendingInactiveEditionIds.length!==223 ||
   new Set(qaPendingInactiveEditionIds).size!==223)
  throw Error('Historical exclusion authority changed: review before deploying');
const qaPendingExcludedEditionIds=new Set(qaPendingInactiveEditionIds);
// Immutable report of the 2026-11-10 protected D1 readback, NOT a permanent
// auto-certification of future D1 writes and NOT historical source approval.
export const historicalSourceStatus=Object.freeze({
  d1_snapshot:'2026-11-07 staged H/S/E/P/B export; D1 readback checked 2026-11-10',
  canonical_race_authority:'Drive E/W/M v3.84 QA_PENDING',
  exclusion_list_size:qaPendingExcludedEditionIds.size,
  result_delta_status:'D1_PARITY_VERIFIED_2026_11_10__SOURCE_QA_PENDING',
  verification:Object.freeze({
    as_of:'2026-11-10',
    kind:'PERMANENT_ID_AND_STORED_RACE_FIELDS_READBACK',
    stored_edition_count:5370,
    active_edition_count:5147,
    inactive_edition_count:223,
    stored_top_three_count:15561,
    active_top_three_count:15441,
    stored_race_field_differences:0,
    stored_result_id_differences:0,
    run_url:'https://github.com/scottjazdzewski/wire-to-wire/actions/runs/42891491897'
  }),
  warning:'Technical D1 parity verified as of 2026-11-10. Historical E/W/M authority remains QA PENDING; dates marked INTERNAL/WTW_FIXED and year-level people connections are not individually source-certified.'
});
export function isHistoricalEditionVisible(edition) {
  if(!edition)return false;
  const id=edition.id??edition.edition_id;
  return typeof id==='string' && !qaPendingExcludedEditionIds.has(id) &&
    !String(edition.status??'').startsWith('QUARANTINED');
}
function visibleHistoricalResults(races,results){
  const liveRaces=races.filter(isHistoricalEditionVisible);
  const liveIds=new Set(liveRaces.map(r=>r.id));
  return {races:liveRaces,results:results.filter(r=>liveIds.has(r.edition_id))};
}
async function bootstrap(db) {
  // D1 allows at most six simultaneous connections per Worker request. Run the
  // read model queries sequentially to prevent startup failures and demo fallback.
  const jobs = [
    () => db.prepare('SELECT count(*) AS n,(SELECT count(*) FROM horse_details) AS horseDetails,(SELECT count(*) FROM horse_seasons) AS horseSeasons,(SELECT count(*) FROM pedigree_edges) AS pedigreeEdges,(SELECT count(*) FROM bloodline_profiles) AS bloodlineProfiles FROM entities').first(),
    () => db.prepare("SELECT count(*) AS n FROM races WHERE status NOT LIKE 'QUARANTINED%'").first(),
    () => db.prepare('SELECT count(*) AS n FROM connections').first(),
    () => db.prepare("SELECT count(*) AS n FROM results p JOIN races r ON r.id=p.edition_id WHERE r.status NOT LIKE 'QUARANTINED%'").first(),
    () => db.prepare('SELECT count(*) AS n FROM change_requests').first(),
    () => db.prepare(entitySelect+' ORDER BY e.kind, name LIMIT 15000').all(),
    () => db.prepare('SELECT * FROM connections ORDER BY year DESC LIMIT 40000').all(),
    () => db.prepare(raceSelect+" WHERE r.status NOT LIKE 'QUARANTINED%' ORDER BY r.year DESC, name LIMIT 10000").all(),
    () => db.prepare("SELECT p.edition_id,p.horse_id,p.position FROM results p JOIN races r ON r.id=p.edition_id WHERE r.status NOT LIKE 'QUARANTINED%' ORDER BY p.edition_id,p.position LIMIT 25000").all(),
    () => db.prepare('SELECT * FROM change_requests ORDER BY created_at DESC LIMIT 500').all(),
    () => db.prepare("SELECT DISTINCT year FROM races WHERE status NOT LIKE 'QUARANTINED%' ORDER BY year").all(),
    () => db.prepare('SELECT target_type,target_id,old_display_name,new_display_name,source_name,editor_email,edited_at FROM name_edit_audit ORDER BY id DESC LIMIT 200').all()
  ];
  const values = [];
  for (const job of jobs) values.push(await job());
  const [entityCount,raceCount,connCount,resultCount,changeCount,entities,connections,races,results,changes,years,nameEdits] = values;
  // Source-level inactive IDs must be removed from the SITE view even when
  // their outdated D1 rows still say ACTIVE. Never delete D1 audit/source rows.
  const visible=visibleHistoricalResults(races.results,results.results);
  // Keep D1's full year index: the race query may be partial during paging and
  // a year can have other valid editions even if the sample rows are held.
  const activeYears=years.results.map(x=>x.year);
  return {
    mode:'D1_CONNECTED',
    scope:'OLDER_D1_SNAPSHOT_WITH_V384_QA_PENDING_EXCLUSION',
    historySource:historicalSourceStatus,
    counts:{entities:entityCount?.n||0,races:visible.races.length,connections:connCount?.n||0,results:visible.results.length,changes:changeCount?.n||0,horseDetails:entityCount?.horseDetails||0,horseSeasons:entityCount?.horseSeasons||0,pedigreeEdges:entityCount?.pedigreeEdges||0,bloodlineProfiles:entityCount?.bloodlineProfiles||0},
    partial: Number(entityCount?.n||0)>15000 || Number(raceCount?.n||0)>10000 || Number(connCount?.n||0)>40000 || Number(resultCount?.n||0)>25000 || Number(raceCount?.n||0)>races.results.length || Number(resultCount?.n||0)>results.results.length,
    years:activeYears,
    entities:entities.results,connections:connections.results,races:visible.races,results:visible.results,
    changes:changes.results,
    nameEdits:nameEdits.results
  };
}
async function api(request,env,email) {
  if(!env.DB) return response({error:'D1 not bound. Preview is available using sample-history.json.'},503);
  const url = new URL(request.url);
  if(request.method==='POST' && url.pathname==='/api/names') {
    if(request.headers.get('content-type')?.split(';')[0]!=='application/json') return response({error:'JSON required'},415);
    const origin=request.headers.get('Origin');
    if(origin && origin!==url.origin) return response({error:'Origin mismatch'},403);
    const b=await request.json().catch(()=>null);
    if(!b || !['entity','race','venue','pedigree'].includes(b.target_type) ||
       typeof b.target_id!=='string' || !b.target_id || b.target_id.length>140 ||
       !validDisplayName(b.name) || typeof b.expected_name!=='string') return response({error:'Invalid name edit'},400);
    const target=await readNameTarget(env.DB,b.target_type,b.target_id);
    if(!target) return response({error:'Name record not found'},404);
    if(target.display_name!==b.expected_name) return response({error:'Name changed since you opened it. Reload and try again.'},409);
    const requested=b.name.trim();
    if(requested===target.display_name) return response({error:'Name is unchanged'},400);
    if(requested===target.source_name && !(b.target_type==='venue' && target.track_override)){
      await env.DB.batch([
        env.DB.prepare('DELETE FROM display_name_overrides WHERE target_type=? AND target_id=?').bind(b.target_type,b.target_id),
        env.DB.prepare('INSERT INTO name_edit_audit (target_type,target_id,old_display_name,new_display_name,source_name,editor_email) VALUES (?,?,?,?,?,?)').bind(b.target_type,b.target_id,target.display_name,requested,target.source_name,email)
      ]);
    } else {
      await env.DB.batch([
        env.DB.prepare("INSERT INTO display_name_overrides (target_type,target_id,name,original_name,updated_by) VALUES (?,?,?,?,?) ON CONFLICT(target_type,target_id) DO UPDATE SET name=excluded.name,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP").bind(b.target_type,b.target_id,requested,target.source_name,email),
        env.DB.prepare('INSERT INTO name_edit_audit (target_type,target_id,old_display_name,new_display_name,source_name,editor_email) VALUES (?,?,?,?,?,?)').bind(b.target_type,b.target_id,target.display_name,requested,target.source_name,email)
      ]);
    }
    return response({ok:true,target_type:b.target_type,target_id:b.target_id,name:requested,source_name:target.source_name,source_unchanged:true});
  }
  // Private, source-preserving geography read model. Existing archive tables are
  // never rewritten; these immutable WTW IDs can exist beyond the older D1 import.
  // The Pages Function verifies Cloudflare Access before this handler is called.
  if(request.method==='GET' && url.pathname==='/api/geography/overview'){
    const [items,manifest]=await Promise.all([
      env.DB.prepare('SELECT source_sheet,COUNT(*) AS n,COUNT(DISTINCT entity_id) AS unique_entities FROM wtw_geo_read_records GROUP BY source_sheet ORDER BY source_sheet').all(),
      env.DB.prepare('SELECT batch_id,source_sheet_url,source_digest_sha256,total_records,horse_current,horse_foaling,participant_geography,organization_geography,track_geography,imported_at,source_policy FROM wtw_geo_import_manifest ORDER BY imported_at DESC LIMIT 1').first()
    ]);
    return response({mode:'PROTECTED_GEOGRAPHY_READ_MODEL',authority:'Drive v3.3',import:manifest||null,source_layers:items.results});
  }
  const geoMatch=url.pathname.match(/^\/api\/geography\/([A-Z][A-Z0-9_-]{2,119})$/);
  if(request.method==='GET' && geoMatch){
    const id=geoMatch[1];
    const rows=await env.DB.prepare(
      'SELECT source_record_id,entity_id,entity_kind,relation_kind,effective_at,city_locality,state_region,country,place_name,travel_node,location_type,geography_status,canon_status,source_sheet,source_basis,evidence_note,metadata_json FROM wtw_geo_read_records WHERE entity_id=? ORDER BY CASE relation_kind WHEN \'CURRENT_RESIDENCE\' THEN 0 WHEN \'FOALING_LOCATION\' THEN 1 WHEN \'TRACK_LOCATION\' THEN 2 WHEN \'ORGANIZATION_BASE\' THEN 3 ELSE 4 END, effective_at DESC,source_record_id LIMIT 250'
    ).bind(id).all();
    return response({
      entity_id:id,
      authority:'WTW CANON REGISTRIES — 1999 START v3.3',
      scope:'GEOGRAPHY_READ_MODEL_ONLY',
      records:rows.results,
      source_provenance_note:'Boarding/foaling records include both evidence-backed and explicitly fictional canon. Historical pedigree-only identity does not imply living 1999 stock.'
    });
  }
  // Source-approved, ID-keyed 1999 organization histories are an existing-D1
  // projection. Private API only, no organization/name/canon write endpoint.
  if(request.method==='GET' && (url.pathname==='/api/history/organizations' ||
       /^\/api\/history\/organizations\/O-\d{6}$/.test(url.pathname))) {
    const exists=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='wtw_history_org_profiles'").first();
    if(!exists)return response({mode:'NOT_IMPORTED',authority:'WTW Canon Registry v3.3',organizations:[],error:'Organization read-model has not been approved for import'},503);
    const cols='organization_id,canonical_name,organization_type,canonical_geography,origin_through_1998,stakes_bloodline_anchor,approved_connections,historical_prestige,momentum_1990s,commercial_appeal,peer_reputation,financial_vulnerability,historical_year_links,publication_tier,source_spreadsheet_id,source_sheet_id,source_sha256';
    const detail=url.pathname.match(/^\/api\/history\/organizations\/(O-\d{6})$/);
    const orgs=detail
      ? await env.DB.prepare('SELECT '+cols+' FROM wtw_history_org_profiles WHERE organization_id=? LIMIT 1').bind(detail[1]).all()
      : await env.DB.prepare('SELECT '+cols+' FROM wtw_history_org_profiles ORDER BY canonical_name LIMIT 150').all();
    const safe=(orgs.results||[]).map(org=>{
      const approved=['EXISTING_APPROVED_SOURCE','USER_APPROVED_DIRECTION_ONLY'].includes(org.publication_tier);
      return {
        ...org,
        origin_through_1998:approved?org.origin_through_1998:null,
        stakes_bloodline_anchor:approved?org.stakes_bloodline_anchor:null,
        approved_connections:approved?org.approved_connections:null,
        historical_prestige:approved?org.historical_prestige:null,
        momentum_1990s:approved?org.momentum_1990s:null,
        commercial_appeal:approved?org.commercial_appeal:null,
        peer_reputation:approved?org.peer_reputation:null,
        financial_vulnerability:approved?org.financial_vulnerability:null,
        origin_publication_status:approved?'APPROVED_SOURCE_HISTORY':'ORIGIN_AWAITING_OWNER_APPROVAL',
        recorded_associations_only:'Horse-year links are NOT race-day owner/breeder credits or verified earnings'
      };
    });
    if(detail)return safe.length?response({mode:'PROTECTED_HISTORY_ORG_READ_MODEL',organization:safe[0]}):response({error:'Organization not in approved 1999 registry'},404);
    const approvals=safe.filter(x=>x.origin_publication_status==='APPROVED_SOURCE_HISTORY').length;
    if(safe.length!==108||approvals!==10)return response({error:'Organization source publication mix changed; review before use'},503);
    return response({mode:'PROTECTED_HISTORY_ORG_READ_MODEL',authority:'WTW Canon Registry v3.3 History_Org_Economic_Backstory',
      approved_origin_count:approvals,identity_only_count:safe.length-approvals,organizations:safe});
  }
  if(request.method==='GET' && url.pathname==='/api/health') return response({status:'ok',mode:'D1',actor:email,historySource:historicalSourceStatus});
  if(request.method==='GET' && url.pathname==='/api/bootstrap') return response(await bootstrap(env.DB));
  const horseMatch=url.pathname.match(/^\/api\/horses\/(H-[A-Za-z0-9-]+)$/);
  if(request.method==='GET'&&horseMatch){
    const horseId=horseMatch[1];
    const [details,seasons,parents,offspring,bloodline]=await Promise.all([
      env.DB.prepare('SELECT * FROM horse_details WHERE horse_id=?').bind(horseId).first(),
      env.DB.prepare('SELECT * FROM horse_seasons WHERE horse_id=? ORDER BY year').bind(horseId).all(),
      env.DB.prepare("SELECT p.parent_id,COALESCE(n.name,p.parent_name) AS parent_name,p.relation,p.biology_check FROM pedigree_edges p LEFT JOIN display_name_overrides n ON n.target_type='pedigree' AND n.target_id=p.parent_id WHERE p.child_id=? ORDER BY p.relation").bind(horseId).all(),
      env.DB.prepare("SELECT p.child_id,COALESCE(n.name,m.name,p.child_name) AS child_name,p.relation,p.biology_check FROM pedigree_edges p LEFT JOIN display_name_overrides n ON n.target_type='entity' AND n.target_id=p.child_id LEFT JOIN display_name_overrides m ON m.target_type='pedigree' AND m.target_id=p.child_id WHERE p.parent_id=? ORDER BY p.child_id LIMIT 100").bind(horseId).all(),
      env.DB.prepare('SELECT * FROM bloodline_profiles WHERE horse_id=?').bind(horseId).first()
    ]);
    return response({horse_id:horseId,details,seasons:seasons.results,parents:parents.results,offspring:offspring.results,bloodline});
  }
  // Five-generation source pedigree, keyed exclusively by immutable horse IDs.
  // The recursive path is S (sire) or D (dam); 2+4+8+16+32 ancestor
  // positions can be displayed without filling unknown parents with inventions.
  // Read-only: display-name overrides are applied at the final lookup.
  const pedigreeMatch=url.pathname.match(/^\/api\/horses\/(H-[A-Za-z0-9-]+)\/pedigree$/);
  if(request.method==='GET'&&pedigreeMatch){
    const horseId=pedigreeMatch[1];
    const horse=await env.DB.prepare("SELECT e.id,e.kind,COALESCE(n.name,e.name) AS name,e.foal_year,e.sex,e.status FROM entities e LEFT JOIN display_name_overrides n ON n.target_type='entity' AND n.target_id=e.id WHERE e.id=? AND e.kind='horse' LIMIT 1").bind(horseId).first();
    // Some older pedigrees contain ancestor identities before a full entity
    // dossier is imported. A valid edge ID still has a navigable pedigree.
    const parent=horse?null:await env.DB.prepare("SELECT parent_id AS id,parent_name AS name FROM pedigree_edges WHERE parent_id=? LIMIT 1").bind(horseId).first();
    if(!horse&&!parent)return response({error:'Horse not in the historical source'},404);
    const rows=await env.DB.prepare(
      "WITH RECURSIVE tree(depth,path,horse_id,source_name,visited) AS ("+
      " SELECT 0,'' AS path,? AS horse_id,? AS source_name,'|'||?||'|' AS visited "+
      " UNION ALL "+
      " SELECT tree.depth+1,tree.path||CASE WHEN UPPER(p.relation)='SIRE' THEN 'S' ELSE 'D' END,"+
      " p.parent_id,p.parent_name,tree.visited||p.parent_id||'|' "+
      " FROM tree JOIN pedigree_edges p ON p.child_id=tree.horse_id "+
      " WHERE tree.depth<5 AND UPPER(p.relation) IN ('SIRE','DAM') "+
      " AND INSTR(tree.visited,'|'||p.parent_id||'|')=0"+
      ") SELECT tree.depth,tree.path,tree.horse_id,"+
      " COALESCE(en.name,pn.name,tree.source_name,tree.horse_id) AS name,"+
      " e.foal_year,e.sex,e.kind,e.status"+
      " FROM tree LEFT JOIN entities e ON e.id=tree.horse_id"+
      " LEFT JOIN display_name_overrides en ON en.target_type='entity' AND en.target_id=tree.horse_id"+
      " LEFT JOIN display_name_overrides pn ON pn.target_type='pedigree' AND pn.target_id=tree.horse_id"+
      " ORDER BY tree.depth,tree.path LIMIT 128"
    ).bind(horseId,horse?.name||parent.name,horseId).all();
    const nodes=rows.results||[];
    const byPath=new Set(nodes.map(n=>n.path));
    return response({horse_id:horseId,generations:5,positions:63,
      known_positions:nodes.length,complete:nodes.length===63&&byPath.size===63,
      authority:'WTW historical source pedigree edges and immutable H-IDs',
      warning:'Missing ancestors remain unknown. An internal WTW source pedigree is not an authenticated external studbook.',
      nodes});
  }
  if(request.method==='GET' && url.pathname==='/api/entities') {
    const term=String(url.searchParams.get('q')||'').slice(0,90),kind=String(url.searchParams.get('kind')||'').slice(0,30);
    const limit=Math.min(Math.max(Number(url.searchParams.get('limit'))||100,1),250);
    const query=entitySelect+` WHERE (?='' OR e.name LIKE ? OR n.name LIKE ? OR e.id LIKE ?) AND (?='' OR e.kind=?) ORDER BY name LIMIT ?`;
    const r=await env.DB.prepare(query).bind(term,`%${term}%`,`%${term}%`,`%${term}%`,kind,kind,limit).all();
    return response({entities:r.results});
  }
  if(request.method==='GET' && url.pathname==='/api/seasons') {
    const year=Number(url.searchParams.get('year'));
    if(!Number.isInteger(year)||year<1800||year>2100) return response({error:'Valid year required'},400);
    const [races,results,connections]=await Promise.all([
      env.DB.prepare(raceSelect+" WHERE r.year=? AND r.status NOT LIKE 'QUARANTINED%' ORDER BY r.date,name LIMIT 500").bind(year).all(),
      env.DB.prepare("SELECT r.* FROM results r JOIN races e ON e.id=r.edition_id WHERE e.year=? AND e.status NOT LIKE 'QUARANTINED%' LIMIT 2000").bind(year).all(),
      env.DB.prepare('SELECT * FROM connections WHERE year=? LIMIT 3000').bind(year).all()
    ]);
    const visible=visibleHistoricalResults(races.results,results.results);
    return response({year,races:visible.races,results:visible.results,connections:connections.results,historySource:historicalSourceStatus});
  }
  if(request.method==='POST' && url.pathname==='/api/changes') {
    if(request.headers.get('content-type')?.split(';')[0]!=='application/json') return response({error:'JSON required'},415);
    const origin=request.headers.get('Origin');
    if(origin && origin!==url.origin) return response({error:'Origin mismatch'},403);
    const b=await request.json().catch(()=>null);
    if(!b||!allowedFields[b.target_type]?.has(b.field)||typeof b.target_id!=='string'||b.target_id.length>140 || !validProposed(b.field,b.proposed_value)) return response({error:'Invalid change request'},400);
    const reason=String(b.reason||'').trim();
    if(reason.length<10||reason.length>1000)return response({error:'Reason must be 10–1000 characters'},400);
    const target=await loadTarget(env.DB,b.target_type,b.target_id);
    if(!target)return response({error:'Target not found'},404);
    const current=b.target_type==='result' ? target[b.field] : target[b.field];
    if(String(current??'')===b.proposed_value.trim())return response({error:'Proposed value equals existing value'},400);
    const id=crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare('INSERT INTO change_requests (id,target_type,target_id,field,old_value,proposed_value,reason,created_by) VALUES (?,?,?,?,?,?,?,?)').bind(id,b.target_type,b.target_id,b.field,String(current??''),b.proposed_value.trim(),reason,email),
      env.DB.prepare('INSERT INTO change_audit (request_id,action,actor_email,note) VALUES (?,?,?,?)').bind(id,'PROPOSED',email,'Source truth remains unchanged')
    ]);
    return response({id,status:'PENDING',message:'Proposal saved; source data unchanged'},201);
  }
  const match=url.pathname.match(/^\/api\/changes\/([0-9a-f-]{36})\/decision$/);
  if(request.method==='POST' && match) {
    if(request.headers.get('content-type')?.split(';')[0]!=='application/json') return response({error:'JSON required'},415);
    const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return response({error:'Origin mismatch'},403);
    const b=await request.json().catch(()=>null);
    if(!b||!['APPROVED_FOR_PROMOTION','REJECTED'].includes(b.decision))return response({error:'Invalid decision'},400);
    const note=String(b.note||'').slice(0,1000);
    const c=await env.DB.prepare('SELECT status FROM change_requests WHERE id=?').bind(match[1]).first();
    if(!c)return response({error:'Request not found'},404);
    if(c.status!=='PENDING')return response({error:'Already reviewed'},409);
    await env.DB.batch([
      env.DB.prepare('UPDATE change_requests SET status=?, decided_at=CURRENT_TIMESTAMP, decided_by=?, decision_note=? WHERE id=? AND status=\'PENDING\'').bind(b.decision,email,note,match[1]),
      env.DB.prepare('INSERT INTO change_audit (request_id,action,actor_email,note) VALUES (?,?,?,?)').bind(match[1],b.decision,email,note)
    ]);
    return response({id:match[1],status:b.decision,message:'Decision recorded. Canonical source still unchanged until controlled promotion.'});
  }
  return response({error:'Not found'},404);
}
export default {
  async fetch(request,env,ctx) {
    const email=await accessEmail(request,env,ctx);
    if(!email) return response({error:'Private WTW Canon Desk. Cloudflare Access and authorized administrator email required.'},403);
    const path=new URL(request.url).pathname;
    try {
      if(path.startsWith('/api/'))return await api(request,env,email);
      const asset=await env.ASSETS.fetch(request);
      const headers=new Headers(asset.headers);
      headers.set('X-Content-Type-Options','nosniff');
      headers.set('Referrer-Policy','no-referrer');
      headers.set('X-Frame-Options','DENY');
      headers.set('Content-Security-Policy',"default-src 'self'; connect-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'; object-src 'none'");
      return new Response(asset.body,{status:asset.status,headers});
    } catch(e){return response({error:'Internal application error'},500)}
  }
};
// Shared by the Pages Functions API adapter; authentication happens in the caller.
export { api };
