// Tracks pointer position over a card and exposes it as CSS custom
// properties (--mx / --my) so a radial-gradient sheen in CSS can follow
// the cursor. Attach via onMouseMove={spotlightMove} on any element
// carrying the `.spotlight` class.
export function spotlightMove(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  el.style.setProperty('--my', `${e.clientY - rect.top}px`);
}
