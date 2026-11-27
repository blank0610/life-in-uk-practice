# Test 20–40 原始截图扩容记录

用户要求：两包所有练习题加入正式网站；导入前检查英文是否合理、题干完整、原选项和答案正确，不盲目复制 OCR，不大幅改写。现有 Auto Run 必须覆盖新增题，不另建任务。

## 来源与实际进度
- `lift in uk QA 20-30.zip`：#526–1067，共 542 张。
- `lift in uk QA 30-40.zip`：#1068–1350，共 283 张。
- Test 20：#526 为未作答画面；#527–550 对应旧 #502–525 的 24 题。保留旧 ID，不重复计入。#520 旧题干缺第一行，经打开原 #520 与新 #545 核实，恢复原题干；原图 employees 与解释 employers 的差别保留并列为原题疑点。
- Test 21：#551、#553–575，共 24 题已逐张阅读题干、全部选项、绿色正确答案、解释；#552 与 #551 为同一题重复截图。保留 #551。原图 #563、#568 无解释文字，留空，不杜撰。#568 retired→retire、#574 sportsmen→sportsman 为用户允许的最小语法修正。#571 “Dame Elle MacArthur”及#574 “Sir Jackie Steward”是原截图选项拼写，先保留，记疑点；#569 原提问措辞可能有歧义，保留原文，不更新事实。
- 新题保留独立测试号、题序及来源截图号；不同测试中同类题不按相似题干盲删。同一测试同一道重复截图不再添加。
- 两个 ZIP 的 #526–1350 共825张截图已全部处理；最后一次统一导入剩余 #838–1350，覆盖记录见 IMPORT_REMAINING_SOURCE_COVERAGE.json。无尚未处理的截图。
- 累计扩容479道，原487道加至966道；题数以主账及实际加载为准。顺序审核游标与历史归档保留；导入核对不冒充 Auto Run 巡检。
- 代码：追加题库模块、浏览器及 Node 审核加载、分包数量动态测试、发布工作流和相关文档。新题审核原始 ZIP 不上传 GitHub。
- 测试与发布状态以对应 PR、CI 和 Pages 实际结果为准。本记录不声称部署已成功。

## 第二批：Test 22
- #576–599 连续 24 张截图，题序 1–24 全部实际打开、对照题干、选项、绿色答案、解释；没有缺页。原图的两项/三项等正确答案以绿色高亮为准。
- 最小语法修正：#580 解释 Queue→queue；#592 live→lived；#596 解释删除多余 which，使句子完整。#594 解释中的人物关系疑点保留原图文字，不擅自修订事实。#585、#588 等保留原题答案，不作外部事实更新。
- 原 511 道加至 535 道，保留本轮审核游标、历史记录与原题 ID；新增题进入顺序审核分包，不预填 Auto Run 审核结果。上一批 PR #84 已合并且 Pages 工作流成功。本批测试及部署以对应 PR/Actions 为准。

## 第三批：Test 23
- #600–624 共 25 张截图，24 道题，逐张实际核对题干、选项、绿色答案、解释。#602 与 #601 为同一道题完全重复，保留 #601。
- 最小语言修正：#601 干扰项 French→France，保持地名类型一致；#607 During its government→During her government；#608 sat at→sat in（题干、干扰项），解释 Knights→knights；#609 scunthorpe→Scunthorpe；#611 needed→need。正确答案未改动。
- #617 原图 Rutherford 题干及解释之间存在事实表述疑点，保留原文，不借外部资料改动；#615 保留原图统计百分比。其余内容照原图转录。
- 535→559 道，主账、分包及测试同步，保留顺序审核索引与历史；没有伪造 Auto Run 审核结果。上一批 PR #85 已通过 CI 并合并，正式部署以 Actions 实际状态为准。

## 第四批：Test 24
- #625–648 共 24 张截图，题序 1–24 全部实际打开核对，绿色答案、全部选项及解释完整。#638、#648 为两选题；#636 为 False。
- 最小语言修正：#639 head of the state→head of state；#642 解释 taken is English→taken in English；#643 原图 Sir Ian Wilmot→Sir Ian Wilmut（沿用旧题库已核对的专名拼写），答案选项与解释同步修改。原图 Francis Creek 干扰项保持不变，记录拼写疑点，不擅自改动。
- 559→583 道，保留原有 ID、审核游标和历史，新增题同步进审核分包。PR #86 的部署工作流已成功。本批状态以 PR/CI/Pages 为准。
- 用户要求持续导入至全部完成；实际核对现有每小时 Auto Run 仍启用，已将 487 固定轮次边界改为动态 bankCount，批大小读取 batchSize，原排程与巡检范围不变。

## 指定题目复查：#186
- 用户截图显示正确选项 `$ million`。打开旧 ZIP 原图 #186（Test 7 第15题）确认第二选项为 `8 million`，原图解释亦为 8 million。仅修正该选项及其答案对应关系；保留题干、其余选项、解释和历史学习 ID。加入数量单位前仅有货币符号的检查及回归测试。独立记录见 ON_DEMAND_CHECKS.json，不推进顺序审核索引。

## 第五批：Test 25
- #649–672 共24张原图，题序1–24，逐张核对完整题干、选项、绿色答案及解释。#666 两项正确；#655、#658 为 False，#668 为 True。
- 最小语言修正：#655 两处 based of→based on；#661 删除题干问号后的误附重复干扰项 The Radar，原选项中保留 The Radar；#663 删除题干多余 and，调整解释时间短语位置避免过去时间与现在时冲突；#665 原解释 Sir Antony Hopkins→Sir Anthony Hopkins，与原正确选项一致；#671 删除重复 did。未改正确答案。#660 驾照、#655 裁决及#652 人口普查等原图事实保留，不独立核查。
- 583→607，道数及审核分包同步，保留审核索引与历史。#186 用户指定原图修复已独立提交 PR #88，不推进巡检游标。本批部署状态以对应 CI 和 Pages 为准。

## 第六批：Test 26、27
- Test 26 #673–696：24 道，逐张打开核对全部题干、选项、绿色正确答案及可见解释。#680 两项正确，#693 五项正确。#693 解释第二行末尾被广告挡住，保留可读部分并明确标记 `[Remainder obscured in the source screenshot.]`；不声称完整解释已经核对，待更清晰原图。选项、正确答案完整。#680 原问法生硬及 #693 原答案覆盖范围疑点保留，不作外部事实核查。
- Test 26 最小语言修正：#674 reining→reigning；#675 删除 The Chartists 后多余逗号；#692 married with→married to。其他措辞和答案按原图。
- Test 27 #697–721：25 张截图，24 道题，#705 是第9题未批改画面，#706 是同题显示正确答案和解释的画面，仅保留 #706。#699 两选；#713、#714、#715、#719 为 False。#701 删除选项 She was kept her prisoner 中多余 her；#711 aircrafts→aircraft，the radar→radar（题干）；#715 解释补 is；#716 sat at→sat in；#717 broadcasted→broadcast；#721 解释补 and，原图 National Anthem…is…is 句式修正。#698 原解释将 Sonnet 18 称为 play，保留为原图疑点，不擅自修改事实。
- 607→655；51→55 个审核分包。保留原有题目 ID、审核索引及历史。新题不预填本轮 Auto Run 审核记录。#722–723 已看到但未完成下一整套，不提前写入；#724 回到 Test 27 第一题，后续导入必须核对套号与题序，不能按连续截图编号直接假定套题完整。
- 部署故障：PR #88、#89 合并后 CI 与可读分包生成成功，但 Pages 两次失败，日志显示 upload-pages-artifact 成功，deploy-pages 随即查到 0 个 artifact；随后同一 run 的 API 确认 github-pages artifact 存在（run 46039773896 / artifact 15218993529）。推测为元数据同步延迟；加入 actions:read 及部署前有限次数轮询可见性检查。修复是否成功以新部署实际结果为准。

## 文件夹顺序追加：#722–797
- 用户最新要求：不要按套题分开导入；按现有 ZIP 文件夹内的截图顺序继续，把所有已核对题统一追加到 `site/data/additional-questions.js`，网站继续使用同一个随机练习题库。不另设套题目录、选择器或独立题库；sourceTest/sourceQuestion 仅用于内部来源追踪。任何数量的连续有效截图均可提交，无需等待某套24题完成。对外报告文件夹、已处理截图范围、有效新增及剩余文件，而不是套数。
- QA 20–30.zip：实际打开 #722–797 共76张截图。#724–747 是 #697–721 已收录的同一组题回退重拍（逐题对应已入库 ID，跳过未批改 #705）；#748、#749 分别重复 #722、#723。共排除26张重复截图。新增 #722、#723、#750–797，共50道。完整核对题干、全部选项、绿色答案和可见完整解释。#757、#766、#773 为两选题；#754、#765 为 False。
- 最小语言修正：#752 reining→reigning；#757 on a rowing race→in a rowing race；#759 windowscreen→windscreen（选项和解释同步）；#761 the British film→a British film；#764 解释补 On 与空格；#767 普通名词大小写；#769 Wilmot→Wilmut（沿用前批已校对的人名拼写）；#770 删除冗余 for 并统一 West End；#778 Known→known；#790 删除 Ramadan 前多余 the，Eid a-Fitr→Eid al-Fitr（明显拼写修正，选项与解释同步）；#795 a valid motor insurance→valid motor insurance，a MOT→an MOT。#764 原图干扰项 Blitzs 作为原文疑点保留；#759 税盘、#761 影片归类、#779 分治年份、#791 航海纪录及#794登记册时间等原图事实不作外部更新。答案保持原图选择。
- 当前源文件夹处理至 #797，下一图 #798。当前 QA 20–30 文件夹 #526–1067 共542张，已处理前272张（含重复/未作答截图），余270张；QA 30–40 文件夹 #1068–1350 共283张尚未导入。旧题 ID、学习记录及审核游标不变。主账655→705，审核分包55→59。上一批 PR #90 的 Pages 发布成功；本批状态以对应 CI/Pages 为准。

## 文件夹顺序追加：#798–837
- QA 20–30.zip：实际重新打开由原图生成的10组四图预览，逐题核对 #798–837 的完整题干、全部选项、绿色正确答案和解释，40张有效截图均追加到同一题库；无排除项。#808、#810、#812、#824、#831 为两选题。
- 最小语言修正：#807 删除 is made of a fried meal 中冗余 made of，并补 sausage 后空格；#810 statements is→statements are；#815 解释 House of the Commons/Lords→House of Commons/Lords；#821 解释 diplomatic and relationships→diplomatic relationships，counties→countries；#829 正确选项 is→are，干扰项 prepare→prepared；#836 解释 holds number→holds a number。#809 邮编保留为 SW1A 0AA。#836 干扰项 Sir Jackie Steward 保留原图拼写疑点。正确选择位置未改动。
- #823 原图解释写 43 feet (135 metres)，两种单位不一致，保留原文与正确选项135 metres，列为原始题目疑点，不猜测改数字。#808、#827、#830、#832 等原图事实或答案范围疑点保留，未查外部资料。此批导入核对不计入 Auto Run 顺序审核记录。
- 当前源文件夹已处理至 #837，下一图 #838；QA 20–30.zip 已处理312/542张，余230张；QA 30–40.zip 余283张。累计处理312/825张，余513张。主账705→745，保留旧ID、学习记录、审核索引及历史；上一批 PR #91 的 Pages 和 CI 已成功（run 46050966181、46050966079）。本批 CI 和部署状态以实际工作流为准。

## 全部剩余 ZIP 一次性完成：#838–1350
- 用户明确要求不按套题分批发布；剩余513张统一在一个开发分支整理、一次PR合并，追加到原 `site/data/additional-questions.js`，不另建题库或套题选择器。最后新增221道，QA 20–30.zip 新增30道，QA 30–40.zip 新增191道；原745→966道，审核分包63→81。
- 513张完整覆盖：221张逐图人工转录；21张人工确认重复/未批改/遮挡，由完整题图代替；271张用可见题干与选项文字像素及绿色答案位置精确匹配排除（非全图逐字人工审核）。每一张均记录源号、分类、对应有效题ID，验证无遗漏及重复计数。两个ZIP合计825张，累计新增479道、346张非新增，未处理截图0张。旧题库原有疑点仍需后续巡检。
- 用户截图 #252 的 tlag Comprises→flag comprises 已按原图修复，PR #93 的 CI、可读分包及 Pages 发布全部成功。#252 独立复查未推进巡检游标。
- #1177 原图重复干扰项仅保留一次；#1274 题干 died 与解释 casualties 不一致；#1336 绿色答案与解释措辞不一致。保留原图答案和原始事实疑点，不依据外部知识猜改。#693 等历史记录中的原图缺损待更清晰原图。其余最小语言修正如下：
- #847 this include→these include；#849 Castle 大写；#858 scientist→scientists、Middle Ages 大写；#867 Eid a-Fitr→Eid al-Fitr。#851 原图 Francis Creek / Wilmot 及 #852 NHS System、#853 独立年份疑点保留，不做事实查证。
- #1123 补 of（collection of poems），#1134 Rutherford 原解释事实疑点保留。#894–1085 布局或颜色差异的19张人工复核为既有重复；其余像素哈希重复另记。
- #1142 原图滚动位置异常但实际已显示高亮答案 True，人工恢复；#1150 and ancient→an ancient；#1169 everyone...were→was；#1144 保留原图60 Senedd members，不查外部事实。
- #1177 原截图两个干扰项均为 The Suffragettes；删除完全重复的一个，保留三个不同选项及原正确答案 The Cavaliers，不创造替代项；解释补 there were。#1174/1187/1191 专名大小写；#1193 did introduced→did introduce、补 was；#1197 settlements is→are。
- #1204 Middle Ages 大写；#1213 题干与解释两处 taken is English→taken in English；#1216 去掉 Scotland 前多余 the；#1225 解释 is→are 并补逗号。#1223 原图 TV licence 概括性表述保留，不进行现行法律事实核查。
- #1234 补干扰项 every，解释 you→your；#1275 untied→united 并修标点；#1296 Treat other→Treat others；#1300 are part in→take part in。#1274 原图题干 died 与解释 casualties 的意义不一致，保留原题正确选项并登记疑点，不擅自更新事实。#1293 原图年龄范围与#1300 项目状态保留，不查现行事实。
- #1312 The→the；#1314 去掉 WWI 前多余 the（两位诗人作为一组单选答案）；#1329 Isaac Newton→Isaac Newton’s（补所属格）；#1330 经过异常布局人工核对，完整答案与解释可见。#1320 原图 civil offence 术语疑点保留，不外查。
- #1332 more that half→more than half；#1333 Tim henman→Tim Henman、Jessica Enis→Jessica Ennis（与 #621 同一已核对姓名）；#1337 millenium→millennium；#1345 select→Select；#1346 itunes→iTunes、Ebay→eBay。#1336 原图绿选项 Smoking in public places 与解释 drinking in public 不一致，保留原图绿色答案及解释，登记疑点。#1341、#1342 保留原图事实、不外查。
- 完成后永久巡检仍按当前 bankCount/batchSize 动态覆盖整个题库，不改轮次或索引，不重新创建任务；临时导入任务此前因自动环境不能访问 ZIP 已暂停。此次实际测试与部署状态以本 PR 的 CI 和 Pages 为准。
