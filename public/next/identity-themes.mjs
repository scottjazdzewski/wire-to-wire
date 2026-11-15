/* WIRE TO WIRE — Logo-derived identity atmosphere.
 * There are no manually authored track/owner colors and no ID-hash palettes.
 * Only actual pixels from the visible approved logo may color a dossier.
 * This module is presentation-only: never touches save or simulation state.
 */
const MARKERS=/^(T-\d{4}|O-[0-9A-Za-z-]+)$/;
export function resolveIdentity(custom,nativeRoute=null){
 const s=String(custom||"");
 if(s.startsWith("WorldRecord:")){
  let raw;try{raw=decodeURIComponent(s.slice("WorldRecord:".length));}catch{return null;}
  let match=raw.match(/^track:(T-\d{4})$/);
  if(match)return {kind:"track",id:match[1]};
  match=raw.match(/^(?:farm|organization):(O-[0-9A-Za-z-]+)$/);
  return match?{kind:"organization",id:match[1]}:null;
 }
 const found=s.match(/^FoundingProfile:(?:facility|ownership):(O-[0-9A-Za-z-]+)$/);
 if(found)return {kind:"organization",id:found[1]};
 if(s)return null;
 if(nativeRoute?.kicker==="Track Profile"&&/^T-\d{4}$/.test(nativeRoute?.id||""))
  return {kind:"track",id:nativeRoute.id};
 if(/^(?:Farm|Stable|Organization|Ownership Group|Breeding Farm) Profile$/.test(nativeRoute?.kicker||"")&&
    /^O-[0-9A-Za-z-]+$/.test(nativeRoute?.id||""))
  return {kind:"organization",id:nativeRoute.id};
 return null;
}
function hueOf(r,g,b){
 const lo=Math.min(r,g,b),hi=Math.max(r,g,b),d=hi-lo;
 if(d===0)return 0;
 let h=hi===r?((g-b)/d)%6:hi===g?(b-r)/d+2:(r-g)/d+4;
 return ((h*60)%360+360)%360;
}
const asHex=([r,g,b])=>"#"+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,"0")).join("").toUpperCase();

/* Pure image-data extraction. Keep only visible, chromatic logo ink.
 * White matte/transparent canvas, black outlines and neutral lettering
 * must not become invented brand colors. The returned color is an ACTUAL
 * source pixel nearest the winning chromatic cluster center. */
export function paletteFromImageData(image){
 const {width,height,data}=image||{};
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
   !data||data.length!==width*height*4)return null;
 const bins=Array.from({length:24},()=>({weight:0,r:0,g:0,b:0}));
 const samples=[];
 for(let i=0;i<data.length;i+=4){
  const a=data[i+3];if(a<96)continue;
  const r=data[i],g=data[i+1],b=data[i+2],hi=Math.max(r,g,b),lo=Math.min(r,g,b);
  const chroma=hi-lo;
  if(hi<68||chroma<33||chroma/Math.max(hi,1)<.19)continue;
  const bin=Math.floor(hueOf(r,g,b)/15)%24;
  const w=(a/255)*(.65+chroma/255);
  const x=bins[bin];x.weight+=w;x.r+=w*r;x.g+=w*g;x.b+=w*b;
  samples.push({bin,r,g,b});
 }
 if(samples.length<12)return null;
 const ranked=bins.map((x,i)=>({...x,i})).filter(x=>x.weight>0)
  .sort((a,b)=>b.weight-a.weight);
 if(!ranked.length)return null;
 const actualPixel=cluster=>{
  const mean=[cluster.r,cluster.g,cluster.b].map(n=>n/cluster.weight);
  let closest=null,distance=Infinity;
  for(const s of samples)if(s.bin===cluster.i){
   const d=(s.r-mean[0])**2+(s.g-mean[1])**2+(s.b-mean[2])**2;
   if(d<distance){distance=d;closest=[s.r,s.g,s.b];}
  }
  return closest;
 };
 const first=ranked[0],primary=actualPixel(first);
 if(!primary)return null;
 const other=ranked.slice(1).find(x=>
  x.weight>=first.weight*.24&&
  Math.min(Math.abs(x.i-first.i),24-Math.abs(x.i-first.i))>=2);
 const secondary=(other&&actualPixel(other))||primary;
 return {base:asHex(primary),bright:asHex(secondary),source:"logo-pixels"};
}
function isActualEntityLogo(img,identity,source){
 const id=identity.id,kind=identity.kind;
 const path=source.startsWith("data:")||source.startsWith("blob:")?"":new URL(source,document.baseURI).pathname;
 const exact=kind==="track"?
  ["/assets/places/track-hero/"+id+".webp",
   "/assets/places/track-logos/"+id+".webp",
   "/assets/tracks/"+id+".webp"]:
  ["/assets/places/organization-hero/"+id+".webp",
   "/assets/office/founding-organization-logos/"+id+".png"];
 if(exact.includes(path))return true;
 // The hero renderer creates temporary blob URLs by optical-cropping the
 // already verified exact-ID logo; these retain its unchanged logo colors.
 if(source.startsWith("blob:")&&img.closest(".wtw-hero-transparent"))return true;
 // A player's career-local image edit replaces the actual identity artwork.
 if(source.startsWith("data:image/")&&img.closest(".ng-profile-source-photo"))return true;
 return false;
}
function startThemes(){
 const shell=document.getElementById("wtwNextgen");
 if(!shell)return;
 const palettes=new Map(),observed=new WeakSet();
 let lastKey="";
 function nativeRoute(){
  const source=document.querySelector("#routeBody");
  const profile=source?.querySelector("[data-track-id],[data-organization-id]")||source;
  const kicker=document.querySelector("#routeKicker")?.textContent?.trim()||"";
  const id=kicker==="Track Profile"?profile?.dataset?.trackId:profile?.dataset?.organizationId;
  return {kicker,id:id||""};
 }
 function clearPalette(){
  if(shell.hasAttribute("data-wtw-logo-theme"))shell.removeAttribute("data-wtw-logo-theme");
  shell.removeAttribute("data-wtw-identity-source");
  for(const key of ["base","bright"])shell.style.removeProperty("--wtw-id-"+key);
  lastKey="";
 }
 function imagePalette(img,src){
  if(palettes.has(src))return palettes.get(src);
  let found=null;
  try{
   const canvas=document.createElement("canvas"),w=img.naturalWidth,h=img.naturalHeight;
   const scale=Math.min(1,160/Math.max(w,h));
   canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
   const ctx=canvas.getContext("2d",{willReadFrequently:true});
   if(ctx){ctx.drawImage(img,0,0,canvas.width,canvas.height);
    found=paletteFromImageData(ctx.getImageData(0,0,canvas.width,canvas.height));}
  }catch{/* Cross-origin or unreadable media: remain neutral; never guess. */}
  palettes.set(src,found);
  return found;
 }
 function apply(){
  const app=window.__WTW_NEXT__?.app;
  if(!app?.ready)return;
  const identity=resolveIdentity(app.custom,nativeRoute());
  if(!identity||!MARKERS.test(identity.id)){
   if(shell.hasAttribute("data-wtw-identity")){
    shell.removeAttribute("data-wtw-identity");
    shell.removeAttribute("data-wtw-identity-kind");
   }
   clearPalette();return;
  }
  // The logo optically-fit renderer also depends on this exact immutable ID.
  if(shell.getAttribute("data-wtw-identity")!==identity.id){
   clearPalette();shell.setAttribute("data-wtw-identity",identity.id);
  }
  shell.setAttribute("data-wtw-identity-kind",identity.kind);
  const img=shell.querySelector(".ng-route-profile .ng-profile-view.ng-profile-track > .ng-profile-intro > .ng-profile-source-photo img");
  const src=img&&(img.currentSrc||img.src);
  if(!img||!src||!isActualEntityLogo(img,identity,src)){clearPalette();return;}
  if(!img.complete||img.naturalWidth<1||img.naturalHeight<1){
   clearPalette();
   if(!observed.has(img)){
    observed.add(img);
    img.addEventListener("load",apply,{once:true});
    img.addEventListener("error",apply,{once:true});
   }
   return;
  }
  const colors=imagePalette(img,src);
  if(!colors){clearPalette();return;}
  const key=identity.kind+":"+identity.id+"|"+src+"|"+colors.base+"|"+colors.bright;
  if(key===lastKey)return;
  lastKey=key;
  shell.style.setProperty("--wtw-id-base",colors.base);
  shell.style.setProperty("--wtw-id-bright",colors.bright);
  shell.setAttribute("data-wtw-identity-source",colors.source);
  shell.setAttribute("data-wtw-logo-theme","ready");
 }
 // UI profile content is replaced on navigation, and the hero image may be
 // optically fitted after its source loads. Never observe style writes.
 new MutationObserver(apply).observe(shell,{
  childList:true,subtree:true,attributes:true,
  attributeFilter:["data-wtw-identity","src"]
 });
 apply();
}
if(typeof document!=="undefined"){
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",startThemes,{once:true});
 else startThemes();
}
