<script>
  /**
   * The screen every uncaught error lands on.
   *
   * It used to print the status code, the raw message and a picture — nothing a
   * visitor could act on. The commonest cause by far is a session that quietly
   * died (a member who has not visited for months, or auth cookies written on a
   * different domain scope), so this screen leads with sign-in / sign-up and
   * carries the address the visitor was trying to reach, `?from=…`, so they land
   * back on it once they are in.
   *
   * `code` comes from `handleError` in hooks.server.js / hooks.client.js.
   */
  import { t } from '$lib/translations';
  import { page } from '$app/state';
  import Header from '../header/header.svelte';

  /**
   * @typedef {Object} Props
   * @property {string} [message]
   * @property {number|string} [status]
   * @property {'auth'|'server'|'unreachable'} [code]
   * @property {string} [from]
   */

  /** @type {Props} */
  let { message, status, code, from } = $props();

  // `$t` returns '' for a namespace that is not loaded — and an error page can
  // render before the layout load that fetches translations ever ran. The
  // literal is a last-resort fallback, not a second source of truth.
  const tf = (key, fallback) => $t(key) || fallback;

  // The address the visitor was trying to reach, so signing in returns them to it.
  let target = $derived(
    from || page.url.pathname.replace(/^\//, '') + page.url.search
  );
  let loginHref = $derived(`/login?from=${encodeURIComponent(target)}&expired=1`);

  // A signed-in visitor refused a page is not "signed out": the page says it is
  // closed to them, in the server's own words (QA C-23 — a private wish told a
  // logged-in supplier their session had expired).
  let signedIn = $derived(!!(page.data?.loggedIn || page.data?.uid));
  let isForbidden = $derived(status == 403 && signedIn && code !== 'auth');
  // 401/403 are auth by definition; `code` covers everything hooks classified.
  let isAuth = $derived(!isForbidden && (code === 'auth' || status == 401 || status == 403));
  // The backend did not answer (a load's 503, $lib/server/sendReply.js). The
  // page exists and the session is fine, so this is no place to offer sign-in:
  // the one useful thing is to try again.
  let isUnreachable = $derived(!isForbidden && !isAuth && (code === 'unreachable' || status == 503 || status == 504));

  function retry() {
    location.reload();
  }
</script>

<Header />

<div
  class="grid items-center justify-center bg-goldGrad px-4 py-16 text-center"
  style="min-height: 100vh;"
>
  <div class="mx-auto max-w-xl">
    <h1 class="text-barbi text-4xl font-bold">{status}</h1>

    <h2 class="text-barbi mt-3 text-2xl">
      {isForbidden
        ? tf('auth.errorScreen.forbiddenTitle', 'הדף הזה לא פתוח עבורך')
        : isUnreachable
          ? tf('auth.errorScreen.unreachableTitle', 'השרת לא ענה בזמן')
          : isAuth
          ? tf('auth.errorScreen.authTitle', 'ההתחברות שלך פגה')
          : tf('auth.errorScreen.serverTitle', 'משהו השתבש אצלנו')}
    </h2>

    <p class="text-gold mt-3 text-lg">
      {isForbidden
        ? message || tf('auth.errorScreen.forbiddenBody', 'למי שפתח/ה אותו יש החלטה מי רואה אותו.')
        : isUnreachable
        ? tf('auth.errorScreen.unreachableBody', 'הדף קיים, אבל השרת שמאחוריו לא הגיב הפעם. כדאי לנסות שוב בעוד רגע.')
        : isAuth
        ? tf(
            'auth.errorScreen.authBody',
            'לא הצלחנו לזהות אותך. אם לא ביקרת כאן זמן מה, ההתחברות כנראה פגה - כניסה מחדש תחזיר אותך בדיוק לאן שרצית להגיע.'
          )
        : tf('auth.errorScreen.serverBody', 'לא הצלחנו לטעון את הדף.')}
    </p>

    {#if !isAuth && !isForbidden && !isUnreachable}
      <!-- Even a genuine server error is most often a dead session downstream,
           so the sign-in route stays offered — just phrased as a possibility. -->
      <p class="text-tm mt-2 text-sm">
        {tf(
          'auth.errorScreen.maybeSession',
          'אם לא התחברת כאן הרבה זמן, ייתכן שזו בכלל ההתחברות שפגה - שווה להתחבר שוב.'
        )}
      </p>
    {/if}

    <div class="mt-8 flex flex-wrap justify-center gap-3">
      {#if !isForbidden && !isUnreachable}
      <a
        href={loginHref}
        class="button-perl text-barbi hover:text-black border border-gold px-5 py-3 text-xl font-bold"
        >{tf('auth.errorScreen.login', 'התחברות')}</a
      >
      <a
        href="/signup"
        class="text-gold hover:text-barbi hover:border-barbi border border-gold rounded px-5 py-3 text-xl"
        >{tf('auth.errorScreen.signup', 'הרשמה')}</a
      >
      {/if}
      <button
        onclick={retry}
        class="text-gold hover:text-barbi hover:border-barbi border border-gold rounded px-5 py-3 text-xl"
        >{tf('auth.errorScreen.retry', 'ניסיון חוזר')}</button
      >
      <a
        href="/"
        class="text-gold hover:text-barbi hover:border-barbi border border-gold rounded px-5 py-3 text-xl"
        >{tf('auth.errorScreen.home', 'לדף הבית')}</a
      >
    </div>

    {#if !isForbidden}<p class="text-tm mt-8 text-xs">{message}</p>{/if}
    <p class="text-tm mt-1 text-xs">
      {tf(
        'common.misc.genericError',
        'שגיאה, יש לנסות שנית. אם הבעיה נמשכת ניתן ליצור קשר במייל baruch@1lev1.com'
      )}
    </p>

    <img
      class="mx-auto mt-6 max-w-full"
      alt=""
      src="https://res.cloudinary.com/love1/image/upload/v1720630795/error1_t2fvd8-Photoroom_uphvtj.png"
    />
  </div>
</div>
