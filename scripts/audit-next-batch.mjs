import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {loadQuestionBank} from "./audit-question-bank.mjs";
import {nextAuditBatch} from "./question-audit-progress.mjs";
import path from "node:path";
import {fullAuditSweep} from "./full-bank-audit.mjs";
// 默认只预览下一批，不擅自推进已审核进度；审核结束的结果由巡检任务检查后写回 GitHub。
const file="development/QUESTION_AUDIT_PROGRESS.json";
const ledger=JSON.parse(readFileSync(file,"utf8"));
const questions=loadQuestionBank();
const checkedAt=new Date().toISOString();
if(process.argv.includes("--full")){
  if(process.argv.includes("--write"))throw Error("--full 不允许写入逐题审核主账");
  const sourceIndex=process.argv.indexOf("--source-sha");
  const sourceSha=sourceIndex>=0?process.argv[sourceIndex+1]:process.env.GITHUB_SHA||null;
  const report=fullAuditSweep(ledger,questions,{checkedAt,sourceSha});
  const {records,...summary}=report;
  console.log("FULL_BANK_AUDIT "+JSON.stringify(summary));
  for(const row of records.filter(r=>r.findings.length))console.log("FULL_BANK_FINDING "+JSON.stringify(row));
  const outputIndex=process.argv.indexOf("--output");
  if(outputIndex>=0){
    const output=process.argv[outputIndex+1];
    if(!output||path.resolve(output)===path.resolve(file))throw Error("全库报告必须写入独立文件");
    mkdirSync(path.dirname(output),{recursive:true});
    writeFileSync(output,JSON.stringify(report,null,2)+"\n");
  }
  if(report.severeCount)process.exitCode=1;
}else{
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

}
