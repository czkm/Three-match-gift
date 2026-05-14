import { COMMON_COPY, formatAcquiredText } from './common';

export const HUD_COPY = {
  trinketTitle: '道具栏',
  repairProgressTitle: '修复进度',
  messageEyebrows: {
    rewardItem: '道具情报',
    monster: '棋盘情报',
    narration: '今日场景',
    geralt: '杰洛特',
    system: '系统提示',
    hint: '旅途提示'
  },
  messageTitles: {
    bark: '临场自语',
    targeting: '当前指令',
    hint: '今日建议',
    djinnFallback: '迪精',
    djinnTransitionFallback: '封印重组'
  },
  dayEnd: {
    continueHint: COMMON_COPY.continueAnywhereHint,
    formatRestHint(maxSteps) {
      return `明天再继续。步数会恢复到 ${maxSteps}，今天的进度会保留。`;
    }
  }
};

export const AUDIO_COPY = {
  bgm: '配乐',
  sfx: '音效'
};

export const ABILITY_BAR_COPY = {
  title: '能力',
  pigEnergyTitle: '小猪能量',
  formatPigEnergy(level, max) {
    return `星级 ${level} / ${max}`;
  },
  lilacPrompt: '将哪种资源变成哪种？',
  from: '从',
  to: '到',
  lilacApply: '变身',
  milkTeaPrompt: '奶茶攻击要收哪种资源？',
  milkTeaApply: '开喝',
  passiveTitle: '被动'
};

export const REWARD_ROOM_COPY = {
  intro: '门开了。',
  treasure: {
    sign: '宝箱房',
    label: '稳妥',
    flavor: '温暖的金色光芒充满整个房间。'
  },
  devil: {
    sign: '恶魔房',
    label: '危险',
    flavor: '黑暗中有红色的光。'
  },
  devilWarning: '恶魔房会带来真实代价：降低明日步数，或永久压低步数上限',
  formatAcquiredText
};
