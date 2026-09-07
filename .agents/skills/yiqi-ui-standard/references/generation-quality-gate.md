# 生成质量门槛

## 生成前决策

- 品牌模式已确认
- 项目阶段已确认
- 产品主类型和 0–3 个次类型已确认
- 当前页面或路由的页面级类型已确认
- Hero / No Hero 已确认
- 卡片材质已确认
- 真实素材状态已确认

缺少任一项时，先补齐决策，不进入代码生成。

## 输出元数据

Web 根元素标记：

```html
<html
  data-ui-page-type="marketing"
  data-ui-hero="approved"
  data-ui-card-material="solid"
>
```

Approved Hero 的真实媒体或产品状态额外标记：

```html
<img data-ui-hero-media src="./product.webp" alt="产品实际工作界面">
<section data-ui-product-state="live-workspace">...</section>
```

允许的页面类型：

- marketing
- product
- content
- commerce
- community
- consumer-tool
- saas-operations
- saas-ai-workspace
- saas-analytics
- platform
- account
- workflow

## 静态校验

```bash
node path/to/yiqi-ui-standard/scripts/validate-generated-web.mjs \
  --file path/to/page.html \
  --page-type marketing
```

静态校验保持轻量：只有确定性错误由静态校验阻塞，不扩展静态校验器去推断浏览器才能确定的结果。

- `error` 是阻塞项，必须修复后重跑。
- `warning` 不是静态阻塞项，但必须在浏览器中复核并记录结果。

静态校验只在当前 HTML 和内联 CSS 中存在直接、确定证据时报告 error，例如：

- 页面类型或 Hero 元数据缺失、页面类型无效
- 卡片存在但卡片材质元数据缺失
- 可直接确认默认主题不是暗色
- 可直接换算的 px 标题超过页面类型上限
- 可直接确认卡片圆角、连续曲率或材质降级缺失
- 卡片嵌套
- SaaS 页面包含 Hero
- Approved Hero 缺少已标记的真实媒体或产品状态
- 可直接识别的大型装饰圆形、默认装饰分栏或硬编码品牌紫
- 可直接确认交互元素缺少 `focus-visible`
- 存在动效但缺少 `prefers-reduced-motion`

## 静态不确定性

以下内容不能由轻量静态校验可靠证明。发现时保留 warning，交给浏览器验收，不升级为 error：

- 外部样式表及其加载结果
- 复杂 CSS 级联、继承、条件规则和运行时覆盖
- 非 px 单位或长度计算，包括 `rem`、`em`、视口单位、容器单位、`var()` 和 `calc()`
- 字体加载、实际字重和字体回退结果
- 不确定的视觉判断，例如层级是否清晰、素材是否足够真实、对比度是否受背景影响

静态 warning 必须写入验收记录，说明浏览器中的观察、结论和必要修复。不得用正则表达式或新增启发式规则假装已经证明这些视觉结果。

## 浏览器验收

至少验证：

- 桌面 1440 × 1000
- 移动端 390 × 844

检查：

- 横向溢出
- 文字遮挡、截断和按钮文字溢出
- 固定格式元素是否发生布局位移
- 字体资产是否真实加载
- Hero 是否有品牌信号、真实视觉证据和下一内容提示
- No Hero 页面是否直接显示主要任务
- SaaS 的主要任务、数据和状态是否进入第一视口
- 液态玻璃的对比度与减少透明降级
- 是否存在模板化装饰和无信息视觉
- 每条静态 warning 是否已复核并记录

静态 DOM 测试通过不能代替截图和视觉审查。

## Playwright CLI

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

## 完成标准

- 静态校验没有 error
- 所有 warning 已在浏览器中复核并记录
- 桌面和移动截图已检查
- 控制台无未解释错误
- 视觉反模式清单无阻塞项

无法完成浏览器验收或 warning 复核时，必须说明未验证，不得宣称页面通过。
