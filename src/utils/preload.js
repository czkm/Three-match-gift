import { img } from './assets'

const IMAGE_PRELOAD_CONCURRENCY = 8
const imageCache = new Map()

function preloadOne(url) {
  const cached = imageCache.get(url)
  if (cached) return cached.promise

  const image = new Image()
  const promise = new Promise((resolve) => {
    image.onload = resolve
    image.onerror = resolve
    image.src = url
  })
  imageCache.set(url, { image, promise })
  return promise
}

async function runQueue(items, worker, concurrency, onProgress) {
  const queue = [...items]
  const total = queue.length
  let done = 0

  onProgress?.(done, total)
  if (!total) return

  const workers = Array.from(
    { length: Math.min(concurrency, total) },
    async () => {
      while (queue.length) {
        const item = queue.shift()
        await worker(item).catch(() => {})
        done += 1
        onProgress?.(done, total)
      }
    }
  )

  await Promise.all(workers)
}

export function preloadImages(urls, onProgress) {
  const uniqueUrls = [...new Set(urls.filter(Boolean))]
  return runQueue(uniqueUrls, preloadOne, IMAGE_PRELOAD_CONCURRENCY, onProgress)
}

const ALL_IMAGE_PATHS = [
  'img/achievements/cascade_poetry.png',
  'img/achievements/clutch_finish.png',
  'img/achievements/day1_clear_the_way.png',
  'img/achievements/day2_vines_remember.png',
  'img/achievements/day3_one_bottle_saved.png',
  'img/achievements/day4_roach_approves.png',
  'img/achievements/day5_lilac_in_the_wind.png',
  'img/achievements/day6_keep_the_lamp_warm.png',
  'img/achievements/day7_a_chair_for_waiting.png',
  'img/achievements/day8_the_soup_will_hold.png',
  'img/achievements/day9_room_for_her.png',
  'img/achievements/grand_harvest.png',
  'img/achievements/love_from_xiaokun.png',
  'img/achievements/sunlit_margin.png',
  'img/animal_icon.png',
  'img/animal_icon2.png',
  'img/animal_icon_couple1.png',
  'img/animal_icon_couple2.png',
  'img/background/FtrCashier.png',
  'img/background/board_bg_01.webp',
  'img/background/board_bg_02.webp',
  'img/background/board_bg_03.webp',
  'img/background/board_bg_04.webp',
  'img/background/game_bg.jpg',
  'img/background/overlay_card_ceremony.png',
  'img/background/overlay_card_tutorial.jpg',
  'img/background/reciveBg.jpg',
  'img/background/title_bg.webp',
  'img/chessPiece/FtrHaniwaCrash00.png',
  'img/chessPiece/FtrHaniwaCrash01.png',
  'img/chessPiece/FtrHaniwaCrash02.png',
  'img/chessPiece/FtrHaniwaCrash03.png',
  'img/chessPiece/FtrHaniwaCrash04.png',
  'img/chessPiece/FtrHaniwaCrash05.png',
  'img/chessPiece/FtrHaniwaCrash06.png',
  'img/chessPiece/FtrHaniwaCrash07.png',
  'img/chessPiece/FtrHaniwaCrash08.png',
  'img/chessPiece/FtrHaniwaCrash09.png',
  'img/chessPiece/FtrHaniwaCrash10.png',
  'img/chessPiece/FtrHaniwaCrash11.png',
  'img/chessPiece/FtrHaniwaCrash12.png',
  'img/chessPiece/bamboo piece.png',
  'img/chessPiece/candle.png',
  'img/chessPiece/cherry-blossom petal.png',
  'img/chessPiece/clay.png',
  'img/chessPiece/orange.png',
  'img/chessPiece/star fragment.png',
  'img/chessPiece/stone.png',
  'img/chessPiece/tombstone.png',
  'img/chessPiece/tree branch.png',
  'img/gift.jpg',
  'img/gift2.jpg',
  'img/isaac/battery.png',
  'img/isaac/brimstone.png',
  'img/isaac/darkBeggar.png',
  'img/isaac/dogTooth.png',
  'img/isaac/holyWater.png',
  'img/isaac/luckyFoot.png',
  'img/isaac/lunch.png',
  'img/isaac/mawOfTheVoid.png',
  'img/isaac/momsKnife.png',
  'img/isaac/pentagram.png',
  'img/isaac/sackOfPennies.png',
  'img/isaac/stye.png',
  'img/isaac/thePact.png',
  'img/isaac/xRayVision.png',
  'img/milktea/BirthdayCupcake.png',
  'img/milktea/ToolTapioca0.png',
  'img/milktea/ToolTapioca1.png',
  'img/milktea/ToolTapioca2.png',
  'img/milktea/ToolTapioca3.png',
  'img/milktea/ToolTapioca4.png',
  'img/milktea/ToolTapioca5.png',
  'img/milktea/ToolTapioca6.png',
  'img/monsters/blue-morpho.png',
  'img/monsters/dung-beetle.png',
  'img/monsters/face-bug.png',
  'img/monsters/mantis.png',
  'img/monsters/water-strider.png',
  'img/monsters/狼蛛.png',
  'img/monsters/虾夷扇贝.png',
  'img/monsters/螃蟹.png',
  'img/nook-receipt.png',
  'img/skills/agedBarrel.png',
  'img/skills/greenhouseNurture.png',
  'img/skills/hearthStew.png',
  'img/skills/lilacReturn.png',
  'img/skills/lilacSeed.png',
  'img/skills/milkTeaBarrage.png',
  'img/skills/roachPath.png',
  'img/skills/toussentHarvest.png',
  'img/skills/toussentSunset.png',
  'img/skills/whiteWolfTidy.png',
]

export function getAllImages() {
  return ALL_IMAGE_PATHS.map(img)
}

export function getCriticalImages() {
  return [
    'img/background/board_bg_01.webp',
    'img/background/board_bg_02.webp',
    'img/background/board_bg_03.webp',
    'img/background/board_bg_04.webp',
    'img/background/game_bg.jpg',
    'img/background/title_bg.webp',
    'img/background/overlay_card_ceremony.png',
    'img/background/overlay_card_tutorial.jpg',
    'img/background/FtrCashier.png',
    'img/animal_icon.png',
    'img/animal_icon2.png',
  ].map(img)
}

export function getChessImages() {
  const pieces = [
    'orange.png', 'tree branch.png', 'stone.png',
    'clay.png', 'cherry-blossom petal.png', 'star fragment.png',
    'FtrHaniwaCrash00.png', 'FtrHaniwaCrash01.png', 'FtrHaniwaCrash02.png',
    'FtrHaniwaCrash03.png', 'FtrHaniwaCrash04.png', 'FtrHaniwaCrash05.png',
    'FtrHaniwaCrash06.png', 'FtrHaniwaCrash07.png', 'FtrHaniwaCrash08.png',
    'FtrHaniwaCrash09.png', 'FtrHaniwaCrash10.png', 'FtrHaniwaCrash11.png',
    'FtrHaniwaCrash12.png',
  ]
  return pieces.map(f => img(`img/chessPiece/${f}`))
}

export function getSkillImages() {
  const skills = [
    'milkTeaBarrage.png', 'lilacReturn.png', 'hearthStew.png',
    'toussentSunset.png', 'greenhouseNurture.png', 'lilacSeed.png',
    'roachPath.png', 'agedBarrel.png', 'toussentHarvest.png',
    'whiteWolfTidy.png',
  ]
  return skills.map(f => img(`img/skills/${f}`))
}

export function getMonsterImages() {
  const monsters = [
    'mantis.png', 'water-strider.png', 'dung-beetle.png',
    'blue-morpho.png', 'face-bug.png',
  ]
  return monsters.map(f => img(`img/monsters/${f}`))
}
