/**
 * Historical name references for the 1999 North American Thoroughbred scene.
 * Exact owner labels remain archive-only. Fictional owners draw only verified
 * personal surname components; farm and stable names never become surnames.
 */
const NTRA_POLL_URL='https://sudoku.infoplease.com/sports/1999-season/ntra-national-thoroughbred-poll';
const BREEDERS_CUP_RECAP_URL='https://stats.breederscup.com/bcosShowDocument.cfm?id=21';
const BREEDERS_CUP_FIELD_URL='https://www.latimes.com/archives/la-xpm-1999-nov-04-sp-29892-story.html';
const KENTUCKY_DERBY_FIELD_URL='https://www.latimes.com/archives/la-xpm-1999-may-01-sp-33118-story.html';
const PREAKNESS_FIELD_URL='https://www.latimes.com/archives/la-xpm-1999-may-15-sp-37548-story.html';
const PREAKNESS_RESULT_URL='https://www.godolphin.com/runners-and-results/racecard/267888';
const FRANCE_GALOP_LEADERS_URL='https://www.thoroughbreddailynews.com/pdf/tdn/1999/tdn991206.pdf';
const NTRA_ECLIPSE_URL='https://www.ntra.com/eclipse-awards/history/';

const record=(name,source,referenceDate,url,surnames=[])=>Object.freeze({
 name,source,referenceYear:1999,referenceDate,url,surnames:Object.freeze(surnames)
});

const poll=(name,surnames=[])=>record(name,'NTRA_1999_THOROUGHBRED_POLL','1999-09-19',NTRA_POLL_URL,surnames);
const cup=(name,surnames=[])=>record(name,'BREEDERS_CUP_1999_WINNER_RECAP','1999-11-06',BREEDERS_CUP_RECAP_URL,surnames);
const field=(name,surnames=[])=>record(name,'LOS_ANGELES_TIMES_1999_BREEDERS_CUP_FIELD','1999-11-04',BREEDERS_CUP_FIELD_URL,surnames);
const derby=(name,surnames=[])=>record(name,'LOS_ANGELES_TIMES_1999_KENTUCKY_DERBY_FIELD','1999-05-01',KENTUCKY_DERBY_FIELD_URL,surnames);
const preakness=(name,surnames=[])=>record(name,'LOS_ANGELES_TIMES_1999_PREAKNESS_FIELD','1999-05-15',PREAKNESS_FIELD_URL,surnames);
const preaknessResult=(name,surnames=[])=>record(name,'GODOLPHIN_1999_PREAKNESS_RESULT','1999-05-15',PREAKNESS_RESULT_URL,surnames);
const france=(name,surnames=[])=>record(name,'FRANCE_GALOP_1999_OWNER_EARNINGS','1999-12-02',FRANCE_GALOP_LEADERS_URL,surnames);
const eclipse=(name,surnames=[])=>record(name,'NTRA_1999_ECLIPSE_OWNER_BREEDER_AWARDS',null,NTRA_ECLIPSE_URL,surnames);

export const VERIFIED_RACING_OWNER_NAMES_1999=Object.freeze([
 poll('Rudlein Stable & W. Clifton Jr.',['Clifton']),
 poll('Michael E. Pegram',['Pegram']),
 poll('Jeanne G. Vance',['Vance']),
 poll('J. Tafel & Jayeff Stables',['Tafel']),
 poll('Golden Eagle Farm'),
 poll('Stonerside Stable'),
 poll('Robert & Beverly Lewis',['Lewis']),
 poll('A. Hancock III & J. Stone',['Hancock','Stone']),
 poll('Prestonwood Farms'),
 poll('James T. Scatuorchio',['Scatuorchio']),

 cup('J. Oxley',['Oxley']),
 cup('Padua Stables'),
 cup('Lanni, Schiappa & Poslosky',['Lanni','Schiappa','Poslosky']),
 cup('Paraneck Stable'),
 cup('Phillips Racing Partnership'),
 cup('The Thoroughbred Corp.'),
 cup('Godolphin Racing Inc.'),
 cup('Overbrook Farm'),

 // Personal and partnership names from the full 1999 Breeders’ Cup field.
 field('Jack Garey',['Garey']),
 field('J.A. Chandler',['Chandler']),
 field('Jim Tafel & Jayoff B Stables',['Tafel']),
 field('Mr. & Mrs. Robert Randall',['Randall']),
 field('John Oxley',['Oxley']),
 field('Daniel Wildenstein',['Wildenstein']),
 field('Marshall Naify',['Naify']),
 field('Satish Sanan & Anne Sanan',['Sanan']),
 field('Jaime Carrion',['Carrion']),
 field('Debby Oxley',['Oxley']),
 field('Mrs. T. Hyde & Mrs. P. Shanahan',['Hyde','Shanahan']),
 field('Gary Tanaka',['Tanaka']),
 field('John Peace',['Peace']),
 field('Dave & Jill Heerensperger',['Heerensperger']),
 field('J.D. Martin & R. Barby',['Martin','Barby']),
 field('Ernest Samuel',['Samuel']),
 field('Sidney Craig',['Craig']),
 field('Allen Paulson',['Paulson']),
 field('Ogden Phipps',['Phipps']),
 field('Headley, Molasky & Molasky',['Headley','Molasky']),
 field('Julius Zolozzi',['Zolozzi']),
 field('Michael Tabor & Mrs. J. Magnier',['Tabor','Magnier']),
 field('Aaron & Marie Jones',['Jones']),
 field('David Reynolds',['Reynolds']),
 field('James Tafel',['Tafel']),
 field('Asistio, BBC Stables, Davenport',['Asistio','Davenport']),
 field('Albert Fried Jr.',['Fried']),
 field('Mr. & Mrs. Jerome Moss',['Moss']),
 field('Mark Stanley',['Stanley']),
 field('David Milch',['Milch']),
 field('William Betz & Philip Needham',['Betz','Needham']),
 field('Lewis, Magnier & Tabor',['Lewis','Magnier','Tabor']),
 field('Eugene & Laura Melnyk',['Melnyk']),
 field('Nelson Bunker Hunt',['Hunt']),
 field('John Franks',['Franks']),
 field('H. Sarkowsky',['Sarkowsky']),
 field('John Sikura Jr. & Glenn Sikura',['Sikura']),
 field('Gerald Leigh',['Leigh']),
 field('Flaxman Ltd. & Bouchard',['Bouchard']),
 field('Ecurie Fabien Ouaki',['Ouaki']),
 field('Robert Schaedle',['Schaedle']),
 field('Prince Fahd Salman',['Salman']),
 field('Robin Martin & Steve Weiner',['Martin','Weiner']),
 field('Charles Cella',['Cella']),
 field('Kenneth & Sarah Ramsey',['Ramsey']),
 field('Hugo Reynolds',['Reynolds']),
 field('W. Bruce Lunsford',['Lunsford']),
 field('Jeffrey Sengara',['Sengara']),
 field('Peter Harris',['Harris']),

 // Additional personal and stable labels from the complete 1999 Kentucky
 // Derby and Preakness fields, alongside a contemporaneous European standings
 // table sourced to France Galop.
 derby('Godolphin Stable'),
 derby('Barry Schwartz',['Schwartz']),
 derby('Stephen Hilbert',['Hilbert']),
 derby('Aaron and Marie Jones',['Jones']),
 derby('T N T Stud'),
 derby('Bob and Beverly Lewis',['Lewis']),
 derby('James Jackson',['Jackson']),
 derby('Allen and Madeleine Paulson',['Paulson']),
 derby('Prairie Star Racing and Gunther',['Gunther']),
 derby('J. Stone and A. Hancock III',['Stone','Hancock']),
 derby('John and Betty Mabee',['Mabee']),

 preakness('Classic Stable'),
 preakness('Southbelle Stable'),
 preakness('M. Langford and Classic Stable',['Langford']),
 preaknessResult('John Gunther and Prairie Star Racing',['Gunther']),

 france('Wertheimer et Frere',['Wertheimer']),
 france('H H the Aga Khan',['Khan']),
 france('Jean-Luc Lagardere',['Lagardere']),
 france('Michael Tabor',['Tabor']),
 france('Khalid Abdullah',['Abdullah']),
 france('Sheikh Mohammed bin Rashid al Maktoum',['Maktoum']),
 france('Sheikh Maktoum bin Rashid al Maktoum',['Maktoum']),
 france('Mise de Moratalla',['Moratalla']),
 france('Godolphin'),

 eclipse('Frank Stronach',['Stronach']),
 eclipse('William S. Farish',['Farish'])
]);

export const VERIFIED_RACING_OWNER_SURNAME_INPUTS_1999=Object.freeze([
 ...new Set(VERIFIED_RACING_OWNER_NAMES_1999.flatMap(item=>item.surnames))
]);
