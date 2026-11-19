import test from "node:test";
import assert from "node:assert/strict";
import {isSavedForReview,isQueuedForReview,toggleSavedForReview} from "../site/assets/review-bookmarks.js";
import {eligibleCorrectQuestion,pickScheduled} from "../site/assets/scheduler.js";
const qs=[{id:"q1"},{id:"q2"},{id:"q3"},{id:"q4"},{id:"q5"}];
const blank=()=>({attempts:3,correct:3,review:{},lastSeen:{q1:1,q2:2,q3:3},normalSinceRedo:0,nextRedoAfter:20});
test("收藏答对题仍进复习队列，不改变成绩或错题数",()=>{
  const p=blank();p.review.q1={pending:false,wrong:0,wins:0,lastPassTurn:1};
  assert.equal(toggleSavedForReview(p,"q1"),true);
  assert(isSavedForReview(p.review.q1));
  assert(isQueuedForReview(p.review.q1));
  assert.equal(p.review.q1.wrong,0);
  assert.equal(p.attempts,3);assert.equal(p.correct,3);
  assert.equal(eligibleCorrectQuestion(qs[0],p,qs.length,70),false);
});
test("收藏题只在完成普通题批次后穿插，专项可直接做",()=>{
  const p=blank();toggleSavedForReview(p,"q1");
  assert.equal(pickScheduled(qs,p,{reviewMode:true,random:()=>0}).id,"q1");
  assert.notEqual(pickScheduled(qs,p,{random:()=>0}).id,"q1");
  p.normalSinceRedo=20;
  assert.equal(pickScheduled(qs,p,{random:()=>0}).id,"q1");
  p.review.q1={...p.review.q1,pending:false,lastPassTurn:4};
  assert.equal(pickScheduled(qs,p,{reviewMode:true,random:()=>0}).id,"q1","已收藏仍可专项复习");
});
test("取消收藏不会删除已存在的真正错题",()=>{
  const p=blank();p.review.q2={pending:true,wrong:2,wins:0,due:5,note:"Not understood"};
  toggleSavedForReview(p,"q2");toggleSavedForReview(p,"q2");
  assert.equal(p.review.q2.saved,false);
  assert.equal(p.review.q2.pending,true);
  assert.equal(p.review.q2.wrong,2);
  assert.equal(p.review.q2.note,"Not understood");
});
test("取消只被收藏的答对题会恢复正常70%冷却",()=>{
  const p=blank();p.review.q1={pending:false,wrong:0,wins:0,lastPassTurn:1};
  toggleSavedForReview(p,"q1");toggleSavedForReview(p,"q1");
  assert.equal(isQueuedForReview(p.review.q1),false);
  assert.equal(eligibleCorrectQuestion(qs[0],p,qs.length,70),false);
});
test("尚未作答也可以收藏，成绩保持0",()=>{
  const p={attempts:0,correct:0,review:{},lastSeen:{},normalSinceRedo:0,nextRedoAfter:20};
  assert.equal(toggleSavedForReview(p,"q3"),true);
  assert.equal(p.review.q3.wrong,0);
  assert.equal(pickScheduled(qs,p,{reviewMode:true,random:()=>0}).id,"q3");
  assert.equal(p.attempts,0);
});
