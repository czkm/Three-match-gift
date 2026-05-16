# 以撒道具实现清单

更新日期：2026-05-15

## 1. 当前接线位置

- 道具定义：`src/data/content.js` 中的 `REWARD_ITEMS`
- 道具领取与代价：`src/stores/gameStore.js` 的 `chooseRewardItem()` / `_applyRewardPenalty()`
- 每日开局类效果：`src/stores/gameStore.js` 的 `nextDay()` / `_applyDayStartItemEffects()`
- 资源结算类效果：`src/stores/gameStore.js` 的 `gainResources()` / `_applyOwnedItemGainEffects()`
- 低步数恢复类效果：`src/stores/gameStore.js` 的 `_applyLowStepRecoveryItems()`
- 步数归零恢复：`src/stores/gameStore.js` 的 `onAfterMove()` / `_tryZeroStepRecovery()`
- 无效交换类效果：`src/components/Board/GameBoard.vue` 的 `onSwap()` + `src/stores/gameStore.js` 的 `_flushPendingInvalidSwapReward()` / `handleInvalidSwapReward()`
- 第 9 天迪精仪式类效果：`src/stores/gameStore.js` 的 `recordDjinnBoardProgress()` / `applyDjinnItemProgressBonus()`

## 2. 道具清单

状态说明：

- `已接入`：效果和惩罚已经进运行时逻辑
- `已接入（已修正）`：本轮修过触发时机或规则偏差
- `精灵图已配置`：已写入 sprite `background-position`
- `精灵图待补`：当前会回退到 emoji

| Day | 房间 | 道具 ID | 道具 | effect.type | 惩罚 | 功能状态 | 精灵图状态 | 建议回归 |
|---|---|---|---|---|---|---|---|---|
| 1 | 宝箱 | `styeTreasure` | 麦粒肿 / Stye | `firstBigMatchBonus` | 无 | 已接入 | 精灵图已配置 | 第一次 4 连及以上后，本次结算资源应额外 +2 |
| 1 | 恶魔 | `styeDevil` | 麦粒肿 / Stye | `firstBigMatchBonus` | 明日 -2 步 | 已接入 | 精灵图已配置 | 第一次 4 连及以上后，本次结算资源应额外 +4 |
| 2 | 宝箱 | `luckyFoot` | 幸运脚 / Lucky Foot | `chainBonus` | 无 | 已接入 | 精灵图待补 | 第一次达到 2 连锁时，本次结算资源应额外 +2 |
| 2 | 恶魔 | `brimstone` | 硫磺火 / Brimstone | `firstFiveMatchBonus` | 明日 -4 步 | 已接入 | 精灵图待补 | 第一次 5 连及以上后，本次结算资源应额外 +6 |
| 2 | 恶魔 | `momsKnife` | 妈妈的刀 / Mom's Knife | `invalidSwapBonus` | 明日 -3 步 | 已接入（已修正） | 精灵图待补 | 第一次无效交换后，被交换的两种资源都应各 +3 |
| 3 | 宝箱 | `lunch` | 午餐 / Lunch | `dayStartStepBonus` | 无 | 已接入 | 精灵图待补 | 下一天开局步数应额外 +2，且不超过上限 |
| 3 | 恶魔 | `thePact` | 契约 / The Pact | `dayStartNeedReduction` | 步数上限 -1 | 已接入 | 精灵图待补 | 下一天开局时，剩余需求最高的 2 项都应 -3 |
| 3 | 恶魔 | `deadCat` | 死猫 / Dead Cat | `firstZeroStepRecover` | 步数上限 -2 | 已接入 | 精灵图待补 | 第一次步数归零时应自动恢复 4 步 |
| 4 | 宝箱 | `sackOfPennies` | 硬币袋 / Sack of Pennies | `firstTargetResourceBonus` | 无 | 已接入（已修正） | 精灵图待补 | 第一次资源结算时，应随机给一个当前目标资源 +4 |
| 4 | 恶魔 | `pentagram` | 五芒星 / Pentagram | `allBigMatchBonus` | 明日 -4 步 | 已接入 | 精灵图待补 | 每次 4 连及以上，本次结算资源都应额外 +2 |
| 4 | 恶魔 | `guppysPaw` | 嗝屁猫的爪子 / Guppy's Paw | `lowStepPigEnergyRecover` | 明日 -2 步；小猪评价 -1 | 已接入（已修正） | 精灵图待补 | 步数 <=3 且有 1 点小猪能量时，应自动消耗 1 点能量并恢复 4 步 |
| 5 | 宝箱 | `battery` | 小电池 / The Battery | `firstFiveMatchStep` | 无 | 已接入 | 精灵图待补 | 第一次 5 连及以上后，应恢复 1 步 |
| 5 | 恶魔 | `blackCandle` | 黑蜡烛 / Black Candle | `firstTargetResourceBonus` | 步数上限 -1 | 已接入 | 精灵图待补 | 第一次资源结算时，应给当前最高需求资源 +5 |
| 5 | 恶魔 | `whoreOfBabylon` | 巴比伦大淫妇 / Whore of Babylon | `lowStepResourceBoost` | 明日 -5 步 | 已接入 | 精灵图待补 | 步数 <=5 时，资源收益应按 1.4 倍放大 |
| 6 | 宝箱 | `holyWater` | 圣水 / Holy Water | `firstInvalidSwapForgive` | 无 | 已接入（已修正） | 精灵图待补 | 第一次无效交换时，应先扣 1 步再返 1 步 |
| 6 | 恶魔 | `abaddon` | 亚巴顿 / Abaddon | `dayStartNeedReduction` | 步数上限 -2 | 已接入 | 精灵图待补 | 下一天开局时，剩余需求最高的 1 项应 -6 |
| 6 | 恶魔 | `mawOfTheVoid` | 虚空之喉 / Maw of the Void | `chainBonus` | 明日 -5 步 | 已接入 | 精灵图待补 | 第一次达到 3 连锁时，本次结算资源应额外 +8 |
| 7 | 宝箱 | `compass` | 指南针 / The Compass | `firstBigMatchPigEnergy` | 无 | 已接入 | 精灵图待补 | 第一次 4 连及以上后，应额外 +1 小猪能量 |
| 7 | 恶魔 | `eyeOfBelial` | 恶魔之眼 / Eye of Belial | `firstHighestNeedBonus` | 明日 -4 步 | 已接入 | 精灵图待补 | 第一次 4 连及以上后，当前最高需求资源应额外 +6 |
| 7 | 恶魔 | `theMark` | 印记 / The Mark | `firstFiveAllTargetsBonus` | 步数上限 -1；小猪评价 -1 | 已接入（已修正） | 精灵图待补 | 第一次 5 连及以上后，所有当前目标资源都应各 +3 |
| 8 | 宝箱 | `momsKey` | 妈妈的钥匙 / Mom's Key | `djinnProgressBonus` | 无 | 已接入 | 精灵图已配置 | 第 9 天迪精仪式中，第一次阶段进度推进时应额外 +1 |
| 8 | 恶魔 | `sacrificialDagger` | 献祭匕首 / Sacrificial Dagger | `djinnProgressBonus` | 第 9 天初始步数 -4 | 已接入（已修正） | 精灵图待补 | 第 9 天每个阶段第一次进度推进时都应额外 +1 |
| 8 | 恶魔 | `littleBrimstone` | 小硫磺火 / Little Brimstone | `djinnBigMatchProgressBonus` | 第 9 天初始步数 -3 | 已接入 | 精灵图待补 | 第 9 天每阶段第一次 4 连及以上时，目标进度应额外 +1 |

## 3. 当前已确认修复

- `Holy Water` / `Mom's Knife`
  - 问题：无效交换奖励以前在扣步前触发，容易看起来没生效
  - 现在：改成先照常扣步，再结算无效交换类道具
- `Sack of Pennies`
  - 问题：以前实现成“当前最高需求资源 +4”
  - 现在：已改成“随机一个当前目标资源 +4”
- `Guppy's Paw` / `The Mark`
  - 问题：`penalty.pigMood` 以前只写在数据里，没有进入结算逻辑
  - 现在：会真实影响小猪当日评价
- `Mom's Key` / `Sacrificial Dagger`
  - 问题：迪精第一阶段的额外进度存在被后续覆盖的风险
  - 现在：额外进度会保留下来

## 4. 剩余缺口

- 精灵图坐标目前只配置了 2 个基础道具：
  - `Stye / 麦粒肿`
  - `Mom's Key / 妈妈的钥匙`
- 其余基础道具在以下区域仍会回退为 emoji：
  - 恶魔房 / 宝箱房卡片
  - 道具信息消息头
  - 获得道具动画
- 目前还没有单独的自动化测试覆盖以撒道具效果，现阶段仍以手动回归为主

## 5. 推荐下一步

- 先补齐剩余 20 个基础道具的 wiki sprite 坐标
- 再补一份“按触发类型分组”的手动测试表
- 如果要稳一些，可以给 `gameStore` 增加一组最小化单测，覆盖：
  - 资源结算类
  - 无效交换类
  - 开局类
  - 第 9 天迪精仪式类
