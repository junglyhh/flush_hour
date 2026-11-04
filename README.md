# Flush Hour · 冲冲大作战

**Share the load. Balance the bowls. Enjoy the flush.**

A self-contained, bilingual graph-averaging puzzle game with **30 restroom-themed levels**, from Easy to Master. Every vertex is a small toilet with a visible waste percentage. Tap the pipes to balance the load, bring **every toilet to or below the level’s limit**, and press **Flush them all** for the animated reward.

The campaign unlocks **one room at a time**. Its verified minimum solution length increases at every level, from **1 move in Room 01 to 30 moves in Room 30**. It is a separate game with its own saved progress.

## Play

**[Play Flush Hour online / 在线游玩《冲冲大作战》](https://junglyhh.github.io/flush_hour/)**

Open **[index.html](index.html)** in a modern browser, or download **[flush_hour.html](flush_hour.html)** and open it locally. The two files are identical, with all game code, styles, level data, SVG artwork, and the sharing QR code embedded. Playing needs no installation, server, internet connection, or external asset. Opening social platforms or the shared website does need an internet connection.

If a file-preview application displays a static page, open the HTML in a browser that runs JavaScript.

### How to play

1. **Tap anywhere along a pipe.** The two connected toilets receive their average waste level. For example, 80% and 20% become 50% and 50%. Tapping equal endpoints does not consume a move.
2. **Get every toilet at or below the limit, simultaneously, within the move allowance.** Equality counts. If the limit is 35%, a toilet at exactly 35% is ready. A later move can make a ready toilet too full again.
3. **Unlock the next room.** A successful clear immediately opens the next level, before the celebration flush. Future rooms stay locked; completed rooms remain available for replay.
4. **Enjoy the flush.** The congratulatory dialog offers **Flush them all**. Each clear displays a random short toilet quip from 50 English/Chinese pairs, with no immediate repeat during the session. Watch the water swirl and every waste level fall to exactly 0%. This reward costs no move and cannot bypass the puzzle.

Percentages describe each toilet’s own fill level; their combined total need not be 100%. Averaging preserves the combined amount until the victory flush removes it.

### Controls and progress

- **Undo**, **Restart**, and conceptual hints are available. No full solution appears inside the game.
- Each waste percentage has a translucent **orange background above the limit** or **green background at or below it**, without a separate status caption. Accessible labels retain the exact status.
- After flushing, **Next restroom** opens the next level and scrolls the page to the very top.
- The compact header has **language**, **sound**, **guide**, and **share** controls, in that order. Language switching keeps the current board intact.
- Keyboard: **Tab** selects a pipe; **Enter** or **Space** activates it. **U** undoes, **R** restarts, and **H** toggles the hint. Gameplay shortcuts pause while a dialog is open.
- Sound starts off. Flushing respects reduced-motion preferences.
- A **perfect flush** means clearing in the verified minimum number of moves. Other clears still unlock the next room.
- Earned unlocks survive undo, restart, replay, and reload. Current play and results are saved in this browser when local storage is available. If storage is blocked, the game remains playable for the current session. Downloaded and hosted copies may have separate browser saves.
- Saves from the original ten-room edition retain language and sound preferences. Earned clears and best scores carry over when the graph, starting values, and threshold match and the old score fits the current move allowance. Later records remain locked behind any new or unfinished preceding room; changed puzzles do not inherit clears. The previous save is retained separately.

### Sharing

The Share button opens a bilingual menu for **WeChat, Facebook, X / Twitter, WhatsApp, Telegram, LinkedIn**, the device’s native share sheet when supported, and copying the game link.

**WeChat uses an embedded QR code and instructions** for scanning it or sharing from WeChat’s own browser menu. This static game does not require a WeChat account integration, backend, or app secret. All share options point to the canonical public game URL, including when the HTML is opened offline. Clipboard failures offer a selectable link instead of silently failing.

## Levels / 关卡

Every threshold uses **≤**: equality counts. The minimum effective move count increases by one at each successive level. / 所有上限均采用 **小于或等于（≤）**；恰好相等也算达标。每一关所需的最少有效步数都比上一关多一步。

| # | Level / 关卡 | Toilets / 马桶数 | Difficulty / 难度 | Every toilet / 每个马桶 | Minimum / 最少步数 | Move limit / 步数上限 |
|---:|---|---:|---|---:|---:|---:|
| 1 | A Fresh Start / 冲个好头 | 2 | Easy / 简单 | ≤55% | 1 | 3 |
| 2 | Occupied! / 有人啦！ | 3 | Easy / 简单 | ≤50% | 2 | 4 |
| 3 | Mind the Queue / 排队别急 | 3 | Easy / 简单 | ≤40% | 3 | 5 |
| 4 | Three’s a Crowd / 三位请让让 | 3 | Easy / 简单 | ≤55% | 4 | 6 |
| 5 | Porcelain Junction / 瓷器岔路口 | 4 | Easy / 简单 | ≤44% | 5 | 7 |
| 6 | Around the U-Bend / U形弯兜一圈 | 5 | Medium / 中等 | ≤49% | 6 | 8 |
| 7 | The Spare Cubicle / 备用厕位 | 5 | Medium / 中等 | ≤62% | 7 | 9 |
| 8 | Diamond Detour / 菱形绕行 | 5 | Medium / 中等 | ≤60% | 8 | 10 |
| 9 | Bow-Tie Plumbing / 蝴蝶结水管 | 5 | Medium / 中等 | ≤57% | 9 | 11 |
| 10 | Double Trouble / 两翼告急 | 6 | Medium / 中等 | ≤56% | 10 | 12 |
| 11 | Restroom Roundabout / 卫生间环岛 | 6 | Medium / 中等 | ≤51% | 11 | 13 |
| 12 | Bull in a Bathroom / 牛气洗手间 | 5 | Medium / 中等 | ≤50% | 12 | 14 |
| 13 | Cistern Switchboard / 水箱调度台 | 4 | Medium / 中等 | ≤48.8% | 13 | 15 |
| 14 | The Long Queue / 长廊大排队 | 5 | Medium / 中等 | ≤48% | 14 | 16 |
| 15 | Horns of a Dilemma / 两头犯难 | 5 | Medium / 中等 | ≤54% | 15 | 17 |
| 16 | VIP Restroom / 贵宾洗手间 | 5 | Hard / 困难 | ≤48% | 16 | 18 |
| 17 | The Janitor’s Fork / 保洁员的岔路 | 5 | Hard / 困难 | ≤52% | 17 | 19 |
| 18 | Penthouse Plumbing / 顶楼水管 | 5 | Hard / 困难 | ≤66% | 18 | 20 |
| 19 | Septic Staircase / 化粪池阶梯 | 5 | Hard / 困难 | ≤52% | 19 | 21 |
| 20 | Rush-Hour Restroom / 高峰洗手间 | 6 | Hard / 困难 | ≤74% | 20 | 22 |
| 21 | Midnight Maintenance / 午夜检修 | 5 | Hard / 困难 | ≤60% | 21 | 23 |
| 22 | Sewer Express / 下水道快车 | 6 | Hard / 困难 | ≤48% | 22 | 24 |
| 23 | Porcelain Bottleneck / 瓷器瓶颈 | 4 | Hard / 困难 | ≤44% | 23 | 25 |
| 24 | Six-Stall Shuffle / 六厕位大调度 | 6 | Hard / 困难 | ≤56% | 24 | 26 |
| 25 | The Last Spare Drop / 最后一滴余量 | 5 | Master / 大师 | ≤70% | 25 | 27 |
| 26 | Golden Plunger Trial / 金牌皮搋子试炼 | 5 | Master / 大师 | ≤41% | 26 | 28 |
| 27 | The Grand Pipe Tour / 地下管网巡游 | 6 | Master / 大师 | ≤57% | 27 | 29 |
| 28 | Porcelain Marathon / 瓷器马拉松 | 5 | Master / 大师 | ≤67% | 28 | 30 |
| 29 | Flushmaster’s Exam / 冲水大师考场 | 5 | Master / 大师 | ≤72% | 29 | 31 |
| 30 | Royal Flush / 皇家大冲关 | 6 | Master / 大师 | ≤44% | 30 | 32 |

## 中文游玩指南

**平均分担，逐关解锁，痛快一冲。**

《冲冲大作战》共有 **30 关**，从简单到大师，所需最少步数从第 1 关的 **1 步**逐关增加到第 30 关的 **30 步**。图上的每个顶点都是一个小马桶，污物量以百分比显示。每次点击水管，将两端污物量替换为平均值；两端已相等时不消耗步数。

在步数上限内，让每个马桶同时 **低于或等于本关上限**，即可通关并立即解锁下一关，无需先完成冲水。通关弹窗会从 50 组中英双语短句中随机挑选一句，本次游玩中不会连续重复；短句和紧凑布局让冲水按钮保持易见。祝贺窗口中的“一键冲水”会播放旋转水流动画，最后让所有马桶的数值归零。已通关的关卡可以随时重玩，撤销或重新开始不会收回已获得的解锁。

每个百分比代表对应马桶的污物量，总和不必等于 100%。平均分配保持总量不变，只有通关奖励中的冲水会清空总量。

### 操作、存档与分享

- 提供撤销、重开和思路提示；游戏内不显示完整解法。以最少步数通关可获得“完美冲水”标记。
- 马桶百分比采用半透明底色：超过上限为橙色，低于或等于上限为绿色，不再另列状态文字；辅助阅读标签仍保留状态说明。
- 冲水后点击“下一间洗手间”，进入下一关并自动回到页面最顶部。
- 顶部依次为缩小后的 **语言、音效、指南** 按钮，以及新增的 **分享** 按钮。切换语言不会重置棋盘。
- 分享菜单支持 **微信、Facebook、X / Twitter、WhatsApp、Telegram、LinkedIn**、设备支持的系统分享，以及复制游戏链接。微信选项显示内嵌二维码和操作说明；也可在微信内打开游戏后使用微信的分享菜单。
- 键盘：**Tab** 选择水管，**Enter / 空格** 分配，**U** 撤销，**R** 重开，**H** 查看提示。弹窗打开时暂停游戏快捷键。
- 音效默认关闭；动画尊重系统减少动态效果的设置。
- 浏览器允许本地存储时会保存进度。旧十关版会迁移规则完全一致的已通关记录及最好成绩，并保留语言与音效偏好。后续旧成绩仍受前置关卡限制，不会绕过新增或未完成的关卡，也不会直接解锁改动后的谜题。
- 打开 `index.html` 即可游玩，也可下载 `flush_hour.html` 离线打开。游戏本身无须网络；访问分享平台或打开分享链接需要网络。

## Development / 开发

The game has **no runtime dependencies**. Building uses **Python 3.10+**; regular automated checks use **Node.js 18+** and built-in modules. No package installation or network access is needed.

```bash
python3 scripts/build.py
python3 scripts/build.py --check
node tests/run.cjs
```

`build.py` embeds the maintained sources into both HTML entry points. The output is deterministic. `--check` rejects missing or stale output; the build also rejects a campaign with the wrong level count, duplicate IDs, or non-increasing minimum move counts.

构建会将源码内嵌到两个完全一致的 HTML 文件中。`--check` 检查生成文件是否过期，同时检查 30 关数量、唯一编号及逐关递增的最少步数。

### Source map / 文件结构

| Path | Purpose / 用途 |
|---|---|
| `index.html`, `flush_hour.html` | Identical generated online/offline entry points / 内容相同的在线与离线入口 |
| `src/template.html` | Bilingual interface, styling, game flow / 双语界面、样式及游戏流程 |
| `src/game-core.js` | Averaging, inclusive thresholds, safe numeric display, geometry / 平均规则、上限判断、数字显示及布局 |
| `src/campaign.js` | Unlocking, validated records, history replay, migration / 逐关解锁、记录校验、历史重放及迁移 |
| `src/legacy-levels.js` | Original puzzle definitions used for save migration / 旧关卡存档迁移定义 |
| `src/share.js` | Sharing dialog, platform links, native share, clipboard, embedded QR / 分享弹窗、平台链接、系统分享、复制及二维码 |
| `src/toilet-visual.js` | Inline toilet and flush artwork / 马桶与冲水图案 |
| `data/levels.json` | 30 levels and bilingual conceptual hints / 三十关数据及双语提示 |
| `data/victory-quips.json` | 50 short bilingual victory quips / 五十组中英双语通关短句 |
| `scripts/build.py` | Deterministic standalone HTML build / 确定性的独立 HTML 构建 |
| `tests/` | Rules, application-state, sharing, and responsive geometry checks / 规则、状态、分享及布局检查 |
| `tests/fixtures/verification.json` | Developer-only shortest-solution certificates; contains spoilers / 仅供开发使用的最短解凭证，含剧透 |
| `tools/`, `scripts/verify_optima.py` | Exact optimum verification / 最少步数精确验证 |
| `.qa-output/` | Ignored generated reports, experiments, and solver binaries / 不提交的报告、实验及临时程序 |

Regular checks cover all 30 solution certificates, threshold equality and tiny positive excesses, sequential locking, pre-flush unlocks, replay and reload, legacy migration, actual application events, sharing destinations and fallback behavior, and graph layouts over a range of widths. Application-state checks run the actual built script with a deterministic DOM substitute; they do not replace browser-rendering checks.

### Exact minimum verification / 精确最少步数验证

```bash
python3 scripts/verify_optima.py
```

#### How the difficulty steps are verified

Every stage has an exact minimum number of effective moves: level 1 needs 1, level 2 needs 2, and so on through level 30. Equal-value pipes are no-ops and do not spend a move. A clear requires every value to be **less than or equal to** the threshold; equality counts. The normal QA replays the stored solutions with exact integers. The optional `python scripts/verify_optima.py` also recomputes shortest-path proofs using two C++ implementations.

For general graphs, the first solver enumerates effective edge sequences with memoization and safe lower bounds; the independent solver uses a separate depth-first search without commuting-edge reductions. One averaging move can remove at most one above-threshold vertex, so a state with more unsafe vertices than remaining moves can be pruned.

The later compact paths use an additional exact dominance rule. It applies only after checking that the entire graph is a simple path and that the initial values are nonincreasing along one endpoint-to-endpoint ordering. Averaging neighboring values preserves that ordering. If `S_i` is the sum of the first `i+1` values, averaging edge `i` changes only that prefix:

`S_i <- (S_(i-1) + S_(i+1)) / 2`, with the boundaries `S_-1 = 0` and `S_(n-1) = total`.

This operation is monotone in every prefix coordinate. If state A has every prefix sum no larger than state B, applying the same future edge sequence to both preserves that comparison. The first value is always the maximum, so any sequence that clears B also clears A. A can therefore replace B whenever A is reachable using no more moves. A no-op in this copied sequence may simply be omitted, using fewer moves.

The primary implementation builds all nondominated states reachable in **at most** each depth; it carries the previous frontier forward and adds every effective neighboring average. It removes a candidate only if another candidate has every prefix sum less than or equal to it. The first frontier that reaches the threshold proves the exact optimum. The independent implementation works with physical toilet values and depth-first recursion. At each remaining budget it keeps failed states: if a previously failed state has every prefix no larger than the current state, then the current state must also fail. It uses neither the primary prefix-state representation nor its breadth-first frontier machinery.

Both implementations validate the path and its orientation before using dominance, including relabeled/reversed paths. Other graphs fall back to ordinary exhaustive search. All input percentages are parsed exactly to hundredths and represented with a `2^40` integer scale. At most 40 averages are supported; the campaign uses at most 32 moves. Integers fit in signed 64-bit storage for at most seven vertices with initial levels at most 100%. The verification script replays certificates with Python rational fractions and compares against exact decimal thresholds, independently of the C++ scaling.

The fixtures identify the proof method and retain the exact state after every move, the winning edge sequence, and a separate lower-bound result showing no solution at one fewer move. The shortest-move ramp is a concrete difficulty measure; the bilingual hints also introduce routing, scarce spare capacity, branches, and tightly timed revisits. Solutions remain developer fixtures and are not displayed in the game.

Full solution sequences remain in the developer fixtures and verification tools; they are not embedded in either playable HTML file. All temporary verification output stays under `.qa-output/`.

完整解法只保留在开发测试数据与验证工具中，不会内嵌到玩家使用的 HTML 文件中。临时验证文件均写入 `.qa-output/`。

### Hosting / 托管

The repository root is deployed through **GitHub Pages**, from **main / (root)**. `index.html` is the entry point and `.nojekyll` is included. Updating the committed static files triggers the existing Pages deployment. No backend, API keys, environment variables, or deployment build step is required.

仓库通过 GitHub Pages 从 **main / (root)** 发布；入口是 `index.html`。更新仓库中的静态文件即可触发部署，无须后端、API 密钥或额外构建步骤。
