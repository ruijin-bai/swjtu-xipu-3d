const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 960, height: 600 } });
  await p.goto('file:///home/user/swjtu-twin/西南交大犀浦校区数字孪生.html?video=1');
  await p.waitForFunction('window.__ready===true',null,{timeout:180000});
  const ns = await p.evaluate(()=>{const out=[];scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.alphaTest===.4){const d=new THREE.Vector3(0,0,1).applyQuaternion(o.quaternion);out.push({x:o.position.x,y:o.position.y,z:o.position.z,th:Math.atan2(d.x,d.z),h:o.geometry.parameters.height});}});return out;});
  const pick=[0,1,11];
  for (const [k,i] of pick.entries()) { const n=ns[i]; await p.evaluate(n=>{window.__shot({x:n.x,y:n.y*.8,z:n.z,r:Math.max(35,n.h*5),th:n.th,ph:1.45,h:15.5,wx:'sunny'});occT=0;for(let k=0;k<20;k++)updateLabels();},n); await p.screenshot({path:`${process.argv[2]}_${k}.jpg`,type:'jpeg',quality:85}); }
  await b.close();
})();
