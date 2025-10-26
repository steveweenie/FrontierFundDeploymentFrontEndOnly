import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      {/* Ensures login is the first screen within the (auth) stack */}
      <Stack.Screen name="login" options={{ headerShown: false }} /> 
      <Stack.Screen name="signup" options={{ headerShown: false }} />
    </Stack>
  );
}