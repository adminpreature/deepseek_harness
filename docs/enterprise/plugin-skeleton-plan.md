# 企业插件骨架结构规划

## 已完成：dsh-tenant 插件

### 文件结构
```
packages/enterprise/tenant/
├── package.json              # 包配置
├── tsconfig.json            # TypeScript 配置
├── README.md                # 插件文档
└── src/
    ├── index.ts             # 插件入口和配置
    ├── types.ts             # 核心类型定义
    ├── service.ts           # Service Definition（抽象接口）
    ├── service-impl.ts      # Service Provider（具体实现）
    └── index.test.ts        # 单元测试
```

### 核心特性
- ✅ 多租户数据隔离（PostgreSQL RLS + AsyncLocalStorage）
- ✅ 数据库连接池管理
- ✅ Redis 缓存支持（可选）
- ✅ 租户 CRUD 操作
- ✅ 资源配额跟踪
- ✅ 租户上下文管理

---

## 待创建插件骨架

### 1. dsh-user（用户和权限）

**文件结构：**
```
packages/enterprise/user/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts             # 插件入口
    ├── types.ts             # User, Role, Permission 类型
    ├── service.ts           # UserService 接口
    ├── service-impl.ts      # 实现：认证、RBAC
    ├── auth.ts              # JWT 生成和验证
    └── index.test.ts
```

**核心类型：**
```typescript
interface User {
  id: UserId;
  tenantId: TenantId;
  username: string;
  email: string;
  passwordHash?: string;
  status: 'active' | 'suspended' | 'inactive';
  preferences: UserPreferences;
}

interface Role {
  id: RoleId;
  name: 'admin' | 'manager' | 'member';
  permissions: Permission[];
}

interface Permission {
  resource: string;  // 'user' | 'task' | 'document'
  action: string;    // 'create' | 'read' | 'update' | 'delete'
  scope: string;     // 'own' | 'team' | 'all'
}
```

**核心方法：**
```typescript
abstract class UserService {
  abstract register(input: RegisterInput): Promise<User>;
  abstract login(credentials: LoginInput): Promise<{ user: User; token: string }>;
  abstract verifyToken(token: string): Promise<User>;
  abstract hasPermission(userId: UserId, permission: Permission): Promise<boolean>;
  abstract assignRole(userId: UserId, roleId: RoleId): Promise<void>;
}
```

---

### 2. dsh-organization（组织架构）

**文件结构：**
```
packages/enterprise/organization/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts
    ├── types.ts             # Organization, Member 类型
    ├── service.ts           # OrganizationService 接口
    ├── service-impl.ts      # 实现：树形结构操作
    ├── tree-utils.ts        # ltree 路径工具
    └── index.test.ts
```

**核心类型：**
```typescript
interface Organization {
  id: OrganizationId;
  tenantId: TenantId;
  name: string;
  parentId?: OrganizationId;
  path: string;              // ltree 路径
  level: number;
  leaderId?: UserId;
  type: 'company' | 'department' | 'team';
}

interface OrganizationMember {
  organizationId: OrganizationId;
  userId: UserId;
  isPrimary: boolean;
  position?: string;
}
```

**核心方法：**
```typescript
abstract class OrganizationService {
  abstract create(input: CreateOrgInput): Promise<Organization>;
  abstract getTree(rootId?: OrganizationId): Promise<Organization[]>;
  abstract addMember(orgId: OrganizationId, userId: UserId): Promise<void>;
  abstract getMembers(orgId: OrganizationId): Promise<User[]>;
  abstract move(orgId: OrganizationId, newParentId: OrganizationId): Promise<void>;
}
```

---

### 3. dsh-task-management（任务管理）

**文件结构：**
```
packages/enterprise/task-management/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts
    ├── types.ts             # Task, TaskDependency 类型
    ├── service.ts           # TaskService 接口
    ├── service-impl.ts      # 实现：CRUD、状态流转
    ├── ai-expander.ts       # AI 任务扩写功能
    ├── tools.ts             # Model-facing tools
    └── index.test.ts
```

**核心类型：**
```typescript
interface Task {
  id: TaskId;
  tenantId: TenantId;
  title: string;
  description?: string;
  parentId?: TaskId;
  creatorId: UserId;
  assigneeIds: UserId[];
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  tags: string[];
  aiGenerated?: {
    autoExpanded: boolean;
    suggestedAssignees: UserId[];
  };
}

interface TaskDependency {
  taskId: TaskId;
  dependsOnTaskId: TaskId;
  type: 'finish_to_start';
}
```

**核心方法：**
```typescript
abstract class TaskService {
  abstract create(input: CreateTaskInput): Promise<Task>;
  abstract assign(taskId: TaskId, userIds: UserId[]): Promise<void>;
  abstract updateStatus(taskId: TaskId, status: TaskStatus): Promise<void>;
  abstract addDependency(taskId: TaskId, dependsOn: TaskId): Promise<void>;
  abstract expandWithAI(draft: TaskDraft): Promise<ExpandedTask>;
}
```

**Model-facing Tools：**
```typescript
// 提供给 Agent 使用的工具
ctx.tool('task/create', { /* schema */ }, async (input) => {
  return await ctx.taskManagement.create(input);
});

ctx.tool('task/list', { /* schema */ }, async (input) => {
  return await ctx.taskManagement.list({ userId: input.userId });
});
```

---

### 4. dsh-ai-assistant（AI 助手）

**文件结构：**
```
packages/enterprise/ai-assistant/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts
    ├── types.ts             # Conversation, Message 类型
    ├── service.ts           # AIAssistantService 接口
    ├── service-impl.ts      # 实现：对话管理
    ├── context-builder.ts   # 构建 AI 上下文（角色、权限）
    ├── tools.ts             # Model-facing tools
    └── index.test.ts
```

**核心类型：**
```typescript
interface AIConversation {
  id: ConversationId;
  tenantId: TenantId;
  userId: UserId;
  title?: string;
  contextType?: 'task' | 'document' | 'general';
  contextId?: string;
}

interface AIMessage {
  id: MessageId;
  conversationId: ConversationId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    model?: string;
    sources?: Array<{ documentId: string; chunkIndex: number }>;
  };
}
```

**核心方法：**
```typescript
abstract class AIAssistantService {
  abstract createConversation(userId: UserId): Promise<AIConversation>;
  abstract sendMessage(convId: ConversationId, content: string): Promise<AIMessage>;
  abstract getHistory(convId: ConversationId): Promise<AIMessage[]>;
  abstract buildContext(userId: UserId): Promise<string>;  // 角色感知上下文
}
```

---

### 5. dsh-knowledge-base（知识库）

**文件结构：**
```
packages/enterprise/knowledge-base/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts
    ├── types.ts             # Document, DocumentChunk 类型
    ├── service.ts           # KnowledgeBaseService 接口
    ├── service-impl.ts      # 实现：文档管理
    ├── vectorizer.ts        # 文档向量化
    ├── retriever.ts         # RAG 检索
    ├── tools.ts             # Model-facing tools
    └── index.test.ts
```

**核心类型：**
```typescript
interface Document {
  id: DocumentId;
  tenantId: TenantId;
  title: string;
  fileUrl: string;
  contentText?: string;
  permissionLevel: 'public' | 'department' | 'private';
  isVectorized: boolean;
}

interface DocumentChunk {
  id: ChunkId;
  documentId: DocumentId;
  chunkIndex: number;
  content: string;
  vectorId: string;  // 向量数据库中的 ID
}

interface SearchResult {
  chunk: DocumentChunk;
  document: Document;
  score: number;
}
```

**核心方法：**
```typescript
abstract class KnowledgeBaseService {
  abstract upload(file: File, userId: UserId): Promise<Document>;
  abstract vectorize(documentId: DocumentId): Promise<void>;
  abstract search(query: string, userId: UserId): Promise<SearchResult[]>;
  abstract getAccessibleDocs(userId: UserId): Promise<Document[]>;
}
```

**Model-facing Tools：**
```typescript
ctx.tool('knowledge/search', { /* schema */ }, async (input) => {
  const results = await ctx.knowledge.search(input.query, input.userId);
  return results.map(r => ({
    content: r.chunk.content,
    source: `${r.document.title} (chunk ${r.chunk.chunkIndex})`,
    score: r.score,
  }));
});
```

---

## 插件依赖关系

```
dsh-tenant (P0)
    ↓
dsh-user (P0)
    ↓
dsh-organization (P0)
    ↓
    ├─→ dsh-task-management (P0)
    ├─→ dsh-ai-assistant (P1)
    └─→ dsh-knowledge-base (P1)
```

**加载顺序：**
1. `dsh-tenant` 必须最先加载（提供数据库和租户上下文）
2. `dsh-user` 依赖 `tenant`（用户归属于租户）
3. `dsh-organization` 依赖 `user`（组织包含用户）
4. 其他插件依赖 `organization`（任务、文档都关联组织）

---

## 统一的 Cordis 集成模式

所有企业插件遵循相同的模式：

### 1. 插件入口（index.ts）
```typescript
export const name = '@deepseek-ai/dsh-xxx';

export function apply(ctx: Context, config: XxxConfig) {
  ctx.provide('xxx', undefined, true);

  ctx.on('ready', async () => {
    const { XxxServiceImpl } = await import('./service-impl.js');
    const service = new XxxServiceImpl(ctx, config);
    await service.initialize();
    ctx.set('xxx', service);
  });

  ctx.on('dispose', async () => {
    await ctx.xxx?.dispose();
  });
}
```

### 2. Service Definition（service.ts）
```typescript
export abstract class XxxService extends Service {
  abstract methodA(): Promise<Result>;
  abstract methodB(input: Input): Promise<void>;
}

// 扩展 Context 类型
declare module '@deepseek-ai/cordis' {
  interface Context {
    xxx: XxxService;
  }
  
  interface Events {
    'xxx/event-name'(data: EventData): void;
  }
}
```

### 3. Service Provider（service-impl.ts）
```typescript
export class XxxServiceImpl extends XxxService {
  constructor(ctx: Context, private config: XxxConfig) {
    super(ctx, 'xxx');
  }

  async initialize(): Promise<void> {
    // 初始化逻辑
  }

  async methodA(): Promise<Result> {
    // 实现
  }

  async dispose(): Promise<void> {
    // 清理资源
  }
}
```

---

## 数据库访问模式

所有插件通过 `dsh-tenant` 提供的连接池访问数据库：

```typescript
// 自动带租户隔离
const result = await ctx.tenant.db.query(
  'SELECT * FROM tasks WHERE assignee_ids @> $1',
  [userId]
);

// 手动设置租户上下文
await ctx.tenant.withContext(tenantId, async () => {
  // 所有查询自动过滤 tenant_id
});
```

---

## 测试策略

每个插件包含：

### 1. 单元测试（src/\*.test.ts）
- Service 方法的行为测试
- 不依赖真实数据库（使用 mock）

### 2. 集成测试（test/integration.test.ts）
- 完整的数据库操作测试
- 租户隔离验证
- 权限检查测试

### 3. E2E 测试（test/e2e.test.ts）
- 跨插件的完整流程测试
- 如：创建租户 → 创建用户 → 创建任务

---

## 下一步行动

1. ✅ **已完成：** `dsh-tenant` 插件骨架
2. 📝 **进行中：** 完成插件骨架规划文档
3. ⏭️ **待办：** 创建其余 5 个插件的骨架
4. ⏭️ **待办：** 编写 Demo 演示场景

**是否继续创建其他插件的骨架代码，还是先完成当前规划确认？**
