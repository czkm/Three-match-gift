const BGM_DEFAULT_VOLUME = 0.36;
const SFX_DEFAULT_VOLUME = 0.7;
const AMBIENT_DEFAULT_VOLUME = 0.3;
const MAX_SFX = 4;
const DEFAULT_SFX_PRIORITY = 2;
const BGM_FADE_MS = 1200;
const AMBIENT_FADE_MS = 1800;
const AUDIO_PRELOAD_CONCURRENCY = 6;

const AC_BASE = 'animalcrossingnewhorizons';
const ISAAC_BASE = 'isaac';

const AC_SFX_MAP: Record<string, string> = {
  click: `${AC_BASE}/UI & System/UI_Decide.wav`,
  pageflip: `${AC_BASE}/UI & System/UI_Page_Next.wav`,
  error: `${AC_BASE}/UI & System/UI_Invalid.wav`,
  swap: `${AC_BASE}/UI & System/UI_DragStart.wav`,
  land: `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_01.wav`,
  spawn: `${AC_BASE}/Trees & Plants/Tree_Appear_Normal_00.wav`,
  lineclear: `${AC_BASE}/Trees & Plants/FieldPlant_WaterDrop_00.wav`,
  hint: `${AC_BASE}/UI & System/UI_Attention.wav`,
  lowsteps: `${AC_BASE}/UI & System/System_Timer_CountDown.wav`,
  steprestore: `${AC_BASE}/UI & System/UI_CountUp.wav`,
  dayend: `${AC_BASE}/Environment/BbsBirdNightTwitterB00.wav`,
  achievement: `${AC_BASE}/Rosie Emotes/RosieDelight.mp3`,
  repair: `${AC_BASE}/Environment/Env_FacilityConstruction00.wav`,
  seal_break: `${AC_BASE}/Environment/Env_BaseRainHard.wav`,
  rune_hit: `${AC_BASE}/Trees & Plants/Tree_Shake_Oak_HitAxe.wav`,
  djinn_appear: `${AC_BASE}/Environment/Env_ThunderM00.wav`,
  wish1: `${AC_BASE}/UI & System/Event_TsunekichiChance00.wav`,
  wish2: `${AC_BASE}/Environment/Env_ShootingStarAppear00.wav`,
  wish3: `${AC_BASE}/Environment/Env_ShootingStar_Success.wav`,
  ability_wolf: `${AC_BASE}/UI & System/UI_WipeRemake_In.wav`,
  ability_harvest: `${AC_BASE}/Trees & Plants/Tree_Shake_Cedar_Down1.wav`,
  ability_roach: `${AC_BASE}/Insects/Insect_Cockroach_Move00.wav`,
  ability_sunset: `${AC_BASE}/UI & System/UI_WipeToIdrDream.wav`,
  decoction: `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_03.wav`,
  lilac: `${AC_BASE}/Trees & Plants/FieldPlant_FlowerSplash_00.wav`,
  xray: `${AC_BASE}/UI & System/System_Lumi_01.wav`,
  pig_gentle: `${AC_BASE}/Rosie Emotes/RosiePleased.mp3`,
  pig_warm: `${AC_BASE}/Rosie Emotes/RosieDelight.mp3`,
  pig_warning: `${AC_BASE}/Rosie Emotes/RosieCuriosity.mp3`,
  pig_annoyed: `${AC_BASE}/Rosie Emotes/RosieResignation.mp3`,
  pig_angry: `${AC_BASE}/Rosie Emotes/RosieAggravation.mp3`,
  pig_idle: `${AC_BASE}/Rosie Emotes/RosieSleepy.mp3`,
  pig_sniff: `${AC_BASE}/Rosie Emotes/RosieCuriosity.mp3`,
  pig_energy: `${AC_BASE}/Rosie Emotes/RosieFlourish.mp3`,
  typewriter_key: `${AC_BASE}/UI & System/UI_Swkbd_Normal.wav`,
  typewriter_space: `${AC_BASE}/UI & System/UI_Swkbd_Space.wav`,
  typewriter_enter: `${AC_BASE}/UI & System/UI_Swkbd_Enter.wav`,
  typewriter_backspace: `${AC_BASE}/UI & System/UI_Swkbd_BackSpace.wav`,
  item_get: `${AC_BASE}/UI & System/UI_Check.wav`,
  daystart: `${AC_BASE}/Environment/BbsBirdDay_TwitterAc00.wav`,
  resourcegain: `${AC_BASE}/UI & System/UI_Count_Mile_Repeat_01.wav`,
  stepcost: `${AC_BASE}/UI & System/UI_Decide_Small.wav`,
  taskcomplete: `${AC_BASE}/UI & System/Event_Quest_Finish.wav`,
  repairtick: `${AC_BASE}/UI & System/UI_Count_Mile_Repeat_01.wav`,
  repairdone: `${AC_BASE}/UI & System/Event_Harvest_Bell00.wav`,
  boardshuffle: `${AC_BASE}/Trees & Plants/Tree_ChangeState_00.wav`,
  dialogopen: `${AC_BASE}/UI & System/UI_MessageWindow_Open.wav`,
  dialogclose: `${AC_BASE}/UI & System/UI_Cmn_Close.wav`,
  dayendopen: `${AC_BASE}/UI & System/UI_Cmn_Open.wav`,
  itemhover: `${AC_BASE}/UI & System/UI_Select.wav`,
  tutorialstep: `${AC_BASE}/UI & System/UI_Check.wav`,
  scenetransition: `${AC_BASE}/UI & System/UI_WipeToIdrDream.wav`,
  bark:            `${AC_BASE}/Rosie Emotes/RosieGreetings.mp3`,
  candle_light:    `${AC_BASE}/Bgm/candle_light.wav`,
  woosh:           `${AC_BASE}/UI & System/UI_WipeStudy_OutputOut.wav`,
  trinket:         `${AC_BASE}/UI & System/UI_Wrapping_Open_Basic.wav`,

  // Isaac items
  item_power_up: `${ISAAC_BASE}/power up1.wav`,
  item_health_up: `${ISAAC_BASE}/health up 1.wav`,
  item_penny: `${ISAAC_BASE}/penny pickup 1.wav`,
  item_48hr_energy: `${ISAAC_BASE}/48 hr energy.wav`,
  item_battery_charge: `${ISAAC_BASE}/battery charge.wav`,
  item_holy: `${ISAAC_BASE}/holy!.wav`,
  item_whip: `${ISAAC_BASE}/whip_02.wav`,
  item_dog_howl: `${ISAAC_BASE}/dog howell.wav`,
  item_dog_bark: `${ISAAC_BASE}/dog bark.wav`,
  item_superholy: `${ISAAC_BASE}/superholy.wav`,
  item_blood_laser: `${ISAAC_BASE}/blood laser strong 1.wav`,
  item_knife_pull: `${ISAAC_BASE}/knife_pull.wav`,
  item_unholy: `${ISAAC_BASE}/unholy!.wav`,
  item_r_u_wiz: `${ISAAC_BASE}/r u a wiz 2.wav`,
  item_vamp: `${ISAAC_BASE}/vamp.wav`,
  item_red_lightning: `${ISAAC_BASE}/redlightning_burst01.wav`,
  item_maw_void: `${ISAAC_BASE}/maw of the void.wav`,
  item_see_4ever: `${ISAAC_BASE}/see 4ever 1.wav`,
  item_luck_up: `${ISAAC_BASE}/luck up.wav`,
  item_explosion: `${ISAAC_BASE}/explosion_weak1.wav`,
};

const AC_SFX_MULTI: Record<string, string[]> = {
  achievement: [
    `${AC_BASE}/Rosie Emotes/RosieDelight.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieAmazed.mp3`,
  ],
  click: [
    `${AC_BASE}/UI & System/UI_Decide.wav`,
    `${AC_BASE}/UI & System/UI_Decide_Small.wav`,
    `${AC_BASE}/UI & System/UI_Decide_Sub.wav`,
  ],
  land: [
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_01.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_02.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_03.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_04.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_05.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_06.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_07.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_08.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_09.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_10.wav`,
  ],
  spawn: [
    `${AC_BASE}/Trees & Plants/Tree_Appear_Normal_00.wav`,
    `${AC_BASE}/Trees & Plants/Tree_ChangeState_00.wav`,
    `${AC_BASE}/Trees & Plants/Tree_ChangeState_01.wav`,
    `${AC_BASE}/Trees & Plants/Tree_ChangeState_02.wav`,
    `${AC_BASE}/Trees & Plants/Tree_ChangeState_03.wav`,
    `${AC_BASE}/Trees & Plants/Tree_ChangeState_04.wav`,
    `${AC_BASE}/Trees & Plants/Tree_ChangeState_05.wav`,
  ],
  lineclear: [
    `${AC_BASE}/Trees & Plants/FieldPlant_WaterDrop_00.wav`,
    `${AC_BASE}/Trees & Plants/FieldPlant_WaterDrop_01.wav`,
    `${AC_BASE}/Trees & Plants/FieldPlant_WaterDrop_02.wav`,
    `${AC_BASE}/Trees & Plants/FieldPlant_Shake_Dash_00.wav`,
    `${AC_BASE}/Trees & Plants/FieldPlant_Shake_Dash_01.wav`,
    `${AC_BASE}/Trees & Plants/FieldPlant_Shake_Dash_02.wav`,
  ],
  hint: [
    `${AC_BASE}/UI & System/UI_Attention.wav`,
    `${AC_BASE}/UI & System/UI_Check.wav`,
    `${AC_BASE}/UI & System/UI_Check_Small.wav`,
  ],
  steprestore: [
    `${AC_BASE}/UI & System/UI_CountUp.wav`,
    `${AC_BASE}/UI & System/UI_Count_Mile_Repeat_01.wav`,
  ],
  repair: [
    `${AC_BASE}/Environment/Env_FacilityConstruction00.wav`,
    `${AC_BASE}/Environment/Env_StructureRainMetalRoof00.wav`,
  ],
  seal_break: [
    `${AC_BASE}/Environment/Env_BaseRainHard.wav`,
    `${AC_BASE}/Environment/Env_ThunderS00.wav`,
    `${AC_BASE}/Environment/Env_ThunderS01.wav`,
    `${AC_BASE}/Environment/Env_ThunderS02.wav`,
    `${AC_BASE}/Environment/Env_ThunderS03.wav`,
  ],
  rune_hit: [
    `${AC_BASE}/Trees & Plants/Tree_Shake_Oak_HitAxe.wav`,
    `${AC_BASE}/Trees & Plants/Tree_Shake_Cedar_HitAxe.wav`,
    `${AC_BASE}/Trees & Plants/Tree_Shake_Sakura_HitAxe.wav`,
  ],
  djinn_appear: [
    `${AC_BASE}/Environment/Env_ThunderM00.wav`,
    `${AC_BASE}/Environment/Env_ThunderM01.wav`,
    `${AC_BASE}/Environment/Env_ThunderL00.wav`,
    `${AC_BASE}/Environment/Env_ThunderL01.wav`,
  ],
  decoction: [
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_01.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_02.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_03.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_04.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_05.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_06.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_07.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_08.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_09.wav`,
    `${AC_BASE}/Sea Creatures/DiveFish_Shadow_Bubble_10.wav`,
    `${AC_BASE}/Environment/Env_SeaWaterWave00.wav`,
    `${AC_BASE}/Environment/Env_SeaWaterWave01.wav`,
  ],
  pig_gentle: [
    `${AC_BASE}/Rosie Emotes/RosiePleased.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieGreetings.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieJoy.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieLove.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieEncouraging.mp3`,
  ],
  pig_warm: [
    `${AC_BASE}/Rosie Emotes/RosieDelight.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieAmazed.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieFlourish.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieInspiration.mp3`,
    `${AC_BASE}/Rosie Emotes/RosiePride.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieLaughter.mp3`,
  ],
  pig_warning: [
    `${AC_BASE}/Rosie Emotes/RosieCuriosity.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieMischief.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieBewilderment.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieSheepishness.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieThought.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieSurprise.mp3`,
  ],
  pig_annoyed: [
    `${AC_BASE}/Rosie Emotes/RosieResignation.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieSighing.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieSorrow.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieSadness.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieDistress.mp3`,
  ],
  pig_angry: [
    `${AC_BASE}/Rosie Emotes/RosieAggravation.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieIntense.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieColdChill.mp3`,
    `${AC_BASE}/Rosie Emotes/RosieHeartbreak.mp3`,
  ],
  xray: [
    `${AC_BASE}/UI & System/System_Lumi_01.wav`,
    `${AC_BASE}/UI & System/System_Lumi_02.wav`,
    `${AC_BASE}/UI & System/System_Lumi_03.wav`,
    `${AC_BASE}/UI & System/System_Lumi_04.wav`,
  ],

  ability_harvest: [
    `${AC_BASE}/Trees & Plants/Tree_Shake_Cedar_Down1.wav`,
    `${AC_BASE}/Trees & Plants/Tree_Shake_Oak_Down1.wav`,
    `${AC_BASE}/Trees & Plants/Tree_Shake_Sakura_Down1.wav`,
    `${AC_BASE}/Trees & Plants/Tree_Shake_Palm_Down1.wav`,
    `${AC_BASE}/Trees & Plants/Tree_Shake_Bamboo_Down1.wav`,
  ],

  gfuel: [
    `${ISAAC_BASE}/gfuel 1.wav`,
    `${ISAAC_BASE}/gfuel 2.wav`,
    `${ISAAC_BASE}/gfuel 3.wav`,
    `${ISAAC_BASE}/gfuel 4.wav`,
  ],
};

/**
 * Item → audio mapping: each item id maps to { pickup, effect } SFX keys.
 */
const ITEM_SFX_MAP: Record<string, { pickup: string; effect: string | null }> = {
  stye: { pickup: 'item_power_up', effect: 'item_explosion' },
  stye_devil: { pickup: 'item_power_up', effect: 'item_explosion' },
  luckyFoot: { pickup: 'item_power_up', effect: 'item_luck_up' },
  lunch: { pickup: 'item_health_up', effect: null },
  sackOfPennies: { pickup: 'item_power_up', effect: 'item_penny' },
  battery: { pickup: 'item_48hr_energy', effect: 'item_battery_charge' },
  holyWater: { pickup: 'item_holy', effect: 'item_whip' },
  dogTooth: { pickup: 'item_dog_howl', effect: 'item_dog_bark' },
  brimstone: { pickup: 'item_superholy', effect: 'item_blood_laser' },
  momsKnife: { pickup: 'item_superholy', effect: 'item_knife_pull' },
  thePact: { pickup: 'item_unholy', effect: 'item_r_u_wiz' },
  darkBeggar: { pickup: 'item_unholy', effect: 'item_vamp' },
  pentagram: { pickup: 'item_unholy', effect: 'item_red_lightning' },
  mawOfTheVoid: { pickup: 'item_unholy', effect: 'item_maw_void' },
  xRayVision: { pickup: 'item_unholy', effect: 'item_see_4ever' },
};

/**
 * Isaac 音效基础音量表 — 相比 AC 音源，Isaac 动态范围更大，整体降低 50% 左右。
 */
const ITEM_SFX_VOL: Record<string, number> = {
  item_power_up: 0.20,
  item_health_up: 0.22,
  item_penny: 0.22,
  item_48hr_energy: 0.22,
  item_battery_charge: 0.20,
  item_holy: 0.20,
  item_whip: 0.22,
  item_dog_howl: 0.20,
  item_dog_bark: 0.22,
  item_superholy: 0.18,
  item_blood_laser: 0.20,
  item_knife_pull: 0.22,
  item_unholy: 0.18,
  item_r_u_wiz: 0.18,
  item_vamp: 0.22,
  item_red_lightning: 0.22,
  item_maw_void: 0.20,
  item_see_4ever: 0.22,
  item_luck_up: 0.20,
  item_explosion: 0.25,
};

/**
 * 根据 item id 获取道具获取音效 key，找不到则返回默认值。
 */
export function getItemPickupSFX(itemId: string, fallback = 'item_get'): string {
  return ITEM_SFX_MAP[itemId]?.pickup || fallback;
}

/**
 * 根据 item id 获取道具生效音效 key，找不到则返回默认值。
 */
export function getItemEffectSFX(itemId: string, fallback = 'seal_break'): string {
  const key = ITEM_SFX_MAP[itemId]?.effect
  return key || fallback;
}

export function getItemSFXVol(sfxKey: string): number | null {
  return ITEM_SFX_VOL[sfxKey] ?? null;
}

/** 没有 board event handler 播放音效的道具 id（由 onItemEffectTriggered 补播）。 */
export const NO_BOARD_AUDIO_ITEMS = new Set([
  'sackOfPennies', 'battery', 'dogTooth', 'darkBeggar'
])

const AC_AMBIENT_MULTI: Record<string, string[]> = {
  construction: [`${AC_BASE}/Environment/Env_FacilityConstruction00.wav`],
  healing: [`${AC_BASE}/Environment/Env_SeaWaterWave00.wav`],
  space: [`${AC_BASE}/Environment/Env_SeaWaterWave01.wav`],
};

const AMBIENT_INTERMITTENT: Record<string, IntermittentGroup[]> = {
  daytime: [
    { files: [`${AC_BASE}/Environment/BbsBirdDay_Twitter00.wav`, `${AC_BASE}/Environment/BbsBirdDay_Twitter01.wav`], minMs: 5000, maxMs: 15000, vol: [0.15, 0.3] },
    { files: [`${AC_BASE}/Environment/Env_RiverNearSlow00.wav`], minMs: 8000, maxMs: 20000, vol: [0.1, 0.2] },
    { files: [`${AC_BASE}/Environment/Env_GrassWindSummerWeak.wav`, `${AC_BASE}/Environment/Env_GrassWindSummerStrong.wav`, `${AC_BASE}/Environment/Env_PlantWind_FlowerMany_00.wav`], minMs: 10000, maxMs: 25000, vol: [0.1, 0.2] },
  ],
  evening: [
    { files: [`${AC_BASE}/Environment/BbsBirdNightTwitterA00.wav`, `${AC_BASE}/Environment/BbsBirdNightTwitterA01.wav`], minMs: 6000, maxMs: 18000, vol: [0.12, 0.25] },
    { files: [`${AC_BASE}/Environment/Env_GrassWindSummerWeak.wav`], minMs: 12000, maxMs: 30000, vol: [0.1, 0.2] },
  ],
};

const AC_MATCH: (string | string[])[] = [
  ['FieldPlant_WaterDrop_00.wav', 'FieldPlant_WaterDrop_01.wav'],
  ['FieldPlant_WaterDrop_02.wav', 'FieldPlant_Shake_Dash_00.wav'],
  ['FieldPlant_Shake_Dash_01.wav', 'FieldPlant_Shake_Dash_02.wav'],
  ['Tree_Shake_Oak_HitAxe.wav', 'Tree_Shake_Cedar_HitAxe.wav', 'Tree_Shake_Sakura_HitAxe.wav'],
  ['Tree_Shake_Cedar_Down1.wav', 'Tree_Shake_Oak_Down1.wav', 'Tree_Shake_Sakura_Down1.wav'],
  ['Tree_Shake_Palm_Down1.wav', 'Tree_Shake_Bamboo_Down1.wav'],
  ['Tree_ChangeState_00.wav', 'Tree_ChangeState_01.wav', 'Tree_ChangeState_02.wav'],
  ['Tree_ChangeState_03.wav', 'Tree_ChangeState_04.wav', 'Tree_ChangeState_05.wav'],
];

const AC_COMBO: (string | string[])[] = [
  ['Tree_Shake_Bamboo_Down1.wav', 'Tree_Shake_Cedar_Down1.wav'],
  ['Tree_Shake_Oak_Down1.wav', 'Tree_Shake_Sakura_Down1.wav'],
  ['Tree_Shake_Palm_Down1.wav', 'Tree_ChangeState_00.wav'],
  ['Tree_ChangeState_01.wav', 'Tree_ChangeState_02.wav'],
  ['Tree_ChangeState_03.wav', 'Tree_ChangeState_04.wav'],
  ['Tree_ChangeState_05.wav', 'Tree_Disappear_Normal_00.wav'],
  ['Tree_Appear_Normal_00.wav', 'Tree_Shake_RandomRainDrop_00.wav'],
];

const COMBO_UI_PATH = [
  `${AC_BASE}/UI & System/UI_Decide_Small.wav`,
  `${AC_BASE}/UI & System/UI_Decide.wav`,
  `${AC_BASE}/UI & System/UI_CountUp.wav`,
  `${AC_BASE}/UI & System/UI_Check.wav`,
  `${AC_BASE}/UI & System/Event_Harvest_Bell00.wav`,
];
const COMBO_UI_VOL = [0.35, 0.40, 0.45, 0.50, 0.55];

const AC_PRAISE: Record<number, string> = {
  4: `${AC_BASE}/Rosie Emotes/RosiePleased.mp3`,
  5: `${AC_BASE}/Rosie Emotes/RosieDelight.mp3`,
  6: `${AC_BASE}/Rosie Emotes/RosieAmazed.mp3`,
  7: `${AC_BASE}/Rosie Emotes/RosieInspiration.mp3`,
  8: `${AC_BASE}/Rosie Emotes/RosieShowmanship.mp3`,
};

const AC_DROP = [
  'Tree_Shake_RandomRainDrop_00.wav',
];

type IntermittentGroup = {
  files: string[];
  minMs: number;
  maxMs: number;
  vol: [number, number];
};

type ChannelKind = 'bgm' | 'ambient';
type MonsterEvent = 'spawn' | 'hit' | 'defeat';
type SFXOptions = {
  vol?: number;
  rate?: number;
  bypassThrottle?: boolean;
  actualPath?: string;
  priority?: number;
  interrupt?: boolean;
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
  gfuel:          { sameMs: 3000, group: 'ability', groupMs: 1500, priority: 3 },
  ability_roach: { sameMs: 180, group: 'ability', groupMs: 90, priority: 3 },
  ability_sunset: { sameMs: 180, group: 'ability', groupMs: 90, priority: 3 },
  decoction: { sameMs: 180, group: 'ability', groupMs: 90, priority: 3 },
  lilac: { sameMs: 180, group: 'ability', groupMs: 90, priority: 3 },
  xray: { sameMs: 600, group: 'ritual', groupMs: 300, priority: 3 },
  pig_gentle: { sameMs: 800, group: 'pig', groupMs: 400, priority: 1 },
  pig_warm: { sameMs: 800, group: 'pig', groupMs: 400, priority: 1 },
  pig_warning: { sameMs: 1200, group: 'pig', groupMs: 500, priority: 2 },
  pig_annoyed: { sameMs: 1800, group: 'pig', groupMs: 600, priority: 2 },
  pig_angry: { sameMs: 3000, group: 'pig', groupMs: 900, priority: 3 },
  pig_idle: { sameMs: 8000, group: 'pig', groupMs: 3000, priority: 1 },
  pig_sniff: { sameMs: 4000, group: 'pig', groupMs: 2000, priority: 1 },
  pig_energy: { sameMs: 5000, group: 'pig', groupMs: 1000, priority: 3 },
  item_get: { sameMs: 400, group: 'reward', groupMs: 200, priority: 3 },
  typewriter_key: { sameMs: 24, group: 'typewriter', groupMs: 10, priority: 3 },
  typewriter_space: { sameMs: 60, group: 'typewriter', groupMs: 18, priority: 2 },
  typewriter_enter: { sameMs: 200, group: 'typewriter', groupMs: 100, priority: 3 },
  typewriter_backspace: { sameMs: 50, group: 'typewriter', groupMs: 15, priority: 2 },

  daystart: { sameMs: 2000, group: 'feedback', groupMs: 400, priority: 3 },
  resourcegain: { sameMs: 80, group: 'feedback', groupMs: 50, priority: 1 },
  stepcost: { sameMs: 120, group: 'feedback', groupMs: 80, priority: 2 },
  taskcomplete: { sameMs: 2500, group: 'feedback', groupMs: 300, priority: 3 },
  repairtick: { sameMs: 400, group: 'feedback', groupMs: 200, priority: 1 },
  repairdone: { sameMs: 3000, group: 'feedback', groupMs: 400, priority: 3 },
  boardshuffle: { sameMs: 2000, group: 'board', groupMs: 400, priority: 2 },
  dialogopen: { sameMs: 500, group: 'ui', groupMs: 200, priority: 3 },
  dialogclose: { sameMs: 400, group: 'ui', groupMs: 200, priority: 2 },
  dayendopen: { sameMs: 500, group: 'ui', groupMs: 200, priority: 3 },
  itemhover: { sameMs: 200, group: 'ui', groupMs: 100, priority: 1 },
  tutorialstep: { sameMs: 500, group: 'ui', groupMs: 200, priority: 2 },
  scenetransition: { sameMs: 2000, group: 'ritual', groupMs: 400, priority: 3 },
  bark: { sameMs: 4000, group: 'pig', groupMs: 800, priority: 1 },

  // Isaac items
  item_power_up: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_health_up: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_penny: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_48hr_energy: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_battery_charge: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_holy: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_whip: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_dog_howl: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_dog_bark: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_superholy: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_blood_laser: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_knife_pull: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_unholy: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_r_u_wiz: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_vamp: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_red_lightning: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_maw_void: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_see_4ever: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_luck_up: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
  item_explosion: { sameMs: 500, group: 'item', groupMs: 200, priority: 3 },
};

const SFX_CHANNEL_PRIORITY: Record<string, number> = {
  click: 1,
  itemhover: 1,
  hint: 1,
  land: 1,
  spawn: 1,
  resourcegain: 1,
  swap: 2,
  lineclear: 2,
  pageflip: 2,
  dialogopen: 2,
  dialogclose: 2,
  ability_wolf: 4,
  ability_harvest: 4,
  ability_roach: 4,
  ability_sunset: 4,
  decoction: 4,
  gfuel: 4,
  lilac: 4,
  xray: 4,
  seal_break: 4,
  djinn_appear: 4,
  wish1: 4,
  wish2: 4,
  wish3: 4,
  taskcomplete: 4,
  repairdone: 4,
  achievement: 4,
  item_get: 3,
  item_power_up: 3,
  item_health_up: 3,
  item_penny: 3,
  item_48hr_energy: 3,
  item_battery_charge: 3,
  item_holy: 3,
  item_whip: 3,
  item_dog_howl: 3,
  item_dog_bark: 3,
  item_superholy: 3,
  item_blood_laser: 3,
  item_knife_pull: 3,
  item_unholy: 3,
  item_r_u_wiz: 3,
  item_vamp: 3,
  item_red_lightning: 3,
  item_maw_void: 3,
  item_see_4ever: 3,
  item_luck_up: 3,
  item_explosion: 3,
};

function pickOne<T>(entry: T | T[]): T {
  return Array.isArray(entry) ? entry[Math.floor(Math.random() * entry.length)] : entry;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createAudio(src: string) {
  const audio = new Audio(src);
  audio.preload = 'auto';
  return audio;
}

const BGM_PRELOAD_FILES = [
  `${AC_BASE}/Bgm/1-05 500 a.m. (~Sunny Weather~).mp3`,
  `${AC_BASE}/Bgm/1-10 1000 a.m. (~Sunny Weather~).mp3`,
  `${AC_BASE}/Bgm/2-03 300 p.m. (~Sunny Weather~).mp3`,
  `${AC_BASE}/Bgm/2-06 600 p.m. (~Sunny Weather~).mp3`,
  `${AC_BASE}/Bgm/2-12 Midnight (~Sunny Weather~).mp3`,
  `${AC_BASE}/Bgm/3-01 Main Theme - Welcome Horizons.mp3`,
  `${AC_BASE}/Bgm/3-07 Completion Fanfare.mp3`,
  `${AC_BASE}/Bgm/3-11 Into Dreams....mp3`,
  `${AC_BASE}/Bgm/3-43 Ceremony.mp3`,
  `${AC_BASE}/Bgm/3-50 Able Sisters - Welcome To The Able Sisters!.mp3`,
  `${AC_BASE}/Bgm/4-01 Release Day Update 1.1.0 ~ Bunny Day - Bunny Day with Zipper T. Bunny.mp3`,
];

const ISAAC_PRELOAD_FILES = [
  'power up1.wav',
  'health up 1.wav',
  'unholy!.wav',
  'superholy.wav',
  'penny pickup 1.wav',
  '48 hr energy.wav',
  'battery charge.wav',
  'holy!.wav',
  'whip_02.wav',
  'dog howell.wav',
  'dog bark.wav',
  'blood laser strong 1.wav',
  'knife_pull.wav',
  'r u a wiz 2.wav',
  'vamp.wav',
  'redlightning_burst01.wav',
  'maw of the void.wav',
  'see 4ever 1.wav',
  'luck up.wav',
  'explosion_weak1.wav',
  'gfuel 1.wav',
  'gfuel 2.wav',
  'gfuel 3.wav',
  'gfuel 4.wav',
].map(file => `${ISAAC_BASE}/${file}`);

function toArray<T>(entry: T | T[]): T[] {
  return Array.isArray(entry) ? entry : [entry];
}

function collectPreloadAudioFiles() {
  const files = new Set<string>();
  const add = (file?: string | null) => {
    if (file) files.add(file);
  };

  BGM_PRELOAD_FILES.forEach(add);
  ISAAC_PRELOAD_FILES.forEach(add);
  Object.values(AC_SFX_MAP).forEach(add);
  Object.values(AC_SFX_MULTI).flat().forEach(add);
  Object.values(AC_AMBIENT_MULTI).flat().forEach(add);
  Object.values(AMBIENT_INTERMITTENT)
    .flat()
    .flatMap(group => group.files)
    .forEach(add);
  Object.values(AC_PRAISE).forEach(add);
  COMBO_UI_PATH.forEach(add);

  for (const entry of [...AC_MATCH, ...AC_COMBO, ...AC_DROP]) {
    for (const file of toArray(entry)) {
      add(`${AC_BASE}/Trees & Plants/${file}`);
    }
  }

  return [...files];
}

const CRITICAL_SFX_KEYS = [
  'click',
  'pageflip',
  'error',
  'swap',
  'land',
  'spawn',
  'lineclear',
  'hint',
  'lowsteps',
  'steprestore',
  'resourcegain',
  'stepcost',
  'taskcomplete',
  'item_get',
  'itemhover',
  'tutorialstep',
  'dialogopen',
  'dialogclose',
  'dayendopen',
  'ability_wolf',
  'ability_harvest',
  'ability_roach',
  'ability_sunset',
  'decoction',
  'lilac',
  'xray',
  'seal_break',
  'rune_hit',
  'achievement',
  'pig_gentle',
  'pig_warm',
  'pig_warning',
  'pig_annoyed',
  'pig_angry',
  'pig_idle',
  'pig_sniff',
  'pig_energy',
  'gfuel',
  ...Object.values(ITEM_SFX_MAP).flatMap(({ pickup, effect }) =>
    effect ? [pickup, effect] : [pickup]
  ),
];

function collectCriticalAudioFiles() {
  const files = new Set<string>();
  const add = (file?: string | null) => {
    if (file) files.add(file);
  };

  for (const key of CRITICAL_SFX_KEYS) {
    add(AC_SFX_MAP[key]);
    AC_SFX_MULTI[key]?.forEach(add);
  }

  ISAAC_PRELOAD_FILES.forEach(add);
  Object.values(AC_PRAISE).forEach(add);
  COMBO_UI_PATH.forEach(add);

  for (const entry of [...AC_MATCH, ...AC_COMBO, ...AC_DROP]) {
    for (const file of toArray(entry)) {
      add(`${AC_BASE}/Trees & Plants/${file}`);
    }
  }

  return [...files];
}

async function runPreloadQueue<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  concurrency: number,
  onProgress?: (done: number, total: number) => void
) {
  const queue = [...items];
  const total = queue.length;
  let done = 0;

  onProgress?.(done, total);
  if (!total) return;

  const workers = Array.from(
    { length: Math.min(concurrency, total) },
    async () => {
      while (queue.length) {
        const item = queue.shift()!;
        await worker(item).catch(() => { });
        done += 1;
        onProgress?.(done, total);
      }
    }
  );

  await Promise.all(workers);
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
  private readonly blobCache = new Map<string, string>();
  private readonly listeners = new Set<() => void>();
  private readonly sfxLastPlayedAt = new Map<string, number>();
  private readonly sfxGroupLastPlayedAt = new Map<string, number>();
  private ambientTimerIds: number[] = [];

  private constructor() { }

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

    this.initialized = true;
  }

  private async getAudioSrc(filePath: string): Promise<string> {
    if (this.blobCache.has(filePath)) return this.blobCache.get(filePath)!;
    const url = `${import.meta.env.BASE_URL}audio/${filePath}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Audio preload failed: ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      this.blobCache.set(filePath, blobUrl);
      return blobUrl;
    } catch {
      return url;
    }
  }

  preloadAll(onProgress?: (done: number, total: number) => void) {
    const files = collectPreloadAudioFiles();
    return runPreloadQueue(
      files,
      file => this.preload(file),
      AUDIO_PRELOAD_CONCURRENCY,
      onProgress
    );
  }

  preloadCritical(onProgress?: (done: number, total: number) => void) {
    const files = collectCriticalAudioFiles();
    return runPreloadQueue(
      files,
      file => this.preload(file),
      AUDIO_PRELOAD_CONCURRENCY,
      onProgress
    );
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

    const promise = this.getAudioSrc(fileName).then(() => {}).catch(() => {});

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
    this.clearAmbientTimers();

    const groups = AMBIENT_INTERMITTENT[name];
    if (groups) {
      for (const group of groups) {
        this.scheduleIntermittentGroup(group);
      }
      if (this.ambientChannel.audio) {
        await this.fadeOutAndStop(this.ambientChannel, 0);
      }
      return;
    }

    const pool = AC_AMBIENT_MULTI[name];
    const file = pool ? pool[Math.floor(Math.random() * pool.length)] : `amb_${name}.mp3`;
    return this.playLoopingChannel(this.ambientChannel, file, 'ambient', opts.fade ?? AMBIENT_FADE_MS, true);
  }

  async stopAmbient(fade = AMBIENT_FADE_MS) {
    if (!this.initialized) return;
    this.clearAmbientTimers();
    await this.fadeOutAndStop(this.ambientChannel, fade);
  }

  private clearAmbientTimers() {
    for (const id of this.ambientTimerIds) window.clearTimeout(id);
    this.ambientTimerIds = [];
  }

  private scheduleIntermittentGroup(group: IntermittentGroup) {
    const delay = group.minMs + Math.random() * (group.maxMs - group.minMs);
    const id = window.setTimeout(() => {
      this.playAmbientOneShot(group);
      this.scheduleIntermittentGroup(group);
    }, delay);
    this.ambientTimerIds.push(id);
  }

  private async playAmbientOneShot(group: IntermittentGroup) {
    if (this._isMuted) return;
    if (!await this.ensureReady()) return;
    const file = group.files[Math.floor(Math.random() * group.files.length)];
    const vol = group.vol[0] + Math.random() * (group.vol[1] - group.vol[0]);
    if (!this.reserveSFXSlot(1, false)) return;
    const src = await this.getAudioSrc(file);
    const audio = createAudio(src);
    audio.volume = clamp(vol * this._ambientVolume, 0, 1);
    audio.dataset.baseVolume = String(audio.volume);
    audio.dataset.priority = '1';
    this.activeSFXs.add(audio);
    const cleanup = () => { audio.pause(); this.activeSFXs.delete(audio); };
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });
    try { await audio.play(); } catch { cleanup(); }
  }

  /** 播放道具获取音效 — 自动查 ITEM_SFX_MAP + ITEM_SFX_VOL。 */
  playItemPickupSFX(itemId: string) {
    const entry = ITEM_SFX_MAP[itemId]
    const key = entry?.pickup || 'item_get'
    const vol = ITEM_SFX_VOL[key] ?? 0.35
    this.playSFX(key, { vol })
  }

  /** 播放道具生效音效 — 无 effect 映射时静默跳过。 */
  playItemEffectSFX(itemId: string, defaultVol = 0.3) {
    const entry = ITEM_SFX_MAP[itemId]
    if (!entry?.effect) return
    const vol = ITEM_SFX_VOL[entry.effect] ?? defaultVol
    this.playSFX(entry.effect, { vol })
  }

  async playSFX(name: string, opts: SFXOptions = {}) {
    if (this._isMuted) return;
    if (!await this.ensureReady()) return;
    if (!opts.bypassThrottle && !this.shouldPlaySFX(name)) return;

    const multi = AC_SFX_MULTI[name];
    const pool = multi ?? (AC_SFX_MAP[name] ? [AC_SFX_MAP[name]] : []);
    const acPath = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
    const srcPath = acPath ?? `sfx_${name}.mp3`;
    const src = await this.getAudioSrc(srcPath);
    const priority = opts.priority ?? SFX_CHANNEL_PRIORITY[name] ?? DEFAULT_SFX_PRIORITY;
    if (!this.reserveSFXSlot(priority, opts.interrupt ?? priority >= 3)) return;
    const audio = createAudio(src);
    const baseVolume = clamp((opts.vol ?? 1) * this._sfxVolume, 0, 1);
    audio.volume = baseVolume;
    audio.playbackRate = clamp(opts.rate ?? 1, 0.5, 2);
    audio.dataset.baseVolume = String(baseVolume);
    audio.dataset.priority = String(priority);

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
    const index = clamp(Math.round(count), 1, 8) - 1;
    const entry = AC_MATCH[index];
    const file = entry ? pickOne(entry) : 'FieldPlant_WaterDrop_00.wav';
    const base = 0.46 + (index + 1) * 0.045;
    const extra = index >= 5 ? 0.05 + (index - 5) * 0.015 : 0;
    this.playLooseFile(`eliminate${index + 1}.mp3`, {
      actualPath: `${AC_BASE}/Trees & Plants/${file}`,
      vol: clamp(base + extra, 0.5, 0.90),
      priority: 2
    });
  }

  playMatchPraise(size: number) {
    if (size < 4) return;
    const clamped = clamp(Math.round(size), 4, 8);
    const path = AC_PRAISE[clamped];
    if (!path) return;
    this.playLooseFile(`praise${clamped}.mp3`, {
      actualPath: path,
      vol: clamp(0.50 + (clamped - 4) * 0.075, 0.4, 0.85),
      priority: 3,
      interrupt: true
    });
  }

  playCombo(level: number) {
    if (level < 2) return;
    const comboCount = clamp(level, 3, 7);
    const idx = comboCount - 3;
    const path = COMBO_UI_PATH[idx];
    const vol = COMBO_UI_VOL[idx];
    this.playLooseFile(`combo${comboCount}.mp3`, {
      actualPath: path,
      vol: vol,
      priority: 4,
      interrupt: true
    });
  }

  playBoardDrop(fallCount = 1) {
    const file = pickOne(AC_DROP);
    this.playLooseFile('drop.mp3', {
      actualPath: `${AC_BASE}/Trees & Plants/${file}`,
      vol: clamp(0.26 + Math.min(fallCount, 8) * 0.035, 0.28, 0.56)
    });
  }

  async playMonster(type: string, event: MonsterEvent) {
    void type;
    const map: Record<string, string> = {
      spawn: `${AC_BASE}/Trees & Plants/Tree_Appear_Normal_00.wav`,
      hit: `${AC_BASE}/Trees & Plants/Tree_Shake_Oak_HitAxe.wav`,
      defeat: `${AC_BASE}/Trees & Plants/Tree_Disappear_Normal_00.wav`,
    };
    const path = map[event];
    if (!path) return;
    if (!this.reserveSFXSlot(2, false)) return;
    const src = await this.getAudioSrc(path);
    const audio = createAudio(src);
    audio.volume = clamp(0.5 * this._sfxVolume, 0, 1);
    audio.dataset.baseVolume = String(audio.volume);
    audio.dataset.priority = '2';
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
    this.ensureReady().catch(() => { });
    this.bgmChannel.audio?.play().catch(() => { });
    this.ambientChannel.audio?.play().catch(() => { });
    for (const audio of this.activeSFXs) audio.play().catch(() => { });
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
    this._sfxVolume = clamp(value, 0, 1);
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
    const blobSrc = await this.getAudioSrc(fileName);
    const originalSrc = `${import.meta.env.BASE_URL}audio/${fileName}`;
    if (channel.name === originalSrc && channel.audio) {
      channel.audio.loop = loop;
      channel.audio.volume = this._isMuted ? 0 : this.getChannelTargetVolume(kind);
      if (channel.audio.paused && !this._isMuted) {
        channel.audio.play().catch(() => { });
      }
      return;
    }

    const loadToken = ++channel.loadToken;
    const nextAudio = createAudio(blobSrc);
    nextAudio.loop = loop;
    nextAudio.volume = 0;

    const previous = channel.audio;
    channel.audio = nextAudio;
    channel.name = originalSrc;

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

  private reserveSFXSlot(priority = DEFAULT_SFX_PRIORITY, interrupt = false) {
    if (this.activeSFXs.size < MAX_SFX) return true;

    let lowestAudio: HTMLAudioElement | null = null;
    let lowestPriority = Infinity;
    for (const audio of this.activeSFXs) {
      const activePriority = Number(audio.dataset.priority || DEFAULT_SFX_PRIORITY);
      if (activePriority < lowestPriority) {
        lowestPriority = activePriority;
        lowestAudio = audio;
      }
    }

    if (!lowestAudio) return false;
    if (!interrupt || lowestPriority > priority) return false;

    lowestAudio.pause();
    lowestAudio.currentTime = 0;
    this.activeSFXs.delete(lowestAudio);
    return true;
  }

  private async playLooseFile(fileName: string, opts: SFXOptions = {}) {
    if (this._isMuted) return;
    if (!await this.ensureReady()) return;
    if (!opts.bypassThrottle && !this.shouldPlayLooseFile(fileName)) return;
    await this.preload(fileName).catch(() => { });

    let actualFile = fileName;
    if (opts.actualPath) {
      actualFile = opts.actualPath;
    } else if (/^eliminate(\d+)\.mp3$/.test(fileName)) {
      const i = parseInt(fileName.match(/\d+/)![0]) - 1;
      const entry = AC_MATCH[i];
      actualFile = `${AC_BASE}/Trees & Plants/${entry ? pickOne(entry) : 'FieldPlant_WaterDrop_00.wav'}`;
    } else if (/^(?:contnuousMatch|combo)(\d+)\.mp3$/.test(fileName)) {
      const lvl = parseInt(fileName.match(/\d+/)![0]);
      const entry = AC_COMBO[lvl - 3];
      actualFile = `${AC_BASE}/Trees & Plants/${entry ? pickOne(entry) : 'Tree_Shake_Bamboo_Down1.wav'}`;
    } else if (fileName === 'drop.mp3') {
      actualFile = `${AC_BASE}/Trees & Plants/${pickOne(AC_DROP)}`;
    }
    const priority = opts.priority ?? DEFAULT_SFX_PRIORITY;
    if (!this.reserveSFXSlot(priority, opts.interrupt ?? priority >= 3)) return;
    const looseSrc = await this.getAudioSrc(actualFile);
    const audio = createAudio(looseSrc);
    const baseVolume = clamp((opts.vol ?? 1) * this._sfxVolume, 0, 1);
    audio.volume = baseVolume;
    audio.playbackRate = clamp(opts.rate ?? 1, 0.5, 2);
    audio.dataset.baseVolume = String(baseVolume);
    audio.dataset.priority = String(priority);

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
    if (/^praise\d+\.mp3$/.test(fileName)) {
      return this.shouldPlayWithPolicy(`loose:${fileName}`, {
        sameMs: 600,
        group: 'praise',
        groupMs: 400,
        priority: 3
      });
    }

    if (/^eliminate\d+\.mp3$/.test(fileName)) {
      return this.shouldPlayWithPolicy(`loose:${fileName}`, {
        sameMs: 95,
        group: 'match',
        groupMs: 78,
        priority: 2
      });
    }

    if (/^(?:contnuousMatch|combo)\d+\.mp3$/.test(fileName)) {
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
