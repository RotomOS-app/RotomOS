// ══ BREEDING ══════════════════════════════════════════════════════════════════

const LSB = { PROJECTS:'at_breed', BID:'at_bid' };
let breedProjects = lsGet(LSB.PROJECTS, []);
let nextBid       = lsGet(LSB.BID, 1);
let currentBreedTab = 'projects';

const NATURES_STAT = {
  Hardy:null,  Lonely:'+Atk/-Def', Brave:'+Atk/-Spe',  Adamant:'+Atk/-SpA', Naughty:'+Atk/-SpD',
  Bold:'+Def/-Atk',  Docile:null,   Relaxed:'+Def/-Spe', Impish:'+Def/-SpA',  Lax:'+Def/-SpD',
  Timid:'+Spe/-Atk', Hasty:'+Spe/-Def',  Serious:null, Naive:'+Spe/-SpA',   Jolly:'+Spe/-SpD',
  Modest:'+SpA/-Atk',Mild:'+SpA/-Def',   Quiet:'+SpA/-Spe',Bashful:null,     Rash:'+SpA/-SpD',
  Calm:'+SpD/-Atk',  Gentle:'+SpD/-Def', Sassy:'+SpD/-Spe',Careful:'+SpD/-SpA',Quirky:null,
};

const EGG_CYCLE_STEPS = 256; // modern games use 128 but 256 is the traditional standard

// ── Tab switcher ──────────────────────────────────────────────────────────────
function breedTab(tab) {
  currentBreedTab = tab;
  ['projects','guide','eggmoves'].forEach(t => {
    document.getElementById('btab-' + t)?.classList.toggle('active', t === tab);
    document.getElementById('breed-pane-' + t).style.display = t === tab ? 'block' : 'none';
  });
  // Show + New Project only on the projects tab
  const actionBtn = document.getElementById('headerActionBtn');
  if (actionBtn) {
    if (tab === 'projects') {
      actionBtn.style.display = 'inline-flex';
      actionBtn.textContent = '+ New Project';
    } else {
      actionBtn.style.display = 'none';
    }
  }
  if (tab === 'projects')  renderBreedProjects();
  if (tab === 'guide')     renderIVGuide();
  if (tab === 'eggmoves')  renderEggMoveChains();
}

function renderBreeding() {
  breedTab(currentBreedTab);
}

// ══ PROJECTS TAB ══════════════════════════════════════════════════════════════
function renderBreedProjects() {
  const el = document.getElementById('breed-pane-projects');
  if (!el) return;

  if (!breedProjects.length) {
    el.innerHTML = `
      <div class="empty-state" style="padding:60px 20px">
        No breeding projects yet.<br/>
        <span style="font-size:12px;color:#5b4690">Start one with the + button above.</span>
      </div>`;
    return;
  }

  el.innerHTML = breedProjects.map(p => breedProjectCard(p)).join('');
}

function breedProjectCard(p) {
  const src     = `https://img.pokemondb.net/sprites/home/normal/${p.species.toLowerCase().replace(/\s/g,'-')}.png`;
  const shinySrc= `https://img.pokemondb.net/sprites/home/shiny/${p.species.toLowerCase().replace(/\s/g,'-')}.png`;

  // IV progress — count how many IVs are "done"
  const ivSlots   = p.targetIVs ? p.targetIVs.split('/').map(s => s.trim()) : [];
  const ivDone    = ivSlots.filter(iv => iv === '31' || iv.toLowerCase() === 'x').length;
  const ivTotal   = ivSlots.length || 6;
  const ivPct     = ivTotal ? Math.round(ivDone / ivTotal * 100) : 0;

  // Hatch steps
  const hatchSteps = p.eggCycles ? p.eggCycles * EGG_CYCLE_STEPS : null;
  const hatchFlame = hatchSteps ? Math.ceil(hatchSteps / 2) + ' steps (Flame Body)' : null;

  // Stage progress
  const stages     = p.stages || [];
  const stagesDone = stages.filter(s => s.done).length;

  // Egg moves
  const eggMovesHTML = p.eggMoves?.length
    ? p.eggMoves.map(m => `<span class="tag" style="background:#231a3e;border-color:#c084fc22;color:#c4b5fd;font-size:10px">${m}</span>`).join('')
    : '<span style="color:#3d3070;font-size:11px">None</span>';

  const natureLabel = NATURES_STAT[p.nature] ? `${p.nature} <span style="color:#86efac;font-size:10px">${NATURES_STAT[p.nature]}</span>` : p.nature;
  const isMasuda    = p.masuda;

  return `
  <div class="breed-card" id="bcard-${p.id}">
    <!-- Header -->
    <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px">
      <div style="position:relative;flex-shrink:0">
        <img src="${src}" width="80" height="80" style="image-rendering:pixelated;filter:drop-shadow(0 0 8px #c084fc33)" onerror="this.style.display='none'"/>
        ${p.wantShiny ? `<img src="${shinySrc}" width="48" height="48" style="image-rendering:pixelated;position:absolute;bottom:-8px;right:-8px;filter:drop-shadow(0 0 6px #fde68a88)" onerror="this.style.display='none'"/>` : ''}
      </div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
          <div class="cinzel" style="font-size:17px;font-weight:900;color:#ede9ff">${p.species}</div>
          ${p.ball ? `<span style="font-size:10px;color:${(BALLS[p.ball]||BALLS.Moon).light};font-weight:700">${p.ball} Ball</span>` : ''}
          ${isMasuda ? `<span style="background:#93c5fd22;border:1px solid #93c5fd44;color:#93c5fd;font-size:9px;font-weight:800;padding:2px 8px;border-radius:20px">🌍 Masuda</span>` : ''}
          ${p.wantShiny ? `<span style="background:#fde68a22;border:1px solid #fde68a44;color:#fde68a;font-size:9px;font-weight:800;padding:2px 8px;border-radius:20px">★ Shiny Target</span>` : ''}
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:#7060a8">
          <span>Nature: <span style="color:#c4b5fd;font-weight:700">${p.nature || '—'}</span>${NATURES_STAT[p.nature] ? ` <span style="color:#86efac;font-size:10px">${NATURES_STAT[p.nature]}</span>` : ''}</span>
          <span>IVs: <span style="color:#c4b5fd;font-weight:700">${p.targetIVs || '—'}</span></span>
          <span>Gender: <span style="color:#c4b5fd;font-weight:700">${p.targetGender || 'Any'}</span></span>
        </div>
        ${hatchSteps ? `<div style="font-size:10px;color:#5b4690;margin-top:4px">🥚 ${hatchSteps.toLocaleString()} steps · 🔥 ${hatchFlame}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
        <button onclick="openEditBreed(${p.id})" style="background:#2b1f4e;border:1px solid #5b469033;color:#7060a8;padding:5px 10px;border-radius:8px;cursor:pointer;font-size:11px">✎ Edit</button>
        <button onclick="deleteBreed(${p.id})" style="background:none;border:1px solid #fda4af22;color:#fda4af55;padding:5px 10px;border-radius:8px;cursor:pointer;font-size:11px">✕</button>
      </div>
    </div>

    <!-- Egg moves -->
    <div style="margin-bottom:12px">
      <div style="font-size:9px;color:#5b4690;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px">Egg Moves</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">${eggMovesHTML}</div>
    </div>

    <!-- Parents -->
    ${p.parents?.length ? `
    <div style="margin-bottom:14px">
      <div style="font-size:9px;color:#5b4690;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Breeding Pair</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${p.parents.map(par => {
          const pSrc = `https://img.pokemondb.net/sprites/sword-shield/icon/${par.species.toLowerCase().replace(/\s/g,'-')}.png`;
          return `<div style="background:#1e1535;border:1px solid #5b469033;border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:8px">
            <img src="${pSrc}" width="40" height="30" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
            <div>
              <div style="font-size:12px;font-weight:700;color:#ede9ff">${par.species}</div>
              <div style="font-size:10px;color:#7060a8">${par.ivSpread||'?'} · ${par.nature||'?'}${par.ball ? ' · ' + par.ball + ' Ball' : ''}</div>
              ${par.holdsItem ? `<div style="font-size:9px;color:#fde68a">Holds: ${par.holdsItem}</div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    <!-- IV inheritance progress bar -->
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px">
        <div style="font-size:9px;color:#5b4690;font-weight:800;text-transform:uppercase;letter-spacing:.1em">IV Progress</div>
        <div style="font-size:10px;color:#c4b5fd;font-weight:700">${ivDone} / ${ivTotal} stats</div>
      </div>
      <div style="background:#1a1230;border-radius:20px;height:8px;overflow:hidden">
        <div style="height:100%;background:linear-gradient(90deg,#c084fc,#86efac);border-radius:20px;width:${ivPct}%;transition:width .5s ease"></div>
      </div>
    </div>

    <!-- Breeding stages checklist -->
    ${stages.length ? `
    <div>
      <div style="font-size:9px;color:#5b4690;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Stages (${stagesDone}/${stages.length})</div>
      ${stages.map((s, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #5b469011;cursor:pointer" onclick="toggleBreedStage(${p.id},${i})">
          <div style="width:18px;height:18px;border-radius:5px;border:2px solid ${s.done ? '#86efac' : '#5b4690'};background:${s.done ? '#86efac22' : 'none'};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s">
            ${s.done ? '<span style="color:#86efac;font-size:12px;font-weight:900">✓</span>' : ''}
          </div>
          <span style="font-size:12px;color:${s.done ? '#5b4690' : '#c4b5fd'};${s.done ? 'text-decoration:line-through' : ''}">${s.label}</span>
        </div>`).join('')}
    </div>` : ''}

    <!-- Notes -->
    ${p.notes ? `<div style="margin-top:12px;font-size:11px;color:#7060a8;font-style:italic;border-top:1px solid #5b469022;padding-top:10px">${p.notes}</div>` : ''}
  </div>`;
}

// ── Toggle a stage checkbox ───────────────────────────────────────────────────
function toggleBreedStage(id, stageIdx) {
  const p = breedProjects.find(b => b.id === id);
  if (!p || !p.stages?.[stageIdx]) return;
  p.stages[stageIdx].done = !p.stages[stageIdx].done;
  lsSet(LSB.PROJECTS, breedProjects);
  document.getElementById('bcard-' + id)?.outerHTML && renderBreedProjects();
}

function deleteBreed(id) {
  if (!confirm('Delete this breeding project?')) return;
  breedProjects = breedProjects.filter(p => p.id !== id);
  lsSet(LSB.PROJECTS, breedProjects);
  renderBreedProjects();
}

// ── New / Edit Project Modal ──────────────────────────────────────────────────
let editingBreedId = null;

function openNewBreedModal() {
  setTimeout(() => {
    initSpeciesAC('bf-species', null);
    initSpeciesAC('bf-p1-species', null);
    initSpeciesAC('bf-p2-species', null);
  }, 50);
  editingBreedId = null;
  clearBreedForm();
  document.getElementById('breed-modal-title').textContent = '🥚 New Breeding Project';
  showModal('breedModal');
  updateBreedPreview();
}

function openEditBreed(id) {
  setTimeout(() => {
    initSpeciesAC('bf-species', null);
    initSpeciesAC('bf-p1-species', null);
    initSpeciesAC('bf-p2-species', null);
  }, 50);
  const p = breedProjects.find(b => b.id === id);
  if (!p) return;
  editingBreedId = id;
  document.getElementById('breed-modal-title').textContent = '✎ Edit Project';
  // Populate form
  document.getElementById('bf-species').value    = p.species    || '';
  document.getElementById('bf-ball').value       = p.ball       || 'Moon';
  document.getElementById('bf-nature').value     = p.nature     || 'Jolly';
  document.getElementById('bf-ivs').value        = p.targetIVs  || '5IV -SpAtk';
  document.getElementById('bf-gender').value     = p.targetGender || 'Any';
  document.getElementById('bf-egg-cycles').value = p.eggCycles  || '';
  document.getElementById('bf-masuda').checked   = p.masuda     || false;
  document.getElementById('bf-want-shiny').checked = p.wantShiny || false;
  document.getElementById('bf-notes').value      = p.notes      || '';
  // Parents
  document.getElementById('bf-p1-species').value = p.parents?.[0]?.species  || '';
  document.getElementById('bf-p1-ivs').value     = p.parents?.[0]?.ivSpread || '';
  document.getElementById('bf-p1-nature').value  = p.parents?.[0]?.nature   || '';
  document.getElementById('bf-p1-ball').value    = p.parents?.[0]?.ball     || '';
  document.getElementById('bf-p1-item').value    = p.parents?.[0]?.holdsItem|| '';
  document.getElementById('bf-p2-species').value = p.parents?.[1]?.species  || '';
  document.getElementById('bf-p2-ivs').value     = p.parents?.[1]?.ivSpread || '';
  document.getElementById('bf-p2-nature').value  = p.parents?.[1]?.nature   || '';
  document.getElementById('bf-p2-ball').value    = p.parents?.[1]?.ball     || '';
  document.getElementById('bf-p2-item').value    = p.parents?.[1]?.holdsItem|| '';
  // Egg moves
  breedFormMoves = [...(p.eggMoves || [])];
  renderBreedFormMoves();
  showModal('breedModal');
  updateBreedPreview();
}

function clearBreedForm() {
  ['bf-species','bf-ivs','bf-notes','bf-egg-cycles',
   'bf-p1-species','bf-p1-ivs','bf-p1-nature','bf-p1-ball','bf-p1-item',
   'bf-p2-species','bf-p2-ivs','bf-p2-nature','bf-p2-ball','bf-p2-item'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('bf-ball').value     = 'Moon';
  document.getElementById('bf-nature').value   = 'Jolly';
  document.getElementById('bf-gender').value   = 'Any';
  document.getElementById('bf-masuda').checked = false;
  document.getElementById('bf-want-shiny').checked = false;
  breedFormMoves = [];
  renderBreedFormMoves();
}

let breedFormMoves = [];
function addBreedMove() {
  const inp = document.getElementById('bf-move-input');
  const val = inp?.value.trim();
  if (!val || breedFormMoves.length >= 4) return;
  breedFormMoves.push(val);
  inp.value = '';
  renderBreedFormMoves();
}
function removeBreedMove(i) {
  breedFormMoves.splice(i, 1);
  renderBreedFormMoves();
}
function renderBreedFormMoves() {
  const el = document.getElementById('bf-move-tags');
  if (!el) return;
  el.innerHTML = breedFormMoves.map((m, i) =>
    `<span class="tag" style="background:#231a3e;border-color:#c084fc22;color:#c4b5fd;cursor:pointer" onclick="removeBreedMove(${i})">${m} ✕</span>`
  ).join('');
}

function updateBreedPreview() {
  const sp  = document.getElementById('bf-species')?.value.trim();
  const img = document.getElementById('bf-preview-img');
  if (!img) return;
  if (sp) {
    const src = `https://img.pokemondb.net/sprites/home/normal/${sp.toLowerCase().replace(/\s/g,'-')}.png`;
    img.src = src;
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }
}

function saveBreedProject() {
  const species = document.getElementById('bf-species')?.value.trim();
  if (!species) { alert('Species is required'); return; }

  // Auto-generate stages based on IV target
  const ivTarget = document.getElementById('bf-ivs')?.value.trim() || '';
  const autoStages = buildIVStages(species, ivTarget,
    document.getElementById('bf-masuda')?.checked,
    breedFormMoves.length > 0
  );

  const project = {
    id:           editingBreedId || nextBid++,
    species,
    ball:         document.getElementById('bf-ball')?.value     || 'Moon',
    nature:       document.getElementById('bf-nature')?.value   || 'Jolly',
    targetIVs:    ivTarget,
    targetGender: document.getElementById('bf-gender')?.value   || 'Any',
    eggCycles:    parseInt(document.getElementById('bf-egg-cycles')?.value) || null,
    masuda:       document.getElementById('bf-masuda')?.checked || false,
    wantShiny:    document.getElementById('bf-want-shiny')?.checked || false,
    notes:        document.getElementById('bf-notes')?.value.trim() || '',
    eggMoves:     [...breedFormMoves],
    parents: [
      {
        species:   document.getElementById('bf-p1-species')?.value.trim() || '',
        ivSpread:  document.getElementById('bf-p1-ivs')?.value.trim() || '',
        nature:    document.getElementById('bf-p1-nature')?.value.trim() || '',
        ball:      document.getElementById('bf-p1-ball')?.value.trim() || '',
        holdsItem: document.getElementById('bf-p1-item')?.value.trim() || '',
      },
      {
        species:   document.getElementById('bf-p2-species')?.value.trim() || '',
        ivSpread:  document.getElementById('bf-p2-ivs')?.value.trim() || '',
        nature:    document.getElementById('bf-p2-nature')?.value.trim() || '',
        ball:      document.getElementById('bf-p2-ball')?.value.trim() || '',
        holdsItem: document.getElementById('bf-p2-item')?.value.trim() || '',
      },
    ].filter(p => p.species),
    stages: editingBreedId
      ? (breedProjects.find(b => b.id === editingBreedId)?.stages || autoStages)
      : autoStages,
    createdAt: editingBreedId
      ? (breedProjects.find(b => b.id === editingBreedId)?.createdAt || today())
      : today(),
  };

  if (editingBreedId) {
    breedProjects = breedProjects.map(b => b.id === editingBreedId ? project : b);
  } else {
    breedProjects.push(project);
  }

  lsSet(LSB.PROJECTS, breedProjects);
  lsSet(LSB.BID, nextBid);
  hideModal('breedModal');
  renderBreedProjects();
}

// Auto-generate breeding stages from IV target
function buildIVStages(species, ivTarget, isMasuda, hasEggMoves) {
  const stages = [];
  const ivs    = ivTarget.split('/').map(s => s.trim());
  const count  = ivs.filter(iv => iv === '31').length;

  if (hasEggMoves) {
    stages.push({ label: 'Get egg move parent(s)', done: false });
  }
  stages.push({ label: 'Get Destiny Knot parent', done: false });
  if (!isMasuda) {
    stages.push({ label: 'Get foreign language Ditto / parent', done: false });
  }
  stages.push({ label: `Breed to 4IV (${ivs.filter(iv => iv === '31').slice(0,4).join(' / ') || '31/31/31/31'})`, done: false });
  if (count >= 5) {
    stages.push({ label: 'Breed to 5IV', done: false });
  }
  if (count >= 6) {
    stages.push({ label: 'Breed to 6IV', done: false });
  }
  if (hasEggMoves) {
    stages.push({ label: 'Pass egg moves to final offspring', done: false });
  }
  stages.push({ label: 'Breed for correct nature (Everstone)', done: false });
  if (isMasuda) {
    stages.push({ label: 'Start Masuda hunting for shiny', done: false });
  }
  stages.push({ label: '🎉 Project complete!', done: false });
  return stages;
}

// ══ IV GUIDE TAB ═════════════════════════════════════════════════════════════
function renderIVGuide() {
  document.getElementById('breed-pane-guide').innerHTML = `
    <div class="cinzel" style="font-size:16px;font-weight:900;color:#ede9ff;margin-bottom:16px">IV Breeding Guide</div>

    <div class="breed-guide-section">
      <div class="bgs-title">The Basics</div>
      <div class="bgs-body">When breeding, 5 IVs are inherited from parents (with Destiny Knot).
      The 6th is random. Each parent must hold a <strong>Destiny Knot</strong> to pass 5 IVs instead of the default 3.</div>
    </div>

    <div class="breed-guide-section">
      <div class="bgs-title">Hatch Steps (Egg Cycles)</div>
      <div class="bgs-body">
        Each Pokémon has an <strong>egg cycle</strong> count. One cycle = 257 steps (modern games).
        A Pokémon with Flame Body or Magma Armor in your party halves the required steps.<br/><br/>
        <strong>Common egg cycles:</strong><br/>
        Ditto: 20 cycles (~5,140 steps) · Ralts: 20 · Bagon: 40 · Larvitar: 40 · Beldum: 40 · Riolu: 25
      </div>
    </div>

    <div class="breed-guide-section">
      <div class="bgs-title">Natures</div>
      <div class="bgs-body">Have a parent hold an <strong>Everstone</strong> to pass down its nature.
      One parent should hold Everstone, the other Destiny Knot.<br/><br/>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">
          ${Object.entries(NATURES_STAT).filter(([,v])=>v).map(([n,v])=>
            `<div style="font-size:11px"><span style="color:#c4b5fd;font-weight:700">${n}</span> <span style="color:#86efac">${v}</span></div>`
          ).join('')}
        </div>
      </div>
    </div>

    <div class="breed-guide-section">
      <div class="bgs-title">Gender Ratio Tips</div>
      <div class="bgs-body">
        Ditto can breed with almost any Pokémon regardless of gender. For Pokémon with skewed gender ratios
        (like Ralts at 50/50 or Riolu at 87.5% male), getting a female can take many attempts.
        A female of the target species passes down Apriball.</div>
    </div>

    <div class="breed-guide-section">
      <div class="bgs-title">Apriball Passing</div>
      <div class="bgs-body">
        Only the <strong>female</strong> parent passes down the ball (or either parent if breeding with Ditto).
        Plan which ball you want on the offspring and make sure the female carries it.
      </div>
    </div>

    <div class="breed-guide-section">
      <div class="bgs-title">Masuda Method</div>
      <div class="bgs-body">
        Breed two Pokémon from games in <strong>different languages</strong>. Shiny odds drop from 1/4096 to 1/683
        (1/512 with Shiny Charm). A foreign Ditto is the most flexible option — you only need one.
      </div>
    </div>
  `;
}

// ══ EGG MOVE CHAINS TAB ══════════════════════════════════════════════════════
// ── Unified ownership check: Aprimon + Living Dex caught ────────────────────
function getAllOwnedNames() {
  const names = new Set();
  // Aprimon collection
  mons.forEach(m => {
    names.add(m.species.toLowerCase());
    names.add(m.species.toLowerCase().replace(/\s+/g, '-'));
  });
  // Living Dex caught
  if (ldexNames && ldexData) {
    ldexNames.forEach(p => {
      if (ldexData[p.id]?.caught) {
        names.add(p.name.toLowerCase());
        names.add(p.display.toLowerCase());
        names.add(p.display.toLowerCase().replace(/\s+/g, '-'));
      }
    });
  }
  return names;
}

// ── Fuzzy Pokémon name search ─────────────────────────────────────────────────
function fuzzyMatchPokemon(query, limit) {
  limit = limit || 8;
  if (!ldexNames || !query) return [];
  var q = query.toLowerCase().trim();
  var results = [];
  for (var i = 0; i < ldexNames.length; i++) {
    var p = ldexNames[i];
    var name = p.name.toLowerCase();
    var disp = p.display.toLowerCase();
    if (name === q || disp === q)                  { results.push({ p:p, score:0 }); continue; }
    if (name.startsWith(q) || disp.startsWith(q)) { results.push({ p:p, score:1 }); continue; }
    if (name.includes(q)   || disp.includes(q))   { results.push({ p:p, score:2 }); continue; }
    var dist = levenshtein(q, name.slice(0, q.length + 2));
    if (dist <= 2) { results.push({ p:p, score:3 + dist }); }
  }
  return results.sort(function(a,b){ return a.score-b.score; }).slice(0, limit).map(function(r){ return r.p; });
}

function levenshtein(a, b) {
  var m = a.length, n = b.length;
  var dp = [];
  for (var i = 0; i <= m; i++) {
    dp[i] = [];
    for (var j = 0; j <= n; j++) dp[i][j] = i===0?j:j===0?i:0;
  }
  for (var i = 1; i <= m; i++)
    for (var j = 1; j <= n; j++)
      dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// ── Egg Move Chain Finder — step-by-step ─────────────────────────────────────
let emcSelectedSpecies = null;
let emcPokeData        = null;
let emcSpecData        = null;

function renderEggMoveChains() {
  emcSelectedSpecies = null;
  emcPokeData        = null;
  emcSpecData        = null;
  const el = document.getElementById('breed-pane-eggmoves');
  if (!el) return;
  el.innerHTML = `
    <div class="cinzel" style="font-size:16px;font-weight:900;color:#ede9ff;margin-bottom:4px">Egg Move Chain Finder</div>
    <div style="color:#5b4690;font-size:11px;margin-bottom:20px">Pick a Pokémon, then pick an egg move — we'll show compatible parents filtered by egg group</div>
    <div id="emc-step1">
      <div style="font-size:10px;color:#c084fc;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">① Target Pokémon</div>
      <div style="position:relative;max-width:380px">
        <input class="form-input" id="emc-species-input" placeholder="Start typing a name…"
          oninput="emcSpeciesInput()" autocomplete="off" style="width:100%"/>
        <div id="emc-species-dropdown" style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:200;
          background:#1e1535;border:1px solid #5b469066;border-radius:12px;overflow:hidden;
          box-shadow:0 8px 32px #00000088"></div>
      </div>
    </div>
    <div id="emc-step2" style="display:none;margin-top:20px"></div>
    <div id="emc-step3" style="margin-top:16px"></div>
  `;
}

function emcSpeciesInput() {
  const val = document.getElementById('emc-species-input')?.value.trim();
  const dd  = document.getElementById('emc-species-dropdown');
  if (!dd) return;
  if (!val || val.length < 2) { dd.style.display = 'none'; return; }
  if (!ldexNames) { ensureLdexNames().then(() => emcSpeciesInput()); return; }
  const matches = fuzzyMatchPokemon(val, 8);
  if (!matches.length) { dd.style.display = 'none'; return; }
  dd.style.display = 'block';
  dd.innerHTML = matches.map(p => {
    const sprite = `https://img.pokemondb.net/sprites/sword-shield/icon/${p.name}.png`;
    return `<div onclick="emcSelectSpecies('${p.name}','${p.display.replace(/'/g,"\\'")}','${p.id}')"
      style="display:flex;align-items:center;gap:10px;padding:8px 14px;cursor:pointer;transition:background .12s"
      onmouseover="this.style.background='#2b1f4e'" onmouseout="this.style.background='none'">
      <img src="${sprite}" width="40" height="30" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
      <span style="font-size:13px;color:#ede9ff;font-weight:700">${p.display}</span>
      <span style="font-size:10px;color:#5b4690;margin-left:auto">#${String(p.id).padStart(3,'0')}</span>
    </div>`;
  }).join('');
}

async function emcSelectSpecies(name, display, id) {
  const dd  = document.getElementById('emc-species-dropdown');
  const inp = document.getElementById('emc-species-input');
  const step2 = document.getElementById('emc-step2');
  const step3 = document.getElementById('emc-step3');
  if (dd)    dd.style.display = 'none';
  if (inp)   inp.value = display;
  if (step3) step3.innerHTML = '';
  emcSelectedSpecies = { name, display };
  step2.style.display = 'block';
  step2.innerHTML = `<div class="dex-loading"><div class="dex-loading-spinner"></div><div>Loading egg moves…</div></div>`;

  try {
    const { poke, spec } = await fetchPokeData(display);
    emcPokeData = poke;
    emcSpecData = spec;
    if (!poke) { step2.innerHTML = `<div style="color:#fda4af;font-size:12px">Could not load data for ${display}.</div>`; return; }

    const eggMoves = poke.moves
      .filter(m => m.version_group_details.some(vg => vg.move_learn_method.name === 'egg'))
      .map(m => m.move.name).sort();

    if (!eggMoves.length) {
      step2.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;background:#1e1535;border:1px solid #5b469033;border-radius:14px;padding:14px">
          <img src="https://img.pokemondb.net/sprites/home/normal/${name}.png" width="64" height="64" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
          <div><div class="cinzel" style="font-size:15px;font-weight:900;color:#ede9ff">${display}</div>
          <div style="color:#5b4690;font-size:12px;margin-top:4px">No egg moves found.</div></div>
        </div>`;
      return;
    }

    await Promise.all(eggMoves.map(m => fetchMoveDetails(m)));

    step2.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;background:#1e1535;border:1px solid #5b469033;border-radius:14px;padding:14px;margin-bottom:14px">
        <img src="https://img.pokemondb.net/sprites/home/normal/${name}.png" width="64" height="64" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
        <div>
          <div class="cinzel" style="font-size:15px;font-weight:900;color:#ede9ff">${display}</div>
          <div style="color:#7060a8;font-size:11px;margin-top:2px">${eggMoves.length} egg move${eggMoves.length!==1?'s':''} available</div>
          <button onclick="emcSelectedSpecies=null;document.getElementById('emc-step2').style.display='none';document.getElementById('emc-step3').innerHTML='';document.getElementById('emc-species-input').value='';document.getElementById('emc-species-input').focus()"
            style="margin-top:6px;background:none;border:1px solid #5b469033;color:#5b4690;padding:3px 10px;border-radius:8px;cursor:pointer;font-size:10px">↩ Change</button>
        </div>
      </div>
      <div style="font-size:10px;color:#c084fc;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">② Pick an egg move</div>
      <div style="display:flex;flex-direction:column;gap:4px" id="emc-move-list">
        ${eggMoves.map(mv => {
          const d    = moveCache[mv];
          const label = mv.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ');
          const tc   = d?.type ? (TYPE_COLORS[d.type]||'#888') : '#5b4690';
          const catCls = {physical:'move-cat-physical',special:'move-cat-special',status:'move-cat-status'};
          const catLbl = {physical:'Phys',special:'Spec',status:'Status'};
          return `<div onclick="emcPickMove('${mv}')"
            class="emc-move-row"
            style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#1e1535;border:1px solid #5b469022;border-radius:10px;cursor:pointer;transition:all .15s">
            <span style="font-size:13px;font-weight:700;color:#ede9ff;flex:1">${label}</span>
            ${d?.type ? `<span class="move-type-badge" style="background:${tc}22;color:${tc};border-color:${tc}44">${d.type}</span>` : ''}
            ${d?.category ? `<span class="move-cat-badge ${catCls[d.category]||''}">${catLbl[d.category]||d.category}</span>` : ''}
            ${d?.power ? `<span style="color:#fde68a;font-size:11px;font-weight:800">${d.power}</span>` : ''}
            <span style="color:#5b4690;font-size:16px">›</span>
          </div>`;
        }).join('')}
      </div>`;
  } catch(e) {
    step2.innerHTML = `<div style="color:#fda4af;font-size:12px">Failed: ${e.message}</div>`;
  }
}

async function emcPickMove(moveName) {
  const step3  = document.getElementById('emc-step3');
  if (!step3) return;
  const label  = moveName.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ');

  // Highlight selected move
  document.querySelectorAll('.emc-move-row').forEach(r => r.style.borderColor = '#5b469022');
  event?.currentTarget?.style && (event.currentTarget.style.borderColor = '#c084fc66');

  step3.innerHTML = `<div class="dex-loading"><div class="dex-loading-spinner"></div><div>Checking egg groups…</div></div>`;
  step3.scrollIntoView({ behavior:'smooth', block:'nearest' });

  try {
    // Get target's egg groups from spec data
    const targetEggGroups = emcSpecData?.egg_groups?.map(g => g.name) || [];
    const targetName      = emcSelectedSpecies?.display || '';

    // Fetch egg group members for each of the target's egg groups (usually 1-2 calls)
    let compatibleNames = new Set(); // all Pokémon that share at least one egg group
    await Promise.all(targetEggGroups.map(async groupName => {
      // Skip undiscovered (legendaries/baby Pokémon — can't breed)
      if (groupName === 'undiscovered' || groupName === 'no-eggs') return;

      const egData = await pokeGet('https://pokeapi.co/api/v2/egg-group/' + groupName);
      if (!egData) return;
      egData.pokemon_species.map(p => p.name).forEach(m => compatibleNames.add(m));
    }));

    // Ditto special case — can breed with almost anything
    compatibleNames.add('ditto');

    // Fetch move data
    const data = await pokeGet('https://pokeapi.co/api/v2/move/' + moveName);
    if (!data) { step3.innerHTML = '<div style="color:#fda4af">Move data not found.</div>'; return; }

    // Filter: must pass form filter + be egg-group compatible
    const allLearners = (data.learned_by_pokemon || []).filter(l => !shouldSkipEvoEntry(l.name));
    const compatible  = allLearners.filter(l => compatibleNames.has(l.name));
    const removed     = allLearners.length - compatible.length;

    const ownedNames  = getAllOwnedNames();
    const owned       = compatible.filter(l => ownedNames.has(l.name.toLowerCase()) || ownedNames.has(l.name.replace(/-/g,' ')));
    const notOwned    = compatible.filter(l => !owned.includes(l));

    // Egg group label for display
    const groupLabel  = targetEggGroups.filter(g => g !== 'undiscovered' && g !== 'no-eggs')
      .map(g => g.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ')).join(' & ');

    const noEggGroups = targetEggGroups.includes('undiscovered') || targetEggGroups.length === 0;

    const chipHTML = (list, hl) => list.map(l => {
      const disp   = l.name.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ');
      const sprite = `https://img.pokemondb.net/sprites/sword-shield/icon/${l.name}.png`;
      const clickHandler = hl ? `showEMCRouteToast('${disp}', event)` : `openDex('${disp}')`;
      return `<div class="learner-chip ${hl?'owned':''}"
        onclick="${clickHandler}"
        title="${disp}${hl ? ' · Tap to verify moves or use as parent' : ' · Tap to check move method in Dex'}">
        <img src="${sprite}" width="40" height="30" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
        <div class="learner-name">${disp}</div>
        ${hl ? '<div style="font-size:8px;color:#86efac;font-weight:800;letter-spacing:.05em;margin-top:1px">USE ›</div>' : '<div style="font-size:8px;color:#5b4690;font-weight:800;letter-spacing:.05em;margin-top:1px">DEX ›</div>'}
      </div>`;
    }).join('');

    if (noEggGroups) {
      step3.innerHTML = `
        <div style="background:#231a3e;border:1px solid #fda4af33;border-radius:16px;padding:16px;text-align:center">
          <div style="font-size:22px;margin-bottom:8px">🚫</div>
          <div style="font-weight:800;color:#fda4af;margin-bottom:6px">${targetName} cannot breed</div>
          <div style="font-size:12px;color:#7c6fa0">This Pokémon is in the Undiscovered egg group and cannot inherit egg moves through breeding.</div>
        </div>`;
      return;
    }

    step3.innerHTML = `
      <div style="background:#231a3e;border:1px solid #5b469044;border-radius:16px;padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-size:13px;font-weight:800;color:#ede9ff">${label} → ${targetName}</div>
            <div style="font-size:11px;color:#7060a8;margin-top:2px">${compatible.length} compatible parent${compatible.length!==1?'s':''} found</div>
          </div>
          <button onclick="this.closest('[style]').parentElement.innerHTML=''"
            style="background:none;border:1px solid #5b469033;color:#5b4690;padding:4px 12px;border-radius:8px;cursor:pointer;font-size:11px">✕</button>
        </div>

        <!-- Egg group badge -->
        <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:#1e1535;border:1px solid #c084fc22;border-radius:100px;margin-bottom:14px">
          <span style="font-size:10px;color:#7060a8">Egg group${targetEggGroups.length>1?'s':''}:</span>
          <span style="font-size:11px;font-weight:800;color:#c084fc">${groupLabel}</span>
          ${removed > 0 ? `<span style="font-size:10px;color:#5b4690">· ${removed} incompatible filtered out</span>` : ''}
        </div>

        ${owned.length ? `
          <div style="font-size:10px;color:#86efac;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">✓ You Own These (${owned.length})</div>
          <div class="learner-grid" style="margin-bottom:14px">${chipHTML(owned,true)}</div>
        ` : `<div style="font-size:11px;color:#5b4690;margin-bottom:12px">None of your Pokémon can pass this move yet.</div>`}
        ${notOwned.length ? `
          <div style="font-size:10px;color:#7060a8;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Other Compatible Parents (${notOwned.length})</div>
          <div class="learner-grid">${chipHTML(notOwned,false)}</div>
        ` : ''}

        <!-- Remaining caveat: learn method -->
        <div style="margin-top:12px;padding:10px 12px;background:#1a1230;border:1px solid #86efac22;border-radius:10px;font-size:11px;color:#7c6fa0;line-height:1.6">
          <span style="color:#86efac;font-weight:800">✓ Egg group verified.</span>
          These Pokémon share an egg group with ${targetName} and can learn <strong style="color:#c084fc">${label}</strong>.
          Learn method isn't confirmed — tap any Pokémon to open their Dex page and check how they learn it.
        </div>
      </div>`;
  } catch(e) {
    step3.innerHTML = `<div style="color:#fda4af;font-size:12px">Failed: ${e.message}</div>`;
  }
}


