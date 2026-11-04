/* ---------------- 校门（按参考照片程序化建模） ---------------- */
function textTex(txt,bg,fg,w=1024,h=200,font='"STKaiti","KaiTi","AR PL UKai CN","WenQuanYi Zen Hei",serif'){
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  x.fillStyle=bg;x.fillRect(0,0,w,h);x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=6;x.strokeRect(8,8,w-16,h-16);
  x.fillStyle=fg;x.font=`bold ${Math.round(h*.58)}px ${font}`;x.textAlign='center';x.textBaseline='middle';
  const chars=[...txt], step=Math.min(h*.78,(w-80)/chars.length); chars.forEach((ch,i)=>x.fillText(ch,w/2+(i-(chars.length-1)/2)*step,h/2+4));
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
function stoneTex(hex){ // 石块分缝纹理
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');const base=new THREE.Color(hex);
  for(let r=0;r<8;r++)for(let k=0;k<4;k++){const off=(r%2)*32;const v=1.12+Math.random()*.22;x.fillStyle=`rgb(${base.r*255*v|0},${base.g*255*v|0},${base.b*255*v|0})`;x.fillRect(k*64-off,r*32,64,32);x.fillRect(k*64-off+256,r*32,64,32);}
  x.strokeStyle='rgba(0,0,0,.28)';x.lineWidth=2;for(let r=0;r<=8;r++){x.beginPath();x.moveTo(0,r*32);x.lineTo(256,r*32);x.stroke();for(let k=0;k<5;k++){const xx=k*64-(r%2)*32;x.beginPath();x.moveTo(xx,r*32);x.lineTo(xx,r*32+32);x.stroke();}}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;}
const firstText=s=>(s||'').split(/[（(]/)[0].trim();
function gateGroup(g){ // 局部坐标：x 沿门长轴，+z 为正面朝向
  const grp=new THREE.Group(); grp.position.set(g.c[0],0,g.c[1]);
  const br=g.bearing*Math.PI/180; grp.rotation.y=Math.atan2(Math.sin(br),-Math.cos(br));
  scene.add(grp); return grp;
}
function boxUV(w,h,d,rep){const g=new THREE.BoxGeometry(w,h,d);const uv=g.attributes.uv;const n=g.attributes.normal;
  for(let i=0;i<uv.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));const sx=ax>.5?d:w, sy=ay>.5?d:h;uv.setXY(i,uv.getX(i)*sx/rep,uv.getY(i)*sy/rep);}return g;}
function archGate(g){
  const grp=gateGroup(g), W=22, D=g.d||4;
  const st=stoneTex(g.color||'#7b614f');
  const M=new THREE.MeshStandardMaterial({color:0xffffff,map:st,roughness:.85});
  const M2=new THREE.MeshStandardMaterial({color:g.color2||'#6c584b',roughness:.8});
  // 立面轮廓（含两级翼墙）
  const sh=new THREE.Shape();
  sh.moveTo(-11,0);sh.lineTo(-11,5.2);sh.quadraticCurveTo(-9.5,5.6,-8.2,7.6);sh.lineTo(-6.6,8.4);sh.lineTo(-6.6,11);
  sh.lineTo(6.6,11);sh.lineTo(6.6,8.4);sh.lineTo(8.2,7.6);sh.quadraticCurveTo(9.5,5.6,11,5.2);sh.lineTo(11,0);sh.lineTo(-11,0);
  const arch=(cx,w,h)=>{const p=new THREE.Path();const r=w/2;p.moveTo(cx-r,0);p.lineTo(cx-r,h-r);p.absarc(cx,h-r,r,Math.PI,0,true);p.lineTo(cx+r,0);p.lineTo(cx-r,0);return p;};
  sh.holes.push(arch(0,6.5,8.6),arch(-8.6,2.4,4.7),arch(8.6,2.4,4.7));
  const body=new THREE.ExtrudeGeometry(sh,{depth:D,bevelEnabled:false});body.translate(0,0,-D/2);
  {const uv=body.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/2.2,uv.getY(i)/2.2);}
  const bm=new THREE.Mesh(body,M);bm.castShadow=bm.receiveShadow=true;grp.add(bm);
  // 拱券石（拱心石）
  for(const [cx,w,h,ks] of [[0,6.5,8.6,1],[-8.6,2.4,4.7,.6],[8.6,2.4,4.7,.6]]){
    const r=w/2+.35, tor=new THREE.Mesh(new THREE.TorusGeometry(r,.32,6,24,Math.PI),M2);tor.position.set(cx,h-w/2,D/2+.05);grp.add(tor);
    const t2=tor.clone();t2.position.z=-D/2-.05;grp.add(t2);
    for(const z of [D/2+.1,-D/2-.1]){const k=new THREE.Mesh(new THREE.BoxGeometry(.7*ks+.3,1.1*ks+.3,.4),M2);k.position.set(cx,h+.25,z);grp.add(k);}
  }
  // 成对托斯卡纳圆柱（正反面各 4 根）
  const colG=new THREE.CylinderGeometry(.38,.44,9.2,16);
  for(const z of [D/2+.45,-D/2-.45])for(const x of [-5.95,-4.55,4.55,5.95]){
    const c=new THREE.Mesh(colG,M);c.position.set(x,4.9,z);c.castShadow=true;grp.add(c);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(1.05,.4,1.05),M2);cap.position.set(x,9.7,z);grp.add(cap);
    const base=new THREE.Mesh(new THREE.BoxGeometry(1.05,.5,1.05),M2);base.position.set(x,.25,z);grp.add(base);
  }
  // 檐口、阁楼层、阶梯压顶、端墩
  const add=(w,h,d,x,y,m=M)=>{const o=new THREE.Mesh(boxUV(w,h,d,2.2),m);o.position.set(x,y,0);o.castShadow=true;grp.add(o);return o;};
  add(14.8,.55,D+1.7,0,11.25,M2);
  const attic=add(13.4,2.1,D+.6,0,12.6);
  add(8.4,.8,D+.2,0,14.05,M2); add(5.6,.5,D,0,14.7,M2);
  for(const x of [-5.25,5.25]) add(2.1,1.3,D+.4,x,14.3);
  for(const x of [-5.25,5.25]) for(const z of [D/2+.32,-D/2-.32]){const o=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.12,20),M2);o.rotation.x=Math.PI/2;o.position.set(x,12.6,z);grp.add(o);} // 校徽浮雕
  // 匾额
  const front=firstText(g.text.front)||'交通大學', back=firstText(g.text.back)||'唐山路礦學堂';
  const pf=new THREE.Mesh(new THREE.PlaneGeometry(7.2,1.45),new THREE.MeshStandardMaterial({map:textTex(front,'#ecebe6','#2a2620'),roughness:.6}));pf.position.set(0,12.6,D/2+.32);grp.add(pf);
  const pb=new THREE.Mesh(new THREE.PlaneGeometry(7.2,1.45),new THREE.MeshStandardMaterial({map:textTex(back,'#e6e6e2','#1e1e1e'),roughness:.6}));pb.position.set(0,12.6,-D/2-.32);pb.rotation.y=Math.PI;grp.add(pb);
  // 旗杆、岗亭
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,6,8),new THREE.MeshStandardMaterial({color:0xdddddd,metalness:.6,roughness:.3}));pole.position.set(0,17.9,0);grp.add(pole);
  const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.2),new THREE.MeshStandardMaterial({color:0xd8262b,side:THREE.DoubleSide}));flag.position.set(.95,20.2,0);grp.add(flag);
  const booth=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,2.6,16),new THREE.MeshStandardMaterial({color:0x8f9497,roughness:.5}));booth.position.set(0,1.3,0);grp.add(booth);
  return grp;
}
function towerGate(g){
  const grp=gateGroup(g); const st=stoneTex(g.color||'#b3a99c');
  const M=new THREE.MeshStandardMaterial({map:st,roughness:.85}), M2=new THREE.MeshStandardMaterial({color:g.roof||'#7c8386',roughness:.7});
  for(const x of [-12,12]){
    const t=new THREE.Mesh(boxUV(4.2,12,4.2,2),M);t.position.set(x,6.6,0);t.castShadow=true;grp.add(t);
    const base=new THREE.Mesh(new THREE.BoxGeometry(5,1.2,5),new THREE.MeshStandardMaterial({color:g.color2||'#7b7264'}));base.position.set(x,.6,0);grp.add(base);
    const cor=new THREE.Mesh(new THREE.BoxGeometry(5,.7,5),M2);cor.position.set(x,12.95,0);grp.add(cor);
    const niche=new THREE.Mesh(new THREE.PlaneGeometry(1.8,4.5),new THREE.MeshStandardMaterial({color:0x8d8477}));niche.position.set(x,6.5,2.12);grp.add(niche);
  }
  const stone=new THREE.Mesh(new THREE.BoxGeometry(7,1.8,1.2),[...Array(4)].map(()=>new THREE.MeshStandardMaterial({color:0x8b3a32,roughness:.5})).concat([new THREE.MeshStandardMaterial({map:textTex('西南交通大學','#8b3a32','#e9c46a')}),new THREE.MeshStandardMaterial({color:0x8b3a32})]));
  stone.position.set(0,1.4,0);stone.castShadow=true;grp.add(stone);
  return grp;
}
const GATES=(D.gates||[]).map(g=>({g,obj:/三拱|凯旋/.test(g.form)?archGate(g):towerGate(g)}));
/* ---------------- 图书馆柱廊 ---------------- */
for(const b of B){
  if(!b.colonnade) continue; const cl=b.colonnade, fb=cl.facing_deg*Math.PI/180, fx=Math.sin(fb), fz=-Math.cos(fb), spread=Math.cos((cl.spread_deg||60)*Math.PI/180);
  const p=b.p; let area2=0; for(let i=0,j=p.length-1;i<p.length;j=i++) area2+=p[j][0]*p[i][1]-p[i][0]*p[j][1];
  const segs=[]; let L=0;
  for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length];let dx=c[0]-a[0],dz=c[1]-a[1];const l=Math.hypot(dx,dz);if(l<1)continue;
    let nx=dz/l,nz=-dx/l; if(area2<0){nx=-nx;nz=-nz;}
    if(nx*fx+nz*fz>spread){segs.push({a,c,l,nx,nz});L+=l;}}
  if(!segs.length) continue;
  const geo=new THREE.CylinderGeometry(.42,.42,b.h-1.5,12), mat=new THREE.MeshStandardMaterial({color:cl.color||'#d3cec3',roughness:.5});
  const im=new THREE.InstancedMesh(geo,mat,cl.count); const Mx=new THREE.Matrix4();
  for(let k=0;k<cl.count;k++){let s=(k+.5)/cl.count*L;let sg=segs[0];for(const q of segs){if(s<=q.l){sg=q;break;}s-=q.l;}
    const t=Math.min(1,s/sg.l);Mx.makeTranslation(sg.a[0]+(sg.c[0]-sg.a[0])*t+sg.nx*2.2,(b.h-1.5)/2,sg.a[1]+(sg.c[1]-sg.a[1])*t+sg.nz*2.2);im.setMatrixAt(k,Mx);}
  im.castShadow=true; scene.add(im);
  // 出挑檐板
  const slab=new THREE.Mesh(ribbon(segs.map(q=>({p:[[q.a[0]+q.nx*1.6,q.a[1]+q.nz*1.6],[q.c[0]+q.nx*1.6,q.c[1]+q.nz*1.6]],w:5})),0),new THREE.MeshStandardMaterial({color:0xf1efea,side:THREE.DoubleSide}));
  slab.position.y=b.h-.6; slab.castShadow=true; scene.add(slab);
}
