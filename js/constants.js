const BALLS={"Poké":{accent:"#EF4444",light:"#FCA5A5",bg:"#2e1a1a"},Friend:{accent:"#4CAF50",light:"#81C784",bg:"#3a2e6e"},Love:{accent:"#E91E8B",light:"#F48FB1",bg:"#2e1a24"},Lure:{accent:"#00BCD4",light:"#80DEEA",bg:"#1a2630"},Moon:{accent:"#7986CB",light:"#9FA8DA",bg:"#1a1c2e"},Dream:{accent:"#CE93D8",light:"#E1BEE7",bg:"#221a2e"},Beast:{accent:"#FF9800",light:"#FFCC80",bg:"#2e1f0a"},Fast:{accent:"#C6D82A",light:"#E6EE9C",bg:"#2a2060"},Heavy:{accent:"#90A4AE",light:"#B0BEC5",bg:"#1a1f22"},Level:{accent:"#FF5722",light:"#FFAB91",bg:"#3d1a40"},Safari:{accent:"#8BC34A",light:"#C5E1A5",bg:"#2a1f5a"},Sport:{accent:"#FFC107",light:"#FFE082",bg:"#2a2510"}};
const BALL_NAMES=Object.keys(BALLS);
const BADGE={available:{bg:"#1f2d5e",border:"#a78bfa",text:"#c084fc",label:"✓ Available"},keep:{bg:"#1f2d5e",border:"#a78bfa",text:"#e9d5ff",label:"♦ Keeping"},"trade-only":{bg:"#3d2040",border:"#fdba74",text:"#fdba74",label:"⇄ Trade Only"},wanted:{bg:"#3d1530",border:"#f47284",text:"#fca5a5",label:"✦ Wanted"}};
const GAMES=[
  // Gen 1 (8192)
  "Red/Blue","Yellow",
  // Gen 2 (8192)
  "Gold/Silver","Crystal",
  // Gen 3 (8192)
  "Ruby/Sapphire","Emerald","FireRed/LeafGreen","Colosseum/XD",
  // Gen 4 (8192)
  "Diamond/Pearl","Platinum","HeartGold/SoulSilver",
  // Gen 5 (8192)
  "Black/White","Black 2/White 2",
  // Gen 6+ (4096)
  "X/Y","Omega Ruby/Alpha Sapphire",
  "Sun/Moon","Ultra Sun/Ultra Moon",
  "Let's Go Pikachu/Eevee",
  "Sword/Shield",
  "Brilliant Diamond/Shining Pearl",
  "Legends: Arceus",
  "Scarlet/Violet",
  "HOME"
];

// Games that use old 1/8192 base odds (Gen 1–5)
const OLD_ODDS_GAMES = new Set([
  "Red/Blue","Yellow","Gold/Silver","Crystal",
  "Ruby/Sapphire","Emerald","FireRed/LeafGreen","Colosseum/XD",
  "Diamond/Pearl","Platinum","HeartGold/SoulSilver",
  "Black/White","Black 2/White 2"
]);

function getBaseOddsForGame(game) {
  return OLD_ODDS_GAMES.has(game) ? 8192 : 4096;
}
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
