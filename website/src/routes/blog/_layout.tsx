import { createFileRoute, Outlet } from '@tanstack/react-router';
import { BlogLayout } from './_components/BlogLayout';

export const Route = createFileRoute('/blog/_layout')({
    component: BlogLayoutComponent
});

function BlogLayoutComponent() {
    return (
        <BlogLayout>
            <Outlet />
        </BlogLayout>
    );
}
