<template>
  <div class="day-end-overlay" @click="onContinue">
    <div class="card parchment grain">
      <p class="moon">🌒</p>
      <p class="line ink-title">{{ game.dayEndLine }}</p>
      <p class="hint ink-subtle">明天继续。步数 +20，进度保留。</p>
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
    radial-gradient(circle at 50% 50%, rgba(40, 28, 18, 0.5), rgba(26, 14, 8, 0.88)),
    radial-gradient(circle at 62% 38%, rgba(176, 148, 201, 0.06), transparent 30%);
  animation: fade-in 500ms var(--ease-out-expo);
  backdrop-filter: blur(2px);
}
.card {
  width: min(380px, 88vw);
  padding: 26px 28px;
  text-align: center;
  border-radius: var(--radius-md);
  box-shadow:
    var(--surface-shadow),
    0 0 0 1px rgba(255, 242, 214, 0.06);
}
.moon { font-size: 44px; margin: 0; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25)); animation: moon-float 3s var(--ease-in-out-sine) infinite; }
@keyframes moon-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
.line { font-size: 18px; margin: 10px 0 8px; }
.hint { font-size: 12px; margin-bottom: 16px; letter-spacing: 0.04em; }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
</style>
