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
async function bootstrap(db) {
  const [entityCount,raceCount,connCount,resultCount,changeCount,entities,connections,races,results,changes,years] = await Promise.all([
    db.prepare('SELECT count(*) AS n FROM entities').first(),
    db.prepare('SELECT count(*) AS n FROM races').first(),
    db.prepare('SELECT count(*) AS n FROM connections').first(),
    db.prepare('SELECT count(*) AS n FROM results').first(),
    db.prepare('SELECT count(*) AS n FROM change_requests').first(),
    db.prepare('SELECT * FROM entities ORDER BY kind, name LIMIT 15000').all(),
    db.prepare('SELECT * FROM connections ORDER BY year DESC LIMIT 40000').all(),
    db.prepare('SELECT r.*, d.race_date_basis AS date_basis FROM races r LEFT JOIN edition_details d ON d.edition_id=r.id ORDER BY r.year DESC, r.name LIMIT 10000').all(),
    db.prepare('SELECT edition_id, horse_id, position FROM results ORDER BY edition_id, position LIMIT 25000').all(),
    db.prepare('SELECT * FROM change_requests ORDER BY created_at DESC LIMIT 500').all(),
    db.prepare('SELECT DISTINCT year FROM races ORDER BY year').all()
  ]);
  return {
    mode:'D1_CONNECTED',
    scope:'DATASET_SAMPLE_OR_IMPORT',
    counts:{entities:entityCount?.n||0,races:raceCount?.n||0,connections:connCount?.n||0,results:resultCount?.n||0,changes:changeCount?.n||0},
    partial: Number(entityCount?.n||0)>15000 || Number(raceCount?.n||0)>10000 || Number(connCount?.n||0)>40000 || Number(resultCount?.n||0)>25000,
    years: years.results.map(x=>x.year),
    entities:entities.results,connections:connections.results,races:races.results,results:results.results,
    changes:changes.results
  };
}
async function api(request,env,email) {
  if(!env.DB) return response({error:'D1 not bound. Preview is available using sample-history.json.'},503);
  const url = new URL(request.url);
  if(request.method==='GET' && url.pathname==='/api/health') return response({status:'ok',mode:'D1',actor:email});
  if(request.method==='GET' && url.pathname==='/api/bootstrap') return response(await bootstrap(env.DB));
  const horseMatch=url.pathname.match(/^\/api\/horses\/(H-[A-Za-z0-9-]+)$/);
  if(request.method==='GET'&&horseMatch){
    const horseId=horseMatch[1];
    const [details,seasons,parents,offspring,bloodline]=await Promise.all([
      env.DB.prepare('SELECT * FROM horse_details WHERE horse_id=?').bind(horseId).first(),
      env.DB.prepare('SELECT * FROM horse_seasons WHERE horse_id=? ORDER BY year').bind(horseId).all(),
      env.DB.prepare('SELECT parent_id,parent_name,relation,biology_check FROM pedigree_edges WHERE child_id=? ORDER BY relation').bind(horseId).all(),
      env.DB.prepare('SELECT child_id,child_name,relation,biology_check FROM pedigree_edges WHERE parent_id=? ORDER BY child_id LIMIT 100').bind(horseId).all(),
      env.DB.prepare('SELECT * FROM bloodline_profiles WHERE horse_id=?').bind(horseId).first()
    ]);
    return response({horse_id:horseId,details,seasons:seasons.results,parents:parents.results,offspring:offspring.results,bloodline});
  }
  if(request.method==='GET' && url.pathname==='/api/entities') {
    const term=String(url.searchParams.get('q')||'').slice(0,90),kind=String(url.searchParams.get('kind')||'').slice(0,30);
    const limit=Math.min(Math.max(Number(url.searchParams.get('limit'))||100,1),250);
    const query=`SELECT * FROM entities WHERE (?='' OR name LIKE ? OR id LIKE ?) AND (?='' OR kind=?) ORDER BY name LIMIT ?`;
    const r=await env.DB.prepare(query).bind(term,`%${term}%`,`%${term}%`,kind,kind,limit).all();
    return response({entities:r.results});
  }
  if(request.method==='GET' && url.pathname==='/api/seasons') {
    const year=Number(url.searchParams.get('year'));
    if(!Number.isInteger(year)||year<1800||year>2100) return response({error:'Valid year required'},400);
    const [races,results,connections]=await Promise.all([
      env.DB.prepare('SELECT * FROM races WHERE year=? ORDER BY date,name LIMIT 500').bind(year).all(),
      env.DB.prepare('SELECT r.* FROM results r JOIN races e ON e.id=r.edition_id WHERE e.year=? LIMIT 2000').bind(year).all(),
      env.DB.prepare('SELECT * FROM connections WHERE year=? LIMIT 3000').bind(year).all()
    ]);
    return response({year,races:races.results,results:results.results,connections:connections.results});
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