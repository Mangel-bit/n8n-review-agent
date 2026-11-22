// Builds the Review Agent workflows into ./workflows from config.json and the Code files in ./nodes.
// Run: node build.js   then import each file with: n8n import:workflow --input=workflows/<file>.json
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const ROOT = __dirname;
const { credentials: CRED, ...CFG } = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const read = (f) => fs.readFileSync(path.join(ROOT, 'nodes', f), 'utf8');
const prefix = `const CFG = ${JSON.stringify(CFG)};\n${read('_shared.js')}\n`;
const ui = read('_ui.js') + '\n';
const file = (f, withUi = false) => prefix + (withUi ? ui : '') + read(f);
const snippetsOf = (f) => Object.fromEntries(read(f).split(/^\/\/@ /m).slice(1)
  .map((s) => { const [name, ...rest] = s.split('\n'); return [name.trim(), prefix + rest.join('\n')]; }));
const S = { ...snippetsOf('seed.js'), ...snippetsOf('review.js'), ...snippetsOf('guests.js'), ...snippetsOf('actions.js') };

const REVIEW_COLS = [['review_id', 's'], ['posted_at', 's'], ['reviewer', 's'], ['stars', 'n'], ['text', 's'], ['sentiment', 's'], ['kind', 's'], ['topics', 's'],
  ['summary', 's'], ['reply', 's'], ['reply_status', 's'], ['status', 's'], ['replied_at', 's'], ['agent_note', 's'], ['alert', 's'], ['batch', 's']];
const GUEST_COLS = [['guest_id', 's'], ['name', 's'], ['phone', 's'], ['visit_at', 's'], ['visit_type', 's'], ['party', 'n'], ['ordered', 's'], ['status', 's'],
  ['stars', 'n'], ['comment', 's'], ['topics', 's'], ['alert', 's'], ['fix', 's'], ['asked_at', 's'], ['answered_at', 's'], ['batch', 's']];
const TEXT_COLS = [['guest_id', 's'], ['direction', 's'], ['at', 's'], ['body', 's']];
// No table name may be part of another one: n8n's "create if missing" matches names loosely.
const T = { reviews: 'Review desk reviews', guests: 'Review desk guests', texts: 'Review desk texts' };
const colType = { s: 'string', n: 'number' };

// ---------- node factories ----------
const at = (col, row = 0) => [col * 240, row * 200];
const code = (name, src, pos) => ({ name, type: 'n8n-nodes-base.code', typeVersion: 2, position: pos, parameters: { jsCode: src } });
const table = (t) => ({ __rl: true, mode: 'name', value: t });
const dt = (name, pos, parameters, extra = {}) => ({ name, type: 'n8n-nodes-base.dataTable', typeVersion: 1.1, position: pos, parameters, ...extra });
const createTable = (name, t, cols, pos) => dt(name, pos, { resource: 'table', operation: 'create', tableName: t,
  columns: { column: cols.map(([n, ty]) => ({ name: n, type: colType[ty] })) }, options: { createIfNotExists: true } });
const clearTable = (name, t, pos) => dt(name, pos, { resource: 'table', operation: 'clear', dataTableId: table(t) });
const getAll = (name, t, pos) => dt(name, pos, { resource: 'row', operation: 'get', dataTableId: table(t), matchType: 'anyCondition', filters: {}, returnAll: true },
  { executeOnce: true, alwaysOutputData: true });
const insert = (name, t, pos) => dt(name, pos, { resource: 'row', operation: 'insert', dataTableId: table(t), columns: { mappingMode: 'autoMapInputData', value: null }, options: {} });
const update = (name, t, key, pos) => dt(name, pos, { resource: 'row', operation: 'update', dataTableId: table(t), matchType: 'allConditions',
  filters: { conditions: [{ keyName: key, condition: 'eq', keyValue: `={{ $json.${key} }}` }] }, columns: { mappingMode: 'autoMapInputData', value: null }, options: {} });
const aiCall = (name, pos) => ({ name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: pos, onError: 'continueRegularOutput',
  // Without a credential id in config.json, n8n asks you to pick your Anthropic credential on the node after import.
  ...(CRED.anthropic && CRED.anthropic.id ? { credentials: { anthropicApi: CRED.anthropic } } : {}),
  parameters: { method: 'POST', url: 'https://api.anthropic.com/v1/messages', authentication: 'predefinedCredentialType', nodeCredentialType: 'anthropicApi',
    sendHeaders: true, headerParameters: { parameters: [{ name: 'anthropic-version', value: '2026-10-21' }, { name: 'anthropic-beta', value: 'server-side-fallback-2026-07-01' }] },
    sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify($json.aiBody) }}', options: { timeout: 120000 } } });
const webhook = (name, method, p, mode, id, pos, extra = {}) => ({ name, type: 'n8n-nodes-base.webhook', typeVersion: 2.1, position: pos, webhookId: id,
  parameters: { httpMethod: method, path: p, responseMode: mode, options: {}, ...extra } });
// The browser waits while the agent works, then gets one redirect, so pages never need to poll.
const waitThenGo = (name, p, to, id, pos) => webhook(name, 'POST', p, 'lastNode', id, pos, { responseData: 'noData', options: {
  responseCode: { values: { responseCode: 'customCode', customCode: 303 } }, responseHeaders: { entries: [{ name: 'Location', value: to }] } } });
const respond = (name, body, headers, pos, codeNo = 200) => ({ name, type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.5, position: pos,
  parameters: { respondWith: 'text', responseBody: body, options: { responseCode: codeNo, responseHeaders: { entries: headers } } } });
const redirect = (name, to, pos) => respond(name, 'Redirecting…', [{ name: 'Location', value: to }], pos, 303);
const page = (name, pos) => respond(name, '={{ $json.html }}', [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }, { name: 'Cache-Control', value: 'no-store' }], pos);

const wf = (id, name, nodes, links) => {
  const connections = {};
  for (const [from, ...to] of links) connections[from] = { main: [to.map((n) => ({ node: n, type: 'main', index: 0 }))] };
  nodes.forEach((n) => { n.id = n.id || randomUUID(); });
  return { id, name, active: false, nodes, connections, settings: { executionOrder: 'v1' }, pinData: {} };
};
const chain = (...names) => names.slice(0, -1).map((n, i) => [n, names[i + 1]]);
const ID = (n) => `8c3f4e5a-6b7c-4d81-9ea2-b4c5d6e7f8${String(n).padStart(2, '0')}`;

// ---------- 0. Setup ----------
const setup = wf('reviewDeskSetup0', 'Review Agent · 0 Setup', [
  webhook('Run setup (link)', 'POST', 'reviews-setup', 'responseNode', ID(0), at(0, -1)),
  createTable('Create reviews table', T.reviews, REVIEW_COLS, at(1, -1)),
  createTable('Create guests table', T.guests, GUEST_COLS, at(2, -1)),
  createTable('Create texts table', T.texts, TEXT_COLS, at(3, -1)),
  webhook('Reset demo', 'POST', 'reviews-reset', 'responseNode', ID(1), at(0, 1)),
  code('Only in test mode', prefix + 'if (!CFG.testMode) return [];\nreturn $input.all();', at(1, 1)),
  createTable('Reviews table', T.reviews, REVIEW_COLS, at(2, 1)),
  createTable('Guests table', T.guests, GUEST_COLS, at(3, 1)),
  createTable('Texts table', T.texts, TEXT_COLS, at(4, 1)),
  clearTable('Clear reviews', T.reviews, at(5, 1)),
  clearTable('Clear guests', T.guests, at(6, 1)),
  clearTable('Clear texts', T.texts, at(7, 1)),
  getAll('Get reviews', T.reviews, at(8)),
  code('Demo reviews (only if empty)', S['seed-reviews'], at(9)),
  insert('Save reviews', T.reviews, at(10)),
  code('Demo guests', S['seed-guests'], at(11)),
  insert('Save guests', T.guests, at(12)),
  code('Demo texts', S['seed-messages'], at(13)),
  insert('Save texts', T.texts, at(14)),
  redirect('Back to reviews', '/webhook/reviews?done=reset', at(15)),
], [
  ...chain('Run setup (link)', 'Create reviews table', 'Create guests table', 'Create texts table', 'Get reviews'),
  ...chain('Reset demo', 'Only in test mode', 'Reviews table', 'Guests table', 'Texts table', 'Clear reviews', 'Clear guests', 'Clear texts', 'Get reviews'),
  ...chain('Get reviews', 'Demo reviews (only if empty)', 'Save reviews', 'Demo guests', 'Save guests', 'Demo texts', 'Save texts', 'Back to reviews'),
]);

// ---------- 1. New public review ----------
const reviewer = wf('reviewDeskRead01', 'Review Agent · 1 Read reviews', [
  waitThenGo('New review (demo)', 'reviews-new', '/webhook/reviews?new=1', ID(10), at(0)),
  code('New review', S['review-entry'], at(1)),
  getAll('Get reviews', T.reviews, at(2)),
  getAll('Get guests', T.guests, at(3)),
  code('Prepare AI', S['review-prepare'], at(4)),
  aiCall('AI reads the review', at(5)),
  code('Decide', S['review-decide'], at(6)),
  insert('Save review', T.reviews, at(7)),
], [...chain('New review (demo)', 'New review', 'Get reviews', 'Get guests', 'Prepare AI', 'AI reads the review', 'Decide', 'Save review')]);

// ---------- 2. Guest texts ----------
const texts = wf('reviewDeskText01', 'Review Agent · 2 Guest texts', [
  waitThenGo('Text today\'s guests', 'guests-ask', '/webhook/guests?asked=1', ID(20), at(0, 0)),
  getAll('Get guests', T.guests, at(1, 0)),
  code('Feedback texts', S['ask-messages'], at(2, 0)),
  insert('Save texts', T.texts, at(3, 0)),
  code('Asked', S['ask-updates'], at(4, 0)),
  update('Update guests', T.guests, 'guest_id', at(5, 0)),

  waitThenGo('Guest answers (demo)', 'guests-reply', '/webhook/guests?new=1', ID(21), at(0, 1)),
  code('Guest message', S['guest-entry'], at(1, 1)),
  insert('Save guest message', T.texts, at(2, 1)),
  getAll('Get guests for answer', T.guests, at(3, 1)),
  getAll('Get reviews', T.reviews, at(4, 1)),
  code('Prepare AI', S['guest-prepare'].replace("$('Get guests')", "$('Get guests for answer')"), at(5, 1)),
  aiCall('AI reads the answer', at(6, 1)),
  code('Decide', S['guest-decide'].replace(/\$\('Get guests'\)/g, "$('Get guests for answer')"), at(7, 1)),
  code('Guest fields', S['guest-fields'], at(8, 1)),
  update('Update guest', T.guests, 'guest_id', at(9, 1)),
  code('Reply text', S['guest-reply-message'], at(10, 1)),
  insert('Save reply', T.texts, at(11, 1)),
], [
  ...chain('Text today\'s guests', 'Get guests', 'Feedback texts', 'Save texts', 'Asked', 'Update guests'),
  ...chain('Guest answers (demo)', 'Guest message', 'Save guest message', 'Get guests for answer', 'Get reviews', 'Prepare AI', 'AI reads the answer', 'Decide', 'Guest fields', 'Update guest', 'Reply text', 'Save reply'),
]);

// ---------- 3. Pages ----------
const pages = wf('reviewDeskPage01', 'Review Agent · 3 Pages', [
  webhook('Reviews page', 'GET', 'reviews', 'responseNode', ID(30), at(0, 0)),
  getAll('Get reviews', T.reviews, at(1, 0)),
  getAll('Get guests', T.guests, at(2, 0)),
  code('Render reviews', file('render-reviews.js', true), at(3, 0)),
  page('Send reviews page', at(4, 0)),

  webhook('Guests page', 'GET', 'guests', 'responseNode', ID(31), at(0, 1)),
  getAll('Get guests list', T.guests, at(1, 1)),
  getAll('Get messages', T.texts, at(2, 1)),
  code('Render guests', file('render-guests.js', true).replace(/\$\('Get guests'\)/g, "$('Get guests list')"), at(3, 1)),
  page('Send guests page', at(4, 1)),

  webhook('Review action', 'POST', 'reviews-act', 'responseNode', ID(32), at(0, 2)),
  getAll('Get reviews for action', T.reviews, at(1, 2)),
  code('Apply action', S['review-action'], at(2, 2)),
  update('Update review', T.reviews, 'review_id', at(3, 2)),
  redirect('Back to reviews', "=/webhook/reviews?done={{ $('Review action').first().json.body.action }}#{{ $('Apply action').first().json.review_id }}", at(4, 2)),
], [
  ...chain('Reviews page', 'Get reviews', 'Get guests', 'Render reviews', 'Send reviews page'),
  ...chain('Guests page', 'Get guests list', 'Get messages', 'Render guests', 'Send guests page'),
  ...chain('Review action', 'Get reviews for action', 'Apply action', 'Update review', 'Back to reviews'),
]);

fs.mkdirSync(path.join(ROOT, 'workflows'), { recursive: true });
for (const [f, w] of [['0-setup', setup], ['1-read-reviews', reviewer], ['2-guest-texts', texts], ['3-pages', pages]]) {
  fs.writeFileSync(path.join(ROOT, 'workflows', f + '.json'), JSON.stringify(w, null, 2));
}
console.log('Built 4 workflows.');
