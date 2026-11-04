# Flush Hour · 冲冲大作战

**Share the load. Balance the bowls. Enjoy the flush.**

A self-contained, bilingual graph-averaging puzzle game with ten restroom-themed levels, from Easy to Master. Every vertex is a small toilet with a visible waste percentage. Tap the pipes to balance the load, bring **every toilet to or below the level’s limit**, and press **Flush them all** for the animated reward.

This is the **10-level testing edition**: every level is available from the start. It is a separate game with its own saved progress.

## Play

Open **[index.html](index.html)** in a modern web browser, or download **[flush_hour.html](flush_hour.html)** and open it locally. The two files are identical. Each contains all game code, styles, level data, and SVG artwork; neither needs an installation, server, internet connection, or external asset.

If a file-preview application displays a static page, open the HTML in a browser that runs JavaScript.

### How to play

1. **Tap anywhere along a pipe.** The two connected toilets receive their average waste level. For example, 80% and 20% become 50% and 50%. Tapping a pipe whose ends already match does not consume a move.
2. **Get every toilet at or below the limit, simultaneously, within the move allowance.** Equality counts: if the limit is 35%, a toilet at exactly 35% is ready. A later move can make a ready toilet too full again.
3. **Celebrate, then flush.** Clearing a level opens a congratulatory dialog. Press its flush button to trigger the swirling-water animation and drain every toilet to exactly 0%. Flushing is the reward and costs no move; it cannot be used to bypass the puzzle.

Percentages describe each toilet’s own fill level. The combined starting waste is not constrained to 100%. Averaging preserves that combined amount until the victory flush removes it.

### Controls and progress

- **Undo**, **Restart**, and two conceptual hints are available. The game never displays a complete solution.
- Use **中 / EN** to switch languages without losing the current board.
- Use the level list or level picker to try any of the ten levels immediately.
- Keyboard: **Tab** selects a pipe; **Enter** or **Space** activates it. **U** undoes, **R** restarts, and **H** toggles the hint.
- Sound starts off. The sound button enables optional effects, and the animation respects reduced-motion preferences.
- A **perfect flush** means clearing in the verified minimum number of moves. Other clears still count. Both Master levels have move limits equal to their minimums.
- Current play and best results are saved in this browser when local storage is available. If storage is blocked, the game remains playable for the current session. The downloaded file and a hosted copy may have separate browser saves.

## Levels / 关卡

The comparison in every row is **≤**, not a strict “less than.” / 下表所有上限都采用 **小于或等于（≤）**，恰好相等也算达标。

| # | Level / 关卡 | Graph / 图形 | Difficulty / 难度 | Every toilet / 每个马桶 | Minimum / 最少步数 | Move limit / 步数上限 |
|---:|---|---|---|---:|---:|---:|
| 1 | A Fresh Start / 冲个好头 | Pair / 双点 | Easy / 简单 | ≤55% | 1 | 3 |
| 2 | Mind the Queue / 排队别急 | Three-node path / 三点路径 | Easy / 简单 | ≤40% | 3 | 5 |
| 3 | Three’s a Crowd / 三位请让让 | Triangle / 三角形 | Easy / 简单 | ≤55% | 4 | 6 |
| 4 | Porcelain Junction / 瓷器岔路口 | Three-arm star / 三叉星形 | Medium / 中等 | ≤44% | 5 | 8 |
| 5 | Round the U-Bend / 回旋U形弯 | Five-node loop / 五点环 | Medium / 中等 | ≤35% | 5 | 10 |
| 6 | Diamond Detour / 菱形绕行 | Diamond with a tail / 带尾菱形 | Medium / 中等 | ≤60% | 8 | 11 |
| 7 | Double Trouble / 两翼告急 | Two wings and a bridge / 双翼桥梁 | Hard / 困难 | ≤56% | 10 | 13 |
| 8 | Bull in a Bathroom / 牛气洗手间 | Bull graph / 牛图 | Hard / 困难 | ≤50% | 12 | 15 |
| 9 | The Long Queue / 长廊大排队 | Five-node path / 五点路径 | Master / 大师 | ≤48% | 14 | 14 |
| 10 | Royal Flush / 皇家大冲关 | Triangle and corridor / 三角长廊 | Master / 大师 | ≤48% | 16 | 16 |

## 中文游玩指南

**平均分担，全部达标，痛快一冲。**

《冲冲大作战》是一款独立的图平均分配小游戏。图上的每个顶点都是一个小马桶，污物量以百分比显示。当前版本共有十关，从简单到大师，**试玩版十关全部开放**，可以随时选择关卡。

打开 `index.html` 即可游玩；也可以下载 `flush_hour.html` 后在浏览器中离线打开。两个文件内容完全一致，代码、样式、关卡和图案都已包含在文件内，无须安装、服务器或网络。

### 游戏规则

1. **点击水管上的任意位置。** 两端马桶的污物量会被平均分配，例如 80% 和 20% 变成 50% 和 50%。两端数值已经相等时，点击不消耗步数。
2. **在步数上限内，让所有马桶同时不超过本关上限。** 低于或等于上限都算达标，例如上限为 35% 时，恰好 35% 也合格。已达标的马桶再次分担后仍可能超标。
3. **通关后再冲水。** 通关会弹出祝贺窗口，点击冲水按钮，即可看到旋转水流与逐渐下降的数值，最终所有马桶归零。冲水是通关奖励，不消耗步数，也不能提前用来跳过谜题。

每个百分比表示对应马桶的装满程度，所有马桶的总量不必等于 100%。平均分配只会转移负担，保持总量不变；通关后的冲水才会清空总量。

### 操作与记录

- 提供**撤销、重开和两条思路提示**，游戏内不提供完整解法。
- **中 / EN** 切换语言时保留当前局面；关卡列表和选关窗口可直接进入任意一关。
- 键盘操作：**Tab** 选中水管，**Enter / 空格** 执行平均；**U** 撤销，**R** 重开，**H** 显示或隐藏提示。
- 音效默认关闭，可用声音按钮开启；动画尊重系统的减少动态效果设置。
- 以最少步数通关可获得**完美冲水**记录；其他正常通关同样有效。最后两关的步数上限恰好等于各自最少步数。
- 浏览器允许本地存储时，会保存当前进度和最好成绩。存储被禁用时仍可继续本次游玩；下载版与网页版的存档可能互相独立。

## Development / 开发

The game has no runtime dependencies. Building uses **Python 3.10+**, and automated checks use **Node.js 18+** with built-in modules only. No package installation or network access is needed.

游戏运行无外部依赖。构建需要 **Python 3.10+**，自动检查需要 **Node.js 18+**，仅使用内置模块，无须下载依赖。

### Build and check / 构建与检查

Run from the repository root:

```bash
python3 scripts/build.py
python3 scripts/build.py --check
node tests/run.cjs
```

`build.py` embeds the maintained source and level data into both `index.html` and `flush_hour.html`. The build is deterministic. `--check` fails if either committed output is missing or stale. Scripts also resolve their inputs correctly when invoked by absolute path from another working directory.

构建脚本将源码和关卡数据内嵌到两个 HTML 文件中，输出确定且内容一致。`--check` 会检测缺失或过期的生成文件。修改源码后，请重新构建并提交两个输出文件。

### Source map / 文件结构

| Path | Purpose / 用途 |
|---|---|
| `index.html` | Generated entry point for static hosting / 静态网站入口 |
| `flush_hour.html` | Identical generated offline game / 内容相同的离线游戏 |
| `src/template.html` | Bilingual interface, styles, and application flow / 双语界面、样式及应用流程 |
| `src/game-core.js` | Averaging rules, thresholds, formatting, and responsive geometry / 平均规则、上限判断、数值显示及布局 |
| `src/toilet-visual.js` | Inline toilet SVGs and flushing artwork / 马桶与冲水图案 |
| `data/levels.json` | The ten playable levels and conceptual hints / 十关数据与思路提示 |
| `scripts/build.py` | Reproducible HTML build / 可复现构建 |
| `tests/` | Arithmetic, application-state, and geometry checks / 规则、应用状态及几何检查 |
| `tests/fixtures/verification.json` | Exact solution certificates used only by developer checks; contains spoilers / 仅供开发检查的精确解法凭证，含剧透 |
| `tools/` and `scripts/verify_optima.py` | Optional independent shortest-solution proof tools / 可选最短解独立验证工具 |
| `.qa-output/` | Ignored, generated test reports and optional solver binaries / 不提交的测试报告与临时求解程序 |

The regular checks cover exact averaging, inclusive thresholds, boundary-sensitive percentage labels, certificate replays, saving and restoring progress, victory and flushing flows, bilingual switching, and 700 graph layouts. Application-state checks execute the actual built application using a deterministic DOM substitute; they are **not browser-rendering or screenshot tests**.

常规检查覆盖精确平均、包含等号的上限判断、临界数值显示、解法重放、存档恢复、胜利及冲水流程、语言切换，以及 700 种图形布局。应用状态检查执行真实构建代码，但使用确定性的 DOM 替身，**不代表浏览器截图或动画渲染检查**。

### Optional exact optimum verification / 可选最少步数验证

To reproduce the shortest-path proofs, install a C++17 compiler and run:

```bash
python3 scripts/verify_optima.py
```

Use `--compiler clang++` to select a different compatible compiler. The script compiles two separate exact-arithmetic search implementations, confirms a solution at each claimed minimum, excludes every shorter solution independently, and replays certificates with Python fractions. All generated binaries and reports stay under `.qa-output/`. This is optional; the game and normal checks do not need a compiler.

如需重新证明最少步数，可安装支持 C++17 的编译器后运行上述命令。脚本会编译两个独立的精确求解实现，确认最少步数解存在、排除所有更短解，并使用分数重放凭证。临时程序和报告仅写入 `.qa-output/`。这一步为可选项，游戏和常规检查均不需要编译器。

### Static hosting / 静态托管

Serve the repository root as a static site; `index.html` is the entry point. A `.nojekyll` file is included for GitHub Pages. No server-side application, API keys, environment variables, or deployment build step is required.

将仓库根目录作为静态网站托管即可，入口为 `index.html`。项目包含适用于 GitHub Pages 的 `.nojekyll`，不需要后端、API 密钥、环境变量或部署时构建。

To publish with GitHub Pages after the files are on `main`: open **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, then save. The repository’s Pages status will confirm when publication completes.

文件上传到 `main` 后，可在 **Settings → Pages** 中选择 **Deploy from a branch**，分支选 **main**，目录选 **/(root)**，然后保存。请以仓库中的 Pages 状态确认发布是否完成。
