<template>
  <div class="ending">
    <!-- Stage 1: gazebo silhouette -->
    <div class="terrace">
      <div class="sky" />
      <div class="hills" />
      <div class="vineyard" />
      <div class="gazebo">
        <span class="lantern">🏮</span>
        <span class="chair left">🪑</span>
        <span class="table">🍷</span>
        <span class="chair right">🪑</span>
      </div>
      <span class="raven">🕊</span>
    </div>

    <!-- Stage 2: portal & Yennefer -->
    <transition name="portal-fade">
      <div v-if="showPortal" class="lilac-portal" />
    </transition>
    <transition name="yen-fade">
      <span v-if="showYen" class="yennefer">🧙‍♀️</span>
    </transition>

    <!-- Stage 3: dialogue -->
    <transition name="card-fade">
      <div v-if="showLines" class="card parchment grain">
        <div class="lines">
          <p
            v-for="(l, i) in revealedLines"
            :key="i"
            class="line"
            :class="{ narration: !l.who }"
          >
            <span v-if="l.who" class="who">{{ l.who }}</span>
            <span class="text">{{ l.text }}</span>
          </p>
        </div>

        <div v-if="allLinesShown" class="signature-block">
          <p v-if="showAttemptedGift" class="attempted-signature">{{ game.giftAttemptedText }}</p>
          <p class="signature">{{ game.giftText }}</p>
          <transition name="blessing-fade">
            <p v-if="showBlessing" class="blessing">{{ ENDING.blessingLine }}</p>
          </transition>
        </div>

        <button v-if="allLinesShown" class="restart" @click="onRestart">
          再开一座葡萄园
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { ENDING } from '@/data/content';
import { TIMING } from '@/utils/timing';

const game = useGameStore();
const showPortal = ref(false);
const showYen    = ref(false);
const showLines  = ref(false);
const linesRevealed = ref(0);
const showBlessing = ref(false);
const timers = [];

const revealedLines = computed(() => ENDING.lines.slice(0, linesRevealed.value));
const allLinesShown = computed(() => linesRevealed.value >= ENDING.lines.length);
const showAttemptedGift = computed(() => (
  game.giftWasOverridden &&
  game.giftAttemptedText &&
  game.giftAttemptedText !== game.giftText
));

const emit = defineEmits(['restart']);

onMounted(() => {
  timers.push(setTimeout(() => { showPortal.value = true; }, 1200));
  timers.push(setTimeout(() => { showYen.value = true; },    1200 + TIMING.PORTAL_MS - 400));
  timers.push(setTimeout(() => { showLines.value = true; revealLines(); }, 1200 + TIMING.PORTAL_MS + 300));
});

onBeforeUnmount(() => { for (const t of timers) clearTimeout(t); });

function revealLines() {
  let i = 0;
  const tick = () => {
    i++;
    linesRevealed.value = i;
    if (i < ENDING.lines.length) {
      timers.push(setTimeout(tick, 1500));
    } else {
      timers.push(setTimeout(() => { showBlessing.value = true; }, 1800));
    }
  };
  tick();
}

function onRestart() {
  emit('restart');
}
</script>

<style scoped>
.ending {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(180deg, #c45a3a 0%, #6b3367 65%, #2a1f4a 100%);
}

.terrace {
  position: absolute;
  inset: 0;
}
.sky {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 60%;
  background:
    radial-gradient(ellipse at 50% 100%, rgba(255, 200, 130, 0.85) 0%, transparent 55%),
    linear-gradient(180deg, #ec894c 0%, #6b3367 100%);
}
.hills {
  position: absolute;
  bottom: 35%;
  left: 0; right: 0;
  height: 18%;
  background: linear-gradient(180deg, #432754 0%, #2a1f4a 100%);
  clip-path: polygon(0 60%, 12% 30%, 22% 55%, 38% 25%, 50% 50%, 62% 28%, 78% 55%, 88% 35%, 100% 60%, 100% 100%, 0 100%);
}
.vineyard {
  position: absolute;
  bottom: 0;
  left: 0; right: 0;
  height: 35%;
  background: linear-gradient(180deg, #2a1f4a 0%, #170f2c 100%);
}
.gazebo {
  position: absolute;
  bottom: 22%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  gap: 4px;
  font-size: 38px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
}
.lantern {
  position: absolute;
  top: -55px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 28px;
  animation: lantern-sway 3.4s ease-in-out infinite alternate;
}
@keyframes lantern-sway { from { transform: translateX(-50%) rotate(-4deg); } to { transform: translateX(-50%) rotate(4deg); } }
.chair { font-size: 30px; }
.table { font-size: 26px; }

.raven {
  position: absolute;
  top: 18%;
  left: -10%;
  font-size: 38px;
  animation: raven-cross 8s linear infinite;
}
@keyframes raven-cross {
  0%   { transform: translateX(0) translateY(0); }
  100% { transform: translateX(120vw) translateY(-30px); }
}

.lilac-portal {
  position: absolute;
  top: 55%;
  left: 30%;
  width: 0; height: 0;
  border-radius: 50%;
  background: radial-gradient(circle, var(--lilac) 0%, var(--magic-1) 60%, transparent 100%);
  box-shadow: 0 0 80px rgba(176, 148, 201, 0.7);
  transform: translate(-50%, -50%);
  animation: portal-grow 2400ms ease forwards;
}
@keyframes portal-grow {
  0%   { width: 0; height: 0; opacity: 0.3; }
  60%  { width: 200px; height: 280px; opacity: 1; }
  100% { width: 200px; height: 280px; opacity: 1; }
}
.portal-fade-enter-active { transition: opacity 600ms ease; }
.portal-fade-enter-from { opacity: 0; }

.yennefer {
  position: absolute;
  bottom: 30%;
  left: 33%;
  font-size: 56px;
  filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.5));
  animation: yen-step 1.6s ease forwards;
}
@keyframes yen-step {
  0%   { opacity: 0; transform: translateX(-30px); }
  60%  { opacity: 1; transform: translateX(0); }
  100% { opacity: 1; transform: translateX(0); }
}
.yen-fade-enter-active { transition: opacity 600ms ease; }
.yen-fade-enter-from { opacity: 0; }

.card {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 580px;
  padding: 22px 26px;
  border-radius: 8px;
  text-align: center;
}
.card-fade-enter-active { transition: opacity 700ms ease, transform 700ms ease; }
.card-fade-enter-from { opacity: 0; transform: translate(-50%, 20px); }

.lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  text-align: left;
}
.line { margin: 0; font-size: 15px; line-height: 1.6; animation: line-in 500ms ease; }
.line .who {
  display: inline-block;
  width: 56px;
  font-weight: 700;
  color: var(--gold);
  margin-right: 8px;
}
.line.narration {
  font-style: italic;
  color: var(--ink-soft);
  text-align: center;
}
@keyframes line-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.signature-block {
  margin-top: 18px;
}
.attempted-signature {
  position: relative;
  display: inline-block;
  margin: 0 0 8px;
  padding: 0 10px;
  font-size: 14px;
  color: rgba(74, 53, 36, 0.56);
  font-style: italic;
  transform: rotate(-2deg);
  animation: line-in 900ms ease;
}
.attempted-signature::after {
  content: '';
  position: absolute;
  left: 6px;
  right: 6px;
  top: 50%;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(208, 168, 87, 0.95) 12%, rgba(208, 168, 87, 0.95) 88%, transparent 100%);
}
.signature {
  margin: 0 0 6px;
  font-size: 18px;
  color: var(--ink);
  letter-spacing: 0.2em;
  font-weight: 700;
  animation: line-in 1000ms ease;
}
.blessing {
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--ink-soft);
}
.blessing-fade-enter-active,
.blessing-fade-leave-active {
  transition: opacity 700ms ease, transform 700ms ease;
}
.blessing-fade-enter-from,
.blessing-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.restart {
  margin-top: 8px;
  background: var(--gold);
  color: var(--ink);
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
}
.restart:hover { background: var(--gold-soft); }
</style>
