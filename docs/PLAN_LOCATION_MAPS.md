# תכנית מיקום ומפות לעסקים, ספקים ומשאלות

> נכתב: 2026-05-21  
> מטרה: לבחור ספריית מפות ולהגדיר תכנית מהירה לשילוב מיקום בכל זרימת האתר: התאמת לקוחות-ספקים, שותפויות במסך הלב, משימות, משאבים ועסקים על מפה.

---

## 1. החלטה מומלצת

### המלצה קצרה

להתחיל עם **MapLibre GL JS** כמנוע המפה הראשי, ולשמור את **Leaflet** כאופציה מהירה רק אם רוצים MVP פשוט מאוד של סמנים ופופאפים בלי הרבה שכבות.

הסיבה: הצורך שהוגדר עכשיו הוא לא רק בחירת מיקום בטופס, אלא **מפה אינטראקטיבית להצגת עסקים**. זה בדרך כלל גדל מהר ל:

- הרבה עסקים/ספקים על מפה.
- clustering.
- פילטרים לפי תחום, ערכים, זמינות, אונליין/פיזי.
- אזורי שירות ורדיוסים.
- שכבות עתידיות: משאלות פתוחות, משימות, משאבים, שותפויות, הצעות.
- עיצוב מפה שמרגיש חלק מהמוצר ולא מפה גנרית.

לכן MapLibre עדיפה כבחירת ברירת מחדל לטווח בינוני. היא מודרנית, TypeScript-first, מבוססת WebGL, עובדת עם vector tiles, פתוחה, ולא נועלת אותנו לספק מסחרי אחד.

### החלטת MVP

אם רוצים להעלות משהו עובד מהר:

1. להשתמש ב־MapLibre למפת עסקים ציבורית.
2. להשתמש באותו מודל נתונים גם ל־LocationPicker בטפסים.
3. לא להכניס Google Maps כברירת מחדל, אלא רק אם נחליט ש־Places / Reviews / Business data של Google הם יכולת מוצרית קריטית.

---

## 2. מצב קיים בסכימה

לפי `src/generated/STRAPI_SCHEMA_REFERENCE.md` כבר קיימים חלקי מיקום חשובים:

| ישות | שדות קיימים | הערה |
|---|---|---|
| `api::ratson.ratson` | `isOnline`, `lat`, `lng`, `radius`, `location_hint` | טוב למשאלות ול־concierge. |
| `api::matanot.matanot` | `lat`, `lng`, `radius` | חסרים `isOnline`, `location_hint`, `location_mode`. |
| `api::provider-profile.provider-profile` | `lat`, `lng`, `radius_km` | טוב לפרופיל ספק, חסר hint/mode. |
| `api::project.project` | `city`, `countries` | חסרים קואורדינטות ורדיוס. |
| `api::users-permissions.user` | `city`, `lat`, `lng`, `radius` | טוב כמיקום fallback של אדם. |
| `api::position.position` | `location: Float` | לא מספיק למפה; צריך lat/lng/radius. |
| `openMission/openMashaabim/pendm/pmash/sp` | כמעט אין מיקום | אלה הישויות שצריכות מיקום כשמשימה/משאב תלויים בעולם הפיזי. |

---

## 3. שדות שכדאי להוסיף לסכמה

### שדות סטנדרטיים

לכל ישות “מקומית” כדאי להשתמש באותו סט:

| שדה | Type | שימוש |
|---|---|---|
| `lat` | Float | קו רוחב. |
| `lng` | Float | קו אורך. |
| `radius` או `radius_km` | Long / Int | טווח שירות או טווח חיפוש. עדיף לאחד בהמשך ל־`radius_km`. |
| `location_hint` | String | טקסט אנושי: “תל אביב והסביבה”, “אונליין”, “צפון”. |
| `location_mode` | enum `['online','onsite','hybrid','unspecified']` | איך מתייחסים למיקום בהתאמות. |

### תוספות מומלצות

| ישות | להוסיף |
|---|---|
| `api::project.project` | `lat`, `lng`, `radius`, `location_hint`, `location_mode` |
| `api::matanot.matanot` | `isOnline`, `location_hint`, `location_mode` |
| `api::provider-profile.provider-profile` | `location_hint`, `location_mode` |
| `api::open-mission.open-mission` | `lat`, `lng`, `radius`, `location_hint`, `location_mode` |
| `api::open-mashaabim.open-mashaabim` | `lat`, `lng`, `radius`, `location_hint`, `location_mode` |
| `api::pendm.pendm` | `lat`, `lng`, `radius`, `location_hint`, `location_mode` |
| `api::pmash.pmash` | `lat`, `lng`, `radius`, `location_hint`, `location_mode` |
| `api::sp.sp` | `lat`, `lng`, `radius`, `location_hint`, `location_mode` |
| `api::position.position` | `lat`, `lng`, `radius`, `location_hint`, `location_mode` |

לא מומלץ בשלב ראשון להוסיף מיקום ל־`Mission` או `Mashaabim` הגנריים. הם קטלוגים. המיקום שייך למופע הספציפי: משימה פתוחה, משאב מוצע, מוצר, ספק, פרויקט או משאלה.

---

## 4. השוואת ספריות מפות

### טבלת החלטה

| ספרייה | יתרונות | חסרונות | התאמה אלינו |
|---|---|---|---|
| Leaflet | פשוטה מאוד; קלה; open source; מצוינת ל־markers, popups, polygons, GeoJSON; הרבה plugins; קל להכניס ל־SvelteKit עם `onMount`. | רינדור DOM/Canvas קלאסי; פחות טובה להרבה שכבות ו־vector styling מתקדם; clustering דורש plugin; פחות “מודרנית” למפות מוצר עשירות. | טובה ל־MVP מהיר של בחירת מיקום ועסקים בודדים/מאות. פחות אידיאלית כמנוע המרכזי אם המפה תהיה מסך מוצר מרכזי. |
| MapLibre GL JS | open source; TypeScript; WebGL; vector tiles; ביצועים טובים להרבה נקודות; שכבות וסטיילינג עשירים; מתאים ל־clusters, heatmaps, service areas, expressions; לא נעול ל־Mapbox. | מורכבת יותר מ־Leaflet; דורשת בחירת ספק tiles/style; WebGL יכול להיות רגיש יותר במכשירים חלשים; צריך להקפיד על טעינה client-only ב־SvelteKit. | הבחירה המומלצת למפת עסקים אינטראקטיבית ולמפה שתגדל עם המוצר. |
| OpenLayers | ותיקה וחזקה מאוד; open source; עשירה ביכולות GIS; תומכת בהרבה פורמטים ותקנים: XYZ, WMS, vector data, projections. | API יותר כבד ומורכב; פחות “product UI friendly”; overkill אם לא עושים GIS רציני. | טובה אם בעתיד צריך שכבות GIS מקצועיות, תקנים ממשלתיים, projections מורכבים. לא הבחירה הראשונה למפת עסקים רגילה. |
| Google Maps JavaScript API | מפה מוכרת מאוד למשתמשים; Places, autocomplete, geocoding, directions ו־business data חזקים; איכות נתונים עסקיים גבוהה. | עלויות ושימוש לפי SKU; API key ובילינג; vendor lock-in; פחות שליטה על סטיילינג עמוק; לא open source. | לשקול רק אם Places/business search של Google הוא צורך מוצרי מרכזי. לא מומלץ כמנוע ברירת מחדל אם רוצים עצמאות ועלות צפויה. |
| Mapbox GL JS | חוויית פיתוח טובה; סטיילינג מתקדם; שירותי tiles/search/routing חזקים; ביצועים טובים. | מסחרי; תלות ב־Mapbox ובמחירים; רישוי/עלות דורשים בדיקה קבועה. | אפשרות טובה אם רוצים חבילה מסחרית מלאה. MapLibre נותן לנו חופש דומה בצד המנוע. |

---

## 5. יתרונות מפורטים לפי ספרייה

### Leaflet

Leaflet היא ספרייה פתוחה, קלה ופשוטה למפות אינטראקטיביות. היא מצוינת כשצריך להציג מפה עם סמנים, פופאפים, polygons, בחירת נקודה ורדיוס. האתר הרשמי מציג אותה כספרייה מובילה למפות אינטראקטיביות ידידותיות למובייל.

יתרונות:

- זמן פיתוח קצר מאוד.
- learning curve נמוך.
- טובה מאוד ל־LocationPicker בטפסים.
- הרבה דוגמאות וקהילה ותיקה.
- לא דורשת WebGL.
- קל לעבוד עם OpenStreetMap tiles או ספקי tiles אחרים.

מתי לבחור:

- אם היעד הוא “מפה עובדת השבוע”.
- אם מספר העסקים נמוך עד בינוני.
- אם ה־UI המרכזי הוא רשימה, והמפה היא עזר ויזואלי.

### MapLibre GL JS

MapLibre GL JS היא ספריית TypeScript פתוחה שמרנדרת מפות vector tiles בדפדפן עם WebGL. לפי התיעוד הרשמי היא בנויה למפות אינטראקטיביות מודרניות, עם style specification, שכבות, camera, controls ו־custom sources.

יתרונות:

- ביצועים טובים יותר במפה עשירה והרבה נקודות.
- מתאים ל־business map עם clustering, צבעים לפי קטגוריה, אזורי שירות, שכבות ו־filters.
- vector styling נותן שליטה עיצובית גבוהה.
- open source ו־community governed.
- לא מחייב שימוש ב־Mapbox.
- מתאים גם להמשך: terrain, globe, 3D buildings, custom layers.

מתי לבחור:

- אם המפה היא מסך מוצר מרכזי.
- אם נרצה להציג עסקים, ספקים, משאלות, משימות ושותפויות על אותה מפה בשכבות.
- אם חשוב לנו לא להינעל ל־Google/Mapbox.

### OpenLayers

OpenLayers היא ספרייה פתוחה, חזקה ועשירה מאוד. התיעוד הרשמי מתאר אותה כספרייה feature-packed שיכולה להציג tiles, vector data ו־markers ממקורות רבים.

יתרונות:

- חזקה מאוד לעולם GIS.
- תומכת בהרבה מקורות ופורמטים.
- טובה לשכבות מורכבות, projections, WMS/OGC.
- open source וללא נעילה לספק אחד.

מתי לבחור:

- אם המוצר ייכנס לעולמות GIS מקצועיים.
- אם צריך לשלב שכבות ממשלתיות/עירוניות/תכנוניות.
- אם MapLibre לא מספיקה בגלל צורך גיאוגרפי מתקדם.

### Google Maps

Google Maps JavaScript API חזק בעיקר בגלל אקוסיסטם הנתונים והשירותים סביבו: Places, autocomplete, geocoding, directions, business search. התיעוד הרשמי מדגיש שימוש ב־API key וטעינת מפה עם marker; מסמכי billing מבהירים שהשימוש מחויב לפי SKUs כמו Dynamic Maps ו־Places.

יתרונות:

- נתוני עסקים וכתובות מעולים.
- autocomplete וחיפוש מקומות ברמה גבוהה.
- משתמשים מכירים את המפה.
- מתאים אם רוצים “מצא עסקים קיימים סביבי” מתוך Google.

חסרונות:

- עלות יכולה לגדול עם שימוש.
- תלות ב־Google Cloud billing.
- פחות מתאים אם אנחנו רוצים לבנות גרף עסקים פנימי ועצמאי.

מתי לבחור:

- אם צריך Places/Autocomplete ברמה הכי גבוהה.
- אם חוויית “מצא עסק אמיתי בעולם” חשובה יותר משליטה ועלות.

### Mapbox

Mapbox נותנת חבילה מסחרית חזקה: GL JS, tiles, styles, search, geocoding, routing. היא טובה למוצרים שצריכים איכות שירות מוכנה, אבל היא מכניסה תלות מסחרית.

יתרונות:

- מפות יפות וסטיילינג מצוין.
- Search/geocoding/routing מסודרים.
- אקוסיסטם חזק.

חסרונות:

- עלות ותלות ספק.
- פחות מתאים אם רוצים לשמור על open stack.

מתי לבחור:

- אם רוצים time-to-market מסחרי עם שירותי tiles/search מוכנים.
- אם יש תקציב ברור למפות ורוצים SLA/שירות מנוהל.

---

## 6. ארכיטקטורה מומלצת למפת עסקים

### שכבות מידע

| שכבה | מקור נתונים | תצוגה |
|---|---|---|
| עסקים/ספקים | `provider-profile`, `project`, `matanot` | marker/cluster עם קטגוריה, זמינות ודירוג. |
| משאלות פתוחות | `ratson` עם `access_mode` מתאים | marker עדין או heat layer לפי ביקוש. |
| משימות | `openMission`, `pendm` | שכבה נפרדת במסך moach/lev. |
| משאבים | `openMashaabim`, `pmash`, `sp` | שכבה נפרדת או פילטר “משאבים”. |
| שותפויות | `project`, `position`, `negotiation` | נקודות/אזורים במסך הלב. |

### מודל fallback למיקום

בכל הצגה או matching:

1. מיקום מפורש של הישות.
2. מיקום המוצר/ספק.
3. מיקום הפרויקט.
4. מיקום המשתמש.
5. אם אין מיקום: `location_mode='unspecified'`, לא מפילים התאמה אבל מורידים confidence.

### כללי התאמה

| מצב | התנהגות |
|---|---|
| `online` | לא מענישים לפי מרחק. |
| `onsite` | דורשים `lat/lng`, משתמשים ב־radius. |
| `hybrid` | נותנים בונוס לקרבה אבל לא פוסלים מרחוק. |
| `unspecified` | מותר להציג, אבל עם confidence נמוך יותר ובקשה להשלים מיקום. |

---

## 7. תכנית מימוש בשלבים

### שלב 1: תשתית נתונים

- להוסיף את שדות המיקום החסרים בסכימה.
- להריץ codegen.
- לעדכן QIDs רלוונטיים.
- להוסיף action אחיד: `updateLocationScope`.
- להרחיב `createRatson` ופעולות יצירת משימה/משאב כך שישמרו `location_mode`.

### שלב 2: רכיב בחירת מיקום

רכיב יחיד:

`src/lib/components/location/LocationPicker.svelte`

יכולות:

- בחירת נקודה על מפה.
- שימוש ב־geolocation של הדפדפן.
- radius slider.
- Online / Onsite / Hybrid.
- טקסט `location_hint`.
- פלט אחיד:

```ts
type LocationScope = {
  location_mode: 'online' | 'onsite' | 'hybrid' | 'unspecified';
  lat?: number | null;
  lng?: number | null;
  radius?: number | null;
  location_hint?: string | null;
};
```

ב־SvelteKit חשוב לטעון את ספריית המפה רק ב־client:

- `onMount(async () => import('maplibre-gl'))`
- או guard עם `browser` מ־`$app/environment`.

### שלב 3: מפת עסקים

רכיב:

`src/lib/components/location/BusinessMap.svelte`

יכולות MVP:

- markers/clusters לעסקים.
- popup עם שם, סוג, תיאור קצר, כפתור לפרופיל/הצעה.
- פילטרים: תחום, אונליין/פיזי/היברידי, טווח, ערכים.
- סנכרון עם רשימת עסקים בצד.

### שלב 4: שילוב ב־matching

- להעלות את משקל הקרבה מ־0.15 רק כש־`location_mode` מחייב פיזיות.
- להוסיף scoring נפרד:
  - `distanceKm`
  - `locationScore`
  - `locationReason`
- לשמור ב־`ratson_proposal.ai_meta` או בשדה JSON עתידי כדי להסביר למשתמש למה הוצע ספק.

### שלב 5: מסך הלב

- להחליף/להרחיב `Position.location: Float` בשדות מיקום אמיתיים.
- להציג שותפויות ועמדות על מפה.
- לאפשר “שותפויות סביבי” מול “שותפויות אונליין”.

---

## 8. ספקי מפות ונתונים

הספרייה היא רק מנוע. עדיין צריך לבחור מקור tiles/geocoding:

| צורך | אפשרויות |
|---|---|
| Tiles פתוחים | OpenStreetMap דרך ספק חוקי, MapTiler, Stadia, self-hosted tiles |
| Vector tiles | MapTiler, Protomaps/PMTiles, self-hosted Martin, Mapbox |
| Geocoding | Nominatim/self-hosted, MapTiler Geocoding, Mapbox Search, Google Places |
| Business data חיצוני | Google Places, Mapbox Search, OSM Overpass בזהירות |

המלצה: למפה הפנימית של עסקים שכבר קיימים אצלנו ב־Strapi, לא צריך Google Places בהתחלה. אפשר להתחיל עם MapLibre + MapTiler/OpenStreetMap tiles, ואת ה־business data לקחת מה־DB שלנו.

---

## 9. מקורות

- [Leaflet official site](https://leafletjs.com/?lang=en)
- [MapLibre GL JS documentation](https://maplibre.org/maplibre-gl-js/docs)
- [MapLibre GL JS project page](https://maplibre.org/projects/gl-js/)
- [OpenLayers official site](https://openlayers.org/)
- [Google Maps JavaScript API documentation](https://developers.google.com/maps/documentation/javascript)
- [Google Maps JavaScript API usage and billing](https://developers.google.com/maps/documentation/javascript/usage-and-billing)
- [Mapbox pricing](https://www.mapbox.com/pricing)
- [MapTiler API documentation](https://docs.maptiler.com/cloud/api/)

