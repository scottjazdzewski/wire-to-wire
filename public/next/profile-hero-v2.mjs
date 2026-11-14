/* WTW Profile Hero v2.
 * A presentation-only companion to the canonical 1999 UI. Never writes game
 * state, alters entity IDs, modifies source ledgers, or injects another menu.
 */
const ROOT_ID="wtwNextgen";
const HERO_INDEX="/assets/identity/hero-art-index-v1.json";
const ID_TRACK=/^T-\d{4}$/;
const ID_ORG=/^O-[0-9A-Za-z-]+$/;
const LEGACY_TRACK=/\/assets\/(?:places\/track-logos|tracks)\/T-\d{4}\.webp(?:[?#]|$)/;
const cache=new Map();

/* Pixel-correct white matte elimination for LEGACY photo-backed track marks.
 * Only boundary-connected light pixels are keyed. Interior white details
 * surrounded by a colored emblem are preserved. The original file is never
 * modified; this is a disposable, UI-only visual derivative. */
export function removeWhiteEdgeMatte(imageData){
 const {width,height,data}=imageData;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||
    !data||data.length!==width*height*4)return {changed:false,box:null};
 const corners=[0,width-1,width*(height-1),width*height-1];
 const nearWhite=p=>{
  const i=4*p;
  return data[i]>=232&&data[i+1]>=232&&data[i+2]>=232;
 };
 if(corners.filter(nearWhite).length<3)return {changed:false,box:null};
 const pixels=width*height,seen=new Uint8Array(pixels),queue=new Uint32Array(pixels);
 let head=0,tail=0,removed=0;
 let lowX=width,lowY=height,highX=0,highY=0,ink=0,inkN=0;
 const candidate=p=>{
  const i=p*4,r=data[i],g=data[i+1],b=data[i+2];
  return data[i+3]>0&&Math.min(r,g,b)>=165&&
    Math.max(r,g,b)-Math.min(r,g,b)<=85;
 };
 const enqueue=p=>{
  if(seen[p])return;
  seen[p]=1;
  if(candidate(p))queue[tail++]=p;
 };
 for(let x=0;x<width;x++){enqueue(x);enqueue((height-1)*width+x);}
 for(let y=0;y<height;y++){enqueue(y*width);enqueue(y*width+width-1);}
 while(head<tail){
  const p=queue[head++],i=p*4,r=data[i],g=data[i+1],b=data[i+2];
  const min=Math.min(r,g,b),a=(255-min)/255;
  if(a<=0.016){data[i]=0;data[i+1]=0;data[i+2]=0;data[i+3]=0;}
  else {
    const residual=255*(1-a);
    data[i]=Math.round(Math.max(0,Math.min(255,(r-residual)/a)));
    data[i+1]=Math.round(Math.max(0,Math.min(255,(g-residual)/a)));
    data[i+2]=Math.round(Math.max(0,Math.min(255,(b-residual)/a)));
    data[i+3]=Math.round(data[i+3]*a);
  }
  removed++;
  const x=p%width,y=(p-x)/width;
  if(x)enqueue(p-1);
  if(x<width-1)enqueue(p+1);
  if(y)enqueue(p-width);
  if(y<height-1)enqueue(p+width);
 }
 // Sparse border pixels do not count as matte. Avoid changing colored crests.
 if(removed<Math.max(10,Math.round(pixels*.025)))return {changed:false,box:null};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,alpha=data[i+3];
  if(alpha<20)continue;
  lowX=Math.min(lowX,x);highX=Math.max(highX,x);
  lowY=Math.min(lowY,y);highY=Math.max(highY,y);
  if(alpha>=110&&inkN<50000){
   ink+=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
   inkN++;
  }
 }
 if(lowX>highX||lowY>highY)return {changed:false,box:null};
 const padX=Math.round((highX-lowX+1)*.065),padY=Math.round((highY-lowY+1)*.10);
 const x=Math.max(0,lowX-padX),y=Math.max(0,lowY-padY);
 return {changed:true,box:{x,y,
  width:Math.min(width-x,highX-x+1+padX),
  height:Math.min(height-y,highY-y+1+padY)},
  darkInk:inkN>0&&ink/inkN<110};
}

async function makeLegacyHero(url){
 const original=new Image();
 original.decoding="async";
 original.src=url;
 await original.decode();
 if(!original.naturalWidth||!original.naturalHeight)return null;
 const canvas=document.createElement("canvas");
 canvas.width=original.naturalWidth;canvas.height=original.naturalHeight;
 const ctx=canvas.getContext("2d",{willReadFrequently:true});
 if(!ctx)return null;
 ctx.drawImage(original,0,0);
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
 const result=removeWhiteEdgeMatte(pixels);
 if(!result.changed)return null;
 ctx.putImageData(pixels,0,0);
 const out=document.createElement("canvas");
 out.width=result.box.width;out.height=result.box.height;
 const outctx=out.getContext("2d");
 if(!outctx)return null;
 outctx.drawImage(canvas,
  result.box.x,result.box.y,result.box.width,result.box.height,
  0,0,out.width,out.height);
 const blob=await new Promise(resolve=>out.toBlob(resolve,"image/webp",.95));
 if(!blob)return null;
 return {url:URL.createObjectURL(blob),darkInk:result.darkInk};
}
function cachedLegacyHero(src){
 if(!cache.has(src))cache.set(src,makeLegacyHero(src).catch(()=>null));
 return cache.get(src);
}
export function heroContext(appCustom,themeId){
 const value=String(appCustom||"");
 if(themeId&&ID_TRACK.test(themeId))return {kind:"track",id:themeId};
 if(themeId&&ID_ORG.test(themeId))return {kind:"organization",id:themeId};
 const track=value.match(/^WorldRecord:track(?:%3A|:)(T-\d{4})$/i);
 if(track)return {kind:"track",id:track[1]};
 const org=value.match(/^FoundingProfile:(?:ownership|facility):(O-[0-9A-Za-z-]+)$/);
 if(org)return {kind:"organization",id:org[1]};
 return null;
}
export function profileTitle(kind,sourceLabel){
 if(kind==="track")return "TRACK PROFILE";
 const s=String(sourceLabel||"").split("/")[0].trim().toUpperCase();
 return /^(FACILITY|OWNERSHIP|STABLE|FARM|ORGANIZATION) PROFILE$/.test(s)?s:"ORGANIZATION PROFILE";
}
/* Automatic upload recognition: assets placed at the canonical path
 * become active on refresh, with no required manifest edit. Named/approved
 * manifest entries still take precedence. We probe before swapping images. */
const heroProbes=new Map();
export function heroCandidate(kind,id,approved=""){
 // Ignore even a valid-looking manifest URL if its exact immutable ID differs.
 // The one deterministic path keeps image identity consistent across routes.
 const path=kind==="track"&&ID_TRACK.test(id||"")?
  "/assets/places/track-hero/"+id+".webp":
  kind==="organization"&&ID_ORG.test(id||"")?
  "/assets/places/organization-hero/"+id+".webp":"";
 return path;
}
function heroAvailable(src){
 if(!heroProbes.has(src)){
  const img=new Image();
  img.src=src;
  heroProbes.set(src,img.decode().then(()=>{
   // Non-destructive color sampling: a navy/black transparent wordmark needs a
   // pale diffuse spotlight to remain legible on a dark team-colored header.
   try{
    const sample=document.createElement("canvas");
    sample.width=64;sample.height=48;
    const ctx=sample.getContext("2d",{willReadFrequently:true});
    if(!ctx)return {ok:true,darkInk:false};
    ctx.drawImage(img,0,0,sample.width,sample.height);
    const data=ctx.getImageData(0,0,sample.width,sample.height).data;
    let luminosity=0,pixels=0;
    for(let i=0;i<data.length;i+=4)if(data[i+3]>=105){
     luminosity+=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];pixels++;
    }
    return {ok:true,darkInk:pixels>20&&luminosity/pixels<112};
   }catch{return {ok:true,darkInk:false};}
  }).catch(()=>({ok:false,darkInk:false})));
 }
 return heroProbes.get(src);
}

/* When an entity has no source logo at all, render a distinctive temporary
 * TYPOGRAPHIC identity. This never claims to be a historical or official logo.
 * Source-backed transparent artwork replaces it automatically by canonical ID. */
export function heroInitials(name){
 const words=String(name||"").normalize("NFKC")
  .replace(/[^\p{L}\p{N}\s'-]/gu," ")
  .split(/[\s'-]+/).filter(Boolean);
 const ignore=new Set(["farm","farms","stable","stables","stud","racing","park","racecourse",
  "raceway","downs","partners","partnership","group","inc","llc","the"]);
 const significant=words.filter(w=>!ignore.has(w.toLowerCase()));
 const parts=significant.length?significant:words;
 if(parts.length>=2)return (parts[0].slice(0,1)+parts[1].slice(0,1)).toUpperCase();
 return (parts[0]||"WT").slice(0,2).toUpperCase();
}
function temporaryIdentity(mark,kind,name){
 if(mark.querySelector(".wtw-hero-fallback"))return;
 const holder=document.createElement("div");
 holder.className="wtw-hero-fallback";
 const monogram=document.createElement("strong");
 monogram.className="wtw-hero-fallback-monogram";
 monogram.textContent=heroInitials(name);
 const descriptor=document.createElement("span");
 descriptor.className="wtw-hero-fallback-descriptor";
 descriptor.textContent=kind==="track"?"RACECOURSE":"RACING ORGANIZATION";
 holder.append(monogram,descriptor);
 mark.replaceChildren(holder);
 mark.classList.add("wtw-hero-typographic");
 mark.classList.remove("wtw-hero-legacy","wtw-hero-transparent","wtw-hero-dark-ink");
 mark.setAttribute("role","img");
 mark.setAttribute("aria-label","Temporary typographic identifier for "+name+"; logo not yet assigned");
}
function ensureHeroStage(profile,kind,name){
 const intro=profile.querySelector(".ng-profile-intro");
 if(!intro)return null;
 let mark=intro.querySelector(":scope > .ng-profile-source-photo");
 if(!mark){
  mark=document.createElement("div");
  mark.className="ng-profile-source-photo wtw-hero-generated";
  intro.insertBefore(mark,intro.querySelector(":scope > .ng-profile-tools"));
 }
 if(!mark.querySelector("img"))temporaryIdentity(mark,kind,name);
 return mark;
}

/* Shared top-context presentation for the two original dossiers.
 * The Profile view's published name, not the URL/route token, is the label.
 * Horse owner badges may precede the literal name inside h2; read the
 * direct name text, not the badge's combined textContent. */
export function dossierLabel(classNames){
 const classes=" "+String(classNames||"")+" ";
 if(classes.includes(" ng-profile-person "))return "PERSONNEL PROFILE";
 if(classes.includes(" ng-profile-horse "))return "HORSE PROFILE";
 return "";
}
function polishDossierContext(root){
 const profile=root.querySelector(".ng-route-profile .ng-profile-view");
 if(!profile||profile.classList.contains("ng-profile-track"))return;
 const label=dossierLabel(profile.className);
 if(!label)return;
 const identity=profile.querySelector(".ng-profile-intro > .ng-profile-identity");
 const heading=identity?.querySelector("h2");
 if(!heading)return;
 const direct=Array.from(heading.childNodes)
  .filter(node=>node.nodeType===3)
  .map(node=>node.textContent.trim()).filter(Boolean);
 const name=(direct.at(-1)||heading.textContent||"").replace(/\s+/g," ").trim();
 if(!name)return;
 const top=root.querySelector(".ng-manager-top-context");
 const strong=top?.querySelector("strong"),value=top?.querySelector("span");
 if(strong&&strong.textContent!==label)strong.textContent=label;
 if(value&&value.textContent!==name){value.textContent=name;value.title=name;}
 const breadcrumb=identity.querySelector(".ng-profile-breadcrumb");
 if(breadcrumb&&breadcrumb.textContent!==label)breadcrumb.textContent=label;
}

function init(){
 const root=document.getElementById(ROOT_ID);
 if(!root)return;
 let art=null;
 const run=()=>{
  polishDossierContext(root);
  const profile=root.querySelector(".ng-route-profile .ng-profile-view.ng-profile-track");
  if(!profile)return;
  const farm=profile.classList.contains("ng-profile-farm");
  const kind=farm?"organization":"track";
  const identity=profile.querySelector(".ng-profile-identity");
  const name=identity?.querySelector("h2")?.textContent?.replace(/\s+/g," ").trim();
  if(!name)return;
  const breadcrumb=identity.querySelector(".ng-profile-breadcrumb");
  const label=profileTitle(kind,breadcrumb?.textContent);
  // Top context never exposes internal percent-encoded route keys.
  const context=root.querySelector(".ng-manager-top-context");
  const strong=context?.querySelector("strong"),span=context?.querySelector("span");
  if(strong&&strong.textContent!==label)strong.textContent=label;
  if(span&&span.textContent!==name){span.textContent=name;span.title=name;}
  if(breadcrumb&&breadcrumb.textContent!==label)breadcrumb.textContent=label;
  if(farm){
   const categoryBadge=profile.querySelector(".ng-profile-intro > .ng-org-mark");
   if(categoryBadge){
    categoryBadge.setAttribute("role","img");
    categoryBadge.setAttribute("aria-label","Farm, stable and ownership profile badge");
   }
  }
  const mark=ensureHeroStage(profile,kind,name);
  if(!mark)return;
  const entity=heroContext(window.__WTW_NEXT__?.app?.custom,
    root.getAttribute("data-wtw-identity"));
  const id=entity?.kind===kind?entity.id:null;
  const approved=id?art?.[kind==="track"?"tracks":"organizations"]?.[id]:"";
  const candidate=heroCandidate(kind,id,approved);
  const img=mark.querySelector("img");
  if(!img){
   // Missing photo/organization logo previously exited before asset lookup.
   // Check the exact-ID upload location even when the source had no image.
   if(candidate&&mark.dataset.wtwHeroProbePath!==candidate){
    mark.dataset.wtwHeroProbePath=candidate;
    heroAvailable(candidate).then(visual=>{
     if(!mark.isConnected||mark.dataset.wtwHeroProbePath!==candidate||!visual.ok)return;
     const logo=document.createElement("img");
     logo.decoding="async";logo.loading="eager";logo.alt=name+" logo";
     logo.addEventListener("error",()=>{
      if(!mark.isConnected)return;
      temporaryIdentity(mark,kind,name);
      mark.dataset.wtwHeroProbePath=candidate;
     },{once:true});
     logo.src=candidate;
     mark.replaceChildren(logo);
     mark.classList.remove("wtw-hero-typographic","wtw-hero-legacy","wtw-hero-dark-ink");
     mark.classList.add("wtw-hero-transparent");
     mark.setAttribute("aria-label",name+" logo");
     if(visual.darkInk)mark.classList.add("wtw-hero-dark-ink");
    });
   }
   return;
  }
  const legacy=()=>{
   const src=img.getAttribute("src")||"";
   if(img.dataset.wtwMatteSource===src)return;
   mark.classList.add("wtw-hero-legacy");
   if(kind!=="track"||!LEGACY_TRACK.test(src))return;
   // This is ONLY a temporary presentation fallback. Genuine uploaded
   // transparent assets are used unmodified, including their letter counters.
   img.dataset.wtwMatteSource=src;
   const absolute=new URL(src,location.href).href;
   cachedLegacyHero(absolute).then(asset=>{
    if(!asset||!img.isConnected||img.dataset.wtwMatteSource!==src)return;
    img.addEventListener("error",()=>{
     if(!img.isConnected||img.getAttribute("src")!==asset.url)return;
     img.src=src;img.dataset.wtwMatteSource=src;
     mark.classList.remove("wtw-hero-transparent","wtw-hero-dark-ink");
     mark.classList.add("wtw-hero-legacy");
    },{once:true});
    img.src=asset.url;img.dataset.wtwMatteSource=asset.url;
    mark.classList.remove("wtw-hero-legacy");
    mark.classList.add("wtw-hero-transparent");
    if(asset.darkInk)mark.classList.add("wtw-hero-dark-ink");
   });
  };
  if(candidate){
   if(img.getAttribute("src")===candidate){
    img.dataset.wtwHeroProbePath=candidate;
    img.dataset.wtwHeroState="active";
    mark.classList.remove("wtw-hero-legacy","wtw-hero-dark-ink");
    mark.classList.add("wtw-hero-transparent");
    return;
   }
   const matching=img.dataset.wtwHeroProbePath===candidate;
   const state=matching?img.dataset.wtwHeroState:"";
   if(state==="active"||state==="pending")return;
   if(!matching){
    img.dataset.wtwHeroProbePath=candidate;
    img.dataset.wtwHeroState="pending";
    heroAvailable(candidate).then(visual=>{
     if(!img.isConnected||img.dataset.wtwHeroProbePath!==candidate)return;
     img.dataset.wtwHeroState=visual.ok?"active":"missing";
     if(!visual.ok){legacy();return;}
     const before=img.getAttribute("src");
     img.addEventListener("error",()=>{
      if(img.isConnected&&img.getAttribute("src")===candidate){
       if(before)img.src=before;
       img.dataset.wtwHeroState="missing";
       mark.classList.remove("wtw-hero-transparent","wtw-hero-dark-ink");
       mark.classList.add("wtw-hero-legacy");
      }
     },{once:true});
     img.src=candidate;
     img.dataset.wtwMatteSource=candidate;
     mark.classList.remove("wtw-hero-legacy","wtw-hero-dark-ink");
     mark.classList.add("wtw-hero-transparent");
     if(visual.darkInk)mark.classList.add("wtw-hero-dark-ink");
    });
    return;
   }
  }
  legacy();
 };
 new MutationObserver(run).observe(root,{childList:true,attributes:true,attributeFilter:["data-wtw-identity"]});
 run();
 fetch(HERO_INDEX+"?v=20261113b",{credentials:"same-origin"})
 .then(res=>res.ok?res.json():Promise.reject(Error("Hero art index unavailable")))
 .then(json=>{if(json?.schema!=="WTW_HERO_ART_INDEX_V1")return;art=json;run();})
 .catch(()=>{/* Existing art, preserved as a fallback. */});
}
if(typeof document!=="undefined"){
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
 else init();
}
