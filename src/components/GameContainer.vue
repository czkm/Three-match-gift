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

    <!-- Day intro narration — bottom dialog strip, board stays visible. -->
    <transition name="dialog-fade">
      <div v-if="game.phase === 'intro'" class="intro-strip">
        <Dialog
          :text="game.today.intro"
          hint="点击继续"
          @done="onIntroDone"
          @skip="onIntroDone"
        />
        <button v-if="introReady" class="begin" @click="onBeginDay">
          开始今天的修复
        </button>
      </div>
    </transition>

    <!-- Day-end gentle reminder -->
    <DayEndOverlay v-if="game.phase === 'dayEnd'" @advance="onDayEndAdvance" />

    <transition name="dialog-fade">
      <div v-if="game.barkLine && ['playing', 'targeting', 'wish'].includes(game.phase)" class="bark-strip">
        <Dialog
          :key="game.barkNonce"
          :text="game.barkLine"
          hint="点击收起"
          @done="game.dismissBark()"
          @skip="game.dismissBark()"
        />
      </div>
    </transition>

    <transition name="dialog-fade">
      <div v-if="game.djinnHintVisible && game.phase === 'playing'" class="djinn-hint-strip">
        <div class="hint-card parchment grain">
          <p class="ink-subtle">{{ djinnHint }}</p>
        </div>
      </div>
    </transition>

    <WishOverlay v-if="game.phase === 'wish'" :board-ref="boardEl" />

    <!-- Repair sequence: per-day differentiated cutscene -->
    <PerDayCutscene v-if="game.phase === 'repairing'" @advance="onRepairAdvance" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import DayHeader from './HUD/DayHeader.vue';
import ResourceBar from './HUD/ResourceBar.vue';
import AbilityBar from './HUD/AbilityBar.vue';
import Dialog from './HUD/Dialog.vue';
import PerDayCutscene from './HUD/PerDayCutscene.vue';
import DayEndOverlay from './HUD/DayEndOverlay.vue';
import EstateStrip from './HUD/EstateStrip.vue';
import GameBoard from './Board/GameBoard.vue';
import WishOverlay from './HUD/WishOverlay.vue';
import { useGameStore } from '@/stores/gameStore';
import { DJINN_WISHES } from '@/data/content';

const game = useGameStore();
const boardEl = ref(null);
const introReady = ref(false);
const showEstateStrip = computed(() => ['intro', 'playing', 'targeting', 'dayEnd', 'repairing'].includes(game.phase));
const djinnHint = DJINN_WISHES.introHint;

function onIntroDone() {
  introReady.value = true;
}

function onBeginDay() {
  introReady.value = false;
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

watch(() => game.currentDay, () => {
  introReady.value = false;
});
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 20px 28px;
  overflow: hidden;
}
.game-main {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 20px;
  margin-top: 2px;
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
  gap: 10px;
}

.intro-strip {
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  width: 680px;
  max-width: 92vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 20;
}
.bark-strip,
.djinn-hint-strip {
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  width: 680px;
  max-width: 92vw;
  z-index: 22;
}
.hint-card {
  padding: 12px 18px;
  border-radius: 6px;
  text-align: center;
}
.hint-card p {
  margin: 0;
  font-size: 13px;
}
.dialog-fade-enter-active, .dialog-fade-leave-active {
  transition: opacity 400ms ease, transform 400ms ease;
}
.dialog-fade-enter-from, .dialog-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.begin {
  background: var(--gold);
  color: var(--ink);
  padding: 8px 22px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 14px;
}
.begin:hover { background: var(--gold-soft); }

</style>
