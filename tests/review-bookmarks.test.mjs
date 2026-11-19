import test from "node:test";
import assert from "node:assert/strict";
import {isSavedForReview,isQueuedForReview,toggleSavedForReview} from "../site/assets/review-bookmarks.js";
import {eligibleCorrectQuestion,pickScheduled} from "../site/assets/scheduler.js";
const qs=[{id:"q1"},{id:"q2"},{id:"q3"},{id:"q4"},{id:"q5"}];
const blank=()=>({attempts:3,correct:3,review:{},lastSeen:{q1:1,q2:2,q3:3}});
test("收藏答对题加入复习池，但不改变正确率或答错次数",()=>{
 const p=blank();p.review.q1={pending:false,wrong:0,wins:0,lastPassTurn:1};
 assert.equal(toggleSavedForReview(p,"q1"),true);
 assert(isSavedForReview(p.review.q1));
 assert(isQueuedForReview(p.review.q1));
 assert.equal(p.review.q1.wrong,0);
 assert.equal(p.attempts,3);assert.equal(p.correct,3);
 assert.equal(eligibleCorrectQuestion(qs[0],p,qs.length,70),false);
});
test("收藏题在30%随机复习中可再次出现，专项模式直接重练",()=>{
 const p=blank();toggleSavedForReview(p,"q1");
 assert.equal(pickScheduled(qs,p,{reviewMode:true,random:()=>0}).id,"q1");
 assert.notEqual(pickScheduled(qs,p,{normalPercentage:70,random:()=>0.01}).id,"q1");
 assert.equal(pickScheduled(qs,p,{normalPercentage:70,random:()=>0.99}).id,"q1");
 p.review.q1={...p.review.q1,pending:false,lastPassTurn:4};
 assert.equal(pickScheduled(qs,p,{reviewMode:true,random:()=>0}).id,"q1","即使做对仍然收藏");
});
test("取消收藏不会清除既有真正的错题及笔记",()=>{
 const p=blank();p.review.q2={pending:true,wrong:2,wins:0,due:5,note:"Not understood"};
 toggleSavedForReview(p,"q2");toggleSavedForReview(p,"q2");
 assert.equal(p.review.q2.saved,false);
 assert.equal(p.review.q2.pending,true);
 assert.equal(p.review.q2.wrong,2);
 assert.equal(p.review.q2.note,"Not understood");
});
test("取消仅收藏的答对题后恢复普通题的70%冷却",()=>{
 const p=blank();p.review.q1={pending:false,wrong:0,wins:0,lastPassTurn:1};
 toggleSavedForReview(p,"q1");toggleSavedForReview(p,"q1");
 assert.equal(isQueuedForReview(p.review.q1),false);
 assert.equal(eligibleCorrectQuestion(qs[0],p,qs.length,70),false);
});
test("还未作答即可收藏，不影响成绩",()=>{
 const p={attempts:0,correct:0,review:{},lastSeen:{}};
 assert.equal(toggleSavedForReview(p,"q3"),true);
 assert.equal(p.review.q3.wrong,0);
 assert.equal(pickScheduled(qs,p,{reviewMode:true,random:()=>0}).id,"q3");
 assert.equal(p.attempts,0);
});
