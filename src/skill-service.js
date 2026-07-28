const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const DISABLED_FILE = 'SKILL.disabled.md';
const ACTIVE_FILE = 'SKILL.md';

const MATT_POCOCK_SKILLS = new Set([
  'ask-matt',
  'implement',
  'tdd',
  'diagnosing-bugs',
  'code-review',
  'research',
  'prototype',
  'resolving-merge-conflicts',
  'handoff',
  'grill-with-docs',
  'grilling',
  'to-spec',
  'to-tickets',
  'codebase-design',
  'domain-modeling',
  'improve-codebase-architecture',
  'setup-pre-commit',
  'qa',
  'request-refactor-plan',
  'ubiquitous-language',
  'batch-grill-me',
  'claude-handoff',
  'loop-me',
  'setup-ts-deep-modules',
  'writing-beats',
  'writing-fragments',
  'writing-shape',
  'git-guardrails-claude-code',
  'migrate-to-shoehorn',
  'scaffold-exercises',
  'edit-article',
  'obsidian-vault',
  'grill-me',
  'design-an-interface',
  'setup-matt-pocock-skills',
  'teach',
  'to-questionnaire',
  'triage',
  'wayfinder',
  'wizard',
  'writing-great-skills',
]);

const CHINESE_SKILL_COPY = {
  'imagegen': {
    summary: [
      '生成或编辑位图图片。适合制作照片、插画、贴图、精灵图、样机图、透明背景素材，以及基于参考图生成视觉变体。',
      '如果任务更适合用 SVG、HTML/CSS、Canvas 或现有图标体系直接实现，则不建议使用这个 skill。',
    ],
    usage: '说“生成一张图片 / 修改这张图 / 做几个视觉变体”时触发。',
  },
  'openai-docs': {
    summary: [
      '查询 OpenAI 和 Codex 官方文档。适合询问 API、模型选择、Codex 用法、最新官方能力或迁移建议。',
      '需要权威、当前、可引用的 OpenAI 官方信息时使用。',
    ],
    usage: '询问 OpenAI、API、模型、Codex 官方用法时自动触发。',
  },
  'plugin-creator': {
    summary: [
      '创建或更新 Codex 插件结构。适合生成个人插件、插件清单、插件 marketplace 配置和配套目录。',
      '当你要把一组 skills、工具或应用能力做成 Codex 插件时使用。',
    ],
    usage: '说“创建一个 Codex 插件 / 做成本地插件 / 更新插件配置”时触发。',
  },
  'review-agent': {
    summary: [
      '只读代码审查代理。适合检查某个提交、分支或未提交改动中的真实缺陷。',
      '它重点找可执行、可定位的问题，不负责改代码。',
    ],
    usage: '当主任务委托“审查这批代码改动”时使用。',
  },
  'skill-creator': {
    summary: [
      '创建或改进 Codex skill。适合把稳定流程、专业知识或工具操作沉淀成可复用 skill。',
      '当你想新增一个 skill、重写 SKILL.md 或整理触发规则时使用。',
    ],
    usage: '说“帮我创建/修改一个 skill”时触发。',
  },
  'skill-installer': {
    summary: [
      '安装 Codex skills。适合从官方列表或 GitHub 仓库路径安装 skill 到本机 Codex。',
      '当你要列出可安装 skill、安装新 skill 或检查安装结果时使用。',
    ],
    usage: '说“安装这个 skill / 从 GitHub 装 skill / 列出可安装 skill”时触发。',
  },
  'ask-matt': {
    summary: [
      '向 Matt Pocock 风格的代码助手提问。适合围绕 TypeScript、工程设计、编码实践获得直接建议。',
      '更偏问答和判断，不一定会直接修改项目代码。',
    ],
    usage: '说“用 ask-matt 问一下……”或提出 TypeScript/工程实践问题。',
  },
  'implement': {
    summary: [
      '按需求实现功能或修复问题。适合已经有明确规格、票据或任务描述时进入编码执行。',
      '通常会结合测试、类型检查和最终代码审查完成一段开发工作。',
    ],
    usage: '说“用 implement 按这个需求开发……”或“实现这个功能……”。',
  },
  'tdd': {
    summary: [
      '测试驱动开发。适合先写失败测试，再写最小实现，最后重构的开发流程。',
      '当你强调 red-green-refactor、先测试后实现，或希望用集成测试保护功能时使用。',
    ],
    usage: '说“用 tdd 帮我……”或提到“测试驱动 / red-green-refactor”。',
  },
  'diagnosing-bugs': {
    summary: [
      '系统化排查 bug、报错和性能退化。适合先复现、定位根因，再制定修复方案。',
      '当问题复杂、原因不明或不能直接靠猜修复时使用。',
    ],
    usage: '说“用 diagnosing-bugs 排查这个报错/bug/性能问题”。',
  },
  'code-review': {
    summary: [
      '代码审查。适合检查当前分支、PR 或工作区改动是否符合规范，以及是否满足需求。',
      '它会从代码标准和需求符合度两个角度审查，不把不同类型问题混在一起。',
    ],
    usage: '说“用 code-review 审查当前改动”或“review since main”。',
  },
  'research': {
    summary: [
      '基于高可信来源调研技术问题，并把发现记录成 Markdown。适合做方案选择、文档核查或技术背景调查。',
      '需要可靠来源、可追溯结论，而不是凭记忆回答时使用。',
    ],
    usage: '说“用 research 调研……”或“查清楚这个技术方案”。',
  },
  'prototype': {
    summary: [
      '快速制作一次性原型，用来验证设计想法、状态模型或交互逻辑是否可行。',
      '适合先试错、看效果，不适合一开始就做成长期维护代码。',
    ],
    usage: '说“用 prototype 做个原型验证……”或“先快速试一下”。',
  },
  'resolving-merge-conflicts': {
    summary: [
      '解决 Git merge 或 rebase 过程中的冲突。适合在仓库已经出现冲突标记时使用。',
      '它关注保留双方意图，并验证冲突解决后的项目状态。',
    ],
    usage: '说“用 resolving-merge-conflicts 解决当前冲突”。',
  },
  'handoff': {
    summary: [
      '生成任务交接总结。适合在上下文较长、要换任务、换人或暂停工作时保留连续性。',
      '会整理目标、约束、已完成内容、剩余任务、关键路径和下一步。',
    ],
    usage: '说“用 handoff 总结当前任务 / 生成交接”。',
  },
  'grill-with-docs': {
    summary: [
      '带着文档追问和拷打方案。适合用现有文档检验计划、需求或技术判断是否站得住。',
      '当你希望 Codex 不轻易附和，而是基于资料不断追问时使用。',
    ],
    usage: '说“用 grill-with-docs 拷打这个方案，并参考这些文档”。',
  },
  'grilling': {
    summary: [
      '强力追问和压力测试想法。适合检查计划、决策、需求和设计有没有漏洞。',
      '它更像反方提问，不是直接执行任务。',
    ],
    usage: '说“用 grilling 拷打这个想法/计划”。',
  },
  'to-spec': {
    summary: [
      '把想法、对话或粗略计划整理成规格说明。适合从模糊需求变成可执行 spec。',
      '当你需要明确目标、范围、验收标准和约束时使用。',
    ],
    usage: '说“用 to-spec 把这段需求整理成规格说明”。',
  },
  'to-tickets': {
    summary: [
      '把计划或规格拆成可执行票据。适合把大任务拆成有依赖关系的小任务。',
      '每个票据会尽量成为可验证、可交付的 tracer bullet。',
    ],
    usage: '说“用 to-tickets 拆成任务/票据”。',
  },
  'codebase-design': {
    summary: [
      '代码库设计和模块接口设计。适合寻找深模块机会、调整接口边界和降低复杂度。',
      '当你想改善模块结构，而不是只修表面代码时使用。',
    ],
    usage: '说“用 codebase-design 设计这个模块/接口”。',
  },
  'domain-modeling': {
    summary: [
      '梳理项目领域模型。适合统一业务术语、核心实体、规则和架构决策。',
      '当需求复杂、名词混乱或需要沉淀领域语言时使用。',
    ],
    usage: '说“用 domain-modeling 梳理领域模型/术语”。',
  },
  'improve-codebase-architecture': {
    summary: [
      '改善代码库架构。适合识别结构性问题、模块边界问题和长期维护风险。',
      '当你想系统性优化架构，而不是做一次小修补时使用。',
    ],
    usage: '说“用 improve-codebase-architecture 分析并改善架构”。',
  },
  'setup-pre-commit': {
    summary: [
      '配置 Husky、lint-staged、Prettier、类型检查和测试等提交前检查。',
      '适合为项目增加基础质量门禁，避免低级问题进入提交。',
    ],
    usage: '说“用 setup-pre-commit 给项目加提交前检查”。',
  },
  'codeximage-to-editable-ppt-v1': {
    summary: [
      '把图片型 PPT 或幻灯片截图重建为可编辑 PowerPoint。适合需要把不可编辑页面变成可改对象的场景。',
      '它更关注还原版式、文本和基础图形，让后续可以继续编辑。',
    ],
    usage: '提供幻灯片图片后说“转成可编辑 PPT”。',
  },
  'image-to-editable-ppt': {
    summary: [
      '把图片、扫描版 PPT/PDF 课件重建成对象级可编辑 PPTX。',
      '适合把不可编辑的幻灯片资料转成可以二次修改的演示文件。',
    ],
    usage: '提供图片/PDF/PPT 后说“用 image-to-editable-ppt 重建”。',
  },
  'design-an-interface': {
    summary: [
      '为模块生成多个差异明显的接口设计方案。适合探索 API、模块边界或组件接口。',
      '通常用于设计阶段，帮助比较不同抽象方式的取舍。',
    ],
    usage: '说“用 design-an-interface 设计这个模块接口”。',
  },
  'frontend': {
    summary: [
      '前端实现指导。适合微信小程序、页面、组件、样式、布局、交互和移动端响应式工作。',
      '当任务涉及用户界面、表单、列表、弹窗或视觉层级时使用。',
    ],
    usage: '说“用 frontend 做这个页面/组件/UI 调整”。',
  },
  'portrait-identity-photos': {
    summary: [
      '根据人物参考图生成保持身份一致的人像照片提示和变体。',
      '适合证件照、头像、人像风格变体等需要保留人物特征的图片任务。',
    ],
    usage: '提供人物照片后说“生成身份一致的人像/证件照”。',
  },
  'setup-matt-pocock-skills': {
    summary: [
      '配置 Matt Pocock skills 需要的项目文档和工作流。适合首次引入这一套 skills 后做项目级准备。',
      '通常用于补齐 issue tracker、协作约定等基础文件。',
    ],
    usage: '说“用 setup-matt-pocock-skills 初始化配置”。',
  },
  'teach': {
    summary: [
      '把某个概念、代码或技术点讲清楚。适合学习、解释和教学型任务。',
      '它侧重循序渐进说明，而不是直接替你完成开发。',
    ],
    usage: '说“用 teach 给我讲……”或“教我理解这段代码”。',
  },
  'to-questionnaire': {
    summary: [
      '把需求或计划转成问卷/问题清单。适合收集信息、澄清需求或准备访谈。',
      '当你需要先问对问题，再继续设计或执行时使用。',
    ],
    usage: '说“用 to-questionnaire 整理成问题清单”。',
  },
  'triage': {
    summary: [
      '对 issue 或外部 PR 进行分诊。适合分类、验证、追问并生成可交给代理执行的任务简报。',
      '当待处理事项很多，需要先判断优先级和状态时使用。',
    ],
    usage: '说“用 triage 分诊这些 issue/PR”。',
  },
  'ui-ux-pro-max': {
    summary: [
      'UI/UX 设计增强。适合界面设计、交互优化、视觉层级、组件体验和可用性建议。',
      '当你希望页面更好看、更易用、更专业时使用。',
    ],
    usage: '说“用 ui-ux-pro-max 优化这个界面/交互”。',
  },
  'video-note-maker': {
    summary: [
      '从视频文件或链接提取字幕、重点笔记、截图和 Markdown 学习资料。',
      '适合课程视频、会议记录、教程视频和需要自动整理内容的场景。',
    ],
    usage: '提供视频后说“用 video-note-maker 生成笔记/字幕/截图”。',
  },
  'wayfinder': {
    summary: [
      '把超大工作拆成长期路线图和决策票据。适合单次上下文装不下的大项目规划。',
      '它帮助逐步解决阻塞点，直到通往目标的路径清晰。',
    ],
    usage: '说“用 wayfinder 规划这个大型项目/长期任务”。',
  },
  'wizard': {
    summary: [
      '生成交互式命令行向导，带人一步步完成手动流程。适合第三方配置、迁移、初始化或收集密钥。',
      '当流程需要打开网址、确认步骤、写入 .env 或 GitHub secrets 时使用。',
    ],
    usage: '说“用 wizard 做一个安装/配置向导”。',
  },
  'writing-great-skills': {
    summary: [
      '编写高质量 skills 的参考。适合审查或改进 SKILL.md，让 skill 更可预测、更好触发。',
      '当你想提升 skill 质量、描述和规则设计时使用。',
    ],
    usage: '说“用 writing-great-skills 改进这个 skill”。',
  },
};

function getDefaultSkillsRoot() {
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  return path.join(codexHome, 'skills');
}

function readTextIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return '';
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return '';
  }
}

function parseFrontMatter(text) {
  const result = {};
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return result;

  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    result[key] = value;
  }

  return result;
}

function stripFrontMatter(text) {
  return text.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*/, '').trim();
}

function firstHeading(text) {
  const match = text.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function splitParagraphs(value) {
  return String(value || '')
    .split(/\r?\n\s*\r?\n|\n(?=\S)/)
    .map((item) => normalizeText(item.replace(/^#+\s*/g, '')))
    .filter(Boolean);
}

function limitText(value, maxLength = 180) {
  const text = normalizeText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function buildFallbackSummary({ metadata, text, name }) {
  const raw = metadata.description || firstHeading(text) || name;
  if (/[^\x00-\x7F]/.test(raw)) return splitParagraphs(raw).slice(0, 2).map((item) => limitText(item, 160));

  return [
    `${name}：用于处理与“${limitText(raw, 70)}”相关的任务。`,
    '这个 skill 暂无内置中文说明，可在展开详情中查看原始说明。',
  ];
}

function buildDetailText({ metadata, text }) {
  const body = stripFrontMatter(text);
  const paragraphs = splitParagraphs(body).slice(0, 8);
  const originalDescription = normalizeText(metadata.description || '');
  const detailParts = [];

  if (originalDescription) detailParts.push(`原始 description：${originalDescription}`);
  if (paragraphs.length) detailParts.push(paragraphs.join('\n\n'));

  const detail = detailParts.join('\n\n').trim();
  return detail || '暂无更多详细说明。';
}

function buildUsageHint(name) {
  if (CHINESE_SKILL_COPY[name]?.usage) return CHINESE_SKILL_COPY[name].usage;
  return `直接说“用 ${name} 帮我……”，或描述和该 skill 相关的任务关键词。`;
}

function detectGithub({ metadata, text, name }) {
  const candidates = [
    metadata.repository,
    metadata.homepage,
    metadata.github,
    metadata.source,
  ].filter(Boolean);

  const inlineGithub = text.match(/https:\/\/github\.com\/[^\s)\]"']+/i);
  if (inlineGithub) candidates.push(inlineGithub[0]);

  if (MATT_POCOCK_SKILLS.has(name)) return 'https://github.com/mattpocock/skills';
  return candidates.find((item) => /github\.com/i.test(item)) || '未知';
}

function normalizeSkillOptions(options = {}) {
  return {
    skillsRoot: options.skillsRoot || getDefaultSkillsRoot(),
    activeFileName: options.activeFileName || ACTIVE_FILE,
    disabledFileName: options.disabledFileName || DISABLED_FILE,
    systemFolderName: options.systemFolderName || '.system',
    enableMethod: options.enableMethod || 'rename',
    agentName: options.name || options.agentName || 'Agent',
  };
}

function findSkillDirectories(root, options = {}) {
  const { activeFileName, disabledFileName } = normalizeSkillOptions(options);
  const found = [];
  if (!fs.existsSync(root)) return found;

  const stack = [{ dir: root, depth: 0 }];
  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current.dir, { withFileTypes: true });
    } catch (error) {
      continue;
    }

    const hasActive = entries.some((entry) => entry.isFile() && entry.name === activeFileName);
    const hasDisabled = entries.some((entry) => entry.isFile() && entry.name === disabledFileName);
    if (hasActive || hasDisabled) {
      found.push(current.dir);
      continue;
    }

    if (current.depth >= 2) continue;
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      stack.push({ dir: path.join(current.dir, entry.name), depth: current.depth + 1 });
    }
  }

  return found.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
}

function readSkill(skillDir, root, options = {}) {
  const { activeFileName, disabledFileName, systemFolderName, enableMethod, agentName } = normalizeSkillOptions(options);
  const activePath = path.join(skillDir, activeFileName);
  const disabledPath = path.join(skillDir, disabledFileName);
  const enabled = fs.existsSync(activePath);
  const skillFile = enabled ? activePath : disabledPath;
  const text = readTextIfExists(skillFile);
  const metadata = parseFrontMatter(text);
  const fallbackName = path.basename(skillDir);
  const name = metadata.name || fallbackName;
  const relativePath = path.relative(root, skillDir) || fallbackName;
  const isSystem = relativePath.split(path.sep).includes(systemFolderName);
  const version = metadata.version ? `V${String(metadata.version).replace(/^v/i, '')}` : 'V1.0';
  const chineseCopy = CHINESE_SKILL_COPY[name];
  const summaryParagraphs = (chineseCopy?.summary || buildFallbackSummary({ metadata, text, name })).slice(0, 2);
  const category = isSystem ? '系统内置' : '用户安装';

  return {
    id: Buffer.from(skillDir, 'utf8').toString('base64url'),
    name,
    version,
    description: summaryParagraphs.join('\n'),
    summaryParagraphs,
    usage: buildUsageHint(name),
    detailText: buildDetailText({ metadata, text }),
    rawDescription: normalizeText(metadata.description || firstHeading(text)),
    github: detectGithub({ metadata, text, name }),
    enabled,
    toggleable: !isSystem && enableMethod === 'rename',
    category,
    scope: category,
    path: skillDir,
    skillFile,
    relativePath,
    note: isSystem ? '系统内置 skill 默认保护，不建议关闭。' : (enableMethod === 'rename' ? '切换后建议新开 ' + agentName + ' 任务或重启对应 Agent 生效。' : '当前 Agent 配对暂不支持自动开关。'),
  };
}

function scanSkills(skillsRootOrOptions = getDefaultSkillsRoot()) {
  const options = typeof skillsRootOrOptions === 'object'
    ? normalizeSkillOptions(skillsRootOrOptions)
    : normalizeSkillOptions({ skillsRoot: skillsRootOrOptions });
  const root = path.resolve(options.skillsRoot);
  const skillDirs = findSkillDirectories(root, options);
  const skills = skillDirs.map((dir) => readSkill(dir, root, options));
  const enabledCount = skills.filter((skill) => skill.enabled).length;
  return {
    root,
    agentName: options.agentName,
    total: skills.length,
    enabledCount,
    disabledCount: skills.length - enabledCount,
    skills,
    scannedAt: new Date().toISOString(),
  };
}

function assertInsideRoot(targetPath, root) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`拒绝操作 skills 根目录之外的路径：${resolvedTarget}`);
  }
}

function setSkillEnabled(payload) {
  const options = normalizeSkillOptions(payload || {});
  if (options.enableMethod !== 'rename') {
    throw new Error('当前 Agent 配对暂不支持自动开关。基础版仅支持通过重命名 SKILL.md 的方式开启/关闭。');
  }
  const { skillPath, enabled } = payload;
  const root = path.resolve(options.skillsRoot);
  const dir = path.resolve(skillPath);
  assertInsideRoot(dir, root);

  const relativePath = path.relative(root, dir);
  const isSystem = relativePath.split(path.sep).includes(options.systemFolderName);
  if (isSystem) {
    throw new Error('系统内置 skill 已被保护，MVP 不允许关闭。');
  }

  const activePath = path.join(dir, options.activeFileName);
  const disabledPath = path.join(dir, options.disabledFileName);

  if (enabled) {
    if (fs.existsSync(activePath)) return readSkill(dir, root, options);
    if (!fs.existsSync(disabledPath)) throw new Error('找不到可恢复的关闭文件。');
    fs.renameSync(disabledPath, activePath);
    return readSkill(dir, root, options);
  }

  if (!fs.existsSync(activePath)) return readSkill(dir, root, options);
  if (fs.existsSync(disabledPath)) {
    throw new Error('已存在关闭文件，为避免覆盖，已停止操作。');
  }
  fs.renameSync(activePath, disabledPath);
  return readSkill(dir, root, options);
}

module.exports = {
  ACTIVE_FILE,
  DISABLED_FILE,
  getDefaultSkillsRoot,
  scanSkills,
  normalizeSkillOptions,
  setSkillEnabled,
};


