<template>
  <div class="day-end-overlay" @click="onContinue">
    <div class="backdrop-glow" />
    <div class="card glass grain">
      <p class="moon">🌒</p>
      <p class="line ink-title">{{ game.dayEndLine }}</p>
      <p class="hint ink-subtle">明天继续。步数 +20，进度保留。</p>
      <p class="continue-hint ink-subtle">点击任意处继续</p>
    </div>
  </div>
</template>

<script setup>
import { audioManager } from '@/audio/AudioManager';
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();
const emit = defineEmits(['advance']);

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
  background:
    radial-gradient(circle at 50% 50%, rgba(36, 24, 16, 0.56), rgba(22, 12, 6, 0.90)),
    radial-gradient(circle at 62% 38%, rgba(176, 148, 201, 0.04), transparent 30%);
  backdrop-filter: blur(4px);
  animation: overlay-in 600ms var(--ease-out-expo) forwards;
}

.backdrop-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 42%, rgba(212, 172, 92, 0.08), transparent 40%),
    radial-gradient(circle at 50% 55%, rgba(176, 148, 201, 0.06), transparent 36%);
  animation: glow-pulse 4s var(--ease-in-out-sine) infinite;
}

.card {
  width: min(380px, 88vw);
  padding: 28px 30px 24px;
  text-align: center;
  border-radius: var(--radius-md);
  animation: card-enter 700ms var(--ease-out-expo) 200ms both;
}

.moon {
  font-size: 48px;
  margin: 0;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.22));
  animation: moon-float 3.5s var(--ease-in-out-sine) infinite;
}

.line {
  font-size: 18px;
  margin: 12px 0 8px;
  letter-spacing: 0.04em;
}

.hint {
  font-size: 12px;
  margin-bottom: 10px;
  letter-spacing: 0.04em;
}

.continue-hint {
  font-size: 11px;
  letter-spacing: 0.08em;
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
    transform: translateY(16px) scale(0.96);
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

@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes hint-fade {
  from { opacity: 0; }
  to { opacity: 0.6; }
}
</style>
