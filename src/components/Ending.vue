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
      <div class="stage-card" :class="`card-act-${currentAct}`">
        <!-- Act decoration -->
        <div class="act-decoration">
          <span v-if="currentAct === 0" class="deco-icon">🪻</span>
          <span v-if="currentAct === 1" class="deco-icon">🎂</span>
        </div>

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

        <!-- Candle ceremony (wishes act) -->
        <div v-if="currentAct === 2" class="candle-ceremony">
          <div class="candle-row">
            <div
              v-for="n in 3"
              :key="`c-${n}`"
              class="candle-unit"
              :class="{ lit: n <= linesRevealed }"
            >
              <span class="candle-flame">{{ n <= linesRevealed ? '🔥' : '🕯️' }}</span>
              <span class="candle-label">
                {{ ['健康','快乐','平安'][n-1] }}
              </span>
            </div>
          </div>
        </div>

        <!-- Candle lines (wishes act) -->
        <div v-if="currentAct === 2 && allLinesShown" class="candle-lines">
          <p
            v-for="(line, idx) in ENDING.candleLines"
            :key="`candle-${idx}`"
            class="candle-line"
          ><span class="candle-marker">{{ ['🕯️','🕯️','🕯️'][idx] }}</span>{{ line }}</p>
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
          :class="`btn-act-${currentAct}`"
          @click.stop="onAdvance"
        >{{ advanceLabel }}</button>

        <button
          v-if="currentAct === 3 && allLinesShown"
          class="restart-btn"
          @click.stop="onAdvance"
        >再开一座葡萄园</button>
      </div>
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

const advanceLabel = computed(() => {
  const labels = ['走进生日夜', '点亮蜡烛', '留下祝福']
  return labels[currentAct.value] || '继续'
});

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
  background: rgba(184, 164, 136, 0.28);
  backdrop-filter: blur(4px);
}

/* ── Backgrounds — warm parchment tones, subtle act tints ── */
.bg-base {
  position: absolute;
  inset: 0;
  transition: background 1.4s var(--ease-out-expo);
}

.act-0 .bg-base {
  background:
    radial-gradient(ellipse at 20% 80%, rgba(168, 148, 192, 0.16), transparent 55%),
    radial-gradient(ellipse at 80% 20%, rgba(218, 200, 232, 0.12), transparent 50%),
    linear-gradient(180deg, #f7f3ea 0%, #f0e8f0 40%, #e8dfea 100%);
}
.act-1 .bg-base {
  background:
    radial-gradient(ellipse at 40% 70%, rgba(220, 170, 120, 0.14), transparent 55%),
    radial-gradient(ellipse at 70% 25%, rgba(240, 200, 140, 0.12), transparent 50%),
    linear-gradient(180deg, #f7f3e8 0%, #f2ebe2 40%, #ece2d4 100%);
}
.act-2 .bg-base {
  background:
    radial-gradient(ellipse at 50% 60%, rgba(224, 190, 120, 0.18), transparent 55%),
    radial-gradient(ellipse at 30% 30%, rgba(240, 210, 140, 0.14), transparent 50%),
    linear-gradient(180deg, #f8f4e6 0%, #f3eddc 40%, #ede4d0 100%);
}
.act-3 .bg-base {
  background:
    radial-gradient(ellipse at 50% 50%, rgba(240, 210, 140, 0.22), transparent 55%),
    radial-gradient(ellipse at 70% 60%, rgba(230, 200, 130, 0.16), transparent 60%),
    linear-gradient(180deg, #f8f4e4 0%, #f4ecda 40%, #efe4d2 100%);
}

.bg-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: background 1.4s var(--ease-out-expo);
}

.glow-0 {
  background:
    radial-gradient(ellipse at 50% 35%, rgba(168, 148, 200, 0.14), transparent 50%),
    radial-gradient(circle at 35% 65%, rgba(180, 160, 210, 0.08), transparent 40%);
}
.glow-1 {
  background:
    radial-gradient(ellipse at 50% 40%, rgba(210, 160, 110, 0.16), transparent 50%),
    radial-gradient(circle at 65% 55%, rgba(200, 140, 80, 0.08), transparent 40%);
}
.glow-2 {
  background:
    radial-gradient(ellipse at 50% 35%, rgba(220, 185, 110, 0.20), transparent 50%),
    radial-gradient(circle at 45% 60%, rgba(200, 165, 90, 0.10), transparent 40%);
}
.glow-3 {
  background:
    radial-gradient(ellipse at 50% 35%, rgba(230, 200, 130, 0.24), transparent 50%),
    radial-gradient(circle at 55% 55%, rgba(220, 185, 110, 0.12), transparent 60%);
}

/* ── Starfield — warm amber stars on parchment ── */
.starfield { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.starfield.intense .star { animation-duration: 1.6s !important; }

.star {
  position: absolute;
  border-radius: 50%;
  background: rgba(200, 170, 120, 0.55);
  box-shadow: 0 0 3px 1px rgba(180, 150, 100, 0.18);
  animation: star-twinkle var(--ease-in-out-sine) infinite;
}

@keyframes star-twinkle {
  0%, 100% { opacity: 0.15; transform: scale(0.5); }
  50%      { opacity: 0.8;  transform: scale(1.2); }
}

/* ── Particles ── */
.particle-layer { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 2; }

.particle {
  position: absolute;
  bottom: -30px;
  opacity: 0;
  animation: p-rise var(--ease-in-out-sine) infinite;
}

@keyframes p-rise {
  0%   { opacity: 0;   transform: translate(0, 0) scale(0.5) rotate(0deg); }
  12%  { opacity: 0.85; transform: translate(calc(var(--dx) * 0.15), -15vh) scale(0.8) rotate(calc(var(--rot) * 0.2)); }
  50%  { opacity: 0.55; }
  100% { opacity: 0;   transform: translate(var(--dx), -110vh) scale(0.7) rotate(var(--rot)); }
}

.particles-0 .particle { filter: drop-shadow(0 1px 3px rgba(140, 120, 170, 0.22)); }
.particles-1 .particle { filter: drop-shadow(0 1px 3px rgba(180, 130, 80, 0.25)); }
.particles-2 .particle { filter: drop-shadow(0 1px 3px rgba(200, 160, 90, 0.30)); }
.particles-3 .particle { filter: drop-shadow(0 2px 4px rgba(200, 160, 90, 0.35)); }

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

.burst-2 { border: 2px solid rgba(200, 160, 90, 0.45); box-shadow: 0 0 40px rgba(220, 180, 110, 0.18); animation: burst-expand 800ms var(--ease-out-expo) forwards; }
.burst-3 { border: 2px solid rgba(220, 185, 110, 0.55); box-shadow: 0 0 60px rgba(240, 200, 130, 0.24); animation: burst-expand 1000ms var(--ease-out-expo) forwards; }

@keyframes burst-expand {
  0%   { width: 0; height: 0; opacity: 1; }
  100% { width: 800px; height: 800px; opacity: 0; }
}

/* ── Stage layout ── */
.stage {
  position: relative;
  z-index: 10;
  width: min(680px, 88vw);
}

/* ── Stage card — blob parchment card ── */
.stage-card {
  clip-path: url(#animal-modal-clip);
  background: rgba(248, 243, 230, 0.94);
  box-shadow:
    0 4px 16px rgba(107, 92, 67, 0.32),
    inset 0 1px 0 rgba(255, 252, 245, 0.40);
  padding: 44px 36px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: card-enter 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms both;
}

@keyframes card-enter {
  from { opacity: 0; transform: translateY(16px) scale(0.94); }
  60%  { opacity: 1; transform: translateY(-4px) scale(1.02); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Final act card — warm golden halo */
.card-act-3 {
  box-shadow:
    0 4px 16px rgba(107, 92, 67, 0.32),
    0 0 60px 20px rgba(240, 210, 140, 0.16),
    0 0 120px 40px rgba(230, 200, 130, 0.08),
    inset 0 1px 0 rgba(255, 252, 245, 0.40);
}

.act-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* ── Act decoration ── */
.act-decoration {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
}

.deco-icon {
  font-size: 36px;
  line-height: 1;
  animation: deco-float 3s ease-in-out infinite;
  filter: drop-shadow(0 1px 3px rgba(114, 93, 66, 0.14));
}

@keyframes deco-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-6px) rotate(3deg); }
}

/* ── Title — warm brown with act accent ── */
.act-title {
  margin: 0 0 26px;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  font-weight: 800;
  letter-spacing: 0.10em;
  text-shadow: 0 1px 2px rgba(114, 93, 66, 0.12);
  animation: title-enter 700ms var(--ease-out-expo) forwards;
}

.title-0 { font-size: 28px; color: #7b6694; }
.title-1 { font-size: 30px; color: #8b5a3c; }
.title-2 { font-size: 34px; color: #8b6d34; letter-spacing: 0.12em; }
.title-3 { font-size: 38px; color: #7a5c28; letter-spacing: 0.14em; }

@keyframes title-enter {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Lines — warm brown body text ── */
.lines { display: grid; gap: 14px; margin-bottom: 8px; width: 100%; }

.line {
  margin: 0;
  line-height: 1.85;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  animation: line-enter 500ms var(--ease-out-expo) forwards;
}

.line-0 { font-size: 16px; color: #6b5a7a; }
.line-1 { font-size: 17px; color: #7a5436; }
.line-2 { font-size: 19px; color: #7a5c30; font-weight: 600; }
.line-3 { font-size: 20px; color: #6b4e22; font-weight: 600; letter-spacing: 0.03em; }
.line-wish { font-size: 21px !important; text-shadow: 0 1px 2px rgba(140, 110, 60, 0.12); }

@keyframes line-enter {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Candle ceremony (wishes act) ── */
.candle-ceremony {
  width: 100%;
  margin: 12px 0 6px;
}

.candle-row {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.candle-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.6s var(--ease-out-expo);
}

.candle-flame {
  font-size: 26px;
  line-height: 1;
  transition: all 0.5s var(--ease-out-expo);
  filter: drop-shadow(0 1px 2px rgba(114, 93, 66, 0.10));
}

.candle-unit.lit .candle-flame {
  font-size: 28px;
  filter: drop-shadow(0 0 8px rgba(240, 180, 80, 0.55))
    drop-shadow(0 1px 2px rgba(180, 130, 60, 0.20));
  animation: candle-flicker 2s ease-in-out infinite;
}

@keyframes candle-flicker {
  0%, 100% { transform: scale(1); }
  25%      { transform: scale(1.08) rotate(-2deg); }
  75%      { transform: scale(1.05) rotate(2deg); }
}

.candle-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.10em;
  color: #9f927d;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  transition: color 0.5s var(--ease-out-expo);
}

.candle-unit.lit .candle-label {
  color: #8b6914;
}

/* ── Candle lines ── */
.candle-lines {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(140, 110, 60, 0.15);
  display: grid;
  gap: 10px;
  width: 100%;
  animation: fade-up 500ms var(--ease-out-expo) forwards;
}

.candle-line {
  margin: 0;
  font-size: 14px;
  font-style: italic;
  color: #8a7b66;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.candle-marker {
  margin-right: 6px;
  font-style: normal;
  filter: drop-shadow(0 0 4px rgba(240, 180, 80, 0.3));
}

/* ── Signature ── */
.signature-block {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid rgba(140, 110, 60, 0.16);
  width: 100%;
  animation: fade-up 800ms var(--ease-out-expo) forwards;
}

.attempted-sig {
  margin: 0 0 10px;
  font-size: 12px;
  color: #9f927d;
  text-decoration: line-through;
  text-decoration-color: rgba(160, 130, 90, 0.35);
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.sig-main { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 12px; }

.sig-seal {
  font-size: 28px;
  animation: seal-glow 2.4s var(--ease-in-out-sine) infinite;
  filter: drop-shadow(0 1px 4px rgba(140, 110, 60, 0.25));
}

@keyframes seal-glow {
  0%, 100% { transform: scale(1);    filter: drop-shadow(0 1px 4px rgba(140, 110, 60, 0.20)); }
  50%      { transform: scale(1.10); filter: drop-shadow(0 1px 8px rgba(160, 130, 80, 0.35)); }
}

.sig-text {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.10em;
  color: #6b4e22;
  text-shadow: 0 1px 2px rgba(114, 93, 66, 0.08);
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.sig-blessing {
  margin: 0;
  font-size: 15px;
  font-style: italic;
  color: #8a7b66;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

/* ── Buttons — Animal Island 3D style ── */
.continue-btn, .restart-btn {
  margin-top: 32px;
  padding: 12px 36px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.08em;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  cursor: pointer;
  border: none;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: btn-enter 500ms var(--ease-out-expo) 200ms both;
}

.continue-btn {
  box-shadow: 0 5px #bdaea0;
  transform: translateY(0);
}
.continue-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.04);
}
.continue-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px #bdaea0;
}

/* Act-specific continue button colors */
.btn-act-0 {
  background: linear-gradient(180deg, #f0e8f6 0%, #ddd0ea 100%);
  color: #6b5a7a;
  border: 1px solid rgba(140, 120, 170, 0.25);
}
.btn-act-0:hover {
  box-shadow: 0 6px #bdaea0, 0 8px 18px rgba(140, 120, 170, 0.12);
}
.btn-act-1 {
  background: linear-gradient(180deg, #faf0e0 0%, #f0dcc0 100%);
  color: #7a5030;
  border: 1px solid rgba(180, 130, 80, 0.30);
}
.btn-act-1:hover {
  box-shadow: 0 6px #bdaea0, 0 8px 18px rgba(200, 150, 90, 0.14);
}
.btn-act-2 {
  background: linear-gradient(180deg, #fef4d8 0%, #f5e0a8 100%);
  color: #6b4e20;
  border: 1px solid rgba(180, 140, 70, 0.30);
}
.btn-act-2:hover {
  box-shadow: 0 6px #bdaea0, 0 8px 18px rgba(200, 160, 80, 0.16);
}

.restart-btn {
  background: linear-gradient(180deg, #f8ecc8 0%, #e8d494 100%);
  color: #5a3e1a;
  border: 1px solid rgba(180, 140, 70, 0.35);
  box-shadow: 0 5px #bdaea0, inset 0 1px 0 rgba(255, 252, 240, 0.4);
  transform: translateY(0);
}
.restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px #bdaea0, 0 8px 22px rgba(200, 160, 80, 0.18), inset 0 1px 0 rgba(255, 252, 240, 0.4);
  filter: brightness(1.03);
}
.restart-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px #bdaea0, inset 0 1px 0 rgba(255, 252, 240, 0.4);
}

@keyframes btn-enter {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
