// ── Living Dex complete ───────────────────────────────────────────────────────
function checkLivingDexComplete() {
  const caught = Object.values(ldexData).filter(d => d.caught).length;
  const complete = caught >= 1025;

  const goldPanel = document.getElementById('gold-theme-unlock');
  const sidebar   = document.getElementById('sidebar');
  const hofBtn    = document.getElementById('sn-halloffame');

  if (complete) {
    if (goldPanel) goldPanel.style.display = 'block';
    if (sidebar)   sidebar.classList.add('living-dex-complete');
    if (hofBtn)    hofBtn.style.display = 'inline-flex';
    lsSet(LS_LIVING_DEX_COMPLETE, true);

    // First-time notification
    if (!lsGet(LS_LIVING_DEX_NOTIF, false)) {
      lsSet(LS_LIVING_DEX_NOTIF, true);
      setTimeout(() => {
        const toast = document.getElementById('rotom-toast');
        const textEl = document.getElementById('rotom-toast-text');
        if (toast && textEl) {
          textEl.textContent = `Zzzzrrrttt!!! ${getTrainer()}, YOU DID IT!! The Living Dex is COMPLETE!! I thank my lucky circuits!! ✦⚡✦`;
          toast.classList.add('show');
          rotomReact('shinyFound');
          if (rotomToastTimer) clearTimeout(rotomToastTimer);
          rotomToastTimer = setTimeout(() => toast.classList.remove('show'), 10000);
        }
      }, 600);
    }
  } else {
    if (goldPanel) goldPanel.style.display = 'none';
    if (sidebar && !lsGet(LS_LIVING_DEX_COMPLETE, false)) {
      sidebar.classList.remove('living-dex-complete');
    }
  }

  // Always restore state from storage
  if (lsGet(LS_LIVING_DEX_COMPLETE, false)) {
    if (sidebar) sidebar.classList.add('living-dex-complete');
    if (goldPanel) goldPanel.style.display = 'block';
    if (hofBtn) hofBtn.style.display = 'inline-flex';
  }

  applyGoldTheme();
  checkShinyLivingDexComplete();
}

function toggleGoldTheme() {
  goldThemeActive = !goldThemeActive;
  lsSet(LS_GOLD_THEME, goldThemeActive);
  applyGoldTheme();
}

function applyGoldTheme() {
  const btn   = document.getElementById('gold-theme-btn');
  const label = document.getElementById('gold-theme-btn-label');
  if (goldThemeActive) {
    document.body.classList.add('theme-gold');
    if (label) { label.textContent = '✦ Gold Theme Active'; label.style.color = '#fde68a'; }
    if (btn)   { btn.style.background = '#fde68a11'; btn.style.borderColor = '#fde68a88'; }
  } else {
    document.body.classList.remove('theme-gold');
    if (label) { label.textContent = 'Enable Gold Theme'; label.style.color = '#fde68a88'; }
    if (btn)   { btn.style.background = 'none'; btn.style.borderColor = '#fde68a44'; }
  }
}

// ── Shiny Living Dex complete ─────────────────────────────────────────────────
function checkShinyLivingDexComplete() {
  const shiny    = Object.values(ldexData).filter(d => d.shiny).length;
  const complete = shiny >= 1025;
  const logoIcon = document.getElementById('rotom-logo-icon');
  const sprite   = document.getElementById('rotom-sidebar-sprite');
  const hofBtn   = document.getElementById('sn-halloffame');

  if (complete || lsGet(LS_SHINY_LDEX_COMPLETE, false)) {
    if (logoIcon) logoIcon.classList.add('rainbow');
    if (sprite)   sprite.classList.add('rainbow');
    if (hofBtn)   hofBtn.style.display = 'inline-flex';
    lsSet(LS_SHINY_LDEX_COMPLETE, true);

    // First-time notification
    if (complete && !lsGet(LS_SHINY_LDEX_NOTIF, false)) {
      lsSet(LS_SHINY_LDEX_NOTIF, true);
      setTimeout(() => {
        const toast = document.getElementById('rotom-toast');
        const textEl = document.getElementById('rotom-toast-text');
        if (toast && textEl) {
          textEl.textContent = `...I don't even have wordzzz. ${getTrainer()}, a FULL SHINY LIVING DEX. Rotom izzz having a moment. Just... wow. ★⚡★`;
          toast.classList.add('show');
          rotomReact('shinyFound');
          if (rotomToastTimer) clearTimeout(rotomToastTimer);
          rotomToastTimer = setTimeout(() => toast.classList.remove('show'), 12000);
        }
      }, 800);
    }
  }
}

// ── Hall of Fame renderer ─────────────────────────────────────────────────────
function renderHallOfFame() {
  const el = document.getElementById('hof-content');
  if (!el) return;

  const hasLdex      = lsGet(LS_LIVING_DEX_COMPLETE, false);
  const hasShinyLdex = lsGet(LS_SHINY_LDEX_COMPLETE, false);
  const ldexDate     = lsGet('at_ldex_complete_date', null);
  const sldexDate    = lsGet('at_sldex_complete_date', null);

  if (!hasLdex && !hasShinyLdex) {
    el.innerHTML = `
      <div style="text-align:center;padding:60px 20px">
        <div style="font-size:48px;margin-bottom:16px">🏆</div>
        <div class="cinzel" style="font-size:18px;font-weight:900;color:#3d3070;margin-bottom:8px">Hall of Fame</div>
        <div style="color:#3d3070;font-size:12px;line-height:1.6">Complete the Living Dex or Shiny Living Dex<br/>to unlock your Hall of Fame entry.</div>
        <div style="margin-top:16px;font-size:11px;color:#2d2358;font-style:italic">
          Bzzt... Rotom believezzz in you, Trainer-zzzt.
        </div>
      </div>`;
    return;
  }

  const caught  = Object.values(ldexData).filter(d => d.caught).length;
  const shiny   = Object.values(ldexData).filter(d => d.shiny).length;
  const totalShiniesLogged = shinyLog.length;

  let cards = `
    <div class="cinzel" style="font-size:20px;font-weight:900;color:#ede9ff;margin-bottom:4px;padding:16px 0 8px">🏆 Hall of Fame</div>
    <div style="color:#5b4690;font-size:11px;margin-bottom:20px">Legendary achievements earned by this Trainer</div>
  `;

  if (hasLdex) {
    cards += `
    <div class="hof-card gold">
      <div class="hof-badge gold">✦ Living Dex Complete</div>
      <div class="cinzel" style="font-size:18px;font-weight:900;color:#fde68a;margin-bottom:8px">Living Dex Champion</div>
      <div style="color:#ede9ff;font-size:13px;line-height:1.6;margin-bottom:12px">
        Every Pokémon — all 1,025 species — caught and in the box.<br/>
        Rotom'zzz circuits have never felt so complete-zzzt. ✦
      </div>
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <div style="text-align:center">
          <div style="font-size:24px;font-weight:900;color:#fde68a">${caught}</div>
          <div style="font-size:10px;color:#7060a8;text-transform:uppercase">Pokémon Caught</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:24px;font-weight:900;color:#fde68a">${totalShiniesLogged}</div>
          <div style="font-size:10px;color:#7060a8;text-transform:uppercase">Shinies Logged</div>
        </div>
      </div>
      ${ldexDate ? `<div class="hof-date">Completed ${new Date(ldexDate).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>` : ''}
    </div>`;
  }

  if (hasShinyLdex) {
    cards += `
    <div class="hof-card rainbow-card" style="border-width:1px;border-style:solid">
      <div class="hof-badge rainbow">★ Shiny Living Dex Complete</div>
      <div class="cinzel" style="font-size:18px;font-weight:900;color:#ede9ff;margin-bottom:8px">Shiny Living Dex Legend</div>
      <div style="color:#ede9ff;font-size:13px;line-height:1.6;margin-bottom:12px">
        All 1,025 Pokémon — in their shiny forms.<br/>
        Rotom doezzn't have wordzzz. You are genuinely legendzzzt. ★
      </div>
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <div style="text-align:center">
          <div style="font-size:24px;font-weight:900;color:#c084fc">${shiny}</div>
          <div style="font-size:10px;color:#7060a8;text-transform:uppercase">Shiny Pokémon</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:24px;font-weight:900;color:#c084fc">${totalShiniesLogged}</div>
          <div style="font-size:10px;color:#7060a8;text-transform:uppercase">Shinies Logged</div>
        </div>
      </div>
      ${sldexDate ? `<div class="hof-date">Completed ${new Date(sldexDate).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>` : ''}
    </div>`;
  }

  // Idle quotes change for shiny living dex legends
  if (hasShinyLdex) {
    cards += `
    <div class="hof-card" style="border-color:#5b469033;text-align:center;padding:16px">
      <div style="font-size:11px;color:#5b4690;font-style:italic;line-height:1.6">
        "I still can't believe what you've done, Trainer-zzzt..."
      </div>
      <div style="font-size:10px;color:#3d3070;margin-top:6px">— Rotom, in quiet awe</div>
    </div>`;
  }

  el.innerHTML = cards;
}

// ══ SHINY ROTOM UNLOCK ═══════════════════════════════════════════════════════
const LS_SHINY_ROTOM        = 'at_shiny_rotom';
const LS_SHINY_ROTOM_NOTIF  = 'at_shiny_rotom_notif';
let shinyRotomActive = lsGet(LS_SHINY_ROTOM, false);

const SHINY_ROTOM_QUIPS = [
  "Kzzzzrrt?! What...?! Rotom izzz... SHINY?! My circuitzzz have never felt like thizzz!! ⚡★⚡",
  "Zzzzrrrttt!!! Is that... is Rotom GOLDEN?! You've done something incredible, Trainer!! ★",
  "BZZT!! HOT DIGGITY!! Rotom can't believe it — you EARNED thizzz, bucko!! ⚡★⚡",
];

function checkShinyRotomUnlock() {
  const totalShinies = shinyLog.length + mons.filter(m => m.isShiny).length;
  const shinyLdex    = Object.values(ldexData).filter(d => d.shiny).length;
  const unlocked     = totalShinies >= 50 || (shinyLdex / 1025) >= 0.10;

  const unlockEl = document.getElementById('shiny-rotom-unlock');
  if (unlockEl) unlockEl.style.display = unlocked ? 'block' : 'none';

  if (unlocked && !lsGet(LS_SHINY_ROTOM_NOTIF, false)) {
    lsSet(LS_SHINY_ROTOM_NOTIF, true);
    setTimeout(() => {
      const quip  = SHINY_ROTOM_QUIPS[Math.floor(Math.random() * SHINY_ROTOM_QUIPS.length)];
      const toast = document.getElementById('rotom-toast');
      const textEl= document.getElementById('rotom-toast-text');
      if (toast && textEl) {
        textEl.textContent = quip;
        toast.classList.add('show');
        rotomReact('shinyFound');
        if (rotomToastTimer) clearTimeout(rotomToastTimer);
        rotomToastTimer = setTimeout(() => toast.classList.remove('show'), 9000);
      }
    }, 1000);
  }
  applyShinyRotom();
}

function applyShinyRotom() {
  const shinyUrl  = 'https://img.pokemondb.net/sprites/sword-shield/icon/rotom-heat.png';
  const normalUrl = 'https://img.pokemondb.net/sprites/sword-shield/icon/rotom.png';
  const sprite    = document.getElementById('rotom-sidebar-sprite');
  const btnSprite = document.getElementById('shiny-rotom-btn-sprite');
  const btnLabel  = document.getElementById('shiny-rotom-btn-label');
  const toastImg  = document.querySelector('#rotom-toast img');
  const btn       = document.getElementById('shiny-rotom-btn');

  if (shinyRotomActive) {
    if (sprite)    { sprite.src = shinyUrl; sprite.classList.add('shiny'); }
    if (toastImg)  toastImg.src = shinyUrl;
    if (btnLabel)  { btnLabel.textContent = '★ Shiny Active'; btnLabel.style.color = '#fde68a'; }
    if (btnSprite) btnSprite.src = shinyUrl;
    if (btn)       { btn.style.background = '#fde68a11'; btn.style.borderColor = '#fde68a88'; }
  } else {
    if (sprite)    { sprite.src = normalUrl; sprite.classList.remove('shiny'); }
    if (toastImg)  toastImg.src = normalUrl;
    if (btnLabel)  { btnLabel.textContent = 'Enable Shiny ★'; btnLabel.style.color = '#fde68a88'; }
    if (btnSprite) btnSprite.src = normalUrl;
    if (btn)       { btn.style.background = 'none'; btn.style.borderColor = '#fde68a44'; }
  }
}

function toggleShinyRotom() {
  shinyRotomActive = !shinyRotomActive;
  lsSet(LS_SHINY_ROTOM, shinyRotomActive);
  applyShinyRotom();
  syncSettingsUI();
  if (shinyRotomActive) rotomSay('poke');
}


