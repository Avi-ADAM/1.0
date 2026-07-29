import { writable } from 'svelte/store';


export let doesLang = writable(false)
export let langUs = writable("te");

/**
 * The user's *actual* UI language ('he' | 'en' | 'ar' | 'ru' | 'es').
 * This is the truthful value: it is what gets written to the `lang` cookie,
 * saved to the user's Strapi profile, and sent as `lang` when creating vocab.
 * Never clamp it — doing so would persist the wrong language.
 */
export let lang = writable("he");

/**
 * Every UI string now lives in `src/lib/translations/<locale>/*.json` and is
 * read through the `t` store, so `lang` is only ever a language *value*
 * (cookie, Strapi profile, vocab `lang`, `toLocaleDateString`) — never a key
 * into a component-local dictionary. Direction comes from `isRtl` in
 * `$lib/translations`, not from comparing `$lang` to 'he'.
 */






