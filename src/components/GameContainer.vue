<template>
  <div class="game-container">
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

    <div v-if="game.phase === 'intro'" class="intro-overlay" @click="onIntroDone" />

    <!-- Day-end gentle reminder -->
    <DayEndOverlay v-if="game.phase === 'dayEnd'" @advance="onDayEndAdvance" />

    <DjinnCeremonyOverlay v-if="game.phase === 'wish'" :board-ref="boardEl" />

    <!-- Repair sequence: per-day differentiated cutscene -->
    <PerDayCutscene v-if="game.phase === 'repairing'" @advance="onRepairAdvance" />

    <RewardRoomOverlay v-if="game.phase === 'rewardChoice'" @choose="onRewardChoose" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import DayHeader from './HUD/DayHeader.vue';
import ResourceBar from './HUD/ResourceBar.vue';
import AbilityBar from './HUD/AbilityBar.vue';
import PerDayCutscene from './HUD/PerDayCutscene.vue';
import DayEndOverlay from './HUD/DayEndOverlay.vue';
import EstateStrip from './HUD/EstateStrip.vue';
import GameBoard from './Board/GameBoard.vue';
import DjinnCeremonyOverlay from './HUD/DjinnCeremonyOverlay.vue';
import RewardRoomOverlay from './HUD/RewardRoomOverlay.vue';
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();
const boardEl = ref(null);
const showEstateStrip = computed(() => ['intro', 'playing', 'targeting', 'dayEnd', 'repairing', 'rewardChoice', 'awakening', 'djinnTransition'].includes(game.phase));

function onIntroDone() {
  game.startPlay();
}

function onDayEndAdvance() {
  // The store has already reset steps and set phase = 'playing'.
}

function onRepairAdvance() {
  game.advanceFromRepair();
}

function onRewardChoose(itemId) {
  game.chooseRewardItem(itemId);
}

</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 22px 30px;
  overflow: hidden;
  isolation: isolate;
}

.game-container::before,
.game-container::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.game-container::before {
  inset: 0;
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 219, 158, 0.2) 0%, transparent 32%),
    radial-gradient(circle at 18% 82%, rgba(255, 200, 140, 0.08) 0%, transparent 28%),
    linear-gradient(180deg, rgba(20, 12, 8, 0.04) 0%, rgba(20, 12, 8, 0.2) 100%);
  z-index: -2;
}

.game-container::after {
  inset: 12px;
  border: 1px solid rgba(235, 215, 170, 0.08);
  border-radius: var(--radius-xl);
  box-shadow:
    inset 0 0 0 1px rgba(36, 24, 16, 0.22),
    inset 0 0 40px rgba(0, 0, 0, 0.06);
  z-index: -1;
}

.game-main {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 24px;
  margin-top: 6px;
}
.side {
  flex: none;
  display: flex;
  align-items: flex-start;
}

.board-area {
  position: relative;
}

.board-column {
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
    padding: 14px 16px 22px;
  }
  .game-container::after {
    inset: 8px;
    border-radius: var(--radius-lg);
  }
  .game-main {
    gap: 14px;
  }
}

</style>
