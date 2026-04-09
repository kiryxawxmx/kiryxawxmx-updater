// Табы
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetTab = tab.dataset.tab;

    // Убираем активный класс у всех табов
    tabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    // Активируем выбранный таб
    tab.classList.add("active");
    document.getElementById(`${targetTab}-tab`).classList.add("active");
  });
});

// Модальные окна
const windowsModal = document.getElementById("windowsModal");
const removeKeyModal = document.getElementById("removeKeyModal");
const activateBtn = document.getElementById("activateWindowsBtn");
const removeKeyBtn = document.getElementById("removeKeyBtn");
const confirmActivationBtn = document.getElementById("confirmActivationBtn");
const confirmRemoveKeyBtn = document.getElementById("confirmRemoveKeyBtn");

// Прогресс-бар
const progressContainer = document.getElementById("progressContainer");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

// Ключи Windows
const WINDOWS_KEYS = {
  7: "FJ82H-XT6CR-J8D7P-XQJJ2-GPDD4",
  8: "NG4HW-VH26C-733KW-K6F98-J8CK4",
  10: "W269N-WFGWX-YVC9B-4J6C9-T83GX",
  11: "W269N-WFGWX-YVC9B-4J6C9-T83GX",
};

let selectedVersion = null;

document.getElementById("minimizeBtn").addEventListener("click", () => {
  window.electronAPI.minimizeWindow();
});

document.getElementById("closeBtn").addEventListener("click", () => {
  window.electronAPI.closeWindow();
});
// Обновления
const appVersion = document.getElementById("appVersion");
const checkUpdateBtn = document.getElementById("checkUpdateBtn");
const updateAvailable = document.getElementById("updateAvailable");
const newVersion = document.getElementById("newVersion");
const downloadUpdateBtn = document.getElementById("downloadUpdateBtn");
const downloadProgress = document.getElementById("downloadProgress");
const downloadPercent = document.getElementById("downloadPercent");
const downloadProgressBar = document.getElementById("downloadProgressBar");
const updateReady = document.getElementById("updateReady");
const installUpdateBtn = document.getElementById("installUpdateBtn");

// Получить версию
async function loadAppVersion() {
  try {
    const version = await window.electronAPI.getAppVersion();
    appVersion.textContent = version;
  } catch (e) {
    console.error("Ошибка получения версии:", e);
  }
}

// Проверить обновления
checkUpdateBtn.addEventListener("click", async () => {
  checkUpdateBtn.style.animation = "spin 1s linear infinite";
  await window.electronAPI.checkForUpdates();
  setTimeout(() => {
    checkUpdateBtn.style.animation = "";
  }, 2000);
});

// Скачать обновление
downloadUpdateBtn.addEventListener("click", async () => {
  updateAvailable.style.display = "none";
  downloadProgress.style.display = "block";
  await window.electronAPI.startDownload();
});

// Установить обновление
installUpdateBtn.addEventListener("click", async () => {
  await window.electronAPI.installUpdate();
});

// Слушатели событий от updater
if (window.electronAPI.onUpdateAvailable) {
  window.electronAPI.onUpdateAvailable((info) => {
    newVersion.textContent = info.version;
    updateAvailable.style.display = "block";

    // Показать уведомление
    showNotification(
      "info",
      "Доступно обновление",
      `Версия ${info.version} готова к загрузке`,
    );
  });
}

if (window.electronAPI.onDownloadProgress) {
  window.electronAPI.onDownloadProgress((percent) => {
    downloadPercent.textContent = Math.round(percent) + "%";
    downloadProgressBar.style.width = percent + "%";
  });
}

if (window.electronAPI.onUpdateDownloaded) {
  window.electronAPI.onUpdateDownloaded((info) => {
    downloadProgress.style.display = "none";
    updateReady.style.display = "block";

    showNotification(
      "success",
      "Обновление загружено",
      'Нажмите "Установить" для перезапуска',
    );
  });
}

if (window.electronAPI.onUpdateError) {
  window.electronAPI.onUpdateError((error) => {
    downloadProgress.style.display = "none";
    updateAvailable.style.display = "none";

    showNotification("error", "Ошибка обновления", error);
  });
}

loadAppVersion();
// Проверка статуса защитника при загрузке
window.addEventListener("load", async () => {
  try {
    const defenderStatus = await window.electronAPI.checkDefender();
    updateDefenderStatus(defenderStatus);
  } catch (err) {
    console.error("Ошибка проверки защитника:", err);
  }
});

// Очистка системы
const startCleanBtn = document.getElementById("startCleanBtn");
const cleanAllBtn = document.getElementById("cleanAllBtn");
const diskFreeSpace = document.getElementById("diskFreeSpace");
const diskUsed = document.getElementById("diskUsed");
const diskFree = document.getElementById("diskFree");
const diskUsedBar = document.getElementById("diskUsedBar");

const cleanItems = {
  temp: { name: "Временные файлы", icon: "🗂️" },
  cache: { name: "Кэш системы", icon: "⚡" },
  recycle: { name: "Корзина", icon: "🗑️" },
  dns: { name: "DNS кэш", icon: "🌐" },
  thumbnails: { name: "Миниатюры", icon: "🖼️" },
  logs: { name: "Логи системы", icon: "📋" },
  prefetch: { name: "Prefetch", icon: "🚀" },
};

// Форматирование размера
function formatBytes(bytes) {
  if (bytes === 0) return "0 Б";
  const k = 1024;
  const sizes = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Обновление информации о диске
async function updateDiskInfo() {
  console.log("Обновление информации о диске...");

  diskFreeSpace.textContent = "Загрузка...";
  diskUsed.textContent = "...";
  diskFree.textContent = "...";

  try {
    const data = await window.electronAPI.getDiskSpace();
    console.log("Получены данные диска:", data);

    if (data && data.total > 0) {
      const total = data.total;
      const used = data.used;
      const free = data.free;
      const percent = data.percent;

      // Обновляем прогресс-бар
      diskUsedBar.style.width = percent + "%";

      // Обновляем текст
      diskUsed.textContent = used.toFixed(1) + " ГБ";
      diskFree.textContent = free.toFixed(1) + " ГБ";
      diskFreeSpace.textContent = `Свободно ${free.toFixed(1)} ГБ из ${total.toFixed(1)} ГБ`;

      // Цвет прогресс-бара
      if (percent > 90) {
        diskUsedBar.style.background =
          "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)";
      } else if (percent > 75) {
        diskUsedBar.style.background =
          "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)";
      } else {
        diskUsedBar.style.background =
          "linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)";
      }
    } else {
      showDiskError();
    }
  } catch (error) {
    console.error("Ошибка получения данных диска:", error);
    showDiskError();
  }
}

function showDiskError() {
  diskUsedBar.style.width = "0%";
  diskUsed.textContent = "—";
  diskFree.textContent = "—";
  diskFreeSpace.textContent = "Ошибка загрузки данных";
}

function setDefaultDiskInfo() {
  diskUsedBar.style.width = "0%";
  diskUsed.textContent = "—";
  diskFree.textContent = "—";
  diskFreeSpace.textContent = "Не удалось получить информацию о диске";
}

// Альтернативный способ получения информации о диске
async function getDiskInfoAlternative() {
  try {
    // Пробуем получить через другую команду
    const result = await window.electronAPI.runCommand(
      'wmic logicaldisk where DeviceID="C:" get Size,FreeSpace /format:csv',
    );
    console.log("Alternative disk info:", result);

    if (result && result.includes(",")) {
      const lines = result.trim().split("\n");
      if (lines.length >= 2) {
        const parts = lines[1].split(",");
        const total = parseInt(parts[1]) || 0;
        const free = parseInt(parts[2]) || 0;
        const used = total - free;

        const totalGB = (total / 1073741824).toFixed(1);
        const usedGB = (used / 1073741824).toFixed(1);
        const freeGB = (free / 1073741824).toFixed(1);
        const percent = ((used / total) * 100).toFixed(1);

        diskUsedBar.style.width = percent + "%";
        diskUsed.textContent = usedGB + " ГБ";
        diskFree.textContent = freeGB + " ГБ";
        diskFreeSpace.textContent = `Свободно ${freeGB} ГБ из ${totalGB} ГБ`;

        return;
      }
    }
  } catch (e) {
    console.error("Альтернативный метод не сработал:", e);
  }

  setDefaultDiskInfo();
}

// Обновляем при загрузке и пробуем альтернативный метод
setTimeout(() => {
  updateDiskInfo().catch(() => {
    getDiskInfoAlternative();
  });
}, 1000);

// Создание модального окна очистки
function createCleanModal(selectedTypes) {
  const modal = document.createElement("div");
  modal.className = "modal active";

  const itemsHtml = selectedTypes
    .map(
      (type) => `
    <div class="clean-item-progress" id="clean-${type}">
      <div class="clean-item-icon">${cleanItems[type].icon}</div>
      <div class="clean-item-info">
        <div class="clean-item-name">${cleanItems[type].name}</div>
        <div class="clean-item-status" id="status-${type}">Ожидание...</div>
      </div>
    </div>
  `,
    )
    .join("");

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3>🧹 Очистка системы</h3>
        <p>Выполняется очистка выбранных компонентов...</p>
      </div>
      
      <div id="cleanProgressList" style="margin-bottom: 20px; max-height: 400px; overflow-y: auto;">
        ${itemsHtml}
      </div>
      
      <!-- Общий прогресс -->
      <div style="margin-top: 20px;">
        <div class="progress-bar">
          <div class="progress-fill" id="totalCleanProgress" style="width: 0%;"></div>
        </div>
        <div class="progress-text" id="totalCleanText">Подготовка...</div>
      </div>
      
      <!-- Искры анимации -->
      <div class="clean-sparkles" id="sparkles"></div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

// Создание искр
function createSparkles(container) {
  for (let i = 0; i < 20; i++) {
    const sparkle = document.createElement("div");
    sparkle.className = "sparkle";
    sparkle.style.left = Math.random() * 100 + "%";
    sparkle.style.top = Math.random() * 100 + "%";
    sparkle.style.animationDelay = Math.random() * 0.5 + "s";
    container.appendChild(sparkle);

    setTimeout(() => sparkle.remove(), 1000);
  }
}

// Запуск очистки
async function runCleanup(selectedTypes) {
  const modal = createCleanModal(selectedTypes);
  const totalProgress = document.getElementById("totalCleanProgress");
  const totalText = document.getElementById("totalCleanText");
  const sparkles = document.getElementById("sparkles");

  let completed = 0;
  const total = selectedTypes.length;

  for (const type of selectedTypes) {
    const statusEl = document.getElementById(`status-${type}`);
    const itemEl = document.getElementById(`clean-${type}`);

    statusEl.textContent = "Очистка...";
    statusEl.style.color = "#8b5cf6";
    itemEl.classList.add("cleaning-animation");

    // Создаем искры
    createSparkles(sparkles);

    try {
      await window.electronAPI.cleanSystem(type);

      statusEl.textContent = "✓ Очищено";
      statusEl.style.color = "#10b981";
      itemEl.style.background = "#dcfce7";
    } catch (error) {
      statusEl.textContent = "✗ Ошибка";
      statusEl.style.color = "#ef4444";
      console.error(`Ошибка очистки ${type}:`, error);
    }

    itemEl.classList.remove("cleaning-animation");
    completed++;

    const percent = (completed / total) * 100;
    totalProgress.style.width = percent + "%";
    totalText.textContent = `Выполнено ${completed} из ${total}`;

    await new Promise((r) => setTimeout(r, 600));
  }

  // Завершение
  totalProgress.style.width = "100%";
  totalProgress.style.background =
    "linear-gradient(90deg, #10b981 0%, #059669 100%)";
  totalText.textContent = "✅ Очистка завершена!";
  totalText.style.color = "#10b981";

  // Обновляем информацию о диске
  await updateDiskInfo();

  // Кнопка закрытия
  setTimeout(() => {
    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn-primary";
    closeBtn.style.marginTop = "20px";
    closeBtn.style.width = "100%";
    closeBtn.textContent = "Готово";
    closeBtn.onclick = () => {
      modal.remove();
      showNotification(
        "success",
        "Очистка завершена",
        "Система успешно очищена",
      );
    };
    modal.querySelector(".modal-content").appendChild(closeBtn);
  }, 500);
}

// Обработчик кнопки "Начать очистку"
if (startCleanBtn) {
  startCleanBtn.addEventListener("click", () => {
    const selected = [];
    document.querySelectorAll(".clean-option input:checked").forEach((cb) => {
      selected.push(cb.value);
    });

    if (selected.length === 0) {
      showNotification(
        "info",
        "Ничего не выбрано",
        "Выберите компоненты для очистки",
      );
      return;
    }

    runCleanup(selected);
  });
}

// Обработчик кнопки "Очистить всё"
if (cleanAllBtn) {
  cleanAllBtn.addEventListener("click", () => {
    const allTypes = Object.keys(cleanItems);
    runCleanup(allTypes);
  });
}

// Загрузка информации о диске при открытии таба
const optimizationTab = document.querySelector('[data-tab="optimization"]');
if (optimizationTab) {
  optimizationTab.addEventListener("click", () => {
    updateDiskInfo();
  });
}

// Обновляем при загрузке
setTimeout(updateDiskInfo, 1000);

// Office
const officeStatusText = document.getElementById("officeStatusText");
const officeAppsList = document.getElementById("officeAppsList");
const forceActivateOfficeBtn = document.getElementById(
  "forceActivateOfficeBtn",
);
const recheckOfficeBtn = document.getElementById("recheckOfficeBtn");

const officeApps = [
  { id: "winword", name: "Word", icon: "📝" },
  { id: "excel", name: "Excel", icon: "📊" },
  { id: "powerpnt", name: "PowerPoint", icon: "📽️" },
  { id: "outlook", name: "Outlook", icon: "📧" },
  { id: "onenote", name: "OneNote", icon: "📓" },
];

// Проверка Office
async function checkOfficeStatus() {
  officeStatusText.textContent = "Проверка наличия Office...";
  officeStatusText.style.color = "#64748b";

  try {
    const result = await window.electronAPI.checkOfficeApps();
    console.log("Office check result:", result);

    let installedCount = 0;
    let html =
      '<div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">';

    for (const app of officeApps) {
      const isInstalled = result.apps?.[app.id] || false;
      if (isInstalled) installedCount++;

      html += `
        <div style="padding: 8px 16px; background: ${isInstalled ? "#dcfce7" : "#f1f5f9"}; border-radius: 20px; display: flex; align-items: center; gap: 6px;">
          <span>${app.icon}</span>
          <span style="font-size: 13px; color: ${isInstalled ? "#166534" : "#64748b"};">${app.name}</span>
          <span style="font-size: 11px;">${isInstalled ? "✓" : "✗"}</span>
        </div>
      `;
    }
    html += "</div>";

    officeAppsList.innerHTML = html;

    if (result.officePath) {
      const shortPath = result.officePath
        .replace("C:\\Program Files\\", "")
        .replace("C:\\Program Files (x86)\\", "");
      officeStatusText.innerHTML = `✓ Office найден: ${shortPath}<br>📦 Установлено приложений: ${installedCount}/5`;
      officeStatusText.style.color = "#166534";
    } else {
      officeStatusText.innerHTML = `⚠️ Папка Office не найдена<br>Но вы все равно можете попробовать активировать`;
      officeStatusText.style.color = "#b45309";
    }
  } catch (error) {
    console.error("Office check error:", error);
    officeStatusText.innerHTML =
      "❌ Ошибка проверки<br>Попробуйте активировать принудительно";
    officeStatusText.style.color = "#dc2626";

    // Показываем список приложений как "неизвестно"
    let html =
      '<div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">';
    for (const app of officeApps) {
      html += `
        <div style="padding: 8px 16px; background: #fef3c7; border-radius: 20px; display: flex; align-items: center; gap: 6px;">
          <span>${app.icon}</span>
          <span style="font-size: 13px; color: #92400e;">${app.name}</span>
          <span style="font-size: 11px;">?</span>
        </div>
      `;
    }
    html += "</div>";
    officeAppsList.innerHTML = html;
  }
}

// Принудительная активация Office
async function forceActivateOffice() {
  progressContainer.classList.add("active");
  forceActivateOfficeBtn.disabled = true;
  recheckOfficeBtn.disabled = true;

  try {
    updateProgress(20, "Поиск папки Office...");
    await new Promise((r) => setTimeout(r, 800));

    updateProgress(40, "Установка лицензионного ключа...");
    const result = await window.electronAPI.runCommand("force-activate-office");

    updateProgress(70, "Активация продуктов...");
    await new Promise((r) => setTimeout(r, 2000));

    updateProgress(90, "Завершение активации...");
    await new Promise((r) => setTimeout(r, 1000));

    updateProgress(100, "Office активирован!");

    setTimeout(() => {
      progressContainer.classList.remove("active");
      progressFill.style.width = "0%";
      showNotification(
        "success",
        "Office активирован",
        "Microsoft Office успешно активирован",
      );
      forceActivateOfficeBtn.disabled = false;
      recheckOfficeBtn.disabled = false;
      checkOfficeStatus(); // Обновляем статус
    }, 1000);
  } catch (error) {
    console.error("Activation error:", error);
    progressContainer.classList.remove("active");
    progressFill.style.width = "0%";

    // Показываем понятное сообщение
    let errorMsg = "Не удалось активировать Office.";
    if (error.includes("не найдена")) {
      errorMsg =
        "Папка Office не найдена. Установите Office или запустите от администратора.";
    } else if (error.includes("0x")) {
      errorMsg =
        "Ошибка активации. Попробуйте запустить от имени администратора.";
    }

    showNotification("error", "Ошибка", errorMsg);
    forceActivateOfficeBtn.disabled = false;
    recheckOfficeBtn.disabled = false;
  }
}

// Обработчики
forceActivateOfficeBtn.addEventListener("click", forceActivateOffice);
recheckOfficeBtn.addEventListener("click", checkOfficeStatus);

// Запускаем проверку при загрузке
setTimeout(checkOfficeStatus, 500);

// Программы
let appsList = null;
let selectedApps = new Set();

// Загрузка списка программ
async function loadProgramsTab() {
  const programsGrid = document.getElementById("programsGrid");

  try {
    appsList = await window.electronAPI.getAppsList();

    let html = "";

    // Браузеры
    html += `
      <div class="card">
        <div class="card-icon">🌐</div>
        <h3>Браузеры</h3>
        <p>Выберите браузеры для установки</p>
        <div style="margin: 16px 0;">
          ${appsList.browsers
            .map(
              (app) => `
            <label style="display: flex; align-items: center; gap: 12px; padding: 8px 0; cursor: pointer;">
              <input type="checkbox" value="${app.id}" data-category="browsers" class="app-checkbox">
              <span style="font-size: 24px;">${app.icon}</span>
              <div>
                <div style="font-weight: 600;">${app.name}</div>
                <div style="font-size: 12px; color: #64748b;">${app.description}</div>
              </div>
            </label>
          `,
            )
            .join("")}
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" onclick="installSelectedApps('browsers')">
            <span>📥</span>
            <span>Установить выбранные</span>
          </button>
          <button class="btn btn-secondary" onclick="selectAll('browsers')">
            <span>✓</span>
            <span>Выбрать все</span>
          </button>
        </div>
      </div>
    `;

    // Мессенджеры
    html += `
      <div class="card">
        <div class="card-icon">💬</div>
        <h3>Мессенджеры</h3>
        <p>Выберите мессенджеры для установки</p>
        <div style="margin: 16px 0;">
          ${appsList.messengers
            .map(
              (app) => `
            <label style="display: flex; align-items: center; gap: 12px; padding: 8px 0; cursor: pointer;">
              <input type="checkbox" value="${app.id}" data-category="messengers" class="app-checkbox">
              <span style="font-size: 24px;">${app.icon}</span>
              <div>
                <div style="font-weight: 600;">${app.name}</div>
                <div style="font-size: 12px; color: #64748b;">${app.description}</div>
              </div>
            </label>
          `,
            )
            .join("")}
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" onclick="installSelectedApps('messengers')">
            <span>📥</span>
            <span>Установить выбранные</span>
          </button>
          <button class="btn btn-secondary" onclick="selectAll('messengers')">
            <span>✓</span>
            <span>Выбрать все</span>
          </button>
        </div>
      </div>
    `;

    // Архиваторы
    html += `
      <div class="card">
        <div class="card-icon">📦</div>
        <h3>Архиваторы</h3>
        <p>Программы для работы с архивами</p>
        <div style="margin: 16px 0;">
          ${appsList.archivers
            .map(
              (app) => `
            <label style="display: flex; align-items: center; gap: 12px; padding: 8px 0; cursor: pointer;">
              <input type="checkbox" value="${app.id}" data-category="archivers" class="app-checkbox">
              <span style="font-size: 24px;">${app.icon}</span>
              <div>
                <div style="font-weight: 600;">${app.name}</div>
                <div style="font-size: 12px; color: #64748b;">${app.description}</div>
              </div>
            </label>
          `,
            )
            .join("")}
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" onclick="installSelectedApps('archivers')">
            <span>📥</span>
            <span>Установить выбранные</span>
          </button>
        </div>
      </div>
    `;

    // Медиа
    html += `
      <div class="card">
        <div class="card-icon">🎬</div>
        <h3>Медиа</h3>
        <p>Плееры и мультимедиа</p>
        <div style="margin: 16px 0;">
          ${appsList.media
            .map(
              (app) => `
            <label style="display: flex; align-items: center; gap: 12px; padding: 8px 0; cursor: pointer;">
              <input type="checkbox" value="${app.id}" data-category="media" class="app-checkbox">
              <span style="font-size: 24px;">${app.icon}</span>
              <div>
                <div style="font-weight: 600;">${app.name}</div>
                <div style="font-size: 12px; color: #64748b;">${app.description}</div>
              </div>
            </label>
          `,
            )
            .join("")}
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" onclick="installSelectedApps('media')">
            <span>📥</span>
            <span>Установить выбранные</span>
          </button>
        </div>
      </div>
    `;

    programsGrid.innerHTML = html;
  } catch (error) {
    programsGrid.innerHTML =
      '<div class="card"><p>Ошибка загрузки списка программ</p></div>';
  }
}

// Выбрать все
window.selectAll = function (category) {
  const checkboxes = document.querySelectorAll(
    `input[data-category="${category}"]`,
  );
  checkboxes.forEach((cb) => (cb.checked = true));
};

// Установка выбранных программ
window.installSelectedApps = async function (category) {
  const checkboxes = document.querySelectorAll(
    `input[data-category="${category}"]:checked`,
  );
  const appIds = Array.from(checkboxes).map((cb) => cb.value);

  if (appIds.length === 0) {
    showNotification(
      "info",
      "Ничего не выбрано",
      "Выберите хотя бы одну программу",
    );
    return;
  }

  // Находим названия программ
  const categoryData = appsList[category];
  const selectedAppsData = appIds.map((id) => {
    const app = categoryData.find((a) => a.id === id);
    return { id, name: app?.name || id, icon: app?.icon || "📦" };
  });

  // Создаем модальное окно с прогрессом
  const modal = document.createElement("div");
  modal.className = "modal active";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3>📥 Установка программ</h3>
        <p>Идёт установка выбранных программ...</p>
      </div>

      <!-- Предупреждение -->
      <div style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left: 4px solid #f59e0b; border-radius: 12px;">
        <div style="display: flex; gap: 12px;">
          <span style="font-size: 24px;">⚠️</span>
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #92400e; margin-bottom: 6px;">Внимание</div>
            <div style="color: #78350f; font-size: 13px; line-height: 1.5;">
              Некоторые программы могут не установиться автоматически из-за:<br>
              • Блокировки антивирусом или Защитником Windows<br>
              • Отсутствия прав администратора<br>
              • Ограничений сетевого доступа
            </div>
            <div style="margin-top: 10px; padding: 8px 12px; background: #fef9c3; border-radius: 8px; color: #854d0e; font-size: 12px; font-weight: 500;">
              💡 Если программа не установилась — установите её вручную.
              Извиняемся за неудоство, скоро будет все исправлено и работать в штатном режиме.
            </div>
          </div>
        </div>
      </div>
      
      <div id="installProgressList" style="margin-bottom: 20px;">
        ${selectedAppsData
          .map(
            (app) => `
          <div class="install-progress-item" id="install-${app.id}">
            <div class="install-progress-icon">${app.icon}</div>
            <div class="install-progress-info">
              <div class="install-progress-name">${app.name}</div>
              <div class="install-progress-bar">
                <div class="install-progress-fill" id="progress-${app.id}" style="width: 0%;"></div>
              </div>
              <div class="install-status" id="status-${app.id}">Ожидание...</div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      
      <div id="installSummary" style="text-align: center; padding: 12px; background: #f1f5f9; border-radius: 8px;">
        Установлено: <span id="installedCount">0</span>/${selectedAppsData.length}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  let installedCount = 0;

  // Устанавливаем по очереди
  for (const app of selectedAppsData) {
    const statusEl = document.getElementById(`status-${app.id}`);
    const progressEl = document.getElementById(`progress-${app.id}`);

    statusEl.textContent = "Загрузка...";
    progressEl.style.width = "20%";

    try {
      const result = await window.electronAPI.installApp(app.id);

      progressEl.style.width = "100%";
      statusEl.textContent = "✓ Установлено";
      statusEl.style.color = "#10b981";
      installedCount++;
      document.getElementById("installedCount").textContent = installedCount;
    } catch (error) {
      progressEl.style.width = "100%";
      progressEl.style.background = "#ef4444";
      statusEl.textContent = "✗ Ошибка";
      statusEl.style.color = "#ef4444";
      console.error(`Ошибка установки ${app.name}:`, error);
    }

    // Небольшая пауза между установками
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Обновляем итог
  setTimeout(() => {
    const summary = document.getElementById("installSummary");
    if (installedCount === selectedAppsData.length) {
      summary.innerHTML = "✅ Все программы успешно установлены!";
      summary.style.background = "#dcfce7";
    } else {
      summary.innerHTML = `⚠️ Установлено ${installedCount} из ${selectedAppsData.length} программ`;
      summary.style.background = "#fef3c7";
    }

    // Добавляем кнопку закрытия
    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn-primary";
    closeBtn.style.marginTop = "16px";
    closeBtn.style.width = "100%";
    closeBtn.textContent = "Закрыть";
    closeBtn.onclick = () => modal.remove();
    modal.querySelector(".modal-content").appendChild(closeBtn);

    showNotification(
      "success",
      "Установка завершена",
      `Установлено ${installedCount} программ`,
    );
  }, 500);
};

// Загружаем программы при переключении на таб
const programsTab = document.querySelector('[data-tab="programs"]');
if (programsTab) {
  programsTab.addEventListener("click", () => {
    if (!appsList) {
      loadProgramsTab();
    }
  });
}

// Предзагрузка при старте
setTimeout(loadProgramsTab, 1000);

function updateDefenderStatus(isEnabled) {
  const statusText = document.getElementById("statusText");
  const enableBtn = document.getElementById("enableDefenderBtn");
  const disableBtn = document.getElementById("disableDefenderMenuBtn");

  if (isEnabled) {
    statusText.textContent = "Активен";
    statusText.style.color = "#10b981";
    enableBtn.disabled = true;
    enableBtn.style.opacity = "0.5";
    disableBtn.disabled = false;
    disableBtn.style.opacity = "1";
  } else {
    statusText.textContent = "Отключен";
    statusText.style.color = "#ef4444";
    enableBtn.disabled = false;
    enableBtn.style.opacity = "1";
    disableBtn.disabled = true;
    disableBtn.style.opacity = "0.5";
  }
}

// Включение защитника
enableDefenderBtn.addEventListener("click", async () => {
  progressContainer.classList.add("active");

  try {
    updateProgress(20, "Включение защитника...");
    await window.electronAPI.runCommand(
      'powershell -Command "Set-MpPreference -DisableRealtimeMonitoring $false"',
    );

    updateProgress(100, "Защитник включен!");

    setTimeout(() => {
      progressContainer.classList.remove("active");
      progressFill.style.width = "0%";
      updateDefenderStatus(true);
      showNotification(
        "success",
        "Защитник включен",
        "Защита в реальном времени активирована",
      );
    }, 1000);
  } catch (error) {
    progressContainer.classList.remove("active");
    showNotification("error", "Ошибка", "Не удалось включить защитник");
  }
});

// Отключение защитника
disableDefenderMenuBtn.addEventListener("click", async () => {
  progressContainer.classList.add("active");

  try {
    updateProgress(20, "Отключение защитника...");
    await window.electronAPI.disableDefender();

    updateProgress(100, "Защитник отключен!");

    setTimeout(() => {
      progressContainer.classList.remove("active");
      progressFill.style.width = "0%";
      updateDefenderStatus(false);
      showNotification(
        "success",
        "Защитник отключен",
        "Защита в реальном времени деактивирована",
      );
    }, 1000);
  } catch (error) {
    progressContainer.classList.remove("active");
    showNotification("error", "Ошибка", "Не удалось отключить защитник");
  }
});

// Открытие модального окна Windows
activateBtn.addEventListener("click", () => {
  windowsModal.classList.add("active");
  selectedVersion = null;
  confirmActivationBtn.disabled = true;

  // Убираем выделение со всех опций
  document.querySelectorAll(".version-option").forEach((opt) => {
    opt.classList.remove("selected");
  });
});

// Закрытие модального окна Windows
window.closeWindowsModal = () => {
  windowsModal.classList.remove("active");
};

// Выбор версии Windows
document.querySelectorAll(".version-option").forEach((option) => {
  option.addEventListener("click", () => {
    document.querySelectorAll(".version-option").forEach((opt) => {
      opt.classList.remove("selected");
    });
    option.classList.add("selected");
    selectedVersion = option.dataset.version;
    confirmActivationBtn.disabled = false;
  });
});

// Открытие модального окна удаления ключа
removeKeyBtn.addEventListener("click", () => {
  removeKeyModal.classList.add("active");
});

// Закрытие модального окна удаления
window.closeRemoveKeyModal = () => {
  removeKeyModal.classList.remove("active");
};

// Закрытие модалок по клику вне окна
[windowsModal, removeKeyModal].forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });
});

// Функция обновления прогресс-бара
function updateProgress(percent, text) {
  progressFill.style.width = percent + "%";
  progressText.textContent = text;
}

// Функция показа уведомлений
function showNotification(type, title, message) {
  const notification = document.getElementById("notification");
  const icon = document.getElementById("notificationIcon");
  const titleEl = document.getElementById("notificationTitle");
  const messageEl = document.getElementById("notificationMessage");

  notification.className = "notification " + type;

  if (type === "success") {
    icon.textContent = "✅";
  } else if (type === "error") {
    icon.textContent = "❌";
  } else {
    icon.textContent = "ℹ️";
  }

  titleEl.textContent = title;
  messageEl.textContent = message;

  notification.classList.add("show");

  setTimeout(() => {
    notification.classList.remove("show");
  }, 5000);
}

// Активация Windows
confirmActivationBtn.addEventListener("click", async () => {
  if (!selectedVersion) return;

  windowsModal.classList.remove("active");
  progressContainer.classList.add("active");

  try {
    updateProgress(20, "Подготовка к активации...");
    await new Promise((resolve) => setTimeout(resolve, 500));

    const key = WINDOWS_KEYS[selectedVersion];

    updateProgress(40, "Установка лицензионного ключа...");
    await window.electronAPI.runCommand(`slmgr /ipk ${key}`);

    updateProgress(60, "Ключ установлен. Активация...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await window.electronAPI.runCommand("slmgr /skms kms.digiboy.ir");

    updateProgress(80, "Активация Windows...");
    await window.electronAPI.runCommand("slmgr /ato");

    updateProgress(100, "Активация завершена!");

    setTimeout(() => {
      progressContainer.classList.remove("active");
      progressFill.style.width = "0%";
      showNotification(
        "success",
        "Активация успешна!",
        `Windows ${selectedVersion} успешно активирован`,
      );
    }, 1000);
  } catch (error) {
    progressContainer.classList.remove("active");
    progressFill.style.width = "0%";
    showNotification(
      "error",
      "Ошибка активации",
      error.message || "Не удалось активировать Windows",
    );
  }
});

// Удаление ключа Windows
confirmRemoveKeyBtn.addEventListener("click", async () => {
  removeKeyModal.classList.remove("active");
  progressContainer.classList.add("active");

  try {
    updateProgress(30, "Подготовка к удалению ключа...");
    await new Promise((resolve) => setTimeout(resolve, 500));

    updateProgress(60, "Удаление ключа активации...");
    await window.electronAPI.runCommand("slmgr /upk");

    updateProgress(100, "Ключ удален");

    setTimeout(() => {
      progressContainer.classList.remove("active");
      progressFill.style.width = "0%";
      showNotification(
        "success",
        "Ключ удален",
        "Ключ активации Windows успешно удален",
      );
    }, 1000);
  } catch (error) {
    progressContainer.classList.remove("active");
    progressFill.style.width = "0%";
    showNotification(
      "error",
      "Ошибка",
      error.message || "Не удалось удалить ключ",
    );
  }
});

// Глобальная функция для уведомлений из других мест
window.showNotification = showNotification;
window.updateDiskInfo = updateDiskInfo;
