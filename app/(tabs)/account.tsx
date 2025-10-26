import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const API_BASE_URL = 'http://localhost:8080';

// Platform-specific storage helpers
const storeData = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getData = async (key: string) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const removeData = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

export default function AccountScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingFunds, setAddingFunds] = useState(false);

  useEffect(() => {
    // Fetch user details from backend
    const fetchUserDetails = async () => {
      try {
        const token = await getData('authToken');
        
        if (!token) {
          console.log('⚠️ Not logged in, redirecting to login');
          router.replace('/login');
          return;
        }

        console.log('🔍 Fetching user details from /users/me');
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ User data loaded:', data);
          setUserId(data.userId || 'Not available');
          setUsername(data.username || 'Not available');
          setEmail(data.email || 'Not available');
          setBalance(data.balance || 0);
          setTotalInvested(data.totalInvested || 0);
          
          // If balance is 0, initialize it for existing users
          if (data.balance === 0 || data.balance === undefined) {
            console.log('⚠️ Balance is 0, initializing...');
            await initializeBalance(token);
          }
        } else {
          console.error('❌ Failed to fetch user details:', response.status);
          setUserId('Unable to load');
          setUsername('Unable to load');
          setEmail('Unable to load');
        }
      } catch (error) {
        console.error('❌ Error fetching user details:', error);
        setUserId('Unable to load');
        setUsername('Unable to load');
        setEmail('Unable to load');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const initializeBalance = async (token: string) => {
    try {
      console.log('💰 Initializing balance...');
      const response = await fetch(`${API_BASE_URL}/users/me/initialize-balance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Balance initialized:', data);
        if (data.initialized) {
          setBalance(data.newBalance);
        }
      }
    } catch (error) {
      console.error('❌ Error initializing balance:', error);
    }
  };

  const handleAddFunds = async () => {
    console.log('💰 Adding $1000 to account');
    setAddingFunds(true);
    
    try {
      const token = await getData('authToken');
      
      if (!token) {
        Alert.alert('Error', 'Please log in again');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/me/add-funds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Funds added:', data);
        setBalance(data.newBalance);
        Alert.alert(
          'Success! 💰',
          `Added $1000 to your account!\n\nNew balance: $${data.newBalance.toFixed(2)}`
        );
      } else {
        console.error('❌ Failed to add funds:', response.status);
        Alert.alert('Error', 'Failed to add funds. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error adding funds:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setAddingFunds(false);
    }
  };

  const handleLogout = async () => {
    console.log('🚪 Logout button clicked');
    
    // On web, use window.confirm instead of Alert.alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) {
        console.log('🚪 Logout confirmed, clearing data...');
        await removeData('authToken');
        await removeData('userId');
        await removeData('username');
        console.log('🚪 Logged out successfully');
        router.replace('/login');
      } else {
        console.log('🚫 Logout cancelled');
      }
    } else {
      // On native, use Alert.alert
      Alert.alert(
        'Logout',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            style: 'destructive',
            onPress: async () => {
              console.log('🚪 Logout confirmed, clearing data...');
              await removeData('authToken');
              await removeData('userId');
              await removeData('username');
              console.log('🚪 Logged out successfully');
              router.replace('/login');
            }
          }
        ]
      );
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#0B0C1F', dark: '#0B0C1F' }}
      headerImage={
        <ImageBackground
          source={require('@/assets/images/space-background.jpg')}
          style={styles.headerImageBackground}
        >
          <Image
            source={require('@/assets/images/partial-logo.png')}
            style={styles.logo}
          />
        </ImageBackground>
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText style={styles.titleText}>👤 Account</ThemedText>
      </ThemedView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <ThemedText style={styles.loadingText}>Loading account details...</ThemedText>
        </View>
      ) : (
        <>
          {/* Account Info Card */}
          <ThemedView style={styles.infoCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Account Information</ThemedText>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Username:</ThemedText>
              <ThemedText style={styles.value}>{username || 'Not available'}</ThemedText>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Email:</ThemedText>
              <ThemedText style={styles.value}>{email}</ThemedText>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>User ID:</ThemedText>
              <ThemedText style={styles.value} numberOfLines={1}>{userId || 'Not available'}</ThemedText>
            </View>
          </ThemedView>

          {/* Balance Card */}
          <ThemedView style={styles.balanceCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>💵 Account Balance</ThemedText>
            
            <View style={styles.balanceAmountContainer}>
              <ThemedText style={styles.balanceAmount}>
                ${balance.toFixed(2)}
              </ThemedText>
            </View>
            
            <TouchableOpacity 
              onPress={handleAddFunds} 
              style={styles.addFundsButton}
              disabled={addingFunds}
            >
              {addingFunds ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.addFundsButtonText}>+ $1000 to Account</ThemedText>
              )}
            </TouchableOpacity>
            
            <ThemedText style={styles.balanceNote}>
              Use this balance to deposit into your ranches
            </ThemedText>
          </ThemedView>

          {/* Investment Info Card */}
          <ThemedView style={styles.investmentCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>💰 Investment Summary</ThemedText>
            
            <View style={styles.investmentAmountContainer}>
              <ThemedText style={styles.investmentLabel}>Total Invested:</ThemedText>
              <ThemedText style={styles.investmentAmount}>
                ${totalInvested.toFixed(2)}
              </ThemedText>
            </View>
            
            <ThemedText style={styles.investmentNote}>
              This is the total amount you've invested across all your ranches after proposals were approved.
            </ThemedText>
          </ThemedView>

          {/* Settings Card */}
          <ThemedView style={styles.settingsCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Settings</ThemedText>
            
            <TouchableOpacity style={styles.settingButton}>
              <ThemedText style={styles.settingButtonText}>Change Password</ThemedText>
              <ThemedText style={styles.comingSoon}>(Coming Soon)</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingButton}>
              <ThemedText style={styles.settingButtonText}>Edit Profile</ThemedText>
              <ThemedText style={styles.comingSoon}>(Coming Soon)</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Logout Button */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <ThemedText style={styles.logoutButtonText}>🚪 Logout</ThemedText>
          </TouchableOpacity>
        </>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFA500',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(255, 165, 0, 0.75)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#9CA3AF',
  },
  infoCard: {
    backgroundColor: '#1D1F33',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceCard: {
    backgroundColor: '#1D1F33',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceAmountContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#3B82F6',
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  addFundsButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 16,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addFundsButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceNote: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  investmentCard: {
    backgroundColor: '#1D1F33',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  investmentAmountContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  investmentLabel: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  investmentAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10B981',
    textShadowColor: 'rgba(16, 185, 129, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  investmentNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  settingsCard: {
    backgroundColor: '#1D1F33',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  value: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  settingButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  comingSoon: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  headerImageBackground: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
