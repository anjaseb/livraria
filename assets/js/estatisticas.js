import {q,db,json,sha,ip} from './_lib.js';
const BOT=/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|curl|python|axios/i;
const JANELA=6*3600000;
export default async(req,res)=>{
if(req.method!=='POST')return res.status(405).end();
const {acao,book_id,dispositivo}=req.body||{},id=+book_id||0;
if(!id||!['ver','curtir'].includes(acao)||!/^[0-9a-f]{64}$/.test(String(dispositivo||'')))return json(res,400,{erro:'Pedido inválido.'});
const [b]=await q(`books?id=eq.${id}&publicado=eq.true&select=id,visualizacoes,curtidas`);
if(!b||b.visualizacoes==null)return json(res,503,{erro:'Estatísticas indisponíveis.'});
const h=sha(dispositivo),S=process.env.SUPABASE_SERVICE_KEY;
if(Math.random()<.05)await db(`tentativas?criado=lt.${new Date(Date.now()-86400000).toISOString()}`,{m:'DELETE'});
const [c]=await q(`curtidas?book_id=eq.${id}&dispositivo=eq.${h}&select=book_id`,S);
let vis=+b.visualizacoes,cur=+b.curtidas,curtido=!!c;
if(acao==='ver'){
if(BOT.test(String(req.headers['user-agent']||'')))return json(res,200,{visualizacoes:vis,curtidas:cur,curtido});
const kd=`v:${id}:${h.slice(0,32)}`,desde=new Date(Date.now()-JANELA).toISOString(),ki='vip:'+(ip(req)||'?'),d15=new Date(Date.now()-900000).toISOString();
const [vistas,porIp]=await Promise.all([q(`tentativas?chave=eq.${encodeURIComponent(kd)}&criado=gte.${desde}&select=id&limit=1`,S),q(`tentativas?chave=eq.${encodeURIComponent(ki)}&criado=gte.${d15}&select=id`,S)]);
if(!vistas.length&&porIp.length<60){
await db('tentativas',{m:'POST',b:[{chave:kd},{chave:ki}]});
const r=await db('rpc/inc_visualizacao',{m:'POST',b:{p_book:id}});
if(r.ok&&typeof r.j==='number')vis=r.j}
return json(res,200,{visualizacoes:vis,curtidas:cur,curtido})}
const kl='lk:'+h.slice(0,32),d15=new Date(Date.now()-900000).toISOString();
const rec=await q(`tentativas?chave=eq.${kl}&criado=gte.${d15}&select=id`,S);
if(rec.length>=20)return json(res,429,{erro:'Muitas tentativas. Aguarde um pouco.'});
await db('tentativas',{m:'POST',b:{chave:kl}});
const r=await db('rpc/alternar_curtida',{m:'POST',b:{p_book:id,p_disp:h}});
const x=Array.isArray(r.j)?r.j[0]:null;
if(!r.ok||!x)return json(res,500,{erro:'Não foi possível guardar. Tente novamente.'});
json(res,200,{visualizacoes:vis,curtidas:+x.o_total,curtido:!!x.o_curtido})};
