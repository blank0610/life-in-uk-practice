import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {resolve,join} from "node:path";
import {pathToFileURL} from "node:url";
import {loadQuestionBank} from "./audit-question-bank.mjs";
import {fullAuditSweep} from "./full-bank-audit.mjs";
import {additionalQuestions} from "../site/data/additional-questions.js";

// The scheduled runner scans the actual merged website bank, not remote JSON chunks.
// Evidence is independent from the sequential/manual ledger.
export function scheduledAudit(ledger,questions,{additionalIds=[],checkedAt=null,sourceSha=null,workflowRunId=null,event=null}={}){
 const report=fullAuditSweep(ledger,questions,{checkedAt,sourceSha});
 const added=new Set(additionalIds),newCount=report.records.filter(r=>added.has(r.id)).length;
 return {...report,workflowRunId,event,sourceCounts:{original:report.scannedCount-newCount,additional:newCount}};
}
export function auditSummary(report){
 const {records,...summary}=report;
 return {...summary,findings:(records||[]).filter(r=>r.findings.length).map(({id,sourceScreenshot,findings})=>({id,sourceScreenshot,findings}))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const output=process.argv[2];if(!output)throw Error("需要独立审核报告输出目录");
 const target=resolve(output),protectedDir=resolve("development");
 if(target===protectedDir||target.startsWith(protectedDir+"/"))throw Error("不得覆盖开发主账目录");
 mkdirSync(target,{recursive:true});
 const metadata={checkedAt:new Date().toISOString(),sourceSha:process.env.GITHUB_SHA||null,workflowRunId:process.env.GITHUB_RUN_ID||null,event:process.env.GITHUB_EVENT_NAME||null};
 let ledger,report;
 try{
  ledger=JSON.parse(readFileSync("development/QUESTION_AUDIT_PROGRESS.json","utf8"));
  report=scheduledAudit(ledger,loadQuestionBank(),{...metadata,additionalIds:additionalQuestions.map(q=>q.id)});
 }catch(error){
  report={schemaVersion:1,...metadata,expectedCount:ledger?.bankCount??null,scannedCount:0,uniqueIdCount:0,complete:false,checkMode:"rule_based",imageComparedCount:0,originalImagesAvailable:false,manualTextReviewedCount:0,sourceCounts:{original:0,additional:0},severeCount:null,flaggedCount:null,records:[],error:String(error),unprocessedScope:"full_bank",unprocessedIds:null,unprocessedBatches:null};
 }
 const summary=auditSummary(report);
 writeFileSync(join(target,"FULL_BANK_AUDIT_LATEST.json"),JSON.stringify(report,null,2)+"\n");
 writeFileSync(join(target,"FULL_BANK_AUDIT_SUMMARY.json"),JSON.stringify(summary,null,2)+"\n");
 const {findings,...compact}=summary;
 console.log("FULL_BANK_AUDIT "+JSON.stringify(compact));
 if(!report.complete||report.severeCount)process.exitCode=1;
}
