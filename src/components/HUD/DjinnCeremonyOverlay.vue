<template>
  <div class="wish-overlay" @click="onOverlayClick">
    <div class="veil" />
    <div class="card parchment grain">
      <div v-if="showWakeStage" class="wake-stage" aria-hidden="true">
        <span class="wake-ring ring-a" />
        <span class="wake-ring ring-b" />
        <span class="wake-glyph">🧞</span>
        <span class="wake-z z-a">💤</span>
        <span class="wake-z z-b">💤</span>
        <span class="wake-spark spark-a">✦</span>
        <span class="wake-spark spark-b">✦</span>
        <span class="wake-spark spark-c">✦</span>
      </div>

      <p class="title ink-title">{{ card.title }}</p>
      <p class="quote ink-subtle">{{ card.quote }}</p>

      <Dialog
        v-if="activeLine"
        ref="dialogRef"
        class="wish-dialog"
        :text="activeLine"
        :hint="readyForAdvance ? actionHint : '点击继续'"
        @done="onDialogDone"
        @skip="onOverlayClick"
        @ready="onLineReady"
      />

      <div v-if="readyForAdvance" class="action-block">
        <button class="advance-btn" @click.stop="onAdvance">
          {{ actionLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import Dialog from './Dialog.vue';
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();
const lineIndex = ref(0);
const lineReady = ref(false);
const dialogRef = ref(null);
const card = computed(() => game.currentDjinnCard || { title: '', quote: '', lines: [] });
const activeLine = computed(() => card.value.lines?.[lineIndex.value] || '');
const readyForAdvance = computed(() => lineReady.value && lineIndex.value >= (card.value.lines?.length || 0));
const showWakeStage = computed(() => game.djinnCardMode === 'wake');
const actionLabel = computed(() => (
  game.djinnCardMode === 'wake'
    ? '唤醒迪精'
    : (game.djinnCardMode === 'intro' ? '进入仪式棋盘' : (game.djinnStage >= 3 ? '迎向生日夜' : '继续下一愿'))
));
const actionHint = computed(() => (
  game.djinnCardMode === 'wake'
    ? '点击唤醒迪精'
    : (game.djinnCardMode === 'intro' ? '点击进入仪式棋盘' : '点击继续')
));

watch(() => game.djinnCardNonce, () => {
  lineIndex.value = 0;
  lineReady.value = false;
});

function onDialogDone() {
  if (lineIndex.value < (card.value.lines?.length || 0) - 1) {
    lineIndex.value++;
    lineReady.value = false;
  } else {
    lineIndex.value = card.value.lines?.length || 0;
    lineReady.value = true;
  }
}

function onLineReady() {
  lineReady.value = true;
}

function onAdvance() {
  if (game.djinnCardMode === 'wake') {
    game.finishDjinnWake();
    return;
  }
  if (game.djinnCardMode === 'intro') {
    game.beginDjinnBoardStage();
    return;
  }
  game.finishDjinnResolve();
}

function onOverlayClick() {
  if (readyForAdvance.value) {
    onAdvance();
    return;
  }
  if (!dialogRef.value?.isDone?.value) {
    dialogRef.value?.skipToEnd?.();
    return;
  }
  onDialogDone();
}
</script>

<style scoped>
.wish-overlay {
  position: absolute;
  inset: 0;
  z-index: 45;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fade-in 400ms var(--ease-out-expo);
}

.veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 46%, rgba(214, 182, 110, 0.16), transparent 30%),
    radial-gradient(circle at 34% 62%, rgba(176, 148, 201, 0.08), transparent 35%),
    radial-gradient(circle at 50% 50%, rgba(48, 30, 24, 0.4), rgba(20, 10, 8, 0.85));
  backdrop-filter: blur(3px);
}

.card {
  position: relative;
  z-index: 2;
  width: min(760px, 92vw);
  padding: 28px 32px;
  border-radius: var(--radius-md);
  text-align: center;
  box-shadow:
    var(--surface-shadow),
    0 0 0 1px rgba(255, 242, 214, 0.08),
    inset 0 1px 0 rgba(255, 248, 230, 0.3);
}

.wake-stage {
  position: relative;
  height: 136px;
  margin: -6px 0 14px;
  pointer-events: none;
  overflow: hidden;
}

.wake-ring,
.wake-glyph,
.wake-z,
.wake-spark {
  position: absolute;
}

.wake-ring {
  left: 50%;
  top: 52%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.ring-a {
  width: 112px;
  height: 112px;
  border: 1px solid rgba(240, 213, 107, 0.26);
  box-shadow: 0 0 24px rgba(240, 213, 107, 0.18);
  animation: wake-ring-a 2.4s ease-out infinite;
}

.ring-b {
  width: 154px;
  height: 154px;
  border: 1px solid rgba(190, 154, 232, 0.18);
  box-shadow: 0 0 28px rgba(190, 154, 232, 0.14);
  animation: wake-ring-b 2.4s ease-out infinite;
}

.wake-glyph {
  left: 50%;
  top: 52%;
  font-size: 64px;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 6px 18px rgba(240, 213, 107, 0.28));
  animation: wake-glyph 2.4s ease-in-out infinite;
}

.wake-z {
  font-size: 20px;
  opacity: 0;
  filter: drop-shadow(0 2px 8px rgba(24, 18, 12, 0.24));
}

.z-a {
  left: calc(50% + 26px);
  top: 26px;
  animation: wake-z-a 2.4s ease-out infinite;
}

.z-b {
  left: calc(50% + 48px);
  top: 14px;
  animation: wake-z-b 2.4s ease-out infinite;
}

.wake-spark {
  color: rgba(255, 236, 180, 0.92);
  text-shadow: 0 0 12px rgba(240, 213, 107, 0.28);
}

.spark-a {
  left: calc(50% - 82px);
  top: 42px;
  animation: wake-spark 1.8s ease-in-out infinite;
}

.spark-b {
  left: calc(50% + 76px);
  top: 68px;
  animation: wake-spark 1.8s ease-in-out 220ms infinite;
}

.spark-c {
  left: calc(50% - 12px);
  top: 8px;
  animation: wake-spark 1.8s ease-in-out 420ms infinite;
}

.title {
  margin: 0 0 8px;
  font-size: 21px;
  letter-spacing: 0.1em;
}

.quote {
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--ink-soft);
}

.wish-dialog {
  max-width: none;
  text-align: left;
}

.action-block {
  margin-top: 20px;
}

.advance-btn {
  padding: 10px 24px;
  border-radius: var(--radius-pill);
  background: linear-gradient(180deg, rgba(244, 216, 154, 0.96), rgba(208, 168, 87, 0.98));
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.06em;
  border: 1px solid rgba(108, 72, 34, 0.28);
  box-shadow:
    0 10px 24px rgba(42, 24, 18, 0.18),
    inset 0 1px 0 rgba(255, 248, 230, 0.35);
  transition: transform 200ms var(--ease-out-expo), filter 200ms var(--ease-out-expo), box-shadow 200ms var(--ease-out-expo);
}

.advance-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
  box-shadow:
    0 16px 32px rgba(42, 24, 18, 0.22),
    inset 0 1px 0 rgba(255, 248, 230, 0.4);
}
.advance-btn:active {
  transform: translateY(0);
}

@keyframes wake-glyph {
  0%, 100% { transform: translate(-50%, -50%) scale(0.96); opacity: 0.84; }
  50% { transform: translate(-50%, -54%) scale(1.03); opacity: 1; }
}

@keyframes wake-ring-a {
  0% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.18; }
  55% { opacity: 0.46; }
  100% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.08; }
}

@keyframes wake-ring-b {
  0% { transform: translate(-50%, -50%) scale(0.84); opacity: 0.08; }
  60% { opacity: 0.28; }
  100% { transform: translate(-50%, -50%) scale(1.02); opacity: 0.04; }
}

@keyframes wake-z-a {
  0% { transform: translate3d(0, 10px, 0) scale(0.9); opacity: 0.7; }
  70% { opacity: 0.22; }
  100% { transform: translate3d(10px, -10px, 0) scale(1.08); opacity: 0; }
}

@keyframes wake-z-b {
  0%, 18% { transform: translate3d(0, 10px, 0) scale(0.88); opacity: 0; }
  34% { opacity: 0.72; }
  100% { transform: translate3d(10px, -12px, 0) scale(1.08); opacity: 0; }
}

@keyframes wake-spark {
  0%, 100% { transform: scale(0.82); opacity: 0.24; }
  50% { transform: scale(1.08); opacity: 0.86; }
}
</style>
