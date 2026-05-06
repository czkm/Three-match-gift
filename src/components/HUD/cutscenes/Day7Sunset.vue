<template>
  <div class="motif" :class="`p${phase}`">
    <!-- Sky band that shifts hue -->
    <span class="sky" />

    <!-- The sun descending towards the horizon -->
    <span class="sun" />

    <!-- Distant rolling hills -->
    <span class="hills" />

    <!-- The terrace railing with two posts -->
    <span class="rail-post post-l" />
    <span class="rail-post post-r" />
    <span class="rail-beam" />

    <!-- Two chairs sliding into place at the rail -->
    <span class="chair chair-1">🪑</span>
    <span class="chair chair-2">🪑</span>

    <!-- Long shadows cast across the terrace -->
    <span class="shadow shadow-1" />
    <span class="shadow shadow-2" />

    <!-- Quiet silhouette: the white raven on the post -->
    <span class="terrace-raven">🕊</span>
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

/* Sky band shifts from afternoon to gold-violet sunset */
.sky {
  position: absolute;
  inset: 0 0 40% 0;
  background: linear-gradient(180deg, rgba(255, 222, 168, 0.45) 0%, rgba(255, 196, 134, 0.4) 50%, rgba(220, 168, 178, 0.3) 100%);
  opacity: 0;
}
.p1 .sky { animation: sky-warm 2200ms ease forwards; }
@keyframes sky-warm {
  0%   { opacity: 0;   filter: hue-rotate(20deg); }
  40%  { opacity: 0.9; filter: hue-rotate(0deg); }
  100% { opacity: 1;   filter: hue-rotate(-12deg) saturate(1.15); }
}

/* The sun: large warm disc descending */
.sun {
  position: absolute;
  left: 50%;
  top: 16%;
  width: 64px;
  height: 64px;
  margin-left: -32px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 232, 178, 0.98) 0%, rgba(244, 168, 96, 0.94) 60%, rgba(228, 124, 84, 0.7) 100%);
  box-shadow: 0 0 60px rgba(255, 200, 130, 0.6);
  opacity: 0;
}
.p1 .sun { animation: sun-descend 2400ms cubic-bezier(0.32, 0.04, 0.4, 1) 200ms forwards; }
@keyframes sun-descend {
  0%   { opacity: 0; transform: translateY(-24px) scale(0.92); }
  20%  { opacity: 1; }
  100% { opacity: 1; transform: translateY(40px) scale(1.08); }
}

/* Hills as a subtle silhouette band */
.hills {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 32%;
  height: 24px;
  background: linear-gradient(180deg, rgba(110, 78, 96, 0.36), rgba(70, 52, 70, 0.5));
  clip-path: polygon(0 70%, 12% 32%, 22% 64%, 36% 38%, 48% 60%, 62% 32%, 74% 64%, 86% 42%, 100% 70%, 100% 100%, 0 100%);
  opacity: 0;
}
.p1 .hills { animation: hills-in 700ms ease 600ms forwards; }
@keyframes hills-in {
  to { opacity: 1; }
}

/* Terrace railing */
.rail-post {
  position: absolute;
  bottom: 18%;
  width: 6px;
  height: 36px;
  border-radius: 2px;
  background: rgba(112, 92, 70, 0.82);
  opacity: 0;
}
.post-l { left: 26%; }
.post-r { left: 72%; }
.rail-beam {
  position: absolute;
  left: 24%;
  right: 26%;
  bottom: calc(18% + 32px);
  height: 4px;
  border-radius: 2px;
  background: rgba(132, 100, 70, 0.86);
  opacity: 0;
}
.p1 .rail-post,
.p1 .rail-beam { animation: rail-fade 600ms ease 700ms forwards; }
@keyframes rail-fade {
  to { opacity: 1; }
}

/* Two chairs slide in, second arriving slower (the wait-for-her beat) */
.chair {
  position: absolute;
  bottom: 20%;
  font-size: 32px;
  opacity: 0;
  filter: drop-shadow(0 4px 6px rgba(56, 32, 20, 0.5));
}
.chair-1 { left: 36%; }
.chair-2 { left: 56%; }
.p1 .chair-1 { animation: chair-slide-l 800ms cubic-bezier(0.22, 0.9, 0.34, 1) 1100ms forwards; }
.p1 .chair-2 { animation: chair-slide-r 900ms cubic-bezier(0.22, 0.9, 0.34, 1) 1500ms forwards; }
@keyframes chair-slide-l {
  from { opacity: 0; transform: translateX(-80px) rotate(-8deg); }
  to   { opacity: 1; transform: translateX(0) rotate(0); }
}
@keyframes chair-slide-r {
  from { opacity: 0; transform: translateX(80px) rotate(8deg); }
  to   { opacity: 1; transform: translateX(0) rotate(0); }
}

/* Long sunset shadows under the chairs */
.shadow {
  position: absolute;
  bottom: 18%;
  width: 56px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(60, 36, 30, 0.6), transparent 70%);
  opacity: 0;
  transform: scaleX(0.4);
}
.shadow-1 { left: 32%; transform-origin: left; }
.shadow-2 { left: 52%; transform-origin: left; }
.p1 .shadow-1 { animation: shadow-stretch 900ms ease 1500ms forwards; }
.p1 .shadow-2 { animation: shadow-stretch 900ms ease 1900ms forwards; }
@keyframes shadow-stretch {
  to { opacity: 0.8; transform: scaleX(2.4); }
}

/* The white raven settles silently on the right rail post */
.terrace-raven {
  position: absolute;
  left: 70%;
  top: 30%;
  font-size: 28px;
  opacity: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
}
.p1 .terrace-raven { animation: terrace-raven-settle 800ms cubic-bezier(0.22, 0.9, 0.34, 1) 2100ms forwards; }
@keyframes terrace-raven-settle {
  0%   { opacity: 0; transform: translate(20px, -16px) rotate(8deg); }
  100% { opacity: 1; transform: translate(0, 0)        rotate(0); }
}
</style>
