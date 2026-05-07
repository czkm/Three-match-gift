<template>
  <div class="day-header parchment grain">
    <div class="left">
      <span class="brand">Corvo Bianco · 白鸦葡萄园</span>
      <span class="ink-subtle">
        第 {{ game.currentDay + 1 }} 天 / {{ game.dayCount }}
      </span>
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
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
const game = useGameStore()
</script>

<style scoped>
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-radius: 12px;
  width: 580px;
  margin: 0 auto 14px;
  box-shadow: var(--surface-shadow);
}
.left,
.middle,
.right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.middle {
  flex: 1;
  justify-content: center;
}
.brand {
  font-weight: 700;
  font-size: 13px;
  color: var(--ink);
  display: block;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.left {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.building {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 248, 229, 0.24);
  box-shadow: inset 0 0 0 1px rgba(89, 58, 28, 0.12);
}
.building .emoji {
  font-size: 24px;
}
.steps {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  padding-left: 12px;
  border-left: 1px solid rgba(97, 68, 38, 0.18);
}

.djinn-progress {
  display: flex;
  gap: 6px;
  margin-right: 14px;
  align-items: center;
}
.boss-state {
  margin-right: 4px;
  font-size: 12px;
}
.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: rgba(84, 60, 34, 0.3);
  box-shadow: inset 0 0 0 1px rgba(208, 168, 87, 0.24);
}
.dot.lit {
  background: radial-gradient(
    circle,
    rgba(255, 238, 182, 0.96),
    rgba(212, 168, 87, 0.92)
  );
  box-shadow: 0 0 12px rgba(212, 168, 87, 0.7);
}
.step-value {
  font-size: 19px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.08em;
  transition: color 200ms ease;
}
.step-value.low {
  color: var(--clay-2);
  animation: pulse-low-steps 1.5s infinite ease-in-out;
}

@keyframes pulse-low-steps {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}
</style>
