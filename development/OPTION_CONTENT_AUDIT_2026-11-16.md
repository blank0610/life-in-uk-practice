# 2026-11-16｜题目选项与解释混杂：原图对照与防回归

## 用户报告

用户网站截图显示 #302「When did the Black Death come to England?」出现 **6 个选项**，其中两个是不属于选项的说明文本：

- \`Death.\`
- \`Incorrect, In 1348, a disease, probably a form of plague, came to Britain. This was known as the Black\`

网站还将截图里的 \`In 1414\` 错读为 \`In 1444\`。这是 **OCR/截图分段错误**，不是用户期望的自然语言改写。

## 实际对照的原截图

源文件：用户上传 ZIP \`lift in uk QA 1.zip\` 中 \`螢幕擷取畫面 (302).png\`。

原图题目原样：\`When did the Black Death come to England?\`

四个原图选项（原图顺序）：

1. \`In 1248\`
2. \`In 1348\`（原图绿色高亮正确答案）
3. \`In 1358\`
4. \`In 1414\`

原图「Incorrect」框中的解释仅作为说明：\`In 1348, a disease, probably a form of plague, came to Britain. This was known as the Black Death.\`

**修复措施：** 通过独立校对映射 \`site/data/spelling-fixes.js\` 的 \`zip-302\` 条目恢复原有四个选项与正确答案下标，说明不再成为选项。网站显示答案顺序仍会随机洗牌，这是练习逻辑本身，不意味着原图顺序错误。

## 同批查出的 #80 OCR 数字错误

通过新的整库检查 \`scripts/audit-question-bank.mjs\`，发现 \`zip-80\` 含 \`AQ days after Easter\`。

再次打开 ZIP 原截图 \`螢幕擷取畫面 (80).png\`，确认原图为：
- \`40 days before Christmas\`
- \`40 days after Christmas\`
- \`40 days before Easter\`（绿色高亮正确答案）
- \`40 days after Easter\`

只将错误选项的 \`AQ\` 改回 \`40\`，保留原题干、其他三个选项、正确答案和解释，不额外润色。

## 全部 487 道题的结构扫描

- 按网站真实加载顺序重建 \`site/data/questions.js\` 压缩数据、\`site/data/recheck-2026-11-15.b64\` 以及 \`site/data/spelling-fixes.js\`。
- 检查题干、选项、正确答案关联，以及 \`Incorrect / Correct / Your answer / Explanation / Check answer\` 是否误混入选项。
- 对单选题异常超过四个选项、异常长选项、明显乱码及 \`AQ days\` 输出待核对清单。
- 在 Pull Request 的 GitHub Actions 中直接运行 \`node scripts/audit-question-bank.mjs\` 并且包含回归测试 \`tests/options-are-choices.test.mjs\`。
- 修正后扫描未发现其他符合已定义**高置信污染特征**的题目；这是结构扫描结果，**不等于已对所有 487 张截图逐张逐字人工比对**。仍可能存在扫描规则未覆盖的识别错误。
- 已明确保护原图合法的六选项多选题（#31 需选 5 项、#283 需选 4 项），不能把所有多于四个选项的题都认定为污染。

## 后续规则

1. **以原图为主**；如果源题本身可读且正确，不要重写题干、选项或说明。
2. 只修改有截图根据的拼写、数字、标点、被拆断的选项/解释。
3. 正确答案必须按原图高亮核对。截图本身事实存疑时另外标记，不要擅自改成推测答案。
4. **禁止把 Incorrect/Correct 反馈框、解释、广告、导航栏、题号计数器、按钮等截图内容导入选项列表。**
5. 修正时保留稳定的 \`zip-N\` 题号以保护已保存的用户学习进度。
6. 本项与 Stock AI 2 严格隔离。
