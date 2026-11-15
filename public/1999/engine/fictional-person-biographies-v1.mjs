/**
 * Complete reproducible biographies for people proposed by the established
 * fictional identity factory. This enriches identity records; it does not
 * create names, alter source canon, or create game state.
 */
const SCHEMA='WTW_FICTIONAL_PERSON_BIOGRAPHIES_V1';
const BIRTHPLACES=Object.freeze({
 US:[['Lexington','Kentucky'],['Louisville','Kentucky'],['Baltimore','Maryland'],['New Orleans','Louisiana'],['Chicago','Illinois'],['San Diego','California'],['Saratoga Springs','New York'],['Ocala','Florida'],['Philadelphia','Pennsylvania'],['Boston','Massachusetts']],
 CA:[['Toronto','Ontario'],['Montreal','Quebec'],['Vancouver','British Columbia'],['Calgary','Alberta']],
 GB:[['Newmarket','Suffolk'],['London','England'],['York','England'],['Edinburgh','Scotland']],
 IE:[['Dublin','Leinster'],['Cork','Munster'],['Galway','Connacht']],
 PR:[['San Juan','Puerto Rico'],['Ponce','Puerto Rico'],['Mayagüez','Puerto Rico']],
 PA:[['Panama City','Panamá'],['David','Chiriquí'],['Colón','Colón']],
 VE:[['Caracas','Distrito Capital'],['Maracaibo','Zulia'],['Valencia','Carabobo']],
 MX:[['Mexico City','Ciudad de México'],['Guadalajara','Jalisco'],['Monterrey','Nuevo León']],
 CL:[['Santiago','Región Metropolitana'],['Valparaíso','Valparaíso'],['Concepción','Biobío']],
 PE:[['Lima','Lima'],['Arequipa','Arequipa'],['Trujillo','La Libertad']],
 CO:[['Bogotá','Bogotá D.C.'],['Medellín','Antioquia'],['Cali','Valle del Cauca']],
 DO:[['Santo Domingo','Distrito Nacional'],['Santiago de los Caballeros','Santiago'],['La Vega','La Vega']],
 AR:[['Buenos Aires','Buenos Aires'],['Córdoba','Córdoba'],['Rosario','Santa Fe']],
 BR:[['Rio de Janeiro','Rio de Janeiro'],['São Paulo','São Paulo'],['Porto Alegre','Rio Grande do Sul']],
 UY:[['Montevideo','Montevideo'],['Salto','Salto'],['Paysandú','Paysandú']],
 FR:[['Paris','Île-de-France'],['Lyon','Auvergne-Rhône-Alpes'],['Deauville','Normandy']],
 DE:[['Berlin','Berlin'],['Hamburg','Hamburg'],['Cologne','North Rhine-Westphalia']],
 JP:[['Tokyo','Tokyo'],['Kyoto','Kyoto'],['Sapporo','Hokkaido']],
 AU:[['Sydney','New South Wales'],['Melbourne','Victoria'],['Brisbane','Queensland']],
 NZ:[['Auckland','Auckland'],['Wellington','Wellington'],['Christchurch','Canterbury']],
 AE:[['Abu Dhabi','Abu Dhabi'],['Dubai','Dubai'],['Al Ain','Abu Dhabi']],
 HK:[['Hong Kong','Hong Kong'],['Kowloon','Hong Kong'],['Sha Tin','Hong Kong']]
});
const COUNTRY_NAMES=Object.freeze({US:'United States',CA:'Canada',GB:'United Kingdom',IE:'Ireland',PR:'Puerto Rico',PA:'Panama',VE:'Venezuela',MX:'Mexico',CL:'Chile',PE:'Peru',CO:'Colombia',DO:'Dominican Republic',AR:'Argentina',BR:'Brazil',UY:'Uruguay',FR:'France',DE:'Germany',JP:'Japan',AU:'Australia',NZ:'New Zealand',AE:'United Arab Emirates',HK:'Hong Kong'});
const hash=(seed,key)=>{let h=(2166136261^(seed>>>0))>>>0;for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>16;return h>>>0};
const validDate=date=>typeof date==='string'&&/^\d{4}-\d\d-\d\d$/.test(date)&&!Number.isNaN(Date.parse(date+'T00:00:00Z'))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;
function birthday(seed,id,year){
 const leap=year%4===0&&(year%100!==0||year%400===0),days=leap?366:365;
 const day=hash(seed,'birthday:'+id)%days,d=new Date(Date.UTC(year,0,1));d.setUTCDate(day+1);
 return d.toISOString().slice(5,10);
}
function ageAt(dateOfBirth,asOf){
 let age=Number(asOf.slice(0,4))-Number(dateOfBirth.slice(0,4));
 if(dateOfBirth.slice(5)>asOf.slice(5))age--;
 return age;
}

/**
 * Returns world-person records ready for a WTW_WORLD_SNAPSHOT_V1 entity list.
 * Names and work locations are copied from the existing identity engine.
 * Birthplace is an explicitly modeled fictional fact, separate from work base.
 */
export function completeFictionalPersonBiographiesV1({people,seed,openingDate='1999-01-01'}={}){
 if(!Array.isArray(people)||!Number.isSafeInteger(seed)||seed<1||seed>4294967295||!validDate(openingDate))
  throw Error('A people roster, positive 32-bit seed and valid opening date are required');
 const used=new Set();
 const records=people.map(person=>{
  if(!person||typeof person.id!=='string'||!person.id||typeof person.name!=='string'||!person.name.trim()||!Number.isInteger(person.birthYear)||!Number.isInteger(person.ageAtOpening)||typeof person.birthCountry!=='string')
   throw Error('Fictional person is missing its stable identity, name, age or birth origin');
  if(used.has(person.id))throw Error('Duplicate fictional person identity: '+person.id);
  used.add(person.id);
  const countryCode=person.birthCountry.toUpperCase(),places=BIRTHPLACES[countryCode];
  if(!places)throw Error('No locally modeled birthplace pool for '+countryCode);
  const asOfYear=Number(openingDate.slice(0,4));
  const mmdd=birthday(seed,person.id,asOfYear);
  // Keep the existing identity engine's opening age exact for any birthday.
  const birthdayAfterOpening=mmdd>openingDate.slice(5);
  const birthYear=asOfYear-person.ageAtOpening-(birthdayAfterOpening?1:0);
  const birth_date=birthYear+'-'+mmdd;
  const birthplace=places[hash(seed,'birthplace:'+person.id)%places.length];
  const role=String(person.role||'').trim().toLowerCase().replace(/\s+/g,'_');
  if(!role)throw Error('Fictional person is missing a gameplay role: '+person.id);
  const id='P-'+person.id.replace(/^WTWFI-/,'').replaceAll('_','-');
  if(!/^P-[A-Za-z0-9-]+$/.test(id))throw Error('Generated person ID is incompatible with the game world schema');
  return {
   id,name:person.name,role,roles:[role],
   date_of_birth:birth_date,
   birthplace:{city:birthplace[0],region:birthplace[1],country:COUNTRY_NAMES[countryCode],country_code:countryCode},
   nationality:{country_code:countryCode,modeled_from:'FICTIONAL_WORLD_ORIGIN'},
   work_location:structuredClone(person.location),
   generation_links:{
    racing_stable_id:person.stableId?'O-'+person.stableId.replace(/^WTWFI-/,'').replaceAll('_','-'):null,
    farm_id:person.farmId?'O-'+person.farmId.replace(/^WTWFI-/,'').replaceAll('_','-'):null,
    owner_organization_id:person.organizationId?'O-'+person.organizationId.replace(/^WTWFI-/,'').replaceAll('_','-'):null,
    jockey_colony:person.jockeyColony??null
   },
   biography:{schema:SCHEMA,provenance:'MODELED_FICTIONAL_WORLD',as_of:openingDate,
    age_at_opening:ageAt(birth_date,openingDate),identity_source:'FICTIONAL_WORLD_NAME_ENGINE',identity_id:person.id,
    naming_cohort_birth_year:person.birthYear}
  };
 });
 if(new Set(records.map(p=>p.id)).size!==records.length)throw Error('Biography roster contains duplicate game IDs');
 return Object.freeze(records.map(record=>Object.freeze(record)));
}

export function auditFictionalPersonBiographiesV1({people,openingDate='1999-01-01'}={}){
 const issues=[];
 if(!Array.isArray(people))return {schema:SCHEMA,valid:false,total:0,issues:['people must be an array']};
 for(const person of people){
  if(!person||typeof person.id!=='string'||typeof person.name!=='string'||!validDate(person.date_of_birth)){
   issues.push('Missing identity, name or valid full date of birth');continue;
  }
  if(!validDate(openingDate)||ageAt(person.date_of_birth,openingDate)!==person.biography?.age_at_opening)
   issues.push('Opening age does not reconcile for '+person.id);
  const b=person.birthplace;
  if(!b||!b.city||!b.region||!b.country||!/^([A-Z]{2})$/.test(b.country_code||'')||!COUNTRY_NAMES[b.country_code]||b.country_code!==person.nationality?.country_code)
   issues.push('Birthplace or nationality is incomplete for '+person.id);
  if(!person.work_location||person.work_location.countryCode===undefined)
   issues.push('Distinct work location is missing for '+person.id);
 }
 return {schema:SCHEMA,valid:issues.length===0,total:people.length,issues};
}
