// 纯函数：修正英文文字时，保持正确答案与原选项位置的对应关系。
function replacePhrases(text, replacements, context) {
  let current=text;
  for(const pair of replacements||[]) {
    if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=="string"||!pair[0]) {
      throw new Error("校对规则格式无效："+context);
    }
    const [wrong,right]=pair;
    if(!current.includes(wrong)) {
      throw new Error("校对原文找不到："+context+" → "+wrong);
    }
    current=current.replaceAll(wrong,right);
  }
  return current;
}
export function applyTextFixes(questionMap,fixes) {
  for(const [id,fix] of Object.entries(fixes||{})) {
    const q=questionMap.get(id);
    if(!q)throw new Error("要校对的截图题不存在："+id);
    const oldIndices=q.correctAnswers.map(answer=>q.options.indexOf(answer));
    if(oldIndices.some(i=>i<0))throw new Error("正确答案与原选项不符："+id);
    const options=q.options.map((v,i)=>replacePhrases(v,fix.options?.[i],id+" 选项 "+i));
    const question=fix.questionText??replacePhrases(q.question,fix.question,id+" 题目");
    const explanation=fix.explanationText??replacePhrases(q.explanation,fix.explanation,id+" 解释");
    const correctAnswers=oldIndices.map(i=>options[i]);
    if(new Set(options).size!==options.length)throw new Error("校对后出现重复选项："+id);
    questionMap.set(id,{...q,question,options,correctAnswers,explanation});
  }
  return questionMap;
}
