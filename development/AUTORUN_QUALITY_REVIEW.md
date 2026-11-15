# Life in the UK · 独立题库自动审查（Auto Run）

## 使用者授权
一个专属 ChatGPT Auto Run（不是 GitHub Actions 的额外定时工作流），每天检查 **blank0610/life-in-uk-practice**，维护题库的英文拼写与内容一致性。

## 只允许的项目
- 仓库：`blank0610/life-in-uk-practice`
- 默认读取：`main` 目前网站代码、487 道 ZIP 截图题的数据和校对记录、最近 PR / Issues / Actions。
- **严禁访问、修改、重启或复用 Stock AI 2 的任意 Auto Run、GitHub 仓库、Issue、分支、配置或工作流。**

## 每次审查
1. 读取 `README.md`、`development/SECOND_SPELLING_REVIEW_2026-11-15.md`、`site/data/questions.js`、`site/data/recheck-2026-11-15.b64`、`site/data/spelling-fixes.js`、`site/assets/quality-fixes.js`、测试文件。
2. 运行/检查现有自动测试结果并验证 487 题的选项、正确答案与解释。
3. 搜寻新拼写 / OCR 漏字、错误的地名人名、题目问法不通、答案与说明不对应、年份/制度陈旧等。
4. 有原始截图可以读取时，优先与原图交叉确认；对需要时效性的事实，查询可靠来源，**不能把自动扫字等同逐图人工验真**。
5. 去重现有 Issues。确认的错字可在本仓库另开分支、提交 PR 和测试结果；有不确定性只开/更新 Issue，绝不猜答案或未经核实直接改动 `main`。
6. 仅在有新的重要发现、已修复问题、测试失败或需要使用者行动时通知；其余时间不打扰。

## 启用状态
- 一个独立 ChatGPT 任务，2026-11-16 启用。
- 排程：每日（Europe/London）；由 ChatGPT 管理，不作为本仓库新定时 GitHub Actions 工作流运行。
- 现有 GitHub CI 在代码更动和 PR 时继续执行，不算另一个定时 Auto Run。
- 此任务的执行不保证每天自动修正错字；遇到未经核实的截图内容须留待审查。

## 来源题目
- 当前发布题库：487 道，来自用户 ZIP 截图。
- 已有两轮文字纠错记录，累计 80 个截图题号。
- 不能声称所有题均完成 100% 人工校验。

本文件只记录 Life in the UK 的独立工作方式。