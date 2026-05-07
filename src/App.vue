<template>
  <Title v-if="game.phase === 'title'" @start="onStart" />
  <GameContainer
    v-else-if="['intro', 'playing', 'targeting', 'dayEnd', 'repairing', 'wish'].includes(game.phase)"
  />
  <Ending
    v-else-if="['ending', 'final'].includes(game.phase)"
    @restart="onRestart"
  />
  <transition name="tester-toast">
    <p v-if="testerToast" class="tester-toast parchment grain">{{ testerToast }}</p>
  </transition>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watchEffect } from 'vue';
import Title from './components/Title.vue';
import GameContainer from './components/GameContainer.vue';
import Ending from './components/Ending.vue';
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();
const testerToast = ref('');
let toastTimer = null;

function onStart() {
  // Title has already called game.start() — fire-and-forget.
}

function onRestart() {
  game.phase = 'title';
}

function onTesterKeydown(event) {
  if (!(event.metaKey || event.ctrlKey)) return;
  const key = event.key.toLowerCase();
  if (key === 'e') {
    event.preventDefault();
    const result = game.jumpToDayForTesting(9);
    if (!result) return;
    showTesterToast(`测试跳转：已到第 ${result.day} 天“${result.building}”`);
    return;
  }
  if (key !== 'k') return;
  event.preventDefault();
  const result = game.skipDayForTesting();
  if (!result) return;
  showTesterToast(`测试跳关：第 ${result.day} 天“${result.building}”进入完工过场`);
}

function showTesterToast(text) {
  testerToast.value = text;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    testerToast.value = '';
    toastTimer = null;
  }, 1800);
}

// Day-tinted body backdrop (CSS hooks live in tokens.css).
watchEffect(() => {
  if (typeof document === 'undefined') return;
  document.body.dataset.day = String(game.currentDay + 1);
  document.body.dataset.phase = game.phase;
});

onMounted(() => {
  if (typeof document === 'undefined') return;
  document.body.dataset.day = '1';
  document.body.dataset.phase = 'title';
  window.addEventListener('keydown', onTesterKeydown);
});

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return;
  window.removeEventListener('keydown', onTesterKeydown);
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<style scoped>
.tester-toast {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 120;
  margin: 0;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--ink);
  box-shadow: 0 10px 24px rgba(35, 24, 14, 0.18);
}

.tester-toast-enter-active,
.tester-toast-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.tester-toast-enter-from,
.tester-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
