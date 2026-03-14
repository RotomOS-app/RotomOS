
function getTrainer() {
  return trainerName || 'Trainer';
}

function saveTrainerName(override) {
  const input = document.getElementById('trainer-name-input');
  const name  = override || input?.value.trim() || 'Trainer';
  trainerName = name;
  lsSet(LS_TRAINER_NAME, name);

  // Update sidebar status
  const status = document.getElementById('rotom-status-text');
  if (status) status.textContent = `Welcome, ${name}-zzzt! ⚡`;

  // Dismiss onboarding
  const ob = document.getElementById('rotom-onboarding');
  if (ob) {
    ob.style.opacity = '0';
    setTimeout(() => { ob.style.display = 'none'; }, 400);
  }

  // Fire personalised greeting after dismissal
  setTimeout(() => {
    const hr = new Date().getHours();
    let timeKey;
    if      (hr >= 5  && hr < 9)  timeKey = 'boot_morning';
    else if (hr >= 9  && hr < 17) timeKey = 'boot_afternoon';
    else if (hr >= 17 && hr < 21) timeKey = 'boot_evening';
    else if (hr >= 21 || hr < 2)  timeKey = 'boot_night';
    else                           timeKey = 'boot_earlyMorning';
    rotomSay(timeKey);
  }, 500);
}

function checkTrainerOnboarding() {
  const name = lsGet(LS_TRAINER_NAME, null);
  if (!name) {
    // First time — show onboarding after a brief delay
    setTimeout(() => {
      const ob = document.getElementById('rotom-onboarding');
      if (ob) {
        ob.style.display = 'flex';
        requestAnimationFrame(() => requestAnimationFrame(() => ob.classList.add('show')));
        setTimeout(() => document.getElementById('trainer-name-input')?.focus(), 500);
      }
    }, 600);
    return false; // don't fire regular boot greeting
  } else {
    trainerName = name;
    // Update status text with known name
    const status = document.getElementById('rotom-status-text');
    if (status) setTimeout(() => status.textContent = `Welcome back, ${name}-zzzt! ⚡`, 900);
    return true; // fire regular boot greeting
  }
}


// ══ SETTINGS ═════════════════════════════════════════════════════════════════
const LS_LIGHT_MODE = 'at_light_mode';
let lightModeActive = lsGet(LS_LIGHT_MODE, false);

function openSettings() {
  const modal = document.getElementById('settings-modal');
  if (!modal) return;
  // Sync all toggle states
  syncSettingsUI();
  modal.classList.add('open');
  // Update name display
  const nd = document.getElementById('settings-name-display');
  if (nd) nd.textContent = getTrainer();
  // Update cache stats
  const statsEl = document.getElementById('poke-cache-stats');
  if (statsEl) {
    const s = pokeCacheStats();
    statsEl.textContent = s.entries > 0
      ? `${s.entries} entries cached · ~${s.sizeKB} KB used`
      : 'No cache yet — data is fetched as you browse';
  }
}

function closeSettings() {
  document.getElementById('settings-modal')?.classList.remove('open');
  cancelSettingsClear();
  settingsCancelName();
}

function syncSettingsUI() {
  // Light mode toggle
  const lt = document.getElementById('toggle-light-mode');
  if (lt) lt.classList.toggle('on', lightModeActive);

  // Shiny Rotom
  const shinyUnlocked = checkShinyRotomUnlocked();
  const shinyRow = document.getElementById('settings-shiny-rotom');
  if (shinyRow) shinyRow.style.display = shinyUnlocked ? 'block' : 'none';
  const st = document.getElementById('toggle-shiny-rotom');
  if (st) st.classList.toggle('on', shinyRotomActive);

  // Gold theme
  const goldUnlocked = lsGet(LS_LIVING_DEX_COMPLETE, false);
  const goldRow = document.getElementById('settings-gold-theme');
  if (goldRow) goldRow.style.display = goldUnlocked ? 'block' : 'none';
  const gt = document.getElementById('toggle-gold-theme');
  if (gt) gt.classList.toggle('on', goldThemeActive);

  // Hide "no rewards" text if any reward is unlocked
  const noRewards = document.getElementById('settings-no-rewards');
  if (noRewards) noRewards.style.display = (shinyUnlocked || goldUnlocked) ? 'none' : 'block';

  // Name display
  const nd = document.getElementById('settings-name-display');
  if (nd) nd.textContent = getTrainer();
}

function checkShinyRotomUnlocked() {
  const totalShinies = (lsGet('at_slog2', []) || []).length;
  const shinyLdex    = Object.values(lsGet('at_ldex', {}) || {}).filter(v => v === 2).length;
  return totalShinies >= 50 || shinyLdex >= 103;
}

// Trainer name editing in settings
function settingsEditName() {
  const row   = document.getElementById('settings-trainer-row');
  const edit  = document.getElementById('settings-name-edit');
  const input = document.getElementById('settings-name-input');
  if (row)  row.style.display  = 'none';
  if (edit) edit.style.display = 'block';
  if (input) { input.value = getTrainer(); input.focus(); input.select(); }
}

function settingsSaveName() {
  const input = document.getElementById('settings-name-input');
  const name  = input?.value.trim();
  if (!name) return;
  trainerName = name;
  lsSet(LS_TRAINER_NAME, name);
  const status = document.getElementById('rotom-status-text');
  if (status) status.textContent = `Welcome back, ${name}-zzzt! ⚡`;
  settingsCancelName();
  syncSettingsUI();
  rotomSay('poke'); // Rotom reacts to name change
}

function settingsCancelName() {
  const row  = document.getElementById('settings-trainer-row');
  const edit = document.getElementById('settings-name-edit');
  if (row)  row.style.display  = 'flex';
  if (edit) edit.style.display = 'none';
}

// Light mode
function toggleLightMode() {
  lightModeActive = !lightModeActive;
  lsSet(LS_LIGHT_MODE, lightModeActive);
  applyLightMode();
  syncSettingsUI();
}

function applyLightMode() {
  document.body.classList.toggle('theme-light', lightModeActive);
}

// Settings clear confirm
function confirmClearFromSettings() {
  document.getElementById('settings-clear-confirm').style.display = 'block';
}
function cancelSettingsClear() {
  const el = document.getElementById('settings-clear-confirm');
  if (el) el.style.display = 'none';
}
function executeSettingsClear() {
  localStorage.clear();
  location.reload();
}

// Clear just the PokéAPI cache — useful without wiping user data
function clearPokeCache() {
  const index = _getLRUIndex();
  index.forEach(e => localStorage.removeItem(POKE_CACHE_PREFIX + e.key));
  localStorage.removeItem(POKE_CACHE_INDEX);
  Object.keys(_memCache).forEach(k => delete _memCache[k]);
  const count = index.length;
  alert(`PokéAPI cache cleared (${count} entries). Data will be re-fetched as needed.`);
}

function pokeCacheStats() {
  const index = _getLRUIndex();
  const memCount = Object.keys(_memCache).length;
  const lsBytes  = index.reduce((sum, e) => {
    const val = localStorage.getItem(POKE_CACHE_PREFIX + e.key);
    return sum + (val ? val.length * 2 : 0); // UTF-16
  }, 0);
  return { entries: index.length, memEntries: memCount, sizeKB: Math.round(lsBytes / 1024) };
}

// Export/Import stubs (full implementation next session)
function exportData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    data[key] = localStorage.getItem(key);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rotomos-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  rotomToast('Bzzt! Backup downloaded, ' + getTrainer() + '! Keep it safe-zzzt! ⚡');
}

function importData() {
  document.getElementById('import-file-input')?.click();
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (confirm('This will overwrite ALL current data. Continue?')) {
        localStorage.clear();
        Object.entries(data).forEach(([k,v]) => localStorage.setItem(k, v));
        location.reload();
      }
    } catch {
      rotomToast('Zzzt! That file looks corrupted... try again-zzzt!');
    }
  };
  reader.readAsText(file);
}

