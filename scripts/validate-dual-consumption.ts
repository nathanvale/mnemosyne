#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

interface PackageJson {
  name: string
  type?: string
  exports?: Record<string, unknown> | string
  main?: string
  module?: string
  scripts?: Record<string, string>
}

interface ValidationResult {
  package: string
  hasTypeModule: boolean
  hasConditionalExports: boolean
  hasDevelopmentCondition: boolean
  hasTypesExport: boolean
  hasImportExport: boolean
  hasBuildScript: boolean
  errors: string[]
}

const workspaceRoot = process.cwd()

async function getWorkspacePackages(): Promise<string[]> {
  try {
    const output = execSync('pnpm list --depth=0 --json', {
      encoding: 'utf-8',
      cwd: workspaceRoot,
    })
    const data = JSON.parse(output)
    const packages: string[] = []

    // Extract workspace packages from pnpm list output
    if (data[0]?.devDependencies) {
      Object.keys(data[0].devDependencies).forEach((dep) => {
        if (dep.startsWith('@studio/')) {
          packages.push(dep)
        }
      })
    }
    if (data[0]?.dependencies) {
      Object.keys(data[0].dependencies).forEach((dep) => {
        if (dep.startsWith('@studio/')) {
          packages.push(dep)
        }
      })
    }

    // Also check packages directory directly
    const packagesDir = join(workspaceRoot, 'packages')
    if (existsSync(packagesDir)) {
      const { readdirSync } = await import('fs')
      const dirs = readdirSync(packagesDir)
      dirs.forEach((dir: string) => {
        const pkgPath = join(packagesDir, dir, 'package.json')
        if (existsSync(pkgPath)) {
          const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
          if (pkg.name && !packages.includes(pkg.name)) {
            packages.push(pkg.name)
          }
        }
      })
    }

    return [...new Set(packages)].sort()
  } catch (error) {
    console.error('Error getting workspace packages:', error)
    return []
  }
}

function validatePackage(packageName: string): ValidationResult {
  const result: ValidationResult = {
    package: packageName,
    hasTypeModule: false,
    hasConditionalExports: false,
    hasDevelopmentCondition: false,
    hasTypesExport: false,
    hasImportExport: false,
    hasBuildScript: false,
    errors: [],
  }

  // Find package path
  const packageDir = packageName.replace('@studio/', '')
  const packagePath = join(
    workspaceRoot,
    'packages',
    packageDir,
    'package.json',
  )

  if (!existsSync(packagePath)) {
    result.errors.push(`Package file not found: ${packagePath}`)
    return result
  }

  try {
    const packageJson: PackageJson = JSON.parse(
      readFileSync(packagePath, 'utf-8'),
    )

    // Check type: module
    result.hasTypeModule = packageJson.type === 'module'
    if (!result.hasTypeModule) {
      result.errors.push('Missing "type": "module"')
    }

    // Check exports field
    if (packageJson.exports) {
      result.hasConditionalExports = true

      // Check main export
      let mainExport: unknown
      if (
        typeof packageJson.exports === 'object' &&
        packageJson.exports !== null
      ) {
        mainExport =
          (packageJson.exports as Record<string, unknown>)['.'] ||
          packageJson.exports
      } else {
        mainExport = packageJson.exports
      }

      if (mainExport && typeof mainExport === 'object') {
        const exportObj = mainExport as Record<string, unknown>
        result.hasDevelopmentCondition = !!exportObj.development
        result.hasTypesExport = !!exportObj.types
        result.hasImportExport = !!exportObj.import || !!exportObj.default

        if (!result.hasDevelopmentCondition) {
          result.errors.push('Missing "development" condition in exports')
        }
        if (!result.hasTypesExport) {
          result.errors.push('Missing "types" export')
        }
        if (!result.hasImportExport) {
          result.errors.push('Missing "import" or "default" export')
        }
      }
    } else {
      result.errors.push('Missing "exports" field for dual consumption')
    }

    // Check build script
    result.hasBuildScript = !!packageJson.scripts?.build
    if (!result.hasBuildScript) {
      result.errors.push('Missing "build" script')
    }
  } catch (error) {
    result.errors.push(`Error reading package.json: ${error}`)
  }

  return result
}

function validateInfrastructure(): boolean {
  console.log('🔍 Validating Dual Consumption Infrastructure\n')

  // Check turbo.json configuration
  console.log('📋 Checking turbo.json configuration...')
  const turboConfigTest = execSync('npx tsx scripts/test-turbo-config.ts', {
    encoding: 'utf-8',
    stdio: 'pipe',
  })

  if (turboConfigTest.includes('All tests passed')) {
    console.log('✅ Turbo.json is properly configured\n')
  } else {
    console.error('❌ Turbo.json configuration issues found\n')
    return false
  }

  // Check Next.js configuration
  console.log('📋 Checking Next.js configuration...')
  const nextConfigPath = join(workspaceRoot, 'apps', 'studio', 'next.config.ts')
  if (existsSync(nextConfigPath)) {
    const nextConfig = readFileSync(nextConfigPath, 'utf-8')
    if (
      nextConfig.includes('transpilePackages') &&
      nextConfig.includes("NODE_ENV === 'development'")
    ) {
      console.log('✅ Next.js is configured for conditional transpilation\n')
    } else {
      console.error(
        '❌ Next.js configuration missing conditional transpilation\n',
      )
      return false
    }
  }

  return true
}

async function main() {
  console.log('🚀 Dual Consumption Architecture Validator\n')
  console.log(`${'='.repeat(50)}\n`)

  // Validate infrastructure
  const infraValid = validateInfrastructure()

  // Get all workspace packages
  const packages = await getWorkspacePackages()
  console.log(`📦 Found ${packages.length} workspace packages to validate\n`)

  // Configuration packages that don't need dual consumption
  const configPackages = [
    '@studio/typescript-config',
    '@studio/eslint-config',
    '@studio/prettier-config',
  ]

  const results: ValidationResult[] = []
  let hasErrors = false

  packages.forEach((pkg: string) => {
    // Skip config packages
    if (configPackages.includes(pkg)) {
      console.log(`⏭️  Skipping config package: ${pkg}`)
      return
    }

    const result = validatePackage(pkg)
    results.push(result)

    if (result.errors.length > 0) {
      hasErrors = true
      console.log(`❌ ${pkg}`)
      result.errors.forEach((error) => {
        console.log(`   - ${error}`)
      })
    } else {
      console.log(`✅ ${pkg} - Ready for dual consumption`)
    }
  })

  console.log(`\n${'='.repeat(50)}`)
  console.log('📊 Validation Summary\n')

  const readyPackages = results.filter((r) => r.errors.length === 0)
  const notReadyPackages = results.filter((r) => r.errors.length > 0)

  console.log(
    `✅ Ready for dual consumption: ${readyPackages.length}/${results.length}`,
  )
  if (readyPackages.length > 0) {
    readyPackages.forEach((r) => console.log(`   - ${r.package}`))
  }

  if (notReadyPackages.length > 0) {
    console.log(
      `\n❌ Need migration: ${notReadyPackages.length}/${results.length}`,
    )
    notReadyPackages.forEach((r) => console.log(`   - ${r.package}`))
  }

  // Show migration progress
  console.log('\n📈 Migration Progress:')
  const progress = Math.round((readyPackages.length / results.length) * 100)
  const progressBar =
    '█'.repeat(Math.floor(progress / 5)) +
    '░'.repeat(20 - Math.floor(progress / 5))
  console.log(`   [${progressBar}] ${progress}%`)

  if (!infraValid || hasErrors) {
    console.log(
      '\n⚠️  Infrastructure is ready but packages need migration for full dual consumption support.',
    )
    console.log('   Run migration tasks to update package exports.')
  } else {
    console.log('\n🎉 All packages are configured for dual consumption!')
    console.log('   Development will use source files directly.')
    console.log('   Production builds will use compiled artifacts.')
  }

  process.exit(hasErrors ? 1 : 0)
}

main()
