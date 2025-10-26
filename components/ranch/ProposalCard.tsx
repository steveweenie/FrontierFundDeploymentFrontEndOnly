import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Transaction } from "./types";

interface ProposalCardProps {
  proposal: Transaction;
  currentUserId: string;
  memberProfiles: Record<string, string>;
  onVote: (transactionId: string, voteType: "approve" | "reject") => void;
  onExecute: (transactionId: string) => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  currentUserId,
  memberProfiles,
  onVote,
  onExecute,
}) => {
  const hasVoted = Object.keys(proposal.votes).includes(currentUserId);
  const userVote = proposal.votes[currentUserId];
  const approvalCount = Object.values(proposal.votes).filter(
    (v) => v === "approve"
  ).length;
  const rejectCount = Object.values(proposal.votes).filter(
    (v) => v === "reject"
  ).length;

  const statusColor =
    proposal.status === "pending"
      ? "#FBBF24"
      : proposal.status === "approved"
        ? "#10B981"
        : "#EF4444";

  const proposedBy = proposal.proposedBy
    ? memberProfiles[proposal.proposedBy] || proposal.proposedBy
    : "Unknown";

  return (
    <ThemedView style={styles.proposalCard}>
      <View style={styles.proposalHeader}>
        <ThemedText style={styles.proposalAmount}>
          ${parseFloat(proposal.amount).toLocaleString()}
        </ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <ThemedText style={styles.statusText}>
            {proposal.status.toUpperCase()}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.proposalDescription}>
        {proposal.description}
      </ThemedText>

      <ThemedText style={styles.proposalMeta}>
        Proposed by: {proposedBy}
      </ThemedText>
      {proposal.transactionType && (
        <ThemedText style={styles.proposalMeta}>
          Type: {proposal.transactionType}
        </ThemedText>
      )}

      <View style={styles.voteInfo}>
        <ThemedText style={styles.voteText}>
          ✅ Approvals: {approvalCount}
        </ThemedText>
        <ThemedText style={styles.voteText}>❌ Rejections: {rejectCount}</ThemedText>
      </View>

      {hasVoted ? (
        <ThemedText style={styles.votedText}>
          You voted: {userVote === "approve" ? "✅ Approve" : "❌ Reject"}
        </ThemedText>
      ) : proposal.status === "pending" ? (
        <View style={styles.voteButtons}>
          <TouchableOpacity
            style={[styles.voteButton, styles.approveButton]}
            onPress={() => onVote(proposal.transactionID, "approve")}
          >
            <ThemedText style={styles.voteButtonText}>✅ Approve</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.voteButton, styles.rejectButton]}
            onPress={() => onVote(proposal.transactionID, "reject")}
          >
            <ThemedText style={styles.voteButtonText}>❌ Reject</ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}

      {proposal.status === "approved" && (
        <TouchableOpacity
          style={styles.executeButton}
          onPress={() => onExecute(proposal.transactionID)}
        >
          <ThemedText style={styles.executeButtonText}>
            ⚡ Execute Transaction
          </ThemedText>
        </TouchableOpacity>
      )}

      <ThemedText style={styles.timestampText}>
        Created: {new Date(proposal.createdAt).toLocaleString()}
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  proposalCard: {
    backgroundColor: "#0F1729",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  proposalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  proposalAmount: { fontSize: 24, fontWeight: "bold", color: "#FBBF24" },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: "bold", color: "#000" },
  proposalDescription: { color: "#E5E7EB", marginBottom: 12 },
  proposalMeta: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 4,
  },
  voteInfo: { marginBottom: 12 },
  voteText: { color: "#9CA3AF", fontSize: 14 },
  votedText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    padding: 8,
  },
  voteButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  voteButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  approveButton: { backgroundColor: "#10B981" },
  rejectButton: { backgroundColor: "#EF4444" },
  voteButtonText: { color: "#fff", fontWeight: "bold" },
  executeButton: {
    backgroundColor: "#8B5CF6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  executeButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  timestampText: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
});
