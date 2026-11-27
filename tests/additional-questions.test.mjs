import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {additionalQuestions,appendAdditionalQuestions} from "../site/data/additional-questions.js";
import {loadQuestionBank} from "../scripts/audit-question-bank.mjs";
import {createAuditBatches} from "../scripts/export-audit-batches.mjs";
test("新来源题全部进入实际网站题库和顺序审核分包",()=>{
 const bank=loadQuestionBank(),byId=new Map(bank.map(q=>[q.id,q]));
 const ledger=JSON.parse(readFileSync("development/QUESTION_AUDIT_PROGRESS.json","utf8"));
 assert.equal(bank.length,ledger.bankCount);
 const result=createAuditBatches(bank,{batchSize:ledger.batchSize});
 const audited=new Set(result.batches.flatMap(b=>b.items.map(q=>q.id)));
 for(const q of additionalQuestions){assert.deepEqual(byId.get(q.id),q);assert(audited.has(q.id));}
 assert(!byId.has("zip-552"),"同一题重复截图不能新增");
 assert.equal(byId.get("zip-520").question,"During which movement the Parliament passed laws giving women the right to equal pay and made it illegal for employees to discriminate against women because of their gender:");
 assert.equal(new Set(bank.map(q=>q.id)).size,bank.length);
 assert.deepEqual(ledger.checkedThisRound.map(q=>q.id),result.batches.flatMap(b=>b.items).slice(0,ledger.nextIndex).map(q=>q.id));
});
test("拒绝覆盖旧题号或错位答案",()=>{
 const q=additionalQuestions[0];
 assert.throws(()=>appendAdditionalQuestions(new Map([[q.id,q]]),[q]),/编号冲突/);
 assert.throws(()=>appendAdditionalQuestions(new Map(),[{...q,correctAnswers:["not an option"]}]),/格式无效/);
});
test("第21套24道均有原始题序，原图无解释不猜测",()=>{
 const rows=additionalQuestions.filter(q=>q.sourceTest===21);
 assert.deepEqual(rows.map(q=>q.sourceQuestion),Array.from({length:24},(_,i)=>i+1));
 assert.equal(rows.find(q=>q.sourceScreenshot===563).explanation,"");
 assert.equal(rows.find(q=>q.sourceScreenshot===568).explanation,"");
});
