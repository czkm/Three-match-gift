/**
 * Corvo Bianco — match-3 board engine.
 *
 * Adapted from gridland-vue/src/core/board.js. The column-major
 * tileString convention is preserved so the same regex-based matcher
 * can be used:
 *
 *   tileString = "ggwsh...X gswch...X ..."
 *   columns separated by 'X', holes by 'O'.
 *
 * Communication with the rendering layer is done through `eventBus`:
 *   draw[ 'board.fill'  | tileString ]
 *   draw[ 'board.swap'  | { pos1, pos2 } ]
 *   draw[ 'board.match' | { removed, added, swapSide } ]
 *   draw[ 'board.clear' | {} ]
 *   tilesCleared[ resourcesGained, swapSide, comboGroups ]
 *   tilesSwapped[ matched ]   — used to refresh hint highlights
 *   noMoreMoves               — auto-refresh notice
 *
 * The host calls `graphicsActionComplete` once the on-screen animation
 * finishes; only then will the engine run the next step. This is what
 * gives the cascade its tactile rhythm.
 */
import EventBus from './eventBus';
import { MONSTER_CHARS, RESOURCE_CHARS, ROT_CHAR } from '@/data/content';

export const SEP = 'X';
export const HOLE = 'O';

export class Board {
  constructor(opts = {}) {
    this.opts = { rows: 8, columns: 8, ...opts };
    this._reset();

    this._matchRe = new RegExp(`([^${SEP}])\\1{2,}`, 'g');
    this._holeRe  = new RegExp(HOLE, 'g');

    EventBus.bind('graphicsActionComplete', this._onGraphicsComplete);
  }

  destroy() {
    EventBus.unbind('graphicsActionComplete', this._onGraphicsComplete);
  }

  /* ---------- public API ---------- */

  refreshBoard(reason = 'manual') {
    this.tileString = '';
    this._setGraphicsCallback(() => this.fill());
    EventBus.trigger('draw', ['board.clear', { reason }]);
  }

  setBoardStringAfterClear(tileString, reason = 'manual') {
    this.tileString = '';
    this._setGraphicsCallback(() => this.setBoardString(tileString));
    EventBus.trigger('draw', ['board.clear', { reason }]);
  }

  setBoardString(tileString) {
    this.tileString = tileString;
    this._setGraphicsCallback(() => {});
    EventBus.trigger('draw', ['board.fill', this.tileString]);
  }

  collapseAt(cells = []) {
    if (!cells.length) return;
    for (const cell of cells) this.setTile(cell.row, cell.col, HOLE);
    const added = this._compactAndRefill();
    this.lastSwitch = null;
    this._setGraphicsCallback(() => this.checkMatches());
    EventBus.trigger('draw', ['board.match', {
      removed: [],
      added,
      removedEntityCells: cells,
      swapSide: 'center',
      groupSizes: [],
      matchGroups: [],
      chain: this._chain
    }]);
  }

  fill() {
    this.tileString = '';
    for (let col = 0; col < this.opts.columns; col++) {
      for (let row = 0; row < this.opts.rows; row++) {
        if (this._isBlockedCell(row, col)) {
          this.tileString += HOLE;
          continue;
        }
        const monsterChar = typeof this.opts.monsterCharAt === 'function'
          ? this.opts.monsterCharAt(row, col)
          : null;
        if (monsterChar) {
          this.tileString += monsterChar;
          continue;
        }
        const counts = this._tileMap();
        if (col > 0) {
          const sib = this.getTile(row, col - 1);
          if (counts[sib] != null) counts[sib]--;
          if (col > 1 && this.getTile(row, col - 2) === sib && counts[sib] != null) counts[sib]--;
        }
        if (row > 0) {
          const sib = this.getTile(row - 1, col);
          if (counts[sib] != null) counts[sib]--;
          if (row > 1 && this.getTile(row - 2, col) === sib && counts[sib] != null) counts[sib]--;
        }
        this.tileString += this._generateTile(counts);
      }
      this.tileString += SEP;
    }
    this._setGraphicsCallback(() => {});
    EventBus.trigger('draw', ['board.fill', this.tileString]);
  }

  /** Player swap (or revert when called with no args). */
  switchTiles(pos1, pos2) {
    let cb = () => this.checkMatches();
    if (!pos1 && !pos2 && this.lastSwitch) {
      pos1 = this.lastSwitch.pos2;
      pos2 = this.lastSwitch.pos1;
      cb = () => {};
    }
    this.swapSide = pos1.col < this.opts.columns / 2 ? 'left' : 'right';
    this.lastSwitch = { pos1, pos2 };

    const a = this.getTile(pos1.row, pos1.col);
    const b = this.getTile(pos2.row, pos2.col);
    if (a === HOLE || b === HOLE || this._isMonsterChar(a) || this._isMonsterChar(b)) return;
    this.setTile(pos1.row, pos1.col, b);
    this.setTile(pos2.row, pos2.col, a);

    this.moved = true;
    this._setGraphicsCallback(cb);
    EventBus.trigger('draw', ['board.swap', { pos1, pos2 }]);
  }

  /** Free-form swap (Roach Path ability). Always commits. */
  swapAny(pos1, pos2) {
    const a = this.getTile(pos1.row, pos1.col);
    const b = this.getTile(pos2.row, pos2.col);
    if (a === HOLE || b === HOLE || this._isMonsterChar(a) || this._isMonsterChar(b)) return;
    this.setTile(pos1.row, pos1.col, b);
    this.setTile(pos2.row, pos2.col, a);
    this.lastSwitch = null;
    this._setGraphicsCallback(() => this.checkMatches());
    EventBus.trigger('draw', ['board.swap', { pos1, pos2 }]);
  }

  /** Convert one tile and its 3×3 neighbours to `targetChar`. */
  convert3x3(centerRow, centerCol, targetChar) {
    for (let r = centerRow - 1; r <= centerRow + 1; r++) {
      for (let c = centerCol - 1; c <= centerCol + 1; c++) {
        if (r < 0 || r >= this.opts.rows || c < 0 || c >= this.opts.columns) continue;
        if (this._isBlockedCell(r, c)) continue;
        if (this.getTile(r, c) === HOLE || this._isMonsterChar(this.getTile(r, c))) continue;
        this.setTile(r, c, targetChar);
      }
    }
    this.lastSwitch = null;
    this._setGraphicsCallback(() => this.checkMatches());
    EventBus.trigger('draw', ['board.convert', { type: 'area' }]);
  }

  /** Convert every tile of `fromChar` into `toChar` (Lilac Seed). */
  convertResource(fromChar, toChar) {
    let s = '';
    for (let i = 0; i < this.tileString.length; i++) {
      const ch = this.tileString.charAt(i);
      const pos = this.getPosition(i);
      if (this._isSeparatorIndex(i) || this._isBlockedCell(pos.row, pos.col)) s += ch;
      else if (this._isMonsterChar(ch)) s += ch;
      else s += ch === fromChar ? toChar : ch;
    }
    this.tileString = s;
    this.lastSwitch = null;
    this._setGraphicsCallback(() => this.checkMatches());
    EventBus.trigger('draw', ['board.convert', { type: 'global', fromChar, toChar }]);
  }

  /** Collect every tile of `targetChar` as if cleared by an ability. */
  harvestResource(targetChar) {
    const removed = [];
    for (let row = 0; row < this.opts.rows; row++) {
      for (let col = 0; col < this.opts.columns; col++) {
        if (this._isBlockedCell(row, col)) continue;
        const ch = this.getTile(row, col);
        if (ch === HOLE || this._isMonsterChar(ch)) continue;
        if (ch !== targetChar) continue;
        removed.push({ row, col, char: ch });
      }
    }
    if (!removed.length) return false;

    const resourcesGained = {};
    for (const t of removed) {
      this.setTile(t.row, t.col, HOLE);
      if (t.char !== ROT_CHAR) resourcesGained[t.char] = (resourcesGained[t.char] || 0) + 1;
    }

    const newTiles = this._compactAndRefill();
    this.lastSwitch = null;
    this._setGraphicsCallback(() => this.checkMatches());

    EventBus.trigger('draw', ['board.match', {
      removed: removed.map((t) => ({
        position: { row: t.row, col: t.col },
        char: t.char
      })),
      added: newTiles,
      removedMonsterTiles: [],
      swapSide: 'center'
    }]);
    EventBus.trigger('tilesCleared', [resourcesGained, 'center', 1, [removed.length], 1, [{
      axis: 'global',
      size: removed.length,
      char: targetChar,
      positions: removed.map((item) => ({ row: item.row, col: item.col }))
    }]]);
    return true;
  }

  /** Clear an entire row or column (Toussent Sunset). */
  clearLine(axis, index) {
    const removed = [];
    if (axis === 'row') {
      for (let c = 0; c < this.opts.columns; c++) {
        if (this._isBlockedCell(index, c)) continue;
        if (this.getTile(index, c) === HOLE || this._isMonsterChar(this.getTile(index, c))) continue;
        removed.push({ row: index, col: c, char: this.getTile(index, c) });
      }
    } else {
      for (let r = 0; r < this.opts.rows; r++) {
        if (this._isBlockedCell(r, index)) continue;
        if (this.getTile(r, index) === HOLE || this._isMonsterChar(this.getTile(r, index))) continue;
        removed.push({ row: r, col: index, char: this.getTile(r, index) });
      }
    }

    // Tally & wipe.
    const resourcesGained = {};
    for (const t of removed) {
      this.setTile(t.row, t.col, HOLE);
      if (t.char !== ROT_CHAR) resourcesGained[t.char] = (resourcesGained[t.char] || 0) + 1;
    }

    const removedMonsterTiles = typeof this.opts.resolveMonsterHits === 'function'
      ? this.opts.resolveMonsterHits(
          removed.map((item) => ({ row: item.row, col: item.col, char: item.char, groupSize: 0, axis, isLineSweep: true })),
          0,
          'lineSweep',
          [{ axis, size: removed.length, char: null, positions: removed.map((item) => ({ row: item.row, col: item.col })) }]
        ) || []
      : [];
    for (const cell of removedMonsterTiles) {
      if (cell?.row == null || cell?.col == null) continue;
      this.setTile(cell.row, cell.col, HOLE);
    }

    const newTiles = this._compactAndRefill();
    this.lastSwitch = null;
    this._setGraphicsCallback(() => this.checkMatches());

    const removedForRender = removed.map((t) => ({
      position: { row: t.row, col: t.col },
      char: t.char
    }));

    EventBus.trigger('draw', ['board.match', {
      removed: removedForRender,
      added: newTiles,
      removedMonsterTiles,
      swapSide: 'center',
      lineSweep: { axis, index }
    }]);
    EventBus.trigger('tilesCleared', [resourcesGained, 'center', 1]);
  }

  releaseBlockedCells(releasedCells = []) {
    if (!releasedCells.length) return;

    const affectedCols = [...new Set(releasedCells.map((cell) => cell.col))];
    const newTiles = [];

    for (const col of affectedCols) {
      const survivors = [];
      for (let row = 0; row < this.opts.rows; row++) {
        if (this._isBlockedCell(row, col)) continue;
        const ch = this.getTile(row, col);
        if (ch && ch !== HOLE) survivors.push(ch);
      }

      const result = new Array(this.opts.rows).fill(HOLE);
      let survivorIdx = survivors.length - 1;
      for (let row = this.opts.rows - 1; row >= 0; row--) {
        if (this._isBlockedCell(row, col)) continue;
        if (survivorIdx >= 0) {
          result[row] = survivors[survivorIdx];
          survivorIdx--;
        }
      }

      const counts = this._tileMap();
      for (let row = 0; row < this.opts.rows; row++) {
        if (this._isBlockedCell(row, col)) continue;
        if (result[row] !== HOLE) continue;
        const ch = this._generateTile(counts);
        result[row] = ch;
        newTiles.push({ row, col, char: ch });
      }

      for (let row = 0; row < this.opts.rows; row++) {
        this.setTile(row, col, result[row]);
      }
    }

    this.lastSwitch = null;
    this._setGraphicsCallback(() => this.checkMatches());
    EventBus.trigger('draw', ['board.match', {
      removed: [],
      added: newTiles,
      removedEntityCells: releasedCells,
      swapSide: 'center',
      groupSizes: [],
      matchGroups: [],
      chain: this._chain
    }]);
  }

  setCellChar(row, col, char, { collapse = false } = {}) {
    if (row < 0 || row >= this.opts.rows || col < 0 || col >= this.opts.columns) return false;
    if (this._isBlockedCell(row, col)) return false;
    if (this._isMonsterChar(this.getTile(row, col))) return false;
    this.setTile(row, col, char);
    if (collapse) {
      const added = this._compactAndRefill();
      this.lastSwitch = null;
      this._setGraphicsCallback(() => this.checkMatches());
      EventBus.trigger('draw', ['board.match', {
        removed: [],
        added,
        swapSide: 'center',
        groupSizes: [],
        matchGroups: [],
        chain: this._chain
      }]);
    } else {
      EventBus.trigger('draw', ['board.convert', { type: 'cell', row, col, char }]);
    }
    return true;
  }

  applyEndTurnMonsterPressure(handler) {
    if (typeof handler !== 'function') return [];
    const actions = handler({
      rows: this.opts.rows,
      columns: this.opts.columns,
      getTile: (row, col) => this.getTile(row, col),
      setTile: (row, col, char) => this.setTile(row, col, char),
      isBlocked: (row, col) => this._isBlockedCell(row, col),
      isMonster: (char) => this._isMonsterChar(char),
      hole: HOLE,
      rot: ROT_CHAR
    }) || [];
    if (!actions.length) return [];
    EventBus.trigger('draw', ['board.convert', { type: 'monsterPressure', actions }]);
    return actions;
  }

  /** Find a single hint move (lilacReturn). Returns {a, b} or null. */
  findHint() {
    for (let r = 0; r < this.opts.rows; r++) {
      for (let c = 0; c < this.opts.columns; c++) {
        if (this._isBlockedCell(r, c)) continue;
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const r2 = r + dr, c2 = c + dc;
          if (r2 >= this.opts.rows || c2 >= this.opts.columns) continue;
          if (this._isBlockedCell(r2, c2)) continue;
          this._swapInString({ row: r, col: c }, { row: r2, col: c2 });
          const matched = this._anyMatch();
          this._swapInString({ row: r, col: c }, { row: r2, col: c2 });
          if (matched) return { a: { row: r, col: c }, b: { row: r2, col: c2 } };
        }
      }
    }
    return null;
  }

  /** Cheap probe: would swapping a/b create at least one 3+ match? */
  wouldMatch(a, b) {
    if (!a || !b) return false;
    if (a.row < 0 || a.row >= this.opts.rows) return false;
    if (b.row < 0 || b.row >= this.opts.rows) return false;
    if (a.col < 0 || a.col >= this.opts.columns) return false;
    if (b.col < 0 || b.col >= this.opts.columns) return false;
    if (this._isBlockedCell(a.row, a.col) || this._isBlockedCell(b.row, b.col)) return false;
    const ca = this.getTile(a.row, a.col);
    const cb = this.getTile(b.row, b.col);
    if (ca === HOLE || cb === HOLE || this._isMonsterChar(ca) || this._isMonsterChar(cb)) return false;
    this._swapInString(a, b);
    const matched = this._anyMatch();
    this._swapInString(a, b);
    return matched;
  }

  canMove() {
    return this._graphicsCallback == null && !this._locked;
  }

  /* ---------- main matching loop ---------- */

  checkMatches() {
    this._generateRowString();

    const vMask = new Array(this.tileString.length).fill(0);
    const hMask = new Array(this.tileString.length).fill(0);
    let matchDetected = false;
    const groupSizes = [];
    const matchGroups = [];

    matchDetected = this._scanMatches(this.tileString, false, vMask, matchGroups, groupSizes) || matchDetected;
    matchDetected = this._scanMatches(this.rowString, true, hMask, matchGroups, groupSizes) || matchDetected;

    if (!matchDetected) {
      EventBus.trigger('tilesSwapped', [this.lastSwitch == null]);
      EventBus.trigger('chainStat', [this._chain]);
      this._chain = 0;
      if (this.lastSwitch) {
        // No match → revert
        this.switchTiles();
      } else if (!this._areMovesAvailable()) {
        this._noMoreMoves();
      }
      this.moved = false;
      return;
    }

    this._chain++;
    if (this.lastSwitch) EventBus.trigger('countSwapped');

    const removed = [];
    const resourcesGained = {};

    for (let i = 0; i < vMask.length; i++) {
      if ((vMask[i] === 1 || hMask[i] === 1) && this.getTile(i) !== HOLE) {
        const ch = this.getTile(i);
        if (ch !== ROT_CHAR) resourcesGained[ch] = (resourcesGained[ch] || 0) + 1;
        this.setTile(i, HOLE);
        removed.push({ position: this.getPosition(i), char: ch });
      }
    }

    const clearedTiles = removed.map((item) => {
      const match = matchGroups.find((group) => group.positions.some((pos) => (
        pos.row === item.position.row && pos.col === item.position.col
      )));
      return {
        row: item.position.row,
        col: item.position.col,
        char: item.char,
        groupSize: match?.size || 0,
        axis: match?.axis || null
      };
    });

    const removedMonsterTiles = typeof this.opts.resolveMonsterHits === 'function'
      ? this.opts.resolveMonsterHits(clearedTiles, this._chain, 'match', matchGroups) || []
      : [];

    for (const cell of removedMonsterTiles) {
      this.setTile(cell.row, cell.col, HOLE);
    }

    const added = this._compactAndRefill();

    this.lastSwitch = null;
    this._setGraphicsCallback(() => this.checkMatches());

    EventBus.trigger('draw', ['board.match', {
      removed, added,
      removedMonsterTiles,
      swapSide: this.swapSide,
      groupSizes,
      matchGroups,
      chain: this._chain
    }]);
    EventBus.trigger('tilesCleared', [resourcesGained, this.swapSide, groupSizes.length, groupSizes, this._chain, matchGroups]);
    this.moved = false;
  }

  /* ---------- grid utilities ---------- */

  getIndex(row, col) {
    return col * (this.opts.rows + 1) + row;
  }
  getColumn(idx, rowOriented) {
    return rowOriented
      ? idx % (this.opts.columns + 1)
      : Math.floor(idx / (this.opts.rows + 1));
  }
  getRow(idx, rowOriented) {
    return rowOriented
      ? Math.floor(idx / (this.opts.columns + 1))
      : idx % (this.opts.rows + 1);
  }
  getPosition(idx) { return { row: this.getRow(idx), col: this.getColumn(idx) }; }

  getTile(row, col) {
    return col == null
      ? this.tileString.charAt(row)
      : this.tileString.charAt(this.getIndex(row, col));
  }
  setTile(p1, p2, p3) {
    const idx = p3 != null ? this.getIndex(p1, p2) : p1;
    const ch  = p3 != null ? p3 : p2;
    this.tileString = this.tileString.substring(0, idx) + ch + this.tileString.substring(idx + 1);
  }

  /* ---------- private helpers ---------- */

  _reset() {
    this.tileString = '';
    this.rowString = '';
    this.swapSide = null;
    this.lastSwitch = null;
    this.moved = false;
    this._chain = 0;
    this._locked = false;
    this._graphicsCallback = null;
  }

  _setGraphicsCallback(cb) {
    if (this._graphicsCallback) {
      // Coalesce — most recent callback wins.
    }
    this._graphicsCallback = cb;
  }

  _onGraphicsComplete = () => {
    if (typeof this._graphicsCallback === 'function') {
      const cb = this._graphicsCallback;
      this._graphicsCallback = null;
      cb();
    }
  };

  _tileMap() {
    const m = {};
    const allowed = (typeof this.opts.allowedChars === 'function')
      ? this.opts.allowedChars()
      : RESOURCE_CHARS;
    const weights = typeof this.opts.tileWeights === 'function'
      ? this.opts.tileWeights()
      : null;
    for (const ch of allowed) m[ch] = Math.max(0, weights?.[ch] ?? 2);
    return m;
  }

  _getTotal(counts) {
    let t = 0;
    for (const k in counts) {
      counts[k] = counts[k] < 0 ? 0 : counts[k];
      t += counts[k];
    }
    return t;
  }

  _generateTile(counts, total) {
    if (total == null) total = this._getTotal(counts);
    const r = Math.random();
    let baseline = 0;
    let pick = RESOURCE_CHARS[0];
    for (const k in counts) {
      pick = k;
      const chance = counts[k] / total;
      if (r < baseline + chance) break;
      baseline += chance;
    }
    return pick;
  }

  _scanMatches(source, rowOriented, mask, matchGroups, groupSizes) {
    let found = false;
    let cursor = 0;
    for (const segment of source.split(SEP)) {
      let idx = 0;
      while (idx < segment.length) {
        const ch = segment.charAt(idx);
        let end = idx + 1;
        while (end < segment.length && segment.charAt(end) === ch) end++;
        const size = end - idx;
        if (size >= 3 && !MONSTER_CHARS.includes(ch) && ch !== HOLE && ch !== ROT_CHAR) {
          found = true;
          groupSizes.push(size);
          const positions = [];
          for (let i = idx; i < end; i++) {
            const sourceIndex = cursor + i;
            const boardIndex = rowOriented ? this._indexFromRowString(sourceIndex) : sourceIndex;
            mask[boardIndex] = 1;
            positions.push(this.getPosition(boardIndex));
          }
          matchGroups.push({ axis: rowOriented ? 'row' : 'col', size, char: ch, positions });
        }
        idx = end;
      }
      cursor += segment.length + 1;
    }
    return found;
  }

  _compactAndRefill() {
    const newTiles = [];
    const columns = [];
    for (let col = 0; col < this.opts.columns; col++) {
      const survivors = [];
      for (let row = 0; row < this.opts.rows; row++) {
        if (this._isBlockedCell(row, col)) continue;
        const ch = this.getTile(row, col);
        if (ch && ch !== HOLE) survivors.push(ch);
      }

      const result = new Array(this.opts.rows).fill(HOLE);
      let survivorIdx = survivors.length - 1;
      for (let row = this.opts.rows - 1; row >= 0; row--) {
        if (this._isBlockedCell(row, col)) continue;
        if (survivorIdx >= 0) {
          result[row] = survivors[survivorIdx];
          survivorIdx--;
        }
      }

      const counts = this._tileMap();
      for (let row = 0; row < this.opts.rows; row++) {
        if (this._isBlockedCell(row, col)) continue;
        if (result[row] !== HOLE) continue;
        const ch = this._generateTile(counts);
        result[row] = ch;
        newTiles.push({ row, col, char: ch });
      }
      columns.push(result.join(''));
    }
    this.tileString = columns.join(SEP) + SEP;
    return newTiles;
  }

  _generateRowString() {
    let s = '';
    for (let r = 0; r < this.opts.rows; r++) {
      for (let c = 0; c < this.opts.columns; c++) {
        s += this.getTile(r, c);
      }
      s += SEP;
    }
    this.rowString = s;
  }

  _indexFromRowString(idx) {
    return this.getIndex(this.getRow(idx, true), this.getColumn(idx, true));
  }

  _swapInString(p1, p2) {
    const a = this.getTile(p1.row, p1.col);
    const b = this.getTile(p2.row, p2.col);
    if (a === HOLE || b === HOLE || this._isMonsterChar(a) || this._isMonsterChar(b)) return;
    this.setTile(p1.row, p1.col, b);
    this.setTile(p2.row, p2.col, a);
  }

  _anyMatch() {
    this._generateRowString();
    return this._scanMatches(this.tileString, false, [], [], []) ||
      this._scanMatches(this.rowString, true, [], [], []);
  }

  _areMovesAvailable() {
    return this.findHint() != null;
  }

  _isBlockedCell(row, col) {
    const blocked = typeof this.opts.blockedCells === 'function'
      ? this.opts.blockedCells()
      : [];
    return blocked.includes(`${row}:${col}`);
  }

  _isSeparatorIndex(idx) {
    return this.tileString.charAt(idx) === SEP;
  }

  _isMonsterChar(ch) {
    return MONSTER_CHARS.includes(ch);
  }

  _noMoreMoves() {
    EventBus.trigger('noMoreMoves');
    this.refreshBoard('noMoves');
  }

}

let _instance = null;
export function getBoard(opts) {
  if (!_instance) _instance = new Board(opts);
  return _instance;
}
export function resetBoard() {
  if (_instance) _instance.destroy();
  _instance = null;
}
