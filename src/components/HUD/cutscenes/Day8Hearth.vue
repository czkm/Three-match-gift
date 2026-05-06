<template>
  <div class="motif" :class="`p${phase}`">
    <!-- Kitchen wall + window + chimney -->
    <span class="kitchen-wall" />
    <span class="window" />
    <span class="chimney" />

    <!-- Window glow that warms up -->
    <span class="window-glow" />

    <!-- Geralt silhouette appears, then stirs the pot -->
    <span class="figure">🧍</span>
    <span class="pot">🍲</span>

    <!-- Smoke columns rising from the chimney -->
    <span
      v-for="n in 5"
      :key="`smoke-${n}`"
      class="smoke"
      :style="{ '--i': n - 1 }"
    />

    <!-- A few stars beginning to appear above (it's getting late) -->
    <span class="star star-a">✨</span>
    <span class="star star-b">⭐</span>
    <span class="star star-c">✨</span>
  </div>
</template>

<script setup>
defineProps({ phase: { type: Number, default: 0 } });
</script>

<style scoped>
.motif {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.kitchen-wall {
  position: absolute;
  left: 50%;
  bottom: 16%;
  width: 200px;
  height: 100px;
  margin-left: -100px;
  border-radius: 8px 8px 4px 4px;
  background: linear-gradient(180deg, rgba(168, 142, 110, 0.94), rgba(112, 88, 68, 0.96));
  opacity: 0;
  transform: translateY(20px);
}
.p1 .kitchen-wall { animation: wall-rise 700ms cubic-bezier(0.22, 0.9, 0.34, 1) 200ms forwards; }
@keyframes wall-rise {
  to { opacity: 1; transform: translateY(0); }
}

.window {
  position: absolute;
  left: 50%;
  bottom: calc(16% + 36px);
  width: 56px;
  height: 44px;
  margin-left: -28px;
  border-radius: 4px;
  background: rgba(46, 36, 30, 0.9);
  border: 3px solid rgba(140, 110, 76, 0.95);
  opacity: 0;
}
.p1 .window { animation: window-fade 500ms ease 600ms forwards; }
@keyframes window-fade { to { opacity: 1; } }

/* The window glow grows from cold to fire-warm */
.window-glow {
  position: absolute;
  left: 50%;
  bottom: calc(16% + 38px);
  width: 50px;
  height: 38px;
  margin-left: -25px;
  border-radius: 3px;
  background: radial-gradient(ellipse at 50% 60%, rgba(255, 200, 130, 0), rgba(255, 200, 130, 0));
  opacity: 0;
}
.p1 .window-glow { animation: glow-warm 1500ms ease 1000ms forwards, glow-flicker 1.6s ease-in-out 2500ms infinite; }
@keyframes glow-warm {
  0%   { opacity: 0; background: radial-gradient(ellipse at 50% 60%, rgba(255, 200, 130, 0.2),  rgba(255, 200, 130, 0)); }
  100% { opacity: 1; background: radial-gradient(ellipse at 50% 60%, rgba(255, 200, 110, 0.95), rgba(255, 130, 60, 0.4) 70%, transparent 100%); }
}
@keyframes glow-flicker {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.85; }
}

.chimney {
  position: absolute;
  left: calc(50% + 56px);
  bottom: calc(16% + 92px);
  width: 14px;
  height: 28px;
  border-radius: 4px 4px 0 0;
  background: rgba(96, 76, 60, 0.96);
  opacity: 0;
}
.p1 .chimney { animation: wall-rise 600ms cubic-bezier(0.22, 0.9, 0.34, 1) 360ms forwards; }

/* Geralt figure appears, then stirs */
.figure {
  position: absolute;
  left: 50%;
  bottom: calc(16% + 26px);
  margin-left: -8px;
  font-size: 22px;
  opacity: 0;
  filter: blur(0.4px);
}
.p1 .figure { animation: figure-fade 600ms ease 1300ms forwards, figure-stir 1.4s ease-in-out 2000ms infinite; }
@keyframes figure-fade { to { opacity: 0.9; } }
@keyframes figure-stir {
  0%, 100% { transform: translateX(-50%) rotate(0); }
  40%      { transform: translateX(calc(-50% - 2px)) rotate(-6deg); }
  70%      { transform: translateX(calc(-50% + 2px)) rotate(4deg); }
}

/* The pot at the bottom of the window */
.pot {
  position: absolute;
  left: 50%;
  bottom: calc(16% + 38px);
  margin-left: -10px;
  font-size: 18px;
  opacity: 0;
}
.p1 .pot { animation: pot-fade 500ms ease 1500ms forwards; }
@keyframes pot-fade { to { opacity: 1; } }

/* Smoke columns puffing up from chimney */
.smoke {
  position: absolute;
  left: calc(50% + 60px);
  bottom: calc(16% + 116px);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(238, 234, 226, 0.7), transparent 70%);
  opacity: 0;
}
.p1 .smoke {
  animation: smoke-rise 2200ms ease-out infinite;
  animation-delay: calc(1.4s + var(--i) * 0.5s);
}
@keyframes smoke-rise {
  0%   { opacity: 0; transform: translate(0, 0)    scale(0.6); }
  20%  { opacity: 0.7; }
  100% { opacity: 0; transform: translate(8px, -56px) scale(1.6); }
}

/* A few early evening stars */
.star {
  position: absolute;
  font-size: 14px;
  opacity: 0;
  filter: drop-shadow(0 0 6px rgba(255, 230, 180, 0.8));
}
.star-a { left: 22%; top: 18%; }
.star-b { left: 68%; top: 12%; }
.star-c { left: 84%; top: 24%; }
.p1 .star { animation: star-twinkle 1100ms ease forwards, star-twinkle-loop 2.4s ease-in-out 2200ms infinite; }
.p1 .star-a { animation-delay: 1500ms, 2500ms; }
.p1 .star-b { animation-delay: 1700ms, 2700ms; }
.p1 .star-c { animation-delay: 1900ms, 2900ms; }
@keyframes star-twinkle {
  to { opacity: 0.9; }
}
@keyframes star-twinkle-loop {
  0%, 100% { opacity: 0.9; }
  50%      { opacity: 0.4; }
}
</style>
