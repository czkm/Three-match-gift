export const TARGETING_COPY = {
  short: {
    grape: '点选一个 🍇 葡萄方块',
    rowOrCol: '点击一整行或一整列消除',
    twoTiles: '依次选择任意两个方块交换',
    twoResources: '已切换到资源转换模式，在右侧面板选择'
  },
  long: {
    grape: '点一个 🍇 葡萄方块，丰收会把周围 3×3 都变成葡萄。',
    rowOrCol: '点击一整行或一整列，直接清扫过去。',
    twoTiles: '依次点两个方块，萝卜会帮你完成任意交换。',
    twoResources: '在右侧能力栏里选两种资源，进行全局转换。'
  }
};

export const GAMEPLAY_COPY = {
  hints: {
    initial: '豆狸&粒狸: 点击棋盘开始整理狸~优先凑出顺手的三消让资源稳稳涨起来狸！ ( ……涨起来狸！）',
    awakening: '豆狸&粒狸: 棋盘上的雷光正在汇向中央狸~等迪精醒来最后的仪式就会开始狸！ ( ……开始狸！）',
    djinnTransitionFallback: '豆狸&粒狸: 封印正在重组狸~下一愿即将显现狸！ ( ……显现狸！）',
    pigEnergyReady: '豆狸&粒狸: 小猪已经攒满了 5 星好评狸~去右侧能力栏发动一次奶茶攻击狸！ ( ……奶茶攻击狸！）'
  },
  djinn: {
    readyHealthLabel: '仪式已经就绪了狸',
    readyEcho: '豆狸&粒狸: 点击迪精狸~开始最后的三愿仪式狸！ ( ……三愿仪式狸！）',
    sleepingHealthLabel: '睡眠中 💤',
    sleepingEcho: '豆狸&粒狸: 先把房间准备好狸~再把她叫醒狸！ ( ……叫醒狸！）',
    roomPrepHealthLabel: '先把第九天的房间准备好狸。',
    roomPrepWeakness: '当资源达标后狸~迪精会回应最后的仪式狸！',
    cakePressure: '按照顺序完成蛋糕底座狸~奶油和蜡烛狸！',
    actionLabels: {
      enterBoard: '进入仪式棋盘',
      nextWish: '继续下一愿',
      towardBirthday: '迎向生日夜'
    },
    actionHints: {
      enterBoard: '点击进入仪式棋盘',
      continue: '点击继续'
    },
    stageCompleteBarks: {
      1: '豆狸&粒狸: 病气退开了狸！ ( ……退开了狸！）',
      2: '豆狸&粒狸: 灯火已经亮起来了狸！ ( ……亮起来了狸！）',
      3: '豆狸&粒狸: 蛋糕做好了狸！ ( ……做好了狸！）'
    },
    formatMarkProgress(progress, total) {
      return `病气印记 ${progress} / ${total}`;
    },
    formatJoyProgress(progress, total) {
      return `欢欣火花 ${progress} / ${total}`;
    },
    formatCakeProgress(progress, total) {
      return `蛋糕进度 ${progress} / ${total}`;
    }
  },
  monster: {
    unavailable: '暂不可匹配',
    occupiedPressure: '若放着不管，会继续占住做局空间。',
    formatRemaining(remaining, total) {
      return `剩余 ${remaining} / ${total}`;
    }
  },
  rewardItem: {
    noPenalty: '拿了就走，没有额外代价。',
    formatHealthLabel(item) {
      return `Quality ${item.quality} · ${item.roomType === 'devil' ? '恶魔道具' : '宝箱道具'}`;
    },
    formatPersistentEffect(name) {
      return `${name} 会在之后的每一天持续生效。`;
    }
  },
  pig: {
    angryBark: '豆狸&粒狸: 小猪不高兴了狸~它拿走了你 1 步狸！ ( ……1 步狸！）'
  }
};
