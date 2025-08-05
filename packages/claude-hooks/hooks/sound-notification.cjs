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

// dist/src/sound-notification/index.js
var import_child_process = require("child_process");
var import_fs2 = require("fs");
var import_path = __toESM(require("path"), 1);

// dist/src/types/claude.js
var HookExitCode;
(function(HookExitCode2) {
  HookExitCode2[HookExitCode2["Success"] = 0] = "Success";
  HookExitCode2[HookExitCode2["GeneralError"] = 1] = "GeneralError";
  HookExitCode2[HookExitCode2["QualityIssues"] = 2] = "QualityIssues";
})(HookExitCode || (HookExitCode = {}));

// dist/src/utils/file-utils.js
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

// dist/src/sound-notification/config.js
var import_fs = require("fs");

// dist/src/utils/config-loader.js
function parseBoolean(value, defaultValue = false) {
  if (value === void 0)
    return defaultValue;
  return value !== "false";
}
function parseInteger(value, defaultValue = 0) {
  if (value === void 0)
    return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// dist/src/sound-notification/config.js
async function loadSoundConfig(configPath) {
  let fileConfig = {};
  try {
    const content = await import_fs.promises.readFile(configPath, "utf8");
    fileConfig = JSON.parse(content);
  } catch {
  }
  return {
    // Sound settings
    playOnSuccess: process.env.CLAUDE_HOOKS_SOUND_SUCCESS !== void 0 ? parseBoolean(process.env.CLAUDE_HOOKS_SOUND_SUCCESS) : fileConfig.settings?.playOnSuccess ?? true,
    playOnWarning: parseBoolean(process.env.CLAUDE_HOOKS_SOUND_WARNING, false) || (fileConfig.settings?.playOnWarning ?? false),
    playOnError: parseBoolean(process.env.CLAUDE_HOOKS_SOUND_ERROR, false) || (fileConfig.settings?.playOnError ?? false),
    // Volume control
    volume: process.env.CLAUDE_HOOKS_SOUND_VOLUME || (fileConfig.settings?.volume ?? "medium"),
    // Timing
    delay: parseInteger(process.env.CLAUDE_HOOKS_SOUND_DELAY) || (fileConfig.settings?.delay ?? 0),
    cooldown: parseInteger(process.env.CLAUDE_HOOKS_SOUND_COOLDOWN) || (fileConfig.settings?.cooldown ?? 2e3),
    // Filters
    minExecutionTime: parseInteger(process.env.CLAUDE_HOOKS_MIN_EXEC_TIME) || (fileConfig.filters?.minExecutionTime ?? 1e3),
    // Debug
    debug: parseBoolean(process.env.CLAUDE_HOOKS_DEBUG),
    // Store full config for access
    fileConfig
  };
}

// dist/src/sound-notification/index.js
var lastSoundTime = 0;
function isQuietHours(config) {
  const quietConfig = config.fileConfig.filters?.quietHours;
  if (!quietConfig?.enabled)
    return false;
  const now = /* @__PURE__ */ new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const startTime = parseInt(quietConfig.start?.replace(":", "") ?? "0");
  const endTime = parseInt(quietConfig.end?.replace(":", "") ?? "0");
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    return currentTime >= startTime && currentTime <= endTime;
  }
}
function checkCooldown(config, log) {
  const now = Date.now();
  const timeSinceLastSound = now - lastSoundTime;
  if (timeSinceLastSound < config.cooldown) {
    log.debug(`Cooldown active: ${config.cooldown - timeSinceLastSound}ms remaining`);
    return false;
  }
  return true;
}
function playSound(soundFile, config, log) {
  try {
    if (!(0, import_fs2.existsSync)(soundFile)) {
      log.debug(`Sound file not found: ${soundFile}`);
      return false;
    }
    if (config.delay > 0) {
      log.debug(`Waiting ${config.delay}ms before playing sound`);
      setTimeout(() => {
        (0, import_child_process.execSync)(`afplay "${soundFile}"`, { stdio: "ignore" });
      }, config.delay);
    } else {
      (0, import_child_process.execSync)(`afplay "${soundFile}"`, { stdio: "ignore" });
    }
    lastSoundTime = Date.now();
    log.success(`Played sound: ${import_path.default.basename(soundFile)}`);
    return true;
  } catch (error) {
    log.debug(`Failed to play sound: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}
function determineSoundType(input, config, log) {
  const { tool_name, tool_result } = input;
  const excludeTools = config.fileConfig.filters?.excludeTools || [];
  if (excludeTools.includes(tool_name)) {
    log.debug(`Tool ${tool_name} is excluded from sound notifications`);
    return null;
  }
  if (tool_result) {
    const resultStr = JSON.stringify(tool_result).toLowerCase();
    if (resultStr.includes("error") || resultStr.includes("failed") || resultStr.includes("\u274C")) {
      return config.playOnError ? "error" : null;
    }
    if (resultStr.includes("warning") || resultStr.includes("\u26A0\uFE0F")) {
      return config.playOnWarning ? "warning" : null;
    }
  }
  const successTools = config.fileConfig.triggers?.successTools || [];
  if (successTools.includes(tool_name)) {
    return config.playOnSuccess ? "success" : null;
  }
  if (tool_result) {
    const patterns = config.fileConfig.triggers?.completionPatterns || [];
    const resultStr = JSON.stringify(tool_result).toLowerCase();
    for (const pattern of patterns) {
      if (resultStr.includes(pattern.toLowerCase())) {
        return config.playOnSuccess ? "success" : null;
      }
    }
  }
  return null;
}
async function main() {
  const configPath = import_path.default.join(process.cwd(), ".claude/hooks/task-completion/hook-config.json");
  const config = await loadSoundConfig(configPath);
  const log = createLogger("SOUND", config.debug);
  log.debug("\u{1F50A} Task Completion Sound Hook - Starting...");
  if (isQuietHours(config)) {
    log.debug("Quiet hours active - sounds disabled");
    process.exit(HookExitCode.Success);
  }
  if (!checkCooldown(config, log)) {
    log.debug("Cooldown active - skipping sound");
    process.exit(HookExitCode.Success);
  }
  const input = await parseJsonInput();
  if (!input) {
    log.debug("No valid input - exiting silently");
    process.exit(HookExitCode.Success);
  }
  log.debug(`Processing tool: ${input.tool_name}`);
  const soundType = determineSoundType(input, config, log);
  if (!soundType) {
    log.debug("No sound notification needed for this tool/result");
    process.exit(HookExitCode.Success);
  }
  const soundConfig = config.fileConfig.sounds?.[soundType];
  if (!soundConfig?.enabled) {
    log.debug(`Sound type '${soundType}' is disabled`);
    process.exit(HookExitCode.Success);
  }
  let soundPlayed = false;
  if (soundConfig.file) {
    soundPlayed = playSound(soundConfig.file, config, log);
  }
  if (!soundPlayed && soundConfig.fallback) {
    log.debug("Trying fallback sound...");
    soundPlayed = playSound(soundConfig.fallback, config, log);
  }
  if (!soundPlayed) {
    log.warning(`Failed to play ${soundType} sound notification`);
    process.exit(HookExitCode.GeneralError);
  }
  process.exit(HookExitCode.Success);
}
process.on("unhandledRejection", (error) => {
  const log = createLogger("SOUND", false);
  log.error(`Unhandled error: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exit(HookExitCode.GeneralError);
});
main().catch((error) => {
  const log = createLogger("SOUND", false);
  log.error(`Fatal error: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exit(HookExitCode.GeneralError);
});
//# sourceMappingURL=sound-notification.cjs.map
