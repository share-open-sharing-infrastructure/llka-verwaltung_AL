/**
 * Keeps the active item of a horizontally scrollable navigation strip usable.
 *
 * Three jobs, all on the same element:
 * 1. Centres the `[aria-current="page"]` item on route change **and** whenever
 *    the container is resized (viewport resize / orientation change would
 *    otherwise leave a stale `scrollLeft` and push the active item out of view).
 * 2. Scrolls a newly focused item fully into the scrollport (WCAG 2.4.11
 *    "Focus Not Obscured") — the implicit browser scroll-into-view does not
 *    reliably fire for partially visible elements.
 * 3. Publishes the overflow state as `data-fade-end` on the container so the
 *    strip can render an end-edge fade only while content is hidden to the right.
 */

'use client';

import { useEffect, type RefObject } from 'react';
import { usePathname } from 'next/navigation';

export function useCenterActiveNavItem(ref: RefObject<HTMLElement | null>): void {
  const pathname = usePathname();

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const maxScroll = () => container.scrollWidth - container.clientWidth;

    // Fade the END edge only: it means "there is more to the right". A start-side
    // fade is deliberately omitted — the leading edge sits next to the logo and
    // fading it there reads as a rendering glitch, not as an affordance.
    const syncFade = () => {
      const max = maxScroll();
      container.dataset.fadeEnd = String(max > 0 && container.scrollLeft < max - 1);
    };

    // Measured via bounding rects rather than offsetLeft: the strip is not a
    // positioned element, so offsetLeft would resolve against the fixed <nav>
    // and include the logo/padding to its left. The rect difference is
    // `staticLeft - scrollLeft`, so adding scrollLeft back cancels the scroll part.
    const offsetInStrip = (el: HTMLElement) =>
      el.getBoundingClientRect().left -
      container.getBoundingClientRect().left +
      container.scrollLeft;

    const scrollStripTo = (value: number) => {
      container.scrollLeft = Math.max(0, Math.min(value, maxScroll()));
      syncFade();
    };

    const centreActive = () => {
      const el = container.querySelector<HTMLElement>('[aria-current="page"]');
      if (!el) {
        syncFade();
        return;
      }
      scrollStripTo(offsetInStrip(el) - (container.clientWidth - el.offsetWidth) / 2);
    };

    // Never el.scrollIntoView() here: it walks the ancestor chain and can shift
    // the fixed nav bar (and the window) sideways. Compute the strip's own
    // scrollLeft instead — minimally, not centred, so tabbing through the items
    // does not jump the strip further than needed.
    const revealFocused = (event: FocusEvent) => {
      let el = event.target as HTMLElement | null;
      if (!el || el === container || !container.contains(el)) return;
      while (el.parentElement && el.parentElement !== container) el = el.parentElement;

      const left = offsetInStrip(el);
      const right = left + el.offsetWidth;
      const viewLeft = container.scrollLeft;
      const viewRight = viewLeft + container.clientWidth;

      if (left < viewLeft) scrollStripTo(left);
      else if (right > viewRight) scrollStripTo(right - container.clientWidth);
      else syncFade();
    };

    centreActive();

    // Setting scrollLeft does not change the box size, so re-centring from a
    // resize callback cannot feed back into the observer.
    const resizeObserver = new ResizeObserver(centreActive);
    resizeObserver.observe(container);
    container.addEventListener('focusin', revealFocused);
    container.addEventListener('scroll', syncFade, { passive: true });

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('focusin', revealFocused);
      container.removeEventListener('scroll', syncFade);
    };
    // `pathname` is a re-run trigger, not a value used below: a route change moves
    // the aria-current marker to a different item, which has to be re-centred.
  }, [pathname, ref]);
}
