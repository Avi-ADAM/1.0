# PLAN_VPS_ONLY — כל האתר על השרת שלנו, ו-Strapi בשלושה עותקים

> מצב: **inprogress**. נכתב 2026-11-17. **V0 ו-V1 חיים בשרת מאותו יום** (§4.1), וגם בקומיט (1.0main
> `40863ab2`, 1.0b `4103997` / release 1.31). V2 נבנה ב-2026-11-18 (§4.2). V3–V6 פתוחים.
> שרת: `91.90.82.93` (vps2, ראו `db-backups/SERVER_RUNBOOK.md`).

## 4.1 מה נבנה (2026-11-17)

**V0 — Postgres** (`docker-compose.api.yml`, שירות `postgres`): `max_connections=120`, `shared_buffers=1GB`,
`effective_cache_size=4GB`, `work_mem=8MB`, `maintenance_work_mem=256MB`, `shm_size: 256mb`. הופעל ב-
`up -d --no-deps postgres`: השבתה של כמה שניות, ו-Strapi וה-API התחברו מחדש לבד. ב-1.0b
`config/env/production/database.js` מקבל `pool` מפורש (`DATABASE_POOL_MIN/MAX`, ברירת מחדל 2/10). זה נכנס
לתוקף ב-release הבא של ה-image, וערכי ברירת המחדל זהים לאלה של knex.

**V1 — Strapi ×3** (1.0b):
- `docker-compose.yml`: `strapi-1`, `strapi-2`, `strapi-3` מ-anchor אחד (`x-strapi`). לכל אחד `mem_limit: 1g`,
  `NODE_OPTIONS=--max-old-space-size=768`, `stop_grace_period: 30s`, ובדיקת בריאות עם `start_interval`.
  nginx מקבל alias `strapi` ברשת.
- `nginx/default.conf.template`: `upstream strapi_pool` (`least_conn`, `resolve`, `max_fails=2`), שרת פנימי
  `listen 1337` (לא מפורסם החוצה) ל-`http://strapi:1337`, `proxy_next_upstream error timeout http_502 http_503`,
  ו-`proxy_connect_timeout 5s`. `$backend` ו-`__STRAPI_BACKEND__` יצאו.
- `nginx/render-conf.sh`: בלי צבע. הארגומנט הראשון נשאר ריק, כי `strapi-gate` קורא `render-conf.sh "" <state>`.
  מצב ה-gate וצבע ה-pl ממשיכים לעבור מדיפלוי לדיפלוי.
- `deploy.ps1`: החלפה מדורגת `strapi-1` → `2` → `3`. כל עותק מחכה ל-healthy ועוד 12 שניות, כדי ש-nginx
  יספיק לגלות את ה-IP החדש. כשל מחזיר את העותק ל-image הקודם ועוצר. אחרי זה render, `nginx -s reload`
  ובדיקות. בדיפלוי הראשון גם הוסרו `app-strapi-blue-1` ו-`app-strapi-green-1`.
- `docker-compose.override.yml` נמחק. ה-mount של `overrides/database.production.js` כבר לא נחוץ, כי
  `tov:1.30` כולל את `DATABASE_SSL`. הקובץ שנשלף מהשרת שמור ב-`~/app/.v1-backup-20261117-1633/`.

**נמצא בדרך:** ל-`pl-strapi-blue` (barbi) יש alias `strapi-blue` על אותה רשת. במבנה הישן, דיפלוי שעובר
לכחול היה שולח את tovmeod ל-Strapi של barbi. השמות `strapi-N` מבטלים את זה.

**נבדק:**
- probe שפונה ל-GraphQL דרך nginx פעמיים בשנייה לאורך כל הדיפלוי: 562 תשובות 200 ושגיאה אחת, ברגע
  שיצרו מחדש את nginx (חד-פעמי, בגלל ה-alias). דיפלוי רגיל מעכשיו עושה רק `reload`.
- failover: `docker stop` לעותק אחד למשך 20 שניות, ואז הפעלה מחדש. 127 מתוך 127 בקשות קיבלו 200.
- `sveltekit-api` → `strapi:1337` עובר דרך nginx. בתוך השרת ה-API עונה ב-34ms.
- זיכרון: כל עותק Strapi בערך 215–240MB. סה"כ בשימוש בשרת 1.7GB מתוך 11GB. ב-`tov` יש 6 חיבורים.

ה-checkout ב-`~/app` בשרת נקי על release 1.31. הניקוי החד-פעמי כבר נעשה.

## 4.2 V2: מה נבנה (2026-11-18)

**שני צבעים ו-alias אחד.** ב-`docker-compose.api.yml` רצים `sveltekit-api-a` ו-`sveltekit-api-b`. שניהם
מוגדרים מ-anchor אחד, וכל אחד יושב ב-profile משלו (`a` / `b`), כך ש-`docker compose up -d` בלי profile לא
מפעיל אף אחד מהם. לשניהם יש network alias בשם `sveltekit-api`. זה השם היחיד ש-nginx
(`set $api_backend "sveltekit-api:3000"`) וה-scheduler מכירים, ולכן אצלם לא השתנה כלום. בזמן הדיפלוי
השם מחזיר שתי כתובות, ו-nginx מתחלק ביניהן. בין דיפלויים רץ צבע אחד בלבד. זה פשוט יותר מ-upstream
שמסמנים בו `down` עם reload, כפי שתוכנן למטה.
- `scripts/deploy/api-switch.sh <tag>` רץ בשרת, ו-`deploy-api.ps1` מעלה ומפעיל אותו. מה הוא עושה: מזהה את
  הצבע החי (`-a`, `-b`, או `sveltekit-api` הישן), מפעיל את הצבע השני על התגית המדויקת (`API_TAG`) ומחכה
  ל-healthy (בדיקה כל 2 שניות, `start_interval`). אחרי זה הוא מחכה 12 שניות ל-cache של ה-resolver ב-nginx,
  עוצר את הישן (`stop -t 35`, ו-adapter-node מסיים את הבקשות הפתוחות), מוחק אותו, ובודק 5 פעמים את
  `api.1lev1.com/api/health` דרך nginx. אם הצבע החדש לא עולה, הסקריפט מוחק אותו, והישן לא נעצר בכלל.
- rollback הוא `.\deploy-api.ps1 -SkipBuild -Tag <sha קודם>`. כשה-image לא קיים מקומית, השרת מושך אותו
  מ-GHCR, ו-`:latest` זז רק ב-build חדש.
- הפורט `127.0.0.1:3000` יצא, כי שני צבעים לא יכולים לתפוס אותו יחד. אף אחד בשרת לא השתמש בו חוץ מבדיקת
  הבריאות הישנה.
- תמיכה ב-compose v1 וב-`$RemoveStale` (`rm -f` לכל הקונטיינרים לפני `up`) יצאו מהסקריפט. בשרת רץ compose
  v5.7, והסקריפט נכשל מראש אם אין `docker compose`.
- `scheduler` כבר לא `depends_on` את ה-API. הוא מנסה שוב לבד.
- **בדיקת ה-scheduler בכל דיפלוי** (שלב 6 ב-`api-switch.sh`):
  - אם `scheduler.mjs` השתנה, הוא מופעל מחדש. ההשוואה היא מול `.scheduler.sha256`, כי בלי restart התהליך
    ממשיך להריץ את הקוד שכבר טען.
  - אם הוא לא רץ, הוא מופעל. בודקים שהוא לא בלולאת restart ושהוא מגיע ל-`sveltekit-api:3000`.
  - בסוף רצה הבדיקה `scheduler.mjs --check`. היא בודקת שקובץ ה-state נכתב בשלושת ה-ticks האחרונים, כלומר
    שהלולאה חיה. היא בודקת גם שאף משימה לא נכשלת ואף משימה לא באיחור של יותר מ-30 דקות. האיחור נמדד
    כך: שואלים את `due()` של כל משימה על `now - 30m`, וכך כל משימה נבדקת לפי לוח הזמנים שלה.
    `SCHEDULER_CHECK_GRACE_MINUTES` משנה את מרווח ה-30 דקות.
  - כשל בשלב הזה מחזיר exit 2, ו-`deploy-api.ps1` אומר במפורש שה-API עלה ושה-scheduler צריך טיפול.
  - בדיקה ידנית: `docker exec 1lev1-scheduler node /app/scheduler.mjs --check`.
  - 2026-11-18, מול ה-state החי: כל 11 המשימות ok.

**הוחל בשרת (2026-11-18):** nginx עבר render ו-reload. אחרי זה רצו שתי החלפות של אותו image
(`b23abefe`, `-SkipBuild`): `sveltekit-api` הישן → `-a`, ואחר כך `-a` → `-b`. probe שבודק את
`api.1lev1.com/api/health` דרך nginx פעמיים בשנייה רץ לאורך שתיהן: **0 תשובות שאינן 200 מתוך 454**. היו שתי
בקשות איטיות, 5.0 ו-2.2 שניות, בהחלפה הראשונה. זה ה-`proxy_connect_timeout 5s` על כתובת שנשארה ב-cache של
ה-resolver. להקטנה אפשר `resolver valid=2s` ב-nginx.conf של 1.0b. ה-build המלא לא רץ, כי במחשב היו פנויים
7.8GB זיכרון והוא צריך 13GB. הדיפלוי הבא של קוד חדש הוא `.\deploy-api.ps1` רגיל.
- **נמצא בדרך:** ב-Windows PowerShell 5.1 עם `ErrorActionPreference=Stop`, כל שורה ב-stderr של ssh, למשל
  אזהרה של compose, הופכת לשגיאה שעוצרת את הסקריפט וסוגרת את ה-ssh באמצע ההחלפה. עכשיו ה-switch רץ עם
  `2>&1` בצד השרת.
- `vector.toml`: הלוגים של `sveltekit-api-*` מקבלים `service = "sveltekit-api"`, כך ששאילתות ב-Axiom לא
  תלויות בצבע. השדה `container_name` עדיין אומר איזה צבע כתב את השורה.
- 1.0b: `deploy.ps1` מאתר את קונטיינר ה-API לפי הקידומת. ב-`nginx/default.conf.template` נקבע
  `proxy_connect_timeout 5s` ל-api (היה 60s): כתובת של צבע שכבר נעצר נשארת ב-cache עד 10 שניות, וחיבור
  שנכשל עובר לכתובת השנייה (ברירת המחדל של `proxy_next_upstream` היא `error`, ו-POST שלא הגיע לשרת
  בטוח לשליחה חוזרת).
- **המחיר:** כמה שניות שבהן שני תהליכים עונים. יומן ה-relay, קודי OAuth ומגבלת הקצב של MCP שמורים בכל
  תהליך בנפרד. כל אחד מהם גם ככה מתחיל ריק בכל אתחול, וזה מה שהתהליך הזה מחליף.

**סקריפטים ישנים שעדיין מדברים blue/green** (לא בשימוש, לא לגעת בהם בלי לעדכן): `deploy.sh`,
`deploy-branch.sh`/`.ps1`, ו-`fix-deployment.sh`. האחרון עושה `docker-compose down --remove-orphans`,
שמפיל את כל האתר.

## 0. למה

היום הדפים רצים ב-Vercel (Hobby, חינמי) וה-API, Strapi ו-Postgres רצים על ה-VPS. כל עמוד
שנטען מהשרת עושה שתי קפיצות: Vercel → `api.1lev1.com` → Strapi (`src/lib/server/ssrApiBase.js`,
`SSR_API_BASE`). אחרי המעבר עמוד שנטען על ה-VPS קורא ל-`/api/*` בתוך אותו תהליך ול-Strapi
דרך הרשת הפנימית של docker.

| | היום (Vercel + VPS) | אחרי (VPS בלבד, DNS נשאר ב-GoDaddy) |
|---|---|---|
| עמוד SSR | Vercel (ארה"ב) → VPS → Strapi | VPS → Strapi, בתוך המכונה |
| cold start | יש | אין |
| קבצים סטטיים | CDN של Vercel | nginx על ה-VPS, `immutable` לשנה (CDN של Cloudflare אופציונלי, §V4) |
| דיפלוי | שניים (push ל-Vercel + `deploy-api.ps1`), גרסאות יכולות להתפצל | אחד |
| רישיון | Hobby אוסר שימוש מסחרי | אין בעיה |
| מכסות | 1M הפעלות, 4 שעות CPU, 100GB לחודש | מה שהשרת נושא |
| לוגים | שני datasets ב-Axiom (`vercel`, `vps-docker`) | אחד |
| קוד שקיים רק בגלל הפיצול | `ssrApiBase`, `trustedOrigins` ל-`/api/upload`, `relay/host.ts`, CORS | אפשר לפשט |

### מה מפסידים
- preview deploy לכל push, ו-rollback בלחיצה. כאן במקומם: תגית image קודמת + `deploy` (§5).
- `@vercel/analytics`, שבשימוש ב-`src/routes/+layout.js` וב-`src/lib/components/main/amana.svelte`.
  החלופה היא שלב VA (Umami על השרת), שחייב לעלות **לפני** V5.
- השרת הופך לנקודת כשל אחת לכל האתר. זה כמעט ממילא המצב, כי בלי ה-API האתר לא עובד.
- CDN והגנת DDoS לדפים, שהיום Vercel נותן. ב-0.4 בקשות בשנייה (§1) nginx מגיש את הקבצים
  הסטטיים בלי מאמץ. אם יהיה צורך, Cloudflare הוא שלב נפרד ואופציונלי (§V4).

## 1. מדידה (2026-11-17)

| | |
|---|---|
| מעבד | 6 vCPU AMD EPYC, load average 0.09 |
| זיכרון | 11GB, בשימוש 1.3GB, swap 4GB לא בשימוש |
| דיסק | 14GB מתוך 96GB |
| קונטיינרים | Strapi כ-280MB, ה-API כ-135MB, Postgres כ-70MB, כל השאר פחות מ-100MB |
| תעבורה ל-nginx | כ-11,000 בקשות ביממה, שיא של כ-1,300 בשעה (בערך 0.4 בקשות בשנייה) |
| Postgres | `max_connections=25` **משותף** ל-`tov` (Strapi), `mastra` ו-`barbi` |

הגבול המעשי היום הוא Strapi: תהליך Node אחד, כלומר ליבה אחת. זה בערך 10–30 שאילתות GraphQL
כבדות בשנייה, ובערך 100–300 משתמשים פעילים באותו רגע. שלושה עותקים מכפילים את זה בערך פי 2.5–3.

## 2. Kubernetes — לא, בשלב הזה

על מכונה אחת Kubernetes (גם k3s) לא נותן זמינות גבוהה. אם המכונה נופלת, הכול נופל. הוא כן מוסיף
0.5–1GB זיכרון לרכיבי הניהול, שכבת רשת ו-ingress חדשים, ותחזוקה של אשכול. כל מה שצריך כאן
(כמה עותקים, בדיקות בריאות, החלפה מדורגת בלי השבתה) docker compose + nginx כבר נותנים.

**מתי לחזור לשאלה:** כשיש שתי מכונות או יותר. אז k3s (או Docker Swarm, שקרוב יותר ל-compose
הקיים) מתחיל להשתלם. התכנית כאן לא חוסמת את זה, כי כל שירות כבר נשען על image ועל env.

## 3. ארכיטקטורת היעד

```
DNS ב-GoDaddy (רשומות A ל-VPS)   [אופציונלי בעתיד: Cloudflare proxied, §V4]
   │
nginx (app-nginx-1, :443)
   ├── 1lev1.com, www      → upstream web_pool   (sveltekit-web ×2)
   ├── api.1lev1.com       → upstream api_pool   (sveltekit-api ×1, ראו §4.3)
   ├── tovmeod.1lev1.com   → upstream strapi_pool (strapi-1..3), מאחורי strapi-gate
   └── socket.1lev1.com    → socket-server (ללא שינוי)

רשת פנימית app-network:
   sveltekit-web / sveltekit-api ──► http://strapi-lb:8081 (listener פנימי של nginx, ללא gate)
                                     └► strapi_pool
   strapi-1..3 ──► mastra-postgres (tov)
```

**כל העותקים של SvelteKit מאותו image** (adapter-node, ה-`Dockerfile` הקיים). ההבדל בין
`web` ל-`api` הוא env וכמות עותקים, לא קוד.

## 4. שלבים

### V0 — Postgres מוכן לשלושה Strapi (בלי השבתה כמעט)

הדבר הראשון שיישבר: Strapi לא מגדיר pool, אז knex פותח עד 10 חיבורים לעותק. שלושה עותקים
הם 30 חיבורים, יותר מ-`max_connections=25`, עוד לפני mastra ו-barbi.

1. ב-`docker-compose.api.yml`, שירות `postgres`: הכיול נכתב למכונה של 1.9GB. לעדכן ל-11GB:
   `max_connections=120`, `shared_buffers=1GB`, `effective_cache_size=4GB`, `work_mem=8MB`,
   `maintenance_work_mem=256MB`. עדכון ההערה שמעל.
2. ב-1.0b `config/env/production/database.js` (וב-`overrides/database.production.js` עד שה-image
   החדש עולה): `pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) }`.
   תקציב: 3 × 10 ל-Strapi + mastra + barbi + מרווח, הרבה מתחת ל-120.
3. אתחול Postgres. זו השבתה של שניות, בשעה שקטה.

**בדיקה:** `show max_connections;` ו-`select datname,count(*) from pg_stat_activity group by 1;`.

### V1 — Strapi בשלושה עותקים (repo 1.0b + השרת)

היום: `strapi-blue` ו-`strapi-green` ב-`~/app/docker-compose.yml`. רק אחד דולק, ו-`deploy.ps1`
מחליף את `set $backend` ב-nginx.

**מה כבר בטוח לריבוי עותקים (נבדק):**
- `cron` כבוי בפרודקשן (`config/env/production/server.js` → `enabled: false`). השעון הוא
  `1lev1-scheduler`, אז cron לא ירוץ פעמיים.
- ההעלאות הולכות ל-Cloudinary (`config/plugins.js`). `./app/public/uploads` הישן כבר משותף כ-volume.
- הכניסה ל-admin היא JWT, לא session בזיכרון.

**לבדוק לפני (V1.0):**
- `src/index.js` / `bootstrap` ב-1.0b: כל קוד שרץ בהפעלה (seed הרשאות, יצירת רשומות) צריך
  להיות idempotent, כי שלושה עותקים יריצו אותו במקביל. אם לא, להגן עליו ב-advisory lock של Postgres.
- `grep` ל-`setTimeout` / cache בזיכרון בשירותים וב-lifecycles. נמצא רק
  `product-variant/.../derive.js`, וצריך לוודא שהוא חישוב טהור.

**השינוי:**
1. ב-`docker-compose.yml`: במקום blue/green, שלושה שירותים `strapi-1`, `strapi-2`, `strapi-3` מאותו
   image (שירות אחד עם anchor של YAML). לכל אחד `mem_limit: 1g`,
   `NODE_OPTIONS=--max-old-space-size=768`, ואותה בדיקת `/_health`.
2. nginx, `default.conf.template`:
   ```nginx
   resolver 127.0.0.11 valid=10s ipv6=off;
   upstream strapi_pool {
       zone strapi_pool 64k;
       least_conn;
       server strapi-1:1337 resolve max_fails=2 fail_timeout=10s;
       server strapi-2:1337 resolve max_fails=2 fail_timeout=10s;
       server strapi-3:1337 resolve max_fails=2 fail_timeout=10s;
       keepalive 32;
   }
   ```
   (`resolve` בתוך `upstream` נתמך ב-nginx OSS מגרסה 1.27.3. לוודא את גרסת `nginx:alpine` ולנעוץ
   תגית.) ב-`tovmeod.1lev1.com`: `proxy_pass http://strapi_pool;` במקום `$backend`,
   ו-`proxy_next_upstream error timeout http_502 http_503;` **רק ל-GET**
   (`proxy_next_upstream_tries 2`). mutation של GraphQL לא נשלחת פעמיים.
3. listener פנימי בשביל SvelteKit: `server { listen 8081; location / { proxy_pass http://strapi_pool; } }`,
   בלי `ports:` החוצה. רק app-network מגיע אליו. ה-alias `strapi-lb` ניתן ל-nginx ברשת.
   `STRAPI_URL=http://strapi-lb:8081` ב-`.env` של ה-API במקום `http://strapi:1337`.
   כך נעלם גם הטיפול הידני ב-alias `strapi` אחרי כל `up` (`deploy.ps1` 6b, ו-memory
   `project_strapi_blue_green_stable_alias`).
   ה-`x-strapi-gate` ממשיך להישלח (`hooks.server.js`) ולא מזיק.
4. `deploy.ps1` / `release.ps1` ב-1.0b, **rolling** במקום flip:
   ```
   pull image
   for n in 1 2 3:
       docker compose up -d --no-deps strapi-$n
       wait /_health of strapi-$n (timeout 120s)
       on failure: stop, leave the other two up, report
   ```
   nginx מסמן עותק שנפל (`max_fails`), אז בזמן ההחלפה שני העותקים האחרים עונים. אין צורך ב-reload.
   rollback: אותה לולאה עם התגית הקודמת.
5. `strapi-gate open|close` ו-`render-conf.sh` ממשיכים לעבוד. רק `set $backend` יוצא מהתבנית.

**בדיקה:** `docker stats`. לעצור עותק אחד (`docker stop app-strapi-2-1`) ולוודא שהאתר והאדמין
ממשיכים לעבוד. deploy מלא עם `curl` בלולאה על `/_health` דרך nginx ולוודא אפס 5xx.

### V2 — ה-API: עותק אחד, החלפה בלי השבתה

`sveltekit-api` נשאר **עותק יחיד** בשלב זה, כי יש בו מצב בזיכרון:
- `src/lib/server/relay/log.ts`: יומן ה-relay חייב תהליך אחד (`relay/host.ts` אומר את זה במפורש).
- `src/lib/server/mcp/rateLimit.ts`: בכמה עותקים המגבלה פי N (מתועד שם כמקובל).
- `TRANSLATE_STATE_DIR`: קבצים ב-volume, וכתיבה מקבילה משני תהליכים לא נבדקה.
- `1lev1-scheduler` פונה ל-`http://sveltekit-api:3000`.

היום `deploy-api.ps1` עושה `rm -f` לקונטיינר ואז `up -d`. זו השבתה של 10–20 שניות בכל דיפלוי.
**השינוי:** blue/green קטן גם ל-API (`sveltekit-api-a` / `-b`, upstream `api_pool` עם שני השרתים,
אחד מהם `down` אחרי ההחלפה). הפעלת החדש → health → החלפת `down` ב-nginx + `reload` → עצירת הישן.
ה-scheduler פונה לשם יציב, alias `sveltekit-api` שעובר לצבע החי (כמו ש-`strapi` עבד).

### V3 — הדפים על ה-VPS (`sveltekit-web`)

1. שירות חדש ב-`docker-compose.api.yml`, `sveltekit-web`, מאותו image, שני עותקים (`web-1`, `web-2`):
   - `ORIGIN=https://1lev1.com`
   - **בלי** `SSR_API_BASE`. ה-SSR קורא ל-`/api/*` בתוך התהליך, ול-Strapi דרך `strapi-lb`.
   - `TZ`, `BODY_SIZE_LIMIT` ו-volumes כמו ב-API (`translate-state` לקריאה בלבד אם אפשר).
   - `mem_limit: 768m`.
   - **בלי** relay: `relayRefusalReason` צריך לסרב גם כאן. להחליף את `env.VERCEL` ב-
     `env.RELAY_HOST !== '1'`, ש-`sveltekit-api` בלבד מקבל.
2. **env:** כל משתני הסביבה שמוגדרים היום ב-Vercel (ובמיוחד `PUBLIC_*` ו-`$env/static/*`, שנאפים
   בזמן build, ראו memory `project_env_static_baked`) חייבים להיות ב-`.env` של ה-build וב-`.env`
   של השרת. ליצוא: `vercel env pull`, ואז השוואת hash לכל משתנה (ראו memory על `$` ב-compose v2).
3. nginx: `server_name 1lev1.com www.1lev1.com` → `upstream web_pool { least_conn; server web-1:3000 resolve; server web-2:3000 resolve; }`.
   `/_app/immutable/*` עם `expires 1y; immutable`, ו-`client_max_body_size` כמו ב-api.
4. TLS: certbot ל-`1lev1.com` ו-`www`, כמו לשאר תתי-הדומיינים. האתגר של certbot צריך את ה-DNS
   כבר מופנה ל-VPS, אז להוציא את התעודה ב-webroot מיד אחרי שינוי הרשומה ב-V5, או מראש באתגר DNS
   (רשומת TXT ידנית ב-GoDaddy, `certbot --manual --preferred-challenges dns`) כדי שה-HTTPS יעבוד
   מהשנייה הראשונה.
5. `VITE_API_BASE` נשאר `https://api.1lev1.com` בשלב הזה. הדפדפן ממשיך לדבר עם ה-API כמו היום,
   כך שהשינוי היחיד הוא מאיפה ה-HTML מוגש. איחוד לאותו origin הוא V6.

**בדיקה, לפני שמזיזים DNS:** `curl --resolve 1lev1.com:443:91.90.82.93 https://1lev1.com/...`
לדף הבית, `/lev`, `/moach/<id>`, `/r/<slug>`, `/concierge`, `/gift/<id>`; התחברות; העלאת קובץ;
MCP OAuth (`/oauth/token`, CSRF ב-`$lib/server/csrf.js`). מעבר ב-`npm run check:proxy`.

### VA — אנליטיקס על השרת שלנו (משימה נפרדת, לפני V5)

תכנית מלאה: [PLAN_INHOUSE_ANALYTICS](../tbd/PLAN_INHOUSE_ANALYTICS.md). בקצרה: **Umami** (קוד פתוח, MIT)
כשירות ב-`docker-compose.api.yml` על ה-Postgres הקיים, ב-`pulse.1lev1.com`, בלי עוגיות, ולכן בלי באנר
ובלי צד שלישי בהצהרת הפרטיות. מעבר לצפיות, מכשירים, מדינות ודשבורד, יש בו גם **משפך ההצטרפות**: דף הבית →
לחיצה → `/hascama` → יציאה להסכמה המורחבת → חזרה (`agreed=true`) → ניסיון חתימה → חתימה.

לא תלוי ב-V3: אפשר להקים אותו כבר עכשיו, בזמן שהדפים עוד ב-Vercel, ולהריץ שבועיים במקביל ל-Vercel
Analytics. **הוא חייב לרוץ לפני V5**, אחרת אין נתוני בסיס לשבוע של המעבר. ההסרה של Vercel Analytics
(A4) נעשית בתוך V6.

### V4 — Cloudflare (אופציונלי, נדחה — 2026-11-18)

**הוחלט לא לעשות את זה כחלק מהמעבר.** V5 עובד ישירות מול GoDaddy, וה-rollback (רשומה אחת,
TTL של 60 שניות) עובד שם באותה מידה. מה Cloudflare היה נותן כאן קטן: CDN לקבצים שהם כבר
`immutable` בדפדפן, בתעבורה של 0.4 בקשות בשנייה. ומה שמפסידים אמיתי: `socket` וכנראה גם `api` חייבים
להישאר DNS only (WebSocket נסגר אחרי 100 שניות, העלאות עד 100MB), כך שרק `1lev1.com` ו-`www`
היו עוברים דרכו. חוץ מזה צריך `real_ip`, אחרת rate limit ולוגים רואים את Cloudflare בשקט, וההעברה
עצמה מסכנת את רשומות המייל והאימותים. ה-proxy החינמי מחייב להעביר את ה-nameservers. אין מצב
ביניים שבו ה-DNS נשאר ב-GoDaddy.

**מתי לחזור לזה:** התקפה (DDoS), תעבורה גדולה ממקומות רחוקים מהשרת, או cache לדפים ציבוריים
שכבר לא מספיק ב-nginx (§5). אז אלה הצעדים:

1. להעביר את ה-nameservers של `1lev1.com` ל-Cloudflare (חינם). לייבא את הרשומות הקיימות ולוודא
   **כל** תת-דומיין: `api`, `tovmeod`, `socket`, `consensus`, MX, SPF/DKIM של המייל, ואימותי Google/Claude.
2. `1lev1.com`, `www`: proxied (ענן כתום). `tovmeod`, `socket`: **DNS only** בהתחלה. socket מחזיק
   WebSocket ארוך (`proxy_read_timeout 3600s`), ו-Cloudflare חינמי סוגר חיבור שקט אחרי 100 שניות.
   `api`: proxied, אבל רק אחרי בדיקה שהעלאות של 100MB עוברות. ב-Free המגבלה היא 100MB לבקשה,
   ו-`SPACE_DOCS_MAX_MB` הוא בדיוק 100, אז אולי DNS only.
3. SSL mode: **Full (strict)**. Cache rules: `/_app/immutable/*` cache everything. HTML לא נשמר
   ב-cache (תלוי cookies).
4. nginx: `set_real_ip_from` לטווחי ה-IP של Cloudflare + `real_ip_header CF-Connecting-IP`. בלי זה
   כל rate limit ולוג רואים את Cloudflare במקום את המשתמש.
5. אופציונלי: לנעול את 443 ב-ufw לטווחי Cloudflare בלבד, לדומיינים שעוברים דרכו.

### V5 — המעבר עצמו

1. ב-GoDaddy: לרשום את הערכים הנוכחיים של `@` ו-`www` (ה-A וה-CNAME של Vercel), ואז TTL של 60
   שניות לשתיהן יום לפני. לא לגעת בשום רשומה אחרת (MX, SPF/DKIM, `api`, `tovmeod`, `socket`, `consensus`).
2. להפנות את `1lev1.com` ו-`www` ב-GoDaddy לרשומת A של `91.90.82.93`. **Vercel נשאר חי** כגיבוי
   3–7 ימים: rollback הוא החזרת הערכים שנרשמו בסעיף 1. אחרי שבוע שקט, להחזיר את ה-TTL לשעה.
3. מעקב: Axiom `vps-docker` (5xx, זמני תגובה), `docker stats`, `pg_stat_activity`.
4. אחרי שבוע שקט: לנתק את הפרויקט ב-Vercel מה-repo, כדי ש-push לא יבנה. memory
   `feedback_single_commit_vercel` ו-`feedback_deploy_target_summary` מתעדכנים: push כבר לא מעלה כלום,
   ודיפלוי הוא `deploy-api.ps1` (שמעלה עכשיו גם את web).

### V6 — ניקוי (אחרי שהמעבר יציב)

- `@vercel/analytics`: להסיר מ-`+layout.js` ומ-`amana.svelte`. החלופה כבר רצה מ-VA (Umami), וזה שלב A4
  שלו, כולל עדכון `privacy.json` בחמש השפות.
- `svelte.config.js`: ענף `ADAPTER=vercel` ו-`@sveltejs/adapter-vercel` יוצאים.
- `ssrApiBase.js` / `SSR_API_BASE`: אפשר להשאיר (ריק = בתוך התהליך) או להסיר.
- `relay/host.ts`: מבוסס על `RELAY_HOST` (V3).
- אופציונלי: **אותו origin**. `VITE_API_BASE=''`, הדפדפן קורא ל-`1lev1.com/api/*`, ו-nginx מנתב
  `/api/relay/*`, `/api/v1/presence`, `/api/v1/p2p` ו-`/api/mcp` ל-`api_pool`, וכל השאר ל-`web_pool`.
  זה מבטל CORS ו-`trustedOrigins`, אבל `api.1lev1.com` חייב להמשיך לעבוד בשביל
  magik-meetings, consensus1lev1 (memory `reference_sibling_repos_call_api`), MCP ו-Tauri.

## 5. תקציב משאבים אחרי המעבר

| שירות | עותקים | זיכרון לעותק (תקרה) | סה"כ |
|---|---|---|---|
| Strapi | 3 | 1GB | 3GB |
| sveltekit-web | 2 | 768MB | 1.5GB |
| sveltekit-api | 1 (+1 בזמן החלפה) | 768MB | 1.5GB |
| Postgres (`shared_buffers` 1GB) | 1 | כ-1.5GB | 1.5GB |
| nginx, socket, vector, scheduler, pl-strapi | | | כ-0.5GB |
| **סה"כ בתקרה** | | | **כ-8GB מתוך 11GB** |

בפועל השימוש צפוי להיות כחצי מהתקרות. במעבד: 6 ליבות לשישה תהליכי Node עיקריים, ובעומס של היום
כולם כמעט במנוחה.

**גבול משוער אחרי:** בערך 300–800 משתמשים פעילים באותו רגע, עד ש-Postgres או המעבד הופכים לצוואר
הבקבוק. הצעד הבא אחרי זה: cache לשאילתות ציבוריות (`/r/<slug>`, קטלוג) ב-nginx או ב-Cloudflare,
ורק אחר כך שרת שני.

## 6. סדר ותלויות

```
V0 (Postgres)  ──►  V1 (Strapi ×3)        יכול לעלות לבד, שיפור מיידי גם עם Vercel
V2 (API בלי השבתה)                         בלתי תלוי
VA (Umami) ─────────┐                      בלתי תלוי ב-V3, חייב לרוץ לפני V5
V3 (web) ───────────┴──► V5 (DNS ב-GoDaddy) ──► V6 (כולל A4: הסרת Vercel Analytics)
V4 (Cloudflare)                            אופציונלי, אחרי V5, רק אם יש סיבה
```

V0–V2 מועילים גם אם מחליטים לא לעזוב את Vercel. V3–V5 הם המעבר עצמו.

## 7. Redis — להתכונן, לא לבנות

**הרעיון:** לשמור ב-Redis תשובות שכבר חושבו (בעיקר שאילתות ל-Strapi), ולמחוק אותן כשהמידע משתנה.
את האות על השינוי מקבלים מאותו מנגנון שכבר מודיע למסכים דרך הסוקט.

### האם זה עוזר היום? לא באמת.
- התעבורה היא כ-0.4 בקשות בשנייה, ושלושה עותקי Strapi מספיקים לפי 100 מזה. cache הוא פתרון לעומס,
  ואין עומס.
- cache עם ביטול שגוי מראה למשתמש מידע ישן: הצבעה שכבר נסגרה, אחוזים לפני `Sale` שאושר. בפלטפורמה
  שמבוססת על הסכמה ועל כסף זו תקלה חמורה יותר מאיטיות.

### מה כן משתנה כשיש כמה עותקים
כבר היום יש cache **בזיכרון של כל תהליך**:

| איפה | מה | מה קורה בכמה עותקים |
|---|---|---|
| `src/lib/server/identity.js` | זהות מה-JWT, כולל cache שלילי של 30 שניות | כל עותק לומד לבד. לא שגוי, רק פחות יעיל |
| `src/lib/server/apiPublic/catalog.ts` (`cachedQuery`) | שאילתות קטלוג ציבוריות עם TTL | עותק אחד יכול להראות מידע ישן יותר מאחר עד שה-TTL נגמר |
| `membersOf` של ה-notifier | חברי רקמה | אותו דבר |
| `src/lib/server/mcp/rateLimit.ts` | מגבלת קצב ל-MCP | המגבלה בפועל פי N (מתועד שם כמקובל) |
| `TRANSLATE_STATE_DIR` | מכסת תרגום, סמן backfill, לוג ביקוש | קבצים ב-volume משותף. כתיבה מקבילה לא נבדקה (V2 משאיר עותק API אחד בגלל זה) |
| `relay/log.ts` | יומן ה-relay | חייב תהליך אחד. Redis הוא מה שיאפשר להוריד את המגבלה |

ב-V3 (שני עותקי web) ההבדלים האלה נשארים קטנים, כי כל ה-TTL קצרים. **הסימן שהגיע הזמן ל-Redis**
הוא אחד מאלה: צריך יותר מעותק API אחד, מגבלת קצב צריכה להיות מדויקת, או ש-Strapi או Postgres הופכים
לצוואר בקבוק אחרי V1.

### המנגנון כשיגיע הזמן
```
load / /api/send (קריאה)
   └► cache.get(key)  ── hit ──► תשובה
          │ miss
          └► Strapi ──► cache.set(key, value, { ttl, tags: ['project:87', …] })

action (כתיבה) ──► broadcaster.publish(scopes)        // כבר קיים: src/lib/server/realtime/broadcaster.ts
                   ├► socket → מסכים מרעננים            // כבר קיים
                   └► cache.invalidate(scopes)          // חדש: אותם scopes בדיוק
```
- **ה-tags הם ה-scopes שהברודקאסטר כבר מחשב** (`project:<id>`, `wish:<id>` …, `$lib/realtime/scopes`).
  אין צורך במודל ביטול שני.
- הביטול קורה **בשרת**, בתוך ה-action, ולא דרך הדפדפן: הסוקט הוא fire-and-forget ו"לא מכשיל את
  ה-action". אם ביטול ה-cache יעבור דרכו, סוקט שנפל ישאיר מידע ישן בלי שגיאה. ה-socket-server
  יכול להירשם לאותו ערוץ Redis (pub/sub) ולשדר משם, אבל זה מסלול נוסף ולא תחליף.
- **TTL תמיד**, גם עם ביטול. כתיבות שלא עוברות במערכת ה-actions (ראו הפער למטה), עריכה ידנית ב-admin
  של Strapi ו-timegrama שמבשיל בשקט לא ישלחו ביטול. ה-TTL הוא הרשת שמתחת.
- **הסדר:** קודם שאילתות ציבוריות ולא-אישיות (קטלוג, `/r/<slug>`, דפי מוצר). רק אחר כך מידע של
  משתמש, ותמיד עם המשתמש במפתח.
- **לעולם לא ב-cache:** מה שמחליט על כסף או על הסכמה בזמן הכתיבה (`computeNegoGate`, יתרות,
  `holderStatus`, ספירת קולות). שם תמיד קוראים מ-Strapi.

### פער שצריך לסגור לפני cache אמיתי
מוטציות שעוברות ב-`/api/send` (qids) ולא ב-`/api/action` **לא עוברות בברודקאסטר**, ולכן גם לא יבטלו
cache. `src/routes/api/send/qidTargets.js` כבר יודע לאיזו ישות כל מוטציה נוגעת (בשביל ה-ownership
guard). מספיק לחבר אותו לאותו `invalidate`. בלי זה, cache יעבוד רק על מה שכבר עבר ל-actions.

### מה עושים עכשיו, במסגרת התוכנית הזו (זול, ולא מחייב Redis)
1. **ממשק cache אחד.** כל `new Map()` שמשמש cache (`identity.js`, `cachedQuery`, `membersOf`) עובר
   דרך `$lib/server/cache` עם `get` / `set({ttl, tags})` / `invalidate(tags)`. הדרייבר הראשון הוא Map
   בזיכרון, כמו היום. Redis הוא דרייבר שני, אותו דפוס של "facade אחד, שני דרייברים" כמו האחסון של
   הספרייה המשותפת ב-PLAN_RIKMA_SHARED_INFO.
2. **הברודקאסטר קורא ל-`cache.invalidate(scopes)`** כבר עכשיו. עם Map זה מבטל רק בעותק המקומי, אבל
   החיווט קיים, וכשמחליפים לדרייבר Redis הביטול נהיה גלובלי בלי לגעת בקוד.
3. **מקום בתקציב ובקומפוז:** שורה שמורה ל-`redis:7-alpine` (בערך 256MB, `maxmemory-policy allkeys-lru`,
   בלי persistence כי זה cache ולא מקור אמת), רק ברשת הפנימית, בלי `ports:`. בתקציב של §5 יש מקום.
4. **לא** להוסיף Redis ל-compose עד שאחד הסימנים שלמעלה מופיע.

### אחר כך, עם Redis
- מגבלות קצב משותפות (MCP, תרגום, `publicQuota`).
- מצב התרגום (`governorStore`, `demand`) כמפתחות Redis במקום קבצים, ואז אפשר יותר מעותק API אחד.
- socket.io עם `@socket.io/redis-adapter`, כשיש יותר מעותק socket-server אחד.
- relay: היומן ב-Redis Streams, ואז הוא לא קשור לתהליך אחד.

## 8. שאלות פתוחות

1. `pl-strapi-blue` רץ על אותה מכונה (פרויקט `pl`). להשאיר אותו, או שהוא מועמד להעברה?
2. גיבוי: `space-docs` כבר מגובה. האם `db-backups` מגבה את `tov` בתדירות שמתאימה ליותר משתמשים?
3. ספק ה-VPS: יש snapshot אוטומטי? כשהשרת הוא כל האתר, זה הופך לחשוב יותר.
4. `www` → `1lev1.com` או להפך? (לבדוק מה ה-canonical היום ב-`app.html` / SEO.)
