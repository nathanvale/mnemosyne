# 🏗️ Design: Mnemosyne Documentation Theme

**Status**: Planning  
**Last Updated**: 2025-07-15

---

## 🎯 Technical Architecture

### Core Technology Stack

- **Base**: Docusaurus 3.8.1 with React 18
- **Styling**: CSS Custom Properties + CSS Modules
- **Typography**: Google Fonts (Playfair Display + Inter)
- **Theme System**: Docusaurus swizzling + custom CSS variables
- **Performance**: Optimized font loading, critical CSS inlining

### Integration Points

- **Existing**: Built on established Docusaurus site architecture
- **Turborepo**: Leverages existing build optimizations and caching
- **Static Assets**: Utilizes current `apps/docs/static/` structure
- **Content**: Works with existing MDX documentation files

---

## 🎨 Visual Design System

### Color Palette

Derived from the hero image's emotional warmth and technical sophistication:

```css
:root {
  /* Primary Brand Colors */
  --mnemosyne-navy: #2c3e50;
  --mnemosyne-gold: #f1c40f;
  --mnemosyne-violet: #9b59b6;
  --mnemosyne-parchment: #fdf6e3;

  /* Semantic Colors */
  --color-primary: var(--mnemosyne-navy);
  --color-accent: var(--mnemosyne-gold);
  --color-secondary: var(--mnemosyne-violet);
  --color-background: var(--mnemosyne-parchment);

  /* Text Hierarchy */
  --color-text-primary: #2c3e50;
  --color-text-secondary: #5d6d7e;
  --color-text-muted: #95a5a6;

  /* Interactive States */
  --color-link: var(--mnemosyne-violet);
  --color-link-hover: #8e44ad;
  --color-border: #e8f4f8;
}

[data-theme='dark'] {
  --mnemosyne-navy: #1a252f;
  --mnemosyne-gold: #f39c12;
  --mnemosyne-violet: #a569bd;
  --mnemosyne-parchment: #1e1e1e;

  --color-background: var(--mnemosyne-navy);
  --color-text-primary: #ecf0f1;
  --color-text-secondary: #bdc3c7;
  --color-text-muted: #7f8c8d;
  --color-border: #34495e;
}
```

### Typography System

```css
/* Font Loading */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

:root {
  /* Font Families */
  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem; /* 36px */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Spacing & Layout

```css
:root {
  /* Spacing Scale */
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-24: 6rem; /* 96px */

  /* Container Widths */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}
```

---

## 🏗️ Component Architecture

### File Structure

```
apps/docs/
├── src/
│   ├── css/
│   │   ├── custom.css              # Main theme entry point
│   │   ├── variables.css           # CSS custom properties
│   │   ├── typography.css          # Font and text styles
│   │   ├── components.css          # Component-specific styles
│   │   └── utilities.css           # Helper classes
│   ├── theme/
│   │   ├── Navbar/
│   │   │   ├── index.js            # Swizzled navbar component
│   │   │   └── styles.module.css   # Navbar-specific styles
│   │   ├── Footer/
│   │   │   ├── index.js            # Swizzled footer component
│   │   │   └── styles.module.css   # Footer-specific styles
│   │   ├── CodeBlock/
│   │   │   ├── index.js            # Enhanced code blocks
│   │   │   └── styles.module.css   # Code styling
│   │   └── Layout/
│   │       ├── index.js            # Main layout wrapper
│   │       └── styles.module.css   # Layout-specific styles
│   └── pages/
│       ├── index.tsx               # Themed landing page
│       └── index.module.css        # Homepage styling
├── static/
│   └── img/
│       ├── hero-mnemosyne.png      # Main hero image
│       ├── logo-light.svg          # Light theme logo
│       └── logo-dark.svg           # Dark theme logo
└── docusaurus.config.js            # Theme configuration
```

### Swizzled Components

#### 1. Enhanced Navbar

```javascript
// src/theme/Navbar/index.js
import React from 'react'
import OriginalNavbar from '@theme-original/Navbar'
import styles from './styles.module.css'

export default function Navbar(props) {
  return (
    <div className={styles.navbarWrapper}>
      <OriginalNavbar {...props} />
    </div>
  )
}
```

#### 2. Branded Footer

```javascript
// src/theme/Footer/index.js
import React from 'react'
import styles from './styles.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.branding}>
          <h3>Mnemosyne</h3>
          <p>AI that remembers what matters.</p>
        </div>
        {/* Additional footer content */}
      </div>
    </footer>
  )
}
```

#### 3. Enhanced Code Blocks

```javascript
// src/theme/CodeBlock/index.js
import React from 'react'
import OriginalCodeBlock from '@theme-original/CodeBlock'
import styles from './styles.module.css'

export default function CodeBlock(props) {
  return (
    <div className={styles.codeBlockWrapper}>
      <OriginalCodeBlock {...props} />
    </div>
  )
}
```

---

## 🖼️ Hero Landing Page

### Component Structure

```typescript
// src/pages/index.tsx
import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout
      title="Mnemosyne"
      description="AI that remembers what matters">
      <HeroSection />
      <FeaturesSection />
      <DocsOverview />
    </Layout>
  );
}

function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>MNEMOSYNE</h1>
          <p className={styles.heroTagline}>Where memory becomes meaning.</p>
          <img
            src="/img/hero-mnemosyne.png"
            alt="Mnemosyne AI Memory Engine"
            className={styles.heroImage}
          />
          <blockquote className={styles.heroQuote}>
            "Memory isn't just what we store — it's what makes us human."
          </blockquote>
          <p className={styles.heroDescription}>
            <strong>Mnemosyne</strong> is a relationship-aware AI memory engine.
            It transforms timestamped conversations into meaningful, emotional context —
            powering creative and intelligent downstream features like journaling,
            insight generation, and meme suggestions.
          </p>
        </div>
      </div>
    </section>
  );
}
```

### Hero Styling

```css
/* src/pages/index.module.css */
.hero {
  background: linear-gradient(
    135deg,
    var(--mnemosyne-navy) 0%,
    var(--mnemosyne-violet) 100%
  );
  color: var(--mnemosyne-parchment);
  padding: var(--space-24) 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.heroContainer {
  max-width: var(--container-lg);
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.heroTitle {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-align: center;
  margin-bottom: var(--space-4);
  color: var(--mnemosyne-gold);
}

.heroTagline {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-style: italic;
  text-align: center;
  margin-bottom: var(--space-8);
  opacity: 0.9;
}

.heroImage {
  max-width: 400px;
  width: 100%;
  height: auto;
  display: block;
  margin: var(--space-8) auto;
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.heroQuote {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-style: italic;
  text-align: center;
  margin: var(--space-8) auto;
  max-width: 600px;
  border-left: 3px solid var(--mnemosyne-gold);
  padding-left: var(--space-4);
  opacity: 0.95;
}

.heroDescription {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  text-align: center;
  max-width: 700px;
  margin: var(--space-6) auto 0;
}
```

---

## 📱 Responsive Design

### Breakpoint System

```css
/* Mobile First Approach */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}

/* Responsive Typography */
@media (max-width: 768px) {
  .heroTitle {
    font-size: var(--text-3xl);
  }

  .heroTagline {
    font-size: var(--text-lg);
  }

  .heroImage {
    max-width: 300px;
  }
}
```

---

## ⚡ Performance Optimizations

### Font Loading Strategy

```css
/* Critical font preload in HTML head */
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" as="style">
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" as="style">

/* Font display optimization */
@font-face {
  font-family: 'Playfair Display';
  font-display: swap;
  /* Additional font properties */
}
```

### CSS Optimization

- Critical CSS inlined for above-the-fold content
- Non-critical styles loaded asynchronously
- CSS custom properties reduce bundle size
- Tree-shaking removes unused styles

### Image Optimization

- Hero image optimized for web (WebP with PNG fallback)
- Responsive images with appropriate sizing
- Lazy loading for non-critical images

---

## 🔧 Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Set up CSS custom properties system
- [ ] Implement typography and color variables
- [ ] Create basic component structure
- [ ] Add Google Fonts integration

### Phase 2: Components (Week 2)

- [ ] Swizzle and customize Navbar
- [ ] Create branded Footer component
- [ ] Enhance CodeBlock styling
- [ ] Implement hero landing page

### Phase 3: Polish (Week 3)

- [ ] Add dark mode support
- [ ] Implement responsive design
- [ ] Performance optimization
- [ ] Accessibility testing and fixes

---

## 🧪 Testing Strategy

### Visual Regression Testing

- Screenshots of key pages in light/dark modes
- Cross-browser compatibility testing (Chrome, Firefox, Safari, Edge)
- Mobile device testing (iOS Safari, Android Chrome)

### Performance Testing

- Lighthouse audits for performance, accessibility, SEO
- Core Web Vitals monitoring
- Font loading performance analysis

### Accessibility Testing

- WCAG 2.1 AA compliance verification
- Screen reader testing
- Keyboard navigation testing
- Color contrast validation

---

## 🔮 Future Enhancements

### Interactive Features

- Smooth scroll animations between sections
- Parallax effects for hero section
- Interactive memory visualization components

### Advanced Theming

- User-customizable color schemes
- Seasonal theme variations
- Context-aware UI adaptations

### Integration Features

- Memory timeline components for documentation
- Interactive code examples with live preview
- Community-contributed theme extensions

---

_This design document provides the technical foundation for implementing a sophisticated, emotionally intelligent documentation theme that reflects Mnemosyne's core values while maintaining excellent performance and accessibility standards._
