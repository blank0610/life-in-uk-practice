import {GROUP_SIZES,studyProgressView,setStudyGroupSize,recordStudyCompletion} from "./study-progress.js";
import {createPracticeToolbar} from "./practice-toolbar.js";
import {additionalQuestions,appendAdditionalQuestions} from "../data/additional-questions.js";
import {pickScheduled,cooldownRequired} from "./scheduler.js?v=20261119-percentage-mix";
import {applyTextFixes} from "./quality-fixes.js";
import {createVoiceReader} from "./voice-reader.js";
import {autoNextIsEnabled,shouldAutoAdvance} from "./auto-next.js";
import {ensureHistory,appendHistory,updateHistoryResult,saveHistoryNote,previousHistoryIndex,nextHistoryIndex,canGoBack} from "./history.js";
import {isSavedForReview,isQueuedForReview,toggleSavedForReview} from "./review-bookmarks.js?v=20261119-review-batch";
import {DEFAULT_NORMAL_PERCENT,normalizeNormalPercent,reviewPercent} from "./review-mix.js";
import {renderAuditDashboard} from "./audit-dashboard.js?v=20261125-round-history";
const KEY="life-uk-practice-v1";
function shuffle(arr){const out=[...arr];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function validate(input){
 const raw=Array.isArray(input)?input:input?.questions;
 if(!Array.isArray(raw)||raw.length>10000)throw Error("题库需要 questions 数组（最多一万题）");
 const ids=new Set();
 return {version:String(input?.version||"manual"),questions:raw.map((q,i)=>{
  if(!q||typeof q!=="object")throw Error("第 "+(i+1)+" 题数据无效");
  const id=String(q.id||"").trim(),question=String(q.question||"").trim(),options=q.options,correctAnswers=q.correctAnswers;
  if(!id||ids.has(id)||!question||question.length>2000)throw Error("题号或题目无效，或重复");ids.add(id);
  if(!Array.isArray(options)||options.length<2||options.length>8||options.some(x=>typeof x!=="string"||!x.trim()))throw Error(id+"：选项应有2至8个字符串");
  if(new Set(options).size!==options.length||!Array.isArray(correctAnswers)||!correctAnswers.length||new Set(correctAnswers).size!==correctAnswers.length||correctAnswers.some(x=>!options.includes(x)))throw Error(id+"：答案不在选项内，或答案/选项重复");
  return {id,question,options,correctAnswers,explanation:String(q.explanation||""),category:String(q.category||"综合"),sourceScreenshot:Number(q.sourceScreenshot)||null};
 })};
}
let EMPTY=validate(window.LIFE_UK_QUESTIONS||{questions:[]});
async function inflateB64(source){
  const bytes=Uint8Array.from(atob(source),c=>c.charCodeAt(0));
  return JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text());
}
if(window.LIFE_UK_PACKED){
  try{
    const packed=await inflateB64(window.LIFE_UK_PACKED);
    const manual=new Map((window.LIFE_UK_QUESTIONS?.questions||[]).map(q=>[q.id,q]));
    const normalized=packed.map(([n,q,options,indices,explanation])=>{
      const id="zip-"+n, correction=manual.get(id);
      const generated={id,question:q.replace(/\s*\(0\)/g,"").replace(/\s+[»©]\s*/g," ").replace(/\s+/g," ").trim(),options,
        correctAnswers:indices.map(i=>options[i]),explanation:explanation||"",category:"用户 ZIP 截图题",sourceScreenshot:n};
      return correction?{...generated,question:correction.question,options:correction.options,correctAnswers:correction.correctAnswers}:generated;
    });
    const bankMap=new Map(normalized.map(q=>[q.id,q]));
    // 原始压缩包多含 #198；其题干、选项、答案与 #196 完全重复。
    bankMap.delete("zip-198");
    // Delta comes from a second screenshot extraction, plus manual side-by-side corrections.
    const response=await fetch("./data/recheck-2026-11-15.b64");
    if(!response.ok)throw Error("核对题库文件读取失败：HTTP "+response.status);
    const revisions=await inflateB64((await response.text()).trim());
    if(!Array.isArray(revisions))throw Error("核对题库格式无效");
    for(const row of revisions){
      const [n,newQ,newOptions,newIndices,newExplanation]=row;
      const id="zip-"+n,old=bankMap.get(id);
      if(!old&&!newQ)throw Error("新增题目缺少题干："+id);
      const options=newOptions??old?.options;
      const oldIndices=old?.correctAnswers.map(answer=>old.options.indexOf(answer))||[];
      const indices=newIndices??oldIndices;
      bankMap.set(id,{id,question:newQ??old.question,options,correctAnswers:indices.map(i=>options[i]),
        explanation:newExplanation===null?(old?.explanation||""):newExplanation,
        category:"用户 ZIP 截图题",sourceScreenshot:n});
    }
    applyTextFixes(bankMap,window.LIFE_UK_TEXT_FIXES);
    appendAdditionalQuestions(bankMap,additionalQuestions);
    EMPTY=validate({version:"zip-spelling-audited-2026-11-15",questions:[...bankMap.values()]});
    window.LIFE_UK_LOADED_COUNT=EMPTY.questions.length;
  }catch(err){console.error("ZIP 题库加载错误",err);window.LIFE_UK_IMPORT_ERROR=String(err);}
}
const blank=()=>({selected:"default",custom:null,byBank:{},autoNextEnabled:true,normalPercentage:DEFAULT_NORMAL_PERCENT});
const fresh=()=>({attempts:0,correct:0,review:{},recent:[],lastSeen:{},history:[],historySeq:0,notes:{}});
let data=blank();
try{const raw=JSON.parse(localStorage.getItem(KEY)||"null");if(raw&&typeof raw==="object"&&raw.byBank&&typeof raw.byBank==="object"){data={...blank(),...raw};if(data.custom)data.custom=validate(data.custom);if(!["default","custom"].includes(data.selected)||data.selected==="custom"&&!data.custom)data.selected="default";}}catch{data=blank();}
let page="practice",mode="all",question=null,lastId=null,selected=new Set(),feedback=null,timer=null,toastTimer=null,historyIndex=null,currentRecordSeq=null,currentWasRedo=false;
const $=id=>document.getElementById(id);
const voice=createVoiceReader({
  synthesis:window.speechSynthesis,
  Utterance:window.SpeechSynthesisUtterance,
  rate:0.92,
  onStatus(status){
    const label=$("voice-status");
    if(label)label.textContent=({
      speaking:"正在朗读英语…",
      stopped:"已停止朗读",
      ended:"朗读完成",
      error:"语音播放失败，可以换一个浏览器试试"
    })[status]||"";
    if(status==="error")notify("语音播放失败：请检查浏览器语音或系统音量。");
  }
});
const bank=()=>data.selected==="custom"&&data.custom?data.custom:EMPTY;
function p(){const t=data.byBank[data.selected];if(!t||!Number.isFinite(t.attempts)||!t.review||typeof t.review!=="object")data.byBank[data.selected]=fresh();const pr=data.byBank[data.selected];if(!pr.lastSeen)pr.lastSeen={};ensureHistory(pr);return pr;}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch{notify("本机存储空间不足，请导出备份");}}
function notify(t){$("toast").textContent=t;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),3000);}
function e(tag,cls="",value=""){const n=document.createElement(tag);if(cls)n.className=cls;if(value)n.textContent=value;return n;}
function button(label,cls,fn){const b=e("button",cls,label);b.type="button";b.addEventListener("click",fn);return b;}
function pending(){const ids=new Set(bank().questions.map(q=>q.id));return Object.keys(p().review).filter(id=>ids.has(id)&&isQueuedForReview(p().review[id]));}
function cancel(){clearTimeout(timer);timer=null;voice.stop();}
function syncAutoNextControl(){
 const active=autoNextIsEnabled(data.autoNextEnabled);
 const control=$("auto-next-toggle"),state=$("auto-next-state"),hint=$("auto-next-hint");
 if(control)control.checked=active;
 if(state)state.textContent=active?"开启":"关闭";
 if(hint)hint.textContent=active?"答对后自动进入下一题；点击朗读可以暂停自动换题。":"自动换题已关闭，准备好后点击「下一道随机题」。";
}
function scheduleAutoNext(){
 clearTimeout(timer);timer=null;
 const canAdvance=()=>shouldAutoAdvance({
  enabled:data.autoNextEnabled,
  isCorrect:feedback==="yes",
  inPractice:page==="practice"&&historyIndex===null,
  isSpeaking:voice.isPlaying()
 });
 if(!canAdvance())return;
 timer=setTimeout(()=>{
  timer=null;
  if(!canAdvance())return;
  if(mode==="review"&&!pending().length){question=null;changePage("review");notify("错题队列已完成");}
  else next();
 },voice.supported?5000:1250);
}
function changePage(v){if(!["practice","review","library","about","audit"].includes(v))return;if(v!=="practice")cancel();page=v;$("support-panel").classList.toggle("hidden",v!=="practice");for(const id of ["practice","review","library","about","audit"]){$("page-"+id).classList.toggle("hidden",id!==page);const b=document.querySelector('[data-page="'+id+'"]');b.classList.toggle("active",id===page);}const names={practice:"随机练习",review:"错题与收藏",library:"题库与备份",audit:"题库审核记录",about:"网站说明"};$("page-name").textContent=names[v];draw();}
function stats(){const pr=p();$("stat-total").textContent=pr.attempts;$("stat-rate").textContent=pr.attempts?Math.round(pr.correct/pr.attempts*100)+"%":"—";$("stat-review").textContent=pending().length;$("nav-review").textContent=pending().length;$("bank-status").textContent=data.selected==="custom"?"自定义题库":EMPTY.questions.length?"ZIP 截图题库":"题库载入失败";}
function empty(title,desc,action,fn){const box=e("div","empty");box.append(e("div","symbol","✦"),e("h3","",title),e("p","",desc),button(action,"primary",fn));return box;}
function choose(v){cancel();data.selected=v;mode="all";question=null;lastId=null;feedback=null;historyIndex=null;currentRecordSeq=null;selected.clear();persist();draw();notify("已切换题库");}
function pick(){return pickScheduled(bank().questions,p(),{reviewMode:mode==="review",lastId,percentage:DEFAULT_NORMAL_PERCENT,normalPercentage:normalizeNormalPercent(data.normalPercentage)});}
function next(){
 cancel();historyIndex=null;currentRecordSeq=null;selected.clear();feedback=null;
 const q=pick();question=q?{...q,display:shuffle(q.options)}:null;
 currentWasRedo=Boolean(q&&mode==="all"&&isQueuedForReview(p().review[q.id]));
 if(question)lastId=question.id;
 draw();
}
function start(m="all"){if(!bank().questions.length){changePage("library");notify("题库暂时无法载入");return;}if(m==="review"&&!pending().length){changePage("review");notify("暂无待复习的题");return;}mode=m;historyIndex=null;next();changePage("practice");}
function correct(){if(historyIndex!==null||!question||feedback||selected.size!==question.correctAnswers.length)return;voice.stop();const wanted=new Set(question.correctAnswers);const ok=selected.size===wanted.size&&[...selected].every(x=>wanted.has(x));const pr=p();const milestone=recordStudyCompletion(pr,bank().questions,question.id);pr.attempts++;pr.lastSeen[question.id]=pr.attempts;if(ok)pr.correct++;const old=pr.review[question.id]||{pending:false,wrong:0,wins:0,due:0,note:"",unsure:false};if(!ok)pr.review[question.id]={...old,pending:true,wrong:old.wrong+1,wins:0,due:old.due??0,lastPassTurn:null};else if(old.pending){const wins=old.wins+1;pr.review[question.id]={...old,pending:wins<2,wins,due:old.due??0,unsure:wins<2&&old.unsure,lastPassTurn:wins>=2?pr.attempts:null};}else pr.review[question.id]={...old,pending:false,lastPassTurn:pr.attempts,due:old.due};pr.recent=[...pr.recent,question.id].slice(-8);
feedback=ok?"yes":"no";
const row=appendHistory(pr,question,{selected:[...selected],result:feedback,mode,note:pr.notes[question.id]??pr.review[question.id]?.note??""});
currentRecordSeq=row.seq;
persist();draw();announceStudyMilestone(milestone);if(ok)scheduleAutoNext();}
function unsure(){if(historyIndex!==null||!question)return;voice.stop();const pr=p(),milestone=!feedback?recordStudyCompletion(pr,bank().questions,question.id):null,old=pr.review[question.id]||{pending:false,wrong:0,wins:0,due:0,note:"",unsure:false};pr.review[question.id]={...old,pending:true,unsure:true,wins:0,lastPassTurn:null,due:old.due??0,note:String($("note")?.value||old.note||"").slice(0,800)};pr.lastSeen[question.id]=pr.attempts;
pr.notes[question.id]=String($("note")?.value??pr.notes[question.id]??old.note??"").slice(0,800);
if(!feedback){
  feedback="unsure";
 currentRecordSeq=appendHistory(pr,question,{selected:[...selected],result:"unsure",mode,note:pr.notes[question.id]}).seq;
}else if(currentRecordSeq!==null){
 updateHistoryResult(pr,currentRecordSeq,"unsure");
 saveHistoryNote(pr,currentRecordSeq,pr.notes[question.id]);
}
persist();draw();announceStudyMilestone(milestone,"已加入错题队列");}
function announceStudyMilestone(milestone,fallback=""){
 const messages=[];
 if(milestone?.groupFinished)messages.push("本组完成，已开始下一组");
 if(milestone?.roundFinished)messages.push("全题库本轮完成，已开始下一轮");
 if(fallback)messages.push(fallback);
 if(messages.length)notify(messages.join(" · "));
}
function saveCurrentNote(note){
 if(!question)return;
 const pr=p(),value=String(note||"").slice(0,800);
 pr.notes[question.id]=value;
 if(pr.review[question.id])pr.review[question.id].note=value;
 if(currentRecordSeq!==null)saveHistoryNote(pr,currentRecordSeq,value);
 persist();
}
function memo(){if(!question)return;saveCurrentNote($("note")?.value||"");notify("笔记已保存在这个浏览器");}
function toggleQuestionSave(id){
 const pr=p(),saved=toggleSavedForReview(pr,id);
 // 收藏后先给使用者时间阅读说明，不要被已经安排的自动跳题打断。
 if(timer){clearTimeout(timer);timer=null;}
 persist();draw();
 const hint=$("auto-next-hint");
 if(hint&&feedback==="yes")hint.textContent="手动收藏状态已更新；自动换题已暂停，可以阅读解释后再继续。";
 notify(saved?"★ 已收藏：稍后会像错题一样加入随机复习":"已取消收藏；如果原来答错，仍会保留错题复习");
}
// 「下一道随机题」在朗读控制行始终可用，未作答时只跳过，不计为答错。
function nextFromControls(){
 if(historyIndex!==null){forwardHistory();return;}
 if(mode==="review"&&!pending().length){cancel();question=null;changePage("review");}
 else next();
}
function openHistory(index){
 const rows=ensureHistory(p());
 if(!Number.isInteger(index)||index<0||index>=rows.length)return;
 cancel();historyIndex=index;draw();
}
function goPrevious(){
 const index=previousHistoryIndex(p(),historyIndex,currentRecordSeq);
 if(index!==null)openHistory(index);
}
function forwardHistory(){
 if(historyIndex===null)return;
 const target=nextHistoryIndex(p(),historyIndex,currentRecordSeq);
 if(target===null)exitHistory();else openHistory(target);
}
function exitHistory(){cancel();historyIndex=null;draw();}
function historyResultLabel(row){
 if(row.result==="yes")return "✓ 答对";
 if(row.result==="no")return "✕ 答错";
 return "？ 标记不懂";
}
function drawHistoryStrip(root){
 const records=ensureHistory(p());
 if(!records.length)return;
 const strip=e("div","history-strip");
 const head=e("div","history-strip-label","最近五次作答 · 点击查看你的选择和笔记");
 strip.append(head);
 if(historyIndex!==null)strip.append(button("回到当前练习","linkbutton",exitHistory));
 const pills=e("div","history-pills");
 records.forEach((row,index)=>{
  const label=(isSavedForReview(p().review[row.id])?"★ ":"")+(row.sourceScreenshot?"#"+row.sourceScreenshot:row.id)+" · "+historyResultLabel(row);
  const b=button(label,"history-pill",()=>openHistory(index));
  if(index===historyIndex||historyIndex===null&&row.seq===currentRecordSeq)b.classList.add("current");
  b.title=row.question;
  pills.append(b);
 });
 strip.append(pills);
 root.append(strip);
}
function drawHistory(root,record){
 root.append(e("p","hint","以下显示你当时实际选择的答案与原来的选项顺序。历史回看不会再次计入答题次数。"));
 const answers=e("div","answers");
 record.display.forEach((answer,i)=>{
  const b=e("div","answer history-answer");
  const chosen=record.selected.includes(answer),isRight=record.correctAnswers.includes(answer);
  if(isRight)b.classList.add("good");
  else if(chosen)b.classList.add("bad");
  else b.classList.add("history-neutral");
  b.append(e("span","letter",String.fromCharCode(65+i)),e("span","",answer));
  if(chosen)b.append(e("span","history-answer-mark","你当时选了这个"));
  if(isRight)b.append(e("span","history-answer-mark","正确答案"));
  answers.append(b);
 });
 root.append(answers);
 const result=e("div","result"+(record.result==="yes"?"":" wrong"));
 result.append(e("b","",historyResultLabel(record)),
   e("p","","你当时选择："+(record.selected.length?record.selected.join("、"):"未选择（标记不懂）")),
   e("p","","正确答案："+record.correctAnswers.join("、")),
   e("p","",record.explanation||"这道题暂时没有经过核实的解释。"));
 const noteHeading=e("label","history-note-heading","你的学习笔记（可以编辑，自动保存在本机）");
 const textArea=e("textarea","note");
 textArea.id="history-note";textArea.maxLength=800;
 textArea.placeholder="记录当时不理解的内容";
 textArea.value=record.note||"";
 noteHeading.htmlFor=textArea.id;
 textArea.addEventListener("input",()=>{
  const updated=saveHistoryNote(p(),record.seq,textArea.value);
  if(updated&&record.seq===currentRecordSeq){
   const pr=p(),val=updated.note;
   pr.notes[record.id]=val;
   if(pr.review[record.id])pr.review[record.id].note=val;
  }
  persist();
 });
 result.append(noteHeading,textArea);
 const actions=e("div","group");
 const playAnswer=button("🔊 朗读答案与解释","secondary",()=>{
  if(!voice.playAnswer(record))notify("此浏览器不支持语音朗读。");
 });
 playAnswer.disabled=!voice.supported;
 actions.append(playAnswer,button("保存笔记","linkbutton",()=>{
  saveHistoryNote(p(),record.seq,textArea.value);persist();notify("历史笔记已保存");
 }));
 result.append(actions);root.append(result);
 drawHistoryStrip(root);
}

let practiceFrame=null;
function ensurePracticeFrame(root){
 if(practiceFrame&&practiceFrame.root===root&&root.contains(practiceFrame.header))return practiceFrame;
 const header=e("div","practice-question-header");
 const top=e("div","group practice-question-meta");
 const label=e("span","label"),meta=e("span","meta"),heading=e("h3","question");
 top.append(label,meta);
 const progressLine=e("div","study-progress-line");
 const roundText=e("span","study-progress-round"),groupText=e("strong","study-progress-group");
 const groupLabel=e("label","study-progress-size","每组");
 const groupSize=e("select","study-group-size");
 groupSize.setAttribute("aria-label","每组练习题数");
 for(const size of GROUP_SIZES){const opt=e("option","",size+" 道");opt.value=String(size);groupSize.append(opt);}
 groupLabel.append(groupSize);
 groupSize.addEventListener("change",()=>{
  const view=setStudyGroupSize(p(),bank().questions,groupSize.value);
  persist();updateStudyProgress(practiceFrame,view);
 });
 progressLine.append(roundText,groupText,groupLabel);
 header.append(top,progressLine,heading);
 const toolbar=createPracticeToolbar({
  document,
  onSpeak:record=>{if(timer){clearTimeout(timer);timer=null;}if(!voice.playQuestion(record))notify("此浏览器暂不支持语音朗读，请使用 Chrome、Edge 或 Safari。");},
  onStop:()=>voice.stop(),
  onPrevious:goPrevious,
  onSave:id=>toggleQuestionSave(id),
  onNext:nextFromControls
 });
 const mix=e("div","practice-mix-slot"),body=e("div","practice-question-body");
 root.replaceChildren(header,toolbar.element,mix,body);
 practiceFrame={root,header,label,meta,heading,toolbar,mix,body,roundText,groupText,groupSize};
 return practiceFrame;
}
function updateStudyProgress(frame,view){
 frame.roundText.textContent="第 "+view.round+" 轮 · "+view.roundDone+" / "+view.roundTotal+" 题";
 frame.groupText.textContent="第 "+view.group+" 组 · "+view.groupDone+" / "+view.groupSize;
 frame.groupSize.value=String(view.groupSize);
}
function drawPracticeMix(root){
 root.replaceChildren();
 if(mode!=="all")return;
 {
 const normal=normalizeNormalPercent(data.normalPercentage),redo=reviewPercent(normal);
 const panel=e("div","practice-mix");
 const header=e("div","practice-mix-heading");
 const label=e("span","",currentWasRedo?"🔁 本题是随机选出的错题／收藏题":"每按一次「下一道随机题」都重新随机抽取");
 const value=e("strong","practice-mix-value","普通题 "+normal+"% · 复习题 "+redo+"%");
 header.append(label,value);
 const range=e("input","practice-mix-range");
 range.id="practice-mix-percentage";range.type="range";range.min="0";range.max="100";range.step="5";range.value=String(normal);
 range.setAttribute("aria-label","下一题出现普通题的百分比");
 const hint=e("p","muted practice-mix-hint",pending().length
  ?"可直接调整比例；下一次手动换题或自动换题时生效。"
  :"当前没有错题或收藏题，暂时只会显示普通题；收藏或答错后按所设比例随机复习。");
 range.addEventListener("input",event=>{
   const nextNormal=normalizeNormalPercent(event.target.value);
   data.normalPercentage=nextNormal;
   persist();
   value.textContent="普通题 "+nextNormal+"% · 复习题 "+reviewPercent(nextNormal)+"%";
 });
 panel.append(header,range,hint);
 root.append(panel);
 }
}

function drawQuiz(){
 const quiz=$("quiz");
 if(!bank().questions.length||!question){
  practiceFrame=null;quiz.replaceChildren();
  if(!bank().questions.length)quiz.append(empty("题库暂时无法载入","请刷新页面；如果仍有问题，可以在 GitHub 报告题库载入错误。","刷新页面",()=>location.reload()));
  else quiz.append(empty("准备开始练习了吗？","题目和答案位置每次都会随机变化。答错或不懂的题目会进入复习队列。","开始随机练习",()=>next()));
  return;
 }
 const records=ensureHistory(p());
 let record=historyIndex===null?null:records[historyIndex];
 if(historyIndex!==null&&!record)historyIndex=null;
 const shown=record||question,frame=ensurePracticeFrame(quiz);
 frame.label.textContent=record?"历史作答 · "+(historyIndex+1)+" / "+records.length:mode==="review"?"REVIEW · 收藏与错题":"PRACTICE · 随机练习";
 frame.meta.textContent="截图 #"+(shown.sourceScreenshot||"—")+" · 累计答题 "+p().attempts+" 次"+(record?" · 只读":"");
 const pr=p(),firstProgress=!pr.studyProgress;
 updateStudyProgress(frame,studyProgressView(pr,bank().questions));
 if(firstProgress)persist();
 frame.heading.textContent=shown.question;
 frame.toolbar.update({question:shown,saved:isSavedForReview(p().review[shown.id]),canPrevious:canGoBack(p(),historyIndex,currentRecordSeq),speakingSupported:voice.supported,inHistory:Boolean(record),returnsToCurrent:Boolean(record&&nextHistoryIndex(p(),historyIndex,currentRecordSeq)===null)});
 drawPracticeMix(frame.mix);
 const root=frame.body;root.replaceChildren();
 if(record){drawHistory(root,record);return;}
root.append(e("p","hint",question.correctAnswers.length>1?"请选择 "+question.correctAnswers.length+" 个正确答案再提交。":"请选择一个答案，系统将立即批改。"));const opts=e("div","answers");question.display.forEach((text,i)=>{const b=button("","answer",()=>{if(feedback)return;if(question.correctAnswers.length===1){selected=new Set([text]);correct();}else{if(selected.has(text))selected.delete(text);else if(selected.size<question.correctAnswers.length)selected.add(text);draw();}});b.disabled=Boolean(feedback);b.setAttribute("aria-pressed",String(selected.has(text)));if(selected.has(text))b.classList.add("selected");if(feedback&&question.correctAnswers.includes(text))b.classList.add("good");else if(feedback&&selected.has(text))b.classList.add("bad");b.append(e("span","letter",String.fromCharCode(65+i)),e("span","",text));opts.append(b);});root.append(opts);
if(feedback){const wrong=feedback!=="yes",f=e("div","result"+(wrong?" wrong":""));f.append(e("b","",wrong?"✕ 需要巩固这道题":"✓ 回答正确！"),e("p","","正确答案："+question.correctAnswers.join("、")),e("p","",question.explanation||"这张截图的说明文字尚未完成逐字核对；未添加推测性解释。"));const ta=e("textarea");ta.id="note";ta.maxLength=800;ta.placeholder="写下这道题的学习笔记（自动保存）";ta.value=p().notes[question.id]??p().review[question.id]?.note??"";
ta.addEventListener("input",()=>{
  if(timer){clearTimeout(timer);timer=null;const hint=$("auto-next-hint");if(hint)hint.textContent="正在记笔记，自动换题已暂停。";}
  saveCurrentNote(ta.value);
});
f.append(ta);
if(wrong){const actions=e("div","group");actions.append(
  button("🔊 朗读正确答案与解释","secondary",()=>{cancel();if(!voice.playAnswer(question))notify("此浏览器不支持语音朗读。");}),
  button("我不理解 · 加强复习","secondary",unsure),
  button("保存笔记","linkbutton",memo)
);f.append(actions);}else{
  const autoHint=e("p","hint");autoHint.id="auto-next-hint";f.append(autoHint);
  const actions=e("div","group");
  actions.append(
    button("🔊 朗读正确答案与解释","secondary",()=>{
      cancel();
      if(!voice.playAnswer(question))notify("此浏览器不支持语音朗读。");
    }),
    button("保存笔记","linkbutton",memo)
  );
  f.append(actions);
}root.append(f);syncAutoNextControl();}
const bottom=e("div","bottom");bottom.append(e("span","muted","答错或手动收藏的题目会再次出现，也可以进入专项复习。"));if(!feedback){const actions=e("div","group");if(question.correctAnswers.length>1){const b=button("提交答案 →","primary",correct);b.disabled=selected.size!==question.correctAnswers.length;actions.append(b);}actions.append(button("我不懂 · 显示答案","linkbutton",unsure));bottom.append(actions);}root.append(bottom);drawHistoryStrip(root);
}
function drawReview(){
 const root=$("review-list");root.replaceChildren();
 const ids=pending(),lookup=new Map(bank().questions.map(q=>[q.id,q]));
 $("start-review").disabled=!ids.length;
 if(!ids.length){
  root.append(empty("目前没有待复习题","答错、标记不懂或手动收藏的题目会加入这里。","回到练习",()=>changePage("practice")));
  return;
 }
 ids.forEach(id=>{
  const q=lookup.get(id),r=p().review[id],box=e("div","reviewcard"),left=e("div");
  const saved=isSavedForReview(r);
  const detail=(r.pending?"答错 "+(r.wrong||0)+" 次 · 正确复习 "+(r.wins||0)+"/2 次":"手动收藏 · 等待再次练习")+(r.note?" · 有笔记":"");
  left.append(e("b","",q.question),e("p","",detail));
  const right=e("div","group");
  right.append(e("span","pill",saved?(r.pending?"★ 收藏 · 待复习":"★ 收藏复习"):(r.unsure?"不理解":"待复习")));
  if(saved)right.append(button("取消收藏","linkbutton",()=>toggleQuestionSave(id)));
  box.append(left,right);root.append(box);
 });
}
function drawLibrary(){
 const normal=normalizeNormalPercent(data.normalPercentage),redo=reviewPercent(normal);
 $("redo-cycle-summary").textContent="当前抽取比例：普通题 "+normal+"% / 错题、不懂或收藏题 "+redo+"%。请返回「随机练习」页面，在题目上方用滑块调整，下一题立即按新比例抽取。";
 $("bank-size").textContent=EMPTY.questions.length+" 道题"+(EMPTY.questions.length?"":" · 等待 ZIP");$("choose-default").classList.toggle("active",data.selected==="default");$("library-summary").textContent="当前： "+(data.selected==="custom"?"本机导入的自定义题库":"ZIP 截图题库")+"（"+bank().questions.length+" 题）";}
function draw(){stats();if(page==="practice")drawQuiz();if(page==="review")drawReview();if(page==="library")drawLibrary();if(page==="audit")renderAuditDashboard($("audit-panel"),{repo:$("page-audit").dataset.githubRepo});}
async function readFile(input){const file=input.files?.[0];input.value="";if(!file)return null;if(file.size>4000000)throw Error("文件超过 4MB");return JSON.parse(await file.text());}
function exportFile(name,content){const blob=new Blob([JSON.stringify(content,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$("auto-next-toggle").addEventListener("change",event=>{
 data.autoNextEnabled=event.target.checked;
 persist();
 if(!data.autoNextEnabled){clearTimeout(timer);timer=null;}
 else if(feedback==="yes")scheduleAutoNext();
 syncAutoNextControl();
 notify(data.autoNextEnabled?"已开启：答对后自动下一题":"已关闭：答对后手动下一题");
});
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>changePage(b.dataset.page)));
$("new-question").addEventListener("click",()=>{mode="all";next();});
$("start-review").addEventListener("click",()=>start("review"));
$("refresh-audit").addEventListener("click",()=>renderAuditDashboard($("audit-panel"),{repo:$("page-audit").dataset.githubRepo}));
$("choose-default").addEventListener("click",()=>choose("default"));

$("export-progress").addEventListener("click",()=>exportFile("life-uk-progress.json",{format:"life-uk-backup-v1",data}));
$("import-bank").addEventListener("change",async event=>{try{const raw=await readFile(event.target);if(!raw)return;const b=validate(raw);if(!b.questions.length)throw Error("题库不能为空");data.custom=b;choose("custom");$("import-status").textContent="成功导入 "+b.questions.length+" 道题，仅此浏览器可用";}catch(err){$("import-status").textContent="失败："+err.message;}});
$("import-progress").addEventListener("change",async event=>{try{const raw=await readFile(event.target);if(!raw||raw.format!=="life-uk-backup-v1")throw Error("备份格式不匹配");const val=raw.data;if(!val||!val.byBank||!["default","custom"].includes(val.selected))throw Error("备份无效");if(val.custom)val.custom=validate(val.custom);data={...blank(),...val};if(data.selected==="custom"&&!data.custom)data.selected="default";question=null;feedback=null;historyIndex=null;currentRecordSeq=null;currentWasRedo=false;persist();syncAutoNextControl();changePage("practice");notify("学习记录已恢复");}catch(err){notify("恢复失败："+err.message);}});
syncAutoNextControl();
changePage("practice");
// 默认直接展示随机题，无需先点击“开始”；仍按进度及冷却比例调度。
if(bank().questions.length)next();
