//@ review-entry
// A public review coming in. In the demo it's typed on the dashboard, in real life it would come from the review site.
const b = $input.first().json.body || {};
const stars = Math.min(5, Math.max(1, Math.round(num(b.stars) || 5)));
const text = String(b.text || '').trim().slice(0, 3000);
if (!text) return [];
return [{ json: { review_id: 'R' + Date.now().toString(36), posted_at: nowIso, reviewer: String(b.reviewer || 'A guest').trim().slice(0, 60), stars, text } }];

//@ review-prepare
// Asks the AI to read the review and write the public reply in Sam's voice.
const r = $('New review').first().json;
const topicKeys = Object.keys(TOPICS);
const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['sentiment', 'kind', 'suspicious_reason', 'topics', 'summary', 'reply', 'owner_note', 'fix_suggestion'],
  properties: {
    sentiment: { type: 'string', enum: ['positive', 'mixed', 'negative'] },
    kind: { type: 'string', enum: ['normal', 'suspicious', 'safety_or_legal'], description: 'suspicious: likely fake, spam, or a competitor (no details of a real visit, promotes another business). safety_or_legal: food poisoning, illness, allergic reaction, injury, discrimination, or legal threats.' },
    suspicious_reason: { type: 'string', description: 'Why it looks fake, empty if kind is not suspicious' },
    topics: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['topic', 'feeling', 'detail'], properties: {
      topic: { type: 'string', enum: topicKeys, description: 'delivery covers takeout and delivery orders, including food arriving cold' },
      feeling: { type: 'string', enum: ['positive', 'negative'] },
      detail: { type: 'string', description: 'A few words in the guest\'s own words, like "pasta was cold by the time I got home"' } } } },
    summary: { type: 'string', description: 'One short plain line saying what the review is about' },
    reply: { type: 'string', description: 'The public reply. Empty when kind is suspicious or safety_or_legal, because those must not get a public reply from the agent.' },
    owner_note: { type: 'string', description: `A note to ${CFG.ownerName}, 2 sentences at most: what happened and the one thing he should do now. Don't repeat the fix idea here. Empty for a simple happy review.` },
    fix_suggestion: { type: 'string', description: 'One short sentence with one practical thing the restaurant could change, only if the review points to a real problem, else empty' },
  },
};
const SYSTEM = `You handle public reviews for ${CFG.business}, a small neighborhood restaurant in ${CFG.city} owned by ${CFG.ownerName}.
Read the review, sort it, and write the public reply.
Reply rules:
- 2 to 4 sentences, starting with "Hey" and the reviewer's first name when they gave a real name, and no sign-off or name at the end.
- Mention the real details they wrote about (the dish, the staff member, the occasion, the problem), so it could only be a reply to this review.
- Never argue, never blame the guest, never promise refunds or money publicly, and never make up facts about the restaurant.
- For complaints, own it, say sorry plainly, say what you'll look at, and invite them to reach out so you can make it right.
- If the review looks fake or is about illness, injury, or a legal threat, leave the reply empty and explain in owner_note.

${VOICE}`;
return [{ json: { aiBody: {
  model: CFG.aiModel, max_tokens: 1500, system: SYSTEM, fallbacks: 'default',
  output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
  messages: [{ role: 'user', content: `Reviewer: ${r.reviewer}\nStars: ${r.stars} out of 5\nReview:\n${r.text}` }],
} } }];

//@ review-decide
// Turns the AI's reading into what happens: post the reply, hold it for Sam, or stop and tell him.
// Also counts how often the same complaint came up this week, across public reviews and private feedback.
const r = $('New review').first().json;
const res = $input.first().json;
const block = Array.isArray(res.content) && res.content.find((c) => c.type === 'text');
const d = (res.stop_reason !== 'refusal' && block && parseJson(block.text, null)) || null;
const week = Date.now() - 7 * 86400000;
const recentNeg = [];
$('Get reviews').all().map((i) => i.json).filter((x) => x.review_id && new Date(x.posted_at).getTime() >= week)
  .forEach((x) => parseJson(x.topics, []).filter((t) => t.feeling === 'negative').forEach((t) => recentNeg.push({ ...t, who: x.reviewer, where: 'review' })));
$('Get guests').all().map((i) => i.json).filter((x) => x.guest_id && x.answered_at && new Date(x.answered_at).getTime() >= week)
  .forEach((x) => parseJson(x.topics, []).filter((t) => t.feeling === 'negative').forEach((t) => recentNeg.push({ ...t, who: x.name, where: 'private' })));

if (!d) {
  return [{ json: { ...r, sentiment: r.stars >= 4 ? 'positive' : 'negative', kind: 'normal', topics: '[]', summary: '', reply: '', reply_status: 'none', status: 'needs_you',
    replied_at: '', agent_note: "I couldn't read this one properly, so it's waiting for you, and you can write the reply yourself or try again in a minute.", alert: '', batch: 'live' } }];
}

const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
let alert = '';
const negNow = (d.topics || []).filter((t) => t.feeling === 'negative');
let best = null;
for (const t of negNow) {
  const same = recentNeg.filter((x) => x.topic === t.topic);
  if (same.length >= 2 && (!best || same.length > best.same.length)) best = { t, same };
}
if (best) {
  const n = best.same.length + 1;
  const qs = best.same.slice(0, 3).map((x) => `"${x.detail}"`);
  const quotes = qs.length > 1 ? `${qs.slice(0, -1).join(', ')} and ${qs[qs.length - 1]}` : qs[0];
  alert = `This is the ${ORD[n] || n + 'th'} time this week someone complained about ${TOPICS[best.t.topic].toLowerCase()}, after ${quotes}, so it's probably not a one-off and worth looking at with the team.`;
}

let status, reply_status, note = d.owner_note || '';
if (d.kind === 'suspicious') {
  status = 'flagged'; reply_status = 'none';
  note = `This looks like a fake review${d.suspicious_reason ? `, ${d.suspicious_reason.charAt(0).toLowerCase() + d.suspicious_reason.slice(1).replace(/\.$/, '')}` : ''}, so I didn't reply to it, and you can report it so it gets taken down.`;
} else if (d.kind === 'safety_or_legal') {
  status = 'escalated'; reply_status = 'none';
  note = note || "This one is about someone getting sick, so I didn't reply publicly, because this really should come from you, and it's worth reaching out to them directly first.";
} else if (r.stars >= 4 && d.sentiment === 'positive') {
  status = 'replied'; reply_status = 'posted';
} else {
  status = 'needs_you'; reply_status = 'draft';
  if (!note) note = "It's a complaint, so I wrote a reply but I'm holding it until you've had a look.";
}
if (d.fix_suggestion && status !== 'flagged') note += `${note ? ' ' : ''}One idea: ${d.fix_suggestion.charAt(0).toLowerCase() + d.fix_suggestion.slice(1)}`;

return [{ json: { ...r, sentiment: d.sentiment, kind: d.kind, topics: JSON.stringify(d.topics || []), summary: d.summary, reply: status === 'flagged' || status === 'escalated' ? '' : d.reply,
  reply_status, status, replied_at: reply_status === 'posted' ? nowIso : '', agent_note: note, alert, batch: 'live' } }];
