import {pickScheduled,cooldownRequired} from "./scheduler.js";
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
  return {id,question,options,correctAnswers,explanation:String(q.explanation||""),category:String(q.category||"综合")};
 })};
}
const DEMO=validate({version:"demo-v1",questions:[
{id:"demo-1",question:"DEMO ONLY: How many days are in a week?",options:["Five","Six","Seven","Eight"],correctAnswers:["Seven"],explanation:"一周有七天。这只是演示题，不是真正的 Life in the UK 考题。"},
{id:"demo-2",question:"DEMO ONLY: Which of these animals usually barks?",options:["Cat","Dog","Butterfly","Fish"],correctAnswers:["Dog"],explanation:"Dog 是狗。这只是演示题。"},
{id:"demo-3",question:"DEMO ONLY: Choose TWO months of the year.",options:["January","Tuesday","July","Friday"],correctAnswers:["January","July"],explanation:"January 和 July 是月份。这是多选功能示范。"},
{id:"demo-4",question:"DEMO ONLY: What is two plus two?",options:["Three","Four","Five","Six"],correctAnswers:["Four"],explanation:"2 + 2 = 4。并非英国生活考试题。"},
{id:"demo-5",question:"DEMO ONLY: Which shape has three sides?",options:["Circle","Square","Triangle","Pentagon"],correctAnswers:["Triangle"],explanation:"Triangle 有三条边。并非官方考题。"}
]});
let EMPTY=validate(window.LIFE_UK_QUESTIONS||{questions:[]});
if(window.LIFE_UK_PACKED){
 try{
  if(typeof DecompressionStream!=="function")throw Error("浏览器不支持题库解压");
  const zipBytes=Uint8Array.from(atob(window.LIFE_UK_PACKED),c=>c.charCodeAt(0));
  const unzipped=new Blob([zipBytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const payload=JSON.parse(await new Response(unzipped).text());
  EMPTY=validate({version:"ZIP截图题库-2026-11-15",questions:payload.map(([n,q,options,indices,explanation])=>({
    id:"zip-"+n,question:q,options,correctAnswers:indices.map(i=>options[i]),explanation,
    category:"用户提供的截图题库"
  }))});
 }catch(err){console.error("题库载入失败",err);window.LIFE_UK_IMPORT_ERROR=String(err);}
}
const blank=()=>({selected:"default",custom:null,byBank:{},repeatThreshold:70});
const fresh=()=>({attempts:0,correct:0,review:{},recent:[],lastSeen:{}});
let data=blank();
try{const raw=JSON.parse(localStorage.getItem(KEY)||"null");if(raw&&typeof raw==="object"&&raw.byBank&&typeof raw.byBank==="object"){data={...blank(),...raw};if(data.custom)data.custom=validate(data.custom);if(!["default","demo","custom"].includes(data.selected)||data.selected==="custom"&&!data.custom)data.selected="default";}}catch{data=blank();}
let page="practice",mode="all",question=null,lastId=null,selected=new Set(),feedback=null,timer=null,toastTimer=null;
const $=id=>document.getElementById(id);
const bank=()=>data.selected==="demo"?DEMO:(data.selected==="custom"&&data.custom?data.custom:EMPTY);
function p(){const t=data.byBank[data.selected];if(!t||!Number.isFinite(t.attempts)||!t.review||typeof t.review!=="object")data.byBank[data.selected]=fresh();if(!data.byBank[data.selected].lastSeen)data.byBank[data.selected].lastSeen={};return data.byBank[data.selected];}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch{notify("本机存储空间不足，请导出备份");}}
function notify(t){$("toast").textContent=t;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),3000);}
function e(tag,cls="",value=""){const n=document.createElement(tag);if(cls)n.className=cls;if(value)n.textContent=value;return n;}
function button(label,cls,fn){const b=e("button",cls,label);b.type="button";b.addEventListener("click",fn);return b;}
function pending(){const ids=new Set(bank().questions.map(q=>q.id));return Object.keys(p().review).filter(id=>ids.has(id)&&p().review[id]?.pending);}
function cancel(){clearTimeout(timer);timer=null;}
function changePage(v){if(!["practice","review","library","about"].includes(v))return;if(v!=="practice")cancel();page=v;for(const id of ["practice","review","library","about"]){$("page-"+id).classList.toggle("hidden",id!==page);const b=document.querySelector('[data-page="'+id+'"]');b.classList.toggle("active",id===page);}const names={practice:"随机练习",review:"错题重练",library:"题库与备份",about:"网站说明"};$("page-name").textContent=names[v];draw();}
function stats(){const pr=p();$("stat-total").textContent=pr.attempts;$("stat-rate").textContent=pr.attempts?Math.round(pr.correct/pr.attempts*100)+"%":"—";$("stat-review").textContent=pending().length;$("nav-review").textContent=pending().length;$("bank-status").textContent=data.selected==="demo"?"示范题 · 非官方":data.selected==="custom"?"自定义题库":EMPTY.questions.length?"正式题库":"等待正式题库";}
function empty(title,desc,action,fn){const box=e("div","empty");box.append(e("div","symbol","✦"),e("h3","",title),e("p","",desc),button(action,"primary",fn));return box;}
function choose(v){cancel();data.selected=v;mode="all";question=null;lastId=null;feedback=null;selected.clear();persist();draw();notify("已切换题库");}
function pick(){return pickScheduled(bank().questions,p(),{reviewMode:mode==="review",lastId,percentage:data.repeatThreshold||70});}
function next(){cancel();selected.clear();feedback=null;const q=pick();question=q?{...q,display:shuffle(q.options)}:null;if(question)lastId=question.id;draw();}
function start(m="all"){if(!bank().questions.length){changePage("library");notify("请先选择示范题");return;}if(m==="review"&&!pending().length){changePage("review");notify("暂无待复习的题");return;}mode=m;next();changePage("practice");}
function correct(){if(!question||feedback||selected.size!==question.correctAnswers.length)return;const wanted=new Set(question.correctAnswers);const ok=selected.size===wanted.size&&[...selected].every(x=>wanted.has(x));const pr=p();pr.attempts++;pr.lastSeen[question.id]=pr.attempts;if(ok)pr.correct++;const old=pr.review[question.id]||{pending:false,wrong:0,wins:0,due:0,note:"",unsure:false};if(!ok)pr.review[question.id]={...old,pending:true,wrong:old.wrong+1,wins:0,due:pr.attempts+2,lastPassTurn:null};else if(old.pending){const wins=old.wins+1;pr.review[question.id]={...old,pending:wins<2,wins,due:pr.attempts+2,unsure:wins<2&&old.unsure,lastPassTurn:wins>=2?pr.attempts:null};}else pr.review[question.id]={...old,pending:false,lastPassTurn:pr.attempts};pr.recent=[...pr.recent,question.id].slice(-8);persist();feedback=ok?"yes":"no";draw();if(ok)timer=setTimeout(()=>{timer=null;if(mode==="review"&&!pending().length){question=null;changePage("review");notify("错题队列已完成");}else next();},1250);}
function unsure(){if(!question)return;const pr=p(),old=pr.review[question.id]||{pending:false,wrong:0,wins:0,due:0,note:"",unsure:false};pr.review[question.id]={...old,pending:true,unsure:true,wins:0,lastPassTurn:null,due:pr.attempts+2,note:String($("note")?.value||old.note||"").slice(0,800)};pr.lastSeen[question.id]=pr.attempts;persist();if(!feedback)feedback="unsure";draw();notify("已加入错题队列");}
function memo(){if(!question)return;const pr=p(),old=pr.review[question.id]||{pending:false,wrong:0,wins:0,due:0,note:"",unsure:false};pr.review[question.id]={...old,note:String($("note")?.value||"").slice(0,800)};persist();notify("笔记已保存在这个浏览器");}
function drawQuiz(){const root=$("quiz");root.replaceChildren();if(!bank().questions.length){root.append(empty("等待正式考试题库","网站已搭建完成。等你之后发送 ZIP 再导入正式题目。现在可以先体验演示题。","体验示范题",()=>{choose("demo");start();}));return;}if(!question){root.append(empty("准备开始练习了吗？","题目和答案位置每次都会随机变化。答错或不懂的题目会进入复习队列。","开始随机练习",()=>next()));return;}const top=e("div","group");top.style.justifyContent="space-between";top.append(e("span","label",data.selected==="demo"?"DEMO · 演示题":mode==="review"?"REVIEW · 错题专项":"PRACTICE · 随机练习"),e("span","meta","已回答 "+p().attempts+" 次 · 共 "+bank().questions.length+" 题"));root.append(top,e("h3","question",question.question),e("p","hint",question.correctAnswers.length>1?"请选择 "+question.correctAnswers.length+" 个正确答案再提交。":"请选择一个答案，系统将立即批改。"));const opts=e("div","answers");question.display.forEach((text,i)=>{const b=button("","answer",()=>{if(feedback)return;if(question.correctAnswers.length===1){selected=new Set([text]);correct();}else{if(selected.has(text))selected.delete(text);else if(selected.size<question.correctAnswers.length)selected.add(text);draw();}});b.disabled=Boolean(feedback);b.setAttribute("aria-pressed",String(selected.has(text)));if(selected.has(text))b.classList.add("selected");if(feedback&&question.correctAnswers.includes(text))b.classList.add("good");else if(feedback&&selected.has(text))b.classList.add("bad");b.append(e("span","letter",String.fromCharCode(65+i)),e("span","",text));opts.append(b);});root.append(opts);
if(feedback){const wrong=feedback!=="yes",f=e("div","result"+(wrong?" wrong":""));f.append(e("b","",wrong?"✕ 需要巩固这道题":"✓ 回答正确！"),e("p","","正确答案："+question.correctAnswers.join("、")),e("p","",question.explanation||"暂时没有经过核实的解释。"));if(wrong){const ta=e("textarea");ta.id="note";ta.maxLength=800;ta.placeholder="我不理解的地方（选填）";ta.value=p().review[question.id]?.note||"";f.append(ta);const actions=e("div","group");actions.append(button("我不理解 · 加强复习","secondary",unsure),button("保存笔记","linkbutton",memo),button("下一道随机题 →","primary",()=>{if(mode==="review"&&!pending().length){question=null;changePage("review");}else next();}));f.append(actions);}else f.append(e("p","hint","即将自动进入下一道随机题…"));root.append(f);}
const bottom=e("div","bottom");bottom.append(e("span","muted","错题会在之后随机出现，也可以进入错题专项。"));if(!feedback){const actions=e("div","group");if(question.correctAnswers.length>1){const b=button("提交答案 →","primary",correct);b.disabled=selected.size!==question.correctAnswers.length;actions.append(b);}actions.append(button("我不懂 · 显示答案","linkbutton",unsure));bottom.append(actions);}root.append(bottom);
}
function drawReview(){const root=$("review-list");root.replaceChildren();const ids=pending(),lookup=new Map(bank().questions.map(q=>[q.id,q]));$("start-review").disabled=!ids.length;if(!ids.length){root.append(empty("目前没有错题","答错或标记不懂的题目会加入这里。","回到练习",()=>changePage("practice")));return;}ids.forEach(id=>{const q=lookup.get(id),r=p().review[id],box=e("div","reviewcard"),left=e("div");left.append(e("b","",q.question),e("p","","答错 "+r.wrong+" 次 · 正确复习 "+r.wins+"/2 次"+(r.note?" · 有笔记":"")));box.append(left,e("span","pill",r.unsure?"不理解":"待复习"));root.append(box);});}
function drawLibrary(){$("repeat-threshold").value=String(data.repeatThreshold||70);$("repeat-value").textContent=String(data.repeatThreshold||70)+"%";$("bank-size").textContent=EMPTY.questions.length+" 道题"+(EMPTY.questions.length?"":" · 等待 ZIP");$("choose-default").classList.toggle("active",data.selected==="default");$("choose-demo").classList.toggle("active",data.selected==="demo");$("library-summary").textContent="当前： "+(data.selected==="demo"?"演示题":data.selected==="custom"?"本机导入的自定义题库":"网站正式题库")+"（"+bank().questions.length+" 题）";}
function draw(){stats();if(page==="practice")drawQuiz();if(page==="review")drawReview();if(page==="library")drawLibrary();}
async function readFile(input){const file=input.files?.[0];input.value="";if(!file)return null;if(file.size>4000000)throw Error("文件超过 4MB");return JSON.parse(await file.text());}
function exportFile(name,content){const blob=new Blob([JSON.stringify(content,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>changePage(b.dataset.page)));
$("new-question").addEventListener("click",()=>{mode="all";next();});
$("start-review").addEventListener("click",()=>start("review"));
$("choose-default").addEventListener("click",()=>choose("default"));
$("choose-demo").addEventListener("click",()=>choose("demo"));
$("export-progress").addEventListener("click",()=>exportFile("life-uk-progress.json",{format:"life-uk-backup-v1",data}));
$("import-bank").addEventListener("change",async event=>{try{const raw=await readFile(event.target);if(!raw)return;const b=validate(raw);if(!b.questions.length)throw Error("题库不能为空");data.custom=b;choose("custom");$("import-status").textContent="成功导入 "+b.questions.length+" 道题，仅此浏览器可用";}catch(err){$("import-status").textContent="失败："+err.message;}});
$("import-progress").addEventListener("change",async event=>{try{const raw=await readFile(event.target);if(!raw||raw.format!=="life-uk-backup-v1")throw Error("备份格式不匹配");const val=raw.data;if(!val||!val.byBank||!["default","demo","custom"].includes(val.selected))throw Error("备份无效");if(val.custom)val.custom=validate(val.custom);data={...blank(),...val};if(data.selected==="custom"&&!data.custom)data.selected="default";question=null;feedback=null;persist();changePage("practice");notify("学习记录已恢复");}catch(err){notify("恢复失败："+err.message);}});
$("repeat-threshold").addEventListener("input",event=>{
 data.repeatThreshold=Number(event.target.value);persist();$("repeat-value").textContent=data.repeatThreshold+"%";
});
changePage("practice");
