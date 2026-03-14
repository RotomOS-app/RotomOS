// ── Ko-fi nudge banner ────────────────────────────────────────────────────────
const KOFI_BANNER_KEY = 'at_kofi_nudge_shown';

function showKofiBanner() {
  if (localStorage.getItem(KOFI_BANNER_KEY)) return; // already shown once ever
  const banner = document.getElementById('kofi-banner');
  if (!banner) return;

  banner.style.display = 'block';
  // Small delay so the slide-in animates properly
  setTimeout(() => banner.classList.add('banner-visible'), 50);

  // Auto-dismiss after 8 seconds
  setTimeout(() => dismissKofiBanner(), 8000);

  localStorage.setItem(KOFI_BANNER_KEY, '1');
}

function dismissKofiBanner() {
  const banner = document.getElementById('kofi-banner');
  if (!banner) return;
  banner.classList.remove('banner-visible');
  banner.classList.add('banner-hiding');
  setTimeout(() => { banner.style.display = 'none'; banner.classList.remove('banner-hiding'); }, 400);
}

// ── Pokédex search page ──────────────────────────────────────────────────────
const PDEX_RECENT_KEY = 'at_pdex_recent';
const PDEX_PROMPTS = [
  "Bzzt! Which Pokémon do you want to know about?",
  "Bzzt-zzt! Who are we looking up today, {{name}}?",
  "Scanning the database... who's the target, {{name}}?",
  "Rotom's encyclopaedia is ready! Who do you want to look up?",
  "Bzzt! Go ahead — I know everything about every Pokémon!",
];

let pdexTyperTimeout = null;

function initPdexPage() {
  // Pick a random prompt, personalise with trainer name if known
  const name = trainerName || null;
  let prompt = PDEX_PROMPTS[Math.floor(Math.random() * PDEX_PROMPTS.length)];
  prompt = name ? prompt.replace('{{name}}', name) : prompt.replace(', {{name}}', '').replace('{{name}}', 'Trainer');

  // Typewriter effect
  const el = document.getElementById('pdex-rotom-prompt');
  if (el) {
    el.innerHTML = '';
    let i = 0;
    clearTimeout(pdexTyperTimeout);
    function type() {
      if (i <= prompt.length) {
        el.innerHTML = prompt.slice(0, i) + '<span class="pdex-cursor"></span>';
        i++;
        pdexTyperTimeout = setTimeout(type, 28);
      } else {
        el.innerHTML = prompt; // remove cursor when done
      }
    }
    type();
  }

  // Clear and re-init autocomplete
  const input = document.getElementById('pdex-species-input');
  if (input) {
    input.value = '';
    setTimeout(() => {
      initSpeciesAC('pdex-species-input', (name) => {
        document.getElementById('pdex-species-input').value = '';
        pdexGoToDex(name);
      });
    }, 100);
  }

  renderPdexRecent();
}

function pdexInput() {
  // handled by initSpeciesAC — this is here in case we need extra logic later
}

function pdexGoToDex(species) {
  if (!species) return;
  // Save to recent
  let recent = JSON.parse(localStorage.getItem(PDEX_RECENT_KEY) || '[]');
  recent = [species, ...recent.filter(r => r.toLowerCase() !== species.toLowerCase())].slice(0, 8);
  localStorage.setItem(PDEX_RECENT_KEY, JSON.stringify(recent));
  // Open dex overlay
  openDex(species);
}

function renderPdexRecent() {
  const wrap = document.getElementById('pdex-recent');
  if (!wrap) return;
  const recent = JSON.parse(localStorage.getItem(PDEX_RECENT_KEY) || '[]');
  if (!recent.length) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = `
    <div class="pdex-recent-label">Recently viewed</div>
    <div class="pdex-recent-chips">
      ${recent.map(r => `
        <div class="pdex-recent-chip" onclick="pdexGoToDex('${r}')">
          <img src="${poke(r)}" onerror="this.style.display='none'" alt="">
          ${r}
        </div>
      `).join('')}
    </div>
  `;
}

// ── Delete shiny log entry ───────────────────────────────────────────────────
function deleteShinyLog(id) {
  if (!confirm('Remove this shiny from your log?')) return;
  shinyLog = shinyLog.filter(l => l.id !== id);
  lsSet(LSH.LOG, shinyLog);
  renderShinyLog();
}

// ══ TOOLS — CATCH RATE CALCULATOR ════════════════════════════════════════════
