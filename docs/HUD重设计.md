# HUD 重设计需求文档

> 文档对应日期：2026-05-06
> 上游依据：`动态展示需求.md`（场景系统）+ `优化文档.md`（PC 打磨方案）
> 设计基调：**会呼吸的庄园 / 进度藏在风景里 / 不催促 / 鼠标即羽毛**

## 〇、问题陈述

当前 `EstateStrip.vue` 与原始设计意图存在方向性偏差：

| 维度 | 设计文档要求 | 当前实现 | 偏差性质 |
| :--- | :--- | :--- | :--- |
| 场景结构 | 一气呵成的连续全景 | 9 段 grid + segment 分隔线 | **方向相反** |
| 尺寸 | 与棋盘等宽（480px）/ 高 120-150px | 680px / 高 242px | 宽 +42% / 高 +60% |
| 进度感 | 椅子 1→2、烟囱开始冒烟等环境变化 | "5/9" 数字 + phase-pill | 露白、催促 |
| 庄园剪影 | 单一全景图层 | 跨段绝对定位、与分隔线打架 | 视觉打架 |
| 旁白 | 屏底字幕条 | 挤在 strip-head 一行 | 拥挤 |
| 角色 | 全景固定锚点（白鸦巡视：门柱→酒窖→露台→栏杆） | 每段独立 hotspot | 失去叙事弧 |

DayHeader 与两侧栏（ResourceBar / AbilityBar）整体调性合理，仅需微调避免与新底部冲突。

## 一、版本规划

| 版本 | 范围 | 估算 |
| :--- | :--- | :--- |
| **V1（本次）** | EstateStrip 重写为连续全景；DayHeader 去 9/X；两侧栏视觉微调 | 约 1 个迭代 |
| **V2（后续批次）** | 双击彩蛋系统；白鸦巡视路径动画；步数低位字体微变（不变红） | 约 0.5 个迭代 |
| **V3（结局批次）** | 传送门粒子；叶奈法走出；白鸦落叶奈法肩；雨声字幕 | 约 0.5 个迭代 |

## 二、V1 详细规格

### 2.1 EstateStrip 总体布局

```
╔═══════════════════════════════════════════════════════╗  width: 540px
║                                          ☀️ 晨光     ║   ← .time-chip 浮动右上
║   ☁️       🕊                                          ║       padding 10px 14px 8px
║   ╱─╲    ╱╲    ╱──╲   主宅 ▓▓ 露台 🪑                 ║   ← .panorama
║   远山              ╔═══════════╗                      ║       全景区，单图层叠加
║                  ┌─┘西厢│ 主宅  └─┐  厨房 烟  🐝       ║       高 130px
║   马厩    葡萄园    花园    温室 💡        🍲          ║
║   🐎窗   🍇 🍇    🦋          (多锚点定位)              ║
║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║   ← 1px 地平线
║                                                       ║
║   ●  ●  ●  ●  ●  ○  ○  ○  ○                         ║   ← .day-beads 9 颗珠链
║   "床别太硬。枕头放两个。"                              ║   ← .subtitle 字幕条
╚═══════════════════════════════════════════════════════╝   total height: 184px
```

### 2.2 尺寸与布局参数

| 参数 | 值 | 来源 |
| :--- | :--- | :--- |
| `.estate-strip` 宽度 | **540px** | 与 DayHeader 对齐 |
| `.estate-strip` 高度（min） | 184px | scene 130 + beads 22 + subtitle 24 + padding 8 |
| `.panorama` 高度 | 130px | 接近 spec 上限 150 的下界 |
| `.panorama` 圆角 | 12px | 与 parchment 圆角呼应 |
| `.day-beads` 行高 | 22px | 12px 圆点 + 5px 上下 padding |
| `.subtitle` 行高 | 24px | 13px 字体 + 1.5 行高 |

### 2.3 时段角标（`.time-chip`）

- 位置：`position: absolute; top: 8px; right: 12px;`
- 尺寸：`padding: 4px 10px;` 圆角 999px
- 内容：`{emoji} {2-4字}`
- 4 阶段：

| 阶段 | 触发条件 | emoji | 文案 |
| :--- | :--- | :--- | :--- |
| morning | day ≤ 2 | ☀️ | 晨光 |
| day | 2 < day ≤ 6 | ☀️ | 白昼 |
| dusk | 6 < day ≤ 9 且非结局 | 🌅 | 傍晚 |
| lilac-glow | phase == 'ending' \|\| 第 9 天紫光触发后 | ✨ | 心跳 |

### 2.4 全景建筑锚点

去除 9 段切片。所有建筑作为绝对定位元素叠加在单一 `.panorama` 上，按 `displayStage` 控制 `opacity` + `filter:saturate()` 渐显（未修复=灰阶低饱和；修复后=完整色）。

| 建筑 | 解锁天数 | 锚点（左%, 底px） | 占位尺寸（w×h） | 关键元素 |
| :--- | :--- | :--- | :--- | :--- |
| courtyard 庭院 | 1 | left: 4%; bottom: 38px | 90×62 | 双门柱 + 横梁 + 喷泉（修复后水波） |
| vineyard 葡萄园 | 2 | left: 18%; bottom: 42px | 100×56 | 藤架 + 嫩绿点点（修复后） |
| stables 马厩 | 4 | left: 0%; bottom: 32px | 70×54 | 屋顶+窗户（萝卜🐎从此探头） |
| garden 花园 | 5 | left: 30%; bottom: 28px | 90×40 | 花坛+幼苗+紫色花苞 |
| cellar 酒窖 | 3 | left: 56%; bottom: 30px | 64×46 | 拱门+木桶+绿酒瓶 |
| greenhouse 温室 | 6 | left: 44%; bottom: 26px | 80×52 | 玻璃顶+暖灯（步数 ≤ 5 时闪烁） |
| 主宅 manor | always | left: 38%; bottom: 50px | 230×80 | 一气呵成；西厢 + 主屋 + 双坡屋顶 |
| gazebo 露台 | 7 | left: 70%; bottom: 78px | 60×34 | 一把椅 D7→两把椅 D9；栏杆白鸦栖息位 |
| kitchen 厨房 | 8 | left: 56%; bottom: 64px | 36×24 | 主宅一楼右窗（修复后暖橙光） + 烟囱炊烟 |
| lilacSuite 客房 | 9 | left: 78%; bottom: 84px | 32×20 | 主宅二楼最右窗 + 紫丁香花瓶 + 飘动窗帘 |

> 庄园剪影 (manor) 始终存在，但修复前仅显示外轮廓，灰阶；随建筑解锁逐步上色。

### 2.5 角色锚点（emoji actor）

固定百分比定位，使用 `<button class="emoji-actor" :style="{ left, top }">`：

| 角色 | 首现 | 锚点 | 行为 | 文案库 |
| :--- | :--- | :--- | :--- | :--- |
| 🕊 白鸦 | D1（迁移） | D1: 4% / 36%（门柱顶）<br>D3: 60% / 60%（酒窖）<br>D7: 76% / 32%（露台栏杆）<br>D9: 76% / 32%（露台不走） | 点击：羽毛迸射 + 飞走 1.2s（D9 不飞） | 见 spec 3.3 |
| 🐎 萝卜 | D4 | 5% / 36%（马厩窗） | 点击：响鼻 + 缩头 1.4s | 3 句循环（D8/D9 替换为特别版） |
| 🦋 蝴蝶 | D5 | 36% / 64%（花苞旁） | 点击：盘旋一圈再落下 | "蝴蝶飞起盘旋一圈，又轻轻落回花苞旁。" |
| 🐝 蜜蜂 | D8 | 60% / 56%（厨房外） | 不可点；循环飞动 | 无 |
| 🧍 杰洛特剪影 | D8 | 60% / 50%（厨房窗内） | 点击：搅锅一下 | "窗里的人影停了一下，又轻轻搅了搅锅。" |

### 2.6 进度珠链（`.day-beads`）

- 9 颗 `.bead`，水平等距排列（`display: flex; justify-content: space-around`）
- 三态：

| 状态 | 触发 | 视觉 |
| :--- | :--- | :--- |
| done | day < currentDay 且对应建筑已修 | 实心金色（`var(--gold-soft)`），8px 直径 |
| current | day == currentDay | 8px 实心 + 14px 外环呼吸光晕（`box-shadow` 脉冲 1.6s） |
| pending | day > currentDay | 6px 描边空心（`border: 1px solid var(--ink-soft)`），透明度 0.5 |

- 悬停：弹出 12px 字号 tooltip "第 N 天 · {建筑中文名}"，0.08s 内响应（参考优化文档 3.1 节）
- 点击：仅高亮对应建筑（`.scene-anchor.{building}` 添加 `.highlight` 类，淡金描边 1.2s）。**不切换场景**——因为是连续全景。

### 2.7 字幕条（`.subtitle`）

- 位置：紧贴珠链下方
- 字号：13px / 行高 1.5 / 颜色 `var(--ink)`
- 出现方式：内容变更时清空再打字机出现（每字 40ms），完成后停留 2.5s 然后淡出 500ms（落到 `defaultEstateCaption`）
- 触发源：
  1. 页面进入 → `defaultEstateCaption`（来自 `gameStore.monologue`）
  2. 鼠标悬停建筑/角色 → 对应 hotspot 文案
  3. `pendingEstateRevealId` 变化（修复完成）→ 该建筑首句 reveal 文案

### 2.8 时段滤镜

替换原 3 阶段（morning/day/dusk）为 4 阶段，并使用 `.scene-filter` 半透明蒙版：

| 阶段 | 触发 | 蒙版色 | 备注 |
| :--- | :--- | :--- | :--- |
| morning | day 1-2 | `rgba(255, 230, 170, 0.18)` 自上而下 | 雾感 |
| day | day 3-6 | `rgba(255, 245, 210, 0.10)` | 几乎无色，纯阳光 |
| dusk | day 7-8 | `rgba(214, 132, 58, 0.22)` 自下而上 | 沉橙金 |
| lilac-glow | day 9 \|\| ending | dusk + 叠加 `rgba(176, 148, 201, 0.18)` 顶部 | 紫光接结局 |

过渡：所有滤镜变更使用 `transition: background 800ms ease`，让时段感像呼吸而非硬切。

### 2.9 粒子分阶段（按 spec 4.1 严格对齐）

| 粒子 | 触发条件 | 当前实现 | 调整 |
| :--- | :--- | :--- | :--- |
| 薄雾 | day 1-2 | `displayStage >= 1 && <= 2` ✓ | 保持 |
| 金色光点 | day 2-9 白天 | `displayStage >= 2` | 加 `&& timeClass != 'time-dusk'` |
| 萤火虫 | day 3-9 且 stepsLeft ≤ 10 | `displayStage >= 3 && stepsLeft <= 10` ✓ | 保持 |
| 丁香花瓣 | day 5-9 | `displayStage >= 5` ✓ | 保持 |
| 炊烟 | day 8-9 | `displayStage >= 8` ✓ | 保持 |
| 蜜蜂 | day 8-9 | `displayStage >= 8` ✓ | 保持 |
| 传送门光点 | V3 实现 | 无 | V3 加 |

### 2.10 DayHeader 微调

- **保留**：当前天数 / 建筑 emoji + 中文名 / 步数
- **删除**："/ 9" 总数显式（避免与底部珠链重复表达）
- **改成**：仅显示 "第 N 天"（无分母）
- 步数低于 5 的提示：颜色保持暗金渐变到暖橙（不用红），符合优化文档 3.1 节

### 2.11 ResourceBar / AbilityBar

不动结构，仅检查：
- 圆角与新 EstateStrip 保持 6px 一致 ✓（已是）
- 边框颜色 `var(--gold)` 一致 ✓
- hover 微动画时长一致（180ms）✓
- 标题 `<h3>` 字号 14px / letter-spacing 0.08em 与 EstateStrip eyebrow 视觉同语 ✓

如发现 `.ab-btn` 的 `border` 比 EstateStrip 锚点描边重，可减半透明度。

## 三、V2 后续批次（不在本次实施）

### 3.1 双击彩蛋（来源：优化文档 2.4 节）

| 双击目标 | 效果 | 锚点 |
| :--- | :--- | :--- |
| 棋盘任意葡萄方块 | 葡萄串轻晃 + 落 2 片小叶 | GameBoard 内 |
| 场景中萝卜 | 萝卜缩回，3s 后又伸出 + 轻哼 | EstateStrip emoji-actor |
| 场景中白鸦 | 歪头看一眼 + 叫一声 + 飞走 10s 后回来 | EstateStrip emoji-actor |
| 露台两把椅子 | 椅子轻晃（"像有人坐下"） | EstateStrip 锚点 |
| 花瓶紫丁香 | 一片花瓣飘落出棋盘 | EstateStrip 锚点 |

### 3.2 白鸦巡视路径动画

- D1→D3 之间过渡：从门柱到酒窖飞行轨迹（贝塞尔曲线 1.2s）
- D6→D7：飞向露台
- D9：落定，不再起飞

### 3.3 步数 ≤ 5 视觉降级

DayHeader 步数字体微微变细（font-weight 700 → 600），颜色从 `--ink` 缓变到 `--clay-2`。无任何抖动 / 红色 / 感叹号。

## 四、V3 结局批次

### 4.1 传送门粒子

- 触发：第 9 天所有建筑修复 + phase 切到 ending
- 位置：庭院喷泉左侧（约 left: 12%, bottom: 50px）
- 紫色光点从地面向上聚拢，5s 后形成传送门轮廓

### 4.2 叶奈法走出

- 传送门成形 2s 后，emoji `🧙‍♀️` 从传送门走出（左移 60px）
- 同步：白鸦从露台飞起，落在叶奈法肩上

### 4.3 雨声字幕

- 黑屏后字幕条最后显示一行轻语 "雨快下了。"
- 实际不下雨；环境音雨声渐入（音频系统由 V3 引入）

## 五、验收标准

V1 完成判定：

- [ ] EstateStrip 宽度 540px / 高度 ≤ 200px
- [ ] 无 segment 分隔线，无 9 段 grid 结构
- [ ] 9 颗珠链可见，三态正确
- [ ] 字幕条独立，与 strip-head 不再争抢
- [ ] DayHeader 不再显示 "/ 9"
- [ ] 时段角标 4 阶段切换平滑（800ms）
- [ ] 9 天逐天人工跑一遍：Day 1 白鸦门柱 / Day 4 萝卜伸头 / Day 7 单椅 / Day 9 双椅 + 紫丁香窗帘
- [ ] `npm run build` 通过
- [ ] 视觉无 layout shift / 无控制台错误

## 六、风险与回退

| 风险 | 概率 | 应对 |
| :--- | :--- | :--- |
| 全景锚点在小屏幕（< 600px 视口）压缩失真 | 中 | `max-width: 92vw` 已有；进一步在 ≤ 600px 媒体查询里收 builder 锚点为 emoji-only fallback |
| 角色 emoji 在 Windows 上字形不一致（特别是 🕊 vs 🕊️） | 中 | 统一用 VS-15（无 emoji 修饰）以保字形稳定 |
| 字幕条打字机效果在快速切换天数时叠加 | 低 | watcher 内 clearTimeout 已实现 |
| 删除 segment 后旧的 cutscene 动画依赖 segment-glow class 失效 | 中 | PerDayCutscene.vue 检查后改用 anchor-glow 类 |

## 七、变更清单（V1）

| 文件 | 变更类型 | 说明 |
| :--- | :--- | :--- |
| `src/components/HUD/EstateStrip.vue` | 重写 | 全景 + 锚点 + 珠链 + 字幕 |
| `src/components/HUD/DayHeader.vue` | 微调 | 去 "/ 9" |
| `src/components/HUD/ResourceBar.vue` | 检视 | 仅核对，必要时微调 |
| `src/components/HUD/AbilityBar.vue` | 检视 | 仅核对，必要时微调 |
| `src/components/GameContainer.vue` | 不动 | 已支持 EstateStrip 自适应 |
| `docs/HUD重设计.md` | 新增 | 本文档 |
