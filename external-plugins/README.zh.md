# OneSeven external plugins

[English](README.md) | 中文

本目录是针对 `dsh-v0.1.6-alpha.2` 的私有下游适配源码，不代表插件注册表的最新版本，也不参与官方工作区发布。[provenance.json](provenance.json) 记录来源版本与 manifest 摘要；原工作目录及已安装 Profile 保持不变。

## Build and check

先完成仓库的冻结锁文件安装与构建，再从仓库根目录执行：

```sh
npm ci --prefix external-plugins --ignore-scripts --workspaces=false
node external-plugins/link-local.mjs
node external-plugins/build.mjs
pnpm exec tsc -b external-plugins/tsconfig.client.json external-plugins/tsconfig.host.json
node --import tsx --test external-plugins/tests/compatibility.test.mjs
DSH_SNAPSHOT=replay pnpm exec vitest run --config vitest.web.config.ts apps/web/tests/oneseven-external-plugins.e2e.ts
```

链接脚本核对精确依赖版本，拒绝覆盖不同目标的已有链接。Harness peer 指向本检出目录，React 指向本仓库 Web 应用，两个独立库由私有 npm 锁文件固定。构建器仅重建各插件的生成目录 `lib/`。广场和看板编译 TypeScript；提示词管理维护已发布的可读 JavaScript；技能管理因原始源码不完整，维护已发布的可读 JavaScript 及固定 RPC 元数据。两个 JavaScript 插件均不伪称提供已生成的 TypeScript 声明。空 invariant 伴随已移除，因为这些包没有独立的运行时关系需要断言。

浏览器套件通过官方 managed-profile 加载器，在独立临时 home 安装四个本地包，不改写用户已安装的 Profile。生产 Profile 持久初始化与容器安装属于后续 Docker 阶段。不要向新应用复制旧 `node_modules`，也不要让两个 Host 同时操作同一份数据。

## Compatibility and behavior

| Plugin | Source version | Adaptation and verified surface | Limits |
|---|---|---|---|
| Skill Plaza | 0.1.0 | 官方主面板／侧栏／输入插槽、默认预设目录、本地化界面、目标会话 Lexical 插入、重挂载后草稿持久化、无会话提示、可撤销样式 | 只插入技能斜杠调用，不自动发送消息。 |
| Taskboard | 0.6.4 | 官方主面板／侧栏与会话导航、双色语义颜色、账本 CRUD、提交前只读权限、本地适配器执行与结算、调度容量及过期窗口负向验证 | 本地适配器不是真实模型。Git 隔离／合并及真实模型调度仍需独立端到端验证。 |
| Prompt manager | 1.5.0 | 设置／输入插槽、本地持久提示词库、激活／移除后的真实提示词组装、会话隔离、跨域／远程写入拒绝 | 激活选择属于在线 Host 状态；保存提示词库不代表 Host 重启后仍保持注入。 |
| Skill manager | 0.1.0-rc.3 | 字面量设置命名空间、严格 Typert codec 工厂、文件导入／建群／启用、provider 发现、可撤销样式 | 发布元数据声明 MIT，但没有独立许可证文件；公开分发前需核实许可材料。 |

四插件均逐项检查刷新与禁用／重启用、共同启用，并检查亮暗主题及 390px 显示。快照覆盖真实 Web Profile 和确定性任务结果。权限配置失败阻止提交，codec 适配保留畸形载荷拒绝。TypeScript 保留 strict 和 exact-optional 检查；旧看板本地状态声明中的显式 `undefined` 描述其原有局部更新清空语义，不是全局检查豁免。

广场和看板不再查找或隐藏官方对话 DOM。窄屏共享设置导航换行到完整宽度表单上方。官方文件侧栏、多标签、终端、Diff、计划及子代理组件保留，未修改 agent-loop 或实验驱动默认值。

## Data and recovery

测试仅操作自有临时 Profile、工作区与数据目录，真实任务账本、提示词库和技能群设置没有迁移。回滚时应同时保留旧代码、镜像、Profile 配置和停机数据副本；没有明确降级支持时，不得让旧 Host 打开新格式 Session 数据。[升级记录](../.agents/notes/proposed/architecture/2026-09-21-oneseven-pinned-upgrade.zh.md) 跟踪尚未完成的 Docker 与历史数据副本工作。本目录不是生产发布或回滚包。
