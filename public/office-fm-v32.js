/* Wire to Wire FM/OOTP-style Office layout: presentation only. No game state copy. */
(() => {
  'use strict';
  const body = document.body;
  if (!body || body.classList.contains('wtw-fm-v32')) return;
  const header = document.querySelector('header.top');
  const center = document.querySelector('main.main .mid');
  if (!header || !center || !header.querySelector('.navBlock') || !header.querySelector('.actions')) return;

  const nav = header.querySelector('.nav');
  const subnav = header.querySelector('.subnav');
  const brand = header.querySelector('.brand');
  const actions = header.querySelector('.actions');
  const loadFile = header.querySelector('#loadStateInput');
  if (!nav || !subnav || !brand || !loadFile) return;

  const primary = document.createElement('div');
  primary.className = 'wtwPrimaryBar';
  const mainActions = document.createElement('div');
  mainActions.className = 'wtwPrimaryActions';
  const utilityActions = document.createElement('div');
  utilityActions.className = 'wtwUtilityActions';
  const primaryActions = ['Back', 'Forward', 'Continue'];
  const utilityNames = ['Save', 'Load', 'Export', 'Reset'];
  for (const key of primaryActions) {
    const btn = actions.querySelector(`button[data-act="${key}"]`);
    if (btn) mainActions.appendChild(btn);
  }
  for (const key of utilityNames) {
    const btn = actions.querySelector(`button[data-act="${key}"]`);
    if (btn) utilityActions.appendChild(btn);
  }
  const secondary = document.createElement('div');
  secondary.className = 'wtwSecondaryBar';
  primary.append(brand, nav, mainActions);
  secondary.append(subnav, utilityActions);
  header.replaceChildren(primary, secondary, loadFile);

  const identity = document.createElement('section');
  identity.className = 'wtwOfficeIdentity panel';
  identity.setAttribute('aria-label', 'Racing office summary');
  identity.innerHTML = `
    <img class="wtwOfficeShield" src="/assets/profile-badges/v2/wtw_badge_horse.png" alt="" aria-hidden="true" />
    <div class="wtwOfficeHeadline">
      <span class="wtwOfficeEyebrow">WIRE TO WIRE · DAILY BRIEFING</span>
      <h2>Racing Office</h2>
      <p>Decisions, entries and horses requiring attention</p>
    </div>
    <div class="wtwOfficeSummary" aria-label="Office shortcuts">
      <button type="button" class="wtwQuickStat" data-act="Stable"><strong id="wtwBoardCount">—</strong><span>Stable board</span></button>
      <button type="button" class="wtwQuickStat" data-act="Open Race Calendar"><strong id="wtwScheduleCount">—</strong><span>Desk schedule</span></button>
    </div>`;
  const count = (selector) => document.querySelectorAll(selector).length;
  identity.querySelector('#wtwBoardCount').textContent = String(count('.boardRows .rankRow'));
  identity.querySelector('#wtwScheduleCount').textContent = String(count('.fixtureList .fixture'));
  center.insertBefore(identity, center.firstElementChild);

  // Keep the real decision, intelligence and action nodes with their original IDs and handlers.
  // Only the surrounding visual slots change. Existing Save/Load and decision outcomes are untouched.
  const inbox = document.querySelector('.left.messages');
  if (inbox) {
    inbox.setAttribute('aria-label', 'Racing office messages');
    const list = inbox.querySelector('.msgList');
    if (list) list.setAttribute('role','list');
  }
  body.classList.add('wtw-fm-v32');
})();