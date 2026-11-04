/* Opcoes da riviera: so o que o cliente precisa decidir. O resto da peca fica no padrao (FIXO). */
window.PZ=(function(){
const $=(s,r=document)=>r.querySelector(s), R=window.Riviera;
const topo=$('.topo'), alturaTopo=()=>document.documentElement.style.setProperty('--topo-h',topo.offsetHeight+'px');
new ResizeObserver(alturaTopo).observe(topo); alturaTopo();

const num=(x,c=2)=>x.toFixed(c).replace('.',',');
const mm=x=>x.toLocaleString('pt-BR',{maximumFractionDigits:1,minimumFractionDigits:1});
const pesoTxt=p=>num(p,p<0.1?3:2);
const medidaTxt=(forma,ct)=>{ const d=R.medidas(forma,ct); return forma==='redondo'?mm(d.L)+' mm':mm(d.L)+' × '+mm(d.W)+' mm'; };

const FIXO={aro:'14',curva:'redonda',estrutura:'articulada',centralCt:'1.00',centralForma:'igual',segunda:'baguete',gradFim:'media',
  extensao:'inteira',espaco:'justo',fileiras:'1',ponta:'redonda',espessuraGarra:'media',base:'aberta',altura:'media',
  pingente:'sem',pingenteCt:'1.00',ouro:'branco',ouroCrav:'igual',acabamento:'polido',corrente:'elo',fecho:'gaveta',extensor:'0',gravacao:''};

/* desenhos: o contorno vem do mesmo dado que faz a pedra 3D */
const contornoD=(forma,cx,cy,w,h,rot=0)=>{ const a=rot*Math.PI/180, c=Math.cos(a), s=Math.sin(a);
  return R.contorno(forma).map(([x,z],i)=>{ const X=x*w, Z=z*h; return (i?'L':'M')+(cx+X*c-Z*s).toFixed(1)+' '+(cy+X*s+Z*c).toFixed(1); }).join('')+'Z'; };
const svg=d=>`<svg viewBox="0 0 40 28" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const icForma=f=>{ const [L,W]=R.FORMAS[f].dim, k=20/Math.max(L,W); return svg(contornoD(f,20,14,L*k,W*k)); };
const icPos=a=>svg([8,20,32].map(x=>contornoD('oval',x,14,9,5.4,a==='zz'?(x===20?-45:45):a)).join(''));
const bola=(x,r)=>`M${x-r} 14a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;

const G={
  cravacao:{t:'Modelo',o:[{v:'cartier',t:'Cartier'},{v:'coroa',t:'Coroa'},{v:'coroa-faca',t:'Coroa faca'},{v:'tres-grifas',t:'Três grifas'},{v:'xing',t:'Xing'}]},
  peca:{t:'Peça',o:[{v:'colar',t:'Colar'},{v:'pulseira',t:'Pulseira'}]},
  medidaColar:{t:'Tamanho da riviera',mostrar:c=>c.peca==='colar',o:[35,38,40,42,45,50,55,60,70,80].map(v=>({v:String(v),t:v+' cm'}))},
  medidaPulseira:{t:'Tamanho da riviera',mostrar:c=>c.peca==='pulseira',o:[14,15,16,17,18,19,20,21].map(v=>({v:String(v),t:v+' cm'}))},
  forma:{t:'Formato da pedra',tipo:'icone',o:Object.entries(R.FORMAS).map(([v,f])=>({v,t:f.t,i:icForma(v)})),nao:(v,c)=>c.cravacao==='tres-grifas'&&v!=='redondo'},
  posicao:{t:'Posição da pedra',tipo:'icone',mostrar:c=>R.FORMAS[c.forma].gira,o:[
    {v:'na-linha',t:'Na linha',i:icPos(0)},{v:'atravessada',t:'Atravessada',i:icPos(90)},{v:'diagonal',t:'Diagonal',i:icPos(45)},{v:'zigue-zague',t:'Zigue-zague',i:icPos('zz')}],
    nao:(v,c)=>R.FORMAS[c.forma].quadrada&&v==='atravessada'},
  composicao:{t:'Tamanho das pedras',tipo:'icone',o:[
    {v:'uniforme',t:'Regular',s:'todas iguais',i:svg([6,13,20,27,34].map(x=>bola(x,2.7)).join(''))},
    {v:'graduada',t:'Irregular',s:'maiores no centro',i:svg([[4,1.5],[10,2.6],[20,5],[30,2.6],[36,1.5]].map(([x,r])=>bola(x,r)).join(''))}]},
};
const PADRAO={cravacao:'cartier',peca:'colar',medidaColar:'42',medidaPulseira:'17',forma:'redondo',posicao:'na-linha',composicao:'uniforme',ct:'0.1000',ctFim:'0.0300'};
const cfg={...FIXO,...PADRAO};
const q=new URLSearchParams(location.search), CHAVES=Object.keys(PADRAO);
const valido=(k,v)=>(k==='ct'||k==='ctFim')?+v>0:G[k].o.some(o=>o.v===v);
if(CHAVES.some(k=>q.has(k))){ for(const k of CHAVES){ const v=q.get(k); if(v!=null&&valido(k,v)) cfg[k]=v; } }
else try{ const r=JSON.parse(localStorage.getItem('farhat-riviera-v2')||'null'); if(r) for(const k of CHAVES) if(r[k]!=null&&valido(k,r[k])) cfg[k]=r[k]; }catch(_){}

const raiz=$('#opcoes');
const grupoHtml=k=>{ const g=G[k], cls=g.tipo==='icone'?'escolhas':'chips-pz';
  return `<div class="grupo" data-grupo="${k}"><h3>${g.t} <span id="r-${k}"></span></h3><div class="${cls}" role="radiogroup" aria-label="${g.t}">${g.o.map(o=>`<button type="button" role="radio" data-v="${o.v}">${o.i||''}<span>${o.t}${o.s?`<small>${o.s}</small>`:''}</span></button>`).join('')}</div></div>`; };
raiz.innerHTML=`<section class="secao-pz">
  ${['cravacao','peca','medidaColar','medidaPulseira','forma','posicao','composicao'].map(grupoHtml).join('')}
  <div class="grupo tamanhos-pz"><label><span id="rot-ct">Tamanho da pedra</span><select class="sel" id="sel-ct"></select></label><label id="caixa-fim"><span>Menor pedra, nas pontas</span><select class="sel" id="sel-fim"></select></label></div>
  <div class="lista-tam" id="lista-tam" hidden></div>
  <p class="nota nota-forma" id="nota-forma" hidden>Em formatos diferentes do redondo, a quantidade de pedras é aproximada e o peso sai no orçamento.</p>
</section>`;
let ultimoCampo=null;
raiz.querySelectorAll('[data-grupo]').forEach(el=>{ const k=el.dataset.grupo;
  el.querySelectorAll('button').forEach(b=>b.onclick=()=>{ cfg[k]=b.dataset.v; ultimoCampo=k; atualizar(); }); });
const selCt=$('#sel-ct'), selFim=$('#sel-fim');
selCt.onchange=()=>{ cfg.ct=selCt.value; ultimoCampo='ct'; atualizar(); };
selFim.onchange=()=>{ cfg.ctFim=selFim.value; ultimoCampo='ctFim'; atualizar(); };

const rotulo=(k,v)=>((G[k].o||[]).find(o=>o.v===v)||{}).t||v;
const chaveCt=t=>t.ct.toFixed(4);
const proximo=(lista,ct)=>{ const alvo=R.mmDoPeso(+ct); return lista.reduce((a,b)=>Math.abs(R.mmDoPeso(b.ct)-alvo)<Math.abs(R.mmDoPeso(a.ct)-alvo)?b:a,lista[0]); };
/* mantem so tamanhos que existem no modelo e formato escolhidos */
function compatibilizar(){
  if(cfg.cravacao==='tres-grifas') cfg.forma='redondo';
  if(!R.FORMAS[cfg.forma].gira) cfg.posicao='na-linha';
  if(R.FORMAS[cfg.forma].quadrada&&cfg.posicao==='atravessada') cfg.posicao='na-linha';
  const T=R.tamanhosDe(cfg.cravacao,cfg.forma);
  const maiores=cfg.composicao==='graduada'?T.slice(1):T;
  cfg.ct=chaveCt(proximo(maiores,cfg.ct));
  const i=T.findIndex(t=>chaveCt(t)===cfg.ct), menores=T.slice(0,Math.max(1,i));
  if(cfg.composicao==='graduada') cfg.ctFim=chaveCt(+cfg.ctFim<+cfg.ct?proximo(menores,cfg.ctFim):menores[Math.floor(menores.length*.4)]);
  return {T,maiores,menores};
}
const opt=(t,forma,atual)=>{ const v=chaveCt(t); return `<option value="${v}"${v===atual?' selected':''}>${medidaTxt(forma,t.ct)} · ${pesoTxt(t.ct)} ct</option>`; };
function medidaPeca(){ return (cfg.peca==='colar'?cfg.medidaColar:cfg.medidaPulseira)+' cm'; }
function resumo(M=R.montar(cfg),curto=false){
  const s=M.stats, P=[`${rotulo('peca',cfg.peca)} riviera, modelo ${rotulo('cravacao',cfg.cravacao)}, ${medidaPeca()}`,`${s.n} diamantes, ${num(s.totalCt)} ct no total`];
  if(s.gramas) P.push(`cerca de ${num(s.gramas)} g de ouro`);
  P.push(`pedras em formato ${rotulo('forma',cfg.forma).toLowerCase()}`);
  if(R.FORMAS[cfg.forma].gira) P.push(`posição ${rotulo('posicao',cfg.posicao).toLowerCase()}`);
  if(cfg.composicao==='graduada'&&curto) P.push(`irregular, ${s.lista.length} tamanhos de pedra`);
  else if(cfg.composicao==='graduada') P.push('irregular, com estes tamanhos: '+s.lista.map(l=>`${l.n} de ${medidaTxt(cfg.forma,l.ct)} (${pesoTxt(l.ct)} ct)`).join(', '));
  else P.push(`todas de ${medidaTxt(cfg.forma,+cfg.ct)} (${pesoTxt(+cfg.ct)} ct)`);
  return P.join('; ')+'.';
}
const ouvintes=[]; let ultimoJson='';
function atualizar(){
  const {maiores,menores}=compatibilizar(), irregular=cfg.composicao==='graduada';
  selCt.innerHTML=maiores.map(t=>opt(t,cfg.forma,cfg.ct)).join('');
  selFim.innerHTML=menores.map(t=>opt(t,cfg.forma,cfg.ctFim)).join('');
  $('#rot-ct').textContent=irregular?'Maior pedra, no centro':'Tamanho da pedra';
  $('#caixa-fim').hidden=!irregular;
  raiz.querySelectorAll('[data-grupo]').forEach(el=>{ const k=el.dataset.grupo, g=G[k];
    el.hidden=!!(g.mostrar&&!g.mostrar(cfg));
    el.querySelectorAll('button').forEach(b=>{ const v=b.dataset.v, nao=!!(g.nao&&g.nao(v,cfg));
      b.setAttribute('aria-checked',String(cfg[k]===v)); b.disabled=nao; b.title=nao?'Não existe neste modelo':''; }); });
  const M=R.montar(cfg), s=M.stats;
  $('#resumo').textContent=resumo(M,true);
  $('#ficha-n').textContent=s.n;
  $('#ficha-ct').textContent=num(s.totalCt);
  $('#ficha-pedra').textContent=irregular?`${s.lista.length} tamanhos`:`${pesoTxt(+cfg.ct)} ct · ${medidaTxt(cfg.forma,+cfg.ct)}`;
  $('#ficha-g').textContent=s.gramas?num(s.gramas)+' g':'No orçamento';
  $('#nota-forma').hidden=cfg.forma==='redondo';
  /* irregular: todos os tamanhos que a peca usa, com a quantidade de cada */
  const lista=$('#lista-tam'); lista.hidden=!irregular;
  if(irregular) lista.innerHTML=`<table><caption>Todos os tamanhos desta peça</caption><thead><tr><th scope="col">Medida</th><th scope="col">Peso de cada</th><th scope="col">Quantidade</th></tr></thead><tbody>${s.lista.map(l=>`<tr><td>${medidaTxt(cfg.forma,l.ct)}</td><td>${pesoTxt(l.ct)} ct</td><td>${l.n}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td>${num(s.totalCt)} ct</td><td>${s.n}</td></tr></tfoot></table>`;
  const u=new URLSearchParams(); for(const k of CHAVES) if(cfg[k]!==PADRAO[k]&&!(k==='ctFim'&&!irregular)) u.set(k,cfg[k]);
  history.replaceState(null,'',u.toString()?'?'+u.toString():location.pathname);
  const j=JSON.stringify(cfg); if(j!==ultimoJson){ ultimoJson=j; ouvintes.forEach(f=>f(cfg,M,ultimoCampo)); }
  try{ localStorage.setItem('farhat-riviera-v2',j); }catch(_){}
}
atualizar();
return {cfg,G,resumo,rotulo,medidaPeca,num,mm,aoMudar:f=>{ ouvintes.push(f); f(cfg,R.montar(cfg),null); }};
})();
