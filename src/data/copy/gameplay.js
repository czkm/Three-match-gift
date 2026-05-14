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
    initial: '点击棋盘开始整理。优先凑出顺手的三消，让资源稳稳涨起来。',
    awakening: '棋盘上的雷光正在汇向中央。等迪精醒来，最后的仪式就会开始。',
    djinnTransitionFallback: '封印正在重组，下一愿即将显现。',
    pigEnergyReady: '小猪已经攒满了 5 星好评。去右侧能力栏发动一次“奶茶攻击”，把棋盘上的某种资源全部收获。'
  },
  djinn: {
    readyHealthLabel: '仪式已经就绪',
    readyEcho: '点击迪精，开始最后的三愿仪式。',
    sleepingHealthLabel: '睡眠中 💤',
    sleepingEcho: '先把房间准备好，再把她叫醒。',
    roomPrepHealthLabel: '先把第九天的房间准备好。',
    roomPrepWeakness: '当资源达标后，迪精会回应最后的仪式。',
    cakePressure: '按照顺序完成蛋糕底座、奶油和蜡烛。',
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
      1: '病气退开了。',
      2: '灯火已经亮起来了。',
      3: '蛋糕做好了。'
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
    angryBark: '小猪不高兴了。它拿走了你 1 步。'
  }
};
