import test from "node:test";
import assert from "node:assert/strict";
import {cooldownRequired,otherQuestionsSince,eligibleCorrectQuestion,pickScheduled} from "../site/assets/scheduler.js";
const qs=Array.from({length:6},(_,i)=>({id:"q"+i}));
test("70% 门槛按不同其他题目计算",()=>{
  assert.equal(cooldownRequired(6,70),4);
  assert.equal(cooldownRequired(6,100),5);
  assert.equal(otherQuestionsSince("q0",1,{q0:1,q1:2,q2:3,q3:4,q4:5}),4);
});
test("答对题未达百分比前不会再出现",()=>{
  const p={attempts:3,lastSeen:{q0:1,q1:2,q2:3},review:{q0:{pending:false,lastPassTurn:1},q1:{pending:false,lastPassTurn:2},q2:{pending:false,lastPassTurn:3}}};
  assert.equal(eligibleCorrectQuestion(qs[0],p,6,70),false);
  for(let i=0;i<30;i++){
    const next=pickScheduled(qs,p,{percentage:70,random:()=>0.95});
    assert.notEqual(next.id,"q0");
  }
  p.lastSeen.q3=4;p.lastSeen.q4=5;
  assert.equal(eligibleCorrectQuestion(qs[0],p,6,70),true);
});
test("答错题可提前回到练习",()=>{
  const p={attempts:6,lastSeen:{q0:1,q1:2,q2:3,q3:4,q4:5,q5:6},review:{
    q0:{pending:false,lastPassTurn:6},q1:{pending:true,due:6},
    q2:{pending:false,lastPassTurn:5},q3:{pending:false,lastPassTurn:4},
    q4:{pending:false,lastPassTurn:3},q5:{pending:false,lastPassTurn:2}
  }};
  assert.equal(pickScheduled(qs,p,{percentage:100,random:()=>0}).id,"q1");
});
test("答对后满足间隔时仍会随机重问",()=>{
  const p={attempts:6,lastSeen:{q0:1,q1:2,q2:3,q3:4,q4:5,q5:6},review:{q0:{pending:false,lastPassTurn:1}}};
  assert.equal(eligibleCorrectQuestion(qs[0],p,6,70),true);
  assert.equal(pickScheduled(qs,p,{percentage:70,random:()=>0}).id,"q0");
});
