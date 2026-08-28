import { useEffect } from 'react';

/**
 * GlobalModalScrollLock Component
 *
 * Automatically monitors the DOM for any active modal dialogs / overlays
 * (.modal-overlay, [data-modal="true"], [role="dialog"]) across the entire application.
 *
 * Behaviors:
 * - Locks background page scrolling immediately upon modal mount.
 * - Prevents mouse-wheel, trackpad, keyboard, and touch scrolling from moving the background page.
 * - Compensates for scrollbar width to prevent horizontal/vertical layout shifts.
 * - Preserves the user's scroll position when opening and closing modals.
 * - Modal internal content remains fully scrollable when exceeding viewport height.
 * - Restores original body overflow and styling cleanly upon modal unmount.
 */
export function GlobalModalScrollLock() {
  useEffect(() => {
    let originalOverflow = '';
    let originalPaddingRight = '';
    let isLocked = false;

    const checkAndToggleScrollLock = () => {
      const activeModals = document.querySelectorAll(
        '.modal-overlay, [data-modal="true"], [role="dialog"]'
      );
      const shouldLock = activeModals.length > 0;

      if (shouldLock && !isLocked) {
        // Calculate scrollbar width to prevent background layout jumping
        const scrollbarWidth =
          window.innerWidth - document.documentElement.clientWidth;

        originalOverflow = document.body.style.overflow;
        originalPaddingRight = document.body.style.paddingRight;

        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
          document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
        isLocked = true;
      } else if (!shouldLock && isLocked) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        isLocked = false;
      }
    };

    // Initial check on mount
    checkAndToggleScrollLock();

    // DOM MutationObserver to detect all modal additions/removals universally
    const observer = new MutationObserver(() => {
      checkAndToggleScrollLock();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
    });

    return () => {
      observer.disconnect();
      if (isLocked) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      }
    };
  }, []);

  return null;
}
