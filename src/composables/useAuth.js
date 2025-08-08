/**
 * Authentication composable
 */
import { ref, onMounted } from 'vue';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

export function useAuth() {
  const user = ref(null);
  const isLoading = ref(true);
  const error = ref(null);

  /**
   * Sign in with Google
   */
  async function signInWithGoogle() {
    try {
      error.value = null;
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      user.value = result.user;
      return result.user;
    } catch (err) {
      error.value = err.message;
      console.error('Sign in error:', err);
      throw err;
    }
  }

  /**
   * Sign out current user
   */
  async function signOut() {
    try {
      error.value = null;
      await firebaseSignOut(auth);
      user.value = null;
    } catch (err) {
      error.value = err.message;
      console.error('Sign out error:', err);
      throw err;
    }
  }

  /**
   * Initialize auth state listener
   */
  function initializeAuth() {
    return onAuthStateChanged(auth, (authUser) => {
      user.value = authUser;
      isLoading.value = false;
    });
  }

  // Initialize on mount
  onMounted(() => {
    initializeAuth();
  });

  return {
    user,
    isLoading,
    error,
    signInWithGoogle,
    signOut,
    initializeAuth
  };
}
