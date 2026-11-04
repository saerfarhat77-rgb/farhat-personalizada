/* Dados da marca: troque aqui e vale nas duas paginas. Numero do WhatsApp so com digitos (55 + DDD + numero). */
window.MARCA={nome:'Farhat',whatsapp:'',email:'',instagram:''};

/* pedido: nao guarda nada em servidor. Monta a mensagem com o resumo e o link da peca e abre o WhatsApp da loja */
window.montarPedido=function(tipo,PZ){
  const $=s=>document.querySelector(s), M=window.MARCA;
  const rod=$('#rodape-contato');
  if(rod) rod.innerHTML=[M.whatsapp&&`<a href="https://wa.me/${M.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>`,M.email&&`<a href="mailto:${M.email}">${M.email}</a>`,M.instagram&&`<a href="https://instagram.com/${M.instagram}" rel="noopener">Instagram @${M.instagram}</a>`].filter(Boolean).join('<br>');
  const msg=()=>{ const nome=$('#nome').value.trim(), obs=$('#obs').value.trim();
    return `Olá! ${nome?`Sou ${nome} e m`:'M'}ontei esta joia no site da ${M.nome}:\n\n${PZ.resumo()}\n${obs?`\nObservação: ${obs}\n`:''}\nVer a peça: ${location.href}`; };
  const aviso=$('#pedido-aviso');
  $('#pedir').onclick=async()=>{
    if(M.whatsapp){ window.open(`https://wa.me/${M.whatsapp}?text=${encodeURIComponent(msg())}`,'_blank','noopener'); aviso.textContent='Abrimos o WhatsApp com o seu pedido. Se quiser, salve a imagem e envie junto.'; return; }
    try{ await navigator.clipboard.writeText(msg()); aviso.textContent='Pedido copiado. Cole na conversa com a loja.'; }catch(_){ aviso.textContent=msg(); }
  };
  $('#salvar').onclick=()=>{ const u=PZ.foto&&PZ.foto(); if(!u){ aviso.textContent='Este aparelho não gerou a imagem. O resumo já descreve a peça inteira.'; return; }
    const a=document.createElement('a'); a.href=u; a.download=`${M.nome.toLowerCase()}-${tipo}.jpg`; document.body.append(a); a.click(); a.remove(); };
  $('#copiar').onclick=async()=>{ try{ await navigator.clipboard.writeText(location.href); aviso.textContent='Link copiado. Quem abrir vê esta mesma peça.'; }catch(_){ aviso.textContent=location.href; } };
};
