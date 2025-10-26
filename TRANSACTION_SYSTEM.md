# Transaction Voting System - Integration Guide

## ✅ What's Been Built

I've created a complete transaction voting system with 5 new files:

### 1. **API Client** (`api/transactions.ts`)
- `getGroupTransactions()` - Get all transactions for a group
- `getTransactionHistory()` - Get user's transaction history
- `createTransaction()` - Propose new transaction
- `voteOnTransaction()` - Vote approve/reject
- `executeTransaction()` - Execute approved transaction

### 2. **TransactionCard Component** (`components/transaction-card.tsx`)
- Beautiful card UI with status colors & emojis
- Shows amount, description, vote count
- Vote buttons (approve/reject) for pending transactions
- Execute button for approved transactions
- Disabled state for transactions already voted on

### 3. **CreateTransactionModal** (`components/create-transaction-modal.tsx`)
- Modal for proposing new transactions
- Validates amount > 0
- Shows group balance
- Warns if amount exceeds balance
- Clean form UI with cancel/submit buttons

### 4. **Transactions Screen** (`app/(tabs)/transactions.tsx`)
- Full-featured transaction list
- Filter by: All, Pending, Approved, Executed, Rejected
- Pull-to-refresh functionality
- Empty states for each filter
- Create button to open modal

### 5. **Navigation** (`app/(tabs)/_layout.tsx`)
- Added "Transactions" tab with cash icon

---

## 🔧 To Connect to Your Auth System

Replace these 4 lines in `app/(tabs)/transactions.tsx`:

```typescript
// BEFORE (lines 22-25):
const MOCK_TOKEN = 'your_token_here';
const MOCK_USER_ID = 'your_user_id_here';
const MOCK_GROUP_ID = 'your_group_id_here';
const MOCK_GROUP_BALANCE = 1000;

// AFTER (when your auth teammate is ready):
import { useAuth } from '@/contexts/AuthContext'; // or wherever they put it

export default function TransactionsScreen() {
  const { token, userId } = useAuth(); // Get from auth context
  const [selectedGroup, setSelectedGroup] = useState<string>(''); // Get from group selector
  const [groupBalance, setGroupBalance] = useState(0); // Fetch from API
  
  // ... rest of code
```

---

## 🎨 Features Included

### Voting System
- ✅ Members can vote approve/reject on pending transactions
- ✅ Shows real-time vote counts (👍 X | 👎 Y)
- ✅ Displays user's vote once cast
- ✅ Auto-approves/rejects based on majority
- ✅ Prevents double voting

### Transaction Execution
- ✅ Execute button appears on approved transactions
- ✅ Confirmation dialog before executing
- ✅ Deducts from group balance
- ✅ Error handling for insufficient funds

### UI/UX
- ✅ Color-coded status (pending=orange, approved=green, rejected=red, executed=purple)
- ✅ Emoji indicators for quick scanning
- ✅ Loading states and error messages
- ✅ Pull-to-refresh
- ✅ Responsive design

---

## 🚀 To Test

1. **Start your backend**:
   ```bash
   cd backend
   source .venv/bin/activate
   python -m uvicorn app.main:app --reload --port 8080
   ```

2. **Update API URL** in `api/transactions.ts` line 6:
   ```typescript
   const API_BASE_URL = 'http://YOUR_COMPUTER_IP:8080'; // Change localhost to your IP for mobile
   ```

3. **Get a real token**:
   ```bash
   # Create a user and get token
   curl -X POST http://localhost:8080/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123","username":"tester"}'
   ```

4. **Replace mock values** in transactions.tsx with the real token/userId

5. **Run frontend**:
   ```bash
   cd frontend
   npm start
   ```

---

## 📱 User Flow

1. User opens "Transactions" tab
2. Sees list of all transactions (filtered by status)
3. Taps "+ Propose" to create new transaction
4. Fills out description & amount
5. Transaction appears as "PENDING"
6. Other members can vote 👍 or 👎
7. When majority approves → status changes to "APPROVED"
8. Any member can tap "Execute" to deduct from balance
9. Status changes to "EXECUTED"

---

## 🎯 Next Steps

### For You:
- Replace mock auth values with real auth context
- Add group selector (dropdown or from route params)
- Test on real device with backend running

### For Your Team:
- **Auth teammate**: Expose `token` and `userId` via React Context
- **Graph teammate**: Can use `getTransactionHistory()` API to get data
- **Splash screen teammate**: No conflicts!

---

## 🐛 Common Issues

### "Failed to fetch transactions"
- Check backend is running on port 8080
- Verify API_BASE_URL is correct (use IP not localhost for mobile)
- Check token is valid

### "You have already voted"
- Working as intended! Each user can only vote once
- Pull to refresh to see updated status

### "Insufficient funds"
- Transaction amount exceeds group balance
- Need to deposit more money first

---

## 💡 Future Enhancements (Optional)

- [ ] Add transaction categories/tags
- [ ] Show who voted what (transparency)
- [ ] Transaction comments/discussion
- [ ] Push notifications when vote needed
- [ ] Transaction history export
- [ ] Recurring transactions

---

Your transaction voting system is **COMPLETE and READY**! 🎉

Just connect it to auth and you're good to go for the hackathon demo!
