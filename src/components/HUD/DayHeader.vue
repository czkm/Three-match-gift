<template>
  <div class="day-header">
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
          <span class="ink-subtle" :class="{ revived: zeroStepRecoveryFlash }">步数</span>
          <span class="step-value" :class="{ low: game.stepsLeft <= 5, penalized: penaltyFlash, boosted: stepBoostFlash, revived: zeroStepRecoveryFlash }">
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
const stepBoostFlash = ref(false)
const zeroStepRecoveryFlash = ref(false)
let penaltyTimer = null
let stepBoostTimer = null
let zeroStepRecoveryTimer = null

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

function onItemEffectTriggered(payload = {}) {
  if (!payload.stepsGained) return
  const isZeroStepRecovery = payload.trigger === 'zeroStepRecovery'
  if (isZeroStepRecovery) {
    zeroStepRecoveryFlash.value = false
    if (zeroStepRecoveryTimer) clearTimeout(zeroStepRecoveryTimer)
  }
  stepBoostFlash.value = false
  if (stepBoostTimer) clearTimeout(stepBoostTimer)
  requestAnimationFrame(() => {
    stepBoostFlash.value = true
    stepBoostTimer = setTimeout(() => {
      stepBoostFlash.value = false
      stepBoostTimer = null
    }, 900)
    if (isZeroStepRecovery) {
      zeroStepRecoveryFlash.value = true
      zeroStepRecoveryTimer = setTimeout(() => {
        zeroStepRecoveryFlash.value = false
        zeroStepRecoveryTimer = null
      }, 1500)
    }
  })
}

onMounted(() => {
  EventBus.bind('pigPenalty', onPigPenalty)
  EventBus.bind('itemEffectTriggered', onItemEffectTriggered)
})

onBeforeUnmount(() => {
  EventBus.unbind('pigPenalty', onPigPenalty)
  EventBus.unbind('itemEffectTriggered', onItemEffectTriggered)
  if (penaltyTimer) clearTimeout(penaltyTimer)
  if (stepBoostTimer) clearTimeout(stepBoostTimer)
  if (zeroStepRecoveryTimer) clearTimeout(zeroStepRecoveryTimer)
})
</script>

<style scoped>
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 22px;
  border-radius: 16px;
  width: 600px;
  max-width: 96vw;
  margin: 0 auto 14px;
  background: rgb(247, 243, 223);
  border: 2px solid #d4c9b4;
  box-shadow: 0 3px 0 0 #d4c9b4;
  color: #725d42;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
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
  color: #794f27;
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
  border-radius: 50px;
  background: #f8f8f0;
  border: 2px solid #d4c9b4;
  box-shadow: 0 3px 0 0 #d4c9b4;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.building .emoji {
  font-size: 22px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.12));
}
.steps {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  padding-left: 12px;
  border-left: 2px solid #eae4d0;
}

.devil-cost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: 50px;
  background: rgba(224, 90, 90, 0.1);
  border: 2px solid rgba(224, 90, 90, 0.25);
  box-shadow: 0 3px 0 0 rgba(200, 70, 70, 0.3);
}

.devil-cost.urgent {
  background: rgba(224, 90, 90, 0.16);
  border-color: rgba(224, 90, 90, 0.4);
}

.cost-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #e05a5a;
}

.cost-text {
  font-size: 12px;
  font-weight: 700;
  color: #c94444;
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
  background: #eae4d0;
  border: 2px solid #d4c9b4;
}
.dot.lit {
  background: radial-gradient(circle, #ffcc00, #e0b800);
  border-color: #c9a800;
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.5);
}
.step-value {
  font-size: 20px;
  font-weight: 700;
  color: #725d42;
  letter-spacing: 0.06em;
  font-family: 'Nunito', sans-serif;
  transition: color 300ms var(--ease-out-expo), transform 300ms var(--ease-out-expo);
}
.step-value.low {
  color: #e05a5a;
  animation: pulse-low-steps 1.4s infinite ease-in-out;
}

.step-value.penalized {
  color: #c94444;
  animation: pig-penalty-flash 900ms ease-out;
}

.step-value.boosted {
  color: #11a89b;
  animation: step-boost-flash 900ms ease-out;
}

.ink-subtle.revived,
.step-value.revived {
  color: #c87e16;
}

.step-value.revived {
  animation: step-revive-flash 1500ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.step-value.ritual {
  color: #19c8b9;
}

@keyframes pulse-low-steps {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
    text-shadow: 0 0 0 rgba(224, 90, 90, 0);
  }
  50% {
    transform: scale(1.06);
    opacity: 0.85;
    text-shadow: 0 0 8px rgba(224, 90, 90, 0.25);
  }
}

@keyframes pig-penalty-flash {
  0% {
    transform: scale(1);
    text-shadow: 0 0 0 rgba(201, 68, 68, 0);
  }
  22% {
    transform: scale(1.16);
    text-shadow: 0 0 16px rgba(201, 68, 68, 0.45);
  }
  100% {
    transform: scale(1);
    text-shadow: 0 0 0 rgba(201, 68, 68, 0);
  }
}

@keyframes step-boost-flash {
  0% {
    transform: scale(1);
    text-shadow: 0 0 0 rgba(17, 168, 155, 0);
  }
  22% {
    transform: scale(1.16);
    text-shadow: 0 0 16px rgba(17, 168, 155, 0.42);
  }
  100% {
    transform: scale(1);
    text-shadow: 0 0 0 rgba(17, 168, 155, 0);
  }
}

@keyframes step-revive-flash {
  0% {
    transform: scale(1);
    text-shadow: 0 0 0 rgba(200, 126, 22, 0);
    filter: saturate(1);
  }
  18% {
    transform: scale(1.24);
    text-shadow: 0 0 24px rgba(200, 126, 22, 0.55);
    filter: saturate(1.25);
  }
  38% {
    transform: scale(1.08);
    text-shadow: 0 0 12px rgba(200, 126, 22, 0.34);
  }
  100% {
    transform: scale(1);
    text-shadow: 0 0 0 rgba(200, 126, 22, 0);
    filter: saturate(1);
  }
}
</style>
