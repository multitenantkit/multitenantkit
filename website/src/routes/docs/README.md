# 📚 Documentation Module

This folder contains **all documentation-related code**, completely self-contained within `/docs`.

## ✨ Professional Features

- ✅ **Table of Contents (TOC)** - Auto-generated sidebar with active section highlighting
- ✅ **Breadcrumbs Navigation** - Shows current location in docs hierarchy
- ✅ **Previous/Next Navigation** - Easy sequential page browsing
- ✅ **Theme Toggle** - Switch between light/dark mode
- ✅ **Search** - Fast full-text search with keyboard shortcuts (⌘K)
- ✅ **Copy Button** - One-click code block copying
- ✅ **Syntax Highlighting** - Beautiful code blocks with rehype-pretty-code
- ✅ **MDX Support** - Write docs in Markdown with React components
- ✅ **Responsive Design** - Mobile-friendly with collapsible sidebar

## 📂 Structure

```
src/routes/docs/
├── _components/           ← React components for docs UI
│   ├── Callout.tsx       - Info/warning/error callouts
│   ├── CodeBlock.tsx     - Code syntax highlighting
│   ├── CopyButton.tsx    - Copy-to-clipboard button
│   ├── DocsLayout.tsx    - Sidebar layout wrapper
│   ├── DocsPage.tsx      - Page content wrapper
│   └── MDXComponents.tsx - Custom MDX component mappings
├── _content/             ← MDX documentation content
│   ├── index.mdx
│   ├── meta.json
│   ├── getting-started/
│   ├── use-cases/
│   ├── configuration/
│   ├── adapters/
│   ├── guides/
│   ├── architecture/
│   └── examples/
├── _layout/              ← Generated TSX route files (auto-generated)
│   ├── index.tsx
│   ├── getting-started/
│   ├── use-cases/
│   └── ...
├── _lib/                 ← Shared utilities and data
│   └── structure.ts      - Sidebar navigation structure
├── _styles/              ← Documentation-specific styles
│   └── docs.css
└── _layout.tsx           ← Route layout definition

**Total: 24 documentation pages**
```

## 🔧 How It Works

### 1. Write Content in MDX
Create or edit `.mdx` files in `_content/`:

```mdx
---
title: My Page
description: Page description
---

# My Page

Content goes here...
```

### 2. Generate Routes
Run the generation script:

```bash
npm run docs:generate
```

This automatically:
- Scans all `.mdx` files in `_content/`
- Generates corresponding `.tsx` route files in `_layout/`
- Cleans up obsolete routes

### 3. Update Sidebar
Edit `_lib/structure.ts` to add your page to the sidebar navigation.

## 🎯 Why Everything is in `/docs`?

### Self-Contained Module
- ✅ All docs code is in one place
- ✅ Easy to maintain and understand
- ✅ Clear separation from app code
- ✅ Can be easily moved or copied to other projects

### Underscore Prefix Convention
Files/folders prefixed with `_` are ignored by TanStack Router:
- `_components/` - Not treated as routes
- `_content/` - Not treated as routes
- `_lib/` - Not treated as routes
- `_styles/` - Not treated as routes
- `_layout/` - Route files directory
- `_layout.tsx` - Route layout definition

## 📝 Modifying Documentation

### Add a New Page

1. **Create MDX file**:
   ```bash
   # src/routes/docs/_content/my-section/my-page.mdx
   ```

2. **Generate route**:
   ```bash
   npm run docs:generate
   ```

3. **Add to sidebar** in `_lib/structure.ts`:
   ```typescript
   {
       title: 'My Section',
       pages: [
           {
               title: 'My Page',
               description: 'Description',
               url: '/docs/my-section/my-page',
               slug: ['my-section', 'my-page']
           }
       ]
   }
   ```

### Modify Components

All docs components are in `_components/`:
- `Callout.tsx` - For info/warning/error messages
- `CodeBlock.tsx` - For code syntax highlighting
- `CopyButton.tsx` - Copy button for code blocks
- `DocsLayout.tsx` - Main layout with sidebar
- `DocsPage.tsx` - Page wrapper with metadata
- `MDXComponents.tsx` - Custom component mappings

### Modify Styles

Documentation-specific styles are in `_styles/docs.css`, imported in `src/index.css`:

```css
@import './routes/docs/_styles/docs.css';
```

## 🚀 Development Commands

```bash
# Generate routes from MDX files
npm run docs:generate

# Start dev server (auto-generates routes first)
npm run dev

# Build for production (auto-generates routes first)
npm run build
```

## 🔗 Import Paths

When importing docs modules, use absolute paths:

```typescript
// Components
import { DocsPage } from '@/routes/docs/_components/DocsPage';

// Utilities
import { docsStructure } from '@/routes/docs/_lib/structure';

// MDX content
import MDXContent from '@/routes/docs/_content/index.mdx';
```

## ⚠️ Important Notes

- **Never edit files in `_layout/` directly** - they are auto-generated
- **Always run `npm run docs:generate`** after adding/modifying MDX files
- **TanStack Router warnings** about files in `_components/` and `_lib/` not containing route pieces are normal and expected
- **Underscore prefix** prevents TanStack Router from treating helper files as routes

## 📦 What Gets Committed

When committing docs changes, the diff will show:
- ✅ Changes in `src/routes/docs/` only
- ✅ Changes in `scripts/generate-docs-routes.ts` (if script was modified)
- ✅ Changes in `src/index.css` (if docs styles were imported)
- ✅ Changes in `package.json` (if scripts were modified)

Everything else in the codebase remains untouched! 🎉
