// 从独立公开的 GitHub 仓库实时读取逐题质检账，既不读取个人学习记录也不泄露用户笔记。
// 明确区分：已合并的主分支审核、审核中的 PR、用户请求的个别截图核对。
export const describeAuditStatus=status=>({
  visually_checked:"原图逐字核验",
  text_screened_photo_unavailable:"文字初检 · 原图待核",
  needs_review:"发现疑点 · 待复核"
})[status]||"状态待确认";

export function summarizeAudit(ledger){
  const entries=Array.isArray(ledger?.checkedThisRound)?ledger.checkedThisRound:[];
  const reviewed=entries.filter(x=>x?.imageCompared===true&&x?.status==="visually_checked").length;
  const flagged=entries.filter(x=>x?.status==="needs_review"||(x?.findings||[]).length).length;
  return {round:Number(ledger?.round)||1,total:Number(ledger?.bankCount)||0,
    merged:Math.max(0,Number(ledger?.nextIndex)||0),photoCompared:reviewed,flagged,entries};
}
export function auditPullRequests(pulls=[]){
  return pulls.filter(p=>p&&(/审核|巡检|审查|校对|OCR|题库|截图|audit|spell|quality|修复|修正|恢复/i.test(p.title||"")))
    .slice(0,12);
}
const make=(tag,cls="",value="")=>{
  const node=document.createElement(tag);if(cls)node.className=cls;if(value)node.textContent=value;return node;
};
const addLink=(parent,url,label)=>{
  const a=make("a","audit-link",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";parent.append(a);return a;
};
const url=(repo,path)=>"https://github.com/"+repo+"/"+path;
async function readPublicJson(path){
  const r=await fetch(path,{cache:"no-store",headers:{"Accept":"application/vnd.github+json"}});
  if(!r.ok)throw Error("HTTP "+r.status);
  return r.json();
}
const humanDate=value=>{
  if(!value)return "尚未登记";
  const date=new Date(value);
  return Number.isFinite(date.getTime())?date.toLocaleString("zh-CN",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"日期未知";
};
function showChecks(target,rows,title,empty){
  const section=make("section","audit-section");
  section.append(make("h3","",title));
  if(!rows.length){section.append(make("p","muted",empty));target.append(section);return;}
  const table=make("div","audit-records");
  rows.slice().reverse().forEach(entry=>{
    const item=make("article","audit-entry");
    const head=make("div","audit-entry-head");
    head.append(make("strong","","截图 #"+(entry.sourceScreenshot||entry.id?.replace("zip-","")||"—")));
    const status=make("span","audit-status",describeAuditStatus(entry.status));
    if(entry.status==="needs_review")status.classList.add("audit-warning");
    head.append(status);
    item.append(head);
    const detail=entry.note||entry.summary||"无具体补充";
    item.append(make("p","",detail));
    if(Array.isArray(entry.findings)&&entry.findings.length)item.append(make("p","audit-finding","待核查："+entry.findings.join("；")));
    item.append(make("small","muted",humanDate(entry.checkedAt)));
    table.append(item);
  });
  section.append(table);target.append(section);
}
export async function renderAuditDashboard(target,{repo}={}){
  if(!target||!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo||""))return;
  target.replaceChildren(make("p","muted","正在读取 GitHub 最新审核记录…"));
  const base="https://raw.githubusercontent.com/"+repo+"/main/development/";
  const api="https://api.github.com/repos/"+repo+"/";
  const ledgerResult=await Promise.allSettled([
    readPublicJson(base+"QUESTION_AUDIT_PROGRESS.json?nocache="+Date.now()),
    readPublicJson(api+"pulls?state=all&per_page=30"),
    readPublicJson(api+"commits?path=development%2FQUESTION_AUDIT_PROGRESS.json&per_page=8"),
    readPublicJson(base+"ON_DEMAND_CHECKS.json?nocache="+Date.now())
  ]);
  target.replaceChildren();
  const intro=make("p","muted","这里显示公开 GitHub 的已合并逐题记录，以及待合并的审核请求。页面不会读取你的答题历史或私人笔记。");
  target.append(intro);
  const first=ledgerResult[0];
  if(first.status==="fulfilled"){
    const summary=summarizeAudit(first.value);
    const stats=make("div","audit-stats");
    for(const [label,value] of [
      ["本轮已合并登记",summary.merged+" / "+summary.total],
      ["已对原图核对",String(summary.photoCompared)],
      ["本轮需复核",String(summary.flagged)],
      ["当前轮次",String(summary.round)]
    ]){
      const tile=make("div","audit-stat");tile.append(make("span","muted",label),make("b","",value));stats.append(tile);
    }
    target.append(stats);
    const progress=make("progress","audit-progress");
    progress.max=summary.total||1;progress.value=summary.merged;
    progress.setAttribute("aria-label","GitHub 主分支已合并审核进度");
    target.append(progress);
    target.append(make("p","muted","最近一次主分支登记："+humanDate(first.value.lastCheckedAt)+"（英国时间）；下一批从题库顺序第 "+(summary.merged+1)+" 道开始。"));
    const links=make("div","group");
    addLink(links,url(repo,"blob/main/development/QUESTION_AUDIT_PROGRESS.json"),"查看完整逐题审核账");
    addLink(links,url(repo,"blob/main/development/QUESTION_AUDIT_METHOD.md"),"审核标准");
    target.append(links);
    showChecks(target,summary.entries.slice(-15),"最近已合并的逐题审核","本轮尚无已合并审核记录。");
  }else{
    target.append(make("p","audit-finding","无法读取最新审核进度（"+String(first.reason?.message||"连接失败")+"）。这不代表自动巡检已经停止。"));
    addLink(target,url(repo,"blob/main/development/QUESTION_AUDIT_PROGRESS.json"),"到 GitHub 查看审核账");
  }
  if(ledgerResult[3].status==="fulfilled"){
    const special=ledgerResult[3].value?.checks||[];
    showChecks(target,special.slice(-8),"用户指定题目：额外原图核查","暂无额外核对记录");
  }
  const prSection=make("section","audit-section");
  prSection.append(make("h3","","审核进展、修复与 GitHub 修改记录"));
  const prResult=ledgerResult[1];
  if(prResult.status==="fulfilled"){
    const list=auditPullRequests(prResult.value),pending=list.filter(p=>p.state==="open"),merged=list.filter(p=>p.merged_at);
    if(pending.length){
      prSection.append(make("p","audit-finding","待合并记录 "+pending.length+" 项：这些审核尚未计入正式进度。"));
      for(const p of pending.slice(0,5)){
        const line=make("p","audit-record-link");
        addLink(line,p.html_url||url(repo,"pull/"+p.number),"待合并 #"+p.number+" · "+p.title);
        prSection.append(line);
      }
    }
    for(const p of merged.slice(0,9)){
      const line=make("p","audit-record-link");
      addLink(line,p.html_url||url(repo,"pull/"+p.number),"已合并 #"+p.number+" · "+p.title);
      line.append(make("small","muted"," · "+humanDate(p.merged_at)));
      prSection.append(line);
    }
    if(!pending.length&&!merged.length)prSection.append(make("p","muted","近期没有审核相关的拉取请求。"));
  }else{
    prSection.append(make("p","muted","GitHub 修改列表暂时无法读取，可能是访问次数限制或网络问题。"));
    addLink(prSection,url(repo,"pulls"),"到 GitHub 查看修改请求");
  }
  target.append(prSection);
  const commits=ledgerResult[2];
  if(commits.status==="fulfilled"&&commits.value.length){
    const section=make("section","audit-section");
    section.append(make("h3","","逐题审核进度的 GitHub 提交"));
    commits.value.slice(0,8).forEach(c=>{
      const line=make("p","audit-record-link");
      addLink(line,c.html_url,c.sha.slice(0,7)+" · "+String(c.commit?.message||"审核进度更新").split("\n")[0]);
      line.append(make("small","muted"," · "+humanDate(c.commit?.committer?.date)));
      section.append(line);
    });
    target.append(section);
  }
  target.append(make("p","muted","注意：每小时自动巡检的实际执行时间不能直接由网站读取；这里显示已经写入 GitHub 的记录，不把 CI 成功或待合并分支误算成原图核验。"));
}
