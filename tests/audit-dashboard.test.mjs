import test from "node:test";
import assert from "node:assert/strict";
import {describeAuditStatus,summarizeAudit,auditPullRequests} from "../site/assets/audit-dashboard.js";
test("区分主分支审核、原图对照和待复核问题",()=>{
  const summary=summarizeAudit({round:2,bankCount:487,nextIndex:25,
    checkedThisRound:[
      {status:"visually_checked",imageCompared:true},
      {status:"text_screened_photo_unavailable",imageCompared:false},
      {status:"needs_review",findings:["问题缺少解释"],imageCompared:false}
    ]});
  assert.equal(summary.merged,25);
  assert.equal(summary.photoCompared,1);
  assert.equal(summary.flagged,1);
  assert.equal(summary.round,2);
  assert.equal(describeAuditStatus("text_screened_photo_unavailable"),"文字初检 · 原图待核");
});
test("GitHub已合并审核与待合并PR必须分开，非题库PR不应充数",()=>{
  const arr=auditPullRequests([
    {title:"逐题巡检第1轮：第13–24题",state:"open"},
    {title:"修复 #316 选项",state:"closed",merged_at:"2026-11-19"},
    {title:"Update colors",state:"closed"},
  ]);
  assert.equal(arr.length,2);
  assert.equal(arr.filter(x=>x.state==="open").length,1);
  assert.equal(arr.filter(x=>x.merged_at).length,1);
});
