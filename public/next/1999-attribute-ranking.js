/* Wire to Wire 1999: Stable attribute rankings. This is a VIEW over the one
 * existing world model; test attributes are not verified observations.
 * The approved horse-roster and profile implementation remain untouched. */
(()=>{
'use strict';
function render({horses,adapter,app,ownerBadge,safe}){
 const groups=adapter?.horseAttributeGroups||[];
 const defs=groups.flatMap(g=>g.definitions.map(d=>({...d,group:g.name})));
 if(!defs.length)return '<section class="ng-functional"><h2>Horse attribute data is loading…</h2></section>';
 const selected=defs.find(d=>d.key===app.stableAttributeKey)||defs[0];
 const labels=new Map(defs.map(d=>[d.key,d.label]));
 const keys=[selected.key,...['raw_speed','early_speed','late_speed','stamina','dirt_aptitude',
  'turf_aptitude','racing_intelligence','trainability','recovery_capacity']
  .filter(k=>k!==selected.key&&labels.has(k))];
 const score=(attrs,key)=>{const v=attrs?.[key];return typeof v==='number'&&Number.isFinite(v)?
  Math.round(v*99):typeof v==='string'?v:null};
 const query=String(app.stableSearch||'').toLowerCase().trim();
 const schema=[['name','HORSE'],['age','AGE'],['sex','SEX'],['status','RACING STATUS'],
  ...defs.map(d=>[d.key,d.label])];
 const criteria=window.WTW1999RosterFilters?.get(app,'Stable|Attributes')||null;
 const rows=horses.map(h=>({name:h.name,attrs:adapter.stableHorseAttributes?.(h.name)||{},
  info:adapter.sourceFacts?.(h.name)||{}}))
  .filter(h=>[h.name,h.info.connections?.owner,h.info.connections?.trainer,
   h.info.racing_status].some(t=>String(t||'').toLowerCase().includes(query)))
  .filter(h=>!criteria||window.WTW1999RosterFilters.matches({name:h.name,age:h.info.age,
   sex:h.info.sex,status:h.info.racing_status,
   ...Object.fromEntries(Object.keys(h.attrs).map(k=>[k,score(h.attrs,k)]))},criteria));
 const sort=app.stableAttributeSort||selected.key;
 rows.sort((a,b)=>{
  const value=h=>sort==='name'?h.name:sort==='age'?Number(h.info.age):sort==='sex'?h.info.sex:
   sort==='status'?h.info.racing_status:score(h.attrs,sort);
  const x=value(a),y=value(b);
  if(x==null)return y==null?a.name.localeCompare(b.name):1;
  if(y==null)return -1;
  const n=typeof x==='number'&&typeof y==='number'?x-y:
   String(x).localeCompare(String(y),undefined,{numeric:true,sensitivity:'base'});
  return (app.stableAttributeDesc?-n:n)||a.name.localeCompare(b.name);
 });
 const th=(key,label)=>'<th><button data-ng="stable-attribute-sort" data-val="'+safe(key)+'" title="Sort by '+safe(label)+'">'+
  safe(label)+'<span class="ng-rs-sort">'+(app.stableAttributeSort===key?(app.stableAttributeDesc?'▼':'▲'):'↕')+'</span></button></th>';
 const meter=v=>{
  if(v==null)return '<span class="ng-rs-missing">—</span>';
  if(typeof v!=='number')return safe(v);
  const band=v>=75?'high':v>=55?'good':v>=35?'moderate':'low';
  return '<span class="ng-attr-score ability-'+band+'"><span class="ng-attr-track"><i style="width:'+v+'%"></i></span><b>'+v+'</b></span>';
 };
 const tbody=rows.map(h=>'<tr class="ng-wtw-roster-row" data-search="'+safe([h.name,h.info.connections?.owner,
  h.info.connections?.trainer,h.info.racing_status].join(' ').toLowerCase())+'"><td class="ng-rs-first">'+
  '<button data-ng="horse" data-val="'+safe(h.name)+'" class="ng-rs-horse">'+ownerBadge(h.name)+
  '<span>'+safe(h.name)+'</span></button></td><td>'+safe(h.info.age||'—')+'</td><td>'+
  safe(h.info.sex||'—')+'</td><td>'+safe(String(h.info.racing_status||'Not recorded').replaceAll('_',' '))+
  '</td>'+keys.map(k=>'<td>'+meter(score(h.attrs,k))+'</td>').join('')+'</tr>').join('');
 const options=groups.map(g=>'<optgroup label="'+safe(g.name)+'">'+g.definitions.map(d=>
  '<option value="'+safe(d.key)+'" '+(d.key===selected.key?'selected':'')+'>'+safe(d.label)+'</option>').join('')+
  '</optgroup>').join('');
 const filters=[['all','ALL'],['vet','VET WATCH'],['ready','READY'],['attributes','ATTRIBUTES'],
  ['targets','WITH TARGET'],['entered','ENTERED'],['unassigned','NO TARGET']].map(([value,label])=>
  '<button data-ng="stable-filter" data-val="'+value+'" class="'+(value===app.stableFilter?'on':'')+'">'+label+'</button>').join('');
 return '<section class="ng-functional ng-stable-roster-v2 ng-stable-attributes">'+
  '<div class="ng-rs-title"><strong>STABLE & HORSES</strong><span>'+horses.length+
  ' HORSES · TEST ATTRIBUTE COMPARISON</span><button data-ng="stable-filter" data-val="all">← HORSE ROSTER</button></div>'+
  '<div class="ng-rs-tools"><label for="ngStableSearch">SEARCH</label><input id="ngStableSearch" type="search" data-ng-input="stable-search" value="'+
  safe(app.stableSearch)+'" placeholder="Horse, owner, trainer…" autocomplete="off"/><div class="ng-rs-filters">'+filters+'</div></div>'+
  '<div class="ng-attribute-picker"><label for="ngSelectedAttribute">SORT BY ATTRIBUTE</label>'+
  '<select id="ngSelectedAttribute" data-ng-select="stable-attribute">'+options+'</select><span>'+safe(selected.group)+
  ' · SIMULATED TEST SCORES · NOT OBSERVED SCOUTING</span></div>'+
  (window.WTW1999RosterFilters?.render(schema,criteria,safe,'Stable|Attributes')||'')+
  '<section class="ng-rs-roster"><header><strong>HORSE ATTRIBUTE RANKINGS</strong><span class="ng-stable-visible">'+rows.length+
  ' OF '+horses.length+' HORSES · CLICK HEADINGS TO SORT</span></header>'+
  '<div class="ng-rs-scroll" tabindex="0" aria-label="Sortable horse attributes"><table class="ng-rs-table ng-attr-table">'+
  '<thead><tr>'+th('name','HORSE')+th('age','AGE')+th('sex','SEX')+th('status','RACING STATUS')+
  keys.map(k=>th(k,labels.get(k)||k)).join('')+'</tr></thead><tbody>'+tbody+
  '</tbody></table></div><div class="ng-rs-legend">SIMULATED 1999 TEST TRAITS · NO SCOUTING CERTIFICATION · ALL HORSES LINK TO EXISTING PROFILES</div></section></section>';
}
window.WTW1999AttributeRanking=Object.freeze({render});
})();