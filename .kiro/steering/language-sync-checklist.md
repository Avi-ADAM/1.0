# Language Store Synchronization Checklist

## Critical Issue
The app uses two separate language stores that must stay synchronized:
- `$lang` - Old store from `$lib/stores/lang.js`
- `$locale` - New i18n store from `$lib/translations`

## Files That Need Updating

### ✅ Already Fixed:
1. `src/routes/+layout.svelte` - Syncs both stores on load
2. `src/lib/components/main/fpage.svelte` - Language switcher syncs both
3. `src/routes/hascama/+page.svelte` - URL param handling syncs both
4. `src/lib/components/main/amana.svelte` - ✅ FIXED - Registration page (Hebrew)
5. `src/lib/components/main/amanaen.svelte` - ✅ FIXED - Registration page (English)
6. `src/lib/components/main/amanar.svelte` - ✅ FIXED - Registration page (Arabic)
7. `src/routes/(reg)/lev/+page.svelte` - ✅ FIXED - Main lev page
8. `src/routes/(reg)/me/+page.svelte` - ✅ FIXED - Profile page

### ⚠️ Still Need to Fix:
1. `src/routes/testi/+page.svelte` - Missing `locale.set()`
2. `src/routes/jenia/+page.svelte` - Missing `locale.set()`
3. `src/routes/hascama/+layout.svelte` - Missing `locale.set()`

## Standard Pattern

Whenever you set language, use this pattern:

```javascript
import { lang, langUs, doesLang } from '$lib/stores/lang.js';
import { locale } from '$lib/translations';

function setLanguage(newLang) {
  // Sync ALL stores
  lang.set(newLang);
  locale.set(newLang);
  langUs.set(newLang);
  doesLang.set(true);
  
  // Update cookie
  document.cookie = `lang=${newLang}; expires=` + new Date(2026, 0, 1).toUTCString();
}
```

## Display Logic Best Practices

- **Use `$locale`** for:
  - `dir` attributes (rtl/ltr)
  - Conditional rendering based on language
  - Any UI logic that depends on current language

- **Use `$t()`** for:
  - All text content
  - Translations

- **Keep `$lang`** only for:
  - Backward compatibility
  - Cookie management
  - Internal state tracking

## Testing Checklist

After fixing each file:
1. Test language switching works
2. Test page refresh maintains language
3. Test URL navigation (`/en`, `/he`, `/ar`)
4. Test all three languages display correctly
5. Check dir attribute changes properly
6. Verify translations load correctly

## Priority Order

Fix in this order (by user impact):
1. Registration pages (amana*.svelte)
2. Main pages (lev, me)
3. Layout files
4. Test/utility pages
