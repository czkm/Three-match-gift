<template>
  <div class="ending" :class="`act-${currentAct}`" @click="onStageClick">
    <!-- Dynamic background -->
    <div class="bg-base" />
    <div class="bg-glow" :class="`glow-${currentAct}`" />

    <!-- Starfield -->
    <div class="starfield" :class="{ intense: currentAct >= 2 }">
      <span
        v-for="s in stars"
        :key="s.id"
        class="star"
        :style="{
          left: s.x + '%',
          top: s.y + '%',
          width: s.size + 'px',
          height: s.size + 'px',
          animationDuration: s.dur + 's',
          animationDelay: s.delay + 's'
        }"
      />
    </div>

    <!-- Per-act particles -->
    <div
      v-if="particlesReady"
      class="particle-layer"
      :class="`particles-${currentAct}`"
    >
      <span
        v-for="p in currentParticles"
        :key="p.id"
        class="particle"
        :style="{
          left: p.x + '%',
          fontSize: p.size + 'px',
          animationDuration: p.dur + 's',
          animationDelay: p.delay + 's',
          '--dx': p.dx + 'px',
          '--rot': p.rot + 'deg'
        }"
      >
        {{ p.glyph }}
      </span>
    </div>

    <!-- Burst ring -->
    <div v-if="burstActive" class="burst-ring" :class="`burst-${currentAct}`" />

    <!-- Center content -->
    <div class="stage">
      <div class="stage-card" :class="`card-act-${currentAct}`">
        <div class="act-content">
          <!-- ═══ Acts 0-2: title + lines (unchanged) ═══ -->
          <template v-if="currentAct < 3">
            <div class="act-decoration">
              <span v-if="currentAct === 0" class="deco-icon">🪻</span>
              <span v-if="currentAct === 1" class="deco-icon">🎂</span>
            </div>
            <h1 class="act-title" :class="`title-${currentAct}`">
              {{ activeBeat?.title }}
            </h1>
            <div class="lines">
              <p
                v-for="(line, idx) in shownLines"
                :key="`${currentAct}-${idx}`"
                class="line"
                :class="[
                  `line-${currentAct}`,
                  { 'line-wish': currentAct === 2 }
                ]"
              >
                {{ line }}
              </p>
            </div>
            <div v-if="currentAct === 2" class="candle-ceremony">
              <div class="candle-row">
                <div
                  v-for="n in 3"
                  :key="`c-${n}`"
                  class="candle-unit"
                  :class="{ lit: n <= linesRevealed }"
                >
                  <span class="candle-flame">
                    {{ n <= linesRevealed ? '🔥' : '🕯️' }}
                  </span>
                  <span class="candle-label">
                    {{ ['健康', '快乐', '平安'][n - 1] }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="currentAct === 2 && allLinesShown" class="candle-lines">
              <p
                v-for="(line, idx) in ENDING.candleLines"
                :key="`candle-${idx}`"
                class="candle-line"
              >
                <span class="candle-marker">{{ ['🕯️', '🕯️', '🕯️'][idx] }}</span>
                {{ line }}
              </p>
            </div>
            <button
              v-if="allLinesShown"
              class="continue-btn"
              :class="`btn-act-${currentAct}`"
              @click.stop="onAdvance"
            >
              {{ advanceLabel }}
            </button>
          </template>

          <!-- ═══ Act 3: Animal Island Birthday Poster ═══ -->
          <template v-if="currentAct === 3">
            <div class="will-poster">
              <!-- Header -->
              <div class="will-section will-header">
                <span class="will-sparkle will-sparkle-l">✦</span>
                <span class="will-sparkle will-sparkle-r">✧</span>
                <p class="will-header-text">{{ willScreen.headerLine }}</p>
                <p class="will-title-text">{{ willScreen.titleLine }}</p>
                <div class="will-deco-row">
                  <span class="will-deco-emoji">🎂</span>
                  <span class="will-deco-emoji">🎉</span>
                  <span class="will-deco-emoji">🎈</span>
                </div>
                <p class="will-sub-text">{{ willScreen.clearedLine }}</p>
                <p class="will-sub-text will-sub-loc">{{ willLocationText }}</p>
              </div>

              <!-- Divider -->
              <div class="will-divider" />

              <!-- Gift Box -->
              <div class="will-section will-gift-section">
                <div class="will-gift-box">
                  <div class="will-gift-glow" />
                  <img
                    src="/img/animal_icon_couple1.png"
                    class="will-gift-piggy"
                    alt="粒狸"
                  />
                  <img
                    src="/img/nook-receipt.png"
                    class="will-gift-receipt"
                    alt="报酬收据"
                  />
                  <span class="will-gift-hint">{{ willScreen.giftHint }}</span>
                </div>
                <p class="will-gift-label">↑ 报酬收据狸 ↑</p>
              </div>

              <!-- Divider -->
              <div class="will-divider" />

              <!-- Pig Companion -->
              <div class="will-section will-pig-section">
                <span class="will-pig-icon">🐷</span>
                <p class="will-pig-line will-pig-main">
                  {{ willScreen.pigCompanionLine2 }}
                </p>
                <p class="will-pig-line will-pig-sub-1">
                  {{ willScreen.pigCompanionLine1 }}
                </p>
                <p class="will-pig-line will-pig-sub-2">
                  {{ willScreen.pigCompanionLine3 }}
                </p>
              </div>

              <!-- Divider -->
              <div class="will-divider" />

              <!-- Items -->
              <div class="will-section will-items-section">
                <p class="will-items-label">{{ willScreen.itemsArrow }}</p>
                <div class="will-items-grid">
                  <span
                    v-for="(item, idx) in ownedWillItems"
                    :key="idx"
                    class="will-item-chip"
                    :style="{ animationDelay: idx * 55 + 'ms' }"
                    :title="item.name"
                  >
                    {{ item.emoji }}
                  </span>
                </div>
                <p class="will-items-tag">{{ willScreen.itemsLabel }}</p>
              </div>

              <!-- Divider -->
              <div class="will-divider" />

              <!-- Closing -->
              <div class="will-section will-closing">
                <p class="will-estate">🪻 {{ willScreen.estateLine }}</p>
                <p class="will-farewell">{{ willScreen.farewellLine }}</p>
                <p class="will-xoxo">{{ willScreen.goodbyeLine }}</p>
                <div class="will-closing-icons">
                  <span>🗝️</span>
                  <span>💗</span>
                  <span>🏠</span>
                </div>
              </div>

              <!-- Bottom sparkle -->
              <span class="will-sparkle will-sparkle-bl">○</span>
            </div>

            <!-- Action buttons -->
            <div class="will-actions">
              <button
                class="will-btn will-btn-poster"
                @click.stop="onScreenshotWill"
              >
                <span class="will-btn-icon">📸</span>
                生成海报
              </button>
              <button class="will-btn will-btn-restart" @click.stop="onRestart">
                <span class="will-btn-icon">🔄</span>
                重新开始
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { audioManager } from '@/audio/AudioManager'
import { useAchievementStore } from '@/stores/achievementStore'
import { useGameStore } from '@/stores/gameStore'
import html2canvas from 'html2canvas'
import { ENDING } from '@/data/content'

const achievement = useAchievementStore()
const game = useGameStore()
const emit = defineEmits(['restart'])

const currentAct = ref(0)
const linesRevealed = ref(0)
const allLinesShown = ref(false)
const burstActive = ref(false)
const particlesReady = ref(false)
const timers = []

const activeBeat = computed(() => ENDING.beats[currentAct.value] || null)
const willScreen = computed(() => ENDING.willScreen)
const willLocationText = computed(() => {
  const location = game.today?.building?.cn || 'Corvo Bianco'
  return willScreen.value.gotGiftLine.replace('{{location}}', location)
})
const ownedWillItems = computed(() =>
  (game.ownedItems || []).filter(item => item?.emoji).slice(0, 12)
)
const totalLines = computed(() => activeBeat.value?.lines?.length || 0)
const shownLines = computed(
  () => activeBeat.value?.lines?.slice(0, linesRevealed.value) || []
)

const advanceLabel = computed(() => {
  const labels = ['走进生日夜', '点亮蜡烛', '留下祝福']
  return labels[currentAct.value] || '继续'
})

// Stars
const stars = Array.from({ length: 50 }, (_, i) => ({
  id: `s${i}`,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1.5 + Math.random() * 2.5,
  dur: 2 + Math.random() * 3.5,
  delay: Math.random() * 4
}))

// Per-act particle factories
const actParticles = {
  0: () =>
    Array.from({ length: 20 }, (_, i) => ({
      id: `p0-${i}`,
      glyph: ['🪻', '🌸', '🌙', '✨'][i % 4],
      x: 5 + Math.random() * 90,
      size: 14 + Math.random() * 16,
      dur: 5 + Math.random() * 4,
      delay: Math.random() * 2.5,
      dx: (Math.random() - 0.5) * 100,
      rot: Math.random() * 360
    })),
  1: () =>
    Array.from({ length: 28 }, (_, i) => ({
      id: `p1-${i}`,
      glyph: ['🕯️', '✨', '🌟', '💫'][i % 4],
      x: 10 + Math.random() * 80,
      size: 12 + Math.random() * 14,
      dur: 4.5 + Math.random() * 3.5,
      delay: Math.random() * 2,
      dx: (Math.random() - 0.5) * 80,
      rot: Math.random() * 360
    })),
  2: () =>
    Array.from({ length: 36 }, (_, i) => ({
      id: `p2-${i}`,
      glyph: ['✨', '🌟', '💛', '💫', '⭐'][i % 5],
      x: 5 + Math.random() * 90,
      size: 14 + Math.random() * 18,
      dur: 4 + Math.random() * 3,
      delay: Math.random() * 1.5,
      dx: (Math.random() - 0.5) * 120,
      rot: Math.random() * 360
    })),
  3: () =>
    Array.from({ length: 44 }, (_, i) => ({
      id: `p3-${i}`,
      glyph: ['💛', '✨', '🌟', '🪻', '🕯️', '💫', '⭐', '🌸'][i % 8],
      x: 3 + Math.random() * 94,
      size: 14 + Math.random() * 20,
      dur: 3.5 + Math.random() * 3,
      delay: Math.random() * 1.2,
      dx: (Math.random() - 0.5) * 140,
      rot: Math.random() * 360
    }))
}

const currentParticles = computed(() =>
  (actParticles[currentAct.value] || actParticles[0])()
)

onMounted(() => {
  audioManager.playSFX('scenetransition', { vol: 0.3 })
  timers.push(
    setTimeout(() => {
      particlesReady.value = true
    }, 300)
  )
})

onBeforeUnmount(() => {
  for (const t of timers) clearTimeout(t)
})

function onStageClick() {
  if (currentAct.value === 3) return
  if (allLinesShown.value) return
  revealNextLine()
}

function revealNextLine() {
  if (linesRevealed.value >= totalLines.value) return
  linesRevealed.value++
  if (currentAct.value === 2) {
    burstActive.value = true
    timers.push(
      setTimeout(() => {
        burstActive.value = false
      }, 800)
    )
  }
  if (linesRevealed.value >= totalLines.value) {
    allLinesShown.value = true
  }
}

function onAdvance() {
  if (!allLinesShown.value) return
  audioManager.playSFX('pageflip', { vol: 0.4 })
  audioManager.playSFX('scenetransition', { vol: 0.3 })
  currentAct.value++
  linesRevealed.value = 0
  allLinesShown.value = false
  burstActive.value = false
  if (currentAct.value === 3) {
    allLinesShown.value = true
    achievement.track('endingSeen', { day: 9 })
  }
}

// ── Screenshot: custom HTML poster ──

function buildPosterHTML() {
  const ws = willScreen.value
  const items = ownedWillItems.value
  const location = willLocationText.value
  const itemIcons = items
    .map(i => `<span class="pi">${i.emoji}</span>`)
    .join('')
  const base = window.location.origin

  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#e8dfd2;font-family:Nunito,'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif}
.poster{width:700px;min-height:900px;background:linear-gradient(175deg,#fefaf3 0%,#f7f3df 18%,#faf6ec 50%,#f5efde 82%,#fefaf3 100%);border-radius:22px;box-shadow:0 8px 32px rgba(61,52,40,.14),0 3px 10px rgba(61,52,40,.08),inset 0 1px 0 rgba(255,252,245,.5);padding:48px 44px 40px;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative;overflow:hidden}
.poster::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.03;background:repeating-linear-gradient(180deg,transparent 0,transparent 3px,rgba(160,140,110,.25) 3px,rgba(160,140,110,.25) 4px);border-radius:22px}
.corner{position:absolute;font-size:22px;opacity:.3;color:#8b7355}.c-tl{top:18px;left:22px}.c-tr{top:18px;right:22px}.c-bl{bottom:18px;left:22px}.c-br{bottom:18px;right:22px}
.ornament{width:65%;height:2px;background:linear-gradient(90deg,transparent,rgba(180,150,110,.35) 20%,rgba(180,150,110,.35) 80%,transparent);margin-bottom:22px}
/* header */
.header{font-size:17px;color:#8a7260;font-weight:700;letter-spacing:.12em;margin-bottom:4px}
.title{font-size:38px;color:#4a2e18;font-weight:900;letter-spacing:.1em;margin-bottom:10px;text-shadow:0 1px 2px rgba(150,115,60,.08)}
.deco-row{display:flex;gap:14px;justify-content:center;margin-bottom:12px;font-size:26px}
.sub{font-size:15px;color:#7a5a3a;font-weight:600;letter-spacing:.06em;line-height:1.9}
/* divider - Animal Island wave */
.svg-divider{width:100%;height:14px;margin:18px 0;background:url("data:image/svg+xml,%3Csvg width='297' height='14' viewBox='0 0 297 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 10.42L33 11 28.002 0zM10 6.97L0 3l.858 9zM43 1l.613 11L53 5.585zm89 13l11-5.867L133.507 1zm67-3.58l13 .58-4.998-11zm-10-3.45L179 3l.858 9zM90.634 1L88 13l12-4.39zM155 13l12-2.4-8.47-9.6zM110 3l2.057 9L118 6.292zm-47 8.215L76 14 71.048 1zM222 1l.613 11L232 5.585zm47.634 0L267 13l12-4.39zM289 3l2.057 9L297 6.292zm-48 8.215L254 14l-4.952-13z' fill='%23D8D0C3' fill-rule='evenodd'/%3E%3C/svg%3E") center/contain no-repeat}
/* gift */
.gift-stage{display:flex;flex-direction:column;align-items:center;margin:6px 0;gap:8px}
.gift-box{width:210px;height:210px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2.5px solid rgba(180,155,120,.3);border-radius:20px;background:radial-gradient(ellipse at 50% 35%,rgba(255,248,235,.75),rgba(232,218,192,.35));box-shadow:inset 0 0 26px rgba(200,170,130,.22),0 3px 12px rgba(107,92,67,.1);position:relative}
.gift-glow{position:absolute;width:130px;height:130px;border-radius:50%;background:radial-gradient(circle,rgba(220,185,130,.15),transparent 70%);pointer-events:none}
.gift-piggy{width:44px;height:44px;border-radius:50%;border:2.5px solid #f5c31c;object-fit:cover;background:#f0e8d8;position:relative;z-index:1;margin-bottom:2px}
.gift-receipt{width:120px;height:auto;object-fit:contain;position:relative;z-index:1}
.gift-hint{font-size:12px;color:#a09078;font-weight:600;letter-spacing:.06em;margin-top:5px;position:relative;z-index:1}
.gift-label{font-size:14px;color:#8a6b44;font-weight:700;letter-spacing:.08em}
/* pig */
.pig-stage{display:flex;flex-direction:column;align-items:center;gap:4px;margin:4px 0}
.pig-icon{font-size:42px;line-height:1;margin-bottom:4px}
.pig-line{font-size:15px;color:#5a3e22;font-weight:500;letter-spacing:.04em}.pig-line-em{font-weight:700;font-size:17px;color:#3a2210}.pig-line-sub{font-size:14px;color:#8a7260;font-style:italic}
/* items */
.items-section{display:flex;flex-direction:column;align-items:center;gap:8px;margin:4px 0}
.items-label{font-size:14px;color:#7a5a3a;font-weight:700;letter-spacing:.08em}
.items-grid{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:440px}
.pi{display:flex;align-items:center;justify-content:center;width:44px;height:44px;font-size:24px;border:1.5px solid rgba(180,155,120,.3);border-radius:12px;background:rgba(245,235,215,.5);box-shadow:inset 0 0 6px rgba(180,155,120,.12)}
.items-tag{font-size:13px;color:#8b6a4a;font-weight:600;letter-spacing:.06em}
/* closing */
.estate{font-size:14px;color:#8a7260;font-weight:600;letter-spacing:.06em;font-style:italic;margin-bottom:8px}
.farewell{font-size:28px;color:#3a2210;font-weight:800;letter-spacing:.08em;margin-bottom:6px}
.xoxo{font-size:17px;letter-spacing:.28em;font-weight:800;color:#5a3e1a;margin-bottom:6px}
.closing-icons{display:flex;gap:12px;justify-content:center;font-size:24px;filter:drop-shadow(0 1px 2px rgba(100,80,55,.08))}
.ornament-bottom{margin-top:20px}
</style></head><body><div class="poster">
<span class="corner c-tl">✦</span><span class="corner c-tr">✧</span><span class="corner c-bl">○</span><span class="corner c-br">🎂</span>
<div class="ornament"></div>
<p class="header">${ws.headerLine}</p>
<p class="title">${ws.titleLine}</p>
<div class="deco-row"><span>🎂</span><span>🎉</span><span>🎈</span></div>
<p class="sub">${ws.clearedLine}<br>${location}</p>
<div class="svg-divider"></div>
<div class="gift-stage"><div class="gift-box"><div class="gift-glow"></div><img class="gift-piggy" src="${base}/img/animal_icon2.png" /><img class="gift-receipt" src="${base}/img/nook-receipt.png" /><span class="gift-hint">${ws.giftHint}</span></div><p class="gift-label">↑ 报酬收据狸 ↑</p></div>
<div class="svg-divider"></div>
<div class="pig-stage"><span class="pig-icon">🐷</span><p class="pig-line pig-line-em">${ws.pigCompanionLine2}</p><p class="pig-line">${ws.pigCompanionLine1}</p><p class="pig-line pig-line-sub">${ws.pigCompanionLine3}</p></div>
<div class="svg-divider"></div>
<div class="items-section"><p class="items-label">${ws.itemsArrow}</p><div class="items-grid">${itemIcons}</div><p class="items-tag">${ws.itemsLabel}</p></div>
<div class="svg-divider"></div>
<p class="estate">🪻 ${ws.estateLine}</p>
<p class="farewell">${ws.farewellLine}</p>
<p class="xoxo">${ws.goodbyeLine}</p>
<div class="closing-icons"><span>🗝️</span><span>💗</span><span>🏠</span></div>
<div class="ornament ornament-bottom"></div>
</div></body></html>`
}

async function onScreenshotWill() {
  try {
    const html = buildPosterHTML()
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;'
    container.innerHTML = html
    document.body.appendChild(container)

    await new Promise(r => setTimeout(r, 300))

    const posterDiv = container.querySelector('.poster')
    if (!posterDiv) throw new Error('Poster element not found')

    const canvas = await html2canvas(posterDiv, {
      backgroundColor: '#e8dfd2',
      scale: 2,
      useCORS: true,
      logging: false
    })

    document.body.removeChild(container)

    const link = document.createElement('a')
    link.download = 'Corvo-Bianco-生日海报.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (e) {
    console.warn('Screenshot failed:', e)
  }
}

function onRestart() {
  audioManager.playSFX('pageflip', { vol: 0.4 })
  emit('restart')
}
</script>

<style scoped>
.ending {
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(184, 164, 136, 0.28);
  backdrop-filter: blur(4px);
}

/* ── Backgrounds ── */
.bg-base {
  position: absolute;
  inset: 0;
  transition: background 1.4s var(--ease-out-expo);
}

.act-0 .bg-base {
  background:
    radial-gradient(
      ellipse at 20% 80%,
      rgba(168, 148, 192, 0.16),
      transparent 55%
    ),
    radial-gradient(
      ellipse at 80% 20%,
      rgba(218, 200, 232, 0.12),
      transparent 50%
    ),
    linear-gradient(180deg, #f7f3ea 0%, #f0e8f0 40%, #e8dfea 100%);
}
.act-1 .bg-base {
  background:
    radial-gradient(
      ellipse at 40% 70%,
      rgba(220, 170, 120, 0.14),
      transparent 55%
    ),
    radial-gradient(
      ellipse at 70% 25%,
      rgba(240, 200, 140, 0.12),
      transparent 50%
    ),
    linear-gradient(180deg, #f7f3e8 0%, #f2ebe2 40%, #ece2d4 100%);
}
.act-2 .bg-base {
  background:
    radial-gradient(
      ellipse at 50% 60%,
      rgba(224, 190, 120, 0.18),
      transparent 55%
    ),
    radial-gradient(
      ellipse at 30% 30%,
      rgba(240, 210, 140, 0.14),
      transparent 50%
    ),
    linear-gradient(180deg, #f8f4e6 0%, #f3eddc 40%, #ede4d0 100%);
}
.act-3 .bg-base {
  background:
    radial-gradient(
      ellipse at 30% 50%,
      rgba(180, 150, 120, 0.1),
      transparent 55%
    ),
    radial-gradient(
      ellipse at 70% 40%,
      rgba(200, 170, 130, 0.08),
      transparent 50%
    ),
    radial-gradient(
      ellipse at 50% 80%,
      rgba(190, 160, 140, 0.06),
      transparent 50%
    ),
    linear-gradient(180deg, #f8f5ee 0%, #f2ece0 40%, #e8dfd2 100%);
}

.bg-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: background 1.4s var(--ease-out-expo);
}

.glow-0 {
  background:
    radial-gradient(
      ellipse at 50% 35%,
      rgba(168, 148, 200, 0.14),
      transparent 50%
    ),
    radial-gradient(
      circle at 35% 65%,
      rgba(180, 160, 210, 0.08),
      transparent 40%
    );
}
.glow-1 {
  background:
    radial-gradient(
      ellipse at 50% 40%,
      rgba(210, 160, 110, 0.16),
      transparent 50%
    ),
    radial-gradient(
      circle at 65% 55%,
      rgba(200, 140, 80, 0.08),
      transparent 40%
    );
}
.glow-2 {
  background:
    radial-gradient(
      ellipse at 50% 35%,
      rgba(220, 185, 110, 0.2),
      transparent 50%
    ),
    radial-gradient(circle at 45% 60%, rgba(200, 165, 90, 0.1), transparent 40%);
}
.glow-3 {
  background:
    radial-gradient(
      ellipse at 50% 35%,
      rgba(180, 155, 110, 0.08),
      transparent 50%
    ),
    radial-gradient(
      ellipse at 40% 65%,
      rgba(190, 160, 120, 0.05),
      transparent 55%
    );
}

/* ── Starfield ── */
.starfield {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}
.starfield.intense .star {
  animation-duration: 1.6s !important;
}

.star {
  position: absolute;
  border-radius: 50%;
  background: rgba(200, 170, 120, 0.55);
  box-shadow: 0 0 3px 1px rgba(180, 150, 100, 0.18);
  animation: star-twinkle var(--ease-in-out-sine) infinite;
}

@keyframes star-twinkle {
  0%,
  100% {
    opacity: 0.15;
    transform: scale(0.5);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.2);
  }
}

/* ── Particles ── */
.particle-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 2;
}

.particle {
  position: absolute;
  bottom: -30px;
  opacity: 0;
  animation: p-rise var(--ease-in-out-sine) infinite;
}

@keyframes p-rise {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.5) rotate(0deg);
  }
  12% {
    opacity: 0.85;
    transform: translate(calc(var(--dx) * 0.15), -15vh) scale(0.8)
      rotate(calc(var(--rot) * 0.2));
  }
  50% {
    opacity: 0.55;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), -110vh) scale(0.7) rotate(var(--rot));
  }
}

.particles-0 .particle {
  filter: drop-shadow(0 1px 3px rgba(140, 120, 170, 0.22));
}
.particles-1 .particle {
  filter: drop-shadow(0 1px 3px rgba(180, 130, 80, 0.25));
}
.particles-2 .particle {
  filter: drop-shadow(0 1px 3px rgba(200, 160, 90, 0.3));
}
.particles-3 .particle {
  filter: drop-shadow(0 2px 4px rgba(180, 150, 110, 0.22));
}

/* ── Burst ring ── */
.burst-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 3;
}

.burst-2 {
  border: 2px solid rgba(200, 160, 90, 0.45);
  box-shadow: 0 0 40px rgba(220, 180, 110, 0.18);
  animation: burst-expand 800ms var(--ease-out-expo) forwards;
}

@keyframes burst-expand {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 800px;
    height: 800px;
    opacity: 0;
  }
}

/* ── Stage layout ── */
.stage {
  position: relative;
  z-index: 10;
  width: min(680px, 88vw);
}

.stage-card {
  clip-path: url(#animal-modal-clip);
  background: var(--glass-bg);
  box-shadow: var(--card-shadow);
  padding: 44px 36px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: card-enter 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms both;
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.94);
  }
  60% {
    opacity: 1;
    transform: translateY(-4px) scale(1.02);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Act 3 card: scrollable, full content */
.card-act-3 {
  background: var(--animal-card-bg);
  box-shadow:
    var(--animal-shadow-lg),
    inset 0 1px 0 rgba(255, 252, 245, 0.45);
  max-height: 75vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 28px 24px;
  scrollbar-width: thin;
  scrollbar-color: rgba(160, 140, 110, 0.22) transparent;
}

.card-act-3::-webkit-scrollbar {
  width: 5px;
}
.card-act-3::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}
.card-act-3::-webkit-scrollbar-thumb {
  background: rgba(160, 140, 110, 0.22);
  border-radius: 3px;
}
.card-act-3::-webkit-scrollbar-thumb:hover {
  background: rgba(150, 125, 90, 0.35);
}

.act-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* ── Act decoration ── */
.act-decoration {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
}

.deco-icon {
  font-size: 36px;
  line-height: 1;
  animation: deco-float 3s ease-in-out infinite;
  filter: drop-shadow(0 1px 3px rgba(114, 93, 66, 0.14));
}

@keyframes deco-float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-6px) rotate(3deg);
  }
}

/* ── Title ── */
.act-title {
  margin: 0 0 26px;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-shadow: 0 1px 2px rgba(114, 93, 66, 0.12);
  animation: title-enter 700ms var(--ease-out-expo) forwards;
}

.title-0 {
  font-size: 28px;
  color: #7b6694;
}
.title-1 {
  font-size: 30px;
  color: #8b5a3c;
}
.title-2 {
  font-size: 34px;
  color: #8b6d34;
  letter-spacing: 0.12em;
}

@keyframes title-enter {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ── Lines ── */
.lines {
  display: grid;
  gap: 14px;
  margin-bottom: 8px;
  width: 100%;
}

.line {
  margin: 0;
  line-height: 1.85;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  animation: line-enter 500ms var(--ease-out-expo) forwards;
}

.line-0 {
  font-size: 16px;
  color: #6b5a7a;
}
.line-1 {
  font-size: 17px;
  color: #7a5436;
}
.line-2 {
  font-size: 19px;
  color: #7a5c30;
  font-weight: 600;
}
.line-wish {
  font-size: 21px !important;
  text-shadow: 0 1px 2px rgba(140, 110, 60, 0.12);
}

@keyframes line-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Candle ceremony ── */
.candle-ceremony {
  width: 100%;
  margin: 12px 0 6px;
}

.candle-row {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.candle-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.6s var(--ease-out-expo);
}

.candle-flame {
  font-size: 26px;
  line-height: 1;
  transition: all 0.5s var(--ease-out-expo);
  filter: drop-shadow(0 1px 2px rgba(114, 93, 66, 0.1));
}

.candle-unit.lit .candle-flame {
  font-size: 28px;
  filter: drop-shadow(0 0 8px rgba(240, 180, 80, 0.55))
    drop-shadow(0 1px 2px rgba(180, 130, 60, 0.2));
  animation: candle-flicker 2s ease-in-out infinite;
}

@keyframes candle-flicker {
  0%,
  100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.08) rotate(-2deg);
  }
  75% {
    transform: scale(1.05) rotate(2deg);
  }
}

.candle-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--ink-soft);
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  transition: color 0.5s var(--ease-out-expo);
}

.candle-unit.lit .candle-label {
  color: #8b6914;
}

.candle-lines {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(140, 110, 60, 0.15);
  display: grid;
  gap: 10px;
  width: 100%;
  animation: fade-up 500ms var(--ease-out-expo) forwards;
}

.candle-line {
  margin: 0;
  font-size: 14px;
  font-style: italic;
  color: #8a7b66;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.candle-marker {
  margin-right: 6px;
  font-style: normal;
  filter: drop-shadow(0 0 4px rgba(240, 180, 80, 0.3));
}

/* ── Continue button ── */
.continue-btn {
  margin-top: 32px;
  padding: 12px 36px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.08em;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  cursor: pointer;
  border: none;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: btn-enter 500ms var(--ease-out-expo) 200ms both;
  box-shadow: 0 5px #bdaea0;
  transform: translateY(0);
}
.continue-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.04);
}
.continue-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px #bdaea0;
}

.btn-act-0 {
  background: linear-gradient(180deg, #f0e8f6 0%, #ddd0ea 100%);
  color: #6b5a7a;
  border: 1px solid rgba(140, 120, 170, 0.25);
}
.btn-act-1 {
  background: linear-gradient(180deg, #faf0e0 0%, #f0dcc0 100%);
  color: #7a5030;
  border: 1px solid rgba(180, 130, 80, 0.3);
}
.btn-act-2 {
  background: linear-gradient(180deg, #fef4d8 0%, #f5e0a8 100%);
  color: #6b4e20;
  border: 1px solid rgba(180, 140, 70, 0.3);
}

@keyframes btn-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ═══════════════════════════════════════════════════════ *
 *  Act 3: Animal Island Birthday Poster
 * ═══════════════════════════════════════════════════════ */

.will-poster {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  animation: poster-fade-in 600ms var(--ease-out-expo) forwards;
  position: relative;
}

@keyframes poster-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Sections ── */
.will-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  position: relative;
}

/* ── Sparkle decorations ── */
.will-sparkle {
  position: absolute;
  font-size: 18px;
  opacity: 0.3;
  color: #8b7355;
  pointer-events: none;
  animation: will-sparkle-float 4s ease-in-out infinite;
}
.will-sparkle-l {
  top: -2px;
  left: 6px;
  animation-delay: 0s;
}
.will-sparkle-r {
  top: -2px;
  right: 6px;
  animation-delay: 1.5s;
}
.will-sparkle-bl {
  bottom: -12px;
  left: 6px;
  animation-delay: 0.8s;
}

@keyframes will-sparkle-float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-6px) rotate(15deg);
    opacity: 0.55;
  }
}

/* ── Header ── */
.will-header {
  padding-bottom: 4px;
}

.will-header-text {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--ink-soft);
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.will-title-text {
  margin: 4px 0 8px;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: var(--ink);
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  text-shadow: 0 1px 2px rgba(150, 115, 60, 0.08);
}

.will-deco-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 6px;
}

.will-deco-emoji {
  font-size: 24px;
  line-height: 1;
  animation: will-deco-bounce 2.4s ease-in-out infinite;
}
.will-deco-emoji:nth-child(2) {
  animation-delay: 0.3s;
}
.will-deco-emoji:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes will-deco-bounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  30% {
    transform: translateY(-7px) scale(1.12);
  }
  60% {
    transform: translateY(0) scale(1);
  }
}

.will-sub-text {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.06em;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  color: #7a5a3a;
  line-height: 1.8;
}
.will-sub-loc {
  color: #8a6d50;
}

/* ── Animal Island SVG Divider ── */
.will-divider {
  width: 100%;
  height: 14px;
  margin: 14px 0;
  background: url("data:image/svg+xml,%3Csvg width='297' height='14' viewBox='0 0 297 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 10.42L33 11 28.002 0zM10 6.97L0 3l.858 9zM43 1l.613 11L53 5.585zm89 13l11-5.867L133.507 1zm67-3.58l13 .58-4.998-11zm-10-3.45L179 3l.858 9zM90.634 1L88 13l12-4.39zM155 13l12-2.4-8.47-9.6zM110 3l2.057 9L118 6.292zm-47 8.215L76 14 71.048 1zM222 1l.613 11L232 5.585zm47.634 0L267 13l12-4.39zM289 3l2.057 9L297 6.292zm-48 8.215L254 14l-4.952-13z' fill='%23D8D0C3' fill-rule='evenodd'/%3E%3C/svg%3E")
    center / contain no-repeat;
}

/* ── Gift Box ── */
.will-gift-section {
  padding: 4px 0;
}

.will-gift-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 190px;
  height: 190px;
  border: 2.5px solid rgba(180, 155, 120, 0.32);
  border-radius: 20px;
  background: radial-gradient(
    ellipse at 50% 35%,
    rgba(255, 248, 235, 0.7),
    rgba(235, 222, 195, 0.38)
  );
  box-shadow:
    inset 0 0 24px rgba(200, 170, 130, 0.24),
    0 3px 12px rgba(107, 92, 67, 0.12);
  position: relative;
  transition: box-shadow 3s ease-in-out;
  animation: gift-box-pulse 3.2s ease-in-out infinite;
}

@keyframes gift-box-pulse {
  0%,
  100% {
    box-shadow:
      inset 0 0 24px rgba(200, 170, 130, 0.24),
      0 3px 12px rgba(107, 92, 67, 0.12);
  }
  50% {
    box-shadow:
      inset 0 0 36px rgba(220, 185, 140, 0.38),
      0 3px 18px rgba(107, 92, 67, 0.18);
  }
}

.will-gift-glow {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(220, 185, 130, 0.14),
    transparent 70%
  );
  animation: gift-glow-breathe 2.8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes gift-glow-breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.35);
    opacity: 0.85;
  }
}

.will-gift-piggy {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2.5px solid #f5c31c;
  box-shadow: 0 2px 0 0 #dba90e;
  object-fit: cover;
  background: #f0e8d8;
  animation: gift-icon-float 3s ease-in-out infinite;
  position: relative;
  z-index: 1;
  margin-bottom: 2px;
}

.will-gift-receipt {
  width: 120px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(130, 105, 65, 0.2));
  position: relative;
  z-index: 1;
  animation: receipt-sway 3.6s ease-in-out infinite;
}

@keyframes receipt-sway {
  0%,
  100% {
    transform: rotate(-1deg) scale(1);
  }
  50% {
    transform: rotate(1deg) scale(1.03);
  }
}

.will-gift-icon {
  font-size: 68px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(130, 105, 65, 0.18));
  animation: gift-icon-float 3s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

@keyframes gift-icon-float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-6px) scale(1.05);
  }
}

.will-gift-hint {
  font-size: 12px;
  color: var(--ink-soft);
  font-weight: 600;
  letter-spacing: 0.06em;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  margin-top: 5px;
  position: relative;
  z-index: 1;
}

.will-gift-label {
  margin: 8px 0 0;
  font-size: 14px;
  color: #8a6b44;
  font-weight: 700;
  letter-spacing: 0.08em;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

/* ── Pig Companion ── */
.will-pig-section {
  padding: 4px 0;
  gap: 4px;
}

.will-pig-icon {
  font-size: 42px;
  line-height: 1;
  margin-bottom: 4px;
  animation: pig-bounce 3.2s ease-in-out infinite;
  filter: drop-shadow(0 2px 3px rgba(150, 120, 80, 0.1));
}

@keyframes pig-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.will-pig-line {
  margin: 0;
  font-size: 15px;
  color: #5a3e22;
  font-weight: 500;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  letter-spacing: 0.04em;
}
.will-pig-main {
  font-weight: 700 !important;
  font-size: 17px !important;
  color: #3a2210 !important;
}
.will-pig-sub-1 {
  color: #6b4d30;
}
.will-pig-sub-2 {
  font-size: 14px;
  color: #8a7260;
  font-style: italic;
}

/* ── Items Grid ── */
.will-items-section {
  padding: 4px 0;
  gap: 8px;
}

.will-items-label {
  margin: 0;
  font-size: 14px;
  color: #7a5a3a;
  font-weight: 700;
  letter-spacing: 0.08em;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.will-items-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 360px;
}

.will-item-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: 22px;
  border: 1.5px solid rgba(180, 155, 120, 0.32);
  border-radius: 12px;
  background: rgba(245, 235, 215, 0.5);
  box-shadow:
    inset 0 0 6px rgba(180, 155, 120, 0.12),
    0 1px 3px rgba(100, 80, 55, 0.05);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  animation: chip-pop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  cursor: default;
}

.will-item-chip:hover {
  transform: scale(1.18);
  box-shadow:
    inset 0 0 6px rgba(180, 155, 120, 0.12),
    0 2px 10px rgba(100, 80, 55, 0.14);
}

@keyframes chip-pop {
  from {
    opacity: 0;
    transform: scale(0.4);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.will-items-tag {
  margin: 0;
  font-size: 13px;
  color: #8b6a4a;
  font-weight: 600;
  letter-spacing: 0.06em;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

/* ── Closing ── */
.will-closing {
  padding: 4px 0;
  gap: 4px;
}

.will-estate {
  margin: 0;
  font-size: 14px;
  color: #8a7260;
  font-weight: 600;
  letter-spacing: 0.06em;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  font-style: italic;
}

.will-farewell {
  margin: 4px 0 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #3a2210;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.will-xoxo {
  margin: 4px 0 0;
  font-size: 16px;
  letter-spacing: 0.28em;
  font-weight: 800;
  color: #5a3e1a;
  font-family: 'Nunito', sans-serif;
}

.will-closing-icons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 6px;
  font-size: 22px;
  filter: drop-shadow(0 1px 2px rgba(100, 80, 55, 0.08));
}

/* ── Action Buttons (Animal Island primary style) ── */
.will-actions {
  display: flex;
  gap: 20px;
  width: 100%;
  justify-content: center;
  padding-top: 16px;
  flex-shrink: 0;
}

.will-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 11px 28px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.06em;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  cursor: pointer;
  border: none;
  outline: none;
  transition: all var(--animal-motion-duration-base) var(--animal-motion-ease);
  animation: btn-enter 500ms var(--ease-out-expo) 500ms both;
}

.will-btn:focus-visible {
  outline: 2px solid var(--animal-primary-color);
  outline-offset: 2px;
}

.will-btn-icon {
  font-size: 15px;
  line-height: 1;
}

/* Poster button — AI primary style */
.will-btn-poster {
  color: var(--animal-text-color);
  background: var(--animal-bg-color);
  border: var(--animal-border-width) solid var(--animal-border-color);
  box-shadow: var(--animal-btn-shadow);
  transform: translateY(0);
}
.will-btn-poster:hover {
  transform: translateY(-1px);
  box-shadow: var(--animal-btn-shadow-hover);
  border-color: var(--animal-border-color-hover);
}
.will-btn-poster:active {
  transform: translateY(2px);
  box-shadow: var(--animal-btn-shadow-active);
}

/* Restart button — warm gold */
.will-btn-restart {
  color: #5a3e1a;
  background: linear-gradient(180deg, #faf0e0 0%, #ecdbba 100%);
  border: var(--animal-border-width) solid rgba(180, 140, 70, 0.3);
  box-shadow: 0 4px #c4b8a8;
  transform: translateY(0);
}
.will-btn-restart:hover {
  transform: translateY(-1px);
  box-shadow:
    0 5px #c4b8a8,
    0 6px 18px rgba(200, 160, 80, 0.14);
}
.will-btn-restart:active {
  transform: translateY(2px);
  box-shadow: 0 1px #c4b8a8;
}
</style>
