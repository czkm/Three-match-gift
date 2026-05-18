<template>
  <div class="motif" :class="`p${phase}`">
    <!-- Stable silhouette in the back -->
    <span class="stable-roof" />
    <span class="stable-frame" />
    <span class="hay" />

    <span class="pig">🐷</span>
    <span class="pig-puff">💨</span>

    <!-- Dust trail Roach kicks up -->
    <span
      v-for="n in 6"
      :key="`dust-${n}`"
      class="dust"
      :style="{ '--i': n - 1 }"
    />

    <!-- Roach trotting in -->
    <span class="roach">🐎</span>

    <!-- Carrot Roach is famously fond of -->
    <span class="carrot">🥕</span>

    <!-- A pleased "snort" puff -->
    <span class="snort">💨</span>
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

/* Stable structure rises into frame */
.stable-roof {
  position: absolute;
  left: 50%;
  bottom: calc(18% + 76px);
  width: 200px;
  height: 36px;
  margin-left: -100px;
  clip-path: polygon(8% 100%, 50% 0, 92% 100%);
  background: linear-gradient(180deg, rgba(128, 92, 56, 0.96), rgba(80, 56, 32, 0.96));
  opacity: 0;
  transform: translateY(20px);
}
.stable-frame {
  position: absolute;
  left: 50%;
  bottom: 18%;
  width: 180px;
  height: 80px;
  margin-left: -90px;
  border: 4px solid rgba(96, 68, 36, 0.86);
  border-top: none;
  opacity: 0;
  transform: translateY(20px);
}
.hay {
  position: absolute;
  left: 50%;
  bottom: 18%;
  width: 70px;
  height: 14px;
  margin-left: -50px;
  border-radius: 999px;
  background: rgba(214, 178, 84, 0.9);
  opacity: 0;
}
.p1 .stable-roof  { animation: stable-rise 700ms cubic-bezier(0.22, 0.9, 0.34, 1) 200ms forwards; }
.p1 .stable-frame { animation: stable-rise 700ms cubic-bezier(0.22, 0.9, 0.34, 1) 280ms forwards; }
.p1 .hay          { animation: hay-fade 500ms ease 800ms forwards; }
.pig {
  position: absolute;
  left: 26%;
  bottom: 18%;
  font-size: 24px;
  opacity: 0;
}
.pig-puff {
  position: absolute;
  left: 34%;
  bottom: 26%;
  font-size: 16px;
  opacity: 0;
}
.p1 .pig {
  animation:
    pig-hesitate 1400ms ease-out 900ms forwards,
    pig-scurry 800ms cubic-bezier(0.22, 0.9, 0.34, 1) 1650ms forwards;
}
.p1 .pig-puff { animation: pig-roach-puff 700ms ease-out 1760ms forwards; }
@keyframes stable-rise {
  to { opacity: 1; transform: translateY(0); }
}
@keyframes hay-fade {
  to { opacity: 1; }
}
@keyframes pig-hesitate {
  0%   { opacity: 0; transform: translateX(0); }
  20%  { opacity: 0.92; }
  100% { opacity: 0.92; transform: translateX(20px); }
}
@keyframes pig-scurry {
  from { transform: translateX(20px); opacity: 0.92; }
  to   { transform: translateX(-60px); opacity: 0.92; }
}
@keyframes pig-roach-puff {
  0%   { opacity: 0; transform: translateX(0) scale(0.8); }
  35%  { opacity: 0.82; }
  100% { opacity: 0; transform: translateX(-26px) translateY(-4px) scale(1.4); }
}

/* Roach charges in from the right edge */
.roach {
  position: absolute;
  right: -12%;
  bottom: 18%;
  font-size: 56px;
  opacity: 0;
  filter: drop-shadow(0 6px 8px rgba(114, 93, 66, 0.28));
}
.p1 .roach { animation: roach-trot 1700ms cubic-bezier(0.22, 0.9, 0.34, 1) 600ms forwards; }
@keyframes roach-trot {
  0%   { opacity: 0; transform: translateX(0)     translateY(0); }
  15%  { opacity: 1; transform: translateX(-40px) translateY(-4px); }
  35%  { transform: translateX(-160px) translateY(2px); }
  55%  { transform: translateX(-260px) translateY(-3px); }
  75%  { transform: translateX(-330px) translateY(0); }
  90%  { transform: translateX(-352px) translateY(-1px); }
  100% { transform: translateX(-348px) translateY(0); opacity: 1; }
}

/* Dust kicked up under the trot */
.dust {
  position: absolute;
  right: -6%;
  bottom: 19%;
  width: 18px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(206, 184, 156, 0.55), transparent 70%);
  opacity: 0;
}
.p1 .dust {
  animation: dust-puff 900ms ease-out forwards;
  animation-delay: calc(0.7s + var(--i) * 0.18s);
}
@keyframes dust-puff {
  0%   { opacity: 0; transform: translate(0, 0) scale(0.6); }
  25%  { opacity: 0.85; }
  100% { opacity: 0; transform: translate(calc(var(--i) * -52px - 30px), -8px) scale(1.6); }
}

/* A carrot waiting at the trough */
.carrot {
  position: absolute;
  left: 28%;
  bottom: 22%;
  font-size: 22px;
  opacity: 0;
  transform: scale(0.4);
}
.p1 .carrot { animation: carrot-pop 500ms cubic-bezier(0.18, 0.9, 0.34, 1.6) 1700ms forwards; }
@keyframes carrot-pop {
  to { opacity: 1; transform: scale(1); }
}

/* A snort puff when Roach settles */
.snort {
  position: absolute;
  left: 36%;
  bottom: 32%;
  font-size: 18px;
  opacity: 0;
}
.p1 .snort { animation: snort 700ms ease-out 1900ms forwards; }
@keyframes snort {
  0%   { opacity: 0; transform: translateX(0) scale(0.6); }
  30%  { opacity: 0.9; }
  100% { opacity: 0; transform: translateX(-20px) scale(1.3); }
}
</style>
