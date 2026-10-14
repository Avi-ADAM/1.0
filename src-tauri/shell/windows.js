// Local Windows bootstrap only. No IPC, no credentials, no website changes.
export async function canReachSite({ online = navigator.onLine, fetchFn = fetch, timeout = 5000 } = {}) {
  if (!online) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    await fetchFn(`https://www.1lev1.com/favicon.ico?desktop-probe=${Date.now()}`, {
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal
    });
    // An opaque no-cors response has status 0: receiving it is the success signal.
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function mountShell({ document, navigator, window, fetchFn = fetch }) {
  const retry = document.getElementById('retry');
  const status = document.getElementById('status');
  let pending = false;
  async function connect() {
    if (pending) return;
    pending = true;
    retry.disabled = true;
    status.textContent = 'בודקים את החיבור…';
    const reachable = await canReachSite({ online: navigator.onLine, fetchFn });
    if (reachable) window.location.replace('https://www.1lev1.com/');
    else status.textContent = 'לא הצלחנו לטעון את 1לב1. בדקו את החיבור ונסו שוב.';
    pending = false;
    retry.disabled = false;
  }
  retry.addEventListener('click', connect);
  window.addEventListener('online', connect);
  void connect();
  return connect;
}

if (typeof document !== 'undefined') mountShell({ document, navigator, window });
