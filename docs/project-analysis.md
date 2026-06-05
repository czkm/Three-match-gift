# 项目分析文档

分析日期：2026-06-04

## 1. 项目定位

这是一个使用 Vue 3、Pinia、Vite 构建的单页三消修复游戏。项目主题是“小岛的修复日记”，玩家通过 9 天三消关卡推进庄园修复、解锁能力、收集奖励道具、小猪亲密度、迪精仪式和生日结局。

项目不是通用三消模板，而是强叙事、强资源表驱动的定制游戏。多数“内容”集中在 `src/data/content.js` 和 `src/data/copy/`，多数“状态和规则”集中在 `src/stores/gameStore.js`，棋盘动画和交互集中在 `src/components/Board/GameBoard.vue`。

## 2. 技术栈和运行命令

- 前端框架：Vue 3，`<script setup>`
- 状态管理：Pinia
- 构建工具：Vite
- 音频：自定义 `AudioManager`
- 图片下载：`html2canvas`
- 事件桥接：自定义 `EventBus`

常用命令：

```bash
npm install
npm run dev
npm run build
npm run preview
```

开发服务器配置在 `vite.config.js`，默认端口是 `5174`，`base: './'` 适配静态部署。

## 3. 整体目录结构

```text
.
├── package.json                 # 依赖和 npm scripts
├── vite.config.js               # Vite 配置、@ -> src 别名、开发端口
├── index.html                   # 应用挂载入口
├── README.md                    # 项目介绍和玩法说明
├── deploy.sh                    # 手动部署脚本，force push 到外部仓库 main
├── .github/workflows/
│   └── deploy-pages.yml         # GitHub Pages 自动部署，监听 qianxin 分支
├── public/
│   ├── img/                     # 棋子、背景、技能、怪物、成就、礼物图
│   └── audio/                   # 动森和 Isaac 音效资源
└── src/
    ├── main.js                  # Vue app + Pinia + 全局 CSS
    ├── App.vue                  # 顶层 phase 路由、加载屏、测试面板、全局控件
    ├── assets/                  # 全局样式、动画、棋子样式、设计 token
    ├── audio/AudioManager.ts    # BGM、SFX、环境音加载和播放
    ├── composables/             # 音频同步、拖拽、打字机
    ├── core/
    │   ├── board.js             # 三消引擎
    │   └── eventBus.js          # 自定义事件总线
    ├── data/
    │   ├── content.js           # 资源、能力、道具、天数、怪物、结局、成就
    │   ├── tutorial.js          # 新手引导
    │   └── copy/                # HUD、玩法、通用文案
    ├── stores/
    │   ├── gameStore.js         # 主游戏状态和规则
    │   └── achievementStore.js  # 成就状态、localStorage 持久化
    ├── components/
    │   ├── Title.vue            # 标题和献词改写
    │   ├── GameContainer.vue    # 游戏主界面布局
    │   ├── Ending.vue           # 结局、多幕仪式、礼物和下载图片
    │   ├── LoadingScreen.vue
    │   ├── TutorialOverlay.vue
    │   ├── Board/               # 棋盘和棋子渲染
    │   ├── HUD/                 # 资源、能力、天数、庄园、过场、奖励房等
    │   ├── common/              # 通用小组件
    │   ├── ui/                  # 基础 UI 组件
    │   └── Scenes/              # 当前为空目录
    └── utils/                   # guid、timing
```

## 4. 顶层运行流程

入口链路：

```text
index.html
  -> src/main.js
    -> App.vue
      -> Title / TutorialOverlay / GameContainer / Ending
```

`App.vue` 根据 `game.phase` 切换主界面。主要阶段如下：

```text
title            标题页
intro            每日开场叙事
playing          棋盘可操作
targeting        能力选目标
dayEnd           步数耗尽后的日终提示
repairing        每日修复过场
rewardChoice     奖励房选择
awakening        迪精苏醒
djinnTransition  迪精阶段转场
wish             迪精愿望/仪式卡片
ending           结局演出
final            最终定格
```

`GameContainer.vue` 是游戏期的布局容器，左侧资源，中央棋盘和庄园条，右侧能力栏。过场、奖励房、日终、迪精仪式浮层都挂在这里。

## 5. 核心模块职责

### 5.1 `src/data/content.js`

这是项目最重要的静态配置文件，包含：

- `RESOURCES`：棋盘资源类型、字符、图标、图片、手感参数
- `ABILITIES`：9 天能力和小猪能量能力
- `REWARD_ITEMS`：奖励道具、房间类型、品质、效果、代价
- `DAYS`：每天建筑、需求资源、能力、台词
- `MONSTERS`：怪物/障碍规则和 UI 文案
- `DAY_MONSTER_LAYOUTS`、`BARREN_GRAVE_LAYOUTS`：关卡布局
- `DJINN_WISHES`、`DJINN_CEREMONY_LAYOUTS`：迪精三阶段仪式
- `ENDING`：标题献词、结局文本、海报文本
- `ACHIEVEMENTS`：成就定义

后续修改内容、数值、关卡文案，优先看这里。

### 5.2 `src/stores/gameStore.js`

主状态和规则文件。它负责：

- 当前天数、步数、资源进度、已解锁能力
- 游戏阶段 `phase`
- 每日重置、过关、进入下一天
- 能力使用、奖励道具效果、小猪亲密度和能量
- 怪物/障碍命中、迪精仪式状态
- 测试快捷键需要调用的测试方法

这个文件很大，是当前项目最核心也最容易被误改的地方。修改玩法规则时，要先确认规则属于“数据配置”还是“状态行为”。能用 `content.js` 配置解决的，不要先改 store。

### 5.3 `src/core/board.js`

纯棋盘引擎，负责：

- 8x8 棋盘生成
- 三连检测
- 交换、回退、消除、下落、补新格
- 判断是否还有可走步
- 向渲染层发出 `draw` 事件

棋盘字符串是 column-major 格式，列之间用 `X` 分隔，空洞用 `O`。这个约定被 `GameBoard.vue` 依赖，不要随意改。

### 5.4 `src/components/Board/GameBoard.vue`

棋盘渲染和玩家交互中心，负责：

- 创建/销毁 `Board` 实例
- 处理鼠标、触摸拖拽和点击
- 将 `Board` 的 `draw` 事件转成 DOM 动画
- 动画结束后触发 `graphicsActionComplete`
- 监听 `tilesCleared` 后调用 `game.gainResources`
- 在棋盘完全稳定后调用 `game.onAfterMove`
- 暴露给能力栏的方法，例如重排、资源转换、资源收割

如果要改棋盘表现、动画、交互手感，主要改这里。  
如果要改三消算法，主要改 `core/board.js`。

### 5.5 `src/stores/achievementStore.js`

成就系统，负责：

- 从 `localStorage` 读取已解锁成就
- 根据事件追踪成就进度
- 解锁队列、成就面板、测试解锁

新增成就时，通常需要同时改 `content.js` 的 `ACHIEVEMENTS` 和这里的 `track()` / 私有追踪方法。

### 5.6 `src/audio/AudioManager.ts` 和 `src/composables/useAudio.ts`

`AudioManager.ts` 管音效映射、BGM、环境音、音量和节流。  
`useAudio.ts` 根据 `game.phase`、天数、迪精状态同步场景音乐。

新增音效先放入 `public/audio/`，再在 `AudioManager.ts` 增加 key；新增阶段音乐要同步更新 `useAudio.ts`。

## 6. 棋盘到状态的关键链路

核心链路如下：

```text
玩家拖拽/点击
  -> GameBoard.vue
    -> game.consumeStep()
    -> board.switchTiles()
      -> Board 发 draw('board.swap')
        -> GameBoard 播放交换动画
          -> EventBus.trigger('graphicsActionComplete')
            -> Board.checkMatches()
              -> Board 发 draw('board.match') 和 tilesCleared
                -> GameBoard.onTilesCleared()
                  -> game.gainResources()
                  -> game.recordDjinnBoardProgress()
                  -> maybeCommitTurn()
                    -> game.onAfterMove()
```

`Board` 不直接改 Pinia 状态，只通过事件通知。  
`GameBoard.vue` 是棋盘引擎和 Pinia 状态之间的桥。

重要事件：

- `draw`：棋盘引擎要求渲染层播放动画
- `graphicsActionComplete`：渲染层告诉引擎动画结束，可以继续下一步
- `tilesCleared`：消除完成，结算资源和连锁
- `tilesSwapped`：交换稳定，用于提示和回合提交
- `noMoreMoves`：无可走步，触发刷新
- `itemLineSweep`、`itemCellsPop`、`itemResourceBalance`：奖励道具触发棋盘特效
- `pigPenalty`、`pigRatingAwarded`、`itemEffectTriggered`：HUD 反馈事件

新增事件时必须成对处理：`onMounted` 绑定，`onBeforeUnmount` 解绑。

## 7. 后续修改应该怎么改

### 7.1 修改普通文案

优先位置：

- HUD/玩法提示：`src/data/copy/`
- 每日建筑、介绍、完成台词：`src/data/content.js` 的 `DAYS`
- 标题献词和结局文本：`src/data/content.js` 的 `ENDING`
- 新手引导：`src/data/tutorial.js`

如果文案是组件局部 UI 文案，再去对应 `.vue` 文件搜索。

### 7.2 修改某一天的资源需求或建筑信息

改 `src/data/content.js` 的 `DAYS`：

- `building`
- `needs`
- `ability`
- `intro`
- `completedBanner`
- `monologue`
- `pigLines`

注意：第 9 天和迪精逻辑里有多处 `currentDay === DAYS.length - 1` 判断。如果增减天数，不只是改 `DAYS`，还要检查 `gameStore.js`、`PerDayCutscene.vue`、`cutscenes/`、成就和奖励房。

### 7.3 新增或修改资源类型

需要同步检查：

- `content.js`：`RESOURCES`、`RESOURCE_BY_CHAR`、`unlockedCharsForDay`
- `public/img/chessPiece/`：资源图片
- `src/assets/tile.css`：棋子视觉
- `board.js`：资源字符是否会参与匹配
- `ResourceBar.vue`：展示是否符合预期

资源字符是棋盘算法的一部分，必须保持唯一且不要和 `X`、`O`、怪物字符冲突。

### 7.4 新增或修改能力

通常要改：

- `content.js` 的 `ABILITIES`
- `gameStore.js`：`canUseAbility()`、`consumeAbility()`、每日次数刷新逻辑、被动能力结算
- `AbilityBar.vue`：按钮点击后调用什么能力逻辑
- `GameBoard.vue`：如果能力需要操作棋盘，新增或复用 `defineExpose()` 方法，或者扩展 `targeting` 处理
- `public/img/skills/{abilityId}.png`：技能图标
- `AudioManager.ts`：能力音效

主动能力大致分三类：

- 不选目标：直接执行，例如加步数
- 选棋盘格：走 `game.beginTarget()` 和 `GameBoard.handleTargetingPick()`
- 从能力栏弹出选择面板：例如资源 A 转 B、奶茶收割

### 7.5 新增或修改奖励道具

通常要改：

- `content.js` 的 `REWARD_ITEMS`
- `gameStore.js` 顶部的 `FIXED_REWARD_OFFERS`
- `gameStore.js` 的道具效果分发：
  - `_applyDayStartItemEffects()`
  - `_applyOwnedItemGainEffects()`
  - `handleInvalidSwapReward()`
  - `applyDjinnItemProgressBonus()`
  - `_tryZeroStepRecovery()`
- `AudioManager.ts` 的 `ITEM_SFX_MAP`
- `public/img/isaac/{itemId}.png`
- `ResourceBar.vue` 和 `RewardRoomOverlay.vue` 展示效果是否足够

当前道具效果不是通用插件式系统，而是按 `effect.type` 在 store 里硬编码分发。新增 `effect.type` 必须在 store 里实现。

### 7.6 修改怪物、障碍或棋盘实体

通常要改：

- `content.js` 的 `MONSTERS`
- `content.js` 的 `DAY_MONSTER_LAYOUTS` 或 `BARREN_GRAVE_LAYOUTS`
- `gameStore.js`：实体创建、命中、奖励、压力逻辑
- `BoardEntity.vue`：实体展示
- `GameBoard.vue`：点击、hover、命中动画

被 `blockedCellKeys` 占用的格子会被棋盘引擎当成空洞处理，这会影响下落和补格。

### 7.7 修改结局、海报或下载图片

通常要改：

- `content.js` 的 `ENDING`
- `Ending.vue`：结局 act、蜡烛、礼物、海报、收据下载
- `public/img/gift.jpg`、`public/img/gift2.jpg`
- `html2canvas` 相关截图样式

`Ending.vue` 里有一段 `buildPosterHTML()` 手写 HTML/CSS 用于生成下载海报。修改最终海报时不要只改屏幕 DOM，也要同步改这里。

### 7.8 修改音频

通常要改：

- `public/audio/` 增加资源
- `AudioManager.ts` 增加 SFX 或 BGM key
- `useAudio.ts` 调整不同 phase 的 BGM/ambient
- 对应组件或 store 调用 `audioManager.playSFX()`

音频浏览器策略要求用户交互后才初始化，`useAudio()` 已处理这一点。

### 7.9 修改页面布局或视觉风格

优先位置：

- 全局变量：`src/assets/tokens.css`
- 页面框架：`src/assets/global.css`
- 棋子视觉：`src/assets/tile.css`
- 全局动画：`src/assets/animations.css`
- 局部组件样式：对应 `.vue` 的 scoped style

当前 UI 大量依赖固定宽度、绝对定位和动画时序。改布局后建议同时看桌面和窄屏。

### 7.10 新增成就

通常要改：

- `content.js` 的 `ACHIEVEMENTS`
- `achievementStore.js` 的追踪和解锁逻辑
- `public/img/achievements/` 增加图标
- `AchievementPanel.vue` / `AchievementToastStack.vue` 确认展示

如果成就和测试快捷键相关，注意测试快捷键会调用 `disableForCurrentRun('tester-shortcut')`，可能导致当前 run 不再解锁正常成就。

## 8. 部署和验证

本地验证建议：

```bash
npm run build
npm run dev
```

开发快捷键：

- `Cmd/Ctrl + I`：测试面板
- `Cmd/Ctrl + K` 后按 `1-9`：跳天
- `Cmd/Ctrl + J`：测试解锁成就

部署方式：

- GitHub Actions：`.github/workflows/deploy-pages.yml`，监听 `qianxin` 分支，构建后部署 Pages。
- 手动脚本：`deploy.sh` 会构建 `dist`，然后 force push 到 `git@github.com:czkm/three-match-gift.git` 的 `main`。这是破坏性部署脚本，使用前要确认目标仓库和分支。

## 9. 当前结构风险

- `gameStore.js` 和 `GameBoard.vue` 都很大，后续改动容易引入交叉影响。
- 道具效果通过多个 `effect.type` 分支硬编码，新增效果时容易漏 HUD、音效或棋盘动画。
- 自动化测试缺失，三消规则和状态流主要靠手动测试。
- 项目中部分逻辑对“9 天”和“最后一天”有隐式假设，扩展天数需要全面检查。
- `Ending.vue` 既负责屏幕 UI，也负责海报 HTML 生成，结局相关改动要同步两份展示。

## 10. 建议的修改原则

1. 先判断改动属于“内容配置”“玩法状态”“棋盘算法”“棋盘动画”还是“纯 UI”。
2. 内容和数值优先改 `content.js` / `copy/`。
3. 玩法规则改 `gameStore.js`，但不要在这里写 DOM 动画。
4. 棋盘算法改 `core/board.js`，但不要在这里直接操作 Vue 状态。
5. 棋盘动画和玩家交互改 `GameBoard.vue`。
6. 新增事件必须绑定和解绑成对出现。
7. 改 phase 时同步检查 `App.vue`、`GameContainer.vue`、`useAudio.ts`、`ResourceBar.vue`、`DayHeader.vue`。
8. 改完至少跑 `npm run build`，并用测试面板覆盖受影响天数。

## 11. 推荐后续重构方向

如果后续要持续加内容，建议逐步拆分：

- 把奖励道具效果从 `gameStore.js` 拆到独立 effect registry。
- 把迪精仪式状态从 `gameStore.js` 拆成单独模块。
- 给 `core/board.js` 增加最小单元测试，覆盖交换、消除、连锁、无可走步。
- 把 `Ending.vue` 的海报 HTML 生成抽成独立工具，减少屏幕展示和下载展示不一致。
- 清理空目录和系统文件，例如 `src/components/Scenes`、`.DS_Store`。
