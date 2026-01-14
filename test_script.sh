
#!/bin/bash

# 1. Login
echo "Logging in..."
LOGIN_RES=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "tom@tms.com", "password": "dispatcher123"}')

TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed. Response: $LOGIN_RES"
  exit 1
fi

echo "Login successful. Token: ${TOKEN:0:10}..."

# 2. Test Global Search
echo -e "\n--- Testing Global Search (q=WB) ---"
curl -s -X GET "http://localhost:3001/api/search/global?q=WB" \
  -H "Authorization: Bearer $TOKEN" | grep -o '.*'  # Print output

echo -e "\n--- Testing Global Search (q=James) ---"
curl -s -X GET "http://localhost:3001/api/search/global?q=James" \
  -H "Authorization: Bearer $TOKEN" | grep -o '.*'

# 3. Test Notifications
echo -e "\n\n--- Testing Notifications ---"
curl -s -X GET "http://localhost:3001/api/notifications" \
  -H "Authorization: Bearer $TOKEN" | grep -o '.*'
