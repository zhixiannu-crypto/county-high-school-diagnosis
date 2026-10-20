export const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
export function quantile(a,p){if(!a.length)return null;const s=[...a].sort((x,y)=>x-y),i=(s.length-1)*p,l=Math.floor(i);return s[l]+(s[Math.ceil(i)]-s[l])*(i-l);}
// Midrank / (n-1), with ties treated identically. All-equal data sits at .5.
export function percentiles(a){const sorted=[...a].sort((x,y)=>x-y), ranks=new Map();for(let i=0;i<sorted.length;){let j=i+1;while(j<sorted.length&&sorted[j]===sorted[i])j++;ranks.set(sorted[i],sorted.length===1?.5:((i+j-1)/2)/(sorted.length-1));i=j;}return a.map(v=>ranks.get(v));}
export function numeric(v){if(typeof v==='number')return Number.isFinite(v)?v:null;if(v===null||v===undefined)return null;const s=String(v).normalize('NFKC').trim().replace(/[,，]/g,'');return /^[-+]?\d+(\.\d+)?$/.test(s)?Number(s):null;}
export const pct=(n,d)=>d?100*n/d:null;
