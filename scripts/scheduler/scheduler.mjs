#!/usr/bin/env node
/**
 * 1lev1 scheduler — the clock the platform did not have.
 *
 * Two jobs on this box actually decide things, and until now both ran only when
 * somebody remembered to call them:
 *
 *   · /api/timegrama — the maturation clock. "Silence is consent, at the
 *     rikma's pace" is only true if something checks the deadlines; a timegrama
 *     nobody looks at never matures, and the standing version never takes
 *     effect.
 *   · /api/monthi — the monthly close. A month that goes by without a run used
 *     to be lost for good; it self-heals now (reconcileMonter files every month
 *     the timers can account for), but only once it is actually called.
 *
 * Deliberately dependency-free and single-file: moving to another server is
 * copying this directory and enabling the unit. Node 18+ (built-in fetch).
 *
 *   node scheduler.mjs             run the loop (what the systemd unit does)
 *   node scheduler.mjs --once      run whatever is due right now, then exit
 *   node scheduler.mjs --run monthi   force one job, ignoring its schedule
 *   node scheduler.mjs --status    print state and what is due, change nothing
 *   node scheduler.mjs --dry       decide out loud, and ask monthi for a dry run
 *
 * `--once` exists so this can equally be driven by a systemd timer or plain
 * cron; the schedule and the state file behave identically either way.
 *
 * See README.md in this directory for installing it on a fresh box.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ── configuration ───────────────────────────────────────────────────────────

/**
 * Reads `.env` for the values the endpoints need, so the scheduler can sit
 * beside the compose file and share its secrets. A real environment variable
 * always wins — that is how the systemd unit overrides anything.
 */
function loadEnvFile(file) {
  const out = {};
  if (!file || !fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z_0-9]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2].trim();
    // Strip one layer of matching quotes, the way a shell would.
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}

const ENV_FILE =
  process.env.SCHEDULER_ENV_FILE ||
  [path.join(process.cwd(), '.env'), path.join(HERE, '.env'), path.join(HERE, '../../.env')].find(
    (p) => fs.existsSync(p)
  ) ||
  '';

const fileEnv = loadEnvFile(ENV_FILE);
/** Environment first, `.env` second, default last. */
const cfg = (name, fallback = '') => process.env[name] ?? fileEnv[name] ?? fallback;
const num = (name, fallback) => {
  const raw = cfg(name, '');
  const n = Number(raw);
  return raw !== '' && Number.isFinite(n) ? n : fallback;
};

const BASE_URL = cfg('SCHEDULER_BASE_URL', 'http://127.0.0.1:3000').replace(/\/+$/, '');
const STATE_FILE = cfg('SCHEDULER_STATE_FILE', path.join(HERE, 'scheduler-state.json'));
const TICK_MS = num('SCHEDULER_TICK_SECONDS', 60) * 1000;
const DISABLED = new Set(
  cfg('SCHEDULER_DISABLE', '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

/** Wait this long before retrying a job that just failed. */
const FAILURE_BACKOFF_MS = num('SCHEDULER_FAILURE_BACKOFF_MINUTES', 15) * 60 * 1000;
/** Alert only once a job has failed this many times in a row. */
const ALERT_AFTER_FAILURES = num('SCHEDULER_ALERT_AFTER_FAILURES', 3);

const ADMINMONTHER = cfg('ADMINMONTHER', '');
const CRON_SECRET = cfg('CRON_SECRET', '');

// ── jobs ────────────────────────────────────────────────────────────────────

/**
 * `due(now, state)` answers whether the job should run, and returns the reason
 * so the log says *why* rather than just that something happened.
 *
 * Every job here is safe to run more often than needed — timegrama skips
 * clocks that have not arrived, monthi writes only what actually changed — so
 * the schedules err toward running rather than missing.
 */
const JOBS = [
  {
    name: 'timegrama',
    description: 'maturation clock — deadlines that have arrived',
    path: '/api/timegrama',
    timeoutMs: num('SCHEDULER_TIMEGRAMA_TIMEOUT_SECONDS', 300) * 1000,
    headers: () => (cfg('TIMEGRAMA_KEY', '') ? { 'x-timegrama-key': cfg('TIMEGRAMA_KEY') } : {}),
    due(now, state) {
      const every = num('SCHEDULER_TIMEGRAMA_MINUTES', 10) * 60 * 1000;
      if (!state.lastSuccess) return 'never run on this box';
      const since = now.getTime() - Date.parse(state.lastSuccess);
      return since >= every ? `${Math.round(since / 60000)}m since the last run` : null;
    }
  },
  {
    name: 'monthi',
    description: 'monthly close — file each month from the timers',
    path: '/api/monthi',
    dryPath: '/api/monthi?dry=1',
    timeoutMs: num('SCHEDULER_MONTHI_TIMEOUT_SECONDS', 900) * 1000,
    headers: () => (ADMINMONTHER ? { 'x-monthi-key': ADMINMONTHER } : {}),
    requires: [['ADMINMONTHER', ADMINMONTHER]],
    due(now, state) {
      const day = num('SCHEDULER_MONTHI_DAY', 1);
      const hour = num('SCHEDULER_MONTHI_HOUR', 3);
      const month = monthKey(now);
      if (state.lastMonth === month) return null;
      // Catch-up is the whole point: the window is "day D onwards", not "day D".
      // A box that was down on the 1st runs the moment it comes back on the 2nd,
      // which is exactly the miss that used to cost a whole month.
      if (now.getDate() < day) return null;
      if (now.getDate() === day && now.getHours() < hour) return null;
      const late = now.getDate() > day;
      return `${month} not closed yet${late ? ` (late — it is the ${now.getDate()}th)` : ''}`;
    },
    onSuccess(state, now) {
      state.lastMonth = monthKey(now);
    }
  },
  {
    name: 'maagad',
    description: 'demand pools — cluster open wishes, expire stale offers',
    path: CRON_SECRET ? `/api/cron/maagad?key=${encodeURIComponent(CRON_SECRET)}` : '/api/cron/maagad',
    timeoutMs: num('SCHEDULER_MAAGAD_TIMEOUT_SECONDS', 300) * 1000,
    due(now, state) {
      const hour = num('SCHEDULER_MAAGAD_HOUR', 4);
      const day = dayKey(now);
      if (state.lastDay === day) return null;
      if (now.getHours() < hour) return null;
      return `${day} not run yet`;
    },
    onSuccess(state, now) {
      state.lastDay = dayKey(now);
    }
  }
];

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const dayKey = (d) => `${monthKey(d)}-${String(d.getDate()).padStart(2, '0')}`;

// ── state ───────────────────────────────────────────────────────────────────

function readState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    // A missing or unreadable state file means "nothing has run yet", which is
    // the safe reading: every job is idempotent, so the worst case is one extra
    // run rather than a silently skipped month.
    return {};
  }
}

/** Written through a temp file so a kill mid-write cannot truncate the state. */
function writeState(state) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    const tmp = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, STATE_FILE);
  } catch (e) {
    log('error', 'scheduler', `could not write the state file (${STATE_FILE}): ${e.message}`);
  }
}

// ── logging & alerting ──────────────────────────────────────────────────────

function log(level, job, message) {
  const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} ${String(job).padEnd(10)} ${message}`;
  if (level === 'error') console.error(line);
  else console.log(line);
}

/**
 * A monthly job that fails quietly is indistinguishable from one that never ran
 * — the failure mode this whole scheduler exists to end. Optional: it only
 * fires when a bot token and chat are configured.
 */
async function alert(text) {
  const token = cfg('TELEGRAM_BOT_TOKEN', cfg('VITE_TELEGRAM_BOT_TOKEN', ''));
  const chatId = cfg('TELEGRAM_CHAT_ID', cfg('VITE_TELEGRAM_CHAT_ID', ''));
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (e) {
    log('error', 'scheduler', `alert could not be sent: ${e.message}`);
  }
}

// ── running one job ─────────────────────────────────────────────────────────

async function runJob(job, state, { dry }) {
  const jobState = (state[job.name] ??= {});

  // "Dry" has to mean dry for every job, not just the one that happens to have
  // a preview mode. An endpoint with nothing to offer but the real thing is not
  // called at all — a dry run that quietly matured a deadline or opened a cycle
  // would be worse than no dry run, because it would be trusted.
  if (dry && !job.dryPath) {
    log('info', job.name, `dry run — would call ${job.path}, not calling it (this endpoint has no preview mode)`);
    return true;
  }

  const target = BASE_URL + (dry && job.dryPath ? job.dryPath : job.path);
  const started = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), job.timeoutMs);
  try {
    const res = await fetch(target, {
      headers: { Accept: 'application/json', ...job.headers?.() },
      signal: controller.signal
    });
    const body = (await res.text()).slice(0, 800);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);

    if (!res.ok) throw new Error(`HTTP ${res.status} — ${body}`);

    log('info', job.name, `ok in ${seconds}s — ${body || '(empty response)'}`);
    jobState.lastSuccess = new Date().toISOString();
    jobState.failures = 0;
    delete jobState.lastError;
    // Only a real run advances the calendar. A dry run must never let the month
    // be marked closed, or the close it was previewing would never happen.
    if (!dry) job.onSuccess?.(jobState, new Date());
    return true;
  } catch (e) {
    const reason = e.name === 'AbortError' ? `timed out after ${job.timeoutMs / 1000}s` : e.message;
    log('error', job.name, `FAILED — ${reason}`);
    jobState.failures = (jobState.failures ?? 0) + 1;
    jobState.lastFailure = new Date().toISOString();
    jobState.lastError = reason;
    if (jobState.failures === ALERT_AFTER_FAILURES) {
      await alert(`1lev1 scheduler: "${job.name}" has failed ${jobState.failures} times in a row.\n${reason}`);
    }
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Why a job is being held back, or null when nothing is holding it. */
function blockedReason(job, jobState, now) {
  if (DISABLED.has(job.name)) return 'disabled by SCHEDULER_DISABLE';
  for (const [name, value] of job.requires ?? []) {
    if (!value) return `${name} is not set`;
  }
  if (jobState.lastFailure && (jobState.failures ?? 0) > 0) {
    const wait = Date.parse(jobState.lastFailure) + FAILURE_BACKOFF_MS - now.getTime();
    if (wait > 0) {
      return `backing off after ${jobState.failures} failure(s), ${Math.ceil(wait / 60000)}m left`;
    }
  }
  return null;
}

/** One pass over every job. Sequential on purpose — these write to one Strapi. */
async function tick({ dry }) {
  const state = readState();
  const now = new Date();
  let ran = 0;

  for (const job of JOBS) {
    const jobState = (state[job.name] ??= {});
    const blocked = blockedReason(job, jobState, now);
    if (blocked) continue;

    const reason = job.due(now, jobState);
    if (!reason) continue;

    log('info', job.name, `due: ${reason}${dry ? ' (dry run)' : ''}`);
    await runJob(job, state, { dry });
    writeState(state);
    ran++;
  }

  if (ran === 0) writeState(state);
  return ran;
}

// ── entry points ────────────────────────────────────────────────────────────

function printStatus() {
  const state = readState();
  const now = new Date();
  console.log(`base url   : ${BASE_URL}`);
  console.log(`env file   : ${ENV_FILE || '(none found)'}`);
  console.log(`state file : ${STATE_FILE}`);
  console.log(`now        : ${now.toISOString()} (local ${now.toString()})`);
  console.log('');
  for (const job of JOBS) {
    const s = state[job.name] ?? {};
    const blocked = blockedReason(job, s, now);
    const reason = blocked ? null : job.due(now, s);
    console.log(`${job.name} — ${job.description}`);
    console.log(`   last success : ${s.lastSuccess ?? 'never'}`);
    if (s.lastMonth) console.log(`   last month   : ${s.lastMonth}`);
    if (s.lastDay) console.log(`   last day     : ${s.lastDay}`);
    if (s.lastError) console.log(`   last error   : ${s.lastError} (${s.failures} in a row)`);
    console.log(`   now          : ${blocked ? `held — ${blocked}` : reason ? `DUE — ${reason}` : 'not due'}`);
    console.log('');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
    return;
  }
  if (args.includes('--status')) return printStatus();

  const forceIdx = args.indexOf('--run');
  if (forceIdx !== -1) {
    const name = args[forceIdx + 1];
    const job = JOBS.find((j) => j.name === name);
    if (!job) {
      console.error(`unknown job "${name}". known: ${JOBS.map((j) => j.name).join(', ')}`);
      process.exitCode = 1;
      return;
    }
    const state = readState();
    log('info', job.name, `forced${dry ? ' (dry run)' : ''}`);
    const ok = await runJob(job, state, { dry });
    writeState(state);
    process.exitCode = ok ? 0 : 1;
    return;
  }

  if (args.includes('--once')) {
    const ran = await tick({ dry });
    log('info', 'scheduler', `--once finished, ${ran} job(s) ran`);
    return;
  }

  log('info', 'scheduler', `starting — base ${BASE_URL}, tick ${TICK_MS / 1000}s, state ${STATE_FILE}`);
  log('info', 'scheduler', `jobs: ${JOBS.map((j) => j.name).join(', ')}${DISABLED.size ? ` (disabled: ${[...DISABLED].join(', ')})` : ''}`);

  let stopping = false;
  let sleeper = null;
  const stop = (signal) => {
    if (stopping) return;
    stopping = true;
    log('info', 'scheduler', `${signal} — stopping after the current pass`);
    if (sleeper) clearTimeout(sleeper);
  };
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));

  while (!stopping) {
    try {
      await tick({ dry });
    } catch (e) {
      // A pass that throws must not take the loop down with it — a scheduler
      // that dies is the failure it is here to prevent.
      log('error', 'scheduler', `pass failed: ${e.stack || e.message}`);
    }
    if (stopping) break;
    await new Promise((resolve) => {
      sleeper = setTimeout(resolve, TICK_MS);
    });
  }
  log('info', 'scheduler', 'stopped');
}

main().catch((e) => {
  log('error', 'scheduler', `fatal: ${e.stack || e.message}`);
  process.exitCode = 1;
});
