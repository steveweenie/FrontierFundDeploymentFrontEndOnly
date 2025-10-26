// Shared types for ranch components

export interface Transaction {
  transactionID: string;
  groupID: string;
  userID: string;
  amount: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "executed";
  votes: Record<string, "approve" | "reject">;
  createdAt: string;
  proposedBy?: string;
  transactionType?: string;
  executedAt?: string;
}

export interface RanchBalance {
  ranchBalance: number;
  investedAmount: number;
  totalAssets: number;
  personalBalance: number;
}

export interface RanchMember {
  userId: string;
  username: string;
}
