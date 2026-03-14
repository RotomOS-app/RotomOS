function openDex(species) {
  currentDexSpecies = species;
  currentDexTab = 'overview';
  document.getElementById('dex-page').classList.add('visible');
  document.getElementById('dexTitle').textContent = species;
  document.getElementById('dexNumber').textContent = '';
  document.getElementById('dexTypes').innerHTML = '';
  document.getElementById('dexGenus').textContent = '';
  document.getElementById('dexCaughtBadges').innerHTML = '';

  // Reset tabs
  ['overview','moves','evolution','mydata'].forEach(t => {
    const btn  = document.getElementById('dtab-' + t);
    const pane = document.getElementById('dpane-' + t);
    if (btn)  btn.classList.toggle('active', t === 'overview');
    if (pane) pane.style.display = t === 'overview' ? 'block' : 'none';
  });

  // Show loading state in overview
  document.getElementById('dpane-overview').innerHTML = `
    <div class="dex-loading">
      <div class="dex-loading-spinner"></div>
      <div>Loading Pokédex data…</div>
    </div>`;

  loadDexPage(species);
}

function closeDex() {
  document.getElementById('dex-page').classList.remove('visible');
  currentDexSpecies = null;
}

function dexTab(tab) {
  currentDexTab = tab;
  ['overview','moves','evolution','mydata'].forEach(t => {
    const btn  = document.getElementById('dtab-' + t);
    const pane = document.getElementById('dpane-' + t);
    if (btn)  btn.classList.toggle('active', t === tab);
    if (pane) pane.style.display = t === tab ? 'block' : 'none';
  });
  if (tab === 'mydata') renderMyData(currentDexSpecies);
}

async function loadDexPage(species) {
  const { poke, spec, evo } = await fetchPokeData(species);

  // Update header
  if (poke) {
    const num = String(spec?.id || poke.id).padStart(4, '0');
    document.getElementById('dexNumber').textContent = '#' + num;
    document.getElementById('dexTypes').innerHTML = poke.types
      .map(t => {
        const c = TYPE_COLORS[t.type.name] || '#888';
        return `<span class="type-badge" style="background:${c}22;color:${c};border:1px solid ${c}44">${t.type.name}</span>`;
      }).join('');
  }
  if (spec) {
    const genus = spec.genera?.find(g => g.language.name === 'en')?.genus || '';
    document.getElementById('dexGenus').textContent = genus;
  }

  // Caught status badges in header
  const entry = dexData[species] || {};
  document.getElementById('dexCaughtBadges').innerHTML = `
    ${entry.caught     ? '<span style="background:#86efac22;border:1px solid #86efac44;color:#86efac;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px">✓ Caught</span>' : ''}
    ${entry.shinyFound ? '<span style="background:#fde68a22;border:1px solid #fde68a44;color:#fde68a;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px">★ Shiny</span>' : ''}
  `;

  renderOverviewTab(species, poke, spec);
  renderMovesTab(species, poke);
  renderEvolutionTab(species, poke, spec, evo);
  // mydata rendered on demand when tab clicked
}

// ── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function renderOverviewTab(species, poke, spec) {
  const entry = dexData[species] || { caught:false, shinyFound:false, encounters:[] };

  // Pick flavor text — prefer recent English game
  const flavorTexts = spec?.flavor_text_entries
    ?.filter(f => f.language.name === 'en')
    ?.slice(-6) || [];
  const flavorHTML = flavorTexts.length
    ? [...new Map(flavorTexts.map(f => [f.version.name, f])).values()]
        .slice(-3)
        .reverse()
        .map(f => `
          <div class="flavor-box">
            <div class="flavor-game">${f.version.name.replace(/-/g,' ')}</div>
            ${f.flavor_text.replace(/\f|\n/g,' ')}
          </div>`).join('')
    : '<div class="flavor-box" style="color:#5b4690">No Pokédex entries available.</div>';

  // Stats
  const statsHTML = poke?.stats.map(s => {
    const pct = Math.round(s.base_stat / 255 * 100);
    const col = STAT_COLORS[s.stat.name] || '#c4b5fd';
    const name = STAT_NAMES[s.stat.name] || s.stat.name;
    return `
      <div class="stat-row-bar">
        <div class="stat-name">${name}</div>
        <div class="stat-num" style="color:${col}">${s.base_stat}</div>
        <div class="stat-track">
          <div class="stat-fill" style="width:${pct}%;background:${col}"></div>
        </div>
      </div>`;
  }).join('') || '<div style="color:#5b4690">No stat data.</div>';

  const bst = poke?.stats.reduce((a,s) => a + s.base_stat, 0) || 0;

  // Abilities
  const abilitiesHTML = poke?.abilities.map(a => {
    const name = a.ability.name.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ');
    return `<span class="ability-pill ${a.is_hidden ? 'hidden' : ''}">${a.is_hidden ? '🌟 ' : ''}${name}</span>`;
  }).join(' ') || '';

  // Info chips
  const height = poke ? (poke.height / 10).toFixed(1) + 'm' : '?';
  const weight = poke ? (poke.weight / 10).toFixed(1) + 'kg' : '?';
  const genderRate = spec?.gender_rate;
  let genderHTML = '—';
  if (genderRate === -1) genderHTML = 'Genderless';
  else if (genderRate !== undefined) {
    const femPct = Math.round(genderRate / 8 * 100);
    genderHTML = `♂ ${100-femPct}% · ♀ ${femPct}%`;
  }
  const captureRate = spec?.capture_rate ?? '?';
  const baseHappy   = spec?.base_happiness ?? '?';
  const eggGroups   = spec?.egg_groups?.map(e => e.name.replace('-',' ')).join(', ') || '?';
  const growthRate  = spec?.growth_rate?.name?.replace(/-/g,' ') || '?';
  const habitat     = spec?.habitat?.name?.replace(/-/g,' ') || '?';

  // Gender differences note
  const hasGenderDiff = spec?.has_gender_differences;
  const genderDiffHTML = hasGenderDiff
    ? `<div class="gender-diff-box">♀♂ This Pokémon has visible gender differences in its appearance.</div>`
    : '';

  // Catch status toggles
  const catchHTML = `
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
      <div class="caught-toggle" style="background:${entry.caught?'#2d1f5e':'#231d45'};border-color:${entry.caught?'#d4a8ff44':'#5b4690'};flex:1;min-width:140px" onclick="toggleCaught('${species}','caught');loadDexPage('${species}')">
        <div class="caught-dot" style="background:${entry.caught?'#a78bfa':'#3d3570'};color:${entry.caught?'#000':'#5a5190'}">${entry.caught?'✓':'○'}</div>
        <div><div class="cinzel" style="color:${entry.caught?'#c084fc':'#8b80b8'};font-size:13px;font-weight:700">Caught</div><div style="color:#7c6fa0;font-size:10px">Normal form</div></div>
      </div>
      <div class="caught-toggle" style="background:${entry.shinyFound?'#2d2518':'#2f2358'};border-color:${entry.shinyFound?'#fde68a44':'#5b4690'};flex:1;min-width:140px" onclick="toggleCaught('${species}','shinyFound');loadDexPage('${species}')">
        <div class="caught-dot" style="background:${entry.shinyFound?'#FFD700':'#3d3570'};color:${entry.shinyFound?'#000':'#5a5190'}">${entry.shinyFound?'★':'☆'}</div>
        <div><div class="cinzel" style="color:${entry.shinyFound?'#FFD700':'#8b80b8'};font-size:13px;font-weight:700">Shiny</div><div style="color:#7c6fa0;font-size:10px">Shiny form</div></div>
      </div>
    </div>`;

  document.getElementById('dpane-overview').innerHTML = `
    <!-- Sprites hero -->
    <div style="display:flex;align-items:center;justify-content:center;gap:24px;background:linear-gradient(135deg,#231a3e,#1e1535);border-radius:20px;padding:24px;margin-bottom:20px;border:1px solid #5b469022" class="dex-sprite-showcase">
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <div style="position:relative">${spr(species,false,96,'#c084fc')}</div>
        <div style="font-size:9px;color:#5b4690;font-weight:700;text-transform:uppercase;letter-spacing:.1em">Normal</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <div style="position:relative">${spr(species,true,96,'#FFD700')}</div>
        <div style="font-size:9px;color:#fde68a55;font-weight:700;text-transform:uppercase;letter-spacing:.1em">✦ Shiny</div>
      </div>
    </div>

    ${genderDiffHTML}
    ${catchHTML}

    <!-- Info chips -->
    <div class="info-chips">
      <div class="info-chip">Height <span>${height}</span></div>
      <div class="info-chip">Weight <span>${weight}</span></div>
      <div class="info-chip">Gender <span>${genderHTML}</span></div>
      <div class="info-chip">Catch Rate <span>${captureRate}</span></div>
      <div class="info-chip">Base Happiness <span>${baseHappy}</span></div>
      <div class="info-chip">Egg Groups <span>${eggGroups}</span></div>
    </div>

    <!-- Abilities -->
    <div class="dex-section" style="margin-bottom:20px">
      <div class="dex-section-title" style="margin-bottom:10px">Abilities</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${abilitiesHTML}</div>
    </div>

    <!-- Base stats -->
    <div class="dex-section" style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px">
        <div class="dex-section-title">Base Stats</div>
        <div style="font-size:11px;color:#7060a8;font-weight:700">BST <span style="color:#c4b5fd">${bst}</span></div>
      </div>
      ${statsHTML}
    </div>

    <!-- Pokédex entries -->
    <div class="dex-section">
      <div class="dex-section-title" style="margin-bottom:12px">Pokédex Entries</div>
      ${flavorHTML}
    </div>

    <!-- Credit -->
    <div style="text-align:center;padding:20px 0 8px;font-size:10px;color:#3d3070;line-height:1.8">
      Pokédex data provided by
      <a href="https://pokeapi.co" target="_blank" style="color:#5b4690;text-decoration:none;font-weight:700">PokéAPI</a>
      · Sprites by
      <a href="https://pokemondb.net" target="_blank" style="color:#5b4690;text-decoration:none;font-weight:700">PokémonDB</a><br/>
      <span style="color:#2e2858">Pokémon and all related names are trademarks of Nintendo / Game Freak.</span>
    </div>
  `;
}

// ── MOVES TAB ────────────────────────────────────────────────────────────────
const moveCache = {}; // move-name -> { type, category, power, accuracy }

async function fetchMoveDetails(moveName) {
  if (moveCache[moveName]) return moveCache[moveName];
  try {
    const data = await pokeGet(`https://pokeapi.co/api/v2/move/${moveName}`);
    if (!data) return null;
    const detail = {
      type:     data.type?.name || null,
      category: data.damage_class?.name || null, // physical / special / status
      power:    data.power || null,
      accuracy: data.accuracy || null,
    };
    moveCache[moveName] = detail;
    return detail;
  } catch { return null; }
}

async function renderMovesTab(species, poke) {
  if (!poke) {
    document.getElementById('dpane-moves').innerHTML = '<div class="dex-loading"><div style="color:#5b4690">No move data available.</div></div>';
    return;
  }

  // Group moves by learn method, dedupe
  const byMethod = {};
  poke.moves.forEach(m => {
    m.version_group_details.forEach(vg => {
      const method = vg.move_learn_method.name;
      if (!byMethod[method]) byMethod[method] = [];
      const existing = byMethod[method].find(x => x.name === m.move.name);
      if (!existing || vg.level_learned_at > existing.level) {
        if (existing) byMethod[method].splice(byMethod[method].indexOf(existing), 1);
        byMethod[method].push({ name: m.move.name, level: vg.level_learned_at });
      }
    });
  });

  const primaryMethods = ['level-up','egg','machine','tutor'].filter(m => byMethod[m]?.length);
  const methodLabels = { 'level-up':'Level Up', 'egg':'Egg Moves', 'machine':'TM / TR', 'tutor':'Tutor' };

  // Show skeleton immediately
  document.getElementById('dpane-moves').innerHTML = `
    <div class="move-filter-row" id="moveFilterRow">
      ${primaryMethods.map(m => `
        <button class="move-filter-btn ${m === currentMoveFilter ? 'active' : ''}"
          onclick="setMoveFilter('${m}')">${methodLabels[m]||m}
          <span style="color:#5b4690">(${byMethod[m].length})</span>
        </button>`).join('')}
    </div>
    <div id="moveTableWrap">
      <div class="dex-loading" style="padding:30px">
        <div class="dex-loading-spinner"></div>
        <div>Loading move data…</div>
      </div>
    </div>`;

  // Batch-fetch all unique moves across all primary methods
  const allMoveNames = [...new Set(primaryMethods.flatMap(m => byMethod[m].map(mv => mv.name)))];
  await Promise.all(allMoveNames.map(fetchMoveDetails));

  // Render with full details
  const catClass = { physical:'move-cat-physical', special:'move-cat-special', status:'move-cat-status' };
  const catLabel = { physical:'Phys', special:'Spec', status:'Status' };

  const makeMoveTable = (moves, method) => {
    const sorted = method === 'level-up'
      ? [...moves].sort((a,b) => a.level - b.level)
      : [...moves].sort((a,b) => a.name.localeCompare(b.name));

    const stabTypes = new Set(poke.types.map(t => t.type.name));
    const isEgg = method === 'egg';

    const rows = sorted.map(mv => {
      const name   = mv.name.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ');
      const detail = moveCache[mv.name];
      const tc     = detail?.type ? (TYPE_COLORS[detail.type] || '#888') : '#5b4690';
      const isStab = detail?.type && stabTypes.has(detail.type);
      const typeCell = detail?.type
        ? `<span class="move-type-badge" style="background:${tc}22;color:${tc};border-color:${tc}44">${detail.type}${isStab ? '<span style="font-size:8px;font-weight:900;margin-left:3px"> STAB</span>' : ''}</span>`
        : '<span style="color:#3d3070">—</span>';
      const catCell = detail?.category
        ? `<span class="move-cat-badge ${catClass[detail.category]||''}">${catLabel[detail.category]||detail.category}</span>`
        : '<span style="color:#3d3070">—</span>';
      const pwrCell = detail?.power    ? `<span class="move-power-val">${detail.power}</span>`    : '<span style="color:#3d3070">—</span>';
      const accCell = detail?.accuracy ? `<span class="move-acc-val">${detail.accuracy}</span>`   : '<span style="color:#3d3070">—</span>';

      const rowId      = 'eggrow-' + mv.name.replace(/[^a-z0-9]/g,'');
      const panelId    = 'eggpanel-' + mv.name.replace(/[^a-z0-9]/g,'');
      const clickAttr  = isEgg ? `onclick="toggleEggLearners('${mv.name}','${rowId}','${panelId}')" class="egg-move-row"` : 'class=""';
      const chevron    = isEgg ? `<td style="color:#5b4690;font-size:11px;padding-right:10px">›</td>` : '';

      return `
        <tr id="${rowId}" ${clickAttr}>
          <td class="move-name">${name}${isEgg ? '<span style="font-size:9px;color:#5b4690;margin-left:4px">· tap</span>' : ''}</td>
          <td>${typeCell}</td>
          <td>${catCell}</td>
          <td>${pwrCell}</td>
          <td>${accCell}</td>
          ${chevron}
        </tr>
        ${isEgg ? `<tr id="${panelId}-row" style="display:none"><td colspan="6" style="padding:0 8px 8px">
          <div class="egg-learner-panel open" id="${panelId}">
            <div style="font-size:10px;font-weight:800;color:#7060a8;text-transform:uppercase;letter-spacing:.1em">Who can pass this move?</div>
            <div class="learner-loading" id="${panelId}-status">Loading…</div>
            <div class="learner-grid" id="${panelId}-grid"></div>
          </div>
        </td></tr>` : ''}`;
    }).join('');

    return `
      <table class="move-table" style="width:100%">
        <thead><tr>
          <th>Move</th>
          <th>Type</th>
          <th>Cat</th>
          <th>Pwr</th>
          <th>Acc</th>
          ${isEgg ? '<th></th>' : ''}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  };

  // Store byMethod on window so setMoveFilter can re-render
  window._currentMoveData = { byMethod, primaryMethods, makeMoveTable };

  const wrap = document.getElementById('moveTableWrap');
  if (wrap) {
    wrap.innerHTML = primaryMethods.map(m => `
      <div id="moves-${m.replace('-','')}pane" style="display:${m === currentMoveFilter ? 'block' : 'none'}">
        ${makeMoveTable(byMethod[m], m)}
      </div>`).join('');
  }
}

function setMoveFilter(method) {
  currentMoveFilter = method;
  document.querySelectorAll('.move-filter-btn').forEach(b => {
    const labels = {'level-up':'Level Up','egg':'Egg Moves','machine':'TM / TR','tutor':'Tutor'};
    b.classList.toggle('active', b.textContent.trim().startsWith(labels[method]||method));
  });
  document.querySelectorAll('[id^="moves-"]').forEach(p => p.style.display = 'none');
  const pane = document.getElementById('moves-' + method.replace('-','') + 'pane');
  if (pane) pane.style.display = 'block';
}

// ── EVOLUTION TAB ─────────────────────────────────────────────────────────────
function renderEvolutionTab(species, poke, spec, evo) {
  const el = document.getElementById('dpane-evolution');
  if (!evo) {
    el.innerHTML = '<div class="dex-loading"><div style="color:#5b4690">No evolution data available.</div></div>';
    return;
  }

  // Flatten evolution chain into stages
  function flattenChain(chain) {
    const stages = [];
    let current = chain;
    while (current) {
      const name = current.species.name;
      const triggers = current.evolution_details?.map(d => {
        const parts = [];
        if (d.min_level)              parts.push(`Lv. ${d.min_level}`);
        if (d.item)                   parts.push(d.item.name.replace(/-/g,' '));
        if (d.held_item)              parts.push(`hold ${d.held_item.name.replace(/-/g,' ')}`);
        if (d.trigger?.name === 'use-item' && d.item) parts.push(d.item.name.replace(/-/g,' '));
        if (d.min_happiness)          parts.push(`Happiness ${d.min_happiness}+`);
        if (d.min_affection)          parts.push(`Affection ${d.min_affection}+`);
        if (d.time_of_day)            parts.push(d.time_of_day);
        if (d.known_move)             parts.push(`know ${d.known_move.name.replace(/-/g,' ')}`);
        if (d.known_move_type)        parts.push(`know ${d.known_move_type.name} move`);
        if (d.location)               parts.push(d.location.name.replace(/-/g,' '));
        if (d.needs_overworld_rain)   parts.push('rain');
        if (d.turn_upside_down)       parts.push('upside down');
        if (d.gender !== null && d.gender !== undefined) parts.push(d.gender === 1 ? '♀ only' : '♂ only');
        if (d.trigger?.name === 'trade') parts.push('Trade');
        if (!parts.length && d.trigger) parts.push(d.trigger.name.replace(/-/g,' '));
        return parts.join(', ');
      }) || [];
      stages.push({ name, triggers, evolvesTo: current.evolves_to });
      if (current.evolves_to?.length === 1) {
        current = current.evolves_to[0];
      } else {
        // Branch — handle separately
        current = null;
      }
    }
    return stages;
  }

  // Render the chain recursively
  function renderChain(chain, depth=0) {
    const name = chain.species.name;

    // Skip legendaries and alternate/battle forms
    if (shouldSkipEvoEntry(name)) return '';

    const displayName = name.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
    const isCurrent = name.toLowerCase() === species.toLowerCase();
    const isCaught  = !!(dexData[displayName]?.caught);
    const sprSrc    = `https://img.pokemondb.net/sprites/home/normal/${name}.png`;
    const num       = chain.species.url.split('/').filter(Boolean).pop();

    const nodeHTML = `
      <div class="evo-node ${isCurrent?'current':''} ${isCaught?'caught':''}" onclick="openDex('${displayName}')">
        <img src="${sprSrc}" width="64" height="64" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
        <div class="evo-name">${displayName}</div>
        <div class="evo-num">#${String(num).padStart(3,'0')}</div>
        ${isCaught ? '<div style="font-size:9px;color:#86efac;font-weight:700">✓ Caught</div>' : ''}
      </div>`;

    if (!chain.evolves_to?.length) return nodeHTML;

    return chain.evolves_to
      .filter(next => !shouldSkipEvoEntry(next.species.name))
      .map(next => {
      const trigger = next.evolution_details?.[0];
      const parts = [];
      if (trigger) {
        if (trigger.min_level)            parts.push(`Lv. ${trigger.min_level}`);
        if (trigger.item)                 parts.push(trigger.item.name.replace(/-/g,' '));
        if (trigger.held_item)            parts.push(`Hold: ${trigger.held_item.name.replace(/-/g,' ')}`);
        if (trigger.min_happiness)        parts.push(`Happiness`);
        if (trigger.min_affection)        parts.push(`Affection`);
        if (trigger.time_of_day)          parts.push(trigger.time_of_day);
        if (trigger.known_move)           parts.push(trigger.known_move.name.replace(/-/g,' '));
        if (trigger.needs_overworld_rain) parts.push('Rain');
        if (trigger.turn_upside_down)     parts.push('Upside Down');
        if (trigger.trigger?.name === 'trade') parts.push('Trade');
        if (!parts.length && trigger.trigger) parts.push(trigger.trigger.name.replace(/-/g,' '));
      }
      const methodText = parts.join(' · ') || '→';

      return `
        <div class="evo-row">
          ${nodeHTML}
          <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
            <div class="evo-arrow">→</div>
            <div class="evo-method">${methodText}</div>
          </div>
          <div>${renderChain(next, depth+1)}</div>
        </div>`;
    }).join('');
  }

  el.innerHTML = `
    <div class="dex-section-title" style="margin-bottom:16px">Evolution Chain</div>
    <div class="evo-chain">${renderChain(evo.chain)}</div>
    <div style="margin-top:16px;font-size:10px;color:#5b4690;font-style:italic">Tap any Pokémon in the chain to open its Dex page.</div>
  `;
}

// ── MY DATA TAB ───────────────────────────────────────────────────────────────
function renderMyData(species) {
  const entry    = dexData[species] || { caught:false, shinyFound:false, encounters:[] };
  const variants = mons.filter(m => m.species.toLowerCase() === species.toLowerCase());
  const owned    = variants.filter(m => m.tradeStatus !== 'wanted');
  const wanted   = variants.filter(m => m.tradeStatus === 'wanted');
  const ownedBalls = new Set(owned.map(m => m.ball));
  const wantedBalls= new Set(wanted.map(m => m.ball));

  // Ball collection grid
  const gridHTML = BALL_NAMES.map(b => {
    const bbc      = BALLS[b];
    const o        = ownedBalls.has(b);
    const w        = wantedBalls.has(b) && !o;
    const qty      = owned.filter(m => m.ball===b).reduce((s,m)=>s+m.quantity,0);
    const mon      = owned.find(m=>m.ball===b) || wanted.find(m=>m.ball===b);
    const legality = getBallLegality(species, b);
    const illegal  = legality === 'illegal';

    const bg      = o ? `${bbc.accent}15` : w ? '#fda4af08' : '#2b1f4e';
    const border  = o ? bbc.accent+'44'  : w ? '#fda4af44' : '#2e2858';
    const nameCol = o ? bbc.light        : w ? '#fda4af88' : '#3d3570';
    const img     = bImg(b, 32, !o && !w);
    const label   = o ? `<span style="font-size:8px;color:${bbc.accent}">×${qty}</span>`
                  : w ? `<span style="font-size:8px;color:#fda4af88">want</span>` : '';

    const illegalOverlay = illegal ? `
      <div class="bgi-illegal-overlay" title="${b} Ball is not legal for ${species}">
        <svg viewBox="0 0 24 24" width="28" height="28" stroke="#fda4af" stroke-width="2.5" fill="none">
          <circle cx="12" cy="12" r="10"/><line x1="5" y1="5" x2="19" y2="19"/>
        </svg>
      </div>` : '';

    return `<div class="bgi ${illegal ? 'bgi-illegal' : ''}" title="${b}${illegal ? ' — not legal for '+species : mon?' — '+mon.nature+', '+mon.ivSpread:''}" style="background:${illegal?'#1a1230':bg};border:1px solid ${illegal?'#fda4af18':border};${illegal?'opacity:.45':''}">
      ${illegalOverlay}${img}<span style="font-size:9px;color:${illegal?'#fda4af33':nameCol}">${b}</span>${label}
    </div>`;
  }).join('');

  const missing = BALL_NAMES.filter(b => !ownedBalls.has(b) && getBallLegality(species, b) !== 'illegal');

  // Encounter log
  const mOpts = EGG_METHODS.map(m=>`<option>${m}</option>`).join('');
  const gOpts = GAMES.map(g=>`<option>${g}</option>`).join('');
  const encsHTML = entry.encounters.length
    ? entry.encounters.map(e => `
        <div class="enc-entry ${e.isShiny?'shiny':''} ${e.isFailed?'failed':''}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:8px">
              ${e.isShiny ? (e.isFailed ? '<span style="color:#fda4af;font-size:13px">💔</span>' : '<span style="color:#FFD700;font-size:13px;filter:drop-shadow(0 0 4px #FFD700)">★</span>') : ''}
              <span class="cinzel" style="color:${e.isFailed?'#fda4af':e.isShiny?'#FFD700':'#c084fc'};font-size:13px;font-weight:700">${e.method}</span>
              <span style="color:#8b80b8;font-size:11px">· ${e.game}</span>
            </div>
            <span style="color:#7c6fa0;font-size:11px">${e.date}</span>
          </div>
          ${e.notes?`<div style="color:#9d93c0;font-size:12px;font-style:italic;margin-top:6px">${e.notes}</div>`:''}
        </div>`).join('')
    : '<div class="empty-state" style="padding:24px 0">No encounters logged yet.</div>';

  document.getElementById('dpane-mydata').innerHTML = `
    <!-- Caught toggles -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
      <div class="caught-toggle" style="background:${entry.caught?'#2d1f5e':'#231d45'};border-color:${entry.caught?'#d4a8ff44':'#5b4690'};flex:1;min-width:140px" onclick="toggleCaught('${species}','caught');renderMyData('${species}')">
        <div class="caught-dot" style="background:${entry.caught?'#a78bfa':'#3d3570'};color:${entry.caught?'#000':'#5a5190'}">${entry.caught?'✓':'○'}</div>
        <div><div class="cinzel" style="color:${entry.caught?'#c084fc':'#8b80b8'};font-size:13px;font-weight:700">Caught</div></div>
      </div>
      <div class="caught-toggle" style="background:${entry.shinyFound?'#2d2518':'#2f2358'};border-color:${entry.shinyFound?'#fde68a44':'#5b4690'};flex:1;min-width:140px" onclick="toggleCaught('${species}','shinyFound');renderMyData('${species}')">
        <div class="caught-dot" style="background:${entry.shinyFound?'#FFD700':'#3d3570'};color:${entry.shinyFound?'#000':'#5a5190'}">${entry.shinyFound?'★':'☆'}</div>
        <div><div class="cinzel" style="color:${entry.shinyFound?'#FFD700':'#8b80b8'};font-size:13px;font-weight:700">Shiny</div></div>
      </div>
    </div>

    <!-- Ball grid -->
    <div class="dex-section" style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px">
        <div class="dex-section-title">Apriball Collection</div>
        <div style="font-size:11px"><span style="color:#c084fc">${ownedBalls.size}</span><span style="color:#7c6fa0"> / ${BALL_NAMES.filter(b => getBallLegality(species,b) !== 'illegal').length} legal</span></div>
      </div>
      <div class="ball-grid">${gridHTML}</div>
      ${missing.length
        ? `<div class="missing-box"><div style="color:#fdba74;font-size:10px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Missing (${missing.length})</div><div class="tag-row">${missing.map(b=>`<span class="tag" style="background:#3d2040;border-color:#fdba7430;color:#fdba74">${b}</span>`).join('')}</div></div>`
        : `<div class="complete-box">✓ Full Apriball set complete!</div>`}
    </div>

    <!-- Encounter log -->
    <div class="dex-section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="dex-section-title">Encounter Log</div>
        <button onclick="toggleLogForm('${species}')" id="logToggleBtn" class="dex-log-btn" style="background:linear-gradient(135deg,#2d1f5e,#2a2255);border:1px solid #c084fc30;color:#c084fc;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px">+ Log</button>
      </div>
      <div id="logForm" style="display:none">
        <div class="enc-log-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div><div class="form-label">Date</div><input type="date" id="logDate" class="form-input" value="${new Date().toISOString().slice(0,10)}"/></div>
            <div><div class="form-label">Method</div><select id="logMethod" class="form-select">${mOpts}</select></div>
            <div><div class="form-label">Game</div><select id="logGame" class="form-select">${gOpts}</select></div>
            <div style="display:flex;align-items:center;gap:10px;padding-top:18px">
              <input type="checkbox" id="logShiny" style="width:16px;height:16px;accent-color:#FFD700"/>
              <label for="logShiny" style="color:#FFD700;font-size:13px;cursor:pointer">★ Shiny</label>
            </div>
          </div>
          <div class="form-label">Notes</div>
          <textarea id="logNotes" class="form-textarea" style="margin-bottom:12px" placeholder="Details…"></textarea>
          <button onclick="saveEncounter('${species}')" class="dex-save-enc-btn" style="background:linear-gradient(135deg,#2d1f5e,#2a2255);border:1px solid #c084fc44;color:#c084fc;padding:9px;border-radius:6px;cursor:pointer;font-family:'Cinzel',serif;font-size:13px;font-weight:700;width:100%">Save Encounter</button>
        </div>
      </div>
      ${encsHTML}
    </div>
  `;
}


// ── Reddit ────────────────────────────────────────────────────────────────────
