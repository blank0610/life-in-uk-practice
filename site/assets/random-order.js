// Fisher–Yates shuffle. Return a new array, leaving question membership and answers unchanged.
export function shuffle(items,random=Math.random){
 const out=[...items];
 for(let i=out.length-1;i>0;i--){
  const j=Math.floor(random()*(i+1));
  [out[i],out[j]]=[out[j],out[i]];
 }
 return out;
}
