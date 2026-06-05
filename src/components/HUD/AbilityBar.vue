<template>
  <div class="ability-bar">
    <div class="bar-head">
      <h3 class="ink-title">{{ ABILITY_BAR_COPY.title }}</h3>
      <button class="achievement-entry" @click="achievement.openPanel()">
        <span class="entry-icon">🍃</span>
        <span class="entry-text">
          哩程 {{ achievement.unlockedCount }} / {{ achievement.totalCount }}
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
        @click="onAbilityClick(ab)"
      >
        <img
          v-if="!failedSkillIcons[ab.id]"
          :src="skillImg(ab.id)"
          :alt="ab.name"
          class="ab-icon-img"
          @error="failedSkillIcons[ab.id] = true"
        />
        <span v-else class="ab-icon">{{ ab.icon }}</span>
        <span class="ab-name">{{ ab.name }}</span>
        <span class="ab-uses">
          {{
            ab.id === 'milkTeaBarrage'
              ? game.pigEnergyReady
                ? COMMON_COPY.ready
                : `${displayPigEnergy}/${pigEnergyMax}★`
              : `×${game.abilityUses[ab.id] ?? 0}`
          }}
        </span>
      </button>
    </div>

    <!-- Ability message box — shows hovered ability description -->
    <Transition name="msg-fade">
      <div v-if="hoverAbility" class="ability-msg-box">
        <p class="msg-name">
          <img
            v-if="hoverAbility && !failedSkillIcons[hoverAbility.id]"
            :src="skillImg(hoverAbility.id)"
            :alt="hoverAbility.name"
            class="msg-icon-img"
            @error="failedSkillIcons[hoverAbility.id] = true"
          />
          <span v-else class="msg-icon">{{ hoverAbility.icon }}</span>
          {{ hoverAbility.name }}
        </p>
        <p class="msg-desc">{{ hoverAbility.desc }}</p>
        <p v-if="hoverAbility.quote" class="msg-quote">
          {{ hoverAbility.quote }}
        </p>
      </div>
    </Transition>

    <div class="pig-energy">
      <div class="pig-energy-head">
        <span class="pig-energy-icon">🐷</span>
        <div>
          <p class="pig-energy-title ink-title">
            {{ ABILITY_BAR_COPY.pigEnergyTitle }}
          </p>
          <p class="pig-energy-text">
            {{
              ABILITY_BAR_COPY.formatPigEnergy(displayPigEnergy, pigEnergyMax)
            }}
          </p>
        </div>
      </div>
      <div class="pig-energy-stars" :class="{ charged: pigAwards.length > 0 }">
        <span
          v-for="n in pigEnergyMax"
          :key="`pig-slot-${n}`"
          class="pig-energy-star"
          :class="{
            filled: n <= displayPigEnergy,
            charging: chargingSlot === n
          }"
        >
          ⭐
        </span>
      </div>
      <div v-if="pigAwards.length" class="pig-award-layer">
        <span
          v-for="award in pigAwards"
          :key="award.id"
          class="pig-award-star"
          :style="award.style"
        >
          {{ award.glyph }}
        </span>
      </div>
    </div>

    <!-- Resource conversion (lilacSeed) inline modal -->
    <div v-if="lilacOpen" class="convert-panel">
      <p class="ink-title">{{ ABILITY_BAR_COPY.lilacPrompt }}</p>
      <div class="dual">
        <div>
          <p class="ink-subtle">{{ ABILITY_BAR_COPY.from }}</p>
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
          <p class="ink-subtle">{{ ABILITY_BAR_COPY.to }}</p>
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
          {{ ABILITY_BAR_COPY.lilacApply }}
        </button>
        <button class="cancel" @click="cancelLilac">
          {{ COMMON_COPY.cancel }}
        </button>
      </div>
    </div>

    <div v-if="milkTeaOpen" class="convert-panel">
      <p class="ink-title">{{ ABILITY_BAR_COPY.milkTeaPrompt }}</p>
      <div class="chips">
        <button
          v-for="r in harvestableResources"
          :key="`milk-tea-${r.id}`"
          class="chip"
          :class="{ active: milkTeaTarget === r.id }"
          @click="milkTeaTarget = r.id"
        >
          <img
            :src="r.chessImg"
            class="milk-tea-chip-img"
            :alt="r.cn"
          />
        </button>
      </div>
      <div class="actions">
        <button class="apply" :disabled="!milkTeaTarget" @click="applyMilkTea">
          {{ ABILITY_BAR_COPY.milkTeaApply }}
        </button>
        <button class="cancel" @click="cancelMilkTea">
          {{ COMMON_COPY.cancel }}
        </button>
      </div>
    </div>

    <!-- Passives (info only) -->
    <div v-if="game.passiveAbilities.length" class="passive-list">
      <p class="ink-subtle title">{{ ABILITY_BAR_COPY.passiveTitle }}</p>
      <div
        v-for="ab in game.passiveAbilities"
        :key="ab.id"
        class="passive"
        @click="hoverAbility = ab"
      >
        <img
          v-if="!failedSkillIcons[ab.id]"
          :src="skillImg(ab.id)"
          :alt="ab.name"
          class="ab-icon-img small"
          @error="failedSkillIcons[ab.id] = true"
        />
        <span v-else class="ab-icon small">{{ ab.icon }}</span>
        <span class="ab-name small">{{ ab.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { audioManager } from '@/audio/AudioManager'
import { img } from '@/utils/assets'
import { ABILITY_BAR_COPY, COMMON_COPY } from '@/data/copy'
import EventBus from '@/core/eventBus'
import { useAchievementStore } from '@/stores/achievementStore'
import { useGameStore } from '@/stores/gameStore'

const skillImg = (id) => img(`img/skills/${id}.png`)
import {
  ABILITIES,
  PIG_RATING,
  RESOURCES,
  unlockedCharsForDay
} from '@/data/content'

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
const hoverAbility = ref(null)
const failedSkillIcons = ref({})
const milkTeaOpen = ref(false)
const milkTeaTarget = ref(null)
const pigAwards = ref([])
const displayPigEnergy = ref(game.pigEnergy || 0)
const chargingSlot = ref(0)
let pigAwardTimer = null
let pigEnergySyncTimer = null
function onAbilityClick(ab) {
  // Toggle: click same ability again to dismiss the message box
  if (hoverAbility.value?.id === ab.id) {
    hoverAbility.value = null
    return
  }
  hoverAbility.value = ab

  // Only trigger the ability if it can be used
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
        '--dx':
          origin && destX != null
            ? `${Math.round(destX - origin.x)}px`
            : '120px',
        '--dy':
          origin && destY != null
            ? `${Math.round(destY - origin.y)}px`
            : '30px',
        '--mode': origin ? 'fixed' : 'local'
      }
    })
  }
  pigAwards.value = fresh
  if (pigAwardTimer) clearTimeout(pigAwardTimer)
  if (pigEnergySyncTimer) clearTimeout(pigEnergySyncTimer)
  const targetEnergy = Math.max(
    displayPigEnergy.value,
    Number(payload.toEnergy) || 0
  )
  for (let i = 0; i < stars; i++) {
    setTimeout(
      () => {
        chargingSlot.value = Math.min(targetEnergy, displayPigEnergy.value + 1)
        displayPigEnergy.value = Math.min(
          targetEnergy,
          displayPigEnergy.value + 1
        )
        setTimeout(() => {
          chargingSlot.value = 0
        }, 220)
      },
      1080 + i * 180
    )
  }
  pigAwardTimer = setTimeout(() => {
    pigAwards.value = []
    pigAwardTimer = null
  }, 2200)
  pigEnergySyncTimer = setTimeout(
    () => {
      displayPigEnergy.value = game.pigEnergy
      chargingSlot.value = 0
      pigEnergySyncTimer = null
    },
    1820 + stars * 180
  )
}

function onItemEffectTriggered(payload = {}) {
  if (!payload.pigEnergyGained) return
  const targetEnergy = Math.max(displayPigEnergy.value, game.pigEnergy)
  for (let i = 0; i < payload.pigEnergyGained; i++) {
    setTimeout(() => {
      chargingSlot.value = Math.min(targetEnergy, displayPigEnergy.value + 1)
      displayPigEnergy.value = Math.min(
        targetEnergy,
        displayPigEnergy.value + 1
      )
      setTimeout(() => {
        chargingSlot.value = 0
      }, 220)
    }, i * 180)
  }
}

watch(
  () => game.pigEnergy,
  value => {
    if (pigEnergySyncTimer || pigAwards.value.length) return
    displayPigEnergy.value = value
  },
  { immediate: true }
)

onMounted(() => {
  EventBus.bind('pigRatingAwarded', onPigRatingAwarded)
  EventBus.bind('itemEffectTriggered', onItemEffectTriggered)
})

onBeforeUnmount(() => {
  EventBus.unbind('pigRatingAwarded', onPigRatingAwarded)
  EventBus.unbind('itemEffectTriggered', onItemEffectTriggered)
  if (pigAwardTimer) clearTimeout(pigAwardTimer)
  if (pigEnergySyncTimer) clearTimeout(pigEnergySyncTimer)
})
</script>

<style scoped>
.ability-bar {
  width: 244px;
  padding: 18px 18px 20px;
  border-radius: 16px;
  position: relative;
  overflow: visible;
  background: rgb(247, 243, 223);
  border: 2px solid #d4c9b4;
  box-shadow: 0 3px 0 0 #d4c9b4;
  color: #725d42;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

h3 {
  margin: 0 0 14px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #9f927d;
  font-weight: 700;
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
  color: #794f27;
}

.achievement-entry {
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 50px;
  background: #f8f8f0;
  border: 2px solid #d4c9b4;
  box-shadow: 0 3px 0 0 #d4c9b4;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.achievement-entry:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 0 0 #d4c9b4;
  border-color: #a89878;
}

.achievement-entry:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #d4c9b4;
}

.entry-icon {
  font-size: 15px;
}

.entry-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #9f927d;
}

.active-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pig-energy {
  margin-top: 12px;
  margin-bottom: 12px;
  padding: 12px 12px 10px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(245, 195, 28, 0.08), #f8f8f0);
  border: 2px solid rgba(245, 195, 28, 0.3);
  box-shadow: 0 3px 0 0 rgba(228, 186, 92, 0.4);
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
  color: #794f27;
  font-weight: 700;
}

.pig-energy-text {
  margin: 2px 0 0;
  font-size: 11px;
  color: #9f927d;
  font-weight: 500;
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
  background: radial-gradient(
    circle,
    rgba(255, 244, 196, 0.88),
    transparent 70%
  );
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
  color: rgba(159, 146, 125, 0.5);
  background: #eae4d0;
  border: 1.5px solid #d4c9b4;
  transition: all 240ms cubic-bezier(0.4, 0, 0.2, 1);
}

.pig-energy-star.filled {
  color: #794f27;
  background: radial-gradient(circle, #ffe480, #f5c31c);
  border-color: #dba90e;
  box-shadow: 0 0 10px rgba(245, 195, 28, 0.4);
  transform: scale(1.04);
}

.pig-energy-star.charging {
  animation: pig-energy-star-pop 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
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
  }
  60% {
    transform: scale(1.28);
  }
  100% {
    transform: scale(1.04);
  }
}

/* ── Ability buttons — 3D pill style ── */
.ab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #f8f8f0;
  border: 2px solid #d4c9b4;
  box-shadow: 0 3px 0 0 #d4c9b4;
  font-size: 13px;
  text-align: left;
  color: #725d42;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.ab-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #fff;
  border-color: #19c8b9;
  box-shadow: 0 4px 0 0 #50b9ab;
}

.ab-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #50b9ab;
}

.ab-btn.pending {
  background: linear-gradient(
    180deg,
    rgba(25, 200, 185, 0.16),
    rgba(25, 200, 185, 0.04)
  );
  border-color: #19c8b9;
  box-shadow:
    0 3px 0 0 #50b9ab,
    0 0 12px rgba(25, 200, 185, 0.18);
  color: #50b9ab;
}

.ab-btn.milk-tea {
  background: linear-gradient(
    180deg,
    rgba(245, 195, 28, 0.16),
    rgba(245, 195, 28, 0.04)
  );
  border-color: rgba(245, 195, 28, 0.5);
  box-shadow: 0 3px 0 0 rgba(228, 186, 92, 0.5);
}

.ab-btn.disabled {
  opacity: 0.45;
  box-shadow: none;
}

.ab-icon {
  font-size: 19px;
}

.ab-icon.small {
  font-size: 14px;
}

.ab-icon-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}

.ab-icon-img.small {
  width: 16px;
  height: 16px;
}

.ab-name {
  flex: 1;
  font-weight: 700;
  color: #725d42;
}

.ab-name.small {
  font-weight: 500;
  font-size: 12px;
}

.ab-uses {
  font-size: 11px;
  font-weight: 700;
  color: #9f927d;
  background: #eae4d0;
  padding: 2px 8px;
  border-radius: 50px;
  min-width: 38px;
  text-align: center;
}

.passive-list {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 2px dashed #eae4d0;
}

.passive-list .title {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: #9f927d;
  font-weight: 600;
}

.passive {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0;
  padding: 6px 10px;
  font-size: 12px;
  color: #9f927d;
  border-radius: 10px;
  background: #f8f8f0;
  border: 1.5px solid #eae4d0;
}

/* ── Convert panel — blob modal floating below ── */
.convert-panel {
  position: absolute;
  top: 50%;
  left: -120px;
  margin-top: 12px;
  width: 450px;
  padding: 18px 18px;
  border-radius: 16px;
  z-index: 12;
  background: rgb(247, 243, 223);
  border: 2px solid #d4c9b4;
  box-shadow:
    0 4px 0 0 #d4c9b4,
    0 8px 20px rgba(107, 92, 67, 0.18);
  animation: convert-in 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes convert-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.convert-panel p {
  margin: 0 0 8px;
  font-size: 13px;
  color: #794f27;
  font-weight: 700;
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
  align-items: center;
}

.milk-tea-chip-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  vertical-align: middle;
  margin-right: 3px;
}

.chip {
  background: #f8f8f0;
  padding: 4px 10px;
  border-radius: 50px;
  font-size: 11px;
  border: 2px solid #d4c9b4;
  box-shadow: 0 2px 0 0 #d4c9b4;
  color: #9f927d;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.chip:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 3px 0 0 #d4c9b4;
}

.chip.active {
  background: #19c8b9;
  color: #fff;
  border-color: #50b9ab;
  box-shadow: 0 2px 0 0 #50b9ab;
}

.chip:disabled {
  opacity: 0.4;
  box-shadow: none;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.apply,
.cancel {
  padding: 8px 16px;
  border-radius: 50px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid;
}

.apply {
  background: #f5c31c;
  color: #725d42;
  border-color: #dba90e;
  box-shadow: 0 4px 0 0 #dba90e;
}

.apply:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #f7d04a;
  box-shadow: 0 5px 0 0 #dba90e;
}

.apply:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #dba90e;
}

.apply:disabled {
  background: #eae4d0;
  border-color: #d4c9b4;
  color: #9f927d;
  box-shadow: none;
}

.cancel {
  background: #f8f8f0;
  color: #9f927d;
  border-color: #d4c9b4;
  box-shadow: 0 4px 0 0 #d4c9b4;
}

.cancel:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 0 0 #d4c9b4;
}

.cancel:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #d4c9b4;
}

/* ── Ability message box ── */
.ability-msg-box {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(25, 200, 185, 0.06), #f8f8f0);
  border: 2px solid rgba(25, 200, 185, 0.18);
  box-shadow: 0 2px 0 0 rgba(25, 200, 185, 0.1);
}

.msg-name {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  color: #50b9ab;
  display: flex;
  align-items: center;
  gap: 6px;
}

.msg-icon {
  font-size: 16px;
}

.msg-icon-img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.msg-desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #725d42;
  font-weight: 500;
}

.msg-quote {
  margin: 6px 0 0;
  padding-top: 6px;
  border-top: 1px dashed #e8e2d6;
  font-size: 11px;
  line-height: 1.45;
  color: #9f927d;
}

.msg-fade-enter-active {
  animation: msg-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.msg-fade-leave-active {
  animation: msg-out 120ms ease-in forwards;
}

@keyframes msg-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes msg-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
