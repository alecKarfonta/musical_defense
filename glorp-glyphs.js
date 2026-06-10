"use strict";

/* Custom icon set — paths loaded from glyphs/*.svg (HUD + canvas share geometry) */
const GLYPH_NAMES=["zap","frz","splat","lzr","flak","amp","wall","cred","core","pow","bio","wavei","res"];
const GLYPH={
  zap:'<circle cx="12" cy="12" r="9"/><path d="M11 5 L14.5 10.5 L10 12 L13 19"/>',
  frz:'<path d="M12 3 L20 12 L12 21 L4 12 Z"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>',
  splat:'<path d="M12 3 L19.8 7.5 L19.8 16.5 L12 21 L4.2 16.5 L4.2 7.5 Z"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/>',
  lzr:'<path d="M12 4 L21 19 L3 19 Z"/><circle cx="12" cy="14.5" r="2" fill="currentColor" stroke="none"/>',
  flak:'<rect x="5" y="5" width="14" height="14"/><path d="M5 5 L19 19 M19 5 L5 19"/>',
  amp:'<path d="M12 3 L21 20 L3 20 Z"/><path d="M7 14.5 a 6.5 6.5 0 0 1 10 0"/>',
  wall:'<rect x="4" y="5" width="16" height="14"/><path d="M4 12 h16 M12 5 v7 M8 12 v7 M16 12 v7"/>',
  cred:'<path d="M12 2.8 L20 7.4 L20 16.6 L12 21.2 L4 16.6 L4 7.4 Z"/><path d="M9 9.5 h6 M9 14.5 h6 M12 7 v10"/>',
  core:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M12 2 v3.5 M12 18.5 v3.5 M2 12 h3.5 M18.5 12 h3.5"/>',
  pow:'<path d="M13.5 2 L6 13 L11 13 L9.5 22 L18 9.5 L12.5 9.5 Z"/>',
  bio:'<path d="M8.5 3 c5.5 4 -3.5 5.5 2 9 c5.5 3.5 -3.5 5 2 9"/><path d="M15.5 3 c-5.5 4 3.5 5.5 -2 9 c-5.5 3.5 3.5 5 -2 9"/><path d="M9 6.5 h6 M9 17.5 h6"/>',
  wavei:'<path d="M5 6.5 l7.5 5.5 -7.5 5.5 M12 6.5 l7.5 5.5 -7.5 5.5"/>',
  res:'<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5 L20.5 20.5"/><path d="M7.5 10 h5 M10 7.5 v5"/>',
};

async function loadGlyphs(){
  const missing=GLYPH_NAMES.filter(name=>!GLYPH[name]);
  if(missing.length) throw new Error("Missing glyphs: "+missing.join(", "));
}

function svgi(name,col,size){
  size=size||18;
  const body=GLYPH[name]||"";
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" color="'+col+
    '" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 3px '+col+')">'+body+'</svg>';
}
