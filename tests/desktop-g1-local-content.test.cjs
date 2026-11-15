const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {bundledFile,htmlContentSecurityPolicy}=require('../desktop/local-content.cjs');
const game=path.join(__dirname,'..','public');
test('local bundled game protocol resolves approved existing screen and assets',()=>{
 const a=bundledFile(game,'wtw://game/next/index.html?rev=approved');
 const b=bundledFile(game,'wtw://game/assets/wtw-office-approved-logo.png');
 const c=bundledFile(game,'wtw://game/1999/engine/local-api.mjs?rev=v1');
 assert.ok(fs.existsSync(a),a);
 assert.ok(fs.existsSync(b),b);
 assert.ok(fs.existsSync(c),c);
 assert.equal(bundledFile(game,'wtw://game/next/'),a);
});
test('protocol refuses cloud API, other origins, encoded traversal and Windows paths',()=>{
 for(const value of [
  'https://example.com/next/index.html',
  'wtw://evil/next/index.html',
  'wtw://game/api/bootstrap',
  'wtw://game/api/1999/horses',
  'wtw://game/%2e%2e/.dev.vars',
  'wtw://game/next/%2e%2e/%2e%2e/.dev.vars',
  'wtw://game/next/%5cwindows.ini',
  'wtw://game/next/%00bad',
  'wtw://game',
  'file:///next/index.html'
 ])assert.equal(bundledFile(game,value),null,value);
 assert.match(htmlContentSecurityPolicy,/connect-src 'self'/);
 assert.match(htmlContentSecurityPolicy,/object-src 'none'/);
});
test('desktop only bundles one approved UI and has no remote gaming URL',()=>{
 const main=fs.readFileSync(path.join(__dirname,'../desktop/main.cjs'),'utf8');
 const preload=fs.readFileSync(path.join(__dirname,'../desktop/preload.cjs'),'utf8');
 const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'../desktop/package.json'),'utf8'));
 assert.match(main,/wtw:\/\/game\/next\/index\.html/);
 assert.match(main,/cancel:true/);
 assert.match(main,/sandbox:true,contextIsolation:true,nodeIntegration:false/);
 assert.match(main,/reportSmoke/);
 assert.doesNotMatch(main,/loadURL\(['"]https?:\/\//);
 assert.doesNotMatch(preload,/ipcRenderer|require\(['"](?:fs|child_process|net)['"]\)/);
 assert.equal(pkg.build.extraResources[0].to,'game-public');
 assert.equal(pkg.build.nsis.deleteAppDataOnUninstall,false);
 assert.equal(pkg.build.win.icon,'assets/wtw-app.ico');
 assert.ok(pkg.build.files.includes('local-content.cjs'));
});
