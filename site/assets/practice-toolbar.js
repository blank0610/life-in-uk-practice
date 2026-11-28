// One persistent toolbar for current practice and read-only history.
// Callbacks always target the displayed question, never a stale captured record.
export function createPracticeToolbar({document,onSpeak,onStop,onPrevious,onSave,onNext}){
 const e=(tag,cls,text="")=>{const n=document.createElement(tag);n.className=cls;n.textContent=text;return n;};
 let shown=null;
 const button=(text,cls,action)=>{const b=e("button",cls,text);b.type="button";b.addEventListener("click",action);return b;};
 const element=e("div","group voice-controls practice-toolbar");
 element.setAttribute("role","group");element.setAttribute("aria-label","练习与历史共用控制栏");
 const speak=button("🔊 朗读题目与全部选项","secondary",()=>{if(shown)onSpeak(shown);});
 const stop=button("■ 停止朗读","linkbutton",onStop);
 const previous=button("← 上一题","secondary",onPrevious);
 const save=button("☆ 收藏稍后复习","secondary save-review-button",()=>{if(shown)onSave(shown.id);});
 const next=button("下一题 →","primary",onNext);
 const status=e("div","practice-toolbar-status");
 const support=e("span","muted"),live=e("span","muted");
 live.id="voice-status";live.setAttribute("role","status");live.setAttribute("aria-live","polite");
 status.append(support,live);element.append(speak,stop,previous,save,next,status);
 return {element,update({question,saved=false,canPrevious=false,speakingSupported=false,inHistory=false,returnsToCurrent=false,inSourceTest=false}){
  if(shown!==question)live.textContent="";
  shown=question;
  speak.disabled=!speakingSupported;previous.disabled=!canPrevious;
  save.textContent=saved?"★ 已收藏 · 取消":"☆ 收藏稍后复习";
  save.setAttribute("aria-pressed",String(saved));
  save.title=saved?"取消手动收藏，不删除真正的错题记录":"将这题加入随机复习和错题专项，即使答对也会再次出现";
  next.title=inHistory?(returnsToCurrent?"返回当前练习题":"查看下一条历史作答"):inSourceTest?"下一道原始套题":"抽取下一道随机题";
  next.setAttribute("aria-label",next.title);
  support.textContent=speakingSupported?"优先使用英式英语语音":"此浏览器不支持语音朗读";
 }};
}
