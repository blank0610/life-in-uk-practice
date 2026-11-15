# Life in the UK · Practice Studio

**这是独立于 Stock AI 2 的英国生活考试练习网站。**

## 网站和开发区域

- \`site/\`：GitHub Pages 公共网站（随机抽题、随机打乱答案、自动批改、错题重练、备注、进度本机保存）
- \`development/\`：开发说明、决策、计划。网页部署时不包含此目录
- \`examples/\`：题库文件格式示例
- \`.github/workflows/\`：测试与网站发布
- \`develop\` 分支：未来修改开发区；\`main\` 分支：发布正式网站

## 当前状态

**用户提供的 509 张题目截图中，已经整理出 487 道实际练习题；所有 DEMO 示例题均已从正式网站移除。** 其中 54 道先前遗漏的题目已对照截图人工补回，22 张未计入（重复、未显示答案或受遮挡）；其他题目仍可能存在文字识别误差，不能声称全部逐字百分之百确认。完整范围见 [复核报告](development/RECHECK_REPORT_2026-11-15.md)。此题库并非英国政府官方资料。

## GitHub Pages 发布

新仓库 \`Settings > Pages > Build and deployment > Source\` 选择 \`GitHub Actions\`。本仓库 \`.github/workflows/deploy.yml\` 会在 \`main\` 更新后发布 \`site/\`。

期望地址：<https://blank0610.github.io/life-in-uk-practice/>。以 GitHub Pages 实际部署状态为准。

## 数据安全

进度和私人笔记通过 localStorage 保存在浏览器，不会上传 GitHub，也不会跨设备自动同步。可以导出与恢复 JSON 备份；今后的 ZIP 更新需要核对原始题目、答案与说明后再发布。

未来开发流程与决策： [开发地图](development/ROADMAP.md) / [决策记录](development/DECISIONS.md)。

**硬性隔离：不要写入、重命名、创建分支或 Issue 于 \`stock-news-ai-2\`。**

## 2026-11-15：用户 ZIP 导入与复习调度

- `site/data/questions.js`：含截图题库压缩数据，以及 59 道进一步修改的题目。`site/assets/app.js` 运行时解压旧版及复核修订包，共载入 487 道练习题，显示来源截图编号。
- 网站可以随机抽题、随机排列选项及批改单选/多选。
- 选项答对后会被暂时移出抽题池；默认需要看过其他不同题目的 70% 后才能再次抽中（可在「题库与备份」中改成 10%–100%）。答错的题优先复习。
- 题目总数为 487 道，其中 397 道保存了说明文字。仍有旧版问题及文字识别需继续审核；详见 [ZIP 初次导入报告](development/IMPORT_REPORT_2026-11-15.md) 与 [二次复核报告](development/RECHECK_REPORT_2026-11-15.md)。
