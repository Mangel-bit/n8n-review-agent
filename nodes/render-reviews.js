// The review desk: tickets that need Sam hang on the pass, then the numbers, what people keep mentioning, and every review.
const q = ($('Reviews page').first().json.query) || {};
const reviews = $('Get reviews').all().map((i) => i.json).filter((r) => r.review_id)
  .sort((a, b) => String(b.posted_at).localeCompare(String(a.posted_at)));
const guests = $('Get guests').all().map((i) => i.json).filter((g) => g.guest_id);
const newest = reviews.find((r) => r.batch === 'live');
const freshId = q.new === '1' && newest ? newest.review_id : '';

const onPass = reviews.filter((r) => ['needs_you', 'escalated', 'flagged'].includes(r.status));
const month = Date.now() - 30 * 86400000, week = Date.now() - 7 * 86400000, fortnight = Date.now() - 14 * 86400000;
const counted = reviews.filter((r) => r.kind !== 'suspicious' && new Date(r.posted_at).getTime() >= month);
const avg = counted.length ? counted.reduce((s, r) => s + num(r.stars), 0) / counted.length : 0;
const real = reviews.filter((r) => r.kind !== 'suspicious');
const answered = real.filter((r) => r.reply_status === 'posted').length;
const caught = guests.filter((g) => g.status === 'unhappy' && new Date(g.answered_at).getTime() >= week);
const live = reviews.filter((r) => r.batch === 'live' && r.reply_status === 'posted' && r.replied_at);
const fastest = live.length ? Math.min(...live.map((r) => (new Date(r.replied_at) - new Date(r.posted_at)) / 1000)) : 0;

// Topics over the last two weeks, from public reviews and private texts.
const tally = {};
const add = (t, src) => { if (!TOPICS[t.topic]) return; const x = (tally[t.topic] = tally[t.topic] || { pos: 0, neg: 0, quotes: [] }); x[t.feeling === 'negative' ? 'neg' : 'pos']++; if (t.feeling === 'negative' && x.quotes.length < 3) x.quotes.push({ detail: t.detail, src }); };
reviews.filter((r) => r.kind !== 'suspicious' && new Date(r.posted_at).getTime() >= fortnight).forEach((r) => parseJson(r.topics, []).forEach((t) => add(t, 'review')));
guests.filter((g) => g.answered_at && new Date(g.answered_at).getTime() >= fortnight).forEach((g) => parseJson(g.topics, []).forEach((t) => add(t, 'text')));
const topicRows = Object.entries(tally).filter(([k]) => k !== 'other').sort((a, b) => (b[1].neg * 3 + b[1].pos) - (a[1].neg * 3 + a[1].pos)).slice(0, 6);
const maxTopic = Math.max(1, ...topicRows.map(([, v]) => v.pos + v.neg));
const hot = topicRows.find(([, v]) => v.neg >= 3);

let banner = '';
if (freshId) {
  const r = newest;
  banner = r.status === 'replied' ? `New ${r.stars}-star review from ${first(r.reviewer)}, and I already replied to it` :
    r.status === 'needs_you' ? `New ${r.stars}-star review from ${first(r.reviewer)}, I wrote a reply but I'm holding it for you, it's on the pass` :
      r.status === 'flagged' ? `New review from ${r.reviewer} looks fake, so I didn't reply, it's on the pass` :
        `New review from ${first(r.reviewer)} needs you before anyone replies, it's on the pass`;
} else if (q.done === 'reset') banner = 'The demo is back to the start';
else if (q.done) banner = { post: 'Posted your reply', skip: 'Okay, no reply on that one', handled: 'Marked as handled', report: 'Reported as fake' }[q.done] || '';

const CSS = `
.pass{background:linear-gradient(180deg,#CBD2D7 0%,var(--steel) 34%,#E6EAEC 100%);border-bottom:1px solid var(--steel-2);padding:26px 0 40px;position:relative;overflow:hidden}
.pass::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 2px,transparent 2px 7px);pointer-events:none}
.pass .wrap{position:relative;display:grid;grid-template-columns:minmax(0,1.75fr) minmax(300px,1fr);gap:30px;align-items:start}
.pass-head{display:flex;align-items:baseline;gap:14px;margin-bottom:6px}
.pass-head h1{font-size:clamp(34px,4vw,52px)}
.pass-head span{color:var(--muted);font-weight:600}
.rail{height:16px;border-radius:8px;background:linear-gradient(180deg,#F6F8F9 0%,#AEB7BD 45%,#8A949B 55%,#C9D0D4 100%);box-shadow:0 3px 6px rgba(0,0,0,.18),inset 0 1px 0 #fff;margin-top:12px;position:relative;z-index:2}
.tickets{display:flex;gap:18px;padding:0 14px;margin-top:-6px;flex-wrap:wrap;min-height:200px}
.ticket{position:relative;width:236px;background:var(--ticket);padding:22px 16px 26px;box-shadow:0 14px 22px -12px rgba(0,0,0,.38);transform-origin:50% -10px;transform:rotate(var(--r));text-decoration:none;display:block;
  -webkit-mask:radial-gradient(7px at 50% 100%,#0000 98%,#000) 50% 100%/14px 100% repeat-x;mask:radial-gradient(7px at 50% 100%,#0000 98%,#000) 50% 100%/14px 100% repeat-x;transition:transform .2s}
.ticket:hover{transform:rotate(0deg) translateY(3px)}
.ticket::before{content:"";position:absolute;top:0;left:50%;width:46px;height:14px;margin-left:-23px;background:linear-gradient(180deg,#9AA3A9,#D6DBDE);border-radius:0 0 4px 4px}
.ticket .t-top{display:flex;justify-content:space-between;align-items:center;gap:8px;font-family:var(--t);font-size:12px;color:var(--muted);border-bottom:1.5px dashed #CFCBC2;padding-bottom:8px;margin-bottom:10px}
.ticket .who{font-weight:800;font-stretch:85%;font-size:18px;line-height:1.1}
.ticket .txt{font-family:var(--t);font-size:13.5px;line-height:1.45;margin:8px 0 12px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.ticket .what{font-size:13px;font-weight:650;border-top:1.5px dashed #CFCBC2;padding-top:9px}
.ticket .what.red{color:var(--tomato)}.ticket .what.fig{color:var(--fig)}
.ticket.fresh{animation:hang .9s cubic-bezier(.3,1.4,.5,1) both .2s}
@keyframes hang{0%{transform:translateY(-140%) rotate(-14deg);opacity:0}45%{opacity:1}70%{transform:translateY(0) rotate(5deg)}85%{transform:rotate(-2deg)}100%{transform:rotate(var(--r))}}
.ticket.clear{width:300px}
.ticket.clear .who{font-size:22px}
.try{background:var(--ticket);border-radius:14px;padding:20px;box-shadow:0 12px 30px -18px rgba(0,0,0,.4);display:grid;gap:12px}
.try h2{font-size:24px}
.try p.sub{color:var(--muted);font-size:14px;margin-top:-6px}
.samples{display:flex;flex-wrap:wrap;gap:6px}
.samples button{border:1px solid var(--line);background:#F6F5F1;border-radius:999px;padding:5px 11px;font-size:13px;cursor:pointer}
.samples button:hover{border-color:var(--ink)}
.try label{font-size:13px;font-weight:650;color:var(--muted);display:grid;gap:4px}
.try input[type=text],.try textarea{width:100%;border:1.5px solid var(--line);border-radius:9px;padding:10px 12px;background:#fff}
.try textarea{min-height:98px;resize:vertical;font-family:var(--t);font-size:14px}
.pick{display:flex;gap:2px;flex-direction:row-reverse;justify-content:flex-end}
.pick input{position:absolute;opacity:0;pointer-events:none}
.pick label{font-size:28px;line-height:1;color:#CBD1D5;cursor:pointer;padding:0 1px}
.pick input:checked~label,.pick label:hover,.pick label:hover~label{color:var(--mustard)}
.pick input:focus-visible+label{outline:2px solid var(--ink);border-radius:4px}
.try.busy{opacity:.75}
.reading{display:none;font-family:var(--t);font-size:13.5px;color:var(--tomato)}
.try.busy .reading{display:block}
.flashwrap{margin-top:-20px;position:relative;z-index:3}
.stats{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:0;margin:34px auto 0;background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden}
.stat{padding:22px 26px;border-right:1px solid var(--line)}
.stat:last-child{border-right:0}
.stat .k{font-size:14px;color:var(--muted);font-weight:600}
.stat .v{font-size:44px;font-weight:850;font-stretch:80%;line-height:1.05;margin-top:4px;display:flex;align-items:baseline;gap:10px}
.stat .v .stars{font-size:22px}
.stat small{color:var(--muted);font-size:13.5px}
.section{margin-top:40px}
.section > h2{font-size:28px;margin-bottom:14px}
.alert{background:#FFF4D6;border:1.5px solid var(--mustard);border-radius:12px;padding:14px 16px;font-weight:600;margin-bottom:14px}
.topics{background:#fff;border:1px solid var(--line);border-radius:16px;padding:8px 22px}
.trow{display:grid;grid-template-columns:170px minmax(0,1fr) minmax(0,1.3fr);gap:18px;align-items:center;padding:13px 0;border-bottom:1px solid var(--line)}
.trow:last-child{border-bottom:0}
.trow b{font-weight:750}
.bars{display:flex;height:12px;border-radius:6px;overflow:hidden;background:#EEF0F1}
.bars i{display:block;height:100%}
.bars .p{background:var(--basil)}.bars .n{background:var(--tomato)}
.trow .cnt{font-size:12.5px;color:var(--muted);margin-top:4px}
.trow q{font-family:var(--t);font-size:13.5px;color:var(--muted);quotes:"\\201C" "\\201D"}
.feed{display:grid;gap:14px;margin-bottom:50px}
.rev{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px 22px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;scroll-margin-top:20px}
.rev.fresh{animation:pop 2.6s ease both}
@keyframes pop{0%,25%{box-shadow:0 0 0 4px var(--mustard)}100%{box-shadow:0 0 0 0 transparent}}
.rev .meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13.5px;color:var(--muted)}
.rev .name{font-weight:800;font-stretch:85%;font-size:19px;color:var(--ink)}
.rev .body{font-family:var(--t);font-size:14.5px;margin-top:10px;line-height:1.55}
.rev .side{border-left:1.5px dashed var(--line);padding-left:22px;display:grid;gap:10px;align-content:start}
.reply{background:#F6F5F1;border-radius:10px;padding:12px 14px;font-size:14.5px}
.reply .by{font-size:12.5px;color:var(--muted);margin-bottom:4px;font-weight:600}
.note{font-size:14.5px}
.note b{display:block;font-size:12.5px;color:var(--muted)}
.edit textarea{width:100%;min-height:120px;border:1.5px solid var(--line);border-radius:10px;padding:10px 12px;font-size:14.5px;resize:vertical}
.acts{display:flex;gap:10px;flex-wrap:wrap}
footer{border-top:1px solid var(--line);padding:22px 0 40px;color:var(--muted);font-size:14px}
footer .wrap{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:center}
footer button{background:none;border:1.5px solid var(--steel-2);border-radius:8px;padding:8px 14px;cursor:pointer}
@media (max-width:1000px){.pass .wrap{grid-template-columns:1fr}.rev{grid-template-columns:1fr}.rev .side{border-left:0;padding-left:0;border-top:1.5px dashed var(--line);padding-top:14px}}
@media (max-width:720px){.stats{grid-template-columns:1fr}.stat{border-right:0;border-bottom:1px solid var(--line)}.trow{grid-template-columns:1fr}.ticket{width:100%}.tickets{padding:0}}
`;

const passTicket = (r, i) => {
  const what = r.status === 'escalated' ? { c: 'red', t: "Didn't reply. This one should come from you" }
    : r.status === 'flagged' ? { c: 'fig', t: 'Looks fake, so no reply' }
      : { c: 'red', t: 'Reply drafted, waiting for you' };
  const tag = r.status === 'escalated' ? '<span class="tag red">Careful</span>' : r.status === 'flagged' ? '<span class="tag fig">Fake?</span>' : '<span class="tag red">Needs you</span>';
  return `<a class="ticket ${r.review_id === freshId ? 'fresh' : ''}" style="--r:${[-2.2, 1.8, -1, 2.6][i % 4]}deg" href="#${esc(r.review_id)}">
    <div class="t-top">${starRow(r.stars)}${tag}</div><div class="who">${esc(r.reviewer)}</div><p class="txt">${esc(r.text)}</p>
    <div class="what ${what.c}">${what.t}</div></a>`;
};

const reviewCard = (r) => {
  const when = ago(r.posted_at);
  const status = { replied: '<span class="tag green">Replied</span>', needs_you: '<span class="tag red">Needs you</span>', escalated: '<span class="tag red">Careful</span>',
    flagged: '<span class="tag fig">Looks fake</span>', done: '<span class="tag gray">No reply</span>', handled: '<span class="tag gray">Handled</span>', reported: '<span class="tag fig">Reported</span>' }[r.status] || '';
  const replyAfter = r.replied_at ? Math.max(1, Math.round((new Date(r.replied_at) - new Date(r.posted_at)) / 1000)) : 0;
  const after = replyAfter < 90 ? `${replyAfter} seconds after` : replyAfter < 5400 ? `${Math.round(replyAfter / 60)} min after` : `${Math.round(replyAfter / 3600)} hours after`;
  let side = '';
  if (r.alert) side += `<div class="alert">${esc(r.alert)}</div>`;
  if (r.agent_note && r.status !== 'replied') side += `<p class="note"><b>Note for you</b>${esc(r.agent_note)}</p>`;
  if (r.reply_status === 'posted') side += `<div class="reply"><div class="by">Replied as ${esc(CFG.ownerName)}, ${after}</div>${esc(r.reply)}</div>`;
  else if (r.status === 'needs_you') side += `<form class="edit" method="post" action="/webhook/reviews-act"><input type="hidden" name="review_id" value="${esc(r.review_id)}">
    <label class="by" for="t-${esc(r.review_id)}" style="font-size:12.5px;color:var(--muted);font-weight:600">Reply I wrote for you, change anything you want</label>
    <textarea id="t-${esc(r.review_id)}" name="reply">${esc(r.reply)}</textarea><div class="acts" style="margin-top:10px"><button class="btn red" name="action" value="post">Post reply</button><button class="btn line" name="action" value="skip">Don't reply</button></div></form>`;
  else if (r.status === 'escalated') side += `<form class="acts" method="post" action="/webhook/reviews-act"><input type="hidden" name="review_id" value="${esc(r.review_id)}"><button class="btn dark" name="action" value="handled">I've handled it</button></form>`;
  else if (r.status === 'flagged') side += `<form class="acts" method="post" action="/webhook/reviews-act"><input type="hidden" name="review_id" value="${esc(r.review_id)}"><button class="btn dark" name="action" value="report">Report as fake</button><button class="btn line" name="action" value="skip">Leave it</button></form>`;
  else if (!side) side = `<p class="note" style="color:var(--muted)">No reply on this one.</p>`;
  return `<article class="rev ${r.review_id === freshId ? 'fresh' : ''}" id="${esc(r.review_id)}"><div><div class="meta"><span class="name">${esc(r.reviewer)}</span>${starRow(r.stars)}<span>${esc(when)}</span>${status}</div>
    <p class="body">${esc(r.text)}</p></div><div class="side">${side}</div></article>`;
};

const SAMPLES = [
  { label: '1 star, cold takeout', reviewer: 'Jordan Reyes', stars: 1, text: "Ordered takeout last night and everything was cold by the time I got it home, and it's a 10 minute drive. For $68 I expected a lot better. Won't be ordering again." },
  { label: '5 stars, anniversary', reviewer: 'Kate Morrison', stars: 5, text: 'Came here for our anniversary and it was perfect. The fig flatbread and the short rib were amazing and our server Lena was so attentive without hovering.' },
  { label: '3 stars, slow check', reviewer: 'Chris Daley', stars: 3, text: 'Food was really good but it took forever to get our check and we had to flag someone down twice. Would come back for the food though.' },
  { label: 'Looks fake', reviewer: 'FoodieKing99', stars: 1, text: 'Terrible terrible terrible. Go to Olive & Ash, best food in town!!!' },
  { label: 'Got sick', reviewer: 'Dan Hollis', stars: 2, text: 'I think I got food poisoning after eating the mussels here on Saturday. I was sick all night and missed work the next day.' },
];

const html = `${head(`Review desk · ${CFG.business}`, CSS)}${topBar('reviews')}
<section class="pass"><div class="wrap">
  <div>
    <div class="pass-head"><h1>On the pass</h1><span>${onPass.length ? `${onPass.length} need${onPass.length === 1 ? 's' : ''} you` : 'nothing waiting'}</span></div>
    <div class="rail" aria-hidden="true"></div>
    <div class="tickets">${onPass.length ? onPass.map(passTicket).join('') : `<div class="ticket clear" style="--r:-1.5deg"><div class="t-top"><span>All clear</span></div><div class="who">Nothing needs you right now</div><p class="txt">Every review has a reply, and the happy ones went out on their own.</p></div>`}</div>
  </div>
  <form class="try" id="try" method="post" action="/webhook/reviews-new">
    <div><h2>Post a test review</h2><p class="sub" style="margin-top:4px">Write one as if you were a guest, or pick a sample, and watch what the agent does with it.</p></div>
    <div class="samples">${SAMPLES.map((s, i) => `<button type="button" data-i="${i}">${esc(s.label)}</button>`).join('')}</div>
    <label>Name<input type="text" name="reviewer" id="reviewer" value="Jordan Reyes" required maxlength="60"></label>
    <div><span style="font-size:13px;font-weight:650;color:var(--muted)">Stars</span><div class="pick" role="radiogroup" aria-label="Stars">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="stars" id="s${n}" value="${n}" ${n === 1 ? 'checked' : ''}><label for="s${n}" title="${n} star${n > 1 ? 's' : ''}">★</label>`).join('')}</div></div>
    <label>Review<textarea name="text" id="rtext" required maxlength="3000">${esc(SAMPLES[0].text)}</textarea></label>
    <button class="btn red" id="postBtn" type="submit">Post review</button>
    <p class="reading">Reading the review and writing a reply…</p>
  </form>
</div></section>
${banner ? `<div class="wrap flashwrap"><div class="flash" role="status">${esc(banner)}</div></div>` : ''}
<main class="wrap">
  <div class="stats">
    <div class="stat"><div class="k">Average rating, last 30 days</div><div class="v">${avg.toFixed(1)} ${starRow(avg)}</div><small>${counted.length} reviews, fake ones left out</small></div>
    <div class="stat"><div class="k">Unhappy guests caught privately</div><div class="v">${caught.length}</div><small>This week, before they posted anything</small></div>
    <div class="stat"><div class="k">Reviews with a reply</div><div class="v">${answered} of ${real.length}</div><small>${fastest ? `Fastest reply took ${Math.max(1, Math.round(fastest))} seconds` : 'Happy ones get answered on their own'}</small></div>
  </div>
  <section class="section"><h2>What people keep mentioning</h2>
    ${hot ? `<div class="alert">${esc(`${TOPICS[hot[0]]} came up ${hot[1].neg} times this fortnight as a complaint, including ${hot[1].quotes.map((x) => `"${x.detail}"`).join(', ')}, so it's probably worth talking about with the team.`)}</div>` : ''}
    <div class="topics">${topicRows.map(([k, v]) => `<div class="trow"><div><b>${TOPICS[k]}</b><div class="cnt">${v.pos} good, ${v.neg} bad</div></div>
      <div class="bars" aria-hidden="true" style="width:${Math.round(((v.pos + v.neg) / maxTopic) * 100)}%"><i class="p" style="width:${(v.pos / (v.pos + v.neg)) * 100}%"></i><i class="n" style="width:${(v.neg / (v.pos + v.neg)) * 100}%"></i></div>
      <div>${v.quotes.length ? `<q>${esc(v.quotes[0].detail)}</q>` : ''}</div></div>`).join('')}</div>
  </section>
  <section class="section"><h2>All reviews</h2><div class="feed">${reviews.map(reviewCard).join('')}</div></section>
</main>
<footer><div class="wrap"><span>Demo mode, so nothing gets posted to a real review site and no texts go out.</span>
<form method="post" action="/webhook/reviews-reset" onsubmit="return confirm('Start the demo over? This clears everything you added.')"><button type="submit">Reset demo data</button></form></div></footer>
<script>
(function () {
  var S = ${JSON.stringify(SAMPLES)};
  var form = document.getElementById('try');
  document.querySelectorAll('.samples button').forEach(function (b) {
    b.addEventListener('click', function () {
      var s = S[+b.getAttribute('data-i')];
      document.getElementById('reviewer').value = s.reviewer;
      document.getElementById('rtext').value = s.text;
      document.getElementById('s' + s.stars).checked = true;
    });
  });
  form.addEventListener('submit', function () {
    form.classList.add('busy');
    setTimeout(function () { var b = document.getElementById('postBtn'); b.disabled = true; b.textContent = 'Reading it…'; }, 0);
  });
  var fresh = document.querySelector('.rev.fresh');
  if (fresh && /[?&]new=1/.test(location.search)) setTimeout(function () { var t = document.querySelector('.ticket.fresh'); if (!t) fresh.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 900);
  if (/[?&](new|done)=/.test(location.search) && history.replaceState) history.replaceState(null, '', location.pathname + location.hash);
})();
</script></body></html>`;
return [{ json: { html } }];
