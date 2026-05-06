<template>
  <div class="day-end-overlay">
    <div class="card parchment grain">
      <p class="moon">🌒</p>
      <p class="line ink-title">{{ game.dayEndLine }}</p>
      <p class="hint ink-subtle">明天继续。步数 +20，进度保留。</p>
      <button class="advance" @click="onContinue">继续到次日清晨</button>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();
const emit = defineEmits(['advance']);

function onContinue() {
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
  background: radial-gradient(circle at 50% 50%, rgba(40, 28, 18, 0.45), rgba(26, 14, 8, 0.85));
  animation: fade-in 400ms ease;
  backdrop-filter: blur(1px);
}
.card {
  width: 360px;
  padding: 22px 24px;
  text-align: center;
  border-radius: 8px;
}
.moon { font-size: 40px; margin: 0; }
.line { font-size: 18px; margin: 8px 0 6px; }
.hint { font-size: 12px; margin-bottom: 14px; }
.advance {
  background: var(--gold);
  color: var(--ink);
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
}
.advance:hover { background: var(--gold-soft); }

@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
</style>
