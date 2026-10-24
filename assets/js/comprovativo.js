(function(){var f=document.getElementById('f'),m=document.getElementById('m');
try{if(sessionStorage.lm_ref)f.ref.value=sessionStorage.lm_ref;if(sessionStorage.lm_em)f.email.value=sessionStorage.lm_em}catch(e){}
f.onsubmit=function(e){e.preventDefault();LM.enviarComp(f.ref.value,f.email.value,f.ficheiro.files[0],m)}})();
