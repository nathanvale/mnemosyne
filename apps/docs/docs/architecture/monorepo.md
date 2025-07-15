# 🏗️ Monorepo Architecture

## 🎯 Turborepo Strategy

Mnemosyne uses **Turborepo** with **pnpm workspaces** to manage a cohesive set of packages that work together to create the relational memory system.

---

## 📦 Workspace Organization

### Root Structure

```
mnemosyne/
├── apps/                    # Applications
│   └── studio/             # Next.js 15 app
├── packages/               # Shared packages
│   ├── db/                # Database client
│   ├── logger/            # Dual logging
│   ├── ui/                # Components
│   ├── scripts/           # CLI utilities
│   ├── mocks/             # API mocking
│   ├── test-config/       # Testing setup
│   └── shared/            # TS configs
├── docs/                  # Documentation
├── turbo.json            # Build pipeline
└── pnpm-workspace.yaml   # Workspace config
```

### Package Namespace

All packages use the `@studio/*` namespace:

- `@studio/db` - Database client and schema
- `@studio/logger` - Dual logging system
- `@studio/ui` - React component library
- `@studio/scripts` - CLI utilities
- `@studio/mocks` - MSW API handlers
- `@studio/test-config` - Shared test configuration
- `@studio/shared` - Common TypeScript configs

---

## 🔄 Build Pipeline

### Turborepo Configuration

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

### Dependency-Aware Builds

- Packages build in correct order based on dependencies
- `@studio/db` builds first (other packages depend on it)
- `@studio/shared` provides base configurations
- Apps build last, consuming all package outputs

### Intelligent Caching

- **Build artifacts** cached based on input file changes
- **Test results** cached when code unchanged
- **Type checking** skipped when no TypeScript changes
- **Cache hits** achieve near-instant rebuilds

---

## 🔗 Package Dependencies

### Dependency Graph

```
@studio/shared (base configs)
    ↓
@studio/db (database client)
    ↓
@studio/logger ← @studio/scripts
    ↓              ↓
@studio/ui ← @studio/mocks
    ↓         ↓
@studio/test-config
    ↓
apps/studio (Next.js app)
```

### Workspace References

Packages reference each other using `workspace:*`:

```json
{
  "dependencies": {
    "@studio/db": "workspace:*",
    "@studio/logger": "workspace:*"
  }
}
```

### Hot Reload Chain

Changes propagate automatically:

1. **Source change** in package detected
2. **Incremental rebuild** of package
3. **Hot reload** in consuming packages
4. **Browser update** without full restart

---

## 🛠️ Development Workflow

### Package Commands

```bash
# Build specific package
pnpm --filter @studio/logger build

# Test specific package
pnpm --filter @studio/db test

# Build all @studio packages
pnpm --filter "@studio/*" build

# Run command in app context
pnpm --filter apps/studio dev
```

### Turborepo Features

```bash
# Build with dependency awareness
pnpm turbo build

# Test only changed packages
pnpm turbo test --filter="[HEAD^1]"

# Build specific package and dependencies
pnpm turbo build --filter="@studio/ui..."

# Clean all build artifacts
pnpm clean
```

### Cross-Package Development

- **Import paths** use package names: `from '@studio/logger'`
- **Type definitions** shared automatically
- **Development server** sees changes across packages
- **Testing** works with cross-package imports

---

## 📁 Package Structure Standards

### Consistent Layout

```
packages/example/
├── src/
│   ├── lib/           # Core implementation
│   ├── types/         # TypeScript definitions
│   └── index.ts       # Public exports
├── tests/             # Package-specific tests
├── package.json       # Package configuration
├── tsconfig.json      # Package TypeScript config
└── vitest.config.ts   # Package test config
```

### TypeScript Configuration

- **Base config** from `@studio/shared`
- **Project references** for optimized builds
- **Path mapping** for `@studio/*` imports
- **Strict mode** enabled across all packages

### Testing Strategy

- **Package-level tests** in each package
- **Shared configuration** from `@studio/test-config`
- **Cross-package integration** tests
- **Wallaby.js** works across package boundaries

---

## 🚀 Performance Benefits

### Build Optimization

- **Parallel builds** for independent packages
- **Incremental compilation** via TypeScript project references
- **Cached results** skip unnecessary rebuilds
- **Smart scheduling** optimizes build order

### Development Speed

- **Hot reload** across package boundaries
- **Fast refresh** maintains application state
- **Incremental type checking** only changed files
- **Optimized dev server** startup

### CI/CD Efficiency

- **Intelligent caching** reduces CI build times
- **Affected package detection** runs only necessary tests
- **Parallel job execution** maximizes GitHub Actions efficiency
- **Artifact reuse** across workflow steps

---

## 🔧 Configuration Management

### Shared Configurations

- **ESLint** - Common rules across packages
- **Prettier** - Consistent formatting
- **TypeScript** - Base compiler options
- **Vitest** - Shared testing setup

### Package-Specific Overrides

- **Apps** can extend shared configs
- **Special requirements** handled per package
- **Tool-specific** configurations remain isolated
- **Flexibility** while maintaining consistency

### Environment Management

- **Development** - All packages in watch mode
- **Production** - Optimized builds with caching
- **Testing** - Isolated package testing
- **CI** - Parallel package processing

---

## 🎯 Monorepo Benefits

### Code Sharing

- **Type definitions** shared automatically
- **Utilities** available across packages
- **Components** reused in multiple contexts
- **Configuration** managed centrally

### Development Experience

- **Single repository** for entire system
- **Unified tooling** across all packages
- **Consistent patterns** reduce cognitive load
- **Cross-package refactoring** is safe and fast

### Deployment Strategy

- **Individual packages** can be published independently
- **Application deployments** include all dependencies
- **Versioning** managed at package level
- **Release coordination** simplified by monorepo

### Team Collaboration

- **Single clone** gives access to entire system
- **Shared pull requests** for cross-package changes
- **Consistent CI/CD** across all components
- **Documentation** co-located with code
