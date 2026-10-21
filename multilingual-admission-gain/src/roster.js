import {FIELD_LABELS,SUBJECTS} from './rules.js';
import {freezeFirstRows} from './xlsx-freeze.js';
const order={'重点评估':0,'专项评估':1,'持续关注':2,'其他冲线候选':3};
export function buildRoster(analysis,simulation,settings){
 const students=simulation.students.filter(r=>r.weak||r.imbalance||r.crossUndergraduate||r.crossAdvanced).map(r=>{
  const crossed=r.crossUndergraduate||r.crossAdvanced,priority=crossed&&(r.weak||r.imbalance)?'重点评估':r.imbalance?'专项评估':r.weak?'持续关注':'其他冲线候选';
  const reasons=[r.weak?'英语薄弱':'',r.imbalance?'英语明显偏科':'',r.crossUndergraduate?'本科冲线候选':'',r.crossAdvanced?'重本冲线候选':''].filter(Boolean);
  return {...r,priority,reasons,identity:r.studentId?`编号:${r.studentId}`:r.name?`姓名:${r.className||''}|${r.name}`:null};
 }).sort((a,b)=>order[a.priority]-order[b.priority]||Number(b.crossUndergraduate)+Number(b.crossAdvanced)-Number(a.crossUndergraduate)-Number(a.crossAdvanced)||String(a.studentId||a.name||'').localeCompare(String(b.studentId||b.name||''),'zh-CN'));
 const identities=students.map(r=>r.identity),unique=new Set(identities.filter(Boolean));
 const identityError=identities.some(x=>!x)?'名单中有学生缺少姓名和学号，无法可靠区分身份。':unique.size!==students.length?'名单中存在重复的姓名/班级或学号，无法可靠去重。':'';
 const sheets=[['重点关注总名单',students],['本科冲线候选',students.filter(r=>r.crossUndergraduate)],['重本冲线候选',students.filter(r=>r.crossAdvanced)],['英语明显偏科',students.filter(r=>r.imbalance)],['英语薄弱学生',students.filter(r=>r.weak)]];
 return {students,sheets,identityError,counts:Object.fromEntries(sheets.map(([name,rows])=>[name,rows.length])),overlap:students.filter(r=>r.crossUndergraduate&&r.crossAdvanced).length,settings};
}
const columns=['原表学生姓名','原表学生编号或学号','班级','英语成绩','其他学科成绩','其他学科相对表现','当前考试总分','本次本科参考线','本次重本参考线','距本科参考线分数','距重本参考线分数','参考情景外语成绩变化量','模拟总分','模拟达到本科参考线','模拟达到重本参考线','英语薄弱','英语明显偏科','本科冲线候选','重本冲线候选','评估优先级','入选原因'];
const yes=v=>v===null?'无法测算':v?'是':'否';
function record(r,settings){const subjects=SUBJECTS.filter(k=>r.subjects[k]!=null).map(k=>`${FIELD_LABELS[k]} ${r.subjects[k]}`).join('；');return [r.name||'',r.studentId||'',r.className||'',r.english,subjects,r.otherPercentile==null?'无法判断':`同组约第${Math.round(r.otherPercentile*100)}百分位`,r.total??'无法测算',settings.undergraduate,settings.advanced,r.total==null?'无法测算':settings.undergraduate-r.total,r.total==null?'无法测算':settings.advanced-r.total,r.delta??'无法测算',r.simulatedTotal??'无法测算',yes(r.simulatedUndergraduate),yes(r.simulatedAdvanced),yes(r.weak),yes(r.imbalance),yes(r.crossUndergraduate),yes(r.crossAdvanced),r.priority,r.reasons.join('、')];}
export function makeRosterWorkbook(XLSX,roster){if(roster.identityError)throw Error(roster.identityError);const wb=XLSX.utils.book_new();for(const [name,students] of roster.sheets){const ws=XLSX.utils.aoa_to_sheet([columns,...students.map(r=>record(r,roster.settings))]);ws['!autofilter']={ref:`A1:U${Math.max(1,students.length+1)}`};ws['!cols']=columns.map((c,i)=>({wch:[18,21,14,12,35,22,17,17,17,18,18,25,14,19,19,12,16,16,16,16,44][i]}));XLSX.utils.book_append_sheet(wb,ws,name);}
 return freezeFirstRows(XLSX.write(wb,{bookType:'xlsx',type:'array',compression:false}));}
