<template>
  <div class="motif" :class="`p${phase}`">
    <!-- Greenhouse silhouette: glass body + roof + door + lamp -->
    <span class="g-body" />
    <span class="g-roof" />
    <span class="g-door" />

    <span class="pig">🐷</span>

    <!-- The 6 panes that light up sequentially -->
    <span
      v-for="n in 6"
      :key="`pane-${n}`"
      class="pane"
      :style="{ '--i': n - 1 }"
    />

    <!-- The interior lamp -->
    <span class="lamp" />

    <!-- Plant silhouettes inside, fading in once panes are warm -->
    <span class="silhouette s-a">🌿</span>
    <span class="silhouette s-b">🪻</span>
    <span class="silhouette s-c">🌱</span>

    <!-- Warm motes drifting from the door -->
    <span
      v-for="n in 6"
      :key="`mote-${n}`"
      class="warm-mote"
      :style="{ '--i': n - 1 }"
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

.g-body {
  position: absolute;
  left: 50%;
  bottom: 18%;
  width: 220px;
  height: 110px;
  margin-left: -110px;
  border: 2px solid rgba(150, 142, 132, 0.78);
  border-radius: 8px 8px 4px 4px;
  background: rgba(220, 220, 218, 0.16);
  opacity: 0;
  transform: translateY(20px);
}
.g-roof {
  position: absolute;
  left: 50%;
  bottom: calc(18% + 104px);
  width: 240px;
  height: 24px;
  margin-left: -120px;
  clip-path: polygon(8% 100%, 50% 0, 92% 100%);
  background: rgba(170, 162, 152, 0.86);
  opacity: 0;
  transform: translateY(20px);
}
.g-door {
  position: absolute;
  left: 50%;
  bottom: 18%;
  width: 28px;
  height: 56px;
  margin-left: -14px;
  border-radius: 14px 14px 4px 4px;
  background: linear-gradient(180deg, rgba(96, 78, 60, 0.92), rgba(56, 42, 28, 0.94));
  opacity: 0;
  transform: translateY(20px);
}
.p1 .g-body { animation: greenhouse-rise 700ms cubic-bezier(0.22, 0.9, 0.34, 1) 200ms forwards; }
.p1 .g-roof { animation: greenhouse-rise 700ms cubic-bezier(0.22, 0.9, 0.34, 1) 320ms forwards; }
.p1 .g-door { animation: greenhouse-rise 700ms cubic-bezier(0.22, 0.9, 0.34, 1) 420ms forwards; }
.pig {
  position: absolute;
  left: 42%;
  bottom: 16%;
  font-size: 24px;
  opacity: 0;
}
.p1 .pig { animation: pig-door-sniff 2200ms ease-in-out 1280ms forwards; }
@keyframes greenhouse-rise {
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pig-door-sniff {
  0%   { opacity: 0; transform: translateX(0); }
  20%  { opacity: 0.92; }
  58%  { opacity: 0.92; transform: translateX(18px); }
  100% { opacity: 0.92; transform: translateX(8px); }
}

/* Six glass panes that pulse on in sequence */
.pane {
  position: absolute;
  left: calc(50% - 96px + var(--i) * 32px);
  bottom: calc(18% + 28px);
  width: 24px;
  height: 56px;
  border-radius: 3px;
  background: rgba(214, 214, 210, 0.14);
  border: 1px solid rgba(150, 142, 132, 0.34);
  box-shadow: inset 0 0 0 0 rgba(255, 220, 150, 0);
  transition: none;
}
.p1 .pane {
  animation: pane-warm 700ms ease forwards;
  animation-delay: calc(1.0s + var(--i) * 0.12s);
}
@keyframes pane-warm {
  0%   { background: rgba(214, 214, 210, 0.14); box-shadow: inset 0 0 0 0 rgba(255, 220, 150, 0); }
  100% { background: rgba(252, 226, 168, 0.42); box-shadow: inset 0 0 14px rgba(255, 220, 150, 0.55); }
}

/* Central lamp */
.lamp {
  position: absolute;
  left: 50%;
  bottom: calc(18% + 60px);
  width: 14px;
  height: 14px;
  margin-left: -7px;
  border-radius: 50%;
  background: rgba(255, 220, 150, 0.5);
  box-shadow: 0 0 8px rgba(255, 220, 150, 0.4);
  opacity: 0;
}
.p1 .lamp { animation: lamp-on 600ms ease 1500ms forwards, lamp-flicker 1.4s ease-in-out 2100ms infinite; }
@keyframes lamp-on {
  from { opacity: 0; transform: scale(0.4); }
  to   { opacity: 1; transform: scale(1); box-shadow: 0 0 22px rgba(255, 220, 150, 0.7); }
}
@keyframes lamp-flicker {
  0%, 100% { box-shadow: 0 0 22px rgba(255, 220, 150, 0.7); }
  50%      { box-shadow: 0 0 16px rgba(255, 220, 150, 0.5); }
}

/* Plant silhouettes inside */
.silhouette {
  position: absolute;
  bottom: calc(18% + 24px);
  font-size: 16px;
  opacity: 0;
  filter: blur(0.5px);
}
.s-a { left: calc(50% - 56px); }
.s-b { left: calc(50% - 6px); }
.s-c { left: calc(50% + 36px); }
.p1 .silhouette {
  animation: sil-fade 700ms ease 1700ms forwards;
}
.p1 .s-b { animation-delay: 1820ms; }
.p1 .s-c { animation-delay: 1940ms; }
@keyframes sil-fade {
  to { opacity: 0.66; }
}

/* Warm motes drifting up out the door */
.warm-mote {
  position: absolute;
  left: 50%;
  bottom: calc(18% + 12px);
  width: 5px;
  height: 5px;
  margin-left: -2px;
  border-radius: 50%;
  background: rgba(255, 222, 160, 0.92);
  box-shadow: 0 0 6px rgba(255, 222, 160, 0.6);
  opacity: 0;
}
.p1 .warm-mote {
  animation: mote-rise 1500ms ease-out forwards;
  animation-delay: calc(1.6s + var(--i) * 0.08s);
}
@keyframes mote-rise {
  0%   { opacity: 0; transform: translate(0, 0); }
  20%  { opacity: 1; }
  100% { opacity: 0; transform: translate(calc((var(--i) - 2.5) * 14px), -90px); }
}
</style>
