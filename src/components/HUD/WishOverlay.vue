<template>
  <div class="wish-overlay">
    <div class="veil" />
    <div class="card parchment grain">
      <p class="title ink-title">{{ wish.title }}</p>
      <p class="quote ink-subtle">{{ wish.quote }}</p>

      <Dialog
        v-if="activeLine"
        class="wish-dialog"
        :text="activeLine"
        hint="点击继续"
        @done="onDialogDone"
      />

      <div v-if="showChoices" class="choices">
        <button
          v-for="choice in wish.choices"
          :key="choice.id"
          class="choice"
          @click="onChoose(choice.id)"
        >
          <span class="choice-label">{{ choice.label }}</span>
          <span class="choice-effect ink-subtle">{{ choice.effectLabel }}</span>
        </button>
      </div>

      <div v-if="game.wishResolved" class="resolve-block">
        <p class="resolve-line ink-title">{{ game.wishResolveLine }}</p>
        <button class="continue-btn" @click="onContinue">
          {{ finalStage ? '迎向结局' : '回到棋盘' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import Dialog from './Dialog.vue';
import { useGameStore } from '@/stores/gameStore';

const props = defineProps({
  boardRef: { type: Object, default: null }
});

const game = useGameStore();
const lineIndex = ref(0);
const lineReady = ref(false);
const wish = computed(() => game.currentWish || { title: '', quote: '', lines: [], choices: [] });
const activeLine = computed(() => wish.value.lines?.[lineIndex.value] || '');
const showChoices = computed(() => !game.wishResolved && lineIndex.value >= (wish.value.lines?.length || 0));
const finalStage = computed(() => game.djinnReleased);

watch(() => game.wishStage, () => {
  lineIndex.value = 0;
  lineReady.value = false;
});

function onDialogDone() {
  if (!lineReady.value) {
    lineReady.value = true;
    return;
  }
  if (lineIndex.value < (wish.value.lines?.length || 0) - 1) {
    lineIndex.value++;
    lineReady.value = false;
  } else {
    lineIndex.value = wish.value.lines?.length || 0;
    lineReady.value = false;
  }
}

function onChoose(choiceId) {
  game.resolveWishChoice(choiceId);
}

function onContinue() {
  if (game.pendingWishPhase === 'refreshBoard') {
    props.boardRef?.refreshAfterWish?.();
    game.finishWishStage('playing');
    return;
  }
  if (game.pendingWishReleasedCells?.length) {
    props.boardRef?.releaseWishCells?.(game.pendingWishReleasedCells || []);
  }
  if (finalStage.value || game.pendingWishPhase === 'repairing') {
    game.finishWishStage('repairing');
    return;
  }
  game.finishWishStage('playing');
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
}

.veil {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(48, 30, 24, 0.35), rgba(20, 10, 8, 0.82));
  backdrop-filter: blur(2px);
}

.card {
  position: relative;
  z-index: 2;
  width: min(760px, 92vw);
  padding: 24px 28px;
  border-radius: 10px;
  text-align: center;
}

.title {
  margin: 0 0 8px;
  font-size: 20px;
  letter-spacing: 0.08em;
}

.quote {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.7;
}

.wish-dialog {
  max-width: none;
  text-align: left;
}

.choices {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.choice {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  text-align: left;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.36);
  border: 1px solid rgba(208, 168, 87, 0.45);
  transition: transform 180ms ease, background 180ms ease;
}

.choice:hover {
  transform: translateY(-1px);
  background: rgba(208, 168, 87, 0.2);
}

.choice-label {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}

.choice-effect {
  font-size: 12px;
  line-height: 1.6;
}

.resolve-block {
  margin-top: 18px;
}

.resolve-line {
  margin: 0 0 14px;
  font-size: 17px;
}

.continue-btn {
  background: var(--gold);
  color: var(--ink);
  border-radius: 6px;
  padding: 8px 18px;
  font-weight: 700;
}

.continue-btn:hover {
  background: var(--gold-soft);
}
</style>
