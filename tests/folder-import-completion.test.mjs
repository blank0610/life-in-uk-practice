import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadQuestionBank} from "../scripts/audit-question-bank.mjs";
import {additionalQuestions} from "../site/data/additional-questions.js";
import {createAuditBatches} from "../scripts/export-audit-batches.mjs";
test("剩余两个ZIP每张截图均有唯一处理记录及有效题号",()=>{
 const c=JSON.parse(readFileSync("development/IMPORT_REMAINING_SOURCE_COVERAGE.json","utf8"));
 const bank=loadQuestionBank(),byId=new Map(bank.map(q=>[q.id,q]));
 const [a,z]=c.sourceRange;
 assert.deepEqual(c.records.map(r=>r.sourceScreenshot),Array.from({length:z-a+1},(_,i)=>a+i));
 assert.equal(c.total,c.records.length);
 const added=new Map(additionalQuestions.map(q=>[q.id,q]));
 const counts={};
 for(const r of c.records){
  assert(byId.has(r.questionId),r.questionId);
  const f=counts[r.sourceFolder]??={total:0,imported:0,duplicate_or_incomplete:0,duplicate_image_text_and_answer:0};
  f.total++;f[r.status]++;
  if(r.status==="imported"){
   assert.equal(r.questionId,"zip-"+r.sourceScreenshot);
   assert.equal(added.get(r.questionId).sourceFolder,r.sourceFolder);
   const q=byId.get(r.questionId);assert(q.question.trim()&&q.explanation.trim());assert(q.correctAnswers.every(x=>q.options.includes(x)));
  }else{assert.notEqual(r.questionId,"zip-"+r.sourceScreenshot);assert(!byId.has("zip-"+r.sourceScreenshot));}
 }
 assert.deepEqual(counts,c.counts);
 const ledger=JSON.parse(readFileSync("development/QUESTION_AUDIT_PROGRESS.json","utf8"));
 const exportData=createAuditBatches(bank,{batchSize:ledger.batchSize});
 assert.equal(exportData.manifest.questionCount,ledger.bankCount);
 assert.deepEqual(ledger.checkedThisRound.map(q=>q.id),exportData.batches.flatMap(b=>b.items).slice(0,ledger.nextIndex).map(q=>q.id));
 assert.equal(byId.get("zip-1177").options.length,3);
 assert.equal(byId.get("zip-1336").correctAnswers.length,2);
 assert.equal(byId.get("zip-1345").correctAnswers.length,3);
 assert.deepEqual(byId.get("zip-1350").correctAnswers,["The Prince of Wales"]);
});
