import test from "node:test";
import assert from "node:assert/strict";
import {createPracticeToolbar} from "../site/assets/practice-toolbar.js";
import {readFileSync} from "node:fs";
function documentStub(){
 return {createElement(tag){return {tag,children:[],attrs:{},events:{},textContent:"",className:"",append(...nodes){this.children.push(...nodes)},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,v){this.events[k]=v},click(){if(!this.disabled)this.events.click?.()}}}};
}
test("历史与当前题共享同一按钮节点、顺序及下一题文字，朗读收藏指向显示题",()=>{
 const calls=[],q={id:"current"},old={id:"old"};
 const t=createPracticeToolbar({document:documentStub(),onSpeak:r=>calls.push(["speak",r.id]),onStop:()=>calls.push(["stop"]),onPrevious:()=>calls.push(["previous"]),onSave:id=>calls.push(["save",id]),onNext:()=>calls.push(["next"])});
 t.update({question:q,speakingSupported:true,canPrevious:true});
 const buttons=t.element.children.slice(0,5),labels=buttons.map(x=>x.textContent);
 assert.deepEqual(labels,["🔊 朗读题目与全部选项","■ 停止朗读","← 上一题","☆ 收藏稍后复习","下一题 →"]);
 buttons[0].click();buttons[3].click();buttons[2].click();
 t.update({question:old,speakingSupported:true,canPrevious:false,inHistory:true,returnsToCurrent:true});
 assert(t.element.children.slice(0,5).every((x,i)=>x===buttons[i]));
 assert.deepEqual(buttons.map(x=>x.textContent),labels);
 assert.equal(buttons[2].disabled,true);assert.equal(buttons[4].title,"返回当前练习题");
 buttons[0].click();buttons[3].click();buttons[4].click();
 assert.deepEqual(calls,[["speak","current"],["save","current"],["previous"],["speak","old"],["save","old"],["next"]]);
 t.update({question:q,saved:true,speakingSupported:false,canPrevious:true});
 assert.equal(buttons[0].disabled,true);assert.equal(buttons[3].attrs["aria-pressed"],"true");assert.equal(buttons[4].title,"抽取下一道随机题");
});
test("练习与回看共享持久 frame，历史不建立第二套顶栏",()=>{
 const app=readFileSync("site/assets/app.js","utf8");
 assert.equal((app.match(/createPracticeToolbar\(\{/g)||[]).length,1);
 const history=app.slice(app.indexOf("function drawHistory(root,record)"),app.indexOf("let practiceFrame=null"));
 assert(!history.includes("voice-controls"));
 assert(app.includes("root.contains(practiceFrame.header)"));
 assert(app.includes("if(record){drawHistory(root,record);return;}"));
 assert(app.includes("if(historyIndex!==null){forwardHistory();return;}"));
 assert(app.includes('inPractice:page==="practice"&&historyIndex===null'));
});
