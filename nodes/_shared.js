// Shared helpers, added to the top of every Code node by build.js. CFG comes from config.json.
const today = (typeof $now !== 'undefined' && $now && $now.toISODate) ? $now.toISODate() : new Date().toISOString().slice(0, 10);
const nowIso = new Date().toISOString();
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const parseJson = (s, fallback) => { try { const v = JSON.parse(s); return v ?? fallback; } catch { return fallback; } };
const fmtDate = (s) => { const d = new Date(s); return isNaN(d) ? '' : `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`; };
const daysAgoIso = (n, h = 19, m = 0) => { const d = new Date(Date.now() - n * 86400000); d.setUTCHours(h, m, 0, 0); return d.toISOString(); };
const ago = (s) => {
  const mins = Math.round((Date.now() - new Date(s).getTime()) / 60000);
  if (!Number.isFinite(mins)) return '';
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60); if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.round(h / 24); return d === 1 ? 'yesterday' : `${d} days ago`;
};
const first = (name) => String(name || '').trim().split(/\s+/)[0] || 'there';

// What people talk about, and how each one is called on screen.
const TOPICS = { food: 'Food', service: 'Service', wait_time: 'Wait time', price: 'Price', cleanliness: 'Cleanliness', atmosphere: 'Atmosphere', delivery: 'Takeout and delivery', staff: 'Staff', drinks: 'Drinks', other: 'Other' };

// The owner's own voice, carried into English. Every prompt that writes text includes this.
const VOICE = `Write in ${CFG.ownerName}'s own voice, in English. ${CFG.ownerName} owns ${CFG.business}, a small neighborhood restaurant in ${CFG.city}. This is how he writes:
- Connected, the way he talks: one flowing thought where each sentence comes out of the one before, joined with "and", "but", "so", "because". Not a string of short separate sentences, and not many full stops.
- Natural order: thank them or acknowledge what happened, then the specific thing they mentioned, then how he feels about it, then what happens next or an invitation.
- Warm and plain: everyday words, the guest's first name, and the real details they mentioned (the dish, the server, the night), never generic praise.
- When something went wrong he owns it without excuses or arguing, he says the feeling plainly ("I'm really sorry, that's not what we want anyone to get"), and he offers something concrete like asking them to reach out or come back on him.
- Fair: if he disagrees with something he says it gently and admits their side first.
- Words like "really", "honestly", "totally" show up now and then, never all together.
- Never: corporate phrases (we value your feedback, we strive, we apologize for any inconvenience, valued customer), em dashes, exclamation marks, emoji, hashtags, or a wise-sounding closing line.`;
