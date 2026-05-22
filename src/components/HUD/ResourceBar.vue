<template>
  <div class="resource-bar">
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
          :class="[
            `tone-${item.tone || item.roomType || 'treasure'}`,
            `quality-${item.quality || 0}`,
            {
              triggered: item.id === highlightedItemId,
              consumed: isItemConsumedToday(item)
            }
          ]"
          type="button"
          :title="item.name"
          @mouseenter="game.showRewardItemInfo(item.id, 'hud')"
          @focus="game.showRewardItemInfo(item.id, 'hud')"
          @mouseleave="game.clearRewardItemInfo('hud')"
          @blur="game.clearRewardItemInfo('hud')"
        >
          <span class="trinket-emoji">
            <span v-if="isItemConsumedToday(item)" class="trinket-consumed-icon">🚫</span>
            <span v-else>{{ item.emoji }}</span>
          </span>
        </button>
        <span
          v-for="slot in trinketSlots"
          :key="`empty-${slot}`"
          class="trinket-slot"
          aria-hidden="true"
        />
      </div>
    </section>

    <h3 class="ink-title">{{ HUD_COPY.repairProgressTitle }}</h3>
    <div
      v-for="r in game.repairView"
      :key="r.id"
      class="row"
      :class="{ highlighted: highlightedResourceIds.has(r.id), stolen: stolenResourceIds.has(r.id) }"
    >
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
      :class="[`kind-${messageKind}`, { fresh: messageFresh, 'notice-active': effectNotice }]"
    >
      <div class="message-head">
        <span class="message-icon">
          <IsaacCollectibleIcon
            v-if="game.currentRewardItemInfo"
            :reward-item-id="game.currentRewardItemInfo.itemId"
            :size="22"
            :fallback-emoji="game.currentRewardItemInfo.emoji"
          />
          <span v-else>{{ messageIcon }}</span>
        </span>
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
import { ABILITIES, DJINN_WISHES, RESOURCE_BY_ID } from '@/data/content';
import { useGameStore } from '@/stores/gameStore';
import IsaacCollectibleIcon from '@/components/common/IsaacCollectibleIcon.vue';
const game = useGameStore();
const messageFresh = ref(false);
const trinketFlash = ref(false);
const effectNotice = ref(null);
const highlightedItemId = ref('');
const highlightedResourceIds = ref(new Set());
const stolenResourceIds = ref(new Set());
let freshTimer = null;
let trinketFlashTimer = null;
let effectNoticeTimer = null;
let highlightedItemTimer = null;
let highlightedResourceTimer = null;
let stolenResourceTimer = null;

const trinketItems = computed(() =>
  [...(game.ownedItems || [])]
    .filter(item => item?.emoji)
    .sort((a, b) => (b.quality || 0) - (a.quality || 0) || (a.day || 0) - (b.day || 0))
);
const trinketSlots = computed(() =>
  Array.from({ length: Math.max(0, 6 - trinketItems.value.length) }, (_, index) => index)
);

function isItemConsumedToday(item) {
  if (!item?.id) return false
  return (
    game._hasItemFlag(item, 'used') ||
    game._hasItemFlag(item, 'invalid') ||
    game._hasItemFlag(item, 'zero')
  )
}

const messageKind = computed(() => {
  if (effectNotice.value) return effectNotice.value.kind || 'system';
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
  if (effectNotice.value) return '道具触发';
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
  if (effectNotice.value) return effectNotice.value.itemEmoji || '✨';
  switch (messageKind.value) {
    case 'monster': return game.currentRewardItemInfo?.emoji || game.currentMonsterInfo?.emoji || '👁';
    case 'narration': return '📖';
    case 'geralt': return '🐺';
    case 'system': return '✨';
    default: return '🕯️';
  }
});

const messageTitle = computed(() => {
  if (effectNotice.value) return effectNotice.value.title || '';
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
  if (effectNotice.value) return effectNotice.value.text || '';
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

function buildEffectNotice(payload = {}) {
  const pieces = [];
  const affectedResourceLabels = (payload.affectedResources || []).map((id) => RESOURCE_BY_ID[id]?.cn || id);
  if (payload.summaryText) pieces.push(payload.summaryText);
  if (payload.bonusAmount && payload.affectedResources?.length) {
    pieces.push(`影响资源：${affectedResourceLabels.join('、')}，每项 +${payload.bonusAmount}`);
  } else if (payload.bonusAmount) {
    pieces.push(`数值变化 +${payload.bonusAmount}`);
  }
  if (payload.stepsGained) {
    pieces.push(`步数 +${payload.stepsGained}`);
  }
  if (payload.pigEnergyGained) {
    pieces.push(`小猪能量 +${payload.pigEnergyGained}`);
  }
  if (payload.pigEnergySpent) {
    pieces.push(`消耗小猪能量 ${payload.pigEnergySpent}`);
  }
  if (payload.djinnProgressBonus) {
    pieces.push(`仪式进度 +${payload.djinnProgressBonus}`);
  }
  return {
    kind: payload.itemTone === 'devil' ? 'monster' : 'system',
    itemEmoji: payload.itemEmoji || '✨',
    title: payload.itemEnName
      ? `${payload.itemName} · ${payload.itemEnName}`
      : payload.itemName || '道具触发',
    text: pieces.filter(Boolean).join('\n') || `${payload.itemName || '道具'} 已触发`
  };
}

function onItemEffectTriggered(payload = {}) {
  effectNotice.value = buildEffectNotice(payload);
  highlightedItemId.value = payload.itemId || '';
  highlightedResourceIds.value = new Set(payload.affectedResources || []);

  // Devil-tone effects with affected resources → red stolen flash
  if (payload.itemTone === 'devil' && payload.affectedResources?.length) {
    stolenResourceIds.value = new Set(payload.affectedResources);
    if (stolenResourceTimer) clearTimeout(stolenResourceTimer);
    stolenResourceTimer = setTimeout(() => {
      stolenResourceIds.value = new Set();
      stolenResourceTimer = null;
    }, 1800);
  }

  if (effectNoticeTimer) clearTimeout(effectNoticeTimer);
  if (highlightedItemTimer) clearTimeout(highlightedItemTimer);
  if (highlightedResourceTimer) clearTimeout(highlightedResourceTimer);

  effectNoticeTimer = setTimeout(() => {
    effectNotice.value = null;
    effectNoticeTimer = null;
  }, 2400);
  highlightedItemTimer = setTimeout(() => {
    highlightedItemId.value = '';
    highlightedItemTimer = null;
  }, 1600);
  highlightedResourceTimer = setTimeout(() => {
    highlightedResourceIds.value = new Set();
    highlightedResourceTimer = null;
  }, 1600);
}

function onPigEnergyRestored(payload = {}) {
  // Enhanced visual notification for energy restore (darkBeggar etc.)
  trinketFlash.value = false;
  if (trinketFlashTimer) clearTimeout(trinketFlashTimer);
  requestAnimationFrame(() => {
    trinketFlash.value = true;
    trinketFlashTimer = setTimeout(() => {
      trinketFlash.value = false;
      trinketFlashTimer = null;
    }, 900);
  });
  // Show as an effect notice for max visibility
  const amount = payload.amount || 0;
  effectNotice.value = {
    kind: 'system',
    itemEmoji: '⚡',
    title: '能量恢复！',
    body: `黑暗乞丐归还了能量，小猪精神 +${amount}`,
    detail: `来源：${payload.source || '未知'}`
  };
  if (effectNoticeTimer) clearTimeout(effectNoticeTimer);
  effectNoticeTimer = setTimeout(() => {
    effectNotice.value = null;
    effectNoticeTimer = null;
  }, 3000);
}

onMounted(() => {
  EventBus.bind('rewardHudFlash', onRewardHudFlash);
  EventBus.bind('itemEffectTriggered', onItemEffectTriggered);
  EventBus.bind('pigEnergyRestored', onPigEnergyRestored);
});

onBeforeUnmount(() => {
  EventBus.unbind('rewardHudFlash', onRewardHudFlash);
  EventBus.unbind('itemEffectTriggered', onItemEffectTriggered);
  EventBus.unbind('pigEnergyRestored', onPigEnergyRestored);
  if (freshTimer) clearTimeout(freshTimer);
  if (trinketFlashTimer) clearTimeout(trinketFlashTimer);
  if (effectNoticeTimer) clearTimeout(effectNoticeTimer);
  if (highlightedItemTimer) clearTimeout(highlightedItemTimer);
  if (highlightedResourceTimer) clearTimeout(highlightedResourceTimer);
  if (stolenResourceTimer) clearTimeout(stolenResourceTimer);
});
</script>

<style scoped>
.resource-bar {
  width: 244px;
  padding: 18px 18px 20px;
  border-radius: 16px;
  background: rgb(247, 243, 223);
  border: 2px solid #d4c9b4;
  box-shadow: 0 3px 0 0 #d4c9b4;
  color: #725d42;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  overflow: hidden;
  isolation: isolate;
  contain: paint;
}

.trinket-bar {
  margin-bottom: 16px;
  padding: 12px 12px 10px;
  border-radius: 12px;
  background: #f8f8f0;
  border: 2px solid #eae4d0;
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
  color: #794f27;
  font-weight: 700;
}

.trinket-count {
  min-width: 22px;
  padding: 2px 8px;
  border-radius: 50px;
  font-size: 10px;
  font-weight: 800;
  color: #9f927d;
  background: #eae4d0;
}

.trinket-track {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 34px;
  padding: 2px;
  border-radius: 14px;
  transition: box-shadow 260ms ease, background 260ms ease;
}

.trinket-track.flash {
  background: rgba(25, 200, 185, 0.08);
  box-shadow: 0 0 0 2px rgba(25, 200, 185, 0.18), 0 0 12px rgba(25, 200, 185, 0.12);
}

.trinket-chip {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 2px solid #d4c9b4;
  border-radius: 50px;
  cursor: pointer;
  background: #f8f8f0;
  box-shadow: 0 2px 0 0 #d4c9b4;
  font-size: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.trinket-chip:hover,
.trinket-chip:focus-visible {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 0 0 #d4c9b4;
}

.trinket-chip.triggered {
  transform: translateY(-2px) scale(1.12);
  box-shadow:
    0 4px 0 0 #d4c9b4,
    0 0 0 4px rgba(240, 200, 100, 0.28),
    0 0 22px rgba(240, 200, 100, 0.32);
  animation: trinket-trigger-glow 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.trinket-chip.triggered .trinket-emoji {
  animation: trinket-emoji-pop 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes trinket-trigger-glow {
  0%   {
    box-shadow:
      0 4px 0 0 #d4c9b4,
      0 0 0 0 rgba(240, 200, 100, 0),
      0 0 0 rgba(240, 200, 100, 0);
  }
  30%  {
    box-shadow:
      0 4px 0 0 #d4c9b4,
      0 0 0 8px rgba(240, 200, 100, 0.35),
      0 0 36px rgba(240, 200, 100, 0.40);
  }
  100% {
    box-shadow:
      0 4px 0 0 #d4c9b4,
      0 0 0 4px rgba(240, 200, 100, 0.28),
      0 0 22px rgba(240, 200, 100, 0.32);
  }
}

@keyframes trinket-emoji-pop {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.35); }
  100% { transform: scale(1); }
}

.trinket-chip.consumed {
  filter: grayscale(0.65) brightness(0.75);
  opacity: 0.48;
  cursor: default;
  transform: none;
  box-shadow: 0 1px 0 0 #c0b8a4;
  border-color: #c0b8a4;
}

.trinket-chip.consumed:hover,
.trinket-chip.consumed:focus-visible {
  transform: none;
  box-shadow: 0 1px 0 0 #c0b8a4;
}

.trinket-consumed-icon {
  font-size: 14px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.trinket-chip.quality-3 {
  border-color: rgba(172, 124, 228, 0.5);
  box-shadow: 0 2px 0 0 rgba(114, 72, 176, 0.4);
  filter: drop-shadow(0 0 6px rgba(184, 130, 255, 0.24));
}

.trinket-chip.quality-4 {
  border-color: rgba(255, 140, 88, 0.5);
  box-shadow: 0 2px 0 0 rgba(200, 100, 50, 0.4);
  filter: drop-shadow(0 0 8px rgba(255, 132, 84, 0.3));
  animation: trinket-legendary-pulse 1.8s ease-in-out infinite;
}

.trinket-emoji {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  line-height: 1;
}

.trinket-chip.tone-devil {
  border-color: rgba(224, 90, 90, 0.35);
  box-shadow: 0 2px 0 0 rgba(200, 70, 70, 0.3);
}

.trinket-slot {
  width: 30px;
  height: 30px;
  border-radius: 50px;
  background: #f8f8f0;
  border: 2px dashed #eae4d0;
}

@keyframes trinket-legendary-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

h3 {
  margin: 0 0 14px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #9f927d;
  font-weight: 700;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 11px;
  font-size: 12px;
}

.row.highlighted {
  transform: translateX(2px);
}

.row.highlighted .track {
  box-shadow:
    0 0 0 2px rgba(25, 200, 185, 0.16),
    0 0 16px rgba(25, 200, 185, 0.14);
}

.row.stolen {
  animation: resource-stolen-shake 600ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.row.stolen .track {
  box-shadow:
    0 0 0 2px rgba(224, 90, 90, 0.35),
    0 0 20px rgba(224, 90, 90, 0.25);
}

.row.stolen .fill {
  filter: brightness(1.3) saturate(0.5) hue-rotate(-30deg);
}

.row.stolen .label {
  color: #e05a5a;
}

.row.stolen .count {
  color: #e05a5a;
  font-weight: 800;
  animation: stolen-count-pulse 600ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes resource-stolen-shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-4px); }
  30% { transform: translateX(4px); }
  45% { transform: translateX(-3px); }
  60% { transform: translateX(3px); }
  75% { transform: translateX(-1px); }
  90% { transform: translateX(1px); }
}

@keyframes stolen-count-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.emoji { font-size: 18px; width: 22px; text-align: center; }
.label { width: 32px; color: #725d42; font-weight: 600; }

.track {
  flex: 1;
  height: 10px;
  background: #eae4d0;
  border-radius: 50px;
  overflow: hidden;
  border: 1.5px solid #d4c9b4;
}

.fill {
  height: 100%;
  border-radius: 50px;
  transition: width 420ms ease;
  position: relative;
}

.fill::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 60%);
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
  color: #9f927d;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.message-box {
  position: relative;
  margin-top: 20px;
  padding: 14px 14px 13px 18px;
  border-radius: 12px;
  border: 2px solid #d4c9b4;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: #f8f8f0;
  box-shadow: 0 3px 0 0 #d4c9b4;
}

.message-box::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 4px;
  border-radius: 0 2px 2px 0;
  background: #19c8b9;
}

.message-box.fresh {
  transform: translateY(-2px);
  box-shadow:
    0 5px 0 0 #d4c9b4,
    0 4px 12px rgba(107, 92, 67, 0.12);
  animation: message-flash 900ms ease;
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
  border-radius: 50px;
  background: #eae4d0;
  border: 2px solid #d4c9b4;
  font-size: 14px;
}

.message-meta {
  min-width: 0;
}

.message-eyebrow {
  margin: 0 0 2px;
  font-size: 10px;
  letter-spacing: 0.16em;
  color: #9f927d;
  font-weight: 600;
}

.message-title {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.06em;
  color: #794f27;
  font-weight: 700;
}

.message-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.75;
  color: #725d42;
  white-space: pre-wrap;
  font-weight: 500;
}

.message-text.quoted {
  padding-left: 10px;
  border-left: 2px solid #19c8b9;
}

.kind-narration {
  background: linear-gradient(180deg, rgba(25, 200, 185, 0.06), #f8f8f0);
  border-color: rgba(25, 200, 185, 0.25);
}

.kind-narration::before {
  background: linear-gradient(180deg, #19c8b9, #50B9AB);
}

.kind-narration .message-icon {
  background: rgba(230, 249, 246, 0.7);
  border-color: rgba(25, 200, 185, 0.3);
}

.kind-geralt {
  background: #f8f8f0;
  border-color: #d4c9b4;
}

.kind-geralt::before {
  background: linear-gradient(180deg, #19c8b9, #50B9AB);
}

.kind-geralt .message-icon {
  background: #eae4d0;
}

.kind-geralt .message-title,
.kind-geralt .message-eyebrow {
  color: #794f27;
}

.kind-geralt .message-text {
  font-weight: 500;
}

.kind-system {
  background: linear-gradient(180deg, rgba(245, 195, 28, 0.08), #f8f8f0);
  border-color: rgba(245, 195, 28, 0.3);
}

.kind-system::before {
  background: linear-gradient(180deg, #f5c31c, #dba90e);
}

.kind-system .message-icon {
  background: rgba(255, 244, 210, 0.82);
  border-color: rgba(245, 195, 28, 0.3);
}

.kind-system .message-title,
.kind-system .message-eyebrow {
  color: #794f27;
}

.kind-monster {
  background: #f8f8f0;
  border-color: #d4c9b4;
}

.kind-monster::before {
  background: linear-gradient(180deg, #9f927d, #725d42);
}

.kind-monster .message-icon {
  background: #eae4d0;
}

.kind-monster .message-title,
.kind-monster .message-eyebrow {
  color: #725d42;
}

.kind-hint {
  background: #f8f8f0;
  border-color: #eae4d0;
}

.kind-hint::before {
  background: linear-gradient(180deg, #19c8b9, #50B9AB);
}

.kind-hint .message-icon {
  background: #eae4d0;
}

/* ── Effect notice — golden pulse when item triggers ── */
.message-box.notice-active {
  border-color: rgba(240, 200, 100, 0.45);
  background: linear-gradient(180deg, rgba(255, 245, 210, 0.35), #f8f8f0);
  box-shadow:
    0 3px 0 0 #d4c9b4,
    0 0 22px rgba(240, 200, 100, 0.2);
  animation: notice-box-pulse 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.message-box.notice-active::before {
  background: linear-gradient(180deg, #f0c850, #d4a020);
}

.message-box.notice-active .message-icon {
  background: rgba(255, 244, 210, 0.82);
  border-color: rgba(240, 200, 100, 0.35);
  box-shadow: 0 0 10px rgba(240, 200, 100, 0.2);
}

.message-box.notice-active .message-title {
  color: #8b6914;
}

@keyframes notice-box-pulse {
  0%   {
    box-shadow:
      0 3px 0 0 #d4c9b4,
      0 0 0 rgba(240, 200, 100, 0),
      0 0 0 rgba(240, 200, 100, 0);
  }
  25%  {
    box-shadow:
      0 3px 0 0 #d4c9b4,
      0 0 36px rgba(240, 200, 100, 0.30),
      0 0 8px rgba(240, 200, 100, 0.18);
  }
  100% {
    box-shadow:
      0 3px 0 0 #d4c9b4,
      0 0 22px rgba(240, 200, 100, 0.2),
      0 0 4px rgba(240, 200, 100, 0.10);
  }
}

@keyframes message-flash {
  0% {
    box-shadow: 0 3px 0 0 #d4c9b4;
  }
  35% {
    box-shadow:
      0 0 0 4px rgba(25, 200, 185, 0.12),
      0 5px 0 0 #d4c9b4,
      0 4px 12px rgba(107, 92, 67, 0.12);
  }
  100% {
    box-shadow: 0 3px 0 0 #d4c9b4;
  }
}
</style>
