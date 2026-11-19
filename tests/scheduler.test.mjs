import test from "node:test";
import assert from "node:assert/strict";
import {cooldownRequired,otherQuestionsSince,eligibleCorrectQuestion,pickScheduled} from "../site/assets/scheduler.js";
const qs=Array.from({length:50},(_,i)=>({id:"q"+i}));
const base=()=>({attempts:0,correct:0,lastSeen:{},review:{}});
test("答对的普通题仍按独立的其他不同题70%冷却门槛",()=>{
 assert.equal(cooldownRequired(6,70),4);
 assert.equal(otherQuestionsSince("q0",1,{q0:1,q1:2,q2:3,q3:4,q4:5}),4);
 const p={attempts:3,lastSeen:{q0:1,q1:2,q2:3},review:{q0:{pending:false,lastPassTurn:1}}};
 assert.equal(eligibleCorrectQuestion(qs[0],p,6,70),false);
 p.lastSeen.q3=4;p.lastSeen.q4=5;
 assert.equal(eligibleCorrectQuestion(qs[0],p,6,70),true);
});
test("普通70%复习30%：每次选题按比例，不再等待固定20到30题",()=>{
 const p=base();p.review.q1={pending:true,due:99999,wrong:1};
 assert.notEqual(pickScheduled(qs,p,{normalPercentage:70,random:()=>0.69}).id,"q1");
 assert.equal(pickScheduled(qs,p,{normalPercentage:70,random:()=>0.70}).id,"q1");
 assert.equal(p.attempts,0,"只抽题不改变已答题次数");
 assert.equal(p.review.q1.wrong,1);
});
test("错题、标记不懂和收藏题共享30%复习池并随机选出",()=>{
 const p=base();p.review.q1={pending:true};p.review.q2={saved:true};p.review.q3={pending:true,unsure:true};
 assert.equal(pickScheduled(qs,p,{normalPercentage:70,random:()=>0.70}).id,"q3");
 assert.equal(pickScheduled(qs,p,{normalPercentage:70,random:()=>0.99}).id,"q3");
 assert.equal(pickScheduled(qs,p,{normalPercentage:70,random:()=>0.01}).id,"q0");
});
test("改变普通题比例时立即影响下一题；0%为纯复习、100%为纯普通",()=>{
 const p=base();p.review.q1={pending:true};
 assert.equal(pickScheduled(qs,p,{normalPercentage:100,random:()=>0.99}).id!=="q1",true);
 assert.equal(pickScheduled(qs,p,{normalPercentage:0,random:()=>0}).id,"q1");
});
test("没有复习题时全部抽普通题，普通题耗尽时保留复习兜底",()=>{
 const p=base();
 assert(pickScheduled(qs,p,{normalPercentage:0,random:()=>0}));
 const few=[{id:"q0"},{id:"q1"}];
 const p2={attempts:100,review:{q1:{saved:true},q0:{pending:false,lastPassTurn:99}},lastSeen:{q0:100,q1:1}};
 assert.equal(pickScheduled(few,p2,{percentage:100,normalPercentage:100,random:()=>0}).id,"q1");
});
test("错题专项不依赖普通/复习百分比，始终只出复习题",()=>{
 const p=base();p.review.q1={pending:true};
 assert.equal(pickScheduled(qs,p,{reviewMode:true,normalPercentage:100,random:()=>0}).id,"q1");
});
test("上一题去重，不会影响70/30题型选择",()=>{
 const p=base();p.review.q1={pending:true};p.review.q2={pending:true};
 const pick=pickScheduled(qs,p,{normalPercentage:0,lastId:"q1",random:()=>0});
 assert.equal(pick.id,"q2");
});
