/**
 * Static content tables — Corvo Bianco.
 *
 * Resources, days, abilities, narrative quotes — everything that the
 * spec §5–§14 requires. Kept as plain data so it can be diffed without
 * touching engine logic.
 */

/* -------- Resources -------- */
export const RESOURCES = [
  { id: 'grape', char: 'g', label: '葡萄', emoji: '🍇', cn: '葡萄' },
  { id: 'wood', char: 'w', label: '木材', emoji: '🪵', cn: '木材' },
  { id: 'stone', char: 's', label: '石材', emoji: '🪨', cn: '石材' },
  { id: 'clay', char: 'c', label: '陶土', emoji: '🧱', cn: '陶土' },
  { id: 'herb', char: 'h', label: '草药', emoji: '🌿', cn: '草药' },
  { id: 'magic', char: 'm', label: '魔力', emoji: '✨', cn: '魔力' }
]

export const RESOURCE_BY_CHAR = Object.fromEntries(
  RESOURCES.map(r => [r.char, r])
)
export const RESOURCE_BY_ID = Object.fromEntries(RESOURCES.map(r => [r.id, r]))
export const RESOURCE_CHARS = RESOURCES.map(r => r.char)
export const ROT_CHAR = 'r'

/**
 * Resources unlock progressively as new buildings introduce them.
 * The board only spawns tiles whose char appears in the union of every
 * day's `needs` map up to and including `dayIndex` (0-based).
 *
 *   D0-1  →  g, w, s              (courtyard / vineyard)
 *   D2    →  +c                   (cellar)
 *   D4    →  +h                   (garden)
 *   D5    →  +m                   (greenhouse)
 *
 * Returns an array of chars in declaration order so the colour palette
 * stays consistent.
 */
export function unlockedCharsForDay(dayIndex) {
  const idMap = {
    grape: 'g',
    wood: 'w',
    stone: 's',
    clay: 'c',
    herb: 'h',
    magic: 'm'
  }
  const seen = new Set()
  const upTo = Math.max(0, Math.min(DAYS.length - 1, dayIndex))
  for (let i = 0; i <= upTo; i++) {
    for (const id of Object.keys(DAYS[i].needs)) seen.add(idMap[id])
  }
  return RESOURCE_CHARS.filter(ch => seen.has(ch))
}

/* -------- Abilities -------- */
export const ABILITIES = {
  whiteWolfTidy: {
    id: 'whiteWolfTidy',
    name: '白狼整顿',
    desc: '重置整个棋盘，不消耗步数。',
    quote: '先把碍事的东西清掉。',
    type: 'active',
    usesPerDay: 1,
    icon: '🐺'
  },
  toussentHarvest: {
    id: 'toussentHarvest',
    name: '陶森特丰收',
    desc: '选一个葡萄方块，将其周围 3×3 全部变成葡萄。',
    quote: '这里的阳光确实有点过分。',
    type: 'active',
    usesPerDay: 1,
    icon: '🍇',
    needsTarget: 'grape'
  },
  agedBarrel: {
    id: 'agedBarrel',
    name: '旧桶陈香',
    desc: '每累计消除 5 组方块，额外 +1 步。',
    quote: '急不得。酒桶知道什么时候该开。',
    type: 'passive',
    icon: '🛢️'
  },
  roachPath: {
    id: 'roachPath',
    name: '萝卜识途',
    desc: '不限相邻交换两个方块，不扣步数。',
    quote: '别问它怎么过去的。它就是能过去。',
    type: 'active',
    usesPerDay: 2,
    icon: '🐎',
    needsTarget: 'twoTiles'
  },
  lilacSeed: {
    id: 'lilacSeed',
    name: '丁香播种',
    desc: '将一种资源全部转换为另一种资源。',
    quote: '她会嫌我种得太直。所以先留点余地。',
    type: 'active',
    usesPerDay: 1,
    icon: '🪻',
    needsTarget: 'twoResources'
  },
  greenhouseNurture: {
    id: 'greenhouseNurture',
    name: '暖房滋养',
    desc: '单组 ≥4 时，本组资源 +50%。',
    quote: '门关好，灯点上。剩下的交给时间。',
    type: 'passive',
    icon: '🌱'
  },
  toussentSunset: {
    id: 'toussentSunset',
    name: '陶森特日落',
    desc: '消除指定一行或一列。',
    quote: '夕阳落下的时候，什么都安静了。',
    type: 'active',
    usesPerDay: 1,
    icon: '🌅',
    needsTarget: 'rowOrCol'
  },
  hearthStew: {
    id: 'hearthStew',
    name: '炉火炖汤',
    desc: '恢复 5 步（不超过 20 步上限）。',
    quote: '不算精致。但热。',
    type: 'active',
    usesPerDay: 1,
    icon: '🍲'
  },
  lilacReturn: {
    id: 'lilacReturn',
    name: '紫丁香归途',
    desc: '剩余 ≤5 步时，自动高亮可形成匹配的交换。',
    quote: '有些人来的时候，连风都会先知道。',
    type: 'passive',
    icon: '🪻'
  },
  milkTeaBarrage: {
    id: 'milkTeaBarrage',
    name: '奶茶攻击',
    desc: '消耗小猪累积的 5 星评价，选一种资源并将棋盘上该资源全部收获。',
    quote: '它今天状态很好，甚至想自己上场。',
    type: 'active',
    usesPerDay: 1,
    icon: '🥤',
    needsTarget: 'milkTeaHarvest'
  }
}

export const PIG_RATING = {
  thresholds: {
    threeStar: 10,
    twoStar: 5
  },
  energyMax: 5,
  moods: {
    3: {
      emoji: '😄',
      label: '兴奋',
      caption: '小猪快乐地甩着尾巴，像是已经开始期待下一杯奶茶。'
    },
    2: {
      emoji: '😊',
      label: '满足',
      caption: '小猪满意地点点头，这一关它觉得干得漂亮。'
    },
    1: {
      emoji: '😟',
      label: '将就',
      caption: '小猪勉强哼了一声，算是通关了，但它还没尽兴。'
    },
    0: {
      emoji: '😵',
      label: '没劲',
      caption: '小猪看起来有点蔫，像在说今天的发挥不太行。'
    }
  }
}

export const PIG_REACTIONS = {
  gentle: [
    { emoji: '😊', caption: '它哼哼了两声，今天心情还不错。' },
    { emoji: '😌', caption: '小猪满足地晃了晃耳朵，勉强算是给了你点面子。' }
  ],
  warm: [
    { emoji: '😋', caption: '小猪舔了舔鼻子，像在想今天有没有加餐。' },
    { emoji: '🥺', caption: '它抬头看了你一眼，像是在等一句夸奖。' }
  ],
  warning: [
    { emoji: '🤨', caption: '它歪着脑袋看你，像在判断你是不是又来烦它。' },
    { emoji: '😤', caption: '它鼻子里重重喷了口气，已经开始有点不耐烦。' }
  ],
  angry: {
    emoji: '😠💢',
    caption: '小猪真的生气了。今日步数 -1。'
  },
  annoyed: {
    emoji: '😤',
    caption: '它鼻子里重重喷了口气，今天已经不太想搭理你了。'
  }
}

export const REWARD_ITEMS = {
  /* ───── 宝箱房 7 件（纯正面，无 pigTear） ───── */
  stye: { id: 'stye', roomType: 'treasure', name: '麦粒肿', enName: 'Stye', titleText: '麦粒肿', flavorText: '“那只肿起来的眼睛，能多看一格。”', quality: 2, emoji: '👁️', slot: 'head', tone: 'treasure', description: '每天首次 4 连：match 中心 + 1 个随机相邻格子炸开。', effect: { type: 'firstBigMatchAdjacentPop' }, reaction: '小猪用力眨了下右眼，旁边的一个格子应声裂开。' },
  luckyFoot: { id: 'luckyFoot', roomType: 'treasure', name: '幸运脚', enName: 'Lucky Foot', titleText: '幸运脚', flavorText: '“总有一步踩在好运上。”', quality: 2, emoji: '🍀', slot: 'feet', tone: 'treasure', description: '每天首次 2 段连锁：3 个随机非怪物格翻成当前需求资源。', effect: { type: 'firstChainScatterConvert', minChain: 2, count: 3 }, reaction: '小猪踩到一片幸运草，脚边的方块自己变了颜色。' },
  lunch: { id: 'lunch', roomType: 'treasure', name: '午餐', enName: 'Lunch', titleText: '午餐', flavorText: '“先垫一口，能多走两步。”', quality: 1, emoji: '🥪', slot: 'side', tone: 'treasure', description: '次日开始时额外 +2 步，受当前步数上限约束。', effect: { type: 'dayStartStepBonus', amount: 2 }, reaction: '小猪把它塞进背包，假装这是给你留的。' },
  sackOfPennies: { id: 'sackOfPennies', roomType: 'treasure', name: '硬币袋', enName: 'Sack of Pennies', titleText: '硬币袋', flavorText: '“叮当响，至少听起来富了。”', quality: 2, emoji: '💰', slot: 'side', tone: 'treasure', description: '每天首次资源结算时，随机一项当前目标资源 +4。', effect: { type: 'firstTargetResourceBonus', amount: 4 }, reaction: '袋子里硬币在响，看着哪一项目标自动涨了一点。' },
  battery: { id: 'battery', roomType: 'treasure', name: '小电池', enName: 'The Battery', titleText: '小电池', flavorText: '“再撑一小会儿。”', quality: 2, emoji: '🔋', slot: 'back', tone: 'treasure', description: '每天首次 5 连及以上，立即恢复 2 步。', effect: { type: 'firstFiveMatchStep', amount: 2 }, reaction: '小猪背着它走了两步，脚步轻了一点。' },
  holyWater: { id: 'holyWater', roomType: 'treasure', name: '圣水', enName: 'Holy Water', titleText: '圣水', flavorText: '“出错也会留点余地。”', quality: 2, emoji: '💧', slot: 'float', tone: 'treasure', description: '每天首次无效交换返还 1 步，且交换位置周围 2 个随机格翻成需求资源。', effect: { type: 'firstInvalidSwapScatterConvert', count: 2 }, reaction: '水滴落在一个方块上，四周泛起淡淡的光。' },
  compass: { id: 'compass', roomType: 'treasure', name: '指南针', enName: 'The Compass', titleText: '指南针', flavorText: '“总能指到更顺的方向。”', quality: 2, emoji: '🧭', slot: 'side', tone: 'treasure', description: '每天首次 4 连及以上，恢复 1 点小猪能量。', effect: { type: 'firstBigMatchPigEnergy', amount: 1 }, reaction: '指针转了半圈，最后指向了小猪。' },

  /* ───── 恶魔房 7 件（正面 + 步数代价） ───── */
  brimstone: { id: 'brimstone', roomType: 'devil', name: '硫磺火', enName: 'Brimstone', titleText: '硫磺火', flavorText: '“烧光一整列，眼睛都不眨。”', quality: 4, emoji: '🔥', slot: 'back', tone: 'devil', description: '每天首次 3 连：match 所在列被硫磺火扫穿清空。', effect: { type: 'firstThreeColSweep' }, penalty: { type: 'nextDaySteps', value: 4 }, penaltyText: '明天初始步数 -4。', reaction: '小猪嘴角喷出一道火光，自己也被烤得往后一跳。' },
  momsKnife: { id: 'momsKnife', roomType: 'devil', name: '妈妈的刀', enName: "Mom's Knife", titleText: '妈妈的刀', flavorText: '“失手，也要见血。”', quality: 4, emoji: '🔪', slot: 'side', tone: 'devil', description: '每天首次无效交换：所在列被刀刃划穿清空。', effect: { type: 'invalidSwapLineSweep' }, penalty: { type: 'nextDaySteps', value: 3 }, penaltyText: '明天初始步数 -3。', reaction: '刀刃贴着棋盘划过，小猪一动不动。' },
  thePact: { id: 'thePact', roomType: 'devil', name: '契约', enName: 'The Pact', titleText: '契约', flavorText: '“按下手印，就会少一横。”', quality: 3, emoji: '📜', slot: 'side', tone: 'devil', description: '每天首次 4 连：match 所在行被诅咒火焰扫穿清空。', effect: { type: 'firstBigRowSweep' }, penalty: { type: 'maxSteps', value: 1 }, penaltyText: '永久步数上限 -1。', reaction: '羊皮纸上一行火光亮起，小猪赶紧把爪子收回来。' },
  deadCat: { id: 'deadCat', roomType: 'devil', name: '死猫', enName: 'Dead Cat', titleText: '死猫', flavorText: '“倒下一次，还能爬起来。”', quality: 3, emoji: '🐈‍⬛', slot: 'back', tone: 'devil', description: '每天首次步数归零时，自动恢复 4 步。', effect: { type: 'firstZeroStepRecover', amount: 4 }, penalty: { type: 'maxSteps', value: 2 }, penaltyText: '永久步数上限 -2。', reaction: '黑猫睁开一只眼，又睡了过去。' },
  pentagram: { id: 'pentagram', roomType: 'devil', name: '五芒星', enName: 'Pentagram', titleText: '五芒星', flavorText: '“贪心一点，把棋盘点着就好。”', quality: 3, emoji: '🔻', slot: 'float', tone: 'devil', description: '每天首次 5 连：棋盘上 5 个随机格被五芒星点亮后炸开。', effect: { type: 'firstFiveScatterPop', count: 5 }, penalty: { type: 'nextDaySteps', value: 3 }, penaltyText: '明天初始步数 -3。', reaction: '五芒星亮了，五个方块应声炸开。小猪假装自己没参与。' },
  mawOfTheVoid: { id: 'mawOfTheVoid', roomType: 'devil', name: '虚空之喉', enName: 'Maw of the Void', titleText: '虚空之喉', flavorText: '“连够三段，它才肯张嘴。”', quality: 4, emoji: '⚫', slot: 'float', tone: 'devil', description: '每天首次 3 段连锁：以 match 中心为中心的 3×3 区域被吞没。', effect: { type: 'firstThreeAreaSweep' }, penalty: { type: 'nextDaySteps', value: 5 }, penaltyText: '明天初始步数 -5。', reaction: '黑色裂口张开，小猪自觉地往后退了一步。' },
  blackCandle: { id: 'blackCandle', roomType: 'devil', name: '黑蜡烛', enName: 'Black Candle', titleText: '黑蜡烛', flavorText: '“火焰是黑的，代价也吞得下。”', quality: 4, emoji: '🕯️', slot: 'back', tone: 'devil', description: '每天开始时，清零所有「明日步数惩罚」。', effect: { type: 'negateNextDayPenalty' }, penalty: { type: 'maxSteps', value: 1 }, penaltyText: '永久步数上限 -1（黑蜡烛抵不了永久代价）。', reaction: '黑蜡烛没有风也在晃，小猪向它鞠了一个非常小的躬。' }
}

/* -------- 9-day data -------- */
export const DAYS = [
  {
    day: 1,
    building: { id: 'courtyard', cn: '庭院', en: 'Courtyard', emoji: '🌿' },
    needs: { grape: 25, wood: 20, stone: 15 },
    ability: 'whiteWolfTidy',
    intro: `庭院里的杂草快长到腰了。石路断了几截，喷泉里只有泥和落叶。
杰洛特站了一会儿，叹了口气。
"行吧。至少没有水鬼。"`,
    completed:
      '石路重新露了出来，喷泉边的藤蔓被修剪整齐。一只白鸦落在旧门柱上，看了他一眼，又飞走了。',
    monologue: '"草长得比食尸鬼还快。先收拾这里，至少……像个人住的地方。"',
    completedBanner: '庭院重新露出了石路。'
  },
  {
    day: 2,
    building: { id: 'vineyard', cn: '葡萄园', en: 'Vineyard', emoji: '🍇' },
    needs: { grape: 45, wood: 25 },
    ability: 'toussentHarvest',
    intro: `葡萄藤还活着。
它们只是被荒草压弯，被风雨忘在了这里。
杰洛特扶起一根藤架，手掌上沾了些泥。`,
    completed:
      '藤架重新立起，嫩叶在风里发亮。远处的陶森特丘陵像一杯浅金色的酒。',
    monologue: '"等得到。葡萄藤比人活得长。"',
    completedBanner: '葡萄藤重新爬上了藤架。'
  },
  {
    day: 3,
    building: { id: 'cellar', cn: '酒窖', en: 'Wine Cellar', emoji: '🛢️' },
    needs: { wood: 28, clay: 28, grape: 19 },
    ability: 'agedBarrel',
    intro: `酒窖里有灰尘、蜘蛛网和几只裂开的旧木桶。
也有几瓶奇迹般活下来的酒。
杰洛特拔开木塞，闻了闻。`,
    completed:
      '石墙被重新加固，木桶排成整齐的一列。最深处的架子上，留出了一瓶酒的位置。',
    monologue: '"还行。留一瓶。她会说酸，但她会喝。"',
    completedBanner: '酒窖里重新有了木桶和灯火。'
  },
  {
    day: 4,
    building: { id: 'stables', cn: '马厩', en: 'Stables', emoji: '🐎' },
    needs: { wood: 45, stone: 35 },
    ability: 'roachPath',
    intro: `马厩的门歪着，屋顶漏了半边。
萝卜站在门口，像是在审查工程质量。
杰洛特看着它。它也看着杰洛特。`,
    completed:
      '新木梁撑起屋顶，干草铺得厚而暖。萝卜走进去，打了个响鼻，似乎勉强认可。',
    monologue: '"行了。你也有顶棚了。别再把头从窗户伸进来。"',
    completedBanner: '马厩里又有了干草和顶棚。'
  },
  {
    day: 5,
    building: { id: 'garden', cn: '花园', en: 'Garden', emoji: '🪻' },
    needs: { herb: 50, grape: 35 },
    ability: 'lilacReturn',
    intro: `花坛荒了很久。泥土里还有旧时的根。
杰洛特蹲下，翻出一小截枯枝，闻到一点几乎消失的香气。
丁香。还有醋栗。`,
    completed: '花园重新有了边界。草药、白花和紫色丁香沿着小径慢慢铺开。',
    monologue: '"她会说我种得死板。然后亲手拔了重来。"',
    completedBanner: '花园里又开了丁香。'
  },
  {
    day: 6,
    building: { id: 'greenhouse', cn: '温室', en: 'Greenhouse', emoji: '🌱' },
    needs: { herb: 40, clay: 30, magic: 20 },
    ability: 'greenhouseNurture',
    intro: `温室的玻璃碎了几块，藤蔓钻进窗缝。
有些花不适合风雨，有些人也一样。
但只要有一点暖光，它们就会重新开。`,
    completed: '新玻璃映出晚霞。温室里有了湿润的土、细小的芽和一盏温暖的灯。',
    monologue: '"花我永远不懂。但冷的时候，门要关好。"',
    completedBanner: '温室的灯重新亮了。'
  },
  {
    day: 7,
    building: { id: 'gazebo', cn: '露台', en: 'Gazebo', emoji: '🌅' },
    needs: { stone: 45, wood: 35, magic: 15 },
    ability: 'toussentSunset',
    intro: `露台朝着夕阳。
地砖松动，栏杆生锈，但视野很好。
杰洛特站在这里，沉默了很久。`,
    completed:
      '露台铺上新石板，栏杆擦出暗金色的光。一张小圆桌旁，只先放了一把椅子。',
    monologue: '"先放一把。两把的话……太像在等了。"',
    completedBanner: '露台等到了夕阳。'
  },
  {
    day: 8,
    building: { id: 'kitchen', cn: '厨房', en: 'Kitchen', emoji: '🍲' },
    needs: { clay: 45, grape: 35, wood: 20 },
    ability: 'lilacSeed',
    intro: `厨房的炉子还能用，只是积了太多灰。
锅挂在墙上，像一面沉默的盾。
杰洛特想了想，也许炖汤不算太难。`,
    completed: '炉火重新亮起。木桌擦干净，架子上放着酒、面包和几束草药。',
    monologue: '"做饭不是我的专长。但炖汤，应该死不了人。"',
    completedBanner: '厨房里又升起了炉火。'
  },
  {
    day: 9,
    building: {
      id: 'lilacSuite',
      cn: '紫丁香客房',
      en: 'Lilac Suite',
      emoji: '🛏️'
    },
    needs: { wood: 30, herb: 22, magic: 18 },
    ability: 'hearthStew',
    intro: `最后一间房朝向花园。
早晨有阳光，傍晚能闻到丁香。
杰洛特把旧床板拆掉，换上新的木架。`,
    completed:
      '房间安静下来。窗边有书桌，床边有两只枕头，花瓶里插着紫丁香。风吹进来，窗帘轻轻动了一下。',
    monologue: '"床别太硬。枕头放两个。她说不会在意，但她会。"',
    completedBanner: '紫丁香客房，已为她准备好。',
    ending: true
  }
]

/* -------- Day-end gentle reminders -------- */
export const DAY_END_LINES = [
  '太阳快落山了。今天先到这里。',
  '再修下去，萝卜都要嫌我吵了。',
  '明天继续。葡萄藤不会一夜之间跑掉。',
  '工具放好。明天接着干。',
  '今天先这样。陶森特的天黑得慢。'
]

export const MONSTERS = {
  barrenGrave: {
    id: 'barrenGrave',
    name: '贫瘠土地',
    emoji: '🪦',
    category: 'terrain',
    uiLabel: '贫瘠土地',
    statusLabel: '土地仍封着 · 本日不可恢复',
    uiWeaknessShort: '随着庄园逐日恢复，这片封着的地才会慢慢松开。',
    uiPressureShort: '这片地太冷太荒，今天还不会重新长起来。',
    hp: 0,
    hits: 0,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'none',
      hint: '土地仍太贫瘠，今天还无法恢复。等后面的日子继续修整，这些墓碑才会逐渐减少。'
    },
    pressureRule: { type: 'none' },
    telegraph: '荒地封印',
    echoLabel: '随着天数推进，庄园会一点点把这些荒地重新要回来。',
    clearRule: {
      type: 'none',
      hint: '土地仍太贫瘠，今天还无法恢复。等后面的日子继续修整，这些墓碑才会逐渐减少。'
    },
    introLine: ''
  },
  blightMark: {
    id: 'blightMark',
    char: 'B',
    name: '疾病印记',
    emoji: '🦠',
    category: 'ritual',
    uiLabel: '疾病印记',
    uiWeaknessShort: '弱点：在它上下左右打出一次三消。',
    uiPressureShort: '这是第一愿要驱散的病气。',
    hp: 3,
    hits: 3,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'orthogonalAdjacent',
      hint: '在它上下左右打出一次 3 连及以上匹配，就能驱散这个疾病印记。'
    },
    pressureRule: { type: 'none' },
    telegraph: '病气',
    echoLabel: '清掉全部 6 个印记，就能完成第一愿。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在它上下左右打出一次 3 连及以上匹配，就能驱散这个疾病印记。'
    },
    introLine: '病气浮出来了。先把它们清干净。',
    removeLine: '又散掉一个。'
  },
  joyCandle: {
    id: 'joyCandle',
    name: '欢欣蜡烛',
    emoji: '🕯️',
    category: 'ritual',
    uiLabel: '欢欣蜡烛',
    statusLabel: '守在角落 · 不参与匹配',
    uiWeaknessShort: '这是第二愿的角落烛火，不参与匹配。',
    uiPressureShort: '只要完成一次 4 连，或打出一次 2 连锁，它们就会一起亮起。',
    hp: 3,
    hits: 3,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'none',
      hint: '它只是第二愿的角落烛火占位，不会参与匹配，也不会被消除。'
    },
    pressureRule: { type: 'none' },
    telegraph: '角落烛火',
    echoLabel: '四个角落的蜡烛会一直守在原位。',
    clearRule: {
      type: 'none',
      hint: '它只是第二愿的角落烛火占位，不会参与匹配，也不会被消除。'
    },
    introLine: '四角的烛火已经就位了。',
    removeLine: ''
  },
  nekkers: {
    id: 'nekkers',
    char: 'N',
    name: '孽鬼',
    emoji: '👺',
    uiLabel: '孽鬼',
    uiWeaknessShort: '弱点：在它上下左右打出一次三消。',
    uiPressureShort: '它不会移动，只会一直占住这一格。',
    hp: 3,
    hits: 3,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'orthogonalAdjacent',
      hint: '在它上下左右打出一次 3 连及以上匹配，就会削掉 1 点生命。'
    },
    pressureRule: { type: 'none' },
    telegraph: '静止占位',
    echoLabel: '击退后，空出这一格。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在它上下左右打出一次 3 连及以上匹配，就会削掉 1 点生命。'
    },
    introLine: '孽鬼。闻到葡萄味了。',
    removeLine: '去别处找吃的。'
  },
  drowner: {
    id: 'drowner',
    char: 'D',
    name: '水鬼',
    emoji: '🧟',
    uiLabel: '水鬼',
    uiWeaknessShort: '弱点：在它上下左右打出一次三消。',
    uiPressureShort: '它不会移动，只会一直占住这一格。',
    hp: 4,
    hits: 4,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'orthogonalAdjacent',
      hint: '在它上下左右打出一次 3 连及以上匹配，就会削掉 1 点生命。'
    },
    pressureRule: { type: 'none' },
    telegraph: '静止占位',
    echoLabel: '击退后，空出这一格。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在它上下左右打出一次 3 连及以上匹配，就会削掉 1 点生命。'
    },
    introLine: '水鬼。闻到葡萄味了？',
    removeLine: '回水里去。'
  },
  ghoul: {
    id: 'ghoul',
    char: 'G',
    name: '食尸鬼',
    emoji: '🧌',
    uiLabel: '食尸鬼',
    uiWeaknessShort: '弱点：在它上下左右打出一次三消。',
    uiPressureShort: '它不会移动，只会一直占住这一格。',
    hp: 4,
    hits: 4,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'orthogonalAdjacent',
      hint: '在它上下左右打出一次 3 连及以上匹配，就会削掉 1 点生命。'
    },
    pressureRule: { type: 'none' },
    telegraph: '静止占位',
    echoLabel: '击退后，空出这一格。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在它上下左右打出一次 3 连及以上匹配，就会削掉 1 点生命。'
    },
    introLine: '食尸鬼。大概是跟着我来的。',
    removeLine: '走吧。这里没你要的。'
  },
  griffinChick: {
    id: 'griffinChick',
    char: 'C',
    name: '狮鹫幼雏',
    emoji: '🦅',
    uiLabel: '狮鹫幼雏',
    uiWeaknessShort: '弱点：在它上下左右打出一次三消。',
    uiPressureShort: '它不会移动，只会一直占住这一格。',
    hp: 5,
    hits: 5,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'orthogonalAdjacent',
      hint: '在它上下左右打出一次 3 连及以上匹配，就会削掉 1 点生命。'
    },
    pressureRule: { type: 'none' },
    telegraph: '静止占位',
    echoLabel: '击退后，空出这一格。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在它上下左右打出一次 3 连及以上匹配，就会削掉 1 点生命。'
    },
    introLine: '狮鹫幼雏。在等大的回来。',
    removeLine: '飞远点。等大的来接你。'
  },
  wraith: {
    id: 'wraith',
    char: 'W',
    name: '怨灵',
    emoji: '👻',
    uiLabel: '怨灵',
    uiWeaknessShort: '弱点：在它上下左右打出一次三消。',
    uiPressureShort: '它不会移动，只会一直占住这一格。',
    hp: 5,
    hits: 5,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'orthogonalAdjacent',
      hint: '在它上下左右打出一次 3 连及以上匹配，就会削掉 1 点生命。'
    },
    pressureRule: { type: 'none' },
    telegraph: '静止占位',
    echoLabel: '击退后，空出这一格。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在它上下左右打出一次 3 连及以上匹配，就会削掉 1 点生命。'
    },
    introLine: '怨灵。得用点魔力才能让它散。',
    removeLine: '安静了。'
  },
  djinn: {
    id: 'djinn',
    name: '迪精',
    emoji: '🧞',
    uiLabel: '迪精',
    uiWeaknessShort: '本阶段要求：命中封印外圈。',
    uiPressureShort: '下一次推进，会唤起一段愿望。',
    uiStageRules: {
      0: '第 1 阶段：普通正交匹配命中外圈封印。',
      1: '第 2 阶段：纵向匹配命中纵向封印。',
      2: '第 3 阶段：连锁 ≥2 或 4 连及以上命中命运封印。',
      3: '封印已满，愿望正在成形。'
    },
    uiStagePreview: {
      0: '下一次推进，会唤起第一个愿望。',
      1: '下一次推进，会唤起第二个愿望。',
      2: '下一次推进，会唤起最后的愿望。',
      3: '迪精已经听见了。'
    },
    hits: 3,
    damageRule: { type: 'djinnStages' },
    telegraph: '阶段封印',
    echoLabel: '每阶段推进一次愿望叙事。',
    clearRule: {
      type: 'djinnCorners',
      hint: '三段封印依次要求：普通正交、纵向、连锁或大组。'
    },
    introLine: '……是你。我以为你已经走了。'
  }
}

export const MONSTER_BY_CHAR = Object.fromEntries(
  Object.values(MONSTERS)
    .filter(monster => monster.char)
    .map(monster => [monster.char, monster])
)

export const MONSTER_CHARS = Object.keys(MONSTER_BY_CHAR)

export const DAY_MONSTER_LAYOUTS = {
  0: [
    { id: 'd1-nekkers-a', kind: 'nekkers', row: 2, col: 5 },
    { id: 'd1-nekkers-b', kind: 'nekkers', row: 4, col: 2 }
  ],
  1: [{ id: 'd2-nekkers-a', kind: 'nekkers', row: 3, col: 4 }],
  2: [{ id: 'd3-drowner-a', kind: 'drowner', row: 2, col: 5 }],
  3: [
    { id: 'd4-drowner-a', kind: 'drowner', row: 1, col: 5 },
    { id: 'd4-nekkers-a', kind: 'nekkers', row: 4, col: 2 }
  ],
  4: [
    { id: 'd5-ghoul-a', kind: 'ghoul', row: 2, col: 1 },
    { id: 'd5-drowner-a', kind: 'drowner', row: 4, col: 5 }
  ],
  5: [
    { id: 'd6-wraith-a', kind: 'wraith', row: 1, col: 5 },
    { id: 'd6-ghoul-a', kind: 'ghoul', row: 4, col: 2 }
  ],
  6: [
    { id: 'd7-griffinChick-a', kind: 'griffinChick', row: 2, col: 5 },
    { id: 'd7-ghoul-a', kind: 'ghoul', row: 5, col: 2 }
  ],
  7: [
    { id: 'd8-griffinChick-a', kind: 'griffinChick', row: 2, col: 3 },
    { id: 'd8-wraith-a', kind: 'wraith', row: 4, col: 5 }
  ],
  8: [{ id: 'd9-djinn-a', kind: 'djinn', row: 3, col: 3, width: 2, height: 2 }]
}

// Early-board pacing curve tuned around the 8x8 board.
// Graves only change between days now; there is no mid-day release.
// Count curve by day 1-7: 25 / 20 / 18 / 15 / 10 / 6 / 0
export const BARREN_GRAVE_LAYOUTS = {
  0: [
    { id: 'd1-barren-a', row: 0, col: 0 },
    { id: 'd1-barren-b', row: 0, col: 1 },
    { id: 'd1-barren-c', row: 0, col: 2 },
    { id: 'd1-barren-d', row: 0, col: 4 },
    { id: 'd1-barren-e', row: 0, col: 5 },
    { id: 'd1-barren-f', row: 0, col: 6 },
    { id: 'd1-barren-g', row: 0, col: 7 },
    { id: 'd1-barren-h', row: 1, col: 0 },
    { id: 'd1-barren-i', row: 1, col: 7 },
    { id: 'd1-barren-j', row: 2, col: 0 },
    { id: 'd1-barren-k', row: 2, col: 7 },
    { id: 'd1-barren-l', row: 3, col: 0 },
    { id: 'd1-barren-m', row: 3, col: 7 },
    { id: 'd1-barren-n', row: 4, col: 0 },
    { id: 'd1-barren-o', row: 4, col: 7 },
    { id: 'd1-barren-p', row: 5, col: 0 },
    { id: 'd1-barren-q', row: 5, col: 7 },
    { id: 'd1-barren-r', row: 6, col: 0 },
    { id: 'd1-barren-s', row: 6, col: 7 },
    { id: 'd1-barren-t', row: 7, col: 0 },
    { id: 'd1-barren-u', row: 7, col: 1 },
    { id: 'd1-barren-v', row: 7, col: 2 },
    { id: 'd1-barren-w', row: 7, col: 5 },
    { id: 'd1-barren-x', row: 7, col: 6 },
    { id: 'd1-barren-y', row: 7, col: 7 }
  ],
  1: [
    { id: 'd2-barren-a', row: 0, col: 0 },
    { id: 'd2-barren-b', row: 0, col: 1 },
    { id: 'd2-barren-c', row: 0, col: 2 },
    { id: 'd2-barren-d', row: 0, col: 4 },
    { id: 'd2-barren-e', row: 0, col: 5 },
    { id: 'd2-barren-f', row: 0, col: 6 },
    { id: 'd2-barren-g', row: 0, col: 7 },
    { id: 'd2-barren-h', row: 1, col: 0 },
    { id: 'd2-barren-i', row: 1, col: 7 },
    { id: 'd2-barren-j', row: 2, col: 0 },
    { id: 'd2-barren-k', row: 2, col: 7 },
    { id: 'd2-barren-l', row: 3, col: 0 },
    { id: 'd2-barren-m', row: 3, col: 7 },
    { id: 'd2-barren-n', row: 5, col: 0 },
    { id: 'd2-barren-o', row: 5, col: 7 },
    { id: 'd2-barren-p', row: 6, col: 0 },
    { id: 'd2-barren-q', row: 6, col: 7 },
    { id: 'd2-barren-r', row: 7, col: 0 },
    { id: 'd2-barren-s', row: 7, col: 1 },
    { id: 'd2-barren-t', row: 7, col: 6 }
  ],
  2: [
    { id: 'd3-barren-a', row: 0, col: 0 },
    { id: 'd3-barren-b', row: 0, col: 1 },
    { id: 'd3-barren-c', row: 0, col: 2 },
    { id: 'd3-barren-d', row: 0, col: 5 },
    { id: 'd3-barren-e', row: 0, col: 6 },
    { id: 'd3-barren-f', row: 0, col: 7 },
    { id: 'd3-barren-g', row: 1, col: 0 },
    { id: 'd3-barren-h', row: 1, col: 7 },
    { id: 'd3-barren-i', row: 2, col: 0 },
    { id: 'd3-barren-j', row: 2, col: 7 },
    { id: 'd3-barren-k', row: 3, col: 0 },
    { id: 'd3-barren-l', row: 3, col: 7 },
    { id: 'd3-barren-m', row: 5, col: 0 },
    { id: 'd3-barren-n', row: 5, col: 7 },
    { id: 'd3-barren-o', row: 6, col: 0 },
    { id: 'd3-barren-p', row: 6, col: 7 },
    { id: 'd3-barren-q', row: 7, col: 0 },
    { id: 'd3-barren-r', row: 7, col: 1 }
  ],
  3: [
    { id: 'd4-barren-a', row: 0, col: 0 },
    { id: 'd4-barren-b', row: 0, col: 1 },
    { id: 'd4-barren-c', row: 0, col: 2 },
    { id: 'd4-barren-d', row: 0, col: 6 },
    { id: 'd4-barren-e', row: 0, col: 7 },
    { id: 'd4-barren-f', row: 1, col: 0 },
    { id: 'd4-barren-g', row: 2, col: 0 },
    { id: 'd4-barren-h', row: 2, col: 7 },
    { id: 'd4-barren-i', row: 3, col: 0 },
    { id: 'd4-barren-j', row: 3, col: 7 },
    { id: 'd4-barren-k', row: 5, col: 0 },
    { id: 'd4-barren-l', row: 5, col: 7 },
    { id: 'd4-barren-m', row: 6, col: 0 },
    { id: 'd4-barren-n', row: 6, col: 7 },
    { id: 'd4-barren-o', row: 7, col: 0 }
  ],
  4: [
    { id: 'd5-barren-a', row: 0, col: 0 },
    { id: 'd5-barren-b', row: 0, col: 1 },
    { id: 'd5-barren-c', row: 0, col: 6 },
    { id: 'd5-barren-d', row: 0, col: 7 },
    { id: 'd5-barren-e', row: 1, col: 0 },
    { id: 'd5-barren-f', row: 1, col: 7 },
    { id: 'd5-barren-g', row: 6, col: 0 },
    { id: 'd5-barren-h', row: 6, col: 7 },
    { id: 'd5-barren-i', row: 7, col: 0 },
    { id: 'd5-barren-j', row: 7, col: 7 }
  ],
  5: [
    { id: 'd6-barren-a', row: 0, col: 0 },
    { id: 'd6-barren-b', row: 0, col: 7 },
    { id: 'd6-barren-c', row: 3, col: 0 },
    { id: 'd6-barren-d', row: 3, col: 7 },
    { id: 'd6-barren-e', row: 7, col: 0 },
    { id: 'd6-barren-f', row: 7, col: 7 }
  ],
  6: []
}

export const DJINN_WISHES = {
  sleepTitle: '沉睡的迪精',
  sleepHint: '她还在睡。先把紫丁香客房准备好，再唤醒最后的仪式。',
  sleepLine: '迪精还在睡，头顶轻轻浮着 💤。',
  wakeTitle: '迪精醒来',
  wakeQuote: '最后一盏灯亮起来时，那团沉睡已久的光，也慢慢睁开了眼。',
  wakeIntroLines: [
    '客房里的风轻轻掀起窗帘，紫丁香的香气顺着门缝漫出来。',
    '棋盘中央那团蜷着睡意的光轻轻一颤，头顶的 💤 一点点散开。',
    '迪精抬起头，看向你，像终于等到了该说出口的祝福。'
  ],
  readyTitle: '迪精',
  readyHint: '资源已经备齐。点击迪精，开始最后的仪式。',
  readyLine: '紫丁香客房已经准备好。剩下的，是要把祝福亲手送进去。',
  wakeLine: '紫丁香客房已经准备好。迪精醒了，等你开始最后的仪式。',
  ceremonyDoneLine: '愿望已经说完，灯也亮起来了。',
  stages: {
    1: {
      id: 'health',
      title: '第一愿 · 祛病',
      quote: '先把所有不该留下的阴影驱散，让身体安稳，让病痛退场。',
      introLines: [
        '迪精在棋盘中央缓慢呼吸，像一团还没说出口的光。',
        '第一愿落下时，迪精周围浮起一圈病气印记。',
        '把它们一一清掉，愿小云身体健康，所有疾病都远离她。'
      ],
      wishText: '愿小云身体健康，所有疾病都远离她。',
      layoutId: 'health',
      objective: {
        type: 'clearMarks',
        total: 8,
        label: '在印记周围打出三消，清掉围住迪精一圈的 8 个病气印记'
      },
      resolveLines: [
        '病气散了，药草色的光沿着封印慢慢亮起。',
        '第一愿已经被听见。'
      ]
    },
    2: {
      id: 'joy',
      title: '第二愿 · 欢欣',
      quote: '愿日子不只平稳，还能发亮，能热闹，能笑出来。',
      introLines: [
        '第一圈封印暖下来，四角点起细小的欢乐火花。',
        '接下来要让它们全部亮透。',
        '愿小云生活快乐，每天都能乐趣多多。'
      ],
      wishText: '愿小云生活快乐，每天都能乐趣多多。',
      layoutId: 'joy',
      objective: {
        type: 'joyBursts',
        total: 1,
        label: '完成一次 4 连，或打出一次 2 连锁',
        rulesText: '完成一次 4 连或更大组，或打出一次 2 连锁即可'
      },
      resolveLines: [
        '彩带般的光从四角拢向中央，花园风里都带了笑意。',
        '第二愿已经被听见。'
      ]
    },
    3: {
      id: 'cake',
      title: '第三愿 · 生日蛋糕',
      quote: '最后这一愿，不是驱散，也不是点亮，是把以后的日子认真摆在桌上。',
      introLines: [
        '迪精抬起头，光从封印里一层层褪开。',
        '这一次，不再是对抗，而是亲手完成一份祝福。',
        '最后一个愿望本来想让你许，但是我私心帮你许了。',
        '愿小云平安幸福，永远和小坤生活在一起。'
      ],
      wishText: '最后一个愿望本来想让你许，但是我私心帮你许了。愿小云平安幸福，永远和小坤生活在一起。',
      layoutId: 'cake',
      objective: {
        type: 'cakeSequence',
        total: 3,
        label: '按顺序完成生日蛋糕',
        steps: [
          '先达成一次葡萄 3 连及以上，做出蛋糕底座。',
          '再达成一次草药 3 连及以上，铺出紫丁香奶油。',
          '最后达成一次魔力 3 连及以上，或一次 2 连锁，点亮蜡烛。'
        ]
      },
      resolveLines: [
        '蛋糕终于完整立在桌上，烛光一层层升起，像把往后的日子都照亮了。',
        '第三愿也已经被听见。'
      ]
    }
  }
}

export const DJINN_CEREMONY_LAYOUTS = {
  health: [
    'gwwhhmwg',
    'whmghhwg',
    'ghgmhhmh',
    'mwhOOgwh',
    'hhgOOwhg',
    'wgmhhgwm',
    'ghwhmgwh',
    'mwgghhwm'
  ],
  joy: [
    'gwhmghwg',
    'mghwhmgh',
    'whgmghwh',
    'ghmOOghm',
    'mwhOOmwg',
    'ghwmghwh',
    'whgmwhgm',
    'mghwhgwm'
  ],
  cake: [
    'ggwhmghm',
    'wghmghwg',
    'hmgwhwgh',
    'mghOOhmg',
    'gghOOmgw',
    'whmgghwm',
    'mghwhmgm',
    'ghwmghwg'
  ]
}

export const DJINN_MARK_SETS = {
  health: [
    { id: 'djinn-blight-1', kind: 'blightMark', row: 2, col: 3 },
    { id: 'djinn-blight-2', kind: 'blightMark', row: 2, col: 4 },
    { id: 'djinn-blight-3', kind: 'blightMark', row: 3, col: 2 },
    { id: 'djinn-blight-4', kind: 'blightMark', row: 3, col: 5 },
    { id: 'djinn-blight-5', kind: 'blightMark', row: 4, col: 2 },
    { id: 'djinn-blight-6', kind: 'blightMark', row: 4, col: 5 },
    { id: 'djinn-blight-7', kind: 'blightMark', row: 5, col: 3 },
    { id: 'djinn-blight-8', kind: 'blightMark', row: 5, col: 4 }
  ],
  joy: [
    { id: 'djinn-joy-1', row: 0, col: 0 },
    { id: 'djinn-joy-2', row: 0, col: 7 },
    { id: 'djinn-joy-3', row: 7, col: 0 },
    { id: 'djinn-joy-4', row: 7, col: 7 }
  ]
}

export const DJINN_STAGE_TRANSITIONS = {
  '1-2': {
    id: 'blightToJoy',
    fromStage: 1,
    toStage: 2,
    durationMs: 2000,
    title: '封印重组',
    hint: '病气正在散去，四角的烛火即将亮起。',
    sourceCells: DJINN_MARK_SETS.health.map((cell) => ({ row: cell.row, col: cell.col })),
    targetCells: DJINN_MARK_SETS.joy.map((cell) => ({ row: cell.row, col: cell.col })),
    palette: {
      primary: 'rgba(168, 214, 156, 0.92)',
      secondary: 'rgba(176, 148, 201, 0.9)',
      glow: 'rgba(255, 220, 136, 0.96)'
    }
  },
  '2-3': {
    id: 'joyToCake',
    fromStage: 2,
    toStage: 3,
    durationMs: 2000,
    title: '祝福成形',
    hint: '角落的光正在向中央汇拢，最后的愿望即将成形。',
    sourceCells: DJINN_MARK_SETS.joy.map((cell) => ({ row: cell.row, col: cell.col })),
    targetCells: [
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 4, col: 3 },
      { row: 4, col: 4 }
    ],
    palette: {
      primary: 'rgba(255, 222, 142, 0.96)',
      secondary: 'rgba(214, 164, 255, 0.82)',
      glow: 'rgba(255, 186, 108, 0.94)'
    }
  }
}

/* -------- Estate strip -------- */
export const ESTATE_STRIP_STAGES = [
  {
    unlockCount: 1,
    buildingId: 'courtyard',
    segmentId: 'courtyard',
    revealLabel: '新修复 · 庭院',
    ambientLevel: 1,
    hotspots: [
      {
        id: 'white-raven',
        label: '白鸦',
        unlockCount: 1,
        motion: 'ravenFlap',
        lines: [
          '白鸦掠过门柱，像在验收今天的活。',
          '它停了一小会儿，像是默认这里能住人了。'
        ],
        anchor: { x: 26, y: 26 }
      }
    ]
  },
  {
    unlockCount: 2,
    buildingId: 'vineyard',
    segmentId: 'vineyard',
    revealLabel: '新修复 · 葡萄园',
    ambientLevel: 2,
    hotspots: [
      {
        id: 'vine-glow',
        label: '藤架',
        unlockCount: 2,
        motion: 'vineShine',
        lines: [
          '新扶正的藤架，在风里慢慢找回了方向。',
          '葡萄还没完全熟透，但已经不像被忘掉的样子了。'
        ],
        anchor: { x: 54, y: 38 }
      }
    ]
  },
  {
    unlockCount: 3,
    buildingId: 'cellar',
    segmentId: 'cellar',
    revealLabel: '新修复 · 酒窖',
    ambientLevel: 3,
    hotspots: [
      {
        id: 'cellar-lamp',
        label: '酒窖灯火',
        unlockCount: 3,
        motion: 'cellarGlow',
        lines: [
          '灯火一亮，连旧木桶都像重新有了脾气。',
          '酒香还很浅，但已经足够让这地方不像废墟。'
        ],
        anchor: { x: 51, y: 48 }
      }
    ]
  },
  {
    unlockCount: 4,
    buildingId: 'stables',
    segmentId: 'stables',
    revealLabel: '新回归 · 萝卜',
    ambientLevel: 4,
    hotspots: [
      {
        id: 'roach',
        label: '萝卜',
        unlockCount: 4,
        motion: 'roachCycle',
        lines: [
          '它把头探出来，像在确认干草够不够厚。',
          '响鼻打得很响，意见倒是一句都没少。',
          '前蹄轻轻踏了两下，像是勉强表示认可。'
        ],
        anchor: { x: 46, y: 44 }
      }
    ]
  },
  {
    unlockCount: 5,
    buildingId: 'garden',
    segmentId: 'garden',
    revealLabel: '新修复 · 花园',
    ambientLevel: 5,
    hotspots: [
      {
        id: 'lilac-bloom',
        label: '丁香',
        unlockCount: 5,
        motion: 'petalBurst',
        lines: [
          '花香还很轻，却已经先一步把荒凉挤开了。',
          '丁香和草药沿着小径回来了，像有人快要到访。'
        ],
        anchor: { x: 57, y: 34 }
      }
    ]
  },
  {
    unlockCount: 6,
    buildingId: 'greenhouse',
    segmentId: 'greenhouse',
    revealLabel: '新修复 · 温室',
    ambientLevel: 6,
    hotspots: [
      {
        id: 'glass-mist',
        label: '暖房',
        unlockCount: 6,
        motion: 'glassMist',
        lines: [
          '暖灯透过新玻璃，连潮气都显得有了秩序。',
          '窗面被雾气擦亮了一瞬，里面的小芽也醒了。'
        ],
        anchor: { x: 52, y: 28 }
      }
    ]
  },
  {
    unlockCount: 7,
    buildingId: 'gazebo',
    segmentId: 'gazebo',
    revealLabel: '新修复 · 露台',
    ambientLevel: 7,
    hotspots: [
      {
        id: 'sunset-seat',
        label: '露台椅子',
        unlockCount: 7,
        motion: 'sunGlint',
        lines: [
          '只有一把椅子立在桌旁，像是连等待都还没完全说出口。',
          '夕阳擦过栏杆，像是替谁先把位置留了下来。'
        ],
        anchor: { x: 56, y: 40 }
      }
    ]
  },
  {
    unlockCount: 8,
    buildingId: 'kitchen',
    segmentId: 'kitchen',
    revealLabel: '新修复 · 厨房',
    ambientLevel: 8,
    hotspots: [
      {
        id: 'hearth-steam',
        label: '炉火',
        unlockCount: 8,
        motion: 'steamPulse',
        lines: [
          '炉火一旺起来，整间厨房就忽然像有人在等饭。',
          '蒸汽往窗上一扑，连冷清都被赶去了门外。'
        ],
        anchor: { x: 58, y: 36 }
      }
    ]
  },
  {
    unlockCount: 9,
    buildingId: 'lilacSuite',
    segmentId: 'lilacSuite',
    revealLabel: '新修复 · 紫丁香客房',
    ambientLevel: 9,
    hotspots: [
      {
        id: 'suite-curtain',
        label: '窗边',
        unlockCount: 9,
        motion: 'curtainSway',
        lines: [
          '窗帘被风轻轻拨动，像有人刚刚从花园走过。',
          '花瓶里的紫丁香安静站着，房间终于像是准备好了。'
        ],
        anchor: { x: 58, y: 30 }
      }
    ]
  }
]

export const ESTATE_PIG_LINES = {
  early: [
    '小猪在还没修好的石路边拱了两下土，像先替这里试住。',
    '它沿着门前的小路慢慢晃，倒像比人更早把这儿当家。',
    '你一看它，它就装作自己只是在散步。'
  ],
  mid: [
    '它已经敢一路晃到花园边了，闻闻干草，又闻闻新开的丁香。',
    '小猪拱过小路边的草，尾巴甩了一下，像在检查今天又多修好了什么。',
    '它对工程没有意见。对晚饭倒是一直很有意见。'
  ],
  late: [
    '它现在连厨房窗下都敢守着了，明显知道哪边会先有香味。',
    '小猪绕着亮灯的屋檐底下转了一圈，像在数今晚会不会有人都回来。',
    '它在紫丁香客房前停了一会儿，又慢吞吞往花园那边走了。'
  ]
}

/* -------- Ending -------- */
export const ENDING = {
  beats: [
    {
      id: 'suite',
      title: '紫丁香客房',
      lines: [
        '紫丁香客房，已为她准备好。',
        '风从半开的窗里吹进来，窗帘轻轻动了一下。'
      ]
    },
    {
      id: 'cake',
      title: '生日夜',
      lines: [
        '桌上摆着刚刚完成的生日蛋糕，烛光还在一层层亮起。',
        '白鸦停在窗边，像是也安静下来，等这份祝福落定。'
      ]
    },
    {
      id: 'wishes',
      title: '三条愿望',
      lines: [
        '愿小云身体健康，所有疾病都远离她。',
        '愿小云生活快乐，每天都能乐趣多多。',
        '愿小云平安幸福，永远和小坤生活在一起。'
      ]
    },
    {
      id: 'blessing',
      title: '留灯',
      lines: [
        'Corvo Bianco 的灯终于都亮了起来。',
        '今夜的祝福，会留在这里，陪他们把以后的日子慢慢过完。'
      ]
    }
  ],
  candleLines: [
    '第一支蜡烛亮起，为健康。',
    '第二支蜡烛亮起，为快乐。',
    '第三支蜡烛亮起，为平安与相守。'
  ],
  defaultGift: '献给小云。',
  lockedGift: '献给小云。',
  blessingLine: '也愿小坤和小云平安幸福，长久相伴。',
  interceptLine: '哦，我想起来了。你不是小云吗？还在选什么，我帮你填下去就行。',
  giftPresets: [
    { id: 'friend', label: '朋友', text: '朋友' },
    { id: 'lover', label: '恋人', text: '恋人' },
    { id: 'family', label: '家人', text: '家人' },
    { id: 'self', label: '自己', text: '自己' }
  ]
}

export const ACHIEVEMENTS = [
  {
    id: 'day1_clear_the_way',
    title: '先把路找出来',
    description: '第 1 天完成庭院修复，且未使用白狼整顿。',
    icon: '🌿',
    rarity: 'common',
    hidden: false,
    flavor: '石路露出来的时候，这里终于像能住人了。',
    trigger: { type: 'dayComplete', day: 1 }
  },
  {
    id: 'day2_vines_remember',
    title: '藤蔓记得回家',
    description: '第 2 天完成葡萄园修复，且当日至少出现过一次 4 连或更大组。',
    icon: '🍇',
    rarity: 'common',
    hidden: false,
    flavor: '藤蔓没有忘记该往哪里爬。',
    trigger: { type: 'dayComplete', day: 2 }
  },
  {
    id: 'day3_one_bottle_saved',
    title: '留一瓶',
    description: '第 3 天完成酒窖修复，且当天击退过水鬼。',
    icon: '🛢️',
    rarity: 'common',
    hidden: false,
    flavor: '最深处，总该留一瓶给以后。',
    trigger: { type: 'dayComplete', day: 3 }
  },
  {
    id: 'day4_roach_approves',
    title: '萝卜点头了',
    description: '第 4 天完成马厩修复，且至少使用过一次萝卜识途。',
    icon: '🐎',
    rarity: 'common',
    hidden: false,
    flavor: '它不夸人，但今天算是默认了。',
    trigger: { type: 'dayComplete', day: 4 }
  },
  {
    id: 'day5_lilac_in_the_wind',
    title: '风里有丁香',
    description: '第 5 天完成花园修复，且完成时剩余步数至少为 6。',
    icon: '🪻',
    rarity: 'rare',
    hidden: false,
    flavor: '香气先回来了，花会慢一点。',
    trigger: { type: 'dayComplete', day: 5 }
  },
  {
    id: 'day6_keep_the_lamp_warm',
    title: '灯别熄',
    description: '第 6 天完成温室修复，且当天至少打出过一次 2 连锁或 4 连以上。',
    icon: '🌱',
    rarity: 'rare',
    hidden: false,
    flavor: '灯亮着，脆弱的东西就愿意活下去。',
    trigger: { type: 'dayComplete', day: 6 }
  },
  {
    id: 'day7_a_chair_for_waiting',
    title: '先放一把椅子',
    description: '第 7 天完成露台修复，且至少使用过一次陶森特日落。',
    icon: '🌅',
    rarity: 'rare',
    hidden: false,
    flavor: '有些等待，先摆一把椅子就够了。',
    trigger: { type: 'dayComplete', day: 7 }
  },
  {
    id: 'day8_the_soup_will_hold',
    title: '汤会热着',
    description: '第 8 天完成厨房修复，且当天从未进入步数耗尽的夜幕。',
    icon: '🍲',
    rarity: 'rare',
    hidden: false,
    flavor: '汤还没好，家已经有味道了。',
    trigger: { type: 'dayComplete', day: 8 }
  },
  {
    id: 'day9_room_for_her',
    title: '为她留灯',
    description: '第 9 天完成紫丁香客房，并完整走到最终结局展示。',
    icon: '🛏️',
    rarity: 'epic',
    hidden: true,
    flavor: '窗边留了花，床边留了光，也留了她的位置。',
    trigger: { type: 'ending' }
  },
  {
    id: 'sunlit_margin',
    title: '天光尚早',
    description: '任意一天完成修复时，剩余步数达到 10 或以上。',
    icon: '☀️',
    rarity: 'common',
    hidden: false,
    flavor: '太阳还在，修好的地方已经先亮起来了。',
    trigger: { type: 'dayComplete' }
  },
  {
    id: 'clutch_finish',
    title: '差一点也够',
    description: '任意一天完成修复时，剩余步数不超过 5。',
    icon: '⏳',
    rarity: 'rare',
    hidden: false,
    flavor: '差一点也够。够把今天做完。',
    trigger: { type: 'dayComplete' }
  },
  {
    id: 'cascade_poetry',
    title: '连锁像诗',
    description: '单次行动打出 3 层或以上连锁。',
    icon: '✨',
    rarity: 'epic',
    hidden: false,
    flavor: '一连串清响之后，整个庄园像跟着醒了一瞬。',
    trigger: { type: 'combo' }
  },
  {
    id: 'grand_harvest',
    title: '丰收时刻',
    description: '出现任意一次 5 消或更大组。',
    icon: '🍷',
    rarity: 'epic',
    hidden: false,
    flavor: '酒还没酿好，丰收的样子已经先来了。',
    trigger: { type: 'matchGroup' }
  },
  {
    id: 'love_from_xiaokun',
    title: '爱你的小坤',
    description: '完整通关并走到最终结局之后解锁。',
    icon: '💛',
    rarity: 'gold',
    hidden: true,
    flavor: '这座葡萄园的尽头，是一封终于送达的心意。',
    trigger: { type: 'ending' }
  }
];
