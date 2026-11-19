// src/lib/server/mcp/apps/timerApp.ts
//
// The running-timer view an MCP host (claude.ai, the Claude app, ChatGPT, VS
// Code…) draws inside the conversation when getActiveTimersTool or
// timerActionTool answers. MCP Apps extension, SEP-1865 — see
// docs/inprogress/PLAN_MCP_APPS.md.
//
// One self-contained HTML page: no external script, style or font, so it runs
// under the host's default CSP with no `connectDomains` / `resourceDomains`.
// It never talks to 1lev1 itself — every read and every stop goes back through
// the host as a `tools/call` to this same MCP server, so the guard (key scope,
// membership, rate limit, audit) sees a click in the view exactly as it sees a
// call from the model.
//
// Words: the view renders inside the host's iframe, where `$t()` cannot reach,
// so it carries the recipient's strings — one locale, picked server-side from
// the request's resolved language (`ctx.lang`). Same shape as the notification
// payloads that are indexed by the recipient's language.
//
// Member text (mission and rikma names) is data: it is only ever assigned with
// `textContent`, never parsed as HTML.

import type { McpLang } from '../lang';

export const TIMER_APP_URI = 'ui://1lev1/timer.html';

/** Where "open on 1lev1" points: the member's own timers page. */
export const TIMERS_PAGE_URL = 'https://www.1lev1.com/timers';

/** The MCP-Apps protocol version this view speaks (ext-apps LATEST_PROTOCOL_VERSION). */
export const MCP_APPS_PROTOCOL_VERSION = '2026-01-26';

export interface TimerAppStrings {
  title: string;
  loading: string;
  none: string;
  stop: string;
  stopping: string;
  /** `{{minutes}}` is substituted in the view. */
  stopped: string;
  refresh: string;
  open: string;
  error: string;
  session: string;
}

export const TIMER_APP_STRINGS: Record<McpLang, TimerAppStrings> = {
  he: {
    title: 'טיימרים פעילים',
    loading: 'טוען…',
    none: 'אין טיימר פעיל כרגע.',
    stop: 'עצירה',
    stopping: 'עוצר…',
    stopped: 'נעצר — נרשמו {{minutes}} דקות',
    refresh: 'רענון',
    open: 'פתיחה ב-1lev1',
    error: 'לא הצלחנו להגיע ל-1lev1. נסו שוב.',
    session: 'הסשן הזה'
  },
  en: {
    title: 'Running timers',
    loading: 'Loading…',
    none: 'No timer is running right now.',
    stop: 'Stop',
    stopping: 'Stopping…',
    stopped: 'Stopped — {{minutes}} min logged',
    refresh: 'Refresh',
    open: 'Open on 1lev1',
    error: 'Could not reach 1lev1. Try again.',
    session: 'This session'
  },
  ar: {
    title: 'المؤقتات الجارية',
    loading: 'جارٍ التحميل…',
    none: 'لا يوجد مؤقت يعمل الآن.',
    stop: 'إيقاف',
    stopping: 'جارٍ الإيقاف…',
    stopped: 'توقّف — سُجّلت {{minutes}} دقيقة',
    refresh: 'تحديث',
    open: 'فتح في 1lev1',
    error: 'تعذّر الوصول إلى 1lev1. حاول مرة أخرى.',
    session: 'هذه الجلسة'
  },
  ru: {
    title: 'Запущенные таймеры',
    loading: 'Загрузка…',
    none: 'Сейчас ни один таймер не запущен.',
    stop: 'Остановить',
    stopping: 'Останавливаю…',
    stopped: 'Остановлено — записано {{minutes}} мин',
    refresh: 'Обновить',
    open: 'Открыть в 1lev1',
    error: 'Не удалось связаться с 1lev1. Попробуйте ещё раз.',
    session: 'Эта сессия'
  },
  es: {
    title: 'Temporizadores activos',
    loading: 'Cargando…',
    none: 'Ahora no hay ningún temporizador en marcha.',
    stop: 'Detener',
    stopping: 'Deteniendo…',
    stopped: 'Detenido — {{minutes}} min registrados',
    refresh: 'Actualizar',
    open: 'Abrir en 1lev1',
    error: 'No se pudo conectar con 1lev1. Inténtalo de nuevo.',
    session: 'Esta sesión'
  }
};

const RTL: ReadonlySet<string> = new Set(['he', 'ar']);

/** JSON that is safe inside a <script> element (no `</script>`, no `<!--`). */
function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** The whole view for one language. Pure — tested in timerApp.test.ts. */
export function timerAppHtml(lang: string | undefined): string {
  const l = (lang && lang in TIMER_APP_STRINGS ? lang : 'en') as McpLang;
  const config = {
    s: TIMER_APP_STRINGS[l],
    lang: l,
    timersUrl: TIMERS_PAGE_URL,
    protocolVersion: MCP_APPS_PROTOCOL_VERSION
  };
  const dir = RTL.has(l) ? 'rtl' : 'ltr';

  return `<!doctype html>
<html lang="${l}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>1lev1</title>
<style>
:root {
  color-scheme: light dark;
  --bg: var(--color-background-primary, #ffffff);
  --card: var(--color-background-secondary, #f6f5f2);
  --fg: var(--color-text-primary, #1d1d1b);
  --muted: var(--color-text-secondary, #6b6a66);
  --line: var(--color-border-primary, #e3e1db);
  --accent: #b4234a;
  --accent-fg: #ffffff;
  --ok: #2f7a4b;
  --font: var(--font-sans, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Hebrew", "Noto Sans Arabic", sans-serif);
}
:root[data-theme="dark"] {
  --bg: var(--color-background-primary, #1f1e1c);
  --card: var(--color-background-secondary, #2a2926);
  --fg: var(--color-text-primary, #f2f1ed);
  --muted: var(--color-text-secondary, #a6a49d);
  --line: var(--color-border-primary, #3a3935);
  --accent: #e0577c;
  --ok: #6cc28c;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--fg); font-family: var(--font); }
body { padding: 12px; font-size: 14px; line-height: 1.4; }
header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
h1 { font-size: 15px; font-weight: 600; margin: 0; }
.links { display: flex; gap: 6px; }
button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid var(--line); background: transparent; color: var(--fg); padding: 5px 10px; }
button:disabled { opacity: .55; cursor: default; }
button.stop { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); font-weight: 600; min-width: 84px; }
ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
li { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; display: flex; align-items: center; gap: 12px; }
.dot { width: 9px; height: 9px; border-radius: 50%; background: var(--accent); flex: none; animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .3; } }
@media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
.what { flex: 1; min-width: 0; }
.mission { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rikma { color: var(--muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.clock { font-variant-numeric: tabular-nums; font-size: 20px; font-weight: 600; direction: ltr; unicode-bidi: isolate; }
.note { color: var(--muted); padding: 6px 2px; }
p:empty { display: none; }
.flash { margin-top: 8px; color: var(--ok); }
.flash.err { color: var(--accent); }
</style>
</head>
<body>
<header>
  <h1 id="title"></h1>
  <div class="links">
    <button id="refresh" type="button"></button>
    <button id="open" type="button"></button>
  </div>
</header>
<ul id="list" aria-live="polite"></ul>
<p id="note" class="note"></p>
<p id="flash" class="flash" role="status"></p>
<script>
(function () {
  "use strict";
  var C = ${scriptJson(config)};
  var S = C.s;
  var $ = function (id) { return document.getElementById(id); };
  var timers = [];
  var busy = {};

  $("title").textContent = S.title;
  $("refresh").textContent = S.refresh;
  $("open").textContent = S.open;
  $("note").textContent = S.loading;

  // --- JSON-RPC over postMessage (MCP Apps, SEP-1865) ---------------------
  var nextId = 0;
  var pending = {};
  function send(msg) { window.parent.postMessage(msg, "*"); }
  function request(method, params) {
    var id = ++nextId;
    send({ jsonrpc: "2.0", id: id, method: method, params: params || {} });
    return new Promise(function (resolve, reject) {
      pending[id] = { resolve: resolve, reject: reject };
      setTimeout(function () {
        if (pending[id]) { delete pending[id]; reject(new Error("timeout")); }
      }, 30000);
    });
  }
  function notify(method, params) { send({ jsonrpc: "2.0", method: method, params: params || {} }); }

  window.addEventListener("message", function (e) {
    if (e.source !== window.parent) return;
    var m = e.data;
    if (!m || m.jsonrpc !== "2.0") return;
    if (m.method === undefined && m.id !== undefined && pending[m.id]) {
      var p = pending[m.id]; delete pending[m.id];
      if (m.error) p.reject(m.error); else p.resolve(m.result);
      return;
    }
    if (m.method === "ui/notifications/tool-result") { onToolResult(m.params); return; }
    if (m.method === "ui/notifications/host-context-changed") { applyContext(m.params); return; }
    if (m.id !== undefined && m.method) {
      // ping, ui/resource-teardown — nothing to clean up, answer empty.
      if (m.method === "ping" || m.method === "ui/resource-teardown") send({ jsonrpc: "2.0", id: m.id, result: {} });
      else send({ jsonrpc: "2.0", id: m.id, error: { code: -32601, message: "Method not found" } });
    }
  });

  function applyContext(ctx) {
    if (!ctx) return;
    if (ctx.theme) document.documentElement.setAttribute("data-theme", ctx.theme);
    var vars = ctx.styles && ctx.styles.variables;
    if (vars) for (var k in vars) if (vars[k]) document.documentElement.style.setProperty(k, vars[k]);
  }

  /** A CallToolResult's payload: structuredContent, else the JSON text block. */
  function payload(r) {
    if (!r) return null;
    if (r.structuredContent && typeof r.structuredContent === "object") return r.structuredContent;
    var blocks = r.content || [];
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i] && blocks[i].type === "text") {
        try { return JSON.parse(blocks[i].text); } catch (_) { return null; }
      }
    }
    return null;
  }

  function callTool(name, args) {
    return request("tools/call", { name: name, arguments: args || {} }).then(function (r) {
      if (r && r.isError) throw new Error("tool error");
      return payload(r);
    });
  }

  // --- view ---------------------------------------------------------------
  function sessionStartMs(t) {
    var raw = t.sessionStart || t.startTime;
    var ms = raw ? Date.parse(raw) : NaN;
    return isNaN(ms) ? null : ms;
  }
  function clock(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h + ":" + (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function render() {
    var list = $("list");
    list.textContent = "";
    $("note").textContent = timers.length ? "" : S.none;
    timers.forEach(function (t) {
      var li = document.createElement("li");
      var dot = document.createElement("span"); dot.className = "dot"; dot.setAttribute("aria-hidden", "true");
      var what = document.createElement("div"); what.className = "what";
      var mission = document.createElement("div"); mission.className = "mission"; mission.textContent = t.missionName || "";
      var rikma = document.createElement("div"); rikma.className = "rikma"; rikma.textContent = t.projectName || "";
      what.appendChild(mission); what.appendChild(rikma);
      var c = document.createElement("span"); c.className = "clock"; c.setAttribute("data-mission", String(t.missionId));
      c.title = S.session;
      var btn = document.createElement("button"); btn.type = "button"; btn.className = "stop";
      btn.textContent = busy[t.missionId] ? S.stopping : S.stop;
      btn.disabled = !!busy[t.missionId];
      btn.addEventListener("click", function () { stop(t); });
      li.appendChild(dot); li.appendChild(what); li.appendChild(c); li.appendChild(btn);
      list.appendChild(li);
    });
    tick();
    reportSize();
  }

  function tick() {
    var now = Date.now();
    timers.forEach(function (t) {
      var el = document.querySelector('.clock[data-mission="' + String(t.missionId).replace(/"/g, "") + '"]');
      var start = sessionStartMs(t);
      if (el) el.textContent = start === null ? "–:––:––" : clock(now - start);
    });
  }
  setInterval(tick, 1000);

  function flash(text, isErr) {
    var f = $("flash");
    f.textContent = text || "";
    f.className = "flash" + (isErr ? " err" : "");
    reportSize();
  }

  function show(p) {
    if (p && Array.isArray(p.timers)) { timers = p.timers; render(); return true; }
    return false;
  }

  function refresh() {
    $("refresh").disabled = true;
    return callTool("getActiveTimersTool", {})
      .then(function (p) { if (!show(p)) flash(S.error, true); })
      .catch(function () { flash(S.error, true); })
      .then(function () { $("refresh").disabled = false; });
  }

  function stop(t) {
    if (busy[t.missionId]) return;
    busy[t.missionId] = true; render(); flash("");
    callTool("timerActionTool", { action: "stop", missionId: String(t.missionId) })
      .then(function (p) {
        if (p && p.success) {
          var msg = S.stopped.replace("{{minutes}}", String(p.duration == null ? 0 : p.duration));
          flash(msg, false);
          // Tell the model what the member did in the view, so the next turn knows.
          request("ui/update-model-context", {
            content: [{ type: "text", text: (p.message || msg) + " (stopped from the 1lev1 timer view)" }]
          }).catch(function () {});
        } else {
          flash((p && p.message) || S.error, true);
        }
      })
      .catch(function () { flash(S.error, true); })
      .then(function () { delete busy[t.missionId]; return refresh(); });
  }

  function onToolResult(r) {
    // getActiveTimersTool answers with the list itself; timerActionTool (start or
    // stop from the chat) answers with what it did — read the live state then.
    if (!show(payload(r))) refresh();
  }

  $("refresh").addEventListener("click", refresh);
  $("open").addEventListener("click", function () {
    request("ui/open-link", { url: C.timersUrl }).catch(function () {});
  });

  var lastHeight = 0;
  function reportSize() {
    var h = Math.ceil(document.documentElement.scrollHeight);
    if (h !== lastHeight) { lastHeight = h; notify("ui/notifications/size-changed", { height: h }); }
  }
  if (window.ResizeObserver) new ResizeObserver(reportSize).observe(document.body);

  request("ui/initialize", {
    protocolVersion: C.protocolVersion,
    appInfo: { name: "1lev1-timer", version: "1.0.0" },
    appCapabilities: {}
  }).then(function (res) {
    applyContext(res && res.hostContext);
    notify("ui/notifications/initialized", {});
  }).catch(function () {
    notify("ui/notifications/initialized", {});
  });
  reportSize();
})();
</script>
</body>
</html>
`;
}
