<template>
  <div class="board-wrap">
    <div
      class="gameBoard grain"
      :class="{
        shaking: shaking,
        dimmed: targeting,
        repairing: game.phase === 'repairing',
        idle: boardIdle
      }"
      :data-theme="boardThemeKey || undefined"
      :style="boardThemeStyle"
      @mousedown="bumpIdle"
      @touchstart.passive="bumpIdle"
      @mouseup="onPointerUp"
      @touchend="onPointerUp"
      @mouseleave="onPointerUp"
      @mousemove="onPointerMove"
      @touchmove="onPointerMove"
    >
      <div class="tileContainer" :style="containerStyle">
        <!-- <div v-if="boardThemeKey" class="board-growth" :class="`board-growth-${boardThemeKey}`">
          <span class="growth-veil" />
          <template v-if="boardThemeKey === 'courtyard'">
            <span class="growth-mote mote-a">🍂</span>
            <span class="growth-mote mote-b">🌿</span>
            <span class="growth-mote mote-c">🍂</span>
          </template>
          <template v-else-if="boardThemeKey === 'vineyard'">
            <span class="growth-vine vine-a" />
            <span class="growth-vine vine-b" />
            <span class="growth-vine vine-c" />
            <span class="growth-leaf leaf-a">🌿</span>
            <span class="growth-leaf leaf-b">🍃</span>
            <span class="growth-leaf leaf-c">🌿</span>
            <span class="growth-grape grape-a">🍊</span>
            <span class="growth-grape grape-b">🍊</span>
          </template>
          <template v-else-if="boardThemeKey === 'cellar'">
            <span class="growth-mote mote-a">✨</span>
            <span class="growth-mote mote-b">🟤</span>
            <span class="growth-mote mote-c">✨</span>
          </template>
          <template v-else-if="boardThemeKey === 'stables'">
            <span class="growth-mote mote-a">🌾</span>
            <span class="growth-mote mote-b">✨</span>
            <span class="growth-mote mote-c">🌾</span>
          </template>
          <template v-else-if="boardThemeKey === 'garden'">
            <span class="growth-bloom bloom-a">🪻</span>
            <span class="growth-bloom bloom-b">🌸</span>
            <span class="growth-bloom bloom-c">🪻</span>
          </template>
          <template v-else-if="boardThemeKey === 'greenhouse'">
            <span class="growth-mote mote-a">💧</span>
            <span class="growth-mote mote-b">🌱</span>
            <span class="growth-mote mote-c">💧</span>
          </template>
          <template v-else-if="boardThemeKey === 'gazebo'">
            <span class="growth-ray ray-a" />
            <span class="growth-ray ray-b" />
            <span class="growth-mote mote-b">✨</span>
          </template>
          <template v-else-if="boardThemeKey === 'kitchen'">
            <span class="growth-glow ember-a" />
            <span class="growth-glow ember-b" />
            <span class="growth-mote mote-c">✦</span>
          </template>
          <template v-else-if="boardThemeKey === 'lilacSuite'">
            <span class="growth-bloom bloom-a">🪻</span>
            <span class="growth-bloom bloom-b">🕯️</span>
            <span class="growth-bloom bloom-c">🪻</span>
          </template>
        </div> -->

        <div class="board-idle-aura" />

        <div
          v-for="entity in game.activeBoardEntities"
          :key="`slot-${entity.id}`"
          class="entity-slot"
          :style="{
            width: `${(entity.width || 1) * TILE_SIZE}px`,
            height: `${(entity.height || 1) * TILE_SIZE}px`,
            transform: `translate3d(${entity.col * TILE_SIZE}px, ${entity.row * TILE_SIZE}px, 0)`
          }"
        />

        <span
          v-for="cell in djinnMarks"
          :key="cell.id"
          class="seal-cell"
          :class="[cell.variantClass, { cleared: cell.cleared }]"
          :style="{
            transform: `translate3d(${cell.col * TILE_SIZE}px, ${cell.row * TILE_SIZE}px, 0)`
          }"
        >
          <span class="seal-glyph">{{ cell.glyph }}</span>
        </span>

        <span
          v-for="cell in visibleRotCells"
          :key="`rot-${cell.ownerId}-${cell.row}-${cell.col}`"
          class="rot-mark"
          :style="{
            transform: `translate3d(${cell.col * TILE_SIZE}px, ${cell.row * TILE_SIZE}px, 0)`
          }"
        />

        <BoardTile
          v-for="t in tiles"
          :key="t.id"
          :tile="t"
          :monster="monsterAt(t.row, t.col)"
          :selected="selectedId === t.id"
          :hint="hintIds.has(t.id)"
          :preview="previewState(t)"
          :invalid="invalidIds.has(t.id)"
          @pick="onPick"
        />

        <BoardEntity
          v-for="entity in game.activeBoardEntities"
          :key="entity.id"
          :entity="entity"
          :tile-size="TILE_SIZE"
          @monster-hover-enter="onMonsterHoverEnter"
          @monster-hover-leave="onMonsterHoverLeave"
          @monster-inspect="onMonsterInspect"
        />

        <!-- Petal layer for 5+ matches & repair -->
        <div v-if="petals.length" class="petal-layer">
          <span
            v-for="p in petals"
            :key="p.id"
            class="petal"
            :style="{
              left: p.left + 'px',
              fontSize: p.size + 'px',
              animationDuration: p.dur + 's',
              '--dx': p.dx + 'px'
            }"
          >
            {{ p.glyph }}
          </span>
        </div>

        <div v-if="milkTeaFlares.length" class="milk-tea-layer">
          <span
            v-for="flare in milkTeaFlares"
            :key="flare.id"
            class="milk-tea-flare"
            :style="flare.style"
          >
            {{ flare.glyph }}
          </span>
        </div>

        <div v-if="milkTeaSigil" class="milk-tea-burst">
          <span class="milk-tea-burst-aura" />
          <span class="milk-tea-burst-ring ring-a" />
          <span class="milk-tea-burst-ring ring-b" />
          <span class="milk-tea-burst-core">{{ milkTeaSigil.glyph }}</span>
          <span class="milk-tea-burst-label">果汁特调</span>
        </div>

        <Transition name="milk-tea-pop">
          <div v-if="milkTeaResult" class="milk-tea-image-overlay">
            <div class="milk-tea-image-card">
              <img :src="milkTeaResult" alt="" class="milk-tea-image">
            </div>
            <p class="milk-tea-image-label">果汁特调完成狸~</p>
          </div>
        </Transition>

        <div
          v-if="showCakeBuild"
          class="cake-build"
          :class="`layer-${game.djinnCakeLayer}`"
        >
          <span class="cake-glow" />
          <span class="cake-plate">🍽️</span>
          <span v-if="game.djinnCakeLayer >= 1" class="cake-base">🎂</span>
          <span v-if="game.djinnCakeLayer >= 2" class="cake-lilac">🪻</span>
          <span v-if="game.djinnCakeLayer >= 3" class="cake-candles">
            🕯️🕯️🕯️
          </span>
        </div>

        <div v-if="showDjinnAwakening" class="djinn-awakening">
          <span class="awakening-flash" />
          <span class="awakening-core" :style="djinnCoreStyle" />
          <span
            v-for="bolt in awakeningBolts"
            :key="bolt.id"
            class="awakening-bolt"
            :style="bolt.style"
          >
            ⚡️
          </span>
          <span
            v-for="spark in awakeningSparks"
            :key="spark.id"
            class="awakening-spark"
            :style="spark.style"
          >
            ✦
          </span>
        </div>

        <div
          v-if="showDjinnTransition"
          class="djinn-transition"
          :style="djinnTransitionVars"
        >
          <span class="transition-dim" />
          <span class="transition-core" :style="djinnCoreStyle" />
          <span
            v-for="trace in transitionTraces"
            :key="trace.id"
            class="transition-trace"
            :style="trace.style"
          />
          <span
            v-for="shard in transitionShards"
            :key="shard.id"
            class="transition-shard"
            :style="shard.style"
          >
            {{ shard.glyph }}
          </span>
          <span
            v-for="flare in transitionFlares"
            :key="flare.id"
            class="transition-flare"
            :style="flare.style"
          >
            {{ flare.glyph }}
          </span>
          <span
            v-for="ring in transitionRings"
            :key="ring.id"
            class="transition-ring"
            :style="ring.style"
          />
        </div>
      </div>

      <transition name="combo-praise">
        <div
          v-if="comboPraise"
          :key="comboPraise.id"
          class="combo-praise"
          :class="[
            comboPraise.tone,
            comboPraise.theme,
            comboPraise.sizeClass,
            {
              giant: comboPraise.giant,
              chained: comboPraise.chainDepth >= 2,
              blazing: comboPraise.chainDepth >= 3,
              trailing: comboPraise.trailing
            }
          ]"
          :style="comboPraise.style"
        >
          <p class="combo-praise-prefix" v-if="comboPraise.prefix">
            {{ comboPraise.prefix }}
          </p>
          <p class="combo-praise-label">
            {{ comboPraise.label }}
            <span v-if="comboPraise.fireMark" class="combo-praise-fire">
              {{ comboPraise.fireMark }}
            </span>
          </p>
          <p v-if="comboPraise.comboText" class="combo-praise-combo">
            {{ comboPraise.comboText }}
          </p>
          <p v-if="comboPraise.subline" class="combo-praise-subline">
            {{ comboPraise.subline }}
          </p>
        </div>
      </transition>

      <transition name="combo-flash">
        <div
          v-if="comboPraise?.flash"
          :key="`flash-${comboPraise.id}`"
          class="combo-flash"
        />
      </transition>

      <!-- X-Ray scan overlay -->
      <div v-if="xrayScanning" class="xray-overlay">
        <div class="xray-scan-line" />
        <div class="xray-glow" />
      </div>
    </div>

    <!-- Targeting overlay: row/col selectors for sunset (outside .gameBoard to avoid overflow:hidden clip) -->
    <template v-if="targeting === 'rowOrCol'">
      <button
        v-for="r in rowsCount"
        :key="`row-${r}`"
        class="line-btn line-row"
        :style="{ top: `${(r - 1) * 60 + 14}px` }"
        @click="confirmRowOrCol('row', r - 1)"
      >
        第 {{ r }} 行
      </button>
      <button
        v-for="c in colsCount"
        :key="`col-${c}`"
        class="line-btn line-col"
        :style="{ top: `${(c - 1) * 60 + 14}px` }"
        @click="confirmRowOrCol('col', c - 1)"
      >
        第 {{ c }} 列
      </button>
    </template>

    <div v-if="targeting" class="targeting-hint">
      <p class="ink-title">{{ targetingHint }}</p>
      <button class="cancel-btn" @click="cancelTarget">
        {{ COMMON_COPY.cancel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import BoardTile from './BoardTile.vue'
import BoardEntity from './BoardEntity.vue'
import { audioManager, getItemSFXVol } from '@/audio/AudioManager'
import { COMMON_COPY, TARGETING_COPY } from '@/data/copy'
import EventBus from '@/core/eventBus'
import { getBoard, resetBoard, SEP, HOLE } from '@/core/board'
import { useTileDrag } from '@/composables/useTileDrag'
import { useGameStore } from '@/stores/gameStore'
import { TIMING } from '@/utils/timing'
import { makeGuid } from '@/utils/guid'
import {
  ABILITIES,
  DAYS,
  DJINN_WISHES,
  MONSTER_BY_CHAR,
  MONSTERS,
  RESOURCE_BY_ID,
  RESOURCE_BY_CHAR,
  RESOURCE_CHARS,
  MILK_TEA_IMAGES,
  ROT_CHAR,
  unlockedCharsForDay
} from '@/data/content'

const game = useGameStore()
const ROWS = 8,
  COLS = 8
const TILE_SIZE = 60
const PAD = 4
const BIG_MATCH_BREATH_MS = 480

const charMap = {
  g: 'grape',
  w: 'wood',
  s: 'stone',
  c: 'clay',
  h: 'herb',
  m: 'magic',
  [ROT_CHAR]: 'rot'
}
const typeFromChar = ch => {
  const monster = MONSTER_BY_CHAR[ch]
  if (monster) return `monster-${monster.id}`
  return charMap[ch] ?? 'grape'
}

const board = ref(null)
const tiles = ref([])
const tilePool = []
const selectedId = ref(null)
const shaking = ref(false)
const petals = ref([])
const comboPraise = ref(null)
const hintIds = ref(new Set())
const invalidIds = ref(new Set())
const lastClearedMeta = ref(new Map())
const lastClearSource = ref('match')
const pendingComboAudioLevel = ref(0)
const boardIdle = ref(false)
const boardSyncTimers = []
let comboPraiseTimer = null
const spawnedMonsterIds = new Set()
let hintSoundKey = ''
const awakeningBolts = ref([])
const awakeningSparks = ref([])
let awakeningTimer = null
let awakeningSettleTimer = null
const transitionShards = ref([])
const transitionTraces = ref([])
const transitionFlares = ref([])
const transitionRings = ref([])
const milkTeaFlares = ref([])
const milkTeaSigil = ref(null)
const milkTeaCasting = ref(false)
let milkTeaFlashTimer = null
let milkTeaSweepTimer = null
let milkTeaPulseTimer = null
let milkTeaResolveTimer = null
const milkTeaResult = ref(null)
let milkTeaResultTimer = null
let djinnTransitionTimer = null
let djinnTransitionSettleTimer = null
const xrayScanning = ref(false)
let xrayScanTimer = null
let pigPenaltyShakeTimer = null

const rowsCount = computed(() => ROWS)
const colsCount = computed(() => COLS)
const boardGrowthProgress = computed(() =>
  Math.max(0, Math.min(1, game.repairProgressPct || 0))
)
const boardThemeKey = computed(() => game.today?.building?.id || null)
const boardThemeStyle = computed(() => ({
  '--board-growth-progress': boardGrowthProgress.value.toFixed(3),
  '--board-idle-particle-rate': boardIdle.value ? '8.6s' : '5.8s',
  '--board-theme-hue':
    boardThemeKey.value === 'garden'
      ? 'rgba(182, 140, 204, 0.18)'
      : boardThemeKey.value === 'greenhouse'
        ? 'rgba(118, 168, 126, 0.16)'
        : boardThemeKey.value === 'gazebo'
          ? 'rgba(232, 168, 104, 0.16)'
          : boardThemeKey.value === 'kitchen'
            ? 'rgba(232, 142, 82, 0.16)'
            : boardThemeKey.value === 'lilacSuite'
              ? 'rgba(196, 166, 220, 0.2)'
              : boardThemeKey.value === 'cellar'
                ? 'rgba(182, 126, 72, 0.14)'
                : boardThemeKey.value === 'stables'
                  ? 'rgba(198, 172, 102, 0.14)'
                  : boardThemeKey.value === 'vineyard'
                    ? 'rgba(148, 176, 92, 0.16)'
                    : 'rgba(186, 168, 118, 0.12)'
}))
const selectedTilePos = computed(() => {
  const tile = tiles.value.find(
    item => item.id === selectedId.value && !item.pooled && !item.hidden
  )
  return tile ? { row: tile.row, col: tile.col } : null
})
const visibleRotCells = computed(() => game.rotCells || [])
const djinnMarks = computed(() => {
  if (!game.djinnCeremonyActive) return []
  const stage = game.currentDjinnStageConfig
  if (stage?.layoutId === 'cake' || stage?.layoutId === 'joy') return []
  return (game.djinnMarks || []).map(mark => ({
    ...mark,
    variantClass: 'blight-cell',
    glyph: '🦠'
  }))
})
const showCakeBuild = computed(
  () => game.djinnCeremonyActive && game.djinnLayoutId === 'cake'
)
const showDjinnAwakening = computed(() => game.phase === 'awakening')
const showDjinnTransition = computed(() => game.phase === 'djinnTransition')
const djinnCoreStyle = computed(() => {
  const entity = game.djinnEntity
  if (!entity) return {}
  const width = (entity.width || 1) * TILE_SIZE
  const height = (entity.height || 1) * TILE_SIZE
  const left = entity.col * TILE_SIZE + width / 2
  const top = entity.row * TILE_SIZE + height / 2
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width + 36}px`,
    height: `${height + 36}px`
  }
})
const djinnTransitionVars = computed(() => {
  const palette = game.currentDjinnTransition?.palette || {}
  return {
    '--transition-primary': palette.primary || 'rgba(255, 238, 196, 0.92)',
    '--transition-secondary': palette.secondary || 'rgba(176, 148, 201, 0.88)',
    '--transition-glow': palette.glow || 'rgba(255, 220, 136, 0.96)'
  }
})

const containerStyle = computed(() => ({
  width: `${COLS * TILE_SIZE}px`,
  height: `${ROWS * TILE_SIZE}px`
}))

/* ---------- targeting modal ---------- */

function previewState(t) {
  const p = previewTile.value
  if (!p) return null
  if (t.row !== p.row || t.col !== p.col) return null
  return p.valid ? 'good' : 'bad'
}

function isBlockedCell(row, col) {
  return game.blockedCellKeys.includes(`${row}:${col}`)
}

function entityAt(row, col) {
  return (
    game.activeBoardEntities.find(it => {
      const width = it.width || 1
      const height = it.height || 1
      return (
        row >= it.row &&
        row < it.row + height &&
        col >= it.col &&
        col < it.col + width
      )
    }) ?? null
  )
}

function monsterAt(row, col) {
  return game.monsterAt?.(row, col) || null
}

function flagInvalid(a, b) {
  const ta = tileAt(a.row, a.col)
  const tb = tileAt(b.row, b.col)
  const ids = new Set()
  if (ta) ids.add(ta.id)
  if (tb) ids.add(tb.id)
  invalidIds.value = ids
  setTimeout(() => {
    invalidIds.value = new Set()
  }, 320)
}

const targeting = computed(() => {
  if (game.phase !== 'targeting') return null
  const ab = ABILITIES[game.pendingAbility]
  // 'twoResources' is handled inline by AbilityBar — don't double-render.
  if (
    ab?.needsTarget === 'twoResources' ||
    ab?.needsTarget === 'milkTeaHarvest'
  )
    return null
  return ab?.needsTarget ?? null
})

const targetingHint = computed(() => {
  switch (targeting.value) {
    case 'grape':
      return TARGETING_COPY.short.grape
    case 'rowOrCol':
      return TARGETING_COPY.short.rowOrCol
    case 'twoTiles':
      return TARGETING_COPY.short.twoTiles
    case 'twoResources':
      return TARGETING_COPY.short.twoResources
    default:
      return ''
  }
})

/* ---------- drag handler ---------- */

function tileAt(row, col) {
  return (
    tiles.value.find(
      t => t.row === row && t.col === col && !t.pooled && !t.hidden
    ) ?? null
  )
}

const { activeTile, pickTile, moveDrag, endDrag, clearActive, previewTile } =
  useTileDrag({
    canMove: () => {
      if (!board.value) return false
      if (game.phase !== 'playing') return false
      if (milkTeaCasting.value) return false
      return board.value.canMove()
    },
    onPreview: (a, b) => {
      if (!board.value) return false
      if (isBlockedCell(a.row, a.col) || isBlockedCell(b.row, b.col))
        return false
      return board.value.wouldMatch(a, b)
    },
    onSwap: (a, b) => {
      selectedId.value = null
      if (!game.djinnUnlimitedSteps && game.stepsLeft <= 0) return
      if (
        isBlockedCell(a.row, a.col) ||
        isBlockedCell(b.row, b.col) ||
        monsterAt(a.row, a.col) ||
        monsterAt(b.row, b.col)
      ) {
        flagInvalid(a, b)
        audioManager.playSFX('error', { vol: 0.3 })
        return
      }
      // If the swap won't match, schedule a gentle "nope" tremble before
      // the engine reverts; the engine still consumes a step (matches the
      // gridland-vue feel) but the player gets a soft cue.
      const willMatch = board.value.wouldMatch(a, b)
      if (!willMatch) {
        flagInvalid(a, b)
        const chars = [
          board.value.getTile(a.row, a.col),
          board.value.getTile(b.row, b.col)
        ].filter(Boolean)
        game.pendingInvalidSwapReward = { chars, positions: [a, b] }
        audioManager.playSFX('error', { vol: 0.3 })
      }
      game.consumeStep()
      audioManager.playSFX('swap', { vol: 0.4 })
      board.value.switchTiles(
        { row: a.row, col: a.col },
        { row: b.row, col: b.col }
      )
    }
  })

watch(activeTile, a => {
  if (!a) {
    selectedId.value = null
    return
  }
  game.clearMonsterInfo()
  const t = tileAt(a.row, a.col)
  selectedId.value = t?.id ?? null
})

/* ---------- targeting click handlers ---------- */

const tapBuffer = ref([]) // for twoTiles ability

function onPick(payload, evt) {
  if (milkTeaCasting.value) return
  if (!board.value?.canMove?.()) return
  bumpIdle()
  game.clearMonsterInfo()
  const monster = monsterAt(payload.row, payload.col)
  if (monster) {
    selectedId.value = null
    game.showMonsterInfo(monster.kind, monster.id, 'click')
    const hint = MONSTERS[monster.kind]?.clearRule?.hint
    if (!game.barkLine) {
      game.queueAmbientBark(
        hint || `${MONSTERS[monster.kind]?.name || '怪物'}挡在这里。`
      )
    }
    return
  }
  if (isBlockedCell(payload.row, payload.col)) {
    selectedId.value = null
    const entity = entityAt(payload.row, payload.col)
    if (entity?.kind === 'djinn') {
      game.showMonsterInfo(entity.kind, entity.id, 'click')
      if (game.djinnReady) {
        game.beginDjinnCeremony()
        return
      }
      if (!game.barkLine) {
        game.queueAmbientBark(
          game.djinnSleeping
            ? DJINN_WISHES.sleepLine
            : game.djinnObjectiveSummary?.pressure || '仪式正在进行。'
        )
      }
    } else if (entity) {
      const monster = MONSTERS[entity.kind]
      const hint = monster?.clearRule?.hint
      const remain = Math.max(
        0,
        (entity.hitsRequired || 1) - (entity.hitsTaken || 0)
      )
      game.showMonsterInfo(entity.kind, entity.id, 'click')
      if (!game.barkLine) {
        game.queueAmbientBark(
          hint || monster?.uiPressureShort || `再打 ${remain} 下狸！`
        )
      }
    }
    return
  }
  if (game.djinnReady) {
    game.queueAmbientBark('只差最后一步了狸~点击迪精开始仪式狸！')
    return
  }
  if (game.phase === 'targeting' && game.pendingAbility === 'milkTeaBarrage') {
    return
  }
  if (game.phase === 'targeting') {
    handleTargetingPick(payload)
    return
  }
  pickTile(payload, evt)
}

function handleTargetingPick(pos) {
  const ab = ABILITIES[game.pendingAbility]
  if (!ab) return

  if (ab.needsTarget === 'grape') {
    const t = tileAt(pos.row, pos.col)
    if (!t || t.type !== 'grape') return
    audioManager.playSFX('ability_harvest', { vol: 0.6 })
    board.value.convert3x3(pos.row, pos.col, 'g')
    flashAbility()
    game.consumeAbility(ab.id)
  } else if (ab.needsTarget === 'twoTiles') {
    if (tapBuffer.value.length === 0) {
      tapBuffer.value = [pos]
      const t = tileAt(pos.row, pos.col)
      selectedId.value = t?.id ?? null
    } else {
      const a = tapBuffer.value[0]
      tapBuffer.value = []
      selectedId.value = null
      if (a.row === pos.row && a.col === pos.col) return
      if (
        isBlockedCell(a.row, a.col) ||
        isBlockedCell(pos.row, pos.col) ||
        monsterAt(a.row, a.col) ||
        monsterAt(pos.row, pos.col)
      ) {
        audioManager.playSFX('error', { vol: 0.3 })
        return
      }
      audioManager.playSFX('ability_roach', { vol: 0.6 })
      board.value.swapAny(a, pos)
      flashAbility()
      game.consumeAbility(ab.id)
    }
  } else if (ab.needsTarget === 'milkTeaHarvest') {
    return
  }
}

function confirmRowOrCol(axis, index) {
  const ab = ABILITIES[game.pendingAbility]
  if (!ab) return
  bumpIdle()
  audioManager.playSFX('ability_sunset', { vol: 0.7 })
  audioManager.playSFX('lineclear', { vol: 0.5 })
  triggerSunsetRake('gold', axis, index)
  board.value.clearLine(axis, index)
  game.consumeAbility(ab.id)
}

function cancelTarget() {
  if (_idleTimer) clearTimeout(_idleTimer)
  tapBuffer.value = []
  selectedId.value = null
  hintIds.value = new Set()
  game.clearMonsterInfo()
  game.cancelTarget()
}

function onMonsterHoverEnter({ kind }) {
  // Only visual hover effect — no info popup
  void kind
}

function onMonsterHoverLeave() {
  // Handled by CSS hover — no info to clear
}

function onMonsterInspect({ kind, entityId }) {
  if (!kind) return
  if (kind === 'djinn' && game.djinnReady) {
    game.beginDjinnCeremony()
    return
  }
  game.showMonsterInfo(kind, entityId, 'click')
  if (kind === 'djinn' && game.djinnSleeping && !game.barkLine) {
    game.queueAmbientBark(DJINN_WISHES.sleepLine)
  }
}

/* ---------- exposed for ability bar ---------- */

defineExpose({
  abilityRefresh() {
    bumpIdle()
    audioManager.playSFX('ability_wolf', { vol: 0.6 })
    flashAbility()
    game.rerollBoardEntities?.()
    board.value.refreshBoard('whiteWolfTidy')
  },
  abilityConvertResource(fromId, toId) {
    if (!board.value) return false
    if (!RESOURCE_BY_ID[fromId] || !RESOURCE_BY_ID[toId]) return false
    if (fromId === toId) return false
    bumpIdle()
    audioManager.playSFX('lilac', { vol: 0.7 })
    flashAbility()
    const fromChar = RESOURCE_BY_ID[fromId].char
    const toChar = RESOURCE_BY_ID[toId].char

    // 扫描将被转换的格子，加卡牌翻转动画
    const cells = []
    const blocked = new Set(game.blockedCellKeys || [])
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (blocked.has(`${r}:${c}`)) continue
        const ch = board.value.getTile(r, c)
        if (ch === fromChar) cells.push({ row: r, col: c })
      }
    }

    if (cells.length) {
      const layer = document.querySelector('.tileContainer')
      const FLIP_MS = 520
      const MID_MS = 260 // 翻转中点：glyph 此时不可见，切换资源
      for (let i = 0; i < cells.length; i++) {
        setTimeout(() => {
          const el = layer?.querySelector(
            `[data-tile-pos="${cells[i].row},${cells[i].col}"]`
          )
          if (el) el.classList.add('tile-flip')
        }, i * 22)
      }
      // 延迟到翻转中点执行引擎转换，确保 glyph 在收窄期切换
      setTimeout(() => {
        board.value.convertResource(fromChar, toChar)
      }, MID_MS)
      const totalMs = (cells.length - 1) * 22 + FLIP_MS + 60
      setTimeout(() => {
        for (const c of cells) {
          const el = layer?.querySelector(`[data-tile-pos="${c.row},${c.col}"]`)
          if (el) el.classList.remove('tile-flip')
        }
      }, totalMs)
    } else {
      board.value.convertResource(fromChar, toChar)
    }
    return true
  },
  abilityHarvestResource(resourceId) {
    if (!board.value) return false
    if (!RESOURCE_BY_ID[resourceId]) return false
    if (milkTeaCasting.value) return false
    const char = RESOURCE_BY_ID[resourceId].char
    const hasAny = tiles.value.some(
      tile => !tile.hidden && !tile.pooled && tile.type === resourceId
    )
    if (!hasAny) return false
    bumpIdle()
    milkTeaCasting.value = true
    audioManager.playSFX('decoction', { vol: 0.72 })
    triggerMilkTeaBarrageFx(resourceId)

    // 扫描将被收获的格子，加卡牌翻转动画
    const cells = []
    const blocked = new Set(game.blockedCellKeys || [])
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (blocked.has(`${r}:${c}`)) continue
        const ch = board.value.getTile(r, c)
        if (ch === char) cells.push({ row: r, col: c })
      }
    }

    // 翻转类先行添加
    const layer = document.querySelector('.tileContainer')
    for (let i = 0; i < cells.length; i++) {
      setTimeout(() => {
        const el = layer?.querySelector(
          `[data-tile-pos="${cells[i].row},${cells[i].col}"]`
        )
        if (el) el.classList.add('tile-flip')
      }, i * 20)
    }

    // 保留原版 320ms 延迟执行收获
    if (milkTeaResolveTimer) clearTimeout(milkTeaResolveTimer)
    milkTeaResolveTimer = setTimeout(() => {
      board.value?.harvestResource?.(char)
      milkTeaCasting.value = false
      milkTeaResolveTimer = null
    }, 320)
    return true
  },
  loadDjinnCeremonyBoard() {
    if (!board.value) return
    reloadDjinnBoard()
  }
})

/* ---------- pointer & lifecycle plumbing ---------- */

function onPointerMove(evt) {
  if (game.phase !== 'playing') return
  if (activeTile.value) bumpIdle()
  moveDrag(evt, { rows: ROWS, cols: COLS })
}
function onPointerUp() {
  endDrag()
  bumpIdle()
}

onMounted(() => {
  resetBoard()
  board.value = getBoard({
    rows: ROWS,
    columns: COLS,
    allowedChars: () => unlockedCharsForDay(game.currentDay),
    tileWeights: () => game.boardTileWeights,
    blockedCells: () => game.blockedCellKeys,
    monsterCharAt: (row, col) => game.monsterAt?.(row, col)?.char || null,
    resolveMonsterHits: (clearedTiles, chain, source) =>
      game.resolveBoardEntities(clearedTiles, chain, source)?.removedCells || []
  })
  EventBus.bind('draw', handleDraw)
  EventBus.bind('tilesCleared', onTilesCleared)
  EventBus.bind('tilesSwapped', onTilesSwapped)
  EventBus.bind('noMoreMoves', onNoMoreMoves)
  EventBus.bind('pigPenalty', onPigPenalty)
  EventBus.bind('itemLineSweep', onItemLineSweep)
  EventBus.bind('itemCellsPop', onItemCellsPop)
  EventBus.bind('itemResourceBalance', onItemResourceBalance)
  EventBus.bind('xrayScan', onXrayScan)
  board.value.fill()
  bumpIdle()
})

onBeforeUnmount(() => {
  EventBus.unbind('draw', handleDraw)
  EventBus.unbind('tilesCleared', onTilesCleared)
  EventBus.unbind('tilesSwapped', onTilesSwapped)
  EventBus.unbind('noMoreMoves', onNoMoreMoves)
  EventBus.unbind('pigPenalty', onPigPenalty)
  EventBus.unbind('itemLineSweep', onItemLineSweep)
  EventBus.unbind('itemCellsPop', onItemCellsPop)
  EventBus.unbind('itemResourceBalance', onItemResourceBalance)
  EventBus.unbind('xrayScan', onXrayScan)
  for (const timer of boardSyncTimers) clearTimeout(timer)
  if (comboPraiseTimer) clearTimeout(comboPraiseTimer)
  if (awakeningTimer) clearTimeout(awakeningTimer)
  if (awakeningSettleTimer) clearTimeout(awakeningSettleTimer)
  if (milkTeaFlashTimer) clearTimeout(milkTeaFlashTimer)
  if (milkTeaSweepTimer) clearTimeout(milkTeaSweepTimer)
  if (milkTeaPulseTimer) clearTimeout(milkTeaPulseTimer)
  if (milkTeaResolveTimer) clearTimeout(milkTeaResolveTimer)
  if (milkTeaResultTimer) { clearTimeout(milkTeaResultTimer); milkTeaResultTimer = null }
  if (pigPenaltyShakeTimer) clearTimeout(pigPenaltyShakeTimer)
  if (djinnTransitionTimer) clearTimeout(djinnTransitionTimer)
  if (djinnTransitionSettleTimer) clearTimeout(djinnTransitionSettleTimer)
  if (xrayScanTimer) clearTimeout(xrayScanTimer)
  if (_idleTimer) clearTimeout(_idleTimer)
  resetBoard()
})

/* ---------- new-day refresh on resource unlock ---------- */

const _unlockedSnapshot = ref('')
watch(
  () => game.currentDay,
  () => {
    if (!board.value) return
    const fresh = unlockedCharsForDay(game.currentDay).join('')
    if (fresh !== _unlockedSnapshot.value) {
      _unlockedSnapshot.value = fresh
      // Wait until the board is idle, then sweep + refill so the new
      // resource lands gently amongst the old ones.
      // Full refresh cycle: CLEAR_RETURN + FILL + SWAP_RETURN
      const fillCycleMs =
        TIMING.CLEAR_RETURN_MS +
        (ROWS + COLS) * TIMING.FILL_DELAY_MS +
        TIMING.SWAP_RETURN_MS +
        200
      setTimeout(() => {
        if (board.value && board.value.canMove()) {
          board.value.refreshBoard('newDay')
        }
        // After the fill animation fully settles, run xray if needed
        if (game.xrayNeedsChars?.length) {
          setTimeout(() => {
            onXrayScan({ needsChars: game.xrayNeedsChars })
          }, fillCycleMs)
        }
      }, 80)
    }
  },
  { immediate: true }
)

watch(
  () => game.blockedCellKeys.slice().join('|'),
  () => {
    if (!board.value) return
    if (game.phase === 'wish' || game.djinnBoardStage) return
    setTimeout(() => {
      if (board.value && board.value.canMove())
        board.value.refreshBoard('blockedCells')
    }, 20)
  }
)

watch(
  () => game.djinnLayoutId,
  layoutId => {
    if (!layoutId || !board.value) return
    clearActive()
    selectedId.value = null
    tapBuffer.value = []
    hintIds.value = new Set()
    reloadDjinnBoard()
  }
)

/* ---------- pool & rendering helpers ---------- */

function newTile({ type, row, col }) {
  let t
  if (tilePool.length) {
    t = tilePool.pop()
    t.id = makeGuid()
    t.type = type
    t.row = row
    t.col = col
    t.hidden = false
    t.pooled = true
  } else {
    t = reactive({
      id: makeGuid(),
      type,
      row,
      col,
      hidden: false,
      pooled: true
    })
    tiles.value.push(t)
  }
  if (!tiles.value.includes(t)) tiles.value.push(t)
  return t
}

function poolTile(tile) {
  tile.hidden = true
  setTimeout(() => {
    tile.pooled = true
    tile.row = -ROWS
    tilePool.push(tile)
  }, TIMING.TILE_TRANSFORM_MS)
}

/* ---------- draw event handlers ---------- */

function handleDraw(requestString, options) {
  if (!requestString || requestString.indexOf('.') < 0) return
  const head = requestString.substring(0, requestString.indexOf('.'))
  const tail = requestString.substring(requestString.indexOf('.') + 1)
  if (head !== 'board') return

  let time = 0
  switch (tail) {
    case 'clear':
      time = drawClear(options)
      break
    case 'fill':
      time = drawFill(options)
      break
    case 'swap':
      time = drawSwap(options)
      break
    case 'match':
      time = drawMatch(options)
      break
    case 'convert':
      time = drawConvert(options)
      break
  }
  setTimeout(() => EventBus.trigger('graphicsActionComplete'), time)
}

function drawClear() {
  for (const t of tiles.value) if (!t.pooled && !t.hidden) poolTile(t)
  for (const entity of game.boardEntities) entity.hidden = true
  return TIMING.CLEAR_RETURN_MS
}

function drawFill(tileString) {
  syncMonsterTilesFromEngine()
  const chars = tileString.split('')
  let col = 0,
    row = 0
  const fillTotal = (ROWS + COLS) * TIMING.FILL_DELAY_MS
  const startRow = -ROWS

  while (chars.length) {
    const ch = chars.shift()
    if (ch === SEP) {
      col++
      row = 0
      continue
    }
    if (ch === HOLE) {
      row++
      continue
    }
    const targetRow = row
    const targetCol = col
    const t = newTile({ type: typeFromChar(ch), row: startRow, col })

    const delay =
      TIMING.SWAP_RETURN_MS +
      fillTotal -
      (targetRow + (COLS - targetCol)) * TIMING.FILL_DELAY_MS

    setTimeout(() => {
      t.pooled = false
      requestAnimationFrame(() => {
        t.row = targetRow
        t.col = targetCol
      })
    }, delay)
    row++
  }
  setTimeout(
    () => {
      for (const entity of game.boardEntities) {
        if (!entity.removed) entity.hidden = false
      }
    },
    TIMING.SWAP_RETURN_MS + fillTotal - 80
  )
  scheduleBoardVisualSync(fillTotal + TIMING.SWAP_RETURN_MS)
  return fillTotal + TIMING.SWAP_RETURN_MS
}

function drawSwap(opts) {
  const a = tileAt(opts.pos1.row, opts.pos1.col)
  const b = tileAt(opts.pos2.row, opts.pos2.col)
  if (!a || !b) return TIMING.SWAP_RETURN_MS
  const ar = a.row,
    ac = a.col
  a.row = b.row
  a.col = b.col
  b.row = ar
  b.col = ac
  return TIMING.SWAP_RETURN_MS
}

function drawMatch(opts) {
  lastClearSource.value = opts.lineSweep ? 'lineSweep' : 'match'
  syncMonsterTilesFromEngine()
  const matchMeta = new Map()
  const bigMatchPause =
    opts.groupSizes && opts.groupSizes.some(n => n >= 5)
      ? BIG_MATCH_BREATH_MS
      : 0
  for (const group of opts.matchGroups || []) {
    for (const pos of group.positions || []) {
      matchMeta.set(`${pos.row}:${pos.col}`, {
        groupSize: group.size,
        axis: group.axis,
        char: group.char
      })
    }
  }
  lastClearedMeta.value = matchMeta
  if (opts.removed) {
    for (const r of opts.removed) {
      const { row, col } = r.position
      const t = tileAt(row, col)
      if (t) poolTile(t)
    }
  }

  setTimeout(() => {
    reconcileTilesToBoardState(opts.added || [])
  }, TIMING.MATCH_SHIFT_DELAY_MS + bigMatchPause)
  scheduleBoardVisualSync(TIMING.MATCH_RETURN_MS + bigMatchPause)

  // Petals on big matches
  if (opts.groupSizes && opts.groupSizes.some(n => n >= 5)) {
    sprinklePetals(40)
    EventBus.trigger('sceneBurst', [{ kind: 'petal', count: 14 }])
  } else if (opts.groupSizes && opts.groupSizes.some(n => n >= 4)) {
    sprinklePetals(14)
    EventBus.trigger('sceneBurst', [{ kind: 'gold', count: 8 }])
  }

  return TIMING.MATCH_RETURN_MS + bigMatchPause
}

function drawConvert(opts) {
  syncMonsterTilesFromEngine()
  reconcileTilesToBoardState()
  scheduleBoardVisualSync(TIMING.SWAP_RETURN_MS)
  return TIMING.SWAP_RETURN_MS
}

function syncTilesFromEngine() {
  if (!board.value) return
  const blocked = new Set(game.blockedCellKeys)
  for (const t of tiles.value) {
    if (t.pooled || t.hidden) continue
    if (t.row < 0 || t.row >= ROWS || t.col < 0 || t.col >= COLS) continue
    if (blocked.has(`${t.row}:${t.col}`)) {
      poolTile(t)
      continue
    }
    const ch = board.value.getTile(t.row, t.col)
    if (ch && ch !== HOLE) t.type = typeFromChar(ch)
  }
}

function reconcileTilesToBoardState(addedTiles = []) {
  if (!board.value) return
  let spawnedCount = 0
  let fallingCount = 0
  let maxFallDistance = 0

  const targetMap = new Map()
  const addedLookup = new Map(
    addedTiles.map(tile => [`${tile.row}:${tile.col}`, tile])
  )

  for (let col = 0; col < COLS; col++) {
    const targets = []
    for (let row = 0; row < ROWS; row++) {
      if (isBlockedCell(row, col)) continue
      const ch = board.value.getTile(row, col)
      if (!ch || ch === HOLE) continue
      const target = { row, col, char: ch }
      targets.push(target)
      targetMap.set(`${row}:${col}`, target)
    }

    const survivors = tiles.value
      .filter(tile => tile.col === col && !tile.pooled && !tile.hidden)
      .sort((a, b) => a.row - b.row)

    let survivorIndex = survivors.length - 1

    for (
      let targetIndex = targets.length - 1;
      targetIndex >= 0;
      targetIndex--
    ) {
      const target = targets[targetIndex]
      const added = addedLookup.get(`${target.row}:${target.col}`)
      if (added) {
        spawnedCount++
        const fresh = newTile({
          type: typeFromChar(target.char),
          row: added.row - ROWS,
          col: target.col
        })
        requestAnimationFrame(() => {
          fresh.pooled = false
          requestAnimationFrame(() => {
            fresh.row = target.row
            fresh.col = target.col
          })
        })
        continue
      }

      const tile = survivors[survivorIndex]
      survivorIndex--
      if (!tile) continue
      if (target.row > tile.row) {
        fallingCount++
        maxFallDistance = Math.max(maxFallDistance, target.row - tile.row)
      }
      tile.type = typeFromChar(target.char)
      tile.col = target.col
      tile.row = target.row
    }

    for (let i = 0; i <= survivorIndex; i++) {
      poolTile(survivors[i])
    }
  }

  for (const tile of tiles.value) {
    if (tile.pooled || tile.hidden) continue
    const target = targetMap.get(`${tile.row}:${tile.col}`)
    if (!target) {
      poolTile(tile)
      continue
    }
    tile.type = typeFromChar(target.char)
  }

  if (fallingCount > 0) {
    audioManager.playBoardDrop(fallingCount + Math.max(0, maxFallDistance - 1))
    setTimeout(
      () => {
        audioManager.playSFX('land', {
          vol: Math.min(
            0.22 + Math.max(fallingCount, maxFallDistance) * 0.02,
            0.38
          )
        })
      },
      Math.max(120, TIMING.TILE_FALL_MS - 30)
    )
  }

  if (spawnedCount > 0) {
    audioManager.playSFX('spawn', { vol: 0.2 })
  }
}

function syncMonsterTilesFromEngine() {
  if (!board.value) return
  game.applyMonsterPositionsFromBoard?.(board.value.tileString)
}

function scheduleBoardVisualSync(delayMs) {
  const timer = setTimeout(
    () => {
      const idx = boardSyncTimers.indexOf(timer)
      if (idx >= 0) boardSyncTimers.splice(idx, 1)
      hardSyncTilesFromBoardState()
    },
    Math.max(0, delayMs - 16)
  )
  boardSyncTimers.push(timer)
}

function hardSyncTilesFromBoardState() {
  if (!board.value) return
  const targets = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (isBlockedCell(row, col)) continue
      const ch = board.value.getTile(row, col)
      if (!ch || ch === HOLE) continue
      targets.push({ row, col, char: ch })
    }
  }

  const visibleTiles = tiles.value
    .filter(tile => !tile.pooled && !tile.hidden)
    .sort((a, b) => a.row - b.row || a.col - b.col)

  let index = 0
  for (; index < targets.length; index++) {
    const target = targets[index]
    const tile =
      visibleTiles[index] ||
      newTile({
        type: typeFromChar(target.char),
        row: target.row,
        col: target.col
      })
    tile.hidden = false
    tile.pooled = false
    tile.type = typeFromChar(target.char)
    tile.row = target.row
    tile.col = target.col
  }

  for (; index < visibleTiles.length; index++) {
    poolTile(visibleTiles[index])
  }
}

function reloadDjinnBoard() {
  if (!board.value) return
  const boardString = game.loadDjinnCeremonyBoard?.()
  if (!boardString) {
    board.value.refreshBoard('djinn-layout-missing')
    return
  }
  board.value.setBoardStringAfterClear(boardString, 'djinn-layout-reload')
}

/* ---------- gameplay event handlers ---------- */

function onTilesCleared(
  resourcesByChar,
  _swapSide,
  groupCount,
  groupSizes,
  chain,
  matchGroups
) {
  const safeGroupSizes = groupSizes || []
  const safeChain = chain || 1
  const totalCleared = safeGroupSizes.reduce((sum, size) => sum + size, 0)
  if (totalCleared > 0) audioManager.playMatch(totalCleared)
  const biggest = Math.max(0, ...(safeGroupSizes))
  if (biggest >= 4) audioManager.playMatchPraise(biggest)
  if (safeChain >= 2) {
    pendingComboAudioLevel.value = Math.max(
      pendingComboAudioLevel.value,
      safeChain
    )
  }
  const gained = game.gainResources(
    resourcesByChar,
    groupSizes || [],
    chain || 1,
    matchGroups || []
  )
  if (gained) audioManager.playSFX('resourcegain', { vol: 0.30, bypassThrottle: true })
  game.recordDjinnBoardProgress({
    clearedPositions: collectClearedPositions(),
    groupSizes: groupSizes || [],
    chain: chain || 1,
    matchGroups: matchGroups || []
  })
  showComboPraise(chain || 1, groupSizes || [], matchGroups || [])
  maybePraiseCombo(chain || 1, groupSizes || [])
  syncMonsterTilesFromEngine()
  // Trigger match continues as the engine queues; we only commit
  // 'after-move' once the engine has settled (no callback pending).
  // To detect settlement, we listen for tilesSwapped via lastSwitch === null
  // after the chain. We piggyback a microtask:
  setTimeout(() => maybeCommitTurn(), 60)
}

let _lastSwapSettled = true
function onTilesSwapped(matched) {
  _lastSwapSettled = true
  setTimeout(() => maybeCommitTurn(), 30)
}

function collectClearedPositions() {
  const positions = []
  for (const t of tiles.value) {
    if (t.hidden && !t.pooled && t.row >= 0 && t.col >= 0) {
      const meta = lastClearedMeta.value.get(`${t.row}:${t.col}`) || {}
      positions.push({
        row: t.row,
        col: t.col,
        char: meta.char || null,
        groupSize: meta.groupSize || 0
      })
    }
  }
  return positions
}

function onNoMoreMoves() {
  audioManager.playSFX('boardshuffle', { vol: 0.45 })
  if (game.djinnBoardStage) {
    const boardString = game.loadDjinnCeremonyBoard?.()
    if (boardString && board.value) {
      board.value.setBoardStringAfterClear(boardString, 'djinn-no-moves-reload')
      return
    }
    if (!boardString && board.value) return
  }
  // Visual nudge — no step cost.
  shaking.value = true
  setTimeout(() => {
    shaking.value = false
  }, 400)
  bumpIdle()
}

function maybePraiseCombo(chain, groupSizes) {
  const biggest = Math.max(0, ...(groupSizes || []))
  if (chain >= 5) {
    game.queueAmbientBark('奇迹狸！整个葡萄园都在为你喝彩狸！！')
    return
  }
  if (chain >= 4) {
    game.queueAmbientBark('漂亮狸~连着打下去整个庭院都跟着醒了狸！')
    return
  }
  if (chain === 3) {
    game.queueAmbientBark('很好狸~就照这个势头继续狸！')
    return
  }
  if (chain === 2) {
    if (biggest >= 6) {
      game.queueAmbientBark('太厉害了狸！这么大的连击还是头一回狸！！')
      return
    }
    if (biggest >= 4) {
      game.queueAmbientBark('不错狸~手感找到了狸！')
      return
    }
    game.queueAmbientBark('接上了狸！')
    return
  }
  if (biggest >= 6) {
    game.queueAmbientBark('哇狸！这一下不得了啊狸！！')
    return
  }
  if (biggest >= 5) {
    game.queueAmbientBark('厉害狸！这一下好大狸！')
    return
  }
  if (biggest >= 4) {
    game.queueAmbientBark('哦狸！运气不错狸！')
  }
}

function showComboPraise(chain, groupSizes, matchGroups = []) {
  const biggest = Math.max(0, ...(groupSizes || []))
  const theme = pickPraiseTheme(matchGroups)
  const praise = buildComboPraise(biggest, chain)
  if (!praise) return

  comboPraise.value = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...praise,
    theme
  }

  if (comboPraiseTimer) clearTimeout(comboPraiseTimer)
  comboPraiseTimer = setTimeout(() => {
    comboPraise.value = null
    comboPraiseTimer = null
  }, praise.durationMs)
}

function buildComboPraise(biggest, chain) {
  const chainDepth = Math.max(1, chain || 1)
  const prefixColor =
    chainDepth >= 5
      ? '#d4452a'
      : chainDepth >= 4
        ? '#d47030'
        : chainDepth >= 3
          ? '#b87818'
          : chainDepth >= 2
            ? '#7b4fbf'
            : '#b88620'
  const cascadeBits =
    chainDepth >= 2
      ? {
          prefix: '连击狸！',
          comboText: `${chainDepth} CHAIN`,
          subline:
            chainDepth >= 3
              ? `第 ${chainDepth} 段好狸！`
              : `第 ${chainDepth} 段接上狸！`,
          fireMark: chainDepth >= 3 ? '🔥' : '',
          style: { '--combo-prefix-color': prefixColor },
          chainDepth
        }
      : {
          prefix: '',
          comboText: '',
          subline: '',
          fireMark: '',
          style: { '--combo-prefix-color': prefixColor },
          chainDepth
        }

  if (biggest >= 8) {
    return {
      ...cascadeBits,
      label: '神迹降临狸！！！！',
      tone: 'ultimate',
      giant: true,
      flash: true,
      trailing: true,
      sizeClass: 'size-8',
      durationMs: chainDepth >= 2 ? 3200 : 2800
    }
  }

  if (biggest === 7) {
    return {
      ...cascadeBits,
      label: '不可思议狸！！！',
      tone: 'mythic',
      giant: true,
      flash: true,
      trailing: true,
      sizeClass: 'size-7',
      durationMs: chainDepth >= 2 ? 2900 : 2600
    }
  }

  if (biggest === 6) {
    return {
      ...cascadeBits,
      label: '太棒了狸！！',
      tone: 'legendary',
      giant: true,
      flash: true,
      trailing: true,
      sizeClass: 'size-6',
      durationMs: chainDepth >= 2 ? 2600 : 2400
    }
  }

  if (biggest >= 5) {
    return {
      ...cascadeBits,
      label: '好棒狸！',
      tone: chainDepth >= 2 ? 'inferno' : 'epic',
      giant: true,
      flash: true,
      trailing: true,
      sizeClass: 'size-5',
      durationMs: chainDepth >= 2 ? 2200 : 1850
    }
  }

  if (biggest === 4) {
    return {
      ...cascadeBits,
      label: '不错狸！',
      subline: cascadeBits.subline || '漂亮狸~',
      tone: chainDepth >= 2 ? 'cascade' : 'rare',
      giant: true,
      flash: true,
      trailing: false,
      sizeClass: 'size-4',
      durationMs: chainDepth >= 2 ? 1880 : 1560
    }
  }

  if (biggest === 3) {
    return {
      ...cascadeBits,
      label: '3 连',
      subline: cascadeBits.subline || '刚刚好狸！',
      tone: chainDepth >= 2 ? 'cascade' : 'warm',
      giant: false,
      flash: false,
      trailing: false,
      sizeClass: 'size-3',
      durationMs: chainDepth >= 3 ? 1720 : chainDepth === 2 ? 1460 : 1180
    }
  }

  if (chainDepth >= 2) {
    return {
      ...cascadeBits,
      label: '连击命中狸！',
      tone: chainDepth >= 3 ? 'inferno' : 'cascade',
      giant: chainDepth >= 3,
      flash: chainDepth >= 3,
      trailing: chainDepth >= 3,
      sizeClass: chainDepth >= 3 ? 'size-5' : 'size-4',
      durationMs: chainDepth >= 3 ? 1920 : 1560
    }
  }

  return null
}

function pickPraiseTheme(matchGroups = []) {
  if (!matchGroups.length) return 'theme-gold'
  const primary = [...matchGroups].sort(
    (a, b) => (b.size || 0) - (a.size || 0)
  )[0]
  switch (primary?.char) {
    case 'g':
      return 'theme-grape'
    case 'w':
      return 'theme-wood'
    case 's':
      return 'theme-stone'
    case 'c':
      return 'theme-clay'
    case 'h':
      return 'theme-herb'
    case 'm':
      return 'theme-magic'
    default:
      return 'theme-gold'
  }
}

function maybeCommitTurn() {
  // Wait until the board has nothing pending.
  if (!board.value) return
  if (
    game.phase === 'djinnTransition' ||
    game.phase === 'awakening' ||
    game.phase === 'wish'
  )
    return
  if (!board.value.canMove()) return
  const pressureActions =
    board.value.applyEndTurnMonsterPressure?.(api =>
      game.applyMonsterPressure(api)
    ) || []
  if (pressureActions.length) {
    syncMonsterTilesFromEngine()
    setTimeout(() => maybeCommitTurn(), 60)
    return
  }

  if (pendingComboAudioLevel.value >= 2) {
    audioManager.playCombo(pendingComboAudioLevel.value)
    pendingComboAudioLevel.value = 0
  }

  bumpIdle()
  refreshHints()
  const action = game.onAfterMove()
  if (action === 'complete') {
    EventBus.trigger('repairBegin')
  } else if (action === 'dayEnd') {
    EventBus.trigger('dayEndBegin')
  }
}

/* ---------- hint highlights (lilacReturn passive) ---------- */

let _idleTimer = null
function bumpIdle() {
  boardIdle.value = false
  if (_idleTimer) clearTimeout(_idleTimer)
  hintIds.value = new Set()
  _idleTimer = setTimeout(() => {
    if (game.phase !== 'playing') return
    if (!board.value || !board.value.canMove()) return
    boardIdle.value = true
    if (hintIds.value.size > 0) return // already lit (e.g. lilacReturn)
    refreshHints({ force: true })
  }, 3000)
}

function refreshHints(opts = {}) {
  hintIds.value = new Set()
  hintSoundKey = ''
  if (!opts.force && !game.showHints) return
  if (!board.value) return
  const hint = board.value.findHint()
  if (!hint) return
  const a = tileAt(hint.a.row, hint.a.col)
  const b = tileAt(hint.b.row, hint.b.col)
  const s = new Set()
  if (a) s.add(a.id)
  if (b) s.add(b.id)
  hintIds.value = s
  const nextKey = `${hint.a.row}:${hint.a.col}-${hint.b.row}:${hint.b.col}`
  if (nextKey !== hintSoundKey) {
    hintSoundKey = nextKey
    audioManager.playSFX('hint', { vol: 0.4 })
  }
}

watch(
  () => game.stepsLeft,
  () => {
    refreshHints()
    if (game.phase !== 'playing') return
    if (game.stepsLeft > 5) return
    if (!game.activeMonsterTiles.length) return
    game.queueBark('前面还有怪物挡着。')
  }
)
watch(() => game.unlockedAbilities.length, refreshHints)
watch(
  () => game.phase,
  phase => {
    if (phase !== 'playing') boardIdle.value = false
    if (phase !== 'playing') {
      game.clearMonsterInfo()
    }
    if (phase === 'awakening') {
      startDjinnAwakeningFx()
      return
    }
    if (phase === 'djinnTransition') {
      startDjinnTransitionFx()
      return
    }
    stopDjinnAwakeningFx()
    stopDjinnTransitionFx()
    if (phase !== 'wish') return
    clearActive()
    selectedId.value = null
    tapBuffer.value = []
    hintIds.value = new Set()
  }
)

/* ---------- petal & sunset effects ---------- */

let _petalCounter = 0
function sprinklePetals(count) {
  const w = COLS * TILE_SIZE + PAD * 2
  const fresh = []
  for (let i = 0; i < count; i++) {
    fresh.push({
      id: ++_petalCounter,
      glyph: pickPetal(),
      left: Math.random() * w,
      size: 16 + Math.random() * 14,
      dur: 2.6 + Math.random() * 1.8,
      dx: (Math.random() - 0.5) * 80
    })
  }
  petals.value = [...petals.value, ...fresh]
  setTimeout(() => {
    const ids = new Set(fresh.map(p => p.id))
    petals.value = petals.value.filter(p => !ids.has(p.id))
  }, 4500)
}

function pickPetal() {
  const pool = ['🌸', '🌺', '🪻', '🌿', '🍂', '🪶']
  return pool[Math.floor(Math.random() * pool.length)]
}

function flashAbility() {
  // For the 'ability used' visual glow we just sprinkle a few petals.
  sprinklePetals(8)
  EventBus.trigger('sceneBurst', [{ kind: 'gold', count: 7 }])
}

function onPigPenalty() {
  shaking.value = true
  if (pigPenaltyShakeTimer) clearTimeout(pigPenaltyShakeTimer)
  pigPenaltyShakeTimer = setTimeout(() => {
    shaking.value = false
    pigPenaltyShakeTimer = null
  }, 520)
  EventBus.trigger('sceneBurst', [{ kind: 'gold', count: 8 }])
}

/**
 * itemCellsPop — 道具触发非整行/列的区域/散点操作。
 * payload: { cells?[], count?, pickRandom?, convertToNeed?, variant?, itemId? }
 *  - 有 cells → 直接用
 *  - 有 count + pickRandom → 从棋盘随机抽取非怪物非洞格
 *  - convertToNeed → 每个格子翻成一项随机当前需求资源
 *  - 否则 collapseAt 炸开
 */
function onItemCellsPop(payload = {}) {
  if (!board.value) return
  let cells = Array.isArray(payload.cells)
    ? payload.cells.filter(
        c => typeof c?.row === 'number' && typeof c?.col === 'number'
      )
    : []
  if (!cells.length && payload.pickRandom && (payload.count || 0) > 0) {
    cells = randomValidTileCells(payload.count)
  }
  if (!cells.length) return
  if (payload.convertToNeed) {
    const needs = Object.keys(DAYS[game.currentDay]?.needs || {})
    if (needs.length) {
      animateTileFlip(
        cells,
        () => {
          const ch = needs[Math.floor(Math.random() * needs.length)]
          const resource = RESOURCE_BY_ID[ch]
          return resource ? resource.char : null
        },
        40
      )
    }
  } else {
    const variant = payload.variant || 'treasure-spark'
    flashCellGroup(cells, variant)
    setTimeout(() => {
      if (!board.value) return
      audioManager.playItemEffectSFX(payload.itemId, 0.35)
      board.value.collapseAt(cells)
    }, 500)
  }
}

/**
 * 随机抽取 count 个有效格子（非怪物 char、非洞、非 blocked）。
 */
function randomValidTileCells(count) {
  if (!board.value) return []
  const candidates = []
  const blocked = new Set(game.blockedCellKeys || [])
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (blocked.has(`${r}:${c}`)) continue
      const ch = board.value.getTile(r, c)
      if (!ch || ch === HOLE) continue
      // 排除怪物 char 与 rot
      if (ROT_CHAR_RE.test(ch)) continue
      if (MONSTER_CHAR_RE.test(ch)) continue
      candidates.push({ row: r, col: c })
    }
  }
  // Fisher–Yates shuffle then pick first count
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  return candidates.slice(0, count)
}

const MONSTER_CHAR_RE = /^[A-HJ-NP-Z]$/
const ROT_CHAR_RE = /^r$/ // rot char from content

/**
 * 给一组格子快速闪烁（DOM 临时注入 class-removed-125ms-later）。
 */
function flashCellGroup(cells, variant) {
  const layer = document.querySelector('.tileContainer')
  if (!layer) return
  for (const c of cells) {
    const el = layer.querySelector(`[data-tile-pos="${c.row},${c.col}"]`)
    if (!el) continue
    el.classList.add(`cell-flash`, `cell-flash--${variant}`)
    // Add 💥 explosion overlay for pop variants
    if (variant === 'treasure-spark' || variant === 'devil-spark') {
      const boom = document.createElement('span')
      boom.className = 'cell-boom-overlay'
      boom.textContent = '💥'
      el.appendChild(boom)
      setTimeout(() => {
        boom.remove()
      }, 600)
    }
    setTimeout(() => {
      el.classList.remove(`cell-flash`, `cell-flash--${variant}`)
    }, 440)
  }
}

/**
 * 通用资源翻转动画（卡牌翻面）。
 * 对所有 cell 的 DOM 元素添加 tile-flip 类，在动画中点（约 230ms）切换引擎
 * 与视觉层的 tile 类型，动画完成后移除类。
 *
 * @param {Array<{row:number,col:number}>} cells
 * @param {string|function} target  — 资源 char 字符串（如 'g'），或函数 (row,col) => char
 * @param {number} [staggerMs=30]   — 每个 cell 之间的错开延迟（ms）
 */
function animateTileFlip(cells, target, staggerMs = 30) {
  if (!board.value || !cells.length) return
  const layer = document.querySelector('.tileContainer')
  if (!layer) return
  const FLIP_MS = 520
  const MIDPOINT_MS = 230

  const entries = []
  for (const c of cells) {
    const el = layer.querySelector(`[data-tile-pos="${c.row},${c.col}"]`)
    if (!el) continue
    entries.push({ el, c })
  }
  if (!entries.length) return

  // Phase 1：逐格错开添加 flip 类
  for (let i = 0; i < entries.length; i++) {
    setTimeout(() => {
      entries[i].el.classList.add('tile-flip')
    }, i * staggerMs)
  }

  // Phase 2：中点切资源 + 同步视觉
  for (let i = 0; i < entries.length; i++) {
    const delay = i * staggerMs + MIDPOINT_MS
    setTimeout(() => {
      const { c } = entries[i]
      const ch = typeof target === 'function' ? target(c.row, c.col) : target
      if (ch) board.value.setTile(c.row, c.col, ch)
    }, delay)
  }

  // Phase 3：全部翻转完成后一次性 reconcile 然后移除类
  const totalMs = (entries.length - 1) * staggerMs + FLIP_MS + 50
  setTimeout(() => {
    if (!board.value) return
    reconcileTilesToBoardState()
    for (const { el } of entries) {
      el.classList.remove('tile-flip')
      el.classList.add('tile-converted')
    }
    // Remove conversion glow after animation completes
    setTimeout(() => {
      for (const { el } of entries) {
        el.classList.remove('tile-converted')
      }
    }, 700)
  }, totalMs)

  audioManager.playSFX('pageflip', { vol: 0.35, rate: 1.3 })
}

/**
 * itemResourceBalance — 契约：统计棋盘上所有资源格的数量，
 * 把最少的那个种类全部翻成最多的那个种类。
 */
function onItemResourceBalance(_payload = {}) {
  if (!board.value) return
  const counts = {}
  const cellsByType = {}
  const blocked = new Set(game.blockedCellKeys || [])
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (blocked.has(`${r}:${c}`)) continue
      const ch = board.value.getTile(r, c)
      if (
        !ch ||
        ch === HOLE ||
        MONSTER_CHAR_RE.test(ch) ||
        ROT_CHAR_RE.test(ch)
      )
        continue
      const type = typeFromChar(ch)
      counts[type] = (counts[type] || 0) + 1
      if (!cellsByType[type]) cellsByType[type] = []
      cellsByType[type].push({ row: r, col: c })
    }
  }
  const entries = Object.entries(counts).filter(([, n]) => n > 0)
  if (entries.length < 2) return
  entries.sort((a, b) => a[1] - b[1])
  const leastType = entries[0][0]
  const mostType = entries[entries.length - 1][0]
  if (leastType === mostType) return
  const cells = cellsByType[leastType]
  if (!cells || !cells.length) return

  const targetResource = RESOURCE_BY_ID[mostType]
  if (!targetResource) return

  animateTileFlip(cells, targetResource.char, 25)
  const pactVol = getItemSFXVol('item_r_u_wiz')
  if (pactVol != null) audioManager.playSFX('item_r_u_wiz', { vol: pactVol })
}

function triggerMilkTeaBarrageFx(resourceId) {
  const glyph = RESOURCE_BY_ID[resourceId]?.emoji || '✨'
  milkTeaSigil.value = { glyph, id: resourceId }
  const flares = []
  for (let i = 0; i < 26; i++) {
    flares.push({
      id: `${Date.now()}-${i}`,
      glyph,
      style: {
        left: `${6 + (i % 7) * 13}%`,
        top: `${8 + Math.floor(i / 7) * 15}%`,
        '--dx': `${((i % 7) - 3) * 62}px`,
        '--dy': `${(Math.floor(i / 7) - 1.5) * 42}px`,
        '--delay': `${(i * 0.025).toFixed(2)}s`
      }
    })
  }
  milkTeaFlares.value = flares
  sprinklePetals(18)
  EventBus.trigger('sceneBurst', [
    { kind: 'gold', count: 24 },
    { kind: 'petal', count: 12 }
  ])
  if (milkTeaFlashTimer) clearTimeout(milkTeaFlashTimer)
  if (milkTeaSweepTimer) clearTimeout(milkTeaSweepTimer)
  if (milkTeaPulseTimer) clearTimeout(milkTeaPulseTimer)
  const layer = document.querySelector('.tileContainer')
  if (layer) {
    layer.classList.remove('milk-tea-pulse')
    requestAnimationFrame(() => layer.classList.add('milk-tea-pulse'))
    milkTeaPulseTimer = setTimeout(
      () => layer.classList.remove('milk-tea-pulse'),
      980
    )
  }
  milkTeaFlashTimer = setTimeout(() => {
    if (!layer) return
    const sweep = document.createElement('div')
    sweep.className = 'milk-tea-sweep'
    layer.appendChild(sweep)
    milkTeaSweepTimer = setTimeout(() => sweep.remove(), 1100)
  }, 80)
  setTimeout(() => {
    milkTeaFlares.value = []
    milkTeaSigil.value = null
  }, 1700)

  if (milkTeaResultTimer) clearTimeout(milkTeaResultTimer)
  milkTeaResultTimer = setTimeout(() => {
    milkTeaResult.value = MILK_TEA_IMAGES[resourceId] || null
    milkTeaResultTimer = setTimeout(() => {
      milkTeaResult.value = null
      milkTeaResultTimer = null
    }, 2000)
  }, 1200)
}

function triggerSunsetRake(variant = 'gold', axis = 'row', index = null) {
  // CSS class lifetime handled inline.
  const layer = document.querySelector('.tileContainer')
  if (!layer) return
  const rake = document.createElement('div')
  rake.className = `sunset-rake sunset-rake--axis-${axis} sunset-rake--${variant}`
  // 当传入具体 row/col 时把光束约束到那一行/列；否则保留全板（向后兼容）
  if (Number.isInteger(index)) {
    if (axis === 'row') {
      rake.style.top = `${index * TILE_SIZE}px`
      rake.style.left = '0'
      rake.style.right = '0'
      rake.style.height = `${TILE_SIZE}px`
      rake.style.bottom = 'auto'
    } else {
      rake.style.left = `${index * TILE_SIZE}px`
      rake.style.top = '0'
      rake.style.bottom = '0'
      rake.style.width = `${TILE_SIZE}px`
      rake.style.right = 'auto'
    }
  }
  layer.appendChild(rake)
  setTimeout(() => rake.remove(), 1600)
}

/**
 * 道具触发的整行/整列穿透 — 由 gameStore emit 'itemLineSweep' 进入。
 * 先放出穿透光束动画，等光束抵达中心（约 700ms）再清格——玩家能看见火焰"扫过"，
 * 然后整行/整列被吃掉，节奏比同帧触发更明显。
 */
const ITEM_SWEEP_ARRIVAL_MS = 720
function onItemLineSweep(payload = {}) {
  if (!board.value) return
  const axis = payload.axis === 'col' ? 'col' : 'row'
  const index = Number.isInteger(payload.index) ? payload.index : null
  if (index == null) return
  const variant = payload.variant || 'devil-red'
  audioManager.playItemEffectSFX(payload.itemId, 0.5)
  triggerSunsetRake(variant, axis, index)
  setTimeout(() => {
    if (!board.value) return
    audioManager.playSFX('lineclear', { vol: 0.55 })
    board.value.clearLine(axis, index)
  }, ITEM_SWEEP_ARRIVAL_MS)
}

let _awakeningCounter = 0
function startDjinnAwakeningFx() {
  clearActive()
  selectedId.value = null
  tapBuffer.value = []
  hintIds.value = new Set()
  invalidIds.value = new Set()
  stopDjinnAwakeningFx()
  audioManager.playSFX('djinn_appear', { vol: 0.8 })

  const bolts = []
  const sparks = []
  const entity = game.djinnEntity
  const centerCol = entity ? entity.col + (entity.width || 1) / 2 : COLS / 2
  const centerRow = entity ? entity.row + (entity.height || 1) / 2 : ROWS / 2

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (
        entity &&
        row >= entity.row &&
        row < entity.row + (entity.height || 1) &&
        col >= entity.col &&
        col < entity.col + (entity.width || 1)
      ) {
        continue
      }
      const dx = (centerCol - (col + 0.5)) * TILE_SIZE
      const dy = (centerRow - (row + 0.5)) * TILE_SIZE
      bolts.push({
        id: `bolt-${++_awakeningCounter}`,
        style: {
          left: `${col * TILE_SIZE + TILE_SIZE / 2}px`,
          top: `${row * TILE_SIZE + TILE_SIZE / 2}px`,
          '--dx': `${dx}px`,
          '--dy': `${dy}px`,
          '--delay': `${(row * 0.035 + col * 0.02).toFixed(3)}s`,
          '--dur': `${(0.88 + ((row + col) % 4) * 0.08).toFixed(2)}s`,
          '--rot': `${Math.round((Math.random() - 0.5) * 46)}deg`
        }
      })
    }
  }

  for (let i = 0; i < 18; i++) {
    sparks.push({
      id: `spark-${++_awakeningCounter}`,
      style: {
        left: `${centerCol * TILE_SIZE + (Math.random() - 0.5) * 52}px`,
        top: `${centerRow * TILE_SIZE + (Math.random() - 0.5) * 46}px`,
        '--delay': `${(0.38 + i * 0.03).toFixed(3)}s`,
        '--dur': `${(0.8 + (i % 3) * 0.16).toFixed(2)}s`,
        '--drift-x': `${Math.round((Math.random() - 0.5) * 86)}px`,
        '--drift-y': `${Math.round((Math.random() - 0.5) * 72)}px`
      }
    })
  }

  awakeningBolts.value = bolts
  awakeningSparks.value = sparks
  EventBus.trigger('sceneBurst', [
    { kind: 'gold', count: 18 },
    { kind: 'petal', count: 8 }
  ])
  awakeningTimer = setTimeout(() => {
    game.queueBark(DJINN_WISHES.wakeLine)
    game.finishDjinnWake()
  }, 1650)
  awakeningSettleTimer = setTimeout(() => {
    awakeningBolts.value = []
    awakeningSparks.value = []
  }, 1900)
}

function stopDjinnAwakeningFx() {
  if (awakeningTimer) {
    clearTimeout(awakeningTimer)
    awakeningTimer = null
  }
  if (awakeningSettleTimer) {
    clearTimeout(awakeningSettleTimer)
    awakeningSettleTimer = null
  }
  awakeningBolts.value = []
  awakeningSparks.value = []
}

let _transitionCounter = 0
function startDjinnTransitionFx() {
  clearActive()
  selectedId.value = null
  tapBuffer.value = []
  hintIds.value = new Set()
  invalidIds.value = new Set()
  stopDjinnTransitionFx()

  const transition = game.currentDjinnTransition
  if (!transition) return
  audioManager.playSFX('rune_hit', { vol: 0.6 })

  const sources = transition.sourceCells || []
  const targets = transition.targetCells || []
  const traces = []
  const shards = []
  const flares = []
  const rings = []
  const durationMs = transition.durationMs || 2000

  sources.forEach((cell, index) => {
    const target = targets[index % Math.max(1, targets.length)] || targets[0]
    if (!target) return
    const startX = cell.col * TILE_SIZE + TILE_SIZE / 2
    const startY = cell.row * TILE_SIZE + TILE_SIZE / 2
    const endX = target.col * TILE_SIZE + TILE_SIZE / 2
    const endY = target.row * TILE_SIZE + TILE_SIZE / 2
    const dx = endX - startX
    const dy = endY - startY
    const len = Math.sqrt(dx * dx + dy * dy)
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI
    const delay = (0.18 + index * 0.08).toFixed(3)

    traces.push({
      id: `trace-${++_transitionCounter}`,
      style: {
        left: `${startX}px`,
        top: `${startY}px`,
        width: `${len}px`,
        '--angle': `${angle}deg`,
        '--delay': `${delay}s`
      }
    })

    shards.push({
      id: `shard-${++_transitionCounter}`,
      glyph: transition.id === 'blightToJoy' ? '✦' : '🕯️',
      style: {
        left: `${startX}px`,
        top: `${startY}px`,
        '--dx': `${dx}px`,
        '--dy': `${dy}px`,
        '--delay': `${delay}s`,
        '--dur': `${(1.2 + index * 0.06).toFixed(2)}s`,
        '--curve': `${Math.round((index % 2 === 0 ? 1 : -1) * (28 + index * 4))}px`
      }
    })
  })

  targets.forEach((cell, index) => {
    const centerX = cell.col * TILE_SIZE + TILE_SIZE / 2
    const centerY = cell.row * TILE_SIZE + TILE_SIZE / 2
    flares.push({
      id: `flare-${++_transitionCounter}`,
      glyph: transition.id === 'blightToJoy' ? '🕯️' : '✦',
      style: {
        left: `${centerX}px`,
        top: `${centerY}px`,
        '--delay': `${(1.12 + index * 0.1).toFixed(3)}s`
      }
    })
  })

  if (transition.id === 'joyToCake') {
    ;[96, 136, 176].forEach((size, index) => {
      rings.push({
        id: `ring-${++_transitionCounter}`,
        style: {
          left: `${3.5 * TILE_SIZE + TILE_SIZE / 2}px`,
          top: `${3.5 * TILE_SIZE + TILE_SIZE / 2}px`,
          width: `${size}px`,
          height: `${size}px`,
          '--delay': `${(0.74 + index * 0.16).toFixed(3)}s`
        }
      })
    })
  }

  transitionTraces.value = traces
  transitionShards.value = shards
  transitionFlares.value = flares
  transitionRings.value = rings
  EventBus.trigger('sceneBurst', [{ kind: 'gold', count: 10 }])

  djinnTransitionTimer = setTimeout(() => {
    game.finishDjinnTransition()
  }, durationMs)
  djinnTransitionSettleTimer = setTimeout(() => {
    transitionTraces.value = []
    transitionShards.value = []
    transitionFlares.value = []
    transitionRings.value = []
  }, durationMs + 80)
}

function syncMonsterSpawnAudio() {
  for (const monster of game.activeMonsterTiles) {
    spawnedMonsterIds.add(monster.id)
  }

  for (const entity of game.activeBoardEntities) {
    spawnedMonsterIds.add(entity.id)
  }
}

watch(
  () => [
    game.activeMonsterTiles.map(monster => monster.id).join('|'),
    game.activeBoardEntities
      .map(entity => `${entity.kind}:${entity.id}`)
      .join('|')
  ],
  () => {
    syncMonsterSpawnAudio()
  },
  { immediate: true }
)

watch(
  () => [game.djinnStage, game.djinnState, game.phase],
  ([stage, state, phase], [prevStage, prevState, prevPhase] = []) => {
    if (phase !== 'wish') return
    if (state === prevState && stage === prevStage && phase === prevPhase)
      return
    if (/Resolve$/.test(state)) {
      if (stage === 1) audioManager.playSFX('wish1', { vol: 0.8 })
      else if (stage === 2) audioManager.playSFX('wish2', { vol: 0.8 })
      else if (stage === 3) audioManager.playSFX('wish3', { vol: 0.9 })
      return
    }
    if (/Intro$/.test(state) && stage > 1) {
      audioManager.playSFX('rune_hit', { vol: 0.6 })
    }
  }
)

function stopDjinnTransitionFx() {
  if (djinnTransitionTimer) {
    clearTimeout(djinnTransitionTimer)
    djinnTransitionTimer = null
  }
  if (djinnTransitionSettleTimer) {
    clearTimeout(djinnTransitionSettleTimer)
    djinnTransitionSettleTimer = null
  }
  transitionTraces.value = []
  transitionShards.value = []
  transitionFlares.value = []
  transitionRings.value = []
}

/* ---------- X-Ray Vision scan ---------- */

function onXrayScan(payload = {}) {
  if (!board.value) return
  const needsChars = payload.needsChars || []
  if (!needsChars.length) return

  const see4everVol = getItemSFXVol('item_see_4ever')
  audioManager.playSFX('item_see_4ever', { vol: see4everVol ?? 0.22 })
  xrayScanning.value = true

  // Build reverse type→char map for resource tiles only
  const resourceTypeToChar = {}
  for (const ch of RESOURCE_CHARS) {
    resourceTypeToChar[charMap[ch]] = ch
  }
  const needsSet = new Set(needsChars)

  // Build a lookup of tiles by position so we can update them in-place
  const tileByPos = {}
  for (const tile of tiles.value) {
    if (!tile.pooled && !tile.hidden) {
      tileByPos[`${tile.row}:${tile.col}`] = tile
    }
  }

  // Convert tiles that are NOT in today's building needs
  // into random tiles from today's needs — both in tileString and in-place.
  let converted = 0
  const convertedTiles = []
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const idx = board.value.getIndex(row, col)
      const ch = board.value.tileString.charAt(idx)
      if (ch === HOLE) continue
      const type = charMap[ch]
      if (!type) continue
      const resourceCh = resourceTypeToChar[type]
      if (!resourceCh) continue // monster or rot — leave alone
      if (!needsSet.has(resourceCh)) {
        const newCh = needsChars[Math.floor(Math.random() * needsChars.length)]
        const newType = charMap[newCh]
        board.value.setTile(row, col, newCh)
        // Update the visual tile in-place — no clear+fill needed
        const tile = tileByPos[`${row}:${col}`]
        if (tile) {
          tile.type = newType
        }
        convertedTiles.push(tile)
        converted++
      }
    }
  }

  // Flash converted tiles after the scan line passes
  setTimeout(() => {
    for (const tile of convertedTiles) {
      if (tile) tile.xrayFlash = true
    }
    setTimeout(() => {
      for (const tile of convertedTiles) {
        if (tile) tile.xrayFlash = false
      }
    }, 450)
  }, 600)

  // Let the board check for any matches that may have formed from the conversion.
  // This handles collapsing + refilling naturally via the standard match-3 pipeline.
  // Suppress item effects during xRay auto-matches to prevent cascade overlap.
  if (converted > 0) {
    setTimeout(() => {
      if (board.value && board.value.canMove()) {
        game.suppressItemCascade = true
        board.value.checkMatches()
        // Reset after the checkMatches chain settles (it processes synchronously)
        setTimeout(() => { game.suppressItemCascade = false }, 100)
      }
    }, 800)
  }

  // Clean up the scan overlay
  if (xrayScanTimer) clearTimeout(xrayScanTimer)
  xrayScanTimer = setTimeout(() => {
    xrayScanning.value = false
    xrayScanTimer = null
    game.xrayNeedsChars = null
  }, 1600)
}
</script>

<style scoped>
.board-wrap {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.gameBoard {
  position: relative;
  padding: 10px;
  /* border-radius: var(--radius-xl); */
  transition:
    transform 280ms var(--ease-out-expo),
    filter 280ms var(--ease-out-expo);
  transform-origin: center center;
  /* background:
    linear-gradient(180deg, rgba(255, 248, 235, 0.2) 0%, transparent 12%),
    linear-gradient(160deg, var(--board-frame-1) 0%, var(--board-frame-2) 100%);
  border: 1px solid rgba(200, 178, 148, 0.5);
  box-shadow:
    0 24px 48px rgba(24, 16, 12, 0.28),
    0 6px 14px rgba(24, 16, 12, 0.12),
    inset 0 0 0 1px rgba(255, 245, 218, 0.12),
    inset 0 0 0 5px rgba(114, 93, 66, 0.14); */
}

.gameBoard.idle {
  animation: board-idle-breathe 4s ease-in-out infinite;
}

.gameBoard::before,
.gameBoard::after {
  content: '';
  position: absolute;
  pointer-events: none;
  border-radius: inherit;
}

.gameBoard::before {
  inset: 5px;
  background:
    linear-gradient(
      160deg,
      rgba(255, 248, 235, 0.5),
      rgba(200, 185, 160, 0.55)
    ),
    var(--game-bg, url('/img/background/board_bg_01.webp')) center/cover
      no-repeat;
  box-shadow:
    inset 0 0 0 1px rgba(255, 245, 222, 0.08),
    inset 0 0 0 3px rgba(114, 93, 66, 0.18),
    inset 0 3px 10px rgba(114, 93, 66, 0.1);
}

.gameBoard::after {
  inset: 2px;
  border: 1px solid rgba(242, 218, 172, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 245, 218, 0.06);
}

.gameBoard.shaking {
  animation: gb-shake 100ms 4 alternate var(--ease-out-expo);
}
.gameBoard.dimmed {
  filter: brightness(0.82) saturate(0.92);
}
.gameBoard.repairing[data-theme='vineyard'] {
  box-shadow:
    0 24px 44px rgba(24, 16, 12, 0.28),
    0 0 28px rgba(122, 192, 88, 0.18),
    inset 0 0 0 1px rgba(255, 242, 214, 0.08),
    inset 0 0 0 6px rgba(114, 93, 66, 0.14);
}

@keyframes gb-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes board-idle-breathe {
  0%,
  100% {
    transform: scale(1);
    filter: saturate(1);
  }
  50% {
    transform: scale(1.008);
    filter: saturate(1.04);
  }
}

.tileContainer {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  /* background:
    linear-gradient(90deg, var(--board-grid) 0 1px, transparent 1px 100%),
    linear-gradient(180deg, var(--board-grid) 0 1px, transparent 1px 100%),
      radial-gradient(
        circle at 30% 18%,
        rgba(255, 240, 210, 0.16) 0%,
        transparent 34%
      ),
      radial-gradient(circle at 78% 82%, rgba(160, 140, 110, 0.06) 0%, transparent 40%),
      linear-gradient(160deg, var(--board-cell-2) 0%, var(--board-cell-1) 100%);
  background-size:
    60px 60px,
    60px 60px,
    auto,
    auto,
    auto;
  box-shadow:
    inset 0 0 0 1px rgba(245, 225, 178, 0.1),
    inset 0 16px 24px rgba(255, 232, 190, 0.04),
    inset 0 -16px 22px rgba(114, 93, 66, 0.18),
    inset 0 0 20px rgba(114, 93, 66, 0.08); */
}

.board-idle-aura {
  position: absolute;
  inset: 2px;
  z-index: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 223, 160, 0.06),
    rgba(255, 247, 214, 0.18),
    rgba(255, 223, 160, 0.06)
  );
  mix-blend-mode: screen;
}

.gameBoard.idle .board-idle-aura {
  animation: board-idle-aura 4s ease-in-out infinite;
}

.gameBoard.idle .tileContainer::before {
  animation: board-idle-veil var(--board-idle-particle-rate, 8.6s) ease-in-out
    infinite;
}
/* 
.gameBoard[data-theme='vineyard'] .tileContainer {
  background:
    linear-gradient(
      90deg,
      rgba(148, 176, 92, calc(var(--board-growth-progress) * 0.16)) 0 1px,
      transparent 1px 100%
    ),
    linear-gradient(
      180deg,
      rgba(148, 176, 92, calc(var(--board-growth-progress) * 0.16)) 0 1px,
      transparent 1px 100%
    ),
    radial-gradient(
      circle at 30% 18%,
      rgba(184, 224, 126, calc(var(--board-growth-progress) * 0.16)) 0%,
      transparent 34%
    ),
    linear-gradient(
      160deg,
      rgba(88, 78, 54, 0.98) 0%,
      rgba(
          calc(82 + var(--board-growth-progress) * 20),
          calc(86 + var(--board-growth-progress) * 40),
          calc(48 + var(--board-growth-progress) * 14),
          0.98
        )
        38%,
      rgba(
          calc(62 + var(--board-growth-progress) * 22),
          calc(72 + var(--board-growth-progress) * 48),
          calc(40 + var(--board-growth-progress) * 10),
          0.98
        )
        100%
    );
  background-size:
    60px 60px,
    60px 60px,
    auto,
    auto;
}

.gameBoard[data-theme='courtyard'] .tileContainer {
  background:
    linear-gradient(
      90deg,
      rgba(164, 176, 126, calc(var(--board-growth-progress) * 0.08)) 0 1px,
      transparent 1px 100%
    ),
    linear-gradient(
      180deg,
      rgba(164, 176, 126, calc(var(--board-growth-progress) * 0.08)) 0 1px,
      transparent 1px 100%
    ),
    radial-gradient(
      circle at 22% 22%,
      rgba(154, 168, 122, calc(var(--board-growth-progress) * 0.14)),
      transparent 32%
    ),
    linear-gradient(
      160deg,
      rgba(72, 66, 58, 0.98) 0%,
      rgba(46, 38, 30, 0.98) 100%
    );
  background-size:
    60px 60px,
    60px 60px,
    auto,
    auto;
}

.gameBoard[data-theme='cellar'] .tileContainer {
  background:
    linear-gradient(
      90deg,
      rgba(168, 122, 74, calc(var(--board-growth-progress) * 0.1)) 0 1px,
      transparent 1px 100%
    ),
    linear-gradient(
      180deg,
      rgba(168, 122, 74, calc(var(--board-growth-progress) * 0.1)) 0 1px,
      transparent 1px 100%
    ),
    radial-gradient(
      circle at 18% 20%,
      rgba(196, 144, 88, calc(var(--board-growth-progress) * 0.16)),
      transparent 28%
    ),
    linear-gradient(
      160deg,
      rgba(84, 54, 38, 0.98) 0%,
      rgba(40, 24, 18, 0.98) 100%
    );
  background-size:
    60px 60px,
    60px 60px,
    auto,
    auto;
}

.gameBoard[data-theme='garden'] .tileContainer {
  background:
    linear-gradient(
      90deg,
      rgba(176, 132, 198, calc(var(--board-growth-progress) * 0.12)) 0 1px,
      transparent 1px 100%
    ),
    linear-gradient(
      180deg,
      rgba(176, 132, 198, calc(var(--board-growth-progress) * 0.12)) 0 1px,
      transparent 1px 100%
    ),
    radial-gradient(
      circle at 78% 18%,
      rgba(214, 180, 232, calc(var(--board-growth-progress) * 0.14)),
      transparent 32%
    ),
    linear-gradient(
      160deg,
      rgba(76, 54, 80, 0.98) 0%,
      rgba(42, 28, 50, 0.98) 100%
    );
  background-size:
    60px 60px,
    60px 60px,
    auto,
    auto;
}

.gameBoard[data-theme='gazebo'] .tileContainer {
  background:
    linear-gradient(
      90deg,
      rgba(228, 162, 102, calc(var(--board-growth-progress) * 0.12)) 0 1px,
      transparent 1px 100%
    ),
    linear-gradient(
      180deg,
      rgba(228, 162, 102, calc(var(--board-growth-progress) * 0.12)) 0 1px,
      transparent 1px 100%
    ),
    radial-gradient(
      circle at 26% 14%,
      rgba(255, 208, 144, calc(var(--board-growth-progress) * 0.18)),
      transparent 30%
    ),
    linear-gradient(
      160deg,
      rgba(94, 62, 42, 0.98) 0%,
      rgba(52, 34, 28, 0.98) 100%
    );
  background-size:
    60px 60px,
    60px 60px,
    auto,
    auto;
}

.gameBoard[data-theme='kitchen'] .tileContainer {
  background:
    linear-gradient(
      90deg,
      rgba(220, 128, 72, calc(var(--board-growth-progress) * 0.14)) 0 1px,
      transparent 1px 100%
    ),
    linear-gradient(
      180deg,
      rgba(220, 128, 72, calc(var(--board-growth-progress) * 0.14)) 0 1px,
      transparent 1px 100%
    ),
    radial-gradient(
      circle at 80% 80%,
      rgba(255, 172, 96, calc(var(--board-growth-progress) * 0.2)),
      transparent 32%
    ),
    linear-gradient(
      160deg,
      rgba(88, 52, 34, 0.98) 0%,
      rgba(44, 24, 16, 0.98) 100%
    );
  background-size:
    60px 60px,
    60px 60px,
    auto,
    auto;
}

.gameBoard[data-theme='lilacSuite'] .tileContainer {
  background:
    linear-gradient(
      90deg,
      rgba(196, 166, 220, calc(var(--board-growth-progress) * 0.12)) 0 1px,
      transparent 1px 100%
    ),
    linear-gradient(
      180deg,
      rgba(196, 166, 220, calc(var(--board-growth-progress) * 0.12)) 0 1px,
      transparent 1px 100%
    ),
    radial-gradient(
      circle at 50% 18%,
      rgba(224, 202, 238, calc(var(--board-growth-progress) * 0.16)),
      transparent 34%
    ),
    linear-gradient(
      160deg,
      rgba(78, 60, 92, 0.98) 0%,
      rgba(44, 32, 58, 0.98) 100%
    );
  background-size:
    60px 60px,
    60px 60px,
    auto,
    auto;
} */

@keyframes board-idle-aura {
  0%,
  100% {
    opacity: 0.12;
    filter: brightness(0.96);
  }
  50% {
    opacity: 0.36;
    filter: brightness(1.08);
  }
}

@keyframes board-idle-veil {
  0%,
  100% {
    opacity: 0.46;
    transform: scale(1);
  }
  50% {
    opacity: 0.68;
    transform: scale(1.02);
  }
}

.tileContainer::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 50% 50%,
      var(--board-theme-hue) 0%,
      transparent 54%
    ),
    radial-gradient(
      circle at 50% 50%,
      rgba(198, 164, 102, 0.06) 0%,
      transparent 60%
    ),
    linear-gradient(
      180deg,
      rgba(255, 243, 216, 0.02) 0%,
      rgba(114, 93, 66, 0.06) 100%
    );
  mix-blend-mode: screen;
}

.board-growth {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.growth-veil,
.growth-vine,
.growth-leaf,
.growth-grape,
.growth-mote,
.growth-bloom,
.growth-ray,
.growth-glow {
  position: absolute;
}

.growth-veil {
  inset: 0;
  opacity: calc(var(--board-growth-progress) * 0.78);
  background:
    radial-gradient(circle at 16% 88%, var(--board-theme-hue), transparent 26%),
    radial-gradient(
      circle at 84% 16%,
      rgba(255, 236, 184, 0.12),
      transparent 22%
    ),
    linear-gradient(180deg, rgba(96, 142, 72, 0.04), rgba(76, 132, 54, 0.18));
  transition: opacity 420ms ease;
}

.growth-vine {
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    rgba(88, 130, 64, 0.18),
    rgba(56, 96, 36, 0.42)
  );
  opacity: max(0, calc((var(--board-growth-progress) - 0.08) * 1.1));
  transform-origin: left center;
}

.vine-a {
  left: -8px;
  bottom: 34px;
  width: 176px;
  height: 12px;
  transform: rotate(-8deg)
    scaleX(calc(0.34 + var(--board-growth-progress) * 0.66));
}

.vine-b {
  right: -12px;
  top: 46px;
  width: 188px;
  height: 10px;
  transform: rotate(12deg)
    scaleX(calc(0.18 + var(--board-growth-progress) * 0.82));
  transform-origin: right center;
}

.vine-c {
  left: 138px;
  bottom: -6px;
  width: 130px;
  height: 8px;
  transform: rotate(-62deg)
    scaleX(max(0, calc((var(--board-growth-progress) - 0.44) * 1.75)));
}

.growth-leaf,
.growth-grape {
  z-index: 0;
  transition:
    opacity 360ms ease,
    transform 520ms ease;
}

.growth-leaf {
  font-size: 26px;
  filter: saturate(calc(0.5 + var(--board-growth-progress) * 0.7));
}

.leaf-a {
  left: 28px;
  bottom: 38px;
  opacity: max(0, calc((var(--board-growth-progress) - 0.14) * 1.6));
  transform: scale(calc(0.58 + var(--board-growth-progress) * 0.54))
    rotate(-12deg);
}

.leaf-b {
  right: 52px;
  top: 44px;
  opacity: max(0, calc((var(--board-growth-progress) - 0.3) * 1.55));
  transform: scale(calc(0.54 + var(--board-growth-progress) * 0.58))
    rotate(10deg);
}

.leaf-c {
  left: 208px;
  bottom: 84px;
  opacity: max(0, calc((var(--board-growth-progress) - 0.54) * 1.95));
  transform: scale(calc(0.5 + var(--board-growth-progress) * 0.64))
    rotate(16deg);
}

.growth-grape {
  font-size: 24px;
  filter: saturate(calc(0.34 + var(--board-growth-progress) * 0.72));
}

.growth-mote,
.growth-bloom {
  z-index: 0;
  transition:
    opacity 360ms ease,
    transform 520ms ease;
}

.growth-mote {
  font-size: 18px;
  opacity: max(0, calc((var(--board-growth-progress) - 0.18) * 1.8));
  filter: drop-shadow(0 1px 2px rgba(114, 93, 66, 0.14));
  animation: board-mote-drift 5.8s ease-in-out infinite;
}

.mote-a {
  left: 24px;
  top: 30px;
}
.mote-b {
  right: 34px;
  top: 58px;
}
.mote-c {
  left: 208px;
  bottom: 28px;
}

.growth-bloom {
  font-size: 22px;
  opacity: max(0, calc((var(--board-growth-progress) - 0.26) * 1.7));
  filter: drop-shadow(0 2px 4px rgba(114, 93, 66, 0.14));
  animation: board-mote-drift 6.2s ease-in-out infinite;
}

.gameBoard.idle .growth-mote,
.gameBoard.idle .growth-bloom {
  animation-duration: var(--board-idle-particle-rate, 8.6s);
}

.mote-a,
.bloom-a {
  animation-delay: 0s;
}
.mote-b,
.bloom-b {
  animation-delay: 0.9s;
}
.mote-c,
.bloom-c {
  animation-delay: 1.6s;
}

.bloom-a {
  left: 22px;
  bottom: 30px;
}
.bloom-b {
  right: 42px;
  top: 38px;
}
.bloom-c {
  left: 216px;
  bottom: 84px;
}

.growth-ray {
  z-index: 0;
  width: 180px;
  height: 52px;
  opacity: max(0, calc((var(--board-growth-progress) - 0.2) * 1.5));
  background: linear-gradient(
    135deg,
    rgba(255, 212, 128, 0.18),
    transparent 68%
  );
  filter: blur(1px);
}

.ray-a {
  left: -8px;
  top: 24px;
  transform: rotate(-8deg);
}

.ray-b {
  right: -18px;
  bottom: 18px;
  transform: rotate(12deg);
}

.growth-glow {
  z-index: 0;
  border-radius: 999px;
  opacity: max(0, calc((var(--board-growth-progress) - 0.22) * 1.7));
  background: radial-gradient(
    circle,
    rgba(255, 166, 82, 0.24),
    transparent 68%
  );
}

.ember-a {
  right: 20px;
  bottom: 24px;
  width: 92px;
  height: 72px;
}

.ember-b {
  left: 28px;
  top: 24px;
  width: 66px;
  height: 52px;
}

.grape-a {
  left: 118px;
  bottom: 22px;
  opacity: max(0, calc((var(--board-growth-progress) - 0.48) * 1.8));
  transform: scale(calc(0.46 + var(--board-growth-progress) * 0.56));
}

.grape-b {
  right: 116px;
  top: 54px;
  opacity: max(0, calc((var(--board-growth-progress) - 0.74) * 3.4));
  transform: scale(calc(0.38 + var(--board-growth-progress) * 0.68));
}

.gameBoard.repairing[data-theme='vineyard'] .growth-vine,
.gameBoard.repairing[data-theme='vineyard'] .growth-leaf,
.gameBoard.repairing[data-theme='vineyard'] .growth-grape {
  animation: board-growth-breathe 2.8s ease-in-out infinite;
}

.gameBoard.repairing[data-theme='courtyard'] .growth-mote,
.gameBoard.repairing[data-theme='cellar'] .growth-mote,
.gameBoard.repairing[data-theme='garden'] .growth-bloom,
.gameBoard.repairing[data-theme='gazebo'] .growth-ray,
.gameBoard.repairing[data-theme='kitchen'] .growth-glow,
.gameBoard.repairing[data-theme='kitchen'] .growth-mote,
.gameBoard.repairing[data-theme='lilacSuite'] .growth-bloom {
  animation: board-growth-breathe 2.6s ease-in-out infinite;
}

@keyframes board-growth-breathe {
  0%,
  100% {
    filter: saturate(1) brightness(1);
  }
  50% {
    filter: saturate(1.14) brightness(1.08);
  }
}

@keyframes board-mote-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(0.98);
  }
  50% {
    transform: translate3d(0, -3px, 0) scale(1.04);
  }
}

.entity-slot {
  position: absolute;
  z-index: 1;
  border-radius: 14px;
  background:
    radial-gradient(
      circle at 50% 36%,
      rgba(255, 223, 166, 0.06),
      transparent 44%
    ),
    radial-gradient(circle at 50% 40%, rgba(18, 12, 10, 0.28), transparent 54%),
    linear-gradient(160deg, rgba(24, 16, 12, 0.3) 0%, rgba(12, 8, 6, 0.58) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 238, 204, 0.05),
    inset 0 2px 6px rgba(80, 50, 30, 0.25),
    inset 0 -8px 12px rgba(80, 50, 30, 0.18);
}

.rot-mark,
.seal-cell {
  position: absolute;
  width: 60px;
  height: 60px;
  pointer-events: none;
}

.rot-mark {
  z-index: 2;
  border-radius: 12px;
  background:
    radial-gradient(circle at 50% 60%, rgba(92, 68, 42, 0.48), transparent 52%),
    repeating-linear-gradient(
      135deg,
      rgba(74, 52, 32, 0.36) 0 6px,
      rgba(38, 28, 18, 0.28) 6px 12px
    );
  box-shadow: inset 0 0 0 1px rgba(106, 82, 52, 0.32);
}

.seal-cell {
  z-index: 2;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  animation: none;
}

.seal-glyph {
  font-size: 25px;
  line-height: 1;
  filter: none;
}

.seal-cell.blight-cell {
  background: transparent;
}

.seal-cell.spark-cell {
  border-radius: 18px;
  box-shadow:
    inset 0 0 0 2px rgba(255, 230, 148, 0.76),
    0 0 16px rgba(255, 201, 84, 0.42);
  background:
    radial-gradient(
      circle at 50% 58%,
      rgba(255, 246, 214, 0.38),
      transparent 32%
    ),
    linear-gradient(180deg, rgba(255, 230, 156, 0.2), rgba(255, 190, 96, 0.06));
}

.seal-cell.cleared {
  opacity: 0.14;
  transform: scale(0.82);
  animation: none;
}

/* ───────────────────────────────────────────
   Combo Praise — Animal Island warm parchment badge
   Light cream blob cards with resource-themed accents,
   warm brown text, and 3D parchment shadows.
   Replaces the old dark-badge light-text style.
   ─────────────────────────────────────────── */

.combo-praise {
  position: absolute;
  left: 50%;
  top: 18px;
  z-index: 12;
  min-width: 168px;
  padding: 12px 18px 10px;
  border-radius: 16px;
  text-align: center;
  pointer-events: none;
  transform: translateX(-50%);
  /* Warm parchment base — cream with butter edge */
  background: linear-gradient(180deg, #f9f5ea 0%, #f1e8d4 100%);
  border: 1px solid rgba(180, 150, 110, 0.3);
  box-shadow:
    0 4px 10px rgba(114, 93, 66, 0.18),
    inset 0 1px 0 rgba(255, 252, 245, 0.55);
  --combo-prefix-color: #7b5ea7;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

/* ── Theme tints — resource accent on parchment base ── */
.combo-praise.theme-gold {
  background: linear-gradient(180deg, #fbf6e4 0%, #f3e4c2 100%);
  border-color: rgba(200, 160, 90, 0.38);
}

.combo-praise.theme-grape {
  background: linear-gradient(180deg, #fef3e8 0%, #fde4c8 100%);
  border-color: rgba(245, 163, 82, 0.38);
}

.combo-praise.theme-wood {
  background: linear-gradient(180deg, #faf2e9 0%, #f5e6d3 100%);
  border-color: rgba(212, 165, 116, 0.38);
}

.combo-praise.theme-stone {
  background: linear-gradient(180deg, #f6f5f0 0%, #f0ece2 100%);
  border-color: rgba(180, 180, 170, 0.38);
}

.combo-praise.theme-clay {
  background: linear-gradient(180deg, #fcf0e8 0%, #fce4d6 100%);
  border-color: rgba(232, 180, 160, 0.38);
}

.combo-praise.theme-herb {
  background: linear-gradient(180deg, #fef0f4 0%, #fde8ef 100%);
  border-color: rgba(248, 180, 200, 0.38);
}

.combo-praise.theme-magic {
  background: linear-gradient(180deg, #fef8e0 0%, #fff3c4 100%);
  border-color: rgba(245, 206, 66, 0.45);
  box-shadow:
    0 4px 10px rgba(114, 93, 66, 0.18),
    0 0 14px rgba(240, 210, 120, 0.16),
    inset 0 1px 0 rgba(255, 252, 245, 0.55);
}

/* ── Tone scaling — progressive glow on parchment ── */
.combo-praise.warm {
  border-color: rgba(190, 150, 90, 0.4);
}

.combo-praise.rare {
  border-color: rgba(200, 160, 100, 0.46);
  box-shadow:
    0 4px 12px rgba(114, 93, 66, 0.2),
    0 0 14px rgba(220, 180, 120, 0.18),
    inset 0 1px 0 rgba(255, 252, 245, 0.55);
}

.combo-praise.epic {
  border-color: rgba(220, 180, 110, 0.55);
  border-width: 2px;
  box-shadow:
    0 5px 14px rgba(114, 93, 66, 0.22),
    0 0 22px rgba(240, 200, 130, 0.26),
    inset 0 1px 0 rgba(255, 252, 245, 0.6);
}

.combo-praise.cascade {
  border-color: rgba(155, 115, 230, 0.55);
  border-width: 2px;
  box-shadow:
    0 5px 14px rgba(114, 93, 66, 0.22),
    0 0 20px rgba(160, 120, 230, 0.24),
    inset 0 1px 0 rgba(255, 252, 245, 0.6);
}

.combo-praise.inferno {
  border-color: rgba(245, 130, 70, 0.6);
  border-width: 2px;
  box-shadow:
    0 6px 18px rgba(114, 93, 66, 0.26),
    0 0 26px rgba(245, 145, 80, 0.3),
    0 0 48px rgba(245, 145, 80, 0.12),
    inset 0 1px 0 rgba(255, 252, 245, 0.6);
}

.combo-praise.legendary {
  border-color: rgba(245, 190, 70, 0.7);
  border-width: 2px;
  background: linear-gradient(180deg, #fef7e0 0%, #fde8b0 100%);
  box-shadow:
    0 6px 18px rgba(114, 93, 66, 0.26),
    0 0 30px rgba(245, 195, 80, 0.35),
    0 0 60px rgba(245, 195, 80, 0.15),
    inset 0 1px 0 rgba(255, 252, 245, 0.6);
}

.combo-praise.mythic {
  border-color: rgba(210, 120, 240, 0.65);
  border-width: 2.5px;
  background: linear-gradient(180deg, #fef0fc 0%, #fde0f0 100%);
  box-shadow:
    0 6px 20px rgba(114, 93, 66, 0.28),
    0 0 34px rgba(200, 130, 240, 0.3),
    0 0 60px rgba(200, 130, 240, 0.12),
    inset 0 1px 0 rgba(255, 252, 245, 0.5);
}

.combo-praise.ultimate {
  border-color: rgba(255, 215, 100, 0.8);
  border-width: 3px;
  background: linear-gradient(180deg, #fffae8 0%, #fff0c0 100%);
  box-shadow:
    0 8px 24px rgba(114, 93, 66, 0.3),
    0 0 40px rgba(255, 215, 100, 0.4),
    0 0 80px rgba(255, 215, 100, 0.2),
    0 0 120px rgba(255, 200, 80, 0.08),
    inset 0 1px 0 rgba(255, 252, 245, 0.6);
  animation: combo-ultimate-pulse 1.6s ease-in-out infinite;
}

@keyframes combo-ultimate-pulse {
  0%, 100% {
    box-shadow:
      0 8px 24px rgba(114, 93, 66, 0.3),
      0 0 40px rgba(255, 215, 100, 0.4),
      0 0 80px rgba(255, 215, 100, 0.2),
      0 0 120px rgba(255, 200, 80, 0.08),
      inset 0 1px 0 rgba(255, 252, 245, 0.6);
  }
  50% {
    box-shadow:
      0 8px 24px rgba(114, 93, 66, 0.3),
      0 0 50px rgba(255, 215, 100, 0.5),
      0 0 100px rgba(255, 215, 100, 0.25),
      0 0 150px rgba(255, 200, 80, 0.12),
      inset 0 1px 0 rgba(255, 252, 245, 0.6);
  }
}

/* ── Theme + tone border overrides ── */
.combo-praise.theme-grape.warm,
.combo-praise.theme-grape.rare,
.combo-praise.theme-grape.epic {
  border-color: rgba(245, 163, 82, 0.55);
}

.combo-praise.theme-magic.warm,
.combo-praise.theme-magic.rare,
.combo-praise.theme-magic.epic {
  border-color: rgba(245, 206, 66, 0.6);
}

.combo-praise.theme-herb.warm,
.combo-praise.theme-herb.rare,
.combo-praise.theme-herb.epic {
  border-color: rgba(248, 180, 200, 0.55);
}

/* ── Size scales ── */
.combo-praise.giant {
  top: 30px;
  min-width: 220px;
  padding: 16px 22px 14px;
  border-radius: 20px;
}

.combo-praise.size-3 {
  top: 18px;
  min-width: 154px;
  padding: 10px 16px 9px;
}

.combo-praise.size-4 {
  top: 22px;
}

.combo-praise.size-5 {
  top: 30px;
  min-width: 244px;
  padding: 18px 24px 16px;
}

.combo-praise.size-6 {
  top: 32px;
  min-width: 270px;
  padding: 18px 24px 16px;
}

.combo-praise.size-7 {
  top: 34px;
  min-width: 300px;
  padding: 20px 28px 18px;
}

.combo-praise.size-8 {
  top: 36px;
  min-width: 340px;
  padding: 22px 32px 20px;
}

/* ── Typography — warm brown text hierarchy ── */
.combo-praise-prefix,
.combo-praise-label,
.combo-praise-combo,
.combo-praise-subline {
  margin: 0;
}

.combo-praise-prefix {
  margin-bottom: 2px;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.18em;
  color: var(--combo-prefix-color);
  text-shadow: 0 1px 0 rgba(255, 252, 245, 0.4);
}

.combo-praise-label {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: 0.04em;
  color: #5a3e1a;
  text-shadow:
    0 1px 0 rgba(255, 252, 245, 0.35),
    0 1px 3px rgba(114, 93, 66, 0.1);
}

.combo-praise.size-3 .combo-praise-label {
  font-size: 18px;
  color: #6b4e22;
}

.combo-praise.giant .combo-praise-label {
  font-size: 30px;
  letter-spacing: 0.06em;
}

.combo-praise.size-5 .combo-praise-label {
  font-size: 38px;
  color: #4a2e10;
  text-shadow:
    0 0 10px rgba(240, 200, 120, 0.18),
    0 1px 0 rgba(255, 252, 245, 0.4),
    0 1px 4px rgba(114, 93, 66, 0.14);
}

.combo-praise.size-6 .combo-praise-label {
  font-size: 42px;
  color: #3d2a0c;
  text-shadow:
    0 0 14px rgba(245, 195, 80, 0.28),
    0 1px 0 rgba(255, 252, 245, 0.45),
    0 1px 6px rgba(114, 93, 66, 0.18);
}

.combo-praise.size-7 .combo-praise-label {
  font-size: 48px;
  color: #2e1e08;
  text-shadow:
    0 0 18px rgba(200, 130, 240, 0.22),
    0 0 36px rgba(200, 130, 240, 0.1),
    0 1px 0 rgba(255, 252, 245, 0.5),
    0 1px 8px rgba(114, 93, 66, 0.2);
}

.combo-praise.size-8 .combo-praise-label {
  font-size: 54px;
  color: #1f1406;
  letter-spacing: 0.08em;
  text-shadow:
    0 0 22px rgba(255, 215, 100, 0.35),
    0 0 48px rgba(255, 215, 100, 0.18),
    0 0 72px rgba(255, 215, 100, 0.08),
    0 1px 0 rgba(255, 252, 245, 0.55),
    0 1px 10px rgba(114, 93, 66, 0.22);
}

.combo-praise-combo {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #8a6b34;
}

.combo-praise.chained .combo-praise-combo {
  color: #7b5ea7;
}

.combo-praise-subline {
  margin-top: 4px;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: #9f927d;
  font-weight: 600;
}

.combo-praise-fire {
  display: inline-block;
  filter: drop-shadow(0 0 6px rgba(245, 145, 80, 0.34));
}

/* ── Trailing ember glow (parchment-visible) ── */
.combo-praise.trailing::after {
  content: '';
  position: absolute;
  left: 14%;
  right: 14%;
  bottom: -6px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(220, 160, 80, 0.24) 30%,
    rgba(245, 145, 80, 0.42) 50%,
    rgba(220, 160, 80, 0.24) 70%,
    transparent 100%
  );
  filter: blur(3px);
  animation: combo-tail 1.1s ease-out infinite;
}

@keyframes combo-tail {
  0% {
    opacity: 0;
    transform: scaleX(0.7);
  }
  30% {
    opacity: 0.85;
  }
  100% {
    opacity: 0;
    transform: scaleX(1.08);
  }
}

/* ── Transition — light elastic entrance ── */
.combo-praise-enter-active,
.combo-praise-leave-active {
  transition:
    opacity 240ms ease,
    transform 340ms var(--ease-out-back);
}

.combo-praise-enter-from,
.combo-praise-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px) scale(0.9);
}

/* ── Flash overlay — warm amber on parchment, gentle ── */
.combo-flash {
  position: absolute;
  inset: 0;
  z-index: 11;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 50% 42%,
      rgba(255, 242, 200, 0.28),
      transparent 28%
    ),
    radial-gradient(
      circle at 50% 48%,
      rgba(240, 210, 130, 0.18),
      transparent 54%
    );
  mix-blend-mode: overlay;
}

.combo-flash-enter-active,
.combo-flash-leave-active {
  transition: opacity 280ms ease;
}

.combo-flash-enter-from,
.combo-flash-leave-to {
  opacity: 0;
}

.djinn-awakening {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
  overflow: hidden;
}

.awakening-flash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at 50% 50%,
      rgba(255, 238, 196, 0.18),
      transparent 24%
    ),
    radial-gradient(
      circle at 50% 50%,
      rgba(186, 132, 255, 0.16),
      transparent 54%
    ),
    linear-gradient(180deg, rgba(255, 246, 214, 0.08), rgba(91, 54, 124, 0.16));
  animation: awakening-flash 1.65s ease-out forwards;
}

.awakening-core {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 24px;
  background:
    radial-gradient(
      circle at 50% 50%,
      rgba(255, 244, 214, 0.16),
      transparent 50%
    ),
    radial-gradient(
      circle at 50% 50%,
      rgba(190, 154, 232, 0.22),
      transparent 72%
    );
  box-shadow:
    0 0 42px rgba(240, 213, 107, 0.28),
    0 0 88px rgba(190, 154, 232, 0.2);
  animation: awakening-core 1.65s ease-out forwards;
}

.awakening-bolt,
.awakening-spark {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
}

.awakening-bolt {
  font-size: 26px;
  line-height: 1;
  filter: drop-shadow(0 0 8px rgba(255, 220, 126, 0.42))
    drop-shadow(0 0 18px rgba(190, 154, 232, 0.32));
  animation: awakening-bolt var(--dur) ease-out var(--delay) forwards;
}

.awakening-spark {
  font-size: 18px;
  color: rgba(255, 242, 214, 0.92);
  text-shadow:
    0 0 8px rgba(255, 224, 144, 0.38),
    0 0 18px rgba(190, 154, 232, 0.24);
  opacity: 0;
  animation: awakening-spark var(--dur) ease-out var(--delay) forwards;
}

.djinn-transition {
  position: absolute;
  inset: 0;
  z-index: 9;
  pointer-events: none;
  overflow: hidden;
}

.transition-dim {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at 50% 50%,
      rgba(255, 248, 230, 0.06),
      transparent 32%
    ),
    linear-gradient(180deg, rgba(24, 14, 22, 0.08), rgba(24, 14, 22, 0.26));
  animation: djinn-transition-dim 2s ease-out forwards;
}

.transition-core {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 24px;
  background:
    radial-gradient(
      circle at 50% 50%,
      color-mix(in srgb, var(--transition-glow) 22%, transparent),
      transparent 58%
    ),
    radial-gradient(
      circle at 50% 50%,
      color-mix(in srgb, var(--transition-secondary) 26%, transparent),
      transparent 74%
    );
  box-shadow:
    0 0 28px color-mix(in srgb, var(--transition-glow) 34%, transparent),
    0 0 72px color-mix(in srgb, var(--transition-secondary) 22%, transparent);
  animation: djinn-transition-core 2s ease-out forwards;
}

.transition-trace,
.transition-shard,
.transition-flare,
.transition-ring {
  position: absolute;
}

.transition-trace {
  height: 2px;
  transform-origin: left center;
  transform: translateY(-50%) rotate(var(--angle));
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--transition-secondary) 24%,
    var(--transition-glow) 68%,
    transparent 100%
  );
  box-shadow:
    0 0 10px color-mix(in srgb, var(--transition-secondary) 30%, transparent),
    0 0 18px color-mix(in srgb, var(--transition-glow) 22%, transparent);
  opacity: 0;
  animation: djinn-transition-trace 1.2s ease-out var(--delay) forwards;
}

.transition-shard {
  font-size: 20px;
  line-height: 1;
  transform: translate(-50%, -50%);
  color: var(--transition-glow);
  text-shadow:
    0 0 10px color-mix(in srgb, var(--transition-secondary) 30%, transparent),
    0 0 16px color-mix(in srgb, var(--transition-glow) 24%, transparent);
  opacity: 0;
  animation: djinn-transition-shard var(--dur) ease-out var(--delay) forwards;
}

.transition-flare {
  font-size: 24px;
  line-height: 1;
  transform: translate(-50%, -50%);
  color: var(--transition-glow);
  text-shadow:
    0 0 12px color-mix(in srgb, var(--transition-glow) 42%, transparent),
    0 0 22px color-mix(in srgb, var(--transition-secondary) 28%, transparent);
  opacity: 0;
  animation: djinn-transition-flare 0.7s ease-out var(--delay) forwards;
}

.transition-ring {
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--transition-glow) 48%, transparent);
  box-shadow:
    0 0 18px color-mix(in srgb, var(--transition-glow) 22%, transparent),
    inset 0 0 18px
      color-mix(in srgb, var(--transition-secondary) 12%, transparent);
  opacity: 0;
  animation: djinn-transition-ring 0.9s ease-out var(--delay) forwards;
}

@keyframes awakening-flash {
  0% {
    opacity: 0;
  }
  18% {
    opacity: 1;
  }
  72% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
  }
}

@keyframes awakening-core {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.44);
  }
  28% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.06);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.28);
  }
}

@keyframes awakening-bolt {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--rot)) scale(0.7);
  }
  16% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy)))
      rotate(calc(var(--rot) * 0.4)) scale(1.22);
  }
}

@keyframes awakening-spark {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.6);
  }
  18% {
    opacity: 0.92;
  }
  100% {
    opacity: 0;
    transform: translate(
        calc(-50% + var(--drift-x)),
        calc(-50% + var(--drift-y))
      )
      scale(1.2);
  }
}

@keyframes djinn-transition-dim {
  0% {
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  72% {
    opacity: 0.92;
  }
  100% {
    opacity: 0;
  }
}

@keyframes djinn-transition-core {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.88);
  }
  24% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.02);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.16);
  }
}

@keyframes djinn-transition-trace {
  0% {
    opacity: 0;
    transform: translateY(-50%) rotate(var(--angle)) scaleX(0.12);
  }
  25% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translateY(-50%) rotate(var(--angle)) scaleX(1);
  }
}

@keyframes djinn-transition-shard {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.72);
  }
  18% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(
        calc(-50% + var(--dx)),
        calc(-50% + var(--dy) + var(--curve))
      )
      scale(1.18);
  }
}

@keyframes djinn-transition-flare {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.72);
  }
  45% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.16);
  }
  100% {
    opacity: 0.18;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes djinn-transition-ring {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.74);
  }
  30% {
    opacity: 0.82;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.06);
  }
}

@keyframes seal-pulse {
  0%,
  100% {
    opacity: 0.46;
  }
  50% {
    opacity: 0.82;
  }
}

.milk-tea-layer {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
}

.milk-tea-burst {
  position: absolute;
  inset: 0;
  z-index: 7;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.milk-tea-burst-aura,
.milk-tea-burst-ring,
.milk-tea-burst-core,
.milk-tea-burst-label {
  position: absolute;
}

.milk-tea-burst-aura {
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 240, 190, 0.4),
    rgba(255, 214, 138, 0.12) 52%,
    transparent 74%
  );
  animation: milk-tea-burst-aura 520ms var(--ease-out-expo) forwards;
}

.milk-tea-burst-ring {
  width: 210px;
  height: 210px;
  border-radius: 50%;
  border: 2px solid rgba(255, 225, 156, 0.62);
  box-shadow:
    0 0 22px rgba(255, 214, 138, 0.24),
    inset 0 0 22px rgba(255, 244, 214, 0.18);
  opacity: 0;
}

.milk-tea-burst-ring.ring-a {
  animation: milk-tea-burst-ring 680ms var(--ease-out-expo) forwards;
}

.milk-tea-burst-ring.ring-b {
  width: 150px;
  height: 150px;
  animation: milk-tea-burst-ring 680ms var(--ease-out-expo) 80ms forwards;
}

.milk-tea-burst-core {
  font-size: 58px;
  line-height: 1;
  filter: drop-shadow(0 0 18px rgba(255, 226, 150, 0.42))
    drop-shadow(0 10px 16px rgba(58, 34, 18, 0.14));
  animation: milk-tea-burst-core 560ms cubic-bezier(0.18, 0.9, 0.34, 1.3)
    forwards;
}

.milk-tea-burst-label {
  margin-top: 104px;
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #fff6e8;
  background: linear-gradient(
    180deg,
    rgba(228, 118, 92, 0.94),
    rgba(176, 76, 72, 0.92)
  );
  box-shadow:
    0 10px 18px rgba(78, 30, 22, 0.16),
    inset 0 1px 0 rgba(255, 220, 214, 0.26);
  animation: milk-tea-burst-label 620ms var(--ease-out-expo) forwards;
}

/* ── Milk tea result image overlay ── */
.milk-tea-image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  pointer-events: none;
}

.milk-tea-image-card {
  width: 120px;
  height: 120px;
  border-radius: 24px;
  background: rgb(247, 243, 223);
  border: 3px solid #d4c9b4;
  box-shadow: 0 6px 0 0 #d4c9b4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.milk-tea-image {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.milk-tea-image-label {
  margin-top: 14px;
  padding: 6px 14px;
  border-radius: 50px;
  font-size: 13px;
  font-weight: 700;
  color: #725d42;
  background: rgb(247, 243, 223);
  border: 2px solid #d4c9b4;
  box-shadow: 0 3px 0 0 #d4c9b4;
}

.milk-tea-pop-enter-active {
  animation: milk-tea-bounce-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.milk-tea-pop-leave-active {
  transition: opacity 400ms ease;
}
.milk-tea-pop-leave-to {
  opacity: 0;
}

@keyframes milk-tea-bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(40px);
  }
  60% {
    transform: scale(1.12) translateY(-6px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.tileContainer.milk-tea-pulse::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 50% 50%,
      rgba(255, 239, 178, 0.3),
      transparent 56%
    ),
    linear-gradient(
      135deg,
      rgba(255, 216, 142, 0.08),
      rgba(255, 244, 220, 0.22),
      rgba(255, 216, 142, 0.08)
    );
  animation: milk-tea-pulse 980ms var(--ease-out-expo) forwards;
}

.milk-tea-flare {
  position: absolute;
  font-size: 26px;
  opacity: 0;
  filter: drop-shadow(0 0 12px rgba(255, 220, 136, 0.46))
    drop-shadow(0 0 24px rgba(255, 245, 208, 0.28));
  animation: milk-tea-flare 980ms var(--ease-out-expo) forwards;
  animation-delay: var(--delay);
}

.milk-tea-sweep {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: linear-gradient(
    110deg,
    transparent 10%,
    rgba(255, 214, 154, 0.24) 30%,
    rgba(255, 246, 214, 0.52) 44%,
    rgba(255, 214, 154, 0.24) 58%,
    transparent 82%
  );
  box-shadow:
    inset 0 0 28px rgba(255, 244, 212, 0.12),
    0 0 34px rgba(255, 220, 144, 0.18);
  animation: milk-tea-sweep 1100ms var(--ease-out-expo) forwards;
}

@keyframes milk-tea-flare {
  0% {
    opacity: 0;
    transform: scale(0.4) translate(0, 0);
  }
  24% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.36) translate(var(--dx), var(--dy));
  }
}

@keyframes milk-tea-sweep {
  0% {
    opacity: 0;
    transform: translateX(-120%);
  }
  18% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(120%);
  }
}

@keyframes milk-tea-pulse {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  22% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.04);
  }
}

@keyframes milk-tea-burst-aura {
  0% {
    opacity: 0;
    transform: scale(0.56);
  }
  40% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.18);
  }
}

@keyframes milk-tea-burst-ring {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  26% {
    opacity: 0.88;
  }
  100% {
    opacity: 0;
    transform: scale(1.18);
  }
}

@keyframes milk-tea-burst-core {
  0% {
    opacity: 0;
    transform: scale(0.5) rotate(-10deg);
  }
  60% {
    opacity: 1;
    transform: scale(1.08) rotate(4deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes milk-tea-burst-label {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.88);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.cake-build {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
}

.cake-glow,
.cake-plate,
.cake-base,
.cake-lilac,
.cake-candles {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.cake-glow {
  bottom: 90px;
  width: 240px;
  height: 180px;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    rgba(255, 225, 158, 0.18),
    transparent 70%
  );
}

.cake-plate {
  bottom: 68px;
  font-size: 46px;
  opacity: 0.82;
}

.cake-base {
  bottom: 84px;
  font-size: 72px;
  filter: drop-shadow(0 10px 16px rgba(30, 18, 16, 0.2));
}

.cake-lilac {
  bottom: 140px;
  font-size: 34px;
}

.cake-candles {
  bottom: 172px;
  font-size: 24px;
  letter-spacing: 6px;
  color: #ffe08c;
  text-shadow: 0 0 12px rgba(255, 214, 112, 0.6);
}

.line-btn {
  position: absolute;
  background: linear-gradient(
    180deg,
    rgba(240, 216, 164, 0.96) 0%,
    rgba(185, 137, 72, 0.96) 100%
  );
  color: #2a1a10;
  border-radius: var(--radius-pill);
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 1px solid rgba(86, 54, 24, 0.55);
  z-index: 8;
  cursor: pointer;
  box-shadow:
    0 8px 18px rgba(18, 10, 8, 0.3),
    inset 0 1px 0 rgba(255, 247, 224, 0.55);
  transition:
    transform 160ms var(--ease-out-expo),
    filter 160ms var(--ease-out-expo),
    box-shadow 160ms var(--ease-out-expo);
}
.line-btn:hover {
  filter: brightness(1.08);
  transform: scale(1.04);
  box-shadow:
    0 12px 24px rgba(18, 10, 8, 0.35),
    inset 0 1px 0 rgba(255, 247, 224, 0.6);
}
.line-row {
  left: -84px;
  width: 76px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.line-col {
  right: -84px;
  height: 56px;
  width: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.targeting-hint {
  position: absolute;
  top: 18px;
  right: -272px;
  width: 232px;
  padding: 14px 14px 12px;
  border-radius: 16px;
  text-align: center;
  z-index: 9;
  background: rgb(247, 243, 223);
  border: 2px solid #19c8b9;
  box-shadow: 0 4px 0 0 #50b9ab;
  color: #725d42;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  animation: fade-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.targeting-hint p {
  margin: 0 0 10px;
  font-size: 14px;
  color: #794f27;
  font-weight: 700;
}
.cancel-btn {
  background: #f8f8f0;
  color: #9f927d;
  border-radius: 50px;
  padding: 8px 18px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 2px solid #d4c9b4;
  box-shadow: 0 3px 0 0 #d4c9b4;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}
.cancel-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 0 0 #d4c9b4;
  color: #725d42;
  border-color: #a89878;
}
.cancel-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #d4c9b4;
}

/* ───── X-Ray scan overlay ───── */
.xray-overlay {
  position: absolute;
  inset: 10px;
  pointer-events: none;
  z-index: 20;
  overflow: hidden;
  border-radius: 6px;
}

.xray-scan-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(72, 176, 255, 0.24) 15%,
    rgba(132, 212, 255, 0.65) 48%,
    rgba(132, 212, 255, 0.8) 50%,
    rgba(132, 212, 255, 0.65) 52%,
    rgba(72, 176, 255, 0.24) 85%,
    transparent 100%
  );
  box-shadow:
    0 0 18px rgba(72, 176, 255, 0.55),
    0 0 42px rgba(108, 200, 255, 0.28),
    0 1px 0 rgba(180, 230, 255, 0.5);
  animation: xray-scan-sweep 1.2s cubic-bezier(0.25, 0.1, 0.1, 1) forwards;
  filter: blur(0.5px);
}

.xray-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 0%,
    rgba(72, 160, 255, 0.14) 0%,
    rgba(40, 120, 220, 0.06) 40%,
    transparent 70%
  );
  animation: xray-glow-fade 1.6s ease-out forwards;
}

@keyframes xray-scan-sweep {
  0% {
    top: -6px;
    opacity: 0;
  }
  8% {
    opacity: 1;
  }
  92% {
    opacity: 1;
  }
  100% {
    top: calc(100% + 6px);
    opacity: 0;
  }
}

@keyframes xray-glow-fade {
  0% {
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  70% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
  }
}
</style>
