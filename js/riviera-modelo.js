/* Riviera: a conta da peca, sem desenho. Medidas em milimetros.
   Daqui saem o tamanho de cada pedra, onde ela fica no caminho da peca, quantas cabem e o total de quilates.
   O 3D, a tela e o resumo leem o mesmo resultado, entao o numero mostrado e o numero desenhado. */
window.Riviera=(function(){

/* dim = [comprimento, largura] de uma pedra de 1 ct; o resto escala pela raiz cubica do peso */
const FORMAS={
  redondo:{t:'Redondo',dim:[6.5,6.5],corte:'brilhante',gira:false},
  oval:{t:'Oval',dim:[8.1,5.9],corte:'brilhante',gira:true},
  almofada:{t:'Almofada',dim:[5.9,5.6],corte:'brilhante',gira:true},
  princesa:{t:'Princesa',dim:[5.5,5.5],corte:'brilhante',gira:true,quadrada:true},
  esmeralda:{t:'Esmeralda',dim:[7,5],corte:'degrau',gira:true},
  baguete:{t:'Baguete',dim:[8.5,3.4],corte:'degrau',gira:true},
  gota:{t:'Gota',dim:[8.8,5.8],corte:'brilhante',gira:true,seta:true},
  marquise:{t:'Marquise',dim:[10,5],corte:'brilhante',gira:true},
  coracao:{t:'Coração',dim:[6.4,6.6],corte:'brilhante',gira:true,seta:true},
};
function medidas(forma,ct){
  const k=Math.cbrt(ct), [L,W]=FORMAS[forma].dim, base=Math.min(L,W)*k;
  return {L:L*k,W:W*k,pav:(FORMAS[forma].corte==='degrau'?0.38:0.43)*base,coroa:0.16*base};
}

/* contorno da pedra em unidade (caixa de -0,5 a 0,5). x = comprimento; a ponta da gota e do coracao fica em +x */
function normalizar(p){
  const xs=p.map(a=>a[0]), zs=p.map(a=>a[1]), x0=Math.min(...xs), x1=Math.max(...xs), z0=Math.min(...zs), z1=Math.max(...zs);
  return p.map(([x,z])=>[(x-x0)/(x1-x0)-0.5,(z-z0)/(z1-z0)-0.5]);
}
function poligono(v,porLado){
  const p=[]; v.forEach((a,i)=>{ const b=v[(i+1)%v.length]; for(let k=0;k<porLado;k++) p.push([a[0]+(b[0]-a[0])*k/porLado,a[1]+(b[1]-a[1])*k/porLado]); });
  return p;
}
const CACHE={};
function contorno(forma){
  if(CACHE[forma]) return CACHE[forma];
  const p=[], TAU=Math.PI*2;
  if(forma==='redondo'||forma==='oval') for(let i=0;i<16;i++){ const a=i/16*TAU; p.push([Math.cos(a),Math.sin(a)]); }
  else if(forma==='almofada') for(let i=0;i<16;i++){ const a=i/16*TAU, n=3.2, c=Math.cos(a), s=Math.sin(a); p.push([Math.sign(c)*Math.abs(c)**(2/n),Math.sign(s)*Math.abs(s)**(2/n)]); }
  else if(forma==='princesa') p.push(...poligono([[1,1],[-1,1],[-1,-1],[1,-1]],4));
  else if(forma==='baguete') p.push(...poligono([[1,1],[-1,1],[-1,-1],[1,-1]],1));
  else if(forma==='esmeralda'){ const c=0.26; p.push(...poligono([[1,1-c],[1-c,1],[-1+c,1],[-1,1-c],[-1,-1+c],[-1+c,-1],[1-c,-1],[1,-1+c]],1)); }
  else if(forma==='gota') for(let i=0;i<20;i++){ const a=i/20*TAU, u=(1-Math.cos(a))/2; p.push([Math.cos(a),Math.sin(a)*u**0.75]); }
  else if(forma==='marquise'){ for(let i=0;i<8;i++){ const u=1-i/4; p.push([u,1-u*u]); } for(let i=0;i<8;i++){ const u=-1+i/4; p.push([u,-(1-u*u)]); } }
  else if(forma==='coracao') for(let i=0;i<24;i++){ const t=i/24*TAU, x=16*Math.sin(t)**3, y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t); p.push([-y,x]); }
  return CACHE[forma]=normalizar(p);
}

/* caminho da peca: um percurso fechado com a frente em s=0. Em cada ponto: p (posicao), T (segue a peca), U (para onde a mesa da pedra olha), Z (para fora) */
function caminho(c,alturaAnel=0){
  if(c.peca==='anel'){
    const RI=(+c.aro+40)/(2*Math.PI), t=1.3, R=RI+t+alturaAnel, P=2*Math.PI*R;
    return {tipo:'anel',RI,tBanda:t,R,P,comp:P,at(s){ const f=s/R, sn=Math.sin(f), cs=Math.cos(f); return {p:[R*sn,R*cs,0],T:[cs,-sn,0],U:[sn,cs,0],Z:[0,0,1]}; }};
  }
  const comp=(c.peca==='colar'?+c.medidaColar:+c.medidaPulseira)*10;
  const f=c.peca==='pulseira'?{a:1,b:0.82,v:0}:{redonda:{a:1,b:0.94,v:0},u:{a:1,b:1.3,v:0},v:{a:1,b:1,v:0.5}}[c.curva]||{a:1,b:0.94,v:0};
  const M=1440, xs=[], zs=[];
  for(let i=0;i<M;i++){ const t=i/M*Math.PI*2, tw=t>Math.PI?t-2*Math.PI:t; xs.push(f.a*Math.sin(t)); zs.push(f.b*Math.cos(t)+f.v*Math.exp(-((tw/0.62)**2))); }
  let total=0; for(let i=0;i<M;i++){ const j=(i+1)%M; total+=Math.hypot(xs[j]-xs[i],zs[j]-zs[i]); }
  const esc=comp/total, cum=[0]; for(let i=0;i<M;i++){ const j=(i+1)%M; cum.push(cum[i]+Math.hypot(xs[j]-xs[i],zs[j]-zs[i])*esc); }
  return {tipo:'plano',P:comp,comp,at(s){
    let q=((s%comp)+comp)%comp, lo=0, hi=M;
    while(hi-lo>1){ const m=(lo+hi)>>1; if(cum[m]<=q) lo=m; else hi=m; }
    const j=(lo+1)%M, u=(q-cum[lo])/((cum[lo+1]-cum[lo])||1), x=(xs[lo]+(xs[j]-xs[lo])*u)*esc, z=(zs[lo]+(zs[j]-zs[lo])*u)*esc;
    const dx=xs[j]-xs[lo], dz=zs[j]-zs[lo], n=Math.hypot(dx,dz)||1, Tx=dx/n, Tz=dz/n;
    return {p:[x,0,z],T:[Tx,0,Tz],U:[0,1,0],Z:[-Tz,0,Tx]};   /* Z = T x U */
  }};
}

const EXTENSAO={inteira:1,'tres-quartos':0.75,metade:0.5,terco:0.34};
const FOLGA_CRAV={quatro:0.35,seis:0.35,duas:0.22,compartilhada:0.12,bezel:0.75,'semi-bezel':0.5,canaleta:0.04};
const FOLGA_ESPACO={justo:0,leve:0.6,aberto:1.8};
const FIM_GRAD={suave:0.6,media:0.35,forte:0.18};
const rad=g=>g*Math.PI/180;

/* quanto a pedra ocupa ao longo da peca e para fora, no angulo em que esta */
function ocupa(forma,d,ang){
  if(forma==='redondo') return {ao:d.L,fora:d.L};
  const c=Math.abs(Math.cos(rad(ang))), s=Math.abs(Math.sin(rad(ang))), reta=['princesa','esmeralda','baguete'].includes(forma);
  return reta?{ao:d.L*c+d.W*s,fora:d.L*s+d.W*c}:{ao:Math.hypot(d.L*c,d.W*s),fora:Math.hypot(d.L*s,d.W*c)};
}

function montar(c){
  const principal=+c.ct, formaP=c.forma;
  /* angulo da pedra: 0 = comprido na linha da peca; 90 = atravessada, com a ponta para fora */
  const angulo=(forma,i,lado)=>{
    if(!FORMAS[forma].gira) return 0;
    let a={'na-linha':0,atravessada:90,diagonal:45,'zigue-zague':i%2?-45:45}[c.posicao]??0;
    if(lado<0) a=180-a;     /* os dois lados se espelham a partir do centro */
    return a;
  };
  const dMax=medidas(formaP,principal);
  const ref=c.composicao==='central'?medidas(c.centralForma==='igual'?formaP:c.centralForma,+c.centralCt):dMax;
  const pavMax=Math.max(dMax.pav,ref.pav);
  const alturaAnel=c.peca==='anel'?Math.max(0.5,pavMax*0.55):0;
  const cam=caminho(c,alturaAnel), P=cam.P, fechoMeio=c.peca==='anel'?0:(c.fecho==='invisivel'?2.5:c.fecho==='lagosta'?5:7);
  const limite=(EXTENSAO[c.extensao]||1)*P/2-((c.extensao==='inteira')?fechoMeio:0);
  const estacoes=c.espaco==='estacoes';
  const folga=(FOLGA_CRAV[c.cravacao]??0.35)+(FOLGA_ESPACO[c.espaco]??0);
  const passoEstacao=c.peca==='anel'?3:c.peca==='pulseira'?10:18;

  const pedra=(i,s,lado)=>{
    let forma=formaP, ct=principal;
    if(c.composicao==='graduada'){ const u=Math.min(1,Math.abs(s)/Math.max(1,limite)); ct=principal*(1-u)+principal*(FIM_GRAD[c.gradFim]||0.35)*u; }
    if(c.composicao==='central'&&i===0){ ct=+c.centralCt; if(c.centralForma!=='igual') forma=c.centralForma; }
    if(c.composicao==='alternada'&&i%2) ct=principal*0.45;
    if(c.composicao==='intercalada'&&i%2){ forma=c.segunda; const larg=FORMAS[forma].dim[1]; ct=Math.min(principal*1.5,(dMax.W/larg)**3); }
    const d=medidas(forma,ct), ang=angulo(forma,i,lado), oc=ocupa(forma,d,ang);
    return {forma,ct,d,ang,ao:oc.ao,fora:oc.fora,lado,i};
  };
  /* caminha do centro para um lado ate acabar o trecho; depois espelha */
  const caminhar=(extra)=>{
    const lista=[]; let e=pedra(0,0,1); e.s=0;
    if(e.ao/2>limite) return lista;
    lista.push(e);
    for(let i=1;i<4000;i++){
      const ant=lista[lista.length-1], prox=pedra(i,ant.s+ant.ao,1);
      const s=ant.s+(ant.ao+prox.ao)/2+(estacoes?passoEstacao:folga)+extra;
      if(s+prox.ao/2>limite) break;
      prox.s=s; lista.push(prox);
    }
    return lista;
  };
  let lado=caminhar(0);
  if(c.extensao==='inteira'&&lado.length>1){   /* volta inteira: a sobra se reparte para fechar sem buraco */
    const ult=lado[lado.length-1], sobra=limite-(ult.s+ult.ao/2)-(c.peca==='anel'?folga/2:0);
    if(sobra>0) lado=caminhar(sobra/(lado.length-1));
  }
  const espelho=lado.slice(1).map(e=>{ const m=pedra(e.i,-e.s,-1); m.s=-e.s; return m; }).reverse();
  const fila=[...espelho,...lado];

  /* fileiras: a mesma sequencia, deslocada para fora e para dentro */
  const fileiras=(c.composicao==='central'||c.composicao==='intercalada'||estacoes)?1:+c.fileiras;
  const pedras=[];
  for(let r=0;r<fileiras;r++) for(const e of fila) pedras.push({...e,row:r,off:(r-(fileiras-1)/2)*(e.fora+Math.max(0.2,folga))});

  /* o que liga as pedras: encostadas = ligacao curta; longe = corrente */
  const ligacoes=[], correntes=[];
  for(let k=0;k<fila.length-1;k++){ const a=fila[k], b=fila[k+1], vao=(b.s-b.ao/2)-(a.s+a.ao/2);
    if(vao>2.5) correntes.push({s0:a.s+a.ao/2,s1:b.s-b.ao/2,a,b}); else ligacoes.push({a,b}); }
  if(c.peca!=='anel'&&fila.length){ const a=fila[fila.length-1], b=fila[0], ini=a.s+a.ao/2, fim=P+b.s-b.ao/2, m=fechoMeio;
    if(P/2-m-ini>0.5) correntes.push({s0:ini,s1:P/2-m,a,b:null});
    if(fim-(P/2+m)>0.5) correntes.push({s0:P/2+m,s1:fim,a:null,b}); }

  /* pingente, so no colar */
  let pingente=null;
  if(c.peca==='colar'&&c.pingente!=='sem'&&fila.length){ const d=medidas(c.pingente,+c.pingenteCt), e=fila[espelho.length], l=FORMAS[c.pingente].gira?d.L:d.L;
    pingente={forma:c.pingente,ct:+c.pingenteCt,d,ang:90,dist:e.fora*(fileiras*0.5+(fileiras>1?0.2:0))+l/2+2}; }

  const cts=pedras.map(p=>p.ct);
  const totalCt=cts.reduce((a,b)=>a+b,0)+(pingente?pingente.ct:0), n=pedras.length+(pingente?1:0);
  const ini=fila.length?fila[0].s-fila[0].ao/2:0, fim=fila.length?fila[fila.length-1].s+fila[fila.length-1].ao/2:0;
  return {cam,pedras,fila,ligacoes,correntes,pingente,fileiras,estacoes,alturaAnel,pavMax,fechoMeio,folga,
    stats:{n,totalCt,minCt:cts.length?Math.min(...cts):0,maxCt:cts.length?Math.max(...cts):0,trecho:fim-ini,comp:cam.comp}};
}

return {FORMAS,medidas,contorno,caminho,montar};
})();
