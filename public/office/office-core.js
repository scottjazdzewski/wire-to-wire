
const deskCases = {"powerline":{"source":"Gabe Larkin","due":"Decision Today","type":"Race Placement","title":"Powerline: Saturday maiden is live, not soft","summary":"Live spot. Not a free square. Sharp colt, hot pace risk.","pressure":"Med-high","risk":"Pace / confidence","read":"Mixed barn","image":"/assets/office/approved-office-visual.png","intel":[["Trainer","Live colt. Still sharp early.","neutral"],["Pace","Green speed wants the same spot.","danger"],["Owner","Wants proof. Bad run is worse.","warn"],["Long View","First lesson must help him.","good"]],"moves":[["Enter Saturday","Run now and accept the education risk.","Aggressive"],["Ask one more work","Delay until he shows more settle.","Balanced"],["Wait for softer spot","Protect confidence and pick a cleaner race.","Patient"]]},"lastmatch":{"source":"Harrow & Pike Vet","due":"Watch","type":"Vet / Soundness","title":"The Last Match: post-work filling needs a call","summary":"Not an emergency, but the leg is talking.","pressure":"Moderate","risk":"Filling lingers","read":"Caution","image":"/assets/office/approved-office-photo.jpg","intel":[["Vet","Normal vitals. Monitor filling.","warn"],["Trainer","Bright horse. Skip hard work.","neutral"],["Timing","Useful spot. Not essential.","good"],["Barn Risk","Small calls save months.","danger"]],"moves":[["Light jog only","Keep him moving and re-check.","Safe"],["Scan now","Pay for certainty before training harder.","Medical"],["Proceed as planned","Stay on schedule and watch closely.","Risky"]]},"saratoga":{"source":"Alistair Dunleavy","due":"Review","type":"Sales Intel","title":"Saratoga catalog: three hips need a buying stance","summary":"Three hips matter. Price discipline matters more.","pressure":"Medium","risk":"Auction heat","read":"Inspect first","image":"/assets/office/approved-office-photo.jpg","intel":[["Bloodstock","Upside exists. Physical leads.","good"],["Price","Do not buy the crowd.","danger"],["Barn Fit","Sneaky dirt/stamina type fits.","neutral"],["Cash","Bid only with ceilings.","warn"]],"moves":[["Inspect shortlist","Send the team to look before setting stance.","Review"],["Set hard ceilings","Put max prices in place before the ring.","Control"],["Pass today","Keep powder dry unless the vet note changes.","Conserve"]]},"pieta":{"source":"Anika Rowe","due":"Stable Note","type":"Training Read","title":"Pieta: gallop-out is finally trending the right way","summary":"She is learning. Do not rush the progress.","pressure":"Low","risk":"Too soon","read":"Positive","image":"/assets/office/approved-office-visual.png","intel":[["Assistant","More professional after the pole.","good"],["Body","Still immature. Build strength.","neutral"],["Calendar","No race is forcing you.","good"],["Barn Feel","Confidence rising. Stay quiet.","warn"]],"moves":[["Advance breeze plan","Move her forward one step.","Forward"],["Hold steady","Keep the current rhythm.","Patient"],["Add gate school","Work on manners before speed.","Schooling"]]},"cash":{"source":"Farm Desk","due":"Office","type":"Finance / Operations","title":"Monthly cash projection: stable, but not loose","summary":"Stable cash is fine. Loose spending is not.","pressure":"Medium","risk":"Burn drift","read":"Trim edges","image":"/assets/office/approved-office-photo.jpg","intel":[["Cash","Normal operations are safe.","good"],["Drift","Small costs are stacking up.","warn"],["Sales","Scout, but set ceilings.","neutral"],["Owners","No surprise cash calls.","danger"]],"moves":[["Approve normal spend","Keep the barn moving.","Normal"],["Freeze extras","Pause nonessential costs.","Conservative"],["Open ledger","Review detail before sales decisions.","Audit"]]},"newsbuzz":{"source":"News Desk","due":"Brief","type":"News Brief","title":"Argosy colt buzz is building","summary":"Outside noise. Useful context, not a barn emergency.","pressure":"Low","risk":"Headline chase","read":"Track only","image":"/assets/office/approved-office-photo.jpg","intel":[["Signal","Buzz is real, not proven.","neutral"],["Barn","Owners notice rival headlines.","warn"],["Market","Future odds may move.","neutral"],["Action","Track it. Do not react.","good"]],"moves":[["Open News","Read the full item.","News"],["Track rival","Add to watchlist.","Scout"],["Dismiss for now","Leave barn plan unchanged.","Steady"]]},"entries":{"source":"Race Calendar","due":"Deadline","type":"Entries / Calendar","title":"Entries close Saturday for Churchill R3","summary":"Entry window is closing. Doing nothing is a decision.","pressure":"High","risk":"Missed spot","read":"Clock ticking","image":"/assets/office/approved-office-visual.png","intel":[["Office","Entries close soon.","danger"],["Trainer","One behavior read would help.","neutral"],["Field","Usable, not soft.","warn"],["Calendar","Later is not guaranteed.","neutral"]],"moves":[["Enter now","Lock the spot.","Commit"],["Call trainer","Get a final barn read.","Check"],["Find alternate","Open calendar targets.","Route"]]},"cedar":{"source":"Cedar Spoke","due":"Clear","type":"Development","title":"Young horse turnout notes posted","summary":"Young group is fine, but a few need quieter handling.","pressure":"Low","risk":"Bad habits","read":"Quiet mgmt","image":"/assets/office/approved-office-visual.png","intel":[["Farm","Most fine. Some need quiet.","neutral"],["Body","Tempo issue, not soundness.","good"],["Staff","Quieter rider may help.","warn"],["Long View","Small quiet changes matter.","good"]],"moves":[["Clear note","Acknowledge and keep plan.","Clear"],["Adjust turnout","Change handling for immature group.","Tune"],["Open roster","Review all young horse timelines.","Roster"]]}};
const toast = document.getElementById('toast');
const els = {
  due: document.getElementById('deskDue'),
  source: document.getElementById('deskSource'),
  type: document.getElementById('deskType'),
  title: document.getElementById('deskTitle'),
  summary: document.getElementById('deskSummary'),
  pressure: document.getElementById('deskPressure'),
  risk: document.getElementById('deskRisk'),
  read: document.getElementById('deskRead'),
  image: document.getElementById('deskImage'),
  intel: document.getElementById('intelGrid'),
  moves: document.getElementById('moveGrid'),
  hint: document.getElementById('deskChoiceHint')
};
function showToast(label){
  if(!toast) return;
  toast.textContent = label;
  toast.classList.add('show');
  clearTimeout(window.__t);
  window.__t = setTimeout(()=>toast.classList.remove('show'), 900);
}
function loadDecision(key){
  const data = deskCases[key] || deskCases.powerline;
  document.querySelectorAll('.msg').forEach(m=>m.classList.toggle('selected', m.dataset.case===key));
  els.due.textContent = data.due;
  els.source.textContent = data.source;
  els.type.textContent = data.type;
  els.title.textContent = data.title;
  els.summary.textContent = data.summary;
  els.pressure.textContent = data.pressure;
  els.risk.textContent = data.risk;
  els.read.textContent = data.read;
  if(data.image) els.image.src = data.image;
  els.intel.innerHTML = data.intel.map(([role,body,tone]) => `
    <article class="intelCard ${tone}" data-act="Open ${role} intel">
      <b>${role}</b><p>${body}</p>
    </article>`).join('');
  els.moves.innerHTML = data.moves.map(([title,body,tag]) => `
    <button class="moveCard" data-act="Choose: ${title}">
      <span>${tag}</span><strong>${title}</strong>
    </button>`).join('');
  els.hint.textContent = '3 choices available';
  showToast('Decision Desk: ' + data.title.split(':')[0]);
}

document.querySelectorAll('.msg[data-case]').forEach(msg => {
  msg.addEventListener('click', (e)=>{
    e.stopPropagation();
    loadDecision(msg.dataset.case);
  });
});

document.body.addEventListener('click', (e)=>{
  const clickable = e.target.closest('button,[data-act]');
  if(!clickable) return;
  if(clickable.classList.contains('msg')) return;
  const label = clickable.getAttribute('data-act') || clickable.textContent.trim();
  showToast(label);
});

loadDecision('powerline');
