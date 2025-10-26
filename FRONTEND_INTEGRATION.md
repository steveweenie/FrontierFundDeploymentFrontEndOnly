# 🔗 Frontend-Backend Integration Guide

## 🎯 Quick Reference

**Backend URL**: `http://localhost:8080`  
**Backend Docs**: `http://localhost:8080/docs`  
**Backend Running**: Check `http://localhost:8080/health`

---

## 📡 API Endpoints Your Frontend Needs

### 🔐 Authentication

#### 1. **Signup** - Create New Account
```typescript
POST http://localhost:8080/signup

// Request Body
{
  "username": "cowboy",
  "email": "cowboy@ranch.com",
  "password": "yeehaw123"
}

// Response (200 OK)
{
  "userId": "a795481b-652c-401e-a9a0-45ff7a926eb4",
  "username": "cowboy",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "member"
}

// Errors
400 - Invalid email format
409 - Email already exists
500 - Server error
```

#### 2. **Login** - Authenticate User
```typescript
POST http://localhost:8080/login

// Request Body
{
  "email": "cowboy@ranch.com",
  "password": "yeehaw123"
}

// Response (200 OK)
{
  "userId": "a795481b-652c-401e-a9a0-45ff7a926eb4",
  "username": "cowboy",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "member"
}

// Errors
401 - Invalid credentials
404 - User not found
500 - Server error
```

---

### 🏠 Groups/Ranches Management

#### 3. **Create Group** - Start New Ranch
```typescript
POST http://localhost:8080/groups
Headers: {
  "Authorization": "Bearer YOUR_TOKEN_HERE",
  "Content-Type": "application/json"
}

// Request Body
{
  "name": "Area 51 Ranch",
  "description": "Alien cowboys unite!",
  "initialBalance": 0
}

// Response (201 Created)
{
  "groupId": "group-uuid-here",
  "name": "Area 51 Ranch",
  "description": "Alien cowboys unite!",
  "ownerId": "user-uuid",
  "balance": 0,
  "members": ["user-uuid"],
  "createdAt": "2025-10-25T17:00:00"
}

// Errors
401 - Not authenticated
400 - Invalid data
500 - Server error
```

#### 4. **Get User's Groups** - List All Ranches
```typescript
GET http://localhost:8080/groups
Headers: {
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}

// Response (200 OK)
{
  "groups": [
    {
      "groupId": "group-uuid-1",
      "name": "Area 51 Ranch",
      "description": "Alien cowboys",
      "balance": 5000,
      "memberCount": 3,
      "role": "owner"
    },
    {
      "groupId": "group-uuid-2",
      "name": "Rodeo Investors",
      "balance": 10000,
      "memberCount": 5,
      "role": "member"
    }
  ]
}

// Errors
401 - Not authenticated
500 - Server error
```

#### 5. **Add Member to Group** - Invite User
```typescript
POST http://localhost:8080/groups/{groupId}/members
Headers: {
  "Authorization": "Bearer YOUR_TOKEN_HERE",
  "Content-Type": "application/json"
}

// Request Body
{
  "userId": "user-uuid-to-add"
}

// Response (200 OK)
{
  "message": "Member added successfully",
  "groupId": "group-uuid",
  "userId": "user-uuid-to-add"
}

// Errors
401 - Not authenticated
403 - Not group owner
404 - Group or user not found
409 - User already in group
500 - Server error
```

#### 6. **Remove Member from Group** - Kick User
```typescript
DELETE http://localhost:8080/groups/{groupId}/members/{userId}
Headers: {
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}

// Response (200 OK)
{
  "message": "Member removed successfully"
}

// Errors
401 - Not authenticated
403 - Not group owner or trying to remove owner
404 - Group or user not found
500 - Server error
```

---

### 💰 Transactions & Voting

#### 7. **Create Transaction** - Propose Investment
```typescript
POST http://localhost:8080/transactions
Headers: {
  "Authorization": "Bearer YOUR_TOKEN_HERE",
  "Content-Type": "application/json"
}

// Request Body
{
  "groupId": "group-uuid",
  "description": "Buy spaceship parts",
  "amount": 5000,
  "category": "investment"
}

// Response (201 Created)
{
  "transactionId": "trans-uuid",
  "groupId": "group-uuid",
  "description": "Buy spaceship parts",
  "amount": 5000,
  "proposedBy": "user-uuid",
  "status": "pending",
  "votes": {},
  "createdAt": "2025-10-25T17:00:00"
}

// Errors
401 - Not authenticated
403 - Not a member of group
400 - Invalid amount or missing fields
500 - Server error
```

#### 8. **Vote on Transaction** - Approve/Reject
```typescript
POST http://localhost:8080/transactions/{transactionId}/vote
Headers: {
  "Authorization": "Bearer YOUR_TOKEN_HERE",
  "Content-Type": "application/json"
}

// Request Body
{
  "approve": true  // true = approve, false = reject
}

// Response (200 OK)
{
  "message": "Vote recorded",
  "transactionId": "trans-uuid",
  "status": "approved",  // or "pending" or "rejected"
  "voteCount": 3,
  "requiredVotes": 2
}

// Errors
401 - Not authenticated
403 - Not a member of group
404 - Transaction not found
409 - Already voted or transaction not pending
500 - Server error
```

---

## 🛠️ Frontend Implementation Examples

### React Native / Expo Setup

#### 1. **Create API Service File**
```typescript
// frontend/api/backend.ts

const API_URL = 'http://localhost:8080';

// Store token after login
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

// Helper function for authenticated requests
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
};

// Export API functions
export const api = {
  // Auth
  signup: (username: string, email: string, password: string) =>
    fetchWithAuth('/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (email: string, password: string) =>
    fetchWithAuth('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Groups
  getGroups: () => fetchWithAuth('/groups'),

  createGroup: (name: string, description: string, initialBalance?: number) =>
    fetchWithAuth('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, description, initialBalance: initialBalance || 0 }),
    }),

  addMember: (groupId: string, userId: string) =>
    fetchWithAuth(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  removeMember: (groupId: string, userId: string) =>
    fetchWithAuth(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    }),

  // Transactions
  createTransaction: (groupId: string, description: string, amount: number, category: string) =>
    fetchWithAuth('/transactions', {
      method: 'POST',
      body: JSON.stringify({ groupId, description, amount, category }),
    }),

  vote: (transactionId: string, approve: boolean) =>
    fetchWithAuth(`/transactions/${transactionId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ approve }),
    }),
};
```

#### 2. **Login Screen Example**
```typescript
// frontend/app/login/index.tsx
import { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { api, setAuthToken } from '@/api/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await api.login(email, password);
      
      // Save token
      setAuthToken(response.token);
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('userId', response.userId);
      await AsyncStorage.setItem('username', response.username);
      
      // Navigate to home
      Alert.alert('Success', `Welcome back, ${response.username}!`);
      // router.push('/home'); // Use your router
      
    } catch (error) {
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button 
        title={loading ? "Logging in..." : "Login"} 
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}
```

#### 3. **Groups List Example**
```typescript
// frontend/app/(tabs)/groups.tsx
import { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, Alert } from 'react-native';
import { api } from '@/api/backend';

export default function GroupsScreen() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await api.getGroups();
      setGroups(response.groups || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const createNewGroup = async () => {
    try {
      await api.createGroup('My New Ranch', 'Description here', 0);
      Alert.alert('Success', 'Group created!');
      loadGroups(); // Refresh list
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) return <Text>Loading...</Text>;

  return (
    <View>
      <Button title="Create New Group" onPress={createNewGroup} />
      <FlatList
        data={groups}
        keyExtractor={(item) => item.groupId}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>Balance: ${item.balance}</Text>
            <Text>Members: {item.memberCount}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

---

## 📦 Required npm Packages

```bash
# For data persistence
npm install @react-native-async-storage/async-storage

# Already have these from Expo
# - react-native
# - expo-router
```

---

## 🔑 Important Data to Store Locally

Use `AsyncStorage` to save:

```typescript
// After login/signup
await AsyncStorage.setItem('authToken', response.token);
await AsyncStorage.setItem('userId', response.userId);
await AsyncStorage.setItem('username', response.username);

// Load on app start
const token = await AsyncStorage.getItem('authToken');
if (token) {
  setAuthToken(token);
}
```

---

## 🚨 Error Handling Guide

### Common Errors & Solutions

| Status Code | Error | What To Do |
|-------------|-------|------------|
| 400 | Bad Request | Check your request body format |
| 401 | Unauthorized | Token missing/invalid - redirect to login |
| 403 | Forbidden | User doesn't have permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (email exists, already voted, etc) |
| 500 | Server Error | Backend issue - show error message |

### Error Handling Pattern
```typescript
try {
  const response = await api.someFunction();
  // Handle success
} catch (error) {
  if (error.message.includes('401')) {
    // Token expired - redirect to login
    await AsyncStorage.clear();
    router.push('/login');
  } else {
    // Show error to user
    Alert.alert('Error', error.message || 'Something went wrong');
  }
}
```

---

## 🧪 Testing Your Integration

### 1. **Test Backend is Running**
```typescript
fetch('http://localhost:8080/health')
  .then(res => res.json())
  .then(data => console.log('Backend status:', data))
  .catch(err => console.error('Backend not running!'));
```

### 2. **Test Authentication Flow**
1. Call signup with test data
2. Get token back
3. Use token for authenticated request
4. Verify you get data back

### 3. **Use Swagger UI**
Go to `http://localhost:8080/docs` and test all endpoints manually first!

---

## 📱 Frontend Checklist

- [ ] Create `api/backend.ts` with all API functions
- [ ] Install `@react-native-async-storage/async-storage`
- [ ] Create login screen
- [ ] Create signup screen
- [ ] Store token after login/signup
- [ ] Load token on app start
- [ ] Add authentication to all API calls
- [ ] Handle 401 errors (redirect to login)
- [ ] Create groups list screen
- [ ] Create transaction voting screen
- [ ] Test all flows end-to-end

---

## 🎨 UI/UX Tips

### Loading States
```typescript
const [loading, setLoading] = useState(false);
// Show spinner when loading is true
```

### Success Feedback
```typescript
Alert.alert('Success', 'Action completed!');
// Or use toast notification
```

### Error Messages
```typescript
Alert.alert('Error', 'User-friendly error message');
```

---

## 🔍 Debugging Tips

### Check Backend Logs
Backend shows all requests in terminal where you ran `./setup_local.sh`

### Check Network Requests
```typescript
console.log('Calling API:', endpoint);
console.log('Request body:', JSON.stringify(body));
console.log('Response:', response);
```

### Common Issues

**"Network request failed"**
- Backend not running - start with `./setup_local.sh`
- Wrong URL - make sure it's `http://localhost:8080`
- CORS issue - backend already has CORS enabled

**"401 Unauthorized"**
- Token not set - check `setAuthToken()` was called
- Token expired - generate new one by logging in again
- Token format wrong - should be `Bearer YOUR_TOKEN`

**"Can't connect to backend from phone"**
- Use your computer's IP instead: `http://192.168.1.XXX:8080`
- Or use Expo tunnel: `npx expo start --tunnel`

---

## 🚀 Next Steps

1. **Create the API service** (`api/backend.ts`)
2. **Update login screen** to call backend
3. **Test authentication** works end-to-end
4. **Build groups screen** with real data
5. **Add transaction voting** interface

**Need help?** Check `http://localhost:8080/docs` for interactive API testing!

---

\