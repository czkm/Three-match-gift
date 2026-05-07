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
      >{{ p.glyph }}</span>
    </div>

    <!-- Centered cutscene content: stage above, banner below -->
    <div class="cutscene-content">
      <div class="ceremony-stage">
        <component :is="ceremonyComponent" :phase="phase" />
      </div>

      <transition name="banner-fade">
        <div v-if="phase >= 2" class="banner parchment grain">
          <!-- Wax-seal-style emoji stamp -->
          <div class="seal" :class="{ stamped: phase >= 2 }">
            <span class="seal-ring" />
            <span class="seal-emoji">{{ today.building.emoji }}</span>
          </div>

          <p class="banner-line ink-title">{{ today.completedBanner }}</p>

          <div class="ability-pill">
            <span class="ability-icon">{{ ability.icon }}</span>
            <span class="ability-name">{{ ability.name }}</span>
          </div>
          <p class="ability-quote ink-subtle">"{{ ability.quote }}"</p>

          <Dialog
            v-if="showMono"
            ref="monoDialogRef"
            class="mono"
            :text="today.monologue"
            hint="点击继续"
            @done="onAdvance"
            @ready="onMonoReady"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import Dialog from './Dialog.vue';
import { ABILITIES } from '@/data/content';
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();
const today = computed(() => game.today);
const day = computed(() => today.value.day);
const ability = computed(() => ABILITIES[today.value.ability]);

// Per-day motif duration before the banner stamps in (ms)
const MOTIF_MS = {
  1: 2800, 2: 2400, 3: 2000, 4: 2200, 5: 2400,
  6: 2200, 7: 2600, 8: 2400, 9: 4200
};

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
};
const ceremonyComponent = computed(() => dayComponents[day.value]);

const phase = ref(0);          // 0 = init, 1 = motif playing, 2 = banner revealed
const showMono = ref(false);
const showAdvance = ref(false);
const petals = ref([]);
const monoDialogRef = ref(null);
let timers = [];

onMounted(() => {
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
    });
  }

  timers.push(setTimeout(() => { phase.value = 1; }, 280));

  const motifMs = MOTIF_MS[day.value] || 2400;
  timers.push(setTimeout(() => {
    phase.value = 2;
    game.finishRepair();
    timers.push(setTimeout(() => { showMono.value = true; }, 800));
  }, 280 + motifMs));
});

onBeforeUnmount(() => {
  for (const t of timers) clearTimeout(t);
});

function onMonoReady() { showAdvance.value = true; }

const emit = defineEmits(['advance']);
function onAdvance() { emit('advance'); }

function onOverlayClick() {
  if (!showMono.value) return;
  if (!monoDialogRef.value?.isDone?.value) {
    monoDialogRef.value?.skipToEnd?.();
    return;
  }
  if (showAdvance.value) onAdvance();
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
}

/* ───────── Backdrop (per-day tint) ───────── */
.backdrop {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(2px);
  animation: backdrop-in 600ms ease forwards;
  background: radial-gradient(circle at 50% 40%, rgba(255, 220, 160, 0.4), rgba(40, 28, 18, 0.65));
}
@keyframes backdrop-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.day-1 .backdrop { background: radial-gradient(circle at 50% 30%, rgba(220, 210, 188, 0.42), rgba(34, 28, 22, 0.7)); }
.day-2 .backdrop { background: radial-gradient(circle at 50% 36%, rgba(180, 200, 130, 0.38), rgba(40, 38, 22, 0.7)); }
.day-3 .backdrop { background: radial-gradient(circle at 50% 36%, rgba(214, 162, 88, 0.42), rgba(34, 24, 16, 0.74)); }
.day-4 .backdrop { background: radial-gradient(circle at 50% 42%, rgba(196, 168, 130, 0.4), rgba(36, 28, 22, 0.7)); }
.day-5 .backdrop { background: radial-gradient(circle at 50% 32%, rgba(204, 174, 220, 0.4), rgba(36, 28, 38, 0.7)); }
.day-6 .backdrop { background: radial-gradient(circle at 50% 30%, rgba(190, 220, 200, 0.36), rgba(28, 32, 28, 0.74)); }
.day-7 .backdrop { background: radial-gradient(circle at 50% 30%, rgba(238, 168, 96, 0.5), rgba(60, 32, 30, 0.78)); }
.day-8 .backdrop { background: radial-gradient(circle at 50% 36%, rgba(244, 184, 100, 0.45), rgba(40, 26, 20, 0.78)); }
.day-9 .backdrop { background: radial-gradient(circle at 50% 28%, rgba(216, 178, 232, 0.5), rgba(48, 32, 56, 0.82)); }

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
  will-change: transform, opacity;
}
@keyframes petal-fall {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.85; }
  100% { transform: translate(var(--dx), 110vh) rotate(360deg); opacity: 0; }
}

/* ───────── Centered content ───────── */
.cutscene-content {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.ceremony-stage {
  position: relative;
  width: 480px;
  max-width: 92vw;
  height: 200px;
  pointer-events: none;
}

/* ───────── Banner ───────── */
.banner {
  position: relative;
  width: 480px;
  max-width: 92vw;
  padding: 24px 28px 22px;
  text-align: center;
  border-radius: 8px;
}
.banner-fade-enter-active {
  transition: opacity 720ms ease, transform 720ms cubic-bezier(0.22, 0.95, 0.34, 1);
}
.banner-fade-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.94);
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
.seal.stamped .seal-ring  { animation: seal-stamp 600ms cubic-bezier(0.18, 0.9, 0.34, 1.6) 80ms forwards; }
.seal.stamped .seal-emoji { animation: seal-emoji 520ms cubic-bezier(0.18, 0.9, 0.34, 1.6) 240ms forwards; }
@keyframes seal-stamp {
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.14); opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
}
@keyframes seal-emoji {
  0%   { transform: scale(0.6) rotate(-8deg); opacity: 0; }
  60%  { transform: scale(1.1)  rotate(2deg); opacity: 1; }
  100% { transform: scale(1)    rotate(0);    opacity: 1; }
}

.banner-line {
  font-size: 22px;
  margin: 6px 0 12px;
}

.ability-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(212, 168, 87, 0.95), rgba(176, 148, 201, 0.86));
  color: #fff8ee;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.06em;
  box-shadow: 0 6px 14px rgba(58, 42, 31, 0.18);
}
.ability-icon { font-size: 16px; }
.ability-quote {
  margin: 8px 0 0;
  font-size: 12px;
  font-style: italic;
}

.mono { margin-top: 10px; }
</style>
