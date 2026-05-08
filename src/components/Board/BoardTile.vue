<template>
  <div
    class="tile"
    :class="[tile.type, {
      selected,
      hidden: tile.hidden,
      pooled: tile.pooled,
      hint: hint,
      'preview-good': preview === 'good',
      'preview-bad':  preview === 'bad',
      'invalid':      invalid
    }]"
    :style="style"
    @mousedown.prevent="onPick"
    @touchstart.prevent="onPick"
  >
    <span class="glyph">{{ glyph }}</span>
    <span v-if="monsterSignal" class="monster-signal" :class="monsterSignal.className">{{ monsterSignal.glyph }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tile: { type: Object, required: true },
  monster: { type: Object, default: null },
  selected: { type: Boolean, default: false },
  hint: { type: Boolean, default: false },
  preview: { type: String, default: null },     // 'good' | 'bad' | null
  invalid: { type: Boolean, default: false }
});
const emit = defineEmits(['pick']);

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
    case 'monster-drowner': return '🧟';
    case 'monster-ghoul': return '🧌';
    case 'monster-griffinChick': return '🦅';
    case 'monster-wraith': return '👻';
    default: return '';
  }
});

const monsterSignal = computed(() => {
  const monster = props.monster;
  if (!monster) return null;
  if (monster.kind === 'nekkers') return { glyph: '↕', className: 'signal-nekkers' };
  if (monster.kind === 'drowner') return { glyph: '↕', className: 'signal-drowner' };
  if (monster.kind === 'ghoul') return { glyph: '▾', className: 'signal-ghoul' };
  if (monster.kind === 'griffinChick') return { glyph: '4+', className: 'signal-griffin' };
  if (monster.kind === 'wraith') return { glyph: monster.shield > 0 ? '◐' : '4+', className: 'signal-wraith' };
  return null;
});

function onPick(evt) {
  emit('pick', { row: props.tile.row, col: props.tile.col }, evt);
}
</script>

<style scoped>
.glyph {
  pointer-events: none;
  filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.25));
}

.monster-signal {
  position: absolute;
  right: 7px;
  top: 5px;
  z-index: 3;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  line-height: 1;
  color: #fff4d2;
  background: rgba(28, 18, 14, 0.62);
  box-shadow: 0 0 8px rgba(255, 226, 152, 0.18);
}

.signal-drowner { color: #bfe9ff; }
.signal-ghoul { color: #d8bd8a; }
.signal-griffin { color: #f6d49a; }
.signal-wraith { color: #e2c6ff; }
</style>
