<template>
  <transition name="panel-fade">
    <div v-if="achievement.panelOpen" class="achievement-panel-overlay" @click="achievement.closePanel">
      <section class="achievement-panel parchment grain" @click.stop>
        <header class="panel-head">
          <div>
            <p class="panel-eyebrow">Steam 风格成就册</p>
            <h3 class="panel-title ink-title">成就 {{ achievement.unlockedCount }} / {{ achievement.totalCount }}</h3>
          </div>
          <button class="panel-close" @click="achievement.closePanel">关闭</button>
        </header>

        <div class="achievement-grid">
          <article
            v-for="item in renderedItems"
            :key="item.id"
            class="achievement-card"
            :class="[
              `rarity-${item.rarity}`,
              { unlocked: item.unlocked, hidden: item.masked, highlight: item.id === achievement.highlightId }
            ]"
          >
            <div class="card-top">
              <span class="card-icon">{{ item.icon }}</span>
              <div class="card-tags">
                <span class="card-tag">{{ item.tag }}</span>
                <span class="card-rarity">{{ rarityLabel(item.rarity) }}</span>
              </div>
            </div>
            <p class="card-title ink-title">{{ item.title }}</p>
            <p class="card-description">{{ item.description }}</p>
            <p v-if="item.unlocked" class="card-flavor ink-subtle">{{ item.flavor }}</p>
          </article>
        </div>
      </section>
    </div>
  </transition>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useAchievementStore } from '@/stores/achievementStore';

const achievement = useAchievementStore();

const renderedItems = computed(() => achievement.orderedAchievements.map((item) => {
  const unlocked = achievement.unlockedSet.has(item.id);
  const masked = item.hidden && !unlocked;
  const dayMatch = item.id.match(/^day(\d+)_/);
  return {
    ...item,
    unlocked,
    masked,
    icon: masked ? '❔' : item.icon,
    title: masked ? '？？？' : item.title,
    description: masked ? '继续在庄园里探索。' : item.description,
    flavor: item.flavor,
    tag: dayMatch ? `第 ${dayMatch[1]} 天` : '通用',
    rarity: item.rarity || 'common'
  };
}));

function rarityLabel(rarity) {
  switch (rarity) {
    case 'gold': return '金色';
    case 'epic': return '史诗';
    case 'rare': return '稀有';
    default: return '普通';
  }
}

function onWindowKeydown(event) {
  if (event.key !== 'Escape') return;
  achievement.closePanel();
}

onMounted(() => {
  window.addEventListener('keydown', onWindowKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onWindowKeydown);
});
</script>

<style scoped>
.achievement-panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 124;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 50% 22%, rgba(120, 152, 192, 0.14), rgba(12, 16, 24, 0.88)),
    radial-gradient(circle at 78% 78%, rgba(176, 148, 201, 0.06), transparent 30%);
  backdrop-filter: blur(5px);
}

.achievement-panel {
  width: min(920px, calc(100vw - 40px));
  max-height: calc(100vh - 60px);
  padding: 26px 26px 22px;
  overflow: auto;
  border-radius: var(--radius-lg);
  box-shadow:
    var(--surface-shadow),
    0 0 0 1px rgba(255, 242, 214, 0.08);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-eyebrow,
.panel-title {
  margin: 0;
}

.panel-eyebrow {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--ink-faint);
  text-transform: uppercase;
}

.panel-title {
  margin-top: 4px;
  font-size: 24px;
}

.panel-close {
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  background: rgba(255, 248, 230, 0.52);
  border: 1px solid rgba(92, 60, 28, 0.2);
  font-weight: 600;
  font-size: 13px;
  transition: transform 160ms var(--ease-out-expo), background 160ms var(--ease-out-expo), box-shadow 160ms var(--ease-out-expo);
}
.panel-close:hover {
  transform: translateY(-1px);
  background: rgba(255, 248, 230, 0.72);
  box-shadow: 0 6px 14px rgba(28, 18, 12, 0.12);
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.achievement-card {
  min-height: 152px;
  padding: 14px;
  border-radius: var(--radius-md);
  position: relative;
  background:
    linear-gradient(180deg, rgba(255, 248, 230, 0.52), rgba(228, 206, 166, 0.42)),
    rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(92, 60, 28, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 244, 214, 0.16);
  transition: transform 200ms var(--ease-out-expo), box-shadow 200ms var(--ease-out-expo), border-color 200ms var(--ease-out-expo);
  overflow: hidden;
}
.achievement-card:hover {
  transform: translateY(-2px);
}

.achievement-card.unlocked {
  border-color: rgba(118, 136, 158, 0.32);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 0 1px rgba(164, 182, 206, 0.08),
    0 10px 18px rgba(28, 18, 12, 0.08);
}

.achievement-card.unlocked::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, rgba(122, 146, 175, 0.96), rgba(82, 100, 126, 0.86));
}

.achievement-card.unlocked::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 13px;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(210, 220, 234, 0.05);
}

.achievement-card.rarity-rare.unlocked {
  border-color: rgba(94, 154, 226, 0.58);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 0 1px rgba(120, 182, 255, 0.08),
    0 10px 18px rgba(20, 34, 54, 0.12);
}

.achievement-card.rarity-rare.unlocked::before {
  background: linear-gradient(180deg, rgba(118, 188, 255, 0.98), rgba(64, 116, 188, 0.9));
}

.achievement-card.rarity-epic.unlocked {
  border-color: rgba(172, 124, 228, 0.62);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 0 1px rgba(196, 144, 255, 0.1),
    0 12px 20px rgba(42, 20, 58, 0.14);
}

.achievement-card.rarity-epic.unlocked::before {
  background: linear-gradient(180deg, rgba(206, 148, 255, 0.98), rgba(114, 72, 176, 0.92));
}

.achievement-card.rarity-gold.unlocked {
  border-color: rgba(235, 189, 84, 0.82);
  box-shadow:
    0 0 0 1px rgba(228, 186, 92, 0.18),
    0 14px 24px rgba(46, 32, 12, 0.16),
    inset 0 1px 0 rgba(255, 244, 214, 0.24),
    inset 0 0 0 1px rgba(255, 218, 132, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 247, 220, 0.7), rgba(236, 208, 142, 0.54)),
    rgba(255, 255, 255, 0.18);
}

.achievement-card.rarity-gold.unlocked::before {
  width: 5px;
  background: linear-gradient(180deg, rgba(255, 226, 126, 1), rgba(205, 142, 38, 0.94));
}

.achievement-card.rarity-gold.unlocked::after {
  box-shadow:
    inset 0 0 0 1px rgba(255, 224, 142, 0.18),
    inset 0 12px 16px rgba(255, 242, 196, 0.08);
}

.achievement-card.hidden {
  filter: saturate(0.46);
  opacity: 0.88;
}

.achievement-card.highlight {
  transform: translateY(-2px);
  border-color: rgba(118, 170, 224, 0.78);
  box-shadow:
    0 0 0 2px rgba(118, 170, 224, 0.18),
    0 14px 24px rgba(28, 18, 12, 0.12);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-tags {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 22px;
  background: linear-gradient(180deg, rgba(245, 248, 252, 0.9), rgba(198, 208, 224, 0.6));
  border: 1px solid rgba(154, 170, 192, 0.2);
}

.rarity-rare .card-icon {
  background: linear-gradient(180deg, rgba(234, 247, 255, 0.96), rgba(174, 214, 255, 0.62));
  border-color: rgba(96, 154, 226, 0.24);
}

.rarity-epic .card-icon {
  background: linear-gradient(180deg, rgba(246, 236, 255, 0.96), rgba(214, 182, 255, 0.62));
  border-color: rgba(172, 124, 228, 0.24);
}

.rarity-gold .card-icon {
  background: linear-gradient(180deg, rgba(255, 244, 204, 0.98), rgba(255, 210, 112, 0.72));
  border-color: rgba(228, 186, 92, 0.32);
  box-shadow: 0 0 12px rgba(228, 186, 92, 0.18);
}

.card-tag {
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 999px;
  color: var(--ink-faint);
  background: rgba(255, 248, 230, 0.62);
}

.card-rarity {
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 999px;
  color: #6d7d92;
  background: rgba(222, 232, 245, 0.58);
}

.rarity-rare .card-rarity {
  color: #2d5f92;
  background: rgba(164, 206, 255, 0.52);
}

.rarity-epic .card-rarity {
  color: #6f47a8;
  background: rgba(214, 186, 255, 0.52);
}

.rarity-gold .card-rarity {
  color: #8a5a0f;
  background: linear-gradient(180deg, rgba(255, 231, 162, 0.92), rgba(233, 189, 79, 0.88));
}

.card-title,
.card-description,
.card-flavor {
  margin: 0;
}

.card-title {
  font-size: 15px;
}

.card-description {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink-soft);
}

.card-flavor {
  margin-top: 8px;
  line-height: 1.45;
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 260ms var(--ease-out-expo);
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .achievement-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
