import {isQueuedForReview} from "./review-bookmarks.js?v=20261119-review-batch";
import {DEFAULT_NORMAL_PERCENT,selectQuestionType} from "./review-mix.js";
// 独立调度算法：已答对的题目须等足够多的其他不同题目被问过，才允许再次出现。
export function cooldownRequired(questionCount, percentage=DEFAULT_NORMAL_PERCENT) {
  const value=Number(percentage);
  const pct=Number.isFinite(value)?Math.max(0,Math.min(100,value)):DEFAULT_NORMAL_PERCENT;
  return Math.ceil(Math.max(0,questionCount-1)*pct/100);
}
export function otherQuestionsSince(id,passedTurn,lastSeen={}) {
  return Object.entries(lastSeen).filter(([other,turn])=>other!==id&&Number(turn)>passedTurn).length;
}
export function eligibleCorrectQuestion(question,progress,questionCount,percentage=DEFAULT_NORMAL_PERCENT) {
  const rec=progress.review?.[question.id];
  if(isQueuedForReview(rec))return false;
  if(rec?.lastPassTurn===undefined||rec?.lastPassTurn===null)return true;
  return otherQuestionsSince(question.id,rec.lastPassTurn,progress.lastSeen||{}) >= cooldownRequired(questionCount,percentage);
}
export function pickScheduled(questions,progress,{reviewMode=false,lastId=null,percentage=DEFAULT_NORMAL_PERCENT,normalPercentage=DEFAULT_NORMAL_PERCENT,random=Math.random}={}) {
  if(!questions.length)return null;
  const reviews=progress.review||{},lastSeen=progress.lastSeen||{},attempts=progress.attempts||0;
  const pending=questions.filter(q=>isQueuedForReview(reviews[q.id]));
  if(reviewMode){
    const pool=pending.length>1?pending.filter(q=>q.id!==lastId):pending;
    return pool.length?pool[Math.floor(random()*pool.length)]:null;
  }
  const newQuestions=questions.filter(q=>!(q.id in lastSeen)&&!isQueuedForReview(reviews[q.id]));
  const passed=questions.filter(q=>!isQueuedForReview(reviews[q.id])&&q.id in lastSeen&&eligibleCorrectQuestion(q,progress,questions.length,percentage));
  const ordinary=newQuestions.length?newQuestions:passed;
  // 每次按可调整的普通/复习百分比独立抽题；答对普通题的冷却比例单独固定为默认70%，不提供第二个滑块。
  const pickedType=selectQuestionType({
    ordinaryCount:ordinary.length,reviewCount:pending.length,
    normalPercent:normalPercentage,random
  });
  let pool=pickedType==="review"?pending:pickedType==="ordinary"?ordinary:[];
  if(pool.length>1){
    const different=pool.filter(q=>q.id!==lastId);
    if(different.length)pool=different;
  }
  return pool.length?pool[Math.floor(random()*pool.length)]:null;
}
