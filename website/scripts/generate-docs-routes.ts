import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../src/routes/docs/_content');
const LAYOUT_DIR = path.join(__dirname, '../src/routes/docs/_layout');

interface MDXFile {
    relativePath: string;
    fullPath: string;
    routePath: string;
}

function getAllMDXFiles(dir: string, baseDir: string = dir): MDXFile[] {
    const files: MDXFile[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...getAllMDXFiles(fullPath, baseDir));
        } else if (entry.name.endsWith('.mdx')) {
            const relativePath = path.relative(baseDir, fullPath);
            const routePath = relativePath.replace(/\.mdx$/, '').replace(/\\/g, '/');

            files.push({ relativePath, fullPath, routePath });
        }
    }

    return files;
}

function generateRouteComponent(mdxFile: MDXFile): string {
    const componentName = `${mdxFile.routePath
        .split('/')
        .map((part) =>
            part
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join('')
        )
        .join('')}Component`;

    const routePath =
        mdxFile.routePath === 'index' ? '/docs/_layout/' : `/docs/_layout/${mdxFile.routePath}`;
    const currentPath = `/docs/${mdxFile.routePath}`;
    const filePath = mdxFile.routePath;
    const mdxImportPath = `@/routes/docs/_content/${mdxFile.routePath}.mdx`;

    return `import { createFileRoute } from '@tanstack/react-router';
import { DocsPage } from '@/routes/docs/_components/DocsPage';
import MDXContent, { frontmatter } from '${mdxImportPath}';

export const Route = createFileRoute('${routePath}')({
    component: ${componentName}
});

function ${componentName}() {
    return (
        <DocsPage
            title={frontmatter?.title || ''}
            description={frontmatter?.description || ''}
            currentPath="${currentPath}"
            filePath="${filePath}"
            lastUpdated={frontmatter?.lastUpdated}
        >
            <MDXContent />
        </DocsPage>
    );
}
`;
}

function main() {
    console.log('🔍 Scanning MDX files...');
    const mdxFiles = getAllMDXFiles(CONTENT_DIR);

    console.log(`📄 Found ${mdxFiles.length} MDX files`);

    // Clean existing generated routes (except _layout.tsx and index.tsx)
    const cleanDirs = (dir: string) => {
        if (!fs.existsSync(dir)) return;

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                cleanDirs(fullPath);
                // Remove empty directories
                if (fs.readdirSync(fullPath).length === 0) {
                    fs.rmdirSync(fullPath);
                }
            } else if (
                entry.name.endsWith('.tsx') &&
                entry.name !== '_layout.tsx' &&
                entry.name !== 'index.tsx'
            ) {
                fs.unlinkSync(fullPath);
                console.log(`🗑️  Removed: ${path.relative(LAYOUT_DIR, fullPath)}`);
            }
        }
    };

    cleanDirs(LAYOUT_DIR);

    // Generate new routes
    for (const mdxFile of mdxFiles) {
        const outputPath = path.join(LAYOUT_DIR, `${mdxFile.routePath}.tsx`);
        const outputDir = path.dirname(outputPath);

        // Create directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const content = generateRouteComponent(mdxFile);
        fs.writeFileSync(outputPath, content);

        console.log(`✅ Generated: ${mdxFile.routePath}.tsx`);
    }

    console.log(`\n🎉 Successfully generated ${mdxFiles.length} route files!`);
}

main();
