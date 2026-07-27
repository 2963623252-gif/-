const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('skillManager', {
  loadProfiles: () => ipcRenderer.invoke('profiles:load'),
  saveProfiles: (config) => ipcRenderer.invoke('profiles:save', config),
  setActiveProfile: (profileId) => ipcRenderer.invoke('profiles:set-active', profileId),
  scanSkills: (customRoot) => ipcRenderer.invoke('skills:scan', customRoot),
  setSkillEnabled: (payload) => ipcRenderer.invoke('skills:set-enabled', payload),
  openRoot: (root) => ipcRenderer.invoke('skills:open-root', root),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggle-maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
});
