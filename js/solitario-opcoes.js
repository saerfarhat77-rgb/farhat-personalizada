/* opcoes do anel e estado da pagina. A foto final sai destas escolhas (texto); o 3D e so uma previa. */
window.PZ=(function(){
const $=(s,r=document)=>r.querySelector(s);
/* a previa gruda logo abaixo do topo (que tem altura diferente no celular) */
const topo=$('.topo'), alturaTopo=()=>document.documentElement.style.setProperty('--topo-h',topo.offsetHeight+'px');
new ResizeObserver(alturaTopo).observe(topo); alturaTopo();

/* diametro do brilhante redondo por peso (mm) */
const MM_PEDRA={10:3,15:3.4,20:3.8,25:4.1,30:4.3,40:4.8,50:5.2,60:5.4,70:5.8,75:5.9,90:6.2,100:6.5,150:7.4,200:8.2,300:9.3};
const linha=d=>`<svg viewBox="0 0 40 28" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
const op=(lista)=>lista.map(([v,t,s])=>({v,t,s}));
const BEZEL=c=>c.garras==='bezel'||c.coroa==='bezel'||c.coroa==='semi-bezel';
const ESTILO_SO_REDONDO=['faca','split','catedral','torcido','trancado','bypass','ondulado'];

/* campos: titulo, opcoes, quando aparece e o que nao combina */
const G={
  pts:{t:'Diamante central',tipo:'pedra',o:Object.entries(MM_PEDRA).map(([p,mm])=>({v:p,t:(p/100).toFixed(2).replace('.',',')+' ct',mm,s:mm.toLocaleString('pt-BR')+' mm'})),
       nota:'Acima de 3 ct, fale com a nossa equipe. O diamante é natural; cor e pureza são definidas com você no orçamento.'},
  garras:{t:'Quantidade de garras',o:op([['3','3 garras'],['4','4 garras'],['5','5 garras'],['6','6 garras'],['8','8 garras'],['duplas','Garras duplas'],['bezel','Bezel','sem garras']])},
  ponta:{t:'Formato das garras',mostrar:c=>!BEZEL(c),o:op([['redonda','Arredondada'],['unha-gato','Unha de gato'],['unha-aguia','Unha de águia'],['pontiaguda','Pontiaguda'],['finas','Fina e delicada'],['quadrada','Quadrada'],['achatada','Achatada'],['curvada','Curvada'],['em-v','Em V'],['cruzada','Cruzada'],['entrelacada','Entrelaçada'],['integrada','Integrada ao aro']])},
  espessuraGarra:{t:'Espessura das garras',mostrar:c=>!BEZEL(c),o:op([['fina','Fina'],['media','Média'],['robusta','Robusta']])},
  posicao:{t:'Posição das garras',mostrar:c=>!BEZEL(c)&&['4','8','duplas'].includes(c.garras),o:op([['alinhada','Alinhadas ao aro'],['diagonal','Na diagonal','em X']])},
  coroa:{t:'Modelo da coroa',o:op([['classica','Clássica','peg head'],['cesta','Cesta','basket'],['tulipa','Tulipa'],['trellis','Entrelaçada','trellis'],['floral','Floral'],['geometrica','Geométrica'],['catedral','Catedral'],['suspensa','Suspensa'],['bezel','Bezel'],['semi-bezel','Semi-bezel']]),
},
  galeria:{t:'Galeria',o:op([['nenhuma','Sem aro aparente'],['simples','Simples'],['dupla','Dupla'],['fechada','Fechada'],['vazada','Vazada'],['cravejada','Cravejada'],['milgrain','Com milgrain']]),
       nota:'A galeria é o aro de metal sob a pedra, entre as garras.'},
  altura:{t:'Altura do diamante',o:op([['baixa','Baixa'],['media','Média'],['alta','Alta']])},
  contorno:{t:'Formato do aro (vista de frente)',tipo:'icone',o:[
    {v:'redondo',t:'Redondo',i:linha('M20 4.5a9.5 9.5 0 1 1 0 19a9.5 9.5 0 1 1 0-19z')},
    {v:'abaulado',t:'Reto e abaulado',s:'laterais retas, base redonda',i:linha('M11 8c0-3 18-3 18 0v7c0 11-18 11-18 0z')},
    {v:'sextavado',t:'Sextavado',i:linha('M20 3l9 5v12l-9 5-9-5V8z')},
    {v:'quadrado',t:'Quadrado',i:linha('M12 5h16a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 28 23H12a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 12 5z')}],
    nota:'Por dentro o aro é sempre redondo; o formato escolhido é o contorno de fora.'},
  estilo:{t:'Modelo do aro',o:op([['classico','Clássico arredondado'],['meia-cana','Meia-cana'],['plano','Plano'],['faca','Fio de faca'],['afilado','Afilado'],['alargado','Alargado perto da pedra'],['split','Dividido','split shank'],['catedral','Catedral'],['torcido','Torcido'],['trancado','Trançado'],['bypass','Bypass'],['ondulado','Ondulado'],['largo','Largo contemporâneo']]),
       nao:(v,c)=>c.contorno!=='redondo'&&ESTILO_SO_REDONDO.includes(v)},
  largura:{t:'Largura do aro',o:['1.6','1.8','2.0','2.2','2.5','3.0','3.5'].map(v=>({v,t:v.replace('.',',')+' mm'}))},
  espessura:{t:'Espessura do aro',o:op([['fina','Fina'],['media','Média'],['robusta','Robusta']])},
  pave:{t:'Diamantes no aro',o:op([['nao','Não'],['sim','Sim']])},
  paveDist:{t:'Onde',mostrar:c=>c.pave==='sim',o:op([['perto','Perto da pedra'],['metade','Metade do aro'],['tres-quartos','3/4 do aro'],['completa','Volta completa']])},
  paveFileiras:{t:'Fileiras',mostrar:c=>c.pave==='sim',o:op([['1','Uma'],['2','Duas'],['3','Três']]),nao:(v,c)=>(v==='2'&&+c.largura<2.2)||(v==='3'&&+c.largura<3)},
  paveCravacao:{t:'Cravação',mostrar:c=>c.pave==='sim',o:op([['pave','Pavé'],['micro','Micro pavé'],['french','French pavé'],['canaleta','Canaleta'],['bezel','Bezel individual']])},
  halo:{t:'Halo (diamantes ao redor da pedra)',o:op([['sem','Sem halo'],['simples','Halo simples'],['duplo','Halo duplo'],['oculto','Halo oculto','sob a pedra'],['oculto-duplo','Halo oculto duplo']])},
  detalhes:{t:'Detalhes',multi:true,o:op([['lateral','Diamantes na lateral da coroa'],['surpresa','Diamante surpresa'],['ombros','Diamantes nos ombros'],['entre-garras','Diamantes entre as garras']]),nao:(v,c)=>v==='entre-garras'&&BEZEL(c)},
  acabamento:{t:'Acabamento do ouro',o:op([['polido','Polido espelhado'],['fosco','Fosco'],['acetinado','Acetinado'],['escovado','Escovado'],['martelado','Martelado'],['milgrain','Milgrain'],['misto','Misto']])},
  alianca:{t:'Vai usar com aliança?',o:op([['solitario','Só o solitário'],['rente','Com aliança reta','encaixe rente'],['curva','Com aliança curva']])},
  ouro:{t:'Ouro 18k',tipo:'ouro',o:[{v:'branco',t:'Branco',c:'linear-gradient(135deg,#F4F4F2,#C9C9C6)'},{v:'amarelo',t:'Amarelo',c:'linear-gradient(135deg,#F1D88F,#C9A24E)'},{v:'rose',t:'Rosé',c:'linear-gradient(135deg,#F5CDBE,#C98F7A)'}]},
  gravacao:{t:'Gravação interna',tipo:'texto',nota:'Até 30 caracteres: nome, iniciais, data ou uma frase curta.'},
};
const SECOES=[
  ['Diamante',['pts']],
  ['Garras',['garras','ponta','espessuraGarra','posicao']],
  ['Coroa',['coroa','galeria','altura']],
  ['Aro',['contorno','estilo','largura','espessura']],
  ['Brilhantes',['pave','paveDist','paveFileiras','paveCravacao','halo','detalhes']],
  ['Acabamento',['acabamento','alianca','ouro','gravacao']],
];

/* estado: comeca do endereco para dar para compartilhar o anel */
const PADRAO={pts:'50',garras:'6',ponta:'redonda',espessuraGarra:'media',posicao:'alinhada',coroa:'cesta',galeria:'simples',altura:'media',
  contorno:'redondo',estilo:'alargado',largura:'2.0',espessura:'media',pave:'nao',paveDist:'metade',paveFileiras:'1',paveCravacao:'pave',
  halo:'sem',detalhes:[],acabamento:'polido',alianca:'solitario',ouro:'amarelo',gravacao:''};
const cfg=JSON.parse(JSON.stringify(PADRAO));
const q=new URLSearchParams(location.search);
for(const k in G){ const v=q.get(k); if(v==null) continue;
  if(G[k].multi) cfg[k]=v.split(',').filter(x=>G[k].o.some(o=>o.v===x));
  else if(G[k].tipo==='texto') cfg[k]=v.slice(0,30);
  else if(G[k].o.some(o=>o.v===v)) cfg[k]=v; }
const ouvintes=[];

/* desenha as secoes */
const raiz=$('#opcoes');
raiz.innerHTML=SECOES.map(([titulo,campos])=>`<section class="secao-pz"><h2>${titulo}</h2>${campos.map(k=>{ const g=G[k];
  if(g.tipo==='texto') return `<div class="grupo" data-grupo="${k}"><h3>${g.t}</h3><input class="grav" id="gravacao" maxlength="30" placeholder="Ex.: A & M · 12.12.2026"><p class="nota">${g.nota}</p></div>`;
  const cls=g.tipo==='pedra'?'escolhas pedra':g.tipo==='icone'?'escolhas':g.tipo==='ouro'?'escolhas ouro-pz':'chips-pz';
  return `<div class="grupo" data-grupo="${k}"><h3>${g.t} <span id="r-${k}"></span></h3><div class="${cls}" role="${g.multi?'group':'radiogroup'}" aria-label="${g.t}">${g.o.map(o=>{
    const ic=g.tipo==='pedra'?`<i style="width:${6+o.mm*2.6}px;height:${6+o.mm*2.6}px"></i>`:g.tipo==='ouro'?`<i style="background:${o.c}"></i>`:(o.i||'');
    return `<button type="button" role="${g.multi?'checkbox':'radio'}" data-v="${o.v}">${ic}<span>${o.t}${o.s?`<small>${o.s}</small>`:''}</span></button>`;}).join('')}</div>${g.nota?`<p class="nota">${g.nota}</p>`:''}</div>`; }).join('')}</section>`).join('');
raiz.querySelectorAll('[data-grupo]').forEach(el=>{ const k=el.dataset.grupo, g=G[k];
  if(g.tipo==='texto'){ const i=el.querySelector('input'); i.value=cfg.gravacao; i.oninput=()=>{ cfg.gravacao=i.value.slice(0,30); atualizar(false); }; return; }
  el.querySelectorAll('button').forEach(b=>b.onclick=()=>{ const v=b.dataset.v; ultimoFoco=CABECA.includes(k)?'cabeca':'aro'; ultimoCampo=k;
    if(g.multi){ cfg[k]=cfg[k].includes(v)?cfg[k].filter(x=>x!==v):[...cfg[k],v]; }
    else cfg[k]=v;
    atualizar(true); }); });

/* o que a previa deve mostrar de perto depois de cada escolha */
const CABECA=['pts','garras','ponta','espessuraGarra','posicao','coroa','galeria','altura','halo','detalhes'];
let ultimoFoco=null, ultimoCampo=null;
const rotulo=(k,v)=>((G[k].o||[]).find(o=>o.v===v)||{}).t||v;
/* combinacoes: bezel nas garras = coroa bezel; aro facetado aceita so os modelos simples; pave cabe na largura */
function compatibilizar(){
  /* bezel nas garras e coroa bezel andam juntos; vale a escolha que a cliente acabou de fazer */
  const coroaBezel=['bezel','semi-bezel'].includes(cfg.coroa);
  if(ultimoCampo==='garras'){ if(cfg.garras==='bezel'&&!coroaBezel) cfg.coroa='bezel'; if(cfg.garras!=='bezel'&&coroaBezel) cfg.coroa='cesta'; }
  else if(ultimoCampo==='coroa'){ if(coroaBezel&&cfg.garras!=='bezel') cfg.garras='bezel'; if(!coroaBezel&&cfg.garras==='bezel') cfg.garras='6'; }
  else { if(cfg.garras==='bezel'&&!coroaBezel) cfg.coroa='bezel'; if(coroaBezel&&cfg.garras!=='bezel') cfg.garras='bezel'; }
  for(const k of ['estilo','paveFileiras','coroa']) if(G[k].nao&&G[k].nao(cfg[k],cfg)) cfg[k]=G[k].o.find(o=>!G[k].nao(o.v,cfg)).v;
  cfg.detalhes=cfg.detalhes.filter(v=>!(G.detalhes.nao&&G.detalhes.nao(v,cfg)));
}
function resumo(){
  const partes=[`Diamante natural de ${rotulo('pts',cfg.pts)}`];
  partes.push(BEZEL(cfg)?`cravado em ${rotulo('coroa',cfg.coroa).toLowerCase()}`:`${rotulo('garras',cfg.garras).toLowerCase()} ${rotulo('ponta',cfg.ponta).toLowerCase()}s em coroa ${rotulo('coroa',cfg.coroa).toLowerCase()}`);
  partes.push(`galeria ${rotulo('galeria',cfg.galeria).toLowerCase()}, altura ${rotulo('altura',cfg.altura).toLowerCase()}`);
  partes.push(`aro ${rotulo('contorno',cfg.contorno).toLowerCase()} ${rotulo('estilo',cfg.estilo).toLowerCase()} de ${rotulo('largura',cfg.largura)}`);
  if(cfg.pave==='sim') partes.push(`${rotulo('paveFileiras',cfg.paveFileiras).toLowerCase()} ${cfg.paveFileiras==='1'?'fileira':'fileiras'} de diamantes (${rotulo('paveCravacao',cfg.paveCravacao).toLowerCase()}) ${rotulo('paveDist',cfg.paveDist).toLowerCase()}`);
  if(cfg.halo!=='sem') partes.push(rotulo('halo',cfg.halo).toLowerCase());
  if(cfg.detalhes.length) partes.push(cfg.detalhes.map(v=>rotulo('detalhes',v).toLowerCase()).join(', '));
  partes.push(`acabamento ${rotulo('acabamento',cfg.acabamento).toLowerCase()}, ouro ${rotulo('ouro',cfg.ouro).toLowerCase()} 18k`);
  if(cfg.gravacao) partes.push(`gravação "${cfg.gravacao}"`);
  return partes.join('; ')+'.';
}
/* o que a previa 3D sabe desenhar */
function cfg3d(){
  const ponta={'unha-gato':'pontuda','unha-aguia':'pontuda',pontiaguda:'pontuda','em-v':'pontuda',quadrada:'achatada',achatada:'achatada'}[cfg.ponta]||'redonda';
  return {foco:ultimoFoco, aro:cfg.contorno==='redondo'&&cfg.estilo==='alargado'?'ombros':cfg.contorno, estilo:cfg.estilo, pontaTipo:cfg.ponta,
    coroa:cfg.coroa, galeria:cfg.galeria, acabamento:cfg.acabamento, detalhes:[...cfg.detalhes], fileiras:+cfg.paveFileiras,
    n:+cfg.garras||6, duplas:cfg.garras==='duplas', bezel:BEZEL(cfg), diagonal:cfg.posicao==='diagonal', ponta,
    gS:{fina:0.8,media:1,robusta:1.25}[cfg.espessuraGarra],
    trilhos:{nenhuma:0,simples:1,dupla:2,fechada:1,vazada:1,cravejada:1,milgrain:1}[cfg.galeria], altura:cfg.altura,
    pts:cfg.pts, ouro:cfg.ouro, pave:cfg.pave==='sim', paveLim:{perto:0.12,metade:0.27,'tres-quartos':0.38,completa:0.5}[cfg.paveDist],
    halo:cfg.halo, wS:+cfg.largura/2, tS:{fina:0.85,media:1,robusta:1.22}[cfg.espessura]};
}
let ultimo3d='';
function atualizar(mexeu3d){
  compatibilizar();
  raiz.querySelectorAll('[data-grupo]').forEach(el=>{ const k=el.dataset.grupo, g=G[k];
    el.hidden=!!(g.mostrar&&!g.mostrar(cfg));
    el.querySelectorAll('button').forEach(b=>{ const v=b.dataset.v, nao=!!(g.nao&&g.nao(v,cfg));
      b.setAttribute('aria-checked',String(g.multi?cfg[k].includes(v):cfg[k]===v)); b.disabled=nao; b.title=nao?'Não combina com as outras escolhas':''; });
    const r=$('#r-'+k); if(r) r.textContent=g.multi?(cfg[k].length?cfg[k].length+' escolhido'+(cfg[k].length>1?'s':''):''):g.tipo==='texto'?'':rotulo(k,cfg[k]); });
  $('#resumo').textContent=resumo();
  const u=new URLSearchParams(location.search); for(const k in G){ const v=cfg[k]; if(Array.isArray(v)) v.length?u.set(k,v.join(',')):u.delete(k); else v?u.set(k,v):u.delete(k); }
  history.replaceState(null,'','?'+u.toString()+location.hash);
  const c3=cfg3d(), j=JSON.stringify(c3); if(j!==ultimo3d){ ultimo3d=j; ouvintes.forEach(f=>f(c3)); }
  try{ localStorage.setItem('farhat-solitario',JSON.stringify(cfg)); }catch(_){}
}
/* volta ao anel que estava montando, se abrir sem nada no endereco */
if(![...q.keys()].some(k=>G[k])) try{ const r=JSON.parse(localStorage.getItem('farhat-solitario')||'null'); if(r) for(const k in G) if(r[k]!=null) cfg[k]=r[k]; }catch(_){}
const OPC={pts:G.pts.o};
$('#gravacao').value=cfg.gravacao;
atualizar(true);
return {cfg, OPC, G, resumo, rotulo, aoMudar:f=>{ouvintes.push(f); f(cfg3d());}};
})();
