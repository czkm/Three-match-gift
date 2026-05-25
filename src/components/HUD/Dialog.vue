<template>
  <div class="dialog-box" @click.stop="onSkip">
    <p class="text">{{ display }}<span v-if="!done" class="cursor">▍</span></p>
    <span v-if="done && hint" class="hint">{{ hint }}</span>
  </div>
</template>

<script setup>
import { onMounted, toRef, watch } from 'vue';
import { audioManager } from '@/audio/AudioManager';
import { useTypewriter } from '@/composables/useTypewriter';
import { COMMON_COPY } from '@/data/copy';

const props = defineProps({
  text: { type: String, required: true },
  hint: { type: String, default: COMMON_COPY.continueHint },
  speed: { type: Number, default: 38 }
});
const emit = defineEmits(['done', 'skip', 'ready']);

const textRef = toRef(props, 'text');
const { display, done, skip } = useTypewriter(textRef, {
  speed: props.speed,
  onChar: (char) => {
    if (char === ' ' || char === '\n') {
      audioManager.playSFX('typewriter_space', { vol: 0.15 });
    } else {
      audioManager.playSFX('typewriter_key', { vol: 0.2 });
    }
  }
});

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

onMounted(() => {
  audioManager.playSFX('dialogopen', { vol: 0.3 });
});

watch(done, (value, oldValue) => {
  if (value && !oldValue) {
    audioManager.playSFX('typewriter_enter', { vol: 0.22 });
    emit('ready');
  }
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
  border-radius: 16px;
  cursor: pointer;
  user-select: none;
  font-size: 15px;
  line-height: 1.75;
  color: #725d42;
  white-space: pre-wrap;
  max-width: 720px;
  margin: 0 auto;
  background: #f8f8f0;
  border: 2px solid #d4c9b4;
  box-shadow: 0 3px 0 0 #d4c9b4;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  font-weight: 500;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.dialog-box:hover {
  transform: translateY(-1px);
  border-color: #19c8b9;
  box-shadow: 0 4px 0 0 #50B9AB;
}
.text { margin: 0; }
.cursor {
  display: inline-block;
  margin-left: 2px;
  color: #19c8b9;
  animation: blink 760ms steps(1) infinite;
}
.hint {
  position: absolute;
  right: 14px;
  bottom: 8px;
  font-size: 11px;
  color: #9f927d;
  letter-spacing: 0.04em;
  font-weight: 600;
  opacity: 0.85;
  transition: opacity 200ms ease;
}
.dialog-box:hover .hint {
  opacity: 1;
}
@keyframes blink { 50% { opacity: 0; } }
</style>
