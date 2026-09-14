/**
 * A whole row can be tappable and still hold buttons of its own: this only runs the row's
 * action when the tap was on the row itself, not on a control inside it. Cheaper to reason
 * about than stopping propagation in every child.
 */
export function rowTap(fn: () => void): (e: Event) => void {
  return (e: Event) => {
    const t = e.target as HTMLElement | null;
    if (t && t.closest('button, [role="button"]') !== e.currentTarget) return;
    fn();
  };
}
