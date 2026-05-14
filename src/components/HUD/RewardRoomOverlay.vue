<template>
  <div class="room-overlay" :class="overlayTone">
    <div v-if="phase === 'choose'" class="door-selection">
      <p class="intro-text">门开了。</p>
      <div class="doors">
        <button type="button" class="door-wrapper" @mouseenter="previewRoom('treasure')" @click="enterRoom('treasure')">
          <div class="door treasure-door" :class="{ opening: enteringRoom === 'treasure' }">
            <span class="door-sign">宝箱房</span>
            <span class="door-preview">🎁</span>
            <span class="door-knob">🗝️</span>
            <span class="light-particles" />
            <span v-if="enteringRoom === 'treasure'" class="light-burst treasure-burst" />
          </div>
          <p class="door-label">稳妥</p>
        </button>

        <button type="button" class="door-wrapper" @mouseenter="previewRoom('devil')" @click="enterRoom('devil')">
          <div class="door devil-door" :class="{ opening: enteringRoom === 'devil' }">
            <span class="door-sign">恶魔房</span>
            <span class="pentagram">✦</span>
            <span class="door-preview">🔥</span>
            <span class="dark-pulse" />
            <span v-if="enteringRoom === 'devil'" class="light-burst devil-burst" />
          </div>
          <p class="door-label">危险</p>
        </button>
      </div>
    </div>

    <div v-else-if="phase === 'room' && currentRoomType" class="room-interior" :class="`${currentRoomType}-room`">
      <div class="room-particles" :class="`${currentRoomType}-particles`" />

      <template v-if="currentRoomType === 'treasure'">
        <div class="treasure-chest" />
        <p class="room-flavor">温暖的金色光芒充满整个房间。</p>
      </template>

      <template v-else>
        <div class="devil-altar" />
        <p class="room-flavor">黑暗中有红色的光。</p>
      </template>

      <div class="item-cards" :class="`${currentRoomType}-cards`">
        <button
          v-for="item in roomItems"
          :key="item.id"
          type="button"
          :class="['item-card', `${currentRoomType}-item-card`, `quality-${item.quality}`]"
          @click="pickItem(item)"
        >
          <span class="emoji">{{ item.emoji }}</span>
          <span class="cn-name">{{ item.titleText || item.name }}</span>
          <span class="original-desc">{{ item.flavorText || `“${item.enName}”` }}</span>
          <div class="divider" aria-hidden="true" />
          <span class="actual-effect">{{ item.description }}</span>
          <div class="stars">
            <span v-for="n in 4" :key="n" class="star" :class="{ filled: n <= item.quality }">★</span>
          </div>
          <span v-if="currentRoomType === 'devil'" class="penalty">{{ item.penaltyText }}</span>
        </button>
      </div>

      <p v-if="currentRoomType === 'devil'" class="devil-warning">
        ⚠️ 选择后明天步数将减少
      </p>
    </div>

    <div v-else-if="phase === 'acquired' && acquiredItem" class="acquire-animation">
      <div class="acquire-glyph" :class="{ launching: launchStarted }">{{ acquiredItem.emoji }}</div>
      <div
        v-if="flightFx"
        class="reward-flight-layer"
      >
        <span class="reward-flight-burst" />
        <span class="reward-flight-trail" :style="flightFx.style" />
        <span class="reward-flight-glow" :style="flightFx.style" />
        <span class="reward-flight-token" :style="flightFx.style">{{ acquiredItem.emoji }}</span>
      </div>
      <p class="acquire-text">获得了 {{ acquiredItem.name }}</p>
      <p v-if="geraltQuote" class="geralt-quote">“{{ geraltQuote }}”</p>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { audioManager } from '@/audio/AudioManager';
import { useGameStore } from '@/stores/gameStore';

const emit = defineEmits(['choose']);
const game = useGameStore();
const offer = computed(() => game.currentRewardOffer);

const phase = ref('choose');
const currentRoomType = ref('');
const enteringRoom = ref('');
const acquiredItem = ref(null);
const geraltQuote = ref('');
const launchStarted = ref(false);
const flightFx = ref(null);

let enterTimer = null;
let acquireTimer = null;
let flightLaunchTimer = null;
let flightCleanupTimer = null;

const overlayTone = computed(() => {
  if (phase.value === 'room' || phase.value === 'acquired') return currentRoomType.value || 'choose';
  return 'choose';
});

const roomItems = computed(() => {
  if (!offer.value || !currentRoomType.value) return [];
  return offer.value[currentRoomType.value] || [];
});

function clearTimers() {
  if (enterTimer) clearTimeout(enterTimer);
  if (acquireTimer) clearTimeout(acquireTimer);
  if (flightLaunchTimer) clearTimeout(flightLaunchTimer);
  if (flightCleanupTimer) clearTimeout(flightCleanupTimer);
  enterTimer = null;
  acquireTimer = null;
  flightLaunchTimer = null;
  flightCleanupTimer = null;
}

function previewRoom(roomType) {
  if (phase.value !== 'choose' || enteringRoom.value) return;
  currentRoomType.value = roomType;
}

function enterRoom(roomType) {
  if (phase.value !== 'choose' || enteringRoom.value) return;
  const nextItems = offer.value?.[roomType] || [];
  if (!nextItems.length) return;
  clearTimers();
  currentRoomType.value = roomType;
  enteringRoom.value = roomType;
  enterTimer = setTimeout(() => {
    phase.value = 'room';
    enteringRoom.value = '';
  }, 600);
}

function pickItem(item) {
  if (!item || phase.value !== 'room') return;
  acquiredItem.value = item;
  geraltQuote.value = item.reaction || '';
  phase.value = 'acquired';
  launchStarted.value = false;
  flightFx.value = null;
  void startRewardFlight(item);
  acquireTimer = setTimeout(() => {
    emit('choose', item.id);
  }, 1880);
}

async function startRewardFlight(item) {
  await nextTick();
  const target = document.querySelector('[data-trinket-target="true"]');
  const source = document.querySelector('.acquire-animation');
  if (!target || !source) return;
  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const startX = Math.round(sourceRect.left + sourceRect.width / 2);
  const startY = Math.round(sourceRect.top + Math.min(sourceRect.height * 0.34, 120));
  const endX = Math.round(targetRect.left + Math.min(targetRect.width * 0.18, 56));
  const endY = Math.round(targetRect.top + targetRect.height / 2);
  const dx = endX - startX;
  const dy = endY - startY;
  const arc = Math.max(-180, Math.min(-92, -Math.abs(dx) * 0.24 - 80));

  flightFx.value = {
    itemId: item.id,
    style: {
      left: `${startX}px`,
      top: `${startY}px`,
      '--dx': `${dx}px`,
      '--dy': `${dy}px`,
      '--arc': `${arc}px`
    }
  };

  audioManager.playSFX('achievement', { vol: 0.56 });
  flightLaunchTimer = setTimeout(() => {
    launchStarted.value = true;
  }, 120);
  flightCleanupTimer = setTimeout(() => {
    flightFx.value = null;
    flightCleanupTimer = null;
  }, 1380);
}

onMounted(() => {
  game.clearRewardItemInfo();
});

onBeforeUnmount(() => {
  clearTimers();
});
</script>

<style scoped>
.room-overlay {
  position: absolute;
  inset: 0;
  z-index: 300;
  overflow: hidden;
}

.reward-flight-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 340;
}

.room-overlay.choose {
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 232, 178, 0.08), transparent 26%),
    rgba(12, 8, 7, 0.9);
}

.room-overlay.treasure {
  background: linear-gradient(180deg, #2a2018 0%, #3d3220 50%, #2a2018 100%);
}

.room-overlay.devil {
  background: linear-gradient(180deg, #0d0505 0%, #1a0a0a 40%, #0d0505 100%);
}

.door-selection,
.room-interior,
.acquire-animation {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.acquire-glyph {
  font-size: 72px;
  line-height: 1;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.36));
}

.acquire-text {
  margin: 18px 0 0;
  font-size: 24px;
  font-weight: 700;
  color: #fff0cf;
  letter-spacing: 0.08em;
}

.geralt-quote {
  margin: 14px 0 0;
  max-width: 520px;
  text-align: center;
  font-size: 15px;
  line-height: 1.7;
  color: rgba(255, 240, 220, 0.84);
}

@keyframes reward-flight-burst {
  0% {
    opacity: 0;
    transform: scale(0.4);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.28);
  }
}

@keyframes reward-flight-token {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.46);
  }
  14% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.18);
  }
  46% {
    opacity: 1;
    transform: translate(calc(-50% + var(--dx) * 0.42), calc(-50% + var(--arc))) scale(0.98);
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.54);
  }
}

@keyframes reward-flight-trail {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scaleX(0.34);
  }
  18% {
    opacity: 0.92;
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--dx) * 0.76), calc(-50% + (var(--dy) + var(--arc)) * 0.32)) scaleX(1.86);
  }
}

@keyframes acquire-glyph-launch {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.18;
    transform: scale(0.82);
  }
}

.reward-flight-token,
.reward-flight-trail,
.reward-flight-glow,
.reward-flight-burst {
  position: fixed;
}

.door-selection {
  gap: 22px;
}

.intro-text {
  margin: 0;
  font-size: 38px;
  letter-spacing: 0.18em;
  color: #efe4d2;
  text-shadow: 0 8px 18px rgba(0, 0, 0, 0.38);
}

.reward-flight-burst {
  left: 50%;
  top: 50%;
  width: 140px;
  height: 140px;
  margin-left: -70px;
  margin-top: -80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 231, 170, 0.42), transparent 70%);
  animation: reward-flight-burst 620ms ease-out forwards;
}

.reward-flight-token {
  z-index: 3;
  font-size: 58px;
  line-height: 1;
  transform: translate(-50%, -50%);
  filter:
    drop-shadow(0 0 16px rgba(255, 220, 144, 0.46))
    drop-shadow(0 10px 18px rgba(52, 28, 14, 0.22));
  animation: reward-flight-token 1.28s cubic-bezier(0.2, 0.88, 0.28, 1) forwards;
}

.reward-flight-glow {
  z-index: 2;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 236, 192, 0.72), rgba(255, 190, 112, 0.22) 56%, transparent 72%);
  filter: blur(1px);
  animation: reward-flight-token 1.28s cubic-bezier(0.2, 0.88, 0.28, 1) forwards;
}

.reward-flight-trail {
  z-index: 1;
  width: 88px;
  height: 14px;
  border-radius: 999px;
  transform: translate(-50%, -50%);
  background: linear-gradient(90deg, rgba(255, 245, 214, 0.1), rgba(255, 214, 112, 0.7), rgba(255, 136, 78, 0.18));
  filter: blur(4px);
  transform-origin: center center;
  animation: reward-flight-trail 1.28s cubic-bezier(0.2, 0.88, 0.28, 1) forwards;
}

.acquire-glyph.launching {
  animation: acquire-glyph-launch 420ms ease-out forwards;
}

.doors {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 120px;
}

.door-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.door {
  width: 160px;
  height: 240px;
  border-radius: 80px 80px 4px 4px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.door:hover,
.door-wrapper:focus-visible .door {
  transform: scale(1.04);
}

.door-wrapper:focus-visible {
  outline: none;
}

.treasure-door {
  background: linear-gradient(180deg, #c9a84c 0%, #a08030 30%, #7a6020 60%, #5a4010 100%);
  border: 3px solid #d4af37;
  box-shadow:
    0 0 40px rgba(212, 175, 55, 0.3),
    inset 0 0 20px rgba(255, 215, 0, 0.1);
}

.treasure-door::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0px, transparent 14px, rgba(0, 0, 0, 0.06) 14px, rgba(0, 0, 0, 0.06) 16px);
  border-radius: inherit;
}

.treasure-door:hover {
  box-shadow:
    0 0 60px rgba(212, 175, 55, 0.5),
    inset 0 0 30px rgba(255, 215, 0, 0.15);
}

.devil-door {
  background: linear-gradient(180deg, #2a1018 0%, #1a0a10 40%, #0d0508 100%);
  border: 3px solid #5a1a1a;
  box-shadow:
    0 0 40px rgba(180, 30, 30, 0.2),
    inset 0 0 20px rgba(255, 0, 0, 0.05);
}

.devil-door::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(45deg, transparent 48%, rgba(120, 20, 20, 0.3) 48%, rgba(120, 20, 20, 0.3) 52%, transparent 52%),
    linear-gradient(-45deg, transparent 48%, rgba(80, 10, 10, 0.2) 48%, rgba(80, 10, 10, 0.2) 52%, transparent 52%);
  border-radius: inherit;
}

.devil-door::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 30px;
  background: linear-gradient(0deg, rgba(180, 30, 30, 0.4), transparent);
}

.devil-door:hover {
  box-shadow:
    0 0 60px rgba(220, 50, 50, 0.4),
    inset 0 0 30px rgba(255, 0, 0, 0.1);
  border-color: #7a2222;
}

.door-sign {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  font-family: "Cinzel", "Times New Roman", serif;
  font-size: 14px;
  letter-spacing: 2px;
  z-index: 2;
}

.treasure-door .door-sign {
  color: #d4af37;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.devil-door .door-sign {
  color: #cc4444;
  text-shadow: 0 0 8px rgba(180, 30, 30, 0.5);
}

.door-preview {
  position: absolute;
  top: 86px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 46px;
  z-index: 2;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35));
}

.door-knob {
  position: absolute;
  bottom: 50px;
  right: 25px;
  font-size: 22px;
  z-index: 2;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

.pentagram {
  position: absolute;
  top: 62px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
  color: rgba(204, 68, 68, 0.68);
  text-shadow: 0 0 12px rgba(180, 30, 30, 0.48);
  z-index: 2;
}

.light-particles,
.dark-pulse {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 20px;
}

.light-particles {
  background: radial-gradient(ellipse, rgba(255, 215, 100, 0.4), transparent);
  animation: lightPulse 2s ease-in-out infinite;
}

.dark-pulse {
  background: radial-gradient(ellipse, rgba(180, 30, 30, 0.5), transparent);
  animation: darkPulse 3s ease-in-out infinite;
}

.light-burst {
  position: absolute;
  inset: -50%;
  opacity: 0;
  animation: burstIn 0.8s ease-out forwards;
}

.treasure-burst {
  background: radial-gradient(ellipse at center, rgba(255, 215, 100, 0.6) 0%, rgba(255, 180, 60, 0.2) 50%, transparent 70%);
}

.devil-burst {
  background: radial-gradient(ellipse at center, rgba(220, 50, 50, 0.5) 0%, rgba(150, 20, 20, 0.15) 50%, transparent 70%);
}

.door.opening {
  transform-origin: left center;
  animation: doorOpen 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}

.door-label {
  margin: 0;
  font-size: 15px;
  letter-spacing: 0.12em;
  color: #d7c8b6;
}

.timer {
  margin: 0;
  font-size: 13px;
  color: rgba(238, 224, 204, 0.72);
}

.room-interior {
  z-index: 1;
  gap: 18px;
}

.room-interior::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.devil-room::before {
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.6) 100%);
}

.room-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.treasure-particles {
  background-image:
    radial-gradient(circle 2px at 20% 30%, rgba(255, 215, 100, 0.3), transparent),
    radial-gradient(circle 1.5px at 60% 20%, rgba(255, 200, 80, 0.25), transparent),
    radial-gradient(circle 2px at 80% 70%, rgba(255, 215, 100, 0.2), transparent),
    radial-gradient(circle 1px at 40% 80%, rgba(255, 190, 60, 0.3), transparent);
  background-size: 200px 200px, 150px 150px, 180px 180px, 120px 120px;
  animation: particleFloat 15s linear infinite;
}

.devil-particles {
  background-image:
    radial-gradient(circle 1.5px at 25% 40%, rgba(180, 30, 30, 0.4), transparent),
    radial-gradient(circle 2px at 70% 25%, rgba(150, 20, 20, 0.3), transparent),
    radial-gradient(circle 1px at 50% 80%, rgba(200, 40, 40, 0.35), transparent);
  background-size: 180px 180px, 140px 140px, 200px 200px;
  animation: devilParticleFloat 12s linear infinite;
}

.treasure-chest {
  width: 120px;
  height: 90px;
  background: linear-gradient(180deg, #8b6914 0%, #c9a84c 30%, #a08030 70%, #5a4010 100%);
  border: 2px solid #d4af37;
  border-radius: 8px 8px 4px 4px;
  position: relative;
  box-shadow:
    0 4px 20px rgba(212, 175, 55, 0.3),
    inset 0 2px 10px rgba(255, 215, 0, 0.2);
  animation: chestGlow 3s ease-in-out infinite;
  z-index: 2;
}

.treasure-chest::before {
  content: '';
  position: absolute;
  top: -15px;
  left: -2px;
  right: -2px;
  height: 30px;
  background: linear-gradient(180deg, #c9a84c 0%, #a08030 100%);
  border: 2px solid #d4af37;
  border-radius: 8px 8px 0 0;
}

.treasure-chest::after {
  content: '🔒';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
}

.devil-altar {
  width: 100px;
  height: 120px;
  background: linear-gradient(180deg, #3a1010 0%, #1a0505 100%);
  border: 2px solid #5a1a1a;
  border-radius: 8px 8px 4px 4px;
  position: relative;
  box-shadow:
    0 0 30px rgba(180, 30, 30, 0.3),
    inset 0 0 15px rgba(255, 0, 0, 0.1);
  animation: altarPulse 4s ease-in-out infinite;
  z-index: 2;
}

.devil-altar::before {
  content: '😈';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  filter: drop-shadow(0 0 10px rgba(180, 30, 30, 0.5));
}

.room-flavor {
  position: relative;
  z-index: 2;
  margin: 0;
  font-size: 15px;
  letter-spacing: 0.08em;
  color: rgba(232, 221, 208, 0.84);
}

.item-cards {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 22px;
  width: 100%;
  max-width: 700px;
}

.item-card {
  width: 180px;
  min-height: 280px;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  position: relative;
  transition: all 0.25s ease;
  cursor: pointer;
}

.treasure-item-card {
  background: linear-gradient(180deg, #2a2018, #1a1410);
  border: 2px solid #c9a84c;
}

.treasure-item-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 30px rgba(201, 168, 76, 0.3);
  border-color: #d4af37;
}

.devil-item-card {
  background: linear-gradient(180deg, #1a0808, #0d0404);
  border: 2px solid #5a1a1a;
}

.devil-item-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 30px rgba(180, 30, 30, 0.3);
  border-color: #7a2222;
}

.item-card .emoji {
  display: block;
  font-size: 48px;
  margin-bottom: 8px;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
}

.devil-item-card .emoji {
  filter: drop-shadow(0 0 6px rgba(180, 30, 30, 0.3));
}

.item-card .cn-name {
  display: block;
  font-family: "Cinzel", "Times New Roman", serif;
  font-size: 16px;
  letter-spacing: 2px;
}

.treasure-item-card .cn-name {
  color: #e8ddd0;
}

.devil-item-card .cn-name {
  color: #cc8888;
}

.item-card .original-desc {
  display: block;
  font-size: 13px;
  font-style: italic;
  margin-top: 8px;
}

.treasure-item-card .original-desc {
  color: #b8a070;
}

.devil-item-card .original-desc {
  color: #cc5555;
}

.divider {
  width: 100%;
  height: 2px;
  margin: 16px 0 14px;
  background: currentColor;
  opacity: 0.22;
}

.actual-effect {
  display: block;
  font-size: 12px;
  line-height: 1.8;
  color: #8a857d;
}

.stars {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 3px;
}

.star {
  color: #555;
  font-size: 14px;
}

.treasure-item-card .star.filled {
  color: #d4af37;
  text-shadow: 0 0 6px rgba(212, 175, 55, 0.5);
}

.devil-item-card .star.filled {
  color: #cc3333;
  text-shadow: 0 0 6px rgba(204, 51, 51, 0.5);
}

.penalty {
  display: block;
  color: #cc3333;
  font-size: 12px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(120, 20, 20, 0.3);
}

.devil-warning {
  position: relative;
  z-index: 2;
  color: #cc4444;
  font-size: 13px;
  text-align: center;
  margin: 0;
  font-style: italic;
  text-shadow: 0 0 8px rgba(180, 30, 30, 0.3);
}

.acquire-animation {
  background: rgba(8, 6, 6, 0.86);
  gap: 12px;
}

@keyframes lightPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

@keyframes darkPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}

@keyframes doorOpen {
  0% {
    transform: perspective(600px) rotateY(0deg);
    opacity: 1;
  }
  100% {
    transform: perspective(600px) rotateY(-80deg);
    opacity: 0.2;
  }
}

@keyframes burstIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.3); }
  100% { opacity: 0.9; transform: scale(1); }
}

@keyframes chestGlow {
  0%, 100% { box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3); }
  50% { box-shadow: 0 4px 40px rgba(212, 175, 55, 0.5); }
}

@keyframes altarPulse {
  0%, 100% { box-shadow: 0 0 30px rgba(180, 30, 30, 0.3); }
  50% { box-shadow: 0 0 50px rgba(220, 50, 50, 0.5); }
}

@keyframes particleFloat {
  to { transform: translateY(30px) translateX(10px); }
}

@keyframes devilParticleFloat {
  to { transform: translateY(25px) translateX(-8px); }
}

@keyframes acquireFloat {
  0% { transform: translateY(24px) scale(0.86); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

@media (max-width: 860px) {
  .doors {
    flex-direction: column;
    gap: 28px;
  }

  .item-cards {
    flex-direction: column;
    align-items: center;
  }
}
</style>
