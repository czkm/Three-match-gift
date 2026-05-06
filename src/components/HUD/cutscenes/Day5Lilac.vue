<template>
  <div class="motif" :class="`p${phase}`">
    <!-- Furrow of soil where the seed lands -->
    <span class="soil" />

    <!-- The seed: 🌰 -> sprout 🌱 -> herb 🌿 -> lilac 🪻 (one position, swap stages) -->
    <span class="stage seed">🌰</span>
    <span class="stage sprout">🌱</span>
    <span class="stage herb">🌿</span>
    <span class="stage lilac">🪻</span>

    <!-- Companion lilacs that bloom around the main one -->
    <span
      v-for="n in 5"
      :key="`l-${n}`"
      class="companion"
      :style="{
        '--i': n - 1,
        left: 28 + (n - 1) * 11 + '%',
        bottom: 22 + ((n - 1) % 2) * 6 + '%'
      }"
    >🪻</span>

    <!-- Pollen drifting up -->
    <span
      v-for="n in 8"
      :key="`p-${n}`"
      class="pollen"
      :style="{ '--i': n - 1, left: 30 + n * 6 + '%' }"
    />
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

/* Soil mound that receives the seed */
.soil {
  position: absolute;
  left: 50%;
  bottom: 18%;
  width: 90px;
  height: 14px;
  margin-left: -45px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(112, 78, 50, 0.95), rgba(68, 46, 28, 0.95));
  opacity: 0;
}
.p1 .soil { animation: soil-fade 500ms ease 100ms forwards; }
@keyframes soil-fade { to { opacity: 1; } }

/* Each stage shares position; we toggle which one is visible per phase */
.stage {
  position: absolute;
  left: 50%;
  bottom: 22%;
  font-size: 40px;
  transform: translateX(-50%) scale(0);
  opacity: 0;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25));
}
.p1 .seed   { animation: stage-show 360ms cubic-bezier(0.18, 0.9, 0.34, 1.4) 200ms forwards, stage-hide 200ms ease 600ms forwards; }
.p1 .sprout { animation: stage-show 360ms cubic-bezier(0.18, 0.9, 0.34, 1.4) 700ms forwards, stage-hide 200ms ease 1100ms forwards; }
.p1 .herb   { animation: stage-show 360ms cubic-bezier(0.18, 0.9, 0.34, 1.4) 1200ms forwards, stage-hide 200ms ease 1600ms forwards; }
.p1 .lilac  { animation: stage-show 540ms cubic-bezier(0.18, 0.9, 0.34, 1.6) 1700ms forwards; }

@keyframes stage-show {
  0%   { opacity: 0; transform: translateX(-50%) scale(0); }
  60%  { opacity: 1; transform: translateX(-50%) scale(1.18); }
  100% { opacity: 1; transform: translateX(-50%) scale(1); }
}
@keyframes stage-hide {
  to { opacity: 0; transform: translateX(-50%) scale(0.6); }
}

/* Lilac is the final stage, scaled larger when settled */
.lilac { font-size: 56px; }
.p1 .lilac { animation: lilac-bloom 540ms cubic-bezier(0.18, 0.9, 0.34, 1.6) 1700ms forwards; }
@keyframes lilac-bloom {
  0%   { opacity: 0; transform: translateX(-50%) scale(0); }
  60%  { opacity: 1; transform: translateX(-50%) scale(1.22); }
  100% { opacity: 1; transform: translateX(-50%) scale(1); }
}

/* Companion lilacs unfurl outward */
.companion {
  position: absolute;
  font-size: 22px;
  opacity: 0;
  transform: scale(0);
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.25));
}
.p1 .companion {
  animation: companion-bloom 520ms cubic-bezier(0.18, 0.9, 0.34, 1.6) forwards;
  animation-delay: calc(1.85s + var(--i) * 0.08s);
}
@keyframes companion-bloom {
  0%   { opacity: 0; transform: scale(0); }
  60%  { opacity: 1; transform: scale(1.18); }
  100% { opacity: 1; transform: scale(1); }
}

/* Pollen motes drift up after the bloom */
.pollen {
  position: absolute;
  bottom: 24%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 230, 170, 0.95), transparent 70%);
  opacity: 0;
}
.p1 .pollen {
  animation: pollen-rise 1300ms ease-out forwards;
  animation-delay: calc(2.0s + var(--i) * 0.06s);
}
@keyframes pollen-rise {
  0%   { opacity: 0; transform: translateY(0); }
  20%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-90px) translateX(calc(var(--i) * 6px - 24px)); }
}
</style>
