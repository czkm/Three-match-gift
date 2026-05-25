export const COMMON_COPY = {
  continueHint: '点一下继续狸',
  continueAnywhereHint: '点哪里都行狸',
  cancel: '算了狸',
  ready: '好了狸',
  expand: '展开',
  collapse: '收起',
  adjust: '调节',
  mute: '静音',
  unmute: '开启声音',
  muted: '静音中',
  sound: '声音',
  acquirePrefix: '捡到了'
};

export function formatAcquiredText(name) {
  return `${COMMON_COPY.acquirePrefix} ${name}`;
}

export function formatNextDayStepPenalty(value) {
  return `明日 -${value} 步`;
}

export function formatMaxStepPenalty(value) {
  return `上限 -${value}`;
}
