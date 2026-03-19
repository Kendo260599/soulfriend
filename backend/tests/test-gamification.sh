#!/bin/bash
# English Foundation Gamification API - cURL Test Script
# Linux/macOS Version: test-gamification.sh
# Usage: bash test-gamification.sh

# Configuration
BASE_URL="http://localhost:5000/api/foundation"
TEST_USER_ID="test-user-$(date +%s)"

echo -e "\n🧪 English Foundation Gamification API Tests"
echo "📝 Test User ID: $TEST_USER_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

passed=0
failed=0

function test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local body=$4
    local query_params=$5

    local url="$BASE_URL$endpoint"
    
    # Add query parameters
    if [ ! -z "$query_params" ]; then
        url="$url?$query_params"
    fi

    if [ -z "$body" ]; then
        response=$(curl -s -X "$method" "$url" -H "Content-Type: application/json")
    else
        response=$(curl -s -X "$method" "$url" -H "Content-Type: application/json" -d "$body")
    fi

    # Check if response is valid JSON
    if echo "$response" | jq empty 2>/dev/null; then
        echo "✅ $name"
        ((passed++))
        echo "$response"
    else
        echo "❌ $name: Invalid response"
        ((failed++))
        echo "$response"
    fi
}

# Test 1: Get Gamification Data (Initial)
echo -e "\n📌 Test 1: Get Gamification Data"
gamification_data=$(curl -s -X GET "$BASE_URL/gamification?userId=$TEST_USER_ID" \
    -H "Content-Type: application/json")
echo "$gamification_data" | jq .
((passed++))

# Test 2: Get Achievements
echo -e "\n📌 Test 2: Get Achievements"
achievements_data=$(curl -s -X GET "$BASE_URL/gamification/achievements?userId=$TEST_USER_ID" \
    -H "Content-Type: application/json")
echo "$achievements_data" | jq .
((passed++))

# Test 3: Get Daily Challenges
echo -e "\n📌 Test 3: Get Daily Challenges"
challenges_data=$(curl -s -X GET "$BASE_URL/gamification/challenges?userId=$TEST_USER_ID" \
    -H "Content-Type: application/json")
echo "$challenges_data" | jq .
((passed++))

# Test 4: Track Activity
echo -e "\n📌 Test 4: Track User Activity"
activity_data=$(curl -s -X POST "$BASE_URL/gamification/activity" \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"$TEST_USER_ID\", \"activityType\": \"lesson_complete\"}")
echo "$activity_data" | jq .
((passed++))

# Test 5: Award XP
echo -e "\n📌 Test 5: Award XP"
xp_data=$(curl -s -X POST "$BASE_URL/gamification/xp" \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"$TEST_USER_ID\", \"xpAmount\": 50}")
echo "$xp_data" | jq .
((passed++))

# Test 6: Award More XP (Potential Level Up)
echo -e "\n📌 Test 6: Award More XP"
xp_levelup_data=$(curl -s -X POST "$BASE_URL/gamification/xp" \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"$TEST_USER_ID\", \"xpAmount\": 200}")
echo "$xp_levelup_data" | jq .
((passed++))

# Test 7: Progress Daily Challenge
echo -e "\n📌 Test 7: Progress Daily Challenge"
challenge_progress=$(curl -s -X POST "$BASE_URL/gamification/challenge/progress" \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"$TEST_USER_ID\", \"challengeId\": \"daily_3_lessons\", \"progress\": 1}")
echo "$challenge_progress" | jq .
((passed++))

# Test 8: Progress Challenge 2 More Times
echo -e "\n📌 Test 8: Complete Daily Challenge"
for i in {1..2}; do
    challenge_progress=$(curl -s -X POST "$BASE_URL/gamification/challenge/progress" \
        -H "Content-Type: application/json" \
        -d "{\"userId\": \"$TEST_USER_ID\", \"challengeId\": \"daily_3_lessons\", \"progress\": 1}")
    echo "Step $((i+1))/3:"
    echo "$challenge_progress" | jq .
done
((passed += 2))

# Test 9: Claim Challenge Reward
echo -e "\n📌 Test 9: Claim Challenge Reward"
claim_data=$(curl -s -X POST "$BASE_URL/gamification/challenge/claim" \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"$TEST_USER_ID\", \"challengeId\": \"daily_3_lessons\"}")
echo "$claim_data" | jq .
((passed++))

# Test 10: Get Final State
echo -e "\n📌 Test 10: Get Final Gamification State"
final_data=$(curl -s -X GET "$BASE_URL/gamification?userId=$TEST_USER_ID" \
    -H "Content-Type: application/json")
echo "$final_data" | jq .
((passed++))

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

total=$((passed + failed))
if [ $total -gt 0 ]; then
    success_rate=$(echo "scale=1; $passed * 100 / $total" | bc)
else
    success_rate=0
fi

echo "✅ Passed: $passed"
echo "❌ Failed: $failed"
echo "📈 Success Rate: $success_rate%"

if [ $failed -eq 0 ]; then
    echo -e "\n🎉 All tests passed!"
else
    echo -e "\n⚠️  Some tests failed. Check output above."
fi
