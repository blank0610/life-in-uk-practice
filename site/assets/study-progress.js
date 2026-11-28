// Display-only study milestones; never modify the scheduler, lifetime score, or review queues.
export const GROUP_SIZES=Object.freeze([25,50,75,100]);
export const DEFAULT_GROUP_SIZE=50;
const positive=(n,fallback=1)=>Number.isSafeInteger(n)&&n>0?n:fallback;
const nonnegative=n=>Number.isSafeInteger(n)&&n>=0?n:0;
const validSize=n=>GROUP_SIZES.includes(Number(n))?Number(n):DEFAULT_GROUP_SIZE;
function rolloverGroup(s){
 const finished=Math.floor(s.groupDone/s.groupSize);
 s.group+=finished;s.groupDone%=s.groupSize;
 return finished;
}
export function ensureStudyProgress(progress,questions){
 const ids=new Set(questions.map(q=>q.id));
 const existing=progress.studyProgress;
 // The old attempt counter is not a distinct-question count. Migrate from actual seen IDs.
 const old=existing&&typeof existing==="object"&&!Array.isArray(existing)?existing:null;
 const s=old||{round:1,seen:Object.keys(progress.lastSeen||{}),group:1,groupDone:0,groupSize:DEFAULT_GROUP_SIZE};
 s.round=positive(s.round);s.group=positive(s.group);s.groupDone=nonnegative(s.groupDone);
 s.groupSize=validSize(s.groupSize);rolloverGroup(s);
 s.seen=[...new Set((Array.isArray(s.seen)?s.seen:[]).filter(id=>ids.has(id)))];
 if(ids.size&&s.seen.length===ids.size){s.round++;s.seen=[];}
 progress.studyProgress=s;
 return s;
}
export function studyProgressView(progress,questions){
 const s=ensureStudyProgress(progress,questions);
 return {round:s.round,roundDone:s.seen.length,roundTotal:new Set(questions.map(q=>q.id)).size,group:s.group,groupDone:s.groupDone,groupSize:s.groupSize};
}
export function setStudyGroupSize(progress,questions,size){
 const s=ensureStudyProgress(progress,questions);
 if(!GROUP_SIZES.includes(Number(size)))return studyProgressView(progress,questions);
 s.groupSize=Number(size);rolloverGroup(s);
 return studyProgressView(progress,questions);
}
export function recordStudyCompletion(progress,questions,id){
 const s=ensureStudyProgress(progress,questions),ids=new Set(questions.map(q=>q.id));
 if(!ids.has(id))return {groupFinished:false,roundFinished:false};
 // One submitted or explicitly revealed question advances the group; repeats only count once per bank round.
 s.groupDone++;const groupFinished=rolloverGroup(s)>0;
 if(!s.seen.includes(id))s.seen.push(id);
 const roundFinished=s.seen.length===ids.size;
 if(roundFinished){s.round++;s.seen=[];}
 return {groupFinished,roundFinished};
}
