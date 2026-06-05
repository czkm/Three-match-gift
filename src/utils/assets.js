const BASE = import.meta.env.BASE_URL || './'

function cleanPath(path) {
  return typeof path === 'string' ? path.replace(/^\//, '') : ''
}

export function img(path) {
  return `${BASE}${cleanPath(path)}`
}

function cssUrl(path) {
  const value = img(path)
  if (typeof document === 'undefined') return `url('${value}')`
  const absolute = new URL(value, document.baseURI).href
  return `url("${absolute.replace(/"/g, '\\"')}")`
}

export function setCSSAssetVars() {
  const root = document.documentElement
  const bgs = [
    'board_bg_01.webp',
    'board_bg_02.webp',
    'board_bg_03.webp',
    'board_bg_04.webp',
  ]
  bgs.forEach((file, i) => {
    root.style.setProperty(`--bg-board-${i + 1}`, cssUrl(`img/background/${file}`))
  })
  root.style.setProperty('--game-bg-overlay', cssUrl('img/background/game_bg.jpg'))
  root.style.setProperty('--title-bg', cssUrl('img/background/title_bg.webp'))
  root.style.setProperty('--overlay-card-ceremony', cssUrl('img/background/overlay_card_ceremony.png'))
  root.style.setProperty('--overlay-card-tutorial', cssUrl('img/background/overlay_card_tutorial.jpg'))
}
