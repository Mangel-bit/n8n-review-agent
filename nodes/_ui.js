// Shared look: a restaurant kitchen pass. Steel, order tickets hanging on a rail, tomato red and mustard.
const FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Courier+Prime:wght@400;700&display=swap';
const BASE_CSS = `
:root{--steel:#DCE1E4;--steel-2:#C3CBD0;--steel-hi:#F0F3F4;--night:#202529;--night-2:#2C3338;--ink:#1D1B1A;--muted:#5F666B;
--ticket:#FFFFFD;--line:#E4E2DC;--tomato:#D7372B;--mustard:#EDB02A;--basil:#2E7A4B;--fig:#6E2E5E;
--f:"Archivo","Segoe UI",system-ui,sans-serif;--t:"Courier Prime","Courier New",monospace}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--steel-hi);color:var(--ink);font-family:var(--f);font-size:15.5px;line-height:1.5;-webkit-font-smoothing:antialiased}
a{color:inherit}button,input,textarea,select{font:inherit;color:inherit}
:focus-visible{outline:2.5px solid var(--mustard);outline-offset:2px;border-radius:4px}
.wrap{max-width:1240px;margin:0 auto;padding:0 28px}
h1,h2,h3{margin:0;line-height:1.05;font-stretch:80%;font-weight:850;letter-spacing:-.01em}
p{margin:0}
.bar{background:var(--night);color:#EEF1F2}
.bar .wrap{display:flex;align-items:center;gap:22px;height:62px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;font-stretch:85%;font-size:19px;letter-spacing:.005em}
.brand svg{width:30px;height:30px}
.brand small{font-weight:500;font-stretch:100%;font-size:14px;color:#A9B2B8;margin-left:2px}
.nav{display:flex;gap:4px}
.nav a{text-decoration:none;padding:8px 13px;border-radius:8px;color:#C5CDD2;font-weight:600;font-size:14.5px}
.nav a[aria-current]{background:var(--night-2);color:#fff}
.grow{flex:1}
.chip{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:#A9B2B8;border:1px solid #3A4248;border-radius:999px;padding:5px 12px}
.chip i{width:7px;height:7px;border-radius:50%;background:var(--mustard)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:9px;padding:11px 18px;font-weight:750;font-size:15px;cursor:pointer;text-decoration:none;font-stretch:95%}
.btn:active{transform:translateY(1px)}
.btn.red{background:var(--tomato);color:#fff}.btn.red:hover{background:#c22e23}
.btn.dark{background:var(--ink);color:#fff}.btn.dark:hover{background:#000}
.btn.line{background:transparent;border:1.5px solid var(--steel-2);color:var(--ink)}.btn.line:hover{border-color:var(--ink)}
.btn[disabled]{opacity:.55;cursor:default}
.stars{color:var(--mustard);letter-spacing:1px;white-space:nowrap}
.stars .off{color:#CBD1D5}
.tag{display:inline-flex;align-items:center;gap:6px;font-family:var(--t);font-weight:700;font-size:12px;letter-spacing:.04em;border-radius:5px;padding:2px 8px;text-transform:uppercase;border:1.5px solid currentColor}
.tag.red{color:var(--tomato)}.tag.green{color:var(--basil)}.tag.gray{color:var(--muted)}.tag.fig{color:var(--fig)}
.flash{background:var(--mustard);color:var(--ink);font-weight:650;padding:12px 16px;border-radius:10px}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
@media (max-width:720px){.wrap{padding:0 16px}.bar .chip,.brand small{display:none}.bar .wrap{gap:10px}}
`;
const FIG = `<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M15 6c-1-2.6.4-4.4 2.6-4.6" fill="none" stroke="#7DB36A" stroke-width="2" stroke-linecap="round"/>
<path d="M15 6c5.5 0 10 6.2 10 12.2C25 24 20.6 28 15 28S5 24 5 18.2C5 12.2 9.5 6 15 6z" fill="#8E3B79"/><path d="M11 17c1.3 3.4 4.4 5 7.6 4.2" fill="none" stroke="#C886B6" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const head = (title, css = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="${FONTS}"><style>${BASE_CSS}${css}</style></head><body>`;
const topBar = (page) => `<header class="bar"><div class="wrap"><a class="brand" href="/webhook/reviews">${FIG}${esc(CFG.business)}<small>Review desk</small></a>
<nav class="nav"><a href="/webhook/reviews" ${page === 'reviews' ? 'aria-current="page"' : ''}>Reviews</a><a href="/webhook/guests" ${page === 'guests' ? 'aria-current="page"' : ''}>Guest texts</a></nav>
<span class="grow"></span><span class="chip"><i></i>Demo mode, nothing gets posted for real</span></div></header>`;
const starRow = (n) => { const k = Math.round(num(n)); return `<span class="stars" aria-label="${k} out of 5 stars">${'★'.repeat(k)}<span class="off">${'★'.repeat(5 - k)}</span></span>`; };
