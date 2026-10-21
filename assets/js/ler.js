(async function(){
var $=function(i){return document.getElementById(i)},slug=location.pathname.split('/').filter(Boolean).pop()||'';
var cv=$('cv'),pg=$('pg'),msg=$('msg'),box=$('folha');
$('vb').href='/'+encodeURIComponent(slug);cv.oncontextmenu=function(e){e.preventDefault()};
var r=null,cod='';try{cod=localStorage.lm_cod||''}catch(e){}
if(cod){var o=await LM.post('/api/leitura',{slug:slug,codigo:cod,dispositivo:LM.dev()});if(o.j&&!o.j.erro)r=o.j}
if(!r){try{r=await fetch('/api/leitura?slug='+encodeURIComponent(slug)).then(function(x){return x.json()})}catch(e){r=null}}
if(!r||r.erro){msg.textContent=(r&&r.erro)||'Não foi possível abrir o livro. Tente novamente.';$('t').textContent='Livro indisponível';return}
$('t').textContent=r.titulo;if(r.modo==='amostra')$('nota').innerHTML='Está a ler uma amostra. Para ler o livro completo, <a href="/'+LM.e(encodeURIComponent(slug))+'">peça o download</a> e entre com o seu código.';document.title=r.titulo+' | Ler online | Livraria Michel';
var pdf,n=1,busy=false,again=false,V='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
try{await new Promise(function(ok,no){var s=document.createElement('script');s.src=V+'pdf.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)});
pdfjsLib.GlobalWorkerOptions.workerSrc=V+'pdf.worker.min.js';pdf=await pdfjsLib.getDocument({url:r.url}).promise}
catch(e){msg.textContent='Não foi possível carregar o leitor. Verifique a ligação e recarregue a página.';return}
try{n=Math.min(Math.max(+localStorage['lm_p_'+slug]||1,1),pdf.numPages)}catch(e){}
$('tot').textContent='de '+pdf.numPages;pg.max=pdf.numPages;
async function draw(){if(busy){again=true;return}busy=true;
try{do{again=false;var p=await pdf.getPage(n),w=box.clientWidth-16,sc=w/p.getViewport({scale:1}).width,d=Math.min(window.devicePixelRatio||1,2),v=p.getViewport({scale:sc*d});
cv.width=v.width;cv.height=v.height;cv.style.width=w+'px';cv.style.height=(v.height/d)+'px';
await p.render({canvasContext:cv.getContext('2d'),viewport:v}).promise;pg.value=n;msg.textContent='';
try{localStorage['lm_p_'+slug]=n}catch(e){}}while(again)}
catch(e){msg.textContent='A ligação de leitura expirou. Recarregue a página para continuar.'}busy=false}
function ir(k){k=Math.min(Math.max(k|0,1),pdf.numPages);if(k!==n){n=k;draw();window.scrollTo(0,0)}else pg.value=n}
$('pv').onclick=function(){ir(n-1)};$('nx').onclick=function(){ir(n+1)};pg.onchange=function(){ir(+pg.value)};
document.onkeydown=function(e){if(e.target===pg)return;if(e.key==='ArrowRight')ir(n+1);if(e.key==='ArrowLeft')ir(n-1)};
window.onresize=draw;draw()})();
