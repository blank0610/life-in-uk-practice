import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("../site/assets/app.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");

const toolbar=readFileSync(new URL("../site/assets/practice-toolbar.js",import.meta.url),"utf8");
test("下一题按钮只出现一次，位于共用的朗读、停止、上一题、收藏控制栏",()=>{
  assert.equal((toolbar.match(/button\("下一题 →"/g)||[]).length,1);
  const order=["朗读题目与全部选项","停止朗读","← 上一题","☆ 收藏稍后复习","下一题 →"];
  assert(order.every((s,i)=>toolbar.includes(s)&&(!i||toolbar.indexOf(s)>toolbar.indexOf(order[i-1]))));
  assert(toolbar.includes("element.append(speak,stop,previous,save,next,status)"));
  assert(app.includes("onNext:nextFromControls"));
  assert(app.includes("if(historyIndex!==null){forwardHistory();return;}"));
});
test("跳题继续保留错题专项已完成的处理和停止旧朗读",()=>{
  const fn=app.slice(app.indexOf("function nextFromControls(){"),app.indexOf("function drawQuiz(){"));
  assert(fn.includes('mode==="review"&&!pending().length'));
  assert(fn.includes('changePage("review")'));
  assert(fn.includes('else next()'));
  assert(/function next\(\)\s*\{\s*cancel\(\);/.test(app));
});
test("窄屏设备允许朗读控制栏换行，避免下一题按钮被裁切",()=>{
  assert(css.includes(".voice-controls"));
  assert(css.includes(".group{display:flex;"));
  assert(css.includes(".practice-toolbar{display:flex;flex-wrap:wrap"));
  assert(css.includes(".voice-controls .primary{white-space:nowrap"));
});
