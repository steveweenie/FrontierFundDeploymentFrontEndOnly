import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8080/login", {  
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data);
        router.push('/(tabs)');
      } else {
        const errorMessage = data.detail || 'Invalid email or password. Please try again.';
        Alert.alert('Login Failed', errorMessage);
      }

    } catch (error) {
      console.error('Error connecting to backend', error);
      Alert.alert('Error', 'Could not connect to backend. Please try again.');
    }
  };

  
  const handleSignUp = () => {
    router.push('/signup'); 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back! 👋</Text>

      {/* Email/Username Input */}
      <TextInput
        style={styles.input}
        placeholder="Email or Username"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Hides the input text
      />

      {/* Login Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Log In"
          onPress={handleLogin}
          color="#007AFF" // iOS blue color
        />
      </View>

      {/* Sign Up Link */}
      <TouchableOpacity style={styles.link} onPress={handleSignUp}>
        <Text style={styles.linkText}>Don&apos;t have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

// 3. Basic styling for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5', // Light background color
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden', // Ensures the button respects the border radius on Android
  },
  link: {
    marginTop: 20,
    alignSelf: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
});