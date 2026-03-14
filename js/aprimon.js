const ballUrl=n=>`https://img.pokemondb.net/sprites/items/${n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}-ball.png`;
const bImg=(n,sz=22,dim=false,sel=false)=>{const bc=BALLS[n]||BALLS.Moon;return`<img src="${ballUrl(n)}" width="${sz}" height="${sz}" style="image-rendering:pixelated;display:block;flex-shrink:0;opacity:${dim?.15:1};filter:${sel?`drop-shadow(0 0 5px ${bc.accent}aa)`:dim?'grayscale(1)':'none'};transition:all .15s" onerror="this.style.display='none'"/>`;};
const spr=(sp,sh,sz=66,ac='#c084fc')=>{const src=poke(sp,sh);const glow=sh?'radial-gradient(circle,#FFD70025 0%,transparent 70%)':`radial-gradient(circle,${ac}18 0%,transparent 70%)`;const filt=sh?'drop-shadow(0 0 8px #FFD700aa)':`drop-shadow(0 2px 6px ${ac}44)`;return`<div style="position:absolute;inset:4px;border-radius:50%;filter:blur(6px);background:${glow}"></div>${src?`<img src="${src}" width="${sz}" height="${sz}" style="image-rendering:pixelated;position:relative;z-index:1;filter:${filt}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div style="width:${sz*.6}px;height:${sz*.6}px;border-radius:50%;border:2px dashed ${ac}33;display:none;align-items:center;justify-content:center;color:${ac}44;font-size:20px;position:relative;z-index:1">?</div>`:`<div style="width:${sz*.6}px;height:${sz*.6}px;border-radius:50%;border:2px dashed ${ac}33;display:flex;align-items:center;justify-content:center;color:${ac}44;font-size:20px;position:relative;z-index:1">?</div>`}${sh&&src?'<div class="shiny-star">★</div>':''}`;};
const bdg=st=>{const b=BADGE[st]||BADGE.keep;return`<span class="badge" style="background:${b.bg};border-color:${b.border};color:${b.text}">${b.label}</span>`;};
const group=arr=>{const m={};arr.forEach(x=>{const k=x.species.toLowerCase();if(!m[k])m[k]={species:x.species,variants:[]};m[k].variants.push(x);});return Object.values(m);};

function renderStats(){
  const g=group(mons);
  const d=[{l:'Species',v:g.length,c:'#c084fc'},{l:'For Trade',v:mons.filter(m=>m.tradeStatus==='available').length,c:'#93c5fd'},{l:'Shinies',v:mons.filter(m=>m.isShiny).length,c:'#fde68a'},{l:'Ball Types',v:new Set(mons.map(m=>m.ball)).size,c:'#f9a8d4'}];
  document.getElementById('statsGrid').innerHTML=d.map(s=>`<div class="stat-card"><div class="stat-val" style="color:${s.c}">${s.v}</div><div class="stat-lbl">${s.l}</div></div>`).join('');
}
function renderBallFilter(){
  document.getElementById('ballFilter').innerHTML=`<button class="btn-all ${filterBall==='all'?'active':''}" onclick="setBallFilter('all')">All</button>`
    +BALL_NAMES.map(b=>{const bc=BALLS[b],a=filterBall===b;return`<button class="ball-btn ${a?'active':''}" style="--accent:${bc.accent};--light:${bc.light}" onclick="setBallFilter('${b}')" title="${b} Ball">${bImg(b,22)}<span class="ball-lbl">${b}</span></button>`;}).join('');
}
let collectionView = localStorage.getItem('at_collection_view') || 'compact';
let collectionPage  = 0;
const PAGE_SIZE     = 50;

function setCollectionView(view) {
  collectionView = view;
  collectionPage = 0;
  localStorage.setItem('at_collection_view', view);
  document.getElementById('view-btn-compact')?.classList.toggle('active', view === 'compact');
  document.getElementById('view-btn-cards')?.classList.toggle('active', view === 'cards');
  renderList();
}

function setCollectionPage(p) {
  collectionPage = p;
  renderList();
  // Scroll list back to top
  document.getElementById('monList')?.scrollIntoView({ behavior:'smooth', block:'start' });
}

function renderList(resetPage){
  if (resetPage) collectionPage = 0;
  const search=document.getElementById('searchInput').value.toLowerCase();
  const status=document.getElementById('statusFilter').value;
  const shinyOnly=document.getElementById('shinyFilter').checked;
  const groups=group(mons);
  const filtered=groups.filter(g=>{
    if(filterBall!=='all'&&!g.variants.some(v=>v.ball===filterBall))return false;
    if(status!=='all'&&!g.variants.some(v=>v.tradeStatus===status))return false;
    if(shinyOnly&&!g.variants.some(v=>v.isShiny))return false;
    if(search&&!g.species.toLowerCase().includes(search)&&!g.variants.some(v=>v.eggMoves.some(e=>e.toLowerCase().includes(search))))return false;
    return true;
  });
  document.getElementById('resultsHint').textContent=`${filtered.length} species · ${mons.length} total entries`;
  // Apply correct view class
  const listEl = document.getElementById('monList');
  listEl.className = collectionView === 'compact' ? 'mon-list compact-list' : 'mon-list';
  // Sync toggle buttons
  document.getElementById('view-btn-compact')?.classList.toggle('active', collectionView === 'compact');
  document.getElementById('view-btn-cards')?.classList.toggle('active', collectionView === 'cards');

  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty-state">No Aprimon found.<br/><span style="font-size:12px;font-family:monospace;color:#5b4690">Add your first one above.</span></div>`;
    return;
  }

  // Pagination — reset to page 0 when filter changes total
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  if (collectionPage >= totalPages) collectionPage = 0;
  const pageSlice  = filtered.slice(collectionPage * PAGE_SIZE, (collectionPage + 1) * PAGE_SIZE);

  const rowsHTML = collectionView === 'compact'
    ? pageSlice.map(renderCompactRow).join('')
    : pageSlice.map(renderCard).join('');

  const paginationHTML = totalPages > 1 ? renderPagination(collectionPage, totalPages, filtered.length) : '';

  listEl.innerHTML = rowsHTML + paginationHTML;
}

function renderPagination(page, total, count) {
  const start = page * PAGE_SIZE + 1;
  const end   = Math.min((page + 1) * PAGE_SIZE, count);

  // Build page number buttons — show max 5 around current page
  let pages = [];
  if (total <= 7) {
    pages = Array.from({length: total}, (_, i) => i);
  } else {
    pages = [0];
    let lo = Math.max(1, page - 1);
    let hi = Math.min(total - 2, page + 1);
    if (lo > 1)        pages.push('…');
    for (let i = lo; i <= hi; i++) pages.push(i);
    if (hi < total - 2) pages.push('…');
    pages.push(total - 1);
  }

  const btns = pages.map(p => {
    if (p === '…') return `<span class="pg-ellipsis">…</span>`;
    return `<button class="pg-btn ${p === page ? 'active' : ''}" onclick="setCollectionPage(${p})">${p + 1}</button>`;
  }).join('');

  return `
  <div class="pagination-bar">
    <button class="pg-arrow" onclick="setCollectionPage(${page - 1})" ${page === 0 ? 'disabled' : ''}>‹</button>
    ${btns}
    <button class="pg-arrow" onclick="setCollectionPage(${page + 1})" ${page === total - 1 ? 'disabled' : ''}>›</button>
    <span class="pg-info">${start}–${end} of ${count}</span>
  </div>`;
}

function renderCompactRow(g) {
  const { species, variants } = g;
  const owned = BALL_NAMES.filter(b => variants.some(v => v.ball === b));
  const hasShiny = variants.some(v => v.isShiny);
  const statusDots = {
    'available':  '#86efac',
    'keep':       '#93c5fd',
    'trade-only': '#fde68a',
    'wanted':     '#fda4af',
  };
  // Show all balls this species has
  const ballIcons = owned.map(b => {
    const mon = variants.find(v => v.ball === b);
    return `<span class="cr-row-ball" title="${b} Ball${mon?.isShiny ? ' ★' : ''}">
      <img src="${ballUrl(b)}" width="18" height="18" style="image-rendering:pixelated;display:block" onerror="this.style.display='none'"/>
      ${mon?.isShiny ? '<span class="cr-row-shiny">★</span>' : ''}
    </span>`;
  }).join('');

  // Status dots for all variants
  const statuses = [...new Set(variants.map(v => v.tradeStatus))];
  const statusHTML = statuses.map(s =>
    `<span class="cr-status-dot" style="background:${statusDots[s]||'#5b4690'}" title="${s}"></span>`
  ).join('');

  // Egg moves preview — first variant's moves
  const eggMoves = variants[0]?.eggMoves?.slice(0,3) || [];
  const eggHTML = eggMoves.length
    ? `<span class="cr-row-eggs">${eggMoves.join(', ')}${variants[0].eggMoves.length > 3 ? '…' : ''}</span>`
    : '';

  return `
  <div class="compact-row" onclick="openCompactDetail('${species}')">
    <div class="cr-sprite">
      <img src="${poke(species, hasShiny)}" width="36" height="36" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
      ${hasShiny ? '<span class="cr-shiny-glow"></span>' : ''}
    </div>
    <div class="cr-info">
      <div class="cr-name ${hasShiny ? 'shiny' : ''}">${species}${hasShiny ? ' <span style="color:#fde68a;font-size:10px">★</span>' : ''}</div>
      ${eggHTML}
    </div>
    <div class="cr-balls">${ballIcons}</div>
    <div class="cr-meta">${statusHTML}<span class="cr-variant-count">${variants.length > 1 ? variants.length + ' vars' : ''}</span></div>
    <div class="cr-chevron">›</div>
  </div>`;
}

function renderCard(g){
  const {species,variants}=g;
  const owned=BALL_NAMES.filter(b=>variants.some(v=>v.ball===b));
  if(!selBalls[species]||!owned.includes(selBalls[species]))selBalls[species]=owned[0];
  const sb=selBalls[species];
  const am=variants.find(v=>v.ball===sb)||variants[0];
  const bc=BALLS[am.ball]||BALLS.Moon;
  const hasShiny=variants.some(v=>v.isShiny);
  const pills=owned.map(b=>{const bbc=BALLS[b],mon=variants.find(v=>v.ball===b),act=b===sb;return`<button class="ball-pill ${act?'active':''}" style="--bpAccent:${bbc.accent}" onclick="event.stopPropagation();selectBall('${species}','${b}')" title="${b} Ball">${bImg(b,20,false,act)}<span class="pill-name" style="color:${bbc.light}">${b}</span>${mon.isShiny?`<span style="font-size:9px;color:#FFD700">★</span>`:''}</button>`;}).join('');
  return`<div class="species-card" id="card-${species}" style="--accent:${bc.accent};background:linear-gradient(135deg,${bc.bg} 0%,#372962 70%);border-color:${bc.accent}25">
    <div class="card-header">
      <div class="sprite-wrap" onclick="openDex('${species}')"><div style="position:absolute;inset:4px;border-radius:50%;filter:blur(6px);background:${am.isShiny?'radial-gradient(circle,#FFD70025 0%,transparent 70%)':`radial-gradient(circle,${bc.accent}18 0%,transparent 70%)`}"></div>${poke(species,am.isShiny)?`<img src="${poke(species,am.isShiny)}" width="66" height="66" style="image-rendering:pixelated;position:relative;z-index:1;filter:${am.isShiny?'drop-shadow(0 0 8px #FFD700aa)':`drop-shadow(0 2px 6px ${bc.accent}44)`}" onerror="this.style.display='none'"/>`:'<div style="width:40px;height:40px;border-radius:50%;border:2px dashed '+bc.accent+'33;display:flex;align-items:center;justify-content:center;color:'+bc.accent+'44;font-size:20px">?</div>'}${am.isShiny?'<div class="shiny-star">★</div>':''}<div class="dex-hint">VIEW DEX</div></div>
      <div class="card-info">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="card-name" style="color:${hasShiny?'#FFD700':'#ede8de'};${hasShiny?'text-shadow:0 0 14px #FFD70044':''}">${species}</span>${hasShiny?`<span style="font-size:11px;color:#FFD700;filter:drop-shadow(0 0 3px #FFD700)">★ Shiny</span>`:''}<span style="color:#7c6fa0;font-size:11px">${variants.length} variant${variants.length>1?'s':''}</span></div>
        <div class="ball-switcher">${pills}</div>
      </div>
      <div class="expand-arrow" onclick="toggleCard('${species}')">▼</div>
    </div>
    <div class="card-body" id="body-${species}" style="display:none;border-top:1px solid ${bc.accent}12;background:linear-gradient(180deg,${bc.bg}55 0%,#2b1f4e 100%)">
      ${renderTabs(species,variants,owned,sb,bc)}
      ${renderDetail(am,bc)}
    </div>
  </div>`;
}

function renderTabs(species,variants,owned,sb,bc){
  if(variants.length<=1)return'';
  return`<div class="variant-tabs" style="border-bottom-color:${bc.accent}12">${owned.map(b=>{const bbc=BALLS[b],mon=variants.find(v=>v.ball===b),act=b===sb;return`<button class="variant-tab ${act?'active':''}" style="--ta:${bbc.accent};--tl:${bbc.light}" onclick="selectBall('${species}','${b}')">${bImg(b,16,false,act)} ${b}${mon.isShiny?` <span style="color:#FFD700;font-size:10px">★</span>`:''}</button>`;}).join('')}</div>`;
}

function renderDetail(mon,bc){
  const em=mon.eggMoves.length?`<div><div class="section-label">Egg Moves</div><div class="tag-row">${mon.eggMoves.map(m=>`<span class="tag" style="background:#231d45;border-color:${bc.accent}25;color:${bc.light}">${m}</span>`).join('')}</div></div>`:'';
  const nt=mon.notes?`<div><div class="section-label">Notes</div><div class="notes-text" style="border-left-color:${bc.accent}33">${mon.notes}</div></div>`:'';
  const wl=mon.wantList.length?`<div><div class="section-label">Looking For</div><div class="tag-row">${mon.wantList.map(w=>`<span class="tag" style="background:#2d1f3a;border-color:#fdba7420;color:#fdba74">⇄ ${w}</span>`).join('')}</div></div>`:'';
  return`<div style="display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${bdg(mon.tradeStatus)}<span style="color:#8b80b8;font-size:11px">${mon.nature} · ${mon.ivSpread} · ${mon.gender}</span>${mon.quantity>1?`<span style="background:#2a2350;color:#9d93c0;font-size:11px;padding:1px 6px;border-radius:3px">×${mon.quantity}</span>`:''}</div>
    <div style="color:#7c6fa0;font-size:11px">${mon.game}</div>
    ${em}${nt}${wl}
    <div class="card-actions">
      <button class="btn-edit" style="border-color:${bc.accent}30;color:${bc.light}" onclick="openEditModal(${mon.id})">✎ Edit</button>
      <button class="btn btn-danger" onclick="deleteMon(${mon.id})">✕ Remove</button>
      <button class="btn-dex-link" onclick="openDex('${mon.species}')">📖 Dex Entry</button>
    </div>
  </div>`;
}

function toggleCard(species){
  const body=document.getElementById(`body-${species}`);
  const card=document.getElementById(`card-${species}`);
  const arrow=card.querySelector('.expand-arrow');
  const open=body.style.display!=='none';
  body.style.display=open?'none':'flex';
  if(!open)body.style.flexDirection='column';
  card.classList.toggle('open',!open);
  arrow.textContent=open?'▼':'▲';
}

function selectBall(species,ball){
  selBalls[species]=ball;
  const g=group(mons).find(x=>x.species.toLowerCase()===species.toLowerCase());
  if(!g)return;
  const old=document.getElementById(`card-${species}`);
  const wasOpen=old&&old.classList.contains('open');
  const tmp=document.createElement('div');
  tmp.innerHTML=renderCard(g);
  old.replaceWith(tmp.firstChild);
  if(wasOpen){
    const body=document.getElementById(`body-${species}`);
    body.style.display='flex';body.style.flexDirection='column';
    const card=document.getElementById(`card-${species}`);
    card.classList.add('open');
    card.querySelector('.expand-arrow').textContent='▲';
  }
}

function setBallFilter(b){filterBall=filterBall===b?'all':b;renderBallFilter();renderList();}
function deleteMon(id){mons=mons.filter(m=>m.id!==id);lsSet(LS.M,mons);renderStats();renderList();updateWantsBadge();}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openAddModal(){
  editingId=null;formEggMoves=[];formWantList=[];
  setTimeout(() => initSpeciesAC('fSpecies', (name) => {
    const prev = document.getElementById('previewSprite');
    if (prev) { prev.src = `https://img.pokemondb.net/sprites/home/normal/${name}.png`; prev.style.display='block'; }
  }), 50);
  document.getElementById('modalTitle').textContent='Add Aprimon';
  document.getElementById('btnSave').textContent='Add to Collection';
  ['fSpecies','fNotes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('fBall').value='Moon';document.getElementById('fNature').value='Jolly';
  document.getElementById('fIVs').value='5IV -SpAtk';document.getElementById('fGender').value='Male';
  document.getElementById('fQty').value='1';document.getElementById('fGame').value='Sword/Shield';
  document.getElementById('fStatus').value='available';document.getElementById('fShiny').checked=false;
  renderFormTags();updateModalPreview();document.getElementById('addModal').style.display='flex';
}
function openEditModal(id){
  const m=mons.find(x=>x.id===id);if(!m)return;
  editingId=id;formEggMoves=[...m.eggMoves];formWantList=[...m.wantList];
  document.getElementById('modalTitle').textContent='Edit Aprimon';
  document.getElementById('btnSave').textContent='Save Changes';
  document.getElementById('fSpecies').value=m.species;document.getElementById('fBall').value=m.ball;
  document.getElementById('fNature').value=m.nature;document.getElementById('fIVs').value=m.ivSpread;
  document.getElementById('fGender').value=m.gender;document.getElementById('fQty').value=m.quantity;
  document.getElementById('fGame').value=m.game;document.getElementById('fStatus').value=m.tradeStatus;
  document.getElementById('fShiny').checked=m.isShiny;document.getElementById('fNotes').value=m.notes;
  renderFormTags();updateModalPreview();document.getElementById('addModal').style.display='flex';
}
function closeAddModal(){document.getElementById('addModal').style.display='none';}

function updateModalPreview(){
  const sp=document.getElementById('fSpecies').value;
  const sh=document.getElementById('fShiny').checked;
  const ball=document.getElementById('fBall').value;
  const bc=BALLS[ball]||BALLS.Moon;
  const inner=document.getElementById('addModalInner');
  inner.style.borderTopColor=bc.accent;inner.style.borderColor=bc.accent+'28';
  document.getElementById('modalSubtitle').textContent=`${ball} Ball${sh?' · ★ Shiny':''}`;
  document.getElementById('modalSubtitle').style.color=bc.light;
  document.getElementById('btnSave').style.cssText=`background:linear-gradient(135deg,${bc.bg},#1a1535);border:1px solid ${bc.accent}44;color:${bc.light};flex:1;padding:11px;border-radius:6px;cursor:pointer;font-family:'Cinzel',serif;font-size:14px;font-weight:700`;
  document.getElementById('previewBallImg').innerHTML=bImg(ball,40);
  const wrap=document.getElementById('previewSpriteWrap');
  wrap.style.borderColor=bc.accent+'20';wrap.style.background=bc.accent+'0a';
  const img=document.getElementById('previewSprite');
  const fb=document.getElementById('previewFallback');
  if(sp.trim().length>1){img.src=poke(sp,sh);img.style.display='block';img.onerror=()=>{img.style.display='none';fb.style.display='block';};img.onload=()=>{fb.style.display='none';};fb.style.display='none';}
  else{img.style.display='none';fb.style.display='block';}
}
function renderFormTags(){
  const bc=BALLS[document.getElementById('fBall')?.value||'Moon']||BALLS.Moon;
  document.getElementById('eggCount').textContent=formEggMoves.length;
  document.getElementById('eggTags').innerHTML=formEggMoves.map((m,i)=>`<span class="tag" style="background:#231d45;border-color:${bc.accent}25;color:${bc.light};cursor:pointer" onclick="removeEgg(${i})">${m} ✕</span>`).join('');
  document.getElementById('wantTags').innerHTML=formWantList.map((w,i)=>`<span class="tag" style="background:#2d1f3a;border-color:#fdba7420;color:#fdba74;cursor:pointer" onclick="removeWant(${i})">${w} ✕</span>`).join('');
}
function addEggMove(){const i=document.getElementById('eggInput');if(i.value.trim()&&formEggMoves.length<4){formEggMoves.push(i.value.trim());i.value='';renderFormTags();}}
function removeEgg(i){formEggMoves.splice(i,1);renderFormTags();}
function addWant(){const i=document.getElementById('wantInput');if(i.value.trim()){formWantList.push(i.value.trim());i.value='';renderFormTags();}}
function removeWant(i){formWantList.splice(i,1);renderFormTags();}
function saveMon(){
  const species=document.getElementById('fSpecies').value.trim();
  if(!species){alert('Species name is required');return;}
  const ball=document.getElementById('fBall').value;

  // Ball legality check
  const warning = getLegalityWarning(species, ball);
  if (warning) {
    const proceed = confirm(warning + '\n\nLog it anyway?');
    if (!proceed) return;
  }

  const mon={id:editingId||nextId++,species,ball,nature:document.getElementById('fNature').value,ivSpread:document.getElementById('fIVs').value.trim(),gender:document.getElementById('fGender').value,quantity:parseInt(document.getElementById('fQty').value)||1,game:document.getElementById('fGame').value,tradeStatus:document.getElementById('fStatus').value,isShiny:document.getElementById('fShiny').checked,notes:document.getElementById('fNotes').value.trim(),eggMoves:[...formEggMoves],wantList:[...formWantList]};
  if(editingId){mons=mons.map(m=>m.id===editingId?mon:m);}else{mons.push(mon);lsSet(LS.N,nextId);}
  lsSet(LS.M,mons);closeAddModal();renderStats();renderBallFilter();renderList();updateWantsBadge();if(currentTab==='wants')renderWants();
}

// ── Dex ───────────────────────────────────────────────────────────────────────
let prevSection = 'home';
let prevApriTab = 'collection';

// ══ DEX PAGE — PokéAPI integration ══════════════════════════════════════════

// Forms to exclude from evolution chain display (battle/temporary/variant forms)
const EVO_SKIP_SUFFIXES = [
  '-mega','-mega-x','-mega-y','-primal',
  '-crowned','-eternal','-ultra',
  '-hangry','-own-tempo',
  '-origin','-origin-paldea',
  '-zen','-zen-galar',
  '-dusk-mane','-dawn-wings',
  '-ash','-battle-bond','-power-construct',
  '-low-key','-amped',
  '-school','-busted',
  '-totem',
  '-50','-10','-10-percent',
  '-single-strike','-rapid-strike',
  '-ice-rider','-shadow-rider',
  '-white-striped',
];

// Legendary & mythical species — can't breed, don't show in egg move chains
const LEGENDARY_SPECIES = new Set([
  'articuno','zapdos','moltres','mewtwo','mew',
  'raikou','entei','suicune','lugia','ho-oh','celebi',
  'regirock','regice','registeel','latias','latios',
  'kyogre','groudon','rayquaza','jirachi','deoxys',
  'uxie','mesprit','azelf','dialga','palkia','heatran',
  'regigigas','giratina','cresselia','phione','manaphy',
  'darkrai','shaymin','arceus',
  'victini','cobalion','terrakion','virizion',
  'tornadus','thundurus','reshiram','zekrom','landorus','kyurem',
  'keldeo','meloetta','genesect',
  'xerneas','yveltal','zygarde','diancie','hoopa','volcanion',
  'type-null','silvally',
  'tapu-koko','tapu-lele','tapu-bulu','tapu-fini',
  'cosmog','cosmoem','solgaleo','lunala',
  'nihilego','buzzwole','pheromosa','xurkitree','celesteela',
  'kartana','guzzlord','necrozma','magearna','marshadow',
  'poipole','naganadel','stakataka','blacephalon','zeraora',
  'meltan','melmetal',
  'zacian','zamazenta','eternatus','kubfu','urshifu',
  'zarude','regieleki','regidrago','glastrier','spectrier','calyrex',
  'enamorus',
  'wo-chien','chien-pao','ting-lu','chi-yu',
  'koraidon','miraidon','walking-wake','iron-leaves',
  'gouging-fire','raging-bolt','iron-boulder','iron-crown',
  'terapagos','pecharunt','ogerpon','okidogi','munkidori','fezandipiti',
]);

const REGIONAL_SUFFIXES = ['-alola','-galar','-hisui','-paldea'];

function shouldSkipEvoEntry(name) {
  // Always keep regional forms — separate breedable variants
  if (REGIONAL_SUFFIXES.some(s => name.endsWith(s))) return false;
  // Skip legendaries and mythicals
  if (LEGENDARY_SPECIES.has(name)) return true;
  // Skip battle/alternate/mega forms
  if (EVO_SKIP_SUFFIXES.some(s => name.endsWith(s))) return true;
  return false;
}

const TYPE_COLORS = {
  normal:'#A8A878',fire:'#F08030',water:'#6890F0',electric:'#F8D030',
  grass:'#78C850',ice:'#98D8D8',fighting:'#C03028',poison:'#A040A0',
  ground:'#E0C068',flying:'#A890F0',psychic:'#F85888',bug:'#A8B820',
  rock:'#B8A038',ghost:'#705898',dragon:'#7038F8',dark:'#705848',
  steel:'#B8B8D0',fairy:'#EE99AC',stellar:'#40B5A5'
};

const STAT_NAMES = {
  hp:'HP', attack:'Atk', defense:'Def',
  'special-attack':'Sp.Atk', 'special-defense':'Sp.Def', speed:'Spd'
};

const STAT_COLORS = {
  hp:'#FF5959', attack:'#F5AC78', defense:'#FAE078',
  'special-attack':'#9DB7F5', 'special-defense':'#A7DB8D', speed:'#FA92B2'
};

// In-memory cache so we don't re-fetch on every tab switch
function openReddit(){
  const av=mons.filter(m=>m.tradeStatus==='available'||m.tradeStatus==='trade-only');
  const wantedMons=mons.filter(m=>m.tradeStatus==='wanted');
  const wantTags=[...new Set(mons.flatMap(m=>m.wantList))];
  const haveLines=av.length
    ? av.map(m=>`- ${m.isShiny?'★ ':''}**${m.species}** | ${m.ball} Ball | ${m.nature} | ${m.ivSpread}${m.eggMoves.length?` | EMs: ${m.eggMoves.join(', ')}`:''}${m.notes?` | *${m.notes}*`:''}`).join('\n')
    : '- (nothing listed for trade yet)';
  const wantLines=[];
  wantedMons.forEach(m=>wantLines.push(`- **${m.species}** | ${m.ball} Ball${m.nature?' | '+m.nature:''}${m.ivSpread?' | '+m.ivSpread:''}${m.eggMoves.length?' | EMs: '+m.eggMoves.join(', '):''}${m.notes?' | *'+m.notes+'*':''}`));
  wantTags.forEach(w=>{if(!wantLines.some(l=>l.includes(w)))wantLines.push(`- ${w}`);});
  if(!wantLines.length)wantLines.push('- Open to offers! IGLFs');
  document.getElementById('redditText').value=`**✨ Aprimon Have/Want List**\n\n**HAVE (all breedable unless noted):**\n${haveLines}\n\n**WANT:**\n${wantLines.join('\n')}\n\n*Generated with RotomOS ⚡*`;
  document.getElementById('redditModal').style.display='flex';
}
function closeReddit(){document.getElementById('redditModal').style.display='none';}
function copyReddit(){
  navigator.clipboard?.writeText(document.getElementById('redditText').value);
  const btn=document.getElementById('copyBtn');btn.textContent='✓ Copied!';btn.style.background='linear-gradient(135deg,#2d1f5e,#2a2255)';btn.style.color='#c084fc';
  setTimeout(()=>{btn.textContent='📋 Copy to Clipboard';btn.style.background='linear-gradient(135deg,#2d1f5e,#1e1550)';btn.style.color='#e9d5ff';},2000);
}

// ── Clear ─────────────────────────────────────────────────────────────────────
function confirmClear(){document.getElementById('clearBtn').style.display='none';document.getElementById('clearConfirm').style.display='flex';}
function cancelClear(){document.getElementById('clearConfirm').style.display='none';document.getElementById('clearBtn').style.display='inline-flex';}
function clearAll(){[LS.M,LS.D,LS.N].forEach(k=>localStorage.removeItem(k));mons=[];dexData={};nextId=100;cancelClear();goSection('home');updateWantsBadge();}

// ── Nav tabs ─────────────────────────────────────────────────────────────────

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
  const tabEl = document.getElementById('tab-' + tab);
  if (tabEl) tabEl.classList.add('active');
  document.getElementById('collection-page').style.display = tab === 'collection' ? 'block' : 'none';
  document.getElementById('wants-page').style.display      = tab === 'wants'      ? 'block' : 'none';
  const sp = document.getElementById('shiny-page');
  if (sp) sp.style.display = tab === 'shiny' ? 'block' : 'none';
  const btn = document.getElementById('headerActionBtn');
  btn.textContent = tab === 'wants' ? '+ Add Wanted' : tab === 'shiny' ? '✨ Log Shiny' : '+ Add Aprimon';
  if (tab === 'wants') renderWants();
  if (tab === 'shiny') { renderHuntStats(); renderHunts(); }
}

function headerAction() {
  if (currentTab === 'shiny') { openQuickLogModal(); return; }
  openAddModal();
  if (currentTab === 'wants') {
    setTimeout(() => { document.getElementById('fStatus').value = 'wanted'; }, 0);
  }
}

function renderWants() {
  const wanted = mons.filter(m => m.tradeStatus === 'wanted');
  const el = document.getElementById('wantsList');
  if (!wanted.length) {
    el.innerHTML = '<div class="empty-state">No wanted mons yet.<br/><span style="font-size:12px;font-family:monospace;color:#5b4690">Add mons with ✦ Wanted status.</span></div>';
    return;
  }
  el.innerHTML = wanted.map(m => {
    const bc = BALLS[m.ball] || BALLS.Moon;
    const src = poke(m.species, false);
    return `<div class="wants-card">
      <div class="sprite-wrap" onclick="openDex('${m.species}')" style="width:54px;height:54px">
        <div style="position:absolute;inset:2px;border-radius:50%;filter:blur(6px);background:radial-gradient(circle,#fda4af22,transparent)"></div>
        ${src ? `<img src="${src}" width="54" height="54" style="image-rendering:pixelated;position:relative;z-index:1;transition:transform .2s" onerror="this.style.display='none'"/>` : `<div style="width:32px;height:32px;border-radius:50%;border:2px dashed #fda4af33;display:flex;align-items:center;justify-content:center;color:#fda4af44;font-size:16px">?</div>`}
        <div class="dex-hint">VIEW DEX</div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px">
          <span class="cinzel" style="color:#ede9ff;font-size:15px;font-weight:700">${m.species}</span>
          ${bImg(m.ball, 20)}
          <span style="color:${bc.light};font-size:11px;font-weight:700">${m.ball} Ball</span>
        </div>
        <div style="color:#a898cc;font-size:12px">${m.nature} · ${m.ivSpread}${m.eggMoves.length ? ' · EMs: ' + m.eggMoves.join(', ') : ''}</div>
        ${m.notes ? `<div style="color:#7060a8;font-size:11px;font-style:italic;margin-top:3px">${m.notes}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
        <button class="btn-edit" style="border-color:#fda4af30;color:#fda4af" onclick="openEditModal(${m.id})">✎ Edit</button>
        <button class="btn-dex-link" onclick="openDex('${m.species}')">📖 Dex</button>
        <button class="btn btn-danger" onclick="deleteMon(${m.id});renderWants()">✕</button>
      </div>
    </div>`;
  }).join('');
}

// updateWantsBadge defined in nav section


