<template>
  <!-- Animal Island blob clip-path (shared by all blob modals) -->
  <svg style="position: absolute; width: 0; height: 0" aria-hidden>
    <defs>
      <clipPath id="animal-modal-clip" clipPathUnits="objectBoundingBox">
        <path
          d="M0.501,0.005 L0.501,0.005 L0.523,0.005 L0.549,0.006
          C0.704,0.01,0.796,0.017,0.825,0.027 L0.827,0.028
          C0.872,0.045,0.939,0.044,0.978,0.17
          C1,0.254,1,0.365,0.99,0.505 L0.988,0.513
          C0.979,0.558,0.971,0.598,0.965,0.633
          C0.956,0.689,0.979,0.77,0.964,0.865
          C0.953,0.928,0.921,0.966,0.869,0.979
          C0.821,0.986,0.773,0.992,0.726,0.995
          L0.712,0.996 L0.694,0.997
          C0.648,1,0.586,1,0.507,1 L0.501,1 L0.464,1
          C0.385,1,0.325,0.998,0.283,0.995
          C0.234,0.992,0.184,0.987,0.133,0.979
          C0.081,0.966,0.05,0.928,0.039,0.865
          C0.023,0.77,0.047,0.689,0.037,0.633
          C0.031,0.595,0.023,0.552,0.013,0.505
          C-0.006,0.365,-0.002,0.254,0.024,0.17
          C0.064,0.045,0.13,0.045,0.174,0.028 L0.175,0.028
          C0.204,0.017,0.303,0.009,0.474,0.005 L0.501,0.005"
        />
      </clipPath>
    </defs>
  </svg>

  <!-- Loading screen (persists during closing animation, game mounts behind) -->
  <LoadingScreen v-if="loadingScreenVisible" :progress="loadProgress" @done="loadingScreenVisible = false" />

  <!-- Main app (mounts behind loading screen before closing animation) -->
  <template v-if="!loading">
    <Title v-if="game.phase === 'title' && !showTutorial" @start="onStart" />
    <TutorialOverlay v-else-if="showTutorial" @done="onTutorialDone" />
    <GameContainer v-else-if="isGamePhase" />
    <Ending v-else-if="isEndingPhase" @restart="onRestart" />
  </template>
  <transition name="tester-toast">
    <p v-if="testerToast" class="tester-toast parchment grain">
      {{ testerToast }}
    </p>
  </transition>
  <section
    v-if="showTesterPanel"
    class="tester-panel parchment grain"
    aria-label="道具测试面板"
  >
    <div class="tester-panel-head">
      <div>
        <p class="tester-eyebrow">Tester</p>
        <h3 class="tester-title">小猪道具搭配</h3>
      </div>
      <button
        type="button"
        class="tester-close"
        @click="showTesterPanel = false"
      >
        收起
      </button>
    </div>
    <p class="tester-hint">
      `Ctrl/Cmd + I` 打开。先勾选道具点"应用当前组合"，再用下面动作快速触发。
    </p>
    <div class="tester-shortcuts">
      <button type="button" class="tester-action accent" @click="triggerLoadingDemo">
        展示加载画面
      </button>
      <button type="button" class="tester-action" @click="applySelectedItems">
        应用当前组合
      </button>
      <button
        type="button"
        class="tester-action subtle"
        @click="clearSelectedItems"
      >
        清空道具
      </button>
      <button
        type="button"
        class="tester-action subtle"
        @click="selectAllItems"
      >
        全选道具
      </button>
      <button
        type="button"
        class="tester-action subtle"
        @click="resetItemFlags"
      >
        重置当日触发
      </button>
      <button type="button" class="tester-action subtle" @click="fillPigEnergy">
        充满小猪能量
      </button>
      <button type="button" class="tester-action subtle" @click="setLowSteps">
        步数设为 3
      </button>
      <button
        type="button"
        class="tester-action danger"
        @click="triggerZeroStepRecovery"
      >
        测试归零救场
      </button>
      <button type="button" class="tester-action" @click="jumpToEnding">
        跳到结尾
      </button>
      <button
        type="button"
        class="tester-action danger"
        @click="clearAllAchievements"
      >
        清空所有成就
      </button>
      <button type="button" class="tester-action" @click="resetTutorial">
        测试引导
      </button>
    </div>
    <div class="tester-columns">
      <div class="tester-group">
        <p class="tester-group-title">
          宝箱房
          <span class="tester-group-count">({{ treasureItems.length }})</span>
        </p>
        <label v-for="item in treasureItems" :key="item.id" class="tester-item">
          <input v-model="selectedItemIds" type="checkbox" :value="item.id" />
          <span class="tester-item-emoji">{{ item.emoji }}</span>
          <span class="tester-item-copy">
            <span class="tester-item-name">
              {{ item.name }}
            </span>
            <span class="tester-item-effect">{{ item.description }}</span>
          </span>
        </label>
      </div>
      <div class="tester-group">
        <p class="tester-group-title">
          恶魔房
          <span class="tester-group-count">({{ devilItems.length }})</span>
        </p>
        <label v-for="item in devilItems" :key="item.id" class="tester-item">
          <input v-model="selectedItemIds" type="checkbox" :value="item.id" />
          <span class="tester-item-emoji">{{ item.emoji }}</span>
          <span class="tester-item-copy">
            <span class="tester-item-name">
              {{ item.name }}
            </span>
            <span class="tester-item-effect">{{ item.description }}</span>
          </span>
        </label>
      </div>
    </div>
  </section>
  <AchievementToastStack />
  <AchievementPanel />
  <AudioControls />
</template>

<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watchEffect } from 'vue'
import AudioControls from './components/HUD/AudioControls.vue'
import AchievementPanel from './components/HUD/AchievementPanel.vue'
import AchievementToastStack from './components/HUD/AchievementToastStack.vue'
import LoadingScreen from './components/LoadingScreen.vue'
import TutorialOverlay from './components/TutorialOverlay.vue'
import Title from './components/Title.vue'
import GameContainer from './components/GameContainer.vue'
import Ending from './components/Ending.vue'
import { useAudio } from '@/composables/useAudio'
import { REWARD_ITEMS } from '@/data/content'
import { useAchievementStore } from '@/stores/achievementStore'
import { useGameStore } from '@/stores/gameStore'

const achievement = useAchievementStore()
const game = useGameStore()
useAudio()
const testerToast = ref('')
const showTesterPanel = ref(false)
const showTutorial = ref(false)
const selectedItemIds = ref([])
const allRewardItems = Object.values(REWARD_ITEMS)

const GAME_PHASES = ['intro', 'playing', 'targeting', 'dayEnd', 'repairing', 'rewardChoice', 'awakening', 'djinnTransition', 'wish']
const ENDING_PHASES = ['ending', 'final']
const isGamePhase = computed(() => GAME_PHASES.includes(game.phase))
const isEndingPhase = computed(() => ENDING_PHASES.includes(game.phase))
const treasureItems = computed(() =>
  allRewardItems.filter(item => item.roomType === 'treasure')
)
const devilItems = computed(() =>
  allRewardItems.filter(item => item.roomType === 'devil')
)

// Loading state — two flags: loading (game content mount) & loadingScreenVisible (overlay)
const loading = ref(true)
const loadingScreenVisible = ref(true)
const loadProgress = ref(0)
let toastTimer = null
let jumpChordTimer = null
const jumpChordActive = ref(false)

function onStart() {
  if (!game.tutorialSeen) {
    showTutorial.value = true
  }
}

function onTutorialDone() {
  game.markTutorialSeen()
  showTutorial.value = false
}

function onRestart() {
  game.phase = 'title'
}

function onTesterKeydown(event) {
  if (!(event.metaKey || event.ctrlKey)) return
  const key = event.key.toLowerCase()

  if (key === 'i') {
    event.preventDefault()
    showTesterPanel.value = !showTesterPanel.value
    if (showTesterPanel.value) syncTesterSelection()
    showTesterToast(
      showTesterPanel.value ? '测试面板：已打开' : '测试面板：已收起'
    )
    return
  }

  if (jumpChordActive.value && /^[1-9]$/.test(key)) {
    event.preventDefault()
    clearJumpChord()
    const result = game.jumpToDayForTesting(Number(key))
    if (!result) return
    game.startPlay()
    showTesterToast(
      `测试跳转：已到第 ${result.day} 天“${result.building}”并直接开始`
    )
    return
  }

  if (key === 'j') {
    event.preventDefault()
    const nextLocked =
      achievement.achievementList.find(
        item => !achievement.unlockedSet.has(item.id)
      ) || achievement.achievementList[0]
    const ok = achievement.unlockForTesting(nextLocked?.id)
    if (!ok) {
      showTesterToast('测试成就：没有可解锁的新成就了')
      return
    }
    showTesterToast(`测试成就：已解锁“${nextLocked.title}”`)
    return
  }

  if (key === 'l') {
    event.preventDefault()
    const result = game.jumpToDjinnReadyForTesting()
    if (!result) return
    showTesterToast(`测试跳转：已进入第 ${result.day} 天 djinnReady`)
    return
  }

  if (key === 'm') {
    event.preventDefault()
    const total = game.addPigEnergyForTesting(5)
    showTesterToast(`测试能量：小猪已补充 5 星，当前 ${total} 星`)
    return
  }

  if (key === 'e') {
    event.preventDefault()
    game.jumpToEndingForTesting()
    showTesterToast('测试跳转：已进入结局画面')
    return
  }

  if (key !== 'k') return
  event.preventDefault()
  armJumpChord()
}

function syncTesterSelection() {
  selectedItemIds.value = [...game.ownedItemIds]
}

function applySelectedItems() {
  const ids = game.setOwnedItemsForTesting(selectedItemIds.value)
  showTesterToast(
    ids.length
      ? `测试道具：已应用 ${ids.length} 个道具组合`
      : '测试道具：当前组合已清空'
  )
}

function clearSelectedItems() {
  selectedItemIds.value = []
  game.setOwnedItemsForTesting([])
  showTesterToast('测试道具：已清空')
}

function resetItemFlags() {
  game.resetItemFlagsForTesting()
  showTesterToast('测试道具：已重置当天触发次数')
}

function fillPigEnergy() {
  const total = game.setPigEnergyForTesting(5)
  showTesterToast(`测试能量：当前 ${total} 星`)
}

function setLowSteps() {
  const total = game.setStepsForTesting(3)
  showTesterToast(`测试步数：已设为 ${total}`)
}

function triggerZeroStepRecovery() {
  const ok = game.triggerZeroStepRecoveryForTesting()
  showTesterToast(
    ok
      ? `测试救场：已触发归零恢复，当前 ${game.stepsLeft} 步`
      : '测试救场：当前组合没有归零恢复类道具'
  )
}

function selectAllItems() {
  selectedItemIds.value = allRewardItems.map(item => item.id)
  showTesterToast(
    `测试道具：已勾选全部 ${allRewardItems.length} 件道具（点"应用当前组合"生效）`
  )
}

function jumpToEnding() {
  game.jumpToEndingForTesting()
  showTesterToast('测试跳转：已进入结局画面')
}

function clearAllAchievements() {
  achievement.clearAllForTesting()
  showTesterToast('测试成就：已清空所有成就')
}

function resetTutorial() {
  game.resetTutorialForTesting()
  game.phase = 'title'
  showTesterToast('测试引导：已重置，回到标题画面后点"开始"即可触发')
}

function triggerLoadingDemo() {
  if (loadingScreenVisible.value) return
  loadingScreenVisible.value = true
  loadProgress.value = 0
  let p = 0
  const interval = setInterval(() => {
    p += 6
    loadProgress.value = Math.min(p, 100)
    if (p >= 100) clearInterval(interval)
  }, 60)
}

function armJumpChord() {
  jumpChordActive.value = true
  if (jumpChordTimer) clearTimeout(jumpChordTimer)
  jumpChordTimer = setTimeout(() => {
    clearJumpChord()
  }, 1800)
  showTesterToast('测试跳转：继续按 1–9 跳到指定天')
}

function clearJumpChord() {
  jumpChordActive.value = false
  if (jumpChordTimer) {
    clearTimeout(jumpChordTimer)
    jumpChordTimer = null
  }
}

function showTesterToast(text) {
  testerToast.value = text
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    testerToast.value = ''
    toastTimer = null
  }, 1800)
}

// Day-tinted body backdrop (CSS hooks live in tokens.css).
watchEffect(() => {
  if (typeof document === 'undefined') return
  document.body.dataset.day = String(game.currentDay + 1)
  document.body.dataset.phase = game.phase
})

onMounted(async () => {
  if (typeof document === 'undefined') return
  achievement.init()
  game.initTutorial()
  document.body.dataset.day = '1'
  document.body.dataset.phase = 'title'
  window.addEventListener('keydown', onTesterKeydown)

  // Loading sequence — minimum 1.5s display time
  const loadStart = performance.now()
  loadProgress.value = 20
  await document.fonts?.ready
  loadProgress.value = 60
  await new Promise(r => setTimeout(r, 400))
  loadProgress.value = 90
  await new Promise(r => setTimeout(r, 300))
  loadProgress.value = 100

  // Ensure minimum display time so users can appreciate the loading screen
  const elapsed = performance.now() - loadStart
  const remaining = Math.max(0, 1500 - elapsed)
  if (remaining > 0) await new Promise(r => setTimeout(r, remaining))

  // Mount game content behind the loading screen before its closing animation starts
  await nextTick()
  loading.value = false
  // LoadingScreen emits 'done' → loadingScreenVisible = false after wipe animation
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  window.removeEventListener('keydown', onTesterKeydown)
  if (toastTimer) clearTimeout(toastTimer)
  clearJumpChord()
})
</script>

<style scoped>
.tester-toast {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 120;
  margin: 0;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ink);
  box-shadow:
    0 12px 28px rgba(35, 24, 14, 0.2),
    0 0 0 1px rgba(255, 242, 214, 0.1);
}

.tester-toast-enter-active,
.tester-toast-leave-active {
  transition:
    opacity 240ms var(--ease-out-expo),
    transform 240ms var(--ease-out-expo);
}

.tester-toast-enter-from,
.tester-toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.tester-panel {
  position: fixed;
  top: 60px;
  right: 18px;
  z-index: 119;
  width: min(420px, calc(100vw - 36px));
  max-height: calc(100vh - 110px);
  overflow: auto;
  padding: 14px;
  border-radius: 18px;
  color: var(--ink);
  box-shadow:
    0 18px 40px rgba(35, 24, 14, 0.24),
    0 0 0 1px rgba(255, 242, 214, 0.12);
}

.tester-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.tester-eyebrow,
.tester-title,
.tester-hint,
.tester-group-title,
.tester-item-name,
.tester-item-effect {
  margin: 0;
}

.tester-eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #9f927d;
}

.tester-title {
  font-size: 18px;
  color: #794f27;
}

.tester-close,
.tester-action {
  border: 2px solid #d4c9b4;
  background: #f8f8f0;
  color: #725d42;
  border-radius: 999px;
  box-shadow: 0 3px 0 0 #d4c9b4;
  font: inherit;
  cursor: pointer;
}

.tester-close {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
}

.tester-hint {
  font-size: 12px;
  line-height: 1.45;
  color: #8a7558;
}

.tester-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tester-action {
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 700;
}

.tester-action.subtle {
  background: #f3efe2;
}

.tester-action.danger {
  border-color: rgba(200, 70, 70, 0.35);
  box-shadow: 0 3px 0 0 rgba(200, 70, 70, 0.25);
  color: #b94a4a;
}

.tester-action.accent {
  border-color: #19c8b9;
  box-shadow: 0 3px 0 0 #50B9AB;
  color: #19c8b9;
}

.tester-shortcuts.tear-row {
  display: flex;
  display: none; /* deprecated: pig tear system removed */
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(25, 200, 185, 0.08), #f8f8f0);
  border: 1.5px dashed rgba(25, 200, 185, 0.4);
}

.tear-row-label {
  font-size: 12px;
  font-weight: 800;
  color: #11827a;
  letter-spacing: 0.04em;
}

.tear-row-stat {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: #5a8a86;
  font-variant-numeric: tabular-nums;
}

.tester-group-count {
  font-size: 10px;
  font-weight: 700;
  color: #9f927d;
  margin-left: 4px;
}

.tester-tear-tag {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 50px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #11827a;
  background: rgba(25, 200, 185, 0.16);
  border: 1px solid rgba(25, 200, 185, 0.32);
}

.tester-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 14px;
}

.tester-group {
  min-width: 0;
  padding: 10px;
  border-radius: 14px;
  background: rgba(248, 248, 240, 0.78);
  border: 1px solid rgba(212, 201, 180, 0.9);
}

.tester-group-title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #794f27;
}

.tester-item {
  display: grid;
  grid-template-columns: 16px 24px minmax(0, 1fr);
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
}

.tester-item + .tester-item {
  border-top: 1px dashed rgba(212, 201, 180, 0.7);
}

.tester-item input {
  margin: 3px 0 0;
}

.tester-item-emoji {
  font-size: 18px;
  line-height: 1;
}

.tester-item-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.tester-item-name {
  font-size: 13px;
  font-weight: 700;
  color: #725d42;
}

.tester-item-effect {
  font-size: 11px;
  line-height: 1.45;
  color: #8a7558;
}

@media (max-width: 900px) {
  .tester-panel {
    left: 12px;
    right: 12px;
    width: auto;
  }

  .tester-columns {
    grid-template-columns: 1fr;
  }
}
</style>
