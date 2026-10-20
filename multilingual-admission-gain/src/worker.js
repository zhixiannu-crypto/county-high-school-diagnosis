/* Files and identifiers remain inside this worker until sanitized rows are returned. */
let tables=null,parserReady=false;
const fail=(code,message)=>{tables=null;self.postMessage({type:'error',code,message});self.close();};
self.onmessage=async({data})=>{
 if(data.type==='read'){
  try{if(!parserReady){importScripts('../vendor/xlsx.full.min.js');if(!self.XLSX?.read)throw Error('XLSX.read unavailable');parserReady=true;}}
  catch{fail('DEPENDENCY','Excel解析组件加载失败，请联系维护人员。');return;}
  let mod;try{mod=await import('./importer.js');}
  catch{fail('DEPENDENCY','Excel解析组件加载失败，请联系维护人员。');return;}
  try{tables=mod.readWorkbook(self.XLSX,data.buffer,data.filename);self.postMessage({type:'inspected',tables:tables.map(mod.tableInfo)});}
  catch(error){const detail=String(error?.message||'');const known=/^(单个文件|文件内部|Excel 压缩|文件解压|表格超过|全部工作表|最多支持|这是集团历史模型数据)/.test(detail);fail('FILE_INVALID',known?detail:'文件读取失败，请检查Excel文件是否损坏。');}
  return;
 }
 if(data.type==='extract'){
  if(!tables){fail('STATE','本次成绩表已失效，请重新上传。');return;}
  try{const mod=await import('./importer.js');const result=mod.extractTables(tables,data.overrides);tables=null;self.postMessage({type:'extracted',result});self.close();}
  catch{fail('FIELDS','成绩表字段处理失败，请检查所选列。');}
 }
};
