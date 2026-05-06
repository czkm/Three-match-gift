/**
 * Game state — Pinia store.
 *
 * Tracks progression through the 9-day campaign, daily resources and
 * step budget, ability charges, and the high-level UI phase.
 *
 * Phases:
 *   title      — landing screen with the gift dedication.
 *   intro      — day intro narration (typewriter).
 *   playing    — board is interactive.
 *   targeting  — waiting for an ability target click.
 *   repairing  — three-stage repair animation playing.
 *   dayEnd     — out of steps, gentle reminder before next morning.
 *   ending     — Yennefer arrives, gazebo cinematic.
 *   final      — frozen frame with the dedication.
 */
import { defineStore } from 'pinia';
import {
  DAYS, ABILITIES, RESOURCE_BY_ID, RESOURCE_BY_CHAR, DAY_END_LINES, ENDING
} from '@/data/content';

const MAX_STEPS = 20;

export const useGameStore = defineStore('game', {
  state: () => ({
    phase: 'title',
    currentDay: 0,                  // 0-indexed → DAYS[currentDay]
    stepsLeft: MAX_STEPS,
    progress: {},                   // resourceId → integer
    unlockedAbilities: [],
    abilityUses: {},                // abilityId → uses left this day
    pendingAbility: null,           // when phase === 'targeting'
    matchGroupsThisDay: 0,          // for agedBarrel passive

    // Narrative
    introShown: false,
    monologue: '',
    completedBanner: '',
    dayEndLine: '',
    latestRestoredBuildingId: null,
    pendingEstateRevealId: null,

    // Hints
    hintMove: null,                 // { a: {row,col}, b: {row,col} }

    // Ending personalisation
    giftText: ENDING.defaultGift
  }),

  getters: {
    today(state)        { return DAYS[state.currentDay]; },
    dayCount(state)     { return DAYS.length; },
    isLastDay(state)    { return state.currentDay >= DAYS.length - 1; },
    completedBuildingsCount(state) { return state.unlockedAbilities.length; },
    defaultEstateCaption(state) {
      return state.monologue || '风会先回来。然后是灯火、花香、还有住在这里的声音。';
    },

    /** Resource progress as { grape: { have, need, pct }, … } */
    repairView(state) {
      const day = DAYS[state.currentDay];
      if (!day) return [];
      return Object.entries(day.needs).map(([id, need]) => {
        const have = Math.min(state.progress[id] || 0, need);
        return { id, label: RESOURCE_BY_ID[id].cn, emoji: RESOURCE_BY_ID[id].emoji,
                 have, need, pct: need ? have / need : 1 };
      });
    },

    isComplete(state) {
      const day = DAYS[state.currentDay];
      if (!day) return false;
      for (const [id, need] of Object.entries(day.needs)) {
        if ((state.progress[id] || 0) < need) return false;
      }
      return true;
    },

    /** True while the lilacReturn passive should glow hint tiles. */
    showHints(state) {
      return state.unlockedAbilities.includes('lilacReturn') && state.stepsLeft <= 5;
    },

    activeAbilities(state) {
      return state.unlockedAbilities
        .map((id) => ABILITIES[id])
        .filter((a) => a.type === 'active');
    },
    passiveAbilities(state) {
      return state.unlockedAbilities
        .map((id) => ABILITIES[id])
        .filter((a) => a.type === 'passive');
    }
  },

  actions: {
    /* ---------- lifecycle ---------- */

    start() {
      this.currentDay = 0;
      this.stepsLeft = MAX_STEPS;
      this.progress = {};
      this.unlockedAbilities = [];
      this.abilityUses = {};
      this.pendingAbility = null;
      this.matchGroupsThisDay = 0;
      this.introShown = false;
      this.monologue = '';
      this.completedBanner = '';
      this.dayEndLine = '';
      this.latestRestoredBuildingId = null;
      this.pendingEstateRevealId = null;
      this.phase = 'intro';
    },

    showIntro()  { this.phase = 'intro'; },
    startPlay()  { this.phase = 'playing'; this.introShown = true; },

    nextDay() {
      this.currentDay++;
      this.stepsLeft = MAX_STEPS;
      this.progress = {};
      this.matchGroupsThisDay = 0;
      this.introShown = false;
      this._refreshAbilityUses();
      if (this.currentDay >= DAYS.length) {
        this.phase = 'final';
      } else {
        this.phase = 'intro';
      }
    },

    /* ---------- step + resource flow ---------- */

    consumeStep() {
      if (this.stepsLeft <= 0) return;
      this.stepsLeft--;
    },

    /** Add `n` steps, capped at MAX_STEPS. */
    recoverSteps(n) {
      this.stepsLeft = Math.min(MAX_STEPS, this.stepsLeft + n);
    },

    /**
     * resourcesByChar = { g: 4, w: 3, … } from board.tilesCleared.
     * groupSizes      = [3, 4, 5, …]   per matched run.
     * chain           = current cascade depth (1 = first hit, …)
     */
    gainResources(resourcesByChar, groupSizes = [], chain = 1) {
      const summary = {};
      const hasGreenhouse = this.unlockedAbilities.includes('greenhouseNurture');

      // Per-group bonus is hard to compute from a tile-count map, so we
      // approximate using the supplied groupSizes array. The board emits
      // both, so we can scale exactly per spec §5.2:
      //   3 → base, 4 → +1 same, 5+ → +3 same. Chain bonus +10% per layer.
      // Greenhouse passive: groups ≥4 get +50% on top.
      // Resources are awarded per group; we redistribute the char counts.
      let groupIdx = 0;
      const charBuckets = {};
      for (const ch in resourcesByChar) charBuckets[ch] = resourcesByChar[ch];

      // For groupSizes, we don't actually know which ch belongs to which
      // group — so we apply the bonuses as a single total scalar.
      let bonusMult = 1 + 0.10 * Math.max(0, chain - 1);
      let extraFlat = 0;
      let perGroupGreenhouseScale = 1;
      let perGroupBigScale = 1;

      // Walk the groups for diagnostic counters and to compute aggregate scales.
      let bigGroupCount = 0;     // 4+ groups
      let hugeGroupCount = 0;    // 5+ groups
      for (const sz of groupSizes) {
        groupIdx++;
        if (sz >= 5) { hugeGroupCount++; extraFlat += 3; }
        else if (sz === 4) { bigGroupCount++; extraFlat += 1; }
      }
      if (hasGreenhouse && (bigGroupCount + hugeGroupCount) > 0) {
        // Apply +50% to the portion that belongs to big groups.
        // Approximation: scale the whole haul proportionally.
        const totalCount = groupSizes.reduce((s, n) => s + n, 0) || 1;
        const bigShare = groupSizes.filter((n) => n >= 4).reduce((s, n) => s + n, 0) / totalCount;
        perGroupGreenhouseScale = 1 + 0.5 * bigShare;
      }

      const totalScale = bonusMult * perGroupGreenhouseScale * perGroupBigScale;

      for (const ch in charBuckets) {
        const r = RESOURCE_BY_CHAR[ch];
        if (!r) continue;
        let amount = charBuckets[ch] * totalScale;
        // Spread the flat extra across resource types proportionally.
        // (Simpler than tracking which group of which resource.)
      }

      // Compute totals per resource:
      const totalRaw = Object.values(charBuckets).reduce((s, n) => s + n, 0) || 1;
      for (const ch in charBuckets) {
        const r = RESOURCE_BY_CHAR[ch];
        if (!r) continue;
        const baseAmount = charBuckets[ch];
        const flatShare  = extraFlat * (baseAmount / totalRaw);
        const final = Math.ceil(baseAmount * totalScale + flatShare);
        this.progress[r.id] = (this.progress[r.id] || 0) + final;
        summary[r.id] = (summary[r.id] || 0) + final;
      }

      // agedBarrel passive: +1 step per 5 cleared groups.
      if (this.unlockedAbilities.includes('agedBarrel')) {
        this.matchGroupsThisDay += groupSizes.length;
        while (this.matchGroupsThisDay >= 5) {
          this.matchGroupsThisDay -= 5;
          this.recoverSteps(1);
        }
      }

      return summary;
    },

    /* ---------- repair completion ---------- */

    /** Called when the board finishes a swap and resources are checked. */
    onAfterMove() {
      if (this.isComplete) {
        this.phase = 'repairing';
        return 'complete';
      }
      if (this.stepsLeft <= 0) {
        this.dayEndLine = DAY_END_LINES[Math.floor(Math.random() * DAY_END_LINES.length)];
        this.phase = 'dayEnd';
        return 'dayEnd';
      }
      return 'continue';
    },

    finishRepair() {
      const day = DAYS[this.currentDay];
      this.unlockedAbilities.push(day.ability);
      this.completedBanner = day.completedBanner;
      this.monologue = day.monologue;
      this.latestRestoredBuildingId = day.building.id;
      this.pendingEstateRevealId = day.building.id;
      this._refreshAbilityUses();

      if (day.ending) {
        return 'ending';
      }
      return 'completed';
    },

    advanceFromRepair() {
      if (this.phase === 'ending' || this.phase === 'final') return;
      this.nextDay();
    },

    advanceFromDayEnd() {
      this.stepsLeft = MAX_STEPS;
      this.matchGroupsThisDay = 0;
      this.phase = 'playing';
    },

    markEstateRevealSeen(buildingId) {
      if (this.pendingEstateRevealId === buildingId) {
        this.pendingEstateRevealId = null;
      }
    },

    /* ---------- abilities ---------- */

    canUseAbility(id) {
      const ab = ABILITIES[id];
      if (!ab || ab.type !== 'active') return false;
      if (!this.unlockedAbilities.includes(id)) return false;
      if (this.phase !== 'playing' && this.phase !== 'targeting') return false;
      return (this.abilityUses[id] || 0) > 0;
    },

    beginTarget(id) {
      this.pendingAbility = id;
      this.phase = 'targeting';
    },

    cancelTarget() {
      this.pendingAbility = null;
      if (this.phase === 'targeting') this.phase = 'playing';
    },

    consumeAbility(id) {
      if (this.abilityUses[id] != null) this.abilityUses[id]--;
      this.pendingAbility = null;
      this.phase = 'playing';
    },

    /* ---------- gift text ---------- */

    setGiftText(t) {
      this.giftText = (t && t.trim()) || ENDING.defaultGift;
    },

    /* ---------- internals ---------- */

    _refreshAbilityUses() {
      const map = {};
      for (const id of this.unlockedAbilities) {
        const ab = ABILITIES[id];
        if (ab && ab.type === 'active') map[id] = ab.usesPerDay;
      }
      this.abilityUses = map;
    }
  }
});
