const { chromium } = require('playwright');
(async () => {
  const [,, file, out, w='1600', h='900', q=''] = process.argv;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error'||m.type()==='warning') errs.push(m.type()+': '+m.text().slice(0,200)); });
  await p.goto('file://' + file + q);
  await p.waitForFunction('window.__ready===true', null, { timeout: 120000 });
  await p.waitForTimeout(4000);
  await p.screenshot({ path: out });
  console.log(errs.filter(e=>!e.includes('deprecated')).join('\n') || 'no errors');
  await b.close();
})();
