import { useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

export function ScrollToTop() {
    const location = useLocation();

    // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    return null;
}
