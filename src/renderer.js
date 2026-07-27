let state = {
  root: '',
  skills: [],
  search: '',
  status: 'all',
  expanded: new Set(),
  profilesConfig: { activeProfileId: '', profiles: [] },
};

const elements = {
  minimizeBtn: document.querySelector('#minimizeBtn'),
  maximizeBtn: document.querySelector('#maximizeBtn'),
  closeBtn: document.querySelector('#closeBtn'),
  refreshBtn: document.querySelector('#refreshBtn'),
  openRootBtn: document.querySelector('#openRootBtn'),
  searchInput: document.querySelector('#searchInput'),
  statusFilter: document.querySelector('#statusFilter'),
  rootPath: document.querySelector('#rootPath'),
  activeAgentName: document.querySelector('#activeAgentName'),
  agentModeNote: document.querySelector('#agentModeNote'),
  totalCount: document.querySelector('#totalCount'),
  enabledCount: document.querySelector('#enabledCount'),
  disabledCount: document.querySelector('#disabledCount'),
  body: document.querySelector('#skillTableBody'),
  toast: document.querySelector('#toast'),
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatMultiline(value) {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

function showToast(message, type = 'info') {
  elements.toast.textContent = message;
  elements.toast.className = `toast show ${type === 'error' ? 'error' : ''}`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.className = 'toast';
  }, 3600);
}

function setLoading(isLoading) {
  elements.refreshBtn.disabled = isLoading;
  elements.refreshBtn.textContent = isLoading ? '扫描中...' : '刷新列表';
}

function getActiveProfile() {
  return state.profilesConfig.profiles.find((profile) => profile.id === state.profilesConfig.activeProfileId)
    || state.profilesConfig.profiles[0]
    || null;
}

function updateStats(scan) {
  const activeProfile = getActiveProfile();
  elements.rootPath.textContent = scan.root || '-';
  elements.rootPath.title = scan.root || '';
  elements.activeAgentName.textContent = activeProfile?.name || scan.agentName || 'Agent';
  elements.agentModeNote.textContent = activeProfile?.enableMethod === 'rename'
    ? '重命名开关'
    : '仅展示';
  elements.totalCount.textContent = scan.total ?? 0;
  elements.enabledCount.textContent = scan.enabledCount ?? 0;
  elements.disabledCount.textContent = scan.disabledCount ?? 0;
}

async function loadProfiles() {
  state.profilesConfig = await window.skillManager.loadProfiles();
  const activeProfile = getActiveProfile();
  elements.activeAgentName.textContent = activeProfile?.name || 'Agent';
  elements.agentModeNote.textContent = activeProfile?.enableMethod === 'rename' ? '重命名开关' : '仅展示';
}

function getFilteredSkills() {
  const query = state.search.trim().toLowerCase();
  return state.skills.filter((skill) => {
    const matchesQuery = !query || [
      skill.name,
      skill.version,
      skill.description,
      skill.summaryParagraphs?.join(' '),
      skill.usage,
      skill.detailText,
      skill.rawDescription,
      skill.github,
      skill.category,
      skill.scope,
      skill.path,
      skill.relativePath,
    ].some((value) => String(value ?? '').toLowerCase().includes(query));

    if (!matchesQuery) return false;
    if (state.status === 'enabled') return skill.enabled;
    if (state.status === 'disabled') return !skill.enabled;
    if (state.status === 'user') return skill.category === '用户安装';
    if (state.status === 'system') return skill.category === '系统内置';
    return true;
  });
}

function repoCell(skill) {
  if (!skill.github || skill.github === '未知') {
    return '<span class="repo-unknown">未知</span>';
  }
  const href = escapeHtml(skill.github);
  const label = skill.github.replace(/^https:\/\//, '');
  return `<a class="repo-link" href="${href}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}

function summaryCell(skill) {
  const paragraphs = Array.isArray(skill.summaryParagraphs) && skill.summaryParagraphs.length
    ? skill.summaryParagraphs.slice(0, 2)
    : String(skill.description || '暂无说明。').split(/\n+/).slice(0, 2);

  return `<div class="description compact-lines">${paragraphs.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}</div>`;
}

function detailRow(skill) {
  const statusText = skill.enabled ? '开启' : '关闭';
  return `
    <tr class="details-row" data-detail-for="${escapeHtml(skill.id)}">
      <td colspan="6">
        <div class="details-panel">
          <div class="details-grid">
            <section>
              <span class="detail-label">版本</span>
              <strong>${escapeHtml(skill.version)}</strong>
            </section>
            <section>
              <span class="detail-label">状态</span>
              <strong>${escapeHtml(statusText)}</strong>
            </section>
            <section>
              <span class="detail-label">分类</span>
              <strong>${escapeHtml(skill.category)}</strong>
            </section>
            <section>
              <span class="detail-label">GitHub</span>
              <div>${repoCell(skill)}</div>
            </section>
          </div>
          <div class="detail-block">
            <span class="detail-label">本地路径</span>
            <code>${escapeHtml(skill.path)}</code>
          </div>
          <div class="detail-block">
            <span class="detail-label">使用方式</span>
            <p>${escapeHtml(skill.usage)}</p>
          </div>
          <div class="detail-block">
            <span class="detail-label">完整/原始说明</span>
            <div class="detail-text">${formatMultiline(skill.detailText || skill.rawDescription || '暂无更多详细说明。')}</div>
          </div>
          <div class="detail-tip">${escapeHtml(skill.note)}</div>
        </div>
      </td>
    </tr>`;
}

function skillRow(skill) {
  const checked = skill.enabled ? 'checked' : '';
  const disabled = skill.toggleable ? '' : 'disabled';
  const categoryClass = skill.category === '系统内置' ? 'system' : 'user';
  const expanded = state.expanded.has(skill.id);

  return `
    <tr class="skill-row" data-skill-id="${escapeHtml(skill.id)}" data-skill-path="${escapeHtml(skill.path)}">
      <td class="switch-col">
        <label class="switch" title="${escapeHtml(skill.note)}">
          <input type="checkbox" class="skill-toggle" ${checked} ${disabled} data-skill-path="${escapeHtml(skill.path)}" aria-label="切换 ${escapeHtml(skill.name)}" />
          <span class="slider"></span>
        </label>
      </td>
      <td>
        <div class="skill-name">
          <strong>${escapeHtml(skill.name)}</strong>
          <span class="path-text" title="${escapeHtml(skill.path)}">${escapeHtml(skill.relativePath)}</span>
        </div>
      </td>
      <td><span class="badge ${categoryClass}">${escapeHtml(skill.category)}</span></td>
      <td>${summaryCell(skill)}</td>
      <td><div class="usage-text">${escapeHtml(skill.usage)}</div></td>
      <td class="detail-col">
        <button class="detail-toggle" data-skill-id="${escapeHtml(skill.id)}">${expanded ? '收起' : '展开'}</button>
      </td>
    </tr>
    ${expanded ? detailRow(skill) : ''}`;
}

function renderTable() {
  const skills = getFilteredSkills();
  if (skills.length === 0) {
    elements.body.innerHTML = '<tr><td colspan="6" class="empty">没有找到匹配的 skill。</td></tr>';
    return;
  }

  elements.body.innerHTML = skills.map(skillRow).join('');
}

async function loadSkills() {
  setLoading(true);
  try {
    const scan = await window.skillManager.scanSkills();
    state.root = scan.root;
    state.skills = scan.skills || [];
    const validIds = new Set(state.skills.map((skill) => skill.id));
    state.expanded = new Set([...state.expanded].filter((id) => validIds.has(id)));
    updateStats(scan);
    renderTable();
    showToast(`扫描完成：共 ${scan.total} 个 skill，开启 ${scan.enabledCount} 个。`);
  } catch (error) {
    elements.body.innerHTML = `<tr><td colspan="6" class="empty">扫描失败：${escapeHtml(error.message || error)}</td></tr>`;
    showToast(`扫描失败：${error.message || error}`, 'error');
  } finally {
    setLoading(false);
  }
}

async function toggleSkill(input) {
  const skillPath = input.dataset.skillPath;
  const enabled = input.checked;
  input.disabled = true;

  try {
    await window.skillManager.setSkillEnabled({
      skillPath,
      enabled,
      skillsRoot: state.root,
    });
    await loadSkills();
    const activeProfile = getActiveProfile();
    showToast(`${enabled ? '已开启' : '已关闭'}。请新开 ${activeProfile?.name || '对应 Agent'} 任务或重启对应 Agent 生效。`);
  } catch (error) {
    input.checked = !enabled;
    showToast(error.message || String(error), 'error');
  } finally {
    input.disabled = false;
  }
}

function toggleDetails(skillId) {
  if (state.expanded.has(skillId)) {
    state.expanded.delete(skillId);
  } else {
    state.expanded.add(skillId);
  }
  renderTable();
}

elements.minimizeBtn.addEventListener('click', () => window.skillManager.minimizeWindow());
elements.maximizeBtn.addEventListener('click', async () => {
  const isMaximized = await window.skillManager.toggleMaximizeWindow();
  elements.maximizeBtn.textContent = isMaximized ? '▢' : '□';
});
elements.closeBtn.addEventListener('click', () => window.skillManager.closeWindow());

elements.refreshBtn.addEventListener('click', loadSkills);
elements.openRootBtn.addEventListener('click', async () => {
  try {
    const result = await window.skillManager.openRoot(state.root);
    if (result) showToast(result, 'error');
  } catch (error) {
    showToast(error.message || String(error), 'error');
  }
});

elements.searchInput.addEventListener('input', (event) => {
  state.search = event.target.value;
  renderTable();
});

elements.statusFilter.addEventListener('change', (event) => {
  state.status = event.target.value;
  renderTable();
});

elements.body.addEventListener('change', (event) => {
  if (event.target.classList.contains('skill-toggle')) {
    toggleSkill(event.target);
  }
});

elements.body.addEventListener('click', (event) => {
  if (event.target.classList.contains('detail-toggle')) {
    toggleDetails(event.target.dataset.skillId);
  }
});

async function boot() {
  try {
    await loadProfiles();
    await loadSkills();
  } catch (error) {
    showToast(error.message || String(error), 'error');
  }
}

boot();
