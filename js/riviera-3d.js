/* Riviera em 3D. Medidas em milimetros. Tudo vem da conta de riviera-modelo.js:
   cada formato de pedra vira uma malha repetida (InstancedMesh), com a cravacao em outra malha repetida.
   Dois quadros no mesmo palco, como no solitario: o detalhe das pedras em tamanho real e a peca inteira. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const R=window.Riviera, palco=document.getElementById('palco');
let renderer;
try{ renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); }
catch(e){ palco.innerHTML='<p class="sem-3d">Este aparelho não mostra a joia em 3D, mas você pode montar e pedir normalmente: o resumo vai junto com o pedido.</p>'; window.PZ.foto=()=>null; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
renderer.outputColorSpace=THREE.SRGBColorSpace;
palco.prepend(renderer.domElement);
document.getElementById('carregando-3d').remove();

const cena=new THREE.Scene();
cena.background=new THREE.Color(0xf3f3f0);
const pmrem=new THREE.PMREMGenerator(renderer);
cena.environment=pmrem.fromScene(new RoomEnvironment(),0.03).texture;
cena.environmentIntensity=1.1;
{ const a=new THREE.DirectionalLight(0xffffff,2.2); a.position.set(25,60,45); cena.add(a);
  const b=new THREE.DirectionalLight(0xfff3e6,1.1); b.position.set(-45,25,-15); cena.add(b);
  cena.add(new THREE.HemisphereLight(0xffffff,0xd8d4cc,0.8)); }

const metalBase=c=>new THREE.MeshPhysicalMaterial({color:c,metalness:1,roughness:.14,envMapIntensity:2.1,clearcoat:.5,clearcoatRoughness:.08,side:THREE.DoubleSide});
const OURO={branco:metalBase(0xf1f1ef),amarelo:metalBase(0xf7c977),rose:metalBase(0xf2b9a3)};
const estudioPedra=(()=>{ const c=new THREE.Scene(); c.background=new THREE.Color(0xb9bcc4);
  const luz=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}), meia=new THREE.MeshBasicMaterial({color:0x6d7079,side:THREE.DoubleSide}), preto=new THREE.MeshBasicMaterial({color:0x17181c,side:THREE.DoubleSide});
  for(let i=0;i<36;i++){ const a=i/36*Math.PI*2, tipo=i%4, f=new THREE.Mesh(new THREE.PlaneGeometry(tipo===3?.55:1.3,4+((i*7)%6)),tipo===3?preto:tipo===1?meia:luz);
    f.position.set(Math.cos(a)*6,((i*5)%9-4)*1.1,Math.sin(a)*6); f.lookAt(0,0,0); c.add(f); }
  for(let i=0;i<12;i++){ const a=i/12*Math.PI*2, r=i%2?2.1:4, f=new THREE.Mesh(new THREE.CircleGeometry(i%3===2?.45:1.05,20),i%3===2?preto:i%3===1?meia:luz); f.position.set(Math.cos(a)*r,6.5,Math.sin(a)*r); f.lookAt(0,0,0); c.add(f); }
  return pmrem.fromScene(c,0).texture; })();
const DIAMANTE=new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:1,roughness:.02,envMap:estudioPedra,envMapIntensity:1.32,clearcoat:.4,clearcoatRoughness:0,
  iridescence:.3,iridescenceIOR:1.9,side:THREE.DoubleSide});

const V=(x,y,z)=>new THREE.Vector3(x,y,z);

/* ---------- pedra: camadas do contorno, da mesa ate o fundo; cada triangulo e uma faceta ---------- */
function gema(forma,d){
  const pts=R.contorno(forma).map(([x,z])=>[x*d.L,z*d.W]), n=pts.length, degrau=FORMAS_CORTE(forma)==='degrau';
  const meio=pts.map((p,i)=>{ const q=pts[(i+1)%n]; return [(p[0]+q[0])/2,(p[1]+q[1])/2]; });
  const C=d.coroa, Pv=d.pav, gi=.012*Math.min(d.L,d.W);
  /* camada: [contorno, escala, altura, achata em z, inclinacao da faceta] */
  const camadas=degrau
    ? [[pts,.16,C,1,.12],[pts,.3,C,1,.34],[pts,.44,C,1,.1],[pts,.62,C,1,.3],[pts,.76,C*.62,1,.2],[pts,.89,C*.3,1,.26],[pts,1,gi,1,.1],[pts,1,-gi,1,.2],[pts,.74,-Pv*.34,1,.3],[pts,.5,-Pv*.68,1,.2],[pts,.24,-Pv,.06,0]]
    : [[pts,.22,C,1,.62],[meio,.4,C,1,.46],[pts,.56,C,1,.3],[meio,.8,C*.55,1,.22],[pts,1,gi,1,.1],[pts,1,-gi,1,.26],[meio,.47,-Pv*.6,1,.3],[pts,.015,-Pv,1,0]];
  const anel=camadas.map(([b,f,y,fz])=>b.map(([x,z])=>[x*f,y,z*f*fz]));
  const ehMeio=camadas.map(c=>c[0]===meio);
  const pos=[], nor=[], v=new THREE.Vector3(), a1=new THREE.Vector3(), b1=new THREE.Vector3();
  /* cada faceta se inclina para fora ou para dentro, alternando: simetrico como uma lapidacao real, e cada uma pega um pedaco diferente da luz */
  const tri=(a,b,c,inc)=>{ a1.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]); b1.set(c[0]-a[0],c[1]-a[1],c[2]-a[2]); v.crossVectors(a1,b1); if(v.y<0) v.negate(); v.normalize();
    const mx=(a[0]+b[0]+c[0])/3, mz=(a[2]+b[2]+c[2])/3, m=Math.hypot(mx,mz)||1; v.x+=mx/m*inc; v.z+=mz/m*inc; v.normalize();
    pos.push(...a,...b,...c); for(let i=0;i<3;i++) nor.push(v.x,v.y,v.z); };
  const topo=[0,C,0]; for(let i=0;i<n;i++) tri(topo,anel[0][i],anel[0][(i+1)%n],degrau?.04:(i%2?.5:-.5));
  for(let c=0;c<anel.length-1;c++){ const inc=camadas[c][4], A=anel[c], E=anel[c+1];
    for(let i=0;i<n;i++){ const j=(i+1)%n, h=(i-1+n)%n, s=degrau?(c%2?1:-1):(i%2?1:-1);
      if(!ehMeio[c]&&ehMeio[c+1]){ tri(A[i],E[i],A[j],inc*s); tri(A[i],E[h],E[i],-inc*s); }     /* do contorno para o ponto do meio: zigue-zague sem giro */
      else { tri(A[i],E[i],E[j],inc*s); tri(A[i],E[j],A[j],(degrau?1:-1)*inc*s); } } }
  const fim=anel[anel.length-1], fundo=[0,-Pv,0]; for(let i=0;i<n;i++) tri(fundo,fim[(i+1)%n],fim[i],.3);
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); return g;
}
const FORMAS_CORTE=f=>R.FORMAS[f].corte;

/* ---------- pecas de metal ---------- */
function tuboAfinado(curva,r0,r1,seg=10,rad=8){
  const fr=curva.computeFrenetFrames(seg,false), pos=[], idx=[];
  for(let i=0;i<=seg;i++){ const t=i/seg, p=curva.getPointAt(t), r=r0+(r1-r0)*t;
    for(let j=0;j<rad;j++){ const a=j/rad*Math.PI*2, m=fr.normals[i].clone().multiplyScalar(Math.cos(a)).add(fr.binormals[i].clone().multiplyScalar(Math.sin(a)));
      pos.push(p.x+m.x*r,p.y+m.y*r,p.z+m.z*r); } }
  for(let i=0;i<seg;i++) for(let j=0;j<rad;j++){ const a=i*rad+j, b=(i+1)*rad+j, c=(i+1)*rad+(j+1)%rad, d=i*rad+(j+1)%rad; idx.push(a,b,d,b,c,d); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const limpar=g=>{ if(g.attributes.uv) g.deleteAttribute('uv'); if(g.attributes.uv1) g.deleteAttribute('uv1'); if(!g.index) g.setIndex([...Array(g.attributes.position.count).keys()]); return g; };
const fundir=l=>mergeGeometries(l.map(limpar));
const bolaEm=(p,r,a=12,b=9)=>{ const g=new THREE.SphereGeometry(r,a,b); g.translate(p.x,p.y,p.z); return g; };
/* contorno com folga: cada ponto anda para fora pela normal do contorno */
function normais(pts){ const n=pts.length; return pts.map((_,i)=>{ const a=pts[(i-1+n)%n], b=pts[(i+1)%n], tx=b[0]-a[0], tz=b[1]-a[1], m=Math.hypot(tx,tz)||1; return [tz/m,-tx/m]; }).map((v,i)=>{ const s=v[0]*pts[i][0]+v[1]*pts[i][1]; return s<0?[-v[0],-v[1]]:v; }); }
/* casca: varre um perfil [folga,y] ao longo do contorno; "pular" deixa trechos abertos (semi-bezel) */
function casca(pts,perfil,pular){
  const nr=normais(pts), n=pts.length, m=perfil.length, pos=[], idx=[];
  for(let i=0;i<n;i++) for(const [f,y] of perfil) pos.push(pts[i][0]+nr[i][0]*f,y,pts[i][1]+nr[i][1]*f);
  for(let i=0;i<n;i++){ const k=(i+1)%n; if(pular&&(pular(pts[i])||pular(pts[k]))) continue;
    for(let j=0;j<m-1;j++){ const a=i*m+j, b=k*m+j, c=k*m+j+1, d=i*m+j+1; idx.push(a,b,d,b,c,d); } }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
/* fundo em taca: camadas do contorno encolhendo */
function taca(pts,camadas){
  const n=pts.length, pos=[], idx=[], m=camadas.length;
  for(const [f,y] of camadas) for(const [x,z] of pts) pos.push(x*f,y,z*f);
  for(let c=0;c<m-1;c++) for(let i=0;i<n;i++){ const j=(i+1)%n, a=c*n+i, b=c*n+j, d=(c+1)*n+i, e=(c+1)*n+j; idx.push(a,b,d,b,e,d); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const trilho=(pts,f,y,raio)=>tubo3(pts.map(([x,z])=>V(x*f,y,z*f)),raio,true);
function tubo3(pts3,raio,fechado){ return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts3,fechado,'catmullrom',0.15),Math.max(pts3.length*2,16),raio,6,fechado); }

/* onde ficam as garras, em unidade da caixa da pedra */
function alvosGarra(forma,crav){
  if(crav==='duas') return [[0,.5],[0,-.5]];
  if(crav==='tres-grifas') return [[.5,0],[-.25,.433],[-.25,-.433]];
  if(crav==='cartier') return [[.5,.26],[.5,-.26],[-.5,.26],[-.5,-.26]];   /* duas a duas, viradas para a pedra vizinha */
  if(crav==='compartilhada') return [[.5,.27],[.5,-.27],[-.5,.27],[-.5,-.27]];
  if(crav==='seis') return [0,60,120,180,240,300].map(a=>[Math.cos(a*Math.PI/180)*.5,Math.sin(a*Math.PI/180)*.5]);
  if(forma==='gota') return [[.5,0],[-.32,.46],[-.32,-.46],[-.5,0]];
  if(forma==='marquise') return [[.5,0],[-.5,0],[0,.5],[0,-.5]];
  if(forma==='coracao') return [[.5,0],[-.2,.5],[-.2,-.5],[-.4,0]];
  return [[.5,.5],[-.5,.5],[-.5,-.5],[.5,-.5]];
}

/* cravacao de uma pedra: no mesmo sistema da pedra (y=0 na cintura) */
function cabeca(forma,d,c,crav,folga=.5){
  const pts=R.contorno(forma).map(([x,z])=>[x*d.L,z*d.W]), partes=[];
  const W=Math.min(d.L,d.W), fundoY={baixa:-d.pav*.62,media:-d.pav*.86,alta:-d.pav*1.12}[c.altura]??-d.pav*.86;
  const rRail=Math.min(.32,Math.max(.1,.042*W)), esp={fina:.78,media:1,robusta:1.28}[c.espessuraGarra]??1;
  const haste=Math.min(.62,Math.max(.2,.092*W))*esp, ponta=haste*.92;
  const fechada=c.base==='fechada';

  if(crav==='bezel'||crav==='semi-bezel'){
    const rim=Math.min(.55,Math.max(.22,.075*W));
    const perfil=[[-.03*W,d.coroa*.05],[rim*.35,d.coroa*.32],[rim,d.coroa*.2],[rim,-d.pav*.42],[.02,-d.pav*.5]];
    const pular=crav==='semi-bezel'?(p=>Math.abs(p[0])>d.L*.24):null;
    partes.push(casca(pts,perfil,pular));
    if(crav==='semi-bezel'||!fechada) partes.push(trilho(pts,.74,fundoY*.72,rRail));
  } else if(crav==='coroa'||crav==='coroa-faca'||crav==='xing'){
    /* coroa: colar de metal arredondado em volta da pedra, que sobe em quatro pontas e desce entre elas */
    const fino=[]; pts.forEach((p,i)=>{ const q=pts[(i+1)%pts.length]; for(let k=0;k<4;k++) fino.push([p[0]+(q[0]-p[0])*k/4,p[1]+(q[1]-p[1])*k/4]); });
    const nr=normais(fino), rim=crav==='coroa-faca'?Math.min(.5,Math.max(.25,.13*W)):Math.min(1,Math.max(.28,folga*.42)), garras=alvosGarra(forma,crav).map(([ax,az])=>{ const qx=ax*d.L, qz=az*d.W; let m=1e9, b=pts[0]; for(const q of pts){ const e=Math.hypot(q[0]-qx,q[1]-qz); if(e<m){ m=e; b=q; } } return b; });
    const angs=garras.map(([x,z])=>Math.atan2(z,x)), N=fino.length, pos=[], idx=[];
    const perfil=fechada?[[1,-.02*W,0],[1,.55,.04],[1,.92,-.1],[1,1,-.32],[.86,.85,-.55],[.55,.6,-.8],[.3,.05,-1]]:[[1,-.02*W,0],[1,.55,.04],[1,.92,-.1],[1,1,-.32],[.86,.85,-.55],[.6,.55,-.78],[.58,.1,-.8]];
    fino.forEach(([x,z],i)=>{ const a=Math.atan2(z,x); let u=0; for(const b of angs){ let e=Math.abs(a-b); if(e>Math.PI) e=2*Math.PI-e; u=Math.max(u,Math.exp(-((e/.4)**2))); }
      const topo=-d.pav*.2+(d.coroa*.26+d.pav*.2)*u;
      perfil.forEach(([f,o,yr],j)=>{ const of=j===0?o:o*rim, y=j<3?topo+yr*W*.4:Math.min(topo-.1*W,d.pav*yr); pos.push(x*f+nr[i][0]*of,y,z*f+nr[i][1]*of); }); });
    const M=perfil.length; for(let i=0;i<N;i++){ const k=(i+1)%N; for(let j=0;j<M-1;j++){ const a=i*M+j, b=k*M+j, c2=k*M+j+1, e=i*M+j+1; idx.push(a,b,e,b,c2,e); } }
    const gc=new THREE.BufferGeometry(); gc.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); gc.setIndex(idx); gc.computeVertexNormals(); partes.push(gc);
    for(const [px,pz] of garras){ const r=Math.hypot(px,pz)||1, ux=px/r, uz=pz/r; partes.push(bolaEm(V(px+ux*rim*.08,d.coroa*.44,pz+uz*rim*.08),haste*1.3)); }
  } else if(crav==='canaleta'){
    partes.push(trilho(pts,.72,fundoY*.72,rRail));
  } else {
    /* garras: sobem do trilho de baixo, abraçam a cintura e dobram sobre a coroa */
    for(const [ax,az] of alvosGarra(forma,crav)){
      const qx=ax*d.L, qz=az*d.W; let px=qx, pz=qz;
      if(crav!=='compartilhada'){ let m=1e9; for(const [x,z] of pts){ const e=Math.hypot(x-qx,z-qz); if(e<m){ m=e; px=x; pz=z; } } }
      const r=Math.hypot(px,pz)||1, ux=px/r, uz=pz/r;
      const curva=new THREE.CatmullRomCurve3([V(px*.46,fundoY,pz*.46),V(px*.74,-d.pav*.42,pz*.74),V(px+ux*haste*.5,-.02*W,pz+uz*haste*.5),V(px+ux*haste*.25,d.coroa*.42,pz+uz*haste*.25)],false,'centripetal');
      partes.push(tuboAfinado(curva,haste*1.02,haste*.86));
      const tp=V(px+ux*haste*.08,d.coroa*.5,pz+uz*haste*.08), entra=V(-ux,.34,-uz).normalize(), tipo=c.ponta;
      if(tipo==='unha-gato'||tipo==='em-v'){ const cn=new THREE.ConeGeometry(ponta*(tipo==='em-v'?1.5:1.15),haste*3.4,tipo==='em-v'?4:10); cn.translate(0,haste*1.5,0);
        cn.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),entra)); cn.translate(tp.x,tp.y,tp.z); partes.push(cn); partes.push(bolaEm(tp,ponta)); }
      else if(tipo==='quadrada'){ const b=new THREE.BoxGeometry(ponta*2.3,ponta*1.5,ponta*2.3); b.rotateY(-Math.atan2(uz,ux)); b.translate(tp.x,tp.y,tp.z); partes.push(b); }
      else partes.push(bolaEm(tp,ponta*1.2));
    }
    partes.push(trilho(pts,.72,-d.pav*.42,rRail));
    if(!fechada) partes.push(trilho(pts,.42,fundoY*.98,rRail*.9));
  }
  if(fechada) partes.push(taca(pts,[[.92,-d.pav*.1],[.72,-d.pav*.5],[.42,fundoY*.95],[.02,fundoY*1.02]]));
  if(c.acabamento==='milgrain'){ const q=Math.min(26,Math.max(12,Math.floor(2*(d.L+d.W)/.42))), nr=normais(pts), n=pts.length;
    const raio=(crav==='bezel'||crav==='semi-bezel')?Math.min(.55,Math.max(.22,.075*W)):rRail*2;
    for(let i=0;i<q;i++){ const u=i/q*n, a=Math.floor(u), b=(a+1)%n, t=u-a, x=pts[a][0]+(pts[b][0]-pts[a][0])*t, z=pts[a][1]+(pts[b][1]-pts[a][1])*t;
      partes.push(bolaEm(V(x+nr[a][0]*raio,-.01*W,z+nr[a][1]*raio),Math.min(.14,Math.max(.07,.02*W)),6,4)); } }
  return fundir(partes);
}

/* ---------- sombra suave no chao, desenhada a partir do caminho da peca ---------- */
const sombraCanvas=document.createElement('canvas'); sombraCanvas.width=sombraCanvas.height=1024;
const sombraTex=new THREE.CanvasTexture(sombraCanvas);
const sombra=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:sombraTex,transparent:true,depthWrite:false}));
sombra.rotation.x=-Math.PI/2; cena.add(sombra);
function desenharSombra(M,caixa){
  const x=sombraCanvas.getContext('2d'); x.clearRect(0,0,1024,1024);
  const lado=Math.max(caixa.max.x-caixa.min.x,caixa.max.z-caixa.min.z)*1.3, cx=(caixa.max.x+caixa.min.x)/2, cz=(caixa.max.z+caixa.min.z)/2, k=1024/lado;
  x.save(); x.shadowColor=M.cam.tipo==='plano'?'rgba(40,36,30,.34)':'rgba(40,36,30,.3)'; x.shadowBlur=M.cam.tipo==='plano'?12:70; x.shadowOffsetX=3000; x.lineCap='round'; x.lineJoin='round';
  if(M.cam.tipo==='plano'){ x.strokeStyle='#000'; x.lineWidth=Math.max(5,(M.fila[0]?.fora||3)*k*M.fileiras*.7); x.beginPath();
    for(let i=0;i<=240;i++){ const q=M.cam.at(i/240*M.cam.P); const X=(q.p[0]-cx)*k+512-3000, Z=(q.p[2]-cz)*k+512; i?x.lineTo(X,Z):x.moveTo(X,Z); } x.stroke(); }
  else { x.fillStyle='#000'; x.beginPath(); x.ellipse(512-3000,512,290,90,0,0,Math.PI*2); x.fill(); }
  x.restore(); sombraTex.needsUpdate=true;
  sombra.position.set(cx,caixa.min.y-0.02,cz); sombra.scale.set(lado,lado,1);
}

/* ---------- monta a peca ---------- */
let modelo=null, focoDetalhe=V(0,0,0), centro=V(0,0,0), raioPeca=100, ehAnel=false;
const m4=new THREE.Matrix4(), basis=new THREE.Matrix4(), rotY=new THREE.Matrix4(), esc=new THREE.Matrix4();
function quadroPonto(q,pos){ basis.makeBasis(V(...q.T),V(...q.U),V(...q.Z)); basis.setPosition(pos); return basis.clone(); }
const somar=(q,du,dz)=>V(q.p[0]+q.U[0]*du+q.Z[0]*dz,q.p[1]+q.U[1]*du+q.Z[1]*dz,q.p[2]+q.U[2]*du+q.Z[2]*dz);

function construir(c,M){
  if(modelo){ cena.remove(modelo); modelo.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.isInstancedMesh) o.dispose(); }); }
  modelo=new THREE.Group();
  const acab={polido:.14,acetinado:.34,fosco:.5,milgrain:.14}[c.acabamento]??.14;
  const corpo=OURO[c.ouro].clone(); corpo.roughness=acab;
  const crav=(c.ouro!=='branco'&&c.ouroCrav==='branco'?OURO.branco:OURO[c.ouro]).clone(); crav.roughness=acab;
  const cam=M.cam, anel=cam.tipo==='anel'; ehAnel=anel;

  /* altura de cada pedra acima do chao (ou do aro): a pedra deitada encosta o fundo no chao */
  const folgaChao={baixa:.1,media:.25,alta:.55}[c.altura]??.25;
  const elevar=d=>anel?0:d.pav*1.04+folgaChao;

  /* agrupa por formato: uma malha de pedra e uma de cravacao para cada */
  const grupos=new Map();
  const juntar=(forma,ct,cravacao,matriz)=>{ const k=forma+'|'+cravacao; if(!grupos.has(k)) grupos.set(k,{forma,cravacao,ref:0,itens:[]}); const g=grupos.get(k); g.ref=Math.max(g.ref,ct); g.itens.push({ct,matriz}); };
  for(const e of M.pedras){ const q=cam.at(e.s), mat=quadroPonto(q,somar(q,elevar(e.d),e.off)); mat.multiply(rotY.clone().makeRotationY(-e.ang*Math.PI/180)); juntar(e.forma,e.ct,c.cravacao,mat); }
  let ping=null;
  if(M.pingente){ const pg=M.pingente, q=cam.at(0); ping=pg; const pos=somar(q,elevar(pg.d),pg.dist), mat=quadroPonto(q,pos); mat.multiply(rotY.clone().makeRotationY(-Math.PI/2));
    juntar(pg.forma,pg.ct,['bezel','semi-bezel'].includes(c.cravacao)?'bezel':'quatro',mat); }

  for(const g of grupos.values()){
    const d=R.medidas(g.forma,g.ref), gG=gema(g.forma,d), gC=cabeca(g.forma,d,c,g.cravacao,M.folga);
    const mG=new THREE.InstancedMesh(gG,DIAMANTE,g.itens.length), mC=new THREE.InstancedMesh(gC,crav,g.itens.length);
    g.itens.forEach((it,i)=>{ const k=Math.cbrt(it.ct/g.ref); m4.copy(it.matriz).multiply(esc.makeScale(k,k,k)); mG.setMatrixAt(i,m4); mC.setMatrixAt(i,m4); });
    mG.computeBoundingSphere(); mC.computeBoundingSphere();
    modelo.add(mG,mC);
  }

  /* ---------- o que une as pedras ---------- */
  const partesCorpo=[], rigida=c.estrutura==='rigida'&&!anel;
  const W0=M.fila.length?Math.min(M.fila[0].d.L,M.fila[0].d.W):3;
  const rLiga=Math.min(.34,Math.max(.16,.055*W0))*(rigida?1.5:1);
  const barra=new THREE.CapsuleGeometry(1,1,3,8); barra.rotateZ(Math.PI/2);    /* comprimento total 3 em x */
  const ligs=[];
  const yLiga=e=>anel?-e.d.pav*.62:elevar(e.d)-e.d.pav*.58;
  if(!anel) for(const l of M.ligacoes){ const sm=(l.a.s+l.b.s)/2, q=cam.at(sm), compr=l.b.s-l.a.s, y=(yLiga(l.a)+yLiga(l.b))/2;
    for(let r=0;r<M.fileiras;r++){ const off=(r-(M.fileiras-1)/2)*(l.a.fora+Math.max(.2,M.folga));
      if(c.cravacao==='coroa-faca') ligs.push({q,y:y+.18,off,compr,raio:rLiga*1.5,faca:true});
      else if(rigida) for(const de of [.34,-.34]) ligs.push({q,y,off:off+de*l.a.fora,compr,raio:rLiga*.75});
      else ligs.push({q,y,off,compr,raio:rLiga}); } }
  /* fileiras: uma barra atravessada amarra as pedras de cada coluna */
  const travessas=[];
  if(M.fileiras>1) for(const e of M.fila){ const q=cam.at(e.s), larg=(M.fileiras-1)*(e.fora+Math.max(.2,M.folga)); travessas.push({q,y:yLiga(e),larg,raio:rLiga*.8}); }
  if(ligs.length||travessas.length){ const im=new THREE.InstancedMesh(barra,corpo,ligs.length+travessas.length), a=new THREE.Matrix4(); let i=0;
    for(const l of ligs){ const mt=quadroPonto(l.q,somar(l.q,l.y,l.off)); a.makeScale(l.compr/3,l.faca?l.raio*1.3:l.raio,l.faca?l.raio*.5:l.raio); im.setMatrixAt(i++,mt.multiply(a)); }
    for(const t of travessas){ const mt=quadroPonto(t.q,somar(t.q,t.y,0)); mt.multiply(rotY.clone().makeRotationY(Math.PI/2)); a.makeScale(t.larg/3,t.raio,t.raio); im.setMatrixAt(i++,mt.multiply(a)); }
    im.computeBoundingSphere(); modelo.add(im); }
  else barra.dispose();

  /* canaleta: dois trilhos que acompanham a peca */
  if(c.cravacao==='canaleta'){ const box=new THREE.BoxGeometry(1,1,1), n=M.pedras.length, im=new THREE.InstancedMesh(box,crav,n*2), a=new THREE.Matrix4(); let i=0;
    for(const e of M.pedras){ const q=cam.at(e.s), t=Math.max(.3,.09*Math.min(e.d.L,e.d.W)), h=e.d.pav*.62+e.d.coroa*.5, y=elevar(e.d)+e.d.coroa*.45-h/2;
      for(const s of [1,-1]){ const mt=quadroPonto(q,somar(q,y,e.off+s*(e.fora/2+t/2-.04))); a.makeScale(e.ao+M.folga+.6,h,t); im.setMatrixAt(i++,mt.multiply(a)); } }
    im.computeBoundingSphere(); modelo.add(im); }

  /* ---------- corrente ---------- */
  if(M.correntes.length){
    const fk=Math.min(1.5,Math.max(.8,W0*.2)), passo={elo:1.2,veneziana:1.05,bolinha:1.45}[c.corrente]*fk;
    let geo; if(c.corrente==='veneziana'){ geo=new THREE.BoxGeometry(.92*fk,.62*fk,.92*fk); }
    else if(c.corrente==='bolinha'){ geo=new THREE.SphereGeometry(.58*fk,10,7); }
    else { geo=new THREE.TorusGeometry(.56*fk,.17*fk,6,12); geo.scale(1.25,1,1); }
    const yC=.75*fk, itens=[];
    for(const tr of M.correntes){ const len=tr.s1-tr.s0, n=Math.max(1,Math.floor(len/passo));
      const y0=tr.a?yLiga(tr.a):yC, y1=tr.b?yLiga(tr.b):yC;
      for(let k=0;k<=n;k++){ const u=k/n, s=tr.s0+len*u, q=cam.at(s), bordo=Math.min(u*len,(1-u)*len), base=y0+(y1-y0)*u, y=base+(yC-base)*Math.min(1,bordo/7);
        itens.push({q,y,k}); } }
    const im=new THREE.InstancedMesh(geo,corpo,itens.length), a=new THREE.Matrix4();
    itens.forEach((it,i)=>{ const mt=quadroPonto(it.q,somar(it.q,it.y,0)); if(c.corrente==='elo'&&it.k%2) mt.multiply(a.makeRotationX(Math.PI/2)); else if(c.corrente==='elo') mt.multiply(a.makeRotationX(0)); im.setMatrixAt(i,mt); });
    im.computeBoundingSphere(); modelo.add(im);
  }

  /* ---------- aro do anel ---------- */
  if(anel){ const N=240, RI=cam.RI, t=cam.tBanda, maxFora=M.fila.length?Math.max(...M.fila.map(e=>e.fora)):3, larg=Math.min(8,Math.max(1.9,maxFora*(M.fileiras>1?M.fileiras:1)*.72));
    const S=20, pos=[], idx=[];
    for(let i=0;i<N;i++){ const f=i/N*Math.PI*2, cs=Math.cos(f), sn=Math.sin(f);
      for(let j=0;j<S;j++){ const a=j/S*Math.PI*2, ca=Math.cos(a), sa=Math.sin(a), nn=3.4, u=.5+.5*Math.sign(ca)*Math.abs(ca)**(2/nn), z=.5*Math.sign(sa)*Math.abs(sa)**(2/nn)*larg, r=RI+u*t; pos.push(r*sn,r*cs,z); } }
    for(let i=0;i<N;i++) for(let j=0;j<S;j++){ const a=i*S+j, b=((i+1)%N)*S+j, cc=((i+1)%N)*S+(j+1)%S, d=i*S+(j+1)%S; idx.push(a,b,d,b,cc,d); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); partesCorpo.push(g); }

  /* ---------- fecho e extensor ---------- */
  if(!anel){ const q=cam.at(cam.P/2), y=1.4;
    const colocar=(g,du=0,dz=0)=>{ g.applyMatrix4(quadroPonto(q,somar(q,du,dz))); partesCorpo.push(g); };
    if(c.fecho==='gaveta'){ colocar(new THREE.BoxGeometry(11,2.8,3.6),y+.2); colocar(new THREE.BoxGeometry(2.2,1,4.4),y+1.2); }
    else if(c.fecho==='lagosta'){ const a=new THREE.TorusGeometry(2.3,.5,8,20); a.rotateX(Math.PI/2); a.scale(1.5,1,1); colocar(a,y); colocar(new THREE.TorusGeometry(.8,.24,6,14),y,0); }
    else colocar(new THREE.BoxGeometry(4,1.2,Math.max(2.2,(M.fila[0]?.fora||3)*.7)),.9);
    const ext=+c.extensor*10;
    if(ext){ const lk=new THREE.TorusGeometry(.5,.14,5,10); lk.scale(1.25,1,1); const passo=1.05, n=Math.floor(ext/passo), im=new THREE.InstancedMesh(lk,corpo,n), a=new THREE.Matrix4();
      for(let i=0;i<n;i++){ const mt=quadroPonto(q,somar(q,.7,-(i*passo+3))); mt.multiply(rotY.clone().makeRotationY(Math.PI/2)); if(i%2) mt.multiply(a.makeRotationX(Math.PI/2)); im.setMatrixAt(i,mt); }
      im.computeBoundingSphere(); modelo.add(im); colocar(new THREE.SphereGeometry(.9,12,9),.9,-(ext+3.5)); }
  }

  /* pingente: argola que prende na peca */
  if(ping){ const q=cam.at(0), e=M.fila[Math.floor(M.fila.length/2)], dz=e.fora*M.fileiras*.5+.95, a=new THREE.TorusGeometry(1,.26,8,18); a.rotateY(Math.PI/2);
    a.applyMatrix4(quadroPonto(q,somar(q,Math.max(.9,yLiga(e)),dz))); partesCorpo.push(a); }

  if(partesCorpo.length) modelo.add(new THREE.Mesh(fundir(partesCorpo),corpo));
  cena.add(modelo);

  /* chao, enquadramento e foco */
  const caixa=new THREE.Box3().setFromObject(modelo);
  caixa.getCenter(centro); { const t=caixa.getSize(V(0,0,0)); raioPeca=Math.max(t.x,t.y,t.z)/2; }
  desenharSombra(M,caixa);
  const e0=M.fila[Math.floor(M.fila.length/2)];
  if(e0){ const q=cam.at(e0.s); focoDetalhe.copy(somar(q,elevar(e0.d),ping?ping.dist*.45:0)); } else focoDetalhe.copy(centro);
  larguraDetalhe=Math.max(21,e0?e0.fora*M.fileiras*2.2:21,ping?ping.dist*2.4:0);
  controles.target.copy(centro);
  reenquadrar();
  pedirQuadro();
}

/* ---------- cameras ---------- */
const camera=new THREE.PerspectiveCamera(26,1,1,4000), camDetalhe=new THREE.PerspectiveCamera(26,1,1,1000);
const controles=new OrbitControls(camera,renderer.domElement);
controles.enableDamping=true; controles.dampingFactor=.08; controles.enablePan=false; controles.minPolarAngle=.05; controles.maxPolarAngle=Math.PI/2-.04;
const dica=document.getElementById('dica-giro');
let mexeu=false, t0=performance.now(), distancia=200, pedido=false, visivel=true, qI={x:0,y:0,w:0,h:0}, qD={x:0,y:0,w:0,h:0}, larguraDetalhe=30;
controles.addEventListener('start',()=>{ mexeu=true; dica.style.opacity='0'; });
const semMovimento=matchMedia('(prefers-reduced-motion: reduce)').matches;
const polInicial=()=>ehAnel?1.28:.62;
const rotDetalhe=document.createElement('div'); rotDetalhe.className='vista'; rotDetalhe.innerHTML='<span id="rot-d"></span>';
const rotPeca=document.createElement('div'); rotPeca.className='vista vista-topo'; rotPeca.innerHTML='<span id="rot-p"></span>';
palco.append(rotDetalhe,rotPeca);

function posicionar(az,pol=polInicial()){ const T=controles.target; camera.position.set(T.x+distancia*Math.sin(pol)*Math.sin(az),T.y+distancia*Math.cos(pol),T.z+distancia*Math.sin(pol)*Math.cos(az)); camera.lookAt(T); }
function reenquadrar(){
  /* distancia que cabe a peca inteira no quadro, para qualquer tamanho */
  const a=camera.aspect||1, tan=Math.tan(13*Math.PI/180);
  distancia=raioPeca/(tan*Math.min(1,a))*(ehAnel?1.5:1.18);
  camera.near=Math.max(1,distancia*.05); camera.far=distancia*6; camera.updateProjectionMatrix();
  controles.minDistance=distancia*.55; controles.maxDistance=distancia*1.5;
  const az=mexeu?Math.atan2(camera.position.x-controles.target.x,camera.position.z-controles.target.z):.3;
  const pol=mexeu?Math.min(controles.maxPolarAngle,controles.getPolarAngle()):polInicial();
  posicionar(az,pol);
}
function posicionarDetalhe(){
  const az=Math.atan2(camera.position.x-controles.target.x,camera.position.z-controles.target.z), pol=ehAnel?.9:.72;
  const a=camDetalhe.aspect||1, tan=Math.tan(13*Math.PI/180), d=(larguraDetalhe/2)/(tan*Math.min(1,a));  /* distancia fixa: pedra pequena aparece pequena */
  camDetalhe.position.set(focoDetalhe.x+d*Math.sin(pol)*Math.sin(az),focoDetalhe.y+d*Math.cos(pol),focoDetalhe.z+d*Math.sin(pol)*Math.cos(az)); camDetalhe.lookAt(focoDetalhe);
  camDetalhe.near=Math.max(1,d*.2); camDetalhe.far=d*4; camDetalhe.updateProjectionMatrix();
}
function pedirQuadro(){ if(!pedido){ pedido=true; requestAnimationFrame(quadro); } }
const pintar=(q,cam,h)=>{ renderer.setViewport(q.x,h-q.y-q.h,q.w,q.h); renderer.setScissor(q.x,h-q.y-q.h,q.w,q.h); renderer.render(cena,cam); };
function quadro(){
  pedido=false;
  if(!mexeu) posicionar(semMovimento?.3:.45*Math.sin((performance.now()-t0)/2800)+.3);
  const mudou=controles.update(), h=palco.clientHeight;
  posicionarDetalhe(); renderer.setScissorTest(true); pintar(qI,camera,h); pintar(qD,camDetalhe,h); renderer.setScissorTest(false);
  if((!mexeu&&!semMovimento&&visivel)||mudou) pedirQuadro();
}
controles.addEventListener('change',pedirQuadro);
function ajustar(){ const w=palco.clientWidth, h=palco.clientHeight; renderer.setSize(w,h,false);
  const vao=8;
  if(w/h>1.3){ const m=Math.floor((w-vao)/2); qD={x:0,y:0,w:m,h}; qI={x:m+vao,y:0,w:w-m-vao,h}; }
  else { const m=Math.floor((h-vao)/2); qD={x:0,y:0,w,h:m}; qI={x:0,y:m+vao,w,h:h-m-vao}; }
  for(const [el,q] of [[rotPeca,qI],[rotDetalhe,qD]]) Object.assign(el.style,{left:q.x+'px',top:q.y+'px',width:q.w+'px',height:q.h+'px'});
  camera.aspect=qI.w/qI.h; camDetalhe.aspect=qD.w/qD.h; camera.updateProjectionMatrix(); camDetalhe.updateProjectionMatrix();
  reenquadrar(); pedirQuadro(); }
new ResizeObserver(ajustar).observe(palco);
new IntersectionObserver(([e])=>{ visivel=e.isIntersecting; if(visivel) pedirQuadro(); }).observe(palco);
ajustar();
window.PZ.aoMudar((c,M)=>{ construir(c,M);
  const PZ=window.PZ, e=M.fila[Math.floor(M.fila.length/2)];
  document.getElementById('rot-d').textContent='Detalhe'+(e?' · '+PZ.num(e.ct)+' ct':'');
  document.getElementById('rot-p').textContent='Peça inteira · '+PZ.medidaPeca(); });

/* imagem da peca para mandar junto do pedido: os dois quadros lado a lado */
window.PZ.foto=()=>{
  const w=palco.clientWidth, h=palco.clientHeight, W=1400, H=700, pr=renderer.getPixelRatio();
  renderer.setPixelRatio(1); renderer.setSize(W,H,false);
  const ai=camera.aspect, ad=camDetalhe.aspect; camera.aspect=1; camDetalhe.aspect=1; reenquadrar(); camera.updateProjectionMatrix(); camDetalhe.updateProjectionMatrix(); posicionarDetalhe();
  renderer.setScissorTest(true); pintar({x:0,y:0,w:696,h:H},camDetalhe,H); pintar({x:704,y:0,w:696,h:H},camera,H); renderer.setScissorTest(false);
  const url=renderer.domElement.toDataURL('image/jpeg',.92);
  camera.aspect=ai; camDetalhe.aspect=ad; renderer.setPixelRatio(pr); renderer.setSize(w,h,false); ajustar();
  return url;
};
