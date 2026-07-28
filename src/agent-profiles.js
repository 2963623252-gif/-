const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const CONFIG_DIR = path.join(__dirname, '..', 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'agent-profiles.json');

function getDefaultCodexSkillsRoot() {
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  return path.join(codexHome, 'skills');
}

function defaultConfig() {
  return {
    activeProfileId: 'codex',
    profiles: [
      {
        id: 'codex',
        name: 'Codex',
        skillsRoot: getDefaultCodexSkillsRoot(),
        activeFileName: 'SKILL.md',
        disabledFileName: 'SKILL.disabled.md',
        systemFolderName: '.system',
        enableMethod: 'rename',
      },
    ],
  };
}

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function normalizeProfile(profile, index = 0) {
  const defaults = defaultConfig().profiles[0];
  const name = String(profile?.name || (index === 0 ? defaults.name : `Agent ${index + 1}`)).trim();
  const id = String(profile?.id || name || `agent-${index + 1}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `agent-${index + 1}`;

  return {
    id,
    name,
    skillsRoot: String(profile?.skillsRoot || defaults.skillsRoot).trim(),
    activeFileName: String(profile?.activeFileName || defaults.activeFileName).trim(),
    disabledFileName: String(profile?.disabledFileName || defaults.disabledFileName).trim(),
    systemFolderName: String(profile?.systemFolderName || defaults.systemFolderName).trim(),
    enableMethod: String(profile?.enableMethod || defaults.enableMethod).trim(),
  };
}

function normalizeConfig(config) {
  const fallback = defaultConfig();
  const rawProfiles = Array.isArray(config?.profiles) && config.profiles.length ? config.profiles : fallback.profiles;
  const seen = new Set();
  const profiles = rawProfiles.map((profile, index) => {
    const normalized = normalizeProfile(profile, index);
    let id = normalized.id;
    let suffix = 2;
    while (seen.has(id)) {
      id = `${normalized.id}-${suffix}`;
      suffix += 1;
    }
    seen.add(id);
    return { ...normalized, id };
  });

  const requestedActive = String(config?.activeProfileId || '').trim();
  const activeProfileId = profiles.some((profile) => profile.id === requestedActive)
    ? requestedActive
    : profiles[0].id;

  return { activeProfileId, profiles };
}

function writeConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, `${JSON.stringify(normalizeConfig(config), null, 2)}\n`, 'utf8');
}

function loadAgentProfiles() {
  if (!fs.existsSync(CONFIG_FILE)) {
    const config = defaultConfig();
    writeConfig(config);
    return normalizeConfig(config);
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    const config = normalizeConfig(parsed);
    writeConfig(config);
    return config;
  } catch (error) {
    const config = defaultConfig();
    writeConfig(config);
    return config;
  }
}

function saveAgentProfiles(config) {
  const normalized = normalizeConfig(config);
  writeConfig(normalized);
  return normalized;
}

function setActiveProfile(profileId) {
  const config = loadAgentProfiles();
  if (!config.profiles.some((profile) => profile.id === profileId)) {
    throw new Error(`找不到 Agent 配对：${profileId}`);
  }
  return saveAgentProfiles({ ...config, activeProfileId: profileId });
}

function getActiveProfile() {
  const config = loadAgentProfiles();
  return config.profiles.find((profile) => profile.id === config.activeProfileId) || config.profiles[0];
}

module.exports = {
  CONFIG_FILE,
  getDefaultCodexSkillsRoot,
  loadAgentProfiles,
  saveAgentProfiles,
  setActiveProfile,
  getActiveProfile,
};
