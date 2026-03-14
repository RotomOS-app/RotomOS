  });
  renderShinyLog();
}

// ── Rebuild renderShinyLog to respect tab ─────────────────────────────────────
function renderShinyLog() {
  const el = document.getElementById('shinyLogGrid');

  // Update badge counts
  const cc = document.getElementById('caughtCount');
  const fc = document.getElementById('failedCount');
  const logSpecies = new Set(shinyLog.map(l => l.species.toLowerCase()));
  const extra = mons.filter(m => m.isShiny && !logSpecies.has(m.species.toLowerCase()));
  const totalCaught = shinyLog.length + extra.length;
  if (cc) cc.textContent = totalCaught || '';
  if (fc) fc.textContent = failedCatches.length || '';

  const hint = document.getElementById('log-tab-hint');

  if (currentLogTab === 'caught') {
    if (hint) hint.textContent = '';
    const all = [
      ...shinyLog,
      ...extra.map(m => ({
        id: 'mon-' + m.id, species: m.species, ball: m.ball,
        method: m.game || 'Unknown', game: m.game || '',
        count: 0, date: '', nature: m.nature, gender: m.gender,
        fromCollection: true,
      }))
    ];
    if (!all.length) {
      el.innerHTML = `<div class="empty-state" style="grid-column:1/-1">No shinies caught yet.<br/><span style="font-size:12px;color:#5b4690">Complete a hunt or log one manually.</span></div>`;
      return;
    }
    el.innerHTML = all.map(l => caughtCard(l)).join('');

  } else {
    if (hint) hint.style.cssText = 'color:#fda4af55;font-size:10px;font-weight:700;font-style:italic';
    if (hint) hint.textContent = failedCatches.length ? 'pour one out 💔' : '';
    if (!failedCatches.length) {
      el.innerHTML = `<div class="empty-state" style="grid-column:1/-1">No failed catches logged.<br/><span style="font-size:12px;color:#5b4690">May it stay that way. 🤞</span></div>`;
      return;
    }
    el.innerHTML = failedCatches.map(f => failedCard(f)).join('');
  }
}

function caughtCard(l) {
  const bc      = BALLS[l.ball] || BALLS.Moon;
  const src     = poke(l.species, true);
  const odds    = l.odds || 4096;
  const luckPct = l.count ? (l.count / odds) : null;
  let luckHTML  = '';
  if (luckPct !== null && l.count > 0) {
    if      (luckPct < 0.5)  luckHTML = `<div class="luck-pill" style="background:#86efac22;border:1px solid #86efac44;color:#86efac">🍀 Lucky</div>`;
    else if (luckPct <= 1.0) luckHTML = `<div class="luck-pill" style="background:#93c5fd22;border:1px solid #93c5fd33;color:#93c5fd">📊 At odds</div>`;
    else if (luckPct <= 2.0) luckHTML = `<div class="luck-pill" style="background:#fde68a22;border:1px solid #fde68a33;color:#fde68a">😤 Over odds</div>`;
    else                     luckHTML = `<div class="luck-pill" style="background:#fda4af22;border:1px solid #fda4af33;color:#fda4af">💀 Dry</div>`;
  }
  const deleteBtn = l.fromCollection ? '' : `<button class="slc-delete" onclick="event.stopPropagation();deleteShinyLog(${l.id})" title="Delete">✕</button>`;
  return `
  <div class="shiny-log-card" onclick="openDex('${l.species}')">
    ${deleteBtn}
    <div class="slc-sprite">
      <div style="position:absolute;inset:0;border-radius:50%;filter:blur(10px);background:radial-gradient(circle,#fde68a33,transparent)"></div>
      ${src ? `<img src="${src}" width="76" height="76" onerror="this.style.display='none'"/>` : `<div style="font-size:36px;filter:drop-shadow(0 0 6px #fde68a)">★</div>`}
    </div>
    <div class="slc-name">${l.species}</div>
    <div class="slc-ball">${bImg(l.ball, 18)}<span style="color:${bc.light};font-size:10px;font-weight:700">${l.ball}</span></div>
    <div class="slc-method">${l.method || ''}${l.game ? ' · ' + l.game.split(' / ')[0] : ''}</div>
    ${luckHTML}
    ${l.count > 0 ? `<div class="slc-count">${l.count.toLocaleString()} enc.</div>` : ''}
    ${l.isPhase && l.phaseNum && l.huntSpecies ? `<div class="slc-phase-tag">Phase ${l.phaseNum} of ${l.huntSpecies} hunt</div>` : ''}
    ${l.date ? `<div class="slc-date">${l.date}</div>` : ''}
    ${l.fromCollection ? `<div class="slc-date" style="font-style:italic">collection</div>` : ''}
  </div>`;
}

function failedCard(f) {
  const src = poke(f.species, true);
  const reasonIcons = {
    'fled':'🏃','ko':'💀','out-of-balls':'🎾','reset':'💾','crash':'💻','chain-broke':'🔗','other':'😭'
  };
  const icon = reasonIcons[f.reason] || '💔';
  return `
  <div class="shiny-log-card failed" onclick="openDex('${f.species}')" style="position:relative">
    <div class="failed-x">✕</div>
    <div class="slc-sprite">
      <div style="position:absolute;inset:0;border-radius:50%;filter:blur(10px);background:radial-gradient(circle,#fda4af22,transparent)"></div>
      ${src ? `<img src="${src}" width="76" height="76" onerror="this.style.display='none'"/>` : `<div style="font-size:36px">💔</div>`}
    </div>
    <div class="slc-name" style="color:#fda4af">${f.species}</div>
    <div class="slc-method" style="color:#7060a8">${icon} ${f.reasonLabel}</div>
    <div class="slc-method">${f.method || ''}${f.game ? ' · ' + f.game.split(' / ')[0] : ''}</div>
    ${f.count > 0 ? `<div class="slc-count">${f.count.toLocaleString()} enc.</div>` : ''}
    ${f.notes ? `<div class="slc-date" style="color:#5b4690;font-style:italic;margin-top:3px">${f.notes}</div>` : ''}
    ${f.date ? `<div class="slc-date">${f.date}</div>` : ''}
  </div>`;
}


// ── Shiny Stats ───────────────────────────────────────────────────────────────

// Average seconds per encounter by method (rough real-world estimates)
const METHOD_SECONDS = {
  'Random Encounter':  8,
  'Masuda Method':     30,   // hatch time
  'DexNav Chaining':   12,
  'Poké Radar':        10,
  'SOS Chaining':      15,
  'Outbreak':          9,
  'Sandwich Method':   9,
  'Fishing Chain':     6,
  'Friend Safari':     7,
  'Soft Reset':        25,
  'Static':            25,
  'Dynamax Adventure': 180,
  'Legends: Arceus':   10,
  'Community Day':     5,
  'GO / HOME Transfer':5,
};

function renderShinyStats() {
  const done    = hunts.filter(h => h.status === 'found');
  const allLog  = shinyLog;  // completed hunts written here
  const failed  = failedCatches;
  const active  = hunts.filter(h => h.status === 'active');

  // ── Core numbers ────────────────────────────────────────────────────────────
  const totalCaught    = allLog.length + mons.filter(m => m.isShiny).length;
  const uniqueSpecies  = new Set(allLog.map(l => l.species.toLowerCase())).size;
  const uniqueBalls    = new Set(allLog.map(l => l.ball).filter(Boolean)).size;
  const allCounts      = allLog.map(l => l.count).filter(c => c > 0);
  const totalEncounters= hunts.reduce((s, h) => s + h.count, 0);
  const avgEnc         = allCounts.length ? Math.round(allCounts.reduce((a,b)=>a+b,0) / allCounts.length) : 0;

  // Luckiest — lowest count with known odds
  const luckiest = allLog.filter(l => l.count > 0).sort((a,b) => a.count - b.count)[0];

  // Most over-odds completed hunt
  const mostOver = allLog
    .filter(l => l.count > 0 && l.odds)
    .map(l => ({ ...l, overBy: l.count - l.odds }))
    .filter(l => l.overBy > 0)
    .sort((a,b) => b.overBy - a.overBy)[0];

  // Best streak — consecutive hunts with no failed catch in between
  // Walk through hunts in order; reset counter on each failed catch date
  let streak = 0, bestStreak = 0, cur = 0;
  const sortedLog   = [...allLog].sort((a,b) => new Date(a.date||0) - new Date(b.date||0));
  const sortedFails = [...failed].sort((a,b) => new Date(a.date||0) - new Date(b.date||0));
  // Simple version: current streak = shinies logged since last failed catch
  const lastFail = sortedFails.length ? new Date(sortedFails[sortedFails.length-1].date) : null;
  const streakCount = lastFail
    ? sortedLog.filter(l => l.date && new Date(l.date) > lastFail).length
    : allLog.length;
  bestStreak = streakCount; // for now streak = current streak

  // Fastest hunt (days elapsed, hunts with both startDate and endDate)
  const timedHunts = done.filter(h => h.startDate && h.endDate);
  const fastest = timedHunts
    .map(h => ({ ...h, days: Math.max(1, Math.floor((new Date(h.endDate) - new Date(h.startDate)) / 86400000)) }))
    .sort((a,b) => a.days - b.days)[0];

  // Best game
  const byCounts = {};
  allLog.forEach(l => { if (l.game) byCounts[l.game] = (byCounts[l.game]||0) + 1; });
  const bestGame = Object.entries(byCounts).sort((a,b) => b[1]-a[1])[0];

  // Driest streak — most consecutive over-odds hunts
  let maxDry = 0, curDry = 0;
  [...done].sort((a,b) => new Date(a.endDate||0) - new Date(b.endDate||0)).forEach(h => {
    const odds = getOdds(h.method, h.hasCharm, h.game);
    if (h.count > odds) { curDry++; maxDry = Math.max(maxDry, curDry); } else curDry = 0;
  });

  // Failed breakdown
  const koCount    = failed.filter(f => f.reason === 'ko').length;
  const resetCount = failed.filter(f => f.reason === 'reset').length;
  const fledCount  = failed.filter(f => f.reason === 'fled').length;

  // Method breakdown
  const byMethod = {};
  allLog.forEach(l => { if (l.method) byMethod[l.method] = (byMethod[l.method]||0) + 1; });
  const methodEntries = Object.entries(byMethod).sort((a,b) => b[1]-a[1]);
  const maxMethodCount = methodEntries[0]?.[1] || 1;

  // Luckiest hunts (lowest count relative to odds)
  const luckiestHunts = allLog
    .filter(l => l.count > 0 && l.odds)
    .map(l => ({ ...l, luckRatio: l.count / l.odds }))
    .sort((a, b) => a.luckRatio - b.luckRatio)
    .slice(0, 3);

  // Time estimate
  const timeByMethod = {};
  hunts.forEach(h => {
    const secs = METHOD_SECONDS[h.method] || 10;
    timeByMethod[h.method] = (timeByMethod[h.method]||0) + h.count * secs;
  });
  const totalSecs = Object.values(timeByMethod).reduce((a,b)=>a+b,0);
  const formatTime = s => {
    if (s < 3600)  return `${Math.round(s/60)}m`;
    if (s < 86400) return `${(s/3600).toFixed(1)}h`;
    return `${(s/86400).toFixed(1)} days`;
  };

  // ── Hero grid ────────────────────────────────────────────────────────────────
  const heroStats = [
    { icon:'🌈', val: totalCaught,      lbl:'Total Shinies',      sub:'all time',               color:'#fde68a', glow:'#fde68a' },
    { icon:'🎾', val: uniqueSpecies,    lbl:'Unique Species',     sub:'different Pokémon',       color:'#c4b5fd', glow:'#c084fc' },
    { icon:'🏆', val: luckiest ? luckiest.count.toLocaleString() : '—',
                                        lbl:'Luckiest Hunt',      sub: luckiest ? luckiest.species : 'no data yet', color:'#86efac', glow:'#22c55e' },
    { icon:'⚡', val: fastest ? fastest.days + 'd' : '—',
                                        lbl:'Fastest Hunt',       sub: fastest ? fastest.species + ' · ' + fastest.days + ' day' + (fastest.days===1?'':'s') : 'no data yet', color:'#93c5fd', glow:'#3b82f6' },
    { icon:'🎮', val: bestGame ? bestGame[1] : '—',
                                        lbl:'Best Game',          sub: bestGame ? bestGame[0].split(' / ')[0] : 'no data yet', color:'#f9a8d4', glow:'#ec4899' },
    { icon:'🔥', val: streakCount,      lbl:'Current Streak',     sub:'catches without a fail', color:'#fdba74', glow:'#f97316' },
  ];

  document.getElementById('statsHeroGrid').innerHTML = heroStats.map(s => `
    <div class="hero-stat" style="--hs-glow:${s.glow}">
      <div class="hero-stat-icon">${s.icon}</div>
      <div class="hero-stat-val" style="color:${s.color}">${s.val}</div>
      <div class="hero-stat-lbl">${s.lbl}</div>
      <div class="hero-stat-sub">${s.sub}</div>
    </div>`).join('');

  // ── Show-off detail rows ────────────────────────────────────────────────────
  const showRows = [
    { icon:'🎯', val: uniqueBalls + ' types', lbl:'Ball Variety', sub: 'across all caught shinies', col:'#c4b5fd' },
    { icon:'⏱',  val: avgEnc ? avgEnc.toLocaleString() : '—', lbl:'Avg Encounters per Shiny', sub:'completed hunts only', col:'#93c5fd' },
    { icon:'📅', val: done.length, lbl:'Completed Hunts', sub:'total hunts you finished', col:'#86efac' },
    { icon:'🎰', val: active.length, lbl:'Active Hunts', sub:'currently running', col:'#fde68a' },
  ];
  document.getElementById('statsShowGrid').innerHTML = showRows.map(r => `
    <div class="stat-row">
      <div class="stat-row-icon">${r.icon}</div>
      <div class="stat-row-body">
        <div class="stat-row-val" style="color:${r.col}">${r.val}</div>
        <div class="stat-row-lbl">${r.lbl}</div>
        <div class="stat-row-sub">${r.sub}</div>
      </div>
    </div>`).join('');

  // ── Method bar chart ────────────────────────────────────────────────────────
  document.getElementById('statsMethodChart').innerHTML = methodEntries.length
    ? methodEntries.map(([m, c]) => `
      <div class="method-bar-row">
        <div class="method-bar-label" title="${m}">${m}</div>
        <div class="method-bar-track">
          <div class="method-bar-fill" style="width:${Math.round(c/maxMethodCount*100)}%"></div>
        </div>
        <div class="method-bar-count">${c}</div>
      </div>`).join('')
    : '<div style="color:#5b4690;font-size:12px">No completed hunts yet.</div>';

  // ── Species podium ──────────────────────────────────────────────────────────
  const podiumStyles = [
    { cls:'gold',   rank:'🥇' },
    { cls:'silver', rank:'🥈' },
    { cls:'bronze', rank:'🥉' },
  ];
  document.getElementById('statsPodium').innerHTML = luckiestHunts.length
    ? luckiestHunts.map((l, i) => {
        const src = poke(l.species, true);
        const ps  = podiumStyles[i] || podiumStyles[2];
        const pct = Math.round(l.luckRatio * 100);
        const enc = l.count.toLocaleString();
        return `
        <div class="podium-card ${ps.cls}">
          <div class="podium-rank">${ps.rank}</div>
          ${src ? `<img src="${src}" width="52" height="52" style="image-rendering:pixelated;filter:drop-shadow(0 0 6px #86efac55)" onerror="this.style.display='none'"/>` : ''}
          <div class="podium-name">${l.species}</div>
          <div class="podium-count">${enc} enc · <span style="color:#86efac">${pct}% of odds</span></div>
        </div>`;
      }).join('')
    : '<div style="color:#5b4690;font-size:12px;grid-column:1/-1">No shinies logged yet.</div>';

  // ── Grudge stats ─────────────────────────────────────────────────────────────
  const grudgeRows = [
    {
      icon:'💀', col:'#fda4af',
      val: totalEncounters.toLocaleString(),
      lbl:'Total Encounters Ever',
      sub: avgEnc ? `avg ${avgEnc.toLocaleString()} per shiny` : 'across all hunts',
    },
    {
      icon:'😤', col:'#fda4af',
      val: mostOver ? `+${mostOver.overBy.toLocaleString()}` : '—',
      lbl:'Most Over Odds',
      sub: mostOver ? `${mostOver.species} · ${mostOver.count.toLocaleString()} encounters` : 'no over-odds hunts yet 👀',
    },
    {
      icon:'💔', col:'#fda4af',
      val: failed.length,
      lbl:'Failed Catches',
      sub: [
        koCount    ? `${koCount} KO'd`     : null,
        resetCount ? `${resetCount} reset` : null,
        fledCount  ? `${fledCount} fled`   : null,
      ].filter(Boolean).join(' · ') || 'the ones that got away',
    },
    {
      icon:'🌧', col:'#fda4af',
      val: maxDry || '—',
      lbl:'Driest Streak',
      sub:'consecutive over-odds hunts',
    },
  ];

  document.getElementById('statsGrudgeGrid').innerHTML = grudgeRows.map(r => `
    <div class="stat-row grudge">
      <div class="stat-row-icon">${r.icon}</div>
      <div class="stat-row-body">
        <div class="stat-row-val" style="color:${r.col}">${r.val}</div>
        <div class="stat-row-lbl">${r.lbl}</div>
        <div class="stat-row-sub">${r.sub}</div>
      </div>
    </div>`).join('');

  // ── Time estimate ────────────────────────────────────────────────────────────
  const timeBreakdown = Object.entries(timeByMethod)
    .sort((a,b) => b[1]-a[1])
    .slice(0,3)
    .map(([m,s]) => `${m}: ~${formatTime(s)}`)
    .join(' · ');

  document.getElementById('statsTimeBox').innerHTML = totalSecs > 0 ? `
    <div class="time-estimate-box">
      <div style="font-size:36px">⏳</div>
      <div class="te-main">
        <div class="te-val">~${formatTime(totalSecs)}</div>
        <div class="te-lbl">Estimated time spent shiny hunting</div>
        <div class="te-breakdown">${timeBreakdown}</div>
      </div>
    </div>` : '';
}


// ── Mobile nav ────────────────────────────────────────────────────────────────
function updateBottomNav(section) {
  const primary = ['home','aprimon','shiny','livingdex'];
  document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('active'));
  const bnEl = document.getElementById('bn-' + section);
  if (bnEl) {
    bnEl.classList.add('active');
  } else {
    // Overflow section — highlight "More" button
    document.getElementById('bn-more')?.classList.add('active');
    // Also highlight the drawer item
    document.querySelectorAll('.mmd-item').forEach(i => i.classList.remove('active'));
    document.getElementById('mmd-' + section)?.classList.add('active');
  }
  // Sync badges
  const apriB = document.getElementById('bn-aprimon-badge');
  const shinyB = document.getElementById('bn-shiny-badge');
  const wCount = mons.filter(m => m.tradeStatus === 'wanted').length;
  const hCount = hunts.filter(h => h.status === 'active').length;
  if (apriB) { apriB.textContent = wCount||''; apriB.style.display = wCount ? 'inline-flex' : 'none'; }
  if (shinyB) { shinyB.textContent = hCount||''; shinyB.style.display = hCount ? 'inline-flex' : 'none'; }
}

function toggleMoreDrawer() {
  const drawer   = document.getElementById('mobile-more-drawer');
  const backdrop = document.getElementById('mmd-backdrop');
  const isOpen   = drawer.classList.contains('open');
  if (isOpen) {
    closeMoreDrawer();
  } else {
    drawer.style.display = 'block';
    backdrop.style.display = 'block';
    requestAnimationFrame(() => drawer.classList.add('open'));
    document.getElementById('bn-more')?.classList.add('active');
  }
}

function closeMoreDrawer() {
  const drawer   = document.getElementById('mobile-more-drawer');
  const backdrop = document.getElementById('mmd-backdrop');
  drawer.classList.remove('open');
  setTimeout(() => {
    drawer.style.display = 'none';
    backdrop.style.display = 'none';
  }, 300);
  // Remove active from more unless we're on an overflow section
  const overflowSections = ['competitive','progress'];
  if (!overflowSections.includes(currentSection)) {
    document.getElementById('bn-more')?.classList.remove('active');
  }
}

// Patch goSection to also update mobile nav
const _goSectionOrig = goSection;
goSection = function(section) {
  _goSectionOrig(section);
  updateBottomNav(section);
};


