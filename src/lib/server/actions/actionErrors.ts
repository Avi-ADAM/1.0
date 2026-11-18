/**
 * Words an action says back to the person who ran it, in their own language.
 *
 * An `ActionError`'s message reaches the screen verbatim (`ActionService` puts
 * it in `result.error.message`, and the client shows it). A plain `Error`
 * reaches it in development. Both used to be Hebrew literals, so an English,
 * Arabic, Russian or Spanish member got Hebrew. The server has no `$t()`, so
 * these go through `serverTranslator` — the same JSON files the pages read,
 * now including the `server` namespace (all five locales).
 *
 * Use `const t = actionTranslator(context.lang)` and then `t('server.error.…')`.
 * The variable is called `t` so `check:i18n` sees the static namespace prefix.
 */

import { serverTranslator } from '$lib/server/notices/translate';
import type { Translate } from '$lib/notices';

export function actionTranslator(lang: unknown): Translate {
    return serverTranslator(lang);
}

/**
 * `screenLabel` reports machine-readable reasons ('link', 'contact', …).
 * Showing the raw codes to a person is technical noise; showing nothing loses
 * the information. Translate the known ones and leave an unknown code as is.
 */
export function moderationReasons(reasons: readonly string[], t: Translate): string {
    return (reasons ?? [])
        .map((code) => t(`server.moderation.${code}`) || code)
        .join(', ');
}
