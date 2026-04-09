const { dialog, shell, app } = require("electron");
const https = require("https");

function checkForUpdates() {
  const currentVersion = app.getVersion();

  const options = {
    hostname: "api.github.com",
    path: "/repos/kiryxawxmx/kiryxawxmx-updater/releases/latest",
    method: "GET",
    headers: {
      "User-Agent": "kiryxawxmx-updater/1.0.0",
      Accept: "application/vnd.github.v3+json",
    },
  };

  const req = https.get(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const release = JSON.parse(data);
        const latestVersion = release.tag_name.replace("v", "");

        if (latestVersion > currentVersion) {
          dialog
            .showMessageBox({
              type: "info",
              title: "Доступно обновление",
              message: `Новая версия ${latestVersion} доступна!\n\nТекущая версия: ${currentVersion}\n\nОткрыть страницу загрузки?`,
              buttons: ["Да, открыть", "Позже"],
              defaultId: 0,
            })
            .then((result) => {
              if (result.response === 0) {
                shell.openExternal(
                  "https://github.com/kiryxawxmx/kiryxawxmx-updater/releases/latest",
                );
              }
            });
        } else {
          dialog.showMessageBox({
            type: "info",
            title: "Обновлений нет",
            message: `У вас установлена последняя версия (${currentVersion})`,
            buttons: ["OK"],
          });
        }
      } catch (e) {
        console.error("Ошибка парсинга:", e);
        dialog.showErrorBox("Ошибка", "Не удалось проверить обновления");
      }
    });
  });

  req.on("error", (err) => {
    console.error("Ошибка запроса:", err);
    dialog.showErrorBox(
      "Ошибка",
      "Не удалось подключиться к серверу обновлений",
    );
  });

  req.end();
}

module.exports = { checkForUpdates };
