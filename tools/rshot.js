const { chromium } = require('playwright');
(async () => {
  const views = JSON.parse(process.argv[3]);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,300)); });
  await p.goto('file:///home/user/swjtu-twin/西南交大犀浦校区数字孪生.html?video=1');
  await p.waitForFunction('window.__ready===true',null,{timeout:180000});
  let i=0; for (const v of views) { await p.evaluate(v=>window.__shot(v), v); await p.screenshot({ path: `${process.argv[2]}_${i++}.jpg`, type:'jpeg', quality:88 }); }
  console.log(errs.join('\n')||'no errors'); await b.close();
})();
