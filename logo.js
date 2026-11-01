// Logotipo de Rocket Arena: render del Octane del juego + lettering angular dibujado a medida.
// logoSVG() devuelve un <svg> en texto; el coche es assets/logo-car.png (render real del modelo).
const LETTERS={
 R:{w:84,d:'M0 0H60L82 16V42L64 56L84 100H55L40 62H28V100H0ZM28 22V40H52L55 36V26L52 22Z',rule:'evenodd'},
 O:{w:84,d:'M20 0H64L84 20V80L64 100H20L0 80V20ZM28 24L26 28V72L28 76H56L58 72V28L56 24Z',rule:'evenodd'},
 C:{w:80,d:'M20 0H80V24H32L28 28V72L32 76H80V100H20L0 80V20Z'},
 K:{w:90,d:'M0 0H28V38L56 0H90L52 46L90 100H56L30 62L28 66V100H0Z'},
 E:{w:78,d:'M0 0H78V24H28V38H68V60H28V76H78V100H0Z'},
 T:{w:84,d:'M0 0H84V24H56V100H28V24H0Z'},
 A:{w:90,d:'M30 0H60L90 100H60L56 84H34L30 100H0ZM40 62H50L45 34Z',rule:'evenodd'},
 N:{w:88,d:'M0 0H28L60 52V0H88V100H60L28 48V100H0Z'}
};
function word(text,{x,y,height,gap,fill,id}){
 const k=height/100;let cursor=0,out='';
 for(const ch of text){const l=LETTERS[ch];out+=`<path transform="translate(${cursor} 0)" d="${l.d}" ${l.rule?`fill-rule="${l.rule}"`:''}/>`;cursor+=l.w+gap}
 const width=(cursor-gap)*k;
 return{svg:`<g transform="translate(${x-width/2} ${y}) scale(${k}) skewX(-12)" fill="${fill}">${out}</g>`,width,height};
}
export function logoSVG({id='ra',car='./assets/logo-car.png',tagline=true}={}){
 const u=n=>`${id}-${n}`;
 const rocket=word('ROCKET',{x:500,y:326,height:116,gap:13,fill:`url(#${u('rocket')})`});
 const arena=word('ARENA',{x:500,y:466,height:54,gap:24,fill:`url(#${u('arena')})`});
 const hexPts=[[500,10],[760,150],[760,320],[500,452],[240,320],[240,150]].map(p=>p.join(',')).join(' ');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 ${tagline?585:545}" role="img" aria-label="Rocket Arena">
<defs>
 <linearGradient id="${u('rocket')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".48" stop-color="#bfe7ff"/><stop offset=".5" stop-color="#4fa9ff"/><stop offset="1" stop-color="#0d56e0"/></linearGradient>
 <linearGradient id="${u('arena')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".5" stop-color="#ffab2e"/><stop offset="1" stop-color="#ff4d0f"/></linearGradient>
 <linearGradient id="${u('ringL')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3cc8ff"/><stop offset="1" stop-color="#1457ff"/></linearGradient>
 <linearGradient id="${u('ringR')}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf4a"/><stop offset="1" stop-color="#ff4d0f"/></linearGradient>
 <radialGradient id="${u('aura')}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#2d7bff" stop-opacity=".55"/><stop offset=".6" stop-color="#1b4fd0" stop-opacity=".18"/><stop offset="1" stop-color="#1b4fd0" stop-opacity="0"/></radialGradient>
 <radialGradient id="${u('auraO')}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".5"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>
 <linearGradient id="${u('streak')}" x1="0" x2="1"><stop offset="0" stop-color="#7fd6ff" stop-opacity="0"/><stop offset="1" stop-color="#e6f7ff"/></linearGradient>
 <filter id="${u('glow')}" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 <filter id="${u('soft')}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
 <mask id="${u('cut')}" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="585"><rect width="1000" height="585" fill="#fff"/><path d="M0 396H1000V401H0Z" fill="#000"/></mask>
</defs>
<ellipse cx="500" cy="240" rx="360" ry="230" fill="url(#${u('aura')})"/>
<ellipse cx="640" cy="300" rx="260" ry="120" fill="url(#${u('auraO')})" opacity=".6"/>
<!-- emblema hexagonal -->
<g fill="none" stroke-linejoin="round">
 <polygon points="${hexPts}" stroke="#04101f" stroke-width="16" opacity=".55"/>
 <path d="M500 10L240 150V320L500 452" stroke="url(#${u('ringL')})" stroke-width="9" filter="url(#${u('glow')})"/>
 <path d="M500 10L760 150V320L500 452" stroke="url(#${u('ringR')})" stroke-width="9" filter="url(#${u('glow')})"/>
 <polygon points="${[[500,34],[738,162],[738,308],[500,430],[262,308],[262,162]].map(p=>p.join(',')).join(' ')}" stroke="#9fd8ff" stroke-width="1.6" opacity=".35"/>
</g>
<!-- líneas de velocidad -->
<g stroke-linecap="round">
 <path d="M30 190H300" stroke="url(#${u('streak')})" stroke-width="5"/><path d="M80 214H300" stroke="url(#${u('streak')})" stroke-width="3"/>
 <path d="M0 238H260" stroke="url(#${u('streak')})" stroke-width="3"/><path d="M110 262H290" stroke="url(#${u('streak')})" stroke-width="2.5"/>
 <path d="M760 130H1000" stroke="url(#${u('streak')})" stroke-width="3" transform="rotate(180 880 130)" opacity=".8"/>
</g>
<!-- coche -->
<ellipse cx="500" cy="352" rx="240" ry="14" fill="#000" opacity=".55" filter="url(#${u('soft')})"/>
<image href="${car}" x="228" y="16" width="544" height="335" preserveAspectRatio="xMidYMid meet"/>
<!-- palabras -->
<g mask="url(#${u('cut')})" filter="url(#${u('glow')})">
 <g transform="translate(5 6)" opacity=".7" fill="#031433">${rocket.svg.replace(`url(#${u('rocket')})`,'#031433')}</g>
 ${rocket.svg}
</g>
<g filter="url(#${u('glow')})">
 <g transform="translate(3 4)" opacity=".7">${arena.svg.replace(`url(#${u('arena')})`,'#4a1500')}</g>
 ${arena.svg}
</g>
<g stroke="#2fa8ff" stroke-width="3" stroke-linecap="round"><path d="M96 493H312"/></g>
<g stroke="#ff8a1f" stroke-width="3" stroke-linecap="round"><path d="M688 493H904"/></g>
<path d="M326 493l8-8 8 8-8 8Z" fill="#4fc4ff"/><path d="M658 493l8-8 8 8-8 8Z" fill="#ffab2e"/>
${tagline?`<text x="500" y="568" text-anchor="middle" font-family="'Segoe UI','Arial',sans-serif" font-weight="700" font-size="22" letter-spacing="9" fill="#9fb8cf">BOOST  ·  FLY  ·  SCORE</text>`:''}
</svg>`;
}
// Marca pequeña (favicon / menú): hexágono azul-naranja con rayo de turbo.
export const LOGO_MARK=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="a" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#3cc8ff"/><stop offset=".5" stop-color="#1457ff"/><stop offset="1" stop-color="#ff7a1a"/></linearGradient></defs><polygon points="32,3 58,18 58,46 32,61 6,46 6,18" fill="#07131f" stroke="url(#a)" stroke-width="4" stroke-linejoin="round"/><path d="M36 14 20 36h10l-4 14 18-24H33Z" fill="#ffd36a"/></svg>`;
export const logoFavicon=()=>'data:image/svg+xml,'+encodeURIComponent(LOGO_MARK);
