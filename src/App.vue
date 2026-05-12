<template>
  <Title v-if="game.phase === 'title'" @start="onStart" />
  <GameContainer
    v-else-if="['intro', 'playing', 'targeting', 'dayEnd', 'repairing', 'awakening', 'djinnTransition', 'wish'].includes(game.phase)"
  />
  <Ending
    v-else-if="['ending', 'final'].includes(game.phase)"
    @restart="onRestart"
  />
  <transition name="tester-toast">
    <p v-if="testerToast" class="tester-toast parchment grain">{{ testerToast }}</p>
  </transition>
  <AchievementToastStack />
  <AchievementPanel />
  <AudioControls />
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watchEffect } from 'vue';
import AudioControls from './components/HUD/AudioControls.vue';
import AchievementPanel from './components/HUD/AchievementPanel.vue';
import AchievementToastStack from './components/HUD/AchievementToastStack.vue';
import Title from './components/Title.vue';
import GameContainer from './components/GameContainer.vue';
import Ending from './components/Ending.vue';
import { useAudio } from '@/composables/useAudio';
import { useAchievementStore } from '@/stores/achievementStore';
import { useGameStore } from '@/stores/gameStore';

const achievement = useAchievementStore();
const game = useGameStore();
useAudio();
const testerToast = ref('');
let toastTimer = null;
let jumpChordTimer = null;
const jumpChordActive = ref(false);

function onStart() {
  // Title has already called game.start() — fire-and-forget.
}

function onRestart() {
  game.phase = 'title';
}

function onTesterKeydown(event) {
  if (!(event.metaKey || event.ctrlKey)) return;
  const key = event.key.toLowerCase();

  if (jumpChordActive.value && /^[1-9]$/.test(key)) {
    event.preventDefault();
    clearJumpChord();
    const result = game.jumpToDayForTesting(Number(key));
    if (!result) return;
    game.startPlay();
    showTesterToast(`测试跳转：已到第 ${result.day} 天“${result.building}”并直接开始`);
    return;
  }

  if (key === 'j') {
    event.preventDefault();
    const nextLocked = achievement.achievementList.find((item) => !achievement.unlockedSet.has(item.id))
      || achievement.achievementList[0];
    const ok = achievement.unlockForTesting(nextLocked?.id);
    if (!ok) {
      showTesterToast('测试成就：没有可解锁的新成就了');
      return;
    }
    showTesterToast(`测试成就：已解锁“${nextLocked.title}”`);
    return;
  }

  if (key === 'l') {
    event.preventDefault();
    const result = game.jumpToDjinnReadyForTesting();
    if (!result) return;
    showTesterToast(`测试跳转：已进入第 ${result.day} 天 djinnReady`);
    return;
  }

  if (key === 'e') {
    event.preventDefault();
    game.jumpToEndingForTesting();
    showTesterToast('测试跳转：已进入结局画面');
    return;
  }

  if (key !== 'k') return;
  event.preventDefault();
  armJumpChord();
}

function armJumpChord() {
  jumpChordActive.value = true;
  if (jumpChordTimer) clearTimeout(jumpChordTimer);
  jumpChordTimer = setTimeout(() => {
    clearJumpChord();
  }, 1800);
  showTesterToast('测试跳转：继续按 1–9 跳到指定天');
}

function clearJumpChord() {
  jumpChordActive.value = false;
  if (jumpChordTimer) {
    clearTimeout(jumpChordTimer);
    jumpChordTimer = null;
  }
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
  achievement.init();
  document.body.dataset.day = '1';
  document.body.dataset.phase = 'title';
  window.addEventListener('keydown', onTesterKeydown);
});

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return;
  window.removeEventListener('keydown', onTesterKeydown);
  if (toastTimer) clearTimeout(toastTimer);
  clearJumpChord();
});
</script>

<style scoped>
.tester-toast {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 120;
  margin: 0;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ink);
  box-shadow:
    0 12px 28px rgba(35, 24, 14, 0.2),
    0 0 0 1px rgba(255, 242, 214, 0.1);
}

.tester-toast-enter-active,
.tester-toast-leave-active {
  transition: opacity 240ms var(--ease-out-expo), transform 240ms var(--ease-out-expo);
}

.tester-toast-enter-from,
.tester-toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
