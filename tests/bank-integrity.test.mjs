import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {gunzipSync} from "node:zlib";
import vm from "node:vm";

const raw=readFileSync("site/data/questions.js","utf8");
const globals={window:{}};
vm.runInNewContext(raw,globals);
const b64=globals.window.LIFE_UK_PACKED;
const packed=JSON.parse(gunzipSync(Buffer.from(b64,"base64")).toString("utf8"));
const revisions=JSON.parse(gunzipSync(Buffer.from(
  readFileSync("site/data/recheck-2026-11-15.b64","utf8").trim(),
  "base64"
)).toString("utf8"));
const byId=new Map(packed.map(([n,q,opts,idx,note])=>[n,[n,q,opts,idx,note]]));
for(const [n,q,options,indices,explanation] of revisions){
  const old=byId.get(n);
  if(!old){
    byId.set(n,[n,q,options,indices,explanation]);
  }else{
    byId.set(n,[n,q??old[1],options??old[2],indices??old[3],explanation??old[4]]);
  }
}
const bank=[...byId.values()];
test("487 道源自用户 ZIP 截图而不是演示题",()=>{
  if(bank.length!==487){const rejected=[33,45,46,98,114,128,133,135,184,198,199,211,215,216,217,218,219,294,306,429,489,497];console.log("未预期的原压缩题截图编号：",rejected.filter(n=>byId.has(n)));}
  assert.equal(bank.length,487);
  assert.equal(new Set(bank.map(x=>x[0])).size,487);
  assert(!bank.some(x=>/DEMO ONLY|EXAMPLE ONLY|^demo-/i.test(x[1])));
  const app=readFileSync("site/assets/app.js","utf8");
  const html=readFileSync("site/index.html","utf8");
  assert(!app.includes("const DEMO"));
  assert(!app.includes('choose("demo")'));
  assert(!html.includes('id="choose-demo"'));
  assert(!html.includes("体验示范题"));
});
test("每道题至少有两个不同选项，正确答案完整有效",()=>{
  for(const [n,q,options,answers,note] of bank){
    assert(Number.isInteger(n) && n>=17,"题目编号无效 "+n);
    assert(typeof q==="string"&&q.trim().length>5,"题干有误 "+n);
    assert(Array.isArray(options)&&options.length>=2&&options.length<=8,"选项缺失 "+n);
    assert(options.every(o=>typeof o==="string"&&o.trim()),"选项空缺 "+n);
    assert.equal(new Set(options).size,options.length,"重复选项 "+n);
    assert(Array.isArray(answers)&&answers.length>=1,"答案缺失 "+n);
    assert.equal(new Set(answers).size,answers.length,"答案重复 "+n);
    assert(answers.every(i=>Number.isInteger(i)&&i>=0&&i<options.length),"正确答案不在选项中 "+n);
    assert(typeof note==="string","说明格式不正确 "+n);
  }
});
test("重新核对找回的多选题和关键截图有完整答案",()=>{
  const samples=[21,23,28,35,43,47,79,101,103,139,171,178,179,214,235,259,283,307,311,336,342,351,375,410,428,438,472,493,502,508];
  for(const n of samples)assert(byId.has(n),"缺少复核题号 "+n);
  assert.equal(byId.get(214)[3].length,3);
  assert.equal(byId.get(283)[3].length,4);
  assert(byId.get(438)[4].includes("outdated"));
});
test("不完整和重复的截图没有被误加入",()=>{
  for(const n of [33,114,128,184,294,489,497])assert(!byId.has(n));
});
test("说明有可用文本的题目超过 75%",()=>{
  assert(bank.filter(r=>r[4].trim()).length>=390);
});
