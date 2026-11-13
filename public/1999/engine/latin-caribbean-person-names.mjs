/**
 * Fictional 1999 Latin American & Caribbean personal naming ecology.
 *
 * Each geographical origin has its own curated name inventory. Birth-year
 * cohorts control which given-name inventory is preferred. These are
 * EDITORIAL period-plausibility pools, NOT national civil-registry percentages.
 *
 * Spanish-speaking person display names can include first paternal + second
 * maternal surname. Brazilian Portuguese ordering is typically maternal +
 * paternal. The primary family name is retained separately to prevent
 * "family business" and trainer-stable names from taking the wrong surname.
 *
 * Does not classify or infer a real person's ethnicity or citizenship.
 * Puerto Rico's PR geographic code refers to a U.S. territory.
 */
export const LATIN_CARIBBEAN_NAME_MODEL='WTW_LATIN_CARIBBEAN_1999_PERIOD_PERSON_NAMES_V1';
export const REGIONAL_NAMING_ORIGINS=Object.freeze(['PR','PA','VE','MX','CL','PE','CO','DO','AR','UY','BR']);
const split=s=>Object.freeze(s.split(' ').filter(Boolean));
const unique=a=>Object.freeze([...new Set(a)]);
const COMMON=Object.freeze({
 oldM:split('José Juan Carlos Luis Antonio Manuel Francisco Miguel Rafael Pedro Roberto Ramón Fernando Jorge Ricardo Héctor Eduardo Raúl Julio Alberto Oscar Enrique Víctor Guillermo Orlando Armando'),
 youngM:split('José Carlos Luis Miguel Juan Javier Ángel Alejandro Andrés Daniel Eduardo Gabriel Rafael Jorge Fernando Ricardo Manuel Víctor David Francisco Julio Sergio'),
 oldF:split('María Carmen Ana Rosa Teresa Isabel Elena Mercedes Beatriz Lucía Patricia Lourdes Olga Marta Gloria Alicia Margarita Silvia Josefina'),
 youngF:split('María Ana Laura Gabriela Carolina Adriana Daniela Andrea Patricia Verónica Claudia Alejandra Natalia Paola Sandra Marcela Isabel Lucía Valeria Vanessa'),
 family:split('García Rodríguez González Martínez Hernández López Pérez Sánchez Ramírez Torres Flores Rivera Gómez Díaz Ortiz Morales Ruiz Álvarez Cruz Jiménez Romero Castro Mendoza Vargas Salazar Rojas Silva Castillo Fernández Navarro')
});
const country=(oldM,youngM,oldF,youngF,family)=>Object.freeze({
 oldM:split(oldM),youngM:split(youngM),oldF:split(oldF),youngF:split(youngF),family:split(family)
});
export const COUNTRY_NAME_PROFILES=Object.freeze({
 PR:country(
  'José Juan Luis Rafael Ángel Héctor Carlos Roberto Miguel Ramón Edgardo Orlando Víctor Wilfredo',
  'Luis Carlos Miguel José Ángel Javier Edwin Juan Héctor Jorge Efraín Alexis Ricardo Jonathan',
  'María Carmen Ana Luz Rosa Nilda Iris Olga Marta Milagros Ivette',
  'María Mayra Maribel Yadira Lourdes Brenda Ivette Maritza Jennifer Lisette',
  'Rivera Rodríguez Santiago Ortiz Cordero Velázquez Figueroa González Morales Rosado Torres Colón Burgos Mercado Ramos Vélez'),
 PA:country(
  'Roberto Ricardo Carlos José Luis Manuel Ernesto Víctor Rubén Guillermo Alberto Fernando',
  'Luis Carlos José Gabriel Ricardo Javier Ernesto Roberto Manuel Miguel Alexis Rafael',
  'María Carmen Ana Rosa Mercedes Luz Teresa Alba Olga Nidia',
  'María Ana Karina Gabriela Andrea Tatiana Claudia Yadira Melissa',
  'Batista Arias Tejada Escobar Quintero Mendoza González Pérez Castillo Valdés DeGracia Paredes Moreno Núñez Murillo'),
 VE:country(
  'José Luis Carlos Rafael Ramón Antonio Héctor Jesús Manuel Francisco Pedro',
  'José Luis Carlos Miguel Andrés Alejandro Rafael Ángel Víctor Daniel Jesús',
  'María Carmen Ana Rosa Teresa Mercedes Alicia Josefina Alba',
  'María Andreína Adriana Carolina Daniela Gabriela Yelitza Alejandra Verónica',
  'Domínguez Castellanos Rivas Jiménez Blanco Martínez Rojas Herrera Rodríguez González Mendoza Pacheco Medina Suárez Urdaneta'),
 MX:country(
  'José Juan Manuel Antonio Francisco Jesús Pedro Ramón Ernesto Carlos',
  'José Juan Luis Miguel Jesús Carlos Alejandro Jorge Eduardo Javier Arturo',
  'María Guadalupe Juana Carmen Rosa Teresa Josefina Francisca Concepción',
  'María Guadalupe Ana Patricia Adriana Laura Gabriela Alejandra Claudia',
  'Hernández García Martínez López González Pérez Ramírez Sánchez Flores Torres Romero Aguilar Vázquez Mendoza Ortega'),
 CL:country(
  'Juan José Luis Carlos Pedro Sergio Alberto Manuel Fernando Jorge',
  'Juan José Carlos Cristián Felipe Sebastián Rodrigo Francisco Pablo Matías',
  'María Carmen Teresa Isabel Rosa Cecilia Ana Alicia',
  'María Carolina Francisca Daniela Claudia Paula Constanza Andrea Camila',
  'González Muñoz Rojas Díaz Pérez Soto Contreras Silva Morales Sepúlveda Valenzuela Fuentes Araya Espinoza'),
 PE:country(
  'José Juan Luis Pedro Manuel Carlos Víctor Ricardo Alberto Raúl',
  'José Luis Carlos Juan Jorge Miguel Javier Edwin Percy Christian',
  'María Carmen Rosa Julia Teresa Ana Elsa Mercedes',
  'María Patricia Cecilia Rosa Claudia Roxana Verónica Gabriela Fiorella',
  'Quispe Huamán Flores García Ramos Rojas Chávez Mendoza Torres Vargas Paredes Castillo Gutiérrez Salazar'),
 CO:country(
  'José Luis Carlos Jorge Guillermo Antonio Álvaro Hernando Alberto',
  'Juan Carlos Andrés Felipe Alejandro Camilo Mauricio Sebastián Javier',
  'María Carmen Luz Teresa Olga Gloria Amparo Cecilia',
  'María Andrea Carolina Diana Paola Adriana Natalia Marcela Liliana',
  'Rodríguez Martínez García González Hernández López Gómez Pérez Sánchez Ramírez Moreno Vargas Cárdenas Restrepo'),
 DO:country(
  'José Juan Ramón Pedro Rafael Antonio Luis Manuel Francisco Héctor',
  'José Luis Juan Carlos Miguel Ángel Rafael Julio Víctor Edwin',
  'María Carmen Ana Rosa Altagracia Mercedes Teresa',
  'María Yudelka Carolina Ana Patricia Yadira Maribel Vanessa',
  'Rodríguez Pérez Martínez García Reyes Sánchez Cruz Díaz Morales Ortiz Núñez Santana Rosario Báez deJesus'),
 AR:country(
  'Juan José Carlos Jorge Alberto Ricardo Roberto Raúl Héctor Osvaldo',
  'Juan Martín Diego Pablo Fernando Sebastián Federico Nicolás Mariano',
  'María Elena Marta Susana Graciela Beatriz Norma Alicia',
  'María Laura Verónica Andrea Florencia Romina Gabriela Cecilia Carolina',
  'González Rodríguez Fernández López Martínez Pérez García Sánchez Romero Álvarez Acosta Sosa Díaz Giménez'),
 UY:country(
  'Juan José Carlos Luis Jorge Héctor Julio Alberto Roberto',
  'Juan Pablo Martín Sebastián Nicolás Diego Gonzalo Federico Fernando',
  'María Carmen Ana Graciela Teresa Marta Alicia',
  'María Verónica Carolina Andrea Natalia Lucía Valentina',
  'Rodríguez Fernández González Martínez Pérez García Silva Pereira López Díaz Olivera Suárez Cabrera Núñez'),
 BR:country(
  'José João Antônio Carlos Paulo Luiz Francisco Roberto Pedro Marcos',
  'João Paulo Carlos Rafael Felipe Marcelo Fábio Thiago Rodrigo Alexandre',
  'Maria Ana Francisca Terezinha Aparecida Fátima Lúcia Helena',
  'Maria Ana Juliana Fernanda Luciana Camila Renata Carla Patrícia',
  'Silva Santos Oliveira Souza Costa Pereira Rodrigues Almeida Carvalho Gomes Ribeiro Martins Ferreira Lima Barbosa Rocha Nascimento Araújo Mendes Correia')
});
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const ch of String(key)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
 h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0;
}
const pick=(values,seed,key)=>values[hash(seed,key)%values.length];
const folded=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const isLatinCaribbeanNamingOrigin=code=>Object.hasOwn(COUNTRY_NAME_PROFILES,code);
export function regionalGivenPool(countryCode,birthYear,feminine){
 const group=COUNTRY_NAME_PROFILES[countryCode];
 if(!group||!Number.isInteger(birthYear)||birthYear<1910||birthYear>1989)
  throw Error('Unsupported Latin/Caribbean country or 1999 adult birth cohort');
 const older=birthYear<1960,kind=(older?'old':'young')+(feminine?'F':'M');
 // Inventories are deliberately layered, not claimed demographic frequency.
 return unique([...group[kind],...COMMON[kind]]);
}
export function regionalSurnamePool(countryCode){
 const group=COUNTRY_NAME_PROFILES[countryCode];
 if(!group)throw Error('Unsupported Latin/Caribbean surname origin '+countryCode);
 if(countryCode==='BR')return group.family;
 return unique([...group.family,...COMMON.family]);
}
export function drawRegionalGiven(seed,index,countryCode,birthYear,feminine,attempt=0){
 const group=COUNTRY_NAME_PROFILES[countryCode];
 if(!group)throw Error('Unsupported Latin/Caribbean name origin');
 const kind=(birthYear<1960?'old':'young')+(feminine?'F':'M');
 const list=hash(seed,'regional-given-source:'+index+':'+attempt)%100<64?
  group[kind]:COMMON[kind];
 return pick(list,seed,'regional-given:'+index+':'+countryCode+':'+birthYear+':'+attempt);
}
export function drawRegionalSurname(seed,index,countryCode,attempt=0,slot='paternal'){
 const group=COUNTRY_NAME_PROFILES[countryCode];
 if(!group)throw Error('Unsupported Latin/Caribbean surname origin');
 const preferLocal=countryCode==='BR'||hash(seed,'regional-family-source:'+index+':'+slot+':'+attempt)%100<70;
 const pool=preferLocal?group.family:COMMON.family;
 return pick(pool,seed,'regional-family:'+countryCode+':'+index+':'+slot+':'+attempt);
}
const SPANISH_COMPOUNDS=Object.freeze({
 'José':split('Luis Antonio Manuel Miguel Carlos María'),
 'Juan':split('Carlos José Pablo Manuel Antonio David'),
 'Luis':split('Miguel Alberto Fernando Enrique Antonio'),
 'Carlos':split('Alberto Andrés Eduardo Mario'),
 'Miguel':split('Ángel Antonio'),
 'María':split('Elena Teresa Isabel Carmen José Fernanda'),
 'Ana':split('María Isabel Lucía Patricia'),
 'Rosa':split('María Elena'),
 'Jorge':split('Luis Alberto'),
 'Ángel':split('Luis'),
 'Víctor':split('Manuel'),
 'Francisco':split('Javier José')
});
const BRAZIL_COMPOUNDS=Object.freeze({
 'João':split('Paulo Carlos Pedro Luiz'),
 'José':split('Carlos Antônio Roberto Luiz'),
 'Luiz':split('Carlos Fernando Antônio'),
 'Maria':split('Aparecida Lúcia Helena Cristina'),
 'Ana':split('Paula Maria Lúcia'),
 'Carlos':split('Eduardo Henrique Roberto')
});
export function regionalCompoundGiven(seed,index,countryCode,firstName,birthYear){
 if(!isLatinCaribbeanNamingOrigin(countryCode))return null;
 const pairs=countryCode==='BR'?BRAZIL_COMPOUNDS:SPANISH_COMPOUNDS;
 const variants=pairs[firstName]??pairs[Object.keys(pairs).find(k=>folded(k)===folded(firstName))];
 if(!variants||!variants.length)return null;
 const second=pick(variants,seed,'regional-compound:'+index+':'+countryCode+':'+birthYear);
 return firstName+' '+second;
}
