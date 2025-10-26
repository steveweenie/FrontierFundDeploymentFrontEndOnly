/**
 * CreateTransactionModal Component
 * Modal for proposing a new transaction
 */

import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface CreateTransactionModalProps {
  visible: boolean;
  groupId: string;
  groupBalance: number;
  onClose: () => void;
  onSubmit: (description: string, amount: number) => Promise<void>;
}

export function CreateTransactionModal({
  visible,
  groupId,
  groupBalance,
  onClose,
  onSubmit,
}: CreateTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0');
      return;
    }

    if (numAmount > groupBalance) {
      Alert.alert(
        'Warning',
        `Amount ($${numAmount.toFixed(2)}) exceeds group balance ($${groupBalance.toFixed(2)}). Transaction can be proposed but not executed until sufficient funds.`
      );
    }

    try {
      setIsSubmitting(true);
      await onSubmit(description, numAmount);
      
      // Reset form
      setDescription('');
      setAmount('');
      onClose();
      
      Alert.alert('Success', 'Transaction proposed! Members can now vote.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDescription('');
    setAmount('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <ThemedView style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <ThemedText type="title">💸 Propose Transaction</ThemedText>
              <TouchableOpacity onPress={handleCancel}>
                <ThemedText style={styles.closeButton}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Group Balance */}
            <View style={styles.balanceContainer}>
              <ThemedText style={styles.balanceLabel}>Group Balance:</ThemedText>
              <ThemedText style={styles.balanceAmount}>
                ${groupBalance.toFixed(2)}
              </ThemedText>
            </View>

            {/* Description Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Description *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="What is this for?"
                placeholderTextColor="#666"
                value={description}
                onChangeText={setDescription}
                maxLength={200}
              />
              <ThemedText style={styles.hint}>
                E.g., "Office supplies", "Team lunch", "Equipment purchase"
              </ThemedText>
            </View>

            {/* Amount Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Amount ($) *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#666"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              {parseFloat(amount) > 0 && (
                <ThemedText style={styles.hint}>
                  {parseFloat(amount) > groupBalance ? (
                    <ThemedText style={styles.warning}>
                      ⚠️ Exceeds current balance
                    </ThemedText>
                  ) : (
                    `Remaining after: $${(groupBalance - parseFloat(amount)).toFixed(2)}`
                  )}
                </ThemedText>
              )}
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <ThemedText style={styles.infoText}>
                ℹ️ Once proposed, all group members can vote. The transaction will be
                automatically approved when the majority votes in favor.
              </ThemedText>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isSubmitting}
              >
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <ThemedText style={styles.buttonText}>
                  {isSubmitting ? 'Proposing...' : 'Propose'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  balanceContainer: {
    backgroundColor: '#1D1F33',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1D1F33',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2D2F44',
  },
  hint: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  warning: {
    color: '#F59E0B',
  },
  infoBox: {
    backgroundColor: '#1E3A8A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    opacity: 0.9,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
