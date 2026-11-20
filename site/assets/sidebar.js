// 左侧菜单单独保存显示状态，不干扰题库、答题进度、收藏或笔记。
export const SIDEBAR_STORAGE_KEY="life-uk-sidebar-hidden-v1";

export function getSavedSidebarState(storage,key=SIDEBAR_STORAGE_KEY){
  try{return storage?.getItem(key)==="1";}
  catch{return false;} // 浏览器阻止 localStorage 时仍可临时收起。
}
export function saveSidebarState(storage,hidden,key=SIDEBAR_STORAGE_KEY){
  try{storage?.setItem(key,hidden?"1":"0");}
  catch{/* 私隐浏览等限制：本次页面仍正常使用 */ }
}
export function applySidebarState({layout,sidebar,button,label},hidden){
  layout.classList.toggle("sidebar-collapsed",Boolean(hidden));
  button.setAttribute("aria-expanded",String(!hidden));
  button.setAttribute("aria-label",hidden?"展开左侧菜单":"收起左侧菜单");
  button.title=hidden?"展开左侧菜单":"收起左侧菜单";
  label.textContent=hidden?"展开菜单":"收起菜单";
  sidebar.setAttribute("aria-hidden",String(Boolean(hidden)));
  sidebar.inert=Boolean(hidden); // 已收起的导航不再接收键盘焦点，展开后恢复。
}
export function setupSidebar({root=globalThis.document,storage=globalThis.localStorage}={}){
  if(!root)return null;
  const layout=root.querySelector(".layout");
  const sidebar=root.querySelector("#sidebar-nav");
  const button=root.querySelector("#sidebar-toggle");
  const label=root.querySelector("#sidebar-toggle-label");
  if(!layout||!sidebar||!button||!label)return null;
  const nodes={layout,sidebar,button,label};
  let hidden=getSavedSidebarState(storage);
  applySidebarState(nodes,hidden);
  button.addEventListener("click",()=>{
    hidden=!hidden;
    applySidebarState(nodes,hidden);
    saveSidebarState(storage,hidden);
  });
  return {isHidden:()=>hidden};
}
if(typeof document!=="undefined")setupSidebar({root:document,storage:window.localStorage});
