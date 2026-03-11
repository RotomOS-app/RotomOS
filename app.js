const BALLS={Friend:{accent:"#4CAF50",light:"#81C784",bg:"#3a2e6e"},Love:{accent:"#E91E8B",light:"#F48FB1",bg:"#2e1a24"},Lure:{accent:"#00BCD4",light:"#80DEEA",bg:"#1a2630"},Moon:{accent:"#7986CB",light:"#9FA8DA",bg:"#1a1c2e"},Dream:{accent:"#CE93D8",light:"#E1BEE7",bg:"#221a2e"},Beast:{accent:"#FF9800",light:"#FFCC80",bg:"#2e1f0a"},Fast:{accent:"#C6D82A",light:"#E6EE9C",bg:"#2a2060"},Heavy:{accent:"#90A4AE",light:"#B0BEC5",bg:"#1a1f22"},Level:{accent:"#FF5722",light:"#FFAB91",bg:"#3d1a40"},Safari:{accent:"#8BC34A",light:"#C5E1A5",bg:"#2a1f5a"},Sport:{accent:"#FFC107",light:"#FFE082",bg:"#2a2510"}};
const BALL_NAMES=Object.keys(BALLS);
const BADGE={available:{bg:"#1f2d5e",border:"#a78bfa",text:"#c084fc",label:"✓ Available"},keep:{bg:"#1f2d5e",border:"#a78bfa",text:"#e9d5ff",label:"♦ Keeping"},"trade-only":{bg:"#3d2040",border:"#fdba74",text:"#fdba74",label:"⇄ Trade Only"},wanted:{bg:"#3d1530",border:"#f47284",text:"#fca5a5",label:"✦ Wanted"}};
const GAMES=["Sword/Shield","Brilliant Diamond/Shining Pearl","Scarlet/Violet","Legends: Arceus","HOME"];
const EGG_METHODS=["Masuda Method","SOS Chaining","Poké Radar","Soft Reset","Random Encounter","Egg","Static","Outbreak","Dynamax Adventure","Other"];
const LS={M:'at_mons',D:'at_dex',N:'at_nid'};
const lsGet=(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};

const SAMPLE_MONS=[
  {id:1,species:"Bagon",ball:"Moon",nature:"Jolly",ivSpread:"5IV -SpAtk",eggMoves:["Dragon Dance","Dragon Rush","Hydro Pump"],gender:"Male",game:"Sword/Shield",tradeStatus:"available",notes:"HA Sheer Force, competitive ready",isShiny:false,quantity:3,wantList:["Gible in Love Ball"]},
  {id:2,species:"Bagon",ball:"Love",nature:"Jolly",ivSpread:"5IV -SpAtk",eggMoves:["Dragon Dance","Hydro Pump"],gender:"Female",game:"Sword/Shield",tradeStatus:"keep",notes:"Breedable female parent",isShiny:false,quantity:1,wantList:[]},
  {id:3,species:"Bagon",ball:"Beast",nature:"Adamant",ivSpread:"6IV",eggMoves:["Dragon Dance","Iron Defense"],gender:"Male",game:"Scarlet/Violet",tradeStatus:"trade-only",notes:"SV transfer, rare combo",isShiny:true,quantity:1,wantList:["Deino in Beast Ball"]},
  {id:4,species:"Larvitar",ball:"Friend",nature:"Adamant",ivSpread:"6IV",eggMoves:["Stealth Rock","Outrage","Iron Head","Dragon Dance"],gender:"Female",game:"Sword/Shield",tradeStatus:"keep",notes:"Parent only, not for trade",isShiny:false,quantity:1,wantList:[]},
  {id:5,species:"Ralts",ball:"Dream",nature:"Timid",ivSpread:"5IV -Atk",eggMoves:["Destiny Bond","Encore","Shadow Sneak"],gender:"Female",game:"Brilliant Diamond/Shining Pearl",tradeStatus:"available",notes:"HA Telepathy",isShiny:true,quantity:2,wantList:["Munchlax in Heavy Ball"]},
  {id:6,species:"Ralts",ball:"Moon",nature:"Timid",ivSpread:"5IV -Atk",eggMoves:["Destiny Bond","Encore"],gender:"Male",game:"Sword/Shield",tradeStatus:"available",notes:"Gallade line",isShiny:false,quantity:2,wantList:[]},
  {id:7,species:"Phantump",ball:"Safari",nature:"Careful",ivSpread:"5IV -SpAtk",eggMoves:["Disable","Bestow"],gender:"Male",game:"Sword/Shield",tradeStatus:"trade-only",notes:"Rare find",isShiny:false,quantity:1,wantList:["Applin in Love Ball"]},
];
const SAMPLE_DEX={
  Ralts:{caught:true,shinyFound:true,encounters:[{id:1,date:"2024-03-12",method:"Masuda Method",game:"Brilliant Diamond/Shining Pearl",notes:"After 847 eggs. Named her Luna.",isShiny:true},{id:2,date:"2023-11-04",method:"Random Encounter",game:"Sword/Shield",notes:"First wild catch.",isShiny:false}]},
  Bagon:{caught:true,shinyFound:true,encounters:[{id:3,date:"2024-01-20",method:"Masuda Method",game:"Scarlet/Violet",notes:"312 eggs for the Beast Ball shiny!",isShiny:true}]},
};

let mons=lsGet(LS.M,SAMPLE_MONS);
let dexData=lsGet(LS.D,SAMPLE_DEX);
let nextId=lsGet(LS.N,100);
let filterBall='all';
let editingId=null;
let formEggMoves=[];
let formWantList=[];
let selBalls={};
let currentDex=null;

const poke=(n,s)=>{if(!n?.trim())return'';const x=n.toLowerCase().trim().replace(/\s+/g,'-').replace(/[.']/g,'').replace(/♀/g,'-f').replace(/♂/g,'-m');return s?`https://img.pokemondb.net/sprites/home/shiny/${x}.png`:`https://img.pokemondb.net/sprites/home/normal/${x}.png`;};
const ballUrl=n=>`https://img.pokemondb.net/sprites/items/${n.toLowerCase()}-ball.png`;
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
function renderList(){
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
  document.getElementById('resultsHint').textContent=`${filtered.length} species · ${mons.length} total entries · click sprite to view dex`;
  document.getElementById('monList').innerHTML=filtered.length?filtered.map(renderCard).join(''):`<div class="empty-state">No Aprimon found.<br/><span style="font-size:12px;font-family:monospace;color:#5b4690">Add your first one above.</span></div>`;
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
  const mon={id:editingId||nextId++,species,ball:document.getElementById('fBall').value,nature:document.getElementById('fNature').value,ivSpread:document.getElementById('fIVs').value.trim(),gender:document.getElementById('fGender').value,quantity:parseInt(document.getElementById('fQty').value)||1,game:document.getElementById('fGame').value,tradeStatus:document.getElementById('fStatus').value,isShiny:document.getElementById('fShiny').checked,notes:document.getElementById('fNotes').value.trim(),eggMoves:[...formEggMoves],wantList:[...formWantList]};
  if(editingId){mons=mons.map(m=>m.id===editingId?mon:m);}else{mons.push(mon);lsSet(LS.N,nextId);}
  lsSet(LS.M,mons);closeAddModal();renderStats();renderBallFilter();renderList();updateWantsBadge();if(currentTab==='wants')renderWants();
}

// ── Dex ───────────────────────────────────────────────────────────────────────
let prevSection = 'home';
let prevApriTab = 'collection';

// ══ DEX PAGE — PokéAPI integration ══════════════════════════════════════════

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
const pokeCache = {};

let currentDexSpecies = null;
let currentDexTab     = 'overview';
let currentMoveFilter = 'level-up';

async function fetchPokeData(species) {
  const key = species.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/\s+/g,'-');
  if (pokeCache[key]) return pokeCache[key];

  const [poke, spec] = await Promise.all([
    fetch(`https://pokeapi.co/api/v2/pokemon/${key}`).then(r => r.ok ? r.json() : null).catch(()=>null),
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${key}`).then(r => r.ok ? r.json() : null).catch(()=>null),
  ]);

  let evo = null;
  if (spec?.evolution_chain?.url) {
    evo = await fetch(spec.evolution_chain.url).then(r => r.ok ? r.json() : null).catch(()=>null);
  }

  const data = { poke, spec, evo };
  pokeCache[key] = data;
  return data;
}

function openDex(species) {
  currentDexSpecies = species;
  currentDexTab = 'overview';
  document.getElementById('dex-page').classList.add('visible');
  document.getElementById('dexTitle').textContent = species;
  document.getElementById('dexNumber').textContent = '';
  document.getElementById('dexTypes').innerHTML = '';
  document.getElementById('dexGenus').textContent = '';
  document.getElementById('dexCaughtBadges').innerHTML = '';

  // Reset tabs
  ['overview','moves','evolution','mydata'].forEach(t => {
    const btn  = document.getElementById('dtab-' + t);
    const pane = document.getElementById('dpane-' + t);
    if (btn)  btn.classList.toggle('active', t === 'overview');
    if (pane) pane.style.display = t === 'overview' ? 'block' : 'none';
  });

  // Show loading state in overview
  document.getElementById('dpane-overview').innerHTML = `
    <div class="dex-loading">
      <div class="dex-loading-spinner"></div>
      <div>Loading Pokédex data…</div>
    </div>`;

  loadDexPage(species);
}

function closeDex() {
  document.getElementById('dex-page').classList.remove('visible');
  currentDexSpecies = null;
}

function dexTab(tab) {
  currentDexTab = tab;
  ['overview','moves','evolution','mydata'].forEach(t => {
    const btn  = document.getElementById('dtab-' + t);
    const pane = document.getElementById('dpane-' + t);
    if (btn)  btn.classList.toggle('active', t === tab);
    if (pane) pane.style.display = t === tab ? 'block' : 'none';
  });
  if (tab === 'mydata') renderMyData(currentDexSpecies);
}

async function loadDexPage(species) {
  const { poke, spec, evo } = await fetchPokeData(species);

  // Update header
  if (poke) {
    const num = String(spec?.id || poke.id).padStart(4, '0');
    document.getElementById('dexNumber').textContent = '#' + num;
    document.getElementById('dexTypes').innerHTML = poke.types
      .map(t => {
        const c = TYPE_COLORS[t.type.name] || '#888';
        return `<span class="type-badge" style="background:${c}22;color:${c};border:1px solid ${c}44">${t.type.name}</span>`;
      }).join('');
  }
  if (spec) {
    const genus = spec.genera?.find(g => g.language.name === 'en')?.genus || '';
    document.getElementById('dexGenus').textContent = genus;
  }

  // Caught status badges in header
  const entry = dexData[species] || {};
  document.getElementById('dexCaughtBadges').innerHTML = `
    ${entry.caught     ? '<span style="background:#86efac22;border:1px solid #86efac44;color:#86efac;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px">✓ Caught</span>' : ''}
    ${entry.shinyFound ? '<span style="background:#fde68a22;border:1px solid #fde68a44;color:#fde68a;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px">★ Shiny</span>' : ''}
  `;

  renderOverviewTab(species, poke, spec);
  renderMovesTab(species, poke);
  renderEvolutionTab(species, poke, spec, evo);
  // mydata rendered on demand when tab clicked
}

// ── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function renderOverviewTab(species, poke, spec) {
  const entry = dexData[species] || { caught:false, shinyFound:false, encounters:[] };

  // Pick flavor text — prefer recent English game
  const flavorTexts = spec?.flavor_text_entries
    ?.filter(f => f.language.name === 'en')
    ?.slice(-6) || [];
  const flavorHTML = flavorTexts.length
    ? [...new Map(flavorTexts.map(f => [f.version.name, f])).values()]
        .slice(-3)
        .reverse()
        .map(f => `
          <div class="flavor-box">
            <div class="flavor-game">${f.version.name.replace(/-/g,' ')}</div>
            ${f.flavor_text.replace(/\f|\n/g,' ')}
          </div>`).join('')
    : '<div class="flavor-box" style="color:#5b4690">No Pokédex entries available.</div>';

  // Stats
  const statsHTML = poke?.stats.map(s => {
    const pct = Math.round(s.base_stat / 255 * 100);
    const col = STAT_COLORS[s.stat.name] || '#c4b5fd';
    const name = STAT_NAMES[s.stat.name] || s.stat.name;
    return `
      <div class="stat-row-bar">
        <div class="stat-name">${name}</div>
        <div class="stat-num" style="color:${col}">${s.base_stat}</div>
        <div class="stat-track">
          <div class="stat-fill" style="width:${pct}%;background:${col}"></div>
        </div>
      </div>`;
  }).join('') || '<div style="color:#5b4690">No stat data.</div>';

  const bst = poke?.stats.reduce((a,s) => a + s.base_stat, 0) || 0;

  // Abilities
  const abilitiesHTML = poke?.abilities.map(a => {
    const name = a.ability.name.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ');
    return `<span class="ability-pill ${a.is_hidden ? 'hidden' : ''}">${a.is_hidden ? '🌟 ' : ''}${name}</span>`;
  }).join(' ') || '';

  // Info chips
  const height = poke ? (poke.height / 10).toFixed(1) + 'm' : '?';
  const weight = poke ? (poke.weight / 10).toFixed(1) + 'kg' : '?';
  const genderRate = spec?.gender_rate;
  let genderHTML = '—';
  if (genderRate === -1) genderHTML = 'Genderless';
  else if (genderRate !== undefined) {
    const femPct = Math.round(genderRate / 8 * 100);
    genderHTML = `♂ ${100-femPct}% · ♀ ${femPct}%`;
  }
  const captureRate = spec?.capture_rate ?? '?';
  const baseHappy   = spec?.base_happiness ?? '?';
  const eggGroups   = spec?.egg_groups?.map(e => e.name.replace('-',' ')).join(', ') || '?';
  const growthRate  = spec?.growth_rate?.name?.replace(/-/g,' ') || '?';
  const habitat     = spec?.habitat?.name?.replace(/-/g,' ') || '?';

  // Gender differences note
  const hasGenderDiff = spec?.has_gender_differences;
  const genderDiffHTML = hasGenderDiff
    ? `<div class="gender-diff-box">♀♂ This Pokémon has visible gender differences in its appearance.</div>`
    : '';

  // Catch status toggles
  const catchHTML = `
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
      <div class="caught-toggle" style="background:${entry.caught?'#2d1f5e':'#231d45'};border-color:${entry.caught?'#d4a8ff44':'#5b4690'};flex:1;min-width:140px" onclick="toggleCaught('${species}','caught');loadDexPage('${species}')">
        <div class="caught-dot" style="background:${entry.caught?'#a78bfa':'#3d3570'};color:${entry.caught?'#000':'#5a5190'}">${entry.caught?'✓':'○'}</div>
        <div><div class="cinzel" style="color:${entry.caught?'#c084fc':'#8b80b8'};font-size:13px;font-weight:700">Caught</div><div style="color:#7c6fa0;font-size:10px">Normal form</div></div>
      </div>
      <div class="caught-toggle" style="background:${entry.shinyFound?'#2d2518':'#2f2358'};border-color:${entry.shinyFound?'#fde68a44':'#5b4690'};flex:1;min-width:140px" onclick="toggleCaught('${species}','shinyFound');loadDexPage('${species}')">
        <div class="caught-dot" style="background:${entry.shinyFound?'#FFD700':'#3d3570'};color:${entry.shinyFound?'#000':'#5a5190'}">${entry.shinyFound?'★':'☆'}</div>
        <div><div class="cinzel" style="color:${entry.shinyFound?'#FFD700':'#8b80b8'};font-size:13px;font-weight:700">Shiny</div><div style="color:#7c6fa0;font-size:10px">Shiny form</div></div>
      </div>
    </div>`;

  document.getElementById('dpane-overview').innerHTML = `
    <!-- Sprites hero -->
    <div style="display:flex;align-items:center;justify-content:center;gap:24px;background:linear-gradient(135deg,#231a3e,#1e1535);border-radius:20px;padding:24px;margin-bottom:20px;border:1px solid #5b469022" class="dex-sprite-showcase">
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <div style="position:relative">${spr(species,false,96,'#c084fc')}</div>
        <div style="font-size:9px;color:#5b4690;font-weight:700;text-transform:uppercase;letter-spacing:.1em">Normal</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <div style="position:relative">${spr(species,true,96,'#FFD700')}</div>
        <div style="font-size:9px;color:#fde68a55;font-weight:700;text-transform:uppercase;letter-spacing:.1em">✦ Shiny</div>
      </div>
    </div>

    ${genderDiffHTML}
    ${catchHTML}

    <!-- Info chips -->
    <div class="info-chips">
      <div class="info-chip">Height <span>${height}</span></div>
      <div class="info-chip">Weight <span>${weight}</span></div>
      <div class="info-chip">Gender <span>${genderHTML}</span></div>
      <div class="info-chip">Catch Rate <span>${captureRate}</span></div>
      <div class="info-chip">Base Happiness <span>${baseHappy}</span></div>
      <div class="info-chip">Egg Groups <span>${eggGroups}</span></div>
    </div>

    <!-- Abilities -->
    <div class="dex-section" style="margin-bottom:20px">
      <div class="dex-section-title" style="margin-bottom:10px">Abilities</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${abilitiesHTML}</div>
    </div>

    <!-- Base stats -->
    <div class="dex-section" style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px">
        <div class="dex-section-title">Base Stats</div>
        <div style="font-size:11px;color:#7060a8;font-weight:700">BST <span style="color:#c4b5fd">${bst}</span></div>
      </div>
      ${statsHTML}
    </div>

    <!-- Pokédex entries -->
    <div class="dex-section">
      <div class="dex-section-title" style="margin-bottom:12px">Pokédex Entries</div>
      ${flavorHTML}
    </div>

    <!-- Credit -->
    <div style="text-align:center;padding:20px 0 8px;font-size:10px;color:#3d3070;line-height:1.8">
      Pokédex data provided by
      <a href="https://pokeapi.co" target="_blank" style="color:#5b4690;text-decoration:none;font-weight:700">PokéAPI</a>
      · Sprites by
      <a href="https://pokemondb.net" target="_blank" style="color:#5b4690;text-decoration:none;font-weight:700">PokémonDB</a><br/>
      <span style="color:#2e2858">Pokémon and all related names are trademarks of Nintendo / Game Freak.</span>
    </div>
  `;
}

// ── MOVES TAB ────────────────────────────────────────────────────────────────
const moveCache = {}; // move-name -> { type, category, power, accuracy }

async function fetchMoveDetails(moveName) {
  if (moveCache[moveName]) return moveCache[moveName];
  try {
    const data = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`).then(r => r.ok ? r.json() : null);
    if (!data) return null;
    const detail = {
      type:     data.type?.name || null,
      category: data.damage_class?.name || null, // physical / special / status
      power:    data.power || null,
      accuracy: data.accuracy || null,
    };
    moveCache[moveName] = detail;
    return detail;
  } catch { return null; }
}

async function renderMovesTab(species, poke) {
  if (!poke) {
    document.getElementById('dpane-moves').innerHTML = '<div class="dex-loading"><div style="color:#5b4690">No move data available.</div></div>';
    return;
  }

  // Group moves by learn method, dedupe
  const byMethod = {};
  poke.moves.forEach(m => {
    m.version_group_details.forEach(vg => {
      const method = vg.move_learn_method.name;
      if (!byMethod[method]) byMethod[method] = [];
      const existing = byMethod[method].find(x => x.name === m.move.name);
      if (!existing || vg.level_learned_at > existing.level) {
        if (existing) byMethod[method].splice(byMethod[method].indexOf(existing), 1);
        byMethod[method].push({ name: m.move.name, level: vg.level_learned_at });
      }
    });
  });

  const primaryMethods = ['level-up','egg','machine','tutor'].filter(m => byMethod[m]?.length);
  const methodLabels = { 'level-up':'Level Up', 'egg':'Egg Moves', 'machine':'TM / TR', 'tutor':'Tutor' };

  // Show skeleton immediately
  document.getElementById('dpane-moves').innerHTML = `
    <div class="move-filter-row" id="moveFilterRow">
      ${primaryMethods.map(m => `
        <button class="move-filter-btn ${m === currentMoveFilter ? 'active' : ''}"
          onclick="setMoveFilter('${m}')">${methodLabels[m]||m}
          <span style="color:#5b4690">(${byMethod[m].length})</span>
        </button>`).join('')}
    </div>
    <div id="moveTableWrap">
      <div class="dex-loading" style="padding:30px">
        <div class="dex-loading-spinner"></div>
        <div>Loading move data…</div>
      </div>
    </div>`;

  // Batch-fetch all unique moves across all primary methods
  const allMoveNames = [...new Set(primaryMethods.flatMap(m => byMethod[m].map(mv => mv.name)))];
  await Promise.all(allMoveNames.map(fetchMoveDetails));

  // Render with full details
  const catClass = { physical:'move-cat-physical', special:'move-cat-special', status:'move-cat-status' };
  const catLabel = { physical:'Phys', special:'Spec', status:'Status' };

  const makeMoveTable = (moves, method) => {
    const sorted = method === 'level-up'
      ? [...moves].sort((a,b) => a.level - b.level)
      : [...moves].sort((a,b) => a.name.localeCompare(b.name));

    const stabTypes = new Set(poke.types.map(t => t.type.name));
    const isEgg = method === 'egg';

    const rows = sorted.map(mv => {
      const name   = mv.name.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ');
      const detail = moveCache[mv.name];
      const tc     = detail?.type ? (TYPE_COLORS[detail.type] || '#888') : '#5b4690';
      const isStab = detail?.type && stabTypes.has(detail.type);
      const typeCell = detail?.type
        ? `<span class="move-type-badge" style="background:${tc}22;color:${tc};border-color:${tc}44">${detail.type}${isStab ? '<span style="font-size:8px;font-weight:900;margin-left:3px"> STAB</span>' : ''}</span>`
        : '<span style="color:#3d3070">—</span>';
      const catCell = detail?.category
        ? `<span class="move-cat-badge ${catClass[detail.category]||''}">${catLabel[detail.category]||detail.category}</span>`
        : '<span style="color:#3d3070">—</span>';
      const pwrCell = detail?.power    ? `<span class="move-power-val">${detail.power}</span>`    : '<span style="color:#3d3070">—</span>';
      const accCell = detail?.accuracy ? `<span class="move-acc-val">${detail.accuracy}</span>`   : '<span style="color:#3d3070">—</span>';

      const rowId      = 'eggrow-' + mv.name.replace(/[^a-z0-9]/g,'');
      const panelId    = 'eggpanel-' + mv.name.replace(/[^a-z0-9]/g,'');
      const clickAttr  = isEgg ? `onclick="toggleEggLearners('${mv.name}','${rowId}','${panelId}')" class="egg-move-row"` : 'class=""';
      const chevron    = isEgg ? `<td style="color:#5b4690;font-size:11px;padding-right:10px">›</td>` : '';

      return `
        <tr id="${rowId}" ${clickAttr}>
          <td class="move-name">${name}${isEgg ? '<span style="font-size:9px;color:#5b4690;margin-left:4px">· tap</span>' : ''}</td>
          <td>${typeCell}</td>
          <td>${catCell}</td>
          <td>${pwrCell}</td>
          <td>${accCell}</td>
          ${chevron}
        </tr>
        ${isEgg ? `<tr id="${panelId}-row" style="display:none"><td colspan="6" style="padding:0 8px 8px">
          <div class="egg-learner-panel open" id="${panelId}">
            <div style="font-size:10px;font-weight:800;color:#7060a8;text-transform:uppercase;letter-spacing:.1em">Who can pass this move?</div>
            <div class="learner-loading" id="${panelId}-status">Loading…</div>
            <div class="learner-grid" id="${panelId}-grid"></div>
          </div>
        </td></tr>` : ''}`;
    }).join('');

    return `
      <table class="move-table" style="width:100%">
        <thead><tr>
          <th>Move</th>
          <th>Type</th>
          <th>Cat</th>
          <th>Pwr</th>
          <th>Acc</th>
          ${isEgg ? '<th></th>' : ''}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  };

  // Store byMethod on window so setMoveFilter can re-render
  window._currentMoveData = { byMethod, primaryMethods, makeMoveTable };

  const wrap = document.getElementById('moveTableWrap');
  if (wrap) {
    wrap.innerHTML = primaryMethods.map(m => `
      <div id="moves-${m.replace('-','')}pane" style="display:${m === currentMoveFilter ? 'block' : 'none'}">
        ${makeMoveTable(byMethod[m], m)}
      </div>`).join('');
  }
}

function setMoveFilter(method) {
  currentMoveFilter = method;
  document.querySelectorAll('.move-filter-btn').forEach(b => {
    const labels = {'level-up':'Level Up','egg':'Egg Moves','machine':'TM / TR','tutor':'Tutor'};
    b.classList.toggle('active', b.textContent.trim().startsWith(labels[method]||method));
  });
  document.querySelectorAll('[id^="moves-"]').forEach(p => p.style.display = 'none');
  const pane = document.getElementById('moves-' + method.replace('-','') + 'pane');
  if (pane) pane.style.display = 'block';
}

// ── EVOLUTION TAB ─────────────────────────────────────────────────────────────
function renderEvolutionTab(species, poke, spec, evo) {
  const el = document.getElementById('dpane-evolution');
  if (!evo) {
    el.innerHTML = '<div class="dex-loading"><div style="color:#5b4690">No evolution data available.</div></div>';
    return;
  }

  // Flatten evolution chain into stages
  function flattenChain(chain) {
    const stages = [];
    let current = chain;
    while (current) {
      const name = current.species.name;
      const triggers = current.evolution_details?.map(d => {
        const parts = [];
        if (d.min_level)              parts.push(`Lv. ${d.min_level}`);
        if (d.item)                   parts.push(d.item.name.replace(/-/g,' '));
        if (d.held_item)              parts.push(`hold ${d.held_item.name.replace(/-/g,' ')}`);
        if (d.trigger?.name === 'use-item' && d.item) parts.push(d.item.name.replace(/-/g,' '));
        if (d.min_happiness)          parts.push(`Happiness ${d.min_happiness}+`);
        if (d.min_affection)          parts.push(`Affection ${d.min_affection}+`);
        if (d.time_of_day)            parts.push(d.time_of_day);
        if (d.known_move)             parts.push(`know ${d.known_move.name.replace(/-/g,' ')}`);
        if (d.known_move_type)        parts.push(`know ${d.known_move_type.name} move`);
        if (d.location)               parts.push(d.location.name.replace(/-/g,' '));
        if (d.needs_overworld_rain)   parts.push('rain');
        if (d.turn_upside_down)       parts.push('upside down');
        if (d.gender !== null && d.gender !== undefined) parts.push(d.gender === 1 ? '♀ only' : '♂ only');
        if (d.trigger?.name === 'trade') parts.push('Trade');
        if (!parts.length && d.trigger) parts.push(d.trigger.name.replace(/-/g,' '));
        return parts.join(', ');
      }) || [];
      stages.push({ name, triggers, evolvesTo: current.evolves_to });
      if (current.evolves_to?.length === 1) {
        current = current.evolves_to[0];
      } else {
        // Branch — handle separately
        current = null;
      }
    }
    return stages;
  }

  // Render the chain recursively
  function renderChain(chain, depth=0) {
    const name = chain.species.name;
    const displayName = name.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
    const isCurrent = name.toLowerCase() === species.toLowerCase();
    const isCaught  = !!(dexData[displayName]?.caught);
    const sprSrc    = `https://img.pokemondb.net/sprites/home/normal/${name}.png`;
    const num       = chain.species.url.split('/').filter(Boolean).pop();

    const nodeHTML = `
      <div class="evo-node ${isCurrent?'current':''} ${isCaught?'caught':''}" onclick="openDex('${displayName}')">
        <img src="${sprSrc}" width="64" height="64" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
        <div class="evo-name">${displayName}</div>
        <div class="evo-num">#${String(num).padStart(3,'0')}</div>
        ${isCaught ? '<div style="font-size:9px;color:#86efac;font-weight:700">✓ Caught</div>' : ''}
      </div>`;

    if (!chain.evolves_to?.length) return nodeHTML;

    return chain.evolves_to.map(next => {
      const trigger = next.evolution_details?.[0];
      const parts = [];
      if (trigger) {
        if (trigger.min_level)            parts.push(`Lv. ${trigger.min_level}`);
        if (trigger.item)                 parts.push(trigger.item.name.replace(/-/g,' '));
        if (trigger.held_item)            parts.push(`Hold: ${trigger.held_item.name.replace(/-/g,' ')}`);
        if (trigger.min_happiness)        parts.push(`Happiness`);
        if (trigger.min_affection)        parts.push(`Affection`);
        if (trigger.time_of_day)          parts.push(trigger.time_of_day);
        if (trigger.known_move)           parts.push(trigger.known_move.name.replace(/-/g,' '));
        if (trigger.needs_overworld_rain) parts.push('Rain');
        if (trigger.turn_upside_down)     parts.push('Upside Down');
        if (trigger.trigger?.name === 'trade') parts.push('Trade');
        if (!parts.length && trigger.trigger) parts.push(trigger.trigger.name.replace(/-/g,' '));
      }
      const methodText = parts.join(' · ') || '→';

      return `
        <div class="evo-row">
          ${nodeHTML}
          <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
            <div class="evo-arrow">→</div>
            <div class="evo-method">${methodText}</div>
          </div>
          <div>${renderChain(next, depth+1)}</div>
        </div>`;
    }).join('');
  }

  el.innerHTML = `
    <div class="dex-section-title" style="margin-bottom:16px">Evolution Chain</div>
    <div class="evo-chain">${renderChain(evo.chain)}</div>
    <div style="margin-top:16px;font-size:10px;color:#5b4690;font-style:italic">Tap any Pokémon in the chain to open its Dex page.</div>
  `;
}

// ── MY DATA TAB ───────────────────────────────────────────────────────────────
function renderMyData(species) {
  const entry    = dexData[species] || { caught:false, shinyFound:false, encounters:[] };
  const variants = mons.filter(m => m.species.toLowerCase() === species.toLowerCase());
  const owned    = variants.filter(m => m.tradeStatus !== 'wanted');
  const wanted   = variants.filter(m => m.tradeStatus === 'wanted');
  const ownedBalls = new Set(owned.map(m => m.ball));
  const wantedBalls= new Set(wanted.map(m => m.ball));

  // Ball collection grid
  const gridHTML = BALL_NAMES.map(b => {
    const bbc = BALLS[b];
    const o   = ownedBalls.has(b);
    const w   = wantedBalls.has(b) && !o;
    const qty = owned.filter(m => m.ball===b).reduce((s,m)=>s+m.quantity,0);
    const mon = owned.find(m=>m.ball===b) || wanted.find(m=>m.ball===b);
    const bg     = o ? `${bbc.accent}15` : w ? '#fda4af08' : '#2b1f4e';
    const border  = o ? bbc.accent+'44'  : w ? '#fda4af44' : '#2e2858';
    const nameCol = o ? bbc.light        : w ? '#fda4af88' : '#3d3570';
    const img     = bImg(b, 32, !o && !w);
    const label   = o ? `<span style="font-size:8px;color:${bbc.accent}">×${qty}</span>`
                  : w ? `<span style="font-size:8px;color:#fda4af88">want</span>` : '';
    return `<div class="bgi" title="${b}${mon?' — '+mon.nature+', '+mon.ivSpread:''}" style="background:${bg};border:1px solid ${border}">
      ${img}<span style="font-size:9px;color:${nameCol}">${b}</span>${label}
    </div>`;
  }).join('');

  const missing = BALL_NAMES.filter(b => !ownedBalls.has(b));

  // Encounter log
  const mOpts = EGG_METHODS.map(m=>`<option>${m}</option>`).join('');
  const gOpts = GAMES.map(g=>`<option>${g}</option>`).join('');
  const encsHTML = entry.encounters.length
    ? entry.encounters.map(e => `
        <div class="enc-entry ${e.isShiny?'shiny':''} ${e.isFailed?'failed':''}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:8px">
              ${e.isShiny ? (e.isFailed ? '<span style="color:#fda4af;font-size:13px">💔</span>' : '<span style="color:#FFD700;font-size:13px;filter:drop-shadow(0 0 4px #FFD700)">★</span>') : ''}
              <span class="cinzel" style="color:${e.isFailed?'#fda4af':e.isShiny?'#FFD700':'#c084fc'};font-size:13px;font-weight:700">${e.method}</span>
              <span style="color:#8b80b8;font-size:11px">· ${e.game}</span>
            </div>
            <span style="color:#7c6fa0;font-size:11px">${e.date}</span>
          </div>
          ${e.notes?`<div style="color:#9d93c0;font-size:12px;font-style:italic;margin-top:6px">${e.notes}</div>`:''}
        </div>`).join('')
    : '<div class="empty-state" style="padding:24px 0">No encounters logged yet.</div>';

  document.getElementById('dpane-mydata').innerHTML = `
    <!-- Caught toggles -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
      <div class="caught-toggle" style="background:${entry.caught?'#2d1f5e':'#231d45'};border-color:${entry.caught?'#d4a8ff44':'#5b4690'};flex:1;min-width:140px" onclick="toggleCaught('${species}','caught');renderMyData('${species}')">
        <div class="caught-dot" style="background:${entry.caught?'#a78bfa':'#3d3570'};color:${entry.caught?'#000':'#5a5190'}">${entry.caught?'✓':'○'}</div>
        <div><div class="cinzel" style="color:${entry.caught?'#c084fc':'#8b80b8'};font-size:13px;font-weight:700">Caught</div></div>
      </div>
      <div class="caught-toggle" style="background:${entry.shinyFound?'#2d2518':'#2f2358'};border-color:${entry.shinyFound?'#fde68a44':'#5b4690'};flex:1;min-width:140px" onclick="toggleCaught('${species}','shinyFound');renderMyData('${species}')">
        <div class="caught-dot" style="background:${entry.shinyFound?'#FFD700':'#3d3570'};color:${entry.shinyFound?'#000':'#5a5190'}">${entry.shinyFound?'★':'☆'}</div>
        <div><div class="cinzel" style="color:${entry.shinyFound?'#FFD700':'#8b80b8'};font-size:13px;font-weight:700">Shiny</div></div>
      </div>
    </div>

    <!-- Ball grid -->
    <div class="dex-section" style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px">
        <div class="dex-section-title">Apriball Collection</div>
        <div style="font-size:11px"><span style="color:#c084fc">${ownedBalls.size}</span><span style="color:#7c6fa0"> / ${BALL_NAMES.length}</span></div>
      </div>
      <div class="ball-grid">${gridHTML}</div>
      ${missing.length
        ? `<div class="missing-box"><div style="color:#fdba74;font-size:10px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Missing (${missing.length})</div><div class="tag-row">${missing.map(b=>`<span class="tag" style="background:#3d2040;border-color:#fdba7430;color:#fdba74">${b}</span>`).join('')}</div></div>`
        : `<div class="complete-box">✓ Full Apriball set complete!</div>`}
    </div>

    <!-- Encounter log -->
    <div class="dex-section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="dex-section-title">Encounter Log</div>
        <button onclick="toggleLogForm('${species}')" id="logToggleBtn" class="dex-log-btn" style="background:linear-gradient(135deg,#2d1f5e,#2a2255);border:1px solid #c084fc30;color:#c084fc;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px">+ Log</button>
      </div>
      <div id="logForm" style="display:none">
        <div class="enc-log-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div><div class="form-label">Date</div><input type="date" id="logDate" class="form-input" value="${new Date().toISOString().slice(0,10)}"/></div>
            <div><div class="form-label">Method</div><select id="logMethod" class="form-select">${mOpts}</select></div>
            <div><div class="form-label">Game</div><select id="logGame" class="form-select">${gOpts}</select></div>
            <div style="display:flex;align-items:center;gap:10px;padding-top:18px">
              <input type="checkbox" id="logShiny" style="width:16px;height:16px;accent-color:#FFD700"/>
              <label for="logShiny" style="color:#FFD700;font-size:13px;cursor:pointer">★ Shiny</label>
            </div>
          </div>
          <div class="form-label">Notes</div>
          <textarea id="logNotes" class="form-textarea" style="margin-bottom:12px" placeholder="Details…"></textarea>
          <button onclick="saveEncounter('${species}')" class="dex-save-enc-btn" style="background:linear-gradient(135deg,#2d1f5e,#2a2255);border:1px solid #c084fc44;color:#c084fc;padding:9px;border-radius:6px;cursor:pointer;font-family:'Cinzel',serif;font-size:13px;font-weight:700;width:100%">Save Encounter</button>
        </div>
      </div>
      ${encsHTML}
    </div>
  `;
}


// ── Reddit ────────────────────────────────────────────────────────────────────
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


// ══════════════════════════════════════════════════════════════════════════════
// SHINY HUNTER — full rebuild
// ══════════════════════════════════════════════════════════════════════════════

// ── Storage keys ──────────────────────────────────────────────────────────────
const LSH = { HUNTS:'at_hunts2', HID:'at_hid2', LOG:'at_slog2', LID:'at_lid2' };
let hunts    = lsGet(LSH.HUNTS, []);
let nextHid  = lsGet(LSH.HID, 1);
let shinyLog = lsGet(LSH.LOG, []);
let nextLid  = lsGet(LSH.LID, 1);

// ── Accurate odds table ───────────────────────────────────────────────────────
// Each entry: { base, charm, notes }
// odds = 1/N chance per attempt
const METHODS = {
  'Random Encounter':   { base:4096, charm:1365, note:'Full odds wild encounter' },
  'Masuda Method':      { base:683,  charm:512,  note:'Two different language parents' },
  'DexNav Chaining':    { base:4096, charm:1365, note:'Chain up for better odds. At chain 40+: ~1/200 (no charm)' },
  'Poké Radar':         { base:200,  charm:200,  note:'Charm has no effect. Chain 40 required' },
  'SOS Chaining':       { base:4096, charm:1365, note:'At 30+ calls: ~1/315 (charm: ~1/100)' },
  'Outbreak':           { base:4096, charm:1365, note:'Mass Outbreak — SV with sparkling power boosts further' },
  'Sandwich Method':    { base:1365, charm:683,  note:'Herba Mystica sandwich active, SV' },
  'Fishing Chain':      { base:4096, charm:1365, note:'Chain fishing — chain 25+: much better odds' },
  'Friend Safari':      { base:512,  charm:512,  note:'Charm has no extra effect in Friend Safari' },
  'Soft Reset':         { base:4096, charm:1365, note:'Full odds reset' },
  'Static':             { base:4096, charm:1365, note:'Fixed static encounters' },
  'Dynamax Adventure':  { base:100,  charm:100,  note:'~1/100 regardless of charm (charm has no extra effect)' },
  'Legends: Arceus':    { base:4096, charm:1365, note:'Research level 10 and Shiny Charm stack' },
  'Community Day':      { base:25,   charm:25,   note:'Event boosted — charm has no effect' },
  'GO / HOME Transfer': { base:4096, charm:4096, note:'Chance locked to original game' },
};

// Runtime odds (can chain-adjust)
function getOdds(method, hasCharm) {
  const m = METHODS[method] || METHODS['Random Encounter'];
  return hasCharm ? m.charm : m.base;
}

// Probability of having found at least one shiny in n attempts at 1/odds
function probByNow(n, odds) {
  if (n <= 0) return 0;
  return 1 - Math.pow(1 - 1/odds, n);
}

// ── Active hunt state ─────────────────────────────────────────────────────────
let currentShinyTab  = 'hunts';
let foundHuntId      = null;
let phaseHuntId      = null;

function shinyTab(tab) {
  currentShinyTab = tab;
  ['hunts','log','stats'].forEach(t => {
    const btn = document.getElementById('stab-' + t);
    const pane = document.getElementById('sh-' + t);
    if (btn)  btn.classList.toggle('active', t === tab);
    if (pane) pane.style.display = t === tab ? 'block' : 'none';
  });
  if (tab === 'hunts') { renderHuntStats(); renderHunts(); }
  if (tab === 'log')   renderShinyLog();
  if (tab === 'stats') renderShinyStats();
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function renderHuntStats() {
  const active  = hunts.filter(h => h.status === 'active');
  const allDone = shinyLog;
  const totalEnc = hunts.reduce((s, h) => s + h.count, 0);
  const longest  = hunts.reduce((max, h) => h.count > max ? h.count : max, 0);

  const stats = [
    { v: active.length,               l: 'Active Hunts',      c: '#c4b5fd' },
    { v: allDone.length,              l: 'Shinies Found',     c: '#fde68a' },
    { v: totalEnc.toLocaleString(),   l: 'Total Encounters',  c: '#93c5fd' },
    { v: longest ? longest.toLocaleString() : '—', l: 'Longest Hunt', c: '#fda4af' },
  ];
  document.getElementById('huntStats').innerHTML = stats.map(s =>
    `<div class="hunt-stat-card"><div class="hsc-val" style="color:${s.c}">${s.v}</div><div class="hsc-lbl">${s.l}</div></div>`
  ).join('');
}

// ── Render all active hunts ───────────────────────────────────────────────────
function renderHunts() {
  const active = hunts.filter(h => h.status === 'active');
  const el = document.getElementById('activeHunts');
  if (!active.length) {
    el.innerHTML = `<div class="empty-state">No active hunts yet.<br/><span style="font-size:12px;color:#5b4690">Start one below!</span></div>`;
    return;
  }
  el.innerHTML = active.map(h => huntCard(h)).join('');
}

function huntCard(h) {
  const bc      = BALLS[h.ball] || BALLS.Moon;
  const odds    = getOdds(h.method, h.hasCharm);
  const prob    = probByNow(h.count, odds);
  // Bar fills by encounter count relative to odds — so "at odds" = bar full
  const pct      = Math.min(h.count / odds * 100, 100);
  const overOdds = h.count > odds;
  const shinySprite = poke(h.species, true);
  const normSprite  = poke(h.species, false);

  // Phase summary
  const phases = h.phases || [];
  const phaseHTML = phases.length > 0 ? `
    <div class="phases-row">
      <div class="phases-header">
        <span>Phases (${phases.length})</span>
        <span style="color:#5b4690">Total: ${h.count.toLocaleString()} encounters</span>
      </div>
      <div class="phase-chips">
        ${phases.map((p, i) => `
          <div class="phase-chip ${i === phases.length-1 ? 'current' : ''}">
            <span class="pc-num">P${i+1}</span>
            <span class="pc-cnt">${p.count.toLocaleString()}</span>
            ${p.species !== h.species ? `<span class="pc-poke">${p.species}</span>` : ''}
          </div>`).join('')}
      </div>
    </div>` : '';

  // Progress bar — cap fill at 100% but show "over" styling
  const barColor = overOdds
    ? 'linear-gradient(90deg,#c084fc,#fda4af,#f43f5e)'
    : prob > 0.5
      ? 'linear-gradient(90deg,#c084fc,#fde68a)'
      : 'linear-gradient(90deg,#818cf8,#c084fc)';

  // Days elapsed
  const days = h.startDate ? Math.floor((Date.now() - new Date(h.startDate)) / 86400000) : 0;

  return `
  <div class="hunt-card ${overOdds ? 'over-odds' : ''}" id="hcard-${h.id}">
    <div class="hunt-card-accent"></div>
    <div class="hunt-card-top">
      <div class="hunt-sprite-wrap" onclick="openDex('${h.species}')" title="View Dex entry">
        <div style="position:absolute;inset:4px;border-radius:50%;filter:blur(8px);background:radial-gradient(circle,${bc.accent}33,transparent)"></div>
        ${shinySprite ? `<img src="${shinySprite}" width="68" height="68" style="image-rendering:pixelated;position:relative;z-index:1;transition:transform .2s;filter:drop-shadow(0 0 10px #fde68a88)" onerror="this.style.display='none'"/>` : `<div style="font-size:32px;position:relative;z-index:1">❓</div>`}
      </div>
      <div class="hunt-meta">
        <div class="hunt-species">${h.species}</div>
        <div class="hunt-badges">
          ${bImg(h.ball, 18)} <span style="color:${bc.light};font-size:11px;font-weight:700">${h.ball} Ball</span>
          ${overOdds ? `<span class="over-odds-pill">⚡ Over Odds</span>` : ''}
          ${h.hasCharm ? `<span class="hunt-badge" style="color:#fde68a;border-color:#fde68a44;background:#fde68a0a">✨ Charm</span>` : ''}
        </div>
        <div class="hunt-detail">${h.method} · ${h.game}${days > 0 ? ` · ${days}d` : ' · today'}</div>
        ${h.notes ? `<div class="hunt-notes">${h.notes}</div>` : ''}
      </div>
    </div>

    <!-- Progress bar -->
    <div class="hunt-progress">
      <div class="progress-header">
        <span class="progress-label">1/${odds.toLocaleString()} odds${h.hasCharm ? ' ✨' : ''}</span>
        <span class="progress-prob" style="color:${overOdds ? '#fda4af' : prob > 0.63 ? '#fde68a' : '#c4b5fd'}">${(prob * 100).toFixed(1)}% probability</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" id="pfill-${h.id}" style="width:${pct}%;background:${barColor}"></div>
        <div class="progress-marker" style="left:33.3%"></div>
        <div class="progress-marker" style="left:66.6%"></div>
        <div class="progress-marker at-odds" style="left:calc(100% - 1px)" title="At odds"></div>
      </div>
      <div class="progress-counts">
        <span style="color:#7060a8">${h.count.toLocaleString()} / ${odds.toLocaleString()} encounters</span>
        <span style="color:${overOdds?'#fda4af':'#5b4690'}">${overOdds ? `+${(h.count - odds).toLocaleString()} over odds` : `${(odds - h.count).toLocaleString()} to odds`}</span>
      </div>
    </div>

    ${phaseHTML}

    <!-- Counter -->
    <div style="margin:14px 16px 0;background:#1a1230;border-radius:14px;overflow:hidden">
      <!-- Big +1 tap zone -->
      <div onclick="bump(${h.id})" id="cnum-${h.id}" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px 16px 18px;cursor:pointer;user-select:none;transition:background .1s;background:transparent;border-bottom:1px solid #5b469022;position:relative" onmouseenter="this.style.background='#c084fc0a'" onmouseleave="this.style.background='transparent'" onmousedown="this.style.background='#c084fc18'" onmouseup="this.style.background='#c084fc0a'">
        <div style="font-family:'Cinzel',serif;font-size:64px;font-weight:900;line-height:1;background:linear-gradient(135deg,#fde68a,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;transition:transform .08s;pointer-events:none">${h.count.toLocaleString()}</div>
        <div style="color:#5b4690;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-top:8px;pointer-events:none">tap anywhere here to count</div>
      </div>
      <!-- Adjustment controls -->
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:0;border-bottom:1px solid #5b469022">
        <button class="cc-btn" onclick="adj(${h.id},-100)" style="border-radius:0;border:none;border-right:1px solid #5b469022;padding:9px 0;font-size:11px">−100</button>
        <button class="cc-btn" onclick="adj(${h.id},-10)"  style="border-radius:0;border:none;border-right:1px solid #5b469022;padding:9px 0;font-size:11px">−10</button>
        <button class="cc-btn" onclick="adj(${h.id},-1)"   style="border-radius:0;border:none;border-right:1px solid #5b469022;padding:9px 0;font-size:13px">−1</button>
        <button class="cc-btn" onclick="adj(${h.id},1)"    style="border-radius:0;border:none;border-right:1px solid #5b469022;padding:9px 0;font-size:13px">+1</button>
        <button class="cc-btn" onclick="adj(${h.id},10)"   style="border-radius:0;border:none;border-right:1px solid #5b469022;padding:9px 0;font-size:11px">+10</button>
        <button class="cc-btn" onclick="adj(${h.id},100)"  style="border-radius:0;border:none;padding:9px 0;font-size:11px">+100</button>
      </div>
      <!-- Actions row -->
      <div style="display:flex;gap:0">
        <button class="cc-btn" onclick="setCount(${h.id})" style="border-radius:0 0 0 14px;border:none;border-right:1px solid #5b469022;padding:10px 0;flex:1;font-size:11px">✎ Set Count</button>
        <button class="cc-btn found-btn" onclick="openFoundModal(${h.id})" style="border-radius:0 0 14px 0;border:none;flex:2;padding:10px 0">★ Found It!</button>
        </div>
      </div>
    </div>

    <!-- Footer actions -->
    <div class="hunt-card-footer">
      <button class="hcf-btn" onclick="openPhaseModal(${h.id})">📍 Log Phase</button>
      <button class="hcf-btn" style="color:#fda4af88;border-color:#fda4af22" onmouseover="this.style.color='#fda4af';this.style.background='#3a1020';this.style.borderColor='#fda4af44'" onmouseout="this.style.color='#fda4af88';this.style.background='';this.style.borderColor='#fda4af22'" onclick="openFailedModal(${h.id})">💔 Failed Catch</button>
      <button class="hcf-btn" onclick="openDex('${h.species}')">📖 Dex</button>
      <button class="hcf-btn danger" onclick="abandonHunt(${h.id})">✕ Abandon</button>
    </div>
  </div>`;
}

// ── Counter actions (optimistic DOM update for smoothness) ────────────────────
function bump(id) {
  const h = hunts.find(x => x.id === id); if (!h) return;
  h.count++;
  if (h.phases?.length) h.phases[h.phases.length - 1].count++;
  lsSet(LSH.HUNTS, hunts);
  refreshCardCounter(h);
}

function adj(id, delta) {
  const h = hunts.find(x => x.id === id); if (!h) return;
  h.count = Math.max(0, h.count + delta);
  lsSet(LSH.HUNTS, hunts);
  renderHuntStats();
  renderHunts(); // full re-render needed for progress bar
}

function setCount(id) {
  const h = hunts.find(x => x.id === id); if (!h) return;
  const v = prompt(`Set encounter count for ${h.species}:`, h.count);
  if (v === null) return;
  const n = parseInt(v);
  if (!isNaN(n) && n >= 0) { h.count = n; lsSet(LSH.HUNTS, hunts); renderHuntStats(); renderHunts(); }
}

function refreshCardCounter(h) {
  // Fast path: just update the number and progress bar in-place
  const odds   = getOdds(h.method, h.hasCharm);
  const prob   = probByNow(h.count, odds);
  const pct    = Math.min(h.count / odds * 100, 100);
  const overOdds = h.count > odds;

  const cnum = document.getElementById('cnum-' + h.id);
  if (cnum) {
    const numEl = cnum.querySelector('div');
    if (numEl) numEl.textContent = h.count.toLocaleString();
  }

  const fill = document.getElementById('pfill-' + h.id);
  if (fill) {
    fill.style.width = pct + '%';
    fill.style.background = overOdds
      ? 'linear-gradient(90deg,#c084fc,#fda4af,#f43f5e)'
      : prob > 0.5 ? 'linear-gradient(90deg,#c084fc,#fde68a)'
      : 'linear-gradient(90deg,#818cf8,#c084fc)';
  }

  // Mark card as over-odds
  const card = document.getElementById('hcard-' + h.id);
  if (card && overOdds && !card.classList.contains('over-odds')) {
    card.classList.add('over-odds');
    renderHunts(); // re-render to show over-odds pill
  }

  renderHuntStats();
}

// ── New hunt modal ─────────────────────────────────────────────────────────────
function openNewHuntModal() {
  setTimeout(() => initSpeciesAC('nh-species', (name) => {
    const prev = document.getElementById('nhSpritePreview');
    if (prev) prev.src = `https://img.pokemondb.net/sprites/home/normal/${name}.png`;
  }), 50);
  document.getElementById('nh-species').value = '';
  document.getElementById('nh-notes').value   = '';
  document.getElementById('nh-charm').checked = false;
  nhPreview();
  showModal('newHuntModal');
}
function closeNewHuntModal() { hideModal('newHuntModal'); }

function nhPreview() {
  const method   = document.getElementById('nh-method')?.value;
  const hasCharm = document.getElementById('nh-charm')?.checked;
  if (!method) return;
  const m    = METHODS[method] || METHODS['Random Encounter'];
  const odds = hasCharm ? m.charm : m.base;
  document.getElementById('nh-odds-num').textContent = `1 / ${odds.toLocaleString()}`;
  document.getElementById('nh-odds-lbl').textContent = m.note + (hasCharm ? ' + charm' : '');
  // Animate charm toggle
  const track = document.getElementById('nh-charm-track');
  const thumb = document.getElementById('nh-charm-thumb');
  if (track && thumb) {
    track.style.background = hasCharm ? '#fde68a33' : '#2b1f4e';
    track.style.borderColor = hasCharm ? '#fde68a66' : '#5b4690';
    thumb.style.left = hasCharm ? '21px' : '3px';
    thumb.style.background = hasCharm ? '#fde68a' : '#5b4690';
  }
}

function startHunt() {
  const species = document.getElementById('nh-species').value.trim();
  if (!species) { alert('Please enter a Pokémon species!'); return; }

  const method   = document.getElementById('nh-method').value;
  const ball     = document.getElementById('nh-ball').value;
  const game     = document.getElementById('nh-game').value;
  const hasCharm = document.getElementById('nh-charm').checked;
  const notes    = document.getElementById('nh-notes').value.trim();

  const hunt = {
    id:        nextHid++,
    species,
    ball,
    method,
    game,
    hasCharm,
    notes,
    count:     0,
    phases:    [{ species, count: 0, startedAt: today() }],
    startDate: today(),
    status:    'active',
  };

  hunts.push(hunt);
  lsSet(LSH.HUNTS, hunts);
  lsSet(LSH.HID, nextHid);
  closeNewHuntModal();
  updateShinyBadge();
  renderHuntStats();
  renderHunts();
}

// ── Phase modal ───────────────────────────────────────────────────────────────
function openPhaseModal(id) {
  phaseHuntId = id;
  const h = hunts.find(x => x.id === id); if (!h) return;
  // Pre-fill with hunt target but leave editable
  document.getElementById('phase-species').value = h.species;
  document.getElementById('phase-count').value   = h.count;
  document.getElementById('phase-notes').value   = '';
  updatePhasePreview();
  showModal('phaseModal');
}
function closePhaseModal() { hideModal('phaseModal'); phaseHuntId = null; }

function updatePhasePreview() {
  const species = document.getElementById('phase-species')?.value.trim();
  const nameEl  = document.getElementById('phase-preview-name');
  const subEl   = document.getElementById('phase-preview-sub');
  const inner   = document.getElementById('phase-sprite-inner');
  if (!species) {
    if (nameEl) nameEl.textContent = '—';
    if (subEl)  subEl.textContent  = 'Enter a species above';
    if (inner)  inner.textContent  = '★';
    return;
  }
  if (nameEl) nameEl.textContent = species;
  const alreadyHave = shinyLog.some(l => l.species.toLowerCase() === species.toLowerCase())
    || mons.some(m => m.isShiny && m.species.toLowerCase() === species.toLowerCase());
  if (subEl) subEl.textContent = alreadyHave ? '✓ Already in your shiny log' : '✨ New shiny for your log!';

  const src = poke(species, true);
  if (src) {
    const img = new Image();
    img.onload = () => {
      if (inner) inner.innerHTML = `<img src="${src}" width="48" height="48" style="image-rendering:pixelated;filter:drop-shadow(0 0 8px #fde68a88)"/>`;
    };
    img.src = src;
  } else {
    if (inner) inner.textContent = '★';
  }
}

function confirmPhase() {
  if (!phaseHuntId) return;
  const h = hunts.find(x => x.id === phaseHuntId); if (!h) return;

  const pSpecies = document.getElementById('phase-species').value.trim() || h.species;
  const pCount   = parseInt(document.getElementById('phase-count').value) || 0;
  const pNature  = document.getElementById('phase-nature').value;
  const pGender  = document.getElementById('phase-gender').value;
  const pNotes   = document.getElementById('phase-notes').value.trim();

  // Seal off current phase record
  if (!h.phases) h.phases = [];
  if (h.phases.length) {
    h.phases[h.phases.length - 1].count   = pCount;
    h.phases[h.phases.length - 1].species = pSpecies;
  }
  // Start new phase
  h.phases.push({ species: h.species, count: 0, startedAt: today() });

  lsSet(LSH.HUNTS, hunts);

  // ── Add phase shiny to log ────────────────────────────────────────────────
  const logEntry = {
    id:      nextLid++,
    species: pSpecies,
    ball:    h.ball,   // same ball as hunt (they're hunting in the same area)
    method:  h.method,
    game:    h.game,
    count:   pCount,
    nature:  pNature,
    gender:  pGender,
    notes:   pNotes || `Phase ${h.phases.length - 1} of ${h.species} hunt`,
    date:    today(),
    huntId:  h.id,
    isPhase: true,
    odds:    METHODS[h.method]?.base || 4096,
  };
  shinyLog.unshift(logEntry);
  lsSet(LSH.LOG, shinyLog);
  lsSet(LSH.LID, nextLid);

  // ── Update dex for phase Pokémon ──────────────────────────────────────────
  if (!dexData[pSpecies]) dexData[pSpecies] = { caught: false, shinyFound: false, encounters: [] };
  dexData[pSpecies].caught     = true;
  dexData[pSpecies].shinyFound = true;
  dexData[pSpecies].encounters.unshift({
    id:      Date.now(),
    date:    today(),
    method:  h.method,
    game:    h.game,
    notes:   `✨ Phase shiny during ${h.species} hunt — ${pCount.toLocaleString()} encounter${pCount !== 1 ? 's' : ''}${pNotes ? ' — ' + pNotes : ''}`,
    isShiny: true,
  });
  lsSet(LS.D, dexData);

  closePhaseModal();
  renderHunts();
}

// ── Found modal ───────────────────────────────────────────────────────────────
function openFoundModal(id) {
  foundHuntId = id;
  const h = hunts.find(x => x.id === id); if (!h) return;
  document.getElementById('found-sub').textContent =
    `${h.species} · ${h.count.toLocaleString()} encounters · ${h.method}`;
  document.getElementById('found-notes').value = '';

  // Show shiny sprite
  const wrap = document.getElementById('found-sprite-wrap');
  const src  = poke(h.species, true);
  wrap.innerHTML = src
    ? `<div style="position:absolute;inset:0;border-radius:50%;filter:blur(12px);background:radial-gradient(circle,#fde68a44,transparent)"></div>
       <img src="${src}" width="100" height="100" style="image-rendering:pixelated;position:relative;z-index:1;filter:drop-shadow(0 0 16px #fde68aaa)" onerror="this.style.display='none'"/>`
    : `<div style="font-size:48px;filter:drop-shadow(0 0 8px #fde68a)">★</div>`;

  showModal('foundModal');
}
function closeFoundModal() { hideModal('foundModal'); foundHuntId = null; }

function confirmFound() {
  if (!foundHuntId) return;
  const h = hunts.find(x => x.id === foundHuntId); if (!h) return;

  const nature = document.getElementById('found-nature').value;
  const gender = document.getElementById('found-gender').value;
  const notes  = document.getElementById('found-notes').value.trim();
  const odds   = getOdds(h.method, h.hasCharm);
  const prob   = probByNow(h.count, odds);

  // Mark hunt complete
  h.status  = 'found';
  h.endDate = today();
  h.nature  = nature;
  h.gender  = gender;
  if (notes) h.foundNotes = notes;
  lsSet(LSH.HUNTS, hunts);

  // Add to shiny log
  const entry = {
    id:       nextLid++,
    species:  h.species,
    ball:     h.ball,
    method:   h.method,
    game:     h.game,
    count:    h.count,
    nature,
    gender,
    notes:    notes || h.notes || '',
    date:     today(),
    huntId:   h.id,
    hasCharm: h.hasCharm,
    odds,
    prob,
  };
  shinyLog.unshift(entry);
  lsSet(LSH.LOG, shinyLog);
  lsSet(LSH.LID, nextLid);

  // ── Auto-update Dex entry ──────────────────────────────────────────────────
  const sp = h.species;
  if (!dexData[sp]) dexData[sp] = { caught: false, shinyFound: false, encounters: [] };
  dexData[sp].caught     = true;
  dexData[sp].shinyFound = true;
  // Add a shiny encounter record
  dexData[sp].encounters.unshift({
    id:      Date.now(),
    date:    today(),
    method:  h.method,
    game:    h.game,
    notes:   `✨ Found shiny after ${h.count.toLocaleString()} encounter${h.count !== 1 ? 's' : ''}${notes ? ' — ' + notes : ''}`,
    isShiny: true,
  });
  lsSet(LS.D, dexData);

  closeFoundModal();
  updateShinyBadge();
  renderHuntStats();
  renderHunts();
}

function abandonHunt(id) {
  if (!confirm('Abandon this hunt? It will be removed from your active hunts.')) return;
  hunts = hunts.filter(h => h.id !== id);
  lsSet(LSH.HUNTS, hunts);
  updateShinyBadge();
  renderHuntStats();
  renderHunts();
}

// renderShinyLog now defined in failed catch section above

// ── Quick log modal ───────────────────────────────────────────────────────────
function openQuickLogModal() {
  document.getElementById('ql-date').value = today();
  showModal('quickLogModal');
}
function closeQuickLogModal() { hideModal('quickLogModal'); }

function saveQuickLog() {
  const species = document.getElementById('ql-species').value.trim();
  if (!species) { alert('Species required'); return; }
  const count = parseInt(document.getElementById('ql-count').value) || 0;
  const method = document.getElementById('ql-method').value;
  const entry = {
    id:      nextLid++,
    species,
    ball:    document.getElementById('ql-ball').value,
    method,
    game:    document.getElementById('ql-game').value,
    count,
    nature:  document.getElementById('ql-nature').value,
    gender:  document.getElementById('ql-gender').value,
    notes:   document.getElementById('ql-notes').value.trim(),
    date:    document.getElementById('ql-date').value,
    odds:    METHODS[method]?.base || 4096,
  };
  shinyLog.unshift(entry);
  lsSet(LSH.LOG, shinyLog);
  lsSet(LSH.LID, nextLid);

  // Update dex
  if (!dexData[species]) dexData[species] = { caught: false, shinyFound: false, encounters: [] };
  dexData[species].caught = true;
  dexData[species].shinyFound = true;
  dexData[species].encounters.unshift({
    id: Date.now(), date: entry.date, method: entry.method, game: entry.game,
    notes: `✨ Manually logged${entry.count ? ' · ' + entry.count.toLocaleString() + ' encounters' : ''}${entry.notes ? ' — ' + entry.notes : ''}`,
    isShiny: true,
  });
  lsSet(LS.D, dexData);

  closeQuickLogModal();
  renderShinyLog();
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; }

// ── Utilities ─────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().slice(0, 10); }

function updateShinyBadge() {
  const count = hunts.filter(h => h.status === 'active').length;
  const badge = document.getElementById('shinyBadge');
  if (badge) { badge.textContent = count || ''; badge.style.display = count ? 'inline-flex' : 'none'; }
}



// ── Section Navigation ────────────────────────────────────────────────────────
const SECTIONS = {
  home:        { el:'home-section',       name:'Home',          sub:'Your Pokémon dashboard',         action:null },
  aprimon:     { el:'aprimon-section',    name:'Aprimon',       sub:'Manage your Apriball collection', action:'+ Add Aprimon' },
  shiny:       { el:'shiny-section',      name:'Shiny Hunter',  sub:'Hunt and log your shinies',       action:'🎯 New Hunt' },
  livingdex:   { el:'livingdex-section',  name:'Living Dex',    sub:'Track every Pokémon',             action:null },
  breeding:    { el:'breeding-section',   name:'Breeding',      sub:'Plan and track breeding projects', action:'+ New Project' },
  competitive: { el:'competitive-section',name:'Competitive',   sub:'Build and plan teams',            action:null },
  progress:    { el:'progress-section',   name:'Game Progress', sub:'Track your journey',              action:null },
  halloffame:  { el:'halloffame-section', name:'Hall of Fame',  sub:'Legendary achievements unlocked',  action:null },
};
let currentSection = 'home';

function goSection(section) {
  currentSection = section;
  // Hide all section pages
  Object.values(SECTIONS).forEach(s => {
    const el = document.getElementById(s.el);
    if (el) el.style.display = 'none';
  });
  // Show target
  const sec = SECTIONS[section];
  if (!sec) return;
  const el = document.getElementById(sec.el);
  if (el) el.style.display = 'block';
  // Update sidebar active
  document.querySelectorAll('.sn-item').forEach(b => b.classList.remove('active'));
  const snEl = document.getElementById('sn-' + section);
  if (snEl) snEl.classList.add('active');
  // Update top bar
  document.getElementById('tbSectionName').textContent = sec.name;
  document.getElementById('tbSectionSub').textContent  = sec.sub;
  // Update action button
  const actionBtn = document.getElementById('headerActionBtn');
  if (sec.action) {
    actionBtn.style.display = 'inline-flex';
    actionBtn.textContent = sec.action;
  } else {
    actionBtn.style.display = 'none';
  }
  // Section-specific renders
  if (section === 'home')    renderDashboard();
  if (section === 'aprimon') { renderStats(); renderBallFilter(); renderList(); }
  if (section === 'shiny')     { renderHuntStats(); renderHunts(); }
  if (section === 'livingdex') renderLivingDex();
  if (section === 'breeding')  renderBreeding();
  if (section === 'halloffame') renderHallOfFame();
}

function headerAction() {
  if (currentSection === 'shiny')    { openNewHuntModal(); return; }
  if (currentSection === 'aprimon')  { openAddModal(); return; }
  if (currentSection === 'breeding') { openNewBreedModal(); return; }
  openAddModal();
}

// Aprimon sub-tabs
let currentApriTab = 'collection';
function switchApriTab(tab) {
  currentApriTab = tab;
  document.querySelectorAll('.section-subtab').forEach(b => b.classList.remove('active'));
  const el = document.getElementById('atab-' + tab);
  if (el) el.classList.add('active');
  document.getElementById('collection-page').style.display = tab === 'collection' ? 'block' : 'none';
  document.getElementById('wants-page').style.display      = tab === 'wants'      ? 'block' : 'none';
  const actionBtn = document.getElementById('headerActionBtn');
  actionBtn.textContent = tab === 'wants' ? '+ Add Wanted' : '+ Add Aprimon';
  if (tab === 'wants') renderWants();
}

// Legacy switchTab shim (used in old code)
function switchTab(tab) {
  if (tab === 'shiny')      { goSection('shiny');   return; }
  if (tab === 'collection') { goSection('aprimon'); switchApriTab('collection'); return; }
  if (tab === 'wants')      { goSection('aprimon'); switchApriTab('wants'); return; }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderDashboard() {
  const activeHunts = hunts.filter(h => h.status === 'active').length;
  const totalShinies = shinyLog.length + mons.filter(m => m.isShiny).length;
  const groups = group(mons);
  const stats = [
    { v: groups.length,                                          l:'Aprimon Species',  c:'#c4b5fd', s:'aprimon'     },
    { v: mons.filter(m=>m.tradeStatus==='available').length,     l:'Available to Trade',c:'#93c5fd', s:'aprimon'    },
    { v: new Set(mons.map(m=>m.ball)).size,                      l:'Ball Types',        c:'#f9a8d4', s:'aprimon'    },
    { v: activeHunts,                                            l:'Active Hunts',      c:'#fde68a', s:'shiny'      },
    { v: totalShinies,                                           l:'Total Shinies',     c:'#fbbf24', s:'shiny'      },
  ];
  document.getElementById('dashStatsGrid').innerHTML = stats.map(s =>
    `<div class="dash-stat" onclick="goSection('${s.s}')" title="Go to ${s.s}">
      <div class="dash-stat-val" style="color:${s.c}">${s.v}</div>
      <div class="dash-stat-lbl">${s.l}</div>
    </div>`
  ).join('');

  // Recent activity
  const activities = buildActivityFeed();
  const actHTML = activities.length
    ? activities.map(a => `<div class="activity-item">
        <div class="activity-dot" style="background:${a.color}"></div>
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>`).join('')
    : '<div style="color:#5b4690;font-size:12px;padding:12px 0">No recent activity yet.</div>';

  // Quick links
  const quickLinks = [
    { icon:'🎾', s:'aprimon',     title:'Aprimon Collection',   sub:`${groups.length} species · ${mons.length} entries` },
    { icon:'✨', s:'shiny',       title:'Shiny Hunter',         sub:`${activeHunts} active hunt${activeHunts!==1?'s':''} · ${totalShinies} found` },
    { icon:'📊', s:'livingdex',   title:'Living Dex',           sub:`${Object.values(ldexData).filter(d=>d.caught).length} / 1,025 caught` },
    { icon:'⚔️', s:'competitive', title:'Competitive Builder',  sub:'Coming soon' },
    { icon:'🗺️', s:'progress',    title:'Game Progress',        sub:'Coming soon' },
  ];
  const qlHTML = quickLinks.map(ql =>
    `<div class="quick-link" onclick="goSection('${ql.s}')">
      <div class="quick-link-icon">${ql.icon}</div>
      <div class="quick-link-text"><div class="ql-title">${ql.title}</div><div class="ql-sub">${ql.sub}</div></div>
      <div class="quick-link-arrow">›</div>
    </div>`
  ).join('');

  document.getElementById('dashBody').classList.add('dash-body'); document.getElementById('dashBody').innerHTML = `
    <div class="dash-card">
      <div class="dash-card-title">⚡ Recent Activity</div>
      ${actHTML}
    </div>
    <div class="dash-card">
      <div class="dash-card-title">🔗 Quick Links</div>
      ${qlHTML}
    </div>`;
}

const FAILED_FLAVOUR = {
  'fled':         f => `💔 Shiny ${f.species} fled after ${f.count?.toLocaleString()||'?'} encounters. Gone forever.`,
  'ko':           f => `💀 Accidentally KO'd a shiny ${f.species}${f.count ? ' at ' + f.count.toLocaleString() + ' encounters' : ''}. Moment of silence.`,
  'out-of-balls': f => `🎾 Ran out of balls on a shiny ${f.species}. It just walked away.`,
  'reset':        f => `💾 Soft reset a shiny ${f.species}${f.count ? ' after ' + f.count.toLocaleString() + ' encounters' : ''}. Muscle memory is a curse.`,
  'crash':        f => `💻 Game crashed on a shiny ${f.species}. The universe is cruel.`,
  'chain-broke':  f => `🔗 Chain broke on a shiny ${f.species} at ${f.count?.toLocaleString()||'?'} encounters. Start over.`,
  'other':        f => `😭 Lost a shiny ${f.species}${f.count ? ' after ' + f.count.toLocaleString() + ' encounters' : ''}. It hurts.`,
};

function buildActivityFeed() {
  const events = [];

  [...mons].sort((a,b) => b.id - a.id).slice(0,3).forEach(m => {
    events.push({ date: null, priority: 4, text: 'Added ' + (m.isShiny ? '★ ' : '') + m.species + ' in ' + m.ball + ' Ball', color:'#c4b5fd', time:'recently' });
  });

  shinyLog.slice(0,3).forEach(l => {
    events.push({ date: l.date, priority: 2, text: '✨ Caught shiny ' + l.species + ' after ' + (l.count?.toLocaleString()||'?') + ' encounters', color:'#fde68a', time: l.date || 'recently' });
  });

  hunts.filter(h=>h.status==='active').slice(0,2).forEach(h => {
    events.push({ date: h.startDate, priority: 2, text: '🎯 Hunting ' + h.species + ' — ' + h.count.toLocaleString() + ' encounters so far', color:'#c4b5fd', time:'active' });
  });

  // Failed catches — always visible, always painful, sorted to the top
  failedCatches.slice(0,3).forEach(f => {
    const fn = FAILED_FLAVOUR[f.reason] || FAILED_FLAVOUR['other'];
    events.push({ date: f.date, priority: 1, text: fn(f), color:'#fda4af', time: f.date || 'recently' });
  });

  // Sort: failures first (priority 1), then by recency
  events.sort((a,b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.date && b.date) return new Date(b.date) - new Date(a.date);
    return 0;
  });

  return events.slice(0, 8);
}

// updateShinyBadge defined in nav section
function updateWantsBadge() {
  const count = mons.filter(m => m.tradeStatus === 'wanted').length;
  ['wantsBadge','aprimonBadge'].forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.textContent = count || ''; b.style.display = count ? 'inline-flex' : 'none'; }
  });
}


// ── Failed Catches ────────────────────────────────────────────────────────────
const LSF = { FAILS:'at_fails', FID:'at_fid' };
let failedCatches = lsGet(LSF.FAILS, []);
let nextFid       = lsGet(LSF.FID, 1);
let failedHuntId  = null;
let currentLogTab = 'caught';

function openFailedModal(id) {
  failedHuntId = id;
  const h = hunts.find(x => x.id === id); if (!h) return;
  document.getElementById('failed-sub').textContent   = `${h.species} · ${h.count.toLocaleString()} encounters · ${h.method}`;
  document.getElementById('failed-species').value     = h.species;
  document.getElementById('failed-count').value       = h.count;
  document.getElementById('failed-notes').value       = '';
  updateFailedSprite();
  showModal('failedModal');
}
function closeFailedModal() { hideModal('failedModal'); failedHuntId = null; }

function updateFailedSprite() {
  const species = document.getElementById('failed-species')?.value.trim();
  const wrap    = document.getElementById('failed-sprite-wrap');
  if (!wrap) return;
  const src = species ? poke(species, true) : null;
  wrap.innerHTML = src
    ? `<div style="position:absolute;inset:0;border-radius:50%;filter:blur(12px);background:radial-gradient(circle,#fda4af22,transparent)"></div>
       <img src="${src}" width="100" height="100" style="image-rendering:pixelated;position:relative;z-index:1;filter:grayscale(.5) drop-shadow(0 0 12px #fda4af88)" onerror="this.style.display='none'"/>`
    : `<div style="font-size:48px">💔</div>`;
}

function confirmFailed() {
  const h = failedHuntId ? hunts.find(x => x.id === failedHuntId) : null;
  const species = document.getElementById('failed-species').value.trim();
  if (!species) { alert('Species required'); return; }

  const reason = document.getElementById('failed-reason').value;
  const count  = parseInt(document.getElementById('failed-count').value) || (h?.count || 0);
  const notes  = document.getElementById('failed-notes').value.trim();

  const reasonLabels = {
    'fled': 'It fled', 'ko': "Accidentally KO'd", 'out-of-balls': 'Ran out of balls',
    'reset': 'Lost to soft reset', 'crash': 'Game crashed', 'chain-broke': 'Chain broke', 'other': 'Other'
  };

  const entry = {
    id:       nextFid++,
    species,
    method:   h?.method || 'Unknown',
    game:     h?.game   || '',
    count,
    reason,
    reasonLabel: reasonLabels[reason] || reason,
    notes,
    date:     today(),
    huntId:   h?.id || null,
    isFailed: true,
  };

  failedCatches.unshift(entry);
  lsSet(LSF.FAILS, failedCatches);
  lsSet(LSF.FID,   nextFid);

  // Also add a note to dex encounter log so it's visible there
  if (!dexData[species]) dexData[species] = { caught: false, shinyFound: false, encounters: [] };
  dexData[species].encounters.unshift({
    id:      Date.now(),
    date:    today(),
    method:  h?.method || 'Unknown',
    game:    h?.game   || '',
    notes:   `💔 Failed catch — ${reasonLabels[reason]}${count ? ' after ' + count.toLocaleString() + ' encounters' : ''}${notes ? ' — ' + notes : ''}`,
    isShiny: true,
    isFailed: true,
  });
  lsSet(LS.D, dexData);

  closeFailedModal();
  // Switch to failed tab so they see it immediately
  if (currentShinyTab === 'log') {
    switchLogTab('failed');
  } else {
    shinyTab('log');
    switchLogTab('failed');
  }
}

// ── Log tab toggle ────────────────────────────────────────────────────────────
function switchLogTab(tab) {
  currentLogTab = tab;
  ['caught','failed'].forEach(t => {
    const btn = document.getElementById('ltab-' + t);
    if (btn) btn.classList.toggle('active', t === tab);
    if (btn && t === 'failed') btn.classList.toggle('failed-tab', t === tab);
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
  return `
  <div class="shiny-log-card" onclick="openDex('${l.species}')">
    <div class="slc-sprite">
      <div style="position:absolute;inset:0;border-radius:50%;filter:blur(10px);background:radial-gradient(circle,#fde68a33,transparent)"></div>
      ${src ? `<img src="${src}" width="76" height="76" onerror="this.style.display='none'"/>` : `<div style="font-size:36px;filter:drop-shadow(0 0 6px #fde68a)">★</div>`}
    </div>
    <div class="slc-name">${l.species}</div>
    <div class="slc-ball">${bImg(l.ball, 18)}<span style="color:${bc.light};font-size:10px;font-weight:700">${l.ball}</span></div>
    <div class="slc-method">${l.method || ''}${l.game ? ' · ' + l.game.split(' / ')[0] : ''}</div>
    ${l.count > 0 ? `<div class="slc-count">${l.count.toLocaleString()} enc.</div>` : ''}
    ${luckHTML}
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
    const odds = h.hasCharm ? (METHODS[h.method]?.charm||4096) : (METHODS[h.method]?.base||4096);
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

  // Most hunted species (by completed hunt count)
  const bySpecies = {};
  done.forEach(h => { bySpecies[h.species] = (bySpecies[h.species]||0) + 1; });
  const topSpecies = Object.entries(bySpecies).sort((a,b) => b[1]-a[1]).slice(0,3);

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
  document.getElementById('statsPodium').innerHTML = topSpecies.length
    ? topSpecies.map(([sp, cnt], i) => {
        const src = poke(sp, true);
        const ps  = podiumStyles[i] || podiumStyles[2];
        return `
        <div class="podium-card ${ps.cls}">
          <div class="podium-rank">${ps.rank}</div>
          ${src ? `<img src="${src}" width="52" height="52" style="image-rendering:pixelated;filter:drop-shadow(0 0 6px #fde68a55)" onerror="this.style.display='none'"/>` : ''}
          <div class="podium-name">${sp}</div>
          <div class="podium-count">${cnt} hunt${cnt!==1?'s':''}</div>
        </div>`;
      }).join('')
    : '<div style="color:#5b4690;font-size:12px;grid-column:1/-1">No completed hunts yet.</div>';

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


// ── Dex helper functions ──────────────────────────────────────────────────────
function toggleCaught(species, key) {
  if (!dexData[species]) dexData[species] = { caught:false, shinyFound:false, encounters:[] };
  dexData[species][key] = !dexData[species][key];
  lsSet(LS.D, dexData);
}

function toggleLogForm() {
  const f   = document.getElementById('logForm');
  const btn = document.getElementById('logToggleBtn');
  if (!f) return;
  const open = f.style.display !== 'none';
  f.style.display   = open ? 'none' : 'block';
  btn.textContent   = open ? '+ Log' : '✕ Cancel';
}

function saveEncounter(species) {
  const dateEl   = document.getElementById('logDate');
  const methodEl = document.getElementById('logMethod');
  const gameEl   = document.getElementById('logGame');
  const notesEl  = document.getElementById('logNotes');
  const shinyEl  = document.getElementById('logShiny');
  if (!dateEl) return;

  const enc = {
    id:      Date.now(),
    date:    dateEl.value,
    method:  methodEl?.value || 'Unknown',
    game:    gameEl?.value   || '',
    notes:   notesEl?.value.trim() || '',
    isShiny: shinyEl?.checked || false,
  };

  if (!dexData[species]) dexData[species] = { caught:false, shinyFound:false, encounters:[] };
  dexData[species].caught = true;
  if (enc.isShiny) dexData[species].shinyFound = true;
  dexData[species].encounters.unshift(enc);
  lsSet(LS.D, dexData);
  renderMyData(species);
}


// ── Egg move learner lookup ───────────────────────────────────────────────────
const eggLearnerCache = {}; // move-name -> [{ name, sprite }]

async function toggleEggLearners(moveName, rowId, panelId) {
  const panelRow = document.getElementById(panelId + '-row');
  const row      = document.getElementById(rowId);
  if (!panelRow) return;

  const isOpen = panelRow.style.display !== 'none';
  if (isOpen) {
    panelRow.style.display = 'none';
    row?.classList.remove('active');
    return;
  }

  // Close any other open panels
  document.querySelectorAll('[id$="-row"]').forEach(r => {
    if (r.id !== panelId + '-row' && r.id.startsWith('eggpanel')) r.style.display = 'none';
  });
  document.querySelectorAll('.egg-move-row').forEach(r => r.classList.remove('active'));

  panelRow.style.display = 'table-row';
  row?.classList.add('active');

  const grid   = document.getElementById(panelId + '-grid');
  const status = document.getElementById(panelId + '-status');

  // Use cache
  if (eggLearnerCache[moveName]) {
    renderLearnerGrid(eggLearnerCache[moveName], grid, status);
    return;
  }

  if (status) status.textContent = 'Loading…';
  if (grid)   grid.innerHTML = '';

  try {
    // Fetch move data to get learned_by_pokemon
    const data = await fetch('https://pokeapi.co/api/v2/move/' + moveName)
      .then(r => r.ok ? r.json() : null);

    if (!data?.learned_by_pokemon?.length) {
      if (status) status.textContent = 'No learner data found.';
      return;
    }

    const learners = data.learned_by_pokemon.map(p => ({
      name: p.name,
      display: p.name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
      sprite: 'https://img.pokemondb.net/sprites/sword-shield/icon/' + p.name + '.png',
    }));

    eggLearnerCache[moveName] = learners;
    renderLearnerGrid(learners, grid, status);
  } catch(e) {
    if (status) status.textContent = 'Failed to load. Check connection.';
  }
}

function renderLearnerGrid(learners, grid, status) {
  if (status) status.textContent = learners.length + ' Pokémon can learn this move:';

  // Check across ALL owned Pokémon (Aprimon + Living Dex)
  const ownedNames = getAllOwnedNames();

  grid.innerHTML = learners.map(l => {
    const isOwned = ownedNames.has(l.display.toLowerCase()) || ownedNames.has(l.name.toLowerCase());
    return `
      <div class="learner-chip ${isOwned ? 'owned' : ''}" onclick="openDex('${l.display}')" title="${l.display}${isOwned ? ' · In your collection' : ''}">
        <img src="${l.sprite}" width="40" height="30"
          style="image-rendering:pixelated"
          onerror="this.style.display='none'"/>
        <div class="learner-name">${l.display}</div>
      </div>`;
  }).join('');
}



// ── Populate a learner into breeding parent fields ────────────────────────────
function emcPopulateParent(species, e) {
  e?.stopPropagation();

  // Find which parent slot to fill — first empty one, else ask
  const p1 = document.getElementById('bf-p1-species');
  const p2 = document.getElementById('bf-p2-species');

  // If breed modal is open, populate directly
  const modal = document.getElementById('breedModal');
  const modalOpen = modal && modal.style.display !== 'none';

  if (modalOpen) {
    if (!p1?.value) {
      p1.value = species;
      p1.style.borderColor = '#86efac';
      setTimeout(() => p1.style.borderColor = '', 1500);
      showEMCToast(`${species} → Parent 1 ✓`);
    } else if (!p2?.value) {
      p2.value = species;
      p2.style.borderColor = '#86efac';
      setTimeout(() => p2.style.borderColor = '', 1500);
      showEMCToast(`${species} → Parent 2 ✓`);
    } else {
      // Both filled — show mini picker
      showEMCParentPicker(species);
    }
    return;
  }

  // Modal not open — open it with this species pre-filled in P1
  openNewBreedModal();
  setTimeout(() => {
    const p1fresh = document.getElementById('bf-p1-species');
    if (p1fresh) {
      p1fresh.value = species;
      p1fresh.style.borderColor = '#86efac';
      setTimeout(() => p1fresh.style.borderColor = '', 1500);
    }
  }, 50);
}

function showEMCToast(msg) {
  // Reuse the small inline feedback approach
  let el = document.getElementById('emc-populate-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'emc-populate-toast';
    el.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#231a3e;border:1px solid #86efac44;border-radius:12px;padding:8px 16px;font-size:12px;color:#86efac;font-weight:700;z-index:9998;transition:opacity .3s;pointer-events:none';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.opacity = '0', 2000);
}

function showEMCParentPicker(species) {
  const p1 = document.getElementById('bf-p1-species');
  const p2 = document.getElementById('bf-p2-species');
  let el = document.getElementById('emc-parent-picker');
  if (!el) {
    el = document.createElement('div');
    el.id = 'emc-parent-picker';
    el.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1e1535;border:1px solid #c084fc44;border-radius:16px;padding:12px 16px;z-index:9998;font-size:12px;color:#ede9ff;font-weight:600;display:flex;flex-direction:column;gap:8px;min-width:220px;box-shadow:0 8px 32px #00000088';
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div style="font-size:11px;color:#7060a8;margin-bottom:2px">Set <b style="color:#c084fc">${species}</b> as:</div>
    <div style="display:flex;gap:8px">
      <button onclick="document.getElementById('bf-p1-species').value='${species}';showEMCToast('${species} → Parent 1 ✓');this.closest('#emc-parent-picker').remove()"
        style="flex:1;background:#c084fc22;border:1px solid #c084fc44;color:#c084fc;padding:7px;border-radius:10px;cursor:pointer;font-weight:800;font-size:11px">Parent 1</button>
      <button onclick="document.getElementById('bf-p2-species').value='${species}';showEMCToast('${species} → Parent 2 ✓');this.closest('#emc-parent-picker').remove()"
        style="flex:1;background:#86efac22;border:1px solid #86efac44;color:#86efac;padding:7px;border-radius:10px;cursor:pointer;font-weight:800;font-size:11px">Parent 2</button>
      <button onclick="this.closest('#emc-parent-picker').remove()"
        style="background:none;border:1px solid #5b469033;color:#5b4690;padding:7px 10px;border-radius:10px;cursor:pointer;font-size:11px">✕</button>
    </div>`;
  // Auto-dismiss after 5s
  setTimeout(() => el.remove(), 5000);
}

// ══ LIVING DEX ═══════════════════════════════════════════════════════════════

const LDEX_GENS = [
  { gen:1, label:'Generation I',    games:'Red / Blue / Yellow',         start:1,   end:151  },
  { gen:2, label:'Generation II',   games:'Gold / Silver / Crystal',     start:152, end:251  },
  { gen:3, label:'Generation III',  games:'Ruby / Sapphire / Emerald',   start:252, end:386  },
  { gen:4, label:'Generation IV',   games:'Diamond / Pearl / Platinum',  start:387, end:493  },
  { gen:5, label:'Generation V',    games:'Black / White',               start:494, end:649  },
  { gen:6, label:'Generation VI',   games:'X / Y',                       start:650, end:721  },
  { gen:7, label:'Generation VII',  games:'Sun / Moon',                  start:722, end:809  },
  { gen:8, label:'Generation VIII', games:'Sword / Shield',              start:810, end:905  },
  { gen:9, label:'Generation IX',   games:'Scarlet / Violet',            start:906, end:1025 },
];

// PokéAPI name list — fetched once and cached
const LDEX_LS_NAMES = 'at_ldex_names';
const LDEX_LS_DATA  = 'at_ldex';        // { [id]: { caught, shiny } }
let ldexNames  = lsGet(LDEX_LS_NAMES, null); // null = not yet fetched
let ldexData   = lsGet(LDEX_LS_DATA,  {});
let ldexView_  = 'all';
let ldexGen_   = 'all';

// ── Fetch + cache the full Pokémon name list ──────────────────────────────────
async function ensureLdexNames() {
  if (ldexNames && ldexNames.length >= 1025) return ldexNames;
  const el = document.getElementById('ldex-grid');
  if (el) el.innerHTML = '<div class="dex-loading"><div class="dex-loading-spinner"></div><div>Loading Pokédex…</div></div>';
  try {
    const data = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0').then(r => r.json());
    ldexNames = data.results.map((p, i) => ({
      id:      i + 1,
      name:    p.name,
      display: p.name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
    }));
    lsSet(LDEX_LS_NAMES, ldexNames);
  } catch(e) {
    if (el) el.innerHTML = '<div class="empty-state">Could not load Pokédex data.<br/><span style="font-size:11px;color:#5b4690">Check your internet connection.</span></div>';
    return null;
  }
  return ldexNames;
}

// ── Main render ───────────────────────────────────────────────────────────────
async function renderLivingDex() {
  const names = await ensureLdexNames();
  if (!names) return;

  // Sync: any species in dexData also gets reflected here
  names.forEach(p => {
    const entry = dexData[p.display] || dexData[p.name];
    if (entry) {
      if (!ldexData[p.id]) ldexData[p.id] = {};
      if (entry.caught)     ldexData[p.id].caught = true;
      if (entry.shinyFound) ldexData[p.id].shiny  = true;
    }
  });

  renderLdexRings(names);
  renderLdexGrid(names);
}

// ── Progress rings ────────────────────────────────────────────────────────────
function renderLdexRings(names) {
  const total   = names.length;
  const caught  = names.filter(p => ldexData[p.id]?.caught).length;
  const shiny   = names.filter(p => ldexData[p.id]?.shiny).length;
  const cPct    = Math.round(caught / total * 100);
  const sPct    = Math.round(shiny  / total * 100);

  // SVG ring helper
  const ring = (pct, color, sublabel, id) => {
    const r   = 26;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    document.getElementById(id).innerHTML = `
      <svg class="ldex-ring-svg" viewBox="0 0 64 64">
        <circle class="ldex-ring-bg" cx="32" cy="32" r="${r}"/>
        <circle class="ldex-ring-fg" cx="32" cy="32" r="${r}"
          stroke="${color}"
          stroke-dasharray="${circ}"
          stroke-dashoffset="${offset}"/>
      </svg>
      <div class="ldex-ring-label">
        <div class="ldex-ring-pct" style="color:${color}">${pct}%</div>
        <div class="ldex-ring-sub" style="color:${color}88">${sublabel}</div>
      </div>`;
  };

  ring(cPct, '#86efac', 'Caught', 'ldex-ring-normal');
  ring(sPct, '#fde68a', 'Shiny',  'ldex-ring-shiny');

  const ol = document.getElementById('ldex-overall-label');
  const sl = document.getElementById('ldex-shiny-label');
  if (ol) ol.textContent = `${caught.toLocaleString()} / ${total.toLocaleString()} Caught`;
  if (sl) sl.textContent = `★ ${shiny.toLocaleString()} / ${total.toLocaleString()} Shiny`;
}

// ── Grid render ───────────────────────────────────────────────────────────────
function renderLdexGrid(names) {
  const el = document.getElementById('ldex-grid');
  if (!el) return;

  // Apply gen filter
  const gens = ldexGen_ === 'all' ? LDEX_GENS : LDEX_GENS.filter(g => g.gen === ldexGen_);

  el.innerHTML = gens.map(g => {
    const gPokes = names.filter(p => p.id >= g.start && p.id <= g.end);

    // Apply view filter
    let filtered = gPokes;
    if (ldexView_ === 'missing') filtered = gPokes.filter(p => !ldexData[p.id]?.caught);
    if (ldexView_ === 'caught')  filtered = gPokes.filter(p =>  ldexData[p.id]?.caught);
    if (ldexView_ === 'shiny')   filtered = gPokes.filter(p =>  ldexData[p.id]?.shiny);

    if (!filtered.length) return '';

    const gCaught = gPokes.filter(p => ldexData[p.id]?.caught).length;
    const gShiny  = gPokes.filter(p => ldexData[p.id]?.shiny).length;
    const gPct    = Math.round(gCaught / gPokes.length * 100);

    const cells = filtered.map(p => {
      const d       = ldexData[p.id] || {};
      const sprite  = 'https://img.pokemondb.net/sprites/sword-shield/icon/' + p.name + '.png';
      const classes = ['ldex-cell', d.caught ? 'caught' : '', d.shiny ? 'shiny' : ''].filter(Boolean).join(' ');
      return `
        <div class="${classes}" id="ldcell-${p.id}"
          onclick="ldexToggle(${p.id},'${p.display}',event)"
          oncontextmenu="ldexToggleShiny(${p.id},event)">
          <div class="ldex-num">#${String(p.id).padStart(3,'0')}</div>
          <img src="${sprite}" width="40" height="30"
            style="image-rendering:pixelated"
            data-name="${p.name}"
            onerror="(function(img){var n=img.dataset.name;if(img.src.includes('sword-shield')){img.src='https://img.pokemondb.net/sprites/home/normal/'+n+'.png';img.style.width='32px';img.style.height='32px';}else{img.style.opacity='.15';}})(this)"/>
          <div class="ldex-name">${p.display.length > 9 ? p.display.slice(0,8)+'…' : p.display}</div>
          <div class="ldex-dot">
            <div class="ldex-dot-n ${d.caught ? 'on' : ''}"></div>
            <div class="ldex-dot-s ${d.shiny  ? 'on' : ''}"></div>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="ldex-gen-header">
        <div>
          <div class="ldex-gen-title">${g.label}</div>
          <div class="ldex-gen-games">${g.games} · ${gPokes.length} Pokémon</div>
        </div>
        <div class="ldex-gen-prog">
          <span style="color:#86efac">${gCaught}</span>
          <span style="color:#5b4690"> / ${gPokes.length}</span>
          <span style="color:#5b469088;font-size:10px"> (${gPct}%)</span>
          ${gShiny ? `<span style="color:#fde68a;margin-left:8px">★ ${gShiny}</span>` : ''}
        </div>
      </div>
      <div class="ldex-poke-grid">${cells}</div>`;
  }).join('');
}

// ── Toggle caught (tap) / shiny (long-press / right-click) ───────────────────
function ldexToggle(id, display, e) {
  e?.preventDefault();
  if (!ldexData[id]) ldexData[id] = {};
  ldexData[id].caught = !ldexData[id].caught;

  // Sync back to dexData
  if (!dexData[display]) dexData[display] = { caught:false, shinyFound:false, encounters:[] };
  dexData[display].caught = ldexData[id].caught;
  lsSet(LDEX_LS_DATA, ldexData);
  lsSet(LS.D, dexData);

  // Fast DOM update — just update this cell without full re-render
  ldexUpdateCell(id);
  renderLdexRings(ldexNames);
}

function ldexToggleShiny(id, e) {
  e?.preventDefault();
  if (!ldexData[id]) ldexData[id] = {};
  ldexData[id].shiny = !ldexData[id].shiny;
  // If marking shiny, also mark caught
  if (ldexData[id].shiny) ldexData[id].caught = true;

  // Sync dexData
  const p = ldexNames?.find(n => n.id === id);
  if (p) {
    if (!dexData[p.display]) dexData[p.display] = { caught:false, shinyFound:false, encounters:[] };
    dexData[p.display].shinyFound = ldexData[id].shiny;
    if (ldexData[id].shiny) dexData[p.display].caught = true;
    lsSet(LS.D, dexData);
  }

  lsSet(LDEX_LS_DATA, ldexData);
  ldexUpdateCell(id);
  renderLdexRings(ldexNames);
}

function ldexUpdateCell(id) {
  const cell = document.getElementById('ldcell-' + id);
  if (!cell) return;
  const d = ldexData[id] || {};
  cell.className = ['ldex-cell', d.caught ? 'caught' : '', d.shiny ? 'shiny' : ''].filter(Boolean).join(' ');
  const dots = cell.querySelectorAll('.ldex-dot-n, .ldex-dot-s');
  if (dots[0]) dots[0].classList.toggle('on', !!d.caught);
  if (dots[1]) dots[1].classList.toggle('on', !!d.shiny);
}

// ── Filter controls ───────────────────────────────────────────────────────────
function ldexView(v) {
  ldexView_ = v;
  document.querySelectorAll('.ldex-view-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('ldvb-' + v)?.classList.add('active');
  renderLdexGrid(ldexNames);
}

function ldexGen(g) {
  ldexGen_ = g;
  document.querySelectorAll('.ldex-gen-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('ldgt-' + g)?.classList.add('active');
  renderLdexGrid(ldexNames);
}


// ══ BREEDING ══════════════════════════════════════════════════════════════════

const LSB = { PROJECTS:'at_breed', BID:'at_bid' };
let breedProjects = lsGet(LSB.PROJECTS, []);
let nextBid       = lsGet(LSB.BID, 1);
let currentBreedTab = 'projects';

const NATURES_STAT = {
  Hardy:null,  Lonely:'+Atk/-Def', Brave:'+Atk/-Spe',  Adamant:'+Atk/-SpA', Naughty:'+Atk/-SpD',
  Bold:'+Def/-Atk',  Docile:null,   Relaxed:'+Def/-Spe', Impish:'+Def/-SpA',  Lax:'+Def/-SpD',
  Timid:'+Spe/-Atk', Hasty:'+Spe/-Def',  Serious:null, Naive:'+Spe/-SpA',   Jolly:'+Spe/-SpD',
  Modest:'+SpA/-Atk',Mild:'+SpA/-Def',   Quiet:'+SpA/-Spe',Bashful:null,     Rash:'+SpA/-SpD',
  Calm:'+SpD/-Atk',  Gentle:'+SpD/-Def', Sassy:'+SpD/-Spe',Careful:'+SpD/-SpA',Quirky:null,
};

const EGG_CYCLE_STEPS = 256; // modern games use 128 but 256 is the traditional standard

// ── Tab switcher ──────────────────────────────────────────────────────────────
function breedTab(tab) {
  currentBreedTab = tab;
  ['projects','guide','eggmoves'].forEach(t => {
    document.getElementById('btab-' + t)?.classList.toggle('active', t === tab);
    document.getElementById('breed-pane-' + t).style.display = t === tab ? 'block' : 'none';
  });
  // Show + New Project only on the projects tab
  const actionBtn = document.getElementById('headerActionBtn');
  if (actionBtn) {
    if (tab === 'projects') {
      actionBtn.style.display = 'inline-flex';
      actionBtn.textContent = '+ New Project';
    } else {
      actionBtn.style.display = 'none';
    }
  }
  if (tab === 'projects')  renderBreedProjects();
  if (tab === 'guide')     renderIVGuide();
  if (tab === 'eggmoves')  renderEggMoveChains();
}

function renderBreeding() {
  breedTab(currentBreedTab);
}

// ══ PROJECTS TAB ══════════════════════════════════════════════════════════════
function renderBreedProjects() {
  const el = document.getElementById('breed-pane-projects');
  if (!el) return;

  if (!breedProjects.length) {
    el.innerHTML = `
      <div class="empty-state" style="padding:60px 20px">
        No breeding projects yet.<br/>
        <span style="font-size:12px;color:#5b4690">Start one with the + button above.</span>
      </div>`;
    return;
  }

  el.innerHTML = breedProjects.map(p => breedProjectCard(p)).join('');
}

function breedProjectCard(p) {
  const src     = `https://img.pokemondb.net/sprites/home/normal/${p.species.toLowerCase().replace(/\s/g,'-')}.png`;
  const shinySrc= `https://img.pokemondb.net/sprites/home/shiny/${p.species.toLowerCase().replace(/\s/g,'-')}.png`;

  // IV progress — count how many IVs are "done"
  const ivSlots   = p.targetIVs ? p.targetIVs.split('/').map(s => s.trim()) : [];
  const ivDone    = ivSlots.filter(iv => iv === '31' || iv.toLowerCase() === 'x').length;
  const ivTotal   = ivSlots.length || 6;
  const ivPct     = ivTotal ? Math.round(ivDone / ivTotal * 100) : 0;

  // Hatch steps
  const hatchSteps = p.eggCycles ? p.eggCycles * EGG_CYCLE_STEPS : null;
  const hatchFlame = hatchSteps ? Math.ceil(hatchSteps / 2) + ' steps (Flame Body)' : null;

  // Stage progress
  const stages     = p.stages || [];
  const stagesDone = stages.filter(s => s.done).length;

  // Egg moves
  const eggMovesHTML = p.eggMoves?.length
    ? p.eggMoves.map(m => `<span class="tag" style="background:#231a3e;border-color:#c084fc22;color:#c4b5fd;font-size:10px">${m}</span>`).join('')
    : '<span style="color:#3d3070;font-size:11px">None</span>';

  const natureLabel = NATURES_STAT[p.nature] ? `${p.nature} <span style="color:#86efac;font-size:10px">${NATURES_STAT[p.nature]}</span>` : p.nature;
  const isMasuda    = p.masuda;

  return `
  <div class="breed-card" id="bcard-${p.id}">
    <!-- Header -->
    <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px">
      <div style="position:relative;flex-shrink:0">
        <img src="${src}" width="80" height="80" style="image-rendering:pixelated;filter:drop-shadow(0 0 8px #c084fc33)" onerror="this.style.display='none'"/>
        ${p.wantShiny ? `<img src="${shinySrc}" width="48" height="48" style="image-rendering:pixelated;position:absolute;bottom:-8px;right:-8px;filter:drop-shadow(0 0 6px #fde68a88)" onerror="this.style.display='none'"/>` : ''}
      </div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
          <div class="cinzel" style="font-size:17px;font-weight:900;color:#ede9ff">${p.species}</div>
          ${p.ball ? `<span style="font-size:10px;color:${(BALLS[p.ball]||BALLS.Moon).light};font-weight:700">${p.ball} Ball</span>` : ''}
          ${isMasuda ? `<span style="background:#93c5fd22;border:1px solid #93c5fd44;color:#93c5fd;font-size:9px;font-weight:800;padding:2px 8px;border-radius:20px">🌍 Masuda</span>` : ''}
          ${p.wantShiny ? `<span style="background:#fde68a22;border:1px solid #fde68a44;color:#fde68a;font-size:9px;font-weight:800;padding:2px 8px;border-radius:20px">★ Shiny Target</span>` : ''}
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:#7060a8">
          <span>Nature: <span style="color:#c4b5fd;font-weight:700">${p.nature || '—'}</span>${NATURES_STAT[p.nature] ? ` <span style="color:#86efac;font-size:10px">${NATURES_STAT[p.nature]}</span>` : ''}</span>
          <span>IVs: <span style="color:#c4b5fd;font-weight:700">${p.targetIVs || '—'}</span></span>
          <span>Gender: <span style="color:#c4b5fd;font-weight:700">${p.targetGender || 'Any'}</span></span>
        </div>
        ${hatchSteps ? `<div style="font-size:10px;color:#5b4690;margin-top:4px">🥚 ${hatchSteps.toLocaleString()} steps · 🔥 ${hatchFlame}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
        <button onclick="openEditBreed(${p.id})" style="background:#2b1f4e;border:1px solid #5b469033;color:#7060a8;padding:5px 10px;border-radius:8px;cursor:pointer;font-size:11px">✎ Edit</button>
        <button onclick="deleteBreed(${p.id})" style="background:none;border:1px solid #fda4af22;color:#fda4af55;padding:5px 10px;border-radius:8px;cursor:pointer;font-size:11px">✕</button>
      </div>
    </div>

    <!-- Egg moves -->
    <div style="margin-bottom:12px">
      <div style="font-size:9px;color:#5b4690;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px">Egg Moves</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">${eggMovesHTML}</div>
    </div>

    <!-- Parents -->
    ${p.parents?.length ? `
    <div style="margin-bottom:14px">
      <div style="font-size:9px;color:#5b4690;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Breeding Pair</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${p.parents.map(par => {
          const pSrc = `https://img.pokemondb.net/sprites/sword-shield/icon/${par.species.toLowerCase().replace(/\s/g,'-')}.png`;
          return `<div style="background:#1e1535;border:1px solid #5b469033;border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:8px">
            <img src="${pSrc}" width="40" height="30" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
            <div>
              <div style="font-size:12px;font-weight:700;color:#ede9ff">${par.species}</div>
              <div style="font-size:10px;color:#7060a8">${par.ivSpread||'?'} · ${par.nature||'?'}${par.ball ? ' · ' + par.ball + ' Ball' : ''}</div>
              ${par.holdsItem ? `<div style="font-size:9px;color:#fde68a">Holds: ${par.holdsItem}</div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    <!-- IV inheritance progress bar -->
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px">
        <div style="font-size:9px;color:#5b4690;font-weight:800;text-transform:uppercase;letter-spacing:.1em">IV Progress</div>
        <div style="font-size:10px;color:#c4b5fd;font-weight:700">${ivDone} / ${ivTotal} stats</div>
      </div>
      <div style="background:#1a1230;border-radius:20px;height:8px;overflow:hidden">
        <div style="height:100%;background:linear-gradient(90deg,#c084fc,#86efac);border-radius:20px;width:${ivPct}%;transition:width .5s ease"></div>
      </div>
    </div>

    <!-- Breeding stages checklist -->
    ${stages.length ? `
    <div>
      <div style="font-size:9px;color:#5b4690;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Stages (${stagesDone}/${stages.length})</div>
      ${stages.map((s, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #5b469011;cursor:pointer" onclick="toggleBreedStage(${p.id},${i})">
          <div style="width:18px;height:18px;border-radius:5px;border:2px solid ${s.done ? '#86efac' : '#5b4690'};background:${s.done ? '#86efac22' : 'none'};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s">
            ${s.done ? '<span style="color:#86efac;font-size:12px;font-weight:900">✓</span>' : ''}
          </div>
          <span style="font-size:12px;color:${s.done ? '#5b4690' : '#c4b5fd'};${s.done ? 'text-decoration:line-through' : ''}">${s.label}</span>
        </div>`).join('')}
    </div>` : ''}

    <!-- Notes -->
    ${p.notes ? `<div style="margin-top:12px;font-size:11px;color:#7060a8;font-style:italic;border-top:1px solid #5b469022;padding-top:10px">${p.notes}</div>` : ''}
  </div>`;
}

// ── Toggle a stage checkbox ───────────────────────────────────────────────────
function toggleBreedStage(id, stageIdx) {
  const p = breedProjects.find(b => b.id === id);
  if (!p || !p.stages?.[stageIdx]) return;
  p.stages[stageIdx].done = !p.stages[stageIdx].done;
  lsSet(LSB.PROJECTS, breedProjects);
  document.getElementById('bcard-' + id)?.outerHTML && renderBreedProjects();
}

function deleteBreed(id) {
  if (!confirm('Delete this breeding project?')) return;
  breedProjects = breedProjects.filter(p => p.id !== id);
  lsSet(LSB.PROJECTS, breedProjects);
  renderBreedProjects();
}

// ── New / Edit Project Modal ──────────────────────────────────────────────────
let editingBreedId = null;

function openNewBreedModal() {
  setTimeout(() => {
    initSpeciesAC('bf-species', null);
    initSpeciesAC('bf-p1-species', null);
    initSpeciesAC('bf-p2-species', null);
  }, 50);
  editingBreedId = null;
  clearBreedForm();
  document.getElementById('breed-modal-title').textContent = '🥚 New Breeding Project';
  showModal('breedModal');
  updateBreedPreview();
}

function openEditBreed(id) {
  setTimeout(() => {
    initSpeciesAC('bf-species', null);
    initSpeciesAC('bf-p1-species', null);
    initSpeciesAC('bf-p2-species', null);
  }, 50);
  const p = breedProjects.find(b => b.id === id);
  if (!p) return;
  editingBreedId = id;
  document.getElementById('breed-modal-title').textContent = '✎ Edit Project';
  // Populate form
  document.getElementById('bf-species').value    = p.species    || '';
  document.getElementById('bf-ball').value       = p.ball       || 'Moon';
  document.getElementById('bf-nature').value     = p.nature     || 'Jolly';
  document.getElementById('bf-ivs').value        = p.targetIVs  || '5IV -SpAtk';
  document.getElementById('bf-gender').value     = p.targetGender || 'Any';
  document.getElementById('bf-egg-cycles').value = p.eggCycles  || '';
  document.getElementById('bf-masuda').checked   = p.masuda     || false;
  document.getElementById('bf-want-shiny').checked = p.wantShiny || false;
  document.getElementById('bf-notes').value      = p.notes      || '';
  // Parents
  document.getElementById('bf-p1-species').value = p.parents?.[0]?.species  || '';
  document.getElementById('bf-p1-ivs').value     = p.parents?.[0]?.ivSpread || '';
  document.getElementById('bf-p1-nature').value  = p.parents?.[0]?.nature   || '';
  document.getElementById('bf-p1-ball').value    = p.parents?.[0]?.ball     || '';
  document.getElementById('bf-p1-item').value    = p.parents?.[0]?.holdsItem|| '';
  document.getElementById('bf-p2-species').value = p.parents?.[1]?.species  || '';
  document.getElementById('bf-p2-ivs').value     = p.parents?.[1]?.ivSpread || '';
  document.getElementById('bf-p2-nature').value  = p.parents?.[1]?.nature   || '';
  document.getElementById('bf-p2-ball').value    = p.parents?.[1]?.ball     || '';
  document.getElementById('bf-p2-item').value    = p.parents?.[1]?.holdsItem|| '';
  // Egg moves
  breedFormMoves = [...(p.eggMoves || [])];
  renderBreedFormMoves();
  showModal('breedModal');
  updateBreedPreview();
}

function clearBreedForm() {
  ['bf-species','bf-ivs','bf-notes','bf-egg-cycles',
   'bf-p1-species','bf-p1-ivs','bf-p1-nature','bf-p1-ball','bf-p1-item',
   'bf-p2-species','bf-p2-ivs','bf-p2-nature','bf-p2-ball','bf-p2-item'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('bf-ball').value     = 'Moon';
  document.getElementById('bf-nature').value   = 'Jolly';
  document.getElementById('bf-gender').value   = 'Any';
  document.getElementById('bf-masuda').checked = false;
  document.getElementById('bf-want-shiny').checked = false;
  breedFormMoves = [];
  renderBreedFormMoves();
}

let breedFormMoves = [];
function addBreedMove() {
  const inp = document.getElementById('bf-move-input');
  const val = inp?.value.trim();
  if (!val || breedFormMoves.length >= 4) return;
  breedFormMoves.push(val);
  inp.value = '';
  renderBreedFormMoves();
}
function removeBreedMove(i) {
  breedFormMoves.splice(i, 1);
  renderBreedFormMoves();
}
function renderBreedFormMoves() {
  const el = document.getElementById('bf-move-tags');
  if (!el) return;
  el.innerHTML = breedFormMoves.map((m, i) =>
    `<span class="tag" style="background:#231a3e;border-color:#c084fc22;color:#c4b5fd;cursor:pointer" onclick="removeBreedMove(${i})">${m} ✕</span>`
  ).join('');
}

function updateBreedPreview() {
  const sp  = document.getElementById('bf-species')?.value.trim();
  const img = document.getElementById('bf-preview-img');
  if (!img) return;
  if (sp) {
    const src = `https://img.pokemondb.net/sprites/home/normal/${sp.toLowerCase().replace(/\s/g,'-')}.png`;
    img.src = src;
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }
}

function saveBreedProject() {
  const species = document.getElementById('bf-species')?.value.trim();
  if (!species) { alert('Species is required'); return; }

  // Auto-generate stages based on IV target
  const ivTarget = document.getElementById('bf-ivs')?.value.trim() || '';
  const autoStages = buildIVStages(species, ivTarget,
    document.getElementById('bf-masuda')?.checked,
    breedFormMoves.length > 0
  );

  const project = {
    id:           editingBreedId || nextBid++,
    species,
    ball:         document.getElementById('bf-ball')?.value     || 'Moon',
    nature:       document.getElementById('bf-nature')?.value   || 'Jolly',
    targetIVs:    ivTarget,
    targetGender: document.getElementById('bf-gender')?.value   || 'Any',
    eggCycles:    parseInt(document.getElementById('bf-egg-cycles')?.value) || null,
    masuda:       document.getElementById('bf-masuda')?.checked || false,
    wantShiny:    document.getElementById('bf-want-shiny')?.checked || false,
    notes:        document.getElementById('bf-notes')?.value.trim() || '',
    eggMoves:     [...breedFormMoves],
    parents: [
      {
        species:   document.getElementById('bf-p1-species')?.value.trim() || '',
        ivSpread:  document.getElementById('bf-p1-ivs')?.value.trim() || '',
        nature:    document.getElementById('bf-p1-nature')?.value.trim() || '',
        ball:      document.getElementById('bf-p1-ball')?.value.trim() || '',
        holdsItem: document.getElementById('bf-p1-item')?.value.trim() || '',
      },
      {
        species:   document.getElementById('bf-p2-species')?.value.trim() || '',
        ivSpread:  document.getElementById('bf-p2-ivs')?.value.trim() || '',
        nature:    document.getElementById('bf-p2-nature')?.value.trim() || '',
        ball:      document.getElementById('bf-p2-ball')?.value.trim() || '',
        holdsItem: document.getElementById('bf-p2-item')?.value.trim() || '',
      },
    ].filter(p => p.species),
    stages: editingBreedId
      ? (breedProjects.find(b => b.id === editingBreedId)?.stages || autoStages)
      : autoStages,
    createdAt: editingBreedId
      ? (breedProjects.find(b => b.id === editingBreedId)?.createdAt || today())
      : today(),
  };

  if (editingBreedId) {
    breedProjects = breedProjects.map(b => b.id === editingBreedId ? project : b);
  } else {
    breedProjects.push(project);
  }

  lsSet(LSB.PROJECTS, breedProjects);
  lsSet(LSB.BID, nextBid);
  hideModal('breedModal');
  renderBreedProjects();
}

// Auto-generate breeding stages from IV target
function buildIVStages(species, ivTarget, isMasuda, hasEggMoves) {
  const stages = [];
  const ivs    = ivTarget.split('/').map(s => s.trim());
  const count  = ivs.filter(iv => iv === '31').length;

  if (hasEggMoves) {
    stages.push({ label: 'Get egg move parent(s)', done: false });
  }
  stages.push({ label: 'Get Destiny Knot parent', done: false });
  if (!isMasuda) {
    stages.push({ label: 'Get foreign language Ditto / parent', done: false });
  }
  stages.push({ label: `Breed to 4IV (${ivs.filter(iv => iv === '31').slice(0,4).join(' / ') || '31/31/31/31'})`, done: false });
  if (count >= 5) {
    stages.push({ label: 'Breed to 5IV', done: false });
  }
  if (count >= 6) {
    stages.push({ label: 'Breed to 6IV', done: false });
  }
  if (hasEggMoves) {
    stages.push({ label: 'Pass egg moves to final offspring', done: false });
  }
  stages.push({ label: 'Breed for correct nature (Everstone)', done: false });
  if (isMasuda) {
    stages.push({ label: 'Start Masuda hunting for shiny', done: false });
  }
  stages.push({ label: '🎉 Project complete!', done: false });
  return stages;
}

// ══ IV GUIDE TAB ═════════════════════════════════════════════════════════════
function renderIVGuide() {
  document.getElementById('breed-pane-guide').innerHTML = `
    <div class="cinzel" style="font-size:16px;font-weight:900;color:#ede9ff;margin-bottom:16px">IV Breeding Guide</div>

    <div class="breed-guide-section">
      <div class="bgs-title">The Basics</div>
      <div class="bgs-body">When breeding, 5 IVs are inherited from parents (with Destiny Knot).
      The 6th is random. Each parent must hold a <strong>Destiny Knot</strong> to pass 5 IVs instead of the default 3.</div>
    </div>

    <div class="breed-guide-section">
      <div class="bgs-title">Hatch Steps (Egg Cycles)</div>
      <div class="bgs-body">
        Each Pokémon has an <strong>egg cycle</strong> count. One cycle = 257 steps (modern games).
        A Pokémon with Flame Body or Magma Armor in your party halves the required steps.<br/><br/>
        <strong>Common egg cycles:</strong><br/>
        Ditto: 20 cycles (~5,140 steps) · Ralts: 20 · Bagon: 40 · Larvitar: 40 · Beldum: 40 · Riolu: 25
      </div>
    </div>

    <div class="breed-guide-section">
      <div class="bgs-title">Natures</div>
      <div class="bgs-body">Have a parent hold an <strong>Everstone</strong> to pass down its nature.
      One parent should hold Everstone, the other Destiny Knot.<br/><br/>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">
          ${Object.entries(NATURES_STAT).filter(([,v])=>v).map(([n,v])=>
            `<div style="font-size:11px"><span style="color:#c4b5fd;font-weight:700">${n}</span> <span style="color:#86efac">${v}</span></div>`
          ).join('')}
        </div>
      </div>
    </div>

    <div class="breed-guide-section">
      <div class="bgs-title">Gender Ratio Tips</div>
      <div class="bgs-body">
        Ditto can breed with almost any Pokémon regardless of gender. For Pokémon with skewed gender ratios
        (like Ralts at 50/50 or Riolu at 87.5% male), getting a female can take many attempts.
        A female of the target species passes down Apriball.</div>
    </div>

    <div class="breed-guide-section">
      <div class="bgs-title">Apriball Passing</div>
      <div class="bgs-body">
        Only the <strong>female</strong> parent passes down the ball (or either parent if breeding with Ditto).
        Plan which ball you want on the offspring and make sure the female carries it.
      </div>
    </div>

    <div class="breed-guide-section">
      <div class="bgs-title">Masuda Method</div>
      <div class="bgs-body">
        Breed two Pokémon from games in <strong>different languages</strong>. Shiny odds drop from 1/4096 to 1/683
        (1/512 with Shiny Charm). A foreign Ditto is the most flexible option — you only need one.
      </div>
    </div>
  `;
}

// ══ EGG MOVE CHAINS TAB ══════════════════════════════════════════════════════
// ── Unified ownership check: Aprimon + Living Dex caught ────────────────────
function getAllOwnedNames() {
  const names = new Set();
  // Aprimon collection
  mons.forEach(m => {
    names.add(m.species.toLowerCase());
    names.add(m.species.toLowerCase().replace(/\s+/g, '-'));
  });
  // Living Dex caught
  if (ldexNames && ldexData) {
    ldexNames.forEach(p => {
      if (ldexData[p.id]?.caught) {
        names.add(p.name.toLowerCase());
        names.add(p.display.toLowerCase());
        names.add(p.display.toLowerCase().replace(/\s+/g, '-'));
      }
    });
  }
  return names;
}

// ── Fuzzy Pokémon name search ─────────────────────────────────────────────────
function fuzzyMatchPokemon(query, limit) {
  limit = limit || 8;
  if (!ldexNames || !query) return [];
  var q = query.toLowerCase().trim();
  var results = [];
  for (var i = 0; i < ldexNames.length; i++) {
    var p = ldexNames[i];
    var name = p.name.toLowerCase();
    var disp = p.display.toLowerCase();
    if (name === q || disp === q)                  { results.push({ p:p, score:0 }); continue; }
    if (name.startsWith(q) || disp.startsWith(q)) { results.push({ p:p, score:1 }); continue; }
    if (name.includes(q)   || disp.includes(q))   { results.push({ p:p, score:2 }); continue; }
    var dist = levenshtein(q, name.slice(0, q.length + 2));
    if (dist <= 2) { results.push({ p:p, score:3 + dist }); }
  }
  return results.sort(function(a,b){ return a.score-b.score; }).slice(0, limit).map(function(r){ return r.p; });
}

function levenshtein(a, b) {
  var m = a.length, n = b.length;
  var dp = [];
  for (var i = 0; i <= m; i++) {
    dp[i] = [];
    for (var j = 0; j <= n; j++) dp[i][j] = i===0?j:j===0?i:0;
  }
  for (var i = 1; i <= m; i++)
    for (var j = 1; j <= n; j++)
      dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// ── Egg Move Chain Finder — step-by-step ─────────────────────────────────────
let emcSelectedSpecies = null;
let emcPokeData        = null;

function renderEggMoveChains() {
  emcSelectedSpecies = null;
  emcPokeData        = null;
  const el = document.getElementById('breed-pane-eggmoves');
  if (!el) return;
  el.innerHTML = `
    <div class="cinzel" style="font-size:16px;font-weight:900;color:#ede9ff;margin-bottom:4px">Egg Move Chain Finder</div>
    <div style="color:#5b4690;font-size:11px;margin-bottom:20px">Pick a Pokémon, then pick a move — we'll find who can pass it</div>
    <div id="emc-step1">
      <div style="font-size:10px;color:#c084fc;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">① Target Pokémon</div>
      <div style="position:relative;max-width:380px">
        <input class="form-input" id="emc-species-input" placeholder="Start typing a name…"
          oninput="emcSpeciesInput()" autocomplete="off" style="width:100%"/>
        <div id="emc-species-dropdown" style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:200;
          background:#1e1535;border:1px solid #5b469066;border-radius:12px;overflow:hidden;
          box-shadow:0 8px 32px #00000088"></div>
      </div>
    </div>
    <div id="emc-step2" style="display:none;margin-top:20px"></div>
    <div id="emc-step3" style="margin-top:16px"></div>
  `;
}

function emcSpeciesInput() {
  const val = document.getElementById('emc-species-input')?.value.trim();
  const dd  = document.getElementById('emc-species-dropdown');
  if (!dd) return;
  if (!val || val.length < 2) { dd.style.display = 'none'; return; }
  if (!ldexNames) { ensureLdexNames().then(() => emcSpeciesInput()); return; }
  const matches = fuzzyMatchPokemon(val, 8);
  if (!matches.length) { dd.style.display = 'none'; return; }
  dd.style.display = 'block';
  dd.innerHTML = matches.map(p => {
    const sprite = `https://img.pokemondb.net/sprites/sword-shield/icon/${p.name}.png`;
    return `<div onclick="emcSelectSpecies('${p.name}','${p.display.replace(/'/g,"\\'")}','${p.id}')"
      style="display:flex;align-items:center;gap:10px;padding:8px 14px;cursor:pointer;transition:background .12s"
      onmouseover="this.style.background='#2b1f4e'" onmouseout="this.style.background='none'">
      <img src="${sprite}" width="40" height="30" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
      <span style="font-size:13px;color:#ede9ff;font-weight:700">${p.display}</span>
      <span style="font-size:10px;color:#5b4690;margin-left:auto">#${String(p.id).padStart(3,'0')}</span>
    </div>`;
  }).join('');
}

async function emcSelectSpecies(name, display, id) {
  const dd  = document.getElementById('emc-species-dropdown');
  const inp = document.getElementById('emc-species-input');
  const step2 = document.getElementById('emc-step2');
  const step3 = document.getElementById('emc-step3');
  if (dd)    dd.style.display = 'none';
  if (inp)   inp.value = display;
  if (step3) step3.innerHTML = '';
  emcSelectedSpecies = { name, display };
  step2.style.display = 'block';
  step2.innerHTML = `<div class="dex-loading"><div class="dex-loading-spinner"></div><div>Loading egg moves…</div></div>`;

  try {
    const { poke } = await fetchPokeData(display);
    emcPokeData = poke;
    if (!poke) { step2.innerHTML = `<div style="color:#fda4af;font-size:12px">Could not load data for ${display}.</div>`; return; }

    const eggMoves = poke.moves
      .filter(m => m.version_group_details.some(vg => vg.move_learn_method.name === 'egg'))
      .map(m => m.move.name).sort();

    if (!eggMoves.length) {
      step2.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;background:#1e1535;border:1px solid #5b469033;border-radius:14px;padding:14px">
          <img src="https://img.pokemondb.net/sprites/home/normal/${name}.png" width="64" height="64" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
          <div><div class="cinzel" style="font-size:15px;font-weight:900;color:#ede9ff">${display}</div>
          <div style="color:#5b4690;font-size:12px;margin-top:4px">No egg moves found.</div></div>
        </div>`;
      return;
    }

    await Promise.all(eggMoves.map(m => fetchMoveDetails(m)));

    step2.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;background:#1e1535;border:1px solid #5b469033;border-radius:14px;padding:14px;margin-bottom:14px">
        <img src="https://img.pokemondb.net/sprites/home/normal/${name}.png" width="64" height="64" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
        <div>
          <div class="cinzel" style="font-size:15px;font-weight:900;color:#ede9ff">${display}</div>
          <div style="color:#7060a8;font-size:11px;margin-top:2px">${eggMoves.length} egg move${eggMoves.length!==1?'s':''} available</div>
          <button onclick="emcSelectedSpecies=null;document.getElementById('emc-step2').style.display='none';document.getElementById('emc-step3').innerHTML='';document.getElementById('emc-species-input').value='';document.getElementById('emc-species-input').focus()"
            style="margin-top:6px;background:none;border:1px solid #5b469033;color:#5b4690;padding:3px 10px;border-radius:8px;cursor:pointer;font-size:10px">↩ Change</button>
        </div>
      </div>
      <div style="font-size:10px;color:#c084fc;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">② Pick an egg move</div>
      <div style="display:flex;flex-direction:column;gap:4px" id="emc-move-list">
        ${eggMoves.map(mv => {
          const d    = moveCache[mv];
          const label = mv.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ');
          const tc   = d?.type ? (TYPE_COLORS[d.type]||'#888') : '#5b4690';
          const catCls = {physical:'move-cat-physical',special:'move-cat-special',status:'move-cat-status'};
          const catLbl = {physical:'Phys',special:'Spec',status:'Status'};
          return `<div onclick="emcPickMove('${mv}')"
            class="emc-move-row"
            style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#1e1535;border:1px solid #5b469022;border-radius:10px;cursor:pointer;transition:all .15s">
            <span style="font-size:13px;font-weight:700;color:#ede9ff;flex:1">${label}</span>
            ${d?.type ? `<span class="move-type-badge" style="background:${tc}22;color:${tc};border-color:${tc}44">${d.type}</span>` : ''}
            ${d?.category ? `<span class="move-cat-badge ${catCls[d.category]||''}">${catLbl[d.category]||d.category}</span>` : ''}
            ${d?.power ? `<span style="color:#fde68a;font-size:11px;font-weight:800">${d.power}</span>` : ''}
            <span style="color:#5b4690;font-size:16px">›</span>
          </div>`;
        }).join('')}
      </div>`;
  } catch(e) {
    step2.innerHTML = `<div style="color:#fda4af;font-size:12px">Failed: ${e.message}</div>`;
  }
}

async function emcPickMove(moveName) {
  const step3  = document.getElementById('emc-step3');
  if (!step3) return;
  const label  = moveName.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ');

  // Highlight selected move
  document.querySelectorAll('.emc-move-row').forEach(r => r.style.borderColor = '#5b469022');
  event?.currentTarget?.style && (event.currentTarget.style.borderColor = '#c084fc66');

  step3.innerHTML = `<div class="dex-loading"><div class="dex-loading-spinner"></div><div>Finding parents…</div></div>`;
  step3.scrollIntoView({ behavior:'smooth', block:'nearest' });

  try {
    const data = await fetch('https://pokeapi.co/api/v2/move/' + moveName).then(r => r.ok ? r.json() : null);
    if (!data) { step3.innerHTML = '<div style="color:#fda4af">Move data not found.</div>'; return; }

    const learners   = data.learned_by_pokemon || [];
    const ownedNames = getAllOwnedNames();
    const owned      = learners.filter(l => ownedNames.has(l.name.toLowerCase()) || ownedNames.has(l.name.replace(/-/g,' ')));
    const notOwned   = learners.filter(l => !owned.includes(l));

    const chipHTML = (list, hl) => list.map(l => {
      const disp   = l.name.split('-').map(w => w[0].toUpperCase()+w.slice(1)).join(' ');
      const sprite = `https://img.pokemondb.net/sprites/sword-shield/icon/${l.name}.png`;
      // Owned chips get a double-tap option: long-press/right-click → populate into parent field
      const clickHandler = hl
        ? `emcPopulateParent('${disp}', event)`
        : `openDex('${disp}')`;
      return `<div class="learner-chip ${hl?'owned':''}"
        onclick="${clickHandler}"
        title="${disp}${hl ? ' · Tap to use as parent' : ''}">
        <img src="${sprite}" width="40" height="30" style="image-rendering:pixelated" onerror="this.style.display='none'"/>
        <div class="learner-name">${disp}</div>
        ${hl ? '<div style="font-size:8px;color:#86efac;font-weight:800;letter-spacing:.05em;margin-top:1px">USE ›</div>' : ''}
      </div>`;
    }).join('');

    step3.innerHTML = `
      <div style="background:#231a3e;border:1px solid #5b469044;border-radius:16px;padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-size:13px;font-weight:800;color:#ede9ff">${label} → ${emcSelectedSpecies?.display||''}</div>
            <div style="font-size:11px;color:#7060a8">${learners.length} Pokémon can pass this move</div>
          </div>
          <button onclick="this.closest('[style]').parentElement.innerHTML=''"
            style="background:none;border:1px solid #5b469033;color:#5b4690;padding:4px 12px;border-radius:8px;cursor:pointer;font-size:11px">✕</button>
        </div>
        ${owned.length ? `
          <div style="font-size:10px;color:#86efac;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">✓ You Own These (${owned.length})</div>
          <div class="learner-grid" style="margin-bottom:14px">${chipHTML(owned,true)}</div>
        ` : `<div style="font-size:11px;color:#5b4690;margin-bottom:12px">None of your Pokémon can pass this move yet.</div>`}
        ${notOwned.length ? `
          <div style="font-size:10px;color:#7060a8;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Other Learners (${notOwned.length})</div>
          <div class="learner-grid">${chipHTML(notOwned,false)}</div>
        ` : ''}
      </div>`;
  } catch(e) {
    step3.innerHTML = `<div style="color:#fda4af;font-size:12px">Failed: ${e.message}</div>`;
  }
}


// ── Boot ──────────────────────────────────────────────────────────────────────
// Remove old switchTab / headerAction since nav_js redefines them
goSection('home');
updateWantsBadge();
updateShinyBadge();
// nhPreview() called when hunt modal opens

</script>

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


// ══ REUSABLE SPECIES AUTOCOMPLETE ════════════════════════════════════════════
// Usage: initSpeciesAC('input-id', onSelectCallback)
// onSelectCallback(name, display, id) is called when user picks

const acState = {}; // keyed by inputId

function initSpeciesAC(inputId, onSelect) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Wrap input in relative container if not already
  if (!input.parentElement.classList.contains('species-ac-wrap')) {
    const wrap = document.createElement('div');
    wrap.className = 'species-ac-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
  }

  // Create dropdown if not already there
  const ddId = inputId + '-ac-dd';
  let dd = document.getElementById(ddId);
  if (!dd) {
    dd = document.createElement('div');
    dd.id = ddId;
    dd.className = 'species-ac-dropdown';
    input.parentElement.appendChild(dd);
  }

  acState[inputId] = { activeIdx: -1, matches: [], onSelect };

  input.addEventListener('input', () => acRefresh(inputId));
  input.addEventListener('keydown', (e) => acKeydown(e, inputId));
  input.addEventListener('blur', () => setTimeout(() => acClose(inputId), 150));
  input.setAttribute('autocomplete', 'off');
}

function acRefresh(inputId) {
  const input = document.getElementById(inputId);
  const dd    = document.getElementById(inputId + '-ac-dd');
  if (!input || !dd) return;

  const val = input.value.trim();
  if (!val || val.length < 2) { acClose(inputId); return; }

  ensureLdexNames().then(() => {
    const matches = fuzzyMatchPokemon(val, 8);
    acState[inputId].matches   = matches;
    acState[inputId].activeIdx = -1;

    if (!matches.length) { acClose(inputId); return; }

    dd.innerHTML = matches.map((p, i) => {
      const sprite = `https://img.pokemondb.net/sprites/sword-shield/icon/${p.name}.png`;
      return `<div class="species-ac-item" data-idx="${i}"
        onmousedown="acSelect('${inputId}', ${i})"
        onmouseover="acSetActive('${inputId}',${i})">
        <img src="${sprite}" width="36" height="27"
          onerror="this.src='https://img.pokemondb.net/sprites/home/normal/${p.name}.png';this.style.width='28px';this.style.height='28px';this.onerror=null"/>
        <span>${p.display}</span>
        <span class="species-ac-num">#${String(p.id).padStart(3,'0')}</span>
      </div>`;
    }).join('');
    dd.classList.add('open');
  });
}

function acSetActive(inputId, idx) {
  acState[inputId].activeIdx = idx;
  const dd = document.getElementById(inputId + '-ac-dd');
  if (!dd) return;
  dd.querySelectorAll('.species-ac-item').forEach((el, i) =>
    el.classList.toggle('active', i === idx));
}

function acSelect(inputId, idx) {
  const state = acState[inputId];
  if (!state) return;
  const p = state.matches[idx];
  if (!p) return;
  const input = document.getElementById(inputId);
  if (input) input.value = p.display;
  acClose(inputId);
  if (state.onSelect) state.onSelect(p.name, p.display, p.id);
  // Trigger oninput handlers (preview updates etc)
  input?.dispatchEvent(new Event('input', { bubbles:true }));
}

function acKeydown(e, inputId) {
  const state = acState[inputId];
  if (!state || !state.matches.length) return;
  const dd = document.getElementById(inputId + '-ac-dd');
  if (!dd || !dd.classList.contains('open')) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    acSetActive(inputId, Math.min(state.activeIdx + 1, state.matches.length - 1));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    acSetActive(inputId, Math.max(state.activeIdx - 1, 0));
  } else if (e.key === 'Enter' && state.activeIdx >= 0) {
    e.preventDefault();
    acSelect(inputId, state.activeIdx);
  } else if (e.key === 'Escape') {
    acClose(inputId);
  }
}

function acClose(inputId) {
  const dd = document.getElementById(inputId + '-ac-dd');
  if (dd) dd.classList.remove('open');
  if (acState[inputId]) acState[inputId].activeIdx = -1;
}

// ── Init all species fields on boot ──────────────────────────────────────────
function initAllSpeciesAC() {
  // Aprimon add/edit modal
  initSpeciesAC('fSpecies', (name, display) => {
    const prev = document.getElementById('previewSprite');
    if (prev) prev.src = `https://img.pokemondb.net/sprites/home/normal/${name}.png`;
  });

  // New hunt modal
  initSpeciesAC('nh-species', (name, display) => {
    const prev = document.getElementById('nhSpritePreview');
    if (prev) prev.src = `https://img.pokemondb.net/sprites/home/normal/${name}.png`;
  });

  // Breeding project target
  initSpeciesAC('bf-species', (name, display) => {
    // trigger breed preview if it exists
  });

  // Breeding parents
  initSpeciesAC('bf-p1-species', null);
  initSpeciesAC('bf-p2-species', null);
}


// ══ TRAINER NAME ═════════════════════════════════════════════════════════════
const LS_TRAINER_NAME = 'at_trainer_name';
let trainerName = lsGet(LS_TRAINER_NAME, null);

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

// ── Boot: run ALL checks after every const/let is initialised ───────────────
initAllSpeciesAC();
checkShinyRotomUnlock();
checkLivingDexComplete();
applyGoldTheme();
applyShinyRotom();
applyLightMode();

// Boot greeting — show onboarding first if new user, else greet by name
const isReturning = checkTrainerOnboarding();
if (isReturning) {
  setTimeout(() => {
    const hr = new Date().getHours();
    let timeKey;
    if      (hr >= 5  && hr < 9)  timeKey = 'boot_morning';
    else if (hr >= 9  && hr < 17) timeKey = 'boot_afternoon';
    else if (hr >= 17 && hr < 21) timeKey = 'boot_evening';
    else if (hr >= 21 || hr < 2)  timeKey = 'boot_night';
    else                           timeKey = 'boot_earlyMorning';
    rotomSay(timeKey);
  }, 800);
}

// Start idle chatter
rotomIdleTimer = setTimeout(rotomIdle, 120000 + Math.random() * 60000);
