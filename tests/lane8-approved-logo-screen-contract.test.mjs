import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {heroCandidate} from '../public/next/profile-hero-v2.mjs';

// This is a release guard for the ONE bundled desktop game, not a second art registry.
// A pixel replacement requires the owner-approved source AND the exact SHA lock
// to change together. The existing Chromium visual audit opens the actual dossiers.
const root=new URL('../',import.meta.url);
const read=(path)=>readFileSync(new URL(path,root));
const json=(path)=>JSON.parse(read(path));
const lock=json('ops/approved-visual-assets.lock.json');
const index=json('public/assets/identity/hero-art-index-v1.json');
const owners=json('public/assets/office/founding-organization-logo-index.json');
const frames=json('ops/owner-logo-frame-v1.json');
const trackNames=new Map([
 ['T-0002','Belmont Park'],
 ['T-0017','Gulfstream Park'],
 ['T-0061','Comanche Raceway'],
 ['T-0119','Bluff City Downs'],
 ['T-0120','Lowcountry Racecourse'],
 ['T-0121','Live Oak Park'],
 ['T-0122','Sioux Plains'],
 ['T-0123','Bitterroot Downs'],
 ['T-0124','Playfair Race Course']
]);
const founding=new Map([
 ['O-FOUNDING-1999-001','Davenport Hall Farm'],
 ['O-FOUNDING-1999-004','Split Rail Farm']
]);
const blobHash=(bytes)=>createHash('sha1')
 .update('blob '+bytes.length+String.fromCharCode(0)).update(bytes).digest('hex');

test('Belmont, Gulfstream and all 1999 approved expansion marks load by immutable T-ID with an exact asset lock',()=>{
 for(const [id,name] of trackNames){
  const publicPath='/assets/places/track-hero/'+id+'.webp';
  const path='public'+publicPath;
  assert.equal(index.tracks[id],publicPath,name+' index mapping');
  assert.equal(heroCandidate('track',id),publicPath,name+' runtime resolution');
  assert.ok(existsSync(new URL(path,root)),name+' bundled offline image');
  const bytes=read(path);
  assert.equal(bytes.toString('ascii',0,4),'RIFF',name+' RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP',name+' WebP');
  assert.equal(lock.assets[path],blobHash(bytes),name+' exact approved blob lock');
 }
 assert.equal(heroCandidate('track','T-0099','/assets/places/track-hero/T-0002.webp'),
  '/assets/places/track-hero/T-0099.webp','cross-ID asset alias is forbidden');
});

test('Davenport Hall and Split Rail keep approved ONE 256px opaque framed identity per O-ID',()=>{
 for(const [id,name] of founding){
  const publicPath='/assets/office/founding-organization-logos/'+id+'.png';
  const path='public'+publicPath;
  assert.ok(owners.approvedOrganizationIds.includes(id),name+' is a founding identity');
  assert.equal(owners.organizations['organization:'+id],publicPath,name+' exact-ID lookup');
  const bytes=read(path);
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',name+' PNG');
  assert.equal(bytes.readUInt32BE(16),256,name+' width');
  assert.equal(bytes.readUInt32BE(20),256,name+' height');
  assert.equal(bytes[25],2,name+' PNG is intentionally opaque RGB, NOT a transparent hero WebP');
  assert.equal(lock.assets[path],blobHash(bytes),name+' approved Git blob lock');
  const entry=frames.assets.find(row=>row.path===path);
  assert.ok(entry,name+' physical frame record');
  assert.equal(entry.output_sha256,createHash('sha256').update(bytes).digest('hex'),
    name+' frame SHA256 lock');
 }
 assert.equal(frames.canvas_px,256);
 assert.equal(frames.radius_px,28);
 assert.equal(frames.border_px,5);
 assert.equal(frames.border_inset_px,5);
});

test('real player dossier logo stage preserves proportions, with no competing image handler',()=>{
 const css=read('public/next/next.css').toString();
 const browser=read('scripts/desktop-visual-audit.sh').toString();
 const logoCssAnchor='#wtwNextgen .ng-route-profile .ng-profile-view.ng-profile-track > .ng-profile-intro > .ng-profile-source-photo img{';
 const logoCssIndex=css.indexOf(logoCssAnchor);
 assert.ok(logoCssIndex>=0,'original approved profile hero renderer is present');
 assert.ok(css.slice(logoCssIndex,css.indexOf('}',logoCssIndex)).includes('object-fit:contain!important'),
   'rendered logo image must preserve its shape');
 for(const [id] of trackNames){
  const slug=id.toLowerCase().replace('-','');
  assert.ok(browser.includes('T-'+id.slice(2)),slug+' game-screen audit route');
 }
 for(const [id] of founding){
  assert.ok(browser.includes(id),'founder '+id+' game-screen audit route');
 }
 // Never silently remap one business to another by matching their display name.
 assert.equal(heroCandidate('organization','O-FOUNDING-1999-001'),
  '/assets/places/organization-hero/O-FOUNDING-1999-001.webp');
 assert.equal(heroCandidate('organization','O-FOUNDING-1999-004'),
  '/assets/places/organization-hero/O-FOUNDING-1999-004.webp');
});

test('every bundled horse/person portrait retains its own immutable H-/P-ID and exact locked bytes',()=>{
 const collections=[
  ['horse','public/assets/portraits/horses/',/^H-\d{4}-\d{6}\.webp$/],
  ['person','public/assets/portraits/people/',/^P-\d{6}\.webp$/]
 ];
 for(const [kind,prefix,identityPattern] of collections){
  const paths=Object.keys(lock.assets).filter(path=>path.startsWith(prefix));
  assert.ok(paths.length>0,kind+' portrait collection unexpectedly missing');
  const seen=new Set();
  for(const path of paths){
   const basename=path.slice(prefix.length);
   assert.match(basename,identityPattern,kind+' portrait must be keyed only by ID');
   assert.ok(!seen.has(basename),kind+' portrait ID duplicated');
   seen.add(basename);
   const file=new URL(path,root);
   assert.ok(existsSync(file),kind+' approved portrait missing: '+path);
   const bytes=readFileSync(file);
   assert.equal(bytes.toString('ascii',0,4),'RIFF',kind+' portrait RIFF');
   assert.equal(bytes.toString('ascii',8,12),'WEBP',kind+' portrait WebP');
   assert.equal(blobHash(bytes),lock.assets[path],kind+' approved portrait lock drift: '+path);
  }
 }
});
