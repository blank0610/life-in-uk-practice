import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("../site/assets/app.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");

test("下一题按钮只出现一次，位于朗读与停止按钮同一控制栏",()=>{
  assert.equal((app.match(/button\("下一道随机题 →"/g)||[]).length,1);
  const controls=app.slice(app.indexOf('const speechControls=e("div"'),app.indexOf('root.append(speechControls'));
  assert(controls.includes("朗读题目与全部选项"));
  assert(controls.includes("停止朗读"));
  assert(controls.includes('button("下一道随机题 →","primary",nextFromControls)'));
  assert(controls.indexOf("朗读题目与全部选项")<controls.indexOf("停止朗读"));
  assert(controls.indexOf("停止朗读")<controls.indexOf("下一道随机题 →"));
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
  assert(css.includes("flex-wrap:wrap"));
  assert(css.includes(".voice-controls .primary{white-space:nowrap"));
});
