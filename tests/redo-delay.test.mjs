import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_REDO_RANGE,REDO_PLAN_VERSION,normalizeRedoRange,randomRedoDistance,ensureRedoCycle,reviewRoundReady,recordCompletedQuestion,updateRedoRange} from "../site/assets/redo-delay.js";
test("默认每批20～30道普通题，然后穿插一道随机复习题",()=>{
  assert.deepEqual(DEFAULT_REDO_RANGE,{min:20,max:30});
  assert.equal(randomRedoDistance({},()=>0),20);
  assert.equal(randomRedoDistance({},()=>0.5),25);
  assert.equal(randomRedoDistance({},()=>0.99999),30);
});
test("设置可以调整批次范围，不依赖每题自身 due",()=>{
  assert.deepEqual(normalizeRedoRange({min:30,max:20}),{min:20,max:30});
  assert.equal(randomRedoDistance({min:25,max:25}),25);
  assert.deepEqual(normalizeRedoRange({min:"??",max:500}),{min:20,max:100});
});
test("只数完整作答的普通题，不按总尝试数或每个错题分别计数",()=>{
  const p={attempts:200,normalSinceRedo:0,nextRedoAfter:20,redoPlanVersion:REDO_PLAN_VERSION};
  for(let i=0;i<19;i++)recordCompletedQuestion(p,{wasRedo:false});
  assert.equal(reviewRoundReady(p),false);
  recordCompletedQuestion(p,{wasRedo:false});
  assert.equal(p.normalSinceRedo,20);
  assert.equal(reviewRoundReady(p),true);
  recordCompletedQuestion(p,{wasRedo:true,random:()=>0.999999});
  assert.equal(p.normalSinceRedo,0);
  assert.equal(p.nextRedoAfter,30);
});
test("错题专项独立进行，不推进普通练习批次",()=>{
  const p={normalSinceRedo:18,nextRedoAfter:22,redoPlanVersion:REDO_PLAN_VERSION};
  recordCompletedQuestion(p,{reviewMode:true,wasRedo:true});
  assert.equal(p.normalSinceRedo,18);
  assert.equal(p.nextRedoAfter,22);
});
test("旧学习记录升级仅增加批次进度，不改变错误题、收藏、正确率和笔记",()=>{
  const p={attempts:200,correct:166,review:{
    x:{pending:true,due:202,wrong:2,note:"old"},
    y:{saved:true,pending:false,due:202}},
    history:[{id:"x"}],notes:{x:"mine"},redoPlanVersion:2
  };
  ensureRedoCycle(p,{},()=>0.3);
  assert.equal(p.redoPlanVersion,3);
  assert.equal(p.normalSinceRedo,0);
  assert.equal(p.review.x.due,202);
  assert.equal(p.review.x.wrong,2);
  assert.equal(p.review.y.saved,true);
  assert.equal(p.notes.x,"mine");
  assert.equal(p.correct,166);
  const target=p.nextRedoAfter;
  ensureRedoCycle(p,{},()=>0.99);
  assert.equal(p.nextRedoAfter,target,"重开网页不重置等待进度");
});
test("修改每批题数可重新开始本批，不影响已收藏和错题",()=>{
  const p={normalSinceRedo:12,nextRedoAfter:20,redoPlanVersion:3,review:{a:{pending:true,wrong:1}},attempts:44,correct:35};
  updateRedoRange(p,{min:25,max:25});
  assert.equal(p.normalSinceRedo,0);
  assert.equal(p.nextRedoAfter,25);
  assert.equal(p.review.a.pending,true);
  assert.equal(p.correct,35);
});
