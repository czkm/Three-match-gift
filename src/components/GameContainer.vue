<template>
  <div class="game-container" :style="gameContainerStyle">
    <DayHeader />

    <div class="game-main">
      <aside class="side left">
        <ResourceBar />
      </aside>

      <main class="board-area">
        <div class="board-column">
          <!-- The board mounts once and lives across days. -->
          <GameBoard ref="boardEl" />
          <EstateStrip v-if="showEstateStrip" />
        </div>
      </main>

      <aside class="side right">
        <AbilityBar :board-ref="boardEl" />
      </aside>
    </div>

    <div
      v-if="game.phase === 'intro'"
      class="intro-overlay"
      @click="onIntroDone"
    />

    <!-- Day-end gentle reminder -->
    <DayEndOverlay v-if="game.phase === 'dayEnd'" @advance="onDayEndAdvance" />

    <DjinnCeremonyOverlay
      v-if="game.phase === 'wish'"
      :board-ref="boardEl"
    />

    <!-- Repair sequence: per-day differentiated cutscene -->
    <PerDayCutscene
      v-if="game.phase === 'repairing'"
      @advance="onRepairAdvance"
    />

    <RewardRoomOverlay
      v-if="game.phase === 'rewardChoice'"
      @choose="onRewardChoose"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { audioManager } from '@/audio/AudioManager'
import DayHeader from './HUD/DayHeader.vue'
import ResourceBar from './HUD/ResourceBar.vue'
import AbilityBar from './HUD/AbilityBar.vue'
import PerDayCutscene from './HUD/PerDayCutscene.vue'
import DayEndOverlay from './HUD/DayEndOverlay.vue'
import EstateStrip from './HUD/EstateStrip.vue'
import GameBoard from './Board/GameBoard.vue'
import DjinnCeremonyOverlay from './HUD/DjinnCeremonyOverlay.vue'
import RewardRoomOverlay from './HUD/RewardRoomOverlay.vue'
import { useGameStore } from '@/stores/gameStore'

const game = useGameStore()
const boardEl = ref(null)
const MIN_WIDTH_SCALE = 0.8
const MIN_LAYOUT_WIDTH = 960
const FULL_LAYOUT_WIDTH = 1280
const widthScale = ref(
  typeof window === 'undefined' ? 1 : calculateWidthScale(window.innerWidth)
)
const showEstateStrip = computed(() =>
  [
    'intro',
    'playing',
    'targeting',
    'dayEnd',
    'repairing',
    'rewardChoice',
    'awakening',
    'djinnTransition'
  ].includes(game.phase)
)
const gameContainerStyle = computed(() => ({
  '--game-main-scale-x': String(widthScale.value)
}))

function calculateWidthScale(width) {
  if (width <= MIN_LAYOUT_WIDTH) return MIN_WIDTH_SCALE
  if (width >= FULL_LAYOUT_WIDTH) return 1
  const progress =
    (width - MIN_LAYOUT_WIDTH) / (FULL_LAYOUT_WIDTH - MIN_LAYOUT_WIDTH)
  return Number((MIN_WIDTH_SCALE + progress * (1 - MIN_WIDTH_SCALE)).toFixed(4))
}

function updateWidthScale() {
  if (typeof window === 'undefined') return
  widthScale.value = calculateWidthScale(window.innerWidth)
}

function onIntroDone() {
  audioManager.playSFX('click')
  game.startPlay()
}

function onDayEndAdvance() {
  // The store has already reset steps and set phase = 'playing'.
}

function onRepairAdvance() {
  game.advanceFromRepair()
}

function onRewardChoose(itemId) {
  game.chooseRewardItem(itemId)
}

onMounted(() => {
  updateWidthScale()
  window.addEventListener('resize', updateWidthScale, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWidthScale)
})
</script>

<style scoped>
.game-container {
  --game-main-scale-x: 1;
  --game-main-scale-y: 1;
  --game-main-scale: min(var(--game-main-scale-x), var(--game-main-scale-y));
  --game-pad-x: 22px;
  --game-pad-top: 18px;
  --game-pad-bottom: 30px;
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding:
    calc(var(--game-pad-top) + env(safe-area-inset-top, 0px))
    max(var(--game-pad-x), env(safe-area-inset-right, 0px))
    calc(var(--game-pad-bottom) + env(safe-area-inset-bottom, 0px))
    max(var(--game-pad-x), env(safe-area-inset-left, 0px));
  overflow: hidden;
  isolation: isolate;
}

.game-container::before,
.game-container::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.game-container::before {
  inset: 0;
  background:
    radial-gradient(
      circle at 50% 18%,
      rgba(255, 219, 158, 0.2) 0%,
      transparent 32%
    ),
    radial-gradient(
      circle at 18% 82%,
      rgba(255, 200, 140, 0.08) 0%,
      transparent 28%
    ),
    linear-gradient(
      180deg,
      rgba(20, 12, 8, 0.04) 0%,
      rgba(20, 12, 8, 0.2) 100%
    ),
    var(--game-bg-overlay) center/cover no-repeat;
  z-index: -2;
}

.game-container::after {
  inset: 12px;
  border: 1px solid rgba(235, 215, 170, 0.08);
  border-radius: var(--radius-xl);
  box-shadow:
    inset 0 0 0 1px rgba(36, 24, 16, 0.22),
    inset 0 0 40px rgba(114, 93, 66, 0.05);
  z-index: -1;
}

.game-main {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 24px;
  margin-top: 6px;
  flex: 0 0 auto;
  zoom: var(--game-main-scale);
}

@supports not (zoom: 1) {
  .game-main {
    transform: scale(var(--game-main-scale));
    transform-origin: top center;
  }
}

.side {
  flex: 0 0 244px;
  display: flex;
  align-items: flex-start;
  width: 244px;
  min-width: 0;
}

.board-area {
  position: relative;
  flex: 0 0 680px;
  display: flex;
  justify-content: center;
  min-width: 0;
}

.board-column {
  width: 680px;
  max-width: 100%;
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.intro-overlay {
  position: absolute;
  inset: 0;
  z-index: 18;
  cursor: pointer;
}

@media (max-width: 1180px) {
  .game-main {
    gap: 18px;
  }
}

@media (max-width: 960px) {
  .game-container {
    --game-pad-x: 16px;
    --game-pad-top: 14px;
    --game-pad-bottom: 22px;
  }
  .game-container::after {
    inset: 8px;
    border-radius: var(--radius-lg);
  }
  .game-main {
    gap: 14px;
  }
}

@media (max-height: 880px) {
  .game-container {
    --game-main-scale-y: 0.94;
    --game-pad-top: 12px;
    --game-pad-bottom: 18px;
  }
  .game-main {
    margin-top: 2px;
  }
  .board-column {
    gap: 10px;
  }
}

@media (max-height: 820px) {
  .game-container {
    --game-main-scale-y: 0.84;
    --game-pad-top: 8px;
    --game-pad-bottom: 12px;
  }
  .board-column {
    gap: 8px;
  }
}

@media (max-height: 760px) {
  .game-container {
    --game-main-scale-y: 0.78;
  }
}
</style>
