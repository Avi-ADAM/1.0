// Ambient SvelteKit types for this app.
//
// `event.locals` is populated in hooks.server.js on every request; without
// these declarations every `locals.lang` / `locals.tok` read in a +page.server
// file is a type error ("Property 'lang' does not exist on type 'Locals'").
declare global {
  namespace App {
    interface Locals {
      /** UI locale for this request, resolved from ?lang / path / cookie. */
      lang: 'he' | 'en' | 'ar' | 'ru' | 'es';
      /** Raw Accept-Language header, kept for client-side fallbacks. */
      userAgent: string | null;
      /** Derived from the sec-ch-ua-mobile client hint. */
      isDesktop: boolean;
      /** JWT from the HttpOnly cookie, or false when signed out. */
      tok: string | false;
      /** Signed-in user id, or false. */
      uid: string | false;
      /** Signed-in username, or false. */
      un: string | false;
      /** Signed-in email, or false. */
      email: string | false;
    }
  }
}

export {};
