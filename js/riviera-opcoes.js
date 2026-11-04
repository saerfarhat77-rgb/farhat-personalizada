/* Opcoes da riviera e estado da pagina. Cada campo diz quando aparece e o que nao combina. */
window.PZ=(function(){
const $=(s,r=document)=>r.querySelector(s), R=window.Riviera;
const topo=$('.topo'), alturaTopo=()=>document.documentElement.style.setProperty('--topo-h',topo.offsetHeight+'px');
new ResizeObserver(alturaTopo).observe(topo); alturaTopo();

const num=(x,c=2)=>x.toFixed(c).replace('.',',');
const mm=x=>x.toLocaleString('pt-BR',{maximumFractionDigits:1,minimumFractionDigits:1});
const op=(lista)=>lista.map(([v,t,s])=>({v,t,s}));
const PRONGS=['cartier','coroa','quatro','seis','duas','compartilhada'];
const PESOS=[0.03,0.05,0.07,0.10,0.15,0.20,0.25,0.30,0.40,0.50,0.70,1.00,1.50,2.00];
const pesoOp=PESOS.map(p=>({v:p.toFixed(2),t:num(p)+' ct',p}));
const FORMA_OP=Object.entries(R.FORMAS).map(([v,f])=>({v,t:f.t}));

/* desenhos: o contorno vem do mesmo dado que faz a pedra 3D */
const contornoD=(forma,cx,cy,w,h,rot=0)=>{ const a=rad=>rad*Math.PI/180, c=Math.cos(a(rot)), s=Math.sin(a(rot));
  return R.contorno(forma).map(([x,z],i)=>{ const X=x*w, Z=z*h; return (i?'L':'M')+(cx+X*c-Z*s).toFixed(1)+' '+(cy+X*s+Z*c).toFixed(1); }).join('')+'Z'; };
const svg=d=>`<svg viewBox="0 0 40 28" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const icForma=f=>{ const [L,W]=R.FORMAS[f].dim, k=20/Math.max(L,W); return svg(contornoD(f,20,14,L*k,W*k)); };
const bola=(x,r)=>`M${x-r} 14a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;
const ICONES={
  uniforme:svg([6,13,20,27,34].map(x=>bola(x,2.7)).join('')),
  graduada:svg([[4,1.5],[10,2.6],[20,5],[30,2.6],[36,1.5]].map(([x,r])=>bola(x,r)).join('')),
  central:svg([[5,2.2],[11,2.2],[20,5.2],[29,2.2],[35,2.2]].map(([x,r])=>bola(x,r)).join('')),
  alternada:svg([[5,3],[12,1.6],[20,3],[28,1.6],[35,3]].map(([x,r])=>bola(x,r)).join('')),
  intercalada:svg(bola(7,3)+bola(20,3)+bola(33,3)+'M11 12h5v4h-5zM24 12h5v4h-5z'),
  colar:svg('M8 5c0 13 7 20 12 20s12-7 12-20'),
  pulseira:svg('M20 5a13 9 0 1 0 0 18a13 9 0 1 0 0-18z'),
  anel:svg('M20 8a8.5 8.5 0 1 0 .01 0zM16 7l4-4 4 4'),
};
const icPos=a=>svg([8,20,32].map(x=>contornoD('oval',x,14,9,5.4,a==='zz'?(x===20?-45:45):a)).join(''));
const POS_IC={'na-linha':icPos(0),atravessada:icPos(90),diagonal:icPos(45),'zigue-zague':icPos('zz')};

const G={
  peca:{t:'Tipo de joia',tipo:'icone',o:[{v:'colar',t:'Colar',i:ICONES.colar},{v:'pulseira',t:'Pulseira',i:ICONES.pulseira},{v:'anel',t:'Anel',s:'aliança riviera',i:ICONES.anel}]},
  medidaColar:{t:'Comprimento',mostrar:c=>c.peca==='colar',o:[35,38,40,42,45,50,55,60,70,80].map(v=>({v:String(v),t:v+' cm'}))},
  medidaPulseira:{t:'Comprimento',mostrar:c=>c.peca==='pulseira',o:[14,15,16,17,18,19,20,21].map(v=>({v:String(v),t:v+' cm'}))},
  aro:{t:'Medida do aro',mostrar:c=>c.peca==='anel',o:[8,10,12,14,16,18,20,22,24,26,28,30].map(v=>({v:String(v),t:'Aro '+v}))},
  curva:{t:'Caimento no colo',mostrar:c=>c.peca==='colar',o:op([['redonda','Redondo','acompanha o pescoço'],['u','Em U','mais alongado'],['v','Em V','aponta para o centro']])},
  estrutura:{t:'Estrutura',mostrar:c=>c.peca!=='anel',o:op([['articulada','Articulada','cai solta'],['rigida','Rígida','mantém o formato']])},

  composicao:{t:'Distribuição das pedras',tipo:'icone',o:[
    {v:'uniforme',t:'Uniforme',s:'todas iguais',i:ICONES.uniforme},
    {v:'graduada',t:'Graduada',s:'cresce até o centro',i:ICONES.graduada},
    {v:'central',t:'Pedra central',s:'uma em destaque',i:ICONES.central},
    {v:'alternada',t:'Alternada',s:'grande e pequena',i:ICONES.alternada},
    {v:'intercalada',t:'Intercalada',s:'dois formatos',i:ICONES.intercalada}]},
  gradFim:{t:'Diferença entre o centro e as pontas',mostrar:c=>c.composicao==='graduada',o:op([['suave','Suave'],['media','Média'],['forte','Forte']])},
  centralCt:{t:'Peso da pedra central',mostrar:c=>c.composicao==='central',o:pesoOp.filter(o=>o.p>=0.2).concat([{v:'3.00',t:'3,00 ct',p:3},{v:'5.00',t:'5,00 ct',p:5}]),nao:(v,c)=>+v<=+c.ct},
  centralForma:{t:'Formato da pedra central',mostrar:c=>c.composicao==='central',o:[{v:'igual',t:'Igual às outras'},...FORMA_OP]},
  segunda:{t:'Segundo formato',mostrar:c=>c.composicao==='intercalada',o:FORMA_OP,nao:(v,c)=>v===c.forma},
  extensao:{t:'Até onde vão as pedras',o:op([['inteira','Volta inteira'],['tres-quartos','3/4 da peça'],['metade','Metade','só a frente'],['terco','1/3 da peça','só o centro']])},
  espaco:{t:'Espaço entre as pedras',o:op([['justo','Encostadas'],['leve','Pequeno'],['aberto','Aberto'],['estacoes','Estações','pedras soltas na corrente']]),
    nao:(v,c)=>v==='estacoes'&&['compartilhada','canaleta'].includes(c.cravacao)},
  fileiras:{t:'Fileiras',o:op([['1','Uma'],['2','Duas'],['3','Três']]),
    nao:(v,c)=>v!=='1'&&(['central','intercalada'].includes(c.composicao)||c.espaco==='estacoes'||(+c.ct>(v==='3'?0.25:0.5)))},

  forma:{t:'Formato da pedra',tipo:'icone',o:FORMA_OP.map(f=>({...f,i:icForma(f.v)}))},
  ct:{t:'Quilate de cada pedra',tipo:'peso',o:pesoOp,nota:'O total de quilates aparece embaixo da prévia e muda conforme o comprimento, o espaço e as fileiras.',
    nao:(v,c)=>(c.peca==='anel'&&+v>1)||(+c.fileiras===2&&+v>0.5)||(+c.fileiras===3&&+v>0.25)},
  posicao:{t:'Posição da pedra',tipo:'icone',mostrar:c=>R.FORMAS[c.forma].gira,o:[
    {v:'na-linha',t:'Na linha',s:'comprida no sentido da peça',i:POS_IC['na-linha']},
    {v:'atravessada',t:'Atravessada',s:'leste-oeste',i:POS_IC.atravessada},
    {v:'diagonal',t:'Diagonal',s:'todas inclinadas',i:POS_IC.diagonal},
    {v:'zigue-zague',t:'Zigue-zague',s:'uma para cada lado',i:POS_IC['zigue-zague']}],
    nao:(v,c)=>(['compartilhada','canaleta'].includes(c.cravacao)&&['diagonal','zigue-zague'].includes(v))||(R.FORMAS[c.forma].quadrada&&v==='atravessada')},

  cravacao:{t:'Cravação',o:op([['cartier','Garra Cartier','4 garras mais juntas'],['coroa','Garra coroa','mais metal, pedras mais afastadas'],['quatro','4 garras'],['seis','6 garras'],['duas','2 garras','nas laterais'],['compartilhada','Garra compartilhada','pedras mais juntas'],['bezel','Bezel','aro de ouro em volta'],['semi-bezel','Semi-bezel','aro nos dois lados'],['canaleta','Canaleta','entre dois trilhos']]),
    nao:(v,c)=>(v==='seis'&&!['redondo','oval','almofada'].includes(c.forma))||(['compartilhada','canaleta'].includes(v)&&(c.espaco==='estacoes'||['diagonal','zigue-zague'].includes(c.posicao)))||(v==='canaleta'&&['gota','marquise','coracao'].includes(c.forma))},
  ponta:{t:'Ponta da garra',mostrar:c=>PRONGS.includes(c.cravacao)&&c.cravacao!=='coroa',o:op([['redonda','Redonda'],['unha-gato','Unha de gato'],['quadrada','Quadrada'],['em-v','Em V']])},
  espessuraGarra:{t:'Espessura da garra',mostrar:c=>PRONGS.includes(c.cravacao),o:op([['fina','Fina'],['media','Média'],['robusta','Robusta']])},
  base:{t:'Base da pedra',o:op([['aberta','Aberta','entra luz por baixo'],['fechada','Fechada','fundo de ouro']])},
  altura:{t:'Altura da cravação',o:op([['baixa','Baixa'],['media','Média'],['alta','Alta']])},

  pingente:{t:'Pingente no centro',mostrar:c=>c.peca==='colar',o:[{v:'sem',t:'Sem pingente'},...FORMA_OP]},
  pingenteCt:{t:'Peso do pingente',mostrar:c=>c.peca==='colar'&&c.pingente!=='sem',o:pesoOp.filter(o=>o.p>=0.3).concat([{v:'3.00',t:'3,00 ct',p:3},{v:'5.00',t:'5,00 ct',p:5}])},

  ouro:{t:'Ouro 18k',tipo:'ouro',o:[{v:'branco',t:'Branco',c:'linear-gradient(135deg,#F4F4F2,#C9C9C6)'},{v:'amarelo',t:'Amarelo',c:'linear-gradient(135deg,#F1D88F,#C9A24E)'},{v:'rose',t:'Rosé',c:'linear-gradient(135deg,#F5CDBE,#C98F7A)'}]},
  ouroCrav:{t:'Cor da cravação',mostrar:c=>c.ouro!=='branco',o:op([['igual','Igual à peça'],['branco','Ouro branco','deixa a pedra mais branca']])},
  acabamento:{t:'Acabamento',o:op([['polido','Polido'],['acetinado','Acetinado'],['fosco','Fosco'],['milgrain','Milgrain','bolinhas em volta da pedra']])},
  corrente:{t:'Corrente',mostrar:c=>c.peca!=='anel'&&(c.extensao!=='inteira'||c.espaco==='estacoes'),o:op([['elo','Elo'],['veneziana','Veneziana'],['bolinha','Bolinha']])},
  fecho:{t:'Fecho',mostrar:c=>c.peca!=='anel',o:op([['gaveta','Gaveta','com trava'],['lagosta','Lagosta'],['invisivel','Invisível','escondido sob as pedras']])},
  extensor:{t:'Extensor',mostrar:c=>c.peca!=='anel',o:op([['0','Sem'],['3','3 cm'],['5','5 cm']])},
  gravacao:{t:'Gravação',tipo:'texto',nota:'Até 30 caracteres: nome, iniciais ou data. Fica no fecho ou por dentro do aro.'},
};
const SECOES=[
  ['Peça',['peca','medidaColar','medidaPulseira','aro','curva','estrutura']],
  ['Pedra',['forma','ct','posicao']],
  ['Formato da riviera',['composicao','gradFim','centralCt','centralForma','segunda','extensao','espaco','fileiras']],
  ['Cravação',['cravacao','ponta','espessuraGarra','base','altura']],
  ['Pingente',['pingente','pingenteCt']],
  ['Acabamento',['ouro','ouroCrav','acabamento','corrente','fecho','extensor','gravacao']],
];
const PADRAO={peca:'colar',medidaColar:'42',medidaPulseira:'17',aro:'14',curva:'redonda',estrutura:'articulada',
  forma:'redondo',ct:'0.10',posicao:'na-linha',composicao:'uniforme',gradFim:'media',centralCt:'1.00',centralForma:'igual',segunda:'baguete',
  extensao:'inteira',espaco:'justo',fileiras:'1',cravacao:'cartier',ponta:'redonda',espessuraGarra:'media',base:'aberta',altura:'media',
  pingente:'sem',pingenteCt:'1.00',ouro:'branco',ouroCrav:'igual',acabamento:'polido',corrente:'elo',fecho:'gaveta',extensor:'0',gravacao:''};
const cfg={...PADRAO};
const q=new URLSearchParams(location.search);
const temNoEndereco=[...q.keys()].some(k=>G[k]);
if(temNoEndereco){ for(const k in G){ const v=q.get(k); if(v==null) continue;
  if(G[k].tipo==='texto') cfg[k]=v.slice(0,30); else if(G[k].o.some(o=>o.v===v)) cfg[k]=v; } }
else try{ const r=JSON.parse(localStorage.getItem('farhat-riviera')||'null'); if(r) for(const k in G) if(r[k]!=null&&(G[k].tipo==='texto'||G[k].o.some(o=>o.v===r[k]))) cfg[k]=r[k]; }catch(_){}

const ouvintes=[];
const raiz=$('#opcoes');
raiz.innerHTML=SECOES.map(([titulo,campos])=>`<section class="secao-pz" data-secao><h2>${titulo}</h2>${campos.map(k=>{ const g=G[k];
  if(g.tipo==='texto') return `<div class="grupo" data-grupo="${k}"><h3>${g.t}</h3><input class="grav" id="gravacao" maxlength="30" placeholder="Ex.: A & M · 12.12.2026"><p class="nota">${g.nota}</p></div>`;
  const cls=g.tipo==='peso'?'escolhas pedra':g.tipo==='icone'?'escolhas':g.tipo==='ouro'?'escolhas ouro-pz':'chips-pz';
  return `<div class="grupo" data-grupo="${k}"><h3>${g.t} <span id="r-${k}"></span></h3><div class="${cls}" role="radiogroup" aria-label="${g.t}">${g.o.map(o=>{
    const ic=g.tipo==='ouro'?`<i style="background:${o.c}"></i>`:(o.i||'');
    return `<button type="button" role="radio" data-v="${o.v}">${ic}<span>${o.t}${o.s?`<small>${o.s}</small>`:''}</span></button>`; }).join('')}</div>${g.nota?`<p class="nota">${g.nota}</p>`:''}</div>`; }).join('')}</section>`).join('');

/* peso: desenho e medida seguem o formato escolhido */
let formaDesenhada=null;
function desenharPesos(){
  if(formaDesenhada===cfg.forma) return; formaDesenhada=cfg.forma;
  raiz.querySelectorAll('[data-grupo="ct"] button').forEach(b=>{ const p=+b.dataset.v, d=R.medidas(cfg.forma,p), s=3.4;
    const w=Math.max(d.L*s,3), h=Math.max(d.W*s,3), W=Math.max(w,h)+4;
    const medida=cfg.forma==='redondo'?mm(d.L)+' mm':mm(d.L)+' × '+mm(d.W)+' mm';
    b.innerHTML=`<svg class="peso-ic" viewBox="0 0 ${W} ${W}" style="width:${W}px;height:${W}px" aria-hidden="true"><path d="${contornoD(cfg.forma,W/2,W/2,w,h)}" fill="#fff" stroke="currentColor" stroke-width="1"/></svg><span>${num(p)} ct<small>${medida}</small></span>`; });
}

raiz.querySelectorAll('[data-grupo]').forEach(el=>{ const k=el.dataset.grupo, g=G[k];
  if(g.tipo==='texto'){ const i=el.querySelector('input'); i.value=cfg.gravacao; i.oninput=()=>{ cfg.gravacao=i.value.slice(0,30); atualizar(); }; return; }
  el.querySelectorAll('button').forEach(b=>b.onclick=()=>{ cfg[k]=b.dataset.v; ultimoCampo=k; atualizar(); }); });

let ultimoCampo=null;
const rotulo=(k,v)=>((G[k].o||[]).find(o=>o.v===v)||{}).t||v;
/* escolha nova que deixa outra sem sentido: a outra cai na primeira opcao que combina */
function compatibilizar(){
  for(let volta=0;volta<3;volta++) for(const k of ['ct','fileiras','espaco','cravacao','posicao','centralCt','segunda']){
    const g=G[k]; if(k===ultimoCampo) continue;
    if(g.nao&&g.nao(cfg[k],cfg)){ const ok=g.o.find(o=>!g.nao(o.v,cfg)); if(ok) cfg[k]=ok.v; }
  }
  if(!R.FORMAS[cfg.forma].gira) cfg.posicao='na-linha';
  if(cfg.peca==='anel') cfg.pingente='sem';
}
const valorPeso=p=>num(p)+' ct';
function calcular(){ return R.montar(cfg); }
function medidaPeca(){ return cfg.peca==='colar'?cfg.medidaColar+' cm':cfg.peca==='pulseira'?cfg.medidaPulseira+' cm':'aro '+cfg.aro; }
function resumo(M=calcular()){
  const P=[`${rotulo('peca',cfg.peca)} riviera de ${medidaPeca()}`];
  P.push(`${M.stats.n} ${M.stats.n===1?'diamante':'diamantes'}, ${num(M.stats.totalCt)} ct no total`);
  const graduado=M.stats.maxCt-M.stats.minCt>0.001;
  P.push(`pedras em ${rotulo('forma',cfg.forma).toLowerCase()}`+(graduado?` de ${valorPeso(M.stats.minCt)} a ${valorPeso(M.stats.maxCt)}`:` de ${valorPeso(+cfg.ct)}`));
  if(R.FORMAS[cfg.forma].gira) P.push(`posição ${rotulo('posicao',cfg.posicao).toLowerCase()}`);
  P.push(`formato ${rotulo('composicao',cfg.composicao).toLowerCase()}`);
  if(cfg.composicao==='central') P.push(`central de ${valorPeso(+cfg.centralCt)}`+(cfg.centralForma!=='igual'?` em ${rotulo('centralForma',cfg.centralForma).toLowerCase()}`:''));
  if(cfg.composicao==='intercalada') P.push(`intercalada com ${rotulo('segunda',cfg.segunda).toLowerCase()}`);
  P.push(`${rotulo('extensao',cfg.extensao).toLowerCase()}, espaço ${rotulo('espaco',cfg.espaco).toLowerCase()}`);
  if(M.fileiras>1) P.push(`${M.fileiras} fileiras`);
  const prong=PRONGS.includes(cfg.cravacao)&&cfg.cravacao!=='coroa';
  P.push(`cravação ${rotulo('cravacao',cfg.cravacao).toLowerCase()}`+(prong?` com ponta ${rotulo('ponta',cfg.ponta).toLowerCase()}`:'')+`, base ${rotulo('base',cfg.base).toLowerCase()}`);
  if(cfg.peca==='colar'){ P.push(`caimento ${rotulo('curva',cfg.curva).toLowerCase()}`); if(cfg.pingente!=='sem') P.push(`pingente ${rotulo('pingente',cfg.pingente).toLowerCase()} de ${valorPeso(+cfg.pingenteCt)}`); }
  if(cfg.peca!=='anel'){ P.push(`estrutura ${rotulo('estrutura',cfg.estrutura).toLowerCase()}, fecho ${rotulo('fecho',cfg.fecho).toLowerCase()}`); if(cfg.extensor!=='0') P.push(`extensor de ${cfg.extensor} cm`); if(G.corrente.mostrar(cfg)) P.push(`corrente ${rotulo('corrente',cfg.corrente).toLowerCase()}`); }
  P.push(`ouro ${rotulo('ouro',cfg.ouro).toLowerCase()} 18k`+(cfg.ouro!=='branco'&&cfg.ouroCrav==='branco'?' com cravação em ouro branco':'')+`, acabamento ${rotulo('acabamento',cfg.acabamento).toLowerCase()}`);
  if(cfg.gravacao) P.push(`gravação "${cfg.gravacao}"`);
  return P.join('; ')+'.';
}
let ultimoJson='';
function atualizar(){
  compatibilizar(); desenharPesos();
  raiz.querySelectorAll('[data-grupo]').forEach(el=>{ const k=el.dataset.grupo, g=G[k];
    el.hidden=!!(g.mostrar&&!g.mostrar(cfg));
    el.querySelectorAll('button').forEach(b=>{ const v=b.dataset.v, nao=!!(g.nao&&g.nao(v,cfg));
      b.setAttribute('aria-checked',String(cfg[k]===v)); b.disabled=nao; b.title=nao?'Não combina com as outras escolhas':''; });
    const r=$('#r-'+k); if(r) r.textContent=g.tipo==='texto'?'':rotulo(k,cfg[k]); });
  raiz.querySelectorAll('[data-secao]').forEach(s=>{ s.hidden=![...s.querySelectorAll('[data-grupo]')].some(e=>!e.hidden); });
  const M=calcular();
  $('#resumo').textContent=resumo(M);
  const d=R.medidas(cfg.forma,M.stats.maxCt), gr=M.stats.maxCt-M.stats.minCt>0.001;
  $('#ficha-n').textContent=M.stats.n;
  $('#ficha-ct').textContent=num(M.stats.totalCt);
  $('#ficha-pedra').textContent=gr?`${num(M.stats.minCt)} a ${num(M.stats.maxCt)}`:num(M.stats.maxCt);
  $('#ficha-mm').textContent=cfg.forma==='redondo'?mm(d.L)+' mm':mm(d.L)+' × '+mm(d.W)+' mm';
  const u=new URLSearchParams(); for(const k in G){ const v=cfg[k]; if(v&&v!==PADRAO[k]) u.set(k,v); else if(temNoEndereco&&v) u.set(k,v); }
  history.replaceState(null,'',(u.toString()?'?'+u.toString():location.pathname));
  const j=JSON.stringify(cfg); if(j!==ultimoJson){ ultimoJson=j; ouvintes.forEach(f=>f(cfg,M,ultimoCampo)); }
  try{ localStorage.setItem('farhat-riviera',j); }catch(_){}
}
atualizar();
return {cfg,G,resumo,rotulo,medidaPeca,num,mm,aoMudar:f=>{ ouvintes.push(f); f(cfg,calcular(),null); }};
})();
