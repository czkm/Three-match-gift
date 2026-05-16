<template>
  <transition name="panel-fade">
    <div v-if="achievement.panelOpen" class="achievement-panel-overlay" @click="achievement.closePanel">
      <section class="achievement-panel" @click.stop>
        <header class="panel-head">
          <div>
            <p class="panel-eyebrow">成就册</p>
            <h3 class="panel-title ink-title">成就 {{ achievement.unlockedCount }} / {{ achievement.totalCount }}</h3>
          </div>
          <button class="panel-close" @click="achievement.closePanel">&times;</button>
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
  background: rgba(114, 93, 66, 0.45);
  backdrop-filter: blur(2px);
}

.achievement-panel {
  clip-path: url(#animal-modal-clip);
  background: rgb(247, 243, 223);
  width: min(920px, calc(100vw - 40px));
  max-height: calc(100vh - 60px);
  padding: 40px 36px 28px;
  overflow: auto;
  color: #725d42;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  box-shadow: 0 4px 10px rgba(107, 92, 67, 0.42);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.panel-eyebrow,
.panel-title {
  margin: 0;
}

.panel-eyebrow {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: #9f927d;
  text-transform: uppercase;
  font-weight: 600;
}

.panel-title {
  margin-top: 4px;
  font-size: 24px;
  color: #794f27;
  font-weight: 800;
}

.panel-close {
  width: 36px;
  height: 36px;
  border-radius: 50px;
  border: 2px solid #d4c9b4;
  background: rgb(247, 243, 223);
  color: #9f927d;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  box-shadow: 0 3px 0 0 #d4c9b4;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-close:hover {
  box-shadow: 0 4px 0 0 #d4c9b4;
  transform: translateY(-1px);
  color: #725d42;
}

.panel-close:active {
  box-shadow: 0 1px 0 0 #d4c9b4;
  transform: translateY(1px);
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.achievement-card {
  min-height: 152px;
  padding: 14px;
  border-radius: 12px;
  position: relative;
  background: #f8f8f0;
  border: 2px solid #d4c9b4;
  box-shadow: 0 3px 0 0 #d4c9b4;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 0 0 #d4c9b4;
}

.achievement-card.unlocked {
  border-color: #19c8b9;
  box-shadow: 0 3px 0 0 #11a89b;
}

.achievement-card.unlocked:hover {
  box-shadow: 0 5px 0 0 #11a89b;
}

.achievement-card.unlocked::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #19c8b9, #11a89b);
}

.achievement-card.rarity-rare.unlocked {
  border-color: rgba(94, 154, 226, 0.58);
  box-shadow: 0 3px 0 0 rgba(64, 116, 188, 0.4);
}

.achievement-card.rarity-rare.unlocked:hover {
  box-shadow: 0 5px 0 0 rgba(64, 116, 188, 0.4);
}

.achievement-card.rarity-rare.unlocked::before {
  background: linear-gradient(180deg, rgba(118, 188, 255, 0.98), rgba(64, 116, 188, 0.9));
}

.achievement-card.rarity-epic.unlocked {
  border-color: rgba(172, 124, 228, 0.62);
  box-shadow: 0 3px 0 0 rgba(114, 72, 176, 0.4);
}

.achievement-card.rarity-epic.unlocked:hover {
  box-shadow: 0 5px 0 0 rgba(114, 72, 176, 0.4);
}

.achievement-card.rarity-epic.unlocked::before {
  background: linear-gradient(180deg, rgba(206, 148, 255, 0.98), rgba(114, 72, 176, 0.92));
}

.achievement-card.rarity-gold.unlocked {
  border-color: rgba(235, 189, 84, 0.82);
  background: linear-gradient(180deg, #fff7dc, #ecdc8e);
  box-shadow: 0 3px 0 0 rgba(205, 142, 38, 0.4);
}

.achievement-card.rarity-gold.unlocked:hover {
  box-shadow: 0 5px 0 0 rgba(205, 142, 38, 0.4);
}

.achievement-card.rarity-gold.unlocked::before {
  width: 5px;
  background: linear-gradient(180deg, rgba(255, 226, 126, 1), rgba(205, 142, 38, 0.94));
}

.achievement-card.hidden {
  filter: saturate(0.46);
  opacity: 0.88;
}

.achievement-card.highlight {
  transform: translateY(-2px);
  border-color: #19c8b9;
  box-shadow:
    0 0 0 2px rgba(25, 200, 185, 0.18),
    0 5px 0 0 #11a89b;
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
  background: #f8f8f0;
  border: 2px solid #d4c9b4;
}

.rarity-rare .card-icon {
  background: rgba(234, 247, 255, 0.96);
  border-color: rgba(96, 154, 226, 0.3);
}

.rarity-epic .card-icon {
  background: rgba(246, 236, 255, 0.96);
  border-color: rgba(172, 124, 228, 0.3);
}

.rarity-gold .card-icon {
  background: rgba(255, 244, 204, 0.98);
  border-color: rgba(228, 186, 92, 0.4);
  box-shadow: 0 0 12px rgba(228, 186, 92, 0.18);
}

.card-tag {
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 50px;
  color: #9f927d;
  background: #f8f8f0;
  border: 1.5px solid #d4c9b4;
  font-weight: 600;
}

.card-rarity {
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 50px;
  color: #9f927d;
  background: #eae4d0;
  font-weight: 600;
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
  color: #794f27;
  font-weight: 700;
}

.card-description {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: #9f927d;
  font-weight: 500;
}

.card-flavor {
  margin-top: 8px;
  line-height: 1.45;
  color: #8a7b66;
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
