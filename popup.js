"use strict";

const enabledInput = document.getElementById("enabled");
const statusLabel = document.getElementById("status");

function render(enabled) {
  enabledInput.checked = enabled;
  statusLabel.textContent = enabled ? "включено" : "выключено";
}

chrome.storage.local.get({ enabled: true }).then(({ enabled }) => {
  render(enabled !== false);
  enabledInput.disabled = false;
}).catch(() => {
  statusLabel.textContent = "не удалось загрузить настройку";
});

enabledInput.addEventListener("change", async () => {
  const enabled = enabledInput.checked;
  enabledInput.disabled = true;
  try {
    await chrome.storage.local.set({ enabled });
    render(enabled);
  } catch {
    enabledInput.checked = !enabled;
    statusLabel.textContent = "не удалось сохранить настройку";
  } finally {
    enabledInput.disabled = false;
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.enabled) render(changes.enabled.newValue !== false);
});
