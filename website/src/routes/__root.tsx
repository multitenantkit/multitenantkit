import { createRootRoute, Outlet, useMatches } from '@tanstack/react-router';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { ScrollToTop } from '../components/layout/ScrollToTop';

export const Route = createRootRoute({
    component: RootComponent
});

function RootComponent() {
    const matches = useMatches();
    const isDocsRoute = matches.some((match) => match.pathname.startsWith('/docs'));
    const isBlogRoute = matches.some((match) => match.pathname.startsWith('/blog'));

    // Don't render header/footer in docs or blog (they have their own layouts)
    if (isDocsRoute || isBlogRoute) {
        return (
            <>
                <ScrollToTop />
                <Outlet />
            </>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <ScrollToTop />
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
