<template>
  <transition name="panel-fade">
    <div v-if="achievement.panelOpen" class="achievement-panel-overlay" @click="closePanel">
      <section class="achievement-panel" @click.stop>
        <header class="panel-head">
          <div class="panel-title-group">
            <span class="panel-leaf">🍃</span>
            <div>
              <p class="panel-eyebrow">哩程</p>
              <h3 class="panel-title">{{ achievement.unlockedCount }} / {{ achievement.totalCount }}</h3>
            </div>
          </div>
          <button class="panel-close" @click="closePanel">&times;</button>
        </header>

        <div class="achievement-grid">
          <article
            v-for="item in renderedItems"
            :key="item.id"
            class="achievement-card"
            :class="[
              `rarity-${item.rarity}`,
              { unlocked: item.unlocked, masked: item.masked, highlight: item.id === achievement.highlightId }
            ]"
          >
            <div class="card-icon-wrap">
              <img
                v-if="item.unlocked && item.iconFile && !achievementImgErrors[item.id]"
                :src="`/img/achievements/${item.iconFile}.png`"
                :alt="item.title"
                class="card-icon-img"
                @error="achievementImgErrors[item.id] = true"
              >
              <span v-else class="card-icon-emoji">{{ item.masked ? '🍂' : item.icon }}</span>
            </div>
            <div class="card-body">
              <div class="card-header">
                <p class="card-title">{{ item.title }}</p>
                <div class="card-badges">
                  <span class="card-tag">{{ item.tag }}</span>
                  <span class="card-rarity">{{ rarityLabel(item.rarity) }}</span>
                </div>
              </div>
              <p class="card-description">{{ item.description }}</p>
              <p v-if="item.unlocked && !item.masked" class="card-flavor">{{ item.flavor }}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  </transition>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useAchievementStore } from '@/stores/achievementStore';
import { audioManager } from '@/audio/AudioManager';

const achievement = useAchievementStore();
const achievementImgErrors = ref({});

const renderedItems = computed(() => achievement.orderedAchievements.map((item) => {
  const unlocked = achievement.unlockedSet.has(item.id);
  const masked = item.hidden && !unlocked;
  const dayMatch = item.id.match(/^day(\d+)_/);
  return {
    ...item,
    unlocked,
    masked,
    title: masked ? '？？？' : item.title,
    description: masked ? '繼續在果園裡探索狸～' : item.description,
    flavor: item.flavor,
    iconFile: item.iconFile || null,
    tag: dayMatch ? `第 ${dayMatch[1]} 天` : '通用',
    rarity: item.rarity || 'common'
  };
}));

function rarityLabel(rarity) {
  switch (rarity) {
    case 'gold': return '金色';
    case 'epic': return '史詩';
    case 'rare': return '稀有';
    default: return '普通';
  }
}

function closePanel() {
  audioManager.playSFX('dialogclose')
  achievement.closePanel()
}

function onWindowKeydown(event) {
  if (event.key !== 'Escape') return;
  closePanel();
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
  background: rgba(93, 64, 55, 0.38);
  backdrop-filter: blur(3px);
}

.achievement-panel {
  background: #F8F4E8;
  width: min(880px, calc(100vw - 40px));
  max-height: calc(100vh - 60px);
  padding: 32px 32px 20px;
  border-radius: 48px;
  overflow: auto;
  color: #5d4037;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  box-shadow: 0 8px 32px rgba(93, 64, 55, 0.2);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.panel-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-leaf {
  font-size: 32px;
  line-height: 1;
}

.panel-eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: #a1887f;
  text-transform: uppercase;
  font-weight: 700;
}

.panel-title {
  margin: 2px 0 0;
  font-size: 22px;
  color: #5d4037;
  font-weight: 800;
}

.panel-close {
  width: 36px;
  height: 36px;
  border-radius: 50px;
  border: 2px solid #d4c9b4;
  background: rgb(247, 243, 223);
  color: #a1887f;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 3px 0 0 #d4c9b4;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-close:hover {
  box-shadow: 0 4px 0 0 #d4c9b4;
  transform: translateY(-1px);
  color: #5d4037;
}

.panel-close:active {
  box-shadow: 0 1px 0 0 #d4c9b4;
  transform: translateY(1px);
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.achievement-card {
  display: flex;
  gap: 14px;
  padding: 14px;
  border-radius: 20px;
  background: #fdfdf5;
  border: 2px solid #e8dcc8;
  box-shadow: 0 3px 0 0 #e8dcc8;
  position: relative;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.achievement-card:hover {
  transform: translateY(-2px);
}

.achievement-card.unlocked {
  border-color: #82d5bb;
  box-shadow: 0 3px 0 0 #64c4a3;
}

.achievement-card.unlocked:hover {
  box-shadow: 0 5px 0 0 #64c4a3;
}

.achievement-card.masked {
  filter: saturate(0.4);
  opacity: 0.75;
}

.achievement-card.highlight {
  transform: translateY(-2px);
  border-color: #82d5bb;
  box-shadow: 0 0 0 3px rgba(130, 213, 187, 0.25), 0 5px 0 0 #64c4a3;
}

/* Left rarity strip */
.achievement-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.achievement-card.rarity-common.unlocked::before {
  background: linear-gradient(180deg, #82d5bb, #5cb899);
}

.achievement-card.rarity-rare.unlocked::before {
  background: linear-gradient(180deg, #889df0, #6478cc);
}

.achievement-card.rarity-epic.unlocked::before {
  background: linear-gradient(180deg, #b77dee, #9558d6);
}

.achievement-card.rarity-gold.unlocked::before {
  width: 5px;
  background: linear-gradient(180deg, #f7cd67, #dba12e);
}

/* Icon area */
.card-icon-wrap {
  width: 64px;
  height: 64px;
  flex: none;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f4e8;
  border: 2px solid #e8dcc8;
  overflow: hidden;
}

.achievement-card.unlocked .card-icon-wrap {
  border-color: transparent;
  background: rgba(130, 213, 187, 0.12);
}

.achievement-card.rarity-rare.unlocked .card-icon-wrap {
  background: rgba(136, 157, 240, 0.12);
}

.achievement-card.rarity-epic.unlocked .card-icon-wrap {
  background: rgba(183, 125, 238, 0.12);
}

.achievement-card.rarity-gold.unlocked .card-icon-wrap {
  background: rgba(247, 205, 103, 0.18);
}

.card-icon-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.card-icon-emoji {
  font-size: 28px;
  line-height: 1;
}

/* Card body */
.card-body {
  flex: 1;
  min-width: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.card-title {
  margin: 0;
  font-size: 15px;
  color: #5d4037;
  font-weight: 700;
  line-height: 1.3;
}

.masked .card-title {
  color: #a1887f;
}

.card-badges {
  display: flex;
  gap: 5px;
  flex: none;
}

.card-tag {
  font-size: 9px;
  padding: 3px 7px;
  border-radius: 50px;
  background: #eae4d0;
  color: #a1887f;
  font-weight: 700;
  white-space: nowrap;
}

.card-rarity {
  font-size: 9px;
  padding: 3px 7px;
  border-radius: 50px;
  font-weight: 700;
  white-space: nowrap;
  background: #eae4d0;
  color: #a1887f;
}

.rarity-rare.unlocked .card-rarity {
  color: #3a67a0;
  background: rgba(164, 206, 255, 0.45);
}

.rarity-epic.unlocked .card-rarity {
  color: #7d4fbb;
  background: rgba(214, 186, 255, 0.45);
}

.rarity-gold.unlocked .card-rarity {
  color: #8a5a0f;
  background: linear-gradient(180deg, #ffe7a2, #e9bd4f);
}

.card-description {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #a1887f;
  font-weight: 500;
}

.masked .card-description {
  color: #b8a99a;
}

.card-flavor {
  margin: 8px 0 0;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.45;
  color: #8d6e63;
  background: rgba(130, 213, 187, 0.08);
  border-radius: 10px;
  border-left: 3px solid #82d5bb;
}

.rarity-rare.unlocked .card-flavor {
  background: rgba(136, 157, 240, 0.08);
  border-left-color: #889df0;
}

.rarity-epic.unlocked .card-flavor {
  background: rgba(183, 125, 238, 0.08);
  border-left-color: #b77dee;
}

.rarity-gold.unlocked .card-flavor {
  background: rgba(247, 205, 103, 0.12);
  border-left-color: #f7cd67;
}

/* Transition */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 260ms cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .achievement-grid {
    grid-template-columns: 1fr;
  }

  .achievement-panel {
    padding: 24px 16px 16px;
    border-radius: 32px;
  }
}
</style>
