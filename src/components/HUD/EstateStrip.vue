<template>
  <section class="estate-strip glass grain" :class="{ locked: !interactive }">
    <header class="strip-head">
      <div class="title-group">
        <p class="eyebrow">
          白鸦葡萄园场景 {{ displayStage }}/{{ stages.length }}
        </p>
        <p class="caption">{{ displayCaption }}</p>
      </div>

      <div class="head-tags">
        <p class="phase-pill">{{ timeLabel }}</p>
        <transition name="reveal-tag">
          <p v-if="revealLabel" class="reveal-tag">{{ revealLabel }}</p>
        </transition>
      </div>
    </header>

    <div
      class="strip-scene"
      :class="[
        timeClass,
        { repairing, 'full-bloom': displayStage >= stages.length }
      ]"
      :style="sceneVars"
    >
      <div
        class="scene-filter"
        :class="{ lilac: displayStage >= stages.length }"
      />

      <div class="scene-sky">
        <span class="sun-orb" />
        <span class="cloud cloud-a" />
        <span class="cloud cloud-b" />
      </div>

      <div class="far-hills" />
      <div class="vine-rows" />

      <div class="manor-silhouette">
        <span class="manor-body main-house" />
        <span class="manor-body west-wing" />
        <span class="manor-roof roof-main" />
        <span class="manor-roof roof-west" />
        <span
          class="manor-window kitchen-lite"
          :class="{ lit: displayStage >= 8 }"
        />
        <span
          class="manor-window suite-lite"
          :class="{ lit: displayStage >= 9 }"
        />
      </div>

      <div v-if="showFog" class="fog-layer">
        <span
          v-for="n in 4"
          :key="`fog-${n}`"
          class="fog"
          :style="fogStyle(n)"
        />
      </div>

      <div v-if="showGoldenMotes" class="mote-layer">
        <span
          v-for="n in 12"
          :key="`mote-${n}`"
          class="mote"
          :style="moteStyle(n)"
        />
      </div>

      <div v-if="showFireflies" class="firefly-layer">
        <span
          v-for="n in 4"
          :key="`firefly-${n}`"
          class="firefly"
          :style="fireflyStyle(n)"
        />
      </div>

      <div v-if="showPetalDrift" class="petal-layer">
        <span
          v-for="n in 6"
          :key="`ambient-petal-${n}`"
          class="ambient-petal"
          :style="ambientPetalStyle(n)"
        >
          {{ ambientPetalGlyph(n) }}
        </span>
      </div>

      <div v-if="showSmoke" class="smoke-layer">
        <span
          v-for="n in 3"
          :key="`smoke-${n}`"
          class="smoke"
          :style="smokeStyle(n)"
        />
      </div>

      <div v-if="showBees" class="bee-layer">
        <span v-for="n in 3" :key="`bee-${n}`" class="bee" :style="beeStyle(n)">
          🐝
        </span>
      </div>

      <div class="segment-grid">
        <article
          v-for="segment in segments"
          :key="segment.id"
          class="segment"
          :class="[segment.id, slotClass(segment)]"
        >
          <div
            class="segment-glow"
            :class="{
              active: pendingRevealId === segment.buildingId && revealActive
            }"
          />

          <div class="ground">
            <span class="path" />
            <span class="grass grass-a" />
            <span class="grass grass-b" />
            <span class="growth-wash" />
          </div>

          <template v-if="segment.id === 'courtyard'">
            <span class="gate-post gate-left" />
            <span class="gate-post gate-right" />
            <span class="gate-beam" />
            <span class="fountain" />
            <button
              v-if="showGateRaven"
              class="hotspot raven gate-raven"
              :class="hotspotClasses('white-raven')"
              :disabled="!interactive"
              @mouseenter="onHotspot('white-raven')"
              @click="onHotspot('white-raven')"
            >
              <span class="actor">🕊</span>
            </button>
          </template>

          <template v-else-if="segment.id === 'vineyard'">
            <span class="vine-post post-left" />
            <span class="vine-post post-right" />
            <span class="vine-line" />
            <span class="vine-buds" />
            <span class="vine-leaf vine-leaf-a" />
            <span class="vine-leaf vine-leaf-b" />
            <span class="vine-leaf vine-leaf-c" />
            <span class="vine-grape grape-a">🍃</span>
            <span class="vine-grape grape-b">🍇</span>
            <button
              v-if="displayStage >= 2"
              class="hotspot vine vine-hotspot"
              :class="hotspotClasses('vine-cluster')"
              :disabled="!interactive"
              @mouseenter="onHotspot('vine-cluster')"
              @click="onHotspot('vine-cluster')"
            >
              <span class="actor">🍇</span>
            </button>
          </template>

          <template v-else-if="segment.id === 'cellar'">
            <span class="cellar-door" />
            <span class="barrel barrel-left" />
            <span class="barrel barrel-right" />
            <span class="cellar-bottle" />
            <button
              v-if="displayStage >= 3"
              class="hotspot cellar cellar-hotspot"
              :class="hotspotClasses('cellar-bottle')"
              :disabled="!interactive"
              @mouseenter="onHotspot('cellar-bottle')"
              @click="onHotspot('cellar-bottle')"
            >
              <span class="actor">🍾</span>
            </button>
          </template>

          <template v-else-if="segment.id === 'stables'">
            <span class="stable-frame" />
            <span class="stable-roof" />
            <span class="hay hay-a" />
            <span class="hay hay-b" />
            <span class="water-trough" />
            <button
              v-if="displayStage >= 4"
              class="hotspot roach roach-hotspot"
              :class="hotspotClasses('roach', { tucked: roachTucked })"
              :disabled="!interactive"
              @mouseenter="onHotspot('roach')"
              @click="onHotspot('roach')"
            >
              <span class="actor">{{ roachGlyph }}</span>
            </button>
          </template>

          <template v-else-if="segment.id === 'garden'">
            <span class="flower-bed" />
            <span class="flower flower-a">🪻</span>
            <span class="flower flower-b">🌿</span>
            <button
              v-if="showButterfly"
              class="hotspot garden butterfly-hotspot"
              :class="
                hotspotClasses('butterfly', { orbiting: butterflyOrbiting })
              "
              :disabled="!interactive"
              @mouseenter="onHotspot('butterfly')"
              @click="onHotspot('butterfly')"
            >
              <span class="actor">🦋</span>
            </button>
          </template>

          <template v-else-if="segment.id === 'greenhouse'">
            <span class="greenhouse-body" />
            <span class="greenhouse-pane pane-a" />
            <span class="greenhouse-pane pane-b" />
            <span class="sprout">🌱</span>
            <span
              class="greenhouse-lamp"
              :class="{ warning: greenhouseWarning }"
            />
            <button
              v-if="displayStage >= 6"
              class="hotspot glass greenhouse-hotspot"
              :class="
                hotspotClasses('greenhouse-door', {
                  warning: greenhouseWarning
                })
              "
              :disabled="!interactive"
              @mouseenter="onHotspot('greenhouse-door')"
              @click="onHotspot('greenhouse-door')"
            >
              <span class="actor">💡</span>
            </button>
          </template>

          <template v-else-if="segment.id === 'gazebo'">
            <span class="gazebo-roof" />
            <span class="gazebo-rail" />
            <span v-if="terraceChairCount >= 1" class="gazebo-seat seat-left" />
            <span
              v-if="terraceChairCount >= 2"
              class="gazebo-seat seat-right"
            />
            <button
              v-if="displayStage >= 7"
              class="hotspot gazebo terrace-hotspot"
              :class="hotspotClasses('terrace-chair')"
              :disabled="!interactive"
              @mouseenter="onHotspot('terrace-chair')"
              @click="onHotspot('terrace-chair')"
            >
              <span class="actor">
                {{ terraceChairCount >= 2 ? '🪑🪑' : '🪑' }}
              </span>
            </button>
          </template>

          <template v-else-if="segment.id === 'kitchen'">
            <span class="kitchen-body" />
            <span class="kitchen-window" />
            <span class="chimney" />
            <span class="hive">🪵</span>
            <span class="geralt-shadow" :class="{ stirring: kitchenStirring }">
              🧍
            </span>
            <button
              v-if="displayStage >= 8"
              class="hotspot kitchen kitchen-hotspot"
              :class="
                hotspotClasses('kitchen-window', { stirring: kitchenStirring })
              "
              :disabled="!interactive"
              @mouseenter="onHotspot('kitchen-window')"
              @click="onHotspot('kitchen-window')"
            >
              <span class="actor">🍲</span>
            </button>
          </template>

          <template v-else-if="segment.id === 'lilacSuite'">
            <span class="suite-body" />
            <span class="suite-window" />
            <span
              class="curtain"
              :class="{
                flutter: curtainFlutter || activeHotspotId === 'suite-lilac'
              }"
            />
            <span class="vase">🪻</span>
            <button
              v-if="displayStage >= 9"
              class="hotspot suite suite-hotspot"
              :class="
                hotspotClasses('suite-lilac', { flutter: curtainFlutter })
              "
              :disabled="!interactive"
              @mouseenter="onHotspot('suite-lilac')"
              @click="onHotspot('suite-lilac')"
            >
              <span class="actor">🪻</span>
            </button>
          </template>
        </article>
      </div>

      <EstatePetPig
        :display-stage="displayStage"
        :interactive="interactive"
        :repairing="repairing"
        :active="activeHotspotId === 'pet-pig'"
        :mood="pigMoodGlyph"
        :trinkets="game.ownedItems"
        @inspect="onPigInspect"
        @inspect-trinket="onPigTrinketInspect"
      />

      <div class="scene-burst-layer">
        <span
          v-for="burst in bursts"
          :key="burst.id"
          class="burst"
          :style="burstStyle(burst)"
        >
          {{ burst.glyph }}
        </span>
      </div>

      <div v-if="repairing" class="scene-wind" />
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EventBus from '@/core/eventBus'
import EstatePetPig from './EstatePetPig.vue'
import { ESTATE_PIG_LINES, ESTATE_STRIP_STAGES } from '@/data/content'
import { useGameStore } from '@/stores/gameStore'
import { TIMING } from '@/utils/timing'

const game = useGameStore()
const stages = ESTATE_STRIP_STAGES
const segments = stages.map(stage => ({
  id: stage.segmentId,
  buildingId: stage.buildingId,
  unlockCount: stage.unlockCount
}))

const completedCount = computed(() => game.completedBuildingsCount)
const pendingRevealId = computed(() => game.pendingEstateRevealId)
const displayStage = computed(() =>
  Math.min(stages.length, Math.max(0, completedCount.value))
)
const interactive = computed(
  () => !['targeting', 'repairing', 'rewardChoice'].includes(game.phase)
)
const repairing = computed(() => game.phase === 'repairing')

const timeClass = computed(() => {
  if (displayStage.value <= 2) return 'time-morning'
  if (displayStage.value <= 6) return 'time-day'
  return 'time-dusk'
})

const timeLabel = computed(() => {
  if (repairing.value) return '修复演出中'
  if (displayStage.value <= 2) return '晨光'
  if (displayStage.value <= 6) return '白昼'
  if (game.stepsLeft <= 5) return '将近黄昏'
  return '傍晚'
})

const showFog = computed(
  () => displayStage.value >= 1 && displayStage.value <= 2
)
const showGoldenMotes = computed(() => displayStage.value >= 2)
const showFireflies = computed(
  () => displayStage.value >= 3 && game.stepsLeft <= 10
)
const showPetalDrift = computed(() => displayStage.value >= 5)
const showSmoke = computed(() => displayStage.value >= 8)
const showBees = computed(() => displayStage.value >= 8)
const showGateRaven = computed(() => displayStage.value >= 1)
const showButterfly = computed(() => displayStage.value >= 5)
const greenhouseWarning = computed(
  () => displayStage.value >= 6 && game.stepsLeft <= 5
)
const terraceChairCount = computed(() => {
  if (displayStage.value >= 9) return 2
  if (displayStage.value >= 7) return 1
  return 0
})
const repairProgress = computed(() =>
  Math.max(0, Math.min(1, game.repairProgressPct || 0))
)
const activeSegmentId = computed(
  () => stages[displayStage.value]?.segmentId || null
)
const growthIntensity = computed(() => {
  if (repairing.value && game.today?.building?.id === 'vineyard') return 1
  if (activeSegmentId.value !== 'vineyard') return 0
  return repairProgress.value
})
const sceneVars = computed(() => ({
  '--repair-progress': repairProgress.value.toFixed(3),
  '--growth-intensity': growthIntensity.value.toFixed(3)
}))

const displayCaption = ref('')
const activeHotspotId = ref(null)
const revealActive = ref(false)
const revealLabel = ref('')
const butterflyOrbiting = ref(false)
const kitchenStirring = ref(false)
const curtainFlutter = ref(false)
const roachTucked = ref(false)
const bursts = ref([])
const pigMoodGlyph = ref('')

let captionTimer = null
let revealTimer = null
let revealClearTimer = null
let fxTimers = []
let burstId = 0
const lineCursor = {}

const roachGlyph = computed(() => {
  if (roachTucked.value) return '🐴'
  if (activeHotspotId.value === 'roach') return '💨🐎'
  return '🐎'
})

function scheduleFx(fn, ms) {
  const timer = setTimeout(fn, ms)
  fxTimers.push(timer)
  return timer
}

function clearFxTimers() {
  for (const timer of fxTimers) clearTimeout(timer)
  fxTimers = []
}

function clearCaptionTimer() {
  if (captionTimer) clearTimeout(captionTimer)
  captionTimer = null
}

function clearRevealTimers() {
  if (revealTimer) clearTimeout(revealTimer)
  if (revealClearTimer) clearTimeout(revealClearTimer)
  revealTimer = null
  revealClearTimer = null
}

function baseCaption() {
  if (displayStage.value === 0) return '从庭院开始。先把门、路和喷泉修出来。'
  return game.defaultEstateCaption
}

function restoreDefaultCaption() {
  activeHotspotId.value = null
  pigMoodGlyph.value = ''
  displayCaption.value = baseCaption()
}

function slotClass(segment) {
  return {
    restored: displayStage.value >= segment.unlockCount
  }
}

function hotspotClasses(id, extra = {}) {
  return {
    active: activeHotspotId.value === id,
    ...extra
  }
}

function nextLine(key, lines) {
  if (!lines?.length) return ''
  const idx = lineCursor[key] ?? 0
  lineCursor[key] = (idx + 1) % lines.length
  return lines[idx]
}

function stageHotspotLines(buildingId) {
  return (
    stages.find(stage => stage.buildingId === buildingId)?.hotspots?.[0]
      ?.lines ?? []
  )
}

function roachLine() {
  if (displayStage.value >= 9) return '它今天特别安静。'
  if (displayStage.value >= 8) return '萝卜在看厨房。它知道汤快好了。'
  const lines = [
    '它在检查工程。',
    '萝卜觉得还行。只是还行。',
    '别看了。它不会夸人的。'
  ]
  return lines[(lineCursor.roach ?? 0) % lines.length]
}

function pigLines() {
  if (displayStage.value >= 7) return ESTATE_PIG_LINES.late
  if (displayStage.value >= 4) return ESTATE_PIG_LINES.mid
  return ESTATE_PIG_LINES.early
}

function captionForHotspot(id) {
  switch (id) {
    case 'white-raven':
      if (displayStage.value >= 9)
        return '白鸦落在紫丁香客房的窗台边，没有再飞走。'
      if (displayStage.value >= 7)
        return '它落在栏杆上，看了一眼那把椅子，又像是看见了别的什么。'
      return '白鸦在门柱上歪头看了一会儿，像在默认这里终于能住人了。'
    case 'vine-cluster':
      return nextLine('vine-cluster', stageHotspotLines('vineyard'))
    case 'cellar-bottle':
      return '“还行。留一瓶。”'
    case 'roach': {
      const line = roachLine()
      lineCursor.roach = (lineCursor.roach ?? 0) + 1
      return line
    }
    case 'pet-pig':
      return nextLine('pet-pig', pigLines())
    case 'butterfly':
      return '蝴蝶飞起盘旋一圈，又轻轻落回花苞旁。'
    case 'greenhouse-door':
      return greenhouseWarning.value
        ? '灯开始轻轻闪，像在提醒今天快到尽头了。'
        : '门关好。灯点上。剩下的它们自己会处理。'
    case 'terrace-chair':
      return terraceChairCount.value >= 2
        ? '两把椅子并排摆着，不需要再解释什么。'
        : '先放一把。两把的话……太像在等了。'
    case 'kitchen-window':
      return '窗里的人影停了一下，又轻轻搅了搅锅。'
    case 'suite-lilac':
      return '花瓶里的紫丁香轻轻一颤，窗帘顺着晚风摆开。'
    default:
      return baseCaption()
  }
}

function spawnBurst(kind = 'mixed', count = 8) {
  const fresh = []
  for (let i = 0; i < count; i++) {
    const baseLeft = 8 + ((i * 11) % 84)
    const jitter = (i % 3) * 1.8
    fresh.push({
      id: ++burstId,
      glyph: burstGlyph(kind, i),
      left: baseLeft + jitter,
      top: 72 - (i % 4) * 6,
      dx: ((i % 5) - 2) * 18,
      dy: 24 + (i % 4) * 8,
      dur: 1.7 + (i % 3) * 0.2,
      rot: -16 + i * 7
    })
  }

  bursts.value = [...bursts.value, ...fresh]
  scheduleFx(() => {
    const ids = new Set(fresh.map(item => item.id))
    bursts.value = bursts.value.filter(item => !ids.has(item.id))
  }, 2100)
}

function burstGlyph(kind, index) {
  if (kind === 'feather') return ['🪶', '🕊', '✨'][index % 3]
  if (kind === 'petal') return ['🪻', '🌸', '🌿'][index % 3]
  if (kind === 'gold') return ['✨', '💫', '⭐'][index % 3]
  return displayStage.value >= 5
    ? ['🪻', '🌸', '🪶', '✨'][index % 4]
    : ['🪶', '✨', '💫'][index % 3]
}

function onSceneBurst(payload = {}) {
  const kind = payload.kind ?? (displayStage.value >= 5 ? 'petal' : 'feather')
  const count = payload.count ?? 10
  spawnBurst(kind, count)
}

function onHotspot(id) {
  if (!interactive.value) return

  activeHotspotId.value = id
  displayCaption.value = captionForHotspot(id)
  clearCaptionTimer()
  captionTimer = setTimeout(() => {
    restoreDefaultCaption()
  }, 2500)

  switch (id) {
    case 'white-raven':
      spawnBurst('feather', 7)
      break
    case 'roach':
      roachTucked.value = true
      scheduleFx(() => {
        roachTucked.value = false
      }, 1400)
      spawnBurst('gold', 4)
      break
    case 'butterfly':
      butterflyOrbiting.value = true
      spawnBurst('petal', 6)
      scheduleFx(() => {
        butterflyOrbiting.value = false
      }, 1200)
      break
    case 'kitchen-window':
      kitchenStirring.value = true
      scheduleFx(() => {
        kitchenStirring.value = false
      }, 1400)
      break
    case 'suite-lilac':
      curtainFlutter.value = true
      spawnBurst('petal', 8)
      scheduleFx(() => {
        curtainFlutter.value = false
      }, 1400)
      break
    case 'greenhouse-door':
      spawnBurst('gold', 6)
      break
    case 'terrace-chair':
      spawnBurst('gold', 5)
      break
    default:
      break
  }
}

function onPigInspect() {
  const reaction = game.inspectPig?.()
  if (!reaction) return

  activeHotspotId.value = 'pet-pig'
  pigMoodGlyph.value = reaction.emoji || ''
  displayCaption.value = reaction.caption || captionForHotspot('pet-pig')
  clearCaptionTimer()
  captionTimer = setTimeout(() => {
    restoreDefaultCaption()
  }, 2500)
  spawnBurst(reaction.angry ? 'gold' : 'petal', reaction.angry ? 4 : 3)
}

function onPigTrinketInspect(itemId) {
  const inspected = game.inspectOwnedItem?.(itemId)
  if (!inspected) return

  activeHotspotId.value = 'pet-pig'
  pigMoodGlyph.value = ''
  displayCaption.value = '小猪晃了晃身上的挂件，像是在提醒你它们都还在生效。'
  clearCaptionTimer()
  captionTimer = setTimeout(() => {
    restoreDefaultCaption()
  }, 2200)
  spawnBurst('gold', 3)
}

function fogStyle(index) {
  return {
    left: `${6 + index * 20}%`,
    bottom: `${60 + (index % 2) * 8}px`,
    width: `${84 + index * 12}px`,
    animationDelay: `${index * 0.7}s`,
    animationDuration: `${5.6 + index * 0.6}s`
  }
}

function moteStyle(index) {
  return {
    left: `${8 + index * 7}%`,
    top: `${18 + (index % 4) * 10}%`,
    animationDelay: `${(index % 5) * 0.35}s`,
    animationDuration: `${3.6 + (index % 4) * 0.45}s`
  }
}

function fireflyStyle(index) {
  return {
    left: `${46 + index * 10}%`,
    bottom: `${34 + (index % 2) * 12}px`,
    animationDelay: `${index * 0.5}s`,
    animationDuration: `${2.8 + index * 0.3}s`
  }
}

function ambientPetalGlyph(index) {
  return ['🪻', '🌸', '🌿'][index % 3]
}

function ambientPetalStyle(index) {
  return {
    left: `${24 + index * 11}%`,
    top: `${12 + (index % 2) * 8}%`,
    animationDelay: `${index * 0.6}s`,
    animationDuration: `${5 + (index % 3) * 0.8}s`
  }
}

function smokeStyle(index) {
  return {
    right: `${18 + index * 8}%`,
    bottom: `${66 + index * 8}px`,
    animationDelay: `${index * 0.8}s`,
    animationDuration: `${4.2 + index * 0.5}s`
  }
}

function beeStyle(index) {
  return {
    right: `${8 + index * 2}%`,
    bottom: `${52 + (index % 2) * 10}px`,
    animationDelay: `${index * 0.45}s`,
    animationDuration: `${2.4 + index * 0.3}s`
  }
}

function burstStyle(burst) {
  return {
    left: `${burst.left}%`,
    top: `${burst.top}%`,
    animationDuration: `${burst.dur}s`,
    '--dx': `${burst.dx}px`,
    '--dy': `${burst.dy}px`,
    '--rot': `${burst.rot}deg`
  }
}

watch(
  () => game.defaultEstateCaption,
  () => {
    if (!activeHotspotId.value && !revealLabel.value)
      displayCaption.value = baseCaption()
  },
  { immediate: true }
)

watch(
  () => game.pendingEstateRevealId,
  buildingId => {
    clearRevealTimers()
    revealActive.value = false
    revealLabel.value = ''
    if (!buildingId) return

    const stage = stages.find(item => item.buildingId === buildingId)
    if (!stage) return

    revealActive.value = true
    revealLabel.value = stage.revealLabel
    displayCaption.value = nextLine(
      `reveal-${buildingId}`,
      stage.hotspots?.[0]?.lines ?? [game.defaultEstateCaption]
    )
    activeHotspotId.value = null
    spawnBurst(displayStage.value >= 5 ? 'petal' : 'gold', 10)

    revealTimer = setTimeout(() => {
      revealActive.value = false
    }, 1800)

    revealClearTimer = setTimeout(() => {
      revealLabel.value = ''
      restoreDefaultCaption()
      game.markEstateRevealSeen(buildingId)
    }, TIMING.DAY_NOTIFIER_HOLD_MS)
  },
  { immediate: true }
)

watch(
  () => game.phase,
  phase => {
    if (phase === 'repairing') {
      clearCaptionTimer()
      activeHotspotId.value = null
    }
    if (phase !== 'repairing' && !revealLabel.value) {
      displayCaption.value = baseCaption()
    }
  }
)

onMounted(() => {
  pigMoodGlyph.value = ''
  EventBus.bind('sceneBurst', onSceneBurst)
})

onBeforeUnmount(() => {
  clearCaptionTimer()
  clearRevealTimers()
  clearFxTimers()
  EventBus.unbind('sceneBurst', onSceneBurst)
})
</script>

<style scoped>
.estate-strip {
  position: relative;
  width: 680px;
  max-width: 92vw;
  min-height: 242px;
  padding: 16px 18px 16px;
  overflow: hidden;
  box-shadow: var(--surface-shadow);
}

.estate-strip.locked {
  opacity: 0.92;
}

.strip-head {
  position: relative;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--ink-soft);
  text-transform: uppercase;
}

.caption {
  margin: 0;
  min-height: 20px;
  font-size: 13px;
  color: var(--ink);
  line-height: 1.5;
}

.head-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.phase-pill,
.reveal-tag {
  margin: 0;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.phase-pill {
  background: rgba(255, 248, 233, 0.78);
  color: var(--ink-soft);
  border: 1px solid rgba(122, 90, 52, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.reveal-tag {
  background: linear-gradient(
    135deg,
    rgba(212, 168, 87, 0.96),
    rgba(176, 148, 201, 0.9)
  );
  color: #fff8ee;
  box-shadow:
    0 8px 18px rgba(58, 42, 31, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.reveal-tag-enter-active,
.reveal-tag-leave-active {
  transition:
    opacity 280ms var(--ease-out-expo),
    transform 280ms var(--ease-out-expo);
}

.reveal-tag-enter-from,
.reveal-tag-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.strip-scene {
  position: relative;
  height: 192px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid rgba(122, 90, 52, 0.26);
  background: linear-gradient(
    180deg,
    rgba(227, 212, 188, 0.98) 0%,
    rgba(189, 145, 109, 0.96) 40%,
    rgba(94, 83, 99, 0.96) 100%
  );
  transition:
    background 500ms var(--ease-out-expo),
    filter 360ms var(--ease-out-expo);
  box-shadow:
    inset 0 1px 0 rgba(255, 248, 230, 0.12),
    inset 0 -8px 16px rgba(0, 0, 0, 0.12);
}

.strip-scene.time-morning {
  background: linear-gradient(
    180deg,
    rgba(222, 214, 198, 0.98) 0%,
    rgba(188, 174, 150, 0.96) 56%,
    rgba(136, 116, 86, 0.96) 100%
  );
}

.strip-scene.time-day {
  background: linear-gradient(
    180deg,
    rgba(228, 221, 193, 0.98) 0%,
    rgba(194, 187, 146, 0.98) 56%,
    rgba(104, 112, 71, 0.98) 100%
  );
}

.strip-scene.time-dusk {
  background: linear-gradient(
    180deg,
    rgba(236, 186, 126, 0.98) 0%,
    rgba(178, 116, 83, 0.96) 42%,
    rgba(92, 80, 101, 0.96) 100%
  );
}

.strip-scene.repairing {
  filter: saturate(1.06) brightness(1.03);
}

.strip-scene.full-bloom {
  box-shadow: inset 0 0 24px rgba(193, 149, 215, 0.16);
}

.scene-filter {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 50% 18%,
      rgba(255, 224, 156, 0.22),
      transparent 34%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(42, 25, 14, 0.08));
}

.scene-filter.lilac {
  background:
    radial-gradient(
      circle at 50% 18%,
      rgba(255, 224, 156, 0.22),
      transparent 34%
    ),
    radial-gradient(
      circle at 82% 24%,
      rgba(198, 160, 230, 0.2),
      transparent 34%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(42, 25, 14, 0.08));
}

.scene-sky,
.fog-layer,
.mote-layer,
.firefly-layer,
.petal-layer,
.smoke-layer,
.bee-layer,
.scene-burst-layer,
.scene-wind {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.scene-sky {
  height: 62%;
}

.sun-orb {
  position: absolute;
  right: 34px;
  top: 14px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 234, 170, 0.96) 0%,
    rgba(241, 182, 92, 0.88) 68%,
    transparent 100%
  );
  box-shadow: 0 0 24px rgba(241, 182, 92, 0.48);
}

.cloud {
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 247, 230, 0.24);
  filter: blur(1px);
}

.cloud-a {
  left: 11%;
  top: 22px;
  width: 112px;
  height: 24px;
}

.cloud-b {
  left: 38%;
  top: 12px;
  width: 78px;
  height: 16px;
}

.far-hills {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 66px;
  height: 52px;
  background: linear-gradient(
    180deg,
    rgba(110, 96, 108, 0.2),
    rgba(70, 60, 80, 0.5)
  );
  clip-path: polygon(
    0 72%,
    10% 46%,
    22% 64%,
    34% 38%,
    46% 58%,
    60% 34%,
    73% 66%,
    86% 42%,
    100% 70%,
    100% 100%,
    0 100%
  );
}

.vine-rows {
  position: absolute;
  left: 24%;
  right: 9%;
  bottom: 44px;
  height: 42px;
  background: linear-gradient(
      160deg,
      transparent 0%,
      transparent 44%,
      rgba(91, 104, 57, 0.28) 44%,
      rgba(91, 104, 57, 0.28) 46%,
      transparent 46%
    )
    0 0 / 22px 18px repeat-x;
  opacity: 0.72;
}

.manor-silhouette {
  position: absolute;
  left: 22%;
  right: 10%;
  bottom: 50px;
  height: 74px;
  pointer-events: none;
}

.manor-body,
.manor-roof,
.manor-window {
  position: absolute;
}

.main-house {
  left: 24%;
  right: 12%;
  bottom: 0;
  height: 44px;
  border-radius: 10px 10px 3px 3px;
  background: rgba(88, 69, 65, 0.52);
}

.west-wing {
  left: 0;
  width: 28%;
  bottom: 0;
  height: 34px;
  border-radius: 8px 8px 2px 2px;
  background: rgba(98, 83, 69, 0.42);
}

.roof-main {
  left: 22%;
  right: 10%;
  bottom: 40px;
  height: 18px;
  clip-path: polygon(2% 100%, 50% 0, 98% 100%);
  background: rgba(77, 55, 48, 0.56);
}

.roof-west {
  left: 0;
  width: 30%;
  bottom: 30px;
  height: 14px;
  clip-path: polygon(6% 100%, 50% 0, 94% 100%);
  background: rgba(84, 61, 54, 0.46);
}

.manor-window {
  bottom: 14px;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: rgba(45, 39, 43, 0.48);
  transition:
    background 300ms ease,
    box-shadow 300ms ease;
}

.kitchen-lite {
  left: 62%;
}

.suite-lite {
  left: 79%;
}

.manor-window.lit {
  background: radial-gradient(
    circle,
    rgba(255, 203, 110, 0.96),
    rgba(195, 112, 48, 0.82)
  );
  box-shadow: 0 0 8px rgba(255, 198, 126, 0.34);
}

.fog {
  position: absolute;
  height: 26px;
  border-radius: 999px;
  background: rgba(244, 244, 236, 0.2);
  filter: blur(4px);
  animation: fog-drift linear infinite alternate;
}

@keyframes fog-drift {
  from {
    transform: translateX(-4px);
    opacity: 0.22;
  }
  to {
    transform: translateX(10px);
    opacity: 0.42;
  }
}

.mote {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 235, 176, 0.82);
  box-shadow: 0 0 10px rgba(255, 226, 155, 0.58);
  animation: mote-float ease-in-out infinite;
}

@keyframes mote-float {
  0%,
  100% {
    transform: translateY(0) scale(0.92);
    opacity: 0.26;
  }
  50% {
    transform: translateY(-8px) scale(1.08);
    opacity: 1;
  }
}

.firefly {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(250, 235, 153, 0.94);
  box-shadow: 0 0 10px rgba(255, 240, 170, 0.66);
  animation: firefly-wave ease-in-out infinite;
}

@keyframes firefly-wave {
  0%,
  100% {
    transform: translateY(0) translateX(0);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-9px) translateX(4px);
    opacity: 1;
  }
}

.ambient-petal {
  position: absolute;
  font-size: 14px;
  opacity: 0.7;
  animation: ambient-petal-fall linear infinite;
}

@keyframes ambient-petal-fall {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0;
  }
  12% {
    opacity: 0.85;
  }
  100% {
    transform: translate(18px, 34px) rotate(28deg);
    opacity: 0;
  }
}

.smoke {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(238, 236, 232, 0.52),
    rgba(238, 236, 232, 0.08) 72%,
    transparent 100%
  );
  animation: smoke-rise ease-out infinite;
}

@keyframes smoke-rise {
  0% {
    transform: translateY(0) scale(0.72);
    opacity: 0;
  }
  18% {
    opacity: 0.64;
  }
  100% {
    transform: translateY(-34px) scale(1.2);
    opacity: 0;
  }
}

.bee {
  position: absolute;
  font-size: 12px;
  animation: bee-bob ease-in-out infinite;
}

@keyframes bee-bob {
  0%,
  100% {
    transform: translateY(0) translateX(0);
  }
  50% {
    transform: translateY(-6px) translateX(8px);
  }
}

.segment-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(9, 1fr);
}

.segment {
  position: relative;
  filter: saturate(0.24) brightness(0.8);
  transition:
    filter 420ms ease,
    transform 420ms ease;
}

.segment::after {
  content: '';
  position: absolute;
  right: -1px;
  top: 14px;
  bottom: 14px;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(58, 42, 31, 0.14),
    transparent
  );
}

.segment:last-child::after {
  display: none;
}

.segment.restored {
  filter: saturate(1) brightness(1);
}

.segment-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: radial-gradient(
    circle at 50% 44%,
    rgba(255, 234, 170, 0.76),
    transparent 66%
  );
}

.segment-glow.active {
  animation: restore-shine 1.7s ease;
}

@keyframes restore-shine {
  0% {
    opacity: 0;
    transform: scale(0.84);
  }
  35% {
    opacity: 0.96;
  }
  100% {
    opacity: 0;
    transform: scale(1.12);
  }
}

.ground {
  position: absolute;
  inset: auto 0 0;
  height: 70px;
}

.ground::before {
  content: '';
  position: absolute;
  inset: 18px 0 0;
  background: linear-gradient(
    180deg,
    rgba(96, 95, 60, 0.18),
    rgba(64, 76, 37, 0.74)
  );
}

.growth-wash {
  position: absolute;
  inset: 18px 0 0;
  opacity: 0;
  background:
    radial-gradient(
      circle at 50% 18%,
      rgba(164, 214, 132, 0.34),
      transparent 46%
    ),
    linear-gradient(180deg, rgba(108, 160, 82, 0.08), rgba(68, 126, 54, 0.3));
  transition: opacity 480ms ease;
}

.segment.vineyard:not(.restored) .growth-wash {
  opacity: calc(var(--growth-intensity) * 0.95);
}

.path {
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(227, 214, 185, 0.15);
}

.segment.restored .path {
  background: rgba(232, 220, 188, 0.58);
}

.grass,
.grass::before,
.grass::after {
  position: absolute;
  content: '';
  width: 16px;
  height: 24px;
  border-radius: 14px 14px 0 0;
  background: rgba(89, 111, 60, 0.34);
}

.segment.restored .grass,
.segment.restored .grass::before,
.segment.restored .grass::after {
  background: rgba(76, 131, 72, 0.76);
}

.segment.vineyard:not(.restored) .grass,
.segment.vineyard:not(.restored) .grass::before,
.segment.vineyard:not(.restored) .grass::after {
  opacity: calc(0.5 + var(--growth-intensity) * 0.5);
  filter: saturate(calc(0.72 + var(--growth-intensity) * 0.58))
    brightness(calc(0.88 + var(--growth-intensity) * 0.28));
}

.grass-a {
  left: 8px;
  bottom: 14px;
}

.grass-a::before {
  left: 10px;
  bottom: -1px;
}

.grass-a::after {
  left: 20px;
  bottom: 1px;
}

.grass-b {
  right: 18px;
  bottom: 13px;
}

.grass-b::before {
  left: -10px;
  bottom: -1px;
}

.grass-b::after {
  left: 8px;
  bottom: 2px;
}

.gate-post,
.gate-beam,
.fountain,
.vine-post,
.vine-line,
.vine-buds,
.cellar-door,
.barrel,
.cellar-bottle,
.stable-frame,
.stable-roof,
.hay,
.water-trough,
.flower-bed,
.flower,
.greenhouse-body,
.greenhouse-pane,
.greenhouse-lamp,
.sprout,
.gazebo-roof,
.gazebo-seat,
.gazebo-rail,
.kitchen-body,
.kitchen-window,
.chimney,
.hive,
.geralt-shadow,
.suite-body,
.suite-window,
.curtain,
.vase {
  position: absolute;
}

.gate-post {
  bottom: 54px;
  width: 18px;
  height: 58px;
  border-radius: 4px 4px 2px 2px;
  background: linear-gradient(
    180deg,
    rgba(132, 126, 118, 0.74),
    rgba(84, 78, 73, 0.82)
  );
}

.segment.restored .gate-post {
  background: linear-gradient(
    180deg,
    rgba(191, 185, 174, 0.92),
    rgba(120, 112, 102, 0.92)
  );
}

.gate-left {
  left: 12px;
}
.gate-right {
  right: 14px;
}

.gate-beam {
  left: 18px;
  right: 20px;
  bottom: 100px;
  height: 6px;
  border-radius: 4px;
  background: rgba(92, 80, 68, 0.4);
}

.segment.restored .gate-beam {
  background: rgba(148, 126, 92, 0.88);
}

.fountain {
  left: 50%;
  bottom: 38px;
  width: 24px;
  height: 24px;
  transform: translateX(-50%);
  border-radius: 50% 50% 38% 38%;
  background: rgba(104, 98, 87, 0.62);
}

.segment.restored .fountain {
  background: radial-gradient(
    circle,
    rgba(194, 226, 238, 0.92) 0%,
    rgba(118, 149, 168, 0.92) 48%,
    rgba(96, 90, 80, 0.9) 100%
  );
}

.vine-post {
  bottom: 50px;
  width: 6px;
  height: 54px;
  background: rgba(100, 82, 59, 0.75);
}

.post-left {
  left: 20px;
}
.post-right {
  right: 22px;
}

.vine-line {
  left: 20px;
  right: 22px;
  bottom: 82px;
  height: 10px;
  border-bottom: 2px solid rgba(93, 82, 49, 0.4);
}

.segment.restored .vine-line {
  border-color: rgba(83, 111, 53, 0.8);
}

.segment.restored.vineyard .vine-line {
  animation: vine-sway 4s ease-in-out infinite;
}

.vine-buds {
  left: 30px;
  right: 30px;
  bottom: 76px;
  height: 10px;
  opacity: 0;
  background:
    radial-gradient(
      circle at 12% 50%,
      rgba(112, 182, 90, 0.88),
      transparent 34%
    ),
    radial-gradient(
      circle at 48% 35%,
      rgba(112, 182, 90, 0.88),
      transparent 34%
    ),
    radial-gradient(
      circle at 78% 60%,
      rgba(122, 88, 168, 0.82),
      transparent 34%
    );
}

.segment.restored .vine-buds {
  opacity: 1;
}

.segment.vineyard:not(.restored) .vine-buds {
  opacity: calc(var(--growth-intensity) * 0.95);
  transform: scaleX(calc(0.62 + var(--growth-intensity) * 0.38));
  transform-origin: center;
}

.vine-leaf,
.vine-grape {
  position: absolute;
  opacity: 0;
  transform-origin: center bottom;
  transition:
    opacity 380ms ease,
    transform 520ms ease,
    filter 360ms ease;
}

.vine-leaf {
  font-size: 18px;
  filter: saturate(0.7);
}

.vine-leaf-a {
  left: 22px;
  bottom: 66px;
}
.vine-leaf-b {
  left: 50%;
  bottom: 88px;
  transform: translateX(-50%);
}
.vine-leaf-c {
  right: 18px;
  bottom: 64px;
}

.vine-leaf::before {
  content: '🌿';
}

.vine-grape {
  font-size: 17px;
}

.grape-a {
  left: 34px;
  bottom: 72px;
}
.grape-b {
  right: 26px;
  bottom: 74px;
}

.segment.vineyard:not(.restored) .vine-leaf-a {
  opacity: max(0, calc((var(--growth-intensity) - 0.14) * 1.4));
  transform: scale(calc(0.5 + var(--growth-intensity) * 0.65))
    rotate(calc(-10deg + var(--growth-intensity) * 8deg));
}

.segment.vineyard:not(.restored) .vine-leaf-b {
  opacity: max(0, calc((var(--growth-intensity) - 0.32) * 1.55));
  transform: translateX(-50%) scale(calc(0.48 + var(--growth-intensity) * 0.68))
    rotate(calc(-6deg + var(--growth-intensity) * 10deg));
}

.segment.vineyard:not(.restored) .vine-leaf-c {
  opacity: max(0, calc((var(--growth-intensity) - 0.54) * 1.9));
  transform: scale(calc(0.44 + var(--growth-intensity) * 0.72))
    rotate(calc(8deg - var(--growth-intensity) * 6deg));
}

.segment.vineyard:not(.restored) .vine-grape {
  filter: saturate(calc(0.4 + var(--growth-intensity) * 0.6));
}

.segment.vineyard:not(.restored) .grape-a {
  opacity: max(0, calc((var(--growth-intensity) - 0.4) * 1.4));
  transform: scale(calc(0.56 + var(--growth-intensity) * 0.48));
}

.segment.vineyard:not(.restored) .grape-b {
  opacity: max(0, calc((var(--growth-intensity) - 0.68) * 2.8));
  transform: scale(calc(0.48 + var(--growth-intensity) * 0.56));
}

.segment.restored .vine-leaf,
.segment.restored .vine-grape {
  opacity: 1;
}

.segment.restored .vine-leaf {
  animation: leaf-breathe 4.2s ease-in-out infinite;
}

.segment.restored .vine-grape {
  animation: grape-bob 4.8s ease-in-out infinite;
}

@keyframes vine-sway {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(2px);
  }
}

@keyframes leaf-breathe {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.04) rotate(3deg);
  }
}

@keyframes grape-bob {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-1px) scale(1.03);
  }
}

.cellar-door {
  left: 50%;
  bottom: 44px;
  width: 38px;
  height: 56px;
  transform: translateX(-50%);
  border-radius: 18px 18px 6px 6px;
  background: linear-gradient(
    180deg,
    rgba(84, 71, 58, 0.85),
    rgba(44, 34, 28, 0.94)
  );
}

.segment.restored .cellar-door {
  box-shadow:
    0 0 0 2px rgba(158, 131, 86, 0.24),
    inset 0 0 10px rgba(240, 194, 100, 0.16);
}

.barrel {
  bottom: 34px;
  width: 16px;
  height: 20px;
  border-radius: 4px;
  background: linear-gradient(
    180deg,
    rgba(98, 61, 34, 0.78),
    rgba(70, 44, 24, 0.9)
  );
}

.barrel-left {
  left: 14px;
}
.barrel-right {
  right: 14px;
}

.cellar-bottle {
  left: 50%;
  bottom: 34px;
  width: 8px;
  height: 18px;
  transform: translateX(-50%);
  border-radius: 3px 3px 2px 2px;
  background: linear-gradient(
    180deg,
    rgba(122, 168, 96, 0.86),
    rgba(68, 82, 40, 0.94)
  );
  box-shadow: 0 0 8px rgba(255, 214, 142, 0.16);
}

.stable-frame {
  left: 16px;
  right: 16px;
  bottom: 40px;
  height: 52px;
  border: 4px solid rgba(88, 62, 34, 0.72);
  border-top: none;
}

.stable-roof {
  left: 12px;
  right: 12px;
  bottom: 92px;
  height: 16px;
  clip-path: polygon(8% 100%, 50% 0, 92% 100%);
  background: rgba(92, 73, 48, 0.75);
}

.segment.restored .stable-roof {
  background: linear-gradient(
    180deg,
    rgba(128, 94, 58, 0.96),
    rgba(84, 58, 31, 0.96)
  );
}

.hay {
  bottom: 28px;
  width: 20px;
  height: 12px;
  border-radius: 999px;
  background: rgba(182, 148, 62, 0.24);
}

.segment.restored .hay {
  background: rgba(204, 176, 82, 0.92);
}

.hay-a {
  left: 18px;
}
.hay-b {
  right: 18px;
}

.water-trough {
  right: 12px;
  bottom: 28px;
  width: 18px;
  height: 10px;
  border-radius: 999px;
  background: rgba(98, 122, 146, 0.38);
}

.segment.restored .water-trough {
  background: rgba(124, 174, 201, 0.88);
}

.flower-bed {
  left: 12px;
  right: 12px;
  bottom: 32px;
  height: 34px;
  border-radius: 14px 14px 4px 4px;
  background: rgba(121, 88, 69, 0.46);
}

.flower {
  bottom: 52px;
  font-size: 22px;
  opacity: 0.56;
}

.segment.restored .flower {
  opacity: 1;
}

.flower-a {
  left: 18px;
}
.flower-b {
  right: 18px;
}

.greenhouse-body {
  left: 14px;
  right: 14px;
  bottom: 36px;
  height: 54px;
  border: 2px solid rgba(131, 120, 111, 0.58);
  border-radius: 8px 8px 4px 4px;
  background: rgba(210, 210, 208, 0.16);
}

.segment.restored .greenhouse-body {
  background: rgba(210, 235, 222, 0.24);
  box-shadow: inset 0 0 16px rgba(244, 220, 146, 0.25);
}

.greenhouse-pane {
  bottom: 48px;
  width: 18px;
  height: 28px;
  background: rgba(226, 231, 235, 0.2);
}

.pane-a {
  left: 22px;
}
.pane-b {
  right: 22px;
}

.greenhouse-lamp {
  left: 50%;
  bottom: 32px;
  width: 12px;
  height: 12px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: rgba(241, 206, 130, 0.82);
  box-shadow: 0 0 10px rgba(246, 212, 148, 0.34);
  opacity: 0;
}

.segment.restored .greenhouse-lamp {
  opacity: 1;
}

.greenhouse-lamp.warning {
  animation: lamp-flicker 0.9s steps(2) infinite;
}

@keyframes lamp-flicker {
  0%,
  100% {
    opacity: 0.48;
    box-shadow: 0 0 6px rgba(246, 212, 148, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 16px rgba(246, 212, 148, 0.56);
  }
}

.sprout {
  left: 50%;
  bottom: 34px;
  transform: translateX(-50%);
  font-size: 18px;
  opacity: 0.28;
}

.segment.restored .sprout {
  opacity: 1;
}

.gazebo-roof {
  left: 14px;
  right: 14px;
  bottom: 96px;
  height: 14px;
  clip-path: polygon(8% 100%, 50% 0, 92% 100%);
  background: rgba(98, 81, 68, 0.74);
}

.gazebo-seat {
  bottom: 42px;
  width: 20px;
  height: 18px;
  border-radius: 4px;
  background: rgba(112, 91, 67, 0.66);
}

.seat-left {
  left: 24px;
}
.seat-right {
  right: 24px;
}

.segment.restored .gazebo-seat {
  background: rgba(176, 136, 86, 0.92);
}

.gazebo-rail {
  left: 16px;
  right: 16px;
  bottom: 36px;
  height: 4px;
  background: rgba(105, 92, 80, 0.7);
}

.kitchen-body,
.suite-body {
  left: 14px;
  right: 14px;
  bottom: 34px;
  height: 58px;
  border-radius: 8px 8px 4px 4px;
  background: rgba(117, 102, 88, 0.7);
}

.segment.restored .kitchen-body,
.segment.restored .suite-body {
  background: linear-gradient(
    180deg,
    rgba(192, 170, 140, 0.92),
    rgba(120, 93, 73, 0.94)
  );
}

.kitchen-window,
.suite-window {
  left: 50%;
  bottom: 58px;
  width: 18px;
  height: 16px;
  transform: translateX(-50%);
  border-radius: 4px;
  background: rgba(70, 63, 59, 0.7);
}

.segment.restored .kitchen-window {
  background: radial-gradient(
    circle,
    rgba(255, 196, 106, 0.95),
    rgba(189, 108, 41, 0.78)
  );
}

.segment.restored .suite-window {
  background: radial-gradient(
    circle,
    rgba(243, 223, 170, 0.92),
    rgba(183, 153, 196, 0.72)
  );
}

.chimney {
  right: 22px;
  bottom: 76px;
  width: 8px;
  height: 20px;
  border-radius: 4px 4px 0 0;
  background: rgba(96, 80, 68, 0.75);
}

.hive {
  left: 12px;
  bottom: 28px;
  font-size: 12px;
  opacity: 0.72;
}

.geralt-shadow {
  left: 50%;
  bottom: 58px;
  transform: translateX(-50%);
  font-size: 12px;
  opacity: 0;
  transition: transform 220ms ease;
}

.segment.restored .geralt-shadow {
  opacity: 0.72;
}

.geralt-shadow.stirring {
  animation: stir-pot 1.2s ease;
}

@keyframes stir-pot {
  0%,
  100% {
    transform: translateX(-50%) rotate(0deg);
  }
  40% {
    transform: translateX(calc(-50% - 2px)) rotate(-8deg);
  }
  70% {
    transform: translateX(calc(-50% + 2px)) rotate(6deg);
  }
}

.curtain {
  left: 50%;
  bottom: 54px;
  width: 10px;
  height: 22px;
  transform: translateX(-50%);
  border-radius: 0 0 8px 8px;
  background: rgba(170, 148, 184, 0.4);
}

.segment.restored .curtain {
  background: rgba(198, 178, 214, 0.88);
  animation: curtain-breathe 3.4s ease-in-out infinite;
}

.curtain.flutter {
  animation: curtain-sway 0.9s ease-in-out 2;
}

@keyframes curtain-breathe {
  0%,
  100% {
    transform: translateX(-50%) rotate(0deg);
  }
  50% {
    transform: translateX(calc(-50% + 1px)) rotate(4deg);
  }
}

@keyframes curtain-sway {
  0%,
  100% {
    transform: translateX(-50%) rotate(0deg);
  }
  35% {
    transform: translateX(calc(-50% - 1px)) rotate(-8deg);
  }
  70% {
    transform: translateX(calc(-50% + 2px)) rotate(6deg);
  }
}

.vase {
  right: 12px;
  bottom: 34px;
  font-size: 16px;
  opacity: 0.3;
}

.segment.restored .vase {
  opacity: 1;
}

.hotspot {
  position: absolute;
  width: 28px;
  height: 28px;
  margin: -14px 0 0 -14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(255, 247, 225, 0.86);
  background: linear-gradient(180deg, rgba(248, 236, 208, 0.82), rgba(204, 180, 132, 0.76));
  box-shadow: 0 0 0 0 rgba(255, 230, 170, 0.35);
  transition:
    transform 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

.hotspot:hover:not(:disabled),
.hotspot.active {
  transform: scale(1.12);
  background: rgba(255, 248, 228, 0.52);
  box-shadow:
    0 0 0 10px rgba(255, 230, 170, 0.18),
    0 0 16px rgba(255, 230, 170, 0.28);
}

.hotspot:disabled {
  pointer-events: none;
}

.hotspot.warning {
  animation: warning-pulse 0.9s steps(2) infinite;
}

.hotspot.orbiting {
  animation: butterfly-orbit 1.2s ease;
}

.hotspot.stirring .actor,
.hotspot.flutter .actor {
  animation: icon-bob 0.9s ease-in-out 1;
}

.gate-raven {
  left: 50%;
  top: 30%;
}

.vine-hotspot {
  left: 56%;
  top: 34%;
}

.cellar-hotspot {
  left: 51%;
  top: 56%;
}

.roach-hotspot {
  left: 48%;
  top: 40%;
}

.butterfly-hotspot {
  left: 57%;
  top: 30%;
}

.greenhouse-hotspot {
  left: 54%;
  top: 28%;
}

.terrace-hotspot {
  left: 56%;
  top: 26%;
}

.kitchen-hotspot {
  left: 58%;
  top: 28%;
}

.suite-hotspot {
  left: 58%;
  top: 24%;
}

.actor {
  font-size: 16px;
  line-height: 1;
  pointer-events: none;
}

.marker-raven {
  font-size: 18px;
}

.marker-roach {
  font-size: 15px;
}

.marker-butterfly {
  font-size: 15px;
}

@keyframes warning-pulse {
  0%,
  100% {
    opacity: 0.62;
  }
  50% {
    opacity: 1;
  }
}

@keyframes butterfly-orbit {
  0% {
    transform: translate(0, 0) scale(1);
  }
  30% {
    transform: translate(6px, -8px) scale(1.08);
  }
  65% {
    transform: translate(-5px, -6px) scale(0.96);
  }
  100% {
    transform: translate(0, 0) scale(1);
  }
}

@keyframes icon-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-3px);
  }
  70% {
    transform: translateY(1px);
  }
}

.burst {
  position: absolute;
  font-size: 16px;
  animation: burst-rise linear forwards;
}

@keyframes burst-rise {
  0% {
    transform: translate(0, 0) rotate(0deg) scale(0.9);
    opacity: 0;
  }
  18% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--dx), calc(var(--dy) * -1)) rotate(var(--rot))
      scale(1.08);
    opacity: 0;
  }
}

.scene-wind {
  background: linear-gradient(
    110deg,
    transparent 18%,
    rgba(255, 245, 214, 0.16) 38%,
    transparent 58%
  );
  animation: repair-wind 1.8s ease-in-out infinite;
}

@keyframes repair-wind {
  from {
    transform: translateX(-120%);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  to {
    transform: translateX(120%);
    opacity: 0;
  }
}
</style>
