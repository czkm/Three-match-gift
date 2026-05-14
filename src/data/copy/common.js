export const COMMON_COPY = {
  continueHint: '点击继续',
  continueAnywhereHint: '点击任意处继续',
  cancel: '取消',
  ready: '就绪',
  expand: '展开',
  collapse: '收起',
  adjust: '调节',
  mute: '静音',
  unmute: '开启声音',
  muted: '静音中',
  sound: '声音',
  acquirePrefix: '获得了'
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
