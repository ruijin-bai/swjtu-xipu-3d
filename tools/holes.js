const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  await p.goto('file:///home/user/swjtu-twin/西南交大犀浦校区数字孪生.html?video=1');
  await p.waitForFunction('window.__ready===true',null,{timeout:180000});
  const r = await p.evaluate(() => {
    const out=[];
    const area=pts=>{let s=0;for(let i=0,j=pts.length-1;i<pts.length;j=i++)s+=pts[j][0]*pts[i][1]-pts[i][0]*pts[j][1];return Math.abs(s)/2;};
    for (const b of B) {
      const check=(poly,holes,tag)=>{
        const sh=shapeOf(poly,holes); const g=new THREE.ShapeGeometry(sh); const P=g.attributes.position, I=g.index;
        let tri=0; for(let i=0;i<I.count;i+=3){const a=I.getX(i),c=I.getX(i+1),d=I.getX(i+2);tri+=Math.abs((P.getX(c)-P.getX(a))*(P.getY(d)-P.getY(a))-(P.getX(d)-P.getX(a))*(P.getY(c)-P.getY(a)))/2;}
        const want=area(poly)-(holes||[]).reduce((s,h)=>s+area(h),0);
        if(Math.abs(tri-want)>Math.max(5,want*.02)) out.push({id:b.id,name:b.name,tag,want:Math.round(want),tri:Math.round(tri),n:poly.length,holes:(holes||[]).length});
      };
      check(b.p,b.holes,'base'); (b.parts||[]).forEach((q,i)=>check(q.p,[],'part'+i));
      if((b.holes||[]).length) out.push({id:b.id,name:b.name,tag:'HAS_COURTYARD',holes:b.holes.length,holeArea:Math.round(b.holes.reduce((s,h)=>s+area(h),0)),area:b.area});
    }
    return out;
  });
  console.log(JSON.stringify(r,null,0).replace(/},{/g,'},\n{'));
  await b.close();
})();
