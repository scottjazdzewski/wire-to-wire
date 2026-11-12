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
export const GEO_NAME_MODEL='WTW_1999_CENSUS_US_BASE_WITH_EDITORIAL_INTERNATIONAL_V1';
const US_M='James John Robert Michael William David Richard Charles Joseph Thomas Christopher Daniel Paul Mark Donald George Kenneth Steven Edward Brian Ronald Anthony Kevin Jason Matthew Gary Timothy Jose Larry Jeffrey Frank Scott Eric Stephen Andrew Raymond Gregory Joshua Jerry Dennis Walter Patrick Peter Harold Douglas Henry Carl Arthur Ryan Roger Juan Jack Albert Jonathan Justin Keith Samuel Louis Eugene Carlos Victor Martin Jesse Craig Alan Clarence Sean Antonio Luis Leonard Manuel Vincent Francis Mario Francisco Miguel Oscar'.split(' ');
const US_F='Mary Patricia Linda Barbara Elizabeth Jennifer Maria Susan Margaret Dorothy Lisa Nancy Karen Betty Helen Sandra Donna Carol Ruth Sharon Michelle Laura Sarah Kimberly Deborah Jessica Shirley Cynthia Angela Melissa Brenda Amy Anna Rebecca Virginia Kathleen Pamela Martha Amanda Stephanie Carolyn Christine Marie Janet Catherine Frances Ann Joyce Diane Alice Julie Heather Teresa Doris Gloria Evelyn Jean Cheryl Mildred Katherine Joan Ashley Judith Rose Janice Kelly Nicole Judy Christina Irene Rachel Andrea Anne Jacqueline Ruby Diana Emily Victoria'.split(' ');
const US_S='Smith Johnson Williams Jones Brown Davis Miller Wilson Moore Taylor Anderson Thomas Jackson White Harris Martin Thompson Garcia Martinez Robinson Clark Rodriguez Lewis Lee Walker Hall Allen Young Hernandez King Wright Lopez Hill Scott Green Adams Baker Gonzalez Nelson Carter Mitchell Perez Roberts Turner Phillips Campbell Parker Evans Edwards Collins Stewart Sanchez Morris Rogers Reed Cook Morgan Bell Murphy Bailey Rivera Cooper Richardson Cox Howard Ward Torres Peterson Gray Ramirez James Watson Brooks Kelly Sanders Price Bennett Wood Barnes Ross Henderson Coleman Jenkins Perry Powell Long Patterson Hughes Flores Washington Butler Simmons Foster Bryant Alexander Russell Griffin Diaz Hayes Ford Hamilton Graham Sullivan Wallace Woods Cole West Jordan Owens Reynolds Fisher Ellis Harrison Gibson McDonald Cruz Marshall Ortiz Gomez Freeman Webb Simpson Stevens Tucker Porter Hunter Hicks Crawford Boyd Mason Morales Kennedy Dixon Ramos Reyes Gordon Shaw Holmes Rice Robertson Hunt Black Daniels Palmer Mills Nichols Grant Knight Ferguson Rose Stone Hawkins Dunn Perkins Hudson Spencer Gardner Payne Pierce Berry Matthews Arnold Wagner Willis Ray Watkins Olson Carroll Duncan Snyder Hart Cunningham Bradley Lane Andrews Ruiz Harper Fox Riley Armstrong Carpenter Weaver Greene Lawrence Elliott Chavez Austin Peters Franklin Lawson Fields Gutierrez'.split(' ');
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
 DO:'Ortiz Perez Rodriguez Sanchez Garcia Reyes Martinez Cruz Diaz Morales'.split(' ')
};
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
export function createGeographicNameRoster(seed,count,roleAt,protectedNames=[]){
 const reserved=new Set(protectedNames.map(n=>String(n).toLocaleLowerCase('en-US')));
 const records=[];
 for(let i=0;i<count;i++){
  const role=roleAt(i),country=roleOrigin(seed,i,role);
  const feminine=hash(seed,'sex:'+i)%100 < (role==='jockey'?7:role==='trainer'?22:role==='owner'?32:35);
  const given=country==='US'||country==='CA'?(feminine?US_F:US_M):
   country==='GB'||country==='IE'?(feminine?GB_F:GB_M):(feminine?LATIN_F:LATIN_M);
  const family=country==='US'||country==='CA'?US_S:
   country==='GB'?GB_S:country==='IE'?IE_S:[...(LOCAL_SURNAME[country]||[]),...LATIN_S];
  let name=null;
  for(let attempt=0;attempt<400;attempt++){
   const first=pick(given,seed,'given:'+i+':'+attempt);
   const surname=pick(family,seed,'family:'+i+':'+attempt);
   const candidate=first+' '+surname;
   if(!reserved.has(candidate.toLocaleLowerCase('en-US'))){name=candidate;break}
  }
  if(!name){const first=pick(given,seed,'given:'+i),last=pick(family,seed,'family:'+i);
    name=first+' '+String.fromCharCode(65+i%26)+'. '+last;
    while(reserved.has(name.toLocaleLowerCase('en-US')))name=first+' '+(i+1)+' '+last;
  }
  reserved.add(name.toLocaleLowerCase('en-US'));
  records.push({name,birthCountry:country,role,source:country==='US'?'CENSUS_1990_US_NATIONAL_EXCERPT_PLUS_TEST_DRAW':'CURATED_COUNTRY_TEST_POOL_NOT_CENSUS',originModel:'PROVISIONAL_RACING_ROLE_MIX_NOT_MEASURED'});
 }
 return records;
}
