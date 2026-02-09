# Quick Testing Guide

## Step-by-Step Testing Instructions

### 1. Register an Agent Account
**POST** `http://localhost:5000/api/auth/register`

**Body (JSON):**
```json
{
  "name": "Test Agent",
  "email": "agent@test.com",
  "password": "password123",
  "role": "agent"
}
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "user": { ... }
}
```

---

### 2. Login as Agent
**POST** `http://localhost:5000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "agent@test.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Test Agent",
    "email": "agent@test.com",
    "role": "agent"
  }
}
```

🔑 **COPY THE TOKEN** from the response!

---

### 3. Test Stats API
**GET** `http://localhost:5000/api/stats/summary`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```
(Replace YOUR_TOKEN_HERE with the actual token from step 2)

**Expected Response:**
```json
{
  "totalTickets": 0,
  "openTickets": 0,
  "resolvedTickets": 0,
  "overdueTickets": 0,
  "avgResolutionHours": 0,
  "priorityBreakdown": {
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "unassignedTickets": 0
}
```

---

### 4. Test Get All Tickets
**GET** `http://localhost:5000/api/tickets/all`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "tickets": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0
  }
}
```

---

### 5. Create a Ticket (as User)

First, register and login as a regular user:

**POST** `http://localhost:5000/api/auth/register`
```json
{
  "name": "Test User",
  "email": "user@test.com",
  "password": "password123",
  "role": "user"
}
```

**POST** `http://localhost:5000/api/auth/login`
```json
{
  "email": "user@test.com",
  "password": "password123"
}
```

**POST** `http://localhost:5000/api/tickets`

**Headers:**
```
Authorization: Bearer USER_TOKEN_HERE
```

**Body (JSON):**
```json
{
  "title": "Login page not responding",
  "description": "When users try to login, the page shows a 500 error and doesn't proceed to the dashboard.",
  "category": "Technical",
  "priority": "High"
}
```

---

### 6. Now Test Get All Tickets Again (as Agent)

**GET** `http://localhost:5000/api/tickets/all`

**Headers:**
```
Authorization: Bearer AGENT_TOKEN_HERE
```

You should now see the ticket you created with full details!

---

## Common Errors & Solutions

### ❌ 401 Unauthorized
**Cause:** No token or invalid token  
**Solution:** Make sure you're sending the Authorization header with "Bearer " prefix

### ❌ 403 Forbidden
**Cause:** You're logged in as a "user" but trying to access an "agent" endpoint  
**Solution:** Login with an agent account and use that token

### ❌ 400 Validation Error
**Cause:** Missing or invalid request data  
**Solution:** Check the error response for specific field errors

---

## Using Postman

1. **Set Authorization for Each Request:**
   - Click on "Authorization" tab
   - Select "Bearer Token" from Type dropdown
   - Paste your token in the Token field

2. **Or Use Collection Variable:**
   - Create a variable `agentToken` in your collection
   - Set it after login: `{{agentToken}}`
   - Use in Authorization header

---

## Testing with cURL (Windows PowerShell)

```powershell
# Login and save token
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body (@{email="agent@test.com"; password="password123"} | ConvertTo-Json) -ContentType "application/json"
$token = $response.token

# Test stats API
Invoke-RestMethod -Uri "http://localhost:5000/api/stats/summary" -Headers @{Authorization="Bearer $token"}

# Test get all tickets
Invoke-RestMethod -Uri "http://localhost:5000/api/tickets/all" -Headers @{Authorization="Bearer $token"}
```
