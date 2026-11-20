import test from "node:test";
import assert from "node:assert/strict";
import {createAuditBatches} from "../scripts/export-audit-batches.mjs";
import {loadQuestionBank} from "../scripts/audit-question-bank.mjs";
test("导出网站全部487道已校正题目的题干、全部选项、答案和解释",()=>{
 const bank=loadQuestionBank(),result=createAuditBatches(bank);
 assert.equal(result.manifest.questionCount,487);
 assert.equal(result.manifest.batchSize,12);
 assert.equal(result.batches.length,41);
 assert.equal(result.batches.reduce((n,b)=>n+b.items.length,0),487);
 for(const item of result.batches.flatMap(b=>b.items)){
  assert.equal(typeof item.question,"string");
  assert(Array.isArray(item.options)&&item.options.length>=2);
  assert(Array.isArray(item.correctAnswers)&&item.correctAnswers.length>0);
  assert(item.correctAnswers.every(ans=>item.options.includes(ans)));
  assert.equal(typeof item.explanation,"string");
 }
});
test("对照已有审核进度：nextIndex=24所在批次包含来源截图#42",()=>{
 const r=createAuditBatches(loadQuestionBank());
 const batch=r.manifest.batches.find(b=>24>=b.fromIndex&&24<b.toIndexExclusive);
 assert.equal(batch.file,"batch-003.json");
 assert.equal(r.batches[2].items[0].id,"zip-42");
 assert.equal(r.batches[2].items[0].sourceScreenshot,42);
});
test("已修#356的NOT问句及正确手机答案会导出，而不是旧OCR内容",()=>{
 const r=createAuditBatches(loadQuestionBank());
 const q=r.batches.flatMap(b=>b.items).find(q=>q.id==="zip-356");
 assert.equal(q.question,"Which of the following is NOT a British invention?");
 assert.deepEqual(Array.from(q.correctAnswers),["The mobile phone"]);
 assert(q.explanation.includes("The mobile phone is not."));
});
test("审核分批可配置，顺序按照截图号升序",()=>{
 const r=createAuditBatches([
  {id:"zip-40",sourceScreenshot:40,question:"Q",options:["A","B"],correctAnswers:["A"],explanation:"Notes"},
  {id:"zip-17",sourceScreenshot:17,question:"Q",options:["A","B"],correctAnswers:["A"],explanation:"Notes"},
  {id:"zip-25",sourceScreenshot:25,question:"Q",options:["A","B"],correctAnswers:["A"],explanation:"Notes"}],{batchSize:2});
 assert.deepEqual(r.batches.map(b=>b.items.map(q=>q.id)),[["zip-17","zip-25"],["zip-40"]]);
 assert.deepEqual(r.manifest.batches.map(x=>x.file),["batch-001.json","batch-002.json"]);
});
