// 错题、不懂、收藏题的随机间隔：按此题上次进入复习队列后的「已作答题数」计算。
// 和已经答对的普通题所用的百分比冷却机制相互独立。
export const DEFAULT_REDO_RANGE=Object.freeze({min:20,max:30});
export const REDO_PLAN_VERSION=2;

export function normalizeRedoRange(settings={}){
  const num=(value,fallback)=>{
    const parsed=Number(value);
    return Number.isFinite(parsed)?Math.max(1,Math.min(100,Math.round(parsed))):fallback;
  };
  const min=num(settings?.min,DEFAULT_REDO_RANGE.min);
  const max=num(settings?.max,DEFAULT_REDO_RANGE.max);
  return min<=max?{min,max}:{min:max,max:min};
}
export function randomRedoDistance(settings={},random=Math.random){
  const {min,max}=normalizeRedoRange(settings);
  const draw=Number(random());
  const fraction=Number.isFinite(draw)?Math.max(0,Math.min(1-Number.EPSILON,draw)):0;
  return min+Math.floor(fraction*(max-min+1));
}
export function nextRedoDue(progress,settings={},random=Math.random){
  const attempts=Number.isFinite(progress?.attempts)?Math.max(0,Math.floor(progress.attempts)):0;
  return attempts+randomRedoDistance(settings,random);
}
export function isRedoQueued(record){return Boolean(record?.pending||record?.saved);}
export function remainingUntilRedo(record,progress){
  const due=Number(record?.due);
  const attempts=Number(progress?.attempts)||0;
  return Number.isFinite(due)?Math.max(0,Math.ceil(due-attempts)):0;
}
// 只执行一次的旧数据迁移：把之前 +2 次答题的旧复习计划转换为 20~30 次。
// 保留 pending、saved、wrong、wins、notes 和旧历史记录。
export function migrateRedoProgress(progress,settings={},random=Math.random){
  if(progress.redoPlanVersion===REDO_PLAN_VERSION)return false;
  if(!progress.review||typeof progress.review!=="object")progress.review={};
  for(const rec of Object.values(progress.review)){
    if(rec&&isRedoQueued(rec))rec.due=nextRedoDue(progress,settings,random);
  }
  progress.redoPlanVersion=REDO_PLAN_VERSION;
  return true;
}
// 用户修改区间时，只重新安排仍待复习的题，不更改成绩或回答记录。
export function replanRedoQueue(progress,settings={},random=Math.random){
  if(!progress.review||typeof progress.review!=="object")progress.review={};
  let count=0;
  for(const rec of Object.values(progress.review)){
    if(rec&&isRedoQueued(rec)){rec.due=nextRedoDue(progress,settings,random);count++;}
  }
  progress.redoPlanVersion=REDO_PLAN_VERSION;
  return count;
}
