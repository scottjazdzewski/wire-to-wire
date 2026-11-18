/**
 * WTW canonical-Drive organization history -> PRIVATE website D1 projection.
 * Reads a versioned export of the existing WTW Canon Registry; NEVER writes
 * the source workbook, D1, races, results, names, geography or change requests.
 * Output is reviewable SQL, not an automatically promoted second master.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=process.env.WTW_HISTORY_ORG_SOURCE ||
  path.join(root,'data/history-source/canon-registry-2026-11-10/organization-economic-history.json');
const out=process.env.WTW_HISTORY_ORG_SQL_DIR ||
  path.join(root,'generated/private-d1-org-history');
const expectedSource='1Lhpe6DG1foQ2-zayQBg4bKpTtu4MP_itpM1zo2GRSEA';
const expectedSheet=122436628;
const bytes=fs.readFileSync(input);
const snapshot=JSON.parse(bytes.toString('utf8'));
if(snapshot.kind!=='WTW_DERIVED_PRIVATE_SITE_IMPORT_NOT_A_MASTER')
  throw Error('Refusing input not declared a derived Drive export');
if(snapshot.authority?.spreadsheet_id!==expectedSource ||
   snapshot.authority?.sheet_id!==expectedSheet ||
   snapshot.authority?.sheet_name!=='History_Org_Economic_Backstory')
  throw Error('Wrong authority. Do not import a different history source');
if(!Array.isArray(snapshot.headers)||!Array.isArray(snapshot.rows))
  throw Error('Invalid historical organization export');
const header=snapshot.headers;
if(new Set(header).size!==header.length)throw Error('Duplicate column names');
const required=[
  'Organization_ID','Canonical_Name','1999_Organization_Type',
  'Canon_Geographic_Base','Source_Status','Origin_Through_1998',
  'Historic_Prestige_1999','1990s_Momentum','Commercial_Appeal_1999',
  'Peer_Reputation_1999','Financial_Vulnerability_1999',
  'Approval_Gate','Pre1999_Stakes_Season_Human_And_Breeder_Evidence'
];
for(const field of required)if(!header.includes(field))
  throw Error('Missing authoritative source field '+field);
const hash=crypto.createHash('sha256').update(bytes).digest('hex');
const records=snapshot.rows.map((cells,i)=>{
  if(!Array.isArray(cells)||cells.length!==header.length)
    throw Error('Row width mismatch '+(i+2));
  const row=Object.fromEntries(header.map((k,n)=>[k,String(cells[n]??'')]));
  if(!/^O-\d{6}$/.test(row.Organization_ID)||!row.Canonical_Name.trim())
    throw Error('Invalid immutable organization identity at row '+(i+2));
  if(row.Approval_Gate==='')throw Error('Missing approval gate '+row.Organization_ID);
  return row;
});
if(records.length!==108)throw Error('Expected 108-source-record checkpoint, found '+records.length);
const ids=new Set(records.map(x=>x.Organization_ID));
if(ids.size!==records.length)throw Error('Duplicate Organization_ID; abort site projection');
const king=records.find(x=>x.Organization_ID==='O-000061');
if(king?.Canonical_Name!=='Kingsmere Farm' ||
   king['Historic_Prestige_1999']!=='ELITE_HISTORIC_GOLD_STANDARD' ||
   king['1990s_Momentum']!=='MODEST_SLIPPAGE_FROM_PEAK__NOT_COLLAPSE')
  throw Error('Kingsmere approved history or ID did not survive source export');
function tier(gate){
  if(gate.startsWith('USER_LOCKED_NARRATIVE_TRAJECTORY'))
    return 'USER_APPROVED_DIRECTION_ONLY';
  if(gate.startsWith('EXISTING_WORLD_BIBLE_SOURCE'))
    return 'EXISTING_APPROVED_SOURCE';
  if(gate.startsWith('EXISTING_V3_3_LEGACY_NAME_APPROVED'))
    return 'APPROVED_IDENTITY_HISTORY_REVIEW';
  if(gate.startsWith('EXISTING_LEGACY_ORIGIN'))
    return 'APPROVED_IDENTITY_HISTORY_REVIEW';
  if(gate.startsWith('SOURCE_HISTORY_OUTLINE'))
    return 'SOURCE_ONLY_OUTLINE_PENDING_APPROVAL';
  return 'UNAPPROVED_ORIGIN_DETAILS';
}
const q=x=>x===null||x===undefined||x===''?'NULL':"'"+String(x).replaceAll("'","''")+"'";
const fields=[
  ['organization_id','Organization_ID'],
  ['canonical_name','Canonical_Name'],
  ['organization_type','1999_Organization_Type'],
  ['canonical_geography','Canon_Geographic_Base'],
  ['source_status','Source_Status'],
  ['founded_year_source','Founded_Year_Existing'],
  ['origin_through_1998','Origin_Through_1998'],
  ['stakes_bloodline_anchor','Historical_Stakes_or_Bloodline_Anchor'],
  ['approved_connections','Approved_1999_Relationships'],
  ['capital_class_source','Existing_Capital_Class'],
  ['liquidity_profile_source','Existing_Liquidity_Profile'],
  ['historical_prestige','Historic_Prestige_1999'],
  ['momentum_1990s','1990s_Momentum'],
  ['commercial_appeal','Commercial_Appeal_1999'],
  ['peer_reputation','Peer_Reputation_1999'],
  ['financial_vulnerability','Financial_Vulnerability_1999'],
  ['continuity_constraints','Economic_Continuity_Constraint'],
  ['source_authority','Source_Authority'],
  ['approval_gate','Approval_Gate'],
  ['next_source_task','Next_History_Product_Task'],
  ['transfer_status','1999_Game_Transfer_Status'],
  ['historical_year_links','Pre1999_Stakes_Season_Human_And_Breeder_Evidence']
];
const cols=[...fields.map(x=>x[0]),'publication_tier','source_spreadsheet_id','source_sheet_id','source_sha256'];
const sql=[
  '-- DERIVED PRIVATE WTW D1 READ MODEL, NOT ORIGINAL CANON.',
  '-- Requires migrations/0006_history_org_projection.sql; no production execution here.',
  '-- Source: WTW Canon Registry v3.3, History_Org_Economic_Backstory gid 122436628',
  '-- Historical origin/reputation/finance claims are REDACTED for 98 unapproved entities; tier preserved.',
  '-- No writes to entities, races, results, name overrides or source Google Sheets.'
];
const counts={};
const sourceApproved=new Set(['USER_APPROVED_DIRECTION_ONLY','EXISTING_APPROVED_SOURCE']);
// The other 98 orgs have canonical identities, NOT approved origin narratives.
// Identity/geometry and carefully labeled year-level evidence may cross into
// D1; unapproved founders, fortunes, prestige, reputation and financial claims
// must not be silently published as historical fact.
const identityOnly=new Set([
  'organization_id','canonical_name','organization_type','canonical_geography',
  'source_status','source_authority','approval_gate','historical_year_links'
]);
let redactedOriginRows=0,publishedOriginRows=0;
for(const row of records){
  const publicationTier=tier(row.Approval_Gate);
  counts[publicationTier]=(counts[publicationTier]||0)+1;
  const full=sourceApproved.has(publicationTier);
  if(full)publishedOriginRows++;
  else redactedOriginRows++;
  const released=fields.map(([name,src])=>{
    const sourceValue=row[src]??'';
    if(full||identityOnly.has(name))return sourceValue;
    if(name==='transfer_status')return 'IDENTITY_ONLY__ORIGIN_REQUIRES_APPROVAL';
    if(name==='next_source_task')return 'Historical origin and economic claims require user approval before publication.';
    return '';
  });
  const values=[...released,publicationTier,expectedSource,String(expectedSheet),hash];
  const update=cols.slice(1).map(c=>c+'=excluded.'+c).join(',');
  sql.push('INSERT INTO wtw_history_org_profiles ('+cols.join(',')+') VALUES ('+
    values.map(q).join(',')+') ON CONFLICT(organization_id) DO UPDATE SET '+update+
    ',imported_at=CURRENT_TIMESTAMP;');
}
const approved=counts.USER_APPROVED_DIRECTION_ONLY||0;
const source=counts.EXISTING_APPROVED_SOURCE||0;
const research=(counts.SOURCE_ONLY_OUTLINE_PENDING_APPROVAL||0)+(counts.UNAPPROVED_ORIGIN_DETAILS||0);
if(publishedOriginRows!==10||redactedOriginRows!==98)
  throw Error('Publication approval mix changed; review every changed source approval gate');
sql.push('INSERT INTO wtw_history_org_import_manifest (source_sha256,source_spreadsheet_id,source_sheet_id,source_status,record_count,approved_direction_count,source_legacy_count,research_only_count,note) VALUES ('+
  [hash,expectedSource,String(expectedSheet),snapshot.authority.source_status,records.length,approved,source,research,
   'Drive export, not a second master. All unapproved rows remain source-tiered; never change races or user name overlays.'].map((x,i)=>i>=4&&i<=7?String(x):q(x)).join(',')+
  ') ON CONFLICT(source_sha256) DO NOTHING;');
fs.mkdirSync(out,{recursive:true});
const file=path.join(out,'30_history_org_profiles.sql');
fs.writeFileSync(file,sql.join('\n')+'\n');
const manifest={
  kind:'WTW_PRIVATE_D1_DERIVED_ORG_IMPORT_NOT_CANON',
  source:{spreadsheet_id:expectedSource,sheet_id:expectedSheet,sha256:hash,
    authority_status:snapshot.authority.source_status},
  counts:{organizations:records.length,with_origin:records.filter(x=>x.Origin_Through_1998).length,
    approved_origin_publications:publishedOriginRows,
    identity_only_origin_redactions:redactedOriginRows,
    with_stakes_year_links:records.filter(x=>
      x.Pre1999_Stakes_Season_Human_And_Breeder_Evidence.startsWith('YEAR_LEVEL_')).length,
    by_publication_tier:counts},
  rules:['DO_NOT_AUTORUN_REMOTE_SQL','DO_NOT_REWRITE_HISTORY_RESULTS',
    'DO_NOT_OVERWRITE_DISPLAY_NAME_OVERRIDES','DO_NOT_PROMOTE_QA_ORIGIN_FIELDS'],
  generated_sql:path.basename(file)
};
fs.writeFileSync(path.join(out,'history-org-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({output:file,manifest},null,2));
