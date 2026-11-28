const { open } = require('./lib');
(async () => {
  const T = await open();
  const ids = await T.ev(() => window.__ashen.Game && Array.from(document.querySelectorAll('x')).length || null).catch(()=>null);
  const modes = await T.ev(() => { const m = []; try { const s = window.__ashen; } catch(e){} return null; });
  // read MODES via Flow.start attempt list from Save? fall back to hard-coded list from config text
  const list = await T.ev(() => window.__ashen.MODES.map(m => m.id));
  console.log('modes', list.join(','));
  for (const id of list) {
    await T.ev(i => { const A = window.__ashen; try { A.Flow.start(i, {}); } catch (e) { console.error('START FAIL ' + i + ' ' + e.message); } }, id);
    await T.wait(2500);
    // drive: move around, push through any overlay with Enter
    for (let k = 0; k < 6; k++) { await T.key(k % 2 ? 'ArrowRight' : 'ArrowLeft', 300); await T.key('Enter', 60); }
    await T.ev(() => { const G = window.__ashen.Game; if (G.run) { G.run.__t = 1; } });
    const s = await T.state(); console.log(id, JSON.stringify(s));
    if (s.crashed) break;
  }
  await T.done();
})();
