# Tavily Web Search Sub-Agent for Claude Code

## Overview

This solution creates a specialized web search sub-agent that integrates Tavily MCP server with Claude Code, providing an orchestrated approach to web search tasks with dedicated context management.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Main Agent    │───▶│  Search Sub-Agent │───▶│   Tavily MCP    │
│  (Orchestrator) │    │   (Specialist)    │    │    Server       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Step 1: Configure Tavily MCP Server

### Option A: Remote Tavily MCP (Recommended)

Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "tavily-remote": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.tavily.com/mcp/?tavilyApiKey=YOUR_TAVILY_API_KEY"
      ],
      "env": {}
    }
  }
}
```

### Option B: Local Tavily MCP

```json
{
  "mcpServers": {
    "tavily-mcp": {
      "command": "npx",
      "args": ["-y", "tavily-mcp@latest"],
      "env": {
        "TAVILY_API_KEY": "YOUR_TAVILY_API_KEY"
      }
    }
  }
}
```

### Adding MCP via Claude Code CLI

```bash
# Add remote Tavily MCP
claude mcp add-json "tavily-remote" '{
  "command": "npx",
  "args": ["-y", "mcp-remote", "https://mcp.tavily.com/mcp/?tavilyApiKey=YOUR_API_KEY"],
  "env": {}
}'

# Or add local Tavily MCP
claude mcp add-json "tavily-mcp" '{
  "command": "npx",
  "args": ["-y", "tavily-mcp@latest"],
  "env": {"TAVILY_API_KEY": "YOUR_API_KEY"}
}'
```

## Step 2: Create Web Search Sub-Agent

### Create the sub-agent file

```bash
# Create project-level sub-agent
mkdir -p .claude/agents
```

### Sub-Agent Configuration File

Create `.claude/agents/web-researcher.md`:

```markdown
---
name: web-researcher
description: Use PROACTIVELY for web searches, fact-checking, current events, real-time data, and research tasks. MUST BE USED when user requests web search, latest information, current news, or when internal knowledge may be outdated. Handles complex multi-source research and synthesis.
tools: tavily_search, tavily_extract, file_str_replace, file_create
---

# Web Research Specialist

You are a specialized web research expert with access to real-time web search capabilities through Tavily. Your primary responsibilities include:

## Core Functions

- **Real-time web searches** using tavily_search for current information
- **Content extraction** using tavily_extract for detailed analysis of specific URLs
- **Multi-source research** combining multiple search queries for comprehensive coverage
- **Fact verification** cross-referencing multiple sources
- **Research synthesis** creating coherent reports from diverse web sources

## Search Strategy Framework

1. **Initial broad search** - Start with general terms to understand scope
2. **Targeted refinement** - Use specific keywords to drill down
3. **Source verification** - Cross-check information across multiple sources
4. **Content extraction** - Use tavily_extract for full content when needed
5. **Synthesis and reporting** - Combine findings into actionable insights

## Search Query Optimization

- Use **1-6 word queries** for optimal results
- Include **temporal indicators** (2024, 2025, recent, latest) for current events
- **Avoid operators** like quotes, minus signs unless specifically requested
- **Iterate queries** - make each search unique and progressively more specific

## Quality Standards

- **Prioritize primary sources** over aggregators
- **Cite all sources** with URLs and publication dates
- **Note conflicting information** from different sources
- **Respect copyright** - use brief quotes (<15 words) with proper attribution
- **Verify recency** - confirm information currency for time-sensitive topics

## Output Format

Structure your research results as:
```

## Research Summary

[Brief executive summary of key findings]

## Key Findings

- [Main points with source citations]
- [Supporting evidence and data]

## Sources

- [URL 1]: [Brief description, date]
- [URL 2]: [Brief description, date]

## Recommendations

[Actionable insights based on research]

```

## Special Instructions
- **Always search first** before claiming lack of information
- **Use multiple queries** for complex topics (3-5 searches minimum)
- **Extract full content** for critical sources using tavily_extract
- **Document your search strategy** in complex research tasks
- **Flag outdated information** and search for updates
- **Synthesize information** rather than just aggregating search results

Remember: You are the orchestrator's research arm. Provide comprehensive, accurate, and well-sourced information to enable informed decision-making.
```

## Step 3: Create Claude Code CLI Command

Create a bash script `web-search.sh` for easy invocation:

```bash
#!/bin/bash
# web-search.sh - Automated web search command

QUERY="$1"
AGENT_TYPE="${2:-comprehensive}"

if [ -z "$QUERY" ]; then
    echo "Usage: $0 '<search_query>' [search_type]"
    echo "Search types: comprehensive, quick, news, academic"
    exit 1
fi

case $AGENT_TYPE in
    "comprehensive")
        PROMPT="Use the web-researcher sub-agent to conduct comprehensive research on: $QUERY. Include multiple sources, verify facts, and provide actionable insights."
        ;;
    "quick")
        PROMPT="Use the web-researcher sub-agent for a quick search on: $QUERY. Focus on immediate, relevant results."
        ;;
    "news")
        PROMPT="Use the web-researcher sub-agent to find latest news and developments about: $QUERY. Focus on recent sources and current events."
        ;;
    "academic")
        PROMPT="Use the web-researcher sub-agent to find academic and authoritative sources about: $QUERY. Prioritize scholarly content and expert analysis."
        ;;
    *)
        PROMPT="Use the web-researcher sub-agent to research: $QUERY"
        ;;
esac

claude -p "$PROMPT"
```

Make it executable:

```bash
chmod +x web-search.sh
```

## Step 4: Usage Examples

### Basic Web Search

```bash
claude -p "Use the web-researcher sub-agent to find latest developments in AI safety research"
```

### Complex Research Task

```bash
claude -p "Research sub-agent: Compare the performance and market adoption of Claude vs GPT-4 in 2024-2025, including recent benchmarks and enterprise usage statistics"
```

### Using the CLI Script

```bash
./web-search.sh "quantum computing breakthroughs 2025" comprehensive
./web-search.sh "stock market today" quick
./web-search.sh "climate change policy updates" news
```

### Explicit Sub-Agent Invocation

```bash
claude -p "I need the web-researcher to help me understand the current state of autonomous vehicle regulations in California and Tesla's recent developments"
```

## Step 5: Advanced Orchestration Patterns

### Multi-Agent Workflow

Create additional sub-agents for complete research pipelines:

1. **web-researcher** - Gathers information
2. **data-analyst** - Analyzes findings
3. **report-writer** - Creates final deliverables

Example orchestration:

```bash
claude -p "I need to create a market analysis report on electric vehicle charging infrastructure. First use web-researcher to gather current data, then data-analyst to identify trends, and finally report-writer to create an executive summary."
```

### Project-Specific Research Agent

For ongoing projects, create specialized variants:

```markdown
---
name: competitor-researcher
description: Specialized researcher for competitive intelligence and market analysis in our industry vertical
tools: tavily_search, tavily_extract, file_create, file_str_replace
---

# Competitive Intelligence Specialist

[Custom system prompt for your specific industry/domain]
```

## Configuration Management

### Location Options

- **Project-level**: `.claude/agents/` (project-specific)
- **User-level**: `~/.claude/agents/` (available globally)

### Managing Sub-Agents

```bash
# View all agents
claude /agents

# Create new agent interactively
claude /agents
# Select "Create New Agent"

# Edit existing agent
claude /agents
# Select agent to modify
```

### Version Control

Add to your `.gitignore` if agents contain sensitive info:

```gitignore
.claude/agents/*secrets*
```

But generally include project agents in version control:

```bash
git add .claude/agents/
git commit -m "Add web research sub-agent configuration"
```

## Troubleshooting

### Common Issues

1. **MCP Server Connection**: Verify Tavily API key and network connectivity
2. **Agent Not Triggering**: Check description field for clear trigger words
3. **Tool Access**: Ensure MCP tools are properly listed in agent config

### Debug Commands

```bash
# Check MCP server status
claude /mcp

# Test Tavily connection
claude -p "Test web search for 'anthropic claude' using tavily"

# List available tools
claude /agents
# Check tool assignments for web-researcher
```

### Performance Optimization

- **Limit tool scope** for faster sub-agent initialization
- **Use specific triggers** in description for better delegation
- **Monitor token usage** with complex research tasks

## Security Considerations

### API Key Management

- Store API keys in environment variables
- Use `.env` files for local development
- Avoid committing keys to version control

### Tool Permissions

- Grant minimum necessary tools to each sub-agent
- Regularly audit tool assignments
- Use project-specific agents for sensitive workflows

## Integration with Development Workflows

### CI/CD Integration

```yaml
# .github/workflows/research.yml
name: Automated Research
on:
  schedule:
    - cron: '0 9 * * MON' # Weekly Monday reports

jobs:
  research:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run competitive research
        run: |
          claude -p "web-researcher: Generate weekly competitive intelligence report"
        env:
          TAVILY_API_KEY: ${{ secrets.TAVILY_API_KEY }}
```

### IDE Integration

Add to VS Code tasks.json:

```json
{
  "label": "Quick Web Research",
  "type": "shell",
  "command": "claude",
  "args": ["-p", "web-researcher: ${input:searchQuery}"],
  "group": "build"
}
```

This comprehensive solution provides a robust foundation for web search automation while maintaining the flexibility and power of Claude Code's sub-agent architecture.
