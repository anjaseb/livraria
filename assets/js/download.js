import {verificar,json,cfg,db,signed,marcado} from './_lib.js';
export default async(req,res)=>{
if(req.method!=='POST')return res.status(405).end();
const {codigo,dispositivo}=req.body||{};
const v=await verificar(req,codigo,dispositivo);
if(v.erro)return json(res,v.c,{erro:v.erro});
const {p}=v,max=Math.max(1,+(await cfg()).max_downloads||3);
if(p.downloads>=max)return json(res,429,{erro:`Limite de ${max} downloads atingido. Contacte o administrador.`});
const path=await marcado(p);
if(!path)return json(res,500,{erro:'Não foi possível preparar o ficheiro. Contacte o administrador.'});
const u=await db(`pedidos?id=eq.${p.id}&downloads=eq.${p.downloads}`,{m:'PATCH',b:{downloads:p.downloads+1},prefer:'return=representation'});
if(!Array.isArray(u.j)||!u.j.length)return json(res,409,{erro:'Tente novamente.'});
const url=await signed(path,60,p.books.slug+'.pdf');
if(!url){await db(`pedidos?id=eq.${p.id}`,{m:'PATCH',b:{downloads:p.downloads}});return json(res,500,{erro:'Ficheiro indisponível.'})}
json(res,200,{url,restantes:max-p.downloads-1})};
