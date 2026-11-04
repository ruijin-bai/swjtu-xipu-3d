const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/user/swjtu-twin/西南交大犀浦校区数字孪生.html?video=1');
  await p.waitForFunction('window.__ready===true',null,{timeout:180000});
  const views=[{"x":-60,"z":-200,"r":420,"th":-0.4,"ph":1.12,"y":15},{"x":-60,"z":-200,"r":420,"th":1.2,"ph":1.0,"y":15},{"x":-60,"z":-200,"r":420,"th":2.6,"ph":0.6,"y":15}];
  let i=0; for (const v of views) { await p.evaluate(v=>{window.__shot(v);occT=0;for(let k=0;k<20;k++)updateLabels();}, v); await p.screenshot({ path: `${process.argv[2]}_${i++}.jpg`, type:'jpeg', quality:85 }); }
  console.log(errs.join('\n')||'no errors'); await b.close();
})();
