/* Worker keeps file bytes and any source identifiers away from the UI. */
importScripts('../vendor/xlsx.full.min.js');
let tables=null;
self.onmessage=async({data})=>{try{const mod=await import('./importer.js');if(data.type==='read'){tables=mod.readWorkbook(self.XLSX,data.buffer,data.filename);self.postMessage({type:'inspected',tables:tables.map(mod.tableInfo)});}else if(data.type==='extract'){const result=mod.extractTables(tables,data.overrides);tables=null;self.postMessage({type:'extracted',result});self.close();}}catch(e){tables=null;self.postMessage({type:'error',message:e.message||'无法读取该文件，请检查格式。'});self.close();}};
