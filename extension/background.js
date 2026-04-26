const api = typeof browser !== "undefined" ? browser : chrome;

const pendingByTab = new Map();

api.action.onClicked.addListener(async (tab) => {
  if (!tab || tab.id == null) return;

  const t0 = Date.now();
  const result = {
    host: null,
    ok: false,
    error: null,
    elapsedMs: 0,
    cleared: {
      localStorage: 0,
      sessionStorage: 0,
      caches: 0,
      serviceWorkers: 0,
      indexedDB: 0,
      cookies: 0,
    },
  };

  let urlObj = null;
  try { urlObj = new URL(tab.url || ""); } catch { /* leave null */ }

  if (!urlObj || (urlObj.protocol !== "https:" && urlObj.protocol !== "http:")) {
    result.error = "Can't act on " + (urlObj ? urlObj.protocol : "this page") + " (http/https only).";
    result.host = urlObj ? urlObj.hostname : (tab.url || null);
    pendingByTab.set(tab.id, result);
    try { await api.scripting.executeScript({ target: { tabId: tab.id }, func: renderToast, args: [result] }); }
    catch (_) { /* page may block injection too */ }
    pendingByTab.delete(tab.id);
    return;
  }

  result.host = urlObj.hostname;

  try {
    const out = await api.scripting.executeScript({
      target: { tabId: tab.id },
      func: clearOriginData,
    });
    const r = out && out[0] && out[0].result;
    if (r) {
      result.ok = true;
      Object.assign(result.cleared, r.cleared);
    } else {
      result.error = "Could not run on this page.";
    }
  } catch (err) {
    result.error = String((err && err.message) || err);
  }

  try {
    const cookies = await api.cookies.getAll({ url: tab.url });
    for (const cookie of cookies) {
      const scheme = cookie.secure ? "https://" : (urlObj.protocol + "//");
      const cookieUrl =
        scheme +
        cookie.domain.replace(/^\./, "") +
        (cookie.path || "/");
      try {
        const removed = await api.cookies.remove({
          url: cookieUrl,
          name: cookie.name,
          storeId: cookie.storeId,
        });
        if (removed) result.cleared.cookies++;
      } catch (_) { /* per-cookie failure — skip */ }
    }
  } catch (err) {
    if (!result.error) result.error = "Cookies API: " + String((err && err.message) || err);
  }

  result.elapsedMs = Date.now() - t0;
  pendingByTab.set(tab.id, result);

  try {
    await api.tabs.reload(tab.id, { bypassCache: true });
  } catch (err) {
    pendingByTab.delete(tab.id);
    console.error("tabs.reload failed:", err);
  }
});

api.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== "complete") return;
  const stats = pendingByTab.get(tabId);
  if (!stats) return;
  pendingByTab.delete(tabId);

  try {
    await api.scripting.executeScript({
      target: { tabId },
      func: renderToast,
      args: [stats],
    });
  } catch (err) {
    console.error("toast injection failed:", err);
  }
});

async function clearOriginData() {
  const safeAsync = async (fn, fallback) => {
    try { return await fn(); } catch { return fallback; }
  };
  const safeSync = (fn, fallback) => {
    try { return fn(); } catch { return fallback; }
  };

  const cleared = {
    localStorage: 0,
    sessionStorage: 0,
    caches: 0,
    serviceWorkers: 0,
    indexedDB: 0,
    cookies: 0,
  };

  cleared.localStorage = safeSync(() => localStorage.length, 0);
  safeSync(() => localStorage.clear());

  cleared.sessionStorage = safeSync(() => sessionStorage.length, 0);
  safeSync(() => sessionStorage.clear());

  const cacheNames = await safeAsync(
    async () => (typeof caches !== "undefined" ? await caches.keys() : []),
    []
  );
  for (const name of cacheNames) {
    if (await safeAsync(() => caches.delete(name), false)) cleared.caches++;
  }

  const swRegs = await safeAsync(
    async () => (navigator.serviceWorker ? await navigator.serviceWorker.getRegistrations() : []),
    []
  );
  for (const reg of swRegs) {
    if (await safeAsync(() => reg.unregister(), false)) cleared.serviceWorkers++;
  }

  const idbNames = await safeAsync(
    async () => (indexedDB.databases ? (await indexedDB.databases()).map(d => d.name).filter(Boolean) : []),
    []
  );
  for (const name of idbNames) {
    const ok = await new Promise((resolve) => {
      try {
        const req = indexedDB.deleteDatabase(name);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
        req.onblocked = () => resolve(false);
      } catch { resolve(false); }
    });
    if (ok) cleared.indexedDB++;
  }

  return { cleared };
}

function renderToast(s) {
  const HOST_ID = "__cache_clear_hard_refresh_toast__";
  const existing = document.getElementById(HOST_ID);
  if (existing) existing.remove();

  const host = document.createElement("div");
  host.id = HOST_ID;
  const root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    .toast {
      position: fixed; top: 16px; right: 16px;
      background: rgba(20,20,22,.95); color: #fff;
      font: 13px/1.45 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
      padding: 12px 14px; border-radius: 10px;
      box-shadow: 0 12px 32px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      z-index: 2147483647; max-width: 340px;
      cursor: pointer; user-select: none;
      animation: slide-in .22s cubic-bezier(.2,.7,.3,1);
    }
    .title { font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
    .ok  { background: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,.18); }
    .err { background: #f87171; box-shadow: 0 0 0 3px rgba(248,113,113,.18); }
    .row { display: flex; justify-content: space-between; gap: 16px; padding: 1px 0; }
    .row span:first-child { opacity: .65; }
    .row span:last-child { font-variant-numeric: tabular-nums; }
    .total { padding: 4px 0; font-weight: 600; border-top: 1px solid rgba(255,255,255,.08); border-bottom: 1px solid rgba(255,255,255,.08); margin: 4px 0; }
    .total span:first-child { opacity: .9; }
    .muted { opacity: .55; font-size: 11px; margin-top: 8px; line-height: 1.35; }
    @keyframes slide-in  { from { transform: translateX(24px); opacity: 0 } to { transform: none; opacity: 1 } }
    @keyframes slide-out { to   { transform: translateX(24px); opacity: 0 } }
    .leaving { animation: slide-out .2s ease-in forwards; }
  `;

  const c = s.cleared || {};
  const total = (c.localStorage|0) + (c.sessionStorage|0) + (c.caches|0) +
                (c.serviceWorkers|0) + (c.indexedDB|0) + (c.cookies|0);

  const titleText = s.ok
    ? (total > 0 ? "Site data cleared, hard reloaded" : "Nothing to clear, hard reloaded")
    : "Clear failed";
  const dotClass = s.ok ? "ok" : "err";

  const escape = (str) => String(str).replace(/[&<>"']/g, ch => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));

  const wrap = document.createElement("div");
  wrap.className = "toast";

  const breakdown = s.ok ? `
    <div class="row"><span>localStorage keys</span><span>${c.localStorage}</span></div>
    <div class="row"><span>sessionStorage keys</span><span>${c.sessionStorage}</span></div>
    <div class="row"><span>Cache Storage entries</span><span>${c.caches}</span></div>
    <div class="row"><span>Service workers</span><span>${c.serviceWorkers}</span></div>
    <div class="row"><span>IndexedDB databases</span><span>${c.indexedDB}</span></div>
    <div class="row"><span>Cookies (incl. HttpOnly)</span><span>${c.cookies}</span></div>
  ` : "";

  wrap.innerHTML = `
    <div class="title"><span class="dot ${dotClass}"></span><span>${escape(titleText)}</span></div>
    ${s.host  ? `<div class="row"><span>Host</span><span>${escape(s.host)}</span></div>` : ""}
    ${s.error ? `<div class="row"><span>Error</span><span>${escape(s.error)}</span></div>` : ""}
    ${s.ok    ? `<div class="row total"><span>Items cleared</span><span>${total}</span></div>` : ""}
    ${breakdown}
    <div class="row"><span>Time</span><span>${s.elapsedMs} ms</span></div>
    <div class="muted">Per-origin clear (http/https). Bypass-cache reload busts Safari's HTTP cache for this load.</div>
  `;

  const dismiss = () => {
    wrap.classList.add("leaving");
    setTimeout(() => host.remove(), 220);
  };
  wrap.addEventListener("click", dismiss);

  root.appendChild(style);
  root.appendChild(wrap);
  (document.body || document.documentElement).appendChild(host);

  setTimeout(dismiss, 6000);
}
