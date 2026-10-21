import {q,db,json,cfg,gerarCodigo,REGRAS} from './_lib.js';
export default async(req,res)=>{
if(req.method!=='POST')return res.status(405).end();
const {book_id,email,telefone,aceito}=req.body||{};
const em=String(email||'').trim().toLowerCase().slice(0,120),tel=String(telefone||'').trim().slice(0,20);
if(aceito!==true)return json(res,400,{erro:'Tem de aceitar os Termos e a Política de Privacidade.'});
if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em))return json(res,400,{erro:'Email inválido.'});
if(!/^[+0-9 ()-]{7,20}$/.test(tel))return json(res,400,{erro:'Telefone inválido.'});
const [b]=await q(`books?id=eq.${+book_id||0}&publicado=eq.true&select=id,titulo`);
if(!b)return json(res,404,{erro:'Livro não encontrado.'});
const c=await cfg(),base={instrucoes:c.instrucoes_pagamento||'',titulo:b.titulo};
const ex=await q(`pedidos?email=eq.${encodeURIComponent(em)}&book_id=eq.${b.id}&estado=eq.pendente&select=id&limit=1`,process.env.SUPABASE_SERVICE_KEY);
if(ex.length)return json(res,200,{...base,ref:'#'+String(ex[0].id).padStart(9,'0'),repetido:true});
const h=new Date(Date.now()-3600000).toISOString();
const rec=await q(`pedidos?email=eq.${encodeURIComponent(em)}&criado=gte.${h}&select=id`,process.env.SUPABASE_SERVICE_KEY);
if(rec.length>=5)return json(res,429,{erro:'Demasiados pedidos. Tente mais tarde.'});
for(let i=0;i<3;i++){
const r=await db('pedidos',{m:'POST',b:{book_id:b.id,email:em,telefone:tel,codigo:gerarCodigo(),aceitou_em:new Date().toISOString(),versao_regras:REGRAS},prefer:'return=representation'});
if(r.ok&&r.j?.[0])return json(res,200,{...base,ref:'#'+String(r.j[0].id).padStart(9,'0')});
if(r.s!==409)break}
json(res,500,{erro:'Não foi possível registar o pedido. Tente novamente.'})};
