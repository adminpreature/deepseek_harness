import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const markdownSection = (markdown, heading) => {
  const marker = `## ${heading}`;
  const start = markdown.indexOf(marker);
  assert.notEqual(start, -1, `missing markdown section: ${heading}`);

  const contentStart = start + marker.length;
  const nextSection = markdown.indexOf('\n## ', contentStart);
  return markdown.slice(
    contentStart,
    nextSection === -1 ? markdown.length : nextSection,
  );
};

const markdownSubsection = (markdown, heading) => {
  const marker = `### ${heading}`;
  const start = markdown.indexOf(marker);
  assert.notEqual(start, -1, `missing markdown subsection: ${heading}`);

  const contentStart = start + marker.length;
  const nextSubsection = markdown.indexOf('\n### ', contentStart);
  return markdown.slice(
    contentStart,
    nextSubsection === -1 ? markdown.length : nextSubsection,
  );
};

const cssBlock = (source, prelude) => {
  let searchFrom = 0;

  while (searchFrom < source.length) {
    const start = source.indexOf(prelude, searchFrom);
    if (start === -1) {
      assert.fail(`missing CSS block: ${prelude}`);
    }

    let openingBrace = start + prelude.length;
    while (/\s/.test(source[openingBrace] ?? '')) {
      openingBrace += 1;
    }

    if (source[openingBrace] !== '{') {
      searchFrom = start + prelude.length;
      continue;
    }

    let depth = 0;
    let quote = null;
    let inComment = false;

    for (let index = openingBrace; index < source.length; index += 1) {
      const character = source[index];
      const nextCharacter = source[index + 1];

      if (inComment) {
        if (character === '*' && nextCharacter === '/') {
          inComment = false;
          index += 1;
        }
        continue;
      }

      if (quote) {
        if (character === '\\') {
          index += 1;
        } else if (character === quote) {
          quote = null;
        }
        continue;
      }

      if (character === '/' && nextCharacter === '*') {
        inComment = true;
        index += 1;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '{') {
        depth += 1;
      } else if (character === '}') {
        depth -= 1;
        if (depth === 0) {
          return source.slice(openingBrace + 1, index);
        }
      }
    }

    assert.fail(`unclosed CSS block: ${prelude}`);
  }

  assert.fail(`missing CSS block: ${prelude}`);
};

const assertMarkdownListItems = (section, items, label) => {
  for (const item of items) {
    assert.match(
      section,
      new RegExp(`^- ${escapeRegExp(item)}。?$`, 'm'),
      `missing exact ${label} list item: ${item}`,
    );
  }
};

test('skill identity is Yiqi UI Standard', async () => {
  const skill = await read('SKILL.md');
  const readme = await read('README.md');
  const agentMetadata = await read('agents/openai.yaml');

  assert.match(skill, /^name: yiqi-ui-standard$/m);
  assert.match(skill, /^# Yiqi UI Standard$/m);
  assert.match(skill, /快速统一 UI 规范/);
  assert.match(readme, /^# Yiqi UI Standard$/m);
  assert.match(readme, /快速帮助开发人员统一 UI 规范/);
  assert.match(agentMetadata, /display_name: "Yiqi UI Standard"/);
  assert.match(agentMetadata, /快速帮助开发人员建立、应用和检查统一的 UI 规范/);
  assert.match(agentMetadata, /\$yiqi-ui-standard/);
});

test('SKILL entry asks brand mode before project stage', async () => {
  const skill = await read('SKILL.md');

  assert.match(skill, /第 0 步：品牌模式/);
  assert.match(skill, /使用品牌指导（默认）/);
  assert.match(skill, /第 1 步：项目阶段/);
  assert.match(skill, /规划与需求/);
  assert.match(skill, /代码实现/);
  assert.match(skill, /已有页面审查或改进/);
  assert.ok(
    skill.indexOf('第 0 步：品牌模式') <
      skill.indexOf('第 1 步：项目阶段'),
  );
});

test('planning mode has a dedicated approval-gated workflow', async () => {
  const planning = await read('references/planning-workflow.md');
  const skill = await read('SKILL.md');

  assert.match(skill, /references\/planning-workflow\.md/);
  assert.match(planning, /不询问技术栈/);
  assert.match(planning, /不生成代码/);
  assert.match(planning, /完整 UI 需求规范/);
  assert.match(planning, /2–3 个布局方向/);
  assert.match(planning, /用户批准[\s\S]*前[\s\S]*不进入代码实现/);
  assert.match(planning, /不生成面向产品交付或运行的生产实现代码/);
  assert.match(planning, /允许创建隔离的临时浏览器决策稿/);
  assert.match(planning, /临时稿不得进入产品源码/);
  assert.match(planning, /临时稿不得绑定技术栈/);
  assert.match(planning, /用户批准后应丢弃或重新实现/);
});

test('product profiles support composite products and page overrides', async () => {
  const skill = await read('SKILL.md');
  const archetypes = await read('references/product-archetypes.md');

  assert.match(skill, /references\/product-archetypes\.md/);
  assert.match(skill, /### 第 2 步：产品画像/);
  assert.match(skill, /一个产品主类型/);
  assert.match(skill, /零到三个次类型/);
  assert.match(skill, /当前页面或路由的页面级类型/);
  assert.match(skill, /复合产品不得强行归为单一类型/);
  assert.match(skill, /布局和密度按页面主要任务校准/);
  assert.ok(
    skill.indexOf('第 1 步：项目阶段') <
      skill.indexOf('第 2 步：产品画像'),
    'project stage selection must precede product profiling',
  );
  assert.match(
    skill,
    /规划与需求阶段按 `references\/planning-workflow\.md` 的访谈顺序，在目标用户和主要任务之后确认产品画像/,
  );
  assert.match(
    skill,
    /代码实现和已有页面审查或改进阶段，在进入对应工作前确认产品画像/,
  );

  assert.match(archetypes, /1 个主类型/);
  assert.match(archetypes, /0–3 个次类型/);
  assert.match(archetypes, /页面级画像/);
  assert.match(
    archetypes,
    /主类型决定整体导航、默认信息密度、核心工作节奏和主要壳层/,
  );
  assert.match(archetypes, /次类型只补充其对应功能/);
  assert.match(
    archetypes,
    /品牌、暗色主题、字体范围、连续圆角和卡片材质保持产品级关联/,
  );

  assert.match(archetypes, /主要任务：浏览、创建、管理、分析、交易、协作/);
  assert.match(archetypes, /信息密度：低、中、高/);
  assert.match(archetypes, /使用节奏：一次性、周期性、持续工作/);
  assert.match(archetypes, /操作风险：普通、敏感、不可逆/);
  assert.match(archetypes, /Hero \/ No Hero/);
  assert.match(archetypes, /approved layout/);
  assert.match(
    archetypes,
    /approved layout（已批准布局方向）[\s\S]*当前页面对应的 Hero、SaaS 或其他产品规范[\s\S]*经用户批准的结构方向[\s\S]*不是固定全局模板/,
  );

  assert.match(
    archetypes,
    /品牌信号继续保留，但不能破坏高密度工作流、数据辨识和关键操作/,
  );

  assert.match(archetypes, /一个 AI 商业平台可以采用以下画像/);
  assert.match(archetypes, /主类型：AI 创作 \/ 对话工作台/);
  assert.match(
    archetypes,
    /次类型：运营管理 SaaS、数据分析 \/ 监控看板、电商 \/ 交易 \/ 支付/,
  );
  assert.match(archetypes, /官网：品牌官网 \/ 营销转化，有 Hero/);
  assert.match(archetypes, /创作区：AI 创作 \/ 对话工作台，无 Hero/);
  assert.match(archetypes, /项目管理：运营管理 SaaS/);
  assert.match(archetypes, /数据中心：数据分析 \/ 监控看板/);
  assert.match(
    archetypes,
    /订阅结算：电商 \/ 交易 \/ 支付，并按敏感或不可逆操作处理交易与风险/,
  );

  const productArchetypes = [
    '品牌官网 / 营销转化',
    '产品介绍 / 发布页面',
    '内容 / 知识 / 文档',
    '电商 / 交易 / 支付',
    '社区 / 协作 / 消息',
    'C 端工具 / 移动应用',
    '运营管理 SaaS',
    'AI 创作 / 对话工作台',
    '数据分析 / 监控看板',
    '平台 / 市场 / 多角色系统',
    '个人中心 / 钱包 / 账户',
    '表单流程 / 向导 / 申请系统',
  ];

  for (const archetype of productArchetypes) {
    assert.match(
      archetypes,
      new RegExp(archetype),
      `missing product archetype: ${archetype}`,
    );
  }

  const conflictPriority = [
    '安全、可用性和任务效率',
    '当前页面的主要任务',
    '当前页面类型',
    '产品主类型',
    '产品次类型',
    '品牌视觉表达',
  ];

  let previousPriorityIndex = -1;
  for (const priority of conflictPriority) {
    const priorityIndex = archetypes.indexOf(priority);
    assert.ok(
      priorityIndex > previousPriorityIndex,
      `conflict priority is missing or out of order: ${priority}`,
    );
    previousPriorityIndex = priorityIndex;
  }
});

test('Hero rules constrain type scale and reject decorative split layouts', async () => {
  const skill = await read('SKILL.md');
  const hero = await read('references/hero-standards.md');
  const routing = markdownSection(hero, '路由原则');
  const prohibitions = markdownSection(hero, '禁止');

  assert.match(skill, /references\/hero-standards\.md/);
  assert.match(skill, /### 第 3 步：Hero \/ No Hero/);
  assert.ok(
    skill.indexOf('第 2 步：产品画像') <
      skill.indexOf('第 3 步：Hero / No Hero'),
    'product profiling must precede Hero / No Hero routing',
  );
  assert.match(
    skill,
    /规划与需求阶段[\s\S]*references\/planning-workflow\.md[\s\S]*页面地图[\s\S]*密度[\s\S]*素材状态[\s\S]*第 7 项决定 Hero/,
  );
  assert.match(
    skill,
    /代码实现和已有页面审查或改进阶段，在产品画像和页面主要任务确认后执行 Hero 路由/,
  );

  const routingRule =
    '同时判断当前页面主要任务和页面类型，自动选择 Hero 或 No Hero；冲突时遵循 `references/product-archetypes.md` 的优先级，当前页面主要任务优先于页面类型。';
  assert.ok(skill.includes(routingRule));
  assert.ok(routing.includes(routingRule));
  assert.match(
    routing,
    /持续操作、数据或任务壳层默认使用 No Hero/,
  );
  assert.match(skill, /允许用户覆盖/);
  assert.match(skill, /不得默认生成左右分栏 Hero/);
  assert.match(routing, /允许用户覆盖/);

  const allowedHeroPages = [
    '品牌官网',
    '产品介绍',
    '发布页面',
    '部分低密度服务页',
  ];

  assert.match(
    routing,
    /允许 Hero 的页面包括品牌官网、产品介绍、发布页面和部分低密度服务页/,
  );

  for (const page of allowedHeroPages) {
    assert.match(
      routing,
      new RegExp(page),
      `missing allowed Hero page: ${page}`,
    );
  }

  assert.match(
    routing,
    /部分低密度服务页[\s\S]*主要任务为浏览、理解或咨询转化/,
  );
  assert.match(routing, /低信息密度/);
  assert.match(routing, /非持续工作/);
  assert.match(routing, /无数据管理或批量操作壳层/);
  assert.match(
    routing,
    /若存在持续任务、数据或操作，则使用 No Hero/,
  );

  assert.match(hero, /36–42px/);
  assert.match(hero, /30–36px/);
  assert.match(hero, /H1 使用品牌、产品名或明确服务类别/);
  assert.match(hero, /同一视口不连续出现多个 H1/);
  assert.match(hero, /字号不得随视口无限放大/);

  assert.match(hero, /真实产品或对象的?全幅媒体/);
  assert.match(hero, /可检查的?产品界面或工作状态/);
  assert.match(hero, /编辑式内容构图/);

  assert.match(hero, /品牌或产品必须成为第一信号/);
  assert.match(hero, /首屏[\s\S]*露出下一业务内容/);
  assert.match(hero, /主要视觉承载产品、服务过程或真实状态/);
  assert.match(hero, /无真实素材时采用内容主导的构图，并输出素材需求/);
  assert.match(hero, /data-ui-hero-media/);
  assert.match(hero, /data-ui-product-state/);

  const forbiddenPatterns = [
    '默认左右文案/装饰图分栏',
    '大型抽象圆形、轨道、光球和无信息几何',
    '装饰图冒充产品视觉',
    'Hero 主内容放进装饰卡片',
    '超大标题和大空白代替层级',
  ];

  for (const pattern of forbiddenPatterns) {
    assert.match(
      prohibitions,
      new RegExp(
        `^- (?:禁止|不得)[^\\n]*${escapeRegExp(pattern)}[^\\n]*$`,
        'm',
      ),
      `missing prohibition or wrong semantic polarity: ${pattern}`,
    );
  }
});

test('operational products route to No Hero', async () => {
  const hero = await read('references/hero-standards.md');
  const noHero = markdownSection(hero, 'No Hero 默认页面');
  const noHeroProducts = [
    'SaaS 工作台',
    'AI 持续操作工具',
    '管理后台',
    '数据分析和监控页面',
    '表格/审批/项目/批量操作页面',
    '个人中心/钱包/账户操作页面',
  ];

  assert.match(noHero, /以下页面默认使用 No Hero/);

  for (const product of noHeroProducts) {
    assert.match(
      noHero,
      new RegExp(`^- ${escapeRegExp(product)}$`, 'm'),
      `missing No Hero product route: ${product}`,
    );
  }

  assert.match(
    noHero,
    /No Hero 页面直接显示导航、当前任务、数据、状态和主要操作/,
  );
});

test('SaaS reference includes all approved workbench shells', async () => {
  const skill = await read('SKILL.md');
  const saas = await read('references/saas-workbench-standards.md');
  const commonRules = markdownSection(saas, '共同规则');
  const operations = markdownSection(saas, '运营管理型');
  const aiCreation = markdownSection(saas, 'AI 创作型');
  const analytics = markdownSection(saas, '数据分析型');

  assert.match(skill, /references\/saas-workbench-standards\.md/);
  assert.match(skill, /### 第 4 步：SaaS 壳层/);
  assert.ok(
    skill.indexOf('第 3 步：Hero / No Hero') <
      skill.indexOf('第 4 步：SaaS 壳层'),
    'Hero / No Hero routing must precede SaaS shell selection',
  );
  assert.match(
    skill,
    /运营管理、AI 创作或数据分析[\s\S]*读取 `references\/saas-workbench-standards\.md`[\s\S]*选择对应壳层/,
  );
  assert.match(skill, /三类都 No Hero/);
  assert.match(
    skill,
    /规划阶段只记录已批准壳层方向，不生成工作台实现/,
  );
  assert.match(
    skill,
    /代码实现\/审查阶段在页面主要任务和 Hero 路由后应用壳层/,
  );

  const sharedRules = [
    '默认暗色',
    '不生成营销 Hero',
    '页面标题 20–24px',
    '面板标题 16–18px',
    '卡片标题 16–18px',
    '正文和控件 13–16px',
    '主要任务、数据和状态进入第一视口',
    '控件和固定格式区域稳定尺寸',
    '不用装饰卡片填充页面，不堆叠装饰卡片',
    '连续大圆角不能损害表格、筛选和高密度信息空间效率',
    '表格、列表行、筛选栏、工具栏、数据网格、停靠面板是工作台结构区域，不定义为卡片，可使用直边或控件级圆角',
    '只有独立、可识别的内容容器才是卡片，并继续使用统一连续大圆角',
    '不得为了应用大圆角把每个区域包成卡片，也不得通过缩小卡片圆角建立另一套卡片语言',
    '三类都 No Hero',
  ];

  assertMarkdownListItems(commonRules, sharedRules, 'SaaS common rule');

  const operationalRules = [
    '固定或可折叠侧栏',
    '上下文工具栏',
    '搜索、筛选和批量操作',
    '表格、列表、审批和项目状态',
    '优先保证扫描、比较和操作效率',
  ];

  assertMarkdownListItems(
    operations,
    operationalRules,
    'operational workbench rule',
  );

  const aiCreationRules = [
    '导航栏或项目栏',
    '主画布、对话区或输出工作区',
    '参数检查器或上下文面板',
    '明确运行、等待、完成、错误和恢复状态',
    '输入输出保持空间和任务关联',
  ];

  assertMarkdownListItems(
    aiCreation,
    aiCreationRules,
    'AI creation workbench rule',
  );

  const analyticsRules = [
    '导航与时间范围',
    '维度和筛选控制',
    '指标、趋势、比较和明细',
    '异常状态和数据解释',
    '数字对齐、单位和时间范围清晰',
  ];

  assertMarkdownListItems(
    analytics,
    analyticsRules,
    'analytics workbench rule',
  );
});

test('v2 tokens are dark-first and include role typography', async () => {
  const tokens = JSON.parse(await read('design-tokens.json'));
  const serializedTokens = JSON.stringify(tokens);

  assert.equal(tokens.meta.version, '2.0.0');
  assert.equal(tokens.theme.default, 'dark');
  assert.equal(tokens.theme.lightGeneratedOnlyWhenRequested, true);
  assert.equal(tokens.darkColors.surfaceElevated, '#1B1B20');
  assert.equal(tokens.darkColors.elevated, undefined);
  assert.doesNotMatch(serializedTokens, /\{darkColors\.elevated\}/);
  assert.equal(
    tokens.semanticColors.background.elevated,
    '{darkColors.surfaceElevated}',
  );
  assert.equal(tokens.semanticColors.background.page, '{darkColors.page}');
  assert.equal(tokens.semanticColors.text.inverse, '{colors.common.white}');
  assert.equal(tokens.semanticColors.text.onAccent, '{darkColors.page}');
  assert.equal(tokens.semanticColors.status.info.foreground, '#D7BCE8');
  assert.equal(
    tokens.semanticColors.background.success,
    'rgba(50, 122, 91, 0.18)',
  );
  assert.equal(
    tokens.semanticColors.background.danger,
    'rgba(185, 74, 90, 0.18)',
  );
  assert.equal(
    tokens.semanticColors.border.success,
    '{colors.success.500}',
  );
  assert.equal(
    tokens.semanticColors.border.danger,
    '{colors.danger.500}',
  );

  assert.deepEqual(tokens.typography.roles.marketingH1, {
    desktop: { min: '36px', max: '42px' },
    mobile: { min: '30px', max: '36px' },
  });
  assert.deepEqual(tokens.typography.roles.pageTitle, {
    desktop: { min: '28px', max: '32px' },
    mobile: { min: '24px', max: '28px' },
  });
  assert.deepEqual(tokens.typography.roles.sectionTitle, {
    desktop: { min: '22px', max: '24px' },
    mobile: { min: '20px', max: '22px' },
  });
  assert.deepEqual(tokens.typography.roles.cardTitle, {
    desktop: { min: '16px', max: '20px' },
    mobile: { min: '16px', max: '18px' },
  });
  assert.deepEqual(tokens.typography.roles.saasPageTitle, {
    min: '20px',
    max: '24px',
  });
  assert.deepEqual(tokens.typography.roles.saasPanelTitle, {
    min: '16px',
    max: '18px',
  });
  assert.deepEqual(tokens.typography.roles.saasBody, {
    min: '13px',
    max: '16px',
  });
  assert.equal(tokens.typography.fontSize['5xl'], '42px');
  assert.equal(tokens.typography.lineHeight['5xl'], '48px');
});

test('cards use one continuous large-radius token and two materials', async () => {
  const tokens = JSON.parse(await read('design-tokens.json'));
  const theme = await read('theme.css');
  const cardBlock = cssBlock(theme, '[data-ui-card]');
  const solidBlock = cssBlock(
    theme,
    ':root[data-ui-card-material="solid"]',
  );
  const glassBlock = cssBlock(
    theme,
    ':root[data-ui-card-material="liquid-glass"]',
  );
  const glassFilterBlock = cssBlock(
    theme,
    ':root[data-ui-card-material="liquid-glass"] [data-ui-card]',
  );
  const reducedTransparencyBlock = cssBlock(
    theme,
    '@media (prefers-reduced-transparency: reduce)',
  );
  const reducedGlassBlock = cssBlock(
    reducedTransparencyBlock,
    ':root[data-ui-card-material="liquid-glass"]',
  );
  const reducedFilterBlock = cssBlock(
    reducedTransparencyBlock,
    ':root[data-ui-card-material="liquid-glass"] [data-ui-card]',
  );

  assert.equal(tokens.borderRadius.card, '36px');
  assert.deepEqual(tokens.borderRadius.cardMobile, {
    min: '28px',
    default: '32px',
    max: '36px',
  });
  assert.deepEqual(tokens.cardMaterials, {
    defaultQuestionRequired: true,
    solid: {
      background: '{darkColors.surface}',
      border: '{darkColors.border}',
      shadow: '0 18px 60px rgba(0, 0, 0, 0.22)',
    },
    liquidGlass: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.16)',
      backdropBlur: '24px',
      backdropSaturation: '140%',
      reducedTransparencyFallback: '{cardMaterials.solid}',
      unsupportedBackdropFallback: '{cardMaterials.solid}',
      fallbackOverrides: {
        backdropFilter: 'none',
      },
    },
  });
  const serializedLiquidGlass = JSON.stringify(
    tokens.cardMaterials.liquidGlass,
  );
  assert.equal(
    Object.hasOwn(
      tokens.cardMaterials.liquidGlass,
      'reducedTransparencyMaterial',
    ),
    false,
  );
  assert.equal(
    Object.hasOwn(
      tokens.cardMaterials.liquidGlass,
      'unsupportedBackdropMaterial',
    ),
    false,
  );
  assert.doesNotMatch(serializedLiquidGlass, /\{darkColors\.surface\}/);
  assert.doesNotMatch(serializedLiquidGlass, /\{darkColors\.border\}/);
  assert.doesNotMatch(
    serializedLiquidGlass,
    /0 18px 60px rgba\(0, 0, 0, 0\.22\)/,
  );

  assert.match(theme, /color-scheme:\s*dark/);
  assert.match(theme, /--radius-card:\s*36px/);
  assert.match(cardBlock, /border-radius:\s*var\(--radius-card\)/);
  assert.match(cardBlock, /corner-shape:\s*squircle/);
  assert.match(cardBlock, /box-shadow:\s*var\(--card-shadow\)/);
  assert.match(solidBlock, /--card-shadow:\s*var\(--card-solid-shadow\)/);
  assert.doesNotMatch(theme, /data-card-material=/);
  assert.match(glassBlock, /--card-shadow:\s*none/);
  assert.match(
    glassFilterBlock,
    /backdrop-filter:\s*blur\(var\(--card-glass-blur\)\)\s+saturate\(var\(--card-glass-saturation\)\)/,
  );
  assert.match(
    reducedGlassBlock,
    /--card-background:\s*var\(--card-solid-bg\)/,
  );
  assert.match(
    reducedGlassBlock,
    /--card-border:\s*var\(--card-solid-border\)/,
  );
  assert.match(
    reducedGlassBlock,
    /--card-shadow:\s*var\(--card-solid-shadow\)/,
  );
  assert.match(reducedFilterBlock, /backdrop-filter:\s*none/);
});

test('theme CSS exposes the approved v2 public token interface', async () => {
  const theme = await read('theme.css');
  const rootBlock = cssBlock(theme, ':root');
  const expectedVariables = {
    '--text-marketing-h1-min': '36px',
    '--text-marketing-h1-max': '42px',
    '--text-marketing-h1-mobile-min': '30px',
    '--text-marketing-h1-mobile-max': '36px',
    '--text-page-title-desktop-min': '28px',
    '--text-page-title-desktop-max': '32px',
    '--text-page-title-mobile-min': '24px',
    '--text-page-title-mobile-max': '28px',
    '--text-section-title-desktop-min': '22px',
    '--text-section-title-desktop-max': '24px',
    '--text-section-title-mobile-min': '20px',
    '--text-section-title-mobile-max': '22px',
    '--text-card-title-desktop-min': '16px',
    '--text-card-title-desktop-max': '20px',
    '--text-card-title-mobile-min': '16px',
    '--text-card-title-mobile-max': '18px',
    '--text-saas-page-title-min': '20px',
    '--text-saas-page-title-max': '24px',
    '--text-saas-panel-title-min': '16px',
    '--text-saas-panel-title-max': '18px',
    '--text-saas-body-min': '13px',
    '--text-saas-body-max': '16px',
    '--radius-card-mobile-min': '28px',
    '--radius-card-mobile-default': '32px',
    '--radius-card-mobile-max': '36px',
    '--card-solid-bg': 'var(--color-bg-surface)',
    '--card-solid-border': 'var(--color-border-default)',
    '--card-solid-shadow': '0 18px 60px rgba(0, 0, 0, 0.22)',
    '--card-glass-bg': 'rgba(255, 255, 255, 0.08)',
    '--card-glass-border': 'rgba(255, 255, 255, 0.16)',
    '--card-glass-blur': '24px',
    '--card-glass-saturation': '140%',
  };

  for (const [name, value] of Object.entries(expectedVariables)) {
    assert.match(
      rootBlock,
      new RegExp(`${escapeRegExp(name)}:\\s*${escapeRegExp(value)};`),
      `missing or incorrect public CSS variable: ${name}`,
    );
  }

  assert.doesNotMatch(rootBlock, /--type-/);
  assert.doesNotMatch(rootBlock, /--text-page-title-(?:min|max):/);
  assert.doesNotMatch(rootBlock, /--text-section-title-(?:min|max):/);
  assert.doesNotMatch(rootBlock, /--text-card-title-(?:min|max):/);
  assert.doesNotMatch(rootBlock, /--color-dark-elevated/);
  assert.match(rootBlock, /--color-dark-surface-elevated:\s*#1b1b20/i);
  assert.match(
    rootBlock,
    /--color-bg-elevated:\s*var\(--color-dark-surface-elevated\)/,
  );
  assert.match(rootBlock, /--color-text-inverse:\s*#fff(?:fff)?;/i);
  assert.match(
    rootBlock,
    /--color-text-on-accent:\s*var\(--color-dark-page\)/,
  );
  assert.match(
    rootBlock,
    /--color-bg-success:\s*rgba\(50,\s*122,\s*91,\s*0\.18\)/,
  );
  assert.match(
    rootBlock,
    /--color-bg-danger:\s*rgba\(185,\s*74,\s*90,\s*0\.18\)/,
  );
  assert.match(rootBlock, /--color-border-success:\s*#327a5b/i);
  assert.match(rootBlock, /--color-border-danger:\s*#b94a5a/i);
  assert.match(rootBlock, /--color-info-text:\s*#d7bce8;/i);
  assert.match(rootBlock, /--text-5xl:\s*42px/);
  assert.doesNotMatch(rootBlock, /--text-[^:]+:\s*48px/);
});

test('card runtime fallbacks are scoped to support and mobile blocks', async () => {
  const theme = await read('theme.css');
  const unsupportedBackdropBlock = cssBlock(
    theme,
    '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))',
  );
  const unsupportedGlassBlock = cssBlock(
    unsupportedBackdropBlock,
    ':root[data-ui-card-material="liquid-glass"]',
  );
  const unsupportedFilterBlock = cssBlock(
    unsupportedBackdropBlock,
    ':root[data-ui-card-material="liquid-glass"] [data-ui-card]',
  );
  const mobileBlock = cssBlock(theme, '@media (max-width: 767px)');
  const mobileRootBlock = cssBlock(mobileBlock, ':root');

  assert.match(
    unsupportedGlassBlock,
    /--card-background:\s*var\(--card-solid-bg\)/,
  );
  assert.match(
    unsupportedGlassBlock,
    /--card-border:\s*var\(--card-solid-border\)/,
  );
  assert.match(
    unsupportedGlassBlock,
    /--card-shadow:\s*var\(--card-solid-shadow\)/,
  );
  assert.match(unsupportedFilterBlock, /backdrop-filter:\s*none/);
  assert.match(
    unsupportedFilterBlock,
    /-webkit-backdrop-filter:\s*none/,
  );
  assert.match(
    mobileRootBlock,
    /--radius-card:\s*var\(--radius-card-mobile-default\)/,
  );
});

test('SKILL treats v2 visual boundaries as mandatory', async () => {
  const skill = await read('SKILL.md');

  assert.match(skill, /3\. \*\*共享硬边界与产品校准\*\*/);
  assert.match(
    skill,
    /默认暗色、排版角色范围和卡片连续大圆角是生成硬边界/,
  );
  assert.match(
    skill,
    /产品主类型、页面任务和信息密度决定布局、控件尺寸和局部密度/,
  );
  assert.match(
    skill,
    /不要求不同产品复制相同组件，但不得突破标题、Hero、卡片规则/,
  );
  assert.doesNotMatch(
    skill,
    /圆角、字号、断点和动效数值默认是建议/,
  );
});

test('visual references document dark typography and card boundaries', async () => {
  const visual = await read('references/visual-system.md');
  const guidance = await read('references/oneseven-guidance.md');
  const card = markdownSubsection(visual, '卡片（Card）');
  const button = markdownSubsection(visual, '按钮（Button）');
  const shadow = markdownSubsection(visual, '阴影 Tokens');
  const platformMapping = markdownSection(visual, '平台映射概览');

  for (const document of [visual, guidance]) {
    assert.match(document, /默认暗色/);
    assert.match(document, /36–42px/);
    assert.match(document, /30–36px/);
    assert.match(document, /28–32px/);
    assert.match(document, /24–28px/);
    assert.match(document, /22–24px/);
    assert.match(document, /20–22px/);
    assert.match(document, /16–20px/);
    assert.match(document, /16–18px/);
    assert.match(document, /20–24px/);
    assert.match(document, /13–16px/);
    assert.match(document, /36px/);
    assert.match(document, /28–36px/);
    assert.match(document, /默认 32px/);
    assert.match(document, /不得低于 28px/);
    assert.match(document, /不得另建小圆角系统/);
    assert.match(document, /实体材质[\s\S]*液态玻璃|液态玻璃[\s\S]*实体材质/);
    assert.match(document, /生成前必须询问/);
    assert.match(document, /玻璃卡片不得嵌套|玻璃材质不得嵌套/);
    assert.match(document, /减少透明[\s\S]*实体背景/);
    assert.match(
      document,
      /减少透明与不支持 backdrop filter 两个降级场景复用 solid token，不复制另一套值/,
    );
  }

  assert.match(card, /16–24px/);
  assert.match(card, /radius-card/);
  assert.match(card, /36px/);
  assert.match(card, /corner-shape:\s*squircle/);
  assert.match(card, /标题[\s\S]*16–20px[\s\S]*16–18px/);
  assert.match(card, /同一页面使用同一种卡片材质/);
  assert.match(card, /不得嵌套/);
  assert.match(card, /高密度[\s\S]*减少卡片数量[\s\S]*内边距/);
  assert.match(card, /hover/);
  assert.match(card, /focus-visible/);
  assert.doesNotMatch(card, /12px/);
  assert.doesNotMatch(card, /radius-lg/);
  assert.match(
    visual,
    /\| `color-text-inverse` \| white \| 深色中性背景上的反色文本 \|/,
  );
  assert.doesNotMatch(
    visual,
    /\| `color-text-inverse` \| dark page \|/,
  );
  assert.doesNotMatch(
    visual,
    /浅色或品牌实心背景上的反色文本/,
  );
  assert.doesNotMatch(
    visual,
    /`color-text-inverse`[^|\n]*\|[^|\n]*品牌实心背景/,
  );
  assert.match(visual, /基础 `text-5xl` 为 42px/);
  assert.match(visual, /不得超过排版角色上限/);
  assert.doesNotMatch(visual, /`text-5xl` \| 48px/);
  assert.match(
    button,
    /\| primary \|[^|]*\| color-text-on-accent \|/,
  );
  assert.match(
    button,
    /\| danger \|[^|]*\| color-text-on-accent \|/,
  );
  assert.match(button, /color-text-on-accent[\s\S]*WCAG AA/);
  assert.match(
    button,
    /\| hover \|[^|\n]*primary \/ danger[^|\n]*不得降低对比度[^|\n]*保持或提高背景亮度[^|\n]*边框、阴影或 translate[^|\n]*AA[^|\n]*\|/,
  );
  assert.match(
    button,
    /\| active \|[^|\n]*scale\(0\.98\)[^|\n]*颜色变化必须通过对比度检查[^|\n]*AA[^|\n]*\|/,
  );
  assert.doesNotMatch(button, /向深色变化/);
  assert.doesNotMatch(button, /背景再加深一档/);
  assert.doesNotMatch(
    button,
    /\| (?:primary|danger) \|[^|]*\| color-text-primary \|/,
  );
  assert.doesNotMatch(shadow, /卡片默认态|卡片悬停/);
  assert.match(shadow, /shadow-sm[\s\S]*轻微控件表面/);
  assert.match(shadow, /shadow-md[\s\S]*菜单/);
  assert.match(
    shadow,
    /卡片仅使用材质专用 shadow[\s\S]*液态玻璃无阴影[\s\S]*fallback 使用实体 shadow/,
  );
  assert.match(platformMapping, /color-primary/);
  assert.match(platformMapping, /bg-brand/);
  assert.doesNotMatch(platformMapping, /primary-700/);
});

test('OneSeven review language enforces shared boundaries', async () => {
  const guidance = await read('references/oneseven-guidance.md');
  const responsiveCardLanguage =
    '桌面 36px；移动 28–36px、默认 32px；同一连续卡片语言。';

  assert.match(
    guidance,
    /默认暗色、排版角色、Hero、卡片等共享硬边界冲突必须作为强制问题/,
  );
  assert.match(
    guidance,
    /只有布局、控件尺寸、局部密度等合理产品差异使用“建议”措辞/,
  );
  assert.doesNotMatch(
    guidance,
    /除明确品牌冲突外，优先使用“建议”“可以考虑”“需要确认局部规则”等措辞/,
  );
  assert.equal(
    guidance.match(new RegExp(escapeRegExp(responsiveCardLanguage), 'g'))
      ?.length,
    2,
  );
  assert.doesNotMatch(guidance, /36px 连续卡片语言是本 Skill/);
  assert.doesNotMatch(
    guidance,
    /独立卡片仍遵守共享的 36px 连续大圆角/,
  );
  assert.doesNotMatch(guidance, /所有独立卡片使用 36px/);
});

test('generation workflow requires static and browser validation', async () => {
  const skill = await read('SKILL.md');
  const gate = await read('references/generation-quality-gate.md');

  assert.match(skill, /## 代码实现模式/);
  assert.match(skill, /references\/generation-quality-gate\.md/);
  assert.match(skill, /scripts\/validate-generated-web\.mjs/);
  assert.match(gate, /品牌模式已确认/);
  assert.match(gate, /卡片材质已确认/);
  assert.match(gate, /真实素材状态已确认/);
  assert.match(gate, /1440 × 1000/);
  assert.match(gate, /390 × 844/);
  assert.match(gate, /静态 DOM 测试通过不能代替截图/);
  assert.match(gate, /字体资产是否真实加载/);
  assert.match(gate, /主要任务、数据和状态[\s\S]*第一视口/);
  assert.match(gate, /不得宣称[\s\S]*通过/);
});

test('quality gate keeps static validation deterministic and lightweight', async () => {
  const gate = await read('references/generation-quality-gate.md');

  assert.match(gate, /只有确定性错误由静态校验阻塞/);
  assert.match(gate, /error[\s\S]*阻塞/);
  assert.match(gate, /warning[\s\S]*浏览器[\s\S]*记录/);
  assert.match(gate, /外部样式表/);
  assert.match(gate, /复杂 CSS 级联/);
  assert.match(gate, /非 px 单位或长度计算/);
  assert.match(gate, /字体加载/);
  assert.match(gate, /不确定的视觉判断/);
  assert.match(gate, /不扩展静态校验器/);
});

test('review and platform guidance use the v2 quality contract', async () => {
  const review = await read('references/review-checklist.md');
  const platform = await read('references/platform-implementations.md');

  assert.match(review, /## 审查入口/);
  assert.match(review, /## 阻塞问题/);
  assert.match(review, /未执行静态校验/);
  assert.match(review, /桌面和移动截图/);
  assert.match(review, /静态 warning[\s\S]*浏览器[\s\S]*记录/);
  assert.match(review, /Top 5 阻塞问题/);
  assert.match(platform, /## 共同约束/);
  assert.match(platform, /默认只实现暗色主题/);
  assert.match(platform, /scripts\/validate-generated-web\.mjs/);
  assert.match(platform, /Playwright 桌面\/移动验收/);
});

test('release metadata and pressure cases cover v2 behavior', async () => {
  const version = (await read('VERSION')).trim();
  const tokens = JSON.parse(await read('design-tokens.json'));
  const cases = JSON.parse(await read('tests/evals/yiqi-ui-standard-v2-cases.json'));
  const readme = await read('README.md');

  assert.equal(version, '2.0.0');
  assert.equal(tokens.meta.version, version);
  assert.ok(cases.length >= 9);

  const ids = new Set(cases.map((entry) => entry.id));
  for (const id of [
    'planning-greenfield',
    'marketing-implementation',
    'service-without-media',
    'mobile-consumer-product',
    'saas-operations',
    'saas-ai-workspace',
    'saas-analytics',
    'composite-product',
    'review-baseline',
  ]) {
    assert.ok(ids.has(id), `missing eval: ${id}`);
  }

  assert.match(readme, /静态校验存在 error 时阻塞/);
  assert.match(readme, /warning[\s\S]*浏览器[\s\S]*复核并记录/);
  assert.match(readme, /外部样式表/);
  assert.match(readme, /复杂 CSS 级联/);
  assert.match(readme, /非 px 单位或长度计算/);
  assert.match(readme, /字体加载/);
  assert.match(readme, /视觉质量/);
});
