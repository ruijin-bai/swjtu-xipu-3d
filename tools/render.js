const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [,, outDir, w, h, fps, from, to] = process.argv;
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///home/user/swjtu-twin/西南交大犀浦校区数字孪生.html?video=1');
  await p.waitForFunction('window.__ready===true');
  const len = await p.evaluate('window.__videoLen');
  const total = Math.round(len * fps), a = +(from||0), z = Math.min(total, +(to||total));
  const t0 = Date.now();
  for (let i = a; i < z; i++) {
    await p.evaluate(t => window.__frame(t), i / fps);
    await p.screenshot({ path: `${outDir}/f${String(i).padStart(5,'0')}.jpg`, type: 'jpeg', quality: 92 });
    if (i % 60 === 0) console.log('frame', i, '/', total, ((Date.now()-t0)/(i-a+1)).toFixed(0), 'ms/frame');
  }
  console.log('done', z - a, 'frames in', ((Date.now()-t0)/1000).toFixed(0), 's');
  await b.close();
})();
