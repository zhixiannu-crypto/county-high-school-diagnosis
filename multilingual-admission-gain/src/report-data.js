import {pct,mean} from './statistics.js';

// Every figure is derived from the same student flags and line results used by the roster.
export function buildReportData(analysis,simulation,settings){
 const unit=analysis.identityReliable?'人':'条记录';
 const eligible=analysis.rows.filter(r=>r.imbalance!==null);
 const weakness={weak:analysis.weakCount,other:analysis.n-analysis.weakCount,rate:pct(analysis.weakCount,analysis.n)};
 const distribution=analysis.bins.map((b,i)=>({...b,index:i,rate:pct(b.count,analysis.n)}));
 const profile=eligible.length?{
  eligible:eligible.length,unassessed:analysis.n-eligible.length,
  groups:[
   {label:'英语薄弱且明显偏科',count:eligible.filter(r=>r.weak&&r.imbalance).length},
   {label:'仅英语薄弱',count:eligible.filter(r=>r.weak&&!r.imbalance).length},
   {label:'仅英语明显偏科',count:eligible.filter(r=>!r.weak&&r.imbalance).length},
   {label:'其他学生',count:eligible.filter(r=>!r.weak&&!r.imbalance).length}
  ]
 }:null;
 const tiers=[
  {label:'其他学科后25%',min:0,max:.25},
  {label:'其他学科25%—50%',min:.25,max:.5},
  {label:'其他学科50%—75%',min:.5,max:.75},
  {label:'其他学科前25%',min:.75,max:1.01}
 ];
 const relationRows=analysis.rows.filter(r=>Number.isFinite(r.otherPercentile));
 const relation=relationRows.length?{
  eligible:relationRows.length,unassessed:analysis.n-relationRows.length,
  tiers:tiers.map(t=>{const rows=relationRows.filter(r=>r.otherPercentile>=t.min&&r.otherPercentile<t.max);return {label:t.label,count:rows.length,englishRate:rows.length?100*mean(rows.map(r=>r.english/settings.englishMax)):null,attention:rows.filter(r=>r.weak||r.imbalance).length};}),
  strongOtherWeak:relationRows.filter(r=>r.otherPercentile>=.75&&r.weak).length
 }:null;
 const ranges=[{label:'距线1—10分',min:0,max:10},{label:'距线11—20分',min:10,max:20},{label:'距线21—30分',min:20,max:30},{label:'距线31—50分',min:30,max:50}];
 const critical=simulation.n?simulation.lines.map(line=>({kind:line.kind,name:line.kind==='undergraduate'?'本科':'重本',value:line.value,ranges:ranges.map(range=>{const rows=simulation.students.filter(r=>r.total!=null&&line.value-r.total>range.min&&line.value-r.total<=range.max);return {label:range.label,count:rows.length,attention:rows.filter(r=>r.weak||r.imbalance).length};})})):null;
 const outcomes=simulation.lines.map(line=>({...line,shortName:line.kind==='undergraduate'?'本科':'重本'}));
 return {unit,weakness,distribution,profile,relation,critical,outcomes,weakLine:settings.weakEnglish,englishMax:settings.englishMax};
}
