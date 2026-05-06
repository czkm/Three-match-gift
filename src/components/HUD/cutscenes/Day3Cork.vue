<template>
  <div class="motif" :class="`p${phase}`">
    <!-- Two barrels rolling into place -->
    <span class="barrel barrel-l">🛢️</span>
    <span class="barrel barrel-r">🛢️</span>

    <!-- The wine bottle that gets uncorked -->
    <span class="bottle">🍾</span>

    <!-- The cork itself, popping skyward -->
    <span class="cork" />

    <!-- Burst of golden mist -->
    <span class="mist" />
    <span
      v-for="n in 10"
      :key="`spark-${n}`"
      class="spark"
      :style="{ '--i': n - 1 }"
    >✨</span>

    <!-- Single lit lantern reveals the cellar -->
    <span class="lantern">🕯️</span>
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

.barrel {
  position: absolute;
  bottom: 18%;
  font-size: 28px;
  opacity: 0;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35));
}
.barrel-l { left: 22%; }
.barrel-r { right: 22%; }
.p1 .barrel-l { animation: barrel-roll-l 800ms cubic-bezier(0.22, 0.9, 0.34, 1) 200ms forwards; }
.p1 .barrel-r { animation: barrel-roll-r 800ms cubic-bezier(0.22, 0.9, 0.34, 1) 320ms forwards; }
@keyframes barrel-roll-l {
  from { opacity: 0; transform: translateX(-80px) rotate(-180deg); }
  to   { opacity: 1; transform: translateX(0) rotate(0); }
}
@keyframes barrel-roll-r {
  from { opacity: 0; transform: translateX(80px) rotate(180deg); }
  to   { opacity: 1; transform: translateX(0) rotate(0); }
}

.bottle {
  position: absolute;
  left: 50%;
  bottom: 22%;
  transform: translateX(-50%) scale(0.4);
  font-size: 56px;
  opacity: 0;
  filter: drop-shadow(0 6px 12px rgba(82, 41, 14, 0.4));
}
.p1 .bottle { animation: bottle-rise 700ms cubic-bezier(0.18, 0.9, 0.34, 1.4) 600ms forwards; }
@keyframes bottle-rise {
  0%   { opacity: 0; transform: translate(-50%, 30px) scale(0.4); }
  60%  { opacity: 1; transform: translate(-50%, -4px) scale(1.1); }
  100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
}

/* Cork pops out the top */
.cork {
  position: absolute;
  left: 50%;
  bottom: calc(22% + 56px);
  width: 12px;
  height: 14px;
  margin-left: -6px;
  border-radius: 3px;
  background: linear-gradient(180deg, #c79964, #8b6233);
  opacity: 0;
}
.p1 .cork { animation: cork-pop 900ms cubic-bezier(0.2, 0.4, 0.4, 1) 1300ms forwards; }
@keyframes cork-pop {
  0%   { opacity: 0; transform: translateY(0) rotate(0); }
  10%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-130px) rotate(540deg); }
}

/* Golden mist spreads outward */
.mist {
  position: absolute;
  left: 50%;
  bottom: calc(22% + 50px);
  width: 14px;
  height: 14px;
  margin-left: -7px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 130, 0.9), rgba(255, 180, 90, 0.0) 70%);
  opacity: 0;
}
.p1 .mist { animation: mist-bloom 1100ms ease-out 1320ms forwards; }
@keyframes mist-bloom {
  0%   { opacity: 0; transform: scale(0.4); }
  30%  { opacity: 0.9; }
  100% { opacity: 0; transform: scale(8); }
}

/* Sparkles fly in a fan above the bottle */
.spark {
  position: absolute;
  left: 50%;
  bottom: calc(22% + 48px);
  font-size: 14px;
  opacity: 0;
}
.p1 .spark {
  animation: spark-fan 1100ms ease-out forwards;
  animation-delay: calc(1.32s + var(--i) * 0.04s);
}
@keyframes spark-fan {
  0%   { opacity: 0; transform: translate(-50%, 0) scale(0.4); }
  20%  { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + (var(--i) - 4.5) * 26px), -90px) scale(1.1); }
}

.lantern {
  position: absolute;
  right: 14%;
  top: 16%;
  font-size: 26px;
  opacity: 0;
  filter: drop-shadow(0 0 12px rgba(255, 200, 110, 0.6));
}
.p1 .lantern { animation: lantern-on 700ms ease 1500ms forwards; }
@keyframes lantern-on {
  from { opacity: 0; transform: scale(0.6); }
  to   { opacity: 1; transform: scale(1); }
}
</style>
