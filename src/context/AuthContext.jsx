import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../Auth/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { createOrUpdateUserProfile } from '../services/firestoreService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // Create or update user profile in Firestore
      if (user) {
        try {
          await createOrUpdateUserProfile(user.uid, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          });
        } catch (error) {
          console.error('Error updating user profile:', error);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isLoggedIn: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);