<template>
  <div class="motif" :class="`p${phase}`">
    <!-- Camera rail: a wide pan band that drifts left across the manor -->
    <div class="pan-camera">
      <!-- The kitchen window (camera starts here) -->
      <div class="manor-segment kitchen">
        <span class="seg-wall" />
        <span class="seg-window kitchen-window" />
        <span class="seg-glow" />
        <span class="seg-roof" />
      </div>

      <!-- The garden between the two wings -->
      <div class="manor-segment garden">
        <span class="garden-bed" />
        <span class="lilac-bush bush-a">🪻</span>
        <span class="lilac-bush bush-b">🪻</span>
        <span class="lilac-bush bush-c">🪻</span>
      </div>

      <!-- The lilac suite (camera ends here) -->
      <div class="manor-segment suite">
        <span class="seg-wall suite-wall" />
        <span class="seg-window suite-window" />
        <span class="seg-glow suite-glow" />
        <span class="curtain" />
        <span class="final-raven">🕊</span>
        <span class="vase">🪻</span>
        <span class="seg-roof suite-roof" />
      </div>
    </div>

    <span class="pig">🐖</span>

    <!-- Lilac petal storm: starts as a few, builds to a flood -->
    <span
      v-for="p in petals"
      :key="`lp-${p.id}`"
      class="lilac-petal"
      :style="{
        left: p.left + '%',
        fontSize: p.size + 'px',
        animationDelay: p.delay + 'ms',
        animationDuration: p.dur + 'ms',
        '--dx': p.dx + 'px',
        '--rot': p.rot + 'deg'
      }"
    >🪻</span>

    <!-- A soft light bloom under the curtain when the camera arrives -->
    <span class="suite-bloom" />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({ phase: { type: Number, default: 0 } });

// 28 petals with varied trajectories — flood of lilac
const petals = computed(() => {
  const arr = [];
  for (let i = 0; i < 28; i++) {
    arr.push({
      id: i,
      left: (i * 7 + (i % 3) * 4) % 100,
      size: 14 + (i % 5) * 4,
      delay: 600 + i * 90,
      dur: 2800 + (i % 4) * 350,
      dx: ((i % 7) - 3) * 50,
      rot: 240 + (i % 3) * 80
    });
  }
  return arr;
});
</script>

<style scoped>
.motif {
  position: absolute;
  inset: -20px -100px;
  pointer-events: none;
  overflow: hidden;
}

/* The pan camera: 3 segments side by side, slides leftward */
.pan-camera {
  position: absolute;
  left: 0;
  bottom: 12%;
  width: 1100px;
  height: 160px;
  display: flex;
  gap: 24px;
  transform: translateX(0);
}
.p1 .pan-camera { animation: camera-pan 4000ms cubic-bezier(0.42, 0, 0.42, 1) 200ms forwards; }
.pig {
  position: absolute;
  left: 30%;
  bottom: 16%;
  font-size: 24px;
  opacity: 0;
  z-index: 2;
}
.p1 .pig { animation: pig-homecoming 3600ms cubic-bezier(0.22, 0.9, 0.34, 1) 900ms forwards; }
@keyframes camera-pan {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-680px); }
}
@keyframes pig-homecoming {
  0%   { opacity: 0; transform: translateX(0); }
  10%  { opacity: 0.92; }
  62%  { opacity: 0.92; transform: translateX(180px); }
  76%  { opacity: 0.92; transform: translateX(212px); }
  100% { opacity: 0.92; transform: translateX(266px); }
}

/* Each manor segment is a column ~340px wide */
.manor-segment {
  position: relative;
  width: 340px;
  height: 100%;
}

.seg-wall {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 240px;
  height: 110px;
  margin-left: -120px;
  border-radius: 8px 8px 4px 4px;
  background: linear-gradient(180deg, rgba(168, 142, 110, 0.94), rgba(112, 88, 68, 0.96));
}
.suite-wall {
  background: linear-gradient(180deg, rgba(192, 170, 198, 0.94), rgba(132, 110, 138, 0.96));
}

.seg-roof {
  position: absolute;
  left: 50%;
  bottom: 102px;
  width: 264px;
  height: 28px;
  margin-left: -132px;
  clip-path: polygon(8% 100%, 50% 0, 92% 100%);
  background: rgba(96, 70, 56, 0.92);
}
.suite-roof { background: rgba(108, 86, 116, 0.94); }

.seg-window {
  position: absolute;
  left: 50%;
  bottom: 36px;
  width: 56px;
  height: 48px;
  margin-left: -28px;
  border-radius: 4px;
  background: rgba(46, 36, 30, 0.9);
  border: 3px solid rgba(140, 110, 76, 0.95);
}
.kitchen-window { /* warm orange behind */ }
.suite-window {
  border-color: rgba(176, 152, 192, 0.95);
}

.seg-glow {
  position: absolute;
  left: 50%;
  bottom: 38px;
  width: 50px;
  height: 42px;
  margin-left: -25px;
  border-radius: 3px;
  background: radial-gradient(ellipse at 50% 60%, rgba(255, 200, 110, 0.92), rgba(255, 130, 60, 0.4) 70%, transparent 100%);
}
.suite-glow {
  background: radial-gradient(ellipse at 50% 60%, rgba(243, 220, 255, 0.92), rgba(196, 168, 220, 0.5) 70%, transparent 100%);
}

/* Garden between segments */
.garden {
  width: 240px;
}
.garden-bed {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 24px;
  background: linear-gradient(180deg, rgba(96, 76, 56, 0.86), rgba(64, 48, 32, 0.96));
}
.lilac-bush {
  position: absolute;
  bottom: 18px;
  font-size: 36px;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3));
}
.bush-a { left: 18%; }
.bush-b { left: 46%; bottom: 22px; font-size: 42px; }
.bush-c { left: 76%; }

/* Suite-specific touches */
.curtain {
  position: absolute;
  left: 50%;
  bottom: 38px;
  width: 28px;
  height: 36px;
  margin-left: -14px;
  border-radius: 0 0 14px 14px;
  background: linear-gradient(180deg, rgba(214, 188, 224, 0.92), rgba(176, 152, 192, 0.92));
  transform-origin: top center;
}
.p1 .curtain { animation: curtain-sway 2.4s ease-in-out 2200ms infinite; }
@keyframes curtain-sway {
  0%, 100% { transform: rotate(0); }
  50%      { transform: rotate(4deg); }
}

.vase {
  position: absolute;
  left: 50%;
  bottom: 20px;
  margin-left: 18px;
  font-size: 22px;
}

/* Light bloom under the curtain when the camera arrives at suite */
.suite-bloom {
  position: absolute;
  right: 22%;
  bottom: 30%;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(243, 220, 255, 0.6), transparent 70%);
  opacity: 0;
}
.p1 .suite-bloom { animation: bloom-warm 1400ms ease 2400ms forwards; }
@keyframes bloom-warm {
  0%   { opacity: 0; transform: scale(0.5); }
  60%  { opacity: 0.9; }
  100% { opacity: 0.6; transform: scale(1.1); }
}

/* Lilac petal storm */
.lilac-petal {
  position: absolute;
  top: -40px;
  font-size: 18px;
  opacity: 0;
  animation-name: lilac-storm;
  animation-fill-mode: forwards;
  animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  filter: drop-shadow(0 2px 4px rgba(120, 80, 140, 0.4));
}
.p1 .lilac-petal { animation-play-state: running; }
@keyframes lilac-storm {
  0%   { transform: translate(0, 0)        rotate(0); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translate(var(--dx), 110vh) rotate(var(--rot)); opacity: 0; }
}

/* The white raven flies in to land at the suite window when camera arrives */
.final-raven {
  position: absolute;
  left: 50%;
  bottom: 86px;
  margin-left: 54px;
  font-size: 24px;
  opacity: 0.96;
  z-index: 3;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4));
  transform: rotate(8deg) scale(0.92);
}
</style>
