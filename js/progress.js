function gpLoadSaves() {
  try { return JSON.parse(localStorage.getItem(GP_LS)) || []; } catch { return []; }
}
function gpSaveSaves(saves) {
  localStorage.setItem(GP_LS, JSON.stringify(saves));
}
function gpGetActive() {
  return localStorage.getItem(GP_ACTIVE) || null;
}
function gpSetActive(id) {
  localStorage.setItem(GP_ACTIVE, id);
}
function gpGetSave(id) {
  return gpLoadSaves().find(s => s.id === id) || null;
}
function gpUpdateSave(updated) {
  const saves = gpLoadSaves();
  const idx = saves.findIndex(s => s.id === updated.id);
  if (idx >= 0) saves[idx] = updated;
  gpSaveSaves(saves);
}

/* ── Section entry ── */
function initGameProgress() {
  const saves = gpLoadSaves();
  if (!saves.length) {
    document.getElementById('gp-no-save').style.display = 'block';
    document.getElementById('gp-main').style.display    = 'none';
    return;
  }
  document.getElementById('gp-no-save').style.display = 'none';
  document.getElementById('gp-main').style.display    = 'block';

  // Ensure active is valid
  let activeId = gpGetActive();
  if (!saves.find(s => s.id === activeId)) {
    activeId = saves[0].id;
    gpSetActive(activeId);
  }

  gpPopulateSaveSelect(saves, activeId);
  gpRenderAll(activeId);
}

function gpPopulateSaveSelect(saves, activeId) {
  const sel = document.getElementById('gp-save-select');
  sel.innerHTML = '';
  saves.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = (s.nickname || 'Playthrough') + ' · ' + (s.game === 'firered' ? '🔴 FireRed' : '🍃 LeafGreen');
    if (s.id === activeId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function gpSwitchSave(id) {
  gpSetActive(id);
  gpRenderAll(id);
}

function gpRenderAll(id) {
  const save = gpGetSave(id);
  if (!save) return;

  // Version badge
  const vb = document.getElementById('gp-version-badge');
  vb.textContent = save.game === 'firered' ? '🔴 Pokémon FireRed' : '🍃 Pokémon LeafGreen';
  vb.className = 'gp-version-badge ' + save.game;

  gpRenderBadges(save);
  gpRenderE4(save);
  gpRenderLocations(save);
  gpRenderTeam(save);
  gpRenderDex(save, 'all');
  gpRenderNotes(save);
}

/* ── Journey: Badges ── */
function gpRenderBadges(save) {
  const earned = new Set(save.badges || []);
  const grid   = document.getElementById('gp-badge-grid');
  grid.innerHTML = '';

  GP_BADGES.forEach(b => {
    const isEarned = earned.has(b.id);
    const slot = document.createElement('div');
    slot.className = 'gp-badge-slot';
    slot.title = isEarned ? b.name + ' Badge — earned!' : 'Defeat ' + b.gym + ' to earn this badge';
    slot.innerHTML = `
      <div class="gp-badge-circle ${isEarned ? 'earned' : 'unearned'}" onclick="gpToggleBadge('${b.id}')">
        ${GP_BADGE_IMG[b.id] ? `<img class="gp-badge-img" src="${GP_BADGE_IMG[b.id]}" alt="${b.name}" width="34" height="34" style="image-rendering:auto">` : `<span style="font-size:11px;color:#ede9ff88">${b.name.slice(0,3)}</span>`}
      </div>
      <div class="gp-badge-name ${isEarned ? 'earned' : ''}">${b.name}</div>
    `;
    grid.appendChild(slot);
  });

  const count = earned.size;
  document.getElementById('gp-badge-fill').style.width = (count / 8 * 100) + '%';
  document.getElementById('gp-badge-label').textContent = count + ' / 8 badges';
}

function gpToggleBadge(badgeId) {
  const id   = gpGetActive();
  const save = gpGetSave(id);
  if (!save) return;
  if (!save.badges) save.badges = [];
  const idx = save.badges.indexOf(badgeId);
  const wasEarned = idx >= 0;
  if (wasEarned) save.badges.splice(idx, 1);
  else           save.badges.push(badgeId);
  gpUpdateSave(save);
  gpRenderBadges(save);

  // Rotom reacts
  if (!wasEarned) {
    const b = GP_BADGES.find(x => x.id === badgeId);
    gpAddRotomNote(save, `Bzzt! ${b.name} Badge get — ${b.gym} is no match for you Trainer-zzzt! ⚡`, id);
    // Check team level vs next unearned gym
    setTimeout(() => gpCheckNextGym(save, id), 600);
  }
}

/* ── Journey: Elite Four ── */
function gpRenderE4(save) {
  const beaten = new Set(save.e4 || []);
  const grid   = document.getElementById('gp-e4-grid');
  grid.innerHTML = '';
  GP_E4.forEach(e => {
    const isBeaten = beaten.has(e.id);
    const slot = document.createElement('div');
    slot.className = 'gp-e4-slot';
    slot.innerHTML = `
      <div class="gp-e4-circle ${isBeaten ? 'beaten' : 'unbeaten'}" onclick="gpToggleE4('${e.id}')">
        ${e.emoji}
      </div>
      <div class="gp-e4-name ${isBeaten ? 'beaten' : ''}">${e.name}</div>
    `;
    grid.appendChild(slot);
  });
}

function gpToggleE4(e4Id) {
  const id   = gpGetActive();
  const save = gpGetSave(id);
  if (!save) return;
  if (!save.e4) save.e4 = [];
  const idx = save.e4.indexOf(e4Id);
  const wasBeaten = idx >= 0;
  if (wasBeaten) save.e4.splice(idx, 1);
  else           save.e4.push(e4Id);
  gpUpdateSave(save);
  gpRenderE4(save);

  if (!wasBeaten) {
    const e = GP_E4.find(x => x.id === e4Id);
    const msg = e.id === 'blue'
      ? `Bzzt! You're the Champion Trainer-zzzt! CHAMPION! ⚡⚡⚡`
      : `Bzzt! ${e.name} defeated — one step closer to the Championship-zzzt ⚡`;
    gpAddRotomNote(save, msg, id);
  }
}

/* ── Journey: Locations ── */
function gpRenderLocations(save) {
  const visited = new Set(save.locations || []);
  const grid    = document.getElementById('gp-location-grid');
  grid.innerHTML = '';
  GP_KANTO_LOCATIONS.forEach(loc => {
    const chip = document.createElement('div');
    chip.className = 'gp-loc-chip' + (visited.has(loc) ? ' visited' : '');
    chip.textContent = (visited.has(loc) ? '✓ ' : '') + loc;
    chip.onclick = () => gpToggleLocation(loc);
    grid.appendChild(chip);
  });
}

function gpToggleLocation(loc) {
  const id   = gpGetActive();
  const save = gpGetSave(id);
  if (!save) return;
  if (!save.locations) save.locations = [];
  const idx = save.locations.indexOf(loc);
  const wasVisited = idx >= 0;
  if (wasVisited) save.locations.splice(idx, 1);
  else            save.locations.push(loc);
  gpUpdateSave(save);
  gpRenderLocations(save);

  // Check if this location triggers a gym warning
  if (!wasVisited) gpCheckGymTrigger(save, loc, id);
}

/* ── Gym warning logic ── */
const GP_GYM_TRIGGERS = {
  'Viridian Forest':   0,  // → Brock (rock)
  'Mt. Moon':          1,  // → Misty (water)
  'Route 6':           2,  // → Lt. Surge (electric)
  'Route 8':           3,  // → Erika (grass)
  'Route 15':          4,  // → Koga (poison)
  'Silph Co.':         5,  // → Sabrina (psychic)
  'Seafoam Islands':   6,  // → Blaine (fire)
  'Victory Road':      7,  // → Giovanni (ground)
};

function gpCheckGymTrigger(save, loc, saveId) {
  const gymIdx = GP_GYM_TRIGGERS[loc];
  if (gymIdx === undefined) return;
  const gym = GP_BADGES[gymIdx];
  if ((save.badges || []).includes(gym.id)) return; // already beaten

  const team = (save.team || []).filter(Boolean);
  if (!team.length) return;

  // Level check
  const avgLevel = Math.round(team.reduce((s, p) => s + (p.level || 1), 0) / team.length);
  const aceLevel = gym.aceLevel;
  const levelDiff = aceLevel - avgLevel;

  let messages = [];

  if (levelDiff >= 10) {
    messages.push(`Bzzt! Rotom is worried Trainer-zzzt — ${gym.gym}'s ace is level ${aceLevel} and your team averages level ${avgLevel}. Some serious training is needed-zzzt ⚡`);
  } else if (levelDiff >= 5) {
    messages.push(`Bzzt! ${gym.gym}'s ace is level ${aceLevel}-zzzt — your team average is level ${avgLevel}. A little more training wouldn't hurt ⚡`);
  } else {
    // Levels good — check type coverage
    const teamTypes = team.flatMap(p => p.types || []);
    const coversGym = teamTypes.some(t => (GP_SUPER_EFFECTIVE[t] || []).includes(gym.type));
    if (!coversGym) {
      // Find effective types
      const effectiveTypes = Object.entries(GP_SUPER_EFFECTIVE)
        .filter(([,covers]) => covers.includes(gym.type))
        .map(([t]) => t);
      messages.push(`Bzzt! ${gym.gym} uses ${gym.type} types Trainer-zzzt — your team is missing super effective coverage! You'll want a ${effectiveTypes.slice(0,2).join(' or ')} type ⚡`);
    }
  }

  messages.forEach((msg, i) => {
    setTimeout(() => gpAddRotomNote(save, msg, saveId), i * 800);
  });
}

function gpCheckNextGym(save, saveId) {
  // Find the next unearned badge and check if the previous location was its trigger
  const earned = new Set(save.badges || []);
  const nextGymIdx = GP_BADGES.findIndex(b => !earned.has(b.id));
  if (nextGymIdx < 0) {
    gpAddRotomNote(save, `Bzzt! All 8 badges collected Trainer-zzzt! The Elite Four awaits-zzzt ⚡`, saveId);
  }
}

/* ── My Team ── */
let gpEditingSlot = null;

function gpRenderTeam(save) {
  const team = save.team || Array(6).fill(null);
  const grid = document.getElementById('gp-team-grid');
  grid.innerHTML = '';

  for (let i = 0; i < 6; i++) {
    const mon  = team[i] || null;
    const slot = document.createElement('div');
    slot.className = 'gp-team-slot' + (mon ? ' filled' : '');
    slot.onclick = () => gpOpenTeamModal(i, mon);

    if (mon) {
      const spriteUrl = `https://img.pokemondb.net/sprites/sword-shield/icon/${mon.species.toLowerCase()}.png`;
      slot.innerHTML = `
        <img class="gp-team-sprite" src="${spriteUrl}" alt="${mon.species}" onerror="this.style.display='none'">
        <div class="gp-team-name">${mon.nickname || mon.species}</div>
        <div class="gp-team-level">Lv. ${mon.level || '?'}</div>
      `;
    } else {
      slot.innerHTML = `
        <div class="gp-team-sprite-empty">+</div>
        <div class="gp-team-empty-label">Empty</div>
      `;
    }
    grid.appendChild(slot);
  }
}

function gpOpenTeamModal(slotIdx, mon) {
  gpEditingSlot = slotIdx;
  document.getElementById('gp-team-modal-title').textContent = `Team Slot ${slotIdx + 1}`;
  document.getElementById('gp-team-species').value  = mon ? mon.species  : '';
  document.getElementById('gp-team-nickname').value = mon ? (mon.nickname || '') : '';
  document.getElementById('gp-team-level').value    = mon ? (mon.level   || '') : '';
  document.getElementById('gp-team-modal').style.display = 'flex';
  setTimeout(() => initSpeciesAC('gp-team-species', (name) => {
    document.getElementById('gp-team-species').value = name;
  }), 50);
}

function gpCloseTeamModal() {
  document.getElementById('gp-team-modal').style.display = 'none';
  gpEditingSlot = null;
}

function gpSaveTeamSlot() {
  if (gpEditingSlot === null) return;
  const species  = document.getElementById('gp-team-species').value.trim();
  const nickname = document.getElementById('gp-team-nickname').value.trim();
  const level    = parseInt(document.getElementById('gp-team-level').value) || null;
  if (!species) { gpCloseTeamModal(); return; }

  const id   = gpGetActive();
  const save = gpGetSave(id);
  if (!save) return;
  if (!save.team) save.team = Array(6).fill(null);

  // Derive rough types from a simple lookup (for gym checking)
  save.team[gpEditingSlot] = { species, nickname, level, types: [] };
  gpUpdateSave(save);
  gpCloseTeamModal();
  gpRenderTeam(save);
}

function gpClearTeamSlot() {
  if (gpEditingSlot === null) return;
  const id   = gpGetActive();
  const save = gpGetSave(id);
  if (!save) return;
  if (!save.team) save.team = Array(6).fill(null);
  save.team[gpEditingSlot] = null;
  gpUpdateSave(save);
  gpCloseTeamModal();
  gpRenderTeam(save);
}

/* ── Rotom's Notes ── */
function gpRenderNotes(save) {
  const thread  = document.getElementById('gp-notes-thread');
  const notes   = save.notes || [];
  thread.innerHTML = '';

  if (!notes.length) {
    // Welcome message
    const welcome = save.game === 'firered'
      ? `Bzzt! Welcome to RotomOS Game Progress Trainer-zzzt! I'll be tracking your FireRed adventure and sending you tips along the way ⚡`
      : `Bzzt! Welcome to RotomOS Game Progress Trainer-zzzt! I'll be tracking your LeafGreen adventure and sending you tips along the way ⚡`;
    thread.innerHTML = `
      <div class="gp-note-rotom">
        <img class="gp-note-rotom-sprite" src="${ROTOM_SPRITE}" alt="Rotom">
        <div>
          <div class="gp-note-rotom-bubble">${welcome}</div>
          <div class="gp-note-time">Rotom</div>
        </div>
      </div>
    `;
    return;
  }

  notes.forEach(n => {
    const el = document.createElement('div');
    if (n.from === 'rotom') {
      el.className = 'gp-note-rotom';
      el.innerHTML = `
        <img class="gp-note-rotom-sprite" src="${ROTOM_SPRITE}" alt="Rotom">
        <div>
          <div class="gp-note-rotom-bubble">${n.text}</div>
          <div class="gp-note-time">${n.time || 'Rotom'}</div>
        </div>
      `;
    } else {
      el.className = 'gp-note-user';
      el.innerHTML = `
        <div>
          <div class="gp-note-user-bubble">${n.text}</div>
          <div class="gp-note-time" style="text-align:right">${n.time || 'You'}</div>
        </div>
      `;
    }
    thread.appendChild(el);
  });
  thread.scrollTop = thread.scrollHeight;
}

function gpAddRotomNote(save, text, saveId) {
  if (!save.notes) save.notes = [];
  save.notes.push({ from:'rotom', text, time: gpTimeString() });
  gpUpdateSave(save);
  // Live update if notes tab is visible
  const notesTab = document.getElementById('gp-notes-tab');
  if (notesTab && notesTab.style.display !== 'none') gpRenderNotes(save);
}

function gpSendNote() {
  const input = document.getElementById('gp-notes-input');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';

  const id   = gpGetActive();
  const save = gpGetSave(id);
  if (!save) return;
  if (!save.notes) save.notes = [];
  save.notes.push({ from:'trainer', text, time: gpTimeString() });
  gpUpdateSave(save);
  gpRenderNotes(save);

  // Simple Rotom reply
  setTimeout(() => {
    const replies = [
      `Bzzt! Got it Trainer-zzzt ⚡`,
      `Bzzt! Rotom has noted that-zzzt ⚡`,
      `Bzzt! Roger that Trainer-zzzt ⚡`,
      `Bzzt! Interesting Trainer-zzzt — keep going ⚡`,
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    const updated = gpGetSave(id);
    gpAddRotomNote(updated, reply, id);
  }, 1000);
}

function gpTimeString() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}

/* ── Tab switching ── */
function gpSwitchTab(tab) {
  ['journey','team','notes'].forEach(t => {
    document.getElementById('gp-' + t + '-tab').style.display = t === tab ? 'block' : 'none';
    const btn = document.getElementById('gptab-' + t);
    if (btn) btn.classList.toggle('active', t === tab);
  });
  if (tab === 'notes') {
    const id   = gpGetActive();
    const save = gpGetSave(id);
    if (save) gpRenderNotes(save);
    setTimeout(() => {
      const thread = document.getElementById('gp-notes-thread');
      if (thread) thread.scrollTop = thread.scrollHeight;
    }, 50);
  }
}

function gpSwitchTab(tab) {
  ['journey','team','dex','notes'].forEach(t => {
    document.getElementById('gp-' + t + '-tab').style.display = t === tab ? 'block' : 'none';
    const btn = document.getElementById('gptab-' + t);
    if (btn) btn.classList.toggle('active', t === tab);
  });
  if (tab === 'notes') {
    const id   = gpGetActive();
    const save = gpGetSave(id);
    if (save) gpRenderNotes(save);
    setTimeout(() => {
      const thread = document.getElementById('gp-notes-thread');
      if (thread) thread.scrollTop = thread.scrollHeight;
    }, 50);
  }
  if (tab === 'dex') {
    const id   = gpGetActive();
    const save = gpGetSave(id);
    if (save) gpRenderDex(save, 'all');
  }
}

/* ── Pokédex tab ── */

// Full Kanto 151 with version exclusives flagged
const GP_KANTO_DEX = [
  {id:1,  name:'Bulbasaur'}, {id:2,  name:'Ivysaur'},    {id:3,  name:'Venusaur'},
  {id:4,  name:'Charmander'},{id:5,  name:'Charmeleon'}, {id:6,  name:'Charizard'},
  {id:7,  name:'Squirtle'},  {id:8,  name:'Wartortle'},  {id:9,  name:'Blastoise'},
  {id:10, name:'Caterpie'},  {id:11, name:'Metapod'},    {id:12, name:'Butterfree'},
  {id:13, name:'Weedle'},    {id:14, name:'Kakuna'},     {id:15, name:'Beedrill'},
  {id:16, name:'Pidgey'},    {id:17, name:'Pidgeotto'},  {id:18, name:'Pidgeot'},
  {id:19, name:'Rattata'},   {id:20, name:'Raticate'},   {id:21, name:'Spearow'},
  {id:22, name:'Fearow'},    {id:23, name:'Ekans',   fr:true}, {id:24, name:'Arbok', fr:true},
  {id:25, name:'Pikachu'},   {id:26, name:'Raichu'},
  {id:27, name:'Sandshrew', lg:true}, {id:28, name:'Sandslash', lg:true},
  {id:29, name:'Nidoran♀'}, {id:30, name:'Nidorina'},   {id:31, name:'Nidoqueen'},
  {id:32, name:'Nidoran♂'}, {id:33, name:'Nidorino'},   {id:34, name:'Nidoking'},
  {id:35, name:'Clefairy'},  {id:36, name:'Clefable'},
  {id:37, name:'Vulpix', lg:true},    {id:38, name:'Ninetales', lg:true},
  {id:39, name:'Jigglypuff'},{id:40, name:'Wigglytuff'},
  {id:41, name:'Zubat'},     {id:42, name:'Golbat'},
  {id:43, name:'Oddish', fr:true},    {id:44, name:'Gloom', fr:true},    {id:45, name:'Vileplume', fr:true},
  {id:46, name:'Paras'},     {id:47, name:'Parasect'},
  {id:48, name:'Venonat'},   {id:49, name:'Venomoth'},
  {id:50, name:'Diglett'},   {id:51, name:'Dugtrio'},
  {id:52, name:'Meowth'},    {id:53, name:'Persian'},
  {id:54, name:'Psyduck', fr:true},   {id:55, name:'Golduck', fr:true},
  {id:56, name:'Mankey'},    {id:57, name:'Primeape'},
  {id:58, name:'Growlithe', fr:true}, {id:59, name:'Arcanine', fr:true},
  {id:60, name:'Poliwag'},   {id:61, name:'Poliwhirl'},  {id:62, name:'Poliwrath'},
  {id:63, name:'Abra'},      {id:64, name:'Kadabra'},    {id:65, name:'Alakazam'},
  {id:66, name:'Machop'},    {id:67, name:'Machoke'},    {id:68, name:'Machamp'},
  {id:69, name:'Bellsprout', lg:true},{id:70, name:'Weepinbell', lg:true},{id:71, name:'Victreebel', lg:true},
  {id:72, name:'Tentacool'}, {id:73, name:'Tentacruel'},
  {id:74, name:'Geodude'},   {id:75, name:'Graveler'},   {id:76, name:'Golem'},
  {id:77, name:'Ponyta'},    {id:78, name:'Rapidash'},
  {id:79, name:'Slowpoke', lg:true},  {id:80, name:'Slowbro', lg:true},
  {id:81, name:'Magnemite', lg:true}, {id:82, name:'Magneton', lg:true},
  {id:83, name:'Farfetch\'d'},{id:84, name:'Doduo'},     {id:85, name:'Dodrio'},
  {id:86, name:'Seel'},      {id:87, name:'Dewgong'},
  {id:88, name:'Grimer'},    {id:89, name:'Muk'},
  {id:90, name:'Shellder', fr:true},  {id:91, name:'Cloyster', fr:true},
  {id:92, name:'Gastly'},    {id:93, name:'Haunter'},    {id:94, name:'Gengar'},
  {id:95, name:'Onix'},
  {id:96, name:'Drowzee'},   {id:97, name:'Hypno'},
  {id:98, name:'Krabby', lg:true},    {id:99, name:'Kingler', lg:true},
  {id:100,name:'Voltorb'},   {id:101,name:'Electrode'},
  {id:102,name:'Exeggcute'}, {id:103,name:'Exeggutor'},
  {id:104,name:'Cubone'},    {id:105,name:'Marowak'},
  {id:106,name:'Hitmonlee'}, {id:107,name:'Hitmonchan'},
  {id:108,name:'Lickitung'},
  {id:109,name:'Koffing'},   {id:110,name:'Weezing', fr:true},
  {id:111,name:'Rhyhorn'},   {id:112,name:'Rhydon'},
  {id:113,name:'Chansey'},
  {id:114,name:'Tangela'},
  {id:115,name:'Kangaskhan'},
  {id:116,name:'Horsea', fr:true},    {id:117,name:'Seadra', fr:true},
  {id:118,name:'Goldeen'},   {id:119,name:'Seaking'},
  {id:120,name:'Staryu', lg:true},    {id:121,name:'Starmie', lg:true},
  {id:122,name:'Mr. Mime'},
  {id:123,name:'Scyther', fr:true},
  {id:124,name:'Jynx', lg:true},
  {id:125,name:'Electabuzz', fr:true},
  {id:126,name:'Magmar', lg:true},
  {id:127,name:'Pinsir', lg:true},
  {id:128,name:'Tauros'},
  {id:129,name:'Magikarp'},  {id:130,name:'Gyarados'},
  {id:131,name:'Lapras'},
  {id:132,name:'Ditto'},
  {id:133,name:'Eevee'},
  {id:134,name:'Vaporeon'},  {id:135,name:'Jolteon'},   {id:136,name:'Flareon'},
  {id:137,name:'Porygon'},
  {id:138,name:'Omanyte'},   {id:139,name:'Omastar'},
  {id:140,name:'Kabuto'},    {id:141,name:'Kabutops'},
  {id:142,name:'Aerodactyl'},
  {id:143,name:'Snorlax'},
  {id:144,name:'Articuno'},  {id:145,name:'Zapdos'},    {id:146,name:'Moltres'},
  {id:147,name:'Dratini'},   {id:148,name:'Dragonair'}, {id:149,name:'Dragonite'},
  {id:150,name:'Mewtwo'},    {id:151,name:'Mew'},
];

let gpDexCurrentFilter = 'all';

function gpRenderDex(save, filter) {
  gpDexCurrentFilter = filter || 'all';
  const dexData  = save.dex || {};
  const version  = save.game;
  const grid     = document.getElementById('gp-dex-grid');
  if (!grid) return;

  // Update filter buttons
  ['all','caught','seen','unseen'].forEach(f => {
    const btn = document.getElementById('gpdf-' + f);
    if (btn) btn.classList.toggle('active', f === gpDexCurrentFilter);
  });

  // Stats
  let caughtCount = 0, seenCount = 0;
  GP_KANTO_DEX.forEach(p => {
    const state = dexData[p.id] || 'unseen';
    if (state === 'caught') caughtCount++;
    else if (state === 'seen') seenCount++;
  });

  const fillPct = Math.round(caughtCount / 151 * 100);
  document.getElementById('gp-dex-fill').style.width = fillPct + '%';
  document.getElementById('gp-dex-caught-label').textContent = caughtCount + ' / 151 caught';
  document.getElementById('gp-dex-seen-label').textContent   = (seenCount + caughtCount) + ' seen';

  // Filter
  const filtered = GP_KANTO_DEX.filter(p => {
    const state = dexData[p.id] || 'unseen';
    if (gpDexCurrentFilter === 'caught') return state === 'caught';
    if (gpDexCurrentFilter === 'seen')   return state === 'seen';
    if (gpDexCurrentFilter === 'unseen') return state === 'unseen';
    return true;
  });

  grid.innerHTML = '';
  filtered.forEach(p => {
    const state   = dexData[p.id] || 'unseen';
    const isVersionExclusive = (p.fr && version === 'leafgreen') || (p.lg && version === 'firered');
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;

    const entry = document.createElement('div');
    entry.className = `gp-dex-entry state-${state}${isVersionExclusive ? ' version-exclusive' : ''}`;
    entry.title = isVersionExclusive
      ? `${p.name} — ${p.fr ? 'FireRed' : 'LeafGreen'} exclusive (trade required)`
      : p.name;
    entry.onclick = () => gpCycleDexState(p.id, save);

    const dotHtml = state !== 'unseen'
      ? `<div class="gp-dex-state-dot ${state}"></div>` : '';

    entry.innerHTML = `
      ${dotHtml}
      <img class="gp-dex-sprite ${state}" src="${spriteUrl}" alt="${p.name}" width="40" height="40" onerror="this.style.opacity='.2'">
      <div class="gp-dex-num">#${String(p.id).padStart(3,'0')}</div>
      <div class="gp-dex-name">${p.name}</div>
    `;
    grid.appendChild(entry);
  });
}

function gpCycleDexState(pokemonId, save) {
  if (!save.dex) save.dex = {};
  const current = save.dex[pokemonId] || 'unseen';
  const next = current === 'unseen' ? 'seen' : current === 'seen' ? 'caught' : 'unseen';
  save.dex[pokemonId] = next;
  gpUpdateSave(save);
  gpRenderDex(save, gpDexCurrentFilter);

  // Rotom milestones
  if (next === 'caught') {
    const caughtCount = Object.values(save.dex).filter(s => s === 'caught').length;
    const milestones = { 50:'Bzzt! 50 Pokémon caught Trainer-zzzt — you\'re on a roll ⚡', 100:'Bzzt! 100 Pokémon caught-zzzt! The end is in sight Trainer ⚡', 151:'Bzzt! 151 out of 151 Trainer-zzzt — YOU CAUGHT THEM ALL! ⚡⚡⚡' };
    if (milestones[caughtCount]) {
      setTimeout(() => gpAddRotomNote(save, milestones[caughtCount], gpGetActive()), 300);
    }
  }
}

function gpDexFilter(filter) {
  const id   = gpGetActive();
  const save = gpGetSave(id);
  if (save) gpRenderDex(save, filter);
}



function gpOpenNewSave() {
  gpSelectedGame = 'firered';
  document.getElementById('gp-new-nickname').value = '';
  document.querySelectorAll('.gp-game-opt').forEach(el => {
    el.classList.toggle('selected', el.dataset.game === 'firered');
  });
  document.querySelectorAll('.gp-game-opt').forEach(el => {
    el.onclick = () => {
      gpSelectedGame = el.dataset.game;
      document.querySelectorAll('.gp-game-opt').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
    };
  });
  document.getElementById('gp-new-save-modal').style.display = 'flex';
}

function gpCloseNewSave() {
  document.getElementById('gp-new-save-modal').style.display = 'none';
}

function gpCreateSave() {
  const nickname = document.getElementById('gp-new-nickname').value.trim();
  const id = 'gp_' + Date.now();
  const save = {
    id, game: gpSelectedGame, nickname,
    badges: [], e4: [], team: Array(6).fill(null),
    locations: [], notes: [],
    created: new Date().toISOString()
  };
  const saves = gpLoadSaves();
  saves.push(save);
  gpSaveSaves(saves);
  gpSetActive(id);
  gpCloseNewSave();
  initGameProgress();
}

/* ── Delete save ── */
function gpConfirmDelete() {
  const id   = gpGetActive();
  const save = gpGetSave(id);
  if (!save) return;
  const label = (save.nickname || 'this playthrough');
  if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
  const saves = gpLoadSaves().filter(s => s.id !== id);
  gpSaveSaves(saves);
  localStorage.removeItem(GP_ACTIVE);
  initGameProgress();
}

/* ── Hook into goSection ── */
const _gpGoSectionOrig = goSection;
goSection = function(section) {
  _gpGoSectionOrig(section);
  if (section === 'progress') initGameProgress();
};
