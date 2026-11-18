/**
 * Wire to Wire — V11 optional high-capacity fictional ownership labels.
 *
 * Generates additional owner-business candidates ONLY after the V10 1999
 * archival-context candidate pool has been tried. No historical organization
 * or real person is represented by a generated pairing. A surname used in a
 * business label is always the corresponding approved principal's surname,
 * or a supplied fictional source surname if no principal exists.
 *
 * The caller's shared organization registry owns name/root collision checks.
 * This pure module never issues IDs, modifies a save, or invents co-owners.
 */
import {regionalOrganizationNamingRoots}
 from './organization-naming-styles.mjs';

export const SCALABLE_OWNER_BUSINESS_NAME_MODEL=
 'WTW_FICTIONAL_OWNER_BUSINESS_CAPACITY_V11';
export const SCALABLE_OWNER_NAME_ATTEMPT_START=128;
export const SCALABLE_OWNER_NAME_ATTEMPT_LIMIT=3072;

// V11-only editorial locality vocabulary. It deliberately does not modify
// the historical ROOTS array used by the frozen V7/V10 opening generation.
// These are plausible *fictional business naming cues*, not claimed real
// farms, companies, archival ownership records, or founding dates.
const ADDITIONAL_ROOTS=Object.freeze({
 KENTUCKY:'Bluegrass Branch|Cane Run|Old Ferry|Clover Hollow|Millstone Creek|Bourbon Creek|Thoroughfare Hill|Spring Station|South Elkhorn|Cedar Run|Sinking Creek|Bridle Trace|White Ash|Horse Meadow|Limestone Run|Union Pasture|Hickory Fork|Clover Creek|Stone Lick|Rolling Meadow|Round Gate|Copper Hollow|Buckeye Spring|Shady Lick'.split('|'),
 FLORIDA:'Silver Palm|Sabalo Trace|Pine Flat|Calusa Bend|Sandy Pine|Orange Grove|Cypress Reach|Hammock Run|Longleaf Creek|Palmetto Creek|Royal Sabal|Fox Palm|Gulf Meadow|Pine Hammock|Oak Preserve|Citrus Grove|Sable Pine|Silver Prairie|Sawgrass Trace|Live Oak Meadow|Sun Hammock|Cedar Palmetto|Magnolia Hammock|Salt Meadow'.split('|'),
 CALIFORNIA:'Silver Arroyo|Rancho Vista|Sierra Gate|Canyon Mesa|Mission Valley|Coastal Oak|Los Robles|Granite Arroyo|Valley Sycamore|Adobe Creek|Sage Ridge|Rancho Prado|Canyon Vista|Rincon Ridge|Oak Arroyo|Loma Verde|Red Mesa|Sunset Oaks|Chaparro Creek|Silver Canyon|Coyote Mesa|Alta Canyon|West Arroyo|Golden Oak'.split('|'),
 NEW_YORK:'Upper Hudson|Orchard Vale|Maple Crossing|Glen Creek|Stone Orchard|Saratoga Hollow|Northern Orchard|Hudson Meadows|Mill Brook|Apple Knoll|River Orchard|Mohawk Ridge|Adirondack Vale|Briar Vale|Old Orchard Lane|North Hollow|Pine Orchard|Chestnut Knoll|Albany Ridge|White Meadow|Hudson Crossing|Copper Orchard|Upstate Meadow|Saratoga Brook'.split('|'),
 MID_ATLANTIC:'Potomac Meadow|Brandywine Creek|Old Chesapeake|Mason Hollow|Piedmont Creek|Wye Meadow|Catoctin Ridge|Laurel Brook|Hunting Vale|Sassafras Hill|Redstone Vale|Monocacy Hills|Chester Meadow|Blue Ridge Gate|Briar Chase|Stone Manor|Old Quaker|Susquehanna Meadow|Delaware Ridge|Potomac Gate|Chestnut Manor|Shenandoah Crossing|North Chesapeake|Three Mills'.split('|'),
 ONTARIO:'Maple Hollow|Blue Maple|Grand River Gate|Laurentian Meadows|Northern Willow|Cedar Crossing|Black Birch|Pine Glen|Maple Brook|Coldwater Glen|Caledon Grove|Silver Birch|Humber Meadow|Thornbury Vale|Grey Maple|Orchard Birch|Glen River|East Caledon|Pine Orchard|Maple Landing|Oak Crossing|Northern Meadow|Laurentian Ridge|Willow Landing'.split('|'),
 LOUISIANA:'Acadian Oaks|Old Cypress|Bayou Cedar|Pecan Hollow|Red Cypress|Mossy Levee|Sabine Oak|River Cane|Magnolia Bayou|Bayou River|Old Acadian|Cypress Grove|Pecan Trace|Southern Levee|Black Bayou|Live Oak Parish|Red Willow|Bayou Meadow|Spanish Oak|Cane Parish|Blue Magnolia|River Pecan|Tangle Bayou|Cypress Landing'.split('|'),
 BRITAIN_IRELAND:'West Grange|Ashleigh Park|Bracken Lodge|Old Rectory|Meadow Court|Glenbrook House|Ballygreen|Kilmore Park|Ashford Lodge|Oakfield House|Glenmara|White Chapel|Moorland Vale|Rathfield|Clover Court|Stone Yard|Birch Hall|North Grange|Woodend Lodge|Bracken Hill|Lower Wicklow|Cedar Grange|Ashlawn|Old Paddock'.split('|'),
 GENERAL_NORTH_AMERICA:'Round Cedar|North Brook|Long Hollow|Twin Pines|Old Gatehouse|White Fence Ridge|Cedar Crossing|Copper Field|Meadow Fork|River Crest|Pine Meadow|Three Willows|Old Mill Road|Sage Valley|Stone Hollow|Oak Branch|Red Cedar|South Ridge|Timber Creek|Shady Pasture|Willow Pasture|Blue Meadow|Round Mill|Spring Hollow'.split('|')
});
const OWNER_V11_ROOTS=Object.freeze(Object.fromEntries(
 Object.entries(ADDITIONAL_ROOTS).map(([region,extra])=>[
  region,Object.freeze([...new Set([...regionalOrganizationNamingRoots(region),...extra])])
 ])
));
export function scalableOwnerNamingRoots(region){
 return OWNER_V11_ROOTS[region]||OWNER_V11_ROOTS.GENERAL_NORTH_AMERICA;
}

function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const ch of String(key)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;
 return h>>>0;
}
function surname(name){
 const s=String(name||'').trim().replace(/^(?:Dr|Mr|Mrs|Ms)\.\s*/i,'')
  .replace(/\s+(?:Jr\.?|Sr\.?|II|III|IV)$/i,'');
 return s.split(/\s+/).at(-1)||'';
}
/**
 * Keep a family-linked business human-readable in an actual 1999 directory.
 * Combinations use period-appropriate racing terminology and regional place
 * roots. We do not append artificial serial numbers, invented "Co-owner"
 * people, or repeated template fragments just to bypass a collision check.
 */
export function proposeScalable1999OwnerBusinessName({
 seed,index,attempt,principalName='',primarySurname='',region='GENERAL_NORTH_AMERICA',
 surnames=[]
}={}){
 if(!Number.isSafeInteger(seed)||seed<1||!Number.isInteger(index)||index<0||
  !Number.isInteger(attempt)||attempt<SCALABLE_OWNER_NAME_ATTEMPT_START||
  !Array.isArray(surnames))
  throw Error('Invalid scalable ownership-name candidate request');
 const pool=scalableOwnerNamingRoots(region);
 if(!pool.length)throw Error('Missing ownership naming region');
 const full=String(principalName||'').replace(/^(?:Dr|Mr|Mrs|Ms)\.\s*/i,'')
  .replace(/\s+/g,' ').trim();
 const defaultSurname=surnames.length?
  String(surnames[hash(seed,'v11-owner-source-family:'+index)%surnames.length]):'';
 const family=String(primarySurname||'').trim()||surname(full)||defaultSurname;
 if(!family)throw Error('Ownership candidate requires a principal or approved surname pool');
 const salt='v11-owner:'+index+':'+attempt;
 const root=pool[hash(seed,salt+':regional-root')%pool.length];
 const pattern=hash(seed,salt+':business-style')%8;
 // Later career generations protect every prior owner name. At a large
 // roster size the original one-root templates can be genuinely exhausted,
 // even with 3,072 attempts. Expand deterministically into geographic
 // directional qualifiers and only then two distinct locality anchors.
 // Neither form uses synthetic serial numbers, false partners or horse IDs.
 if(attempt>=640){
  const directions=['North','South','East','West','Upper','Lower','High',
   'Little','New','Old','Far','Inner','Outer','Western','Eastern'];
  const directional=directions[hash(seed,salt+':direction')%directions.length];
  const place=directional+' '+root;
  if(attempt<1792){
   if(pattern===0&&full)return full+' '+place+' Racing';
   if(pattern===1)return family+' '+place+' Thoroughbreds';
   if(pattern===2)return place+' '+family+' Stable';
   if(pattern===3)return family+' '+place+' Bloodstock';
   if(pattern===4&&full)return full+' '+place+' Stable';
   if(pattern===5)return place+' '+family+' Racing';
   if(pattern===6)return family+' '+place+' Racing Stable';
   return place+' '+family+' Stables';
  }
  const other=pool[hash(seed,salt+':second-locality')%pool.length];
  const pair=other===root?place:root+' '+other;
  if(pattern===0&&full)return full+' '+pair+' Racing';
  if(pattern===1)return pair+' '+family+' Thoroughbreds';
  if(pattern===2)return family+' '+pair+' Stables';
  if(pattern===3)return pair+' '+family+' Bloodstock';
  if(pattern===4&&full)return full+' '+pair+' Stables';
  if(pattern===5)return family+' '+pair+' Racing';
  if(pattern===6)return pair+' '+family+' Racing Stable';
  return family+' '+pair+' Stable';
 }
 if(pattern===0&&full)return full+' '+root+' Racing';
 if(pattern===1)return family+' '+root+' Thoroughbreds';
 if(pattern===2)return root+' '+family+' Stables';
 if(pattern===3)return family+' '+root+' Bloodstock';
 if(pattern===4&&full)return root+' '+full+' Stable';
 if(pattern===5)return family+' '+root+' Racing';
 if(pattern===6&&full)return full+' '+root+' Stables';
 return family+' '+root+' Racing Stable';
}
