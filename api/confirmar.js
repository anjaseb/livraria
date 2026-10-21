import {q,db,json,cfg,S,adminReq,enviarCodigo} from './_lib.js';
// Só o administrador: confirma o pagamento e envia o código por email (ou reenvia).
export default async(req,res)=>{
if(req.method!=='POST')return res.status(405).end();
if(!await adminReq(req))return json(res,401,{erro:'Não autorizado.'});
const {id,acao}=req.body||{};
const [p]=await q(`pedidos?id=eq.${+id||0}&select=id,codigo,email,estado,books(titulo)`,S);
if(!p)return json(res,404,{erro:'Pedido não encontrado.'});
if(p.estado==='bloqueado')return json(res,409,{erro:'Pedido bloqueado. Reactive-o primeiro.'});
if(acao==='confirmar'&&p.estado==='pendente')await db(`pedidos?id=eq.${p.id}`,{m:'PATCH',b:{estado:'pago'}});
else if(acao!=='reenviar'||p.estado!=='pago')return json(res,400,{erro:'Acção inválida.'});
const c=await cfg(),r=await enviarCodigo({email:p.email,codigo:p.codigo,titulo:p.books?.titulo||'Livro',ref:'#'+String(p.id).padStart(9,'0'),max:Math.max(1,+c.max_downloads||3)});
if(r.ok)await db(`pedidos?id=eq.${p.id}`,{m:'PATCH',b:{codigo_enviado_em:new Date().toISOString()}});
json(res,200,{ok:true,enviado:r.ok,motivo:r.motivo,erro:r.erro,email:p.email,codigo:r.ok?undefined:p.codigo})};
