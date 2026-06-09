"use strict";

/* Custom icon set — paths loaded from glyphs/*.svg (HUD + canvas share geometry) */
const GLYPH_NAMES=["zap","frz","splat","lzr","flak","amp","wall","cred","core","pow","bio","wavei","res"];
const GLYPH={};

async function loadGlyphs(){
  await Promise.all(GLYPH_NAMES.map(async name=>{
    const res=await fetch("glyphs/"+name+".svg");
    if(!res.ok) throw new Error("Failed to load glyph: "+name);
    const doc=new DOMParser().parseFromString(await res.text(),"image/svg+xml");
    GLYPH[name]=doc.documentElement.innerHTML;
  }));
}

function svgi(name,col,size){
  size=size||18;
  const body=GLYPH[name]||"";
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" color="'+col+
    '" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 3px '+col+')">'+body+'</svg>';
}
