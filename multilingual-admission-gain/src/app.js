import {RULES,PROVINCES,FIELD_LABELS} from './rules.js';
import {groupAndClean} from './cleaning.js';
import {analyzeEnglish,simulate} from './analysis.js';
import {renderReport,renderSummary,groupLabel} from './report.js';
import {escapeHTML as e} from './charts.js';
const $=s=>document.querySelector(s);let worker=null,timer=null,model=null,cutoffs=null,reports=[],tableInfos=[],lastFocus=null,generation=0,activeDemo=false;
const diagnostic=(stage,detail='')=>console.warn('[升学分析 V1.2]',stage,detail);
async function loadJSON(name){const url=new URL('../data/'+name,import.meta.url);const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);const value=await response.json();if(name.startsWith('history')?!Array.isArray(value?.groups):!Array.isArray(value))throw Error('配置结构无效');return value;}
const ready=Promise.allSettled([loadJSON('history-2026.json'),loadJSON('cutoffs-2026.json')]).then(([h,c])=>{if(h.status==='fulfilled')model=h.value;else diagnostic('历史参考参数加载失败',h.reason?.message);if(c.status==='fulfilled')cutoffs=c.value;else diagnostic('省级分数线配置加载失败',c.reason?.message);if(!model||!cutoffs)status([!model?'历史参考参数加载失败，暂不能计算升学改善情景。':'',!cutoffs?'省级分数线配置加载失败，暂不能进行达线测算。':''].filter(Boolean).join(' '),true);});
function status(text,error=false){$('#status').textContent=text;$('#status').classList.toggle('error',error);}
function busy(on){$('#upload').disabled=on;$('#demo').disabled=on;$('#upload-new').disabled=on;}
function kill(){clearTimeout(timer);worker?.terminate();worker=null;}
function watchdog(){clearTimeout(timer);timer=setTimeout(()=>{kill();tableInfos=[];busy(false);status('解析时间超过25秒，已停止。请拆分文件后重试。',true);},RULES.timeoutMs);}
function clear(){generation++;kill();reports=[];tableInfos=[];activeDemo=false;$('#report').replaceChildren();$('#cohort').replaceChildren();$('#data-check').replaceChildren();$('#file').value='';$('#confirm-fields').replaceChildren();if($('#confirm-dialog').open)$('#confirm-dialog').close();$('#report-area').hidden=true;$('#landing').hidden=false;document.title='高中多语种升学增量分析系统 · 七校纵横';status('当前成绩与分析结果已清除。');busy(false);}
$('#clear').addEventListener('click',clear);$('#upload').addEventListener('click',()=>$('#file').click());$('#upload-new').addEventListener('click',()=>$('#file').click());$('#file').addEventListener('change',ev=>{const file=ev.target.files[0];ev.target.value='';if(file)load(file);});
const zone=$('#drop-zone');for(const ev of ['dragenter','dragover'])zone.addEventListener(ev,x=>{x.preventDefault();zone.classList.add('dragover');});for(const ev of ['dragleave','drop'])zone.addEventListener(ev,x=>{x.preventDefault();zone.classList.remove('dragover');});zone.addEventListener('drop',ev=>{if(ev.dataTransfer.files.length!==1){status('请每次选择一个文件。',true);return;}load(ev.dataTransfer.files[0]);});
async function load(file,{demo=false}={}){
 clear();const token=++generation;activeDemo=demo;
 if(!/\.(xlsx|xls|csv)$/i.test(file.name)){status('请选择 .xlsx、.xls 或 .csv 文件。',true);return;}
 if(file.size>RULES.maxFileBytes){status('单个文件不能超过10MB，请拆分后再导入。',true);return;}
 busy(true);status(`正在读取${demo?'模拟':'本次上传的'}文件：${file.name}`);
 let buffer;try{buffer=await file.arrayBuffer();}catch(error){if(token!==generation)return;diagnostic('文件读取失败',error?.name);busy(false);status('文件读取失败，请检查Excel文件是否损坏。',true);return;}
 await ready;if(token!==generation)return;
 try{worker=new Worker(new URL('./worker.js',import.meta.url));}
 catch(error){diagnostic('解析工作线程创建失败',error?.name);busy(false);status('Excel解析组件加载失败，请联系维护人员。',true);return;}
 watchdog();
 worker.onerror=error=>{if(token!==generation)return;diagnostic('解析工作线程运行失败',error?.message||error?.type);kill();busy(false);status('Excel解析组件加载失败，请联系维护人员。',true);};
 worker.onmessage=({data})=>{
  if(token!==generation)return;clearTimeout(timer);
  if(data.type==='error'){diagnostic('导入失败',data.code);kill();busy(false);status(data.message,true);}
  else if(data.type==='inspected'){tableInfos=data.tables;if(!tableInfos.some(t=>t.header||t.summary)){diagnostic('工作表未识别','NO_HEADER');kill();busy(false);status('成绩表已读取，但没有识别到英语成绩列。',true);return;}confirmOrExtract();}
  else if(data.type==='extracted'){kill();tableInfos=[];finish(data.result);}
 };
 try{worker.postMessage({type:'read',buffer,filename:file.name},[buffer]);}
 catch(error){diagnostic('文件发送解析器失败',error?.name);kill();busy(false);status('文件读取失败，请检查Excel文件是否损坏。',true);}
}
const options=(items,selected='')=>items.map(([v,l])=>`<option value="${e(v)}" ${String(v)===String(selected)?'selected':''}>${e(l)}</option>`).join('');
function field(t,key,label,html){return `<label class="form-field">${e(label)}${html.replace(' data-field',` data-key="${t.key}" data-field`)}</label>`;}
function categoryChoices(province){const base=['普通类','物理类','历史类','文史类','理工类','艺术类','体育类'];const extra=province==='西藏'?['文史类·A类·本科一批','文史类·A类·本科二批','文史类·B类·本科一批','文史类·B类·本科二批','理工类·A类·本科一批','理工类·A类·本科二批','理工类·B类·本科一批','理工类·B类·本科二批']:province==='新疆'?['文史类·本科一批','文史类·本科二批','理工类·本科一批','理工类·本科二批','文史类·单列类·本科一批','文史类·单列类·本科二批','理工类·单列类·本科一批','理工类·单列类·本科二批']:[];return [['','未知（不测算跨线）'],...[...base,...extra].map(x=>[x,x])];}
function confirmOrExtract(){let html='';for(const t of tableInfos){const m=t.meta,h=t.header;let fields='';if(!m.school&&h?.mapping.school==null)fields+=field(t,'school','学校名称',`<input data-field="school" maxlength="60" required placeholder="例如：XX县第一中学">`);if(!m.province&&h?.mapping.province==null)fields+=field(t,'province','学校所在省份',`<select data-field="province">${options([['','暂不确定（仅做学情分析）'],...PROVINCES.map(x=>[x,x])])}</select>`);
 if(h){for(const k of ['english','total',...Object.keys(h.candidates).filter(k=>h.candidates[k].length>1&&!['english','total'].includes(k))]){if(h.mapping[k]!=null)continue;fields+=field(t,k,`${FIELD_LABELS[k]||k}列`,`<select data-map="${k}" data-field="_map">${options([['-1',k==='english'?'请选择英语列':'不使用总分列'],...h.labels.map((x,i)=>[i,`${i+1}列：${x||'未命名列'}`])])}</select>`);}
 if(t.needsEnglishConfirmation)fields+=`<label class="check-field wide"><input type="checkbox" data-key="${t.key}" data-english="true" required><span>确认“外语”列为英语成绩（不是日语、俄语或其他外语）</span></label>`;
 if(!m.englishMax&&h.mapping.englishMax==null)fields+=field(t,'englishMax','本次英语满分',`<select data-field="englishMax">${options([['','未知'],[150,'150分'],[120,'120分'],[100,'100分']])}</select>`);
 if(h.mapping.total!=null){if(!m.totalMax&&h.mapping.totalMax==null)fields+=field(t,'totalMax','本次考试总分满分',`<select data-field="totalMax">${options([['','未知'],[750,'750分'],[660,'660分'],[900,'900分（标准分不可直接测算）']])}</select>`);
 const specialIncomplete=(m.province==='西藏'&&!/·[AB]类·本科[一二]批$/.test(m.category||''))||(m.province==='新疆'&&!/·本科[一二]批$/.test(m.category||''));
 if((!m.category||specialIncomplete)&&h.mapping.category==null)fields+=field(t,'category',specialIncomplete?'请确认文理、批次及考生类别':'分数线适用招生类别',`<select data-field="category">${options(categoryChoices(m.province),specialIncomplete?'':m.category)}</select>`);
 if(!m.scoreSystem&&h.mapping.scoreSystem==null)fields+=field(t,'scoreSystem','考试总分如何计算',`<select data-field="scoreSystem">${options([['','不确定（只分析英语学情）'],['高考口径','按本省高考计分方式合计'],['标准分','标准分']])}</select>`);
 }}else if(!t.summary)fields+='<p class="muted wide">未找到可靠的成绩表头或学校汇总指标，本工作表将跳过。可将成绩列命名为“英语”“总分”后重新上传。</p>';
 if(fields)html+=`<fieldset><legend>${e(t.name)}</legend><div class="form-grid">${fields}</div></fieldset>`;}
 if(html){$('#confirm-fields').innerHTML=html;$('#form-error').textContent='';lastFocus=document.activeElement;$('#confirm-dialog').showModal();status('等待确认缺失信息，文件仍仅保留在当前内存中。');}else extract({});}
$('#confirm-fields').addEventListener('change',event=>{if(event.target.dataset.field!=='province')return;const province=event.target.value,group=event.target.closest('fieldset'),t=tableInfos.find(x=>String(x.key)===event.target.dataset.key);if(!group||!t||!['西藏','新疆'].includes(province)||t.header?.mapping.category!=null)return;let choice=group.querySelector('select[data-field="category"]');if(!choice){group.querySelector('.form-grid').insertAdjacentHTML('beforeend',field(t,'category','请确认文理、批次及考生类别',`<select data-field="category">${options(categoryChoices(province))}</select>`));return;}choice.innerHTML=options(categoryChoices(province));});
$('#confirm-form').addEventListener('submit',ev=>{ev.preventDefault();const overrides={};for(const el of $('#confirm-fields').querySelectorAll('[data-key]')){const k=el.dataset.key;overrides[k]??={meta:{},mapping:{}};if(el.dataset.english)overrides[k].englishConfirmed=el.checked;else if(el.dataset.map){if(el.dataset.map==='english'&&+el.value<0){$('#form-error').textContent='请确认英语成绩列，不能在字段不明时继续分析。';return;}overrides[k].mapping[el.dataset.map]=+el.value;}else overrides[k].meta[el.dataset.field]=el.value.trim();}
 for(const t of tableInfos){const map={...t.header?.mapping,...overrides[t.key]?.mapping};const cols=Object.values(map).filter(v=>v>=0);if(new Set(cols).size!==cols.length){$('#form-error').textContent='同一列不能同时用于多个字段，请检查映射。';return;}}
 $('#confirm-dialog').close();$('#confirm-fields').replaceChildren();extract(overrides);});
function cancel(){kill();tableInfos=[];$('#confirm-fields').replaceChildren();$('#confirm-dialog').close();busy(false);status('已取消，临时文件数据已释放。');lastFocus?.focus();}$('#cancel').addEventListener('click',cancel);$('#confirm-dialog').addEventListener('cancel',ev=>{ev.preventDefault();cancel();});
function extract(overrides){status('正在清洗数据、计算群体与生成报告…');watchdog();worker.postMessage({type:'extract',overrides});}
function finish(tables){try{const data=groupAndClean(tables);reports=data.groups.filter(g=>g.rows.length).map(g=>{g.meta.synthetic=activeDemo;const a=analyzeEnglish(g),s=simulate(a,model,cutoffs);return {a,s,label:groupLabel(a.meta)};});for(const summary of data.summaries)reports.push({summary:{...summary,synthetic:activeDemo},label:groupLabel(summary)+' · 汇总数据'});tables=null;if(!reports.length)throw Object.assign(Error('NO_ENGLISH'),{code:'NO_ENGLISH'});$('#cohort').innerHTML=reports.map((r,i)=>`<option value="${i}">${e(r.label)}</option>`).join('');$('#cohort-info').textContent=`已读取 ${data.groups.reduce((n,g)=>n+g.quality.input,0)} 条记录，识别 ${reports.length} 个统计组${data.unrecognized.length?`；${data.unrecognized.length} 个工作表未识别`:''}。`;$('#landing').hidden=true;$('#report-area').hidden=false;showReport(0);busy(false);window.scrollTo({top:0});}catch(err){diagnostic('分析失败',err.code||err.name);reports=[];$('#report').replaceChildren();$('#report-area').hidden=true;$('#landing').hidden=false;busy(false);status(err.code==='NO_ENGLISH'?'成绩表已读取，但没有识别到英语成绩列。':'分析过程中发生错误，请检查文件数据或联系维护人员。',true);}}
function showReport(index){const r=reports[index];if(!r)return;$('#report').innerHTML=r.summary?renderSummary(r.summary):renderReport(r.a,r.s,model);const school=(r.summary||r.a.meta).school||'未命名学校';document.title=`${school}_升学改善分析报告`;const a=r.a,s=r.s,m=r.summary||a.meta,unit=a?.rows.every(x=>x.id!=null)?'人':'条';$('#data-check').innerHTML=`<strong>本次分析的数据情况</strong><span>读取记录：${a?a.quality.input:'仅有汇总数据'}</span><span>有效成绩：${a?a.n:'无法确认'}${unit}</span><span>英语成绩：${a?.n?'已找到':'未找到'}</span><span>考试总分：${a?.rows.some(x=>x.total!=null)?'已找到':'未找到'}</span><span>跨线测算：${s?.lines.length&&s.lines.every(x=>x.added!==null)?'可测算':'无法测算'}</span><span>学校：${e(m.school||'未识别')}</span><span>省份：${e(m.province||'未识别')}</span>${activeDemo?'<b class="synthetic-tag">模拟数据</b>':''}`;}
$('#cohort').addEventListener('change',ev=>showReport(+ev.target.value));$('#print').addEventListener('click',()=>window.print());$('#save-pdf').addEventListener('click',()=>window.print());$('#demo').addEventListener('click',async()=>{try{await ready;const r=await fetch('./examples/虚构测试数据_600人.csv');if(!r.ok)throw Error();load(new File([await r.blob()],'虚构测试数据_600人.csv',{type:'text/csv'}),{demo:true});}catch{status('测试文件加载失败，请检查发布目录。',true);}});
window.addEventListener('pagehide',()=>{kill();reports=[];tableInfos=[];});
