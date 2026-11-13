/**
 * WTW Drive-v3.3 -> protected D1 geography READ-MODEL compiler.
 * No network, no source edits, no site HTML changes, no D1 mutations.
 * Input is the immutable-ID Drive export in data/geography/import/ plus the
 * already approved public track directory. Output is private SQL only.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const inputDir=path.join(root,'data/geography/import');
const trackPath=path.join(root,'public/data/track-geography-v33.json');
const outputDir=process.env.WTW_GEO_OUTPUT_DIR||path.join(root,'generated/private-d1/geography');
const batch='WTW_DRIVE_V33_GEO_2026_11_09';
const sourceURL='https://docs.google.com/spreadsheets/d/1Lhpe6DG1foQ2-zayQBg4bKpTtu4MP_itpM1zo2GRSEA/edit';
const sha=t=>crypto.createHash('sha256').update(t).digest('hex');
const sql=v=>v===null||v===undefined||v===''?'NULL':typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
const columns=['source_record_id','entity_id','entity_kind','relation_kind','effective_at','city_locality','state_region','country','place_name','travel_node','location_type','geography_status','canon_status','source_sheet','source_basis','evidence_note','metadata_json','record_sha256','import_batch'];
const counts={horse_current:0,horse_foaling:0,participant_geography:0,organization_geography:0,track_geography:0};
const seen=new Set(),records=[],files=[];
const currentHorseIDs=new Set(),foalingHorseIDs=new Set(),orgIDs=new Set();
const sourceTypes=new Map([
 ['WTW_DRIVE_V33_HORSE_CURRENT_V1','Horse_Geography'],
 ['WTW_DRIVE_V33_HORSE_FOALING_V1','Horse_Foaling_Geography'],
 ['WTW_DRIVE_V33_PARTICIPANT_GEOGRAPHY_V1','Participant_Geography'],
 ['WTW_DRIVE_V33_ORGANIZATION_GEOGRAPHY_V1','Organization_Geography']
]);
function requireValue(v,label){if(v===null||v===undefined||v==='')throw Error('Missing '+label);return String(v)}
function push(r,countKey){
 requireValue(r.source_record_id,'source record ID');
 requireValue(r.entity_id,'entity ID');
 if(seen.has(r.source_record_id))throw Error('Duplicate geographic source ID: '+r.source_record_id);
 if(!r.city_locality&&!r.state_region)throw Error('No geographic location for '+r.source_record_id);
 if(!r.country)throw Error('Country absent for '+r.source_record_id);
 seen.add(r.source_record_id);
 r.metadata_json=JSON.stringify(r.metadata||{});
 delete r.metadata;
 r.record_sha256=sha(JSON.stringify(r));
 r.import_batch=batch;
 records.push(r);
 counts[countKey]++;
}
function record(o){
 return {
 source_record_id:o.id,entity_id:o.entityId,entity_kind:o.entityKind,
 relation_kind:o.relation, effective_at:o.effective||null,
 city_locality:o.city||null,state_region:o.region||null,country:o.country||null,
 place_name:o.place||null,travel_node:o.travel||null,
 location_type:o.locationType||null,
 geography_status:o.geoStatus||null,canon_status:o.canon||null,
 source_sheet:o.sheet,source_basis:o.basis||null,evidence_note:o.note||null,
 metadata:o.metadata||{}
 };
}
const names=fs.readdirSync(inputDir).filter(n=>n.endsWith('.json')).sort();
if(names.length!==23)throw Error('Expected exactly 23 Drive geography import partitions; found '+names.length);
for(const name of names){
 const bytes=fs.readFileSync(path.join(inputDir,name));
 const data=JSON.parse(bytes.toString('utf8'));
 const tab=sourceTypes.get(data.schema);
 if(!tab||data.source!==(tab==='Horse_Geography'?'Horse_Geography JOIN Horse_Current_State ON State_ID':tab)||data.source_spreadsheet_id!=='1Lhpe6DG1foQ2-zayQBg4bKpTtu4MP_itpM1zo2GRSEA')
   throw Error('Unexpected source schema/authority in '+name);
 if(!Array.isArray(data.headers)||!Array.isArray(data.rows))throw Error('Malformed partition '+name);
 if(!data.rows.length)throw Error('Empty partition '+name);
 files.push({path:'data/geography/import/'+name,sha256:sha(bytes),records:data.rows.length});
 for(const row of data.rows){
  if(!Array.isArray(row)||row.length!==data.headers.length)throw Error('Partition row width mismatch in '+name);
  const x=Object.fromEntries(data.headers.map((h,i)=>[h,row[i]]));
  if(tab==='Horse_Geography'){
   currentHorseIDs.add(x.horse_id);
   push(record({id:x.geo_record_id,entityId:x.horse_id,entityKind:'horse',relation:'CURRENT_RESIDENCE',effective:x.effective_at,
    city:x.city_locality,region:x.state_region,country:x.country,place:x.travel_node,travel:x.travel_node,
    locationType:x.location_type,geoStatus:String(x.qa_note||'').split('|')[0],canon:x.canon_status,
    sheet:tab,basis:'Horse_Geography + Horse_Current_State; State_ID '+x.state_id,note:x.qa_note,
    metadata:{state_id:x.state_id,run_id:x.run_id,current_track_id:x.current_track_id,home_travel_node:x.home_travel_node,
     trainer_id:x.trainer_id,owner_id:x.owner_id,racing_status:x.racing_status,training_status:x.training_status,
     health_status:x.health_status,availability_status:x.availability_status}}),'horse_current');
  } else if(tab==='Horse_Foaling_Geography'){
   if(foalingHorseIDs.has(x.horse_id))throw Error('Duplicate foaling Horse_ID '+x.horse_id);
   foalingHorseIDs.add(x.horse_id);
   push(record({id:x.foaling_record_id,entityId:x.horse_id,entityKind:'horse',relation:'FOALING_LOCATION',effective:String(x.foal_year),
    city:x.city_locality,region:x.state_region,country:x.foaling_country,place:x.breeding_operation,
    locationType:'FOALING',geoStatus:x.location_granularity,canon:x.location_granularity,
    sheet:tab,basis:x.source_basis,note:x.qa_note,
    metadata:{foal_year:x.foal_year,population:x.population,breeding_operation:x.breeding_operation}}),'horse_foaling');
  } else if(tab==='Participant_Geography'){
   push(record({id:x.geo_record_id,entityId:x.person_id,entityKind:'person',relation:x.location_type,
    city:x.city_locality,region:x.state_region,country:x.country,place:x.track_name,
    locationType:x.location_type,geoStatus:x.geography_status,canon:x.geography_status,
    sheet:tab,basis:x.source_basis,note:x.notes,
    metadata:{person_name:x.name,role:x.role,track_id:x.track_id,track_name:x.track_name}}),'participant_geography');
  } else {
   orgIDs.add(x.organization_id);
   push(record({id:x.geo_record_id,entityId:x.organization_id,entityKind:'organization',relation:'ORGANIZATION_BASE',
    city:x.city_locality,region:x.state_region,country:x.country,place:x.name,travel:x.travel_node,
    locationType:x.organization_type,geoStatus:x.geography_status,canon:x.geography_status,
    sheet:tab,basis:x.source_basis,note:x.notes,
    metadata:{organization_type:x.organization_type,granularity:x.granularity,
      historical_participant_id:x.historical_participant_id}}),'organization_geography');
  }
 }
}
const trackBytes=fs.readFileSync(trackPath);
const tr=JSON.parse(trackBytes.toString('utf8'));
if(tr.schema_version!=='WTW_TRACK_GEOGRAPHY_DIRECTORY_V1'||tr.counts?.total!==118||tr.tracks?.length!==118)
 throw Error('Site track directory must contain exactly 118 approved domestic/Cuban tracks, no international tracks');
files.push({path:'public/data/track-geography-v33.json',sha256:sha(trackBytes),records:tr.tracks.length});
for(const t of tr.tracks){
 push(record({id:'TRACK-'+t.id,entityId:t.id,entityKind:'track',relation:'TRACK_LOCATION',
  city:t.city_locality,region:t.state_province_region,country:t.country,place:t.name,travel:t.travel_node,
  locationType:t.opening_state,geoStatus:t.geography_status,canon:t.geography_status,
  sheet:'Track_Geography',basis:t.source_basis,note:t.boundary_note,
  metadata:{registry:t.registry,metro_or_subregion:t.metro_or_subregion,opening_state:t.opening_state,
    foundation_status:t.foundation_status,macro_circuit:t.macro_circuit}}),'track_geography');
}
const expected={horse_current:2522,horse_foaling:2991,participant_geography:2688,organization_geography:130,track_geography:118};
for(const [k,n] of Object.entries(expected)){if(counts[k]!==n)throw Error('Wrong '+k+' count: '+counts[k]+' expected '+n);}
if(records.length!==8449||seen.size!==8449||currentHorseIDs.size!==2488||foalingHorseIDs.size!==2991||orgIDs.size!==108)
 throw Error('Unique Horse_ID, organization or global location join gate failed');
const nNorth=tr.tracks.filter(t=>t.registry==='NORTH_AMERICA').length;
const nInternational=tr.tracks.filter(t=>t.registry==='INTERNATIONAL').length;
if(nNorth!==118||nInternational!==0)throw Error('Only 118 approved North American/Cuban tracks may be in the current game location directory');
const digest=sha(files.map(f=>f.path+':'+f.sha256).join('\n')+'\n'+records.map(r=>r.record_sha256).join('\n'));
fs.mkdirSync(outputDir,{recursive:true});
const chunks=[];
for(let offset=0;offset<records.length;offset+=300){
 const part=records.slice(offset,offset+300);
 let script='-- Derived Drive v3.3 source records; no changes to history entities, races or winners.\n';
 for(let j=0;j<part.length;j+=10){
  const rows=part.slice(j,j+10);
  script+='INSERT INTO wtw_geo_read_records ('+columns.join(',')+') VALUES\n';
  script+=rows.map(r=>'('+columns.map(k=>sql(r[k])).join(',')+')').join(',\n')+';\n';
 }
 const name='geo_'+String(chunks.length+1).padStart(3,'0')+'.sql';
 fs.writeFileSync(path.join(outputDir,name),script);
 chunks.push({name,records:part.length,sha256:sha(script)});
}
const p="Drive v3.3 remains the sole canonical source; import is a protected read-only snapshot; locality evidence/canon assumptions preserved.";
const last="INSERT INTO wtw_geo_import_manifest (batch_id,source_sheet_url,source_digest_sha256,total_records,horse_current,horse_foaling,participant_geography,organization_geography,track_geography,source_policy) VALUES ("+
 [batch,sourceURL,digest,records.length,counts.horse_current,counts.horse_foaling,counts.participant_geography,counts.organization_geography,counts.track_geography,p].map(sql).join(',')+");\n";
fs.writeFileSync(path.join(outputDir,'geo_999_manifest.sql'),last);
const manifest={batch_id:batch,digest,authority_url:sourceURL,counts,total:records.length,
 unique_horses_current:currentHorseIDs.size,unique_horses_foaling:foalingHorseIDs.size,
 unique_organizations:orgIDs.size,unlocated_registered_1999_horses:503,
 tracks:{north_america:nNorth,international:nInternational},files,
 sql_chunks:chunks,source_policy:p,
 safety:"No Cloudflare import performed by this compiler. Database mutation requires separate manual, isolated, confirmed workflow."};
fs.writeFileSync(path.join(outputDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({outputDir,total:records.length,counts,digest,sqlChunks:chunks.length},null,2));
