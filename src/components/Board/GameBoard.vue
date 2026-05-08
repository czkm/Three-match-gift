<template>
  <div class="board-wrap">
    <div
      class="gameBoard parchment grain"
      :class="{ shaking: shaking, dimmed: targeting, repairing: game.phase === 'repairing', 'day2-growth': boardGrowthTheme === 'vineyard' }"
      :style="boardThemeStyle"
      @mouseup="onPointerUp"
      @touchend="onPointerUp"
      @mouseleave="onPointerUp"
      @mousemove="onPointerMove"
      @touchmove="onPointerMove"
    >
      <div class="tileContainer" :style="containerStyle">
        <div v-if="boardGrowthTheme === 'vineyard'" class="board-growth board-growth-vineyard">
          <span class="growth-veil" />
          <span class="growth-vine vine-a" />
          <span class="growth-vine vine-b" />
          <span class="growth-vine vine-c" />
          <span class="growth-leaf leaf-a">🌿</span>
          <span class="growth-leaf leaf-b">🍃</span>
          <span class="growth-leaf leaf-c">🌿</span>
          <span class="growth-grape grape-a">🍇</span>
          <span class="growth-grape grape-b">🍇</span>
        </div>

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
          v-for="cell in djinnSealCells"
          :key="`seal-${cell.row}-${cell.col}-${cell.stage}`"
          class="seal-cell"
          :class="`stage-${cell.stage + 1}`"
          :style="{ transform: `translate3d(${cell.col * TILE_SIZE}px, ${cell.row * TILE_SIZE}px, 0)` }"
        />

        <span
          v-for="cell in visibleRotCells"
          :key="`rot-${cell.ownerId}-${cell.row}-${cell.col}`"
          class="rot-mark"
          :style="{ transform: `translate3d(${cell.col * TILE_SIZE}px, ${cell.row * TILE_SIZE}px, 0)` }"
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
import { ABILITIES, MONSTER_BY_CHAR, MONSTERS, RESOURCE_BY_ID, ROT_CHAR, unlockedCharsForDay } from '@/data/content';

const game = useGameStore();
const ROWS = 8, COLS = 8;
const TILE_SIZE = 60;
const PAD = 4;
const BIG_MATCH_BREATH_MS = 480;

const charMap = { g: 'grape', w: 'wood', s: 'stone', c: 'clay', h: 'herb', m: 'magic', [ROT_CHAR]: 'rot' };
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
const boardGrowthProgress = computed(() => Math.max(0, Math.min(1, game.repairProgressPct || 0)));
const boardGrowthTheme = computed(() => {
  if (game.today?.building?.id !== 'vineyard') return null;
  if (!game.isComplete) return 'vineyard';
  if (game.phase === 'repairing') return 'vineyard';
  return null;
});
const boardThemeStyle = computed(() => ({
  '--board-growth-progress': boardGrowthProgress.value.toFixed(3)
}));
const selectedTilePos = computed(() => {
  const tile = tiles.value.find((item) => item.id === selectedId.value && !item.pooled && !item.hidden);
  return tile ? { row: tile.row, col: tile.col } : null;
});
const visibleRotCells = computed(() => game.rotCells || []);
const djinnSealCells = computed(() => {
  const entity = game.djinnEntity;
  if (!entity) return [];
  const stage = entity.hitsTaken || 0;
  const cells = [];
  const top = entity.row - 1;
  const left = entity.col - 1;
  const bottom = entity.row + (entity.height || 2);
  const right = entity.col + (entity.width || 2);
  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      const inside = row >= entity.row && row < entity.row + (entity.height || 2) && col >= entity.col && col < entity.col + (entity.width || 2);
      if (inside || row < 0 || row >= ROWS || col < 0 || col >= COLS) continue;
      if (stage === 1 && col !== entity.col - 1 && col !== entity.col + (entity.width || 2)) continue;
      cells.push({ row, col, stage });
    }
  }
  return cells;
});

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
  game.clearMonsterInfo();
  const t = tileAt(a.row, a.col);
  selectedId.value = t?.id ?? null;
});

/* ---------- targeting click handlers ---------- */

const tapBuffer = ref([]);   // for twoTiles ability

function onPick(payload, evt) {
  bumpIdle();
  game.clearMonsterInfo();
  const monster = monsterAt(payload.row, payload.col);
  if (monster) {
    selectedId.value = null;
    game.showMonsterInfo(monster.kind, monster.id, 'click');
    const hint = MONSTERS[monster.kind]?.clearRule?.hint;
    if (!game.barkLine) {
      game.queueAmbientBark(hint || `${MONSTERS[monster.kind]?.name || '怪物'}挡在这里。`);
    }
    return;
  }
  if (isBlockedCell(payload.row, payload.col)) {
    selectedId.value = null;
    const entity = entityAt(payload.row, payload.col);
    if (entity?.kind === 'djinn') {
      game.showMonsterInfo(entity.kind, entity.id, 'click');
      const remain = Math.max(0, game.djinnHitsRequired - game.djinnHitCount);
      if (!game.barkLine) {
        game.queueAmbientBark(remain > 0 ? `迪精封印还需命中 ${remain} 次。` : '迪精即将解放。');
      }
    } else if (entity) {
      const hint = MONSTERS[entity.kind]?.clearRule?.hint;
      const remain = Math.max(0, (entity.hitsRequired || 1) - (entity.hitsTaken || 0));
      game.showMonsterInfo(entity.kind, entity.id, 'click');
      if (!game.barkLine) {
        game.queueAmbientBark(hint || `还需命中 ${remain} 次。`);
      }
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
  game.clearMonsterInfo();
  game.cancelTarget();
}

function onMonsterHoverEnter({ kind, entityId }) {
  if (!kind) return;
  game.showMonsterInfo(kind, entityId, 'hover');
}

function onMonsterHoverLeave({ entityId }) {
  if (game.inspectedMonster?.source === 'hover' && (!entityId || game.inspectedMonster.entityId === entityId)) {
    game.clearMonsterInfo('hover');
  }
}

function onMonsterInspect({ kind, entityId }) {
  if (!kind) return;
  game.showMonsterInfo(kind, entityId, 'click');
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
  maybePraiseCombo(chain || 1, groupSizes || []);
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

function maybePraiseCombo(chain, groupSizes) {
  if (chain >= 4) {
    game.queueAmbientBark('漂亮。连着打下去，整个庭院都跟着醒了。');
    return;
  }
  if (chain === 3) {
    game.queueAmbientBark('很好。就照这个势头继续。');
    return;
  }
  if (chain === 2 && groupSizes.some((size) => size >= 4)) {
    game.queueAmbientBark('不错。手感找到了。');
  }
}

function maybeCommitTurn() {
  // Wait until the board has nothing pending.
  if (!board.value) return;
  if (!board.value.canMove()) return;
  const pressureActions = board.value.applyEndTurnMonsterPressure?.((api) => game.applyMonsterPressure(api)) || [];
  if (pressureActions.length) {
    syncMonsterTilesFromEngine();
    setTimeout(() => maybeCommitTurn(), 60);
    return;
  }
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
  if (phase !== 'playing') {
    game.clearMonsterInfo();
  }
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
  padding: 10px;
  border-radius: 18px;
  transition: transform 200ms ease, filter 200ms ease;
  background:
    linear-gradient(180deg, rgba(255, 245, 220, 0.18) 0%, transparent 12%),
    linear-gradient(145deg, var(--board-frame-1) 0%, var(--board-frame-2) 100%);
  border: 1px solid rgba(220, 184, 122, 0.42);
  box-shadow:
    0 24px 44px rgba(14, 8, 6, 0.42),
    inset 0 0 0 1px rgba(255, 242, 214, 0.08),
    inset 0 0 0 6px rgba(18, 10, 7, 0.28);
}

.gameBoard::before,
.gameBoard::after {
  content: "";
  position: absolute;
  pointer-events: none;
  border-radius: inherit;
}

.gameBoard::before {
  inset: 5px;
  background:
    linear-gradient(145deg, rgba(255, 240, 214, 0.08), rgba(0, 0, 0, 0.08)),
    linear-gradient(145deg, var(--board-inner-1) 0%, var(--board-inner-2) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 240, 214, 0.08),
    inset 0 0 0 3px rgba(22, 14, 10, 0.28);
}

.gameBoard::after {
  inset: 2px;
  border: 1px solid rgba(242, 214, 164, 0.14);
}

.gameBoard.shaking { animation: gb-shake 100ms 4 alternate; }
.gameBoard.dimmed  { filter: brightness(0.82) saturate(0.92); }
.gameBoard.repairing.day2-growth {
  box-shadow:
    0 24px 44px rgba(14, 8, 6, 0.42),
    0 0 28px rgba(122, 192, 88, 0.18),
    inset 0 0 0 1px rgba(255, 242, 214, 0.08),
    inset 0 0 0 6px rgba(18, 10, 7, 0.28);
}

@keyframes gb-shake {
  from { transform: translateX(-4px); }
  to   { transform: translateX(4px); }
}

.tileContainer {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background:
    linear-gradient(90deg, var(--board-grid) 0 1px, transparent 1px 100%),
    linear-gradient(180deg, var(--board-grid) 0 1px, transparent 1px 100%),
    radial-gradient(circle at 30% 18%, rgba(255, 226, 166, 0.1) 0%, transparent 34%),
    linear-gradient(160deg, var(--board-cell-2) 0%, var(--board-cell-1) 100%);
  background-size: 60px 60px, 60px 60px, auto, auto;
  box-shadow:
    inset 0 0 0 1px rgba(243, 218, 168, 0.1),
    inset 0 18px 28px rgba(255, 228, 182, 0.04),
    inset 0 -18px 26px rgba(0, 0, 0, 0.28);
}

.gameBoard.day2-growth .tileContainer {
  background:
    linear-gradient(90deg, rgba(148, 176, 92, calc(var(--board-growth-progress) * 0.16)) 0 1px, transparent 1px 100%),
    linear-gradient(180deg, rgba(148, 176, 92, calc(var(--board-growth-progress) * 0.16)) 0 1px, transparent 1px 100%),
    radial-gradient(circle at 30% 18%, rgba(184, 224, 126, calc(var(--board-growth-progress) * 0.16)) 0%, transparent 34%),
    linear-gradient(
      160deg,
      rgba(88, 78, 54, 0.98) 0%,
      rgba(calc(82 + var(--board-growth-progress) * 20), calc(86 + var(--board-growth-progress) * 40), calc(48 + var(--board-growth-progress) * 14), 0.98) 38%,
      rgba(calc(62 + var(--board-growth-progress) * 22), calc(72 + var(--board-growth-progress) * 48), calc(40 + var(--board-growth-progress) * 10), 0.98) 100%
    );
  background-size: 60px 60px, 60px 60px, auto, auto;
}

.tileContainer::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 50%, rgba(198, 164, 102, 0.06) 0%, transparent 60%),
    linear-gradient(180deg, rgba(255, 243, 216, 0.02) 0%, rgba(0, 0, 0, 0.08) 100%);
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
.growth-grape {
  position: absolute;
}

.growth-veil {
  inset: 0;
  opacity: calc(var(--board-growth-progress) * 0.78);
  background:
    radial-gradient(circle at 16% 88%, rgba(98, 142, 72, 0.5), transparent 26%),
    radial-gradient(circle at 84% 16%, rgba(156, 204, 118, 0.24), transparent 22%),
    linear-gradient(180deg, rgba(96, 142, 72, 0.04), rgba(76, 132, 54, 0.18));
  transition: opacity 420ms ease;
}

.growth-vine {
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(88, 130, 64, 0.18), rgba(56, 96, 36, 0.42));
  opacity: max(0, calc((var(--board-growth-progress) - 0.08) * 1.1));
  transform-origin: left center;
}

.vine-a {
  left: -8px;
  bottom: 34px;
  width: 176px;
  height: 12px;
  transform: rotate(-8deg) scaleX(calc(0.34 + var(--board-growth-progress) * 0.66));
}

.vine-b {
  right: -12px;
  top: 46px;
  width: 188px;
  height: 10px;
  transform: rotate(12deg) scaleX(calc(0.18 + var(--board-growth-progress) * 0.82));
  transform-origin: right center;
}

.vine-c {
  left: 138px;
  bottom: -6px;
  width: 130px;
  height: 8px;
  transform: rotate(-62deg) scaleX(max(0, calc((var(--board-growth-progress) - 0.44) * 1.75)));
}

.growth-leaf,
.growth-grape {
  z-index: 0;
  transition: opacity 360ms ease, transform 520ms ease;
}

.growth-leaf {
  font-size: 26px;
  filter: saturate(calc(0.5 + var(--board-growth-progress) * 0.7));
}

.leaf-a {
  left: 28px;
  bottom: 38px;
  opacity: max(0, calc((var(--board-growth-progress) - 0.14) * 1.6));
  transform: scale(calc(0.58 + var(--board-growth-progress) * 0.54)) rotate(-12deg);
}

.leaf-b {
  right: 52px;
  top: 44px;
  opacity: max(0, calc((var(--board-growth-progress) - 0.3) * 1.55));
  transform: scale(calc(0.54 + var(--board-growth-progress) * 0.58)) rotate(10deg);
}

.leaf-c {
  left: 208px;
  bottom: 84px;
  opacity: max(0, calc((var(--board-growth-progress) - 0.54) * 1.95));
  transform: scale(calc(0.5 + var(--board-growth-progress) * 0.64)) rotate(16deg);
}

.growth-grape {
  font-size: 24px;
  filter: saturate(calc(0.34 + var(--board-growth-progress) * 0.72));
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

.gameBoard.repairing.day2-growth .growth-vine,
.gameBoard.repairing.day2-growth .growth-leaf,
.gameBoard.repairing.day2-growth .growth-grape {
  animation: board-growth-breathe 2.8s ease-in-out infinite;
}

@keyframes board-growth-breathe {
  0%, 100% { filter: saturate(1) brightness(1); }
  50% { filter: saturate(1.14) brightness(1.08); }
}

.entity-slot {
  position: absolute;
  z-index: 1;
  border-radius: 14px;
  background:
    radial-gradient(circle at 50% 36%, rgba(255, 223, 166, 0.06), transparent 44%),
    radial-gradient(circle at 50% 40%, rgba(18, 12, 10, 0.28), transparent 54%),
    linear-gradient(160deg, rgba(24, 16, 12, 0.3) 0%, rgba(12, 8, 6, 0.58) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 238, 204, 0.05),
    inset 0 2px 6px rgba(0, 0, 0, 0.3),
    inset 0 -8px 12px rgba(0, 0, 0, 0.22);
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
    repeating-linear-gradient(135deg, rgba(74, 52, 32, 0.36) 0 6px, rgba(38, 28, 18, 0.28) 6px 12px);
  box-shadow: inset 0 0 0 1px rgba(106, 82, 52, 0.32);
}

.seal-cell {
  z-index: 2;
  border-radius: 14px;
  box-shadow: inset 0 0 0 2px rgba(238, 204, 118, 0.55), 0 0 16px rgba(236, 190, 92, 0.28);
  animation: seal-pulse 1.2s ease-in-out infinite;
}

.seal-cell.stage-2 {
  box-shadow: inset 0 0 0 2px rgba(120, 190, 238, 0.62), 0 0 16px rgba(92, 172, 236, 0.32);
}

.seal-cell.stage-3 {
  box-shadow: inset 0 0 0 2px rgba(206, 154, 255, 0.68), 0 0 18px rgba(182, 120, 255, 0.38);
}

@keyframes seal-pulse {
  0%, 100% { opacity: 0.46; }
  50% { opacity: 0.82; }
}

.line-btn {
  position: absolute;
  background:
    linear-gradient(180deg, rgba(240, 216, 164, 0.94) 0%, rgba(185, 137, 72, 0.94) 100%);
  color: #2a1a10;
  border-radius: 16px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid rgba(86, 54, 24, 0.55);
  z-index: 8;
  cursor: pointer;
  box-shadow:
    0 8px 18px rgba(18, 10, 8, 0.28),
    inset 0 1px 0 rgba(255, 247, 224, 0.52);
}
.line-btn:hover {
  filter: brightness(1.06);
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
  top: 18px;
  right: -272px;
  width: 232px;
  padding: 14px 14px 12px;
  border-radius: 12px;
  text-align: center;
  z-index: 9;
  box-shadow: var(--surface-shadow);
}
.targeting-hint p { margin: 0 0 8px; font-size: 14px; }
.cancel-btn {
  background: linear-gradient(180deg, #4f3827 0%, #2b1b12 100%);
  color: #f3e6c8;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12px;
  border: 1px solid rgba(255, 231, 190, 0.12);
}
</style>
