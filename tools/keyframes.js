const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///home/user/swjtu-twin/西南交大犀浦校区数字孪生.html?video=1');
  await p.waitForFunction('window.__ready===true');
  for (const t of [3, 10, 17, 24, 32, 39]) { await p.evaluate(t => window.__frame(t), t); await p.screenshot({ path: `${process.argv[2]}/k${t}.jpg`, type:'jpeg', quality:80 }); }
  await b.close();
})();
