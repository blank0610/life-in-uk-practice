import {mkdirSync,writeFileSync} from "node:fs";
import path from "node:path";
import {loadQuestionBank} from "./audit-question-bank.mjs";

// 从网站实际显示的已校正题库导出可读 JSON，供每小时审核使用。
// 不修改任何题目、答案、学习记录、GitHub 审核进度。
export function createAuditBatches(questions,{batchSize=12}={}){
 const size=Number(batchSize);
 if(!Number.isSafeInteger(size)||size<1||size>100)throw Error("审核批次大小必须在1到100之间");
 const sorted=[...questions].sort((a,b)=>(Number(a.sourceScreenshot)||0)-(Number(b.sourceScreenshot)||0));
 const width=Math.max(3,String(Math.ceil(sorted.length/size)).length);
 const batches=[];
 for(let offset=0;offset<sorted.length;offset+=size){
  const items=sorted.slice(offset,offset+size).map(q=>({
   id:q.id,sourceScreenshot:q.sourceScreenshot,
   question:q.question,options:q.options,
   correctAnswers:q.correctAnswers,explanation:q.explanation
  }));
  const filename="batch-"+String(batches.length+1).padStart(width,"0")+".json";
  batches.push({filename,fromIndex:offset,toIndexExclusive:offset+items.length,items});
 }
 return {
  manifest:{
   schemaVersion:1,
   source:"网站已应用所有拼写校正后的真实题库",
   questionCount:sorted.length,
   batchSize:size,
   batches:batches.map(b=>({
    file:b.filename,fromIndex:b.fromIndex,toIndexExclusive:b.toIndexExclusive,
    count:b.items.length,firstId:b.items[0].id,lastId:b.items.at(-1).id
   }))
  },
  batches
 };
}
export function saveAuditBatches(outputDir,result){
 mkdirSync(outputDir,{recursive:true});
 for(const b of result.batches)writeFileSync(path.join(outputDir,b.filename),JSON.stringify(b.items,null,2)+"\n","utf8");
 writeFileSync(path.join(outputDir,"manifest.json"),JSON.stringify(result.manifest,null,2)+"\n","utf8");
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
 const ledger=JSON.parse((await import("node:fs")).readFileSync("development/QUESTION_AUDIT_PROGRESS.json","utf8"));
 const outFlag=process.argv.indexOf("--output");
 const outputDir=outFlag<0?"site/data/audit-batches":process.argv[outFlag+1];
 if(!outputDir)throw Error("--output 必须指定目录");
 const result=createAuditBatches(loadQuestionBank(),{batchSize:ledger.batchSize||12});
 if(result.manifest.questionCount!==ledger.bankCount)throw Error("导出题数与审核主账不一致，停止部署");
 saveAuditBatches(outputDir,result);
 console.log("READABLE_AUDIT_EXPORT "+JSON.stringify({
  total:result.manifest.questionCount,batchSize:result.manifest.batchSize,
  batchCount:result.batches.length,
  nextIndex:ledger.nextIndex,
  nextFile:result.manifest.batches.find(b=>ledger.nextIndex>=b.fromIndex&&ledger.nextIndex<b.toIndexExclusive)?.file,
  outputDir
 }));
}
