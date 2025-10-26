/**
 * TransactionCard Component
 * Displays a transaction with voting buttons and status
 */

import type { Transaction } from '@/api/transactions';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface TransactionCardProps {
  transaction: Transaction;
  currentUserId: string;
  onVote?: (transactionId: string, vote: 'approve' | 'reject') => Promise<void>;
  onExecute?: (transactionId: string) => Promise<void>;
  onRefresh?: () => void;
}

export function TransactionCard({
  transaction,
  currentUserId,
  onVote,
  onExecute,
  onRefresh,
}: TransactionCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const userHasVoted = transaction.votes && currentUserId in transaction.votes;
  const userVote = userHasVoted ? transaction.votes[currentUserId] : null;

  // Count votes
  const votes = transaction.votes || {};
  const approveCount = Object.values(votes).filter((v) => v === 'approve').length;
  const rejectCount = Object.values(votes).filter((v) => v === 'reject').length;
  const totalVotes = approveCount + rejectCount;

  // Status colors
  const getStatusColor = () => {
    switch (transaction.status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'executed':
        return '#8B5CF6';
      default:
        return '#F59E0B';
    }
  };

  const getStatusEmoji = () => {
    switch (transaction.status) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'executed':
        return '💸';
      default:
        return '⏳';
    }
  };

  const handleVote = async (vote: 'approve' | 'reject') => {
    if (!onVote || userHasVoted) return;

    try {
      setIsVoting(true);
      await onVote(transaction.transactionID, vote);
      onRefresh?.();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleExecute = async () => {
    if (!onExecute) return;

    Alert.alert(
      'Execute Transaction',
      `Execute ${transaction.description} for $${parseFloat(transaction.amount).toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Execute',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsExecuting(true);
              await onExecute(transaction.transactionID);
              onRefresh?.();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to execute');
            } finally {
              setIsExecuting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.emoji}>{getStatusEmoji()}</ThemedText>
          <ThemedText type="subtitle" style={styles.description}>
            {transaction.description}
          </ThemedText>
        </View>
        <ThemedText style={[styles.status, { color: getStatusColor() }]}>
          {transaction.status.toUpperCase()}
        </ThemedText>
      </View>

      {/* Amount */}
      <ThemedText style={styles.amount}>
        ${parseFloat(transaction.amount).toFixed(2)}
      </ThemedText>

      {/* Vote Count */}
      {transaction.status === 'pending' && (
        <View style={styles.voteInfo}>
          <ThemedText style={styles.voteText}>
            👍 {approveCount} | 👎 {rejectCount} ({totalVotes} votes)
          </ThemedText>
        </View>
      )}

      {/* User's Vote */}
      {userHasVoted && (
        <View style={styles.userVote}>
          <ThemedText style={styles.voteText}>
            You voted: {userVote === 'approve' ? '👍 Approve' : '👎 Reject'}
          </ThemedText>
        </View>
      )}

      {/* Voting Buttons */}
      {transaction.status === 'pending' && !userHasVoted && onVote && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => handleVote('approve')}
            disabled={isVoting}
          >
            <ThemedText style={styles.buttonText}>
              {isVoting ? '...' : '👍 Approve'}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleVote('reject')}
            disabled={isVoting}
          >
            <ThemedText style={styles.buttonText}>
              {isVoting ? '...' : '👎 Reject'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Execute Button */}
      {transaction.status === 'approved' && onExecute && (
        <TouchableOpacity
          style={[styles.button, styles.executeButton]}
          onPress={handleExecute}
          disabled={isExecuting}
        >
          <ThemedText style={styles.buttonText}>
            {isExecuting ? 'Executing...' : '💸 Execute Transaction'}
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Date */}
      <ThemedText style={styles.date}>
        {new Date(transaction.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#1D1F33',
    borderRadius: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  emoji: {
    fontSize: 24,
  },
  description: {
    flex: 1,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
  },
  voteInfo: {
    paddingVertical: 4,
  },
  voteText: {
    fontSize: 14,
    opacity: 0.8,
  },
  userVote: {
    backgroundColor: '#2D2F44',
    padding: 8,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  executeButton: {
    backgroundColor: '#8B5CF6',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
});
