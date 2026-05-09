# Corvo Bianco 美术风格设计需求文档 v2.0

> 文档类型：Design System Specification（设计系统规范）
> 适用项目：Corvo Bianco 三消修复游戏
> 技术约束：纯 CSS + Emoji + JavaScript，零图片素材
> 棋盘规格：8×8，Tile 60×60px，Vue 3 + Vite
> 更新日期：2026-05-09

---

## 1. 设计概览

### 1.1 核心定位

**风格：Soft Neumorphism（柔和新拟态）× 田园自然主义**

整体视觉追求"克制的高级感"——像《动物森友会》UI 那样的舒适精致，但包裹在中世纪葡萄庄园的静谧氛围里。玩家看到的不是花哨的特效，而是有温度、有材质触感的界面。

### 1.2 设计策略

| 维度 | 策略 | 原因 |
| :--- | :--- | :--- |
| 质感系统 | 新拟态浮雕底板 + 原生 Emoji | 纯 CSS 可实现；Emoji 提供高辨识度；新拟态提供品质感 |
| 复杂度控制 | 轻度纹理，重光影层次 | 64 Tile 同屏，性能与辨识度的平衡点 |
| 动画哲学 | "必要且优雅" | 只有核心反馈动画，拒绝装饰性动效 |
| 色彩情绪 | 低饱和自然绿意 + 暖金点缀 | 契合葡萄庄园主题，降低视觉疲劳 |

### 1.3 一句话愿景

> 像动森的 UI 融入了一座中世纪葡萄庄园——Emoji 图标浮在苔藓覆盖的柔化石墙上方，柔和、安静、有温度。

---

## 2. Design Tokens（设计变量）

所有视觉参数必须 token 化，统一在 `tokens.css` 中维护，禁止硬编码。

### 2.1 色彩系统

#### 2.1.1 核心色板（Core Palette）

```css
/* 主色 — 绿意递进 */
--color-green-900: #1a2e25;   /* 最深：阴影/暗部 */
--color-green-800: #2d4a3e;   /* 深：主表面/重要文字 */
--color-green-700: #3d6352;
--color-green-600: #4d7c66;
--color-green-500: #5a8a6e;   /* 基准：主品牌色 */
--color-green-400: #7aa88f;
--color-green-300: #a8c9b5;   /* 浅：辅助表面 */
--color-green-200: #c8d4c4;
--color-green-100: #d6e0d4;   /* 最浅：背景基底 */
--color-green-50:  #e8ede6;

/* 强调色 — 暖金 */
--color-gold-600: #9e7e2e;
--color-gold-500: #c9a84c;   /* 基准：强调/成就 */
--color-gold-400: #d4b86a;
--color-gold-300: #e8d5a0;   /* 浅：高亮/悬停 */
--color-gold-200: #f0e4c4;

/* 中性色 — 用于文字层级和新拟态高光/阴影 */
--color-neutral-100: rgba(255, 255, 255, 0.8);   /* 新拟态高光 */
--color-neutral-80:  rgba(255, 255, 255, 0.55);  /* 次级高光 */
--color-neutral-0:   rgba(0, 0, 0, 0);            /* 透明 */
--color-shadow-20:   rgba(26, 46, 37, 0.15);      /* 柔和投影 */
--color-shadow-40:   rgba(26, 46, 37, 0.35);      /* 深投影 */
--color-shadow-60:   rgba(26, 46, 37, 0.55);      /* 凹陷暗部 */
```

#### 2.1.2 功能色板（Functional / Semantic Colors）

```css
/* 表面层级（Surface Elevation） */
--surface-base:        var(--color-green-100);    /* 页面底层背景 */
--surface-elevated:    var(--color-green-50);     /* 卡片/面板底层 */
--surface-tile:        linear-gradient(145deg, var(--color-green-200), var(--color-green-300));
                                            /* Tile 默认表面 — 渐变制造微妙体积感 */

/* 交互状态 */
--state-hover:         var(--color-green-200);    /* 悬停提亮 */
--state-active:        var(--color-green-300);    /* 按下/选中 */
--state-disabled:      var(--color-green-200);    /* 禁用 — 去饱和 */
--state-accent:        var(--color-gold-500);     /* 强调/激活 */

/* 语义色（用于 HUD、提示、成就） */
--semantic-success:    var(--color-green-500);
--semantic-warning:    #c9a84c;                   /* 暖金作为警告，契合主题 */
--semantic-error:      #8b4a4a;                   /* 柔和暗红，不刺眼 */
--semantic-info:       var(--color-green-600);
--semantic-magic:      var(--color-gold-300);     /* 魔力/特殊事件 */
```

#### 2.1.3 新拟态色彩计算法则（重要）

新拟态的阴影/高光必须与背景色保持**同色系**，否则会出现"脏"或"假"的感觉。

```
凸起效果（Default State）：
  高光 = background色 + 提高明度 8-12% + 降低饱和 5%
  阴影 = background色 + 降低明度 10-15% + 提高饱和 5%

凹陷效果（Pressed / Selected State）：
  内阴影上 = background色 + 降低明度 12-18%（模拟遮挡光）
  内阴影下 = background色 + 提高明度 5-8%（模拟底部反光）

发光效果（Magic / Highlight）：
  外发光 = 强调色 + 30% 透明度 + 8-16px 模糊
```

> **可访问性注意**：新拟态天然对比度低，所有文字与背景的对比度必须 ≥ 4.5:1（AA 级）。Tile 上的 Emoji 因本身色彩丰富可豁免，但 UI 文字必须达标。

---

### 2.2 排版系统（Typography）

```css
/* 字体栈 — 优先系统默认，保持加载速度 */
--font-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
--font-mono:    "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;

/* 字号层级 — 以 1.25 倍率递进 */
--text-xs:   12px;   /* 行高 16px — 标签、辅助说明 */
--text-sm:   14px;   /* 行高 20px — 次要信息 */
--text-base: 16px;   /* 行高 24px — 正文、按钮 */
--text-lg:   20px;   /* 行高 28px — 小节标题 */
--text-xl:   25px;   /* 行高 32px — 面板标题 */
--text-2xl:  31px;   /* 行高 40px — 大标题（天数、建筑名） */
--text-3xl:  39px;   /* 行高 48px — 特殊标题 */

/* 字重 */
--font-normal:  400;
--font-medium:  500;   /* 按钮、标签 */
--font-semibold:600;   /* 标题、强调 */

/* 文字颜色 */
--text-primary:   var(--color-green-900);     /* 主文字 */
--text-secondary: var(--color-green-700);     /* 次要文字 */
--text-tertiary:  var(--color-green-500);     /* 辅助/禁用暗示 */
--text-inverse:   var(--color-green-50);      /* 深底上的白字 */
--text-accent:    var(--color-gold-600);      /* 强调文字 */
```

**排版规则：**
- 游戏内所有中文使用 **正常字重（400）** 即可，避免过粗导致的新拟态界面"沉重感"
- 数字（步数、资源数量）使用 `--font-medium`，提供微妙的区分度
- 禁止纯黑色（#000），最深使用 `--color-green-900`

---

### 2.3 间距系统（Spacing）

以 4px 为基准单位，保持视觉节奏的一致性。

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;

/* 特殊间距 */
--tile-gap: 8px;           /* Tile 之间间隙 */
--board-padding: 12px;     /* 棋盘外边框内边距 */
--panel-radius: 16px;      /* 面板圆角 */
--tile-radius: 12px;       /* Tile 圆角 */
--button-radius: 10px;     /* 按钮圆角 */
```

---

### 2.4 Elevation / 新拟态阴影系统（核心）

这是整个视觉风格的**技术核心**。阴影参数必须精确，偏差 1-2px 会导致质感断崖式下跌。

```css
/* ============================================
   凸起状态（Raised — 默认 Tile、按钮、面板）
   ============================================ */
--shadow-raised:
  /* 主投影 — 右下，提供浮起感 */
  6px 6px 12px var(--color-shadow-20),
  /* 次投影 — 更模糊更大范围，提供环境深度 */
  2px 2px 4px var(--color-shadow-20),
  /* 高光 — 左上，模拟光源从左上 45° 照射 */
  -4px -4px 8px var(--color-neutral-80);

/* ============================================
   凹陷状态（Pressed / Selected / 输入框）
   ============================================ */
--shadow-inset:
  /* 内阴影上 — 模拟遮挡 */
  inset 3px 3px 6px var(--color-shadow-40),
  /* 内阴影下 — 微弱底部反光 */
  inset -2px -2px 4px var(--color-neutral-80);

/* ============================================
   悬浮状态（Hover — 比默认更高）
   ============================================ */
--shadow-hover:
  8px 8px 16px var(--color-shadow-40),
  3px 3px 6px var(--color-shadow-20),
  -4px -4px 10px var(--color-neutral-100);

/* ============================================
   强调发光（Accent Glow — 选中/特殊块/连锁高潮）
   ============================================ */
--shadow-glow-gold:
  /* 金色外发光 */
  0 0 12px rgba(201, 168, 76, 0.4),
  0 0 24px rgba(201, 168, 76, 0.2),
  /* 保持基础凸起 */
  4px 4px 8px var(--color-shadow-20),
  -3px -3px 6px var(--color-neutral-80);

/* ============================================
   怪物阴影（Monster — 略重以区分）
   ============================================ */
--shadow-monster:
  /* 更重的主投影 */
  8px 8px 16px var(--color-shadow-40),
  /* 怪物特有的"地影" */
  0 12px 20px rgba(26, 46, 37, 0.25);
```

**阴影使用规则：**
| 元素 | 默认状态 | 悬停状态 | 选中/按下状态 |
| :--- | :--- | :--- | :--- |
| 普通 Tile | `--shadow-raised` | `--shadow-hover` | `--shadow-inset` + 微位移 |
| 怪物 Tile | `--shadow-monster` | 怪物浮动动画自带 | 同普通 Tile |
| 按钮 | `--shadow-raised` | `--shadow-hover` | `--shadow-inset` |
| 面板/卡片 | `--shadow-raised` | 无（面板不悬停） | 无 |
| 特殊块/高亮 | `--shadow-glow-gold` | 脉冲动画 | 保持发光 |

---

### 2.5 圆角系统（Radius）

```css
--radius-sm:   6px;   /* 小按钮、标签 */
--radius-md:   10px;  /* 按钮、输入框 */
--radius-lg:   12px;  /* Tile — 与阴影柔和感匹配 */
--radius-xl:   16px;  /* 面板、卡片 */
--radius-full: 9999px; /* 圆形元素（如步数指示器） */
```

**圆角规则：**
- Tile 使用 12px 圆角（避免太小显得尖锐，避免太大失去"块"的实体感）
- 棋盘外框使用 16px 圆角，与内部 Tile 的 12px 形成 4px 差异，产生"容器包裹内容"的层级暗示

---

### 2.6 动画时序系统（Animation Timing）

```css
/* 时长 — 以 50ms 为梯度 */
--duration-instant:  50ms;    /* 微交互反馈 */
--duration-fast:     150ms;   /* 悬停、小状态切换 */
--duration-normal:   250ms;   /* 标准过渡 */
--duration-slow:     400ms;   /* 入场、消除 */
--duration-dramatic: 600ms;   /* 连锁高潮、Boss 登场 */

/* 缓动曲线 */
--ease-default:     cubic-bezier(0.4, 0.0, 0.2, 1);     /* 标准 Material 缓动 */
--ease-decelerate:  cubic-bezier(0.0, 0.0, 0.2, 1);     /* 入场 — 快速启动，柔和停止 */
--ease-accelerate:  cubic-bezier(0.4, 0.0, 1.0, 1);     /* 离场 — 柔和启动，快速消失 */
--ease-bounce-soft: cubic-bezier(0.34, 1.56, 0.64, 1);  /* 轻微回弹 — 消除、下落着陆 */

/* 错开延迟（Stagger） */
--stagger-tile: 30ms;   /* 连锁消除时每个 Tile 的间隔 */
--stagger-cascade: 50ms; /* 下落时每层 Tile 的间隔 */
```

---

## 3. Tile 质感系统

### 3.1 基础 Tile 规格

```css
.tile {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);        /* 12px */
  background: var(--surface-tile);         /* 渐变底色 */
  box-shadow: var(--shadow-raised);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;                         /* Emoji 尺寸 */
  transition: box-shadow var(--duration-fast) var(--ease-default),
              transform var(--duration-fast) var(--ease-default);
  position: relative;
  overflow: hidden;                        /* 纹理不溢出 */
}
```

### 3.2 纹理设计 — "轻度复杂度"

每种资源 Tile 在统一的新拟态底板之上，通过**伪元素 + CSS 渐变**实现差异化纹理。纹理的明度必须控制在底板色的 ±10% 范围内，避免抢夺 Emoji 的辨识焦点。

| 资源 | Emoji | 纹理策略 | CSS 实现方向 |
| :--- | :--- | :--- | :--- |
| 葡萄 | 🍇 | 紫色系底 + 微弱圆形颗粒暗示果实 | `radial-gradient()` 散布小圆点，色相偏紫 `#7a5a8a` |
| 木材 | 🪵 | 木纹底板 | `repeating-linear-gradient()` 模拟 3-4 条木纹线，色 `#6b5a3e` |
| 石材 | 🪨 | 灰绿颗粒感 | `radial-gradient()` 随机散布小点，`#5a6e60` + `sepia(0.3)` |
| 黏土 | 🧱 | 土绿交叉纹理 | `repeating-linear-gradient(45deg...)` + `repeating-linear-gradient(-45deg...)` 编织感，`#7a6e4a` |
| 草药 | 🌿 | 鲜活绿色 + 叶脉暗示 | `linear-gradient()` 主色 + 1-2 条浅色叶脉线，`#4a7a52` |
| 魔力 | ✨ | 金色/绿色渐变发光底板 | `linear-gradient(135deg, #c9a84c22, #5a8a6e44)` + 微弱闪烁动画 |

**纹理设计原则：**
1. **不干扰 Emoji**：纹理明度对比度 < 1.5:1，确保 Emoji 是视觉焦点
2. **统一光影方向**：所有纹理的明暗变化必须服从左上光源假设
3. **性能限制**：每个 Tile 最多叠加 2 层伪元素纹理，避免过多渐变计算

### 3.3 Tile 交互状态全集

```css
/* 悬停（Hover） */
.tile:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-1px);           /* 微抬升 */
}

/* 选中（Selected — 核心交互状态） */
.tile.selected {
  box-shadow: var(--shadow-inset);
  transform: translateY(1px);            /* 按下感 */
  background: var(--state-active);        /* 底色微变 */
}
.tile.selected::after {
  /* 选中时外圈微光提示 */
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: calc(var(--radius-lg) + 3px);
  border: 2px solid var(--color-gold-400);
  opacity: 0.5;
  pointer-events: none;
}

/* 可交换提示（Hint — 紫丁香归途被动触发） */
.tile.hint {
  animation: pulse-hint 2s ease-in-out infinite;
}
@keyframes pulse-hint {
  0%, 100% { box-shadow: var(--shadow-raised), 0 0 0 0 rgba(201, 168, 76, 0.4); }
  50%      { box-shadow: var(--shadow-raised), 0 0 8px 2px rgba(201, 168, 76, 0.2); }
}

/* 禁用（Disabled — 回合过渡期间） */
.tile.disabled {
  opacity: 0.6;
  filter: grayscale(0.3);
  cursor: not-allowed;
  box-shadow: var(--shadow-raised);       /* 保持形状，但无交互 */
}

/* 消除中（Matching — 消除动画状态） */
.tile.matching {
  animation: tile-vanish var(--duration-slow) var(--ease-accelerate) forwards;
}
@keyframes tile-vanish {
  0%   { transform: scale(1); opacity: 1; box-shadow: var(--shadow-raised); }
  40%  { transform: scale(0.9); box-shadow: var(--shadow-inset); }  /* 先凹陷 */
  100% { transform: scale(0); opacity: 0; }
}
```

---

## 4. 资源图标系统（Emoji + CSS 底板）

### 4.1 Emoji 渲染策略

Emoji 在不同操作系统渲染差异极大（Apple Color Emoji vs Segoe UI Emoji vs Noto Color Emoji）。为保持视觉一致性，采用以下策略：

```css
.tile-emoji {
  font-size: 32px;
  line-height: 1;
  /* 统一 emoji 的基线，避免不同平台偏移 */
  display: flex;
  align-items: center;
  justify-content: center;
  /* 禁止 emoji 被选中 */
  user-select: none;
  -webkit-user-select: none;
}
```

### 4.2 Emoji 色调统一滤镜

将原生 Emoji 融入绿色系主题，但**不过度处理**——保持 Emoji 本身辨识度的前提下做微调。

| 资源 | Emoji | 滤镜策略 | 具体 CSS filter 值 |
| :--- | :--- | :--- | :--- |
| 葡萄 | 🍇 | 偏暖紫，与绿色底板协调 | `hue-rotate(-10deg) saturate(1.1)` |
| 木材 | 🪵 | 偏棕绿，融入自然主题 | `sepia(0.2) hue-rotate(30deg)` |
| 石材 | 🪨 | 去饱和，灰绿感 | `sepia(0.3) saturate(0.8)` |
| 黏土 | 🧱 | 土色微调 | `sepia(0.15) hue-rotate(10deg)` |
| 草药 | 🌿 | 增强鲜活感 | `saturate(1.2) brightness(1.05)` |
| 魔力 | ✨ | 保留金色闪耀，不做滤镜 | `none` |

> **重要**：滤镜值必须是**微调**，不能改变 Emoji 的本质色彩。玩家需要 0.3 秒内辨识资源类型。

### 4.3 底板与 Emoji 的层级关系

```
┌─────────────────────────────┐
│  Layer 3: Emoji 图标         │  z-index: 3
│  (32px, 可能带微滤镜)         │
├─────────────────────────────┤
│  Layer 2: 资源颜色渐变覆盖    │  z-index: 2
│  (半透明，统一色调倾向)        │
├─────────────────────────────┤
│  Layer 1: 新拟态浮雕底板      │  z-index: 1
│  (阴影 + 圆角 + 底色渐变)     │
├─────────────────────────────┤
│  Layer 0: 纹理层（伪元素）    │  z-index: 0
│  (木纹/颗粒/叶脉等)           │
└─────────────────────────────┘
```

---

## 5. 怪物视觉系统

### 5.1 怪物基础规格

怪物 Tile 与普通资源 Tile **共享相同的底板尺寸和圆角**，但在阴影和动画上区分，保持 UI 一致性。

```css
.monster-tile {
  /* 继承 .tile 的所有基础样式 */
  box-shadow: var(--shadow-monster);
}
```

### 5.2 怪物 CSS 叠加层

通过 `::before`（底部氛围）和 `::after`（顶部光晕）添加氛围：

```css
.monster-tile::before {
  /* 底部暗色氛围 — 让怪物显得更有"重量" */
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 30%;
  background: radial-gradient(ellipse at center, var(--color-shadow-40), transparent 70%);
  pointer-events: none;
}

.monster-tile::after {
  /* 顶部微光 — 怪物特有的威胁感/神秘感 */
  content: '';
  position: absolute;
  top: 8%;
  left: 20%;
  right: 20%;
  height: 25%;
  background: radial-gradient(ellipse at center, rgba(201, 168, 76, 0.15), transparent 70%);
  pointer-events: none;
}
```

### 5.3 常驻动画规格

所有常驻动画使用 **infinite alternate** 模式，保持微妙的生命力但不干扰。

| 怪物 | Emoji | 动画类型 | 关键帧规格 | 时长 | 缓动 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 怨灵 | 👻 | 垂直浮动 | `translateY(0)` → `translateY(-3px)` | 2.5s | `ease-in-out` |
| 水鬼 | 🧟 | 左右摇摆 | `rotate(-1.5deg)` → `rotate(1.5deg)` | 3s | `ease-in-out` |
| 擎鬼 | 🧌 | 呼吸缩放 | `scale(1)` → `scale(1.04)` | 2s | `ease-in-out` |
| 食尸鬼 | 👹 | 呼吸 + 微抖 | `scale(1)` → `scale(1.03)` | 1.8s | `ease-in-out` |
| 狮鹫幼雏 | 🦅 | 翅膀暗示 | `scaleX(1)` → `scaleX(0.92)` | 0.8s | `ease-in-out` |
| 迪精（Boss）| 🧞 | 光环旋转 + 浮动 | `translateY(0) rotate(0deg)` → `translateY(-4px) rotate(3deg)` | 4s | `ease-in-out` |

```css
/* 示例：怨灵浮动 */
@keyframes ghost-float {
  0%   { transform: translateY(0); }
  100% { transform: translateY(-3px); }
}
.monster-ghost {
  animation: ghost-float 2.5s ease-in-out infinite alternate;
}

/* 示例：迪精 Boss 复合动画 */
@keyframes djinn-idle {
  0%   { transform: translateY(0) rotate(0deg); }
  50%  { transform: translateY(-4px) rotate(1.5deg); }
  100% { transform: translateY(0) rotate(3deg); }
}
.monster-djinn {
  animation: djinn-idle 4s ease-in-out infinite;
}
.monster-djinn::after {
  /* 迪精特有的旋转光环 — 用边框圆环实现 */
  content: '';
  position: absolute;
  inset: -6px;
  border: 2px solid rgba(201, 168, 76, 0.3);
  border-radius: 50%;
  border-top-color: rgba(201, 168, 76, 0.6);
  animation: spin 3s linear infinite;
}
```

**动画性能规则：**
- 只动画 `transform` 和 `opacity`，避免触发重排/重绘
- 禁止使用 `filter` 动画（`hue-rotate` 动画性能极差）
- 常驻动画叠加数量 ≤ 2 个，避免 CPU 占用过高

---

## 6. 动画与动效系统

### 6.1 核心动画清单

| 动画 | 触发条件 | 视觉表现 | 时长 | 缓动 | 备注 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **交换（Swap）** | 玩家拖拽/点击交换 | Tile 平滑位移到目标位置 | 200ms | `--ease-default` | 两个 Tile 同时移动 |
| **消除（Match）** | 匹配成功 | Tile 凹陷 → 缩小 → 淡出 | 400ms | `--ease-accelerate` | 见 `tile-vanish` 关键帧 |
| **下落（Cascade）** | 消除后填补 | Tile 从上方自然落下 | 300ms | `--ease-bounce-soft` | 落地时轻微回弹 |
| **生成（Spawn）** | 新 Tile 从顶部进入 | 从缩小到正常 + 渐显 | 250ms | `--ease-decelerate` | 新 Tile 从 `scale(0.8)` 开始 |
| **选中（Select）** | 玩家点击 Tile | 凸起变凹陷 + 微光边框 | 150ms | `--ease-default` | 见 `.tile.selected` |
| **错误交换（Reject）** | 交换后无匹配 | 两个 Tile 晃动后回原位 | 300ms | `cubic-bezier(.36,.07,.19,.97)` | 左右各晃 3px |
| **连锁（Combo）** | 连续匹配 | 每次连锁视觉强度递进 | — | — | 见下方专项 |

### 6.2 连锁消除视觉递进（Combo System）

连锁是游戏的"高潮时刻"，必须在视觉上有明确的递进感：

```
1 连锁（正常消除）：标准消除动画，无额外效果
2 连锁：消除时 Tile 边框闪现淡金色（--color-gold-300），持续时间 +50ms
3 连锁：消除时产生向外扩散的"冲击环"（CSS 伪元素 scale 动画），屏幕微震（translate 1px）
4+ 连锁：以上所有 + 全屏轻微金色脉冲（overlay div opacity 闪烁）+ 消除粒子数增加
```

```css
/* 冲击环效果 */
@keyframes shock-ring {
  0%   { transform: scale(0.5); opacity: 0.6; border-width: 3px; }
  100% { transform: scale(2.5); opacity: 0; border-width: 0; }
}
.combo-ring::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid var(--color-gold-400);
  border-radius: var(--radius-lg);
  animation: shock-ring 500ms var(--ease-accelerate) forwards;
  pointer-events: none;
}
```

### 6.3 拒绝动画（Error Shake）

交换无效时的反馈必须明确但不粗暴：

```css
@keyframes reject-shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-4px); }
  40%      { transform: translateX(4px); }
  60%      { transform: translateX(-3px); }
  80%      { transform: translateX(3px); }
}
.tile.reject {
  animation: reject-shake 300ms ease-in-out;
  /* 拒绝时短暂变回凸起 */
  box-shadow: var(--shadow-raised) !important;
}
```

---

## 7. 特效优先级与规格

### 7.1 优先级矩阵

| 优先级 | 特效 | 设计目标 | 实现方式 | 验收标准 |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | 匹配消除 | 核心爽感来源 | CSS 关键帧：凹陷→缩小→淡出 | 流畅 60fps，无卡顿 |
| **P0** | Tile 选中/悬停 | 操作手感 | 阴影切换 + 微位移 + 光边框 | 0.1s 内可感知 |
| **P0** | 连锁递进 | 高潮"Wow"感 | 冲击环 + 金色脉冲 + 递进增强 | 3 连以上明显感知强度差异 |
| **P1** | 特殊块提示 | 帮助识别 | 金色微光脉冲 | 不干扰正常游戏 |
| **P1** | 怪物击退 | 战斗反馈 | 怪物闪烁 + 微缩 + 红色边缘 | 0.2s 内完成 |
| **P1** | 资源增加飘字 | 收集反馈 | 数字向上飘 + 渐隐 | 清晰可读，不堆积 |
| **P2** | 迪精 Boss 战 | 氛围高潮 | 全屏暗角 + 金色粒子 + 迪精专属动画 | 锦上添花，不必须 |
| **P2** | 环境氛围（花瓣/晨风） | 情感沉浸 | CSS 粒子或背景动画 | 极低 CPU 占用 |

### 7.2 资源增加飘字（Floating Text）

```css
@keyframes float-up {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  30%  { transform: translateY(-10px) scale(1.1); opacity: 1; }
  100% { transform: translateY(-30px) scale(0.9); opacity: 0; }
}
.floating-text {
  position: absolute;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-gold-500);
  text-shadow: 0 1px 2px var(--color-shadow-40);
  animation: float-up 800ms var(--ease-accelerate) forwards;
  pointer-events: none;
  z-index: 100;
}
```

---

## 8. UI 框架视觉规范

### 8.1 棋盘容器

```css
.board-container {
  /* 棋盘外框 — 比 Tile 更深的凹陷感 */
  background: var(--surface-base);
  border-radius: var(--radius-xl);          /* 16px */
  padding: var(--board-padding);            /* 12px */
  box-shadow: var(--shadow-inset);           /* 内阴影 — 棋盘是"凹进去"的区域 */
  
  /* 内部网格 */
  display: grid;
  grid-template-columns: repeat(8, 60px);
  grid-template-rows: repeat(8, 60px);
  gap: var(--tile-gap);                     /* 8px */
}
```

**棋盘设计逻辑：** 棋盘整体是一个"凹陷的托盘"，Tile 是放在托盘上的"凸起的按钮"。这种凹凸对比是新拟态设计的经典手法。

### 8.2 HUD 面板

```css
.hud-panel {
  background: var(--surface-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-5);
  box-shadow: var(--shadow-raised);
}
```

**面板层级规则：**
- 一级面板（游戏主框架）：`--shadow-raised`
- 二级面板（弹窗/浮层）：`--shadow-hover` + 半透明遮罩 `rgba(26, 46, 37, 0.3)`
- 全屏覆盖（DayEnd / Repair）：`backdrop-filter: blur(4px)` + 暗色遮罩

---

## 9. 可访问性设计（Accessibility）

新拟态风格的天然弱点是对比度低，必须主动补偿：

### 9.1 对比度保障

| 场景 | 要求 | 检查方法 |
| :--- | :--- | :--- |
| UI 文字 on 面板背景 | ≥ 4.5:1（AA 级） | 在线对比度检查工具 |
| Emoji on Tile | ≥ 3:1（可豁免，因图形本身辨识） | 视觉测试 |
| 选中状态指示 | 不能仅依赖颜色，必须有形状变化 | 见 `.tile.selected::after` 边框 |
| 禁用状态 | 不能仅依赖颜色变化，必须有透明度变化 | 见 `.tile.disabled` |

### 9.2 减少动态（Reduced Motion）

```css
@media (prefers-reduced-motion: reduce) {
  .tile,
  .monster-tile,
  .floating-text {
    animation: none !important;
    transition: none !important;
  }
  /* 保留必要的状态切换，但移除动画 */
  .tile.matching { opacity: 0; }
}
```

### 9.3 色盲友好

6 种资源不能仅靠颜色区分，已有 Emoji 作为双重编码。确保：
- 每种资源的纹理形状独特（不只颜色不同）
- 怪物 Emoji 之间形态差异足够大

---

## 10. 参考与情绪板

### 10.1 视觉参考

| 来源 | 借鉴点 |
| :--- | :--- |
| Animal Crossing: New Horizons | 柔和低饱和色彩、精致 UI 间距、治愈氛围 |
| Dribbble "Neumorphism UI Kit"（绿色系）| 新拟态阴影参数、圆角与间距比例 |
| Monument Valley | 极简几何 + 温暖色调的情绪平衡 |
| Gridland（原版）| 三消与氛围融合的克制美学 |

### 10.2 情绪关键词

**舒适治愈** · **精致高级** · **静谧内敛** · **自然温润**

### 10.3 氛围描述

> 清晨的陶森特葡萄庄园，阳光以 45° 角柔和地洒在苔藓覆盖的石墙上。石墙上的每一块砖都有微微的凸起，手指触碰时会温柔地凹陷下去。Emoji 图标——葡萄、木材、草药——像是嵌在石墙上的彩色瓷片，在阳光下微微发亮。没有喧嚣，只有安静的修复与生长。

---

## 11. 技术约束与验收清单

### 11.1 硬约束

1. **零图片素材**：所有视觉效果仅用 CSS（渐变、阴影、滤镜、动画）+ Emoji/Unicode 实现
2. **性能上限**：64 Tile 同屏渲染，单帧渲染时间 < 16ms（60fps）
3. **禁止项**：
   - 图片文件（.png/.jpg/.svg/.webp 等）
   - `backdrop-filter` 在动画中的使用（性能杀手）
   - `box-shadow` 的动画（改用伪元素 opacity/scale 模拟）
   - `filter: hue-rotate()` 的动画（GPU 占用高）
   - 超过 3 层的 `box-shadow` 叠加

### 11.2 验收 Checklist

- [ ] 所有颜色值使用 CSS Variables，禁止硬编码十六进制
- [ ] 所有阴影参数与 Design Token 完全一致
- [ ] 6 种资源 Tile 在 0.3 秒内可辨识
- [ ] 选中状态的凹陷感清晰可见
- [ ] 消除动画 60fps 流畅，无掉帧
- [ ] 连锁 3 次以上有明显的视觉递进差异
- [ ] 文字对比度全部 ≥ 4.5:1
- [ ] `prefers-reduced-motion` 媒体查询已生效
- [ ] 移动端（如果支持）触控区域 ≥ 44×44px

---

## 附录：快速参考卡片

### 新拟态阴影速查

| 状态 | 外阴影（X Y Blur Color） | 内阴影 | 高光 |
| :--- | :--- | :--- | :--- |
| 凸起 | `6px 6px 12px rgba(26,46,37,0.15)` | 无 | `-4px -4px 8px rgba(255,255,255,0.55)` |
| 凹陷 | 无 | `inset 3px 3px 6px rgba(26,46,37,0.35)` | `inset -2px -2px 4px rgba(255,255,255,0.8)` |
| 悬浮 | `8px 8px 16px rgba(26,46,37,0.35)` | 无 | `-4px -4px 10px rgba(255,255,255,0.8)` |
| 发光 | `0 0 12px rgba(201,168,76,0.4)` | 无 | 保持基础高光 |

### 色彩速查

| 用途 | 色值 |
| :--- | :--- |
| 页面背景 | `#d6e0d4` |
| Tile 表面 | `linear-gradient(145deg, #c8d4c4, #a8c9b5)` |
| 主强调 | `#c9a84c`（暖金） |
| 最深阴影 | `#1a2e25` |
| 选中边框 | `#d4b86a` |

### 时序速查

| 场景 | 时长 | 缓动 |
| :--- | :--- | :--- |
| 悬停 | 150ms | `cubic-bezier(0.4, 0.0, 0.2, 1)` |
| 消除 | 400ms | `cubic-bezier(0.4, 0.0, 1.0, 1)` |
| 下落 | 300ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| 生成 | 250ms | `cubic-bezier(0.0, 0.0, 0.2, 1)` |
| 错误 | 300ms | `cubic-bezier(.36,.07,.19,.97)` |
