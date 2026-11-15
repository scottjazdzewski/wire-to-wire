/**
 * Owner-approved extension to the protected 1999 track identity set.
 * All new meetings and feature races are game-modeled; no historical results
 * or officially graded stakes are asserted by this module.
 */
export const ARCHIVED_TRACK_IDS_1999=Object.freeze([
 'T-0033','T-0103','T-0104','T-0105','T-0107','T-0108','T-0109',
 'T-0110','T-0111','T-0113','T-0114','T-0116','T-0117','T-0118'
]);

export const APPROVED_TRACK_PRESENTATION_1999=Object.freeze({
 'T-0061':Object.freeze({name:'Comanche Raceway',sourceName:'Sunland Park',
  region:'Mountain / Southwest',circuit:'New Mexico / Southwest',
  sourceIdentityPreserved:true,sourceRecordsPreserved:true,
  metroOrSubregion:'El Paso–Las Cruces metropolitan region',
  wtwFeatureNames:Object.freeze(['Comanche Desert Classic','Comanche Holiday Handicap'])}),
 'T-0075':Object.freeze({name:'San Mateo County Fair',sourceName:'San Mateo',
  region:'Northern / Central California',circuit:'California Fair Circuit',
  metroOrSubregion:'San Francisco Peninsula',physicalTrackId:'T-0032',
  venueType:'FAIR_MEETING_AT_EXISTING_TRACK',
  physicalFacilityStatus:'SHARED_BAY_MEADOWS_FACILITY'}),
 'T-0106':Object.freeze({dayPattern:Object.freeze([0,4,5,6]),
  specialDates:Object.freeze(['1999-09-06']),raceDays:48,
  raceDayNote:'47 regular Thu–Sun dates plus the special Monday Labor Day card'})
});

const program=(record)=>Object.freeze({
 id:record.id,name:record.name,sourceName:record.sourceName||record.name,
 surfaces:record.surfaces,meets:Object.freeze(record.meets.map(x=>Object.freeze([...x]))),
 meetWindow:record.meetWindow,raceDays:String(record.raceDays),
 preferredDays:record.preferredDays,dayPattern:Object.freeze([...record.dayPattern]),
 basis:record.basis,sourceUrl:null,stakesIds:Object.freeze([]),
 stakesDates:Object.freeze([]),trackOperating:'OPEN_1999',
 surfaceStatus:'WTW_GAME_MODELED_COURSE_SPECIFICATION',calendarExceptions:null,
 playableIn1999:true,region:record.region,circuit:record.circuit,
 locality:record.locality,state:record.state,country:'USA',
 metroOrSubregion:record.metroOrSubregion,
 facilityModelStatus:'GENERATED_PER_CAREER_FROM_TRACK_PROFILE',
 ...(record.realWorldClosure?{realWorldClosure:record.realWorldClosure}:{}),
 ...(record.sourceIdentityPreserved?{sourceIdentityPreserved:true}:{}),
 ...(record.stakesProgram?{stakesProgram:record.stakesProgram}:{}),
 ...(record.classification?{classification:record.classification}:{}),
 ...(record.gameTier?{gameTier:record.gameTier}:{}),
 ...(record.wtwFeatureNames?{wtwFeatureNames:Object.freeze([...record.wtwFeatureNames])}:{}),
 ...(record.physicalTrackId?{physicalTrackId:record.physicalTrackId}:{}),
 ...(record.venueType?{venueType:record.venueType}:{}),
 ...(record.physicalFacilityStatus?{physicalFacilityStatus:record.physicalFacilityStatus}:{})
});

export const APPROVED_NEW_TRACK_PROGRAMS_1999=Object.freeze([
 program({id:'T-0119',name:'Bluff City Downs',locality:'Memphis / Collierville',
  state:'Tennessee',metroOrSubregion:'Memphis / Collierville Metro',
  region:'Mississippi Valley',circuit:'Mississippi Valley',surfaces:'Dirt · Turf',
  meets:[['03-05','05-30'],['09-03','11-28']],
  meetWindow:'Mar 5–May 30; Sep 3–Nov 28',raceDays:78,
  preferredDays:'Fri–Sun',dayPattern:[0,5,6],basis:'WTW_FICTIONAL_GAME_MODELED',
  classification:'MAJOR_MISSISSIPPI_VALLEY',gameTier:'MAJOR',stakesProgram:'MAJOR_LOCAL_STAKES',
  wtwFeatureNames:['Bluff City Cup','Mid-South Autumn Classic']}),
 program({id:'T-0120',name:'Lowcountry Racecourse',locality:'Charleston / Johns Island',
  state:'South Carolina',metroOrSubregion:'Charleston / Johns Island',
  region:'South Carolina Lowcountry',circuit:'Coastal Carolinas',surfaces:'Turf · Dirt',
  meets:[['02-18','05-23']],meetWindow:'Feb 18–May 23',raceDays:56,
  preferredDays:'Thu–Sun',dayPattern:[0,4,5,6],basis:'WTW_FICTIONAL_GAME_MODELED',
  classification:'PRESTIGIOUS_SPRING_TURF',gameTier:'MAJOR',stakesProgram:'PRESTIGIOUS_SPRING_LOCAL_STAKES',
  wtwFeatureNames:['Lowcountry Turf Classic']}),
 program({id:'T-0121',name:'Live Oak Park',locality:'Savannah / Pooler',
  state:'Georgia',metroOrSubregion:'Savannah / Pooler',region:'Coastal Georgia',
  circuit:'Coastal Georgia',surfaces:'Dirt · Turf',meets:[['09-02','11-14']],
  meetWindow:'Sep 2–Nov 14',raceDays:44,preferredDays:'Thu–Sun',
  dayPattern:[0,4,5,6],basis:'WTW_FICTIONAL_GAME_MODELED',
  classification:'COASTAL_REGIONAL',gameTier:'REGIONAL',stakesProgram:'REGIONAL_AUTUMN_STAKES',
  wtwFeatureNames:['Live Oak Coastal Classic']}),
 program({id:'T-0122',name:'Sioux Plains',locality:'Fargo / West Fargo',state:'North Dakota',
  metroOrSubregion:'Fargo / West Fargo',region:'Northern Plains',
  circuit:'Northern Plains',surfaces:'Dirt',meets:[['06-11','08-15']],
  meetWindow:'Jun 11–Aug 15',raceDays:30,preferredDays:'Fri–Sun',
  dayPattern:[0,5,6],basis:'WTW_FICTIONAL_GAME_MODELED',
  classification:'REGIONAL_CLAIMING_MAIDEN_ALLOWANCE',gameTier:'LOCAL',
  stakesProgram:'LIMITED_REGIONAL_STAKES',
  wtwFeatureNames:['Sioux Plains Prairie Cup']}),
 program({id:'T-0123',name:'Bitterroot Downs',locality:'Missoula / Lolo',state:'Montana',
  metroOrSubregion:'Missoula / Lolo',region:'Montana Mountain Region',
  circuit:'Northern Rockies',surfaces:'Dirt',meets:[['06-25','08-29']],
  meetWindow:'Jun 25–Aug 29',raceDays:30,preferredDays:'Fri–Sun',
  dayPattern:[0,5,6],basis:'WTW_FICTIONAL_GAME_MODELED',
  classification:'MOUNTAIN_REGIONAL_HORSEMEN_CIRCUIT',gameTier:'LOCAL',
  stakesProgram:'LIMITED_REGIONAL_STAKES',
  wtwFeatureNames:['Bitterroot Mountain Classic']}),
 program({id:'T-0124',name:'Playfair Race Course',locality:'Spokane',state:'Washington',
  metroOrSubregion:'Spokane',region:'Pacific Northwest',circuit:'Pacific Northwest',
  surfaces:'Dirt',meets:[['05-07','09-26']],meetWindow:'May 7–Sep 26',raceDays:63,
  preferredDays:'Fri–Sun',dayPattern:[0,5,6],
  basis:'WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION',
  realWorldClosure:'CLOSED_BEFORE_1999',sourceIdentityPreserved:true,
  classification:'HISTORIC_TRACK_ALT_HISTORY',gameTier:'REVIVAL',stakesProgram:'MODELED_PLAYFAIR_STAKES',
  wtwFeatureNames:['Playfair Spokane Mile','Playfair Inland Northwest Handicap']})
]);

export const APPROVED_NEW_TRACK_IDS_1999=Object.freeze(
 APPROVED_NEW_TRACK_PROGRAMS_1999.map(t=>t.id));
