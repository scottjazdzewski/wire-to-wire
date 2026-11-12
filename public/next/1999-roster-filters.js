/* WTW 1999 — shared column filters for lists. Never changes game records. */
(()=>{
'use strict';
const normalize=v=>String(v??'').replaceAll('_',' ').trim().toLowerCase();
const number=v=>{const n=Number(String(v??'').replace(/[$,%]/g,'').replaceAll(',','').trim());
 return Number.isFinite(n)?n:null;};
const initial=()=>({field:'',query:'',ageMin:'',ageMax:'',sex:'',status:''});
const get=(app,scope)=>{
 if(!app.rosterFilters||typeof app.rosterFilters!=='object')app.rosterFilters={};
 if(!app.rosterFilters[scope])app.rosterFilters[scope]=initial();
 return app.rosterFilters[scope];
};
function matches(row,criteria){
 if(!criteria)return true;
 const ageValue=number(row.age);
 if(criteria.ageMin!==''&&(ageValue===null||ageValue<Number(criteria.ageMin)))return false;
 if(criteria.ageMax!==''&&(ageValue===null||ageValue>Number(criteria.ageMax)))return false;
 if(criteria.sex&&normalize(row.sex)!==normalize(criteria.sex))return false;
 const status=normalize(row.status??row.racingStatus1999??row.activity??row.ready);
 if(criteria.status&&!status.includes(normalize(criteria.status)))return false;
 if(criteria.field&&criteria.query){
  const actual=row[criteria.field];
  const query=String(criteria.query).trim();
  if(!normalize(actual).includes(normalize(query))){
   const qNum=number(query),actualNum=number(actual);
   if(qNum===null||actualNum===null||qNum!==actualNum)return false;
  }
 }
 return true;
}
function render(schema,criteria,safe,scope){
 const fields=schema||[];
 const keyOptions=fields.map(([key,label])=>'<option value="'+safe(key)+'" '+
  (criteria.field===key?'selected':'')+'>'+safe(label)+'</option>').join('');
 const withAge=fields.some(([k])=>k==='age');
 const withSex=fields.some(([k])=>k==='sex');
 const withStatus=fields.some(([k])=>['status','activity','readiness'].includes(k));
 const val=(k)=>safe(criteria[k]||'');
 return '<div class="ng-list-filters" data-filter-scope="'+safe(scope)+'" aria-label="Filter roster columns">'+
  '<label>COLUMN <select data-ng-select="roster-filter-field"><option value="">Choose column</option>'+keyOptions+'</select></label>'+
  '<label>CONTAINS <input type="search" data-ng-input="roster-filter-query" value="'+val('query')+'" placeholder="Text or number"/></label>'+
  (withAge?'<label>AGE FROM <input type="number" min="0" max="40" data-ng-input="roster-filter-ageMin" value="'+val('ageMin')+'"/></label>'+
  '<label>TO <input type="number" min="0" max="40" data-ng-input="roster-filter-ageMax" value="'+val('ageMax')+'"/></label>':'')+
  (withSex?'<label>SEX <select data-ng-select="roster-filter-sex"><option value="">All</option>'+
   ['COLT','FILLY','GELDING','MARE','STALLION','HORSE','C','F','G','M','H'].map(x=>
   '<option value="'+x+'" '+(criteria.sex===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>':'')+
  (withStatus?'<label>STATUS <select data-ng-select="roster-filter-status"><option value="">All</option>'+
   ['IN TRAINING','AT STUD','BROODMARE','RETIRED','RESTING','UNRACED','TOO YOUNG','ACTIVE','COVERED','AVAILABLE','PRE-RACE'].map(x=>
   '<option value="'+x+'" '+(criteria.status===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>':'')+
  '<button type="button" data-ng="roster-filter-clear">CLEAR FILTERS</button></div>';
}
window.WTW1999RosterFilters=Object.freeze({get,matches,render,initial});
})();