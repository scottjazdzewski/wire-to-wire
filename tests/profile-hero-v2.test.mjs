import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {removeWhiteEdgeMatte,heroContext,profileTitle,heroCandidate,heroInitials,dossierLabel,visibleAlphaBounds} from "../public/next/profile-hero-v2.mjs";

const css=readFileSync(new URL("../public/next/next.css",import.meta.url),"utf8");
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
test("profile hero styles are part of the ONE canonical stylesheet, without changing art handling",()=>{
 const links=[...index.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(m=>m[1].split("?")[0]);
 assert.deepEqual(links,["/next/next.css"]);
 assert.match(css,/BEGIN folded source: public\/next\/identity-themes\.css/);
 assert.match(css,/BEGIN folded source: public\/next\/profile-hero-v2\.css/);
 assert.ok(css.indexOf("BEGIN folded source: public/next/profile-hero-v2.css")>css.indexOf("BEGIN folded source: public/next/identity-themes.css"));
 assert.ok(index.includes("/next/profile-hero-v2.mjs"));
});

test("transparent hero uploads auto-discover by exact canonical ID",()=>{
 assert.equal(heroCandidate("track","T-0001"),"/assets/places/track-hero/T-0001.webp");
 assert.equal(heroCandidate("track","T-0017"),"/assets/places/track-hero/T-0017.webp");
 assert.equal(heroCandidate("organization","O-000061"),"/assets/places/organization-hero/O-000061.webp");
 assert.equal(heroCandidate("track","T-0001","/assets/places/track-hero/T-0002.webp"),"/assets/places/track-hero/T-0001.webp");
 assert.equal(heroCandidate("person","P-000061"),"");
});
test("transparent brand pixels are never altered by white-background fallback",()=>{
 const w=18,h=18,arr=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=(y*w+x)*4;
  arr[p]=x>=4&&x<14?25:255;
  arr[p+1]=x>=4&&x<14?130:255;
  arr[p+2]=x>=4&&x<14?170:255;
  arr[p+3]=x>=4&&x<14&&y>=4&&y<14?255:0;
 }
 const before=arr.slice();
 assert.equal(removeWhiteEdgeMatte({width:w,height:h,data:arr}).changed,false);
 assert.deepEqual(arr,before);
});
test("farm/ownership logo badges are inside the protected hero grid",()=>{
 assert.match(css,/ng-profile-view\.ng-profile-farm > \.ng-profile-intro > \.ng-org-mark/);
});


test("temporary racecourse and organization marks derive only from visible entity names",()=>{
 assert.equal(heroInitials("Aqueduct"),"AQ");
 assert.equal(heroInitials("Kingsmere Farm"),"KI");
 assert.equal(heroInitials("St. Alloy Partners"),"SA");
 assert.equal(heroInitials("Four Corners Farm"),"FC");
 assert.equal(heroInitials(""),"WT");
});
test("profiles without a preexisting img still activate newly produced exact-ID logos",()=>{
 const source=readFileSync(new URL("../public/next/profile-hero-v2.mjs",import.meta.url),"utf8");
 assert.match(source,/if\(!img\)\{\s*\/\/ Missing photo\/organization logo previously exited/);
 assert.match(source,/heroAvailable\(candidate\)\.then\(visual=>/);
 assert.match(source,/mark\.replaceChildren\(logo\)/);
 assert.match(source,/temporaryIdentity\(mark,kind,name\)/);
 assert.match(source,/ensureHeroStage\(profile,kind,name\)/);
 assert.match(css,/\.wtw-hero-fallback-monogram/);
});

test("organization profile uses approved small category badge, not duplicate hero logo",()=>{
 const badge=new URL("../public/assets/profile-badges/v2/wtw_badge_farm_stable.png",import.meta.url);
 assert.equal(existsSync(badge),true);
 assert.match(css,/ng-profile-view\.ng-profile-farm > \.ng-profile-intro > \.ng-org-mark\{/);
 assert.match(css,/wtw_badge_farm_stable\.png/);
 assert.match(css,/ng-profile-view\.ng-profile-farm > \.ng-profile-intro > \.ng-org-mark > \.ng-org-image/);
 const js=readFileSync(new URL("../public/next/profile-hero-v2.mjs",import.meta.url),"utf8");
 assert.match(js,/categoryBadge\.setAttribute\("aria-label","Farm, stable and ownership profile badge"\)/);
});


test("horse and personnel dossier top labels are profile-specific, never route codes",()=>{
 assert.equal(dossierLabel("ng-profile-view ng-profile-horse"),"HORSE PROFILE");
 assert.equal(dossierLabel("ng-profile-view ng-profile-person ng-profile-horse"),"PERSONNEL PROFILE");
 assert.equal(dossierLabel("ng-profile-view ng-profile-track"),"");
 assert.equal(dossierLabel("ng-route-manager"),"");
 const src=readFileSync(new URL("../public/next/profile-hero-v2.mjs",import.meta.url),"utf8");
 assert.match(src,/polishDossierContext\(root\)/);
 assert.match(src,/filter\(node=>node\.nodeType===3\)/);
 assert.match(src,/direct\.at\(-1\)/);
 assert.match(src,/if\(value&&value\.textContent!==name\)/);
});
test("profile dossier subnavigation keeps buttons and more records on narrow screens",()=>{
 assert.match(css,/ng-profile-view \.ng-person-dossieractions/);
 assert.match(css,/grid-template-columns:minmax\(64px,1fr\) minmax\(64px,1fr\) minmax\(110px,1\.5fr\)/);
 assert.match(css,/height:auto!important/);
});


test("transparent logo safe margins are optically fitted without changing source pixels",()=>{
 const w=160,h=120,rgba=new Uint8ClampedArray(w*h*4);
 // A transparent horizontal mark with its own large 4:3 export canvas.
 for(let y=42;y<=67;y++)for(let x=21;x<=137;x++){
  const p=(y*w+x)*4;
  rgba[p]=0;rgba[p+1]=167;rgba[p+2]=204;rgba[p+3]=255;
 }
 const before=rgba.slice();
 const crop=visibleAlphaBounds({width:w,height:h,data:rgba});
 assert.ok(crop);
 assert.ok(crop.x<21&&crop.y<42);
 assert.ok(crop.width<160&&crop.height<120);
 assert.ok(crop.x+crop.width>137&&crop.y+crop.height>67);
 assert.deepEqual(rgba,before,"optical geometry must never alter source pixels");
});
test("full-bleed, invalid, and nearly invisible images skip optical cropping",()=>{
 const w=20,h=20,opaque=new Uint8ClampedArray(w*h*4);
 for(let i=0;i<w*h;i++)opaque[i*4+3]=255;
 assert.equal(visibleAlphaBounds({width:w,height:h,data:opaque}),null);
 assert.equal(visibleAlphaBounds({width:0,height:0,data:new Uint8ClampedArray(0)}),null);
 const invisible=new Uint8ClampedArray(opaque.length);
 invisible[3]=255;
 assert.equal(visibleAlphaBounds({width:w,height:h,data:invisible}),null);
});
test("optical-fit derivatives only change display URLs, never canonical exact-ID file paths",()=>{
 const source=readFileSync(new URL("../public/next/profile-hero-v2.mjs",import.meta.url),"utf8");
 assert.match(source,/makeOpticalHero\(img,src\)/);
 assert.match(source,/cropped\.toBlob\(resolve,"image\/png"\)/);
 assert.match(source,/img\.src=display/);
 assert.match(source,/logo\.src=visual\.displayUrl\|\|candidate/);
 assert.equal(heroCandidate("track","T-0017"),"/assets/places/track-hero/T-0017.webp");
});
