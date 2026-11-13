/**
 * 1999 fictional US-person birth-cohort first names.
 *
 * Source: U.S. Social Security Administration, top 30 GIVEN NAME RANKINGS for
 * births during each decade (1910s–1980s), by recorded naming-table sex.
 * https://www.ssa.gov/oact/babynames/decades/
 *
 * These are historical first-name rank lists, NOT census distributions for
 * racing professionals, geographic state populations, genders or ethnicities.
 * Rank-biased drawing is a declared GAME DESIGN choice, not an SSA frequency
 * estimate; surnames remain independently sampled by geographic-names.mjs.
 * Only the standalone fictional-world naming factory enables this data.
 */
export const US_BIRTH_COHORT_NAME_MODEL='WTW_SSA_US_1910S_1980S_TOP30_EDITORIAL_RANK_DRAW_V1';
const ranked=(m,f)=>Object.freeze({masculine:Object.freeze(m.split(' ')),feminine:Object.freeze(f.split(' '))});
export const US_COHORT_GIVEN_NAMES=Object.freeze({
 1910:ranked(
  'John William James Robert Joseph George Charles Edward Frank Thomas Walter Harold Henry Paul Richard Raymond Albert Arthur Harry Donald Ralph Louis Jack Clarence Carl Willie Howard Fred David Kenneth',
  'Mary Helen Dorothy Margaret Ruth Mildred Anna Elizabeth Frances Virginia Marie Evelyn Alice Florence Lillian Rose Irene Louise Edna Catherine Gladys Ethel Josephine Ruby Martha Grace Hazel Thelma Lucille Edith'),
 1920:ranked(
  'Robert John James William Charles George Joseph Richard Edward Donald Thomas Frank Harold Paul Raymond Walter Jack Henry Kenneth Arthur Albert David Harry Eugene Ralph Howard Carl Willie Louis Clarence',
  'Mary Dorothy Helen Betty Margaret Ruth Virginia Doris Mildred Frances Elizabeth Evelyn Anna Marie Alice Jean Shirley Barbara Irene Marjorie Florence Lois Martha Rose Lillian Louise Catherine Ruby Eleanor Patricia'),
 1930:ranked(
  'Robert James John William Richard Charles Donald George Thomas Joseph David Edward Ronald Paul Kenneth Frank Raymond Jack Harold Billy Gerald Walter Jerry Joe Eugene Henry Bobby Arthur Carl Larry',
  'Mary Betty Barbara Shirley Patricia Dorothy Joan Margaret Nancy Helen Carol Joyce Doris Ruth Virginia Marilyn Elizabeth Jean Frances Beverly Lois Alice Donna Martha Dolores Janet Phyllis Norma Carolyn Evelyn'),
 1940:ranked(
  'James Robert John William Richard David Charles Thomas Michael Ronald Larry Donald Joseph Gary George Kenneth Paul Edward Jerry Dennis Frank Daniel Raymond Roger Stephen Gerald Walter Harold Steven Douglas',
  'Mary Linda Barbara Patricia Carol Sandra Nancy Sharon Judith Susan Betty Carolyn Margaret Shirley Judy Karen Donna Kathleen Joyce Dorothy Janet Diane Janice Joan Elizabeth Brenda Gloria Virginia Marilyn Martha'),
 1950:ranked(
  'James Michael Robert John David William Richard Thomas Mark Charles Steven Gary Joseph Donald Ronald Kenneth Paul Larry Daniel Stephen Dennis Timothy Edward Jeffrey George Gregory Kevin Douglas Terry Anthony',
  'Mary Linda Patricia Susan Deborah Barbara Debra Karen Nancy Donna Cynthia Sandra Pamela Sharon Kathleen Carol Diane Brenda Cheryl Janet Elizabeth Kathy Margaret Janice Carolyn Denise Judy Rebecca Joyce Teresa'),
 1960:ranked(
  'Michael David John James Robert Mark William Richard Thomas Jeffrey Steven Joseph Timothy Kevin Scott Brian Charles Paul Daniel Christopher Kenneth Anthony Gregory Ronald Donald Gary Stephen Eric Edward Douglas',
  'Lisa Mary Susan Karen Kimberly Patricia Linda Donna Michelle Cynthia Sandra Deborah Tammy Pamela Lori Laura Elizabeth Julie Brenda Jennifer Barbara Angela Sharon Debra Teresa Nancy Christine Cheryl Denise Kelly'),
 1970:ranked(
  'Michael Christopher Jason David James John Robert Brian William Matthew Joseph Daniel Kevin Eric Jeffrey Richard Scott Mark Steven Thomas Timothy Anthony Charles Joshua Ryan Jeremy Paul Andrew Gregory Chad',
  'Jennifer Amy Melissa Michelle Kimberly Lisa Angela Heather Stephanie Nicole Jessica Elizabeth Rebecca Kelly Mary Christina Amanda Julie Sarah Laura Shannon Christine Tammy Tracy Karen Dawn Susan Andrea Tina Patricia'),
 1980:ranked(
  'Michael Christopher Matthew Joshua David James Daniel Robert John Joseph Jason Justin Andrew Ryan William Brian Brandon Jonathan Nicholas Anthony Eric Adam Kevin Thomas Steven Timothy Richard Jeremy Jeffrey Kyle',
  'Jessica Jennifer Amanda Ashley Sarah Stephanie Melissa Nicole Elizabeth Heather Tiffany Michelle Amber Megan Amy Rachel Kimberly Christina Lauren Crystal Brittany Rebecca Laura Danielle Emily Samantha Angela Erin Kelly Sara')
});
export function usBirthCohortGivenPool(birthYear,feminine){
 if(!Number.isInteger(birthYear)||birthYear<1910||birthYear>1989)
  throw Error('SSA decade first-name source supports birth years 1910–1989');
 const decade=Math.floor(birthYear/10)*10,entry=US_COHORT_GIVEN_NAMES[decade];
 if(!entry)throw Error('Unsupported US first-name decade '+decade);
 return feminine?entry.feminine:entry.masculine;
}
/** Stable rank-biased synthetic draw; NOT a true SSA per-name frequency. */
export function drawUSBirthCohortName(seed,index,birthYear,feminine,attempt=0){
 const pool=usBirthCohortGivenPool(birthYear,feminine);
 let h=(2166136261^(seed>>>0))>>>0;
 for(const char of 'cohort:'+index+':'+birthYear+':'+attempt+':'+(feminine?'F':'M')){
  h^=char.charCodeAt(0);h=Math.imul(h,16777619);
 }
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
 h=Math.imul(h,0x846ca68b);h^=h>>>16;
 const rankWeights=pool.map((_,i)=>Math.round(1000/(i+4)));
 const total=rankWeights.reduce((a,b)=>a+b,0);
 let value=(h>>>0)%total;
 for(let i=0;i<pool.length;i++){value-=rankWeights[i];if(value<0)return pool[i]}
 return pool.at(-1);
}
