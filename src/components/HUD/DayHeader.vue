<template>
  <div class="day-header parchment grain">
    <div class="left">
      <span class="brand">Corvo Bianco · 白鸦葡萄园</span>
      <span class="ink-subtle">第 {{ game.currentDay + 1 }} 天 / {{ game.dayCount }}</span>
    </div>
    <div class="middle">
      <span class="building">
        <span class="emoji">{{ game.today?.building.emoji }}</span>
        <span class="ink-title">{{ game.today?.building.cn }}</span>
        <span class="ink-subtle">{{ game.today?.building.en }}</span>
      </span>
    </div>
    <div class="right">
      <span class="steps">
        <span class="ink-subtle">步数</span>
        <span class="step-value" :class="{ low: game.stepsLeft <= 5 }">
          {{ game.stepsLeft }} / 20
        </span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '@/stores/gameStore';
const game = useGameStore();
</script>

<style scoped>
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 18px;
  border-radius: 6px;
  width: 540px;
  margin: 0 auto 12px;
}
.left, .middle, .right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.middle { flex: 1; justify-content: center; }
.brand {
  font-weight: 700;
  font-size: 14px;
  color: var(--ink);
  display: block;
}
.left { flex-direction: column; align-items: flex-start; gap: 2px; }
.building { display: flex; align-items: center; gap: 8px; font-size: 18px; }
.building .emoji { font-size: 24px; }
.steps {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.step-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.05em;
  transition: color 200ms ease;
}
.step-value.low { color: var(--clay-2); }
</style>
