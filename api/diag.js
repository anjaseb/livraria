import {U,K,S} from './_lib.js';
export default async(req,res)=>{
  let teste='sem SUPABASE_URL';
  if(U){
    try{
      const r=await fetch(`${U}/rest/v1/books?select=slug,publicado&limit=5`,{headers:{apikey:K,Authorization:`Bearer ${K}`}});
      teste=r.status+' '+(await r.text()).slice(0,300);
    }catch(e){teste='erro: '+e.message}
  }
  res.setHeader('Content-Type','application/json');
  res.status(200).send(JSON.stringify({url:!!U,anon:!!K,service:!!S,anon_inicio:K?K.slice(0,15):null,teste}));
};