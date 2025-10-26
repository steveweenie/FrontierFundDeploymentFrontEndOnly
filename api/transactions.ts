/**
 * Transaction API Client
 * Handles all transaction-related API calls
 */

// Backend API URL
// For local development: http://localhost:8080
// For testing on real device, change to your computer's IP: http://192.168.1.XXX:8080
const API_BASE_URL = 'http://localhost:8080';

export interface Transaction {
  transactionID: string;
  groupID: string;
  userID: string;
  amount: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  votes: Record<string, 'approve' | 'reject'>;
  createdAt: string;
  executedAt?: string;
}

export interface CreateTransactionRequest {
  groupId: string;
  amount: number;
  description: string;
}

export interface VoteRequest {
  vote: 'approve' | 'reject';
}

export interface VoteResponse {
  message: string;
  status: string;
  votes: Record<string, string>;
  approveCount: number;
  rejectCount: number;
  totalMembers: number;
}

export interface ExecuteResponse {
  message: string;
  transactionId: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  status: string;
}

/**
 * Get all transactions for a group
 */
export async function getGroupTransactions(
  groupId: string,
  token: string
): Promise<Transaction[]> {
  const response = await fetch(
    `${API_BASE_URL}/transactions?groupId=${groupId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch transactions');
  }

  const data = await response.json();
  return data.transactions;
}

/**
 * Get user's transaction history across all groups
 */
export async function getTransactionHistory(
  token: string
): Promise<Transaction[]> {
  const response = await fetch(`${API_BASE_URL}/transactions/history/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch transaction history');
  }

  const data = await response.json();
  return data.transactions;
}

/**
 * Get specific transaction details
 */
export async function getTransaction(
  transactionId: string,
  token: string
): Promise<Transaction> {
  const response = await fetch(
    `${API_BASE_URL}/transactions/${transactionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch transaction');
  }

  const data = await response.json();
  return data.transaction;
}

/**
 * Create a new transaction proposal
 */
export async function createTransaction(
  request: CreateTransactionRequest,
  token: string
): Promise<{ transactionId: string; message: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create transaction');
  }

  return response.json();
}

/**
 * Vote on a transaction
 */
export async function voteOnTransaction(
  transactionId: string,
  vote: 'approve' | 'reject',
  token: string
): Promise<VoteResponse> {
  const response = await fetch(
    `${API_BASE_URL}/transactions/${transactionId}/vote`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ vote }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to vote on transaction');
  }

  return response.json();
}

/**
 * Execute an approved transaction
 */
export async function executeTransaction(
  transactionId: string,
  token: string
): Promise<ExecuteResponse> {
  const response = await fetch(
    `${API_BASE_URL}/transactions/${transactionId}/execute`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to execute transaction');
  }

  return response.json();
}
