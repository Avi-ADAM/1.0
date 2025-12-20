/**
 * Localization utility functions.
 * Handles applying localized strings (e.g. Hebrew) to entities like skills, roles, and workways
 * if localized data is present in the 'localizations' field.
 */

/**
 * Applies localization to a list of entities (skills, roles, workways).
 * Iterates through the list and replaces the primary name/description with the localized version
 * if available in the `localizations` field.
 * 
 * @param {any} entityContainer - The object containing the 'data' array (e.g. { data: [...] }) 
 *                                or the array itself if already flattened.
 * @returns {any} A new structure with localized attributes, preserving the input shape ({data: ...} or [...]).
 */
export function applyLocalization(entityContainer: any): any {
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

    const localizedItems = items.map(item => {
        if (!item?.attributes) return item;

        const newAttributes = { ...item.attributes };
        const localizations = newAttributes.localizations?.data;

        // Check if we have valid localization data
        if (localizations && localizations.length > 0 && localizations[0]?.attributes) {
            const localizedAttrs = localizations[0].attributes;

            // 1. Skills: skillName
            if (localizedAttrs.skillName) {
                newAttributes.skillName = localizedAttrs.skillName;
            }

            // 2. Roles (Tafkidims): roleDescription
            if (localizedAttrs.roleDescription) {
                newAttributes.roleDescription = localizedAttrs.roleDescription;
            }

            // 3. WorkWays: workWayName
            if (localizedAttrs.workWayName) {
                newAttributes.workWayName = localizedAttrs.workWayName;
            }
        }

        return {
            ...item,
            attributes: newAttributes
        };
    });

    return isWrapper ? { data: localizedItems } : localizedItems;
}
