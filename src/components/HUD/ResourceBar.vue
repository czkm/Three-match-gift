<template>
  <div class="resource-bar glass grain">
    <section class="trinket-bar">
      <div class="trinket-head">
        <p class="trinket-title ink-title">{{ HUD_COPY.trinketTitle }}</p>
        <span class="trinket-count">{{ game.ownedItems.length }}</span>
      </div>
      <div
        class="trinket-track"
        :class="{ flash: trinketFlash }"
        data-trinket-target="true"
      >
        <button
          v-for="item in trinketItems"
          :key="`${item.id}-${item.day || item.slot}`"
          class="trinket-chip"
          :class="[`tone-${item.tone || item.roomType || 'treasure'}`, `quality-${item.quality || 0}`]"
          type="button"
          :title="item.name"
          @mouseenter="game.showRewardItemInfo(item.id, 'hud')"
          @focus="game.showRewardItemInfo(item.id, 'hud')"
          @mouseleave="game.clearRewardItemInfo('hud')"
          @blur="game.clearRewardItemInfo('hud')"
        >{{ item.emoji }}</button>
        <span
          v-for="slot in trinketSlots"
          :key="`empty-${slot}`"
          class="trinket-slot"
          aria-hidden="true"
        />
      </div>
    </section>

    <h3 class="ink-title">{{ HUD_COPY.repairProgressTitle }}</h3>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import EventBus from '@/core/eventBus';
import { GAMEPLAY_COPY, HUD_COPY, TARGETING_COPY } from '@/data/copy';
import { ABILITIES, DJINN_WISHES } from '@/data/content';
import { useGameStore } from '@/stores/gameStore';
const game = useGameStore();
const messageFresh = ref(false);
const trinketFlash = ref(false);
let freshTimer = null;
let trinketFlashTimer = null;

const trinketItems = computed(() =>
  [...(game.ownedItems || [])]
    .filter(item => item?.emoji)
    .sort((a, b) => (b.quality || 0) - (a.quality || 0) || (a.day || 0) - (b.day || 0))
);
const trinketSlots = computed(() =>
  Array.from({ length: Math.max(0, 6 - trinketItems.value.length) }, (_, index) => index)
);

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
  if (game.currentRewardItemInfo) return HUD_COPY.messageEyebrows.rewardItem;
  switch (messageKind.value) {
    case 'monster': return HUD_COPY.messageEyebrows.monster;
    case 'narration': return HUD_COPY.messageEyebrows.narration;
    case 'geralt': return HUD_COPY.messageEyebrows.geralt;
    case 'system': return HUD_COPY.messageEyebrows.system;
    default: return HUD_COPY.messageEyebrows.hint;
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
  if (game.barkLine) return HUD_COPY.messageTitles.bark;
  if (game.phase === 'targeting') return HUD_COPY.messageTitles.targeting;
  if (game.phase === 'awakening') return DJINN_WISHES.wakeTitle;
  if (game.phase === 'djinnTransition') return game.currentDjinnTransition?.title || HUD_COPY.messageTitles.djinnTransitionFallback;
  if ((game.djinnSleeping || game.djinnReady || game.djinnCeremonyActive || game.djinnHintVisible) && game.phase === 'playing') {
    return game.djinnSleeping
      ? DJINN_WISHES.sleepTitle
      : game.djinnObjectiveSummary?.title || HUD_COPY.messageTitles.djinnFallback;
  }
  return HUD_COPY.messageTitles.hint;
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
      case 'grape': return TARGETING_COPY.long.grape;
      case 'rowOrCol': return TARGETING_COPY.long.rowOrCol;
      case 'twoTiles': return TARGETING_COPY.long.twoTiles;
      case 'twoResources': return TARGETING_COPY.long.twoResources;
      case 'milkTeaHarvest': return '';
      default: return ab?.desc || '';
    }
  }

  if (game.phase === 'awakening') {
    return GAMEPLAY_COPY.hints.awakening;
  }

  if (game.phase === 'djinnTransition') {
    return game.currentDjinnTransition?.hint || GAMEPLAY_COPY.hints.djinnTransitionFallback;
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
    return GAMEPLAY_COPY.hints.pigEnergyReady;
  }

  if (game.djinnHintVisible && game.phase === 'playing') {
    return DJINN_WISHES.readyLine;
  }

  return GAMEPLAY_COPY.hints.initial;
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

function onRewardHudFlash() {
  trinketFlash.value = false;
  if (trinketFlashTimer) clearTimeout(trinketFlashTimer);
  requestAnimationFrame(() => {
    trinketFlash.value = true;
    trinketFlashTimer = setTimeout(() => {
      trinketFlash.value = false;
      trinketFlashTimer = null;
    }, 560);
  });
}

onMounted(() => {
  EventBus.bind('rewardHudFlash', onRewardHudFlash);
});

onBeforeUnmount(() => {
  EventBus.unbind('rewardHudFlash', onRewardHudFlash);
  if (freshTimer) clearTimeout(freshTimer);
  if (trinketFlashTimer) clearTimeout(trinketFlashTimer);
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

.trinket-bar {
  margin-bottom: 16px;
  padding: 12px 12px 10px;
  border-radius: var(--radius-sm);
  background:
    linear-gradient(180deg, rgba(255, 248, 233, 0.48), rgba(232, 208, 170, 0.16));
  box-shadow:
    inset 0 0 0 1px rgba(180, 152, 104, 0.22),
    inset 0 1px 0 rgba(255, 252, 244, 0.22);
}

.trinket-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.trinket-title {
  margin: 0;
  font-size: 12px;
}

.trinket-count {
  min-width: 22px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.5);
}

.trinket-track {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 34px;
  padding: 2px;
  border-radius: 14px;
  transition: box-shadow 260ms var(--ease-out-expo), background 260ms var(--ease-out-expo);
}

.trinket-track.flash {
  background:
    radial-gradient(circle at 14% 44%, rgba(255, 244, 196, 0.34), transparent 26%),
    linear-gradient(180deg, rgba(255, 248, 232, 0.42), rgba(255, 236, 196, 0.16));
  box-shadow:
    0 0 0 1px rgba(232, 188, 92, 0.24),
    0 0 18px rgba(255, 210, 118, 0.28);
}

.trinket-chip {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.52), rgba(248, 232, 202, 0.16));
  box-shadow:
    inset 0 0 0 1px rgba(180, 152, 104, 0.22),
    0 6px 12px rgba(24, 16, 10, 0.08);
  font-size: 16px;
  transition:
    transform 180ms var(--ease-out-expo),
    box-shadow 180ms var(--ease-out-expo),
    filter 180ms var(--ease-out-expo);
}

.trinket-chip:hover,
.trinket-chip:focus-visible {
  transform: translateY(-2px) scale(1.04);
  box-shadow:
    inset 0 0 0 1px rgba(180, 152, 104, 0.22),
    0 10px 16px rgba(24, 16, 10, 0.12);
}

.trinket-chip.quality-3 {
  background:
    radial-gradient(circle at 30% 30%, rgba(244, 232, 255, 0.62), rgba(150, 108, 214, 0.22));
  filter: drop-shadow(0 0 10px rgba(184, 130, 255, 0.34));
}

.trinket-chip.quality-4 {
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 238, 214, 0.7), rgba(238, 116, 78, 0.24));
  filter:
    drop-shadow(0 0 12px rgba(255, 110, 82, 0.4))
    drop-shadow(0 0 22px rgba(255, 188, 110, 0.16));
  animation: trinket-legendary-pulse 1.8s ease-in-out infinite;
}

.trinket-chip.tone-devil {
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 216, 216, 0.46), rgba(104, 22, 28, 0.26));
}

.trinket-slot {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.18), rgba(114, 92, 62, 0.08));
  box-shadow: inset 0 0 0 1px rgba(180, 152, 104, 0.14);
}

@keyframes trinket-legendary-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
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
