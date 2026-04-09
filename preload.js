const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runCommand: (cmd) => ipcRenderer.invoke("run-command", cmd),
  navigate: (page) => ipcRenderer.invoke("navigate", page),
  checkDefender: () => ipcRenderer.invoke("check-defender"),
  disableDefender: () => ipcRenderer.invoke("disable-defender"),
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  checkOfficeApps: () => ipcRenderer.invoke("check-office-apps"),
  activateOfficeApp: (app, version) =>
    ipcRenderer.invoke("activate-office-app", app, version),
  getAppsList: () => ipcRenderer.invoke("get-apps-list"),
  installApp: (appId) => ipcRenderer.invoke("install-app", appId),
  cleanSystem: (type) => ipcRenderer.invoke("clean-system", type),
  getDiskSpace: () => ipcRenderer.invoke("get-disk-space"),
  // Обновления
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  startDownload: () => ipcRenderer.invoke("start-download"),
  installUpdate: () => ipcRenderer.invoke("install-update"),

  // Слушатели событий
  onUpdateAvailable: (callback) =>
    ipcRenderer.on("update-available", (event, info) => callback(info)),
  onDownloadProgress: (callback) =>
    ipcRenderer.on("download-progress", (event, percent) => callback(percent)),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on("update-downloaded", (event, info) => callback(info)),
  onUpdateError: (callback) =>
    ipcRenderer.on("update-error", (event, error) => callback(error)),
});
