// ══ BALL LEGALITY ════════════════════════════════════════════════════════════
const LEGALITY_CACHE_KEY = 'at_ball_legality';
const LEGALITY_CACHE_TS  = 'at_ball_legality_ts';
const LEGALITY_TTL       = 7 * 24 * 60 * 60 * 1000; // 1 week
const APRI_BALLS         = new Set(['Fast','Friend','Heavy','Level','Love','Lure','Moon','Dream','Beast','Safari','Sport']);

let ballLegality = null; // { "Bulbasaur": ["Moon","Dream",...], ... }

async function ensureLegality() {
  if (ballLegality) return ballLegality;

  // Try localStorage cache first
  const cached = localStorage.getItem(LEGALITY_CACHE_KEY);
  const ts     = parseInt(localStorage.getItem(LEGALITY_CACHE_TS) || '0');
  if (cached && Date.now() - ts < LEGALITY_TTL) {
    try { ballLegality = JSON.parse(cached); return ballLegality; } catch(e) {}
  }

  // Fetch from file
  try {
    const res  = await fetch('./ball_legality.json');
    const data = await res.json();
    ballLegality = data;
    localStorage.setItem(LEGALITY_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(LEGALITY_CACHE_TS, Date.now().toString());
  } catch(e) {
    console.warn('Could not load ball legality data', e);
    ballLegality = {};
  }
  return ballLegality;
}

// Normalise species name to match legality sheet keys
// Handles: "Alolan Sandshrew" → "Alolan Sandshrew", accents, ♀/♂
function normaliseName(name) {
  if (!name) return '';
  // Regional form prefixes the sheet uses
  const regionalMap = {
    'alolan ': 'Alolan ', 'galarian ': 'Galarian ',
    'hisuian ': 'Hisuian ', 'paldean ': 'Paldean ',
  };
  let n = name.trim();
  // Try direct match first
  const lower = n.toLowerCase();
  for (const [prefix, canonical] of Object.entries(regionalMap)) {
    if (lower.startsWith(prefix)) {
      n = canonical + n.slice(prefix.length);
      break;
    }
  }
  return n;
}

// Returns: 'legal' | 'illegal' | 'unknown'
function getBallLegality(species, ball) {
  if (!APRI_BALLS.has(ball)) return 'unknown'; // non-special balls not tracked
  if (!ballLegality) return 'unknown';
  const key   = normaliseName(species);
  const entry = ballLegality[key];
  if (!entry) return 'unknown'; // not in sheet (legendary/evolution/etc)
  return entry.includes(ball) ? 'legal' : 'illegal';
}

// Check on add/edit — returns warning string or null
function getLegalityWarning(species, ball) {
  const status = getBallLegality(species, ball);
  if (status === 'illegal') return `⚠️ ${species} cannot legally be in a ${ball} Ball`;
  return null;
}

