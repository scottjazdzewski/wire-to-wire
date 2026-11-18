/**
 * WTW GAME KERNEL V1 — contracts for imported canonical source and game runs.
 * No source data, historical outcome, or gameplay attributes are created here.
 * Pure browser/Node ESM; no database, network, system clock, or localStorage access.
 */
export const WORLD_SCHEMA = 'WTW_WORLD_SNAPSHOT_V1';
export const RUN_SCHEMA = 'WTW_GAME_RUN_V1';
export const SAVE_SCHEMA = 'WTW_GAME_SAVE_V1';
export const ENTITY_GROUPS = Object.freeze(['horses', 'people', 'organizations', 'tracks']);
export const PLAYER_ROLES = Object.freeze(['owner', 'trainer', 'farm', 'breeder', 'jockey']);
export const INVOLVEMENT_LEVELS = Object.freeze(['hands-on', 'balanced', 'executive']);

export class GameFrameworkError extends Error {
  constructor(code, message) { super(message); this.name = 'GameFrameworkError'; this.code = code; }
}
export function ensure(ok, code, message) { if (!ok) throw new GameFrameworkError(code, message); }
export function isObject(x) { return Boolean(x) && typeof x === 'object' && !Array.isArray(x); }
export function requireString(x, field, maxLength = 200) {
  ensure(typeof x === 'string' && x.trim().length > 0 && x.length <= maxLength, 'INVALID_FIELD', 'Invalid '+field);
  return x;
}
export function validDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(date + 'T00:00:00.000Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === date;
}
export function nextDate(date) {
  ensure(validDate(date), 'INVALID_DATE', 'Invalid date '+date);
  const d = new Date(date + 'T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
export function jsonClone(x) { return JSON.parse(JSON.stringify(x)); }
export const MAX_GAME_SAVE_CHARS=64_000_000;
export function strictJSON(value,maxLength=1_000_000) {
  const visited = new WeakSet();
  const check = v => {
    ensure(v !== undefined && typeof v !== 'function' && typeof v !== 'symbol' && typeof v !== 'bigint',
      'INVALID_PAYLOAD', 'Payload cannot contain undefined, functions, symbols or BigInt');
    if (typeof v === 'number') ensure(Number.isFinite(v), 'INVALID_PAYLOAD', 'Payload cannot contain non-finite numbers');
    if (v && typeof v === 'object') {
      ensure(Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null,
        'INVALID_PAYLOAD', 'Only plain JSON objects and arrays are allowed');
      ensure(!visited.has(v), 'INVALID_PAYLOAD', 'Payload cannot contain cycles or shared object references');
      visited.add(v);
      if (Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) {
          ensure(Object.hasOwn(v, i), 'INVALID_PAYLOAD', 'Payload cannot contain array holes');
          check(v[i]);
        }
      } else {
        for (const [key, item] of Object.entries(v)) {
          ensure(key !== '__proto__' && key !== 'constructor' && key !== 'prototype', 'INVALID_PAYLOAD', 'Reserved object property');
          check(item);
        }
      }
    }
  };
  check(value);
  const encoded = JSON.stringify(value);
  ensure(Number.isSafeInteger(maxLength)&&maxLength>0&&typeof encoded==='string'&&encoded.length<=maxLength,
   'INVALID_PAYLOAD', 'JSON exceeds the authorized size limit');
  return JSON.parse(encoded);
}

const ID_PATTERN = {
  horses: /^H-[A-Za-z0-9-]+$/,
  people: /^P-[A-Za-z0-9-]+$/,
  organizations: /^O-[A-Za-z0-9-]+$/,
  tracks: /^(?:T|IT)-[A-Za-z0-9-]+$/
};
export function validateWorld(world) {
  ensure(isObject(world) && world.schema === WORLD_SCHEMA, 'WORLD_SCHEMA', 'Expected '+WORLD_SCHEMA);
  ensure(isObject(world.authority), 'WORLD_AUTHORITY', 'Missing canon authority');
  requireString(world.authority.snapshot_id, 'authority.snapshot_id');
  requireString(world.authority.source, 'authority.source');
  ensure(/^[a-f0-9]{64}$/i.test(world.authority.sha256 || ''), 'WORLD_DIGEST', 'Snapshot SHA256 must be supplied by authoritative exporter');
  ensure(validDate(world.start_date), 'INVALID_DATE', 'World start_date must be real YYYY-MM-DD');
  ensure(isObject(world.entities), 'WORLD_ENTITIES', 'World must contain entity-group arrays');
  const cached=WORLD_IDENTITY_INDEX.get(world);
  if(cached?.validated===true&&cached?.authority===world.authority&&cached?.entities===world.entities&&
   cached?.startDate===world.start_date&&
   ENTITY_GROUPS.every(group=>cached.groups.get(group)?.records===world.entities[group]&&
    cached.groups.get(group)?.length===world.entities[group]?.length))return world;
  const seen = new Set();
  const indexes=new Map();
  for (const group of ENTITY_GROUPS) {
    const members = world.entities[group];
    ensure(Array.isArray(members), 'WORLD_ENTITIES', 'Missing entities.'+group);
    const byId=new Map();
    for (const e of members) {
      ensure(isObject(e) && ID_PATTERN[group].test(e.id || ''), 'WORLD_ID', 'Invalid '+group+' identity');
      requireString(e.name, group+'.name', 500);
      ensure(!seen.has(e.id), 'DUPLICATE_ID', 'Duplicate world identity '+e.id);
      seen.add(e.id);
      byId.set(e.id,e);
    }
    indexes.set(group,{records:members,length:members.length,byId});
  }
  // A world snapshot is immutable for the life of its game run. Keep the
  // validated indexes beside the world instead of rescanning hundreds of
  // thousands of identities before every command.
  WORLD_IDENTITY_INDEX.set(world,{validated:true,authority:world.authority,
   entities:world.entities,startDate:world.start_date,groups:indexes});
  return world;
}
// World snapshots can contain hundreds of thousands of horses and people.
// Keep their immutable identities addressable in constant time after the
// first lookup instead of rescanning the full census for every game action.
// The cache stays outside serialized game/world data and is rebuilt if a
// caller replaces an entity-group array. If an entity ID is edited in place,
// the cached row is rejected and that ID falls back to one fresh scan.
const WORLD_IDENTITY_INDEX = new WeakMap();
function identityIndex(world,group){
 let snapshot=WORLD_IDENTITY_INDEX.get(world);
 if(snapshot?.authority===world.authority&&snapshot?.entities===world.entities&&
  snapshot?.startDate===world.start_date){
  const indexed=snapshot.groups.get(group);
  if(indexed?.records===world.entities[group]&&indexed?.length===world.entities[group].length)
   return indexed.byId;
 }
 const records=world.entities[group];
 let indexes=snapshot?.groups||new Map();
 const cached=indexes.get(group);
 if(cached?.records===records&&cached?.length===records.length)return cached.byId;
 const byId=new Map(records.map(entity=>[entity.id,entity]));
 indexes.set(group,{records,length:records.length,byId});
 snapshot={authority:world.authority,entities:world.entities,
  startDate:world.start_date,groups:indexes};
 WORLD_IDENTITY_INDEX.set(world,snapshot);
 return byId;
}
export function worldIdentity(world, group, id) {
  ensure(ENTITY_GROUPS.includes(group), 'ENTITY_GROUP', 'Unknown group '+group);
  const records=world.entities[group],byId=identityIndex(world,group);
  const indexed=byId.get(id);
  if(indexed?.id===id)return indexed;
  if(indexed)byId.delete(id);
  // Keep compatibility with callers that mutate a snapshot during authoring;
  // once found, later reads of the new ID use the index.
  const current=records.find(x=>x.id===id)||null;
  if(current)byId.set(id,current);
  return current;
}
export function validateWorldRef(world, ref) {
  ensure(isObject(ref) && ref.snapshot_id === world.authority.snapshot_id && ref.sha256 === world.authority.sha256,
    'WORLD_MISMATCH', 'Game save belongs to a different canon snapshot; explicit migration required');
}
