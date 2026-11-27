import test from "node:test";
import assert from "node:assert/strict";
import {additionalQuestions} from "../site/data/additional-questions.js";
test("第23套24道完整、排除重复截图、保持多选答案",()=>{
 const rows=additionalQuestions.filter(q=>q.sourceTest===23);
 assert.deepEqual(rows.map(q=>q.sourceQuestion),Array.from({length:24},(_,i)=>i+1));
 assert.deepEqual(rows.map(q=>q.sourceScreenshot),Array.from({length:25},(_,i)=>600+i).filter(n=>n!==602));
 assert(rows.every(q=>q.explanation.trim()));
 const byId=new Map(rows.map(q=>[q.sourceScreenshot,q]));
 assert.deepEqual(byId.get(610).correctAnswers,["The central government","Local taxes"]);
 assert.deepEqual(byId.get(601).correctAnswers,["Spain"]);
});
