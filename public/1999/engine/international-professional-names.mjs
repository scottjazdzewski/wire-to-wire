/**
 * WTW: curated international fictional racing-person naming in 1999.
 *
 * This is an editorial naming lexicon, not a measured 1999 national birth
 * register, census, ethnicity inference, or proof of citizenship.
 *
 * Country codes identify geographical *naming pools*. HK is Hong Kong (SAR,
 * China in 1999), not a claim that Hong Kong is a sovereign country. AE is
 * the United Arab Emirates; no automatically assigned hereditary titles.
 *
 * Historical context for international bloodstock networks:
 * https://www.thoroughbreddailynews.com/pdf/tdn/1999/tdn990929.pdf
 * https://www.thoroughbreddailynews.com/pdf/tdn/1999/tdn991221.pdf
 * https://gao.justia.com/department-of-agriculture/1992/10/international-trade-ggd-93-15/
 */
export const INTERNATIONAL_PROFESSIONAL_NAME_MODEL='WTW_1999_INTERNATIONAL_PROFESSIONAL_NAMES_V1';
export const INTERNATIONAL_NAMING_ORIGINS=Object.freeze([
 'CA','GB','IE','FR','DE','JP','AU','NZ','AE','HK'
]);
const split=str=>Object.freeze(str.trim().split(/\s+/).filter(Boolean));
const entry=(oldM,youngM,oldF,youngF,family)=>Object.freeze({
 oldM:split(oldM),youngM:split(youngM),
 oldF:split(oldF),youngF:split(youngF),family:split(family)
});
export const INTERNATIONAL_NAME_PROFILES=Object.freeze({
 CA:entry(
  'John Robert James William George Donald Charles Joseph Douglas Richard Gordon Kenneth Michel Jean Pierre André',
  'Michael David Christopher Brian Jason Kevin Andrew Daniel Patrick Scott Marc Jean François Éric Stéphane',
  'Mary Margaret Patricia Barbara Joan Dorothy Helen Susan Louise Monique Diane Claire Françoise',
  'Jennifer Michelle Lisa Christine Sarah Karen Julie Anne Sophie Nathalie Isabelle Catherine Mélanie',
  'Smith Brown Wilson Campbell Martin Thompson Taylor Anderson MacDonald Stewart Tremblay Gagnon Roy Bouchard Gauthier Côté Lavoie Bélanger Leclerc'),
 GB:entry(
  'John William George James Charles Edward Peter Richard David Michael Philip Anthony Brian Graham Nigel Hugh',
  'David Michael Andrew Paul Mark Simon Christopher Stephen Matthew James Richard Jonathan Nicholas Daniel',
  'Margaret Elizabeth Mary Patricia Anne Sheila Jean Barbara Judith Susan Caroline Frances',
  'Sarah Emma Claire Helen Catherine Louise Rachel Rebecca Nicola Laura Victoria Caroline Charlotte',
  'Smith Jones Williams Brown Taylor Davies Evans Wilson Thomas Johnson Roberts Walker Thompson White Hughes Edwards Clarke Hall Green Turner'),
 IE:entry(
  'Patrick John Michael James Thomas William Seamus Gerard Joseph Brendan Liam Francis Declan',
  'Michael Patrick David John Brian Paul Kevin Stephen Aidan Ciarán Niall Eoin Shane Sean',
  'Mary Margaret Kathleen Bridie Bridget Patricia Eileen Anne Maureen Noreen Sheila',
  'Mary Catherine Fiona Siobhán Niamh Deirdre Aoife Claire Orla Patricia Louise',
  "Murphy Kelly Byrne Walsh Ryan O'Brien O'Connor O'Neill Doyle McCarthy Gallagher Fitzgerald Sullivan Brennan Nolan Kennedy O'Sullivan"),
 FR:entry(
  'Jean Pierre Jacques Michel André Claude François Bernard Philippe Alain Marcel René Henri',
  'Jean Pierre Philippe Laurent Olivier Thierry Christophe Nicolas Frédéric Stéphane Éric Pascal Alexandre',
  'Marie Jeanne Françoise Monique Jacqueline Denise Nicole Michèle Claudine Madeleine',
  'Sophie Isabelle Nathalie Catherine Valérie Sandrine Christine Céline Caroline Stéphanie',
  'Martin Bernard Dubois Thomas Robert Richard Petit Durand Leroy Moreau Simon Laurent Lefebvre Michel Girard Roux Fontaine André'),
 DE:entry(
  'Hans Karl Peter Klaus Wolfgang Heinz Dieter Günter Gerhard Werner Helmut Friedrich Manfred',
  'Michael Thomas Andreas Stefan Markus Christian Martin Oliver Daniel Tobias Matthias Sebastian',
  'Ursula Helga Ingrid Renate Gisela Christa Brigitte Monika Karin Erika',
  'Sabine Claudia Andrea Petra Stefanie Susanne Nicole Daniela Sandra Martina Katharina',
  'Müller Schmidt Schneider Fischer Weber Meyer Wagner Becker Schulz Hoffmann Schäfer Koch Richter Bauer Klein Wolf Schröder Neumann'),
 JP:entry(
  'Hiroshi Takeshi Masao Kazuo Akira Kenji Takashi Isao Shigeru Toshio Noboru Hideo',
  'Daisuke Tatsuya Hiroyuki Masahiro Naoki Yusuke Kazuhiro Yuji Satoshi Koji Takashi',
  'Sachiko Yoshiko Kazuko Keiko Yoko Fumiko Sumiko Chieko Hiroko',
  'Yuki Ayumi Akiko Megumi Kaori Yuka Tomoko Rie Miho Naoko Haruka',
  'Sato Suzuki Takahashi Tanaka Watanabe Ito Yamamoto Nakamura Kobayashi Kato Yoshida Yamada Sasaki Yamaguchi Matsumoto Inoue Kimura Hayashi Shimizu'),
 AU:entry(
  'John Robert William James Peter David Michael Brian Geoffrey Ronald Graham Barry Kenneth',
  'Michael David Andrew Jason Matthew Christopher Paul Scott Mark Daniel Craig Stephen',
  'Margaret Patricia Helen Barbara Judith Susan Lorraine Christine Denise Janice',
  'Michelle Rebecca Sarah Kylie Nicole Amanda Lisa Melissa Jennifer Karen Rachel',
  'Smith Jones Williams Brown Wilson Taylor Johnson White Martin Anderson Thompson Walker Harris Robinson Clarke Mitchell'),
 NZ:entry(
  'John Robert William James Peter Brian David Graham Allan Bruce Donald Colin',
  'Michael David Andrew Mark Paul Jason Christopher Matthew Simon Daniel Stephen Richard',
  'Margaret Patricia Mary Barbara Helen Judith Susan Jean Anne Christine',
  'Sarah Rebecca Nicola Rachel Melissa Amanda Michelle Emma Kate Laura Catherine',
  'Smith Brown Wilson Taylor Williams Anderson Thompson Johnson Jones Campbell Martin Walker Robinson Harris Clarke McKenzie'),
 AE:entry(
  'Mohammed Ahmed Abdullah Saeed Khalid Rashid Salem Hamdan Hassan Ali Ibrahim Omar',
  'Mohammed Ahmed Khalid Saif Abdullah Rashid Sultan Hamad Faisal Omar Majid Tariq',
  'Fatima Aisha Maryam Khadija Amna Hessa Shamsa Salma'
  'Fatima Maryam Aisha Hind Latifa Noura Shamma Reem Mariam',
  'Al-Mansoori Al-Suwaidi Al-Mazrouei Al-Nuaimi Al-Dhaheri Al-Marri Al-Ketbi Al-Falasi Al-Kaabi Al-Shamsi Al-Rumaithi Al-Qubaisi Al-Hashimi'),
 HK:entry(
  'Wai-ming Chi-keung Kwok-leung Wing-chun Tak-wah Man-ho Ming-yiu Chi-fai'
  'Ka-ming Wai-kit Kin-fai Chi-ho Chun-ming Ho-yin Tak-long Chi-wai'
  'Siu-ling Mei-ling Lai-fong Yuk-lan Wai-fong Mei-han Yuk-ling Sau-lan'
  'Ka-yan Man-yee Hoi-lam Wing-yan Tsz-yan Mei-yee Chi-yan Pui-yee'
  'Chan Wong Lee Leung Cheung Lau Ho Ng Lam Yip Tsang Kwok Fong Choi Tong')
});
const mix=(...items)=>Object.freeze(items.map(p=>Object.freeze(p)));
/**
 * Fictional 1999 North American racing market: origin mix for internationally
 * active trainers, owner principals and bloodstock agents.
 *
 * Editorial modeling percentages, NOT reported industry demographic data.
 * Explicit user-provided originWeightsByRole always overrides these.
 */
export const DEFAULT_GLOBAL_PROFESSIONAL_ORIGIN_WEIGHTS=Object.freeze({
 trainer:mix(['US',66],['CA',8],['GB',8],['IE',7],['FR',4],['DE',2],['AU',2],['NZ',1],['JP',1],['AE',1]),
 owner:mix(['US',61],['CA',7],['GB',7],['IE',5],['FR',4],['DE',2],['JP',5],['AU',3],['NZ',2],['AE',3],['HK',1]),
 bloodstock_agent:mix(['US',45],['CA',6],['GB',12],['IE',14],['FR',7],['DE',3],['AU',5],['NZ',3],['JP',3],['AE',2])
});
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
 h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0;
}
export const isInternationalProfessionalNamingOrigin=code=>Object.hasOwn(INTERNATIONAL_NAME_PROFILES,code);
export function internationalGivenPool(country,birthYear,feminine){
 const p=INTERNATIONAL_NAME_PROFILES[country];
 if(!p||!Number.isInteger(birthYear)||birthYear<1910||birthYear>1989)
  throw Error('Unsupported international name origin or 1999 adult cohort');
 const key=(birthYear<1960?'old':'young')+(feminine?'F':'M');
 return p[key];
}
export function internationalSurnamePool(country){
 const p=INTERNATIONAL_NAME_PROFILES[country];
 if(!p)throw Error('Unsupported international surname origin '+country);
 return p.family;
}
export function drawInternationalGiven(seed,index,country,birthYear,feminine,attempt=0){
 const options=internationalGivenPool(country,birthYear,feminine);
 return options[hash(seed,'int-given:'+country+':'+index+':'+birthYear+':'+attempt)%options.length];
}
export function drawInternationalSurname(seed,index,country,attempt=0){
 const options=internationalSurnamePool(country);
 return options[hash(seed,'int-family:'+country+':'+index+':'+attempt)%options.length];
}
export function drawGlobalProfessionalOrigin(seed,index,role){
 const weights=DEFAULT_GLOBAL_PROFESSIONAL_ORIGIN_WEIGHTS[role];
 if(!weights)throw Error('No international professional mix for '+role);
 const sum=weights.reduce((n,entry)=>n+entry[1],0);
 let roll=hash(seed,'origin:'+index+':'+role)%sum;
 for(const [country,weight] of weights){roll-=weight;if(roll<0)return country}
 return weights.at(-1)[0];
}
export function validateInternationalNamingProfiles(){
 for(const [code,p] of Object.entries(INTERNATIONAL_NAME_PROFILES)){
  for(const key of ['oldM','youngM','oldF','youngF','family']){
   if(p[key].length<8)throw Error('International naming pool too small '+code+':'+key);
   if(new Set(p[key].map(norm)).size!==p[key].length)
    throw Error('Duplicate folded names in '+code+':'+key);
  }
 }
 for(const [role,entries] of Object.entries(DEFAULT_GLOBAL_PROFESSIONAL_ORIGIN_WEIGHTS)){
  if(entries.reduce((n,p)=>n+p[1],0)!==100)throw Error('Origin weight total != 100 for '+role);
  if(new Set(entries.map(p=>p[0])).size!==entries.length)throw Error('Repeated origins in '+role);
 }
 return true;
}
