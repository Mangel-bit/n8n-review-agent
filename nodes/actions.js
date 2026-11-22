//@ review-action
// Sam posts the drafted reply (maybe edited), skips it, marks a careful one as handled, or reports a fake one.
const b = $('Review action').first().json.body || {};
const r = $('Get reviews for action').all().map((i) => i.json).find((x) => x.review_id === b.review_id);
if (!r) return [];
if (b.action === 'post') {
  const reply = String(b.reply || r.reply || '').trim().slice(0, 3000);
  return [{ json: { review_id: r.review_id, reply, reply_status: 'posted', status: 'replied', replied_at: nowIso } }];
}
const status = { skip: r.status === 'flagged' ? 'done' : 'done', handled: 'handled', report: 'reported' }[b.action] || r.status;
return [{ json: { review_id: r.review_id, status, reply_status: r.reply_status === 'draft' ? 'none' : r.reply_status } }];
