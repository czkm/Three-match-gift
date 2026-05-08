# Corvo Bianco Mechanics Audit

这份文档基于当前代码实现整理，目标是把 Corvo Bianco 的三消、步数、能力、Hint、怪物、迪精、经济曲线、操作手感、成就、残留代码问题一次性说明清楚。

审计范围主要包括：

- [src/core/board.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/core/board.js)
- [src/stores/gameStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/gameStore.js)
- [src/data/content.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/data/content.js)
- [src/components/Board/GameBoard.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Board/GameBoard.vue)
- [src/components/HUD/AbilityBar.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/AbilityBar.vue)
- [src/components/HUD/WishOverlay.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/WishOverlay.vue)
- [src/composables/useTileDrag.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/composables/useTileDrag.js)
- [src/stores/achievementStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/achievementStore.js)
- [src/utils/timing.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/utils/timing.js)
- [README.md](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/README.md)

---

## 第一部分：核心三消棋盘参数

### 1. 棋盘尺寸常量

代码中没有名为 `BOARD_WIDTH` / `BOARD_HEIGHT` 的显式常量，但真实尺寸固定为 `8 x 8`。

来源：

- [src/core/board.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/core/board.js)
  - `this.opts = { rows: 8, columns: 8, ...opts }`
- [src/stores/gameStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/gameStore.js)
  - `BOARD_ROWS = 8`
  - `BOARD_COLS = 8`
- [src/components/Board/GameBoard.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Board/GameBoard.vue)
  - `ROWS = 8`
  - `COLS = 8`

### 2. 资源 Tile 种类与标识符

来源：

- [src/data/content.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/data/content.js)

资源表：

| 资源 ID | 字符 | 中文 | Emoji |
| --- | --- | --- | --- |
| `grape` | `g` | 葡萄 | `🍇` |
| `wood` | `w` | 木材 | `🪵` |
| `stone` | `s` | 石材 | `🪨` |
| `clay` | `c` | 陶土 | `🧱` |
| `herb` | `h` | 草药 | `🌿` |
| `magic` | `m` | 魔力 | `✨` |

额外非普通资源格：

- 腐土：`ROT_CHAR = 'r'`
- 空洞：`HOLE = 'O'`
- 列分隔：`SEP = 'X'`

怪物字符：

- 孽鬼：`N`
- 水鬼：`D`
- 食尸鬼：`G`
- 狮鹫幼雏：`C`
- 怨灵：`W`

### 3. 每种资源的生成权重 / 概率

来源：

- [src/core/board.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/core/board.js)

真实逻辑不是“每种资源固定不同权重”，而是：

1. `_tileMap()` 给当前允许生成的每种资源统一基础权重 `2`
2. `fill()` 时，为避免初始 3 连，会根据左侧和上方相邻格临时降低某些字符的权重
3. `_generateTile(counts)` 用 `counts[k] / total` 做归一化随机

精确逻辑：

- `_tileMap()`:
  - 若当天允许资源集合为 `allowed`
  - 则 `for (const ch of allowed) m[ch] = 2`
- 初始化单格时：
  - 若左 1 格同字符，该字符 `counts[sib]--`
  - 若左 2 格同字符，再 `counts[sib]--`
  - 若上 1 格同字符，该字符 `counts[sib]--`
  - 若上 2 格同字符，再 `counts[sib]--`
- `_getTotal()` 会把负权重裁到 `0`
- `_generateTile()` 最终按归一化概率抽取

结论：

- 基础层面是当前开放资源的均权随机
- 实际落子时存在局部动态减权
- 不存在当天主打资源加权

### 4. 每日步数限制来源

来源：

- [src/stores/gameStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/gameStore.js)

关键常量：

- `MAX_STEPS = 20`

使用点：

- `start()` -> `stepsLeft = MAX_STEPS`
- `nextDay()` -> `stepsLeft = MAX_STEPS`
- `advanceFromDayEnd()` -> `stepsLeft = MAX_STEPS`

恢复步数技能：

- `hearthStew` -> `recoverSteps(5)`
- `recoverSteps(n)` 有上限裁切：`Math.min(MAX_STEPS, this.stepsLeft + n)`

### 5. 棋盘初始化时资源块数量分布逻辑

来源：

- [src/core/board.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/core/board.js)

`fill()` 流程：

1. 逐列逐行填充
2. 若该格被 entity 占用，填 `HOLE`
3. 若该格有 monster tile，占用 monster char
4. 否则：
   - 拿到当前允许资源集合
   - 初始化各资源权重 `2`
   - 检查左/上最多 2 格，降低可能造成 3 连的字符权重
   - 以更新后的权重随机抽一个资源

结论：

- 没有预设“每种资源总数”
- 没有预先洗牌后裁切
- 是逐格动态生成

### 6. 级联消除动画时序参数

来源：

- [src/utils/timing.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/utils/timing.js)
- [src/components/Board/GameBoard.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Board/GameBoard.vue)
- [src/assets/tokens.css](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/assets/tokens.css)

JS 调度常量：

| 参数 | 数值 |
| --- | --- |
| `TILE_TRANSFORM_MS` | `220` |
| `TILE_FALL_MS` | `260` |
| `FILL_DELAY_MS` | `90` |
| `SWAP_RETURN_MS` | `220` |
| `CLEAR_RETURN_MS` | `300` |
| `MATCH_RETURN_MS` | `420` |
| `MATCH_SHIFT_DELAY_MS` | `200` |
| `MATCH_DROP_DELAY_MS` | `320` |

额外停顿：

- `GameBoard.vue`
- `BIG_MATCH_BREATH_MS = 480`
- 仅在存在 `5+` 组时加入

具体含义：

- 单次交换动画调度：`220ms`
- 棋盘清空动画调度：`300ms`
- 单次匹配结算调度：`420ms`
- 匹配后真正做位移动作的延后：`200ms`
- 新块填充波次间隔：`90ms`
- `drawFill()` 总时长：
  - `(ROWS + COLS) * FILL_DELAY_MS + SWAP_RETURN_MS`
  - `(8 + 8) * 90 + 220 = 1660ms`
- `5+` 大组会额外多停 `480ms`

CSS 视觉 token：

| 变量 | 数值 |
| --- | --- |
| `--t-tile` | `200ms` |
| `--t-swap` | `240ms` |
| `--t-fall` | `260ms` |

注意：

- JS 调度时序和 CSS token 不是完全一致
- 实际流程推进以 `TIMING` 和 `graphicsActionComplete` 为准

### 7. 无可走步时的自动刷新逻辑

来源：

- [src/core/board.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/core/board.js)
- [src/components/Board/GameBoard.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Board/GameBoard.vue)

逻辑：

1. `checkMatches()` 在当前无匹配时：
   - 若 `lastSwitch` 存在，先回退错误交换
   - 否则检查 `_areMovesAvailable()`
2. `_areMovesAvailable()` 内部就是 `findHint() != null`
3. 若无可走步：
   - `_noMoreMoves()`
   - `EventBus.trigger('noMoreMoves')`
   - `refreshBoard('noMoves')`
4. `refreshBoard()`：
   - 清空 `tileString`
   - 发出 `draw -> board.clear`
   - 动画完成后重新 `fill()`

视觉层：

- `GameBoard.onNoMoreMoves()`
  - `shaking = true`
  - `400ms` 后恢复
  - 不消耗步数

### 8. 四连 / 五连以上是否生成特殊块

没有。

当前实现中：

- 不生成炸弹
- 不生成横消块
- 不生成彩虹块
- 不生成高级资源块

4+ / 5+ 的效果只有：

- 更高资源收益
- 花瓣 / sceneBurst 视觉反馈

### 9. 高级块机制

没有真实“高级块”。

只有收益加成：

- `4` 连：`extraFlat += 1`
- `5+` 连：`extraFlat += 3`
- 连锁层数：每多一层 `+10%`
- `greenhouseNurture`：大组部分额外 `+50%`

因此当前是“高级收益机制”，不是“高级 tile 机制”。

---

## 第二部分：步数耗尽与惩罚机制

### 1. 每日初始步数

来源：

- [src/stores/gameStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/gameStore.js)

精确数值：

- `MAX_STEPS = 20`

### 2. `onAfterMove()` 中步数耗尽检测逻辑

逻辑顺序如下：

1. `needsReady = this._hasCurrentNeedsMet()`
2. 若是最后一天，且需求满足，且 `!djinnReleased`
   - `phase = 'playing'`
   - 返回 `'djinn'`
3. 若需求满足
   - `phase = 'repairing'`
   - 返回 `'complete'`
4. 若 `stepsLeft <= 0`
   - 随机抽 `DAY_END_LINES`
   - `phase = 'dayEnd'`
   - 记录 `achievement.track('dayEndReached')`
   - 返回 `'dayEnd'`
5. 否则返回 `'continue'`

### 3. 步数耗尽后的 phase 切换流程

真实流程：

1. 玩家交换时先 `consumeStep()`
2. 棋盘级联全部跑完
3. `GameBoard.maybeCommitTurn()`
4. `game.onAfterMove()`
5. 若步数耗尽：
   - `phase = 'dayEnd'`
6. `GameContainer` 渲染 `DayEndOverlay`
7. 玩家点击后：
   - `advanceFromDayEnd()`
8. 恢复步数，回到 `playing`

### 4. `advanceFromDayEnd()` 恢复多少步数

来源：

- [src/stores/gameStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/gameStore.js)

实现：

```js
advanceFromDayEnd() {
  this.stepsLeft = MAX_STEPS;
  this.matchGroupsThisDay = 0;
  this.phase = 'playing';
}
```

结论：

- 恢复到 `20`
- 不是累加

### 5. 是否有隐藏惩罚

没有发现显式隐藏惩罚：

- 不提高怪物压力
- 不增加需求
- 不降低步数上限
- 不扣资源
- 不改变棋盘资源权重

唯一可视为“间接代价”的点：

- `matchGroupsThisDay = 0`
- 会打断 `agedBarrel` 的 5 组累计进度

### 6. 是否有星光 / 评分 / 星级系统

没有。

代码里没有正式评分系统，也没有按剩余步数给星。

剩余步数只用于：

- 成就判断

### 7. 是否存在真实跳关 / 存档机制

没有正式机制。

存在测试工具：

- `jumpToDayForTesting()`
- `skipDayForTesting()`

正式持久化只有成就。

---

## 第三部分：能力系统详细参数

### 1. 9 个能力完整数据

来源：

- [src/data/content.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/data/content.js)

| ID | 名称 | 类型 | 描述 | 次数 | 目标 |
| --- | --- | --- | --- | --- | --- |
| `whiteWolfTidy` | 白狼整顿 | 主动 | 重置整个棋盘，不消耗步数。 | `1/天` | 无 |
| `toussentHarvest` | 陶森特丰收 | 主动 | 选一个葡萄方块，将其周围 3×3 全部变成葡萄。 | `1/天` | `grape` |
| `agedBarrel` | 旧桶陈香 | 被动 | 每累计消除 5 组方块，额外 +1 步。 | 无 | 无 |
| `roachPath` | 萝卜识途 | 主动 | 不限相邻交换两个方块，不扣步数。 | `2/天` | `twoTiles` |
| `lilacSeed` | 丁香播种 | 主动 | 将一种资源全部转换为另一种资源。 | `1/天` | `twoResources` |
| `greenhouseNurture` | 暖房滋养 | 被动 | 单组 ≥4 时，本组资源 +50%。 | 无 | 无 |
| `toussentSunset` | 陶森特日落 | 主动 | 消除指定一行或一列。 | `1/天` | `rowOrCol` |
| `hearthStew` | 炉火炖汤 | 主动 | 恢复 5 步（不超过 20 步上限）。 | `1/天` | 无 |
| `lilacReturn` | 紫丁香归途 | 被动 | 剩余 ≤5 步时，自动高亮可形成匹配的交换。 | 无 | 无 |

### 2. 主动 / 被动区分

主动：

- 白狼整顿
- 陶森特丰收
- 萝卜识途
- 丁香播种
- 陶森特日落
- 炉火炖汤

被动：

- 旧桶陈香
- 暖房滋养
- 紫丁香归途

### 3. 主动能力使用限制

统一规则：

- 没有冷却
- 没有魔力槽
- 没有资源消耗
- 只有每日使用次数

限制入口：

- `game.canUseAbility(id)`

要求：

- 能力存在
- 类型是主动
- 已解锁
- `phase` 为 `playing` 或 `targeting`
- 当天剩余次数 `> 0`

### 4. 是否存在统一魔力消耗槽

没有。

`magic` 只是建筑资源，不是技能能源。

### 5. 能力的解锁条件

在 `finishRepair()` 中，完成当天建筑后立即解锁：

```js
if (!this.unlockedAbilities.includes(day.ability)) {
  this.unlockedAbilities.push(day.ability)
}
```

### 6. Day 8 `丁香播种（lilacSeed）` 资源转换面板流程

来源：

- [src/components/HUD/AbilityBar.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/AbilityBar.vue)

操作流程：

1. 点击能力按钮
2. `lilacOpen = true`
3. `lilacFrom = null`
4. `lilacTo = null`
5. `game.beginTarget('lilacSeed')`
6. 右侧出现 inline 转换面板
7. 玩家选择：
   - 从哪种资源
   - 变成哪种资源
8. 点击“变身”
9. 调 `boardRef.abilityConvertResource(fromId, toId)`
10. 棋盘将全体 `fromChar -> toChar`
11. `game.consumeAbility('lilacSeed')`

细节：

- 需要两次资源选择 + 一次确认
- 会让 phase 进入 `targeting`
- 不扣步数
- 会中断普通连续消除节奏
- 执行后立即重新检查匹配与级联

### 7. 能力之间是否有协同

没有显式组合技系统，但有隐式协同：

- `agedBarrel` 和任何“造多组匹配”的能力协同
- `greenhouseNurture` 和 `4+` / `5+` 组协同
- `lilacReturn` 在低步数时增强决策支持
- 第 2 愿 `roach-healthy` 可以强化 `roachPath`
- 第 2 愿 `rich-vintage` 可以增强所有后续资源结算

### 8. 被动触发条件和频率

`agedBarrel`

- 每累计 `5` 组消除，恢复 `1` 步
- 在 `gainResources()` 中按 `groupSizes.length` 统计
- 怪物被击退数量也会进 `_countMonsterClears(n)`

`greenhouseNurture`

- 只要本次消除里存在 `>=4` 组
- 就按大组占比对本次总收益做 `+50%` 近似放大

`lilacReturn`

- 条件：已解锁且 `stepsLeft <= 5`
- 效果：自动点亮一组可交换 hint

---

## 第四部分：Hint 系统参数

### 1. 无操作后触发 Hint 的等待时间

来源：

- [src/components/Board/GameBoard.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Board/GameBoard.vue)

精确数值：

- `8000ms`
- 即 `8 秒`

### 2. Hint 的实现方式

实现步骤：

1. `board.findHint()`
2. 取返回的 `{ a, b }`
3. 找到两块 tile 的 `id`
4. 把 `id` 放进 `hintIds`
5. `BoardTile` 进入 `.tile.hint`
6. CSS 做紫色发光脉冲

结论：

- Hint 形式是“高亮一组可走步”
- 不是箭头
- 不是文本提示

### 3. Hint 是否有惩罚

没有。

### 4. `紫丁香归途（lilacReturn）` 是否影响 Hint 参数

会影响“默认是否启用”。

`game.showHints`：

```js
return state.unlockedAbilities.includes('lilacReturn') && state.stepsLeft <= 5;
```

影响结果：

- 低步数时常态显示 hint
- 但普通情况下，长时间 idle 也会强制触发一次 hint

### 5. `findHint()` 算法逻辑

来源：

- [src/core/board.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/core/board.js)

算法：

1. 从左上到右下遍历所有格
2. 每格只试两个方向：
   - 右
   - 下
3. 临时交换
4. 调 `_anyMatch()`
5. 若成立，立刻返回

结论：

- 不是随机
- 不是评分最优
- 是“扫描到的第一步合法交换”

---

## 第五部分：怪物系统完整规则

### 1. 六种怪物完整数据

来源：

- [src/data/content.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/data/content.js)
- [src/stores/gameStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/gameStore.js)

#### 孽鬼 `nekkers`

- char: `N`
- HP: `1`
- 奖励：无
- 弱点：上下左右贴身三消
- 压力：回合末向最近边缘跳 `1` 格
- 占格：`1x1`

#### 水鬼 `drowner`

- char: `D`
- HP: `2`
- 奖励：`grape +2`
- 弱点：正上 / 正下的纵向匹配
- 压力：回合末下沉 `1` 格
- 占格：`1x1`

#### 食尸鬼 `ghoul`

- char: `G`
- HP: `2`
- 奖励：`herb +2`
- 弱点：脚下清空，或本行横向擦到
- 压力：回合末在脚下留下腐土
- 占格：`1x1`

#### 狮鹫幼雏 `griffinChick`

- char: `C`
- HP: `2`
- 奖励：`magic +2`
- 弱点：所在行 `4` 连及以上横向匹配
- 压力：回合末向上飞 `1` 格
- 占格：`1x1`

#### 怨灵 `wraith`

- char: `W`
- HP: `2`
- 初始护纱：`1`
- 奖励：`magic +2`
- 弱点：连锁 `>= 2`，或附近 `4+`
- 压力：若没受有效伤害，回合末恢复 `1` 层护纱
- 占格：`1x1`

#### 迪精 `djinn`

- hits: `3`
- 无普通 tile char
- 占格：`2x2`
- 弱点：三阶段封印命中规则
- 奖励：不走普通资源奖励逻辑

### 2. 各怪物受击规则、奖励与骚扰

#### 孽鬼

- 受击规则：
  - 只要上下左右相邻格发生一次 `3+` 匹配即可
  - 实现类型：`orthogonalAdjacent`
- 初始 HP：
  - `1`
- 奖励：
  - 无
- 回合末骚扰：
  - `edgeJump`
  - 向最近边缘跳 `1` 格

#### 水鬼

- 受击规则：
  - 只有纵向匹配命中正上方或正下方时才掉 `1` HP
  - 实现类型：`verticalAdjacent`
- 初始 HP：
  - `2`
- 奖励：
  - `grape +2`
- 回合末骚扰：
  - `sink`
  - 下沉 `1` 格

#### 食尸鬼

- 受击规则：
  - 清到脚下那格，或
  - 同一行横向匹配擦到它
  - 实现类型：`underfootOrRowHorizontal`
- 初始 HP：
  - `2`
- 奖励：
  - `herb +2`
- 回合末骚扰：
  - `rotUnderfoot`
  - 在脚下生成腐土 `r`

#### 狮鹫幼雏

- 受击规则：
  - 所在行 `4` 连及以上横向匹配
  - 实现类型：`rowBigHorizontal`
- 初始 HP：
  - `2`
- 奖励：
  - `magic +2`
- 回合末骚扰：
  - `flyUp`
  - 向上飞 `1` 格

#### 怨灵

- 受击规则：
  - 连锁 `>= 2` 且命中附近
  - 或 `4+` 组命中附近
  - 实现类型：`qualityAdjacent`
- 初始 HP：
  - `2`
- 初始护纱：
  - `1`
- 奖励：
  - `magic +2`
- 回合末骚扰：
  - `restoreShield`
  - `shield = min(1, shield + 1)`

#### 迪精

- 受击规则：
  - 第 1 阶段：普通横/纵命中外圈
  - 第 2 阶段：命中左右侧外圈列的纵向匹配
  - 第 3 阶段：连锁 `>=2` 或 `4+` 命中外圈
- 初始 HP / 命中次数：
  - `3`
- 回合末骚扰：
  - 无普通 pressure 行为

### 3. 怪物生成逻辑

来源：

- [src/data/content.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/data/content.js)

特点：

- 每天配置固定
- 位置固定
- 不是随机刷怪

| Day | 怪物配置 |
| --- | --- |
| 1 | 孽鬼 x1 `(2,5)` |
| 2 | 孽鬼 x2 `(1,2)` `(4,5)` |
| 3 | 水鬼 x1 `(2,5)` |
| 4 | 水鬼 x1 `(1,5)` + 孽鬼 x1 `(4,2)` |
| 5 | 食尸鬼 x1 `(2,1)` + 水鬼 x1 `(4,5)` |
| 6 | 怨灵 x1 `(1,5)` + 食尸鬼 x1 `(2,2)` + 水鬼 x1 `(5,5)` |
| 7 | 狮鹫幼雏 x1 `(2,5)` + 食尸鬼 x1 `(5,2)` |
| 8 | 狮鹫幼雏 x1 `(2,3)` + 怨灵 x1 `(4,5)` |
| 9 | 迪精 x1 `(3,3)` 尺寸 `2x2` |

### 4. `applyMonsterPressure()` 完整逻辑

触发时机：

- `GameBoard.maybeCommitTurn()`
- 每次棋盘完全空闲后尝试一次

跳过条件：

- `phase !== 'playing'`
- `skipMonsterPressureTurn === turnId`
- 怪物本回合已触发压力
- 怪物本回合已受伤

会做的事：

- `edgeJump`
- `sink`
- `flyUp`
- `rotUnderfoot`
- `restoreShield`

### 5. 怪物被击退后是否奖励资源

会。

| 怪物 | 奖励 |
| --- | --- |
| 孽鬼 | 无 |
| 水鬼 | 葡萄 `+2` |
| 食尸鬼 | 草药 `+2` |
| 狮鹫幼雏 | 魔力 `+2` |
| 怨灵 | 魔力 `+2` |
| 迪精 | 无普通资源奖励 |

### 6. 怪物是否影响资源目标完成

怪物格本身不计入普通资源收集。

原因：

- 资源统计只认普通资源 char
- 怪物占用的是 monster char
- line clear 也会跳过 monster 格

怪物对完成目标的帮助只来自“击退奖励”。

---

## 第六部分：迪精系统参数

### 1. 迪精棋盘形态

来源：

- [src/data/content.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/data/content.js)

参数：

- 位置：`row: 3, col: 3`
- 尺寸：`width: 2, height: 2`

### 2. 三阶段受击条件

来源：

- [src/stores/gameStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/gameStore.js)

#### 第 1 阶段

条件：

- 命中迪精外圈任意格
- 且该命中属于普通横向或纵向匹配

代码等价：

```js
ringTiles.some(tile => tile.axis === 'row' || tile.axis === 'col')
```

#### 第 2 阶段

条件：

- 命中外圈左右两侧那两列
- 且必须是纵向匹配

代码等价：

```js
ringTiles.some(tile =>
  tile.axis === 'col' &&
  (tile.col === entity.col - 1 || tile.col === entity.col + width)
)
```

当前固定坐标下等价为命中列：

- `2`
- `5`

#### 第 3 阶段

满足任一即可：

- `chain >= 2`
- `ringTiles` 中存在 `groupSize >= 4`
- `matchGroups` 中存在 `size >= 4` 且命中外圈

### 3. 每阶段需要命中次数

- 总共 `3` 次
- 每阶段 1 次
- `hitsRequired = 3`

### 4. 迪精阶段是否消耗常规每日步数

会。

- 命中迪精的交换仍属于正常棋盘行动
- `consumeStep()` 已先扣步
- 愿望 overlay 自己不再额外扣步

### 5. 三个愿望的完整内容

#### 第 1 愿：`banish`

效果：

- 所有未移除怪物直接 `removed = true`
- 这些怪物所在格加入 `pendingWishReleasedCells`
- `pendingWishPhase = 'playing'`

#### 第 2 愿：三个选项

`ease-estate`

- 当前建筑每种需求变为 `ceil(need * 0.7)`
- 但不会低于当前已有资源进度
- `pendingWishPhase = 'refreshBoard'`

`rich-vintage`

- 立即 `+5` 步
- `dayBuffs.extraResourcePerType = true`
- 之后每次消除的每个资源类型额外 `+1`
- `pendingWishPhase = 'playing'`

`roach-healthy`

- 若已解锁 `roachPath`
- 当日可用次数提高到 `4`
- `pendingWishPhase = 'playing'`

#### 第 3 愿：`bind-fate`

效果：

- 迪精实体移除
- 它占据的 `2x2` 记录为 released cells
- `djinnReleased = true`
- 当前建筑需求直接补满
- `pendingWishPhase = 'repairing'`

### 6. 愿望选择后的状态转移逻辑

来源：

- [src/components/HUD/WishOverlay.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/WishOverlay.vue)

分支：

- `refreshBoard`
  - 刷新棋盘
  - `finishWishStage('playing')`
- 有 `pendingWishReleasedCells`
  - 释放格子
  - 再根据 phase 决定走向
- `repairing`
  - `finishWishStage('repairing')`
- 其他情况
  - `finishWishStage('playing')`

### 7. 是否有独立步数限制或动态难度调节

没有。

- 仍使用当天的 `stepsLeft`
- 没有独立 djinn 计步器
- 只有愿望奖励在间接改变难度

### 8. 迪精阶段 Hint 是否正常工作

- `wish` overlay 期间不会正常显示棋盘 hint
- 但在普通 `playing` 状态下，Day 9 仍可正常触发 hint
- 左栏还会显示 `djinnHintVisible` 的专属系统提示

---

## 第七部分：经济系统与难度曲线

### 1. 9 天完整数据

| Day | 建筑 | 需求 | 可用资源 | 步数 | 怪物 | 解锁能力 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 庭院 | 葡萄 `25` 木材 `20` 石材 `15` | `g w s` | `20` | 孽鬼 x1 | 白狼整顿 |
| 2 | 葡萄园 | 葡萄 `45` 木材 `25` | `g w s` | `20` | 孽鬼 x2 | 陶森特丰收 |
| 3 | 酒窖 | 木材 `28` 陶土 `28` 葡萄 `19` | `g w s c` | `20` | 水鬼 x1 | 旧桶陈香 |
| 4 | 马厩 | 木材 `45` 石材 `35` | `g w s c` | `20` | 水鬼 x1 + 孽鬼 x1 | 萝卜识途 |
| 5 | 花园 | 草药 `50` 葡萄 `35` | `g w s c h` | `20` | 食尸鬼 x1 + 水鬼 x1 | 紫丁香归途 |
| 6 | 温室 | 草药 `40` 陶土 `30` 魔力 `20` | `g w s c h m` | `20` | 怨灵 x1 + 食尸鬼 x1 + 水鬼 x1 | 暖房滋养 |
| 7 | 露台 | 石材 `45` 木材 `35` 魔力 `15` | `g w s c h m` | `20` | 狮鹫幼雏 x1 + 食尸鬼 x1 | 陶森特日落 |
| 8 | 厨房 | 陶土 `45` 葡萄 `35` 木材 `20` | `g w s c h m` | `20` | 狮鹫幼雏 x1 + 怨灵 x1 | 丁香播种 |
| 9 | 紫丁香客房 | 木材 `35` 草药 `25` 魔力 `25` | `g w s c h m` | `20` | 迪精 x1 | 炉火炖汤 |

### 2. 是否有当天主打资源权重加成

没有。

### 3. 每天棋盘资源分布概率

基础均权占比：

| 天数 | 开放资源数 | 理论基础占比 |
| --- | --- | --- |
| Day 1-2 | 3 | 每种约 `33.33%` |
| Day 3-4 | 4 | 每种约 `25%` |
| Day 5 | 5 | 每种约 `20%` |
| Day 6-9 | 6 | 每种约 `16.67%` |

注意：

- 实际填充会被防初始三连逻辑局部扰动

### 4. 完成所有 9 天总资源量

经代码中的 `DAYS[].needs` 汇总：

| 资源 | 总量 |
| --- | --- |
| 葡萄 | `159` |
| 木材 | `208` |
| 石材 | `95` |
| 陶土 | `103` |
| 草药 | `115` |
| 魔力 | `60` |
| 合计 | `740` |

### 5. 每天理论最小步数

代码中没有定义。

无法从当前实现可靠推出严格精确值，因为系统中还存在：

- 连锁倍率
- 4/5 连额外收益
- 被动加成
- 怪物奖励
- 愿望增益
- 主动能力改盘

---

## 第八部分：操作手感参数

### 1. 拖拽判定

来源：

- [src/composables/useTileDrag.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/composables/useTileDrag.js)

参数：

- 最小拖拽距离：`30px`
- 基于绝对像素值
- 有方向锁定：
  - `abs(dx) >= abs(dy)` -> 横向
  - 否则 -> 纵向
- 约 `8px` 开始显示软预览

### 2. 点击操作

支持：

- 点击 A 再点击 B 交换

细节：

- 第二次点击若相邻则立即交换
- 没有超时重置
- 点同一格会取消
- 点非相邻格会把当前激活对象改成新格

### 3. 动画时序

| 动作 | 数值 / 备注 |
| --- | --- |
| 交换动画调度 | `220ms` |
| 消除动画调度 | `420ms` |
| 下落视觉 token | `260ms` |
| 新块波次间隔 | `90ms` |
| 匹配后位移启动延迟 | `200ms` |
| 大组额外停顿 | `480ms` |
| 无可走步抖动 | `400ms` |

总级联时间上限：

- 没有显式上限
- 只要有继续匹配就继续递归 `checkMatches()`

### 4. 是否有操作队列

没有显式队列。

当前机制更像：

- 棋盘忙时完全锁输入
- 棋盘空闲时才接受下一步

判断入口：

- `board.canMove()`

### 5. 拖拽视觉反馈

有：

- 当前选中 tile 有金色光环和呼吸动画
- 目标格有 `preview-good` / `preview-bad`
- 非法交换会抖动

没有：

- tile 跟随鼠标拖动
- 半透明拖影

---

## 第九部分：成就系统详情

### 1. 完整成就列表

来源：

- [src/data/content.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/data/content.js)

| ID | 名称 | 描述 | 稀有度 | 隐藏 |
| --- | --- | --- | --- | --- |
| `day1_clear_the_way` | 先把路找出来 | 第1天完成庭院修复，且未使用白狼整顿。 | `common` | 否 |
| `day2_vines_remember` | 藤蔓记得回家 | 第2天完成葡萄园修复，且出现过一次 4 连或更大组。 | `common` | 否 |
| `day3_one_bottle_saved` | 留一瓶 | 第3天完成酒窖修复，且当天击退过水鬼。 | `common` | 否 |
| `day4_roach_approves` | 萝卜点头了 | 第4天完成马厩修复，且至少使用过一次萝卜识途。 | `common` | 否 |
| `day5_lilac_in_the_wind` | 风里有丁香 | 第5天完成花园修复，且完成时剩余步数至少为 6。 | `rare` | 否 |
| `day6_keep_the_lamp_warm` | 灯别熄 | 第6天完成温室修复，且当天至少打出过一次 2 连锁或 4 连以上。 | `rare` | 否 |
| `day7_a_chair_for_waiting` | 先放一把椅子 | 第7天完成露台修复，且至少使用过一次陶森特日落。 | `rare` | 否 |
| `day8_the_soup_will_hold` | 汤会热着 | 第8天完成厨房修复，且当天从未进入步数耗尽。 | `rare` | 否 |
| `day9_room_for_her` | 为她留灯 | 第9天完成紫丁香客房，并完整走到最终结局展示。 | `epic` | 是 |
| `sunlit_margin` | 天光尚早 | 任意一天完成修复时，剩余步数达到 10 或以上。 | `common` | 否 |
| `clutch_finish` | 差一点也够 | 任意一天完成修复时，剩余步数不超过 5。 | `rare` | 否 |
| `cascade_poetry` | 连锁像诗 | 单次行动打出 3 层或以上连锁。 | `epic` | 否 |
| `grand_harvest` | 丰收时刻 | 出现任意一次 5 消或更大组。 | `epic` | 否 |
| `love_from_xiaokun` | 爱你的小坤 | 完整通关并走到最终结局之后解锁。 | `gold` | 是 |

### 2. 是否有三消操作类成就

有：

- `cascade_poetry`
- `grand_harvest`

### 3. 是否有策略类成就

有：

- 不用白狼整顿完成 Day 1
- Day 3 击退水鬼
- Day 4 使用萝卜识途
- Day 7 使用陶森特日落
- Day 8 不进入步数耗尽
- 高剩余步数 / 低剩余步数完成

### 4. 持久化逻辑

来源：

- [src/stores/achievementStore.js](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/stores/achievementStore.js)

常量：

- `STORAGE_KEY = 'corvo-bianco.achievements.v1'`
- `STORAGE_VERSION = 1`

结构：

```json
{
  "version": 1,
  "unlockedIds": ["day1_clear_the_way"],
  "stats": {
    "whiteRavenClicks": 0,
    "byDay": {
      "1": {
        "usedAbilities": [],
        "hadBigMatch": false,
        "hadCombo2Plus": false,
        "clearedMonsterKinds": [],
        "reachedZeroSteps": false
      }
    }
  }
}
```

---

## 第十部分：代码残留与潜在问题

### 1. `repairProgressPct` 是否真的有定义

结论：没有找到定义。

只发现引用：

- [src/components/Board/GameBoard.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/Board/GameBoard.vue)
- [src/components/HUD/EstateStrip.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/EstateStrip.vue)

未在 `gameStore` 中发现对应 `state/getter/action`。

### 2. `RepairOverlay.vue` 是否还在被使用

结论：当前未使用。

文件存在：

- [src/components/HUD/RepairOverlay.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/RepairOverlay.vue)

但当前修复过场实际由：

- [src/components/HUD/PerDayCutscene.vue](/Users/chenzhikun/project/GitHub/claudeBuild/corvo-bianco/src/components/HUD/PerDayCutscene.vue)

负责。

### 3. `repairBegin` 和 `dayEndBegin` 是否有监听器

结论：未发现监听器。

发出位置：

- `GameBoard.maybeCommitTurn()`

但全项目中没有查到对应 `EventBus.bind/on` 消费。

### 4. README 中能力顺序是否与代码一致

结论：不一致。

代码顺序：

1. 白狼整顿
2. 陶森特丰收
3. 旧桶陈香
4. 萝卜识途
5. 紫丁香归途
6. 暖房滋养
7. 陶森特日落
8. 丁香播种
9. 炉火炖汤

README 中是旧顺序。

### 5. 其他未使用旧组件 / 旧函数 / 可疑残留

疑似未使用或半残留项：

- `RepairOverlay.vue`
- `gameStore.showIntro()`
- `gameStore.hintMove`
- `gameStore._djinnTriggerKeys()`
- `GameBoard.selectedTilePos`
- `GameBoard.collectClearedPositions()`
- `GameBoard._lastSwapSettled`
- `GameBoard.lastClearSource`
- `gameStore.gainResources()` 中的 `groupIdx`
- `gameStore.gainResources()` 中的 `perGroupBigScale`
- `TIMING.TILE_FALL_MS`
- `TIMING.MATCH_DROP_DELAY_MS`
- `tokens.css` 中的 `--t-swap`

这些不一定都是 bug，但都值得在后续整理时复核。

---

## 总结

当前 Corvo Bianco 的核心机制可以概括为：

- `8x8` 固定棋盘
- 当前开放资源集合内均权随机生成
- 通过局部减权避免初始 3 连
- 每日固定 `20` 步
- 无失败，仅有 day-end 温和重置
- 没有特殊块系统，只有收益增强系统
- 技能系统以“每日次数限制”而非“资源消耗”实现
- Hint 是“扫描到的第一组合法交换”
- 怪物系统和第 9 天迪精愿望线都已经实际接入主循环
- 正式持久化只有成就
- 项目中存在少量旧组件与未接线残留字段
