import { defineStore } from 'pinia';
import { ACHIEVEMENTS } from '@/data/content';

const STORAGE_KEY = 'corvo-bianco.achievements.v1';
const STORAGE_VERSION = 1;
const ACHIEVEMENT_INDEX = Object.fromEntries(ACHIEVEMENTS.map((item) => [item.id, item]));

function createDefaultStats() {
  return {
    byDay: {},
    whiteRavenClicks: 0
  };
}

function ensureDayStats(stats, day) {
  if (!stats.byDay[day]) {
    stats.byDay[day] = {
      usedAbilities: [],
      hadBigMatch: false,
      hadCombo2Plus: false,
      clearedMonsterKinds: [],
      reachedZeroSteps: false
    };
  }
  return stats.byDay[day];
}

function mergeStats(raw) {
  const base = createDefaultStats();
  if (!raw || typeof raw !== 'object') return base;
  base.whiteRavenClicks = Number(raw.whiteRavenClicks) || 0;
  if (raw.byDay && typeof raw.byDay === 'object') {
    for (const [dayKey, value] of Object.entries(raw.byDay)) {
      const dayStats = ensureDayStats(base, dayKey);
      if (Array.isArray(value?.usedAbilities)) dayStats.usedAbilities = [...new Set(value.usedAbilities)];
      dayStats.hadBigMatch = Boolean(value?.hadBigMatch);
      dayStats.hadCombo2Plus = Boolean(value?.hadCombo2Plus);
      if (Array.isArray(value?.clearedMonsterKinds)) dayStats.clearedMonsterKinds = [...new Set(value.clearedMonsterKinds)];
      dayStats.reachedZeroSteps = Boolean(value?.reachedZeroSteps);
    }
  }
  return base;
}

export const useAchievementStore = defineStore('achievements', {
  state: () => ({
    initialized: false,
    unlockedIds: [],
    unlockQueue: [],
    panelOpen: false,
    highlightId: null,
    disabledForRun: false,
    disabledReason: '',
    stats: createDefaultStats()
  }),

  getters: {
    achievementList() {
      return ACHIEVEMENTS;
    },
    totalCount() {
      return ACHIEVEMENTS.length;
    },
    unlockedCount(state) {
      return state.unlockedIds.length;
    },
    unlockedSet(state) {
      return new Set(state.unlockedIds);
    },
    orderedAchievements(state) {
      const unlocked = new Set(state.unlockedIds);
      const rank = (id) => state.unlockedIds.indexOf(id);
      return [...ACHIEVEMENTS].sort((a, b) => {
        const aUnlocked = unlocked.has(a.id);
        const bUnlocked = unlocked.has(b.id);
        if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
        if (aUnlocked && bUnlocked) return rank(a.id) - rank(b.id);
        return ACHIEVEMENTS.indexOf(a) - ACHIEVEMENTS.indexOf(b);
      });
    }
  },

  actions: {
    init() {
      if (this.initialized) return;
      this.initialized = true;
      if (typeof window === 'undefined') return;

      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.version !== STORAGE_VERSION) return;
        this.unlockedIds = Array.isArray(parsed.unlockedIds)
          ? parsed.unlockedIds.filter((id) => ACHIEVEMENT_INDEX[id])
          : [];
        this.stats = mergeStats(parsed.stats);
      } catch (error) {
        console.warn('[achievements] failed to load saved data:', error);
        this.unlockedIds = [];
        this.stats = createDefaultStats();
      }
    },

    persist() {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          version: STORAGE_VERSION,
          unlockedIds: this.unlockedIds,
          stats: this.stats
        }));
      } catch (error) {
        console.warn('[achievements] failed to persist data:', error);
      }
    },

    resetRunTracking() {
      this.disabledForRun = false;
      this.disabledReason = '';
      this.stats.byDay = {};
    },

    startDay(day) {
      if (this.disabledForRun) return;
      ensureDayStats(this.stats, day);
      this.persist();
    },

    openPanel(highlightId = null) {
      this.panelOpen = true;
      this.highlightId = highlightId;
    },

    closePanel() {
      this.panelOpen = false;
      this.highlightId = null;
    },

    consumeToast(id) {
      this.unlockQueue = this.unlockQueue.filter((item) => item.id !== id);
    },

    disableForCurrentRun(reason) {
      this.disabledForRun = true;
      this.disabledReason = reason || 'unknown';
    },

    unlock(id) {
      if (!ACHIEVEMENT_INDEX[id]) return false;
      if (this.unlockedIds.includes(id)) return false;
      this.unlockedIds = [...this.unlockedIds, id];
      this.unlockQueue.push({
        id,
        unlockedAt: Date.now()
      });
      this.persist();
      return true;
    },

    unlockForTesting(id) {
      if (!ACHIEVEMENT_INDEX[id]) return false;
      return this.unlock(id);
    },

    clearAllForTesting() {
      this.unlockedIds = [];
      this.unlockQueue = [];
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          console.warn('[achievements] failed to clear data:', error);
        }
      }
    },

    track(event, payload = {}) {
      if (this.disabledForRun && event !== 'runStart') return;

      switch (event) {
        case 'runStart':
          this.resetRunTracking();
          return;
        case 'dayStart':
          this.startDay(payload.day);
          return;
        case 'abilityUsed':
          this._trackAbilityUsed(payload);
          return;
        case 'comboResolved':
          this._trackComboResolved(payload);
          return;
        case 'monsterCleared':
          this._trackMonsterCleared(payload);
          return;
        case 'dayEndReached':
          this._trackDayEndReached(payload);
          return;
        case 'dayCompleted':
          this._trackDayCompleted(payload);
          return;
        case 'endingSeen':
          this.unlock('day9_room_for_her');
          this.unlock('love_from_xiaokun');
          return;
        case 'hotspotClicked':
          this._trackHotspotClicked(payload);
          return;
        default:
          return;
      }
    },

    _trackAbilityUsed({ day, id }) {
      if (!day || !id) return;
      const dayStats = ensureDayStats(this.stats, day);
      if (!dayStats.usedAbilities.includes(id)) dayStats.usedAbilities.push(id);
      this.persist();
    },

    _trackComboResolved({ day, chain = 1, groupSizes = [] }) {
      if (day) {
        const dayStats = ensureDayStats(this.stats, day);
        if (chain >= 2) dayStats.hadCombo2Plus = true;
        if (groupSizes.some((size) => size >= 4)) dayStats.hadBigMatch = true;
      }

      if (chain >= 3) this.unlock('cascade_poetry');
      if (groupSizes.some((size) => size >= 5)) this.unlock('grand_harvest');
      this.persist();
    },

    _trackMonsterCleared({ day, kinds = [] }) {
      if (!day || !kinds.length) return;
      const dayStats = ensureDayStats(this.stats, day);
      for (const kind of kinds) {
        if (!dayStats.clearedMonsterKinds.includes(kind)) dayStats.clearedMonsterKinds.push(kind);
      }
      this.persist();
    },

    _trackDayEndReached({ day }) {
      if (!day) return;
      const dayStats = ensureDayStats(this.stats, day);
      dayStats.reachedZeroSteps = true;
      this.persist();
    },

    _trackDayCompleted({ day, stepsLeft = 0 }) {
      if (!day) return;
      const dayStats = ensureDayStats(this.stats, day);

      if (day === 1 && !dayStats.usedAbilities.includes('whiteWolfTidy')) {
        this.unlock('day1_clear_the_way');
      }
      if (day === 2 && dayStats.hadBigMatch) {
        this.unlock('day2_vines_remember');
      }
      if (day === 3 && dayStats.clearedMonsterKinds.includes('drowner')) {
        this.unlock('day3_one_bottle_saved');
      }
      if (day === 4 && dayStats.usedAbilities.includes('roachPath')) {
        this.unlock('day4_roach_approves');
      }
      if (day === 5 && stepsLeft >= 6) {
        this.unlock('day5_lilac_in_the_wind');
      }
      if (day === 6 && (dayStats.hadCombo2Plus || dayStats.hadBigMatch)) {
        this.unlock('day6_keep_the_lamp_warm');
      }
      if (day === 7 && dayStats.usedAbilities.includes('toussentSunset')) {
        this.unlock('day7_a_chair_for_waiting');
      }
      if (day === 8 && !dayStats.reachedZeroSteps) {
        this.unlock('day8_the_soup_will_hold');
      }

      if (stepsLeft >= 10) this.unlock('sunlit_margin');
      if (stepsLeft <= 5) this.unlock('clutch_finish');
      this.persist();
    },

    _trackHotspotClicked({ id }) {
      if (id !== 'white-raven') return;
      this.stats.whiteRavenClicks += 1;
      this.persist();
    }
  }
});
