import {nextRedoDue} from "./redo-delay.js";
// 手动收藏复习与答错复习是两种独立状态。
// 收藏不增加答错次数；取消收藏也不会删除真正的错题记录。
export function isSavedForReview(record){return record?.saved===true;}
export function isQueuedForReview(record){return Boolean(record?.pending||record?.saved);}
export function toggleSavedForReview(progress,id,{min=20,max=30,random=Math.random}={}){
  if(!id||typeof id!=="string")throw Error("题号无效");
  if(!progress.review||typeof progress.review!=="object")progress.review={};
  const original=progress.review[id]||{};
  const saved=!isSavedForReview(original);
  const due=original.pending?(original.due??nextRedoDue(progress,{min,max},random)):(saved?nextRedoDue(progress,{min,max},random):original.due??0);
  progress.review[id]={
    pending:false,wrong:0,wins:0,unsure:false,note:"",...original,saved,due
  };
  return saved;
}
