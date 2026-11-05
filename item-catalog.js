// Original prototype cosmetics; rarity terminology follows current Rocket League names.
// Los ids existentes NO cambian (las cuentas guardadas siguen funcionando). Cada color de un objeto es un objeto SEPARADO que se consigue por su cuenta:
// su id es "<objeto>~<color>" (igual que en RL, donde cada versión pintada es un objeto distinto).
export const RARITIES=[{id:'base',name:'Base',color:'#aebdca'},{id:'sport',name:'Sport · Inusual',color:'#58d2c8'},{id:'special',name:'Special · Raro',color:'#62aaff'},{id:'deluxe',name:'Deluxe · Muy raro',color:'#b48aff'},{id:'import',name:'Importado',color:'#ff696e'},{id:'exotic',name:'Exótico',color:'#ffd166'},{id:'blackmarket',name:'Mercado negro',color:'#f576e8'}];
export const CATEGORIES={body:'Coches',decal:'Decals',paint:'Pinturas',finish:'Texturas',topper:'Sombreros',wheels:'Llantas',boost:'Turbos',goalExplosion:'Explosiones de gol',frame:'Marcos',banner:'Banners',title:'Títulos'};
// Los 8 colores que se aplican a CADA objeto con variantes (decals, sombreros, llantas, turbos, explosiones y texturas con tinte).
export const VARIANT_COLORS=[['white','Blanco titanio','#f2f5f8'],['crimson','Carmesí','#e0213f'],['orange','Naranja','#ff8a1f'],['saffron','Amarillo azafrán','#ffc21f'],['lime','Verde lima','#8ee83a'],['cobalt','Cobalto','#2f5fff'],['purple','Púrpura','#a255ff'],['pink','Rosa','#ff6fae']];
const item=(id,name,category,rarity,style,color,variants=true)=>({id,name,category,rarity,style,color,variants});
// Marcos y banners de la tarjeta de jugador, uno por rango: los tres primeros son gratis y el resto sale de drops (más raro cuanto mayor el rango).
const TIERS=[['acero','Acero','base','#cfe3f2',null],['cobre','Bronce','sport','#ffb36b',0],['plata','Plata','sport','#eef6fb',1],['oro','Oro','special','#ffe46b',2],['esmeralda','Platino','special','#62f5d2',3],['zafiro','Diamante','deluxe','#6eb0ff',4],['amatista','Campeón','import','#d6a5ff',5],['rubi','Gran Campeón','exotic','#ff909c',6],['leyenda','Leyenda Supersónica','blackmarket','#f3e7ff',7]];
const RC=Object.fromEntries(RARITIES.map(r=>[r.id,r.color]));
// Títulos de la ficha de jugador (como en RL). [id, nombre, rareza, solo misión/pase]. Los marcados con 1 NO salen en drops.
const TITLES=[['title-none','Sin título','base'],
['title-novato','Novato','sport'],['title-aficionado','Aficionado','sport'],['title-pateador','Pateador','sport'],['title-conductor','Conductor','sport'],['title-madrugador','Madrugador','sport'],['title-turbofan','Fan del Turbo','sport'],
['title-goleador','Goleador','special'],['title-muro','El Muro','special'],['title-asistente','Asistente','special'],['title-veloz','Veloz','special'],['title-acrobata','Acróbata','special'],['title-tenaz','Tenaz','special'],
['title-imparable','Imparable','deluxe'],['title-aereo','Maestro del Aire','deluxe'],['title-portero','Portero de Hierro','deluxe'],['title-cazagoles','Cazagoles','deluxe'],['title-francotirador','Francotirador','deluxe'],['title-estratega','Estratega','deluxe'],
['title-leyendalocal','Leyenda Local','import'],['title-reyturbo','Rey del Turbo','import'],['title-tormenta','Tormenta','import'],['title-rompered','Rompe Redes','import'],['title-capitan','Capitán','import'],['title-fenomeno','Fenómeno','import'],
['title-estrella','Estrella Fugaz','exotic'],['title-dominador','Dominador','exotic'],['title-intocable','Intocable','exotic'],['title-supernova','Supernova','exotic'],['title-velocidad','Pura Velocidad','exotic'],
['title-sintecho','Sin Techo','blackmarket'],['title-vacio','Maestro del Vacío','blackmarket'],['title-imposible','Imposible','blackmarket'],
['title-m-debut','Debutante','special',1],['title-m-olfato','Olfato de Gol','special',1],['title-m-miras','Punto de Mira','deluxe',1],['title-m-guardian','Guardián','deluxe',1],['title-m-invicto','Invicto','import',1],['title-m-semana','Racha Semanal','deluxe',1],['title-m-veterano','Veterano de la Arena','exotic',1],['title-m-maxgoleador','Máximo Goleador','import',1],['title-m-maraton','Maratón de Temporada','blackmarket',1],
['title-kickoff-recluta','Recluta Kickoff','special',1],['title-kickoff-corredor','Corredor Kickoff','deluxe',1],['title-kickoff-veterano','Veterano Kickoff','import',1],['title-kickoff-leyenda','Leyenda Kickoff','exotic',1]];
const rows=(category,list,variants=true)=>list.map(([id,name,rarity,style,color])=>item(id,name,category,rarity,style,color,variants));
const BASE_ITEMS=[
 // ---- Coches ----
 ...[['octane','Octane','base'],['fennec','Fennec','import'],['dominus','Dominus','import'],['f1','F1 Concept','exotic']].map(([id,name,rarity])=>item(id,name,'body',rarity,id,undefined,false)),
 // ---- Decals ----
 item('decal-none','Sin decal','decal','base','none',undefined,false),
 ...rows('decal',[
  ['decal-stripes','Franjas de circuito','sport','stripes','#f5f4d9'],['decal-diamonds','Rombos','sport','diamonds','#ffd36b'],['decal-waves','Olas','sport','waves','#5ed4ff'],['decal-chevron','Chevrones','sport','chevron','#ffe36e'],['decal-zigzag','Zigzag','sport','zigzag','#ff9fd0'],['decal-polka','Lunares','sport','polka','#ffffff'],
  ['decal-checker','Bandera a cuadros','special','checker','#edf5ff'],['decal-flames','Llamas','special','flames','#ffd266'],['decal-stars','Lluvia de estrellas','special','stars','#ffe66d'],['decal-camo','Camuflaje urbano','special','camo','#79d86a'],['decal-halftone','Pop art','special','halftone','#ff6f91'],['decal-plaid','Tartán','special','plaid','#ff6b6b'],['decal-cloud','Nubes','special','cloud','#ffffff'],['decal-hearts','Corazones','special','hearts','#ff7aa8'],['decal-sakura','Flores de cerezo','special','sakura','#ffb7d0'],
  ['decal-lightning','Relámpago','deluxe','lightning','#a4efff'],['decal-scales','Escamas de dragón','deluxe','scales','#ff5d4a'],['decal-circuit','Circuito neón','deluxe','circuit','#4dffb8'],['decal-racing','Dorsal 07','deluxe','racing','#ffffff'],['decal-sunburst','Rayos de sol','deluxe','sunburst','#ffd24a'],['decal-topo','Mapa topográfico','deluxe','topo','#9be86a'],['decal-soundwave','Ecualizador','deluxe','soundwave','#6ee7ff'],['decal-mosaic','Mosaico','deluxe','mosaic','#8fd0ff'],
  ['decal-hex','Hexágonos','import','hex','#9c8cff'],['decal-tribal','Tribal','import','tribal','#ffb347'],['decal-glitch','Glitch','import','glitch','#ff4fd8'],['decal-leopard','Leopardo','import','leopard','#ffc766'],['decal-zebra','Cebra','import','zebra','#ffffff'],['decal-tiger','Tigre','import','tiger','#ff8c2a'],['decal-spiderweb','Telaraña','import','spiderweb','#e8f1ff'],['decal-splatter','Salpicaduras','import','splatter','#ff4fa3'],
  ['decal-skull','Calaveras','exotic','skull','#e8f1ff'],['decal-aurora','Aurora boreal','exotic','aurora','#7dffcf'],['decal-gears','Engranajes','exotic','gears','#ffcf70'],['decal-invader','Invasores pixelados','exotic','invader','#7dff7a'],
  ['decal-nebula','Nebulosa','blackmarket','nebula','#ec86ff'],['decal-void','Fisuras del vacío','blackmarket','void','#b06bff']]),
 // ---- Pinturas (cada una es un color completo) ----
 item('paint-standard','Color personalizado','paint','base','standard',undefined,false),
 ...rows('paint',[
  ['paint-white','Blanco titanio','sport','color','#f1f4f7'],['paint-black','Negro obsidiana','sport','color','#17191d'],['paint-crimson','Carmesí','sport','color','#d3213b'],['paint-cobalt','Cobalto','sport','color','#2751ff'],['paint-orange','Naranja atardecer','sport','color','#ff7f1f'],['paint-ice','Azul glaciar','sport','color','#70dcff'],['paint-slate','Pizarra','sport','color','#4b5563'],['paint-lemon','Limón','sport','color','#f3e83a'],
  ['paint-pink','Rosa chicle','special','color','#ff69b4'],['paint-forest','Verde bosque','special','color','#1f8f4e'],['paint-purple','Púrpura real','special','color','#7a3cff'],['paint-sienna','Siena tostada','special','color','#a8501f'],['paint-lime','Verde lima','special','color','#b9ef57'],['paint-coral','Coral','special','color','#ff6f61'],['paint-navy','Azul marino','special','color','#12306b'],['paint-olive','Oliva','special','color','#6b7d2a'],
  ['paint-saffron','Azafrán','deluxe','color','#ffbf1a'],['paint-teal','Turquesa','deluxe','color','#13c5b8'],['paint-mint','Menta helada','deluxe','color','#8ff5d1'],['paint-pearl','Perla ártica','deluxe','color','#e6e5ff'],['paint-lavender','Lavanda','deluxe','color','#b79cff'],['paint-chocolate','Chocolate','deluxe','color','#5a2e14'],
  ['paint-magma','Magma','import','color','#ff3d12'],['paint-midnight','Medianoche','import','color','#14205c'],['paint-peach','Melocotón','import','color','#ffb27a'],['paint-neon','Verde neón','import','color','#39ff14'],
  ['paint-gold','Oro solar','exotic','color','#efbe52'],['paint-rose','Oro rosa','exotic','color','#e9a38f'],['paint-royal','Azul real eléctrico','exotic','color','#1d4dff'],
  ['paint-void','Violeta del vacío','blackmarket','color','#4b1d8f'],['paint-crimsonvoid','Rojo abisal','blackmarket','color','#6e0620']],false),
 // ---- Texturas (las que pueden teñirse tienen 8 colores) ----
 item('finish-gloss','Brillante','finish','base','gloss',undefined,false),
 ...rows('finish',[['finish-satin','Satinado','sport','satin','#e0e6ee'],['finish-matte','Mate','sport','matte','#d3dae3'],['finish-leather','Cuero','sport','leather','#a86a3d']].map(r=>r),false).map(i=>({...i,variants:i.id!=='finish-leather'})),
 ...rows('finish',[['finish-carbon','Fibra de carbono','special','carbon','#aeb7c0'],['finish-wood','Madera barnizada','special','wood','#c58a4d'],['finish-candy','Caramelo','special','candy','#ff5d8f'],['finish-marble','Mármol','special','marble','#f4f4f8'],
  ['finish-metal','Metal cepillado','deluxe','metal','#c9d1d8'],['finish-pearl','Perlado','deluxe','pearl','#f2e8ff'],['finish-ice','Hielo escarchado','deluxe','ice','#bfeaff'],
  ['finish-chrome','Cromo','import','chrome','#e8eef5'],['finish-glitter','Brillantina','import','glitter','#ffe9a8'],['finish-oil','Mancha de aceite','import','oil','#7d6bff'],
  ['finish-holo','Holográfico','exotic','holo','#ffffff'],['finish-galaxy','Cielo estrellado','exotic','galaxy','#6b5bff'],['finish-lava','Lava fundida','blackmarket','lava','#ff5a1f']],false).map(i=>({...i,variants:!['finish-wood','finish-marble','finish-holo','finish-galaxy','finish-lava','finish-oil','finish-ice'].includes(i.id)})),
 // ---- Sombreros ----
 item('topper-none','Sin sombrero','topper','base','none',undefined,false),
 ...rows('topper',[
  ['topper-halo','Aureola','sport','halo','#ffe48b'],['topper-cone','Cono de tráfico','sport','cone','#ff923d'],['topper-propeller','Gorro de hélice','sport','propeller','#ff5a5a'],['topper-chef','Gorro de chef','sport','chef','#ffffff'],['topper-santa','Gorro navideño','sport','santa','#e0213f'],['topper-party','Gorro de fiesta','sport','party','#ff6fae'],['topper-flag','Bandera ondeante','sport','flag','#ff4d4d'],['topper-duck','Patito de goma','sport','duck','#ffd83a'],['topper-sprout','Brote verde','sport','sprout','#6bdc4a'],['topper-fez','Fez','sport','fez','#d03a3a'],
  ['topper-cap','Gorra deportiva','special','cap','#ff577d'],['topper-tophat','Chistera','special','tophat','#2b2f3a'],['topper-bunny','Orejas de conejo','special','bunny','#f4f4ff'],['topper-cat','Orejas de gato','special','cat','#ffb3d0'],['topper-pirate','Sombrero pirata','special','pirate','#2a2a36'],['topper-cowboy','Sombrero vaquero','special','cowboy','#b5793c'],['topper-umbrella','Paraguas','special','umbrella','#3d8bff'],['topper-mushroom','Seta mágica','special','mushroom','#ff4a4a'],['topper-icecream','Helado','special','icecream','#ff9ecb'],['topper-donut','Dona glaseada','special','donut','#ff8cc1'],
  ['topper-shark','Aleta de tiburón','deluxe','shark','#7d94a8'],['topper-wizard','Sombrero de mago','deluxe','wizard','#5b3cff'],['topper-antenna','Antena satelital','deluxe','antenna','#d0dae6'],['topper-viking','Casco vikingo','deluxe','viking','#b9c3cf'],['topper-sombrero','Sombrero mexicano','deluxe','sombrero','#e2b04a'],['topper-rocket','Cohete','deluxe','rocket','#e8f1ff'],['topper-pumpkin','Calabaza tallada','deluxe','pumpkin','#ff8a1f'],['topper-antlers','Astas de reno','deluxe','antlers','#a8743a'],
  ['topper-crown','Corona','import','crown','#ffd166'],['topper-devil','Cuernos de diablillo','import','devil','#ff2f3f'],['topper-laurel','Corona de laurel','import','laurel','#9ee86a'],['topper-trophy','Trofeo','import','trophy','#ffd166'],['topper-flame','Llamarada','import','flame','#ff7a1a'],
  ['topper-ufo','Platillo orbital','exotic','ufo','#83fff0'],['topper-icecrown','Corona de hielo','exotic','icecrown','#9fefff'],
  ['topper-void','Halo del abismo','blackmarket','voidhalo','#c35dff']]),
 // ---- Llantas ----
 item('wheels-stock','Llantas originales','wheels','base','stock',undefined,false),
 ...rows('wheels',[
  ['wheels-silver','Disco de plata','sport','disc','#d5e3ef'],['wheels-mesh','Rejilla clásica','sport','mesh','#c8d4de'],['wheels-gear','Engranaje','sport','gear','#c9d2dc'],['wheels-triple','Tres aros','sport','triple','#d8e2ec'],
  ['wheels-rally','Rally rojo','special','spokes','#ff6959'],['wheels-star','Estrella de cinco puntas','special','star','#ffd36b'],['wheels-vinyl','Disco de vinilo','special','vinyl','#ff8bd0'],['wheels-saw','Sierra circular','special','saw','#dfe7ee'],['wheels-snow','Copo de nieve','special','snow','#bfeaff'],
  ['wheels-neon','Aro neón','deluxe','neon','#70d9ff'],['wheels-blade','Cuchillas','deluxe','blade','#8fe6ff'],['wheels-hex','Panal','deluxe','hexa','#ffb54d'],['wheels-petal','Flor','deluxe','petal','#ff9ec7'],['wheels-triangle','Triángulos','deluxe','triangle','#9cf0c8'],['wheels-cog','Piñón','deluxe','cog','#e0b36a'],['wheels-pixel','Pixel art','deluxe','pixel','#7dff7a'],
  ['wheels-gold','Turbina dorada','import','turbine','#ffdb77'],['wheels-spinner','Spinners','import','spinner','#ff6bd6'],['wheels-bolt','Rayo','import','bolt','#ffe45e'],['wheels-eye','Ojo vigilante','import','eye','#8ff0ff'],['wheels-claw','Garras','import','claw','#ff6b6b'],
  ['wheels-plasma','Plasma violeta','exotic','plasma','#c38aff'],['wheels-orbital','Orbital','exotic','orbital','#7dffea'],['wheels-galaxy','Espiral galáctica','exotic','galaxy','#a98bff'],['wheels-flame','Llamas vivas','exotic','flame','#ff7a1a'],
  ['wheels-void','Vacío','blackmarket','void','#b05bff']]),
 // ---- Turbos ----
 ...rows('boost',[
  ['boost-standard','Turbo estándar','base','standard','#ff9a38'],
  ['boost-ice','Estela glaciar','sport','ice','#76e4ff'],['boost-blue','Llama azul','sport','blue','#3d9bff'],['boost-ember','Brasas','sport','ember','#ff8a3d'],['boost-sparkler','Bengala','sport','sparkler','#ffe38a'],
  ['boost-lime','Combustible lima','special','lime','#a6ff6a'],['boost-sakura','Pétalos de sakura','special','sakura','#ffa6cf'],['boost-toxic','Residuo tóxico','special','toxic','#9dff3b'],['boost-neon','Neón doble','special','neon','#ff5fd8'],['boost-ghost','Fantasma','special','ghost','#c9f6ff'],['boost-aqua','Burbujas de mar','special','aqua','#5fe3ff'],['boost-candy','Caramelo','special','candy','#ff7ab8'],['boost-snow','Ventisca','special','snow','#e6f6ff'],
  ['boost-violet','Ion violeta','deluxe','ion','#c28bff'],['boost-inferno','Infierno','deluxe','inferno','#ff4a1c'],['boost-electric','Descarga eléctrica','deluxe','electric','#6fd3ff'],['boost-magma','Magma','deluxe','magma','#ff5a14'],['boost-solar','Viento solar','deluxe','solar','#ffd23f'],['boost-lightning','Relámpago','deluxe','lightning','#b9d6ff'],['boost-pixel','Píxeles','deluxe','pixel','#7dff7a'],
  ['boost-plasma','Plasma doble','import','plasma','#ff62d0'],['boost-gold','Oro líquido','import','gold','#ffcf4a'],['boost-comet','Cometa','import','comet','#9fe8ff'],['boost-rainbow','Prisma','import','rainbow','#ff91ea'],
  ['boost-star','Polvo estelar','exotic','stars','#ffe48a'],['boost-galaxy','Galaxia','exotic','galaxy','#8a7bff'],['boost-confetti','Confeti','exotic','confetti','#ff8ac6'],['boost-aurora','Aurora','exotic','aurora','#6fffc0'],
  ['boost-void','Rastro del vacío','blackmarket','void','#b24dff']]),
 // ---- Explosiones de gol ----
 item('goal-standard','Clásica','goalExplosion','base','standard',undefined,true),
 ...rows('goalExplosion',[
  ['goal-bubbles','Burbujas','sport','bubbles','#8fe9ff'],['goal-fireworks','Fuegos artificiales','sport','fireworks','#ffd166'],['goal-ripple','Ondas de agua','sport','ripple','#6fd8ff'],['goal-leaves','Hojas de otoño','sport','leaves','#ff9a3c'],
  ['goal-pixels','Píxeles retro','special','pixels','#7dff7a'],['goal-petals','Pétalos de cerezo','special','petals','#ffb3cf'],['goal-frost','Nova polar','special','frost','#87e7ff'],['goal-hearts','Lluvia de corazones','special','hearts','#ff6fae'],['goal-snow','Nevada','special','snow','#d8f2ff'],['goal-balloons','Globos de fiesta','special','balloons','#ff6b8b'],['goal-gears','Engranajes','special','gears','#ffcf70'],
  ['goal-emerald','Onda esmeralda','deluxe','wave','#71ffc6'],['goal-lightning','Tormenta eléctrica','deluxe','lightning','#a8c8ff'],['goal-meteor','Lluvia de meteoritos','deluxe','meteor','#ff9a52'],['goal-bats','Murciélagos nocturnos','deluxe','bats','#b36bff'],['goal-tornado','Tornado','deluxe','tornado','#bfe3ff'],['goal-sunburst','Rayos de sol','deluxe','sunburst','#ffd24a'],['goal-comet','Cometas','deluxe','comet','#9fe8ff'],
  ['goal-solar','Estallido solar','import','solar','#ffba55'],['goal-lanterns','Farolillos del festival','import','lanterns','#ff9a3c'],['goal-splash','Gran chapuzón','import','splash','#3ec2ff'],['goal-coins','Lluvia de oro','import','coins','#ffd23f'],['goal-nova','Supernova','import','nova','#ffb86b'],['goal-disco','Bola de discoteca','import','disco','#ff6bd6'],
  ['goal-confetti','Fiesta de colores','exotic','confetti','#ff81b6'],['goal-dragon','Dragón celestial','exotic','dragon','#ff3b2f'],['goal-aurora','Aurora boreal','exotic','aurora','#6fffc0'],['goal-starfall','Lluvia estelar','exotic','starfall','#ffe48a'],
  ['goal-galaxy','Vórtice galáctico','blackmarket','galaxy','#bd81ff'],['goal-nice','Tiro magistral','blackmarket','nice','#ffd54a'],['goal-vortex','Vórtice ígneo','blackmarket','vortex','#ff7a1a'],['goal-blackhole','Agujero negro','blackmarket','blackhole','#a259ff']]),
 // ---- Marcos y banners por rango ----
   // Marcos y banners: Acero es el de inicio; el resto se desbloquea SOLO al llegar a ese rango en cualquier modo (no salen en drops).
  ...TIERS.map(([k,n,r,c,rk])=>({...item('frame-'+k,'Marco '+n,'frame',r,k,c,false),noDrop:true,...(rk!=null?{rank:rk}:{})})),...TIERS.map(([k,n,r,c,rk])=>({...item('banner-'+k,'Banner '+n,'banner',r,k,c,false),noDrop:true,...(rk!=null?{rank:rk}:{})})),
  // ---- Títulos ----
  ...TITLES.map(([id,name,rarity,np])=>({...item(id,name,'title',rarity,'title',RC[rarity],false),...(np?{noDrop:true}:{})}))
];
// Cada variante conserva el estilo del objeto original y solo cambia el color; nunca es 'base' para que no se regale automáticamente.
const variantsFor=base=>base.variants?VARIANT_COLORS.map(([key,label,color])=>({...base,id:base.id+'~'+key,name:base.name+' · '+label,rarity:base.rarity==='base'?'sport':base.rarity,color,variants:false,variantOf:base.id,variantKey:key,variantName:label})):[];
export const ITEMS=BASE_ITEMS.flatMap(base=>[base,...variantsFor(base)]);
export const DEFAULT_COSMETICS={decal:'decal-none',paint:'paint-standard',finish:'finish-gloss',topper:'topper-none',wheels:'wheels-stock',boost:'boost-standard',goalExplosion:'goal-standard',frame:'frame-acero',banner:'banner-acero',title:'title-none'};
const INDEX=new Map(ITEMS.map(i=>[i.id,i]));
export const itemById=id=>INDEX.get(id);
export const baseItemOf=i=>i?.variantOf?INDEX.get(i.variantOf):i;
export const variantsOf=baseId=>ITEMS.filter(i=>i.variantOf===baseId);
export const BASE_CATALOG=BASE_ITEMS;
export const rarityById=id=>RARITIES.find(r=>r.id===id)||RARITIES[0];
export function cleanCosmetics(value={}){return Object.fromEntries(Object.entries(DEFAULT_COSMETICS).map(([category,id])=>[category,itemById(value[category])?.category===category?value[category]:id]))}
// Transparent prototype odds, not claimed to be Psyonix's unpublished rates.
export const DROPS=RARITIES.slice(1).map((r,i)=>({...r,contents:RARITIES.slice(i+1,Math.min(7,i+4)).map((x,j)=>({rarity:x.id,weight:i===5?100:i===4?[80,20][j]:[70,25,5][j]}))}));
export const dropById=id=>DROPS.find(d=>d.id===id);
