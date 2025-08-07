# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-01-08-typescript-config-improvements/spec.md

> Created: 2025-01-08
> Status: Ready for Implementation

## Tasks

- [ ] 1. Enhance @studio/typescript-config Package
  - [ ] 1.1 Write tests for existing configuration files
  - [ ] 1.2 Create test.json configuration file with test-specific types
  - [ ] 1.3 Update base.json to remove test types and add tsBuildInfoFile
  - [ ] 1.4 Update library.json for Just-in-Time pattern (noEmit: true)
  - [ ] 1.5 Update package.json exports to include test.json
  - [ ] 1.6 Verify all configuration files load correctly

- [ ] 2. Migrate Core Packages to Centralized Config
  - [ ] 2.1 Write tests for package migration scenarios
  - [ ] 2.2 Migrate @studio/schema from shared to typescript-config
  - [ ] 2.3 Migrate @studio/validation from shared to typescript-config
  - [ ] 2.4 Migrate @studio/db from shared to typescript-config
  - [ ] 2.5 Migrate @studio/mocks from shared to typescript-config
  - [ ] 2.6 Verify type checking passes for migrated packages

- [ ] 3. Migrate Dependent Packages
  - [ ] 3.1 Write tests for dependent package scenarios
  - [ ] 3.2 Migrate @studio/logger from shared to typescript-config
  - [ ] 3.3 Migrate @studio/test-config from shared to typescript-config
  - [ ] 3.4 Migrate @studio/scripts from shared to typescript-config
  - [ ] 3.5 Migrate @studio/mcp from shared to typescript-config
  - [ ] 3.6 Migrate @studio/ui from shared to typescript-config
  - [ ] 3.7 Verify all imports work correctly

- [ ] 4. Standardize Outlier Packages
  - [ ] 4.1 Write tests for claude-hooks migration
  - [ ] 4.2 Migrate @studio/claude-hooks to use typescript-config
  - [ ] 4.3 Update @studio/memory configuration if needed
  - [ ] 4.4 Update @studio/prettier-config configuration if needed
  - [ ] 4.5 Verify all packages now use centralized config

- [ ] 5. Implement Just-in-Time Package Exports
  - [ ] 5.1 Write tests for Just-in-Time imports
  - [ ] 5.2 Update all library package.json exports to TypeScript source
  - [ ] 5.3 Remove build outputs from library packages
  - [ ] 5.4 Update build scripts to no-op for libraries
  - [ ] 5.5 Test imports in consuming applications
  - [ ] 5.6 Verify hot reload works with TypeScript sources

- [ ] 6. Optimize Project References
  - [ ] 6.1 Write tests for parallel type checking
  - [ ] 6.2 Update root tsconfig.json with all package references
  - [ ] 6.3 Add missing packages (claude-hooks, memory) to references
  - [ ] 6.4 Organize references by dependency levels (transit nodes)
  - [ ] 6.5 Update turbo.json with optimized type-check task
  - [ ] 6.6 Measure and verify performance improvements

- [ ] 7. Clean Up and Documentation
  - [ ] 7.1 Remove packages/shared/tsconfig.package.json
  - [ ] 7.2 Remove duplicate path mappings
  - [ ] 7.3 Update CLAUDE.md with new TypeScript architecture
  - [ ] 7.4 Run full test suite to ensure no regressions
  - [ ] 7.5 Verify all tests pass

## Implementation Order

The tasks should be executed in the order listed above to ensure proper dependencies:

1. **Configuration First**: Enhance typescript-config before migrating packages
2. **Core Packages**: Migrate packages with no dependencies first
3. **Dependent Packages**: Migrate packages that depend on core packages
4. **Standardization**: Bring outlier packages in line
5. **Just-in-Time**: Implement new export pattern across all packages
6. **Optimization**: Add performance improvements
7. **Cleanup**: Remove old configurations and update documentation

## Verification Checkpoints

After each major task group, run these verification steps:

```bash
# Type checking
pnpm type-check

# Build verification
pnpm build

# Test suite
pnpm test

# Development server
pnpm dev
```

## Estimated Completion Time

- Task 1: 1 hour (configuration enhancement)
- Task 2: 2 hours (core package migration)
- Task 3: 2 hours (dependent package migration)
- Task 4: 1 hour (outlier standardization)
- Task 5: 2 hours (Just-in-Time implementation)
- Task 6: 1 hour (optimization)
- Task 7: 1 hour (cleanup)

**Total Estimated Time**: 10 hours
