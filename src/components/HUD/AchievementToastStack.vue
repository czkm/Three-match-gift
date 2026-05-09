<template>
  <div class="achievement-toast-stack">
    <transition-group name="achievement-toast">
      <button
        v-for="entry in visibleEntries"
        :key="entry.id"
        class="toast"
        :class="`rarity-${definition(entry.id)?.rarity || 'common'}`"
        @click="openAchievement(entry.id)"
      >
        <div class="toast-medal">
          <span class="toast-badge">🏆</span>
          <span class="toast-icon">{{ definition(entry.id)?.icon || '🏆' }}</span>
        </div>
        <div class="toast-copy">
          <p class="toast-label">成就已解锁</p>
          <p class="toast-title ink-title">{{ definition(entry.id)?.title }}</p>
          <p class="toast-flavor ink-subtle">{{ definition(entry.id)?.flavor }}</p>
          <div class="toast-foot">
            <p class="toast-rarity">{{ rarityLabel(definition(entry.id)?.rarity) }}</p>
            <p class="toast-hint">点击查看详情</p>
          </div>
        </div>
      </button>
    </transition-group>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { ACHIEVEMENTS } from '@/data/content';
import { useAchievementStore } from '@/stores/achievementStore';

const achievement = useAchievementStore();
const defs = Object.fromEntries(ACHIEVEMENTS.map((item) => [item.id, item]));
const visibleEntries = computed(() => achievement.unlockQueue.slice(0, 3));

function definition(id) {
  return defs[id] || null;
}

function rarityLabel(rarity) {
  switch (rarity) {
    case 'gold': return '金色成就';
    case 'epic': return '史诗成就';
    case 'rare': return '稀有成就';
    default: return '普通成就';
  }
}

function dismiss(id) {
  achievement.consumeToast(id);
}

function openAchievement(id) {
  achievement.openPanel(id);
  dismiss(id);
}

watch(
  visibleEntries,
  (entries) => {
    for (const entry of entries) {
      if (entry._timer) continue;
      entry._timer = setTimeout(() => {
        dismiss(entry.id);
      }, 3200);
    }
  },
  { deep: true }
);
</script>

<style scoped>
.achievement-toast-stack {
  position: fixed;
  bottom: 20px;
  right: 18px;
  z-index: 125;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  width: 320px;
  min-height: 88px;
  padding: 12px;
  display: flex;
  align-items: stretch;
  gap: 12px;
  text-align: left;
  pointer-events: auto;
  border-radius: 6px;
  border: 1px solid rgba(118, 136, 158, 0.18);
  box-shadow: 0 18px 34px rgba(10, 12, 18, 0.42);
  background:
    linear-gradient(180deg, rgba(48, 58, 74, 0.98), rgba(22, 28, 38, 0.98)),
    linear-gradient(135deg, rgba(113, 158, 214, 0.12), rgba(255, 196, 92, 0.06));
  overflow: hidden;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  position: relative;
}

.toast::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, rgba(132, 152, 178, 0.96), rgba(78, 96, 122, 0.9));
}

.toast::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 5px;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(219, 230, 242, 0.04);
}

.toast:hover {
  transform: translateY(-1px);
  border-color: rgba(146, 174, 205, 0.34);
  box-shadow: 0 22px 38px rgba(10, 12, 18, 0.5);
}

.toast.rarity-rare {
  border-color: rgba(96, 150, 220, 0.28);
}

.toast.rarity-rare::before {
  background: linear-gradient(180deg, rgba(118, 188, 255, 0.98), rgba(64, 116, 188, 0.9));
}

.toast.rarity-epic {
  border-color: rgba(170, 128, 226, 0.34);
}

.toast.rarity-epic::before {
  background: linear-gradient(180deg, rgba(210, 150, 255, 0.98), rgba(118, 76, 178, 0.92));
}

.toast.rarity-gold {
  border-color: rgba(232, 190, 92, 0.54);
  background:
    linear-gradient(180deg, rgba(74, 58, 22, 0.98), rgba(34, 28, 16, 0.98)),
    linear-gradient(135deg, rgba(255, 214, 110, 0.16), rgba(255, 238, 192, 0.06));
}

.toast.rarity-gold::before {
  width: 5px;
  background: linear-gradient(180deg, rgba(255, 226, 126, 1), rgba(205, 142, 38, 0.94));
}

.toast.rarity-gold::after {
  box-shadow:
    inset 0 0 0 1px rgba(255, 224, 142, 0.12),
    inset 0 12px 16px rgba(255, 244, 210, 0.05);
}

.toast.rarity-gold:hover {
  border-color: rgba(244, 202, 102, 0.72);
}

.toast-medal {
  width: 68px;
  flex: none;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background:
    linear-gradient(180deg, rgba(74, 90, 110, 0.98), rgba(38, 50, 66, 0.98));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    inset 0 10px 16px rgba(255, 255, 255, 0.04);
  position: relative;
  z-index: 1;
}

.toast-badge {
  font-size: 12px;
  color: #dbe7f6;
}

.toast-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 22px;
  background: radial-gradient(circle, rgba(233, 242, 255, 0.98), rgba(145, 173, 206, 0.34));
  box-shadow:
    inset 0 0 0 1px rgba(210, 226, 248, 0.16),
    0 0 12px rgba(118, 152, 190, 0.18);
}

.toast-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.toast-label,
.toast-title,
.toast-flavor,
.toast-hint,
.toast-rarity {
  margin: 0;
}

.toast-label {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9db7d6;
}

.toast-title {
  margin-top: 2px;
  font-size: 15px;
  color: #eef4fb;
  text-shadow: none;
}

.toast-flavor {
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.4;
  color: #bfcddd;
}

.toast-foot {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.toast-rarity {
  font-size: 10px;
  letter-spacing: 0.08em;
  color: rgba(167, 190, 218, 0.82);
}

.toast.rarity-rare .toast-rarity {
  color: rgba(139, 196, 255, 0.9);
}

.toast.rarity-epic .toast-rarity {
  color: rgba(216, 176, 255, 0.92);
}

.toast.rarity-gold .toast-rarity {
  color: rgba(255, 224, 142, 0.98);
}

.toast-hint {
  font-size: 10px;
  letter-spacing: 0.06em;
  color: rgba(190, 205, 222, 0.72);
}

.achievement-toast-enter-active,
.achievement-toast-leave-active {
  transition: opacity 280ms var(--ease-out-expo), transform 280ms var(--ease-out-expo);
}

.achievement-toast-enter-from,
.achievement-toast-leave-to {
  opacity: 0;
  transform: translateX(28px) scale(0.96);
}
</style>
