/**
 * Optional race-program abbreviations, not authoritative legal names.
 *
 * TimeformUS cards typically print jockey/trainer identifiers as first
 * initial + family name, such as "F. Surname"; the underlying full name
 * remains intact. Nothing is written to player/world identities.
 */
export const RACING_PROGRAM_NAME_MODEL='WTW_PROGRAM_CONNECTION_LABELS_V1';
export function formatRacingProgramName(person,{familyName=null}={}){
 if(!person||typeof person.name!=='string'||!person.name.trim())
  throw Error('Program name requires a complete person record');
 const full=person.name.trim().replace(/^(?:Dr|Mr|Mrs|Ms)\.\s*/i,'');
 const given=full.split(/\s+/).find(Boolean);
 const family=(familyName??person.primarySurname??full.split(/\s+/).at(-1)).trim();
 if(!family||!/^\p{L}/u.test(given)||!/^\p{L}/u.test(family))
  throw Error('Cannot abbreviate racing program name without given and family names');
 return given[0].toLocaleUpperCase() + '. ' + family;
}
