import test from "node:test";
import assert from "node:assert/strict";
import {loadQuestionBank,scanQuestionBank} from "../scripts/audit-question-bank.mjs";
const bank=loadQuestionBank(),byId=new Map(bank.map(q=>[q.id,q]));
test("题库仍为487道真实截图题",()=>assert.equal(bank.length,487));
test("原图#302仅有四个年份选项，且解释不混入选项",()=>{
  const q=byId.get("zip-302");
  assert.equal(q.question,"When did the Black Death come to England?");
  assert.deepEqual(q.options,["In 1248","In 1348","In 1358","In 1414"]);
  assert.deepEqual(Array.from(q.correctAnswers),["In 1348"]);
  assert.equal(q.explanation,"In 1348, a disease, probably a form of plague, came to Britain. This was known as the Black Death.");
});
test("原图#360人口普查题四个百分比选项与正确答案一致",()=>{
  const q=byId.get("zip-360");
  assert.equal(q.question,"According to 2011 Census, what percentage of the population identified themselves as Sikh?");
  assert.deepEqual(Array.from(q.options),["0.1%","0.5%","0.8%","2%"]);
  assert.deepEqual(Array.from(q.correctAnswers),["0.8%"]);
  assert(q.explanation.includes("Sikh (0.8%)"));
  assert(!q.options.some(x=>/^[oO]\d+%$/.test(x)));
});
test("原图#80四旬期题的最后一个选项必须是40而不是AQ",()=>{
  const q=byId.get("zip-80");
  assert(q.options.includes("40 days after Easter"));
  assert(!q.options.some(x=>x.includes("AQ days")));
  assert(q.correctAnswers.includes("40 days before Easter"));
});
test("不能将 Correct/Incorrect 反馈或说明句错误收录为答案",()=>{
  const result=scanQuestionBank(bank);
  assert.equal(result.severe.length,0,"选项混入反馈/说明的题号："+result.severe.map(x=>x.id).join(", "));
});

test("原图多选题保留合法的六个选项，不因防污染筛查被删除",()=>{
  const a=byId.get("zip-31"),b=byId.get("zip-283");
  assert.equal(a.options.length,6);
  assert.equal(a.correctAnswers.length,5);
  assert.equal(b.options.length,6);
  assert.equal(b.correctAnswers.length,4);
});
