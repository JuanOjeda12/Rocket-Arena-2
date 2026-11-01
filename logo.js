// Logotipo de Rocket Arena. Tipografía convertida a trazos (Inter Display Black, licencia OFL), sin depender de fuentes.
const ROCKET='M80 1490H496V1024H682L905 1490H1338L1065 934C1210 848 1292 705 1292 520C1292 201 1069 0 713 0H80ZM496 702V338H682C807 338 886 411 886 520C886 629 807 702 682 702Z M2086 1514C2491 1514 2810 1243 2810 746C2810 248 2491 -24 2086 -24C1679 -24 1362 248 1362 746C1362 1240 1679 1514 2086 1514ZM2086 1154C1891 1154 1782 1003 1782 746C1782 488 1891 336 2086 336C2282 336 2390 488 2390 746C2390 1003 2282 1154 2086 1154Z M3573 1514C3954 1514 4223 1282 4265 930H3846C3820 1070 3724 1154 3581 1154C3378 1154 3269 1006 3269 746C3269 485 3379 336 3581 336C3724 336 3821 421 3846 562H4265C4224 210 3954 -24 3573 -24C3166 -24 2849 248 2849 746C2849 1240 3166 1514 3573 1514Z M4342 1490H4758V1144L4939 922L5279 1490H5755L5207 640L5727 0H5246L4950 383C4886 466 4822 548 4758 631V0H4342Z M5794 1490H6948V1138H6210V916H6891V576H6210V352H6948V0H5794Z M7007 352H7431V1490H7847V352H8271V0H7007Z';
const ARENA_A='M-87 1490H381L495 1245H993L1023 1490H1478L1220 0H660ZM644 925 650 912C734 732 813 558 891 377C909 558 930 732 952 912L954 925Z M1486 1490H1902L1979 1024H2172L2318 1490H2742L2561 935C2721 849 2828 705 2859 520C2911 201 2721 0 2366 0H1733ZM2033 702 2093 338H2279C2404 338 2471 411 2453 520C2435 629 2343 702 2218 702Z';
const ARENA_B='M2778 1490H3932L3990 1138H3252L3289 916H3970L4026 576H3345L3382 352H4120L4178 0H3025Z M3995 1490H4411L4501 946C4511 886 4530 769 4548 635C4597 764 4644 879 4675 946L4923 1490H5347L5594 0H5178L5087 546C5076 617 5057 739 5040 860C5000 752 4957 641 4932 585L4666 0H4242Z M5356 1490H5824L5938 1245H6436L6466 1490H6921L6663 0H6103ZM6087 925 6093 912C6177 732 6256 558 6334 377C6352 558 6373 732 6395 912L6397 925Z';
export function logoSVG({id='ra',tagline=true}={}){
 const u=n=>`${id}-${n}`;
 const kr=0.10588,ka=0.08847,rw=880.0,aw=620.0,rh=157.8,ah=131.8;
 const rx=(1000-rw)/2,ry=46,ax=(1000-aw)/2+8,ay=ry+rh+22;
 const H=tagline?440:392;
 const px=rx-34,py=ry-30,pw=rw+68,ph=rh+60,cut=24;
 const plate=`M${px+cut} ${py}H${px+pw-cut}L${px+pw} ${py+cut}V${py+ph}H${px}V${py+cut}Z`;
 const rg=`translate(${rx} ${ry}) scale(${kr})`,ag=`translate(${ax} ${ay}) scale(${ka})`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 ${H}" role="img" aria-label="Rocket Arena">
<defs>
 <linearGradient id="${u('o')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a00"/><stop offset=".5" stop-color="#ffb42e"/><stop offset=".5" stop-color="#ff5b00"/><stop offset="1" stop-color="#ff8a1a"/></linearGradient>
 <linearGradient id="${u('b')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a9bff"/><stop offset=".5" stop-color="#58d8ff"/><stop offset=".5" stop-color="#0a55e8"/><stop offset="1" stop-color="#1c8bff"/></linearGradient>
 <g id="${u('rk')}" transform="${rg}"><path d="${ROCKET}"/></g>
 <g id="${u('ao')}" transform="${ag}"><path d="${ARENA_A}"/></g>
 <g id="${u('ab')}" transform="${ag}"><path d="${ARENA_B}"/></g>
 <clipPath id="${u('c')}"><path d="M0 0H1000V${H}H0Z"/></clipPath>
</defs>
<g stroke-linejoin="miter" stroke-miterlimit="3">
 <path d="${plate}" fill="#fff" stroke="#fff" stroke-width="8"/>
 <use href="#${u('ao')}" fill="#fff" stroke="#fff" stroke-width="${(23/ka).toFixed(0)}"/><use href="#${u('ab')}" fill="#fff" stroke="#fff" stroke-width="${(23/ka).toFixed(0)}"/>
 <path d="${plate}" fill="#06090f"/>
 <use href="#${u('ao')}" fill="#06090f" stroke="#06090f" stroke-width="${(14/ka).toFixed(0)}"/><use href="#${u('ab')}" fill="#06090f" stroke="#06090f" stroke-width="${(14/ka).toFixed(0)}"/>
</g>
<use href="#${u('rk')}" fill="#fff"/>
<use href="#${u('ao')}" fill="url(#${u('o')})"/><use href="#${u('ab')}" fill="url(#${u('b')})"/>
${tagline?`<text x="500" y="${H-16}" text-anchor="middle" font-family="'Barlow Condensed','Arial Narrow',Arial,sans-serif" font-weight="700" font-size="22" letter-spacing="14" fill="#b9cad9">BOOST · FLY · SCORE</text>`:''}
</svg>`;
}
// Marca pequeña (favicon / menú): hexágono azul-naranja con rayo de turbo.
export const LOGO_MARK=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="a" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#3cc8ff"/><stop offset=".5" stop-color="#1457ff"/><stop offset="1" stop-color="#ff7a1a"/></linearGradient></defs><polygon points="32,3 58,18 58,46 32,61 6,46 6,18" fill="#07131f" stroke="url(#a)" stroke-width="4" stroke-linejoin="round"/><path d="M36 14 20 36h10l-4 14 18-24H33Z" fill="#ffd36a"/></svg>`;
export const logoFavicon=()=>'data:image/svg+xml,'+encodeURIComponent(LOGO_MARK);
