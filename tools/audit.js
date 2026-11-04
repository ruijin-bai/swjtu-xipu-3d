const { chromium } = require('playwright');
(async () => {
  const [,, out, w, h, views] = process.argv;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h }, hasTouch: +w < 500, isMobile: +w < 500 });
  const errs=[]; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error'||m.type()==='warning') errs.push(m.type()+': '+m.text().slice(0,200)); });
  await p.goto('file:///home/user/swjtu-twin/西南交大犀浦校区数字孪生.html?video=1');
  await p.waitForFunction('window.__ready===true',null,{timeout:180000});
  let i=0; for (const v of JSON.parse(views)) { await p.evaluate(v=>{window.__shot(v);occT=0;for(let k=0;k<25;k++)updateLabels();}, v); await p.screenshot({ path: `${out}_${i++}.jpg`, type:'jpeg', quality:85 }); }
  console.log(errs.filter(e=>!/deprecated|GPU stall|ReadPixels/.test(e)).slice(0,10).join('\n')||'no errors'); await b.close();
})();
