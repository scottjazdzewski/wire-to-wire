import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {removeWhiteEdgeMatte,heroContext,profileTitle} from "../public/next/profile-hero-v2.mjs";

const css=readFileSync(new URL("../public/next/profile-hero-v2.css",import.meta.url),"utf8");
const index=readFileSync(new URL("../public/next/index.html",import.meta.url),"utf8");

test("track and farm titles never expose raw route identifiers",()=>{
 assert.equal(profileTitle("track","TRACK PROFILE / CURRENT OFFICE"),"TRACK PROFILE");
 assert.equal(profileTitle("organization","FACILITY PROFILE / CURRENT OFFICE"),"FACILITY PROFILE");
 assert.equal(profileTitle("organization","OWNERSHIP PROFILE / CURRENT OFFICE"),"OWNERSHIP PROFILE");
 assert.deepEqual(heroContext("WorldRecord:track%3AT-0017",""),{kind:"track",id:"T-0017"});
 assert.deepEqual(heroContext("FoundingProfile:facility:O-000061",""),{kind:"organization",id:"O-000061"});
 assert.equal(heroContext("WorldRecord:horse%3AH-0001",""),null);
});
test("unreliable or missing corner mattes are preserved",()=>{
 const w=20,h=20,arr=new Uint8ClampedArray(w*h*4);
 for(let i=0;i<w*h;i++){arr[i*4]=8;arr[i*4+1]=92;arr[i*4+2]=43;arr[i*4+3]=255;}
 const before=arr.slice();
 assert.deepEqual(removeWhiteEdgeMatte({width:w,height:h,data:arr}).changed,false);
 assert.deepEqual(arr,before);
});
test("edge-connected whites disappear while enclosed white brand details survive",()=>{
 const w=30,h=30,a=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=(y*w+x)*4;
  const colored=x>=6&&x<=23&&y>=6&&y<=23;
  const enclosed=x>=12&&x<=17&&y>=12&&y<=17;
  a[p]=colored&&!enclosed?0:255;a[p+1]=colored&&!enclosed?73:255;
  a[p+2]=colored&&!enclosed?51:255;a[p+3]=255;
 }
 const res=removeWhiteEdgeMatte({width:w,height:h,data:a});
 assert.equal(res.changed,true);
 assert.equal(a[3],0); // Edge white turns transparent
 assert.equal(a[(14*w+14)*4+3],255); // Interior white is brand ink
 assert.equal(a[(9*w+9)*4+3],255); // Dark badge is kept
 assert.ok(res.box.width<30&&res.box.height<30);
});
test("hero grid explicitly separates metadata, actions and logo",()=>{
 assert.match(css,/grid-template-areas:"badge identity mark" "badge tools mark"/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/text-overflow:clip!important/);
 assert.match(css,/\.ng-subbar\{display:none!important/);
 assert.match(css,/ng-profile-source-photo\.wtw-hero-dark-ink/);
});
test("hero resources are loaded after existing management assets",()=>{
 assert.ok(index.includes("/next/profile-hero-v2.css"));
 assert.ok(index.includes("/next/profile-hero-v2.mjs"));
 assert.ok(index.indexOf("profile-hero-v2.css")>index.indexOf("identity-themes.css"));
});
