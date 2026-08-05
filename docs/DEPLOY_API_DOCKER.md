# פריסת אינסטנס ה-API של SvelteKit ב-Docker (על ה-VPS, לצד Strapi)

> משלים את `docs/PLAN_PROXY_SECURITY.md` שלב 3 (סעיפים 5 ו-8.9): הפרונט נשאר
> ב-Vercel (`ADAPTER=vercel`), ואינסטנס נוסף של אותו קוד — עם **adapter-node** —
> רץ על ה-VPS של Strapi ומשמש כשרת הפרוקסי (`/api/send`, `/api/action`,
> `/api/upload`, `/api/auth`). Strapi נעול ל-127.0.0.1 / רשת docker פנימית.

## הקבצים

| קובץ | תפקיד |
|------|-------|
| `Dockerfile` | build רב-שלבי (node:22-alpine). `ADAPTER` לא מוגדר → adapter-node. ה-`.env` מוזרק ל-build כ-**BuildKit secret** ולא נשמר באף layer. |
| `.dockerignore` | מצמצם את ה-context (בלי `node_modules`, `android`, `remotion`, `socket-server`, `.env`...). |
| `docker-compose.api.yml` | הרצת הקונטיינרים בשרת: `sveltekit-api` (פורט 3000 על loopback בלבד, `env_file: .env` מקומי לשרת), `postgres` (אחסון Mastra) ו-`vector` (שילוח לוגים). כולם על רשת `app_app-network` המשותפת עם Strapi וה-socket-server. |
| `vector.toml` | קונפיג ה-log shipper. נשלח ל-`/home/ubuntu/api/vector.toml` ע"י `deploy-api.ps1` ומוצמד ל-container ב-bind mount. |
| `deploy-api.ps1` | build **לוקאלי** → `docker push` ל-GHCR → בשרת `docker-compose pull` + `up -d` + health check. עם `-Tarball` חוזרים ל-`docker save`→scp→`docker load` (fallback ללא רישום). ה-build נשאר לוקאלי בכוונה — ל-VPS יש 1.9GB RAM בלי swap והוא יקרוס (OOM) על vite build. |
| `src/routes/api/health/+server.js` | endpoint ל-HEALTHCHECK של Docker ול-Nginx. |

## הכנה חד-פעמית בשרת

> השרת הקיים: `ubuntu@18.159.130.31` (מפתח `~/Downloads/sail.pem`) — אותה מכונה
> שמריצה את Strapi (`app_strapi-blue_1`, image מ-GHCR), את ה-socket-server ואת
> ה-nginx. רשת `app_app-network` כבר קיימת, ו-`docker-compose` הוא v1. משתמש
> `ubuntu` לא root, לכן ה-RemoteDir הוא `/home/ubuntu/api` ולא תחת `/opt`.

```bash
mkdir -p /home/ubuntu/api
docker network create app_app-network   # אם לא קיימת (כבר קיימת בפועל)

# התחברות חד-פעמית ל-GHCR (החבילה פרטית) — PAT עם read:packages בלבד.
# (image ה-Strapi `ghcr.io/avi-adam/tov` ציבורי, לכן אין כרגע login שמור בשרת):
echo "$GHCR_PAT" | docker login ghcr.io -u <github-user> --password-stdin

# ליצור את קובץ ה-runtime env — נשאר רק בשרת, הסקריפט לא נוגע בו:
cat > /home/ubuntu/api/.env <<'EOF'
STRAPI_URL=http://strapi-blue:1337   # alias הקונטיינר הפעיל של Strapi ברשת המשותפת (blue/green)
ORIGIN=https://api.1lev1.com         # הדומיין הציבורי של האינסטנס (מאחורי Nginx)
BODY_SIZE_LIMIT=50M
ADMINMONTHER=...                     # ושאר הסודות שהשרת צריך בזמן ריצה
EOF
```

> **חיבור ל-Strapi:** Strapi רץ כאן בקונפיגורציית blue/green — יש aliases
> `strapi-blue` / `strapi-green`, וגם alias יציב בשם `strapi` שמוצמד תמיד
> לצבע הפעיל. **(2026-07-21) `deploy.ps1` (בריפו `1.0b`) מנהל את ה-alias
> `strapi` אוטומטית בכל דיפלוי** — מצמיד אותו לקונטיינר החדש לפני החלפת
> nginx (כשהוא עוד לא מקבל תנועה, בלי לגעת בקונטיינר הפעיל), ומנתק אותו
> מהישן אחרי שהוא נעצר. הוא גם מסנכרן את `/home/ubuntu/api/.env` ומפעיל
> מחדש את `sveltekit-api` כדי שיישאר תמיד `STRAPI_URL=http://strapi:1337` —
> **אין יותר צורך להחליף ידנית בין blue/green**. זה מחליף את הבאג החוזר
> שבו ה-API "מאבד קשר" ל-Strapi בכל דיפלוי כי איש לא עדכן את הצבע. 1337 לא
> מפורסם החוצה כלל.

### Nginx (TLS → הקונטיינר)

ה-nginx בשרת הזה רץ בעצמו כקונטיינר (`app_nginx_1`, config תחת `~/app/nginx/`),
לכן `127.0.0.1` שלו הוא לא ה-host. מוסיפים server block שמפנה **לפי שם הקונטיינר**
ברשת המשותפת (`sveltekit-api:3000`) — צריך לצרף את שירות ה-nginx ל-`app_app-network`
אם הוא עוד לא שם. (חלופה: `proxy_pass http://host.docker.internal:3000;` — ל-nginx
כאן כבר יש `extra_hosts: host.docker.internal:host-gateway` — כנגד ה-`127.0.0.1:3000`
שה-compose מפרסם על ה-host.)

```nginx
server {
    server_name api.1lev1.com;
    listen 443 ssl http2;
    # certbot certonly -d api.1lev1.com ...

    location / {
        proxy_pass http://sveltekit-api:3000;   # container-to-container על app_app-network
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 50m;
    }
}
```

## פריסה (מהמחשב המקומי, Windows)

ברירות המחדל של הסקריפט כבר מכוונות ל-VPS הקיים (`ubuntu@18.159.130.31`,
מפתח `~/Downloads/sail.pem`, `/home/ubuntu/api`), לכן בדרך כלל מריצים בלי פרמטרים:

```powershell
# חד-פעמי: התחברות ל-GHCR מהמחשב (PAT עם write:packages)
docker login ghcr.io -u <github-user>

# build + push ל-GHCR + pull בשרת + restart + health check
.\deploy-api.ps1

# רק לבדוק שה-build עובר
.\deploy-api.ps1 -BuildOnly

# לפרוס שוב image שכבר נבנה
.\deploy-api.ps1 -SkipBuild

# בלי GHCR — שילוח דרך tarball (docker save→scp→load)
.\deploy-api.ps1 -Tarball

# מעקב לוגים בסוף / שרת אחר / מפתח אחר
.\deploy-api.ps1 -Logs
.\deploy-api.ps1 -Server other.host -User root -SshKey C:\keys\vps.pem
```

אפשר גם לקבע `DEPLOY_SERVER` / `DEPLOY_USER` כמשתני סביבה במקום הפרמטרים.

הסקריפט מתייג ודוחף כל image ל-GHCR לפי ה-git sha הקצר
(`ghcr.io/avi-adam/1lev1-sveltekit-api:<sha>` + `:latest`), כך שתמיד אפשר
לחזור לגרסה קודמת:

```bash
# rollback בשרת — למשוך sha ספציפי ולתייג אותו כ-latest
docker pull ghcr.io/avi-adam/1lev1-sveltekit-api:<sha-קודם>
docker tag  ghcr.io/avi-adam/1lev1-sveltekit-api:<sha-קודם> ghcr.io/avi-adam/1lev1-sveltekit-api:latest
docker-compose -f /home/ubuntu/api/docker-compose.api.yml up -d
```

## לוגים — Docker → Axiom

הפרונט ב-Vercel כבר נשפך ל-Axiom דרך האינטגרציה. כדי שלא יהיו שני מקומות
לחפש בהם, גם הלוגים של השרת נשלחים לאותו Axiom.

**קונטיינר `vector`** (`timberio/vector:0.57.0-alpine`, מוגדר ב-`vector.toml`)
קורא את ה-Docker API ואוסף את הפלט של **כל** הקונטיינרים בשרת — `sveltekit-api`,
`app_nginx_1`, `app_strapi-blue_1`, `unified-action-socket-server` ו-`mastra-postgres` —
לא רק את מה שהאפליקציה בחרה לרשום. זה בכוונה: כשמשהו קורס, השורות
המעניינות הן דווקא של nginx (5xx) או של תהליך שמת לפני שהספיק לרשום כלום.

הקונפיג מפרסר JSON: לוגי pino של SvelteKit מגיעים כמחרוזת JSON בתוך `.message`,
והם נפרשים לשדות אמיתיים (`level`, `msg`, …) כדי שיהיו ניתנים לשאילתה ב-Axiom
במקום בלוק אטום אחד. `level` מספרי מתורגם למילים (`error`/`warn`/…).
nginx ו-Strapi רושמים טקסט חופשי ועוברים כמות שהם.

נדרש ב-`.env` שבשרת:
```
AXIOM_TOKEN=xaat-...      # API token עם הרשאת ingest ל-dataset
AXIOM_DATASET=vps-docker  # dataset נפרד מזה של Vercel; סינון לפי השדה service
```

### ⚠️ שתי מלכודות שעלו בהפעלה הראשונה (2026-08-05)

**1. ה-image לא קורא `vector.toml` מעצמו.** ל-`timberio/vector` אין בכלל
תיקיית `/etc/vector`, ונתיב ברירת המחדל שהוא מחפש הוא
`/etc/vector/vector.`**`yaml`**. bind mount של קובץ `.toml` פשוט לא נקרא,
והקונטיינר נכנס ל-crash-loop עם `Config file not found in path`. לכן השירות
מריץ `command: ["--config", "/etc/vector/vector.toml"]` מפורשות. אימות:
```bash
docker logs vector | grep 'Loading configs'   # -> paths=["/etc/vector/vector.toml"]
```

**2. ה-dataset חייב להיווצר מראש ב-Axiom.** Vector לא יוצר אותו, ורוב
ה-API tokens לא מורשים ליצור datasets (`403 ... action: create`) — צריך
Datasets → New ב-UI. כל עוד הוא חסר, ingest מחזיר `404 dataset not found`
ו-Vector מדווח עליו כ-`Unauthorized` (הוא ממפה כל non-2xx לשם), מה ששולח
לחיפוש אחרי בעיית הרשאות שלא קיימת. שים לב שה-**healthcheck של ה-sink עובר**
גם כשה-dataset חסר, אז "Healthcheck passed" בלוג לא מוכיח כלום. בדיקה אמיתית:
```bash
docker logs vector | grep -i 'events dropped'          # ריק = הכל נשלח
curl -s -H "Authorization: Bearer $AXIOM_TOKEN" https://api.axiom.co/v2/datasets
```

> **אבטחה:** ל-`vector` יש mount של `/var/run/docker.sock`. ה-`:ro` חל על קובץ
> ה-socket, **לא** על ה-API — כלומר לקונטיינר יש למעשה גישת root לדוקר. זו
> העלות של קבלת שם הקונטיינר כמטא-דאטה; החלופה היא לקרוא את קבצי ה-json
> הגולמיים ולוותר על התוויות.

### רוטציה של לוגים

עד 2026-08 לא הייתה **שום** רוטציה על השרת (`/var/lib/docker/containers/*.log`
גדלו בלי גבול; nginx הגיע ל-28MB). עכשיו:

- `/etc/docker/daemon.json` מגדיר `max-size: 10m` / `max-file: 3` כברירת מחדל
  גלובלית — **אבל היא חלה רק על קונטיינרים שנוצרים אחרי restart של הדימון**,
  ולכן היא לא הופעלה רטרואקטיבית (זה היה מפיל את כל הפרודקשן).
- לכן `docker-compose.api.yml` מגדיר `logging:` מפורש (anchor `*json-log`) על
  שלושת השירותים שלו — כך הרוטציה אמיתית כבר מה-`up -d` הבא, בלי bounce לדימון.
- `app_nginx_1` ו-`app_strapi-blue_1` מגיעים מ-compose אחר (ריפו `1.0b`) ויקבלו
  את ברירת המחדל בפעם הבאה שהם נוצרים מחדש.

`docker logs` ממשיך לעבוד כרגיל — Vector רק מעתיק את הזרם החוצה, ואם הוא נופל
לא הולכים לאיבוד לוגים מקומיים.

## ⚠️ api.1lev1.com הוא לא Strapi

`api.1lev1.com` הוא אינסטנס SvelteKit (הפרוקסי) — אין בו REST/GraphQL של Strapi.
**אסור** להצביע עליו עם `VITE_URL` / `STRAPI_URL`: זה יגרום לכל קריאות Strapi
(למשל `/api/user-keys` של ה-consent mirror) לפגוע בפרוקסי ולקבל 404 (קרה בפועל
2026-07-16). הערכים הנכונים:

| משתנה | dev מקומי / Vercel | בקונטיינר בשרת (`/home/ubuntu/api/.env`) |
|---|---|---|
| `STRAPI_URL` / `VITE_URL` | `https://tovmeod.1lev1.com` | `http://strapi:1337` (stable alias, see above — no longer `strapi-blue`/`strapi-green`) |

(אגב, `GET /api/env` / `GET /api/config` שמופיעים בלוגים של הקונטיינר הם סריקות
בוטים על הדומיין הציבורי — לא קוד שלנו; אפשר להתעלם.)

## ⚠️ הערות build חשובות

- **החלפת קונטיינר רץ:** `deploy-api.ps1` מוחק בכוח את הקונטיינרים בין ה-pull
  ל-`up -d`. במקור זה היה רק בגלל name conflict, אבל מ-2026-08-04 זו **דרישה
  קשיחה**:

  > **⚠️ compose v1 לא מסוגל ל-recreate קונטיינר עם volumes.**
  > לשרת יש `docker-compose` 1.29.2 מול Docker 29 — ו-`up -d` על שירות קיים
  > שהקונפיג שלו השתנה קורס עם
  > `KeyError: 'ContainerConfig'` (ב-`get_container_data_volumes`; ה-image
  > manifest המודרני כבר לא מכיל את השדה הזה).
  > **גרוע מזה:** compose משנה את שם הקונטיינר הישן ל-`<hash>_<name>` *לפני*
  > הקריסה, כך שריצה כושלת משאירה קונטיינר יתום — והריצה הבאה נופלת שוב.
  > קרה בפועל על `mastra-postgres`.
  >
  > העקיפה: לכפות את מסלול ה-**create** ע"י מחיקת כל הקונטיינרים (כולל
  > המשוכפלים ששונו שמם) לפני `up -d` — זה מה ש-`$RemoveStale` בסקריפט עושה.
  > ה-volumes הם named, אז `mastra-postgres` שומר על הדאטה שלו.
  >
  > **התיקון האמיתי:** להתקין את plugin של compose v2 בשרת
  > (`sudo apt install docker-compose-plugin`). הוא מותקן *לצד* v1 ולא משנה
  > את ההתנהגות של שום סקריפט שקורא `docker-compose`, ו-`deploy-api.ps1` כבר
  > מעדיף אותו אוטומטית אם הוא קיים. טרם בוצע.

- **ה-`.env` הלוקאלי נדרש בזמן build** (ערכי `VITE_*` ו-`$env/static` נטמעים
  ב-bundle). הוא מועבר כ-BuildKit secret ולא נשאר ב-image.
- **✅ (2026-07-16) המעבר ל-runtime הושלם:** כל קבצי השרת קוראים את כתובת Strapi
  דרך `src/lib/server/strapiUrl.js` (`$env/dynamic/private` → `STRAPI_URL` מתוך
  ה-`.env` שבשרת, fallback ל-`VITE_URL` ב-dev). כלומר `STRAPI_URL`
  ב-`/home/ubuntu/api/.env` נכנס לתוקף ב-restart, בלי rebuild. ⚠️ לוודא ש-`STRAPI_URL`
  מופיע **פעם אחת בלבד** בקובץ — שורה כפולה מאוחרת דורסת את הפנימית (קרה בפועל).
- **✅ (2026-07-21) `STRAPI_URL` כבר לא תלוי בצבע:** `deploy.ps1` מצמיד alias
  `strapi` יציב לקונטיינר הפעיל בכל דיפלוי ומסנכרן את `.env` + מפעיל מחדש
  את `sveltekit-api` אוטומטית (ראו סעיף "חיבור ל-Strapi" למעלה). לפני זה
  `STRAPI_URL=http://strapi-blue:1337` היה נשאר תקוע כשהצבע הפעיל מתחלף,
  וה-API "מאבד קשר" ל-Strapi בכל דיפלוי — זה היה באג חוזר, לא תקלה חד-פעמית.
- ל-`.env` שבשרת יש להוסיף גם `SOCKET_SERVER_URL=http://unified-action-socket-server:3001`
  (ברירת המחדל `localhost:3001` לא מגיעה לקונטיינר ה-socket) ואופציונלית `REND_URL`
  (יעד `api/pingrama`; ברירת מחדל `https://api.1lev1.com/` — החליף את rend.1lev1.com).
- ה-runtime env (`/opt/1lev1/api/.env`) נטען דרך `env_file` של ה-compose —
  זמין ל-`$env/dynamic/private` בלי rebuild.
- `ORIGIN` חובה ל-adapter-node (בדיקות origin/CSRF מאחורי proxy).
- `BODY_SIZE_LIMIT` הוגדל מ-512kb כדי ש-`/api/upload` יעבוד.
