/* WIRE TO WIRE: January 1999 selected-world registry search worker.
 * Owns the global sortable/searchable index OFF the rendering thread.
 * Only returns one visible page. No full 325k snapshot is persisted by the UI.
 * The existing game authority, IDs, and career-save schema are unchanged. */
import {readLocal1999World} from '/1999/engine/local-api.mjs?rev=wtw1999-clean73-20261113-r1';

const worldOptions=new URLSearchParams(self.location?.search||'');
const population=worldOptions.get('population')||'325000';
const seed=worldOptions.get('seed')||'19990101';
const mode=worldOptions.get('mode')||'CANON_ANCHORED_TEST';
const queryOptions='seed='+encodeURIComponent(seed)+'&mode='+encodeURIComponent(mode)+
 '&population='+encodeURIComponent(population);
const q=(path,args='')=>readLocal1999World(path+'?'+queryOptions+(args?'&'+args:''));
const pageSize=100,yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0));
const counts=q('/api/1999/sim/overview').counts;
const populationCount=counts.worldHorses||counts.horses;
let records=[],loaded=0,ready=false,loading=null,labels=null;
let pending=null,draining=false,lastSort=null;
const cachedTraits=new Map();
const text=v=>String(v??'').replaceAll('_',' ').toLowerCase().trim();
const int=(v,low,high,base)=>Number.isFinite(Number(v))?Math.max(low,Math.min(high,Math.trunc(Number(v)))):base;

async function buildIndex(){
 if(ready)return;
 if(loading)return loading;
 loading=(async()=>{
  while(loaded<populationCount){
   const response=q('/api/1999/sim/world-horse-directory',
    'offset='+loaded+'&limit='+Math.min(pageSize,populationCount-loaded));
   const items=response.items||[];
   if(!items.length)throw Error('World index ended at '+loaded+' of '+populationCount);
   records.push(...items);loaded+=items.length;
   if(loaded%10000<pageSize||loaded===populationCount)
    self.postMessage({type:'progress',loaded,total:populationCount});
   if(loaded%1000<pageSize)await yieldTask();
  }
  const mapFor=(type,count)=>{
   const result=new Map();
   for(let offset=0;offset<count;offset+=100){
    const r=q('/api/1999/sim/'+type,'offset='+offset+'&limit=100');
    for(const x of r.items||[])result.set(x.id,x.name);
   }
   return result;
  };
  labels={
   owners:mapFor('owners',counts.owners),trainers:mapFor('trainers',counts.trainers),
   tracks:mapFor('tracks',counts.tracks)
  };
  ready=true;
  self.postMessage({type:'index-ready',loaded,total:populationCount});
 })();
 return loading;
}
function labelled(row,key){
 if(key==='owner')return labels.owners.get(row.ownerId)||row.ownerId||'';
 if(key==='breeder')return labels.owners.get(row.breederId)||row.breederId||'';
 if(key==='trainer')return labels.trainers.get(row.trainerId)||row.trainerId||'';
 if(key==='track')return labels.tracks.get(row.trackId)||row.trackId||'';
 if(key==='homebred')return row.homebred?'YES':'NO';
 return row[key];
}
async function ensureTrait(key){
 if(!key)return true;
 let state=cachedTraits.get(key);
 if(!state){
  // Keep only two selected traits: 325k x 53 full vectors are never cached.
  if(cachedTraits.size>=2)cachedTraits.delete(cachedTraits.keys().next().value);
  state={progress:0,values:new Array(populationCount),done:false};
  cachedTraits.set(key,state);
 }
 if(state.done)return true;
 while(state.progress<populationCount){
  if(pending&&pending.query.attributeKey!==key)return false;
  const page=q('/api/1999/sim/world-horse-attribute',
   'key='+encodeURIComponent(key)+'&offset='+state.progress+'&limit=100');
  if(!page.items?.length)throw Error('Attribute index stopped at '+state.progress);
  for(const item of page.items)state.values[item.index]=item.value;
  state.progress+=page.items.length;
  if(state.progress%10000<100||state.progress===populationCount)
   self.postMessage({type:'progress',loaded:state.progress,total:populationCount,attributeKey:key});
  if(state.progress%1000<100)await yieldTask();
 }
 state.done=true;lastSort=null;
 return true;
}
function filterRow(row,needle,filters){
 const ageMin=filters.ageMin===''||filters.ageMin==null?null:Number(filters.ageMin);
 const ageMax=filters.ageMax===''||filters.ageMax==null?null:Number(filters.ageMax);
 if(ageMin!==null&&(row.age==null||row.age<ageMin))return false;
 if(ageMax!==null&&(row.age==null||row.age>ageMax))return false;
 if(filters.sex&&text(row.sex)!==text(filters.sex))return false;
 if(filters.status&&!text(row.status).includes(text(filters.status)))return false;
 if(filters.field&&filters.query&&!text(labelled(row,filters.field)).includes(text(filters.query)))return false;
 if(needle&&!['name','id','owner','breeder','trainer','track','sire','dam','status','registryGroup']
  .some(k=>text(labelled(row,k)).includes(needle)))return false;
 return true;
}
function compare(av,bv,sign){
 const missing=v=>v==null||v==='';
 const am=missing(av),bm=missing(bv);
 if(am||bm)return am===bm?0:am?1:-1;
 const n=typeof av==='number'&&typeof bv==='number'?av-bv:
  String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:'base'});
 return sign*n;
}
function resultPage(query){
 const {offset=0,limit=160,search='',sort='name',desc=false,filters={},attributeKey=''}=query;
 const trait=attributeKey&&cachedTraits.get(attributeKey)?.done?attributeKey:'';
 const sortField=String(sort||'name');
 const sortKey=sortField.startsWith('attr:')&&sortField.slice(5)===trait?sortField:
  ['name','age','sex','sire','dam','owner','breeder','homebred','trainer','track','status','registryGroup','ca','pa'].includes(sortField)?sortField:'name';
 const key=JSON.stringify([search,sortKey,desc,filters,trait]);
 if(!lastSort||lastSort.key!==key){
  const needle=text(search),sign=desc?-1:1;
  const candidates=[];
  for(let i=0;i<records.length;i++){
   if(filterRow(records[i],needle,filters))candidates.push(i);
  }
  const value=i=>sortKey.startsWith('attr:')?cachedTraits.get(trait)?.values[i]:
   labelled(records[i],sortKey);
  candidates.sort((a,b)=>compare(value(a),value(b),sign)||a-b);
  lastSort={key,indices:candidates};
 }
 const indexes=lastSort.indices;
 const start=int(offset,0,indexes.length,0),length=int(limit,1,200,160);
 const items=indexes.slice(start,start+length).map(i=>{
  const h=records[i];
  return {_directoryIndex:h.index,_kind:'horse',_name:h.name,_id:h.id,
   _canonId:h.canonical?h.id:'',_worldKey:h.canonical?'horse:'+h.id:undefined,
   _testGenerated:!h.canonical,name:h.name,age:String(h.age??''),sex:h.sex||'',
   sire:h.sire||h.sireId||'',dam:h.dam||h.damId||'',
   owner:labelled(h,'owner'),breeder:labelled(h,'breeder'),
   homebred:h.homebred?'YES':'NO',trainer:labelled(h,'trainer'),
   track:labelled(h,'track'),status:String(h.status||'').replaceAll('_',' '),
   ca:String(h.ca??''),pa:String(h.pa??''),
   registryGroup:String(h.registryGroup||'REGISTERED').replaceAll('_',' '),
   ...(trait?{['attr:'+trait]:cachedTraits.get(trait).values[i]}:{})};
 });
 return {total:indexes.length,loaded:populationCount,items,indexing:false,progress:populationCount};
}
async function drain(){
 if(draining)return;
 draining=true;
 try{
  while(pending){
   const cmd=pending;pending=null;
   await buildIndex();
   if(pending)continue;
   const trait=cmd.query.attributeKey||'';
   if(trait&&!await ensureTrait(trait))continue;
   if(pending)continue;
   self.postMessage({type:'result',requestId:cmd.requestId,
    result:resultPage(cmd.query)});
  }
 }catch(error){
  self.postMessage({type:'error',message:String(error?.message||error)});
 }finally{draining=false;if(pending)drain()}
}
self.onmessage=event=>{
 const data=event.data||{};
 if(data.type==='browse'){
  pending={requestId:data.requestId,query:data.query||{}};
  drain();
 }
};
