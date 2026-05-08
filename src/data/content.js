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
  }
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
    needs: { wood: 35, herb: 25, magic: 25 },
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
  nekkers: {
    id: 'nekkers',
    char: 'N',
    name: '孽鬼',
    emoji: '👺',
    uiLabel: '孽鬼',
    uiWeaknessShort: '弱点：上下左右贴身三消。',
    uiPressureShort: '若没受伤，回合末会向最近边缘跳 1 格。',
    hp: 1,
    hits: 1,
    reward: {},
    clearReward: {},
    damageRule: {
      type: 'orthogonalAdjacent',
      hint: '在它上下左右打出一次 3 连及以上匹配，就会把它驱走。'
    },
    pressureRule: { type: 'edgeJump' },
    telegraph: '正交贴身',
    echoLabel: '移走一个乱跑的干扰点。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在它上下左右打出一次 3 连及以上匹配，就会把它驱走。'
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
    uiWeaknessShort: '弱点：正上或正下的纵向匹配。',
    uiPressureShort: '若没受伤，回合末会下沉 1 格。',
    hp: 2,
    hits: 2,
    reward: { grape: 2 },
    clearReward: { grape: 2 },
    damageRule: {
      type: 'verticalAdjacent',
      hint: '只有纵向匹配命中它的正上方或正下方，才会掉 1 点生命。'
    },
    pressureRule: { type: 'sink' },
    telegraph: '纵向箭头',
    echoLabel: '击退后该列正常坍塌，并额外给 +2 葡萄。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '只有纵向匹配命中它的正上方或正下方，才会掉 1 点生命。'
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
    uiWeaknessShort: '弱点：脚下清空，或本行横向擦到它。',
    uiPressureShort: '若没受伤，回合末会在脚下留下腐土。',
    hp: 2,
    hits: 2,
    reward: { herb: 2 },
    clearReward: { herb: 2 },
    damageRule: {
      type: 'underfootOrRowHorizontal',
      hint: '清到它脚下那格，或在同一行做横向匹配擦到它，才会掉 1 点生命。'
    },
    pressureRule: { type: 'rotUnderfoot' },
    telegraph: '脚下腐土',
    echoLabel: '击退后清掉它生成的腐土，并给 +2 草药。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '清到它脚下那格，或在同一行做横向匹配擦到它，才会掉 1 点生命。'
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
    uiWeaknessShort: '弱点：本行 4 连及以上的横向匹配。',
    uiPressureShort: '若没受伤，回合末向上飞 1 格。',
    hp: 2,
    hits: 2,
    reward: { magic: 2 },
    clearReward: { magic: 2 },
    damageRule: {
      type: 'rowBigHorizontal',
      hint: '在它所在那一行，打出 4 连及以上的横向匹配，才会掉 1 点生命。'
    },
    pressureRule: { type: 'flyUp' },
    telegraph: '振翅',
    echoLabel: '击退后，下方一格的资源额外 +1 魔力。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '在它所在那一行，打出 4 连及以上的横向匹配，才会掉 1 点生命。'
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
    uiWeaknessShort: '弱点：连锁 ≥2，或附近 4 连及以上。',
    uiPressureShort: '若没受有效伤害，回合末恢复 1 层护纱。',
    hp: 2,
    hits: 2,
    reward: { magic: 2 },
    clearReward: { magic: 2 },
    damageRule: {
      type: 'qualityAdjacent',
      hint: '只有连锁层数 ≥2，或 4 连及以上命中它附近，才算有效伤害。'
    },
    pressureRule: { type: 'restoreShield' },
    telegraph: '护纱',
    echoLabel: '击退后，其他怪物下一回合不触发骚扰，并给 +2 魔力。',
    clearRule: {
      type: 'adjacentMatch',
      hint: '只有连锁层数 ≥2，或 4 连及以上命中它附近，才算有效伤害。'
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
  0: [{ id: 'd1-nekkers-a', kind: 'nekkers', row: 2, col: 5 }],
  1: [
    { id: 'd2-nekkers-a', kind: 'nekkers', row: 1, col: 2 },
    { id: 'd2-nekkers-b', kind: 'nekkers', row: 4, col: 5 }
  ],
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
    { id: 'd6-ghoul-a', kind: 'ghoul', row: 2, col: 2 },
    { id: 'd6-drowner-a', kind: 'drowner', row: 5, col: 5 }
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

export const DJINN_WISHES = {
  introHint: '迪精在棋盘上。消除它外围一圈的格子，命中三次之后它会现身。',
  releaseLine: '愿望这种东西……最后一个，不用说出来。命运已经听见了。',
  stages: {
    1: {
      title: '第一个愿望',
      quote:
        '那时他只是想把麻烦赶走。后来才明白，愿望一旦出口，总会留下些什么。',
      lines: [
        '第一次见到迪精，是在一条河边。',
        '丹德里恩把瓶子打碎，红雾就冲了出来。',
        '我念了句自己也不懂的古语，以为那只是一句驱魔咒。',
        '后来才知道，那句话真正的意思只是——',
        '滚开。去自己玩自己。'
      ],
      choices: [
        {
          id: 'banish',
          label: '让庄园里的麻烦都散去吧。',
          effectLabel: '庄园里的怪物会被愿望驱散。'
        }
      ],
      resolveLine: '那时候不懂。现在懂了。'
    },
    2: {
      title: '第二个愿望',
      quote:
        '脱口而出的话，迪精也会当真。真正可怕的不是力量，而是你究竟想留下什么。',
      lines: [
        '第二个愿望，是我在牢里说的。',
        '那个守卫每天打我。我靠在墙角，看着他走过来。',
        '我说：但愿你会炸开。',
        '然后他真的炸了。'
      ],
      choices: [
        {
          id: 'ease-estate',
          label: '愿庄园不再荒芜。',
          effectLabel: '当前建筑需求降低 30%，棋盘重新洗牌。'
        },
        {
          id: 'rich-vintage',
          label: '愿酒窖的酒永远醇香。',
          effectLabel: '立即 +5 步，之后每次消除的每种资源额外 +1。'
        },
        {
          id: 'roach-healthy',
          label: '愿萝卜永远健康。',
          effectLabel: '本日“萝卜识途”可用次数提升至 4 次。'
        }
      ],
      resolveLine: '脱口而出的话，迪精也会当真。'
    },
    3: {
      title: '第三个愿望',
      quote:
        '有些愿望不是召唤谁来到身边，而是承认自己愿意把往后的路，和她系在同一条命运上。',
      lines: [
        '第三个愿望。',
        '上一次，我不肯承认自己说了什么。',
        '我不想用魔法把她困在我身边。',
        '我不想她的感情，来自一个咒语。',
        '可我也知道，真正留下我们的，从来不是咒语。',
        '是我终于愿意承认，往后的命运，我想和她系在一起。'
      ],
      choices: [
        {
          id: 'bind-fate',
          label: '让她来。',
          effectLabel: '迪精解放，紫丁香客房立即完成。'
        }
      ],
      resolveLine: '命运已经听见了。'
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

/* -------- Ending -------- */
export const ENDING = {
  lines: [
    { who: '叶奈法', text: '……不算糟。' },
    { who: '杰洛特', text: '藤还没爬满。' },
    { who: '叶奈法', text: '我有很多时间。' },
    { who: null, text: '风吹过葡萄藤。' },
    { who: '杰洛特', text: '……嗯。' }
  ],
  defaultGift: '献给小芸。',
  lockedGift: '献给小芸。',
  blessingLine: '也祝小坤和小芸的命运永远相连。',
  interceptLine: '哦，我想起来了。你不是小芸吗？还在选什么，我帮你填下去就行。',
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
