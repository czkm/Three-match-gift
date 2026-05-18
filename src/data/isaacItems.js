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
  stye: sprite(0, -1152)
};

/**
 * 适配后的道具池：7 件宝箱房 + 7 件恶魔房。
 * 每件道具对应 REWARD_ITEMS 中的一个条目（rewardItemIds 长度恒为 1）。
 * 机制：在 match-3 + 步数管理语境下重新设计，summary 描述的是本作的实际效果。
 */
export const ISAAC_ITEMS = {
  /* ───── 宝箱房 ───── */
  stye: {
    key: 'stye',
    collectibleId: 731,
    cnName: '麦粒肿',
    enName: 'Stye',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C731',
    summary: '每日首次 4 连：match 中心 + 1 个随机相邻格炸开。',
    sprite: ISAAC_ITEM_SPRITES.stye,
    rewardItemIds: ['stye']
  },
  luckyFoot: {
    key: 'luckyFoot',
    collectibleId: 46,
    cnName: '幸运脚',
    enName: 'Lucky Foot',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C46',
    summary: '每日首次 2 段连锁：3 个随机格翻成需求资源。',
    sprite: null,
    rewardItemIds: ['luckyFoot']
  },
  lunch: {
    key: 'lunch',
    collectibleId: 22,
    cnName: '午餐',
    enName: 'Lunch',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C22',
    summary: '次日开始时 +2 步。',
    sprite: null,
    rewardItemIds: ['lunch']
  },
  sackOfPennies: {
    key: 'sackOfPennies',
    collectibleId: 94,
    cnName: '硬币袋',
    enName: 'Sack of Pennies',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C94',
    summary: '每日首次结算时，随机一项目标资源 +4。',
    sprite: null,
    rewardItemIds: ['sackOfPennies']
  },
  battery: {
    key: 'battery',
    collectibleId: 63,
    cnName: '小电池',
    enName: 'The Battery',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C63',
    summary: '每日首次 5 连，立即恢复 2 步。',
    sprite: null,
    rewardItemIds: ['battery']
  },
  holyWater: {
    key: 'holyWater',
    collectibleId: 178,
    cnName: '圣水',
    enName: 'Holy Water',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C178',
    summary: '每日首次无效交换：返还 1 步 + 周围 2 格翻成需求资源。',
    sprite: null,
    rewardItemIds: ['holyWater']
  },
  compass: {
    key: 'compass',
    collectibleId: 21,
    cnName: '指南针',
    enName: 'The Compass',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C21',
    summary: '每日首次 4 连，恢复 1 点小猪能量。',
    sprite: null,
    rewardItemIds: ['compass']
  },

  /* ───── 恶魔房 ───── */
  brimstone: {
    key: 'brimstone',
    collectibleId: 118,
    cnName: '硫磺火',
    enName: 'Brimstone',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C118',
    summary: '每日首次 3 连：match 所在列被硫磺火扫穿清空。',
    sprite: null,
    rewardItemIds: ['brimstone']
  },
  momsKnife: {
    key: 'momsKnife',
    collectibleId: 114,
    cnName: '妈妈的刀',
    enName: "Mom's Knife",
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C114',
    summary: '每日首次无效交换：所在列被刀刃划穿清空。',
    sprite: null,
    rewardItemIds: ['momsKnife']
  },
  thePact: {
    key: 'thePact',
    collectibleId: 80,
    cnName: '契约',
    enName: 'The Pact',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C80',
    summary: '每日首次 4 连：棋盘上最少的资源格翻成最多的那种。',
    sprite: null,
    rewardItemIds: ['thePact']
  },
  deadCat: {
    key: 'deadCat',
    collectibleId: 81,
    cnName: '死猫',
    enName: 'Dead Cat',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C81',
    summary: '步数归零时自动恢复 4 步。',
    sprite: null,
    rewardItemIds: ['deadCat']
  },
  pentagram: {
    key: 'pentagram',
    collectibleId: 51,
    cnName: '五芒星',
    enName: 'Pentagram',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C51',
    summary: '每日首次 5 连：5 个随机格被打上五芒星烙印后炸开。',
    sprite: null,
    rewardItemIds: ['pentagram']
  },
  mawOfTheVoid: {
    key: 'mawOfTheVoid',
    collectibleId: 399,
    cnName: '虚空之喉',
    enName: 'Maw of the Void',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C399',
    summary: '每日首次 3 段连锁：以 match 中心为中心的 3×3 区域被吞没。',
    sprite: null,
    rewardItemIds: ['mawOfTheVoid']
  },
  blackCandle: {
    key: 'blackCandle',
    collectibleId: 260,
    cnName: '黑蜡烛',
    enName: 'Black Candle',
    wikiUrl: 'https://isaac.huijiwiki.com/wiki/C260',
    summary: '每日开始时清零「明日步数惩罚」。',
    sprite: null,
    rewardItemIds: ['blackCandle']
  }
};

export const ISAAC_ITEMS_IN_PROJECT = Object.values(ISAAC_ITEMS);

export const ISAAC_ITEM_BY_REWARD_ID = Object.fromEntries(
  ISAAC_ITEMS_IN_PROJECT.flatMap((item) =>
    item.rewardItemIds.map((rewardItemId) => [rewardItemId, item])
  )
);
