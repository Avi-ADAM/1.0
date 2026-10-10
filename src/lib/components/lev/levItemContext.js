/**
 * levItemContext — lets a card's chrome see the DisplayItem it belongs to.
 *
 * `<LevCard>` hands each of its ~30 card components a hand-picked list of
 * props; threading one more (the item's `when`) through every one of them, and
 * on into each one's `<CardHeader>`, would be thirty edits for a single line of
 * text. Instead LevCard publishes the item here and CardHeader reads it.
 *
 * A CardHeader rendered outside a LevCard (a moach page, a focused vote page
 * that does not go through LevCard) simply gets null and shows nothing extra.
 */
import { getContext, setContext } from 'svelte';

const KEY = Symbol('lev-item');

/**
 * Call during LevCard's init. `read` is a getter so the context follows the
 * prop when the same LevCard is handed a newer copy of its item.
 *
 * @param {() => any} read
 */
export function setLevItem(read) {
  setContext(KEY, {
    get item() {
      return read();
    }
  });
}

/**
 * Call during a component's init; read `.item` inside a `$derived`.
 *
 * @returns {{ readonly item: any } | null}
 */
export function getLevItem() {
  return getContext(KEY) ?? null;
}
