<template>
  <img
    class="isaac-collectible-icon"
    :src="imgSrc"
    :width="props.size"
    :height="props.size"
    :style="{ ...baseStyle, ...props.inlineStyle }"
    :alt="props.rewardItemId"
    @error="onImgError"
    v-if="!imgFailed"
  />
  <span v-else class="isaac-collectible-fallback" :style="fallbackStyle">{{ props.fallbackEmoji }}</span>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  rewardItemId: { type: String, required: true },
  size: { type: Number, default: 32 },
  scale: { type: Number, default: 1 },
  fallbackEmoji: { type: String, default: '✨' },
  inlineStyle: { type: Object, default: () => ({}) }
});

const imgFailed = ref(false);

watch(() => props.rewardItemId, () => {
  imgFailed.value = false;
});

const imgSrc = computed(() => `/img/isaac/${props.rewardItemId}.png`);

const effectiveSize = computed(() => props.size * props.scale);

const baseStyle = computed(() => ({
  width: `${effectiveSize.value}px`,
  height: `${effectiveSize.value}px`,
  imageRendering: 'pixelated',
  display: 'inline-block',
  verticalAlign: 'middle',
  objectFit: 'contain'
}));

const fallbackStyle = computed(() => ({
  display: 'inline-block',
  width: `${effectiveSize.value}px`,
  height: `${effectiveSize.value}px`,
  lineHeight: `${effectiveSize.value}px`,
  textAlign: 'center',
  fontSize: `${Math.max(14, effectiveSize.value * 0.8)}px`,
  verticalAlign: 'middle',
  ...props.inlineStyle
}));

function onImgError() {
  imgFailed.value = true;
}
</script>

<style scoped>
.isaac-collectible-icon {
  transition-property: all;
  transition-duration: 120ms;
  transition-timing-function: ease-in;
}

.isaac-collectible-fallback {
  vertical-align: middle;
}
</style>
