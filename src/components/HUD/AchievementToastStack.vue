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
import { audioManager } from '@/audio/AudioManager';
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
      if (!entry._playedSound) {
        entry._playedSound = true;
        audioManager.playSFX('achievement', { vol: 0.7 });
      }
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
  border-radius: 16px;
  border: 2px solid #d4c9b4;
  box-shadow: 0 4px 0 0 #d4c9b4, 0 8px 20px rgba(107, 92, 67, 0.18);
  background: rgb(247, 243, 223);
  overflow: hidden;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  color: #725d42;
}

.toast::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #19c8b9, #11a89b);
}

.toast:hover {
  transform: translateY(-2px);
  border-color: #19c8b9;
  box-shadow: 0 5px 0 0 #11a89b, 0 10px 24px rgba(25, 200, 185, 0.18);
}

.toast.rarity-rare {
  border-color: rgba(94, 154, 226, 0.5);
}

.toast.rarity-rare::before {
  background: linear-gradient(180deg, #76bcff, #4074bc);
}

.toast.rarity-rare:hover {
  border-color: rgba(94, 154, 226, 0.8);
  box-shadow: 0 5px 0 0 rgba(64, 116, 188, 0.45), 0 10px 24px rgba(94, 154, 226, 0.2);
}

.toast.rarity-epic {
  border-color: rgba(172, 124, 228, 0.5);
}

.toast.rarity-epic::before {
  background: linear-gradient(180deg, #ce94ff, #7248b0);
}

.toast.rarity-epic:hover {
  border-color: rgba(172, 124, 228, 0.8);
  box-shadow: 0 5px 0 0 rgba(114, 72, 176, 0.45), 0 10px 24px rgba(172, 124, 228, 0.2);
}

.toast.rarity-gold {
  border-color: rgba(228, 186, 92, 0.7);
  background: linear-gradient(180deg, #fff7dc, #f7eab4);
}

.toast.rarity-gold::before {
  width: 5px;
  background: linear-gradient(180deg, #ffe27e, #cd8e26);
}

.toast.rarity-gold:hover {
  border-color: rgba(228, 186, 92, 1);
  box-shadow: 0 5px 0 0 rgba(205, 142, 38, 0.5), 0 10px 24px rgba(255, 204, 0, 0.22);
}

.toast-medal {
  width: 60px;
  flex: none;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: #f8f8f0;
  border: 2px solid #d4c9b4;
  box-shadow: 0 2px 0 0 #d4c9b4;
  position: relative;
  z-index: 1;
}

.toast.rarity-gold .toast-medal {
  background: linear-gradient(180deg, #fff7dc, #ffe27e);
  border-color: rgba(228, 186, 92, 0.7);
  box-shadow: 0 2px 0 0 rgba(205, 142, 38, 0.4);
}

.toast-badge {
  font-size: 11px;
  color: #9f927d;
  font-weight: 700;
}

.toast-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 20px;
  background: #eae4d0;
  border: 2px solid #d4c9b4;
}

.toast.rarity-gold .toast-icon {
  background: radial-gradient(circle, #fff5c8, #ffd97a);
  border-color: #e0b800;
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
  color: #19c8b9;
  font-weight: 700;
}

.toast.rarity-rare .toast-label { color: #4074bc; }
.toast.rarity-epic .toast-label { color: #7248b0; }
.toast.rarity-gold .toast-label { color: #b07a18; }

.toast-title {
  margin-top: 2px;
  font-size: 15px;
  color: #794f27;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.toast-flavor {
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.4;
  color: #9f927d;
  font-weight: 500;
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
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #9f927d;
  padding: 3px 8px;
  border-radius: 50px;
  background: #eae4d0;
}

.toast.rarity-rare .toast-rarity {
  color: #2d5f92;
  background: rgba(164, 206, 255, 0.4);
}

.toast.rarity-epic .toast-rarity {
  color: #6f47a8;
  background: rgba(214, 186, 255, 0.4);
}

.toast.rarity-gold .toast-rarity {
  color: #8a5a0f;
  background: linear-gradient(180deg, #ffe7a2, #e9bd4f);
}

.toast-hint {
  font-size: 10px;
  letter-spacing: 0.04em;
  color: #9f927d;
  font-weight: 600;
}

.achievement-toast-enter-active,
.achievement-toast-leave-active {
  transition: opacity 280ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.achievement-toast-enter-from,
.achievement-toast-leave-to {
  opacity: 0;
  transform: translateX(28px) scale(0.92);
}
</style>
