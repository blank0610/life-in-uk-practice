import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_NORMAL_PERCENT,normalizeNormalPercent,reviewPercent,selectQuestionType} from "../site/assets/review-mix.js";
test("默认是70%普通题与30%随机复习题，不是每20到30道才出现1次",()=>{
 assert.equal(DEFAULT_NORMAL_PERCENT,70);
 assert.equal(normalizeNormalPercent(undefined),70);
 assert.equal(reviewPercent(70),30);
 assert.equal(selectQuestionType({ordinaryCount:8,reviewCount:3,normalPercent:70,random:()=>0.69}),"ordinary");
 assert.equal(selectQuestionType({ordinaryCount:8,reviewCount:3,normalPercent:70,random:()=>0.70}),"review");
 assert.equal(selectQuestionType({ordinaryCount:8,reviewCount:3,normalPercent:70,random:()=>0.99}),"review");
});
test("通过修改百分比可设置全部普通题或全部复习题",()=>{
 assert.equal(normalizeNormalPercent(-8),0);
 assert.equal(normalizeNormalPercent(110),100);
 assert.equal(normalizeNormalPercent("not-a-number"),70);
 assert.equal(selectQuestionType({ordinaryCount:8,reviewCount:3,normalPercent:100,random:()=>0.95}),"ordinary");
 assert.equal(selectQuestionType({ordinaryCount:8,reviewCount:3,normalPercent:0,random:()=>0}),"review");
});
test("只有普通题时应正常出题，没有复习题不需要等待",()=>{
 assert.equal(selectQuestionType({ordinaryCount:8,reviewCount:0,normalPercent:20,random:()=>0.99}),"ordinary");
 assert.equal(selectQuestionType({ordinaryCount:0,reviewCount:8,normalPercent:100,random:()=>0}),"review");
 assert.equal(selectQuestionType({ordinaryCount:0,reviewCount:0}),null);
});
test("连续抽取验证实际长期分布约70%普通30%复习",()=>{
 let index=0,normal=0,review=0;
 const random=()=>((index++%100)+0.5)/100;
 for(let n=0;n<1000;n++){
  const type=selectQuestionType({ordinaryCount:100,reviewCount:10,normalPercent:70,random});
  if(type==="ordinary")normal++;else review++;
 }
 assert.equal(normal,700);
 assert.equal(review,300);
});
