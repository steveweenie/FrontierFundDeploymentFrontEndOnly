import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface RanchCardProps {
  name: string;
  balance: number;
  memberCount: number;
  onPress: () => void;
}

export default function RanchCard({ name, balance, memberCount, onPress }: RanchCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.name}>{name}</Text>
      <Text>Balance: ${balance}</Text>
      <Text>Members: {memberCount}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#1D1F33', // Space Cowboy dark theme
    borderRadius: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700', // Golden star accent
  },
});