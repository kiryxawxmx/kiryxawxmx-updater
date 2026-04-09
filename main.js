const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const { exec, execSync } = require("child_process");
const { checkForUpdates } = require("./updater");

let mainWindow = null;

function isAdmin() {
  try {
    execSync("net session", { stdio: "pipe" });
    return true;
  } catch (error) {
    return false;
  }
}

function checkDefenderStatus() {
  try {
    const output = execSync(
      'powershell -Command "Get-MpComputerStatus | Select-Object -ExpandProperty RealTimeProtectionEnabled"',
      { encoding: "utf8", windowsHide: true },
    );
    return output.trim() === "True";
  } catch (error) {
    console.error("Ошибка проверки защитника:", error.message);
    return true;
  }
}

function createWindow() {
  if (!isAdmin()) {
    console.log("⚠️ Программа запущена без прав администратора!");
  }

  const defenderEnabled = checkDefenderStatus();
  console.log("Defender enabled:", defenderEnabled);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 1200,
    maxWidth: 1200,
    minHeight: 750,
    maxHeight: 750,
    resizable: false,
    frame: false,
    icon: path.join(__dirname, "icon.ico"),
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: false,
    },
    show: false,
    backgroundColor: "#667eea",
  });

  Menu.setApplicationMenu(null);
  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.on("devtools-opened", () => {
    mainWindow.webContents.closeDevTools();
  });

  if (defenderEnabled) {
    mainWindow.loadFile("defender.html");
  } else {
    mainWindow.loadFile("menu.html");
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  setTimeout(() => {
    checkForUpdates();
  }, 3000);
}

ipcMain.handle("check-for-updates", () => {
  checkForUpdates();
  return "Проверка запущена";
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("web-contents-created", (event, contents) => {
  contents.on("before-input-event", (event, input) => {
    if (
      (input.control && input.shift && input.key === "I") ||
      input.key === "F12" ||
      (input.control && input.shift && input.key === "C")
    ) {
      event.preventDefault();
    }
  });
});

ipcMain.handle("window-minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle("window-close", () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle("navigate", async (event, page) => {
  if (mainWindow) {
    await mainWindow.loadFile(page);
    return true;
  }
  return false;
});

ipcMain.handle("run-command", async (event, cmd) => {
  return new Promise((resolve) => {
    console.log("Выполняется команда:", cmd);

    // Специальная команда для активации Office
    if (cmd === "force-activate-office") {
      const key = "XQNVK-8JYDB-WJ9W3-YJ8YR-WFG99";
      const fs = require("fs");
      const paths = [
        "C:\\Program Files\\Microsoft Office\\root\\Office16",
        "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16",
        "C:\\Program Files\\Microsoft Office\\Office16",
        "C:\\Program Files (x86)\\Microsoft Office\\Office16",
      ];

      let officePath = "";
      for (const p of paths) {
        if (fs.existsSync(p)) {
          officePath = p;
          break;
        }
      }

      if (!officePath) {
        resolve("Ошибка: Папка Office не найдена");
        return;
      }

      const commands = [
        `cd /d "${officePath}"`,
        `cscript //Nologo ospp.vbs /inpkey:${key}`,
        `cscript //Nologo ospp.vbs /act`,
      ];

      exec(commands.join(" && "), { windowsHide: true }, (error, stdout) => {
        if (error) {
          resolve(stdout || "Ошибка активации");
        } else {
          resolve("Office активирован");
        }
      });
      return;
    }

    // Остальные команды
    let fullCommand = cmd;
    if (cmd.startsWith("slmgr")) {
      const args = cmd.replace("slmgr", "").trim();
      fullCommand = `cscript.exe //Nologo C:\\Windows\\System32\\slmgr.vbs ${args}`;
    }

    exec(
      fullCommand,
      {
        windowsHide: true,
        timeout: 60000,
      },
      (error, stdout, stderr) => {
        if (error) {
          resolve(stderr || error.message);
        } else {
          resolve(stdout || "Команда выполнена");
        }
      },
    );
  });
});

// Очистка системы
ipcMain.handle("clean-system", async (event, type) => {
  return new Promise((resolve) => {
    const cleanCommands = {
      temp: [
        "powershell -Command \"Remove-Item -Path '$env:TEMP\\*' -Recurse -Force -ErrorAction SilentlyContinue\"",
        "powershell -Command \"Remove-Item -Path 'C:\\Windows\\Temp\\*' -Recurse -Force -ErrorAction SilentlyContinue\"",
      ],
      cache: [
        "powershell -Command \"Remove-Item -Path '$env:LOCALAPPDATA\\Temp\\*' -Recurse -Force -ErrorAction SilentlyContinue\"",
      ],
      recycle: [
        'powershell -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"',
      ],
      dns: ["ipconfig /flushdns"],
      thumbnails: [
        "powershell -Command \"Remove-Item -Path '$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer\\thumbcache_*.db' -Force -ErrorAction SilentlyContinue\"",
      ],
      logs: [
        "powershell -Command \"Remove-Item -Path 'C:\\Windows\\Logs\\*' -Recurse -Force -ErrorAction SilentlyContinue\"",
        "powershell -Command \"Remove-Item -Path '$env:LOCALAPPDATA\\CrashDumps\\*' -Recurse -Force -ErrorAction SilentlyContinue\"",
      ],
      prefetch: [
        "powershell -Command \"Remove-Item -Path 'C:\\Windows\\Prefetch\\*' -Recurse -Force -ErrorAction SilentlyContinue\"",
      ],
      all: [],
    };

    let commands = [];
    if (type === "all") {
      commands = [
        ...cleanCommands.temp,
        ...cleanCommands.cache,
        ...cleanCommands.recycle,
        ...cleanCommands.dns,
        ...cleanCommands.thumbnails,
        ...cleanCommands.logs,
        ...cleanCommands.prefetch,
      ];
    } else {
      commands = cleanCommands[type] || [];
    }

    let output = "";
    let completed = 0;

    if (commands.length === 0) {
      resolve("Очистка завершена");
      return;
    }

    commands.forEach((cmd, index) => {
      exec(cmd, { windowsHide: true }, (error, stdout) => {
        completed++;
        if (!error) {
          output += stdout;
        }

        if (completed === commands.length) {
          resolve(output || "Очистка завершена");
        }
      });
    });
  });
});

// Получение информации о диске через Node.js
ipcMain.handle("get-disk-space", async () => {
  const { execSync } = require("child_process");

  try {
    // Самый простой и надежный способ
    const output = execSync(
      'wmic logicaldisk where DeviceID="C:" get Size,FreeSpace',
      {
        encoding: "utf8",
        windowsHide: true,
      },
    );

    console.log("WMIC output:", output);

    const lines = output.trim().split("\n");
    if (lines.length >= 2) {
      const numbers = lines[1].trim().split(/\s+/);
      if (numbers.length >= 2) {
        const freeSpace = parseInt(numbers[0]) || 0;
        const totalSize = parseInt(numbers[1]) || 0;
        const usedSpace = totalSize - freeSpace;

        const totalGB = (totalSize / 1073741824).toFixed(2);
        const usedGB = (usedSpace / 1073741824).toFixed(2);
        const freeGB = (freeSpace / 1073741824).toFixed(2);
        const percent = ((usedSpace / totalSize) * 100).toFixed(1);

        return {
          total: parseFloat(totalGB),
          used: parseFloat(usedGB),
          free: parseFloat(freeGB),
          percent: parseFloat(percent),
        };
      }
    }
  } catch (e) {
    console.error("WMIC error:", e);
  }

  // Если WMIC не сработал, пробуем PowerShell
  try {
    const psOutput = execSync(
      "powershell -Command \"Get-PSDrive C | Select-Object @{Name='Total';Expression={[math]::Round($_.Used/1GB + $_.Free/1GB, 2)}}, @{Name='Used';Expression={[math]::Round($_.Used/1GB, 2)}}, @{Name='Free';Expression={[math]::Round($_.Free/1GB, 2)}}\"",
      {
        encoding: "utf8",
        windowsHide: true,
      },
    );

    console.log("PowerShell output:", psOutput);

    const lines = psOutput.trim().split("\n");
    if (lines.length >= 3) {
      const data = lines[2].trim().split(/\s+/);
      if (data.length >= 3) {
        return {
          total: parseFloat(data[0]) || 0,
          used: parseFloat(data[1]) || 0,
          free: parseFloat(data[2]) || 0,
          percent: data[0] > 0 ? ((data[1] / data[0]) * 100).toFixed(1) : 0,
        };
      }
    }
  } catch (e) {
    console.error("PowerShell error:", e);
  }

  return { total: 0, used: 0, free: 0, percent: 0 };
});

// Установка программ
ipcMain.handle("install-app", async (event, appId) => {
  return new Promise((resolve, reject) => {
    const apps = {
      // Браузеры
      chrome: {
        name: "Google Chrome",
        url: "https://dl.google.com/chrome/install/standalonesetup64.exe",
        args: "/silent /install",
      },
      firefox: {
        name: "Mozilla Firefox",
        url: "https://download.mozilla.org/?product=firefox-latest&os=win64&lang=ru",
        args: "/S",
      },
      opera: {
        name: "Opera",
        url: "https://get.opera.com/pub/opera/desktop/latest/win/Opera_Setup_x64.exe",
        args: "/silent /allusers=1",
      },
      edge: {
        name: "Microsoft Edge",
        url: "https://go.microsoft.com/fwlink/?linkid=2109047&Channel=Stable&language=ru",
        args: "/silent /install",
      },
      brave: {
        name: "Brave",
        url: "https://laptop-updates.brave.com/latest/winx64",
        args: "/silent /install",
      },

      // Мессенджеры
      telegram: {
        name: "Telegram",
        url: "https://telegram.org/dl/desktop/win64",
        args: "/VERYSILENT",
      },
      discord: {
        name: "Discord",
        url: "https://discord.com/api/download/stable?platform=win",
        args: "/s",
      },
      skype: {
        name: "Skype",
        url: "https://go.skype.com/windows.desktop.download",
        args: "/VERYSILENT /SUPPRESSMSGBOXES",
      },
      whatsapp: {
        name: "WhatsApp",
        url: "https://web.whatsapp.com/desktop/windows/release/x64/WhatsAppSetup.exe",
        args: "/S",
      },
      slack: {
        name: "Slack",
        url: "https://slack.com/api/desktop.latest?arch=x64&variant=exe&redirect=true",
        args: "/S",
      },
      zoom: {
        name: "Zoom",
        url: "https://zoom.us/client/latest/ZoomInstaller.exe",
        args: "/quiet",
      },

      // Архиваторы
      winrar: {
        name: "WinRAR",
        url: "https://www.win-rar.com/fileadmin/winrar-versions/winrar/winrar-x64-701ru.exe",
        args: "/S",
      },
      "7zip": {
        name: "7-Zip",
        url: "https://www.7-zip.org/a/7z2408-x64.exe",
        args: "/S",
      },

      // Медиа
      vlc: {
        name: "VLC Media Player",
        url: "https://get.videolan.org/vlc/last/win64/vlc-3.0.20-win64.exe",
        args: "/S",
      },
      spotify: {
        name: "Spotify",
        url: "https://download.scdn.co/SpotifySetup.exe",
        args: "/silent",
      },
    };

    const app = apps[appId];
    if (!app) {
      reject("Приложение не найдено");
      return;
    }

    const tempDir = require("os").tmpdir();
    const installerPath = path.join(tempDir, `${appId}_installer.exe`);

    // Скачиваем установщик
    const https = require("https");
    const fs = require("fs");

    const file = fs.createWriteStream(installerPath);

    https
      .get(app.url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Редирект
          https
            .get(response.headers.location, (res) => {
              res.pipe(file);
              file.on("finish", () => {
                file.close();
                runInstaller(
                  installerPath,
                  app.args,
                  app.name,
                  resolve,
                  reject,
                );
              });
            })
            .on("error", (err) => {
              reject(`Ошибка загрузки: ${err.message}`);
            });
        } else {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            runInstaller(installerPath, app.args, app.name, resolve, reject);
          });
        }
      })
      .on("error", (err) => {
        reject(`Ошибка загрузки: ${err.message}`);
      });
  });
});

function runInstaller(path, args, name, resolve, reject) {
  const { exec } = require("child_process");

  exec(`"${path}" ${args}`, { windowsHide: true }, (error) => {
    // Удаляем установщик
    require("fs").unlink(path, () => {});

    if (error) {
      reject(`Ошибка установки ${name}: ${error.message}`);
    } else {
      resolve(`${name} успешно установлен`);
    }
  });
}

// Получение списка программ
ipcMain.handle("get-apps-list", () => {
  return {
    browsers: [
      {
        id: "chrome",
        name: "Google Chrome",
        icon: "🌐",
        description: "Популярный браузер от Google",
      },
      {
        id: "firefox",
        name: "Mozilla Firefox",
        icon: "🦊",
        description: "Свободный браузер с защитой приватности",
      },
      {
        id: "opera",
        name: "Opera",
        icon: "🔴",
        description: "Браузер со встроенным VPN",
      },
      {
        id: "edge",
        name: "Microsoft Edge",
        icon: "🌊",
        description: "Современный браузер от Microsoft",
      },
      {
        id: "brave",
        name: "Brave",
        icon: "🦁",
        description: "Браузер с блокировкой рекламы",
      },
    ],
    messengers: [
      {
        id: "telegram",
        name: "Telegram",
        icon: "✈️",
        description: "Быстрый и безопасный мессенджер",
      },
      {
        id: "discord",
        name: "Discord",
        icon: "🎮",
        description: "Мессенджер для геймеров и сообществ",
      },
      {
        id: "skype",
        name: "Skype",
        icon: "📞",
        description: "Видеозвонки и обмен сообщениями",
      },
      {
        id: "whatsapp",
        name: "WhatsApp",
        icon: "💬",
        description: "Популярный мессенджер",
      },
      {
        id: "slack",
        name: "Slack",
        icon: "💼",
        description: "Мессенджер для рабочих команд",
      },
      {
        id: "zoom",
        name: "Zoom",
        icon: "🎥",
        description: "Видеоконференции и онлайн-встречи",
      },
    ],
    archivers: [
      {
        id: "winrar",
        name: "WinRAR",
        icon: "📦",
        description: "Популярный архиватор",
      },
      {
        id: "7zip",
        name: "7-Zip",
        icon: "🗜️",
        description: "Бесплатный архиватор с высокой степенью сжатия",
      },
    ],
    media: [
      {
        id: "vlc",
        name: "VLC Media Player",
        icon: "🎬",
        description: "Универсальный медиаплеер",
      },
      {
        id: "spotify",
        name: "Spotify",
        icon: "🎵",
        description: "Музыкальный стриминговый сервис",
      },
    ],
  };
});

// Проверка приложений Office (упрощенная)
ipcMain.handle("check-office-apps", async () => {
  return new Promise((resolve) => {
    const psScript = `
      $result = @{
        officeVersion = $null
        officePath = $null
        apps = @{}
      }
      
      # Ищем папку Office
      $searchPaths = @(
        "C:\\Program Files\\Microsoft Office\\root\\Office16",
        "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16",
        "C:\\Program Files\\Microsoft Office\\Office16",
        "C:\\Program Files (x86)\\Microsoft Office\\Office16",
        "C:\\Program Files\\Microsoft Office\\Office15",
        "C:\\Program Files (x86)\\Microsoft Office\\Office15"
      )
      
      foreach ($p in $searchPaths) {
        if (Test-Path $p) {
          $result.officePath = $p
          if ($p -like "*Office16*") { $result.officeVersion = "16.0" }
          elseif ($p -like "*Office15*") { $result.officeVersion = "15.0" }
          break
        }
      }
      
      # Проверяем приложения
      $appList = @("WINWORD", "EXCEL", "POWERPNT", "OUTLOOK", "ONENOTE")
      foreach ($app in $appList) {
        $found = $false
        if ($result.officePath) {
          $exePath = Join-Path $result.officePath "$app.EXE"
          $found = Test-Path $exePath
        }
        $result.apps[$app.ToLower()] = $found
      }
      
      $result | ConvertTo-Json
    `;

    exec(
      `powershell -Command "${psScript}"`,
      { windowsHide: true },
      (error, stdout) => {
        try {
          const data = JSON.parse(stdout || "{}");
          resolve(data);
        } catch {
          resolve({ apps: {} });
        }
      },
    );
  });
});

// Прямая активация Office (без проверок)
ipcMain.handle("force-activate-office", async () => {
  return new Promise((resolve, reject) => {
    const key = "XQNVK-8JYDB-WJ9W3-YJ8YR-WFG99"; // Универсальный ключ

    // Ищем папку Office
    const fs = require("fs");
    const paths = [
      "C:\\Program Files\\Microsoft Office\\root\\Office16",
      "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16",
      "C:\\Program Files\\Microsoft Office\\Office16",
      "C:\\Program Files (x86)\\Microsoft Office\\Office16",
    ];

    let officePath = "";
    for (const p of paths) {
      if (fs.existsSync(p)) {
        officePath = p;
        break;
      }
    }

    if (!officePath) {
      reject("Папка Office не найдена. Убедитесь, что Office установлен.");
      return;
    }

    const commands = [
      `cd /d "${officePath}"`,
      `cscript //Nologo ospp.vbs /inpkey:${key}`,
      `cscript //Nologo ospp.vbs /act`,
    ];

    exec(commands.join(" && "), { windowsHide: true }, (error, stdout) => {
      if (error) {
        reject(stdout || "Ошибка активации");
      } else {
        resolve("Office активирован");
      }
    });
  });
});

ipcMain.handle("disable-defender", async () => {
  return new Promise((resolve, reject) => {
    const psCommand =
      'powershell -Command "Set-MpPreference -DisableRealtimeMonitoring $true"';
    exec(psCommand, { windowsHide: true }, (error, stdout) => {
      if (error) reject("Ошибка отключения защитника");
      else resolve("OK");
    });
  });
});

ipcMain.handle("check-defender", async () => {
  return new Promise((resolve) => {
    exec(
      'powershell -Command "Get-MpPreference | Select-Object -ExpandProperty DisableRealtimeMonitoring"',
      { encoding: "utf8", windowsHide: true },
      (err, stdout) => {
        resolve(stdout.trim() !== "True");
      },
    );
  });
});

ipcMain.handle("get-system-info", () => {
  try {
    const os = require("os");
    return {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + " GB",
      isAdmin: isAdmin(),
    };
  } catch (error) {
    return { error: error.message };
  }
});
