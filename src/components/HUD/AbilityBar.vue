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
  width: 238px;
  padding: 16px 16px 18px;
  border-radius: 14px;
  position: relative;
  box-shadow: var(--surface-shadow);
}
h3 {
  margin: 0 0 12px;
  font-size: 13px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.active-list { display: flex; flex-direction: column; gap: 6px; }
.ab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(255, 247, 224, 0.2) 0%, rgba(255, 247, 224, 0.04) 18%),
    linear-gradient(180deg, rgba(58, 42, 31, 0.1) 0%, rgba(58, 42, 31, 0.06) 100%);
  border: 1px solid rgba(208, 168, 87, 0.32);
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
  font-size: 13px;
  text-align: left;
  box-shadow:
    inset 0 1px 0 rgba(255, 243, 214, 0.16),
    0 6px 12px rgba(24, 16, 10, 0.08);
}
.ab-btn:hover:not(:disabled) {
  background:
    linear-gradient(180deg, rgba(255, 247, 224, 0.26) 0%, rgba(255, 247, 224, 0.08) 18%),
    linear-gradient(180deg, rgba(208, 168, 87, 0.28) 0%, rgba(138, 93, 45, 0.16) 100%);
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 243, 214, 0.24),
    0 10px 18px rgba(24, 16, 10, 0.12);
}
.ab-btn.pending {
  background:
    linear-gradient(180deg, rgba(255, 247, 224, 0.22) 0%, rgba(255, 247, 224, 0.06) 18%),
    linear-gradient(180deg, rgba(176, 148, 201, 0.42) 0%, rgba(116, 86, 140, 0.26) 100%);
  border-color: rgba(126, 88, 161, 0.8);
}
.ab-btn.disabled { opacity: 0.45; }
.ab-icon { font-size: 19px; }
.ab-icon.small { font-size: 14px; }
.ab-name { flex: 1; font-weight: 600; }
.ab-name.small { font-weight: 500; font-size: 12px; }
.ab-uses {
  font-size: 11px;
  color: var(--ink-faint);
  background: rgba(255, 255, 255, 0.45);
  padding: 1px 6px;
  border-radius: 999px;
}

.passive-list { margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(58, 42, 31, 0.22); }
.passive-list .title { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.1em; }
.passive {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 7px;
  font-size: 12px;
  color: var(--ink-soft);
  border-radius: 10px;
  background: rgba(255, 248, 228, 0.16);
}

.convert-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  width: 294px;
  padding: 14px 15px;
  border-radius: 12px;
  z-index: 12;
  box-shadow: var(--surface-shadow);
}
.convert-panel p { margin: 0 0 6px; font-size: 13px; }
.dual { display: flex; gap: 10px; }
.dual > div { flex: 1; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chip {
  background: rgba(58, 42, 31, 0.08);
  padding: 4px 8px;
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
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.apply  {
  background: linear-gradient(180deg, var(--gold-soft) 0%, var(--gold) 100%);
  color: var(--ink);
  border: 1px solid rgba(84, 54, 22, 0.34);
}
.apply:disabled { background: rgba(208, 168, 87, 0.4); }
.cancel {
  background: linear-gradient(180deg, #4f3827 0%, #2b1b12 100%);
  color: var(--paper);
  border: 1px solid rgba(255, 231, 190, 0.12);
}
</style>
