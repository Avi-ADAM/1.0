/**
 * YouTube embeds without YouTube's own captions.
 *
 * Our videos carry their subtitles burned into the picture, so a caption track YouTube
 * turns on (the viewer's account preference, or auto-generated captions) shows the same
 * words twice. `cc_load_policy=0` alone does not stop that: YouTube still honours the
 * viewer's preference. So every embed also gets `enablejsapi=1`, and `noCaptions` tells
 * the player over postMessage to unload its captions module — once when it is ready and
 * again when playback starts, since the module is (re)loaded with the video.
 */

const ORIGIN = 'https://www.youtube-nocookie.com';

/**
 * @param {string} id
 * @param {Record<string, string | number>} [params] extra player parameters
 */
export function youtubeEmbedSrc(id, params = {}) {
  const q = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    cc_load_policy: '0',
    iv_load_policy: '3',
    enablejsapi: '1',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  });
  // No `origin` param: it differs between SSR and the browser, and commands work without it.
  return `${ORIGIN}/embed/${id}?${q}`;
}

/**
 * Svelte action for a YouTube `<iframe>`: keeps YouTube's caption track off.
 * @param {HTMLIFrameElement} iframe
 */
export function noCaptions(iframe) {
  const playerId = `yt-${Math.random().toString(36).slice(2)}`;

  /** @param {object} msg */
  const post = (msg) =>
    iframe.contentWindow?.postMessage(JSON.stringify({ ...msg, id: playerId, channel: 'widget' }), '*');
  const unload = () => {
    post({ event: 'command', func: 'unloadModule', args: ['captions'] });
    post({ event: 'command', func: 'unloadModule', args: ['cc'] });
  };

  /** @param {MessageEvent} e */
  function onMessage(e) {
    if (e.source !== iframe.contentWindow || !/youtube/.test(e.origin)) return;
    let data;
    try {
      data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    } catch {
      return;
    }
    if (data?.event === 'onReady') unload();
    // 1 = playing, 3 = buffering: the captions module comes back with the video.
    const state = data?.event === 'onStateChange' ? data.info : data?.info?.playerState;
    if (state === 1 || state === 3) unload();
  }

  // The player only reports back once it is told someone is listening.
  const onLoad = () => post({ event: 'listening' });

  window.addEventListener('message', onMessage);
  iframe.addEventListener('load', onLoad);
  return {
    destroy() {
      window.removeEventListener('message', onMessage);
      iframe.removeEventListener('load', onLoad);
    }
  };
}
