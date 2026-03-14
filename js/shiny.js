// ══════════════════════════════════════════════════════════════════════════════
// SHINY HUNTER — full rebuild
// ══════════════════════════════════════════════════════════════════════════════

// ── Storage keys ──────────────────────────────────────────────────────────────
const LSH = { HUNTS:'at_hunts2', HID:'at_hid2', LOG:'at_slog2', LID:'at_lid2' };
let hunts    = lsGet(LSH.HUNTS, []);
let nextHid  = lsGet(LSH.HID, 1);
let shinyLog = lsGet(LSH.LOG, []);
let nextLid  = lsGet(LSH.LID, 1);

// ── Accurate odds table ───────────────────────────────────────────────────────
// Each entry: { base, charm, notes }
// odds = 1/N chance per attempt
const METHODS = {
  'Random Encounter':   { base:4096, charm:1365, note:'Full odds wild encounter' },
  'Masuda Method':      { base:683,  charm:512,  note:'Two different language parents' },
  'DexNav Chaining':    { base:4096, charm:1365, note:'Chain up for better odds. At chain 40+: ~1/200 (no charm)' },
  'Poké Radar':         { base:200,  charm:200,  note:'Charm has no effect. Chain 40 required' },
  'SOS Chaining':       { base:4096, charm:1365, note:'At 30+ calls: ~1/315 (charm: ~1/100)' },
  'Outbreak':           { base:4096, charm:1365, note:'Mass Outbreak — SV with sparkling power boosts further' },
  'Sandwich Method':    { base:1365, charm:683,  note:'Herba Mystica sandwich active, SV' },
  'Fishing Chain':      { base:4096, charm:1365, note:'Chain fishing — chain 25+: much better odds' },
  'Friend Safari':      { base:512,  charm:512,  note:'Charm has no extra effect in Friend Safari' },
  'Soft Reset':         { base:4096, charm:1365, note:'Full odds reset' },
  'Static':             { base:4096, charm:1365, note:'Fixed static encounters' },
  'Dynamax Adventure':  { base:100,  charm:100,  note:'~1/100 regardless of charm (charm has no extra effect)' },
  'Legends: Arceus':    { base:4096, charm:1365, note:'Research level 10 and Shiny Charm stack' },
  'Community Day':      { base:25,   charm:25,   note:'Event boosted — charm has no effect' },
  'GO / HOME Transfer': { base:4096, charm:4096, note:'Chance locked to original game' },
};

// Runtime odds (accounts for game generation — Gen 1-5 use 1/8192, Gen 6+ use 1/4096)
function getOdds(method, hasCharm, game) {
  const m = METHODS[method] || METHODS['Random Encounter'];
  const baseOdds = hasCharm ? m.charm : m.base;
  // Scale up for old-gen games (Gen 1-5 have double the base odds)
  if (!hasCharm && OLD_ODDS_GAMES.has(game)) {
    return baseOdds * 2; // 4096 → 8192, 683 → 1366, etc.
  }
  return baseOdds;
}

// Probability of having found at least one shiny in n attempts at 1/odds
function probByNow(n, odds) {
  if (n <= 0) return 0;
  return 1 - Math.pow(1 - 1/odds, n);
}

// ── Active hunt state ─────────────────────────────────────────────────────────
let currentShinyTab  = 'hunts';
let foundHuntId      = null;
let phaseHuntId      = null;

function shinyTab(tab) {
  currentShinyTab = tab;
  ['hunts','log','stats'].forEach(t => {
    const btn = document.getElementById('stab-' + t);
    const pane = document.getElementById('sh-' + t);
    if (btn)  btn.classList.toggle('active', t === tab);
    if (pane) pane.style.display = t === tab ? 'block' : 'none';
  });
  if (tab === 'hunts') { renderHuntStats(); renderHunts(); }
  if (tab === 'log')   renderShinyLog();
  if (tab === 'stats') renderShinyStats();
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function renderHuntStats() {
  const active  = hunts.filter(h => h.status === 'active');
  const allDone = shinyLog;
  const totalEnc = hunts.reduce((s, h) => s + h.count, 0);
  const longest  = hunts.reduce((max, h) => h.count > max ? h.count : max, 0);

  const stats = [
    { v: active.length,               l: 'Active Hunts',      c: '#c4b5fd' },
    { v: allDone.length,              l: 'Shinies Found',     c: '#fde68a' },
    { v: totalEnc.toLocaleString(),   l: 'Total Encounters',  c: '#93c5fd' },
    { v: longest ? longest.toLocaleString() : '—', l: 'Longest Hunt', c: '#fda4af' },
  ];
  document.getElementById('huntStats').innerHTML = stats.map(s =>
    `<div class="hunt-stat-card"><div class="hsc-val" style="color:${s.c}">${s.v}</div><div class="hsc-lbl">${s.l}</div></div>`
  ).join('');
}

// ── Render all active hunts ───────────────────────────────────────────────────
function renderHunts() {
  const active = hunts.filter(h => h.status === 'active');
  const el = document.getElementById('activeHunts');
  if (!active.length) {
    el.innerHTML = `<div class="empty-state">No active hunts yet.<br/><span style="font-size:12px;color:#5b4690">Start one below!</span></div>`;
    return;
  }
  el.innerHTML = active.map(h => huntCard(h)).join('');
}

function huntCard(h) {
  const bc      = BALLS[h.ball] || BALLS.Moon;
  const odds    = getOdds(h.method, h.hasCharm, h.game);
  const prob    = probByNow(h.count, odds);
  // Bar fills by encounter count relative to odds — so "at odds" = bar full
  const pct      = Math.min(h.count / odds * 100, 100);
  const overOdds = h.count > odds;
  const shinySprite = poke(h.species, true);
  const normSprite  = poke(h.species, false);

  // Phase summary
  const phases = h.phases || [];
  const phaseHTML = phases.length > 0 ? `
    <div class="phases-row">
      <div class="phases-header">
        <span>Phases (${phases.length})</span>
        <span style="color:#5b4690">Total: ${h.count.toLocaleString()} encounters</span>
      </div>
      <div class="phase-chips">
        ${phases.map((p, i) => {
          const isCurrent = i === phases.length - 1;
          const isLogged  = !isCurrent && !p.failedCatch;
          const isFailed  = !isCurrent && p.failedCatch;
          return `
          <div class="phase-chip ${isCurrent ? 'current' : ''} ${isFailed ? 'phase-failed' : ''} ${isLogged ? 'phase-logged' : ''}">
            <span class="pc-num">P${i+1}</span>
            <span class="pc-cnt">${p.count.toLocaleString()} enc</span>
            ${isLogged ? `<span class="pc-logged-note">★ ${p.species !== h.species ? p.species : h.species}</span>` : ''}
            ${isFailed ? `<span class="pc-logged-note" style="color:#fda4af88">💔 fled</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // Progress bar — cap fill at 100% but show "over" styling
  const barColor = overOdds
    ? 'linear-gradient(90deg,#c084fc,#fda4af,#f43f5e)'
    : prob > 0.5
      ? 'linear-gradient(90deg,#c084fc,#fde68a)'
      : 'linear-gradient(90deg,#818cf8,#c084fc)';

  // Days elapsed
  const days = h.startDate ? Math.floor((Date.now() - new Date(h.startDate)) / 86400000) : 0;

  return `
  <div class="hunt-card ${overOdds ? 'over-odds' : ''}" id="hcard-${h.id}">
    <div class="hunt-card-accent"></div>
    <div class="hunt-card-top">
      <div class="hunt-sprite-wrap" onclick="openDex('${h.species}')" title="View Dex entry">
        <div style="position:absolute;inset:4px;border-radius:50%;filter:blur(8px);background:radial-gradient(circle,${bc.accent}33,transparent)"></div>
        ${shinySprite ? `<img src="${shinySprite}" width="68" height="68" style="image-rendering:pixelated;position:relative;z-index:1;transition:transform .2s;filter:drop-shadow(0 0 10px #fde68a88)" onerror="this.style.display='none'"/>` : `<div style="font-size:32px;position:relative;z-index:1">❓</div>`}
      </div>
      <div class="hunt-meta">
        <div class="hunt-species">${h.species}</div>
        <div class="hunt-badges">
          ${bImg(h.ball, 18)} <span style="color:${bc.light};font-size:11px;font-weight:700">${h.ball} Ball</span>
          ${overOdds ? `<span class="over-odds-pill">⚡ Over Odds</span>` : ''}
          ${h.hasCharm ? `<span class="hunt-badge" style="color:#fde68a;border-color:#fde68a44;background:#fde68a0a">✨ Charm</span>` : ''}
        </div>
        <div class="hunt-detail">${h.method} · ${h.game}${days > 0 ? ` · ${days}d` : ' · today'}</div>
        ${h.notes ? `<div class="hunt-notes">${h.notes}</div>` : ''}
      </div>
    </div>

    <!-- Progress bar -->
    <div class="hunt-progress">
      <div class="progress-header">
        <span class="progress-label">1/${odds.toLocaleString()} odds${h.hasCharm ? ' ✨' : ''}</span>
        <span class="progress-prob" style="color:${overOdds ? '#fda4af' : prob > 0.63 ? '#fde68a' : '#c4b5fd'}">${(prob * 100).toFixed(1)}% probability</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" id="pfill-${h.id}" style="width:${pct}%;background:${barColor}"></div>
        <div class="progress-marker" style="left:33.3%"></div>
        <div class="progress-marker" style="left:66.6%"></div>
        <div class="progress-marker at-odds" style="left:calc(100% - 1px)" title="At odds"></div>
      </div>
      <div class="progress-counts">
        <span style="color:#7060a8">${h.count.toLocaleString()} / ${odds.toLocaleString()} encounters</span>
        <span style="color:${overOdds?'#fda4af':'#5b4690'}">${overOdds ? `+${(h.count - odds).toLocaleString()} over odds` : `${(odds - h.count).toLocaleString()} to odds`}</span>
      </div>
    </div>

    ${phaseHTML}

    <!-- Counter -->
    <div style="margin:14px 16px 0;background:#1a1230;border-radius:14px;overflow:hidden">
      <!-- Big +1 tap zone -->
      <div onclick="bump(${h.id})" id="cnum-${h.id}" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px 16px 18px;cursor:pointer;user-select:none;transition:background .1s;background:transparent;border-bottom:1px solid #5b469022;position:relative" onmouseenter="this.style.background='#c084fc0a'" onmouseleave="this.style.background='transparent'" onmousedown="this.style.background='#c084fc18'" onmouseup="this.style.background='#c084fc0a'">
        <div style="font-family:'Cinzel',serif;font-size:64px;font-weight:900;line-height:1;background:linear-gradient(135deg,#fde68a,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;transition:transform .08s;pointer-events:none">${h.count.toLocaleString()}</div>
        <div style="color:#5b4690;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-top:8px;pointer-events:none">tap anywhere here to count</div>
      </div>
      <!-- Adjustment controls -->
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:0;border-bottom:1px solid #5b469022">
        <button class="cc-btn" onclick="adj(${h.id},-100)" style="border-radius:0;border:none;border-right:1px solid #5b469022;padding:9px 0;font-size:11px">−100</button>
        <button class="cc-btn" onclick="adj(${h.id},-10)"  style="border-radius:0;border:none;border-right:1px solid #5b469022;padding:9px 0;font-size:11px">−10</button>
        <button class="cc-btn" onclick="adj(${h.id},-1)"   style="border-radius:0;border:none;border-right:1px solid #5b469022;padding:9px 0;font-size:13px">−1</button>
        <button class="cc-btn" onclick="adj(${h.id},1)"    style="border-radius:0;border:none;border-right:1px solid #5b469022;padding:9px 0;font-size:13px">+1</button>
        <button class="cc-btn" onclick="adj(${h.id},10)"   style="border-radius:0;border:none;border-right:1px solid #5b469022;padding:9px 0;font-size:11px">+10</button>
        <button class="cc-btn" onclick="adj(${h.id},100)"  style="border-radius:0;border:none;padding:9px 0;font-size:11px">+100</button>
      </div>
      <!-- Actions row -->
      <div style="display:flex;gap:0">
        <button class="cc-btn" onclick="setCount(${h.id})" style="border-radius:0 0 0 14px;border:none;border-right:1px solid #5b469022;padding:10px 0;flex:1;font-size:11px">✎ Set Count</button>
        <button class="cc-btn found-btn" onclick="openFoundModal(${h.id})" style="border-radius:0 0 14px 0;border:none;flex:2;padding:10px 0">★ Found It!</button>
        </div>
      </div>
    </div>

    <!-- Footer actions -->
    <div class="hunt-card-footer">
      <button class="hcf-btn" onclick="openPhaseModal(${h.id})">📍 Log Phase</button>
      <button class="hcf-btn" style="color:#fda4af88;border-color:#fda4af22" onmouseover="this.style.color='#fda4af';this.style.background='#3a1020';this.style.borderColor='#fda4af44'" onmouseout="this.style.color='#fda4af88';this.style.background='';this.style.borderColor='#fda4af22'" onclick="openFailedModal(${h.id})">💔 Failed Catch</button>
      <button class="hcf-btn" onclick="openDex('${h.species}')">📖 Dex</button>
      <button class="hcf-btn danger" onclick="abandonHunt(${h.id})">✕ Abandon</button>
    </div>
  </div>`;
}

// ── Counter actions (optimistic DOM update for smoothness) ────────────────────
function bump(id) {
  const h = hunts.find(x => x.id === id); if (!h) return;
  h.count++;
  if (h.phases?.length) h.phases[h.phases.length - 1].count++;
  lsSet(LSH.HUNTS, hunts);
  refreshCardCounter(h);
}

function adj(id, delta) {
  const h = hunts.find(x => x.id === id); if (!h) return;
  h.count = Math.max(0, h.count + delta);
  lsSet(LSH.HUNTS, hunts);
  renderHuntStats();
  renderHunts(); // full re-render needed for progress bar
}

function setCount(id) {
  const h = hunts.find(x => x.id === id); if (!h) return;
  const v = prompt(`Set encounter count for ${h.species}:`, h.count);
  if (v === null) return;
  const n = parseInt(v);
  if (!isNaN(n) && n >= 0) { h.count = n; lsSet(LSH.HUNTS, hunts); renderHuntStats(); renderHunts(); }
}

function refreshCardCounter(h) {
  // Fast path: just update the number and progress bar in-place
  const odds   = getOdds(h.method, h.hasCharm, h.game);
  const prob   = probByNow(h.count, odds);
  const pct    = Math.min(h.count / odds * 100, 100);
  const overOdds = h.count > odds;

  const cnum = document.getElementById('cnum-' + h.id);
  if (cnum) {
    const numEl = cnum.querySelector('div');
    if (numEl) numEl.textContent = h.count.toLocaleString();
  }

  const fill = document.getElementById('pfill-' + h.id);
  if (fill) {
    fill.style.width = pct + '%';
    fill.style.background = overOdds
      ? 'linear-gradient(90deg,#c084fc,#fda4af,#f43f5e)'
      : prob > 0.5 ? 'linear-gradient(90deg,#c084fc,#fde68a)'
      : 'linear-gradient(90deg,#818cf8,#c084fc)';
  }

  // Mark card as over-odds
  const card = document.getElementById('hcard-' + h.id);
  if (card && overOdds && !card.classList.contains('over-odds')) {
    card.classList.add('over-odds');
    renderHunts(); // re-render to show over-odds pill
  }

  renderHuntStats();
}

// ── New hunt modal ─────────────────────────────────────────────────────────────
function openNewHuntModal() {
  setTimeout(() => initSpeciesAC('nh-species', (name) => {
    const prev = document.getElementById('nhSpritePreview');
    if (prev) prev.src = `https://img.pokemondb.net/sprites/home/normal/${name}.png`;
  }), 50);
  document.getElementById('nh-species').value = '';
  document.getElementById('nh-notes').value   = '';
  document.getElementById('nh-charm').checked = false;
  nhPreview();
  showModal('newHuntModal');
}
function closeNewHuntModal() { hideModal('newHuntModal'); }

function nhPreview() {
  const method   = document.getElementById('nh-method')?.value;
  const hasCharm = document.getElementById('nh-charm')?.checked;
  if (!method) return;
  const m    = METHODS[method] || METHODS['Random Encounter'];
  const odds = hasCharm ? m.charm : m.base;
  document.getElementById('nh-odds-num').textContent = `1 / ${odds.toLocaleString()}`;
  document.getElementById('nh-odds-lbl').textContent = m.note + (hasCharm ? ' + charm' : '');
  // Animate charm toggle
  const track = document.getElementById('nh-charm-track');
  const thumb = document.getElementById('nh-charm-thumb');
  if (track && thumb) {
    track.style.background = hasCharm ? '#fde68a33' : '#2b1f4e';
    track.style.borderColor = hasCharm ? '#fde68a66' : '#5b4690';
    thumb.style.left = hasCharm ? '21px' : '3px';
    thumb.style.background = hasCharm ? '#fde68a' : '#5b4690';
  }
}

function startHunt() {
  const species = document.getElementById('nh-species').value.trim();
  if (!species) { alert('Please enter a Pokémon species!'); return; }

  const method   = document.getElementById('nh-method').value;
  const ball     = document.getElementById('nh-ball').value;
  const game     = document.getElementById('nh-game').value;
  const hasCharm = document.getElementById('nh-charm').checked;
  const notes    = document.getElementById('nh-notes').value.trim();

  const hunt = {
    id:        nextHid++,
    species,
    ball,
    method,
    game,
    hasCharm,
    notes,
    count:     0,
    phases:    [{ species, count: 0, startedAt: today() }],
    startDate: today(),
    status:    'active',
  };

  hunts.push(hunt);
  lsSet(LSH.HUNTS, hunts);
  lsSet(LSH.HID, nextHid);
  closeNewHuntModal();
  updateShinyBadge();
  renderHuntStats();
  renderHunts();
}

// ── Phase modal ───────────────────────────────────────────────────────────────
function openPhaseModal(id) {
  phaseHuntId = id;
  const h = hunts.find(x => x.id === id); if (!h) return;
  // Pre-fill with hunt target but leave editable
  document.getElementById('phase-species').value = h.species;
  document.getElementById('phase-count').value   = h.count;
  document.getElementById('phase-notes').value   = '';
  updatePhasePreview();
  showModal('phaseModal');
  setTimeout(() => initSpeciesAC('phase-species', (name) => {
    document.getElementById('phase-species').value = name;
    updatePhasePreview();
  }), 100);
}
function closePhaseModal() { hideModal('phaseModal'); phaseHuntId = null; }

function updatePhasePreview() {
  const species = document.getElementById('phase-species')?.value.trim();
  const nameEl  = document.getElementById('phase-preview-name');
  const subEl   = document.getElementById('phase-preview-sub');
  const inner   = document.getElementById('phase-sprite-inner');
  if (!species) {
    if (nameEl) nameEl.textContent = '—';
    if (subEl)  subEl.textContent  = 'Enter a species above';
    if (inner)  inner.textContent  = '★';
    return;
  }
  if (nameEl) nameEl.textContent = species;
  const alreadyHave = shinyLog.some(l => l.species.toLowerCase() === species.toLowerCase())
    || mons.some(m => m.isShiny && m.species.toLowerCase() === species.toLowerCase());
  if (subEl) subEl.textContent = alreadyHave ? '✓ Already in your shiny log' : '✨ New shiny for your log!';

  const src = poke(species, true);
  if (src) {
    const img = new Image();
    img.onload = () => {
      if (inner) inner.innerHTML = `<img src="${src}" width="48" height="48" style="image-rendering:pixelated;filter:drop-shadow(0 0 8px #fde68a88)"/>`;
    };
    img.src = src;
  } else {
    if (inner) inner.textContent = '★';
  }
}

function confirmPhase() {
  if (!phaseHuntId) return;
  const h = hunts.find(x => x.id === phaseHuntId); if (!h) return;

  const pSpecies = document.getElementById('phase-species').value.trim() || h.species;
  const pCount   = parseInt(document.getElementById('phase-count').value) || 0;
  const pNature  = document.getElementById('phase-nature').value;
  const pGender  = document.getElementById('phase-gender').value;
  const pNotes   = document.getElementById('phase-notes').value.trim();

  // Seal off current phase record
  if (!h.phases) h.phases = [];
  if (h.phases.length) {
    h.phases[h.phases.length - 1].count   = pCount;
    h.phases[h.phases.length - 1].species = pSpecies;
  }
  // Start new phase
  h.phases.push({ species: h.species, count: 0, startedAt: today() });

  lsSet(LSH.HUNTS, hunts);

  // ── Add phase shiny to log ────────────────────────────────────────────────
  const logEntry = {
    id:      nextLid++,
    species: pSpecies,
    ball:    h.ball,   // same ball as hunt (they're hunting in the same area)
    method:  h.method,
    game:    h.game,
    count:   pCount,
    nature:  pNature,
    gender:  pGender,
    notes:   pNotes || `Phase ${h.phases.length - 1} of ${h.species} hunt`,
    date:    today(),
    huntId:      h.id,
    isPhase:     true,
    phaseNum:    h.phases.length - 1,
    huntSpecies: h.species,
    odds:        getOdds(h.method, false, h.game),
  };
  shinyLog.unshift(logEntry);
  lsSet(LSH.LOG, shinyLog);
  lsSet(LSH.LID, nextLid);

  // ── Update dex for phase Pokémon ──────────────────────────────────────────
  if (!dexData[pSpecies]) dexData[pSpecies] = { caught: false, shinyFound: false, encounters: [] };
  dexData[pSpecies].caught     = true;
  dexData[pSpecies].shinyFound = true;
  dexData[pSpecies].encounters.unshift({
    id:      Date.now(),
    date:    today(),
    method:  h.method,
    game:    h.game,
    notes:   `✨ Phase shiny during ${h.species} hunt — ${pCount.toLocaleString()} encounter${pCount !== 1 ? 's' : ''}${pNotes ? ' — ' + pNotes : ''}`,
    isShiny: true,
  });
  lsSet(LS.D, dexData);

  closePhaseModal();
  renderHunts();
}

// ── Found modal ───────────────────────────────────────────────────────────────
function openFoundModal(id) {
  foundHuntId = id;
  const h = hunts.find(x => x.id === id); if (!h) return;
  document.getElementById('found-sub').textContent =
    `${h.species} · ${h.count.toLocaleString()} encounters · ${h.method}`;
  document.getElementById('found-notes').value = '';

  // Show shiny sprite
  const wrap = document.getElementById('found-sprite-wrap');
  const src  = poke(h.species, true);
  wrap.innerHTML = src
    ? `<div style="position:absolute;inset:0;border-radius:50%;filter:blur(12px);background:radial-gradient(circle,#fde68a44,transparent)"></div>
       <img src="${src}" width="100" height="100" style="image-rendering:pixelated;position:relative;z-index:1;filter:drop-shadow(0 0 16px #fde68aaa)" onerror="this.style.display='none'"/>`
    : `<div style="font-size:48px;filter:drop-shadow(0 0 8px #fde68a)">★</div>`;

  showModal('foundModal');
}
function closeFoundModal() { hideModal('foundModal'); foundHuntId = null; }

function confirmFound() {
  if (!foundHuntId) return;
  const h = hunts.find(x => x.id === foundHuntId); if (!h) return;

  const nature = document.getElementById('found-nature').value;
  const gender = document.getElementById('found-gender').value;
  const notes  = document.getElementById('found-notes').value.trim();
  const odds   = getOdds(h.method, h.hasCharm, h.game);
  const prob   = probByNow(h.count, odds);

  // Mark hunt complete
  h.status  = 'found';
  h.endDate = today();
  h.nature  = nature;
  h.gender  = gender;
  if (notes) h.foundNotes = notes;
  lsSet(LSH.HUNTS, hunts);

  // Add to shiny log
  const entry = {
    id:       nextLid++,
    species:  h.species,
    ball:     h.ball,
    method:   h.method,
    game:     h.game,
    count:    h.count,
    nature,
    gender,
    notes:    notes || h.notes || '',
    date:     today(),
    huntId:   h.id,
    hasCharm: h.hasCharm,
    odds,
    prob,
  };
  shinyLog.unshift(entry);
  lsSet(LSH.LOG, shinyLog);
  lsSet(LSH.LID, nextLid);

  // ── Auto-update Dex entry ──────────────────────────────────────────────────
  const sp = h.species;
  if (!dexData[sp]) dexData[sp] = { caught: false, shinyFound: false, encounters: [] };
  dexData[sp].caught     = true;
  dexData[sp].shinyFound = true;
  // Add a shiny encounter record
  dexData[sp].encounters.unshift({
    id:      Date.now(),
    date:    today(),
    method:  h.method,
    game:    h.game,
    notes:   `✨ Found shiny after ${h.count.toLocaleString()} encounter${h.count !== 1 ? 's' : ''}${notes ? ' — ' + notes : ''}`,
    isShiny: true,
  });
  lsSet(LS.D, dexData);

  closeFoundModal();
  updateShinyBadge();
  renderHuntStats();
  renderHunts();
}

function abandonHunt(id) {
  if (!confirm('Abandon this hunt? It will be removed from your active hunts.')) return;
  hunts = hunts.filter(h => h.id !== id);
  lsSet(LSH.HUNTS, hunts);
  updateShinyBadge();
  renderHuntStats();
  renderHunts();
}

// renderShinyLog now defined in failed catch section above

// ── Quick log modal ───────────────────────────────────────────────────────────
function openQuickLogModal() {
  document.getElementById('ql-date').value = today();
  showModal('quickLogModal');
}
function closeQuickLogModal() { hideModal('quickLogModal'); }

function saveQuickLog() {
  const species = document.getElementById('ql-species').value.trim();
  if (!species) { alert('Species required'); return; }
  const count = parseInt(document.getElementById('ql-count').value) || 0;
  const method = document.getElementById('ql-method').value;
  const entry = {
    id:      nextLid++,
    species,
    ball:    document.getElementById('ql-ball').value,
    method,
    game:    document.getElementById('ql-game').value,
    count,
    nature:  document.getElementById('ql-nature').value,
    gender:  document.getElementById('ql-gender').value,
    notes:   document.getElementById('ql-notes').value.trim(),
    date:    document.getElementById('ql-date').value,
    odds:    getOdds(method, false, document.getElementById('ql-game').value),
  };
  shinyLog.unshift(entry);
  lsSet(LSH.LOG, shinyLog);
  lsSet(LSH.LID, nextLid);

  // Update dex
  if (!dexData[species]) dexData[species] = { caught: false, shinyFound: false, encounters: [] };
  dexData[species].caught = true;
  dexData[species].shinyFound = true;
  dexData[species].encounters.unshift({
    id: Date.now(), date: entry.date, method: entry.method, game: entry.game,
    notes: `✨ Manually logged${entry.count ? ' · ' + entry.count.toLocaleString() + ' encounters' : ''}${entry.notes ? ' — ' + entry.notes : ''}`,
    isShiny: true,
  });
  lsSet(LS.D, dexData);

  closeQuickLogModal();
  renderShinyLog();
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; }

// ── Utilities ─────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().slice(0, 10); }

function updateShinyBadge() {
  const count = hunts.filter(h => h.status === 'active').length;
  const badge = document.getElementById('shinyBadge');
  if (badge) { badge.textContent = count || ''; badge.style.display = count ? 'inline-flex' : 'none'; }
}



// ── Section Navigation ────────────────────────────────────────────────────────
const SECTIONS = {
  home:        { el:'home-section',       name:'Home',          sub:'Your Pokémon dashboard',         action:null },
  aprimon:     { el:'aprimon-section',    name:'Aprimon',       sub:'Manage your Apriball collection', action:'+ Add Aprimon' },
  shiny:       { el:'shiny-section',      name:'Shiny Hunter',  sub:'Hunt and log your shinies',       action:'🎯 New Hunt' },
  livingdex:   { el:'livingdex-section',  name:'Living Dex',    sub:'Track every Pokémon',             action:null },
  breeding:    { el:'breeding-section',   name:'Breeding',      sub:'Plan and track breeding projects', action:'+ New Project' },
  competitive: { el:'competitive-section',name:'Tools',         sub:'Calculators and helpers',         action:null },
  progress:    { el:'progress-section',   name:'Game Progress', sub:'Track your journey',              action:null },
  halloffame:  { el:'halloffame-section', name:'Hall of Fame',  sub:'Legendary achievements unlocked',  action:null },
  pokedex:     { el:'pokedex-section',    name:'Pokédex',       sub:'Look up any Pokémon',             action:null },
  about:       { el:'about-section',      name:'About',         sub:'Meet the dev & credits',          action:null },
};
let currentSection = 'home';

function goSection(section) {
  currentSection = section;
  // Hide all section pages
  Object.values(SECTIONS).forEach(s => {
    const el = document.getElementById(s.el);
    if (el) el.style.display = 'none';
  });
  // Show target
  const sec = SECTIONS[section];
  if (!sec) return;
  const el = document.getElementById(sec.el);
  if (el) el.style.display = 'block';
  // Update sidebar active
  document.querySelectorAll('.sn-item').forEach(b => b.classList.remove('active'));
  const snEl = document.getElementById('sn-' + section);
  if (snEl) snEl.classList.add('active');
  // Update top bar
  document.getElementById('tbSectionName').textContent = sec.name;
  document.getElementById('tbSectionSub').textContent  = sec.sub;
  // Update action button
  const actionBtn = document.getElementById('headerActionBtn');
  if (sec.action) {
    actionBtn.style.display = 'inline-flex';
    actionBtn.textContent = sec.action;
  } else {
    actionBtn.style.display = 'none';
  }
  // Section-specific renders
  if (section === 'home')    renderDashboard();
  if (section === 'aprimon') { renderStats(); renderBallFilter(); renderList(); }
  if (section === 'shiny')     { renderHuntStats(); renderHunts(); }
  if (section === 'livingdex') renderLivingDex();
  if (section === 'breeding')  renderBreeding();
  if (section === 'halloffame') renderHallOfFame();
  if (section === 'competitive') initCatchRateCalc();
  if (section === 'pokedex')    initPdexPage();
  if (section === 'about')      renderAbout();
}

function headerAction() {
  if (currentSection === 'shiny')    { openNewHuntModal(); return; }
  if (currentSection === 'aprimon')  { openAddModal(); return; }
  if (currentSection === 'breeding') { openNewBreedModal(); return; }
  openAddModal();
}

// Aprimon sub-tabs
let currentApriTab = 'collection';
function switchApriTab(tab) {
  currentApriTab = tab;
  document.querySelectorAll('.section-subtab').forEach(b => b.classList.remove('active'));
  const el = document.getElementById('atab-' + tab);
  if (el) el.classList.add('active');
  document.getElementById('collection-page').style.display = tab === 'collection' ? 'block' : 'none';
  document.getElementById('wants-page').style.display      = tab === 'wants'      ? 'block' : 'none';
  const actionBtn = document.getElementById('headerActionBtn');
  actionBtn.textContent = tab === 'wants' ? '+ Add Wanted' : '+ Add Aprimon';
  if (tab === 'wants') renderWants();
}

// Legacy switchTab shim (used in old code)
function switchTab(tab) {
  if (tab === 'shiny')      { goSection('shiny');   return; }
  if (tab === 'collection') { goSection('aprimon'); switchApriTab('collection'); return; }
  if (tab === 'wants')      { goSection('aprimon'); switchApriTab('wants'); return; }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderDashboard() {
  const activeHunts = hunts.filter(h => h.status === 'active').length;
  const totalShinies = shinyLog.length + mons.filter(m => m.isShiny).length;
  const groups = group(mons);
  const stats = [
    { v: groups.length,                                          l:'Aprimon Species',  c:'#c4b5fd', s:'aprimon'     },
    { v: mons.filter(m=>m.tradeStatus==='available').length,     l:'Available to Trade',c:'#93c5fd', s:'aprimon'    },
    { v: new Set(mons.map(m=>m.ball)).size,                      l:'Ball Types',        c:'#f9a8d4', s:'aprimon'    },
    { v: activeHunts,                                            l:'Active Hunts',      c:'#fde68a', s:'shiny'      },
    { v: totalShinies,                                           l:'Total Shinies',     c:'#fbbf24', s:'shiny'      },
  ];
  document.getElementById('dashStatsGrid').innerHTML = stats.map(s =>
    `<div class="dash-stat" onclick="goSection('${s.s}')" title="Go to ${s.s}">
      <div class="dash-stat-val" style="color:${s.c}">${s.v}</div>
      <div class="dash-stat-lbl">${s.l}</div>
    </div>`
  ).join('');

  // Recent activity
  const activities = buildActivityFeed();
  const actHTML = activities.length
    ? activities.map(a => `<div class="activity-item">
        <div class="activity-dot" style="background:${a.color}"></div>
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>`).join('')
    : '<div style="color:#5b4690;font-size:12px;padding:12px 0">No recent activity yet.</div>';

  // Quick links
  const quickLinks = [
    { icon:'🎾', s:'aprimon',     title:'Aprimon Collection',   sub:`${groups.length} species · ${mons.length} entries` },
    { icon:'✨', s:'shiny',       title:'Shiny Hunter',         sub:`${activeHunts} active hunt${activeHunts!==1?'s':''} · ${totalShinies} found` },
    { icon:'📊', s:'livingdex',   title:'Living Dex',           sub:`${Object.values(ldexData).filter(d=>d.caught).length} / 1,025 caught` },
    { icon:'⚔️', s:'competitive', title:'Competitive Builder',  sub:'Coming soon' },
    { icon:'🗺️', s:'progress',    title:'Game Progress',        sub:'Coming soon' },
  ];
  const qlHTML = quickLinks.map(ql =>
    `<div class="quick-link" onclick="goSection('${ql.s}')">
      <div class="quick-link-icon">${ql.icon}</div>
      <div class="quick-link-text"><div class="ql-title">${ql.title}</div><div class="ql-sub">${ql.sub}</div></div>
      <div class="quick-link-arrow">›</div>
    </div>`
  ).join('');

  document.getElementById('dashBody').classList.add('dash-body'); document.getElementById('dashBody').innerHTML = `
    <div class="dash-card">
      <div class="dash-card-title">⚡ Recent Activity</div>
      ${actHTML}
    </div>
    <div class="dash-card">
      <div class="dash-card-title">🔗 Quick Links</div>
      ${qlHTML}
    </div>`;
}

const FAILED_FLAVOUR = {
  'fled':         f => `💔 Shiny ${f.species} fled after ${f.count?.toLocaleString()||'?'} encounters. Gone forever.`,
  'ko':           f => `💀 Accidentally KO'd a shiny ${f.species}${f.count ? ' at ' + f.count.toLocaleString() + ' encounters' : ''}. Moment of silence.`,
  'out-of-balls': f => `🎾 Ran out of balls on a shiny ${f.species}. It just walked away.`,
  'reset':        f => `💾 Soft reset a shiny ${f.species}${f.count ? ' after ' + f.count.toLocaleString() + ' encounters' : ''}. Muscle memory is a curse.`,
  'crash':        f => `💻 Game crashed on a shiny ${f.species}. The universe is cruel.`,
  'chain-broke':  f => `🔗 Chain broke on a shiny ${f.species} at ${f.count?.toLocaleString()||'?'} encounters. Start over.`,
  'other':        f => `😭 Lost a shiny ${f.species}${f.count ? ' after ' + f.count.toLocaleString() + ' encounters' : ''}. It hurts.`,
};

function buildActivityFeed() {
  const events = [];

  [...mons].sort((a,b) => b.id - a.id).slice(0,3).forEach(m => {
    events.push({ date: null, priority: 4, text: 'Added ' + (m.isShiny ? '★ ' : '') + m.species + ' in ' + m.ball + ' Ball', color:'#c4b5fd', time:'recently' });
  });

  shinyLog.slice(0,3).forEach(l => {
    events.push({ date: l.date, priority: 2, text: '✨ Caught shiny ' + l.species + ' after ' + (l.count?.toLocaleString()||'?') + ' encounters', color:'#fde68a', time: l.date || 'recently' });
  });

  hunts.filter(h=>h.status==='active').slice(0,2).forEach(h => {
    events.push({ date: h.startDate, priority: 2, text: '🎯 Hunting ' + h.species + ' — ' + h.count.toLocaleString() + ' encounters so far', color:'#c4b5fd', time:'active' });
  });

  // Failed catches — always visible, always painful, sorted to the top
  failedCatches.slice(0,3).forEach(f => {
    const fn = FAILED_FLAVOUR[f.reason] || FAILED_FLAVOUR['other'];
    events.push({ date: f.date, priority: 1, text: fn(f), color:'#fda4af', time: f.date || 'recently' });
  });

  // Sort: failures first (priority 1), then by recency
  events.sort((a,b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.date && b.date) return new Date(b.date) - new Date(a.date);
    return 0;
  });

  return events.slice(0, 8);
}

// updateShinyBadge defined in nav section
function updateWantsBadge() {
  const count = mons.filter(m => m.tradeStatus === 'wanted').length;
  ['wantsBadge','aprimonBadge'].forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.textContent = count || ''; b.style.display = count ? 'inline-flex' : 'none'; }
  });
}


// ── Failed Catches ────────────────────────────────────────────────────────────
const LSF = { FAILS:'at_fails', FID:'at_fid' };
let failedCatches = lsGet(LSF.FAILS, []);
let nextFid       = lsGet(LSF.FID, 1);
let failedHuntId  = null;
let currentLogTab = 'caught';

function openFailedModal(id) {
  failedHuntId = id;
  const h = hunts.find(x => x.id === id); if (!h) return;
  document.getElementById('failed-sub').textContent   = `${h.species} · ${h.count.toLocaleString()} encounters · ${h.method}`;
  document.getElementById('failed-species').value     = h.species;
  document.getElementById('failed-count').value       = h.count;
  document.getElementById('failed-notes').value       = '';
  updateFailedSprite();
  showModal('failedModal');
}
function closeFailedModal() { hideModal('failedModal'); failedHuntId = null; }

function updateFailedSprite() {
  const species = document.getElementById('failed-species')?.value.trim();
  const wrap    = document.getElementById('failed-sprite-wrap');
  if (!wrap) return;
  const src = species ? poke(species, true) : null;
  wrap.innerHTML = src
    ? `<div style="position:absolute;inset:0;border-radius:50%;filter:blur(12px);background:radial-gradient(circle,#fda4af22,transparent)"></div>
       <img src="${src}" width="100" height="100" style="image-rendering:pixelated;position:relative;z-index:1;filter:grayscale(.5) drop-shadow(0 0 12px #fda4af88)" onerror="this.style.display='none'"/>`
    : `<div style="font-size:48px">💔</div>`;
}

function confirmFailed() {
  const h = failedHuntId ? hunts.find(x => x.id === failedHuntId) : null;
  const species = document.getElementById('failed-species').value.trim();
  if (!species) { alert('Species required'); return; }

  const reason = document.getElementById('failed-reason').value;
  const count  = parseInt(document.getElementById('failed-count').value) || (h?.count || 0);
  const notes  = document.getElementById('failed-notes').value.trim();

  const reasonLabels = {
    'fled': 'It fled', 'ko': "Accidentally KO'd", 'out-of-balls': 'Ran out of balls',
    'reset': 'Lost to soft reset', 'crash': 'Game crashed', 'chain-broke': 'Chain broke', 'other': 'Other'
  };

  const entry = {
    id:       nextFid++,
    species,
    method:   h?.method || 'Unknown',
    game:     h?.game   || '',
    count,
    reason,
    reasonLabel: reasonLabels[reason] || reason,
    notes,
    date:     today(),
    huntId:   h?.id || null,
    isFailed: true,
  };

  failedCatches.unshift(entry);
  lsSet(LSF.FAILS, failedCatches);
  lsSet(LSF.FID,   nextFid);

  // Close the current phase and start a new one on the active hunt
  if (h) {
    if (!h.phases) h.phases = [];
    if (h.phases.length) {
      h.phases[h.phases.length - 1].count      = count;
      h.phases[h.phases.length - 1].failedCatch = true;
      h.phases[h.phases.length - 1].endedAt    = today();
    }
    h.phases.push({ species: h.species, count: 0, startedAt: today() });
    h.count = 0;
    lsSet(LSH.HUNTS, hunts);
    lsSet(LSH.HID,   nextHid);
  }

  // Also add a note to dex encounter log so it's visible there
  if (!dexData[species]) dexData[species] = { caught: false, shinyFound: false, encounters: [] };
  dexData[species].encounters.unshift({
    id:      Date.now(),
    date:    today(),
    method:  h?.method || 'Unknown',
    game:    h?.game   || '',
    notes:   `💔 Failed catch — ${reasonLabels[reason]}${count ? ' after ' + count.toLocaleString() + ' encounters' : ''}${notes ? ' — ' + notes : ''}`,
    isShiny: true,
    isFailed: true,
  });
  lsSet(LS.D, dexData);

  closeFailedModal();
  // Switch to failed tab so they see it immediately
  if (currentShinyTab === 'log') {
    switchLogTab('failed');
  } else {
    shinyTab('log');
    switchLogTab('failed');
  }
}

// ── Log tab toggle ────────────────────────────────────────────────────────────
function switchLogTab(tab) {
  currentLogTab = tab;
  ['caught','failed'].forEach(t => {
    const btn = document.getElementById('ltab-' + t);
    if (btn) btn.classList.toggle('active', t === tab);
    if (btn && t === 'failed') btn.classList.toggle('failed-tab', t === tab);
