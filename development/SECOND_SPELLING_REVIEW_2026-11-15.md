# 2026-11-15 · 第二轮截图文字核对

## 本次用户要求

重新检查英文拼写是否正确，题干、答案选项和解释是否通顺、互相匹配。**不只是照抄截图**，需要在截图本身存在错误时使用可靠资料验证。

## 数据与审核范围

- 原始依据：用户提供的 \`lift in uk QA 1.zip\`（509 张题目截图）。
- 网站练习题：**487 道真实题**，未加入 DEMO。
- 第一轮 \`SPELLING_REVIEW_2026-11-15.md\` 已为 53 个截图编号建立拼写校对。
- 本轮重新审查 ZIP 题干、选项与备注，增加 **27 个新的截图题号**的校对，累计 **80 个题号有专门修正**，题库数量仍为 487。
- 综合利用：从 ZIP 提取的原始截图、二次转录候选文本、明显 OCR 错词的跨题扫描、对重点原截图的视觉核对及可靠外部资料。
- 新增跨 **487 道题**的 OCR 典型错词回归检测；自动测试会在发现已列出的明显拼写残留时失败。
- **明确限制：这不是 487 张截图全部逐字人工校对完成的证明。** 仍可能存在罕见地名、解释长句与过时知识点等尚未发现的问题。

## 本轮修正题号与主要内容

| 截图编号 | 修改点 |
| --- | --- |
| 26 | \`Isle cf Man\` → \`Isle of Man\` |
| 32 | \`House cf Lancaster\` → \`House of Lancaster\` |
| 143 | \`UK whe is\` → \`UK who is\` |
| 146 | \`refers only te\` → \`refers only to\` |
| 195 | \`Henry Vill\` → \`Henry VIII\` |
| 224 | 删除图片文字识别误纳入的广告字符与乱码，保留完整说明 |
| 226 | 选项 \`People fram the same gender\` 改成可理解的 \`People of the same gender\` |
| 254 | \`came fram\` → \`came from\` |
| 266 | \`persan\`、\`chief Officer\`、\`House af Commons\` |
| 267 | **恢复原截图四个完整选项、正确答案及说明**（原识别曾只保留两个选项） |
| 288 | 改清楚 Dolly 是 1996 年**从成年体细胞克隆的第一只哺乳动物**，更正 Ian Wilmut |
| 293 | \`Sutfragettes\` → \`Suffragettes\`；官方名称 \`Yeoman Warders\`，而非原截图 \`Wardens\` |
| 301 | \`Henry VIl\` → \`Henry VII\` |
| 314 | \`Far political reasons\`、\`Henry Vill\`、\`civarce\` |
| 330 | \`raundhouses\`、\`tambs\` |
| 353 | 修复饮酒年龄说明 OCR 错误，并核对 16–17 岁与成年人随餐饮酒例外；**北爱尔兰的规定不同** |
| 364 | \`driver whe won\` → \`driver who won\` |
| 372 | \`Aweek\` → \`A week\` |
| 408 | 解释里的 \`SMs\` → \`MSs\`；\`cf concern\` → \`of concern\` |
| 413 | \`issues suck as\` → \`issues such as\` |
| 418 | \`Council cf Europe\` → \`Council of Europe\` |
| 436 | \`1879\` → **\`1679\`**；\`nc one\` → \`no one\` |
| 441 | \`Sutfragettes\` → \`Suffragettes\` |
| 456 | \`listen te\` → \`listen to\`；\`based of\` → \`based on\` |
| 476 | 原题干 \`how often are the general elections held in the URS\` 改成自然英文 \`How often are general elections held in the UK?\` |
| 510 | \`Queen Elizabeth Il\` → \`Queen Elizabeth II\` |
| 513 | \`Same words\` → \`Some words\`；\`fer example\` → \`for example\` |

## 独立权威资料核查

- **Habeas Corpus Act 1679**：英国法律数据库 <https://www.legislation.gov.uk/aep/Cha2/31/2>。原截图题干本来是 1679，OCR 解释写成了 1879，应改回 1679。
- **Yeoman Warders**：伦敦塔官方运营机构 Historic Royal Palaces <https://www.hrp.org.uk/tower-of-london/history-and-stories/yeoman-warders-at-the-tower-of-london/>。该职位正式名称为 Warder、俗称 Beefeater。原截图的选项使用了不规范的 Wardens。
- **Dolly**：爱丁堡大学 <https://www.ed.ac.uk/news/2023/statement-on-the-death-of-professor-sir-ian-wilmut>。应写 Ian Wilmut；关于首个克隆哺乳动物的陈述须限定 **from an adult somatic cell**。
- **16–17 岁随餐饮酒**：<https://www.gov.uk/alcohol-young-people-law>、<https://www.legislation.gov.uk/ukpga/2003/17/section/150>；北爱尔兰差异参阅 Drinkaware <https://www.drinkaware.co.uk/facts/information-about-alcohol/alcohol-and-the-law/buying-alcohol>。

## 技术验证与后续

1. \`site/data/spelling-fixes.js\`：按 \`zip-N\` 唯一题号追加修正，不改变题号及学习进度关联。
2. \`site/assets/quality-fixes.js\`：修改单个选项时保持正确答案的原下标；确实出现**整组选项识别丢失**时支持人工提供完整选项与正确答案下标，避免错误批改。
3. \`tests/spelling-fixes.test.mjs\`：重建全部 487 题，逐条应用校对，验证正确答案仍存在于选项、无重复、#267 恢复四个选项，并扫描常见 OCR 错词。
4. **未能保证每道题与来源截图百分之百逐字一致。** 后续可继续按网页显示的截图编号提交修正；需分别核实拼写和实际历史/法律事实，不能随便把未核实答案标记正确。
5. 修改与核对全部位于 \`blank0610/life-in-uk-practice\`，未接触 Stock AI 2。
