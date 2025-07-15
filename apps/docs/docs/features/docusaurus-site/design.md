# 🏗️ Design: Docusaurus Documentation Site

## 🎯 Overview

A high-performance Docusaurus documentation site integrated with Mnemosyne's Turborepo monorepo, featuring intelligent caching, automatic content updates, and seamless GitHub Pages deployment.

The design prioritizes build performance through sophisticated dependency tracking, ensuring documentation stays current without developer overhead while maintaining the sub-5-second rebuild times essential for productive development workflows.

## 🏛️ Architecture

### System Components

- **@studio/docs**: Docusaurus application in `apps/docs` with enhanced Turborepo integration
- **Content Pipeline**: Automated transformation of source `docs/` content to Docusaurus format
- **Dependency Tracker**: Monitors `@studio/*` package changes to trigger documentation rebuilds
- **Cache Layer**: Multi-tiered caching strategy leveraging Turborepo's intelligent build system
- **Deploy Engine**: GitHub Actions workflow with optimized build and deployment pipeline

### Data Flow

```mermaid
graph TD
    A[Source docs/] --> B[Content Transformer]
    C[@studio/* packages] --> D[Package Watcher]
    B --> E[Docusaurus Build]
    D --> E
    E --> F[Turborepo Cache]
    F --> G[GitHub Pages]

    H[Developer] --> I[pnpm docs:dev]
    I --> J[Live Reload Server]
    F --> J
```

1. **Input Sources**: Source documentation (`docs/`) and package changes (`@studio/*`)
2. **Processing**: Turborepo orchestrates builds with dependency awareness and caching
3. **Storage**: Built site cached with intelligent invalidation based on input changes
4. **Output**: Live development server and deployed GitHub Pages site

## 📦 Package Changes

### apps/docs (@studio/docs)

**New Files**:

- `package.json` - Package configuration with Docusaurus dependencies
- `docusaurus.config.js` - Site configuration with Mermaid and GitHub Pages setup
- `sidebars.js` - Navigation structure matching existing documentation hierarchy
- `src/components/` - Custom React components for enhanced documentation features
- `docs/` - Transformed documentation content from root `docs/`
- `static/` - Assets, diagrams, and static resources

**New Dependencies**:

- `@docusaurus/core` - Core Docusaurus framework
- `@docusaurus/preset-classic` - Standard documentation preset
- `@docusaurus/theme-mermaid` - Mermaid diagram support
- `@mdx-js/react` - MDX component rendering

**API Exports**:

```typescript
// No programmatic API - static site generation
```

### Root Configuration

**Modified Files**:

- `turbo.json` - Enhanced with docs-specific tasks and dependency tracking
- `package.json` - New scripts for documentation development and deployment
- `README.md` - Clear guidance on accessing documentation (both local and deployed)
- `CLAUDE.md` - Documentation structure guidance for development agents
- `pnpm-workspace.yaml` - Include `apps/docs` in workspace (already covered by `apps/*`)

**New Dependencies**:

- `gh-pages` - GitHub Pages deployment utility

### README Documentation Updates

The root README will be updated to include clear guidance on documentation access:

```markdown
## 📚 Documentation

### Quick Access

- **Live Documentation**: https://nathanvale.github.io/mnemosyne/
- **Local Development**: `pnpm docs:dev` (starts documentation site locally)

### Documentation Structure

- **`docs/`** - Source documentation (markdown files for editing)
- **`apps/docs/`** - Docusaurus application (generated site)

### Working with Documentation

- **Edit content**: Modify files in `docs/` directory
- **Preview changes**: Run `pnpm docs:dev` to see live preview
- **Deploy**: Documentation automatically deploys when changes are pushed to main

The `docs/` folder contains the source documentation that gets transformed into the Docusaurus site. When developing documentation, always edit the markdown files in `docs/`, not the generated files in `apps/docs/docs/`.
```

### CLAUDE.md Documentation Updates

The CLAUDE.md file will be updated to include documentation guidance for development agents:

```markdown
## Documentation Structure

### Source vs Generated Documentation

- **`docs/`** - Source documentation (edit these files)
  - Markdown files that serve as single source of truth
  - Used by development agents for context and reference
  - Automatically transformed into Docusaurus site
- **`apps/docs/`** - Generated Docusaurus application (do not edit directly)
  - Contains transformed/generated content
  - Built automatically from source `docs/` files

### Working with Documentation

- **Reading Documentation**: Use files in `docs/` directory for context
- **Editing Documentation**: Always modify source files in `docs/`, never in `apps/docs/docs/`
- **Live Site**: Access generated documentation at https://nathanvale.github.io/mnemosyne/
- **Local Development**: Run `pnpm docs:dev` to preview changes

### Documentation Commands

- `pnpm docs:dev` - Start local documentation development server
- `pnpm docs:build` - Build static documentation site
- `pnpm docs:deploy` - Deploy to GitHub Pages (automated via CI)

When referencing documentation in code or providing context to users, refer to the live documentation site for the best experience with search, navigation, and up-to-date content.
```

## 🔄 Enhanced Turborepo Configuration

### Optimized Task Definitions

```json
{
  "tasks": {
    "docs#dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["^build"],
      "env": ["NODE_ENV"]
    },
    "docs#build": {
      "dependsOn": ["^build"],
      "inputs": [
        "docs/**",
        "src/**",
        "static/**",
        "docusaurus.config.js",
        "sidebars.js",
        "package.json",
        "../../../docs/**"
      ],
      "outputs": ["build/**"],
      "env": ["NODE_ENV"]
    },
    "docs#deploy": {
      "dependsOn": ["docs#build"],
      "cache": false,
      "outputs": []
    },
    "docs#serve": {
      "dependsOn": ["docs#build"],
      "cache": false,
      "persistent": true
    }
  }
}
```

### Dependency Management Strategy

- **Upstream Dependencies**: `^build` ensures all packages build before documentation
- **Input Tracking**: Comprehensive file monitoring for intelligent cache invalidation
- **Output Caching**: Built site cached until inputs change
- **Cross-Package Awareness**: Documentation rebuilds when any `@studio/*` package changes

### Performance Optimizations

- **Incremental Builds**: Only rebuild when relevant inputs change
- **Parallel Processing**: Leverage Turborepo's parallel task execution
- **Smart Caching**: Multi-layered cache strategy with remote cache support
- **Dependency Pruning**: Precise dependency tracking prevents unnecessary rebuilds

## 🗄️ Content Migration Strategy

### Source Structure Preservation

```
docs/ (source)                    →    apps/docs/docs/ (transformed)
├── architecture/                 →    ├── architecture/
│   ├── system-overview.md        →    │   ├── system-overview.mdx
│   └── data-flow.md             →    │   └── data-flow.mdx
├── features/                     →    ├── features/
│   └── dual-logging/            →    │   └── dual-logging/
├── guides/                       →    ├── guides/
└── intent.md                    →    └── intro.mdx
```

### Transformation Pipeline

- **Markdown to MDX**: Enhanced with React component support
- **Mermaid Integration**: Native diagram rendering in documentation
- **Cross-References**: Automatic linking between documentation sections
- **Asset Optimization**: Images and diagrams optimized for web delivery

### Navigation Structure

```javascript
// sidebars.js
module.exports = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
      items: ['architecture/system-overview', 'architecture/data-flow', ...]
    },
    {
      type: 'category',
      label: 'Features',
      items: ['features/dual-logging', 'features/docusaurus-site', ...]
    },
    {
      type: 'category',
      label: 'Packages',
      items: ['packages/logger', 'packages/db', ...]
    }
  ]
}
```

## 🎨 GitHub Pages Configuration

### Docusaurus Configuration

```javascript
// docusaurus.config.js
module.exports = {
  title: 'Mnemosyne Engineering Docs',
  tagline: 'Relational Memory System Documentation',
  url: 'https://nathanvale.github.io',
  baseUrl: '/mnemosyne/',
  organizationName: 'nathanvale',
  projectName: 'mnemosyne',
  trailingSlash: false,

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/nathanvale/mnemosyne/tree/main/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
}
```

### GitHub Actions Workflow

```yaml
# .github/workflows/docs.yml
name: Deploy Documentation

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - 'apps/docs/**'
      - 'packages/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build documentation
        run: pnpm turbo docs#build

      - name: Deploy to GitHub Pages
        working-directory: apps/docs
        run: |
          git config user.name "github-actions"
          git config user.email "github-actions@github.com"
          pnpm deploy
        env:
          GIT_USER: github-actions
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 🧪 Testing Approach

### Performance Testing

- **Build Time Measurement**: Automated timing of cold and incremental builds
- **Cache Hit Rate Analysis**: Monitor Turborepo cache effectiveness
- **Memory Usage Profiling**: Ensure documentation builds don't impact development workflow

### Content Validation

- **Link Checking**: Automated verification of internal and external links
- **Mermaid Rendering**: Validate all architecture diagrams render correctly
- **Navigation Testing**: Verify sidebar and search functionality

### Integration Testing

- **Package Change Detection**: Verify documentation rebuilds when packages change
- **Cross-Reference Validation**: Test links between documentation sections
- **Deployment Pipeline**: End-to-end testing of GitHub Actions workflow

## 🎯 Implementation Plan

### Phase 1: Foundation (Week 1)

- [ ] Create `apps/docs` package with basic Docusaurus setup
- [ ] Configure enhanced Turborepo integration with dependency tracking
- [ ] Set up GitHub Pages deployment with optimized workflow
- [ ] Add Mermaid support for architecture diagrams

### Phase 2: Content Migration (Week 2)

- [ ] Transform existing `docs/` content to Docusaurus format
- [ ] Configure navigation structure matching current information architecture
- [ ] Implement cross-reference linking between documentation sections
- [ ] Test content rendering and diagram display

### Phase 3: Integration & Optimization (Week 3)

- [ ] Integrate package change detection for automatic rebuilds
- [ ] Optimize build performance and validate cache efficiency
- [ ] Configure search functionality and navigation enhancements
- [ ] End-to-end testing of development and deployment workflows

### Phase 4: Polish & Launch (Week 4)

- [ ] Performance tuning and cache optimization
- [ ] Final content review and navigation refinement
- [ ] Update root README with clear documentation access guidance
- [ ] Update CLAUDE.md with documentation structure guidance for development agents
- [ ] Team onboarding and workflow documentation
- [ ] Launch monitoring and feedback collection

## 🚨 Risks & Mitigation

### Technical Risks

- **Risk**: Complex Turborepo integration causes build issues
  - **Mitigation**: Start with simple configuration and incrementally add optimization

- **Risk**: Content migration breaks existing links or formatting
  - **Mitigation**: Automated testing and gradual migration with validation

### Performance Risks

- **Risk**: Documentation builds become slow despite caching
  - **Mitigation**: Performance monitoring and circuit breaker at 30s build time

### User Experience Risks

- **Risk**: Navigation becomes confusing after content migration
  - **Mitigation**: Preserve existing information architecture and test with team

## 📊 Performance Considerations

### Build Performance Targets

- **Cold Build**: &lt;30 seconds (all packages + documentation)
- **Incremental Build**: &lt;5 seconds (content-only changes)
- **Cache Hit Rate**: &gt;90% during typical development workflows
- **Memory Usage**: &lt;512MB additional overhead during builds

### Optimization Strategies

- **Input Minimization**: Precise file tracking to avoid unnecessary rebuilds
- **Output Caching**: Aggressive caching of built documentation
- **Parallel Processing**: Leverage Turborepo's concurrent task execution
- **Remote Caching**: Enable shared cache for team development

## 🔗 Dependencies

### External Packages

- **@docusaurus/core**: Core documentation framework
- **@docusaurus/theme-mermaid**: Native Mermaid diagram support
- **gh-pages**: Automated GitHub Pages deployment

### Internal Dependencies

- **Turborepo Infrastructure**: Enhanced task configuration and caching
- **@studio/\* Packages**: Source for auto-generated API documentation
- **Source Documentation**: Existing `docs/` content for migration

---

_This design provides a comprehensive technical foundation for a high-performance documentation site that seamlessly integrates with Mnemosyne's existing development infrastructure._
