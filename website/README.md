# MultiTenantKit Landing Page

Production-ready landing page for [MultiTenantKit](https://github.com/multitenantkit/multitenantkit) built with modern web technologies.

## 🚀 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Router** - File-based routing
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons
- **React Syntax Highlighter** - Code blocks with syntax highlighting

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:5173`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🎨 Features

- ✅ **Fully Responsive** - Mobile-first design
- ✅ **Dark/Light Mode** - Automatic theme switching with persistence
- ✅ **Smooth Animations** - Powered by Framer Motion
- ✅ **Optimized Performance** - Code splitting and lazy loading
- ✅ **SEO Ready** - Meta tags, structured data, and sitemap
- ✅ **Accessible** - WCAG 2.1 AA compliant
- ✅ **Type Safe** - Full TypeScript coverage

## 📁 Project Structure

```
website/
├── src/
│   ├── components/
│   │   ├── layout/          # Header, Footer
│   │   ├── sections/        # Landing page sections
│   │   └── ui/              # Reusable UI components
│   ├── lib/
│   │   ├── theme.ts         # Theme management
│   │   └── utils.ts         # Utility functions
│   ├── routes/              # TanStack Router routes
│   ├── index.css            # Global styles
│   └── main.tsx             # App entry point
├── public/                  # Static assets
├── index.html              # HTML template
└── package.json            # Dependencies
```

## 🎯 Sections

The landing page includes these sections:

1. **Hero** - Main value proposition with code examples
2. **Problem** - Pain points this toolkit solves
3. **Quick Start** - Interactive setup guide (30 seconds)
4. **Features** - 6 key features with icons
5. **Before/After Comparison** - Visual time savings
6. **Architecture** - Adapter flexibility showcase
7. **Who Is This For** - Target personas
8. **Technical Highlights** - Architecture details (accordion)
9. **Comparison Table** - vs Auth0/Custom solutions
10. **GitHub Stats** - Stars, contributors, version
11. **Final CTA** - Call to action with terminal preview

## 🎨 Design System

### Colors

**Dark Mode:**
- Background: `#0A0A0F`
- Surface: `#1A1A2E`
- Primary: `#6366F1`
- Accent: `#06B6D4`

**Light Mode:**
- Background: `#FFFFFF`
- Surface: `#F8FAFC`
- Primary: `#4F46E5`
- Accent: `#0891B2`

### Typography

- **Font Family**: Inter (sans), JetBrains Mono (code)
- **Hero Heading**: 3.5rem desktop / 2.5rem mobile
- **Section Heading**: 2.25rem / 1.875rem
- **Body**: 1rem / 0.875rem

### Spacing

- **Container**: Max-width 1280px
- **Section Padding**: 8rem desktop / 4rem mobile
- **Component Gap**: 1.5rem - 2rem

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Environment Variables

No environment variables required for basic functionality. The site works out of the box.

## 📱 Responsive Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

## ♿ Accessibility

- Semantic HTML5 elements
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- Respects `prefers-reduced-motion`
- High contrast ratios (WCAG AA)

## 🚀 Deployment

The site can be deployed to any static hosting provider:

### Netlify

```bash
npm run build
# Deploy dist/ folder
```

### AWS (S3 + CloudFront)

```bash
npm run build
# Upload dist/ to S3 bucket
# Configure CloudFront distribution
```

### Vercel

```bash
vercel
```

## 📝 Content Updates

To update content, edit the relevant section components in `src/components/sections/`. All text, code examples, and features are defined within these components.

## 🎯 Performance

Target metrics:
- **LCP** < 2.5s
- **FID** < 100ms
- **CLS** < 0.1
- **Bundle Size** < 150KB gzipped

## 📄 License

MIT License - see main repository for details.

## 🤝 Contributing

This is part of the MultiTenantKit project. Please see the main repository for contribution guidelines.

---

Built with ❤️ for the MultiTenantKit project
