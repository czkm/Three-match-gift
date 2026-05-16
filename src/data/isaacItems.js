export const ISAAC_SPRITE_SHEET = {
  url: '/Collectibles_sprite.png',
  width: 640,
  height: 1280,
  tileSize: 32
};

const sprite = (x, y) => ({
  x,
  y,
  backgroundPosition: `${x}px ${y}px`
});

export const ISAAC_ITEM_SPRITES = {
  stye: sprite(0, -1152),
  momsKey: sprite(-544, -288)
};

export const ISAAC_ITEMS = {
  stye: {
    key: 'stye',
    collectibleId: 731,
    cnName: '麦粒肿',
    enName: 'Stye',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C731',
    summary: '强化右眼泪弹，提升伤害和射程，并略微降低弹速。',
    sprite: ISAAC_ITEM_SPRITES.stye,
    rewardItemIds: ['styeTreasure', 'styeDevil']
  },
  luckyFoot: {
    key: 'luckyFoot',
    collectibleId: 46,
    cnName: '幸运脚',
    enName: 'Lucky Foot',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C46',
    summary: '提供幸运加成，并改善部分随机事件收益。',
    sprite: null,
    rewardItemIds: ['luckyFoot']
  },
  lunch: {
    key: 'lunch',
    collectibleId: 22,
    cnName: '午餐',
    enName: 'Lunch',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C22',
    summary: '增加 1 个红心容器。',
    sprite: null,
    rewardItemIds: ['lunch']
  },
  sackOfPennies: {
    key: 'sackOfPennies',
    collectibleId: 94,
    cnName: '硬币袋',
    enName: 'Sack of Pennies',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C94',
    summary: '会周期性掉落硬币的跟随物。',
    sprite: null,
    rewardItemIds: ['sackOfPennies']
  },
  battery: {
    key: 'battery',
    collectibleId: 63,
    cnName: '小电池',
    enName: 'The Battery',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C63',
    summary: '允许主动道具额外储存 1 次充能。',
    sprite: null,
    rewardItemIds: ['battery']
  },
  holyWater: {
    key: 'holyWater',
    collectibleId: 178,
    cnName: '圣水',
    enName: 'Holy Water',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C178',
    summary: '命中后会留下圣水水潭的跟随物。',
    sprite: null,
    rewardItemIds: ['holyWater']
  },
  compass: {
    key: 'compass',
    collectibleId: 21,
    cnName: '指南针',
    enName: 'The Compass',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C21',
    summary: '揭示楼层内全部特殊房间位置。',
    sprite: null,
    rewardItemIds: ['compass']
  },
  momsKey: {
    key: 'momsKey',
    collectibleId: 199,
    cnName: '妈妈的钥匙',
    enName: "Mom's Key",
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C199',
    summary: '获得 2 把钥匙，并提升箱子掉落。',
    sprite: ISAAC_ITEM_SPRITES.momsKey,
    rewardItemIds: ['momsKey']
  },
  brimstone: {
    key: 'brimstone',
    collectibleId: 118,
    cnName: '硫磺火',
    enName: 'Brimstone',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C118',
    summary: '把泪弹替换为可蓄力的穿透血激光。',
    sprite: null,
    rewardItemIds: ['brimstone']
  },
  momsKnife: {
    key: 'momsKnife',
    collectibleId: 114,
    cnName: '妈妈的刀',
    enName: "Mom's Knife",
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C114',
    summary: '把泪弹替换为可蓄力投掷的刀刃。',
    sprite: null,
    rewardItemIds: ['momsKnife']
  },
  thePact: {
    key: 'thePact',
    collectibleId: 80,
    cnName: '契约',
    enName: 'The Pact',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C80',
    summary: '提供黑心、伤害和射速加成。',
    sprite: null,
    rewardItemIds: ['thePact']
  },
  deadCat: {
    key: 'deadCat',
    collectibleId: 81,
    cnName: '死猫',
    enName: 'Dead Cat',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C81',
    summary: '提供 9 条命，并把红心容器压到 1 格。',
    sprite: null,
    rewardItemIds: ['deadCat']
  },
  pentagram: {
    key: 'pentagram',
    collectibleId: 51,
    cnName: '五芒星',
    enName: 'Pentagram',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C51',
    summary: '提供伤害加成，并提高恶魔房概率。',
    sprite: null,
    rewardItemIds: ['pentagram']
  },
  guppysPaw: {
    key: 'guppysPaw',
    collectibleId: 133,
    cnName: '嗝屁猫的爪子',
    enName: "Guppy's Paw",
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C133',
    summary: '把红心容器转换为魂心的主动道具。',
    sprite: null,
    rewardItemIds: ['guppysPaw']
  },
  blackCandle: {
    key: 'blackCandle',
    collectibleId: 260,
    cnName: '黑蜡烛',
    enName: 'Black Candle',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C260',
    summary: '免疫楼层诅咒，并提供黑心。',
    sprite: null,
    rewardItemIds: ['blackCandle']
  },
  whoreOfBabylon: {
    key: 'whoreOfBabylon',
    collectibleId: 122,
    cnName: '巴比伦大淫妇',
    enName: 'Whore of Babylon',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C122',
    summary: '低血量时提供伤害和速度加成。',
    sprite: null,
    rewardItemIds: ['whoreOfBabylon']
  },
  abaddon: {
    key: 'abaddon',
    collectibleId: 230,
    cnName: '亚巴顿',
    enName: 'Abaddon',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C230',
    summary: '提升伤害并把红心容器转成黑心。',
    sprite: null,
    rewardItemIds: ['abaddon']
  },
  mawOfTheVoid: {
    key: 'mawOfTheVoid',
    collectibleId: 399,
    cnName: '虚空之喉',
    enName: 'Maw of the Void',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C399',
    summary: '持续射击后可释放黑色硫磺火环。',
    sprite: null,
    rewardItemIds: ['mawOfTheVoid']
  },
  eyeOfBelial: {
    key: 'eyeOfBelial',
    collectibleId: 462,
    cnName: '恶魔之眼',
    enName: 'Eye of Belial',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C462',
    summary: '提供穿透泪弹，并强化穿透后的子弹。',
    sprite: null,
    rewardItemIds: ['eyeOfBelial']
  },
  theMark: {
    key: 'theMark',
    collectibleId: 79,
    cnName: '印记',
    enName: 'The Mark',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C79',
    summary: '提供黑心、伤害和速度加成。',
    sprite: null,
    rewardItemIds: ['theMark']
  },
  sacrificialDagger: {
    key: 'sacrificialDagger',
    collectibleId: 172,
    cnName: '献祭匕首',
    enName: 'Sacrificial Dagger',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C172',
    summary: '获得一个高伤害的环绕匕首轨道物。',
    sprite: null,
    rewardItemIds: ['sacrificialDagger']
  },
  littleBrimstone: {
    key: 'littleBrimstone',
    collectibleId: 275,
    cnName: '小硫磺火',
    enName: 'Little Brimstone',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C275',
    summary: '会随射击蓄力并发射细版硫磺火的跟随物。',
    sprite: null,
    rewardItemIds: ['littleBrimstone']
  }
};

export const ISAAC_ITEMS_IN_PROJECT = Object.values(ISAAC_ITEMS);

export const ISAAC_ITEM_BY_REWARD_ID = Object.fromEntries(
  ISAAC_ITEMS_IN_PROJECT.flatMap((item) =>
    item.rewardItemIds.map((rewardItemId) => [rewardItemId, item])
  )
);
