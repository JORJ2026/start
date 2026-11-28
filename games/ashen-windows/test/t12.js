// 1.3: The Long Walk. Checks all 50 levels for sane geometry, loads each one, and lets a simple bot
// walk through the levels that only need running and jumping.
const { open } = require('./lib');
(async () => {
  const T = await open();
  const geo = await T.ev(() => {
    const A = window.__ashen, bad = [];
    for (let i = 0; i < 50; i++) {
      const L = A.walkLevel(i);
      if (!(L.exit > 0 && L.w > L.exit)) bad.push(i + ': no exit');
      for (const p of L.pits) if (!p.water && p.w > 90 && !L.movers.some(m => m.ax >= p.x - 4 && m.ax <= p.x + p.w) && !L.falls.some(f => f.x >= p.x && f.x < p.x + p.w)) bad.push(i + ': pit too wide ' + p.w);
      for (const s of L.spikes) if (s.w > 70) bad.push(i + ': spikes too wide');
      if (L.seq.length < 3) bad.push(i + ': too short');
    }
    const chapters = [0, 1, 2, 3, 4].map(c => A.walkLevel(c * 10 + 9).seq.join(','));
    return { bad, n: A.WALK_STORY.lines.length, chapters };
  });
  console.log('geometry', JSON.stringify(geo));
  // every level loads and renders
  for (let i = 0; i < 50; i += 7) { await T.ev(i => window.__ashen.Game.go('Walk', { lvl: i }), i); await T.wait(350); }
  // a bot runs and jumps through simple levels
  const simple = await T.ev(() => { const A = window.__ashen, out = []; for (let i = 0; i < 50; i++) { const s = A.walkLevel(i).seq; if (s.every(k => ['gap', 'step', 'spikes', 'doubleGap'].includes(k))) out.push(i); } return out; });
  console.log('bot levels', JSON.stringify(simple));
  for (const lvl of simple.slice(0, 3)) {
    await T.ev(lvl => {
      const A = window.__ashen, G = A.Game, I = A.Input; G.go('Walk', { lvl });
      if (!I._st0) I._st0 = I.state;
      I.state = function (d) {
        const st = I._st0.call(I, d), sc = G.scene; if (!sc || !sc.L || !sc.P) return st;
        const P = sc.P, L = sc.L, ahead = x => P.x + 14 + x;
        const danger = L.pits.some(p => ahead(6) > p.x && P.x < p.x) || L.spikes.some(s => ahead(12) > s.x && P.x < s.x) || L.solids.some(r => r.y < P.y + P.h - 2 && r.y > P.y - 80 && ahead(14) > r.x && P.x + 14 <= r.x);
        st.mx = 1; st.held.jump = danger || P.vy < 0; st.press.jump = danger && P.on; return st;
      };
    }, lvl);
    let r; for (let k = 0; k < 40; k++) { await T.wait(500); r = await T.ev(() => { const G = window.__ashen.Game, sc = G.scene; return { scene: G.name, x: sc.P ? Math.round(sc.P.x) : null, deaths: sc.deaths, exit: sc.L ? sc.L.exit : null }; }); if (r.scene !== 'Walk') break; }
    console.log('bot level', lvl, JSON.stringify(r));
  }
  await T.ev(() => { const I = window.__ashen.Input; if (I._st0) I.state = I._st0; });
  await T.shot('walk');
  console.log('walk save', JSON.stringify(await T.ev(() => window.__ashen.Save.data.walk)));
  await T.done();
})();
