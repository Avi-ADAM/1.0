/**
 * Localization utility functions.
 *
 * Vocabulary entries (skills, roles, workways, values) are stored in Strapi's
 * default locale — English — and `localizations.data[0]` holds the Hebrew
 * version. So the localized name is applied only for a Hebrew reader; every
 * other reader keeps the base (English) name. This is the same rule
 * VocabSelector, hevel and oneLangAdj follow.
 */
import { get } from 'svelte/store';
import { lang as langStore } from '$lib/stores/lang.js';

const FIELDS = ['skillName', 'roleDescription', 'workWayName', 'valueName'] as const;

/**
 * Applies localization to a list of entities (skills, roles, workways, values).
 *
 * @param {any} entityContainer - The object containing the 'data' array (e.g. { data: [...] })
 *                                or the array itself if already flattened.
 * @param {string} [lang] - The reader's UI language; defaults to the `lang` store.
 * @returns {any} A new structure with localized attributes, preserving the input shape ({data: ...} or [...]).
 */
export function applyLocalization(entityContainer: any, lang?: string): any {
    // Handle null/undefined
    if (!entityContainer) return { data: [] };

    // Determine if input is the wrapper object or the array itself
    let items: any[] = [];
    let isWrapper = false;

    if (Array.isArray(entityContainer)) {
        items = entityContainer;
    } else if (Array.isArray(entityContainer.data)) {
        items = entityContainer.data;
        isWrapper = true;
    } else {
        // Unknown structure or empty
        return entityContainer;
    }

    const readerLang = lang ?? get(langStore);
    // The only localization these queries carry is Hebrew; anyone else reads the base name.
    if (readerLang !== 'he') {
        return isWrapper ? { data: items } : items;
    }

    const localizedItems = items.map(item => {
        if (!item?.attributes) return item;

        const newAttributes = { ...item.attributes };
        const localizedAttrs = newAttributes.localizations?.data?.[0]?.attributes;

        if (localizedAttrs) {
            for (const field of FIELDS) {
                if (localizedAttrs[field]) newAttributes[field] = localizedAttrs[field];
            }
        }

        return {
            ...item,
            attributes: newAttributes
        };
    });

    return isWrapper ? { data: localizedItems } : localizedItems;
}
