// ── Dex helper functions ──────────────────────────────────────────────────────
function toggleCaught(species, key) {
  if (!dexData[species]) dexData[species] = { caught:false, shinyFound:false, encounters:[] };
  dexData[species][key] = !dexData[species][key];
  lsSet(LS.D, dexData);
}

function toggleLogForm() {
  const f   = document.getElementById('logForm');
  const btn = document.getElementById('logToggleBtn');
  if (!f) return;
  const open = f.style.display !== 'none';
  f.style.display   = open ? 'none' : 'block';
  btn.textContent   = open ? '+ Log' : '✕ Cancel';
}

function saveEncounter(species) {
  const dateEl   = document.getElementById('logDate');
  const methodEl = document.getElementById('logMethod');
  const gameEl   = document.getElementById('logGame');
  const notesEl  = document.getElementById('logNotes');
  const shinyEl  = document.getElementById('logShiny');
  if (!dateEl) return;

  const enc = {
    id:      Date.now(),
    date:    dateEl.value,
    method:  methodEl?.value || 'Unknown',
    game:    gameEl?.value   || '',
    notes:   notesEl?.value.trim() || '',
    isShiny: shinyEl?.checked || false,
  };

  if (!dexData[species]) dexData[species] = { caught:false, shinyFound:false, encounters:[] };
  dexData[species].caught = true;
  if (enc.isShiny) dexData[species].shinyFound = true;
  dexData[species].encounters.unshift(enc);
  lsSet(LS.D, dexData);
  renderMyData(species);
}


// ── Egg move learner lookup ───────────────────────────────────────────────────
const eggLearnerCache = {}; // move-name -> [{ name, sprite }]

async function toggleEggLearners(moveName, rowId, panelId) {
  const panelRow = document.getElementById(panelId + '-row');
  const row      = document.getElementById(rowId);
  if (!panelRow) return;

  const isOpen = panelRow.style.display !== 'none';
  if (isOpen) {
    panelRow.style.display = 'none';
    row?.classList.remove('active');
    return;
  }

  // Close any other open panels
  document.querySelectorAll('[id$="-row"]').forEach(r => {
    if (r.id !== panelId + '-row' && r.id.startsWith('eggpanel')) r.style.display = 'none';
  });
  document.querySelectorAll('.egg-move-row').forEach(r => r.classList.remove('active'));

  panelRow.style.display = 'table-row';
  row?.classList.add('active');

  const grid   = document.getElementById(panelId + '-grid');
  const status = document.getElementById(panelId + '-status');

  // Use cache
  if (eggLearnerCache[moveName]) {
    renderLearnerGrid(eggLearnerCache[moveName], grid, status);
    return;
  }

  if (status) status.textContent = 'Loading…';
  if (grid)   grid.innerHTML = '';

  try {
    // Fetch move data to get learned_by_pokemon
    const data = await pokeGet('https://pokeapi.co/api/v2/move/' + moveName);

    if (!data?.learned_by_pokemon?.length) {
      if (status) status.textContent = 'No learner data found.';
      return;
    }

    const learners = data.learned_by_pokemon.map(p => ({
      name: p.name,
      display: p.name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
      sprite: 'https://img.pokemondb.net/sprites/sword-shield/icon/' + p.name + '.png',
    }));

    eggLearnerCache[moveName] = learners;
    renderLearnerGrid(learners, grid, status);
  } catch(e) {
    if (status) status.textContent = 'Failed to load. Check connection.';
  }
}

function renderLearnerGrid(learners, grid, status) {
  if (status) status.textContent = learners.length + ' Pokémon can learn this move:';

  // Check across ALL owned Pokémon (Aprimon + Living Dex)
  const ownedNames = getAllOwnedNames();

  grid.innerHTML = learners.map(l => {
    const isOwned = ownedNames.has(l.display.toLowerCase()) || ownedNames.has(l.name.toLowerCase());
    return `
      <div class="learner-chip ${isOwned ? 'owned' : ''}" onclick="openDex('${l.display}')" title="${l.display}${isOwned ? ' · In your collection' : ''}">
        <img src="${l.sprite}" width="40" height="30"
          style="image-rendering:pixelated"
          onerror="this.style.display='none'"/>
        <div class="learner-name">${l.display}</div>
      </div>`;
  }).join('');
}



// ── Populate a learner into breeding parent fields ────────────────────────────
function emcPopulateParent(species, e) {
  e?.stopPropagation();

  // Find which parent slot to fill — first empty one, else ask
  const p1 = document.getElementById('bf-p1-species');
  const p2 = document.getElementById('bf-p2-species');

  // If breed modal is open, populate directly
  const modal = document.getElementById('breedModal');
  const modalOpen = modal && modal.style.display !== 'none';

  if (modalOpen) {
    if (!p1?.value) {
      p1.value = species;
      p1.style.borderColor = '#86efac';
      setTimeout(() => p1.style.borderColor = '', 1500);
      showEMCToast(`${species} → Parent 1 ✓`);
    } else if (!p2?.value) {
      p2.value = species;
      p2.style.borderColor = '#86efac';
      setTimeout(() => p2.style.borderColor = '', 1500);
      showEMCToast(`${species} → Parent 2 ✓`);
    } else {
      // Both filled — show mini picker
      showEMCParentPicker(species);
    }
    return;
  }

  // Modal not open — open it with this species pre-filled in P1
  openNewBreedModal();
  setTimeout(() => {
    const p1fresh = document.getElementById('bf-p1-species');
    if (p1fresh) {
      p1fresh.value = species;
      p1fresh.style.borderColor = '#86efac';
      setTimeout(() => p1fresh.style.borderColor = '', 1500);
    }
  }, 50);
}

function showEMCRouteToast(species, e) {
  e?.stopPropagation();
  // Remove any existing one
  document.getElementById('emc-route-toast')?.remove();

  const el = document.createElement('div');
  el.id = 'emc-route-toast';
  el.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1e1535;border:1px solid #c084fc44;border-radius:16px;padding:14px 16px;z-index:9999;font-size:12px;color:#ede9ff;display:flex;flex-direction:column;gap:10px;min-width:240px;max-width:88vw;box-shadow:0 8px 32px #00000099';

  const sprite = `https://img.pokemondb.net/sprites/sword-shield/icon/${species.toLowerCase().replace(/\s/g,'-')}.png`;

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px">
      <img src="${sprite}" width="32" height="24" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
      <div>
        <div style="font-weight:800;color:#c084fc;font-size:11px">⚡ ${species}</div>
        <div style="color:#9d8ec4;font-size:11px;margin-top:1px">Do you need to verify moves?</div>
      </div>
      <button onclick="document.getElementById('emc-route-toast')?.remove()"
        style="margin-left:auto;background:none;border:none;color:#5b4690;font-size:14px;cursor:pointer;padding:0 2px">✕</button>
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="document.getElementById('emc-route-toast')?.remove();openDex('${species}')"
        style="flex:1;background:#c084fc22;border:1px solid #c084fc44;color:#c084fc;padding:8px 6px;border-radius:10px;cursor:pointer;font-weight:800;font-size:11px">
        📖 Yes, check Dex
      </button>
      <button onclick="document.getElementById('emc-route-toast')?.remove();emcPopulateParent('${species}', null)"
        style="flex:1;background:#86efac22;border:1px solid #86efac44;color:#86efac;padding:8px 6px;border-radius:10px;cursor:pointer;font-weight:800;font-size:11px">
        ✓ No, use as parent
      </button>
    </div>
  `;

  document.body.appendChild(el);

  // Auto-dismiss after 6s
  el._t = setTimeout(() => el.remove(), 6000);
}

function showEMCToast(msg) {
  // Reuse the small inline feedback approach
  let el = document.getElementById('emc-populate-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'emc-populate-toast';
    el.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#231a3e;border:1px solid #86efac44;border-radius:12px;padding:8px 16px;font-size:12px;color:#86efac;font-weight:700;z-index:9998;transition:opacity .3s;pointer-events:none';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.opacity = '0', 2000);
}

function showEMCParentPicker(species) {
  const p1 = document.getElementById('bf-p1-species');
  const p2 = document.getElementById('bf-p2-species');
  let el = document.getElementById('emc-parent-picker');
  if (!el) {
    el = document.createElement('div');
    el.id = 'emc-parent-picker';
    el.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1e1535;border:1px solid #c084fc44;border-radius:16px;padding:12px 16px;z-index:9998;font-size:12px;color:#ede9ff;font-weight:600;display:flex;flex-direction:column;gap:8px;min-width:220px;box-shadow:0 8px 32px #00000088';
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div style="font-size:11px;color:#7060a8;margin-bottom:2px">Set <b style="color:#c084fc">${species}</b> as:</div>
    <div style="display:flex;gap:8px">
      <button onclick="document.getElementById('bf-p1-species').value='${species}';showEMCToast('${species} → Parent 1 ✓');this.closest('#emc-parent-picker').remove()"
        style="flex:1;background:#c084fc22;border:1px solid #c084fc44;color:#c084fc;padding:7px;border-radius:10px;cursor:pointer;font-weight:800;font-size:11px">Parent 1</button>
      <button onclick="document.getElementById('bf-p2-species').value='${species}';showEMCToast('${species} → Parent 2 ✓');this.closest('#emc-parent-picker').remove()"
        style="flex:1;background:#86efac22;border:1px solid #86efac44;color:#86efac;padding:7px;border-radius:10px;cursor:pointer;font-weight:800;font-size:11px">Parent 2</button>
      <button onclick="this.closest('#emc-parent-picker').remove()"
        style="background:none;border:1px solid #5b469033;color:#5b4690;padding:7px 10px;border-radius:10px;cursor:pointer;font-size:11px">✕</button>
    </div>`;
  // Auto-dismiss after 5s
  setTimeout(() => el.remove(), 5000);
}

// ══ LIVING DEX ═══════════════════════════════════════════════════════════════

const LDEX_GENS = [
  { gen:1, label:'Generation I',    games:'Red / Blue / Yellow',         start:1,   end:151  },
  { gen:2, label:'Generation II',   games:'Gold / Silver / Crystal',     start:152, end:251  },
  { gen:3, label:'Generation III',  games:'Ruby / Sapphire / Emerald',   start:252, end:386  },
  { gen:4, label:'Generation IV',   games:'Diamond / Pearl / Platinum',  start:387, end:493  },
  { gen:5, label:'Generation V',    games:'Black / White',               start:494, end:649  },
  { gen:6, label:'Generation VI',   games:'X / Y',                       start:650, end:721  },
  { gen:7, label:'Generation VII',  games:'Sun / Moon',                  start:722, end:809  },
  { gen:8, label:'Generation VIII', games:'Sword / Shield',              start:810, end:905  },
  { gen:9, label:'Generation IX',   games:'Scarlet / Violet',            start:906, end:1025 },
];

// PokéAPI name list — fetched once and cached
const LDEX_LS_NAMES = 'at_ldex_names';
const LDEX_LS_DATA  = 'at_ldex';        // { [id]: { caught, shiny } }
let ldexNames  = lsGet(LDEX_LS_NAMES, null); // null = not yet fetched
let ldexData   = lsGet(LDEX_LS_DATA,  {});
let ldexView_  = 'all';
let ldexGen_   = 'all';

// ── Fetch + cache the full Pokémon name list ──────────────────────────────────
async function ensureLdexNames() {
  if (ldexNames && ldexNames.length >= 1025) return ldexNames;
  const el = document.getElementById('ldex-grid');
  if (el) el.innerHTML = '<div class="dex-loading"><div class="dex-loading-spinner"></div><div>Loading Pokédex…</div></div>';
  try {
    const data = await pokeGet('https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0');
    ldexNames = data.results.map((p, i) => ({
      id:      i + 1,
      name:    p.name,
      display: p.name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
    }));
    lsSet(LDEX_LS_NAMES, ldexNames);
  } catch(e) {
    if (el) el.innerHTML = '<div class="empty-state">Could not load Pokédex data.<br/><span style="font-size:11px;color:#5b4690">Check your internet connection.</span></div>';
    return null;
  }
  return ldexNames;
}

// ── Main render ───────────────────────────────────────────────────────────────
async function renderLivingDex() {
  const names = await ensureLdexNames();
  if (!names) return;

  // Sync: any species in dexData also gets reflected here
  names.forEach(p => {
    const entry = dexData[p.display] || dexData[p.name];
    if (entry) {
      if (!ldexData[p.id]) ldexData[p.id] = {};
      if (entry.caught)     ldexData[p.id].caught = true;
      if (entry.shinyFound) ldexData[p.id].shiny  = true;
    }
  });

  renderLdexRings(names);
  renderLdexGrid(names);
}

// ── Progress rings ────────────────────────────────────────────────────────────
function renderLdexRings(names) {
  const total   = names.length;
  const caught  = names.filter(p => ldexData[p.id]?.caught).length;
  const shiny   = names.filter(p => ldexData[p.id]?.shiny).length;
  const cPct    = Math.round(caught / total * 100);
  const sPct    = Math.round(shiny  / total * 100);

  // SVG ring helper
  const ring = (pct, color, sublabel, id) => {
    const r   = 26;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    document.getElementById(id).innerHTML = `
      <svg class="ldex-ring-svg" viewBox="0 0 64 64">
        <circle class="ldex-ring-bg" cx="32" cy="32" r="${r}"/>
        <circle class="ldex-ring-fg" cx="32" cy="32" r="${r}"
          stroke="${color}"
          stroke-dasharray="${circ}"
          stroke-dashoffset="${offset}"/>
      </svg>
      <div class="ldex-ring-label">
        <div class="ldex-ring-pct" style="color:${color}">${pct}%</div>
        <div class="ldex-ring-sub" style="color:${color}88">${sublabel}</div>
      </div>`;
  };

  ring(cPct, '#86efac', 'Caught', 'ldex-ring-normal');
  ring(sPct, '#fde68a', 'Shiny',  'ldex-ring-shiny');

  const ol = document.getElementById('ldex-overall-label');
  const sl = document.getElementById('ldex-shiny-label');
  if (ol) ol.textContent = `${caught.toLocaleString()} / ${total.toLocaleString()} Caught`;
  if (sl) sl.textContent = `★ ${shiny.toLocaleString()} / ${total.toLocaleString()} Shiny`;
}

// ── Grid render ───────────────────────────────────────────────────────────────
function renderLdexGrid(names) {
  const el = document.getElementById('ldex-grid');
  if (!el) return;

  // Apply gen filter
  const gens = ldexGen_ === 'all' ? LDEX_GENS : LDEX_GENS.filter(g => g.gen === ldexGen_);

  el.innerHTML = gens.map(g => {
    const gPokes = names.filter(p => p.id >= g.start && p.id <= g.end);

    // Apply view filter
    let filtered = gPokes;
    if (ldexView_ === 'missing') filtered = gPokes.filter(p => !ldexData[p.id]?.caught);
    if (ldexView_ === 'caught')  filtered = gPokes.filter(p =>  ldexData[p.id]?.caught);
    if (ldexView_ === 'shiny')   filtered = gPokes.filter(p =>  ldexData[p.id]?.shiny);

    if (!filtered.length) return '';

    const gCaught = gPokes.filter(p => ldexData[p.id]?.caught).length;
    const gShiny  = gPokes.filter(p => ldexData[p.id]?.shiny).length;
    const gPct    = Math.round(gCaught / gPokes.length * 100);

    const cells = filtered.map(p => {
      const d       = ldexData[p.id] || {};
      const sprite  = 'https://img.pokemondb.net/sprites/sword-shield/icon/' + p.name + '.png';
      const classes = ['ldex-cell', d.caught ? 'caught' : '', d.shiny ? 'shiny' : ''].filter(Boolean).join(' ');
      return `
        <div class="${classes}" id="ldcell-${p.id}"
          onclick="ldexToggle(${p.id},'${p.display}',event)"
          oncontextmenu="ldexToggleShiny(${p.id},event)">
          <div class="ldex-num">#${String(p.id).padStart(3,'0')}</div>
          <img src="${sprite}" width="40" height="30"
            style="image-rendering:pixelated"
            data-name="${p.name}"
            onerror="(function(img){var n=img.dataset.name;if(img.src.includes('sword-shield')){img.src='https://img.pokemondb.net/sprites/home/normal/'+n+'.png';img.style.width='32px';img.style.height='32px';}else{img.style.opacity='.15';}})(this)"/>
          <div class="ldex-name">${p.display.length > 9 ? p.display.slice(0,8)+'…' : p.display}</div>
          <div class="ldex-dot">
            <div class="ldex-dot-n ${d.caught ? 'on' : ''}"></div>
            <div class="ldex-dot-s ${d.shiny  ? 'on' : ''}"></div>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="ldex-gen-header">
        <div>
          <div class="ldex-gen-title">${g.label}</div>
          <div class="ldex-gen-games">${g.games} · ${gPokes.length} Pokémon</div>
        </div>
        <div class="ldex-gen-prog">
          <span style="color:#86efac">${gCaught}</span>
          <span style="color:#5b4690"> / ${gPokes.length}</span>
          <span style="color:#5b469088;font-size:10px"> (${gPct}%)</span>
          ${gShiny ? `<span style="color:#fde68a;margin-left:8px">★ ${gShiny}</span>` : ''}
        </div>
      </div>
      <div class="ldex-poke-grid">${cells}</div>`;
  }).join('');
}

// ── Toggle caught (tap) / shiny (long-press / right-click) ───────────────────
function ldexToggle(id, display, e) {
  e?.preventDefault();
  if (!ldexData[id]) ldexData[id] = {};
  ldexData[id].caught = !ldexData[id].caught;

  // Sync back to dexData
  if (!dexData[display]) dexData[display] = { caught:false, shinyFound:false, encounters:[] };
  dexData[display].caught = ldexData[id].caught;
  lsSet(LDEX_LS_DATA, ldexData);
  lsSet(LS.D, dexData);

  // Fast DOM update — just update this cell without full re-render
  ldexUpdateCell(id);
  renderLdexRings(ldexNames);
}

function ldexToggleShiny(id, e) {
  e?.preventDefault();
  if (!ldexData[id]) ldexData[id] = {};
  ldexData[id].shiny = !ldexData[id].shiny;
  // If marking shiny, also mark caught
  if (ldexData[id].shiny) ldexData[id].caught = true;

  // Sync dexData
  const p = ldexNames?.find(n => n.id === id);
  if (p) {
    if (!dexData[p.display]) dexData[p.display] = { caught:false, shinyFound:false, encounters:[] };
    dexData[p.display].shinyFound = ldexData[id].shiny;
    if (ldexData[id].shiny) dexData[p.display].caught = true;
    lsSet(LS.D, dexData);
  }

  lsSet(LDEX_LS_DATA, ldexData);
  ldexUpdateCell(id);
  renderLdexRings(ldexNames);
}

function ldexUpdateCell(id) {
  const cell = document.getElementById('ldcell-' + id);
  if (!cell) return;
  const d = ldexData[id] || {};
  cell.className = ['ldex-cell', d.caught ? 'caught' : '', d.shiny ? 'shiny' : ''].filter(Boolean).join(' ');
  const dots = cell.querySelectorAll('.ldex-dot-n, .ldex-dot-s');
  if (dots[0]) dots[0].classList.toggle('on', !!d.caught);
  if (dots[1]) dots[1].classList.toggle('on', !!d.shiny);
}

// ── Filter controls ───────────────────────────────────────────────────────────
function ldexView(v) {
  ldexView_ = v;
  document.querySelectorAll('.ldex-view-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('ldvb-' + v)?.classList.add('active');
  renderLdexGrid(ldexNames);
}

function ldexGen(g) {
  ldexGen_ = g;
  document.querySelectorAll('.ldex-gen-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('ldgt-' + g)?.classList.add('active');
  renderLdexGrid(ldexNames);
}


