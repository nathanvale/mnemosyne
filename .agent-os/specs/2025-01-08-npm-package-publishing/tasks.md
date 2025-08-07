# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-01-08-npm-package-publishing/spec.md

> Created: 2025-01-08
> Status: Ready for Implementation

## Tasks

- [ ] 1. Create Publishable TypeScript Configuration
  - [ ] 1.1 Write tests for publishable configuration
  - [ ] 1.2 Create publishable.json in @studio/typescript-config
  - [ ] 1.3 Configure for JavaScript output with declarations
  - [ ] 1.4 Add source maps and declaration maps
  - [ ] 1.5 Export publishable.json in package.json
  - [ ] 1.6 Verify configuration works correctly

- [ ] 2. Migrate @studio/claude-hooks Package
  - [ ] 2.1 Write tests for claude-hooks compilation
  - [ ] 2.2 Update tsconfig.json to extend publishable.json
  - [ ] 2.3 Restore compilation settings (noEmit: false)
  - [ ] 2.4 Update package.json exports for compiled output
  - [ ] 2.5 Add prepublishOnly script for building
  - [ ] 2.6 Test build output and type definitions

- [ ] 3. Configure Package Metadata
  - [ ] 3.1 Update package.json with proper npm metadata
  - [ ] 3.2 Add files field to specify published content
  - [ ] 3.3 Set publishConfig for public access
  - [ ] 3.4 Add repository and homepage URLs
  - [ ] 3.5 Create comprehensive README.md
  - [ ] 3.6 Add LICENSE file if not present

- [ ] 4. Implement Publishing Scripts
  - [ ] 4.1 Write tests for publishing workflow
  - [ ] 4.2 Create prerelease validation script
  - [ ] 4.3 Add version bumping scripts
  - [ ] 4.4 Implement dry-run publishing test
  - [ ] 4.5 Create actual publish script
  - [ ] 4.6 Add post-publish verification

- [ ] 5. Setup CI/CD Publishing
  - [ ] 5.1 Create GitHub Action for npm publishing
  - [ ] 5.2 Configure npm authentication secrets
  - [ ] 5.3 Add release trigger conditions
  - [ ] 5.4 Implement publish safeguards
  - [ ] 5.5 Add success/failure notifications
  - [ ] 5.6 Test workflow in dry-run mode

- [ ] 6. Add Quality Checks
  - [ ] 6.1 Implement package size checks
  - [ ] 6.2 Add dependency validation
  - [ ] 6.3 Verify TypeScript declarations
  - [ ] 6.4 Check for security vulnerabilities
  - [ ] 6.5 Validate package installation
  - [ ] 6.6 Test in isolated environment

- [ ] 7. Documentation and Examples
  - [ ] 7.1 Create publishing guide in docs
  - [ ] 7.2 Add example usage for external consumers
  - [ ] 7.3 Document version management process
  - [ ] 7.4 Create troubleshooting guide
  - [ ] 7.5 Update main README with npm badges
  - [ ] 7.6 Verify all documentation accuracy

## Implementation Order

1. **Configuration First**: Create publishable.json before migrating packages
2. **Single Package**: Focus on claude-hooks as the pilot package
3. **Automation**: Build scripts and workflows after manual process works
4. **Quality**: Add checks and validations last
5. **Documentation**: Complete after implementation is stable

## Success Criteria

- [ ] @studio/claude-hooks installable via `npm install @studio/claude-hooks`
- [ ] TypeScript types work correctly in external projects
- [ ] Package size is reasonable (< 100KB minified)
- [ ] CI/CD pipeline publishes automatically on release
- [ ] Clear documentation for maintaining published packages

## Notes

- Keep internal packages on Just-in-Time compilation
- Only packages with `"private": false` should use publishable config
- Consider creating a `@claude-code` npm organization for better branding
- May need to rename package from `@studio/claude-hooks` to avoid conflicts
