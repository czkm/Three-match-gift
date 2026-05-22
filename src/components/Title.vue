<template>
  <div class="title-screen">
    <div class="card">
      <p class="emblem">⚜️</p>
      <h1 class="ink-title">Corvo Bianco</h1>
      <h2 class="ink-title sub">白鸦葡萄园</h2>
      <p class="byline ink-subtle">一份温柔的三连修复礼物 · 9 天</p>

      <blockquote class="quote">
        "听说你有了一座葡萄园。<br />
        种点什么。<br />
        等它好了，我也许会去看看。"
        <footer>—— Y</footer>
      </blockquote>

      <p class="ink-subtle gift-label">送给：</p>
      <div class="gift-stage" :class="[`stage-${phase}`, { rewritten: phase !== 'choice' }]">
        <input
          ref="giftInput"
          v-model="gift"
          class="gift-input"
          :class="{ fading: showAttemptStrike }"
          placeholder="要送给谁"
          maxlength="40"
          :disabled="isLocked"
        />
        <div v-if="showAttemptStrike" class="attempt-overlay" aria-hidden="true">
          <span class="attempt-text">{{ attemptedGift }}</span>
          <span class="attempt-strike" />
        </div>
        <div
          v-if="showRewriteText"
          class="rewrite-overlay ink-title"
          :class="{ done: phase === 'handoff' }"
          aria-live="polite"
        >
          {{ rewriteDisplay }}
          <span v-if="showRewriteCursor" class="cursor">▍</span>
        </div>
      </div>

      <div class="presets">
        <button
          v-for="p in presets"
          :key="p.id"
          class="preset"
          :disabled="isLocked"
          @click="gift = p.text"
        >{{ p.label }}</button>
      </div>

      <button class="achievement-entry" @click="openAchievements">
        <span class="entry-icon">🏆</span>
        <span class="entry-text">成就 {{ achievement.unlockedCount }} / {{ achievement.totalCount }}</span>
      </button>

      <div class="intercept-shell" :class="{ visible: showIntercept }" @click="onInterceptClick">
        <p class="speaker">白鸦</p>
        <p class="intercept-line">
          {{ interceptDisplay }}
          <span v-if="showInterceptCursor" class="cursor">▍</span>
        </p>
      </div>

      <button
        class="start"
        :class="{ waiting: phase !== 'choice' }"
        :disabled="isStartDisabled"
        @click="onStart"
      >{{ startLabel }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { audioManager } from '@/audio/AudioManager';
import { useAchievementStore } from '@/stores/achievementStore';
import { useGameStore } from '@/stores/gameStore';
import { ENDING } from '@/data/content';

const PREPARE_MS = 300;
const REWRITE_START_MS = 220;
const REWRITE_FINISH_DELAY_MS = 2800;
const INTERCEPT_CHAR_MS = 34;
const REWRITE_CHAR_MS = 84;

const game = useGameStore();
const achievement = useAchievementStore();
const gift = ref('');
const phase = ref('choice');
const attemptedGift = ref('');
const interceptDisplay = ref('');
const rewriteDisplay = ref('');
const giftInput = ref(null);
const presets = ENDING.giftPresets;
const timers = [];
let interceptInterval = null;
let rewriteInterval = null;

const emit = defineEmits(['start']);

const isLocked = computed(() => phase.value !== 'choice');
const canStart = computed(() => gift.value.trim().length > 0);
const isStartDisabled = computed(() => phase.value === 'choice' ? !canStart.value : true);
const showIntercept = computed(() => phase.value === 'intercept' || phase.value === 'rewrite' || phase.value === 'handoff');
const showAttemptStrike = computed(() => phase.value === 'rewrite' || phase.value === 'handoff');
const showRewriteText = computed(() => phase.value === 'rewrite' || phase.value === 'handoff');
const showInterceptCursor = computed(() => phase.value === 'intercept' && interceptDisplay.value.length < ENDING.interceptLine.length);
const showRewriteCursor = computed(() => phase.value === 'rewrite' && rewriteDisplay.value.length < ENDING.lockedGift.length);
const startLabel = computed(() => {
  if (phase.value === 'handoff') return '替你写好了';
  if (phase.value === 'choice') return '开始修复';
  return '等一下';
});

function onStart() {
  if (phase.value !== 'choice' || !canStart.value) return;
  attemptedGift.value = gift.value.trim();
  phase.value = 'intercept';
  interceptDisplay.value = '';
  timers.push(setTimeout(startIntercept, PREPARE_MS));
}

function openAchievements() {
  achievement.openPanel();
}

function onEnter() {
  if (phase.value === 'choice') {
    onStart();
    return;
  }
  if (phase.value === 'intercept') {
    finishIntercept();
    return;
  }
  if (phase.value === 'rewrite') {
    finishRewrite();
  }
}

function onWindowKeydown(event) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  onEnter();
}

function onInterceptClick() {
  if (phase.value === 'intercept') finishIntercept();
}

function startIntercept() {
  if (phase.value !== 'intercept') return;
  clearIntervalIfNeeded('intercept');
  interceptDisplay.value = '';
  let index = 0;
  interceptInterval = setInterval(() => {
    index++;
    interceptDisplay.value = ENDING.interceptLine.slice(0, index);
    if (index >= ENDING.interceptLine.length) {
      clearIntervalIfNeeded('intercept');
      timers.push(setTimeout(beginRewrite, REWRITE_START_MS));
    }
  }, INTERCEPT_CHAR_MS);
}

function beginRewrite() {
  if (phase.value === 'handoff' || phase.value === 'rewrite') return;
  phase.value = 'rewrite';
  clearIntervalIfNeeded('rewrite');
  rewriteDisplay.value = '';
  let index = 0;
  rewriteInterval = setInterval(() => {
    index++;
    rewriteDisplay.value = ENDING.lockedGift.slice(0, index);
    if (index >= ENDING.lockedGift.length) {
      clearIntervalIfNeeded('rewrite');
      completeFlow();
    }
  }, REWRITE_CHAR_MS);
}

function finishIntercept() {
  clearTimers();
  clearIntervalIfNeeded('intercept');
  interceptDisplay.value = ENDING.interceptLine;
  if (phase.value !== 'intercept') return;
  audioManager.playSFX('pageflip', { vol: 0.4 });
  beginRewrite();
}

function finishRewrite() {
  clearTimers();
  clearIntervalIfNeeded('rewrite');
  rewriteDisplay.value = ENDING.lockedGift;
  if (phase.value === 'handoff') return;
  audioManager.playSFX('pageflip', { vol: 0.4 });
  completeFlow();
}

function completeFlow() {
  if (phase.value === 'handoff') return;
  phase.value = 'handoff';
  gift.value = ENDING.lockedGift;
  game.setGiftDedication({
    finalText: ENDING.lockedGift,
    attemptedText: attemptedGift.value,
    overridden: attemptedGift.value !== ENDING.lockedGift
  });
  timers.push(setTimeout(commitStart, REWRITE_FINISH_DELAY_MS));
}

function commitStart() {
  game.start();
  game.setGiftDedication({
    finalText: ENDING.lockedGift,
    attemptedText: attemptedGift.value,
    overridden: attemptedGift.value !== ENDING.lockedGift
  });
  emit('start');
}

function clearIntervalIfNeeded(kind) {
  if (kind === 'intercept' && interceptInterval) {
    clearInterval(interceptInterval);
    interceptInterval = null;
  }
  if (kind === 'rewrite' && rewriteInterval) {
    clearInterval(rewriteInterval);
    rewriteInterval = null;
  }
}

function clearTimers() {
  while (timers.length) clearTimeout(timers.pop());
}

onMounted(() => {
  giftInput.value?.focus();
  window.addEventListener('keydown', onWindowKeydown);
});

onBeforeUnmount(() => {
  clearTimers();
  clearIntervalIfNeeded('intercept');
  clearIntervalIfNeeded('rewrite');
  window.removeEventListener('keydown', onWindowKeydown);
});
</script>

<style scoped>
/* ── Title screen — Animal Island style ── */
.title-screen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background:
    url('/img/background/home_bg.webp') center/cover no-repeat,
    radial-gradient(circle at 30% 30%, rgba(25, 200, 185, 0.04) 0%, transparent 40%),
    radial-gradient(circle at 70% 20%, rgba(247, 205, 103, 0.06) 0%, transparent 35%),
    linear-gradient(180deg, rgba(248, 248, 240, 0.55) 0%, rgba(247, 243, 223, 0.6) 50%, rgba(232, 223, 200, 0.7) 100%);
}

.card {
  clip-path: url(#animal-modal-clip);
  width: min(500px, 90vw);
  padding: 48px 48px 36px;
  text-align: center;
  background: rgb(247, 243, 223);
  animation: card-in 800ms cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 10px rgba(107, 92, 67, 0.42);
  position: relative;
  color: #725d42;
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(16px) scale(0.92); }
  60%  { opacity: 1; transform: translateY(-4px) scale(1.02); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.emblem {
  font-size: 48px;
  margin: 0 0 10px;
  filter: drop-shadow(0 2px 4px rgba(114, 93, 66, 0.08));
  animation: emblem-float 3s ease-in-out infinite;
}

@keyframes emblem-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}

h1 {
  font-size: 36px;
  margin: 0;
  letter-spacing: 0.06em;
  font-weight: 800;
  color: #794f27;
  font-family: 'Nunito', sans-serif;
}

h2.sub {
  font-size: 18px;
  margin: 6px 0 8px;
  letter-spacing: 0.08em;
  color: #9f927d;
  font-weight: 600;
}

.byline {
  font-size: 12px;
  margin: 0 0 20px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8a7b66;
  font-weight: 500;
}

.quote {
  margin: 0 auto 22px;
  padding: 16px 20px;
  font-size: 14px;
  line-height: 1.65;
  border-left: 3px solid #19c8b9;
  border-radius: 0 12px 12px 0;
  background: rgba(230, 249, 246, 0.3);
  text-align: left;
  color: #9f927d;
  font-weight: 500;
  font-style: italic;
}

.quote footer {
  margin-top: 8px;
  text-align: right;
  font-size: 12px;
  color: #725d42;
  font-style: normal;
}

/* ── Gift input — pill shape + 3D shadow ── */
.gift-label { margin: 18px 0 6px; font-size: 13px; font-weight: 500; }

.gift-stage {
  position: relative;
  min-height: 48px;
  margin-bottom: 8px;
}

.gift-input,
.attempt-overlay,
.rewrite-overlay {
  width: 100%;
  min-height: 45px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.gift-input {
  padding: 10px 20px;
  border: 2.5px solid #c4b89e;
  background: #f8f8f0;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #725d42;
  letter-spacing: 0.01em;
  box-shadow: 0 3px 0 0 #d4c9b4;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.gift-input:focus {
  outline: none;
  border-color: #f5c31c;
  box-shadow: 0 3px 0 0 #dba90e, 0 0 0 3px rgba(245, 195, 28, 0.15);
  background: #fff;
}

.gift-input:disabled {
  cursor: default;
  color: transparent;
  box-shadow: none;
  border-color: #eae4d0;
}

.gift-input.fading {
  opacity: 0.18;
  transform: translateY(-1px);
}

.attempt-overlay,
.rewrite-overlay {
  position: absolute;
  inset: 0;
  padding: 8px 20px;
  pointer-events: none;
}

.attempt-overlay {
  color: rgba(114, 93, 66, 0.6);
  font-size: 14px;
  font-style: italic;
  transform: rotate(-2.2deg);
  animation: attempt-in 240ms ease;
}

.attempt-text { position: relative; z-index: 1; }

.attempt-strike {
  position: absolute;
  left: 16px;
  right: 16px;
  top: 50%;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #19c8b9 12%, #19c8b9 88%, transparent 100%);
  transform: scaleX(0.1);
  transform-origin: left center;
  animation: strike-draw 340ms ease forwards;
}

.rewrite-overlay {
  color: #794f27;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.rewrite-overlay.done {
  animation: rewrite-settle 360ms ease;
}

/* ── Presets — small 3D pills ── */
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.preset {
  font-size: 12px;
  padding: 6px 14px;
  border: 2px solid #d4c9b4;
  border-radius: 50px;
  color: #9f927d;
  background: #f8f8f0;
  box-shadow: 0 3px 0 0 #d4c9b4;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  height: 32px;
}

.preset:hover:not(:disabled) {
  background: #19c8b9;
  color: #fff;
  border-color: #50B9AB;
  box-shadow: 0 4px 0 0 #50B9AB;
  transform: translateY(-1px);
}

.preset:active:not(:disabled) {
  box-shadow: 0 1px 0 0 #50B9AB;
  transform: translateY(2px);
}

.preset:disabled {
  opacity: 0.45;
  cursor: default;
  box-shadow: none;
}

/* ── Achievement entry — 3D pill ── */
.achievement-entry {
  margin: 0 auto 16px;
  padding: 8px 18px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 50px;
  background: #f8f8f0;
  border: 2px solid #d4c9b4;
  box-shadow: 0 4px 0 0 #d4c9b4;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  height: 36px;
}

.achievement-entry:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 0 0 #d4c9b4;
  border-color: #a89878;
}

.achievement-entry:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #d4c9b4;
}

.entry-icon { font-size: 18px; }

.entry-text {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #9f927d;
}

/* ── Intercept shell — blob modal style dialog ── */
.intercept-shell {
  clip-path: url(#animal-modal-clip);
  min-height: 74px;
  margin: 6px 0 14px;
  padding: 20px 24px;
  background: rgb(247, 243, 223);
  text-align: left;
  opacity: 0;
  transform: translateY(6px) scale(0.96);
  transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #725d42;
  box-shadow: 0 4px 10px rgba(107, 92, 67, 0.42);
}

.intercept-shell.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.speaker {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #19c8b9;
}

.intercept-line {
  margin: 0;
  min-height: 38px;
  line-height: 1.7;
  color: #725d42;
  font-weight: 500;
}

.cursor {
  display: inline-block;
  margin-left: 2px;
  color: #19c8b9;
  animation: blink 700ms steps(1) infinite;
}

/* ── Start button — mint teal 3D pill ── */
.start {
  min-width: 160px;
  height: 48px;
  background: #19c8b9;
  color: #fff;
  border-radius: 50px;
  padding: 0 32px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 2px solid #50B9AB;
  box-shadow: 0 5px 0 0 #50B9AB;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.start:hover:not(:disabled) {
  background: #3dd4c6;
  transform: translateY(-1px);
  box-shadow: 0 6px 0 0 #50B9AB;
}

.start:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #50B9AB;
}

.start:disabled {
  opacity: 0.45;
  cursor: default;
  box-shadow: none;
}

.start.waiting {
  background: #d4c9b4;
  border-color: #c4b89e;
  box-shadow: 0 5px 0 0 #bdaea0;
  color: #9f927d;
}

/* ── Keyframes ── */
@keyframes blink { 50% { opacity: 0; } }

@keyframes attempt-in {
  from { opacity: 0; transform: rotate(-2.2deg) translateY(2px); }
  to   { opacity: 1; transform: rotate(-2.2deg) translateY(0); }
}

@keyframes strike-draw {
  from { transform: scaleX(0.1); opacity: 0; }
  to   { transform: scaleX(1); opacity: 1; }
}

@keyframes rewrite-settle {
  0%   { opacity: 0.85; transform: translateY(1px); }
  100% { opacity: 1; transform: translateY(0); }
}

@media (max-width: 560px) {
  .card { padding: 36px 24px 28px; }
  h1 { font-size: 28px; }
  h2.sub { letter-spacing: 0.04em; }
  .rewrite-overlay { font-size: 16px; }
}
</style>
