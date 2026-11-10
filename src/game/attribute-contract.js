/**
 * WTW attribute coverage contract.
 * Read the ONE shared public/assets/game/attribute-catalog.v1.json.
 * This module does not create entity data, invent ratings, or mutate canon/game saves.
 */
const GROUPS = new Set(['horses','people']);
const VALID_SCOPES = new Set(['latent','measured','profile','dynamic','derived']);

export function attributeDefinitions(catalog, entityGroup, roles = []) {
  if (!catalog || catalog.schema !== 'WTW_ATTRIBUTE_CATALOG_V1')
    throw new TypeError('Expected WTW_ATTRIBUTE_CATALOG_V1');
  if (!GROUPS.has(entityGroup)) throw new TypeError('Entity group must be horses or people');
  if (entityGroup === 'horses')
    return Object.values(catalog.horse_categories).flat().map(({key,...meta})=>({key,...meta}));
  if (!Array.isArray(roles) || !roles.every(r=>typeof r==='string' && catalog.person_roles[r]))
    throw new TypeError('Person roles must be named keys in catalog.person_roles');
  const definitions = [...catalog.person_common];
  for (const role of new Set(roles)) definitions.push(...catalog.person_roles[role]);
  // A person can hold several racing roles, but a shared attribute must have one identity.
  return [...new Map(definitions.map(d=>[d.key,d])).values()];
}

export function requiredAttributeKeys(catalog, entityGroup, roles=[]) {
  return attributeDefinitions(catalog,entityGroup,roles).map(d=>d.key);
}

export function checkAttributeCatalog(catalog) {
  if (!catalog || catalog.schema !== 'WTW_ATTRIBUTE_CATALOG_V1')
    return {ok:false,errors:['Unexpected schema']};
  const errors=[];
  const groups=[
    ...Object.entries(catalog.horse_categories||{}).map(([k,v])=>['horses/'+k,v]),
    ['people/common',catalog.person_common],
    ...Object.entries(catalog.person_roles||{}).map(([k,v])=>['people/'+k,v])
  ];
  for(const [group,defs] of groups) {
    if(!Array.isArray(defs)||!defs.length) { errors.push(group+': definitions missing'); continue; }
    const keys=new Set();
    for (const d of defs) {
      if(!d || typeof d.key!=='string' || !/^[a-z][a-z0-9_]*$/.test(d.key) ||
        typeof d.label!=='string'||!d.label.trim() ||
        typeof d.meaning!=='string'||!d.meaning.trim() ||
        !VALID_SCOPES.has(d.scope)) errors.push(group+': invalid attribute');
      if(keys.has(d?.key)) errors.push(group+': duplicate '+d.key);
      keys.add(d?.key);
    }
  }
  const horseKeys=Object.values(catalog.horse_categories||{}).flat().map(x=>x.key);
  if(new Set(horseKeys).size!==horseKeys.length)errors.push('Horse keys collide between categories');
  const common=new Set((catalog.person_common||[]).map(x=>x.key));
  for(const [role,defs] of Object.entries(catalog.person_roles||{}))
    for(const d of defs)if(common.has(d.key))errors.push(role+': specialty duplicates common '+d.key);
  return {ok:errors.length===0,errors};
}

/**
 * A generated entity must carry a latent value for every applicable latent trait.
 * All non-latent values are optional, since measured biometrics and conditions
 * require measurements, game time, or observed evidence. Never fill null with 0.
 * The generator must create traits, this function only AUDITS them.
 */
export function auditGeneratedAttributeCoverage({catalog,entityGroup,roles=[],latent={}}) {
  const definitions=attributeDefinitions(catalog,entityGroup,roles);
  if(!latent||typeof latent!=='object'||Array.isArray(latent)) throw new TypeError('latent must be a map');
  const expected=definitions.filter(d=>d.scope==='latent').map(d=>d.key);
  const missing=expected.filter(key=>!Object.hasOwn(latent,key)||latent[key]===null||latent[key]===undefined);
  const unexpected=Object.keys(latent).filter(key=>!expected.includes(key));
  return {ok:missing.length===0&&unexpected.length===0,expected:expected.length,missing,unexpected};
}

/**
 * Player-facing scouting reports are not hidden ability packs.
 * An unassessed trait may exist in hidden latent data while remaining unknown to
 * the player, and different observers may have different estimates.
 */
export function normalizeObservation(record) {
  if(!record||typeof record!=='object'||typeof record.attribute_key!=='string')
    throw new TypeError('Observation needs attribute_key');
  if(!['unassessed','estimated','measured'].includes(record.status))
    throw new TypeError('Unknown observation status');
  const value=record.estimate??null;
  if(record.status==='unassessed'&&value!==null)
    throw new TypeError('Unassessed traits cannot show a value');
  if(record.status!=='unassessed'&&value===null)
    throw new TypeError('Assessed traits need an explicitly sourced value');
  return {
    attribute_key:record.attribute_key,
    estimate:value,
    status:record.status,
    confidence:record.confidence??null,
    observer_id:record.observer_id??null,
    observed_at:record.observed_at??null,
    evidence_refs:Array.isArray(record.evidence_refs)?[...record.evidence_refs]:[]
  };
}
