import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Dimensions } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';

// Ensure browser redirect results handling
WebBrowser.maybeCompleteAuthSession();

// Get dimensions directly outside component
const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

// Firebase configuration - replace with your own config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const FirebaseGoogleAuthComponent = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Google Auth Request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: 'xxxx',
  });

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((userState) => {
      if (userState) {
        setUser(userState);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Process authentication response
  useEffect(() => {
    const handleAuthResponse = async () => {
      if (response?.type === 'success') {
        setLoading(true);
        setError(null);

        try {
          // Get the ID token from the response
          const { id_token } = response.params;
          
          // Create a Google credential with the token
          const credential = GoogleAuthProvider.credential(id_token);
          
          // Sign in to Firebase with the credential
          const result = await signInWithCredential(auth, credential);
          setUser(result.user);
        } catch (e) {
          setError(e.message);
          Alert.alert('Authentication Error', e.message);
        } finally {
          setLoading(false);
        }
      } else if (response?.type === 'error') {
        setError(response.error?.message || 'Authentication failed');
        Alert.alert('Authentication Error', response.error?.message || 'Authentication failed');
      }
    };

    if (response) {
      handleAuthResponse();
    }
  }, [response]);

  // Handle sign in
  const handleSignIn = async () => {
    try {
      setLoading(true);
      await promptAsync();
    } catch (e) {
      setError(e.message);
      Alert.alert('Sign In Error', e.message);
      setLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
    } catch (e) {
      setError(e.message);
      Alert.alert('Sign Out Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Processing authentication...</Text>
      </View>
    );
  }

  // Render main component
  return (
    <View style={styles.container}>
      {user ? (
        // User is signed in
        <View style={styles.profileContainer}>
          <Text style={styles.welcomeText}>Welcome, {user.displayName || 'User'}</Text>
          <Text style={styles.emailText}>{user.email || 'No email available'}</Text>
          
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
            accessibilityLabel="Sign out of your account"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // User is signed out
        <View style={styles.authContainer}>
          <Text style={styles.headerText}>Firebase Authentication</Text>
          
          <TouchableOpacity 
            style={[
              styles.signInButton,
              !request && styles.disabledButton
            ]}
            onPress={handleSignIn}
            disabled={!request}
            activeOpacity={0.7}
            accessibilityLabel="Sign in with Google"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Sign In with Google</Text>
          </TouchableOpacity>
          
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    width: windowWidth,
    height: windowHeight,
  },
  authContainer: {
    width: windowWidth * 0.9,
    padding: windowHeight * 0.02,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  profileContainer: {
    width: windowWidth * 0.9,
    padding: windowHeight * 0.02,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  headerText: {
    fontSize: windowHeight * 0.03,
    fontWeight: 'bold',
    marginBottom: windowHeight * 0.02,
    color: '#333333',
  },
  welcomeText: {
    fontSize: windowHeight * 0.025,
    fontWeight: 'bold',
    marginBottom: windowHeight * 0.01,
    color: '#333333',
  },
  emailText: {
    fontSize: windowHeight * 0.018,
    marginBottom: windowHeight * 0.02,
    color: '#666666',
  },
  signInButton: {
    width: windowWidth * 0.8,
    height: windowHeight * 0.06,
    backgroundColor: '#4285F4',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: windowHeight * 0.02,
  },
  disabledButton: {
    backgroundColor: '#A4A4A4',
  },
  signOutButton: {
    width: windowWidth * 0.8,
    height: windowHeight * 0.06,
    backgroundColor: '#DB4437',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: windowHeight * 0.02,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: windowHeight * 0.02,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: windowHeight * 0.02,
    fontSize: windowHeight * 0.018,
    color: '#333333',
  },
  errorText: {
    marginTop: windowHeight * 0.02,
    fontSize: windowHeight * 0.016,
    color: '#DB4437',
    textAlign: 'center',
  },
});

export default FirebaseGoogleAuthComponent;
