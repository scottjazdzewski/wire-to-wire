/**
 * Historical name references from 1999 Thoroughbred racing across regions.
 * Exact owner labels remain archive-only. Fictional owners draw only verified
 * personal surname components; farm and stable names never become surnames.
 */
const NTRA_POLL_URL='https://sudoku.infoplease.com/sports/1999-season/ntra-national-thoroughbred-poll';
const BREEDERS_CUP_RECAP_URL='https://stats.breederscup.com/bcosShowDocument.cfm?id=21';
const BREEDERS_CUP_FIELD_URL='https://www.latimes.com/archives/la-xpm-1999-nov-04-sp-29892-story.html';
const KENTUCKY_DERBY_FIELD_URL='https://www.latimes.com/archives/la-xpm-1999-may-01-sp-33118-story.html';
const PREAKNESS_FIELD_URL='https://www.latimes.com/archives/la-xpm-1999-may-15-sp-37548-story.html';
const PREAKNESS_RESULT_URL='https://www.godolphin.com/runners-and-results/racecard/267888';
const BELMONT_STAKES_RESULT_URL='https://www.belmontstakes.com/uploads/historical_races/history_pdf_1999.pdf';
const JAPAN_CUP_1999_RESULT_URL='https://japanracing.jp/en/japancup/jc/past_pdf/1999.pdf';
const HONG_KONG_JOCKEY_CLUB_1999_INTERNATIONAL_WINNERS_URL='https://corporate.hkjc.com/image/201411/2014HKIR_Media_Guide_ENG.pdf';
const HONG_KONG_DERBY_1999_RESULT_URL='https://www.racingpost.com/results/416/sha-tin/1999-03-07/263979/';
const HONG_KONG_CLASSIC_MILE_1999_OWNER_URL='https://racing.hkjc.com/en-us/local/information/ownersearch?horseowner=James+Lau+Po+Man+%7C+Alice+Woo+Wai+See';
const FRANCE_GALOP_LEADERS_URL='https://www.thoroughbreddailynews.com/pdf/tdn/1999/tdn991206.pdf';
const TDN_1999_US_AND_HONG_KONG_RESULTS_URL='https://www.thoroughbreddailynews.com/pdf/tdn/1999/tdn991206.pdf';
const TDN_1999_OCTOBER_30_RESULTS_URL='https://www.thoroughbreddailynews.com/pdf/tdn/1999/tdn991030.pdf';
const TDN_1999_JANUARY_18_RESULTS_URL='https://www.thoroughbreddailynews.com/pdf/tdn/1999/tdn990118.pdf';
const TDN_1999_NOVEMBER_29_RESULTS_URL='https://www.thoroughbreddailynews.com/pdf/tdn/1999/tdn991129.pdf';
const TDN_1999_NOVEMBER_30_RESULTS_URL='https://www.thoroughbreddailynews.com/pdf/tdn/1999/tdn991130.pdf';
const TDN_1999_DECEMBER_9_RESULTS_URL='https://www.thoroughbreddailynews.com/pdf/tdn/1999/tdn991209.pdf';
const BREEDERS_CUP_1999_JUVENILE_CHART_URL='https://stats.breederscup.com/bcosRaceChart.cfm?race_id=420';
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
const belmont=(name,surnames=[])=>record(name,'NYRA_1999_BELMONT_STAKES_RESULT','1999-06-05',BELMONT_STAKES_RESULT_URL,surnames);
const japanCup=(name,surnames=[])=>record(name,'JAPAN_RACING_ASSOCIATION_1999_JAPAN_CUP_RESULT','1999-11-28',JAPAN_CUP_1999_RESULT_URL,surnames);
const hongKongInternational=(name,surnames=[])=>record(name,'HONG_KONG_JOCKEY_CLUB_1999_INTERNATIONAL_RACE_WINNER',null,HONG_KONG_JOCKEY_CLUB_1999_INTERNATIONAL_WINNERS_URL,surnames);
const hongKongDerby=(name,surnames=[])=>record(name,'RACING_POST_1999_HONG_KONG_DERBY_RESULT','1999-03-07',HONG_KONG_DERBY_1999_RESULT_URL,surnames);
const hongKongClassicMile=(name,surnames=[])=>record(name,'HONG_KONG_JOCKEY_CLUB_1999_CLASSIC_MILE_OWNER',null,HONG_KONG_CLASSIC_MILE_1999_OWNER_URL,surnames);
const france=(name,surnames=[])=>record(name,'FRANCE_GALOP_1999_OWNER_EARNINGS','1999-12-02',FRANCE_GALOP_LEADERS_URL,surnames);
const tdnOwners=(name,surnames=[])=>record(name,'THOROUGHBRED_DAILY_NEWS_1999_OWNER_RESULTS','1999-12-06',TDN_1999_US_AND_HONG_KONG_RESULTS_URL,surnames);
const tdnOwnerIssue=(name,referenceDate,url,surnames=[])=>record(name,
 'THOROUGHBRED_DAILY_NEWS_1999_OWNER_RESULTS',referenceDate,url,surnames);
const tdnNov29=(name,surnames=[])=>record(name,
 'THOROUGHBRED_DAILY_NEWS_1999_NOVEMBER_29_OWNER_RESULTS','1999-11-29',
 TDN_1999_NOVEMBER_29_RESULTS_URL,surnames);
const tdnJan18=(name,surnames=[])=>record(name,
 'THOROUGHBRED_DAILY_NEWS_1999_JANUARY_18_OWNER_RESULTS','1999-01-18',
 TDN_1999_JANUARY_18_RESULTS_URL,surnames);
const breedersCupJuvenile=(name,surnames=[])=>record(name,
 'EQUIBASE_1999_BREEDERS_CUP_JUVENILE_CHART','1999-11-06',BREEDERS_CUP_1999_JUVENILE_CHART_URL,surnames);
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

 // NYRA's full Belmont Stakes result chart adds owner and partnership names
 // outside the Kentucky Derby, Preakness and Breeders' Cup lists.
 belmont('Jeanne G. Vance and Laddie Dance',['Vance','Dance']),
 belmont('Bohemia Stable'),
 belmont('Joyce and Roy K. Monroe',['Monroe']),
 belmont('Noreen Carpenito',['Carpenito']),
 belmont('Robert Perez',['Perez']),
 belmont('Arthur B. Hancock III and James Stone',['Hancock','Stone']),

 // The JRA's official international-field chart adds Japanese, Hong Kong,
 // German and British owner-name references alongside the U.S. pool.
 japanCup('H. Usuda',['Usuda']),
 japanCup('Y. H. Pang',['Pang']),
 japanCup('Godolphin'),
 japanCup('M. Tabor',['Tabor']),
 japanCup('K. Nagai',['Nagai']),
 japanCup('Shadai Race Horse Co.'),
 japanCup('Midori Jutaku Co.'),
 japanCup('Gestut Ammerland'),
 japanCup('M. Doyle',['Doyle']),
 japanCup('Baron G. von Ullmann',['Ullmann']),
 japanCup('Hagimoto Kikaku Co.'),
 japanCup('T. Umezaki',['Umezaki']),
 japanCup('H. Yamaji',['Yamaji']),
 japanCup('T. Yoshida',['Yoshida']),
 japanCup('K. Rausing',['Rausing']),

 // Hong Kong's 1999 Derby and inaugural International Races include local
 // owners outside the North American and European records above.
 hongKongDerby('Mr. and Mrs. M. C. Kwee',['Kwee']),
 hongKongDerby('Dr. Chang Fuk To',['Chang']),
 hongKongDerby('C. K. Hui',['Hui']),
 hongKongClassicMile('James Lau Po Man and Alice Woo Wai See',['Lau','Woo']),
 hongKongInternational('Mr. and Mrs. Lau Sak Hong',['Lau']),
 hongKongInternational('J. D. Martin and R. Barby',['Martin','Barby']),

 // TDN's Dec. 6, 1999 race-result pages identify owners across U.S. regions,
 // Britain and Hong Kong, adding local partnerships and private owners.
 tdnOwners('John and John Phillips',['Phillips']),
 tdnOwners('Wahlgren Family Trust',['Wahlgren']),
 tdnOwners('Asitio B B C Stables and Davenport',['Asitio','Davenport']),
 tdnOwners('Stuart John D',['Stuart']),
 tdnOwners('Edwin H. Wachtel',['Wachtel']),
 tdnOwners('Roddy J. Valente',['Valente']),
 tdnOwners('Ruth Goldman',['Goldman']),
 tdnOwners('Jerry D. Campbell',['Campbell']),
 tdnOwners('Ed and Jim Pawluk',['Pawluk']),
 tdnOwners('Lui Siu-mun',['Lui']),
 tdnOwners('Cheung King-yau',['Cheung']),
 tdnOwners('James Ryan and L T B Inc',['Ryan','James']),
 tdnOwners('Franklyn Macaron',['Macaron']),
 tdnOwners('Steve Holland and Estate of Barry Shipp',['Holland','Shipp']),
 tdnOwners('James M. Levitch',['Levitch']),
 tdnOwners('Frank Mancari and Michael B. Reavis',['Mancari','Reavis']),
 tdnOwners('Merle L. Cables',['Cables']),
 tdnOwners('Richard C. Porter III',['Porter']),
 tdnOwners('Donald R. Buse',['Buse']),
 tdnOwners('Evelyn Cochran, Zortman Enterprises and Robert Anderson',['Cochran','Anderson']),
 tdnOwners('David G. Mounts',['Mounts']),
 tdnOwners('Charles B. Lyman and Joseph W. Holman',['Lyman','Holman']),
 tdnOwners('John S. Barberino',['Barberino']),
 tdnOwners('Terry Raymond',['Raymond']),
 tdnOwners('Joe Schwankhart',['Schwankhart']),
 tdnOwners('Robert A. Koch',['Koch']),
 tdnOwners('Richard E. Gottschall',['Gottschall']),

 // The Nov. 29 issue reports full owner labels from Nov. 28 stakes and
 // regional cards. The labels remain references; only personal surnames are
 // eligible for fictional owner-name generation.
 tdnNov29('Pang Yuen Hing',['Pang','Yuen']),
 tdnNov29('Columbine Stable Jones and Nicholls Jr.',['Jones','Nicholls']),
 tdnNov29('Bully Livitsanos and Dion A. Recachina',['Livitsanos','Recachina']),
 tdnNov29('Ogden Phipps',['Phipps']),
 tdnNov29('Herman Greenberg',['Greenberg']),
 tdnNov29('Alvin Akman',['Akman']),
 tdnNov29('Thomas J. Carroll',['Carroll']),
 tdnNov29('C. L. Hirsch',['Hirsch']),
 tdnNov29('Peter W. Salmen Jr.',['Salmen']),
 tdnNov29('Bruno Schickedanz',['Schickedanz']),
 tdnNov29('Marjorie and Irving M. Cowan',['Cowan']),
 tdnNov29('Don C. McNeill',['McNeill']),
 tdnNov29('Dennis E. Weir',['Weir']),
 tdnNov29('James E. and Vicki J. Riddle',['Riddle']),
 tdnNov29('John B. Davidson',['Davidson']),
 tdnNov29('Larry N. Brafman',['Brafman']),
 tdnNov29('Heiligbrodt Racing Stable'),
 tdnNov29('William M. Allen',['Allen']),
 tdnNov29('Kenneth L. and Sarah K. Ramsey',['Ramsey']),
 tdnNov29('D. Ball and H. Galbraith',['Ball','Galbraith']),
 tdnNov29('Richard Ransom and Terry Yoshikawa',['Ransom','Yoshikawa']),
 tdnNov29('Matthew Sularski',['Sularski']),
 tdnNov29('Edward J. Womac Jr.',['Womac']),
 tdnNov29('Elizabeth Everard',['Everard']),
 tdnNov29('D Liberty Stable and Rossi Stable'),
 tdnNov29('Lajos Kengye',['Kengye']),
 tdnNov29('John L. Cox and Nima Secrest',['Cox','Secrest']),
 tdnNov29('Lin Grisham and Team Block',['Grisham']),
 tdnNov29('Richard C. Porter III',['Porter']),
 tdnNov29('Robert A. Koch',['Koch']),
 tdnNov29('Richard E. Gottschall',['Gottschall']),

 // January 1999 weekend results add private and international owners from
 // Gulfstream, Santa Anita, Laurel, Turf Paradise and Hong Kong.
 tdnJan18('W. S. Farish and J. D. Jamail',['Farish','Jamail']),
 tdnJan18('John H. Peace',['Peace']),
 tdnJan18('Bea and Robert H. Roberts',['Roberts']),
 tdnJan18('Harriet Finkelstein',['Finkelstein']),
 tdnJan18('Hung Yat Fai',['Hung']),
 tdnJan18('Frederick Leung Sek-cheung',['Leung']),
 tdnJan18('B. W. Hughes',['Hughes']),
 tdnJan18('Alfred G. Vanderbilt',['Vanderbilt']),
 tdnJan18('Massengale and Sledge Stable Sr.',['Massengale']),
 tdnJan18('Mr. Ali Rashid Alraihe',['Alraihe']),
 tdnJan18('Sheikh Saeed bin Maktoum al Maktoum',['Maktoum']),
 tdnJan18('David P. Reynolds',['Reynolds']),
 tdnJan18('Dennis E. Weir',['Weir']),

 // Contemporaneous daily result pages add smaller U.S. and Japanese owners,
 // including partnerships outside the Triple Crown and championship fields.
 tdnOwnerIssue('Jeanne G. Vance','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Vance']),
 tdnOwnerIssue('Charles F. Haugh Jr.','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Haugh']),
 tdnOwnerIssue('Robert Barney and John T. Dee','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Barney','Dee']),
 tdnOwnerIssue('Rush Racing Stable','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL),
 tdnOwnerIssue('Kennet Valley Thoroughbreds IV','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL),
 tdnOwnerIssue('James S. Karp','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Karp']),
 tdnOwnerIssue('Gus Goldsmith','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Goldsmith']),
 tdnOwnerIssue('Pam Slaughter and Carol Cox','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Slaughter','Cox']),
 tdnOwnerIssue('Henry Pabst','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Pabst']),
 tdnOwnerIssue('Mary and Gary West Stable','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['West']),
 tdnOwnerIssue('McKee Stables','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['McKee']),
 tdnOwnerIssue('VHW Stables','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL),
 tdnOwnerIssue('Austin Delaney','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Delaney']),
 tdnOwnerIssue('My Jo Lee Stable and Gregory Equine','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Lee','Gregory']),
 tdnOwnerIssue('Colebrook Farms','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL),
 tdnOwnerIssue('Michele Boyce Racing and Cherrywood Racing Stable','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Boyce']),
 tdnOwnerIssue('Edmond A. Hudon and Sharon Hudon','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Hudon']),
 tdnOwnerIssue('Sunshine Thoroughbred Corporation','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL),
 tdnOwnerIssue('Bosswins Farm','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL),
 tdnOwnerIssue('Annette M. Eubanks','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Eubanks']),
 tdnOwnerIssue('Tom Boy Stables','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL),
 tdnOwnerIssue('Stanley M. Ersoff','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Ersoff']),
 tdnOwnerIssue('Gretchen M. and Arthur J. Eaton','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Eaton']),
 tdnOwnerIssue('Sandi L. Kleemann','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Kleemann']),
 tdnOwnerIssue('Pyrite Stables','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL),
 tdnOwnerIssue('D. J. Grum','1999-10-30',TDN_1999_OCTOBER_30_RESULTS_URL,['Grum']),
 tdnOwnerIssue('Buckram Oak Farm','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL),
 tdnOwnerIssue('Takaya Shimakawa','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Shimakawa']),
 tdnOwnerIssue('Takao Watanabe','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Watanabe']),
 tdnOwnerIssue('Toyomitsu Hirai','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Hirai']),
 tdnOwnerIssue('Makoto Kaneko','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Kaneko']),
 tdnOwnerIssue('M. Nuti','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Nuti']),
 tdnOwnerIssue('Kazuko Yoshida','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Yoshida']),
 tdnOwnerIssue('Masuo Hosokawa','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Hosokawa']),
 tdnOwnerIssue('Atsushi Muraiki','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Muraiki']),
 tdnOwnerIssue('Don R. Perry','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Perry']),
 tdnOwnerIssue('Mrs. James A. Winn','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Winn']),
 tdnOwnerIssue('Oak Cliff Stables and C. Speckert','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Speckert']),
 tdnOwnerIssue('Hilmer C. Schmidt','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Schmidt']),
 tdnOwnerIssue('Ronald L. Dawe DVM','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Dawe']),
 tdnOwnerIssue('Billy Dickerson and Our Farm Inc.','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Dickerson']),
 tdnOwnerIssue('Jon Stable, J. Gonzalez and T. Ritvo','1999-11-30',TDN_1999_NOVEMBER_30_RESULTS_URL,['Gonzalez','Ritvo']),
 tdnOwnerIssue('William Currin and Alvin Eisman','1999-12-09',TDN_1999_DECEMBER_9_RESULTS_URL,['Currin','Eisman']),
 tdnOwnerIssue('Thomas D. Woodrum','1999-12-09',TDN_1999_DECEMBER_9_RESULTS_URL,['Woodrum']),
 tdnOwnerIssue('W. E. W. Consultores Racing and Hollendorfer','1999-12-09',TDN_1999_DECEMBER_9_RESULTS_URL,['Hollendorfer']),
 tdnOwnerIssue('Louis D. O’Brien','1999-12-09',TDN_1999_DECEMBER_9_RESULTS_URL,['OBrien']),
 tdnOwnerIssue('Russell L. Reineman Stable','1999-12-09',TDN_1999_DECEMBER_9_RESULTS_URL,['Reineman']),
 tdnOwnerIssue('Rag Time Stables','1999-12-09',TDN_1999_DECEMBER_9_RESULTS_URL),
 tdnOwnerIssue('Ayres Fountain Spring Farm','1999-12-09',TDN_1999_DECEMBER_9_RESULTS_URL,['Ayres']),
 tdnOwnerIssue('Ann W. Merryman','1999-12-09',TDN_1999_DECEMBER_9_RESULTS_URL,['Merryman']),
 tdnOwnerIssue('Three Plus U Stable','1999-12-09',TDN_1999_DECEMBER_9_RESULTS_URL),
 tdnOwnerIssue('Scuderia La Fragolina','1999-12-09',TDN_1999_DECEMBER_9_RESULTS_URL),
 tdnOwnerIssue('C. Anacleria','1999-12-09',TDN_1999_DECEMBER_9_RESULTS_URL,['Anacleria']),
 tdnOwnerIssue('Scuderia Pi.Bi.','1999-12-09',TDN_1999_DECEMBER_9_RESULTS_URL),
 tdnOwnerIssue('Scuderia Ste.Ma.','1999-12-09',TDN_1999_DECEMBER_9_RESULTS_URL),
 breedersCupJuvenile('Dianne Waldron',['Waldron']),
 breedersCupJuvenile('Leah Killingworth',['Killingworth']),
 breedersCupJuvenile('William Shively',['Shively']),
 breedersCupJuvenile('King Edward Racing Stable'),

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
