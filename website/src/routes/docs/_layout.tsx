import { createFileRoute, Outlet } from '@tanstack/react-router';
import { DocsLayout } from './_components/DocsLayout';

export const Route = createFileRoute('/docs/_layout')({
    component: DocsLayoutComponent
});

function DocsLayoutComponent() {
    return (
        <DocsLayout>
            <Outlet />
        </DocsLayout>
    );
}
