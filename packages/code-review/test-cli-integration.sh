#!/bin/bash

# Test script for code-review CLI tools integration

PR_NUMBER="${1:-138}"
REPO="${2:-nathanvale/mnemosyne}"

echo "🔍 Testing code-review CLI tools integration"
echo "================================================"
echo "PR: #$PR_NUMBER"
echo "Repository: $REPO"
echo ""

# Step 1: Fetch CodeRabbit data
echo "Step 1: Fetching CodeRabbit comments..."
npx tsx src/cli/fetch-coderabbit.ts --pr "$PR_NUMBER" --repo "$REPO" --output /tmp/coderabbit.json

if [ $? -eq 0 ]; then
  echo "✅ CodeRabbit data fetched successfully"
  echo "   Found $(jq '.comments | length' /tmp/coderabbit.json) CodeRabbit comments"
  echo "   Found $(jq '.findings | length' /tmp/coderabbit.json) parsed findings"
else
  echo "❌ Failed to fetch CodeRabbit data"
  exit 1
fi

echo ""

# Step 2: Analyze PR
echo "Step 2: Analyzing PR..."
npx tsx src/cli/analyze-pr.ts --pr "$PR_NUMBER" --repo "$REPO" --coderabbit-file /tmp/coderabbit.json --output /tmp/analysis.json

if [ $? -eq 0 ]; then
  echo "✅ PR analysis completed"
  echo "   Total findings: $(jq '.analysis.findings | length' /tmp/analysis.json)"
  echo "   Risk level: $(jq -r '.analysis.summary.riskLevel' /tmp/analysis.json)"
  echo "   Files changed: $(jq '.analysis.metrics.filesChanged' /tmp/analysis.json)"
else
  echo "❌ Failed to analyze PR"
  exit 1
fi

echo ""

# Step 3: Generate report
echo "Step 3: Generating report..."
echo ""
echo "=== GitHub Comment Format ==="
npx tsx src/cli/generate-report.ts --analysis-file /tmp/analysis.json --github-ready

echo ""
echo "================================================"
echo "✅ Integration test completed successfully!"
echo ""
echo "Output files:"
echo "  - CodeRabbit data: /tmp/coderabbit.json"
echo "  - Analysis data: /tmp/analysis.json"
echo ""
echo "To generate different report formats:"
echo "  - Markdown: npx tsx src/cli/generate-report.ts --analysis-file /tmp/analysis.json --format markdown"
echo "  - JSON: npx tsx src/cli/generate-report.ts --analysis-file /tmp/analysis.json --format json"
echo "  - GitHub: npx tsx src/cli/generate-report.ts --analysis-file /tmp/analysis.json --github-ready"