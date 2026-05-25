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
          <img
            v-if="definition(entry.id)?.iconFile && !entry._imgError"
            :src="`/img/achievements/${definition(entry.id).iconFile}.png`"
            alt=""
            class="toast-icon-img"
            @error="entry._imgError = true"
          >
          <span v-else class="toast-icon-emoji">{{ definition(entry.id)?.icon || '🏆' }}</span>
        </div>
        <div class="toast-copy">
          <p class="toast-label">哩程達成！</p>
          <p class="toast-title">{{ definition(entry.id)?.title }}</p>
          <p class="toast-flavor">{{ definition(entry.id)?.flavor }}</p>
          <div class="toast-foot">
            <p class="toast-rarity">{{ rarityLabel(definition(entry.id)?.rarity) }}</p>
            <p class="toast-hint">點擊查看詳情</p>
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
    case 'gold': return '金色';
    case 'epic': return '史詩';
    case 'rare': return '稀有';
    default: return '普通';
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
  border-radius: 20px;
  border: 2px solid #e8dcc8;
  box-shadow: 0 4px 0 0 #e8dcc8, 0 8px 24px rgba(93, 64, 55, 0.15);
  background: #fdfdf5;
  overflow: hidden;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  color: #5d4037;
  cursor: pointer;
}

.toast::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #82d5bb, #5cb899);
}

.toast:hover {
  transform: translateY(-2px);
  border-color: #82d5bb;
  box-shadow: 0 5px 0 0 #64c4a3, 0 10px 28px rgba(130, 213, 187, 0.15);
}

.toast.rarity-rare {
  border-color: rgba(136, 157, 240, 0.5);
}

.toast.rarity-rare::before {
  background: linear-gradient(180deg, #889df0, #6478cc);
}

.toast.rarity-rare:hover {
  border-color: rgba(136, 157, 240, 0.8);
  box-shadow: 0 5px 0 0 rgba(100, 120, 204, 0.45), 0 10px 28px rgba(136, 157, 240, 0.18);
}

.toast.rarity-epic {
  border-color: rgba(183, 125, 238, 0.5);
}

.toast.rarity-epic::before {
  background: linear-gradient(180deg, #b77dee, #9558d6);
}

.toast.rarity-epic:hover {
  border-color: rgba(183, 125, 238, 0.8);
  box-shadow: 0 5px 0 0 rgba(149, 88, 214, 0.45), 0 10px 28px rgba(183, 125, 238, 0.18);
}

.toast.rarity-gold {
  border-color: rgba(247, 205, 103, 0.7);
  background: linear-gradient(180deg, #fff7dc, #f7eab4);
}

.toast.rarity-gold::before {
  width: 5px;
  background: linear-gradient(180deg, #f7cd67, #dba12e);
}

.toast.rarity-gold:hover {
  border-color: rgba(247, 205, 103, 1);
  box-shadow: 0 5px 0 0 rgba(219, 161, 46, 0.5), 0 10px 28px rgba(247, 205, 103, 0.2);
}

.toast-medal {
  width: 60px;
  flex: none;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f4e8;
  border: 2px solid #e8dcc8;
  box-shadow: 0 2px 0 0 #e8dcc8;
  position: relative;
  z-index: 1;
}

.toast.rarity-gold .toast-medal {
  background: linear-gradient(180deg, #fff7dc, #f7cd67);
  border-color: rgba(247, 205, 103, 0.7);
  box-shadow: 0 2px 0 0 rgba(219, 161, 46, 0.4);
}

.toast-icon-img {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.toast-icon-emoji {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 20px;
  background: #eae4d0;
  border: 2px solid #d4c9b4;
}

.toast.rarity-gold .toast-icon-emoji {
  background: radial-gradient(circle, #fff5c8, #ffd97a);
  border-color: #dba90e;
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
  color: #82d5bb;
  font-weight: 700;
}

.toast.rarity-rare .toast-label { color: #6478cc; }
.toast.rarity-epic .toast-label { color: #7d4fbb; }
.toast.rarity-gold .toast-label { color: #b07a18; }

.toast-title {
  margin-top: 2px;
  font-size: 15px;
  color: #5d4037;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.toast-flavor {
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.4;
  color: #a1887f;
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
  color: #a1887f;
  padding: 3px 8px;
  border-radius: 50px;
  background: #eae4d0;
}

.toast.rarity-rare .toast-rarity {
  color: #3a67a0;
  background: rgba(164, 206, 255, 0.4);
}

.toast.rarity-epic .toast-rarity {
  color: #7d4fbb;
  background: rgba(214, 186, 255, 0.4);
}

.toast.rarity-gold .toast-rarity {
  color: #8a5a0f;
  background: linear-gradient(180deg, #ffe7a2, #e9bd4f);
}

.toast-hint {
  font-size: 10px;
  letter-spacing: 0.04em;
  color: #a1887f;
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
