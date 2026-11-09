/** Save/load v1 intentionally independent of Cloudflare, Office localStorage and canon. */
import { SAVE_SCHEMA, ensure, isObject, strictJSON, jsonClone } from './contracts.js';
import { validateGameRun } from './state.js';

// FNV-1a is an accidental-corruption check, NOT security or an authenticity signature.
export function checksum32(s) {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
  return (x >>> 0).toString(16).padStart(8, '0');
}
export function exportGameSave(state, world) {
  validateGameRun(state, world);
  const snapshot = strictJSON(state);
  return JSON.stringify({ schema: SAVE_SCHEMA, state: snapshot, checksum32: checksum32(JSON.stringify(snapshot)) });
}
export function importGameSave(save, world) {
  ensure(typeof save === 'string' && save.length <= 20_000_000, 'INVALID_SAVE', 'Save must be JSON text under 20 MB');
  let parsed;
  try { parsed = JSON.parse(save); } catch { throw new Error('Invalid WTW save JSON'); }
  ensure(isObject(parsed) && parsed.schema === SAVE_SCHEMA && isObject(parsed.state) && typeof parsed.checksum32 === 'string',
    'SAVE_SCHEMA', 'Unknown save format');
  ensure(checksum32(JSON.stringify(parsed.state)) === parsed.checksum32, 'SAVE_CORRUPTED', 'Save checksum mismatch');
  const state = jsonClone(parsed.state);
  validateGameRun(state, world);
  return state;
}
