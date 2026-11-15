import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {gunzipSync} from "node:zlib";
import vm from "node:vm";
import {applyTextFixes} from "../site/assets/quality-fixes.js";

const sandbox={window:{}};
vm.runInNewContext(readFileSync("site/data/questions.js","utf8"),sandbox);
vm.runInNewContext(readFileSync("site/data/spelling-fixes.js","utf8"),sandbox);
function unpack(str){return JSON.parse(gunzipSync(Buffer.from(str,"base64")).toString("utf8"));}
const primary=unpack(sandbox.window.LIFE_UK_PACKED);
const manual=new Map(sandbox.window.LIFE_UK_QUESTIONS.questions.map(q=>[q.id,q]));
const items=new Map(primary.map(([n,q,options,indices,explanation])=>{
  const old=manual.get("zip-"+n);
  const question=old?.question||q.replace(/\s*\(0\)/g,"").replace(/\s+[»©]\s*/g," ").replace(/\s+/g," ").trim();
  const opts=old?.options||options;
  const answers=old?.correctAnswers||indices.map(i=>options[i]);
  return ["zip-"+n,{id:"zip-"+n,question,options:opts,
    correctAnswers:answers,explanation:explanation||"",sourceScreenshot:n}];
}));
items.delete("zip-198");
const changes=unpack(readFileSync("site/data/recheck-2026-11-15.b64","utf8").trim());
for(const [n,q,options,indices,explanation] of changes){
  const id="zip-"+n,old=items.get(id);
  const opts=options??old?.options;
  const answerIndices=indices??old?.correctAnswers.map(a=>old.options.indexOf(a));
  items.set(id,{id,question:q??old.question,options:opts,
    correctAnswers:answerIndices.map(i=>opts[i]),
    explanation:explanation??old?.explanation??"",sourceScreenshot:n});
}
test("逐条校对规则均匹配真实题干、选项或说明",()=>{
  assert.equal(items.size,487);
  const fixes=sandbox.window.LIFE_UK_TEXT_FIXES;
  assert(Object.keys(fixes).length>=30);
  const copy=new Map([...items].map(([id,q])=>[id,{...q,options:[...q.options],correctAnswers:[...q.correctAnswers]}]));
  applyTextFixes(copy,fixes);
  for(const [id,fix] of Object.entries(fixes)){
    const after=copy.get(id),before=items.get(id);
    assert(after,"缺失校正对象 "+id);
    assert.equal(after.correctAnswers.length,fix.correctOptionIndices?.length??before.correctAnswers.length,id+" 答案数量异常");
    assert(after.correctAnswers.every(answer=>after.options.includes(answer)),id+" 答案必须跟随选项修正");
    assert.equal(after.options.length,fix.optionsText?.length??before.options.length,id+" 选项数量异常");
    assert.notDeepEqual(
      [after.question,after.options,after.explanation],
      [before.question,before.options,before.explanation],
      id+" 没有产生任何实际修正"
    );
  }
  assert(copy.get("zip-278").question.includes("Theresa May"));
  assert(copy.get("zip-111").options.includes("A dragon"));
  assert(copy.get("zip-295").options.includes("Roast beef"));
  assert(copy.get("zip-483").question.includes("Wilmut"));
  assert(copy.get("zip-391").explanation.includes("96 Members"));
  assert(copy.get("zip-524").explanation.includes("Oliver Cromwell"));
  assert.equal(copy.get("zip-267").options.length,4,"British constitution 题需要原图四个选项");
  assert(copy.get("zip-267").correctAnswers[0].includes("not written down"));
  assert(copy.get("zip-224").explanation.endsWith("House of Lords."));
  assert(copy.get("zip-510").explanation.includes("Elizabeth II's"));
  assert(![...copy.values()].some(q=>/\b(DEMO ONLY|EXAMPLE ONLY)\b/.test(q.question)));
  // 跨 487 道题排查高可信 OCR 残留：复查拼写不是只对已修改题号运行。
  const obviousOcr=/\b(?:Sutfragettes|raundhouses|tambs|civarce|Iheresa|Sutfragettes|intraduced|commemcerated|Farcing|farcing|Frime Minister|Aweek|Henry Vill|Sir lan Wilmot|Sir Ian Wilmot|Roast heeft|Cliver Cromwell|lsambard|magna garta|Erief Encounter)\b|\b(?:cf|fram|te|persan|whe)\b/i;
  for(const [id,item] of copy){
    const combined=[item.question,...item.options,item.explanation].join(" ");
    assert(!obviousOcr.test(combined),"题库仍有高置信度拼写/OCR 错误："+id+" — "+combined.match(obviousOcr)?.[0]);
  }

});
