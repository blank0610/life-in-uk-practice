# 2026-11-15 · 英语拼写、选项与解释质量核对

## 用户目标

主要检查 ZIP 截图转录是否出现英文拼写错误：题目是否完整、选项是否能读懂、正确答案是否仍对应正确选项、下方解释是否与答案和题意一致。**不应为了修复拼写随意更改题意，不能仅仅将明显有误的截图照抄。**

## 本次实施

- 原始来源：用户提供的 \`lift in uk QA 1.zip\`。
- 已发布题库：**487 道**，全部仍保留稳定的 \`zip-N\` ID。
- 通过对新增修订文本做英文词汇筛查，从原 ZIP 提取疑似拼写/识别问题，对重点截图进行视觉复核。
- 新增 **53 个题号**的英文修正映射：\`site/data/spelling-fixes.js\`。其中包括题干、选项和解释三类修正。
- 题库原始数据不直接重排，而是在最终加载时应用文字修正；如果改正了一个答案选项的文字，\`site/assets/quality-fixes.js\` 会根据原始选项**下标**自动同步正确答案。
- \`tests/spelling-fixes.test.mjs\` 根据压缩题库、二次修订和原手工记录重建 487 道题，确保每个修订规则都能匹配原数据、保留选项和正确答案数量、不出现重复选项。
- 自动检查 **不是** 487 张图片的逐张人工逐字符验证，不能宣称全部 100% 无错。

## 已核对示例

| 截图编号 | 原错误 | 修正 |
|---|---|---|
| 78 | \`Landon\` | \`London\` |
| 88 | \`Magna Garta\` | \`Magna Carta\` |
| 99 | \`Farcing another person\` | \`Forcing another person\` |
| 111 | \`Alion\`、\`Adragon\`、\`Aliger\`、\`Acat\` | \`A lion\`、\`A dragon\`、\`A tiger\`、\`A cat\` |
| 151 | Northern Ireland Assembly 解释严重乱码 | 对照原截图重写解释 |
| 165 | \`Aweekend\`、\`AQ days\`、\`Aweek\` | \`A weekend\`、\`40 days\`、\`A week\` |
| 180 | \`Erief Encounter\` | \`Brief Encounter\` |
| 220 | \`intraduced\`、\`foreed\` | \`introduced\`、\`forced\` |
| 264 | \`pleces\` | \`pieces\` |
| 271 | 解释文字包含 \`G2 in fraarwich erinth pact!\` | 改回 \`The O2 in Greenwich, south-east London\` |
| 278 | \`Iheresa May as Frime Minister...2u19¢\` | \`Theresa May as Prime Minister...2019?\` |
| 295 | \`Roast heeft\`、\`onians\`、\`foad\` | \`Roast beef\`、\`onions\`、\`food\` |
| 323 | \`Barroco\`、\`Art Beco\` | \`Baroque\`、\`Art Deco\` |
| 341 | \`Alfted Hitchcock\` | \`Alfred Hitchcock\` |
| 391 | 说明写 Senedd 60 人 | 2026 年已为 **96 人**，原截图内容过时；判断题“129 人”仍为 False |
| 405 | \`Baitle\`、\`commemcerated\` | \`Battle\`、\`commemorated\` |
| 449 | 解释中的 \`wark\` 及段落截断 | 对照原图恢复完整解释 |
| 475 | 解释中 \`dmecene\` | \`illnesses\` |
| 479 | \`rebellian\` | \`rebellion\` |
| 483 | 截图中写 \`Ian Wilmot\`，而不是正确姓名 | 改为 **Sir Ian Wilmut** 并更新 1944–2023；按权威资料核对 |
| 507 | \`Douglas-Hame\` | \`Douglas-Home\` |
| 524 | \`Cliver Cromwell\` | \`Oliver Cromwell\` |

上述示例仅为全部 53 个条目的部分摘录，完整校正映射请参看代码。

## 第三方资料交叉确认

1. 爱丁堡大学关于 Sir Ian Wilmut 的人物资料：https://www.ed.ac.uk/news/2023/statement-on-the-death-of-professor-sir-ian-wilmut
2. 参议院（Senedd）2026 年议会成员数改革：https://senedd.wales/how-we-work/our-role/senedd-election-and-member-changes/

这两类事实不是纯拼写：原截图本身存在旧资料或错字，应根据官方来源修正，且不改变原题正确答案的逻辑。

## 尚需处理的事项

- **不能声称已逐一人工验证全部 487 道的完整拼写。** 部分长解释段落仍可能存在漏字或过时措辞。
- 继续检查人名、地名、日期、数值和专有名词；词典自动检查容易把 \`Senedd\`、\`Gaelic\`、\`Pankhurst\` 等合法词误报为错词。
- 逐题检查截图的绿色正确答案和说明，尤其是涉及政策、政府组成及考试最新规则的条目。发现“所有选项都不正确”的题应先停用并建 Issue，不能随意猜正确答案。
- 未来每次新增修正都应带题号、原文、修正文字、依据，并让 GitHub Actions 自动测试通过。

项目与 Stock AI 2 完全独立；禁止上传原始第三方截图或用户私密学习记录到公开仓库。
