
function toolTab(tab) {
  document.querySelectorAll('[id^="tool-tab-"]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('[id^="tool-pane-"]').forEach(p => p.style.display = 'none');
  const tabEl = document.getElementById('tool-tab-' + tab);
  const paneEl = document.getElementById('tool-pane-' + tab);
  if (tabEl) tabEl.classList.add('active');
  if (paneEl) paneEl.style.display = 'block';
}

// Ball data: [label, sprite-key, base-multiplier, has-condition]
const CR_BALLS = [
  { name:'Poké',    key:'poke',    mult:1,    cond:null },
  { name:'Great',   key:'great',   mult:1.5,  cond:null },
  { name:'Ultra',   key:'ultra',   mult:2,    cond:null },
  { name:'Master',  key:'master',  mult:255,  cond:null },
  { name:'Net',     key:'net',     mult:1,    cond:'net' },
  { name:'Dusk',    key:'dusk',    mult:1,    cond:'dusk' },
  { name:'Quick',   key:'quick',   mult:1,    cond:'turn' },
  { name:'Timer',   key:'timer',   mult:1,    cond:'turn' },
  { name:'Repeat',  key:'repeat',  mult:1,    cond:'repeat' },
  { name:'Nest',    key:'nest',    mult:1,    cond:'level' },
  { name:'Heal',    key:'heal',    mult:1,    cond:null },
  { name:'Luxury',  key:'luxury',  mult:1,    cond:null },
  { name:'Premier', key:'premier', mult:1,    cond:null },
  { name:'Sport',   key:'sport',   mult:1.5,  cond:null },
  { name:'Safari',  key:'safari',  mult:1.5,  cond:null },
  { name:'Beast',   key:'beast',   mult:0.1,  cond:null },
  { name:'Dream',   key:'dream',   mult:1,    cond:null },
  { name:'Moon',    key:'moon',    mult:1,    cond:null },
  { name:'Love',    key:'love',    mult:1,    cond:null },
  { name:'Fast',    key:'fast',    mult:1,    cond:null },
  { name:'Friend',  key:'friend',  mult:1,    cond:null },
  { name:'Lure',    key:'lure',    mult:1,    cond:null },
  { name:'Heavy',   key:'heavy',   mult:1,    cond:null },
];

let crState = {
  catchRate: null,
  types: [],
  speed: 0,
  weight: 0,
  ball: 'Ultra',
  hp: 50,
  status: 'none',
  turn: 1,
  dusk: 0,
  repeat: 0,
  level: 30,
};

function crBallMult() {
  const b = CR_BALLS.find(x => x.name === crState.ball) || CR_BALLS[2];
  const turn = parseInt(document.getElementById('cr-turn')?.value) || 1;

  switch (crState.ball) {
    case 'Master': return 255;
    case 'Quick':  return turn === 1 ? 5 : 1;
    case 'Timer':  return Math.min(4, 1 + turn * (1229/4096));
    case 'Dusk':   return crState.dusk ? 3.5 : 1;
    case 'Net': {
      const isWaterBug = crState.types.some(t => t === 'water' || t === 'bug');
      return isWaterBug ? 3.5 : 1;
    }
    case 'Repeat': return crState.repeat ? 3.5 : 1;
    case 'Nest': {
      const lv = parseInt(document.getElementById('cr-level')?.value) || 30;
      return Math.max(1, (41 - lv) / 10);
    }
    case 'Beast':  return 0.1;
    case 'Dream':  return crState.status === 'sleep' ? 4 : 1;
    case 'Fast':   return crState.speed >= 100 ? 4 : 1;
    case 'Lure':   return 4;
    case 'Moon':   return 4;   // simplified — moon stone evolutions
    case 'Love':   return 1;   // requires same species opposite gender, too contextual
    case 'Heavy': {
      const kg = crState.weight;
      if (kg >= 300) return 30;
      if (kg >= 200) return 20;
      if (kg >= 100) return 10;
      return 1;
    }
    default: return b.mult;
  }
}

function crStatusMult() {
  if (crState.status === 'sleep') return 2.5;
  if (crState.status === 'para')  return 1.5;
  return 1;
}

function crCalc() {
  const rate   = crState.catchRate;
  if (!rate) return null;

  const hpPct  = crState.hp / 100;
  const bMult  = crBallMult();
  const sMult  = crStatusMult();

  if (bMult >= 255) return { pct: 100, shakes: [1,1,1,1], expected: 1 };

  // a = (3M - 2H) * rate * ball * status / (3M)   where H = hpPct * M
  // simplifies to: a = (3 - 2*hpPct) * rate * ball * status / 3
  const a = Math.min(255, ((3 - 2 * hpPct) * rate * bMult * sMult) / 3);

  if (a >= 255) return { pct: 100, shakes: [1,1,1,1], expected: 1 };

  const threshold = Math.floor(65536 / Math.pow(255 / a, 0.1875));
  const shakeP    = threshold / 65536;
  const catchP    = Math.pow(shakeP, 4);
  const expected  = catchP > 0 ? Math.ceil(1 / catchP) : Infinity;

  return {
    pct: Math.round(catchP * 10000) / 100,
    shakes: [shakeP, shakeP, shakeP, shakeP],
    shakeP,
    expected,
    a,
    threshold,
  };
}

function crUpdate() {
  crState.hp     = parseInt(document.getElementById('cr-hp')?.value) || 50;
  crState.turn   = parseInt(document.getElementById('cr-turn')?.value) || 1;
  crState.level  = parseInt(document.getElementById('cr-level')?.value) || 30;

  // HP label + bar
  const hpLabel = document.getElementById('cr-hp-label');
  const hpBar   = document.getElementById('cr-hp-bar');
  if (hpLabel) hpLabel.textContent = crState.hp + '%';
  if (hpBar) {
    hpBar.style.width = crState.hp + '%';
    const hue = Math.round((1 - crState.hp/100) * 120);
    hpBar.style.background = `linear-gradient(90deg, hsl(${hue},80%,55%), hsl(${hue},80%,70%))`;
  }

  const result  = document.getElementById('cr-result');
  const empty   = document.getElementById('cr-empty');

  if (!crState.catchRate) {
    if (result) result.style.display = 'none';
    if (empty)  empty.style.display  = 'block';
    return;
  }

  if (result) result.style.display = 'block';
  if (empty)  empty.style.display  = 'none';

  const calc = crCalc();
  if (!calc) return;

  const pctEl  = document.getElementById('cr-result-pct');
  const detEl  = document.getElementById('cr-result-details');
  const shkEl  = document.getElementById('cr-shake-row');

  // Colour code
  let col = '#fda4af'; // red — hard
  if (calc.pct >= 80) col = '#86efac';       // green — easy
  else if (calc.pct >= 40) col = '#fde68a';  // gold — medium
  else if (calc.pct >= 15) col = '#c084fc';  // purple — tricky

  if (pctEl) {
    pctEl.textContent = calc.pct >= 100 ? '100%' : calc.pct.toFixed(1) + '%';
    pctEl.style.color = col;
  }

  if (detEl) {
    const expText = calc.expected === 1 ? 'Guaranteed catch'
      : calc.expected === Infinity ? 'Virtually impossible'
      : `~${calc.expected.toLocaleString()} balls on average`;
    detEl.innerHTML = `
      <span style="color:#7c6fa0">Ball multiplier:</span> <b style="color:#ede9ff">${crBallMult().toFixed(2)}×</b>
      &nbsp;·&nbsp;
      <span style="color:#7c6fa0">Status:</span> <b style="color:#ede9ff">${crStatusMult()}×</b>
      <br/><span style="color:${col};font-weight:800;font-size:13px">${expText}</span>
    `;
  }

  if (shkEl) {
    const sp = Math.round((calc.shakeP || 0) * 100);
    shkEl.innerHTML = ['1st','2nd','3rd','4th'].map((label, i) => `
      <div class="cr-shake-check ${sp >= (i+1)*20 ? 'good' : ''}">
        <div class="cr-shake-dot" style="background:${col}"></div>
        <span>${label} shake</span>
        <span style="color:${col}">${sp}%</span>
      </div>`).join('');
  }
}

function crPickStatus(btn) {
  document.querySelectorAll('#cr-status-pills .cr-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  crState.status = btn.dataset.val;
  crUpdate();
}

function crPickCond(cond, btn) {
  btn.closest('.cr-pills').querySelectorAll('.cr-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  crState[cond] = parseInt(btn.dataset.val);
  crUpdate();
}

function crSelectBall(name) {
  crState.ball = name;
  document.querySelectorAll('.cr-ball-btn').forEach(b => b.classList.toggle('active', b.dataset.name === name));

  // Show/hide conditional inputs
  const ball = CR_BALLS.find(x => x.name === name);
  const cond = ball?.cond || null;
  document.getElementById('cr-cond-turn').style.display   = cond === 'turn'   ? 'block' : 'none';
  document.getElementById('cr-cond-dusk').style.display   = cond === 'dusk'   ? 'block' : 'none';
  document.getElementById('cr-cond-repeat').style.display = cond === 'repeat' ? 'block' : 'none';
  document.getElementById('cr-cond-net').style.display    = cond === 'net'    ? 'block' : 'none';
  document.getElementById('cr-cond-level').style.display  = cond === 'level'  ? 'block' : 'none';

  crUpdate();
}

function crBuildBallGrid() {
  const grid = document.getElementById('cr-ball-grid');
  if (!grid) return;
  grid.innerHTML = CR_BALLS.map(b => {
    const url = `https://img.pokemondb.net/sprites/items/${b.key}-ball.png`;
    const isActive = b.name === crState.ball;
    return `
    <button class="cr-ball-btn ${isActive ? 'active' : ''}" data-name="${b.name}" onclick="crSelectBall('${b.name}')" title="${b.name} Ball">
      <img src="${url}" width="28" height="28" style="image-rendering:pixelated" onerror="this.style.opacity='.3'"/>
      <span>${b.name}</span>
    </button>`;
  }).join('');
}

async function crSpeciesInput() {
  // AC handles dropdown; we also update the base catch rate display
  const val = document.getElementById('cr-species')?.value.trim();
  document.getElementById('cr-catch-rate-display').textContent = '';
  if (!val || val.length < 2) { crState.catchRate = null; crState.types = []; crUpdate(); return; }
}

async function crLoadSpecies(name) {
  const display = document.getElementById('cr-catch-rate-display');
  if (display) display.textContent = 'Loading...';
  try {
    const [specData, pokeData] = await Promise.all([
      pokeGet(`https://pokeapi.co/api/v2/pokemon-species/${name.toLowerCase().replace(' ','-')}`),
      pokeGet(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase().replace(' ','-')}`)
    ]);

    crState.catchRate = specData.capture_rate;
    crState.types     = pokeData.types.map(t => t.type.name);
    crState.speed     = pokeData.stats.find(s => s.stat.name === 'speed')?.base_stat || 0;
    crState.weight    = pokeData.weight / 10; // hectograms → kg

    if (display) display.textContent = `Base catch rate: ${crState.catchRate} / 255`;

    // Refresh Net Ball note with actual type
    const netNote = document.getElementById('cr-cond-net');
    if (netNote && crState.ball === 'Net') {
      const isWB = crState.types.some(t => t === 'water' || t === 'bug');
      netNote.querySelector('.cr-info-note').textContent = isWB
        ? `🌊 Net Ball 3.5× bonus applies — ${crState.types.join('/')} type!`
        : `🌊 Net Ball bonus does NOT apply — ${crState.types.join('/')} type.`;
    }

    crUpdate();
  } catch(e) {
    crState.catchRate = null;
    if (display) display.textContent = 'Species not found';
  }
}

// Init the catch rate calculator when section opens
// (hooked into goSection via existing patch)
function initCatchRateCalc() {
  crBuildBallGrid();
  crSelectBall('Ultra');
  setTimeout(() => {
    initSpeciesAC('cr-species', (name) => {
      document.getElementById('cr-species').value = name;
      crLoadSpecies(name);
    });
  }, 100);
  crUpdate();
}

// ── Compact collection detail sheet ─────────────────────────────────────────
function openCompactDetail(species) {
  const g = group(mons).find(x => x.species.toLowerCase() === species.toLowerCase());
  if (!g) return;

  const { variants } = g;
  const owned = BALL_NAMES.filter(b => variants.some(v => v.ball === b));
  if (!selBalls[species] || !owned.includes(selBalls[species])) selBalls[species] = owned[0];

  const backdrop = document.getElementById('compact-detail-backdrop');
  const sheet    = document.getElementById('compact-detail-sheet');
  backdrop.style.display = 'block';
  sheet.style.display    = 'block';
  sheet.style.transform  = 'translateY(100%)';
  setTimeout(() => sheet.style.transform = 'translateY(0)', 10);

  renderCompactDetailContent(species);
}

function renderCompactDetailContent(species) {
  const g = group(mons).find(x => x.species.toLowerCase() === species.toLowerCase());
  if (!g) return;

  const { variants } = g;
  const owned = BALL_NAMES.filter(b => variants.some(v => v.ball === b));
  const sb  = selBalls[species] || owned[0];
  const am  = variants.find(v => v.ball === sb) || variants[0];
  const bc  = BALLS[am.ball] || BALLS.Moon;
  const hasShiny = variants.some(v => v.isShiny);

  const tabsHTML = owned.length > 1 ? `
    <div class="cds-ball-tabs">
      ${owned.map(b => {
        const bbc = BALLS[b] || BALLS.Moon;
        const mon = variants.find(v => v.ball === b);
        return `<button class="cds-ball-tab ${b === sb ? 'active' : ''}" style="--ta:${bbc.accent}" onclick="cdsSelectBall('${species}','${b}')">
          ${bImg(b, 18)} <span style="color:${bbc.light}">${b}</span>${mon?.isShiny ? ' <span style="color:#fde68a;font-size:10px">★</span>' : ''}
        </button>`;
      }).join('')}
    </div>` : '';

  const em = am.eggMoves?.length ? `
    <div class="cds-section">
      <div class="cds-label">Egg Moves</div>
      <div class="tag-row">${am.eggMoves.map(m => `<span class="tag" style="border-color:${bc.accent}25;color:${bc.light}">${m}</span>`).join('')}</div>
    </div>` : '';

  const wl = am.wantList?.length ? `
    <div class="cds-section">
      <div class="cds-label">Looking For</div>
      <div class="tag-row">${am.wantList.map(w => `<span class="tag" style="border-color:#fdba7420;color:#fdba74">⇄ ${w}</span>`).join('')}</div>
    </div>` : '';

  const notes = am.notes ? `
    <div class="cds-section">
      <div class="cds-label">Notes</div>
      <div class="notes-text" style="border-left-color:${bc.accent}33">${am.notes}</div>
    </div>` : '';

  document.getElementById('compact-detail-content').innerHTML = `
    <div class="cds-header">
      <div class="cds-sprite-wrap">
        <img src="${poke(species, am.isShiny)}" width="72" height="72" style="image-rendering:pixelated;filter:drop-shadow(0 0 10px ${am.isShiny ? '#fde68a88' : bc.accent + '66'})" onerror="this.style.display='none'"/>
      </div>
      <div>
        <div class="cds-name ${hasShiny ? 'shiny' : ''}">${species}${hasShiny ? ' <span style="color:#fde68a">★</span>' : ''}</div>
        <div class="cds-sub">${owned.length} ball variant${owned.length > 1 ? 's' : ''}</div>
      </div>
      <button class="cds-close" onclick="closeCompactDetail()">✕</button>
    </div>
    ${tabsHTML}
    <div class="cds-detail-row">
      ${bdg(am.tradeStatus)}
      <span style="color:#8b80b8;font-size:12px">${am.nature} · ${am.ivSpread} · ${am.gender}</span>
      ${am.quantity > 1 ? `<span style="background:#2a2350;color:#9d93c0;font-size:11px;padding:2px 8px;border-radius:4px">×${am.quantity}</span>` : ''}
    </div>
    <div style="color:#5b4690;font-size:11px;margin-bottom:12px">${am.game}</div>
    ${em}${wl}${notes}
    <div class="cds-actions">
      <button class="btn-edit" style="border-color:${bc.accent}30;color:${bc.light};flex:1" onclick="closeCompactDetail();openEditModal(${am.id})">✎ Edit</button>
      <button class="btn btn-danger" onclick="closeCompactDetail();deleteMon(${am.id})">✕ Remove</button>
      <button class="btn-dex-link" onclick="openDex('${species}')">📖 Dex</button>
    </div>
  `;
}

function cdsSelectBall(species, ball) {
  selBalls[species] = ball;
  renderCompactDetailContent(species);
}

function closeCompactDetail() {
  const sheet    = document.getElementById('compact-detail-sheet');
  const backdrop = document.getElementById('compact-detail-backdrop');
  sheet.style.transform = 'translateY(100%)';
  setTimeout(() => {
    sheet.style.display    = 'none';
    backdrop.style.display = 'none';
  }, 300);
}

