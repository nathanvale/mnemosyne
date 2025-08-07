# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-07-npm-package-distribution/spec.md

> Created: 2025-08-07
> Status: Ready for Implementation

## Tasks

- [x] 1. Set up build infrastructure
  - [x] 1.1 Write tests for build configuration
  - [x] 1.2 Install esbuild as dev dependency
  - [x] 1.3 Create TypeScript build configuration for dist output
  - [x] 1.4 Create fix-shebangs script for production builds
  - [x] 1.5 Add build scripts to package.json
  - [x] 1.6 Test build process creates correct output structure
  - [x] 1.7 Verify all tests pass

- [x] 2. Create bin entry points
  - [x] 2.1 Write tests for bin command execution
  - [x] 2.2 Create src/bin/ directory structure
  - [x] 2.3 Create claude-hooks-stop.ts bin entry
  - [x] 2.4 Create claude-hooks-notification.ts bin entry
  - [x] 2.5 Create claude-hooks-quality.ts bin entry
  - [x] 2.6 Create claude-hooks-subagent.ts bin entry
  - [x] 2.7 Add error handling and process exit codes
  - [x] 2.8 Verify all tests pass

- [x] 3. Update package.json configuration
  - [x] 3.1 Write tests for package.json modifications
  - [x] 3.2 Add bin field with command mappings
  - [x] 3.3 Update exports field for dual dev/prod support
  - [x] 3.4 Add prepublishOnly script
  - [x] 3.5 Create .npmignore file (if needed)
  - [x] 3.6 Test npm pack creates valid package
  - [x] 3.7 Verify all tests pass

- [x] 4. Test monorepo and standalone compatibility
  - [x] 4.1 Write integration tests for both environments
  - [x] 4.2 Test commands work in monorepo with pnpm install
  - [x] 4.3 Test local installation from npm pack tarball
  - [x] 4.4 Test npx execution without installation
  - [x] 4.5 Test config file resolution in all scenarios
  - [x] 4.6 Test cross-platform compatibility (if possible)
  - [x] 4.7 Verify all tests pass

- [x] 5. Update documentation and examples
  - [x] 5.1 Update README.md with new installation instructions
  - [x] 5.2 Update Claude Code configuration examples
  - [x] 5.3 Add migration guide from universal hooks
  - [x] 5.4 Update .claude/hooks/README.md with deprecation notice
  - [x] 5.5 Create example configurations for common scenarios
  - [x] 5.6 Document troubleshooting steps
  - [x] 5.7 Verify all documentation is accurate

## Task Dependencies

- Task 2 depends on Task 1 (need build infrastructure for bin files)
- Task 3 can be done in parallel with Task 2
- Task 4 depends on Tasks 1, 2, and 3 being complete
- Task 5 can be started anytime but should be completed last

## Verification Checklist

After all tasks are complete, verify:

- [ ] `pnpm install` in monorepo creates working commands
- [ ] `pnpm build` successfully compiles to dist/
- [ ] `npm pack` creates installable tarball
- [ ] Commands work when installed globally
- [ ] Commands work via npx
- [ ] Config files are found from any directory
- [ ] No more dependency on bash scripts
- [ ] Claude Code configuration is simplified
- [ ] All tests pass
- [ ] Documentation is complete and accurate
