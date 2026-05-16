<template>
  <div class="day-end-overlay" @click="onContinue">
    <div class="card">
      <p class="moon">🌒</p>
      <p class="line ink-title">{{ game.dayEndLine }}</p>
      <p class="hint ink-subtle">{{ restHint }}</p>
      <p class="continue-hint ink-subtle">{{ HUD_COPY.dayEnd.continueHint }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { audioManager } from '@/audio/AudioManager';
import { HUD_COPY } from '@/data/copy';
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();
const emit = defineEmits(['advance']);
const restHint = computed(() => HUD_COPY.dayEnd.formatRestHint(game.effectiveMaxSteps));

function onContinue() {
  audioManager.playSFX('pageflip', { vol: 0.4 });
  game.advanceFromDayEnd();
  emit('advance');
}
</script>

<style scoped>
.day-end-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(114, 93, 66, 0.45);
  backdrop-filter: blur(2px);
  animation: overlay-in 400ms var(--ease-out-expo) forwards;
}

.card {
  clip-path: url(#animal-modal-clip);
  background: rgb(247, 243, 223);
  width: min(380px, 88vw);
  padding: 40px 36px 32px;
  text-align: center;
  color: #725d42;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  box-shadow: 0 4px 10px rgba(107, 92, 67, 0.42);
  animation: card-enter 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms both;
}

.moon {
  font-size: 48px;
  margin: 0;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.14));
  animation: moon-float 3.5s ease-in-out infinite;
}

.line {
  font-size: 18px;
  margin: 12px 0 8px;
  letter-spacing: 0.04em;
  color: #794f27;
}

.hint {
  font-size: 12px;
  margin-bottom: 10px;
  letter-spacing: 0.04em;
  color: #9f927d;
}

.continue-hint {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #9f927d;
  opacity: 0;
  animation: hint-fade 1.2s ease 1.5s forwards;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.92);
  }
  60% {
    opacity: 1;
    transform: translateY(-4px) scale(1.02);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes moon-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes hint-fade {
  from { opacity: 0; }
  to { opacity: 0.6; }
}
</style>
