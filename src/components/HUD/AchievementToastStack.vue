<template>
  <div class="achievement-toast-stack">
    <transition-group name="achievement-toast">
      <button
        v-for="entry in visibleEntries"
        :key="entry.id"
        class="toast parchment grain"
        @click="openAchievement(entry.id)"
      >
        <span class="toast-icon">{{ definition(entry.id)?.icon || '🏆' }}</span>
        <div class="toast-copy">
          <p class="toast-label">成就达成</p>
          <p class="toast-title ink-title">{{ definition(entry.id)?.title }}</p>
          <p class="toast-flavor ink-subtle">{{ definition(entry.id)?.flavor }}</p>
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
  top: 18px;
  right: 18px;
  z-index: 125;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  width: 286px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  pointer-events: auto;
  border-radius: 12px;
  box-shadow: 0 16px 30px rgba(28, 18, 12, 0.22);
  background:
    linear-gradient(180deg, rgba(255, 249, 232, 0.76), rgba(240, 222, 186, 0.94)),
    linear-gradient(135deg, rgba(212, 168, 87, 0.18), rgba(176, 148, 201, 0.14));
}

.toast-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 23px;
  background: radial-gradient(circle, rgba(255, 239, 196, 0.98), rgba(208, 168, 87, 0.4));
  box-shadow: inset 0 0 0 1px rgba(148, 108, 42, 0.18);
}

.toast-copy {
  min-width: 0;
  flex: 1;
}

.toast-label,
.toast-title,
.toast-flavor {
  margin: 0;
}

.toast-label {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
}

.toast-title {
  margin-top: 2px;
  font-size: 15px;
}

.toast-flavor {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.45;
}

.achievement-toast-enter-active,
.achievement-toast-leave-active {
  transition: opacity 240ms ease, transform 240ms ease;
}

.achievement-toast-enter-from,
.achievement-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
