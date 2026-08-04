# PLAN — אחסון מתמיד ל-Mastra (Postgres) על שרת ה-Docker

> **סטטוס: מיושם (2026-08-04).** המסמך נכתב במקור כהוראות הפעלה ידניות כי
> לסוכן לא הייתה גישה ל-VPS. הגישה ניתנה, והשלבים בוצעו בפועל — מה שלמטה
> מתאר את מה שקיים, לא מה שצריך לעשות.
> קשור: [`PLAN_AI_ERA.md`](PLAN_AI_ERA.md) שלב 1 (זיכרון), [`DEPLOY_API_DOCKER.md`](DEPLOY_API_DOCKER.md).

---

## 1. הבעיה

`src/mastra/index.ts` רץ עד היום עם `LibSQLStore({ url: ':memory:' })` — כלומר
telemetry, evals וזיכרון שיחות נמחקים בכל restart. השלב הראשון של `PLAN_AI_ERA`
דורש זיכרון מתמשך (thread לפי `userId:projectId`).

**האחסון כבר הפך למונע-env**: הקוד קורא את `MASTRA_DB_URL`, וברירת המחדל
נשארה `:memory:` כדי לא לשבור סביבות קיימות.

## 2. ⚠️ תיקון להנחה המקורית: אין Postgres מקומי

הגרסה הראשונה של המסמך הניחה ש-"Strapi כבר מריץ Postgres על אותו שרת, אז רק
נוסיף database". **זה לא נכון.** בדיקה בשרת (2026-08-04) העלתה:

```
$ docker ps
app_strapi-blue_1              ghcr.io/avi-adam/tov:1.13
app_nginx_1                    nginx:alpine
sveltekit-api                  ghcr.io/avi-adam/1lev1-sveltekit-api:latest
unified-action-socket-server   socket-server_socket-server
```

אין קונטיינר Postgres. Strapi מדבר עם **Aiven מנוהל** —
``(PostgreSQL 16.14,`max_connections=100`ומתוכם 13 בשימוש,`pgvector`0.8.1 זמין להתקנה, ה-DB עצמו 70MB).`1.0b/config/database.js` הוא כבר לא המקור — הקונפיג מגיע מ-env בשרת.

לכן ההחלטה בפועל (2026-08-04) הייתה **קונטיינר Postgres ייעודי על ה-VPS**
ולא database נוסף על Aiven: בידוד מלא מהדאטה של הפרודקשן, לטנסי אפסי,
ואפס תלות בתקציב/תוכנית של Aiven.

**המחיר שצריך לזכור:** ל-VPS יש 1.9GB RAM בסך הכל (‎~1.1GB פנוי) המשותפים
ל-Strapi, nginx, socket-server וה-API. לכן ה-Postgres מכוונן ידנית ב-`command`
של ה-compose (`shared_buffers=96MB`, `max_connections=25`, …) — אחרת הוא היה
מחשב את ה-caches שלו לפי ה-RAM של המכונה ודוחף הכל ל-swap.
בנוסף, **הגיבויים באחריותנו** (בניגוד ל-Aiven) — ראו סעיף 6.

## 3. מה קיים בפועל

### 3.1 הקונטיינר

מוגדר ב-[`docker-compose.api.yml`](../docker-compose.api.yml) כשירות `postgres`
(שם קונטיינר `mastra-postgres`):

- `image: postgres:16-alpine`, `volume: mastra-pgdata` — שורד דיפלוי ו-restart.
- **לא מפורסם לשום פורט בהוסט** — רק קונטיינרים על `app_app-network` מגיעים
  אליו, בתור `postgres:5432` (בדיוק כמו `strapi:1337`).
- `healthcheck` עם `pg_isready`.
- DB/user/password נוצרים אוטומטית ע"י ה-image מתוך `POSTGRES_*`, כך שאין
  שלב ידני של `CREATE DATABASE` / `GRANT`.

### 3.2 משתני סביבה

ב-`.env` שעל השרת (חי רק שם, לא ב-git). נוצרו אוטומטית עם `openssl rand -hex 24`:

```
MASTRA_PG_PASSWORD=<סוד>
MASTRA_DB_URL=postgresql://mastra_user:<אותו סוד>@postgres:5432/mastra
```

`MASTRA_PG_PASSWORD` נצרך ע"י שירות ה-`postgres` בקומפוז, `MASTRA_DB_URL` ע"י
האפליקציה. שניהם חייבים להחזיק את אותה סיסמה.

### 3.3 הקוד

`src/mastra/index.ts` בוחר store לפי סכימת ה-URL:

```ts
const storage = /^postgres(ql)?:\/\//.test(MASTRA_DB_URL)
  ? new PostgresStore({
      id: 'pg-storage',
      connectionString: MASTRA_DB_URL,
      max: 5,
      idleTimeoutMillis: 30_000
    })
  : new LibSQLStore({ url: MASTRA_DB_URL, id: 'libsql-storage' });
```

`max: 5` בכוונה — הקונטיינר מוגבל ל-`max_connections=25`.
Mastra יוצר את הטבלאות שלו אוטומטית בהרצה הראשונה.

### ⚠️ `@mastra/pg` נעוץ ל-1.10.0 — לא `^`

`npm i @mastra/pg` מביא את הגרסה האחרונה (1.18.1), והיא **שוברת את ה-build**:

```
SyntaxError: The requested module '@mastra/core/storage'
does not provide an export named 'FactoryStorage'
```

`@mastra/core` בפרויקט הוא 1.32.1, ו-`@mastra/pg` מ-1.11.0 ואילך דורש
`@mastra/core >= 1.34`. הגרסה האחרונה שתואמת היא **1.10.0**
(peer: `>=1.32.0`) — בדיוק אותו טווח כמו `@mastra/libsql` המותקן.

לכן ב-`package.json` היא רשומה כ-`"1.10.0"` **בלי `^`**. עם `^` כל
regeneration של ה-lockfile היה מחזיר את הבאג, ודווקא ב-Docker build שרץ
`npm ci` — כלומר הכשל היה מתגלה רק בדיפלוי.

לשדרג את `@mastra/pg` אפשר רק יחד עם שדרוג של `@mastra/core`, וזה נוגע בכל
ה-agents וה-workflows — לא שינוי נקודתי.

## 4. אימות

```bash
# מהקונטיינר של האפליקציה — DNS + TCP
docker exec sveltekit-api node -e "require('net').connect(5432,'postgres').on('connect',()=>console.log('ok'))"

# אימות משתמש/DB
docker exec mastra-postgres psql -U mastra_user -d mastra -c '\dt'
```

אמורות להופיע טבלאות `mastra_*` (threads/messages/traces/evals).

## 5. שמירה על גודל ה-DB

**אין כרגע שום מנגנון ניקוי.** traces, evals והודעות יגדלו בלי גבול.
(`retention` ברמת טבלה קיים רק ב-`@mastra/pg` חדש יותר — לא בגרסה הנעוצה
1.10.0, ראו למעלה.) לא בוער בנפח הנוכחי, אבל זה הדבר הבא לטפל בו כשמפעילים
את שלב 1 של `PLAN_AI_ERA` ברצינות — כרגע ה-DB היחיד שמגן על עצמו הוא
ה-`max-size` של לוגי הדוקר, לא הדאטה.

## 6. גיבוי (פתוח)

בניגוד ל-Aiven, אין כאן גיבוי אוטומטי. כשהזיכרון יהפוך למשמעותי צריך cron של
`pg_dump` מהקונטיינר אל מחוץ למכונה. **טרם הוגדר.**

## 7. RAG עתידי (שלב 1.5)

`postgres:16-alpine` לא כולל את `pgvector`. אם רוצים להוריד את שלב 1.5 פנימה
במקום Pinecone, זו החלפת image חד-שורתית ל-`pgvector/pgvector:pg16` (אותו
PostgreSQL 16, ה-volume תואם) ואז `CREATE EXTENSION vector;`.

## 8. אבטחה — לטיפול בנפרד

`1.0b/config/database.js` מכיל **סיסמת Postgres בטקסט גלוי ומקומיטת ל-git**.
היא כבר לא זו שבשימוש (הקונפיג מגיע מ-env בשרת), אבל אם היא עדיין תקפה מול
Aiven — צריך להחליף אותה ולהעביר את הקובץ ל-`env('DATABASE_PASSWORD')`.
לא חוסם את המעבר ל-Postgres עבור Mastra (שמשתמש בקונטיינר נפרד לגמרי).

## 9. Rollback

להסיר את `MASTRA_DB_URL` מה-`.env` ולהפעיל מחדש — הקוד חוזר ל-`:memory:`
בדיוק כמו קודם. אין מיגרציה הרסנית. הקונטיינר וה-volume יכולים להישאר.
