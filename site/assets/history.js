// 最近五道「已经完成的答题」：按每次作答保存原选项排列、当时的选择与笔记。
// 只用于回看，不参与评分、抽题冷却或错题队列；数据留在浏览器本机。
export const HISTORY_LIMIT=5;

export function ensureHistory(progress){
  if(!Array.isArray(progress.history))progress.history=[];
  progress.history=progress.history.filter(row=>
    row&&Number.isSafeInteger(row.seq)&&row.seq>0
    &&typeof row.id==="string"&&typeof row.question==="string"
    &&Array.isArray(row.display)&&Array.isArray(row.correctAnswers)
    &&Array.isArray(row.selected)
  ).slice(-HISTORY_LIMIT);
  const last=Math.max(0,...progress.history.map(row=>row.seq));
  if(!Number.isSafeInteger(progress.historySeq)||progress.historySeq<last)progress.historySeq=last;
  if(!progress.notes||typeof progress.notes!=="object"||Array.isArray(progress.notes))progress.notes={};
  return progress.history;
}
export function appendHistory(progress,question,{selected=[],result="unclear",mode="all",note=""}={}){
  ensureHistory(progress);
  const seq=++progress.historySeq;
  const row={
    seq,id:question.id,question:question.question,
    display:[...question.display],
    correctAnswers:[...question.correctAnswers],
    explanation:question.explanation||"",
    sourceScreenshot:question.sourceScreenshot||null,
    selected:[...selected],result,mode,
    note:String(note||"").slice(0,800)
  };
  progress.history=[...progress.history,row].slice(-HISTORY_LIMIT);
  return row;
}
export function updateHistoryResult(progress,seq,result){
  const item=ensureHistory(progress).find(row=>row.seq===seq);
  if(item)item.result=result;
  return item||null;
}
export function saveHistoryNote(progress,seq,note){
  const item=ensureHistory(progress).find(row=>row.seq===seq);
  if(item)item.note=String(note||"").slice(0,800);
  return item||null;
}
export function previousHistoryIndex(progress,index=null,currentSeq=null){
  const rows=ensureHistory(progress);
  if(index!==null)return index>0?index-1:null;
  const newest=rows.length-1;
  const target=newest>=0&&rows[newest].seq===currentSeq?newest-1:newest;
  return target>=0?target:null;
}
export function nextHistoryIndex(progress,index,currentSeq=null){
  const rows=ensureHistory(progress);
  if(index===null||index<0)return null;
  const target=index+1;
  return target<rows.length&&rows[target].seq!==currentSeq?target:null;
}
export function canGoBack(progress,index=null,currentSeq=null){
  return previousHistoryIndex(progress,index,currentSeq)!==null;
}
