<template>
  <div class="audio-controls parchment grain" :class="{ expanded }">
    <button class="audio-btn primary" :title="muted ? '开启声音' : '静音'" @click="toggleMute">
      <span class="icon">{{ muted ? '🔇' : '🔊' }}</span>
      <span class="label">{{ muted ? '静音中' : '声音' }}</span>
    </button>

    <div v-if="!muted && expanded" class="panel">
      <label class="slider-row">
        <span class="row-label">配乐</span>
        <input v-model.number="bgmV" type="range" min="0" max="100" />
        <span class="row-value">{{ bgmV }}</span>
      </label>
      <label class="slider-row">
        <span class="row-label">音效</span>
        <input v-model.number="sfxV" type="range" min="0" max="200" />
        <span class="row-value">{{ sfxV }}</span>
      </label>
    </div>

    <button v-if="!muted" class="audio-btn toggle" :title="expanded ? '收起' : '展开'" @click="expanded = !expanded">
      {{ expanded ? '收起' : '调节' }}
    </button>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { audioManager } from '@/audio/AudioManager';

const expanded = ref(false);
const mutedState = ref(audioManager.isMuted);
const bgmState = ref(Math.round(audioManager.bgmVolume * 100));
const sfxState = ref(Math.round(audioManager.sfxVolume * 100));

const muted = computed(() => mutedState.value);
const bgmV = computed({
  get: () => bgmState.value,
  set: (value) => {
    bgmState.value = value;
    audioManager.bgmVolume = value / 100;
  }
});
const sfxV = computed({
  get: () => sfxState.value,
  set: (value) => {
    sfxState.value = value;
    audioManager.sfxVolume = value / 100;
  }
});

let unsubscribe = null;

function syncState() {
  mutedState.value = audioManager.isMuted;
  bgmState.value = Math.round(audioManager.bgmVolume * 100);
  sfxState.value = Math.round(audioManager.sfxVolume * 100);
}

function toggleMute() {
  audioManager.toggleMute();
  if (audioManager.isMuted) expanded.value = false;
}

onMounted(() => {
  syncState();
  unsubscribe = audioManager.subscribe(syncState);
});

onBeforeUnmount(() => {
  unsubscribe?.();
});
</script>

<style scoped>
.audio-controls {
  position: fixed;
  right: 18px;
  top: 18px;
  z-index: 126;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-pill);
  box-shadow:
    var(--surface-shadow),
    0 0 0 1px rgba(255, 242, 214, 0.08);
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 178px;
}

.slider-row {
  display: grid;
  grid-template-columns: 34px 1fr 32px;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ink-soft);
}

.row-label,
.row-value {
  font-weight: 600;
  letter-spacing: 0.06em;
}

.row-value {
  text-align: right;
  color: var(--ink);
}

input[type='range'] {
  width: 100%;
  accent-color: rgba(176, 148, 201, 0.92);
}

.audio-btn {
  border-radius: var(--radius-pill);
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.audio-btn.primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.audio-btn.toggle {
  min-width: 54px;
  padding-inline: 10px;
}

.icon {
  font-size: 15px;
}

.label {
  white-space: nowrap;
}

@media (max-width: 960px) {
  .audio-controls {
    top: auto;
    right: 14px;
    bottom: 14px;
  }

  .panel {
    min-width: 156px;
  }
}
</style>
