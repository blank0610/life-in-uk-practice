import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_REDO_RANGE,REDO_PLAN_VERSION,normalizeRedoRange,randomRedoDistance,nextRedoDue,remainingUntilRedo,migrateRedoProgress,replanRedoQueue} from "../site/assets/redo-delay.js";
test("随机重练间隔默认20到30道完整作答，并含两端",()=>{
  assert.deepEqual(DEFAULT_REDO_RANGE,{min:20,max:30});
  assert.equal(randomRedoDistance({},()=>0),20);
  assert.equal(randomRedoDistance({},()=>0.5),25);
  assert.equal(randomRedoDistance({},()=>0.999999),30);
  assert.equal(nextRedoDue({attempts:12},{},()=>0),32);
  assert.equal(nextRedoDue({attempts:12},{},()=>0.999999),42);
});
test("可以在题库设置内修改最短/最长题数，非法数字做安全处理",()=>{
  assert.deepEqual(normalizeRedoRange({min:25,max:35}),{min:25,max:35});
  assert.deepEqual(normalizeRedoRange({min:50,max:20}),{min:20,max:50});
  assert.deepEqual(normalizeRedoRange({min:"oops",max:999}),{min:20,max:100});
  assert.equal(randomRedoDistance({min:10,max:10},()=>0.8),10);
});
test("已有错题与收藏题升级时只重新排程一次，历史成绩和笔记不丢失",()=>{
  const p={attempts:90,correct:75,review:{
    a:{pending:true,wrong:3,wins:1,note:"Please review",due:92},
    b:{pending:false,saved:true,wrong:0,note:"Saved",due:92},
    c:{pending:false,saved:false,wrong:0,due:90}
  },notes:{a:"My note"}};
  assert.equal(migrateRedoProgress(p,{},()=>0),true);
  assert.equal(p.redoPlanVersion,REDO_PLAN_VERSION);
  assert.equal(p.review.a.due,110);
  assert.equal(p.review.b.due,110);
  assert.equal(p.review.c.due,90);
  assert.equal(p.review.a.wrong,3);
  assert.equal(p.review.a.wins,1);
  assert.equal(p.review.a.note,"Please review");
  assert.equal(p.correct,75);
  assert.equal(migrateRedoProgress(p,{},()=>0.999),false);
  assert.equal(p.review.a.due,110,"reload must not reset countdown");
  assert.equal(remainingUntilRedo(p.review.a,{attempts:103}),7);
});
test("修改区间后只重设待复习题的时间，不制造答错次数",()=>{
  const p={attempts:50,correct:40,review:{
    a:{pending:true,wrong:1,due:52},b:{pending:false,saved:true,wrong:0,due:51},
    c:{pending:false,saved:false,lastPassTurn:44}
  }};
  assert.equal(replanRedoQueue(p,{min:25,max:25}),2);
  assert.equal(p.review.a.due,75);
  assert.equal(p.review.b.due,75);
  assert.equal(p.review.a.wrong,1);
  assert.equal(p.review.c.due,undefined);
  assert.equal(p.correct,40);
});
