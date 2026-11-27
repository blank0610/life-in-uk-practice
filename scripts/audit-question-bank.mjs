import {additionalQuestions,appendAdditionalQuestions} from "../site/data/additional-questions.js";
import {readFileSync} from "node:fs";
import {gunzipSync} from "node:zlib";
import vm from "node:vm";
import {applyTextFixes} from "../site/assets/quality-fixes.js";

// 与网站加载过程一致；审查的是用户在网页上实际看到的题库，不是未经修正的 OCR 数据。
export function loadQuestionBank(){
  const context={window:{}};
  vm.runInNewContext(readFileSync("site/data/questions.js","utf8"),context);
  vm.runInNewContext(readFileSync("site/data/spelling-fixes.js","utf8"),context);
  const unpack=b64=>JSON.parse(gunzipSync(Buffer.from(b64.trim(),"base64")).toString("utf8"));
  const originals=unpack(context.window.LIFE_UK_PACKED);
  const manual=new Map(context.window.LIFE_UK_QUESTIONS.questions.map(q=>[q.id,q]));
  const map=new Map(originals.map(([n,q,opts,idx,note])=>{
    const id="zip-"+n,corrected=manual.get(id);
    return [id,{
      id,sourceScreenshot:n,
      question:corrected?.question||q.replace(/\s*\(0\)/g,"").replace(/\s+[»©]\s*/g," ").replace(/\s+/g," ").trim(),
      options:corrected?.options||opts,
      correctAnswers:corrected?.correctAnswers||idx.map(i=>opts[i]),
      explanation:note||""
    }];
  }));
  map.delete("zip-198");
  const delta=unpack(readFileSync("site/data/recheck-2026-11-15.b64","utf8"));
  for(const [n,q,options,indices,explanation] of delta){
    const id="zip-"+n,old=map.get(id);
    if(!old&&!q)throw Error("截图新增题目缺少题干："+id);
    const opts=options??old?.options;
    const oldIdx=old?.correctAnswers.map(x=>old.options.indexOf(x))||[];
    const selected=indices??oldIdx;
    map.set(id,{
      id,sourceScreenshot:n,
      question:q??old.question,
      options:opts,
      correctAnswers:selected.map(i=>opts[i]),
      explanation:explanation===null?(old?.explanation||""):explanation
    });
  }
  applyTextFixes(map,context.window.LIFE_UK_TEXT_FIXES);
  appendAdditionalQuestions(map,additionalQuestions);
  return [...map.values()];
}
export function scanQuestionBank(questions){
  const severe=[],review=[];
  for(const q of questions){
    const options=q.options||[];
    if(!q.question?.trim()||options.length<2||!q.correctAnswers?.length||q.correctAnswers.some(a=>!options.includes(a))){
      severe.push({id:q.id,reason:"题干/选项/正确答案缺失或不对应",question:q.question,options});
      continue;
    }
    // 纠正 OCR 对反馈框的错误提取，避免 “Incorrect ...” / “Correct ...” 被显示为选择项。
    const feedback=options.filter(o=>/^\s*(incorrect|correct|your answer|explanation|check answer|right answer)\s*[\s:,.!]/i.test(o));
    const suspiciousFragments=options.filter(o=>/^\s*(?:death\.|next|previous|review)\s*$/i.test(o));
    if(feedback.length||suspiciousFragments.length){
      severe.push({id:q.id,reason:"答题反馈或解释疑似混入选项",question:q.question,options,feedback});
      continue;
    }
    if(options.length>4&&q.correctAnswers.length===1){
      review.push({id:q.id,reason:"单选题超过四个选项：检查是否误纳解释",question:q.question,options});
    }
    const giant=options.filter(o=>o.length>190);
    if(giant.length)review.push({id:q.id,reason:"超长选项：需人工辨认是否含说明文字",question:q.question,options});
    // 识别数字被误当字母的百分比，例如“O8%”应为“0.8%”。只检查可疑数字，不自动猜测数值。
    const suspectPercentages=options.filter(o=>/^\s*[oO]\d+(?:\.\d+)?\s*%\s*$/.test(o)||/^\s*\d+[oO]\d*\s*%\s*$/.test(o));
    if(suspectPercentages.length)severe.push({id:q.id,reason:"百分比选项疑似 OCR 误把数字识别成字母 O",question:q.question,options,suspectPercentages});
    const suspiciousChars=options.filter(o=>/[\uFFFD]/.test(o)||/\bAQ\s*days\b/i.test(o));
    if(suspiciousChars.length)review.push({id:q.id,reason:"疑似 OCR 字符或数字错误",question:q.question,options});
    // 仅标记疑点：若正确答案是百分比而解释使用其他百分比却完全不含该数值，
    // 可能是 OCR 漏掉小数点（15% / 1.5%）。不做自动改写，必须对照原始图片。
    const correctPercent=q.correctAnswers.filter(a=>/^\d+(?:\.\d+)?%$/.test(a.trim()));
    if(correctPercent.length&&/\d+(?:\.\d+)?%/.test(q.explanation||"")&&
        correctPercent.some(a=>!(q.explanation||"").includes(a.trim()))){
      review.push({id:q.id,reason:"答案百分比与解释文字疑似不一致，需对照原图核验（可能漏小数点）",question:q.question,options,correctAnswers:q.correctAnswers});
    }
    // 常见 OCR：英文 NOT 的 T 被识别为 I，会改变题目的正确答案含义。
    if(/\bNOI\b/i.test(q.question))review.push({id:q.id,reason:"题干中 NOI 疑似 NOT 的 OCR 错字",question:q.question,options});
    if(/\b(?:incorrect|next question|previous question)\b/i.test(q.question)){
      review.push({id:q.id,reason:"题干疑似含网页反馈文字",question:q.question,options});
    }
  }
  return {severe,review};
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
  const bank=loadQuestionBank();
  const {severe,review}=scanQuestionBank(bank);
  console.log("=== 题库全文异常扫描 ===");
  console.log(JSON.stringify({questionCount:bank.length,severeCount:severe.length,manualReviewCount:review.length},null,2));
  for(const item of [...severe,...review]){
    console.log("QUESTION_AUDIT "+JSON.stringify(item));
  }
  if(severe.length){console.error("发现高度可信的选项污染错误，须对照原图修复："+severe.map(x=>x.id).join(", "));process.exitCode=1;}
}
