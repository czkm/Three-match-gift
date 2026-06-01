<template>
  <!-- ── Transition mode: floating narrative card ── -->
  <div v-if="isTransition" class="transition-overlay" @click="onOverlayClick">
    <!-- Dynamic transition particles -->
    <div class="transition-particles">
      <span
        v-for="p in transitionParticles"
        :key="p.id"
        class="t-particle"
        :style="{
          left: p.x + '%',
          top: p.y + '%',
          width: p.size + 'px',
          height: p.size + 'px',
          animationDuration: p.dur + 's',
          animationDelay: p.delay + 's',
          '--dx': p.dx + 'px',
          '--dy': p.dy + 'px',
          backgroundColor: p.color
        }"
      />
    </div>
    <!-- Light streaks across the overlay -->
    <div class="transition-streaks">
      <span
        v-for="s in transitionStreaks"
        :key="s.id"
        class="t-streak"
        :style="{
          left: s.x + '%',
          top: s.y + '%',
          width: s.len + 'px',
          animationDuration: s.dur + 's',
          animationDelay: s.delay + 's',
          transform: 'rotate(' + s.rot + 'deg)',
          background: s.gradient
        }"
      />
    </div>
    <div class="transition-card" @click.stop>
      <div class="transition-card-inner">
        <p class="transition-title">{{ card.title }}</p>
        <div class="transition-divider">
          <span class="divider-dot">✦</span>
        </div>
        <p class="transition-quote" v-if="card.quote">{{ card.quote }}</p>
        <div class="dialog-area">
          <Dialog
            v-if="activeLine"
            ref="dialogRef"
            class="transition-dialog"
            :text="activeLine"
            :hint="readyForAdvance ? '点击继续观礼' : COMMON_COPY.continueHint"
            @done="onDialogDone"
            @skip="onOverlayClick"
            @ready="onLineReady"
          />
        </div>
        <div v-if="readyForAdvance" class="action-row">
          <button class="advance-btn transition-btn" @click.stop="onAdvance">
            继续观礼
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Intro / Resolve mode: bottom-aligned card ── -->
  <div v-else class="wish-overlay" :class="`wish-stage-${game.djinnStage}`" @click="onOverlayClick">
    <!-- Stage-tinted ambient glow -->
    <div class="wish-ambient-glow" :style="{ background: stageGlowColor }" />
    <div class="card" @click.stop>
      <div class="portrait-panel">
        <div class="dual-portrait">
          <img src="/img/animal_icon.png" class="portrait-img timmy" alt="豆狸" />
          <img src="/img/animal_icon2.png" class="portrait-img tommy" alt="粒狸" />
        </div>
        <div class="name-plate">豆狸 &amp; 粒狸</div>
      </div>

      <div class="text-panel">
        <p class="title ink-title">{{ card.title }}</p>
        <p class="quote ink-subtle" v-if="card.quote">{{ card.quote }}</p>

        <div class="dialog-area">
          <Dialog
            v-if="activeLine"
            ref="dialogRef"
            class="wish-dialog"
            :text="activeLine"
            :hint="readyForAdvance ? actionHint : COMMON_COPY.continueHint"
            @done="onDialogDone"
            @skip="onOverlayClick"
            @ready="onLineReady"
          />
        </div>

        <div v-if="readyForAdvance" class="action-row">
          <button class="advance-btn" @click.stop="onAdvance">
            {{ actionLabel }}
          </button>
        </div>
        <div v-else-if="dialogRef?.isDone?.value && game.djinnCardMode === 'intro' && !boardReady" class="action-row">
          <span class="loading-text">棋盘正在重置...</span>
        </div>
        <div v-else-if="dialogRef?.isDone?.value" class="next-indicator">
          <span class="next-arrow">▶</span><span class="next-arrow">▶</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { audioManager } from '@/audio/AudioManager';
import EventBus from '@/core/eventBus';
import { COMMON_COPY, GAMEPLAY_COPY } from '@/data/copy';
import Dialog from './Dialog.vue';
import { useGameStore } from '@/stores/gameStore';

const game = useGameStore();
const lineIndex = ref(0);
const lineReady = ref(false);
const dialogRef = ref(null);
const boardReady = ref(game.djinnCardMode !== 'intro');

const isTransition = computed(() => game.djinnCardMode === 'transition');
const card = computed(() => game.currentDjinnCard || { title: '', quote: '', lines: [] });
const activeLine = computed(() => card.value.lines?.[lineIndex.value] || '');
const readyForAdvance = computed(() =>
  lineReady.value && lineIndex.value >= (card.value.lines?.length || 0) &&
  boardReady.value
);

onMounted(() => {
  if (game.djinnCardMode === 'intro') {
    boardReady.value = false
    EventBus.bind('ceremonyBoardReady', () => { boardReady.value = true })
  }
})
onBeforeUnmount(() => {
  EventBus.unbind('ceremonyBoardReady')
})

// Transition palette colors
const transitionPalette = computed(() => {
  const t = game.currentDjinnTransition
  if (!t?.palette) return { primary: 'rgba(168, 214, 156, 0.6)', secondary: 'rgba(176, 148, 201, 0.5)', glow: 'rgba(255, 220, 136, 0.7)' }
  return {
    primary: t.palette.primary || 'rgba(168, 214, 156, 0.6)',
    secondary: t.palette.secondary || 'rgba(176, 148, 201, 0.5)',
    glow: t.palette.glow || 'rgba(255, 220, 136, 0.7)'
  }
})

// Floating particles for transition animations
const transitionParticles = computed(() => {
  if (!isTransition.value) return []
  const palette = transitionPalette.value
  const colors = [palette.primary, palette.secondary, palette.glow]
  return Array.from({ length: 36 }, (_, i) => ({
    id: `tp-${i}`,
    x: Math.random() * 100,
    y: 60 + Math.random() * 40,
    size: 3 + Math.random() * 6,
    dur: 2 + Math.random() * 4,
    delay: Math.random() * 2,
    dx: (Math.random() - 0.5) * 160,
    dy: -(60 + Math.random() * 140),
    color: colors[i % colors.length]
  }))
})

// Light streaks
const transitionStreaks = computed(() => {
  if (!isTransition.value) return []
  const palette = transitionPalette.value
  return Array.from({ length: 8 }, (_, i) => ({
    id: `ts-${i}`,
    x: Math.random() * 100,
    y: Math.random() * 80,
    len: 80 + Math.random() * 200,
    rot: -30 + Math.random() * 60,
    dur: 3 + Math.random() * 4,
    delay: Math.random() * 3,
    gradient: `linear-gradient(90deg, transparent, ${palette.glow.replace('0.7', '0.15')}, transparent)`
  }))
})
const actionLabel = computed(() => (
  game.djinnCardMode === 'intro'
    ? GAMEPLAY_COPY.djinn.actionLabels.enterBoard
    : (game.djinnStage >= 3 ? GAMEPLAY_COPY.djinn.actionLabels.towardBirthday : GAMEPLAY_COPY.djinn.actionLabels.nextWish)
));
const actionHint = computed(() => (
  game.djinnCardMode === 'intro' ? GAMEPLAY_COPY.djinn.actionHints.enterBoard : COMMON_COPY.continueHint
));

// Stage-specific ambient glow for intro/resolve screen
const stageGlowColor = computed(() => {
  const stageColors = {
    1: 'radial-gradient(ellipse at 50% 80%, rgba(140, 210, 160, 0.12), transparent 55%)',
    2: 'radial-gradient(ellipse at 50% 80%, rgba(240, 200, 100, 0.14), transparent 55%)',
    3: 'radial-gradient(ellipse at 50% 80%, rgba(240, 160, 180, 0.12), transparent 55%)'
  }
  return stageColors[game.djinnStage] || 'none'
})

watch(() => game.djinnCardNonce, () => {
  lineIndex.value = 0;
  lineReady.value = false;
});

function onDialogDone() {
  if (lineIndex.value < (card.value.lines?.length || 0) - 1) {
    lineIndex.value++;
    lineReady.value = false;
  } else {
    lineIndex.value = card.value.lines?.length || 0;
    lineReady.value = true;
  }
}

function onLineReady() {
  lineReady.value = true;
}

function onAdvance() {
  audioManager.playSFX('pageflip', { vol: 0.4 });
  if (isTransition.value) {
    game.finishDjinnTransition();
    return;
  }
  if (game.djinnCardMode === 'intro') {
    game.beginDjinnBoardStage();
    return;
  }
  game.finishDjinnResolve();
}

function onOverlayClick() {
  if (readyForAdvance.value) {
    onAdvance();
    return;
  }
  if (!dialogRef.value?.isDone?.value) {
    dialogRef.value?.skipToEnd?.();
    return;
  }
  onDialogDone();
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════
   Transition mode — floating narrative card
   ═══════════════════════════════════════════════════════ */

.transition-overlay {
  position: absolute;
  inset: 0;
  z-index: 45;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: transparent;
  animation: fade-in 500ms var(--ease-out-expo);
  overflow: hidden;
}

/* ── Transition particles ── */
.transition-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.t-particle {
  position: absolute;
  border-radius: 50%;
  opacity: 0;
  animation: t-particle-rise var(--ease-out-expo) infinite;
  filter: blur(1px);
}

@keyframes t-particle-rise {
  0%   { opacity: 0; transform: translate(0, 0) scale(0.5); }
  15%  { opacity: 0.8; transform: translate(calc(var(--dx) * 0.2), calc(var(--dy) * 0.3)) scale(1); }
  70%  { opacity: 0.3; }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.3); }
}

/* ── Light streaks ── */
.transition-streaks {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.t-streak {
  position: absolute;
  height: 1.5px;
  border-radius: 1px;
  opacity: 0;
  animation: t-streak-drift var(--ease-in-out-sine) infinite;
}

@keyframes t-streak-drift {
  0%   { opacity: 0; transform: translateX(-20px); }
  20%  { opacity: 0.4; }
  60%  { opacity: 0.15; }
  100% { opacity: 0; transform: translateX(40px); }
}

.transition-card {
  width: min(440px, 88vw);
  clip-path: url(#animal-modal-clip);
  background:
    url('/img/background/overlay_card_ceremony.png') bottom center/auto 36px no-repeat,
    rgb(247, 243, 223);
  box-shadow:
    0 4px 12px rgba(107, 92, 67, 0.45),
    0 0 0 1px rgba(255, 242, 214, 0.2);
  animation: card-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  pointer-events: auto;
  position: relative;
  z-index: 2;
}

.transition-card-inner {
  padding: 32px 36px 38px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.transition-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #794f27;
  letter-spacing: 0.06em;
}

.transition-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 10px 0 8px;
}

.divider-dot {
  font-size: 10px;
  color: #c8b898;
  letter-spacing: 4px;
}

.transition-quote {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #9f927d;
  font-weight: 500;
  font-style: italic;
}

.transition-dialog {
  max-width: none;
  text-align: center;
  width: 100%;
  font-size: 14px;
}

.transition-btn {
  margin-top: 4px;
}

/* ═══════════════════════════════════════════════════════
   Intro / Resolve mode — bottom-aligned card (unchanged)
   ═══════════════════════════════════════════════════════ */

.wish-overlay {
  position: absolute;
  inset: 0;
  z-index: 45;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 20px 28px;
  background:
    radial-gradient(circle at 30% 30%, rgba(25, 200, 185, 0.06) 0%, transparent 40%),
    radial-gradient(circle at 70% 20%, rgba(247, 205, 103, 0.08) 0%, transparent 35%),
    rgba(114, 93, 66, 0.28);
  backdrop-filter: blur(2px);
  animation: fade-in 400ms var(--ease-out-expo);
}

/* Stage-tinted ambient glow */
.wish-ambient-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  transition: background 1s var(--ease-out-expo);
  animation: ambient-glow-in 800ms var(--ease-out-expo) forwards;
}

@keyframes ambient-glow-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.card {
  width: min(680px, 96vw);
  background: rgb(247, 243, 223);
  border-radius: 24px 24px 0 0;
  display: flex;
  flex-direction: row;
  gap: 0;
  box-shadow:
    0 -4px 12px rgba(107, 92, 67, 0.18),
    0 0 0 1px rgba(255, 242, 214, 0.15);
  animation: card-slide-up 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  overflow: hidden;
}

.portrait-panel {
  flex-shrink: 0;
  width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 12px 16px;
  background: linear-gradient(160deg, rgba(25, 200, 185, 0.04), rgba(245, 195, 28, 0.04));
  border-right: 1px solid rgba(200, 190, 170, 0.3);
  position: relative;
}

.dual-portrait {
  position: relative;
  width: 90px;
  height: 80px;
  margin-bottom: 10px;
}

.portrait-img {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 3px solid #19c8b9;
  box-shadow: 0 2px 0 0 #50B9AB;
  object-fit: cover;
  background: #f0e8d8;
  position: absolute;
}

.portrait-img.timmy {
  left: 0;
  bottom: 0;
  z-index: 2;
}

.portrait-img.tommy {
  right: 0;
  top: 0;
  z-index: 1;
  border-color: #f5c31c;
  box-shadow: 0 2px 0 0 #dba90e;
}

.name-plate {
  padding: 5px 16px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  background: #19c8b9;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 2px 0 0 #50B9AB;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  white-space: nowrap;
}

.text-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 24px 16px 20px;
}

.title {
  margin: 0 0 4px;
  font-size: 18px;
  letter-spacing: 0.08em;
  color: #794f27;
  font-weight: 800;
}

.quote {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.6;
  color: #9f927d;
  font-weight: 500;
}

.dialog-area {
  flex: 1;
  display: flex;
  align-items: flex-start;
}

.wish-dialog {
  max-width: none;
  text-align: left;
  width: 100%;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.advance-btn {
  height: 40px;
  padding: 0 28px;
  background: #19c8b9;
  color: #fff;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 2px solid #50B9AB;
  box-shadow: 0 4px 0 0 #50B9AB;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.advance-btn:hover {
  background: #3dd4c6;
  transform: translateY(-1px);
  box-shadow: 0 5px 0 0 #50B9AB;
}

.advance-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #50B9AB;
}

.next-indicator {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
  margin-top: 10px;
}

.next-arrow {
  font-size: 14px;
  color: #9f927d;
  animation: arrow-pop 1s ease-in-out infinite;
}

.next-arrow:last-child {
  animation-delay: 0.15s;
}

@keyframes arrow-pop {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.loading-text {
  font-size: 12px;
  color: #9f927d;
  animation: loading-pulse 1.2s ease-in-out infinite;
}

@keyframes loading-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes card-slide-up {
  from { opacity: 0; transform: translateY(30px); }
  60%  { opacity: 1; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
