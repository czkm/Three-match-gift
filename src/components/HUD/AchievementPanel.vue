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
            :class="[{ unlocked: item.unlocked, hidden: item.masked, highlight: item.id === achievement.highlightId }]"
          >
            <div class="card-top">
              <span class="card-icon">{{ item.icon }}</span>
              <span class="card-tag">{{ item.tag }}</span>
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
    tag: dayMatch ? `第 ${dayMatch[1]} 天` : '通用'
  };
}));

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
  background: radial-gradient(circle at 50% 22%, rgba(255, 224, 170, 0.12), rgba(20, 12, 8, 0.8));
  backdrop-filter: blur(4px);
}

.achievement-panel {
  width: min(920px, calc(100vw - 40px));
  max-height: calc(100vh - 60px);
  padding: 24px 24px 20px;
  overflow: auto;
  border-radius: 16px;
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
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(255, 248, 230, 0.48);
  border: 1px solid rgba(92, 60, 28, 0.18);
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.achievement-card {
  min-height: 152px;
  padding: 14px;
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 248, 230, 0.52), rgba(228, 206, 166, 0.42)),
    rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(92, 60, 28, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 244, 214, 0.16);
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.achievement-card.unlocked {
  border-color: rgba(208, 168, 87, 0.34);
  box-shadow:
    inset 0 1px 0 rgba(255, 244, 214, 0.2),
    0 10px 18px rgba(28, 18, 12, 0.08);
}

.achievement-card.hidden {
  filter: saturate(0.46);
  opacity: 0.88;
}

.achievement-card.highlight {
  transform: translateY(-1px);
  border-color: rgba(176, 148, 201, 0.72);
  box-shadow:
    0 0 0 2px rgba(176, 148, 201, 0.18),
    0 12px 20px rgba(28, 18, 12, 0.1);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 22px;
  background: rgba(255, 250, 238, 0.62);
}

.card-tag {
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 999px;
  color: var(--ink-faint);
  background: rgba(255, 248, 230, 0.62);
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
  transition: opacity 220ms ease;
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
