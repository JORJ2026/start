const { open } = require('./lib');
(async () => {
  const T = await open();
  const seq = [['endless','win'],['endless','collapse'],['story','win'],['door','win']];
  for (const [id, kind] of seq) {
    await T.ev(i => window.__ashen.Flow.start(i, {}), id); await T.wait(1200);
    await T.ev(k => window.__ashen.Flow.endRun(k), kind);
    for (let n=0;n<6;n++){ await T.wait(2200); console.log(id, kind, JSON.stringify(await T.state()).slice(0,60)); await T.key('Enter',80); await T.key('Enter',80); if ((await T.state()).scene==='Results') break; }
    await T.shot('res_'+id+'_'+kind);
    await T.key('Enter',100); await T.wait(1500);
    console.log(' after play-again:', JSON.stringify(await T.state()));
  }
  await T.done();
})();
