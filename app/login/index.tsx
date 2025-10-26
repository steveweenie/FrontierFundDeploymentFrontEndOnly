import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE_URL = 'http://localhost:8080';

// Helper function to store data (works on web and native)
const storeData = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

// Helper function to get data (works on web and native)
const getData = async (key: string) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

export default function LoginScreen() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login successful:', data);
        console.log('Token:', data.token);
        console.log('UserId:', data.userId);
        console.log('Username:', data.username);
        
        // Store auth credentials
        await storeData('authToken', data.token);
        await storeData('userId', data.userId);
        await storeData('username', data.username);
        
        console.log('✅ Credentials stored, navigating...');
        // Navigate to main app
        router.push('/(tabs)');
        console.log('✅ Navigation called');
      } else {
        const error = await response.json();
        Alert.alert('Login Failed', error.detail || 'Invalid credentials');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    try {
      console.log('🔵 handleSignup START');
      console.log('Form values:', { email, username, password, confirmPassword, isSignup });
      
      if (!email || !password || !username) {
        console.log('❌ Missing fields - email:', email, 'password:', password, 'username:', username);
        Alert.alert('Missing Fields', 'Please fill in all fields');
        return;
      }

      if (password !== confirmPassword) {
        console.log('❌ Password mismatch');
        Alert.alert('Password Mismatch', 'Passwords do not match');
        return;
      }

      if (password.length < 6) {
        console.log('❌ Password too short');
        Alert.alert('Weak Password', 'Password must be at least 6 characters');
        return;
      }

      console.log('✅ Validation passed, making API call...');
      setLoading(true);
      
      const url = `${API_BASE_URL}/auth/signup`;
      console.log('Calling URL:', url);
      console.log('Request body:', { email, password, username });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });

      console.log('Response received. Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Signup successful:', data);
        
        // Store auth credentials (backend returns token on signup)
        await storeData('authToken', data.token);
        await storeData('userId', data.userId);
        await storeData('username', data.username);
        
        console.log('✅ Credentials stored, navigating to app...');
        
        // Navigate immediately
        router.replace('/(tabs)');
        console.log('✅ Navigation complete');
        
        setPassword('');
        setConfirmPassword('');
      } else {
        const errorText = await response.text();
        console.log('❌ Signup failed. Status:', response.status, 'Response:', errorText);
        try {
          const error = JSON.parse(errorText);
          Alert.alert('Signup Failed', error.detail || 'Could not create account');
        } catch (e) {
          Alert.alert('Signup Failed', errorText || 'Could not create account');
        }
      }
    } catch (error) {
      console.error('❌ Signup error (caught):', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', errorMessage);
      Alert.alert('Error', `Network error occurred: ${errorMessage}`);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/space-background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo-2x.png')}
              style={styles.logo}
            />
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <ThemedText type="title" style={styles.title} lightColor="#fff" darkColor="#fff">
              🚀 FrontierFund 🤠
            </ThemedText>
            <ThemedText style={styles.subtitle} lightColor="#fff" darkColor="#fff">
              {isSignup ? 'Create Your Account' : 'Welcome Back, Cowboy!'}
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {isSignup && (
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            
            {isSignup && (
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            )}

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={isSignup ? handleSignup : handleLogin}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
                  {isSignup ? '🤠 Sign Up' : '🚀 Log In'}
                </ThemedText>
              )}
            </TouchableOpacity>

            {/* Toggle Sign Up / Login */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setIsSignup(!isSignup);
                setPassword('');
                setConfirmPassword('');
              }}
            >
              <ThemedText style={styles.toggleText} lightColor="#fff" darkColor="#fff">
                {isSignup 
                  ? 'Already have an account? Log In' 
                  : "Don't have an account? Sign Up"}
              </ThemedText>
            </TouchableOpacity>

            {/* Demo Button */}
            <TouchableOpacity
              style={[styles.button, styles.demoButton]}
              onPress={() => router.replace('/(tabs)')}
            >
              <ThemedText style={styles.demoButtonText} lightColor="#fff" darkColor="#fff">
                Continue as Guest 👻
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(11, 17, 32, 0.85)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 120,
    resizeMode: 'contain',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FBBF24',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#1B1F3B',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#FBBF24',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1120',
  },
  toggleButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleText: {
    color: '#3B82F6',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  demoButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginTop: 16,
  },
  demoButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
