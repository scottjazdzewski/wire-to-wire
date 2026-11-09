
(function(){
  const toast = document.getElementById('toast');
  const shell = document.getElementById('routeShell');
  const routeTitle = document.getElementById('routeTitle');
  const routeKicker = document.getElementById('routeKicker');
  const routeBody = document.getElementById('routeBody');
  const dateChip = document.querySelector('.dateChip');
  let officeDate = new Date('2014-07-15T12:00:00');
  let currentCase = 'powerline';
  let history = ['Office Overview'];
  let historyIndex = 0;
  const caseOrder = ['powerline','lastmatch','saratoga','pieta','cash','newsbuzz','entries','cedar'];
  const caseTitles = {
    powerline:'Powerline', lastmatch:'The Last Match', saratoga:'Saratoga catalog', pieta:'Pieta gallop-out',
    cash:'Monthly cash projection', newsbuzz:'Argosy colt buzz', entries:'Entries close Saturday', cedar:'Young horse turnout'
  };
  const caseHorseTarget = {
    powerline:'Powerline',
    lastmatch:'The Last Match',
    pieta:'Pieta',
    entries:'Powerline',
    newsbuzz:'Argosy colt',
    cedar:'Cedar Spoke group'
  };
  const horseCaseMap = {
    'Powerline':['powerline','entries'],
    'The Last Match':['lastmatch'],
    'Pieta':['pieta'],
    'Iron Harbor':[],
    'Bellarmine':[],
    'Hardtack':[],
    'Argosy colt':['newsbuzz'],
    'Cedar Spoke group':['cedar']
  };
  const personProfiles = {
    'Gabe Larkin':{job:'Stable staff',age:'—',birthplace:'—',location:'—',stable:['Powerline'],careerWins:'—',achievements:[]},
    'Anika Rowe':{job:'Stable staff',age:'—',birthplace:'—',location:'—',stable:['Pieta'],careerWins:'—',achievements:[]},
    'Alistair Dunleavy':{job:'Bloodstock',age:'—',birthplace:'—',location:'—',stable:[],careerWins:'—',achievements:[]}
  };
  const farmProfiles = {
    'Cedar Spoke':{type:'Farm',location:'—',owner:'—',connect:['Cedar Spoke group'],achievements:[]}
  };
  const trackProfiles = {
    'Belmont Park':{id:'T-0002',location:'Elmont, NY, USA',surfaces:'Dirt · Turf',circuit:'New York / Northeast',foundation:'Core Calendar',operating:'Open',competition:'Aggressive',meetWindow:'Apr 28–Jul 18; Sep 8–Oct 24',raceDays:'94',preferredDays:'Wed–Sun',weather:'Prime spring/autumn turf; summer heat is manageable, with storms and rain able to disrupt turf.',scheduleRisk:'Monmouth / Delaware overlap can thin secondary allowances.',stakes:[
      ['Belmont Stakes','Jun 5','WTW G1 / Classic','$1,000,000'],['Metropolitan Handicap','May 31','WTW G1','$600,000'],['Jockey Club Gold Cup','Oct 9','WTW G1','$750,000'],['Acorn Stakes','Jun 5','WTW G3','$275,000'],['Brooklyn Handicap','Jun 12','WTW G2','$375,000'],['New York Handicap','Jul 10','WTW G2','$425,000'],['Suburban Handicap','Jul 4','WTW G2','$425,000'],['Woodward Stakes','Sep 18','WTW G1','$625,000'],['Mother Goose Stakes','Jun 26','WTW G3','$325,000'],['Elmont Distaff Stakes','Sep 25','WTW G1','$500,000'],['Hempstead Turf Handicap','Jun 19','WTW G3','$275,000'],['Empire Mile Handicap','May 22','WTW G3','$275,000'],['Elmont Juvenile Turf Stakes','Oct 16','WTW G3','$300,000'],['Big Sandy Distaff Handicap','Jul 17','Major Stakes','$300,000']
    ]},
    'Churchill Downs':{id:'T-0013',location:'Louisville, KY, USA',surfaces:'Dirt · Turf',circuit:'Kentucky / Ohio Valley',foundation:'Core Calendar',operating:'Open',competition:'Aggressive',meetWindow:'Apr 29–Jul 4; Oct 31–Nov 25',raceDays:'69',preferredDays:'Wed–Sun',weather:'Spring and autumn are ideal; early-summer heat and storms are accepted, with strong turf in season.',scheduleRisk:'Cumberland can poach practical older horses while elite focus dominates.',stakes:[
      ['Kentucky Oaks','Apr 30','WTW G1 / Classic','$750,000'],['Kentucky Derby','May 1','WTW G1 / Classic','$1,250,000'],['Churchill Downs Handicap','May 1','WTW G2','$450,000'],['Kentucky Jockey Club Stakes','Nov 20','WTW G2','$425,000'],['Falls City Handicap','Nov 25','WTW G3','$325,000']
    ]},
    'Keeneland':{id:'T-0014',location:'Lexington, KY, USA',surfaces:'Dirt · Turf',circuit:'Kentucky / Ohio Valley',foundation:'Core Calendar',operating:'Open',competition:'Aggressive',meetWindow:'Apr 2–Apr 25; Oct 8–Oct 30',raceDays:'33',preferredDays:'Wed–Sun concentrated',weather:'Short boutique meets are timed to premium spring/autumn weather and turf quality.',scheduleRisk:'A small meet window makes rain or cold clusters disproportionately costly.',stakes:[
      ['Blue Grass Stakes','Apr 10','WTW G1','$750,000'],['Commonwealth Stakes','Apr 17','WTW G3','$325,000'],['Lexington Stakes','Apr 24','WTW G3','$325,000'],['Queen Elizabeth II Challenge Cup','Oct 16','WTW G2','$500,000'],['Fayette Handicap','Oct 30','WTW G3','$350,000']
    ]},
    'Saratoga':{id:'T-0003',location:'Saratoga Springs, NY, USA',surfaces:'Dirt · Turf',circuit:'New York / Northeast',foundation:'Core Calendar',operating:'Open',competition:'Aggressive',meetWindow:'Jul 21–Sep 6',raceDays:'36',preferredDays:'Wed–Mon concentrated',weather:'The Northeast summer destination window supports a dense schedule; heat and storm days remain possible.',scheduleRisk:'Overrecruitment can weaken Belmont autumn and regional fields.',stakes:[
      ['Diana Handicap','Jul 31','WTW G3','$375,000'],['Whitney Handicap','Aug 7','WTW G1','$700,000'],['Test Stakes','Aug 7','WTW G3','$375,000'],['Alabama Stakes','Aug 21','WTW G1','$500,000'],['Lake Placid Stakes','Aug 22','WTW G2','$500,000'],['Travers Stakes','Aug 28','WTW G1','$750,000'],['Saratoga F&M Handicap','Aug 29','Regional Stakes','$225,000'],['Hopeful Stakes','Sep 4','WTW G1','$400,000']
    ]}
  };
  const horseProfileFacts = {
    'Powerline':{age:'—',born:'—',sex:'—',earnings:'—',record:{starts:'—',wins:'—',seconds:'—',thirds:'—'},pedigree:{sire:'—',grandsire:'—',granddam:'—',dam:'—',damsire:'—',secondDam:'—'},connections:{owner:'—',trainer:'—',jockey:'—',breeder:'—',contact:'Gabe Larkin'},achievements:[]},
    'The Last Match':{age:'—',born:'—',sex:'—',earnings:'—',record:{starts:'—',wins:'—',seconds:'—',thirds:'—'},pedigree:{sire:'—',grandsire:'—',granddam:'—',dam:'—',damsire:'—',secondDam:'—'},connections:{owner:'—',trainer:'—',jockey:'—',breeder:'—',contact:'Harrow & Pike Vet'},achievements:[]},
    'Iron Harbor':{age:'—',born:'—',sex:'—',earnings:'—',record:{starts:'—',wins:'—',seconds:'—',thirds:'—'},pedigree:{sire:'—',grandsire:'—',granddam:'—',dam:'—',damsire:'—',secondDam:'—'},connections:{owner:'—',trainer:'—',jockey:'—',breeder:'—',contact:'—'},achievements:[]},
    'Pieta':{age:'2',born:'—',sex:'—',earnings:'—',record:{starts:'—',wins:'—',seconds:'—',thirds:'—'},pedigree:{sire:'—',grandsire:'—',granddam:'—',dam:'—',damsire:'—',secondDam:'—'},connections:{owner:'—',trainer:'—',jockey:'—',breeder:'—',contact:'Anika Rowe'},achievements:[]},
    'Bellarmine':{age:'—',born:'—',sex:'—',earnings:'—',record:{starts:'—',wins:'—',seconds:'—',thirds:'—'},pedigree:{sire:'—',grandsire:'—',granddam:'—',dam:'—',damsire:'—',secondDam:'—'},connections:{owner:'—',trainer:'—',jockey:'—',breeder:'—',contact:'—'},achievements:[]},
    'Hardtack':{age:'—',born:'—',sex:'—',earnings:'—',record:{starts:'—',wins:'—',seconds:'—',thirds:'—'},pedigree:{sire:'—',grandsire:'—',granddam:'—',dam:'—',damsire:'—',secondDam:'—'},connections:{owner:'—',trainer:'—',jockey:'—',breeder:'—',contact:'—'},achievements:[]},
    'Argosy colt':{age:'—',born:'—',sex:'Colt',earnings:'—',record:{starts:'—',wins:'—',seconds:'—',thirds:'—'},pedigree:{sire:'—',grandsire:'—',granddam:'—',dam:'—',damsire:'—',secondDam:'—'},connections:{owner:'—',trainer:'—',jockey:'—',breeder:'—',contact:'News Desk'},achievements:[]},
    'Cedar Spoke group':{age:'Young horses',born:'—',sex:'Mixed',earnings:'—',record:{starts:'—',wins:'—',seconds:'—',thirds:'—'},pedigree:{sire:'—',grandsire:'—',granddam:'—',dam:'—',damsire:'—',secondDam:'—'},connections:{owner:'—',trainer:'—',jockey:'—',breeder:'Cedar Spoke',contact:'Cedar Spoke'},achievements:[]}
  };
  const pageCopy = {
    Stable:['Stable','Barn command page','Roster, health, training notes, current form, owner pressure, and active horse files.'],
    'Race Calendar':['Race Calendar','Entries and race targets','Daily cards, stable entries, target races, deadlines, scratches, and race-day flow.'],
    Sales:['Sales','Auction and private-market office','Watchlists, inspection notes, max bids, vet flags, and buyer pressure.'],
    World:['World','Racing-world map','Rival barns, meets, market pressure, standings, public narratives, and national storylines.'],
    News:['News','Full news desk','Longer news feed, media stories, rumors, race previews, and world events.'],
    HorseProfile:['Horse Profile','Horse file shell','Pedigree, connections, condition, workouts, race record, notes, and decisions.'],
    Opportunity:['Opportunity Board','Opportunity file','Offers, claim ideas, sales leads, favors, and business/racing opportunities.']
  };

  const decisionOutcomes = {"powerline":[{"immediate":"Powerline is entered for Saturday; the barn shifts into race-prep mode.","reaction":"The owner likes the intent. Gabe stays watchful about the colt getting too keen early.","followUp":"Final pre-race check and rider instructions.","dueDays":2,"affected":"Powerline / Gabe Larkin","destination":"Horse Profile","effects":[{"bucket":"horseState","id":"Powerline","key":"status","value":"Entered Saturday maiden"},{"bucket":"calendarState","id":"Powerline","key":"race_target","value":"Saturday maiden"},{"bucket":"ownerState","id":"Powerline ownership","key":"patience","delta":1},{"bucket":"staffState","id":"Gabe Larkin","key":"trust","delta":0},{"bucket":"horseState","id":"Powerline","key":"confidence","delta":0}]},{"immediate":"The entry is held while Powerline gets one more controlled work.","reaction":"Gabe appreciates the extra read. The owner accepts the delay but wants a clear answer after the work.","followUp":"Review the next work and decide whether to enter.","dueDays":3,"affected":"Powerline / Gabe Larkin","destination":"Horse Profile","effects":[{"bucket":"horseState","id":"Powerline","key":"status","value":"One more work requested"},{"bucket":"calendarState","id":"Powerline","key":"race_target","value":"Pending next work"},{"bucket":"staffState","id":"Gabe Larkin","key":"trust","delta":1},{"bucket":"ownerState","id":"Powerline ownership","key":"patience","delta":-1},{"bucket":"horseState","id":"Powerline","key":"confidence","delta":1}]},{"immediate":"Saturday is passed and the office begins looking for a cleaner first-race setup.","reaction":"The barn is comfortable protecting the lesson. Ownership is patient, but only if the next target is concrete.","followUp":"Shortlist the next two maiden options.","dueDays":4,"affected":"Powerline","destination":"Race Calendar","effects":[{"bucket":"horseState","id":"Powerline","key":"status","value":"Waiting for softer debut spot"},{"bucket":"calendarState","id":"Powerline","key":"race_target","value":"Alternate maiden target"},{"bucket":"ownerState","id":"Powerline ownership","key":"patience","delta":-1},{"bucket":"horseState","id":"Powerline","key":"confidence","delta":1}]}],"lastmatch":[{"immediate":"The Last Match is limited to a light jog and will be checked again before harder training.","reaction":"The vet team is comfortable with movement and monitoring. The trainer loses no useful schedule time today.","followUp":"Re-check filling after the jog and again tomorrow morning.","dueDays":1,"affected":"The Last Match / Harrow & Pike Vet","destination":"Horse Profile","effects":[{"bucket":"horseState","id":"The Last Match","key":"status","value":"Light jog only"},{"bucket":"horseState","id":"The Last Match","key":"soundness_risk","delta":-1},{"bucket":"horseState","id":"The Last Match","key":"vet_flag","value":"Monitor filling"},{"bucket":"staffState","id":"Trainer","key":"trust","delta":1}]},{"immediate":"Training is paused long enough to scan the area and get a firmer medical read.","reaction":"The vet likes the conservative call. The trainer accepts the interruption because uncertainty comes off the board.","followUp":"Review scan result before the next work is assigned.","dueDays":0,"affected":"The Last Match / Harrow & Pike Vet","destination":"Horse Profile","effects":[{"bucket":"horseState","id":"The Last Match","key":"status","value":"Diagnostic scan ordered"},{"bucket":"horseState","id":"The Last Match","key":"vet_flag","value":"Scan pending"},{"bucket":"horseState","id":"The Last Match","key":"soundness_risk","delta":-1},{"bucket":"finances","id":"stable","key":"medical_spend","delta":1}]},{"immediate":"The Last Match stays on the original training schedule with added observation after work.","reaction":"The trainer keeps momentum, but the vet wants the leg watched closely for any change.","followUp":"Mandatory post-work leg check.","dueDays":1,"affected":"The Last Match","destination":"Horse Profile","effects":[{"bucket":"horseState","id":"The Last Match","key":"status","value":"Training as planned"},{"bucket":"horseState","id":"The Last Match","key":"fitness","delta":1},{"bucket":"horseState","id":"The Last Match","key":"soundness_risk","delta":1},{"bucket":"staffState","id":"Harrow & Pike Vet","key":"trust","delta":-1}]}],"saratoga":[{"immediate":"The three hips stay live while the team completes physical inspections before setting a buying stance.","reaction":"Bloodstock likes the discipline; the farm office wants clean notes before any money is committed.","followUp":"Inspection notes and physical grades return to the office.","dueDays":1,"affected":"Saratoga shortlist / Alistair Dunleavy","destination":"Sales","effects":[{"bucket":"scoutingState","id":"Saratoga","key":"interest","delta":1},{"bucket":"scoutingState","id":"Saratoga","key":"status","value":"Physical inspection underway"},{"bucket":"finances","id":"stable","key":"scouting_spend","delta":1}]},{"immediate":"Hard ceilings are placed on all three hips before the ring opens.","reaction":"The finance side is relieved. Bloodstock can still bid, but emotion cannot move the number.","followUp":"Reconfirm ceilings after final vet notes.","dueDays":1,"affected":"Saratoga shortlist","destination":"Sales","effects":[{"bucket":"scoutingState","id":"Saratoga","key":"status","value":"Bid ceilings locked"},{"bucket":"finances","id":"stable","key":"discipline","delta":1},{"bucket":"staffState","id":"Alistair Dunleavy","key":"trust","delta":1}]},{"immediate":"The stable passes on the current buying push and keeps cash available for later opportunities.","reaction":"The finance desk approves. Bloodstock is disappointed but keeps the three profiles on file.","followUp":"Revisit only if a horse is unexpectedly still available after the session.","dueDays":2,"affected":"Saratoga shortlist","destination":"Sales","effects":[{"bucket":"scoutingState","id":"Saratoga","key":"status","value":"Passed for now"},{"bucket":"finances","id":"stable","key":"cash_flexibility","delta":1},{"bucket":"staffState","id":"Alistair Dunleavy","key":"trust","delta":0}]}],"pieta":[{"immediate":"Pieta moves one step forward in the breeze plan without changing the broader timetable.","reaction":"Anika likes the progress but keeps the instruction simple: forward, not fast.","followUp":"Evaluate how Pieta finishes the next breeze.","dueDays":3,"affected":"Pieta / Anika Rowe","destination":"Horse Profile","effects":[{"bucket":"horseState","id":"Pieta","key":"status","value":"Breeze plan advanced"},{"bucket":"horseState","id":"Pieta","key":"fitness","delta":1},{"bucket":"staffState","id":"Anika Rowe","key":"trust","delta":1}]},{"immediate":"Pieta stays on the current rhythm and no new pressure is added.","reaction":"The barn is comfortable letting confidence keep building. No one is forcing a date.","followUp":"Routine progress report after the next gallop-out.","dueDays":4,"affected":"Pieta","destination":"Horse Profile","effects":[{"bucket":"horseState","id":"Pieta","key":"status","value":"Holding current training rhythm"},{"bucket":"horseState","id":"Pieta","key":"confidence","delta":1},{"bucket":"calendarState","id":"Pieta","key":"race_target","value":"No forced target"}]},{"immediate":"Pieta gets a gate-school session before the next speed step.","reaction":"The staff likes addressing manners while she is mentally improving rather than waiting for a problem.","followUp":"Gate report and rider feedback.","dueDays":2,"affected":"Pieta / Anika Rowe","destination":"Horse Profile","effects":[{"bucket":"horseState","id":"Pieta","key":"status","value":"Gate school added"},{"bucket":"horseState","id":"Pieta","key":"confidence","delta":1},{"bucket":"staffState","id":"Anika Rowe","key":"trust","delta":1}]}],"cash":[{"immediate":"Normal operating spend remains approved; the barn can continue routine purchases and shipping.","reaction":"Department leads get predictability. The finance desk will still watch the small-cost drift.","followUp":"Review the next monthly projection for expense creep.","dueDays":14,"affected":"Stable operations / Farm Desk","destination":"Sales","effects":[{"bucket":"finances","id":"stable","key":"status","value":"Normal spend approved"},{"bucket":"staffState","id":"Barn staff","key":"trust","delta":1}]},{"immediate":"Nonessential purchases are paused while core racing and care expenses remain open.","reaction":"Finance likes the cushion. Some staff requests will wait, which creates mild friction but no operational stop.","followUp":"Review paused requests before the next sales decision.","dueDays":7,"affected":"Stable operations","destination":"Sales","effects":[{"bucket":"finances","id":"stable","key":"status","value":"Extras frozen"},{"bucket":"finances","id":"stable","key":"cash_flexibility","delta":1},{"bucket":"staffState","id":"Barn staff","key":"trust","delta":-1}]},{"immediate":"No spending rule changes yet; the office opens the ledger for a line-by-line review.","reaction":"The farm desk welcomes the audit because it separates normal costs from real drift.","followUp":"Ledger review with shipping, vet, and sales costs isolated.","dueDays":1,"affected":"Farm Desk","destination":"Sales","effects":[{"bucket":"finances","id":"stable","key":"status","value":"Ledger audit open"},{"bucket":"finances","id":"stable","key":"discipline","delta":1}]}],"newsbuzz":[{"immediate":"The full Argosy item is opened and added to the office context without changing the barn plan.","reaction":"Ownership gets the information it wanted. The racing staff is glad the headline is not driving a training call.","followUp":"News desk summary after the colt's next public appearance.","dueDays":5,"affected":"Argosy colt / News Desk","destination":"News","effects":[{"bucket":"scoutingState","id":"Argosy colt","key":"interest","delta":1},{"bucket":"scoutingState","id":"Argosy colt","key":"status","value":"News file opened"}]},{"immediate":"The Argosy colt is placed on a rival watchlist for race, work, and market updates.","reaction":"The scouting side likes having a formal eye on him; the barn keeps its own program unchanged.","followUp":"Rival watch update after his next work or entry.","dueDays":4,"affected":"Argosy colt","destination":"News","effects":[{"bucket":"scoutingState","id":"Argosy colt","key":"interest","delta":2},{"bucket":"scoutingState","id":"Argosy colt","key":"status","value":"Active rival watch"}]},{"immediate":"The headline is dismissed from the active desk and the stable makes no tactical change.","reaction":"The racing staff appreciates the restraint. Ownership may ask again if the story grows.","followUp":"No scheduled action; reopen only if the story gains substance.","dueDays":null,"affected":"Stable office","destination":"News","effects":[{"bucket":"scoutingState","id":"Argosy colt","key":"status","value":"Not actively tracked"},{"bucket":"ownerState","id":"Stable ownership","key":"patience","delta":0}]}],"entries":[{"immediate":"The Churchill R3 entry is filed before the window closes.","reaction":"The office gets certainty. The trainer accepts the commitment but still wants the final behavior read handled in prep.","followUp":"Confirm draw, rider, and final barn check.","dueDays":1,"affected":"Churchill R3 entry","destination":"Race Calendar","effects":[{"bucket":"calendarState","id":"Churchill R3","key":"status","value":"Entered"},{"bucket":"calendarState","id":"Churchill R3","key":"race_target","value":"Locked"},{"bucket":"ownerState","id":"Stable ownership","key":"patience","delta":1}]},{"immediate":"The entry decision is held briefly while the trainer gives a final behavior and readiness read.","reaction":"The trainer values being asked before the deadline. The office now has less time to pivot.","followUp":"Trainer call must be closed before entries lock.","dueDays":0,"affected":"Trainer / Churchill R3","destination":"Race Calendar","effects":[{"bucket":"staffState","id":"Trainer","key":"trust","delta":1},{"bucket":"calendarState","id":"Churchill R3","key":"status","value":"Awaiting final trainer call"}]},{"immediate":"The office declines to lock Churchill R3 yet and opens alternate targets.","reaction":"The barn keeps flexibility, but the current usable field may disappear.","followUp":"Return a ranked alternate-race shortlist.","dueDays":1,"affected":"Race office","destination":"Race Calendar","effects":[{"bucket":"calendarState","id":"Churchill R3","key":"status","value":"Alternate search open"},{"bucket":"calendarState","id":"Churchill R3","key":"race_target","value":"Not committed"}]}],"cedar":[{"immediate":"The turnout note is acknowledged and the current young-horse plan remains in place.","reaction":"Cedar Spoke knows the office saw the report. No one feels a management change is being forced onto a healthy group.","followUp":"Routine young-horse report at the next scheduled update.","dueDays":7,"affected":"Cedar Spoke young group","destination":"Stable","effects":[{"bucket":"horseState","id":"Cedar Spoke group","key":"status","value":"Current turnout plan maintained"},{"bucket":"messageState","id":"cedar","key":"note","value":"Acknowledged"}]},{"immediate":"The immature horses move to quieter handling and a lower-tempo turnout routine.","reaction":"Farm staff agrees the change matches what they are seeing rather than treating it like a soundness issue.","followUp":"Compare behavior notes after two days of quieter handling.","dueDays":2,"affected":"Cedar Spoke young group","destination":"Stable","effects":[{"bucket":"horseState","id":"Cedar Spoke group","key":"status","value":"Quieter turnout handling"},{"bucket":"horseState","id":"Cedar Spoke group","key":"confidence","delta":1},{"bucket":"staffState","id":"Cedar Spoke staff","key":"trust","delta":1}]},{"immediate":"The office opens the full young-horse roster and reviews each development timeline before changing individual plans.","reaction":"Farm staff welcomes a broader look, but no horse is singled out until the review is complete.","followUp":"Roster review with any horse-specific adjustments flagged.","dueDays":2,"affected":"Cedar Spoke roster","destination":"Stable","effects":[{"bucket":"horseState","id":"Cedar Spoke group","key":"status","value":"Roster review open"},{"bucket":"staffState","id":"Cedar Spoke staff","key":"trust","delta":1}]}]};
  const STATE_KEY = 'wtwOfficeStateV30';
  function blankGameState(){
    return {
      version:'Office FM Track Profile Foundation v30',
      date:'2014-07-15',
      currentCase:'powerline',
      turn:0,
      resolvedCases:{},
      decisionLog:[],
      horseState:{},
      ownerState:{},
      staffState:{},
      calendarState:{},
      finances:{},
      scoutingState:{},
      messageState:{},
      followUps:[]
    };
  }
  let gameState = blankGameState();

  function currentGameDate(){
    const raw = dateChip ? dateChip.textContent.trim() : gameState.date;
    const m = raw.match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : (gameState.date || '2014-07-15');
  }
  function dueDate(days){
    if(days===null || days===undefined) return null;
    const d = new Date(currentGameDate() + 'T12:00:00');
    d.setDate(d.getDate() + Number(days || 0));
    return d.toISOString().slice(0,10);
  }
  function ensureBucket(bucket,id){
    if(!gameState[bucket] || typeof gameState[bucket] !== 'object') gameState[bucket] = {};
    if(!gameState[bucket][id] || typeof gameState[bucket][id] !== 'object') gameState[bucket][id] = {};
    return gameState[bucket][id];
  }
  function applyPrototypeEffects(effects){
    (effects || []).forEach(e=>{
      const target = ensureBucket(e.bucket, e.id || 'stable');
      if(Object.prototype.hasOwnProperty.call(e,'delta')) target[e.key] = Number(target[e.key] || 0) + Number(e.delta || 0);
      else target[e.key] = e.value;
    });
  }
  function persistState(silent=true){
    gameState.date = currentGameDate();
    gameState.currentCase = currentCase;
    localStorage.setItem(STATE_KEY, JSON.stringify(gameState));
    if(!silent) showToast('Saved Office state');
  }
  function processDueFollowUps(){
    const today = currentGameDate();
    let changed = false;
    (gameState.followUps || []).forEach(f=>{
      if(f && f.status === 'open' && f.dueDate && f.dueDate <= today){
        f.status = 'due';
        f.dueAt = f.dueAt || new Date().toISOString();
        const msgState = ensureBucket('messageState', f.caseId || 'unknown');
        msgState.followUpStatus = 'due';
        changed = true;
      }
    });
    return changed;
  }
  function compactStableStatus(name, state){
    const text = String((state && (state.status || state.vet_flag)) || '').toLowerCase();
    if(name==='Powerline'){
      if(text.includes('entered')) return 'In';
      if(text.includes('work')) return 'Work';
      if(text.includes('softer') || text.includes('wait')) return 'Wait';
    }
    if(name==='The Last Match'){
      if(text.includes('jog')) return 'Jog';
      if(text.includes('scan')) return 'Scan';
      if(text.includes('training')) return 'Watch';
    }
    if(name==='Pieta'){
      if(text.includes('advanced')) return 'Go';
      if(text.includes('holding')) return 'Hold';
      if(text.includes('gate')) return 'Gate';
    }
    return '';
  }
  function rememberText(el, key){
    if(!el) return '';
    if(!el.dataset[key]) el.dataset[key] = el.textContent.trim();
    return el.dataset[key];
  }
  function propagateOfficeState(){
    document.querySelectorAll('.fixture').forEach(row=>{
      const p = row.querySelector('p');
      if(!p) return;
      const base = rememberText(p, 'baseOfficeText');
      let full = '';
      const key = row.dataset.case;
      if(key==='powerline'){
        full = gameState.calendarState?.['Churchill R3']?.status || gameState.calendarState?.Powerline?.race_target || gameState.horseState?.Powerline?.status || '';
      } else if(key==='lastmatch'){
        full = gameState.horseState?.['The Last Match']?.status || '';
      } else if(key==='saratoga'){
        full = gameState.scoutingState?.Saratoga?.status || '';
      } else if(key==='cedar'){
        full = gameState.horseState?.['Cedar Spoke group']?.status || '';
      }
      p.textContent = full || base;
      row.classList.toggle('stateChanged', !!full);
      if(full) row.title = full;
      else row.removeAttribute('title');
    });

    document.querySelectorAll('.rankRow').forEach(row=>{
      const name = row.querySelector('strong')?.textContent.trim() || '';
      const statusCell = row.querySelector(':scope > span:last-child');
      if(!statusCell) return;
      const base = rememberText(statusCell, 'baseOfficeText');
      const state = gameState.horseState?.[name];
      const compact = compactStableStatus(name, state);
      statusCell.textContent = compact || base;
      row.classList.toggle('stateChanged', !!compact);
      if(compact && state){ row.title = state.status || state.vet_flag || compact; }
      else row.removeAttribute('title');
    });

    document.querySelectorAll('.oppItem').forEach(row=>{
      const p = row.querySelector('.oppText p');
      if(!p) return;
      const base = rememberText(p, 'baseOfficeText');
      let full = '';
      if(row.dataset.case==='powerline') full = gameState.calendarState?.Powerline?.race_target || gameState.horseState?.Powerline?.status || '';
      if(row.dataset.case==='saratoga') full = gameState.scoutingState?.Saratoga?.status || '';
      p.textContent = full || base;
      row.classList.toggle('stateChanged', !!full);
      if(full) row.title = full;
      else row.removeAttribute('title');
    });
  }
  function openFollowUp(id){
    const f = (gameState.followUps || []).find(x=>x && x.id===id);
    if(!f){ showToast('Follow-up no longer available'); return; }
    const resolved = gameState.resolvedCases?.[f.caseId];
    currentCase = f.caseId || currentCase;
    gameState.currentCase = currentCase;
    const original = resolved ? `${resolved.choiceTitle} — ${resolved.immediate}` : 'Original decision recorded.';
    openRoute('Follow-up Due', f.caseTitle || caseTitles[f.caseId] || 'Follow-up', `
      <section class="routeCard followUpCard"><h3>Follow-up due</h3><p>${f.text}</p><div class="routeRows">
        <div class="routeRow"><b>Due</b><span>${f.dueDate || currentGameDate()}</span></div>
        <div class="routeRow"><b>Original decision</b><span>${original}</span></div>
        <div class="routeRow"><b>Status</b><span>${f.status==='complete' ? 'Completed' : 'Needs review'}</span></div>
      </div><div class="routeActions">
        ${f.status==='complete' ? '' : `<button data-act="Acknowledge follow-up" data-followup-id="${f.id}">Acknowledge follow-up</button>`}
        <button class="alt" data-act="Open original decision" data-followup-id="${f.id}">Open original decision</button>
        <button class="alt" data-act="Office Overview">Back to Office</button>
      </div></section>`);
  }
  function completeFollowUp(id){
    const f = (gameState.followUps || []).find(x=>x && x.id===id);
    if(!f){ showToast('Follow-up no longer available'); return; }
    if(f.status!=='complete'){
      f.status = 'complete';
      f.completedDate = currentGameDate();
      f.completedAt = new Date().toISOString();
      const msgState = ensureBucket('messageState', f.caseId || 'unknown');
      msgState.followUpStatus = 'complete';
      msgState.followUpCompletedAt = f.completedAt;
    }
    syncResolvedMessages();
    propagateOfficeState();
    persistState(true);
    loadCase(f.caseId || currentCase, true);
    showToast('Follow-up completed');
  }
  function syncResolvedMessages(){
    document.querySelectorAll('.msg[data-case]').forEach(msg=>{
      const caseId = msg.dataset.case;
      const resolved = gameState.resolvedCases && gameState.resolvedCases[caseId];
      const due = (gameState.followUps || []).find(f=>f && f.caseId===caseId && f.status==='due');
      const time = msg.querySelector('.time');
      const meta = msg.querySelector('.meta');
      if(time && !time.dataset.originalTime) time.dataset.originalTime = time.textContent.trim();
      if(meta && !meta.dataset.originalMeta) meta.dataset.originalMeta = meta.textContent.trim();
      msg.classList.toggle('resolved', !!resolved);
      msg.classList.toggle('followupDue', !!due);
      if(due){
        msg.dataset.followupId = due.id;
        if(time) time.textContent = 'DUE';
        if(meta) meta.textContent = 'FOLLOW-UP DUE · ' + due.text;
        msg.setAttribute('title','Follow-up due: ' + due.text);
      } else {
        delete msg.dataset.followupId;
        if(time) time.textContent = resolved ? '✓ ' + time.dataset.originalTime : time.dataset.originalTime;
        if(meta) meta.textContent = meta.dataset.originalMeta || meta.textContent;
        if(resolved) msg.setAttribute('title','Resolved: ' + resolved.choiceTitle);
        else msg.removeAttribute('title');
      }
    });
  }
  function outcomeDestinationLabel(dest){
    if(dest==='Race Calendar') return 'Open Calendar';
    if(dest==='Horse Profile') return 'Open Horse';
    if(dest==='Sales') return 'Open Sales';
    if(dest==='News') return 'Open News';
    if(dest==='Stable') return 'Open Stable';
    return 'Open Detail';
  }
  function renderResolvedCase(caseId){
    const resolved = gameState.resolvedCases && gameState.resolvedCases[caseId];
    if(!resolved) return false;
    const grid = document.getElementById('moveGrid');
    const hint = document.getElementById('deskChoiceHint');
    if(!grid) return false;
    grid.innerHTML = `
      <article class="decisionOutcome">
        <div class="outcomeLead"><span>Resolved</span><strong>Decision Made</strong><b>${resolved.choiceTitle}</b></div>
        <div class="outcomeFacts">
          <div><small>Immediate Effect</small><p>${resolved.immediate}</p></div>
          <div><small>Barn Reaction</small><p>${resolved.reaction}</p></div>
          <div><small>Follow-up</small><p>${resolved.followUp}</p></div>
        </div>
        <div class="outcomeActions">
          <button data-act="Office Overview">Return to Office</button>
          <button class="alt" data-act="Open outcome destination" data-destination="${resolved.destination || ''}">${outcomeDestinationLabel(resolved.destination)}</button>
        </div>
      </article>`;
    if(hint) hint.textContent = 'Resolved · Decision Log';
    return true;
  }
  function renderDecisionLog(){
    const rows = (gameState.decisionLog || []).slice().reverse().map(entry=>`
      <div class="routeRow decisionLogRow">
        <b>${entry.gameDate} · ${entry.caseTitle}</b>
        <span>${entry.choiceTitle} — ${entry.immediate}${entry.followUpDate ? ' · Follow-up ' + entry.followUpDate : ''}</span>
      </div>`).join('') || '<div class="routeRow"><b>No decisions yet</b><span>Resolved choices will appear here.</span></div>';
    const follow = (gameState.followUps || []).filter(f=>f.status!=='complete').map(f=>`
      <div class="routeRow"><b>${f.status==='due' ? 'DUE' : (f.dueDate || 'Open')} · ${f.caseTitle}</b><span>${f.text} <button data-act="Open follow-up" data-followup-id="${f.id}">Open</button></span></div>`).join('') || '<div class="routeRow"><b>No open follow-ups</b><span>The desk is clear.</span></div>';
    openRoute('Decision Log','Decision Log',`
      <section class="routeCard"><h3>Resolved Decisions</h3><div class="routeRows">${rows}</div></section>
      <section class="routeCard"><h3>Open Follow-ups</h3><div class="routeRows">${follow}</div><div class="routeActions"><button data-act="Office Overview">Back to Office</button></div></section>`);
  }
  function resolveDecision(caseId, choiceIndex){
    const data = deskCases[caseId];
    const outcome = decisionOutcomes[caseId] && decisionOutcomes[caseId][choiceIndex];
    const move = data && data.moves && data.moves[choiceIndex];
    if(!data || !move || !outcome){ showToast('Decision could not be resolved'); return; }
    if(gameState.resolvedCases[caseId]){ renderResolvedCase(caseId); showToast('Already resolved'); return; }
    gameState.turn = Number(gameState.turn || 0) + 1;
    applyPrototypeEffects(outcome.effects);
    const followUpDate = dueDate(outcome.dueDays);
    const resolved = {
      caseId,
      caseTitle:data.title,
      choiceIndex,
      choiceTitle:move[0],
      gameDate:currentGameDate(),
      timestamp:new Date().toISOString(),
      turn:gameState.turn,
      immediate:outcome.immediate,
      reaction:outcome.reaction,
      followUp:outcome.followUp,
      followUpDate,
      affected:outcome.affected,
      destination:outcome.destination
    };
    gameState.resolvedCases[caseId] = resolved;
    gameState.messageState[caseId] = {status:'resolved', read:true, choice:move[0], resolvedAt:resolved.timestamp};
    gameState.decisionLog.push({
      gameDate:resolved.gameDate, caseId, caseTitle:data.title, choiceTitle:move[0],
      immediate:outcome.immediate, affected:outcome.affected, followUpDate, turn:resolved.turn
    });
    if(followUpDate){
      gameState.followUps.push({
        id:caseId + '-' + resolved.turn,
        caseId, caseTitle:data.title, text:outcome.followUp, dueDate:followUpDate, status:'open'
      });
    }
    processDueFollowUps();
    syncResolvedMessages();
    propagateOfficeState();
    renderResolvedCase(caseId);
    persistState(true);
    showToast('Decision recorded: ' + move[0]);
  }

  function showToast(msg){
    if(!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.__wtwToast);
    window.__wtwToast = setTimeout(()=>toast.classList.remove('show'), 1100);
  }
  // Dedicated browser page routing, not a pop-out. All views use the SAME gameState.
  // The active prototype has names but no certified horse IDs; URLs retain their names
  // until the canonical IDs are connected (we never invent them here).
  let restoringBrowserRoute = false;
  function routePageType(kicker){
    const match = {'Horse Profile':'horse','People Profile':'person','Farm Profile':'farm','Track Profile':'track',
      'Race Profile':'race','Race Calendar':'calendar','Stable':'stable','Sales':'sales',
      'World':'world','News':'news','Opportunity Board':'opportunities','Opportunity':'opportunities',
      'Claim Watch':'claim','Deadline':'deadline','History':'history','Source':'source'};
    return match[kicker] || 'file';
  }
  function routeUrl(kicker,title){
    const q = new URLSearchParams(location.search);
    q.delete('page'); q.delete('name'); q.delete('track');
    const type=routePageType(kicker);
    q.set('page',type);
    if(['horse','person','farm','track','race','file','claim','deadline'].includes(type) && title) q.set('name',title);
    if(type==='race' && window.__wtwRaceContext) q.set('track',window.__wtwRaceContext);
    return location.pathname+'?'+q.toString();
  }
  function officeUrl(){
    const q=new URLSearchParams(location.search);
    q.delete('page');q.delete('name');q.delete('track');
    const s=q.toString();return location.pathname+(s?'?'+s:'');
  }
  function markCurrentNav(name){
    const top=['Stable','Race Calendar','Sales','World','News'].includes(name)?name:({'Horse Profile':'Stable','People Profile':'World','Farm Profile':'World','Track Profile':'World','Race Profile':'Race Calendar','Opportunity Board':'Office'}[name]||'Office');
    document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.act===top));
  }
  function closeRoute(){
    const wasOpen=!!shell&&!shell.hidden;
    if(shell)shell.hidden=true;
    document.body.classList.remove('wtw-page-open');
    markCurrentNav('Office');
    if(wasOpen&&!restoringBrowserRoute) window.history.pushState({wtwPage:'office'},'',officeUrl());
  }
  function pushHistory(label){
    history = history.slice(0, historyIndex+1);
    history.push(label); historyIndex = history.length - 1;
    updateBackForward();
  }
  function updateBackForward(){
    const back = document.querySelector('[data-act="Back"]');
    const fwd = document.querySelector('[data-act="Forward"]');
    if(back) back.classList.toggle('disabled', historyIndex <= 0);
    if(fwd) fwd.classList.toggle('disabled', historyIndex >= history.length-1);
  }
  function openRoute(kicker,title,body,track=true){
    if(!shell) return;
    const isProfile = kicker==='Horse Profile' || kicker==='People Profile' || kicker==='Farm Profile' || kicker==='Track Profile';
    shell.classList.toggle('profileRouteShell', isProfile);
    shell.classList.toggle('stableRouteShell', kicker==='Stable');
    routeKicker.textContent = kicker || 'Destination';
    routeTitle.textContent = title || 'Page';
    routeBody.innerHTML = body;
    const head=shell.querySelector('.routeHead');
    if(head){
      let badge=head.querySelector('.wtwRouteBadge');
      if(!badge){badge=document.createElement('img');badge.className='wtwRouteBadge';badge.alt='';badge.setAttribute('aria-hidden','true');head.insertBefore(badge,head.firstChild);}
      const kind=routePageType(kicker);
      const badgeNames={horse:'horse',person:'people',farm:'farm_stable',track:'track',stable:'farm_stable',calendar:'meet_schedule',race:'major_races',sales:'connections',world:'track',news:'history',opportunities:'reputation',claim:'connections',deadline:'meet_schedule',history:'history',file:'history',source:'people'};
      badge.src='/assets/profile-badges/v2/wtw_badge_'+(badgeNames[kind]||'history')+'.png';
      const lead=head.querySelector(':scope > div');
      if(lead)lead.classList.add('wtwPageLead');
      const close=head.querySelector('.routeClose');
      if(close){close.textContent='← Office';close.title='Return to Racing Office';close.setAttribute('aria-label','Return to Racing Office');}
    }
    shell.hidden = false;
    document.body.classList.add('wtw-page-open');
    markCurrentNav(kicker);
    if(track){
      pushHistory(title);
      if(!restoringBrowserRoute) window.history.pushState({wtwPage:routePageType(kicker),title},'',routeUrl(kicker,title));
    }
    // No dismissible shaded modal: this route occupies the app's entire content page.

  }
  function scheduleItemsFromOffice(){
    return Array.from(document.querySelectorAll('.fixtureList .fixture')).map(row=>{
      const p=row.querySelector('p');
      const h=row.querySelector('h4');
      return {
        date:row.querySelector('.d')?.textContent.trim() || '',
        name:h?.textContent.trim() || 'Schedule item',
        context:p ? (p.dataset.baseOfficeText || p.textContent.trim()) : '',
        tag:row.querySelector('.raceTag')?.textContent.trim() || '',
        caseId:row.dataset.case || '',
        profile:row.dataset.profile || '',
        track:row.dataset.track || ''
      };
    });
  }
  function calendarStateText(item){
    if(item.caseId==='powerline'){
      const parts=[];
      const entry=gameState.calendarState?.['Churchill R3']?.status;
      const target=gameState.calendarState?.Powerline?.race_target;
      const status=gameState.horseState?.Powerline?.status;
      if(entry) parts.push('Entry: '+entry);
      if(target) parts.push('Target: '+target);
      if(!parts.length && status) parts.push(status);
      return parts.join(' · ') || 'Scheduled';
    }
    if(item.caseId==='lastmatch') return gameState.horseState?.['The Last Match']?.status || 'Scheduled';
    if(item.caseId==='saratoga') return gameState.scoutingState?.Saratoga?.status || 'Sales watch scheduled';
    if(item.caseId==='cedar') return gameState.horseState?.['Cedar Spoke group']?.status || 'Stable works scheduled';
    return 'Scheduled';
  }
  function openRaceCalendar(){
    const items=scheduleItemsFromOffice();
    const rows=items.map(item=>{
      const name = item.profile ? `<button class="calName" data-act="Open calendar horse" data-profile="${item.profile}">${item.name}</button>` : `<span class="calName">${item.name}</span>`;
      const action = item.caseId ? `<button class="calAction" data-act="Open calendar decision" data-case="${item.caseId}">Desk</button>` : (item.profile ? `<button class="calAction" data-act="Open calendar horse" data-profile="${item.profile}">Horse</button>` : `<button class="calAction" data-act="Office Overview">Office</button>`);
      const trackContext = item.track ? `<button class="calTrackLink" data-act="Open track profile" data-track-profile="${item.track}">${item.track}</button>${item.context.replace(item.track,'')}` : item.context;
      return `<div class="calendarRouteRow"><div class="calDate">${item.date}</div><div class="calMain">${name}<span class="calContext">${trackContext}</span></div><div class="calState">${calendarStateText(item)}</div><div class="calTag">${item.tag}</div>${action}</div>`;
    }).join('');
    openRoute('Race Calendar','Race Calendar',`
      <section class="routeCard raceCalendarCard"><div class="raceCalendarMeta"><span>Current Office schedule</span><span>Game date ${currentGameDate()}</span></div><div class="calendarRouteRows">${rows}</div><div class="routeActions"><button data-act="Office Overview">Office</button><button class="alt" data-act="Open move history">Decision Log</button></div></section>`);
  }

  function openStableRoute(){
    const safe = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const boardRows = Array.from(document.querySelectorAll('.rankRow')).filter(row=>row.querySelector('strong'));
    const rows = boardRows.map((boardRow, order)=>{
      const name = boardRow.querySelector('strong').textContent.trim();
      const horse = gameState.horseState?.[name] || {};
      const scouting = gameState.scoutingState?.[name] || {};
      const boardStatus = baselineBoardStatus(name);
      const isOdds = /^\d+\/\d+$/.test(boardStatus);
      const status = horse.status || scouting.status || (!isOdds ? boardStatus : '') || 'No active Office change';
      const target = gameState.calendarState?.[name]?.race_target || scheduleContextFor(name) || '';
      const vet = horse.vet_flag || (name==='The Last Match' && boardStatus==='Vet' ? 'Vet watch' : '');
      const recent = latestProfileDecision(name);
      const follow = latestProfileFollowUp(name);
      const cases = profileCases(name);
      const openCase = cases.find(id=>!gameState.resolvedCases?.[id]) || cases[0] || '';
      const detail = [target && 'Race / entry: '+target,vet && 'Health: '+vet,follow && 'Follow-up: '+follow.status].filter(Boolean).map(safe).join(' · ');
      const decisionText = recent ? 'Latest: '+safe(recent.choiceTitle) : (openCase ? 'Active Decision Desk file' : 'No linked decision');
      const actions = `<button data-act="Open horse profile" data-profile="${safe(name)}">Open Horse</button>`+
        (openCase ? `<button class="alt" data-act="Open profile decision" data-case="${safe(openCase)}">Decision Desk</button>` : '')+
        (follow && follow.status!=='complete' ? `<button class="alt" data-act="Open follow-up" data-followup-id="${safe(follow.id)}">Follow-up</button>` : '');
      return `<article class="stableRosterRow" role="listitem">
        <div class="stableRosterRank">${order+1}</div>
        <div class="stableRosterIdentity"><button class="stableHorseName" data-act="Open horse profile" data-profile="${safe(name)}">${safe(name)}</button><span>${safe(status)}${isOdds?' · Board '+safe(boardStatus):''}</span></div>
        <div class="stableRosterContext"><strong>${detail || 'No further current Office context'}</strong><span>${decisionText}</span></div>
        <div class="stableRosterActions">${actions}</div>
      </article>`;
    }).join('');
    openRoute('Stable','Stable', `<section class="stableRoute">
      <div class="stableRosterHead"><div><b>Stable overview</b><span>Live Office-linked roster · ${boardRows.length} horses</span></div><div class="stableRosterTag">Current game date: ${safe(currentGameDate())}</div></div>
      <div class="stableRoster" role="list">${rows || '<p>No horses currently on the Office Stable Board.</p>'}</div>
      <div class="stableRosterFoot"><span>Statuses and linked decisions update from the current Office state.</span><button data-act="Office Overview">Back to Office</button></div>
    </section>`);
  }
  function pageEscape(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function officePageRow(badge,title,info,action,label,attrs=''){
    return '<div class="wtwPageListRow"><img class="wtwPageMiniBadge" alt="" src="/assets/profile-badges/v2/wtw_badge_'+badge+'.png"/><div><h4>'+pageEscape(title)+'</h4><p>'+pageEscape(info)+'</p></div><button data-act="'+pageEscape(action)+'" '+attrs+'>'+pageEscape(label)+'</button></div>';
  }
  function openSalesDesk(){
    const data=[
      ['connections','Saratoga catalog','Bloodstock scouting file · existing Office decision','Open profile decision','Open file','data-case="saratoga"'],
      ['horse','Powerline inquiry','Private offer · existing Opportunity Board','Open private offer','Review offer','']
    ];
    const rows=data.map(d=>officePageRow(...d)).join('');
    openRoute('Sales','Sales & Bloodstock',`<div class="wtwSectionGrid"><section class="routeCard"><h3>Active Market Files</h3><div class="wtwPageList">${rows}</div></section><section class="routeCard"><h3>Scouting Desk</h3><p>These are the market and bloodstock files actually present in the current Office. No auction results, bids or ownership terms are inferred.</p><div class="routeActions"><button data-act="Open profile decision" data-case="saratoga">Review catalog</button><button class="alt" data-act="Stable">Stable Roster</button></div></section></div>`);
  }
  function openNewsDesk(){
    const news=document.querySelector('.msg[data-case="newsbuzz"]');
    const title=news?.querySelector('.title')?.textContent.trim()||'Argosy colt buzz building';
    const meta=news?.querySelector('.meta')?.textContent.trim()||'Current Office news file';
    const rows=officePageRow('history',title,meta,'Open profile decision','Open story','data-case="newsbuzz"')+
      officePageRow('people','Pieta gallop-out report','Current Office training report','Open profile decision','Review','data-case="pieta"');
    openRoute('News','Racing News Desk',`<div class="wtwSectionGrid"><section class="routeCard"><h3>Current Office Reports</h3><div class="wtwPageList">${rows}</div></section><section class="routeCard"><h3>News Context</h3><p>Selected stories connect to the current game's Decision Desk. This prototype does not yet have a live external racing-news feed.</p><div class="routeActions"><button data-act="World">World Directory</button><button class="alt" data-act="Office Overview">Office</button></div></section></div>`);
  }
  function openOpportunityDesk(){
    const items=[...document.querySelectorAll('.oppItem')];
    const rows=items.map(item=>{
      const title=item.querySelector('h4')?.textContent.trim()||'Opportunity';
      const meta=item.querySelector('p')?.textContent.trim()||'Office opportunity';
      const action=item.getAttribute('data-act')||'Office Overview';
      return officePageRow('reputation',title,meta,action,'Review');
    }).join('');
    openRoute('Opportunity Board','Opportunity Board',`<div class="wtwSectionGrid"><section class="routeCard"><h3>Open Opportunities</h3><div class="wtwPageList">${rows}</div></section><section class="routeCard"><h3>Manager's View</h3><p>Each listed opportunity is linked to the existing Office action; no extra claim candidates, private offers or sales data have been invented.</p><div class="routeActions"><button data-act="Sales">Sales Desk</button><button class="alt" data-act="Stable">Stable Roster</button></div></section></div>`);
  }
  function openRaceProfile(name,track){
    const data=trackProfiles[track];
    const r=(data?.stakes||[]).find(x=>x[0]===name);
    if(!data||!r){showToast('Race record not available in this Office');return;}
    window.__wtwRaceContext=track;
    const fields=[['Race',r[0]],['Track',track],['Listed date (1999)',r[1]],['Category',r[2]],['Listed purse',r[3]]].map(([k,v])=>'<div class="routeRow"><b>'+pageEscape(k)+'</b><span>'+pageEscape(v)+'</span></div>').join('');
    openRoute('Race Profile',name,`<div class="wtwSectionGrid"><section class="routeCard"><h3>Race File</h3><div class="routeRows">${fields}</div><div class="routeActions"><button data-act="Open track profile" data-track-profile="${pageEscape(track)}">Track Profile</button><button class="alt" data-act="Race Calendar">Race Calendar</button></div></section><section class="routeCard"><h3>Entries & Results</h3><p>No entries, scratches or final result are connected to this race file in the current Office prototype.</p><p>The schedule fields shown on the left are the existing track-profile listing, not a new independent race database.</p></section></div>`);
  }
  function openPage(page){
    if(page==='Stable'){ openStableRoute(); return; }
    if(page==='Race Calendar'){ openRaceCalendar(); return; }
    if(page==='World'){ openWorldDirectory(); return; }
    if(page==='Sales'){ openSalesDesk(); return; }
    if(page==='News'){ openNewsDesk(); return; }
    if(page==='Opportunity'){ openOpportunityDesk(); return; }
    const c = pageCopy[page] || [page,page,'This view has no additional current Office information.'];
    openRoute(c[0], c[1], `
      <section class="routeCard"><h3>${c[1]}</h3><p>${c[2]}</p><div>
        <span class="interactionBadge">wired</span><span class="interactionBadge">placeholder shell</span><span class="interactionBadge">next build target</span>
      </div><div class="routeActions"><button data-act="Office Overview">Back to Office</button><button class="alt" data-act="Open ${c[0]} detail">Open detail</button></div></section>
      <section class="routeCard"><h3>What this will contain</h3><div class="routeRows">
        <div class="routeRow"><b>Primary</b><span>Clickable rows and active game data</span></div>
        <div class="routeRow"><b>Status</b><span>Temporary shell until this screen is built</span></div>
        <div class="routeRow"><b>Return</b><span>Office / Overview returns to the baseline hub</span></div>
      </div></section>`);
  }
  function loadCase(key, quiet=false){
    currentCase = key || currentCase;
    gameState.currentCase = currentCase;
    closeRoute();
    if(typeof window.loadDecision === 'function') window.loadDecision(currentCase);
    processDueFollowUps();
    syncResolvedMessages();
    propagateOfficeState();
    renderResolvedCase(currentCase);
    if(!quiet) showToast('Decision Desk: ' + (caseTitles[currentCase] || currentCase));
  }
  function currentDeskText(){
    return {
      title:(document.getElementById('deskTitle')||{}).textContent || 'Current file',
      summary:(document.getElementById('deskSummary')||{}).textContent || '',
      pressure:(document.getElementById('deskPressure')||{}).textContent || '',
      risk:(document.getElementById('deskRisk')||{}).textContent || '',
      read:(document.getElementById('deskRead')||{}).textContent || '',
      source:(document.getElementById('deskSource')||{}).textContent || ''
    };
  }
  function openFile(){
    const d = currentDeskText();
    openRoute('Decision File', d.title, `
      <section class="routeCard"><h3>Situation file</h3><p>${d.summary}</p><div class="routeRows">
        <div class="routeRow"><b>Pressure</b><span>${d.pressure}</span></div>
        <div class="routeRow"><b>Risk</b><span>${d.risk}</span></div>
        <div class="routeRow"><b>Best read</b><span>${d.read}</span></div>
        <div class="routeRow"><b>Source</b><span>${d.source}</span></div>
      </div><div class="routeActions"><button data-act="Close route">Return to Decision Desk</button><button class="alt" data-act="Horse Profile">Horse Profile</button></div></section>
      <section class="routeCard"><h3>File actions</h3><p>This is where the expanded memo, notes, consequences, and historical decisions will live.</p><div class="routeRows">
        <div class="routeRow"><b>Log</b><span>Choice history will appear here</span></div>
        <div class="routeRow"><b>Impact</b><span>Owner mood / horse development / cash effects</span></div>
        <div class="routeRow"><b>Next</b><span>Choose a move or cycle active files</span></div>
      </div></section>`);
  }
  function baselineBoardStatus(name){
    const row = Array.from(document.querySelectorAll('.rankRow')).find(r=>r.querySelector('strong')?.textContent.trim()===name);
    const cell = row?.querySelector(':scope > span:last-child');
    return cell ? (cell.dataset.baseOfficeText || cell.textContent.trim()) : '';
  }
  function scheduleContextFor(name){
    const row = document.querySelector(`.fixture[data-profile="${name}"]`);
    if(!row) return '';
    const p = row.querySelector('p');
    return p ? (p.dataset.baseOfficeText || p.textContent.trim()) : '';
  }
  function profileCases(name){ return horseCaseMap[name] || []; }
  function latestProfileDecision(name){
    const ids = profileCases(name);
    return (gameState.decisionLog || []).slice().reverse().find(d=>ids.includes(d.caseId)) || null;
  }
  function latestProfileFollowUp(name){
    const ids = profileCases(name);
    return (gameState.followUps || []).slice().reverse().find(f=>ids.includes(f.caseId)) || null;
  }
  function openUnlinkedHorseContext(caseId){
    const data = deskCases[caseId] || {};
    const destination = caseId==='saratoga' ? 'Sales' : caseId==='cash' ? 'Sales' : 'Stable';
    openRoute('Horse Profile','No individual horse linked', `
      <section class="routeCard horseProfileCard"><h3>${caseTitles[caseId] || 'Current file'}</h3><p>This Office file does not identify a single horse, so the game will not invent one.</p><div class="routeRows">
        <div class="routeRow"><b>Source</b><span>${data.source || 'Office'}</span></div>
        <div class="routeRow"><b>Context</b><span>${data.summary || 'No individual horse context is available.'}</span></div>
      </div><div class="routeActions"><button data-act="Office Overview">Office</button><button class="alt" data-act="${destination}">Open ${destination}</button><button class="alt" data-act="Open profile decision" data-case="${caseId}">Decision Desk</button></div></section>`);
  }
  function profileButton(label, type, value){
    if(!value || value==='—') return '<span>—</span>';
    if(type==='person' && personProfiles[value]) return `<button class="profileLinkButton" data-act="Open person profile" data-person-profile="${value}">${value}</button>`;
    if(type==='farm' && farmProfiles[value]) return `<button class="profileLinkButton" data-act="Open farm profile" data-farm-profile="${value}">${value}</button>`;
    if(type==='horse' && (horseProfileFacts[value] || horseCaseMap[value])) return `<button class="profileLinkButton" data-act="Open horse profile" data-profile="${value}">${value}</button>`;
    return `<span>${value}</span>`;
  }
  function initials(name){
    return String(name||'').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase() || 'WTW';
  }
  function profileAchievements(items){
    return (items && items.length) ? items.map(x=>`<div class="achievementItem">${x}</div>`).join('') : '<div class="achievementItem muted">No recorded achievement in the current game state.</div>';
  }
  function staffReputation(name){
    const trust = Number(gameState.staffState?.[name]?.trust || 0);
    if(trust>1) return {label:'Strong',pct:82};
    if(trust===1) return {label:'Positive',pct:66};
    if(trust<0) return {label:'Strained',pct:34};
    return {label:'Unrated',pct:50};
  }
  function openHorseProfile(name){
    name = name || caseHorseTarget[currentCase] || '';
    if(!name){ openUnlinkedHorseContext(currentCase); return; }
    const horse = gameState.horseState?.[name] || {};
    const scout = gameState.scoutingState?.[name] || {};
    const facts = horseProfileFacts[name] || {age:'—',born:'—',sex:'—',earnings:'—',record:{starts:'—',wins:'—',seconds:'—',thirds:'—'},pedigree:{},connections:{},achievements:[]};
    const cases = profileCases(name);
    const latest = latestProfileDecision(name);
    const follow = latestProfileFollowUp(name);
    const boardBase = baselineBoardStatus(name);
    const scheduleBase = scheduleContextFor(name);
    const boardIsOdds = /^\d+\/\d+$/.test(boardBase || '');
    let currentStatus = horse.status || scout.status || (!boardIsOdds ? boardBase : '') || 'No active status change';
    let raceTarget = gameState.calendarState?.[name]?.race_target || scheduleBase || '';
    let raceState = '';
    if(name==='Powerline'){
      raceState = gameState.calendarState?.['Churchill R3']?.status || '';
      raceTarget = raceTarget || (raceState ? 'Churchill R3' : '');
    }
    const vetFlag = horse.vet_flag || (name==='The Last Match' && boardBase==='Vet' ? 'Vet watch on Office board' : 'No active vet flag');
    const decisionCase = latest?.caseId || cases[0] || '';
    const followButton = follow && follow.status!=='complete' ? `<button class="alt" data-act="Open follow-up" data-followup-id="${follow.id}">Open follow-up</button>` : '';
    const statePills = [
      `<span class="profileStatePill${follow?.status==='due'?' alert':''}">${follow?.status==='due'?'Follow-up due':currentStatus}</span>`,
      raceState ? `<span class="profileStatePill">Entry: ${raceState}</span>` : '',
      raceTarget ? `<span class="profileStatePill">Target: ${raceTarget}</span>` : '',
      boardIsOdds ? `<span class="profileStatePill">Board: ${boardBase}</span>` : ''
    ].join('');
    const c=facts.connections||{};
    const p=facts.pedigree||{};
    const r=facts.record||{};
    const contextItems=[
      latest ? `Latest decision · ${latest.gameDate} · ${latest.choiceTitle}` : 'No resolved decision tied to this horse yet.',
      follow ? `${follow.status.toUpperCase()} follow-up · ${follow.dueDate || 'Open'} · ${follow.text}` : 'No open follow-up tied to this horse.',
      `Health / Vet · ${vetFlag}`
    ];
    openRoute('Horse Profile', name, `
      <section class="profilePage horseProfilePage">
        <div class="profileHero">
          <div class="profilePhoto" data-label="Horse identity"><img class="wtwBadgeIdentity" src="/assets/profile-badges/v2/wtw_badge_horse.png" alt="" aria-hidden="true"></div>
          <div class="profileIdentity">
            <div class="profileEyebrow">Horse</div><h2 class="profileName">${name}</h2>
            <div class="profileSubline">State-aware racing file</div>
            <div class="profileFields">
              <div class="profileField"><span>Age</span><strong>${facts.age || '—'}</strong></div>
              <div class="profileField"><span>Born</span><strong>${facts.born || '—'}</strong></div>
              <div class="profileField"><span>Sex</span><strong>${facts.sex || '—'}</strong></div>
              <div class="profileField"><span>Current status</span><strong>${currentStatus}</strong></div>
            </div>
            <div class="profileMoney"><span>Career earnings</span><strong>${facts.earnings || '—'}</strong></div>
            <div class="profileStateBar">${statePills}</div>
          </div>
          <div class="profileConnections"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_connections.png" alt="" aria-hidden="true"><span>Connections</span></h3><div class="profileList">
            <div class="profileLine"><b>Owner</b>${profileButton('Owner','person',c.owner)}</div>
            <div class="profileLine"><b>Trainer</b>${profileButton('Trainer','person',c.trainer)}</div>
            <div class="profileLine"><b>Jockey</b>${profileButton('Jockey','person',c.jockey)}</div>
            <div class="profileLine"><b>Breeder</b>${profileButton('Breeder','farm',c.breeder)}</div>
            <div class="profileLine"><b>Office contact</b>${profileButton('Contact',personProfiles[c.contact]?'person':(farmProfiles[c.contact]?'farm':''),c.contact)}</div>
          </div></div>
        </div>
        <div class="profileLower">
          <div class="profilePanel"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_pedigree.png" alt="" aria-hidden="true"><span>Pedigree</span></h3><div class="profilePanelBody"><div class="pedigreeTree">
            <div class="pedigreeNode primary"><span>Sire</span><strong>${p.sire || '—'}</strong></div>
            <div class="pedigreeNode"><span>Grandsire</span><strong>${p.grandsire || '—'}</strong></div>
            <div class="pedigreeNode"><span>Granddam</span><strong>${p.granddam || '—'}</strong></div>
            <div class="pedigreeNode primary"><span>Dam</span><strong>${p.dam || '—'}</strong></div>
            <div class="pedigreeNode"><span>Damsire</span><strong>${p.damsire || '—'}</strong></div>
            <div class="pedigreeNode"><span>2nd Dam</span><strong>${p.secondDam || '—'}</strong></div>
          </div></div></div>
          <div class="profilePanel"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_career_record.png" alt="" aria-hidden="true"><span>Career Record</span></h3><div class="profilePanelBody">
            <div class="recordGrid">
              <div class="recordStat"><b>${r.starts ?? '—'}</b><span>Starts</span></div>
              <div class="recordStat"><b>${r.wins ?? '—'}</b><span>Wins</span></div>
              <div class="recordStat"><b>${r.seconds ?? '—'}</b><span>2nds</span></div>
              <div class="recordStat"><b>${r.thirds ?? '—'}</b><span>3rds</span></div>
            </div>
            <div class="achievementList">${contextItems.map(x=>`<div class="achievementItem muted">${x}</div>`).join('')}</div>
          </div><div class="routeActions"><button data-act="Office Overview">Office</button><button class="alt" data-act="Stable">Stable</button>${raceTarget?'<button class="alt" data-act="Race Calendar">Race Calendar</button>':''}${decisionCase?`<button class="alt" data-act="Open profile decision" data-case="${decisionCase}">Decision Desk</button>`:''}${followButton}</div></div>
          <div class="profilePanel"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_achievements.png" alt="" aria-hidden="true"><span>Achievements</span></h3><div class="profilePanelBody"><div class="achievementList">${profileAchievements(facts.achievements)}</div></div></div>
        </div>
      </section>`);
  }
  function openPersonProfile(name){
    const data=personProfiles[name];
    if(!data){ showToast('Person profile not yet available'); return; }
    const rep=staffReputation(name);
    const stable=(data.stable||[]).map(h=>`<div class="achievementItem">${profileButton('Horse','horse',h)}</div>`).join('') || '<div class="achievementItem muted">No active horse connection in the current Office state.</div>';
    const staff=gameState.staffState?.[name] || {};
    openRoute('People Profile',name,`
      <section class="profilePage personProfilePage">
        <div class="profileHero">
          <div class="profilePhoto" data-label="Approved identity badge"><img class="wtwBadgeIdentity" src="/assets/profile-badges/v2/wtw_badge_people.png" alt="" aria-hidden="true"></div>
          <div class="profileIdentity">
            <div class="profileEyebrow">People</div><h2 class="profileName">${name}</h2><div class="profileSubline">Job: ${data.job || '—'}</div>
            <div class="profileFields">
              <div class="profileField"><span>Age</span><strong>${data.age || '—'}</strong></div>
              <div class="profileField"><span>Birthplace</span><strong>${data.birthplace || '—'}</strong></div>
              <div class="profileField"><span>Location</span><strong>${data.location || '—'}</strong></div>
              <div class="profileField"><span>Role</span><strong>${data.job || '—'}</strong></div>
            </div>
            <div class="profileStateBar"><span class="profileStatePill">${rep.label} reputation</span>${staff.trust?`<span class="profileStatePill">Trust ${staff.trust>0?'+':''}${staff.trust}</span>`:''}</div>
          </div>
          <div class="profileConnections"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_connections.png" alt="" aria-hidden="true"><span>Current Office connection</span></h3><div class="profileList">
            <div class="profileLine"><b>Job</b><span>${data.job || '—'}</span></div>
            <div class="profileLine"><b>Location</b><span>${data.location || '—'}</span></div>
            <div class="profileLine"><b>Reputation</b><span>${rep.label}</span></div>
          </div></div>
        </div>
        <div class="profileLower">
          <div class="profilePanel"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_farm_stable.png" alt="" aria-hidden="true"><span>Stable</span></h3><div class="profilePanelBody"><div class="achievementList">${stable}</div></div></div>
          <div class="profilePanel"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_career_record.png" alt="" aria-hidden="true"><span>Career Wins</span></h3><div class="profilePanelBody"><div class="bigMetric"><strong>${data.careerWins || '—'}</strong><span>Career wins</span></div><div class="achievementItem muted">Career totals will populate from the canonical historical/person database.</div></div></div>
          <div class="profilePanel"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_reputation.png" alt="" aria-hidden="true"><span>Reputation & Achievements</span></h3><div class="profilePanelBody"><div class="bigMetric"><strong>${rep.label}</strong><span>Reputation</span></div><div class="reputationBar"><i style="width:${rep.pct}%"></i></div><div class="achievementList" style="margin-top:8px">${profileAchievements(data.achievements)}</div></div><div class="routeActions"><button data-act="World">All People</button><button class="alt" data-act="Office Overview">Office</button></div></div>
        </div>
      </section>`);
  }
  function openFarmProfile(name){
    const data=farmProfiles[name];
    if(!data){ showToast('Farm profile not yet available'); return; }
    const farmState=gameState.horseState?.['Cedar Spoke group']?.status || 'No active farm-state change';
    const rep=staffReputation('Cedar Spoke staff');
    const connected=(data.connect||[]).map(h=>`<div class="achievementItem">${profileButton('Horse','horse',h)}</div>`).join('') || '<div class="achievementItem muted">No current connected horses.</div>';
    openRoute('Farm Profile',name,`
      <section class="profilePage farmProfilePage">
        <div class="profileHero">
          <div class="profilePhoto" data-label="Approved identity badge"><img class="wtwBadgeIdentity" src="/assets/profile-badges/v2/wtw_badge_farm_stable.png" alt="" aria-hidden="true"></div>
          <div class="profileIdentity">
            <div class="profileEyebrow">Farm</div><h2 class="profileName">${name}</h2><div class="profileSubline">Racing / breeding operation profile</div>
            <div class="profileFields">
              <div class="profileField"><span>Location</span><strong>${data.location || '—'}</strong></div>
              <div class="profileField"><span>Type</span><strong>${data.type || '—'}</strong></div>
              <div class="profileField"><span>Owner</span><strong>${data.owner || '—'}</strong></div>
              <div class="profileField"><span>Current status</span><strong>${farmState}</strong></div>
            </div>
            <div class="profileStateBar"><span class="profileStatePill">${rep.label} reputation</span></div>
          </div>
          <div class="profileConnections"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_farm_stable.png" alt="" aria-hidden="true"><span>Farm file</span></h3><div class="profileList">
            <div class="profileLine"><b>Location</b><span>${data.location || '—'}</span></div>
            <div class="profileLine"><b>Owner</b><span>${data.owner || '—'}</span></div>
            <div class="profileLine"><b>Reputation</b><span>${rep.label}</span></div>
          </div></div>
        </div>
        <div class="profileLower">
          <div class="profilePanel"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_horse.png" alt="" aria-hidden="true"><span>Connected Horses</span></h3><div class="profilePanelBody"><div class="achievementList">${connected}</div></div><div class="routeActions"><button data-act="Stable">Stable</button><button class="alt" data-act="Open profile decision" data-case="cedar">Decision Desk</button></div></div>
          <div class="profilePanel"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_achievements.png" alt="" aria-hidden="true"><span>Achievements</span></h3><div class="profilePanelBody"><div class="achievementList">${profileAchievements(data.achievements)}<div class="achievementItem muted">Current Office context · ${farmState}</div></div></div><div class="routeActions"><button data-act="World">All Farms</button><button class="alt" data-act="Office Overview">Office</button></div></div>
        </div>
      </section>`);
  }
  function trackOfficeContext(name){
    const row=document.querySelector(`.fixture[data-track="${name}"]`);
    if(!row) return 'No current Office entry at this track.';
    const horse=row.dataset.profile || row.querySelector('h4')?.textContent.trim() || 'Stable activity';
    if(name==='Churchill Downs'){
      const entry=gameState.calendarState?.['Churchill R3']?.status;
      const target=gameState.calendarState?.Powerline?.race_target;
      const parts=[horse]; if(entry) parts.push(entry); if(target) parts.push(target); return parts.join(' · ');
    }
    return horse+' · '+(row.querySelector('.d')?.textContent.trim() || 'scheduled');
  }
  function openTrackProfile(name){
    const data=trackProfiles[name];
    if(!data){ showToast('Track profile not yet available'); return; }
    const stakes=(data.stakes||[]).map(r=>`<button type="button" class="stakesRow wtwRaceNavRow" data-act="Open race profile" data-race-name="${pageEscape(r[0])}" data-track-profile="${pageEscape(name)}"><strong>${pageEscape(r[0])}</strong><span>${pageEscape(r[1])}</span><span>${pageEscape(r[2])}</span><span>${pageEscape(r[3])}</span></button>`).join('') || '<div class="achievementItem muted">No canonical stakes rows loaded.</div>';
    const officeContext=trackOfficeContext(name);
    openRoute('Track Profile',name,`
      <section class="profilePage trackProfilePage">
        <div class="profileHero">
          <div class="profilePhoto trackPhoto" data-label="Approved identity badge"><img class="wtwBadgeIdentity" src="/assets/profile-badges/v2/wtw_badge_track.png" alt="" aria-hidden="true"></div>
          <div class="profileIdentity">
            <div class="profileEyebrow">Track</div><h2 class="profileName">${name}</h2><div class="profileSubline">${data.id} · ${data.circuit}</div>
            <div class="profileFields">
              <div class="profileField"><span>Location</span><strong>${data.location}</strong></div>
              <div class="profileField"><span>Surfaces</span><strong>${data.surfaces}</strong></div>
              <div class="profileField"><span>Reputation</span><strong>${data.foundation}</strong></div>
              <div class="profileField"><span>Operating state</span><strong>${data.operating}</strong></div>
            </div>
            <div class="profileStateBar"><span class="profileStatePill">${data.competition} competition posture</span><span class="profileStatePill">${data.raceDays} race days</span></div>
          </div>
          <div class="profileConnections"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_track.png" alt="" aria-hidden="true"><span>Track file</span></h3><div class="profileList">
            <div class="profileLine"><b>Circuit</b><span>${data.circuit}</span></div>
            <div class="profileLine"><b>1999 Meet</b><span>${data.meetWindow}</span></div>
            <div class="profileLine"><b>Race days</b><span>${data.raceDays}</span></div>
            <div class="profileLine"><b>Office</b><span>${officeContext}</span></div>
          </div></div>
        </div>
        <div class="profileLower">
          <div class="profilePanel"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_major_races.png" alt="" aria-hidden="true"><span>Stakes Races · 1999 Canon</span></h3><div class="profilePanelBody"><div class="stakesTable"><div class="stakesHeader"><span>Race</span><span>Date</span><span>Grade</span><span>Purse</span></div>${stakes}</div></div></div>
          <div class="profilePanel"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_meet_schedule.png" alt="" aria-hidden="true"><span>Meet Schedule</span></h3><div class="profilePanelBody">
            <div class="meetBlock"><span>1999 Meet Window</span><strong>${data.meetWindow}</strong></div>
            <div class="meetBlock"><span>Race Days</span><strong>${data.raceDays}</strong></div>
            <div class="meetBlock"><span>Preferred Days</span><strong>${data.preferredDays}</strong></div>
            <div class="achievementItem muted">Runtime meet-year wiring can replace this canonical 1999 window when the live season calendar is connected.</div>
          </div><div class="routeActions"><button data-act="Race Calendar">Race Calendar</button><button class="alt" data-act="World">All Tracks</button></div></div>
          <div class="profilePanel"><h3 class="wtwBadgeHeading"><img class="wtwBadgeSmall" src="/assets/profile-badges/v2/wtw_badge_history.png" alt="" aria-hidden="true"><span>Meet & Competition Notes</span></h3><div class="profilePanelBody">
            <div class="trackNote"><b>Weather / surface logic</b><br>${data.weather}</div>
            <div class="trackNote"><b>Schedule risk</b><br>${data.scheduleRisk}</div>
            <div class="trackNote"><b>Current Office context</b><br>${officeContext}</div>
          </div><div class="routeActions"><button data-act="Office Overview">Office</button></div></div>
        </div>
      </section>`);
  }
  function openWorldDirectory(){
    const horses=['Powerline','The Last Match','Iron Harbor','Pieta','Bellarmine','Hardtack'];
    const personRows=Object.entries(personProfiles).map(([name,d])=>`<div class="directoryEntry"><div><strong>${name}</strong><span>${d.job}</span></div><button data-act="Open person profile" data-person-profile="${name}">Profile</button></div>`).join('');
    const farmRows=Object.entries(farmProfiles).map(([name,d])=>`<div class="directoryEntry"><div><strong>${name}</strong><span>${d.type}</span></div><button data-act="Open farm profile" data-farm-profile="${name}">Profile</button></div>`).join('');
    const trackRows=Object.entries(trackProfiles).map(([name,d])=>`<div class="directoryEntry"><div><strong>${name}</strong><span>${d.location}</span></div><button data-act="Open track profile" data-track-profile="${name}">Profile</button></div>`).join('');
    const horseRows=horses.map(name=>`<div class="directoryEntry"><div><strong>${name}</strong><span>${baselineBoardStatus(name)||'Horse'}</span></div><button data-act="Open horse profile" data-profile="${name}">Profile</button></div>`).join('');
    openRoute('World','Profiles & Connections',`<section class="routeCard directoryCard"><div class="directorySection"><h3>Horses</h3><div class="directoryList">${horseRows}</div></div><div class="directorySection"><h3>People</h3><div class="directoryList">${personRows}</div></div><div class="directorySection"><h3>Farms</h3><div class="directoryList">${farmRows}</div></div><div class="directorySection"><h3>Tracks</h3><div class="directoryList">${trackRows}</div></div></section>`);
  }
  function setDate(delta){
    if(delta==='day') officeDate.setDate(officeDate.getDate()+1);
    if(delta==='week') officeDate.setDate(officeDate.getDate()+7);
    if(delta==='month') officeDate.setMonth(officeDate.getMonth()+1);
    if(delta==='year') officeDate.setFullYear(officeDate.getFullYear()+1);
    const y=officeDate.getFullYear(), m=String(officeDate.getMonth()+1).padStart(2,'0'), d=String(officeDate.getDate()).padStart(2,'0');
    if(dateChip){
      const node = Array.from(dateChip.childNodes).find(n=>n.nodeType===3);
      if(node) node.nodeValue = `${y}-${m}-${d}`; else dateChip.append(`${y}-${m}-${d}`);
      dateChip.classList.add('changed'); setTimeout(()=>dateChip.classList.remove('changed'), 800);
    }
    gameState.date = `${y}-${m}-${d}`;
    const newlyDue = processDueFollowUps();
    syncResolvedMessages();
    propagateOfficeState();
    persistState(true);
    showToast((newlyDue ? 'Follow-up due · ' : 'Date advanced · ') + `${y}-${m}-${d}`);
  }
  function filterMessages(mode){
    document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active', b.getAttribute('data-act')===mode));
    document.querySelectorAll('.msg').forEach((m,idx)=>{
      let show=true;
      if(mode==='Filter Urgent') show=m.classList.contains('urgent');
      if(mode==='Filter New') show=idx<4;
      if(mode==='Filter Unread') show=idx<3;
      if(mode==='Filter Priority Feed') show=idx<5 || m.classList.contains('urgent');
      m.classList.toggle('hiddenByFilter', !show);
    });
    showToast(mode.replace('Filter ','Messages: '));
  }
  function setDateChipText(value){
    if(!dateChip || !value) return;
    const icon = dateChip.querySelector('.dateIcon') ? dateChip.querySelector('.dateIcon').outerHTML : '';
    dateChip.innerHTML = icon + value;
    const parsed = new Date(value + 'T12:00:00');
    if(!isNaN(parsed.getTime())) officeDate = parsed;
  }
  function applyImportedState(payload, persist=true){
    if(!payload || typeof payload !== 'object') { showToast('Load failed: bad JSON'); return; }
    const migrated = blankGameState();
    if(payload.version || payload.resolvedCases || payload.decisionLog){
      Object.assign(migrated, payload);
      migrated.resolvedCases = payload.resolvedCases || {};
      migrated.decisionLog = Array.isArray(payload.decisionLog) ? payload.decisionLog : [];
      migrated.followUps = Array.isArray(payload.followUps) ? payload.followUps : [];
      ['horseState','ownerState','staffState','calendarState','finances','scoutingState','messageState'].forEach(k=>migrated[k]=payload[k] || {});
    } else {
      migrated.date = payload.date || migrated.date;
      migrated.currentCase = payload.currentCase || migrated.currentCase;
    }
    migrated.version = 'Office FM Track Profile Foundation v30';
    gameState = migrated;
    const nextCase = gameState.currentCase || 'powerline';
    if(gameState.date) setDateChipText(gameState.date);
    closeRoute();
    currentCase = caseOrder.includes(nextCase) ? nextCase : 'powerline';
    loadCase(currentCase, true);
    processDueFollowUps();
    syncResolvedMessages();
    propagateOfficeState();
    if(persist) persistState(true);
    showToast('Loaded Office state');
  }
  function importStateFile(file){
    if(!file){ showToast('No file selected'); return; }
    const reader = new FileReader();
    reader.onload = function(){
      try {
        const payload = JSON.parse(String(reader.result || '{}'));
        applyImportedState(payload, true);
      } catch(err) {
        showToast('Load failed: invalid JSON');
      }
    };
    reader.onerror = function(){ showToast('Load failed'); };
    reader.readAsText(file);
  }
  function exportState(){
    gameState.date = currentGameDate();
    gameState.currentCase = currentCase;
    gameState.savedAt = new Date().toISOString();
    gameState.screen = 'Office FM Track Profile Foundation v30';
    gameState.currentDecision = currentDeskText();
    const blob = new Blob([JSON.stringify(gameState,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='wire_to_wire_office_state_v30.json'; a.click(); URL.revokeObjectURL(url);
    showToast('Exported Office state');
  }
  function saveState(){
    persistState(false);
  }
  function cycleCase(dir){
    const i = Math.max(0, caseOrder.indexOf(currentCase));
    const next = caseOrder[(i + dir + caseOrder.length) % caseOrder.length];
    loadCase(next);
  }
  function handleAction(act, el){
    if(!act) return false;
    if(act==='Close route'){ closeRoute(); showToast('Back to Office'); return true; }
    if(act==='Office' || act==='Office Overview'){ closeRoute(); loadCase(currentCase, true); showToast('Office Overview'); return true; }
    if(['Stable','Race Calendar','Sales','World','News'].includes(act)){ openPage(act); return true; }
    if(act==='+ Day' || act==='Continue'){ setDate('day'); return true; }
    if(act==='+ Week'){ setDate('week'); return true; }
    if(act==='+ Month'){ setDate('month'); return true; }
    if(act==='+ Year'){ setDate('year'); return true; }
    if(act==='Save'){ saveState(); return true; }
    if(act==='Load'){ const inp=document.getElementById('loadStateInput'); if(inp) inp.click(); return true; }
    if(act==='Export'){ exportState(); return true; }
    if(act==='Reset'){
      localStorage.removeItem(STATE_KEY); localStorage.removeItem('wtwOfficeStateV29'); localStorage.removeItem('wtwOfficeStateV28'); localStorage.removeItem('wtwOfficeStateV27'); localStorage.removeItem('wtwOfficeStateV26'); localStorage.removeItem('wtwOfficeStateV25'); localStorage.removeItem('wtwOfficeStateV20'); localStorage.removeItem('wtwOfficeStateV19');
      gameState = blankGameState(); closeRoute(); setDateChipText('2014-07-15'); currentCase='powerline'; loadCase('powerline'); processDueFollowUps(); syncResolvedMessages(); propagateOfficeState();
      showToast('Reset Office state'); return true;
    }
    if(act==='Back'){ window.history.back(); return true; }
    if(act==='Forward'){ window.history.forward(); return true; }
    if(act.startsWith('Filter ')){ filterMessages(act); return true; }
    if(act==='Open file' || act==='Open selected file'){ openFile(); return true; }
    if(act==='Open calendar horse'){ openHorseProfile(el.dataset.profile); return true; }
    if(act==='Open horse profile'){ openHorseProfile(el.dataset.profile); return true; }
    if(act==='Open person profile'){ openPersonProfile(el.dataset.personProfile); return true; }
    if(act==='Open farm profile'){ openFarmProfile(el.dataset.farmProfile); return true; }
    if(act==='Open track profile'){ openTrackProfile(el.dataset.trackProfile); return true; }
    if(act==='Open race profile'){ openRaceProfile(el.dataset.raceName,el.dataset.trackProfile); return true; }
    if(act==='Open calendar decision'){ const key=el.dataset.case; if(key) loadCase(key); else showToast('No linked decision'); return true; }
    if(act==='Horse Profile'){ const target=caseHorseTarget[currentCase]; if(target) openHorseProfile(target); else openUnlinkedHorseContext(currentCase); return true; }
    if(act==='Open profile decision'){ const key=el.dataset.case; if(key) loadCase(key); else showToast('No linked decision'); return true; }
    if(act==='Open current deadline'){ openRoute('Deadline','Current deadline', '<section class="routeCard"><h3>Decision Today</h3><p>This action is due before the next calendar advance.</p></section>'); return true; }
    if(act==='Open current source'){ const src=currentDeskText().source; if(personProfiles[src]) openPersonProfile(src); else if(farmProfiles[src]) openFarmProfile(src); else openRoute('Source','Current source', '<section class="routeCard"><h3>'+src+'</h3><p>No dedicated profile type is wired for this source yet.</p></section>'); return true; }
    if(act==='Acknowledge follow-up'){ completeFollowUp(el.dataset.followupId); return true; }
    if(act==='Open original decision'){ const f=(gameState.followUps||[]).find(x=>x&&x.id===el.dataset.followupId); if(f) loadCase(f.caseId); else showToast('Original decision unavailable'); return true; }
    if(act==='Open follow-up'){ openFollowUp(el.dataset.followupId); return true; }
    if(act==='Open move history'){ renderDecisionLog(); return true; }
    if(act.includes('Decision Desk previous') || act.includes('Race Schedule previous') || act.includes('Stable Board previous') || act.includes('Opportunity Board previous')){ cycleCase(-1); return true; }
    if(act.includes('Decision Desk next') || act.includes('Race Schedule next') || act.includes('Stable Board next') || act.includes('Opportunity Board next')){ cycleCase(1); return true; }
    if(act.includes('Intel Stack') || act.includes('Your Move')){ showToast(act); return true; }
    if(act.includes('Open message')){ const key = el.dataset.case; if(key) loadCase(key); return true; }
    if(act.includes('Open fixture')){ const key = el.dataset.case; if(key) loadCase(key); else openPage('Race Calendar'); return true; }
    if(act.includes('Open board')){ openHorseProfile(el.dataset.profile || el.querySelector('strong')?.textContent || 'Horse'); return true; }
    if(act.includes('Open opportunity board') || act.includes('Review all')){ openPage('Opportunity'); return true; }
    if(act.includes('Open private offer') || act.includes('Review offer')){ loadCase('powerline'); openRoute('Opportunity','Powerline inquiry', '<section class="routeCard"><h3>St. Alloy inquiry</h3><p>Partners want a read before Saturday. This connects back to the Powerline race-placement decision.</p><div class="routeActions"><button data-act="Open file">Open Powerline file</button><button data-act="Horse Profile">Horse Profile</button></div></section><section class="routeCard"><h3>Possible responses</h3><div class="routeRows"><div class="routeRow"><b>Direct</b><span>Tell them the colt is live but still learning</span></div><div class="routeRow"><b>Cautious</b><span>Ask for one more work before commitment</span></div></div></section>'); return true; }
    if(act.includes('Open claim watch') || act.includes('Scout claim')){ openRoute('Claim Watch','Aqueduct cheap speed', '<section class="routeCard"><h3>Claim scout file</h3><p>Scout says one runner may fit the lower barn. Full claim screen can be built from this route.</p></section><section class="routeCard"><h3>Actions</h3><div class="routeActions"><button data-act="Sales">Open market</button><button data-act="Stable">Check roster need</button></div></section>'); return true; }
    if(act.includes('Open sales lead')){ loadCase('saratoga'); return true; }
    if(act.includes('Choose:')){
      const title = el.querySelector('strong')?.textContent || act.replace('Choose:','').trim();
      const idx = (deskCases[currentCase]?.moves || []).findIndex(m=>m[0]===title);
      resolveDecision(currentCase, idx);
      return true;
    }
    if(act==='Open outcome destination'){
      const dest = el.dataset.destination;
      if(dest==='Horse Profile'){ openHorseProfile(caseHorseTarget[currentCase] || caseTitles[currentCase]); return true; }
      if(dest && pageCopy[dest]){ openPage(dest); return true; }
      if(dest==='Stable' || dest==='Sales' || dest==='News' || dest==='Race Calendar'){ openPage(dest); return true; }
      openFile(); return true;
    }
    if(act.includes('Open detail')){ showToast(act); return true; }
    showToast(act); return true;
  }
  document.addEventListener('click', function(e){
    const sourceName = e.target.closest('.msg .from');
    if(sourceName){
      const n=sourceName.textContent.trim();
      if(personProfiles[n]){ e.preventDefault(); e.stopImmediatePropagation(); openPersonProfile(n); return; }
      if(farmProfiles[n]){ e.preventDefault(); e.stopImmediatePropagation(); openFarmProfile(n); return; }
    }
    const msg = e.target.closest('.msg[data-case]');
    if(msg){ e.preventDefault(); e.stopImmediatePropagation(); if(msg.dataset.followupId) openFollowUp(msg.dataset.followupId); else loadCase(msg.dataset.case); return; }
    const fixtureTrack = e.target.closest('.fixture[data-track] p');
    if(fixtureTrack){ const row=fixtureTrack.closest('.fixture[data-track]'); e.preventDefault(); e.stopImmediatePropagation(); openTrackProfile(row.dataset.track); return; }
    const fixtureName = e.target.closest('.fixture[data-profile] h4');
    if(fixtureName){ const row=fixtureName.closest('.fixture[data-profile]'); e.preventDefault(); e.stopImmediatePropagation(); openHorseProfile(row.dataset.profile); return; }
    const el = e.target.closest('button,[data-act],.fixture,.rankRow,.oppItem,.caseHero,.link,.brand');
    if(!el) return;
    const act = el.getAttribute('data-act') || el.textContent.trim();
    if(handleAction(act, el)){ e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  document.querySelectorAll('.msg .from').forEach(node=>{
    const n=node.textContent.trim();
    if(personProfiles[n] || farmProfiles[n]){
      node.style.textDecoration='underline';
      node.style.textDecorationColor='rgba(255,255,255,.28)';
      node.style.textUnderlineOffset='2px';
      node.title='Open profile';
    }
  });

  const loadInput = document.getElementById('loadStateInput');
  if(loadInput){
    loadInput.addEventListener('change', function(){
      importStateFile(this.files && this.files[0]);
      this.value = '';
    });
  }
  try{
    const saved = localStorage.getItem(STATE_KEY) || localStorage.getItem('wtwOfficeStateV29') || localStorage.getItem('wtwOfficeStateV28') || localStorage.getItem('wtwOfficeStateV27') || localStorage.getItem('wtwOfficeStateV26') || localStorage.getItem('wtwOfficeStateV25') || localStorage.getItem('wtwOfficeStateV20') || localStorage.getItem('wtwOfficeStateV19');
    if(saved){
      const s = JSON.parse(saved);
      applyImportedState(s, false);
    } else {
      gameState.date = currentGameDate();
      gameState.currentCase = currentCase;
      processDueFollowUps();
      syncResolvedMessages();
      propagateOfficeState();
    }
  }catch(err){
    gameState = blankGameState();
    processDueFollowUps();
    syncResolvedMessages();
    propagateOfficeState();
  }
  function restoreLocationPage(){
    const params=new URLSearchParams(location.search);
    const page=params.get('page'),name=params.get('name'),track=params.get('track');
    restoringBrowserRoute=true;
    try{
      if(!page||page==='office') {closeRoute(); return;}
      if(page==='stable'){openStableRoute();return;}
      if(page==='calendar'){openRaceCalendar();return;}
      if(page==='sales'){openSalesDesk();return;}
      if(page==='news'){openNewsDesk();return;}
      if(page==='world'){openWorldDirectory();return;}
      if(page==='opportunities'){openOpportunityDesk();return;}
      if(page==='horse'&&name){openHorseProfile(name);return;}
      if(page==='person'&&name){openPersonProfile(name);return;}
      if(page==='farm'&&name){openFarmProfile(name);return;}
      if(page==='track'&&name){openTrackProfile(name);return;}
      if(page==='race'&&name&&track){openRaceProfile(name,track);return;}
      closeRoute();
    }finally{restoringBrowserRoute=false;}
  }
  window.addEventListener('popstate',restoreLocationPage);
  // Office has its own daily decision desk; Escape is not a substitute for normal
  // back navigation but serves as a keyboard return shortcut.
  document.addEventListener('keydown', function(e){if(e.key==='Escape'&&shell&&!shell.hidden){closeRoute();}});
  updateBackForward();
  document.body.classList.add('wtw-fm-v33');
  // Read direct URLs on initial load after original state restoration and handlers exist.
  if(new URLSearchParams(location.search).has('page'))setTimeout(restoreLocationPage,0);
})();
