const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto('file:///home/user/swjtu-twin/西南交大犀浦校区数字孪生.html');
  await p.waitForFunction('window.__ready===true');
  // 夜晚 + 热力 + 选中图书馆
  await p.evaluate(()=>{document.getElementById('slider').value=20.5*60;document.getElementById('slider').dispatchEvent(new Event('input'));document.querySelectorAll('#mode button')[1].click();});
  await p.fill('#search','图书馆'); await p.click('#results div');
  await p.waitForTimeout(5000);
  await p.screenshot({ path: process.argv[2] });
  await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(2500);
  await p.screenshot({ path: process.argv[3] });
  await b.close();
})();
