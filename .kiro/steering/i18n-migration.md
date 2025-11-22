---
inclusion: manual
---

# i18n Migration Guide: From Inline Objects to $t Key System

## Overview
This guide helps migrate from inline translation objects to the centralized `$t` key system using the translations folder structure.

## Old Pattern (Inline Objects)
```javascript
const someText = {
  he: 'טקסט בעברית',
  en: 'Text in English',
  ar: 'نص بالعربية'
};

// Usage in template
{someText[$lang]}
```

## New Pattern ($t Key System)
```javascript
import { t } from '$lib/translations';

// Usage in template
{$t('namespace.key')}
```

## Migration Steps

### 1. Identify Translation Objects
Look for objects with `he`, `en`, `ar` keys that contain translated strings.

### 2. Create/Update Translation Files
Add translations to appropriate JSON files in:
- `src/lib/translations/he/[namespace].json`
- `src/lib/translations/en/[namespace].json`
- `src/lib/translations/ar/[namespace].json`

### 3. Choose Appropriate Namespace
- `bot.json` - Bot/AI related text
- `lev.json` - Project/partnership related text
- `love.json` - Agreement/map related text
- `me.json` - User profile related text
- `moach.json` - Brain/thinking related text

For landing pages, consider creating a new namespace like `landing.json` or `home.json`.

### 4. Structure Translation Keys
Use nested objects for organization:
```json
{
  "hero": {
    "title": "...",
    "subtitle": "..."
  },
  "features": {
    "feature1": "...",
    "feature2": "..."
  }
}
```

### 5. Replace in Component
```javascript
// Remove old object
// const someText = { he: '...', en: '...', ar: '...' };

// Import if not already imported
import { t } from '$lib/translations';

// Replace usage
// {someText[$lang]} → {$t('namespace.key')}
```

### 6. Remove Unused Imports
After migration, remove:
- `import { lang } from '$lib/stores/lang'` (if only used for translations)
- Inline translation objects

## Benefits
- Centralized translation management
- Easier to maintain and update
- Better organization
- Reusable across components
- Supports translation tools and workflows

## Notes
- Keep `$lang` store for language switching logic
- The `$t` function automatically uses the current language
- Test all three languages after migration

## Critical: Language Store Synchronization

**Always sync both `$lang` and `$locale` stores together!**

When setting language anywhere in the app, use this pattern:

```javascript
import { lang, langUs, doesLang } from '$lib/stores/lang';
import { locale } from '$lib/translations';

function setLanguage(newLang) {
  // Sync all stores
  lang.set(newLang);
  locale.set(newLang);
  langUs.set(newLang);
  doesLang.set(true);
  
  // Update cookie
  document.cookie = `lang=${newLang}; expires=` + new Date(2026, 0, 1).toUTCString();
}
```

**Where synchronization happens:**
1. `src/routes/+layout.svelte` - Initial load and data changes
2. `src/lib/components/main/fpage.svelte` - Language switcher
3. Any component that changes language

**For display logic, prefer `$locale`:**
- Use `$locale` for dir attributes, conditional rendering
- Use `$t()` for all text content
- Keep `$lang` only for backward compatibility where needed
