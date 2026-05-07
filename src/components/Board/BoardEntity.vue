<template>
  <div
    class="entity"
    :class="[entity.kind, {
      removed: entity.removed,
      djinn: entity.kind === 'djinn',
      hidden: entity.hidden
    }]"
    :style="style"
    @mouseenter="emit('monster-hover-enter', { kind: entity.kind, entityId: entity.id })"
    @mouseleave="emit('monster-hover-leave', { kind: entity.kind, entityId: entity.id })"
    @click.stop="emit('monster-inspect', { kind: entity.kind, entityId: entity.id })"
  >
    <span class="slot-frame" />
    <span class="glyph">{{ monster?.emoji || '' }}</span>
    <span v-if="entity.kind === 'djinn'" class="djinn-core" :class="`p${djinnStage}`" />
    <div class="hp-bar">
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
import { computed } from 'vue';
import { MONSTERS } from '@/data/content';

const props = defineProps({
  entity: { type: Object, required: true },
  tileSize: { type: Number, default: 60 }
});
const emit = defineEmits(['monster-hover-enter', 'monster-hover-leave', 'monster-inspect']);

const monster = computed(() => MONSTERS[props.entity.kind]);
const djinnStage = computed(() => Math.max(0, Math.min(3, props.entity.hitsTaken || 0)));
const style = computed(() => ({
  width: `${(props.entity.width || 1) * props.tileSize}px`,
  height: `${(props.entity.height || 1) * props.tileSize}px`,
  transform: `translate3d(${props.entity.col * props.tileSize}px, ${props.entity.row * props.tileSize}px, 0)`
}));
</script>

<style scoped>
.entity {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  z-index: 7;
  pointer-events: auto;
  cursor: help;
  border: 1px solid rgba(232, 212, 178, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 246, 226, 0.08),
    inset 0 0 0 1px rgba(255, 248, 232, 0.08),
    inset 0 -10px 18px rgba(22, 14, 10, 0.32),
    0 6px 14px rgba(16, 10, 8, 0.28);
  transition: opacity 240ms ease, transform 260ms ease, filter 180ms ease;
}

.entity.removed,
.entity.hidden {
  opacity: 0;
  transform: scale(0.7);
}

.slot-frame {
  position: absolute;
  inset: 3px;
  border-radius: 11px;
  border: 1px solid rgba(255, 243, 218, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 247, 236, 0.18),
    inset 0 -8px 12px rgba(0, 0, 0, 0.16);
  z-index: 0;
}

.glyph {
  position: relative;
  z-index: 2;
  font-size: 34px;
  filter: drop-shadow(0 4px 8px rgba(24, 18, 12, 0.42));
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

.foglet {
  background:
    radial-gradient(circle at 48% 42%, rgba(228, 226, 244, 0.18), transparent 40%),
    linear-gradient(160deg, rgba(88, 86, 112, 0.92) 0%, rgba(46, 44, 64, 0.98) 100%);
  animation: fog-drift 3s ease-in-out infinite;
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
  opacity: 0.86;
  animation: djinn-pulse 1.5s ease-in-out infinite;
}

.djinn-core {
  position: absolute;
  inset: 14px;
  border-radius: 18px;
  border: 1px solid rgba(240, 213, 107, 0.28);
  box-shadow: 0 0 16px rgba(240, 213, 107, 0.2);
  z-index: 1;
}

.djinn-core.p1 { box-shadow: 0 0 18px rgba(240, 213, 107, 0.28); }
.djinn-core.p2 { box-shadow: 0 0 26px rgba(240, 213, 107, 0.42); }
.djinn-core.p3 { box-shadow: 0 0 34px rgba(240, 213, 107, 0.55); }

.hp-bar {
  position: absolute;
  left: 50%;
  bottom: 2px;
  display: flex;
  gap: 4px;
  transform: translateX(-50%);
  z-index: 2;
  opacity: 0.42;
}

.hp-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 242, 204, 0.9);
  box-shadow: 0 0 8px rgba(255, 227, 148, 0.35);
}

.hp-dot.spent {
  background: rgba(90, 72, 52, 0.45);
  box-shadow: none;
}

.entity:hover .hp-bar {
  opacity: 0.7;
}

@keyframes djinn-pulse {
  0%, 100% { transform: scale(0.96); opacity: 0.78; }
  50% { transform: scale(1.04); opacity: 1; }
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

@keyframes fog-drift {
  0%, 100% { transform: translate3d(-2px, 0, 0); opacity: 0.62; }
  50% { transform: translate3d(2px, -1px, 0); opacity: 0.8; }
}

@keyframes wraith-flicker {
  0%, 100% { transform: scale(0.98); opacity: 0.72; }
  50% { transform: scale(1.04); opacity: 0.96; }
}
</style>
