import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, '../src/routes/blog/_posts');
const LAYOUT_DIR = path.join(__dirname, '../src/routes/blog/_layout');
const POSTS_FILE = path.join(__dirname, '../src/routes/blog/_lib/posts.ts');

interface BlogPost {
    slug: string;
    title: string;
    description?: string;
    date: string;
    author?: string;
    coverImage?: string;
    tags?: string[];
    featured?: boolean;
}

interface MDXFile {
    slug: string;
    fullPath: string;
    frontmatter: BlogPost;
}

function getAllMDXFiles(): MDXFile[] {
    const files: MDXFile[] = [];

    if (!fs.existsSync(POSTS_DIR)) {
        console.log('📁 Posts directory does not exist, creating it...');
        fs.mkdirSync(POSTS_DIR, { recursive: true });
        return files;
    }

    const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.mdx')) {
            const fullPath = path.join(POSTS_DIR, entry.name);
            const slug = entry.name.replace(/\.mdx$/, '');
            const content = fs.readFileSync(fullPath, 'utf-8');
            const { data } = matter(content);

            files.push({
                slug,
                fullPath,
                frontmatter: {
                    slug,
                    title: data.title || slug,
                    description: data.description,
                    date: data.date || new Date().toISOString().split('T')[0],
                    author: data.author,
                    coverImage: data.coverImage,
                    tags: data.tags,
                    featured: data.featured || false
                }
            });
        }
    }

    return files;
}

function generateRouteComponent(mdxFile: MDXFile): string {
    const componentName = mdxFile.slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
        .concat('Post');

    return `import { createFileRoute } from '@tanstack/react-router';
import { BlogPost } from '../_components/BlogPost';
import MDXContent, { frontmatter } from '../_posts/${mdxFile.slug}.mdx';
import type { BlogFrontmatter } from '../_lib/types';

export const Route = createFileRoute('/blog/_layout/${mdxFile.slug}')({
    component: ${componentName}
});

function ${componentName}() {
    const fm = frontmatter as unknown as BlogFrontmatter;
    return (
        <BlogPost
            title={fm.title}
            description={fm.description}
            date={fm.date}
            author={fm.author}
            coverImage={fm.coverImage}
            tags={fm.tags}
            slug="${mdxFile.slug}"
        >
            <MDXContent />
        </BlogPost>
    );
}
`;
}

function generatePostsFile(posts: MDXFile[]): string {
    const postsData = posts.map((p) => p.frontmatter);
    const postsJson = JSON.stringify(postsData, null, 4).replace(/"([^"]+)":/g, '$1:');

    return `import type { BlogPostMeta } from './types';

// This file is auto-generated. Do not edit manually.
// Run \`npm run blog:generate\` to update.

export const blogPosts: BlogPostMeta[] = ${postsJson};

export function getAllPosts(): BlogPostMeta[] {
    return blogPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getFeaturedPosts(): BlogPostMeta[] {
    return blogPosts.filter((post) => post.featured);
}

export function getPostBySlug(slug: string): BlogPostMeta | undefined {
    return blogPosts.find((post) => post.slug === slug);
}

export function getPostsByTag(tag: string): BlogPostMeta[] {
    return blogPosts.filter((post) => post.tags?.includes(tag));
}
`;
}

function main() {
    console.log('🔍 Scanning blog MDX files...');
    const mdxFiles = getAllMDXFiles();

    console.log(`📄 Found ${mdxFiles.length} blog posts`);

    // Ensure layout directory exists
    if (!fs.existsSync(LAYOUT_DIR)) {
        fs.mkdirSync(LAYOUT_DIR, { recursive: true });
    }

    // Clean existing generated routes (except index.tsx)
    const entries = fs.readdirSync(LAYOUT_DIR, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.tsx') && entry.name !== 'index.tsx') {
            const fullPath = path.join(LAYOUT_DIR, entry.name);
            fs.unlinkSync(fullPath);
            console.log(`🗑️  Removed: ${entry.name}`);
        }
    }

    // Generate new routes
    for (const mdxFile of mdxFiles) {
        const outputPath = path.join(LAYOUT_DIR, `${mdxFile.slug}.tsx`);
        const content = generateRouteComponent(mdxFile);
        fs.writeFileSync(outputPath, content);
        console.log(`✅ Generated: ${mdxFile.slug}.tsx`);
    }

    // Generate posts.ts file
    const postsContent = generatePostsFile(mdxFiles);
    fs.writeFileSync(POSTS_FILE, postsContent);
    console.log(`✅ Generated: posts.ts`);

    console.log(`\n🎉 Successfully generated ${mdxFiles.length} blog route files!`);
}

main();
