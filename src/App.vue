<template>
  <Title v-if="game.phase === 'title'" @start="onStart" />
  <GameContainer
    v-else-if="['intro', 'playing', 'targeting', 'dayEnd', 'repairing'].includes(game.phase)"
  />
  <Ending
    v-else-if="['ending', 'final'].includes(game.phase)"
    @restart="onRestart"
  />
</template>

<script setup>
import { onMounted, watchEffect } from 'vue';
import Title from './components/Title.vue';
import GameContainer from './components/GameContainer.vue';
import Ending from './components/Ending.vue';
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();

function onStart() {
  // Title has already called game.start() — fire-and-forget.
}

function onRestart() {
  game.phase = 'title';
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
});
</script>
