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
test("按原序出题，跳过会返回，完成结果不重复计数",()=>{
 const p={attempts:123,notes:{keep:"keep"}},t=sets[0];
 const first=pickSourceTestQuestion(p,t),second=pickSourceTestQuestion(p,t,first.id);
 assert.equal(first.sourceQuestion,1);assert.equal(second.sourceQuestion,2);
 assert.equal(sourceTestView(p,t).done,0);
 assert(recordSourceTestAnswer(p,t,second.id,"yes"));
 assert(!recordSourceTestAnswer(p,t,second.id,"yes"));
 let q=pickSourceTestQuestion(p,t,second.id);
 for(let i=3;i<=24;i++){assert.equal(q.sourceQuestion,i);assert(recordSourceTestAnswer(p,t,q.id,"no"));q=pickSourceTestQuestion(p,t,q.id);}
 assert.equal(q.id,first.id);assert(recordSourceTestAnswer(p,t,q.id,"unsure"));
 assert.equal(pickSourceTestQuestion(p,t,q.id),null);
 assert.deepEqual(sourceTestView(p,t),{done:24,total:24,correct:1,wrong:22,unsure:1,complete:true,completedRuns:1});
 assert.equal(p.attempts,123);assert.equal(p.notes.keep,"keep");
 assert(restartSourceTest(p,t));assert.equal(sourceTestView(p,t).done,0);assert.equal(sourceTestView(p,t).completedRuns,1);
});
test("各套独立持久化并保留作答，缺失ID的套题不开放",()=>{
 const p={},t=sets[0],other=sets[1],q=pickSourceTestQuestion(p,t);
 recordSourceTestAnswer(p,t,q.id,"yes");
 const restored=JSON.parse(JSON.stringify(p));
 assert.equal(pickSourceTestQuestion(restored,t).sourceQuestion,2);
 assert.equal(pickSourceTestQuestion(restored,other).sourceQuestion,1);
 assert.equal(sourceTestView(restored,t).done,1);
 assert(!restartSourceTest(restored,t));
 assert(!buildOriginalTests([]).some(t=>t.available));
 assert(!recordSourceTestAnswer(restored,t,"not-in-test","yes"));
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
