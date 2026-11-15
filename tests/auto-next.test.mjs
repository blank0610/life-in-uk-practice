import test from "node:test";
import assert from "node:assert/strict";
import {autoNextIsEnabled,shouldAutoAdvance} from "../site/assets/auto-next.js";

test("旧学习进度未保存自动换题开关时，默认继续开启",()=>{
  assert.equal(autoNextIsEnabled(undefined),true);
  assert.equal(autoNextIsEnabled(null),true);
  assert.equal(autoNextIsEnabled(true),true);
  assert.equal(autoNextIsEnabled(false),false);
});
test("关闭自动下一题后，即使正确也停留在当前题",()=>{
  assert.equal(shouldAutoAdvance({enabled:false,isCorrect:true,inPractice:true}),false);
});
test("开启后只有练习页答对才自动前进，答错不自动前进",()=>{
  assert.equal(shouldAutoAdvance({enabled:true,isCorrect:true,inPractice:true}),true);
  assert.equal(shouldAutoAdvance({enabled:true,isCorrect:false,inPractice:true}),false);
  assert.equal(shouldAutoAdvance({enabled:true,isCorrect:true,inPractice:false}),false);
});
test("朗读答案时不会自动跳过当前题目",()=>{
  assert.equal(shouldAutoAdvance({enabled:true,isCorrect:true,inPractice:true,isSpeaking:true}),false);
});
