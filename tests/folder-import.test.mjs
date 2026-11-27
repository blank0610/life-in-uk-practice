import test from "node:test";
import assert from "node:assert/strict";
import {additionalQuestions} from "../site/data/additional-questions.js";
test("文件夹顺序追加：已核对的有效截图进入同一题库，回退重复截图不进入",()=>{
 const ids=additionalQuestions.map(q=>q.sourceScreenshot);
 assert.equal(new Set(ids).size,ids.length);
 assert.deepEqual(ids,ids.slice().sort((a,b)=>a-b));
 const byId=new Map(additionalQuestions.map(q=>[q.sourceScreenshot,q]));
 const expected=[722,723,...Array.from({length:48},(_,i)=>750+i)];
 for(const n of expected){
  const q=byId.get(n);
  assert(q,"missing screenshot "+n);
  assert(q.question.trim()&&q.explanation.trim());
  assert(q.correctAnswers.every(a=>q.options.includes(a)));
 }
 for(let n=724;n<=749;n++)assert(!byId.has(n),"duplicate screenshot "+n);
 assert.deepEqual(byId.get(757).correctAnswers,["Cambridge University","Oxford University"]);
 assert.deepEqual(byId.get(766).correctAnswers,["Your local library","www.parliament.uk"]);
 assert.deepEqual(byId.get(773).correctAnswers,["The Isle of Man","The Channel Islands"]);
 assert.equal(byId.get(759).correctAnswers[0],"The windscreen of the car");
 assert.deepEqual(byId.get(790).correctAnswers,["Eid al-Fitr"]);
 assert.deepEqual(byId.get(754).correctAnswers,["False"]);
 assert.deepEqual(byId.get(765).correctAnswers,["False"]);
});
