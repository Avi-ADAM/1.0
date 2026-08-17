<script>
  /* const app = firebase()
  import { getMessaging, onMessage } from "firebase/messaging";

$: if(browser){
  const messaging = getMessaging(app);

onMessage(messaging, (payload) => {
  console.log('Message received. ', payload);
  // ...
});
}*/
  import '../app.postcss';
  import { Toaster } from 'svelte-sonner';
  import { lang, doesLang, langUs } from '$lib/stores/lang.js';
  import SucssesConf from '$lib/celim/sucssesConf.svelte';
  import { confettiStore } from '$lib/stores/confettiStore';
  // Importing the store also wires <html> class syncing and the
  // prefers-color-scheme listener on load. The classes themselves are already
  // on the element (server-stamped + the inline script in app.html); this
  // keeps them in step once the user changes a setting.
  import { setTheme } from '$lib/stores/theme';
  import { normalizeTheme, THEME_PARAM } from '$lib/theme/themeParam.js';
  import { onMount } from 'svelte';
  import { locale, isRtl, t } from '$lib/translations';
  import { goto } from '$app/navigation';
  import { navigating, page } from '$app/state';
  import { browser } from '$app/environment';
  import SessionExpiredBanner from '$lib/components/screens/SessionExpiredBanner.svelte';
  import MobileFooter from '$lib/components/footer/mobileFooter.svelte';
  import AccessibilityPanel from '$lib/components/a11y/AccessibilityPanel.svelte';
  // Importing the store wires the <html> classes for the saved display
  // preferences, the same way the theme store does above.
  import '$lib/stores/a11y.js';
  import { showFoot } from '$lib/stores/showFoot.js';
  import { Bot } from '$lib/components/bot';
  import { socketClient } from '$lib/stores/socketClient';
  import { patchUser } from '$lib/stores/userStore.js';
  import { toast } from 'svelte-sonner';
  import { addMes } from '$lib/stores/pendMisMes.js';
  import { forumStore } from '$lib/stores/forumStore';

  /**
   * @typedef {Object} Props
   * @property {any} data - import firebase from "$lib/func/firebase";
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { data, children } = $props();

  // The bottom bar, for the rest of the site.
  //
  // `(reg)` and `(regandnon)` mount it through `foot.svelte`, which also carries
  // the chat panel and the meeting drawer a signed-in member needs — that stays
  // where it is, so vaul/threlte/draggable never reach the landing page's
  // bundle. Every other route is in **no group at all** (`/`, `/about`, `/guid`,
  // `/deals`, `/chat`, …) and until now had no bar whatsoever. This mounts the
  // bar there, for members and guests alike.
  //
  // `page.route.id` keeps the group in the path (`/(reg)/lev`), which is the
  // only reliable way to ask "did a group layout already put a bar on screen?"
  // — matching on pathnames would drift the moment a route moves.
  const GROUPED = /^\/\((?:reg|regandnon)\)/;
  // Auth screens are the exception: they *are* the login/signup buttons, and a
  // bar offering the same two would only sit on top of the form.
  const AUTH_ROUTES =
    /^(?:\/(?:he|en|ar|ru|es))?\/(?:login|signup|confirm-email)(?:\/|$)/;
  let showBar = $derived(
    $showFoot &&
      !GROUPED.test(page.route.id ?? '') &&
      !AUTH_ROUTES.test(page.url.pathname)
  );

  // A `?theme=` link on a client-side navigation never reaches hooks.server.js,
  // so honour it here too. Only a recognised value acts: navigating away to a
  // plain address leaves the pinned look alone (the cookie is the memory), and
  // a later switch in the appearance menu is not undone — this reads the URL,
  // never the theme store, so it does not re-run when the theme changes.
  $effect(() => {
    const pinned = normalizeTheme(page.url.searchParams.get(THEME_PARAM));
    if (pinned) setTheme(pinned);
  });

  // Ensure locale and lang are synchronized
  $effect(() => {
    if (data?.lang) {
      console.log('Setting locale and lang from data.lang:', data.lang);
      // Sync both stores
      lang.set(data.lang);
      locale.set(data.lang);
      langUs.set(data.lang);
      doesLang.set(true);
    } else if (data && browser) {
      console.log('No data.lang, calling getLang()');
      getLang();
    }
  });

  function getLang() {
    console.log('getLang called with data:', data);
    let la;
    if (!data?.lang) {
      const fromSe = data?.userAgent;
      if ($doesLang == false) {
        if (fromSe?.includes('he')) {
          la = 'he';
        } else if (fromSe?.includes('ar')) {
          la = 'ar';
        } else {
          la = 'en';
        }
      } else {
        la = $langUs;
      }
    } else {
      la = data.lang;
    }
    // if (navigator.languages != undefined)
    //     return navigator.languages[0];
    // return navigator.language;

    // Sync all language stores
    lang.set(la);
    locale.set(la);
    langUs.set(la);
    doesLang.set(true);
    document.cookie =
      `lang=${la}; expires=` + new Date(2027, 0, 1).toUTCString();
  }

  onMount(() => {
    if (data) {
      // getLang() is now called in the effect above, so we just handle navigation
      let x;
      let user;
      if ($lang != 'he' && $lang != 'ar' && x == null && user == 0) {
        console.log('after', $lang);
        goto('/en');
      } else if ($lang == 'ar' && x == null && user == 0) {
        console.log('Registration', $lang);
        goto('/ar');
      }
    }

    // Connect to Socket.IO only once there is a real session. `id` alone is not
    // one: between signup and email confirmation the id cookie is already set
    // while no JWT exists yet, and the socket authenticates from that JWT — so
    // connecting on `id` meant every just-registered user watched the
    // check-email screen throw "Authentication failed: Invalid or expired JWT".
    if (browser && data?.id && data?.loggedIn) {
      console.log('[Layout] Connecting to Socket.IO for user', data.id);

      // Connect - will read JWT from cookie automatically
      socketClient.connect(data.id);

      // Listen for notifications
      const unsubscribe = socketClient.onNotification((notification) => {
        console.log('[Layout] Received notification:', notification);

        // Update chat stores if it's a chat message
        const meta = notification.metadata || {};
        const actionResult =
          notification.actionResult || notification.data?.actionResult || {};
        const actionParams =
          notification.actionParams || notification.data?.actionParams || {};

        // Profile changes (pic / basic info) made on any of the user's
        // devices: patch the shared userStore so every open page reflects it
        // instantly. socketClient already invalidates 'app:meProfile' for a
        // full refresh of the /me page itself.
        if (meta.type === 'profile' && notification.data?.attributes) {
          patchUser(notification.data.attributes);
        }

        if (
          (meta.type === 'askMessage' || meta.type === 'meetingMessage') &&
          meta.forumId
        ) {
          const senderName = actionResult.senderName || 'Unknown';

          const isMe = String(actionResult.userId) === String(data.id);

          forumStore.addMessage(meta.forumId, {
            id: actionResult.messageId || Date.now(),
            message: actionParams.content || '',
            username: senderName,
            pic: actionResult.senderPic,
            timestamp: actionResult.createdAt || new Date().toISOString(),
            sentByMe: isMe
          });
        }

        // Get the message in the user's language
        const userLang = $locale || 'he';
        const title =
          notification.title[userLang] || notification.title.he || '';
        const body = notification.body[userLang] || notification.body.he || '';

        // Display notification using toast (only if not from me)
        const isFromMe = notification.initiatorId === String(data.id);

        if (!isFromMe) {
          toast.info(`${title}: ${body}`, {
            duration: 5000,
            action: notification.metadata?.url
              ? {
                  label: 'View',
                  onClick: () => {
                    if (notification.metadata?.url) {
                      goto(notification.metadata.url);
                    }
                  }
                }
              : undefined
          });
        }
      });

      // Cleanup on unmount
      return () => {
        unsubscribe();
        socketClient.disconnect();
      };
    }
  });
</script>

{#if navigating.to}
  <div class="nav-progress-track">
    <div class="nav-progress-bar"></div>
  </div>
{/if}

<!-- WCAG 2.4.1 (Bypass Blocks): every page here opens with the same header and
     navigation, and without this a keyboard or screen-reader user has to walk
     through all of it again on each page before reaching the content. Visible
     only while focused. -->
<a class="skip-to-content" href="#main-content">{$t('ui.a11y.skip')}</a>

<main id="main-content" tabindex="-1">
  {#if data?.sessionExpired}
    <SessionExpiredBanner />
  {/if}
  {@render children?.()}
  <Toaster
    toastOptions={{
      style: `dir: ${$isRtl ? 'rtl' : 'ltr'}; text-align: ${$isRtl ? 'right' : 'left'}; `
    }}
    richColors
    closeButton
    position="top-center"
  />
  <SucssesConf success={$confettiStore} />
  {#if showBar}
    <MobileFooter isAuthed={!!data?.loggedIn} />
  {/if}
  <Bot {data} />
</main>

<AccessibilityPanel />

<style>
  /* Off-screen until focused, then pinned to the top of the viewport. Left
     physical rather than logical so it lands in the same place in all five
     locales, RTL included. */
  .skip-to-content {
    position: fixed;
    top: -100px;
    left: 1rem;
    z-index: 10000;
    padding: 0.6rem 1rem;
    border-radius: 0 0 0.5rem 0.5rem;
    background: #ff0092;
    color: #ffffff;
    font-weight: 700;
    text-decoration: none;
    transition: top 0.15s ease-in-out;
  }

  .skip-to-content:focus {
    top: 0;
  }

  /* The target takes focus programmatically via the skip link, but it is not
     an interactive control — no focus ring on it. */
  main:focus {
    outline: none;
  }

  .nav-progress-track {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    height: 3px;
    background: transparent;
    overflow: hidden;
    pointer-events: none;
  }

  .nav-progress-bar {
    height: 100%;
    width: 40%;
    background: linear-gradient(90deg, #d946ef, #f59e0b, #a855f7);
    animation: navslide 1s ease-in-out infinite;
  }

  @keyframes navslide {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(350%);
    }
  }
</style>
