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
  DJINN_WISHES,
  DJINN_CEREMONY_LAYOUTS,
  DJINN_MARK_SETS,
  DJINN_STAGE_TRANSITIONS,
  ROT_CHAR,
  unlockedCharsForDay
} from '@/data/content';

const MAX_STEPS = 20;
const BOARD_ROWS = 8;
const BOARD_COLS = 8;

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

    // Day-specific modifiers
    needOverrides: {},
    dayBuffs: {
      extraResourcePerType: false
    },

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

      for (const ch of allowed) {
        const resource = RESOURCE_BY_CHAR[ch];
        if (!resource) continue;

        const remaining = remainingById[resource.id] ?? 0;
        if (remaining > 0) {
          const urgency = maxRemaining > 0 ? remaining / maxRemaining : 0;
          weights[ch] = 3 + urgency * 2;
        } else if (resource.id in day.needs) {
          weights[ch] = 1.35;
        } else {
          weights[ch] = 1.15;
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
          healthLabel: '仪式已经就绪',
          weakness: DJINN_WISHES.readyHint,
          pressure: DJINN_WISHES.readyLine,
          echo: '点击迪精，开始最后的三愿仪式。'
        };
      }

      const stage = DJINN_WISHES.stages[state.djinnStage];
      const objective = state.djinnObjective;
      if (!stage || !objective) return null;

      let healthLabel = objective.label || '';
      let weakness = '';
      let pressure = '';

      if (objective.type === 'clearMarks') {
        healthLabel = `病气印记 ${objective.progress} / ${objective.total}`;
        weakness = objective.label;
        pressure = stage.wishText;
      } else if (objective.type === 'joyBursts') {
        healthLabel = `欢欣火花 ${objective.progress} / ${objective.total}`;
        weakness = objective.label;
        pressure = objective.rulesText || '';
      } else if (objective.type === 'cakeSequence') {
        healthLabel = `蛋糕进度 ${objective.progress} / ${objective.total}`;
        weakness = objective.steps?.[objective.progress] || objective.label;
        pressure = '按照顺序完成蛋糕底座、奶油和蜡烛。';
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
            healthLabel: '睡眠中 💤',
            weakness: DJINN_WISHES.sleepHint,
            pressure: DJINN_WISHES.sleepLine,
            echo: '先把房间准备好，再把她叫醒。',
            source: info.source
          };
        }

        const summary = this.djinnObjectiveSummary;
        return {
          kind: info.kind,
          entityId: entity.id,
          emoji: monster.emoji,
          label: summary?.title || monster.uiLabel || monster.name,
          healthLabel: summary?.healthLabel || '先把第九天的房间准备好。',
          weakness: summary?.weakness || '当资源达标后，迪精会回应最后的仪式。',
          pressure: summary?.pressure || '',
          echo: summary?.echo || '',
          source: info.source
        };
      }

      const entity = state.monsterTiles.find((item) => item.id === info.entityId && !item.removed)
        || state.monsterTiles.find((item) => !item.removed && item.kind === info.kind);
      if (!entity) return null;

      const hitsRequired = entity.hitsRequired || monster.hp || monster.hits || 1;
      const hitsTaken = entity.hitsTaken || 0;
      const remaining = Math.max(0, hitsRequired - hitsTaken);
      const shield = entity.shield || 0;

      return {
        kind: info.kind,
        entityId: entity.id,
        emoji: monster.emoji,
        label: monster.uiLabel || monster.name,
        healthLabel: shield > 0 ? `剩余 ${remaining} / ${hitsRequired} · 护纱 ${shield}` : `剩余 ${remaining} / ${hitsRequired}`,
        weakness: monster.uiWeaknessShort || monster.damageRule?.hint || monster.clearRule?.hint || '',
        pressure: monster.uiPressureShort || '若放着不管，会继续占住做局空间。',
        echo: monster.echoLabel || '',
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
      const achievements = useAchievementStore();
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
      this.giftText = ENDING.defaultGift;
      this.giftAttemptedText = '';
      this.giftWasOverridden = false;
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
      this.stepsLeft = MAX_STEPS;
      this.progress = {};
      this.pendingAbility = null;
      this.matchGroupsThisDay = 0;
      this.introShown = false;
      this.hintMove = null;
      this._resetDaySpecialState();
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
      if (this.djinnReady) return false;
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
      const achievements = useAchievementStore();
      if (this.abilityUses[id] != null) this.abilityUses[id]--;
      this.turnId++;
      this.pendingAbility = null;
      this.phase = 'playing';
      achievements.track('abilityUsed', {
        day: this.currentDay + 1,
        id
      });
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
      if (clearedTiles.some((tile) => tile.char === ROT_CHAR)) {
        const clearedRot = new Set(clearedTiles.filter((tile) => tile.char === ROT_CHAR).map((tile) => `${tile.row}:${tile.col}`));
        this.rotCells = this.rotCells.filter((cell) => !clearedRot.has(`${cell.row}:${cell.col}`));
      }

      if (source === 'match') {
        for (const monster of this.monsterTiles) {
          if (monster.removed) continue;
          const hit = this._monsterWasHit(monster, clearedTiles, chain, matchGroups);
          if (!hit) continue;
          monster.lastDamagedTurn = this.turnId;
          if ((monster.shield || 0) > 0) {
            monster.shield = Math.max(0, (monster.shield || 0) - 1);
            continue;
          }
          monster.hitsTaken = (monster.hitsTaken || 0) + 1;
          if (monster.hitsTaken >= monster.hitsRequired) {
            monster.removed = true;
            removed.push(monster);
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
            removed.push(entity);
          }
        }
      }

      const removedRotCells = [];
      for (const entity of removed) {
        if (entity.kind !== 'ghoul') continue;
        for (const cell of this.rotCells) {
          if (cell.ownerId === entity.id) removedRotCells.push({ row: cell.row, col: cell.col });
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
        removedCells: [
          ...removed.map((monster) => ({ row: monster.row, col: monster.col })),
          ...removedRotCells
        ]
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
      this.stepsLeft = MAX_STEPS;
      this.progress = {};
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
      this.stepsLeft = MAX_STEPS;
      this.progress = { ...DAYS[targetIndex].needs };
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
          this.queueBark('病气退开了。');
        } else if (this.djinnStage === 2) {
          this.queueBark('灯火已经亮起来了。');
        } else {
          this.queueBark('蛋糕做好了。');
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
        this._syncDjinnStageMonsters();
        return;
      }

      if (this.djinnObjective.type === 'joyBursts') {
        const qualifies = (groupSizes || []).some((size) => size >= 4) || chain >= 2;
        if (!qualifies) return;
        this.djinnObjective.progress = Math.min((this.djinnObjective.progress || 0) + 1, this.djinnObjective.total || 0);
        return;
      }

      if (this.djinnObjective.type !== 'cakeSequence') return;

      if (this.djinnCakeLayer === 0) {
        const hasGrapeFour = (matchGroups || []).some((group) => group.char === 'g' && group.size >= 4);
        if (!hasGrapeFour) return;
        this.djinnCakeLayer = 1;
      } else if (this.djinnCakeLayer === 1) {
        const hasHerbFour = (matchGroups || []).some((group) => group.char === 'h' && group.size >= 4);
        if (!hasHerbFour) return;
        this.djinnCakeLayer = 2;
      } else if (this.djinnCakeLayer === 2) {
        const hasMagicThree = (matchGroups || []).some((group) => group.char === 'm' && group.size >= 3);
        if (!hasMagicThree && chain < 2) return;
        this.djinnCakeLayer = 3;
      }

      this.djinnObjective.progress = this.djinnCakeLayer;
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
        if (entity.kind === 'djinn') fixed.push(entity);
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
      if (kind === 'ghoul') this._clearOwnedRotCells(kind);
      if (kind === 'wraith') this.skipMonsterPressureTurn = this.turnId + 1;
    },

    _clearOwnedRotCells(ownerIdOrKind) {
      const owners = new Set(
        this.monsterTiles
          .filter((monster) => monster.id === ownerIdOrKind || monster.kind === ownerIdOrKind)
          .map((monster) => monster.id)
      );
      this.rotCells = this.rotCells.filter((cell) => !owners.has(cell.ownerId));
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
      if (this.skipMonsterPressureTurn === this.turnId) return [];

      const actions = [];
      const occupiedByMonster = () => new Set(
        this.monsterTiles
          .filter((monster) => !monster.removed)
          .map((monster) => `${monster.row}:${monster.col}`)
      );

      for (const monster of this.monsterTiles) {
        if (monster.removed) continue;
        if (monster.lastPressureTurn === this.turnId) continue;
        if (monster.lastDamagedTurn === this.turnId) continue;
        const rule = MONSTERS[monster.kind]?.pressureRule?.type;

        if (rule === 'edgeJump') {
          const next = this._nextEdgeJumpCell(monster, boardApi, occupiedByMonster());
          if (!next) continue;
          const char = boardApi.getTile(monster.row, monster.col);
          const target = boardApi.getTile(next.row, next.col);
          boardApi.setTile(monster.row, monster.col, target || boardApi.hole);
          boardApi.setTile(next.row, next.col, char);
          monster.row = next.row;
          monster.col = next.col;
          monster.lastPressureTurn = this.turnId;
          actions.push({ type: 'edgeJump', id: monster.id, row: next.row, col: next.col });
        } else if (rule === 'sink') {
          const row = monster.row + 1;
          const col = monster.col;
          if (row >= BOARD_ROWS || boardApi.isBlocked(row, col) || boardApi.isMonster(boardApi.getTile(row, col))) continue;
          const char = boardApi.getTile(monster.row, monster.col);
          const target = boardApi.getTile(row, col);
          boardApi.setTile(monster.row, monster.col, target || boardApi.hole);
          boardApi.setTile(row, col, char);
          monster.row = row;
          monster.col = col;
          monster.lastPressureTurn = this.turnId;
          actions.push({ type: 'sink', id: monster.id, row, col });
        } else if (rule === 'flyUp') {
          const row = monster.row - 1;
          const col = monster.col;
          if (row < 0 || boardApi.isBlocked(row, col) || boardApi.isMonster(boardApi.getTile(row, col))) continue;
          const char = boardApi.getTile(monster.row, monster.col);
          const target = boardApi.getTile(row, col);
          boardApi.setTile(monster.row, monster.col, target || boardApi.hole);
          boardApi.setTile(row, col, char);
          monster.row = row;
          monster.col = col;
          monster.lastPressureTurn = this.turnId;
          actions.push({ type: 'flyUp', id: monster.id, row, col });
        } else if (rule === 'rotUnderfoot') {
          const row = monster.row + 1;
          const col = monster.col;
          if (row >= BOARD_ROWS || boardApi.isBlocked(row, col) || boardApi.isMonster(boardApi.getTile(row, col))) continue;
          boardApi.setTile(row, col, ROT_CHAR);
          this._upsertRotCell(row, col, monster.id);
          monster.ownedRotCells = [...new Set([...(monster.ownedRotCells || []), `${row}:${col}`])];
          monster.lastPressureTurn = this.turnId;
          actions.push({ type: 'rotUnderfoot', id: monster.id, row, col });
        } else if (rule === 'restoreShield') {
          monster.shield = Math.min(1, (monster.shield || 0) + 1);
          monster.lastPressureTurn = this.turnId;
          actions.push({ type: 'restoreShield', id: monster.id, shield: monster.shield });
        }
      }

      return actions;
    },

    _upsertRotCell(row, col, ownerId) {
      const existing = this.rotCells.find((cell) => cell.row === row && cell.col === col);
      if (existing) {
        existing.ownerId = ownerId;
        return;
      }
      this.rotCells.push({ row, col, ownerId });
    },

    _nextEdgeJumpCell(monster, boardApi, occupied) {
      const rowDir = monster.row < (BOARD_ROWS - 1) / 2 ? -1 : 1;
      const colDir = monster.col < (BOARD_COLS - 1) / 2 ? -1 : 1;
      const candidates = Math.min(monster.row, BOARD_ROWS - 1 - monster.row) <= Math.min(monster.col, BOARD_COLS - 1 - monster.col)
        ? [{ row: monster.row + rowDir, col: monster.col }, { row: monster.row, col: monster.col + colDir }]
        : [{ row: monster.row, col: monster.col + colDir }, { row: monster.row + rowDir, col: monster.col }];

      return candidates.find((cell) => (
        cell.row >= 0 && cell.row < BOARD_ROWS && cell.col >= 0 && cell.col < BOARD_COLS &&
        !boardApi.isBlocked(cell.row, cell.col) && !occupied.has(`${cell.row}:${cell.col}`)
      )) || null;
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
        shield: kind === 'wraith' ? 1 : 0,
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
        shield: kind === 'wraith' ? 1 : 0,
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
      return layout.map((item) => this._newMonsterEntity(
        item.kind,
        item.row,
        item.col,
        item.id,
        {
          width: item.width || 1,
          height: item.height || 1,
          sleeping: item.kind === 'djinn'
        }
      )).filter((item) => item.kind === 'djinn');
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
