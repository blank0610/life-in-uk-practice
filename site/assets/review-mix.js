// 百分比混合出题：默认 70% 普通题 / 30% 错题、标记不懂与收藏题。
// 每次点下一题重新随机抽取；答对题的重复冷却仍沿用默认值，不是另一个用户百分比设置。
export const DEFAULT_NORMAL_PERCENT=70;
export function normalizeNormalPercent(value){
  const percent=Number(value);
  return Number.isFinite(percent)?Math.max(0,Math.min(100,Math.round(percent))):DEFAULT_NORMAL_PERCENT;
}
export function reviewPercent(normalPercent=DEFAULT_NORMAL_PERCENT){
  return 100-normalizeNormalPercent(normalPercent);
}
export function selectQuestionType({ordinaryCount=0,reviewCount=0,normalPercent=DEFAULT_NORMAL_PERCENT,random=Math.random}={}){
  if(!ordinaryCount&&!reviewCount)return null;
  if(!ordinaryCount)return "review";
  if(!reviewCount)return "ordinary";
  const r=Number(random());
  const fraction=Number.isFinite(r)?Math.min(1-Number.EPSILON,Math.max(0,r)):0;
  return fraction<normalizeNormalPercent(normalPercent)/100?"ordinary":"review";
}
