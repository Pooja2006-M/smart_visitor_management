import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext(null);

const FIXED_ACCOUNTS = {
  visitor: { email: 'visitor@gmail.com', password: 'Visitor@73' },
  student: { email: 'student@gmail.com', password: 'Student@73' },
  host: { email: 'host@gmail.com', password: 'Host@73' },
  guard: { email: 'guard@gmail.com', password: 'Guard@73' },
  admin: { email: 'admin@gmail.com', password: 'Admin@73' },
  employee: { email: 'employee@gmail.com', password: 'Employee@73' },
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (firebaseUser) => {
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        try {
          const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            if (!data.role) {
              setUserProfile(null);
              await signOut(getAuth());
              return;
            }
            setUserProfile(data);
          } else {
            const fixedRole = Object.entries(FIXED_ACCOUNTS).find(([, account]) => (
              account.email === firebaseUser.email?.toLowerCase()
            ))?.[0];
            if (!fixedRole) {
              setUser(null);
              setUserProfile(null);
              await signOut(getAuth());
              return;
            }
            const minimalProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.email.split('@')[0],
              role: fixedRole,
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), minimalProfile);
            setUserProfile(minimalProfile);
          }
        } catch (e) {
          console.error('Error fetching user profile:', e);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const register = async (email, password, name, role = 'visitor', extra = {}) => {
    const auth = getAuth();
    const normalizedEmail = email.trim().toLowerCase();
    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const uid = cred.user.uid;
    const emailLower = normalizedEmail;
    let detectedRole = role;
    if (emailLower.includes('guard')) detectedRole = 'guard';
    else if (emailLower.includes('admin')) detectedRole = 'admin';
    else if (emailLower.includes('host')) detectedRole = 'host';
    else if (emailLower.includes('employee')) detectedRole = 'employee';

    const profile = {
      uid,
      email: normalizedEmail,
      name,
      role: detectedRole,
      createdAt: serverTimestamp(),
      ...extra,
    };
    // Store profile in Firestore USERS collection
    await setDoc(doc(db, 'users', uid), profile);
    setUser({ uid, email: normalizedEmail });
    setUserProfile(profile);
    return { user: { uid } };
  };

  const login = async (email, password, selectedRole = 'visitor') => {
    const auth = getAuth();
    const normalizedRole = ['visitor', 'student', 'host', 'guard', 'admin', 'employee'].includes(selectedRole)
      ? selectedRole
      : 'visitor';
    const normalizedEmail = email.trim().toLowerCase();
    const fixedAccount = FIXED_ACCOUNTS[normalizedRole];

    const matchingProfiles = [];
    try {
      const q = query(collection(db, 'users'), where('email', '==', normalizedEmail), where('role', '==', normalizedRole));
      const profileSnap = await getDocs(q);
      profileSnap.forEach((docSnapshot) => matchingProfiles.push({ id: docSnapshot.id, ...docSnapshot.data() }));
    } catch (error) {
      console.error('Profile lookup failed:', error);
    }

    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (error) {
      const isDemoCredential = fixedAccount && normalizedEmail === fixedAccount.email && password === fixedAccount.password;
      if (isDemoCredential && (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password')) {
        cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      } else if (matchingProfiles.length > 0) {
        if (error.code === 'auth/wrong-password') {
          throw new Error('Incorrect password for this registered account.');
        }

        const existingProfile = matchingProfiles[0];
        try {
          cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          if (existingProfile?.uid) {
            await setDoc(doc(db, 'users', existingProfile.uid), {
              ...existingProfile,
              uid: existingProfile.uid,
              email: normalizedEmail,
              role: normalizedRole,
              name: existingProfile.name || normalizedEmail.split('@')[0],
              createdAt: existingProfile.createdAt || serverTimestamp(),
            }, { merge: true });
          }
        } catch (createError) {
          if (createError.code === 'auth/email-already-in-use') {
            throw new Error('Incorrect password for this registered account.');
          }
          throw new Error('This account is not registered yet. Please register first.');
        }
      } else {
        throw new Error('This account is not registered yet. Please register first.');
      }
    }

    const uid = cred.user.uid;
    let profile;
    try {
      const profileSnap = await getDoc(doc(db, 'users', uid));
      if (profileSnap.exists()) {
        profile = profileSnap.data();
        if (profile.email?.toLowerCase() !== normalizedEmail || profile.role !== normalizedRole) {
          const isFixedDemoAccount = fixedAccount && normalizedEmail === fixedAccount.email && password === fixedAccount.password;
          if (!isFixedDemoAccount) {
            await signOut(auth);
            throw new Error(`This account email or role does not match. Select the correct role.`);
          }
          profile = {
            ...profile,
            email: normalizedEmail,
            role: normalizedRole,
            name: profile.name || normalizedEmail.split('@')[0],
          };
          await setDoc(doc(db, 'users', uid), profile, { merge: true });
        }
      } else {
        const isDemoCredential = fixedAccount && normalizedEmail === fixedAccount.email && password === fixedAccount.password;
        if (!isDemoCredential && matchingProfiles.length > 0) {
          profile = {
            uid,
            email: normalizedEmail,
            name: normalizedEmail.split('@')[0],
            role: normalizedRole,
            createdAt: serverTimestamp(),
          };
          await setDoc(doc(db, 'users', uid), profile);
        } else if (!isDemoCredential) {
          await signOut(auth);
          throw new Error('This email is not registered for this role. Please register before logging in.');
        } else {
          profile = {
            uid,
            email: normalizedEmail,
            name: normalizedEmail.split('@')[0],
            role: normalizedRole,
            createdAt: serverTimestamp(),
          };
          await setDoc(doc(db, 'users', uid), profile);
        }
      }
    } catch (error) {
      if (error.message.includes('registered as') || error.message.includes('registered user profile')) {
        throw error;
      }
      throw new Error('Unable to verify your user profile. Please try again.');
    }

    setUser({ uid, email: normalizedEmail });
    setUserProfile(profile);
    return { user: { uid } };
  };

  const googleLogin = async () => {
    const auth = getAuth();
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    const firebaseUser = result.user;
    const profileRef = doc(db, 'users', firebaseUser.uid);
    const profileSnap = await getDoc(profileRef);
    const profile = profileSnap.exists()
      ? profileSnap.data()
      : {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        role: 'visitor',
        photoURL: firebaseUser.photoURL || '',
        createdAt: serverTimestamp(),
      };

    if (!profileSnap.exists()) await setDoc(profileRef, profile);
    setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
    setUserProfile(profile);
    return { user: { uid: firebaseUser.uid } };
  };


  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };


  return (
    <AuthContext.Provider value={{ user, userProfile, loading: false, register, login, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
