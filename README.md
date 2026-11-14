# Life in the UK · Practice Studio

**这是独立于 Stock AI 2 的英国生活考试练习网站。**

## 网站和开发区域

- \`site/\`：GitHub Pages 公共网站（随机抽题、随机打乱答案、自动批改、错题重练、备注、进度本机保存）
- \`development/\`：开发说明、决策、计划。网页部署时不包含此目录
- \`examples/\`：题库文件格式示例
- \`.github/workflows/\`：测试与网站发布
- \`develop\` 分支：未来修改开发区；\`main\` 分支：发布正式网站

## 当前状态

**仅网站框架已完成，正式题库尚未导入。** 用户以后会提供 ZIP。站内示范题仅供体验，全部标明 DEMO，不是考试真题。

## GitHub Pages 发布

新仓库 \`Settings > Pages > Build and deployment > Source\` 选择 \`GitHub Actions\`。本仓库 \`.github/workflows/deploy.yml\` 会在 \`main\` 更新后发布 \`site/\`。

期望地址：<https://blank0610.github.io/life-in-uk-practice/>。以 GitHub Pages 实际部署状态为准。

## 数据安全

进度和私人笔记通过 localStorage 保存在浏览器，不会上传 GitHub，也不会跨设备自动同步。可以导出与恢复 JSON 备份；用户未来给出的 ZIP 需要先处理成已核实的题库格式再发布。

未来开发流程与决策： [开发地图](development/ROADMAP.md) / [决策记录](development/DECISIONS.md)。

**硬性隔离：不要写入、重命名、创建分支或 Issue 于 \`stock-news-ai-2\`。**
