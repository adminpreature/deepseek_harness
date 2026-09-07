# Yiqi UI Standard

**当前版本：** `2.0.0`

`yiqi-ui-standard` 是一个快速帮助开发人员统一 UI 规范的决策型 Skill，覆盖 UI 规划、代码生成和已有页面审查。它以 OneSeven / 壹柒研究所品牌规范为默认基线，通过产品画像、页面级路由、Design Tokens、静态校验和桌面/移动浏览器验收，控制生成结果的一致性与实际可用性。

它不是一套要求所有产品复制相同组件的 UI 模板。共享硬边界负责维持品牌关联，产品类型、页面任务、信息密度和操作风险负责决定具体布局。

## 适用场景

- 为新产品建立完整 UI 需求规范
- 按 OneSeven 品牌方向生成页面或组件
- 在现有项目设计系统内继续实现
- 审查已有页面的品牌一致性、可用性和响应式质量
- 从代表性代码中提取设计规律
- 通过访谈建立新的品牌规范

## 快速开始

### 安装

将整个 `yiqi-ui-standard` 目录同步到当前 Agent 使用的 Skills 目录。按运行环境选择一个目标即可：

```bash
# cc-switch
rsync -a yiqi-ui-standard/ "$HOME/.cc-switch/skills/yiqi-ui-standard/"

# Codex
rsync -a yiqi-ui-standard/ "$HOME/.codex/skills/yiqi-ui-standard/"

# Claude Code
rsync -a yiqi-ui-standard/ "$HOME/.claude/skills/yiqi-ui-standard/"
```

安装时必须保留 `agents/`、`assets/`、`references/`、`scripts/` 和 `tests/`，不能只复制 `SKILL.md`。

### 调用

可以直接描述任务并明确引用 Skill：

```text
使用 yiqi-ui-standard 规划一个 AI 商业平台
使用 yiqi-ui-standard 生成一个 OneSeven 产品官网
使用 yiqi-ui-standard 审查 src/pages/dashboard.tsx
使用 yiqi-ui-standard 从现有组件提取设计规范
```

支持 Slash Command 的客户端也可以使用：

```text
/yiqi-ui-standard 审查这个 CRM 工作台
```

## 决策入口

每次规划、创建、生成、审查或改进 UI 时，Skill 会先完成以下决策。用户已在同一请求中明确答案时，记录后继续，不重复提问。

| 顺序 | 决策 | 可选项 |
|---|---|---|
| 0 | 品牌模式 | OneSeven（默认）/ 当前项目设计系统 / 新品牌规范 |
| 1 | 项目阶段 | 规划与需求 / 代码实现 / 已有页面审查或改进 |
| 2 | 产品画像 | 1 个主类型、0–3 个次类型、当前页面级类型 |
| 3 | 页面结构 | 根据主要任务和页面类型选择 Hero / No Hero |
| 4 | SaaS 壳层 | 运营管理型 / AI 创作型 / 数据分析型 |

冲突时依次优先考虑：

1. 安全、可用性和任务效率
2. 当前页面的主要任务
3. 当前页面类型
4. 产品主类型
5. 产品次类型
6. 品牌视觉表达

## 三种工作阶段

### 规划与需求

- 不询问技术栈，不生成生产实现代码
- 按顺序确认目标用户、主要任务、产品画像、页面地图、信息密度、素材、Hero、卡片材质、响应式和风险状态
- 需要比较结构时，在浏览器中展示 2–3 个临时布局方向
- 输出完整 UI 需求规范
- 用户批准书面规范前不进入代码实现

### 代码实现

- 优先读取已批准的 UI 需求规范
- 确认产品画像、页面任务、Hero / No Hero、卡片材质、技术栈和平台
- Web 页面写入质量门槛所需的根元素元数据
- 运行轻量静态校验
- 完成 `1440 × 1000` 和 `390 × 844` 浏览器验收
- 静态 error 和未复核的 warning 都会阻塞最终验收

### 已有页面审查或改进

- 先识别品牌、产品类型、页面任务、信息密度、风险等级、Hero 和卡片材质
- OneSeven 审查使用五段式报告：品牌基础、产品内部一致性、体验与可用性、Apple Design 参考、做得好的地方
- 每项问题包含位置、当前状态、修复方向和规则依据
- 首次审查最多输出 Top 5 阻塞问题和 Top 3 推荐改进

## 产品画像

内置十二类产品原型，并允许复合产品按路由覆盖产品级默认值：

| 页面类型元数据 | 产品原型 |
|---|---|
| `marketing` | 品牌官网 / 营销转化 |
| `product` | 产品介绍 / 发布页面 |
| `content` | 内容 / 知识 / 文档 |
| `commerce` | 电商 / 交易 / 支付 |
| `community` | 社区 / 协作 / 消息 |
| `consumer-tool` | C 端工具 / 移动应用 |
| `saas-operations` | 运营管理 SaaS |
| `saas-ai-workspace` | AI 创作 / 对话工作台 |
| `saas-analytics` | 数据分析 / 监控看板 |
| `platform` | 平台 / 市场 / 多角色系统 |
| `account` | 个人中心 / 钱包 / 账户 |
| `workflow` | 表单流程 / 向导 / 申请系统 |

SaaS、AI 持续操作、管理、分析和账户页面默认使用 No Hero。三种 SaaS 壳层都要求主要任务、数据、状态和主要操作进入第一视口。

## OneSeven 视觉基线

- 默认只生成暗色主题；只有用户明确要求时才生成浅色版本
- 品牌紫为 `#9A6ABA`，用于焦点、选中、关键操作和少量品牌强调
- Web 优先使用包内 Alibaba PuHuiTi，包含 `200 / 400 / 500 / 600` 四个 WOFF2 字重
- 品牌或产品页 H1：桌面 `36–42px`，移动端 `30–36px`
- SaaS 页面标题：`20–24px`
- Web 卡片使用 `36px` 降级圆角和 `corner-shape: squircle`
- 卡片材质必须先确认：实体暗色或 Apple 风格液态玻璃
- 液态玻璃必须提供减少透明度和不支持背景模糊时的实体回退
- 不使用无信息的大型圆形、光球、轨道或默认装饰分栏代替真实产品视觉
- Hero 必须使用真实媒体、可检查的产品状态，或包含实际成果与证据的编辑式构图
- 动效必须可理解、可中断，并尊重 `prefers-reduced-motion`

完整规则分别位于 `references/oneseven-guidance.md`、`references/visual-system.md`、`references/hero-standards.md` 和 `references/motion-standards.md`。

## Web 接入

### 使用主题变量

复制或引用 `theme.css` 时，必须保持字体资源的相对目录结构：

```css
@import "./yiqi-ui-standard/theme.css";

html {
  color-scheme: dark;
  color: var(--color-text-primary);
  background: var(--color-bg-page);
  font-family: var(--font-sans);
}
```

`design-tokens.json` 是结构化设计令牌来源，`theme.css` 提供可直接用于 Web 的 CSS 变量、字体声明、卡片材质和无障碍降级。

### 页面元数据

生成的 Web 页面必须在 `html` 根元素声明页面类型和 Hero 状态；存在卡片时还必须声明卡片材质：

```html
<html
  lang="zh-CN"
  data-ui-page-type="marketing"
  data-ui-hero="approved"
  data-ui-card-material="solid"
>
```

Approved Hero 的真实媒体或产品状态需要额外标记：

```html
<img
  data-ui-hero-media
  src="./product.webp"
  alt="产品实际工作界面"
>

<section data-ui-product-state="live-workspace">
  <!-- 可检查的真实产品状态 -->
</section>
```

独立卡片容器使用 `data-ui-card`。不要嵌套卡片，也不要为了套用圆角而把工具栏、表格行、筛选栏或数据网格包装成装饰卡片。

## 静态校验

要求 Node.js 18 或更高版本。校验器没有第三方运行时依赖：

```bash
node scripts/validate-generated-web.mjs \
  --file ../index.html \
  --page-type marketing
```

可选参数：

| 参数 | 说明 |
|---|---|
| `--file <path>` | 必填，待检查的 HTML 文件 |
| `--page-type <type>` | 可选，覆盖根元素中的页面类型 |
| `--json` | 可选，输出结构化 JSON 报告 |

示例：

```bash
node scripts/validate-generated-web.mjs \
  --file ../index.html \
  --page-type marketing \
  --json
```

静态校验存在 error 时阻塞，必须修复后重跑。warning 不是静态阻塞项，但必须在浏览器中复核并记录结果；未完成复核和记录时，整体验收仍未完成。

轻量静态校验器只判断当前 HTML 和内联 CSS 中能够直接、确定证明的问题。它不能证明外部样式表、复杂 CSS 级联与继承、非 px 单位或长度计算、字体加载与回退结果，也不能证明视觉质量。这些内容必须交给浏览器验收。

## 浏览器验收

静态测试通过不能代替截图和视觉审查。浏览器验收至少覆盖桌面、移动端、控制台信息，以及每条静态 warning 的观察和结论。

```bash
command -v npx >/dev/null 2>&1
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"

"$PWCLI" open http://localhost:4173 --headed
"$PWCLI" resize 1440 1000
"$PWCLI" screenshot
"$PWCLI" resize 390 844
"$PWCLI" screenshot
"$PWCLI" console warning
```

验收时重点检查：

- 第一视口是否显示品牌、当前任务、关键数据或主要操作
- 真实素材、字体和外部样式是否正确加载
- 文本、按钮、表格、固定格式控件是否溢出或遮挡
- 键盘焦点、等待、完成、错误、恢复和危险操作状态是否完整
- Hero、卡片材质和响应式布局是否符合当前页面类型
- 减少动态效果与减少透明度偏好是否正确降级

## 测试

在 `yiqi-ui-standard/` 目录运行：

```bash
node --test tests/skill-contract.test.mjs
node --test tests/validate-generated-web.test.mjs
```

也可以一次运行全部 Node.js 测试：

```bash
node --test tests/*.test.mjs
```

`tests/evals/yiqi-ui-standard-v2-cases.json` 包含规划、官网、移动端、三种 SaaS、复合产品和审查基线等压力用例。

## 文件结构

```text
yiqi-ui-standard/
├── README.md
├── SKILL.md
├── VERSION
├── design-tokens.json
├── theme.css
├── agents/
│   └── openai.yaml
├── assets/
│   ├── oneseven-logo.png
│   └── fonts/
│       ├── FONT-NOTICE.md
│       └── AlibabaPuHuiTi-3-*.woff2
├── references/
│   ├── planning-workflow.md
│   ├── product-archetypes.md
│   ├── hero-standards.md
│   ├── saas-workbench-standards.md
│   ├── generation-quality-gate.md
│   ├── oneseven-guidance.md
│   ├── visual-system.md
│   ├── motion-standards.md
│   ├── platform-implementations.md
│   ├── review-checklist.md
│   ├── interview-workflow.md
│   └── extraction-workflow.md
├── scripts/
│   └── validate-generated-web.mjs
└── tests/
    ├── evals/yiqi-ui-standard-v2-cases.json
    ├── fixtures/
    ├── skill-contract.test.mjs
    └── validate-generated-web.test.mjs
```

## 文档索引

| 文件 | 用途 |
|---|---|
| `SKILL.md` | Skill 入口、路由逻辑和核心执行规则 |
| `agents/openai.yaml` | 客户端显示名称、简介和默认调用提示 |
| `references/planning-workflow.md` | 规划访谈顺序、交付物和批准门槛 |
| `references/product-archetypes.md` | 十二类产品原型、复合产品和冲突优先级 |
| `references/hero-standards.md` | Hero / No Hero 路由、证据和标题规则 |
| `references/saas-workbench-standards.md` | 三类 SaaS 工作台壳层 |
| `references/generation-quality-gate.md` | Web 元数据、静态校验和浏览器验收 |
| `references/oneseven-guidance.md` | OneSeven 品牌适用范围和品牌硬规则 |
| `references/visual-system.md` | 颜色、字体、间距、圆角、材质和组件意图 |
| `references/motion-standards.md` | 反馈、动效、等待状态和无障碍降级 |
| `references/platform-implementations.md` | Web、小程序和 React Native 等平台实现 |
| `references/review-checklist.md` | 审查入口、阻塞项和报告格式 |
| `references/interview-workflow.md` | 从零建立品牌标准的访谈流程 |
| `references/extraction-workflow.md` | 从现有代码反向提取规范 |

## 维护说明

- 修改版本时同步更新 `VERSION`、`design-tokens.json` 的 `meta.version` 和本 README
- 修改结构化令牌后同步检查 `theme.css` 的 CSS 变量映射
- 修改 Skill 契约或参考规则后运行全部 Node.js 测试
- 字体来源、法律声明和 SHA-256 位于 `assets/fonts/FONT-NOTICE.md`
- `references/` 默认由 Skill 只读；只有提取或引导模式明确需要时才更新

在当前开发工作区中，`yiqi-ui-standard/` 外层的 `index.html` 是故意保留的失败回归基线，用于验证审查流程，不代表符合 v2 规范的示例实现。
