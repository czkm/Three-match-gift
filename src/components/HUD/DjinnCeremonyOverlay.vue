<template>
  <div class="wish-overlay" @click="onOverlayClick">
    <div class="card" @click.stop>
      <div class="portrait-panel">
        <div class="dual-portrait">
          <img src="/img/animal_icon.png" class="portrait-img timmy" alt="豆狸" />
          <img src="/img/animal_icon2.png" class="portrait-img tommy" alt="粒狸" />
        </div>
        <div class="name-plate">豆狸 &amp; 粒狸</div>
      </div>

      <div class="text-panel">
        <p class="title ink-title">{{ card.title }}</p>
        <p class="quote ink-subtle" v-if="card.quote">{{ card.quote }}</p>

        <div class="dialog-area">
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
        </div>

        <div v-if="readyForAdvance" class="action-row">
          <button class="advance-btn" @click.stop="onAdvance">
            {{ actionLabel }}
          </button>
        </div>
        <div v-else-if="dialogRef?.isDone?.value" class="next-indicator">
          <span class="next-arrow">▶</span><span class="next-arrow">▶</span>
        </div>
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
  align-items: flex-end;
  justify-content: center;
  padding: 0 20px 28px;
  background:
    radial-gradient(circle at 30% 30%, rgba(25, 200, 185, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 70% 20%, rgba(247, 205, 103, 0.1) 0%, transparent 35%),
    linear-gradient(180deg, #f8f8f0 0%, #f7f3df 50%, #e8dfc8 100%);
  animation: fade-in 400ms var(--ease-out-expo);
}

.card {
  width: min(680px, 96vw);
  background: rgb(247, 243, 223);
  border-radius: 24px 24px 0 0;
  display: flex;
  flex-direction: row;
  gap: 0;
  box-shadow:
    0 -4px 12px rgba(107, 92, 67, 0.18),
    0 0 0 1px rgba(255, 242, 214, 0.15);
  animation: card-slide-up 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  overflow: hidden;
}

.portrait-panel {
  flex-shrink: 0;
  width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 12px 16px;
  background: linear-gradient(160deg, rgba(25, 200, 185, 0.04), rgba(245, 195, 28, 0.04));
  border-right: 1px solid rgba(200, 190, 170, 0.3);
  position: relative;
}

.dual-portrait {
  position: relative;
  width: 90px;
  height: 80px;
  margin-bottom: 10px;
}

.portrait-img {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 3px solid #19c8b9;
  box-shadow: 0 2px 0 0 #50B9AB;
  object-fit: cover;
  background: #f0e8d8;
  position: absolute;
}

.portrait-img.timmy {
  left: 0;
  bottom: 0;
  z-index: 2;
}

.portrait-img.tommy {
  right: 0;
  top: 0;
  z-index: 1;
  border-color: #f5c31c;
  box-shadow: 0 2px 0 0 #dba90e;
}

.name-plate {
  padding: 5px 16px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  background: #19c8b9;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 2px 0 0 #50B9AB;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  white-space: nowrap;
}

.text-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 24px 16px 20px;
}

.title {
  margin: 0 0 4px;
  font-size: 18px;
  letter-spacing: 0.08em;
  color: #794f27;
  font-weight: 800;
}

.quote {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.6;
  color: #9f927d;
  font-weight: 500;
}

.dialog-area {
  flex: 1;
  display: flex;
  align-items: flex-start;
}

.wish-dialog {
  max-width: none;
  text-align: left;
  width: 100%;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.advance-btn {
  height: 40px;
  padding: 0 28px;
  background: #19c8b9;
  color: #fff;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 2px solid #50B9AB;
  box-shadow: 0 4px 0 0 #50B9AB;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.advance-btn:hover {
  background: #3dd4c6;
  transform: translateY(-1px);
  box-shadow: 0 5px 0 0 #50B9AB;
}

.advance-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #50B9AB;
}

.next-indicator {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
  margin-top: 10px;
}

.next-arrow {
  font-size: 14px;
  color: #9f927d;
  animation: arrow-pop 1s ease-in-out infinite;
}

.next-arrow:last-child {
  animation-delay: 0.15s;
}

@keyframes arrow-pop {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@keyframes card-slide-up {
  from { opacity: 0; transform: translateY(30px); }
  60%  { opacity: 1; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
