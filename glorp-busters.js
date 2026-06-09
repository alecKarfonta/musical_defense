"use strict";
/* ================= YOUTUBE PLAYABLES SHIM ================= */
const YT = (typeof ytgame !== "undefined") ? ytgame : null;
function ytFirstFrame(){ try{ YT && YT.game.firstFrameReady(); }catch(e){} }
function ytGameReady(){ try{ YT && YT.game.gameReady(); }catch(e){} }
function ytSendScore(v){ try{ YT && YT.engagement.sendScore({value: Math.floor(v)}); }catch(e){} }
function ytSave(obj){ try{ YT && YT.game.saveData(JSON.stringify(obj)); }catch(e){} }
function ytLoad(){
  return new Promise(res=>{
    if(!YT||!YT.game||!YT.game.loadData){ res(null); return; }
    try{
      YT.game.loadData().then(d=>{
        try{ res(d ? JSON.parse(d) : null); }catch(e){ res(null); }
      }).catch(()=>res(null));
    }catch(e){ res(null); }
  });
}

/* ================= LEADERBOARD ================= */
const LB_KEY="glorpBustersLb", LB_MAX=10;
let leaderboard=[], pendingScore=null, iniSlot=0, iniChars=["A","A","A"], lbHighlight=-1;

function normalizeLb(rows){
  if(!Array.isArray(rows)) return [];
  return rows
    .filter(e=>e&&typeof e.score==="number"&&e.score>0)
    .map(e=>({
      score:Math.floor(e.score),
      initials:String(e.initials||"???").slice(0,3).toUpperCase().replace(/[^A-Z]/g,"?")||"???",
      wave:Math.floor(e.wave||0),
      kills:Math.floor(e.kills||0),
      won:!!e.won,
      ts:e.ts||0,
    }))
    .sort((a,b)=>b.score-a.score)
    .slice(0,LB_MAX);
}
function mergeLeaderboards(a,b){
  return normalizeLb([...(a||[]),...(b||[])]);
}
function loadLeaderboardLocal(){
  try{
    const raw=localStorage.getItem(LB_KEY);
    if(raw) leaderboard=normalizeLb(JSON.parse(raw));
  }catch(e){ leaderboard=[]; }
}
function persistLeaderboard(){
  try{ localStorage.setItem(LB_KEY, JSON.stringify(leaderboard)); }catch(e){}
  const top=leaderboard[0];
  ytSave({leaderboard, bestWave:top?top.wave:0, score:top?top.score:0});
}
function qualifiesForBoard(sc){
  if(sc<=0) return false;
  if(leaderboard.length<LB_MAX) return true;
  return sc>leaderboard[leaderboard.length-1].score;
}
function renderLeaderboard(){
  const rows=$("lbRows");
  if(!rows) return;
  rows.innerHTML="";
  for(let i=0;i<LB_MAX;i++){
    const e=leaderboard[i];
    const row=document.createElement("div");
    row.className="lbRow"+(e?"":" empty")+(i===0&&e?" rank1":i===1&&e?" rank2":i===2&&e?" rank3":"")+(i===lbHighlight?" newEntry":"");
    if(e){
      row.innerHTML="<span>"+(i+1)+".</span><span>"+e.score.toLocaleString()+"</span><span>"+e.initials+"</span><span>"+e.wave+"</span>";
    }else{
      row.innerHTML="<span>"+(i+1)+".</span><span>-----</span><span>---</span><span>--</span>";
    }
    rows.appendChild(row);
  }
}
function refreshIniDisplay(){
  document.querySelectorAll(".ini-char").forEach(el=>{
    const i=parseInt(el.getAttribute("data-i"),10);
    el.textContent=iniChars[i];
    el.classList.toggle("sel", i===iniSlot);
  });
}
function showInitialsEntry(){
  pendingScore={score,kills,won:state==="win",wave};
  iniSlot=0; iniChars=["A","A","A"];
  refreshIniDisplay();
  $("initialsPanel").classList.remove("hidden");
  $("btnStart").classList.add("hidden");
}
function hideInitialsEntry(){
  pendingScore=null;
  $("initialsPanel").classList.add("hidden");
  $("btnStart").classList.remove("hidden");
}
function cycleIniLetter(dir){
  const c=iniChars[iniSlot].charCodeAt(0);
  let n=c+(dir>0?1:-1);
  if(n<65) n=90;
  if(n>90) n=65;
  iniChars[iniSlot]=String.fromCharCode(n);
  refreshIniDisplay();
}
function commitInitials(){
  if(!pendingScore) return;
  const initials=iniChars.join(""), ts=Date.now();
  leaderboard=normalizeLb([...leaderboard, {
    score:pendingScore.score,
    initials,
    wave:pendingScore.wave,
    kills:pendingScore.kills,
    won:pendingScore.won,
    ts,
  }]);
  lbHighlight=leaderboard.findIndex(e=>e.ts===ts);
  persistLeaderboard();
  hideInitialsEntry();
  renderLeaderboard();
  sfxClear();
}
function handleIniKey(ev){
  if(!pendingScore) return false;
  if(ev.code==="ArrowUp"){ ev.preventDefault(); cycleIniLetter(1); return true; }
  if(ev.code==="ArrowDown"){ ev.preventDefault(); cycleIniLetter(-1); return true; }
  if(ev.code==="ArrowLeft"){ ev.preventDefault(); iniSlot=Math.max(0,iniSlot-1); refreshIniDisplay(); return true; }
  if(ev.code==="ArrowRight"){ ev.preventDefault(); iniSlot=Math.min(2,iniSlot+1); refreshIniDisplay(); return true; }
  if(ev.code==="Space"||ev.code==="Enter"){
    ev.preventDefault();
    if(iniSlot<2){ iniSlot++; refreshIniDisplay(); }
    else commitInitials();
    return true;
  }
  return false;
}
async function initLeaderboard(){
  loadLeaderboardLocal();
  const cloud=await ytLoad();
  if(cloud&&cloud.leaderboard){
    const merged=mergeLeaderboards(leaderboard, cloud.leaderboard);
    if(merged.length!==leaderboard.length||merged.some((e,i)=>e.score!==leaderboard[i]?.score))
      leaderboard=merged;
    persistLeaderboard();
  }
  renderLeaderboard();
}
function setOverlayVisible(show){
  $("overlay").classList.toggle("hidden", !show);
  $("leaderboard").classList.toggle("hidden", !show);
}

/* ================= CONSTANTS & DATA ================= */
const COLS=24, ROWS=13, CELL=40, W=COLS*CELL, H=ROWS*CELL;
const SPAWN={c:0,r:6}, EXIT={c:23,r:6};
const D4=[[1,0],[-1,0],[0,1],[0,-1]];
const cv=document.getElementById("cv"), ctx=cv.getContext("2d");

const TDEF={
  zap:{ name:"ZAP-R 9000", col:"#00e5ff", cost:50, dmg:12, rate:2.2, range:105, power:1, air:true, grd:true,
        blurb:"Entry-level bug fryer. Reliable. Union-made.",
        l3:"L3 · CHAIN LIGHTNING: arcs to extra bugs",
        syn:"Adjacent ZAP-Rs link grids: +15% fire rate each" },
  frz:{ name:"CRYO-MIST", col:"#7df9ff", cost:70, dmg:5, rate:1.6, range:95, power:2, air:true, grd:true, slow:[0.55,0.47,0.38], slowDur:1.7,
        blurb:"Slows bugs to a polite crawl.",
        l3:"L3 · FLASH FREEZE: periodic freeze nova",
        syn:"SPLAT-O-MATICs adjacent to CRYO gain SHATTER" },
  splat:{name:"SPLAT-O-MATIC", col:"#ff9f1c", cost:90, dmg:36, rate:0.55, range:135, power:2, air:false, grd:true, splash:48,
        blurb:"Lobs plasma goop. Big splash, purges corruption fast. Ground only.",
        l3:"L3 · NAPALM GOO: +35% radius, ignites bugs",
        syn:"Adjacent CRYO grants SHATTER: +50% dmg to slowed bugs" },
  lzr:{ name:"LAZOR-BRO", col:"#ff2079", cost:120, dmg:15, rate:0, range:125, power:3, air:true, grd:true, beam:true,
        blurb:"Ramping beam. Strips armor plates 3× faster.",
        l3:"L3 · MAX RAMP: ramp cap doubled (up to +300% dmg)",
        syn:"Adjacent ZAP-R doubles ramp speed (OVERCLOCK)" },
  flak:{name:"FLAK DADDY", col:"#b6ff00", cost:80, dmg:14, rate:1.6, range:155, power:2, air:true, grd:false,
        blurb:"Sky-bug specialist. Useless vs ground. Knows it. Doesn't care.",
        l3:"L3 · AIRBURST: shells splash in the air",
        syn:"Loves AMP pylons like everyone else" },
  amp:{ name:"AMP PYLON", col:"#c77dff", cost:100, dmg:0, rate:0, range:0, power:0, gen:[8,11,15], buff:[0.25,0.32,0.45],
        blurb:"No gun. Big personality. Buffs all 8 neighbors and feeds the grid.",
        l3:"L3 · OVERDRIVE: +45% neighbor dmg, +15 power",
        syn:"Stack mazes around pylons for maximum corporate efficiency" },
  wall:{name:"BULKHEAD", col:"#8d93b8", cost:15, dmg:0, rate:0, range:0, power:0, air:false, grd:false,
        blurb:"A wall. Doesn't shoot, doesn't draw power. Bugs hate walking around it.",
        l3:"It's a wall.",
        syn:"Cheap maze filler — save credits for the real guns" },
};
const TKEYS=["zap","frz","splat","lzr","flak","amp","wall"];

const EDEF={
  grub: {nm:"GLORP GRUB",  hp:24,  spd:55,  bounty:4,  r:9,  col:"#7CFC00"},
  skit: {nm:"SKITTERLING", hp:14,  spd:102, bounty:3,  r:7,  col:"#ffe14d"},
  brood:{nm:"BROODMOTHER", hp:100, spd:42,  bounty:10, r:13, col:"#39d98a", split:4},
  chonk:{nm:"CHONK",       hp:150, spd:33,  bounty:14, r:13, col:"#ff7eb6", plate:70},
  wasp: {nm:"NEON WASP",   hp:36,  spd:86,  bounty:6,  r:8,  col:"#bb6bff", air:true},
  boss: {nm:"MEGAGLORP",   hp:1300,spd:26,  bounty:130,r:20, col:"#ff3864", plate:420, boss:true, slowFloor:0.75},
};
const AFFIX={
  shrieker:{nm:"SHRIEKER", col:"#ff5050", tip:"EMPs nearby turrets on death"},
  juker:   {nm:"JUKER",    col:"#ffe14d", tip:"periodic speed bursts"},
  mender:  {nm:"MENDER",   col:"#5dff9e", tip:"heals nearby bugs"},
};
const AFFKEYS=["shrieker","juker","mender"];

const RES=[
 {id:"dmg",  nm:"HOTTER PLASMA",    desc:"+10% global damage per tier",            max:3, cost:[6,12,20]},
 {id:"grid", nm:"GRID OVERHAUL",    desc:"+8 power capacity per tier",             max:3, cost:[5,9,14]},
 {id:"cryo", nm:"DEEP FREEZE",      desc:"Slows are 8% stronger per tier",         max:2, cost:[6,12]},
 {id:"chain",nm:"FORKED LIGHTNING", desc:"+1 chain target for L3 ZAP-R per tier",  max:2, cost:[7,14]},
 {id:"scrap",nm:"SCRAP LOGISTICS",  desc:"Sell refund 70% → 80% → 90%",            max:2, cost:[4,8]},
 {id:"purge",nm:"GOO SOLVENT",      desc:"Turrets purge corruption 50% faster/tier",max:2, cost:[5,10]},
];

const QUIPS={
  wave:["FRESH GLORP INBOUND","HERE THEY COME — LOOK BUSY","CORPORATE SENT MORE BUGS","INCOMING: BILLABLE HOURS","BUG O'CLOCK"],
  boss:["⚠ MEGAGLORP DETECTED ⚠","IT'S GOT A LINKEDIN PROFILE","HR SAYS DON'T PANIC. PANIC."],
  leak:["BUG IN THE BREAK ROOM!","THAT'S COMING OUT OF YOUR PAY","CONTAINMENT? NEVER HEARD OF IT"],
  clear:["WAVE CLEAR — PIZZA PARTY (1 SLICE)","SHIFT SURVIVED","QUOTA MET. QUOTA RAISED."],
  crack:["SHELL'S OFF!","DE-SHELLED!","NAKED BUG!","WARRANTY VOID!"],
};
const pick=a=>a[Math.floor(Math.random()*a.length)];

/* ================= STATE ================= */
let grid, flow, towers, enemies, projs, parts, floaters, beams, cor;
let credits, lives, wave, score, kills, bio, speedMul, state, soundOn=true;
let buildSel=null, towerSel=null, hover=null, paused=false, endless=false;
let spawnQ, spawnT, waveActive, waveSpawnTotal=0;
let shake=0, annT=0, time=0, corT=0;
let powerCap=12, powerLoad=0, brown=1;
let res={};

function init(){
  grid=new Array(COLS*ROWS).fill(null);
  cor=new Float32Array(COLS*ROWS);
  // seed corruption near the spawn side
  for(let r=4;r<=8;r++){ cor[idx(0,r)]=1; if(r>=5&&r<=7) cor[idx(1,r)]=1; }
  towers=[]; enemies=[]; projs=[]; parts=[]; floaters=[]; beams=[];
  credits=230; lives=20; wave=0; score=0; kills=0; bio=0; speedMul=1;
  buildSel=null; towerSel=null; spawnQ=[]; spawnT=0; waveActive=false; endless=false;
  shake=0; corT=0; res={}; for(const x of RES) res[x.id]=0;
  beatClock=0; schedBeat=0; barNum=0; killQ=0; runStep=0; muteUntilBeat=0; combo=0; comboT=0;
  waveSpawnTotal=0; threatSmooth=0; threatLatched=0; reanchor();
  flow=computeFlow(); recalc(); refreshUI(); refreshInfo(); renderResearch();
  document.getElementById("btnSpeed").textContent="1×";
}

/* ================= GRID / PATHING ================= */
const idx=(c,r)=>r*COLS+c;
const inB=(c,r)=>c>=0&&r>=0&&c<COLS&&r<ROWS;
function computeFlow(){
  const d=new Array(COLS*ROWS).fill(Infinity);
  const q=[idx(EXIT.c,EXIT.r)]; d[q[0]]=0;
  let head=0;
  while(head<q.length){
    const i=q[head++], c=i%COLS, r=(i-c)/COLS;
    for(const [dc,dr] of D4){
      const nc=c+dc, nr=r+dr;
      if(!inB(nc,nr)) continue;
      const ni=idx(nc,nr);
      if(grid[ni]||d[ni]<Infinity) continue;
      d[ni]=d[i]+1; q.push(ni);
    }
  }
  return d;
}
function recalc(){
  powerCap=12+8*res.grid; powerLoad=0;
  for(const t of towers){
    if(t.type==="amp") powerCap+=TDEF.amp.gen[t.lvl-1];
    else powerLoad+=TDEF[t.type].power;
  }
  brown = powerLoad>powerCap ? Math.max(0.4,powerCap/powerLoad) : 1;
  for(const t of towers){
    t.buff=1; t.rateMul=1; t.shatter=false; t.rampMul=1; t.tags=[];
    let ampN=0;
    for(let dc=-1;dc<=1;dc++)for(let dr=-1;dr<=1;dr++){
      if(!dc&&!dr) continue;
      const c=t.c+dc, r=t.r+dr;
      if(!inB(c,r)) continue;
      const n=grid[idx(c,r)];
      if(!n) continue;
      if(n.type==="amp" && t.type!=="amp"){ t.buff+=TDEF.amp.buff[n.lvl-1]; ampN++; }
      if(n.type==="zap" && t.type==="zap") t.rateMul+=0.15;
      if(n.type==="frz" && t.type==="splat") t.shatter=true;
      if(n.type==="zap" && t.type==="lzr") t.rampMul=2;
    }
    t.buff=Math.min(t.buff,2.2); t.rateMul=Math.min(t.rateMul,1.6);
    if(ampN) t.tags.push("AMPED +"+Math.round((t.buff-1)*100)+"%");
    if(t.rateMul>1) t.tags.push("GRID LINK +"+Math.round((t.rateMul-1)*100)+"% RATE");
    if(t.shatter) t.tags.push("SHATTER vs SLOWED");
    if(t.rampMul>1) t.tags.push("OVERCLOCK ×2 RAMP");
  }
  refreshUI();
}
function makeTower(type,c,r){
  return {type,c,r,lvl:1,cd:0,cdB:0,ramp:0,target:null,buff:1,rateMul:1,rampMul:1,shatter:false,emp:0,
          novaCd:0,x:c*CELL+CELL/2,y:r*CELL+CELL/2,invested:TDEF[type].cost,tags:[],anim:Math.random()*9,voice:null};
}
function tStats(t){
  const d=TDEF[t.type], m=Math.pow(1.6,t.lvl-1);
  return {
    dmg:d.dmg*m*t.buff*(1+0.1*res.dmg),
    range:d.range*Math.pow(1.12,t.lvl-1),
    rate:(d.rate||0)*Math.pow(1.1,t.lvl-1)*t.rateMul*brown,
    splash:d.splash ? d.splash*(t.lvl>=3?1.35:1) : 0,
    slow:d.slow ? Math.max(0.18, d.slow[t.lvl-1]*(1-0.08*res.cryo)) : 0,
  };
}
function upCost(t){ return Math.round(TDEF[t.type].cost*(t.lvl===1?0.9:1.5)); }
function sellVal(t){ return Math.round(t.invested*(0.7+0.1*res.scrap)); }

function tryPlace(c,r){
  const d=TDEF[buildSel];
  if(credits<d.cost){ announce("INSUFFICIENT CREDITS, CONTRACTOR"); sfxNo(); return; }
  if(!inB(c,r)||grid[idx(c,r)]||(c===SPAWN.c&&r===SPAWN.r)||(c===EXIT.c&&r===EXIT.r)){ sfxNo(); return; }
  if(cor[idx(c,r)]>=0.5){ announce("TILE'S GOO'D — PURGE IT FIRST"); sfxNo(); return; }
  for(const e of enemies){
    if(!e.air && Math.abs(e.x-(c*CELL+CELL/2))<CELL*0.8 && Math.abs(e.y-(r*CELL+CELL/2))<CELL*0.8){
      announce("THERE'S A BUG STANDING THERE"); sfxNo(); return;
    }
  }
  const t=makeTower(buildSel,c,r);
  grid[idx(c,r)]=t;
  const f=computeFlow();
  let ok=f[idx(SPAWN.c,SPAWN.r)]<Infinity;
  if(ok) for(const e of enemies){ if(!e.air&&!e.dead&&f[idx(e.c,e.r2)]===Infinity){ ok=false; break; } }
  if(!ok){
    grid[idx(c,r)]=null;
    announce("CAN'T FULLY WALL 'EM IN — OSHA RULE #7"); sfxNo(); return;
  }
  flow=f; towers.push(t); credits-=d.cost;
  const ph=((beatClock%1)+1)%1;
  if(state==="play"&&(ph<0.12||ph>0.88)){
    const rb=Math.max(2,Math.round(d.cost*0.06));
    credits+=rb;
    floaters.push({x:t.x,y:t.y-26,t:1.0,txt:"ON BEAT +"+rb+" CR",col:"#00e5ff"});
    sfxOnBeat();
  }
  for(const e of enemies){ if(!e.air&&e.tc===c&&e.tr===r) e.hasT=false; }
  recalc(); sfxPlace(t); burst(t.x,t.y,d.col,10);
  towerSel=t; refreshInfo();
}
function sellTower(t){
  credits+=sellVal(t);
  laserOff(t);
  grid[idx(t.c,t.r)]=null;
  towers.splice(towers.indexOf(t),1);
  flow=computeFlow();
  for(const e of enemies) if(!e.air) e.hasT=false;
  if(towerSel===t) towerSel=null;
  recalc(); refreshInfo(); burst(t.x,t.y,"#888",8); sfxSell();
}
function upgradeTower(t){
  if(t.lvl>=3||t.type==="wall") return;
  const c=upCost(t);
  if(credits<c){ announce("UPGRADE DENIED: BROKE"); sfxNo(); return; }
  credits-=c; t.invested+=c; t.lvl++;
  recalc(); refreshInfo(); burst(t.x,t.y,TDEF[t.type].col,16); sfxUp();
}

/* ================= CORRUPTION (the goo) ================= */
function corStep(){
  // count corrupted, cap total spread at ~35% of cells
  let total=0; for(let i=0;i<cor.length;i++) if(cor[i]>=0.5) total++;
  if(total>COLS*ROWS*0.35) return;
  const frontier=[];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const i=idx(c,r);
    if(cor[i]>=1||grid[i]) continue;
    if(c===EXIT.c&&r===EXIT.r) continue;
    for(const [dc,dr] of D4){
      const nc=c+dc,nr=r+dr;
      if(inB(nc,nr)&&cor[idx(nc,nr)]>=1){ frontier.push(i); break; }
    }
  }
  const k=1+Math.floor(wave/6);
  for(let j=0;j<k&&frontier.length;j++){
    const i=frontier.splice(Math.floor(Math.random()*frontier.length),1)[0];
    cor[i]=Math.min(1,cor[i]+0.5);
  }
  // partially-grown cells keep growing
  for(let i=0;i<cor.length;i++) if(cor[i]>0&&cor[i]<1) cor[i]=Math.min(1,cor[i]+0.5);
}
function corPurge(dt){
  const rate=0.05*(1+0.5*res.purge)*dt;
  for(const t of towers){
    if(t.emp>0||t.type==="wall") continue;
    const R=2; // purge in a 2-cell radius square around each turret
    for(let dc=-R;dc<=R;dc++)for(let dr=-R;dr<=R;dr++){
      const c=t.c+dc,r=t.r+dr;
      if(!inB(c,r)) continue;
      const i=idx(c,r);
      if(cor[i]>0&&!(c<=1&&r>=4&&r<=8)) cor[i]=Math.max(0,cor[i]-rate);
    }
  }
}

/* ================= ENEMIES & WAVES ================= */
function lateWaveT(n){ return Math.max(0,(n||0)-11); }
function hpMul(n){
  const base=Math.pow(1.135,n-1)*(1+n*0.03);
  const t=lateWaveT(n);
  if(!t) return base;
  return base*(1+t*0.075)*Math.pow(1.07,t);
}
function eliteChance(n){
  if(n<6) return 0;
  if(n<=11) return Math.min(0.16,0.03+n*0.007);
  return Math.min(0.34,0.13+(n-11)*0.014);
}
function spawnEnemy(type,forceElite){
  const d=EDEF[type], m=hpMul(wave);
  const spdBoost=lateWaveT(wave)?1+lateWaveT(wave)*0.014:1;
  const e={type, nm:d.nm, hp:d.hp*m, maxhp:d.hp*m, spd:d.spd*spdBoost, bounty:d.bounty+Math.floor(wave/3),
    r:d.r, col:d.col, air:!!d.air, boss:!!d.boss, slowFloor:d.slowFloor||0,
    split:d.split||0, slowMul:1, slowT:0, burnT:0, burnD:0, dead:false, exposed:false,
    plateHp:d.plate?d.plate*m:0, plateMax:d.plate?d.plate*m:0,
    affix:null, jukeT:0, jukeOn:0,
    wob:Math.random()*9, x:-30-Math.random()*40, y:0, c:SPAWN.c, r2:SPAWN.r, hasT:false};
  // elites: wave 6+, ramping chance, never bosses
  if(!e.boss&&(forceElite||(wave>=6&&Math.random()<eliteChance(wave)))){
    e.affix=pick(AFFKEYS);
    e.hp*=2.2; e.maxhp=e.hp; e.bounty*=3; e.r*=1.2;
    if(e.plateHp){ e.plateHp*=1.6; e.plateMax=e.plateHp; }
  }
  if(e.air){
    e.y=(2+Math.random()*(ROWS-4))*CELL+CELL/2;
    e.ty=EXIT.r*CELL+CELL/2;
  }else{
    e.y=SPAWN.r*CELL+CELL/2+(Math.random()*14-7);
    e.tc=SPAWN.c; e.tr=SPAWN.r;
    e.tx=SPAWN.c*CELL+CELL/2; e.tyy=SPAWN.r*CELL+CELL/2; e.hasT=true;
  }
  enemies.push(e);
}
function pickNext(e){
  const here=idx(e.c,e.r2);
  if(flow[here]===0){ leak(e); return; }
  let best=null, bd=flow[here];
  for(const [dc,dr] of D4){
    const c=e.c+dc, r=e.r2+dr;
    if(inB(c,r)&&!grid[idx(c,r)]&&flow[idx(c,r)]<bd){ bd=flow[idx(c,r)]; best=[c,r]; }
  }
  if(best){
    e.tc=best[0]; e.tr=best[1];
    e.tx=best[0]*CELL+CELL/2; e.tyy=best[1]*CELL+CELL/2; e.hasT=true;
  }
}
function leak(e){
  e.dead=true;
  laserDropTarget(e);
  lives-=e.boss?5:1;
  shake=Math.max(shake,e.boss?14:6);
  announce(pick(QUIPS.leak)); sfxLeak();
  if(lives<=0&&state==="play") gameOver(false);
  refreshUI();
}
function plateBreak(e){
  e.plateHp=0; e.exposed=true;
  burst(e.x,e.y,"#ffffff",18); shake=Math.max(shake,5);
  floaters.push({x:e.x,y:e.y-e.r-6,t:1.0,txt:pick(QUIPS.crack),col:"#fff"});
  sfxCrack();
}
function hurt(e,dmg,o={}){
  if(e.dead) return;
  let d=dmg;
  if(e.plateHp>0){
    const strip=o.beam?3:(o.kind==="splat"?1.6:1);
    e.plateHp-=d*strip;
    d*=0.3; // plated body only takes chip damage
    if(e.plateHp<=0) plateBreak(e);
  }else if(e.exposed){
    d*=1.3; // cracked shell = weakpoint
  }
  if(o.shatter&&e.slowT>0) d*=1.5;
  e.hp-=d;
  if(o.showNum!==false&&Math.random()<0.35) floaters.push({x:e.x,y:e.y-e.r,t:0.7,txt:Math.max(1,Math.round(d)),col:o.col||"#fff"});
  if(e.hp<=0) kill(e);
}
function laserDropTarget(e){
  for(const t of towers) if(t.target===e){ t.target=null; t.ramp=0; laserOff(t); }
}
function kill(e){
  if(e.dead) return;
  e.dead=true; kills++;
  laserDropTarget(e);
  credits+=e.bounty; score+=e.bounty;
  // biomass harvest
  let b=0;
  if(e.boss) b=10; else if(e.affix) b=2; else if(Math.random()<0.05) b=1;
  if(b){ bio+=b; floaters.push({x:e.x,y:e.y-e.r-14,t:1.1,txt:"+"+b+" BIO",col:"#5dff9e"}); }
  burst(e.x,e.y,e.col,e.boss?40:12);
  if(e.boss){ shake=Math.max(shake,16); announce("MEGAGLORP TERMINATED. INVOICE SENT."); }
  sfxKill(e);
  // SHRIEKER: death EMP
  if(e.affix==="shrieker"){
    ring(e.x,e.y,90,"#ff5050"); sfxEmp(); shake=Math.max(shake,8);
    for(const t of towers){
      const dx=t.x-e.x, dy=t.y-e.y;
      if(dx*dx+dy*dy<=90*90&&t.type!=="amp"&&t.type!=="wall"){ t.emp=2.5; t.target=null; t.ramp=0; laserOff(t); }
    }
  }
  if(e.split){
    for(let i=0;i<e.split;i++){
      const g=EDEF.grub, m=hpMul(wave)*0.55;
      enemies.push({type:"grub",nm:"GRUBLET",hp:g.hp*m,maxhp:g.hp*m,spd:g.spd*1.15,
        bounty:2,r:7,col:"#aaff55",air:false,boss:false,slowFloor:0,split:0,exposed:false,
        plateHp:0,plateMax:0,affix:null,jukeT:0,jukeOn:0,
        slowMul:1,slowT:0,burnT:0,burnD:0,dead:false,wob:Math.random()*9,
        x:e.x+Math.random()*20-10,y:e.y+Math.random()*20-10,
        c:e.c,r2:e.r2,hasT:false});
    }
  }
  refreshUI();
}
function buildWave(n){
  const q=[];
  const t=lateWaveT(n);
  const cnt=c=>t?Math.ceil(c*(1+t*0.12)):c;
  const gap=g=>t?g/(1+t*0.06):g;
  const push=(type,c,g)=>{ for(let i=0;i<cnt(c);i++) q.push({t:type,gap:gap(g)}); };
  if(n%10===0){
    push("boss",Math.ceil(n/10),t?Math.max(1.6,3.0-t*0.07):3.0);
    push("grub",10+n,0.45);
    if(n>=20) push("chonk",Math.floor(n/4),1.1);
    if(n>=20) push("skit",Math.floor(n*0.65),0.32);
    if(n>=25) push("brood",Math.floor(n/3),0.95);
    announce(pick(QUIPS.boss));
  }else if(n%4===0){
    push("wasp",5+n,0.5);
    push("grub",6+(t?Math.floor(t*1.5):0),0.5);
    if(n>=12) push("skit",n,0.3);
    if(n>=18) push("chonk",Math.floor(n/5),0.85);
  }else{
    push("grub",8+Math.floor(n*1.35),0.5);
    if(n>=3)  push("skit",Math.floor(n*1.15),0.33);
    if(n>=6)  push("brood",Math.floor(n/2),1.1);
    if(n>=9)  push("chonk",Math.floor(n/3),1.25);
    if(n>=13) push("wasp",Math.floor(n/2),0.7);
    if(n>=16) push("brood",Math.floor(n/3),0.9);
    if(n>=22) push("chonk",Math.floor(n/4),1.0);
  }
  return q;
}
function deployWave(){
  if(state!=="play") return;
  if(waveActive&&spawnQ.length>0) return;
  if(enemies.length>0){ const b=10+wave*2; credits+=b; floaters.push({x:W-130,y:30,t:1.2,txt:"EARLY +"+b+" CR",col:"#b6ff00"}); }
  const bp=((beatClock%4)+4)%4;
  if(bp<0.25||bp>3.75){ credits+=15; floaters.push({x:W/2,y:46,t:1.2,txt:"DOWNBEAT DROP +15 CR",col:"#ff2079"}); }
  wave++;
  spawnQ=buildWave(wave);
  waveSpawnTotal=spawnQ.length;
  spawnT=0.3; waveActive=true;
  reanchor(); // BPM steps up per wave: re-lock the clock mapping
  if(wave%10!==0) announce(pick(QUIPS.wave)+" — WAVE "+wave);
  refreshUI(); sfxWave();
}
function waveCleared(){
  waveActive=false;
  const bonus=25+wave*5;
  credits+=bonus; score+=bonus; bio+=2;
  announce(pick(QUIPS.clear)+"  +"+bonus+" CR");
  sfxClear();
  persistLeaderboard();
  if(wave>=30&&!endless) gameOver(true);
  refreshUI();
}
function gameOver(won){
  state=won?"win":"over";
  stopAllVoices();
  ytSendScore(score);
  lbHighlight=-1;
  document.getElementById("ovsub").textContent= won?"PLANET PACIFIED — QUARTERLY GOALS EXCEEDED":"VOLTWORKS™ INCIDENT REPORT";
  document.getElementById("ovtitle").innerHTML= won?"YOU<br>WIN":"GLORP'D";
  const hi=qualifiesForBoard(score);
  document.getElementById("ovbody").innerHTML=
    (hi?"<b style=\"color:#ffd700;letter-spacing:1px\">★ NEW HIGH SCORE ★</b><br><br>":"")+
    "Waves survived: <em>"+wave+"</em> · Bugs fried: <em>"+kills+"</em> · Score: <em>"+score.toLocaleString()+"</em>"+
    (won?"<br><br>The bugs respect you now. They'll be back with lawyers.":"<br><br>Your security deposit has been forfeited.");
  document.getElementById("btnStart").textContent= won?"ENDLESS OVERTIME ▶":"RE-APPLY FOR JOB ▶";
  if(hi) showInitialsEntry();
  else hideInitialsEntry();
  renderLeaderboard();
  setOverlayVisible(true);
}

/* ================= COMBAT ================= */
function acquire(t,st){
  const d=TDEF[t.type];
  let best=null,bp=-1e18;
  for(const e of enemies){
    if(e.dead) continue;
    if(e.air&&!d.air) continue;
    if(!e.air&&!d.grd) continue;
    const dx=e.x-t.x, dy=e.y-t.y;
    if(dx*dx+dy*dy>st.range*st.range) continue;
    const p=e.air ? e.x : -(flow[idx(e.c,e.r2)]??999)*100 + e.x;
    if(p>bp){ bp=p; best=e; }
  }
  return best;
}
function fire(t,e,st){
  const d=TDEF[t.type];
  if(t.type==="zap"){
    zapBolt(t.x,t.y,e.x,e.y,d.col);
    hurt(e,st.dmg,{col:d.col});
    if(t.lvl>=3){
      let prev=e, hitset=new Set([e]);
      const jumps=2+res.chain;
      for(let j=0;j<jumps;j++){
        let nx=null,nd=80*80;
        for(const o of enemies){
          if(o.dead||hitset.has(o)) continue;
          const dx=o.x-prev.x, dy=o.y-prev.y, q=dx*dx+dy*dy;
          if(q<nd){ nd=q; nx=o; }
        }
        if(!nx) break;
        zapBolt(prev.x,prev.y,nx.x,nx.y,d.col);
        hurt(nx,st.dmg*0.6,{col:d.col});
        hitset.add(nx); prev=nx;
      }
    }
    pend.zap++;
  }else if(t.type==="splat"){
    projs.push({x:t.x,y:t.y,e,lx:e.x,ly:e.y,spd:200,dmg:st.dmg,kind:"splat",splash:st.splash,
      shatter:t.shatter,burn:t.lvl>=3,col:d.col});
    pend.splat++;
  }else if(t.type==="frz"){
    projs.push({x:t.x,y:t.y,e,lx:e.x,ly:e.y,spd:330,dmg:st.dmg,kind:"frz",slow:st.slow,slowDur:d.slowDur,col:d.col});
    pend.frz++;
  }else if(t.type==="flak"){
    projs.push({x:t.x,y:t.y,e,lx:e.x,ly:e.y,spd:430,dmg:st.dmg,kind:"flak",splash:t.lvl>=3?42:0,col:d.col});
    pend.flak++;
  }
}
function applySlow(e,f,dur){
  const eff=Math.max(f,e.slowFloor||0);
  if(eff<e.slowMul||e.slowT<=0) e.slowMul=eff;
  e.slowT=Math.max(e.slowT,dur);
}
function impact(p){
  const d=p.dmg;
  if(p.kind==="splat"){
    burst(p.x,p.y,p.col,14); shake=Math.max(shake,2);
    if(boomCd<=0){ sfxBoom(); boomCd=0.09; }
    // napalm purges goo
    const cc=Math.floor(p.x/CELL), rr=Math.floor(p.y/CELL);
    for(let dc=-1;dc<=1;dc++)for(let dr=-1;dr<=1;dr++){
      if(inB(cc+dc,rr+dr)) cor[idx(cc+dc,rr+dr)]=Math.max(0,cor[idx(cc+dc,rr+dr)]-0.55);
    }
    for(const e of enemies){
      if(e.dead||e.air) continue;
      const dx=e.x-p.x, dy=e.y-p.y, q=Math.sqrt(dx*dx+dy*dy);
      if(q<=p.splash){
        hurt(e,d*(1-0.5*q/p.splash),{shatter:p.shatter,col:p.col,kind:"splat"});
        if(p.burn){ e.burnT=2; e.burnD=6*hpMul(wave)*0.3+4; }
      }
    }
  }else if(p.kind==="frz"){
    if(p.e&&!p.e.dead){ hurt(p.e,d,{col:p.col}); applySlow(p.e,p.slow,p.slowDur); burst(p.x,p.y,p.col,5); }
  }else if(p.kind==="flak"){
    if(p.splash>0){
      burst(p.x,p.y,p.col,10);
      for(const e of enemies){
        if(e.dead||!e.air) continue;
        const dx=e.x-p.x, dy=e.y-p.y;
        if(dx*dx+dy*dy<=p.splash*p.splash) hurt(e,d,{col:p.col});
      }
    }else if(p.e&&!p.e.dead){ hurt(p.e,d,{col:p.col}); burst(p.x,p.y,p.col,6); }
  }
}

/* ================= UPDATE ================= */
function update(dt){
  time+=dt;
  if(state!=="play"||paused) return;
  dt*=speedMul;

  // beat clock: the AudioContext is master when sound is on (rock-solid grid);
  // falls back to game-time accumulation when muted. Quantization identical either way.
  let nb;
  if(useAC&&AC&&AC.state==="running"&&soundOn){
    nb=anchorBeat+(AC.currentTime-anchorAC)*speedMul/SPBnow();
    if(nb<beatClock-0.001||nb>beatClock+0.5){ reanchor(); nb=beatClock+dt/SPBnow(); } // mapping stale (pause/lag): re-lock
  }else{
    if(AC&&AC.state==="running"&&soundOn) reanchor();
    nb=beatClock+dt/SPBnow();
  }
  const dBeats=Math.max(0,nb-beatClock);
  const prevBeat=beatClock; beatClock=nb;
  barCrossed=Math.floor(beatClock/4)>Math.floor(prevBeat/4);
  shotHeat*=Math.exp(-dt*5);
  threatRaw=computeThreat();
  threatSmooth+=(threatRaw-threatSmooth)*(1-Math.exp(-dt*2.8));
  scheduler();

  if(spawnQ.length>0){
    spawnT-=dt;
    if(spawnT<=0){
      const s=spawnQ.shift();
      spawnEnemy(s.t);
      spawnT=s.gap;
    }
  }

  // corruption
  if(waveActive){
    corT+=dt;
    if(corT>1.4){ corT=0; corStep(); }
  }
  corPurge(dt);

  // enemies
  for(const e of enemies){
    if(e.dead) continue;
    if(e.slowT>0){ e.slowT-=dt; if(e.slowT<=0) e.slowMul=1; }
    if(e.burnT>0){ e.burnT-=dt; hurt(e,e.burnD*dt,{showNum:false,col:"#ff9f1c"}); if(e.dead) continue; }
    // affix behaviors
    let aMul=1;
    if(e.affix==="juker"){
      e.jukeT-=dt;
      if(e.jukeT<=0){ e.jukeT=2.5; e.jukeOn=0.6; }
      if(e.jukeOn>0){ e.jukeOn-=dt; aMul=2.4; }
    }
    if(e.affix==="mender"&&Math.random()<dt*4){
      for(const o of enemies){
        if(o.dead||o===e) continue;
        const dx=o.x-e.x, dy=o.y-e.y;
        if(dx*dx+dy*dy<=60*60&&o.hp<o.maxhp){ o.hp=Math.min(o.maxhp,o.hp+o.maxhp*0.015); }
      }
      if(Math.random()<0.25) parts.push({x:e.x,y:e.y-e.r,vx:0,vy:-22,t:0.5,col:"#5dff9e",sz:2});
    }
    // goo speeds up bugs standing on it
    let gMul=1;
    if(!e.air){
      const ci=Math.floor(e.x/CELL), ri=Math.floor(e.y/CELL);
      if(inB(ci,ri)&&cor[idx(ci,ri)]>=0.5) gMul=1.2;
    }
    const sp=e.spd*e.slowMul*aMul*gMul*dt;
    if(e.air){
      const tx=W+50, ty=e.ty;
      const dx=tx-e.x, dy=ty-e.y, q=Math.sqrt(dx*dx+dy*dy)||1;
      e.x+=dx/q*sp; e.y+=dy/q*sp+Math.sin(time*6+e.wob)*0.4;
      if(e.x>W+30) leak(e);
    }else{
      if(!e.hasT) pickNext(e);
      if(e.hasT){
        const dx=e.tx-e.x, dy=e.tyy-e.y, q=Math.sqrt(dx*dx+dy*dy);
        if(q<=sp){ e.x=e.tx; e.y=e.tyy; e.c=e.tc; e.r2=e.tr; e.hasT=false;
          if(e.c===EXIT.c&&e.r2===EXIT.r) leak(e);
        }else{ e.x+=dx/q*sp; e.y+=dy/q*sp; }
      }
    }
  }
  enemies=enemies.filter(e=>!e.dead);

  // towers
  for(const t of towers){
    t.anim+=dt;
    if(t.emp>0){ t.emp-=dt; laserOff(t); continue; }
    const d=TDEF[t.type], st=tStats(t);
    if(t.type==="amp"||t.type==="wall") continue;
    if(t.type==="frz"&&t.lvl>=3){
      t.novaCd-=dt;
      if(t.novaCd<=0&&barCrossed){
        let any=false;
        for(const e of enemies){
          if(e.dead) continue;
          const dx=e.x-t.x, dy=e.y-t.y;
          if(dx*dx+dy*dy<=st.range*st.range){ applySlow(e,st.slow*0.85,2.2); hurt(e,st.dmg*2,{col:d.col}); any=true; }
        }
        if(any){ ring(t.x,t.y,st.range,d.col); t.novaCd=5; sfxNova(); } else t.novaCd=0.4;
      }
    }
    if(d.beam){
      if(t.target&&(t.target.dead||dist2(t,t.target)>st.range*st.range)){ t.target=null; t.ramp=0; laserOff(t); }
      if(!t.target){ t.target=acquire(t,st); t.ramp=0; if(t.target) laserOn(t); }
      if(t.target){
        const cap=t.lvl>=3?3:1.5;
        t.ramp=Math.min(cap,t.ramp+dt*0.6*t.rampMul);
        const dps=st.dmg*(1+t.ramp)*brown;
        hurt(t.target,dps*dt,{beam:true,showNum:false,col:d.col});
        if(t.target&&!t.target.dead) beams.push({x1:t.x,y1:t.y,x2:t.target.x,y2:t.target.y,col:d.col,w:2+t.ramp,t:0});
        laserTune(t);
        if(t.target&&t.target.dead){ t.target=null; t.ramp=0; laserOff(t); }
      }
    }else{
      // musical firing: shots land only on this turret's subdivision gridlines
      const md=MUSDEF[t.type];
      if(t.cdB>0) t.cdB-=dBeats;
      if(md){
        const prev=beatClock-dBeats;
        const k=Math.floor((beatClock-md.o)/md.g+1e-9);
        const line=k*md.g+md.o;
        if(line>prev&&line<=beatClock+1e-9&&t.cdB<=md.g*0.5){
          const e=acquire(t,st);
          if(e){ fire(t,e,st); t.cdB=shotBeatsOf(t)-1e-6; }
        }
      }
    }
  }

  // projectiles
  for(const p of projs){
    if(p.e&&!p.e.dead){ p.lx=p.e.x; p.ly=p.e.y; }
    const tx=p.lx??p.x, ty=p.ly??p.y;
    const dx=tx-p.x, dy=ty-p.y, q=Math.sqrt(dx*dx+dy*dy);
    const sp=p.spd*dt;
    if(q<=sp+4){ p.x=tx; p.y=ty; impact(p); p.done=true; }
    else{ p.x+=dx/q*sp; p.y+=dy/q*sp; }
  }
  projs=projs.filter(p=>!p.done);

  // fx
  for(const f of floaters){ f.t-=dt; f.y-=28*dt; }
  floaters=floaters.filter(f=>f.t>0);
  for(const b of beams) b.t+=dt;
  beams=beams.filter(b=>b.t<0.07);
  for(const pa of parts){
    pa.t-=dt; pa.x+=pa.vx*dt; pa.y+=pa.vy*dt; pa.vx*=0.96; pa.vy*=0.96;
    if(pa.ring) pa.rr+=pa.rv*dt;
  }
  parts=parts.filter(p=>p.t>0);
  if(shake>0) shake=Math.max(0,shake-dt*30);

  comboTick(dt);
  boomCd-=dt;
  flushShots();
  if(waveActive&&spawnQ.length===0&&enemies.length===0) waveCleared();
  refreshUI();
}
const dist2=(a,b)=>{const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy;};
function burst(x,y,col,n){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2, v=40+Math.random()*120;
    parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:0.35+Math.random()*0.3,col,sz:1.5+Math.random()*2.5});
  }
}
function ring(x,y,r,col){ parts.push({x,y,vx:0,vy:0,t:0.45,col,sz:2,ring:true,rr:10,rv:r*2.4}); }
function zapBolt(x1,y1,x2,y2,col){
  const pts=[[x1,y1]];
  const seg=4;
  for(let i=1;i<seg;i++){
    const t=i/seg;
    pts.push([x1+(x2-x1)*t+(Math.random()*16-8), y1+(y2-y1)*t+(Math.random()*16-8)]);
  }
  pts.push([x2,y2]);
  beams.push({pts,col,w:2,t:0});
}

/* ================= RENDER ================= */
function glow(col,b){ ctx.shadowColor=col; ctx.shadowBlur=b; }
function noglow(){ ctx.shadowBlur=0; }
function render(){
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,W,H);
  if(shake>0) ctx.setTransform(1,0,0,1,(Math.random()-0.5)*shake,(Math.random()-0.5)*shake);

  ctx.fillStyle="#070312"; ctx.fillRect(-20,-20,W+40,H+40);
  ctx.strokeStyle="rgba(80,50,170,0.18)"; ctx.lineWidth=1;
  ctx.beginPath();
  for(let c=0;c<=COLS;c++){ ctx.moveTo(c*CELL,0); ctx.lineTo(c*CELL,H); }
  for(let r=0;r<=ROWS;r++){ ctx.moveTo(0,r*CELL); ctx.lineTo(W,r*CELL); }
  ctx.stroke();

  // corruption goo
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const v=cor[idx(c,r)];
    if(v<=0.04) continue;
    const x=c*CELL, y=r*CELL;
    ctx.globalAlpha=v*0.42;
    ctx.fillStyle="#a020c0";
    ctx.fillRect(x+1,y+1,CELL-2,CELL-2);
    ctx.globalAlpha=v*0.55;
    glow("#d34dff",8);
    ctx.fillStyle="#d34dff";
    const ph=time*2+c*1.7+r*2.3;
    ctx.beginPath();
    ctx.arc(x+CELL*0.3+Math.sin(ph)*4, y+CELL*0.4+Math.cos(ph*1.3)*4, 3.5*v,0,Math.PI*2);
    ctx.arc(x+CELL*0.7+Math.cos(ph*0.8)*4, y+CELL*0.65+Math.sin(ph*1.1)*4, 2.5*v,0,Math.PI*2);
    ctx.fill(); noglow();
  }
  ctx.globalAlpha=1;

  // spawn & exit portals
  const sy=SPAWN.r*CELL+CELL/2, ey=EXIT.r*CELL+CELL/2;
  glow("#7CFC00",18);
  ctx.strokeStyle="#7CFC00"; ctx.lineWidth=3;
  ctx.beginPath(); ctx.ellipse(8,sy,10,16+Math.sin(time*3)*3,0,0,Math.PI*2); ctx.stroke();
  glow("#ff2079",18);
  ctx.strokeStyle="#ff2079";
  ctx.beginPath(); ctx.ellipse(W-8,ey,10,16+Math.cos(time*3)*3,0,0,Math.PI*2); ctx.stroke();
  noglow();
  ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.font="9px Verdana"; ctx.textAlign="center";
  //ctx.fillText("BUGS",24,sy-24); ctx.fillText("REACTOR",W-26,ey-24);

  for(const t of towers) drawTower(t);

  const selT=towerSel;
  if(selT){
    const st=tStats(selT);
    if(st.range>0){
      ctx.strokeStyle=TDEF[selT.type].col; ctx.setLineDash([6,6]); ctx.lineWidth=1;
      ctx.globalAlpha=0.6;
      ctx.beginPath(); ctx.arc(selT.x,selT.y,st.range,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha=1;
    }
  }

  for(const e of enemies) drawEnemy(e);

  for(const b of beams){
    ctx.globalAlpha=1-(b.t/0.07);
    glow(b.col,12);
    ctx.strokeStyle=b.col; ctx.lineWidth=b.w||2;
    ctx.beginPath();
    if(b.pts){ ctx.moveTo(b.pts[0][0],b.pts[0][1]); for(let i=1;i<b.pts.length;i++) ctx.lineTo(b.pts[i][0],b.pts[i][1]); }
    else{ ctx.moveTo(b.x1,b.y1); ctx.lineTo(b.x2,b.y2); }
    ctx.stroke(); noglow(); ctx.globalAlpha=1;
  }

  for(const p of projs){
    glow(p.col,10); ctx.fillStyle=p.col;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.kind==="splat"?5:3,0,Math.PI*2); ctx.fill(); noglow();
  }

  for(const pa of parts){
    ctx.globalAlpha=Math.max(0,pa.t*2.2);
    if(pa.ring){
      glow(pa.col,10); ctx.strokeStyle=pa.col; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(pa.x,pa.y,pa.rr,0,Math.PI*2); ctx.stroke(); noglow();
    }else{
      ctx.fillStyle=pa.col;
      ctx.fillRect(pa.x-pa.sz/2,pa.y-pa.sz/2,pa.sz,pa.sz);
    }
  }
  ctx.globalAlpha=1;

  ctx.font="bold 12px Verdana"; ctx.textAlign="center";
  for(const f of floaters){
    ctx.globalAlpha=Math.min(1,f.t*2);
    glow(f.col,6); ctx.fillStyle=f.col;
    ctx.fillText(f.txt,f.x,f.y); noglow();
  }
  ctx.globalAlpha=1;

  const boss=enemies.find(e=>e.boss&&!e.dead);
  if(boss){
    const w=W*0.5, x=(W-w)/2;
    ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.fillRect(x,8,w,12);
    if(boss.plateHp>0){
      glow("#cccccc",8); ctx.fillStyle="#cccccc";
      ctx.fillRect(x+1,9,(w-2)*Math.max(0,boss.plateHp/boss.plateMax),5); noglow();
      glow("#ff3864",10); ctx.fillStyle="#ff3864";
      ctx.fillRect(x+1,14,(w-2)*Math.max(0,boss.hp/boss.maxhp),5); noglow();
    }else{
      glow("#ff3864",10); ctx.fillStyle="#ff3864";
      ctx.fillRect(x+1,9,(w-2)*Math.max(0,boss.hp/boss.maxhp),10); noglow();
    }
    ctx.fillStyle="#fff"; ctx.font="bold 10px Verdana";
    ctx.fillText(boss.plateHp>0?"MEGAGLORP — CRACK THE SHELL":"MEGAGLORP — SHELL'S OFF, GO LOUD",W/2,30);
  }

  // beat pulse frame + bar metronome (visual beat for muted play / on-beat bonuses)
  if(state==="play"){
    const ph=((beatClock%1)+1)%1, bb=Math.floor(((beatClock%4)+4)%4);
    const acc=bb===0?1.6:1;
    const a0=0.3*acc*Math.pow(Math.max(0,1-ph*2.4),2);
    if(a0>0.015){
      ctx.globalAlpha=a0; glow("#00e5ff",14);
      ctx.strokeStyle=bb===0?"#ff2079":"#00e5ff"; ctx.lineWidth=3;
      ctx.strokeRect(2,2,W-4,H-4);
      noglow(); ctx.globalAlpha=1;
    }
    for(let i=0;i<4;i++){
      const on=i===bb, mx=W-72+i*16, my=16;
      ctx.globalAlpha=on?0.55+0.45*(1-ph):0.22;
      ctx.fillStyle=on?(i===0?"#ff2079":"#00e5ff"):"#5a4d8a";
      ctx.beginPath();
      ctx.moveTo(mx,my-5); ctx.lineTo(mx+5,my); ctx.lineTo(mx,my+5); ctx.lineTo(mx-5,my);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  if(buildSel&&hover&&state==="play"){
    const [c,r]=hover, x=c*CELL+CELL/2, y=r*CELL+CELL/2;
    const d=TDEF[buildSel];
    const bad=!inB(c,r)||grid[idx(c,r)]||(c===SPAWN.c&&r===SPAWN.r)||(c===EXIT.c&&r===EXIT.r)||credits<d.cost||(inB(c,r)&&cor[idx(c,r)]>=0.5);
    ctx.globalAlpha=0.45;
    ctx.fillStyle=bad?"#ff2050":d.col;
    ctx.fillRect(c*CELL+3,r*CELL+3,CELL-6,CELL-6);
    if(d.range>0){
      ctx.strokeStyle=bad?"#ff2050":d.col; ctx.lineWidth=1; ctx.setLineDash([5,5]);
      ctx.beginPath(); ctx.arc(x,y,d.range,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.globalAlpha=1;
  }
}
function drawTower(t){
  const d=TDEF[t.type], x=t.x, y=t.y, L=t.lvl;
  ctx.fillStyle="rgba(10,6,26,0.95)";
  ctx.fillRect(x-CELL/2+2,y-CELL/2+2,CELL-4,CELL-4);
  ctx.strokeStyle="rgba(255,255,255,0.12)";
  ctx.strokeRect(x-CELL/2+2,y-CELL/2+2,CELL-4,CELL-4);
  const dead=t.emp>0;
  glow(dead?"#555":d.col, dead?2:10+L*3);
  ctx.strokeStyle=dead?"#666":d.col; ctx.fillStyle=dead?"#666":d.col; ctx.lineWidth=2;
  if(t.type==="zap"){
    ctx.beginPath(); ctx.arc(x,y,9,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-1,y-8); ctx.lineTo(x+2.5,y-1.5); ctx.lineTo(x-2,y); ctx.lineTo(x+1,y+8);
    ctx.stroke();
  }else if(t.type==="frz"){
    ctx.beginPath(); ctx.moveTo(x,y-10); ctx.lineTo(x+8,y); ctx.lineTo(x,y+10); ctx.lineTo(x-8,y); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
  }else if(t.type==="splat"){
    ctx.beginPath();
    for(let i=0;i<6;i++){ const a=i/6*Math.PI*2+t.anim*0.4; const px=x+Math.cos(a)*9, py=y+Math.sin(a)*9; i?ctx.lineTo(px,py):ctx.moveTo(px,py); }
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x,y,3.5,0,Math.PI*2); ctx.fill();
  }else if(t.type==="lzr"){
    ctx.beginPath(); ctx.moveTo(x,y-10); ctx.lineTo(x+9,y+8); ctx.lineTo(x-9,y+8); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x,y+1,2.5,0,Math.PI*2); ctx.fill();
  }else if(t.type==="flak"){
    ctx.strokeRect(x-8,y-8,16,16);
    ctx.beginPath(); ctx.moveTo(x-8,y-8); ctx.lineTo(x+8,y+8); ctx.moveTo(x+8,y-8); ctx.lineTo(x-8,y+8); ctx.stroke();
  }else if(t.type==="amp"){
    const pul=2+Math.sin(t.anim*3)*2;
    ctx.beginPath(); ctx.moveTo(x,y-11); ctx.lineTo(x+9,y+9); ctx.lineTo(x-9,y+9); ctx.closePath(); ctx.stroke();
    ctx.globalAlpha=0.35;
    ctx.beginPath(); ctx.arc(x,y,16+pul,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=1;
  }else if(t.type==="wall"){
    ctx.strokeRect(x-10,y-10,20,20);
    ctx.beginPath();
    ctx.moveTo(x-10,y-3.5); ctx.lineTo(x+10,y-3.5);
    ctx.moveTo(x-10,y+3.5); ctx.lineTo(x+10,y+3.5);
    ctx.moveTo(x-3,y-10); ctx.lineTo(x-3,y-3.5);
    ctx.moveTo(x+3,y-3.5); ctx.lineTo(x+3,y+3.5);
    ctx.moveTo(x-3,y+3.5); ctx.lineTo(x-3,y+10);
    ctx.stroke();
  }
  noglow();
  ctx.fillStyle="#fff";
  for(let i=0;i<L;i++) ctx.fillRect(x-CELL/2+5+i*6,y+CELL/2-7,4,3);
  if(dead){
    // static glitch sparks
    ctx.fillStyle="#ff5050";
    for(let i=0;i<2;i++) ctx.fillRect(x-10+Math.random()*20,y-10+Math.random()*20,2,2);
  }else if(brown<1&&t.type!=="amp"&&t.type!=="wall"){
    ctx.fillStyle="#ff2050"; ctx.font="bold 9px Verdana"; ctx.textAlign="center";
    ctx.fillText("!",x+CELL/2-7,y-CELL/2+13);
  }
}
function drawEnemy(e){
  const wob=Math.sin(time*8+e.wob);
  const x=e.x, y=e.y+(e.air?0:wob*1.5), r=e.r*(1+wob*0.06);
  glow(e.col,e.boss?22:10);
  ctx.fillStyle=e.col;
  if(e.air){
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x-r,y-r*0.8); ctx.lineTo(x-r*0.4,y); ctx.lineTo(x-r,y+r*0.8); ctx.closePath(); ctx.fill();
    ctx.globalAlpha=0.5;
    ctx.beginPath(); ctx.ellipse(x-r*0.2,y,r*0.5,r*(1.3+wob*0.5),0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
  }else{
    ctx.beginPath(); ctx.ellipse(x,y,r*1.05,r*0.92,0,0,Math.PI*2); ctx.fill();
  }
  noglow();
  // armor plates (segmented shell that visibly disappears)
  if(e.plateMax>0&&e.plateHp>0){
    const segs=4, frac=e.plateHp/e.plateMax;
    const lit=Math.ceil(frac*segs);
    ctx.strokeStyle="#e8e8f8"; ctx.lineWidth=2.5; glow("#ffffff",4);
    for(let i=0;i<lit;i++){
      const a0=-Math.PI*0.75+i*(Math.PI*1.5/segs)+0.06;
      const a1=a0+(Math.PI*1.5/segs)-0.12;
      ctx.beginPath(); ctx.arc(x,y,r*0.82,a0,a1); ctx.stroke();
    }
    noglow();
  }
  if(e.exposed){
    glow("#ffffff",10);
    ctx.fillStyle="rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(x,y+r*0.15,r*0.22+Math.sin(time*9)*0.8,0,Math.PI*2); ctx.fill();
    noglow();
  }
  // goofy eyes
  ctx.fillStyle="#fff";
  ctx.beginPath(); ctx.arc(x+r*0.35,y-r*0.25,r*0.28,0,Math.PI*2); ctx.arc(x-r*0.1,y-r*0.3,r*0.22,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#000";
  ctx.beginPath(); ctx.arc(x+r*0.42,y-r*0.22,r*0.12,0,Math.PI*2); ctx.arc(x-r*0.05,y-r*0.27,r*0.1,0,Math.PI*2); ctx.fill();
  // elite spike ring + label
  if(e.affix){
    const ac=AFFIX[e.affix].col;
    glow(ac,8); ctx.strokeStyle=ac; ctx.lineWidth=1.5;
    ctx.beginPath();
    for(let i=0;i<7;i++){
      const a=i/7*Math.PI*2+time*1.5;
      ctx.moveTo(x+Math.cos(a)*(r+3),y+Math.sin(a)*(r+3));
      ctx.lineTo(x+Math.cos(a)*(r+7),y+Math.sin(a)*(r+7));
    }
    ctx.stroke(); noglow();
    ctx.fillStyle=ac; ctx.font="bold 8px Verdana"; ctx.textAlign="center";
    ctx.fillText(AFFIX[e.affix].nm,x,y-r-11);
  }
  if(e.slowT>0){ ctx.strokeStyle="#7df9ff"; glow("#7df9ff",6); ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(x,y,r+3,0,Math.PI*2); ctx.stroke(); noglow(); }
  if(e.burnT>0){ ctx.fillStyle="#ff9f1c"; glow("#ff9f1c",8);
    ctx.beginPath(); ctx.arc(x+Math.random()*6-3,y-r-2,2,0,Math.PI*2); ctx.fill(); noglow(); }
  if(e.hp<e.maxhp||e.plateMax>0){
    const bw=e.boss?36:18;
    ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.fillRect(x-bw/2,y-r-8,bw,3);
    ctx.fillStyle=e.hp/e.maxhp>0.4?"#7CFC00":"#ff2050";
    ctx.fillRect(x-bw/2,y-r-8,bw*Math.max(0,e.hp/e.maxhp),3);
  }
}

/* ================= DEEP MUSIC ENGINE v3 =================
   Architecture:
   - Game-time BEAT CLOCK (works fully muted; firing quantization never depends on AudioContext)
   - Chord progression engine: i-VI-III-VII in D minor, one chord per bar.
     ALL pitched events quantize to the current chord -> the battlefield modulates together.
   - Mix buses (drum/bass/lead/pad/fxui) -> master -> compressor, with a tempo-synced
     dotted-8th feedback delay send and a procedurally-generated convolution reverb send.
   - Sidechain ducking: kicks & splat impacts pump the bass/pad buses.
   - Density-aware mixing: shotHeat scales lead gains by 1/sqrt(n) so 30 turrets = wall of synth, not clipping.
   - Sequencer bass: filtered triangle plucks (no feedback loops — KS was stacking into mud).
   - Corruption DETUNES the world: goo coverage bends scale degree 2 toward phrygian b2 and drifts oscillator cents.
   - Boss = halftime kick + transpose down 2 semitones. Low lives = tremolo tension layer.
   - Tempo ramps 104 -> 130 BPM across the run.
   - Intensity (wave + enemy pressure) only nudges hat velocity — groove stays the familiar v3 bed. */
const KEYROOT=146.83; // D3
const NATMIN=[0,2,3,5,7,8,10];
const PROG=[[0,3,7],[8,12,15],[3,7,10],[10,14,17]]; // i, VI, III, VII (semitones from D)
let beatClock=0, barCrossed=false, barNum=0, schedBeat=0, shotHeat=0;
let anchorAC=0, anchorBeat=0, useAC=false, muteUntilBeat=0, killQ=0, runStep=0;
let threatRaw=0, threatSmooth=0, threatLatched=0;
let musicMode=1, hatsOn=false; // default: MINIMAL (pads+events). 2=FULL groove, 0=SFX-only
function syncDelayTime(){
  if(AC&&FX) FX.dl.delayTime.setTargetAtTime(SPBnow()*0.75/Math.max(1,speedMul),AC.currentTime,0.08);
}
function reanchor(){
  if(AC&&soundOn&&AC.state==="running"){ anchorAC=AC.currentTime; anchorBeat=beatClock; useAC=true; syncDelayTime(); }
  else useAC=false;
}
function BPMnow(){ return 104+Math.min(26,(wave||0)*0.9); }
function SPBnow(){ return 60/BPMnow(); }
function transpose(){ return (enemies&&enemies.some(e=>e.boss&&!e.dead))?-2:0; }
function corLevel(){
  if(!cor) return 0;
  let n=0; for(let i=0;i<cor.length;i++) if(cor[i]>=0.5) n++;
  return Math.min(1,n/(COLS*ROWS*0.35));
}
function bendSemi(s){ const b=((s%12)+12)%12; if(b===2&&bentBar) return s-1; return s; }
function enemyPressure(){
  let p=0;
  for(const e of enemies) if(!e.dead) p+=e.boss?0.32:e.affix?0.11:0.075;
  return Math.min(1,p);
}
function computeThreat(){
  const runP=Math.min(1,(wave||0)/30);
  let spawnP=runP;
  if(waveActive&&waveSpawnTotal>0){
    let alive=0; for(const e of enemies) if(!e.dead) alive++;
    spawnP=1-(spawnQ.length+alive)/waveSpawnTotal;
  }
  const waveProg=runP*0.55+spawnP*0.45;
  const ep=enemyPressure();
  const bossB=enemies.some(e=>e.boss&&!e.dead)?0.14:0;
  const lowB=lives<=6?0.1*(1-Math.max(0,lives-1)/5):0;
  return Math.min(1,0.4*waveProg+0.45*ep+bossB+lowB);
}
function chordTones(){ return PROG[((barNum%4)+4)%4]; }
function chz(ti,oct){ // chord-tone index -> Hz (with corruption bend + boss transpose)
  const T=chordTones(), n=T.length;
  const o=Math.floor(ti/n), s=T[((ti%n)+n)%n];
  return KEYROOT*Math.pow(2,(bendSemi(s)+transpose())/12+(oct||0)+o);
}
function chzS(ti,oct){ // stable version (no random bend) for sustained voices
  const T=chordTones(), n=T.length;
  const o=Math.floor(ti/n), s=T[((ti%n)+n)%n];
  return KEYROOT*Math.pow(2,(s+transpose())/12+(oct||0)+o);
}
const towerDeg=t=>(t.c+t.r)%6; // maze position (still used for laser drone harmony)
/* ONE-NOTE-PER-STEP combat voice: turret volleys trigger steps of a composed
   arpeggio instead of each turret improvising. Velocity scales with volley size. */
let pend={zap:0,frz:0,flak:0,splat:0,kill:0}, boomCd=0, arpIdx=0, bentBar=false, uiSfxT=-1;
const ARPC=[0,1,2,3,2,1,4,2]; // fixed contour over the current chord
function arpNext(){ const ti=ARPC[arpIdx%ARPC.length]; arpIdx++; return chz(ti,1); }
function flushShots(){
  if(pend.zap)  pluck(arpNext(),0,Math.min(0.07,0.04*Math.sqrt(pend.zap)));
  if(pend.frz) noiseAt(0,0.05,Math.min(0.03,0.012*Math.sqrt(pend.frz)),11000,"drum");
  if(pend.flak) noiseAt(0,0.035,Math.min(0.035,0.014*Math.sqrt(pend.flak)),3800,"drum");
  if(pend.splat) vAt(95,0,0.08,"sine",0.05,45,"drum");
  if(pend.kill) noiseAt(0,0.035,Math.min(0.03,0.01*Math.sqrt(pend.kill)),2000,"fxui");
  pend.zap=pend.frz=pend.flak=pend.splat=pend.kill=0;
}

let AC=null, master=null, BUS=null, FX=null, noiseBuf=null;
function audio(){
  if(!AC){
    try{
      AC=new (window.AudioContext||window.webkitAudioContext)();
      const comp=AC.createDynamicsCompressor();
      comp.threshold.value=-24; comp.ratio.value=3; comp.connect(AC.destination);
      const tilt=AC.createBiquadFilter(); tilt.type="lowpass"; tilt.frequency.value=4600; tilt.Q.value=0.4;
      tilt.connect(comp);
      master=AC.createGain(); master.gain.value=0.55; master.connect(tilt);
      BUS={};
      const lv={drum:0.9,bass:0.75,lead:0.6,pad:0.5,fxui:0.7};
      for(const k in lv){ const g=AC.createGain(); g.gain.value=lv[k]; g.connect(master); BUS[k]={g,base:lv[k]}; }
      // tempo-synced dotted-8th feedback delay
      const dl=AC.createDelay(2), fb=AC.createGain(), fl=AC.createBiquadFilter(), wet=AC.createGain();
      fb.gain.value=0.2; fl.type="lowpass"; fl.frequency.value=3200; wet.gain.value=0.28;
      dl.connect(fl); fl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master);
      const dsend=AC.createGain(); dsend.connect(dl);
      // procedural convolution reverb
      const cvr=AC.createConvolver(); cvr.buffer=genIR(1.9,2.6);
      const rwet=AC.createGain(); rwet.gain.value=0.4; cvr.connect(rwet); rwet.connect(master);
      const rsend=AC.createGain(); rsend.connect(cvr);
      FX={dl,dsend,rsend};
      noiseBuf=AC.createBuffer(1,AC.sampleRate*0.4,AC.sampleRate);
      const nd=noiseBuf.getChannelData(0);
      for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
    }catch(e){ AC=null; }
  }
  if(AC&&AC.state==="suspended") AC.resume();
  return AC;
}
function genIR(dur,decay){
  const len=Math.floor(AC.sampleRate*dur), b=AC.createBuffer(2,len,AC.sampleRate);
  for(let ch=0;ch<2;ch++){ const d=b.getChannelData(ch);
    for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay); }
  return b;
}
function duck(when){
  if(!AC||!BUS) return;
  const t=Math.max(AC.currentTime,when||AC.currentTime);
  const g=BUS.pad.g.gain;
  g.setTargetAtTime(BUS.pad.base*0.5,t,0.012);
  g.setTargetAtTime(BUS.pad.base,t+0.09,0.14);
}
function whenAtBeat(b){
  if(!AC) return 0;
  const spb=SPBnow()/Math.max(1e-6,speedMul);
  if(useAC) return anchorAC+(b-anchorBeat)*spb;
  return AC.currentTime+Math.max(0,b-beatClock)*spb;
}
function nextGridWhen(grid){ const nb=Math.ceil(beatClock/grid+1e-6)*grid; return {b:nb,when:whenAtBeat(nb),gap:grid*SPBnow()/Math.max(1,speedMul)}; }

function vAt(freq,when,dur,type,g,slideTo,bus,dly,rev){
  if(!soundOn||!audio()||AC.state!=="running") return;
  const a=AC, t=Math.max(a.currentTime,when||a.currentTime);
  const o=a.createOscillator(), v=a.createGain();
  o.type=type||"square";
  o.frequency.setValueAtTime(Math.max(20,freq),t);
  if(slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo),t+dur);
  v.gain.setValueAtTime(0.0001,t);
  v.gain.exponentialRampToValueAtTime(Math.max(0.0002,g||0.04),t+0.008);
  v.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  const tf=a.createBiquadFilter(); tf.type="lowpass"; tf.frequency.value=2400; tf.Q.value=0.5;
  o.connect(v); v.connect(tf); tf.connect(BUS&&BUS[bus||"fxui"]?BUS[bus||"fxui"].g:master);
  if(dly&&FX){ const s=a.createGain(); s.gain.value=dly; tf.connect(s); s.connect(FX.dsend); }
  if(rev&&FX){ const s=a.createGain(); s.gain.value=rev; tf.connect(s); s.connect(FX.rsend); }
  o.start(t); o.stop(t+dur+0.05);
}
function noiseAt(when,dur,g,freq,bus){
  if(!soundOn||!audio()||AC.state!=="running") return;
  const a=AC, t=Math.max(a.currentTime,when||a.currentTime);
  const s=a.createBufferSource(); s.buffer=noiseBuf;
  const f=a.createBiquadFilter(); f.type="bandpass"; f.frequency.value=freq||6000; f.Q.value=1.1;
  const v=a.createGain();
  v.gain.setValueAtTime(Math.max(0.0002,g||0.05),t);
  v.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f); f.connect(v); v.connect(BUS&&BUS[bus||"drum"]?BUS[bus||"drum"].g:master);
  s.start(t); s.stop(t+dur+0.02);
}
function pluck(freq,when,g){ // dual-osc filtered pluck for turret leads, with delay throw
  if(!soundOn||!audio()||AC.state!=="running") return;
  const a=AC, t=Math.max(a.currentTime,when||a.currentTime);
  const o1=a.createOscillator(), o2=a.createOscillator(), f=a.createBiquadFilter(), v=a.createGain();
  o1.type="triangle"; o2.type="sawtooth";
  o1.frequency.setValueAtTime(freq,t); o2.frequency.setValueAtTime(freq,t);
  try{ o1.detune.setValueAtTime(-4,t); o2.detune.setValueAtTime(7,t); }catch(e){}
  f.type="lowpass"; f.Q.value=2;
  f.frequency.setValueAtTime(2400,t);
  f.frequency.exponentialRampToValueAtTime(320,t+0.18);
  v.gain.setValueAtTime(0.0001,t);
  v.gain.exponentialRampToValueAtTime(Math.max(0.0002,g),t+0.006);
  v.gain.exponentialRampToValueAtTime(0.0001,t+0.2);
  o1.connect(f); o2.connect(f); f.connect(v); v.connect(BUS.lead.g);
  if(FX){ const s=a.createGain(); s.gain.value=0.35; v.connect(s); s.connect(FX.dsend); }
  o1.start(t); o2.start(t); o1.stop(t+0.25); o2.stop(t+0.25);
}
function bassNote(freq,when,dur,g){ // sequencer bass: simple pluck — no feedback loop (KS stacked into mud)
  if(!soundOn||!audio()||AC.state!=="running") return;
  const a=AC, t=Math.max(a.currentTime,when||a.currentTime);
  const o=a.createOscillator(), f=a.createBiquadFilter(), v=a.createGain();
  o.type="triangle";
  o.frequency.setValueAtTime(Math.max(20,freq),t);
  f.type="lowpass"; f.frequency.setValueAtTime(1100,t);
  f.frequency.exponentialRampToValueAtTime(140,t+dur);
  v.gain.setValueAtTime(0.0001,t);
  v.gain.exponentialRampToValueAtTime(Math.max(0.0002,g),t+0.006);
  v.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(f); f.connect(v); v.connect(BUS.bass.g);
  o.start(t); o.stop(t+dur+0.05);
}
function kick(when){
  if(!soundOn||!audio()||AC.state!=="running") return;
  const a=AC, t=Math.max(a.currentTime,when||a.currentTime);
  const o=a.createOscillator(), v=a.createGain(); o.type="sine";
  o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(42,t+0.12);
  v.gain.setValueAtTime(0.001,t);
  v.gain.exponentialRampToValueAtTime(0.16,t+0.005);
  v.gain.exponentialRampToValueAtTime(0.0001,t+0.22);
  o.connect(v); v.connect(BUS.drum.g); o.start(t); o.stop(t+0.3);
  duck(t);
}
function padChord(when,beats){
  if(!soundOn||!audio()||AC.state!=="running") return;
  const a=AC, t=Math.max(a.currentTime,when||a.currentTime);
  const dur=beats*SPBnow()/Math.max(1,speedMul);
  const lp=a.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=800;
  const v=a.createGain(); const gg=waveActive?0.016:0.032;
  v.gain.setValueAtTime(0.0001,t);
  v.gain.linearRampToValueAtTime(gg,t+dur*0.3);
  v.gain.linearRampToValueAtTime(0.0001,t+dur);
  lp.connect(v); v.connect(BUS.pad.g);
  if(FX){ const rs=a.createGain(); rs.gain.value=0.7; v.connect(rs); rs.connect(FX.rsend); }
  for(const s of chordTones()){
    const o=a.createOscillator(); o.type="triangle";
    o.frequency.setValueAtTime(KEYROOT*Math.pow(2,(bendSemi(s)+transpose())/12),t);
    try{ o.detune.setValueAtTime((Math.random()*6-3)+corLevel()*14,t); }catch(e){}
    o.connect(lp); o.start(t); o.stop(t+dur+0.1);
  }
}
/* --- background sequencer: schedules one 16th ahead off the game beat clock --- */
function scheduler(){
  if(state!=="play"){ schedBeat=Math.ceil(beatClock*4)/4; return; }
  const running=useAC&&AC&&AC.state==="running"&&soundOn;
  if(schedBeat<beatClock-1) schedBeat=Math.ceil(beatClock*4)/4;
  const ahead=running?0.6:0;
  while(schedBeat<=beatClock+ahead){ schedTick(schedBeat); schedBeat+=0.25; }
}
function schedTick(b){
  const i16=Math.round(b*4), pos=((i16%16)+16)%16;
  if(pos===0){ barNum=Math.round(b/4); bentBar=Math.random()<corLevel()*0.9; arpIdx=0; threatLatched=threatSmooth; }
  if(!soundOn||!AC||AC.state!=="running") return;
  const when=whenAtBeat(b);
  if(when<AC.currentTime-0.02) return;          // stale tick: skip, never clamp-bunch at "now"
  const fight=waveActive||enemies.length>0;     // THE structural cue: drums exist only in combat
  const half=enemies.some(e=>e.boss&&!e.dead);  // boss = halftime
  const muted=b<muteUntilBeat;                  // a leak punches a hole of silence in the groove
  // kill-run voice: one 16th note per queued kill — monophonic rising pentatonic run
  if(killQ>0&&!muted){
    killQ--;
    const PENT=[0,3,5,7,10];
    const semi=PENT[runStep%5]+12*Math.floor((runStep%10)/5);
    runStep++;
    vAt(KEYROOT*Math.pow(2,(semi+transpose())/12),when,0.1,"triangle",0.018,0,"lead",0.12);
  }
  if(pos===0&&musicMode>=1) padChord(when,4);   // pads: the harmonic bed (FULL & MINIMAL)
  if(muted||musicMode<2) return;                // groove only in FULL mode
  if(fight){
    if(pos===0||(!half&&pos===8)) kick(when);
    if(half ? pos===8 : (pos===4||pos===12)) noiseAt(when,0.09,0.02,1500,"drum");
    if(hatsOn&&pos%2===0&&speedMul<3)
      noiseAt(when,0.03,0.006*(0.5+0.5*Math.min(1,enemies.length/12))*(0.7+0.3*threatLatched)*(pos%4===2?1.4:0.8),7500,"drum");
    const BP={0:0,6:1,8:0,14:1};                // root / fifth / root / fifth
    if(BP[pos]!==undefined){
      const T=chordTones(), s=T[BP[pos]%T.length];
      bassNote(KEYROOT*Math.pow(2,(bendSemi(s)+transpose())/12)/2,when,0.3,0.10);
    }
  }else{
    if(pos===0){ const T=chordTones();          // build phase: just a heartbeat root note
      bassNote(KEYROOT*Math.pow(2,(bendSemi(T[0])+transpose())/12)/2,when,0.5,0.08); }
  }
}
/* --- musical firing grid: gameplay quantization (audio-independent) --- */
const MUSDEF={
  zap:  {g:0.5, o:0,   shot:[1,0.75,0.5]},   // 8th grid; L3 ratchets to straight 8ths
  frz:  {g:1,   o:0.5, shot:[1,1,0.75]},     // the off-beats
  splat:{g:2,   o:0,   shot:[4,2,2]},        // half-bar plasma volleys
  flak: {g:0.25,o:0,   shot:[0.75,0.5,0.5]}, // 16th-note syncopation
};
function shotBeatsOf(t){ return MUSDEF[t.type].shot[t.lvl-1]/Math.max(0.05,brown*t.rateMul); }
function shotGain(base){ return base/Math.sqrt(1+shotHeat*0.35); }

/* combat voices */
function sfxZap(t){ shotHeat+=1; pluck(chz(towerDeg(t),1),0,shotGain(0.05)); }
function sfxFrz(t){ shotHeat+=0.5; vAt(chz(towerDeg(t)+1,2),0,0.18,"sine",shotGain(0.032),0,"lead",0.2,0.7); }
function sfxThunk(){ vAt(120,0,0.09,"sine",0.05,50,"drum"); }
function sfxBoom(){ vAt(110,0,0.16,"sine",0.06,48,"drum"); noiseAt(0,0.06,0.014,1000,"drum"); }
function sfxFlak(){ shotHeat+=0.6; noiseAt(0,0.04,shotGain(0.028),7200,"drum"); vAt(chz(2,3),0,0.05,"triangle",shotGain(0.012),0,"lead",0.3); }
function sfxNova(){ for(let i=0;i<4;i++) vAt(chz(3-i,2),AC?AC.currentTime+i*0.06:0,0.14,"sine",0.03,0,"lead",0,0.8); }
function sfxCrack(){ noiseAt(0,0.12,0.07,2300); vAt(chz(2,2),0,0.11,"square",0.045,chz(2,2)*0.6,"fxui",0,0.5); }
function sfxEmp(){ vAt(1400,0,0.5,"sawtooth",0.032,60,"fxui",0,0.6); noiseAt(0,0.4,0.03,900); }
function sfxLeak(){
  muteUntilBeat=Math.ceil(beatClock)+2; // half a bar of dead air — you HEAR the leak
  const f=KEYROOT*Math.pow(2,transpose()/12);
  vAt(f,0,0.45,"sawtooth",0.045,f*0.7,"fxui"); vAt(f*Math.pow(2,1/12),0,0.45,"sawtooth",0.028,0,"fxui"); // minor-2nd clash
}
function sfxNo(){ vAt(130,0,0.12,"square",0.05,100,"fxui"); }
function sfxSell(){ vAt(chz(1,0),0,0.14,"triangle",0.04,chz(1,0)*0.8,"fxui"); }
/* quantized economy sounds: land on the next gameplay gridline */
function sfxPlace(t){
  if(time<uiSfxT) return; uiSfxT=time+0.12;
  const q=nextGridWhen(0.5);
  pluck(chz(0,1),q.when,0.045);
}
function sfxOnBeat(){ if(time<uiSfxT) return; uiSfxT=time+0.12; vAt(chz(2,3),0,0.1,"sine",0.045,0,"fxui",0.3,0.5); }
function sfxUp(){
  if(time<uiSfxT) return; uiSfxT=time+0.12;
  const q=nextGridWhen(0.25);
  for(let i=0;i<3;i++) vAt(chz(i,2),q.when+i*q.gap,0.09,"triangle",0.028,0,"lead");
}
function sfxWave(){
  const q=nextGridWhen(1);
  vAt(chz(0,0),q.when,0.18,"triangle",0.05,0,"bass"); vAt(chz(2,0),q.when+q.gap*0.5,0.22,"triangle",0.05,0,"bass");
}
function sfxClear(){
  const q=nextGridWhen(1);
  [0,1,2,3].forEach((ti,i)=>vAt(chz(ti,1),q.when+i*0.02,0.55,"triangle",0.032,0,"pad",0,0.8));
}
function sfxResearch(){
  const q=nextGridWhen(0.25);
  vAt(chz(0,2),q.when,0.08,"sine",0.04,chz(0,2)*2,"fxui",0,0.5);
  vAt(chz(2,2),q.when+q.gap,0.14,"sine",0.04,0,"fxui",0,0.5);
}
/* kill combos walk up the chord */
let combo=0, comboT=0;
function comboTick(dt){ if(comboT>0){ comboT-=dt; if(comboT<=0){ combo=0; runStep=0; killQ=0; } } }
function sfxKill(e){
  if(e.boss){ vAt(50,0,0.6,"sawtooth",0.09,38,"bass"); [0,1,2].forEach(ti=>vAt(chz(ti,0),0,0.7,"sawtooth",0.03,0,"pad",0,0.7)); duck(); return; }
  combo++; comboT=1.2;
  killQ=Math.min(killQ+1,4);          // each kill queues one 16th of the rising run
  pend.kill++;                        // pops are pooled per frame in flushShots
}
/* laser drones, tuned to the live chord, pitch rides the damage ramp */
function laserOn(t){
  if(!soundOn||!audio()||AC.state!=="running"||t.voice) return;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type="triangle"; o.frequency.value=chzS(towerDeg(t),0);
  g.gain.value=0.0001;
  o.connect(g); g.connect(BUS.lead.g);
  if(FX){ const s=AC.createGain(); s.gain.value=0.3; g.connect(s); s.connect(FX.rsend); }
  o.start(); t.voice={o,g};
}
function laserTune(t){
  if(!t.voice||!AC) return;
  const f=chzS(towerDeg(t),0)*(1+t.ramp*0.5);
  t.voice.o.frequency.setTargetAtTime(f,AC.currentTime,0.05);
  try{ t.voice.o.detune.setTargetAtTime(corLevel()*22*Math.sin(time*3),AC.currentTime,0.08); }catch(e){}
  let nd=0; for(const x of towers) if(x.voice) nd++;
  t.voice.g.gain.setTargetAtTime((0.011+t.ramp*0.006)/Math.sqrt(Math.max(1,nd)),AC.currentTime,0.05);
}
function laserOff(t){
  if(!t.voice||!AC){ t.voice=null; return; }
  const v=t.voice; t.voice=null;
  try{ v.g.gain.setTargetAtTime(0.0001,AC.currentTime,0.04); v.o.stop(AC.currentTime+0.25); }catch(e){}
}
function stopAllVoices(){ for(const t of towers) laserOff(t); }

/* ================= UI ================= */
const $=id=>document.getElementById(id);
function announce(txt){
  const el=$("announce");
  el.textContent=txt; el.classList.add("show");
  annT=2.2;
}
function refreshUI(){
  $("uiCred").textContent=credits;
  $("uiLives").textContent=lives;
  $("uiBio").textContent=bio;
  $("uiWave").textContent=wave+(endless?"∞":"/30");
  $("uiScore").textContent=score;
  $("uiPow").textContent=powerLoad+"/"+powerCap;
  $("powchip").classList.toggle("warn",brown<1);
  const bw=$("btnWave");
  bw.disabled=!(state==="play"&&(!waveActive||spawnQ.length===0));
  bw.textContent= state!=="play" ? "DEPLOY WAVE" :
    (waveActive&&spawnQ.length>0) ? "WAVE INBOUND…" :
    enemies.length>0 ? "DEPLOY EARLY (+"+(10+wave*2)+" CR)" : "DEPLOY WAVE "+(wave+1);
  for(const k of TKEYS){
    const card=$("card_"+k);
    if(card) card.classList.toggle("cant",credits<TDEF[k].cost);
  }
}
function iIco(name,col,size){
  return svgi(name,col,size||12).replace("<svg ","<svg class=\"istat-ico\" ");
}
function svgRange(col,size){
  size=size||12;
  return '<svg class="istat-ico" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" color="'+col+
    '" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/>'+
    '<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>';
}
function istat(cls,icon,label,value){
  return '<span class="istat '+cls+'">'+icon+'<span class="istat-txt"><span class="ilabel">'+label+
    '</span><span class="ival">'+value+'</span></span></span>';
}
function buildTowerStats(t,d,st){
  const s=[];
  if(d.beam){
    s.push(istat("dmg",iIco("lzr","#ff2079"),"DPS",Math.round(st.dmg*(1+t.ramp))+' <span class="istat-sub">×'+(1+t.ramp).toFixed(1)+"</span>"));
    s.push(istat("rng",svgRange("#c77dff"),"RNG",Math.round(st.range)));
    s.push(istat("spc",iIco("lzr","#b6ff00"),"ARMOR","strips 3×"));
  }else if(t.type==="amp"){
    s.push(istat("dmg",iIco("amp","#ff2079"),"BUFF","+"+Math.round(TDEF.amp.buff[t.lvl-1]*100)+"% dmg"));
    s.push(istat("spc",iIco("pow","#c77dff"),"GRID","+"+TDEF.amp.gen[t.lvl-1]+" power"));
  }else if(t.type==="wall"){
    s.push(istat("spc",iIco("wall","#8d93b8"),"BLOCK","ground only"));
    s.push(istat("spc",iIco("pow","#8d83b8"),"DRAW","none"));
  }else{
    s.push(istat("dmg",iIco(t.type,d.col),"DMG",Math.round(st.dmg)));
    s.push(istat("rate",iIco("wavei","#00e5ff"),"FIRES",shotBeatsOf(t).toFixed(2)+" beats"));
    s.push(istat("rng",svgRange("#c77dff"),"RNG",Math.round(st.range)));
    if(st.splash) s.push(istat("spc",iIco("splat","#ff9f1c"),"SPLASH",Math.round(st.splash)));
    if(st.slow) s.push(istat("spc",iIco("frz","#7df9ff"),"SLOW",Math.round(st.slow*100)+"%"));
  }
  if(t.emp>0) s.push(istat("warn",iIco("zap","#ff5050"),"EMP","disabled"));
  return '<div class="istats">'+s.join("")+"</div>";
}
function refreshInfo(){
  const el=$("info");
  if(towerSel){
    const t=towerSel, d=TDEF[t.type], st=tStats(t);
    const tags=t.tags.map(s=>'<span class="syn">'+s+'</span>').join("")||
      '<span class="syn none">no active synergies</span>';
    el.innerHTML='<div class="ihead"><h3 style="color:'+d.col+'">'+svgi(t.type,d.col,16)+" "+d.name+
      '</h3><span class="ilvl" style="color:'+d.col+'">L'+t.lvl+"</span></div>"+
      buildTowerStats(t,d,st)+
      '<div class="isynrow">'+tags+'</div>'+
      '<div class="iacts row">'+
      (t.type==="wall"?'':t.lvl<3?'<button class="btn" id="btnUp">'+svgi("cred","#ff9f1c",12)+" UPGRADE "+upCost(t)+" CR</button>":
        '<span class="syn" style="border-color:#fff;color:#fff">MAX · '+d.l3+'</span>')+
      '<button class="btn pk" id="btnSell">'+svgi("cred","#ff2079",12)+" SELL +"+sellVal(t)+" CR</button></div>";
    const bu=$("btnUp"); if(bu) bu.onclick=()=>upgradeTower(t);
    $("btnSell").onclick=()=>sellTower(t);
  }else if(buildSel){
    const d=TDEF[buildSel];
    el.innerHTML='<h3 style="color:'+d.col+'">'+svgi(buildSel,d.col,16)+" "+d.name+' · '+d.cost+' CR · '+
      (buildSel==="amp"?("+"+d.gen[0]):d.power)+svgi("pow","#c77dff",11)+'</h3>'+
      '<span class="dim">'+d.blurb+"</span><br>"+
      '<span class="syn">'+d.syn+'</span> <span class="syn" style="border-color:#ff9f1c;color:#ff9f1c">'+d.l3+'</span><br>'+
      '<span class="dim">Targets: '+(buildSel==="amp"||buildSel==="wall"?"—":(d.grd?"GROUND ":"")+(d.air?"AIR":""))+' · Tap grid to place. Right-click / tap card again to cancel.</span>';
  }else{
    el.innerHTML='<h3>WELCOME BACK, CONTRACTOR</h3><span class="dim">Select a turret (1–7), tap the grid. Turrets are walls — maze the bugs. BULKHEADs are cheap pure walls. Turrets fire on the beat — place ON the pulse for refunds. Lasers crack plates. SPLAT clears goo. R opens R&amp;D.</span>';
  }
}
function buildCards(){
  const bar=$("buildbar");
  TKEYS.forEach((k,i)=>{
    const d=TDEF[k];
    const c=document.createElement("div");
    c.className="card"; c.id="card_"+k;
    c.style.borderColor=d.col;
    c.innerHTML=svgi(k,d.col,22)+'<span class="nm" style="color:'+d.col+'">'+d.name+'</span>'+
      '<span class="cs">'+d.cost+' '+svgi("cred","#ff9f1c",10)+
      ' <span class="pw">'+(k==="amp"?"+"+d.gen[0]:d.power)+' '+svgi("pow","#c77dff",10)+'</span></span>';
    c.onclick=()=>{
      if(buildSel===k){ buildSel=null; c.classList.remove("sel"); }
      else{
        buildSel=k; towerSel=null;
        document.querySelectorAll(".card").forEach(x=>x.classList.remove("sel"));
        c.classList.add("sel");
      }
      refreshInfo();
    };
    bar.appendChild(c);
  });
}
function renderResearch(){
  const list=$("resList");
  list.innerHTML="";
  for(const x of RES){
    const tier=res[x.id]||0, maxed=tier>=x.max;
    const row=document.createElement("div");
    row.className="ritem";
    let pips='<div class="pips">';
    for(let i=0;i<x.max;i++) pips+='<div class="pip'+(i<tier?" on":"")+'"></div>';
    pips+='</div>';
    row.innerHTML='<div class="rtxt"><div class="rname" style="color:var(--bio)">'+x.nm+'</div>'+
      '<div class="rdesc">'+x.desc+'</div>'+pips+'</div>'+
      (maxed?'<span class="syn" style="border-color:var(--bio);color:var(--bio)">MAXED</span>'
            :'<button class="btn bio" data-rid="'+x.id+'">'+x.cost[tier]+' '+svgi("bio","#5dff9e",11)+'</button>');
    list.appendChild(row);
  }
  list.querySelectorAll("button[data-rid]").forEach(b=>{
    b.onclick=()=>buyResearch(b.getAttribute("data-rid"));
  });
}
function buyResearch(id){
  const x=RES.find(r=>r.id===id);
  const tier=res[id]||0;
  if(tier>=x.max) return;
  const c=x.cost[tier];
  if(bio<c){ announce("NOT ENOUGH BIOMASS — GO HARVEST ELITES"); sfxNo(); return; }
  bio-=c; res[id]=tier+1;
  recalc(); renderResearch(); refreshUI(); sfxResearch();
  announce(x.nm+" TIER "+(tier+1)+" ONLINE");
}
function toggleResearch(force){
  const p=$("resPanel");
  const show=force!==undefined?force:p.classList.contains("hidden");
  p.classList.toggle("hidden",!show);
  if(show) renderResearch();
}
function canvasCell(ev){
  const rect=cv.getBoundingClientRect();
  const x=(ev.clientX-rect.left)*(W/rect.width);
  const y=(ev.clientY-rect.top)*(H/rect.height);
  return [Math.floor(x/CELL),Math.floor(y/CELL)];
}
cv.addEventListener("pointermove",ev=>{ hover=canvasCell(ev); });
cv.addEventListener("pointerdown",ev=>{
  audio();
  if(state!=="play") return;
  const [c,r]=canvasCell(ev);
  hover=[c,r];
  if(buildSel){ tryPlace(c,r); refreshUI(); return; }
  const t=inB(c,r)?grid[idx(c,r)]:null;
  towerSel=t||null;
  refreshInfo();
});
cv.addEventListener("contextmenu",ev=>{
  ev.preventDefault();
  buildSel=null; document.querySelectorAll(".card").forEach(x=>x.classList.remove("sel"));
  refreshInfo();
});
window.addEventListener("keydown",ev=>{
  if(handleIniKey(ev)) return;
  if(ev.code==="Space"){ ev.preventDefault(); deployWave(); }
  const n=parseInt(ev.key);
  if(n>=1&&n<=7){ $("card_"+TKEYS[n-1]).click(); }
  if(ev.key==="u"&&towerSel) upgradeTower(towerSel);
  if(ev.key==="x"&&towerSel) sellTower(towerSel);
  if(ev.key==="r"||ev.key==="R") toggleResearch();
  if(ev.key==="`"||ev.key==="~"){ audio(); $("mixPanel").classList.toggle("hidden"); }
  if(ev.key==="Escape"){ buildSel=null; towerSel=null; toggleResearch(false); $("mixPanel").classList.add("hidden");
    document.querySelectorAll(".card").forEach(x=>x.classList.remove("sel")); refreshInfo(); }
});
$("btnWave").onclick=()=>{ audio(); deployWave(); };
$("btnSpeed").onclick=()=>{ speedMul=speedMul===1?2:speedMul===2?3:1; $("btnSpeed").textContent=speedMul+"×"; reanchor(); };
$("btnSound").onclick=()=>{ soundOn=!soundOn; if(!soundOn){ stopAllVoices(); useAC=false; } else reanchor(); $("btnSound").style.opacity=soundOn?1:0.4; };
$("btnSound").oncontextmenu=ev=>{ ev.preventDefault(); audio(); $("mixPanel").classList.toggle("hidden"); }; // long-press / right-click SND = mixer
$("btnRes").onclick=()=>{ audio(); toggleResearch(); };
$("resPanel").addEventListener("pointerdown",ev=>{ if(ev.target===$("resPanel")) toggleResearch(false); });
$("btnStart").onclick=async ()=>{
  if(pendingScore) return;
  const a=audio();
  if(a&&a.state==="suspended") try{ await a.resume(); }catch(e){}
  if(state==="win"){ endless=true; state="play"; setOverlayVisible(false); lbHighlight=-1; announce("OVERTIME APPROVED (UNPAID)"); refreshUI(); reanchor(); return; }
  init(); reanchor(); state="play";
  setOverlayVisible(false);
  lbHighlight=-1;
  announce("SHIFT STARTED — BUILD A MAZE");
};
$("btnIniOk").onclick=()=>{ audio(); commitInitials(); };
document.querySelectorAll(".ini-char").forEach(el=>{
  el.addEventListener("click",()=>{
    const i=parseInt(el.getAttribute("data-i"),10);
    if(i===iniSlot) cycleIniLetter(1);
    else{ iniSlot=i; refreshIniDisplay(); }
    audio();
  });
  el.addEventListener("wheel",ev=>{
    ev.preventDefault();
    iniSlot=parseInt(el.getAttribute("data-i"),10);
    cycleIniLetter(ev.deltaY<0?1:-1);
  },{passive:false});
});

/* ---- live mixer ---- */
function buildMixer(){
  const rows=$("mixRows"); rows.innerHTML="";
  const defs=[["MASTER",null,0.55],["DRUMS","drum",0.9],["BASS","bass",0.75],["LEAD","lead",0.6],["PADS","pad",0.5],["FX/UI","fxui",0.7]];
  for(const [nm,key,dv] of defs){
    const row=document.createElement("div"); row.className="mrow";
    row.innerHTML='<label>'+nm+'</label><input type="range" min="0" max="150" value="100"><span class="mv">100</span>';
    const sl=row.querySelector("input"), mv=row.querySelector(".mv");
    sl.oninput=()=>{
      mv.textContent=sl.value;
      const f=sl.value/100;
      if(!audio()) return;
      if(key===null) master.gain.value=0.55*f;
      else { BUS[key].base=dv*f; BUS[key].g.gain.value=dv*f; }
    };
    rows.appendChild(row);
  }
  $("mixHats").onchange=()=>{ hatsOn=$("mixHats").checked; };
  document.querySelectorAll("#mixPanel [data-mm]").forEach(b=>{
    b.onclick=()=>{
      musicMode=parseInt(b.getAttribute("data-mm"));
      document.querySelectorAll("#mixPanel [data-mm]").forEach(x=>x.classList.toggle("on",x===b));
    };
  });
  document.querySelector('#mixPanel [data-mm="'+musicMode+'"]').classList.add("on");
}
buildMixer();

/* ================= MAIN LOOP & PLAYABLES LIFECYCLE ================= */
if(YT){
  try{ YT.system.onPause(()=>{paused=true; stopAllVoices();}); YT.system.onResume(()=>{paused=false;}); }catch(e){}
  try{ soundOn=YT.system.isAudioEnabled(); YT.system.onAudioEnabledChange(v=>{soundOn=v; if(!v) stopAllVoices();}); }catch(e){}
}
let last=performance.now(), firstFrame=false;
function loop(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now;
  update(dt);
  render();
  if(annT>0){ annT-=dt; if(annT<=0) $("announce").classList.remove("show"); }
  if(!firstFrame){ firstFrame=true; ytFirstFrame(); ytGameReady(); }
  requestAnimationFrame(loop);
}
function boot(){
  $("icCred").innerHTML=svgi("cred","#ff9f1c",15);
  $("icLives").innerHTML=svgi("core","#ff2079",15);
  $("icPow").innerHTML=svgi("pow","#c77dff",15);
  $("icBio").innerHTML=svgi("bio","#5dff9e",15);
  $("icWave").innerHTML=svgi("wavei","#e8e4ff",14);
  $("icRes").innerHTML=svgi("res","#5dff9e",14);
  $("icRes2").innerHTML=svgi("res","#5dff9e",18);
  $("btnSound").innerHTML=svgi("amp","#00e5ff",14)+"SND";
  state="menu";
  init();
  buildCards();
  initLeaderboard().then(()=>setOverlayVisible(true));
  requestAnimationFrame(loop);
}
loadGlyphs().then(boot);
