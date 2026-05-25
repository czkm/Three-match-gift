<template>
  <div class="cutscene-overlay" :class="`day-${day}`" @click="onOverlayClick">
    <!-- Per-day backdrop tint -->
    <div class="backdrop" />

    <!-- Ambient petal shower (kept from original) -->
    <div class="petal-layer">
      <span
        v-for="p in petals"
        :key="p.id"
        class="petal"
        :style="{
          left: p.left + 'vw',
          fontSize: p.size + 'px',
          animationDuration: p.dur + 's',
          animationDelay: p.delay + 's',
          '--dx': p.dx + 'px'
        }"
      >
        {{ p.glyph }}
      </span>
    </div>

    <!-- Centered cutscene content: stage above, banner below -->
    <div class="cutscene-content">
      <div class="ceremony-stage">
        <component :is="ceremonyComponent" :phase="phase" />
      </div>

      <transition name="banner-fade">
        <div v-if="phase >= 2" class="banner">
          <div class="victory-award" :class="`stars-${pigStars}`">
            <div class="victory-rays" />
            <div class="victory-stars">
              <span
                v-for="n in 3"
                :key="`victory-star-${n}`"
                class="victory-star"
                :class="{ lit: n <= pigStars }"
              >
                <span class="victory-star-glyph">⭐</span>
              </span>
            </div>
            <!-- <p class="victory-subtitle">{{ pigStars }} 星过关</p> -->
          </div>

          <div class="award-stack">
            <p class="banner-line ink-title">{{ today.completedBanner }}</p>

            <div class="pig-rating-pill">
              <span class="pig-rating-emoji">{{ pigMood.emoji }}</span>
              <span class="pig-rating-text">
                小猪本关评价 {{ game.pigLastRating || 0 }} 星
              </span>
            </div>

            <div class="ability-stack">
              <div class="seal" :class="{ stamped: phase >= 2 }">
                <span class="seal-ring" />
                <span class="seal-emoji">{{ today.building.emoji }}</span>
              </div>
              <!-- <span class="ability-stack-icon">{{ ability.icon }}</span> -->
              <span class="ability-stack-name">{{ ability.name }}</span>
            </div>
            <p class="ability-quote ink-subtle">"{{ ability.quote }}"</p>
          </div>

          <Dialog
            v-if="showMono"
            ref="monoDialogRef"
            class="mono"
            :text="today.monologue"
            :hint="COMMON_COPY.continueHint"
            @done="onAdvance"
            @ready="onMonoReady"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'
import { audioManager } from '@/audio/AudioManager'
import { COMMON_COPY } from '@/data/copy'
import EventBus from '@/core/eventBus'
import Dialog from './Dialog.vue'
import { ABILITIES, PIG_RATING } from '@/data/content'
import { useGameStore } from '@/stores/gameStore'

const game = useGameStore()
const today = computed(() => game.today)
const day = computed(() => today.value.day)
const ability = computed(() => ABILITIES[today.value.ability])
const pigMood = computed(() => game.pigMood || PIG_RATING.moods[0])
const pigStars = computed(() =>
  Math.max(0, Math.min(3, game.pigLastRating || 0))
)

// Per-day motif duration before the banner stamps in (ms)
const MOTIF_MS = {
  1: 2800,
  2: 2400,
  3: 2000,
  4: 2200,
  5: 2400,
  6: 2200,
  7: 2600,
  8: 2400,
  9: 4200
}

const dayComponents = {
  1: defineAsyncComponent(() => import('./cutscenes/Day1Raven.vue')),
  2: defineAsyncComponent(() => import('./cutscenes/Day2Vines.vue')),
  3: defineAsyncComponent(() => import('./cutscenes/Day3Cork.vue')),
  4: defineAsyncComponent(() => import('./cutscenes/Day4Roach.vue')),
  5: defineAsyncComponent(() => import('./cutscenes/Day5Lilac.vue')),
  6: defineAsyncComponent(() => import('./cutscenes/Day6Greenhouse.vue')),
  7: defineAsyncComponent(() => import('./cutscenes/Day7Sunset.vue')),
  8: defineAsyncComponent(() => import('./cutscenes/Day8Hearth.vue')),
  9: defineAsyncComponent(() => import('./cutscenes/Day9Homecoming.vue'))
}
const ceremonyComponent = computed(() => dayComponents[day.value])

const phase = ref(0) // 0 = init, 1 = motif playing, 2 = banner revealed
const showMono = ref(false)
const showAdvance = ref(false)
const petals = ref([])
const monoDialogRef = ref(null)
let timers = []

onMounted(() => {
  audioManager.playSFX('scenetransition', { vol: 0.25 })
  // Ambient petals — fewer & gentler than original 80
  for (let i = 0; i < 50; i++) {
    petals.value.push({
      id: i,
      glyph: ['🌸', '🪻', '🍂', '🪶', '🌿'][i % 5],
      left: Math.random() * 100,
      size: 12 + Math.random() * 18,
      dur: 4.5 + Math.random() * 3,
      delay: Math.random() * 1.5,
      dx: (Math.random() - 0.5) * 240
    })
  }

  timers.push(
    setTimeout(() => {
      phase.value = 1
    }, 280)
  )

  const motifMs = MOTIF_MS[day.value] || 2400
  timers.push(
    setTimeout(() => {
      phase.value = 2
      audioManager.playSFX('repair', { vol: 0.7 })
      game.finishRepair()
      timers.push(
        setTimeout(() => {
          game.revealPigMoodForToday()
        }, 180)
      )
      timers.push(
        setTimeout(() => {
          emitPigRatingFlight()
        }, 900)
      )
      timers.push(
        setTimeout(() => {
          showMono.value = true
        }, 800)
      )
    }, 280 + motifMs)
  )
})

onBeforeUnmount(() => {
  for (const t of timers) clearTimeout(t)
})

function onMonoReady() {
  showAdvance.value = true
}

function emitPigRatingFlight() {
  nextTick(() => {
    const stars = [...document.querySelectorAll('.victory-star.lit')]
    EventBus.trigger('pigRatingAwarded', [
      {
        stars: pigStars.value,
        mood: pigMood.value.emoji,
        fromEnergy: game.pigEnergyBeforeAward || 0,
        toEnergy: game.pigEnergy || 0,
        origins: stars.map((el, index) => {
          const rect = el.getBoundingClientRect()
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            glyph: index % 2 === 0 ? '🌟' : '✨'
          }
        })
      }
    ])
  })
}

const emit = defineEmits(['advance'])
function onAdvance() {
  game.hidePigMood?.()
  audioManager.playSFX('pageflip', { vol: 0.4 })
  emit('advance')
}

function onOverlayClick() {
  if (!showMono.value) return
  if (!monoDialogRef.value?.isDone?.value) {
    monoDialogRef.value?.skipToEnd?.()
    return
  }
  if (showAdvance.value) onAdvance()
}
</script>

<style scoped>
.cutscene-overlay {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  animation: fade-in 400ms var(--ease-out-expo);
}

/* ───────── Backdrop (per-day tint) ───────── */
.backdrop {
  position: absolute;
  inset: 0;
  animation: backdrop-in 600ms var(--ease-out-expo) forwards;
  background: radial-gradient(
    circle at 50% 40%,
    rgba(255, 220, 160, 0.45),
    rgba(40, 28, 18, 0.68)
  );
}
@keyframes backdrop-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.day-1 .backdrop {
  background: radial-gradient(
    circle at 50% 30%,
    rgba(220, 210, 188, 0.46),
    rgba(34, 28, 22, 0.74)
  );
}
.day-2 .backdrop {
  background: radial-gradient(
    circle at 50% 36%,
    rgba(180, 200, 130, 0.42),
    rgba(40, 38, 22, 0.74)
  );
}
.day-3 .backdrop {
  background: radial-gradient(
    circle at 50% 36%,
    rgba(214, 162, 88, 0.46),
    rgba(34, 24, 16, 0.78)
  );
}
.day-4 .backdrop {
  background: radial-gradient(
    circle at 50% 42%,
    rgba(196, 168, 130, 0.44),
    rgba(36, 28, 22, 0.74)
  );
}
.day-5 .backdrop {
  background: radial-gradient(
    circle at 50% 32%,
    rgba(204, 174, 220, 0.44),
    rgba(36, 28, 38, 0.74)
  );
}
.day-6 .backdrop {
  background: radial-gradient(
    circle at 50% 30%,
    rgba(190, 220, 200, 0.4),
    rgba(28, 32, 28, 0.78)
  );
}
.day-7 .backdrop {
  background: radial-gradient(
    circle at 50% 30%,
    rgba(238, 168, 96, 0.54),
    rgba(60, 32, 30, 0.82)
  );
}
.day-8 .backdrop {
  background: radial-gradient(
    circle at 50% 36%,
    rgba(244, 184, 100, 0.5),
    rgba(40, 26, 20, 0.82)
  );
}
.day-9 .backdrop {
  background: radial-gradient(
    circle at 50% 28%,
    rgba(216, 178, 232, 0.54),
    rgba(48, 32, 56, 0.86)
  );
}

/* ───────── Petal layer ───────── */
.petal-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}
.petal {
  position: absolute;
  top: -24px;
  animation: petal-fall linear forwards;
}
@keyframes petal-fall {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.85;
  }
  100% {
    transform: translate(var(--dx), 110vh) rotate(360deg);
    opacity: 0;
  }
}

/* ───────── Centered content ───────── */
.cutscene-content {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transform: translateY(-42px);
}

.ceremony-stage {
  position: relative;
  width: 480px;
  max-width: 92vw;
  height: 182px;
  pointer-events: none;
}

/* ───────── Banner ───────── */
.banner {
  position: relative;
  width: 480px;
  max-width: 92vw;
  padding: 18px 30px 24px;
  text-align: center;
  clip-path: url(#animal-modal-clip);
  background: rgb(247, 243, 223);
  box-shadow: 0 4px 10px rgba(107, 92, 67, 0.42);
  color: #725d42;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}
.banner-fade-enter-active {
  transition:
    opacity 800ms var(--ease-out-expo),
    transform 800ms var(--ease-out-expo);
}
.banner-fade-enter-from {
  opacity: 0;
  transform: translateY(18px) scale(0.94);
}

.victory-award {
  position: relative;
  width: 204px;
  margin: 24px auto 42px;
  padding-top: 54px;
  pointer-events: none;
}

.victory-rays {
  position: absolute;
  left: 50%;
  top: -18px;
  width: 176px;
  height: 114px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: conic-gradient(
    from -14deg,
    rgba(255, 245, 214, 0) 0deg 16deg,
    rgba(255, 229, 132, 0.74) 16deg 30deg,
    rgba(255, 245, 214, 0) 30deg 46deg,
    rgba(255, 215, 98, 0.64) 46deg 60deg,
    rgba(255, 245, 214, 0) 60deg 76deg,
    rgba(255, 229, 132, 0.74) 76deg 92deg,
    rgba(255, 245, 214, 0) 92deg 108deg,
    rgba(255, 215, 98, 0.64) 108deg 124deg,
    rgba(255, 245, 214, 0) 124deg 140deg,
    rgba(255, 229, 132, 0.74) 140deg 156deg,
    rgba(255, 245, 214, 0) 156deg 172deg,
    rgba(255, 215, 98, 0.64) 172deg 188deg,
    rgba(255, 245, 214, 0) 188deg 204deg,
    rgba(255, 229, 132, 0.74) 204deg 220deg,
    rgba(255, 245, 214, 0) 220deg 236deg,
    rgba(255, 215, 98, 0.64) 236deg 252deg,
    rgba(255, 245, 214, 0) 252deg 268deg,
    rgba(255, 229, 132, 0.74) 268deg 284deg,
    rgba(255, 245, 214, 0) 284deg 300deg,
    rgba(255, 215, 98, 0.64) 300deg 316deg,
    rgba(255, 245, 214, 0) 316deg 332deg,
    rgba(255, 229, 132, 0.74) 332deg 348deg,
    rgba(255, 245, 214, 0) 348deg 360deg
  );
  opacity: 0;
  filter: blur(0.2px) saturate(1.1);
  animation: victory-rays-in 880ms cubic-bezier(0.18, 0.9, 0.34, 1.2) 40ms
    forwards;
}

.victory-stars {
  position: absolute;
  left: 50%;
  top: 0;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  transform: translateX(-50%);
}

.victory-star {
  opacity: 0;
  transform: translateY(20px) scale(0.7);
}

.victory-star:nth-child(1),
.victory-star:nth-child(3) {
  margin-top: 10px;
}

.victory-star.lit {
  animation: victory-star-pop 620ms cubic-bezier(0.18, 0.9, 0.34, 1.5) forwards;
}

.victory-star:nth-child(1).lit {
  animation-delay: 120ms;
}
.victory-star:nth-child(2).lit {
  animation-delay: 220ms;
}
.victory-star:nth-child(3).lit {
  animation-delay: 320ms;
}

.victory-star-glyph {
  display: block;
  font-size: 38px;
  line-height: 1;
  filter: drop-shadow(0 4px 0 rgba(214, 126, 36, 0.52))
    drop-shadow(0 0 18px rgba(255, 230, 138, 0.34));
}

.victory-star:not(.lit) .victory-star-glyph {
  opacity: 0.22;
  filter: grayscale(0.3);
}

.victory-subtitle {
  margin: 18px 0 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: rgba(124, 84, 32, 0.88);
}

.award-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

@keyframes victory-rays-in {
  0% {
    opacity: 0;
    transform: translateX(-50%) scale(0.62) rotate(-10deg);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 0.94;
    transform: translateX(-50%) scale(1) rotate(0deg);
  }
}

@keyframes victory-star-pop {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.7);
  }
  60% {
    opacity: 1;
    transform: translateY(-4px) scale(1.12);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.pig-rating-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: 50px;
  background: #f8f8f0;
  border: 2px solid #d4c9b4;
  box-shadow: 0 2px 0 0 #d4c9b4;
}

.pig-rating-emoji {
  font-size: 18px;
}

.pig-rating-text {
  font-size: 11px;
  color: #9f927d;
  letter-spacing: 0.02em;
  font-weight: 600;
}

/* Wax-seal stamp around the building emoji */
.seal {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto 4px;
}
.seal-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--gold, #c9a35f);
  box-shadow:
    0 0 0 6px rgba(201, 163, 95, 0.18),
    inset 0 0 12px rgba(201, 163, 95, 0.32);
  transform: scale(0.4);
  opacity: 0;
}
.seal-emoji {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  z-index: 2;
  transform: scale(0.6) rotate(-8deg);
  opacity: 0;
}
.seal.stamped .seal-ring {
  animation: seal-stamp 600ms cubic-bezier(0.18, 0.9, 0.34, 1.6) 80ms forwards;
}
.seal.stamped .seal-emoji {
  animation: seal-emoji 520ms cubic-bezier(0.18, 0.9, 0.34, 1.6) 240ms forwards;
}
@keyframes seal-stamp {
  0% {
    transform: scale(0.4);
    opacity: 0;
  }
  60% {
    transform: scale(1.14);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes seal-emoji {
  0% {
    transform: scale(0.6) rotate(-8deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.1) rotate(2deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}

.banner-line {
  font-size: 22px;
  margin: 0;
  line-height: 1.3;
  color: #794f27;
  font-weight: 800;
}
.ability-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ability-stack-icon {
  font-size: 28px;
  line-height: 1;
}

.ability-stack-name {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #19c8b9;
}

.ability-quote {
  margin: 0;
  font-size: 12px;
  font-style: italic;
  color: #9f927d;
  font-weight: 500;
}

.mono {
  margin-top: 10px;
}
</style>
