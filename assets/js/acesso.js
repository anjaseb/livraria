import {verificar,json,cfg,normCodigo} from './_lib.js';
export default async(req,res)=>{
if(req.method!=='POST')return res.status(405).end();
const {codigo,dispositivo}=req.body||{};
const v=await verificar(req,codigo,dispositivo);
if(v.erro)return json(res,v.c,{erro:v.erro});
const max=Math.max(1,+(await cfg()).max_downloads||3);
json(res,200,{codigo:normCodigo(codigo),titulo:v.p.books.titulo,slug:v.p.books.slug,restantes:Math.max(0,max-v.p.downloads)})};
