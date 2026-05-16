# Corvo Bianco 动森风格重构可行性分析与实施方案

## 一、可行性结论

**完全可行，但工作量大，建议分阶段执行。**

核心理由：
- 两个项目都是纯 CSS 驱动的视觉系统（没有第三方 UI 框架锁定），重构自由度极高
- Corvo Bianco 已经有完善的 `tokens.css` 设计令牌系统，只需替换令牌值即可全局改变视觉基调
- 动森风格的 CSS 规范（DESIGN_PROMPT.md）非常精确，可以直接映射
- Vue 3 Composition API 与 React Hooks 的组件逻辑可以 1:1 转换

---

## 二、设计令牌映射（tokens.css 改造）

### 2.1 色彩系统

| 用途 | 当前值 (Corvo) | 目标值 (动森) | 变化说明 |
|------|---------------|--------------|---------|
| 主背景 | `#f0e6d0` (--paper) | `#f8f8f0` | 稍微提亮，去黄 |
| 内容区背景 | `#ddd0b4` (--paper-2) | `rgb(247,243,223)` | 更暖更浅 |
| 正文色 | `#2a1f16` (--ink) | `#725d42` | 大幅提亮，从中世纪墨色→柔和棕 |
| 标题色 | `#2a1f16` (--ink) | `#794f27` | 温暖的深棕 |
| 次要文字 | `#5c4a3a` (--ink-soft) | `#9f927d` | 更柔和 |
| 淡色文字 | `#97856f` (--ink-faint) | `#8a7b66` | 微调 |
| 禁用色 | 无 | `#c4b89e` | 新增 |
| 强调色(金色) | `#b08a38` (--gold) | `#19c8b9` (薄荷绿) | **根本转变：金→薄荷** |
| 强调色浅 | `#d4a85e` (--gold-soft) | `#3dd4c6` | 金色系→薄荷色系 |
| 强调色亮 | `#f2daa2` (--gold-bright) | `#e6f9f6` | |
| 成功色 | 无 | `#6fba2c` | 新增（星期文字、完成状态） |
| 警告色 | 无 | `#f5c31c` | 新增 |
| 错误色 | 无 | `#e05a5a` | 新增 |
| Switch ON | 无 | `#86d67a` | 新增 |
| 焦点色 | 无 | `#ffcc00` | 新增（替代浏览器默认蓝色焦点环） |

### 2.2 阴影与深度

| 用途 | 当前值 | 目标值 | 变化说明 |
|------|--------|--------|---------|
| 按钮默认阴影 | 无独立按钮阴影 | `0 5px 0 0 #bdaea0` | **新增：3D 底部阴影是动森核心特征** |
| 按钮 hover | translateY(-2px) + 深阴影 | `0 6px 0 0 #bdaea0, translateY(-1px)` | |
| 按钮 active | depress | `0 1px 0 0 #bdaea0, translateY(2px)` | |
| 输入框阴影 | 无 | `0 3px 0 0 #d4c9b4` | 新增 |
| 卡片阴影 | `0 14px 36px rgba(20,14,10,0.20)` | `0 4px 10px rgba(107,92,67,0.42)` | 更紧凑、更暖 |
| 卡片 hover | 无 | `0 8px 24px rgba(114,93,66,0.15), translateY(-4px)` | |

### 2.3 圆角

| 用途 | 当前值 | 目标值 |
|------|--------|--------|
| --radius-sm | 8px | 12px |
| --radius-md | 12px | 20px |
| --radius-lg | 16px | 20px (卡片) / 50px (按钮) |
| --radius-xl | 22px | 50px (pill) |
| --radius-pill | 999px | 50px |
| 按钮/输入 | 继承 radius-md=12px | **50px（全 pill 形）** |
| Title 卡片 | 继承 radius-lg | `40px 35px 45px 38px / 38px 45px 35px 40px` (有机形) |

### 2.4 字体

| 用途 | 当前值 | 目标值 |
|------|--------|--------|
| 正文字体 | Georgia, 宋体, Noto Serif SC (衬线) | Nunito, Noto Sans SC, Zen Maru Gothic (无衬线圆体) |
| 正文粗细 | 400-700 | 500 |
| 按钮粗细 | 700 | 600 |
| 字间距 | 0.08em-0.16em | 0.01-0.02em |

**这是最大的视觉差异：从衬线中世纪感→圆体可爱感。**

### 2.5 过渡动画

| 用途 | 当前值 | 目标值 |
|------|--------|--------|
| 通用过渡 | `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| 过渡时长 | 各异 (200ms-1400ms) | 统一 0.25s |

---

## 三、组件级改造清单

### 第一优先级（核心交互组件，影响面最大）

#### 3.1 `Title.vue` — 标题页
改动量：**大**

| 部位 | 当前 | 改为 |
|------|------|------|
| 卡片形状 | `.parchment` + `var(--radius-lg)` | 有机圆角 `40px 35px 45px 38px / ...` |
| 标题字体 | Georgia/宋体 衬线 | Nunito 600-700 |
| 输入框 | 矩形 + 细边框 | pill 形 (50px) + 2.5px 边框 + 3D 底部阴影 |
| 开始按钮 | 金色渐变 pill | 薄荷绿 (`#19c8b9`) pill + 3D 底部阴影 `0 5px 0 0 #bdaea0` |
| preset 按钮 | 细边框小 pill | 3D 底部阴影 pill |
| 成就入口 | 细边框 pill | 3D 阴影 pill |
| 引用文字 | 左金色边框 | 左薄荷色边框 |
| 整体色调 | 金色/棕色系 | 暖棕 + 薄荷绿点缀 |

#### 3.2 `DayHeader.vue` — 顶部 HUD
改动量：**中**

| 部位 | 当前 | 改为 |
|------|------|------|
| 容器 | `.glass.grain` 半透明毛玻璃 | 纯暖白背景 `#f8f8f0` + 3D 卡片阴影 |
| 圆角 | `--radius-md` (12px) | 20px |
| 品牌文字 | 大写衬线 12px | Nunito 600 14px |
| 步数显示 | 等宽数字 | Nunito 700 粗体数字 |
| 代价 pill | 红色渐变 | 红色 `#e05a5a` + 3D 阴影 |

#### 3.3 `ResourceBar.vue` — 左侧面板
改动量：**大**

| 部位 | 当前 | 改为 |
|------|------|------|
| 容器 | `.glass.grain` 毛玻璃 | 纯暖白 + 圆角 20px + 3D 阴影 |
| 饰品 chips | 圆形 + 径向渐变 | 圆形保持，改用动森色卡配色 |
| 进度条 | pill 形，渐变填充 | pill 形保持，改用动森色系 |
| 消息框 | 左侧彩色边框 + 毛玻璃 | 左侧彩色边框 + 纯白背景 + 圆角 12px |
| 标题字体 | 衬线 | Nunito 600 |

#### 3.4 `AbilityBar.vue` — 右侧面板
改动量：**大**

与 ResourceBar 对称改造。额外：

| 部位 | 当前 | 改为 |
|------|------|------|
| 技能按钮 | 细边框 + 渐变 | 3D 底部阴影 + 暖白背景 |
| 星星能量 | 金色发光 | 薄荷绿/暖黄 |
| chip 选择器 | 薰衣草紫激活态 | 薄荷绿激活态 |
| 应用/取消按钮 | 金色渐变 / 深色渐变 | `#ffcc00` 黄 / 默认灰 + 3D 阴影 |

#### 3.5 `GameContainer.vue` — 布局容器
改动量：**小**

| 部位 | 当前 | 改为 |
|------|------|------|
| 背景 | 暖琥珀径向渐变 | 动森暖白渐变或保留（取决于背景整体策略） |
| 内边框 | `--radius-xl` (22px) | 更大的圆角或去掉 |
| 三栏布局 | 保持不变 | 保持不变 |

#### 3.6 `EstateStrip.vue` — 庄园场景
改动量：**巨大（2337 行，最多 CSS 绘图）**

这是最复杂的组件。需要：
- 保留所有交互逻辑和结构不变
- 改变所有建筑 CSS 绘图的配色（从棕色/暗色→柔和暖色）
- 改变天空/山脉/雾气的渐变色
- 改变 hotspot 按钮样式（加入 3D 阴影）
- 改变标签/pill 的样式

**建议：此组件最后改造，或者只改外框和配色，保留 CSS 绘图结构。**

### 第二优先级（弹窗和覆盖层 — 统一动森 blob Modal）

**所有对话引导、叙事弹窗、覆盖层卡片统一使用动森风格的有机 blob 形状弹窗。**

动森 Modal 核心特征：
- SVG blob clip-path 裁切（不规则圆润边框，非标准矩形/圆角矩形）
- `clip-path: url(#animal-modal-clip)` + 内边距 `48px 48px 32px 48px`
- 背景：暖白 `rgb(247,243,223)` 或纯白渐变
- 按钮：pill 形 (50px) + 3D 底部阴影 `0 5px 0 0 #bdaea0`
- 文字：Nunito 600，棕色系 `#725d42`
- 全局注入一次 SVG `<clipPath>` 定义（在 `App.vue` 或 `index.html` 中）

```html
<!-- 注入到 App.vue template 最顶部或 index.html body -->
<svg style="position:absolute;width:0;height:0" aria-hidden>
  <defs>
    <clipPath id="animal-modal-clip" clipPathUnits="objectBoundingBox">
      <path d="M0.501,0.005 L0.501,0.005 L0.523,0.005 L0.549,0.006
        C0.704,0.01,0.796,0.017,0.825,0.027 L0.827,0.028
        C0.872,0.045,0.939,0.044,0.978,0.17
        C1,0.254,1,0.365,0.99,0.505 L0.988,0.513
        C0.979,0.558,0.971,0.598,0.965,0.633
        C0.956,0.689,0.979,0.77,0.964,0.865
        C0.953,0.928,0.921,0.966,0.869,0.979
        C0.821,0.986,0.773,0.992,0.726,0.995
        L0.712,0.996 L0.694,0.997
        C0.648,1,0.586,1,0.507,1 L0.501,1 L0.464,1
        C0.385,1,0.325,0.998,0.283,0.995
        C0.234,0.992,0.184,0.987,0.133,0.979
        C0.081,0.966,0.05,0.928,0.039,0.865
        C0.023,0.77,0.047,0.689,0.037,0.633
        C0.031,0.595,0.023,0.552,0.013,0.505
        C-0.006,0.365,-0.002,0.254,0.024,0.17
        C0.064,0.045,0.13,0.045,0.174,0.028 L0.175,0.028
        C0.204,0.017,0.303,0.009,0.474,0.005 L0.501,0.005"/>
    </clipPath>
  </defs>
</svg>
```

#### 3.7 `CbModal.vue` — 通用 blob Modal 组件（新建）
改动量：**新建组件**

这是所有对话引导的基础组件，后续 3.8-3.12 都基于它：

```
src/components/ui/CbModal.vue
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | Boolean | (必填) | 控制显示/隐藏 |
| `title` | String/Slot | — | 标题 |
| `width` | Number/String | 520 | 弹窗宽度 |
| `maskClosable` | Boolean | true | 点击遮罩关闭 |
| `footer` | Slot/null | — | 底部按钮区；null=隐藏 |
| `typewriter` | Boolean | false | 内容打字机效果 |
| `typeSpeed` | Number | 80 | 打字速度 ms/字 |

核心 CSS：
```css
.cb-modal-card {
  clip-path: url(#animal-modal-clip);
  background: rgb(247, 243, 223);
  padding: 48px 48px 32px 48px;
  max-width: var(--modal-width, 520px);
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  color: #725d42;
}
```

#### 3.8 `Title.vue` — intercept-shell 对话框 → blob Modal
改动量：**中**

当前的 `.intercept-shell` 是一个简单的边框 div，改为使用 `CbModal` 的内联变体：

| 部位 | 当前 | 改为 |
|------|------|------|
| intercept-shell | 矩形 div + 边框 + 隐藏/显示过渡 | blob clip-path 卡片 + 暖白背景 |
| speaker 标签 | 11px 金色 "杰洛特" | 12px 薄荷色 `#19c8b9` Nunito 600 |
| 对话文字 | 1.7 line-height 默认色 | Nunito 500 `#725d42` |
| 光标 ▍ | 金色闪烁 | 薄荷色 `#19c8b9` 闪烁 |
| 卡片主体 | `.parchment.grain` | 有机圆角 `40px 35px 45px 38px / ...` 或 blob clip-path |
| 开始按钮 | 金色渐变 | 薄荷绿 `#19c8b9` + 3D 阴影 |
| preset 按钮 | 细边框 | 3D 底部阴影 pill |

#### 3.9 `DjinnCeremonyOverlay.vue` — 精灵仪式 → blob Modal
改动量：**中**

| 部位 | 当前 | 改为 |
|------|------|------|
| 卡片容器 | `<div class="card glass grain">` | `<CbModal :open="true" :mask-closable="false">` |
| 卡片形状 | 矩形 + 12px 圆角 | **blob clip-path** 有机边框 |
| 背景色 | 毛玻璃半透明 | 暖白 `rgb(247,243,223)` |
| 标题 | 21px 衬线 ink-title | 20px Nunito 700 `#794f27` |
| 引言 | 13px ink-subtle | 13px Nunito 500 `#9f927d` |
| 对话文字 | Dialog 组件 | 保留，但改为 Nunito 500 |
| advance-btn | 金色渐变 pill | `#ffcc00` 黄底 + `#725d42` 文字 + 3D 阴影 `0 5px 0 0 #bdaea0` |
| 遮罩光晕 | 金+紫径向光 | 薄荷 `#19c8b9` + 暖黄 `#ffcc00` 径向光 |

#### 3.10 `DayEndOverlay.vue` — 日终覆盖 → blob Modal
改动量：**中**

| 部位 | 当前 | 改为 |
|------|------|------|
| 卡片容器 | `<div class="card glass grain">` | `<CbModal>` 使用 blob 形状 |
| 卡片形状 | 矩形 + 12px 圆角 | **blob clip-path** |
| 背景色 | 毛玻璃 | 暖白 |
| 月亮 emoji | 48px 金色光晕 | 48px 暖黄/薄荷色光晕 |
| 文字样式 | ink-title / ink-subtle | Nunito 600/500 棕色系 |
| continue-hint | 11px ink-subtle | 12px Nunito 500 `#9f927d` |
| 遮罩光晕 | 金+紫脉冲 | 薄荷+暖黄脉冲 |

#### 3.11 `RewardRoomOverlay.vue` — 奖励房间 → blob Modal
改动量：**大**

| 部位 | 当前 | 改为 |
|------|------|------|
| 门选择阶段 | 保持拱形门设计 | 保持，但改配色：宝箱门→薄荷渐变，恶魔门→粉红/珊瑚渐变 |
| 房间内部 | `.treasure-chest` / `.devil-altar` | 改为动森色系的 CSS 图形 |
| 物品卡片 | 暗色系矩形 | blob 形状暖白卡片 + 13 色卡品质边框 |
| 获得弹窗 | 无独立弹窗，内联显示 | 获得确认用 **blob Modal** 弹窗展示物品信息 |
| 飞行动画 | 金色路径 | 薄荷色 `#19c8b9` / 暖黄 `#ffcc00` |
| 质量标签 | Q1-Q4 暗色 | 用动森色卡：Q1=default, Q2=app-green, Q3=purple, Q4=app-yellow |

#### 3.12 `AchievementPanel.vue` — 成就面板 → blob Modal
改动量：**大**

| 部位 | 当前 | 改为 |
|------|------|------|
| 面板容器 | `.glass.grain` 暗色调 | `CbModal` blob 形状 + 暖白背景 |
| 面板形状 | 矩形 + 16px 圆角 | **blob clip-path** |
| 卡片背景 | 暗蓝灰渐变 | 动森 13 色卡底色 |
| 成就卡片 | 暗色矩形 | 暖白 + 20px 圆角 + 3D 底部阴影 |
| 品质边框 | 深色发光 | 薄荷/紫/黄彩色边框 |
| 徽章圆形 | 深色背景 | 暖色渐变 + 3D 阴影 |
| 文字 | 浅灰/近白 | `#725d42` 棕色系 |

#### 3.13 `AchievementToastStack.vue` — 成就 Toast
改动量：**中**

| 部位 | 当前 | 改为 |
|------|------|------|
| 背景 | 深蓝灰渐变 | 暖白 `rgb(247,243,223)` + 3D 卡片阴影 |
| 文字 | 浅灰/近白 | 棕色系 `#725d42` / `#794f27` |
| 品质指示 | 深色 accent bar | 薄荷/紫/黄 accent bar |
| 圆角 | 6px | 12px (动森最低圆角) |
| 图标区 | 深蓝灰渐变 | 动森色卡底色 |

### 第零优先级（新增 — Loading 屏）

#### 3.14 `LoadingScreen.vue` — 动森风格加载屏（新建）
改动量：**新建组件**

当前项目没有任何加载页（`main.js` 直接 `mount('#app')`）。需要新建一个完整的动森风格 Loading 屏。

**设计参考：** 动森游戏启动画面 — 暖色背景 + 居中 logo + 草地纹理 + 加载动画

```
src/components/LoadingScreen.vue
```

**视觉设计：**

```
┌─────────────────────────────────────┐
│                                     │
│         ┌───────────────┐           │
│         │  🏝 Corvo     │           │
│         │  Bianco       │           │
│         │  白鸦葡萄园    │           │
│         └───────────────┘           │
│                                     │
│    ╭─────────────────────────╮      │
│    │  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  │      │
│    ╰─────────────────────────╯      │
│                                     │
│      正在修复庄园...                  │
│                                     │
│  ╭─────╮  ╭─────╮  ╭─────╮        │
│  │ 🍇  │  │ 🪵  │  │ 🪨  │        │  ← 资源 emoji 随机跳动
│  ╰─────╯  ╰─────╯  ╰─────╯        │
│                                     │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │  ← 底部海浪/草地装饰
└─────────────────────────────────────┘
```

**实现细节：**

| 部位 | 样式 |
|------|------|
| 背景 | 动森暖白渐变 `linear-gradient(180deg, #f8f8f0, rgb(247,243,223))` |
| 底部装饰 | 草地/海浪 SVG 或 CSS 波浪（参考动森 Footer sea 样式） |
| Logo 卡片 | blob clip-path 有机形状 或 有机圆角 `40px 35px 45px 38px` |
| 标题 | Nunito 700, 28px, `#794f27` |
| 副标题 | Nunito 500, 16px, `#9f927d` |
| 进度条 | pill 形 (50px), `#19c8b9` 薄荷绿填充 + 3D 底部阴影 `0 3px 0 0 #d4c9b4` |
| 进度条动画 | 对角条纹 `repeating-linear-gradient(-45deg, #0ec4b6, #01b0a7)` + `1s linear infinite` |
| 加载文字 | Nunito 500, 14px, `#8a7b66` |
| 资源 emoji | 3 个小卡片，CSS 弹跳动画 `iconBounce` (0.3s ease-in-out)，随机延迟 |
| 整体入场 | `fadeIn` 600ms |

**接入方式（`main.js` 改造）：**

```js
// main.js — 添加 loading 阶段
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import LoadingScreen from './components/LoadingScreen.vue';

import './assets/tokens.css';
import './assets/global.css';
import './assets/tile.css';
import './assets/animations.css';

// 1. 先渲染 Loading 屏
const loadingApp = createApp(LoadingScreen);
const loadingEl = document.createElement('div');
document.body.appendChild(loadingEl);
loadingApp.mount(loadingEl);

// 2. 异步初始化游戏（预加载字体、音频等）
async function bootstrap() {
  // 预加载字体
  await document.fonts?.ready;
  // 预加载音频资源
  // await audioManager.preload();
  // 模拟最小加载时间（避免闪烁）
  await new Promise(r => setTimeout(r, 800));
  
  // 3. 销毁 Loading 屏，挂载正式 App
  loadingApp.unmount();
  loadingEl.remove();
  
  const app = createApp(App);
  app.use(createPinia());
  app.mount('#app');
}

bootstrap();
```

**替代方案（更优雅，单 Vue 实例）：**

```js
// main.js — 用 App.vue 内部状态控制
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

import './assets/tokens.css';
import './assets/global.css';
import './assets/tile.css';
import './assets/animations.css';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
```

```vue
<!-- App.vue — 加入 loading 状态 -->
<template>
  <LoadingScreen v-if="loading" :progress="loadProgress" />
  <template v-else>
    <Title v-if="phase === 'title'" />
    <GameContainer v-else-if="..." />
    <Ending v-else-if="..." />
    <!-- ... -->
  </template>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LoadingScreen from './components/LoadingScreen.vue';

const loading = ref(true);
const loadProgress = ref(0);

onMounted(async () => {
  // 预加载资源
  loadProgress.value = 30;
  await document.fonts?.ready;
  loadProgress.value = 60;
  // 最小显示时间
  await new Promise(r => setTimeout(r, 600));
  loadProgress.value = 100;
  await new Promise(r => setTimeout(r, 300));
  loading.value = false;
});
</script>
```

**推荐第二种方案**，更简洁，Loading 屏与 App 共享同一个 Vue 实例和 Pinia store。

### 第三优先级（底栏和棋盘框架）

#### 3.12 `GameBoard.vue` — 棋盘（3750 行）
改动量：**中（仅改框架，不改棋盘逻辑）**

| 部位 | 当前 | 改为 |
|------|------|------|
| 棋盘框架 | `--board-frame-1: #7a6048` 暗木色 | 暖棕色 + 更大圆角 |
| 单元格 | `--board-cell-1: #2e2018` 深暗 | 更暖的深色，保留对比度 |
| 边框 | `--board-grid: rgba(250,235,205,0.08)` | 稍微提亮 |

**注意：棋盘本身（tile 渐变、emoji 渲染）的配色与 6 种资源相关联，不建议改变，否则影响游戏辨识度。只改外框架。**

### 第四优先级（全局样式）

#### 3.13 `tokens.css` — 设计令牌
改动量：**大（但是一次性全局生效）**

替换所有 `:root` CSS 变量值，保留变量名不变。这样所有引用变量的组件自动跟随。

#### 3.14 `global.css` — 全局样式
改动量：**大**

| 部位 | 当前 | 改为 |
|------|------|------|
| 字体栈 | Georgia 衬线 | Nunito 圆体无衬线 |
| `.glass` 类 | 毛玻璃效果 | 纯暖白 + 3D 阴影 |
| `.parchment` 类 | 羊皮纸纹理 | 暖白底 |
| 按钮重置 | transparent | 加入 3D 底部阴影默认值 |
| `.grain` 纹理 | overlay 混合纹理 | 简化或去掉 |
| 背景渐变 | 金色/棕色日变化 | 柔和暖色日变化 |

#### 3.15 `tile.css` / `animations.css`
改动量：**小**

tile.css：保留资源渐变色不变（游戏辨识度），只调整框架相关样式。
animations.css：保留核心动画逻辑，微调颜色。

---

## 四、新增 Vue 组件库（参考动森 API）

建议在 `src/components/ui/` 下创建一套通用 UI 组件，既用于游戏本身，也可复用：

```
src/components/ui/
  ├── CbButton.vue        # 3D pill 按钮 (primary/default/dashed/text/link)
  ├── CbInput.vue         # pill 输入框 (small/middle/large)
  ├── CbSwitch.vue        # 浮动 3D 开关
  ├── CbModal.vue         # 有机 blob 弹窗 (SVG clip-path)
  ├── CbCard.vue          # 暖色卡片 (default/title/dashed + 13 色)
  ├── CbCollapse.vue      # 手风琴 (CSS grid 动画)
  ├── CbSelect.vue        # 下拉选择
  ├── CbTabs.vue          # 标签页
  ├── CbCheckbox.vue      # 复选框组
  ├── CbToast.vue         # Toast 通知
  ├── CbProgressBar.vue   # 进度条
  ├── CbTypewriter.vue    # 打字机效果
  └── index.js            # 统一导出
```

命名约定：`Cb` 前缀 (Corvo Bianco)，避免与 HTML 原生元素冲突。

### 核心组件 API 设计（参考 animal-island-ui，适配 Vue 3）

```vue
<!-- CbButton.vue -->
<script setup>
defineProps({
  type: { type: String, default: 'default' },    // primary | default | dashed | text | link
  size: { type: String, default: 'middle' },      // small | middle | large
  danger: Boolean,
  ghost: Boolean,
  block: Boolean,
  loading: Boolean,
  disabled: Boolean,
  icon: [Object, String],
})
</script>
```

```vue
<!-- CbModal.vue -->
<script setup>
defineProps({
  open: { type: Boolean, required: true },
  title: [String, Object],
  width: { type: [Number, String], default: 520 },
  maskClosable: { type: Boolean, default: true },
  footer: { type: [Object, null], default: undefined },
  typewriter: { type: Boolean, default: true },
  typeSpeed: { type: Number, default: 80 },
})
defineEmits(['close', 'ok'])
</script>
```

```vue
<!-- CbCard.vue -->
<script setup>
defineProps({
  type: { type: String, default: 'default' },   // default | title | dashed
  color: { type: String, default: 'default' },  // 13 色
})
</script>
```

---

## 五、实施路线图

### Phase 0：准备工作（1-2 天）
- [ ] 安装字体依赖：`npm install @fontsource/nunito @fontsource/noto-sans-sc`
- [ ] 创建 `src/components/ui/` 目录
- [ ] 在 `App.vue` 或 `index.html` 注入动森 blob SVG `<clipPath>` 定义
- [ ] 创建 `src/assets/island-tokens.css`（新令牌文件，与原文件并行开发）

### Phase 1：Loading 屏 + 令牌 + 全局样式（3-4 天）
- [ ] **新建 `LoadingScreen.vue`** — 动森风格加载屏（暖白背景 + blob logo 卡片 + pill 进度条 + 对角条纹动画 + 资源 emoji 弹跳 + 底部海浪装饰）
- [ ] **改造 `main.js`** — 加入 loading 状态管理，字体/音频预加载
- [ ] 替换 `tokens.css` 中所有颜色、阴影、圆角变量
- [ ] 替换 `global.css` 中的字体栈、按钮重置、.glass/.parchment 类
- [ ] 测试整体视觉效果（Loading 屏 + 标题页 + 全局变化）

### Phase 2：核心 UI 组件库（3-5 天）
- [ ] **`CbModal.vue`** — 有机 blob 弹窗（SVG clip-path，最优先，后续所有弹窗依赖它）
- [ ] `CbButton.vue` — 3D 底部阴影 pill 按钮
- [ ] `CbInput.vue` — pill 输入框
- [ ] `CbCard.vue` — 暖色卡片（13 色卡）
- [ ] `CbToast.vue` — Toast 通知
- [ ] `CbProgressBar.vue` — 进度条

### Phase 3：对话引导系统改造（3-4 天）— **所有弹窗统一 blob Modal**
- [ ] `Title.vue` — intercept-shell 对话框改为 blob Modal 内嵌样式；卡片改有机圆角；按钮改 3D pill
- [ ] `DjinnCeremonyOverlay.vue` — 整体改为 `CbModal` blob 形状；按钮改 `#ffcc00` + 3D 阴影
- [ ] `DayEndOverlay.vue` — 卡片改为 blob 形状；光晕改薄荷+暖黄
- [ ] `RewardRoomOverlay.vue` — 物品确认改为 blob Modal；门配色改薄荷/粉红
- [ ] `AchievementPanel.vue` — 面板改为 blob 形状暖白底

### Phase 4：游戏 HUD 改造（2-3 天）
- [ ] `DayHeader.vue` — 顶部 HUD
- [ ] `ResourceBar.vue` — 左侧面板
- [ ] `AbilityBar.vue` — 右侧面板
- [ ] `AchievementToastStack.vue` — Toast 改暖白底
- [ ] `GameContainer.vue` — 布局容器微调

### Phase 5：棋盘框架和庄园（5-7 天）
- [ ] `GameBoard.vue` — 只改框架样式
- [ ] `tile.css` — 微调
- [ ] `EstateStrip.vue` — 最复杂，只改配色和外框

**预估总工时：17-25 天（一人开发）**

---

## 六、风险与注意事项

### 6.1 游戏辨识度风险
- 6 种资源（葡萄/木/石/粘土/草药/魔法）的 tile 渐变色不应改变，否则影响游戏可玩性
- 棋盘本身的深色背景需要保留对比度，不能太浅

### 6.2 字体加载
- Nunito 是拉丁字体，中文回退到 Noto Sans SC
- 需要 `@fontsource/nunito` + `@fontsource/noto-sans-sc` 或 Google Fonts CDN
- 字体文件约 300-500KB，对游戏加载有一定影响

### 6.3 SVG clip-path 兼容性
- 动森 Modal 使用 SVG blob clip-path，在现代浏览器（Chrome/Firefox/Safari）中支持良好
- 移动端需要测试

### 6.4 响应式
- 当前项目有两个响应式断点 (1180px / 960px)
- 动森风格的 pill 按钮在极小屏幕上可能占用过多宽度

### 6.5 深色覆盖层的文字可读性
- 当前深色覆盖层使用浅色文字 (`--ink` 在深色背景上)
- 动森风格文字更浅 (`#725d42`)，在深色覆盖层上需要确保对比度

---

## 七、快速验证方案

如果想先看效果，可以用最少改动快速验证：

1. 只改 `tokens.css` 中的 `:root` 变量（颜色、圆角、阴影）
2. 只改 `global.css` 中的字体栈和按钮重置
3. 不改任何 `.vue` 组件文件

这样可以在 **1-2 小时内** 看到全局视觉变化的大致效果，再决定是否继续深入。
