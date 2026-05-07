<template>
  <div class="board-wrap">
    <div
      class="gameBoard parchment grain"
      :class="{ shaking: shaking, dimmed: targeting }"
      @mouseup="onPointerUp"
      @touchend="onPointerUp"
      @mouseleave="onPointerUp"
      @mousemove="onPointerMove"
      @touchmove="onPointerMove"
    >
      <div class="tileContainer" :style="containerStyle">
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

        <BoardTile
          v-for="t in tiles"
          :key="t.id"
          :tile="t"
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
          >{{ p.glyph }}</span>
        </div>
      </div>

      <!-- Targeting overlay: row/col selectors for sunset ability -->
      <template v-if="targeting === 'rowOrCol'">
        <button
          v-for="r in rowsCount"
          :key="`row-${r}`"
          class="line-btn line-row"
          :style="{ top: `${(r - 1) * 60 + 4}px` }"
          @click="confirmRowOrCol('row', r - 1)"
        >第 {{ r }} 行</button>
        <button
          v-for="c in colsCount"
          :key="`col-${c}`"
          class="line-btn line-col"
          :style="{ left: `${(c - 1) * 60 + 4}px` }"
          @click="confirmRowOrCol('col', c - 1)"
        >第 {{ c }} 列</button>
      </template>
    </div>

    <div v-if="targeting" class="targeting-hint parchment grain">
      <p class="ink-title">{{ targetingHint }}</p>
      <button class="cancel-btn" @click="cancelTarget">取消</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import BoardTile from './BoardTile.vue';
import BoardEntity from './BoardEntity.vue';
import EventBus from '@/core/eventBus';
import { getBoard, resetBoard, SEP, HOLE } from '@/core/board';
import { useTileDrag } from '@/composables/useTileDrag';
import { useGameStore } from '@/stores/gameStore';
import { TIMING } from '@/utils/timing';
import { makeGuid } from '@/utils/guid';
import { ABILITIES, MONSTER_BY_CHAR, MONSTERS, RESOURCE_BY_ID, unlockedCharsForDay } from '@/data/content';

const game = useGameStore();
const ROWS = 8, COLS = 8;
const TILE_SIZE = 60;
const PAD = 4;
const BIG_MATCH_BREATH_MS = 480;

const charMap = { g: 'grape', w: 'wood', s: 'stone', c: 'clay', h: 'herb', m: 'magic' };
const typeFromChar = (ch) => {
  const monster = MONSTER_BY_CHAR[ch];
  if (monster) return `monster-${monster.id}`;
  return charMap[ch] ?? 'grape';
};

const board = ref(null);
const tiles = ref([]);
const tilePool = [];
const selectedId = ref(null);
const shaking = ref(false);
const petals = ref([]);
const hintIds = ref(new Set());
const invalidIds = ref(new Set());
const lastClearedMeta = ref(new Map());
const lastClearSource = ref('match');

const rowsCount = computed(() => ROWS);
const colsCount = computed(() => COLS);

const containerStyle = computed(() => ({
  width:  `${COLS * TILE_SIZE}px`,
  height: `${ROWS * TILE_SIZE}px`
}));

/* ---------- targeting modal ---------- */

function previewState(t) {
  const p = previewTile.value;
  if (!p) return null;
  if (t.row !== p.row || t.col !== p.col) return null;
  return p.valid ? 'good' : 'bad';
}

function isBlockedCell(row, col) {
  return game.blockedCellKeys.includes(`${row}:${col}`);
}

function entityAt(row, col) {
  return game.activeBoardEntities.find((it) => {
    const width = it.width || 1;
    const height = it.height || 1;
    return row >= it.row && row < it.row + height &&
      col >= it.col && col < it.col + width;
  }) ?? null;
}

function monsterAt(row, col) {
  return game.monsterAt?.(row, col) || null;
}

function flagInvalid(a, b) {
  const ta = tileAt(a.row, a.col);
  const tb = tileAt(b.row, b.col);
  const ids = new Set();
  if (ta) ids.add(ta.id);
  if (tb) ids.add(tb.id);
  invalidIds.value = ids;
  setTimeout(() => { invalidIds.value = new Set(); }, 320);
}

const targeting = computed(() => {
  if (game.phase !== 'targeting') return null;
  const ab = ABILITIES[game.pendingAbility];
  // 'twoResources' is handled inline by AbilityBar — don't double-render.
  if (ab?.needsTarget === 'twoResources') return null;
  return ab?.needsTarget ?? null;
});

const targetingHint = computed(() => {
  switch (targeting.value) {
    case 'grape':         return '点选一个 🍇 葡萄方块';
    case 'rowOrCol':      return '点击一整行或一整列消除';
    case 'twoTiles':      return '依次选择任意两个方块交换';
    case 'twoResources':  return '已切换到资源转换模式 — 在右侧面板选择';
    default: return '';
  }
});

/* ---------- drag handler ---------- */

function tileAt(row, col) {
  return tiles.value.find(
    (t) => t.row === row && t.col === col && !t.pooled && !t.hidden
  ) ?? null;
}

const { activeTile, pickTile, moveDrag, endDrag, clearActive, previewTile } = useTileDrag({
  canMove: () => {
    if (!board.value) return false;
    if (game.phase !== 'playing') return false;
    return board.value.canMove();
  },
  onPreview: (a, b) => {
    if (!board.value) return false;
    if (isBlockedCell(a.row, a.col) || isBlockedCell(b.row, b.col)) return false;
    return board.value.wouldMatch(a, b);
  },
  onSwap: (a, b) => {
    selectedId.value = null;
    if (game.stepsLeft <= 0) return;
    if (
      isBlockedCell(a.row, a.col) || isBlockedCell(b.row, b.col) ||
      monsterAt(a.row, a.col) || monsterAt(b.row, b.col)
    ) {
      flagInvalid(a, b);
      return;
    }
    // If the swap won't match, schedule a gentle "nope" tremble before
    // the engine reverts; the engine still consumes a step (matches the
    // gridland-vue feel) but the player gets a soft cue.
    const willMatch = board.value.wouldMatch(a, b);
    if (!willMatch) flagInvalid(a, b);
    game.consumeStep();
    board.value.switchTiles(
      { row: a.row, col: a.col },
      { row: b.row, col: b.col }
    );
  }
});

watch(activeTile, (a) => {
  if (!a) { selectedId.value = null; return; }
  const t = tileAt(a.row, a.col);
  selectedId.value = t?.id ?? null;
});

/* ---------- targeting click handlers ---------- */

const tapBuffer = ref([]);   // for twoTiles ability

function onPick(payload, evt) {
  bumpIdle();
  const monster = monsterAt(payload.row, payload.col);
  if (monster) {
    selectedId.value = null;
    const hint = MONSTERS[monster.kind]?.clearRule?.hint;
    game.queueBark(hint || `${MONSTERS[monster.kind]?.name || '怪物'}挡在这里。`);
    return;
  }
  if (isBlockedCell(payload.row, payload.col)) {
    selectedId.value = null;
    const entity = entityAt(payload.row, payload.col);
    if (entity?.kind === 'djinn') {
      const remain = Math.max(0, game.djinnHitsRequired - game.djinnHitCount);
      game.queueBark(remain > 0 ? `迪精封印还需命中 ${remain} 次。` : '迪精即将解放。');
    } else if (entity) {
      const hint = MONSTERS[entity.kind]?.clearRule?.hint;
      const remain = Math.max(0, (entity.hitsRequired || 1) - (entity.hitsTaken || 0));
      game.queueBark(hint || `还需命中 ${remain} 次。`);
    }
    return;
  }
  if (game.phase === 'targeting') {
    handleTargetingPick(payload);
    return;
  }
  pickTile(payload, evt);
}

function handleTargetingPick(pos) {
  const ab = ABILITIES[game.pendingAbility];
  if (!ab) return;

  if (ab.needsTarget === 'grape') {
    const t = tileAt(pos.row, pos.col);
    if (!t || t.type !== 'grape') return;
    board.value.convert3x3(pos.row, pos.col, 'g');
    flashAbility();
    game.consumeAbility(ab.id);
  } else if (ab.needsTarget === 'twoTiles') {
    if (tapBuffer.value.length === 0) {
      tapBuffer.value = [pos];
      const t = tileAt(pos.row, pos.col);
      selectedId.value = t?.id ?? null;
    } else {
      const a = tapBuffer.value[0];
      tapBuffer.value = [];
      selectedId.value = null;
      if (a.row === pos.row && a.col === pos.col) return;
      if (
        isBlockedCell(a.row, a.col) || isBlockedCell(pos.row, pos.col) ||
        monsterAt(a.row, a.col) || monsterAt(pos.row, pos.col)
      ) return;
      board.value.swapAny(a, pos);
      flashAbility();
      game.consumeAbility(ab.id);
    }
  }
}

function confirmRowOrCol(axis, index) {
  const ab = ABILITIES[game.pendingAbility];
  if (!ab) return;
  bumpIdle();
  triggerSunsetRake();
  board.value.clearLine(axis, index);
  game.consumeAbility(ab.id);
}

function cancelTarget() {
  if (_idleTimer) clearTimeout(_idleTimer);
  tapBuffer.value = [];
  selectedId.value = null;
  hintIds.value = new Set();
  game.cancelTarget();
}

/* ---------- exposed for ability bar ---------- */

defineExpose({
  abilityRefresh() {
    bumpIdle();
    flashAbility();
    game.rerollBoardEntities?.();
    board.value.refreshBoard('whiteWolfTidy');
  },
  abilityConvertResource(fromId, toId) {
    bumpIdle();
    flashAbility();
    const fromChar = RESOURCE_BY_ID[fromId].char;
    const toChar   = RESOURCE_BY_ID[toId].char;
    board.value.convertResource(fromChar, toChar);
  },
  refreshAfterWish() {
    syncTilesFromEngine();
    setTimeout(() => {
      if (board.value?.canMove()) board.value.refreshBoard('wish');
    }, 30);
  },
  releaseWishCells(cells = []) {
    if (!board.value || !cells.length) return;
    board.value.collapseAt(cells);
  }
});

/* ---------- pointer & lifecycle plumbing ---------- */

function onPointerMove(evt) {
  if (game.phase !== 'playing') return;
  if (activeTile.value) bumpIdle();
  moveDrag(evt, { rows: ROWS, cols: COLS });
}
function onPointerUp() {
  endDrag();
  bumpIdle();
}

onMounted(() => {
  resetBoard();
  board.value = getBoard({
    rows: ROWS,
    columns: COLS,
    allowedChars: () => unlockedCharsForDay(game.currentDay),
    blockedCells: () => game.blockedCellKeys,
    monsterCharAt: (row, col) => game.monsterAt?.(row, col)?.char || null,
    resolveMonsterHits: (clearedTiles, chain, source) => game.resolveBoardEntities(clearedTiles, chain, source)?.removedCells || []
  });
  EventBus.bind('draw', handleDraw);
  EventBus.bind('tilesCleared', onTilesCleared);
  EventBus.bind('tilesSwapped', onTilesSwapped);
  EventBus.bind('noMoreMoves', onNoMoreMoves);
  board.value.fill();
});

onBeforeUnmount(() => {
  EventBus.unbind('draw', handleDraw);
  EventBus.unbind('tilesCleared', onTilesCleared);
  EventBus.unbind('tilesSwapped', onTilesSwapped);
  EventBus.unbind('noMoreMoves', onNoMoreMoves);
  if (_idleTimer) clearTimeout(_idleTimer);
  resetBoard();
});

/* ---------- new-day refresh on resource unlock ---------- */

const _unlockedSnapshot = ref('');
watch(
  () => game.currentDay,
  () => {
    if (!board.value) return;
    const fresh = unlockedCharsForDay(game.currentDay).join('');
    if (fresh !== _unlockedSnapshot.value) {
      _unlockedSnapshot.value = fresh;
      // Wait until the board is idle, then sweep + refill so the new
      // resource lands gently amongst the old ones.
      setTimeout(() => {
        if (board.value && board.value.canMove()) {
          board.value.refreshBoard('newDay');
        }
      }, 80);
    }
  },
  { immediate: true }
);

watch(
  () => game.blockedCellKeys.slice().join('|'),
  () => {
    if (!board.value) return;
    if (game.phase === 'wish') return;
    setTimeout(() => {
      if (board.value && board.value.canMove()) board.value.refreshBoard('blockedCells');
    }, 20);
  }
);

/* ---------- pool & rendering helpers ---------- */

function newTile({ type, row, col }) {
  let t;
  if (tilePool.length) {
    t = tilePool.pop();
    t.id = makeGuid();
    t.type = type;
    t.row = row;
    t.col = col;
    t.hidden = false;
    t.pooled = true;
  } else {
    t = reactive({ id: makeGuid(), type, row, col, hidden: false, pooled: true });
    tiles.value.push(t);
  }
  if (!tiles.value.includes(t)) tiles.value.push(t);
  return t;
}

function poolTile(tile) {
  tile.hidden = true;
  setTimeout(() => {
    tile.pooled = true;
    tile.row = -ROWS;
    tilePool.push(tile);
  }, TIMING.TILE_TRANSFORM_MS);
}

/* ---------- draw event handlers ---------- */

function handleDraw(requestString, options) {
  if (!requestString || requestString.indexOf('.') < 0) return;
  const head = requestString.substring(0, requestString.indexOf('.'));
  const tail = requestString.substring(requestString.indexOf('.') + 1);
  if (head !== 'board') return;

  let time = 0;
  switch (tail) {
    case 'clear':   time = drawClear(options);    break;
    case 'fill':    time = drawFill(options);     break;
    case 'swap':    time = drawSwap(options);     break;
    case 'match':   time = drawMatch(options);    break;
    case 'convert': time = drawConvert(options);  break;
  }
  setTimeout(() => EventBus.trigger('graphicsActionComplete'), time);
}

function drawClear() {
  for (const t of tiles.value) if (!t.pooled && !t.hidden) poolTile(t);
  for (const entity of game.boardEntities) entity.hidden = true;
  return TIMING.CLEAR_RETURN_MS;
}

function drawFill(tileString) {
  syncMonsterTilesFromEngine();
  const chars = tileString.split('');
  let col = 0, row = 0;
  const fillTotal = (ROWS + COLS) * TIMING.FILL_DELAY_MS;
  const startRow = -ROWS;

  while (chars.length) {
    const ch = chars.shift();
    if (ch === SEP) { col++; row = 0; continue; }
    if (ch === HOLE) { row++; continue; }
    const targetRow = row;
    const targetCol = col;
    const t = newTile({ type: typeFromChar(ch), row: startRow, col });

    const delay = TIMING.SWAP_RETURN_MS + fillTotal -
      ((targetRow + (COLS - targetCol)) * TIMING.FILL_DELAY_MS);

    setTimeout(() => {
      t.pooled = false;
      requestAnimationFrame(() => {
        t.row = targetRow;
        t.col = targetCol;
      });
    }, delay);
    row++;
  }
  setTimeout(() => {
    for (const entity of game.boardEntities) {
      if (!entity.removed) entity.hidden = false;
    }
  }, TIMING.SWAP_RETURN_MS + fillTotal - 80);
  return fillTotal + TIMING.SWAP_RETURN_MS;
}

function drawSwap(opts) {
  const a = tileAt(opts.pos1.row, opts.pos1.col);
  const b = tileAt(opts.pos2.row, opts.pos2.col);
  if (!a || !b) return TIMING.SWAP_RETURN_MS;
  const ar = a.row, ac = a.col;
  a.row = b.row; a.col = b.col;
  b.row = ar;    b.col = ac;
  return TIMING.SWAP_RETURN_MS;
}

function drawMatch(opts) {
  lastClearSource.value = opts.lineSweep ? 'lineSweep' : 'match';
  syncMonsterTilesFromEngine();
  const removedByCol = {};
  const matchMeta = new Map();
  const bigMatchPause = opts.groupSizes && opts.groupSizes.some((n) => n >= 5)
    ? BIG_MATCH_BREATH_MS
    : 0;
  for (const group of opts.matchGroups || []) {
    for (const pos of group.positions || []) {
      matchMeta.set(`${pos.row}:${pos.col}`, { groupSize: group.size, axis: group.axis, char: group.char });
    }
  }
  lastClearedMeta.value = matchMeta;
  if (opts.removed) {
    for (const r of opts.removed) {
      const { row, col } = r.position;
      const t = tileAt(row, col);
      if (t) poolTile(t);
      (removedByCol[col] ??= new Set()).add(row);
    }
  }

  setTimeout(() => {
    const removedEntityCells = opts.removedEntityCells || [];
    const removedMonsterTiles = opts.removedMonsterTiles || [];
    for (const colKey of Object.keys(removedByCol)) {
      const col = +colKey;
      const removedRows = removedByCol[col];
      const survivors = tiles.value.filter(
        (t) => t.col === col && !t.pooled && !t.hidden
      );
      for (const t of survivors) {
        let drop = 0;
        for (const r of removedRows) if (r > t.row) drop++;
        if (drop > 0) t.row += drop;
      }
    }

    for (const cell of removedMonsterTiles) {
      const t = tileAt(cell.row, cell.col);
      if (t) poolTile(t);
      const survivors = tiles.value.filter(
        (tile) => tile.col === cell.col && !tile.pooled && !tile.hidden && tile.row < cell.row
      );
      for (const tile of survivors) tile.row += 1;
    }

    for (const cell of removedEntityCells) {
      const survivors = tiles.value.filter(
        (t) => t.col === cell.col && !t.pooled && !t.hidden && t.row < cell.row
      );
      for (const t of survivors) t.row += 1;
    }

    if (opts.added) {
      for (const a of opts.added) {
        const t = newTile({ type: typeFromChar(a.char), row: a.row - ROWS, col: a.col });
        requestAnimationFrame(() => {
          t.pooled = false;
          requestAnimationFrame(() => {
            t.row = a.row;
            t.col = a.col;
          });
        });
      }
    }
  }, TIMING.MATCH_SHIFT_DELAY_MS + bigMatchPause);

  // Petals on big matches
  if (opts.groupSizes && opts.groupSizes.some((n) => n >= 5)) {
    sprinklePetals(40);
    EventBus.trigger('sceneBurst', [{ kind: 'petal', count: 14 }]);
  } else if (opts.groupSizes && opts.groupSizes.some((n) => n >= 4)) {
    sprinklePetals(14);
    EventBus.trigger('sceneBurst', [{ kind: 'gold', count: 8 }]);
  }

  return TIMING.MATCH_RETURN_MS + bigMatchPause;
}

function drawConvert(opts) {
  // Tiles we render still need to update char-by-char to mirror the
  // tileString. Refresh the whole grid against the engine's state.
  syncMonsterTilesFromEngine();
  syncTilesFromEngine();
  return TIMING.SWAP_RETURN_MS;
}

function syncTilesFromEngine() {
  if (!board.value) return;
  const blocked = new Set(game.blockedCellKeys);
  for (const t of tiles.value) {
    if (t.pooled || t.hidden) continue;
    if (t.row < 0 || t.row >= ROWS || t.col < 0 || t.col >= COLS) continue;
    if (blocked.has(`${t.row}:${t.col}`)) {
      poolTile(t);
      continue;
    }
    const ch = board.value.getTile(t.row, t.col);
    if (ch && ch !== HOLE) t.type = typeFromChar(ch);
  }
}

function syncMonsterTilesFromEngine() {
  if (!board.value) return;
  game.applyMonsterPositionsFromBoard?.(board.value.tileString);
}

/* ---------- gameplay event handlers ---------- */

function onTilesCleared(resourcesByChar, _swapSide, groupCount, groupSizes, chain) {
  game.gainResources(resourcesByChar, groupSizes || [], chain || 1);
  syncMonsterTilesFromEngine();
  // Trigger match continues as the engine queues; we only commit
  // 'after-move' once the engine has settled (no callback pending).
  // To detect settlement, we listen for tilesSwapped via lastSwitch === null
  // after the chain. We piggyback a microtask:
  setTimeout(() => maybeCommitTurn(), 60);
}

let _lastSwapSettled = true;
function onTilesSwapped(matched) {
  _lastSwapSettled = true;
  setTimeout(() => maybeCommitTurn(), 30);
}

function collectClearedPositions() {
  const positions = [];
  for (const t of tiles.value) {
    if (t.hidden && !t.pooled && t.row >= 0 && t.col >= 0) {
      const meta = lastClearedMeta.value.get(`${t.row}:${t.col}`) || {};
      positions.push({
        row: t.row,
        col: t.col,
        char: meta.char || null,
        groupSize: meta.groupSize || 0
      });
    }
  }
  return positions;
}

function onNoMoreMoves() {
  // Visual nudge — no step cost.
  shaking.value = true;
  setTimeout(() => { shaking.value = false; }, 400);
  bumpIdle();
}

function maybeCommitTurn() {
  // Wait until the board has nothing pending.
  if (!board.value) return;
  if (!board.value.canMove()) return;
  bumpIdle();
  refreshHints();
  const action = game.onAfterMove();
  if (action === 'complete') {
    EventBus.trigger('repairBegin');
  } else if (action === 'dayEnd') {
    EventBus.trigger('dayEndBegin');
  }
}

/* ---------- hint highlights (lilacReturn passive) ---------- */

let _idleTimer = null;
function bumpIdle() {
  if (_idleTimer) clearTimeout(_idleTimer);
  hintIds.value = new Set();
  _idleTimer = setTimeout(() => {
    if (game.phase !== 'playing') return;
    if (!board.value || !board.value.canMove()) return;
    if (hintIds.value.size > 0) return;       // already lit (e.g. lilacReturn)
    refreshHints({ force: true });
  }, 8000);
}

function refreshHints(opts = {}) {
  hintIds.value = new Set();
  if (!opts.force && !game.showHints) return;
  if (!board.value) return;
  const hint = board.value.findHint();
  if (!hint) return;
  const a = tileAt(hint.a.row, hint.a.col);
  const b = tileAt(hint.b.row, hint.b.col);
  const s = new Set();
  if (a) s.add(a.id);
  if (b) s.add(b.id);
  hintIds.value = s;
}

watch(() => game.stepsLeft, () => {
  refreshHints();
  if (game.phase !== 'playing') return;
  if (game.stepsLeft > 5) return;
  if (!game.activeMonsterTiles.some((monster) => monster.kind === 'nekkers')) return;
  game.queueBark('那只孽鬼还在。');
});
watch(() => game.unlockedAbilities.length, refreshHints);
watch(() => game.phase, (phase) => {
  if (phase !== 'wish') return;
  clearActive();
  selectedId.value = null;
  tapBuffer.value = [];
  hintIds.value = new Set();
});

/* ---------- petal & sunset effects ---------- */

let _petalCounter = 0;
function sprinklePetals(count) {
  const w = COLS * TILE_SIZE + PAD * 2;
  const fresh = [];
  for (let i = 0; i < count; i++) {
    fresh.push({
      id: ++_petalCounter,
      glyph: pickPetal(),
      left: Math.random() * w,
      size: 16 + Math.random() * 14,
      dur: 2.6 + Math.random() * 1.8,
      dx: (Math.random() - 0.5) * 80
    });
  }
  petals.value = [...petals.value, ...fresh];
  setTimeout(() => {
    const ids = new Set(fresh.map((p) => p.id));
    petals.value = petals.value.filter((p) => !ids.has(p.id));
  }, 4500);
}

function pickPetal() {
  const pool = ['🌸', '🌺', '🪻', '🌿', '🍂', '🪶'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function flashAbility() {
  // For the 'ability used' visual glow we just sprinkle a few petals.
  sprinklePetals(8);
  EventBus.trigger('sceneBurst', [{ kind: 'gold', count: 7 }]);
}

function triggerSunsetRake() {
  // CSS class lifetime handled inline.
  const layer = document.querySelector('.tileContainer');
  if (!layer) return;
  const rake = document.createElement('div');
  rake.className = 'sunset-rake';
  layer.appendChild(rake);
  setTimeout(() => rake.remove(), 800);
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
  padding: 4px;
  border-radius: 8px;
  transition: transform 200ms ease, filter 200ms ease;
  background: linear-gradient(180deg, var(--paper) 0%, var(--paper-2) 100%);
  border: 2px solid var(--gold);
  box-shadow: var(--hud-shadow), inset 0 0 0 2px rgba(255, 255, 255, 0.4);
}

.gameBoard.shaking { animation: gb-shake 100ms 4 alternate; }
.gameBoard.dimmed  { filter: brightness(0.85); }

@keyframes gb-shake {
  from { transform: translateX(-4px); }
  to   { transform: translateX(4px); }
}

.tileContainer {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 240, 200, 0.4) 0%, transparent 60%),
    linear-gradient(160deg, #5a4427 0%, #2c1d10 100%);
}

.entity-slot {
  position: absolute;
  z-index: 1;
  border-radius: 12px;
  background:
    radial-gradient(circle at 50% 40%, rgba(18, 12, 10, 0.22), transparent 54%),
    linear-gradient(160deg, rgba(24, 16, 12, 0.32) 0%, rgba(12, 8, 6, 0.52) 100%);
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.28),
    inset 0 -8px 12px rgba(0, 0, 0, 0.18);
}

.line-btn {
  position: absolute;
  background: rgba(208, 168, 87, 0.85);
  color: var(--ink);
  border-radius: 14px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid var(--gold);
  z-index: 8;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(58, 42, 31, 0.4);
}
.line-btn:hover {
  background: rgba(212, 168, 87, 1);
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
  bottom: -42px;
  height: 32px;
  width: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 2px;
}

.targeting-hint {
  position: absolute;
  top: 12px;
  right: -260px;
  width: 220px;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  z-index: 9;
}
.targeting-hint p { margin: 0 0 8px; font-size: 14px; }
.cancel-btn {
  background: var(--ink);
  color: var(--paper);
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 12px;
}
</style>
