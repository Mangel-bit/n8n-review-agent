//@ seed-reviews
// Two weeks of public reviews, dated relative to now so "this week" always works when the demo is reset.
// Two of them already complain about cold takeout, so the angry review in the demo becomes the third.
if ($('Get reviews').all().some((i) => i.json.review_id)) return [];
const T = (topic, feeling, detail) => ({ topic, feeling, detail });
const R = (n, d, reviewer, stars, text, topics, reply, extra = {}) => ({
  review_id: `R${String(n).padStart(2, '0')}`, posted_at: daysAgoIso(d, 20 - (n % 5), 10 + n), reviewer, stars, text, sentiment: stars >= 4 ? 'positive' : stars === 3 ? 'mixed' : 'negative',
  kind: 'normal', topics: JSON.stringify(topics), summary: '', reply, reply_status: reply ? 'posted' : 'none', status: 'replied',
  replied_at: daysAgoIso(d, 21 - (n % 5), 2 + n), agent_note: '', alert: '', batch: 'seed', ...extra,
});
return [
  R(1, 1, 'Dana Whitfield', 5, "The short rib was unreal and Marco at the bar made me the best old fashioned I've had in a while. Cozy spot, we'll be back.",
    [T('food', 'positive', 'the short rib'), T('drinks', 'positive', 'old fashioned'), T('staff', 'positive', 'Marco at the bar')],
    "Hey Dana, thank you so much for this, and I'll make sure Marco sees it because he really takes those old fashioneds seriously. The short rib is honestly the dish I'm proudest of, so I'm really happy it landed, and we'd love to have you back soon."),
  R(2, 2, 'Priya Nair', 4, 'Great food, a bit loud on a Saturday night but the fig flatbread makes up for it.',
    [T('food', 'positive', 'fig flatbread'), T('atmosphere', 'negative', 'loud on Saturday night')],
    "Hey Priya, thanks a lot for coming in, and you're totally right that Saturdays get loud, so if you come back on a weeknight it's a lot calmer and the flatbread is just as good, I'd really love to have you again."),
  R(3, 3, 'Tom Becker', 2, 'Ordered takeout on Friday and the pasta was cold by the time I got home, and I live 10 minutes away. Flavor was good but cold pasta is sad.',
    [T('delivery', 'negative', 'pasta was cold by the time I got home'), T('food', 'positive', 'good flavor')],
    "Hey Tom, I'm really sorry about that, cold pasta is not what we want anyone to get, especially from 10 minutes away. We're looking at how we pack the takeout orders on busy nights, and if you reach out to us next time you order I'll make sure it's on me."),
  R(4, 4, 'Alicia Gomez', 5, "Celebrated my mom's birthday here and the staff brought a candle in the panna cotta without us even asking. So sweet, thank you.",
    [T('staff', 'positive', 'candle in the panna cotta for the birthday'), T('food', 'positive', 'panna cotta')],
    "Hey Alicia, this honestly made our day, and I'm really glad your mom had a good birthday with us. The team loves little moments like that, so I'll pass this on to them, and happy birthday to her from all of us."),
  R(5, 5, 'Kenji Mori', 5, 'Best brunch in the neighborhood. The shakshuka is perfect and the coffee is strong.',
    [T('food', 'positive', 'shakshuka'), T('drinks', 'positive', 'strong coffee')],
    "Hey Kenji, thanks so much, and I'm really happy you like the shakshuka because it's been on the brunch menu since day one. See you next weekend I hope."),
  R(6, 6, 'Rachel Stone', 3, 'Food is lovely but we waited 25 minutes for our table even with a reservation.',
    [T('food', 'positive', 'food is lovely'), T('wait_time', 'negative', 'waited 25 minutes with a reservation')],
    "Hey Rachel, I'm really sorry about the wait, 25 minutes with a reservation isn't okay and I totally get the frustration. We had a big table stay late that night, but that's on us to manage, so please let me know next time you book and I'll make sure your table is ready."),
  R(7, 8, 'Jay Patel', 5, 'Everything we ordered was great. The roasted carrots with whipped feta are a must.',
    [T('food', 'positive', 'roasted carrots with whipped feta')],
    "Hey Jay, thank you, and honestly the carrots surprise a lot of people so I'm really glad you tried them. Hope to see you again soon."),
  R(8, 9, 'BestEatsPDX', 1, 'Worst place in Portland. Go to Olive & Ash instead, way better!!!',
    [], '', { kind: 'suspicious', status: 'flagged', reply_status: 'none', replied_at: '',
      agent_note: "No details about a visit and it sends people to another restaurant, so this looks like a fake review, and I didn't reply to it. You can report it so it gets taken down." }),
  R(9, 11, 'Sofia Lindqvist', 4, 'Happy hour is a steal. Wish it went a bit later.',
    [T('price', 'positive', 'happy hour'), T('other', 'negative', 'happy hour ends early')],
    "Hey Sofia, thanks so much, and you're not the first to ask for a later happy hour, so honestly we're thinking about it. I'll let you know if it changes."),
  R(10, 12, 'Mark Ellis', 5, 'Lena was our server and she was fantastic. Great wine recommendations.',
    [T('staff', 'positive', 'Lena'), T('drinks', 'positive', 'wine recommendations')],
    "Hey Mark, thank you, Lena is really great and I'll make sure she sees this. Glad you liked the wine too."),
  R(11, 13, 'Grace Kim', 5, 'Our new favorite date night spot. Cozy and the food is always good.',
    [T('atmosphere', 'positive', 'cozy'), T('food', 'positive', 'always good')],
    "Hey Grace, that honestly means a lot, thank you, and we'll keep a cozy table for you two."),
  R(12, 14, 'Ben Okafor', 5, 'The mushroom pappardelle is the best pasta I have had in the city.',
    [T('food', 'positive', 'mushroom pappardelle')],
    "Hey Ben, thank you so much, the pappardelle is the one our kitchen fights over, so this made their week."),
].map((json) => ({ json }));

//@ seed-guests
// Guests who came in recently. Four came in today and haven't been asked yet.
const T = (topic, feeling, detail) => ({ topic, feeling, detail });
const G = (id, name, visit_at, visit_type, party, ordered, extra = {}) => ({ guest_id: id, name, phone: '', visit_at, visit_type, party, ordered,
  status: 'not_asked', stars: 0, comment: '', topics: '[]', alert: '', fix: '', asked_at: '', answered_at: '', batch: 'seed', ...extra });
return [
  G('G01', 'Liam Carter', daysAgoIso(2, 1, 40), 'takeout', 1, 'chicken thighs and roasted carrots', {
    status: 'unhappy', stars: 2, comment: 'Food was cold when I got it home. Again.', topics: JSON.stringify([T('delivery', 'negative', 'food was cold when I got it home')]),
    asked_at: daysAgoIso(2, 3, 0), answered_at: daysAgoIso(2, 3, 25),
    alert: "Liam said his takeout was cold when he got it home, and he said \"again\", so it's not the first time for him. I said sorry and offered him his next order on us, and he didn't post anything public.",
    fix: 'Check how takeout is packed on busy nights, maybe insulated bags or holding the order until the driver is at the door.' }),
  G('G02', 'Owen Brooks', daysAgoIso(1, 3, 10), 'dine-in', 2, 'short rib and panna cotta', {
    status: 'happy', stars: 5, comment: 'Loved it. That panna cotta.', topics: JSON.stringify([T('food', 'positive', 'panna cotta')]),
    asked_at: daysAgoIso(1, 4, 0), answered_at: daysAgoIso(1, 4, 12) }),
  G('G03', 'Nora Bishop', daysAgoIso(0, Math.max(0, new Date().getUTCHours() - 2), 5), 'dine-in', 2, 'short rib and fig flatbread'),
  G('G04', 'Ethan Ward', daysAgoIso(0, Math.max(0, new Date().getUTCHours() - 2), 20), 'takeout', 1, 'mushroom pappardelle'),
  G('G05', 'Maya Chen', daysAgoIso(0, Math.max(0, new Date().getUTCHours() - 1), 0), 'dine-in', 4, 'a birthday dinner with the tasting menu'),
  G('G06', 'Lucas Romero', daysAgoIso(0, Math.max(0, new Date().getUTCHours() - 1), 15), 'dine-in', 2, 'lamb meatballs and the roasted carrots'),
].map((json) => ({ json }));

//@ seed-messages
// The text threads that already happened with Liam and Owen.
const g = Object.fromEntries($('Demo guests').all().map((i) => [i.json.guest_id, i.json]));
const M = (guest_id, direction, at, body) => ({ guest_id, direction, at, body });
return [
  M('G01', 'out', g.G01.asked_at, "Hey Liam, it's Sam from Little Fig, thanks a lot for ordering with us tonight, and I hope the chicken thighs and carrots hit the spot. If you have a second, how was everything from 1 to 5? Just reply here, honestly any feedback really helps us."),
  M('G01', 'in', g.G01.answered_at, '2. Food was cold when I got it home. Again.'),
  M('G01', 'out', g.G01.answered_at, "I'm really sorry Liam, that's not okay, and hearing it's happened before makes it worse, so thank you for telling me straight. Your next order is on me, just mention this message, and I'm looking at how we pack takeout so it gets to you hot."),
  M('G02', 'out', g.G02.asked_at, "Hey Owen, it's Sam from Little Fig, thanks so much for coming in tonight, and I hope the short rib was as good as it usually is. If you have a second, how was everything from 1 to 5? Just reply here, honestly any feedback really helps us."),
  M('G02', 'in', g.G02.answered_at, '5. Loved it. That panna cotta.'),
  M('G02', 'out', g.G02.answered_at, `That honestly made my night Owen, thank you, and I'll tell the kitchen about the panna cotta. If you have a minute, a short review here would really help a small place like ours: ${CFG.reviewLink}`),
].map((json) => ({ json }));
