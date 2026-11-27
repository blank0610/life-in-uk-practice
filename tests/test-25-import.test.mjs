import test from "node:test";
import assert from "node:assert/strict";
import {additionalQuestions} from "../site/data/additional-questions.js";
test("第25套24题全部保留源编号、原选项、正确答案",()=>{
 const rows=additionalQuestions.filter(q=>q.sourceTest===25);
 assert.deepEqual(rows.map(q=>q.sourceQuestion),Array.from({length:24},(_,i)=>i+1));
 assert.deepEqual(rows.map(q=>q.sourceScreenshot),Array.from({length:24},(_,i)=>649+i));
 assert(rows.every(q=>q.explanation.trim()));
 const byId=new Map(rows.map(q=>[q.sourceScreenshot,q]));
 assert.deepEqual(byId.get(655).correctAnswers,["False"]);
 assert.deepEqual(byId.get(658).correctAnswers,["False"]);
 assert.deepEqual(byId.get(666).correctAnswers,["Pancake day","Shrove Tuesday"]);
 assert.deepEqual(byId.get(668).correctAnswers,["True"]);
 assert.deepEqual(byId.get(661).correctAnswers,["The Turing machine"]);
 assert(byId.get(661).options.includes("The Radar"));
 assert(!byId.get(661).question.endsWith("The Radar"));
});
