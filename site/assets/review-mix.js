// 百分比混合出题：默认 70% 普通题 / 30% 错题、标记不懂与收藏题。
// 独立于「答对题达到一定比例的其他不同题后才再次出现」的冷却规则。
export const DEFAULT_NORMAL_PERCENT=70;
export function normalizeNormalPercent(value){
  const percent=Number(value);
  return Number.isFinite(percent)?Math.max(0,Math.min(100,Math.round(percent))):DEFAULT_NORMAL_PERCENT;
}
// 兼容旧版两个分开的百分比，升级后只使用一个共享设置。
export function resolvePracticePercent(settings={}){
  const read=value=>(typeof value==="number"||typeof value==="string"&&value.trim()!=="")&&Number.isFinite(Number(value))
    ?normalizeNormalPercent(value):null;
  if(!settings||typeof settings!=="object")return DEFAULT_NORMAL_PERCENT;
  const unified=read(settings.practicePercentage);
  if(unified!==null)return unified;
  const ordinary=read(settings.normalPercentage),cooldown=read(settings.repeatThreshold);
  if(ordinary!==null&&ordinary!==DEFAULT_NORMAL_PERCENT)return ordinary;
  if(cooldown!==null&&cooldown!==DEFAULT_NORMAL_PERCENT)return cooldown;
  return ordinary??cooldown??DEFAULT_NORMAL_PERCENT;
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
