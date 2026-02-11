#!/bin/bash
# Monitor eBay Price Scanner CI status and notify on failure

REPO="rafaelcg/ebay-price-scanner"
LAST_STATE_FILE="/tmp/ebay_ci_last_status"

# Get latest workflow run
RUN=$(gh run list --repo "$REPO" --limit 1 --json status,conclusion,name,headBranch,createdAt)
CONCLUSION=$(echo "$RUN" | jq -r '.[0].conclusion')
STATUS=$(echo "$RUN" | jq -r '.[0].status')
BRANCH=$(echo "$RUN" | jq -r '.[0].headBranch')
CREATED=$(echo "$RUN" | jq -r '.[0].createdAt')

# Only act if completed
if [ "$STATUS" = "completed" ]; then
    # Check if this is a new result (not already seen)
    if [ -f "$LAST_STATE_FILE" ]; then
        LAST_CHECK=$(cat "$LAST_STATE_FILE")
        if [ "$LAST_CHECK" = "$CONCLUSION:$CREATED" ]; then
            exit 0  # Already seen this result
        fi
    fi
    
    # Save current state
    echo "$CONCLUSION:$CREATED" > "$LAST_STATE_FILE"
    
    # Check for failure
    if [ "$CONCLUSION" = "failure" ]; then
        # Send system event notification
        curl -s "http://localhost:3000/gateway/api/system" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer 602ad38b08014f8e4d0d74b9afc0e86f315c0b9c050168f8" \
          -d '{"message": "🚨 **eBay Price Scanner Build Failed!**\n\nBranch: '"$BRANCH"'\nTime: '"$CREATED"'\n\nCheck: https://github.com/'"$REPO"'/actions"}' || true
        
        echo "⚠️ Build failed - notification sent"
    elif [ "$CONCLUSION" = "success" ]; then
        echo "✅ Build passed"
    fi
fi
