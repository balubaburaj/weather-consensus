import { useEffect, useRef } from 'react';

/**
 * Synchronizes an expanded modal/overlay's open state with browser history
 * so pressing the hardware/browser Back button closes the overlay instead of
 * navigating away from the app.
 */
export function useHistorySync(historyKey, isOpen, onClose) {
  const ownsEntryRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    if (isOpen) {
      if (window.history.state?.__wcModal !== historyKey) {
        window.history.pushState(
          { ...(window.history.state || {}), __wcModal: historyKey },
          ''
        );
      }
      ownsEntryRef.current = true;

      const handlePopState = () => {
        if (
          ownsEntryRef.current &&
          window.history.state?.__wcModal !== historyKey
        ) {
          ownsEntryRef.current = false;
          onCloseRef.current?.();
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }

    if (ownsEntryRef.current) {
      ownsEntryRef.current = false;
      if (window.history.state?.__wcModal === historyKey) {
        window.history.back();
      }
    }

    return undefined;
  }, [historyKey, isOpen]);
}
