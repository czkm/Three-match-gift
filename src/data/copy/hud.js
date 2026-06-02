import { COMMON_COPY, formatAcquiredText } from './common'

export const HUD_COPY = {
  trinketTitle: '收藏袋',
  repairProgressTitle: '施工进度',
  messageEyebrows: {
    rewardItem: '物品介绍',
    monster: '地形观察',
    narration: '今日风景',
    geralt: '豆狸&粒狸',
    system: '系统提示',
    hint: '旅途提示'
  },
  messageTitles: {
    bark: '豆狸&粒狸',
    targeting: '当前指令',
    hint: '今日建议',
    djinnFallback: '迪精',
    djinnTransitionFallback: '封印重组'
  },
  dayEnd: {
    continueHint: COMMON_COPY.continueAnywhereHint,
    formatRestHint(maxSteps) {
      return `明天再继续狸~步数会恢复到 ${maxSteps}，今天的进度会好好留着狸！`
    }
  }
}

export const AUDIO_COPY = {
  bgm: '配乐',
  sfx: '音效',
  ambient: '环境'
}

export const ABILITY_BAR_COPY = {
  title: '随身工具',
  pigEnergyTitle: '小猪星星',
  formatPigEnergy(level, max) {
    return `星级 ${level} / ${max}`
  },
  lilacPrompt: '想把什么变成什么狸？',
  from: '从',
  to: '到',
  lilacApply: '变！',
  milkTeaPrompt: '果汁要加哪种配料狸？',
  milkTeaApply: '干杯狸！',
  passiveTitle: '拿手好戏'
}

export const REWARD_ROOM_COPY = {
  intro: '门开了。',
  treasure: {
    sign: '宝箱房',
    label: '稳一手👍',
    flavor: '温暖的金色光芒充满整个房间。'
  },
  devil: {
    sign: '恶魔房',
    label: '贪一手✌️',
    flavor: '黑暗中有红色的光。'
  },
  devilWarning: '恶魔房需要付出代价：降低明日步数，或永久压低步数上限',
  formatAcquiredText
}
