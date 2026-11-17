/**
 * Freeze the page under a full-screen overlay that scrolls by itself.
 *
 * A `fixed inset-0 overflow-y-auto` layer draws its own scrollbar, and the
 * document keeps its own beside it — two bars, the outer one scrolling a page
 * nobody can see. Returns the undo, so it drops straight into an `$effect`.
 * Nested locks are counted, so one overlay closing never unlocks another's.
 */
let locks = 0;
let saved = '';

export function lockPageScroll(): () => void {
	if (typeof document === 'undefined') return () => {};
	const root = document.documentElement;
	if (locks++ === 0) {
		saved = root.style.overflow;
		root.style.overflow = 'hidden';
	}
	let released = false;
	return () => {
		if (released) return;
		released = true;
		if (--locks === 0) root.style.overflow = saved;
	};
}
