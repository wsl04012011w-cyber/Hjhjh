import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserDirectoryEntry, PresenceStatus } from '../types/chat';
import { generateShortId, getRandomAvatarColor } from '../lib/utils';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  error: null,
  clearError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfileSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userDocRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          }

          if (!userSnap.exists()) {
            // First time login: generate unique 8-character short ID
            const shortId = generateShortId();
            const now = new Date().toISOString();
            
            const newProfile: UserProfile = {
              userId: user.uid,
              shortId,
              displayName: user.displayName || user.email?.split('@')[0] || `Amigo_${shortId.slice(0, 4)}`,
              avatarColor: getRandomAvatarColor(),
              photoURL: user.photoURL || '',
              status: 'online',
              statusMessage: 'Disponível para bater papo! ✨',
              createdAt: now,
              updatedAt: now,
            };

            const directoryEntry: UserDirectoryEntry = {
              shortId,
              userId: user.uid,
              displayName: newProfile.displayName,
              avatarColor: newProfile.avatarColor,
              photoURL: newProfile.photoURL,
              updatedAt: now,
            };

            // Write both user profile and shortId directory entry
            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
            }

            try {
              await setDoc(doc(db, 'userDirectory', shortId), directoryEntry);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `userDirectory/${shortId}`);
            }

            setUserProfile(newProfile);
          } else {
            const data = userSnap.data() as UserProfile;
            setUserProfile(data);
            
            // Set status to online on connect
            try {
              await updateDoc(userDocRef, {
                status: 'online',
                updatedAt: new Date().toISOString(),
              });
            } catch {
              // Non-blocking on connect
            }
          }

          // Realtime listener for active user profile
          unsubscribeProfileSnapshot = onSnapshot(
            userDocRef,
            (snapshot) => {
              if (snapshot.exists()) {
                setUserProfile(snapshot.data() as UserProfile);
              }
            },
            (err) => {
              handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
            }
          );
        } catch (err: any) {
          console.error('Erro ao carregar perfil:', err);
          setError(err?.message || 'Erro ao sincronizar perfil do usuário');
        } finally {
          setLoading(false);
        }
      } else {
        if (unsubscribeProfileSnapshot) {
          unsubscribeProfileSnapshot();
          unsubscribeProfileSnapshot = null;
        }
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfileSnapshot) {
        unsubscribeProfileSnapshot();
      }
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Falha no login com Google:', err);
      // Clean user-friendly message for popup closed or canceled
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      setError(err?.message || 'Não foi possível autenticar com o Google. Tente novamente.');
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (currentUser && userProfile) {
        // Mark as offline
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            status: 'offline',
            updatedAt: new Date().toISOString(),
          });
        } catch {
          // Ignore if fails on exit
        }
      }
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (err: any) {
      console.error('Erro ao desconectar:', err);
      setError(err?.message || 'Erro ao sair da conta');
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;

    try {
      const now = new Date().toISOString();
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updatedData = {
        ...data,
        updatedAt: now,
      };

      try {
        await updateDoc(userDocRef, updatedData);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      }

      // If displayName, avatarColor, or photoURL changed, update userDirectory entry too
      if (
        data.displayName !== undefined || 
        data.avatarColor !== undefined || 
        data.photoURL !== undefined
      ) {
        try {
          const directoryRef = doc(db, 'userDirectory', userProfile.shortId);
          await updateDoc(directoryRef, {
            ...(data.displayName !== undefined && { displayName: data.displayName }),
            ...(data.avatarColor !== undefined && { avatarColor: data.avatarColor }),
            ...(data.photoURL !== undefined && { photoURL: data.photoURL }),
            updatedAt: now,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `userDirectory/${userProfile.shortId}`);
        }
      }

      setUserProfile(prev => (prev ? { ...prev, ...updatedData } : null));
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err?.message || 'Erro ao atualizar dados do perfil');
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        loginWithGoogle,
        logout,
        updateUserProfile,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
