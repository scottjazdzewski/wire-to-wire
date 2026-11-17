/**
 * Physical venue identity is separate from meeting identity.
 * T-0075 (San Mateo County Fair) uses T-0032 (Bay Meadows).
 * Never create a facility or paid haul merely to change meet ID.
 */
import {trackPhysicalVenueId1999,trackProgram1999}
 from '../../next/1999-track-program.mjs';

export function same1999PhysicalVenue(leftTrackId,rightTrackId){
 if(typeof leftTrackId!=='string'||typeof rightTrackId!=='string')return false;
 // Preserve original same-ID location semantics for future generated worlds
 // that have not been assigned one of the fixed optional 1999 source IDs.
 if(leftTrackId===rightTrackId)return true;
 if(!trackProgram1999(leftTrackId)||!trackProgram1999(rightTrackId))return false;
 return trackPhysicalVenueId1999(leftTrackId)===trackPhysicalVenueId1999(rightTrackId);
}
