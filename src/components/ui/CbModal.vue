<template>
  <Teleport to="body">
    <transition name="cb-modal">
      <div
        v-if="open"
        class="cb-modal-overlay"
        :class="{ 'cb-modal-mask-closable': maskClosable }"
        @click.self="onMaskClick"
      >
        <div
          class="cb-modal-card"
          :style="{ maxWidth: typeof width === 'number' ? width + 'px' : width }"
        >
          <!-- Title -->
          <div v-if="title || $slots.title" class="cb-modal-head">
            <slot name="title">
              <h3 class="cb-modal-title">{{ title }}</h3>
            </slot>
            <button
              v-if="showClose"
              class="cb-modal-close"
              @click="$emit('close')"
            >
              &times;
            </button>
          </div>

          <!-- Body -->
          <div class="cb-modal-body">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="footer !== null" class="cb-modal-foot">
            <slot name="footer">
              <button class="cb-modal-btn cb-modal-btn-cancel" @click="$emit('close')">
                {{ cancelText }}
              </button>
              <button class="cb-modal-btn cb-modal-btn-ok" @click="$emit('ok')">
                {{ okText }}
              </button>
            </slot>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
defineProps({
  open: { type: Boolean, required: true },
  title: { type: String, default: '' },
  width: { type: [Number, String], default: 520 },
  maskClosable: { type: Boolean, default: true },
  showClose: { type: Boolean, default: true },
  footer: { type: [Object, null], default: undefined },
  okText: { type: String, default: 'OK' },
  cancelText: { type: String, default: 'Cancel' },
});

defineEmits(['close', 'ok']);

function onMaskClick() {
  // maskClosable check handled by CSS pointer-events
}
</script>

<style scoped>
.cb-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(114, 93, 66, 0.45);
  backdrop-filter: blur(2px);
}

.cb-modal-card {
  clip-path: url(#animal-modal-clip);
  background: rgb(247, 243, 223);
  padding: 48px 48px 32px 48px;
  width: 90vw;
  position: relative;
  color: #725d42;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.cb-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.cb-modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #794f27;
  letter-spacing: 0.02em;
}

.cb-modal-close {
  width: 36px;
  height: 36px;
  border-radius: 50px;
  border: 2px solid #d4c9b4;
  background: rgb(247, 243, 223);
  color: #9f927d;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 0 0 #d4c9b4;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  line-height: 1;
}

.cb-modal-close:hover {
  box-shadow: 0 4px 0 0 #d4c9b4;
  transform: translateY(-1px);
  color: #725d42;
}

.cb-modal-close:active {
  box-shadow: 0 1px 0 0 #d4c9b4;
  transform: translateY(1px);
}

.cb-modal-body {
  font-size: 14px;
  line-height: 1.7;
  font-weight: 500;
  color: #725d42;
}

.cb-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cb-modal-btn {
  height: 45px;
  padding: 0 24px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.cb-modal-btn-cancel {
  background: rgb(247, 243, 223);
  color: #9f927d;
  border-color: #d4c9b4;
  box-shadow: 0 5px 0 0 #bdaea0;
}

.cb-modal-btn-cancel:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 0 0 #bdaea0;
  color: #725d42;
}

.cb-modal-btn-cancel:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #bdaea0;
}

.cb-modal-btn-ok {
  background: #ffcc00;
  color: #725d42;
  border-color: #e0b800;
  box-shadow: 0 5px 0 0 #c9a800;
}

.cb-modal-btn-ok:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 0 0 #c9a800;
  background: #ffd633;
}

.cb-modal-btn-ok:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #c9a800;
}

/* Transition */
.cb-modal-enter-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.cb-modal-enter-active .cb-modal-card {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s;
}
.cb-modal-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.cb-modal-leave-active .cb-modal-card {
  transition: transform 0.2s, opacity 0.2s;
}

.cb-modal-enter-from {
  opacity: 0;
}
.cb-modal-enter-from .cb-modal-card {
  opacity: 0;
  transform: scale(0.92) translateY(12px);
}
.cb-modal-leave-to {
  opacity: 0;
}
.cb-modal-leave-to .cb-modal-card {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

/* Mask closable */
.cb-modal-overlay:not(.cb-modal-mask-closable) {
  cursor: default;
}
</style>
