# Tenant Plugin 修复说明

## 问题描述

`packages/enterprise/tenant` 插件在 `pnpm install` 和构建时遇到以下问题：

1. **依赖问题**: `@deepseek-ai/dsh-core` 包不存在
2. **TypeScript 编译错误**: 多个导入和类型错误

## 已修复的内容

### 1. 依赖配置修复 (package.json)

**修改前:**
```json
"peerDependencies": {
  "@deepseek-ai/cordis": "workspace:*",
  "@deepseek-ai/dsh-agent": "workspace:*"
},
"dependencies": {
  "pg": "^8.11.3",
  "ioredis": "^5.3.2"
}
```

**修改后:**
```json
"dependencies": {
  "@deepseek-ai/cordis": "workspace:*",
  "pg": "^8.11.3",
  "ioredis": "^5.3.2"
}
```

**原因**: 
- 移除了不存在的 `@deepseek-ai/dsh-agent` 依赖
- 将 `@deepseek-ai/cordis` 从 peerDependencies 移到 dependencies

### 2. TypeScript 配置修复 (tsconfig.json)

**修改前:**
```json
{
  "references": [
    { "path": "../../vendor/cordis" },
    { "path": "../core/agent" }
  ]
}
```

**修改后:**
```json
{
  "references": [
    { "path": "../../vendor/cordis" }
  ]
}
```

**原因**: 移除了不存在的 `../core/agent` 引用

### 3. 导入修复 (src/service.ts)

**修改前:**
```typescript
import type { Service } from '@deepseek-ai/cordis';
```

**修改后:**
```typescript
import { Service } from '@deepseek-ai/cordis';
```

**原因**: `Service` 是一个类，需要作为值导入，不能只作为类型导入

### 4. 未使用导入清理 (src/service-impl.ts)

**修改前:**
```typescript
import { Pool, type PoolClient } from 'pg';
```

**修改后:**
```typescript
import { Pool } from 'pg';
```

**原因**: `PoolClient` 声明但未使用

### 5. Redis 属性类型一致性

**修改前:**
```typescript
public readonly redis?: Redis;
```

**修改后:**
```typescript
public readonly redis: Redis | undefined;
```

**原因**: 确保与抽象类定义一致

## 验证步骤

1. **清理并重新安装依赖**:
```bash
cd /Volumes/数据盘/yiqi\ agentlite/deepseek-harness-upgrade-v0.1.6-alpha.2
pnpm install
```

2. **检查 tenant 包的 TypeScript 编译**:
```bash
cd packages/enterprise/tenant
npx tsc
```

3. **运行完整构建**:
```bash
cd /Volumes/数据盘/yiqi\ agentlite/deepseek-harness-upgrade-v0.1.6-alpha.2
pnpm run build
```

## 剩余问题

如果 `pnpm install` 仍然失败，可能的原因：

### A. tsdown 配置问题

错误信息:
```
ERROR  Error: [@deepseek-ai/dsh-tenant] Cannot find entry: ["lib/types/{index,invariant,startup}.js"]
```

**解决方案**: 确保 tenant 包有正确的构建入口点。可能需要：

1. 检查是否需要 `src/startup.ts` 文件
2. 或者更新构建配置来只包含 `index.js`

### B. rolldown nightly 版本问题

错误信息:
```
[ERR_PNPM_NO_MATCHING_VERSION] No matching version found for rolldown@nightly
```

**解决方案**: 
- 这是 `tsdown@0.2.17` 的依赖问题
- 需要更新项目的 `tsdown` 版本或等待上游修复

## 下一步

1. 运行 `pnpm install` 验证依赖安装
2. 如果遇到 rolldown 问题，暂时移除 tenant 包或更新 tsdown
3. 验证完整构建流程
4. 提交修复

## 文件清单

修改的文件：
- `packages/enterprise/tenant/package.json`
- `packages/enterprise/tenant/tsconfig.json`
- `packages/enterprise/tenant/src/service.ts`
- `packages/enterprise/tenant/src/service-impl.ts`
- `packages/enterprise/tenant/src/types.ts`
