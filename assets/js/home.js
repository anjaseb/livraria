var s=document.getElementById('s');if(s)s.oninput=function(){var v=s.value.toLowerCase();document.querySelectorAll('#g .card').forEach(function(c){c.hidden=c.dataset.s.indexOf(v)<0})};
