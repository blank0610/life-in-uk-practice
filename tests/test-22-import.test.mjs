import test from "node:test";
import assert from "node:assert/strict";
import {additionalQuestions} from "../site/data/additional-questions.js";
test("第22套题完整、保留多选与真假答案",()=>{
 const rows=additionalQuestions.filter(q=>q.sourceTest===22);
 assert.deepEqual(rows.map(q=>q.sourceQuestion),Array.from({length:24},(_,i)=>i+1));
 assert.deepEqual(rows.map(q=>q.sourceScreenshot),Array.from({length:24},(_,i)=>576+i));
 assert(rows.every(q=>q.explanation.trim()));
 const byId=new Map(rows.map(q=>[q.sourceScreenshot,q]));
 for(const n of [580,584,587])assert.equal(byId.get(n).correctAnswers.length,2);
 assert.deepEqual(byId.get(582).correctAnswers,["False"]);
 assert.deepEqual(byId.get(592).correctAnswers,["Skara Brae"]);
});
