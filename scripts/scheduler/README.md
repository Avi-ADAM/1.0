# 1lev1 scheduler

The clock the platform runs on. Two jobs here decide things on their own, and
until this existed both ran only when somebody remembered to call them:

| job | endpoint | default schedule | what it does |
|---|---|---|---|
| `timegrama` | `GET /api/timegrama` | every 10 minutes | matures every deadline that has arrived — "silence is consent" only happens if something looks at the clock |
| `monthi` | `GET /api/monthi` | once a calendar month, from the 1st at 03:00 | files each month's hours from the timers and resets the counter; opens recurring resource and standing-order cycles |
| `maagad` | `GET /api/cron/maagad` | daily at 04:00 | clusters open wishes into demand pools, expires stale offers |

Every job is safe to run more often than needed: `timegrama` skips clocks that
have not arrived, `monthi` writes only what actually changed, `maagad` refuses
to open a cycle that already exists. The schedules therefore err toward running
rather than missing.

**`monthi` catches up.** Its window is "the 1st onwards", not "the 1st". A box
that was down on the 1st runs the moment it comes back on the 2nd — the miss
that used to cost a whole month of somebody's ledger.

## Install on a fresh server

Ubuntu 20.04 / 22.04, Node 18+ (`node --version`; install with
`curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs`).

```bash
sudo mkdir -p /opt/1lev1-scheduler
sudo cp scheduler.mjs /opt/1lev1-scheduler/
sudo cp README.md     /opt/1lev1-scheduler/
sudo cp 1lev1-scheduler.service /etc/systemd/system/

# Point SCHEDULER_ENV_FILE at the API's own .env and set TZ:
sudo systemctl edit --full 1lev1-scheduler   # or edit the unit directly

sudo systemctl daemon-reload
sudo systemctl enable --now 1lev1-scheduler
```

Check it:

```bash
sudo systemctl status 1lev1-scheduler
journalctl -u 1lev1-scheduler -f
```

## Before enabling it — prove it works, change nothing

```bash
cd /opt/1lev1-scheduler
node scheduler.mjs --status          # config, last runs, what is due
node scheduler.mjs --once --dry      # runs what is due; monthi in dry mode
node scheduler.mjs --run monthi --dry
```

`--dry` is dry for every job. `monthi` runs against `?dry=1`; `timegrama` and
`maagad` have no preview mode, so they are logged and **not called** rather than
quietly matured for real. And a dry run never marks a month closed, so previewing
the close cannot make the real one skip itself.

## Configuration

Environment variables win over the `.env` file; the `.env` file is found at
`SCHEDULER_ENV_FILE`, else `./.env`, else next to the script, else the repo root.

| variable | default | meaning |
|---|---|---|
| `SCHEDULER_BASE_URL` | `http://127.0.0.1:3000` | where the API answers — loopback, the same port Nginx proxies to |
| `SCHEDULER_ENV_FILE` | first `.env` found | where the secrets come from |
| `SCHEDULER_STATE_FILE` | next to the script | what ran and when |
| `SCHEDULER_TICK_SECONDS` | `60` | how often the loop looks at the clock |
| `SCHEDULER_DISABLE` | — | comma-separated job names to leave alone |
| `SCHEDULER_TIMEGRAMA_MINUTES` | `10` | maturation-clock interval |
| `SCHEDULER_MONTHI_DAY` / `_HOUR` | `1` / `3` | earliest the monthly close may run |
| `SCHEDULER_MAAGAD_HOUR` | `4` | earliest the daily batch may run |
| `SCHEDULER_FAILURE_BACKOFF_MINUTES` | `15` | how long a failed job waits before it is tried again |
| `SCHEDULER_ALERT_AFTER_FAILURES` | `3` | consecutive failures before a Telegram alert |
| `ADMINMONTHER` | — | **required by `monthi`** — sent as `x-monthi-key` |
| `CRON_SECRET` | — | sent to `/api/cron/maagad` when the endpoint asks for it |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | — | optional; without them, alerts are simply not sent |

`monthi` holds itself back rather than failing when `ADMINMONTHER` is missing —
`--status` says so in plain words.

## Timezone

Both the scheduler and the app do month arithmetic in **local time**, so the box
has to agree with the rikma about when a month ends. The unit sets
`TZ=Asia/Jerusalem`; change it there, not in the code.

## If you would rather not run a daemon

`--once` is a complete run of whatever is due, so a systemd timer or a plain
crontab works just as well and keeps the same state file and the same catch-up
behaviour:

```cron
*/10 * * * * cd /opt/1lev1-scheduler && /usr/bin/node scheduler.mjs --once >> /var/log/1lev1-scheduler.log 2>&1
```

## Adding a job

One entry in the `JOBS` array in `scheduler.mjs`: a `path`, a `due(now, state)`
that returns the reason it should run (or `null`), and optionally `onSuccess` to
record what it just covered. `due` returning a sentence rather than a boolean is
the point — the log then says *why* something ran.

Anything added here must be safe to run twice: the scheduler retries after a
failure, and a failure whose write already landed is indistinguishable from one
that did not.
