/** Deterministic, local PRNG; never used to invent gameplay results by the kernel. */
import { ensure } from './contracts.js';
export function validateSeed(seed) {
  ensure(Number.isInteger(seed) && seed >= 1 && seed <= 0xffffffff, 'INVALID_SEED', 'Seed must be a nonzero uint32');
  return seed >>> 0;
}
export function nextRandom(seed) {
  let s = validateSeed(seed);
  s ^= s << 13;
  s ^= s >>> 17;
  s ^= s << 5;
  s >>>= 0;
  // xorshift32 never enters zero for a nonzero seed.
  return { value: s / 4294967296, next_seed: s };
}
