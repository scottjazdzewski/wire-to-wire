/**
 * WTW fictional 1999 Canada and Great Britain subcultures for person names.
 *
 * Separates Canada EN/FR and Britain EN/Scottish/Welsh surname + given pools.
 * Percentages used to select subcultures are editorial fictional-world
 * choices, not measured 1999 nationality, ethnicity or province populations.
 * Naming culture is selected independent of current operating address.
 */
export const INTERNATIONAL_NAME_CULTURE_MODEL='WTW_1999_CA_GB_PERSON_NAME_CULTURES_V1';
const pool=str=>Object.freeze(str.trim().split(/\s+/).filter(Boolean));
const entry=(oldM,youngM,oldF,youngF,family)=>Object.freeze({
 oldM:pool(oldM),youngM:pool(youngM),oldF:pool(oldF),
 youngF:pool(youngF),family:pool(family)
});
export const INTERNATIONAL_NAME_CULTURE_PROFILES=Object.freeze({
 CA_EN:entry(
  'John Robert William James George Donald Ronald Raymond Kenneth Walter Harold Richard Patrick Douglas',
  'Michael David Christopher Jason Matthew Steven Scott Brian Kevin Mark Andrew Ryan Timothy Peter Colin',
  'Mary Margaret Elizabeth Patricia Barbara Helen Catherine Linda Carol Ruth Jean Anne',
  'Jennifer Susan Michelle Kimberly Lisa Karen Nicole Christine Heather Julie Sarah Amy Rebecca',
  'MacDonald Smith Brown Wilson Thompson Campbell Stewart MacKenzie McLeod Fraser Morrison Taylor Bennett Miller Clark Anderson MacNeil Douglas Henderson Murray Graham King Martin Parker'),
 CA_FR:entry(
  'Jean Pierre André Jacques Michel Claude Marcel Paul Robert Gérard François Louis Luc Henri René',
  'Michel Pierre Jean François Marc Luc Daniel Stéphane Alain Patrick Éric Martin Simon Sébastien',
  'Marie Thérèse Jeanne Monique Denise Nicole Louise Claire Hélène Françoise Céline',
  'Julie Nathalie Isabelle Mélanie Sophie Caroline Stéphanie Valérie Marie Chantal Annie Josée',
  'Tremblay Gagnon Roy Côté Bouchard Gauthier Morin Bélanger Pelletier Leclerc Fortin Girard Dubois Lavoie Desjardins Beaulieu Lemieux Bédard Lachance'),
 GB_EN:entry(
  'John David Michael Peter Robert William Richard James Anthony George Edward Kenneth Colin Graham Philip',
  'David Paul Mark Andrew James Michael Christopher Simon Matthew Daniel Richard Stephen Jonathan Nicholas',
  'Margaret Mary Patricia Elizabeth Jean Anne Dorothy Susan Barbara Christine Helen Judith Caroline',
  'Sarah Emma Claire Nicola Louise Rachel Joanne Helen Samantha Karen Rebecca Catherine Laura',
  'Smith Jones Taylor Wilson Brown Walker Robinson Hall Clarke Wright White Hughes Edwards Bennett Cooper Turner Baker Carter Ellis Foster Palmer Webb Fletcher'),
 GB_SCOT:entry(
  'Ian Alistair Angus Donald James Robert William Alexander Gordon Douglas Kenneth Graham',
  'Iain Craig Scott Andrew Stuart Alasdair David Callum Ross Ewan Duncan Fraser',
  'Margaret Jean Elizabeth Anne Fiona Moira Isobel Catherine Mary',
  'Fiona Kirsty Alison Catriona Morag Heather Claire Nicola Jennifer',
  'Campbell MacDonald Stewart Robertson Fraser MacLeod McIntyre Buchanan Murray Douglas Ferguson MacKenzie McGregor Cameron Sinclair'),
 GB_WALES:entry(
  'David John William Gareth Rhys Glyn Richard Owen Thomas Alun',
  'Gareth Rhys Geraint Huw Iwan Ieuan Dylan Aled Owain',
  'Margaret Gwen Mary Eirlys Carys Elizabeth Anne',
  'Carys Sian Bethan Eleri Lowri Rhiannon Megan Nia',
  'Jones Davies Williams Evans Thomas Roberts Hughes Morgan Griffiths Lloyd Powell Bowen Vaughan Price')
});
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const ch of String(key)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
 h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0;
}
export const supportsInternationalSubculture=country=>country==='CA'||country==='GB';
export function chooseInternationalNameCulture(seed,index,country){
 if(country==='CA')
  return hash(seed,'ca-culture:'+index)%100<27?'CA_FR':'CA_EN';
 if(country==='GB'){
  const roll=hash(seed,'gb-culture:'+index)%100;
  return roll<12?'GB_SCOT':roll<18?'GB_WALES':'GB_EN';
 }
 throw Error('No Canada/Great Britain naming subculture for '+country);
}
function validateCountryCulture(country,culture){
 if(!supportsInternationalSubculture(country)||
  !(country==='CA'&&['CA_EN','CA_FR'].includes(culture)||
    country==='GB'&&['GB_EN','GB_SCOT','GB_WALES'].includes(culture)))
  throw Error('Country/culture mismatch for '+country+':'+culture);
 return INTERNATIONAL_NAME_CULTURE_PROFILES[culture];
}
export function culturallyConditionedGivenPool(country,culture,birthYear,feminine){
 if(!Number.isInteger(birthYear)||birthYear<1910||birthYear>1989)
  throw Error('Unsupported fictional birth cohort for international naming culture');
 const profile=validateCountryCulture(country,culture);
 return profile[(birthYear<1960?'old':'young')+(feminine?'F':'M')];
}
export function culturallyConditionedSurnamePool(country,culture){
 return validateCountryCulture(country,culture).family;
}
export function drawCulturallyConditionedGiven(seed,index,country,culture,birthYear,feminine,attempt=0){
 const names=culturallyConditionedGivenPool(country,culture,birthYear,feminine);
 return names[hash(seed,'subculture-given:'+index+':'+country+':'+birthYear+':'+attempt)%names.length];
}
export function drawCulturallyConditionedSurname(seed,index,country,culture,attempt=0){
 const names=culturallyConditionedSurnamePool(country,culture);
 return names[hash(seed,'subculture-surname:'+index+':'+country+':'+attempt)%names.length];
}
