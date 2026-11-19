// 手动收藏复习与答错复习是两种独立状态。
// 收藏不增加答错次数；取消收藏也不会删除真正的错题记录。
export function isSavedForReview(record){return record?.saved===true;}
export function isQueuedForReview(record){return Boolean(record?.pending||record?.saved);}
export function toggleSavedForReview(progress,id){
  if(!id||typeof id!=="string")throw Error("题号无效");
  if(!progress.review||typeof progress.review!=="object")progress.review={};
  const original=progress.review[id]||{};
  const saved=!isSavedForReview(original);
  const due=original.due??0; // 旧字段保留以兼容存档；普通练习不再依据每题 due 决定复习时间。
  progress.review[id]={
    pending:false,wrong:0,wins:0,unsure:false,note:"",...original,saved,due
  };
  return saved;
}
