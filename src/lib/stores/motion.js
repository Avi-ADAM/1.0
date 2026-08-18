import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { theme, THEMES } from './theme.js';

/**
 * motion.js — the single place that decides how much the homepage's 3D scene
 * moves.
 *
 * Before this module every animating component made the call for itself: three
 * separate copies of
 *
 *     const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
 *
 * each read **once at module load**, so the value never changed when the OS
 * preference did, and each one only muted part of its own scene. There was no
 * way for a visitor to ask for less motion, which is the case that actually
 * matters: `prefers-reduced-motion` only helps people who already set it at the
 * OS level. A visitor who simply gets tired of the movement after a few minutes
 * had nothing to press — and WCAG 2.2 SC 2.2.2 (Pause, Stop, Hide, level A)
 * requires that anything which moves automatically for more than five seconds
 * alongside other content can be stopped.
 *
 * Three things feed the decision, in falling priority:
 *
 *   1. an explicit choice by the visitor (persisted in a cookie), which always wins;
 *   2. `prefers-reduced-motion: reduce` from the OS;
 *   3. the active theme — the `business` ("professional") identity is the quiet
 *      one, so it settles the scene by default.
 *
 * On top of the resolved mode there is a **time** axis that nothing else models:
 * even at full motion the scene eases down to a slow drift once the visitor
 * stops interacting, and wakes back up the moment they scroll or move the
 * pointer. That is the "it starts to bother the eye after a few minutes"
 * complaint — the motion is welcome while you are engaging with it and
 * unwelcome while you are reading.
 */

/**
 * @typedef {'full' | 'calm' | 'off'} MotionMode
 *   full — the scene animates, with the idle slow-down below.
 *   calm — the scene is drawn and still composes with scroll, but nothing moves
 *          on its own. This is "pause", not "hide": the artwork survives.
 *   off  — the scene is not rendered at all, so its GLB assets never load.
 */

/** @typedef {MotionMode | 'auto'} MotionChoice */

/** @type {Record<MotionMode, MotionMode>} */
export const MOTION_MODES = {
  full: 'full',
  calm: 'calm',
  off: 'off'
};

export const MOTION_COOKIE = 'motion';
const MOTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/* --- the idle ramp ------------------------------------------------------- */

/** Quiet time before the scene starts easing down. */
const IDLE_AFTER_MS = 6000;
/** How long the easing itself takes, so it reads as calming, not as a stall. */
const RAMP_MS = 5000;
/** Where it settles: slow enough to stop pulling the eye, alive enough to breathe. */
const IDLE_FLOOR = 0.12;

/** @param {string} name */
function readCookie(name) {
  if (!browser) return undefined;
  const hit = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

/**
 * @param {unknown} raw
 * @returns {MotionChoice}
 */
function normalizeChoice(raw) {
  const key = String(raw ?? '').trim().toLowerCase();
  // hasOwnProperty rather than a bare lookup: `motion=constructor` would
  // otherwise resolve off Object.prototype, the same trap app.html guards.
  return Object.prototype.hasOwnProperty.call(MOTION_MODES, key)
    ? /** @type {MotionMode} */ (key)
    : 'auto';
}

/**
 * The visitor's explicit choice, or `auto` when they have not made one.
 * Read synchronously at import so the first client render already knows
 * whether to mount the canvas — a visitor who turned the scene off must never
 * pay to download its models.
 * @type {import('svelte/store').Writable<MotionChoice>}
 */
export const motionChoice = writable(
  browser ? normalizeChoice(readCookie(MOTION_COOKIE)) : 'auto'
);

/** Live `prefers-reduced-motion`, not a one-shot read at module load. */
const prefersReduced = writable(
  browser
    ? (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
    : false
);

if (browser) {
  motionChoice.subscribe((value) => {
    if (value === 'auto') {
      document.cookie = `${MOTION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    } else {
      document.cookie = `${MOTION_COOKIE}=${value}; path=/; max-age=${MOTION_COOKIE_MAX_AGE}; SameSite=Lax`;
    }
  });

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onChange = () => prefersReduced.set(mq.matches);
  // Safari < 14 only has the deprecated listener API — the same fallback
  // theme.js uses for its colour-scheme query.
  if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
  else mq.addListener(onChange);
}

/**
 * The mode actually in force, after the visitor's choice, the OS preference and
 * the theme have all had their say.
 * @type {import('svelte/store').Readable<MotionMode>}
 */
export const motionMode = derived(
  [motionChoice, prefersReduced, theme],
  ([$choice, $reduced, $theme]) => {
    if ($choice !== 'auto') return $choice;
    if ($reduced) return MOTION_MODES.calm;
    // The business identity is the restrained one. Someone who picked the
    // professional look is telling us the same thing the pause button does.
    if ($theme === THEMES.business) return MOTION_MODES.calm;
    return MOTION_MODES.full;
  }
);

/** Whether the 3D canvas should be mounted at all. */
export const sceneVisible = derived(motionMode, ($mode) => $mode !== MOTION_MODES.off);

/** Whether anything in the scene may animate on its own. */
export const sceneAnimates = derived(motionMode, ($mode) => $mode === MOTION_MODES.full);

/** The same decision, named for consumers that are not the 3D scene. The
    complaint that started this store was "the movement bothers the eye after a
    few minutes", and it was never only about the scene - the bot launcher
    bobs on an infinite loop too. Anything that animates unprompted, forever,
    reads this. */
export const ambientAnimates = sceneAnimates;

/* --- per-frame speed ----------------------------------------------------- */

/*
 * Deliberately NOT a store. This value changes every frame, and pushing it
 * through Svelte's reactivity 60 times a second would invalidate every
 * subscriber for nothing — the only readers are `useTask` callbacks, which
 * already run per frame and can just call the function.
 */

let lastActivity = browser ? performance.now() : 0;

/*
 * A plain mirror of `motionMode`, kept current by a subscription. `motionSpeed`
 * runs once per animating component per frame, and `get()` on a derived store
 * costs a subscribe/unsubscribe cycle every call — cheap once, wasteful at
 * 60fps × several components.
 */
let currentMode = /** @type {MotionMode} */ (MOTION_MODES.full);
motionMode.subscribe((value) => {
  currentMode = value;
});

/**
 * Wake the scene back to full speed. Wired to scroll/pointer/key on the
 * homepage — the visitor engaging with the page is the signal that motion is
 * wanted again.
 */
export function noteMotionActivity() {
  if (browser) lastActivity = performance.now();
}

/**
 * The multiplier every animating component applies to its frame delta.
 *
 *   calm/off → 0        (nothing advances)
 *   full     → 1, easing to IDLE_FLOOR once the visitor has been still
 *
 * @returns {number} 0..1
 */
export function motionSpeed() {
  if (!browser) return 0;
  if (currentMode !== MOTION_MODES.full) return 0;

  const idle = performance.now() - lastActivity - IDLE_AFTER_MS;
  if (idle <= 0) return 1;
  if (idle >= RAMP_MS) return IDLE_FLOOR;

  // smoothstep, so neither the departure from full speed nor the arrival at
  // the floor has a visible corner.
  const t = idle / RAMP_MS;
  return 1 - (1 - IDLE_FLOOR) * (t * t * (3 - 2 * t));
}

/** @param {MotionChoice} next */
export function setMotionChoice(next) {
  motionChoice.set(next === 'auto' ? 'auto' : normalizeChoice(next));
  noteMotionActivity();
}

/**
 * The order the control button cycles through: play → pause → hide → play.
 * @param {MotionChoice} current
 * @returns {MotionMode}
 */
export function nextMotionMode(current) {
  if (current === MOTION_MODES.full) return MOTION_MODES.calm;
  if (current === MOTION_MODES.calm) return MOTION_MODES.off;
  return MOTION_MODES.full;
}
