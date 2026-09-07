# 分平台实现指南

## 共同约束

- 默认只实现暗色主题
- 品牌 Token 来源为 `design-tokens.json`
- Web 优先复用 `theme.css`
- 卡片使用 36px Web 降级圆角和连续曲率增强
- 控件圆角不继承卡片圆角
- 用户选择液态玻璃时才启用透明材质
- 不支持背景模糊、连续曲率或减少透明查询的平台，降级为实体暗色卡片

## React / Vue / 传统 Web

```css
@import "./theme.css";

html {
  color-scheme: dark;
  font-family: var(--font-sans);
  background: var(--color-bg-page);
  color: var(--color-text-primary);
}

[data-ui-card] {
  border-radius: var(--radius-card);
  corner-shape: squircle;
}

[data-ui-card-material="solid"] [data-ui-card] {
  background: var(--card-solid-bg);
  border: 1px solid var(--card-solid-border);
  box-shadow: var(--card-solid-shadow);
}

[data-ui-card-material="liquid-glass"] [data-ui-card] {
  background: var(--card-glass-bg);
  border: 1px solid var(--card-glass-border);
  backdrop-filter:
    blur(var(--card-glass-blur))
    saturate(var(--card-glass-saturation));
}

:where(a, button, input, select, textarea):focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

@media (prefers-reduced-transparency: reduce) {
  [data-ui-card-material="liquid-glass"] [data-ui-card] {
    background: var(--card-solid-bg);
    backdrop-filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
```

Tailwind 项目在主题扩展中映射：

```javascript
export default {
  theme: {
    extend: {
      colors: {
        page: "#09090B",
        surface: "#141418",
        elevated: "#1B1B20",
        brand: "#9A6ABA",
      },
      borderRadius: {
        card: "36px",
      },
      fontFamily: {
        sans: ["Alibaba PuHuiTi", "system-ui", "sans-serif"],
      },
    },
  },
};
```

## 小程序

```css
page {
  background: #09090b;
  color: #f5f5f7;
}

.ui-card {
  border-radius: 72rpx;
  background: #141418;
  border: 1rpx solid #2e2e35;
}
```

小程序默认使用实体暗色卡片。仅在目标运行时明确支持且通过真机对比度验证时实现透明材质。

## React Native

```javascript
export const uiTheme = {
  colors: {
    page: "#09090B",
    surface: "#141418",
    elevated: "#1B1B20",
    textPrimary: "#F5F5F7",
    textSecondary: "#B8B8C0",
    border: "#2E2E35",
    brand: "#9A6ABA",
  },
  radius: {
    card: 36,
  },
};
```

React Native 默认使用实体暗色卡片。只有已有可靠模糊组件、减少透明设置映射和真机验证时才实现液态玻璃。

## 验证

所有平台检查默认暗色、字体、标题范围、卡片曲率、焦点或可访问状态、等待和错误状态。Web 额外运行 `scripts/validate-generated-web.mjs` 和 Playwright 桌面/移动验收。

外部样式表、复杂 CSS 级联、非 px 单位或长度计算、字体加载和不确定的视觉判断由浏览器验收，不要求静态校验器证明。
