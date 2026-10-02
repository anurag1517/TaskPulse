import { useState, useEffect } from 'react';

/**
 * Custom hook to sense the screen width dynamically.
 * Automatically updates when resizing between mobile phone and desktop window.
 */
export function useIsMobile(breakpoint = 768): boolean {
    const [isMobile, setIsMobile] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth <= breakpoint;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const updateMatches = (e: MediaQueryListEvent | MediaQueryList) => {
            setIsMobile(e.matches);
        };

        // Initialize state
        setIsMobile(mediaQuery.matches);

        // Listen for viewport width changes
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', updateMatches);
            return () => mediaQuery.removeEventListener('change', updateMatches);
        } else {
            // Fallback for older browsers
            mediaQuery.addListener(updateMatches);
            return () => mediaQuery.removeListener(updateMatches);
        }
    }, [breakpoint]);

    return isMobile;
}
