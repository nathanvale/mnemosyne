# Version Tagging Instructions

## Current Status

- **Package Version**: 0.1.0 (in package.json)
- **Branch**: code-review-production
- **Latest Commit**: e25619e - Implement comprehensive error handling

## Recommended Version Tags

### Pre-Consolidation Tag (for rollback)

Since there are no existing tags, we should tag the commit before consolidated JSON changes:

```bash
# Tag the commit before consolidated output was added (commit 07fb2b9)
git tag -a code-review-v0.1.0 07fb2b9 -m "Initial code-review package before consolidated JSON output"

# Or tag current state as pre-production
git tag -a code-review-v0.2.0-pre-production -m "Code review package with consolidated JSON (pre-production)"
```

### Production Release Tag

After testing and when ready for production:

```bash
# Update package.json version
# Edit packages/code-review/package.json and change version to "1.0.0"

# Commit the version change
git add packages/code-review/package.json
git commit -m "Release code-review v1.0.0 with consolidated JSON output."

# Create release tag
git tag -a code-review-v1.0.0 -m "Production release: Consolidated JSON output for agent compatibility"

# Push tags to remote
git push origin --tags
```

## Version Naming Convention

- `code-review-v0.1.0` - Initial release
- `code-review-v0.2.0` - With consolidated JSON (development)
- `code-review-v1.0.0` - Production release with breaking changes

## Rollback Instructions

If rollback is needed:

```bash
# Checkout the pre-consolidation tag
git checkout code-review-v0.1.0

# Or revert to a specific commit
git revert --no-commit e25619e..HEAD
git commit -m "Revert to pre-consolidation state"
```

## Notes

- Breaking change from multiple JSON outputs to single consolidated output
- Agent and CLI must be deployed together for v1.0.0
- Version 1.0.0 signifies production readiness with stable API
