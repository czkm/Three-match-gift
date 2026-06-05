import { img } from './assets'

function preloadOne(url) {
  return new Promise((resolve) => {
    const i = new Image()
    i.onload = resolve
    i.onerror = resolve
    i.src = url
  })
}

export function preloadImages(urls) {
  return Promise.all(urls.map(preloadOne))
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
