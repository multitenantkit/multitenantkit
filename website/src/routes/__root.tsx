import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';

export const Route = createRootRoute({
    component: () => (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
});
