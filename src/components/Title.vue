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

      <button class="achievement-entry parchment" @click="openAchievements">
        <span class="entry-icon">🏆</span>
        <span class="entry-text">成就 {{ achievement.unlockedCount }} / {{ achievement.totalCount }}</span>
      </button>

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
.title-screen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background:
    radial-gradient(ellipse at 50% 26%, rgba(255, 214, 142, 0.32) 0%, transparent 40%),
    radial-gradient(circle at 18% 80%, rgba(198, 160, 120, 0.12) 0%, transparent 35%),
    linear-gradient(180deg, rgba(36, 24, 18, 0.08) 0%, rgba(16, 10, 8, 0.28) 100%),
    linear-gradient(160deg, #cdb37f 0%, #6f5c41 46%, #261d16 100%);
}
.card {
  width: min(500px, 100%);
  padding: 38px 42px;
  text-align: center;
  border-radius: var(--radius-lg);
  animation: card-in 800ms var(--ease-out-expo);
  box-shadow:
    var(--surface-shadow),
    0 0 0 1px rgba(255, 242, 214, 0.08),
    inset 0 1px 0 rgba(255, 248, 230, 0.35);
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.emblem { font-size: 44px; margin: 0 0 10px; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)); animation: emblem-float 3s var(--ease-in-out-sine) infinite; }
@keyframes emblem-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
h1 { font-size: 36px; margin: 0; letter-spacing: 0.24em; text-transform: uppercase; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }
h2.sub { font-size: 18px; margin: 6px 0 8px; letter-spacing: 0.44em; color: var(--ink-soft); }
.byline { font-size: 11px; margin: 0 0 20px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-faint); }
.quote {
  margin: 0 auto 22px;
  padding: 16px 20px;
  font-style: italic;
  font-size: 14px;
  line-height: 1.65;
  border-left: 3px solid var(--gold-soft);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: rgba(255, 246, 224, 0.22);
  text-align: left;
  color: var(--ink-soft);
  box-shadow: inset 0 0 0 1px rgba(208, 168, 87, 0.08);
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
  padding: 10px 12px;
  border: 1px solid rgba(132, 88, 38, 0.46);
  background: rgba(255, 251, 242, 0.56);
  font-family: inherit;
  font-size: 14px;
  color: var(--ink);
  transition: opacity 280ms ease, transform 320ms ease, box-shadow 240ms ease;
}
.gift-input:focus {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(208, 168, 87, 0.2),
    0 12px 24px rgba(30, 20, 14, 0.1);
  border-color: rgba(208, 168, 87, 0.65);
  background: rgba(255, 251, 242, 0.72);
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

.achievement-entry {
  margin: 0 auto 16px;
  padding: 8px 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: var(--radius-pill);
  background: rgba(255, 248, 230, 0.62);
  border: 1px solid rgba(92, 60, 28, 0.24);
  box-shadow: 0 8px 18px rgba(28, 18, 12, 0.12);
  transition: transform 200ms var(--ease-out-expo), box-shadow 200ms var(--ease-out-expo), background 200ms var(--ease-out-expo);
}

.achievement-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(28, 18, 12, 0.18);
  background: rgba(255, 248, 230, 0.82);
}

.entry-icon {
  font-size: 18px;
}

.entry-text {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
}
.preset {
  font-size: 11px;
  padding: 5px 11px;
  border: 1px solid rgba(208, 168, 87, 0.4);
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
  padding: 11px 14px;
  border-radius: 12px;
  border: 1px solid rgba(208, 168, 87, 0.28);
  background: rgba(255, 250, 240, 0.18);
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
  min-width: 144px;
  background: linear-gradient(180deg, var(--gold-soft) 0%, var(--gold) 100%);
  color: var(--ink);
  border-radius: var(--radius-pill);
  padding: 11px 32px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.1em;
  transition: opacity 200ms var(--ease-out-expo), transform 200ms var(--ease-out-expo), box-shadow 200ms var(--ease-out-expo), filter 200ms var(--ease-out-expo);
  border: 1px solid rgba(86, 54, 24, 0.38);
  box-shadow:
    0 8px 18px rgba(28, 18, 10, 0.22),
    inset 0 1px 0 rgba(255, 248, 230, 0.35);
}
.start:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-2px);
  box-shadow:
    0 14px 28px rgba(28, 18, 10, 0.28),
    inset 0 1px 0 rgba(255, 248, 230, 0.4);
}
.start:active:not(:disabled) {
  transform: translateY(0);
  box-shadow:
    0 4px 10px rgba(28, 18, 10, 0.18),
    inset 0 1px 0 rgba(255, 248, 230, 0.3);
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
