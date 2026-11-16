import {isQueuedForReview} from "./review-bookmarks.js";
// 独立调度算法：已答对的题目须等足够多的其他不同题目被问过，才允许再次出现。
export function cooldownRequired(questionCount, percentage=70) {
  const pct=Math.max(10,Math.min(100,Number(percentage)||70));
  return Math.ceil(Math.max(0,questionCount-1)*pct/100);
}
export function otherQuestionsSince(id,passedTurn,lastSeen={}) {
  return Object.entries(lastSeen).filter(([other,turn])=>other!==id&&Number(turn)>passedTurn).length;
}
export function eligibleCorrectQuestion(question,progress,questionCount,percentage=70) {
  const rec=progress.review?.[question.id];
  if(isQueuedForReview(rec))return false;
  if(rec?.lastPassTurn===undefined||rec?.lastPassTurn===null)return true;
  return otherQuestionsSince(question.id,rec.lastPassTurn,progress.lastSeen||{}) >= cooldownRequired(questionCount,percentage);
}
export function pickScheduled(questions,progress,{reviewMode=false,lastId=null,percentage=70,random=Math.random}={}) {
  if(!questions.length)return null;
  const reviews=progress.review||{},lastSeen=progress.lastSeen||{},attempts=progress.attempts||0;
  const pending=questions.filter(q=>isQueuedForReview(reviews[q.id]));
  if(reviewMode){
    const pool=pending.length>1?pending.filter(q=>q.id!==lastId):pending;
    return pool.length?pool[Math.floor(random()*pool.length)]:null;
  }
  const newQuestions=questions.filter(q=>!(q.id in lastSeen)&&!isQueuedForReview(reviews[q.id]));
  const due=pending.filter(q=>(reviews[q.id].due||0)<=attempts);
  const passed=questions.filter(q=>!isQueuedForReview(reviews[q.id])&&q.id in lastSeen&&eligibleCorrectQuestion(q,progress,questions.length,percentage));
  let pool=[];
  if(newQuestions.length)pool=due.length&&random()<0.28?due:newQuestions;
  else if(due.length)pool=passed.length&&random()<0.4?passed:due;
  else if(passed.length)pool=passed;
  else if(pending.length)pool=pending; // 防止只剩暂未到期的错题时停住
  if(pool.length>1){
    const different=pool.filter(q=>q.id!==lastId);
    if(different.length)pool=different;
  }
  return pool.length?pool[Math.floor(random()*pool.length)]:null;
}
