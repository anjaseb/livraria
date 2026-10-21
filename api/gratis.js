import {q,json,clean,signed,S} from './_lib.js';
export default async(req,res)=>{
const slug=clean(req.query.slug);
const [l]=await q(`books?slug=eq.${slug}&publicado=eq.true&preco=lte.0&select=pdf_path`,S);
if(!l?.pdf_path)return json(res,404,{erro:'Este livro não é gratuito.'});
const url=await signed(l.pdf_path,60,slug+'.pdf');
url?json(res,200,{url}):json(res,500,{erro:'Ficheiro indisponível.'})};
