const { autoUpdater } = require("electron-updater");
const { dialog, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");

// Настройка для разработки
if (isDev) {
  autoUpdater.updateConfigPath = path.join(__dirname, "dev-app-update.yml");
}

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function sendToRenderer(channel, data) {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send(channel, data);
  }
}

function checkForUpdates() {
  if (isDev) {
    console.log("Режим разработки - обновления отключены");
    dialog.showMessageBox({
      type: "info",
      title: "Режим разработки",
      message: "Обновления работают только в собранном приложении.",
      buttons: ["OK"],
    });
    return;
  }
  autoUpdater.checkForUpdatesAndNotify();
}

autoUpdater.on("checking-for-update", () => {
  console.log("Проверка обновлений...");
  sendToRenderer("checking-for-update");
});

autoUpdater.on("update-available", (info) => {
  console.log("Доступно обновление:", info);
  sendToRenderer("update-available", info);
});

autoUpdater.on("update-not-available", () => {
  console.log("Обновлений нет");
  sendToRenderer("update-not-available");
});

autoUpdater.on("download-progress", (progressObj) => {
  sendToRenderer("download-progress", progressObj.percent);
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Обновление загружено");
  sendToRenderer("update-downloaded", info);
});

autoUpdater.on("error", (err) => {
  console.error("Ошибка обновления:", err);
  sendToRenderer("update-error", err.message);
});

ipcMain.handle("start-download", () => {
  autoUpdater.downloadUpdate();
  return "Загрузка начата";
});

ipcMain.handle("install-update", () => {
  autoUpdater.quitAndInstall();
  return "Установка...";
});

module.exports = {
  checkForUpdates,
  autoUpdater,
};
