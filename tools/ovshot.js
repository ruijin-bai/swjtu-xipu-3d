const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__ready===true');
  await p.evaluate(([x,z,r])=>{flyTo(x,z,r,1.1);}, JSON.parse(process.argv[4]));
  await p.waitForTimeout(6000); await p.screenshot({ path: process.argv[3] }); console.log(errs.join('\n')||'no errors'); await b.close();
})();
