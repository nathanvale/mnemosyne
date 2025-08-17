# Cross-Repository Sub-Agent Deployment Solution

## Complete system for distributing and consuming research agents across any repository

This solution enables easy distribution and consumption of research agents across multiple repositories using various deployment strategies including NPM packages, Git integration, and direct downloads.

## Architecture Overview

```
Source Repo (research-agents)          Target Repos (any project)
├── .claude/agents/                   ├── .claude/agents/
├── dist/agents/                      │   ├── context7-specialist.md
├── package.json                      │   ├── firecrawl-specialist.md
└── deploy-scripts/                   │   └── tavily-researcher.md
                                      └── .claude/settings.json
```

## 1. NPM Package Distribution

### Source Repository Setup

```json
// package.json in research-agents repo
{
  "name": "@yourorg/research-agents",
  "version": "1.0.0",
  "description": "Reusable Claude Code research agents",
  "main": "dist/index.js",
  "bin": {
    "research-agents": "./bin/cli.js"
  },
  "files": ["dist/", ".claude/", "bin/", "templates/"],
  "scripts": {
    "build": "npm run build:agents && npm run build:package",
    "build:agents": "node scripts/build-agents.js",
    "build:package": "tsc && npm run copy-assets",
    "copy-assets": "cp -r .claude dist/ && cp -r templates dist/",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "@anthropic-ai/claude-code": ">=0.2.0"
  }
}
```

### CLI Installation Tool

```javascript
#!/usr/bin/env node
// bin/cli.js
const fs = require('fs').promises
const path = require('path')
const { execSync } = require('child_process')

class ResearchAgentsCLI {
  constructor() {
    this.availableAgents = ['context7', 'firecrawl', 'tavily']
  }

  async install(options = {}) {
    const {
      agents = this.availableAgents,
      target = '.claude',
      configOnly = false,
    } = options

    console.log('🤖 Installing Claude Code research agents...')

    // Create .claude directory structure
    await this.ensureDirectories(target)

    // Install agent definitions
    for (const agent of agents) {
      await this.installAgent(agent, target, configOnly)
    }

    // Update MCP configuration
    await this.updateMCPConfig(target, agents)

    // Install dependencies if needed
    if (!configOnly) {
      await this.installDependencies()
    }

    console.log('✅ Research agents installed successfully!')
    console.log(`\n📁 Agent files installed to: ${target}/agents/`)
    console.log('🔧 MCP configuration updated')
    console.log(
      '\n🚀 Usage: Run `claude` in this directory to access the agents',
    )
  }

  async ensureDirectories(target) {
    const dirs = [`${target}/agents`, `${target}/prompts`, `${target}/configs`]

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true })
    }
  }

  async installAgent(agentName, target, configOnly) {
    console.log(`📦 Installing ${agentName} agent...`)

    // Copy agent markdown definition
    const agentSource = path.join(
      __dirname,
      '..',
      'dist',
      '.claude',
      'agents',
      `${agentName}-specialist.md`,
    )
    const agentTarget = path.join(
      target,
      'agents',
      `${agentName}-specialist.md`,
    )

    try {
      const agentContent = await fs.readFile(agentSource, 'utf8')
      await fs.writeFile(agentTarget, agentContent)
    } catch (error) {
      console.error(`❌ Failed to install ${agentName} agent:`, error.message)
      return
    }

    // Copy XML prompt templates
    const promptSource = path.join(
      __dirname,
      '..',
      'templates',
      `${agentName}-prompts.xml`,
    )
    const promptTarget = path.join(
      target,
      'prompts',
      `${agentName}-prompts.xml`,
    )

    try {
      const promptContent = await fs.readFile(promptSource, 'utf8')
      await fs.writeFile(promptTarget, promptContent)
    } catch (error) {
      console.warn(`⚠️  No prompt templates found for ${agentName}`)
    }

    // Install agent implementation (if not config-only)
    if (!configOnly) {
      const implSource = path.join(
        __dirname,
        '..',
        'dist',
        'agents',
        `${agentName}.js`,
      )
      const implTarget = path.join(target, 'agents', `${agentName}.js`)

      try {
        const implContent = await fs.readFile(implSource, 'utf8')
        await fs.writeFile(implTarget, implContent)
      } catch (error) {
        console.warn(`⚠️  No implementation found for ${agentName}`)
      }
    }

    console.log(`✅ ${agentName} agent installed`)
  }

  async updateMCPConfig(target, agents) {
    const configPath = path.join(target, 'settings.json')

    let config = {}
    try {
      const existing = await fs.readFile(configPath, 'utf8')
      config = JSON.parse(existing)
    } catch (error) {
      // File doesn't exist, start fresh
    }

    // Ensure mcpServers section exists
    if (!config.mcpServers) {
      config.mcpServers = {}
    }

    // Add MCP servers for each agent
    for (const agent of agents) {
      const serverConfig = this.getMCPServerConfig(agent)
      if (serverConfig) {
        config.mcpServers[agent] = serverConfig
      }
    }

    await fs.writeFile(configPath, JSON.stringify(config, null, 2))
    console.log('🔧 Updated MCP server configuration')
  }

  getMCPServerConfig(agent) {
    const configs = {
      context7: {
        command: 'npx',
        args: ['-y', '@context7/mcp-server'],
        env: {
          CONTEXT7_API_KEY: '${CONTEXT7_API_KEY}',
        },
      },
      firecrawl: {
        command: 'npx',
        args: ['-y', '@firecrawl/mcp-server'],
        env: {
          FIRECRAWL_API_KEY: '${FIRECRAWL_API_KEY}',
        },
      },
      tavily: {
        command: 'npx',
        args: ['-y', '@tavily/mcp-server'],
        env: {
          TAVILY_API_KEY: '${TAVILY_API_KEY}',
        },
      },
    }

    return configs[agent]
  }

  async installDependencies() {
    console.log('📦 Installing MCP server dependencies...')

    try {
      execSync(
        'npm list @context7/mcp-server 2>/dev/null || npm install @context7/mcp-server',
        { stdio: 'inherit' },
      )
      execSync(
        'npm list @firecrawl/mcp-server 2>/dev/null || npm install @firecrawl/mcp-server',
        { stdio: 'inherit' },
      )
      execSync(
        'npm list @tavily/mcp-server 2>/dev/null || npm install @tavily/mcp-server',
        { stdio: 'inherit' },
      )
    } catch (error) {
      console.warn('⚠️  Some MCP servers may need manual installation')
    }
  }

  async list() {
    console.log('Available research agents:')
    for (const agent of this.availableAgents) {
      console.log(
        `  📚 ${agent}-specialist - ${this.getAgentDescription(agent)}`,
      )
    }
  }

  getAgentDescription(agent) {
    const descriptions = {
      context7: 'Documentation and API reference specialist',
      firecrawl: 'Web content extraction and analysis',
      tavily: 'Advanced research and comprehensive analysis',
    }
    return descriptions[agent] || 'Research specialist'
  }

  async uninstall(target = '.claude') {
    console.log('🗑️  Removing research agents...')

    try {
      // Remove agent files
      const agentsDir = path.join(target, 'agents')
      const entries = await fs.readdir(agentsDir)

      for (const entry of entries) {
        if (
          entry.includes('context7') ||
          entry.includes('firecrawl') ||
          entry.includes('tavily')
        ) {
          await fs.unlink(path.join(agentsDir, entry))
          console.log(`🗑️  Removed ${entry}`)
        }
      }

      // Clean up MCP config
      const configPath = path.join(target, 'settings.json')
      try {
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'))
        if (config.mcpServers) {
          delete config.mcpServers.context7
          delete config.mcpServers.firecrawl
          delete config.mcpServers.tavily
          await fs.writeFile(configPath, JSON.stringify(config, null, 2))
        }
      } catch (error) {
        // Config file doesn't exist or is malformed
      }

      console.log('✅ Research agents uninstalled')
    } catch (error) {
      console.error('❌ Error during uninstall:', error.message)
    }
  }
}

// CLI Interface
const cli = new ResearchAgentsCLI()

const command = process.argv[2]
const args = process.argv.slice(3)

switch (command) {
  case 'install':
    const options = {}

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--agents') {
        options.agents = args[i + 1]?.split(',') || []
        i++
      } else if (args[i] === '--target') {
        options.target = args[i + 1]
        i++
      } else if (args[i] === '--config-only') {
        options.configOnly = true
      }
    }

    cli.install(options)
    break

  case 'list':
    cli.list()
    break

  case 'uninstall':
    const target =
      args.find((arg) => arg.startsWith('--target='))?.split('=')[1] ||
      '.claude'
    cli.uninstall(target)
    break

  default:
    console.log(`
🤖 Research Agents CLI

Usage:
  research-agents install [options]     Install research agents
  research-agents list                  List available agents
  research-agents uninstall [options]   Remove research agents

Install Options:
  --agents <list>      Comma-separated list of agents (context7,firecrawl,tavily)
  --target <dir>       Target directory (default: .claude)
  --config-only        Install only configuration, not implementations

Examples:
  research-agents install
  research-agents install --agents context7,tavily
  research-agents install --target .my-claude --config-only
  research-agents uninstall
`)
}
```

## 2. Usage in Target Repositories

### Simple Installation

```bash
# In any repository where you want the agents
npm install -g @yourorg/research-agents

# Install all agents
research-agents install

# Install specific agents only
research-agents install --agents context7,tavily

# Config-only installation (no implementations)
research-agents install --config-only
```

### Project-Specific Installation

```bash
# Install as dev dependency
npm install --save-dev @yourorg/research-agents

# Add to package.json scripts
# package.json
{
  "scripts": {
    "setup-agents": "research-agents install",
    "setup-agents:dev": "research-agents install --config-only"
  }
}

# Run setup
npm run setup-agents
```

## 3. GitHub Action for Automated Deployment

### Source Repository Action

```yaml
# .github/workflows/publish-agents.yml
name: Publish Research Agents

on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  build-and-publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build agents
        run: npm run build

      - name: Create release artifacts
        run: |
          # Create distributable package
          tar -czf claude-agents.tar.gz .claude/ templates/

          # Create individual agent packages
          for agent in context7 firecrawl tavily; do
            mkdir -p releases/$agent
            cp .claude/agents/${agent}-specialist.md releases/$agent/
            cp templates/${agent}-prompts.xml releases/$agent/ 2>/dev/null || true
            tar -czf ${agent}-agent.tar.gz -C releases/$agent .
          done

      - name: Publish to NPM
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            claude-agents.tar.gz
            context7-agent.tar.gz
            firecrawl-agent.tar.gz
            tavily-agent.tar.gz
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Target Repository Action

```yaml
# .github/workflows/setup-claude-agents.yml in target repos
name: Setup Claude Research Agents

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  setup-agents:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Research Agents
        run: |
          npm install -g @yourorg/research-agents
          research-agents install --config-only

      - name: Commit agent configuration
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add .claude/
          git diff --staged --quiet || git commit -m "Update Claude research agents"
          git push
```

## 4. Direct Download Script

### One-Liner Installation

```bash
# Install latest version directly from GitHub
curl -fsSL https://raw.githubusercontent.com/yourorg/research-agents/main/install.sh | bash

# Or with specific agents
curl -fsSL https://raw.githubusercontent.com/yourorg/research-agents/main/install.sh | bash -s -- --agents context7,tavily
```

### Install Script

```bash
#!/bin/bash
# install.sh

set -e

REPO="yourorg/research-agents"
TARGET_DIR=".claude"
AGENTS="context7,firecrawl,tavily"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --agents)
      AGENTS="$2"
      shift 2
      ;;
    --target)
      TARGET_DIR="$2"
      shift 2
      ;;
    --version)
      VERSION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo "🤖 Installing Claude Code research agents..."

# Create target directory
mkdir -p "$TARGET_DIR/agents"
mkdir -p "$TARGET_DIR/prompts"

# Get latest release if version not specified
if [ -z "$VERSION" ]; then
  VERSION=$(curl -s https://api.github.com/repos/$REPO/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
fi

echo "📦 Downloading version $VERSION..."

# Download and extract agents
IFS=',' read -ra AGENT_ARRAY <<< "$AGENTS"
for agent in "${AGENT_ARRAY[@]}"; do
  echo "📥 Installing $agent agent..."

  # Download agent definition
  curl -fsSL "https://github.com/$REPO/releases/download/$VERSION/${agent}-agent.tar.gz" | \
    tar -xz -C "$TARGET_DIR/agents/"

  echo "✅ $agent agent installed"
done

# Update MCP configuration
echo "🔧 Updating MCP configuration..."

CONFIG_FILE="$TARGET_DIR/settings.json"
if [ ! -f "$CONFIG_FILE" ]; then
  echo '{"mcpServers": {}}' > "$CONFIG_FILE"
fi

# Add MCP server configurations (simplified)
python3 -c "
import json
import sys

config_file = '$CONFIG_FILE'
agents = '$AGENTS'.split(',')

with open(config_file, 'r') as f:
    config = json.load(f)

if 'mcpServers' not in config:
    config['mcpServers'] = {}

mcp_configs = {
    'context7': {
        'command': 'npx',
        'args': ['-y', '@context7/mcp-server'],
        'env': {'CONTEXT7_API_KEY': '\${CONTEXT7_API_KEY}'}
    },
    'firecrawl': {
        'command': 'npx',
        'args': ['-y', '@firecrawl/mcp-server'],
        'env': {'FIRECRAWL_API_KEY': '\${FIRECRAWL_API_KEY}'}
    },
    'tavily': {
        'command': 'npx',
        'args': ['-y', '@tavily/mcp-server'],
        'env': {'TAVILY_API_KEY': '\${TAVILY_API_KEY}'}
    }
}

for agent in agents:
    if agent in mcp_configs:
        config['mcpServers'][agent] = mcp_configs[agent]

with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)
"

echo "✅ Research agents installed successfully!"
echo ""
echo "📁 Agents installed to: $TARGET_DIR/agents/"
echo "🔧 MCP configuration updated in: $TARGET_DIR/settings.json"
echo ""
echo "🚀 Next steps:"
echo "   1. Set your API keys in environment variables:"
echo "      export CONTEXT7_API_KEY='your-key'"
echo "      export FIRECRAWL_API_KEY='your-key'"
echo "      export TAVILY_API_KEY='your-key'"
echo ""
echo "   2. Run 'claude' in this directory to start using the agents"
```

## 5. Template Repository Approach

### Create a Template Repository

```bash
# Create template repo with pre-installed agents
git clone https://github.com/yourorg/research-agents-template my-new-project
cd my-new-project

# Agents are already configured and ready to use
claude
```

### Template Repository Structure

```
research-agents-template/
├── .claude/
│   ├── agents/
│   │   ├── context7-specialist.md
│   │   ├── firecrawl-specialist.md
│   │   └── tavily-researcher.md
│   └── settings.json
├── .env.example
├── README.md
└── package.json
```

## 6. Workspace Integration

### VS Code Extension

```json
// .vscode/settings.json
{
  "claude-code.agents.autoInstall": true,
  "claude-code.agents.repository": "yourorg/research-agents",
  "claude-code.agents.version": "latest"
}
```

### IDE Integration Script

```javascript
// scripts/setup-workspace.js
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function setupWorkspace() {
  console.log('🛠️  Setting up workspace with research agents...')

  // Check if Claude Code is installed
  try {
    execSync('claude --version', { stdio: 'ignore' })
  } catch (error) {
    console.log('📦 Installing Claude Code...')
    execSync('npm install -g @anthropic-ai/claude-code')
  }

  // Install research agents
  console.log('🤖 Installing research agents...')
  execSync('research-agents install')

  // Setup environment template
  if (!fs.existsSync('.env')) {
    fs.copyFileSync('.env.example', '.env')
    console.log('📝 Created .env file from template')
  }

  console.log('✅ Workspace setup complete!')
}

setupWorkspace()
```

## 7. Configuration Management

### Environment-Specific Configurations

```javascript
// configs/environments.js
module.exports = {
  development: {
    agents: ['context7', 'firecrawl', 'tavily'],
    mcpServers: {
      context7: {
        /* dev config */
      },
      firecrawl: {
        /* dev config */
      },
      tavily: {
        /* dev config */
      },
    },
  },

  production: {
    agents: ['context7', 'tavily'], // Only production-ready agents
    mcpServers: {
      context7: {
        /* prod config */
      },
      tavily: {
        /* prod config */
      },
    },
  },

  testing: {
    agents: ['context7'], // Minimal for testing
    mcpServers: {
      context7: {
        /* test config */
      },
    },
  },
}
```

### Smart Configuration Updates

```javascript
// scripts/update-config.js
const fs = require('fs').promises
const path = require('path')

async function updateAgentConfig(environment = 'development') {
  const config = require(`../configs/environments.js`)[environment]
  const claudeDir = '.claude'

  // Ensure directory exists
  await fs.mkdir(path.join(claudeDir, 'agents'), { recursive: true })

  // Install only specified agents for this environment
  for (const agent of config.agents) {
    console.log(`Installing ${agent} for ${environment}...`)
    // Copy agent files based on environment
  }

  // Update settings.json with environment-specific MCP config
  const settingsPath = path.join(claudeDir, 'settings.json')
  const settings = {
    mcpServers: config.mcpServers,
  }

  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2))
  console.log(`✅ Configuration updated for ${environment}`)
}

// Usage: node scripts/update-config.js production
const env = process.argv[2] || 'development'
updateAgentConfig(env)
```

## 8. Usage Examples

### Quick Start in Any Repository

```bash
# Method 1: NPM package (recommended)
npm install -g @yourorg/research-agents
research-agents install

# Method 2: Direct download
curl -fsSL https://raw.githubusercontent.com/yourorg/research-agents/main/install.sh | bash

# Method 3: Git submodule
git submodule add https://github.com/yourorg/research-agents .claude/modules/research-agents
cd .claude/modules/research-agents && npm run deploy:claude

# Method 4: Manual download
wget https://github.com/yourorg/research-agents/releases/latest/download/claude-agents.tar.gz
tar -xzf claude-agents.tar.gz

# Start using
claude
```

### Team Collaboration

```bash
# In team repository
echo "research-agents install" >> .devcontainer/postCreateCommand.sh

# Or in package.json
{
  "scripts": {
    "postinstall": "research-agents install --config-only"
  }
}

# Developers just run
npm install  # Automatically sets up agents
```

This solution provides multiple distribution strategies, making it incredibly easy for any repository to access and use your research agents with minimal setup effort. The NPM package approach is recommended for most use cases as it provides versioning, dependency management, and easy updates.
