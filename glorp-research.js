"use strict";
/* ================= SPHERE GRID R&D ================= */
const RS=(function(){
  const W=1800, H=1080, CX=900, CY=540;
  const PATH_COL={
    hub:"#e8e4ff", plasma:"#ff2079", cryo:"#7df9ff", grid:"#c77dff",
    bio:"#5dff9e", tempo:"#00e5ff", hand:"#ffd700", gate:"#ffe566",
  };
  /* Six paths, 60° apart — even spacing around the hub */
  const PATH_ANG={plasma:-90, cryo:-30, grid:30, bio:90, tempo:150, hand:210};
  const R0=118, R_STEP=62, SCHISM_OFF=88, GATE_OUTSET=52, LABEL_R=72;

  function ringPos(path, ring, perp){
    const ang=PATH_ANG[path], d=R0+ring*R_STEP;
    const a=(ang-90)*Math.PI/180;
    const ux=Math.cos(a), uy=Math.sin(a), nx=-uy, ny=ux;
    return {x:CX+ux*d+nx*(perp||0), y:CY+uy*d+ny*(perp||0)};
  }

  function nd(id, path, ring, perp, extra){
    const p=ringPos(path, ring, perp);
    return {id, path, ring, x:p.x, y:p.y, ...extra};
  }

  function gatePos(pa, pb, ring){
    const a1=PATH_ANG[pa], a2=PATH_ANG[pb];
    let mid=(a1+a2)/2;
    if(Math.abs(a1-a2)>180) mid=mid<0?mid+180:mid-180;
    const d=R0+ring*R_STEP+GATE_OUTSET+(ring>6?18:0);
    const rad=(mid-90)*Math.PI/180;
    return {x:CX+Math.cos(rad)*d, y:CY+Math.sin(rad)*d};
  }

  const RAW=[
    {id:"hub", path:"hub", type:"hub", label:"NEXUS", desc:"Contractor uplink. All paths branch here. God Hand smite starts at L1 — upgrade on the Hand path.",
      cost:0, x:CX, y:CY},

    /* ---- PLASMA ---- */
    nd("p_m1","plasma",0,0,{type:"minor",label:"HOTTER PLASMA I",desc:"+10% global damage",cost:4,mods:{dmg:1}}),
    nd("p_m2","plasma",1,0,{type:"minor",label:"HOTTER PLASMA II",desc:"+10% global damage",cost:6,mods:{dmg:1}}),
    nd("p_brute","plasma",2,-SCHISM_OFF,{type:"schism",label:"BRUTE FORCE",desc:"+20% global damage. Locks Surgical.",cost:7,mods:{dmg:2},schism:"p_schism"}),
    nd("p_precise","plasma",2,SCHISM_OFF,{type:"schism",label:"SURGICAL",desc:"+1 chain target. Locks Brute Force.",cost:7,mods:{chain:1},schism:"p_schism"}),
    nd("p_m3","plasma",3,0,{type:"minor",label:"HOTTER PLASMA III",desc:"+10% global damage",cost:8,mods:{dmg:1}}),
    nd("p_chain","plasma",4,0,{type:"minor",label:"FORKED LIGHTNING",desc:"+1 chain target for L3 ZAP-R",cost:7,mods:{chain:1}}),
    nd("p_ignition","plasma",5,0,{type:"keystone",label:"IGNITION",desc:"ZAP-R and SPLAT-O-MATIC apply burn.",cost:12,flag:"ignition"}),
    nd("p_detonate","plasma",6,0,{type:"keystone",label:"DETONATE",desc:"Burning bugs explode on death.",cost:14,flag:"detonate"}),
    nd("p_overcharge","plasma",7,0,{type:"minor",label:"OVERCHARGE COILS",desc:"+10% global damage",cost:11,mods:{dmg:1}}),
    nd("p_cascade","plasma",8,0,{type:"milestone",label:"PLASMA CASCADE",desc:"ZAP-R chain lightning deals full damage on every jump.",cost:18,flag:"plasma_cascade"}),
    nd("p_arc","plasma",9,0,{type:"minor",label:"ARC WELDER",desc:"+1 chain target for L3 ZAP-R",cost:14,mods:{chain:1}}),
    nd("p_sunspot","plasma",10,0,{type:"apex",label:"SUNSPOT",desc:"Burning bugs ignite neighbors each tick.",cost:22,core:2,flag:"sunspot"}),
    nd("p_fusion","plasma",11,0,{type:"minor",label:"FUSION TAP",desc:"+10% global damage",cost:16,mods:{dmg:1}}),
    nd("p_napalm","plasma",12,0,{type:"milestone",label:"NAPALM WELL",desc:"SPLAT splash radius +25%; napalm purges goo harder.",cost:20,flag:"napalm_well"}),
    nd("p_voltaic","plasma",13,0,{type:"minor",label:"VOLTAIC COIL",desc:"+1 chain target for L3 ZAP-R",cost:18,mods:{chain:1}}),
    nd("p_corona","plasma",14,0,{type:"transcendent",label:"CORONA",desc:"Burning bugs take +30% damage from all sources.",cost:28,core:3,flag:"corona"}),

    /* ---- CRYO ---- */
    nd("c_m1","cryo",0,0,{type:"minor",label:"DEEP FREEZE I",desc:"Slows 8% stronger",cost:4,mods:{cryo:1}}),
    nd("c_m2","cryo",1,0,{type:"minor",label:"DEEP FREEZE II",desc:"Slows 8% stronger",cost:6,mods:{cryo:1}}),
    nd("c_deep","cryo",2,-SCHISM_OFF,{type:"schism",label:"ABSOLUTE ZERO",desc:"+15% slow strength. Locks Flash.",cost:7,mods:{cryo:2},schism:"c_schism"}),
    nd("c_flash","cryo",2,SCHISM_OFF,{type:"schism",label:"FLASH FREEZE",desc:"CRYO nova 25% stronger. Locks Zero.",cost:7,mods:{nova:1},schism:"c_schism"}),
    nd("c_m3","cryo",3,0,{type:"minor",label:"RIME COATING",desc:"Slow duration +0.3s",cost:8,mods:{slowDur:1}}),
    nd("c_shatter","cryo",4,0,{type:"minor",label:"BRITTLE SHELL",desc:"+25% shatter damage vs slowed",cost:7,mods:{shatter:1}}),
    nd("c_permafrost","cryo",5,0,{type:"keystone",label:"PERMAFROST",desc:"Slowed bugs leave ice tiles.",cost:12,flag:"permafrost"}),
    nd("c_shatterstorm","cryo",6,0,{type:"keystone",label:"SHATTERSTORM",desc:"Killing slowed bugs fires ice shards.",cost:14,flag:"shatterstorm"}),
    nd("c_rime","cryo",7,0,{type:"minor",label:"RIME VENT",desc:"Slows 8% stronger",cost:11,mods:{cryo:1}}),
    nd("c_flashpoint","cryo",8,0,{type:"milestone",label:"FLASHPOINT",desc:"CRYO slow also ignites bugs.",cost:18,flag:"flashpoint"}),
    nd("c_hoar","cryo",9,0,{type:"minor",label:"HOARFROST",desc:"Slow duration +0.3s",cost:14,mods:{slowDur:1}}),
    nd("c_collapse","cryo",10,0,{type:"apex",label:"ABSOLUTE COLLAPSE",desc:"Bugs slowed 1.5s+ take +50% damage.",cost:22,core:2,flag:"absolute_collapse"}),
    nd("c_glacier","cryo",11,0,{type:"minor",label:"GLACIER VENT",desc:"Slows 8% stronger",cost:16,mods:{cryo:1}}),
    nd("c_stasis","cryo",12,0,{type:"milestone",label:"STASIS FIELD",desc:"Slows ignore boss slow-resistance floors.",cost:20,flag:"stasis_field"}),
    nd("c_bitter","cryo",13,0,{type:"minor",label:"BITTER RIME",desc:"+25% shatter damage vs slowed",cost:18,mods:{shatter:1}}),
    nd("c_prison","cryo",14,0,{type:"transcendent",label:"GLACIAL PRISON",desc:"Ice tiles slow bugs twice as hard.",cost:28,core:3,flag:"ice_prison"}),

    /* ---- GRID ---- */
    nd("g_m1","grid",0,0,{type:"minor",label:"GRID OVERHAUL I",desc:"+8 power capacity",cost:5,mods:{grid:1}}),
    nd("g_m2","grid",1,0,{type:"minor",label:"GRID OVERHAUL II",desc:"+8 power capacity",cost:7,mods:{grid:1}}),
    nd("g_expand","grid",2,-SCHISM_OFF,{type:"schism",label:"EXPANSION",desc:"+16 power. Locks Efficiency.",cost:7,mods:{grid:2},schism:"g_schism"}),
    nd("g_eff","grid",2,SCHISM_OFF,{type:"schism",label:"EFFICIENCY",desc:"+10% sell refund. Locks Expansion.",cost:7,mods:{scrap:1},schism:"g_schism"}),
    nd("g_m3","grid",3,0,{type:"minor",label:"GRID OVERHAUL III",desc:"+8 power capacity",cost:9,mods:{grid:1}}),
    nd("g_scrap","grid",4,0,{type:"minor",label:"SCRAP LOGISTICS",desc:"+10% sell refund",cost:4,mods:{scrap:1}}),
    nd("g_overvolt","grid",5,0,{type:"keystone",label:"OVERVOLT",desc:"Surplus power boosts fire rate.",cost:12,flag:"overvolt"}),
    nd("g_reserves","grid",6,0,{type:"keystone",label:"DEEP RESERVES",desc:"+15% sell refund and wave clear bonus.",cost:14,flag:"deep_reserves"}),
    nd("g_coil","grid",7,0,{type:"minor",label:"COIL ARRAY",desc:"+8 power capacity",cost:12,mods:{grid:1}}),
    nd("g_faraday","grid",8,0,{type:"milestone",label:"FARADAY CAGE",desc:"SHRIEKER EMP duration halved on turrets.",cost:18,flag:"faraday"}),
    nd("g_bus","grid",9,0,{type:"minor",label:"BUS BAR",desc:"+10% sell refund",cost:14,mods:{scrap:1}}),
    nd("g_super","grid",10,0,{type:"apex",label:"SUPERCONDUCTOR",desc:"Brownout penalty floor raised to 55%.",cost:22,core:2,flag:"superconductor"}),
    nd("g_m4","grid",11,0,{type:"minor",label:"TRANSFORMER IV",desc:"+8 power capacity",cost:17,mods:{grid:1}}),
    nd("g_tap","grid",12,0,{type:"milestone",label:"GRID TAP",desc:"AMP pylons passively purge nearby goo.",cost:20,flag:"grid_tap"}),
    nd("g_relay","grid",13,0,{type:"minor",label:"RELAY BUS",desc:"+10% sell refund",cost:18,mods:{scrap:1}}),
    nd("g_sing","grid",14,0,{type:"transcendent",label:"GRID SINGULARITY",desc:"+24 power capacity.",cost:28,core:3,mods:{grid:3}}),

    /* ---- BIO ---- */
    nd("b_m1","bio",0,0,{type:"minor",label:"GOO SOLVENT I",desc:"Purge corruption 50% faster",cost:5,mods:{purge:1}}),
    nd("b_m2","bio",1,0,{type:"minor",label:"GOO SOLVENT II",desc:"Purge corruption 50% faster",cost:7,mods:{purge:1}}),
    nd("b_purge","bio",2,-SCHISM_OFF,{type:"schism",label:"STERILIZE",desc:"+50% purge rate. Locks Cultivate.",cost:7,mods:{purge:2},schism:"b_schism"}),
    nd("b_cult","bio",2,SCHISM_OFF,{type:"schism",label:"CULTIVATE",desc:"+1 biomass from elites. Locks Sterilize.",cost:7,mods:{bioDrop:1},schism:"b_schism"}),
    nd("b_m3","bio",3,0,{type:"minor",label:"BIO REACTOR",desc:"+1 biomass on wave clear",cost:8,mods:{waveBio:1}}),
    nd("b_filter","bio",4,0,{type:"minor",label:"FILTRATION",desc:"Goo spread −10%",cost:6,mods:{gooResist:1}}),
    nd("b_symbiosis","bio",5,0,{type:"keystone",label:"SYMBIOSIS",desc:"Purged goo becomes slowing turf.",cost:12,flag:"symbiosis"}),
    nd("b_harvester","bio",6,0,{type:"keystone",label:"HARVESTER",desc:"All kills may drop biomass; elites always +1.",cost:14,flag:"harvester"}),
    nd("b_acid","bio",7,0,{type:"minor",label:"ACID WASH",desc:"Purge corruption 50% faster",cost:11,mods:{purge:1}}),
    nd("b_mold","bio",8,0,{type:"milestone",label:"MOLD BREAKER",desc:"Purging goo damages bugs on those tiles.",cost:18,flag:"mold_breaker"}),
    nd("b_spore","bio",9,0,{type:"minor",label:"SPORE FILTER",desc:"Goo spread −10%",cost:14,mods:{gooResist:1}}),
    nd("b_bloom","bio",10,0,{type:"apex",label:"BLOOM",desc:"Symbiosis turf burns ground bugs.",cost:22,core:2,flag:"bloom"}),
    nd("b_enzyme","bio",11,0,{type:"minor",label:"ENZYME BATH",desc:"Purge corruption 50% faster",cost:16,mods:{purge:1}}),
    nd("b_barrier","bio",12,0,{type:"milestone",label:"SPORE BARRIER",desc:"Corruption spread cap reduced 15%.",cost:20,flag:"spore_barrier"}),
    nd("b_ooze","bio",13,0,{type:"minor",label:"OOZE SEALANT",desc:"Goo spread −10%",cost:18,mods:{gooResist:1}}),
    nd("b_storm","bio",14,0,{type:"transcendent",label:"SPORE STORM",desc:"Deploying a wave purges 3 corrupted tiles.",cost:28,core:3,flag:"spore_storm"}),

    /* ---- TEMPO ---- */
    nd("t_m1","tempo",0,0,{type:"minor",label:"METRONOME I",desc:"+5% on-beat placement refund",cost:4,mods:{beatRefund:1}}),
    nd("t_m2","tempo",1,0,{type:"minor",label:"METRONOME II",desc:"+5% on-beat placement refund",cost:6,mods:{beatRefund:1}}),
    nd("t_pulse","tempo",2,-SCHISM_OFF,{type:"schism",label:"ON-PULSE",desc:"Wider on-beat window. Locks Downbeat.",cost:7,mods:{beatWindow:1},schism:"t_schism"}),
    nd("t_down","tempo",2,SCHISM_OFF,{type:"schism",label:"DOWNBEAT",desc:"+10% downbeat credit bonus. Locks On-Pulse.",cost:7,mods:{downbeat:1},schism:"t_schism"}),
    nd("t_m3","tempo",3,0,{type:"minor",label:"SYNC LOCK",desc:"Turret beat grid tightens",cost:8,mods:{beatRefund:1}}),
    nd("t_resonance","tempo",4,0,{type:"minor",label:"RESONANCE",desc:"+8% fire rate when on beat",cost:7,mods:{beatRate:1}}),
    nd("t_quantize","tempo",5,0,{type:"keystone",label:"QUANTIZE",desc:"On-beat window doubled; refund tripled.",cost:12,flag:"quantize"}),
    nd("t_drop","tempo",6,0,{type:"keystone",label:"DROP",desc:"Downbeat: bonus volley from all in-range turrets.",cost:14,flag:"drop"}),
    nd("t_sync","tempo",7,0,{type:"minor",label:"SYNC PULSE",desc:"+8% fire rate when on beat",cost:11,mods:{beatRate:1}}),
    nd("t_poly","tempo",8,0,{type:"milestone",label:"POLYRHYTHM",desc:"Off-beat smites still deal +25% damage.",cost:18,flag:"polyrhythm"}),
    nd("t_echo","tempo",9,0,{type:"minor",label:"ECHO CHAMBER",desc:"+10% downbeat deploy bonus",cost:14,mods:{downbeat:1}}),
    nd("t_finale","tempo",10,0,{type:"apex",label:"FINALE",desc:"When the last bug spawns, shock the whole wave for 15% max HP.",cost:22,core:2,flag:"finale"}),
    nd("t_flow","tempo",11,0,{type:"minor",label:"FLOW STATE",desc:"+8% fire rate when on beat",cost:16,mods:{beatRate:1}}),
    nd("t_drift","tempo",12,0,{type:"milestone",label:"TEMPO DRIFT",desc:"Game speed also boosts turret fire rate.",cost:20,flag:"tempo_drift"}),
    nd("t_measure","tempo",13,0,{type:"minor",label:"MEASURE TWICE",desc:"+5% on-beat placement refund",cost:18,mods:{beatRefund:1}}),
    nd("t_overtime","tempo",14,0,{type:"transcendent",label:"OVERTIME",desc:"At 3× speed, turrets deal +15% damage.",cost:28,core:3,flag:"overtime"}),

    /* ---- HAND ---- */
    nd("h_m1","hand",0,0,{type:"minor",label:"GOD HAND II",desc:"Smite hits harder. Tap bugs on the field.",cost:8,mods:{hand:1}}),
    nd("h_m2","hand",1,0,{type:"minor",label:"GOD HAND III",desc:"Further smite damage.",cost:10,mods:{hand:1}}),
    nd("h_m3","hand",2,0,{type:"minor",label:"GOD HAND IV",desc:"Corporate-approved divine violence.",cost:12,mods:{hand:1}}),
    nd("h_m4","hand",3,0,{type:"minor",label:"GOD HAND V",desc:"On-beat taps still deal double.",cost:14,mods:{hand:1}}),
    nd("h_wrath","hand",4,0,{type:"keystone",label:"WRATH",desc:"On-beat smite splashes to nearby bugs.",cost:12,flag:"hand_splash"}),
    nd("h_m5","hand",5,0,{type:"minor",label:"GOD HAND VI",desc:"Smite tier six.",cost:11,mods:{hand:1}}),
    nd("h_judge","hand",6,0,{type:"milestone",label:"JUDGMENT",desc:"Smite strips armor twice as fast.",cost:16,flag:"hand_judge"}),
    nd("h_swift","hand",7,0,{type:"minor",label:"SWIFT WRATH",desc:"Smite cooldown −0.03s",cost:12,mods:{handCd:1}}),
    nd("h_necrotic","hand",8,0,{type:"milestone",label:"NECROTIC GRIP",desc:"Smite applies slow.",cost:18,flag:"hand_slow"}),
    nd("h_m6","hand",9,0,{type:"minor",label:"GOD HAND VII",desc:"Maximum smite tier.",cost:14,mods:{hand:1}}),
    nd("h_apex","hand",10,0,{type:"apex",label:"DIVINE RETRIBUTION",desc:"Smite kills refund 2 credits.",cost:20,core:2,flag:"hand_retribution"}),
    nd("h_m7","hand",11,0,{type:"minor",label:"GOD HAND VIII",desc:"Smite tier eight.",cost:16,mods:{hand:1}}),
    nd("h_echo","hand",12,0,{type:"milestone",label:"HAND ECHO",desc:"Smite kills refund 50% of cooldown.",cost:20,flag:"hand_echo"}),
    nd("h_m8","hand",13,0,{type:"minor",label:"GOD HAND IX",desc:"Smite tier nine.",cost:18,mods:{hand:1}}),
    nd("h_apotheosis","hand",14,0,{type:"transcendent",label:"APOTHEOSIS",desc:"Smite deals double damage to elite bugs.",cost:26,core:3,flag:"hand_elite"}),

    /* ---- SIDE VEINS (optional power bumps, rejoin main path) ---- */
    nd("p_vein1","plasma",7,SCHISM_OFF*0.85,{type:"minor",label:"ARC DUCT",desc:"+10% global damage",cost:10,mods:{dmg:1}}),
    nd("p_vein2","plasma",7,SCHISM_OFF*1.7,{type:"minor",label:"PLASMA VENT",desc:"+10% global damage",cost:12,mods:{dmg:1}}),
    nd("c_vein1","cryo",7,SCHISM_OFF*0.85,{type:"minor",label:"RIME DUCT",desc:"Slows 8% stronger",cost:10,mods:{cryo:1}}),
    nd("c_vein2","cryo",7,SCHISM_OFF*1.7,{type:"minor",label:"CRYO VENT",desc:"+0.3s slow duration",cost:12,mods:{slowDur:1}}),
    nd("g_vein1","grid",7,SCHISM_OFF*0.85,{type:"minor",label:"COIL DUCT",desc:"+8 power capacity",cost:11,mods:{grid:1}}),
    nd("g_vein2","grid",7,SCHISM_OFF*1.7,{type:"minor",label:"GRID VENT",desc:"+10% sell refund",cost:13,mods:{scrap:1}}),
    nd("b_vein1","bio",7,SCHISM_OFF*0.85,{type:"minor",label:"SPORE DUCT",desc:"Purge 50% faster",cost:10,mods:{purge:1}}),
    nd("b_vein2","bio",7,SCHISM_OFF*1.7,{type:"minor",label:"BIO VENT",desc:"Goo spread −10%",cost:12,mods:{gooResist:1}}),
    nd("t_vein1","tempo",7,SCHISM_OFF*0.85,{type:"minor",label:"PULSE DUCT",desc:"+8% on-beat fire rate",cost:10,mods:{beatRate:1}}),
    nd("t_vein2","tempo",7,SCHISM_OFF*1.7,{type:"minor",label:"TEMPO VENT",desc:"+10% downbeat bonus",cost:12,mods:{downbeat:1}}),
    nd("h_vein1","hand",5,SCHISM_OFF*0.85,{type:"minor",label:"PALM DUCT",desc:"GOD HAND level +1",cost:11,mods:{hand:1}}),
    nd("h_vein2","hand",5,SCHISM_OFF*1.7,{type:"minor",label:"WRATH VENT",desc:"Smite cooldown −0.03s",cost:13,mods:{handCd:1}}),

    /* ---- DEEP SCHISMS (ring 8 fork — replay commitment) ---- */
    nd("p_wild","plasma",8,SCHISM_OFF*1.1,{type:"schism",label:"WILD ARC",desc:"+25% burn damage. Locks Focused Arc.",cost:16,mods:{burn:1},schism:"p_schism2"}),
    nd("p_focus","plasma",8,-SCHISM_OFF*1.1,{type:"schism",label:"FOCUSED ARC",desc:"+1 chain target. Locks Wild Arc.",cost:16,mods:{chain:1},schism:"p_schism2"}),
    nd("c_rime2","cryo",8,SCHISM_OFF*1.1,{type:"schism",label:"GLACIAL MASS",desc:"+20% slow strength. Locks Shatter.",cost:16,mods:{cryo:2},schism:"c_schism2"}),
    nd("c_shat2","cryo",8,-SCHISM_OFF*1.1,{type:"schism",label:"SHATTER LINE",desc:"+25% shatter damage. Locks Glacial.",cost:16,mods:{shatter:1},schism:"c_schism2"}),
    nd("g_bulk","grid",8,SCHISM_OFF*1.1,{type:"schism",label:"BULK TRANSFER",desc:"+16 power. Locks Relay.",cost:16,mods:{grid:2},schism:"g_schism2"}),
    nd("g_relay2","grid",8,-SCHISM_OFF*1.1,{type:"schism",label:"SMART RELAY",desc:"+15% sell refund. Locks Bulk.",cost:16,mods:{scrap:1},schism:"g_schism2"}),
    nd("b_flood","bio",8,SCHISM_OFF*1.1,{type:"schism",label:"FLOOD PURGE",desc:"+50% purge rate. Locks Spore.",cost:16,mods:{purge:2},schism:"b_schism2"}),
    nd("b_spore2","bio",8,-SCHISM_OFF*1.1,{type:"schism",label:"SPORE LINE",desc:"Goo spread −15%. Locks Flood.",cost:16,mods:{gooResist:2},schism:"b_schism2"}),
    nd("t_rush","tempo",8,SCHISM_OFF*1.1,{type:"schism",label:"RUSH DOWNBEAT",desc:"+15% downbeat bonus. Locks Flow.",cost:16,mods:{downbeat:2},schism:"t_schism2"}),
    nd("t_flow2","tempo",8,-SCHISM_OFF*1.1,{type:"schism",label:"FLOW STATE+",desc:"+10% on-beat fire rate. Locks Rush.",cost:16,mods:{beatRate:2},schism:"t_schism2"}),

    /* ---- ASCENSION (ring 15 capstones) ---- */
    nd("p_ascend","plasma",15,0,{type:"ascension",label:"SOLAR FLARE",desc:"Burning jumps to 2 neighbors each tick.",cost:35,core:4,flag:"solar_flare"}),
    nd("c_ascend","cryo",15,0,{type:"ascension",label:"ABSOLUTE ZERO",desc:"Bugs below 25% HP while slowed shatter.",cost:35,core:4,flag:"absolute_zero"}),
    nd("g_ascend","grid",15,0,{type:"ascension",label:"ZERO POINT",desc:"+36 power; overvolt bonus doubled.",cost:35,core:4,flag:"zero_point"}),
    nd("b_ascend","bio",15,0,{type:"ascension",label:"GENESIS",desc:"Wave clear restores 1 life if below 10.",cost:35,core:4,flag:"genesis"}),
    nd("t_ascend","tempo",15,0,{type:"ascension",label:"TIME DILATION",desc:"On-beat window +50%; smite off-beat +40%.",cost:35,core:4,flag:"time_dilation"}),
    nd("h_ascend","hand",15,0,{type:"ascension",label:"OMNISCIENCE",desc:"Smite deals triple damage to slowed bugs.",cost:35,core:4,flag:"omniscience"}),
  ];

  /* Gates: sit in the wedge between paths (offset outward from spokes) */
  (function placeGates(){
    const gates=[
      {id:"gate_pc",a:"plasma",b:"cryo",r:1,label:"THERMAL SHOCK",desc:"Burning slowed bugs detonate for splash damage.",cost:8,core:1,flag:"thermal_shock"},
      {id:"gate_cb",a:"cryo",b:"bio",r:1,label:"FROST ROT",desc:"Ice tiles spread corruption slower.",cost:8,core:1,flag:"frost_rot"},
      {id:"gate_gt",a:"grid",b:"tempo",r:1,label:"SYNC BUS",desc:"AMP pylons also boost fire rate +8%.",cost:8,core:1,flag:"sync_bus"},
      {id:"gate_bg",a:"bio",b:"grid",r:1,label:"ECO LOOP",desc:"Selling towers refunds 1 biomass.",cost:8,core:1,flag:"eco_loop"},
      {id:"gate_ph",a:"plasma",b:"hand",r:5,label:"THUNDERCLAP",desc:"On-beat smite arcs to one nearby bug.",cost:14,core:1,flag:"thunderclap"},
      {id:"gate_tb",a:"tempo",b:"bio",r:5,label:"LIFEBEAT",desc:"Wave clear restores 1 life if below 15.",cost:14,core:1,flag:"lifebeat"},
      {id:"gate_gc",a:"grid",b:"cryo",r:5,label:"CRYO CONDUIT",desc:"CRYO-MIST draws only 1 power.",cost:14,core:1,flag:"cryo_conduit"},
      {id:"gate_pt",a:"plasma",b:"tempo",r:8,label:"OVERDRIVE",desc:"On-beat smite also refunds 3 credits.",cost:18,core:2,flag:"overdrive"},
      {id:"gate_hb",a:"hand",b:"bio",r:8,label:"PURGE TOUCH",desc:"Smite purges goo under the target.",cost:18,core:2,flag:"purge_touch"},
      {id:"gate_gh",a:"grid",b:"hand",r:10,label:"GROUNDED FIST",desc:"Smite deals +50% vs ground bugs.",cost:20,core:2,flag:"hand_ground"},
      {id:"gate_pc2",a:"plasma",b:"cryo",r:10,label:"MELTDOWN",desc:"Thermal shock detonations are larger.",cost:20,core:2,flag:"meltdown"},
      {id:"gate_pb",a:"plasma",b:"bio",r:11,label:"CAUSTIC BURN",desc:"Burn damage +40%.",cost:22,core:2,flag:"caustic_burn"},
      {id:"gate_cs",a:"cryo",b:"grid",r:11,label:"COLD START",desc:"CRYO pylons start each wave with nova ready.",cost:22,core:2,flag:"cold_start"},
      {id:"gate_th",a:"tempo",b:"hand",r:12,label:"METRONOME PUNCH",desc:"Every 4th smite costs no cooldown.",cost:24,core:3,flag:"metronome_punch"},
      {id:"gate_ax",a:"plasma",b:"cryo",r:12,label:"ANNIHILATION",desc:"Thermal shock +50% damage.",cost:26,core:3,flag:"annihilation"},
      {id:"gate_vt",a:"grid",b:"tempo",r:12,label:"VOLT TEMPLE",desc:"Overvolt also adds +10% damage.",cost:26,core:3,flag:"volt_temple"},
      {id:"gate_bh",a:"bio",b:"hand",r:12,label:"BIOFEEDBACK",desc:"Smite kills always drop 1 biomass.",cost:26,core:3,flag:"biofeedback"},
      {id:"gate_pg",a:"plasma",b:"grid",r:13,label:"PLASMA GRID",desc:"+12% global damage while not in brownout.",cost:28,core:3,flag:"plasma_grid"},
    ];
    for(const g of gates){
      const p=gatePos(g.a,g.b,g.r);
      RAW.push({id:g.id,path:"gate",type:"gate",gateRing:g.r,label:g.label,
        desc:g.desc+ " Cross-path synergy — unlock path nodes on both sides first.",cost:g.cost,core:g.core,flag:g.flag,x:p.x,y:p.y});
    }
  })();

  const EDGES=[
    ["hub","p_m1"],["p_m1","p_m2"],["p_m2","p_brute"],["p_m2","p_precise"],
    ["p_brute","p_m3"],["p_precise","p_m3"],["p_m3","p_chain"],["p_chain","p_ignition"],["p_ignition","p_detonate"],
    ["p_detonate","p_overcharge"],["p_detonate","p_vein1"],["p_vein1","p_vein2"],["p_vein2","p_overcharge"],
    ["p_overcharge","p_cascade"],["p_cascade","p_wild"],["p_cascade","p_focus"],["p_wild","p_arc"],["p_focus","p_arc"],
    ["p_arc","p_sunspot"],["p_sunspot","p_fusion"],["p_fusion","p_napalm"],["p_napalm","p_voltaic"],["p_voltaic","p_corona"],["p_corona","p_ascend"],
    ["hub","c_m1"],["c_m1","c_m2"],["c_m2","c_deep"],["c_m2","c_flash"],
    ["c_deep","c_m3"],["c_flash","c_m3"],["c_m3","c_shatter"],["c_shatter","c_permafrost"],["c_permafrost","c_shatterstorm"],
    ["c_shatterstorm","c_rime"],["c_shatterstorm","c_vein1"],["c_vein1","c_vein2"],["c_vein2","c_rime"],
    ["c_rime","c_flashpoint"],["c_flashpoint","c_rime2"],["c_flashpoint","c_shat2"],["c_rime2","c_hoar"],["c_shat2","c_hoar"],
    ["c_hoar","c_collapse"],["c_collapse","c_glacier"],["c_glacier","c_stasis"],["c_stasis","c_bitter"],["c_bitter","c_prison"],["c_prison","c_ascend"],
    ["hub","g_m1"],["g_m1","g_m2"],["g_m2","g_expand"],["g_m2","g_eff"],
    ["g_expand","g_m3"],["g_eff","g_m3"],["g_m3","g_scrap"],["g_scrap","g_overvolt"],["g_overvolt","g_reserves"],
    ["g_reserves","g_coil"],["g_reserves","g_vein1"],["g_vein1","g_vein2"],["g_vein2","g_coil"],
    ["g_coil","g_faraday"],["g_faraday","g_bulk"],["g_faraday","g_relay2"],["g_bulk","g_bus"],["g_relay2","g_bus"],
    ["g_bus","g_super"],["g_super","g_m4"],["g_m4","g_tap"],["g_tap","g_relay"],["g_relay","g_sing"],["g_sing","g_ascend"],
    ["hub","b_m1"],["b_m1","b_m2"],["b_m2","b_purge"],["b_m2","b_cult"],
    ["b_purge","b_m3"],["b_cult","b_m3"],["b_m3","b_filter"],["b_filter","b_symbiosis"],["b_symbiosis","b_harvester"],
    ["b_harvester","b_acid"],["b_harvester","b_vein1"],["b_vein1","b_vein2"],["b_vein2","b_acid"],
    ["b_acid","b_mold"],["b_mold","b_flood"],["b_mold","b_spore2"],["b_flood","b_spore"],["b_spore2","b_spore"],
    ["b_spore","b_bloom"],["b_bloom","b_enzyme"],["b_enzyme","b_barrier"],["b_barrier","b_ooze"],["b_ooze","b_storm"],["b_storm","b_ascend"],
    ["hub","t_m1"],["t_m1","t_m2"],["t_m2","t_pulse"],["t_m2","t_down"],
    ["t_pulse","t_m3"],["t_down","t_m3"],["t_m3","t_resonance"],["t_resonance","t_quantize"],["t_quantize","t_drop"],
    ["t_drop","t_sync"],["t_drop","t_vein1"],["t_vein1","t_vein2"],["t_vein2","t_sync"],
    ["t_sync","t_poly"],["t_poly","t_rush"],["t_poly","t_flow2"],["t_rush","t_echo"],["t_flow2","t_echo"],
    ["t_echo","t_finale"],["t_finale","t_flow"],["t_flow","t_drift"],["t_drift","t_measure"],["t_measure","t_overtime"],["t_overtime","t_ascend"],
    ["p_m1","gate_pc"],["c_m1","gate_pc"],
    ["c_m1","gate_cb"],["b_m1","gate_cb"],
    ["g_m1","gate_gt"],["t_m1","gate_gt"],
    ["b_m1","gate_bg"],["g_m1","gate_bg"],
    ["hub","h_m1"],["h_m1","h_m2"],["h_m2","h_m3"],["h_m3","h_m4"],["h_m4","h_wrath"],
    ["h_wrath","h_m5"],["h_wrath","h_vein1"],["h_vein1","h_vein2"],["h_vein2","h_m5"],
    ["h_m5","h_judge"],["h_judge","h_swift"],["h_swift","h_necrotic"],["h_necrotic","h_m6"],["h_m6","h_apex"],
    ["h_apex","h_m7"],["h_m7","h_echo"],["h_echo","h_m8"],["h_m8","h_apotheosis"],["h_apotheosis","h_ascend"],
    ["p_cascade","gate_pt"],["t_poly","gate_pt"],
    ["h_necrotic","gate_hb"],["b_mold","gate_hb"],
    ["p_overcharge","gate_ph"],["h_m5","gate_ph"],
    ["t_resonance","gate_tb"],["b_filter","gate_tb"],
    ["g_scrap","gate_gc"],["c_shatter","gate_gc"],
    ["g_faraday","gate_gh"],["h_judge","gate_gh"],
    ["p_cascade","gate_pc2"],["c_stasis","gate_pc2"],
    ["p_napalm","gate_pb"],["b_barrier","gate_pb"],
    ["c_prison","gate_cs"],["g_tap","gate_cs"],
    ["t_drift","gate_th"],["h_echo","gate_th"],
    ["p_sunspot","gate_ax"],["c_collapse","gate_ax"],
    ["g_super","gate_vt"],["t_finale","gate_vt"],
    ["b_bloom","gate_bh"],["h_apex","gate_bh"],
    ["p_corona","gate_pg"],["g_sing","gate_pg"],
  ];

  const SCHISM={
    p_schism:["p_brute","p_precise"],
    c_schism:["c_deep","c_flash"],
    g_schism:["g_expand","g_eff"],
    b_schism:["b_purge","b_cult"],
    t_schism:["t_pulse","t_down"],
    p_schism2:["p_wild","p_focus"],
    c_schism2:["c_rime2","c_shat2"],
    g_schism2:["g_bulk","g_relay2"],
    b_schism2:["b_flood","b_spore2"],
    t_schism2:["t_rush","t_flow2"],
  };

  const nodes={};
  for(const n of RAW) nodes[n.id]=n;
  const adj={};
  for(const id of Object.keys(nodes)) adj[id]=[];
  for(const [a,b] of EDGES){
    if(!adj[a]) adj[a]=[];
    if(!adj[b]) adj[b]=[];
    adj[a].push(b); adj[b].push(a);
  }
  const STARTERS=new Set();
  for(const id of Object.keys(nodes)){
    if(id!=="hub"&&(adj[id]||[]).includes("hub")) STARTERS.add(id);
  }

  let owned=new Set(["hub"]);
  let locked=new Set();
  let cores=0;
  let bioGet=()=>0;
  let bioSpend=()=>{};

  function bindBio(getter, spender){
    bioGet=getter;
    bioSpend=spender;
  }
  function playerBio(){ return bioGet(); }
  let hover=null, selected=null, schismConfirm=null, pulseT=0;
  let camX=0, camY=0, camZ=1;
  const CAM_Z_MIN=0.45, CAM_Z_MAX=2.8, PAN_THRESH=6;
  let ptr=null;

  function isOwned(id){ return owned.has(id); }
  function isLocked(id){ return locked.has(id); }

  function neighborsOwned(id){
    for(const nb of adj[id]||[]) if(owned.has(nb)) return true;
    return id==="hub";
  }

  function canBuy(id){
    const n=nodes[id];
    if(!n||id==="hub"||owned.has(id)||locked.has(id)) return false;
    if(!neighborsOwned(id)) return false;
    if(playerBio()<n.cost) return false;
    if((n.core||0)>cores) return false;
    return true;
  }

  function applySchismLock(n){
    if(!n.schism) return;
    const pair=SCHISM[n.schism];
    if(!pair) return;
    for(const pid of pair) if(pid!==n.id) locked.add(pid);
  }

  function stat(name){
    let v=0;
    for(const id of owned){
      const m=nodes[id]?.mods;
      if(m&&m[name]!=null) v+=m[name];
    }
    return v;
  }

  function has(flag){
    for(const id of owned){
      if(nodes[id]?.flag===flag) return true;
    }
    return false;
  }

  function buy(id, force){
    const n=nodes[id];
    if(!n||id==="hub"||owned.has(id)) return false;
    if(!canBuy(id)){
      if(typeof announce==="function") announce("NOT ENOUGH BIOMASS OR CORE SPHERES");
      if(typeof sfxNo==="function") sfxNo();
      return false;
    }
    if(n.type==="schism"&&!force){
      schismConfirm=id;
      selected=id;
      renderResearch();
      return "confirm";
    }
    bioSpend(n.cost);
    if(n.core) cores-=n.core;
    owned.add(id);
    applySchismLock(n);
    schismConfirm=null;
    if(typeof recalc==="function") recalc();
    if(typeof refreshUI==="function") refreshUI();
    if(typeof sfxResearch==="function") sfxResearch();
    if(typeof announce==="function"){
      const tier=n.type==="ascension"?" — ASCENSION ONLINE":n.type==="transcendent"?" — TRANSCENDENT ONLINE":
        n.type==="apex"?" — APEX ONLINE":n.type==="milestone"?" — MILESTONE ONLINE":
        n.type==="keystone"||n.type==="gate"?" — KEYSTONE ONLINE":" ONLINE";
      announce(n.label+tier);
    }
    renderResearch();
    return true;
  }

  function reset(){
    owned=new Set(["hub"]);
    locked=new Set();
    cores=0;
    hover=null; selected=null; schismConfirm=null;
  }

  function addCore(n){
    cores+=n||1;
    if(typeof refreshUI==="function") refreshUI();
  }

  function nodeState(id){
    if(owned.has(id)) return "owned";
    if(locked.has(id)) return "locked";
    if(canBuy(id)) return "buyable";
    return "dim";
  }

  function purchaseBlock(id){
    const n=nodes[id];
    if(!n||id==="hub") return null;
    if(owned.has(id)) return "owned";
    if(locked.has(id)) return "locked";
    if(!neighborsOwned(id)) return "adjacent";
    if(playerBio()<n.cost) return "bio";
    if((n.core||0)>cores) return "core";
    return null;
  }

  function nodeRadius(n){
    if(n.type==="hub") return 14;
    if(n.type==="ascension") return 18;
    if(n.type==="transcendent") return 16;
    if(n.type==="apex") return 14;
    if(n.type==="milestone") return 12;
    if(n.type==="keystone") return 11;
    if(n.type==="gate") return 10;
    if(n.type==="schism") return 9;
    return 8;
  }

  function canvasXY(ev, cv){
    const rect=cv.getBoundingClientRect();
    return {
      x:(ev.clientX-rect.left)*(cv.width/rect.width),
      y:(ev.clientY-rect.top)*(cv.height/rect.height),
    };
  }

  function screenToWorld(sx, sy){
    return {x:(sx-camX)/camZ, y:(sy-camY)/camZ};
  }

  function fitCamera(){
    let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
    for(const n of Object.values(nodes)){
      minX=Math.min(minX,n.x); maxX=Math.max(maxX,n.x);
      minY=Math.min(minY,n.y); maxY=Math.max(maxY,n.y);
    }
    const pad=36, bw=maxX-minX+pad*2, bh=maxY-minY+pad*2;
    camZ=Math.min(W/bw, H/bh, 1.15);
    camZ=Math.max(CAM_Z_MIN, camZ);
    camX=(W-(minX+maxX)*camZ)/2;
    camY=(H-(minY+maxY)*camZ)/2;
  }

  function zoomAt(sx, sy, factor){
    const w=screenToWorld(sx, sy);
    camZ=Math.max(CAM_Z_MIN, Math.min(CAM_Z_MAX, camZ*factor));
    camX=sx-w.x*camZ;
    camY=sy-w.y*camZ;
  }

  function edgeEndpoints(na, nb){
    const dx=nb.x-na.x, dy=nb.y-na.y, len=Math.hypot(dx,dy)||1;
    const ux=dx/len, uy=dy/len;
    const ra=nodeRadius(na)+2, rb=nodeRadius(nb)+2;
    return {
      x1:na.x+ux*ra, y1:na.y+uy*ra,
      x2:nb.x-ux*rb, y2:nb.y-uy*rb,
    };
  }

  function strokeStyledEdge(ctx, x1,y1,x2,y2, lit, near, isGate, faint){
    const w=lit?4.5:near?3.2:2.4;
    ctx.lineCap="round";
    ctx.setLineDash(isGate?[8,6]:[]);
    const alpha=faint?0.22:1;
    ctx.globalAlpha=alpha;
    ctx.strokeStyle="rgba(0,0,0,0.65)";
    ctx.lineWidth=w+2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    if(lit){
      ctx.strokeStyle="#5dff9e";
      ctx.lineWidth=3.5;
      ctx.shadowColor="#5dff9e"; ctx.shadowBlur=8;
    }else if(near){
      ctx.strokeStyle="rgba(200,188,255,0.75)";
      ctx.lineWidth=2.8;
      ctx.shadowColor="rgba(180,160,255,0.4)"; ctx.shadowBlur=4;
    }else{
      ctx.strokeStyle=isGate?"rgba(255,229,102,0.35)":"rgba(110,95,175,0.55)";
      ctx.lineWidth=isGate?1.8:2.2;
      ctx.shadowBlur=0;
    }
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.shadowBlur=0;
    ctx.setLineDash([]);
    ctx.globalAlpha=1;
  }

  function drawEdge(ctx, na, nb, lit, near, isGate, faint){
    const {x1,y1,x2,y2}=edgeEndpoints(na, nb);
    strokeStyledEdge(ctx, x1,y1,x2,y2, lit, near, isGate, faint);
  }

  function drawGateEdge(ctx, na, nb, lit, near, faint){
    const {x1,y1,x2,y2}=edgeEndpoints(na, nb);
    const mx=(na.x+nb.x)/2, my=(na.y+nb.y)/2;
    const dx=mx-CX, dy=my-CY, len=Math.hypot(dx,dy)||1;
    const bulge=70+(na.type==="gate"&&na.gateRing?na.gateRing*4:0);
    const cpx=mx+dx/len*bulge, cpy=my+dy/len*bulge;
    const w=lit?4.5:near?3.2:2.2;
    ctx.lineCap="round";
    ctx.setLineDash([8,6]);
    ctx.globalAlpha=faint?0.18:1;
    ctx.strokeStyle="rgba(0,0,0,0.55)";
    ctx.lineWidth=w+2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(cpx,cpy,x2,y2); ctx.stroke();
    if(lit){
      ctx.strokeStyle="#ffe566";
      ctx.lineWidth=3;
      ctx.shadowColor="#ffe566"; ctx.shadowBlur=6;
    }else if(near){
      ctx.strokeStyle="rgba(255,229,102,0.7)";
      ctx.lineWidth=2.4;
    }else{
      ctx.strokeStyle="rgba(255,229,102,0.32)";
      ctx.lineWidth=1.8;
    }
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(cpx,cpy,x2,y2); ctx.stroke();
    ctx.shadowBlur=0;
    ctx.setLineDash([]);
    ctx.globalAlpha=1;
  }

  function gateEdgeVisible(na, nb){
    if(owned.has(na.id)||owned.has(nb.id)) return true;
    if(na.type==="gate"&&neighborsOwned(na.id)) return true;
    if(nb.type==="gate"&&neighborsOwned(nb.id)) return true;
    return owned.has(na.id)||owned.has(nb.id);
  }

  function drawMap(cv, ctx){
    pulseT+=0.04;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="rgba(4,2,14,0.98)";
    ctx.fillRect(0,0,W,H);

    ctx.save();
    ctx.setTransform(camZ,0,0,camZ,camX,camY);

    for(let gy=0;gy<=H;gy+=40){
      ctx.strokeStyle="rgba(60,45,110,0.12)"; ctx.lineWidth=1/camZ;
      ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke();
    }
    for(let gx=0;gx<=W;gx+=40){
      ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke();
    }

    for(const [a,b] of EDGES){
      const na=nodes[a], nb=nodes[b];
      if(!na||!nb) continue;
      if(na.type==="gate"||nb.type==="gate") continue;
      const lit=owned.has(a)&&owned.has(b);
      const near=owned.has(a)||owned.has(b);
      drawEdge(ctx, na, nb, lit, near, false, false);
    }
    for(const [a,b] of EDGES){
      const na=nodes[a], nb=nodes[b];
      if(!na||!nb) continue;
      const isGate=na.type==="gate"||nb.type==="gate";
      if(!isGate) continue;
      const lit=owned.has(a)&&owned.has(b);
      const near=owned.has(a)||owned.has(b);
      const faint=!gateEdgeVisible(na, nb);
      if(faint&&!near&&!lit) continue;
      drawGateEdge(ctx, na, nb, lit, near, faint);
    }

    for(const n of Object.values(nodes)){
      const st=nodeState(n.id);
      const col=PATH_COL[n.path]||"#fff";
      const r=nodeRadius(n);
      const sel=selected===n.id||hover===n.id;

      const gateHidden=n.type==="gate"&&st==="dim"&&!neighborsOwned(n.id);
      if(gateHidden) ctx.globalAlpha=0.14;
      else if(n.type==="gate"&&st==="dim") ctx.globalAlpha=0.45;

      if(st==="buyable"){
        const pulse=r+(STARTERS.has(n.id)?9:5);
        ctx.globalAlpha=gateHidden?0.14:0.35+0.25*Math.sin(pulseT);
        ctx.strokeStyle=col; ctx.lineWidth=STARTERS.has(n.id)?4:3;
        ctx.beginPath(); ctx.arc(n.x,n.y,pulse,0,Math.PI*2); ctx.stroke();
        ctx.globalAlpha=gateHidden?0.14:(n.type==="gate"&&st==="dim"?0.45:1);
      }

      if(n.type==="gate"){
        const gr=nodeRadius(n);
        ctx.save(); ctx.translate(n.x,n.y); ctx.rotate(Math.PI/4);
        ctx.fillStyle=st==="owned"?col:st==="locked"?"#444":"rgba(20,16,40,0.9)";
        ctx.strokeStyle=sel?"#fff":col; ctx.lineWidth=sel?2.5:1.5;
        ctx.fillRect(-gr,-gr,gr*2,gr*2);
        ctx.strokeRect(-gr,-gr,gr*2,gr*2);
        ctx.restore();
      }else if(n.type==="ascension"){
        ctx.save(); ctx.translate(n.x,n.y); ctx.rotate(pulseT*0.15);
        const s=r*1.25;
        ctx.fillStyle=st==="owned"?col:st==="locked"?"#444":"rgba(20,16,40,0.9)";
        ctx.strokeStyle=sel?"#fff":"#ffe566"; ctx.lineWidth=sel?3:2;
        ctx.beginPath();
        for(let i=0;i<10;i++){
          const a=i/10*Math.PI*2-Math.PI/2;
          const rad=i%2?s:s*0.42;
          const px=Math.cos(a)*rad, py=Math.sin(a)*rad;
          i?ctx.lineTo(px,py):ctx.moveTo(px,py);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if(st!=="locked"){
          ctx.globalAlpha=0.4+0.25*Math.sin(pulseT);
          ctx.strokeStyle="#ffe566"; ctx.lineWidth=3;
          ctx.beginPath(); ctx.arc(0,0,s+10,0,Math.PI*2); ctx.stroke();
          ctx.globalAlpha=1;
        }
        ctx.restore();
      }else if(n.type==="milestone"||n.type==="apex"||n.type==="transcendent"){
        ctx.save(); ctx.translate(n.x,n.y);
        if(n.type==="transcendent"){ ctx.rotate(Math.PI/8); }
        else if(n.type==="apex"){ ctx.rotate(Math.PI/6); }
        else{ ctx.rotate(Math.PI/4); }
        ctx.fillStyle=st==="owned"?col:st==="locked"?"#444":"rgba(20,16,40,0.9)";
        ctx.strokeStyle=sel?"#fff":col; ctx.lineWidth=sel?2.5:1.5;
        const sides=n.type==="transcendent"?8:6;
        const s=n.type==="transcendent"?r*1.2:(n.type==="apex"?r*1.15:r);
        ctx.beginPath();
        for(let i=0;i<sides;i++){
          const a=i/sides*Math.PI*2;
          const px=Math.cos(a)*s, py=Math.sin(a)*s;
          i?ctx.lineTo(px,py):ctx.moveTo(px,py);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if((n.type==="apex"||n.type==="transcendent")&&st!=="locked"){
          ctx.globalAlpha=0.35+0.2*Math.sin(pulseT);
          ctx.strokeStyle=col; ctx.lineWidth=n.type==="transcendent"?3:2;
          ctx.beginPath(); ctx.arc(0,0,s+(n.type==="transcendent"?8:5),0,Math.PI*2); ctx.stroke();
          ctx.globalAlpha=1;
        }
        ctx.restore();
      }else{
        ctx.fillStyle=st==="owned"?col:st==="locked"?"#333":"rgba(16,12,32,0.92)";
        ctx.strokeStyle=sel?"#fff":st==="locked"?"#666":col;
        ctx.lineWidth=sel?2.5:1.5;
        ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2);
        ctx.fill(); ctx.stroke();
      }

      if(st==="locked"&&n.type==="schism"){
        ctx.strokeStyle="#ff5050"; ctx.lineWidth=2;
        ctx.beginPath();
        ctx.moveTo(n.x-r,n.y-r); ctx.lineTo(n.x+r,n.y+r);
        ctx.moveTo(n.x+r,n.y-r); ctx.lineTo(n.x-r,n.y+r);
        ctx.stroke();
      }

      if(n.core&&st!=="owned"&&!gateHidden){
        ctx.fillStyle="#ffd700"; ctx.font="bold 9px Verdana"; ctx.textAlign="center";
        ctx.fillText("◆",n.x,n.y-r-6);
      }
      if(STARTERS.has(n.id)&&st==="buyable"){
        ctx.fillStyle=col; ctx.font="bold 8px Verdana"; ctx.textAlign="center";
        ctx.fillText("START",n.x,n.y+r+12);
      }
      if(n.type==="gate"&&st!=="dim"&&!gateHidden){
        ctx.fillStyle="rgba(255,229,102,0.75)"; ctx.font="bold 7px Verdana"; ctx.textAlign="center";
        ctx.fillText("SYN",n.x,n.y+r+10);
      }
      ctx.globalAlpha=1;
    }

    ctx.font="bold 10px Verdana"; ctx.textAlign="center";
    for(const [k,ang] of Object.entries(PATH_ANG)){
      const a=(ang-90)*Math.PI/180;
      const lx=CX+Math.cos(a)*LABEL_R, ly=CY+Math.sin(a)*LABEL_R;
      ctx.fillStyle=PATH_COL[k];
      ctx.strokeStyle="rgba(4,2,14,0.85)"; ctx.lineWidth=3;
      ctx.strokeText(k.toUpperCase(), lx, ly);
      ctx.fillText(k.toUpperCase(), lx, ly);
    }
    ctx.restore();
  }

  function hitRank(n, q){
    const st=nodeState(n.id);
    let rank=0;
    if(n.type==="gate"&&st==="dim"&&!neighborsOwned(n.id)) rank+=400;
    else if(n.type==="gate") rank+=120;
    if(st==="buyable") rank-=80;
    if(STARTERS.has(n.id)) rank-=40;
    if(n.type==="hub") rank-=20;
    return rank*1e6+q;
  }

  function hitTest(mx,my){
    let best=null, score=1e18;
    for(const n of Object.values(nodes)){
      const r=nodeRadius(n)+(STARTERS.has(n.id)?10:6);
      const dx=mx-n.x, dy=my-n.y, q=dx*dx+dy*dy;
      if(q>r*r) continue;
      const s=hitRank(n, q);
      if(s<score){ score=s; best=n.id; }
    }
    return best;
  }

  function adjacentHint(id){
    const need=[];
    for(const nb of adj[id]||[]){
      if(owned.has(nb)) continue;
      const nn=nodes[nb];
      if(!nn) continue;
      if(STARTERS.has(nb)) need.push(nn.label+" (path start)");
      else need.push(nn.label);
    }
    if(!need.length) return "Unlock a connected node first";
    return "Requires: "+need.slice(0,3).join(" or ");
  }

  const MOD_DESC={
    dmg:v=>"+"+(v*10)+"% global damage",
    grid:v=>"+"+(v*8)+" power capacity",
    cryo:v=>"slows "+(v*8)+"% stronger",
    chain:v=>"+"+v+" chain target(s) for L3 ZAP-R",
    scrap:v=>"+"+(v*10)+"% sell refund",
    purge:v=>"purge goo "+(v*50)+"% faster",
    slowDur:v=>"+"+(v*0.3).toFixed(1)+"s slow duration",
    shatter:v=>"+"+(v*25)+"% shatter damage vs slowed",
    nova:v=>"CRYO nova "+(v*25)+"% stronger",
    bioDrop:v=>"+"+v+" biomass from elites",
    waveBio:v=>"+"+v+" biomass on wave clear",
    gooResist:v=>"goo spread −"+(v*10)+"%",
    beatRefund:v=>"+"+(v*5)+"% on-beat placement refund",
    beatWindow:v=>"wider on-beat placement window",
    downbeat:v=>"+"+(v*10)+"% downbeat deploy bonus",
    beatRate:v=>"+"+(v*8)+"% fire rate on beat",
    hand:v=>"GOD HAND level +"+v,
    handCd:v=>"smite cooldown −"+(v*0.03).toFixed(2)+"s",
    burn:v=>"+"+(v*25)+"% burn damage",
  };
  const FLAG_DESC={
    ignition:"ZAP-R and SPLAT apply burn",
    detonate:"burning kills explode",
    permafrost:"slowed bugs leave ice tiles",
    shatterstorm:"killing slowed bugs fires ice shards",
    overvolt:"surplus power boosts fire rate",
    deep_reserves:"+15% sell refund and wave bonus",
    symbiosis:"purged goo becomes slowing turf",
    harvester:"more biomass drops; elites always +1",
    quantize:"on-beat window ×2; refund ×3",
    drop:"downbeat bonus volley from all turrets",
    hand_splash:"on-beat smite splashes nearby",
    thermal_shock:"burning + slowed bugs detonate",
    frost_rot:"ice slows corruption spread",
    sync_bus:"AMP pylons also boost fire rate",
    eco_loop:"selling towers refunds 1 biomass",
    plasma_cascade:"ZAP chain jumps deal full damage",
    sunspot:"burning bugs ignite neighbors",
    flashpoint:"CRYO slow also ignites",
    absolute_collapse:"+50% dmg vs long-slowed bugs",
    faraday:"SHRIEKER EMP duration halved",
    superconductor:"brownout floor raised to 55%",
    mold_breaker:"purging goo damages bugs on tile",
    bloom:"turf burns ground bugs",
    polyrhythm:"off-beat smites deal +25%",
    finale:"last spawn: shocks all bugs for 15% max HP",
    hand_judge:"smite strips armor 2× faster",
    hand_slow:"smite applies slow",
    hand_retribution:"smite kills refund 2 CR",
    thunderclap:"on-beat smite arcs to nearby bug",
    lifebeat:"wave clear restores 1 life",
    cryo_conduit:"CRYO-MIST draws 1 power",
    overdrive:"on-beat smite refunds 3 CR",
    purge_touch:"smite purges goo under target",
    napalm_well:"SPLAT splash +25%; stronger goo purge",
    corona:"burning bugs take +30% damage",
    stasis_field:"slows ignore boss slow floors",
    ice_prison:"ice tiles slow twice as hard",
    grid_tap:"AMP pylons purge nearby goo",
    spore_barrier:"corruption spread cap −15%",
    spore_storm:"wave deploy purges 3 goo tiles",
    tempo_drift:"game speed boosts fire rate",
    overtime:"3× speed grants +15% turret dmg",
    hand_echo:"smite kills refund 50% cooldown",
    hand_elite:"smite deals 2× vs elite bugs",
    hand_ground:"smite +50% vs ground bugs",
    meltdown:"thermal shock blasts are larger",
    caustic_burn:"burn damage +40%",
    cold_start:"CRYO nova ready each wave",
    metronome_punch:"every 4th smite is free",
    solar_flare:"burn spreads to 2 neighbors each tick",
    absolute_zero:"slowed bugs below 25% HP shatter",
    zero_point:"+36 power; overvolt bonus doubled",
    genesis:"wave clear restores 1 life if below 10",
    time_dilation:"on-beat window +50%; off-beat smite +40%",
    omniscience:"smite deals 3× vs slowed bugs",
    annihilation:"thermal shock +50% damage",
    volt_temple:"overvolt also grants +10% damage",
    biofeedback:"smite kills drop 1 biomass",
    plasma_grid:"+12% damage while not in brownout",
  };

  function effectLines(n){
    const out=[];
    if(n.mods) for(const [k,v] of Object.entries(n.mods)){
      if(MOD_DESC[k]) out.push(MOD_DESC[k](v));
    }
    if(n.flag&&FLAG_DESC[n.flag]) out.push(FLAG_DESC[n.flag]);
    return out;
  }

  function renderInfo(el, idSuffix){
    if(!el) return false;
    const id=selected||hover;
    if(!id){
      el.innerHTML='<span class="rd-empty dim">Tap a node on the grid to inspect and unlock it.</span>';
      return false;
    }
    const n=nodes[id];
    if(!n){
      el.innerHTML='<span class="rd-empty dim">Tap a node on the grid to inspect and unlock it.</span>';
      return false;
    }
    const sfx=idSuffix||"";
    const col=PATH_COL[n.path]||"#fff";
    const typeLbl=n.type==="hub"?"NEXUS":n.type==="gate"?"CROSS SYNERGY":STARTERS.has(id)?"PATH START":n.type.toUpperCase();
    const block=purchaseBlock(id);
    let costLbl="";
    if(id!=="hub"&&block!=="owned"){
      costLbl=n.cost+" BIO";
      if(n.core) costLbl+=" + "+n.core+" CORE";
    }
    const fx=effectLines(n);
    let metaHtml='<div class="rd-meta">';
    if(fx.length) metaHtml+='<div class="rd-meta-row"><span class="rd-meta-lbl syn-lbl">FX</span><span class="rd-meta-txt">'+fx.join(" · ")+"</span></div>";
    metaHtml+='<div class="rd-meta-row"><span class="rd-meta-lbl l3-lbl">TYPE</span><span class="rd-meta-txt">'+typeLbl+"</span></div>";
    metaHtml+="</div>";
    let buyHtml="";
    if(id==="hub"){
      buyHtml='<div class="rd-owned" style="border-color:'+col+';color:'+col+'">NEXUS ACTIVE</div>'+
        '<div class="rd-buy-hint">Tap a connected node on the ring around the center to spend biomass and open a path.</div>';
    }else if(block==="owned"){
      buyHtml='<div class="rd-owned" style="border-color:'+col+';color:'+col+'">ACTIVE</div>';
    }else if(block==="locked"){
      buyHtml='<div class="rd-buy"><button class="btn btn-res-buy" disabled>LOCKED THIS RUN</button></div>';
    }else if(block===null){
      if(schismConfirm===id)
        buyHtml='<div class="rd-buy"><button class="btn pk btn-res-buy" id="resBuyConfirm'+sfx+'">CONFIRM SCHISM — LOCKS ALTERNATE</button></div>';
      else
        buyHtml='<div class="rd-buy"><button class="btn bio btn-res-buy" id="resBuyBtn'+sfx+'">UNLOCK · '+costLbl+'</button></div>';
    }else{
      let hint="";
      if(block==="adjacent") hint=n.type==="gate"?"Cross synergies need path nodes on both sides — "+adjacentHint(id):adjacentHint(id);
      else if(block==="bio") hint="Need "+Math.max(0,n.cost-playerBio())+" more biomass";
      else if(block==="core") hint="Need "+Math.max(0,(n.core||0)-cores)+" more core sphere"+((n.core||0)-cores===1?"":"s");
      buyHtml='<div class="rd-buy"><button class="btn bio btn-res-buy" id="resBuyBtn'+sfx+'" disabled>UNLOCK · '+costLbl+
        '</button><div class="rd-buy-hint">'+hint+"</div></div>";
    }
    el.innerHTML=
      '<div class="rd-head"><div class="rd-name" style="color:'+col+'">'+n.label+'</div>'+
      '<span class="rd-badge" style="color:'+col+';border-color:'+col+'">'+n.path.toUpperCase()+"</span></div>"+
      '<div class="rd-desc">'+n.desc+"</div>"+
      metaHtml+buyHtml;
    const bb=document.getElementById("resBuyBtn"+sfx);
    if(bb&&!bb.disabled) bb.onclick=()=>buy(id);
    const bc=document.getElementById("resBuyConfirm"+sfx);
    if(bc) bc.onclick=()=>buy(id,true);
    return true;
  }

  function refreshPanel(){
    if(typeof refreshInfo==="function") refreshInfo();
  }

  function renderResearch(){
    const cv=document.getElementById("resCanvas");
    if(!cv) return;
    const ctx=cv.getContext("2d");
    drawMap(cv,ctx);
    refreshPanel();
  }

  function bindCanvas(){
    const cv=document.getElementById("resCanvas");
    if(!cv||cv._rsBound) return;
    cv._rsBound=true;

    function onPtrMove(ev){
      if(!ptr||ptr.id!==ev.pointerId) return;
      const s=canvasXY(ev, cv);
      const dx=s.x-ptr.sx, dy=s.y-ptr.sy;
      if(!ptr.panning&&Math.hypot(dx,dy)>PAN_THRESH) ptr.panning=true;
      if(ptr.panning){
        camX=ptr.cx+(s.x-ptr.sx);
        camY=ptr.cy+(s.y-ptr.sy);
        cv.classList.add("panning");
        renderResearch();
        return;
      }
      const w=screenToWorld(s.x, s.y);
      const nh=hitTest(w.x, w.y);
      if(nh!==hover){ hover=nh; renderResearch(); }
    }

    function endPtr(ev){
      if(!ptr||ptr.id!==ev.pointerId) return;
      try{ cv.releasePointerCapture(ev.pointerId); }catch(e){}
      if(!ptr.panning){
        const s=canvasXY(ev, cv);
        const w=screenToWorld(s.x, s.y);
        const id=hitTest(w.x, w.y);
        if(id){ selected=id; hover=id; schismConfirm=null; }
        else{ selected=null; hover=null; schismConfirm=null; }
        renderResearch();
      }
      ptr=null;
      cv.classList.remove("panning");
    }

    cv.addEventListener("pointerdown",ev=>{
      if(ev.button!==0) return;
      const s=canvasXY(ev, cv);
      ptr={id:ev.pointerId, sx:s.x, sy:s.y, cx:camX, cy:camY, panning:false};
      try{ cv.setPointerCapture(ev.pointerId); }catch(e){}
      ev.preventDefault();
    });
    cv.addEventListener("pointermove",ev=>{
      if(ptr&&ptr.id===ev.pointerId) onPtrMove(ev);
      else{
        const s=canvasXY(ev, cv);
        const w=screenToWorld(s.x, s.y);
        const nh=hitTest(w.x, w.y);
        if(nh!==hover){ hover=nh; renderResearch(); }
      }
    });
    cv.addEventListener("pointerup", endPtr);
    cv.addEventListener("pointercancel", endPtr);
    cv.addEventListener("pointerleave",()=>{
      if(!ptr){ hover=null; refreshPanel(); }
    });
    cv.addEventListener("wheel",ev=>{
      ev.preventDefault();
      const s=canvasXY(ev, cv);
      zoomAt(s.x, s.y, ev.deltaY>0?0.88:1.14);
      renderResearch();
    }, {passive:false});

    const zi=document.getElementById("resZoomIn");
    const zo=document.getElementById("resZoomOut");
    const zf=document.getElementById("resZoomFit");
    if(zi) zi.onclick=ev=>{ ev.stopPropagation(); zoomAt(W/2,H/2,1.2); renderResearch(); };
    if(zo) zo.onclick=ev=>{ ev.stopPropagation(); zoomAt(W/2,H/2,0.84); renderResearch(); };
    if(zf) zf.onclick=ev=>{ ev.stopPropagation(); fitCamera(); renderResearch(); };
  }

  function initUI(){
    bindCanvas();
    fitCamera();
    renderResearch();
  }

  function clearSelection(){
    selected=null; hover=null; schismConfirm=null;
  }

  return {
    stat, has, canBuy, buy, reset, renderResearch, renderInfo, initUI, clearSelection, bindBio,
    addCore, getCores:()=>cores, nodes, owned:()=>owned,
    isOpen:()=>{ const p=document.getElementById("resPanel"); return p&&!p.classList.contains("hidden"); },
  };
})();
