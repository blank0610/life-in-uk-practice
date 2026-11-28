import {shuffle} from "../site/assets/random-order.js";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadQuestionBank} from "../scripts/audit-question-bank.mjs";
import {ORIGINAL_TESTS,ORIGINAL_TEST_VARIANTS} from "../site/data/original-tests.js";
import {buildOriginalTests,sourceTestView,pickSourceTestQuestion,recordSourceTestAnswer,restartSourceTest} from "../site/assets/original-test-practice.js";
const bank=loadQuestionBank(),sets=buildOriginalTests(bank);
test("原图40套各24题，全部引用有效题ID，无新题或旧ID删除",()=>{
 assert.deepEqual(sets.map(t=>t.number),Array.from({length:40},(_,i)=>i+1));
 assert(sets.every(t=>t.available&&t.entries.length===24));
 assert.deepEqual(new Set([...sets.flatMap(t=>t.entries.map(e=>e.questionId)),...ORIGINAL_TEST_VARIANTS.map(v=>v.questionId)]),new Set(bank.map(q=>q.id)));
 assert.equal(sets[8].entries[22].sourceScreenshot,252);
 assert.equal(sets[20].entries[0].sourceScreenshot,551);
 assert.equal(sets[32].entries[0].sourceScreenshot,1118);
 assert.equal(sets[33].entries[11].sourceScreenshot,1153);
 assert.equal(sets[33].entries[11].questionId,"zip-839");
 assert.equal(sets[34].entries[4].sourceScreenshot,1172);
 assert.equal(sets[34].entries[5].sourceScreenshot,1170);
 assert.equal(sets.at(-1).entries.at(-1).sourceScreenshot,1350);
 for(const v of ORIGINAL_TEST_VARIANTS)assert.equal(sets[v.test-1].entries[v.position-1].questionId,v.canonicalId);
});
test("套内随机排列，跳过会返回，完成结果不重复计数",()=>{
 const p={attempts:123,notes:{keep:"keep"}},t=sets[39];
 const first=pickSourceTestQuestion(p,t,null,()=>0),second=pickSourceTestQuestion(p,t,first.id);
 const order=[...p.sourceTestProgress[t.number].order];
 assert.notDeepEqual(order,t.entries.map(e=>e.questionId));
 assert.equal(first.id,order[0]);assert.equal(second.id,order[1]);
 assert.equal(sourceTestView(p,t).done,0);
 assert(recordSourceTestAnswer(p,t,second.id,"yes"));
 assert(!recordSourceTestAnswer(p,t,second.id,"yes"));
 let q=pickSourceTestQuestion(p,t,second.id);
 for(const id of order.slice(2)){assert.equal(q.id,id);assert(recordSourceTestAnswer(p,t,q.id,"no"));q=pickSourceTestQuestion(p,t,q.id);}
 assert.equal(q.id,first.id);assert(recordSourceTestAnswer(p,t,q.id,"unsure"));
 assert.equal(pickSourceTestQuestion(p,t,q.id),null);
 assert.deepEqual(sourceTestView(p,t),{done:24,total:24,correct:1,wrong:22,unsure:1,complete:true,completedRuns:1});
 assert.equal(p.attempts,123);assert.equal(p.notes.keep,"keep");
 assert(restartSourceTest(p,t,()=>0));assert.equal(sourceTestView(p,t).done,0);assert.equal(sourceTestView(p,t).completedRuns,1);
 assert.notDeepEqual(p.sourceTestProgress[t.number].order,order);
});
test("所有套题的随机轮次均只出本套题，不重复且完整覆盖",()=>{
 for(const t of sets){
  const p={},ids=[];
  for(let q=pickSourceTestQuestion(p,t,null,()=>0);q;q=pickSourceTestQuestion(p,t,q.id)){
   ids.push(q.id);assert.equal(q.sourceTest,t.number);
   assert.equal(q.sourceQuestion,t.entries.find(e=>e.questionId===q.id).position);
   assert(recordSourceTestAnswer(p,t,q.id,"yes"));
  }
  assert.equal(ids.length,t.entries.length);
  assert.deepEqual(new Set(ids),new Set(t.entries.map(e=>e.questionId)));
  assert.notDeepEqual(ids,t.entries.map(e=>e.questionId));
  assert(sourceTestView(p,t).complete);
  assert(restartSourceTest(p,t,()=>0.999));
  assert.notDeepEqual(p.sourceTestProgress[t.number].order,ids);
 }
});
test("刷新、切换套题及旧备份迁移保留结果和随机顺序",()=>{
 const p={},t=sets[0],other=sets[1],q=pickSourceTestQuestion(p,t,null,()=>0);
 recordSourceTestAnswer(p,t,q.id,"yes");
 const order=[...p.sourceTestProgress[t.number].order],restored=JSON.parse(JSON.stringify(p));
 assert.equal(pickSourceTestQuestion(restored,t).id,order[1]);
 assert.deepEqual(restored.sourceTestProgress[t.number].order,order);
 assert(pickSourceTestQuestion(restored,other,null,()=>0));
 assert.equal(sourceTestView(restored,t).done,1);
 assert(!restartSourceTest(restored,t));
 assert(!buildOriginalTests([]).some(t=>t.available));
 assert(!recordSourceTestAnswer(restored,t,"not-in-test","yes"));
 const old={sourceTestProgress:{[t.number]:{results:{[q.id]:"yes"},cursor:5,completedRuns:2}}};
 const next=pickSourceTestQuestion(old,t,null,()=>0.999);
 assert.notEqual(next.id,q.id);
 assert.equal(sourceTestView(old,t).done,1);
 assert.equal(sourceTestView(old,t).completedRuns,2);
 assert.equal(old.sourceTestProgress[t.number].order.length,t.entries.length);
 old.sourceTestProgress[t.number].order=Array(t.entries.length).fill(q.id);
 assert.notEqual(pickSourceTestQuestion(old,t,null,()=>0).id,q.id);
 assert.equal(new Set(old.sourceTestProgress[t.number].order).size,t.entries.length);
});
test("套题和全库共用选项随机排列，原始选项及答案不变",()=>{
 for(const t of sets)for(const e of t.entries){
  const q=e.question,original=[...q.options],answers=[...q.correctAnswers];
  const mixed=shuffle(q.options,()=>0);
  assert.deepEqual([...mixed].sort(),[...original].sort());
  assert.notDeepEqual(mixed,original);
  assert.deepEqual([...q.options],original);
  assert.deepEqual([...q.correctAnswers],answers);
  assert(answers.every(answer=>mixed.includes(answer)));
 }
 const app=readFileSync("site/assets/app.js","utf8");
 assert(app.includes('import {shuffle} from "./random-order.js"'));
 assert(app.includes('const q=pick();question=q?{...q,display:shuffle(q.options)}:null;'));
});
test("界面接入独立选择器且随机模式仍使用原调度",()=>{
 const app=readFileSync("site/assets/app.js","utf8"),html=readFileSync("site/index.html","utf8");
 assert(html.includes('id="source-test-select"'));
 assert(app.includes('return pickScheduled(bank().questions,p(),'));
 assert(app.includes('if(test)return pickSourceTestQuestion'));
 assert(app.includes('recordSourceTestAnswer(pr,test,question.id,feedback)'));
 const unsure=app.slice(app.indexOf("function unsure()"),app.indexOf("function announceStudyMilestone"));
 assert(/feedback="unsure";\s*const test=activeSourceTest\(\);if\(test\)recordSourceTestAnswer\(pr,test,question.id,feedback\)/.test(unsure));
 assert(app.includes('drawSourceTestSummary(quiz,test)'));
});
