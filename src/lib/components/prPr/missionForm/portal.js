/**
 * Full screen is `position: fixed`, but the creation forms usually sit inside a
 * card whose transform makes `fixed` relative to that card. While `active` is
 * on, the node is moved to <body> and put back in place when it is off.
 * @param {HTMLElement} node
 * @param {boolean} active
 */
export function portal(node, active) {
  const anchor = document.createComment('form-portal');
  node.before(anchor);
  const apply = (/** @type {boolean} */ on) => {
    if (on) document.body.appendChild(node);
    else if (node.previousSibling !== anchor) anchor.after(node);
  };
  apply(active);
  return {
    update: apply,
    destroy() {
      // Put it back where Svelte expects it, so its own teardown removes it.
      if (node.parentNode === document.body && anchor.isConnected) anchor.after(node);
      else if (node.parentNode === document.body) node.remove();
      anchor.remove();
    }
  };
}
