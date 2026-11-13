/**
 * WIRE TO WIRE — January 1, 1999 founding leadership proposals.
 *
 * The 24 previously leaderless founding organizations and Ledbetter Calder get an accountable
 * operating principal. Secondary partners have separate immutable Person IDs.
 *
 * Names the user accepted are game-world approved, not historically authenticated ownership.
 * Three revised primary names plus Ledbetter Calder's new operator remain proposals.
 * This is GAME WORLD SCENARIO data, not a historically authenticated owner,
 * biography, stock transfer, farm purchase, founding date or contract.
 * Previously approved principals remain in founding-world-1999.mjs.
 * Never silently turn a managing partner into the owner of all partnership
 * assets, or a bloodstock adviser into an employer or trainer.
 *
 * "WORLD_BIBLE_PROPOSAL" = a name already proposed in the November 12 World
 * Bible, NOT user-approved. "NEW_PROPOSAL" = proposed in this workstream.
 */
import {createAgeAbility} from './age-ability.mjs';
import attributeCatalog from './attribute-catalog.mjs';
export const FOUNDING_LEADERSHIP_SCHEMA='WTW_FOUNDING_1999_LEADERSHIP_V2';

/* fields: org ID, person, leadership office, model role, age at Jan 1 1999,
   birthplace, operating base, proposal source, primary?, specific safeguards */
const R=[
 ['O-000002','Graham Kincaid','MANAGING_PRINCIPAL','breeder',59,'Paris|Kentucky|USA','Paris|Kentucky|USA','USER_DIRECTED_MALE_LEADER_NAME_PROPOSAL',1,'Athletic, impeccably sharp 59-year-old with short spiky gray hair; precise commercial breeder; 1958 founder remains unidentified'],
 ['O-000011','Gordon Ralston','MANAGING_PARTNER','owner',55,'Pittsburgh|Pennsylvania|USA','Pittsburgh|Pennsylvania|USA','NEW_PROPOSAL',1,'Partnership representative, not sole beneficial owner'],
 ['O-000037','Frederick Whitcombe','FAMILY_RACING_PRINCIPAL','owner',61,'Baltimore|Maryland|USA','Baltimore|Maryland|USA','NEW_PROPOSAL',1,'Family racing owner; Kingsmere is separately Heydays breeder'],
 ['O-000045','Walter Keegan','MANAGING_OWNER','owner',56,'Queens|New York|USA','South Ozone Park|New York|USA','NEW_PROPOSAL',1,'Racing owner, not automatically the barn trainer'],
 ['O-000047','Nathan Park','MANAGING_PARTNER','owner',37,'Oakland|California|USA','Berkeley|California|USA','WORLD_BIBLE_PROPOSAL',1,'Later recapitalization proposal; earlier Poppy Lane stakes history remains unchanged'],
 ['O-000047','Evan Mercer','COFOUNDING_PARTNER','owner',35,'San Jose|California|USA','Berkeley|California|USA','WORLD_BIBLE_PROPOSAL',0,'Proposed new consortium partner, not retroactive owner of 1990 results'],
 ['O-000047','Jonathan Vail','COFOUNDING_PARTNER','owner',39,'Palo Alto|California|USA','Berkeley|California|USA','WORLD_BIBLE_PROPOSAL',0,'No asserted relationship to Miriam Vale or Ashby Vale'],
 ['O-000057','Sebastian Pryce','MANAGING_QUANTITATIVE_PARTNER','owner',48,'Chicago|Illinois|USA','Arcadia|California|USA','USER_DIRECTED_ANALYTICS_LEADER_NAME_PROPOSAL',1,'Data-first financing and racing portfolio architect; backed by sophisticated investors; Julian Voss independently directs Argosy Bloodstock'],
 ['O-000059',"Travis 'Tex' Colter",'RACING_OWNER_PRINCIPAL','owner',49,'Fort Worth|Texas|USA','Fort Worth|Texas|USA','WORLD_BIBLE_PROPOSAL',1,'Circle B distinct from Ironweed Farm; Brazos Reach is only a proposed property'],
 ['O-000062','Henry Bellamy','FARM_PRINCIPAL','breeder',60,'Paris|Kentucky|USA','Paris|Kentucky|USA','NEW_PROPOSAL',1,'No edits to Who Knows/Saint Nobody owner-event reconciliation'],
 ['O-000063','Wade Pritchard','FAMILY_FARM_PRINCIPAL','breeder',62,'Henderson|Kentucky|USA','Henderson|Kentucky|USA','NEW_PROPOSAL',1,'Ray Sutter is a trainer affinity, not the farm owner'],
 ['O-000064','Hugh Radcliffe','FAMILY_FARM_PRINCIPAL','breeder',56,'Middleburg|Virginia|USA','Middleburg|Virginia|USA','USER_DIRECTED_MALE_LEADER_NAME_PROPOSAL',1,'Experienced Virginia gentleman horseman; Huntcross remains independent and friendly to Ashby Vale'],
 ['O-000067','Samuel Rowan','FARM_PRINCIPAL','breeder',55,'Midway|Kentucky|USA','Midway|Kentucky|USA','NEW_PROPOSAL',1,'Gospel Truth trainer and exact historic credits unchanged'],
 ['O-000068','Richard Halden','STUD_DIRECTOR','breeder',59,'Versailles|Kentucky|USA','Versailles|Kentucky|USA','NEW_PROPOSAL',1,'Active stud manager; historic founder unspecified'],
 ['O-000071','Daniel Alden','MANAGING_STUD_PRINCIPAL','breeder',52,'Saratoga Springs|New York|USA','Saratoga Springs|New York|USA','NEW_PROPOSAL',1,'No fabricated 1960s winners or former owner transactions'],
 ['O-FOUNDING-1999-001','Eleanor Davenport','FAMILY_MATRIARCH','breeder',64,'Litchfield|Connecticut|USA','Litchfield|Connecticut|USA','WORLD_BIBLE_PROPOSAL',1,'Modern farm is not asserted to date to colonial era'],
 ['O-FOUNDING-1999-002','Hiroshi Takamori','PACIFIC_DIVISION_PRESIDENT','breeder',54,'Kyoto|Kyoto|Japan','Rancho Santa Fe|California|USA','WORLD_BIBLE_PROPOSAL',1,'Kenjiro Takamori remains historic founder, not duplicated as live principal'],
 ['O-FOUNDING-1999-002','Akira Takamori','JAPAN_DIVISION_DIRECTOR','breeder',50,'Kyoto|Kyoto|Japan','Tokyo|Tokyo|Japan','WORLD_BIBLE_PROPOSAL',0,'Sibling and Japan-side partner; Pacific division led by Hiroshi'],
 ['O-FOUNDING-1999-003','Charles Buckley','FARM_OWNER_PRINCIPAL','breeder',57,'Shelbyville|Kentucky|USA','Shelbyville|Kentucky|USA','WORLD_BIBLE_PROPOSAL',1,'Walter Buckley father and 1982 death are working lore not certified history'],
 ['O-FOUNDING-1999-004','Andrew Buckley','FARM_OWNER_PRINCIPAL','breeder',53,'Shelbyville|Kentucky|USA','Shelbyville|Kentucky|USA','WORLD_BIBLE_PROPOSAL',1,'Rival brother owns separate farm; no horse or property transfers inferred'],
 ['O-FOUNDING-1999-005','Dino Marks','MANAGING_SYNDICATE_PARTNER','owner',42,'San Diego|California|USA','Del Mar|California|USA','USER_APPROVED',1,'Leads All The Colors; syndicate alludes to the Winning Colors betting story; no personal claim to every member share'],
 ['O-FOUNDING-1999-005','Lena Cabral','COFOUNDING_PARTNER','owner',38,'San Diego|California|USA','Del Mar|California|USA','WORLD_BIBLE_PROPOSAL',0,'Distinct founding syndicate member'],
 ['O-FOUNDING-1999-006','Edmund Samuels','FAMILY_RACING_REPRESENTATIVE','owner',51,'Loretto|Kentucky|USA','Loretto|Kentucky|USA','NEW_PROPOSAL',1,'Entire character/horse racing activity is WTW fiction; not a real Samuels biography'],
 ['O-FOUNDING-1999-007','Luca DeSantis','FOUNDER_AND_RACING_OWNER','owner',46,'Miami|Florida|USA','Miami Beach|Florida|USA','WORLD_BIBLE_PROPOSAL',1,'Resort owner lore remains provisional; no fabricated proven racing results'],
 ['O-FOUNDING-1999-008','Margaret Donnelly','MANAGING_RACING_PARTNER','owner',50,'Saratoga Springs|New York|USA','Saratoga Springs|New York|USA','WORLD_BIBLE_PROPOSAL',1,'Joint siblings, no prior breeding awards invented'],
 ['O-FOUNDING-1999-008','Joseph Donnelly','COFOUNDING_RACING_PARTNER','owner',47,'Saratoga Springs|New York|USA','Saratoga Springs|New York|USA','WORLD_BIBLE_PROPOSAL',0,'Separate cofounder Person ID'],
 ['O-FOUNDING-1999-009','Emilio Ferreiro','FOUNDER_AND_RACING_OWNER','owner',50,'Havana|Havana|Cuba','Havana|Havana|Cuba','WORLD_BIBLE_PROPOSAL',1,'No criminal activity or evidence asserted from rumor'],
 ['O-FOUNDING-1999-010','Daniel Rutledge','CURRENT_FARM_PRINCIPAL','breeder',57,'Cookeville|Tennessee|USA','Cookeville|Tennessee|USA','NEW_PROPOSAL',1,'1910s Caney Fork to 1999 ownership succession NOT authenticated'],
 ['O-FOUNDING-1999-013','Adrian Alderwick','INTERNATIONAL_STUD_DIRECTOR','breeder',55,'Newmarket|Suffolk|UK','Newmarket|Suffolk|UK','NEW_PROPOSAL',1,'Do not invent hereditary aristocratic title, foreign horse transfers or results'],
 ['O-FOUNDING-1999-013','Clare Bexley','KENTUCKY_DIVISION_DIRECTOR','farm_manager',43,'Lexington|Kentucky|USA','Lexington|Kentucky|USA','NEW_PROPOSAL',0,'Satellite farm manager only, not the international owner'],
 ['O-006905','Daniel Calder','MANAGING_RACING_PRINCIPAL','owner',53,'Los Angeles|California|USA','Los Angeles|California|USA','USER_DIRECTED_NON_OPERATING_INVESTOR_CORRECTION__NAME_PROPOSAL',1,'New proposed operational leader, subject to review; Magic Johnson is a major investor only, without implied equity share or day-to-day management']
];
const UNAPPROVED_PRIMARY_ORGANIZATIONS=new Set(['O-000002','O-000064','O-000057','O-006905']);
const PORTRAIT_BRIEFS={
 'O-000002':'In shape, sharply dressed 59-year-old male with short spiky gray hair; alert and commercially ruthless',
 'O-000064':'Established male Virginia horseman, traditionally dressed, understated and knowledgeable',
 'O-000057':'Sharp, extremely intelligent finance and analytics professional; institutional investor temperament',
 'O-FOUNDING-1999-005':'Dino Marks leads a colorful, betting-rooted racing syndicate with a taste for overlooked yearlings'
};
const isPrimaryPortrait=(id,primary)=>primary===1&&Object.hasOwn(PORTRAIT_BRIEFS,id);
const loc=text=>{const [locality,region,country]=text.split('|');return {locality,region,country};};
const hash=(seed,key)=>{let h=(2166136261^(seed>>>0))>>>0;for(const c of key){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h^(h>>>16))>>>0;};
function trait(seed,id,def,ability){
 const frac=hash(seed,id+':'+def.key)%10001/10000;
 return Math.round(Math.max(.09,Math.min(.96,.20+(ability.current/99)*.53+frac*.22))*1000)/1000;
}
export function createFoundingLeadership1999({seed=19990101}={}){
 if(!Number.isSafeInteger(seed)||seed<1)throw Error('Valid founding world seed required');
 const people=R.map((r,i)=>{
  const [organizationId,name,positionTitle,role,age,birth,base,proposalSource,main,safeguard]=r;
  const id='P-FOUNDING-LEADER-'+String(i+1).padStart(3,'0');
  const ability=createAgeAbility({seed,id,role,age});
  const attrs=[...attributeCatalog.person_common,...(attributeCatalog.person_roles[role]||[])];
  const attributes=Object.fromEntries(attrs.map(d=>[d.key,trait(seed,id,d,ability)]));
  return {id,name,role,positionTitle,organizationId,operatingOrganizationId:organizationId,
   isPrimary:main===1,age,ageBasis:'1999_WTW_PROPOSED_GAME_CHARACTER',
   birthplace:loc(birth),base:loc(base),birthplaceBasis:'GAME_LORE_PROPOSAL_NOT_REAL_BIOGRAPHY',
   leadershipStatus:UNAPPROVED_PRIMARY_ORGANIZATIONS.has(organizationId)?
    'PROVISIONAL_1999_ASSIGNMENT_PENDING_USER_REVIEW':'USER_APPROVED_1999_LEADERSHIP',
   proposalSource,source:'WTW_1999_FICTIONAL_LEADERSHIP_PROPOSAL_NOT_HISTORICAL_EVIDENCE',
   organizationLinkBasis:'DESIGNATED_GAME_OPERATOR_NOT_HISTORICAL_OWNERSHIP_PROOF',
   safeguards:safeguard,portraitBrief:isPrimaryPortrait(organizationId,main)?PORTRAIT_BRIEFS[organizationId]||'':null,
   ability,attributes,roleAttributes:attributes,
   contractedAtOpening:false,payrollAnnual:null,
   managementShares:'UNKNOWN_DO_NOT_ASSUME_WHOLE_PARTNERSHIP',
   familyRelationshipIds:[],
   no1999RaceResultClaim:true};
 });
 const byName=new Map(people.map(p=>[p.name,p]));
 for(const [a,b] of [['Charles Buckley','Andrew Buckley'],
   ['Hiroshi Takamori','Akira Takamori'],['Margaret Donnelly','Joseph Donnelly']]){
  byName.get(a).familyRelationshipIds.push(byName.get(b).id);
  byName.get(b).familyRelationshipIds.push(byName.get(a).id);
 }
 const ids=new Set(),names=new Set(),primary=new Map();
 for(const p of people){
  if(ids.has(p.id)||names.has(p.name.toLowerCase()))throw Error('Duplicate 1999 founding leader '+p.name);
  ids.add(p.id);names.add(p.name.toLowerCase());
  if(p.isPrimary)primary.set(p.organizationId,(primary.get(p.organizationId)||0)+1);
 }
 if(primary.size!==25||[...primary.values()].some(n=>n!==1))
  throw Error('Expected 24 former gaps plus one new Ledbetter Calder operating principal');
 return Object.freeze(people);
}
