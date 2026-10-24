const sb=supabase.createClient(LM_CFG.url,LM_CFG.key);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const RES=['index','admin','privacidade','termos','acesso','ler','api','blog','404','sitemap','robots','assets','comprovativo','sobre','contactos','categoria','autor'];
const MAXMB=50,AVISOMB=25;
const CFG={books:{t:'Livros',f:[['titulo','Título'],['autor','Autor'],['preco','Preço (Kz). Use 0 para livro grátis','number'],['categoria','Categoria'],['isbn','ISBN'],['palavras','Palavras-chave do livro (separadas por vírgula; ex.: poesia angolana, história de Angola)'],['descricao','Descrição (quanto mais completa, melhor para o Google: tema, autor, país, época)','textarea'],['trecho','Trecho do livro (texto que o Google pode ler)','textarea'],['sobre_autor','Sobre o autor','textarea']],pdf:1},articles:{t:'Artigos',f:[['titulo','Título'],['resumo','Resumo'],['corpo','Texto do artigo','textarea']]}};
const SET=[['nome_legal','Nome da entidade responsável (aparece na Privacidade)'],['morada','Morada (opcional)'],['whatsapp','WhatsApp de apoio ao cliente (opcional; mostra um botão no site)'],['contacto_email','Email de contacto'],['instrucoes_pagamento','Instruções de pagamento (texto livre; aparecem ao cliente)','textarea'],['pag_entidade','Pagamento: Entidade (Multicaixa)'],['pag_referencia','Pagamento: Referência'],['pag_titular','Pagamento: titular da conta'],['pag_banco','Pagamento: banco'],['pag_iban','Pagamento: IBAN'],['pag_express','Pagamento: Multicaixa Express (número)'],['pag_outro','Pagamento: outras formas (ex.: transferência internacional)','textarea'],['palavras_chave','Palavras-chave gerais do site (separadas por vírgula)'],['sobre_texto','Texto da página Sobre (opcional)','textarea'],['home_titulo','Página inicial: título principal (opcional)'],['home_texto','Página inicial: texto por baixo do título (opcional)','textarea'],['home_rodape_titulo','Página inicial: título da secção final (opcional)'],['home_rodape_texto','Página inicial: texto da secção final (opcional)','textarea'],['google_verificacao','Código de verificação do Google Search Console (opcional)'],['bing_verificacao','Código de verificação do Bing Webmaster (opcional)'],['max_downloads','Downloads permitidos por código (por defeito 3)','number']];
const app=document.getElementById('app'),nav=document.getElementById('nav');
const slug=s=>{const r=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(!r)throw{message:'O título precisa de letras ou números.'};return RES.includes(r)?r+'-livro':r};
const up=async(b,f)=>{if(f.size>MAXMB*1048576)throw{message:`Ficheiro maior que ${MAXMB} MB (limite do Supabase grátis).`};const p=Date.now()+'-'+slug(f.name.replace(/\.[^.]+$/,''))+'.'+f.name.split('.').pop().toLowerCase();const{error}=await sb.storage.from(b).upload(p,f);if(error)throw error;return p};
const pubUrl=p=>sb.storage.from('capas').getPublicUrl(p).data.publicUrl;
const wa=t=>{let d=String(t||'').replace(/\D/g,'');return d.length===9?'244'+d:d};
const btn=(a,args,l)=>`<button data-a="${a}" data-p="${E(JSON.stringify(args))}">${l}</button>`;
// Todos os cliques passam por aqui (a CSP não permite onclick no HTML)
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;e.preventDefault();const f=A[b.dataset.a];if(f)f(...JSON.parse(b.dataset.p||'[]'))});
function login(){nav.innerHTML='';app.innerHTML='<form class="box" id="lf"><h1>Entrar</h1><input name="e" type="email" placeholder="Email" required><input name="p" type="password" placeholder="Palavra-passe" required><button>Entrar</button><p id="m"></p></form>';
lf.onsubmit=async v=>{v.preventDefault();const{error}=await sb.auth.signInWithPassword({email:lf.e.value,password:lf.p.value});error?m.textContent='Email ou palavra-passe incorrectos.':start()}}
async function start(){const{data}=await sb.auth.getSession();data.session?show('books'):login()}
async function tabs(){const{count}=await sb.from('alertas').select('id',{count:'exact',head:true}).eq('lido',false);const{count:cp}=await sb.from('pedidos').select('id',{count:'exact',head:true}).eq('estado','pendente').not('comprovativo_path','is',null);
nav.innerHTML=[['books','Livros'],['articles','Artigos'],['orders','Pedidos'+(cp?` (${cp} por confirmar)`:'')],['alerts','Alertas'+(count?` (${count})`:'')],['settings','Definições']].map(([t,l])=>`<a class="tabs" href="#" data-a="show" data-p="${E(JSON.stringify([t]))}">${l}</a>`).join('')+'<a class="tabs" href="#" data-a="sair" data-p="[]">Sair</a>'}
const EST={pendente:'Pendente',pago:'Pago',bloqueado:'Bloqueado'};
function acoes(o){let h='';
if(o.comprovativo_path)h+=btn('verComp',[o.comprovativo_path],'Ver comprovativo');
if(o.estado==='pendente')h+=btn('conf',[o.id,'confirmar'],'Confirmar pagamento e enviar código');
if(o.estado==='pago'){h+=btn('conf',[o.id,'reenviar'],'Reenviar código')+btn('setE',[o.id,'bloqueado'],'Bloquear');if(o.dispositivo)h+=btn('libertar',[o.id],'Libertar dispositivo')}
if(o.estado==='bloqueado')h+=btn('setE',[o.id,'pago'],'Reactivar');
return h+btn('corrigirEmail',[o.id,o.email],'Corrigir email')+btn('delPed',[o.id],'Apagar')}
async function show(t,edit){await tabs();
if(t==='orders'){const{data}=await sb.from('pedidos').select('*,books(titulo)').order('id',{ascending:false});
app.innerHTML='<h1>Pedidos</h1>'+((data||[]).length?'':'<p>Ainda não há pedidos.</p>')+(data||[]).map(o=>`<div class="ped"><b>#${String(o.id).padStart(9,'0')}</b> · ${E(EST[o.estado]||o.estado)}<br>${E(o.books?.titulo||'(livro apagado)')}<br>${E(o.email)} · ${E(o.telefone)}<br>Código: <b>${E(o.codigo)}</b>${o.codigo_enviado_em?' (enviado por email em '+E(new Date(o.codigo_enviado_em).toLocaleString('pt-AO'))+')':''}<br>Comprovativo: ${o.comprovativo_path?'recebido em '+E(new Date(o.comprovativo_em).toLocaleString('pt-AO')):'ainda não enviado'}<br>Dispositivo: ${o.dispositivo?'associado':'ainda não usado'} · Downloads: ${+o.downloads||0}<br>${acoes(o)}</div>`).join('');return}
if(t==='alerts'){const{data}=await sb.from('alertas').select('*,pedidos(id,email,telefone,books(titulo))').order('id',{ascending:false}).limit(100);
app.innerHTML='<h1>Alertas</h1><p>Tentativas de usar um código noutro dispositivo.</p>'+((data||[]).length?btn('lerTodos',[],'Marcar todos como lidos'):'<p>Sem alertas.</p>')+(data||[]).map(a=>`<div class="ped">${a.lido?'':'<b>NOVO</b> · '}${E(new Date(a.criado).toLocaleString('pt-AO'))}<br>Pedido #${String(a.pedido_id||0).padStart(9,'0')} · ${E(a.pedidos?.books?.titulo||'')}<br>${E(a.pedidos?.email||'')} · ${E(a.pedidos?.telefone||'')}<br><small>${E(a.detalhe)}</small><br>${a.lido?'':btn('lerAlerta',[a.id],'Marcar como lido')}${a.pedido_id?btn('setE',[a.pedido_id,'bloqueado','alerts'],'Bloquear código'):''}</div>`).join('');return}
if(t==='settings'){const{data}=await sb.from('settings').select('*');const v=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));
app.innerHTML='<h1>Definições</h1><form id="sf">'+SET.map(([k,l,ty])=>`<label>${l}${ty==='textarea'?`<textarea name="${k}" rows="5">${E(v[k])}</textarea>`:`<input name="${k}" type="${ty||'text'}" value="${E(v[k])}">`}</label>`).join('')+'<button>Guardar</button><p id="m"></p></form>';
sf.onsubmit=async e=>{e.preventDefault();m.textContent='A guardar...';const fd=new FormData(sf);const{error}=await sb.from('settings').upsert(SET.map(([k])=>({key:k,value:String(fd.get(k)||'').trim()})));if(error){m.textContent=error.message;return}alert('Guardado.');show('settings')};return}
const c=CFG[t],{data}=await sb.from(t).select('*').order('criado',{ascending:false}),e=edit?data.find(x=>x.id===edit):{};
const files=`<label>Capa (imagem)<input type="file" name="capa" accept="image/*"></label>`+(c.pdf?`<label>Livro completo em PDF (privado; livros pagos só saem com código; máx. ${MAXMB} MB, acima de ${AVISOMB} MB a marca pode falhar)<input type="file" name="pdf" accept="application/pdf"></label><label>Amostra para leitura grátis (livros pagos; ex.: 1.º capítulo). Sem amostra, o livro pago não tem leitura grátis<input type="file" name="leitura" accept="application/pdf"></label>`:'');
const jaPub=!!(e.publicado_em&&e.publicado),botoes=jaPub?'<button value="publicar">Guardar alterações</button><button value="rascunho" class="alt">Tirar do ar (guardar como rascunho)</button>':'<button value="rascunho" class="alt">Guardar rascunho</button><button value="publicar">Publicar</button>';
const row=x=>`<div class="row"><span>${x.rascunho?'<b>Rascunho</b> · '+E(x.titulo||'(sem título)'):`<a href="/${t==='books'?'':'blog/'}${E(x.slug)}" target="_blank">${E(x.titulo)}${x.publicado?'':' (oculto)'}</a>`}${t==='books'&&x.visualizacoes!=null?` <small>· ${+x.visualizacoes} visualizações · ${+x.curtidas} curtidas</small>`:''}</span><span>${t==='books'&&x.pdf_path?btn('verPdf',[x.pdf_path],'Ver PDF'):''}${btn('show',[t,x.id],x.rascunho?'Continuar':'Editar')}${x.rascunho?btn('pubRasc',[t,x.id],'Publicar'):btn('tog',[t,x.id,!x.publicado],x.publicado?'Ocultar':'Mostrar')}${btn('del',[t,x.id],'Apagar')}</span></div>`;
const rasc=data.filter(x=>x.rascunho),pubs=data.filter(x=>!x.rascunho);
app.innerHTML=`<h1>${c.t}</h1>${edit?`<p class="mini">A editar: ${E(e.titulo||'(sem título)')}${e.rascunho?' (rascunho)':''}</p>`:''}<form id="ff">${c.f.map(([k,l,ty])=>`<label>${l}${ty==='textarea'?`<textarea name="${k}" rows="7">${E(e[k])}</textarea>`:`<input name="${k}" type="${ty||'text'}" value="${E(e[k])}" ${k==='titulo'?'required':''}>`}</label>`).join('')}${files}<div>${botoes}</div><p class="mini">Rascunho: fica guardado só para si e não aparece no site. Publicar: a página fica online.</p><p id="m"></p></form>${rasc.length?`<h2>Rascunhos</h2>${rasc.map(row).join('')}`:''}<h2>Publicados</h2>${pubs.map(row).join('')||'<p>Ainda nada publicado.</p>'}`;
const ch='lm_rasc_'+t+'_'+(edit||'novo');
if(!edit){try{const s=JSON.parse(localStorage[ch]||'null');if(s){c.f.forEach(([k])=>{if(s[k]&&ff.elements[k])ff.elements[k].value=s[k]});m.textContent='Recuperei o texto que estava a escrever e não chegou a guardar. Escolha de novo os ficheiros.'}}catch(x){}}
ff.oninput=()=>{try{const s={};c.f.forEach(([k])=>s[k]=ff.elements[k].value);localStorage[ch]=JSON.stringify(s)}catch(x){}};
ff.onsubmit=async v=>{v.preventDefault();const rasc2=(v.submitter&&v.submitter.value)==='rascunho';m.textContent='A guardar...';try{const fd=new FormData(ff),r={};c.f.forEach(([k])=>r[k]=fd.get(k));
if(r.preco!==undefined)r.preco=+r.preco||0;const cf=fd.get('capa'),pf=c.pdf&&fd.get('pdf'),lf2=c.pdf&&fd.get('leitura');
if(cf&&cf.size)r.capa_url=pubUrl(await up('capas',cf));if(pf&&pf.size)r.pdf_path=await up('pdfs',pf);if(lf2&&lf2.size)r.leitura_path=await up('pdfs',lf2);
if(c.pdf&&!rasc2&&!(r.pdf_path||e.pdf_path))throw{message:'Para publicar, escolha o PDF do livro. Ou guarde como rascunho.'};
r.publicado=!rasc2;r.rascunho=rasc2;if(!rasc2&&!e.publicado_em)r.publicado_em=new Date().toISOString();
if(!e.publicado_em)r.slug=slug(r.titulo);
const{error}=edit?await sb.from(t).update(r).eq('id',edit):await sb.from(t).insert(r);if(error)throw error;
try{localStorage.removeItem(ch)}catch(x){}
alert(rasc2?'Rascunho guardado. Não aparece no site.':'Publicado. A página fica online já; a cache pode demorar até 5 minutos a mostrar alterações.');show(t)}catch(x){m.textContent=String(x.message).includes('duplicate')?'Já existe um item com este título.':x.message}}}
const A={show,
sair:()=>sb.auth.signOut().then(login),
setE:async(id,estado,voltar)=>{await sb.from('pedidos').update({estado}).eq('id',id);show(voltar||'orders')},
libertar:async id=>{if(confirm('Libertar o dispositivo? O próximo dispositivo a usar o código fica associado.')){await sb.from('pedidos').update({dispositivo:null,dispositivo_em:null}).eq('id',id);show('orders')}},
delPed:async id=>{if(confirm('Apagar este pedido?')){await sb.from('pedidos').delete().eq('id',id);show('orders')}},
lerAlerta:async id=>{await sb.from('alertas').update({lido:true}).eq('id',id);show('alerts')},
lerTodos:async()=>{await sb.from('alertas').update({lido:true}).eq('lido',false);show('alerts')},
tog:async(t,id,v)=>{await sb.from(t).update({publicado:v}).eq('id',id);show(t)},
del:async(t,id)=>{if(confirm('Apagar definitivamente?')){await sb.from(t).delete().eq('id',id);show(t)}},
conf:async(id,acao)=>{const{data}=await sb.auth.getSession();const r=await fetch('/api/confirmar',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({id,acao})});const j=await r.json().catch(()=>({}));
if(!r.ok)alert(j.erro||'Erro '+r.status);else if(j.enviado)alert('Código enviado para '+j.email+'.');else if(j.motivo==='sem_email')alert('Pagamento confirmado, mas o envio de email não está configurado na Vercel (SMTP_*). Envie este código ao cliente por outra via: '+j.codigo);else alert('Pagamento confirmado, mas o email falhou ('+(j.erro||'erro')+'). Código: '+j.codigo);show('orders')},
corrigirEmail:async(id,atual)=>{const n=prompt('Novo email do cliente:',atual);if(n&&/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(n.trim())){await sb.from('pedidos').update({email:n.trim().toLowerCase()}).eq('id',id);show('orders')}else if(n)alert('Email inválido.')},
verComp:async p=>{const{data,error}=await sb.storage.from('comprovativos').createSignedUrl(p,300);error?alert(error.message):window.open(data.signedUrl,'_blank','noopener')},
pubRasc:async(t,id)=>{const{data:x}=await sb.from(t).select('*').eq('id',id).single();
if(t==='books'&&!x.pdf_path){alert('Falta o PDF do livro. Abra "Continuar" e escolha o ficheiro.');return}
const{error}=await sb.from(t).update({publicado:true,rascunho:false,publicado_em:x.publicado_em||new Date().toISOString()}).eq('id',id);alert(error?error.message:'Publicado.');show(t)},
verPdf:async p=>{const{data,error}=await sb.storage.from('pdfs').createSignedUrl(p,300);error?alert(error.message):window.open(data.signedUrl,'_blank','noopener')}};
start();
