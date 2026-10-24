import {q,cfg,clean,slugif,S} from './_lib.js';
import {P} from './_gen.js';
const out=(res,body,code=200,tipo='text/html;charset=utf-8')=>{res.setHeader('Content-Type',tipo);res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=86400');res.status(code).send(body)};
export default async(req,res)=>{
const t=String(req.query.t||''),slug=clean(req.query.slug);
if(t==='robots')return out(res,P.robots(),200,'text/plain;charset=utf-8');
if(t==='sitemap'){const [l,a,sc]=await Promise.all([q('books?publicado=eq.true&select=slug,criado,categoria,autor'),q('articles?publicado=eq.true&select=slug,criado'),cfg()]);return out(res,P.sitemap(l,a,sc),200,'application/xml;charset=utf-8')}
const [posts,c]=await Promise.all([q('articles?publicado=eq.true&select=slug,titulo,resumo&order=criado.desc&limit=6'),cfg()]),blog={blog:posts.length>0,c};
if(t==='home')return out(res,P.home(await q('books?publicado=eq.true&select=slug,titulo,autor,preco,capa_url,categoria&order=criado.desc'),posts,blog));
if(t==='blog')return posts.length?out(res,P.blog(await q('articles?publicado=eq.true&select=slug,titulo,resumo,criado&order=criado.desc&limit=200'),blog)):out(res,P.nada(blog),404);
if(t==='sobre')return out(res,P.sobre(c,blog));
if(t==='contactos')return(c.contacto_email||c.whatsapp||c.morada)?out(res,P.contactos(c,blog)):out(res,P.nada(blog),404);
if(t==='categoria'||t==='autor'){const campo=t==='categoria'?'categoria':'autor',todos=await q('books?publicado=eq.true&select=slug,titulo,autor,preco,capa_url,categoria&order=criado.desc'),l=todos.filter(x=>x[campo]&&slugif(x[campo])===slug);return l.length?out(res,P.lista(t,l[0][campo],slug,l,blog)):out(res,P.nada(blog),404)}
if(t==='acesso')return out(res,P.acesso(blog));
if(t==='comprovativo')return out(res,P.comprovativo(blog));
if(t==='ler')return out(res,P.ler(blog));
if(t==='termos')return out(res,P.termos(c,blog));
if(t==='privacidade')return out(res,P.privacidade(c,blog));
if(t==='artigo'){const [a]=await q(`articles?slug=eq.${slug}&publicado=eq.true&select=*`);return a?out(res,P.artigo(a,blog)):out(res,P.nada(blog),404)}
if(t==='livro'&&slug){const [b,o,st]=await Promise.all([q(`books?slug=eq.${slug}&publicado=eq.true&select=id,slug,titulo,autor,preco,categoria,descricao,isbn,capa_url,leitura_path,palavras,trecho,sobre_autor,criado`),q(`books?publicado=eq.true&slug=neq.${slug}&select=slug,titulo&order=criado.desc&limit=6`),q(`books?slug=eq.${slug}&publicado=eq.true&select=visualizacoes,curtidas`)]);if(b[0]&&st[0])Object.assign(b[0],st[0]);return b[0]?out(res,P.livro(b[0],o,blog),200):out(res,P.nada(blog),404)}
out(res,P.nada(blog),404)};
