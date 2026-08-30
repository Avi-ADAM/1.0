/**
 * The one handle on the time editor.
 *
 * Editing logged hours used to be reachable only from inside a timer widget,
 * two dialogs deep, behind a button that said "clear timer" half the time —
 * and the chat's own copy of the editor was never rendered at all. This store
 * makes the editor a place, not a component: anywhere in the app (a lev card,
 * the moach, the bot, a deep link) can call `openTimeEditor` and the single
 * dialog mounted in the root layout opens on the right mission.
 *
 * Nothing here talks to the server. The dialog resolves the mission against the
 * `timers` store — and fetches it when the store is cold — so a caller only has
 * to know which mission it means.
 */

import type { Interval } from '$lib/timers/intervals';

export interface TimeEditorTarget {
	missionId: string | number;
	/** Optional seed, used until the `timers` store answers with live data. */
	missionName?: string;
	timerId?: string | number;
	projectId?: string | number;
	intervals?: Interval[];
}

let open = $state(false);
let target = $state<TimeEditorTarget | null>(null);

/** Open the global time editor on one mission. */
export function openTimeEditor(next: TimeEditorTarget) {
	if (next?.missionId == null) return;
	target = { ...next, missionId: String(next.missionId) };
	open = true;
}

export function closeTimeEditor() {
	open = false;
	target = null;
}

export const timeEditor = {
	get open() {
		return open;
	},
	get target() {
		return target;
	}
};
