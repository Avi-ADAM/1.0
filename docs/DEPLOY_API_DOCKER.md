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
| `deploy-api.ps1` | build לוקאלי → `docker save` → scp לשרת → `docker load` + `compose up -d` + health check. אותו flow כמו סקריפט הפריסה של Strapi. |
| `src/routes/api/health/+server.js` | endpoint ל-HEALTHCHECK של Docker ול-Nginx. |

## הכנה חד-פעמית בשרת

```bash
mkdir -p /opt/1lev1/api
docker network create app_app-network   # אם לא קיימת (ה-socket-server כבר משתמש בה)

# ליצור את קובץ ה-runtime env — נשאר רק בשרת, הסקריפט לא נוגע בו:
cat > /opt/1lev1/api/.env <<'EOF'
STRAPI_URL=http://strapi:1337        # שם הקונטיינר של Strapi ברשת המשותפת
ORIGIN=https://api.1lev1.com         # הדומיין הציבורי של האינסטנס (מאחורי Nginx)
BODY_SIZE_LIMIT=50M
ADMINMONTHER=...                     # ושאר הסודות שהשרת צריך בזמן ריצה
EOF
```

> **חיבור ל-Strapi:** אם Strapi רץ כקונטיינר — לצרף אותו לרשת
> `app_app-network` (ואז `STRAPI_URL=http://strapi:1337`, בלי לפרסם את 1337
> החוצה בכלל). אם Strapi רץ ישירות על המכונה ומאזין על `127.0.0.1` — להריץ את
> ה-compose עם `network_mode: host` או לפתוח bind נוסף לרשת ה-docker; הרשת
> המשותפת היא הדרך המומלצת.

### Nginx (TLS → הקונטיינר)

```nginx
server {
    server_name api.1lev1.com;
    listen 443 ssl http2;
    # certbot certonly -d api.1lev1.com ...

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 50m;
    }
}
```

## פריסה (מהמחשב המקומי, Windows)

```powershell
# build + push + restart + health check
.\deploy-api.ps1 -Server 1lev1.com -User root

# רק לבדוק שה-build עובר
.\deploy-api.ps1 -BuildOnly

# לפרוס שוב image שכבר נבנה
.\deploy-api.ps1 -Server 1lev1.com -User root -SkipBuild

# עם מפתח ssh ספציפי + מעקב לוגים בסוף
.\deploy-api.ps1 -Server 1lev1.com -User root -SshKey C:\keys\vps.pem -Logs
```

אפשר גם לקבע `DEPLOY_SERVER` / `DEPLOY_USER` כמשתני סביבה במקום הפרמטרים.

הסקריפט מתייג את ה-image לפי ה-git sha הקצר (`1lev1/sveltekit-api:<sha>` +
`:latest`), כך שתמיד אפשר לחזור לגרסה קודמת:

```bash
# rollback בשרת
docker tag 1lev1/sveltekit-api:<sha-קודם> 1lev1/sveltekit-api:latest
docker compose -f /opt/1lev1/api/docker-compose.api.yml up -d
```

## ⚠️ הערות build חשובות

- **ה-`.env` הלוקאלי נדרש בזמן build** (ערכי `VITE_*` ו-`$env/static` נטמעים
  ב-bundle). הוא מועבר כ-BuildKit secret ולא נשאר ב-image. שים לב למלכודת
  `VITE_URL` המתוארת ב-`PLAN_PROXY_SECURITY.md` סעיף 5 — כל עוד קבצי השרת
  משתמשים ב-`VITE_URL`, הערך שנטמע ב-build הזה הוא שיקבע לאן הפרוקסי פונה.
  אחרי המעבר ל-`STRAPI_URL` (`$env/dynamic/private`) הכתובת תיקבע בזמן ריצה
  מה-`.env` שבשרת.
- ה-runtime env (`/opt/1lev1/api/.env`) נטען דרך `env_file` של ה-compose —
  זמין ל-`$env/dynamic/private` בלי rebuild.
- `ORIGIN` חובה ל-adapter-node (בדיקות origin/CSRF מאחורי proxy).
- `BODY_SIZE_LIMIT` הוגדל מ-512kb כדי ש-`/api/upload` יעבוד.
