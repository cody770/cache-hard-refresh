function show(enabled, useSettingsInsteadOfPreferences) {
    if (useSettingsInsteadOfPreferences) {
        document.getElementsByClassName('open-preferences')[0].innerText = "Quit and Open Safari Settings…";
    }

    if (typeof enabled === "boolean") {
        document.body.classList.toggle('state-on', enabled);
        document.body.classList.toggle('state-off', !enabled);
    } else {
        document.body.classList.remove('state-on');
        document.body.classList.remove('state-off');
    }
}

function openPreferences() {
    webkit.messageHandlers.controller.postMessage("open-preferences");
}

document.querySelector("button.open-preferences").addEventListener("click", openPreferences);

document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-external]");
    if (!a) return;
    e.preventDefault();
    webkit.messageHandlers.controller.postMessage("open-url:" + a.href);
});
