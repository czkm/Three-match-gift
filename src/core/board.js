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
import { RESOURCE_CHARS } from '@/data/content';

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

  fill() {
    this.tileString = '';
    for (let col = 0; col < this.opts.columns; col++) {
      for (let row = 0; row < this.opts.rows; row++) {
        const counts = this._tileMap();
        if (col > 0) {
          const sib = this.getTile(row, col - 1);
          counts[sib]--;
          if (col > 1 && this.getTile(row, col - 2) === sib) counts[sib]--;
        }
        if (row > 0) {
          const sib = this.getTile(row - 1, col);
          counts[sib]--;
          if (row > 1 && this.getTile(row - 2, col) === sib) counts[sib]--;
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
        if (this.getTile(r, c) === HOLE) continue;
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
      s += ch === fromChar ? toChar : ch;
    }
    this.tileString = s;
    this.lastSwitch = null;
    this._setGraphicsCallback(() => this.checkMatches());
    EventBus.trigger('draw', ['board.convert', { type: 'global', fromChar, toChar }]);
  }

  /** Clear an entire row or column (Toussent Sunset). */
  clearLine(axis, index) {
    const removed = [];
    if (axis === 'row') {
      for (let c = 0; c < this.opts.columns; c++) {
        if (this.getTile(index, c) === HOLE) continue;
        removed.push({ row: index, col: c, char: this.getTile(index, c) });
      }
    } else {
      for (let r = 0; r < this.opts.rows; r++) {
        if (this.getTile(r, index) === HOLE) continue;
        removed.push({ row: r, col: index, char: this.getTile(r, index) });
      }
    }

    // Tally & wipe.
    const resourcesGained = {};
    for (const t of removed) {
      this.setTile(t.row, t.col, HOLE);
      resourcesGained[t.char] = (resourcesGained[t.char] || 0) + 1;
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
      swapSide: 'center',
      lineSweep: { axis, index }
    }]);
    EventBus.trigger('tilesCleared', [resourcesGained, 'center', 1]);
  }

  /** Find a single hint move (lilacReturn). Returns {a, b} or null. */
  findHint() {
    for (let r = 0; r < this.opts.rows; r++) {
      for (let c = 0; c < this.opts.columns; c++) {
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const r2 = r + dr, c2 = c + dc;
          if (r2 >= this.opts.rows || c2 >= this.opts.columns) continue;
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
    const ca = this.getTile(a.row, a.col);
    const cb = this.getTile(b.row, b.col);
    if (ca === HOLE || cb === HOLE) return false;
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

    this.tileString.replace(this._matchRe, (match, _p1, offset) => {
      matchDetected = true;
      groupSizes.push(match.length);
      for (let i = 0; i < match.length; i++) vMask[offset + i] = 1;
      return match;
    });
    this.rowString.replace(this._matchRe, (match, _p1, offset) => {
      matchDetected = true;
      groupSizes.push(match.length);
      for (let i = 0; i < match.length; i++) {
        hMask[this._indexFromRowString(offset + i)] = 1;
      }
      return match;
    });

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
        resourcesGained[ch] = (resourcesGained[ch] || 0) + 1;
        this.setTile(i, HOLE);
        removed.push({ position: this.getPosition(i), char: ch });
      }
    }

    const added = this._compactAndRefill();

    this.lastSwitch = null;
    this._setGraphicsCallback(() => this.checkMatches());

    EventBus.trigger('draw', ['board.match', {
      removed, added,
      swapSide: this.swapSide,
      groupSizes,
      chain: this._chain
    }]);
    EventBus.trigger('tilesCleared', [resourcesGained, this.swapSide, groupSizes.length, groupSizes, this._chain]);
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
    for (const ch of allowed) m[ch] = 2;
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

  _compactAndRefill() {
    const newTiles = [];
    this.tileString = this.tileString.replace(this._holeRe, '');
    const columns = this.tileString.split(SEP);
    for (let col = 0, len = columns.length - 1; col < len; col++) {
      let column = columns[col];
      const needed = this.opts.rows - column.length;
      const counts = this._tileMap();
      for (let r = needed - 1; r >= 0; r--) {
        const ch = this._generateTile(counts);
        column = ch + column;
        newTiles.push({ row: r, col, char: ch });
      }
      columns[col] = column;
    }
    this.tileString = columns.join(SEP);
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
    this.setTile(p1.row, p1.col, b);
    this.setTile(p2.row, p2.col, a);
  }

  _anyMatch() {
    this._generateRowString();
    if (this._matchRe.test(this.tileString)) { this._matchRe.lastIndex = 0; return true; }
    this._matchRe.lastIndex = 0;
    if (this._matchRe.test(this.rowString))  { this._matchRe.lastIndex = 0; return true; }
    this._matchRe.lastIndex = 0;
    return false;
  }

  _areMovesAvailable() {
    return this.findHint() != null;
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
