var D=(document.getElementById("dados")||{dataset:{}}).dataset,ID=+D.id,SLUG=D.slug;
var f=document.getElementById('f'),r=document.getElementById('r');
if(f)f.onsubmit=async function(e){e.preventDefault();
var em=f.email.value.trim();
if(em.toLowerCase()!==f.email2.value.trim().toLowerCase()){r.textContent='Os dois emails não coincidem. O código será enviado para este email, confirme-o.';return}
r.textContent='A registar o pedido...';
var x=await LM.post('/api/solicitar',{book_id:ID,email:em,telefone:f.telefone.value,aceito:f.aceito.checked}),j=x.j;
if(!j||j.erro){r.textContent=(j&&j.erro)||'Erro de ligação. Tente novamente.';return}
var h=(j.repetido?'<p>Já tinha um pedido pendente para este livro.</p>':'')+'<p><b>Pedido '+LM.e(j.ref)+' registado.</b></p>',n=1;
if(j.instrucoes)h+='<p>'+(n++)+'. Pague assim:<br>'+LM.e(j.instrucoes).replace(/\n/g,'<br>')+'</p>';
h+='<p>'+(n++)+'. Envie aqui o comprovativo de pagamento (imagem ou PDF):</p><input type="file" id="cf" accept="image/jpeg,image/png,image/webp,application/pdf"><button type="button" id="cb">Enviar comprovativo</button><p id="cm" aria-live="polite"></p>';
h+='<p>'+(n++)+'. Depois de confirmarmos o pagamento, enviamos o código para <b>'+LM.e(em)+'</b>. Use-o em <a href="/acesso">Entrar com código</a>.</p><p class="mini">Pode enviar o comprovativo mais tarde em <a href="/comprovativo">Enviar comprovativo</a>, com o número do pedido e o email.</p>';
r.innerHTML=h;f.hidden=true;
try{sessionStorage.lm_ref=j.ref;sessionStorage.lm_em=em}catch(e){}
document.getElementById('cb').onclick=function(){LM.enviarComp(j.ref,em,document.getElementById('cf').files[0],document.getElementById('cm'))}};
var s=document.getElementById('bq');if(s)s.onclick=function(){document.getElementById('d').open=true;document.getElementById('d').scrollIntoView({behavior:'smooth'})};
var g=document.getElementById('bg'),gm=document.getElementById('gm');if(g)g.onclick=async function(){gm.textContent='A preparar o ficheiro...';var x=await fetch('/api/gratis?slug='+encodeURIComponent(SLUG)).then(function(r){return r.json()}).catch(function(){return null});if(!x||x.erro){gm.textContent=(x&&x.erro)||'Erro. Tente novamente.';return}gm.textContent='Download iniciado.';location.href=x.url};
