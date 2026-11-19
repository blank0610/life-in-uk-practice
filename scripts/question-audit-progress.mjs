// GitHub 审核进度帐：逐题、顺序、可续跑。不能把自动文字扫描写成已逐图核验。
export function sortAuditQuestions(questions){
  return [...questions].sort((a,b)=>Number(a.sourceScreenshot||a.id.match(/\d+/)?.[0]||0)-Number(b.sourceScreenshot||b.id.match(/\d+/)?.[0]||0));
}
export function textFindings(q){
  const issues=[];
  const question=String(q.question||"").trim();
  const options=Array.isArray(q.options)?q.options:[];
  const explanation=String(q.explanation||"").trim();
  if(!question)issues.push("缺少题干");
  if(options.length<2||options.length>8)issues.push("选项数量异常");
  if(!Array.isArray(q.correctAnswers)||!q.correctAnswers.length||q.correctAnswers.some(a=>!options.includes(a)))issues.push("正确答案不在选项中");
  if(options.some(t=>/^\s*(?:incorrect|correct|explanation|your answer)\s*[:.,! ]/i.test(t)))issues.push("网页批改/解释可能误混进选项");
  if(options.some(t=>/\bAQ\s*days\b|\bO\d+%/i.test(t)))issues.push("数字与字母混淆");
  if(question.length<18&&/[?？]/.test(question))issues.push("题干过短，原图可能被截断");
  if(!explanation)issues.push("缺少解释，需对照原图");
  return issues;
}
export function nextAuditBatch(ledger,questions,{size=12,checkedAt=null,visualVerifiedIds=[]}={}){
  const sorted=sortAuditQuestions(questions);
  const total=sorted.length;
  if(total!==ledger.bankCount)throw Error("题库数量已变化，请核对后更新进度表");
  if(!Number.isInteger(ledger.nextIndex)||ledger.nextIndex<0||ledger.nextIndex>=total)throw Error("审核下标无效");
  if(!Array.isArray(ledger.checkedThisRound))throw Error("审核记录格式无效");
  const batchSize=Math.max(1,Math.min(30,Math.floor(Number(size)||12)));
  const end=Math.min(total,ledger.nextIndex+batchSize);
  const visual=new Set(visualVerifiedIds);
  const rows=[];
  for(let index=ledger.nextIndex;index<end;index++){
    const q=sorted[index],issues=textFindings(q);
    rows.push({
      number:index+1,id:q.id,sourceScreenshot:q.sourceScreenshot||null,
      status:issues.length?"needs_review":visual.has(q.id)?"visually_checked":"text_screened_photo_unavailable",
      findings:issues,
      imageCompared:visual.has(q.id),
      checkedAt
    });
  }
  const updated={
    ...ledger,
    checkedThisRound:[...ledger.checkedThisRound,...rows],
    nextIndex:end,
    lastCheckedAt:checkedAt,
    lastCheckedId:rows.at(-1)?.id||ledger.lastCheckedId
  };
  const finished=end===total;
  const archive=finished?{
    round:ledger.round,bankCount:total,completedAt:checkedAt,
    checks:updated.checkedThisRound
  }:null;
  // 仅在本轮全部逐题扫描后才能开启下一轮。
  // 执行端必须先将 archive 写入 GitHub，再提交下一轮新的 ledger。
  if(finished){
    updated.round=ledger.round+1;
    updated.nextIndex=0;
    updated.checkedThisRound=[];
    updated.completedRounds=[...(ledger.completedRounds||[]),{round:ledger.round,bankCount:total,completedAt:checkedAt}].slice(-12);
  }
  return {updated,rows,finished,archive};
}
