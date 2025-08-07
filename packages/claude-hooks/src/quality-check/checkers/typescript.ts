/**
 * TypeScript compilation checker with TDD support
 */

import { existsSync } from 'fs'
import path from 'path'

import type { Logger } from '../../utils/logger.js'
import type { ResolvedQualityConfig } from '../config.js'

import { findProjectRoot } from '../../utils/config-loader.js'
import { fileExists, readFile } from '../../utils/file-utils.js'
import { createDummyFile } from '../dummy-generator.js'
import {
  determineFileExtension,
  parseImportStatement,
  resolveImportPath,
} from '../import-parser.js'
import { TypeScriptConfigCache } from '../typescript-cache.js'
import { createConfigValidator } from '../typescript-config-validator.js'

export interface TypeScriptChecker {
  check(): Promise<string[]>
}

export async function createTypeScriptChecker(
  filePath: string,
  config: ResolvedQualityConfig,
  log: Logger,
  tsConfigCache: TypeScriptConfigCache,
): Promise<TypeScriptChecker | null> {
  if (!config.typescriptEnabled) {
    return null
  }

  // Skip TypeScript checking for JavaScript files in hook directories
  if (filePath.endsWith('.js') && filePath.includes('.claude/hooks/')) {
    log.debug('Skipping TypeScript check for JavaScript hook file')
    return null
  }

  const projectRoot = findProjectRoot(path.dirname(filePath))
  log.debug(`Project root: ${projectRoot}`)
  log.debug(
    `Looking for TypeScript at: ${path.join(projectRoot, 'node_modules', 'typescript')}`,
  )

  // Try to load TypeScript
  let ts: typeof import('typescript')
  try {
    ts = await import(
      path.join(
        projectRoot,
        'node_modules',
        'typescript',
        'lib',
        'typescript.js',
      )
    )
  } catch (error) {
    log.debug(
      `TypeScript not found in project - will skip TypeScript checks. Error: ${error}`,
    )
    return null
  }

  const isTestFile = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath)

  return {
    async check(): Promise<string[]> {
      const errors: string[] = []
      log.info('Running TypeScript compilation check...')

      try {
        // Get intelligent config for this file
        const configPath = tsConfigCache.getTsConfigForFile(filePath)

        if (!existsSync(configPath)) {
          log.debug(`No TypeScript config found: ${configPath}`)
          return errors
        }

        // Check if file is excluded from TypeScript project
        const configValidator = createConfigValidator()
        const isFileIncluded = await configValidator.isFileIncluded(
          filePath,
          configPath,
        )

        if (!isFileIncluded) {
          log.info(
            `Skipping TypeScript check for excluded file: ${path.relative(projectRoot, filePath)}`,
          )
          return errors // Return early, no TypeScript checking for excluded files
        }

        log.debug(
          `Using TypeScript config: ${path.basename(configPath)} for ${path.relative(projectRoot, filePath)}`,
        )

        const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
        const parsedConfig = ts.parseJsonConfigFileContent(
          configFile.config,
          ts.sys,
          path.dirname(configPath),
        )

        // Validate the file path before TypeScript checking
        if (!existsSync(filePath)) {
          log.warning(`File not found at path: ${filePath}`)

          // Check if this might be a duplicate path issue
          if (
            filePath.includes('packages/claude-hooks/packages/claude-hooks')
          ) {
            const fixedPath = filePath.replace(
              /packages\/claude-hooks\/packages\/claude-hooks/g,
              'packages/claude-hooks',
            )
            if (existsSync(fixedPath)) {
              log.warning(`Found file at corrected path: ${fixedPath}`)
              log.error(
                `Path duplication detected - this should have been caught earlier`,
              )
              errors.push(
                'Path duplication issue detected - file path was incorrectly duplicated',
              )
              return errors
            }
          }

          errors.push(`File does not exist: ${filePath}`)
          return errors
        }

        // Create program with just the edited file
        log.debug(`TypeScript checking edited file only`)
        let program = ts.createProgram([filePath], parsedConfig.options)
        let diagnostics = ts.getPreEmitDiagnostics(program)

        // Handle import errors in test files during TDD
        if (isTestFile && diagnostics.length > 0) {
          const importDiagnostics = diagnostics.filter(
            (d) =>
              d.code === 2307 || // Cannot find module
              d.code === 2792, // Cannot find module (type declarations)
          )

          if (importDiagnostics.length > 0) {
            log.info(
              'Detected import errors in test file, creating dummy implementations...',
            )
            let dummiesCreated = false

            try {
              // Read the test file to analyze imports
              const fileContent = await readFile(filePath)
              const lines = fileContent.split('\n')

              for (const diagnostic of importDiagnostics) {
                if (!diagnostic.file || !diagnostic.start) continue

                // Get the line number
                const { line } = diagnostic.file.getLineAndCharacterOfPosition(
                  diagnostic.start,
                )

                // Find the import statement
                const importLine = lines[line]
                if (!importLine) continue

                const parsedImport = parseImportStatement(importLine)
                if (!parsedImport || !parsedImport.isRelative) continue

                // Resolve the import path
                const resolvedPath = resolveImportPath(
                  parsedImport.importPath,
                  filePath,
                  projectRoot,
                )

                // Determine file extension
                const ext = determineFileExtension(
                  resolvedPath,
                  parsedImport.isTypeOnly,
                  filePath,
                )

                const fullPath = path.join(projectRoot, resolvedPath + ext)

                // Check if file exists
                if (!(await fileExists(fullPath))) {
                  // Create dummy implementation
                  const created = await createDummyFile(
                    fullPath,
                    parsedImport,
                    (msg) => log.info(msg),
                  )

                  if (created) {
                    dummiesCreated = true
                  }
                }
              }

              // Re-check TypeScript if we created any dummy files
              if (dummiesCreated) {
                log.info(
                  'Re-running TypeScript check after creating dummy implementations...',
                )
                program = ts.createProgram([filePath], parsedConfig.options)
                diagnostics = ts.getPreEmitDiagnostics(program)
              }
            } catch (error) {
              log.debug(
                `Error handling import errors: ${error instanceof Error ? error.message : 'Unknown error'}`,
              )
            }
          }
        }

        // Group diagnostics by file
        const diagnosticsByFile = new Map<string, (typeof diagnostics)[0][]>()
        for (const d of diagnostics) {
          if (d.file) {
            const fileName = d.file.fileName
            if (!diagnosticsByFile.has(fileName)) {
              diagnosticsByFile.set(fileName, [])
            }
            diagnosticsByFile.get(fileName)!.push(d)
          }
        }

        // Report edited file first
        const editedFileDiagnostics = diagnosticsByFile.get(filePath) || []
        if (editedFileDiagnostics.length > 0) {
          errors.push(
            `TypeScript errors in edited file (using ${path.basename(configPath)})`,
          )
          for (const diagnostic of editedFileDiagnostics) {
            const message = ts.flattenDiagnosticMessageText(
              diagnostic.messageText,
              '\n',
            )
            const { line, character } = diagnostic.file
              ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!)
              : { line: 0, character: 0 }
            console.error(
              `  ❌ ${diagnostic.file?.fileName || 'unknown'}:${line + 1}:${character + 1} - ${message}`,
            )
          }
        }

        // Report dependencies separately (as warnings, not errors) - only if enabled
        if (config.showDependencyErrors) {
          let hasDepErrors = false
          diagnosticsByFile.forEach((diags, fileName) => {
            if (fileName !== filePath) {
              if (!hasDepErrors) {
                console.error(
                  '\n[DEPENDENCY ERRORS] Files imported by your edited file:',
                )
                hasDepErrors = true
              }
              console.error(`  ⚠️ ${fileName}:`)
              for (const diagnostic of diags) {
                const message = ts.flattenDiagnosticMessageText(
                  diagnostic.messageText,
                  '\n',
                )
                const { line, character } = diagnostic.file
                  ? diagnostic.file.getLineAndCharacterOfPosition(
                      diagnostic.start!,
                    )
                  : { line: 0, character: 0 }
                console.error(
                  `     Line ${line + 1}:${character + 1} - ${message}`,
                )
              }
            }
          })
        }

        if (diagnostics.length === 0) {
          log.success('TypeScript compilation passed')
        }
      } catch (error) {
        log.debug(
          `TypeScript check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }

      return errors
    },
  }
}
