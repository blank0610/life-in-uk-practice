import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {pickScheduled} from "../site/assets/scheduler.js";

const app=readFileSync(new URL("../site/assets/app.js",import.meta.url),"utf8");
const page=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
const questions=Array.from({length:12},(_,i)=>({id:"q"+i}));
const progress=()=>({attempts:12,lastSeen:{},review:{q1:{pending:true,wrong:1},q2:{saved:true,pending:false}}});

test("练习页只有一个可调整比例滑块，无独立的旧冷却比例输入",()=>{
 assert.equal((app.match(/range\.id="practice-mix-percentage"/g)||[]).length,1);
 assert(!page.includes('id="repeat-threshold"'));
 assert(!page.includes('id="mix-normal-percent"'));
 assert(app.includes('range.addEventListener("input",event=>{'));
 assert(app.includes("data.normalPercentage=nextNormal"));
 assert(app.includes("persist();"));
});
test("每次按下一题都走pick的比例随机调度，默认70/30",()=>{
 assert(app.includes("const q=pick();question=q?"));
 assert(app.includes("normalPercentage:normalizeNormalPercent(data.normalPercentage)"));
 assert(app.includes("percentage:DEFAULT_NORMAL_PERCENT"));
 const p=progress();
 const choiceA=pickScheduled(questions,p,{normalPercentage:70,random:()=>0.69});
 const choiceB=pickScheduled(questions,p,{normalPercentage:70,random:()=>0.71});
 assert(!["q1","q2"].includes(choiceA.id));
 assert(["q1","q2"].includes(choiceB.id));
 const choiceC=pickScheduled(questions,p,{normalPercentage:50,random:()=>0.49});
 const choiceD=pickScheduled(questions,p,{normalPercentage:50,random:()=>0.51});
 assert(!["q1","q2"].includes(choiceC.id));
 assert(["q1","q2"].includes(choiceD.id));
});
test("没有需要复习题时不会因30%的复习抽取概率而停止出题",()=>{
 const p={attempts:0,lastSeen:{},review:{}};
 const next=pickScheduled(questions,p,{normalPercentage:0,random:()=>0.95});
 assert(next&&questions.some(q=>q.id===next.id));
});
test("用户修改百分比保留在浏览器中，跳过题目不计为答错",()=>{
 assert(app.includes('data.normalPercentage=nextNormal;'));
 assert(app.includes('persist();'));
 const nextIndex=app.indexOf("function next(){");
 const end=app.indexOf("function start(",nextIndex);
 const body=app.slice(nextIndex,end);
 assert(body.includes("const q=pick()"));
 assert(!body.includes("pr.attempts++"));
 assert(!body.includes("pr.review[question.id]="));
});
