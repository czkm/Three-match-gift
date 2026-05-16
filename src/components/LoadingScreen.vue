<template>
  <div class="loading-screen">
    <!-- Blob SVG clip-path (also used by CbModal) -->
    <svg style="position:absolute;width:0;height:0" aria-hidden>
      <defs>
        <clipPath id="animal-modal-clip" clipPathUnits="objectBoundingBox">
          <path d="M0.501,0.005 L0.501,0.005 L0.523,0.005 L0.549,0.006
            C0.704,0.01,0.796,0.017,0.825,0.027 L0.827,0.028
            C0.872,0.045,0.939,0.044,0.978,0.17
            C1,0.254,1,0.365,0.99,0.505 L0.988,0.513
            C0.979,0.558,0.971,0.598,0.965,0.633
            C0.956,0.689,0.979,0.77,0.964,0.865
            C0.953,0.928,0.921,0.966,0.869,0.979
            C0.821,0.986,0.773,0.992,0.726,0.995
            L0.712,0.996 L0.694,0.997
            C0.648,1,0.586,1,0.507,1 L0.501,1 L0.464,1
            C0.385,1,0.325,0.998,0.283,0.995
            C0.234,0.992,0.184,0.987,0.133,0.979
            C0.081,0.966,0.05,0.928,0.039,0.865
            C0.023,0.77,0.047,0.689,0.037,0.633
            C0.031,0.595,0.023,0.552,0.013,0.505
            C-0.006,0.365,-0.002,0.254,0.024,0.17
            C0.064,0.045,0.13,0.045,0.174,0.028 L0.175,0.028
            C0.204,0.017,0.303,0.009,0.474,0.005 L0.501,0.005"/>
        </clipPath>
      </defs>
    </svg>

    <!-- Background with day-tinted warm gradient -->
    <div class="loading-bg" />

    <!-- Central logo card (blob shape) -->
    <div class="loading-card">
      <p class="loading-emblem">🏰</p>
      <h1 class="loading-title">Corvo Bianco</h1>
      <h2 class="loading-subtitle">白鸦葡萄园</h2>
      <p class="loading-tagline">一个温柔的三消修复礼物游戏</p>

      <!-- Progress bar -->
      <div class="loading-progress-wrap">
        <div class="loading-progress-track">
          <div
            class="loading-progress-fill"
            :style="{ width: displayProgress + '%' }"
          />
        </div>
        <p class="loading-status">{{ statusText }}</p>
      </div>

      <!-- Resource emoji bounce -->
      <div class="loading-resources">
        <span
          v-for="(emoji, i) in resourceEmojis"
          :key="i"
          class="loading-resource-chip"
          :style="{ animationDelay: (i * 0.15) + 's' }"
        >{{ emoji }}</span>
      </div>
    </div>

    <!-- Bottom wave decoration -->
    <div class="loading-wave">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path
          d="M0,60 C120,20 240,100 360,60 C480,20 600,100 720,60 C840,20 960,100 1080,60 C1200,20 1320,100 1440,60 L1440,120 L0,120 Z"
          fill="#82d5bb"
          opacity="0.3"
        />
        <path
          d="M0,80 C160,40 320,110 480,70 C640,30 800,110 960,70 C1120,30 1280,100 1440,80 L1440,120 L0,120 Z"
          fill="#8ac68a"
          opacity="0.25"
        />
        <path
          d="M0,95 C180,65 360,115 540,85 C720,55 900,115 1080,85 C1260,55 1380,100 1440,90 L1440,120 L0,120 Z"
          fill="#6fba2c"
          opacity="0.2"
        />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  progress: { type: Number, default: 0 },
});

const displayProgress = ref(0);
const bounceEmojis = ref([true, false, false]);

let bounceTimer = null;

const resourceEmojis = ['🍇', '🪵', '🪨'];

const statusText = computed(() => {
  if (displayProgress.value < 30) return '正在准备修复工具...';
  if (displayProgress.value < 60) return '正在召集精灵...';
  if (displayProgress.value < 90) return '正在修缮庄园...';
  return '即将开始冒险！';
});

// Animate progress smoothly
let raf = null;
function animateProgress() {
  const diff = props.progress - displayProgress.value;
  if (Math.abs(diff) > 0.5) {
    displayProgress.value += diff * 0.08;
    raf = requestAnimationFrame(animateProgress);
  } else {
    displayProgress.value = props.progress;
  }
}

// Bounce animation for resource chips
function startBounce() {
  let idx = 0;
  bounceTimer = setInterval(() => {
    bounceEmojis.value = bounceEmojis.value.map((_, i) => i === idx % 3);
    idx++;
  }, 500);
}

onMounted(() => {
  animateProgress();
  startBounce();
});

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf);
  if (bounceTimer) clearInterval(bounceTimer);
});
</script>

<style scoped>
.loading-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  animation: loading-fade-in 0.6s ease-out forwards;
}

.loading-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 30% 30%, rgba(25, 200, 185, 0.06) 0%, transparent 40%),
    radial-gradient(circle at 70% 20%, rgba(247, 205, 103, 0.08) 0%, transparent 35%),
    linear-gradient(180deg, #f8f8f0 0%, rgb(247, 243, 223) 50%, #e8dfc8 100%);
  z-index: 0;
}

/* ── Logo card (blob shape) ── */
.loading-card {
  position: relative;
  z-index: 2;
  clip-path: url(#animal-modal-clip);
  background: rgb(247, 243, 223);
  padding: 48px 56px 40px;
  width: min(460px, 88vw);
  text-align: center;
  animation: card-bounce-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.loading-emblem {
  font-size: 48px;
  margin: 0 0 8px;
  animation: emblem-float 3s ease-in-out infinite;
}

.loading-title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: #794f27;
  letter-spacing: 0.04em;
  font-family: 'Nunito', sans-serif;
}

.loading-subtitle {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 600;
  color: #9f927d;
  letter-spacing: 0.02em;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.loading-tagline {
  margin: 12px 0 24px;
  font-size: 13px;
  font-weight: 500;
  color: #8a7b66;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

/* ── Progress bar ── */
.loading-progress-wrap {
  margin: 0 auto 20px;
  max-width: 300px;
}

.loading-progress-track {
  height: 28px;
  border-radius: 50px;
  background: #eae4d0;
  border: 2.5px solid #d4c9b4;
  box-shadow: 0 3px 0 0 #d4c9b4;
  overflow: hidden;
  position: relative;
}

.loading-progress-fill {
  height: 100%;
  border-radius: 50px;
  background-image: repeating-linear-gradient(
    -45deg,
    #19c8b9, #19c8b9 10px,
    #11a89b 10px, #11a89b 20px
  );
  background-size: 28.28px 28.28px;
  animation: stripe-move 1s linear infinite;
  transition: width 0.3s ease-out;
  min-width: 0;
}

.loading-status {
  margin: 10px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: #8a7b66;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

/* ── Resource emoji chips ── */
.loading-resources {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.loading-resource-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50px;
  background: #eae4d0;
  border: 2px solid #d4c9b4;
  box-shadow: 0 3px 0 0 #d4c9b4;
  font-size: 22px;
  animation: resource-bounce 1.2s ease-in-out infinite;
}

/* ── Bottom wave ── */
.loading-wave {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  z-index: 1;
}

.loading-wave svg {
  width: 100%;
  height: 100%;
}

/* ── Animations ── */
@keyframes loading-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes card-bounce-in {
  0%   { opacity: 0; transform: scale(0.85) translateY(20px); }
  60%  { opacity: 1; transform: scale(1.03) translateY(-4px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes emblem-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}

@keyframes stripe-move {
  0%   { background-position: 0 0; }
  100% { background-position: -28.28px 0; }
}

@keyframes resource-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  30%      { transform: translateY(-8px) scale(1.08); }
  50%      { transform: translateY(-4px) scale(1.04); }
}
</style>
