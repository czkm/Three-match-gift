const BGM_DEFAULT_VOLUME = 0.36;
const SFX_DEFAULT_VOLUME = 0.7;
const AMBIENT_DEFAULT_VOLUME = 0.3;
const MAX_SFX = 4;
const BGM_FADE_MS = 1200;
const AMBIENT_FADE_MS = 1800;

const AC_BASE = 'animalcrossingnewhorizons';

const AC_SFX_MAP: Record<string, string> = {
  click:       `${AC_BASE}/UI & System/UI_Decide.wav`,
  pageflip:    `${AC_BASE}/UI & System/UI_Page_Next.wav`,
  error:       `${AC_BASE}/UI & System/UI_Invalid.wav`,
  swap:        `${AC_BASE}/UI & System/UI_DragStart.wav`,
  land:        `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_01.wav`,
  spawn:       `${AC_BASE}/Trees & Plants/Tree_Appear_Normal_00.wav`,
  lineclear:   `${AC_BASE}/Trees & Plants/FieldPlant_WaterDrop_00.wav`,
  hint:        `${AC_BASE}/UI & System/UI_Attention.wav`,
  lowsteps:    `${AC_BASE}/UI & System/System_Timer_CountDown.wav`,
  steprestore: `${AC_BASE}/UI & System/UI_CountUp.wav`,
  dayend:      `${AC_BASE}/Environment/BbsBirdNightTwitterB00.wav`,
  achievement: `${AC_BASE}/Rosie Emotes/RosieDelight.mp3`,
  repair:      `${AC_BASE}/Environment/Env_FacilityConstruction00.wav`,
  seal_break:  `${AC_BASE}/Environment/Env_BaseRainHard.wav`,
  rune_hit:    `${AC_BASE}/Trees & Plants/Tree_Shake_Oak_HitAxe.wav`,
  djinn_appear:`${AC_BASE}/Environment/Env_ThunderM00.wav`,
  wish1:       `${AC_BASE}/UI & System/Event_TsunekichiChance00.wav`,
  wish2:       `${AC_BASE}/Environment/Env_ShootingStarAppear00.wav`,
  wish3:       `${AC_BASE}/Environment/Env_ShootingStar_Success.wav`,
  ability_wolf:    `${AC_BASE}/Environment/Env_GrassWindSummerStrong.wav`,
  ability_harvest: `${AC_BASE}/Trees & Plants/Tree_Shake_Cedar_Small.wav`,
  ability_roach:   `${AC_BASE}/Insects/Insect_Cockroach_Move00.wav`,
  ability_sunset:  `${AC_BASE}/Environment/Env_PlantWind_Bamboo_Strong_00.wav`,
  decoction:       `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_03.wav`,
  lilac:           `${AC_BASE}/Trees & Plants/FieldPlant_FlowerSplash_00.wav`,
  xray:            `${AC_BASE}/UI & System/UI_Check.wav`,
  pig_gentle:  `${AC_BASE}/Rosie Emotes/RosiePleased.mp3`,
  pig_warm:    `${AC_BASE}/Rosie Emotes/RosieDelight.mp3`,
  pig_warning: `${AC_BASE}/Rosie Emotes/RosieCuriosity.mp3`,
  pig_annoyed: `${AC_BASE}/Rosie Emotes/RosieResignation.mp3`,
  pig_angry:   `${AC_BASE}/Rosie Emotes/RosieAggravation.mp3`,
  pig_idle:    `${AC_BASE}/Rosie Emotes/RosieSleepy.mp3`,
  pig_sniff:   `${AC_BASE}/Rosie Emotes/RosieCuriosity.mp3`,
  pig_energy:  `${AC_BASE}/Rosie Emotes/RosieFlourish.mp3`,
};

const AC_SFX_MULTI: Record<string, string[]> = {
  achievement: [
    `${AC_BASE}/Rosie Emotes/RosieDelight.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieAmazed.mp3`,
  ],
};

const AC_AMBIENT_MAP: Record<string, string> = {
  daytime:      `${AC_BASE}/Environment/Env_GrassWindSummerWeak.wav`,
  evening:      `${AC_BASE}/Environment/BbsBirdNightTwitterA00.wav`,
  construction: `${AC_BASE}/Environment/Env_FacilityConstruction00.wav`,
  healing:      `${AC_BASE}/Ambience/AmbPlace_Healing.wav`,
  space:        `${AC_BASE}/Ambience/AmbPlace_Space.wav`,
};

const AC_MATCH = [
  'FieldPlant_WaterDrop_00.wav',
  'FieldPlant_WaterDrop_01.wav',
  'FieldPlant_Shake_Dash_00.wav',
  'Tree_Shake_Shrub_Small_00.wav',
  'Tree_Shake_Oak_Small.wav',
  'Tree_Shake_Oak.wav',
  'Tree_Shake_Sakura.wav',
  'Tree_Shake_Cedar_Down1.wav',
];

const AC_COMBO = [
  'Tree_Shake_BambooNode_00.wav',
  'Tree_Shake_BambooNode_01.wav',
  'Tree_Shake_BambooNode_02.wav',
  'Tree_Shake_Bamboo_Collid.wav',
  'Tree_Shake_Cedar.wav',
];

const AC_DROP = 'Tree_Shake_RandomRainDrop_00.wav';

type ChannelKind = 'bgm' | 'ambient';
type MonsterEvent = 'spawn' | 'hit' | 'defeat';
type SFXOptions = {
  vol?: number;
  rate?: number;
  bypassThrottle?: boolean;
};
type BGMOptions = {
  fade?: number;
  loop?: boolean;
};

type SFXThrottlePolicy = {
  sameMs?: number;
  group?: string | null;
  groupMs?: number;
  priority?: number;
};

const SFX_THROTTLE: Record<string, SFXThrottlePolicy> = {
  click: { sameMs: 70, group: 'ui', groupMs: 40, priority: 3 },
  pageflip: { sameMs: 120, group: 'ui', groupMs: 60, priority: 3 },
  error: { sameMs: 110, group: 'feedback', groupMs: 70, priority: 3 },
  hint: { sameMs: 600, group: 'feedback', groupMs: 120, priority: 1 },
  lowsteps: { sameMs: 1400, group: 'feedback', groupMs: 200, priority: 3 },
  steprestore: { sameMs: 100, group: 'feedback', groupMs: 80, priority: 2 },
  dayend: { sameMs: 250, group: 'feedback', groupMs: 120, priority: 2 },
  achievement: { sameMs: 180, group: 'ui', groupMs: 100, priority: 3 },
  repair: { sameMs: 220, group: 'feedback', groupMs: 120, priority: 2 },
  swap: { sameMs: 70, group: 'board', groupMs: 36, priority: 3 },
  land: { sameMs: 95, group: 'board', groupMs: 55, priority: 1 },
  spawn: { sameMs: 110, group: 'board', groupMs: 65, priority: 1 },
  lineclear: { sameMs: 180, group: 'board', groupMs: 120, priority: 2 },
  seal_break: { sameMs: 180, group: 'ritual', groupMs: 110, priority: 3 },
  rune_hit: { sameMs: 160, group: 'ritual', groupMs: 90, priority: 2 },
  djinn_appear: { sameMs: 320, group: 'ritual', groupMs: 220, priority: 3 },
  wish1: { sameMs: 320, group: 'ritual', groupMs: 220, priority: 3 },
  wish2: { sameMs: 320, group: 'ritual', groupMs: 220, priority: 3 },
  wish3: { sameMs: 320, group: 'ritual', groupMs: 220, priority: 3 },
  ability_wolf: { sameMs: 180, group: 'ability', groupMs: 90, priority: 3 },
  ability_harvest: { sameMs: 180, group: 'ability', groupMs: 90, priority: 3 },
  ability_roach: { sameMs: 180, group: 'ability', groupMs: 90, priority: 3 },
  ability_sunset: { sameMs: 180, group: 'ability', groupMs: 90, priority: 3 },
  decoction: { sameMs: 180, group: 'ability', groupMs: 90, priority: 3 },
  lilac: { sameMs: 180, group: 'ability', groupMs: 90, priority: 3 },
  xray: { sameMs: 600, group: 'ritual', groupMs: 300, priority: 3 },
  pig_gentle:  { sameMs: 800,  group: 'pig', groupMs: 400, priority: 1 },
  pig_warm:    { sameMs: 800,  group: 'pig', groupMs: 400, priority: 1 },
  pig_warning: { sameMs: 1200, group: 'pig', groupMs: 500, priority: 2 },
  pig_annoyed: { sameMs: 1800, group: 'pig', groupMs: 600, priority: 2 },
  pig_angry:   { sameMs: 3000, group: 'pig', groupMs: 900, priority: 3 },
  pig_idle:    { sameMs: 8000, group: 'pig', groupMs: 3000, priority: 1 },
  pig_sniff:   { sameMs: 4000, group: 'pig', groupMs: 2000, priority: 1 },
  pig_energy:  { sameMs: 5000, group: 'pig', groupMs: 1000, priority: 3 }
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createAudio(src: string) {
  const audio = new Audio(src);
  audio.preload = 'auto';
  return audio;
}

class AudioChannel {
  audio: HTMLAudioElement | null = null;
  name = '';
  loadToken = 0;
}

/**
 * Corvo Bianco audio manager.
 * Uses HTMLAudioElement for media playback and the Web Audio API master gain
 * to support mute and future expansion without additional dependencies.
 */
export class AudioManager {
  private static instance: AudioManager | null = null;

  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private readonly bgmChannel = new AudioChannel();
  private readonly ambientChannel = new AudioChannel();
  private readonly activeSFXs = new Set<HTMLAudioElement>();

  private _bgmVolume = BGM_DEFAULT_VOLUME;
  private _sfxVolume = SFX_DEFAULT_VOLUME;
  private _ambientVolume = AMBIENT_DEFAULT_VOLUME;
  private _isMuted = false;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private readonly preloadCache = new Map<string, Promise<void>>();
  private readonly listeners = new Set<() => void>();
  private readonly sfxLastPlayedAt = new Map<string, number>();
  private readonly sfxGroupLastPlayedAt = new Map<string, number>();

  private constructor() {}

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async init() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async _doInit() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      this.audioCtx = new Ctx();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this._isMuted ? 0 : 1;
      this.masterGain.connect(this.audioCtx.destination);
      if (this.audioCtx.state === 'suspended') {
        try {
          await this.audioCtx.resume();
        } catch {
          // Ignore autoplay-policy failures; next user interaction will retry.
        }
      }
    }

    const preloadAC = (p: string) => this.preload(`${AC_BASE}/${p}`);
    await Promise.all([
      this.preload('bgm_dayplay.mp3'),
      this.preload('bgm_brithday.mp3'),
      preloadAC('UI & System/UI_Decide.wav'),
      preloadAC(`Trees & Plants/${AC_DROP}`),
      preloadAC(`Trees & Plants/${AC_MATCH[0]}`),
      preloadAC(`Trees & Plants/${AC_MATCH[1]}`),
      preloadAC(`Trees & Plants/${AC_MATCH[2]}`),
      preloadAC(`Trees & Plants/${AC_MATCH[3]}`),
      preloadAC(`Trees & Plants/${AC_MATCH[4]}`),
      preloadAC(`Trees & Plants/${AC_MATCH[5]}`),
      preloadAC(`Trees & Plants/${AC_MATCH[6]}`),
      preloadAC(`Trees & Plants/${AC_MATCH[7]}`),
      preloadAC(`Trees & Plants/${AC_COMBO[0]}`),
      preloadAC(`Trees & Plants/${AC_COMBO[1]}`),
      preloadAC(`Trees & Plants/${AC_COMBO[2]}`),
      preloadAC(`Trees & Plants/${AC_COMBO[3]}`),
      preloadAC(`Trees & Plants/${AC_COMBO[4]}`)
    ]);

    this.initialized = true;
  }

  private async ensureReady() {
    if (!this.initialized) return false;
    if (this.audioCtx?.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch {
        // Ignore and rely on HTML audio best effort.
      }
    }
    return true;
  }

  private preload(fileName: string) {
    if (this.preloadCache.has(fileName)) return this.preloadCache.get(fileName)!;

    const promise = new Promise<void>((resolve) => {
      const audio = createAudio(`/audio/${fileName}`);
      const finish = () => resolve();
      audio.addEventListener('canplaythrough', finish, { once: true });
      audio.addEventListener('error', finish, { once: true });
      audio.load();
    });

    this.preloadCache.set(fileName, promise);
    return promise;
  }

  async playBGM(name: string, opts: BGMOptions = {}) {
    if (!await this.ensureReady()) return;
    const fileName = name.includes('/') ? name : `bgm_${name}.mp3`;
    return this.playLoopingChannel(this.bgmChannel, fileName, 'bgm', opts.fade ?? BGM_FADE_MS, opts.loop ?? true);
  }

  async playAmbient(name: string, opts: BGMOptions = {}) {
    if (!await this.ensureReady()) return;
    const acPath = AC_AMBIENT_MAP[name];
    const file = acPath ?? `amb_${name}.mp3`;
    return this.playLoopingChannel(this.ambientChannel, file, 'ambient', opts.fade ?? AMBIENT_FADE_MS, true);
  }

  async stopAmbient(fade = AMBIENT_FADE_MS) {
    if (!this.initialized) return;
    await this.fadeOutAndStop(this.ambientChannel, fade);
  }

  async playSFX(name: string, opts: SFXOptions = {}) {
    if (this._isMuted) return;
    if (!await this.ensureReady()) return;
    if (!opts.bypassThrottle && !this.shouldPlaySFX(name)) return;

    while (this.activeSFXs.size >= MAX_SFX) {
      const oldest = this.activeSFXs.values().next().value;
      if (!oldest) break;
      oldest.pause();
      oldest.currentTime = 0;
      this.activeSFXs.delete(oldest);
    }

    const multi = AC_SFX_MULTI[name];
    const pool = multi ?? (AC_SFX_MAP[name] ? [AC_SFX_MAP[name]] : []);
    const acPath = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
    const src = acPath ? `/audio/${acPath}` : `/audio/sfx_${name}.mp3`;
    const audio = createAudio(src);
    const baseVolume = clamp((opts.vol ?? 1) * this._sfxVolume, 0, 1);
    audio.volume = baseVolume;
    audio.playbackRate = clamp(opts.rate ?? 1, 0.5, 2);
    audio.dataset.baseVolume = String(baseVolume);

    this.activeSFXs.add(audio);
    const cleanup = () => {
      audio.pause();
      this.activeSFXs.delete(audio);
    };
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });

    try {
      await audio.play();
    } catch {
      cleanup();
    }
  }

  playMatch(count: number) {
    const index = clamp(Math.round(count), 1, 8);
    this.playLooseFile(`eliminate${index}.mp3`, {
      vol: clamp(0.46 + index * 0.045, 0.5, 0.86),
      bypassThrottle: true
    });
  }

  playCombo(level: number) {
    if (level < 2) return;
    const comboCount = clamp(level, 3, 7);
    const fileName = `contnuousMatch${comboCount}.mp3`;
    this.playLooseFile(fileName, {
      vol: clamp(0.4 + comboCount * 0.07, 0.52, 0.88),
      bypassThrottle: true
    });
  }

  playBoardDrop(fallCount = 1) {
    this.playLooseFile('drop.mp3', {
      vol: clamp(0.26 + Math.min(fallCount, 8) * 0.035, 0.28, 0.56)
    });
  }

  playMonster(type: string, event: MonsterEvent) {
    void type;
    const map: Record<string, string> = {
      spawn:  `${AC_BASE}/Trees & Plants/Tree_Appear_Normal_00.wav`,
      hit:    `${AC_BASE}/Trees & Plants/Tree_Shake_Oak_HitAxe.wav`,
      defeat: `${AC_BASE}/Trees & Plants/Tree_Disappear_Normal_00.wav`,
    };
    const path = map[event];
    if (!path) return;
    const audio = createAudio(`/audio/${path}`);
    audio.volume = clamp(0.5 * this._sfxVolume, 0, 1);
    this.activeSFXs.add(audio);
    const cleanup = () => { audio.pause(); this.activeSFXs.delete(audio); };
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });
    audio.play().catch(cleanup);
  }

  pauseAll() {
    this.bgmChannel.audio?.pause();
    this.ambientChannel.audio?.pause();
    for (const audio of this.activeSFXs) audio.pause();
  }

  resumeAll() {
    if (this._isMuted) return;
    if (!this.initialized) return;
    this.ensureReady().catch(() => {});
    this.bgmChannel.audio?.play().catch(() => {});
    this.ambientChannel.audio?.play().catch(() => {});
    for (const audio of this.activeSFXs) audio.play().catch(() => {});
  }

  toggleMute() {
    this.isMuted = !this._isMuted;
  }

  get bgmVolume() {
    return this._bgmVolume;
  }

  get currentBGMName() {
    return this.bgmChannel.name;
  }

  set bgmVolume(value: number) {
    this._bgmVolume = clamp(value, 0, 1);
    if (this.bgmChannel.audio) this.bgmChannel.audio.volume = this._isMuted ? 0 : this._bgmVolume;
    this.emitState();
  }

  get sfxVolume() {
    return this._sfxVolume;
  }

  set sfxVolume(value: number) {
    this._sfxVolume = clamp(value, 0, 2);
    this.emitState();
  }

  get ambientVolume() {
    return this._ambientVolume;
  }

  set ambientVolume(value: number) {
    this._ambientVolume = clamp(value, 0, 1);
    if (this.ambientChannel.audio) this.ambientChannel.audio.volume = this._isMuted ? 0 : this._ambientVolume;
    this.emitState();
  }

  get isMuted() {
    return this._isMuted;
  }

  set isMuted(value: boolean) {
    this._isMuted = Boolean(value);
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(this._isMuted ? 0 : 1, this.audioCtx.currentTime, 0.08);
    }
    if (this.bgmChannel.audio) this.bgmChannel.audio.volume = this._isMuted ? 0 : this._bgmVolume;
    if (this.ambientChannel.audio) this.ambientChannel.audio.volume = this._isMuted ? 0 : this._ambientVolume;
    if (this._isMuted) {
      for (const audio of this.activeSFXs) audio.volume = 0;
    } else {
      for (const audio of this.activeSFXs) {
        audio.volume = clamp(Number(audio.dataset.baseVolume || this._sfxVolume), 0, 1);
      }
    }
    this.emitState();
  }

  private async playLoopingChannel(
    channel: AudioChannel,
    fileName: string,
    kind: ChannelKind,
    fadeMs: number,
    loop: boolean
  ) {
    await this.preload(fileName);
    const src = `/audio/${fileName}`;
    if (channel.name === src && channel.audio) {
      channel.audio.loop = loop;
      channel.audio.volume = this._isMuted ? 0 : this.getChannelTargetVolume(kind);
      if (channel.audio.paused && !this._isMuted) {
        channel.audio.play().catch(() => {});
      }
      return;
    }

    const loadToken = ++channel.loadToken;
    const nextAudio = createAudio(src);
    nextAudio.loop = loop;
    nextAudio.volume = 0;

    const previous = channel.audio;
    channel.audio = nextAudio;
    channel.name = src;

    try {
      await nextAudio.play();
    } catch {
      if (channel.loadToken === loadToken) {
        channel.audio = previous;
        channel.name = previous?.src || '';
      }
      return;
    }

    const targetVolume = this._isMuted ? 0 : this.getChannelTargetVolume(kind);
    this.fadeVolume(nextAudio, targetVolume, fadeMs);

    if (previous) {
      this.fadeVolume(previous, 0, fadeMs, () => {
        previous.pause();
        previous.currentTime = 0;
      });
    }
  }

  private async fadeOutAndStop(channel: AudioChannel, fadeMs: number) {
    const audio = channel.audio;
    if (!audio) return;

    await new Promise<void>((resolve) => {
      this.fadeVolume(audio, 0, fadeMs, () => {
        audio.pause();
        audio.currentTime = 0;
        resolve();
      });
    });

    if (channel.audio === audio) {
      channel.audio = null;
      channel.name = '';
    }
  }

  private fadeVolume(audio: HTMLAudioElement, target: number, durationMs: number, onDone?: () => void) {
    const start = audio.volume;
    const delta = target - start;
    if (Math.abs(delta) < 0.001 || durationMs <= 0) {
      audio.volume = target;
      onDone?.();
      return;
    }

    const startedAt = performance.now();
    const tick = () => {
      const elapsed = performance.now() - startedAt;
      const t = clamp(elapsed / durationMs, 0, 1);
      const eased = 1 - (1 - t) * (1 - t);
      audio.volume = clamp(start + delta * eased, 0, 1);
      if (t >= 1) {
        audio.volume = target;
        onDone?.();
        return;
      }
      window.setTimeout(tick, 32);
    };

    tick();
  }

  private getChannelTargetVolume(kind: ChannelKind) {
    return kind === 'bgm' ? this._bgmVolume : this._ambientVolume;
  }

  private async playLooseFile(fileName: string, opts: SFXOptions = {}) {
    if (this._isMuted) return;
    if (!await this.ensureReady()) return;
    if (!opts.bypassThrottle && !this.shouldPlayLooseFile(fileName)) return;
    await this.preload(fileName).catch(() => {});

    while (this.activeSFXs.size >= MAX_SFX) {
      const oldest = this.activeSFXs.values().next().value;
      if (!oldest) break;
      oldest.pause();
      oldest.currentTime = 0;
      this.activeSFXs.delete(oldest);
    }

    let actualFile = fileName;
    if (/^eliminate(\d+)\.mp3$/.test(fileName)) {
      const i = parseInt(fileName.match(/\d+/)![0]) - 1;
      actualFile = `${AC_BASE}/Trees & Plants/${AC_MATCH[i]}`;
    } else if (/^contnuousMatch(\d+)\.mp3$/.test(fileName)) {
      const lvl = parseInt(fileName.match(/\d+/)![0]);
      actualFile = `${AC_BASE}/Trees & Plants/${AC_COMBO[lvl - 3]}`;
    } else if (fileName === 'drop.mp3') {
      actualFile = `${AC_BASE}/Trees & Plants/${AC_DROP}`;
    }
    const audio = createAudio(`/audio/${actualFile}`);
    const baseVolume = clamp((opts.vol ?? 1) * this._sfxVolume, 0, 1);
    audio.volume = baseVolume;
    audio.playbackRate = clamp(opts.rate ?? 1, 0.5, 2);
    audio.dataset.baseVolume = String(baseVolume);

    this.activeSFXs.add(audio);
    const cleanup = () => {
      audio.pause();
      this.activeSFXs.delete(audio);
    };
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });

    try {
      await audio.play();
    } catch {
      cleanup();
    }
  }

  private emitState() {
    for (const listener of this.listeners) listener();
  }

  private shouldPlaySFX(name: string) {
    const policy = SFX_THROTTLE[name];
    return this.shouldPlayWithPolicy(`sfx:${name}`, policy);
  }

  private shouldPlayLooseFile(fileName: string) {
    if (/^eliminate\d+\.mp3$/.test(fileName)) {
      return this.shouldPlayWithPolicy(`loose:${fileName}`, {
        sameMs: 95,
        group: 'match',
        groupMs: 78,
        priority: 2
      });
    }

    if (/^contnuousMatch\d+\.mp3$/.test(fileName)) {
      return this.shouldPlayWithPolicy(`loose:${fileName}`, {
        sameMs: 130,
        group: 'combo',
        groupMs: 105,
        priority: 3
      });
    }

    if (fileName === 'drop.mp3') {
      return this.shouldPlayWithPolicy(`loose:${fileName}`, {
        sameMs: 90,
        group: 'board',
        groupMs: 60,
        priority: 2
      });
    }

    return true;
  }

  private shouldPlayWithPolicy(key: string, policy?: SFXThrottlePolicy) {
    if (!policy) return true;

    const now = performance.now();
    const sameMs = policy.sameMs ?? 0;
    const groupMs = policy.groupMs ?? 0;
    const group = policy.group || null;
    const lastSelf = this.sfxLastPlayedAt.get(key) ?? -Infinity;
    const lastGroup = group ? (this.sfxGroupLastPlayedAt.get(group) ?? -Infinity) : -Infinity;

    if (sameMs > 0 && now - lastSelf < sameMs) return false;

    if (group && groupMs > 0 && now - lastGroup < groupMs) {
      return (policy.priority ?? 0) >= 3;
    }

    this.sfxLastPlayedAt.set(key, now);
    if (group) this.sfxGroupLastPlayedAt.set(group, now);
    return true;
  }
}

export const audioManager = AudioManager.getInstance();
