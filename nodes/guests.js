//@ ask-messages
// Texts everyone who came in today and hasn't been asked yet, in Sam's voice, mentioning what they had.
const todayStart = new Date(Date.now() - 20 * 3600000).getTime();
const toAsk = $('Get guests').all().map((i) => i.json)
  .filter((g) => g.guest_id && g.status === 'not_asked' && new Date(g.visit_at).getTime() >= todayStart);
return toAsk.map((g, i) => {
  const at = new Date(Date.now() + i).toISOString();
  const what = g.visit_type === 'takeout'
    ? `thanks a lot for ordering with us tonight, and I hope the ${g.ordered} made it home hot`
    : /birthday/i.test(g.ordered) ? 'thanks so much for celebrating with us tonight, and I really hope the birthday dinner felt special'
      : `thanks so much for coming in tonight, and I hope the ${g.ordered} ${/ and /.test(g.ordered) ? 'were' : 'was'} as good as ${/ and /.test(g.ordered) ? 'they usually are' : 'it usually is'}`;
  return { json: { guest_id: g.guest_id, direction: 'out', at,
    body: `Hey ${first(g.name)}, it's ${CFG.ownerName} from Little Fig, ${what}. If you have a second, how was everything from 1 to 5? Just reply here, honestly any feedback really helps us.` } };
});

//@ ask-updates
return $('Feedback texts').all().map((i) => ({ json: { guest_id: i.json.guest_id, status: 'asked', asked_at: i.json.at } }));

//@ guest-entry
// The guest's answer typed on the phone page.
const b = $input.first().json.body || {};
const stars = Math.min(5, Math.max(1, Math.round(num(b.stars) || 0)));
const text = String(b.text || '').trim().slice(0, 1500);
if (!b.guest_id || (!text && !num(b.stars))) return [];
return [{ json: { guest_id: String(b.guest_id), direction: 'in', at: nowIso, body: `${stars}. ${text}`.trim() } }];

//@ guest-prepare
const entry = $('Guest message').first().json;
const g = $('Get guests').all().map((i) => i.json).find((x) => x.guest_id === entry.guest_id) || {};
const stars = num(entry.body.split('.')[0]);
const comment = entry.body.replace(/^\d\.\s*/, '');
const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['topics', 'summary', 'guest_reply', 'owner_alert', 'fix_suggestion'],
  properties: {
    topics: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['topic', 'feeling', 'detail'], properties: {
      topic: { type: 'string', enum: Object.keys(TOPICS), description: 'delivery covers takeout and delivery orders, including food arriving cold' },
      feeling: { type: 'string', enum: ['positive', 'negative'] }, detail: { type: 'string', description: 'A few words in the guest\'s own words' } } } },
    summary: { type: 'string', description: 'One short plain line' },
    guest_reply: { type: 'string', description: 'The text message back to the guest, 1 to 3 sentences. For 4 or 5 stars thank them and ask for a short public review, ending with the placeholder [REVIEW_LINK]. For 3 stars or less do not ask for a review: apologize for the specific thing and offer to make it right, like their next visit or order on you.' },
    owner_alert: { type: 'string', description: `For 3 stars or less: a note to ${CFG.ownerName}, 2 sentences at most, saying what happened, what you already told the guest, and that nothing went public. Empty for happy guests.` },
    fix_suggestion: { type: 'string', description: 'One short sentence with one practical thing to change if there was a real problem, else empty' },
  },
};
const SYSTEM = `You text guests of ${CFG.business}, a small neighborhood restaurant in ${CFG.city}, after their visit, on behalf of ${CFG.ownerName}.
This is a private text conversation, not a public review, so keep it short and human like a real text message, no greeting line like "Dear", no sign-off.
Never promise money back, only things like their next visit or order on ${CFG.ownerName}.

${VOICE}`;
return [{ json: { stars, comment, aiBody: {
  model: CFG.aiModel, max_tokens: 1200, system: SYSTEM, fallbacks: 'default',
  output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
  messages: [{ role: 'user', content: `Guest: ${g.name}\nVisit: ${g.visit_type}, party of ${g.party}, they had ${g.ordered}\nTheir answer: ${stars} out of 5\nThey wrote: ${comment || '(nothing else)'}` }],
} } }];

//@ guest-decide
// Happy guests get a thank-you and the review link. Unhappy ones get an apology, and Sam gets the alert, privately.
const entry = $('Guest message').first().json;
const prep = $('Prepare AI').first().json;
const res = $input.first().json;
const block = Array.isArray(res.content) && res.content.find((c) => c.type === 'text');
const d = (res.stop_reason !== 'refusal' && block && parseJson(block.text, null)) || {};
const g = $('Get guests').all().map((i) => i.json).find((x) => x.guest_id === entry.guest_id) || {};
const happy = prep.stars >= 4;
let reply = String(d.guest_reply || '').trim();
if (!reply) reply = happy ? `Thank you so much ${first(g.name)}, that honestly made my night, and if you have a minute a short review would really help us: [REVIEW_LINK]`
  : `I'm really sorry ${first(g.name)}, that's not what we want anyone to get, and your next visit is on me, just mention this message.`;
if (happy) reply = reply.includes('[REVIEW_LINK]') ? reply.replace('[REVIEW_LINK]', CFG.reviewLink) : `${reply} ${CFG.reviewLink}`;
else reply = reply.replace(/\s*\[REVIEW_LINK\]/g, '');

// Same "third time this week" check as the public reviews.
const week = Date.now() - 7 * 86400000;
const recentNeg = [];
$('Get reviews').all().map((i) => i.json).filter((x) => x.review_id && new Date(x.posted_at).getTime() >= week)
  .forEach((x) => parseJson(x.topics, []).filter((t) => t.feeling === 'negative').forEach((t) => recentNeg.push(t)));
$('Get guests').all().map((i) => i.json).filter((x) => x.guest_id && x.guest_id !== g.guest_id && x.answered_at && new Date(x.answered_at).getTime() >= week)
  .forEach((x) => parseJson(x.topics, []).filter((t) => t.feeling === 'negative').forEach((t) => recentNeg.push(t)));
let alert = happy ? '' : (d.owner_alert || `${g.name} wasn't happy (${prep.stars} out of 5), I said sorry and offered to make it right, and nothing went public.`);
const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
if (!happy) for (const t of (d.topics || []).filter((t) => t.feeling === 'negative')) {
  const same = recentNeg.filter((x) => x.topic === t.topic);
  if (same.length >= 2) { alert += ` And this is the ${ORD[same.length + 1] || (same.length + 1) + 'th'} time this week someone complained about ${TOPICS[t.topic].toLowerCase()}, so it's worth looking at with the team.`; break; }
}
return [{ json: { guest_id: g.guest_id, status: happy ? 'happy' : 'unhappy', stars: prep.stars, comment: prep.comment, topics: JSON.stringify(d.topics || []),
  alert, fix: happy ? '' : (d.fix_suggestion || ''), answered_at: entry.at, reply } }];

//@ guest-fields
const d = $('Decide').first().json;
const { reply, ...fields } = d;
return [{ json: fields }];

//@ guest-reply-message
const d = $('Decide').first().json;
return [{ json: { guest_id: d.guest_id, direction: 'out', at: new Date(Date.now() + 1500).toISOString(), body: d.reply } }];
