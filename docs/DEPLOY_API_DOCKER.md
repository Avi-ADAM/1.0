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
| `docker-compose.api.yml` | הרצת הקונטיינר בשרת: פורט 3000 על loopback בלבד, `env_file: .env` מקומי לשרת, רשת `app_app-network` משותפת עם Strapi וה-socket-server. |
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

- **החלפת קונטיינר רץ:** `deploy-api.ps1` עושה `docker rm -f sveltekit-api` בין
  ה-pull ל-`up -d` — compose v1 נכשל על name conflict כשהקונטיינר הרץ לא נוצר
  מאותו compose project (למשל אחרי הרצה ידנית).

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
