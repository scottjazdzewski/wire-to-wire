/* WTW January 1999 asset-only bridge.
   Connect only pre-approved, already published assets by immutable record ID.
   No image is inferred for generated horses, people, or venues. */
const PHOTO_INDEX='/assets/office/decision-photo-index.json';
const LOGO_INDEX='/assets/office/organization-logo-index.json';
const BADGE_ROOT='/assets/profile-badges/v2/wtw_badge_';
const badgeNames=Object.freeze({
 'full-horses':'horse','horses':'horse','owner-economy':'connections',
 'organizations':'connections','trainer-barns':'people','people':'people',
 'facilities':'farm_stable','auctions':'connections','conditions':'meet_schedule',
 'tracks':'track','calendar':'major_races','stallions':'pedigree',
 'broodmare-boarding':'pedigree','events':'history'
});
let photoIndex={},logoIndex={},loaded;
const validAsset=p=>typeof p==='string'&&/^\/assets\/[a-zA-Z0-9_/.\-]+\.(?:webp|png|jpg|jpeg|svg)$/.test(p)?p:'';
export function loadApprovedAssets(){
 if(!loaded)loaded=Promise.all([
  fetch(PHOTO_INDEX,{credentials:'same-origin'}).then(r=>r.ok?r.json():{}).catch(()=>({})),
  fetch(LOGO_INDEX,{credentials:'same-origin'}).then(r=>r.ok?r.json():{}).catch(()=>({}))
 ]).then(([photos,logos])=>{
  photoIndex=photos?.entities||{};logoIndex=logos?.organizations||{};
 }).catch(()=>{});
 return loaded;
}
function recordKind(record,tab){
 const id=String(record?.id||'');
 // IDs win over names, but simulated test IDs are not treated as historical identities.
 const sourceTabs=['horses','organizations','people','tracks','stallions','broodmare-boarding'];
 if(!sourceTabs.includes(tab))return '';
 if(id.startsWith('H-'))return 'horse';
 if(id.startsWith('P-'))return 'person';
 if(id.startsWith('T-'))return 'track';
 if(id.startsWith('O-'))return 'farm';
 return '';
}
export function approvedRecordImage(record,tab){
 const kind=recordKind(record,tab),id=record?.id;
 if(!kind||!id)return '';
 const photo=validAsset(photoIndex[kind+':'+id]);
 const logo=kind==='farm'?validAsset(logoIndex['organization:'+id]):'';
 // Ownership organizations use their identity marks; physical farms use location imagery.
 return (kind==='farm'&&tab==='organizations'?logo||photo:photo||logo)||'';
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function recordArt(record,tab,large=false){
 const url=approvedRecordImage(record,tab);
 if(!url)return '';
 return '<img class="wtw1999-approved-art '+(large?'large':'')+'" src="'+esc(url)+
 '" alt="'+esc(record.name||'')+' approved WTW identity artwork" loading="lazy" decoding="async" width="'+
 (large?'160':'56')+'" height="'+(large?'160':'56')+'"/>';
}
export function sectionBadge(tab){
 const name=badgeNames[tab];
 return name?'<img class="wtw1999-section-badge" src="'+BADGE_ROOT+name+
 '.png" alt="" aria-hidden="true" width="26" height="26" decoding="async"/>':'';
}
