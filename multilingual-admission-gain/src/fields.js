import {ALIASES,PROVINCES,SUBJECTS} from './rules.js';
export const norm=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/[\s_\-：:]/g,'').replace(/[（(].*?[)）]/g,'');
export function identify(v){const n=norm(v);return Object.keys(ALIASES).find(k=>ALIASES[k].includes(n))||null;}
export function provinceOf(v){const s=String(v??'');return PROVINCES.find(p=>s===p||s.startsWith(p+'省')||s.startsWith(p+'市')||s.startsWith(p+'自治区')||(['内蒙古','广西','西藏','宁夏','新疆'].includes(p)&&s.startsWith(p)))||'';}
export function categoryOf(v){const s=String(v??'').trim();if(/艺术|体育|春季|职教|中职|对口/.test(s))return s;
 const base=/物理|^物[化生政地]/.test(s)?'物理类':/历史|^史[化生政地]/.test(s)?'历史类':/文科|文史/.test(s)?'文史类':/理科|理工/.test(s)?'理工类':/普通|综合改革/.test(s)?'普通类':'';
 const qualifier=/单列类/.test(s)?'单列类':/专项类/.test(s)?'专项类':/[ＡA]类/i.test(s)?'A类':/[ＢB]类/i.test(s)?'B类':'';
 const batch=/本科[一1]批/.test(s)?'本科一批':/本科[二2]批/.test(s)?'本科二批':'';
 if(qualifier||batch)return [base,qualifier,batch].filter(Boolean).join('·')||s;
 return base||s;}
export function detectHeader(rows){let best=null;for(let i=0;i<Math.min(40,rows.length);i++)for(let depth=1;depth<=2;depth++){
 const cols=Math.max(rows[i]?.length||0,rows[i+depth-1]?.length||0),labels=[], candidates={};let joined=0;
 for(let c=0;c<cols;c++){const a=String(rows[i]?.[c]??''),b=depth===2?String(rows[i+1]?.[c]??''):'';let label=a,field=identify(a);if(depth===2){const combined=identify(a+b);if(combined){field=combined;label=a+b;if(b&&/成绩|分数/.test(b))joined++;}else if(identify(b)){field=identify(b);label=b;}}
 labels.push(label.slice(0,80));if(field)(candidates[field]??=[]).push(c);}
 const keys=Object.keys(candidates), score=keys.filter(k=>['english','total',...SUBJECTS].includes(k)).length*5+keys.length-(depth-1)*.2+joined*.5;
 if(keys.some(k=>['english','total',...SUBJECTS].includes(k))&&(!best||score>best.score))best={row:i,depth,labels,candidates,score};
 }if(!best)return null;best.mapping=Object.fromEntries(Object.entries(best.candidates).filter(([,v])=>v.length===1).map(([k,v])=>[k,v[0]]));return best;}
export function metadata(rows,sheetName,filename){const top=rows.slice(0,20);const m={};
 for(const row of top){for(let i=0;i<row.length;i++){const t=String(row[i]??'').trim();const match=t.match(/^([^:：]{1,12})[:：]\s*(.+)$/);if(match){const k=identify(match[1]);if(k&&!['english','total',...SUBJECTS,'id','name','className'].includes(k))m[k]=match[2];}else{const k=identify(t);if(k&&['school','province','grade','exam','year','category','englishMax','totalMax','scoreSystem'].includes(k)&&row[i+1]!=null&&!identify(row[i+1]))m[k]=row[i+1];}}}
 const text=[sheetName,filename,...rows.slice(0,5).flat()].join(' ');
 m.school ||= text.match(/([\u4e00-\u9fa5]{2,25}(?:中学|高中|高级中学))/)?.[1]||'';
 m.province=provinceOf(m.province)||PROVINCES.find(p=>text.includes(p+'省')||text.includes(p+'市'))||'';
 m.grade ||= text.match(/高[一二三]/)?.[0]||'';
 m.year ||= text.match(/20\d{2}/)?.[0]||'';
 m.exam ||= text.match(/(?:第[一二三]次)?(?:月考|期中考试|期末考试|市统考|区域联考|一模|二模|三模|高考)/)?.[0]||'';
 m.category=categoryOf(m.category);return m;}
