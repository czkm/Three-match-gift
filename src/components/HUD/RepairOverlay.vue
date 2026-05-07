<template>
  <div class="repair-overlay">
    <!-- Stage 1: morning breeze sweeps dust -->
    <div v-if="stage >= 1" class="morning-breeze" />

    <!-- Stage 2: warm restoration glow -->
    <div v-if="stage >= 2" class="repair-glow" />

    <!-- Stage 3: white raven crest -->
    <div v-if="stage >= 3" class="raven-crest">⚜️🕊</div>

    <!-- Petal shower for the whole sequence -->
    <div class="petal-layer">
      <span
        v-for="p in petals"
        :key="p.id"
        class="petal"
        :style="{
          left: p.left + 'vw',
          fontSize: p.size + 'px',
          animationDuration: p.dur + 's',
          '--dx': p.dx + 'px'
        }"
      >{{ p.glyph }}</span>
    </div>

    <!-- Banner & monologue -->
    <div v-if="bannerVisible" class="banner parchment grain">
      <p class="banner-emoji">{{ today.building.emoji }}</p>
      <p class="banner-line ink-title">{{ today.completedBanner }}</p>
      <p class="banner-sub ink-subtle">解锁能力 · {{ ABILITIES[today.ability].name }}</p>

      <Dialog
        v-if="showMono"
        class="mono"
        :text="today.monologue"
        hint="点击继续"
        @done="onMonoDone"
      />

      <button v-if="showAdvance" class="advance-btn" @click="onAdvance">
        {{ today.ending ? '迎接归来' : '走向次日' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import Dialog from './Dialog.vue';
import { ABILITIES } from '@/data/content';
import { useGameStore } from '@/stores/gameStore';
import { TIMING } from '@/utils/timing';

const game = useGameStore();
const today = game.today;

const stage = ref(0);
const bannerVisible = ref(false);
const showMono = ref(false);
const showAdvance = ref(false);
const petals = ref([]);

let timers = [];

onMounted(() => {
  // Petals start straight away
  for (let i = 0; i < 80; i++) {
    petals.value.push({
      id: i,
      glyph: ['🌸', '🪻', '🍂', '🪶', '🌿'][Math.floor(Math.random() * 5)],
      left: Math.random() * 100,
      size: 14 + Math.random() * 18,
      dur: 4 + Math.random() * 3,
      dx: (Math.random() - 0.5) * 200
    });
  }

  timers.push(setTimeout(() => { stage.value = 1; }, 100));
  timers.push(setTimeout(() => { stage.value = 2; }, TIMING.REPAIR_BREEZE_MS));
  timers.push(setTimeout(() => { stage.value = 3; },
    TIMING.REPAIR_BREEZE_MS + TIMING.REPAIR_GLOW_MS));

  const total = TIMING.REPAIR_BREEZE_MS + TIMING.REPAIR_GLOW_MS + TIMING.REPAIR_RAVEN_MS;
  timers.push(setTimeout(() => {
    bannerVisible.value = true;
    // The store records the unlock + monologue for us.
    const result = game.finishRepair();
    // After a small breath, show monologue.
    timers.push(setTimeout(() => { showMono.value = true; }, 500));
  }, total + 200));
});

onBeforeUnmount(() => {
  for (const t of timers) clearTimeout(t);
});

function onMonoDone() {
  showAdvance.value = true;
}

const emit = defineEmits(['advance']);
function onAdvance() {
  emit('advance');
}
</script>

<style scoped>
.repair-overlay {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 40%, rgba(255, 220, 160, 0.4), rgba(40, 28, 18, 0.65));
  backdrop-filter: blur(2px);
}

.banner {
  position: relative;
  width: 480px;
  padding: 22px 26px;
  text-align: center;
  border-radius: 8px;
  animation: banner-in 700ms ease forwards;
  z-index: 5;
}
.banner-emoji  { font-size: 56px; margin: 0; }
.banner-line   { font-size: 22px; margin: 4px 0 6px; }
.banner-sub    { font-size: 13px; margin-bottom: 14px; }

.advance-btn {
  margin-top: 14px;
  padding: 8px 20px;
  background: var(--gold);
  color: var(--ink);
  border-radius: 6px;
  font-weight: 700;
  font-size: 14px;
}
.advance-btn:hover { background: var(--gold-soft); }

.mono { margin-top: 10px; }

@keyframes banner-in {
  from { opacity: 0; transform: translateY(8px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
