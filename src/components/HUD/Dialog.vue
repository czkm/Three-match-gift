<template>
  <div class="dialog-box parchment grain" @click.stop="onSkip">
    <p class="text">{{ display }}<span v-if="!done" class="cursor">▍</span></p>
    <span v-if="done && hint" class="hint">{{ hint }}</span>
  </div>
</template>

<script setup>
import { toRef, watch } from 'vue';
import { audioManager } from '@/audio/AudioManager';
import { useTypewriter } from '@/composables/useTypewriter';

const props = defineProps({
  text: { type: String, required: true },
  hint: { type: String, default: '点击继续' },
  speed: { type: Number, default: 38 }
});
const emit = defineEmits(['done', 'skip', 'ready']);

const textRef = toRef(props, 'text');
const { display, done, skip } = useTypewriter(textRef, { speed: props.speed });

function onSkip() {
  if (!done.value) {
    audioManager.playSFX('pageflip', { vol: 0.4 });
    skip();
    emit('skip');
  } else {
    audioManager.playSFX('pageflip', { vol: 0.4 });
    emit('done');
  }
}

watch(done, (value, oldValue) => {
  if (value && !oldValue) emit('ready');
});

defineExpose({
  skipToEnd: skip,
  isDone: done
});
</script>

<style scoped>
.dialog-box {
  position: relative;
  padding: 18px 22px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  user-select: none;
  font-size: 15px;
  line-height: 1.75;
  color: var(--ink);
  white-space: pre-wrap;
  max-width: 720px;
  margin: 0 auto;
  transition: transform 200ms var(--ease-out-expo), box-shadow 200ms var(--ease-out-expo);
}
.dialog-box:hover {
  transform: translateY(-1px);
  box-shadow:
    var(--surface-glow),
    var(--hud-shadow),
    0 8px 20px rgba(28, 18, 12, 0.1),
    inset 0 0 0 1px rgba(255, 244, 214, 0.28);
}
.text { margin: 0; }
.cursor {
  display: inline-block;
  margin-left: 2px;
  color: var(--gold-soft);
  animation: blink 760ms steps(1) infinite;
}
.hint {
  position: absolute;
  right: 14px;
  bottom: 8px;
  font-size: 11px;
  color: var(--ink-faint);
  letter-spacing: 0.12em;
  opacity: 0.85;
  transition: opacity 200ms ease;
}
.dialog-box:hover .hint {
  opacity: 1;
}
@keyframes blink { 50% { opacity: 0; } }
</style>
