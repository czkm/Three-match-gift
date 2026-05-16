<template>
  <div class="pig-layer">
    <div
      class="pig-anchor"
      :class="[stateClass, { active, frozen: isFrozen }]"
      :style="anchorStyle"
      :tabindex="interactive ? 0 : -1"
      :aria-disabled="!interactive"
      role="button"
      aria-label="宠物猪"
      @mouseenter="handleInspect"
      @click="handleInspect"
      @keydown.enter.prevent="handleInspect"
      @keydown.space.prevent="handleInspect"
    >
      <span class="pig-shadow" />
      <span class="pig-sprite" :style="spriteStyle">
        <span class="pig-glyph">{{ pigGlyph }}</span>
      </span>
      <button
        v-for="trinket in visibleTrinkets"
        :key="trinket.key"
        class="pig-trinket"
        :class="[
          `trinket-${trinket.index}`,
          `quality-${trinket.quality}`,
          `tone-${trinket.tone}`,
          `slot-${trinket.slot}`
        ]"
        :title="trinket.label"
        :aria-label="trinket.label"
        type="button"
        @click.stop="handleTrinketInspect(trinket.id)"
      >
        <span class="pig-trinket-emoji">{{ trinket.emoji }}</span>
      </button>
      <span v-if="moodGlyph" class="pig-mood">{{ moodGlyph }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  displayStage: { type: Number, default: 0 },
  interactive: { type: Boolean, default: true },
  repairing: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  mood: { type: String, default: '' },
  trinkets: { type: Array, default: () => [] }
})

const emit = defineEmits(['inspect', 'inspect-trinket'])

const PATH_NODES = [
  { x: 7, y: 30, minStage: 0 },
  { x: 10, y: 32, minStage: 1 },
  { x: 16, y: 29, minStage: 2 },
  { x: 21, y: 33, minStage: 2 },
  { x: 27, y: 30, minStage: 3 },
  { x: 32, y: 32, minStage: 3 },
  { x: 38, y: 29, minStage: 4 },
  { x: 43, y: 33, minStage: 4 },
  { x: 49, y: 30, minStage: 5 },
  { x: 54, y: 32, minStage: 5 },
  { x: 60, y: 29, minStage: 6 },
  { x: 65, y: 33, minStage: 6 },
  { x: 71, y: 30, minStage: 7 },
  { x: 76, y: 32, minStage: 7 },
  { x: 82, y: 29, minStage: 8 },
  { x: 87, y: 33, minStage: 8 },
  { x: 93, y: 30, minStage: 9 }
]

const state = ref('idle')
const currentIndex = ref(0)
const direction = ref(1)
const moveMs = ref(1800)
const facing = ref(1)
const position = ref({ x: PATH_NODES[0].x, y: PATH_NODES[0].y })

let roamTimer = null

const isFrozen = computed(() => props.repairing || !props.interactive)
const maxIndex = computed(() => {
  let idx = 0
  for (let i = 0; i < PATH_NODES.length; i++) {
    if (props.displayStage >= PATH_NODES[i].minStage) idx = i
  }
  return idx
})

const pigGlyph = computed(() =>
  state.value === 'walking' ? '🐖' : '🐷'
)
const moodGlyph = computed(() => props.mood || '')
const visibleTrinkets = computed(() =>
  [...(props.trinkets || [])]
    .filter(item => item?.emoji)
    .sort((a, b) => (b.quality || 0) - (a.quality || 0) || (a.day || 0) - (b.day || 0))
    .slice(0, 8)
    .map((item, index) => ({
      id: item.id,
      key: `${item.id}-${item.day || index}`,
      index,
      emoji: item.emoji,
      quality: item.quality || 0,
      tone: item.tone || item.roomType || 'treasure',
      slot: item.slot || 'float',
      label: `${item.name || '道具'} ${item.enName || ''}`.trim()
    }))
)
const stateClass = computed(() => `is-${state.value}`)
const anchorStyle = computed(() => ({
  left: `${position.value.x}%`,
  bottom: `${position.value.y}px`,
  transitionDuration: `${moveMs.value}ms`
}))
const spriteStyle = computed(() => ({
  '--pig-facing': facing.value
}))

function clearRoamTimer() {
  if (roamTimer) clearTimeout(roamTimer)
  roamTimer = null
}

function scheduleNext(fn, ms) {
  clearRoamTimer()
  roamTimer = setTimeout(fn, ms)
}

function clampIndex(index) {
  return Math.max(0, Math.min(maxIndex.value, index))
}

function nodeAt(index) {
  return PATH_NODES[clampIndex(index)] || PATH_NODES[0]
}

function syncPosition(index = currentIndex.value) {
  const node = nodeAt(index)
  currentIndex.value = clampIndex(index)
  position.value = { x: node.x, y: node.y }
}

function randomPauseMs() {
  return 900 + Math.round(Math.random() * 1500)
}

function settleState() {
  return Math.random() < 0.36 ? 'sniffing' : 'idle'
}

function movementMs(fromNode, toNode) {
  const distance =
    Math.abs(toNode.x - fromNode.x) + Math.abs(toNode.y - fromNode.y) * 0.7
  return Math.max(1600, Math.min(3000, Math.round(1600 + distance * 34)))
}

function chooseNextIndex() {
  const limit = maxIndex.value
  if (limit <= 0) return 0

  let next = currentIndex.value + direction.value
  if (next < 0 || next > limit) {
    direction.value *= -1
    next = currentIndex.value + direction.value
  } else if (
    currentIndex.value > 0 &&
    currentIndex.value < limit &&
    Math.random() < 0.24
  ) {
    direction.value *= -1
    next = currentIndex.value + direction.value
  }

  return clampIndex(next)
}

function queueRoam(ms = randomPauseMs()) {
  if (isFrozen.value || props.active) return
  scheduleNext(startMove, ms)
}

function settleAndContinue(ms = randomPauseMs()) {
  state.value = settleState()
  queueRoam(ms)
}

function startMove() {
  if (isFrozen.value || props.active) return

  const fromNode = nodeAt(currentIndex.value)
  const nextIndex = chooseNextIndex()
  const toNode = nodeAt(nextIndex)

  if (nextIndex === currentIndex.value) {
    settleAndContinue(randomPauseMs())
    return
  }

  facing.value = toNode.x >= fromNode.x ? 1 : -1
  moveMs.value = movementMs(fromNode, toNode)
  currentIndex.value = nextIndex
  position.value = { x: toNode.x, y: toNode.y }
  state.value = 'walking'

  scheduleNext(() => {
    settleAndContinue(state.value === 'sniffing' ? 1400 : randomPauseMs())
  }, moveMs.value)
}

function pauseForInspect() {
  if (isFrozen.value) return
  state.value = 'inspected'
  scheduleNext(() => {
    if (isFrozen.value) return
    settleAndContinue(1100)
  }, 2500)
}

function handleInspect() {
  if (!props.interactive) return
  emit('inspect')
  pauseForInspect()
}

function handleTrinketInspect(itemId) {
  if (!props.interactive) return
  emit('inspect-trinket', itemId)
  pauseForInspect()
}

watch(
  () => maxIndex.value,
  () => {
    syncPosition(currentIndex.value)
  }
)

watch(
  () => isFrozen.value,
  frozen => {
    clearRoamTimer()
    if (frozen) {
      state.value = 'paused'
      return
    }
    state.value = props.active ? 'inspected' : 'idle'
    if (props.active) {
      pauseForInspect()
      return
    }
    queueRoam(700)
  },
  { immediate: true }
)

watch(
  () => props.active,
  active => {
    if (isFrozen.value) return
    if (active) {
      pauseForInspect()
      return
    }
    if (state.value === 'inspected') settleAndContinue(700)
  }
)

watch(
  () => props.displayStage,
  () => {
    if (currentIndex.value > maxIndex.value) {
      direction.value = -1
      syncPosition(maxIndex.value)
    }
  }
)

onMounted(() => {
  currentIndex.value = Math.min(1, maxIndex.value)
  syncPosition(currentIndex.value)
  if (!isFrozen.value && !props.active) queueRoam(900)
})

onBeforeUnmount(() => {
  clearRoamTimer()
})
</script>

<style scoped>
.pig-layer {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
}

.pig-anchor {
  position: absolute;
  width: 68px;
  height: 42px;
  margin-left: -34px;
  padding: 0;
  border: none;
  background: none;
  pointer-events: auto;
  cursor: pointer;
  overflow: visible;
  transition-property: left, bottom;
  transition-timing-function: cubic-bezier(0.22, 0.9, 0.34, 1);
}

.pig-anchor:disabled {
  cursor: default;
}

.pig-shadow {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 36px;
  height: 10px;
  border-radius: 50%;
  transform: translateX(-50%);
  background: radial-gradient(
    ellipse,
    rgba(62, 38, 20, 0.42),
    rgba(62, 38, 20, 0.04) 72%,
    transparent 100%
  );
  transition: width 180ms ease, opacity 180ms ease;
}

.pig-sprite {
  position: absolute;
  left: 50%;
  bottom: 6px;
  transform-origin: center bottom;
}

.pig-glyph {
  display: block;
  font-size: 28px;
  line-height: 1;
  opacity: 0.98;
  transform: translateX(-50%) scaleX(var(--pig-facing));
  filter:
    drop-shadow(0 2px 4px rgba(56, 34, 20, 0.36))
    drop-shadow(0 0 6px rgba(255, 245, 214, 0.2));
}

.pig-anchor.active .pig-shadow {
  width: 42px;
  opacity: 0.56;
}

.pig-anchor.active .pig-glyph {
  filter:
    drop-shadow(0 2px 4px rgba(56, 34, 20, 0.34))
    drop-shadow(0 0 10px rgba(255, 230, 170, 0.2));
}

.pig-trinket {
  position: absolute;
  left: 50%;
  bottom: 24px;
  z-index: 2;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transform: translate(var(--tx), var(--ty)) rotate(var(--rot));
  filter:
    drop-shadow(0 1px 2px rgba(30, 18, 12, 0.32))
    drop-shadow(0 0 5px rgba(255, 245, 214, 0.18));
  animation: pig-trinket-bob 2.4s ease-in-out infinite;
}

.pig-trinket:hover,
.pig-trinket:focus-visible {
  filter:
    drop-shadow(0 1px 2px rgba(30, 18, 12, 0.32))
    drop-shadow(0 0 8px rgba(255, 224, 160, 0.36));
}

.pig-trinket-emoji {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}

.pig-trinket:focus-visible {
  outline: 1px solid rgba(255, 238, 198, 0.88);
  outline-offset: 2px;
  border-radius: 999px;
}

.pig-trinket.trinket-0 { --tx: -34px; --ty: -2px; --rot: -10deg; animation-delay: 0ms; }
.pig-trinket.trinket-1 { --tx: 20px; --ty: -5px; --rot: 8deg; animation-delay: 120ms; }
.pig-trinket.trinket-2 { --tx: -22px; --ty: -22px; --rot: 12deg; animation-delay: 240ms; }
.pig-trinket.trinket-3 { --tx: 8px; --ty: -25px; --rot: -8deg; animation-delay: 360ms; }
.pig-trinket.trinket-4 { --tx: -42px; --ty: 10px; --rot: 6deg; animation-delay: 480ms; }
.pig-trinket.trinket-5 { --tx: 30px; --ty: 8px; --rot: -6deg; animation-delay: 600ms; }
.pig-trinket.trinket-6 { --tx: -8px; --ty: -34px; --rot: 4deg; animation-delay: 720ms; }
.pig-trinket.trinket-7 { --tx: 40px; --ty: -16px; --rot: -12deg; animation-delay: 840ms; }

.pig-trinket.quality-3 {
  filter:
    drop-shadow(0 1px 2px rgba(30, 18, 12, 0.32))
    drop-shadow(0 0 10px rgba(184, 130, 255, 0.52));
}

.pig-trinket.quality-4 {
  font-size: 16px;
  filter:
    drop-shadow(0 1px 2px rgba(30, 18, 12, 0.32))
    drop-shadow(0 0 14px rgba(255, 98, 70, 0.68))
    drop-shadow(0 0 24px rgba(255, 190, 112, 0.2));
  animation: pig-trinket-legendary 1.9s ease-in-out infinite;
}

.pig-trinket.tone-devil {
  text-shadow: 0 0 6px rgba(180, 28, 42, 0.5);
}

.pig-mood {
  position: absolute;
  left: 50%;
  bottom: 30px;
  font-size: 16px;
  line-height: 1;
  transform: translateX(-50%);
  filter: drop-shadow(0 1px 3px rgba(30, 18, 12, 0.28));
  animation: pig-mood-bob 1.8s ease-in-out infinite;
}

.pig-anchor.is-walking .pig-glyph {
  animation: pig-walk 720ms ease-in-out infinite;
}

.pig-anchor.is-idle .pig-glyph,
.pig-anchor.is-paused .pig-glyph {
  animation: pig-idle 2.4s ease-in-out infinite;
}

.pig-anchor.is-sniffing .pig-glyph,
.pig-anchor.is-inspected .pig-glyph {
  animation: pig-sniff 1.2s ease-in-out infinite;
}

.pig-anchor.frozen .pig-glyph {
  animation-play-state: paused;
}

@keyframes pig-walk {
  0%,
  100% {
    transform: translateX(-50%) translateY(0) scaleX(var(--pig-facing));
  }
  30% {
    transform: translateX(-50%) translateY(-3px) scaleX(var(--pig-facing));
  }
  70% {
    transform: translateX(-50%) translateY(-1px) scaleX(var(--pig-facing));
  }
}

@keyframes pig-idle {
  0%,
  100% {
    transform: translateX(-50%) translateY(0) scaleX(var(--pig-facing));
  }
  50% {
    transform: translateX(-50%) translateY(-1px) scaleX(var(--pig-facing));
  }
}

@keyframes pig-sniff {
  0%,
  100% {
    transform: translateX(-50%) translateY(0) scaleX(var(--pig-facing));
  }
  25% {
    transform: translateX(-50%) translateY(1px) scaleX(var(--pig-facing));
  }
  60% {
    transform: translateX(-50%) translateY(-2px) scaleX(var(--pig-facing));
  }
}

@keyframes pig-trinket-bob {
  0%,
  100% {
    transform: translate(var(--tx), var(--ty)) rotate(var(--rot));
  }
  50% {
    transform: translate(var(--tx), calc(var(--ty) - 2px)) rotate(var(--rot));
  }
}

@keyframes pig-trinket-legendary {
  0%, 100% {
    transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(1);
  }
  50% {
    transform: translate(var(--tx), calc(var(--ty) - 3px)) rotate(var(--rot)) scale(1.1);
  }
}

@keyframes pig-mood-bob {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-2px);
  }
}
</style>
