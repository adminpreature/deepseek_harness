# 访谈式引导工作流

当用户首次使用 yiqi-ui-standard skill 或明确要求"建立标准"、"初始化规范"时，使用此工作流引导用户逐步建立完整的设计系统。

---

## 工作流概览

访谈分为 5 个阶段，每个阶段专注于一个主题：

1. **品牌基础访谈**：确定品牌色、字体、风格定位
2. **色阶生成与确认**：基于主色自动生成完整色板
3. **间距和尺寸访谈**：确定布局风格和组件尺寸偏好
4. **动效偏好访谈**：确定动画风格和交互节奏
5. **生成完整规范**：输出 Design Tokens 和配置文件

**预计耗时：** 10-15 分钟（取决于用户准备程度）

**输出成果：**
- 更新 `visual-system.md` 的品牌基础层
- 更新 `motion-standards.md` 的具体参数
- 可选生成：`design-tokens.json`、`tailwind.config.js`、`theme.css`

---

## 阶段 1：品牌基础访谈

### Q1: 品牌主色

**问题：**
> 你们的品牌主色是什么？
> 
> 可以提供：
> - HEX 色值（如 `#3B82F6`）
> - RGB 值（如 `rgb(59, 130, 246)`）
> - 颜色名称（如"科技蓝"、"深蓝色"）
> - 或者描述性词汇（如"偏冷的蓝色"、"活力橙"）

**处理逻辑：**
- 如果提供精确色值 → 直接使用
- 如果提供颜色名称 → 转换为常见色值并确认（如"科技蓝" → `#3B82F6`，询问"是这个色值吗？"）
- 如果提供描述 → 给出 2-3 个候选色，让用户选择

**示例对话：**
```
用户："我们用的是科技蓝"
AI："科技蓝通常是 #3B82F6（类似 Tailwind 的 blue-500），是这个色值吗？"
用户："对的"
AI："好的，已记录主色为 #3B82F6"
```

### Q2: 品牌辅助色

**问题：**
> 除了主色，你们是否有辅助色？
> 
> 辅助色通常用于：
> - 成功提示（绿色）
> - 警告提示（黄色/橙色）
> - 错误提示（红色）
> - 信息提示（蓝色/灰色）
> 
> 如果没有特别指定，我可以基于行业最佳实践为你生成。

**处理逻辑：**
- 如果用户提供 → 记录具体色值
- 如果用户说"用常规的就行" → 使用语义化标准色：
  - Success: `#10B981`（绿色）
  - Warning: `#F59E0B`（琥珀色）
  - Danger: `#EF4444`（红色）
  - Info: `#3B82F6`（蓝色，可以与主色相同）

### Q3: 主要字体

**问题：**
> 你们使用什么字体？
> 
> 常见选择：
> - **中文字体**：PingFang SC（苹果系统默认）、思源黑体、微软雅黑
> - **英文字体**：SF Pro（苹果）、Segoe UI（微软）、Inter（Web 常用）、Roboto（Google）
> - **代码字体**：SF Mono、Consolas、Menlo
> 
> 如果不确定，我建议使用系统默认字体栈以获得最佳性能。

**处理逻辑：**
- 记录用户指定的字体
- 自动补充完整的 font-family 栈（包含回退字体）
- 示例：
  ```css
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, 
               "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  ```

### Q4: 产品风格定位

**问题：**
> 你们的产品风格偏向哪种感觉？这会影响间距、圆角、阴影等细节。
> 
> 选项：
> A. **现代科技**：大圆角、充足留白、微妙阴影（如 Notion、Linear）
> B. **温暖亲和**：中等圆角、舒适间距、柔和色彩（如 Airbnb、Slack）
> C. **专业严谨**：小圆角/直角、紧凑布局、高对比度（如企业 ERP、金融系统）
> D. **活泼年轻**：大胆配色、较大元素、强烈对比（如社交、游戏类产品）

**映射关系：**
| 风格 | 圆角 | 间距系数 | 阴影 | 字重 |
|------|------|---------|------|------|
| 现代科技 | 12px (lg) | 宽松（1.25x） | 微妙、大范围 | Medium/Semibold |
| 温暖亲和 | 8px (md) | 标准（1x） | 柔和、中等 | Regular/Medium |
| 专业严谨 | 4px (sm) | 紧凑（0.875x） | 清晰、小范围 | Medium/Bold |
| 活泼年轻 | 16px (xl) | 宽松（1.25x） | 强烈、彩色 | Bold/Extrabold |

---

## 阶段 2：色阶生成与确认

### 自动生成色阶

基于用户提供的主色，使用 HSL 色彩空间生成 50-900 共 10 个色阶。

**生成算法（类似 Tailwind）：**

```javascript
// 伪代码示例
function generateColorScale(baseColor) {
  const hsl = hexToHSL(baseColor);
  
  return {
    50:  adjustLightness(hsl, 95),  // 非常浅
    100: adjustLightness(hsl, 90),
    200: adjustLightness(hsl, 80),
    300: adjustLightness(hsl, 70),
    400: adjustLightness(hsl, 60),
    500: baseColor,                  // 基准色
    600: adjustLightness(hsl, 45),
    700: adjustLightness(hsl, 35),
    800: adjustLightness(hsl, 25),
    900: adjustLightness(hsl, 15),   // 非常深
  };
}
```

**展示给用户确认：**

```markdown
基于你提供的主色 #3B82F6，我生成了完整的色阶：

| 色阶 | 色值 | 预览 | 典型用途 |
|------|------|------|---------|
| 50  | #EFF6FF | 🟦 | 浅色背景 |
| 100 | #DBEAFE | 🟦 | 悬停背景 |
| 200 | #BFDBFE | 🟦 | 选中态背景 |
| 300 | #93C5FD | 🟦 | 次要元素 |
| 400 | #60A5FA | 🟦 | 悬停态 |
| 500 | #3B82F6 | 🟦 | **主色（基准）** |
| 600 | #2563EB | 🟦 | 按钮默认色 |
| 700 | #1D4ED8 | 🟦 | 深色元素 |
| 800 | #1E40AF | 🟦 | 强调文本 |
| 900 | #1E3A8A | 🟦 | 深色背景 |

这个色阶是否符合预期？
- 回答"是"继续
- 如果觉得某个色阶太浅或太深，可以告诉我调整
```

**调整选项：**
- "50-200 色阶太灰了" → 增加饱和度
- "800-900 太暗了" → 提高亮度
- "整体偏紫" → 微调色相

---

## 阶段 3：间距和尺寸访谈

### Q5: 布局松紧度

**问题：**
> 你们偏好紧凑还是宽松的布局？
> 
> - **紧凑**：适合信息密度高的产品（如后台管理、数据看板）
> - **标准**：平衡信息密度和舒适度（大多数产品的选择）
> - **宽松**：适合阅读和内容展示类产品（如博客、营销页面）

**映射关系：**
| 偏好 | 基础间距单位 | 组件内边距 | 组件外边距 | 栅格间隙 |
|------|-------------|-----------|-----------|---------|
| 紧凑 | 4px | 8px / 12px | 12px | 16px |
| 标准 | 4px | 12px / 16px | 16px | 24px |
| 宽松 | 4px | 16px / 24px | 24px | 32px |

### Q6: 按钮默认尺寸

**问题：**
> 按钮的默认尺寸感觉应该偏大还是偏小？
> 
> 参考：
> - **小**：高度 32px，适合后台密集操作
> - **中**：高度 40px，通用选择
> - **大**：高度 48px，适合移动端或强调操作

**记录并生成按钮尺寸系统：**
```javascript
{
  xs: { height: '28px', padding: '4px 12px', fontSize: '12px' },
  sm: { height: '32px', padding: '6px 16px', fontSize: '14px' },
  md: { height: '40px', padding: '10px 20px', fontSize: '14px' }, // 默认
  lg: { height: '48px', padding: '12px 24px', fontSize: '16px' },
  xl: { height: '56px', padding: '16px 32px', fontSize: '18px' },
}
```

---

## 阶段 4：动效偏好访谈

### Q7: 动效节奏

**问题：**
> 你们希望产品的动效节奏是怎样的？
> 
> A. **快速响应**（< 200ms）：干脆利落，适合效率工具
> B. **流畅优雅**（300-500ms）：舒适观感，适合内容产品
> C. **混合**：界面反馈快速（按钮 150ms），大型组件流畅（模态框 400ms）

**建议：** 90% 的产品应该选择"混合"，这是最佳实践。

**映射到具体参数：**
| 节奏偏好 | 按钮反馈 | 下拉菜单 | 模态框 | 抽屉 |
|---------|---------|---------|--------|------|
| 快速响应 | 100ms | 150ms | 250ms | 350ms |
| 流畅优雅 | 200ms | 300ms | 500ms | 600ms |
| 混合（推荐） | 150ms | 250ms | 400ms | 500ms |

### Q8: 弹性效果

**问题：**
> 是否喜欢轻微的弹性效果（bounce）？
> 
> - **无弹性**（bounce: 0）：专业、克制，适合企业产品
> - **轻微弹性**（bounce: 0.1）：现代、精致，推荐选项
> - **明显弹性**（bounce: 0.25）：活泼、年轻，适合C端产品

**示例动画演示：**
如果可能，展示 3 个级别的动画效果让用户直观感受（通过代码生成简单的 HTML 预览）。

---

## 阶段 5：生成完整规范

### 汇总确认

在生成前，向用户展示汇总信息确认：

```markdown
## 设计系统配置汇总

### 品牌基础
- **主色：** #3B82F6（科技蓝）
- **辅助色：** 成功 #10B981 / 警告 #F59E0B / 错误 #EF4444
- **主字体：** PingFang SC, -apple-system, sans-serif
- **风格定位：** 现代科技

### 布局系统
- **布局风格：** 标准松紧度
- **基础间距单位：** 4px
- **按钮默认尺寸：** 中等（40px 高）

### 动效系统
- **节奏：** 混合（按钮快 150ms，模态框流畅 400ms）
- **弹性：** 轻微弹性（bounce: 0.1）

---

确认无误后，我将生成以下文件：
1. 更新 `visual-system.md` - 填充品牌基础层
2. 更新 `motion-standards.md` - 设置具体动效参数
3. 生成 `design-tokens.json` - 可导入设计工具
4. （可选）生成 `tailwind.config.js` - Tailwind 配置
5. （可选）生成 `theme.css` - CSS 变量定义

是否继续生成？
```

### 生成 Design Tokens

```json
{
  "colors": {
    "primary": {
      "50": "#EFF6FF",
      "100": "#DBEAFE",
      "200": "#BFDBFE",
      "300": "#93C5FD",
      "400": "#60A5FA",
      "500": "#3B82F6",
      "600": "#2563EB",
      "700": "#1D4ED8",
      "800": "#1E40AF",
      "900": "#1E3A8A"
    },
    "success": { "DEFAULT": "#10B981" },
    "warning": { "DEFAULT": "#F59E0B" },
    "danger": { "DEFAULT": "#EF4444" },
    "neutral": {
      "50": "#F9FAFB",
      "100": "#F3F4F6",
      "200": "#E5E7EB",
      "300": "#D1D5DB",
      "400": "#9CA3AF",
      "500": "#6B7280",
      "600": "#4B5563",
      "700": "#374151",
      "800": "#1F2937",
      "900": "#111827"
    }
  },
  "spacing": {
    "0": "0",
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
    "16": "64px"
  },
  "borderRadius": {
    "none": "0",
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "full": "9999px"
  },
  "fontFamily": {
    "sans": ["PingFang SC", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
    "mono": ["SF Mono", "Consolas", "Menlo", "monospace"]
  },
  "fontSize": {
    "xs": "12px",
    "sm": "14px",
    "base": "16px",
    "lg": "18px",
    "xl": "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px"
  },
  "motion": {
    "duration": {
      "fast": "150ms",
      "base": "250ms",
      "slow": "400ms",
      "slower": "500ms"
    },
    "easing": {
      "out": "cubic-bezier(0.23, 1, 0.32, 1)",
      "in": "cubic-bezier(0.32, 0, 0.67, 0)",
      "inOut": "cubic-bezier(0.77, 0, 0.175, 1)"
    },
    "spring": {
      "bounce": 0.1,
      "button": { "duration": 0.15, "bounce": 0 },
      "modal": { "duration": 0.4, "bounce": 0.1 },
      "drawer": { "duration": 0.5, "bounce": 0 }
    }
  }
}
```

### 生成 Tailwind 配置（可选）

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          DEFAULT: '#3B82F6',
        },
        success: { DEFAULT: '#10B981' },
        warning: { DEFAULT: '#F59E0B' },
        danger: { DEFAULT: '#EF4444' },
      },
      fontFamily: {
        sans: ['PingFang SC', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['SF Mono', 'Consolas', 'Menlo', 'monospace'],
      },
      spacing: {
        '4.5': '18px',
        '18': '72px',
      },
      borderRadius: {
        'xl': '16px',
      },
      transitionDuration: {
        '150': '150ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'out-quick': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-smooth': 'cubic-bezier(0.32, 0, 0.67, 0)',
      },
    },
  },
  plugins: [],
}
```

### 生成 CSS 变量（可选）

```css
/* theme.css */
:root {
  /* 颜色 */
  --color-primary-50: #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-200: #BFDBFE;
  --color-primary-300: #93C5FD;
  --color-primary-400: #60A5FA;
  --color-primary-500: #3B82F6;
  --color-primary-600: #2563EB;
  --color-primary-700: #1D4ED8;
  --color-primary-800: #1E40AF;
  --color-primary-900: #1E3A8A;
  --color-primary: var(--color-primary-500);
  
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  
  /* 间距 */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  
  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  /* 字体 */
  --font-sans: "PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "SF Mono", Consolas, Menlo, monospace;
  
  /* 字号 */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  
  /* 动效 */
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;
  
  --easing-out: cubic-bezier(0.23, 1, 0.32, 1);
  --easing-in: cubic-bezier(0.32, 0, 0.67, 0);
  --easing-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}
```

---

## 访谈技巧

### 如何应对不确定的用户

**场景：** 用户回答"不知道"、"你帮我决定"

**策略：** 提供带推荐的默认值

```
我理解你可能还没有明确的想法。基于你们的行业和产品类型，
我建议使用以下配置（这是大多数现代产品的选择）：

- 主色：#3B82F6（科技蓝，专业且现代）
- 风格：现代科技（大圆角、充足留白）
- 动效：混合节奏（界面反馈快速，大组件流畅）

这套配置已经在数千款产品中验证过，我们可以先用这个起步，
后续根据实际使用感受调整。是否接受这个推荐？
```

### 如何加速访谈流程

对于有经验的用户，可以提供"快速模式"：

```
看起来你对设计系统已经很了解了。我可以提供一个快速配置表单，
一次性填写所有参数，跳过逐步引导。是否使用快速模式？

【快速配置表单】
主色：_______
辅助色：成功 _______ / 警告 _______ / 错误 _______
字体：_______
风格：[ ] 现代科技 [ ] 温暖亲和 [ ] 专业严谨 [ ] 活泼年轻
间距：[ ] 紧凑 [ ] 标准 [ ] 宽松
按钮尺寸：[ ] 小(32px) [ ] 中(40px) [ ] 大(48px)
动效节奏：[ ] 快速 [ ] 流畅 [ ] 混合
弹性：[ ] 无(0) [ ] 轻微(0.1) [ ] 明显(0.25)
```

---

## 后续维护

访谈完成并生成规范后，提醒用户：

```markdown
✅ 设计系统已初始化完成！

**下一步可以做什么：**
1. 使用 `/yiqi-ui-standard` + 描述需求，生成符合标准的组件代码
2. 使用 `/yiqi-ui-standard` + 现有代码，检查是否符合规范
3. 随时可以重新运行访谈流程更新规范（建议在团队达成共识后再修改）

**提示：** 
- Design Tokens 已生成在 `design-tokens.json`，可以导入 Figma、Sketch 等设计工具
- 如果你使用 Tailwind，可以直接复制 `tailwind.config.js` 到项目中
- 建议将这些配置文件纳入版本控制，确保全团队同步

有任何问题随时问我！
```
