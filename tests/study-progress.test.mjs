import test from "node:test";
import assert from "node:assert/strict";
import {ensureStudyProgress,studyProgressView,setStudyGroupSize,recordStudyCompletion,GROUP_SIZES} from "../site/assets/study-progress.js";
import {readFileSync} from "node:fs";
const bank=Array.from({length:100},(_,i)=>({id:"q"+i}));
const fresh=()=>({attempts:626,correct:400,lastSeen:{q0:1,q1:3,removed:8},review:{q0:{pending:true,note:"keep"}},notes:{q0:"keep"},history:[{id:"q0"}]});
test("旧数据迁移使用实际题ID而非累计次数，新的组从0开始",()=>{
 const p=fresh(),before=structuredClone(p);
 assert.deepEqual(studyProgressView(p,bank),{round:1,roundDone:2,roundTotal:100,group:1,groupDone:0,groupSize:50});
 for(const key of Object.keys(before))assert.deepEqual(p[key],before[key]);
});
test("每组独立计数，重复题可计入组但不重复计入全库轮次",()=>{
 const p=fresh();setStudyGroupSize(p,bank,25);
 for(let i=0;i<24;i++)assert.equal(recordStudyCompletion(p,bank,"q0").groupFinished,false);
 assert.equal(recordStudyCompletion(p,bank,"q0").groupFinished,true);
 assert.deepEqual(studyProgressView(p,bank),{round:1,roundDone:2,roundTotal:100,group:2,groupDone:0,groupSize:25});
});
test("全库所有不同题完成后自动开始下一轮，不重置组或历史统计",()=>{
 const p=fresh();ensureStudyProgress(p,bank);
 for(let i=2;i<99;i++)assert.equal(recordStudyCompletion(p,bank,"q"+i).roundFinished,false);
 assert.equal(recordStudyCompletion(p,bank,"q99").roundFinished,true);
 assert.deepEqual(studyProgressView(p,bank),{round:2,roundDone:0,roundTotal:100,group:2,groupDone:48,groupSize:50});
 recordStudyCompletion(p,bank,"q99");assert.equal(studyProgressView(p,bank).roundDone,1);
 assert.equal(p.attempts,626);assert.equal(p.correct,400);assert.equal(p.review.q0.note,"keep");
});
test("改变每组数量保留尚未完成的计数；备份还原和不同题库独立",()=>{
 const p=fresh();for(let i=0;i<30;i++)recordStudyCompletion(p,bank,"q2");
 const v=setStudyGroupSize(p,bank,25);assert.equal(v.group,2);assert.equal(v.groupDone,5);
 assert.deepEqual(studyProgressView(JSON.parse(JSON.stringify(p)),bank),v);
 const custom={lastSeen:{}};assert.equal(studyProgressView(custom,[{id:"custom"}]).roundTotal,1);
 assert.equal(studyProgressView(custom,[{id:"custom"}]).groupDone,0);
 assert.equal(recordStudyCompletion(p,bank,"unknown").groupFinished,false);
 assert.deepEqual(GROUP_SIZES,[25,50,75,100]);
});
test("新增或删除题目时动态计算全库总数；旧全完成记录不重复结算",()=>{
 const p={lastSeen:{q0:1,q1:2}};
 assert.equal(studyProgressView(p,bank.slice(0,2)).round,2);
 assert.equal(studyProgressView(p,bank.slice(0,2)).round,2);
 recordStudyCompletion(p,bank.slice(0,3),"q2");
 assert.equal(studyProgressView(p,bank.slice(0,3)).roundTotal,3);
 assert.equal(studyProgressView(p,bank.slice(0,2)).roundDone,0);
});
test("计数仅接入实际提交及首次标记不懂，历史和抽题保持原流程",()=>{
 const app=readFileSync("site/assets/app.js","utf8");
 assert.equal((app.match(/recordStudyCompletion\(pr,bank\(\).questions,question.id\)/g)||[]).length,2);
 assert(app.includes("milestone=!feedback?recordStudyCompletion"));
 assert(app.includes("if(historyIndex!==null||!question"));
 assert(app.includes('return pickScheduled(bank().questions,p(),'));
 assert(app.includes("updateStudyProgress(frame,studyProgressView(pr,bank().questions))"));
});
