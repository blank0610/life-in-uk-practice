import test from "node:test";
import assert from "node:assert/strict";
import {isSavedForReview,isQueuedForReview,toggleSavedForReview} from "../site/assets/review-bookmarks.js";
import {eligibleCorrectQuestion,pickScheduled} from "../site/assets/scheduler.js";

const qs=[{id:"q1"},{id:"q2"},{id:"q3"},{id:"q4"},{id:"q5"}];
const blank=()=>({attempts:3,correct:3,review:{},lastSeen:{q1:1,q2:2,q3:3}});
test("答对题可以手动收藏复习，成绩和答错次数保持不变",()=>{
  const p=blank();p.review.q1={pending:false,wrong:0,wins:0,lastPassTurn:1};
  assert.equal(toggleSavedForReview(p,"q1"),true);
  assert.equal(isSavedForReview(p.review.q1),true);
  assert.equal(isQueuedForReview(p.review.q1),true);
  assert.equal(p.review.q1.wrong,0);
  assert.equal(p.attempts,3);
  assert.equal(p.correct,3);
  assert.equal(p.review.q1.pending,false);
  assert.equal(eligibleCorrectQuestion(qs[0],p,qs.length,10),false);
});
test("收藏题可以进入专项复习，做对后只要仍收藏就还会再出现",()=>{
  const p=blank();
  toggleSavedForReview(p,"q1");
  assert.equal(p.review.q1.due,5);
  assert.equal(pickScheduled(qs,p,{reviewMode:true,random:()=>0}).id,"q1");
  p.review.q1={...p.review.q1,pending:false,lastPassTurn:4,due:6};
  p.attempts=6;
  assert.equal(pickScheduled(qs,p,{reviewMode:true,random:()=>0}).id,"q1");
  assert.equal(pickScheduled(qs,p,{percentage:100,random:()=>0}).id,"q1");
});
test("取消收藏不影响原有真正答错的复习队列",()=>{
  const p=blank();
  p.review.q2={pending:true,wrong:2,wins:0,due:5,note:"Not understood"};
  toggleSavedForReview(p,"q2");
  assert.equal(toggleSavedForReview(p,"q2"),false);
  assert.equal(p.review.q2.saved,false);
  assert.equal(p.review.q2.pending,true);
  assert.equal(p.review.q2.wrong,2);
  assert.equal(p.review.q2.note,"Not understood");
  assert.equal(isQueuedForReview(p.review.q2),true);
});
test("取消收藏的已答对题恢复原有70%冷却，不会被当作错题",()=>{
  const p=blank();
  p.review.q1={pending:false,wrong:0,wins:0,lastPassTurn:1};
  toggleSavedForReview(p,"q1");
  assert.equal(toggleSavedForReview(p,"q1"),false);
  assert.equal(isQueuedForReview(p.review.q1),false);
  assert.equal(p.review.q1.pending,false);
  assert.equal(eligibleCorrectQuestion(qs[0],p,qs.length,70),false);
});
test("收藏未答过的题也进入队列，不需要先答错",()=>{
  const p={attempts:0,correct:0,review:{},lastSeen:{}};
  assert.equal(toggleSavedForReview(p,"q3"),true);
  assert.equal(p.review.q3.due,2);
  assert.equal(pickScheduled(qs,p,{reviewMode:true,random:()=>0}).id,"q3");
  assert.equal(p.review.q3.wrong,0);
});
