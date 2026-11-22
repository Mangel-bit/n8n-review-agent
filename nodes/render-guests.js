// Guest texts: who came in, the text thread on a phone, and what the agent did with each answer.
const q = ($('Guests page').first().json.query) || {};
const guests = $('Get guests').all().map((i) => i.json).filter((g) => g.guest_id)
  .sort((a, b) => String(b.visit_at).localeCompare(String(a.visit_at)));
const msgs = $('Get messages').all().map((i) => i.json).filter((m) => m.guest_id)
  .sort((a, b) => String(a.at).localeCompare(String(b.at)));
const latestAnswered = guests.filter((g) => g.answered_at).sort((a, b) => String(b.answered_at).localeCompare(String(a.answered_at)))[0];
const todayStart = Date.now() - 20 * 3600000;
const notAsked = guests.filter((g) => g.status === 'not_asked' && new Date(g.visit_at).getTime() >= todayStart);
let sel = guests.find((g) => g.guest_id === q.g);
if (!sel && q.new === '1') sel = latestAnswered;
if (!sel) sel = guests.find((g) => g.status === 'asked') || guests.find((g) => g.status === 'not_asked') || guests[0];
const thread = sel ? msgs.filter((m) => m.guest_id === sel.guest_id) : [];
const fresh = q.new === '1' && sel && latestAnswered && sel.guest_id === latestAnswered.guest_id;
const freshFrom = fresh ? Math.max(0, thread.map((m) => m.direction).lastIndexOf('in')) : thread.length;

const STATUS = { not_asked: ['Not asked yet', 'gray'], asked: ['Waiting for answer', 'gray'], happy: ['Happy', 'green'], unhappy: ['Caught privately', 'red'] };
let banner = '';
if (q.asked === '1') banner = 'Sent a short text to everyone who came in today, so now you can answer as one of them';
else if (fresh) banner = sel.status === 'happy' ? `${first(sel.name)} was happy, so I thanked them and sent the review link` : `${first(sel.name)} wasn't happy, so I said sorry privately and told you, and nothing went public`;

const CSS = `
.page{display:grid;grid-template-columns:300px minmax(0,1fr) 320px;gap:26px;margin:28px auto 50px;align-items:start}
.list{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden}
.list-head{padding:16px 18px;border-bottom:1px solid var(--line);display:grid;gap:10px}
.list-head h1{font-size:28px}
.list a{display:grid;grid-template-columns:38px 1fr;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line);text-decoration:none;align-items:center}
.list a:last-child{border-bottom:0}
.list a[aria-current]{background:#F6F5F1;box-shadow:inset 3px 0 0 var(--tomato)}
.av{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-weight:800;color:#fff;font-size:14px}
.list b{font-weight:750;display:block}
.list small{color:var(--muted);font-size:13px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.list .tag{margin-top:4px;font-size:10.5px;padding:1px 6px}
.phone{justify-self:center;width:min(380px,100%);background:#111;border-radius:46px;padding:12px;box-shadow:0 30px 60px -24px rgba(0,0,0,.5),inset 0 0 0 2px #333}
.screen{background:#F2F2F4;border-radius:36px;overflow:hidden;display:grid;grid-template-rows:auto 1fr auto;height:680px}
.ph-top{background:#F8F8FA;border-bottom:1px solid #DDDDE2;padding:30px 16px 12px;text-align:center;position:relative}
.ph-top::before{content:"";position:absolute;top:10px;left:50%;width:90px;height:22px;margin-left:-45px;background:#111;border-radius:12px}
.ph-top .avbig{width:46px;height:46px;border-radius:50%;margin:6px auto 4px;display:grid;place-items:center;background:var(--fig);color:#fff;font-weight:800}
.ph-top b{font-size:14px;display:block}
.ph-top small{font-size:11.5px;color:#888}
.msgs{overflow-y:auto;padding:16px 12px;display:flex;flex-direction:column;gap:8px}
.bub{max-width:80%;padding:9px 13px;border-radius:19px;font-size:14.5px;line-height:1.4;white-space:pre-wrap;overflow-wrap:anywhere}
.bub.out{align-self:flex-start;background:#E5E5EA;color:#111;border-bottom-left-radius:6px}
.bub.in{align-self:flex-end;background:#2F7BF6;color:#fff;border-bottom-right-radius:6px}
.bub .st{color:#FFD15C;letter-spacing:1px}
.bub.typing{color:#666}
.bub.typing i{display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;background:#999;animation:blink 1.2s infinite}
.bub.typing i:nth-child(2){animation-delay:.2s}.bub.typing i:nth-child(3){animation-delay:.4s}
@keyframes blink{0%,80%,100%{opacity:.25}40%{opacity:1}}
.fresh{animation:rise .45s ease both;animation-delay:var(--d)}
@keyframes rise{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
.when{align-self:center;font-size:11.5px;color:#999;margin:4px 0}
.compose{background:#F8F8FA;border-top:1px solid #DDDDE2;padding:10px 12px 18px;display:grid;gap:8px}
.compose .pick{display:flex;gap:4px;flex-direction:row-reverse;justify-content:flex-end;align-items:center}
.compose .pick input{position:absolute;opacity:0;pointer-events:none}
.compose .pick label{font-size:26px;color:#C9C9CF;cursor:pointer;line-height:1}
.compose .pick input:checked~label,.compose .pick label:hover,.compose .pick label:hover~label{color:#F2B51D}
.compose .pick input:focus-visible+label{outline:2px solid #2F7BF6;border-radius:4px}
.compose .row{display:flex;gap:8px;align-items:flex-end}
.compose textarea{flex:1;border:1px solid #D2D2D8;border-radius:18px;padding:8px 13px;background:#fff;font-size:14.5px;resize:none;height:40px;line-height:1.4}
.send{width:40px;height:40px;border-radius:50%;border:0;background:#2F7BF6;color:#fff;cursor:pointer;display:grid;place-items:center;flex:none}
.send[disabled]{opacity:.5}
.hint{font-size:12px;color:#888;text-align:center}
.side{display:grid;gap:14px}
.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px}
.card h2{font-size:22px;margin-bottom:8px}
.card p{font-size:14.5px}
.card .k{font-size:12.5px;color:var(--muted);font-weight:650;margin-top:12px}
.card.alert{background:#FFF4D6;border-color:var(--mustard)}
.card.good{background:#EAF4EC;border-color:#BBD9C3}
.samples{display:grid;gap:6px}
.samples button{text-align:left;border:1px solid var(--line);background:#F6F5F1;border-radius:10px;padding:8px 11px;font-size:13.5px;cursor:pointer}
.samples button:hover{border-color:var(--ink)}
.flash{margin-top:18px}
@media (max-width:1150px){.page{grid-template-columns:260px minmax(0,1fr)}.side{grid-column:1/-1;grid-template-columns:1fr 1fr}}
@media (max-width:760px){.page{grid-template-columns:1fr}.side{grid-template-columns:1fr}.screen{height:600px}}
`;
const COLORS = ['#6E2E5E', '#2E7A4B', '#C2552C', '#2B5C8A', '#8A6A1E', '#4B4F8C'];
const color = (id) => COLORS[(parseInt(String(id).replace(/\D/g, ''), 10) || 0) % COLORS.length];
const initials = (n) => String(n).split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const bubble = (m, i) => {
  const isFresh = i >= freshFrom && fresh;
  const d = isFresh ? `${(i - freshFrom) * 0.5}s` : '0s';
  let body = esc(m.body);
  if (m.direction === 'in') { const k = num((m.body.match(/^(\d)\./) || [])[1]); if (k) body = `<span class="st">${'★'.repeat(k)}</span> ${esc(m.body.replace(/^\d\.\s*/, ''))}`; }
  return `<div class="bub ${m.direction === 'in' ? 'in' : 'out'} ${isFresh ? 'fresh' : ''}" style="--d:${d}">${body}</div>`;
};
const visitText = (g) => `${g.visit_type === 'takeout' ? 'Takeout' : `Table for ${g.party}`}, ${ago(g.visit_at)}`;

const side = !sel ? '' : sel.status === 'unhappy' ? `<div class="card alert"><h2>Caught privately</h2><p>${esc(sel.alert)}</p>${sel.fix ? `<p class="k">One idea</p><p>${esc(sel.fix)}</p>` : ''}</div>`
  : sel.status === 'happy' ? `<div class="card good"><h2>Happy guest</h2><p>${first(sel.name)} gave ${sel.stars} stars, so I thanked them and sent the link to leave a public review.</p></div>`
    : sel.status === 'asked' ? `<div class="card"><h2>Waiting for ${esc(first(sel.name))}</h2><p>I texted them after their visit. Answer as ${esc(first(sel.name))} on the phone and see what happens.</p></div>`
      : `<div class="card"><h2>Not asked yet</h2><p>${esc(first(sel.name))} came in ${esc(ago(sel.visit_at))}. Press "Text today's guests" and I'll send them a short message.</p></div>`;
const SAMPLES = sel && sel.visit_type === 'takeout'
  ? [[2, `The ${String(sel.ordered).split(' and ')[0]} was cold by the time I got home, and it's only 10 minutes away.`], [5, 'Still warm when I got home and honestly so good.'], [3, 'Tasty but the portion was smaller than last time.']]
  : [[5, 'Everything was amazing, our server was so sweet and the food came out fast.'], [2, 'Food was good but we waited almost 40 minutes for our mains and nobody checked on us.'], [3, 'Nice night but it was really loud, we could barely hear each other.']];
const canAnswer = sel && (sel.status === 'asked');

const html = `${head(`Guest texts · ${CFG.business}`, CSS)}${topBar('guests')}
${banner ? `<div class="wrap"><div class="flash" role="status">${esc(banner)}</div></div>` : ''}
<main class="wrap page">
  <aside class="list">
    <div class="list-head"><h1>Guest texts</h1>
      <form method="post" action="/webhook/guests-ask"><button class="btn red" style="width:100%" ${notAsked.length ? '' : 'disabled'}>${notAsked.length ? `Text today's ${notAsked.length} guest${notAsked.length > 1 ? 's' : ''}` : 'Everyone from today got a text'}</button></form></div>
    ${guests.map((g) => { const [label, c] = STATUS[g.status] || STATUS.not_asked; return `<a href="/webhook/guests?g=${encodeURIComponent(g.guest_id)}" ${sel && g.guest_id === sel.guest_id ? 'aria-current="true"' : ''}>
      <span class="av" style="background:${color(g.guest_id)}">${esc(initials(g.name))}</span><span><b>${esc(g.name)}</b><small>${esc(visitText(g))}</small><span class="tag ${c}">${label}</span></span></a>`; }).join('')}
  </aside>
  <section class="phone" aria-label="Text conversation with ${esc(sel ? sel.name : '')}"><div class="screen">
    <div class="ph-top"><div class="avbig">LF</div><b>${esc(CFG.business)}</b><small>Text message with ${esc(sel ? sel.name : '')}</small></div>
    <div class="msgs" id="msgs">${thread.length ? thread.map(bubble).join('') : `<div class="when">No messages yet</div>`}</div>
    ${canAnswer ? `<form class="compose" id="compose" method="post" action="/webhook/guests-reply"><input type="hidden" name="guest_id" value="${esc(sel.guest_id)}">
      <div class="pick" role="radiogroup" aria-label="Stars">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="stars" id="g${n}" value="${n}" ${n === 5 ? 'checked' : ''}><label for="g${n}">★</label>`).join('')}</div>
      <div class="row"><textarea name="text" id="gtext" placeholder="Answer as ${esc(first(sel.name))}" required maxlength="1500"></textarea><button class="send" id="send" aria-label="Send">
      <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 14V4M4.5 8.5L9 4l4.5 4.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></form>`
      : `<div class="compose"><p class="hint">${sel && sel.status === 'not_asked' ? 'Send the texts first, then you can answer here' : 'This conversation is done'}</p></div>`}
  </div></section>
  <aside class="side">${side}
    ${canAnswer ? `<div class="card"><h2>Answer as ${esc(first(sel.name))}</h2><p style="color:var(--muted);margin-bottom:10px">Pick one, or write your own.</p><div class="samples">${SAMPLES.map(([s, t]) => `<button type="button" data-s="${s}" data-t="${esc(t)}">${'★'.repeat(s)} ${esc(t)}</button>`).join('')}</div></div>` : ''}
  </aside>
</main>
<script>
(function () {
  var box = document.getElementById('msgs'); if (box) box.scrollTop = box.scrollHeight;
  document.querySelectorAll('.samples button').forEach(function (b) {
    b.addEventListener('click', function () { document.getElementById('g' + b.getAttribute('data-s')).checked = true; var t = document.getElementById('gtext'); t.value = b.getAttribute('data-t'); t.focus(); });
  });
  var form = document.getElementById('compose');
  if (form) form.addEventListener('submit', function () {
    var t = document.getElementById('gtext'), s = (form.querySelector('input[name=stars]:checked') || {}).value || '';
    if (!t.value.trim()) return;
    var star = '', n = +s; for (var i = 0; i < n; i++) star += '\\u2605';
    var a = document.createElement('div'); a.className = 'bub in fresh'; a.innerHTML = '<span class="st">' + star + '</span> '; a.appendChild(document.createTextNode(t.value.trim()));
    var b = document.createElement('div'); b.className = 'bub out typing fresh'; b.style.setProperty('--d', '.6s'); b.innerHTML = '<i></i><i></i><i></i>';
    box.appendChild(a); box.appendChild(b); box.scrollTop = box.scrollHeight;
    setTimeout(function () { document.getElementById('send').disabled = true; t.readOnly = true; }, 0);
  });
  if (/[?&](new|asked)=/.test(location.search) && history.replaceState) history.replaceState(null, '', location.pathname${sel ? ` + '?g=${encodeURIComponent(sel.guest_id)}'` : ''});
})();
</script></body></html>`;
return [{ json: { html } }];
