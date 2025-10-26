// TypeScript types for TrustVault Backend API
// Use these in your React Native/Expo frontend

// ========== Authentication Types ==========

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: string;
  username: string;
  token: string;
  role: 'member' | 'owner';
}

// ========== Group Types ==========

export interface CreateGroupRequest {
  name: string;
  description: string;
  initialBalance?: number;
}

export interface Group {
  groupId: string;
  name: string;
  description: string;
  ownerId: string;
  balance: number;
  members: string[];
  createdAt: string;
}

export interface GroupSummary {
  groupId: string;
  name: string;
  description: string;
  balance: number;
  memberCount: number;
  role: 'owner' | 'member';
}

export interface GroupsResponse {
  groups: GroupSummary[];
}

export interface AddMemberRequest {
  userId: string;
}

// ========== Transaction Types ==========

export interface CreateTransactionRequest {
  groupId: string;
  description: string;
  amount: number;
  category: string;
}

export interface Transaction {
  transactionId: string;
  groupId: string;
  description: string;
  amount: number;
  proposedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  votes: Record<string, boolean>; // userId -> approve/reject
  createdAt: string;
}

export interface VoteRequest {
  approve: boolean;
}

export interface VoteResponse {
  message: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  voteCount: number;
  requiredVotes: number;
}

// ========== User Types ==========

export interface User {
  userId: string;
  username: string;
  email: string;
  role: 'member' | 'owner';
  groups: string[]; // array of groupIds
  createdAt: string;
}

// ========== API Error Types ==========

export interface ApiError {
  detail: string;
  status?: number;
}

// ========== Utility Types ==========

export type ApiResponse<T> = T | ApiError;

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  service: string;
}
