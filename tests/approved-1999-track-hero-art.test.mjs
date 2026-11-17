import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const index = JSON.parse(readFileSync(new URL('../public/assets/identity/hero-art-index-v1.json', import.meta.url)));
const locks = JSON.parse(readFileSync(new URL('../ops/approved-visual-assets.lock.json', import.meta.url)));
const approvedIds = ["T-0061","T-0119","T-0120","T-0121","T-0122","T-0123","T-0124"];

test('owner-approved 1999 track heroes remain local and exact asset locked', () => {
  for (const id of approvedIds) {
    const rel = `/assets/places/track-hero/${id}.webp`;
    const path = `public${rel}`;
    assert.equal(index.tracks[id], rel, `Incorrect hero mapping for ${id}`);
    assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), `Missing local logo: ${path}`);
    const data = readFileSync(new URL(`../${path}`, import.meta.url));
    assert.equal(data.toString('ascii', 0, 4), 'RIFF', `${id} is not a WebP RIFF container`);
    assert.equal(data.toString('ascii', 8, 12), 'WEBP', `${id} is not WebP`);
    const sha = createHash('sha1').update(Buffer.from('blob ' + data.length + String.fromCharCode(0))).update(data).digest('hex');
    assert.equal(locks.assets[path], sha, `Approved image drift or bad asset lock for ${id}`);
  }
});
