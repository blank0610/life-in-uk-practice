import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {SIDEBAR_STORAGE_KEY,getSavedSidebarState,saveSidebarState,applySidebarState,setupSidebar} from "../site/assets/sidebar.js";

const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
function fakeDom(){
 const set=new Set(),attributes=new Map(),listeners=new Map();
 const layout={classList:{toggle:(name,on)=>on?set.add(name):set.delete(name)},has:name=>set.has(name)};
 const sidebar={setAttribute:(name,value)=>attributes.set("sidebar:"+name,value)};
 const button={setAttribute:(name,value)=>attributes.set(name,value),addEventListener:(event,fn)=>listeners.set(event,fn),title:""};
 const label={textContent:""};
 const parts={".layout":layout,"#sidebar-nav":sidebar,"#sidebar-toggle":button,"#sidebar-toggle-label":label};
 return {root:{querySelector:selector=>parts[selector]},layout,sidebar,button,label,attributes,listeners};
}
test("打开网站默认展示左侧菜单，可点击隐藏并且展开按钮一直在顶部",()=>{
 const dom=fakeDom(),store=new Map();
 const storage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)};
 const controller=setupSidebar({root:dom.root,storage});
 assert.equal(controller.isHidden(),false);
 assert.equal(dom.layout.has("sidebar-collapsed"),false);
 assert.equal(dom.attributes.get("aria-expanded"),"true");
 dom.listeners.get("click")();
 assert.equal(controller.isHidden(),true);
 assert.equal(dom.layout.has("sidebar-collapsed"),true);
 assert.equal(dom.attributes.get("aria-expanded"),"false");
 assert.equal(dom.attributes.get("sidebar:aria-hidden"),"true");
 assert.equal(dom.label.textContent,"展开菜单");
 assert.equal(store.get(SIDEBAR_STORAGE_KEY),"1");
 dom.listeners.get("click")();
 assert.equal(controller.isHidden(),false);
 assert.equal(store.get(SIDEBAR_STORAGE_KEY),"0");
});
test("重新打开页面时恢复上次隐藏状态，不影响其他 localStorage 记录",()=>{
 const dom=fakeDom(),store=new Map([[SIDEBAR_STORAGE_KEY,"1"],["life-uk-practice-v1",'{"attempts":52}']]);
 const storage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)};
 assert.equal(getSavedSidebarState(storage),true);
 setupSidebar({root:dom.root,storage});
 assert.equal(dom.layout.has("sidebar-collapsed"),true);
 assert.equal(store.get("life-uk-practice-v1"),'{"attempts":52}');
});
test("浏览器禁止存储时可继续手动切换菜单",()=>{
 const dom=fakeDom();
 const storage={getItem(){throw Error("blocked")},setItem(){throw Error("blocked")}};
 assert.equal(getSavedSidebarState(storage),false);
 assert.doesNotThrow(()=>{setupSidebar({root:dom.root,storage});dom.listeners.get("click")();});
 assert.equal(dom.layout.has("sidebar-collapsed"),true);
 assert.doesNotThrow(()=>saveSidebarState(storage,true));
});
test("菜单是可读屏、可键盘使用的按钮，隐藏时右侧区域使用全部宽度",()=>{
 assert.match(html,/id="sidebar-nav"/);
 assert.match(html,/id="sidebar-toggle"[^>]*type="button"[^>]*aria-controls="sidebar-nav"[^>]*aria-expanded="true"/);
 assert.match(html,/\.layout\.sidebar-collapsed\s*\{grid-template-columns:minmax\(0,1fr\)\}/);
 assert.match(html,/\.layout\.sidebar-collapsed aside\s*\{display:none\}/);
 assert.match(html,/<script type="module" src="\.\/assets\/sidebar\.js\?v=[^"]+"><\/script>/);
 assert.match(html,/@media\(max-width:850px\)/);
});
