const disableBtn = document.getElementById("disableDefenderBtn");
const statusLog = document.getElementById("statusLog");
const progressContainer = document.getElementById("progressContainer");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const shieldIcon = document.getElementById("shieldIcon");
const mainTitle = document.getElementById("mainTitle");
const subtitle = document.getElementById("subtitle");
const warningBox = document.getElementById("warningBox");
const warningTitle = document.getElementById("warningTitle");
const warningText = document.getElementById("warningText");
const buttonGroup = document.getElementById("buttonGroup");
document.getElementById("minimizeBtn").addEventListener("click", () => {
  window.electronAPI.minimizeWindow();
});

document.getElementById("closeBtn").addEventListener("click", () => {
  window.electronAPI.closeWindow();
});
function updateProgress(percent, text) {
  progressFill.style.width = percent + "%";
  progressText.textContent = text;
}

function showStatus(message, type = "loading") {
  statusLog.classList.add("show");

  const icons = {
    loading: '<span class="loader"></span>',
    success: '<span class="success-icon">✅</span>',
    error: '<span class="error-icon">❌</span>',
    warning: '<span class="error-icon">⚠️</span>',
  };

  statusLog.innerHTML = `
    <div class="status-message">
      ${icons[type]}
      <span>${message}</span>
    </div>
  `;
}

async function disableDefender() {
  console.log("Начинаем отключение защитника...");

  // Скрываем кнопки и показываем прогресс
  buttonGroup.style.display = "none";
  progressContainer.classList.add("show");
  statusLog.classList.remove("show");

  updateProgress(10, "Подготовка к отключению защитника...");
  await new Promise((resolve) => setTimeout(resolve, 500));

  updateProgress(30, "Изменение настроек Windows Defender...");

  try {
    console.log("Вызываем disable-defender...");
    const result = await window.electronAPI.disableDefender();
    console.log("Результат отключения:", result);

    updateProgress(60, "Отключение мониторинга в реальном времени...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    updateProgress(80, "Применение изменений...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    updateProgress(90, "Проверка статуса...");

    // Проверяем статус
    let defenderStatus = await window.electronAPI.checkDefender();
    console.log("Статус защитника (первая проверка):", defenderStatus);

    if (defenderStatus) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      defenderStatus = await window.electronAPI.checkDefender();
      console.log("Статус защитника (вторая проверка):", defenderStatus);
    }

    if (!defenderStatus) {
      // Успех!
      progressFill.style.background =
        "linear-gradient(90deg, #48bb78 0%, #38a169 100%)";
      updateProgress(100, "Защитник успешно отключен!");

      shieldIcon.classList.add("success");
      shieldIcon.querySelector("span").textContent = "✅";
      mainTitle.textContent = "Защитник отключен";
      subtitle.textContent = "Успешно";
      warningBox.classList.add("success");
      warningTitle.innerHTML = "<span>✅</span><span>Готово</span>";
      warningText.textContent =
        "Защитник Windows успешно отключен. Программа готова к работе.";

      showStatus(
        "Защитник успешно отключен! Переход в главное меню...",
        "success",
      );

      setTimeout(() => {
        window.electronAPI.navigate("menu.html");
      }, 2000);
    } else {
      // Не удалось отключить
      progressContainer.classList.remove("show");
      buttonGroup.style.display = "flex";
      showStatus(
        "⚠️ Защитник все еще активен. Попробуйте отключить его вручную.",
        "warning",
      );

      disableBtn.disabled = false;
    }
  } catch (error) {
    console.error("Ошибка отключения:", error);
    progressContainer.classList.remove("show");
    buttonGroup.style.display = "flex";
    showStatus(
      "⚠️ Не удалось отключить защитник. Запустите программу от имени администратора.",
      "warning",
    );

    disableBtn.disabled = false;
  }
}

disableBtn.addEventListener("click", async () => {
  console.log("Кнопка отключения нажата");
  disableBtn.disabled = true;

  await disableDefender();
});

// Проверяем права при загрузке
window.addEventListener("load", async () => {
  console.log("Страница загружена");
  try {
    const sysInfo = await window.electronAPI.getSystemInfo();
    if (!sysInfo.isAdmin) {
      showStatus("⚠️ Программа запущена без прав администратора.", "warning");
    }
  } catch (err) {
    console.error("Ошибка проверки прав:", err);
  }
});
