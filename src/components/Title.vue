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

      <div class="intercept-shell" :class="{ visible: showIntercept }" @click="onInterceptClick">
        <p class="speaker">杰洛特</p>
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
import { useGameStore } from '@/stores/gameStore';
import { ENDING } from '@/data/content';

const PREPARE_MS = 300;
const REWRITE_START_MS = 220;
const REWRITE_FINISH_DELAY_MS = 2800;
const INTERCEPT_CHAR_MS = 34;
const REWRITE_CHAR_MS = 84;

const game = useGameStore();
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
  beginRewrite();
}

function finishRewrite() {
  clearTimers();
  clearIntervalIfNeeded('rewrite');
  rewriteDisplay.value = ENDING.lockedGift;
  if (phase.value === 'handoff') return;
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
.title-screen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(255, 220, 160, 0.4) 0%, transparent 60%),
    linear-gradient(160deg, #f3e9cc 0%, #c5b78b 100%);
}
.card {
  width: min(460px, 100%);
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
.gift-stage {
  position: relative;
  min-height: 48px;
  margin-bottom: 8px;
}
.gift-input,
.attempt-overlay,
.rewrite-overlay {
  width: 100%;
  min-height: 40px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}
.gift-input {
  padding: 8px 10px;
  border: 1px solid var(--gold);
  background: rgba(255, 255, 255, 0.55);
  font-family: inherit;
  font-size: 14px;
  color: var(--ink);
  transition: opacity 280ms ease, transform 320ms ease, box-shadow 240ms ease;
}
.gift-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(208, 168, 87, 0.18);
}
.gift-input:disabled {
  cursor: default;
  color: transparent;
}
.gift-input.fading {
  opacity: 0.18;
  transform: translateY(-1px);
}
.attempt-overlay,
.rewrite-overlay {
  position: absolute;
  inset: 0;
  padding: 8px 10px;
  pointer-events: none;
}
.attempt-overlay {
  color: rgba(74, 53, 36, 0.56);
  font-size: 14px;
  font-style: italic;
  transform: rotate(-2.2deg);
  animation: attempt-in 240ms ease;
}
.attempt-text {
  position: relative;
  z-index: 1;
}
.attempt-strike {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 50%;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(208, 168, 87, 0.95) 12%, rgba(208, 168, 87, 0.95) 88%, transparent 100%);
  transform: scaleX(0.1);
  transform-origin: left center;
  animation: strike-draw 340ms ease forwards;
}
.rewrite-overlay {
  color: var(--ink);
  font-size: 18px;
  letter-spacing: 0.16em;
}
.rewrite-overlay.done {
  animation: rewrite-settle 360ms ease;
}
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 16px;
}
.preset {
  font-size: 11px;
  padding: 4px 10px;
  border: 1px solid rgba(208, 168, 87, 0.5);
  border-radius: 999px;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.35);
  transition: background 180ms ease, color 180ms ease, transform 180ms ease;
}
.preset:hover:not(:disabled) {
  background: var(--gold-soft);
  color: var(--ink);
  transform: translateY(-1px);
}
.preset:disabled {
  opacity: 0.45;
  cursor: default;
}

.intercept-shell {
  min-height: 74px;
  margin: 6px 0 14px;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid rgba(208, 168, 87, 0.28);
  background: rgba(255, 255, 255, 0.2);
  text-align: left;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 220ms ease, transform 260ms ease;
}
.intercept-shell.visible {
  opacity: 1;
  transform: translateY(0);
}
.speaker {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--gold);
}
.intercept-line {
  margin: 0;
  min-height: 38px;
  line-height: 1.7;
  color: var(--ink);
}
.cursor {
  display: inline-block;
  margin-left: 2px;
  color: var(--gold);
  animation: blink 700ms steps(1) infinite;
}

.start {
  min-width: 136px;
  background: var(--gold);
  color: var(--ink);
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
  transition: opacity 180ms ease, transform 180ms ease, background 180ms ease;
}
.start:hover:not(:disabled) {
  background: var(--gold-soft);
  transform: translateY(-1px);
}
.start:disabled {
  opacity: 0.45;
  cursor: default;
}
.start.waiting {
  opacity: 0.72;
}

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
  .card {
    padding: 28px 22px;
  }
  h1 { font-size: 28px; }
  h2.sub { letter-spacing: 0.22em; }
  .rewrite-overlay { font-size: 16px; }
}
</style>
