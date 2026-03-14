// ══ POKÉAPI CACHE WRAPPER ════════════════════════════════════════════════════
// Two-layer cache: in-memory (session) → localStorage (30 days) → network
// All PokéAPI calls should go through pokeGet() — never fetch() directly.

const POKE_CACHE_PREFIX = 'at_pkc_';
const POKE_CACHE_TTL    = 30 * 24 * 60 * 60 * 1000; // 30 days
const POKE_CACHE_MAX    = 150; // max localStorage entries before LRU eviction
const POKE_CACHE_INDEX  = 'at_pkc_index'; // JSON array of {key, ts} for LRU

const _memCache = {}; // in-memory: key → parsed data (no expiry, lives for session)

async function pokeGet(url) {
  // Normalise key — strip base URL so cache keys are short
  const key = url.replace('https://pokeapi.co/api/v2/', '').replace(/\/$/, '');

  // 1. Memory cache — fastest, no parse needed
  if (_memCache[key] !== undefined) return _memCache[key];

  // 2. localStorage cache
  try {
    const raw = localStorage.getItem(POKE_CACHE_PREFIX + key);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < POKE_CACHE_TTL) {
        _memCache[key] = data;
        _touchLRU(key);
        return data;
      }
      // Expired — remove it
      localStorage.removeItem(POKE_CACHE_PREFIX + key);
    }
  } catch(e) {}

  // 3. Network
  let data = null;
  try {
    const res = await fetch(url);
    if (res.ok) data = await res.json();
  } catch(e) {}

  // Store in both layers
  _memCache[key] = data;
  if (data) _lsWrite(key, data);
  return data;
}

function _lsWrite(key, data) {
  try {
    // Evict if over limit
    let index = _getLRUIndex();
    if (index.length >= POKE_CACHE_MAX) {
      // Remove oldest entry
      const oldest = index.shift();
      localStorage.removeItem(POKE_CACHE_PREFIX + oldest.key);
    }
    localStorage.setItem(POKE_CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
    _touchLRU(key, index);
  } catch(e) {
    // Storage full — clear oldest half and try again
    _evictHalf();
    try { localStorage.setItem(POKE_CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() })); } catch(e2) {}
  }
}

function _getLRUIndex() {
  try { return JSON.parse(localStorage.getItem(POKE_CACHE_INDEX) || '[]'); } catch(e) { return []; }
}

function _touchLRU(key, index) {
  index = index || _getLRUIndex();
  const i = index.findIndex(e => e.key === key);
  if (i > -1) index.splice(i, 1);
  index.push({ key, ts: Date.now() });
  try { localStorage.setItem(POKE_CACHE_INDEX, JSON.stringify(index)); } catch(e) {}
}

function _evictHalf() {
  const index = _getLRUIndex();
  const half  = Math.ceil(index.length / 2);
  index.splice(0, half).forEach(e => localStorage.removeItem(POKE_CACHE_PREFIX + e.key));
  try { localStorage.setItem(POKE_CACHE_INDEX, JSON.stringify(index.slice(half))); } catch(e) {}
}

// Legacy in-memory only cache — kept for any missed call sites
const pokeCache = {};

let currentDexSpecies = null;
let currentDexTab     = 'overview';
let currentMoveFilter = 'level-up';

async function fetchPokeData(species) {
  const key = species.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/\s+/g,'-');
  if (pokeCache[key]) return pokeCache[key];

  const [poke, spec] = await Promise.all([
    pokeGet(`https://pokeapi.co/api/v2/pokemon/${key}`),
    pokeGet(`https://pokeapi.co/api/v2/pokemon-species/${key}`),
  ]);

  let evo = null;
  if (spec?.evolution_chain?.url) {
    evo = await pokeGet(spec.evolution_chain.url);
  }

  const data = { poke, spec, evo };
  pokeCache[key] = data;
  return data;
}

