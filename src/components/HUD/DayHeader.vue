<template>
  <div class="day-header glass grain">
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
      <span
        v-if="game.activePenaltySummary.text"
        class="devil-cost"
        :class="{ urgent: game.activePenaltySummary.maxSteps > 0 }"
      >
        <span class="cost-label">代价</span>
        <span class="cost-text">{{ game.activePenaltySummary.text }}</span>
      </span>
      <span class="steps">
        <template v-if="game.phase === 'awakening' || game.phase === 'djinnTransition' || game.djinnReady || game.djinnCeremonyActive">
          <span class="ink-subtle">仪式中</span>
          <span class="step-value ritual">{{ game.stepsLeft }} / ∞</span>
        </template>
        <template v-else>
          <span class="ink-subtle">步数</span>
          <span class="step-value" :class="{ low: game.stepsLeft <= 5, penalized: penaltyFlash }">
            {{ game.stepsLeft }} / {{ game.effectiveMaxSteps }}
          </span>
        </template>
      </span>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import EventBus from '@/core/eventBus'
import { useGameStore } from '@/stores/gameStore'
const game = useGameStore()
const penaltyFlash = ref(false)
let penaltyTimer = null

function onPigPenalty() {
  penaltyFlash.value = false
  if (penaltyTimer) clearTimeout(penaltyTimer)
  requestAnimationFrame(() => {
    penaltyFlash.value = true
    penaltyTimer = setTimeout(() => {
      penaltyFlash.value = false
      penaltyTimer = null
    }, 900)
  })
}

onMounted(() => {
  EventBus.bind('pigPenalty', onPigPenalty)
})

onBeforeUnmount(() => {
  EventBus.unbind('pigPenalty', onPigPenalty)
  if (penaltyTimer) clearTimeout(penaltyTimer)
})
</script>

<style scoped>
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 22px;
  border-radius: var(--radius-md);
  width: 600px;
  max-width: 96vw;
  margin: 0 auto 14px;
}
.left,
.middle,
.right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.right {
  justify-content: flex-end;
}
.middle {
  flex: 1;
  justify-content: center;
}
.brand {
  font-weight: 700;
  font-size: 12px;
  color: var(--ink);
  display: block;
  letter-spacing: 0.14em;
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
  font-size: 17px;
  padding: 5px 14px;
  border-radius: var(--radius-pill);
  background: rgba(255, 252, 244, 0.36);
  box-shadow: inset 0 0 0 1px rgba(180, 152, 104, 0.18);
  transition:
    background 240ms var(--ease-out-expo),
    box-shadow 240ms var(--ease-out-expo);
}
.building .emoji {
  font-size: 22px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}
.steps {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  padding-left: 12px;
  border-left: 1px solid rgba(180, 152, 104, 0.22);
}

.devil-cost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  background:
    linear-gradient(180deg, rgba(74, 20, 22, 0.14), rgba(122, 24, 28, 0.2));
  border: 1px solid rgba(148, 36, 42, 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 228, 228, 0.08),
    0 6px 12px rgba(44, 18, 20, 0.08);
}

.devil-cost.urgent {
  background:
    linear-gradient(180deg, rgba(74, 16, 22, 0.22), rgba(138, 24, 34, 0.26));
  border-color: rgba(168, 42, 50, 0.3);
}

.cost-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9b4c4c;
}

.cost-text {
  font-size: 12px;
  font-weight: 700;
  color: #7e1f28;
  letter-spacing: 0.04em;
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
  font-size: 20px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.06em;
  transition:
    color 300ms var(--ease-out-expo),
    transform 300ms var(--ease-out-expo);
}
.step-value.low {
  color: #b0482e;
  animation: pulse-low-steps 1.4s infinite var(--ease-in-out-sine);
}

.step-value.penalized {
  color: #b01212;
  animation: pig-penalty-flash 900ms var(--ease-out-expo);
}

.step-value.ritual {
  color: #9a6a1c;
}

@keyframes pulse-low-steps {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
    text-shadow: 0 0 0 rgba(176, 72, 46, 0);
  }
  50% {
    transform: scale(1.06);
    opacity: 0.85;
    text-shadow: 0 0 8px rgba(176, 72, 46, 0.25);
  }
}

@keyframes pig-penalty-flash {
  0% {
    transform: scale(1);
    text-shadow: 0 0 0 rgba(176, 18, 18, 0);
  }
  22% {
    transform: scale(1.16);
    text-shadow: 0 0 16px rgba(176, 18, 18, 0.45);
  }
  100% {
    transform: scale(1);
    text-shadow: 0 0 0 rgba(176, 18, 18, 0);
  }
}
</style>
