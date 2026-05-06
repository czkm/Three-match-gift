<template>
  <div class="dialog-box parchment grain" @click="onSkip">
    <p class="text">{{ display }}<span v-if="!done" class="cursor">▍</span></p>
    <span v-if="done && hint" class="hint">{{ hint }}</span>
  </div>
</template>

<script setup>
import { computed, toRef, watchEffect } from 'vue';
import { useTypewriter } from '@/composables/useTypewriter';

const props = defineProps({
  text: { type: String, required: true },
  hint: { type: String, default: '点击继续' },
  speed: { type: Number, default: 38 }
});
const emit = defineEmits(['done', 'skip']);

const textRef = toRef(props, 'text');
const { display, done, skip } = useTypewriter(textRef, { speed: props.speed });

function onSkip() {
  if (!done.value) {
    skip();
    emit('skip');
  } else {
    emit('done');
  }
}

watchEffect(() => {
  if (done.value) emit('done');
});
</script>

<style scoped>
.dialog-box {
  position: relative;
  padding: 16px 20px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  font-size: 15px;
  line-height: 1.7;
  color: var(--ink);
  white-space: pre-wrap;
  max-width: 720px;
  margin: 0 auto;
}
.text { margin: 0; }
.cursor {
  display: inline-block;
  margin-left: 2px;
  color: var(--gold);
  animation: blink 700ms steps(1) infinite;
}
.hint {
  position: absolute;
  right: 14px;
  bottom: 8px;
  font-size: 11px;
  color: var(--ink-soft);
  letter-spacing: 0.1em;
}
@keyframes blink { 50% { opacity: 0; } }
</style>
