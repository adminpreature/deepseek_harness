# OneSeven 视觉设计系统规范

本文档定义壹柒研究所跨产品共享的品牌基础和可复用设计意图。Logo、品牌字体、品牌紫定位、默认暗色、排版角色范围与卡片连续大圆角属于共享硬边界；布局密度、控件尺寸和信息结构由产品场景决定。

---

## 品牌基础层

### 品牌定位

**当前定位：** 安静、清晰、克制、任务导向。

不同产品应保持相同品牌气质，但不复制同一套页面模板：

- 官网可以宽松、有更强的品牌叙事
- AI 工具可以采用标准密度和持续操作界面
- 管理后台可以紧凑，以扫描、比较和批量操作效率为先
- 同一产品内部的颜色角色、组件状态和交互方式必须稳定

### 品牌主色

**品牌紫：** `#9A6ABA`

品牌紫用于焦点、选中、关键操作、信息状态和少量品牌强调，不作为大面积背景的默认颜色。

**精简色阶：**
```javascript
primary: {
  100: '#F3ECF7', // 浅色背景、选中态背景
  500: '#9A6ABA', // 品牌基准、图标、大号文字
  700: '#68447F', // 小号文字、按钮、强调状态
}
```

### 默认主题与语义色

生成默认使用暗色主题；只有用户明确提出浅色主题时才生成浅色版本。暗色不是对浅色机械反转，而是 `design-tokens.json` 的默认语义映射。

| 角色 | 数值 | 用途 |
|------|------|------|
| page | `#09090B` | 页面底色 |
| surface | `#141418` | 实体卡片与基础表面 |
| elevated | `#1B1B20` | 浮层和抬升表面 |
| subtle | `#222228` | 次级背景、悬停和弱分区 |
| border / border strong | `#2E2E35` / `#44444D` | 默认与强调边界 |
| text primary | `#F5F5F7` | 标题和高强调文本 |
| text secondary | `#B8B8C0` | 正文和说明 |
| text tertiary | `#81818A` | 辅助文本和占位符 |

只保留三组有彩色，避免状态色过多：

| 语义 | 暗色强调 | 暗色低强调背景 | 用途 |
|------|---------|---------------|------|
| primary / info | `#9A6ABA` | `rgba(154, 106, 186, 0.16)` | 品牌、信息、焦点、选中 |
| success | `#72B596` | `rgba(50, 122, 91, 0.18)` | 成功、通过、完成；边框使用 `#327A5B` |
| danger | `#DF7B89` | `rgba(185, 74, 90, 0.18)` | 错误、删除、不可逆操作；边框使用 `#B94A5A` |

**警告状态不新增橙色：**

- 使用中性背景和高对比正文
- 配合明确的警告图标、标题和操作文案
- 风险升级为错误或不可逆操作时，使用 danger
- 状态不能只依赖颜色传达

### 中性色

原有 `neutral-50` 至 `neutral-900` 色阶继续作为兼容和明确请求的浅色主题基础，但业务代码默认使用暗色语义别名，不直接把浅色中性色写入组件。

### 字体

**品牌与中文主字体：** `Alibaba PuHuiTi`
**英文回退字体：** 系统字体
**代码字体：** `SF Mono`

字体文件已内置在 `../assets/fonts/`：

| 字体文件 | CSS 字重 | 用途 |
|----------|----------|------|
| `AlibabaPuHuiTi-3-35-Thin.woff2` | 200 | 品牌展示、大字号标题 |
| `AlibabaPuHuiTi-3-55-Regular.woff2` | 400 | 正文 |
| `AlibabaPuHuiTi-3-65-Medium.woff2` | 500 | 按钮、强调文字 |
| `AlibabaPuHuiTi-3-75-SemiBold.woff2` | 600 | 标题、关键状态 |

`theme.css` 已包含对应 `@font-face`。复制主题文件时必须保持 `assets/fonts/` 相对路径，或同步调整字体 URL。

**完整字体栈：**
```css
--font-sans: "Alibaba PuHuiTi", -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "SF Mono", Consolas, Menlo, Monaco, "Courier New", monospace;
```

### Logo 使用规范

| 项目 | 规范 |
|------|------|
| 正式资产 | `../assets/oneseven-logo.png` |
| 颜色 | 浅色背景使用黑色，暗色背景使用白色反相 |
| 尺寸 | 以轮廓清晰、不拥挤为准；24px 高可作为常规界面的起始参考 |
| 安全间距 | 建议至少保留 Logo 高度 50% 的空白，狭窄场景可按清晰度调整 |
| 禁止操作 | 拉伸、旋转、描边、渐变填充、发光、无意义阴影、默认紫色填充 |

---

## Design Tokens 体系

Tokens 是平台无关的设计决策。各平台通过 `platform-implementations.md` 中的方式落地。

### 命名原则

- **语义化优先**：用 `primary` 而非 `blue`，用 `danger` 而非 `red`
- **精简层级**：100 为浅色背景，500 为基准强调，700 为深色文字和按钮
- **业务代码使用 token**：特殊视觉实验应先形成产品级 token，再进入业务代码

### 颜色 Tokens

**结构：**
```
color-{语义}-{强度}

示例：
color-primary-500
color-neutral-200
color-danger-700
```

**语义别名（推荐在业务代码中使用）：**

| 别名 | 指向 | 用途 |
|------|------|------|
| `color-text-primary` | dark text primary | 标题、重点文本 |
| `color-text-secondary` | dark text secondary | 正文、说明文本 |
| `color-text-tertiary` | dark text tertiary | 辅助文本、占位符 |
| `color-text-inverse` | white | 深色中性背景上的反色文本 |
| `color-text-on-accent` | dark page | 品牌色或危险色实心操作上的高对比文本 |
| `color-bg-page` | dark page | 页面背景 |
| `color-bg-surface` | dark surface | 实体卡片、面板背景 |
| `color-bg-elevated` | dark elevated | 浮层和抬升区域 |
| `color-bg-subtle` | dark subtle | 悬停、弱分区背景 |
| `color-bg-selected` | primary / 16% | 选中、按下背景 |
| `color-border-default` | dark border | 默认边框 |
| `color-border-strong` | dark border strong | 强调边框 |
| `color-border-focus` | primary-500 | 焦点边框 |

业务代码始终使用语义别名。浅色主题只有用户明确要求时才重新映射，不能成为生成默认值。

### 间距 Tokens

**参考基础单位：4px。** 共享 token 优先使用 4px 级进，但具体产品可以为排版、栅格或平台适配建立局部值。

| Token | 数值 | 典型用途 |
|-------|------|---------|
| `spacing-0` | 0 | 重置间距 |
| `spacing-1` | 4px | 图标与文字间隙、极小间距 |
| `spacing-2` | 8px | 紧凑内边距、标签内边距 |
| `spacing-3` | 12px | 小按钮内边距、列表项间距 |
| `spacing-4` | 16px | **标准内边距（最常用）** |
| `spacing-5` | 20px | 中等间距 |
| `spacing-6` | 24px | 卡片内边距、组件间距 |
| `spacing-8` | 32px | 区块间距 |
| `spacing-10` | 40px | 大区块间距 |
| `spacing-12` | 48px | Section 间距 |
| `spacing-16` | 64px | 页面级间距 |
| `spacing-20` | 80px | 大页面留白 |
| `spacing-24` | 96px | 首屏留白 |

**判断原则：**

- 不因单个值不是 4px 倍数直接判错
- 同类元素出现无理由的细小差异时，应收敛为局部 token
- 数值变化造成对齐、响应式或维护问题时，优先修复
- 1px 边框、负边距对齐和高清屏细线可以独立使用

### 密度 Profiles

| Profile | 典型产品 | 控件高度参考 | 组件内边距 | 组件间距 | 栅格间隙 |
|---------|---------|-------------|-----------|---------|---------|
| compact | 管理后台、密集工具栏 | 32px | 8px / 12px | 12px | 16px |
| standard | AI 工具、个人中心 | 40px | 12px / 16px | 16px | 24px |
| spacious | 官网、内容展示 | 48px | 16px / 24px | 24px | 32px |

Profile 是产品级起点，不是跨产品硬性尺寸。移动端触控目标应保证足够点击区域，可通过外层 hit area 补足。

### 排版角色范围

基础字号 token 可用于正文和控件，但标题生成必须按角色选择，不得用视口宽度无限放大。

基础 `text-5xl` 为 42px，行高为 48px，不得超过排版角色上限，也不能作为绕过 Marketing H1 最大值的另一套标题接口。

| 角色 | 桌面范围 | 移动范围 | 用途 |
|------|---------|---------|------|
| Marketing H1 | 36–42px | 30–36px | 品牌官网、产品介绍和发布页面的唯一主标题 |
| Page Title | 28–32px | 24–28px | 非 SaaS 页面主要标题 |
| Section Title | 22–24px | 20–22px | 页面区块标题 |
| Card Title | 16–20px | 16–18px | 独立卡片标题 |

SaaS 与持续工作界面采用更紧凑的角色范围：

| 角色 | 范围 |
|------|------|
| SaaS Page Title | 20–24px |
| SaaS Panel Title | 16–18px |
| SaaS Body / Controls | 13–16px |

**标题边界：**

- H1 只承载品牌、产品名或明确服务类别；同一视口不连续重复多个 H1
- H1 不使用超出 42px 的无限放大，也不通过超大留白伪造层级
- `200` 字重仅用于足够大的品牌展示文字；正文、控件和小标题不得使用 `200`
- 标题字号必须与容器尺度匹配，长标题先换行，再在角色范围内校准，不能溢出或遮挡其他内容
- Hero 标题遵守 Marketing H1 范围；No Hero 与工作台使用 Page Title 或 SaaS Page Title 范围

**行高规则：**
- 正文（12-18px）：行高约为字号的 1.4-1.5 倍，保证可读性
- 标题（20px+）：行高约为字号的 1.2-1.3 倍，避免过于松散
- 中文内容建议行高比英文略大（+2px）

**字重规则：**
- 200 (ExtraLight)：品牌展示、大字号品牌标题
- 400 (Regular)：正文
- 500 (Medium)：强调文本、按钮
- 600 (Semibold)：小标题
- 700 (Bold)：标题
- 小字号正文不使用 200，避免损害中文可读性

### 圆角 Tokens

控件圆角与卡片圆角分离：

| Token | 数值 | 典型用途 |
|-------|------|---------|
| `radius-none` | 0 | 表格、贯穿式分隔区块 |
| `radius-sm` | 4px | 标签、徽章、小输入框 |
| `radius-md` | 8px | 按钮、输入框和紧凑控件 |
| `radius-lg` | 12px | 大控件、菜单和非卡片容器 |
| `radius-xl` | 16px | Modal、抽屉等容器级元素 |
| `radius-card` | 36px | 所有独立卡片，配合连续曲率 |
| `radius-card-mobile` | 28–36px，默认 32px | 移动端独立卡片，继续使用 squircle |
| `radius-full` | 9999px | 头像、胶囊按钮、开关 |

卡片桌面使用 `radius-card: 36px` 与 `corner-shape: squircle`。移动端使用 28–36px、默认 32px，并继续保持 squircle；不得低于 28px，不得另建小圆角系统。按钮、输入框、筛选器、标签和 Modal 继续使用控件或容器级圆角，不得被称为卡片。

### 阴影 Tokens

| Token | 定义 | 典型用途 |
|-------|------|---------|
| `shadow-none` | none | 扁平元素 |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | 轻微控件表面、按钮或输入反馈 |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.06)` | 菜单、Popover 等非卡片表面 |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)` | 浮层、Popover |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.04)` | 模态框、抽屉 |
| `shadow-inner` | `inset 0 2px 4px rgba(0,0,0,0.05)` | 输入框内凹、按下态 |

**阴影原则：**
- 阴影颜色统一使用透明黑（`rgba(0,0,0,x)`），不使用彩色阴影（除品牌强调场景）
- 层级越高的元素阴影范围越大、越柔和
- 阴影必须配合 z-index 层级使用，视觉层级与逻辑层级保持一致
- 卡片仅使用材质专用 shadow：实体材质使用 solid shadow，液态玻璃无阴影；不支持 backdrop 或减少透明时，fallback 使用实体 shadow

### 层级 Tokens（z-index）

| Token | 数值 | 用途 |
|-------|------|------|
| `z-base` | 0 | 常规内容 |
| `z-dropdown` | 1000 | 下拉菜单、Select |
| `z-sticky` | 1100 | 吸顶导航 |
| `z-overlay` | 1200 | 遮罩层 |
| `z-modal` | 1300 | 模态框、抽屉 |
| `z-popover` | 1400 | Popover、Tooltip |
| `z-toast` | 1500 | 全局消息提示 |

**禁止：** 使用 `z-index: 9999` 等魔法数字。所有层级必须通过 token 定义。

### 断点 Tokens

| Token | 最小宽度 | 目标设备 |
|-------|---------|---------|
| `screen-sm` | 640px | 大手机横屏 |
| `screen-md` | 768px | 平板竖屏 |
| `screen-lg` | 1024px | 平板横屏、小笔记本 |
| `screen-xl` | 1280px | 桌面显示器 |
| `screen-2xl` | 1536px | 大屏显示器 |

**移动优先原则：** 默认样式面向移动端，通过 `min-width` 媒体查询向上适配。

---

## 组件规范

以下规范定义组件的视觉标准。动效部分参考 `motion-standards.md`。

### 按钮（Button）

**尺寸系统：**

| 尺寸 | 高度 | 内边距 | 字号 | 圆角 | 典型场景 |
|------|------|--------|------|------|---------|
| xs | 28px | 4px 12px | text-xs | radius-sm | 表格行内操作 |
| sm | 32px | 6px 16px | text-sm | 产品级 | compact Profile |
| md | 40px | 10px 20px | text-sm | 产品级 | standard Profile |
| lg | 48px | 12px 24px | text-base | 产品级 | spacious Profile |
| xl | 56px | 16px 32px | text-lg | radius-lg | 移动端、落地页 CTA |

**变体（Variant）：**

| 变体 | 背景 | 文字 | 边框 | 用途 |
|------|------|------|------|------|
| primary | color-primary（primary-500） | color-text-on-accent | none | 当前任务的主操作 |
| secondary | color-bg-surface | color-text-secondary | color-border-default | 次要操作 |
| tertiary | transparent | color-text-secondary | none | 弱化操作、图标按钮 |
| danger | color-danger | color-text-on-accent | none | 删除等破坏性操作 |
| ghost | transparent | color-primary | none | 链接式按钮 |

**状态定义（必须全部实现）：**

| 状态 | 视觉变化 |
|------|---------|
| default | 基准样式 |
| hover | primary / danger 使用 color-text-on-accent 时不得降低对比度；应保持或提高背景亮度，或仅使用边框、阴影或 translate 反馈；每个状态仍需达到 AA |
| active | 可使用 `scale(0.98)`；颜色变化必须通过对比度检查并达到 AA |
| focus-visible | `outline: 2px solid color-border-focus; outline-offset: 2px` |
| disabled | `opacity: 0.5; cursor: not-allowed; pointer-events: none` |
| loading | 显示 spinner，文字改为进行时（如"提交中..."），禁用交互 |

**规则：**
- 移动端按钮需要足够的触控区域；视觉高度较小时使用透明 hit area 补足
- 图标 + 文字按钮，图标与文字间距为 `spacing-2`（8px）
- 同一任务区应有明确主操作，避免多个同权 primary 竞争视觉焦点
- 按钮文案使用动词，不超过 4 个中文字（如"保存"、"立即购买"）
- `color-primary` / `color-danger` 与 `color-text-on-accent` 的实心按钮组合必须达到 WCAG AA，不得使用浅色 `color-text-primary` 代替

### 输入框（Input）

| 属性 | 规范 |
|------|------|
| 高度 | 与同尺寸按钮一致（sm 32px / md 40px / lg 48px） |
| 内边距 | 水平 `spacing-3`（12px），垂直居中 |
| 字号 | text-sm（14px）或 text-base（16px） |
| 圆角 | radius-md（8px） |
| 边框 | 1px solid `color-border-default` |
| 背景 | `color-bg-surface` |

**状态定义：**

| 状态 | 视觉变化 |
|------|---------|
| default | color-border-default |
| hover | color-border-strong |
| focus | color-border-focus + `box-shadow: 0 0 0 3px color-focus-ring` |
| error | color-border-danger + 下方错误文本（text-xs, color-text-danger） |
| success | color-border-success |
| disabled | color-bg-subtle + color-text-tertiary，禁用交互 |
| readonly | color-bg-page + color-border-default |

**规则：**
- 移动端字号不小于 16px，避免 iOS Safari 自动缩放
- 占位符使用 `color-text-tertiary`，不得承载必要信息
- 必填标记使用 danger-700 的星号，置于标签后
- 错误信息即时显示（blur 时校验），不使用 alert 弹窗

### 卡片（Card）

| 属性 | 规范 |
|------|------|
| 内边距 | 16–24px，按产品密度在范围内选择 |
| 圆角 | 桌面 `radius-card`（36px）；移动 `radius-card-mobile`（28–36px、默认 32px）；始终 `corner-shape: squircle` |
| 材质 | 用户选择的实体材质或液态玻璃 |
| 标题 | 桌面 16–20px / 移动 16–18px |
| 边界 | 使用所选材质对应的背景、边框和阴影 token |

**规则：**
- 生成前必须询问使用实体材质还是液态玻璃；未得到选择时不得自行启用玻璃
- 同一页面使用同一种卡片材质，不混用实体与玻璃制造无意义层级
- 卡片不得嵌套；玻璃卡片不得嵌套，玻璃材质也不得覆盖表格、工具栏或停靠面板
- 高密度工作台优先减少卡片数量和内边距，不得另建小圆角卡片系统
- 实体材质使用 `color-bg-surface`、默认边框和实体阴影
- 液态玻璃必须有可辨识背景内容、足够文字对比度和边界；背景不可读时改用实体材质
- 用户开启减少透明时，玻璃降级为实体背景并关闭 `backdrop-filter`
- 浏览器不支持 backdrop filter 时，玻璃降级为实体背景、实体边框和 solid shadow，并关闭滤镜
- 减少透明与不支持 backdrop filter 两个降级场景复用 solid token，不复制另一套值
- 可点击卡片必须实现 `hover`、`active` 和 `focus-visible`；不可点击卡片不得伪造交互反馈
- 移动端可适度降低半径，但必须保持连续曲率，不得退回控件级圆角

### 模态框（Modal）

| 属性 | 规范 |
|------|------|
| 最大宽度 | sm 400px / md 560px / lg 720px / xl 960px |
| 内边距 | `spacing-6`（24px） |
| 圆角 | radius-xl（16px） |
| 阴影 | shadow-xl |
| 遮罩 | `rgba(0, 0, 0, 0.5)`，可选 `backdrop-filter: blur(4px)` |
| 层级 | z-modal（1300），遮罩 z-overlay（1200） |

Modal 是容器级浮层，不是卡片；它可以继续使用 `radius-xl`，不得套用或改写卡片圆角语言。

**结构规范：**
- 标题区：text-xl，字重 600，底部间距 `spacing-4`
- 内容区：text-sm 或 text-base，最大高度 `70vh` 并可滚动
- 操作区：右对齐，按钮间距 `spacing-3`，主操作在右

**规则：**
- 必须支持 ESC 键关闭（除非是强制确认场景）
- 点击遮罩关闭（破坏性操作除外，需明确点击按钮）
- 打开时锁定 body 滚动，关闭后恢复滚动位置
- 焦点必须锁定在模态框内（focus trap），关闭后归还给触发元素

### 表格（Table）

| 属性 | 规范 |
|------|------|
| 行高 | 紧凑 40px / 标准 48px / 宽松 56px |
| 单元格内边距 | 水平 `spacing-4`，垂直居中 |
| 表头 | 背景 color-bg-subtle，字重 600，字号 text-sm |
| 分隔线 | 1px solid color-border-default（仅水平线，避免网格感） |
| 行悬停 | 背景 color-bg-subtle |

**规则：**
- 数字列右对齐，文本列左对齐，操作列居中或右对齐
- 表头吸顶时使用 z-sticky 层级
- 空状态必须有明确提示，不显示空表格
- 加载状态使用骨架屏，行数与预期数据量接近

### 标签（Tag / Badge）

| 属性 | 规范 |
|------|------|
| 高度 | 20px（小）/ 24px（默认） |
| 内边距 | 2px 8px（小）/ 4px 10px（默认） |
| 字号 | text-xs |
| 圆角 | radius-sm（方形风格）或 radius-full（胶囊风格） |
| 背景 | color-bg-selected / success / danger，或 color-bg-subtle |
| 文字 | 对应语义文字色，或 color-text-secondary |

**规则：**
- 成功、错误和信息标签使用对应语义色；警告标签使用中性色并配合警告图标和明确文案
- 分类标签使用中性色或品牌色浅色阶
- 可删除标签的关闭图标尺寸 12px，与文字间距 `spacing-1`

---

## 精简色板维护

共享品牌色继续维护 `100 / 500 / 700` 三档：

- `100`：明确请求的浅色主题低强调背景，不承载主要正文
- `500`：默认暗色主题的品牌识别、焦点、图标和关键操作
- `700`：明确请求的浅色主题小号文字、实心按钮和高对比状态

扩展颜色前需要确认它解决的是稳定、重复出现的角色。单次页面装饰不进入品牌级色板，可在产品局部定义。

### 色彩质量校验

- [ ] 彩色正文与背景满足目标字号的对比度要求
- [ ] 实心按钮使用白字时，背景色达到 WCAG AA 常规文本对比度
- [ ] 状态同时提供图标、文字或结构提示，不只依赖颜色
- [ ] 同一产品中相同颜色表达相同语义
- [ ] 新颜色没有与现有品牌紫、成功绿或危险红重复角色

---

## 平台映射概览

Tokens 到各平台的具体落地方式，完整模板见 `platform-implementations.md`。

| 平台 | Token 载体 | 引用方式 |
|------|-----------|---------|
| React + Tailwind | `tailwind.config.js` | `className="bg-brand p-4"` |
| React/Vue + CSS 变量 | `theme.css` 的 `:root` | `background: var(--color-primary)` |
| Vue + Element Plus | 语义变量覆盖 | `--el-color-primary: var(--color-primary)` |
| 小程序 | `app.wxss` 的 `page` 选择器 | `background: var(--color-primary)` |
| React Native | `theme.ts` 语义对象 | `backgroundColor: theme.colors.semantic.primary` |
| 传统页面 | `theme.css` 的 `:root` | `background: var(--color-primary)` |

**跨平台一致性要求：**
- 默认暗色业务代码只使用语义 `color-primary` 或平台映射后的 `bg-brand`
- 数值单位按平台转换：Web 用 px，小程序可用 rpx，RN 用无单位数字
- 单一数据源：`design-tokens.json` 为唯一真源，各平台配置由它派生

---

## 主题生成规则

默认暗色是生成硬边界，`:root` 直接承载暗色语义别名，`--color-primary` 指向 `primary-500`。浅色主题只有用户明确请求时才生成，并需完整重映射页面、表面、文字、边框、状态和焦点颜色。

- 暗色语义不能通过机械反色得到
- 页面使用 `#09090B`，实体表面使用 `#141418`，抬升表面使用 `#1B1B20`
- 暗色层级优先依靠表面、边框与局部阴影共同表达
- 图片和插画需要单独校验亮度、对比度或提供暗色版本
- 业务代码始终使用语义别名，主题变化不得要求修改组件内部颜色

---

## 常见问题

### Q1: 设计稿给的颜色不在标准色阶里怎么办？

先判断偏差程度。如果与最近的标准色阶差异很小（人眼难辨），直接使用标准色阶。如果差异明显，与设计师确认是有意为之还是取色误差。确认是有意的特殊场景后，考虑扩展标准而非在代码里硬编码。

### Q2: 间距必须严格 4px 倍数吗？

不要求机械取整。共享 token 以 4px 为参考步进；产品可以保留有明确排版、栅格或平台原因的局部值。审查重点是同类元素是否稳定、是否造成对齐或维护问题。

### Q3: 什么时候该扩展标准而不是遵守？

当同一个"违规"需求在 3 个以上场景重复出现时，说明标准存在缺口，应该讨论扩展标准。单次的特殊需求应该服从标准。

### Q4: 一屏只能有一个 primary 按钮，那表单里有"保存"和"提交"怎么办？

明确主次：真正的主操作用 primary，其他用 secondary。如果两个操作确实同等重要，说明信息架构需要调整，或者拆分为两个步骤。
