/**
 * Chinese display overrides for skill catalog entries: purely presentational
 * translations of `name`/`description` keyed by the skill's stable id, kept
 * separate from the catalog data itself (SKILL.md frontmatter) so upstream
 * skill content is never edited and stays safe across skill updates/syncs.
 * A skill with no entry here falls back to its original catalog text.
 *
 * @module dsh-skill-plaza/client/locales-zh
 */

/** One skill's Chinese display override. */
interface SkillTranslation {
  readonly name: string
  readonly description: string
}

/** Skill id → Chinese display name/description. Extend as new skills are added. */
export const SKILL_NAME_ZH: Readonly<Record<string, SkillTranslation>> = {
  'animation-vocabulary': {
    name: '动效术语查询',
    description: '将一段动效描述反查为准确的专业术语（例如"弹窗弹出时那种弹跳感"→ Pop in；"iOS 那种回弹滚动"→ Rubber-banding）。用于在不知道术语时，为提问或设计沟通找到准确的词汇，而非用于设计或实现动效本身。',
  },
  'apple-design': {
    name: 'Apple 设计风格',
    description: '将 Apple 的界面设计理念与流畅、拟真的动效手法应用到 Web 端。适用于手势驱动界面、弹簧动画、拖拽/滑动/面板交互、带惯性且可中断的过渡、半透明材质与层次感、排版细节（光学字号、字间距、行高）、无障碍减弱动效，以及 Apple 风格界面背后的设计基础（反馈、空间一致性、克制）。',
  },
  'brainstorming': {
    name: '需求头脑风暴',
    description: '在编写实现计划或代码之前，用于规划新功能、体验变更、流程调整或其他行为改动。若是范围明确的普通 bug 修复，请改用"系统化调试"。',
  },
  'company-knowledge': {
    name: '企业知识库',
    description: '用于回答关于公司产品、功能、定价、竞品或客户常见问题、销售话术等问题——回答必须基于下方收录的公司文档，而非通用知识。',
  },
  'dispatching-parallel-agents': {
    name: '并行任务调度',
    description: '当两个或多个任务彼此独立、没有共享状态、没有文件重叠、也没有先后依赖关系时，用于并行调查或实现。',
  },
  'doc-polish': {
    name: '文档润色',
    description: '用于协助撰写、组织或润色文档——提案、技术方案、决策文档、内部制度等结构化商务写作。引导完成背景收集、结构梳理与最终可读性检查。',
  },
  'dws': {
    name: '钉钉助手',
    description: '管理钉钉产品能力（AI 表格/AI 搜问/日历/通讯录/群聊与机器人/待办/审批/考勤/日志/DING 消息/开放平台文档/钉钉文档/钉钉云盘/原生 Markdown 文件/AI 听记/邮箱/在线电子表格/知识库等）。当用户需要操作表格数据、管理日程会议、模糊找人/查谁负责某事项、查询通讯录、管理群聊、机器人发消息、创建待办、提交审批、查看考勤、提交日报周报、读写钉钉文档、上传下载云盘文件、读取或修改原生 .md 文件、查询听记纪要、收发邮件、读写在线电子表格、管理钉钉知识库，或订阅个人 IM 事件时使用。',
  },
  'emil-design-eng': {
    name: 'Emil 设计工程哲学',
    description: '收录 Emil Kowalski 关于界面打磨、组件设计、动效决策，以及那些让软件"感觉很棒"的细节的设计理念。',
  },
  'executing-plans': {
    name: '执行实现计划',
    description: '用于在实现计划获得批准后，按任务逐项执行，同时控制范围、进行验证并跟踪进度。',
  },
  'find-animation-opportunities': {
    name: '发现动效机会点',
    description: '在代码库或界面中查找"本应有动效却没有"的位置，并排除不适合添加动效的场景。只读、不实现：仅给出具体动效建议与参数值。适用于"这里能加什么动效？"或想让界面"更有生命力"的场景；若是修复已有动效，请改用"动效改进"或"动效审查"。',
  },
  'improve-animations': {
    name: '动效改进规划',
    description: '以资深动效顾问的视角审视代码库中的动效实现，产出优先级排序的审查报告与可交给其他智能体（或更低成本模型）执行的独立实现计划。只读、不落地修改——只做规划。适用于"改进一下动效"、"审查一下动效"、"让这个应用感觉更好"，或需要一份动效修复路线图而非单次 diff 审查的场景。',
  },
  'minimal-diff-builder': {
    name: '最小化改动构建',
    description: '在不过度设计、不做大范围重构、不引入不必要依赖或投机性抽象的前提下，构建最小且正确的代码改动。适用于用户想要最小补丁、易于审查的小改动、优先使用标准库、或在保证安全性、可访问性、边界校验与数据安全的前提下追求最短路径修复的场景。',
  },
  'poster-design': {
    name: '海报设计',
    description: '用于为公司制作海报、横幅、社交媒体图、活动传单等静态营销视觉物料。先确立设计理念，再将其表达为一份完整的单页视觉作品。',
  },
  'ppt-outline': {
    name: 'PPT 大纲生成',
    description: '用于制作 PPT、幻灯片或演示大纲——适用于路演、汇报、培训材料或项目评审。产出逐页结构化大纲及每页演讲备注，供后续制作成正式幻灯片。',
  },
  'receiving-code-review': {
    name: '代码评审意见处理',
    description: '用于在落实代码评审反馈之前进行评估，尤其当反馈不清晰、与需求冲突，或可能不适用于当前代码库时。',
  },
  'requesting-code-review': {
    name: '发起代码评审',
    description: '用于在完成较大或高风险的实现任务后、合并代码前，或需要针对已批准计划与代码库 diff 进行独立评审时使用。',
  },
  'review-animations': {
    name: '动效质量审查',
    description: '依据 Emil Kowalski 的设计工程理念，对动效与动画代码进行高标准审查。默认倾向于指出问题，通过审查需要充分依据。',
  },
  'simple-plan': {
    name: '简单任务计划',
    description: '用于没有架构决策、通常只涉及一两个文件、实现步骤不超过八步的直接了当的任务，如小型 bug 修复、重命名、开关变更或范围明确的小型重构；更大或不明确的工作请使用"编写计划"。',
  },
  'spreadsheet-helper': {
    name: '表格助手',
    description: '用于协助设计、组织或整理表格类数据——费用跟踪表、项目跟踪表、数据清理方案，或类 Excel 文件的简单公式/汇总逻辑。产出结构化表格方案与公式指导，而非直接操作二进制文件。',
  },
  'systematic-debugging': {
    name: '系统化调试',
    description: '在提出或实施修复方案之前，用于处理 bug、测试失败、构建失败、性能问题或异常行为。',
  },
  'test-driven-development': {
    name: '测试驱动开发',
    description: '用于实现 bug 修复或可测试的行为变更，尤其在计费、鉴权、存储、队列、迁移、并发、API 等易回归的逻辑中使用。',
  },
  'verification-before-completion': {
    name: '完成前验证',
    description: '在声明工作已完成、已修复、测试通过、可提交或可发布之前使用。要求提供能证明具体结论的最新命令输出与验收证据。',
  },
  'work-report': {
    name: '工作汇报撰写',
    description: '用于撰写内部工作沟通材料——周报/月报、状态更新、管理层汇报、项目进展、会议纪要、FAQ 答复或公司公告等。',
  },
  'writing-plans': {
    name: '编写实现计划',
    description: '当设计已获批准、bug 根因已确认，或多步骤需求已明确具体时，用于将其转化为一份实现计划，供后续开始代码改动。',
  },
}

/** Look up a skill's Chinese display name, falling back to its original catalog name. */
export function displayName(id: string, fallback: string): string {
  return SKILL_NAME_ZH[id]?.name ?? fallback
}

/** Look up a skill's Chinese display description, falling back to its original catalog description. */
export function displayDescription(id: string, fallback: string): string {
  return SKILL_NAME_ZH[id]?.description ?? fallback
}
