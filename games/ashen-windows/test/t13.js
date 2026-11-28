// 1.3: The Long Walk puzzle pieces. A bot plays a short level built from each piece on its own and must reach the exit.
const { open } = require('./lib');
const PIECES = process.argv[2] ? process.argv[2].split(',') : ['crateWall', 'lever', 'plate', 'mover', 'water', 'collapse', 'elevator', 'debris', 'searchlight', 'tunnel', 'dog'];
(async () => {
  const T = await open();
  await T.ev(() => {
    const A = window.__ashen, G = A.Game, I = A.Input; I._st0 = I.state;
    I.state = function (d) {
      const st = I._st0.call(I, d), sc = G.scene; if (!sc || !sc.L || !sc.P || G.name !== 'Walk') return st;
      const P = sc.P, L = sc.L, f = P.x + 14, b = sc.bot || (sc.bot = { stuck: 0, lx: 0 });
      let mx = 1, jump = false;
      // wait for a moving platform at a pit edge, and ride it to the far side
      for (const m of L.movers) if (m.ay === m.by) {
        if (P.ride === m) { mx = m.x + m.w > m.bx + m.w - 6 ? 1 : 0; if (mx) jump = true; }
        else if (P.on && f < m.ax && f > m.ax - 40) { mx = Math.abs(m.x - m.ax) < 6 ? 1 : 0; }
      } else if (P.ride === m) mx = m.y < m.by + 4 ? 1 : 0;
      // stop for falling rubble
      for (const r of L.debris) if ((r.st === 'warn' || r.st === 'fall') && r.x > P.x - 10 && r.x < P.x + 140) mx = 0;
      // searchlight: wait under a roof until the beam has passed and is heading away
      for (const lt of L.lights) if (P.x > lt.x0 - 30 && P.x < lt.x1 && lt.bx != null) {
        const dir = Math.sign(lt.bx - (lt.pbx == null ? lt.bx : lt.pbx)); lt.pbx = lt.bx;
        const roof = L.solids.find(r => r.h <= 20 && r.y < 420 && P.x + 7 > r.x + 10 && P.x + 7 < r.x + r.w - 10);
        if (roof && !(lt.bx < P.x - 20 && dir < 0)) mx = 0;
      }
      // pull levers
      st.press.interact = L.levers.some(q => !q.on && Math.abs(q.x - P.x - 7) < 20);
      // gaps, spikes, ledges
      if (mx > 0 && P.on && (L.pits.some(p => !L.movers.some(m => m.ax >= p.x - 4 && m.ax <= p.x + p.w) && !L.falls.some(q => q.x >= p.x && q.x < p.x + p.w) && f + 6 > p.x && P.x < p.x) || L.spikes.some(s => f + 12 > s.x && P.x < s.x))) jump = true;
      if (mx > 0 && P.on && Math.abs(P.x - b.lx) < 0.3) { b.stuck += 1; if (b.stuck > 6) { jump = true; b.stuck = 0; } } else b.stuck = 0;
      b.lx = P.x;
      st.mx = mx; st.held.jump = jump || P.vy < 0; st.press.jump = jump; return st;
    };
  });
  const res = {};
  for (const pc of PIECES) {
    await T.ev(pc => window.__ashen.Game.go('Walk', { lvl: 12, only: [pc, pc === 'water' ? 'mover' : 'gap'] }), pc);
    let r; for (let k = 0; k < 60; k++) { await T.wait(500); r = await T.ev(() => { const G = window.__ashen.Game, sc = G.scene; return { scene: G.name, x: sc.P ? Math.round(sc.P.x) : null, deaths: sc.deaths, last: sc.lastDeath }; }); if (r.scene !== 'Walk') break; }
    res[pc] = r.scene !== 'Walk' ? 'cleared' + (r.deaths ? '' : '') : 'stuck at ' + r.x + ' ' + JSON.stringify(r.last) + ' deaths ' + r.deaths;
    console.log(pc, res[pc]);
  }
  await T.done();
})();
