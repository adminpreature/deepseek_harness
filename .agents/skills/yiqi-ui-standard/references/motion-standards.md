# 动效和交互规范

本文档定义 OneSeven 跨产品共享的动效意图。整体节奏柔和舒缓，适当使用过渡与等待动效；具体实现服从任务效率、平台能力和产品信息密度。

---

## 核心动效原则

### 1. 所有交互必须有视觉反馈

用户的每一个操作都应该得到即时的视觉响应，让用户明确知道"系统收到了我的指令"。

**反馈类型：**
- **即时反馈**：按钮点击的颜色变化、缩放效果
- **进行中反馈**：加载 spinner、进度条、骨架屏
- **完成反馈**：成功提示、错误提示、Toast 消息

**反例（❌ 避免）：**
- 点击按钮后没有任何变化，用户不知道是否点击成功
- 提交表单后页面静止不动，用户不确定是否在处理
- 删除操作没有确认提示，用户误操作后无法撤销

### 2. 根据交互目的选择弹簧或固定时长

**适合使用弹簧：**
- 弹簧动效是**行为驱动**的，而非时间驱动
- 可以中途打断并自然过渡到新状态
- 更接近物理世界的运动规律，感觉更自然

抽屉、浮层、拖拽等具有空间关系或直接操控的组件可以使用轻微弹性。按钮、颜色、透明度、Tooltip 和等待反馈优先使用克制的固定时长或无弹性弹簧。

### 3. 可中断性（最重要原则）

用户应该能够随时打断正在进行的动画，系统立即响应新的输入。

**示例场景：**
- 抽屉正在关闭（50% 进度），用户再次点击打开 → 抽屉应该从当前位置反向运动，而非先完成关闭再打开
- 模态框正在淡入，用户点击背景关闭 → 立即开始淡出，继承当前的透明度和速度

**实现要点：**
- 使用 JavaScript 动画库（Framer Motion, Motion One, GSAP）
- 避免使用 CSS animation（无法中断）
- 使用 CSS transition 时要注意状态切换的连续性

### 4. 尊重用户的无障碍偏好

始终尊重 `prefers-reduced-motion` 媒体查询，为有前庭障碍的用户提供低运动量体验。减少位移、缩放、视差和弹性，保留有助于理解状态的短淡入淡出。

**全局处理方案：**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 120ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 120ms !important;
    scroll-behavior: auto !important;
  }

  [data-motion="spatial"] {
    transform: none !important;
  }
}
```

**注意：** 不要移除加载进度、完成、警告和错误反馈。减少动态效果时，用短淡入淡出替代大幅位移、弹性和循环缩放。

### 5. 等待动效表达真实进度

- 短暂且不可测的等待使用品牌紫 Spinner，不立即覆盖整个页面
- 内容区域加载优先使用与最终结构接近的中性骨架屏
- 可测任务使用进度条和明确的百分比或步骤
- 超过预期时间时解释正在处理什么，并提供取消、后台运行或重试能力
- 不使用持续跳动、快速闪烁、大面积渐变扫光或与真实进度无关的装饰循环
- 成功和失败必须有文字反馈，不能只改变颜色

---

## 弹簧参数标准（设计意图层）

以下标准使用 Framer Motion 的弹簧参数定义。这是**设计意图层**的规范，描述"我们希望动效有什么感觉"。

### 标准弹簧配置表

| 交互类型 | Spring 配置 | 说明 | 适用场景 |
|---------|------------|------|---------|
| **按钮点击反馈** | `{ type: "spring", duration: 0.2, bounce: 0 }` | 及时、无弹跳 | 所有按钮、链接、可点击卡片 |
| **Tooltip 进入** | `{ type: "spring", duration: 0.2, bounce: 0 }` | 快速出现，不喧宾夺主 | Tooltip、提示 |
| **下拉菜单展开** | `{ type: "spring", duration: 0.3, bounce: 0 }` | 柔和展开，无弹性 | Dropdown、Select、Popover |
| **模态框进入** | `{ type: "spring", duration: 0.5, bounce: 0.1 }` | 轻微弹性，建立空间层级 | Modal、Dialog、Alert |
| **抽屉滑出** | `{ type: "spring", duration: 0.6, bounce: 0.1 }` | 柔和、连续、可中断 | Drawer、Sidebar、Sheet |
| **页面切换** | `{ type: "spring", duration: 0.5, bounce: 0 }` | 平滑过渡，不打断阅读节奏 | 路由切换、Tab 切换 |
| **拖拽跟随** | `{ type: "spring", stiffness: 300, damping: 20 }` | 高响应，紧跟鼠标/手指 | 拖拽排序、滑块、拖动手柄 |
| **悬停反馈** | `{ type: "spring", duration: 0.2, bounce: 0 }` | 轻微位移或明度变化 | 可点击卡片、图标按钮 |

### 弹簧参数解释

**duration（推荐用法）：**
- 设计友好的参数，表示"大约多久到达目标"
- 单位：秒（如 0.4 表示 400ms）
- 适合大多数场景

**bounce（弹跳量）：**
- 范围：0（无弹跳）到 1（强烈弹跳）
- `0`：临界阻尼，无超调
- `0.1`：轻微弹性，专业感
- `0.25`：明显弹性，活泼感
- `0.5+`：强烈弹跳，俏皮感（谨慎使用）

**stiffness（弹簧刚度）和 damping（阻尼）：**
- 物理参数，更精确但更复杂
- `stiffness` 越高，弹簧越"硬"，响应越快
- `damping` 越高，阻力越大，越快稳定
- 典型值：`stiffness: 300, damping: 20`（跟随类交互）

---

## 平台降级策略

由于小程序和传统页面无法使用 JavaScript 弹簧库，需要使用 CSS 动画降级。

### 现代框架（React/Vue）- 使用真实弹簧

**Framer Motion 实现：**
```jsx
import { motion } from 'framer-motion';

// 模态框进入
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
>
  模态框内容
</motion.div>

// 按钮点击反馈
<motion.button
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", duration: 0.2, bounce: 0 }}
>
  点击我
</motion.button>

// 悬停放大
<motion.div
  whileHover={{ y: -1 }}
  transition={{ type: "spring", duration: 0.2, bounce: 0 }}
>
  卡片内容
</motion.div>
```

**Motion One 实现（轻量替代）：**
```javascript
import { animate, spring } from 'motion';

// 模态框进入
animate(
  '.modal',
  { opacity: [0, 1], y: [20, 0] },
  { easing: spring({ duration: 0.5, bounce: 0.1 }) }
);

// 按钮点击
button.addEventListener('click', () => {
  animate(
    button,
    { scale: [1, 0.95, 1] },
    { easing: spring({ duration: 0.2 }) }
  );
});
```

### 小程序/传统页面 - CSS 近似曲线

无法使用真实弹簧时，使用精心调校的 cubic-bezier 曲线近似弹簧效果。

**标准 Easing 曲线库：**

```css
/* === 进入动画（ease-out 类）=== */

/* 快速进入 - 对应 bounce: 0, duration: 0.2 */
--ease-out-quick: cubic-bezier(0.23, 1, 0.32, 1);

/* 流畅进入 - 对应 bounce: 0, duration: 0.3-0.5 */
--ease-out-smooth: cubic-bezier(0.32, 0.72, 0, 1);

/* 弹性进入 - 对应 bounce: 0.1, duration: 0.5-0.6 */
--ease-out-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);


/* === 退出动画（ease-in 类）=== */

/* 快速退出 */
--ease-in-quick: cubic-bezier(0.68, -0.55, 0.77, 0);

/* 流畅退出 */
--ease-in-smooth: cubic-bezier(0.32, 0, 0.67, 0);


/* === 位置移动（ease-in-out 类）=== */

/* 标准移动 - 对应抽屉、页面切换 */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

/* iOS 抽屉曲线（来自 Ionic Framework） */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

**小程序实现示例：**

```css
/* 模态框进入 */
.modal-enter {
  animation: modal-in 500ms var(--ease-out-bounce) forwards;
}

.modal-exit {
  animation: modal-out 300ms var(--ease-in-smooth) forwards;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modal-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* 按钮点击反馈（小程序） */
.button-active {
  transition: transform 200ms var(--ease-out-quick);
  transform: scale(0.95);
}
```

**传统页面实现示例：**

```css
/* 使用 CSS 自定义属性定义 easing */
:root {
  --ease-out-quick: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-out-smooth: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-out-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-in-smooth: cubic-bezier(0.32, 0, 0.67, 0);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}

/* 下拉菜单 */
.dropdown {
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 300ms var(--ease-out-smooth),
              transform 300ms var(--ease-out-smooth);
}

.dropdown.is-open {
  opacity: 1;
  transform: translateY(0);
}

/* 按钮悬停 */
.button {
  transition: transform 200ms var(--ease-out-quick),
              background 200ms var(--ease-out-quick);
}

.button:hover {
  transform: translateY(-1px);
  background: var(--color-primary-700);
}

.button:active {
  transform: scale(0.98);
}
```

---

## 时长速查表（无法使用弹簧时）

当完全无法使用 JavaScript 动画，只能用 CSS transition/animation 时，参考以下时长标准。

| 元素类型 | 时长 | Easing | 说明 |
|---------|------|--------|------|
| **按钮反馈** | 200ms | `cubic-bezier(0.23, 1, 0.32, 1)` | 及时响应，不拖沓 |
| **Tooltip** | 200ms | `cubic-bezier(0.23, 1, 0.32, 1)` | 轻快出现 |
| **下拉菜单** | 300ms | `cubic-bezier(0.32, 0.72, 0, 1)` | 柔和展开 |
| **模态框进入** | 500ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 建立层级，轻微弹性 |
| **模态框退出** | 350ms | `cubic-bezier(0.32, 0, 0.67, 0)` | 比进入更快 |
| **抽屉滑出** | 600ms | `cubic-bezier(0.32, 0.72, 0, 1)` | 大面积移动，柔和连续 |
| **抽屉收回** | 450ms | `cubic-bezier(0.32, 0, 0.67, 0)` | 退出比进入快 |
| **页面切换** | 500ms | `cubic-bezier(0.77, 0, 0.175, 1)` | 平滑过渡 |
| **Toast 消息** | 300ms | `cubic-bezier(0.23, 1, 0.32, 1)` | 快速出现和消失 |

**时长规则：**
- **UI 反馈类**（按钮、链接）：约 200ms，保持及时
- **内容展示类**（菜单、提示）：200-300ms，柔和但不慢
- **大型组件**（模态框、抽屉）：350-600ms，建立空间连续性
- **页面级动画**（路由切换）：约 500ms，避免突兀
- **避免超过 600ms**：除非动画直接跟随用户手势

---

## 交互反馈完整性清单

确保所有交互都有完整的视觉反馈。

### ✅ 按钮交互状态

```css
.button {
  /* 默认态 */
  background: var(--color-primary);
  transition:
    background-color 200ms var(--ease-out-quick),
    transform 200ms var(--ease-out-quick);
}

.button:hover {
  /* 悬停态 - 颜色稍深或略微上移 */
  background: var(--color-primary-700);
  transform: translateY(-1px);
}

.button:active {
  /* 点击态 - 缩小或下压 */
  transform: scale(0.98);
}

.button:disabled {
  /* 禁用态 - 降低不透明度，禁用鼠标事件 */
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.button:focus-visible {
  /* 键盘焦点态 - 外轮廓 */
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### ✅ 表单输入反馈

```css
.input {
  border: 1px solid var(--color-neutral-200);
  transition: border-color 200ms, box-shadow 200ms;
}

.input:hover {
  border-color: var(--color-neutral-400);
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.input.is-error {
  border-color: var(--color-danger);
}

.input.is-success {
  border-color: var(--color-success);
}
```

### ✅ 加载状态

**场景一：按钮加载**
```jsx
<button disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner className="mr-2" />
      <span>提交中...</span>
    </>
  ) : (
    '提交'
  )}
</button>
```

**场景二：内容加载（骨架屏）**
```jsx
{isLoading ? (
  <div className="skeleton">
    <div className="skeleton-line" />
    <div className="skeleton-line" />
    <div className="skeleton-line w-2/3" />
  </div>
) : (
  <ArticleContent />
)}
```

**场景三：页面加载（Spinner）**
```jsx
{isLoading && (
  <div className="loading-overlay">
    <Spinner size="large" />
  </div>
)}
```

### ✅ 表单反馈

**成功反馈：**
```jsx
// Toast 提示
toast.success('保存成功！');

// 或 inline 提示
<div className="alert alert-success">
  ✓ 您的更改已保存
</div>
```

**错误反馈：**
```jsx
// 表单级错误
<div className="alert alert-error">
  ✗ 提交失败：{errorMessage}
</div>

// 字段级错误
<input className="is-error" />
<span className="error-message">请输入有效的邮箱地址</span>
```

### ✅ 危险操作确认

```jsx
// 删除确认
const handleDelete = () => {
  if (confirm('确定要删除这条记录吗？此操作无法撤销。')) {
    deleteItem();
  }
};

// 或使用模态框确认
<ConfirmDialog
  title="删除确认"
  message="确定要删除这条记录吗？此操作无法撤销。"
  confirmText="删除"
  confirmVariant="danger"
  onConfirm={deleteItem}
/>
```

---

## 性能优化原则

### 使用 GPU 加速属性

优先使用 `transform` 和 `opacity`，避免触发重排（reflow）。

**✅ 推荐：**
```css
/* 使用 transform（GPU 加速） */
.element {
  transform: translateY(10px);
  transition: transform 200ms;
}
```

**❌ 避免：**
```css
/* 使用 top/left（触发重排） */
.element {
  top: 10px;
  transition: top 200ms;
}
```

### 避免 Layout Thrashing

不要在循环中混合读取和写入样式。

**❌ 错误：**
```javascript
elements.forEach(el => {
  const height = el.offsetHeight; // 读取（触发重排）
  el.style.height = height + 10 + 'px'; // 写入（触发重排）
});
```

**✅ 正确：**
```javascript
// 先读取
const heights = elements.map(el => el.offsetHeight);

// 再写入
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px';
});
```

### 使用 will-change 提示浏览器

对于即将发生动画的元素，提前告知浏览器优化。

```css
.modal {
  /* 准备阶段 */
  will-change: transform, opacity;
}

.modal.is-animating {
  /* 动画进行中 */
  transform: translateY(0);
  opacity: 1;
}

.modal.animation-done {
  /* 动画结束后移除 will-change */
  will-change: auto;
}
```

**注意：** 不要滥用 `will-change`，只在确实需要动画的元素上使用，动画结束后记得移除。

---

## 平台特定注意事项

### 小程序平台

**限制：**
- 不支持复杂的 CSS 动画（如多步 keyframes）
- 部分机型性能较差，动画可能卡顿
- 不支持 JavaScript 动画库

**建议：**
- 使用简单的 transition 而非 animation
- 动画时长适当缩短（减少 50-100ms）
- 避免同时动画多个属性
- 使用 rpx 单位时注意不同屏幕的表现

**示例：**
```css
/* 小程序中的简化动画 */
.button {
  transition: background 150ms ease-out; /* 只动画背景色 */
}

.modal {
  transition: opacity 300ms, transform 300ms; /* 最多两个属性 */
}
```

### 传统页面（IE 兼容）

如果需要兼容旧版浏览器：

**降级方案：**
```css
.element {
  /* 现代浏览器 */
  transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

/* IE10/11 降级 */
@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  .element {
    transition: all 200ms ease-out; /* 使用简单 easing */
  }
}
```

---

## 常见问题

### Q1: 什么时候用弹簧，什么时候用固定时长？

**用弹簧：**
- 需要可中断的交互（抽屉、拖拽）
- 跟随鼠标/手指的效果
- 追求极致流畅感的场景

**用固定时长：**
- 简单的淡入淡出
- 小程序等无法使用 JS 动画的平台
- 性能敏感场景（大量元素同时动画）

### Q2: 弹簧的 bounce 参数如何选择？

- `bounce: 0`：适合 95% 的场景，专业、克制
- `bounce: 0.1`：轻微弹性，适合强调重要操作
- `bounce: 0.25+`：明显弹跳，适合游戏化、儿童产品
- **建议：** 从 0 开始，只在需要时逐步增加

### Q3: 动效太慢或太快怎么办？

**太慢（用户感觉迟缓）：**
- 减少 duration（如 0.5 → 0.3）
- 增加 stiffness（如 300 → 400）

**太快（用户看不清）：**
- 增加 duration（如 0.2 → 0.3）
- 减少 stiffness（如 400 → 300）

**最佳实践：** 在真实设备上测试，不同设备性能差异可能导致体感不同。
