/* Anel em 3D. Medidas em milimetros. O aro e um perfil varrido ao longo do contorno frontal; a cabeca tem assento, garras, coroa, galeria e halo. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const palco=document.getElementById('palco');
let renderer;
try{ renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); }
catch(e){ palco.innerHTML='<p class="sem-3d">Este aparelho não mostra o anel em 3D, mas você pode montar e pedir normalmente: o resumo vai junto com o pedido.</p>'; window.PZ.foto=()=>null; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
renderer.outputColorSpace=THREE.SRGBColorSpace;
palco.prepend(renderer.domElement);
document.getElementById('carregando-3d').remove();

const cena=new THREE.Scene();
cena.background=new THREE.Color(0xf3f3f0);           // fundo claro: a pedra refrata luz, nao escuro
const pmrem=new THREE.PMREMGenerator(renderer);
cena.environment=pmrem.fromScene(new RoomEnvironment(),0.03).texture;
cena.environmentIntensity=1.1;
const luzA=new THREE.DirectionalLight(0xffffff,2.2); luzA.position.set(25,60,45); cena.add(luzA); luzA.layers.enableAll();
const luzB=new THREE.DirectionalLight(0xfff3e6,1.1); luzB.position.set(-45,25,-15); cena.add(luzB); luzB.layers.enableAll();
{ const h=new THREE.HemisphereLight(0xffffff,0xd8d4cc,0.8); h.layers.enableAll(); cena.add(h); }

const camera=new THREE.PerspectiveCamera(26,1,1,500);
const ALVO=new THREE.Vector3(0,1.2,0);
const controles=new OrbitControls(camera,renderer.domElement);
controles.target.copy(ALVO); controles.enableDamping=true; controles.dampingFactor=.08; controles.enablePan=false;
controles.minDistance=40; controles.maxDistance=140; controles.minPolarAngle=0.35; controles.maxPolarAngle=Math.PI/2+0.08;
const dica=document.getElementById('dica-giro');
let mexeu=false, t0=performance.now();
controles.addEventListener('start',()=>{ mexeu=true; dica.style.opacity='0'; });
const semMovimento=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- materiais ---------- */
const OURO={branco:new THREE.MeshPhysicalMaterial({color:0xf1f1ef,metalness:1,roughness:.13,envMapIntensity:2.1,clearcoat:.5,clearcoatRoughness:.08}),
            amarelo:new THREE.MeshPhysicalMaterial({color:0xf7c977,metalness:1,roughness:.15,envMapIntensity:2.1,clearcoat:.5,clearcoatRoughness:.08}),
            rose:new THREE.MeshPhysicalMaterial({color:0xf2b9a3,metalness:1,roughness:.15,envMapIntensity:2.1,clearcoat:.5,clearcoatRoughness:.08})};
const estudioPedra=(()=>{ const c=new THREE.Scene(); c.background=new THREE.Color(0x8a8b92);
  const luz=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}), sombraP=new THREE.MeshBasicMaterial({color:0x2a2a2e,side:THREE.DoubleSide});
  for(let i=0;i<18;i++){ const a=i/18*Math.PI*2, f=new THREE.Mesh(new THREE.PlaneGeometry(i%2?1.2:2.2,i%3===2?3:9),i%3===2?sombraP:luz);
    f.position.set(Math.cos(a)*6,(i%3-1)*2.2,Math.sin(a)*6); f.lookAt(0,0,0); c.add(f); }
  const topo=new THREE.Mesh(new THREE.CircleGeometry(3.5,32),luz); topo.position.y=7; topo.lookAt(0,0,0); c.add(topo);
  return pmrem.fromScene(c,0).texture; })();
const DIAMANTE=new THREE.MeshPhysicalMaterial({color:0xf6f8fc,metalness:.55,roughness:.03,envMap:estudioPedra,envMapIntensity:1.6,flatShading:true,clearcoat:1,clearcoatRoughness:0,
  iridescence:.35,iridescenceIOR:1.9});
const MELEE=new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:1,roughness:0,envMap:estudioPedra,envMapIntensity:1.85,flatShading:true});

/* lapidacao brilhante: coroa (mesa, estrelas, bezels) e pavilhao em aneis de 16 faces */
function brilhante(d,lados=16){
  const r=d/2, P=[[0.001,-0.43*d],[0.42*r,-0.25*d],[r,-0.008*d],[r,0.018*d],[0.8*r,0.1*d],[0.56*r,0.165*d],[0.001,0.165*d]];
  const g=new THREE.LatheGeometry(P.map(([x,y])=>new THREE.Vector2(x,y)),lados); g.computeVertexNormals(); return g;
}

/* ---------- aro: por dentro sempre redondo (o dedo), por fora no contorno escolhido ---------- */
const RI=8.65, N_ARO=480;                            // aro 14: 17,3 mm de diametro interno
const modulo=(a,m)=>((a%m)+m)%m;
/* raio do contorno de fora numa direcao (th = angulo a partir do centro, topo = 90 graus) */
function raioFora(tipo,th,base){
  const c=Math.cos(th), s=Math.sin(th);
  if(tipo==='sextavado') return base/Math.cos(modulo(th+Math.PI/6,Math.PI/3)-Math.PI/6);   // lados retos na vertical, "V" em cima e embaixo
  if(tipo==='quadrado'){ const n=4.5; return base*Math.pow(Math.abs(c)**n+Math.abs(s)**n,-1/n); }  // quadrado de cantos suaves
  if(tipo==='abaulado'){ const k=1.4, r1=base/Math.max(Math.abs(c),1e-6);                  // laterais retas, topo e base em meia-lua
    return Math.abs(r1*s)<=k? r1 : k*Math.abs(s)+Math.sqrt(base*base-k*k*c*c); }
  return base;
}
/* secao do fio: superelipse (bordas suaves); arredondada no redondo/ombros, mais reta nos facetados */
function secao(tipo,M=32){
  const n=(tipo==='redondo'||tipo==='ombros')?2.6:5.5, s=[];
  for(let j=0;j<M;j++){ const a=j/M*Math.PI*2, c=Math.cos(a), sn=Math.sin(a);
    s.push([0.5+0.5*Math.sign(c)*Math.abs(c)**(2/n), 0.5*Math.sign(sn)*Math.abs(sn)**(2/n)]); }  // u: 0 = dedo, 1 = fora; v: largura
  return s;
}
function aro(cfg){
  const tipo=cfg.aro, redondo=tipo==='redondo'||tipo==='ombros', comPave=cfg.pave, est=cfg.estilo||'classico';
  const wS=(cfg.wS||1)*(est==='largo'?1.5:1), tS=cfg.tS||1;
  // anatomico: mais fino embaixo (conforto entre os dedos), mais encorpado em cima (sustenta a pedra)
  const fino=tipo==='quadrado'||tipo==='abaulado';   // formatos que ja engrossam nos cantos
  const tBaixo=redondo?1.35:(fino?0.95:1.2), tCima=redondo?1.75:(fino?1.2:1.5), wBaixo=comPave?2.1:1.8, wCima=comPave?2.4:2.15;
  const N=N_ARO, ths=[], R=[], T=[], W=[], L=[];
  for(let i=0;i<N;i++){
    const th=Math.PI/2+i/N*Math.PI*2, cima=((1+Math.sin(th))/2);
    const l=Math.exp(-(((modulo(th-Math.PI/2+Math.PI,2*Math.PI)-Math.PI)/0.8)**2));      // perto da pedra
    let t=(tBaixo+(tCima-tBaixo)*cima**1.5)*tS, w=(wBaixo+(wCima-wBaixo)*cima**2)*wS;
    if(tipo==='ombros'){ t+=1.05*l*l; w*=1+0.6*l**1.5; }                                   // ombros que sobem ate a pedra
    if(est==='afilado') w*=1-0.4*l;                                                           // afina ate a pedra
    ths.push(th); T.push(t); W.push(w); L.push(l);
    R.push(redondo? RI+t : raioFora(tipo,th,RI+t));
  }
  if(!redondo){ // quebra levemente os cantos do contorno (lixa de joalheiro)
    const R2=R.map((_,i)=>{ let s=0, p=0; for(let k=-4;k<=4;k++){ const w=Math.exp(-(k*k)/6); s+=R[(i+k+N)%N]*w; p+=w; } return s/p; });
    R.splice(0,N,...R2);
  }
  const geos=[];
  if(['torcido','trancado','split'].includes(est)){
    // fios: torcido (2), trancado (3) ou dividido (2 que se abrem perto da pedra)
    const fios=est==='trancado'?3:2;
    for(let f=0;f<fios;f++){
      const pts=[], fase=f/fios*Math.PI*2;
      for(let i=0;i<N;i++){ const th=ths[i], rm=RI+T[i]*0.5, a=T[i]*0.28;
        let dr, dz;
        if(est==='split'){ dr=0; dz=(f?1:-1)*(W[i]*0.24+L[i]*L[i]*W[i]*0.75); }
        else { const giro=(est==='trancado'?14:18)*th+fase; dr=a*Math.cos(giro); dz=a*Math.sin(giro)*(est==='trancado'?1.4:1); }
        pts.push(new THREE.Vector3((rm+dr)*Math.cos(th),(rm+dr)*Math.sin(th),dz)); }
      const raio=est==='split'?T[0]*0.36:T[0]*(est==='trancado'?0.27:0.33);
      geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true,'centripetal'),N,raio,12,true));
    }
  } else {
    const S=secao(tipo), M=S.length, pos=new Float32Array(N*M*3); let k=0;
    for(let i=0;i<N;i++){ const c=Math.cos(ths[i]), s=Math.sin(ths[i]), w=W[i];
      const cup={'meia-cana':0.6,plano:0.03,faca:0.65,largo:0.2}[est]??(redondo?0.42:0.05), cupula=cup*(R[i]-RI);
      const onda=est==='ondulado'?0.55*Math.sin(5*ths[i])*(1-L[i]):0;
      for(let j=0;j<M;j++){ const [u,v]=S[j], z=v*w, q=(2*z/w)**2;
        const rin=RI-0.16*(1-q);                                        // por dentro levemente abaulado (anatomico)
        const rout=R[i]-cupula*(est==='faca'?Math.sqrt(q):q);          // faca: crista no meio; plano: face reta
        const r=rin+u*(rout-rin);
        pos[k++]=r*c; pos[k++]=r*s; pos[k++]=z+onda; } }
    const idx=[]; for(let i=0;i<N;i++) for(let j=0;j<M;j++){ const a=i*M+j, b=((i+1)%N)*M+j, c=((i+1)%N)*M+(j+1)%M, d=i*M+(j+1)%M; idx.push(a,b,d,b,c,d); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); geos.push(g);
  }
  const pOut=R.map((r,i)=>new THREE.Vector2(r*Math.cos(ths[i]),r*Math.sin(ths[i])));
  const nOut=pOut.map((p,i)=>{ const t=pOut[(i+1)%N].clone().sub(pOut[(i-1+N)%N]).normalize(); return new THREE.Vector2(t.y,-t.x); });
  return {geos,pOut,nOut,larg:i=>W[i],N,topo:R[0],R};
}

/* tubo que afina (garras) */
function tuboAfinado(curva,r0,r1,seg=36,rad=12){
  const fr=curva.computeFrenetFrames(seg,false), pos=[], idx=[];
  for(let i=0;i<=seg;i++){ const t=i/seg, p=curva.getPointAt(t), r=r0+(r1-r0)*t;
    for(let j=0;j<rad;j++){ const a=j/rad*Math.PI*2, n=fr.normals[i].clone().multiplyScalar(Math.cos(a)).add(fr.binormals[i].clone().multiplyScalar(Math.sin(a)));
      pos.push(p.x+n.x*r,p.y+n.y*r,p.z+n.z*r); } }
  for(let i=0;i<seg;i++) for(let j=0;j<rad;j++){ const a=i*rad+j, b=(i+1)*rad+j, c=(i+1)*rad+(j+1)%rad, d=i*rad+(j+1)%rad; idx.push(a,b,d,b,c,d); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

/* sombra suave no chao (o anel fica em pe, como nas fotos) */
const sombraTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
  const g=x.createRadialGradient(128,128,0,128,128,128); g.addColorStop(0,'rgba(40,36,30,.42)'); g.addColorStop(.45,'rgba(40,36,30,.16)'); g.addColorStop(1,'rgba(40,36,30,0)');
  x.fillStyle=g; x.fillRect(0,0,256,256); return new THREE.CanvasTexture(c); })();
const sombra=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:sombraTex,transparent:true,depthWrite:false}));
sombra.rotation.x=-Math.PI/2; sombra.layers.set(1); cena.add(sombra);

/* pecas pequenas */
const anelH=(raio,y,tubo,lados=64,seg=12)=>{ const g=new THREE.TorusGeometry(raio,tubo,seg,lados); g.rotateX(Math.PI/2); g.translate(0,y,0); return g; };
const bola=(p,raio)=>{ const g=new THREE.SphereGeometry(raio,16,12); g.translate(p.x,p.y,p.z); return g; };
const viradoPara=(pos,dir)=>new THREE.Matrix4().compose(pos,new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize()),new THREE.Vector3(1,1,1));
const ACAB={fosco:0.5,acetinado:0.34,escovado:0.4,martelado:0.28,misto:0.24};

let modelo=null, alturaPedra=12, raioTopo=5; const centroTopo=new THREE.Vector3();
function construir(cfg){
  if(modelo){ cena.remove(modelo); modelo.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
  modelo=new THREE.Group();
  const metal=(OURO[cfg.ouro]||OURO.branco).clone(); if(ACAB[cfg.acabamento]) metal.roughness=ACAB[cfg.acabamento];
  const A=aro(cfg);
  const gAro=new THREE.Group(), gTopo=new THREE.Group(); modelo.add(gAro,gTopo);
  A.geos.forEach(g=>gAro.add(new THREE.Mesh(g,metal)));
  const base=A.topo-0.15;                              // onde a cabeca encosta no aro

  /* pedra x aro calibrados por foto real (pedra = ~34% da largura do anel na vista 3/4) */
  const mm=(window.PZ.OPC.pts.find(o=>o.v===cfg.pts)||{mm:5.2}).mm*1.25, r=mm/2;
  const pav=0.43*mm, coroaH=0.165*mm, coroa=cfg.coroa||'cesta';
  const haloV=cfg.halo==='simples'||cfg.halo==='duplo', oculto=cfg.halo==='oculto'||cfg.halo==='oculto-duplo';
  const G=base+pav+({baixa:0.3,media:0.85,alta:1.7}[cfg.altura]??0.85)+(coroa==='suspensa'?0.7:0)+(haloV?0.2:0);   // cintura da pedra
  const pedra=new THREE.Mesh(brilhante(mm,24),DIAMANTE); pedra.position.y=G; gTopo.add(pedra);

  const partes=[], melee=[], dm=1.1, gm=brilhante(dm,12), contas=[], meleeAro=[], contasAro=[];
  const yGal=G-pav*0.62, rGal=0.62*r+0.25, ladosGal=coroa==='geometrica'?8:72;
  const integrada=cfg.pontaTipo==='integrada';
  const rAss=Math.max(0.7,0.2*mm);
  if(!integrada&&!cfg.bezel&&coroa!=='suspensa') partes.push(anelH(rAss,base+0.25,0.26,coroa==='geometrica'?8:48));

  // catedral: arcos que sobem dos ombros do aro ate a cabeca
  if(coroa==='catedral') for(const s of [1,-1]) for(const z of [0.45,-0.45]){
    const th=Math.PI/2+s*0.42, ro=A.R[Math.round(s>0?0.42/(2*Math.PI)*A.N:A.N-0.42/(2*Math.PI)*A.N)%A.N]||A.topo;
    const c=new THREE.CatmullRomCurve3([new THREE.Vector3(ro*Math.cos(th),ro*Math.sin(th)-0.2,z),new THREE.Vector3(s*(rGal+1.2),yGal-0.6,z*0.8),new THREE.Vector3(s*rGal*0.95,yGal,z*0.4)]);
    partes.push(tuboAfinado(c,0.42,0.3,24,10));
  }

  // ---------- bezel / semi-bezel ----------
  if(cfg.bezel){
    const perfil=[[r+0.05,G-pav*0.45],[r+0.42,G-pav*0.42],[r+0.42,G+0.12],[r+0.26,G+0.2],[r-0.08,G+0.1]].map(([x,y])=>new THREE.Vector2(x,y));
    if(coroa==='semi-bezel'){ for(const ini of [Math.PI*0.25,Math.PI*1.25]) partes.push(new THREE.LatheGeometry(perfil,36,ini,Math.PI*0.5)); }
    else partes.push(new THREE.LatheGeometry(perfil,72));
    // taca que liga o bezel ao aro (sem ela a pedra parece flutuar)
    const taca=[[0.55,base-0.2],[rAss+0.25,base+0.2],[r*0.62,G-pav*0.62],[r+0.1,G-pav*0.42],[r*0.62-0.25,G-pav*0.62],[rAss,base+0.2],[0.3,base-0.2]].map(([x,y])=>new THREE.Vector2(x,y));
    partes.push(new THREE.LatheGeometry(taca,coroa==='geometrica'?8:64));
  }

  // ---------- garras ----------
  const angulos=[];
  if(!cfg.bezel){
    if(cfg.duplas){ for(let k=0;k<4;k++){ const c=(cfg.diagonal?Math.PI/4:0)+k*Math.PI/2; angulos.push(c-0.2,c+0.2); } }
    else { const n=cfg.n; for(let k=0;k<n;k++) angulos.push((n%2? Math.PI/2 : (cfg.diagonal? Math.PI/n : 0))+k*Math.PI*2/n); }
  }
  const tipo=cfg.pontaTipo||'redonda', finas=tipo==='finas'||cfg.duplas||angulos.length>=8||coroa==='suspensa';
  const gS=(cfg.gS||1)*(tipo==='finas'?0.72:1);
  const rg0=(finas?0.3:angulos.length<=4?0.44:0.36)*gS, rg1=(finas?0.25:angulos.length<=4?0.36:0.29)*gS;
  for(const a0 of angulos){
    const cruza=(tipo==='cruzada'||coroa==='trellis')?0.38:0, gira=tipo==='entrelacada'?0.9:0;
    const P=(rad,y,ang)=>new THREE.Vector3(Math.cos(ang)*rad,y,Math.sin(ang)*rad);
    const aB=a0-cruza-gira/2, aT=a0+cruza+gira/2, mid=(aB+aT)/2;
    const largo=coroa==='tulipa'?0.32*r+0.25:0, bojo=tipo==='curvada'?0.55:0;
    const ini=integrada? P(rAss+0.9,base-0.5,aB) : P(coroa==='suspensa'?0.45:rAss,base+0.15,aB);
    const curva=new THREE.CatmullRomCurve3([ini,
      P((integrada?rAss+0.6:rAss+0.35),base+0.55,aB+(mid-aB)*0.3),
      P(0.62*r+0.25+largo+bojo,G-pav*0.62,mid),
      P(0.9*r+0.2+largo*0.6+bojo,G-pav*0.22,aB+(aT-aB)*0.8),
      P(r+0.18,G-0.05,aT),
      P(r+0.04,G+coroaH*0.6,aT)],false,'centripetal');
    partes.push(tuboAfinado(curva,rg0,rg1));
    const tip=P(r+0.08,G+coroaH*0.55,aT), d=new THREE.Vector3(Math.cos(aT),0,Math.sin(aT)), entra=d.clone().negate();
    const cone=(compr,raio,dentro,cima,lados=16)=>{ const p=new THREE.ConeGeometry(raio,compr,lados); p.translate(0,compr*0.4,0);
      p.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),entra.clone().multiplyScalar(dentro).setY(cima).normalize())); return p; };
    let p;
    if(tipo==='unha-gato'){ p=cone(1.25,rg1*1.15,0.92,0.38); partes.push(bola(tip,rg1*1.1)); }
    else if(tipo==='unha-aguia'){ p=cone(1.8,rg1*1.05,0.97,0.12); partes.push(bola(tip,rg1*1.05)); }
    else if(tipo==='pontiaguda'){ p=cone(1.05,rg1*1.1,0.35,0.94); }
    else if(tipo==='em-v'){ p=cone(1.2,rg1*1.6,0.9,0.4,4); p.scale(1,1,1); partes.push(bola(tip,rg1*1.05)); }
    else if(tipo==='quadrada'){ p=new THREE.BoxGeometry(rg1*2.3,rg1*2.1,rg1*2.3); p.rotateY(-aT); }
    else if(tipo==='achatada'){ p=new THREE.SphereGeometry(1,20,14); p.scale(0.62,0.26,0.5); p.rotateY(-aT); p.translate(entra.x*0.18,0.06,entra.z*0.18); }
    else { p=new THREE.SphereGeometry(rg1*(tipo==='finas'?1.2:1.3),20,16); }
    p.translate(tip.x,tip.y,tip.z); partes.push(p);
  }

  // ---------- galeria (o aro de metal sob a pedra, entre as garras) ----------
  if(!cfg.bezel){
    const gal=cfg.galeria||'simples';
    if(gal==='simples'||gal==='cravejada'||gal==='milgrain') partes.push(anelH(rGal,yGal,gal==='cravejada'?0.34:0.2,ladosGal));
    if(gal==='dupla'){ partes.push(anelH(rGal,yGal,0.2,ladosGal)); partes.push(anelH(rGal*0.82,yGal-pav*0.32,0.18,ladosGal)); }
    if(gal==='fechada'){ const perfil=[[rGal-0.12,yGal-0.55],[rGal+0.14,yGal-0.55],[rGal+0.18,yGal+0.4],[rGal-0.08,yGal+0.4]].map(([x,y])=>new THREE.Vector2(x,y));
      partes.push(new THREE.LatheGeometry([...perfil,perfil[0]],ladosGal)); }
    if(gal==='vazada'){ // dois aros finos ligados por pilares: janelas de luz sob a pedra
      partes.push(anelH(rGal,yGal+0.3,0.15,ladosGal)); partes.push(anelH(rGal*0.92,yGal-0.6,0.15,ladosGal));
      const q=Math.max(8,angulos.length*2); for(let i=0;i<q;i++){ const a=(i+0.5)/q*Math.PI*2;
        const c=new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a)*rGal*0.92,yGal-0.6,Math.sin(a)*rGal*0.92),new THREE.Vector3(Math.cos(a)*rGal,yGal+0.3,Math.sin(a)*rGal)]);
        partes.push(new THREE.TubeGeometry(c,2,0.11,8)); } }
    if(gal==='cravejada'){ const q=Math.floor(2*Math.PI*(rGal+0.3)/(dm*0.95)); for(let i=0;i<q;i++){ const a=i/q*Math.PI*2;
      melee.push(viradoPara(new THREE.Vector3(Math.cos(a)*(rGal+0.22),yGal,Math.sin(a)*(rGal+0.22)),new THREE.Vector3(Math.cos(a),0.15,Math.sin(a)))); } }
    if(gal==='milgrain'){ const q=Math.floor(2*Math.PI*rGal/0.26); for(let i=0;i<q;i++){ const a=i/q*Math.PI*2;
      for(const dy of [0.2,-0.2]) contas.push(new THREE.Vector3(Math.cos(a)*(rGal+0.12),yGal+dy,Math.sin(a)*(rGal+0.12))); } }
  }
  // floral: petalas de ouro entre as garras, sob a pedra
  if(coroa==='floral'&&!cfg.bezel){ const q=Math.max(5,angulos.length); for(let i=0;i<q;i++){ const a=(i+0.5)/q*Math.PI*2;
    const pe=new THREE.SphereGeometry(1,18,12); pe.scale(0.55,0.95,0.28); pe.rotateZ(-0.35); pe.rotateY(-a+Math.PI/2);
    pe.translate(Math.cos(a)*(rGal+0.15),yGal+0.15,Math.sin(a)*(rGal+0.15)); partes.push(pe); } }

  // ---------- halo (em volta da pedra) e halo oculto (sob a pedra) ----------
  const fileiraHalo=(R,y)=>{ const q=Math.floor(2*Math.PI*R/(dm*1.12)); for(let i=0;i<q;i++){ const a=i/q*Math.PI*2; melee.push(new THREE.Matrix4().makeTranslation(Math.cos(a)*R,y,Math.sin(a)*R)); } };
  if(haloV){
    const R=r+0.32+dm/2, dupla=cfg.halo==='duplo', R2=R+dm*1.06;
    /* moldura: disco baixo sob as fileiras. Achata a altura do tubo (z antes de deitar), nunca o raio, senao o anel vira elipse e corta a pedra */
    const moldura=new THREE.TorusGeometry(dupla?(R+R2)/2:R,dupla?(R2-R+dm)/2+0.1:0.36,12,96); moldura.scale(1,1,dupla?0.2:1); moldura.rotateX(Math.PI/2); moldura.translate(0,dupla?G-0.42:G-0.32,0); partes.push(moldura);
    fileiraHalo(R,G-0.02); if(dupla) fileiraHalo(R2,G-0.06);
  }
  if(oculto){
    const y=G-pav*0.5, R=rGal+dm*0.55;
    partes.push(anelH(R-0.1,y-0.35,0.3,80));
    const q=Math.floor(2*Math.PI*R/(dm*1.1));
    for(let i=0;i<q;i++){ const a=i/q*Math.PI*2; melee.push(viradoPara(new THREE.Vector3(Math.cos(a)*R,y,Math.sin(a)*R),new THREE.Vector3(Math.cos(a),0.35,Math.sin(a)))); }
    if(cfg.halo==='oculto-duplo') for(let i=0;i<q;i++){ const a=(i+0.5)/q*Math.PI*2;
      melee.push(viradoPara(new THREE.Vector3(Math.cos(a)*(R-0.15),y-dm*0.95,Math.sin(a)*(R-0.15)),new THREE.Vector3(Math.cos(a),0.2,Math.sin(a)))); }
  }

  // ---------- pave no aro ----------
  const paveAte=(lim,ini,linhas=1)=>{
    const passo=dm*1.14, comprimento=i=>A.pOut[i].distanceTo(A.pOut[(i-1+A.N)%A.N]);
    for(const lado of [1,-1]){ let acum=passo;
      for(let s=ini;s<lim;s++){ const i=lado>0? s : (A.N-s)%A.N; acum+=comprimento(lado>0? i : (i+1)%A.N);
        if(acum<passo) continue; acum=0;
        const nrm=A.nOut[i], po=A.pOut[i], w=A.larg(i);
        for(let f=0;f<linhas;f++){ const z=linhas>1?(f-(linhas-1)/2)*Math.min(dm*1.05,w/linhas):0;
          meleeAro.push(viradoPara(new THREE.Vector3(po.x-nrm.x*0.2,po.y-nrm.y*0.2,z),new THREE.Vector3(nrm.x,nrm.y,0))); }
        const wb=w/2-0.32; [wb,-wb].forEach(z=>contasAro.push(new THREE.Vector3(po.x-nrm.x*0.08,po.y-nrm.y*0.08,z)));
      } }
  };
  const ini=Math.ceil(A.N*(0.035+r/60));
  if(cfg.pave) paveAte(Math.floor(A.N*(cfg.paveLim||0.27)),ini,cfg.fileiras||1);
  else if(cfg.detalhes.includes('ombros')) paveAte(Math.floor(A.N*0.1),ini,1);

  // ---------- detalhes ----------
  if(cfg.detalhes.includes('lateral')) for(const s of [1,-1]) melee.push(viradoPara(new THREE.Vector3(0,yGal-0.2,s*(rGal+0.45)),new THREE.Vector3(0,0.2,s)));
  if(cfg.detalhes.includes('surpresa')) melee.push(viradoPara(new THREE.Vector3(rGal+0.45,yGal-0.1,0),new THREE.Vector3(1,0.15,0)));
  if(cfg.detalhes.includes('entre-garras')&&angulos.length){ for(let k=0;k<angulos.length;k++){ const a=(angulos[k]+angulos[(k+1)%angulos.length]+(k===angulos.length-1?Math.PI*2:0))/2;
    melee.push(viradoPara(new THREE.Vector3(Math.cos(a)*(r+0.35),G-0.25,Math.sin(a)*(r+0.35)),new THREE.Vector3(Math.cos(a),0.6,Math.sin(a)))); } }

  // metal nao usa textura: tira as coordenadas de textura para todas as partes juntarem numa so malha
  const juntar=(lista,bolas,pedras,grupo)=>{ bolas.forEach(b=>lista.push(bola(b,0.14)));
    lista.forEach(g=>{ if(g.attributes.uv) g.deleteAttribute('uv'); if(!g.index) g.setIndex([...Array(g.attributes.position.count).keys()]); });
    if(lista.length) grupo.add(new THREE.Mesh(mergeGeometries(lista),metal));
    if(pedras.length){ const im=new THREE.InstancedMesh(gm,MELEE,pedras.length); pedras.forEach((m,i)=>im.setMatrixAt(i,m)); grupo.add(im); } };
  juntar(partes,contas,melee,gTopo); juntar([],contasAro,meleeAro,gAro);
  gAro.traverse(o=>o.layers.set(1)); gTopo.traverse(o=>o.layers.set(2));
  const esfera=new THREE.Box3().setFromObject(gTopo).getBoundingSphere(new THREE.Sphere()); centroTopo.copy(esfera.center); raioTopo=esfera.radius;

  // o aro fica em pe: o ponto mais baixo encosta no chao
  const caixa=new THREE.Box3().setFromObject(gAro);
  sombra.position.set(0,caixa.min.y-0.02,0); sombra.scale.set((caixa.max.x-caixa.min.x)*1.25,9,1);
  alturaPedra=G;
  cena.add(modelo);
  pedirQuadro();
}

/* camera: vista frontal em 3/4 (o contorno do aro aparece), balancando devagar ate a cliente mexer.
   Foco automatico: escolhas da cabeca (garras, coroa, galeria, diamante, halo) aproximam da pedra;
   escolhas do aro voltam para o anel inteiro. Os botoes Pedra / Anel inteiro trocam a mao. */
/* duas previas separadas no mesmo palco: o aro sozinho (formato, modelo, pave) e o topo sozinho
   (pedra, garras, coroa, galeria, halo). Girar uma gira as duas juntas. */
let distancia=62, pedido=false, visivel=true, qA={x:0,y:0,w:0,h:0}, qT={x:0,y:0,w:0,h:0};
camera.layers.set(1);
const camTopo=new THREE.PerspectiveCamera(26,1,1,500); camTopo.layers.set(2);
const rotAro=document.createElement('div'); rotAro.className='vista vista-topo'; rotAro.innerHTML='<span>Formato do aro</span>';
const rotTopo=document.createElement('div'); rotTopo.className='vista'; rotTopo.innerHTML='<span>Pedra e garras</span>';
palco.append(rotAro,rotTopo);
function posicionar(az){ const pol=1.35, T=controles.target; camera.position.set(T.x+distancia*Math.sin(pol)*Math.sin(az),T.y+distancia*Math.cos(pol),T.z+distancia*Math.sin(pol)*Math.cos(az)); camera.lookAt(T); }
function posicionarTopo(){
  const az=Math.atan2(camera.position.x-controles.target.x,camera.position.z-controles.target.z), pol=0.9, d=Math.max(54,raioTopo*4.6);   /* distancia fixa (cabe a 3 ct): 10 pts aparece pequeno e 3 ct grande, como na mao; so o halo duplo maior afasta um pouco para nao cortar */
  camTopo.position.set(centroTopo.x+d*Math.sin(pol)*Math.sin(az),centroTopo.y+d*Math.cos(pol),centroTopo.z+d*Math.sin(pol)*Math.cos(az)); camTopo.lookAt(centroTopo);
}
function pedirQuadro(){ if(!pedido){ pedido=true; requestAnimationFrame(quadro); } }
const pintar=(q,cam,h)=>{ renderer.setViewport(q.x,h-q.y-q.h,q.w,q.h); renderer.setScissor(q.x,h-q.y-q.h,q.w,q.h); renderer.render(cena,cam); };
function quadro(){
  pedido=false;
  if(!mexeu) posicionar(semMovimento?0.3:0.5*Math.sin((performance.now()-t0)/2600)+0.3);
  const mudou=controles.update(), h=palco.clientHeight;
  posicionarTopo(); renderer.setScissorTest(true); pintar(qA,camera,h); pintar(qT,camTopo,h); renderer.setScissorTest(false);
  if((!mexeu&&!semMovimento&&visivel)||mudou) pedirQuadro();
}
controles.addEventListener('change',pedirQuadro);
function ajustar(){ const w=palco.clientWidth, h=palco.clientHeight; renderer.setSize(w,h,false);
  const vao=8;
  if(w/h>1.3){ const m=Math.floor((w-vao)/2); qT={x:0,y:0,w:m,h}; qA={x:m+vao,y:0,w:w-m-vao,h}; }   /* celular: lado a lado, o topo primeiro */
  else { const m=Math.floor((h-vao)/2); qT={x:0,y:0,w,h:m}; qA={x:0,y:m+vao,w,h:h-m-vao}; }           /* computador: o topo em cima, o aro embaixo */
  for(const [el,q] of [[rotAro,qA],[rotTopo,qT]]) Object.assign(el.style,{left:q.x+'px',top:q.y+'px',width:q.w+'px',height:q.h+'px'});
  camera.clearViewOffset(); camera.aspect=qA.w/qA.h; camera.updateProjectionMatrix();
  camTopo.aspect=qT.w/qT.h; camTopo.updateProjectionMatrix();
  distancia=camera.aspect<1.2?76:68;
  if(!mexeu) posicionar(0.3);
  pedirQuadro(); }
new ResizeObserver(ajustar).observe(palco);
new IntersectionObserver(([e])=>{ visivel=e.isIntersecting; if(visivel) pedirQuadro(); }).observe(palco);
ajustar();
window.PZ.aoMudar(c=>{ construir(c); pedirQuadro();
  const o=window.PZ.OPC.pts.find(x=>x.v===c.pts); if(o) rotTopo.querySelector('span').textContent='Pedra e garras · '+o.t+' · '+o.s; });

/* foto do anel para o pedido: vista frontal em 3/4, sem mexer na camera da cliente */
window.PZ.foto=()=>{
  const cam=camera.clone(); cam.layers.enableAll(); const pol=1.22, az=0.3, d=74;
  cam.position.set(d*Math.sin(pol)*Math.sin(az),ALVO.y+d*Math.cos(pol),d*Math.sin(pol)*Math.cos(az)); cam.lookAt(ALVO); cam.aspect=1; cam.updateProjectionMatrix();
  const w=palco.clientWidth, h=palco.clientHeight;
  renderer.setSize(900,900,false); renderer.render(cena,cam);
  const url=renderer.domElement.toDataURL('image/jpeg',0.9);
  renderer.setSize(w,h,false); ajustar();
  return url;
};
