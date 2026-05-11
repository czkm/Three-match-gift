<template>
  <div class="wish-overlay" @click="onOverlayClick">
    <div class="veil" />
    <div class="card glass grain">
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
import { audioManager } from '@/audio/AudioManager';
import Dialog from './Dialog.vue';
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();
const lineIndex = ref(0);
const lineReady = ref(false);
const dialogRef = ref(null);
const card = computed(() => game.currentDjinnCard || { title: '', quote: '', lines: [] });
const activeLine = computed(() => card.value.lines?.[lineIndex.value] || '');
const readyForAdvance = computed(() => lineReady.value && lineIndex.value >= (card.value.lines?.length || 0));
const actionLabel = computed(() => (
  game.djinnCardMode === 'intro' ? '进入仪式棋盘' : (game.djinnStage >= 3 ? '迎向生日夜' : '继续下一愿')
));
const actionHint = computed(() => (
  game.djinnCardMode === 'intro' ? '点击进入仪式棋盘' : '点击继续'
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
  audioManager.playSFX('pageflip', { vol: 0.4 });
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

</style>
