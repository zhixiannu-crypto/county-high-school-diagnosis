import {RULES,SUBJECTS} from './rules.js';
const valid=(n,max,zero)=>Number.isFinite(n)&&n>=0&&(n!==0||zero)&&n<=max;
export function groupAndClean(tables){const groups=new Map(),summaries=[],unrecognized=[];
 for(const table of tables){if(table.summary){summaries.push(table.summary);continue;}if(table.unrecognized){unrecognized.push(table.source);continue;}
 for(const r of table.rows){const m=r.meta;
 // Unknown exams remain isolated by sheet. Cohorts never mix grades/exams/scales/categories.
 const key=JSON.stringify([m.school,m.province,m.grade||'未知年级',m.exam||table.source,m.year,m.category,m.combination||'',m.englishMax,m.totalMax,m.scoreSystem||'']);
 if(!groups.has(key))groups.set(key,{key,meta:m,sources:new Set(),raw:[]});const g=groups.get(key);g.sources.add(table.source);g.raw.push(r);}}
 const cleaned=[...groups.values()].map(g=>{const quality={input:g.raw.length,duplicates:0,conflicts:0,missingEnglish:0,invalidEnglish:0,zeroEnglish:0,nonEnglish:0,missingTotal:0,invalidTotal:0,zeroTotal:0,formula:0,invalidSubjects:0,anonymous:0,possibleDuplicates:0};
 const byID=new Map(),noID=[];for(const r of g.raw){if(r.id!=null){if(!byID.has(r.id))byID.set(r.id,[]);byID.get(r.id).push(r);}else noID.push(r);}
 const unique=[...noID];for(const list of byID.values()){const fingerprint=r=>JSON.stringify([r.english,r.total,r.subjects,r.nonEnglish]);if(new Set(list.map(fingerprint)).size>1){quality.conflicts+=list.length;continue;}unique.push(list[0]);quality.duplicates+=list.length-1;}
 const signatures=new Set(),rows=[];for(const r of unique){if(r.id==null){quality.anonymous++;const sig=JSON.stringify([r.english,r.total,r.subjects]);if(signatures.has(sig))quality.possibleDuplicates++;signatures.add(sig);}if(r.formula?.length)quality.formula++;
 if(r.nonEnglish){quality.nonEnglish++;continue;}const em=r.meta.englishMax||150,tm=r.meta.totalMax||900;const zero=r.meta.zeroValid;
 if(r.english===null||r.english===undefined){quality.missingEnglish++;continue;}if(r.english===0&&!zero){quality.zeroEnglish++;continue;}if(!valid(r.english,em,zero)){quality.invalidEnglish++;continue;}
 let total=r.total;if(total==null){quality.missingTotal++;total=null;}else if(total===0&&!zero){quality.zeroTotal++;total=null;}else if(!valid(total,tm,zero)||total<r.english){quality.invalidTotal++;total=null;}
 const subjects={};for(const k of SUBJECTS){const v=r.subjects[k];if(v==null)continue;const max=['science','humanities'].includes(k)?300:['chinese','math'].includes(k)?150:100;if(valid(v,max,zero))subjects[k]=v;else quality.invalidSubjects++;}
 // Never double-count both a composite and its component subjects.
 if(subjects.science!=null){delete subjects.physics;delete subjects.chemistry;delete subjects.biology;}if(subjects.humanities!=null){delete subjects.history;delete subjects.politics;delete subjects.geography;}
 rows.push({...r,total,subjects});}
 const result={key:g.key,meta:g.meta,sources:[...g.sources],rows,quality};g.raw=null;return result;});
 return {groups:cleaned,summaries,unrecognized};
}
