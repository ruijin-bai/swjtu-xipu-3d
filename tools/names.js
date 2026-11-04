const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  await p.goto('file:///home/user/swjtu-twin/西南交大犀浦校区数字孪生.html?video=1');
  await p.waitForFunction('window.__ready===true',null,{timeout:180000});
  const r = await p.evaluate(()=>{const out=[];scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.alphaTest===.4)out.push([o.position.x.toFixed(0),o.position.y.toFixed(1),o.position.z.toFixed(0),o.geometry.parameters.width.toFixed(1),o.geometry.parameters.height.toFixed(1)]);});return out;});
  console.log(r.length, JSON.stringify(r.slice(0,12)));
  await b.close();
})();
