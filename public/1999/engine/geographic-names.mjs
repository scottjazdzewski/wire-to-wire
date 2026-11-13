/*
 * WTW 1999 geographic test-name model.
 * U.S. inputs are small, SOURCE-VERIFIED excerpts of national Census 1990
 * name-frequency tables. These are NATIONAL tables, not state surname data.
 * Non-U.S. pools and role-origin MIX are PROVISIONAL EDITORIAL SCENARIOS,
 * not census observations or inferred ethnicities.
 * Official sources:
 * https://www2.census.gov/topics/genealogy/1990surnames/dist.male.first
 * https://www2.census.gov/topics/genealogy/1990surnames/dist.female.first
 * https://www2.census.gov/topics/genealogy/1990surnames/dist.all.last
 * Future state/cohort ingestion: https://www.ssa.gov/oact/babynames/limits.html
 */
export const GEO_NAME_MODEL='WTW_1999_CENSUS_US_BASE_WITH_EDITORIAL_INTERNATIONAL_V2';
const US_M='James John Robert Michael William David Richard Charles Joseph Thomas Christopher Daniel Paul Mark Donald George Kenneth Steven Edward Brian Ronald Anthony Kevin Jason Matthew Gary Timothy Jose Larry Jeffrey Frank Scott Eric Stephen Andrew Raymond Gregory Joshua Jerry Dennis Walter Patrick Peter Harold Douglas Henry Carl Arthur Ryan Roger Juan Jack Albert Jonathan Justin Keith Samuel Louis Eugene Carlos Victor Martin Jesse Craig Alan Clarence Sean Antonio Luis Leonard Manuel Vincent Francis Mario Francisco Miguel Oscar'.split(' ');
const US_F='Mary Patricia Linda Barbara Elizabeth Jennifer Maria Susan Margaret Dorothy Lisa Nancy Karen Betty Helen Sandra Donna Carol Ruth Sharon Michelle Laura Sarah Kimberly Deborah Jessica Shirley Cynthia Angela Melissa Brenda Amy Anna Rebecca Virginia Kathleen Pamela Martha Amanda Stephanie Carolyn Christine Marie Janet Catherine Frances Ann Joyce Diane Alice Julie Heather Teresa Doris Gloria Evelyn Jean Cheryl Mildred Katherine Joan Ashley Judith Rose Janice Kelly Nicole Judy Christina Irene Rachel Andrea Anne Jacqueline Ruby Diana Emily Victoria'.split(' ');
const US_S='Smith Johnson Williams Jones Brown Davis Miller Wilson Moore Taylor Anderson Thomas Jackson White Harris Martin Thompson Garcia Martinez Robinson Clark Rodriguez Lewis Lee Walker Hall Allen Young Hernandez King Wright Lopez Hill Scott Green Adams Baker Gonzalez Nelson Carter Mitchell Perez Roberts Turner Phillips Campbell Parker Evans Edwards Collins Stewart Sanchez Morris Rogers Reed Cook Morgan Bell Murphy Bailey Rivera Cooper Richardson Cox Howard Ward Torres Peterson Gray Ramirez James Watson Brooks Kelly Sanders Price Bennett Wood Barnes Ross Henderson Coleman Jenkins Perry Powell Long Patterson Hughes Flores Washington Butler Simmons Foster Bryant Alexander Russell Griffin Diaz Hayes Ford Hamilton Graham Sullivan Wallace Woods Cole West Jordan Owens Reynolds Fisher Ellis Harrison Gibson McDonald Cruz Marshall Ortiz Gomez Freeman Webb Simpson Stevens Tucker Porter Hunter Hicks Crawford Boyd Mason Morales Kennedy Dixon Ramos Reyes Gordon Shaw Holmes Rice Robertson Hunt Black Daniels Palmer Mills Nichols Grant Knight Ferguson Rose Stone Hawkins Dunn Perkins Hudson Spencer Gardner Payne Pierce Berry Matthews Arnold Wagner Willis Ray Watkins Olson Carroll Duncan Snyder Hart Cunningham Bradley Lane Andrews Ruiz Harper Fox Riley Armstrong Carpenter Weaver Greene Lawrence Elliott Chavez Austin Peters Franklin Lawson Fields Gutierrez'.split(' ');
// Exact 1990 Census rank-ordered percentages for the first 40 U.S. names in each table.
// The remaining listed names get a small tail weight; the complete federal
// files can replace this bounded shipping excerpt without changing IDs.
const M_FREQ='3.318 3.271 3.143 2.629 2.451 2.363 1.703 1.523 1.404 1.380 1.035 .974 .948 .938 .931 .927 .826 .780 .779 .736 .725 .721 .671 .660 .657 .650 .640 .613 .598 .591 .581 .546 .544 .540 .537 .488 .441 .435 .432 .415'.split(' ').map(Number);
const F_FREQ='2.629 1.073 1.035 .980 .937 .932 .828 .794 .768 .727 .704 .669 .667 .666 .663 .629 .583 .565 .562 .522 .519 .510 .508 .504 .494 .490 .482 .469 .468 .462 .455 .451 .440 .430 .430 .424 .416 .412 .408 .404'.split(' ').map(Number);
const S_FREQ='1.006 .810 .699 .621 .621 .480 .424 .339 .312 .311 .311 .311 .310 .279 .275 .273 .269 .254 .234 .233 .231 .229 .226 .220 .219 .200 .199 .193 .192 .190 .189 .187 .187 .185 .183 .174 .171 .166 .162 .162'.split(' ').map(Number);
function censusPick(names,knownFrequency,seed,key){
 const weights=names.map((_,i)=>knownFrequency[i]??.045);
 const total=weights.reduce((a,b)=>a+b,0);
 let draw=(hash(seed,key)/4294967296)*total;
 for(let i=0;i<names.length;i++){draw-=weights[i];if(draw<0)return names[i]}
 return names.at(-1);
}
const LATIN_M='Jose Juan Carlos Luis Miguel Rafael Antonio Pedro Jorge Roberto Ricardo Fernando Francisco Manuel Gabriel Alejandro Hector Victor Oscar Raul Ramon Edwin Edgar Mario Daniel Andres Julio Eduardo Enrique Alberto Cesar Guillermo Nicolas Sergio Javier Orlando Nelson Ismael Armando'.split(' ');
const LATIN_F='Maria Ana Carmen Rosa Sofia Lucia Elena Patricia Gabriela Andrea Isabel Beatriz Claudia Teresa Lourdes Marisol Alejandra Daniela Adriana Carolina Vanessa Paola Mercedes Yolanda Veronica Natalia Silvia'.split(' ');
const LATIN_S='Garcia Rodriguez Martinez Hernandez Lopez Gonzalez Perez Sanchez Ramirez Torres Flores Rivera Gomez Diaz Ortiz Morales Ruiz Alvarez Cruz Jimenez Romero Castro Mendez Mendoza Vargas Salazar Rojas Silva Cabrera Castillo Valdez Delgado Dominguez Escobar Estrada Guerrero Acosta Delgado Mendoza Ortega Quintero Andrade Molina Cordero Perdomo Valenzuela Gutierrez Chavez Marquez Navarro Pinto Campos Paredes Reyes Figueroa Fernandez'.split(' ');
const LOCAL_SURNAME={
 PA:'Batista Arias Tejada Escobar Quintero Mendoza Gonzalez Perez Castillo Cedeño Morales Paredes Valdes'.split(' '),
 PR:'Rivera Rodriguez Santiago Ortiz Cordero Velazquez Figueroa Gonzalez Morales Rosado Rivera Torres'.split(' '),
 VE:'Dominguez Castellano Aray Gonzalez Rivas Jimenez Blanco Martinez Rojas Herrera Rodriguez'.split(' '),
 MX:'Hernandez Garcia Martinez Lopez Gonzalez Perez Ramirez Sanchez Flores Torres Romero'.split(' '),
 CL:'Santos Herrera Gonzalez Perez Rojas Muñoz Contreras Silva Morales Valenzuela'.split(' '),
 PE:'Prado Flores Quispe Huaman Garcia Rojas Mendoza Ramos Chavez Torres'.split(' '),
 CO:'Martinez Rodriguez Gutierrez Gomez Ramirez Moreno Cardenas Vargas Sanchez'.split(' '),
 DO:'Ortiz Perez Rodriguez Sanchez Garcia Reyes Martinez Cruz Diaz Morales'.split(' '),
 AR:'Fernandez Gonzalez Rodriguez Lopez Martinez Perez Garcia Sanchez Romero Alvarez Acosta Sosa Diaz'.split(' '),
 UY:'Rodriguez Fernandez Gonzalez Martinez Perez Garcia Silva Pereira Lopez Diaz Olivera'.split(' ')
};
// Additional curated non-Census Portuguese-speaking jockey naming pool.
const BR_M='Joao Jose Antonio Carlos Paulo Luiz Roberto Marcos Pedro Fabio Marcelo Rafael Felipe Fernando Eduardo Alexandre'.split(' ');
const BR_F='Maria Ana Patricia Fernanda Juliana Cristina Luciana Adriana Carla Renata Beatriz Paula'.split(' ');
const BR_S='Silva Santos Oliveira Souza Costa Pereira Rodrigues Almeida Carvalho Gomes Ribeiro Martins Ferreira Lima Barbosa Rocha Nascimento Araujo Mendes Correia'.split(' ');
const NAME_MIX={
 jockey:[['US',45],['PR',12],['PA',8],['VE',8],['MX',8],['CL',4],['PE',4],['CO',4],['DO',3],['CA',3],['GB',1]],
 trainer:[['US',78],['CA',8],['GB',5],['IE',3],['PR',2],['MX',2],['VE',1],['PA',1]],
 farm_manager:[['US',85],['CA',8],['GB',3],['IE',2],['PR',1],['MX',1]],
 veterinarian:[['US',86],['CA',7],['GB',3],['IE',2],['PR',1],['MX',1]],
 farrier:[['US',83],['CA',8],['GB',5],['IE',3],['MX',1]],
 bloodstock_agent:[['US',67],['CA',8],['GB',10],['IE',10],['PR',2],['VE',1],['PA',1],['MX',1]],
 racing_secretary:[['US',84],['CA',8],['GB',4],['IE',2],['PR',1],['MX',1]],
 owner:[['US',78],['CA',7],['GB',5],['IE',4],['PR',2],['MX',2],['VE',1],['PA',1]]
};
const GB_M='James William Charles Edward George Thomas John Richard Henry Peter Michael Philip David Andrew Stephen Robert Ian Nigel Graham'.split(' ');
const GB_F='Mary Anne Elizabeth Margaret Jane Sarah Catherine Susan Caroline Patricia Helen Frances Rebecca'.split(' ');
const GB_S='Smith Jones Taylor Williams Brown Wilson Davies Evans Thomas Roberts Walker Thompson White Harris Edwards'.split(' ');
const IE_S='Murphy Kelly OBrien Walsh Byrne Ryan OConnor ONeill Doyle McCarthy Gallagher Fitzgerald Sullivan Brennan'.split(' ');
function hash(seed,key){let h=(2166136261^(seed>>>0))>>>0;for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>16;return h>>>0}
const pick=(a,seed,key)=>a[hash(seed,key)%a.length];
export function roleOrigin(seed,index,role){
 const mix=NAME_MIX[role]||NAME_MIX.trainer;
 let roll=hash(seed,'origin:'+index+':'+role)%mix.reduce((n,item)=>n+item[1],0);
 for(const [code,w] of mix){if(roll<w)return code;roll-=w}
 return 'US';
}
export function createGeographicNameRoster(seed,count,roleAt,protectedNames=[],options={}){
 const canonKey=name=>options.normalizeNamesForAccent?
  String(name).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,''):
  String(name).toLocaleLowerCase('en-US');
 const reserved=new Set(protectedNames.map(canonKey));
 const limit=options.maxBaseNameUses??Infinity;
 if(limit!==Infinity&&(!Number.isInteger(limit)||limit<1))
  throw Error('Invalid maximum repeated given/surname pairing');
 const baseCounts=new Map();
 const baseKey=(first,last)=>(first+' '+last).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const records=[];
 for(let i=0;i<count;i++){
  const role=roleAt(i),country=options.countryAt?options.countryAt(i,role):roleOrigin(seed,i,role);
  if(!['US','CA','GB','IE','PR','PA','VE','MX','CL','PE','CO','DO','AR','BR','UY','FR','DE','JP','AU','NZ','AE','HK'].includes(country))
   throw Error('Unsupported fictional person naming origin: '+country);
  const feminine=hash(seed,'sex:'+i)%100 < (role==='jockey'?7:role==='trainer'?22:role==='owner'?32:35);
  // Optional 1999 fictional-world birth-decade selection. The original
  // Census national excerpt remains the default for historical world users.
  const birthCohortPool=options.givenPoolAt?.(i,role,country,feminine)??null;
  if(birthCohortPool!==null&&(!Array.isArray(birthCohortPool)||
   !birthCohortPool.length||birthCohortPool.some(n=>typeof n!=='string'||!n)))
   throw Error('Invalid birth-cohort given-name pool');
  const given=birthCohortPool??(country==='US'||country==='CA'?(feminine?US_F:US_M):
   country==='GB'||country==='IE'?(feminine?GB_F:GB_M):
   country==='BR'?(feminine?BR_F:BR_M):(feminine?LATIN_F:LATIN_M));
  const countryFamily=country==='US'||country==='CA'?US_S:
   country==='GB'?GB_S:country==='IE'?IE_S:country==='BR'?BR_S:
   [...(LOCAL_SURNAME[country]||[]),...LATIN_S];
  const suppliedFamily=options.familyPoolAt?.(i,role,country)??null;
  if(suppliedFamily!==null&&(!Array.isArray(suppliedFamily)||!suppliedFamily.length||
   suppliedFamily.some(x=>typeof x!=='string'||!x.trim())))
   throw Error('Invalid country-specific surname pool');
  const family=suppliedFamily??countryFamily;
  let name=null,selectedFirst=null,selectedSurname=null;
  for(let attempt=0;attempt<400;attempt++){
   const first=birthCohortPool?
    (options.givenNameAt?options.givenNameAt(i,role,country,feminine,attempt):pick(given,seed,'given:'+i+':'+attempt)):
    country==='US'||country==='CA'?censusPick(given,feminine?F_FREQ:M_FREQ,seed,'given:'+i+':'+attempt):
    pick(given,seed,'given:'+i+':'+attempt);
   if(birthCohortPool&&!birthCohortPool.includes(first))
    throw Error('Birth-cohort given name outside selected rank pool');
   const surname=suppliedFamily&&options.familyNameAt?
    options.familyNameAt(i,role,country,attempt):
    country==='US'||country==='CA'?censusPick(family,S_FREQ,seed,'family:'+i+':'+attempt):
    pick(family,seed,'family:'+i+':'+attempt);
   if(suppliedFamily&&!family.includes(surname))throw Error('Generated surname outside country-specific pool');
   const candidate=first+' '+surname,base=baseKey(first,surname);
   if(options.avoidIdenticalGivenSurname&&first.toLocaleLowerCase('en-US')===surname.toLocaleLowerCase('en-US'))continue;
   if((baseCounts.get(base)||0)>=limit)continue;
   if(!reserved.has(canonKey(candidate))){name=candidate;selectedFirst=first;selectedSurname=surname;break}
  }
  if(!name){
   // Weighted Census names can exhaust high-frequency combinations. Fall
   // back to plausible combinations from the SAME country's name pools.
   // Do not append numeric row identifiers to human names.
   for(let attempt=0;attempt<4096;attempt++){
    const first=pick(given,seed,'fallback-given:'+i+':'+attempt);
    const last=pick(family,seed,'fallback-family:'+i+':'+attempt);
    const letter=String.fromCharCode(65+hash(seed,'fallback-middle:'+i+':'+attempt)%26);
    const candidate=attempt<1024?first+' '+last:first+' '+letter+'. '+last;
    const base=baseKey(first,last);
    if(options.avoidIdenticalGivenSurname&&first.toLocaleLowerCase('en-US')===last.toLocaleLowerCase('en-US'))continue;
    if((baseCounts.get(base)||0)>=limit)continue;
    if(!reserved.has(canonKey(candidate))){name=candidate;selectedFirst=first;selectedSurname=last;break}
   }
   if(!name)throw Error('Country-specific personnel name pool exhausted; expand it instead of adding numbered identities');
  }
  reserved.add(canonKey(name));
  const key=baseKey(selectedFirst,selectedSurname);
  baseCounts.set(key,(baseCounts.get(key)||0)+1);
  records.push({name,givenName:selectedFirst,primarySurname:selectedSurname,
   birthCountry:country,role,
   source:birthCohortPool&&country!=='US'?(
     options.givenSourceAt?.(i,role,country)??
     'LATIN_CARIBBEAN_1999_CURATED_COUNTRY_COHORT_NOT_CENSUS'):
    birthCohortPool?'SSA_US_BIRTH_COHORT_TOP30_RANK_BIASED_EDITORIAL_DRAW':
    country==='US'?'CENSUS_1990_US_NATIONAL_EXCERPT_PLUS_TEST_DRAW':'CURATED_COUNTRY_TEST_POOL_NOT_CENSUS',
   originModel:'PROVISIONAL_RACING_ROLE_MIX_NOT_MEASURED'});
 }
 return records;
}
