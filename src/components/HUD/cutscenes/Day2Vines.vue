<template>
  <div class="motif" :class="`p${phase}`">
    <!-- The trellis frame -->
    <span class="trellis-post post-l" />
    <span class="trellis-post post-r" />
    <span class="trellis-beam" />

    <span class="pig">🐖</span>

    <!-- Vines that shoot up the trellis, staggered -->
    <span
      v-for="n in 5"
      :key="`vine-${n}`"
      class="vine"
      :style="{ '--i': n - 1, left: 18 + (n - 1) * 16 + '%' }"
    />

    <!-- Grape clusters that pop in once the vines reach the top -->
    <span
      v-for="n in 4"
      :key="`grape-${n}`"
      class="grape"
      :style="{ '--i': n - 1, left: 24 + (n - 1) * 18 + '%' }"
    >🍇</span>

    <!-- Light scatter of new leaves -->
    <span
      v-for="n in 6"
      :key="`leaf-${n}`"
      class="leaf"
      :style="{ '--i': n - 1, left: 18 + (n * 11) + '%' }"
    >🌿</span>
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

/* The wooden trellis */
.trellis-post {
  position: absolute;
  bottom: 14%;
  width: 6px;
  height: 130px;
  border-radius: 2px;
  background: linear-gradient(180deg, rgba(140, 108, 64, 0.96), rgba(80, 56, 32, 0.96));
  opacity: 0;
}
.post-l { left: 16%; }
.post-r { left: 82%; }
.p1 .trellis-post { animation: post-fade 500ms ease forwards; }
.p1 .post-r { animation-delay: 120ms; }
@keyframes post-fade {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.trellis-beam {
  position: absolute;
  left: 16%;
  right: 18%;
  bottom: calc(14% + 124px);
  height: 4px;
  border-radius: 2px;
  background: rgba(120, 86, 50, 0.95);
  opacity: 0;
  transform: scaleX(0);
  transform-origin: left;
}
.p1 .trellis-beam { animation: beam-grow 600ms cubic-bezier(0.22, 0.9, 0.34, 1) 220ms forwards; }
.pig {
  position: absolute;
  left: 8%;
  bottom: 16%;
  font-size: 24px;
  opacity: 0;
}
.p1 .pig { animation: pig-cross 1600ms cubic-bezier(0.22, 0.9, 0.34, 1) 1680ms forwards; }
@keyframes beam-grow {
  to { opacity: 1; transform: scaleX(1); }
}
@keyframes pig-cross {
  0%   { opacity: 0; transform: translateX(0); }
  10%  { opacity: 0.92; }
  100% { opacity: 0.92; transform: translateX(240px); }
}

/* Vines as vertical green strokes that grow upward */
.vine {
  position: absolute;
  bottom: 14%;
  width: 5px;
  height: 0;
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(112, 168, 92, 0.96), rgba(58, 96, 48, 0.96));
  box-shadow: 0 0 5px rgba(98, 152, 76, 0.4);
}
.p1 .vine {
  animation: vine-climb 1500ms cubic-bezier(0.18, 0.7, 0.3, 1) forwards;
  animation-delay: calc(0.6s + var(--i) * 0.18s);
}
@keyframes vine-climb {
  0%   { height: 0; }
  100% { height: 124px; }
}

/* Grape clusters appear after the vines settle */
.grape {
  position: absolute;
  bottom: calc(14% + 92px);
  font-size: 22px;
  opacity: 0;
  transform: scale(0.4) translateY(6px);
  filter: drop-shadow(0 2px 3px rgba(114, 93, 66, 0.24));
}
.p1 .grape {
  animation: grape-pop 600ms cubic-bezier(0.18, 0.9, 0.34, 1.6) forwards;
  animation-delay: calc(1.6s + var(--i) * 0.12s);
}
@keyframes grape-pop {
  0%   { opacity: 0; transform: scale(0.4) translateY(6px); }
  60%  { opacity: 1; transform: scale(1.18) translateY(0); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* Loose leaves drift out from the foliage */
.leaf {
  position: absolute;
  bottom: 30%;
  font-size: 14px;
  opacity: 0;
}
.p1 .leaf {
  animation: leaf-drift 1800ms ease-out forwards;
  animation-delay: calc(1.0s + var(--i) * 0.13s);
}
@keyframes leaf-drift {
  0%   { transform: translate(0, 0)   rotate(0deg);  opacity: 0; }
  20%  { opacity: 0.85; }
  100% { transform: translate(calc((var(--i) - 2.5) * 18px), 80px) rotate(220deg); opacity: 0; }
}
</style>
