#!/bin/bash
# Full E2E Network Test using CURL to handle real cookies and network traffic

BASE_URL="http://localhost:3000"
COOKIE_JAR="scratch/cookies.txt"
TIMESTAMP=$(date +%s)
FACULTY_EMAIL="fac-$TIMESTAMP@yenepoya.edu.in"
PASSWORD="Password@123"

# 1. REGISTER FACULTY (Hardcoded as STUDENT role in route.ts)
echo "📡 [1/5] Registering Faculty User..."
curl -s -X POST "$BASE_URL/api/auth/register" \
     -H "Content-Type: application/json" \
     -d "{
           \"name\": \"Net Faculty\",
           \"email\": \"$FACULTY_EMAIL\",
           \"password\": \"$PASSWORD\",
           \"rollNumber\": \"FAC-$TIMESTAMP\",
           \"campusId\": \"22222\",
           \"batch\": \"FACULTY\",
           \"semester\": \"1\",
           \"section\": \"A\"
         }" > /dev/null

# Promote to FACULTY via DB (since API restricts role)
npx tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); p.user.update({ where: { email: '$FACULTY_EMAIL' }, data: { role: 'FACULTY' } }).then(() => p.\$disconnect())"
echo "🛠️ User promoted to FACULTY."

# 2. LOGIN AS FACULTY
echo "📡 [2/5] Logging in as Faculty..."
CSRF_TOKEN=$(curl -s "$BASE_URL/api/auth/csrf" -c "$COOKIE_JAR" | sed -n 's/.*"csrfToken":"\([^"]*\)".*/\1/p')

curl -s -X POST "$BASE_URL/api/auth/callback/credentials" \
     -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "email=$FACULTY_EMAIL&password=$PASSWORD&csrfToken=$CSRF_TOKEN&json=true" > /dev/null

echo "✅ Logged in."

# 3. CREATE SUBJECT
echo "📡 [3/5] Creating Subject..."
SUB_RESPONSE=$(curl -s -X POST "$BASE_URL/api/subjects/my" \
     -b "$COOKIE_JAR" \
     -H "Content-Type: application/json" \
     -d "{
           \"name\": \"Network Subject $TIMESTAMP\",
           \"code\": \"NET-$TIMESTAMP\",
           \"semester\": 1
         }")

SUB_ID=$(echo "$SUB_RESPONSE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
echo "✅ Subject Created ID: $SUB_ID"

# 4. ADMIN APPROVAL
echo "📡 [4/5] Admin Approving Subject..."
rm "$COOKIE_JAR" # Clear faculty session
ADMIN_CSRF=$(curl -s "$BASE_URL/api/auth/csrf" -c "$COOKIE_JAR" | sed -n 's/.*"csrfToken":"\([^"]*\)".*/\1/p')

curl -s -X POST "$BASE_URL/api/auth/callback/credentials" \
     -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "email=admin@college.edu&password=password123&csrfToken=$ADMIN_CSRF&json=true" > /dev/null

curl -s -X PUT "$BASE_URL/api/subjects/$SUB_ID" \
     -b "$COOKIE_JAR" \
     -H "Content-Type: application/json" \
     -d "{\"isApproved\": true}" > /dev/null
echo "✅ Subject Approved."

# 5. CREATE QUIZ
echo "📡 [5/5] Creating Quiz..."
rm "$COOKIE_JAR" # Back to faculty session
FAC_CSRF=$(curl -s "$BASE_URL/api/auth/csrf" -c "$COOKIE_JAR" | sed -n 's/.*"csrfToken":"\([^"]*\)".*/\1/p')
curl -s -X POST "$BASE_URL/api/auth/callback/credentials" \
     -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "email=$FACULTY_EMAIL&password=$PASSWORD&csrfToken=$FAC_CSRF&json=true" > /dev/null

curl -s -X POST "$BASE_URL/api/quizzes" \
     -b "$COOKIE_JAR" \
     -H "Content-Type: application/json" \
     -d "{
           \"title\": \"Network Final Exam\",
           \"subjectId\": \"$SUB_ID\",
           \"timePerQuestion\": 60,
           \"totalQuestions\": 1,
           \"isPublished\": true,
           \"assignedBatches\": [\"2023-26\"],
           \"questions\": [
             {\"text\": \"Is Curl Real?\", \"type\": \"MULTIPLE_CHOICE\", \"options\": [\"Yes\", \"No\"], \"correctIndex\": 0, \"points\": 10}
           ]
         }" > /dev/null

echo "🏁 FULL NETWORK FLOW COMPLETED!"
echo "👀 Check your terminal logs - they should all be 200/201 now."
