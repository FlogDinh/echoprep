(function(root){
 const normalize=s=>String(s??'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ').replace(/[’‘]/g,"'");
 function grade(answers,key){
  const rows=[];
  for(let n=1;n<=40;n++){
   let value=answers[n]||'', correct=false, expected=key[n].join(' / ');
   if(n>=25&&n<=30){const first=n%2?n:n-1; const allowed=key[first][0].split('/').map(normalize); const used=[answers[first],answers[first+1]].map(normalize); const i=n-first; correct=!!used[i]&&allowed.includes(used[i])&&(i===0||used[0]!==used[1]); expected=allowed.map(x=>x.toUpperCase()).join(' / ');}
   else {const limit=n>=31?1:3; const words=normalize(value).split(' ').filter(x=>x&&!/^\d/.test(x)).length; correct=!!normalize(value)&&key[n].some(x=>normalize(x)===normalize(value))&&(!(n<=17||n>=31)||words<=limit);}
   rows.push({n,value,expected,status:!normalize(value)?'blank':correct?'correct':'wrong'});
  }
  return {rows,correct:rows.filter(x=>x.status==='correct').length,wrong:rows.filter(x=>x.status==='wrong').length,blank:rows.filter(x=>x.status==='blank').length};
 }
 root.EchoGrade={normalize,grade}; if(typeof module!=='undefined')module.exports=root.EchoGrade;
})(typeof window!=='undefined'?window:globalThis);
