import {ORIGINAL_TESTS} from "../data/original-tests.js";
const validResult=v=>["yes","no","unsure"].includes(v);
export function buildOriginalTests(questions,source=ORIGINAL_TESTS){
 const byId=new Map(questions.map(q=>[q.id,q]));
 return source.map(t=>{
  const entries=t.entries.map(([sourceScreenshot,questionId],i)=>({position:i+1,sourceScreenshot,questionId,question:byId.get(questionId)}));
  return {number:t.test,entries,available:entries.length>0&&entries.every(e=>e.question)&&new Set(entries.map(e=>e.questionId)).size===entries.length};
 });
}
export function ensureSourceSession(progress,test){
 if(!progress.sourceTestProgress||typeof progress.sourceTestProgress!=="object"||Array.isArray(progress.sourceTestProgress))progress.sourceTestProgress={};
 const key=String(test.number),old=progress.sourceTestProgress[key];
 const s=old&&typeof old==="object"&&!Array.isArray(old)?old:{};
 const results=s.results&&typeof s.results==="object"&&!Array.isArray(s.results)?s.results:{};
 s.results=Object.fromEntries(test.entries.filter(e=>validResult(results[e.questionId])).map(e=>[e.questionId,results[e.questionId]]));
 s.cursor=Number.isInteger(s.cursor)&&s.cursor>=0&&s.cursor<test.entries.length?s.cursor:0;
 s.completedRuns=Number.isSafeInteger(s.completedRuns)&&s.completedRuns>=0?s.completedRuns:0;
 progress.sourceTestProgress[key]=s;
 return s;
}
export function sourceTestView(progress,test){
 const s=ensureSourceSession(progress,test),values=Object.values(s.results),total=test.entries.length;
 return {done:values.length,total,correct:values.filter(v=>v==="yes").length,wrong:values.filter(v=>v==="no").length,unsure:values.filter(v=>v==="unsure").length,complete:total>0&&values.length===total,completedRuns:s.completedRuns};
}
export function pickSourceTestQuestion(progress,test,afterId=null){
 if(!test?.available)return null;
 const s=ensureSourceSession(progress,test),n=test.entries.length;
 const previous=test.entries.findIndex(e=>e.questionId===afterId);
 const start=previous>=0?(previous+1)%n:s.cursor;
 for(let i=0;i<n;i++){
  const idx=(start+i)%n,e=test.entries[idx];
  if(!validResult(s.results[e.questionId])){
   s.cursor=idx;
   return {...e.question,sourceTest:test.number,sourceQuestion:e.position,sourceTestScreenshot:e.sourceScreenshot};
  }
 }
 return null;
}
export function recordSourceTestAnswer(progress,test,id,result){
 if(!test?.available||!validResult(result)||!test.entries.some(e=>e.questionId===id))return false;
 const s=ensureSourceSession(progress,test);
 if(validResult(s.results[id]))return false;
 s.results[id]=result;
 s.cursor=(test.entries.findIndex(e=>e.questionId===id)+1)%test.entries.length;
 const view=sourceTestView(progress,test);
 if(view.complete){
  s.completedRuns++;s.lastResult={correct:view.correct,wrong:view.wrong,unsure:view.unsure,total:view.total};
 }
 return true;
}
export function restartSourceTest(progress,test){
 if(!sourceTestView(progress,test).complete)return false;
 const s=ensureSourceSession(progress,test);
 s.results={};s.cursor=0;return true;
}
