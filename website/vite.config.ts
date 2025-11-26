import path from 'node:path';
import mdx from '@mdx-js/rollup';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react-swc';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        mdx({
            remarkPlugins: [
                remarkGfm,
                remarkFrontmatter,
                [remarkMdxFrontmatter, { name: 'frontmatter' }]
            ],
            rehypePlugins: [
                rehypeSlug,
                [
                    rehypePrettyCode,
                    {
                        theme: 'github-dark',
                        keepBackground: true
                    }
                ]
            ],
            providerImportSource: '@mdx-js/react'
        }),
        react(),
        TanStackRouterVite({
            routesDirectory: './src/routes',
            generatedRouteTree: './src/routeTree.gen.ts',
            // Ignore component, utility, content and style files
            routeFileIgnorePattern: '(_components|_lib|_posts|_styles)'
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@content': path.resolve(__dirname, './content')
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    motion: ['framer-motion'],
                    'syntax-highlighter': ['react-syntax-highlighter']
                }
            }
        }
    }
});
