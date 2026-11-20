import test from "node:test";
import assert from "node:assert/strict";
import {loadQuestionBank,scanQuestionBank} from "../scripts/audit-question-bank.mjs";
const bank=loadQuestionBank(),byId=new Map(bank.map(q=>[q.id,q]));
test("题库仍为487道真实截图题",()=>assert.equal(bank.length,487));
test("首轮逐图审核#22 Shakespeare题必须包含原截图的完整解释",()=>{
  const q=byId.get("zip-22");
  assert.equal(q.question,"The Elizabethan period is known for the richness of its poetry and drama, especially for the plays and poems of which playwright?");
  assert.deepEqual(Array.from(q.correctAnswers),["William Shakespeare"]);
  assert.deepEqual(new Set(q.options),new Set(["Alexander Dumas","William Shakespeare","Charles Dickens","Thomas Hardy"]));
  assert.equal(q.explanation,"The Elizabethan period is remembered for the richness of its poetry and drama, especially the plays and poems of William Shakespeare.");
});

test("截图#356题干 NOT 与四个发明选项及答案符合原图",()=>{
 const q=byId.get("zip-356");
 assert.equal(q.question,"Which of the following is NOT a British invention?");
 assert.deepEqual(new Set(q.options),new Set(["The World Wide Web","The Turing machine","The hovercraft","The mobile phone"]));
 assert.deepEqual(Array.from(q.correctAnswers),["The mobile phone"]);
 assert.equal(q.explanation,"The World Wide Web, the Turing machine and the hovercraft are British inventions. The mobile phone is not.");
});
test("原图#343 Hindu 2011人口普查小数点不能变成15%",()=>{
 const q=byId.get("zip-343");
 assert.equal(q.question,"According to the 2011 Census, what percentage of the population identified themselves as Hindu?");
 assert.deepEqual(Array.from(q.options),["0.5%","1%","1.5%","3%"]);
 assert.deepEqual(Array.from(q.correctAnswers),["1.5%"]);
 assert(q.explanation.includes("Hindu (1.5%)"));
 assert(!q.options.includes("15%"));
});
test("数字答案与解释不一致时仅标记待核图，不靠推测修改答案",()=>{
 const good={
  id:"zip-343",question:"According to the 2011 Census, what percentage of the population identified themselves as Hindu?",
  options:["0.5%","1%","1.5%","3%"],correctAnswers:["1.5%"],
  explanation:"Population includes Hindu (1.5%), Sikh (0.8%)."
 };
 const wrong={...good,options:["0.5%","1%","15%","3%"],correctAnswers:["15%"]};
 assert(scanQuestionBank([wrong]).review.some(x=>x.reason.includes("答案百分比")));
 assert(!scanQuestionBank([good]).review.some(x=>x.reason.includes("答案百分比")));
});
test("原始截图#316伊拉克英军撤离题已原图核对，答案为2009",()=>{
 const q=byId.get("zip-316");
 assert.equal(q.question,"When did British combat troops leave Iraq?");
 assert.deepEqual(new Set(q.options),new Set(["In 2004","In 2005","In 2006","In 2009"]));
 assert.deepEqual(Array.from(q.correctAnswers),["In 2009"]);
 assert(q.explanation.includes("British combat troops left Iraq in 2009"));
});
test("原图#127保留完整奥运题干、四选项、正确答案和已有解释",()=>{
  const q=byId.get("zip-127");
  assert.equal(q.question,"In which category did Jayne Torvill and Christopher Dean win gold medals at the Olympic Games in 1984?");
  assert.deepEqual(new Set(q.options),new Set(["Rowing","Marathon","Swimming","Ice dancing"]));
  assert.deepEqual(Array.from(q.correctAnswers),["Ice dancing"]);
  assert(q.explanation.includes("Jayne Torvill and Christopher Dean"));
  assert(q.explanation.includes("1984"));
});
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
test("原始截图#462 Saint Andrew日期题不出现OCR错字，答案为11月30日",()=>{
  const q=byId.get("zip-462");
  assert.equal(q.question,"When is St Andrews Day, patron saint of Scotland?");
  assert.deepEqual(new Set(q.options),new Set(["23rd of April","1st of March","17th of March","30th of November"]));
  assert.deepEqual(Array.from(q.correctAnswers),["30th of November"]);
  assert.equal(q.explanation,"St Andrews Day, patron saint of Scotland, is celebrated on the 30th of November.");
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
