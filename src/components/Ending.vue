<template>
  <div class="ending" :class="`act-${currentAct}`" @click="onStageClick">
    <!-- Dynamic background -->
    <div class="bg-base" />
    <div class="bg-glow" :class="`glow-${currentAct}`" />

    <!-- Starfield -->
    <div class="starfield" :class="{ intense: currentAct >= 2 }">
      <span
        v-for="s in stars"
        :key="s.id"
        class="star"
        :style="{ left: s.x + '%', top: s.y + '%', width: s.size + 'px', height: s.size + 'px', animationDuration: s.dur + 's', animationDelay: s.delay + 's' }"
      />
    </div>

    <!-- Per-act particles -->
    <div v-if="particlesReady" class="particle-layer" :class="`particles-${currentAct}`">
      <span
        v-for="p in currentParticles"
        :key="p.id"
        class="particle"
        :style="{ left: p.x + '%', fontSize: p.size + 'px', animationDuration: p.dur + 's', animationDelay: p.delay + 's', '--dx': p.dx + 'px', '--rot': p.rot + 'deg' }"
      >{{ p.glyph }}</span>
    </div>

    <!-- Burst ring (wishes) -->
    <div v-if="burstActive" class="burst-ring" :class="`burst-${currentAct}`" />

    <!-- Center content -->
    <div class="stage">
      <div class="act-content">
        <h1 class="act-title" :class="`title-${currentAct}`">
          {{ activeBeat?.title }}
        </h1>

        <div class="lines">
          <p
            v-for="(line, idx) in shownLines"
            :key="`${currentAct}-${idx}`"
            class="line"
            :class="[`line-${currentAct}`, { 'line-wish': currentAct === 2 }]"
          >{{ line }}</p>
        </div>

        <!-- Candle lines (wishes act) -->
        <div v-if="currentAct === 2 && allLinesShown" class="candle-lines">
          <p
            v-for="(line, idx) in ENDING.candleLines"
            :key="`candle-${idx}`"
            class="candle-line"
          >{{ line }}</p>
        </div>

        <!-- Signature block (blessing act) -->
        <div v-if="currentAct === 3 && allLinesShown" class="signature-block">
          <p v-if="showAttemptedGift" class="attempted-sig">{{ game.giftAttemptedText }}</p>
          <div class="sig-main">
            <span class="sig-seal">💛</span>
            <span class="sig-text">{{ game.giftText }}</span>
          </div>
          <p class="sig-blessing">{{ ENDING.blessingLine }}</p>
        </div>

        <!-- Buttons -->
        <button
          v-if="allLinesShown && currentAct < 3"
          class="continue-btn"
          @click.stop="onAdvance"
        >继续</button>

        <button
          v-if="currentAct === 3 && allLinesShown"
          class="restart-btn"
          @click.stop="onAdvance"
        >再开一座葡萄园</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { audioManager } from '@/audio/AudioManager';
import { useAchievementStore } from '@/stores/achievementStore';
import { useGameStore } from '@/stores/gameStore';
import { ENDING } from '@/data/content';

const achievement = useAchievementStore();
const game = useGameStore();
const emit = defineEmits(['restart']);

const currentAct = ref(0);
const linesRevealed = ref(0);
const allLinesShown = ref(false);
const burstActive = ref(false);
const particlesReady = ref(false);
const timers = [];

const activeBeat = computed(() => ENDING.beats[currentAct.value] || null);
const totalLines = computed(() => activeBeat.value?.lines?.length || 0);
const shownLines = computed(() => activeBeat.value?.lines?.slice(0, linesRevealed.value) || []);
const showAttemptedGift = computed(() => (
  game.giftWasOverridden && game.giftAttemptedText && game.giftAttemptedText !== game.giftText
));

// Stars
const stars = Array.from({ length: 50 }, (_, i) => ({
  id: `s${i}`, x: Math.random() * 100, y: Math.random() * 100,
  size: 1.5 + Math.random() * 2.5, dur: 2 + Math.random() * 3.5, delay: Math.random() * 4
}));

// Per-act particle factories
const actParticles = {
  0: () => Array.from({ length: 20 }, (_, i) => ({
    id: `p0-${i}`, glyph: ['🪻', '🌸', '🌙', '✨'][i % 4],
    x: 5 + Math.random() * 90, size: 14 + Math.random() * 16,
    dur: 5 + Math.random() * 4, delay: Math.random() * 2.5,
    dx: (Math.random() - 0.5) * 100, rot: Math.random() * 360
  })),
  1: () => Array.from({ length: 28 }, (_, i) => ({
    id: `p1-${i}`, glyph: ['🕯️', '✨', '🌟', '💫'][i % 4],
    x: 10 + Math.random() * 80, size: 12 + Math.random() * 14,
    dur: 4.5 + Math.random() * 3.5, delay: Math.random() * 2,
    dx: (Math.random() - 0.5) * 80, rot: Math.random() * 360
  })),
  2: () => Array.from({ length: 36 }, (_, i) => ({
    id: `p2-${i}`, glyph: ['✨', '🌟', '💛', '💫', '⭐'][i % 5],
    x: 5 + Math.random() * 90, size: 14 + Math.random() * 18,
    dur: 4 + Math.random() * 3, delay: Math.random() * 1.5,
    dx: (Math.random() - 0.5) * 120, rot: Math.random() * 360
  })),
  3: () => Array.from({ length: 44 }, (_, i) => ({
    id: `p3-${i}`, glyph: ['💛', '✨', '🌟', '🪻', '🕯️', '💫', '⭐', '🌸'][i % 8],
    x: 3 + Math.random() * 94, size: 14 + Math.random() * 20,
    dur: 3.5 + Math.random() * 3, delay: Math.random() * 1.2,
    dx: (Math.random() - 0.5) * 140, rot: Math.random() * 360
  }))
};

const currentParticles = computed(() => (actParticles[currentAct.value] || actParticles[0])());

onMounted(() => {
  timers.push(setTimeout(() => { particlesReady.value = true; }, 300));
});

onBeforeUnmount(() => {
  for (const t of timers) clearTimeout(t);
});

function onStageClick() {
  if (allLinesShown.value) return; // wait for button click
  revealNextLine();
}

function revealNextLine() {
  if (linesRevealed.value >= totalLines.value) return;

  linesRevealed.value++;

  // Burst on wish lines
  if (currentAct.value === 2 || currentAct.value === 3) {
    burstActive.value = true;
    timers.push(setTimeout(() => { burstActive.value = false; }, 800));
  }

  if (linesRevealed.value >= totalLines.value) {
    allLinesShown.value = true;
    if (currentAct.value === 3) {
      achievement.track('endingSeen', { day: 9 });
    }
  }
}

function onAdvance() {
  if (!allLinesShown.value) return;
  audioManager.playSFX('pageflip', { vol: 0.4 });
  if (currentAct.value >= 3) {
    emit('restart');
    return;
  }
  currentAct.value++;
  linesRevealed.value = 0;
  allLinesShown.value = false;
  burstActive.value = false;
}
</script>

<style scoped>
.ending {
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* ── Backgrounds ── */
.bg-base {
  position: absolute;
  inset: 0;
  transition: background 1.4s var(--ease-out-expo);
}

.act-0 .bg-base { background: linear-gradient(180deg, #2a1840 0%, #1a1030 40%, #0e0818 100%); }
.act-1 .bg-base { background: linear-gradient(180deg, #3a2020 0%, #281418 40%, #180c10 100%); }
.act-2 .bg-base { background: linear-gradient(180deg, #3a2a10 0%, #2a1e0c 40%, #1a1208 100%); }
.act-3 .bg-base { background: linear-gradient(180deg, #3a3018 0%, #2a2210 40%, #1a1808 100%); }

.bg-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: background 1.4s var(--ease-out-expo);
}

.glow-0 { background: radial-gradient(ellipse at 50% 30%, rgba(158, 132, 184, 0.20), transparent 50%), radial-gradient(circle at 30% 60%, rgba(200, 170, 220, 0.10), transparent 40%); }
.glow-1 { background: radial-gradient(ellipse at 50% 40%, rgba(255, 180, 100, 0.22), transparent 50%), radial-gradient(circle at 70% 60%, rgba(255, 140, 60, 0.10), transparent 40%); }
.glow-2 { background: radial-gradient(ellipse at 50% 35%, rgba(255, 214, 112, 0.28), transparent 50%), radial-gradient(circle at 40% 65%, rgba(240, 180, 80, 0.12), transparent 40%); }
.glow-3 { background: radial-gradient(ellipse at 50% 30%, rgba(255, 230, 160, 0.32), transparent 50%), radial-gradient(circle at 50% 50%, rgba(255, 214, 112, 0.16), transparent 60%); }

/* ── Starfield ── */
.starfield { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.starfield.intense .star { animation-duration: 1.8s !important; }

.star {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 244, 220, 0.85);
  box-shadow: 0 0 4px 1px rgba(255, 240, 200, 0.30);
  animation: star-twinkle var(--ease-in-out-sine) infinite;
}

@keyframes star-twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.6); }
  50%      { opacity: 1;   transform: scale(1.3); }
}

/* ── Particles ── */
.particle-layer { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 2; }

.particle {
  position: absolute;
  bottom: -30px;
  opacity: 0;
  animation: p-rise var(--ease-in-out-sine) infinite;
  filter: drop-shadow(0 2px 4px rgba(114, 93, 66, 0.12));
}

@keyframes p-rise {
  0%   { opacity: 0;   transform: translate(0, 0) scale(0.5) rotate(0deg); }
  12%  { opacity: 0.9; transform: translate(calc(var(--dx) * 0.15), -15vh) scale(0.8) rotate(calc(var(--rot) * 0.2)); }
  50%  { opacity: 0.65; }
  100% { opacity: 0;   transform: translate(var(--dx), -110vh) scale(0.7) rotate(var(--rot)); }
}

.particles-0 .particle { filter: drop-shadow(0 2px 6px rgba(158, 132, 184, 0.3)); }
.particles-1 .particle { filter: drop-shadow(0 2px 6px rgba(255, 180, 100, 0.35)); }
.particles-2 .particle { filter: drop-shadow(0 2px 8px rgba(255, 214, 112, 0.4)); }
.particles-3 .particle { filter: drop-shadow(0 3px 10px rgba(255, 214, 112, 0.5)); }

/* ── Burst ring ── */
.burst-ring {
  position: absolute;
  top: 50%; left: 50%;
  width: 0; height: 0;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 3;
}

.burst-2 { border: 2px solid rgba(255, 214, 112, 0.5); box-shadow: 0 0 30px rgba(255, 214, 112, 0.25); animation: burst-expand 800ms var(--ease-out-expo) forwards; }
.burst-3 { border: 2px solid rgba(255, 230, 160, 0.6); box-shadow: 0 0 50px rgba(255, 214, 112, 0.3); animation: burst-expand 1000ms var(--ease-out-expo) forwards; }

@keyframes burst-expand {
  0%   { width: 0; height: 0; opacity: 1; }
  100% { width: 800px; height: 800px; opacity: 0; }
}

/* ── Stage ── */
.stage {
  position: relative;
  z-index: 10;
  width: min(680px, 88vw);
  text-align: center;
  padding: 40px 20px;
}

.act-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Title ── */
.act-title {
  margin: 0 0 28px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-shadow: 0 2px 12px rgba(114, 93, 66, 0.28);
  animation: title-enter 700ms var(--ease-out-expo) forwards;
}

.title-0 { font-size: 28px; color: rgba(212, 192, 232, 0.95); }
.title-1 { font-size: 30px; color: rgba(255, 210, 160, 0.95); }
.title-2 { font-size: 34px; color: rgba(255, 226, 160, 0.98); text-shadow: 0 2px 16px rgba(255, 214, 112, 0.3); }
.title-3 { font-size: 38px; color: rgba(255, 236, 180, 1); text-shadow: 0 2px 20px rgba(255, 214, 112, 0.4); letter-spacing: 0.16em; }

@keyframes title-enter {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Lines ── */
.lines { display: grid; gap: 14px; margin-bottom: 8px; }

.line {
  margin: 0;
  line-height: 1.85;
  animation: line-enter 500ms var(--ease-out-expo) forwards;
}

.line-0 { font-size: 16px; color: rgba(210, 200, 226, 0.92); }
.line-1 { font-size: 17px; color: rgba(248, 224, 200, 0.92); }
.line-2 { font-size: 19px; color: rgba(255, 232, 180, 0.96); font-weight: 600; }
.line-3 { font-size: 20px; color: rgba(255, 240, 200, 0.98); font-weight: 600; letter-spacing: 0.03em; }
.line-wish { font-size: 21px !important; text-shadow: 0 0 12px rgba(255, 214, 112, 0.25); }

@keyframes line-enter {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Candle lines ── */
.candle-lines {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 214, 112, 0.15);
  display: grid;
  gap: 8px;
  animation: fade-up 500ms var(--ease-out-expo) forwards;
}

.candle-line {
  margin: 0;
  font-size: 14px;
  font-style: italic;
  color: rgba(255, 224, 180, 0.75);
}

/* ── Signature ── */
.signature-block {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 214, 112, 0.18);
  animation: fade-up 800ms var(--ease-out-expo) forwards;
}

.attempted-sig {
  margin: 0 0 10px;
  font-size: 12px;
  color: rgba(255, 230, 180, 0.5);
  text-decoration: line-through;
  text-decoration-color: rgba(255, 214, 112, 0.4);
}

.sig-main { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 12px; }

.sig-seal {
  font-size: 28px;
  animation: seal-glow 2.4s var(--ease-in-out-sine) infinite;
  filter: drop-shadow(0 0 8px rgba(255, 214, 112, 0.5));
}

@keyframes seal-glow {
  0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 8px rgba(255, 214, 112, 0.4)); }
  50%      { transform: scale(1.12); filter: drop-shadow(0 0 16px rgba(255, 214, 112, 0.7)); }
}

.sig-text {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(255, 240, 200, 1);
  text-shadow: 0 0 12px rgba(255, 214, 112, 0.3);
}

.sig-blessing {
  margin: 0;
  font-size: 15px;
  font-style: italic;
  color: rgba(255, 230, 180, 0.82);
}

/* ── Buttons ── */
.continue-btn, .restart-btn {
  margin-top: 32px;
  padding: 12px 32px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: transform 200ms var(--ease-out-expo), filter 200ms var(--ease-out-expo), box-shadow 200ms var(--ease-out-expo);
  animation: btn-enter 500ms var(--ease-out-expo) 200ms both;
}

.continue-btn {
  background: linear-gradient(180deg, rgba(200, 180, 220, 0.30), rgba(160, 140, 200, 0.20));
  color: rgba(220, 210, 236, 0.9);
  border: 1px solid rgba(180, 160, 210, 0.30);
  box-shadow: 0 6px 16px rgba(114, 93, 66, 0.12);
}
.continue-btn:hover { transform: translateY(-2px); filter: brightness(1.15); }

.restart-btn {
  background: linear-gradient(180deg, rgba(255, 226, 160, 0.92), rgba(220, 180, 100, 0.94));
  color: #2a1a0c;
  border: 1px solid rgba(200, 160, 80, 0.4);
  box-shadow: 0 8px 20px rgba(255, 200, 100, 0.15), inset 0 1px 0 rgba(255, 255, 240, 0.3);
}
.restart-btn:hover { transform: translateY(-2px); filter: brightness(1.06); }

@keyframes btn-enter {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
