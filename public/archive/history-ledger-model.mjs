/**
 * WIRE TO WIRE — read-only, source-backed History table and Year in Review.
 * No second historical database, simulated outcome, award inference or game mutation.
 * Site data is already filtered by the canonical D1 quarantine read model.
 */
const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
const fields=new Set(['year','date','race','track','winner','evidence']);
const string=value=>String(value??'').trim();
const compare=(a,b)=>collator.compare(string(a),string(b));

export function historyLedgerRows(races,winners={},options={}){
 const year=string(options.year||'all');
 const track=string(options.track||'all');
 const query=string(options.query).toLocaleLowerCase();
 const sort=fields.has(options.sort)?options.sort:'year';
 const descending=options.desc===undefined?sort==='year':Boolean(options.desc);
 const winnerFor=r=>winners instanceof Map?winners.get(r.id):winners[r.id];
 const rows=(Array.isArray(races)?races:[]).filter(r=>
  r&&Number.isInteger(Number(r.year))&&
  !String(r.status||'').startsWith('QUARANTINED')
 ).map((race,index)=>{
  const winner=winnerFor(race)||null;
  return {
   id:string(race.id),year:Number(race.year),date:string(race.date),race:string(race.name),
   track:string(race.track_name),winner:string(winner?.name),winnerId:string(winner?.horse_id),
   status:string(race.status),dateBasis:string(race.date_basis),evidence:typeof options.evidenceFor==='function'?string(options.evidenceFor(race)):string(race.date_basis||race.status),source:race,index,won:!!winner?.horse_id
  };
 }).filter(r=>(year==='all'||String(r.year)===year)&&
  (track==='all'||r.track===track)&&
  (!query||[r.id,r.race,r.track,r.winner,r.winnerId,String(r.year),r.status].some(v=>v.toLocaleLowerCase().includes(query))));
 const value=(row,key)=>key==='race'?row.race:key==='status'?row.status:row[key];
 rows.sort((a,b)=>{
  const left=value(a,sort),right=value(b,sort);
  const blankA=left===null||left===undefined||String(left)==='';
  const blankB=right===null||right===undefined||String(right)==='';
  if(blankA!==blankB)return blankA?1:-1;
  const primary=sort==='year'?a.year-b.year:compare(left,right);
  return (descending?-primary:primary)||
    b.year-a.year||compare(a.date||'9999',b.date||'9999')||
    compare(a.race,b.race)||compare(a.id,b.id)||a.index-b.index;
 });
 return rows;
}

export function historyYearSummary(year,races,winners={},awards=[]){
 const selected=Number(year);
 const rows=historyLedgerRows(races,winners,{year:selected,sort:'date',desc:false});
 const lookup=new Map(rows.map(row=>[row.race.toLocaleLowerCase(),row]));
 const classicNames=['Kentucky Derby','Preakness Stakes','Belmont Stakes'];
 const classics=classicNames.map(name=>({name,row:lookup.get(name.toLocaleLowerCase())||null}));
 const winCount=new Map();
 for(const row of rows){
  if(!row.won)continue;
  const old=winCount.get(row.winnerId)||{horse_id:row.winnerId,name:row.winner,wins:0};
  old.wins++;
  winCount.set(row.winnerId,old);
 }
 // ONLY explicitly verified, source-published awards may be shown as award winners.
 // The current D1 bootstrap has no annual award ledger; do not invent champions.
 const approved=new Set(['VERIFIED','SOURCE_VERIFIED','APPROVED_SOURCE','USER_APPROVED']);
 const verifiedAwards=(Array.isArray(awards)?awards:[]).filter(a=>
  Number(a.year)===selected&&approved.has(string(a.status).toUpperCase())&&
  string(a.category)&&string(a.winner_name)&&string(a.source_id)
 ).map(a=>({category:string(a.category),name:string(a.winner_name),
  sourceId:string(a.source_id),source:string(a.source)}));
 return {
  year:selected,rows,classics,verifiedAwards,recordedWinners:rows.filter(r=>r.won).length,
  exactDates:rows.filter(r=>r.dateBasis.toUpperCase()==='HISTORICAL_EXACT_DATE').length,
  uniqueVenues:new Set(rows.map(r=>r.track).filter(Boolean)).size,
  mostRecordedWins:[...winCount.values()].sort((a,b)=>b.wins-a.wins||compare(a.name,b.name)).slice(0,8)
 };
}
