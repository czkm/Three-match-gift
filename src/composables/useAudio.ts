import { onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { audioManager } from '@/audio/AudioManager';

type PhaseConfig = {
  bgm?: string;
  ambient?: string | null;
  bgmVolume?: number;
};

const PHASE_AUDIO_MAP: Record<string, PhaseConfig> = {
  title: { bgm: 'dayplay', ambient: null, bgmVolume: 0.36 },
  intro: { bgm: 'dayplay', ambient: null, bgmVolume: 0.36 },
  playing: { bgm: 'dayplay', ambient: null, bgmVolume: 0.36 },
  targeting: { bgm: 'dayplay', ambient: null, bgmVolume: 0.24 },
  dayEnd: { bgm: 'dayplay', ambient: null, bgmVolume: 0.3 },
  repairing: { bgm: 'dayplay', ambient: null, bgmVolume: 0.34 },
  awakening: { bgm: 'dayplay', ambient: null, bgmVolume: 0.38 },
  djinnTransition: { bgm: 'dayplay', ambient: null, bgmVolume: 0.36 },
  wish: { bgm: 'dayplay', ambient: null, bgmVolume: 0.36 },
  ending: { bgm: 'dayplay', ambient: null, bgmVolume: 0.34 },
  final: { bgm: 'dayplay', ambient: null, bgmVolume: 0.3 }
};

let mountedCount = 0;
let initialized = false;
let lowStepsWarned = false;
let teardownHandlers: Array<() => void> = [];

function getSceneConfig(game: ReturnType<typeof useGameStore>): PhaseConfig | null {
  if (game.phase === 'playing' && game.currentDay === 8 && (game.djinnState === 'ready' || game.djinnBoardStage)) {
    return { bgm: 'dayplay', ambient: null, bgmVolume: 0.38 };
  }
  return PHASE_AUDIO_MAP[game.phase] || null;
}

async function syncSceneAudio(game: ReturnType<typeof useGameStore>) {
  const config = getSceneConfig(game);
  if (!config) return;

  const shouldStartBGM = !audioManager.currentBGMName;

  if (typeof config.bgmVolume === 'number') {
    audioManager.bgmVolume = config.bgmVolume;
  }

  if (config.bgm && shouldStartBGM) {
    audioManager.playBGM(config.bgm).catch(() => {});
  }

  if (config.ambient) {
    audioManager.playAmbient(config.ambient).catch(() => {});
  } else {
    audioManager.stopAmbient().catch(() => {});
  }
}

function handleGlobalButtonClick(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target.closest('button') : null;
  if (!target) return;
  if (target.closest('.audio-controls')) return;
  audioManager.playSFX('click', { vol: 0.35 }).catch(() => {});
}

function handleVisibility() {
  if (document.hidden) audioManager.pauseAll();
  else audioManager.resumeAll();
}

export function useAudio() {
  const game = useGameStore();

  watch(
    () => [game.phase, game.currentDay, game.djinnState, game.djinnBoardStage],
    () => {
      if (!initialized) return;
      syncSceneAudio(game).catch(() => {});
    },
    { immediate: true }
  );

  watch(
    () => game.stepsLeft,
    (stepsLeft) => {
      if (game.phase !== 'playing') {
        lowStepsWarned = false;
        return;
      }
      if (stepsLeft > 5) {
        lowStepsWarned = false;
        return;
      }
      if (!lowStepsWarned) {
        lowStepsWarned = true;
        audioManager.playSFX('lowsteps', { vol: 0.5 }).catch(() => {});
      }
    }
  );

  onMounted(() => {
    mountedCount++;
    if (mountedCount > 1) return;

    const initOnInteract = async () => {
      if (initialized) return;
      initialized = true;
      await audioManager.init().catch(() => {});
      await syncSceneAudio(game).catch(() => {});
      document.removeEventListener('pointerdown', initOnInteract);
      document.removeEventListener('keydown', initOnInteract);
    };

    document.addEventListener('pointerdown', initOnInteract, { once: true });
    document.addEventListener('keydown', initOnInteract, { once: true });
    document.addEventListener('click', handleGlobalButtonClick);
    document.addEventListener('visibilitychange', handleVisibility);

    teardownHandlers = [
      () => document.removeEventListener('pointerdown', initOnInteract),
      () => document.removeEventListener('keydown', initOnInteract),
      () => document.removeEventListener('click', handleGlobalButtonClick),
      () => document.removeEventListener('visibilitychange', handleVisibility)
    ];
  });

  onUnmounted(() => {
    mountedCount = Math.max(0, mountedCount - 1);
    if (mountedCount > 0) return;
    for (const teardown of teardownHandlers) teardown();
    teardownHandlers = [];
  });

  return { audioManager };
}
