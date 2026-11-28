# Life in the UK · 按题号逐题审核、保存 GitHub 进度、完成后重查

**独立项目：** \`blank0610/life-in-uk-practice\`。不能访问或影响 Stock AI 2 的任何自动任务、仓库或文件。

## 用户指定的最终边界：只核对拼写和原图

- 每小时只检查文字转录有没有拼写、OCR、符号、漏字、选项混入解释等问题；有原始截图时必须逐字与截图比对。
- 英语句子、提问角度、答案、解释只要与原图一致，就不得改写，**尤其不能通过扩写题目泄露正确选项**。
- 不使用搜索引擎或外部资料“提升准确度”，不核查历史/法律/日期的外部事实；这不是题目知识更新任务。
- 原图不可访问时，明确写“文字初检，图片未核对”，疑似问题记入待核查列表，不能擅自更改。

## 用户要求

用户于 2026-11-28 明确要求每次 Auto Run 均从第一题检查整个正式题库，数量从最新 bankCount 与 manifest 动态读取。每次实际读取全部分包并检查全部题干、选项、答案及解释；12 仅为分包大小，不是运行上限。全库规则扫描与真实逐题/原图审核主账独立：旧顺序审核进度和历史归档保留，只有实际完成逐题审核才可推进旧游标，完成一轮后归档。

## 文件与规则

- 进度主账：\`development/QUESTION_AUDIT_PROGRESS.json\`，包含 \`round\`（第几轮）、\`nextIndex\`（下个题在按来源截图编号排序的题库中的下标）、\`checkedThisRound\`（本轮逐题审核记录）、\`completedRounds\`（历史轮次）。
- 审核程序：\`node scripts/audit-next-batch.mjs\`。默认（仅供顺序逐题证据复核）**不写进度**，按原始截图编号从小到大打印下一批由 batchSize 指定的完整题干、选项、正确答案、解释与明显 OCR 异常。每道都单独审核；其他题不能直接批量标为已核实。
- **检查完成后**可以执行 \`node scripts/audit-next-batch.mjs --write\` 生成本地更新，并将更新的进度账提交到 GitHub。不能仅因为运行自动扫描或 GitHub CI 成功就自动提交完成记录。
- 当完成当轮全部题目时，脚本生成 \`development/audit-history/round-XXX.json\` 逐题归档，进度账的 \`round\` 加 1 并 \`nextIndex\` 归零；**先提交归档，再进入下轮**。
- 每次更新审核进度须由独立巡检任务提交可追踪的 GitHub Commit（或 PR）；提交消息说明「第几轮、题号范围、需人工复核多少道」，有新错误时另记录 Issue 或 PR。
- **唯一检查范围：** 检查网站题干、所有选项、正确答案和解释的拼写、OCR 误字、漏字、异常符号，并在能访问原始 ZIP 截图时与图片逐字比对。网站随机打乱选项排列不算错误。**不查外部资料、不验证历史法律事实、不润色英语、不重写提问句式、不增删答案线索。**截图确认的差异只能执行最小字符修改。

## 照片来源的限制，必须如实记录

原始 509 张截图在用户上传的 ZIP 里，**目前未存储在 GitHub 仓库**，因此每小时执行的自动任务不一定能取得这些截图。

**记录用词不可混淆：**

- \`text_screened_photo_unavailable\`：已逐题检查 GitHub 网站实际显示的文本、选项和答案，但**没有原始截图的视觉证据**。
- \`needs_review\`：发现疑似拼写、OCR 或图文不一致，尚需原始截图确认；不能自行用常识重写。
- \`visually_checked\`：当轮确实打开对应的原始照片，并逐字核对题干、全部选项、高亮正确答案与解释；必须给出截图编号和可查证依据。**不能只因旧修订记录存在就声称已看图。**

如果无法取得图片，可以按顺序完成真实的**文字拼写/OCR 疑点初检**，并逐题记录 \`text_screened_photo_unavailable\`、\`imageCompared=false\`；不可标为已与截图核对。若连完整题目文字都无法取得，则保持 \`nextIndex\` 不变并记录阻碍。若图片本身文字可疑，**保持原文并标记待用户核实**，不可搜索外部来源、重写或添加提示。

## 和练习复习调度无关

这个 GitHub 自动巡检用于检查网站题库文字和答案，与普通练习「每次随机抽题：70%普通题、30%错题／收藏题（可调整）」的用户本机学习调度完全独立，不会读取任何人的私人学习笔记。

## 自动任务可直接读取的题目资料（解除压缩题库读取阻碍）

每次 GitHub Pages 部署时，`scripts/export-audit-batches.mjs` 会读取网站**已经应用 OCR/拼写修正的完整正式题库**，按原始截图编号排序，导出公开的纯 JSON 分包到部署站点。每包 12 题，包含 id、截图编号、完整题干、选项、正确答案及解释。**这是文字资料，不是原图截图。**

- 总目录：`https://blank0610.github.io/life-in-uk-practice/data/audit-batches/manifest.json`。
- 按 `development/QUESTION_AUDIT_PROGRESS.json` 的 `nextIndex` 在 manifest 的 `fromIndex` / `toIndexExclusive` 范围内查找文件；不要假定上一轮索引不变。分包 JSON 直接展示该批每道题的完整文本、答案和解释，不需要在自动任务里解压 b64。
- 如果公开链接因网络问题暂时不可访问，可通过 GitHub Actions 的部署构建日志确认生成成功，或查看脚本与源文件；不能因为网页部署成功就自动标记已检查。
- `audit-batches` 只由部署构建生成，**不是个人学习记录**；没有答题历史、学习笔记或私人数据。自动任务逐题核对内容后，仍须按原有方法将证据写回 GitHub 审核进度账。

注意：即使现在能够阅读全部题目文字，也只有**确实打开原始照片、逐字核对题目／选项／正确答案／解释**的题才能记录 `visually_checked`；只有文字资料就必须标注 `text_screened_photo_unavailable`。

## 审核资料同步进入 GitHub 仓库

除了 GitHub Pages 上的 JSON 分包，仓库本身也通过 `.github/workflows/publish-audit-data.yml` 自动保存同一批完整的可读题目：

- 目录：`development/audit-readable/manifest.json`。
- 每包 12 题：`development/audit-readable/batch-001.json`、`batch-002.json`、`batch-003.json` 等。
- 读取步骤：先看 `development/QUESTION_AUDIT_PROGRESS.json` 的 `nextIndex`，再从 `manifest.json` 中寻找对应分包的 `fromIndex`、`toIndexExclusive`。每轮的下一批均以当前主账和分包目录为准，不得固定题号或索引。
- 每个分包保留实际出现在网站上的英文题干、全部选项、正确答案和解释，能直接使用 GitHub 文件读取工具访问，不必解码压缩题库，也无需读取 GitHub Actions 日志。
- 来源题库改变时自动重新生成并提交相同的仓库内可读文件；分包只含公开的测试练习题，不含答题历史、私人笔记或个人资料。
- **文字初检不等于原图核查：** 原始 ZIP 没有持续可读取的 GitHub 影像源；未逐张亲自看图时不得标记 `visually_checked`。


## 扩容规则（Test 20–40）
- 原有题目 ID 与历史轮次归档不变；新增题按来源截图号追加，使用主账 bankCount 和 batchSize 动态计算分包及结束条件。历史归档保留其当时题库数量。
- 追加前验证已审核 ID 序列仍等于新题库排序后的前 nextIndex 道，确保原有审核不跳题、不重置。
- 现有 Auto Run 继续按主账顺序执行，新增题从本轮尾部自然进入；导入核对不得虚增顺序审核数量。不得创建重复任务。

### 新增原图按文件夹处理
用户要求新增题统一进入同一个现有练习题库，按原 ZIP 文件夹与截图编号连续核对、追加，不按 Test 套数分组或等待整套完成。`development/IMPORT_TESTS_20_40.md` 记录文件夹处理边界、跳过原因及下一截图；sourceTest/sourceQuestion 仅用于证据溯源。此导入流程与正式每小时顺序巡检独立。

### 两个扩容 ZIP 已完成
全源截图处理记录见 `IMPORT_TESTS_20_40.md` 及 `IMPORT_REMAINING_SOURCE_COVERAGE.json`。永久巡检每次全库扫描从第一题开始，既有顺序逐题审核轮次和游标不重置。导入核对、自动重复图检测不计入巡检逐题状态。

## 2026-11-28：每小时全库审核（取代旧每小时 12 道限制）
- 现有 ChatGPT Auto Run 已更新，保持每小时执行、独立项目隔离，不创建其他定时任务。每次固定最新 main SHA，读取主账和 manifest 的全部分包，验证唯一 ID、题数、分包边界，再扫描所有题目。从第一题开始，不以 nextIndex 限制全库扫描。
- `node scripts/audit-next-batch.mjs --full --output development/FULL_BANK_AUDIT_LATEST.json --source-sha <SHA>` 可执行完整规则扫描并生成独立报告。无 Node 环境时通过 GitHub 分包逐个读取后实际执行等价检查。规则扫描只识别可疑模式，不代表完整拼写正确或人工原图核验。
- 每次记录 checkedAt、sourceSha、expectedCount、scannedCount、uniqueIdCount、complete、checkMode、records、未处理 IDs/分包，以及原图是否可访问和核对数量。缺少数据时 complete=false，不虚报；通过 CI 且无冲突再合并。旧顺序审核账不因自动规则扫描而推进。只有真实逐题审阅的连续记录才更新其 nextIndex；只有实际看图才标记 visually_checked。
- 不外查事实，不重写题目、不猜答案。保留已有原始截图核对限制。只在发现新问题、已修复问题、扫描覆盖不完整或需用户行动时通知。

## D011：实际全库规则扫描由 GitHub Actions 执行
此前每小时 ChatGPT 任务读取完整分包失败，最近实际扫描为0。现在 .github/workflows/full-bank-audit.yml 每小时直接运行 scripts/hourly-full-bank-audit.mjs，固定当前提交 SHA，动态加载完整合并题库并生成覆盖记录。工作流同时保存报告产物与 audit-reports 分支中的 development/FULL_BANK_AUDIT_LATEST.json 和 FULL_BANK_AUDIT_SUMMARY.json。ChatGPT Auto Run 读取该分支最新摘要及对应运行状态、复核疑点并在有原图证据时最小修复。报告必须匹配本次运行ID、SHA、动态题数和唯一ID；失败或过时不得宣称全库完成。规则扫描不替代逐题或原图审核；不推进顺序人工审核主账。原有每小时任务不重复创建，旧规则中要求每次由 ChatGPT 自行读全部分包的执行方式由此取代。原图和事实核查限制不变。
