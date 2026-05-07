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

    <WishOverlay v-if="game.phase === 'wish'" :board-ref="boardEl" />

    <!-- Repair sequence: per-day differentiated cutscene -->
    <PerDayCutscene v-if="game.phase === 'repairing'" @advance="onRepairAdvance" />
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
import WishOverlay from './HUD/WishOverlay.vue';
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();
const boardEl = ref(null);
const showEstateStrip = computed(() => ['intro', 'playing', 'targeting', 'dayEnd', 'repairing'].includes(game.phase));

function onIntroDone() {
  game.startPlay();
}

function onDayEndAdvance() {
  // The store has already reset steps and set phase = 'playing'.
}

function onRepairAdvance() {
  // PerDayCutscene has already called game.finishRepair() once the banner stamps in.
  // Now move to next day or end.
  if (game.today?.ending) {
    // Last day → advance into ending (handled by App.vue switching).
    game.phase = 'ending';
  } else {
    game.advanceFromRepair();
  }
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
  inset: 0;
  pointer-events: none;
}

.game-container::before {
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 219, 158, 0.18) 0%, transparent 32%),
    linear-gradient(180deg, rgba(20, 12, 8, 0.04) 0%, rgba(20, 12, 8, 0.18) 100%);
  z-index: -2;
}

.game-container::after {
  inset: 14px;
  border: 1px solid rgba(231, 206, 158, 0.08);
  border-radius: 22px;
  box-shadow: inset 0 0 0 1px rgba(34, 22, 14, 0.24);
  z-index: -1;
}

.game-main {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 22px;
  margin-top: 4px;
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
  gap: 12px;
}

.intro-overlay {
  position: absolute;
  inset: 0;
  z-index: 18;
  cursor: pointer;
}

@media (max-width: 1180px) {
  .game-main {
    gap: 16px;
  }
}

</style>
