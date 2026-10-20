import {RULES,SUBJECTS} from './rules.js';
import {mean,percentiles,quantile,pct} from './statistics.js';

export function analyzeEnglish(group){const rows=group.rows.map(r=>({...r})),n=rows.length;const values=rows.map(r=>r.english),p=percentiles(values),full=group.meta.englishMax;
 const hasSpread=new Set(values).size>1;for(let i=0;i<n;i++){const r=rows[i];r.englishPercentile=p[i];r.weak=full? r.english/full<RULES.weakRate||(n>=RULES.minCohort&&hasSpread&&p[i]<=RULES.relativeWeakPercentile&&r.english/full<RULES.relativeWeakCeiling):n>=RULES.minCohort&&hasSpread&&p[i]<=RULES.relativeWeakPercentile;r.imbalance=null;}
 // Match the same available-subject panel before computing relative gaps.
 const panels=new Map();for(const r of rows){const panel=SUBJECTS.filter(k=>r.subjects[k]!=null).sort();if(panel.length<RULES.minOtherSubjects)continue;const key=panel.join('|');if(!panels.has(key))panels.set(key,{panel,rows:[]});panels.get(key).rows.push(r);}
 let imbalanceEligible=0;for(const {panel,rows:cohort}of panels.values()){if(cohort.length<RULES.minCohort)continue;const ep=percentiles(cohort.map(r=>r.english)),ranks=panel.map(k=>percentiles(cohort.map(r=>r.subjects[k])));for(let i=0;i<cohort.length;i++){const r=cohort[i],other=mean(ranks.map(a=>a[i]));r.otherPercentile=other;r.gap=other-ep[i];r.imbalance=ep[i]<=RULES.imbalanceEnglishCeiling&&r.gap>=RULES.imbalanceGap;imbalanceEligible++;}}
 const weakCount=rows.filter(r=>r.weak).length,imbalanceCount=imbalanceEligible?rows.filter(r=>r.imbalance).length:null,overlap=imbalanceEligible?rows.filter(r=>r.weak&&r.imbalance).length:null;
 const candidate=r=>r.weak||r.imbalance===true;const bins=[[0,30],[30,60],[60,90],[90,120],[120,151]].map(([lo,hi])=>({label:`${lo}–${hi===151?150:hi-1}`,count:rows.filter(r=>r.english>=lo&&r.english<hi).length}));
 return {...group,rows,n,meanEnglish:mean(values),medianEnglish:quantile(values,.5),weakCount:(!n||(!full&&n<RULES.minCohort))?null:weakCount,imbalanceCount,imbalanceEligible,overlap,candidateCount:rows.filter(candidate).length,bins,mode:imbalanceEligible?'完整成绩':rows.some(r=>r.total!=null)?'英语＋总分':'仅英语',weakBasis:full?'得分率与本组相对位置':'仅本组相对位置（满分未知）'};
}
export function matchCutoffs(meta,db){const p=db.find(p=>p.province===meta.province);if(!p||p.status!=='verified')return {reason:'该省2026年官方分数线尚未完成核验，保留英语学情分析。'};
 const rec=p.records.find(r=>r.category===meta.category);if(!rec)return {reason:'招生类别无法可靠匹配2026年官方分数线。'};
 if(!meta.totalMax||+meta.totalMax!==rec.totalMax||+meta.englishMax!==rec.englishMax)return {reason:'考试满分制度未确认或与官方高考口径不匹配，不可直接比较。'};
 if(rec.scoreSystem==='标准分'||meta.province==='海南'||/标准分/.test(meta.scoreSystem||''))return {reason:'标准分不能直接加上原始外语差值，当前不生成跨线测算。'};
 if(!meta.exam||!meta.grade||!meta.year)return {reason:'考试、年级或年份信息不完整，不能确认统计范围。'};
 if(!/高考口径|原始与赋分合计|高考总分|原始分/.test(meta.scoreSystem||''))return {reason:'总分计分口径未确认（含选科赋分制度），不可直接比较。'};
 return {record:rec,province:p,referenceOnly:meta.exam!=='高考'||+meta.year!==2026};
}
export function historicalMatch(score,history){return history.groups.find(g=>score>=g.min&&score<g.maxExclusive&&g.usable&&g.n>=history.minGroupSize&&g.difference!=null)||null;}
export function simulate(analysis,history,db){const matched=matchCutoffs(analysis.meta,db),eligible=analysis.rows.filter(r=>r.total!=null),n=eligible.length;const matchedCandidates=analysis.rows.filter(r=>r.weak||r.imbalance).map(r=>({r,g:historicalMatch(r.english,history)}));
 const historyAvailable=+analysis.meta.englishMax===history.englishMax;const reference={eligible:historyAvailable?matchedCandidates.filter(x=>x.g).length:0,unmatched:historyAvailable?matchedCandidates.filter(x=>!x.g).length:matchedCandidates.length};
 if(!matched.record)return {available:false,reason:matched.reason,n,reference,lines:[]};if(!n)return {available:false,reason:'缺少可靠的逐条总分，当前数据不足以准确测算该指标。',n,reference,lines:[]};
 const em=+analysis.meta.englishMax,tm=+analysis.meta.totalMax;
 const simulated=eligible.map(r=>{const candidate=r.weak||r.imbalance===true,g=candidate?historicalMatch(r.english,history):null;const delta=g?g.difference.median:0;const simulatedEnglish=Math.max(0,Math.min(em,r.english+delta));const total=Math.max(0,Math.min(tm,r.total+simulatedEnglish-r.english));return {r,g,total,delta:total-r.total};});
 // If any candidate lacks a supported historical stratum, no precise whole-cohort result.
 const unsupported=simulated.filter(x=>(x.r.weak||x.r.imbalance)&&!x.g).length;
 const lines=matched.record.lines.map(line=>{const current=simulated.filter(x=>x.r.total>=line.value).length,after=simulated.filter(x=>x.total>=line.value).length,added=simulated.filter(x=>x.r.total<line.value&&x.total>=line.value).length,lost=simulated.filter(x=>x.r.total>=line.value&&x.total<line.value).length,critical=eligible.filter(r=>r.total>=line.value-RULES.criticalBelow&&r.total<line.value+RULES.criticalAbove);
 return {...line,n,current,currentRate:pct(current,n),simulated:unsupported?null:after,simulatedRate:unsupported?null:pct(after,n),added:unsupported?null:added,lost:unsupported?null:lost,change:unsupported?null:pct(after-current,n),critical:critical.length,weakCritical:critical.filter(r=>r.weak).length,imbalanceCritical:analysis.imbalanceEligible?critical.filter(r=>r.imbalance).length:null};});
 const criticalUnion=new Set();for(const r of eligible)if(lines.some(l=>r.total>=l.value-RULES.criticalBelow&&r.total<l.value+RULES.criticalAbove))criticalUnion.add(r);
 return {available:true,referenceOnly:matched.referenceOnly,n,reference,lines,included:simulated.filter(x=>x.g).length,unsupported,criticalUnion:criticalUnion.size,meanDelta:mean(simulated.filter(x=>x.g).map(x=>x.delta)),scoreRange:simulated.length?[Math.min(...simulated.map(x=>x.total)),Math.max(...simulated.map(x=>x.total))]:null,reason:unsupported?'部分候选学生历史分组样本不足，当前达线人数可统计，整体模拟结果无法测算。':''};
}
