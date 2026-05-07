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
      'invalid':      invalid,
      'mist-obscured': mist && !mistRevealed,
      'mist-revealed': mist && mistRevealed
    }]"
    :style="style"
    @mousedown.prevent="onPick"
    @touchstart.prevent="onPick"
    @mouseenter="onPeek"
    @mouseleave="onPeekLeave"
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
  invalid: { type: Boolean, default: false },
  mist: { type: Boolean, default: false },
  mistRevealed: { type: Boolean, default: false }
});
const emit = defineEmits(['pick', 'peek', 'peek-leave']);

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
    case 'monster-foglet': return '🌫️';
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
  if (monster.kind === 'foglet') return { glyph: '◌', className: 'signal-foglet' };
  if (monster.kind === 'wraith') return { glyph: monster.shield > 0 ? '◐' : '4+', className: 'signal-wraith' };
  return null;
});

function onPick(evt) {
  emit('pick', { row: props.tile.row, col: props.tile.col }, evt);
}

function onPeek() {
  emit('peek', { row: props.tile.row, col: props.tile.col });
}

function onPeekLeave() {
  emit('peek-leave', { row: props.tile.row, col: props.tile.col });
}
</script>

<style scoped>
.glyph {
  pointer-events: none;
  filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.25));
}

.mist-obscured .glyph {
  opacity: 0;
  filter: blur(10px);
  transition: opacity 180ms ease, filter 180ms ease;
}

.mist-obscured .monster-signal {
  opacity: 0;
  transition: opacity 180ms ease;
}

.mist-revealed .glyph {
  opacity: 0.95;
  filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.25));
  transition: opacity 200ms ease, filter 200ms ease;
}

.mist-revealed .monster-signal {
  opacity: 1;
  transition: opacity 200ms ease;
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
.signal-foglet { color: #e4e2ff; }
.signal-wraith { color: #e2c6ff; }
</style>
