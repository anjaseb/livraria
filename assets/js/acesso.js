(function(){var $=function(i){return document.getElementById(i)},f=$('f'),m=$('m'),res=$('res');
async function entrar(c){m.textContent='A verificar...';
var x=await LM.post('/api/acesso',{codigo:c,dispositivo:LM.dev()}),j=x.j;
if(!j||j.erro){m.textContent=(j&&j.erro)||'Erro de ligação. Tente novamente.';res.hidden=true;f.hidden=false;return}
m.textContent='';try{localStorage.lm_cod=j.codigo}catch(e){}
f.hidden=true;res.hidden=false;
res.innerHTML='<h2>'+LM.e(j.titulo)+'</h2><p>Acesso activo neste dispositivo. Downloads restantes: <b id="rs">'+j.restantes+'</b></p><p><button id="dl">Descarregar PDF</button></p><p><a href="/ler/'+LM.e(j.slug)+'">Ler o livro completo</a> · <a href="#" id="sair">Sair deste dispositivo</a></p><p id="dm" aria-live="polite"></p>';
$('sair').onclick=function(e){e.preventDefault();try{localStorage.removeItem('lm_cod')}catch(x){}location.reload()};
$('dl').onclick=async function(){var d=$('dm');d.textContent='A preparar o ficheiro...';
var y=await LM.post('/api/download',{codigo:j.codigo,dispositivo:LM.dev()});
if(!y.j||y.j.erro){d.textContent=(y.j&&y.j.erro)||'Erro. Tente novamente.';return}
$('rs').textContent=y.j.restantes;d.textContent='Download iniciado.';location.href=y.j.url}}
f.onsubmit=function(e){e.preventDefault();entrar(f.codigo.value)};
var c='';try{c=localStorage.lm_cod||''}catch(e){}if(c)entrar(c)})();
