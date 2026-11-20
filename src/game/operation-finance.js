/**
 * V10 business finance projection. One canonical game-run finance ledger and
 * the *existing* O-ID/H-ID relationships are the only monetary and title
 * authorities. This is read-only: no duplicated screen balance or fake revenue.
 */
import {ensure,worldIdentity,validDate} from './contracts.js';

export const OPERATION_FINANCE_VIEW_SCHEMA='WTW_GAME_OPERATION_FINANCE_VIEW_V1';
const safe=Number.isSafeInteger;
const GROUPS=Object.freeze([
 'HORSE_SALES','STUD_SERVICES','HORSE_CARE','FACILITY_OPERATIONS',
 'FACILITY_CAPITAL','RACING','SHIPPING','OTHER'
]);
const groupFor=kind=>{
 if(kind==='FACILITY_PURCHASE'||kind==='FACILITY_UPGRADE')
  return 'FACILITY_CAPITAL';
 if(kind.startsWith('FACILITY_'))return 'FACILITY_OPERATIONS';
 if(kind.startsWith('HORSE_SALE_'))return 'HORSE_SALES';
 if(kind.startsWith('STUD_SERVICE_'))return 'STUD_SERVICES';
 if(kind.startsWith('HORSE_CARE_'))return 'HORSE_CARE';
 if(kind.startsWith('RACE_')||kind.startsWith('JOCKEY_'))return 'RACING';
 if(kind.startsWith('HORSE_SHIPPING_')||kind.startsWith('SHIPPING_')||
  kind.startsWith('CARRIER_'))return 'SHIPPING';
 return 'OTHER';
};
const fresh=()=>({incoming_minor:0,outgoing_minor:0,net_minor:0,entries:0});
const sumRow=(target,row)=>{
 target.net_minor+=row.amount_minor;
 if(row.amount_minor>=0)target.incoming_minor+=row.amount_minor;
 else target.outgoing_minor-=row.amount_minor;
 target.entries++;
 for(const key of ['net_minor','incoming_minor','outgoing_minor'])
  ensure(safe(target[key]),'OPERATION_FINANCE_VALUE','Business cash total overflow');
};

/**
 * Compute current legal title without double counting its immutable source
 * twin when an active H-GAME registration represents the same physical horse.
 * Stable management and physical care do not create a legal ownership right.
 */
export function operationRelationshipCounts(state,world,operationId){
 ensure(Boolean(worldIdentity(world,'organizations',operationId)),
  'OPERATION_FINANCE_OWNER','Real O-ID operation required');
 const bySource=new Map();
 for(const r of Object.values(state.runtime.registered_horses?.by_id||{}))
  if(r.world_source_horse_id)bySource.set(r.world_source_horse_id,r);
 const changes=state.runtime.ownership?.owner_overrides||{};
 const counts={legally_owned:0,managed:0,managed_non_owned:0,
  physically_boarded:0,training_barn:0,bred:0,foaled_at:0};
 for(const h of world.entities.horses){
  const active=bySource.get(h.id);
  const owner=active?.owner_organization_id||
   changes[h.id]?.owner_id||h.ownerId||h.owner_id||null;
  if(owner===operationId)counts.legally_owned++;
  if(h.managementOrganizationId===operationId){
   counts.managed++;if(owner!==operationId)counts.managed_non_owned++;
  }
  if(h.careFacilityId===operationId)counts.physically_boarded++;
  if(h.trainingBarnId===operationId)counts.training_barn++;
  if(h.breederId===operationId)counts.bred++;
  if(h.foalingFarmId===operationId)counts.foaled_at++;
 }
 // Created registered game horses without a source H-ID are new animals;
 // source-linked runners already counted exactly once above.
 for(const r of Object.values(state.runtime.registered_horses?.by_id||{}))
  if(!r.world_source_horse_id&&r.owner_organization_id===operationId)
   counts.legally_owned++;
 return counts;
}
function financialOpeningBaseline(state,operationId){
 const modeled=state.runtime.finances.opening_capital_audit?.[operationId];
 if(modeled&&safe(modeled.opening_cash_minor)&&modeled.opening_cash_minor>=0)
  return {opening_cash_minor:modeled.opening_cash_minor,
   basis:modeled.basis||'MODELED_GAME_OPENING_WORKING_CAPITAL'};
 const seeded=state.event_log.find(x=>x.kind==='FACILITY_FUNDS_ESTABLISHED'&&
  x.details?.operation_id===operationId);
 if(seeded&&safe(seeded.details.balance_minor))
  return {opening_cash_minor:seeded.details.balance_minor,
   basis:seeded.details.source_kind||'GAME_GENERATOR_SEEDED_FUNDS'};
 return {opening_cash_minor:null,basis:'OPENING_SOURCE_NOT_RECORDED_IN_RUN'};
}
/**
 * Cash amounts are cents. A missing opening balance is honest "not
 * verifiable", never a falsely green reconciled balance. The view includes
 * *all* ledger kinds for the O-ID, not just its known fee categories, so
 * game-earnings and future supported flows cannot silently disappear.
 */
export function getOperationFinanceView(state,world,operationId,{
 from=null,to=null,limit=20
}={}){
 const operation=worldIdentity(world,'organizations',operationId);
 ensure(Boolean(operation),'OPERATION_FINANCE_OWNER',
  'Finance view requires an approved organization O-ID');
 const end=to||state.clock.date,start=from||end.slice(0,7)+'-01';
 ensure(validDate(start)&&validDate(end)&&
  start>=world.start_date&&start<=end&&end<=state.clock.date,
  'OPERATION_FINANCE_DATE','Finance period must be within saved game dates');
 ensure(safe(limit)&&limit>=0&&limit<=100,
  'OPERATION_FINANCE_PAGE','Recent ledger page must contain at most 100 lines');
 const totals=fresh(),groups=Object.fromEntries(GROUPS.map(g=>[g,fresh()]));
 const kinds=Object.create(null),recent=[];
 let allTimeNet=0,totalRows=0;
 for(const row of state.runtime.finances.ledger){
  if(row.operation_id!==operationId)continue;
  ensure(safe(row.amount_minor)&&typeof row.kind==='string'&&validDate(row.date)&&
   row.date<=state.clock.date,
   'OPERATION_FINANCE_LEDGER','Operation ledger has invalid cash entry');
  allTimeNet+=row.amount_minor;totalRows++;
  ensure(safe(allTimeNet),'OPERATION_FINANCE_VALUE','Lifetime cash balance overflow');
  if(row.date<start||row.date>end)continue;
  sumRow(totals,row);
  sumRow(groups[groupFor(row.kind)],row);
  if(!kinds[row.kind])kinds[row.kind]=fresh();
  sumRow(kinds[row.kind],row);
  if(limit){
   recent.push({date:row.date,kind:row.kind,amount_minor:row.amount_minor,
    horse_id:row.horse_id??null,site_id:row.site_id??null,
    transaction_id:row.transaction_id??null});
   if(recent.length>limit)recent.shift();
  }
 }
 const opening=financialOpeningBaseline(state,operationId);
 const cash=state.runtime.finances.operation_balances_minor?.[operationId];
 const knownCash=safe(cash);
 const expected=opening.opening_cash_minor===null?null:
  opening.opening_cash_minor+allTimeNet;
 const discrepancy=expected===null||!knownCash?null:cash-expected;
 const status=expected===null||!knownCash?'UNKNOWN_BASELINE_OR_CASH':
  !safe(expected)||!safe(discrepancy)?'INVALID_FINANCIAL_RANGE':
  discrepancy===0?'RECONCILED':'DISCREPANCY';
 const sites=Object.values(state.runtime.facilities?.sites||{}).
  filter(x=>(x.operator_organization_id||x.owner_id)===operationId);
 const claims=sites.reduce((n,x)=>n+(x.unpaid_liability_minor||0),0);
 ensure(safe(claims)&&claims>=0,'OPERATION_FINANCE_VALUE',
  'Invalid unpaid operating liabilities');
 const holds=operationRelationshipCounts(state,world,operationId);
 return {schema:OPERATION_FINANCE_VIEW_SCHEMA,
  operation_id:operationId,operation_name:operation.name,
  as_of:state.clock.date,from:start,to:end,currency:'MINOR_UNITS',
  current_cash_minor:knownCash?cash:null,
  opening_cash_minor:opening.opening_cash_minor,opening_basis:opening.basis,
  lifetime_ledger_net_minor:allTimeNet,lifetime_ledger_entries:totalRows,
  expected_cash_minor:expected,cash_discrepancy_minor:discrepancy,
  cash_reconciliation_status:status,
  current_unpaid_facility_liabilities_minor:claims,
  insolvent_facilities:sites.filter(s=>s.status==='INSOLVENT').map(x=>x.id),
  legal_vs_managed:holds,period_cash:totals,
  category_cash:groups,kind_cash:kinds,recent_entries:recent.reverse(),
  provenance:'ONE_GAME_RUN_ONE_LEDGER_AND_EXISTING_LEGAL_RELATIONSHIPS'};
}
