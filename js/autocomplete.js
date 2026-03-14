// ══ REUSABLE SPECIES AUTOCOMPLETE ════════════════════════════════════════════
// Usage: initSpeciesAC('input-id', onSelectCallback)
// onSelectCallback(name, display, id) is called when user picks

const acState = {}; // keyed by inputId

function initSpeciesAC(inputId, onSelect) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Wrap input in relative container if not already
  if (!input.parentElement.classList.contains('species-ac-wrap')) {
    const wrap = document.createElement('div');
    wrap.className = 'species-ac-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
  }

  // Create dropdown if not already there
  const ddId = inputId + '-ac-dd';
  let dd = document.getElementById(ddId);
  if (!dd) {
    dd = document.createElement('div');
    dd.id = ddId;
    dd.className = 'species-ac-dropdown';
    input.parentElement.appendChild(dd);
  }

  // Only update onSelect if already initialised for this input
  if (acState[inputId]) {
    acState[inputId].onSelect = onSelect;
    return;
  }
  acState[inputId] = { activeIdx: -1, matches: [], onSelect };

  input.addEventListener('input', () => acRefresh(inputId));
  input.addEventListener('keydown', (e) => acKeydown(e, inputId));
  input.addEventListener('blur', () => setTimeout(() => acClose(inputId), 150));
  input.setAttribute('autocomplete', 'off');
}

function acRefresh(inputId) {
  const input = document.getElementById(inputId);
  const dd    = document.getElementById(inputId + '-ac-dd');
  if (!input || !dd) return;

  const val = input.value.trim();
  if (!val || val.length < 2) { acClose(inputId); return; }

  ensureLdexNames().then(() => {
    const matches = fuzzyMatchPokemon(val, 8);
    acState[inputId].matches   = matches;
    acState[inputId].activeIdx = -1;

    if (!matches.length) { acClose(inputId); return; }

    dd.innerHTML = matches.map((p, i) => {
      const sprite = `https://img.pokemondb.net/sprites/sword-shield/icon/${p.name}.png`;
      return `<div class="species-ac-item" data-idx="${i}"
        onmousedown="acSelect('${inputId}', ${i})"
        onmouseover="acSetActive('${inputId}',${i})">
        <img src="${sprite}" width="36" height="27"
          onerror="this.src='https://img.pokemondb.net/sprites/home/normal/${p.name}.png';this.style.width='28px';this.style.height='28px';this.onerror=null"/>
        <span>${p.display}</span>
        <span class="species-ac-num">#${String(p.id).padStart(3,'0')}</span>
      </div>`;
    }).join('');
    dd.classList.add('open');
  });
}

function acSetActive(inputId, idx) {
  acState[inputId].activeIdx = idx;
  const dd = document.getElementById(inputId + '-ac-dd');
  if (!dd) return;
  dd.querySelectorAll('.species-ac-item').forEach((el, i) =>
    el.classList.toggle('active', i === idx));
}

function acSelect(inputId, idx) {
  const state = acState[inputId];
  if (!state) return;
  const p = state.matches[idx];
  if (!p) return;
  const input = document.getElementById(inputId);
  if (input) input.value = p.display;
  acClose(inputId);
  if (state.onSelect) state.onSelect(p.name, p.display, p.id);
}

function acKeydown(e, inputId) {
  const state = acState[inputId];
  if (!state || !state.matches.length) return;
  const dd = document.getElementById(inputId + '-ac-dd');
  if (!dd || !dd.classList.contains('open')) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    acSetActive(inputId, Math.min(state.activeIdx + 1, state.matches.length - 1));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    acSetActive(inputId, Math.max(state.activeIdx - 1, 0));
  } else if (e.key === 'Enter' && state.activeIdx >= 0) {
    e.preventDefault();
    acSelect(inputId, state.activeIdx);
  } else if (e.key === 'Escape') {
    acClose(inputId);
  }
}

function acClose(inputId) {
  const dd = document.getElementById(inputId + '-ac-dd');
  if (dd) dd.classList.remove('open');
  if (acState[inputId]) acState[inputId].activeIdx = -1;
}

// ── Init all species fields on boot ──────────────────────────────────────────
function initAllSpeciesAC() {
  // Aprimon add/edit modal
  initSpeciesAC('fSpecies', (name, display) => {
    const prev = document.getElementById('previewSprite');
    if (prev) prev.src = `https://img.pokemondb.net/sprites/home/normal/${name}.png`;
  });

  // New hunt modal
  initSpeciesAC('nh-species', (name, display) => {
    const prev = document.getElementById('nhSpritePreview');
    if (prev) prev.src = `https://img.pokemondb.net/sprites/home/normal/${name}.png`;
  });

  // Breeding project target
  initSpeciesAC('bf-species', (name, display) => {
    // trigger breed preview if it exists
  });

  // Breeding parents
  initSpeciesAC('bf-p1-species', null);
  initSpeciesAC('bf-p2-species', null);
}


// ══ TRAINER NAME ═════════════════════════════════════════════════════════════
const LS_TRAINER_NAME = 'at_trainer_name';
let trainerName = lsGet(LS_TRAINER_NAME, null);
