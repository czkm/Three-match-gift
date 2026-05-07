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
  DAYS,
  ABILITIES,
  RESOURCE_BY_ID,
  RESOURCE_BY_CHAR,
  DAY_END_LINES,
  ENDING,
  MONSTER_CHARS,
  MONSTERS,
  DAY_MONSTER_LAYOUTS,
  DJINN_WISHES
} from '@/data/content';

const MAX_STEPS = 20;
const BOARD_ROWS = 8;

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
    giftText: ENDING.defaultGift,
    giftAttemptedText: '',
    giftWasOverridden: false,

    // Board entities + bark lines
    boardEntities: [],
    monsterTiles: [],
    barkLine: '',
    barkNonce: 0,

    // Day-specific modifiers
    needOverrides: {},
    dayBuffs: {
      extraResourcePerType: false
    },

    // Day 9 djinn / wish state
    djinnProgress: 0,
    djinnHintVisible: false,
    djinnReleased: false,
    wishStage: 0,
    wishResolved: false,
    wishResolveLine: '',
    pendingWishPhase: 'playing',
    pendingWishReleasedCells: []
  }),

  getters: {
    today(state)        { return DAYS[state.currentDay]; },
    dayCount(state)     { return DAYS.length; },
    isLastDay(state)    { return state.currentDay >= DAYS.length - 1; },
    completedBuildingsCount(state) { return state.unlockedAbilities.length; },
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
    currentWish(state) {
      return DJINN_WISHES.stages[state.wishStage] || null;
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
      this.giftText = ENDING.defaultGift;
      this.giftAttemptedText = '';
      this.giftWasOverridden = false;
      this._resetDaySpecialState();
      this.phase = 'intro';
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
      if (this.djinnActive) this.djinnHintVisible = true;
    },

    nextDay() {
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

      return summary;
    },

    /* ---------- repair completion ---------- */

    /** Called when the board finishes a swap and resources are checked. */
    onAfterMove() {
      const needsReady = this._hasCurrentNeedsMet();
      if (this.currentDay === DAYS.length - 1 && needsReady && !this.djinnReleased) {
        this.phase = 'playing';
        return 'djinn';
      }
      if (needsReady) {
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
      if (!this.unlockedAbilities.includes(day.ability)) this.unlockedAbilities.push(day.ability);
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

    queueBark(line) {
      if (!line) return;
      this.barkLine = line;
      this.barkNonce++;
    },

    dismissBark() {
      this.barkLine = '';
    },

    resolveBoardEntities(clearedTiles = [], chain = 1, source = 'match') {
      if (!clearedTiles.length) return { removedCount: 0, djinnHit: false };
      if (this.wishStage > 0 || this.phase === 'wish') {
        return { removedCount: 0, djinnHit: false };
      }
      if (source !== 'match') {
        return { removedCount: 0, djinnHit: false };
      }
      const cleared = new Set(clearedTiles.map((tile) => `${tile.row}:${tile.col}`));
      const removed = [];

      for (const monster of this.monsterTiles) {
        if (monster.removed) continue;
        const hit = this._monsterWasHit(monster, clearedTiles, chain);
        if (!hit) continue;
        monster.hitsTaken = (monster.hitsTaken || 0) + 1;
        if (monster.hitsTaken >= monster.hitsRequired) {
          monster.removed = true;
          removed.push(monster);
        }
      }

      if (removed.length) {
        for (const entity of removed) this._grantMonsterReward(entity.kind);
        this._countMonsterClears(removed.length);
        const line = MONSTERS[removed[0].kind]?.removeLine;
        if (line) this.queueBark(line);
      }

      let djinnHit = false;
      const djinn = this.djinnEntity;
      if (djinn && this.djinnProgress < 3 && chain === 1) {
        djinnHit = this._djinnTriggerKeys(djinn).some((key) => cleared.has(key));
        if (djinnHit) this.beginWishStage(this.djinnProgress + 1);
      }

      return {
        removedCount: removed.length,
        djinnHit,
        removedCells: removed.map((monster) => ({ row: monster.row, col: monster.col }))
      };
    },

    beginWishStage(stage) {
      this.wishStage = stage;
      this.djinnProgress = stage;
      this.wishResolved = false;
      this.wishResolveLine = '';
      this.djinnHintVisible = false;
      this.pendingWishPhase = 'playing';
      this.pendingWishReleasedCells = [];
      this.pendingAbility = null;
      this.phase = 'wish';
    },

    resolveWishChoice(choiceId) {
      const stage = this.wishStage;
      const currentWish = DJINN_WISHES.stages[stage];
      if (!currentWish) return 'playing';

      if (stage === 1 && choiceId === 'banish') {
        const releasedCells = [];
        for (const monster of this.monsterTiles) {
          if (!monster.removed) {
            releasedCells.push({ row: monster.row, col: monster.col });
            monster.removed = true;
          }
        }
        this.pendingWishReleasedCells = releasedCells;
        this.pendingWishPhase = 'playing';
      } else if (stage === 2) {
        if (choiceId === 'ease-estate') {
          const day = DAYS[this.currentDay];
          for (const [id, need] of Object.entries(day.needs)) {
            const reduced = Math.max(this.progress[id] || 0, Math.ceil(need * 0.7));
            this.needOverrides[id] = reduced;
          }
          this.pendingWishPhase = 'refreshBoard';
        } else if (choiceId === 'rich-vintage') {
          this.recoverSteps(5);
          this.dayBuffs.extraResourcePerType = true;
          this.pendingWishPhase = 'playing';
        } else if (choiceId === 'roach-healthy') {
          if (this.unlockedAbilities.includes('roachPath')) {
            this.abilityUses.roachPath = Math.max(this.abilityUses.roachPath || 0, 4);
          }
          this.pendingWishPhase = 'playing';
        }
      } else if (stage === 3 && choiceId === 'bind-fate') {
        const releasedCells = [];
        for (const entity of this.boardEntities) {
          if (entity.kind === 'djinn') {
            const width = entity.width || 1;
            const height = entity.height || 1;
            for (let dr = 0; dr < height; dr++) {
              for (let dc = 0; dc < width; dc++) {
                releasedCells.push({ row: entity.row + dr, col: entity.col + dc });
              }
            }
            entity.removed = true;
          }
        }
        this.djinnReleased = true;
        const day = DAYS[this.currentDay];
        for (const [id, need] of Object.entries(day.needs)) {
          this.progress[id] = this.needOverrides[id] ?? need;
        }
        this.pendingWishReleasedCells = releasedCells;
        this.pendingWishPhase = 'repairing';
      }

      this.wishResolved = true;
      this.wishResolveLine = currentWish.resolveLine;
      return this.pendingWishPhase;
    },

    finishWishStage(nextPhase) {
      this.wishResolved = false;
      this.wishResolveLine = '';
      this.wishStage = 0;
      this.pendingWishPhase = 'playing';
      this.pendingWishReleasedCells = [];
      this.phase = nextPhase;
    },

    spawnDjinnEncounter() {
      if (this.djinnActive || this.djinnReleased) return;
      this.boardEntities = [this._newMonsterEntity('djinn', 3, 3, `djinn-${Date.now()}`, { width: 2, height: 2, seenIntro: true })];
      this.djinnHintVisible = true;
      this.queueBark(MONSTERS.djinn.introLine);
    },

    /* ---------- gift text ---------- */

    setGiftDedication({ finalText, attemptedText, overridden } = {}) {
      const attempted = (attemptedText && attemptedText.trim()) || '';
      this.giftText = (finalText && finalText.trim()) || ENDING.defaultGift;
      this.giftAttemptedText = attempted;
      this.giftWasOverridden = Boolean(overridden);
    },

    skipDayForTesting() {
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
        this.spawnDjinnEncounter();
        this.phase = 'playing';
        return {
          kind: 'djinn',
          day: this.currentDay + 1,
          building: '迪精'
        };
      }
      this.phase = 'repairing';
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
      this.barkLine = '';
      this.barkNonce = 0;
      this.needOverrides = {};
      this.dayBuffs = { extraResourcePerType: false };
      this.djinnProgress = 0;
      this.djinnHintVisible = false;
      this.djinnReleased = false;
      this.wishStage = 0;
      this.wishResolved = false;
      this.wishResolveLine = '';
      this.pendingWishPhase = 'playing';
      this.pendingWishReleasedCells = [];
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
      const reward = MONSTERS[kind]?.reward || {};
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

    _djinnTriggerKeys(entity) {
      const top = entity.row - 1;
      const left = entity.col - 1;
      const bottom = entity.row + (entity.height || 2);
      const right = entity.col + (entity.width || 2);
      return [
        `${top}:${left}`,
        `${top}:${right}`,
        `${bottom}:${left}`,
        `${bottom}:${right}`
      ];
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

    _monsterWasHit(entity, clearedTiles, chain) {
      const rule = MONSTERS[entity.kind]?.clearRule || { type: 'adjacentMatch' };
      const adjacentKeys = new Set(this._entityAdjacencyKeys(entity));
      if (rule.type !== 'adjacentMatch') return false;
      return clearedTiles.some((tile) => adjacentKeys.has(`${tile.row}:${tile.col}`));
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
        hitsRequired: MONSTERS[kind].hits,
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
        hitsRequired: MONSTERS[kind].hits,
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
        { width: item.width || 1, height: item.height || 1 }
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
      const existingById = new Map(this.monsterTiles.map((monster) => [monster.id, monster]));
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
          const monster = bucket.shift();
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
