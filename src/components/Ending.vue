<template>
  <div class="ending">
    <div class="sky-glow" />
    <div class="room">
      <div class="wall" />
      <div class="window">
        <span class="moon">🌙</span>
        <span class="raven">🕊</span>
      </div>
      <div class="curtain curtain-left" />
      <div class="curtain curtain-right" />
      <div class="bed">
        <span class="pillow left">🛏️</span>
        <span class="pillow right">🛏️</span>
      </div>
      <div class="table">
        <span class="cake">🎂</span>
        <span v-if="beatIndex >= 1" class="candles">🕯️🕯️🕯️</span>
        <span v-if="beatIndex >= 2" class="lilac">🪻</span>
      </div>
    </div>

    <transition name="card-fade">
      <div v-if="showCard" class="card parchment grain">
        <p class="beat-title ink-title">{{ activeBeat?.title }}</p>
        <div class="lines">
          <p
            v-for="(line, index) in shownLines"
            :key="`${beatIndex}-${index}`"
            class="line"
          >
            {{ line }}
          </p>
        </div>

        <div v-if="beatDone && activeBeat?.id === 'wishes'" class="candle-lines">
          <p
            v-for="(line, index) in ENDING.candleLines"
            :key="`candle-${index}`"
            class="candle-line ink-subtle"
          >
            {{ line }}
          </p>
        </div>

        <div v-if="isLastBeat && beatDone" class="signature-block">
          <p v-if="showAttemptedGift" class="attempted-signature">{{ game.giftAttemptedText }}</p>
          <p class="signature">{{ game.giftText }}</p>
          <p class="blessing">{{ ENDING.blessingLine }}</p>
        </div>

        <button v-if="beatDone" class="restart" @click="onAdvance">
          {{ isLastBeat ? '再开一座葡萄园' : '继续' }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { audioManager } from '@/audio/AudioManager';
import { useAchievementStore } from '@/stores/achievementStore';
import { useGameStore } from '@/stores/gameStore';
import { ENDING } from '@/data/content';

const achievement = useAchievementStore();
const game = useGameStore();
const beatIndex = ref(0);
const showCard = ref(false);
const linesRevealed = ref(0);
const beatDone = ref(false);
const timers = [];

const activeBeat = computed(() => ENDING.beats[beatIndex.value] || null);
const shownLines = computed(() => activeBeat.value?.lines?.slice(0, linesRevealed.value) || []);
const isLastBeat = computed(() => beatIndex.value >= ENDING.beats.length - 1);
const showAttemptedGift = computed(() => (
  game.giftWasOverridden &&
  game.giftAttemptedText &&
  game.giftAttemptedText !== game.giftText
));

const emit = defineEmits(['restart']);

onMounted(() => {
  timers.push(setTimeout(() => {
    showCard.value = true;
    revealBeat();
  }, 700));
});

onBeforeUnmount(() => {
  for (const timer of timers) clearTimeout(timer);
});

function revealBeat() {
  linesRevealed.value = 0;
  beatDone.value = false;
  const lines = activeBeat.value?.lines || [];
  let index = 0;

  const tick = () => {
    index++;
    linesRevealed.value = index;
    if (index < lines.length) {
      timers.push(setTimeout(tick, 1100));
      return;
    }
    beatDone.value = true;
    if (isLastBeat.value) {
      achievement.track('endingSeen', { day: 9 });
    }
  };

  if (!lines.length) {
    beatDone.value = true;
    return;
  }

  tick();
}

function onAdvance() {
  if (!beatDone.value) return;
  audioManager.playSFX('pageflip', { vol: 0.4 });
  if (isLastBeat.value) {
    emit('restart');
    return;
  }
  beatIndex.value++;
  revealBeat();
}
</script>

<style scoped>
.ending {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 14%, rgba(252, 208, 142, 0.28), transparent 28%),
    linear-gradient(180deg, #8e5239 0%, #5d3357 48%, #23182e 100%);
}

.sky-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 78% 24%, rgba(255, 228, 170, 0.2), transparent 18%),
    radial-gradient(circle at 26% 58%, rgba(202, 168, 224, 0.12), transparent 28%);
}

.room {
  position: absolute;
  inset: 10% 14% 18%;
  border-radius: 24px 24px 8px 8px;
  overflow: hidden;
  box-shadow:
    0 28px 52px rgba(18, 8, 12, 0.34),
    inset 0 0 0 1px rgba(255, 240, 220, 0.1);
}

.wall {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 22%, rgba(255, 216, 166, 0.14), transparent 24%),
    linear-gradient(180deg, rgba(170, 134, 110, 0.96), rgba(96, 72, 88, 0.98));
}

.window {
  position: absolute;
  top: 12%;
  right: 12%;
  width: 140px;
  height: 180px;
  border-radius: 12px;
  background:
    radial-gradient(circle at 50% 28%, rgba(248, 224, 178, 0.18), transparent 34%),
    linear-gradient(180deg, rgba(44, 28, 56, 0.96), rgba(20, 14, 34, 0.98));
  box-shadow: inset 0 0 0 4px rgba(214, 188, 172, 0.16);
}

.moon {
  position: absolute;
  top: 18px;
  right: 20px;
  font-size: 26px;
}

.raven {
  position: absolute;
  bottom: 16px;
  right: 16px;
  font-size: 22px;
}

.curtain {
  position: absolute;
  top: 12%;
  width: 42px;
  height: 180px;
  background: linear-gradient(180deg, rgba(208, 176, 224, 0.92), rgba(132, 100, 148, 0.98));
  border-radius: 18px;
}

.curtain-left {
  right: calc(12% + 118px);
}

.curtain-right {
  right: calc(12% - 20px);
}

.bed {
  position: absolute;
  left: 10%;
  bottom: 18%;
  width: 260px;
  height: 120px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(154, 112, 96, 0.94), rgba(96, 62, 58, 0.98));
  box-shadow: inset 0 0 0 1px rgba(255, 240, 220, 0.08);
}

.pillow {
  position: absolute;
  top: 14px;
  font-size: 42px;
}

.pillow.left {
  left: 24px;
}

.pillow.right {
  right: 24px;
}

.table {
  position: absolute;
  left: 50%;
  bottom: 20%;
  transform: translateX(-50%);
  width: 200px;
  height: 120px;
  border-radius: 50% 50% 14px 14px;
  background: linear-gradient(180deg, rgba(104, 70, 54, 0.96), rgba(62, 40, 30, 0.98));
  box-shadow: 0 18px 22px rgba(18, 8, 12, 0.24);
}

.cake {
  position: absolute;
  left: 50%;
  bottom: 30px;
  transform: translateX(-50%);
  font-size: 78px;
}

.candles {
  position: absolute;
  left: 50%;
  bottom: 92px;
  transform: translateX(-50%);
  font-size: 22px;
  letter-spacing: 4px;
}

.lilac {
  position: absolute;
  left: 36px;
  top: 14px;
  font-size: 24px;
}

.card {
  position: absolute;
  left: 50%;
  bottom: 8%;
  transform: translateX(-50%);
  width: min(720px, 90vw);
  padding: 24px 28px 22px;
  border-radius: 12px;
  text-align: center;
}

.beat-title {
  margin: 0 0 14px;
  font-size: 22px;
  letter-spacing: 0.08em;
}

.lines {
  display: grid;
  gap: 10px;
}

.line {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--ink);
}

.candle-lines {
  margin-top: 12px;
}

.candle-line {
  margin: 0;
  line-height: 1.8;
}

.signature-block {
  margin-top: 16px;
}

.attempted-signature {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--ink-faint);
}

.signature {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
}

.blessing {
  margin: 0;
  font-size: 14px;
  color: var(--ink-soft);
}

.restart {
  margin-top: 18px;
  padding: 10px 22px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(244, 216, 154, 0.95), rgba(208, 168, 87, 0.96));
  color: var(--ink);
  font-weight: 700;
}

.card-fade-enter-active {
  transition: opacity 500ms ease, transform 500ms ease;
}

.card-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
</style>
