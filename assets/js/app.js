(function(){
var mb=document.getElementById('mb'),mm=document.getElementById('mm');
function fecha(){if(mm){mm.hidden=true;mb.setAttribute('aria-expanded','false')}}
if(mb){mb.onclick=function(e){e.stopPropagation();var abre=mm.hidden;mm.hidden=!abre;mb.setAttribute('aria-expanded',String(abre))};document.addEventListener('click',fecha);document.addEventListener('keydown',function(e){if(e.key==='Escape')fecha()})}
window.LM={
e:function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})},
dev:function(){var d='';try{d=localStorage.lm_dev||''}catch(e){}
if(!/^[0-9a-f]{64}$/.test(d)){d=Array.prototype.map.call(crypto.getRandomValues(new Uint8Array(32)),function(b){return('0'+b.toString(16)).slice(-2)}).join('');try{localStorage.lm_dev=d}catch(e){}}return d},
enviarComp:async function(ref,email,file,out){
if(!file){out.textContent='Escolha o ficheiro do comprovativo.';return false}
if(['image/jpeg','image/png','image/webp','application/pdf'].indexOf(file.type)<0){out.textContent='Use uma imagem (JPG, PNG, WebP) ou PDF.';return false}
if(file.size>5242880){out.textContent='O ficheiro é maior que 5 MB.';return false}
out.textContent='A enviar o comprovativo...';
var a=await LM.post('/api/comprovativo',{passo:1,ref:ref,email:email,tipo:file.type,tamanho:file.size});
if(!a.j||a.j.erro){out.textContent=(a.j&&a.j.erro)||'Erro de ligação. Tente novamente.';return false}
var fd=new FormData();fd.append('cacheControl','3600');fd.append('',file);
var up=await fetch(a.j.url,{method:'PUT',headers:{apikey:a.j.key,Authorization:'Bearer '+a.j.key},body:fd}).catch(function(){return null});
if(!up||!up.ok){out.textContent='Não foi possível enviar o ficheiro. Tente novamente.';return false}
var b=await LM.post('/api/comprovativo',{passo:2,ref:ref,email:email,path:a.j.path});
if(!b.j||b.j.erro){out.textContent=(b.j&&b.j.erro)||'Erro. Tente novamente.';return false}
out.textContent='Comprovativo recebido. Assim que confirmarmos o pagamento, enviamos o código para o seu email.';return true},
post:function(u,b){return fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j}},function(){return{s:r.status,j:null}})},function(){return{s:0,j:null}})}};
var ok=false;try{ok=localStorage.lm_ok==='1'}catch(e){}
if(!ok){var a=document.createElement('div');a.id='aviso';a.innerHTML='<span>Este site guarda no seu dispositivo dados técnicos (página de leitura e um identificador do dispositivo, usado para contar visualizações e curtidas e para os códigos de acesso). Ao continuar, aceita a <a href="/privacidade">Privacidade</a> e os <a href="/termos">Termos</a>.</span><button type="button">Aceitar</button>';
a.querySelector('button').onclick=function(){try{localStorage.lm_ok='1'}catch(e){}a.remove()};document.body.appendChild(a)}
})();
