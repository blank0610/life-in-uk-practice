import {scanQuestionBank} from "./audit-question-bank.mjs";
import {sortAuditQuestions,textFindings} from "./question-audit-progress.mjs";

// Independent machine screening. Never advance the sequential human/visual ledger.
export function fullAuditSweep(ledger,questions,{checkedAt=null,sourceSha=null}={}){
  const sorted=sortAuditQuestions(questions),expectedCount=ledger.bankCount;
  const ids=new Set(sorted.map(q=>q.id));
  if(!Number.isSafeInteger(expectedCount)||expectedCount<1||sorted.length!==expectedCount||ids.size!==expectedCount||
      sorted.some(q=>typeof q.id!=="string"||!q.id.trim()))throw Error("全库审核覆盖校验失败：题数或唯一ID不一致");
  const {severe,review}=scanQuestionBank(sorted),findingsById=new Map();
  for(const issue of [...severe,...review]){
    const findings=findingsById.get(issue.id)||[];
    findings.push(issue.reason);findingsById.set(issue.id,findings);
  }
  const records=sorted.map(q=>{
    const findings=[...textFindings(q),...(findingsById.get(q.id)||[])];
    const fields=[["question",q.question],["explanation",q.explanation],
      ...(q.options||[]).map((v,i)=>["options["+i+"]",v]),
      ...(q.correctAnswers||[]).map((v,i)=>["correctAnswers["+i+"]",v])];
    for(const [field,value] of fields){
      if(typeof value!=="string"){findings.push(field+" 非文字字段");continue;}
      if(field!=="explanation"&&!value.trim())findings.push(field+" 缺失文字");
      if(/\b(?:NOI|tlag|2Uth)\b|\uFFFD/.test(value))findings.push(field+" 疑似 OCR 错字或乱码，须核原图");
    }
    if(Array.isArray(q.options)&&new Set(q.options).size!==q.options.length)findings.push("选项重复，须核原图");
    return {id:q.id,sourceScreenshot:q.sourceScreenshot,findings:[...new Set(findings)],imageCompared:false};
  });
  return {schemaVersion:1,checkedAt,sourceSha,expectedCount,scannedCount:records.length,uniqueIdCount:ids.size,
    complete:true,checkMode:"rule_based",imageComparedCount:0,originalImagesAvailable:false,
    manualTextReviewedCount:0,unprocessedIds:[],unprocessedBatches:[],
    severeCount:severe.length,flaggedCount:records.filter(r=>r.findings.length).length,records};
}
