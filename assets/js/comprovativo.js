import {q,db,json,limite,S,U,K} from './_lib.js';
const EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'};
// Passo 1: valida pedido (número + email) e devolve ligação de envio única. Passo 2: confirma que o ficheiro chegou.
export default async(req,res)=>{
if(req.method!=='POST')return res.status(405).end();
const b=req.body||{},lim=await limite(req,'cp');
if(lim.bloq)return json(res,429,{erro:'Demasiadas tentativas. Aguarde 15 minutos.'});
const id=parseInt(String(b.ref||'').replace(/\D/g,''),10)||0,em=String(b.email||'').trim().toLowerCase();
const [p]=id?await q(`pedidos?id=eq.${id}&select=id,email,estado`,S):[];
if(!p||String(p.email).toLowerCase()!==em){await lim.falhou();return json(res,404,{erro:'Pedido não encontrado. Confirme o número e o email.'})}
if(p.estado!=='pendente')return json(res,409,{erro:p.estado==='pago'?'Este pedido já foi confirmado. O código foi enviado para o seu email.':'Este pedido está bloqueado. Contacte-nos.'});
if(b.passo===1){
const ext=EXT[b.tipo];
if(!ext||!(+b.tamanho>0)||+b.tamanho>5242880)return json(res,400,{erro:'Use uma imagem (JPG, PNG, WebP) ou PDF até 5 MB.'});
const path=`${p.id}/${Date.now()}.${ext}`;
const r=await fetch(`${U}/storage/v1/object/upload/sign/comprovativos/${path}`,{method:'POST',headers:{apikey:S,Authorization:`Bearer ${S}`,'Content-Type':'application/json'},body:'{}'});
const j=await r.json().catch(()=>({}));
if(!j.url)return json(res,500,{erro:'Não foi possível preparar o envio. Tente novamente.'});
return json(res,200,{url:`${U}/storage/v1${j.url}`,path,key:K})}
if(b.passo===2){
const path=String(b.path||'');
if(!new RegExp(`^${p.id}/\\d+\\.(jpg|png|webp|pdf)$`).test(path))return json(res,400,{erro:'Ficheiro inválido.'});
const f=await fetch(`${U}/storage/v1/object/authenticated/comprovativos/${path}`,{headers:{apikey:S,Authorization:`Bearer ${S}`,Range:'bytes=0-0'}});
if(!f.ok)return json(res,400,{erro:'O ficheiro não chegou. Tente enviar outra vez.'});
await db(`pedidos?id=eq.${p.id}`,{m:'PATCH',b:{comprovativo_path:path,comprovativo_em:new Date().toISOString()}});
return json(res,200,{ok:true})}
json(res,400,{erro:'Pedido inválido.'})};
