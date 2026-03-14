// ══ ABOUT ════════════════════════════════════════════════════════════════════
function renderAbout() {
  document.getElementById('about-content').innerHTML = `

    <!-- Meet the Dev -->
    <div class="about-card">
      <div class="about-dev-header">
        <div class="about-chandelure">
          <img src="https://img.pokemondb.net/sprites/home/shiny/chandelure.png"
               onerror="this.src='https://img.pokemondb.net/sprites/sword-shield/icon/chandelure.png'"
               alt="Chandelure" class="about-sprite" />
          <div class="about-sprite-label">Favourite ★</div>
        </div>
        <div class="about-dev-text">
          <div class="about-dev-name cinzel">Hey, I'm Ash! <span style="color:#7c6fa0;font-size:14px;font-family:'Nunito',sans-serif;font-weight:600">she/her</span></div>
          <div class="about-dev-bio">
            I've been playing Pokémon since the very beginning — the kind of kid who'd hold her
            Game Boy up to streetlights on car rides just to keep playing Blue a little longer.
            I've played every game: mainline, side games, all of it. If it has Pokémon in the
            title, I've put time into it.
          </div>
          <div class="about-dev-bio" style="margin-top:10px">
            I built RotomOS for people like me. People who are juggling multiple apps,
            spreadsheets, hand-written notes, and random browser tabs just to track what they're
            doing in the games they love. I wanted one place for all of it — and I hope it becomes
            that for you too.
          </div>
          <div class="about-tags">
            <span class="about-tag about-tag-gold">✨ Shiny Hunter</span>
            <span class="about-tag about-tag-mint">🌿 Aprimon Collector</span>
            <span class="about-tag about-tag-purple">📖 Living Dex (shiny!)</span>
            <span class="about-tag about-tag-muted">👻 Ghost type aficionado</span>
            <span class="about-tag about-tag-muted">🐱 Cat mom × 2</span>
            <span class="about-tag about-tag-muted">🖥️ PC builder</span>
            <span class="about-tag about-tag-muted">🍰 Baker & crafter</span>
          </div>
        </div>
      </div>

      <!-- Rotom quote -->
      <div class="about-rotom-quote">
        <span class="about-rotom-bolt">⚡</span>
        <span style="color:#a898cc;font-style:italic;font-size:13px">
          "She sat through 8,000+ soft resets for shiny Lugia. Bzzt. Trainer dedication confirmed."
        </span>
      </div>
    </div>

    <!-- Socials & Support -->
    <div class="about-card">
      <div class="about-section-title cinzel">Find Us</div>
      <div class="about-links">
        <a href="https://bsky.app/profile/rotomos-app.bsky.social" target="_blank" class="about-link about-link-blue">
          <span class="about-link-icon">🦋</span>
          <div><div class="about-link-name">Bluesky</div><div class="about-link-handle">@rotomos-app.bsky.social</div></div>
        </a>
        <a href="https://x.com/rotomosapp" target="_blank" class="about-link about-link-muted">
          <span class="about-link-icon">𝕏</span>
          <div><div class="about-link-name">Twitter / X</div><div class="about-link-handle">@rotomosapp</div></div>
        </a>
        <a href="https://ko-fi.com/rotomos" target="_blank" class="about-link about-link-kofi">
          <span class="about-link-icon">☕</span>
          <div><div class="about-link-name">Ko-fi</div><div class="about-link-handle">ko-fi.com/rotomos</div></div>
        </a>
        <a href="https://rotomos-app.github.io/RotomOS/roadmap.html" target="_blank" class="about-link about-link-purple">
          <span class="about-link-icon">🗺️</span>
          <div><div class="about-link-name">Roadmap</div><div class="about-link-handle">See what's coming next</div></div>
        </a>
      </div>
    </div>

    <!-- Credits -->
    <div class="about-card">
      <div class="about-section-title cinzel">Credits & Thanks</div>
      <div class="about-credits-grid">
        <div class="about-credit">
          <div class="about-credit-name">PokéAPI</div>
          <div class="about-credit-desc">Pokémon data, moves, abilities, evolution chains</div>
          <a href="https://pokeapi.co" target="_blank" class="about-credit-link">pokeapi.co</a>
        </div>
        <div class="about-credit">
          <div class="about-credit-name">PokémonDB</div>
          <div class="about-credit-desc">Sprites used throughout the app</div>
          <a href="https://pokemondb.net" target="_blank" class="about-credit-link">pokemondb.net</a>
        </div>
        <div class="about-credit">
          <div class="about-credit-name">thefilght / Frisbee</div>
          <div class="about-credit-desc">Pokéball & HA breeding legality sheet — the most complete resource out there</div>
          <div class="about-credit-sub">Reddit / IGN</div>
        </div>
        <div class="about-credit">
          <div class="about-credit-name">Cinzel & Nunito</div>
          <div class="about-credit-desc">Fonts via Google Fonts</div>
          <a href="https://fonts.google.com" target="_blank" class="about-credit-link">fonts.google.com</a>
        </div>
        <div class="about-credit">
          <div class="about-credit-name">The Pokémon Community</div>
          <div class="about-credit-desc">For being the reason this app exists — the hunters, traders, collectors, and dex completionists who make this hobby so special 💜</div>
        </div>
      </div>
    </div>

    <!-- Version -->
    <div style="text-align:center;padding:24px 0 8px;color:#3d3570;font-size:11px;letter-spacing:.1em;text-transform:uppercase">
      RotomOS · Built with 💜 by Ash · Not affiliated with Nintendo or The Pokémon Company
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   GAME PROGRESS — FRLG
   ═══════════════════════════════════════════════════════════ */

const GP_LS       = 'at_gp_saves';
const GP_ACTIVE   = 'at_gp_active';
const BADGE_BASE  = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/';
const ROTOM_SPRITE= 'https://img.pokemondb.net/sprites/sword-shield/icon/rotom.png';


const GP_BADGE_IMG = {
  boulder: 'https://archives.bulbagarden.net/media/upload/thumb/d/dd/Boulder_Badge.png/50px-Boulder_Badge.png',
  cascade: 'https://archives.bulbagarden.net/media/upload/thumb/9/9c/Cascade_Badge.png/50px-Cascade_Badge.png',
  thunder: 'https://archives.bulbagarden.net/media/upload/thumb/a/a6/Thunder_Badge.png/50px-Thunder_Badge.png',
  rainbow: 'https://archives.bulbagarden.net/media/upload/thumb/b/b5/Rainbow_Badge.png/50px-Rainbow_Badge.png',
  soul:    'https://archives.bulbagarden.net/media/upload/thumb/7/7d/Soul_Badge.png/50px-Soul_Badge.png',
  marsh:   'https://archives.bulbagarden.net/media/upload/thumb/6/6b/Marsh_Badge.png/50px-Marsh_Badge.png',
  volcano: 'https://archives.bulbagarden.net/media/upload/thumb/1/12/Volcano_Badge.png/50px-Volcano_Badge.png',
  earth:   'https://archives.bulbagarden.net/media/upload/thumb/7/78/Earth_Badge.png/50px-Earth_Badge.png',
};

const GP_BADGES = [
  { id:'boulder',  name:'Boulder',  gym:'Brock',    type:'rock',     aceLevel:14 },
  { id:'cascade',  name:'Cascade',  gym:'Misty',    type:'water',    aceLevel:21 },
  { id:'thunder',  name:'Thunder',  gym:'Lt. Surge',type:'electric', aceLevel:28 },
  { id:'rainbow',  name:'Rainbow',  gym:'Erika',    type:'grass',    aceLevel:29 },
  { id:'soul',     name:'Soul',     gym:'Koga',     type:'poison',   aceLevel:43 },
  { id:'marsh',    name:'Marsh',    gym:'Sabrina',  type:'psychic',  aceLevel:50 },
  { id:'volcano',  name:'Volcano',  gym:'Blaine',   type:'fire',     aceLevel:54 },
  { id:'earth',    name:'Earth',    gym:'Giovanni', type:'ground',   aceLevel:50 },
];

const GP_E4 = [
  { id:'lorelei',  name:'Lorelei',  emoji:'🧊', aceLevel:54 },
  { id:'bruno',    name:'Bruno',    emoji:'🥊', aceLevel:58 },
  { id:'agatha',   name:'Agatha',   emoji:'👻', aceLevel:58 },
  { id:'lance',    name:'Lance',    emoji:'🐉', aceLevel:60 },
  { id:'blue',     name:'Blue',     emoji:'🏆', aceLevel:63 },
];

// Super-effective type matchups (attacker type → gym types it covers)
const GP_SUPER_EFFECTIVE = {
  fire:     ['grass','ice','bug','steel'],
  water:    ['fire','ground','rock'],
  electric: ['water','flying'],
  grass:    ['water','ground','rock'],
  ice:      ['grass','ground','flying','dragon'],
  fighting: ['normal','ice','rock','dark','steel'],
  poison:   ['grass','fairy'],
  ground:   ['fire','electric','poison','rock','steel'],
  flying:   ['grass','fighting','bug'],
  psychic:  ['fighting','poison'],
  bug:      ['grass','psychic','dark'],
  rock:     ['fire','ice','flying','bug'],
  ghost:    ['psychic','ghost'],
  dragon:   ['dragon'],
  dark:     ['psychic','ghost'],
  steel:    ['ice','rock','fairy'],
  fairy:    ['fighting','dragon','dark'],
  normal:   [],
};

// Kanto locations in order for the location tracker
const GP_KANTO_LOCATIONS = [
  'Pallet Town','Route 1','Viridian City','Route 2','Viridian Forest',
  'Pewter City','Route 3','Mt. Moon','Route 4','Cerulean City',
  'Route 24','Route 25','Route 5','Route 6','Vermilion City',
  'Diglett\'s Cave','Route 11','Route 12','Route 13','Route 14',
  'Route 15','Lavender Town','Route 7','Route 8','Celadon City',
  'Route 16','Route 17','Route 18','Route 9','Route 10',
  'Rock Tunnel','Pokémon Tower','Silph Co.','Saffron City',
  'Route 19','Route 20','Seafoam Islands','Route 21','Cinnabar Island',
  'Route 22','Route 23','Victory Road','Indigo Plateau',
];

/* ── Storage helpers ── */
