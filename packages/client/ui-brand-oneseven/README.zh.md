---
description: "Web 工作台的 OneSeven 品牌插槽与双色主题；面向品牌发行版的用户和维护者。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-brand-oneseven

[English](README.md) | 中文

## 概述

本包为私有下游包，不属于官方 npm 发布成员。OneSeven 通过官方客户端服务提供侧栏标志与名称、紧凑的新任务标志及亮暗双色 Tokens。它保留用户主题偏好与工作台现有的导航、文件审阅、终端、插件及会话功能，不改变模型可见行为。

## 目录

- [使用本包](#use-this-package)
- [了解实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制与延后工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

OneSeven Web 组合挂载本插件，替代官方品牌占位组件。外观仍由现有的浅色、深色和跟随系统设置控制。组合仅对没有已保存主题的用户选择深色默认值；本插件从不覆盖已保存选择。

### 公共组件

本插件在 `src/client/tokens.ts` 集中维护双色主题，通过语义颜色别名和几何变量适配现有基础组件：控件 12px、小控件 8px、独立卡片 36px、移动输入卡片 32px。结构行和停靠面板保留上游几何；错误、成功与语法颜色保留上游语义。紧凑的新任务提示是任务入口，不是宣传 Hero。

### 资源

侧栏名称与默认 Web 构建标题为 `Agents lite`，内部包标识和现有 OneSeven 图标保持不变。品牌 Web 应用在 `/assets/` 下提供该图标。排版优先使用本机安装的阿里巴巴普惠体 400/500/600，再回退到操作系统字体，不下载字体文件。未安装普惠体的设备使用回退字形，布局必须容纳不同的字体度量。字体子集化和再分发需要另行核实许可，本部署不转换现有字体文件。标志保留纵横比，暗色模式反色。Web 构建独立于动态插件管理标题、favicon 和 manifest 元数据。

-----

<a id="understand-the-implementation"></a>
## 了解实现

每个 Token 同时向 `theme.overrideTokens` 提供亮色与暗色值；切换主题不重挂载对话。插槽注册等待声明，并随声明移除或重建。本插件 fiber 管理主题、字典、样式与页面元数据；卸载恢复原有元数据并移除自身贡献，不写入用户设置。

**运行时不变量：** 不发布伴随模块。展示由主题与插槽注册表派生，本包不拥有可独立断言的运行时关系。

-----

<a id="model-experience"></a>
## 模型体验

无；本插件仅改变浏览器展示，不增加会话事件或模型输入。

#### KV Cache 影响

无；提供方请求保持不变。

## 已知限制与延后工作

<a id="known-limitations-and-deferred-work"></a>

- 资源 URL 假设组合 Web 应用从受支持的根路径提供服务。单独安装本包不会安装品牌静态资源。
- 本插件不改变桌面宿主的操作系统外框，也不改变保留的 DeepSeek 提供方名称。
- 外部插件的界面仍由各插件维护，兼容性需要单独验证。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作背景——点击展开</summary>

[固定版本升级记录](../../../.agents/notes/proposed/architecture/2026-09-21-oneseven-pinned-upgrade.zh.md) 维护实施状态和验收证据。

</details>
