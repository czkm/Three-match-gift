<template>
  <div class="day-header">
    <div class="left">
      <!-- <span class="brand">Corvo Bianco · 白鸦葡萄园</span> -->
      <span class="ink-subtle">
        第 {{ game.currentDay + 1 }} 天 / {{ game.dayCount }}天
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
        <template
          v-if="
            game.phase === 'awakening' ||
            game.phase === 'djinnTransition' ||
            game.djinnReady ||
            game.djinnCeremonyActive
          "
        >
          <span class="ink-subtle">仪式中</span>
          <span class="step-value ritual">{{ game.stepsLeft }} / ∞</span>
        </template>
        <template v-else>
          <span class="ink-subtle" :class="{ revived: zeroStepRecoveryFlash }">
            步数
          </span>
          <span
            class="step-value"
            :class="{
              low: game.stepsLeft <= 5,
              penalized: penaltyFlash,
              boosted: stepBoostFlash,
              revived: zeroStepRecoveryFlash
            }"
          >
            <span v-if="batteryFlash" class="battery-icon">⚡️</span>
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
const batteryFlash = ref(false)
let penaltyTimer = null
let stepBoostTimer = null
let zeroStepRecoveryTimer = null
let batteryFlashTimer = null

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
  if (payload.batteryTrigger) {
    batteryFlash.value = false
    if (batteryFlashTimer) clearTimeout(batteryFlashTimer)
    requestAnimationFrame(() => {
      batteryFlash.value = true
      batteryFlashTimer = setTimeout(() => {
        batteryFlash.value = false
        batteryFlashTimer = null
      }, 1200)
    })
  }
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
  if (batteryFlashTimer) clearTimeout(batteryFlashTimer)
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
  transition:
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    filter 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.building .emoji {
  font-size: 22px;
  filter: drop-shadow(0 1px 2px rgba(114, 93, 66, 0.1));
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
  background: radial-gradient(circle, #f5c31c, #dba90e);
  border-color: #dba90e;
  box-shadow: 0 0 8px rgba(245, 195, 28, 0.5);
}
.step-value {
  font-size: 20px;
  font-weight: 700;
  color: #725d42;
  letter-spacing: 0.06em;
  font-family: 'Nunito', sans-serif;
  transition:
    color 300ms var(--ease-out-expo),
    letter-spacing 300ms var(--ease-out-expo),
    text-shadow 300ms var(--ease-out-expo);
}

.step-value.low {
  color: #e05a5a;
  letter-spacing: 0.1em;
  text-shadow: 0 0 8px rgba(224, 90, 90, 0.22);
  animation: pulse-low-steps 1.4s infinite ease-in-out;
}

.step-value.penalized {
  color: #c94444;
  animation: pig-penalty-flash 900ms ease-out;
}

.step-value.boosted {
  color: #50b9ab;
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

.battery-icon {
  display: inline-block;
  font-size: 16px;
  margin-right: 2px;
  animation: battery-pop 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  filter: drop-shadow(0 0 6px rgba(240, 200, 60, 0.55));
}

@keyframes battery-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  18% {
    transform: scale(1.4);
    opacity: 1;
  }
  35% {
    transform: scale(0.95);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

@keyframes pulse-low-steps {
  0%,
  100% {
    letter-spacing: 0.06em;
    text-shadow: 0 0 0 rgba(224, 90, 90, 0);
    font-weight: 700;
  }
  50% {
    letter-spacing: 0.12em;
    text-shadow: 0 0 10px rgba(224, 90, 90, 0.28);
    font-weight: 800;
  }
}

@keyframes pig-penalty-flash {
  0% {
    letter-spacing: 0.06em;
    text-shadow: 0 0 0 rgba(201, 68, 68, 0);
  }
  22% {
    letter-spacing: 0.14em;
    text-shadow: 0 0 18px rgba(201, 68, 68, 0.5);
  }
  100% {
    letter-spacing: 0.06em;
    text-shadow: 0 0 0 rgba(201, 68, 68, 0);
  }
}

@keyframes step-boost-flash {
  0% {
    letter-spacing: 0.06em;
    text-shadow: 0 0 0 rgba(17, 168, 155, 0);
  }
  22% {
    letter-spacing: 0.14em;
    text-shadow: 0 0 18px rgba(17, 168, 155, 0.46);
  }
  100% {
    letter-spacing: 0.06em;
    text-shadow: 0 0 0 rgba(17, 168, 155, 0);
  }
}

@keyframes step-revive-flash {
  0% {
    letter-spacing: 0.06em;
    text-shadow: 0 0 0 rgba(200, 126, 22, 0);
    font-weight: 700;
  }
  18% {
    letter-spacing: 0.16em;
    text-shadow: 0 0 24px rgba(200, 126, 22, 0.55);
    font-weight: 900;
  }
  38% {
    letter-spacing: 0.1em;
    text-shadow: 0 0 14px rgba(200, 126, 22, 0.36);
    font-weight: 800;
  }
  100% {
    letter-spacing: 0.06em;
    text-shadow: 0 0 0 rgba(200, 126, 22, 0);
    font-weight: 700;
  }
}
</style>
