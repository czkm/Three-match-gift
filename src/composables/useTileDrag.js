/**
 * Tile drag handler — port of gridland-vue/src/composables/useTileDrag.js.
 *
 * Two ways to swap:
 *   1) tap A → tap B (adjacent) → swap.
 *   2) press A → drag past 30px in cardinal direction → swap with neighbour.
 *
 * The host supplies `canMove` (gate) and `onSwap(a, b)` (commit).
 */
import { ref, reactive } from 'vue';
import { TIMING } from '@/utils/timing';

export function useTileDrag({ canMove, onSwap, onPreview }) {
  const dragging = ref(false);
  const start = reactive({ x: 0, y: 0 });
  const activeTile = ref(null);    // { row, col }
  const previewTile = ref(null);   // { row, col, valid }

  function pickTile(tile, evt) {
    if (!canMove()) return;
    const e = evt.changedTouches ? evt.changedTouches[0] : evt;
    start.x = e.clientX;
    start.y = e.clientY;
    dragging.value = true;

    if (activeTile.value == null) {
      activeTile.value = tile;
      return;
    }
    const a = activeTile.value;
    const isSame = a.row === tile.row && a.col === tile.col;
    const isAdjacent = Math.abs(a.row - tile.row) + Math.abs(a.col - tile.col) === 1;
    activeTile.value = isSame ? null : isAdjacent ? null : tile;
    if (isAdjacent) {
      onSwap(a, tile);
      dragging.value = false;
    }
  }

  function moveDrag(evt, board) {
    if (!dragging.value || activeTile.value == null) return;
    const e = evt.changedTouches ? evt.changedTouches[0] : evt;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    // Soft preview: lock direction even before threshold so the player
    // sees where the swap is heading.
    const a = activeTile.value;
    let cdx = 0, cdy = 0;
    if (Math.abs(dx) >= Math.abs(dy)) cdx = dx > 0 ? 1 : -1;
    else                              cdy = dy > 0 ? 1 : -1;
    const tgtRow = a.row + cdy;
    const tgtCol = a.col + cdx;
    const inBounds =
      tgtRow >= 0 && tgtRow < board.rows &&
      tgtCol >= 0 && tgtCol < board.cols;
    if (Math.hypot(dx, dy) >= 8 && inBounds) {
      const valid = onPreview ? !!onPreview(a, { row: tgtRow, col: tgtCol }) : true;
      previewTile.value = { row: tgtRow, col: tgtCol, valid };
    } else {
      previewTile.value = null;
    }

    if (Math.hypot(dx, dy) < TIMING.DRAG_THRESHOLD_PX) return;

    if (!inBounds) {
      previewTile.value = null;
      dragging.value = false;
      activeTile.value = null;
      return;
    }

    activeTile.value = null;
    previewTile.value = null;
    onSwap(a, { row: tgtRow, col: tgtCol });
    dragging.value = false;
  }

  function endDrag() {
    dragging.value = false;
    previewTile.value = null;
  }

  function clearActive() {
    activeTile.value = null;
    dragging.value = false;
    previewTile.value = null;
  }

  return { activeTile, dragging, previewTile, pickTile, moveDrag, endDrag, clearActive };
}
