const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('node:path');
const { scanSkills, setSkillEnabled } = require('./skill-service');
const {
  loadAgentProfiles,
  saveAgentProfiles,
  setActiveProfile,
  getActiveProfile,
} = require('./agent-profiles');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 760,
    minWidth: 720,
    minHeight: 620,
    title: 'skill管理器',
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

function activeProfileOptions() {
  const profile = getActiveProfile();
  return {
    ...profile,
    agentName: profile.name,
  };
}

function getWindowFromEvent(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  ipcMain.handle('profiles:load', async () => loadAgentProfiles());
  ipcMain.handle('profiles:save', async (_event, config) => saveAgentProfiles(config));
  ipcMain.handle('profiles:set-active', async (_event, profileId) => setActiveProfile(profileId));

  ipcMain.handle('window:minimize', async (event) => {
    getWindowFromEvent(event)?.minimize();
  });

  ipcMain.handle('window:toggle-maximize', async (event) => {
    const window = getWindowFromEvent(event);
    if (!window) return false;
    if (window.isMaximized()) {
      window.unmaximize();
      return false;
    }
    window.maximize();
    return true;
  });

  ipcMain.handle('window:close', async (event) => {
    getWindowFromEvent(event)?.close();
  });

  ipcMain.handle('skills:scan', async (_event, customRoot) => {
    if (customRoot) return scanSkills(customRoot);
    return scanSkills(activeProfileOptions());
  });

  ipcMain.handle('skills:set-enabled', async (_event, payload) => {
    const profile = activeProfileOptions();
    return setSkillEnabled({
      ...profile,
      ...(payload || {}),
      skillsRoot: payload?.skillsRoot || profile.skillsRoot,
    });
  });

  ipcMain.handle('skills:open-root', async (_event, root) => {
    const profile = activeProfileOptions();
    return shell.openPath(root || profile.skillsRoot);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
