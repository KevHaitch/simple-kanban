import { reactive, readonly } from 'vue';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Create a reactive state object
const state = reactive({
  currentUser: null,
  userProfiles: {}, // Cache of user profiles by email
});

// Initialize the store
function init() {
  // Listen for auth state changes
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      state.currentUser = user;
      
      // Store the current user's profile in Firestore
      if (user.displayName) {
        try {
          await setDoc(doc(db, 'userDisplayNames', user.email), {
            displayName: user.displayName,
            firstName: getFirstNameFromDisplayName(user.displayName),
            updatedAt: new Date()
          }, { merge: true });
        } catch (error) {
          console.error('Error storing user display name:', error);
        }
      }
      
      // Cache the current user's profile
      state.userProfiles[user.email] = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        firstName: user.displayName ? getFirstNameFromDisplayName(user.displayName) : getFirstNameFromEmail(user.email),
      };
    } else {
      state.currentUser = null;
    }
  });
}

// Get a user's profile by email
async function getUserByEmail(email) {
  // Check cache first
  if (state.userProfiles[email]) {
    return state.userProfiles[email];
  }
  
  try {
    // Try to get the user's display name from Firestore
    const userDoc = await getDoc(doc(db, 'userDisplayNames', email));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Cache the user profile
      state.userProfiles[email] = {
        email,
        displayName: userData.displayName,
        firstName: userData.firstName || getFirstNameFromEmail(email),
      };
      
      return state.userProfiles[email];
    }
  } catch (error) {
    console.error('Error fetching user display name:', error);
  }
  
  // If not in cache or Firestore, create a placeholder based on email
  const profile = {
    email,
    displayName: null,
    firstName: getFirstNameFromEmail(email),
  };
  
  // Cache it for future use
  state.userProfiles[email] = profile;
  
  return profile;
}

// Helper function to extract first name from email
function getFirstNameFromEmail(email) {
  if (!email) return '';
  
  // Extract the part before @ symbol
  const username = email.split('@')[0];
  
  // Replace dots and underscores with spaces
  const formattedName = username.replace(/[._]/g, ' ');
  
  // Split by space and get the first part
  const firstName = formattedName.split(' ')[0];
  
  // Capitalize first letter and return
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

// Helper function to get first name from a display name
function getFirstNameFromDisplayName(displayName) {
  if (!displayName) return '';
  
  // Split by space and get the first part
  const firstName = displayName.split(' ')[0];
  
  return firstName;
}

// Initialize the store
init();

// Export a readonly version of the state and methods
export default {
  state: readonly(state),
  getUserByEmail,
  getFirstNameFromEmail,
  getFirstNameFromDisplayName,
}; 