import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const script=path.join(root,'scripts/prepare-wtw-desktop-release.mjs');
const version=JSON.parse(fs.readFileSync(path.join(root,'desktop/package.json'),'utf8')).version;
const sha='a'.repeat(40);

function fixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wtw-release-test-'));
 const source=path.join(dir,'input'),out=path.join(dir,'output');
 fs.mkdirSync(source);
 const entries=[
  ['WireToWire-Portable-'+version+'-x64.exe','MZ'],
  ['WireToWire-Setup-'+version+'-x64.exe','MZ'],
  ['WireToWire-NoInstall-Folder-'+version+'-x64.zip','PK']
 ];
 for(const [name,magic] of entries){
  const fd=fs.openSync(path.join(source,name),'w');
  try{fs.writeSync(fd,Buffer.from(magic));fs.ftruncateSync(fd,1024*1024+1024)}
  finally{fs.closeSync(fd)}
 }
 return {dir,source,out,entries};
}

test('stable latest names, checksums, version and SHA are generated from three validated builds',()=>{
 const f=fixture();
 try{
  const proc=spawnSync(process.execPath,[script,f.source,f.out,sha,'12345'],{encoding:'utf8'});
  assert.equal(proc.status,0,proc.stderr);
  const m=JSON.parse(fs.readFileSync(path.join(f.out,'WTW-Latest-Build-Info.json'),'utf8'));
  assert.equal(m.commit,sha);
  assert.equal(m.workflowRunId,12345);
  assert.equal(m.version,version);
  assert.equal(m.status,'UNSIGNED DEVELOPMENT BUILD — NOT READY FOR COMMERCIAL SALE');
  assert.deepEqual(m.files.map(x=>x.downloadName),[
   'WireToWire-Portable-Latest.exe','WireToWire-Setup-Latest.exe','WireToWire-NoInstall-Latest.zip'
  ]);
  for(const asset of m.files){
   assert.ok(fs.statSync(path.join(f.out,asset.downloadName)).size>=1024*1024);
   assert.match(asset.sha256,/^[a-f0-9]{64}$/);
  }
  const sums=fs.readFileSync(path.join(f.out,'SHA256SUMS.txt'),'utf8');
  assert.equal(sums.trim().split('\n').length,3);
 }finally{fs.rmSync(f.dir,{recursive:true,force:true})}
});

test('reject incomplete, corrupt or source-unidentified Windows assets',()=>{
 const f=fixture();
 try{
  fs.rmSync(path.join(f.source,f.entries[1][0]));
  let run=spawnSync(process.execPath,[script,f.source,f.out,sha,'12345'],{encoding:'utf8'});
  assert.notEqual(run.status,0,'Missing setup EXE must block newest release');
  fs.writeFileSync(path.join(f.source,f.entries[1][0]),Buffer.from('MZ'));
  run=spawnSync(process.execPath,[script,f.source,f.out,sha,'12345'],{encoding:'utf8'});
  assert.notEqual(run.status,0,'Tiny placeholder EXE must block release');
  run=spawnSync(process.execPath,[script,f.source,f.out,'not-an-approved-commit','12345'],{encoding:'utf8'});
  assert.notEqual(run.status,0,'Untraceable source revision must block release');
 }finally{fs.rmSync(f.dir,{recursive:true,force:true})}
});
