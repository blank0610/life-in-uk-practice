import test from "node:test";
import assert from "node:assert/strict";
import {additionalQuestions} from "../site/data/additional-questions.js";
test("第26、27套题序完整，保留原图答案和选项，跳过未批改重复截图",()=>{
 const byId=new Map(additionalQuestions.map(q=>[q.sourceScreenshot,q]));
 for(const [testNo,start,extra] of [[26,673,0],[27,697,1]]){
   const rows=additionalQuestions.filter(q=>q.sourceTest===testNo);
   assert.deepEqual(rows.map(q=>q.sourceQuestion),Array.from({length:24},(_,i)=>i+1));
   assert.deepEqual(rows.map(q=>q.sourceScreenshot),Array.from({length:24+extra},(_,i)=>start+i).filter(n=>n!==705));
   assert(rows.every(q=>q.explanation.trim()));
 }
 assert(!byId.has(705));
 assert.deepEqual(byId.get(680).correctAnswers,["The House of Lancaster","The House of York"]);
 assert.equal(byId.get(693).options.length,7);
 assert.deepEqual(byId.get(693).correctAnswers,["Additional tax-raising powers","Health","Education","Civil and criminal law","Planning"]);
 assert(byId.get(693).explanation.includes("Remainder obscured"));
 assert.deepEqual(byId.get(699).correctAnswers,["Tolerance of those with different faiths and beliefs","The rule of law"]);
 assert.deepEqual(byId.get(706).correctAnswers,["True"]);
 for(const n of [713,714,715,719])assert.deepEqual(byId.get(n).correctAnswers,["False"]);
});
