# Corvo Bianco · 当前项目交接文档

这份文档面向下一个接手本项目的 LLM / 代码代理。

目标不是介绍“理想设计”，而是尽量用当前代码的真实状态回答下面几个问题：

- 这个项目现在到底是什么
- 网站/游戏当前的视觉设计和体验结构是什么
- 玩家进入后会经历什么流程
- 核心状态、棋盘、怪物、愿望、成就系统如何串起来
- 哪些 README / 旧文档内容已经不再准确
- 哪些地方最容易误判

请优先信任代码，其次再看这份文档；不要只依赖 `README.md`。

---

## 1. 项目本质

`corvo-bianco` 是一个基于 Vue 3 + Pinia + Vite 的单页叙事型三消网页游戏。

它不是多页面网站，也不是传统轻量三消 Demo。当前真实体验是：

- 标题页带“题献输入被杰洛特改写”的演出
- 主游戏页采用三栏 HUD + 中央棋盘布局
- 玩家以“9 天修复白鸦葡萄园”为主线推进
- 三消只是核心交互手段，不是唯一表达
- 游戏已经接入怪物机制、迪精愿望线、成就系统、结局演出

项目的情绪核心是：

> 不是“完成关卡”，而是“把一个曾经有人住过的地方，一点点修回到能等待某个人归来的状态”。

---

## 2. 技术栈与运行方式

当前技术栈很轻：

- Vue 3
- Pinia
- Vite
- JavaScript
- 自定义事件总线

关键文件：

- [package.json](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/package.json)
- [vite.config.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/vite.config.js)
- [src/main.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/main.js)

运行特征：

- Vite dev server 默认 `5174`
- `strictPort: false`
- `open: true`

也就是说本地开发时会自动尝试打开浏览器。

---

## 3. 当前网站的整体设计语言

这是一个“礼物型、叙事型、轻游戏型网页”，不是现代工具面板风格。

### 3.1 视觉气质

关键词：

- 温柔
- 复古
- 羊皮纸
- 暖金棕
- 紫丁香
- 日落感
- 低素材高氛围

整体风格偏《巫师 3》里陶森特 / 白鸦葡萄园的尾声浪漫感，但用非常低成本的网页手段来实现。

### 3.2 视觉实现手段

几乎没有图片资产，主要靠：

- CSS gradients
- CSS box-shadow / blur / blend
- CSS animation
- emoji
- 少量 JS 时序控制

主要样式文件：

- [src/assets/tokens.css](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/assets/tokens.css)
- [src/assets/global.css](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/assets/global.css)
- [src/assets/tile.css](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/assets/tile.css)
- [src/assets/animations.css](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/assets/animations.css)

### 3.3 色彩系统

`tokens.css` 通过 `body[data-day]` 和 `body[data-phase]` 推进整站背景色调。

大致节奏：

- Day 1-2：浅金 / 枯绿 / 土棕
- Day 3-4：暖黄 / 木色 / 石色
- Day 5-6：花园绿 / 丁香紫
- Day 7-8：夕阳橙 / 深紫
- Day 9 / ending：橙红 / 葡萄紫 / 暖室内光

### 3.4 通用材质

全站大量使用：

- `.parchment`
- `.grain`
- `.ink-title`
- `.ink-subtle`

这些类是整个 UI 的共同语法，HUD、弹层、标题卡片、结局卡片、成就面板都共享这套语言。

### 3.5 棋盘 Tile 风格

棋盘资源块不是平面色块，而是材质渐变板：

- 葡萄：紫色果感
- 木材：重复木纹
- 石材：灰石面
- 陶土：砖面
- 草药：叶面绿
- 魔力：金紫发光

见 [src/assets/tile.css](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/assets/tile.css)。

### 3.6 动效语言

动效以“轻、慢、呼吸感”为主，不走快节奏爆闪路线。

重复出现的母题：

- 花瓣
- 羽毛
- 微光
- 晨风
- 暖灯
- 夕阳扫光

---

## 4. 玩家完整流程

### 4.1 标题页

组件：

- [src/components/Title.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Title.vue)

玩家看到：

- `Corvo Bianco / 白鸦葡萄园`
- 引语
- “送给谁”的输入框
- 快捷预设按钮
- 成就入口

但它不是普通开始页。真实流程是：

1. 玩家输入赠礼对象
2. 点击“开始修复”
3. 进入“杰洛特插话”阶段
4. 用户输入会被划掉
5. 最终题献会被强制改写为 `献给小芸。`
6. 之后才调用 `game.start()`

因此标题页本身已经是一段剧情演出，不只是表单。

### 4.2 主游戏页

主容器：

- [src/components/GameContainer.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/GameContainer.vue)

整体布局：

- 顶部：`DayHeader`
- 左侧：`ResourceBar`
- 中间：`GameBoard`
- 棋盘下：`EstateStrip`
- 右侧：`AbilityBar`

这就是玩家停留时间最长的主界面。

### 4.3 每日循环

正常日流程如下：

1. 进入当天 intro 状态
2. 左侧 message box 显示当日场景文案
3. 玩家点击后进入 `playing`
4. 在 8x8 棋盘中进行三消
5. 收集当天建筑所需资源
6. 触发能力、怪物、提示、环境反馈
7. 若需求满足，则进入修复过场
8. 若步数耗尽，则进入 day-end 浮层

注意：本项目“步数耗尽”不是失败，只是温柔地切到次日继续。

### 4.4 修复过场

组件：

- [src/components/HUD/PerDayCutscene.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/PerDayCutscene.vue)
- [src/components/HUD/cutscenes/Day1Raven.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/cutscenes/Day1Raven.vue)
- [src/components/HUD/cutscenes/Day2Vines.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/cutscenes/Day2Vines.vue)
- [src/components/HUD/cutscenes/Day3Cork.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/cutscenes/Day3Cork.vue)
- [src/components/HUD/cutscenes/Day4Roach.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/cutscenes/Day4Roach.vue)
- [src/components/HUD/cutscenes/Day5Lilac.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/cutscenes/Day5Lilac.vue)
- [src/components/HUD/cutscenes/Day6Greenhouse.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/cutscenes/Day6Greenhouse.vue)
- [src/components/HUD/cutscenes/Day7Sunset.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/cutscenes/Day7Sunset.vue)
- [src/components/HUD/cutscenes/Day8Hearth.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/cutscenes/Day8Hearth.vue)
- [src/components/HUD/cutscenes/Day9Homecoming.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/cutscenes/Day9Homecoming.vue)

每一天不是复用同一个过场，而是有独立 motif。

过场里通常会发生：

- 环境 motif 播放
- 建筑完成 banner 出现
- 对应能力显示
- 杰洛特 monologue 打字机展示
- 玩家点击继续，进入下一天或结局

### 4.5 第 9 天：迪精与愿望线

这是当前项目最特殊的一段逻辑。

和前 8 天不同，第 9 天需求满足后不会直接完成，而是返回 `'djinn'` 分支，随后进入愿望链。

相关数据和逻辑：

- [src/data/content.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/data/content.js)
- [src/stores/gameStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/gameStore.js)
- [src/components/HUD/WishOverlay.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/WishOverlay.vue)

流程：

1. Day 9 出现迪精实体
2. 玩家通过命中封印外圈推进 3 个阶段
3. 每推进一阶段就进入一次 `wish` 浮层
4. 第 1 愿固定是驱散庄园怪物
5. 第 2 愿三选一：
   - 降低当前修复需求
   - 立刻 +5 步并获得后续资源增益
   - 提高“萝卜识途”当日次数
6. 第 3 愿固定 `bind-fate`
7. 第 3 愿会直接释放迪精并把最终建筑资源补满
8. 然后进入 Day 9 的最终修复与结局

### 4.6 结局页

组件：

- [src/components/Ending.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Ending.vue)

玩家会看到：

- 露台 silhouette
- 夕阳天空
- 紫丁香传送门
- 叶奈法出现
- 五句对白逐条显示
- 被划掉的原题献
- 最终题献
- 祝福语

最后可点击“再开一座葡萄园”回到标题页。

---

## 5. 页面与组件层级

### 5.1 根入口

- [src/main.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/main.js)
- [src/App.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/App.vue)

`App.vue` 是全局 phase 路由器。

真实分流：

- `title` -> `Title.vue`
- `intro / playing / targeting / dayEnd / repairing / wish` -> `GameContainer.vue`
- `ending / final` -> `Ending.vue`

全局常驻：

- `AchievementToastStack`
- `AchievementPanel`

`App.vue` 还负责：

- 初始化成就 store
- 处理测试快捷键
- 把 `data-day` / `data-phase` 写到 `body`

### 5.2 主游戏容器

- [src/components/GameContainer.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/GameContainer.vue)

负责装配：

- `DayHeader`
- `ResourceBar`
- `GameBoard`
- `EstateStrip`
- `AbilityBar`
- `DayEndOverlay`
- `WishOverlay`
- `PerDayCutscene`

注意：

- `intro` 阶段是一个全屏透明点击层，不是单独 intro 页面
- `GameBoard` 是常驻的，跨天保留挂载

### 5.3 顶部栏

- [src/components/HUD/DayHeader.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/DayHeader.vue)

显示：

- 品牌名
- 第几天
- 当前建筑中英文名与 emoji
- 当前步数

### 5.4 左侧栏

- [src/components/HUD/ResourceBar.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/ResourceBar.vue)

它不是纯进度条，而是“进度 + 叙事/系统提示复合栏”。

上半部分：

- 当前建筑资源需求条

下半部分 message box 会根据状态切换：

- 当天 intro 文案
- 杰洛特 bark
- 怪物情报
- 能力 targeting 指令
- 迪精提示
- 默认玩法建议

### 5.5 右侧栏

- [src/components/HUD/AbilityBar.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/AbilityBar.vue)

包含：

- 主动能力按钮
- 被动能力展示
- 丁香播种的资源转换面板
- 成就入口

成就入口已经不在顶部栏，而在这里。

### 5.6 棋盘

- [src/components/Board/GameBoard.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Board/GameBoard.vue)
- [src/components/Board/BoardTile.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Board/BoardTile.vue)
- [src/components/Board/BoardEntity.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Board/BoardEntity.vue)

这是交互最重的区域，负责：

- 玩家点击/拖拽
- Tile 动画
- 怪物/迪精显示
- 连锁反馈
- 目标能力操作
- 回合提交与后续结算

### 5.7 庄园场景条

- [src/components/HUD/EstateStrip.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/EstateStrip.vue)

这不是“装饰条”，而是核心氛围层。

它会：

- 根据已修复建筑数量推进整体庄园外观
- 提供互动 hotspot
- 响应棋盘侧的大组/能力爆发
- 补充“修复正在改变世界”的第二现场感

### 5.8 愿望页

- [src/components/HUD/WishOverlay.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/WishOverlay.vue)

这是一种独立的叙事覆盖层：

- 先逐句展示愿望叙事
- 再出现选择按钮
- 选择后显示 resolve 文案
- 结束后根据 `pendingWishPhase` 驱动回到棋盘、刷新棋盘或进入修复

### 5.9 结局页

- [src/components/Ending.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Ending.vue)

结局页本身就是一套独立场景和时序，不复用主游戏 HUD。

---

## 6. 状态机与主流程控制

### 6.1 游戏主状态

主状态在：

- [src/stores/gameStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/gameStore.js)

最关键字段是 `phase`：

- `title`
- `intro`
- `playing`
- `targeting`
- `wish`
- `repairing`
- `dayEnd`
- `ending`
- `final`

### 6.2 常规日流程

大致是：

1. `start()` 把游戏从 title 切到 `intro`
2. `GameContainer` 上的 intro overlay 被点击
3. `startPlay()` 把 phase 切到 `playing`
4. 玩家在 `GameBoard` 中做交换
5. 棋盘引擎完成所有级联
6. `maybeCommitTurn()` 调用 `game.onAfterMove()`
7. `onAfterMove()` 决定：
   - `complete`
   - `dayEnd`
   - `djinn`
   - `continue`
8. UI 根据新 phase 切相应 overlay

### 6.3 日终逻辑

步数耗尽后：

- `onAfterMove()` 会把 phase 切到 `dayEnd`
- `DayEndOverlay` 点击后调用 `advanceFromDayEnd()`
- 步数恢复到 20
- phase 回到 `playing`

这里不是跳到下一天，而是“当天资源没达标时，以温柔方式继续下一轮”。

### 6.4 修复逻辑

需求满足后：

- phase -> `repairing`
- `PerDayCutscene` 中调用 `game.finishRepair()`
- 该函数负责：
  - 解锁当天能力
  - 写入完成 banner / monologue
  - 记录最新修好的建筑
  - 触发成就检查
- 之后：
  - 若不是最后一天，则 `advanceFromRepair()` -> `nextDay()`
  - 若是最后一天，则进入结局

---

## 7. 棋盘系统

### 7.1 引擎位置

- [src/core/board.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/core/board.js)

这是独立三消引擎，不是单纯 Vue 状态数组。

继承了 Gridland 风格的表示法：

- 列优先 `tileString`
- `X` 分列
- `O` 代表 hole
- 正则扫描匹配

### 7.2 引擎与渲染的握手方式

通过：

- [src/core/eventBus.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/core/eventBus.js)

引擎发出：

- `draw`
- `tilesCleared`
- `tilesSwapped`
- `noMoreMoves`

Vue 渲染层消费这些事件，完成动画后回发：

- `graphicsActionComplete`

这是当前手感的关键。不要把它误改成“逻辑和 DOM 一步同步”，否则会破坏现有 cascade 节奏。

### 7.3 玩家输入方式

输入逻辑在：

- [src/composables/useTileDrag.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/composables/useTileDrag.js)

支持两种方式：

- 点击 A 再点击相邻 B
- 拖拽超 30px 阈值后方向锁定交换

### 7.4 棋盘支持的额外能力

当前不仅支持基础 swap，还支持：

- 刷新全盘
- 任意两格交换
- 3x3 变葡萄
- 全资源 A -> B
- 整行/整列消除
- 被愿望释放格子后重新坍塌

这些都由 `GameBoard` 暴露方法给 `AbilityBar` / `WishOverlay` 调用。

### 7.5 无可走步处理

`Board._noMoreMoves()` 会：

- 触发 `noMoreMoves`
- 自动 `refreshBoard('noMoves')`

也就是说当前已经有自动洗盘，不需要额外失败逻辑。

### 7.6 Hint 系统

`lilacReturn` 被动能力触发时会高亮一个可走步。

同时，玩家长时间 idle 时也会在 8 秒后亮出 hint。

相关逻辑在：

- `game.showHints`
- `board.findHint()`
- `GameBoard.refreshHints()`

---

## 8. 数据内容层

所有静态内容都集中在：

- [src/data/content.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/data/content.js)

这里包含：

- `RESOURCES`
- `ABILITIES`
- `DAYS`
- `DAY_END_LINES`
- `MONSTERS`
- `DAY_MONSTER_LAYOUTS`
- `DJINN_WISHES`
- `ESTATE_STRIP_STAGES`
- `ENDING`
- `ACHIEVEMENTS`

这是“策划总表”，很多系统的现实真相都在这里，而不是在 README。

---

## 9. 资源、天数与能力的真实现状

### 9.1 资源

当前 6 种资源：

- 葡萄 `g`
- 木材 `w`
- 石材 `s`
- 陶土 `c`
- 草药 `h`
- 魔力 `m`

资源不是 Day 1 就全部开放，而是随天数逐步解锁。

### 9.2 当前 9 天建筑

按代码顺序：

1. 庭院
2. 葡萄园
3. 酒窖
4. 马厩
5. 花园
6. 温室
7. 露台
8. 厨房
9. 紫丁香客房

### 9.3 当前能力顺序

请以代码为准：

1. Day 1 `whiteWolfTidy` 白狼整顿
2. Day 2 `toussentHarvest` 陶森特丰收
3. Day 3 `agedBarrel` 旧桶陈香
4. Day 4 `roachPath` 萝卜识途
5. Day 5 `lilacReturn` 紫丁香归途
6. Day 6 `greenhouseNurture` 暖房滋养
7. Day 7 `toussentSunset` 陶森特日落
8. Day 8 `lilacSeed` 丁香播种
9. Day 9 `hearthStew` 炉火炖汤

这一点和 `README.md` 不一致。README 里的能力顺序是旧版本。

---

## 10. 怪物系统

### 10.1 现状

怪物系统已经真实接入，不是文档设想。

当前有：

- 孽鬼
- 水鬼
- 食尸鬼
- 狮鹫幼雏
- 怨灵
- 迪精

### 10.2 表现层

普通怪物以 tile / entity 双层呈现：

- Tile 负责占格、参与棋盘
- `BoardEntity` 负责额外大型视觉表现，尤其是迪精

### 10.3 规则层

每种怪物都定义了：

- UI 标签
- 弱点提示
- 压力提示
- 受击规则
- 回合末骚扰规则
- 击退奖励

例如：

- 孽鬼：正交贴身命中
- 水鬼：正上/正下的纵向命中
- 食尸鬼：脚下清空或同行横向擦到
- 狮鹫幼雏：同排 4 连及以上
- 怨灵：需要高质量命中或连锁

### 10.4 回合末压力

`applyMonsterPressure()` 会在棋盘空闲后执行：

- 边缘跳
- 下沉
- 上飞
- 脚下腐土
- 恢复护纱

这是常规回合的一部分，不是独立战斗界面。

---

## 11. 第 9 天迪精系统

### 11.1 形式

迪精不是普通单格怪物，而是 2x2 实体，占据 `boardEntities`。

### 11.2 受击机制

命中条件分 3 段：

- 第 1 段：普通正交命中外圈
- 第 2 段：纵向命中外圈特定边
- 第 3 段：连锁 >= 2 或 4 连以上命中外圈

每命中一次：

- `hitsTaken + 1`
- 如果超过已结算阶段，就进入对应愿望页

### 11.3 愿望页的状态转移

`WishOverlay` 结束后可能触发：

- 回到 `playing`
- `refreshBoard`
- 释放某些格子并坍塌
- 直接切到 `repairing`

这里是全项目最不适合“只改一个文件”的区域，改动通常要同时看：

- `gameStore`
- `WishOverlay`
- `GameBoard`
- `content.js`

---

## 12. 成就系统

### 12.1 位置

- [src/stores/achievementStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/achievementStore.js)
- [src/components/HUD/AchievementPanel.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/AchievementPanel.vue)
- [src/components/HUD/AchievementToastStack.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/AchievementToastStack.vue)

### 12.2 功能

成就系统已经具备：

- 本地持久化
- 面板展示
- 隐藏成就遮罩
- 稀有度样式
- 解锁 toast
- 测试解锁快捷键

### 12.3 持久化范围

当前只有成就走 `localStorage`。

key：

- `corvo-bianco.achievements.v1`

游戏本体没有完整 run 存档。

---

## 13. Estate Strip 场景条

### 13.1 它为什么重要

[src/components/HUD/EstateStrip.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/EstateStrip.vue) 是当前 UI 的第二核心。

它承接了：

- 庄园整体修复的可视化
- 轻交互热点
- 环境反馈
- 氛围演出
- 棋盘外的世界连续性

### 13.2 当前已实现的元素

随修复阶段会逐步出现或变化：

- 门柱白鸦
- 葡萄藤
- 酒窖灯火
- 萝卜
- 蝴蝶
- 温室玻璃与灯
- 露台椅子
- 厨房炊烟与搅汤剪影
- 紫丁香客房窗帘与花瓶

### 13.3 事件联动

它会监听 `sceneBurst`，响应棋盘里的大组或能力触发。

这意味着它不是“静态插画”，而是和游戏过程联动的副舞台。

---

## 14. 标题页与结局页的私人化表达

### 14.1 标题页

当前题献逻辑带明确私人表达：

- 玩家可以输入
- 但最终会被改写
- 最终写入 store 的是固定题献

### 14.2 结局页

结局会显示：

- 被划掉的原输入
- 固定题献
- 祝福语 `也祝小坤和小芸的命运永远相连。`

所以这个项目当前不是“可完全泛化的空白模板”，而带强烈定制礼物属性。

如果后续要泛化产品，这一段需要重新设计，而不是只改几个文案字符串。

---

## 15. 测试与开发辅助

### 15.1 当前已接入快捷键

见 [src/App.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/App.vue)：

- `Cmd/Ctrl + K` 后接 `1-9`：测试跳天
- `Cmd/Ctrl + J`：测试解锁一个成就

### 15.2 代码里存在但当前未绑定的测试能力

`gameStore` 里还有：

- `skipDayForTesting()`

但我没有在现有 UI / 键位里看到它被绑定使用。

---

## 16. 旧文档与真实代码的差异

### 16.1 README 已经过时的点

[README.md](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/README.md) 有参考价值，但不能当真相。

已知偏差包括：

- 能力解锁顺序与当前代码不一致
- README 没完整反映怪物系统和迪精愿望线的复杂度
- README 仍列出 `RepairOverlay.vue` 这类旧结构

### 16.2 旧组件残留

[src/components/HUD/RepairOverlay.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/RepairOverlay.vue) 目前存在，但我没有看到它在当前页面流中被使用。

当前修复过场实际走的是：

- `PerDayCutscene.vue`

### 16.3 可疑残留字段

`repairProgressPct` 在这些地方被读取：

- [src/components/Board/GameBoard.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Board/GameBoard.vue)
- [src/components/HUD/EstateStrip.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/EstateStrip.vue)

但我没有在 `gameStore` 中找到对应定义。

这说明它很可能是旧版本遗留 hook，目前读取结果大概率恒为 `0`。

### 16.4 未消费事件

`GameBoard` 在结算后会发：

- `repairBegin`
- `dayEndBegin`

但当前仓库中我没有查到其他监听者。

它们目前更像是预留事件，而不是正在生效的核心路径。

---

## 17. 最容易误判的点

1. 这不是一个普通三消网站，而是一个单页叙事游戏。

2. 标题页不是普通开始页，题献改写演出是当前产品表达的一部分。

3. 第 9 天不是“资源够了 -> 直接结局”，而是要走迪精三阶段愿望线。

4. 棋盘不是直接由 Vue 数组驱动，而是独立引擎 + EventBus + 动画完成回调的架构。

5. `EstateStrip` 不是装饰组件，它是项目氛围与叙事闭环的重要组成部分。

6. README 不等于现状，尤其是能力顺序和系统复杂度。

7. 项目当前带私人定制文案，不是完全中性模板。

8. 有一些旧文件和残留 hook 仍在仓库里，修改前要先确认是否真的还接线。

---

## 18. 接手建议：优先阅读顺序

如果下一个 LLM 需要快速进入状态，建议按这个顺序读：

1. [src/App.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/App.vue)
2. [src/stores/gameStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/gameStore.js)
3. [src/data/content.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/data/content.js)
4. [src/components/GameContainer.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/GameContainer.vue)
5. [src/components/Board/GameBoard.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Board/GameBoard.vue)
6. [src/core/board.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/core/board.js)
7. [src/components/HUD/EstateStrip.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/EstateStrip.vue)
8. [src/components/Title.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Title.vue)
9. [src/components/HUD/WishOverlay.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/WishOverlay.vue)
10. [src/components/Ending.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Ending.vue)
11. [src/stores/achievementStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/achievementStore.js)

---

## 19. 一句话总结给下一个 LLM

当前项目是一个高度定制、情绪明确的单页叙事三消网页游戏：前端不重、视觉全靠 CSS 与 emoji，但系统上已经形成了“标题演出 -> 9 天修复 -> 怪物与能力推进 -> 第 9 天迪精愿望线 -> 结局题献”的完整闭环。真正要小心的不是“功能缺不缺”，而是不要被 README 和旧残留结构带偏，要始终以 `gameStore + content.js + GameBoard + EstateStrip + WishOverlay` 这条主链路为准。
