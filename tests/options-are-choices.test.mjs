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
test("不能将 Correct/Incorrect 反馈或说明句错误收录为答案",()=>{
  const result=scanQuestionBank(bank);
  assert.equal(result.severe.length,0,"选项混入反馈/说明的题号："+result.severe.map(x=>x.id).join(", "));
});
