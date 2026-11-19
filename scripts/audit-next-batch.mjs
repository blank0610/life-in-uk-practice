import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {loadQuestionBank} from "./audit-question-bank.mjs";
import {nextAuditBatch} from "./question-audit-progress.mjs";
import path from "node:path";
// 默认只预览下一批，不擅自推进已审核进度；审核结束的结果由巡检任务检查后写回 GitHub。
const file="development/QUESTION_AUDIT_PROGRESS.json";
const ledger=JSON.parse(readFileSync(file,"utf8"));
const questions=loadQuestionBank();
const checkedAt=new Date().toISOString();
const result=nextAuditBatch(ledger,questions,{size:ledger.batchSize||12,checkedAt});
console.log("AUDIT_PROGRESS "+JSON.stringify({
  round:ledger.round,from:ledger.nextIndex+1,to:ledger.nextIndex+result.rows.length,total:questions.length,
  finished:result.finished,issues:result.rows.filter(x=>x.findings.length).map(x=>({id:x.id,findings:x.findings}))
}));
for(const row of result.rows){
  const q=questions.find(x=>x.id===row.id);
  console.log("AUDIT_QUESTION "+JSON.stringify({...row,question:q.question,options:q.options,
    correctAnswers:q.correctAnswers,explanation:q.explanation}));
}
if(process.argv.includes("--write")){
  if(result.archive){
    const archiveDir="development/audit-history";
    mkdirSync(archiveDir,{recursive:true});
    const archiveFile=path.join(archiveDir,"round-"+String(ledger.round).padStart(3,"0")+".json");
    writeFileSync(archiveFile,JSON.stringify(result.archive,null,2)+"\n");
    console.log("AUDIT_ARCHIVE "+archiveFile);
  }
  writeFileSync(file,JSON.stringify(result.updated,null,2)+"\n");
  console.log("AUDIT_WRITTEN "+file);
}else{
  console.log("AUDIT_DRY_RUN 未写进度。逐题查看以上题干/选项/答案/说明后，才允许 --write 并提交GitHub。");
}
