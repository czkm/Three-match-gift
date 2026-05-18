<template>
  <div
    class="entity"
    :class="[entity.kind, {
      removed: entity.removed,
      djinn: entity.kind === 'djinn',
      sleeping: entity.sleeping,
      hidden: entity.hidden,
      struck: showHitFx
    }]"
    :data-entity-id="entity.id"
    :data-entity-kind="entity.kind"
    :data-tear-target="!entity.removed && entity.kind !== 'joyCandle' && entity.kind !== 'blightMark' ? 'true' : undefined"
    :style="style"
    @mouseenter="emit('monster-hover-enter', { kind: entity.kind, entityId: entity.id })"
    @mouseleave="emit('monster-hover-leave', { kind: entity.kind, entityId: entity.id })"
    @click.stop="emit('monster-inspect', { kind: entity.kind, entityId: entity.id })"
  >
    <span class="slot-frame" />
    <span class="glyph">{{ monster?.emoji || '' }}</span>
    <span v-if="showHitFx" class="damage-float">-1</span>
    <span v-if="entity.kind === 'djinn'" class="djinn-core" :class="`p${djinnStage}`" />
    <span v-if="entity.kind === 'djinn' && entity.sleeping" class="sleep-mark">💤</span>
    <div v-if="entity.kind !== 'joyCandle'" class="hp-bar">
      <span
        v-for="n in entity.hitsRequired || 1"
        :key="`hp-${entity.id}-${n}`"
        class="hp-dot"
        :class="{ spent: (entity.hitsTaken || 0) >= n }"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { MONSTERS } from '@/data/content';

const props = defineProps({
  entity: { type: Object, required: true },
  tileSize: { type: Number, default: 60 }
});
const emit = defineEmits(['monster-hover-enter', 'monster-hover-leave', 'monster-inspect']);
const HIT_FX_MS = 420;
const showHitFx = ref(false);
let hitFxTimer = null;

const monster = computed(() => MONSTERS[props.entity.kind]);
const djinnStage = computed(() => Math.max(0, Math.min(3, props.entity.hitsTaken || 0)));
const hitSignature = computed(() => {
  if (props.entity.lastDamagedTurn == null) return '';
  return `${props.entity.id}:${props.entity.lastDamagedTurn}:${props.entity.hitsTaken || 0}:${props.entity.hitsRequired || 0}`;
});
const style = computed(() => ({
  width: `${(props.entity.width || 1) * props.tileSize}px`,
  height: `${(props.entity.height || 1) * props.tileSize}px`,
  transform: `translate3d(${props.entity.col * props.tileSize}px, ${props.entity.row * props.tileSize}px, 0)`
}));

watch(hitSignature, (signature, previous) => {
  if (!signature || signature === previous) return;
  showHitFx.value = false;
  if (hitFxTimer) clearTimeout(hitFxTimer);
  requestAnimationFrame(() => {
    showHitFx.value = true;
  });
  hitFxTimer = setTimeout(() => {
    showHitFx.value = false;
    hitFxTimer = null;
  }, HIT_FX_MS);
});

onBeforeUnmount(() => {
  if (hitFxTimer) clearTimeout(hitFxTimer);
});
</script>

<style scoped>
.entity {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--radius-md);
  z-index: 7;
  pointer-events: auto;
  cursor: help;
  border: 1px solid rgba(232, 212, 178, 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 246, 226, 0.1),
    inset 0 0 0 1px rgba(255, 248, 232, 0.1),
    inset 0 -10px 18px rgba(22, 14, 10, 0.34),
    0 8px 18px rgba(16, 10, 8, 0.3);
  transition: opacity 280ms var(--ease-out-expo), transform 300ms var(--ease-out-expo), filter 200ms var(--ease-out-expo);
}

.entity.removed,
.entity.hidden {
  opacity: 0;
  transform: scale(0.7);
  filter: blur(2px);
}

.slot-frame {
  position: absolute;
  inset: 3px;
  border-radius: 10px;
  border: 1px solid rgba(255, 243, 218, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 247, 236, 0.2),
    inset 0 -8px 12px rgba(114, 93, 66, 0.14);
  z-index: 0;
}

.glyph {
  position: relative;
  z-index: 2;
  font-size: 34px;
  filter: drop-shadow(0 4px 8px rgba(24, 18, 12, 0.42));
  transition: transform 200ms var(--ease-out-expo), filter 200ms var(--ease-out-expo);
}
.entity:hover .glyph {
  transform: scale(1.1);
  filter: drop-shadow(0 6px 12px rgba(24, 18, 12, 0.5));
}

.entity.struck {
  animation:
    entity-hit-shudder 420ms var(--ease-out-expo),
    entity-hit-flash 220ms ease-out;
  box-shadow:
    inset 0 0 0 1px rgba(255, 248, 232, 0.1),
    0 0 0 2px rgba(255, 234, 176, 0.82),
    0 0 24px rgba(255, 176, 88, 0.46),
    inset 0 0 16px rgba(255, 232, 180, 0.18),
    0 8px 18px rgba(16, 10, 8, 0.3);
}

.entity.struck .glyph {
  animation: entity-hit-glyph 420ms var(--ease-out-expo);
}

.damage-float {
  position: absolute;
  top: -14px;
  left: 50%;
  z-index: 4;
  transform: translateX(-50%);
  font-size: 16px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.04em;
  color: #ffe7ea;
  text-shadow:
    0 1px 0 rgba(92, 18, 18, 0.88),
    0 0 10px rgba(255, 124, 124, 0.5),
    0 0 18px rgba(255, 178, 128, 0.26);
  animation: damage-float-up 420ms cubic-bezier(0.18, 0.84, 0.28, 1) forwards;
}

.nekkers {
  background:
    radial-gradient(circle at 32% 28%, rgba(210, 150, 116, 0.26), transparent 36%),
    linear-gradient(160deg, rgba(90, 50, 28, 0.96) 0%, rgba(52, 28, 16, 0.98) 100%);
  animation: nue-giggle 1.2s ease-in-out infinite;
}

.drowner {
  background:
    radial-gradient(circle at 34% 28%, rgba(124, 178, 208, 0.24), transparent 38%),
    linear-gradient(165deg, rgba(46, 82, 112, 0.96) 0%, rgba(24, 46, 68, 0.98) 100%);
  animation: drowner-drip 2s ease-in-out infinite;
}

.ghoul {
  background:
    radial-gradient(circle at 36% 26%, rgba(176, 156, 132, 0.2), transparent 40%),
    linear-gradient(160deg, rgba(84, 66, 48, 0.96) 0%, rgba(42, 32, 24, 0.98) 100%);
  animation: ghoul-breathe 1.5s ease-in-out infinite;
}

.wraith {
  background:
    radial-gradient(circle at 45% 32%, rgba(232, 214, 255, 0.18), transparent 38%),
    linear-gradient(160deg, rgba(88, 58, 122, 0.94) 0%, rgba(42, 24, 70, 0.98) 100%);
  animation: wraith-flicker 1.6s ease-in-out infinite;
}

.djinn {
  background:
    linear-gradient(180deg, rgba(255, 245, 214, 0.08) 0%, transparent 16%),
    radial-gradient(circle at 50% 50%, rgba(255, 224, 150, 0.22), transparent 62%),
    linear-gradient(155deg, rgba(84, 48, 122, 0.96) 0%, rgba(28, 18, 52, 0.98) 100%);
  border-color: rgba(240, 213, 107, 0.26);
  box-shadow:
    inset 0 0 0 1px rgba(255, 244, 214, 0.08),
    inset 0 -18px 28px rgba(12, 6, 18, 0.34),
    0 10px 24px rgba(24, 12, 36, 0.32);
}

.djinn .glyph {
  font-size: 82px;
  opacity: 0.88;
  animation: djinn-pulse 1.5s var(--ease-in-out-sine) infinite;
  filter: drop-shadow(0 4px 12px rgba(240, 213, 107, 0.35));
}

.djinn.sleeping .glyph {
  opacity: 0.58;
  animation-duration: 2.4s;
  filter: drop-shadow(0 2px 8px rgba(240, 213, 107, 0.18));
}

.djinn-core {
  position: absolute;
  inset: 14px;
  border-radius: 18px;
  border: 1px solid rgba(240, 213, 107, 0.3);
  box-shadow: 0 0 16px rgba(240, 213, 107, 0.22);
  z-index: 1;
  transition: box-shadow 400ms var(--ease-out-expo);
}

.djinn-core.p1 { box-shadow: 0 0 20px rgba(240, 213, 107, 0.32); }
.djinn-core.p2 { box-shadow: 0 0 30px rgba(240, 213, 107, 0.48); }
.djinn-core.p3 { box-shadow: 0 0 42px rgba(240, 213, 107, 0.62); }

.djinn.sleeping .djinn-core {
  box-shadow: 0 0 10px rgba(240, 213, 107, 0.14);
}

.sleep-mark {
  position: absolute;
  top: 8px;
  right: 10px;
  z-index: 3;
  font-size: 22px;
  filter: drop-shadow(0 2px 6px rgba(24, 18, 12, 0.36));
  animation: sleep-drift 2.4s ease-in-out infinite;
}

.joyCandle {
  background:
    linear-gradient(180deg, rgba(255, 245, 214, 0.08) 0%, transparent 16%),
    radial-gradient(circle at 50% 24%, rgba(255, 230, 148, 0.26), transparent 32%),
    linear-gradient(160deg, rgba(118, 82, 44, 0.94) 0%, rgba(56, 38, 18, 0.98) 100%);
  border-color: rgba(240, 213, 107, 0.22);
  box-shadow:
    inset 0 0 0 1px rgba(255, 244, 214, 0.08),
    inset 0 -14px 20px rgba(22, 12, 8, 0.28),
    0 8px 18px rgba(24, 12, 8, 0.22);
}

.joyCandle .glyph {
  font-size: 30px;
  filter: drop-shadow(0 2px 8px rgba(255, 204, 110, 0.28));
}

.barrenGrave {
  background:
    linear-gradient(180deg, rgba(244, 221, 162, 0.05) 0%, transparent 18%),
    radial-gradient(circle at 50% 32%, rgba(208, 173, 102, 0.12), transparent 34%),
    radial-gradient(circle at 24% 74%, rgba(96, 82, 60, 0.26), transparent 34%),
    linear-gradient(180deg, rgba(80, 58, 36, 0.16) 0%, rgba(56, 42, 28, 0.12) 44%, transparent 44% 100%),
    linear-gradient(160deg, rgba(70, 58, 50, 0.96) 0%, rgba(30, 24, 22, 0.98) 100%);
  border-color: rgba(214, 184, 112, 0.24);
  box-shadow:
    inset 0 0 0 1px rgba(255, 238, 196, 0.08),
    inset 0 0 22px rgba(214, 184, 112, 0.08),
    inset 0 -18px 24px rgba(14, 10, 8, 0.38),
    0 8px 18px rgba(12, 9, 7, 0.28);
}

.barrenGrave::before {
  content: '';
  position: absolute;
  inset: auto 7px 7px;
  height: 18px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 36% 42%, rgba(128, 114, 92, 0.46), transparent 24%),
    radial-gradient(circle at 68% 58%, rgba(84, 72, 56, 0.34), transparent 26%),
    linear-gradient(180deg, rgba(40, 28, 22, 0.82) 0%, rgba(28, 20, 16, 0.96) 100%);
  filter: blur(0.2px);
  z-index: 1;
}

.barrenGrave::after {
  content: '';
  position: absolute;
  inset: 9px;
  border-radius: 12px;
  border: 1px solid rgba(214, 184, 112, 0.22);
  box-shadow:
    0 0 0 1px rgba(255, 241, 204, 0.04),
    inset 0 0 12px rgba(214, 184, 112, 0.08);
  opacity: 0.86;
  z-index: 1;
}

.barrenGrave .glyph {
  font-size: 30px;
  transform: translateY(-7px);
  filter:
    drop-shadow(0 3px 6px rgba(10, 8, 6, 0.42))
    drop-shadow(0 0 8px rgba(214, 184, 112, 0.12));
}

.barrenGrave .slot-frame {
  border-color: rgba(214, 184, 112, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 247, 236, 0.08),
    inset 0 0 12px rgba(214, 184, 112, 0.06),
    inset 0 -10px 14px rgba(114, 93, 66, 0.16);
}

.barrenGrave .hp-bar {
  display: none;
}

.hp-bar {
  position: absolute;
  left: 50%;
  bottom: 3px;
  display: flex;
  gap: 5px;
  transform: translateX(-50%);
  z-index: 2;
  opacity: 0.45;
  transition: opacity 200ms var(--ease-out-expo);
}

.hp-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-pill);
  background: rgba(255, 242, 204, 0.92);
  box-shadow: 0 0 8px rgba(255, 227, 148, 0.4);
  transition: background 200ms var(--ease-out-expo), box-shadow 200ms var(--ease-out-expo);
}

.hp-dot.spent {
  background: rgba(90, 72, 52, 0.5);
  box-shadow: inset 0 1px 2px rgba(80, 50, 30, 0.25);
}

.entity:hover .hp-bar {
  opacity: 0.8;
}

@keyframes djinn-pulse {
  0%, 100% { transform: scale(0.96); opacity: 0.8; }
  50% { transform: scale(1.04); opacity: 1; }
}

@keyframes sleep-drift {
  0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.75; }
  50% { transform: translate3d(-2px, -4px, 0); opacity: 1; }
}

@keyframes nue-giggle {
  0%, 100% { transform: translate3d(0, 0, 0); }
  25% { transform: translate3d(1px, 0, 0); }
  50% { transform: translate3d(0, -2px, 0); }
  75% { transform: translate3d(-1px, 0, 0); }
}

@keyframes drowner-drip {
  0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.92; }
  50% { transform: translate3d(0, 1px, 0); opacity: 1; }
}

@keyframes ghoul-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes wraith-flicker {
  0%, 100% { transform: scale(0.98); opacity: 0.72; }
  50% { transform: scale(1.04); opacity: 0.96; }
}

@keyframes entity-hit-shudder {
  0%   { transform: scale(1); filter: saturate(1); }
  16%  { transform: translate3d(-5px, 0, 0) scale(1.06); filter: saturate(1.42); }
  38%  { transform: translate3d(4px, -1px, 0) scale(0.98); }
  66%  { transform: translate3d(-1px, 1px, 0) scale(1.02); }
  100% { transform: scale(1); filter: saturate(1); }
}

@keyframes entity-hit-glyph {
  0%   { transform: scale(1); filter: brightness(1); }
  24%  { transform: scale(1.22); filter: brightness(1.32) drop-shadow(0 0 12px rgba(255, 221, 136, 0.64)); }
  54%  { transform: scale(0.95); filter: brightness(1.08); }
  100% { transform: scale(1); filter: brightness(1); }
}

@keyframes damage-float-up {
  0%   { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.7); }
  18%  { opacity: 1; transform: translateX(-50%) translateY(-1px) scale(1.12); }
  56%  { opacity: 1; transform: translateX(-50%) translateY(-8px) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-22px) scale(0.96); }
}

@keyframes entity-hit-flash {
  0%   { filter: brightness(1); }
  45%  { filter: brightness(1.18); }
  100% { filter: brightness(1); }
}
</style>
