# Corvo Bianco — 恶魔房 & 宝箱房 完整布局设计

---

## 一、整体流程

```
DayEndOverlay 玩家点击"继续"
    ↓
黑屏过渡 0.8s
    ↓
[文字浮现] "门开了。"
    ↓
[左右两扇门缓缓显现]
    ↓
玩家 hover 预览道具
    ↓
玩家点击门
    ↓
[门打开动画]
    ↓
[内部光芒溢出]
    ↓
[1~2 个道具卡片展示]
    ↓
玩家点击道具
    ↓
[获得动画：道具飞向小猪]
    ↓
杰洛特反应文案（2秒）
    ↓
黑屏过渡
    ↓
进入下一天 Intro
```

---

## 二、宝箱房完整布局

### 2.1 外观 — 门

```
                    ╭──────────╮
                   ╱            ╲
                  ╱   宝箱房     ╲
                 ╱                ╲
                │     🎁 宝箱      │
                │                  │
                │    ┌──────┐      │
                │    │ 预览 │      │
                │    └──────┘      │
                │        🗝️        │
                ╰──────────╯
```

**门CSS：**

```css
.treasure-door {
  width: 160px;
  height: 240px;
  border-radius: 80px 80px 4px 4px; /* 拱形 */
  background: linear-gradient(180deg,
    #c9a84c 0%,
    #a08030 30%,
    #7a6020 60%,
    #5a4010 100%
  );
  border: 3px solid #d4af37;
  box-shadow:
    0 0 40px rgba(212, 175, 55, 0.3),
    inset 0 0 20px rgba(255, 215, 0, 0.1);
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 木纹 */
.treasure-door::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg,
    transparent 0px, transparent 14px,
    rgba(0,0,0,0.06) 14px, rgba(0,0,0,0.06) 16px
  );
  border-radius: inherit;
}

/* 门上方铭牌 */
.treasure-door .door-sign {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Cinzel', serif;
  font-size: 14px;
  color: #d4af37;
  letter-spacing: 2px;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
  z-index: 2;
}

/* 门把手 */
.treasure-door .door-knob {
  position: absolute;
  bottom: 50px;
  right: 25px;
  font-size: 22px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
  z-index: 2;
}

/* hover */
.treasure-door:hover {
  transform: scale(1.04);
  box-shadow:
    0 0 60px rgba(212, 175, 55, 0.5),
    inset 0 0 30px rgba(255, 215, 0, 0.15);
}

/* 金色光粒子（门缝溢出） */
.treasure-door .light-particles {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 20px;
  background: radial-gradient(ellipse, rgba(255,215,100,0.4), transparent);
  animation: lightPulse 2s ease-in-out infinite;
}

@keyframes lightPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
```

### 2.2 门打开后 — 内部

```
┌──────────────────────────────────────────┐
│                                          │
│         宝箱房                            │
│                                          │
│    温暖的金色光芒充满整个房间。            │
│                                          │
│         ╭──────────────╮                 │
│         │              │                 │
│         │   🎁         │  ← 木质宝箱    │
│         │   (发光)      │                 │
│         │              │                 │
│         ╰──────────────╯                 │
│                                          │
│    ┌──────────┐    ┌──────────┐         │
│    │ 道具1     │    │ 道具2     │         │
│    │ (如果2个) │    │          │         │
│    └──────────┘    └──────────┘         │
│                                          │
│    [点击道具拾取]                         │
│                                          │
└──────────────────────────────────────────┘
```

**宝箱CSS：**

```css
.treasure-room {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg,
    #2a2018 0%,
    #3d3220 50%,
    #2a2018 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

/* 宝箱 */
.treasure-chest {
  width: 120px;
  height: 90px;
  background: linear-gradient(180deg,
    #8b6914 0%,
    #c9a84c 30%,
    #a08030 70%,
    #5a4010 100%
  );
  border: 2px solid #d4af37;
  border-radius: 8px 8px 4px 4px;
  position: relative;
  box-shadow:
    0 4px 20px rgba(212, 175, 55, 0.3),
    inset 0 2px 10px rgba(255, 215, 0, 0.2);
  animation: chestGlow 3s ease-in-out infinite;
}

/* 宝箱盖子 */
.treasure-chest::before {
  content: '';
  position: absolute;
  top: -15px;
  left: -2px;
  right: -2px;
  height: 30px;
  background: linear-gradient(180deg,
    #c9a84c 0%,
    #a08030 100%
  );
  border: 2px solid #d4af37;
  border-radius: 8px 8px 0 0;
}

/* 锁 */
.treasure-chest::after {
  content: '🔒';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
}

@keyframes chestGlow {
  0%, 100% { box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3); }
  50% { box-shadow: 0 4px 40px rgba(212, 175, 55, 0.5); }
}

/* 背景金色粒子 */
.treasure-particles {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle 2px at 20% 30%, rgba(255,215,100,0.3), transparent),
    radial-gradient(circle 1.5px at 60% 20%, rgba(255,200,80,0.25), transparent),
    radial-gradient(circle 2px at 80% 70%, rgba(255,215,100,0.2), transparent),
    radial-gradient(circle 1px at 40% 80%, rgba(255,190,60,0.3), transparent);
  background-size: 200px 200px, 150px 150px, 180px 180px, 120px 120px;
  animation: particleFloat 15s linear infinite;
  pointer-events: none;
}

@keyframes particleFloat {
  to { transform: translateY(30px) translateX(10px); }
}
```

### 2.3 道具卡片

```css
.treasure-item-card {
  width: 180px;
  padding: 20px;
  background: linear-gradient(180deg, #2a2018, #1a1410);
  border: 2px solid #c9a84c;
  border-radius: 8px;
  text-align: center;
  position: relative;
  transition: all 0.25s ease;
  cursor: pointer;
}

.treasure-item-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 30px rgba(201, 168, 76, 0.3);
  border-color: #d4af37;
}

.treasure-item-card .emoji {
  font-size: 48px;
  margin-bottom: 8px;
  display: block;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
}

.treasure-item-card .cn-name {
  font-family: 'Cinzel', serif;
  font-size: 16px;
  color: #e8ddd0;
  letter-spacing: 2px;
}

.treasure-item-card .original-desc {
  font-size: 13px;
  color: #b8a070;
  font-style: italic;
  margin-top: 8px;
}

/* 质量星星 */
.treasure-item-card .stars {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 3px;
}
.treasure-item-card .stars .star {
  color: #555;
  font-size: 14px;
}
.treasure-item-card .stars .star.filled {
  color: #d4af37;
  text-shadow: 0 0 6px rgba(212, 175, 55, 0.5);
}
```

---

## 三、恶魔房完整布局

### 3.1 外观 — 门

```
                    ╭──────────╮
                   ╱            ╲
                  ╱    恶魔房     ╲
                 ╱   ✦ 倒五芒星    ╲
                │                  │
                │    (暗红预览)     │
                │                  │
                │        🔥        │
                ╰──────────╯
```

**门CSS：**

```css
.devil-door {
  width: 160px;
  height: 240px;
  border-radius: 80px 80px 4px 4px;
  background: linear-gradient(180deg,
    #2a1018 0%,
    #1a0a10 40%,
    #0d0508 100%
  );
  border: 3px solid #5a1a1a;
  box-shadow:
    0 0 40px rgba(180, 30, 30, 0.2),
    inset 0 0 20px rgba(255, 0, 0, 0.05);
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 裂纹 */
.devil-door::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(45deg, transparent 48%, rgba(120,20,20,0.3) 48%, rgba(120,20,20,0.3) 52%, transparent 52%),
    linear-gradient(-45deg, transparent 48%, rgba(80,10,10,0.2) 48%, rgba(80,10,10,0.2) 52%, transparent 52%);
  border-radius: inherit;
}

/* 倒五芒星 */
.devil-door .pentagram {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 50px;
  background: radial-gradient(circle, rgba(180,30,30,0.3), transparent 70%);
  clip-path: polygon(
    50% 100%, 20% 40%, 80% 40%,
    10% 75%, 90% 75%
  );
  opacity: 0.6;
}

/* 门底红光 */
.devil-door::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 30px;
  background: linear-gradient(0deg, rgba(180,30,30,0.4), transparent);
}

/* 门上方铭牌 */
.devil-door .door-sign {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Cinzel', serif;
  font-size: 14px;
  color: #cc4444;
  letter-spacing: 2px;
  text-shadow: 0 0 8px rgba(180, 30, 30, 0.5);
  z-index: 2;
}

/* hover */
.devil-door:hover {
  transform: scale(1.04);
  box-shadow:
    0 0 60px rgba(220, 50, 50, 0.4),
    inset 0 0 30px rgba(255, 0, 0, 0.1);
  border-color: #7a2222;
}

/* 红色暗光脉冲 */
.devil-door .dark-pulse {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 20px;
  background: radial-gradient(ellipse, rgba(180,30,30,0.5), transparent);
  animation: darkPulse 3s ease-in-out infinite;
}

@keyframes darkPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}
```

### 3.2 门打开后 — 内部

```
┌──────────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ← 暗角遮罩
│                                          │
│         恶魔房                            │
│                                          │
│    黑暗中有红色的光。                      │
│                                          │
│         ┌──────────────┐                 │
│         │  👿 恶魔雕像  │                 │
│         │  (暗红发光)   │                 │
│         └──────────────┘                 │
│                                          │
│    ┌──────────┐    ┌──────────┐         │
│    │ 道具1     │    │ 道具2     │         │
│    │ + 惩罚    │    │ + 惩罚    │         │
│    └──────────┘    └──────────┘         │
│                                          │
│    ⚠️ 选择后明天步数减少                   │
│                                          │
└──────────────────────────────────────────┘
```

**恶魔房CSS：**

```css
.devil-room {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg,
    #0d0505 0%,
    #1a0a0a 40%,
    #0d0505 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

/* 暗角遮罩 */
.devil-room::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%);
  pointer-events: none;
  z-index: 1;
}

/* 恶魔雕像/祭坛 */
.devil-altar {
  width: 100px;
  height: 120px;
  background: linear-gradient(180deg,
    #3a1010 0%,
    #1a0505 100%
  );
  border: 2px solid #5a1a1a;
  border-radius: 8px 8px 4px 4px;
  position: relative;
  box-shadow:
    0 0 30px rgba(180, 30, 30, 0.3),
    inset 0 0 15px rgba(255, 0, 0, 0.1);
  animation: altarPulse 4s ease-in-out infinite;
}

.devil-altar::before {
  content: '😈';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  filter: drop-shadow(0 0 10px rgba(180, 30, 30, 0.5));
}

@keyframes altarPulse {
  0%, 100% { box-shadow: 0 0 30px rgba(180, 30, 30, 0.3); }
  50% { box-shadow: 0 0 50px rgba(220, 50, 50, 0.5); }
}

/* 红色暗光粒子 */
.devil-particles {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle 1.5px at 25% 40%, rgba(180,30,30,0.4), transparent),
    radial-gradient(circle 2px at 70% 25%, rgba(150,20,20,0.3), transparent),
    radial-gradient(circle 1px at 50% 80%, rgba(200,40,40,0.35), transparent);
  background-size: 180px 180px, 140px 140px, 200px 200px;
  animation: devilParticleFloat 12s linear infinite;
  pointer-events: none;
}

@keyframes devilParticleFloat {
  to { transform: translateY(25px) translateX(-8px); }
}

/* 警告文字 */
.devil-warning {
  color: #cc4444;
  font-size: 13px;
  text-align: center;
  margin-top: 20px;
  font-style: italic;
  text-shadow: 0 0 8px rgba(180, 30, 30, 0.3);
}
```

### 3.3 恶魔房道具卡片

```css
.devil-item-card {
  width: 180px;
  padding: 20px;
  background: linear-gradient(180deg, #1a0808, #0d0404);
  border: 2px solid #5a1a1a;
  border-radius: 8px;
  text-align: center;
  position: relative;
  transition: all 0.25s ease;
  cursor: pointer;
}

.devil-item-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 30px rgba(180, 30, 30, 0.3);
  border-color: #7a2222;
}

.devil-item-card .emoji {
  font-size: 48px;
  margin-bottom: 8px;
  display: block;
  filter: drop-shadow(0 0 6px rgba(180, 30, 30, 0.3));
}

.devil-item-card .cn-name {
  font-family: 'Cinzel', serif;
  font-size: 16px;
  color: #cc8888;
  letter-spacing: 2px;
}

.devil-item-card .original-desc {
  font-size: 13px;
  color: #cc5555;
  font-style: italic;
  margin-top: 8px;
}

.devil-item-card .penalty {
  color: #cc3333;
  font-size: 12px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(120, 20, 20, 0.3);
}

/* 恶魔房星星 — 红色 */
.devil-item-card .stars .star.filled {
  color: #cc3333;
  text-shadow: 0 0 6px rgba(204, 51, 51, 0.5);
}
```

---

## 四、对比一览

| 元素 | 宝箱房 | 恶魔房 |
|------|--------|--------|
| **主色调** | 金色 #c9a84c | 暗红 #5a1a1a |
| **背景渐变** | 暖棕 #2a2018 → #3d3220 | 近黑 #0d0505 → #1a0a0a |
| **门边框** | #d4af37 金色 | #5a1a1a 暗红 |
| **门发光** | 金色 pulse | 红色 pulse |
| **背景粒子** | 金色光点 | 红色暗点 |
| **道具卡片边框** | #c9a84c 金色 | #5a1a1a 暗红 |
| **道具卡片hover** | 金色shadow | 红色shadow |
| **名字颜色** | #e8ddd0 白 | #cc8888 淡红 |
| **描述颜色** | #b8a070 金色 | #cc5555 红色 |
| **星星颜色** | #d4af37 金星 | #cc3333 红星 |
| **内部物体** | 🎁 宝箱 | 😈 恶魔祭坛 |
| **惩罚文字** | 无 | 红色警告 |
| **整体氛围** | 温暖、礼物、安全 | 黑暗、危险、强大 |

---

## 五、门打开动画

```css
/* 通用门打开 */
.door-opening {
  transform-origin: left center;
  animation: doorOpen 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}

@keyframes doorOpen {
  0% { 
    transform: perspective(600px) rotateY(0deg);
    opacity: 1;
  }
  100% { 
    transform: perspective(600px) rotateY(-80deg);
    opacity: 0.2;
  }
}

/* 光效爆发 */
.light-burst {
  position: absolute;
  inset: -50%;
  opacity: 0;
  animation: burstIn 0.8s ease-out forwards;
}

.treasure-burst {
  background: radial-gradient(ellipse at center,
    rgba(255, 215, 100, 0.6) 0%,
    rgba(255, 180, 60, 0.2) 50%,
    transparent 70%
  );
}

.devil-burst {
  background: radial-gradient(ellipse at center,
    rgba(220, 50, 50, 0.5) 0%,
    rgba(150, 20, 20, 0.15) 50%,
    transparent 70%
  );
}

@keyframes burstIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.3); }
  100% { opacity: 0.9; transform: scale(1); }
}
```

---

## 六、Vue 组件结构

```vue
<!-- RewardRoomOverlay.vue -->
<template>
  <div class="room-overlay" :class="roomType">
    <!-- 阶段1：选择门 -->
    <div v-if="phase === 'choose'" class="door-selection">
      <p class="intro-text">门开了。</p>
      <div class="doors">
        <div class="door-wrapper" @click="enterRoom('treasure')">
          <div class="door treasure-door">
            <span class="door-sign">宝箱房</span>
            <span class="door-knob">🗝️</span>
            <div class="light-particles"></div>
          </div>
          <p class="door-label">稳妥</p>
        </div>
        
        <div class="door-wrapper" @click="enterRoom('devil')">
          <div class="door devil-door">
            <span class="door-sign">恶魔房</span>
            <div class="pentagram"></div>
            <div class="dark-pulse"></div>
          </div>
          <p class="door-label">危险</p>
        </div>
      </div>
      <p class="timer">{{ countdown }}s 后自动选择宝箱房</p>
    </div>
    
    <!-- 阶段2：房间内部 -->
    <div v-else-if="phase === 'room'" class="room-interior">
      <div class="room-particles" :class="roomType + '-particles'"></div>
      
      <!-- 宝箱房内部 -->
      <template v-if="roomType === 'treasure'">
        <div class="treasure-chest"></div>
        <p class="room-flavor">温暖的金色光芒充满整个房间。</p>
      </template>
      
      <!-- 恶魔房内部 -->
      <template v-else>
        <div class="devil-altar"></div>
        <p class="room-flavor">黑暗中有红色的光。</p>
      </template>
      
      <!-- 道具展示 -->
      <div class="item-cards">
        <div
          v-for="item in roomItems"
          :key="item.id"
          :class="['item-card', roomType + '-item-card']"
          @click="pickItem(item)"
        >
          <span class="emoji">{{ item.emoji }}</span>
          <span class="cn-name">{{ item.cnName }}</span>
          <span class="original-desc">"{{ item.originalDesc }}"</span>
          <div class="stars">
            <span v-for="n in 4" :key="n" class="star" :class="{ filled: n <= item.quality }">★</span>
          </div>
          <span v-if="item.penalty" class="penalty">{{ item.penalty }}</span>
        </div>
      </div>
      
      <p v-if="roomType === 'devil'" class="devil-warning">
        ⚠️ 选择后明天步数将减少
      </p>
    </div>
    
    <!-- 阶段3：获得动画 -->
    <div v-else-if="phase === 'acquired'" class="acquire-animation">
      <p class="acquire-text">获得了 {{ acquiredItem.emoji }} {{ acquiredItem.cnName }}</p>
      <p class="geralt-quote">"{{ geraltQuote }}"</p>
    </div>
  </div>
</template>

<script setup>
const roomType = ref('');
const phase = ref('choose');
const countdown = ref(10);

function enterRoom(type) {
  roomType.value = type;
  phase.value = 'room';
}

function pickItem(item) {
  acquiredItem.value = item;
  phase.value = 'acquired';
  // 触发飞向小猪的动画
  // ...
}
</script>

<style scoped>
/* 所有CSS见上文 */
</style>
```

---

## 七、关键参数速查

| 参数 | 值 |
|------|-----|
| 门宽×高 | 160px × 240px |
| 拱门半径 | 80px |
| 门打开时长 | 0.6s |
| 光效爆发时长 | 0.8s |
| 道具卡片宽 | 180px |
| 倒计时 | 10s |
| 获得动画时长 | 0.6s |
| 杰洛特文案时长 | 2s |
| 宝箱脉冲周期 | 3s |
| 恶魔祭坛脉冲周期 | 4s |
| 粒子浮动周期 | 15s(宝箱) / 12s(恶魔) |
