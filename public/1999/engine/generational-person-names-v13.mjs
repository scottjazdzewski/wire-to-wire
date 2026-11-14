/**
 * WTW V13 — opt-in naming for NEW fictional people born after 1989.
 *
 * 1999 generation is frozen on the original V7/V8 naming algorithms.
 *
 * US 1990–2019 ranking lists are SSA top-30 decade rankings. 2020 uses SSA
 * 2020–2025 PARTIAL decade rankings (not a completed 2020s ranking).
 * https://www.ssa.gov/oact/babynames/decades/names1990s.html
 * https://www.ssa.gov/oact/babynames/decades/names2000s.html
 * https://www.ssa.gov/oact/babynames/decades/names2010s.html
 * https://www.ssa.gov/oact/babynames/decades/names2020s.html
 *
 * All international modern and future-era combinations are CURATED EDITORIAL
 * GAME PROJECTIONS, not measured national registers, forecasts of real names,
 * ethnicity probabilities, or proof of any real person's citizenship.
 *
 * Surnames remain selected from the established country/culture pool in the
 * authoritative fictional-world engine. No new surname or legal family is
 * invented by this module.
 */
import {
 usBirthCohortGivenPool,drawUSBirthCohortName
} from './person-birth-cohort-names.mjs';
import {
 isLatinCaribbeanNamingOrigin,regionalGivenPool,drawRegionalGiven
} from './latin-caribbean-person-names.mjs';
import {
 isInternationalProfessionalNamingOrigin,internationalGivenPool,
 drawInternationalGiven
} from './international-professional-names.mjs';
import {
 supportsInternationalSubculture,culturallyConditionedGivenPool,
 drawCulturallyConditionedGiven
} from './international-name-cultures.mjs';

export const GENERATIONAL_PERSON_NAME_MODEL='WTW_GENERATIONAL_PERSON_NAMES_V13';
export const GENERATIONAL_NAME_YEAR_RANGE=Object.freeze({min:1999,max:2099});
export const GENERATIONAL_BIRTH_YEAR_RANGE=Object.freeze({min:1910,max:2089});
const words=s=>Object.freeze(s.trim().split(/\s+/).filter(Boolean));
const names=(m,f)=>Object.freeze({
 masculine:words(m),feminine:words(f)
});
export const US_MODERN_SSA_GIVEN_NAMES=Object.freeze({
 1990:names(
  'Michael Christopher Matthew Joshua Jacob Nicholas Andrew Daniel Tyler Joseph Brandon David James Ryan John Zachary Justin William Anthony Robert Jonathan Austin Alexander Kyle Kevin Thomas Cody Jordan Eric Benjamin',
  'Jessica Ashley Emily Sarah Samantha Amanda Brittany Elizabeth Taylor Megan Hannah Kayla Lauren Stephanie Rachel Jennifer Nicole Alexis Victoria Amber Alyssa Courtney Rebecca Danielle Jasmine Brianna Katherine Alexandra Madison Morgan'),
 2000:names(
  'Jacob Michael Joshua Matthew Daniel Christopher Andrew Ethan Joseph William Anthony David Alexander Nicholas Ryan Tyler James John Jonathan Noah Brandon Christian Dylan Samuel Benjamin Nathan Zachary Logan Justin Gabriel',
  'Emily Madison Emma Olivia Hannah Abigail Isabella Samantha Elizabeth Ashley Alexis Sarah Sophia Alyssa Grace Ava Taylor Brianna Lauren Chloe Natalie Kayla Jessica Anna Victoria Mia Hailey Sydney Jasmine Julia'),
 2010:names(
  'Noah Liam Jacob William Mason Ethan Michael Alexander James Elijah Benjamin Daniel Aiden Logan Jayden Matthew Lucas David Jackson Joseph Anthony Samuel Joshua Gabriel Andrew John Christopher Oliver Dylan Carter',
  'Emma Olivia Sophia Isabella Ava Mia Abigail Emily Charlotte Madison Elizabeth Amelia Evelyn Ella Chloe Harper Avery Sofia Grace Addison Victoria Lily Natalie Aubrey Zoey Lillian Hannah Layla Brooklyn Scarlett'),
 2020:names(
  'Liam Noah Oliver James Elijah William Henry Lucas Theodore Benjamin Mateo Levi Sebastian Jack Daniel Michael Alexander Ethan Samuel Owen John Asher Ezra Leo Jackson Mason Hudson Joseph David Jacob',
  'Olivia Emma Charlotte Amelia Sophia Mia Isabella Ava Evelyn Harper Luna Camila Sofia Eleanor Elizabeth Gianna Scarlett Violet Ella Emily Chloe Abigail Aria Penelope Aurora Hazel Avery Nora Lily Ellie')
});
// Each entry is EXTRA contemporary given-name vocabulary; classic country
// pools remain available to ensure generational continuity and diversity.
const regional=(male,female)=>Object.freeze({
 masculine:words(male),feminine:words(female)
});
export const MODERN_EDITORIAL_ORIGIN_GIVEN_NAMES=Object.freeze({
 PR:regional('Gabriel Sebastián Adrián Emilio Matías Javier Alexis Ángel Diego Leonardo','Valeria Camila Sofía Isabella Daniela Victoria Gabriela Natalia Adriana Lucía'),
 PA:regional('Gabriel Andrés Sebastián Alejandro Javier Diego Daniel Nicolás David Mateo','Valentina Camila Isabella Mariana Sofía Daniela Victoria Gabriela Lucía'),
 VE:regional('Andrés Alejandro Sebastián Santiago Diego Gabriel Leonardo Daniel Nicolás','Valentina Sofía Isabella Camila Daniela Gabriela Natalia Victoria Andrea'),
 MX:regional('Santiago Mateo Sebastián Diego Emiliano Leonardo José Luis Daniel','Valentina Sofía Regina Camila Ximena Mariana Renata Natalia'),
 CL:regional('Benjamín Vicente Matías Tomás Joaquín Martín Lucas Agustín Felipe','Sofía Emilia Isidora Florencia Antonia Catalina Valentina Trinidad'),
 PE:regional('Diego Sebastián Gabriel Rodrigo Luis André Joaquín Mateo Nicolás','Luciana Valeria Camila Ariana María Fernanda Daniela Gabriela'),
 CO:regional('Santiago Sebastián Juan Esteban Samuel David Nicolás Alejandro Mateo','Valentina Mariana Gabriela Isabella Luciana Sofía Natalia Salomé'),
 DO:regional('Gabriel Luis Ángel Samuel Emmanuel David Sebastián Carlos Adrián','Valentina Camila Gabriela María Fernanda Isabella Daniela'),
 AR:regional('Mateo Benjamín Bautista Thiago Santino Felipe Joaquín Tomás','Valentina Sofía Isabella Martina Catalina Mía Emilia Olivia'),
 UY:regional('Mateo Benjamín Joaquín Felipe Santiago Thiago Nicolás Agustín','Valentina Sofía Martina Catalina Emilia Isabella Olivia'),
 BR:regional('Miguel Arthur Heitor Bernardo Davi Gabriel Pedro Lucas Matheus','Helena Alice Laura Valentina Sophia Manuela Julia Isabella'),
 CA_EN:regional('Liam Noah Ethan Lucas Oliver Jack Benjamin Alexander Nathan Ryan','Olivia Emma Ava Charlotte Sophia Mia Amelia Isla Grace'),
 CA_FR:regional('William Liam Thomas Félix Émile Olivier Nathan Gabriel Antoine','Emma Olivia Alice Florence Léa Charlotte Chloé Camille Juliette'),
 GB_EN:regional('Oliver George Harry Jack Noah Arthur Leo Theo Freddie Oscar','Olivia Amelia Isla Ava Mia Lily Grace Florence Evie'),
 GB_SCOT:regional('Lewis James Harris Jack Callum Euan Finlay Hamish Fraser','Isla Olivia Emily Sophie Freya Eilidh Skye Iona'),
 GB_WALES:regional('Dylan Rhys Osian Elis Ioan Jac Harri Ifan Gruff','Megan Carys Nia Seren Ffion Eleri Lowri Anwen'),
 IE:regional('Jack James Conor Daniel Finn Cian Oisín Liam Seán','Emily Aoife Sophie Grace Emma Saoirse Fiadh Niamh'),
 FR:regional('Gabriel Louis Raphaël Arthur Jules Adam Hugo Lucas Nathan','Emma Jade Louise Alice Chloé Léa Manon Inès'),
 DE:regional('Noah Leon Paul Elias Finn Ben Jonas Felix Emil','Mia Emilia Hannah Emma Lina Sophie Clara Lea'),
 JP:regional('Haruto Yuto Sota Kaito Ren Yuki Daiki Hiroto Itsuki','Yui Sakura Rin Aoi Himari Akari Mei Hina'),
 AU:regional('Oliver Noah Jack William Leo Henry Thomas Charlie','Charlotte Amelia Isla Olivia Mia Ava Grace Matilda'),
 NZ:regional('Oliver Jack Noah Leo Lucas Liam George Henry','Charlotte Isla Amelia Olivia Ruby Mia Lily Sophie'),
 AE:regional('Mohammed Ahmed Hamdan Khalifa Zayed Omar Saif Ali','Fatima Maryam Aisha Hessa Noura Alya Latifa Mariam'),
 HK:regional('Tsz-hin Ka-lok Chun-kit Ho-lam Wing-hong Chi-wai','Tsz-ching Ka-yan Wing-sze Hoi-lam Ka-hei Wing-yee')
});
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const ch of String(key)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
 h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0;
}
const unique=a=>Object.freeze([...new Set(a)]);
const modernDecade=y=>Math.floor(y/10)*10;
export function validateGenerationalNamingYear(year){
 if(!Number.isInteger(year)||year<GENERATIONAL_NAME_YEAR_RANGE.min||
  year>GENERATIONAL_NAME_YEAR_RANGE.max)
  throw Error('Fictional naming supports world years 1999–2099');
 return year;
}
export function generationalGivenNameEvidence(country,birthYear){
 if(!Number.isInteger(birthYear)||birthYear<GENERATIONAL_BIRTH_YEAR_RANGE.min||
  birthYear>GENERATIONAL_BIRTH_YEAR_RANGE.max)
  throw Error('Unsupported generational birth year');
 if(birthYear<1990)return 'LEGACY_1910_1989_COHORT';
 if(country==='US'){
  if(birthYear<2020)return 'SSA_US_DECADE_TOP30_RANK_EDITORIAL_DRAW';
  if(birthYear<=2025)return 'SSA_US_PARTIAL_2020_2025_TOP30_EDITORIAL_DRAW';
  return 'EDITORIAL_FUTURE_US_NOT_OBSERVED';
 }
 return birthYear<=2025?'EDITORIAL_MODERN_COUNTRY_CULTURE_NOT_CENSUS':
  'EDITORIAL_FUTURE_COUNTRY_CULTURE_NOT_OBSERVED';
}
function establishedPool(country,culture,birthYear,feminine){
 if(country==='US')return usBirthCohortGivenPool(birthYear,feminine);
 if(isLatinCaribbeanNamingOrigin(country))
  return regionalGivenPool(country,birthYear,feminine);
 if(supportsInternationalSubculture(country))
  return culturallyConditionedGivenPool(country,culture,birthYear,feminine);
 if(isInternationalProfessionalNamingOrigin(country))
  return internationalGivenPool(country,birthYear,feminine);
 throw Error('Unsupported generational naming country '+country);
}
function modernKey(country,culture){
 return supportsInternationalSubculture(country)?culture:country;
}
export function generationalGivenPool(country,culture,birthYear,feminine){
 if(!Number.isInteger(birthYear)||birthYear<1910||birthYear>2089)
  throw Error('Unsupported generational birth year');
 if(birthYear<1990)return establishedPool(country,culture,birthYear,feminine);
 if(country==='US'){
  const decades=birthYear>=2030?[2010,2020]:[modernDecade(birthYear)];
  return unique(decades.flatMap(d=>
   US_MODERN_SSA_GIVEN_NAMES[d][feminine?'feminine':'masculine']));
 }
 const additions=MODERN_EDITORIAL_ORIGIN_GIVEN_NAMES[modernKey(country,culture)];
 if(!additions)throw Error('Missing modern country naming pool for '+country+':'+culture);
 const historic=establishedPool(country,culture,1989,feminine),
  contemporary=additions[feminine?'feminine':'masculine'];
 return unique([...contemporary,...historic]);
}
function rankPick(seed,key,pool){
 const rankWeights=pool.map((_,i)=>Math.round(1000/(i+4)));
 const total=rankWeights.reduce((a,b)=>a+b,0);
 let n=hash(seed,key)%total;
 for(let i=0;i<pool.length;i++){n-=rankWeights[i];if(n<0)return pool[i]}
 return pool.at(-1);
}
export function drawGenerationalGiven(seed,index,country,culture,birthYear,feminine,attempt=0){
 if(birthYear<1990){
  if(country==='US')return drawUSBirthCohortName(seed,index,birthYear,feminine,attempt);
  if(isLatinCaribbeanNamingOrigin(country))
   return drawRegionalGiven(seed,index,country,birthYear,feminine,attempt);
  if(supportsInternationalSubculture(country))
   return drawCulturallyConditionedGiven(seed,index,country,culture,birthYear,feminine,attempt);
  return drawInternationalGiven(seed,index,country,birthYear,feminine,attempt);
 }
 const pool=generationalGivenPool(country,culture,birthYear,feminine);
 const key='generation:'+country+':'+(culture||'')+':'+index+':'+birthYear+':'+attempt;
 if(country==='US')return rankPick(seed,key,pool);
 const contemporary=MODERN_EDITORIAL_ORIGIN_GIVEN_NAMES[modernKey(country,culture)]
  [feminine?'feminine':'masculine'];
 const pickModern=hash(seed,key+':era-blend')%100<(birthYear<2000?52:72);
 const chosen=pickModern?contemporary:pool;
 return chosen[hash(seed,key+':name')%chosen.length];
}
