import {q,json,clean,signed,verificar,marcado,S} from './_lib.js';
// GET: livro grátis (completo) ou amostra. POST {slug,codigo,dispositivo}: livro completo com marca, só para quem pagou.
export default async(req,res)=>{
const b=req.method==='POST'?req.body||{}:{},slug=clean(req.method==='POST'?b.slug:req.query.slug);
const [l]=await q(`books?slug=eq.${slug}&publicado=eq.true&select=titulo,preco,pdf_path,leitura_path`,S);
if(!l)return json(res,404,{erro:'Livro não encontrado.'});
if(req.method==='POST'){
const v=await verificar(req,b.codigo,b.dispositivo);
if(v.erro)return json(res,v.c,{erro:v.erro});
if(v.p.books.slug!==slug)return json(res,403,{erro:'Este código é de outro livro.'});
const path=await marcado(v.p),url=path&&await signed(path,3600);
return url?json(res,200,{titulo:l.titulo,url,modo:'completo'}):json(res,500,{erro:'Não foi possível preparar o ficheiro.'})}
const gratis=!(+l.preco>0),f=gratis?l.pdf_path:l.leitura_path;
if(!f)return json(res,404,{erro:'Este livro não tem amostra online. Peça o download para o ler.'});
const url=await signed(f,3600);
url?json(res,200,{titulo:l.titulo,url,modo:gratis?'gratis':'amostra'}):json(res,500,{erro:'Ficheiro indisponível.'})};
