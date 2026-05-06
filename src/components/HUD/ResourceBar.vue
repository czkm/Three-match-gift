<template>
  <div class="resource-bar parchment grain">
    <h3 class="ink-title">修复进度</h3>
    <div v-for="r in game.repairView" :key="r.id" class="row">
      <span class="emoji">{{ r.emoji }}</span>
      <span class="label">{{ r.label }}</span>
      <div class="track">
        <div
          class="fill"
          :class="r.id"
          :style="{ width: Math.min(100, r.pct * 100) + '%' }"
        />
      </div>
      <span class="count">{{ r.have }} / {{ r.need }}</span>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '@/stores/gameStore';
const game = useGameStore();
</script>

<style scoped>
.resource-bar {
  width: 220px;
  padding: 14px 16px;
  border-radius: 6px;
}
h3 { margin: 0 0 10px; font-size: 14px; letter-spacing: 0.08em; }
.row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 12px;
}
.emoji { font-size: 18px; width: 22px; text-align: center; }
.label { width: 32px; color: var(--ink); }
.track {
  flex: 1;
  height: 8px;
  background: rgba(58, 42, 31, 0.18);
  border-radius: 4px;
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 4px;
  transition: width 360ms ease;
}
.fill.grape { background: linear-gradient(90deg, var(--grape-2), var(--grape-1)); }
.fill.wood  { background: linear-gradient(90deg, var(--wood-2),  var(--wood-1)); }
.fill.stone { background: linear-gradient(90deg, var(--stone-2), var(--stone-1)); }
.fill.clay  { background: linear-gradient(90deg, var(--clay-2),  var(--clay-1)); }
.fill.herb  { background: linear-gradient(90deg, var(--herb-2),  var(--herb-1)); }
.fill.magic { background: linear-gradient(90deg, var(--magic-2), var(--magic-1)); }
.count {
  width: 56px;
  text-align: right;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}
</style>
