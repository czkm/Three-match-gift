<template>
  <div class="motif" :class="`p${phase}`">
    <!-- Re-erected gate post the raven will land on -->
    <span class="gate-post" />
    <span class="gate-cap" />

    <span class="pig">🐷</span>

    <!-- The raven itself -->
    <span class="raven">🕊</span>

    <!-- Feathers shaken loose during the flight -->
    <span
      v-for="n in 5"
      :key="`f-${n}`"
      class="feather"
      :style="{ '--i': n }"
    >🪶</span>

    <!-- Soft halo when the raven settles -->
    <span class="settle-halo" />
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
}

/* The gate post rises from the bottom as if rebuilt */
.gate-post {
  position: absolute;
  left: 24%;
  bottom: 18%;
  width: 14px;
  height: 90px;
  border-radius: 4px 4px 2px 2px;
  background: linear-gradient(180deg, rgba(208, 198, 184, 0.95), rgba(140, 128, 112, 0.95));
  transform: translateY(40px);
  opacity: 0;
}
.gate-cap {
  position: absolute;
  left: calc(24% - 4px);
  bottom: calc(18% + 86px);
  width: 22px;
  height: 8px;
  border-radius: 4px;
  background: rgba(168, 156, 142, 0.95);
  transform: translateY(40px);
  opacity: 0;
}
.p1 .gate-post { animation: post-rise 720ms cubic-bezier(0.22, 0.95, 0.34, 1) 200ms forwards; }
.p1 .gate-cap  { animation: post-rise 720ms cubic-bezier(0.22, 0.95, 0.34, 1) 360ms forwards; }
.pig {
  position: absolute;
  left: 12%;
  bottom: 18%;
  font-size: 24px;
  opacity: 0;
  transform: translateX(-18px);
}
.p1 .pig { animation: pig-peek 1500ms cubic-bezier(0.22, 0.9, 0.34, 1) 2100ms forwards; }
@keyframes post-rise {
  to { transform: translateY(0); opacity: 1; }
}
@keyframes pig-peek {
  0%   { opacity: 0; transform: translateX(-18px); }
  30%  { opacity: 0.92; transform: translateX(0); }
  70%  { opacity: 0.92; transform: translateX(4px); }
  100% { opacity: 0.92; transform: translateX(8px); }
}

/* Raven flies a low arc from upper-right, circles, lands */
.raven {
  position: absolute;
  right: -8%;
  top: 6%;
  font-size: 44px;
  filter: drop-shadow(0 4px 10px rgba(114, 93, 66, 0.28));
  opacity: 0;
}
.p1 .raven {
  animation: raven-arc 2400ms cubic-bezier(0.32, 0.04, 0.4, 1) 280ms forwards;
}
@keyframes raven-arc {
  0%   { transform: translate(0, 0) rotate(0);     opacity: 0; }
  10%  { opacity: 1; }
  30%  { transform: translate(-180px, -36px) rotate(-14deg); }
  55%  { transform: translate(-340px, 14px)  rotate(10deg); }
  78%  { transform: translate(-318px, 84px)  rotate(-2deg); }
  92%  { transform: translate(-322px, 96px)  rotate(0deg); }
  100% { transform: translate(-322px, 92px)  rotate(-3deg); opacity: 1; }
}

/* A handful of feathers drift out of its trail */
.feather {
  position: absolute;
  right: 12%;
  top: 18%;
  font-size: 16px;
  opacity: 0;
  filter: drop-shadow(0 1px 2px rgba(114, 93, 66, 0.16));
}
.p1 .feather {
  animation: feather-drift 2200ms ease-out forwards;
  animation-delay: calc(0.5s + var(--i) * 0.15s);
}
@keyframes feather-drift {
  0%   { transform: translate(0, 0) rotate(0deg);    opacity: 0; }
  20%  { opacity: 0.85; }
  100% { transform: translate(calc(var(--i) * -28px - 60px), calc(var(--i) * 12px + 90px)) rotate(280deg); opacity: 0; }
}

/* Halo where the raven settles */
.settle-halo {
  position: absolute;
  left: calc(24% - 18px);
  bottom: 78px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 240, 196, 0.55), transparent 70%);
  opacity: 0;
}
.p1 .settle-halo {
  animation: halo-pulse 900ms ease-out 2300ms forwards;
}
@keyframes halo-pulse {
  0%   { transform: scale(0.4); opacity: 0; }
  40%  { opacity: 0.9; }
  100% { transform: scale(1.3); opacity: 0; }
}
</style>
