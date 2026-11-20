# Life in the UK · 按题号逐题审核、保存 GitHub 进度、完成后重查

**独立项目：** \`blank0610/life-in-uk-practice\`。不能访问或影响 Stock AI 2 的任何自动任务、仓库或文件。

## 用户要求

按截图题号逐条审核全部 **487 道网站题目**：核查完整英文题干、全部选项、正确答案、解释与 OCR 异常符号。每次完成的题号和状态必须写入本仓库，然后下一小时从上次结束的位置继续，不能只反复复查已经修好的题。全部 487 道走完一轮后，归档原轮审核结果并从第一个题号重开下一轮。

## 文件与规则

- 进度主账：\`development/QUESTION_AUDIT_PROGRESS.json\`，包含 \`round\`（第几轮）、\`nextIndex\`（下个题在按来源截图编号排序的题库中的下标）、\`checkedThisRound\`（本轮逐题审核记录）、\`completedRounds\`（历史轮次）。
- 审核程序：\`node scripts/audit-next-batch.mjs\`。默认**不写进度**，按原始截图编号从小到大打印下一批 **12 道**完整题干、选项、正确答案、解释与明显 OCR 异常。每道都单独审核；其他题不能直接批量标为已核实。
- **检查完成后**可以执行 \`node scripts/audit-next-batch.mjs --write\` 生成本地更新，并将更新的进度账提交到 GitHub。不能仅因为运行自动扫描或 GitHub CI 成功就自动提交完成记录。
- 当完成第 487 道时，脚本生成 \`development/audit-history/round-XXX.json\` 逐题归档，进度账的 \`round\` 加 1 并 \`nextIndex\` 归零；**先提交归档，再进入下轮**。
- 每次更新审核进度须由独立巡检任务提交可追踪的 GitHub Commit（或 PR）；提交消息说明「第几轮、题号范围、需人工复核多少道」，有新错误时另记录 Issue 或 PR。
- 逐条检查内容：题目语法和拼写、明显 OCR 丢字、专有名词、标点符号、图片解答框误混为选项、异常百分比、答案与解释是否合理；遇到现行法律、历史、日期要进一步查权威资料。不能因为题干不自然就重写原图正确文字。

## 照片来源的限制，必须如实记录

原始 509 张截图在用户上传的 ZIP 里，**目前未存储在 GitHub 仓库**，因此每小时执行的自动任务不一定能取得这些截图。

**记录用词不可混淆：**

- \`text_screened_photo_unavailable\`：已逐题检查 GitHub 网站实际显示的文本、选项和答案，但**没有原始截图的视觉证据**。
- \`needs_review\`：文本出现明显识别风险，需与原图对照或查证事实。
- \`visually_checked\`：当轮确实打开对应的原始照片，并逐字核对题干、全部选项、高亮正确答案与解释；必须给出截图编号和可查证依据。**不能只因旧修订记录存在就声称已看图。**

如果无法取得图片或无法执行逐题审查，保持 \`nextIndex\` 不变，记录阻碍，切勿伪造审核完成。如果对照到图中也有错误，不可盲目照抄，应核实权威资料后记录修改依据。

## 和练习复习调度无关

这个 GitHub 自动巡检用于检查网站题库文字和答案，与普通练习「每次随机抽题：70%普通题、30%错题／收藏题（可调整）」的用户本机学习调度完全独立，不会读取任何人的私人学习笔记。

## 自动任务可直接读取的题目资料（解除压缩题库读取阻碍）

每次 GitHub Pages 部署时，`scripts/export-audit-batches.mjs` 会读取网站**已经应用 OCR/拼写修正的完整 487 道题**，按原始截图编号排序，导出公开的纯 JSON 分包到部署站点。每包 12 题，包含 id、截图编号、完整题干、选项、正确答案及解释。**这是文字资料，不是原图截图。**

- 总目录：`https://blank0610.github.io/life-in-uk-practice/data/audit-batches/manifest.json`。
- 本轮下一批（正式进度 nextIndex=24）：`https://blank0610.github.io/life-in-uk-practice/data/audit-batches/batch-003.json`。
- 按 `development/QUESTION_AUDIT_PROGRESS.json` 的 `nextIndex` 在 manifest 的 `fromIndex` / `toIndexExclusive` 范围内查找文件；不要假定上一轮索引不变。分包 JSON 直接展示该批每道题的完整文本、答案和解释，不需要在自动任务里解压 b64。
- 如果公开链接因网络问题暂时不可访问，可通过 GitHub Actions 的部署构建日志确认生成成功，或查看脚本与源文件；不能因为网页部署成功就自动标记已检查。
- `audit-batches` 只由部署构建生成，**不是个人学习记录**；没有答题历史、学习笔记或私人数据。自动任务逐题核对内容后，仍须按原有方法将证据写回 GitHub 审核进度账。

注意：即使现在能够阅读全部题目文字，也只有**确实打开原始照片、逐字核对题目／选项／正确答案／解释**的题才能记录 `visually_checked`；只有文字资料就必须标注 `text_screened_photo_unavailable`。

## 审核资料同步进入 GitHub 仓库

除了 GitHub Pages 上的 JSON 分包，仓库本身也通过 `.github/workflows/publish-audit-data.yml` 自动保存同一批完整的可读题目：

- 目录：`development/audit-readable/manifest.json`。
- 每包 12 题：`development/audit-readable/batch-001.json`、`batch-002.json`、`batch-003.json` 等。
- 读取步骤：先看 `development/QUESTION_AUDIT_PROGRESS.json` 的 `nextIndex`，再从 `manifest.json` 中寻找对应分包的 `fromIndex`、`toIndexExclusive`。下一题目前为 `zip-42`，属于 `batch-003.json`。以后不要硬编码这个索引。
- 每个分包保留实际出现在网站上的英文题干、全部选项、正确答案和解释，能直接使用 GitHub 文件读取工具访问，不必解码压缩题库，也无需读取 GitHub Actions 日志。
- 来源题库改变时自动重新生成并提交相同的仓库内可读文件；分包只含公开的测试练习题，不含答题历史、私人笔记或个人资料。
- **文字初检不等于原图核查：** 原始 ZIP 没有持续可读取的 GitHub 影像源；未逐张亲自看图时不得标记 `visually_checked`。

