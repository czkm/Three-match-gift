<template>
  <span v-if="spriteStyle" class="isaac-collectible-frame" :style="frameStyle" aria-hidden="true">
    <span
      class="icons collectibles isaac-collectible-icon"
      :id="itemMeta?.collectibleId ? `collectibles_${itemMeta.collectibleId}` : undefined"
      :style="mergedStyle"
    />
  </span>
  <span v-else class="isaac-collectible-fallback" :style="fallbackStyle">{{ fallbackEmoji }}</span>
</template>

<script setup>
import { computed } from 'vue';
import { getIsaacItemMetaByRewardId, getIsaacSpriteStyleByRewardId } from '@/utils/isaacSprites';
import { ISAAC_SPRITE_SHEET } from '@/data/isaacItems';

const props = defineProps({
  rewardItemId: { type: String, required: true },
  size: { type: Number, default: 32 },
  scale: { type: Number, default: 1 },
  fallbackEmoji: { type: String, default: '✨' },
  inlineStyle: { type: Object, default: () => ({}) }
});

const itemMeta = computed(() => getIsaacItemMetaByRewardId(props.rewardItemId));
const spriteStyle = computed(() => getIsaacSpriteStyleByRewardId(props.rewardItemId, props.size));
const scaleValue = computed(() => props.size / ISAAC_SPRITE_SHEET.tileSize);
const frameStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  verticalAlign: 'middle',
  ...props.inlineStyle
}));
const mergedStyle = computed(() => {
  if (!spriteStyle.value) return null;
  return {
    ...spriteStyle.value,
    transform: `scale(${(scaleValue.value * props.scale).toFixed(4)})`,
    transformOrigin: 'center',
  };
});
const fallbackStyle = computed(() => ({
  display: 'inline-block',
  width: `${props.size}px`,
  height: `${props.size}px`,
  lineHeight: `${props.size}px`,
  textAlign: 'center',
  fontSize: `${Math.max(14, props.size * 0.8)}px`,
  ...props.inlineStyle
}));
</script>

<style scoped>
.icons {
  display: inline-block;
  width: 32px;
  height: 32px;
  vertical-align: middle;
  transition-property: all;
  transition-duration: 120ms;
  transition-timing-function: ease-in;
}

.collectibles {
  background-image: url('/Collectibles_sprite.png');
  image-rendering: pixelated;
}

.isaac-collectible-frame,
.isaac-collectible-icon,
.isaac-collectible-fallback {
  vertical-align: middle;
}
</style>
