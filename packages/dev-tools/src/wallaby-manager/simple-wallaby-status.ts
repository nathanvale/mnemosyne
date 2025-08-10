/* eslint-disable no-console */
import chalk from 'chalk'
import findProcess from 'find-process'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface WallabyStatus {
  running: boolean
  vsCodeExtensionFound: boolean
  serverProcesses: Array<{
    pid: number
    name: string
    port?: number
  }>
  configFileExists: boolean
}

export class SimpleWallabyStatus {
  /**
   * Check if Wallaby is running through VS Code
   */
  static async checkStatus(): Promise<WallabyStatus> {
    const status: WallabyStatus = {
      running: false,
      vsCodeExtensionFound: false,
      serverProcesses: [],
      configFileExists: false,
    }

    // Check if wallaby.cjs exists
    const configPath = join(process.cwd(), 'wallaby.cjs')
    status.configFileExists = existsSync(configPath)

    // Check if VS Code extension is installed
    const extensionsPath = join(homedir(), '.vscode', 'extensions')
    if (existsSync(extensionsPath)) {
      const extensions = readdirSync(extensionsPath)
      status.vsCodeExtensionFound = extensions.some((ext) =>
        ext.startsWith('wallabyjs.wallaby-vscode-'),
      )
    }

    // Find Wallaby server processes
    try {
      const processes = await findProcess('name', 'node')

      for (const proc of processes) {
        const cmd = proc.cmd || ''
        if (cmd.includes('wallaby') && cmd.includes('server.js')) {
          status.serverProcesses.push({
            pid: proc.pid,
            name: 'Wallaby Server',
            port: this.extractPort(cmd),
          })
          status.running = true
        }
      }
    } catch (error) {
      console.error(chalk.red('Error checking processes:'), error)
    }

    return status
  }

  /**
   * Extract port number from command line
   */
  private static extractPort(cmd: string): number | undefined {
    const portMatch = cmd.match(/--port=(\d+)/)
    return portMatch ? parseInt(portMatch[1], 10) : undefined
  }

  /**
   * Display status in a formatted way
   */
  static displayStatus(status: WallabyStatus): void {
    console.log(chalk.blue('\n🔍 Wallaby.js Status Check\n'))

    // Config file
    console.log(
      status.configFileExists
        ? chalk.green('✅ Config file found: wallaby.cjs')
        : chalk.yellow('⚠️  Config file not found: wallaby.cjs'),
    )

    // VS Code extension
    console.log(
      status.vsCodeExtensionFound
        ? chalk.green('✅ VS Code extension installed')
        : chalk.yellow('⚠️  VS Code extension not found'),
    )

    // Server status
    if (status.running && status.serverProcesses.length > 0) {
      console.log(chalk.green('✅ Wallaby server is running'))
      status.serverProcesses.forEach((proc) => {
        console.log(
          chalk.gray(
            `   - PID: ${proc.pid}${proc.port ? `, Port: ${proc.port}` : ''}`,
          ),
        )
      })
    } else {
      console.log(chalk.yellow('⚠️  Wallaby server is not running'))
      console.log(
        chalk.gray(
          '   Please start Wallaby through VS Code (Wallaby.js: Start)',
        ),
      )
    }

    // MCP tools status
    if (status.running) {
      console.log(chalk.green('\n✅ MCP tools should be available'))
      console.log(chalk.gray('   Try: mcp__wallaby__wallaby_allTests'))
    } else {
      console.log(chalk.yellow('\n⚠️  MCP tools unavailable'))
      console.log(chalk.gray('   Start Wallaby in VS Code to enable MCP tools'))
    }
  }
}
