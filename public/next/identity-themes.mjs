/* Wire to Wire — entity-aware presentation themes.
 * Presentation only. No gameplay/state mutations, no name-to-ID guesses.
 * Every track and organization can use a curated identity palette;
 * uncurated records receive a deterministic WTW house palette.
 */
const SWATCHES = Object.freeze([
  ["#183540","#346F8F","#83C7E6","#E7D59A"],
  ["#36263A","#755080","#D0A3DB","#EBD6AE"],
  ["#3C252A","#954A5C","#F09DA8","#EAD8AC"],
  ["#263629","#4E8359","#A7D7A9","#E8D09A"],
  ["#2E303B","#666B89","#B5C0E1","#DAD4B9"],
  ["#343221","#8A7540","#E0C66F","#F3E2B2"],
  ["#24383C","#3F8586","#98DBD3","#E9D6AB"],
  ["#352C30","#895D67","#DBA8AB","#F2DDAE"],
  ["#2C2B40","#625B95","#B0ABEF","#ECD9AC"],
  ["#29372E","#57806C","#AAD7C3","#D8CDA9"],
  ["#382E23","#966746","#E3B384","#F1DDAC"],
  ["#213640","#437D98","#A0D3EF","#E5D3B9"]
]);
const HEX=/^#[0-9A-Fa-f]{6}$/;
const MARKERS=/^(T-\d{4}|O-[0-9A-Za-z-]+)$/;
const sameId=(a,b)=>a?.kind===b?.kind&&a?.id===b?.id;

export function resolveIdentity(custom, nativeRoute=null){
  const s=String(custom||"");
  let raw="";
  if(s.startsWith("WorldRecord:")){
    try{raw=decodeURIComponent(s.slice("WorldRecord:".length));}catch{return null;}
    let match=raw.match(/^track:(T-\d{4})$/);
    if(match)return {kind:"track",id:match[1]};
    match=raw.match(/^(?:farm|organization):(O-[0-9A-Za-z-]+)$/);
    if(match)return {kind:"organization",id:match[1]};
    return null;
  }
  const founding=s.match(/^FoundingProfile:(?:facility|ownership):(O-[0-9A-Za-z-]+)$/);
  if(founding)return {kind:"organization",id:founding[1]};
  if(s)return null;
  if(nativeRoute?.kicker==="Track Profile"&&/^T-\d{4}$/.test(nativeRoute?.id||""))
    return {kind:"track",id:nativeRoute.id};
  if(/^(?:Farm|Stable|Organization|Ownership Group|Breeding Farm) Profile$/.test(nativeRoute?.kicker||"")&&
     /^O-[0-9A-Za-z-]+$/.test(nativeRoute?.id||""))
    return {kind:"organization",id:nativeRoute.id};
  return null;
}
function hashId(s){
  let hash=2166136261;
  for(const ch of s){hash^=ch.codePointAt(0);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}
export function housePalette(context){
  if(!context||!["track","organization"].includes(context.kind)||!MARKERS.test(context.id||""))
    return null;
  const swatch=SWATCHES[hashId(context.kind+":"+context.id)%SWATCHES.length];
  return {deep:swatch[0],base:swatch[1],bright:swatch[2],highlight:swatch[3],source:"wtw-house"};
}
export function paletteFor(context,registry){
  const fallback=housePalette(context);
  if(!fallback)return null;
  const entries=context.kind==="track"?registry?.tracks:registry?.organizations;
  const custom=entries?.[context.id];
  if(custom&&["deep","base","bright","highlight"].every(k=>HEX.test(custom[k]||""))){
    return {deep:custom.deep,base:custom.base,bright:custom.bright,highlight:custom.highlight,source:"curated"};
  }
  return fallback;
}

function startThemes(){
  const shell=document.getElementById("wtwNextgen");
  if(!shell)return;
  let registry=null,lastKey="";
  const nativeRoute=()=>{
    const source=document.querySelector("#routeBody");
    const profile=source?.querySelector("[data-track-id],[data-organization-id]")||source;
    const kicker=document.querySelector("#routeKicker")?.textContent?.trim()||"";
    const id=kicker==="Track Profile"?profile?.dataset?.trackId:
      profile?.dataset?.organizationId;
    return {kicker,id:id||""};
  };
  const clear=()=>{
    if(!shell.hasAttribute("data-wtw-identity"))return;
    shell.removeAttribute("data-wtw-identity");
    shell.removeAttribute("data-wtw-identity-kind");
    shell.removeAttribute("data-wtw-identity-source");
    for(const key of ["deep","base","bright","highlight"])
      shell.style.removeProperty("--wtw-id-"+key);
    lastKey="";
  };
  const apply=()=>{
    const app=window.__WTW_NEXT__?.app;
    if(!app?.ready)return;
    const identity=resolveIdentity(app.custom,nativeRoute());
    if(!identity){clear();return;}
    const colors=paletteFor(identity,registry);
    if(!colors){clear();return;}
    const key=identity.kind+":"+identity.id+"|"+colors.source+"|"+colors.base;
    if(key===lastKey)return;
    lastKey=key;
    shell.setAttribute("data-wtw-identity",identity.id);
    shell.setAttribute("data-wtw-identity-kind",identity.kind);
    shell.setAttribute("data-wtw-identity-source",colors.source);
    for(const k of ["deep","base","bright","highlight"])
      shell.style.setProperty("--wtw-id-"+k,colors[k]);
  };
  // next.js replaces the contents of #wtwNextgen on every navigation.
  // Observe only direct child replacement; theme attribute writes do not retrigger.
  new MutationObserver(apply).observe(shell,{childList:true});
  apply();
  fetch("/assets/identity/visual-themes-v1.json?v=20261113a",{credentials:"same-origin"})
    .then(r=>r.ok?r.json():Promise.reject(Error("Identity palette file unavailable")))
    .then(json=>{
      if(json?.schema!=="WTW_IDENTITY_THEMES_V1")return;
      registry=json;
      lastKey="";
      apply();
    })
    .catch(()=>{/* Keep source-independent, deterministic house themes. */});
}
if(typeof document!=="undefined"){
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",startThemes,{once:true});
  else startThemes();
}
