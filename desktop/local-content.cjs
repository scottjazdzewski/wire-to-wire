'use strict';
// Pure, testable path boundary for the ONE local application origin.
// This file never fetches from the network or reads developer credentials.
const path=require('node:path');
const {URL}=require('node:url');

function bundledFile(root,url){
 let parsed;
 try{parsed=new URL(url)}catch{return null}
 if(parsed.protocol!=='wtw:'||parsed.hostname!=='game'||parsed.port||
    parsed.username||parsed.password)return null;
 let pathname;
 try{pathname=decodeURIComponent(parsed.pathname)}catch{return null}
 if(!pathname.startsWith('/')||pathname.includes('\0')||pathname.includes('\\'))return null;
 if(pathname.startsWith('/api/'))return null; // G2: offline historical database
 if(pathname.endsWith('/'))pathname+='index.html';
 const base=path.resolve(root);
 const file=path.resolve(base,'.'+pathname);
 const relative=path.relative(base,file);
 if(!relative||relative==='..'||relative.startsWith('..'+path.sep)||
    path.isAbsolute(relative))return null;
 return file;
}

const htmlContentSecurityPolicy=[
 "default-src 'self' data: blob:",
 "script-src 'self' 'unsafe-inline'",
 "style-src 'self' 'unsafe-inline'",
 "img-src 'self' data: blob:",
 "font-src 'self' data:",
 "connect-src 'self'",
 "worker-src 'self' blob:",
 "object-src 'none'",
 "base-uri 'none'",
 "frame-ancestors 'none'",
 "form-action 'none'"
].join('; ');

module.exports={bundledFile,htmlContentSecurityPolicy};
