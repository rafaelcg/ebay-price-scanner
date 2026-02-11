#!/bin/bash
# Check eBay Price Scanner CI status and notify on failure

cd /root/.openclaw/workspace/ebay-price-scanner

# Get latest workflow run status
RUN_STATUS=$(gh run list --limit 1 --json status,conclusion,name --jq '.[] | {status, conclusion, name}')

if echo "$RUN_STATUS" | grep -q '"conclusion": "failure"'; then
    # Build failed - send notification via OpenClaw
    echo "Build failed - sending notification"
    # This would trigger a message to the main session
    curl -s -X POST "http://localhost:3000/api/message" \
      -H "Content-Type: application/json" \
      -d '{"message": "🚨 eBay Price Scanner build failed! Check GitHub Actions."}' || true
fi

echo "CI check complete"
