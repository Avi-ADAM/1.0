# PLAN — אחסון מתמיד ל-Mastra (Postgres) על שרת ה-Docker

מסמך הפעלה לשרת. נכתב כי לסוכן אין גישה ל-VPS — כל שלב כאן מיועד להרצה ידנית.
קשור: [`PLAN_AI_ERA.md`](PLAN_AI_ERA.md) שלב 1 (זיכרון), [`DEPLOY_API_DOCKER.md`](DEPLOY_API_DOCKER.md).

---

## 1. הבעיה

`src/mastra/index.ts` רץ עד היום עם `LibSQLStore({ url: ':memory:' })` — כלומר
telemetry, evals וזיכרון שיחות נמחקים בכל restart. השלב הראשון של `PLAN_AI_ERA`
דורש זיכרון מתמשך (thread לפי `userId:projectId`).

**האחסון כבר הפך למונע-env** (בוצע): הקוד קורא את `MASTRA_DB_URL`, וברירת המחדל
נשארה `:memory:` כדי לא לשבור סביבות קיימות.

## 2. למה Postgres ולא קובץ SQLite/libSQL

| שיקול | קובץ בקונטיינר | Postgres |
|---|---|---|
| **שרידות דיפלוי** | ❌ `docker-compose.api.yml` מושך `image: ...latest` בלי `build` — הקונטיינר מוחלף בכל דיפלוי והקובץ נמחק (אלא אם מוסיפים volume) | ✅ חיצוני לקונטיינר |
| **כותבים מקבילים** | ⚠️ נעילת-כותב יחיד; הצ'אט + cron הסיכום היומי (שלב 4) + socket-server יתנגשו | ✅ |
| **גיבוי/ניטור** | צריך להקים בנפרד | ✅ כבר קיים עבור Strapi |
| **RAG עתידי** | — | ✅ `pgvector` מאפשר להוריד את שלב 1.5 פנימה במקום Pinecone |

**Strapi כבר מריץ Postgres** (`1.0b/config/database.js` → `client: 'postgres'`),
כך שאין להוסיף תשתית — רק database נפרד על אותו שרת.

> אם בכל זאת רוצים את המסלול המהיר: `MASTRA_DB_URL=file:/data/mastra.db` +
> `volumes: [mastra-data:/data]` ב-compose. עובד, אבל נשארים עם נעילת-הכותב.

---

## 3. הפעלה — צעד אחר צעד

### 3.1 יצירת database ומשתמש ייעודיים

**לא** להשתמש ב-database או במשתמש של Strapi. על השרת:

```bash
docker exec -it <postgres-container> psql -U postgres
```

```sql
CREATE DATABASE mastra;
CREATE USER mastra_user WITH PASSWORD '<סוד-חזק-חדש>';
GRANT ALL PRIVILEGES ON DATABASE mastra TO mastra_user;

\c mastra
GRANT ALL ON SCHEMA public TO mastra_user;   -- נדרש ב-Postgres 15+
CREATE EXTENSION IF NOT EXISTS vector;        -- אופציונלי, ל-RAG עתידי
```

### 3.2 רשת Docker

הקונטיינר `sveltekit-api` מחובר לרשת החיצונית `app_app-network`
(ראה `docker-compose.api.yml`). ודא שקונטיינר ה-Postgres נמצא על אותה רשת, כך
ש-`postgres:5432` ניתן לפתרון (בדיוק כמו `strapi:1337`):

```bash
docker network connect app_app-network <postgres-container>
```

בדיקה מתוך קונטיינר האפליקציה:
```bash
docker exec -it sveltekit-api node -e "require('net').connect(5432,'postgres').on('connect',()=>{console.log('ok');process.exit(0)}).on('error',e=>{console.log('fail',e.message);process.exit(1)})"
```

### 3.3 משתנה סביבה

ב-`.env` שעל השרת (חי רק שם, לא ב-git):

```
MASTRA_DB_URL=postgresql://mastra_user:<סוד>@postgres:5432/mastra
```

### 3.4 שינוי קוד נדרש

`@mastra/pg` אינו מותקן כרגע (יש רק `@mastra/libsql`):

```bash
npm i @mastra/pg
```

וב-`src/mastra/index.ts` לבחור store לפי סכימת ה-URL:

```ts
import { PostgresStore } from '@mastra/pg';
import { LibSQLStore } from '@mastra/libsql';

const MASTRA_DB_URL = process.env.MASTRA_DB_URL || ':memory:';

const storage = MASTRA_DB_URL.startsWith('postgres')
  ? new PostgresStore({ connectionString: MASTRA_DB_URL })
  : new LibSQLStore({ url: MASTRA_DB_URL, id: 'libsql-storage' });
```

Mastra יוצר את הטבלאות שלו אוטומטית בהרצה הראשונה.

### 3.5 אימות

לאחר דיפלוי:
```bash
docker logs sveltekit-api | grep -i mastra
docker exec -it <postgres-container> psql -U mastra_user -d mastra -c "\dt"
```
אמורות להופיע טבלאות של Mastra (threads/messages/traces).

---

## 4. אבטחה — לטיפול בנפרד

`1.0b/config/database.js` מכיל **סיסמת Postgres בטקסט גלוי ומקומיטת ל-git**.
מומלץ:
1. להחליף את הסיסמה של `postgres`.
2. להעביר את הקונפיג ל-`env('DATABASE_PASSWORD')` כמו שאר ההגדרות.
3. לוודא ש-`.env` אינו ב-git.

לא חוסם את המעבר ל-Postgres עבור Mastra (שמשתמש במשתמש נפרד), אבל כדאי לסגור.

---

## 5. Rollback

להסיר את `MASTRA_DB_URL` מה-`.env` ולהפעיל מחדש — הקוד חוזר ל-`:memory:`
בדיוק כמו קודם. אין מיגרציה הרסנית.
