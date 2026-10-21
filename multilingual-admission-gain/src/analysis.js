import {RULES,SUBJECTS} from './rules.js';
import {mean,percentiles,quantile,pct} from './statistics.js';

export function validateSettings(settings,group){
 const {undergraduate,advanced,weakEnglish,englishMax,totalMax}=settings;
 for(const [label,value] of [['本科参考线',undergraduate],['重本参考线',advanced],['英语满分',englishMax],['总分满分',totalMax]])if(!Number.isFinite(value)||value<=0)throw Error(`${label}必须填写有效的正数。`);
 if(advanced<=undergraduate)throw Error('重本参考线应高于本科参考线。');
 if(advanced>totalMax||undergraduate>totalMax)throw Error('参考线不能超过本次考试总分满分。');
 if(englishMax>totalMax)throw Error('英语满分不能高于考试总分满分。');
 if(weakEnglish!==null&&(!Number.isFinite(weakEnglish)||weakEnglish<0||weakEnglish>englishMax))throw Error('英语单科薄弱参考线必须在0分与英语满分之间。');
 if(group.rows.some(r=>r.english>englishMax))throw Error('英语满分低于表格中的英语成绩，请核对满分。');
 if(group.rows.some(r=>r.total!=null&&r.total>totalMax))throw Error('总分满分低于表格中的考试总分，请核对满分。');
 return settings;
}
export function analyzeEnglish(group,weakEnglish=null){
 const rows=group.rows.map(r=>({...r})),n=rows.length,values=rows.map(r=>r.english),p=percentiles(values),full=Number(group.meta.englishMax);
 const spread=new Set(values).size>1;
 for(let i=0;i<n;i++){const r=rows[i];r.englishPercentile=p[i];r.weak=weakEnglish!==null?r.english<weakEnglish:r.english/full<RULES.weakRate||(n>=RULES.minCohort&&spread&&p[i]<=RULES.relativeWeakPercentile&&r.english/full<RULES.relativeWeakCeiling);r.imbalance=null;}
 // Relative rankings are computed only among students taking the same available subjects.
 const panels=new Map();for(const r of rows){const panel=SUBJECTS.filter(k=>r.subjects[k]!=null).sort();if(panel.length<RULES.minOtherSubjects)continue;const key=panel.join('|');if(!panels.has(key))panels.set(key,{panel,rows:[]});panels.get(key).rows.push(r);}
 let imbalanceEligible=0;for(const {panel,rows:cohort}of panels.values()){if(cohort.length<RULES.minCohort)continue;const ep=percentiles(cohort.map(r=>r.english)),ranks=panel.map(k=>percentiles(cohort.map(r=>r.subjects[k])));for(let i=0;i<cohort.length;i++){const r=cohort[i],other=mean(ranks.map(a=>a[i]));r.otherPercentile=other;r.gap=other-ep[i];r.imbalance=ep[i]<=RULES.imbalanceEnglishCeiling&&r.gap>=RULES.imbalanceGap;imbalanceEligible++;}}
 const step=full/5,bins=Array.from({length:5},(_,i)=>({label:`${Math.round(i*step)}–${Math.round((i+1)*step)}分`,count:rows.filter(r=>r.english>=i*step&&(i===4?r.english<=(i+1)*step:r.english<(i+1)*step)).length}));
 const keys=rows.map(r=>r.studentId?`id:${r.studentId}`:r.name?`name:${r.className||''}|${r.name}`:null),identityReliable=keys.every(Boolean)&&new Set(keys).size===keys.length;
 return {...group,rows,n,identityReliable,meanEnglish:mean(values),medianEnglish:quantile(values,.5),weakCount:rows.filter(r=>r.weak).length,imbalanceCount:imbalanceEligible?rows.filter(r=>r.imbalance).length:null,imbalanceEligible,overlap:imbalanceEligible?rows.filter(r=>r.weak&&r.imbalance).length:null,bins,weakBasis:weakEnglish!==null?`学校英语单科薄弱参考线 ${weakEnglish} 分`:'英语得分率低于60%；或样本至少30人时位于本场考试后25%且得分率低于80%'};
}
export function historicalMatch(score,englishMax,history){if(!history?.groups||!Number.isFinite(englishMax)||englishMax<=0)return null;const equivalent=score*history.englishMax/englishMax;return history.groups.find(g=>equivalent>=g.min&&equivalent<g.maxExclusive&&g.usable&&g.n>=history.minGroupSize&&Number.isFinite(g.difference?.median))||null;}
export function simulate(analysis,history,settings){
 const {undergraduate,advanced,englishMax,totalMax}=settings;
 const lines=[{kind:'undergraduate',name:'本次考试本科参考线',value:undergraduate},{kind:'advanced',name:'本次考试重本参考线',value:advanced}];
 const eligible=analysis.rows.filter(r=>r.total!=null),n=eligible.length;
 const students=analysis.rows.map(r=>{const out={...r,delta:null,simulatedTotal:null,modelMatched:false};if(r.total!=null){const matched=historicalMatch(r.english,englishMax,history);if(matched){const proposed=Math.max(0,matched.difference.median*englishMax/history.englishMax);out.delta=Math.max(0,Math.min(proposed,englishMax-r.english,totalMax-r.total));out.simulatedTotal=r.total+out.delta;out.modelMatched=true;}}
 out.currentUndergraduate=r.total!=null?r.total>=undergraduate:null;out.currentAdvanced=r.total!=null?r.total>=advanced:null;
 out.crossUndergraduate=r.total!=null&&out.simulatedTotal!=null&&r.total<undergraduate&&out.simulatedTotal>=undergraduate;
 out.crossAdvanced=r.total!=null&&out.simulatedTotal!=null&&r.total<advanced&&out.simulatedTotal>=advanced;
 out.simulatedUndergraduate=out.simulatedTotal!=null?out.simulatedTotal>=undergraduate:null;
 out.simulatedAdvanced=out.simulatedTotal!=null?out.simulatedTotal>=advanced:null;
 return out;});
 const matched=students.filter(r=>r.total!=null&&r.modelMatched).length;
 const results=lines.map(line=>{const current=eligible.filter(r=>r.total>=line.value).length,added=students.filter(r=>line.kind==='undergraduate'?r.crossUndergraduate:r.crossAdvanced).length,critical=eligible.filter(r=>r.total>=line.value-RULES.criticalBelow&&r.total<line.value+RULES.criticalAbove);const calculable=!!history?.groups&&matched>0&&n>0;const after=calculable?current+added:null;return {...line,n,current:n?current:null,currentRate:pct(current,n),simulated:after,simulatedRate:after===null?null:pct(after,n),added:calculable?added:null,change:after===null?null:pct(after-current,n),critical:n?critical.length:null,weakCritical:n?critical.filter(r=>r.weak).length:null,imbalanceCritical:n&&analysis.imbalanceEligible?critical.filter(r=>r.imbalance).length:null};});
 const reason=!n?'缺少有效考试总分，无法测算达线情况。':!history?.groups?'历史参考参数加载失败，暂不能计算升学改善情景。':!matched?'本次英语成绩未能匹配有足够样本的历史参考分组，无法测算增量。':'';
 return {available:!!n,n,lines:results,students,matched,unmatched:n-matched,reference:{eligible:matched,unmatched:n-matched},reason};
}
