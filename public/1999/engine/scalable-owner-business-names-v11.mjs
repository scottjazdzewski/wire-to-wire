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
 const pool=regionalOrganizationNamingRoots(region);
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
 if(pattern===0&&full)return full+' '+root+' Racing';
 if(pattern===1)return family+' '+root+' Thoroughbreds';
 if(pattern===2)return root+' '+family+' Stables';
 if(pattern===3)return family+' '+root+' Bloodstock';
 if(pattern===4&&full)return root+' '+full+' Stable';
 if(pattern===5)return family+' '+root+' Racing';
 if(pattern===6&&full)return full+' '+root+' Stables';
 return family+' '+root+' Racing Stable';
}
