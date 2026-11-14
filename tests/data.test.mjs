import test from "node:test";
import assert from "node:assert/strict";
import {gunzipSync} from "node:zlib";

globalThis.window=globalThis;
await import("../site/data/questions.js");

const packed=window.LIFE_UK_PACKED;
const parsed=JSON.parse(gunzipSync(Buffer.from(packed,"base64")).toString("utf8"));

test("ZIP 来源题库已提交，至少 300 道独立记录",()=>{
  assert.equal(parsed.length,313);
  const ids=parsed.map(row=>row[0]);
  assert.equal(new Set(ids).size,ids.length);
});
test("正确答案一定对应真实选项",()=>{
  parsed.forEach(([id,question,options,indices])=>{
    assert.ok(Number.isInteger(id)&&id>0);
    assert.ok(typeof question==="string"&&question.length>=10);
    assert.ok(Array.isArray(options)&&options.length>=2&&options.length<=8);
    assert.equal(options.length,new Set(options).size);
    assert.ok(Array.isArray(indices)&&indices.length>=1);
    indices.forEach(i=>assert.ok(Number.isInteger(i)&&i>=0&&i<options.length));
    assert.ok(indices.length<options.length);
  });
});
test("手工修正记录仍保留在题库",()=>{
 const manual=window.LIFE_UK_QUESTIONS.questions;
 assert.ok(manual.length>=55);
 assert.ok(manual.some(q=>q.id==="zip-38"&&q.correctAnswers.includes("31 January 2020")));
});
