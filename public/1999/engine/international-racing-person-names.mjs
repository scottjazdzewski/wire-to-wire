/**
 * WIRE TO WIRE — fictional 1999 international racing-person name cultures.
 *
 * Country and role proportions are EDITORIAL SCENARIOS informed by
 * international racing and bloodstock trade; they are not 1999 census values,
 * racial inference, immigration status or historical colony statistics.
 * Native Japanese family-name order differs from the western-style display
 * used in North American racing directories; nameDisplayConvention records
 * that distinction rather than silently pretending the cultures are identical.
 */
export const INTERNATIONAL_RACING_NAME_MODEL='WTW_1999_INTERNATIONAL_PROFESSION_NAMES_V1';
export const INTERNATIONAL_NAMING_ORIGINS=Object.freeze(['CA','GB','IE','FR','DE','AU','NZ','JP','AE','SA']);
const split=s=>Object.freeze(s.trim().split(/\s+/));
const culture=(oldM,youngM,oldF,youngF,families)=>Object.freeze({
 oldM:split(oldM),youngM:split(youngM),
 oldF:split(oldF),youngF:split(youngF),families:split(families)
});
// Familiar adult first names and family names, not reconstructed individual
// horsemen. Country pools are curated and era-plausible, not frequency tables.
export const INTERNATIONAL_CULTURE_PROFILES=Object.freeze({
 CA_EN:culture(
  'John Robert William James George Donald Ronald Raymond Kenneth Walter Harold Richard Patrick Douglas',
  'Michael David Christopher Jason Matthew Steven Scott Brian Kevin Mark Andrew Ryan Timothy Peter Colin',
  'Mary Margaret Elizabeth Patricia Barbara Helen Catherine Linda Carol Ruth Jean Anne',
  'Jennifer Susan Michelle Kimberly Lisa Karen Nicole Christine Heather Julie Sarah Amy Rebecca',
  'MacDonald Smith Brown Wilson Thompson Campbell Stewart MacKenzie McLeod Fraser Morrison Taylor Bennett Miller Clark Anderson MacNeil Douglas Henderson Murray Graham King Martin Parker'),
 CA_FR:culture(
  'Jean Pierre André Jacques Michel Claude Marcel Paul Robert Gérard François Louis Luc Henri René',
  'Michel Pierre Jean François Marc Luc Daniel Stéphane Alain Patrick Éric Martin Simon Sébastien',
  'Marie Thérèse Jeanne Monique Denise Nicole Louise Claire Hélène Françoise Céline',
  'Julie Nathalie Isabelle Mélanie Sophie Caroline Stéphanie Valérie Marie Chantal Annie Josée',
  'Tremblay Gagnon Roy Côté Bouchard Gauthier Morin Bélanger Pelletier Leclerc Fortin Girard Dubois Lavoie Desjardins Beaulieu Lemieux Bédard Lachance'),
 GB_EN:culture(
  'John David Michael Peter Robert William Richard James Anthony George Edward Kenneth Colin Graham Philip',
  'David Paul Mark Andrew James Michael Christopher Simon Matthew Daniel Richard Stephen Jonathan Nicholas',
  'Margaret Mary Patricia Elizabeth Jean Anne Dorothy Susan Barbara Christine Helen Judith Caroline',
  'Sarah Emma Claire Nicola Louise Rachel Joanne Helen Samantha Karen Rebecca Catherine Laura',
  'Smith Jones Taylor Wilson Brown Davies Evans Walker Robinson Hall Clarke Wright White Hughes Edwards Bennett Cooper Turner Baker Carter Ellis Foster Palmer Webb Fletcher'),
 GB_SCOT:culture(
  'Ian Alistair Angus Donald James Robert William Alexander Gordon Douglas Kenneth Graham',
  'Iain Craig Scott Andrew Stuart Alasdair David Callum Ross Ewan Duncan Fraser',
  'Margaret Jean Elizabeth Anne Fiona Moira Isobel Catherine Mary',
  'Fiona Kirsty Alison Catriona Morag Heather Claire Nicola Jennifer',
  'Campbell MacDonald Stewart Robertson Fraser MacLeod McIntyre Buchanan Murray Douglas Ferguson MacKenzie McGregor Cameron Sinclair'),
 GB_WALES:culture(
  'David John William Gareth Rhys Glyn Richard Owen Thomas Alun',
  'Gareth Rhys Geraint Huw Iwan Ieuan Dylan Aled Owain',
  'Margaret Gwen Mary Eirlys Carys Elizabeth Anne',
  'Carys Sian Bethan Eleri Lowri Rhiannon Megan Nia',
  'Jones Davies Williams Evans Thomas Roberts Hughes Morgan Griffiths Lloyd Powell Bowen Vaughan Price'),
 IE:culture(
  'Patrick Michael John James Thomas Seán Joseph Liam Gerard Francis Daniel Brendan',
  'Seán Liam Ciarán Declan Kevin Aidan Niall Eoin Brian Darragh Shane',
  'Mary Margaret Bridget Kathleen Catherine Patricia Maureen Eileen Nora Deirdre',
  'Siobhán Niamh Aoife Orla Fiona Aisling Sinéad Ciara Deirdre Michelle',
  "Murphy Kelly O'Brien Walsh Byrne Ryan O'Connor O'Neill Doyle McCarthy Gallagher Fitzgerald Sullivan Brennan O'Sullivan Kavanagh O'Reilly McGrath O'Donnell Maher"),
 FR:culture(
  'Jean Pierre Jacques Michel André Louis François Marcel Bernard Claude Philippe Henri',
  'Philippe Laurent Patrick Olivier Thierry Nicolas Christophe Frédéric Stéphane David Guillaume',
  'Marie Jeanne Françoise Monique Denise Nicole Colette Suzanne Hélène Catherine',
  'Sophie Isabelle Nathalie Catherine Sandrine Céline Véronique Stéphanie Julie Caroline',
  'Martin Bernard Dubois Thomas Robert Petit Richard Durand Moreau Laurent Lefebvre Michel Bertrand Roux Fournier Girard Lambert Fontaine Chevalier'),
 DE:culture(
  'Hans Klaus Wolfgang Karl Peter Jürgen Werner Günther Dieter Helmut Thomas',
  'Michael Stefan Andreas Thomas Markus Christian Martin Daniel Oliver Alexander',
  'Ingrid Ursula Brigitte Helga Monika Renate Karin Erika Christa',
  'Sabine Claudia Petra Andrea Anja Stefanie Julia Nicole Katrin Sandra',
  'Müller Schmidt Schneider Fischer Weber Meyer Wagner Becker Schulz Hoffmann Schäfer Koch Bauer Richter Klein Wolf Schröder Neumann Schwarz Zimmermann'),
 AU:culture(
  'John Robert William Peter David Michael Ian Bruce Kevin Brian Colin Graham',
  'Matthew Jason Andrew Michael David Scott Daniel Brett Mark Simon Anthony',
  'Margaret Mary Patricia Susan Barbara Helen Christine Carol Anne',
  'Sarah Rebecca Emma Nicole Jennifer Melissa Kate Michelle Amanda Kylie',
  'Smith Jones Williams Brown Wilson Taylor Martin Anderson Thompson Campbell Harris Walker Mitchell Edwards Turner Morris Clark Wright McKenzie'),
 NZ:culture(
  'John Robert Peter David James William Brian Alan Bruce Colin',
  'Michael Andrew Matthew David Christopher Daniel James Scott Craig Richard',
  'Margaret Mary Patricia Helen Judith Elizabeth Susan Anne',
  'Sarah Rebecca Rachel Emma Nicola Michelle Megan Amy Kate',
  'Smith Williams Brown Wilson Taylor Jones Thompson Campbell McKenzie Anderson Walker Young Clark Robertson Fraser Harris Turner'),
 JP:culture(
  'Hiroshi Takeshi Masao Yoshio Kazuo Shigeru Akira Osamu Masaru Kiyoshi',
  'Takashi Kenji Hiroyuki Masahiro Shinji Koji Yuji Satoshi Daisuke Tatsuya',
  'Sachiko Keiko Kazuko Yoshiko Yoko Akiko Reiko Masako',
  'Yuki Yuko Naoko Mika Ayako Mariko Tomoko Rie Satomi',
  'Sato Suzuki Takahashi Tanaka Watanabe Ito Yamamoto Nakamura Kobayashi Kato Yoshida Yamada Sasaki Yamaguchi Matsumoto Inoue Kimura Shimizu Hayashi Saito'),
 AE:culture(
  'Mohammed Ahmed Abdullah Saeed Khalifa Hamdan Rashid Hamad Salem Sultan Ali',
  'Mohammed Ahmed Abdullah Khalid Saeed Omar Nasser Hamdan Majid Faisal',
  'Fatima Aisha Maryam Khadija Amna Hessa Salma',
  'Fatima Mariam Aisha Noura Huda Salma Reem Latifa',
  'Al-Mansouri Al-Suwaidi Al-Nuaimi Al-Kaabi Al-Hammadi Al-Mazrouei Al-Shamsi Al-Muhairi Al-Marzooqi Al-Zaabi Al-Ketbi Al-Dhaheri Al-Qubaisi'),
 SA:culture(
  'Mohammed Abdullah Ahmed Abdulrahman Ibrahim Saleh Saad Khalid Nasser Faisal',
  'Mohammed Abdulaziz Abdullah Fahad Khalid Saud Turki Omar Faisal Bandar',
  'Fatimah Aisha Maryam Khadijah Noura Amal Huda',
  'Noura Sara Reem Hessa Abeer Maha Fatimah Dalal',
  'Al-Otaibi Al-Qahtani Al-Harbi Al-Shammari Al-Anazi Al-Ghamdi Al-Zahrani Al-Dossari Al-Mutairi Al-Subaie Al-Rashidi Al-Shehri')
});
// Role weights describe an international fictional 1999 North American
// racing world. Substantive international presence is intentionally strongest
// in the bloodstock trade, not randomly applied to all stablehands.
export const INTERNATIONAL_ROLE_ORIGIN_MIXES=Object.freeze({
 trainer:Object.freeze([['US',68],['CA',9],['GB',5],['IE',5],['AU',2],['NZ',1],['FR',2],['DE',1],['JP',1],['PR',2],['MX',2],['VE',2]]),
 owner:Object.freeze([['US',69],['CA',7],['GB',5],['IE',4],['FR',3],['JP',2],['AU',1],['NZ',1],['DE',1],['AE',2],['SA',1],['PR',2],['MX',1],['VE',1]]),
 bloodstock_agent:Object.freeze([['US',54],['CA',8],['GB',12],['IE',12],['FR',4],['AU',2],['NZ',2],['DE',1],['JP',2],['AE',1],['SA',1],['PR',1]])
});
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const char of String(key)){h^=char.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
 h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0;
}
export const isInternationalNamingOrigin=code=>INTERNATIONAL_NAMING_ORIGINS.includes(code);
export function internationalCulture(seed,index,country){
 if(!isInternationalNamingOrigin(country))throw Error('Unsupported international naming country '+country);
 if(country==='CA')return hash(seed,'canadian-language:'+index)%100<27?'CA_FR':'CA_EN';
 if(country==='GB'){
  const value=hash(seed,'british-regional-language:'+index)%100;
  return value<12?'GB_SCOT':value<18?'GB_WALES':'GB_EN';
 }
 return country;
}
export function internationalGivenPool(country,cultureKey,birthYear,feminine){
 if(!isInternationalNamingOrigin(country)||!Number.isInteger(birthYear)||
   birthYear<1910||birthYear>1989)throw Error('Unsupported international person cohort');
 const profile=INTERNATIONAL_CULTURE_PROFILES[cultureKey];
 if(!profile||!(cultureKey===country||
    country==='CA'&&cultureKey.startsWith('CA_')||
    country==='GB'&&cultureKey.startsWith('GB_')))
  throw Error('International country/culture mismatch');
 return profile[(birthYear<1960?'old':'young')+(feminine?'F':'M')];
}
export function internationalSurnamePool(country,cultureKey){
 if(!isInternationalNamingOrigin(country)||
  !(cultureKey===country||country==='CA'&&cultureKey.startsWith('CA_')||
    country==='GB'&&cultureKey.startsWith('GB_')))
  throw Error('Unsupported international surname culture');
 return INTERNATIONAL_CULTURE_PROFILES[cultureKey].families;
}
export function drawInternationalGiven(seed,index,country,cultureKey,birthYear,feminine,attempt=0){
 const list=internationalGivenPool(country,cultureKey,birthYear,feminine);
 return list[hash(seed,'international-given:'+index+':'+country+':'+birthYear+':'+attempt)%list.length];
}
export function drawInternationalSurname(seed,index,country,cultureKey,attempt=0){
 const list=internationalSurnamePool(country,cultureKey);
 return list[hash(seed,'international-family:'+index+':'+country+':'+attempt)%list.length];
}
export function internationalProfessionOrigin(seed,index,role){
 const mix=INTERNATIONAL_ROLE_ORIGIN_MIXES[role];
 if(!mix)return null;
 const total=mix.reduce((n,x)=>n+x[1],0);
 let draw=hash(seed,'international-role:'+role+':'+index)%total;
 for(const [code,weight] of mix){draw-=weight;if(draw<0)return code}
 return mix.at(-1)[0];
}
export function internationalNameDisplayConvention(country){
 return country==='JP'?'GIVEN_FAMILY_ROMANIZED_NA_DIRECTORY':
  country==='AE'||country==='SA'?'GIVEN_FAMILY_ARABIC_TRANSLITERATION':
  'GIVEN_FAMILY_NA_DIRECTORY';
}
