// ── Boot ──────────────────────────────────────────────────────────────────────
// Remove old switchTab / headerAction since nav_js redefines them
goSection('home');
updateWantsBadge();
updateShinyBadge();
// nhPreview() called when hunt modal opens

// ══ ROTOM COMPANION ══════════════════════════════════════════════════════════

const ROTOM_QUIPS = {
  boot_morning: [
    () => `Today'zzz a fine day for 'Dexing, ${getTrainer()}! I love the smell of it in the morning! Zzt!`,
    () => `Bzzt-zzt! Rise and shine, ${getTrainer()}! Rotom izzz READY to go! ⚡`,
    () => `Morning already?! Zzzoning in... Rotom online! Let'zzz do this, ${getTrainer()}! ⚡`,
  ],
  boot_afternoon: [
    () => `Alola, ${getTrainer()}! Zzz-zzz-zzzt! This region's better than a box full of machines!`,
    () => `Afternoon check-in, ${getTrainer()}! Rotom izzz here and fully charged-zzzt! ⚡`,
    () => `Good afternoon! There are still plenty of Pokémon out there to find, ${getTrainer()}! Zzz-zzt!`,
  ],
  boot_evening: [
    () => `Evening, ${getTrainer()}! Some Pokémon only come out at night, you know-zzzt! ⚡`,
    () => `Zzt-zzt! The sun izzz setting, ${getTrainer()}... perfect time for some 'Dexing, bucko!`,
    () => `Ahhh, evening! Rotom lovezzz the night shift! Let'zzz get to work, ${getTrainer()}-zzzt! ⚡`,
  ],
  boot_night: [
    () => `Zzz-zzt...! Oh! You're up late, ${getTrainer()}! Rotom never sleepzzz though! ⚡`,
    () => `*zaaawn* It's the middle of the night, ${getTrainer()}... Rotom izzz here for you though-zzzt.`,
    () => `Late night 'Dexing, ${getTrainer()}?! My circuitzzz are tingling! Let'zzz go-zzzt! ⚡`,
    () => `Zzzoning in... Oh! There you are, ${getTrainer()}! Rotom wazzz almost asleep-zzzt!`,
  ],
  boot_earlyMorning: [
    () => `Zzz-zzt?! It'zzz not even light out yet, ${getTrainer()}! You are DEDICATED-zzzt! ⚡`,
    () => `*zaaawn* ...Bzzt! Rotom izzz awake! Barely! But awake! Zzt-zzt... Hi, ${getTrainer()}.`,
    () => `The crack of dawn, ${getTrainer()}! Either you never slept, or you really love Pokémon-zzzt.`,
  ],
  poke: [
    "H-hey! My circuitzzz can't take this kind of stress!",
    "Zmmm! What wazzz that for, my jammy friend?!",
    "Watch it! Don't you know Rotom is trying to WORK here-zzzt?!",
    "Bzzt-zzt! You're lucky I like you, bucko.",
    "I could keep exploring all day! ...But maybe stop poking me-zzzt.",
    "*zaaawn* Boy, I am bushed today... Don't know why...",
  ],
  shinyFound: [
    "Zzzzzzzzt! Kzzt! Kzzt! You've really gone and done it, partner! ⚡⚡⚡",
    "Hot diggity! Look at you — you're on FIRE! A SHINY! Zz-zz-zz!!",
    "KZZZZRRT?! I knew I picked a good Trainer! ZZT-ZZT!! ⚡",
    "Zzzzrrrttt!!! My lucky circuits!! You found it!! CONGRATZZZ!! ⚡⚡",
  ],
  shinyFailed: [
    "Zzt... I've got a bad feeling about thizzz... but we press on, partner.",
    "Bzzt... my circuitzzz are heavy. But Rotom believezzz in you. Always-zzzt.",
    "Zzzrt... Don't give up yet! We can do thizzz! Zzt!",
    "Whirr... *zaaawn* ...Even Rotom needs a moment. Then we go again-zzzt.",
  ],
  huntStart: [
    "Keep on stomping around out there, partner! There izzz plenty to find, that's for sure!",
    "Wonder what kind of shiny we'll get to rub elbows with, eh? If only I had elbows! Bzzzzzzt!",
    "Zzt-zzt! Now let'zzz get this hunt going! My circuitz are READY!",
    "Dive right in and dive right into fantastic new Pokémon encounterzzz! ⚡",
  ],
  breedSave: [
    "Ooh, why don't you see what kind of Pokémon wazzz born from that Egg, kiddo? Zzt!",
    "Some Pokémon you'll only find by hatching Eggzzz, you know? Rotom approves-zzzt!",
    "I heard there's a Pokémon that evolves if it feelzzz friendly toward you. I like you plenty. Zzt!",
    "Bzzt! Destiny Knot? Everstone? Hot diggity — Rotom is taking notezzz! ⚡",
  ],
  aprimonAdd: [
    "Congratzzz! You registered a Pokémon — it'zzz a red-letter day... and I'm about as red as anything!",
    "Hey! Let'zzz check out what kind of Pokémon it izzz! Bzzt-zzt!",
    "Why don't you check out just what kind of Pokémon it izzz that you caught, pal? Zzt!",
    "Kzzzzrrt?! Nice ball choice! I knew I picked a good Trainer! Zzt-zzt! ⚡",
  ],
  ldexCatch: [
    "Zzzrt! Got one! Let'zzz check it out quick! ⚡",
    "Hot diggity! Another one for the Living Dex, bucko! Zz-zz-zz!",
    "Kzzt! Living Dex growing! My circuitz are doing a happy zap-zzzt! ⚡",
    "Ooh, a new one! Why don't you check out just what kind of Pokémon it izzz, pal? Zzt!",
  ],
  ldexMilestone: [
    "Zzzzrrrttt!!! Kzzt! Kzzt! Kzzrrrttt! You've done it, kid... You've really gone and done it! ⚡⚡",
    "Kzzzzrrt?! You've met this many Pokémon?! I knew I picked a good Trainer! Zzt-zzt! ⚡",
    "Hot diggity! Look at you — you're on fire, partner! It's like we're playing bingo over here! Zz-zz-zz!",
    "What the zzzt?! You're so close! Lookzzz like a completed Pokédex might not just be a dream! ⚡",
  ],
  idle: [
    "You sure there's no Z-Crystal out there for me? I've thought up plenty of sweet Z-Movezzz!",
    "I'm just zzzoning out... Zzzoning out... zzzoning in... zzzoning on and on...",
    "Ohhhh yeah... There are still plenty of great Pokémon out there to be found in the world! Zzz-zzt!",
    "If you wanna fill up that Pokédex, it wouldn't be a bad idea to trade Pokémon with some friends, zzt-zzt!",
    "Some Pokémon evolve based on different conditionzzz, like where they are or even what time it izzz!",
    "I've heard that real fearsome Trainers like to gather and hunt together... Zzt?",
    "So close to completing the Living Dex! Don't give up now, partner! Zzt-zzt!",
    "Can I admit something to you, friend? Truth is... I totally dig that you keep coming back! Zz-zz-zzt!",
  ],
  idle_legend: [
    "I still can't believe what you've done, Trainer-zzzt...",
    "A full shiny Living Dex... Rotom still thinkkzzz about it sometimes. Zzt.",
    "You know, I've been in a lot of devicezzz. But I've never met a Trainer like you-zzzt.",
    "Zzzoning out... thinking about your achievement again... Zzt. It neverzz gets old.",
    "If there were a Z-Crystal for dedication, you'd have it for sure, bucko-zzzt. ★",
  ],
};

let rotomToastTimer = null;
let rotomIdleTimer  = null;

function rotomSay(key, force) {
  const lines = ROTOM_QUIPS[key] || ROTOM_QUIPS.idle;
  const raw   = lines[Math.floor(Math.random() * lines.length)];
  const text  = typeof raw === 'function' ? raw() : raw;

  const toast  = document.getElementById('rotom-toast');
  const textEl = document.getElementById('rotom-toast-text');
  if (!toast || !textEl) return;

  if (rotomToastTimer) clearTimeout(rotomToastTimer);

  textEl.textContent = text;
  toast.classList.add('show');

  // Spark the logo
  rotomReact(key);

  rotomToastTimer = setTimeout(() => toast.classList.remove('show'), 7000);
}

function rotomReact(key) {
  const sprite = document.getElementById('rotom-sidebar-sprite');
  const spark  = document.getElementById('rotom-spark');
  const status = document.getElementById('rotom-status-text');
  if (!sprite) return;

  // Remove old classes
  sprite.classList.remove('excited','spinning');
  spark?.classList.remove('sparking');

  void sprite.offsetWidth; // force reflow

  if (key === 'shinyFound' || key === 'ldexMilestone') {
    sprite.classList.add('spinning');
    spark?.classList.add('sparking');
    if (status) status.textContent = 'BZZT!! ⚡⚡⚡';
  } else if (key === 'poke') {
    sprite.classList.add('excited');
    if (status) status.textContent = 'H-hey!! — zzzt!';
  } else if (key === 'shinyFailed') {
    if (status) status.textContent = 'Bzzt... chin up-zzzt.';
  } else if (key === 'huntStart' || key === 'breedSave' || key === 'aprimonAdd') {
    sprite.classList.add('excited');
    if (status) status.textContent = 'Bzzt! On it-zzzt! ⚡';
  } else {
    if (status) status.textContent = 'System ready — bzzt!';
  }

  // Reset status after 4s
  setTimeout(() => {
    if (status) status.textContent = 'System ready — bzzt!';
    sprite.classList.remove('excited','spinning');
  }, 4000);
}

function rotomPoke() {
  rotomSay('poke', true);
}

function rotomIdle() {
  const isLegend = lsGet('at_sldex_complete', false);
  rotomSay(isLegend && Math.random() < 0.4 ? 'idle_legend' : 'idle');
  rotomIdleTimer = setTimeout(rotomIdle, 90000 + Math.random() * 60000);
}

// ── Hook into existing events ─────────────────────────────────────────────────

// Patch confirmFound to trigger shiny reaction
const _confirmFoundOrig = confirmFound;
confirmFound = function() {
  _confirmFoundOrig();
  setTimeout(() => { rotomSay('shinyFound'); checkShinyRotomUnlock(); }, 300);
  // Show Ko-fi nudge after first ever shiny found
  setTimeout(() => showKofiBanner(), 3500);
};

// Patch confirmFailed
const _confirmFailedOrig = confirmFailed;
confirmFailed = function() {
  _confirmFailedOrig();
  setTimeout(() => rotomSay('shinyFailed'), 300);
};

// Patch startHunt
const _startHuntOrig = startHunt;
startHunt = function() {
  _startHuntOrig();
  rotomSay('huntStart');
};

// Patch saveMon
const _saveMonOrig = saveMon;
saveMon = function() {
  _saveMonOrig();
  rotomSay('aprimonAdd');
};

// Patch saveBreedProject
const _saveBreedOrig = saveBreedProject;
saveBreedProject = function() {
  _saveBreedOrig();
  rotomSay('breedSave');
};

// Patch ldexToggle for milestone checks
const _ldexToggleOrig = ldexToggle;
ldexToggle = function(id, display, e) {
  const wasAlreadyCaught = ldexData[id]?.caught;
  _ldexToggleOrig(id, display, e);
  if (!wasAlreadyCaught) {
    const caught = Object.values(ldexData).filter(d => d.caught).length;
    const milestones = [50,100,150,200,300,400,500,600,700,800,900,1000,1025];
    if (milestones.includes(caught)) {
      rotomSay('ldexMilestone');
    } else {
      rotomSay('ldexCatch');
    }
  }
  checkShinyRotomUnlock();
  checkLivingDexComplete();
};

// Also patch ldexToggleShiny for unlock check
const _ldexToggleShinyOrig = ldexToggleShiny;
ldexToggleShiny = function(id, e) {
  _ldexToggleShinyOrig(id, e);
  checkShinyRotomUnlock();
  checkLivingDexComplete();
};

// (unlock checks run after all consts are defined — see bottom of script)



// ══ LIVING DEX & SHINY LIVING DEX MILESTONES ═════════════════════════════════
const LS_LIVING_DEX_COMPLETE      = 'at_ldex_complete';
const LS_LIVING_DEX_NOTIF         = 'at_ldex_complete_notif';
const LS_SHINY_LDEX_COMPLETE      = 'at_sldex_complete';
const LS_SHINY_LDEX_NOTIF         = 'at_sldex_complete_notif';
const LS_GOLD_THEME               = 'at_gold_theme';

let goldThemeActive = lsGet(LS_GOLD_THEME, false);

