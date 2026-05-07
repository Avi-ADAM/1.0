import { writable } from 'svelte/store';

function createConfettiStore() {
	const { subscribe, set } = writable(false);

	return {
		subscribe,
		trigger() {
			set(true);
			// Reset after confetti animations complete (longest duration is 10s)
			setTimeout(() => set(false), 11000);
		}
	};
}

export const confettiStore = createConfettiStore();
