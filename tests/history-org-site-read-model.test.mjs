import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {api} from '../src/worker.js';

const snapshot=JSON.parse(fs.readFileSync('data/history-source/canon-registry-2026-11-10/organization-economic-history.json','utf8'));
const headers=snapshot.headers;
const rowObj=x=>Object.fromEntries(headers.map((h,i)=>[h,x[i]||'']));
const fakeRows=snapshot.rows.map(x=>{
 const r=rowObj(x),approved=/^(USER_LOCKED_NARRATIVE_TRAJECTORY|EXISTING_WORLD_BIBLE_SOURCE)/.test(r.Approval_Gate);
 return {
  organization_id:r.Organization_ID,canonical_name:r.Canonical_Name,
  organization_type:r['1999_Organization_Type'],canonical_geography:r.Canon_Geographic_Base,
  publication_tier:approved?'EXISTING_APPROVED_SOURCE':'UNAPPROVED_ORIGIN_DETAILS',
  origin_through_1998:r.Origin_Through_1998,
  historical_prestige:r.Historic_Prestige_1999,
  financial_vulnerability:r.Financial_Vulnerability_1999,
  historical_year_links:r.Pre1999_Stakes_Season_Human_And_Breeder_Evidence
 };
});
function mockDb(exists=true,changed=false){
 return {prepare(sql){
  return {
   bind(id){this.orgId=id;return this;},
   async first(){return exists?{name:'wtw_history_org_profiles'}:null;},
   async all(){
    if(sql.includes('FROM wtw_history_org_profiles')){
      if(sql.includes('WHERE organization_id='))return {results:fakeRows.filter(x=>x.organization_id===this.orgId)};
      if(changed)return {results:fakeRows.slice(0,107)};
      return {results:fakeRows};
    }
    return {results:[]};
   }
  };
 }};
}
test('organization API returns all 108 private source IDs, only 10 approved narratives',async()=>{
 const resp=await api(new Request('http://localhost/api/history/organizations'),{DB:mockDb()},'admin@example.com');
 assert.equal(resp.status,200);
 const d=await resp.json();
 assert.equal(d.organizations.length,108);
 assert.equal(d.approved_origin_count,10);
 assert.equal(d.identity_only_count,98);
 const king=d.organizations.find(x=>x.organization_id==='O-000061');
 assert.equal(king.historical_prestige,'ELITE_HISTORIC_GOLD_STANDARD');
 const pending=d.organizations.find(x=>x.organization_id==='O-000019');
 assert.equal(pending.origin_publication_status,'ORIGIN_AWAITING_OWNER_APPROVAL');
 assert.equal(pending.origin_through_1998,null);
 assert.equal(pending.historical_prestige,null);
 assert.match(pending.recorded_associations_only,/NOT race-day/);
});
test('only canonical organization ID can open historic profile; never allow writes',async()=>{
 const good=await api(new Request('http://localhost/api/history/organizations/O-000061'),{DB:mockDb()},'admin@example.com');
 assert.equal(good.status,200);
 assert.equal((await good.json()).organization.canonical_name,'Kingsmere Farm');
 const bad=await api(new Request('http://localhost/api/history/organizations/O-999999'),{DB:mockDb()},'admin@example.com');
 assert.equal(bad.status,404);
 const write=await api(new Request('http://localhost/api/history/organizations',{method:'POST'}),{DB:mockDb()},'admin@example.com');
 assert.equal(write.status,404);
});
test('organization read model fails closed if database import is missing or count drifts',async()=>{
 const req=new Request('http://localhost/api/history/organizations');
 const missing=await api(req,{DB:mockDb(false)},'admin@example.com');
 assert.equal(missing.status,503);
 const drift=await api(req,{DB:mockDb(true,true)},'admin@example.com');
 assert.equal(drift.status,503);
});
test('People and Farms uses existing UI components for the source-approved 1999 profiles',()=>{
 const app=fs.readFileSync('public/app.js','utf8');
 assert.match(app,/function renderPeople\(\)/);
 assert.match(app,/Organizations entering 1999/);
 assert.match(app,/data-history-org/);
 assert.match(app,/history-org/);
 assert.match(app,/origin_publication_status==='APPROVED_SOURCE_HISTORY'/);
 assert.match(app,/awaiting background approval/);
 assert.match(app,/WTW Canon Registry is the editable authority/);
 assert.doesNotMatch(app,/sourceApproved\.has.*=true/);
});
