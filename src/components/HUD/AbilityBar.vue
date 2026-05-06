<template>
  <div class="ability-bar parchment grain">
    <h3 class="ink-title">能力</h3>

    <!-- Active abilities -->
    <div class="active-list">
      <button
        v-for="ab in game.activeAbilities"
        :key="ab.id"
        class="ab-btn"
        :class="{ disabled: !game.canUseAbility(ab.id), pending: game.pendingAbility === ab.id }"
        :disabled="!game.canUseAbility(ab.id)"
        :title="ab.desc"
        @click="onTrigger(ab)"
      >
        <span class="ab-icon">{{ ab.icon }}</span>
        <span class="ab-name">{{ ab.name }}</span>
        <span class="ab-uses">×{{ game.abilityUses[ab.id] ?? 0 }}</span>
      </button>
    </div>

    <!-- Resource conversion (lilacSeed) inline modal -->
    <div v-if="lilacOpen" class="convert-panel parchment">
      <p class="ink-title">将哪种资源变成哪种？</p>
      <div class="dual">
        <div>
          <p class="ink-subtle">从</p>
          <div class="chips">
            <button
              v-for="r in resources"
              :key="`from-${r.id}`"
              class="chip"
              :class="{ active: lilacFrom === r.id }"
              @click="lilacFrom = r.id"
            >{{ r.emoji }} {{ r.cn }}</button>
          </div>
        </div>
        <div>
          <p class="ink-subtle">到</p>
          <div class="chips">
            <button
              v-for="r in resources"
              :key="`to-${r.id}`"
              class="chip"
              :class="{ active: lilacTo === r.id }"
              :disabled="r.id === lilacFrom"
              @click="lilacTo = r.id"
            >{{ r.emoji }} {{ r.cn }}</button>
          </div>
        </div>
      </div>
      <div class="actions">
        <button class="apply" :disabled="!lilacReady" @click="applyLilac">变身</button>
        <button class="cancel" @click="cancelLilac">取消</button>
      </div>
    </div>

    <!-- Passives (info only) -->
    <div v-if="game.passiveAbilities.length" class="passive-list">
      <p class="ink-subtle title">被动</p>
      <div
        v-for="ab in game.passiveAbilities"
        :key="ab.id"
        class="passive"
        :title="ab.desc"
      >
        <span class="ab-icon small">{{ ab.icon }}</span>
        <span class="ab-name small">{{ ab.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { ABILITIES, RESOURCES, unlockedCharsForDay } from '@/data/content';

const props = defineProps({
  /** Reference to GameBoard exposed methods (refresh / convert). */
  boardRef: { type: Object, default: null }
});

const game = useGameStore();
const resources = computed(() => {
  const allowed = new Set(unlockedCharsForDay(game.currentDay));
  return RESOURCES.filter((r) => allowed.has(r.char));
});

const lilacOpen = ref(false);
const lilacFrom = ref(null);
const lilacTo   = ref(null);
const lilacReady = computed(() => lilacFrom.value && lilacTo.value && lilacFrom.value !== lilacTo.value);

function onTrigger(ab) {
  if (!game.canUseAbility(ab.id)) return;

  if (ab.id === 'whiteWolfTidy') {
    props.boardRef?.abilityRefresh?.();
    game.consumeAbility(ab.id);
  } else if (ab.id === 'hearthStew') {
    game.recoverSteps(5);
    game.consumeAbility(ab.id);
  } else if (ab.id === 'lilacSeed') {
    lilacOpen.value = true;
    lilacFrom.value = null;
    lilacTo.value   = null;
    game.beginTarget(ab.id);
  } else if (ab.needsTarget) {
    game.beginTarget(ab.id);
  } else {
    game.consumeAbility(ab.id);
  }
}

function applyLilac() {
  if (!lilacReady.value) return;
  props.boardRef?.abilityConvertResource?.(lilacFrom.value, lilacTo.value);
  game.consumeAbility('lilacSeed');
  lilacOpen.value = false;
}

function cancelLilac() {
  lilacOpen.value = false;
  game.cancelTarget();
}
</script>

<style scoped>
.ability-bar {
  width: 220px;
  padding: 14px 16px;
  border-radius: 6px;
  position: relative;
}
h3 { margin: 0 0 10px; font-size: 14px; letter-spacing: 0.08em; }

.active-list { display: flex; flex-direction: column; gap: 6px; }
.ab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(58, 42, 31, 0.08);
  border: 1px solid rgba(208, 168, 87, 0.5);
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
  font-size: 13px;
  text-align: left;
}
.ab-btn:hover:not(:disabled) {
  background: rgba(208, 168, 87, 0.3);
  transform: translateY(-1px);
}
.ab-btn.pending {
  background: rgba(176, 148, 201, 0.45);
  border-color: var(--lilac);
}
.ab-btn.disabled { opacity: 0.45; }
.ab-icon { font-size: 18px; }
.ab-icon.small { font-size: 14px; }
.ab-name { flex: 1; font-weight: 600; }
.ab-name.small { font-weight: 500; font-size: 12px; }
.ab-uses {
  font-size: 11px;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.45);
  padding: 1px 6px;
  border-radius: 999px;
}

.passive-list { margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(58, 42, 31, 0.3); }
.passive-list .title { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.1em; }
.passive {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  font-size: 12px;
  color: var(--ink-soft);
}

.convert-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  width: 280px;
  padding: 12px 14px;
  border-radius: 6px;
  z-index: 12;
}
.convert-panel p { margin: 0 0 6px; font-size: 13px; }
.dual { display: flex; gap: 10px; }
.dual > div { flex: 1; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chip {
  background: rgba(58, 42, 31, 0.08);
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid rgba(58, 42, 31, 0.18);
}
.chip.active {
  background: var(--lilac);
  color: var(--paper);
  border-color: var(--magic-1);
}
.chip:disabled { opacity: 0.4; }
.actions { display: flex; gap: 8px; margin-top: 10px; }
.apply, .cancel {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.apply  { background: var(--gold); color: var(--ink); }
.apply:disabled { background: rgba(208, 168, 87, 0.4); }
.cancel { background: var(--ink); color: var(--paper); }
</style>
