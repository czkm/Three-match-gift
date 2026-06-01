import { onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { audioManager } from '@/audio/AudioManager';

type PhaseConfig = {
  bgm?: string;
  ambient?: string | null;
  bgmVolume?: number;
};

const AC_BGM = 'animalcrossingnewhorizons/Bgm';

const PHASE_AUDIO_MAP: Record<string, PhaseConfig> = {
  title: { bgm: `${AC_BGM}/3-01 Main Theme - Welcome Horizons.mp3`, ambient: null, bgmVolume: 0.34 },
  intro: { bgm: `${AC_BGM}/1-05 500 a.m. (~Sunny Weather~).mp3`, ambient: 'daytime', bgmVolume: 0.32 },
  targeting: { bgm: `${AC_BGM}/2-03 300 p.m. (~Sunny Weather~).mp3`, ambient: 'daytime', bgmVolume: 0.24 },
  dayEnd: { bgm: `${AC_BGM}/2-06 600 p.m. (~Sunny Weather~).mp3`, ambient: 'evening', bgmVolume: 0.30 },
  repairing: { bgm: `${AC_BGM}/3-07 Completion Fanfare.mp3`, ambient: 'construction', bgmVolume: 0.34 },
  rewardChoice: { bgm: `${AC_BGM}/3-50 Able Sisters - Welcome To The Able Sisters!.mp3`, ambient: null, bgmVolume: 0.32 },
  awakening: { bgm: `${AC_BGM}/3-11 Into Dreams....mp3`, ambient: 'space', bgmVolume: 0.32 },
  djinnTransition: { bgm: `${AC_BGM}/2-12 Midnight (~Sunny Weather~).mp3`, ambient: 'space', bgmVolume: 0.36 },
  wish: { bgm: `${AC_BGM}/3-43 Ceremony.mp3`, ambient: 'healing', bgmVolume: 0.34 },
  ending: { bgm: `${AC_BGM}/1-05 500 a.m. (~Sunny Weather~).mp3`, ambient: 'healing', bgmVolume: 0.32 },
  final: { bgm: `${AC_BGM}/4-01 Release Day Update 1.1.0 ~ Bunny Day - Bunny Day with Zipper T. Bunny.mp3`, ambient: 'healing', bgmVolume: 0.28 }
};

function getPlayingBGM(day: number): string {
  if (day >= 9) return `${AC_BGM}/3-01 Main Theme - Welcome Horizons.mp3`
  if (day >= 8) return `${AC_BGM}/2-12 Midnight (~Sunny Weather~).mp3`
  if (day >= 6) return `${AC_BGM}/2-06 600 p.m. (~Sunny Weather~).mp3`
  if (day >= 3) return `${AC_BGM}/2-03 300 p.m. (~Sunny Weather~).mp3`
  return `${AC_BGM}/1-10 1000 a.m. (~Sunny Weather~).mp3`
}

let mountedCount = 0;
let initialized = false;
let lowStepsWarned = false;
let teardownHandlers: Array<() => void> = [];

function getSceneConfig(game: ReturnType<typeof useGameStore>): PhaseConfig | null {
  if (game.phase === 'playing' || game.phase === 'targeting') {
    const bgm = getPlayingBGM(game.currentDay)
    const vol = game.phase === 'targeting' ? 0.24 : 0.36
    if (game.currentDay === 8 && (game.djinnState === 'ready' || game.djinnBoardStage)) {
      return { bgm, ambient: 'space', bgmVolume: vol }
    }
    return { bgm, ambient: 'daytime', bgmVolume: vol }
  }
  return PHASE_AUDIO_MAP[game.phase] || null;
}

async function syncSceneAudio(game: ReturnType<typeof useGameStore>) {
  const config = getSceneConfig(game);
  if (!config) return;

  const targetBGMName = config.bgm
    ? `${import.meta.env.BASE_URL}audio/${config.bgm.includes('/') ? config.bgm : `bgm_${config.bgm}.mp3`}`
    : '';
  const shouldStartBGM = Boolean(config.bgm) && audioManager.currentBGMName !== targetBGMName;

  if (typeof config.bgmVolume === 'number') {
    audioManager.bgmVolume = config.bgmVolume;
  }

  if (config.bgm && shouldStartBGM) {
    audioManager.playBGM(config.bgm).catch(() => { });
  }

  if (config.ambient) {
    audioManager.playAmbient(config.ambient).catch(() => { });
  } else {
    audioManager.stopAmbient().catch(() => { });
  }
}

function handleGlobalButtonClick(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target.closest('button') : null;
  if (!target) return;
  if (target.closest('.audio-controls')) return;
  audioManager.playSFX('click', { vol: 0.35 }).catch(() => { });
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
      syncSceneAudio(game).catch(() => { });
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
        audioManager.playSFX('lowsteps', { vol: 0.5 }).catch(() => { });
      }
    }
  );

  onMounted(() => {
    mountedCount++;
    if (mountedCount > 1) return;

    const initOnInteract = async () => {
      if (initialized) return;
      initialized = true;
      await audioManager.init().catch(() => { });
      await syncSceneAudio(game).catch(() => { });
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
