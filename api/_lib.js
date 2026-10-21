import {createHash,randomInt} from 'node:crypto';
export const U=process.env.SUPABASE_URL,K=process.env.SUPABASE_ANON_KEY,S=process.env.SUPABASE_SERVICE_KEY;
export const site=(process.env.SITE_URL||'https://livraria-michel.vercel.app').replace(/\/+$/,'');
export const REGRAS='2026-10-21';
export const RESERVADOS=['index','admin','privacidade','termos','acesso','ler','api','blog','404','sitemap','robots','assets','comprovativo','sobre','contactos','categoria','autor'];
export const slugif=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const db=async(p,{m='GET',b,key=S,prefer}={})=>{try{const r=await fetch(`${U}/rest/v1/${p}`,{method:m,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},body:b?JSON.stringify(b):undefined});const j=await r.json().catch(()=>null);return{ok:r.ok,s:r.status,j}}catch{return{ok:false,s:0,j:null}}};
export const q=async(p,key=K)=>{const r=await db(p,{key});return Array.isArray(r.j)?r.j:[]};
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const kz=n=>new Intl.NumberFormat('pt-AO').format(n||0)+' Kz';
export const clean=s=>String(s||'').replace(/[^a-z0-9-]/g,'');
export const wa=n=>{let d=String(n||'').replace(/\D/g,'');if(d.length===9)d='244'+d;return d};
export const sha=s=>createHash('sha256').update(String(s)).digest('hex');
export const json=(res,c,o)=>{res.setHeader('Cache-Control','no-store');res.status(c).json(o)};
export const ip=req=>String(req.headers['x-forwarded-for']||'').split(',')[0].trim().slice(0,45);
export const cfg=async()=>Object.fromEntries((await q('settings?select=key,value')).map(x=>[x.key,x.value]));
// Código de acesso: 10 caracteres sem 0/1/I/L/O, formato XXXXX-XXXXX
const AL='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const gerarCodigo=()=>{let s='LM-';for(let i=0;i<10;i++){s+=AL[randomInt(AL.length)];if(i===4)s+='-'}return s};
export const normCodigo=c=>{c=String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(c.length===12&&c.startsWith('LM'))c=c.slice(2);return c.length===10?'LM-'+c.slice(0,5)+'-'+c.slice(5):''};
export const signed=async(path,sec,nome)=>{const r=await fetch(`${U}/storage/v1/object/sign/pdfs/${path}`,{method:'POST',headers:{apikey:S,Authorization:`Bearer ${S}`,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:sec})});const j=await r.json().catch(()=>({}));return j.signedURL?`${U}/storage/v1${j.signedURL}${nome?`&download=${encodeURIComponent(nome)}`:''}`:''};
// Valida código + dispositivo. 1.º dispositivo fica associado; outro é negado e gera alerta ao administrador.
export const limite=async(req,pre)=>{const chave=pre+':'+(ip(req)||'?'),desde=new Date(Date.now()-900000).toISOString();
const f=await q(`tentativas?chave=eq.${encodeURIComponent(chave)}&criado=gte.${desde}&select=id`,S);
return{bloq:f.length>=10,falhou:async()=>{await db('tentativas',{m:'POST',b:{chave}});if(Math.random()<.05)await db(`tentativas?criado=lt.${new Date(Date.now()-86400000).toISOString()}`,{m:'DELETE'})}}};
export const adminReq=async req=>{const t=String(req.headers.authorization||'').replace(/^Bearer /,'');if(!t)return null;
const u=await fetch(`${U}/auth/v1/user`,{headers:{apikey:K,Authorization:`Bearer ${t}`}}).then(r=>r.ok?r.json():null).catch(()=>null);if(!u?.email)return null;
return(await q('admins?select=email',S)).some(x=>String(x.email).toLowerCase()===String(u.email).toLowerCase())?u:null};
export const enviarCodigo=async({email,codigo,titulo,ref,max})=>{
const {SMTP_HOST,SMTP_USER,SMTP_PASS,EMAIL_FROM,SMTP_PORT}=process.env;
if(!SMTP_HOST||!SMTP_USER||!SMTP_PASS)return{ok:false,motivo:'sem_email'};
const link=site+'/acesso',txt=`Olá!\n\nO pagamento do pedido ${ref} (${titulo}) foi confirmado.\n\nO seu código de acesso: ${codigo}\n\nComo usar:\n1. Abra ${link}\n2. Escreva o código e aceite as regras\n3. Descarregue o PDF ou leia o livro completo online\n\nImportante: o código é pessoal. Fica associado ao primeiro dispositivo em que o usar e permite até ${max} downloads. Se for usado noutro dispositivo, o acesso é negado.\n\nLivraria Michel`;
const html=`<p>Olá!</p><p>O pagamento do pedido <b>${esc(ref)}</b> (${esc(titulo)}) foi confirmado.</p><p>O seu código de acesso:</p><p style="font-size:22px;font-weight:bold;letter-spacing:2px">${esc(codigo)}</p><ol><li>Abra <a href="${link}">${link}</a></li><li>Escreva o código e aceite as regras</li><li>Descarregue o PDF ou leia o livro completo online</li></ol><p><b>Importante:</b> o código é pessoal. Fica associado ao primeiro dispositivo em que o usar e permite até ${max} downloads. Se for usado noutro dispositivo, o acesso é negado.</p><p>Livraria Michel</p>`;
try{const nm=await import('nodemailer'),porta=+SMTP_PORT||465;
await nm.default.createTransport({host:SMTP_HOST,port:porta,secure:porta===465,auth:{user:SMTP_USER,pass:SMTP_PASS}}).sendMail({from:EMAIL_FROM||SMTP_USER,to:email,subject:`O seu código de acesso: ${titulo}`,text:txt,html});
return{ok:true}}catch(e){return{ok:false,motivo:'falha',erro:String(e.message).slice(0,200)}}};
export const verificar=async(req,codigo,disp)=>{
const c=normCodigo(codigo);
if(!c||!/^[0-9a-f]{64}$/.test(String(disp||'')))return{c:400,erro:'Código ou dispositivo inválido.'};
const lim=await limite(req,'ip'),falhou=lim.falhou;
if(lim.bloq)return{c:429,erro:'Demasiadas tentativas. Aguarde 15 minutos e tente novamente, ou contacte o administrador.'};
const [p]=await q(`pedidos?codigo=eq.${c}&select=id,codigo,email,estado,dispositivo,downloads,marcado_path,books(titulo,slug,pdf_path)`,S);
if(!p){await falhou();return{c:404,erro:'Código não encontrado. Confirme se o escreveu correctamente.'}}
if(p.estado==='pendente')return{c:402,erro:'O pagamento ainda não foi confirmado. Quando for confirmado, este código fica activo.'};
if(p.estado!=='pago')return{c:403,erro:'Este código foi bloqueado. Contacte o administrador.'};
if(!p.books?.pdf_path)return{c:404,erro:'Este livro já não está disponível. Contacte o administrador.'};
const h=sha(disp);let dono=p.dispositivo;
if(!dono){const r=await db(`pedidos?id=eq.${p.id}&dispositivo=is.null`,{m:'PATCH',b:{dispositivo:h,dispositivo_em:new Date().toISOString()},prefer:'return=representation'});
if(Array.isArray(r.j)&&r.j.length)dono=h;else{const [x]=await q(`pedidos?id=eq.${p.id}&select=dispositivo`,S);dono=x?.dispositivo}}
if(dono!==h){
await falhou();
const desde=new Date(Date.now()-600000).toISOString();
const rec=await q(`alertas?pedido_id=eq.${p.id}&lido=eq.false&criado=gte.${desde}&select=id&limit=1`,S);
if(!rec.length)await db('alertas',{m:'POST',b:{pedido_id:p.id,tipo:'dispositivo_diferente',detalhe:`IP ${ip(req)} | ${String(req.headers['user-agent']||'').slice(0,200)}`}});
return{c:403,erro:'Acesso negado: este código já está a ser usado noutro dispositivo. O administrador foi informado.'}}
return{p}};
// PDF com marca de licença (email + código) em cada página. Gerado uma vez por pedido e guardado em pdfs/marcados/.
export const marcado=async p=>{
if(p.marcado_path)return p.marcado_path;
try{
const r=await fetch(`${U}/storage/v1/object/pdfs/${p.books.pdf_path}`,{headers:{apikey:S,Authorization:`Bearer ${S}`}});
if(!r.ok)return '';
const {PDFDocument,StandardFonts,rgb}=await import('pdf-lib');
const doc=await PDFDocument.load(new Uint8Array(await r.arrayBuffer()),{ignoreEncryption:true});
const f=await doc.embedFont(StandardFonts.Helvetica);
const t=`Licenciado para ${p.email} | Codigo ${p.codigo} | Livraria Michel`.replace(/[^\x20-\x7E]/g,''),sz=7;
for(const pg of doc.getPages()){const {width,height}=pg.getSize(),x=Math.max(8,(width-f.widthOfTextAtSize(t,sz))/2),o={size:sz,font:f,color:rgb(.45,.45,.45)};pg.drawText(t,{...o,x,y:10});pg.drawText(t,{...o,x,y:height-14})}
const out=await doc.save(),path=`marcados/${p.id}.pdf`;
const u=await fetch(`${U}/storage/v1/object/pdfs/${path}`,{method:'POST',headers:{apikey:S,Authorization:`Bearer ${S}`,'Content-Type':'application/pdf','x-upsert':'true'},body:out});
if(!u.ok)return '';
await db(`pedidos?id=eq.${p.id}`,{m:'PATCH',b:{marcado_path:path}});
return path}catch{return ''}};
