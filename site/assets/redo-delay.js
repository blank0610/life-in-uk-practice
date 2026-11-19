// 每完成一批普通题，随机穿插一道错题 / 标记不懂 / 已收藏题。
export const DEFAULT_REDO_RANGE=Object.freeze({min:20,max:30});
export const REDO_PLAN_VERSION=3;
export function normalizeRedoRange(settings={}){
  const number=(value,fallback)=>{
    const n=Number(value);
    return Number.isFinite(n)?Math.max(1,Math.min(100,Math.round(n))):fallback;
  };
  const a=number(settings?.min,DEFAULT_REDO_RANGE.min),b=number(settings?.max,DEFAULT_REDO_RANGE.max);
  return {min:Math.min(a,b),max:Math.max(a,b)};
}
export function randomRedoDistance(settings={},random=Math.random){
  const {min,max}=normalizeRedoRange(settings);
  const raw=Number(random());
  const fraction=Number.isFinite(raw)?Math.max(0,Math.min(raw,1-Number.EPSILON)):0;
  return min+Math.floor(fraction*(max-min+1));
}
export function ensureRedoCycle(progress,settings={},random=Math.random){
  if(!progress||typeof progress!=="object")throw Error("无效学习进度");
  // 旧版本每题 +2 的到期时间不再使用，但仍保留错题/笔记/收藏/历史。
  if(progress.redoPlanVersion!==REDO_PLAN_VERSION){
    progress.normalSinceRedo=0;
    progress.nextRedoAfter=randomRedoDistance(settings,random);
    progress.redoPlanVersion=REDO_PLAN_VERSION;
  }
  if(!Number.isSafeInteger(progress.normalSinceRedo)||progress.normalSinceRedo<0)progress.normalSinceRedo=0;
  if(!Number.isSafeInteger(progress.nextRedoAfter)||progress.nextRedoAfter<1){
    progress.nextRedoAfter=randomRedoDistance(settings,random);
  }
  return progress;
}
export function reviewRoundReady(progress){
  return Number(progress?.normalSinceRedo||0)>=Number(progress?.nextRedoAfter||DEFAULT_REDO_RANGE.min);
}
export function recordCompletedQuestion(progress,{wasRedo=false,reviewMode=false,settings={},random=Math.random}={}){
  ensureRedoCycle(progress,settings,random);
  if(reviewMode)return progress;
  if(wasRedo){
    progress.normalSinceRedo=0;
    progress.nextRedoAfter=randomRedoDistance(settings,random);
  }else{
    progress.normalSinceRedo+=1;
  }
  return progress;
}
export function updateRedoRange(progress,settings={},random=Math.random){
  ensureRedoCycle(progress,settings,random);
  progress.nextRedoAfter=randomRedoDistance(settings,random);
  progress.normalSinceRedo=0;
  return progress;
}
