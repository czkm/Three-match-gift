<template>
  <div class="ability-bar glass grain">
    <div class="bar-head">
      <h3 class="ink-title">能力</h3>
      <button class="achievement-entry" @click="achievement.openPanel()">
        <span class="entry-icon">🏆</span>
        <span class="entry-text">
          {{ achievement.unlockedCount }} / {{ achievement.totalCount }}
        </span>
      </button>
    </div>

    <!-- Active abilities -->
    <div class="active-list">
      <button
        v-for="ab in game.activeAbilities"
        :key="ab.id"
        class="ab-btn"
        :class="{
          'milk-tea': ab.id === 'milkTeaBarrage',
          disabled: !game.canUseAbility(ab.id),
          pending: game.pendingAbility === ab.id
        }"
        :disabled="!game.canUseAbility(ab.id)"
        :title="ab.desc"
        @click="onTrigger(ab)"
      >
        <span class="ab-icon">{{ ab.icon }}</span>
        <span class="ab-name">{{ ab.name }}</span>
        <span class="ab-uses">
          {{ ab.id === 'milkTeaBarrage'
            ? (game.pigEnergyReady ? '就绪' : `${displayPigEnergy}/${pigEnergyMax}★`)
            : `×${game.abilityUses[ab.id] ?? 0}` }}
        </span>
      </button>
    </div>

    <div class="pig-energy glass">
      <div class="pig-energy-head">
        <span class="pig-energy-icon">🐷</span>
        <div>
          <p class="pig-energy-title ink-title">小猪能量</p>
          <p class="pig-energy-text">星级 {{ displayPigEnergy }} / {{ pigEnergyMax }}</p>
        </div>
      </div>
      <div class="pig-energy-stars" :class="{ charged: pigAwards.length > 0 }">
        <span
          v-for="n in pigEnergyMax"
          :key="`pig-slot-${n}`"
          class="pig-energy-star"
          :class="{ filled: n <= displayPigEnergy, charging: chargingSlot === n }"
        >⭐</span>
      </div>
      <div v-if="pigAwards.length" class="pig-award-layer">
        <span
          v-for="award in pigAwards"
          :key="award.id"
          class="pig-award-star"
          :style="award.style"
        >{{ award.glyph }}</span>
      </div>
    </div>

    <!-- Resource conversion (lilacSeed) inline modal -->
    <div v-if="lilacOpen" class="convert-panel glass">
      <p class="ink-title">将哪种资源变成哪种？</p>
      <div class="dual">
        <div>
          <p class="ink-subtle">从</p>
          <div class="chips">
            <button
              v-for="r in resources"
              :key="`from-${r.id}`"
              class="chip"
              :class="{ active: lilacFrom === r.id }"
              @click="lilacFrom = r.id"
            >
              {{ r.emoji }} {{ r.cn }}
            </button>
          </div>
        </div>
        <div>
          <p class="ink-subtle">到</p>
          <div class="chips">
            <button
              v-for="r in resources"
              :key="`to-${r.id}`"
              class="chip"
              :class="{ active: lilacTo === r.id }"
              :disabled="r.id === lilacFrom"
              @click="lilacTo = r.id"
            >
              {{ r.emoji }} {{ r.cn }}
            </button>
          </div>
        </div>
      </div>
      <div class="actions">
        <button class="apply" :disabled="!lilacReady" @click="applyLilac">
          变身
        </button>
        <button class="cancel" @click="cancelLilac">取消</button>
      </div>
    </div>

    <div v-if="milkTeaOpen" class="convert-panel glass">
      <p class="ink-title">奶茶攻击要收哪种资源？</p>
      <div class="chips">
        <button
          v-for="r in harvestableResources"
          :key="`milk-tea-${r.id}`"
          class="chip"
          :class="{ active: milkTeaTarget === r.id }"
          @click="milkTeaTarget = r.id"
        >
          {{ r.emoji }} {{ r.cn }}
        </button>
      </div>
      <div class="actions">
        <button class="apply" :disabled="!milkTeaTarget" @click="applyMilkTea">
          开喝
        </button>
        <button class="cancel" @click="cancelMilkTea">取消</button>
      </div>
    </div>

    <!-- Passives (info only) -->
    <div v-if="game.passiveAbilities.length" class="passive-list">
      <p class="ink-subtle title">被动</p>
      <div
        v-for="ab in game.passiveAbilities"
        :key="ab.id"
        class="passive"
        :title="ab.desc"
      >
        <span class="ab-icon small">{{ ab.icon }}</span>
        <span class="ab-name small">{{ ab.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { audioManager } from '@/audio/AudioManager'
import EventBus from '@/core/eventBus'
import { useAchievementStore } from '@/stores/achievementStore'
import { useGameStore } from '@/stores/gameStore'
import { ABILITIES, PIG_RATING, RESOURCES, unlockedCharsForDay } from '@/data/content'

const pigEnergyMax = PIG_RATING.energyMax

const props = defineProps({
  /** Reference to GameBoard exposed methods (refresh / convert). */
  boardRef: { type: Object, default: null }
})

const game = useGameStore()
const achievement = useAchievementStore()
const resources = computed(() => {
  const allowed = new Set(unlockedCharsForDay(game.currentDay))
  return RESOURCES.filter(r => allowed.has(r.char))
})
const harvestableResources = computed(() => resources.value)

const lilacOpen = ref(false)
const lilacFrom = ref(null)
const lilacTo = ref(null)
const lilacReady = computed(
  () => lilacFrom.value && lilacTo.value && lilacFrom.value !== lilacTo.value
)
const milkTeaOpen = ref(false)
const milkTeaTarget = ref(null)
const pigAwards = ref([])
const displayPigEnergy = ref(game.pigEnergy || 0)
const chargingSlot = ref(0)
let pigAwardTimer = null
let pigEnergySyncTimer = null
function onTrigger(ab) {
  if (!game.canUseAbility(ab.id)) return

  if (ab.id === 'whiteWolfTidy') {
    props.boardRef?.abilityRefresh?.()
    game.consumeAbility(ab.id)
  } else if (ab.id === 'hearthStew') {
    audioManager.playSFX('decoction', { vol: 0.6 })
    game.recoverSteps(5)
    game.consumeAbility(ab.id)
  } else if (ab.id === 'lilacSeed') {
    lilacOpen.value = true
    lilacFrom.value = null
    lilacTo.value = null
    game.beginTarget(ab.id)
  } else if (ab.id === 'milkTeaBarrage') {
    milkTeaOpen.value = true
    milkTeaTarget.value = null
    game.beginTarget(ab.id)
  } else if (ab.needsTarget) {
    game.beginTarget(ab.id)
  } else {
    game.consumeAbility(ab.id)
  }
}

function applyLilac() {
  if (!lilacReady.value) return
  props.boardRef?.abilityConvertResource?.(lilacFrom.value, lilacTo.value)
  game.consumeAbility('lilacSeed')
  lilacOpen.value = false
}

function cancelLilac() {
  lilacOpen.value = false
  game.cancelTarget()
}

function applyMilkTea() {
  if (!milkTeaTarget.value) return
  const ok = props.boardRef?.abilityHarvestResource?.(milkTeaTarget.value)
  if (!ok) return
  game.consumeAbility('milkTeaBarrage')
  milkTeaOpen.value = false
}

function cancelMilkTea() {
  milkTeaOpen.value = false
  game.cancelTarget()
}

function onPigRatingAwarded(payload = {}) {
  const stars = Math.max(0, Number(payload.stars) || 0)
  if (!stars) return
  displayPigEnergy.value = Math.max(0, Number(payload.fromEnergy) || 0)
  const track = document.querySelector('.pig-energy-track')
  const trackRect = track?.getBoundingClientRect?.()
  const fresh = []
  for (let i = 0; i < stars; i++) {
    const origin = payload.origins?.[i]
    const destX = trackRect ? trackRect.left + trackRect.width * 0.82 : null
    const destY = trackRect ? trackRect.top + trackRect.height / 2 : null
    fresh.push({
      id: `${Date.now()}-${i}`,
      glyph: origin?.glyph || (i % 2 === 0 ? '✨' : '🌟'),
      style: {
        left: origin?.x ? `${origin.x}px` : `${14 + i * 16}%`,
        top: origin?.y ? `${origin.y}px` : `${8 + (i % 2) * 8}px`,
        '--delay': `${(0.08 + i * 0.14).toFixed(2)}s`,
        '--dx': origin && destX != null ? `${Math.round(destX - origin.x)}px` : '120px',
        '--dy': origin && destY != null ? `${Math.round(destY - origin.y)}px` : '30px',
        '--mode': origin ? 'fixed' : 'local'
      }
    })
  }
  pigAwards.value = fresh
  if (pigAwardTimer) clearTimeout(pigAwardTimer)
  if (pigEnergySyncTimer) clearTimeout(pigEnergySyncTimer)
  const targetEnergy = Math.max(displayPigEnergy.value, Number(payload.toEnergy) || 0)
  for (let i = 0; i < stars; i++) {
    setTimeout(() => {
      chargingSlot.value = Math.min(targetEnergy, displayPigEnergy.value + 1)
      displayPigEnergy.value = Math.min(targetEnergy, displayPigEnergy.value + 1)
      setTimeout(() => {
        chargingSlot.value = 0
      }, 220)
    }, 1080 + i * 180)
  }
  pigAwardTimer = setTimeout(() => {
    pigAwards.value = []
    pigAwardTimer = null
  }, 2200)
  pigEnergySyncTimer = setTimeout(() => {
    displayPigEnergy.value = game.pigEnergy
    chargingSlot.value = 0
    pigEnergySyncTimer = null
  }, 1820 + stars * 180)
}

watch(
  () => game.pigEnergy,
  (value) => {
    if (pigEnergySyncTimer || pigAwards.value.length) return
    displayPigEnergy.value = value
  },
  { immediate: true }
)

onMounted(() => {
  EventBus.bind('pigRatingAwarded', onPigRatingAwarded)
})

onBeforeUnmount(() => {
  EventBus.unbind('pigRatingAwarded', onPigRatingAwarded)
  if (pigAwardTimer) clearTimeout(pigAwardTimer)
  if (pigEnergySyncTimer) clearTimeout(pigEnergySyncTimer)
})
</script>

<style scoped>
.ability-bar {
  width: 244px;
  padding: 18px 18px 20px;
  border-radius: var(--radius-md);
  position: relative;
  overflow: visible;
}
h3 {
  margin: 0 0 14px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.bar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.bar-head h3 {
  margin: 0;
}

.achievement-entry {
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--radius-pill);
  background: rgba(255, 252, 244, 0.4);
  border: 1px solid transparent;
  box-shadow:
    inset 0 0 0 1px rgba(180, 152, 104, 0.22),
    inset 0 1px 0 rgba(255, 252, 244, 0.18);
  transition:
    transform 200ms var(--ease-out-expo),
    box-shadow 200ms var(--ease-out-expo),
    background 200ms var(--ease-out-expo);
}

.achievement-entry:hover {
  transform: translateY(-2px);
  background: rgba(255, 252, 244, 0.62);
  box-shadow:
    inset 0 1px 0 rgba(255, 252, 244, 0.28),
    0 8px 16px rgba(24, 16, 10, 0.1);
}

.entry-icon {
  font-size: 15px;
}

.entry-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
}

.active-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pig-energy {
  margin-top: 12px;
  margin-bottom: 12px;
  padding: 12px 12px 10px;
  border-radius: var(--radius-sm);
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 243, 225, 0.48) 0%, rgba(236, 210, 168, 0.18) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(180, 152, 104, 0.22),
    inset 0 1px 0 rgba(255, 252, 244, 0.2);
}

.pig-energy-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.pig-energy-icon {
  font-size: 22px;
}

.pig-energy-title {
  margin: 0;
  font-size: 12px;
}

.pig-energy-text {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--ink-soft);
}

.pig-energy-stars {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding-right: 8px;
}

.pig-energy-stars::after {
  content: '';
  position: absolute;
  top: -8px;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  opacity: 0;
  background: radial-gradient(circle, rgba(255, 244, 196, 0.88), transparent 70%);
}

.pig-energy-stars.charged::after {
  animation: pig-energy-spark 420ms ease-out 1.15s;
}

.pig-energy-star {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  border-radius: 50%;
  color: rgba(148, 118, 82, 0.44);
  background:
    radial-gradient(circle, rgba(106, 74, 44, 0.16), rgba(88, 60, 34, 0.08));
  box-shadow:
    inset 0 0 0 1px rgba(180, 152, 104, 0.16),
    inset 0 1px 0 rgba(255, 244, 222, 0.08);
  transition:
    transform 240ms var(--ease-out-expo),
    color 240ms var(--ease-out-expo),
    box-shadow 240ms var(--ease-out-expo),
    background 240ms var(--ease-out-expo);
}

.pig-energy-star.filled {
  color: #fff0a8;
  background:
    radial-gradient(circle, rgba(255, 231, 122, 0.9), rgba(225, 152, 44, 0.42));
  box-shadow:
    0 0 14px rgba(255, 208, 108, 0.32),
    inset 0 1px 0 rgba(255, 250, 214, 0.42);
  transform: scale(1.04);
}

.pig-energy-star.charging {
  animation: pig-energy-star-pop 260ms var(--ease-out-expo);
}

.pig-award-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.pig-award-star {
  position: fixed;
  font-size: 16px;
  line-height: 1;
  opacity: 0;
  filter: drop-shadow(0 0 10px rgba(255, 222, 150, 0.42));
  animation: pig-award-flight 1.25s cubic-bezier(0.2, 0.82, 0.26, 1) forwards;
  animation-delay: var(--delay);
}

@keyframes pig-award-flight {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.6);
  }
  24% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), var(--dy)) scale(0.9);
  }
}

@keyframes pig-energy-spark {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0;
    transform: scale(1.6);
  }
}

@keyframes pig-energy-star-pop {
  0% {
    transform: scale(0.74);
    filter: brightness(1.2);
  }
  60% {
    transform: scale(1.28);
    filter: brightness(1.34);
  }
  100% {
    transform: scale(1.04);
    filter: brightness(1);
  }
}

.ab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    180deg,
    rgba(255, 252, 246, 0.28) 0%,
    rgba(255, 250, 240, 0.08) 100%
  );
  border: 1px solid transparent;
  transition:
    background 200ms var(--ease-out-expo),
    border-color 200ms var(--ease-out-expo),
    transform 200ms var(--ease-out-expo),
    box-shadow 200ms var(--ease-out-expo);
  font-size: 13px;
  text-align: left;
  box-shadow:
    inset 0 0 0 1px rgba(180, 152, 104, 0.24),
    inset 0 1px 0 rgba(255, 252, 244, 0.2),
    0 4px 10px rgba(24, 16, 10, 0.08);
}
.ab-btn:hover:not(:disabled) {
  background: linear-gradient(
    180deg,
    rgba(255, 252, 246, 0.42) 0%,
    rgba(248, 238, 218, 0.24) 100%
  );
  border-color: rgba(180, 152, 104, 0.42);
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255, 252, 244, 0.3),
    0 12px 20px rgba(24, 16, 10, 0.14);
}
.ab-btn:active:not(:disabled) {
  background: linear-gradient(
    180deg,
    rgba(248, 238, 218, 0.2) 0%,
    rgba(255, 250, 240, 0.06) 100%
  );
  border-color: rgba(180, 152, 104, 0.2);
  transform: translateY(0);
  box-shadow:
    inset 0 1px 0 rgba(255, 252, 244, 0.14),
    0 2px 6px rgba(24, 16, 10, 0.06);
}
.ab-btn.pending {
  background: linear-gradient(
    180deg,
    rgba(176, 148, 201, 0.38) 0%,
    rgba(116, 86, 140, 0.22) 100%
  );
  border-color: rgba(126, 88, 161, 0.72);
  box-shadow:
    inset 0 1px 0 rgba(255, 252, 244, 0.16),
    0 0 14px rgba(176, 148, 201, 0.18);
}
.ab-btn[data-ab='milkTeaBarrage'],
.ab-btn.milk-tea {
  background: linear-gradient(
    180deg,
    rgba(240, 214, 172, 0.42) 0%,
    rgba(191, 126, 72, 0.2) 100%
  );
}
.ab-btn.disabled {
  opacity: 0.45;
}
.ab-icon {
  font-size: 19px;
}
.ab-icon.small {
  font-size: 14px;
}
.ab-name {
  flex: 1;
  font-weight: 600;
}
.ab-name.small {
  font-weight: 500;
  font-size: 12px;
}
.ab-uses {
  font-size: 11px;
  color: var(--ink-faint);
  background: rgba(255, 255, 255, 0.45);
  padding: 1px 6px;
  border-radius: 999px;
  min-width: 38px;
  text-align: center;
}

.passive-list {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(180, 152, 104, 0.22);
}
.passive-list .title {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.1em;
}
.passive {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 0;
  padding: 5px 7px;
  font-size: 12px;
  color: var(--ink-soft);
  border-radius: 10px;
  background: rgba(255, 252, 244, 0.14);
}

.convert-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 12px;
  width: 300px;
  padding: 16px 16px;
  border-radius: var(--radius-sm);
  z-index: 12;
  animation: fade-in 260ms var(--ease-out-expo);
}
.convert-panel p {
  margin: 0 0 6px;
  font-size: 13px;
}
.dual {
  display: flex;
  gap: 10px;
}
.dual > div {
  flex: 1;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.chip {
  background: rgba(180, 152, 104, 0.08);
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid rgba(180, 152, 104, 0.18);
}
.chip.active {
  background: var(--lilac);
  color: var(--paper);
  border-color: var(--magic-1);
}
.chip:disabled {
  opacity: 0.4;
}
.actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.apply,
.cancel {
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
  transition:
    transform 160ms var(--ease-out-expo),
    filter 160ms var(--ease-out-expo),
    box-shadow 160ms var(--ease-out-expo);
}
.apply:hover:not(:disabled),
.cancel:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
}
.apply {
  background: linear-gradient(180deg, var(--gold-soft) 0%, var(--gold) 100%);
  color: var(--ink);
  border: 1px solid rgba(84, 54, 22, 0.34);
}
.apply:disabled {
  background: rgba(208, 168, 87, 0.4);
}
.cancel {
  background: linear-gradient(180deg, #5a4434 0%, #3a2818 100%);
  color: var(--paper);
  border: 1px solid rgba(255, 244, 222, 0.14);
}
</style>
