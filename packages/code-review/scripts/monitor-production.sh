#!/bin/bash

# Production Monitoring Script for Code Review Package
# Version: 1.0.0
# Purpose: Monitor first production runs after v2.0 deployment

set -euo pipefail

# Configuration
LOG_DIR="${LOG_DIR:-.logs/pr-reviews}"
REPO="${REPO:-nathanvale/mnemosyne}"
CHECK_INTERVAL="${CHECK_INTERVAL:-60}" # seconds
ALERT_THRESHOLD_ERRORS=5
ALERT_THRESHOLD_TIME=120 # seconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if pnpm is available
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed"
        exit 1
    fi
    
    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed"
        exit 1
    fi
    
    # Check if gh is authenticated
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated"
        exit 1
    fi
    
    # Check if log directory exists
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR"
        log_info "Created log directory: $LOG_DIR"
    fi
    
    log_info "Prerequisites check passed ✅"
}

run_health_check() {
    local pr_number=$1
    local start_time=$(date +%s)
    
    log_info "Running health check for PR #$pr_number..."
    
    # Run analysis and capture output, filtering out pnpm noise
    if output=$(pnpm --filter @studio/code-review review:pr analyze \
        --pr "$pr_number" \
        --repo "$REPO" 2>/dev/null | tail -n +4); then
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        # Parse JSON output
        if echo "$output" | jq -e '.' > /dev/null 2>&1; then
            local analysis_id=$(echo "$output" | jq -r '.analysis_id')
            local total_findings=$(echo "$output" | jq -r '.findings.total_count')
            local coderabbit_count=$(echo "$output" | jq -r '.findings.coderabbit | length')
            local security_count=$(echo "$output" | jq -r '.findings.security | length')
            local risk_level=$(echo "$output" | jq -r '.risk_level')
            
            log_info "✅ Analysis successful"
            log_info "   Analysis ID: $analysis_id"
            log_info "   Duration: ${duration}s"
            log_info "   Total findings: $total_findings"
            log_info "   CodeRabbit findings: $coderabbit_count"
            log_info "   Security findings: $security_count"
            log_info "   Risk level: $risk_level"
            
            # Check for issues
            if [ "$duration" -gt "$ALERT_THRESHOLD_TIME" ]; then
                log_warn "Analysis took longer than expected: ${duration}s > ${ALERT_THRESHOLD_TIME}s"
            fi
            
            if [ "$coderabbit_count" -eq 0 ] && [ "$security_count" -eq 0 ]; then
                log_warn "No findings from any source - may indicate an issue"
            fi
            
            return 0
        else
            log_error "Invalid JSON output received"
            echo "$output" | head -5
            return 1
        fi
    else
        log_error "Analysis failed for PR #$pr_number"
        return 1
    fi
}

check_error_logs() {
    log_info "Checking error logs..."
    
    local error_log="$LOG_DIR/errors.log"
    if [ -f "$error_log" ]; then
        local error_count=$(grep -c ERROR "$error_log" 2>/dev/null || echo 0)
        local recent_errors=$(tail -100 "$error_log" | grep ERROR | wc -l)
        
        if [ "$recent_errors" -gt "$ALERT_THRESHOLD_ERRORS" ]; then
            log_warn "High error rate detected: $recent_errors errors in last 100 lines"
            tail -5 "$error_log" | while read -r line; do
                echo "   $line"
            done
        else
            log_info "Error rate normal: $recent_errors recent errors"
        fi
    else
        log_info "No error log found (this is normal for fresh deployment)"
    fi
}

check_finding_sources() {
    local pr_number=$1
    
    log_info "Verifying all finding sources for PR #$pr_number..."
    
    local output=$(pnpm --filter @studio/code-review review:pr analyze \
        --pr "$pr_number" \
        --repo "$REPO" 2>/dev/null | tail -n +4)
    
    if echo "$output" | jq -e '.' > /dev/null 2>&1; then
        # Check each source
        local has_coderabbit=$(echo "$output" | jq '.findings.coderabbit | length > 0')
        local has_security=$(echo "$output" | jq '.findings.security | length > 0')
        local has_expert=$(echo "$output" | jq '.findings.expert | length > 0')
        
        if [ "$has_coderabbit" = "true" ]; then
            log_info "✅ CodeRabbit findings present"
        else
            log_warn "⚠️  No CodeRabbit findings (may be normal for this PR)"
        fi
        
        if [ "$has_security" = "true" ]; then
            log_info "✅ Security findings present"
        else
            log_info "ℹ️  No security issues found (good!)"
        fi
        
        if [ "$has_expert" = "true" ]; then
            log_info "✅ Expert validation findings present"
        else
            log_info "ℹ️  No expert findings"
        fi
    else
        log_error "Failed to verify finding sources"
    fi
}

monitor_performance() {
    log_info "Running performance benchmark..."
    
    local total_time=0
    local test_count=3
    
    for i in $(seq 1 $test_count); do
        local start_time=$(date +%s)
        
        if pnpm --filter @studio/code-review review:pr analyze \
            --pr 141 \
            --repo "$REPO" > /dev/null 2>&1; then
            
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            total_time=$((total_time + duration))
            log_info "   Run $i: ${duration}s"
        else
            log_warn "   Run $i: Failed"
        fi
        
        sleep 2 # Brief pause between runs
    done
    
    if [ "$total_time" -gt 0 ]; then
        local avg_time=$((total_time / test_count))
        log_info "Average analysis time: ${avg_time}s"
        
        if [ "$avg_time" -gt 60 ]; then
            log_warn "Performance may need optimization (avg > 60s)"
        fi
    fi
}

continuous_monitoring() {
    log_info "Starting continuous monitoring (Ctrl+C to stop)..."
    log_info "Checking every ${CHECK_INTERVAL} seconds"
    
    local iteration=0
    while true; do
        iteration=$((iteration + 1))
        echo ""
        log_info "=== Monitoring iteration #$iteration ==="
        
        # Run health check on a recent PR
        run_health_check 141
        
        # Check error logs
        check_error_logs
        
        # Every 5th iteration, run more comprehensive checks
        if [ $((iteration % 5)) -eq 0 ]; then
            log_info "Running comprehensive check..."
            check_finding_sources 141
            monitor_performance
        fi
        
        log_info "Waiting ${CHECK_INTERVAL} seconds..."
        sleep "$CHECK_INTERVAL"
    done
}

# Main execution
main() {
    echo "================================================"
    echo "Code Review Production Monitoring Script v1.0"
    echo "================================================"
    echo ""
    
    check_prerequisites
    
    case "${1:-}" in
        health)
            run_health_check "${2:-141}"
            ;;
        errors)
            check_error_logs
            ;;
        sources)
            check_finding_sources "${2:-141}"
            ;;
        performance)
            monitor_performance
            ;;
        continuous)
            continuous_monitoring
            ;;
        *)
            echo "Usage: $0 {health|errors|sources|performance|continuous} [pr_number]"
            echo ""
            echo "Commands:"
            echo "  health [pr]     - Run health check on specific PR (default: 141)"
            echo "  errors          - Check error logs"
            echo "  sources [pr]    - Verify all finding sources for PR"
            echo "  performance     - Run performance benchmark"
            echo "  continuous      - Start continuous monitoring"
            echo ""
            echo "Examples:"
            echo "  $0 health 139"
            echo "  $0 continuous"
            echo "  $0 performance"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"