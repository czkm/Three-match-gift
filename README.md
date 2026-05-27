# 小岛的修复日记

> "我把这里收拾好了。你可以来了。"
>
> ——献给小云，生日快乐 ☁️

一份用 **Vue 3 + JavaScript + Vite** 构建的三消修复游戏，是小坤送给小云的生日礼物。

玩家扮演白狼杰洛特（白鸦庄园的主人），在豆狸&粒狸的帮助下，用 9 天时间修复一座荒废的庄园——从庭院到星星客房，一砖一瓦地把它变成"家"的模样。

## 启动

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # 输出到 dist/
npm run preview  # 本地预览构建结果
```

## 测试快捷键（仅开发环境）

- `Cmd/Ctrl + I` → 道具测试面板（跳天、解锁成就、填充能量等）
- `Cmd/Ctrl + K` → 进入跳天输入，1.8 秒内按 `1–9` 跳到指定天
- `Cmd/Ctrl + J` → 测试解锁一个成就

## 玩法速览

| 项目 | 设计 |
|---|---|
| 棋盘 | 8×8，6 种资源（橙子🍊 / 木材🪵 / 石材🪨 / 黏土🧱 / 花卉🌸 / 星星碎片⭐） |
| 操作 | 鼠标拖拽方向锁定，或点击两次相邻方块交换 |
| 步数 | 每天 20 步（最低 14），耗尽进入夜幕，次日继续 |
| 天数 | 9 天，每天修复一栋建筑，解锁一项新能力 |
| 失败 | 无失败机制——步数耗尽可继续次日，进度保留 |
| 小猪 | 常驻同伴，每天首次点击=喂食，积累亲密度（0-10） |
| 结局 | 9 天修复完成 → 精灵许愿 → 三愿蜡烛仪式 → 生日海报 |

## 核心特色

### 🎁 标题赠礼
标题画面输入名字→豆狸&粒狸拦截→改写为"献给小云☁️"。输入"小云"触发专属彩蛋。

### 🐷 小猪同伴
庄园中漫步的常驻小猪，可交互：
- **点击**：每天第一次点 = 喂食，亲密度 +1（上限 10）
- **亲密度系统**：≥3 解锁亲昵反应，≥6 头顶常驻爱心💕，≥8 结尾海报台词变更
- **饰品**：收集的道具会作为挂件围绕小猪浮动
- **情绪**：根据每日修复评级（1-3★）展现不同心情

### 🕯️ 交互蜡烛仪式
结尾三愿环节——点击蜡烛逐一点亮，每亮一根揭示一个愿望：
1. 愿小云身体健康
2. 愿小云生活快乐
3. 愿小云平安幸福，永远和小坤生活在一起

第三愿点亮时触发心形粒子爆发💗

### 🎨 下载纪念品
结尾可生成并下载三样纪念品：
- **生日贺卡** 💌：A6 竖版，含蜡烛 + 三愿 + "献给小云☁️——小坤"
- **生日海报** 📸：完整游戏历程总结，含道具网格 + 小猪留言
- **报酬收据** 🧾：收银机风格的薪资收据

### 40+ 动物森友会音效
全 AC 音效池（159 个 WAV），涵盖 BGM、环境、UI、昆虫、角色表情等。
BGM 随天数阶段自动切换（上午→下午→傍晚→仪式→黎明→节庆）。

### 14 项成就
涵盖天数推进、资源收集、能力使用、隐藏彩蛋等维度，含金色隐藏成就"愛你的小坤"。

## 项目结构

```
src/
├── main.js                   # 入口，Pinia + mount
├── App.vue                   # 根据 phase 切换 Title/Game/Ending
│
├── data/
│   ├── content.js            # 9 天/9 能力/6 资源/成就/全部文案
│   ├── tutorial.js           # 新手引导（7 段对话）
│   └── copy/                 # 前端文案（hud/gameplay/common）
│
├── core/
│   ├── board.js              # 三消引擎（column-major tileString + regex 匹配）
│   └── eventBus.js           # mitt 事件总线
│
├── stores/
│   ├── gameStore.js          # Pinia：天数/步数/资源/能力/phase
│   └── achievementStore.js   # 成就系统（localStorage 持久化）
│
├── audio/
│   └── AudioManager.ts       # 音频管理（加载/播放/淡入淡出/节流）
│
├── composables/
│   ├── useAudio.ts           # BGM 场景切换
│   ├── useTileDrag.js        # 拖拽方向锁定
│   └── useTypewriter.js      # 打字机动画
│
├── components/
│   ├── Title.vue             # 标题画+赠礼输入
│   ├── GameContainer.vue     # 游戏主屏
│   ├── Ending.vue            # 结尾四幕（套房→生日夜→三愿→海报）
│   ├── LoadingScreen.vue     # 加载动画
│   ├── TutorialOverlay.vue   # 新手引导浮层
│   │
│   ├── Board/
│   │   ├── GameBoard.vue     # 棋盘容器（fill/swap/match/cascade）
│   │   ├── BoardTile.vue     # 单格方块
│   │   └── BoardEntity.vue   # 棋盘实体（怪物/道具等）
│   │
│   ├── HUD/
│   │   ├── DayHeader.vue     # 天数/建筑名/步数
│   │   ├── ResourceBar.vue   # 资源进度/消息
│   │   ├── AbilityBar.vue    # 能力栏+小猪星星
│   │   ├── AudioControls.vue # 音量控制
│   │   ├── Dialog.vue        # 打字机对话框
│   │   ├── EstateStrip.vue   # 庄园全景（小猪+建筑热点）
│   │   ├── EstatePetPig.vue  # 小猪组件（漫游/情绪/饰品）
│   │   ├── AchievementPanel.vue
│   │   ├── AchievementToastStack.vue
│   │   ├── DayEndOverlay.vue
│   │   ├── RepairOverlay.vue
│   │   ├── PerDayCutscene.vue
│   │   ├── RewardRoomOverlay.vue
│   │   ├── DjinnCeremonyOverlay.vue
│   │   └── cutscenes/        # 9 天过场动画
│   │       ├── Day1Raven.vue
│   │       ├── Day2Vines.vue
│   │       ├── Day3Cork.vue
│   │       ├── Day4Roach.vue
│   │       ├── Day5Lilac.vue
│   │       ├── Day6Greenhouse.vue
│   │       ├── Day7Sunset.vue
│   │       ├── Day8Hearth.vue
│   │       └── Day9Homecoming.vue
│   │
│   └── ui/
│       └── CbModal.vue       # 通用模态框
│
├── utils/
│   ├── guid.js               # 唯一 ID 生成
│   └── timing.js             # 延时/帧率工具
│
└── assets/
    ├── tokens.css             # 色调/时序变量
    ├── global.css             # 页面框架
    ├── tile.css               # 方块渐变+状态
    └── animations.css         # 花瓣/晨风/星光/传送门
```

## 9 天能力对照

| 天 | 建筑 | 能力 | 类型 | 效果 |
|---:|------|------|------|------|
| 1 | 前院🌿 | 白狼整备 | 主动×1 | 直接重排棋盘 |
| 2 | 果园🍊 | 陶森特丰收 | 主动×1 | 点选一种资源→周围 3×3 全变同种 |
| 3 | 储藏室🛢️ | 旧桶陈香 | 被动 | 累计 5 组消除→+1 步 |
| 4 | 牧场🐎 | 萝卜识途 | 主动×2 | 任选两块交换，不限相邻 |
| 5 | 花圃🪻 | 丁香播种 | 主动×1 | 资源 A→资源 B 全盘转换 |
| 6 | 温室🌱 | 暖房滋养 | 被动 | ≥4 连时本组资源 +50% |
| 7 | 广场🌅 | 陶森特日落 | 主动×1 | 棋盘外侧出现行/列消除按钮 |
| 8 | 厨房🍲 | 炉火炖汤 | 主动×1 | 当前步数 +5（封顶 20） |
| 9 | 星星客房🛏️ | 紫丁香归途 | 被动 | ≤5 步时高亮可消除交换 |

## 成就一览

| # | 成就 | 稀有度 |
|---|------|--------|
| 1 | 第一锹土 | common |
| 2 | 果树下 | common |
| 3 | 酒桶深处 | common |
| 4 | 回廊 | common |
| 5 | 花圃之间 | rare |
| 6 | 暖房 | rare |
| 7 | 等风来 | rare |
| 8 | 炉火边 | rare |
| 9 | 星光满屋 | epic |
| 10 | 一步之遥 | common |
| 11 | 阳光满溢 | rare |
| 12 | 三愿 | epic |
| 13 | 星星的归途 | epic |
| 14 | 愛你的小坤 | gold |

## 设计取舍

- **全部 DOM，无 Canvas**：更好的可访问性、首屏轻量
- **棋盘逻辑与渲染解耦**：EventBus 投递 `draw[*]`，渲染端回报 `graphicsActionComplete` 后才推进下一 tick
- **资源结算**：连锁 +10%、四连 +1、五连 +3、暖房 +50% 叠乘
- **无失败、无存档**：步数耗尽只切换浮层，刷新即重新开始

## 致谢

- 三消引擎参考 [doublespeak games / gridland](https://github.com/doublespeakgames/gridland)
- 音频素材来自 *Animal Crossing: New Horizons*（任天堂）
- 游戏献给小云，生日快乐 ☁️

> 果園的盡頭~是一封終於寄到的信狸！
