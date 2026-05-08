# Corvo Bianco · 白鸦葡萄园

> "我把这里收拾好了。你可以来了。"

一份用 **Vue 3 + JavaScript + Vite** 构建的温柔三消修复游戏。
玩法、文案、视觉氛围严格按照 [`需求文档fix.md`](../需求文档fix.md) v2.1 实现，
手感、下落与连锁参考自 [`gridland-vue`](../../claudeWishterminal/gridland-vue) 项目（同源 column-major tileString + regex 匹配引擎）。

## 启动

```bash
cd corvo-bianco
npm install
npm run dev      # 默认 http://localhost:5174 (端口被占用时自动 +1)
```

构建产物 / 静态托管：

```bash
npm run build    # 输出到 dist/
npm run preview  # 本地预览构建结果
```

## 测试快捷键

- `Cmd/Ctrl + K` → 进入跳天输入，1.8 秒内继续按 `1–9` 跳到指定天
- `Cmd/Ctrl + J` → 测试解锁一个成就

## 玩法速览

| 项目 | 设计 |
| :--- | :--- |
| 棋盘 | 8×8，6 种资源（葡萄/木材/石材/陶土/草药/魔力） |
| 操作 | 鼠标拖拽 30 px 阈值方向锁定，或点击两次相邻方块 |
| 步数 | 每天 20 步；耗尽则次日继续，进度保留 |
| 关卡 | 9 天 9 个修复目标，对应 9 个解锁能力 |
| 失败 | 无失败、无战斗、无存档；通关即结束 |

## 项目结构

```
corvo-bianco/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.js                # 入口
    ├── App.vue                # 根据 phase 切换 Title/Game/Ending
    ├── data/content.js        # 9 天 + 9 能力 + 6 资源 + 全部文案
    ├── core/
    │   ├── board.js           # 三消引擎（column-major tileString + regex）
    │   └── eventBus.js        # mitt 事件总线
    ├── stores/gameStore.js    # Pinia：天数/步数/资源/能力/phase
    ├── composables/
    │   ├── useTileDrag.js     # 拖拽方向锁定（移植 gridland-vue）
    │   └── useTypewriter.js   # 打字机文案
    ├── components/
    │   ├── Title.vue          # 标题 + 赠礼文字输入
    │   ├── GameContainer.vue  # 游戏主屏（HUD + 棋盘 + 浮层）
    │   ├── Ending.vue         # 露台夕阳 / 紫色传送门 / 五句对白
    │   ├── Board/
    │   │   ├── GameBoard.vue  # 棋盘容器（fill/swap/match/cascade 渲染）
    │   │   └── BoardTile.vue  # 单个方块（CSS 渐变 + emoji）
    │   └── HUD/
    │       ├── DayHeader.vue  # 第 X 天 + 建筑名 + 步数
    │       ├── ResourceBar.vue
    │       ├── AbilityBar.vue # 主动 / 被动能力 + 资源转换面板
    │       ├── Dialog.vue     # 打字机对话框
    │       ├── RepairOverlay.vue
    │       └── DayEndOverlay.vue
    ├── utils/{timing,guid}.js
    └── assets/
        ├── tokens.css         # 9 天色调推进 / 资源色板 / 时序变量
        ├── global.css         # 页面框架
        ├── tile.css           # 6 种资源方块渐变 + 选中/提示状态
        └── animations.css     # 花瓣雨 / 晨风 / 修复光 / 白鸦 / 传送门
```

## 9 个能力对照

| 解锁日 | 能力 | 类型 | 入口 |
| :----- | :--- | :--- | :--- |
| 1 | 白狼整顿 | 主动 ×1 | 直接重排棋盘 |
| 2 | 陶森特丰收 | 主动 ×1 | 点选一个 🍇 葡萄 → 周围 3×3 全变葡萄 |
| 3 | 旧桶陈香 | 被动 | 累计 5 组消除 → +1 步 |
| 4 | 萝卜识途 | 主动 ×2 | 任选两块交换，不限相邻 |
| 5 | 丁香播种 | 主动 ×1 | 资源 A → 资源 B 全转 |
| 6 | 暖房滋养 | 被动 | 单组 ≥4 时本组资源 +50% |
| 7 | 陶森特日落 | 主动 ×1 | 棋盘外侧出现行/列按钮 → 直接消除 |
| 8 | 炉火炖汤 | 主动 ×1 | 当前步数 +5（封顶 20） |
| 9 | 紫丁香归途 | 被动 | 剩余 ≤5 步时高亮可消除交换 |

## 设计取舍

- **没有 Canvas，全部 DOM**：更好的可访问性、无图片资源、首屏 < 50 kB gzip。
- **棋盘逻辑与渲染解耦**：Board 通过 EventBus 投递 `draw[*]`，Vue 端在动画结束后回报 `graphicsActionComplete` 才推进下一个 tick——保留了原版 Gridland 的"踏实落子"节奏。
- **资源结算偏宽松**：连锁 +10%、4 连 +1、5 连 +3、暖房 +50% 叠乘，按章节 §5.2 设计。
- **没有失败、没有存档**：步数耗尽只切换浮层；首屏即新游戏。

## 致谢

参考项目：[doublespeak games / gridland](https://github.com/doublespeakgames/gridland) 与 [gridland-vue](../../claudeWishterminal/gridland-vue) — 三消手感的源头。

献给葡萄园的下一位访客。
