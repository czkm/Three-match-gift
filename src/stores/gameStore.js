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
 *   awakening  — board-bound djinn wake effect.
 *   wish       — djinn wish narrative card.
 *   dayEnd     — out of steps, gentle reminder before next morning.
 *   ending     — Yennefer arrives, gazebo cinematic.
 *   final      — frozen frame with the dedication.
 */
import { defineStore } from 'pinia';
import { audioManager } from '@/audio/AudioManager';
import { COMMON_COPY, GAMEPLAY_COPY, formatMaxStepPenalty, formatNextDayStepPenalty } from '@/data/copy';
import EventBus from '@/core/eventBus';
import { useAchievementStore } from '@/stores/achievementStore';
import {
  DAYS,
  ABILITIES,
  RESOURCE_BY_ID,
  RESOURCE_BY_CHAR,
  DAY_END_LINES,
  ENDING,
  MONSTER_CHARS,
  MONSTERS,
  DAY_MONSTER_LAYOUTS,
  BARREN_GRAVE_LAYOUTS,
  DJINN_WISHES,
  DJINN_CEREMONY_LAYOUTS,
  DJINN_MARK_SETS,
  DJINN_STAGE_TRANSITIONS,
  ROT_CHAR,
  PIG_RATING,
  PIG_REACTIONS,
  REWARD_ITEMS,
  unlockedCharsForDay
} from '@/data/content';

const MAX_STEPS = 20;
const BOARD_ROWS = 8;
const BOARD_COLS = 8;
const FIXED_REWARD_OFFERS = {
  1: { treasure: ['styeTreasure'], devil: ['styeDevil'] },
  2: { treasure: ['luckyFoot'], devil: ['brimstone', 'momsKnife'] },
  3: { treasure: ['lunch'], devil: ['thePact', 'deadCat'] },
  4: { treasure: ['sackOfPennies'], devil: ['pentagram', 'guppysPaw'] },
  5: { treasure: ['battery'], devil: ['blackCandle', 'whoreOfBabylon'] },
  6: { treasure: ['holyWater'], devil: ['abaddon', 'mawOfTheVoid'] },
  7: { treasure: ['compass'], devil: ['eyeOfBelial', 'theMark'] },
  8: { treasure: ['momsKey'], devil: ['sacrificialDagger', 'littleBrimstone'] }
};

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

    // Isaac-style reward rooms
    ownedItems: [],
    claimedRewardDays: [],
    pendingRewardDay: null,
    pendingRewardOffer: null,
    seenRewardItemIds: [],
    nextDayStepPenalty: 0,
    maxStepPenalty: 0,
    itemFlags: {},
    roomHistory: [],

    // Narrative
    introShown: false,
    monologue: '',
    completedBanner: '',
    dayEndLine: '',
    latestRestoredBuildingId: null,
    pendingEstateRevealId: null,
    turnId: 0,
    skipMonsterPressureTurn: null,

    // Hints
    hintMove: null,                 // { a: {row,col}, b: {row,col} }

    // Ending personalisation
    giftText: ENDING.defaultGift,
    giftAttemptedText: '',
    giftWasOverridden: false,

    // Board entities + bark lines
    boardEntities: [],
    monsterTiles: [],
    rotCells: [],
    barkLine: '',
    barkNonce: 0,
    inspectedMonster: null,        // { kind, entityId, source }
    inspectedRewardItem: null,     // { itemId, source }

    // Day-specific modifiers
    needOverrides: {},
    dayBuffs: {
      extraResourcePerType: false
    },
    pigEnergy: 0,
    pigLastRating: null,
    pigEnergyBeforeAward: 0,
    pigMoodVisible: false,
    pigMoodShownDay: null,
    pigClickCount: 0,
    pigAngryThreshold: 6,
    pigAngryUsedDay: null,

    // Day 9 djinn / wish state
    djinnHintVisible: false,
    djinnReleased: false,
    djinnState: 'idle',
    djinnStage: 0,
    djinnUnlimitedSteps: false,
    djinnLayoutId: null,
    djinnObjective: null,
    djinnMarks: [],
    djinnCakeLayer: 0,
    djinnPendingResolve: false,
    djinnCardNonce: 0,
    djinnRepairCommitted: false,
    djinnTransition: null
  }),

  getters: {
    today(state)        { return DAYS[state.currentDay]; },
    dayCount(state)     { return DAYS.length; },
    effectiveMaxSteps(state) { return Math.max(14, MAX_STEPS - state.maxStepPenalty); },
    ownedItemIds(state) { return state.ownedItems.map((item) => item.id); },
    currentRewardOffer(state) {
      const offer = state.pendingRewardOffer;
      if (!offer) return null;
      return {
        day: offer.day,
        treasure: (offer.treasure || []).map((id) => REWARD_ITEMS[id]).filter(Boolean),
        devil: (offer.devil || []).map((id) => REWARD_ITEMS[id]).filter(Boolean)
      };
    },
    activePenaltySummary(state) {
      const parts = [];
      if (state.nextDayStepPenalty > 0) parts.push(formatNextDayStepPenalty(state.nextDayStepPenalty));
      if (state.maxStepPenalty > 0) parts.push(formatMaxStepPenalty(state.maxStepPenalty));
      return {
        nextDaySteps: state.nextDayStepPenalty,
        maxSteps: state.maxStepPenalty,
        text: parts.join(' · ')
      };
    },
    isLastDay(state)    { return state.currentDay >= DAYS.length - 1; },
    completedBuildingsCount(state) { return state.unlockedAbilities.length; },
    repairProgressPct(state) {
      const day = DAYS[state.currentDay];
      if (!day) return 0;
      const needs = Object.entries(day.needs);
      if (!needs.length) return 0;
      const total = needs.reduce((sum, [, need]) => sum + need, 0);
      const have = needs.reduce((sum, [id, need]) => sum + Math.min(state.progress[id] || 0, state.needOverrides[id] ?? need), 0);
      return total ? have / total : 0;
    },
    defaultEstateCaption(state) {
      return state.monologue || '风会先回来。然后是灯火、花香、还有住在这里的声音。';
    },
    activeBoardEntities(state) {
      return state.boardEntities.filter((e) => !e.removed);
    },
    blockedCellKeys(state) {
      const keys = [];
      for (const entity of state.boardEntities) {
        if (entity.removed) continue;
        const width = entity.width || 1;
        const height = entity.height || 1;
        for (let dr = 0; dr < height; dr++) {
          for (let dc = 0; dc < width; dc++) {
            keys.push(`${entity.row + dr}:${entity.col + dc}`);
          }
        }
      }
      return keys;
    },
    activeMonsterTiles(state) {
      return state.monsterTiles.filter((monster) => !monster.removed);
    },
    djinnEntity(state) {
      return state.boardEntities.find((e) => e.kind === 'djinn' && !e.removed) || null;
    },
    djinnActive(state) {
      return !!state.boardEntities.find((e) => e.kind === 'djinn' && !e.removed);
    },
    djinnSleeping(state) {
      return state.djinnState === 'sleeping';
    },
    djinnReady(state) {
      return state.djinnState === 'ready';
    },
    djinnCeremonyActive(state) {
      return /^stage\d+/.test(state.djinnState);
    },
    djinnBoardStage(state) {
      return /^stage\d+Board$/.test(state.djinnState);
    },
    djinnTileWeights(state) {
      if (state.djinnLayoutId !== 'cake') return null;
      return {
        g: 6,
        h: 5,
        m: 5,
        w: 1,
        s: 1,
        c: 1
      };
    },
    boardTileWeights(state) {
      if (this.djinnTileWeights) return this.djinnTileWeights;

      const day = DAYS[state.currentDay];
      if (!day) return null;

      const allowed = unlockedCharsForDay(state.currentDay);
      if (!allowed.length) return null;

      const requiredIds = Object.keys(day.needs || {});
      if (!requiredIds.length) return null;

      const remainingById = Object.fromEntries(
        requiredIds.map((id) => [id, Math.max(0, (day.needs[id] || 0) - (state.progress[id] || 0))])
      );
      const maxRemaining = Math.max(...Object.values(remainingById), 0);
      const weights = {};
      const targetCount = requiredIds.length || 1;
      const allowedCount = allowed.length || 1;
      const nonTargetBase = targetCount >= allowedCount ? 1 : 0.94;
      const targetBase = targetCount >= allowedCount ? 1 : 1.08;
      const targetBoostCap = targetCount <= 2 ? 0.26 : 0.18;

      for (const ch of allowed) {
        const resource = RESOURCE_BY_CHAR[ch];
        if (!resource) continue;
        const remaining = remainingById[resource.id] ?? 0;
        if (remaining > 0) {
          const urgency = maxRemaining > 0 ? remaining / maxRemaining : 0;
          weights[ch] = targetBase + urgency * targetBoostCap;
        } else if (resource.id in day.needs) {
          weights[ch] = 0.98;
        } else {
          weights[ch] = nonTargetBase;
        }
      }

      return weights;
    },
    djinnCardMode(state) {
      if (/Intro$/.test(state.djinnState)) return 'intro';
      if (/Resolve$/.test(state.djinnState)) return 'resolve';
      return null;
    },
    currentDjinnTransition(state) {
      return state.djinnTransition;
    },
    currentDjinnStageConfig(state) {
      return DJINN_WISHES.stages[state.djinnStage] || null;
    },
    currentDjinnCard(state) {
      const stage = DJINN_WISHES.stages[state.djinnStage];
      if (!stage) return null;
      if (/Intro$/.test(state.djinnState)) {
        return {
          title: stage.title,
          quote: stage.quote,
          lines: stage.introLines || []
        };
      }
      if (/Resolve$/.test(state.djinnState)) {
        return {
          title: stage.title,
          quote: stage.wishText,
          lines: stage.resolveLines || []
        };
      }
      return null;
    },
    djinnObjectiveSummary(state) {
      if (state.djinnState === 'ready') {
        return {
          title: DJINN_WISHES.readyTitle,
          healthLabel: GAMEPLAY_COPY.djinn.readyHealthLabel,
          weakness: DJINN_WISHES.readyHint,
          pressure: DJINN_WISHES.readyLine,
          echo: GAMEPLAY_COPY.djinn.readyEcho
        };
      }

      const stage = DJINN_WISHES.stages[state.djinnStage];
      const objective = state.djinnObjective;
      if (!stage || !objective) return null;

      let healthLabel = objective.label || '';
      let weakness = '';
      let pressure = '';

      if (objective.type === 'clearMarks') {
        healthLabel = GAMEPLAY_COPY.djinn.formatMarkProgress(objective.progress, objective.total);
        weakness = objective.label;
        pressure = stage.wishText;
      } else if (objective.type === 'joyBursts') {
        healthLabel = GAMEPLAY_COPY.djinn.formatJoyProgress(objective.progress, objective.total);
        weakness = objective.label;
        pressure = objective.rulesText || '';
      } else if (objective.type === 'cakeSequence') {
        healthLabel = GAMEPLAY_COPY.djinn.formatCakeProgress(objective.progress, objective.total);
        weakness = objective.steps?.[objective.progress] || objective.label;
        pressure = GAMEPLAY_COPY.djinn.cakePressure;
      }

      return {
        title: stage.title,
        healthLabel,
        weakness,
        pressure,
        echo: stage.wishText
      };
    },
    currentMonsterInfo(state) {
      const info = state.inspectedMonster;
      if (!info?.kind) return null;

      const monster = MONSTERS[info.kind];
      if (!monster) return null;

      if (info.kind === 'djinn') {
        const entity = state.boardEntities.find((item) => item.id === info.entityId && !item.removed && item.kind === 'djinn')
          || state.boardEntities.find((item) => !item.removed && item.kind === 'djinn');
        if (!entity) return null;

        if (state.djinnState === 'sleeping') {
          return {
            kind: info.kind,
            entityId: entity.id,
            emoji: monster.emoji,
            label: DJINN_WISHES.sleepTitle,
            healthLabel: GAMEPLAY_COPY.djinn.sleepingHealthLabel,
            weakness: DJINN_WISHES.sleepHint,
            pressure: DJINN_WISHES.sleepLine,
            echo: GAMEPLAY_COPY.djinn.sleepingEcho,
            source: info.source
          };
        }

        const summary = this.djinnObjectiveSummary;
        return {
          kind: info.kind,
          entityId: entity.id,
          emoji: monster.emoji,
          label: summary?.title || monster.uiLabel || monster.name,
          healthLabel: summary?.healthLabel || GAMEPLAY_COPY.djinn.roomPrepHealthLabel,
          weakness: summary?.weakness || GAMEPLAY_COPY.djinn.roomPrepWeakness,
          pressure: summary?.pressure || '',
          echo: summary?.echo || '',
          source: info.source
        };
      }

      const boardEntity = state.boardEntities.find((item) => item.id === info.entityId && !item.removed)
        || state.boardEntities.find((item) => !item.removed && item.kind === info.kind);
      if (boardEntity) {
        const hitsRequired = boardEntity.hitsRequired || monster.hp || monster.hits || 0;
        const hitsTaken = boardEntity.hitsTaken || 0;
        const remaining = Math.max(0, hitsRequired - hitsTaken);
        const statusLabel = monster.statusLabel || (hitsRequired > 0
          ? GAMEPLAY_COPY.monster.formatRemaining(remaining, hitsRequired)
          : GAMEPLAY_COPY.monster.unavailable);

        return {
          kind: info.kind,
          entityId: boardEntity.id,
          emoji: monster.emoji,
          label: monster.uiLabel || monster.name,
          healthLabel: statusLabel,
          weakness: monster.uiWeaknessShort || monster.damageRule?.hint || monster.clearRule?.hint || '',
          pressure: monster.uiPressureShort || '',
          echo: monster.echoLabel || '',
          source: info.source
        };
      }

      const entity = state.monsterTiles.find((item) => item.id === info.entityId && !item.removed)
        || state.monsterTiles.find((item) => !item.removed && item.kind === info.kind);
      if (!entity) return null;

      const hitsRequired = entity.hitsRequired || monster.hp || monster.hits || 1;
      const hitsTaken = entity.hitsTaken || 0;
      const remaining = Math.max(0, hitsRequired - hitsTaken);

      return {
        kind: info.kind,
        entityId: entity.id,
        emoji: monster.emoji,
        label: monster.uiLabel || monster.name,
        healthLabel: GAMEPLAY_COPY.monster.formatRemaining(remaining, hitsRequired),
        weakness: monster.uiWeaknessShort || monster.damageRule?.hint || monster.clearRule?.hint || '',
        pressure: monster.uiPressureShort || GAMEPLAY_COPY.monster.occupiedPressure,
        echo: monster.echoLabel || '',
        source: info.source
      };
    },
    currentRewardItemInfo(state) {
      const info = state.inspectedRewardItem;
      if (!info?.itemId) return null;

      const item = REWARD_ITEMS[info.itemId];
      if (!item) return null;

      return {
        itemId: item.id,
        emoji: item.emoji,
        label: `${item.name}${item.enName ? ` · ${item.enName}` : ''}`,
        healthLabel: GAMEPLAY_COPY.rewardItem.formatHealthLabel(item),
        weakness: item.description,
        pressure: item.penaltyText || GAMEPLAY_COPY.rewardItem.noPenalty,
        echo: item.reaction || GAMEPLAY_COPY.rewardItem.formatPersistentEffect(item.name),
        source: info.source
      };
    },

    /** Resource progress as { grape: { have, need, pct }, … } */
    repairView(state) {
      const day = DAYS[state.currentDay];
      if (!day) return [];
      return Object.entries(day.needs).map(([id, need]) => {
        const targetNeed = state.needOverrides[id] ?? need;
        const have = Math.min(state.progress[id] || 0, targetNeed);
        return { id, label: RESOURCE_BY_ID[id].cn, emoji: RESOURCE_BY_ID[id].emoji,
                 have, need: targetNeed, pct: targetNeed ? have / targetNeed : 1 };
      });
    },

    isComplete(state) {
      const day = DAYS[state.currentDay];
      if (!day) return false;
      for (const [id, need] of Object.entries(day.needs)) {
        const targetNeed = state.needOverrides[id] ?? need;
        if ((state.progress[id] || 0) < targetNeed) return false;
      }
      return true;
    },

    /** True while the lilacReturn passive should glow hint tiles. */
    showHints(state) {
      if (this.djinnReady) return false;
      return state.unlockedAbilities.includes('lilacReturn') && state.stepsLeft <= 5;
    },

    activeAbilities(state) {
      const active = state.unlockedAbilities
        .map((id) => ABILITIES[id])
        .filter((a) => a.type === 'active');
      active.push(ABILITIES.milkTeaBarrage);
      return active;
    },
    passiveAbilities(state) {
      return state.unlockedAbilities
        .map((id) => ABILITIES[id])
        .filter((a) => a.type === 'passive');
    },
    pigEnergyPct(state) {
      return Math.max(0, Math.min(1, state.pigEnergy / PIG_RATING.energyMax));
    },
    pigEnergyReady(state) {
      return state.pigEnergy >= PIG_RATING.energyMax;
    },
    pigMood(state) {
      if (!state.pigMoodVisible) return null;
      return PIG_RATING.moods[state.pigLastRating ?? 0] || PIG_RATING.moods[0];
    }
  },

  actions: {
    /* ---------- lifecycle ---------- */

    start() {
      const achievements = useAchievementStore();
      this.currentDay = 0;
      this.stepsLeft = MAX_STEPS;
      this.progress = {};
      this.unlockedAbilities = [];
      this.abilityUses = {};
      this.pendingAbility = null;
      this.matchGroupsThisDay = 0;
      this.ownedItems = [];
      this.claimedRewardDays = [];
      this.pendingRewardDay = null;
      this.pendingRewardOffer = null;
      this.seenRewardItemIds = [];
      this.nextDayStepPenalty = 0;
      this.maxStepPenalty = 0;
      this.itemFlags = {};
      this.roomHistory = [];
      this.pigEnergy = 0;
      this.pigEnergyBeforeAward = 0;
      this.pigLastRating = null;
      this.pigMoodVisible = false;
      this.pigMoodShownDay = null;
      this.pigClickCount = 0;
      this.pigAngryThreshold = this._rollPigAngryThreshold();
      this.pigAngryUsedDay = null;
      this.introShown = false;
      this.monologue = '';
      this.completedBanner = '';
      this.dayEndLine = '';
      this.latestRestoredBuildingId = null;
      this.pendingEstateRevealId = null;
      this.giftText = ENDING.defaultGift;
      this.giftAttemptedText = '';
      this.giftWasOverridden = false;
      this.inspectedRewardItem = null;
      this._resetDaySpecialState();
      this.phase = 'intro';
      achievements.track('runStart');
      achievements.track('dayStart', { day: 1 });
    },

    showIntro()  { this.phase = 'intro'; },
    startPlay()  {
      this.phase = 'playing';
      this.introShown = true;
      this._ensureActiveEntities();
      const firstMonster = this.activeMonsterTiles.find((monster) => !monster.seenIntro);
      if (firstMonster) {
        firstMonster.seenIntro = true;
        const monster = MONSTERS[firstMonster.kind];
        if (monster?.introLine) this.queueBark(monster.introLine);
      }
      if (this.currentDay === DAYS.length - 1) {
        this.djinnHintVisible = this.djinnState === 'ready';
      }
    },

    nextDay() {
      const achievements = useAchievementStore();
      this.currentDay++;
      const stepPenalty = this.nextDayStepPenalty;
      this.nextDayStepPenalty = 0;
      this.stepsLeft = Math.max(1, this.effectiveMaxSteps - stepPenalty);
      this.progress = {};
      this.pendingAbility = null;
      this.matchGroupsThisDay = 0;
      this.pigEnergyBeforeAward = this.pigEnergy;
      this.pigLastRating = null;
      this.pigMoodVisible = false;
      this.pigClickCount = 0;
      this.pigAngryThreshold = this._rollPigAngryThreshold();
      this.pigAngryUsedDay = null;
      this.introShown = false;
      this.hintMove = null;
      this.pendingRewardOffer = null;
      this.inspectedRewardItem = null;
      this._resetDaySpecialState();
      this._resetDailyItemFlags();
      this._applyDayStartItemEffects();
      this._refreshAbilityUses();
      if (this.currentDay >= DAYS.length) {
        this.phase = 'final';
      } else {
        this.phase = 'intro';
        achievements.track('dayStart', { day: this.currentDay + 1 });
      }
    },

    /* ---------- step + resource flow ---------- */

    consumeStep() {
      if (this.djinnUnlimitedSteps) return;
      if (this.stepsLeft <= 0) return;
      this.stepsLeft--;
      this.turnId++;
    },

    /** Add `n` steps, capped at the current effective maximum. */
    recoverSteps(n) {
      const next = Math.min(this.effectiveMaxSteps, this.stepsLeft + n);
      const gained = next - this.stepsLeft;
      this.stepsLeft = next;
      if (gained > 0) audioManager.playSFX('steprestore', { vol: 0.6 });
    },

    /**
     * resourcesByChar = { g: 4, w: 3, … } from board.tilesCleared.
     * groupSizes      = [3, 4, 5, …]   per matched run.
     * chain           = current cascade depth (1 = first hit, …)
     */
    gainResources(resourcesByChar, groupSizes = [], chain = 1) {
      const achievements = useAchievementStore();
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

      if (this.dayBuffs.extraResourcePerType) {
        for (const id of Object.keys(summary)) {
          this.progress[id] = (this.progress[id] || 0) + 1;
          summary[id] += 1;
        }
      }

      this._applyOwnedItemGainEffects(summary, resourcesByChar, groupSizes || [], chain || 1);
      this._applyLowStepRecoveryItems();

      // agedBarrel passive: +1 step per 5 cleared groups.
      if (this.unlockedAbilities.includes('agedBarrel')) {
        this.matchGroupsThisDay += groupSizes.length;
        while (this.matchGroupsThisDay >= 5) {
          this.matchGroupsThisDay -= 5;
          this.recoverSteps(1);
        }
      }

      achievements.track('comboResolved', {
        day: this.currentDay + 1,
        chain,
        groupSizes
      });

      return summary;
    },

    /* ---------- repair completion ---------- */

    /** Called when the board finishes a swap and resources are checked. */
    onAfterMove() {
      const achievements = useAchievementStore();
      const needsReady = this._hasCurrentNeedsMet();
      if (this.currentDay === DAYS.length - 1 && this.djinnBoardStage) {
        return this._advanceDjinnObjective();
      }
      if (this.currentDay === DAYS.length - 1 && needsReady && !this.djinnRepairCommitted) {
        this.phase = 'repairing';
        return 'complete';
      }
      if (this.currentDay === DAYS.length - 1 && this.djinnRepairCommitted && !this.djinnReleased) {
        return 'continue';
      }
      if (this.currentDay === DAYS.length - 1 && needsReady && this.djinnState === 'sleeping' && !this.djinnReleased) {
        this.enterDjinnReadyState();
        return 'djinnReady';
      }
      if (needsReady) {
        this.phase = 'repairing';
        return 'complete';
      }
      if (this.djinnUnlimitedSteps) return 'continue';
      if (this.stepsLeft <= 0) {
        if (this._tryZeroStepRecovery()) return 'continue';
        this.dayEndLine = DAY_END_LINES[Math.floor(Math.random() * DAY_END_LINES.length)];
        this.phase = 'dayEnd';
        achievements.track('dayEndReached', { day: this.currentDay + 1 });
        return 'dayEnd';
      }
      return 'continue';
    },

    finishRepair() {
      const achievements = useAchievementStore();
      const day = DAYS[this.currentDay];
      const rating = this._calcPigRating();
      this.pigEnergyBeforeAward = this.pigEnergy;
      this.pigLastRating = rating;
      this.pigEnergy = Math.min(PIG_RATING.energyMax, this.pigEnergy + rating);
      this.pigMoodVisible = false;
      this.pigMoodShownDay = null;
      if (day.ending && this.djinnRepairCommitted) {
        return this.djinnReleased ? 'completed' : 'djinnPending';
      }
      if (!this.unlockedAbilities.includes(day.ability)) this.unlockedAbilities.push(day.ability);
      this.completedBanner = day.completedBanner;
      this.monologue = day.monologue;
      this.latestRestoredBuildingId = day.building.id;
      this.pendingEstateRevealId = day.building.id;
      this._refreshAbilityUses();
      if (day.ending) this.djinnRepairCommitted = true;
      achievements.track('dayCompleted', {
        day: this.currentDay + 1,
        stepsLeft: this.stepsLeft
      });

      if (day.ending) return 'djinnPending';
      return 'completed';
    },

    advanceFromRepair() {
      if (this.phase === 'ending' || this.phase === 'final') return;
      if (this.currentDay === DAYS.length - 1 && this.djinnRepairCommitted && !this.djinnReleased) {
        this.beginDjinnWakeCutscene();
        return;
      }
      const rewardDay = this.currentDay + 1;
      if (rewardDay <= DAYS.length - 1 && !this.claimedRewardDays.includes(rewardDay)) {
        this.pendingRewardDay = rewardDay;
        this.pendingRewardOffer = this._buildRewardOffer(rewardDay);
        if (!this.pendingRewardOffer) {
          this.pendingRewardDay = null;
          this.nextDay();
          return;
        }
        this.phase = 'rewardChoice';
        return;
      }
      this.nextDay();
    },

    chooseRewardItem(itemId) {
      if (this.phase !== 'rewardChoice') return false;
      const offer = this.currentRewardOffer;
      if (!offer) return false;
      const options = [...offer.treasure, ...offer.devil];
      const item = options.find((candidate) => candidate.id === itemId);
      if (!item) return false;

      const acquired = {
        id: item.id,
        day: offer.day,
        roomType: item.roomType,
        name: item.name,
        enName: item.enName,
        quality: item.quality,
        emoji: item.emoji,
        slot: item.slot,
        tone: item.tone,
        reaction: item.reaction
      };
      this.ownedItems = [...this.ownedItems.filter((owned) => owned.id !== item.id), acquired];
      this.claimedRewardDays = [...new Set([...this.claimedRewardDays, offer.day])];
      this.roomHistory.push({ day: offer.day, roomType: item.roomType, itemId: item.id, quality: item.quality });
      this._applyRewardPenalty(item.penalty);
      if (item.reaction) this.queueAmbientBark(item.reaction);
      EventBus.trigger('rewardHudFlash');
      audioManager.playSFX('click', { vol: 0.34, rate: 1.16, bypassThrottle: true });
      this.clearRewardItemInfo();
      this.pendingRewardDay = null;
      this.pendingRewardOffer = null;
      this.nextDay();
      return true;
    },

    advanceFromDayEnd() {
      audioManager.playSFX('dayend', { vol: 0.6 });
      this.stepsLeft = this.effectiveMaxSteps;
      this.matchGroupsThisDay = 0;
      this.phase = 'playing';
    },

    markEstateRevealSeen(buildingId) {
      if (this.pendingEstateRevealId === buildingId) {
        this.pendingEstateRevealId = null;
      }
    },

    _ownedRewardItems() {
      return this.ownedItems.map((owned) => REWARD_ITEMS[owned.id]).filter(Boolean);
    },

    _rewardPool(roomType) {
      return Object.values(REWARD_ITEMS)
        .filter((item) => item.roomType === roomType)
        .map((item) => item.id);
    },

    _drawRewardIds(roomType, count, excluded = []) {
      const excludedSet = new Set(excluded);
      const pool = this._rewardPool(roomType).filter((id) => !excludedSet.has(id));
      const drawn = [];
      while (pool.length && drawn.length < count) {
        const index = Math.floor(Math.random() * pool.length);
        drawn.push(pool[index]);
        pool.splice(index, 1);
      }
      return drawn;
    },

    _buildRewardOffer(day) {
      if (!day || day <= 0 || day >= DAYS.length) return null;
      const fixed = FIXED_REWARD_OFFERS[day];
      if (!fixed) return null;
      const treasure = (fixed.treasure || []).filter((id) => REWARD_ITEMS[id]);
      const devil = (fixed.devil || []).filter((id) => REWARD_ITEMS[id]);
      this.seenRewardItemIds = [...new Set([...this.seenRewardItemIds, ...treasure, ...devil])];

      return {
        day,
        treasure,
        devil
      };
    },

    _itemFlagKey(item, suffix = 'used') {
      return `${item.id}:${this.currentDay + 1}:${suffix}`;
    },

    _markItemFlag(item, suffix = 'used') {
      this.itemFlags = { ...this.itemFlags, [this._itemFlagKey(item, suffix)]: true };
    },

    _hasItemFlag(item, suffix = 'used') {
      return Boolean(this.itemFlags[this._itemFlagKey(item, suffix)]);
    },

    _resetDailyItemFlags() {
      this.itemFlags = {};
    },

    _applyRewardPenalty(penalty) {
      if (!penalty) return;
      if (penalty.type === 'nextDaySteps') {
        this.nextDayStepPenalty += penalty.value || 0;
      } else if (penalty.type === 'maxSteps') {
        this.maxStepPenalty += penalty.value || 0;
        this.stepsLeft = Math.min(this.stepsLeft, this.effectiveMaxSteps);
      }
    },

    _applyDayStartItemEffects() {
      for (const item of this._ownedRewardItems()) {
        const effect = item.effect;
        if (!effect) continue;
        if (effect.type === 'dayStartStepBonus') {
          this.recoverSteps(effect.amount || 0);
        } else if (effect.type === 'dayStartNeedReduction') {
          this._reduceCurrentNeeds(effect.amount || 0, effect.targets || 1);
        }
      }
    },

    _reduceCurrentNeeds(amount, targetCount) {
      const day = DAYS[this.currentDay];
      if (!day || !amount) return;
      const candidates = Object.entries(day.needs)
        .map(([id, need]) => ({ id, remaining: Math.max(0, (this.needOverrides[id] ?? need) - (this.progress[id] || 0)) }))
        .filter((item) => item.remaining > 0)
        .sort((a, b) => b.remaining - a.remaining)
        .slice(0, targetCount);
      for (const candidate of candidates) {
        const baseNeed = this.needOverrides[candidate.id] ?? day.needs[candidate.id];
        this.needOverrides[candidate.id] = Math.max(1, baseNeed - amount);
      }
    },

    _addRewardResourceBonus(summary, id, amount) {
      if (!id || !amount) return;
      this.progress[id] = (this.progress[id] || 0) + amount;
      summary[id] = (summary[id] || 0) + amount;
    },

    _addBonusToSummaryResources(summary, amount) {
      const ids = Object.keys(summary);
      for (const id of ids) this._addRewardResourceBonus(summary, id, amount);
    },

    _addHighestNeedBonus(summary, amount) {
      const day = DAYS[this.currentDay];
      if (!day || !amount) return;
      const target = Object.entries(day.needs)
        .map(([id, need]) => ({ id, remaining: Math.max(0, (this.needOverrides[id] ?? need) - (this.progress[id] || 0)) }))
        .sort((a, b) => b.remaining - a.remaining)[0];
      if (target?.id) this._addRewardResourceBonus(summary, target.id, amount);
    },

    _addAllTargetBonus(summary, amount) {
      const day = DAYS[this.currentDay];
      if (!day || !amount) return;
      for (const id of Object.keys(day.needs)) this._addRewardResourceBonus(summary, id, amount);
    },

    _applyOwnedItemGainEffects(summary, resourcesByChar, groupSizes = [], chain = 1) {
      if (!Object.keys(resourcesByChar || {}).length) return;
      const hasBig = groupSizes.some((size) => size >= 4);
      const hasFive = groupSizes.some((size) => size >= 5);
      for (const item of this._ownedRewardItems()) {
        const effect = item.effect;
        if (!effect) continue;
        if (effect.type === 'firstBigMatchBonus' && hasBig && !this._hasItemFlag(item)) {
          this._addBonusToSummaryResources(summary, effect.amount || 0);
          this._markItemFlag(item);
        } else if (effect.type === 'firstFiveMatchBonus' && hasFive && !this._hasItemFlag(item)) {
          this._addBonusToSummaryResources(summary, effect.amount || 0);
          this._markItemFlag(item);
        } else if (effect.type === 'allBigMatchBonus' && hasBig) {
          this._addBonusToSummaryResources(summary, effect.amount || 0);
        } else if (effect.type === 'chainBonus' && chain >= (effect.minChain || 2) && !this._hasItemFlag(item)) {
          this._addBonusToSummaryResources(summary, effect.amount || 0);
          this._markItemFlag(item);
        } else if (effect.type === 'firstTargetResourceBonus' && !this._hasItemFlag(item)) {
          this._addHighestNeedBonus(summary, effect.amount || 0);
          this._markItemFlag(item);
        } else if (effect.type === 'lowStepResourceBoost' && this.stepsLeft <= (effect.threshold || 5)) {
          for (const id of Object.keys(summary)) {
            const bonus = Math.max(1, Math.ceil(summary[id] * ((effect.multiplier || 1) - 1)));
            this._addRewardResourceBonus(summary, id, bonus);
          }
        } else if (effect.type === 'firstHighestNeedBonus' && hasBig && !this._hasItemFlag(item)) {
          this._addHighestNeedBonus(summary, effect.amount || 0);
          this._markItemFlag(item);
        } else if (effect.type === 'firstFiveAllTargetsBonus' && hasFive && !this._hasItemFlag(item)) {
          this._addAllTargetBonus(summary, effect.amount || 0);
          this._markItemFlag(item);
        } else if (effect.type === 'firstFiveMatchStep' && hasFive && !this._hasItemFlag(item)) {
          this.recoverSteps(effect.amount || 0);
          this._markItemFlag(item);
        } else if (effect.type === 'firstBigMatchPigEnergy' && hasBig && !this._hasItemFlag(item)) {
          this.pigEnergy = Math.min(PIG_RATING.energyMax, this.pigEnergy + (effect.amount || 0));
          this._markItemFlag(item);
        }
      }
    },

    _applyLowStepRecoveryItems() {
      for (const item of this._ownedRewardItems()) {
        const effect = item.effect;
        if (effect?.type !== 'lowStepPigEnergyRecover') continue;
        if (this._hasItemFlag(item)) continue;
        if (this.stepsLeft > (effect.threshold || 3)) continue;
        if (this.pigEnergy < (effect.energyCost || 1)) continue;
        this.pigEnergy -= effect.energyCost || 1;
        this.recoverSteps(effect.amount || 0);
        this._markItemFlag(item);
      }
    },

    _tryZeroStepRecovery() {
      for (const item of this._ownedRewardItems()) {
        const effect = item.effect;
        if (effect?.type !== 'firstZeroStepRecover') continue;
        if (this._hasItemFlag(item, 'zero')) continue;
        this.recoverSteps(effect.amount || 0);
        this._markItemFlag(item, 'zero');
        if (item.reaction) this.queueAmbientBark(item.reaction);
        return this.stepsLeft > 0;
      }
      return false;
    },

    handleInvalidSwapReward({ chars = [] } = {}) {
      const resourceChars = chars.filter((ch) => RESOURCE_BY_CHAR[ch]);
      if (!resourceChars.length) return null;
      const summary = {};
      for (const item of this._ownedRewardItems()) {
        const effect = item.effect;
        if (!effect) continue;
        if (effect.type === 'firstInvalidSwapForgive' && !this._hasItemFlag(item, 'invalid')) {
          this.recoverSteps(effect.amount || 0);
          this._markItemFlag(item, 'invalid');
        } else if (effect.type === 'invalidSwapBonus' && !this._hasItemFlag(item, 'invalid')) {
          for (const ch of resourceChars) {
            const resource = RESOURCE_BY_CHAR[ch];
            this.progress[resource.id] = (this.progress[resource.id] || 0) + (effect.amount || 0);
            summary[resource.id] = (summary[resource.id] || 0) + (effect.amount || 0);
          }
          this._markItemFlag(item, 'invalid');
        }
      }
      return Object.keys(summary).length ? summary : null;
    },

    applyDjinnItemProgressBonus(context = {}) {
      let bonus = 0;
      for (const item of this._ownedRewardItems()) {
        const effect = item.effect;
        if (effect?.type === 'djinnProgressBonus' && !this._hasItemFlag(item, effect.perStage ? `djinn-${this.djinnStage}` : 'djinn')) {
          bonus += effect.amount || 0;
          this._markItemFlag(item, effect.perStage ? `djinn-${this.djinnStage}` : 'djinn');
        } else if (effect?.type === 'djinnBigMatchProgressBonus' && context.hasBig && !this._hasItemFlag(item, `djinn-big-${this.djinnStage}`)) {
          bonus += effect.amount || 0;
          this._markItemFlag(item, `djinn-big-${this.djinnStage}`);
        }
      }
      return bonus;
    },

    /* ---------- abilities ---------- */

    canUseAbility(id) {
      const ab = ABILITIES[id];
      if (!ab || ab.type !== 'active') return false;
      if (id === 'milkTeaBarrage') {
        if (!this.pigEnergyReady) return false;
      } else if (!this.unlockedAbilities.includes(id)) return false;
      if (this.djinnReady) return false;
      if (this.phase !== 'playing' && this.phase !== 'targeting') return false;
      if (id === 'milkTeaBarrage') return true;
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
      const achievements = useAchievementStore();
      if (id === 'milkTeaBarrage') {
        this.pigEnergy = Math.max(0, this.pigEnergy - PIG_RATING.energyMax);
      } else if (this.abilityUses[id] != null) {
        this.abilityUses[id]--;
      }
      this.turnId++;
      this.pendingAbility = null;
      this.phase = 'playing';
      achievements.track('abilityUsed', {
        day: this.currentDay + 1,
        id
      });
    },

    revealPigMoodForToday() {
      if (this.pigMoodShownDay === this.currentDay) return false;
      this.pigMoodVisible = true;
      this.pigMoodShownDay = this.currentDay;
      return true;
    },

    hidePigMood() {
      this.pigMoodVisible = false;
    },

    inspectPig() {
      this.pigClickCount += 1;
      if (this.pigAngryUsedDay === this.currentDay) {
        return {
          ...PIG_REACTIONS.annoyed,
          angry: false,
          penalized: false
        };
      }
      if (this.pigClickCount <= this.pigAngryThreshold) {
        const progress = this.pigClickCount / Math.max(1, this.pigAngryThreshold);
        const pool = progress < 0.34
          ? PIG_REACTIONS.gentle
          : progress < 0.68
            ? PIG_REACTIONS.warm
            : PIG_REACTIONS.warning;
        const pick = pool[(this.pigClickCount - 1) % pool.length] || pool[0];
        return {
          ...pick,
          angry: false,
          penalized: false
        };
      }
      if (this.phase === 'repairing' || this.phase === 'dayEnd') return false;
      if (this.stepsLeft <= 0 || this.djinnUnlimitedSteps) return false;
      this.stepsLeft = Math.max(0, this.stepsLeft - 1);
      this.turnId++;
      this.pigAngryUsedDay = this.currentDay;
      audioManager.playSFX('error', { vol: 0.44 });
      EventBus.trigger('pigPenalty', [{ stepsLost: 1 }]);
      this.queueBark(GAMEPLAY_COPY.pig.angryBark);
      return {
        ...PIG_REACTIONS.angry,
        angry: true,
        penalized: true
      };
    },

    inspectOwnedItem(itemId) {
      if (!itemId || !this.ownedItems.some((item) => item.id === itemId)) return false;
      this.showRewardItemInfo(itemId, 'pig');
      return true;
    },

    addPigEnergyForTesting(amount = PIG_RATING.energyMax) {
      const delta = Math.max(0, Number(amount) || 0);
      if (!delta) return this.pigEnergy;
      this.pigEnergy = Math.max(0, this.pigEnergy + delta);
      return this.pigEnergy;
    },

    queueBark(line) {
      if (!line) return;
      this.barkLine = line;
      this.barkNonce++;
    },

    queueAmbientBark(line) {
      if (!line) return;
      if (this.barkLine) return;
      if (this.phase === 'repairing' || this.phase === 'dayEnd') return;
      this.barkLine = line;
      this.barkNonce++;
    },

    dismissBark() {
      this.barkLine = '';
    },

    showMonsterInfo(kind, entityId = null, source = 'hover') {
      if (!kind) return;
      this.inspectedMonster = { kind, entityId, source };
    },

    clearMonsterInfo(source = null) {
      if (!this.inspectedMonster) return;
      if (source && this.inspectedMonster.source !== source) return;
      this.inspectedMonster = null;
    },

    showRewardItemInfo(itemId, source = 'hover') {
      if (!itemId || !REWARD_ITEMS[itemId]) return;
      this.inspectedRewardItem = { itemId, source };
    },

    clearRewardItemInfo(source = null) {
      if (!this.inspectedRewardItem) return;
      if (source && this.inspectedRewardItem.source !== source) return;
      this.inspectedRewardItem = null;
    },

    beginDjinnWakeCutscene() {
      this.djinnState = 'waking';
      this.djinnHintVisible = false;
      this.pendingAbility = null;
      this.clearMonsterInfo();
      this.phase = 'awakening';
    },

    finishDjinnWake() {
      this.enterDjinnReadyState();
    },

    enterDjinnReadyState() {
      this.djinnState = 'ready';
      this.djinnStage = 0;
      this.djinnUnlimitedSteps = true;
      this.djinnLayoutId = null;
      this.djinnObjective = null;
      this.djinnMarks = [];
      this.djinnCakeLayer = 0;
      this.djinnPendingResolve = false;
      this.djinnHintVisible = true;
      this.pendingAbility = null;
      for (const entity of this.boardEntities) {
        if (entity.kind === 'djinn') entity.sleeping = false;
      }
      this.phase = 'playing';
      this.queueBark(DJINN_WISHES.wakeLine || DJINN_WISHES.readyLine);
    },

    beginDjinnCeremony() {
      if (this.djinnState !== 'ready') return;
      this.startDjinnStage(1);
    },

    startDjinnStage(stageNumber) {
      const stage = DJINN_WISHES.stages[stageNumber];
      if (!stage) return;
      this.djinnStage = stageNumber;
      this.djinnState = `stage${stageNumber}Intro`;
      this.djinnUnlimitedSteps = true;
      this.djinnLayoutId = stage.layoutId;
      this.djinnObjective = this._buildDjinnObjective(stageNumber);
      this.djinnMarks = this._buildDjinnMarks(stage.layoutId);
      this.boardEntities = this.boardEntities.filter((entity) => entity.kind === 'djinn');
      if (stage.layoutId === 'health') {
        this.boardEntities.push(
          ...this.djinnMarks.map((mark) => this._newMonsterEntity('blightMark', mark.row, mark.col, mark.id, {
            seenIntro: true,
            hitsRequired: 1,
            blocksBoard: true
          }))
        );
      }
      if (stage.layoutId === 'joy') {
        this.boardEntities.push(
          ...this.djinnMarks.map((mark) => this._newMonsterEntity('joyCandle', mark.row, mark.col, mark.id, {
            seenIntro: true,
            hitsRequired: 0,
            blocksBoard: true
          }))
        );
      }
      this._syncDjinnStageMonsters();
      this.djinnPendingResolve = false;
      this.djinnCardNonce++;
      this.phase = 'wish';
      this.pendingAbility = null;
      this.djinnHintVisible = false;
    },

    beginDjinnBoardStage() {
      if (!this.djinnStage) return;
      this.djinnState = `stage${this.djinnStage}Board`;
      this.phase = 'playing';
      this.djinnCardNonce++;
    },

    finishDjinnResolve() {
      if (this.djinnState === 'stage3Resolve') {
        this._completeDjinnCeremony();
        return;
      }
      this.beginDjinnStageTransition(this.djinnStage, this.djinnStage + 1);
    },

    beginDjinnStageTransition(fromStage, toStage) {
      const transition = DJINN_STAGE_TRANSITIONS[`${fromStage}-${toStage}`];
      if (!transition) {
        this.startDjinnStage(toStage);
        return;
      }
      this.djinnTransition = structuredClone(transition);
      this.djinnState = `stage${fromStage}Transition`;
      this.djinnHintVisible = false;
      this.pendingAbility = null;
      this.clearMonsterInfo();
      this.phase = 'djinnTransition';
    },

    finishDjinnTransition() {
      const nextStage = this.djinnTransition?.toStage;
      this.djinnTransition = null;
      if (!nextStage) return;
      this.startDjinnStage(nextStage);
    },

    resolveBoardEntities(clearedTiles = [], chain = 1, source = 'match', matchGroups = []) {
      const achievements = useAchievementStore();
      if (!clearedTiles.length) return { removedCount: 0, djinnHit: false };
      if (this.phase === 'wish') {
        return { removedCount: 0, djinnHit: false };
      }
      const removed = [];

      if (source === 'match') {
        for (const monster of this.monsterTiles) {
          if (monster.removed) continue;
          const hit = this._monsterWasHit(monster, clearedTiles, chain, matchGroups);
          if (!hit) continue;
          monster.lastDamagedTurn = this.turnId;
          monster.hitsTaken = (monster.hitsTaken || 0) + 1;
          if (monster.hitsTaken >= monster.hitsRequired) {
            monster.removed = true;
            removed.push(monster);
          } else {
            audioManager.playSFX('rune_hit', { vol: 0.44, rate: 0.92 });
          }
        }
        for (const entity of this.boardEntities) {
          if (entity.removed || entity.kind !== 'blightMark') continue;
          const hit = this._monsterWasHit(entity, clearedTiles, chain, matchGroups);
          if (!hit) continue;
          entity.lastDamagedTurn = this.turnId;
          entity.hitsTaken = (entity.hitsTaken || 0) + 1;
          if (entity.hitsTaken >= entity.hitsRequired) {
            entity.removed = true;
            audioManager.playSFX('seal_break', { vol: 0.7 });
            removed.push(entity);
          } else {
            audioManager.playSFX('rune_hit', { vol: 0.44, rate: 0.92 });
          }
        }
      }

      if (removed.length) {
        for (const entity of removed) this._grantMonsterReward(entity.kind);
        this._countMonsterClears(removed.length);
        const line = MONSTERS[removed[0].kind]?.removeLine;
        if (line) this.queueBark(line);
        achievements.track('monsterCleared', {
          day: this.currentDay + 1,
          count: removed.length,
          kinds: removed.map((entity) => entity.kind)
        });
      }

      return {
        removedCount: removed.length,
        djinnHit: false,
        removedCells: removed.map((monster) => ({ row: monster.row, col: monster.col }))
      };
    },

    spawnDjinnEncounter() {
      if (this.djinnActive || this.djinnReleased) return;
      this.boardEntities = [this._newMonsterEntity('djinn', 3, 3, `djinn-${Date.now()}`, {
        width: 2,
        height: 2,
        seenIntro: true,
        sleeping: true
      })];
      if (this.djinnState === 'idle') this.djinnState = 'sleeping';
    },

    /* ---------- gift text ---------- */

    setGiftDedication({ finalText, attemptedText, overridden } = {}) {
      const attempted = (attemptedText && attemptedText.trim()) || '';
      this.giftText = (finalText && finalText.trim()) || ENDING.defaultGift;
      this.giftAttemptedText = attempted;
      this.giftWasOverridden = Boolean(overridden);
    },

    jumpToDayForTesting(dayNumber) {
      const achievements = useAchievementStore();
      const targetDay = Number(dayNumber);
      if (!Number.isInteger(targetDay) || targetDay < 1 || targetDay > DAYS.length) {
        return null;
      }
      if (this.phase === 'final' || this.phase === 'ending' || this.phase === 'repairing') {
        return null;
      }

      const targetIndex = targetDay - 1;
      this.currentDay = targetIndex;
      this.stepsLeft = this.effectiveMaxSteps;
      this.progress = {};
      this.pendingRewardDay = null;
      this.pendingRewardOffer = null;
      this.seenRewardItemIds = [];
      this.pendingAbility = null;
      this.matchGroupsThisDay = 0;
      this.introShown = false;
      this.monologue = '';
      this.completedBanner = '';
      this.dayEndLine = '';
      this.latestRestoredBuildingId = null;
      this.pendingEstateRevealId = null;
      this.hintMove = null;
      this.unlockedAbilities = DAYS
        .slice(0, targetIndex)
        .map((day) => day.ability);

      this._resetDaySpecialState();
      this._refreshAbilityUses();
      this.phase = 'intro';
      achievements.disableForCurrentRun('tester-shortcut');

      return {
        day: targetDay,
        building: DAYS[targetIndex].building.cn
      };
    },

    jumpToDjinnReadyForTesting() {
      const achievements = useAchievementStore();
      if (
        this.phase === 'title' ||
        this.phase === 'final' ||
        this.phase === 'ending' ||
        this.phase === 'repairing'
      ) {
        return null;
      }

      const targetIndex = DAYS.length - 1;
      this.currentDay = targetIndex;
      this.stepsLeft = this.effectiveMaxSteps;
      this.progress = { ...DAYS[targetIndex].needs };
      this.pendingRewardDay = null;
      this.pendingRewardOffer = null;
      this.seenRewardItemIds = [];
      this.pendingAbility = null;
      this.matchGroupsThisDay = 0;
      this.introShown = true;
      this.monologue = '';
      this.completedBanner = '';
      this.dayEndLine = '';
      this.latestRestoredBuildingId = null;
      this.pendingEstateRevealId = null;
      this.hintMove = null;
      this.unlockedAbilities = DAYS
        .slice(0, targetIndex)
        .map((day) => day.ability);

      this._resetDaySpecialState();
      achievements.disableForCurrentRun('tester-shortcut');
      this.finishRepair();
      this.spawnDjinnEncounter();
      this._refreshAbilityUses();
      this.enterDjinnReadyState();

      return {
        day: targetIndex + 1,
        building: DAYS[targetIndex].building.cn
      };
    },

    skipDayForTesting() {
      const achievements = useAchievementStore();
      if (
        this.phase === 'title' ||
        this.phase === 'final' ||
        this.phase === 'ending' ||
        this.phase === 'repairing'
      ) {
        return null;
      }

      const day = DAYS[this.currentDay];
      if (!day) return null;

      this.pendingAbility = null;
      this.hintMove = null;
      this.matchGroupsThisDay = 0;
      this.progress = { ...day.needs };
      if (this.currentDay === DAYS.length - 1) {
        achievements.disableForCurrentRun('tester-shortcut');
        this.finishRepair();
        this.spawnDjinnEncounter();
        this.enterDjinnReadyState();
        return {
          kind: 'djinnReady',
          day: this.currentDay + 1,
          building: '迪精'
        };
      }
      this.phase = 'repairing';
      achievements.disableForCurrentRun('tester-shortcut');
      return {
        kind: 'repairing',
        day: this.currentDay + 1,
        building: day.building.cn
      };
    },

    jumpToEndingForTesting() {
      const achievements = useAchievementStore();
      achievements.disableForCurrentRun('tester-shortcut');
      this.giftText = ENDING.defaultGift;
      this.giftAttemptedText = '';
      this.giftWasOverridden = false;
      this.phase = 'ending';
    },

    /* ---------- internals ---------- */

    _resetDaySpecialState() {
      this.boardEntities = this._buildDayLayout(this.currentDay);
      this.monsterTiles = this._buildDayMonsters(this.currentDay);
      this.rotCells = [];
      this.turnId = 0;
      this.skipMonsterPressureTurn = null;
      this.barkLine = '';
      this.barkNonce = 0;
      this.inspectedMonster = null;
      this.needOverrides = {};
      this.dayBuffs = { extraResourcePerType: false };
      this.djinnHintVisible = false;
      this.djinnReleased = false;
      this.djinnState = this.boardEntities.some((entity) => entity.kind === 'djinn') ? 'sleeping' : 'idle';
      this.djinnStage = 0;
      this.djinnUnlimitedSteps = false;
      this.djinnLayoutId = null;
      this.djinnObjective = null;
      this.djinnMarks = [];
      this._syncDjinnStageMonsters();
      this.djinnCakeLayer = 0;
      this.djinnPendingResolve = false;
      this.djinnCardNonce = 0;
      this.djinnRepairCommitted = false;
      this.djinnTransition = null;
    },

    _buildDjinnMarks(layoutId) {
      return (DJINN_MARK_SETS[layoutId] || []).map((cell) => ({
        id: cell.id || `djinn-mark-${cell.row}-${cell.col}`,
        kind: cell.kind || (layoutId === 'joy' ? 'joyCandle' : 'blightMark'),
        row: cell.row,
        col: cell.col,
        cleared: false
      }));
    },

    _syncDjinnStageMonsters() {
      this.monsterTiles = this.monsterTiles.filter((monster) => monster.kind !== 'blightMark');
      if (this.djinnLayoutId !== 'health') return;
    },

    _buildDjinnObjective(stageNumber) {
      const stage = DJINN_WISHES.stages[stageNumber];
      if (!stage?.objective) return null;
      return {
        progress: 0,
        ...structuredClone(stage.objective)
      };
    },

    _advanceDjinnObjective() {
      if (!this.djinnObjective || this.phase !== 'playing') return 'continue';
      const objective = this.djinnObjective;

      if (objective.type === 'clearMarks') {
        objective.progress = this.djinnMarks.filter((mark) => mark.cleared).length;
        this._syncDjinnStageMonsters();
      } else if (objective.type === 'joyBursts') {
        objective.progress = Math.min(objective.progress || 0, objective.total || 0);
      } else if (objective.type === 'cakeSequence') {
        objective.progress = Math.min(this.djinnCakeLayer, objective.total || 0);
      }

      if ((objective.progress || 0) >= (objective.total || 0)) {
        this.djinnPendingResolve = true;
        this.djinnState = `stage${this.djinnStage}Resolve`;
        this.phase = 'wish';
        this.djinnCardNonce++;
        if (this.djinnStage === 1) {
          this.queueBark(GAMEPLAY_COPY.djinn.stageCompleteBarks[1]);
        } else if (this.djinnStage === 2) {
          this.queueBark(GAMEPLAY_COPY.djinn.stageCompleteBarks[2]);
        } else {
          this.queueBark(GAMEPLAY_COPY.djinn.stageCompleteBarks[3]);
        }
        return 'djinnResolve';
      }

      return 'continue';
    },

    recordDjinnBoardProgress({ clearedPositions = [], groupSizes = [], chain = 1, matchGroups = [] } = {}) {
      if (!this.djinnBoardStage || !this.djinnObjective) return;

      if (this.djinnObjective.type === 'clearMarks') {
        const activeMarks = new Set(
          this.boardEntities
            .filter((entity) => entity.kind === 'blightMark' && entity.removed)
            .map((entity) => entity.id)
        );
        for (const mark of this.djinnMarks) {
          if (!mark.cleared && activeMarks.has(mark.id)) {
            mark.cleared = true;
          }
        }
        this.djinnObjective.progress = this.djinnMarks.filter((mark) => mark.cleared).length;
        this.djinnObjective.progress = Math.min(
          this.djinnObjective.total || this.djinnObjective.progress,
          this.djinnObjective.progress + this.applyDjinnItemProgressBonus({ hasBig: (groupSizes || []).some((size) => size >= 4) })
        );
        this._syncDjinnStageMonsters();
        return;
      }

      if (this.djinnObjective.type === 'joyBursts') {
        const qualifies = (groupSizes || []).some((size) => size >= 4) || chain >= 2;
        if (!qualifies) return;
        const bonus = this.applyDjinnItemProgressBonus({ hasBig: (groupSizes || []).some((size) => size >= 4) });
        this.djinnObjective.progress = Math.min((this.djinnObjective.progress || 0) + 1 + bonus, this.djinnObjective.total || 0);
        return;
      }

      if (this.djinnObjective.type !== 'cakeSequence') return;

      if (this.djinnCakeLayer === 0) {
        const hasGrapeThree = (matchGroups || []).some((group) => group.char === 'g' && group.size >= 3);
        if (!hasGrapeThree) return;
        this.djinnCakeLayer = 1;
      } else if (this.djinnCakeLayer === 1) {
        const hasHerbThree = (matchGroups || []).some((group) => group.char === 'h' && group.size >= 3);
        if (!hasHerbThree) return;
        this.djinnCakeLayer = 2;
      } else if (this.djinnCakeLayer === 2) {
        const hasMagicThree = (matchGroups || []).some((group) => group.char === 'm' && group.size >= 3);
        if (!hasMagicThree && chain < 2) return;
        this.djinnCakeLayer = 3;
      }

      this.djinnObjective.progress = Math.min(
        this.djinnCakeLayer + this.applyDjinnItemProgressBonus({ hasBig: (groupSizes || []).some((size) => size >= 4) }),
        this.djinnObjective.total || this.djinnCakeLayer
      );
    },

    loadDjinnCeremonyBoard() {
      const layout = DJINN_CEREMONY_LAYOUTS[this.djinnLayoutId];
      if (!layout) return null;
      const rows = layout.map((row) => row.split(''));
      for (const entity of this.boardEntities) {
        if (entity.removed) continue;
        const width = entity.width || 1;
        const height = entity.height || 1;
        for (let dr = 0; dr < height; dr++) {
          for (let dc = 0; dc < width; dc++) {
            const row = entity.row + dr;
            const col = entity.col + dc;
            if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) continue;
            rows[row][col] = 'O';
          }
        }
      }
      for (const monster of this.monsterTiles) {
        if (monster.removed) continue;
        if (monster.row < 0 || monster.row >= BOARD_ROWS || monster.col < 0 || monster.col >= BOARD_COLS) continue;
        rows[monster.row][monster.col] = monster.char;
      }
      const cols = [];
      for (let col = 0; col < BOARD_COLS; col++) {
        let column = '';
        for (let row = 0; row < BOARD_ROWS; row++) {
          column += rows[row]?.[col] || 'g';
        }
        cols.push(column);
      }
      return `${cols.join('X')}X`;
    },

    _completeDjinnCeremony() {
      const day = DAYS[this.currentDay];
      for (const entity of this.boardEntities) {
        if (entity.kind === 'djinn') {
          entity.sleeping = false;
          entity.removed = true;
        }
      }
      for (const [id, need] of Object.entries(day.needs)) {
        this.progress[id] = this.needOverrides[id] ?? need;
      }
      if (!this.djinnRepairCommitted) {
        this.finishRepair();
      }

      this.djinnReleased = true;
      this.djinnUnlimitedSteps = false;
      this.djinnHintVisible = false;
      this.djinnState = 'completed';
      this.phase = 'ending';
    },

    rerollBoardEntities() {
      const fixed = [];
      for (const entity of this.boardEntities) {
        if (entity.removed) continue;
        if (entity.kind === 'djinn' || entity.kind === 'barrenGrave') fixed.push(entity);
      }

      const occupied = new Set();
      for (const entity of fixed) {
        const width = entity.width || 1;
        const height = entity.height || 1;
        for (let dr = 0; dr < height; dr++) {
          for (let dc = 0; dc < width; dc++) {
            occupied.add(`${entity.row + dr}:${entity.col + dc}`);
          }
        }
      }

      for (const monster of this.monsterTiles) {
        if (monster.removed) continue;
        const next = this._pickFreeEntitySpot(1, 1, occupied);
        if (!next) continue;
        monster.row = next.row;
        monster.col = next.col;
      }
    },

    _grantMonsterReward(kind) {
      const reward = MONSTERS[kind]?.clearReward || MONSTERS[kind]?.reward || {};
      for (const id of Object.keys(reward)) {
        this.progress[id] = (this.progress[id] || 0) + reward[id];
      }
    },

    _hasCurrentNeedsMet() {
      const day = DAYS[this.currentDay];
      if (!day) return false;
      for (const [id, need] of Object.entries(day.needs)) {
        const targetNeed = this.needOverrides[id] ?? need;
        if ((this.progress[id] || 0) < targetNeed) return false;
      }
      return true;
    },

    _countMonsterClears(n) {
      if (!this.unlockedAbilities.includes('agedBarrel') || !n) return;
      this.matchGroupsThisDay += n;
      while (this.matchGroupsThisDay >= 5) {
        this.matchGroupsThisDay -= 5;
        this.recoverSteps(1);
      }
    },

    applyMonsterPressure(boardApi) {
      if (!boardApi || this.phase !== 'playing') return [];
      return [];
    },

    _entityAdjacencyKeys(entity) {
      const width = entity.width || 1;
      const height = entity.height || 1;
      const keys = new Set();
      for (let dr = 0; dr < height; dr++) {
        for (let dc = 0; dc < width; dc++) {
          const row = entity.row + dr;
          const col = entity.col + dc;
          keys.add(`${row - 1}:${col}`);
          keys.add(`${row + 1}:${col}`);
          keys.add(`${row}:${col - 1}`);
          keys.add(`${row}:${col + 1}`);
        }
      }
      return [...keys];
    },

    _monsterWasHit(entity, clearedTiles, chain, matchGroups = []) {
      const rule = MONSTERS[entity.kind]?.damageRule || MONSTERS[entity.kind]?.clearRule || { type: 'orthogonalAdjacent' };
      const adjacentKeys = new Set(this._entityAdjacencyKeys(entity));
      const hasAdjacent = clearedTiles.some((tile) => adjacentKeys.has(`${tile.row}:${tile.col}`));
      const hasAdjacentVertical = clearedTiles.some((tile) => (
        tile.axis === 'col' && tile.col === entity.col && (tile.row === entity.row - 1 || tile.row === entity.row + 1)
      ));
      const hasUnderfoot = clearedTiles.some((tile) => tile.row === entity.row + 1 && tile.col === entity.col);
      const hasRowHorizontal = matchGroups.some((group) => (
        group.axis === 'row' && group.positions?.some((pos) => pos.row === entity.row && Math.abs(pos.col - entity.col) <= 1)
      ));
      const hasRowBigHorizontal = matchGroups.some((group) => (
        group.axis === 'row' &&
        (group.size || 0) >= 4 &&
        group.positions?.some((pos) => pos.row === entity.row)
      ));
      const hasBigAdjacent = clearedTiles.some((tile) => adjacentKeys.has(`${tile.row}:${tile.col}`) && (tile.groupSize || 0) >= 4);

      switch (rule.type) {
        case 'none': return false;
        case 'verticalAdjacent': return hasAdjacentVertical;
        case 'underfootOrRowHorizontal': return hasUnderfoot || hasRowHorizontal;
        case 'rowBigHorizontal': return hasRowBigHorizontal;
        case 'qualityAdjacent': return (chain >= 2 && hasAdjacent) || hasBigAdjacent;
        case 'orthogonalAdjacent':
        case 'adjacentMatch':
        default: return hasAdjacent;
      }
    },

    _pickFreeEntitySpot(width, height, occupied) {
      const choices = [];
      for (let row = 0; row <= BOARD_ROWS - height; row++) {
        for (let col = 0; col <= 8 - width; col++) {
          let conflict = false;
          for (let dr = 0; dr < height && !conflict; dr++) {
            for (let dc = 0; dc < width; dc++) {
              if (occupied.has(`${row + dr}:${col + dc}`)) {
                conflict = true;
                break;
              }
            }
          }
          if (!conflict) choices.push({ row, col });
        }
      }

      if (!choices.length) return null;
      const pick = choices[Math.floor(Math.random() * choices.length)];
      for (let dr = 0; dr < height; dr++) {
        for (let dc = 0; dc < width; dc++) {
          occupied.add(`${pick.row + dr}:${pick.col + dc}`);
        }
      }
      return pick;
    },

    _newMonsterEntity(kind, row, col, id = null, overrides = {}) {
      return {
        id: id || `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind,
        row,
        col,
        width: 1,
        height: 1,
        hitsTaken: 0,
        hitsRequired: MONSTERS[kind].hp || MONSTERS[kind].hits || 0,
        shield: 0,
        lastDamagedTurn: null,
        lastPressureTurn: null,
        ownedRotCells: [],
        phase: 0,
        removed: false,
        seenIntro: false,
        hidden: false,
        blocksBoard: true,
        ...overrides
      };
    },

    _newMonsterTile(kind, row, col, id = null) {
      return {
        id: id || `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind,
        char: MONSTERS[kind].char,
        row,
        col,
        hitsTaken: 0,
        hitsRequired: MONSTERS[kind].hp || MONSTERS[kind].hits,
        shield: 0,
        lastDamagedTurn: null,
        lastPressureTurn: null,
        ownedRotCells: [],
        phase: 0,
        removed: false,
        seenIntro: false
      };
    },

    _ensureActiveEntities() {
      if (!this.boardEntities.length) {
        this.boardEntities = this._buildDayLayout(this.currentDay);
      }
      if (!this.monsterTiles.length) {
        this.monsterTiles = this._buildDayMonsters(this.currentDay);
      }
    },

    _buildDayLayout(dayIndex) {
      const layout = DAY_MONSTER_LAYOUTS[dayIndex] || [];
      const graves = BARREN_GRAVE_LAYOUTS[dayIndex] || [];
      return [
        ...graves.map((item) => this._newMonsterEntity(
          'barrenGrave',
          item.row,
          item.col,
          item.id
        )),
        ...layout.map((item) => this._newMonsterEntity(
          item.kind,
          item.row,
          item.col,
          item.id,
          {
            width: item.width || 1,
            height: item.height || 1,
            sleeping: item.kind === 'djinn'
          }
        ))
      ].filter((item) => item.kind === 'djinn' || item.kind === 'barrenGrave');
    },

    _buildDayMonsters(dayIndex) {
      const layout = DAY_MONSTER_LAYOUTS[dayIndex] || [];
      return layout
        .filter((item) => item.kind !== 'djinn')
        .map((item) => this._newMonsterTile(item.kind, item.row, item.col, item.id));
    },

    monsterAt(row, col) {
      return this.monsterTiles.find((monster) => !monster.removed && monster.row === row && monster.col === col) || null;
    },

    serializeMonsterMap() {
      return this.monsterTiles
        .filter((monster) => !monster.removed)
        .map((monster) => `${monster.char}:${monster.row}:${monster.col}`)
        .join('|');
    },

    applyMonsterPositionsFromBoard(tileString) {
      const next = [];
      const chars = tileString.split('');
      let col = 0;
      let row = 0;
      const availableByChar = {};
      for (const monster of this.monsterTiles) {
        if (monster.removed) continue;
        (availableByChar[monster.char] ??= []).push(monster);
      }

      while (chars.length) {
        const ch = chars.shift();
        if (ch === 'X') { col++; row = 0; continue; }
        if (MONSTER_CHARS.includes(ch)) {
          const bucket = availableByChar[ch] || [];
          const monster = this._takeClosestMonster(bucket, row, col);
          if (monster) {
            monster.row = row;
            monster.col = col;
            next.push(monster.id);
          }
        }
        row++;
      }

      for (const monster of this.monsterTiles) {
        if (monster.removed) continue;
        if (!next.includes(monster.id)) monster.removed = true;
      }
    },

    _takeClosestMonster(bucket, row, col) {
      if (!bucket?.length) return null;

      let bestIndex = 0;
      let bestScore = Number.POSITIVE_INFINITY;

      for (let i = 0; i < bucket.length; i++) {
        const monster = bucket[i];
        const exact = monster.row === row && monster.col === col;
        const dist = Math.abs((monster.row ?? 0) - row) + Math.abs((monster.col ?? 0) - col);
        const score = exact ? -1 : dist;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      const [monster] = bucket.splice(bestIndex, 1);
      return monster || null;
    },

    _calcPigRating() {
      if (this.stepsLeft >= PIG_RATING.thresholds.threeStar) return 3;
      if (this.stepsLeft >= PIG_RATING.thresholds.twoStar) return 2;
      if (this.stepsLeft >= 0) return 1;
      return 0;
    },

    _rollPigAngryThreshold() {
      return 5 + Math.floor(Math.random() * 3);
    },

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
