#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// dist/src/quality-check/index.js
var import_path9 = __toESM(require("path"), 1);

// dist/src/types/claude.js
var HookExitCode;
(function(HookExitCode2) {
  HookExitCode2[HookExitCode2["Success"] = 0] = "Success";
  HookExitCode2[HookExitCode2["GeneralError"] = 1] = "GeneralError";
  HookExitCode2[HookExitCode2["QualityIssues"] = 2] = "QualityIssues";
})(HookExitCode || (HookExitCode = {}));

// dist/src/utils/file-utils.js
var import_fs = require("fs");
async function parseJsonInput() {
  let inputData = "";
  for await (const chunk of process.stdin) {
    inputData += chunk;
  }
  if (!inputData.trim()) {
    return null;
  }
  try {
    return JSON.parse(inputData);
  } catch {
    return null;
  }
}
async function fileExists(filePath) {
  try {
    await import_fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}
function isSourceFile(filePath) {
  return /\.(ts|tsx|js|jsx)$/.test(filePath);
}
async function readFile(filePath) {
  return import_fs.promises.readFile(filePath, "utf8");
}
async function writeFile(filePath, content) {
  await import_fs.promises.writeFile(filePath, content, "utf8");
}

// dist/src/utils/logger.js
var colors = {
  red: "\x1B[0;31m",
  green: "\x1B[0;32m",
  yellow: "\x1B[0;33m",
  blue: "\x1B[0;34m",
  cyan: "\x1B[0;36m",
  reset: "\x1B[0m"
};
function createLogger(prefix, debug = false) {
  return {
    info: (msg) => console.error(`${colors.blue}[${prefix}]${colors.reset} ${msg}`),
    error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    success: (msg) => console.error(`${colors.green}[OK]${colors.reset} ${msg}`),
    warning: (msg) => console.error(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
    debug: (msg) => {
      if (debug) {
        console.error(`${colors.cyan}[DEBUG]${colors.reset} ${msg}`);
      }
    }
  };
}

// dist/src/quality-check/checkers/common-issues.js
var import_path = __toESM(require("path"), 1);
async function createCommonIssuesChecker(filePath, config, log) {
  return {
    async check(fileType) {
      const errors = [];
      log.info("Checking for common issues...");
      try {
        const content = await readFile(filePath);
        const lines = content.split("\n");
        let foundIssues = false;
        const asAnyRule = config.fileConfig.rules?.asAny || {};
        if ((fileType === "typescript" || fileType === "component") && asAnyRule.enabled !== false) {
          lines.forEach((line, index) => {
            if (line.includes("as any")) {
              const severity = asAnyRule.severity || "error";
              const message = asAnyRule.message || 'Prefer proper types or "as unknown" for type assertions';
              if (severity === "error") {
                errors.push(`Found 'as any' usage in ${filePath} - ${message}`);
                console.error(`  Line ${index + 1}: ${line.trim()}`);
                foundIssues = true;
              } else {
                log.warning(`'as any' usage at line ${index + 1}: ${message}`);
              }
            }
          });
        }
        const consoleRule = config.fileConfig.rules?.console || {};
        let allowConsole = false;
        if (consoleRule.enabled === false) {
          allowConsole = true;
        } else {
          const allowedPaths = consoleRule.allowIn?.paths || [];
          if (allowedPaths.some((allowPath) => filePath.includes(allowPath))) {
            allowConsole = true;
          }
          const allowedFileTypes = consoleRule.allowIn?.fileTypes || [];
          if (allowedFileTypes.includes(fileType)) {
            allowConsole = true;
          }
          const allowedPatterns = consoleRule.allowIn?.patterns || [];
          const fileName = import_path.default.basename(filePath);
          if (allowedPatterns.some((pattern) => {
            const regex = new RegExp(pattern.replace(/\*/g, ".*"));
            return regex.test(fileName);
          })) {
            allowConsole = true;
          }
        }
        if (!allowConsole && consoleRule.enabled !== false) {
          lines.forEach((line, index) => {
            if (/console\./.test(line)) {
              const severity = consoleRule.severity || "info";
              const message = consoleRule.message || "Consider using a logging library";
              if (severity === "error") {
                errors.push(`Found console statements in ${filePath} - ${message}`);
                console.error(`  Line ${index + 1}: ${line.trim()}`);
                foundIssues = true;
              } else {
                log.warning(`Console usage at line ${index + 1}: ${message}`);
              }
            }
          });
        }
        lines.forEach((line, index) => {
          if (/TODO|FIXME/.test(line)) {
            log.warning(`Found TODO/FIXME comment at line ${index + 1}`);
          }
        });
        if (!foundIssues) {
          log.success("No common issues found");
        }
      } catch (error) {
        log.debug(`Common issues check error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      return errors;
    }
  };
}

// dist/src/quality-check/checkers/eslint.js
var import_path5 = __toESM(require("path"), 1);

// dist/src/utils/config-loader.js
var import_fs2 = require("fs");
var import_path2 = __toESM(require("path"), 1);
function findProjectRoot(startPath) {
  let currentPath = startPath;
  while (currentPath !== "/") {
    try {
      const stat = (0, import_fs2.statSync)(import_path2.default.join(currentPath, "package.json"));
      if (stat.isFile()) {
        return currentPath;
      }
    } catch {
    }
    currentPath = import_path2.default.dirname(currentPath);
  }
  return process.cwd();
}
function parseBoolean(value, defaultValue = false) {
  if (value === void 0)
    return defaultValue;
  return value !== "false";
}

// dist/src/quality-check/dummy-generator.js
var import_fs3 = require("fs");
var import_path3 = __toESM(require("path"), 1);
function generateDummyContent(parsedImport) {
  const { defaultImport, namedImports, namespace, isTypeOnly } = parsedImport;
  const lines = [];
  lines.push("/**");
  lines.push(" * Auto-generated dummy implementation for TDD");
  lines.push(" * This file was created to satisfy ESLint during test-driven development.");
  lines.push(" * Replace this with your actual implementation.");
  lines.push(" */");
  lines.push("");
  if (isTypeOnly) {
    if (defaultImport) {
      lines.push(`export type ${defaultImport} = {`);
      lines.push("  // TODO: Add actual type definition");
      lines.push("  _dummy: true");
      lines.push("}");
      lines.push("");
    }
    for (const namedImport of namedImports) {
      if (isInterfaceOrTypeName(namedImport)) {
        lines.push(`export interface ${namedImport} {`);
        lines.push("  // TODO: Add actual interface definition");
        lines.push("  _dummy: true");
        lines.push("}");
      } else {
        lines.push(`export type ${namedImport} = any // TODO: Add actual type`);
      }
      lines.push("");
    }
  } else {
    if (defaultImport) {
      if (isComponentName(defaultImport)) {
        lines.push(generateReactComponent(defaultImport, true));
      } else {
        lines.push(generateFunction(defaultImport, true));
      }
      lines.push("");
    }
    for (const namedImport of namedImports) {
      if (isComponentName(namedImport)) {
        lines.push(generateReactComponent(namedImport, false));
      } else if (isConstantName(namedImport)) {
        lines.push(generateConstant(namedImport));
      } else {
        lines.push(generateFunction(namedImport, false));
      }
      lines.push("");
    }
    if (namespace) {
      lines.push(`const ${namespace} = {`);
      lines.push("  // TODO: Add namespace exports");
      lines.push("}");
      lines.push("");
      lines.push(`export default ${namespace}`);
    }
  }
  return lines.join("\n");
}
function isComponentName(name) {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}
function isConstantName(name) {
  return /^[A-Z_][A-Z0-9_]*$/.test(name);
}
function isInterfaceOrTypeName(name) {
  return /^I[A-Z]/.test(name) || /Type$/.test(name) || isComponentName(name);
}
function generateReactComponent(name, isDefault) {
  const lines = [
    `${isDefault ? "export default " : "export "}function ${name}(props: any) {`,
    `  throw new Error('${name} component not implemented yet')`,
    `  // TODO: Implement ${name} component`,
    `  // return <div>${name}</div>`,
    "}"
  ];
  return lines.join("\n");
}
function generateFunction(name, isDefault) {
  const lines = [
    `${isDefault ? "export default " : "export "}function ${name}(...args: any[]): any {`,
    `  throw new Error('${name} not implemented yet')`,
    "  // TODO: Implement this function",
    "}"
  ];
  return lines.join("\n");
}
function generateConstant(name) {
  return `export const ${name} = {} as any // TODO: Add actual value`;
}
async function createDummyFile(filePath, parsedImport, log) {
  try {
    const dir = import_path3.default.dirname(filePath);
    await import_fs3.promises.mkdir(dir, { recursive: true });
    try {
      await import_fs3.promises.access(filePath);
      return false;
    } catch {
    }
    const content = generateDummyContent(parsedImport);
    await import_fs3.promises.writeFile(filePath, content, "utf8");
    if (log) {
      log(`\u{1F4DD} Created dummy implementation: ${import_path3.default.relative(process.cwd(), filePath)}`);
      log("   (Replace with actual implementation)");
    }
    return true;
  } catch (error) {
    if (log) {
      log(`Failed to create dummy file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    return false;
  }
}

// dist/src/quality-check/import-parser.js
var import_path4 = __toESM(require("path"), 1);
function parseImportStatement(statement) {
  const cleaned = statement.trim().replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
  const importRegex = /^import\s+(?:type\s+)?(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s*(?:,\s*\*\s+as\s+(\w+))?\s*from\s*['"]([^'"]+)['"]/;
  const namespaceRegex = /^import\s+(?:type\s+)?\*\s+as\s+(\w+)\s+from\s*['"]([^'"]+)['"]/;
  let match = importRegex.exec(cleaned);
  let isNamespace = false;
  if (!match) {
    match = namespaceRegex.exec(cleaned);
    isNamespace = true;
  }
  if (!match) {
    return null;
  }
  if (isNamespace) {
    const [, namespace2, importPath2] = match;
    return {
      importPath: importPath2,
      isRelative: importPath2.startsWith("."),
      isTypeOnly: cleaned.includes("import type"),
      namedImports: [],
      namespace: namespace2,
      rawStatement: statement
    };
  }
  const [, defaultImport, namedImportsStr, namespace, importPath] = match;
  const namedImports = [];
  if (namedImportsStr) {
    namedImportsStr.split(",").forEach((imp) => {
      const trimmed = imp.trim();
      if (trimmed) {
        const renamed = trimmed.split(/\s+as\s+/);
        namedImports.push(renamed[0].trim());
      }
    });
  }
  return {
    importPath,
    isRelative: importPath.startsWith("."),
    isTypeOnly: cleaned.includes("import type"),
    defaultImport: defaultImport?.trim(),
    namedImports,
    namespace: namespace?.trim(),
    rawStatement: statement
  };
}
function extractImportErrors(eslintMessages) {
  const importErrors = [];
  for (const message of eslintMessages) {
    if (message.message?.includes("Unable to resolve") || message.message?.includes("Cannot find module") || message.message?.includes("Could not find a declaration file") || message.ruleId === "import/no-unresolved" || message.ruleId === "import/named") {
      const pathMatch = message.message?.match(/['"]([^'"]+)['"]/);
      importErrors.push({
        message: message.message || "Import error",
        importPath: pathMatch?.[1],
        line: message.line || 0,
        column: message.column || 0
      });
    }
  }
  return importErrors;
}
function determineFileExtension(importPath, isTypeOnly, fileContext) {
  if (/\.[jt]sx?$/.test(importPath)) {
    return "";
  }
  if (isTypeOnly) {
    return ".ts";
  }
  const importName = importPath.split("/").pop() || "";
  if (/^[A-Z]/.test(importName) || // PascalCase suggests component
  importPath.includes("components") || fileContext.includes(".tsx")) {
    return ".tsx";
  }
  return ".ts";
}
function resolveImportPath(importPath, currentFile, projectRoot) {
  if (!importPath.startsWith(".")) {
    return importPath;
  }
  const currentDir = import_path4.default.dirname(currentFile);
  const resolved = import_path4.default.resolve(currentDir, importPath);
  return import_path4.default.relative(projectRoot, resolved);
}

// dist/src/quality-check/checkers/eslint.js
async function createESLintChecker(filePath, config, log) {
  if (!config.eslintEnabled) {
    return null;
  }
  const projectRoot = findProjectRoot(import_path5.default.dirname(filePath));
  const isTestFile = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath);
  let ESLint;
  try {
    const eslintModule = await import(import_path5.default.join(projectRoot, "node_modules", "eslint", "lib", "api.js"));
    ESLint = eslintModule.ESLint;
  } catch {
    log.debug("ESLint not found in project - will skip ESLint checks");
    return null;
  }
  return {
    async check() {
      const errors = [];
      const autofixes = [];
      log.info("Running ESLint...");
      try {
        const eslint = new ESLint({
          fix: config.eslintAutofix,
          cwd: projectRoot
        });
        let results = await eslint.lintFiles([filePath]);
        let result = results[0];
        if (isTestFile && result?.messages) {
          const importErrors = extractImportErrors(result.messages);
          if (importErrors.length > 0) {
            log.info("Detected import errors in test file, checking if dummy implementations needed...");
            let dummiesCreated = false;
            try {
              const fileContent = await readFile(filePath);
              const lines = fileContent.split("\n");
              for (const importError of importErrors) {
                if (!importError.importPath)
                  continue;
                const importLine = lines[importError.line - 1];
                if (!importLine)
                  continue;
                const parsedImport = parseImportStatement(importLine);
                if (!parsedImport || !parsedImport.isRelative)
                  continue;
                const resolvedPath = resolveImportPath(parsedImport.importPath, filePath, projectRoot);
                const ext = determineFileExtension(resolvedPath, parsedImport.isTypeOnly, filePath);
                const fullPath = import_path5.default.join(projectRoot, resolvedPath + ext);
                if (!await fileExists(fullPath)) {
                  const created = await createDummyFile(fullPath, parsedImport, (msg) => log.info(msg));
                  if (created) {
                    dummiesCreated = true;
                  }
                }
              }
              if (dummiesCreated) {
                log.info("Re-running ESLint after creating dummy implementations...");
                results = await eslint.lintFiles([filePath]);
                result = results[0];
              }
            } catch (error) {
              log.debug(`Error handling import errors: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
          }
        }
        if (result && (result.errorCount > 0 || result.warningCount > 0)) {
          if (config.eslintAutofix) {
            log.warning("ESLint issues found, attempting auto-fix...");
            if (result.output) {
              await writeFile(filePath, result.output);
              const resultsAfterFix = await eslint.lintFiles([filePath]);
              const resultAfterFix = resultsAfterFix[0];
              if (resultAfterFix && resultAfterFix.errorCount === 0 && resultAfterFix.warningCount === 0) {
                log.success("ESLint auto-fixed all issues!");
                if (config.autofixSilent) {
                  autofixes.push("ESLint auto-fixed formatting/style issues");
                } else {
                  errors.push("ESLint issues were auto-fixed - verify the changes");
                }
              } else {
                errors.push(`ESLint found issues that couldn't be auto-fixed in ${filePath}`);
                const formatter = await eslint.loadFormatter("stylish");
                const output = await formatter.format(resultsAfterFix);
                console.error(output);
              }
            } else {
              errors.push(`ESLint found issues in ${filePath}`);
              const formatter = await eslint.loadFormatter("stylish");
              const output = await formatter.format(results);
              console.error(output);
            }
          } else {
            errors.push(`ESLint found issues in ${filePath}`);
            const formatter = await eslint.loadFormatter("stylish");
            const output = await formatter.format(results);
            console.error(output);
          }
        } else {
          log.success("ESLint passed");
        }
      } catch (error) {
        log.debug(`ESLint check error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      return { errors, autofixes };
    }
  };
}

// dist/src/quality-check/checkers/prettier.js
var import_path6 = __toESM(require("path"), 1);
async function createPrettierChecker(filePath, config, log) {
  if (!config.prettierEnabled) {
    return null;
  }
  const projectRoot = findProjectRoot(import_path6.default.dirname(filePath));
  let prettier;
  try {
    const prettierPath = import_path6.default.join(projectRoot, "node_modules", "prettier", "index.cjs");
    const prettierModule = await import(prettierPath);
    if ("default" in prettierModule && prettierModule.default) {
      prettier = prettierModule.default;
    } else {
      prettier = prettierModule;
    }
  } catch (error) {
    log.debug(`Prettier not found in project - will skip Prettier checks. Error: ${error}`);
    return null;
  }
  return {
    async check() {
      const errors = [];
      const autofixes = [];
      log.info("Running Prettier check...");
      try {
        const fileContent = await readFile(filePath);
        const prettierConfig = await prettier.resolveConfig(filePath);
        const isFormatted = await prettier.check(fileContent, {
          ...prettierConfig,
          filepath: filePath
        });
        if (!isFormatted) {
          if (config.prettierAutofix) {
            log.warning("Prettier formatting issues found, auto-fixing...");
            const formatted = await prettier.format(fileContent, {
              ...prettierConfig,
              filepath: filePath
            });
            await writeFile(filePath, formatted);
            log.success("Prettier auto-formatted the file!");
            if (config.autofixSilent) {
              autofixes.push("Prettier auto-formatted the file");
            } else {
              errors.push("Prettier formatting was auto-fixed - verify the changes");
            }
          } else {
            errors.push(`Prettier formatting issues in ${filePath}`);
            console.error("Run prettier --write to fix");
          }
        } else {
          log.success("Prettier formatting correct");
        }
      } catch (error) {
        log.debug(`Prettier check error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      return { errors, autofixes };
    }
  };
}

// dist/src/quality-check/checkers/typescript.js
var import_fs4 = require("fs");
var import_path7 = __toESM(require("path"), 1);
async function createTypeScriptChecker(filePath, config, log, tsConfigCache) {
  if (!config.typescriptEnabled) {
    return null;
  }
  if (filePath.endsWith(".js") && filePath.includes(".claude/hooks/")) {
    log.debug("Skipping TypeScript check for JavaScript hook file");
    return null;
  }
  const projectRoot = findProjectRoot(import_path7.default.dirname(filePath));
  log.debug(`Project root: ${projectRoot}`);
  log.debug(`Looking for TypeScript at: ${import_path7.default.join(projectRoot, "node_modules", "typescript")}`);
  let ts;
  try {
    ts = await import(import_path7.default.join(projectRoot, "node_modules", "typescript", "lib", "typescript.js"));
  } catch (error) {
    log.debug(`TypeScript not found in project - will skip TypeScript checks. Error: ${error}`);
    return null;
  }
  const isTestFile = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath);
  return {
    async check() {
      const errors = [];
      log.info("Running TypeScript compilation check...");
      try {
        const configPath = tsConfigCache.getTsConfigForFile(filePath);
        if (!(0, import_fs4.existsSync)(configPath)) {
          log.debug(`No TypeScript config found: ${configPath}`);
          return errors;
        }
        log.debug(`Using TypeScript config: ${import_path7.default.basename(configPath)} for ${import_path7.default.relative(projectRoot, filePath)}`);
        const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
        const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, import_path7.default.dirname(configPath));
        log.debug(`TypeScript checking edited file only`);
        let program = ts.createProgram([filePath], parsedConfig.options);
        let diagnostics = ts.getPreEmitDiagnostics(program);
        if (isTestFile && diagnostics.length > 0) {
          const importDiagnostics = diagnostics.filter(
            (d) => d.code === 2307 || // Cannot find module
            d.code === 2792
            // Cannot find module (type declarations)
          );
          if (importDiagnostics.length > 0) {
            log.info("Detected import errors in test file, creating dummy implementations...");
            let dummiesCreated = false;
            try {
              const fileContent = await readFile(filePath);
              const lines = fileContent.split("\n");
              for (const diagnostic of importDiagnostics) {
                if (!diagnostic.file || !diagnostic.start)
                  continue;
                const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                const importLine = lines[line];
                if (!importLine)
                  continue;
                const parsedImport = parseImportStatement(importLine);
                if (!parsedImport || !parsedImport.isRelative)
                  continue;
                const resolvedPath = resolveImportPath(parsedImport.importPath, filePath, projectRoot);
                const ext = determineFileExtension(resolvedPath, parsedImport.isTypeOnly, filePath);
                const fullPath = import_path7.default.join(projectRoot, resolvedPath + ext);
                if (!await fileExists(fullPath)) {
                  const created = await createDummyFile(fullPath, parsedImport, (msg) => log.info(msg));
                  if (created) {
                    dummiesCreated = true;
                  }
                }
              }
              if (dummiesCreated) {
                log.info("Re-running TypeScript check after creating dummy implementations...");
                program = ts.createProgram([filePath], parsedConfig.options);
                diagnostics = ts.getPreEmitDiagnostics(program);
              }
            } catch (error) {
              log.debug(`Error handling import errors: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
          }
        }
        const diagnosticsByFile = /* @__PURE__ */ new Map();
        for (const d of diagnostics) {
          if (d.file) {
            const fileName = d.file.fileName;
            if (!diagnosticsByFile.has(fileName)) {
              diagnosticsByFile.set(fileName, []);
            }
            diagnosticsByFile.get(fileName).push(d);
          }
        }
        const editedFileDiagnostics = diagnosticsByFile.get(filePath) || [];
        if (editedFileDiagnostics.length > 0) {
          errors.push(`TypeScript errors in edited file (using ${import_path7.default.basename(configPath)})`);
          for (const diagnostic of editedFileDiagnostics) {
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            const { line, character } = diagnostic.file ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start) : { line: 0, character: 0 };
            console.error(`  \u274C ${diagnostic.file?.fileName || "unknown"}:${line + 1}:${character + 1} - ${message}`);
          }
        }
        if (config.showDependencyErrors) {
          let hasDepErrors = false;
          diagnosticsByFile.forEach((diags, fileName) => {
            if (fileName !== filePath) {
              if (!hasDepErrors) {
                console.error("\n[DEPENDENCY ERRORS] Files imported by your edited file:");
                hasDepErrors = true;
              }
              console.error(`  \u26A0\uFE0F ${fileName}:`);
              for (const diagnostic of diags) {
                const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
                const { line, character } = diagnostic.file ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start) : { line: 0, character: 0 };
                console.error(`     Line ${line + 1}:${character + 1} - ${message}`);
              }
            }
          });
        }
        if (diagnostics.length === 0) {
          log.success("TypeScript compilation passed");
        }
      } catch (error) {
        log.debug(`TypeScript check error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      return errors;
    }
  };
}

// dist/src/quality-check/config.js
var import_fs5 = require("fs");
async function loadQualityConfig(configPath) {
  let fileConfig = {};
  try {
    const content = await import_fs5.promises.readFile(configPath, "utf8");
    fileConfig = JSON.parse(content);
  } catch {
  }
  return {
    // TypeScript settings
    typescriptEnabled: process.env.CLAUDE_HOOKS_TYPESCRIPT_ENABLED !== void 0 ? parseBoolean(process.env.CLAUDE_HOOKS_TYPESCRIPT_ENABLED, true) : fileConfig.typescript?.enabled ?? true,
    showDependencyErrors: process.env.CLAUDE_HOOKS_SHOW_DEPENDENCY_ERRORS !== void 0 ? parseBoolean(process.env.CLAUDE_HOOKS_SHOW_DEPENDENCY_ERRORS) : fileConfig.typescript?.showDependencyErrors ?? false,
    // ESLint settings
    eslintEnabled: process.env.CLAUDE_HOOKS_ESLINT_ENABLED !== void 0 ? parseBoolean(process.env.CLAUDE_HOOKS_ESLINT_ENABLED, true) : fileConfig.eslint?.enabled ?? true,
    eslintAutofix: process.env.CLAUDE_HOOKS_ESLINT_AUTOFIX !== void 0 ? parseBoolean(process.env.CLAUDE_HOOKS_ESLINT_AUTOFIX) : fileConfig.eslint?.autofix ?? false,
    // Prettier settings
    prettierEnabled: process.env.CLAUDE_HOOKS_PRETTIER_ENABLED !== void 0 ? parseBoolean(process.env.CLAUDE_HOOKS_PRETTIER_ENABLED, true) : fileConfig.prettier?.enabled ?? true,
    prettierAutofix: process.env.CLAUDE_HOOKS_PRETTIER_AUTOFIX !== void 0 ? parseBoolean(process.env.CLAUDE_HOOKS_PRETTIER_AUTOFIX) : fileConfig.prettier?.autofix ?? false,
    // General settings
    autofixSilent: process.env.CLAUDE_HOOKS_AUTOFIX_SILENT !== void 0 ? parseBoolean(process.env.CLAUDE_HOOKS_AUTOFIX_SILENT) : fileConfig.general?.autofixSilent ?? false,
    debug: process.env.CLAUDE_HOOKS_DEBUG !== void 0 ? parseBoolean(process.env.CLAUDE_HOOKS_DEBUG) : fileConfig.general?.debug ?? false,
    // Ignore patterns
    ignorePatterns: fileConfig.ignore?.patterns || [],
    // Store the full config for rule access
    fileConfig
  };
}

// dist/src/quality-check/typescript-cache.js
var import_crypto = __toESM(require("crypto"), 1);
var import_fs6 = require("fs");
var import_path8 = __toESM(require("path"), 1);
var TypeScriptConfigCache = class {
  cacheFile;
  cache;
  projectRoot;
  constructor(hookDir) {
    this.projectRoot = findProjectRoot(hookDir);
    this.cacheFile = import_path8.default.join(hookDir, "tsconfig-cache.json");
    this.cache = { hashes: {}, mappings: {} };
    this.loadCache();
  }
  /**
   * Get config hash for cache validation
   */
  getConfigHash(configPath) {
    try {
      const content = (0, import_fs6.readFileSync)(configPath, "utf8");
      return import_crypto.default.createHash("sha256").update(content).digest("hex");
    } catch {
      return null;
    }
  }
  /**
   * Find all tsconfig files in project
   */
  findTsConfigFiles() {
    const configs = [];
    const commonConfigs = [
      "tsconfig.json",
      "tsconfig.webview.json",
      "tsconfig.test.json",
      "tsconfig.node.json"
    ];
    for (const config of commonConfigs) {
      const configPath = import_path8.default.join(this.projectRoot, config);
      if ((0, import_fs6.existsSync)(configPath)) {
        configs.push(configPath);
      }
    }
    return configs;
  }
  /**
   * Check if cache is valid by comparing config hashes
   * This complements Turborepo's caching by providing finer-grained
   * invalidation for TypeScript config resolution
   */
  isValid() {
    const configFiles = this.findTsConfigFiles();
    if (Object.keys(this.cache.hashes).length !== configFiles.length) {
      return false;
    }
    for (const configPath of configFiles) {
      const currentHash = this.getConfigHash(configPath);
      if (currentHash !== this.cache.hashes[configPath]) {
        return false;
      }
    }
    return true;
  }
  /**
   * Rebuild cache by parsing all configs and creating file mappings
   */
  rebuild() {
    this.cache = { hashes: {}, mappings: {} };
    const configPriority = [
      "tsconfig.webview.json",
      "tsconfig.test.json",
      "tsconfig.json"
    ];
    for (const configName of configPriority) {
      const configPath = import_path8.default.join(this.projectRoot, configName);
      if (!(0, import_fs6.existsSync)(configPath)) {
        continue;
      }
      const hash = this.getConfigHash(configPath);
      if (hash) {
        this.cache.hashes[configPath] = hash;
      }
      try {
        const configContent = (0, import_fs6.readFileSync)(configPath, "utf8");
        const config = JSON.parse(configContent);
        if (config.include) {
          for (const pattern of config.include) {
            if (!this.cache.mappings[pattern]) {
              this.cache.mappings[pattern] = {
                configPath,
                excludes: config.exclude || []
              };
            }
          }
        }
      } catch {
      }
    }
    this.saveCache();
  }
  /**
   * Load cache from disk
   */
  loadCache() {
    try {
      const cacheContent = (0, import_fs6.readFileSync)(this.cacheFile, "utf8");
      this.cache = JSON.parse(cacheContent);
    } catch {
      this.cache = { hashes: {}, mappings: {} };
    }
  }
  /**
   * Save cache to disk
   */
  saveCache() {
    try {
      (0, import_fs6.writeFileSync)(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch {
    }
  }
  /**
   * Get appropriate tsconfig for a file
   */
  getTsConfigForFile(filePath) {
    if (!this.isValid()) {
      this.rebuild();
    }
    const relativePath = import_path8.default.relative(this.projectRoot, filePath);
    const sortedMappings = Object.entries(this.cache.mappings).sort(([a], [b]) => {
      const aSpecificity = a.split("/").length + (a.includes("**") ? 0 : 10);
      const bSpecificity = b.split("/").length + (b.includes("**") ? 0 : 10);
      return bSpecificity - aSpecificity;
    });
    for (const [pattern, mapping] of sortedMappings) {
      if (this.matchesPattern(relativePath, pattern)) {
        let isExcluded = false;
        for (const exclude of mapping.excludes) {
          if (this.matchesPattern(relativePath, exclude)) {
            isExcluded = true;
            break;
          }
        }
        if (!isExcluded) {
          return mapping.configPath;
        }
      }
    }
    if (relativePath.includes("webview/")) {
      const webviewConfig = import_path8.default.join(this.projectRoot, "tsconfig.webview.json");
      if ((0, import_fs6.existsSync)(webviewConfig)) {
        return webviewConfig;
      }
    }
    if (relativePath.includes(".test.") || relativePath.includes(".spec.")) {
      const testConfig = import_path8.default.join(this.projectRoot, "tsconfig.test.json");
      if ((0, import_fs6.existsSync)(testConfig)) {
        return testConfig;
      }
    }
    return import_path8.default.join(this.projectRoot, "tsconfig.json");
  }
  /**
   * Simple pattern matching for file paths
   */
  matchesPattern(filePath, pattern) {
    if (pattern.endsWith("/**/*")) {
      const baseDir = pattern.slice(0, -5);
      return filePath.startsWith(baseDir);
    }
    const regexPattern = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\u{1F31F}").replace(/\*/g, "[^/]*").replace(/🌟/g, ".*").replace(/\?/g, ".");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }
};

// dist/src/quality-check/index.js
var QualityChecker = class {
  filePath;
  fileType;
  errors = [];
  autofixes = [];
  constructor(filePath) {
    this.filePath = filePath;
    this.fileType = this.detectFileType(filePath);
  }
  /**
   * Detect file type from path
   */
  detectFileType(filePath) {
    if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath)) {
      return "test";
    }
    if (/\/store\/|\/slices\/|\/reducers\//.test(filePath)) {
      return "redux";
    }
    if (/\/components\/.*\.(tsx|jsx)$/.test(filePath)) {
      return "component";
    }
    if (/\.(ts|tsx)$/.test(filePath)) {
      return "typescript";
    }
    if (/\.(js|jsx)$/.test(filePath)) {
      return "javascript";
    }
    return "unknown";
  }
  /**
   * Run all quality checks
   */
  async checkAll(config, log, tsConfigCache) {
    if (this.fileType === "unknown") {
      log.info("Unknown file type, skipping detailed checks");
      return { errors: [], autofixes: [] };
    }
    const checkers = await Promise.all([
      createTypeScriptChecker(this.filePath, config, log, tsConfigCache),
      createESLintChecker(this.filePath, config, log),
      createPrettierChecker(this.filePath, config, log),
      createCommonIssuesChecker(this.filePath, config, log)
    ]);
    const results = await Promise.all([
      checkers[0] ? checkers[0].check() : Promise.resolve([]),
      checkers[1] ? checkers[1].check() : Promise.resolve({ errors: [], autofixes: [] }),
      checkers[2] ? checkers[2].check() : Promise.resolve({ errors: [], autofixes: [] }),
      checkers[3].check(this.fileType)
    ]);
    this.errors.push(...results[0]);
    this.errors.push(...results[1].errors);
    this.autofixes.push(...results[1].autofixes);
    this.errors.push(...results[2].errors);
    this.autofixes.push(...results[2].autofixes);
    this.errors.push(...results[3]);
    await this.suggestRelatedTests(log);
    return {
      errors: this.errors,
      autofixes: this.autofixes
    };
  }
  /**
   * Suggest related test files
   */
  async suggestRelatedTests(log) {
    if (this.fileType === "test") {
      return;
    }
    const baseName = this.filePath.replace(/\.[^.]+$/, "");
    const testExtensions = ["test.ts", "test.tsx", "spec.ts", "spec.tsx"];
    let hasTests = false;
    for (const ext of testExtensions) {
      if (await fileExists(`${baseName}.${ext}`)) {
        hasTests = true;
        log.warning(`\u{1F4A1} Related test found: ${import_path9.default.basename(baseName)}.${ext}`);
        log.warning("   Consider running the tests to ensure nothing broke");
        break;
      }
    }
    if (!hasTests) {
      const dir = import_path9.default.dirname(this.filePath);
      const fileName = import_path9.default.basename(this.filePath);
      const baseFileName = fileName.replace(/\.[^.]+$/, "");
      for (const ext of testExtensions) {
        if (await fileExists(import_path9.default.join(dir, "__tests__", `${baseFileName}.${ext}`))) {
          hasTests = true;
          log.warning(`\u{1F4A1} Related test found: __tests__/${baseFileName}.${ext}`);
          log.warning("   Consider running the tests to ensure nothing broke");
          break;
        }
      }
    }
    if (!hasTests) {
      log.warning(`\u{1F4A1} No test file found for ${import_path9.default.basename(this.filePath)}`);
      log.warning("   Consider adding tests for better code quality");
    }
    if (/\/state\/slices\//.test(this.filePath)) {
      log.warning("\u{1F4A1} Redux state file! Consider testing state updates");
    } else if (/\/components\//.test(this.filePath)) {
      log.warning("\u{1F4A1} Component file! Consider testing UI behavior");
    } else if (/\/services\//.test(this.filePath)) {
      log.warning("\u{1F4A1} Service file! Consider testing business logic");
    }
  }
};
function extractFilePath(input) {
  const { tool_input } = input;
  if (!tool_input) {
    return null;
  }
  return tool_input.file_path || tool_input.path || tool_input.notebook_path || null;
}
function printSummary(errors, autofixes) {
  if (autofixes.length > 0) {
    console.error(`
${colors.blue}\u2550\u2550\u2550 Auto-fixes Applied \u2550\u2550\u2550${colors.reset}`);
    autofixes.forEach((fix) => {
      console.error(`${colors.green}\u2728${colors.reset} ${fix}`);
    });
    console.error(`${colors.green}Automatically fixed ${autofixes.length} issue(s) for you!${colors.reset}`);
  }
  if (errors.length > 0) {
    console.error(`
${colors.blue}\u2550\u2550\u2550 Quality Check Summary \u2550\u2550\u2550${colors.reset}`);
    errors.forEach((error) => {
      console.error(`${colors.red}\u274C${colors.reset} ${error}`);
    });
    console.error(`
${colors.red}Found ${errors.length} issue(s) that MUST be fixed!${colors.reset}`);
    console.error(`${colors.red}\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550${colors.reset}`);
    console.error(`${colors.red}\u274C ALL ISSUES ARE BLOCKING \u274C${colors.reset}`);
    console.error(`${colors.red}\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550${colors.reset}`);
    console.error(`${colors.red}Fix EVERYTHING above until all checks are \u2705 GREEN${colors.reset}`);
  }
}
async function main() {
  const configPath = import_path9.default.join(process.cwd(), ".claude/hooks/react-app/hook-config.json");
  const config = await loadQualityConfig(configPath);
  const log = createLogger("INFO", config.debug);
  const hookVersion = config.fileConfig.version || "1.0.0";
  console.error("");
  console.error(`\u269B\uFE0F  React App Quality Check v${hookVersion} - Starting...`);
  console.error("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  log.debug(`Loaded config: ${JSON.stringify(config, null, 2)}`);
  const input = await parseJsonInput();
  const filePath = input ? extractFilePath(input) : null;
  if (!filePath) {
    log.warning("No file path found in JSON input. Tool might not be file-related.");
    log.debug(`JSON input was: ${JSON.stringify(input)}`);
    console.error(`
${colors.yellow}\u{1F449} No file to check - tool may not be file-related.${colors.reset}`);
    process.exit(HookExitCode.Success);
  }
  if (!await fileExists(filePath)) {
    log.info(`File does not exist: ${filePath} (may have been deleted)`);
    console.error(`
${colors.yellow}\u{1F449} File skipped - doesn't exist.${colors.reset}`);
    process.exit(HookExitCode.Success);
  }
  if (!isSourceFile(filePath)) {
    log.info(`Skipping non-source file: ${filePath}`);
    console.error(`
${colors.yellow}\u{1F449} File skipped - not a source file.${colors.reset}`);
    console.error(`
${colors.green}\u2705 No checks needed for ${import_path9.default.basename(filePath)}${colors.reset}`);
    process.exit(HookExitCode.Success);
  }
  console.error("");
  console.error(`\u{1F50D} Validating: ${import_path9.default.basename(filePath)}`);
  console.error("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  log.info(`Checking: ${filePath}`);
  const tsConfigCache = new TypeScriptConfigCache(process.cwd());
  const checker = new QualityChecker(filePath);
  const { errors, autofixes } = await checker.checkAll(config, log, tsConfigCache);
  printSummary(errors, autofixes);
  const editedFileErrors = errors.filter((e) => e.includes("edited file") || e.includes("ESLint found issues") || e.includes("Prettier formatting issues") || e.includes("console statements") || e.includes("'as any' usage") || e.includes("were auto-fixed"));
  const dependencyWarnings = errors.filter((e) => !editedFileErrors.includes(e));
  if (editedFileErrors.length > 0) {
    console.error(`
${colors.red}\u{1F6D1} FAILED - Fix issues in your edited file! \u{1F6D1}${colors.reset}`);
    console.error(`${colors.cyan}\u{1F4A1} CLAUDE.md CHECK:${colors.reset}`);
    console.error(`${colors.cyan}  \u2192 What CLAUDE.md pattern would have prevented this?${colors.reset}`);
    console.error(`${colors.cyan}  \u2192 Are you following JSDoc batching strategy?${colors.reset}`);
    console.error(`${colors.yellow}\u{1F4CB} NEXT STEPS:${colors.reset}`);
    console.error(`${colors.yellow}  1. Fix the issues listed above${colors.reset}`);
    console.error(`${colors.yellow}  2. The hook will run again automatically${colors.reset}`);
    console.error(`${colors.yellow}  3. Continue with your original task once all checks pass${colors.reset}`);
    process.exit(HookExitCode.QualityIssues);
  } else if (dependencyWarnings.length > 0) {
    console.error(`
${colors.yellow}\u26A0\uFE0F WARNING - Dependency issues found${colors.reset}`);
    console.error(`${colors.yellow}These won't block your progress but should be addressed${colors.reset}`);
    console.error(`
${colors.green}\u2705 Quality check passed for ${import_path9.default.basename(filePath)}${colors.reset}`);
    if (autofixes.length > 0 && config.autofixSilent) {
      console.error(`
${colors.yellow}\u{1F449} File quality verified. Auto-fixes applied. Continue with your task.${colors.reset}`);
    } else {
      console.error(`
${colors.yellow}\u{1F449} File quality verified. Continue with your task.${colors.reset}`);
    }
    process.exit(HookExitCode.Success);
  } else {
    console.error(`
${colors.green}\u2705 Quality check passed for ${import_path9.default.basename(filePath)}${colors.reset}`);
    if (autofixes.length > 0 && config.autofixSilent) {
      console.error(`
${colors.yellow}\u{1F449} File quality verified. Auto-fixes applied. Continue with your task.${colors.reset}`);
    } else {
      console.error(`
${colors.yellow}\u{1F449} File quality verified. Continue with your task.${colors.reset}`);
    }
    process.exit(HookExitCode.Success);
  }
}
process.on("unhandledRejection", (error) => {
  const log = createLogger("INFO", false);
  log.error(`Unhandled error: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exit(HookExitCode.GeneralError);
});
main().catch((error) => {
  const log = createLogger("INFO", false);
  log.error(`Fatal error: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exit(HookExitCode.GeneralError);
});
//# sourceMappingURL=quality-check.cjs.map
