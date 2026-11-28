import test from "node:test";
import assert from "node:assert/strict";
import {fullAuditSweep} from "../scripts/full-bank-audit.mjs";
const qs=Array.from({length:73},(_,i)=>({id:"zip-"+(i+1),sourceScreenshot:i+1,
 question:"Which option is correct?",options:["One","Two"],correctAnswers:["One"],explanation:"One is the answer."}));
test("全库扫描忽略旧游标和12道分包限制，不改变原始审核主账",()=>{
 const ledger={bankCount:qs.length,batchSize:12,nextIndex:49,round:2,checkedThisRound:[{id:"zip-1"}]};
 const before=JSON.stringify(ledger),report=fullAuditSweep(ledger,qs,{sourceSha:"test-sha"});
 assert.equal(report.complete,true);assert.equal(report.scannedCount,qs.length);
 assert.equal(report.uniqueIdCount,qs.length);assert.equal(report.records[0].id,"zip-1");
 assert.equal(report.records.at(-1).id,"zip-73");assert.equal(report.checkMode,"rule_based");
 assert.equal(report.imageComparedCount,0);assert.equal(report.manualTextReviewedCount,0);
 assert(report.records.every(r=>r.imageCompared===false));
 assert.equal(JSON.stringify(ledger),before);
});
test("全库扫描覆盖尾部选项、答案和解释的疑似错误",()=>{
 const rows=qs.map(q=>({...q}));rows.at(-1).explanation="The tlag.";
 rows[50].question="Which Is NOI a British invention of the 2Uth century?";
 rows[51].options=["$ million","10 million"];rows[51].correctAnswers=["$ million"];
 const r=fullAuditSweep({bankCount:rows.length},rows);
 for(const i of [50,51,72])assert(r.records[i].findings.length>0);
 assert(r.records[72].findings.some(x=>x.includes("explanation")));
});
test("题数不符、重复题号均不能声称全库检查完成",()=>{
 assert.throws(()=>fullAuditSweep({bankCount:qs.length+1},qs),/覆盖校验/);
 assert.throws(()=>fullAuditSweep({bankCount:qs.length},[...qs.slice(0,-1),qs[0]]),/覆盖校验/);
});
