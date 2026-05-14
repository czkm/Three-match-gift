<template>
  <div class="resource-bar glass grain">
    <h3 class="ink-title">修复进度</h3>
    <div v-for="r in game.repairView" :key="r.id" class="row">
      <span class="emoji">{{ r.emoji }}</span>
      <span class="label">{{ r.label }}</span>
      <div class="track">
        <div
          class="fill"
          :class="r.id"
          :style="{ width: Math.min(100, r.pct * 100) + '%' }"
        />
      </div>
      <span class="count">{{ r.have }} / {{ r.need }}</span>
    </div>

    <div
      v-if="messageTitle || messageText"
      :key="messageKey"
      class="message-box"
      :class="[`kind-${messageKind}`, { fresh: messageFresh }]"
    >
      <div class="message-head">
        <span class="message-icon">{{ messageIcon }}</span>
        <div class="message-meta">
          <p v-if="messageEyebrow" class="message-eyebrow">{{ messageEyebrow }}</p>
          <p v-if="messageTitle" class="message-title ink-title">{{ messageTitle }}</p>
        </div>
      </div>
      <p class="message-text" :class="{ quoted: messageKind === 'geralt' }">{{ messageText }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { ABILITIES, DJINN_WISHES } from '@/data/content';
import { useGameStore } from '@/stores/gameStore';
const game = useGameStore();
const messageFresh = ref(false);
let freshTimer = null;

const messageKind = computed(() => {
  if (game.currentRewardItemInfo) return 'monster';
  if (game.currentMonsterInfo) return 'monster';
  if (game.phase === 'intro') return 'narration';
  if (game.barkLine) return 'geralt';
  if (game.phase === 'targeting') return 'system';
  if (game.phase === 'awakening') return 'system';
  if (game.phase === 'djinnTransition') return 'system';
  if ((game.djinnSleeping || game.djinnReady || game.djinnCeremonyActive || game.djinnHintVisible) && game.phase === 'playing') return 'system';
  return 'hint';
});

const messageEyebrow = computed(() => {
  if (game.currentRewardItemInfo) return '道具情报';
  switch (messageKind.value) {
    case 'monster': return '棋盘情报';
    case 'narration': return '今日场景';
    case 'geralt': return '杰洛特';
    case 'system': return '系统提示';
    default: return '旅途提示';
  }
});

const messageIcon = computed(() => {
  switch (messageKind.value) {
    case 'monster': return game.currentRewardItemInfo?.emoji || game.currentMonsterInfo?.emoji || '👁';
    case 'narration': return '📖';
    case 'geralt': return '🐺';
    case 'system': return '✨';
    default: return '🕯️';
  }
});

const messageTitle = computed(() => {
  if (game.currentRewardItemInfo) return game.currentRewardItemInfo.label;
  if (game.currentMonsterInfo) return game.currentMonsterInfo.label;
  if (game.phase === 'intro') return game.today?.building?.cn || '';
  if (game.barkLine) return '临场自语';
  if (game.phase === 'targeting') return '当前指令';
  if (game.phase === 'awakening') return DJINN_WISHES.wakeTitle;
  if (game.phase === 'djinnTransition') return game.currentDjinnTransition?.title || '封印重组';
  if ((game.djinnSleeping || game.djinnReady || game.djinnCeremonyActive || game.djinnHintVisible) && game.phase === 'playing') {
    return game.djinnSleeping
      ? DJINN_WISHES.sleepTitle
      : game.djinnObjectiveSummary?.title || '迪精';
  }
  return '今日建议';
});

const messageText = computed(() => {
  if (game.currentRewardItemInfo) {
    return [
      game.currentRewardItemInfo.healthLabel,
      game.currentRewardItemInfo.weakness,
      game.currentRewardItemInfo.pressure,
      game.currentRewardItemInfo.echo
    ].filter(Boolean).join('\n');
  }
  if (game.currentMonsterInfo) {
    return [
      game.currentMonsterInfo.healthLabel,
      game.currentMonsterInfo.weakness,
      game.currentMonsterInfo.pressure,
      game.currentMonsterInfo.echo
    ].filter(Boolean).join('\n');
  }
  if (game.phase === 'intro') return game.today?.intro || '';
  if (game.barkLine) return game.barkLine;

  if (game.phase === 'targeting') {
    const ab = ABILITIES[game.pendingAbility];
    switch (ab?.needsTarget) {
      case 'grape': return '点一个 🍇 葡萄方块，丰收会把周围 3×3 都变成葡萄。';
      case 'rowOrCol': return '点击一整行或一整列，直接清扫过去。';
      case 'twoTiles': return '依次点两个方块，萝卜会帮你完成任意交换。';
      case 'twoResources': return '在右侧能力栏里选两种资源，进行全局转换。';
      case 'milkTeaHarvest': return '';
      default: return ab?.desc || '';
    }
  }

  if (game.phase === 'awakening') {
    return '棋盘上的雷光正在汇向中央。等迪精醒来，最后的仪式就会开始。';
  }

  if (game.phase === 'djinnTransition') {
    return game.currentDjinnTransition?.hint || '封印正在重组，下一愿即将显现。';
  }

  if (game.djinnSleeping && game.phase === 'playing') {
    return DJINN_WISHES.sleepHint;
  }

  if (game.djinnReady && game.phase === 'playing') {
    return DJINN_WISHES.readyHint;
  }

  if (game.djinnCeremonyActive && game.phase === 'playing') {
    return [
      game.djinnObjectiveSummary?.healthLabel,
      game.djinnObjectiveSummary?.weakness,
      game.djinnObjectiveSummary?.pressure
    ].filter(Boolean).join('\n');
  }

  if (game.pigEnergyReady && game.phase === 'playing') {
    return '小猪已经攒满了 5 星好评。去右侧能力栏发动一次“奶茶攻击”，把棋盘上的某种资源全部收获。';
  }

  if (game.djinnHintVisible && game.phase === 'playing') {
    return DJINN_WISHES.readyLine;
  }

  return '点击棋盘开始整理。优先凑出顺手的三消，让资源稳稳涨起来。';
});

const messageKey = computed(() => [
  messageKind.value,
  messageTitle.value,
  messageText.value,
  game.barkNonce,
  game.phase,
  game.pendingAbility,
  game.currentDay
].join('|'));

watch(messageKey, (value, oldValue) => {
  if (!value || value === oldValue) return;
  messageFresh.value = false;
  if (freshTimer) clearTimeout(freshTimer);
  requestAnimationFrame(() => {
    messageFresh.value = true;
    freshTimer = setTimeout(() => {
      messageFresh.value = false;
      freshTimer = null;
    }, 1200);
  });
}, { immediate: true });

onBeforeUnmount(() => {
  if (freshTimer) clearTimeout(freshTimer);
});
</script>

<style scoped>
.resource-bar {
  width: 244px;
  padding: 18px 18px 20px;
  border-radius: var(--radius-md);
  overflow: hidden;
  isolation: isolate;
  contain: paint;
  background-clip: padding-box;
}
h3 {
  margin: 0 0 14px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 11px;
  font-size: 12px;
}
.emoji { font-size: 18px; width: 22px; text-align: center; }
.label { width: 32px; color: var(--ink); }
.track {
  flex: 1;
  height: 10px;
  background:
    linear-gradient(180deg, rgba(44, 30, 20, 0.30) 0%, rgba(82, 60, 40, 0.22) 100%);
  border-radius: var(--radius-pill);
  overflow: hidden;
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.22),
    inset 0 0 0 1px rgba(255, 244, 222, 0.10);
}
.fill {
  height: 100%;
  border-radius: var(--radius-pill);
  transition: width 420ms var(--ease-out-expo);
  box-shadow:
    inset 0 1px 0 rgba(255, 248, 230, 0.25),
    0 0 8px rgba(255, 248, 230, 0.1);
  position: relative;
}
.fill::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, transparent 60%);
  pointer-events: none;
}
.fill.grape { background: linear-gradient(90deg, var(--grape-2), var(--grape-1)); }
.fill.wood  { background: linear-gradient(90deg, var(--wood-2),  var(--wood-1)); }
.fill.stone { background: linear-gradient(90deg, var(--stone-2), var(--stone-1)); }
.fill.clay  { background: linear-gradient(90deg, var(--clay-2),  var(--clay-1)); }
.fill.herb  { background: linear-gradient(90deg, var(--herb-2),  var(--herb-1)); }
.fill.magic { background: linear-gradient(90deg, var(--magic-2), var(--magic-1)); }
.count {
  width: 60px;
  text-align: right;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}

.message-box {
  position: relative;
  margin-top: 20px;
  padding: 14px 14px 13px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  overflow: hidden;
  transition: transform 280ms var(--ease-out-expo), box-shadow 280ms var(--ease-out-expo), border-color 280ms var(--ease-out-expo), background 280ms var(--ease-out-expo);
  box-shadow:
    inset 0 0 0 1px rgba(180, 152, 104, 0.18),
    inset 0 1px 0 rgba(255, 252, 244, 0.20);
}

.message-box::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 4px;
  border-radius: 999px;
  background: rgba(180, 152, 104, 0.24);
}

.message-box.fresh {
  transform: translateY(-2px);
  box-shadow:
    0 12px 26px rgba(58, 42, 31, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.28);
  animation: message-flash 900ms var(--ease-out-expo);
}

.message-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.message-icon {
  width: 30px;
  height: 30px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.38);
  box-shadow: inset 0 0 0 1px rgba(58, 42, 31, 0.1);
  font-size: 14px;
}

.message-meta {
  min-width: 0;
}

.message-eyebrow {
  margin: 0 0 2px;
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--ink-faint);
}

.message-title {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.06em;
}

.message-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.75;
  color: var(--ink);
  white-space: pre-wrap;
}

.message-text.quoted {
  padding-left: 10px;
  border-left: 2px solid rgba(58, 42, 31, 0.16);
}

.kind-narration {
  background:
    linear-gradient(180deg, rgba(119, 146, 88, 0.10), rgba(255, 250, 240, 0.48));
  border-color: rgba(120, 144, 88, 0.20);
}

.kind-narration::before {
  background: linear-gradient(180deg, #6f8b4d, #c2a35d);
}

.kind-narration .message-icon {
  background: rgba(214, 228, 190, 0.7);
}

.kind-geralt {
  background:
    linear-gradient(180deg, rgba(90, 72, 52, 0.06), rgba(255, 250, 242, 0.58));
  border-color: rgba(180, 152, 104, 0.18);
}

.kind-geralt::before {
  background: linear-gradient(180deg, #7a603e, #47372a);
}

.kind-geralt .message-icon {
  background: rgba(224, 208, 184, 0.64);
}

.kind-geralt .message-title,
.kind-geralt .message-eyebrow {
  color: #6a5240;
}

.kind-geralt .message-text {
  font-weight: 500;
}

.kind-system {
  background:
    linear-gradient(180deg, rgba(212, 168, 87, 0.12), rgba(176, 148, 201, 0.10));
  border-color: rgba(180, 152, 104, 0.24);
}

.kind-system::before {
  background: linear-gradient(180deg, #d4a857, #9a74b8);
}

.kind-system .message-icon {
  background: rgba(252, 239, 203, 0.82);
}

.kind-system .message-title,
.kind-system .message-eyebrow {
  color: #9c6e2c;
}

.kind-monster {
  background:
    linear-gradient(180deg, rgba(96, 78, 58, 0.12), rgba(255, 250, 242, 0.58));
  border-color: rgba(180, 152, 104, 0.22);
}

.kind-monster::before {
  background: linear-gradient(180deg, #8f6b42, #3f2a1d);
}

.kind-monster .message-icon {
  background: rgba(230, 214, 194, 0.72);
}

.kind-monster .message-title,
.kind-monster .message-eyebrow {
  color: #4f3827;
}

.kind-hint {
  background:
    linear-gradient(180deg, rgba(255, 252, 244, 0.24), rgba(248, 240, 226, 0.38));
  border-color: rgba(180, 152, 104, 0.16);
}

.kind-hint::before {
  background: linear-gradient(180deg, #b8862e, #7d5a32);
}

.kind-hint .message-icon {
  background: rgba(248, 238, 212, 0.82);
}

@keyframes message-flash {
  0% {
    box-shadow:
      0 0 0 rgba(212, 172, 92, 0),
      inset 0 0 0 1px rgba(255, 252, 244, 0.10);
  }
  35% {
    box-shadow:
      0 0 0 5px rgba(212, 172, 92, 0.14),
      0 10px 24px rgba(44, 30, 22, 0.12),
      inset 0 0 0 1px rgba(255, 252, 244, 0.32);
  }
  100% {
    box-shadow:
      0 0 0 rgba(212, 172, 92, 0),
      0 10px 22px rgba(44, 30, 22, 0.10),
      inset 0 0 0 1px rgba(255, 252, 244, 0.24);
  }
}
</style>
