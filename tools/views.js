const { chromium } = require('playwright');
(async () => {
  const views = JSON.parse(process.argv[3]);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 960, height: 600 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/user/swjtu-twin/西南交大犀浦校区数字孪生.html?video=1');
  await p.waitForFunction('window.__ready===true');
  let i=0;
  for (const v of views) {
    await p.evaluate(v=>{ window.__frame(v.t||10); ctl.target.set(v.x,v.y||0,v.z); ctl.r=v.r; ctl.th=v.th; ctl.ph=v.ph; applyCam(); applyTime(v.h||15.5); viewMode=0; updateState(v.h||15.5); document.body.classList.add('video'); document.getElementById('cap').style.display='none'; document.getElementById('vkpi').style.display='none'; renderer.render(scene,camera); updateLabels(); }, v);
    await p.screenshot({ path: `${process.argv[2]}_${i++}.jpg`, type:'jpeg', quality:85 });
  }
  console.log(errs.join('\n')||'no errors'); await b.close();
})();
