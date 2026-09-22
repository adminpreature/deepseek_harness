# Office toolkit 验证记录

[English](README.md) | 中文

本目录记录 `dsh-office-toolkit@0.3.30` 针对 `dsh-v0.1.6-alpha.2` 的隔离验证安装。它是可复现记录，不是已启用的生产 Profile。[package-lock.json](package-lock.json) 固定完整 npm 依赖树，[manifest.json](manifest.json) 记录包源地址、tarball 摘要和运行时要求。

## 复现

在本目录使用 Node 20 或更高版本执行：

```sh
npm ci --ignore-scripts --strict-peer-deps --workspaces=false
```

验证测试通过显式路径接收安装包，不修改预览 Profile：

```sh
DSH_OFFICE_TOOLKIT_TEST_DIR="$PWD/node_modules/dsh-office-toolkit" \
DSH_ONESEVEN_EVIDENCE_DIR="$TMPDIR/oneseven-office-evidence" \
pnpm exec vitest run --config vitest.web.config.ts \
  apps/web/tests/oneseven-office-toolkit.e2e.ts
```

测试使用合成 DOCX/XLSX 文件，并将模板结果写入副本路径。它检查 8 个工具的注册、Word 写入与读取、Excel 写入与读取及分组求和、模板另存、Host 重启后的持久化、与四个本地适配包的组合 UI，以及无密钥本地模型适配器。测试不发送消息、不导入公司文件，也不覆盖用户原文件。

## 兼容性结果

`dsh-office-toolkit@0.3.30` 在独立隔离 Profile 和组合隔离 Profile 中均成功加载并注册预期工具。验证底座为 Node `22.23.1`、pnpm `11.7.0` 和 DSH `0.1.6-alpha.2`。检查到的 npm 元数据没有安装脚本；验证使用 `--ignore-scripts` 和 `--strict-peer-deps`。

测试覆盖基础文档和表格处理，但没有验证真实模型调用、LibreOffice/Word/PDF 转换或完整 PowerPoint 制作。这些能力依赖外部环境，或不在本次验证范围内。

## 壹柒插件清单

四个已有集成继续使用上级目录中的本地源码，不用同版本注册表包替换：

| 包 | 版本 | 状态 |
| --- | --- | --- |
| `dsh-prompt-manager` | `1.5.0` | 保留本地适配；隔离 UI、数据和重启检查通过。 |
| `@baikai233/dsh-skills-manager` | `0.1.0-rc.3` | 保留本地适配；隔离 UI、数据和重启检查通过。 |
| `dsh-taskboard` | `0.6.4` | 保留本地适配；未升级到 `0.7.5`；隔离检查通过。 |
| `dsh-skill-plaza` | `0.1.0` | 保留本地实现；导航、调用和持久化检查通过。 |

下列包没有安装到常驻 Profile：

| 包 | 候选版本 | 结果 |
| --- | --- | --- |
| `@lemoncat7/dsh-knowledge` | `2.10.0` | 隔离诊断发现 `conversation.chat.turnTail` 槽位注册与当前宿主不兼容；导入、检索、引用和持久化未验收。 |
| `@huanlin/dsh-plugin-mineru` | `0.3.1` | peer 范围不接受 `0.1.6-alpha.2`；没有可授权的 MinerU 服务。 |
| `dsh-connect` | `0.9.0` | peer 范围不接受 `0.1.6-alpha.2`；未提供钉钉/飞书渠道和测试目标。 |

本记录不包含认证、Memory、第二套 Sidebar、第二个任务板、第二个提示词管理器或第二个技能管理器。

## Profile、备份与回退

隔离安装位于仓库外的私有临时目录，没有写入常驻 Profile，也没有写入 `3097` 实例。后续启用前必须备份目标 `DSH_HOME`；Git 只保护本仓库，不保护 Profile 数据。

启用前应停止目标 Host，将 Profile 和可写数据复制到私有备份，核对绝对路径与符号链接，并使用独立测试 `DSH_HOME` 做重启检查。回退时恢复原 Profile 与数据副本，再用原代码和配置启动 Host。不得让新旧 Host 同时操作同一份可写 Session 或数据库。

本次验证没有修改或重启当前 `3097` 预览实例。
