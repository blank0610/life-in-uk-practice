import test from "node:test";
import assert from "node:assert/strict";
import {cooldownRequired,otherQuestionsSince,eligibleCorrectQuestion,pickScheduled} from "../site/assets/scheduler.js";
import {ensureRedoCycle,recordCompletedQuestion} from "../site/assets/redo-delay.js";
const qs=Array.from({length:50},(_,i)=>({id:"q"+i}));
const base=()=>({attempts:0,lastSeen:{},review:{},normalSinceRedo:0,nextRedoAfter:20,redoPlanVersion:3});
test("普通答对题依旧按其他不同题70%门槛才可重新出现",()=>{
  assert.equal(cooldownRequired(6,70),4);
  assert.equal(otherQuestionsSince("q0",1,{q0:1,q1:2,q2:3,q3:4,q4:5}),4);
  const p={attempts:3,lastSeen:{q0:1,q1:2,q2:3},review:{q0:{pending:false,lastPassTurn:1}}};
  assert.equal(eligibleCorrectQuestion(qs[0],p,6,70),false);
  p.lastSeen.q3=4;p.lastSeen.q4=5;
  assert.equal(eligibleCorrectQuestion(qs[0],p,6,70),true);
});
test("有错题但不足20道普通题时，始终先抽普通题",()=>{
  const p=base();p.review.q1={pending:true,due:0,wrong:1};
  for(let i=0;i<19;i++){
    const selected=pickScheduled(qs,p,{random:()=>0});
    assert.notEqual(selected.id,"q1","not due to the batch yet");
    p.attempts++;p.lastSeen[selected.id]=p.attempts;
    recordCompletedQuestion(p,{random:()=>0});
  }
  assert.equal(p.normalSinceRedo,19);
  assert.notEqual(pickScheduled(qs,p,{random:()=>0}).id,"q1");
  p.attempts++;recordCompletedQuestion(p,{random:()=>0});
  assert.equal(p.normalSinceRedo,20);
  assert.equal(pickScheduled(qs,p,{random:()=>0}).id,"q1");
});
test("每批到点随机出一道复习题，之后再开始下一批普通题",()=>{
  const p=base();
  p.review.q1={pending:true,due:0};
  p.review.q2={pending:false,saved:true,due:0};
  p.normalSinceRedo=20;
  assert.equal(pickScheduled(qs,p,{random:()=>0}).id,"q1");
  assert.equal(pickScheduled(qs,p,{random:()=>0.9}).id,"q2");
  recordCompletedQuestion(p,{wasRedo:true,random:()=>0.9999});
  assert.equal(p.normalSinceRedo,0);
  assert.equal(p.nextRedoAfter,30);
  assert.notEqual(pickScheduled(qs,p,{random:()=>0}).id,"q1");
  assert.notEqual(pickScheduled(qs,p,{random:()=>0.9}).id,"q2");
});
test("主动进入错题与收藏专项时跳过普通题数量限制",()=>{
  const p=base();p.review.q1={pending:true,due:999999};p.normalSinceRedo=0;
  assert.equal(pickScheduled(qs,p,{reviewMode:true,random:()=>0}).id,"q1");
  recordCompletedQuestion(p,{reviewMode:true,wasRedo:true});
  assert.equal(p.normalSinceRedo,0);
});
test("旧版每题due已过期，也不应无视新批次马上重现",()=>{
  const p=base();p.attempts=300;p.review.q1={pending:true,due:2};
  assert.notEqual(pickScheduled(qs,p,{random:()=>0}).id,"q1");
});
test("只有复习题可练且普通题已经耗尽时，可继续练习避免无题",()=>{
  const p=base();const few=[{id:"q0"},{id:"q1"}];
  p.review.q1={saved:true};p.review.q0={pending:false,lastPassTurn:99};
  p.lastSeen={q0:100,q1:1};p.attempts=100;
  assert.equal(pickScheduled(few,p,{percentage:100,random:()=>0}).id,"q1");
});
test("老进度可以初始化为一个随机批次，不会重置答题记录",()=>{
  const p={attempts:100,lastSeen:{q0:100},review:{q1:{pending:true,wrong:2,due:102}}};
  ensureRedoCycle(p,{},()=>0.999);
  assert.equal(p.nextRedoAfter,30);
  assert.equal(p.attempts,100);
  assert.equal(p.review.q1.wrong,2);
});
