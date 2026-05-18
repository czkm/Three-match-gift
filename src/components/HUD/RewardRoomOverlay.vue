<template>
  <div class="room-overlay" :class="overlayTone">
    <!-- ═══ Door Selection ═══ -->
    <div v-if="phase === 'choose'" class="door-selection">
      <div class="room-card choose-card">
        <p class="intro-text">{{ REWARD_ROOM_COPY.intro }}</p>
        <div class="divider-zig-yellow" />
        <div class="doors">
          <button
            type="button"
            class="door-wrapper"
            @mouseenter="previewRoom('treasure')"
            @click="enterRoom('treasure')"
          >
            <div
              class="door treasure-door"
              :class="{ opening: enteringRoom === 'treasure' }"
            >
              <span class="door-icon">🎁</span>
              <span class="door-sign">
                {{ REWARD_ROOM_COPY.treasure.sign }}
              </span>
              <span class="door-knob">🗝️</span>
              <span class="light-particles" />
              <span
                v-if="enteringRoom === 'treasure'"
                class="light-burst treasure-burst"
              />
            </div>
            <p class="door-label">{{ REWARD_ROOM_COPY.treasure.label }}</p>
          </button>

          <button
            type="button"
            class="door-wrapper"
            @mouseenter="previewRoom('devil')"
            @click="enterRoom('devil')"
          >
            <div
              class="door devil-door"
              :class="{ opening: enteringRoom === 'devil' }"
            >
              <span class="door-icon">🔥</span>
              <span class="door-sign">{{ REWARD_ROOM_COPY.devil.sign }}</span>
              <span class="pentagram">✦</span>
              <span class="dark-pulse" />
              <span
                v-if="enteringRoom === 'devil'"
                class="light-burst devil-burst"
              />
            </div>
            <p class="door-label">{{ REWARD_ROOM_COPY.devil.label }}</p>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ Room Interior ═══ -->
    <div
      v-else-if="phase === 'room' && currentRoomType"
      class="room-interior"
      :class="`${currentRoomType}-room`"
    >
      <div class="room-card interior-card" :class="`${currentRoomType}-card`">
        <div class="room-particles" :class="`${currentRoomType}-particles`" />

        <template v-if="currentRoomType === 'treasure'">
          <div class="room-icon-block treasure-icon-block">
            <span class="room-main-icon">🎁</span>
            <div class="treasure-chest" />
          </div>
          <p class="room-flavor">{{ REWARD_ROOM_COPY.treasure.flavor }}</p>
        </template>

        <template v-else>
          <div class="room-icon-block devil-icon-block">
            <span class="room-main-icon">😈</span>
            <div class="devil-altar" />
          </div>
          <p class="room-flavor">{{ REWARD_ROOM_COPY.devil.flavor }}</p>
        </template>

        <div class="divider-zig-teal" />

        <div class="item-cards" :class="`${currentRoomType}-cards`">
          <button
            v-for="item in roomItems"
            :key="item.id"
            type="button"
            :class="[
              'item-card',
              `${currentRoomType}-item-card`,
              `quality-${item.quality}`,
              { exalted: item.quality === 3, legendary: item.quality >= 4 }
            ]"
            @click="pickItem(item)"
          >
            <div class="item-icon-frame" :class="`${currentRoomType}-frame`">
              <IsaacCollectibleIcon
                :reward-item-id="item.id"
                :size="32"
                :fallback-emoji="item.emoji"
              />
            </div>
            <span class="cn-name">{{ item.titleText || item.name }}</span>
            <span class="effect-desc">{{ item.description }}</span>
            <span v-if="currentRoomType === 'devil'" class="penalty">
              {{ item.penaltyText }}
            </span>
            <div class="card-footer">
              <span class="quality-badge">Q{{ item.quality }}</span>
              <span class="slot-icon">{{ slotEmoji(item.slot) }}</span>
            </div>
          </button>
        </div>

        <p v-if="currentRoomType === 'devil'" class="devil-warning">
          ⚠️ {{ REWARD_ROOM_COPY.devilWarning }}
        </p>
      </div>
    </div>

    <!-- ═══ Acquired ═══ -->
    <div
      v-else-if="phase === 'acquired' && acquiredItem"
      class="acquire-animation"
    >
      <div class="room-card acquire-card">
        <div class="acquire-glyph" :class="{ launching: launchStarted }">
          <IsaacCollectibleIcon
            :reward-item-id="acquiredItem.id"
            :size="52"
            :fallback-emoji="acquiredItem.emoji"
          />
        </div>
        <div v-if="flightFx" class="reward-flight-layer">
          <span class="reward-flight-burst" />
          <span class="reward-flight-trail" :style="flightFx.style" />
          <span class="reward-flight-glow" :style="flightFx.style" />
          <span class="reward-flight-token" :style="flightFx.style">
            <IsaacCollectibleIcon
              :reward-item-id="acquiredItem.id"
              :size="30"
              :fallback-emoji="acquiredItem.emoji"
            />
          </span>
        </div>
        <p class="acquire-text">
          {{ REWARD_ROOM_COPY.formatAcquiredText(acquiredItem.name) }}
        </p>
        <p v-if="geraltQuote" class="geralt-quote">"{{ geraltQuote }}"</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { audioManager } from '@/audio/AudioManager'
import { REWARD_ROOM_COPY } from '@/data/copy'
import { useGameStore } from '@/stores/gameStore'
import IsaacCollectibleIcon from '@/components/common/IsaacCollectibleIcon.vue'

const emit = defineEmits(['choose'])
const game = useGameStore()
const offer = computed(() => game.currentRewardOffer)

const phase = ref('choose')
const currentRoomType = ref('')
const enteringRoom = ref('')
const acquiredItem = ref(null)
const geraltQuote = ref('')
const launchStarted = ref(false)
const flightFx = ref(null)

let enterTimer = null
let acquireTimer = null
let flightLaunchTimer = null
let flightCleanupTimer = null

const overlayTone = computed(() => {
  if (phase.value === 'room' || phase.value === 'acquired')
    return currentRoomType.value || 'choose'
  return 'choose'
})

const roomItems = computed(() => {
  if (!offer.value || !currentRoomType.value) return []
  return offer.value[currentRoomType.value] || []
})

function clearTimers() {
  if (enterTimer) clearTimeout(enterTimer)
  if (acquireTimer) clearTimeout(acquireTimer)
  if (flightLaunchTimer) clearTimeout(flightLaunchTimer)
  if (flightCleanupTimer) clearTimeout(flightCleanupTimer)
  enterTimer = null
  acquireTimer = null
  flightLaunchTimer = null
  flightCleanupTimer = null
}

function previewRoom(roomType) {
  if (phase.value !== 'choose' || enteringRoom.value) return
  currentRoomType.value = roomType
}

function enterRoom(roomType) {
  if (phase.value !== 'choose' || enteringRoom.value) return
  const nextItems = offer.value?.[roomType] || []
  if (!nextItems.length) return
  clearTimers()
  currentRoomType.value = roomType
  enteringRoom.value = roomType
  enterTimer = setTimeout(() => {
    phase.value = 'room'
    enteringRoom.value = ''
  }, 600)
}

function pickItem(item) {
  if (!item || phase.value !== 'room') return
  acquiredItem.value = item
  geraltQuote.value = item.reaction || ''
  phase.value = 'acquired'
  launchStarted.value = false
  flightFx.value = null
  void startRewardFlight(item)
  acquireTimer = setTimeout(() => {
    emit('choose', item.id)
  }, 1880)
}

async function startRewardFlight(item) {
  await nextTick()
  const target = document.querySelector('[data-trinket-target="true"]')
  const source = document.querySelector('.acquire-animation')
  if (!target || !source) return
  const sourceRect = source.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const startX = Math.round(sourceRect.left + sourceRect.width / 2)
  const startY = Math.round(
    sourceRect.top + Math.min(sourceRect.height * 0.34, 120)
  )
  const endX = Math.round(
    targetRect.left + Math.min(targetRect.width * 0.18, 56)
  )
  const endY = Math.round(targetRect.top + targetRect.height / 2)
  const dx = endX - startX
  const dy = endY - startY
  const arc = Math.max(-180, Math.min(-92, -Math.abs(dx) * 0.24 - 80))

  flightFx.value = {
    itemId: item.id,
    style: {
      left: `${startX}px`,
      top: `${startY}px`,
      '--dx': `${dx}px`,
      '--dy': `${dy}px`,
      '--arc': `${arc}px`
    }
  }

  audioManager.playSFX('achievement', { vol: 0.56 })
  flightLaunchTimer = setTimeout(() => {
    launchStarted.value = true
  }, 120)
  flightCleanupTimer = setTimeout(() => {
    flightFx.value = null
    flightCleanupTimer = null
  }, 1380)
}

function slotEmoji(slot) {
  const map = {
    head: '🧠',
    feet: '👣',
    side: '⚔️',
    back: '🎒',
    float: '✨'
  }
  return map[slot] || '⚔️'
}

onMounted(() => {
  game.clearRewardItemInfo()
})

onBeforeUnmount(() => {
  clearTimers()
})
</script>

<style scoped>
/* ═══════════════════════════════════════════
   Reward Room — Animal Island Redesign
   Warm overlay + blob parchment cards + 3D shadows
   ═══════════════════════════════════════════ */

/* ── Overlay — warm, blurred ── */
.room-overlay {
  position: absolute;
  inset: 0;
  z-index: 300;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-overlay.choose,
.room-overlay.treasure,
.room-overlay.devil {
  background: rgba(114, 93, 66, 0.42);
  backdrop-filter: blur(3px);
  animation: room-overlay-in 400ms var(--ease-out-expo) forwards;
}

@keyframes room-overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ── Room Card — blob clip-path parchment panel ── */
.room-card {
  clip-path: url(#animal-modal-clip);
  background: #f7f3df;
  box-shadow: 0 4px 10px rgba(107, 92, 67, 0.42);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: card-enter 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 150ms both;
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.94);
  }
  60% {
    opacity: 1;
    transform: translateY(-4px) scale(1.02);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ── Card sizes ── */
.choose-card {
  width: min(580px, 90vw);
  padding: 40px 36px 36px;
}

.interior-card {
  width: min(720px, 92vw);
  padding: 36px 32px 32px;
}

.acquire-card {
  width: min(460px, 86vw);
  padding: 40px 36px 36px;
}

/* ── Flight layer — fixed overlay for trajectory ── */
.reward-flight-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 340;
}

/* ═══════════════════════════════════════════
   Phase 1 — Door Selection
   ═══════════════════════════════════════════ */

.door-selection {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.intro-text {
  margin: 0 0 22px;
  font-size: 28px;
  letter-spacing: 0.08em;
  color: #794f27;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  font-weight: 800;
}

.doors {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 56px;
  margin-top: 22px;
}

.door-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 200px;
  gap: 14px;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  outline: none;
}

.door-wrapper:focus-visible .door {
  outline: 2px solid var(--animal-primary-color);
  outline-offset: 2px;
}

/* ── Door — Animal Island 3D card ── */
.door {
  width: 150px;
  height: 200px;
  border-radius: 28px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}

.door:hover {
  transform: translateY(-2px);
}

.door:active {
  transform: translateY(1px);
}

/* ── Treasure Door ── */
.treasure-door {
  background: linear-gradient(180deg, #fdf5e6 0%, #f5e6c8 40%, #e8d5a3 100%);
  border: 2px solid #c9a84c;
  box-shadow: 0 5px #bdaea0;
}

.treasure-door:hover {
  border-color: #d4af37;
  box-shadow:
    0 6px #bdaea0,
    0 8px 24px rgba(201, 168, 76, 0.2);
}

.treasure-door:active {
  box-shadow: 0 2px #bdaea0;
}

.treasure-door::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    transparent 0px,
    transparent 12px,
    rgba(201, 168, 76, 0.06) 12px,
    rgba(201, 168, 76, 0.06) 14px
  );
  border-radius: inherit;
  pointer-events: none;
}

/* ── Devil Door ── */
.devil-door {
  background: linear-gradient(180deg, #faf5f5 0%, #f0e0e0 40%, #e5c8c8 100%);
  border: 2px solid #b87070;
  box-shadow: 0 5px #bdaea0;
}

.devil-door:hover {
  border-color: #c48888;
  box-shadow:
    0 6px #bdaea0,
    0 8px 24px rgba(180, 80, 80, 0.16);
}

.devil-door:active {
  box-shadow: 0 2px #bdaea0;
}

.devil-door::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      45deg,
      transparent 48%,
      rgba(180, 80, 80, 0.1) 48%,
      rgba(180, 80, 80, 0.1) 52%,
      transparent 52%
    ),
    linear-gradient(
      -45deg,
      transparent 48%,
      rgba(160, 60, 60, 0.08) 48%,
      rgba(160, 60, 60, 0.08) 52%,
      transparent 52%
    );
  border-radius: inherit;
  pointer-events: none;
}

/* ── Door content ── */
.door-icon {
  font-size: 52px;
  line-height: 1;
  z-index: 2;
  filter: drop-shadow(0 2px 4px rgba(114, 93, 66, 0.12));
}

.door-sign {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  z-index: 2;
  margin-top: 8px;
}

.treasure-door .door-sign {
  color: #8b6914;
}

.devil-door .door-sign {
  color: #8b3a3a;
}

.door-knob {
  position: absolute;
  bottom: 28px;
  right: 24px;
  font-size: 18px;
  z-index: 2;
  filter: drop-shadow(0 1px 2px rgba(114, 93, 66, 0.16));
}

.pentagram {
  position: absolute;
  top: 18px;
  right: 20px;
  font-size: 16px;
  color: rgba(180, 60, 60, 0.5);
  z-index: 2;
}

/* ── Door ambient effects ── */
.light-particles,
.dark-pulse {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 16px;
}

.light-particles {
  background: radial-gradient(ellipse, rgba(201, 168, 76, 0.28), transparent);
  animation: lightPulse 2.4s ease-in-out infinite;
}

.dark-pulse {
  background: radial-gradient(ellipse, rgba(180, 60, 60, 0.22), transparent);
  animation: darkPulse 3.2s ease-in-out infinite;
}

.light-burst {
  position: absolute;
  inset: -50%;
  opacity: 0;
  animation: burstIn 0.8s ease-out forwards;
}

.treasure-burst {
  background: radial-gradient(
    ellipse at center,
    rgba(201, 168, 76, 0.35) 0%,
    rgba(180, 140, 60, 0.1) 50%,
    transparent 70%
  );
}

.devil-burst {
  background: radial-gradient(
    ellipse at center,
    rgba(180, 60, 60, 0.3) 0%,
    rgba(140, 30, 30, 0.1) 50%,
    transparent 70%
  );
}

.door.opening {
  transform-origin: left center;
  animation: doorOpen 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}

.door-label {
  margin: 0;
  font-size: 14px;
  letter-spacing: 0.1em;
  color: #725d42;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  font-weight: 700;
}

/* ═══════════════════════════════════════════
   Phase 2 — Room Interior
   ═══════════════════════════════════════════ */

.room-interior {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  border-radius: inherit;
  overflow: hidden;
}

.treasure-particles {
  background-image:
    radial-gradient(
      circle 2px at 20% 30%,
      rgba(201, 168, 76, 0.16),
      transparent
    ),
    radial-gradient(
      circle 1.5px at 60% 20%,
      rgba(180, 140, 60, 0.12),
      transparent
    ),
    radial-gradient(
      circle 2px at 80% 70%,
      rgba(201, 168, 76, 0.1),
      transparent
    ),
    radial-gradient(
      circle 1px at 40% 80%,
      rgba(160, 120, 50, 0.14),
      transparent
    );
  background-size:
    200px 200px,
    150px 150px,
    180px 180px,
    120px 120px;
  animation: particleFloat 15s linear infinite;
}

.devil-particles {
  background-image:
    radial-gradient(
      circle 1.5px at 25% 40%,
      rgba(180, 60, 60, 0.14),
      transparent
    ),
    radial-gradient(circle 2px at 70% 25%, rgba(160, 40, 40, 0.1), transparent),
    radial-gradient(circle 1px at 50% 80%, rgba(140, 50, 50, 0.12), transparent);
  background-size:
    180px 180px,
    140px 140px,
    200px 200px;
  animation: devilParticleFloat 12s linear infinite;
}

/* ── Room header icon ── */
.room-icon-block {
  position: relative;
  z-index: 2;
  margin-bottom: 6px;
}

.room-main-icon {
  font-size: 60px;
  line-height: 1;
  filter: drop-shadow(0 2px 6px rgba(114, 93, 66, 0.12));
  display: block;
}

.treasure-icon-block .room-main-icon {
  animation: chest-float 3s ease-in-out infinite;
}

.devil-icon-block .room-main-icon {
  animation: altar-pulse 4s ease-in-out infinite;
}

.treasure-chest,
.devil-altar {
  display: none;
}

.room-flavor {
  position: relative;
  z-index: 2;
  margin: 4px 0 0;
  font-size: 14px;
  letter-spacing: 0.06em;
  color: #725d42;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  font-weight: 600;
}

/* ── Item cards row ── */
.item-cards {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 20px;
  width: 100%;
  margin-top: 20px;
}

/* ── Item Card — compact collectible card ── */
.item-card {
  width: 180px;
  height: 200px;
  padding: 18px 14px 14px;
  border-radius: 20px;
  text-align: center;
  position: relative;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  background: #f8f8f0;
  border: 2px solid #e8e2d6;
  box-shadow: 0 4px 10px rgba(114, 93, 66, 0.12);
  transform: translateY(0);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.item-card:hover {
  transform: translateY(-3px);
  border-color: #c9a84c;
  box-shadow:
    0 6px 16px rgba(114, 93, 66, 0.18),
    0 0 0 1px rgba(201, 168, 76, 0.08);
}

.item-card:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(114, 93, 66, 0.1);
}

.treasure-item-card {
  border-color: #e0d5b8;
}

.treasure-item-card:hover {
  border-color: #c9a84c;
}

.devil-item-card {
  border-color: #e8d5d5;
}

.devil-item-card:hover {
  border-color: #c48888;
  box-shadow:
    0 6px 16px rgba(114, 93, 66, 0.18),
    0 0 0 1px rgba(180, 80, 80, 0.06);
}

/* ── Item icon frame — bordered box ── */
.item-icon-frame {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  border: 2px solid rgba(114, 93, 66, 0.15);
  background: rgba(248, 245, 236, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 2px rgba(114, 93, 66, 0.06);
  flex-shrink: 0;
}

.treasure-frame {
  border-color: rgba(201, 168, 76, 0.2);
  background: rgba(255, 252, 240, 0.8);
}

.devil-frame {
  border-color: rgba(180, 80, 80, 0.2);
  background: rgba(255, 248, 248, 0.8);
}

.item-icon-frame :deep(.isaac-collectible-frame),
.item-icon-frame :deep(.isaac-collectible-fallback) {
  filter: drop-shadow(0 1px 2px rgba(114, 93, 66, 0.14));
}

.item-card.exalted .item-icon-frame :deep(.isaac-collectible-frame),
.item-card.exalted .item-icon-frame :deep(.isaac-collectible-fallback) {
  filter: drop-shadow(0 0 8px rgba(182, 122, 255, 0.18))
    drop-shadow(0 1px 2px rgba(114, 93, 66, 0.14));
}

.item-card.legendary .item-icon-frame :deep(.isaac-collectible-frame),
.item-card.legendary .item-icon-frame :deep(.isaac-collectible-fallback) {
  filter: drop-shadow(0 0 12px rgba(255, 132, 84, 0.24))
    drop-shadow(0 1px 2px rgba(114, 93, 66, 0.14));
  animation: reward-legendary-pulse 1.8s ease-in-out infinite;
}

.devil-item-card .item-icon-frame :deep(.isaac-collectible-frame),
.devil-item-card .item-icon-frame :deep(.isaac-collectible-fallback) {
  filter: drop-shadow(0 1px 2px rgba(140, 50, 50, 0.14));
}

/* ── Name ── */
.cn-name {
  display: block;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #794f27;
  line-height: 1.3;
  width: 100%;
}

/* ── Effect description ── */
.effect-desc {
  display: block;
  font-size: 11px;
  line-height: 1.6;
  color: #8a7b66;
  width: 100%;
  text-align: left;
  padding: 0 2px;
}

/* ── Devil penalty / cost ── */
.penalty {
  display: block;
  color: #b84444;
  font-size: 11px;
  font-weight: 600;
  width: 100%;
  text-align: left;
  padding: 6px 2px 0;
  margin-top: 2px;
  border-top: 1px solid rgba(180, 60, 60, 0.12);
}

/* ── Card footer: quality badge + slot icon ── */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid rgba(114, 93, 66, 0.08);
}

/* ── Quality badge (bottom-left of footer) ── */
.quality-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 50px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #725d42;
  background: rgba(114, 93, 66, 0.06);
  border: 1.5px solid rgba(114, 93, 66, 0.1);
}

.item-card.quality-2 .quality-badge {
  color: #8b6914;
  background: rgba(201, 168, 76, 0.1);
  border-color: rgba(201, 168, 76, 0.18);
}

.item-card.exalted .quality-badge {
  color: #7b5ea7;
  background: rgba(170, 120, 255, 0.12);
  border-color: rgba(170, 120, 255, 0.2);
}

.item-card.legendary .quality-badge {
  color: #d4743a;
  background: rgba(255, 118, 72, 0.12);
  border-color: rgba(255, 118, 72, 0.2);
}

/* ── Slot icon (bottom-right of footer) ── */
.slot-icon {
  font-size: 16px;
  line-height: 1;
  opacity: 0.55;
  filter: drop-shadow(0 1px 1px rgba(114, 93, 66, 0.08));
}

.devil-warning {
  position: relative;
  z-index: 2;
  color: #b84444;
  font-size: 12px;
  margin: 18px 0 0;
  font-weight: 600;
  letter-spacing: 0.04em;
}

/* ── Exalted / Legendary highlights ── */
.item-card.exalted::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background:
    radial-gradient(
      circle at 50% 18%,
      rgba(182, 122, 255, 0.08),
      transparent 36%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 42%);
}

.item-card.legendary::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background:
    radial-gradient(
      circle at 50% 18%,
      rgba(255, 182, 98, 0.12),
      transparent 34%
    ),
    radial-gradient(circle at 18% 82%, rgba(255, 84, 62, 0.08), transparent 24%);
}

.treasure-item-card.exalted {
  border-color: #c49de8;
  box-shadow:
    0 4px 10px rgba(114, 93, 66, 0.12),
    0 0 0 1px rgba(182, 122, 255, 0.1);
}

.treasure-item-card.legendary {
  border-color: #f0a16c;
  box-shadow:
    0 4px 10px rgba(114, 93, 66, 0.12),
    0 0 0 1px rgba(255, 140, 88, 0.12);
}

.devil-item-card.exalted {
  border-color: #9b6eb6;
  box-shadow:
    0 4px 10px rgba(114, 93, 66, 0.12),
    0 0 0 1px rgba(150, 90, 200, 0.1);
}

.devil-item-card.legendary {
  border-color: #dd7868;
  box-shadow:
    0 4px 10px rgba(114, 93, 66, 0.12),
    0 0 0 1px rgba(200, 80, 60, 0.12);
}

/* ═══════════════════════════════════════════
   Phase 3 — Acquired Animation
   ═══════════════════════════════════════════ */

.acquire-animation {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.acquire-glyph {
  font-size: 72px;
  line-height: 1;
  filter: drop-shadow(0 4px 8px rgba(114, 93, 66, 0.16));
  transition:
    transform 300ms var(--ease-out-expo),
    opacity 300ms var(--ease-out-expo);
}

.acquire-glyph.launching {
  animation: acquire-glyph-launch 420ms ease-out forwards;
}

.acquire-text {
  margin: 20px 0 0;
  font-size: 22px;
  font-weight: 700;
  color: #794f27;
  letter-spacing: 0.06em;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.geralt-quote {
  margin: 12px 0 0;
  max-width: 380px;
  text-align: center;
  font-size: 14px;
  line-height: 1.7;
  color: #8a7b66;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  font-weight: 500;
}

/* ═══════════════════════════════════════════
   Flight FX — trajectory animation
   ═══════════════════════════════════════════ */

.reward-flight-token,
.reward-flight-trail,
.reward-flight-glow,
.reward-flight-burst {
  position: fixed;
}

.reward-flight-burst {
  left: 50%;
  top: 50%;
  width: 140px;
  height: 140px;
  margin-left: -70px;
  margin-top: -80px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 231, 170, 0.38),
    transparent 70%
  );
  animation: reward-flight-burst 620ms ease-out forwards;
}

.reward-flight-token {
  z-index: 3;
  font-size: 58px;
  line-height: 1;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 0 16px rgba(255, 220, 144, 0.4))
    drop-shadow(0 10px 18px rgba(114, 93, 66, 0.18));
  animation: reward-flight-token 1.28s cubic-bezier(0.2, 0.88, 0.28, 1) forwards;
}

.reward-flight-glow {
  z-index: 2;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(255, 236, 192, 0.64),
    rgba(255, 190, 112, 0.18) 56%,
    transparent 72%
  );
  filter: blur(1px);
  animation: reward-flight-token 1.28s cubic-bezier(0.2, 0.88, 0.28, 1) forwards;
}

.reward-flight-trail {
  z-index: 1;
  width: 88px;
  height: 14px;
  border-radius: 999px;
  transform: translate(-50%, -50%);
  background: linear-gradient(
    90deg,
    rgba(255, 245, 214, 0.08),
    rgba(255, 214, 112, 0.6),
    rgba(255, 136, 78, 0.14)
  );
  filter: blur(4px);
  transform-origin: center center;
  animation: reward-flight-trail 1.28s cubic-bezier(0.2, 0.88, 0.28, 1) forwards;
}

/* ═══════════════════════════════════════════
   Keyframes
   ═══════════════════════════════════════════ */

@keyframes lightPulse {
  0%,
  100% {
    opacity: 0.4;
    transform: translateX(-50%) scaleY(1);
  }
  50% {
    opacity: 0.8;
    transform: translateX(-50%) scaleY(1.4);
  }
}

@keyframes darkPulse {
  0%,
  100% {
    opacity: 0.3;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 0.6;
    transform: translateX(-50%) scale(1.3);
  }
}

@keyframes burstIn {
  0% {
    opacity: 0;
    transform: scale(0.7);
  }
  40% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

@keyframes doorOpen {
  0% {
    transform: perspective(600px) rotateY(0deg);
    opacity: 1;
  }
  100% {
    transform: perspective(600px) rotateY(35deg);
    opacity: 0.3;
  }
}

@keyframes particleFloat {
  0% {
    background-position:
      0 0,
      0 0,
      0 0,
      0 0;
  }
  100% {
    background-position:
      200px 200px,
      -150px 150px,
      180px -180px,
      -120px -120px;
  }
}

@keyframes devilParticleFloat {
  0% {
    background-position:
      0 0,
      0 0,
      0 0;
  }
  100% {
    background-position:
      180px 180px,
      -140px 140px,
      200px -200px;
  }
}

@keyframes chest-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes altar-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
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
    transform: translate(calc(-50% + var(--dx) * 0.42), calc(-50% + var(--arc)))
      scale(0.98);
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy)))
      scale(0.54);
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
    transform: translate(
        calc(-50% + var(--dx) * 0.76),
        calc(-50% + (var(--dy) + var(--arc)) * 0.32)
      )
      scaleX(1.86);
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

@keyframes reward-legendary-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.06);
  }
}
</style>
