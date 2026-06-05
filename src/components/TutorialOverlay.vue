<template>
  <div class="tutorial-overlay" @click="onAdvance">
    <div class="tutorial-card">
      <div class="card-header">
        <div class="portrait-wrap">
          <div class="dual-portrait">
            <img :src="icon1" class="portrait-img timmy" alt="豆狸" />
            <img :src="icon2" class="portrait-img tommy" alt="粒狸" />
          </div>
          <span class="name-badge">豆狸 & 粒狸</span>
        </div>

        <div class="leaf-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C10 7 5 9 2 12c3 3 8 5 10 10 2-5 7-7 10-10-3-3-8-5-10-10z" fill="#50B9AB" opacity="0.25"/>
            <path d="M12 5C10.5 9 7 10.5 5.5 12 7 13.5 10.5 15 12 19c1.5-4 5-5.5 6.5-7C17 10.5 13.5 9 12 5z" fill="#19c8b9" opacity="0.45"/>
            <path d="M12 8c-1 3-3.5 4-4.5 5.5C8.5 15 11 16 12 19c1-3 3.5-4 4.5-5.5C15 12 13 11 12 8z" fill="#f5c31c" opacity="0.5"/>
          </svg>
        </div>
      </div>

      <div class="dialog-area">
        <transition name="segment" mode="out-in">
          <p class="dialog-text" :key="segmentIndex">
            {{ display }}<span v-if="!done" class="cursor">▍</span>
          </p>
        </transition>
      </div>

      <div class="card-footer">
        <div class="progress-dots">
          <span
            v-for="(_, i) in dialogues"
            :key="i"
            class="dot"
            :class="{ active: i === segmentIndex, done: i < segmentIndex }"
          />
        </div>

        <div class="footer-action">
          <button
            v-if="isLast && done"
            class="btn-start"
            @click.stop="onFinish"
          >
            开始冒险
          </button>
          <span v-else-if="done" class="advance-hint">
            点击继续
            <svg class="arrow-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2l4 4-4 4" stroke="#9f927d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <button v-else class="btn-skip" @click.stop="onSkip">跳过</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { useTypewriter } from '@/composables/useTypewriter'
import { TUTORIAL_DIALOGUES } from '@/data/tutorial'
import { audioManager } from '@/audio/AudioManager'
import { img } from '@/utils/assets'

const emit = defineEmits(['done'])
const icon1 = img('img/animal_icon.png')
const icon2 = img('img/animal_icon2.png')

const dialogues = TUTORIAL_DIALOGUES
const segmentIndex = ref(0)

const currentText = computed(() => dialogues[segmentIndex.value]?.text || '')
const isLast = computed(() => segmentIndex.value >= dialogues.length - 1)

const { display, done, skip } = useTypewriter(currentText, {
  speed: 38,
  onChar: (char) => {
    if (char === ' ' || char === '\n') {
      audioManager.playSFX('typewriter_space', { vol: 0.15 })
    } else {
      audioManager.playSFX('typewriter_key', { vol: 0.2 })
    }
  }
})

onMounted(() => {
  audioManager.playSFX('tutorialstep', { vol: 0.35 })
})

onBeforeUnmount(() => {
  audioManager.playSFX('dialogclose', { vol: 0.25 })
})

function onAdvance() {
  if (!done.value) {
    audioManager.playSFX('pageflip', { vol: 0.4 })
    skip()
  } else if (!isLast.value) {
    audioManager.playSFX('pageflip', { vol: 0.4 })
    segmentIndex.value++
  }
}

function onSkip() {
  audioManager.playSFX('pageflip', { vol: 0.4 })
  skip()
}

function onFinish() {
  audioManager.playSFX('tutorialstep', { vol: 0.35 })
  emit('done')
}
</script>

<style scoped>
.tutorial-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at 30% 30%, rgba(25, 200, 185, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 70% 20%, rgba(247, 205, 103, 0.1) 0%, transparent 35%),
    linear-gradient(180deg, #f8f8f0 0%, #f7f3df 50%, #e8dfc8 100%);
  animation: overlay-in 500ms ease-out forwards;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.tutorial-card {
  clip-path: url(#animal-modal-clip);
  width: min(560px, 90vw);
  min-height: 320px;
  padding: 32px 40px 44px;
  background:
    var(--overlay-card-tutorial) bottom center/100% 48px no-repeat,
    rgb(247, 243, 223);
  display: flex;
  flex-direction: column;
  box-shadow:
    0 4px 10px rgba(107, 92, 67, 0.42),
    0 0 0 1px rgba(255, 242, 214, 0.15);
  animation: card-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(16px) scale(0.92); }
  60%  { opacity: 1; transform: translateY(-4px) scale(1.02); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.portrait-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dual-portrait {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  width: 60px;
  height: 52px;
}

.portrait-img {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2.5px solid #19c8b9;
  box-shadow: 0 2px 0 0 #50B9AB;
  object-fit: cover;
  background: #f0e8d8;
  position: absolute;
}

.portrait-img.timmy {
  left: 0;
  bottom: 0;
  z-index: 2;
}

.portrait-img.tommy {
  right: 0;
  top: 0;
  z-index: 1;
  border-color: #f5c31c;
  box-shadow: 0 2px 0 0 #dba90e;
}

.name-badge {
  display: inline-block;
  padding: 4px 14px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  background: #19c8b9;
  border-radius: 50px;
  box-shadow: 0 2px 0 0 #50B9AB;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.leaf-icon {
  flex-shrink: 0;
  animation: leaf-spin 6s linear infinite;
}

@keyframes leaf-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.dialog-area {
  flex: 1;
  min-height: 100px;
  display: flex;
  align-items: flex-start;
  padding: 16px 20px;
  margin: 0 0 8px;
  background: rgba(248, 248, 240, 0.7);
  border-radius: 14px;
  border: 2px solid #e8e2d6;
}

.dialog-text {
  margin: 0;
  font-size: 16px;
  line-height: 1.85;
  color: #725d42;
  white-space: pre-wrap;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  font-weight: 500;
}

.cursor {
  display: inline-block;
  margin-left: 2px;
  color: #19c8b9;
  animation: blink 700ms steps(1) infinite;
}

@keyframes blink { 50% { opacity: 0; } }

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  min-height: 36px;
}

.progress-dots {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d4c9b4;
  transition: all 300ms ease;
}

.dot.active {
  width: 10px;
  height: 10px;
  background: #19c8b9;
  box-shadow: 0 0 0 3px rgba(25, 200, 185, 0.25);
}

.dot.done {
  background: #50B9AB;
}

.footer-action {
  display: flex;
  align-items: center;
}

.advance-hint {
  font-size: 12px;
  font-weight: 600;
  color: #9f927d;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.85;
  transition: opacity 200ms ease;
}

.advance-hint:hover {
  opacity: 1;
}

.arrow-icon {
  animation: arrow-bounce 1.2s ease-in-out infinite;
}

@keyframes arrow-bounce {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}

.btn-skip {
  font-size: 12px;
  font-weight: 600;
  color: #9f927d;
  background: none;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  letter-spacing: 0.04em;
  border-radius: 50px;
  transition: all 200ms ease;
}

.btn-skip:hover {
  color: #725d42;
  background: rgba(159, 146, 125, 0.1);
}

.btn-start {
  height: 40px;
  padding: 0 28px;
  background: #19c8b9;
  color: #fff;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 2px solid #50B9AB;
  box-shadow: 0 4px 0 0 #50B9AB;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.btn-start:hover {
  background: #3dd4c6;
  transform: translateY(-1px);
  box-shadow: 0 5px 0 0 #50B9AB;
}

.btn-start:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #50B9AB;
}

.segment-enter-active,
.segment-leave-active {
  transition: all 240ms ease;
}

.segment-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.segment-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
