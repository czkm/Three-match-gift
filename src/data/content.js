/**
 * Static content tables — Corvo Bianco.
 *
 * Resources, days, abilities, narrative quotes — everything that the
 * spec §5–§14 requires. Kept as plain data so it can be diffed without
 * touching engine logic.
 */

/* -------- Resources -------- */
export const RESOURCES = [
  { id: 'grape', char: 'g', label: '橙子', emoji: '🍊', cn: '橙子', chessImg: 'img/chessPiece/orange.png' },
  { id: 'wood', char: 'w', label: '木材', emoji: '🪵', cn: '木材', chessImg: 'img/chessPiece/tree branch.png' },
  { id: 'stone', char: 's', label: '石材', emoji: '🪨', cn: '石材', chessImg: 'img/chessPiece/stone.png' },
  { id: 'clay', char: 'c', label: '黏土', emoji: '🧱', cn: '黏土', chessImg: 'img/chessPiece/clay.png' },
  { id: 'herb', char: 'h', label: '花卉', emoji: '🌸', cn: '花卉', chessImg: 'img/chessPiece/cherry-blossom petal.png' },
  { id: 'magic', char: 'm', label: '星星碎片', emoji: '⭐', cn: '星星碎片', chessImg: 'img/chessPiece/star fragment.png' }
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
    name: '白狼整地',
    desc: '重置整个棋盘，重新排列所有资源狸！',
    quote: '白狼先生说挡路的统统清掉狸！',
    type: 'active',
    usesPerDay: 1,
    icon: '🐺'
  },
  toussentHarvest: {
    id: 'toussentHarvest',
    name: '庄园丰收',
    desc: '选中一个水果方块，周围 3×3 都变成果园狸！',
    quote: '豆狸说这里的阳光晒得果子特别甜狸~',
    type: 'active',
    usesPerDay: 1,
    icon: '🍊',
    needsTarget: 'grape'
  },
  agedBarrel: {
    id: 'agedBarrel',
    name: '旧桶陈香',
    desc: '每累计消除 5 组方块，额外 +1 步。',
    quote: '急不得狸~酒桶知道什么时候该开狸！',
    type: 'passive',
    icon: '🛢️'
  },
  roachPath: {
    id: 'roachPath',
    name: '萝卜识途',
    desc: '任意交换两个方块，不扣步数狸！',
    quote: '别问它怎么过去的狸~它就是能过去狸！',
    type: 'active',
    usesPerDay: 2,
    icon: '🐎',
    needsTarget: 'twoTiles'
  },
  lilacSeed: {
    id: 'lilacSeed',
    name: '丁香播种',
    desc: '将一种资源全部转换为另一种资源狸！',
    quote: '粒狸说花开的方向只有风知道狸~先留点余地狸！',
    type: 'active',
    usesPerDay: 1,
    icon: '🪻',
    needsTarget: 'twoResources'
  },
  greenhouseNurture: {
    id: 'greenhouseNurture',
    name: '暖房滋养',
    desc: '单组 ≥4 时，本组资源 +50%。',
    quote: '门关好灯点上狸~剩下的交给时间狸！',
    type: 'passive',
    icon: '🌱'
  },
  toussentSunset: {
    id: 'toussentSunset',
    name: '庄园日落',
    desc: '消除指定一行或一列狸！',
    quote: '太阳下山了狸~该收工了狸！',
    type: 'active',
    usesPerDay: 1,
    icon: '🌅',
    needsTarget: 'rowOrCol'
  },
  hearthStew: {
    id: 'hearthStew',
    name: '炉火炖汤',
    desc: '恢复 5 步（不超过 20 步上限）。',
    quote: '粒狸说热汤暖胃狸~不算精致但很暖狸！',
    type: 'active',
    usesPerDay: 1,
    icon: '🍲'
  },
  lilacReturn: {
    id: 'lilacReturn',
    name: '紫丁香归途',
    desc: '剩余 ≤5 步时，自动高亮可形成匹配的交换。',
    quote: '杰洛特先生说连风都会先知道狸~',
    type: 'passive',
    icon: '🪻'
  },
  milkTeaBarrage: {
    id: 'milkTeaBarrage',
    name: '奶茶攻击',
    desc: '消耗小猪累积的 5 星评价，选一种资源并将棋盘上该资源全部收获。',
    quote: '小猪今天特别精神狸~甚至想自己上场狸！',
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
      caption: '小猪快乐地甩着尾巴狸~已经开始期待下一杯奶茶了狸！'
    },
    2: {
      emoji: '😊',
      label: '满足',
      caption: '小猪满意地点了点头狸~这一关它觉得干得漂亮狸！'
    },
    1: {
      emoji: '😟',
      label: '将就',
      caption: '小猪勉强哼了一声狸~算是通关了狸~但它还没尽兴狸！'
    },
    0: {
      emoji: '😵',
      label: '没劲',
      caption: '小猪看起来有点蔫狸~像是在说今天的发挥不太行狸！'
    }
  }
}

export const PIG_REACTIONS = {
  gentle: [
    { emoji: '😊', caption: '它哼哼了两声狸~今天心情还不错狸！' },
    { emoji: '😌', caption: '小猪满足地晃了晃耳朵狸~勉强算是给了你点面子狸！' }
  ],
  warm: [
    { emoji: '🐽', caption: '小猪舔了舔鼻子狸~像是在想今天有没有加餐狸！' },
    { emoji: '🥺', caption: '它抬头看了你一眼狸~像是在等一句夸奖狸！' }
  ],
  warning: [
    { emoji: '🤨', caption: '它歪着脑袋看你狸~像是在判断你是不是又来烦它狸！' },
    { emoji: '😤', caption: '它鼻子里重重喷了口气狸~已经开始有点不耐烦了狸！' }
  ],
  angry: {
    emoji: '😠💢',
    caption: '小猪真的生气了狸~今日步数 -1 狸！'
  },
  annoyed: {
    emoji: '😤',
    caption: '它鼻子里重重喷了口气狸~今天已经不太想搭理你了狸！'
  }
}

export const REWARD_ITEMS = {
  /* ───── 宝箱房 7 件（纯正面，无 pigTear） ───── */
  stye: {
    id: 'stye',
    roomType: 'treasure',
    name: '麦粒肿',
    enName: 'Stye',
    titleText: '麦粒肿',
    flavorText: '”那只肿起来的眼睛狸~只能多看一格了狸！”',
    quality: 2,
    emoji: '👁️',
    slot: 'head',
    tone: 'treasure',
    description: '每天第一次四连狸~旁边一个格子跟着清掉狸！',
    effect: { type: 'firstBigMatchAdjacentPop' },
    reaction: '小猪用力眨了下右眼狸~旁边的一个格子应声炸开了狸💥！'
  },
  luckyFoot: {
    id: 'luckyFoot',
    roomType: 'treasure',
    name: '幸运脚',
    enName: 'Lucky Foot',
    titleText: '幸运脚',
    flavorText: '“总有一步踩在好运上狸！”',
    quality: 2,
    emoji: '🍀',
    slot: 'feet',
    tone: 'treasure',
    description: '每天第一次连击狸~三个格子变成今天要的资源狸！',
    effect: { type: 'firstChainScatterConvert', minChain: 2, count: 3 },
    reaction: '小猪踩到一片幸运草狸~脚边的方块自己变了颜色狸！'
  },
  lunch: {
    id: 'lunch',
    roomType: 'treasure',
    name: '午餐',
    enName: 'Lunch',
    titleText: '午餐',
    flavorText: '“吃饱了狸~能多跑几趟狸！”',
    quality: 1,
    emoji: '🥪',
    slot: 'side',
    tone: 'treasure',
    description: '每日步数上限永久 +5。',
    effect: { type: 'maxStepsBonus', amount: 5 },
    reaction: '小猪把它塞进背包拍了拍狸~今天能多走几步了狸！'
  },
  sackOfPennies: {
    id: 'sackOfPennies',
    roomType: 'treasure',
    name: '硬币袋',
    enName: 'Sack of Pennies',
    titleText: '硬币袋',
    flavorText: '“叮当响狸~至少听起来富了狸！”',
    quality: 2,
    emoji: '💰',
    slot: 'side',
    tone: 'treasure',
    description: '每天首次资源结算时，随机一项当前目标资源 +4。',
    effect: { type: 'firstTargetResourceBonus', amount: 4 },
    reaction: '袋子里硬币在响狸~看着哪一项目标自动涨了一点狸！'
  },
  battery: {
    id: 'battery',
    roomType: 'treasure',
    name: '小电池',
    enName: 'The Battery',
    titleText: '小电池',
    flavorText: '“再撑一小会儿狸！”',
    quality: 2,
    emoji: '🔋',
    slot: 'back',
    tone: 'treasure',
    description: '每天第一次四连以上狸~恢复 1 步狸！',
    effect: { type: 'firstBigMatchStep', amount: 1 },
    reaction: '小猪背着它走了两步狸~脚步轻了一点狸！'
  },
  holyWater: {
    id: 'holyWater',
    roomType: 'treasure',
    name: '圣水',
    enName: 'Holy Water',
    titleText: '圣水',
    flavorText: '“出错也会留点余地狸！”',
    quality: 2,
    emoji: '💧',
    slot: 'float',
    tone: 'treasure',
    description:
      '每天第一次出错时返回 1 步狸~旁边两个格子翻成需要的资源狸！',
    effect: { type: 'firstInvalidSwapScatterConvert', count: 2 },
    reaction: '水滴落在一个方块上狸~四周泛起淡淡的光狸！'
  },
  dogTooth: {
    id: 'dogTooth',
    roomType: 'treasure',
    name: '小狗刨刨',
    enName: "Dog's Tooth",
    titleText: '小狗刨刨',
    flavorText: '"小狗最喜欢挖土了狸~咚咚咚几下就挖出来狸！"',
    quality: 2,
    emoji: '🦷',
    slot: 'float',
    tone: 'treasure',
    description: '每天开始时，挖出全部埋藏陶俑狸！',
    effect: { type: 'clearTombstonesOnStart' },
    reaction: '远处传来汪汪声狸~小狗跑过来把陶俑全刨出来啦狸！'
  },

  /* ───── 恶魔房 7 件（正面 + 步数代价） ───── */
  brimstone: {
    id: 'brimstone',
    roomType: 'devil',
    name: '硫磺火',
    enName: 'Brimstone',
    titleText: '硫磺火',
    flavorText: '“烧光一整列狸~眼睛都不眨狸！”',
    quality: 4,
    emoji: '🔥',
    slot: 'back',
    tone: 'devil',
    description: '每天第一次三连狸~整列被清空狸！',
    effect: { type: 'firstThreeColSweep' },
    penalty: { type: 'maxSteps', value: 2 },
    penaltyText: '明天步数会少 4 步狸~。',
    reaction: '小猪嘴角喷出一道火光狸~自己也被烤得往后一跳狸！'
  },
  momsKnife: {
    id: 'momsKnife',
    roomType: 'devil',
    name: '妈妈的刀',
    enName: "Mom's Knife",
    titleText: '妈妈的刀',
    flavorText: '“失手狸~也要见血狸！”',
    quality: 4,
    emoji: '🔪',
    slot: 'side',
    tone: 'devil',
    description: '每天第一次无效交换时狸~所在列被清空狸！',
    effect: { type: 'invalidSwapLineSweep' },
    penalty: { type: 'maxSteps', value: 2 },
    penaltyText: '明天步数会少 4 步狸~。',
    reaction: '刀刃贴着棋盘划过狸~小猪一动不动狸。'
  },
  thePact: {
    id: 'thePact',
    roomType: 'devil',
    name: '契约',
    enName: 'The Pact',
    titleText: '契约',
    flavorText: '“按下手印狸~砝码就会倾斜狸！”',
    quality: 3,
    emoji: '📜',
    slot: 'side',
    tone: 'devil',
    description:
      '每天第一次四连狸~最少的那种资源全部变成最多的狸！',
    effect: { type: 'firstBigMatchResourceBalance' },
    penalty: { type: 'maxSteps', value: 2 },
    penaltyText: '以后每天步数上限少 1 狸~。',
    reaction: '羊皮纸上的字迹扭动起来狸~小猪瞪着棋盘上的方块自动变色狸！'
  },
  darkBeggar: {
    id: 'darkBeggar',
    roomType: 'devil',
    name: '黑暗乞丐',
    enName: 'Dark Beggar',
    titleText: '黑暗乞丐',
    flavorText: '“他伸手要的不是钱狸~是你今天的运气狸！”',
    quality: 3,
    emoji: '🧟',
    slot: 'back',
    tone: 'devil',
    description:
      '每次行动随机扣除修复进度（3~5），累计 2~4 次后补充小猪能量 5 格。',
    effect: {
      type: 'chaoticSabotage',
      minTriggers: 2,
      maxTriggers: 4,
      energyAmount: 5
    },
    penalty: { type: 'maxSteps', value: 2 },
    penaltyText: '以后每天步数上限少 2 狸~。',
    reaction: '黑暗乞丐在棋盘边晃了一圈狸~少了几块砖小猪却精神了一点狸！'
  },
  pentagram: {
    id: 'pentagram',
    roomType: 'devil',
    name: '五芒星',
    enName: 'Pentagram',
    titleText: '五芒星',
    flavorText: '“贪心一点狸~把棋盘点着就好狸！”',
    quality: 3,
    emoji: '🔻',
    slot: 'float',
    tone: 'devil',
    description: '每天第一次五连狸~五个格子被点亮点炸狸！',
    effect: { type: 'firstFiveScatterPop', count: 5 },
    penalty: { type: 'nextDaySteps', value: 3 },
    penaltyText: '明天步数会少 3 步狸~。',
    reaction: '五芒星亮了狸~五个方块应声炸开了狸~小猪假装自己没参与狸！'
  },
  mawOfTheVoid: {
    id: 'mawOfTheVoid',
    roomType: 'devil',
    name: '虚空之喉',
    enName: 'Maw of the Void',
    titleText: '虚空之喉',
    flavorText: '“连够两段狸~它就张嘴狸！”',
    quality: 4,
    emoji: '⚫',
    slot: 'float',
    tone: 'devil',
    description: '每次连击狸~以打中的格子为中心吞掉一片狸！',
    effect: { type: 'sweepAreaOnChain', minChain: 2, areaRows: 3, areaCols: 3 },
    penalty: { type: 'nextDaySteps', value: 5 },
    penaltyText: '明天步数会少 5 步狸~。',
    reaction: '黑色裂口张开了狸~小猪自觉地往后退了一步狸！'
  },
  xRayVision: {
    id: 'xRayVision',
    roomType: 'devil',
    name: 'X光透视',
    enName: 'X-Ray Vision',
    titleText: 'X光透视',
    flavorText: '“我已看清一切狸！”',
    quality: 4,
    emoji: '👁️',
    slot: 'back',
    tone: 'devil',
    description: '每天开始时，自动将非建筑需求的资源随机转为需求资源。',
    effect: { type: 'xRayVision' },
    penalty: { type: 'maxSteps', value: 1 },
    penaltyText: '以后每天步数上限少 1 狸~（看见真相是有代价的狸）。',
    reaction: '小猪看着棋盘上不属于今天的资源被一扫而空狸~满意地点了点头狸！'
  }
}

/* -------- 9-day data -------- */
export const DAYS = [
  {
    day: 1,
    building: { id: 'courtyard', cn: '前院', en: 'Courtyard', emoji: '🌿' },
    needs: { grape: 25, wood: 20, stone: 15 },
    ability: 'whiteWolfTidy',
    intro: '豆狸&粒狸: 今天先修前院狸~！杂草都快长到腰了狸！ ( ……快长到腰了狸！）\n豆狸&粒狸: 白狼先生说先把石路和喷泉修出来狸！ ( ……修出来狸！）',
    completed:
      '石路重新露出来了狸~喷泉边的藤蔓也修剪整齐了狸！白鸦落在门柱上看了一会儿狸！',
    monologue: '白狼先生说先从院子开始狸~这里是庄园的脸面狸！',
    completedBanner: '前院重新露出了石路狸~！'
  },
  {
    day: 2,
    building: { id: 'vineyard', cn: '果园', en: 'Vineyard', emoji: '🍊' },
    needs: { grape: 45, wood: 25 },
    ability: 'toussentHarvest',
    intro: '豆狸&粒狸: 果树还活着狸~！虽然被荒草压弯了狸！ ( ……被荒草压弯了狸！）\n豆狸&粒狸: 小猪在帮忙照料狸~今天修果园狸！ ( ……修果园狸！）',
    completed:
      '果树重新精神起来了狸~嫩叶在风里发亮狸！远处的丘陵像一片金色的果园狸！',
    monologue: '白狼先生说这些果树比他爷爷还老狸~等结果就有自己的果子了狸！',
    completedBanner: '果园里重新飘起了果香狸~！'
  },
  {
    day: 3,
    building: { id: 'cellar', cn: '储藏室', en: 'Wine Cellar', emoji: '🛢️' },
    needs: { wood: 28, clay: 28, grape: 19 },
    ability: 'agedBarrel',
    intro: '豆狸&粒狸: 今天修储藏室狸~！全是灰尘和蜘蛛网狸！ ( ……蜘蛛网狸！）\n豆狸&粒狸: 小猪闻了闻木塞打了个喷嚏狸~不过有几桶好东西还留着狸！ ( ……还留着狸！）',
    completed:
      '石墙加固好了狸~架子排成一列狸！最深处留了一格特别的位置狸！',
    monologue: '白狼先生说这一桶不错狸~存起来等特别的日子再开狸！',
    completedBanner: '储藏室里重新有了架子和小灯狸~！'
  },
  {
    day: 4,
    building: { id: 'stables', cn: '牧场', en: 'Stables', emoji: '🐎' },
    needs: { wood: 45, stone: 35 },
    ability: 'roachPath',
    intro: '豆狸&粒狸: 牧场大门歪了狸~栅栏倒了半边狸！ ( ……倒了半边狸！）\n豆狸&粒狸: 萝卜站在门口审查工程质量狸~小猪也在旁边看着狸！ ( ……看着狸！）',
    completed:
      '新栅栏围起来了狸~干草铺得厚厚暖暖的狸！萝卜进去转了一圈满意了狸！',
    monologue: '白狼先生对萝卜说修好了狸~以后下雨别再乱跑了狸！',
    completedBanner: '牧场里又有了干草和暖棚狸~！'
  },
  {
    day: 5,
    building: { id: 'garden', cn: '花圃', en: 'Garden', emoji: '🪻' },
    needs: { herb: 50, grape: 35 },
    ability: 'lilacReturn',
    intro: '豆狸&粒狸: 今天修花圃狸~！花坛荒了很久狸！ ( ……荒了很久狸！）\n豆狸&粒狸: 小猪翻出一截枯枝狸~闻到了丁香和花香狸！ ( ……花香狸！）',
    completed: '花圃重新有了边界狸~花卉和丁香沿着小径铺开了狸！',
    monologue: '白狼先生说丁香和花香像昨天做过的梦狸~',
    completedBanner: '花圃里又开了丁香狸~！'
  },
  {
    day: 6,
    building: { id: 'greenhouse', cn: '温室', en: 'Greenhouse', emoji: '🌱' },
    needs: { herb: 40, clay: 30, magic: 20 },
    ability: 'greenhouseNurture',
    intro: '豆狸&粒狸: 今天修温室狸~！玻璃碎了几块藤蔓钻进窗缝了狸！ ( ……钻进窗缝了狸！）\n豆狸&粒狸: 有些不耐寒的花暂时搬进去狸~暖光一照就重新精神了狸！ ( ……精神了狸！）',
    completed: '新玻璃映出晚霞了狸~温室里有了暖灯和细小的芽狸！',
    monologue: '花这东西说不准狸~但冷的时候门要关好狸！',
    completedBanner: '温室的灯重新亮了狸~！'
  },
  {
    day: 7,
    building: { id: 'gazebo', cn: '广场', en: 'Gazebo', emoji: '🌅' },
    needs: { stone: 45, wood: 35, magic: 15 },
    ability: 'toussentSunset',
    intro: '豆狸&粒狸: 今天修广场狸~！朝着夕阳视野很好狸！ ( ……视野很好狸！）\n豆狸&粒狸: 地砖松了围栏也生锈了狸~小猪在这里看了很久狸！ ( ……看了很久狸！）',
    completed:
      '广场铺上新石板了狸~围栏擦出暗金色的光狸！小圆桌旁放了一把椅子面朝落日狸！',
    monologue: '先放一把椅子狸~等有人来了再加一把狸！',
    completedBanner: '广场等到了夕阳狸~！'
  },
  {
    day: 8,
    building: { id: 'kitchen', cn: '厨房', en: 'Kitchen', emoji: '🍲' },
    needs: { clay: 45, grape: 35, wood: 20 },
    ability: 'lilacSeed',
    intro: '豆狸&粒狸: 今天修厨房狸~！炉子还能用但积了好多灰狸！ ( ……好多灰狸！）\n豆狸&粒狸: 小猪说炖汤应该不算太难狸~今天加把劲狸！ ( ……加把劲狸！）',
    completed: '炉火重新亮起来了狸~木桌擦干净了狸！架子上放着果酱和花朵狸！',
    monologue: '炖汤只要不烧糊就行狸~加点花果暖暖的狸！',
    completedBanner: '厨房里又升起了炉火狸~！'
  },
  {
    day: 9,
    building: {
      id: 'lilacSuite',
      cn: '星星客房',
      en: 'Lilac Suite',
      emoji: '🛏️'
    },
    needs: { wood: 30, herb: 22, magic: 18 },
    ability: 'hearthStew',
    intro: '豆狸&粒狸: 最后一天狸~修星星客房狸！ ( ……星星客房狸！）\n豆狸&粒狸: 早晨有阳光晚上能看见星星狸~小猪在换新床板狸！ ( ……新床板狸！）',
    completed:
      '房间安静下来了狸~窗边有书桌床边有两只枕头狸！花瓶里插着丁香窗台上放着星星碎片狸！',
    monologue: '枕头放两个狸~床要软一点客人会喜欢的狸！',
    completedBanner: '星星客房收拾好了狸~窗帘在风里轻轻摆动狸！',
    ending: true
  }
]

/* -------- Day-end gentle reminders -------- */
export const DAY_END_LINES = [
  '太阳快落山了狸~今天先到这里狸！',
  '再修下去萝卜都要嫌吵了狸~',
  '明天继续狸~果树不会一夜之间跑掉狸！',
  '工具放好狸~明天接着干狸！',
  '今天先这样狸~天黑得慢明天早点开工狸！'
]

export const MONSTERS = {
  barrenGrave: {
    id: 'barrenGrave',
    name: '陶俑埋藏地',
    emoji: '🪦',
    category: 'terrain',
    uiLabel: '陶俑埋藏地',
    statusLabel: '今天还挖不出来狸~',
    uiWeaknessShort: '地下好像埋着什么狸~再过几天就能挖出来狸！',
    uiPressureShort: '土还有点硬狸~明天再来看看狸！',
    hp: 0,
    hits: 0,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'none',
      hint: '埋得太深了狸~继续建设庄园，陶俑会慢慢露出来狸！'
    },
    pressureRule: { type: 'none' },
    telegraph: '陶俑探测点',
    echoLabel: '庄园越来越热闹狸~陶俑也会慢慢现身狸！',
    clearRule: {
      type: 'none',
      hint: '埋得太深了狸~继续建设庄园，陶俑会慢慢露出来狸！'
    }
  },
  blightMark: {
    id: 'blightMark',
    char: 'B',
    name: '疾病印记',
    emoji: '🦠',
    category: 'ritual',
    uiLabel: '疾病印记',
    uiWeaknessShort: '在旁边凑三连狸~',
    uiPressureShort: '这是第一愿要驱散的病气。',
    hp: 3,
    hits: 3,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'orthogonalAdjacent',
      hint: '在旁边凑三个以上狸~就能驱散这个疾病印记狸！'
    },
    pressureRule: { type: 'none' },
    telegraph: '病气',
    echoLabel: '清掉全部 6 个印记，就能完成第一愿。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在旁边凑三个以上狸~就能驱散这个疾病印记狸！'
    },
    introLine: '病气浮出来了狸！先把它们清干净狸！',
    removeLine: '又散掉一个狸~'
  },
  joyCandle: {
    id: 'joyCandle',
    name: '欢欣蜡烛',
    emoji: '🕯️',
    category: 'ritual',
    uiLabel: '欢欣蜡烛',
    statusLabel: '守在角落·不参与消除',
    uiWeaknessShort: '这是第二愿的角落烛火，不参与消除。',
    uiPressureShort: '只要一次四连狸~或一次连击~它们就会一起亮起狸！',
    hp: 3,
    hits: 3,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'none',
      hint: '它只是第二愿的角落烛火占位，不会参与消除，也不会被消掉。'
    },
    pressureRule: { type: 'none' },
    telegraph: '角落烛火',
    echoLabel: '四个角落的蜡烛会一直守在原位。',
    clearRule: {
      type: 'none',
      hint: '它只是第二愿的角落烛火占位，不会参与消除，也不会被消掉。'
    },
    introLine: '四角的烛火已经就位了狸~',
    removeLine: '烛火熄了狸~',
  },
  nekkers: {
    id: 'nekkers',
    char: 'N',
    name: '螳螂',
    emoji: '🦗',
    img: '/img/monsters/mantis.png',
    uiLabel: '螳螂',
    uiWeaknessShort: '在旁边凑三连狸~',
    uiPressureShort: '它不会移动，只会一直占住这一格。',
    hp: 3,
    hits: 3,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'orthogonalAdjacent',
      hint: '在旁边凑三个以上狸~一次打掉一格血狸！'
    },
    pressureRule: { type: 'none' },
    telegraph: '静止占位',
    echoLabel: '击退后，空出这一格。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在旁边凑三个以上狸~一次打掉一格血狸！'
    },
    introLine: '螳螂挥着镰刀手臂走过来狸！',
    removeLine: '螳螂飞走去别处狸~'
  },
  drowner: {
    id: 'drowner',
    char: 'D',
    name: '水黾',
    emoji: '🪲',
    img: '/img/monsters/water-strider.png',
    uiLabel: '水黾',
    uiWeaknessShort: '在旁边凑三连狸~',
    uiPressureShort: '它不会移动，只会一直占住这一格。',
    hp: 4,
    hits: 4,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'orthogonalAdjacent',
      hint: '在旁边凑三个以上狸~一次打掉一格血狸！'
    },
    pressureRule: { type: 'none' },
    telegraph: '静止占位',
    echoLabel: '击退后，空出这一格。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在旁边凑三个以上狸~一次打掉一格血狸！'
    },
    introLine: '水黾在水面上滑过来狸！',
    removeLine: '水黾滑走狸~'
  },
  ghoul: {
    id: 'ghoul',
    char: 'G',
    name: '蜣螂',
    emoji: '🪲',
    img: '/img/monsters/dung-beetle.png',
    uiLabel: '蜣螂',
    uiWeaknessShort: '在旁边凑三连狸~',
    uiPressureShort: '它不会移动，只会一直占住这一格。',
    hp: 4,
    hits: 4,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'orthogonalAdjacent',
      hint: '在旁边凑三个以上狸~一次打掉一格血狸！'
    },
    pressureRule: { type: 'none' },
    telegraph: '静止占位',
    echoLabel: '击退后，空出这一格。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在旁边凑三个以上狸~一次打掉一格血狸！'
    },
    introLine: '蜣螂推着粪球滚过来狸！',
    removeLine: '蜣螂滚走狸~'
  },
  griffinChick: {
    id: 'griffinChick',
    char: 'C',
    name: '大蓝闪蝶',
    emoji: '🦋',
    img: '/img/monsters/blue-morpho.png',
    uiLabel: '大蓝闪蝶',
    uiWeaknessShort: '在旁边凑三连狸~',
    uiPressureShort: '它不会移动，只会一直占住这一格。',
    hp: 5,
    hits: 5,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'orthogonalAdjacent',
      hint: '在旁边凑三个以上狸~一次打掉一格血狸！'
    },
    pressureRule: { type: 'none' },
    telegraph: '静止占位',
    echoLabel: '击退后，空出这一格。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在旁边凑三个以上狸~一次打掉一格血狸！'
    },
    introLine: '大蓝闪蝶扇着翅膀飞过来狸！',
    removeLine: '大蓝闪蝶飞走狸~'
  },
  wraith: {
    id: 'wraith',
    char: 'W',
    name: '人面樁象',
    emoji: '🪲',
    img: '/img/monsters/face-bug.png',
    uiLabel: '人面樁象',
    uiWeaknessShort: '在旁边凑三连狸~',
    uiPressureShort: '它不会移动，只会一直占住这一格。',
    hp: 5,
    hits: 5,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'orthogonalAdjacent',
      hint: '在旁边凑三个以上狸~一次打掉一格血狸！'
    },
    pressureRule: { type: 'none' },
    telegraph: '静止占位',
    echoLabel: '击退后，空出这一格。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在旁边凑三个以上狸~一次打掉一格血狸！'
    },
    introLine: '人面樁象背上的花纹在盯着你狸…',
    removeLine: '人面樁象逃走狸~'
  },
  djinn: {
    id: 'djinn',
    name: '迪精',
    emoji: '🧞',
    uiLabel: '迪精',
    uiWeaknessShort: '要打到封印外侧狸！',
    uiPressureShort: '再推进一次狸~就会唤起一段愿望。',
    uiStageRules: {
      0: '第一阶段狸：普通三连打到外侧封印狸！',
      1: '第二阶段狸：竖着凑三连打到封印狸！',
      2: '第三阶段狸：连击或四连以上打到命运封印狸~',
      3: '封印已满狸~愿望正在成形狸！'
    },
    uiStagePreview: {
      0: '再推进一次狸~会唤起第一个愿望狸！',
      1: '再推进一次狸~会唤起第二个愿望狸！',
      2: '再推进一次狸~会唤起最后的愿望狸！',
      3: '迪精已经听见了狸~'
    },
    hits: 3,
    damageRule: { type: 'djinnStages' },
    telegraph: '阶段封印',
    echoLabel: '每阶段推进一次愿望叙事。',
    clearRule: {
      type: 'djinnCorners',
      hint: '三段封印狸：先普通三连~再竖着凑~最后连击或四连以上狸！'
    },
    introLine: '迪精狸~杰洛特先生说你已经走了狸……'
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
  sleepHint: '迪精还在睡狸~先把星星客房准备好再唤醒仪式狸！',
  sleepLine: '迪精还在睡狸~头顶轻轻浮着 💤 狸！',
  wakeTitle: '迪精醒来',
  wakeQuote: '豆狸&粒狸: 最后一盏灯亮起来时狸~那团沉睡已久的光也慢慢睁开了眼狸！ ( ……睁开了眼狸！）',
  wakeIntroLines: [
    '豆狸&粒狸: 客房里的风轻轻掀起窗帘狸~紫丁香的香气顺着门缝漫出来狸！ ( ……漫出来狸！）',
    '豆狸&粒狸: 迪精抬起头看向你狸~它终于等到了该说出口的祝福狸！ ( ……祝福狸！）'
  ],
  readyTitle: '迪精',
  readyHint: '资源已经备齐了狸~点击迪精开始最后的仪式狸！',
  readyLine: '星星客房已经准备好了狸~剩下的就是把祝福亲手送进去狸！',
  wakeLine: '星星客房已经准备好了狸~迪精醒了等你开始最后的仪式狸！',
  ceremonyDoneLine: '豆狸&粒狸: 愿望已经说完狸~灯也亮起来了狸！ ( ……亮起来了狸！）',
  stages: {
    1: {
      id: 'health',
      title: '第一愿 · 祛病',
      quote: '豆狸&粒狸: 先把所有不该留下的阴影驱散狸~让身体安稳让病痛退场狸！ ( ……病痛退场狸！）',
      introLines: [
        '豆狸&粒狸: 第一愿落下时狸~迪精周围浮起一圈病气印记狸！ ( ……病气印记狸！）',
        '豆狸&粒狸: 把它们一一清掉狸~愿小云身体健康狸！ ( ……身体健康狸！）'
      ],
      wishText: '愿小云身体健康，所有疾病都远离她。',
      layoutId: 'health',
      objective: {
        type: 'clearMarks',
        total: 8,
        label: '在印记旁边凑三连狸~清掉围住迪精的 8 个病气印记狸'
      },
      resolveLines: [
        '豆狸&粒狸: 病气散了狸~药草色的光沿着封印亮起来了狸！ ( ……亮起来了狸！）',
        '豆狸&粒狸: 第一愿已经被听见了狸！ ( ……被听见了狸！）'
      ]
    },
    2: {
      id: 'joy',
      title: '第二愿 · 欢欣',
      quote: '豆狸&粒狸: 愿日子不只平稳狸~还能发亮能热闹能笑出来狸！ ( ……笑出来狸！）',
      introLines: [
        '豆狸&粒狸: 第一圈封印暖下来了狸~四角点起细小的欢乐火花狸！ ( ……欢乐火花狸！）',
        '豆狸&粒狸: 愿小云生活快乐狸~每天都能乐趣多多狸！ ( ……乐趣多多狸！）'
      ],
      wishText: '愿小云生活快乐，每天都能乐趣多多。',
      layoutId: 'joy',
      objective: {
        type: 'joyBursts',
        total: 1,
        label: '完成一次四连狸~或打出一次连击狸！',
        rulesText: '四连以上狸~或一次连击就能点亮所有蜡烛狸！'
      },
      resolveLines: [
        '豆狸&粒狸: 彩带般的光从四角拢向中央狸~花园里都带了笑意狸！ ( ……带了笑意狸！）',
        '豆狸&粒狸: 第二愿已经被听见了狸！ ( ……被听见了狸！）'
      ]
    },
    3: {
      id: 'cake',
      title: '第三愿 · 生日蛋糕',
      quote: '豆狸&粒狸: 最后这一愿狸~是把以后的日子认真摆在桌上狸！ ( ……摆在桌上狸！）',
      introLines: [
        '豆狸&粒狸: 迪精抬起头狸~光从封印里一层层褪开狸！ ( ……褪开狸！）',
        '豆狸&粒狸: 最后一个愿望杰洛特先生偷偷帮你许了狸~！ ( ……偷偷许了狸！）',
        '豆狸&粒狸: 愿小云平安幸福狸~永远和小坤生活在一起狸！ ( ……在一起狸！）'
      ],
      wishText:
        '最后一个愿望杰洛特先生偷偷帮你许了！愿小云平安幸福，永远和小坤生活在一起。',
      layoutId: 'cake',
      objective: {
        type: 'cakeSequence',
        total: 3,
        label: '按顺序完成生日蛋糕狸~！',
        steps: [
          '先凑一次橙子三连以上狸~做出蛋糕底座狸！',
          '再凑一次花卉三连以上狸~铺出丁香奶油狸！',
          '最后凑一次星星碎片三连以上狸~或一次连击点亮蜡烛狸！'
        ]
      },
      resolveLines: [
        '豆狸&粒狸: 蛋糕终于完整立在桌上了狸~烛光一层层升起来了狸！ ( ……升起来了狸！）',
        '豆狸&粒狸: 第三愿也已经被听见了狸！ ( ……被听见了狸！）'
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
    transitionQuote: '愿病痛如雾气般消散，只留下温暖的烛光。',
    transitionLines: [
      '病气的封印已经被解开了狸~',
      '迪精的力量正在重新凝聚，向棋盘的四个角落蔓延……',
      '豆狸悄悄对你说："第二个愿望，是让她的世界重新亮起来。"'
    ],
    sourceCells: DJINN_MARK_SETS.health.map(cell => ({
      row: cell.row,
      col: cell.col
    })),
    targetCells: DJINN_MARK_SETS.joy.map(cell => ({
      row: cell.row,
      col: cell.col
    })),
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
    transitionQuote: '烛光汇成一束，照亮了桌前那张空了很久的椅子。',
    transitionLines: [
      '四角的烛火正在向棋盘中央流动狸~',
      '迪精将全部的魔力聚在一起，只为完成这最后一个愿望……',
      '粒狸轻声说："三层蛋糕，每一层都是一份心意。动手吧。"'
    ],
    sourceCells: DJINN_MARK_SETS.joy.map(cell => ({
      row: cell.row,
      col: cell.col
    })),
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
          '豆狸&粒狸: 白鸦掠过门柱狸~像在验收今天的活狸！ ( ……验收今天的活狸！）',
          '豆狸&粒狸: 它停了一小会儿狸~像是默认这里能住人了狸！ ( ……能住人了狸！）'
        ],
        anchor: { x: 26, y: 26 }
      }
    ]
  },
  {
    unlockCount: 2,
    buildingId: 'vineyard',
    segmentId: 'vineyard',
    revealLabel: '新修复 · 果园',
    ambientLevel: 2,
    hotspots: [
      {
        id: 'vine-glow',
        label: '藤架',
        unlockCount: 2,
        motion: 'vineShine',
        lines: [
          '豆狸&粒狸: 新扶正的藤架在风里慢慢找回了方向狸！ ( ……找回了方向狸！）',
          '豆狸&粒狸: 橙子还没完全熟透狸~但已经不像被忘掉的样子了狸！ ( ……不像被忘掉了狸！）'
        ],
        anchor: { x: 54, y: 38 }
      }
    ]
  },
  {
    unlockCount: 3,
    buildingId: 'cellar',
    segmentId: 'cellar',
    revealLabel: '新修复 · 储藏室',
    ambientLevel: 3,
    hotspots: [
      {
        id: 'cellar-lamp',
        label: '储藏室灯火',
        unlockCount: 3,
        motion: 'cellarGlow',
        lines: [
          '豆狸&粒狸: 灯火一亮狸~连旧木桶都像重新有了脾气狸！ ( ……有了脾气狸！）',
          '豆狸&粒狸: 酒香还很浅狸~但已经足够让这地方不像废墟了狸！ ( ……不像废墟了狸！）'
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
          '豆狸&粒狸: 它把头探出来狸~像在确认干草够不够厚狸！ ( ……够不够厚狸！）',
          '豆狸&粒狸: 响鼻打得很响狸~意见倒是一句都没少狸！ ( ……都没少狸！）',
          '豆狸&粒狸: 前蹄轻轻踏了两下狸~像是勉强表示认可狸！ ( ……认可狸！）'
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
          '豆狸&粒狸: 花香还很轻狸~却已经先一步把荒凉挤开了狸！ ( ……挤开了狸！）',
          '豆狸&粒狸: 丁香和草药沿着小径回来了狸~像有人快要到访了狸！ ( ……到访狸！）'
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
          '豆狸&粒狸: 暖灯透过新玻璃狸~连潮气都显得有了秩序狸！ ( ……有了秩序狸！）',
          '豆狸&粒狸: 窗面被雾气擦亮了一瞬狸~里面的小芽也醒了狸！ ( ……醒了狸！）'
        ],
        anchor: { x: 52, y: 28 }
      }
    ]
  },
  {
    unlockCount: 7,
    buildingId: 'gazebo',
    segmentId: 'gazebo',
    revealLabel: '新修复 · 广场',
    ambientLevel: 7,
    hotspots: [
      {
        id: 'sunset-seat',
        label: '广场长椅',
        unlockCount: 7,
        motion: 'sunGlint',
        lines: [
          '豆狸&粒狸: 只有一把椅子立在桌旁狸~像是连等待都还没完全说出口狸！ ( ……说出口狸！）',
          '豆狸&粒狸: 夕阳擦过栏杆狸~像是替谁先把位置留了下来狸！ ( ……留了下来狸！）'
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
          '豆狸&粒狸: 炉火一旺起来狸~整间厨房就忽然像有人在等饭狸！ ( ……在等饭狸！）',
          '豆狸&粒狸: 蒸汽往窗上一扑狸~连冷清都被赶去了门外狸！ ( ……赶去了门外狸！）'
        ],
        anchor: { x: 58, y: 36 }
      }
    ]
  },
  {
    unlockCount: 9,
    buildingId: 'lilacSuite',
    segmentId: 'lilacSuite',
    revealLabel: '新修复 · 星星客房',
    ambientLevel: 9,
    hotspots: [
      {
        id: 'suite-curtain',
        label: '窗边',
        unlockCount: 9,
        motion: 'curtainSway',
        lines: [
          '豆狸&粒狸: 窗帘被风轻轻拨动狸~像有人刚刚从花园走过狸！ ( ……从花园走过狸！）',
          '豆狸&粒狸: 花瓶里的紫丁香安静站着狸~房间终于像是准备好了狸！ ( ……准备好了狸！）'
        ],
        anchor: { x: 58, y: 30 }
      }
    ]
  }
]

export const ESTATE_PIG_LINES = {
  early: [
    '豆狸&粒狸: 小猪在还没修好的石路边拱了两下土狸~像先替这里试住狸！ ( ……试住狸！）',
    '豆狸&粒狸: 它沿着门前的小路慢慢晃狸~倒像比人更早把这儿当家狸！ ( ……当家狸！）',
    '豆狸&粒狸: 你一看它狸~它就装作自己只是在散步狸！ ( ……散步狸！）'
  ],
  mid: [
    '豆狸&粒狸: 它已经敢一路晃到花园边了狸~闻闻干草又闻闻新开的丁香狸！ ( ……丁香狸！）',
    '豆狸&粒狸: 小猪拱过小路边的草甩了一下尾巴狸~像在检查今天又多修好了什么狸！ ( ……修好了什么狸！）',
    '豆狸&粒狸: 它对工程没有意见狸~对晚饭倒是一直很有意见狸！ ( ……很有意见狸！）'
  ],
  late: [
    '豆狸&粒狸: 它现在连厨房窗下都敢守着了狸~明显知道哪边会先有香味狸！ ( ……香味狸！）',
    '豆狸&粒狸: 小猪绕着亮灯的屋檐底下转了一圈狸~像在数今晚会不会有人都回来狸！ ( ……回来狸！）',
    '豆狸&粒狸: 它在星星客房前停了一会儿狸~又慢吞吞往花圃那边走了狸！ ( ……走了狸！）'
  ]
}

/* -------- Ending -------- */
export const ENDING = {
  beats: [
    {
      id: 'suite',
      title: '星星客房',
      lines: [
        '豆狸&粒狸: 星星客房收拾好了狸~窗帘在风里轻轻摆动狸！ ( ……轻轻摆动狸！）',
        '豆狸&粒狸: 风从半开的窗里吹进来狸~窗帘轻轻动了一下狸！ ( ……动了一下狸！）'
      ]
    },
    {
      id: 'cake',
      title: '生日夜',
      lines: [
        '豆狸&粒狸: 桌上摆着刚刚完成的生日蛋糕狸~烛光一层层亮起来了狸！ ( ……亮起来了狸！）',
        '豆狸&粒狸: 白鸦停在窗边狸~安静地等这份祝福落定狸！ ( ……祝福落定狸！）'
      ]
    },
    {
      id: 'wishes',
      title: '三条愿望',
      lines: [
        '豆狸&粒狸: 愿小云身体健康狸~所有疾病都远离她狸！ ( ……远离她狸！）',
        '豆狸&粒狸: 愿小云生活快乐狸~每天都能乐趣多多狸！ ( ……乐趣多多狸！）',
        '豆狸&粒狸: 愿小云平安幸福狸~永远和小坤生活在一起狸！ ( ……在一起狸！）'
      ]
    },
    {
      id: 'blessing',
      title: '留灯',
      lines: [
        '豆狸&粒狸: Corvo Bianco 的灯终于都亮起来了狸~！ ( ……亮起来了狸！）',
        '豆狸&粒狸: 今夜的祝福会留在这里狸~陪他们把以后的日子慢慢过完狸！ ( ……慢慢过完狸！）'
      ]
    }
  ],
  candleLines: [
    '豆狸&粒狸: 第一支蜡烛亮起了狸~为健康狸！ ( ……为健康狸！）',
    '豆狸&粒狸: 第二支蜡烛亮起了狸~为快乐狸！ ( ……为快乐狸！）',
    '豆狸&粒狸: 第三支蜡烛亮起了狸~为平安与相守狸！ ( ……为平安与相守狸！）'
  ],
  defaultGift: '献给小云。',
  lockedGift: '献给小云。',
  blessingLine: '豆狸&粒狸: 也愿小坤和小云平安幸福狸~长久相伴狸！ ( ……长久相伴狸！）',
  willScreen: {
    headerLine: '完成了~！',
    titleLine: '白鸦果园修复记狸！',
    clearedLine: '你帮杰洛特先生修好了庄园狸~！',
    gotGiftLine: '在 {{location}}，获得了报酬收据狸——',
    giftPlaceholder: '🧾',
    giftHint: '粒狸送来的报酬收据狸！',
    // Card 3: Pig companion
    pigCompanionLine1: '豆狸和粒狸也一直陪着你狸！',
    pigCompanionLine2: '大家一起努力的结果狸~！',
    pigCompanionLine3: '小猪也帮了大忙狸！',
    // Card 4: Treasures
    itemsLabel: '收集的道具狸！',
    itemsArrow: '一路收集的好东西',
    estateLine: '白鸦果园，全部修复完成狸',
    farewellLine: '谢谢你的帮忙狸~！',
    goodbyeLine: '欢迎再来狸~！',
  },
  interceptLine: '豆狸&粒狸: 等一下狸~你填的这个名字不太对狸！让豆狸帮你改改狸！ ( ……帮你改改狸！）',
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
    description: '第 1 天完成前院修复，且未使用白狼整地。',
    icon: '🌿',
    rarity: 'common',
    hidden: false,
    flavor: '石路露出来了狸~这里终于能住人了狸！',
    trigger: { type: 'dayComplete', day: 1 }
  },
  {
    id: 'day2_vines_remember',
    title: '果树记得回家',
    description: '第 2 天完成果园修复，且当天凑出过四连以上狸！',
    icon: '🍊',
    rarity: 'common',
    hidden: false,
    flavor: '果树没有忘记该往哪里长狸~',
    trigger: { type: 'dayComplete', day: 2 }
  },
  {
    id: 'day3_one_bottle_saved',
    title: '留一瓶',
    description: '第 3 天完成储藏室修复，且当天击退过水黾。',
    icon: '🛢️',
    rarity: 'common',
    hidden: false,
    flavor: '最深处狸~总该留一瓶给以后狸！',
    trigger: { type: 'dayComplete', day: 3 }
  },
  {
    id: 'day4_roach_approves',
    title: '萝卜点头了',
    description: '第 4 天完成牧场修复，且至少使用过一次萝卜识途。',
    icon: '🐎',
    rarity: 'common',
    hidden: false,
    flavor: '它不夸人狸~但今天算是默认了狸！',
    trigger: { type: 'dayComplete', day: 4 }
  },
  {
    id: 'day5_lilac_in_the_wind',
    title: '风里有丁香',
    description: '第 5 天完成花圃修复，且完成时剩余步数至少为 6。',
    icon: '🪻',
    rarity: 'rare',
    hidden: false,
    flavor: '香气先回来了狸~花会慢一点狸~',
    trigger: { type: 'dayComplete', day: 5 }
  },
  {
    id: 'day6_keep_the_lamp_warm',
    title: '灯别熄',
    description:
      '第 6 天完成温室修复，且当天打出过一次连击或四连以上狸！',
    icon: '🌱',
    rarity: 'rare',
    hidden: false,
    flavor: '灯亮着狸~脆弱的东西就愿意活下去狸！',
    trigger: { type: 'dayComplete', day: 6 }
  },
  {
    id: 'day7_a_chair_for_waiting',
    title: '先放一把椅子',
    description: '第 7 天完成广场修复，且至少使用过一次庄园日落。',
    icon: '🌅',
    rarity: 'rare',
    hidden: false,
    flavor: '有些等待狸~先摆一把椅子就够了狸！',
    trigger: { type: 'dayComplete', day: 7 }
  },
  {
    id: 'day8_the_soup_will_hold',
    title: '汤会热着',
    description: '第 8 天完成厨房修复，且当天从未进入步数耗尽的夜幕。',
    icon: '🍲',
    rarity: 'rare',
    hidden: false,
    flavor: '汤还没好狸~家已经有味道了狸！',
    trigger: { type: 'dayComplete', day: 8 }
  },
  {
    id: 'day9_room_for_her',
    title: '为她留灯',
    description: '第 9 天完成星星客房，并完整走到最终结局展示。',
    icon: '🛏️',
    rarity: 'epic',
    hidden: true,
    flavor: '窗边留了花狸~床边留了光狸~也留了她的位置狸！',
    trigger: { type: 'ending' }
  },
  {
    id: 'sunlit_margin',
    title: '天光尚早',
    description: '任意一天完成修复时，剩余步数达到 10 或以上。',
    icon: '☀️',
    rarity: 'common',
    hidden: false,
    flavor: '太阳还在狸~修好的地方已经先亮起来了狸！',
    trigger: { type: 'dayComplete' }
  },
  {
    id: 'clutch_finish',
    title: '差一点也够',
    description: '任意一天完成修复时，剩余步数不超过 5。',
    icon: '⏳',
    rarity: 'rare',
    hidden: false,
    flavor: '差一点也够狸~够把今天做完狸！',
    trigger: { type: 'dayComplete' }
  },
  {
    id: 'cascade_poetry',
    title: '连击像诗',
    description: '单次出手打出三连击以上狸！',
    icon: '✨',
    rarity: 'epic',
    hidden: false,
    flavor: '一连串清响之后狸~整个庄园像跟着醒了一瞬狸！',
    trigger: { type: 'combo' }
  },
  {
    id: 'grand_harvest',
    title: '丰收时刻',
    description: '凑出一次五连以上狸！',
    icon: '🍷',
    rarity: 'epic',
    hidden: false,
    flavor: '酒还没酿好狸~丰收的样子已经先来了狸！',
    trigger: { type: 'matchGroup' }
  },
  {
    id: 'love_from_xiaokun',
    title: '爱你的小坤',
    description: '完整通关并走到最终结局之后解锁。',
    icon: '💛',
    rarity: 'gold',
    hidden: true,
    flavor: '这片果园的尽头狸~是一封终于送达的心意狸！',
    trigger: { type: 'ending' }
  }
]
