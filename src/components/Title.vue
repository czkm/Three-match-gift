<template>
  <div class="title-screen">
    <div class="card parchment grain">
      <p class="emblem">⚜️</p>
      <h1 class="ink-title">Corvo Bianco</h1>
      <h2 class="ink-title sub">白鸦葡萄园</h2>
      <p class="byline ink-subtle">一份温柔的三消修复礼物 · 9 天</p>

      <blockquote class="quote">
        "听说你有了一座葡萄园。<br />
        种点什么。<br />
        等它好了，我也许会去看看。"
        <footer>—— Y</footer>
      </blockquote>

      <p class="ink-subtle gift-label">送给：</p>
      <input
        v-model="gift"
        class="gift-input"
        placeholder="献给你"
        maxlength="40"
      />
      <div class="presets">
        <button
          v-for="p in presets"
          :key="p.id"
          class="preset"
          @click="gift = p.text"
        >{{ p.label }}</button>
      </div>

      <button class="start" @click="onStart">开始修复</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { ENDING } from '@/data/content';

const game = useGameStore();
const gift = ref('');
const presets = ENDING.giftPresets;

const emit = defineEmits(['start']);

function onStart() {
  game.setGiftText(gift.value);
  game.start();
  emit('start');
}
</script>

<style scoped>
.title-screen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(255, 220, 160, 0.4) 0%, transparent 60%),
    linear-gradient(160deg, #f3e9cc 0%, #c5b78b 100%);
}
.card {
  width: 460px;
  padding: 36px 40px;
  text-align: center;
  border-radius: 8px;
  animation: card-in 700ms ease;
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.emblem { font-size: 42px; margin: 0 0 6px; }
h1 { font-size: 32px; margin: 0; letter-spacing: 0.18em; }
h2.sub { font-size: 18px; margin: 4px 0 4px; letter-spacing: 0.4em; }
.byline { font-size: 12px; margin: 0 0 16px; letter-spacing: 0.18em; }
.quote {
  margin: 0 auto 20px;
  padding: 14px 18px;
  font-style: italic;
  font-size: 14px;
  border-left: 2px solid var(--gold);
  text-align: left;
  color: var(--ink-soft);
}
.quote footer { margin-top: 8px; text-align: right; font-size: 12px; color: var(--ink); }

.gift-label { margin: 18px 0 6px; font-size: 12px; }
.gift-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--gold);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.55);
  font-family: inherit;
  font-size: 14px;
  color: var(--ink);
  margin-bottom: 8px;
}
.presets { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; margin-bottom: 16px; }
.preset {
  font-size: 11px;
  padding: 3px 8px;
  border: 1px solid rgba(208, 168, 87, 0.5);
  border-radius: 999px;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.35);
}
.preset:hover { background: var(--gold-soft); color: var(--ink); }

.start {
  background: var(--gold);
  color: var(--ink);
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.start:hover { background: var(--gold-soft); }
</style>
