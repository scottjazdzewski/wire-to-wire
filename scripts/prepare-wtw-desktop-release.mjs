#!/usr/bin/env node
/**
 * Copy a successfully tested Windows build into consistent, canonical names
 * for the GitHub Releases latest endpoint. Refuse incomplete/mismatched builds.
 * Usage: node scripts/prepare-wtw-desktop-release.mjs INPUT_DIR OUTPUT_DIR SHA RUN_ID
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [sourceArg,targetArg,sha,runId]=process.argv.slice(2);
function fail(message){throw new Error('WTW latest EXE release rejected: '+message)}
if(!sourceArg||!targetArg||!(/^[a-f0-9]{40}$/.test(sha||''))||!(/^\d+$/.test(runId||''))){
 fail('Expected INPUT_DIR OUTPUT_DIR 40_HEX_MAIN_SHA NUMERIC_GITHUB_RUN_ID');
}
const source=path.resolve(sourceArg);
const target=path.resolve(targetArg);
if(source===target)fail('Source and destination must differ');
const packageFile=JSON.parse(fs.readFileSync(path.join(repoRoot,'desktop','package.json'),'utf8'));
const version=packageFile.version;
if(!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9._-]+)?$/.test(version))fail('Invalid desktop package version');
const records=[
 {kind:'portable',from:'WireToWire-Portable-'+version+'-x64.exe',to:'WireToWire-Portable-Latest.exe',magic:'MZ'},
 {kind:'installer',from:'WireToWire-Setup-'+version+'-x64.exe',to:'WireToWire-Setup-Latest.exe',magic:'MZ'},
 {kind:'no-install-folder',from:'WireToWire-NoInstall-Folder-'+version+'-x64.zip',to:'WireToWire-NoInstall-Latest.zip',magic:'PK'}
];
for(const record of records){
 const location=path.join(source,record.from);
 if(!fs.existsSync(location)||!fs.statSync(location).isFile())fail('Missing packaged executable: '+record.from);
 const stat=fs.statSync(location);
 if(stat.size<1024*1024)fail('Suspiciously small build artifact: '+record.from);
 const fd=fs.openSync(location,'r');
 try{
  const header=Buffer.alloc(2);
  fs.readSync(fd,header,0,2,0);
  if(header.toString('ascii')!==record.magic)fail('Invalid EXE/ZIP header: '+record.from);
 }finally{fs.closeSync(fd)}
}
fs.mkdirSync(target,{recursive:true});
const output=[];
for(const record of records){
 const sourceFile=path.join(source,record.from);
 const targetFile=path.join(target,record.to);
 fs.copyFileSync(sourceFile,targetFile);
 const hash=crypto.createHash('sha256');
 for await(const chunk of fs.createReadStream(targetFile)){hash.update(chunk)}
 output.push({
  kind:record.kind,originalName:record.from,
  downloadName:record.to,bytes:fs.statSync(targetFile).size,sha256:hash.digest('hex')
 });
}
const manifest={
 schema:'wtw-desktop-test-build/v1',
 title:'Wire to Wire — newest tested Windows desktop development build',
 commit:sha,
 workflowRunId:Number(runId),
 version,architecture:'windows-x64',createdAtUTC:new Date().toISOString(),
 status:'UNSIGNED DEVELOPMENT BUILD — NOT READY FOR COMMERCIAL SALE',
 offlineHistory:'G2_NOT_YET_COMPLETE',
 authoritativeCareerStorage:'G3_NOT_YET_COMPLETE',
 files:output
};
fs.writeFileSync(path.join(target,'WTW-Latest-Build-Info.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(target,'SHA256SUMS.txt'),
 output.map(x=>x.sha256+'  '+x.downloadName).join('\n')+'\n');
console.log('WTW_PERMANENT_LATEST_EXE_ASSETS_READY '+JSON.stringify({
 version,commit:sha,runId,files:output.map(x=>({name:x.downloadName,bytes:x.bytes}))
}));
