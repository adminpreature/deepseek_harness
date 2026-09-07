#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VALID_PAGE_TYPES = new Set([
  'marketing',
  'product',
  'content',
  'commerce',
  'community',
  'consumer-tool',
  'saas-operations',
  'saas-ai-workspace',
  'saas-analytics',
  'platform',
  'account',
  'workflow',
]);

const SAAS_TYPES = new Set([
  'saas-operations',
  'saas-ai-workspace',
  'saas-analytics',
]);

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const INTERACTIVE_ELEMENTS = new Set([
  'button',
  'input',
  'select',
  'textarea',
]);

const parseAttributes = (source) => {
  const attributes = new Map();
  const pattern =
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attributes.set(name, value);
  }

  return attributes;
};

const findTagEnd = (html, start) => {
  let quote = null;

  for (let index = start; index < html.length; index += 1) {
    const character = html[index];

    if (quote) {
      if (character === quote) {
        quote = null;
      }
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index;
    }
  }

  return html.length - 1;
};

const parseDocument = (html) => {
  const elements = [];
  const styles = [];
  const stack = [];
  let htmlAttributes = null;
  let hasNestedCards = false;
  let index = 0;

  while (index < html.length) {
    const opening = html.indexOf('<', index);
    if (opening === -1) {
      break;
    }

    if (html.startsWith('<!--', opening)) {
      const commentEnd = html.indexOf('-->', opening + 4);
      index = commentEnd === -1 ? html.length : commentEnd + 3;
      continue;
    }

    const tagEnd = findTagEnd(html, opening + 1);
    const tagSource = html.slice(opening + 1, tagEnd).trim();
    index = tagEnd + 1;

    if (!tagSource || tagSource[0] === '!' || tagSource[0] === '?') {
      continue;
    }

    if (tagSource[0] === '/') {
      const closingName = tagSource
        .slice(1)
        .trim()
        .split(/\s+/, 1)[0]
        .toLowerCase();
      const stackIndex = stack.map(({ name }) => name).lastIndexOf(closingName);
      if (stackIndex !== -1) {
        stack.length = stackIndex;
      }
      continue;
    }

    const nameMatch = tagSource.match(/^([^\s/>]+)/);
    if (!nameMatch) {
      continue;
    }

    const name = nameMatch[1].toLowerCase();
    const selfClosing = /\/\s*$/.test(tagSource) || VOID_ELEMENTS.has(name);
    const attributeSource = tagSource
      .slice(nameMatch[0].length)
      .replace(/\/\s*$/, '');
    const attributes = parseAttributes(attributeSource);
    const isCard = attributes.has('data-ui-card');

    if (isCard && stack.some((element) => element.isCard)) {
      hasNestedCards = true;
    }

    const element = { name, attributes, isCard };
    elements.push(element);

    if (name === 'html' && htmlAttributes === null) {
      htmlAttributes = attributes;
    }

    if (name === 'style' || name === 'script') {
      const closingPattern = new RegExp(`<\\/\\s*${name}\\s*>`, 'ig');
      closingPattern.lastIndex = index;
      const closingMatch = closingPattern.exec(html);
      const contentEnd = closingMatch?.index ?? html.length;

      if (name === 'style') {
        styles.push(html.slice(index, contentEnd));
      }

      index = closingMatch ? closingPattern.lastIndex : html.length;
      continue;
    }

    if (!selfClosing) {
      stack.push(element);
    }
  }

  return {
    elements,
    hasNestedCards,
    htmlAttributes: htmlAttributes ?? new Map(),
    styleSource: styles.join('\n'),
  };
};

const findClosingBrace = (source, openingBrace) => {
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
        return index;
      }
    }
  }

  return -1;
};

const CONDITIONAL_AT_RULE =
  /^@(container|document|media|starting-style|supports)\b/i;

const collectCssBlocks = (source, parentIsConditional = false) => {
  const blocks = [];
  let cursor = 0;

  while (cursor < source.length) {
    const openingBrace = source.indexOf('{', cursor);
    if (openingBrace === -1) {
      break;
    }

    const closingBrace = findClosingBrace(source, openingBrace);
    if (closingBrace === -1) {
      break;
    }

    const preludeBoundary = Math.max(
      source.lastIndexOf('}', openingBrace - 1),
      source.lastIndexOf(';', openingBrace - 1),
    );
    const prelude = source.slice(preludeBoundary + 1, openingBrace).trim();
    const body = source.slice(openingBrace + 1, closingBrace);
    blocks.push({ prelude, body, isConditional: parentIsConditional });

    if (prelude.startsWith('@')) {
      blocks.push(
        ...collectCssBlocks(
          body,
          parentIsConditional || CONDITIONAL_AT_RULE.test(prelude),
        ),
      );
    }

    cursor = closingBrace + 1;
  }

  return blocks;
};

const cssDeclarationValues = (body, property) => {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `(?:^|[;{])\\s*${escapedProperty}\\s*:\\s*([^;}]+)`,
    'gi',
  );
  const values = [];
  let match;

  while ((match = pattern.exec(body)) !== null) {
    values.push(match[1].trim());
  }

  return values;
};

const stripCustomPropertyDeclarations = (source) =>
  source.replace(/--[\w-]+\s*:[^;{}]*(?:;|(?=\})|$)/g, '');

const largestPxValue = (source) => {
  const values = [...source.matchAll(/(-?\d*\.?\d+)\s*px\b/gi)].map(
    (match) => Number(match[1]),
  );
  return values.length === 0 ? null : Math.max(...values);
};

const hasUnresolvedLength = (source) =>
  /-?\d*\.?\d+\s*(?:rem|em|vw|vh|vmin|vmax|cqw|cqh)\b|var\s*\(|calc\s*\(/i.test(
    source,
  );

const inlineStyleValue = (style, property) => {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return style.match(
    new RegExp(`(?:^|;)\\s*${escapedProperty}\\s*:\\s*([^;]+)`, 'i'),
  )?.[1]?.trim();
};

const selectorTargetsHeading = (selector) =>
  /(^|[\s>+~,])h1(?=$|[\s>+~,.:[#])/i.test(selector) ||
  /\.display-title\b/i.test(selector) ||
  /\[\s*data-ui-role\s*=\s*["']hero-title["']\s*\]/i.test(selector);

const classListIncludes = (attributes, className) =>
  (attributes.get('class') ?? '').split(/\s+/).includes(className);

const hasHeroEvidence = (elements) =>
  elements.some(
    ({ name, attributes }) =>
      (['img', 'video', 'canvas'].includes(name) &&
        attributes.has('data-ui-hero-media')) ||
      (attributes.get('data-ui-product-state') ?? '').trim().length > 0,
  );

const hasSaasHero = (elements) =>
  elements.some(
    ({ name, attributes }) =>
      (['section', 'header', 'div'].includes(name) &&
        classListIncludes(attributes, 'hero')) ||
      attributes.get('data-ui-role') === 'hero',
  );

const hasInteractiveElement = (elements) =>
  elements.some(
    ({ name, attributes }) =>
      INTERACTIVE_ELEMENTS.has(name) ||
      (name === 'a' && attributes.has('href')),
  );

const rootBlocks = (blocks) =>
  blocks.filter(
    ({ prelude, isConditional }) =>
      !isConditional &&
      prelude
        .split(',')
        .map((selector) => selector.trim())
        .includes(':root'),
  );

const rootDeclarationValues = (blocks, property) =>
  rootBlocks(blocks).flatMap(({ body }) =>
    cssDeclarationValues(body, property),
  );

const rootOrHtmlBlocks = (blocks) =>
  blocks.filter(
    ({ prelude, isConditional }) =>
      !isConditional &&
      prelude
        .split(',')
        .map((selector) => selector.trim().toLowerCase())
        .some((selector) => selector === ':root' || selector === 'html'),
  );

const selectorContainsCard = (selector) =>
  /\[\s*data-ui-card\s*\]/i.test(selector);

const selectorTargetsLiquidRoot = (selector) =>
  /:root\s*\[\s*data-ui-card-material\s*=\s*(?:"liquid-glass"|'liquid-glass'|liquid-glass)\s*\]/i.test(
    selector,
  );

const hasCssDeclaration = (blocks, property) =>
  blocks.some(
    ({ prelude, body }) =>
      !prelude.startsWith('@') &&
      cssDeclarationValues(body, property).length > 0,
  );

const hasMediaFeature = (blocks, feature, value) =>
  blocks.some(
    ({ prelude }) =>
      prelude.startsWith('@media') &&
      new RegExp(`${feature}\\s*:\\s*${value}`, 'i').test(prelude),
  );

const hasLiquidGlassBackdrop = (blocks) =>
  blocks.some(({ prelude, body }) => {
    if (prelude.startsWith('@') || !selectorContainsCard(prelude)) {
      return false;
    }

    return [
      ...cssDeclarationValues(body, 'backdrop-filter'),
      ...cssDeclarationValues(body, '-webkit-backdrop-filter'),
    ].some((value) => !/^none\b/i.test(value));
  });

const hasLiquidGlassFallback = (blocks) =>
  blocks
    .filter(
      ({ prelude }) =>
        prelude.startsWith('@media') &&
        /prefers-reduced-transparency\s*:\s*reduce/i.test(prelude),
    )
    .some(({ body }) => {
      const fallbackBlocks = collectCssBlocks(body);
      const relevantBlocks = fallbackBlocks.filter(
        ({ prelude }) =>
          !prelude.startsWith('@') &&
          (selectorContainsCard(prelude) ||
            selectorTargetsLiquidRoot(prelude)),
      );
      const hasEntityFallback = relevantBlocks.some(
        ({ body: fallbackBody }) =>
          cssDeclarationValues(fallbackBody, 'background').length > 0 ||
          cssDeclarationValues(fallbackBody, '--card-background').length > 0,
      );
      const disablesBackdrop = relevantBlocks.some(
        ({ prelude, body: fallbackBody }) =>
          selectorContainsCard(prelude) &&
          [
            ...cssDeclarationValues(fallbackBody, 'backdrop-filter'),
            ...cssDeclarationValues(fallbackBody, '-webkit-backdrop-filter'),
          ].some((value) => /^none\b/i.test(value)),
      );

      return hasEntityFallback && disablesBackdrop;
    });

const hasDecorativeCircle = (blocks) =>
  blocks.some(({ prelude, body }) => {
    if (prelude.startsWith('@')) {
      return false;
    }

    const width = Math.max(
      ...cssDeclarationValues(body, 'width')
        .map(largestPxValue)
        .filter((value) => value !== null),
      -Infinity,
    );
    const height = Math.max(
      ...cssDeclarationValues(body, 'height')
        .map(largestPxValue)
        .filter((value) => value !== null),
      -Infinity,
    );
    const isRound = cssDeclarationValues(body, 'border-radius').some((value) =>
      /\b50%/.test(value),
    );
    const isNamedCircle = /(?:orb|orbit|sphere|circle)/i.test(prelude);
    const hasGeneratedContent = cssDeclarationValues(body, 'content').length > 0;

    return (
      width >= 96 &&
      height >= 96 &&
      isRound &&
      (isNamedCircle || hasGeneratedContent)
    );
  });

const hasHeroSplit = (blocks) => {
  const heroUsesColumns = blocks.some(
    ({ prelude, body }) =>
      /\.hero\b/i.test(prelude) &&
      cssDeclarationValues(body, 'grid-template-columns').length > 0,
  );
  const hasHeroAside = blocks.some(({ prelude }) =>
    /\.hero-aside\b/i.test(prelude),
  );
  return heroUsesColumns && hasHeroAside;
};

const createIssue = (code, message, severity = 'error') => ({
  code,
  severity,
  message,
});

export const analyzeHtml = (html, options = {}) => {
  const document = parseDocument(String(html));
  const { elements, htmlAttributes, styleSource } = document;
  const blocks = collectCssBlocks(styleSource);
  const issues = [];
  const issueCodes = new Set();
  const addIssue = (code, message, severity = 'error') => {
    if (!issueCodes.has(code)) {
      issueCodes.add(code);
      issues.push(createIssue(code, message, severity));
    }
  };

  const metadataPageType = htmlAttributes.get('data-ui-page-type');
  const hasPageTypeOverride =
    typeof options.pageType === 'string' && options.pageType.length > 0;
  const pageType = hasPageTypeOverride
    ? options.pageType
    : metadataPageType || 'marketing';
  const hero = htmlAttributes.get('data-ui-hero');
  const cardMaterial = htmlAttributes.get('data-ui-card-material');
  const isSaas = SAAS_TYPES.has(pageType);
  const heroEvidence = hasHeroEvidence(elements);
  const cards = elements.filter(({ isCard }) => isCard);
  const hasLinkedStylesheet = elements.some(
    ({ name, attributes }) =>
      name === 'link' &&
      (attributes.get('rel') ?? '')
        .toLowerCase()
        .split(/\s+/)
        .includes('stylesheet'),
  );
  const cssMissingSeverity = hasLinkedStylesheet ? 'warning' : 'error';

  if (!metadataPageType && !hasPageTypeOverride) {
    addIssue(
      'page-type-required',
      'html 元素必须声明 data-ui-page-type。',
    );
  }

  if (!VALID_PAGE_TYPES.has(pageType)) {
    addIssue(
      'page-type-invalid',
      `页面类型 ${pageType} 不在允许的十二种类型中。`,
    );
  }

  if (!hero) {
    addIssue(
      'hero-metadata-required',
      'html 元素必须声明 data-ui-hero。',
    );
  }

  if (hasLinkedStylesheet) {
    addIssue(
      'stylesheet-browser-review-required',
      '页面使用外链样式表；静态校验不解析外部级联，请在浏览器验收中确认视觉规则。',
      'warning',
    );
  }

  const colorSchemeValues = rootOrHtmlBlocks(blocks).flatMap(({ body }) =>
    cssDeclarationValues(body, 'color-scheme'),
  );
  const declaredColorScheme = colorSchemeValues.at(-1)?.trim().toLowerCase();
  const declaresDarkColorScheme =
    declaredColorScheme?.startsWith('dark') ?? false;
  if (!declaresDarkColorScheme) {
    addIssue(
      'dark-theme-required',
      '样式表必须声明 color-scheme: dark。',
      cssMissingSeverity,
    );
  }

  const headingLimit = isSaas ? 24 : 42;
  const headingDeclarations = blocks
    .filter(({ prelude }) => selectorTargetsHeading(prelude))
    .flatMap(({ body }) => cssDeclarationValues(body, 'font-size'));
  const inlineHeadingDeclarations = elements
    .filter(
      ({ name, attributes }) =>
        name === 'h1' ||
        classListIncludes(attributes, 'display-title') ||
        attributes.get('data-ui-role') === 'hero-title',
    )
    .map(({ attributes }) =>
      inlineStyleValue(attributes.get('style') ?? '', 'font-size'),
    )
    .filter(Boolean);
  const allHeadingDeclarations = [
    ...headingDeclarations,
    ...inlineHeadingDeclarations,
  ];
  const headingSizes = allHeadingDeclarations
    .map(largestPxValue)
    .filter((value) => value !== null);
  if (headingSizes.some((value) => value > headingLimit)) {
    addIssue(
      'heading-too-large',
      `页面类型 ${pageType} 的标题字号不得超过 ${headingLimit}px。`,
    );
  }
  if (allHeadingDeclarations.some(hasUnresolvedLength)) {
    addIssue(
      'heading-size-browser-review-required',
      '标题字号包含静态校验无法可靠换算的单位或表达式，请在浏览器验收中确认上限。',
      'warning',
    );
  }

  if (cards.length > 0) {
    if (!cardMaterial) {
      addIssue(
        'card-material-required',
        '包含 data-ui-card 元素的页面必须声明 data-ui-card-material。',
      );
    }

    const radius = Math.max(
      ...rootDeclarationValues(blocks, '--radius-card')
        .map(largestPxValue)
        .filter((value) => value !== null),
      -Infinity,
    );
    if (radius < 36) {
      addIssue(
        'card-radius-too-small',
        '根级 --radius-card 的值不得小于 36px。',
        cssMissingSeverity,
      );
    }

    const cardUsesSquircle = blocks.some(
      ({ prelude, body }) =>
        !prelude.startsWith('@') &&
        selectorContainsCard(prelude) &&
        cssDeclarationValues(body, 'corner-shape').some((value) =>
          /\bsquircle\b/i.test(value),
        ),
    );
    if (!cardUsesSquircle) {
      addIssue(
        'corner-shape-required',
        '实际的 [data-ui-card] 样式规则必须声明 corner-shape: squircle。',
        cssMissingSeverity,
      );
    }
  }

  if (document.hasNestedCards) {
    addIssue('nested-card', 'data-ui-card 不得嵌套另一个卡片。');
  }

  if (
    cardMaterial === 'liquid-glass' &&
    (!hasLiquidGlassBackdrop(blocks) || !hasLiquidGlassFallback(blocks))
  ) {
    addIssue(
      'liquid-glass-fallback-required',
      '液态玻璃卡片必须提供 backdrop-filter 和完整的降低透明度实体回退。',
      cssMissingSeverity,
    );
  }

  if (hasDecorativeCircle(blocks)) {
    addIssue(
      'decorative-circle',
      '不允许使用大型装饰圆形。',
    );
  }

  if (hasHeroSplit(blocks) && !heroEvidence) {
    addIssue(
      'hero-split-decorative',
      '分栏 Hero 必须包含有意义的产品或媒体证据。',
    );
  }

  if (hero === 'approved' && !heroEvidence) {
    addIssue(
      'hero-evidence-required',
      '已批准的 Hero 必须包含产品状态或 Hero 媒体证据。',
    );
  }

  if (isSaas && hasSaasHero(elements)) {
    addIssue(
      'saas-hero-forbidden',
      'SaaS 工作区不得渲染 Hero 容器。',
    );
  }

  const cssWithoutCustomProperties =
    stripCustomPropertyDeclarations(styleSource);
  const hasInlineBrandColor = elements.some(({ attributes }) =>
    /#9a6aba\b/i.test(
      stripCustomPropertyDeclarations(attributes.get('style') ?? ''),
    ),
  );
  if (
    /#9a6aba\b/i.test(cssWithoutCustomProperties) ||
    hasInlineBrandColor
  ) {
    addIssue(
      'brand-color-hardcoded',
      '请使用设计令牌，不要硬编码 #9a6aba。',
    );
  }

  const hasFocusVisibleRule = blocks.some(
    ({ prelude }) =>
      !prelude.startsWith('@') && /:focus-visible\b/i.test(prelude),
  );
  if (hasInteractiveElement(elements) && !hasFocusVisibleRule) {
    addIssue(
      'focus-visible-required',
      '交互元素必须提供 :focus-visible 样式。',
      cssMissingSeverity,
    );
  }

  const motionProperties = [
    'animation',
    'animation-name',
    'animation-duration',
    'animation-delay',
    'animation-direction',
    'animation-fill-mode',
    'animation-iteration-count',
    'animation-play-state',
    'animation-timing-function',
    'animation-timeline',
    'transition',
    'transition-property',
    'transition-duration',
    'transition-delay',
    'transition-timing-function',
    'transition-behavior',
  ];
  const hasMotionDeclaration = motionProperties.some((property) =>
    hasCssDeclaration(blocks, property),
  );
  if (
    hasMotionDeclaration &&
    !hasMediaFeature(blocks, 'prefers-reduced-motion', 'reduce')
  ) {
    addIssue(
      'reduced-motion-required',
      '动画和过渡样式必须提供减少动态效果的回退。',
      cssMissingSeverity,
    );
  }

  return {
    ok: !issues.some(({ severity }) => severity === 'error'),
    pageType,
    issues,
  };
};

const parseArguments = (args) => {
  const options = { json: false };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--json') {
      options.json = true;
      continue;
    }

    if (argument === '--file' || argument === '--page-type') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`参数 ${argument} 缺少值。`);
      }
      const key = argument === '--file' ? 'file' : 'pageType';
      options[key] = value;
      index += 1;
      continue;
    }

    throw new Error(`未知参数：${argument}`);
  }

  if (!options.file) {
    throw new Error('缺少必需的 --file 参数。');
  }

  return options;
};

const main = async () => {
  const options = parseArguments(process.argv.slice(2));
  const filePath = resolve(options.file);
  let html;

  try {
    html = await readFile(filePath, 'utf8');
  } catch {
    throw new Error(
      `无法读取文件：${filePath}。请确认文件路径存在且具有读取权限。`,
    );
  }
  const report = analyzeHtml(html, { pageType: options.pageType });

  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (report.issues.length === 0) {
    process.stdout.write('Yiqi UI Standard 静态校验通过\n');
  } else {
    for (const issue of report.issues) {
      const label = issue.severity === 'warning' ? '警告' : '错误';
      process.stdout.write(`[${label}] ${issue.code}：${issue.message}\n`);
    }
  }

  process.exitCode = report.ok ? 0 : 1;
};

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main().catch((error) => {
    process.stderr.write(`Yiqi UI Standard 校验器错误：${error.message}\n`);
    process.exitCode = 1;
  });
}
