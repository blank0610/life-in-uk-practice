import test from "node:test";
import assert from "node:assert/strict";
import {additionalQuestions} from "../site/data/additional-questions.js";
test("第24套截图及题序完整，多选答案正确",()=>{
 const rows=additionalQuestions.filter(q=>q.sourceTest===24);
 assert.deepEqual(rows.map(q=>q.sourceQuestion),Array.from({length:24},(_,i)=>i+1));
 assert.deepEqual(rows.map(q=>q.sourceScreenshot),Array.from({length:24},(_,i)=>625+i));
 assert(rows.every(q=>q.explanation.trim()));
 const byId=new Map(rows.map(q=>[q.sourceScreenshot,q]));
 assert.deepEqual(byId.get(638).correctAnswers,["Catherine Howard","Anne Boleyn"]);
 assert.deepEqual(byId.get(648).correctAnswers,["Coronation Street","EastEnders"]);
 assert.deepEqual(byId.get(636).correctAnswers,["False"]);
 assert(byId.get(643).correctAnswers[0].includes("Wilmut"));
});
