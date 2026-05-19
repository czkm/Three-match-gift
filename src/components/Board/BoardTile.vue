<template>
  <div
    class="tile"
    :class="[tile.type, {
      selected,
      hidden: tile.hidden,
      pooled: tile.pooled,
      hint: hint,
      struck: showHitFx,
      'preview-good': preview === 'good',
      'preview-bad':  preview === 'bad',
      'invalid':      invalid
    }]"
    :data-entity-id="monster ? monster.id : undefined"
    :data-entity-kind="monster ? monster.kind : undefined"
    :data-tear-target="isTearTargetable ? 'true' : undefined"
    :data-tile-pos="`${tile.row},${tile.col}`"
    :data-tile-type="tile.type"
    :style="style"
    @mousedown.prevent="onPick"
    @touchstart.prevent="onPick"
  >
    <span class="glyph-glow" />
    <span class="glyph">{{ glyph }}</span>
    <span v-if="showHitFx" class="damage-float">-1</span>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps({
  tile: { type: Object, required: true },
  monster: { type: Object, default: null },
  selected: { type: Boolean, default: false },
  hint: { type: Boolean, default: false },
  preview: { type: String, default: null },     // 'good' | 'bad' | null
  invalid: { type: Boolean, default: false }
});
const emit = defineEmits(['pick']);
const HIT_FX_MS = 420;
const showHitFx = ref(false);
let hitFxTimer = null;

const TILE_SIZE = 60;

// The .tileContainer parent already starts at gameBoard's inner-padding edge,
// so individual tiles don't need an additional pad offset.
const style = computed(() => {
  const x = props.tile.col * TILE_SIZE;
  const y = props.tile.row * TILE_SIZE;
  const xform = `translate3d(${x}px, ${y}px, 0)`;
  return {
    transform: xform,
    '--xform': xform
  };
});

const glyph = computed(() => {
  switch (props.tile.type) {
    case 'grape': return '🍇';
    case 'wood':  return '🪵';
    case 'stone': return '🪨';
    case 'clay':  return '🧱';
    case 'herb':  return '🌿';
    case 'magic': return '✨';
    case 'rot': return '🟫';
    case 'monster-nekkers': return '👺';
    case 'monster-blightMark': return '🦠';
    case 'monster-drowner': return '🧟';
    case 'monster-ghoul': return '🧌';
    case 'monster-griffinChick': return '🦅';
    case 'monster-wraith': return '👻';
    default: return '';
  }
});

const hitSignature = computed(() => {
  const monster = props.monster;
  if (!monster || monster.lastDamagedTurn == null) return '';
  return `${monster.id || monster.kind}:${monster.lastDamagedTurn}:${monster.hitsTaken || 0}:${monster.hitsRequired || 0}`;
});

const NON_TEAR_TARGETS = new Set(['barrenGrave', 'blightMark', 'joyCandle', 'djinn']);
const isTearTargetable = computed(() => {
  const m = props.monster;
  if (!m || m.removed) return false;
  if (NON_TEAR_TARGETS.has(m.kind)) return false;
  return true;
});

function onPick(evt) {
  emit('pick', { row: props.tile.row, col: props.tile.col }, evt);
}

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
.glyph-glow {
  position: absolute;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 252, 245, 0.28) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.glyph {
  position: relative;
  z-index: 1;
  pointer-events: none;
  filter: drop-shadow(0 1px 2px rgba(114, 93, 66, 0.22));
  transition: transform 180ms var(--ease-out-expo), filter 180ms var(--ease-out-expo);
}

.tile:hover .glyph {
  transform: scale(1.08);
  filter: drop-shadow(0 2px 4px rgba(114, 93, 66, 0.28));
}

.tile.struck {
  animation:
    monster-hit-shudder 420ms var(--ease-out-expo),
    monster-hit-flash 220ms ease-out;
  box-shadow:
    0 0 0 2px rgba(255, 234, 176, 0.82),
    0 0 22px rgba(255, 164, 92, 0.52),
    inset 0 0 14px rgba(255, 232, 180, 0.24);
}

.tile.struck .glyph {
  animation: monster-hit-glyph 420ms var(--ease-out-expo);
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

@keyframes monster-hit-shudder {
  0%   { transform: var(--xform) scale(1); filter: saturate(1); }
  16%  { transform: var(--xform) translate3d(-5px, 0, 0) scale(1.08); filter: saturate(1.45); }
  38%  { transform: var(--xform) translate3d(4px, -1px, 0) scale(0.97); }
  66%  { transform: var(--xform) translate3d(-1px, 1px, 0) scale(1.03); }
  100% { transform: var(--xform) scale(1); filter: saturate(1); }
}

@keyframes monster-hit-glyph {
  0%   { transform: scale(1); filter: brightness(1); }
  24%  { transform: scale(1.28); filter: brightness(1.34) drop-shadow(0 0 12px rgba(255, 221, 136, 0.66)); }
  54%  { transform: scale(0.94); filter: brightness(1.08); }
  100% { transform: scale(1); filter: brightness(1); }
}

@keyframes damage-float-up {
  0%   { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.7); }
  18%  { opacity: 1; transform: translateX(-50%) translateY(-1px) scale(1.12); }
  56%  { opacity: 1; transform: translateX(-50%) translateY(-8px) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-22px) scale(0.96); }
}

@keyframes monster-hit-flash {
  0%   { filter: brightness(1); }
  45%  { filter: brightness(1.18); }
  100% { filter: brightness(1); }
}

</style>
