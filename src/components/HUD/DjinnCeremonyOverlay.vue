<template>
  <div class="wish-overlay" @click="onOverlayClick">
    <div class="card">
      <p class="title ink-title">{{ card.title }}</p>
      <p class="quote ink-subtle">{{ card.quote }}</p>

      <Dialog
        v-if="activeLine"
        ref="dialogRef"
        class="wish-dialog"
        :text="activeLine"
        :hint="readyForAdvance ? actionHint : COMMON_COPY.continueHint"
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
import { COMMON_COPY, GAMEPLAY_COPY } from '@/data/copy';
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
  game.djinnCardMode === 'intro'
    ? GAMEPLAY_COPY.djinn.actionLabels.enterBoard
    : (game.djinnStage >= 3 ? GAMEPLAY_COPY.djinn.actionLabels.towardBirthday : GAMEPLAY_COPY.djinn.actionLabels.nextWish)
));
const actionHint = computed(() => (
  game.djinnCardMode === 'intro' ? GAMEPLAY_COPY.djinn.actionHints.enterBoard : COMMON_COPY.continueHint
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
  background: rgba(114, 93, 66, 0.45);
  backdrop-filter: blur(2px);
  animation: fade-in 400ms var(--ease-out-expo);
}

.card {
  clip-path: url(#animal-modal-clip);
  background: rgb(247, 243, 223);
  position: relative;
  z-index: 2;
  width: min(760px, 92vw);
  padding: 40px 36px 32px;
  text-align: center;
  color: #725d42;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  box-shadow: 0 4px 10px rgba(107, 92, 67, 0.42);
  animation: card-bounce-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.title {
  margin: 0 0 8px;
  font-size: 21px;
  letter-spacing: 0.1em;
  color: #794f27;
  font-weight: 800;
}

.quote {
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.75;
  color: #9f927d;
  font-weight: 500;
}

.wish-dialog {
  max-width: none;
  text-align: left;
}

.action-block {
  margin-top: 20px;
}

.advance-btn {
  height: 45px;
  padding: 0 28px;
  border-radius: 50px;
  background: #f5c31c;
  color: #725d42;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 2px solid #dba90e;
  box-shadow: 0 5px 0 0 #dba90e;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.advance-btn:hover {
  transform: translateY(-1px);
  background: #f7d04a;
  box-shadow: 0 6px 0 0 #dba90e;
}

.advance-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #dba90e;
}

@keyframes card-bounce-in {
  0%   { opacity: 0; transform: scale(0.88) translateY(18px); }
  60%  { opacity: 1; transform: scale(1.03) translateY(-4px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

</style>
