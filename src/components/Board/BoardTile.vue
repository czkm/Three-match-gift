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
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tile: { type: Object, required: true },
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
    default: return '';
  }
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
</style>
