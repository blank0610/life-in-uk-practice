import test from "node:test";
import assert from "node:assert/strict";
import {sortAuditQuestions,textFindings,nextAuditBatch} from "../scripts/question-audit-progress.mjs";
const qs=[
  {id:"zip-7",sourceScreenshot:7,question:"What is the capital of the UK?",options:["London","Paris"],correctAnswers:["London"],explanation:"London is the capital."},
  {id:"zip-2",sourceScreenshot:2,question:"Who is the patron saint of England?",options:["St George","St David"],correctAnswers:["St George"],explanation:"St George."},
  {id:"zip-4",sourceScreenshot:4,question:"When did it happen?",options:["O8%","0.1%"],correctAnswers:["O8%"],explanation:"Some text"}
];
const start=()=>({schemaVersion:1,repository:"blank0610/life-in-uk-practice",bankCount:3,round:1,nextIndex:0,checkedThisRound:[],completedRounds:[]});
test("按照截图编号先后审核，断点续跑不重复跳题",()=>{
  let state=start();
  let r=nextAuditBatch(state,qs,{size:2,checkedAt:"2026-11-19T00:00:00Z"});
  assert.deepEqual(r.rows.map(x=>x.id),["zip-2","zip-4"]);
  assert.equal(r.updated.nextIndex,2);
  state=r.updated;
  r=nextAuditBatch(state,qs,{size:2,checkedAt:"2026-11-19T01:00:00Z"});
  assert.deepEqual(r.rows.map(x=>x.id),["zip-7"]);
  assert.equal(r.finished,true);
  assert.equal(r.archive.checks.length,3);
  assert.equal(r.updated.round,2);
  assert.equal(r.updated.nextIndex,0);
  assert.equal(r.updated.checkedThisRound.length,0);
  const r2=nextAuditBatch(r.updated,qs,{size:1});
  assert.equal(r2.rows[0].id,"zip-2","第二轮从第一道重新开始");
});
test("无法取得原图时只能写文字审核，不能声称照片已核对",()=>{
  const r=nextAuditBatch(start(),qs,{size:2});
  assert.equal(r.rows[0].imageCompared,false);
  assert.equal(r.rows[0].status,"text_screened_photo_unavailable");
  assert.equal(r.rows[1].status,"needs_review");
  assert(r.rows[1].findings.includes("数字与字母混淆"));
});
test("真正有来源图的核验需显式提供来源证明标记",()=>{
  const r=nextAuditBatch(start(),qs,{size:1,visualVerifiedIds:["zip-2"]});
  assert.equal(r.rows[0].status,"visually_checked");
  assert.equal(r.rows[0].imageCompared,true);
});
test("题库总数变动立即停止，防止错误沿用旧指针",()=>{
  assert.throws(()=>nextAuditBatch({...start(),bankCount:487},qs),/题库数量/);
});
