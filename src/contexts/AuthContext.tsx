import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { logActivity } from '../services/activityService';
import { seedDatabaseIfEmpty } from '../services/seedService';
import { EMPLOYEES_DATA } from '../services/seedData';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PROFILES: Record<string, UserProfile> = {
  'admin@prionix-demo.com': {
    uid: 'admin-uid-demo',
    employeeId: 'PRX-001',
    name: 'Siddharth Rao',
    email: 'admin@prionix-demo.com',
    role: 'ADMIN',
    departmentId: 'DEP-ENG',
    domainId: 'DOM-SWE',
    designation: 'VP of Engineering',
    status: 'ACTIVE',
    phone: '+91 98450 11001',
    manager: 'CEO Office',
    location: 'Bangalore Campus, BLR-01',
    joiningDate: '2022-03-15',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  'employee@prionix-demo.com': {
    uid: 'employee-uid-demo',
    employeeId: 'PRX-002',
    name: 'Devika Krishnan',
    email: 'employee@prionix-demo.com',
    role: 'EMPLOYEE',
    departmentId: 'DEP-AI',
    domainId: 'DOM-AI',
    designation: 'Senior AI Research Engineer',
    status: 'ACTIVE',
    phone: '+91 98450 11002',
    manager: 'Dr. Radhika Sen',
    location: 'Bangalore Campus, BLR-02',
    joiningDate: '2023-01-10',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
};
const DEMO_CREDENTIALS = {
  "PRX-ADMIN": {
    password: "PrionixDemo2025!",
    email: "admin@prionix-demo.com"
  },
  "PRX-001": {
    password: "PrionixDemo2025!",
    email: "admin@prionix-demo.com"
  },
  "PRX-002": {
    password: "PrionixDemo2025!",
    email: "employee@prionix-demo.com"
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto initialize seed data in background
  useEffect(() => {
    seedDatabaseIfEmpty().catch(err => console.log('Background seed notice:', err));
  }, []);

  const loadUserProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        setUserProfile(data);
        return data;
      }

      // Check if user matches an existing employee in Firestore
      const userEmail = (firebaseUser.email || '').toLowerCase().trim();
      let matchedEmployee: any = null;

      try {
        const q = query(collection(db, 'employees'), where('email', '==', userEmail));
        const empSnaps = await getDocs(q);
        if (!empSnaps.empty) {
          matchedEmployee = empSnaps.docs[0].data();
        }
      } catch (queryErr) {
        console.warn('Could not query employees collection:', queryErr);
      }

      // Determine dynamic role based on employee designation or admin email
      const isAdminUser = 
        userEmail === 'admin@prionix-demo.com' ||
        userEmail === 'dhv2404@gmail.com' ||
        matchedEmployee?.employeeId === 'PRX-001' ||
        matchedEmployee?.designation?.toLowerCase().includes('vp') ||
        matchedEmployee?.designation?.toLowerCase().includes('director');

      const resolvedRole: UserRole = isAdminUser ? 'ADMIN' : 'EMPLOYEE';

      const profileData: UserProfile = {
        uid: firebaseUser.uid,
        employeeId: matchedEmployee?.employeeId || (isAdminUser ? 'PRX-001' : 'PRX-002'),
        name: matchedEmployee?.name || firebaseUser.displayName || (isAdminUser ? 'Siddharth Rao' : 'Devika Krishnan'),
        email: userEmail || (isAdminUser ? 'admin@prionix-demo.com' : 'employee@prionix-demo.com'),
        role: resolvedRole,
        departmentId: matchedEmployee?.departmentId || (isAdminUser ? 'DEP-ENG' : 'DEP-AI'),
        domainId: matchedEmployee?.domainId || (isAdminUser ? 'DOM-SWE' : 'DOM-AI'),
        designation: matchedEmployee?.designation || (isAdminUser ? 'VP of Engineering' : 'Senior AI Research Engineer'),
        status: 'ACTIVE',
        phone: matchedEmployee?.phone || '+91 98450 11001',
        manager: matchedEmployee?.manager || (isAdminUser ? 'CEO Office' : 'Dr. Radhika Sen'),
        location: matchedEmployee?.location || 'Bangalore Campus, BLR-01',
        joiningDate: matchedEmployee?.joiningDate || '2023-01-10',
        avatarUrl: matchedEmployee?.avatarUrl || (isAdminUser 
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'),
      };

      // Persist real user profile into Firestore users collection for rules validation
      await setDoc(userDocRef, profileData, { merge: true });
      setUserProfile(profileData);
      return profileData;
    } catch (err) {
      console.warn('Could not initialize or fetch user profile from Firestore:', err);
      // Fallback in-memory profile bounded to user email if Firestore is unavailable
      const userEmail = (firebaseUser.email || '').toLowerCase().trim();
      const isAdminUser = userEmail === 'admin@prionix-demo.com' || userEmail === 'dhv2404@gmail.com';
      const fallback = isAdminUser ? DEMO_PROFILES['admin@prionix-demo.com'] : DEMO_PROFILES['employee@prionix-demo.com'];
      const profile = { ...fallback, uid: firebaseUser.uid, email: userEmail || fallback.email };
      setUserProfile(profile);
      return profile;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserProfile(currentUser);
        setLoading(false);
      } else {
        // Check for active demo session in localStorage
        const savedSession = localStorage.getItem('demoSession');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed?.employeeId) {
              const empId = parsed.employeeId;
              const role: UserRole = parsed.role || 'EMPLOYEE';
              const email = (empId === 'PRX-ADMIN' || empId === 'PRX-001')
                ? 'admin@prionix-demo.com'
                : (empId === 'PRX-002' ? 'employee@prionix-demo.com' : 'radhika.sen@prionix-corp.demo');

              const fallbackProfile = DEMO_PROFILES[email] || {
                uid: `demo-${empId.toLowerCase()}`,
                employeeId: empId,
                name: role === 'ADMIN' ? 'Siddharth Rao' : 'Devika Krishnan',
                email,
                role,
                departmentId: role === 'ADMIN' ? 'DEP-ENG' : 'DEP-AI',
                domainId: role === 'ADMIN' ? 'DOM-SWE' : 'DOM-AI',
                designation: role === 'ADMIN' ? 'VP of Engineering' : 'Senior AI Research Engineer',
                status: 'ACTIVE' as const,
                phone: '+91 98450 11001',
                manager: role === 'ADMIN' ? 'CEO Office' : 'Dr. Radhika Sen',
                location: 'Bangalore Campus, BLR-01',
                joiningDate: '2023-01-10',
                avatarUrl: role === 'ADMIN' 
                  ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
              };

              setUser({
                uid: fallbackProfile.uid,
                email: fallbackProfile.email,
                displayName: fallbackProfile.name,
              } as User);
              setUserProfile(fallbackProfile);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Could not restore demo session:', e);
          }
        }
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Resolves an Employee ID from the Firestore 'employees' collection to their registered corporate email
  const resolveEmployeeEmail = async (rawId: string): Promise<{ email: string; employeeData: any } | null> => {
    const cleanId = rawId.trim().toUpperCase();

    // 1. Direct document lookup by Employee ID in Firestore 'employees' collection
    try {
      const empDocRef = doc(db, 'employees', cleanId);
      const empSnap = await getDoc(empDocRef);
      if (empSnap.exists()) {
        const data = empSnap.data();
        if (data?.email) {
          return { email: data.email.toLowerCase().trim(), employeeData: data };
        }
      }
    } catch (err) {
      console.warn('Firestore direct employee lookup notice:', err);
    }

    // 2. Query 'employees' collection where employeeId == cleanId
    try {
      const q = query(collection(db, 'employees'), where('employeeId', '==', cleanId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        if (data?.email) {
          return { email: data.email.toLowerCase().trim(), employeeData: data };
        }
      }
    } catch (err) {
      console.warn('Firestore employee query lookup notice:', err);
    }

    // 3. Fallback for admin alias
    if (cleanId === 'PRX-ADMIN') {
      return { email: 'admin@prionix-demo.com', employeeData: null };
    }

    // 4. Fallback lookup across all 32 realistic enterprise demo employees
    const matchedEmployee = EMPLOYEES_DATA.find(e => e.employeeId.toUpperCase() === cleanId);
    if (matchedEmployee && matchedEmployee.email) {
      return { email: matchedEmployee.email.toLowerCase().trim(), employeeData: matchedEmployee };
    }

    return null;
  };

  const login = async (identifier: string, pass: string): Promise<boolean> => {
    setError(null);
    setLoading(true);

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setError('Please provide your Employee ID.');
      setLoading(false);
      return false;
    }

    if (!pass) {
      setError('Please provide your password.');
      setLoading(false);
      return false;
    }

    const cleanId = cleanInput.toUpperCase();

    // Resolve Employee ID from the Firestore 'employees' collection to the employee's registered email
    let resolved = await resolveEmployeeEmail(cleanInput);

    // If identifier already contains an @ symbol, allow resolving directly by email
    if (!resolved && cleanInput.includes('@')) {
      resolved = { email: cleanInput.toLowerCase(), employeeData: null };
    }

    if (!resolved || !resolved.email) {
      setError(`Employee ID "${cleanId}" was not found in the employee directory.`);
      setLoading(false);
      return false;
    }

    const { email, employeeData } = resolved;

    try {
      // Authenticate using signInWithEmailAndPassword(auth, email, password)
      let loggedUser: User;
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        loggedUser = cred.user;
      } catch (authErr: any) {
        // If user account is not yet provisioned in Firebase Auth, automatically provision it on first valid login
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          try {
            const created = await createUserWithEmailAndPassword(auth, email, pass);
            loggedUser = created.user;
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              throw authErr;
            }
            throw createErr;
          }
        } else {
          throw authErr;
        }
      }

      setUser(loggedUser);
      const profile = await loadUserProfile(loggedUser);

      if (profile) {
        await logActivity(
          'USER_LOGIN',
          profile.uid,
          profile.name,
          profile.role,
          'SECURITY',
          profile.employeeId,
          `Authenticated successfully via Firebase Auth as ${profile.role}.`
        );
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      console.warn('Firebase Authentication notice:', err?.message || err);

      // Handle Firebase operation-not-allowed: if password matches demo credential, enable graceful fallback session
      if (err?.code === 'auth/operation-not-allowed') {
        if (pass === 'PrionixDemo2025!') {
          const isAdminUser = cleanId === 'PRX-ADMIN' || cleanId === 'PRX-001';
          const fallbackRole: UserRole = isAdminUser ? 'ADMIN' : 'EMPLOYEE';
          const mockUid = `demo-${cleanId.toLowerCase()}`;

          const demoProfile: UserProfile = {
            uid: mockUid,
            employeeId: employeeData?.employeeId || cleanId,
            name: employeeData?.name || (isAdminUser ? 'Siddharth Rao' : 'Devika Krishnan'),
            email,
            role: fallbackRole,
            departmentId: employeeData?.departmentId || (isAdminUser ? 'DEP-ENG' : 'DEP-AI'),
            domainId: employeeData?.domainId || (isAdminUser ? 'DOM-SWE' : 'DOM-AI'),
            designation: employeeData?.designation || (isAdminUser ? 'VP of Engineering' : 'Senior AI Research Engineer'),
            status: 'ACTIVE',
            phone: employeeData?.phone || '+91 98450 11001',
            manager: employeeData?.manager || (isAdminUser ? 'CEO Office' : 'Dr. Radhika Sen'),
            location: employeeData?.location || 'Bangalore Campus, BLR-01',
            joiningDate: employeeData?.joiningDate || '2023-01-10',
            avatarUrl: employeeData?.avatarUrl || (isAdminUser 
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'),
          };

          const demoUser: User = {
            uid: mockUid,
            email,
            displayName: demoProfile.name,
          } as User;

          setUser(demoUser);
          setUserProfile(demoProfile);
          localStorage.setItem('demoSession', JSON.stringify({ employeeId: cleanId, role: fallbackRole }));
          setLoading(false);
          return true;
        }

        setError(
          'Firebase Authentication notice: Password sign-in is not enabled in Firebase Console (auth/operation-not-allowed).'
        );
      } else if (err?.code === 'auth/wrong-password') {
        setError('Incorrect password for Employee ID ' + cleanId + '.');
      } else if (err?.code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please verify your Employee ID and password.');
      } else if (err?.code === 'auth/too-many-requests') {
        setError('Too many failed sign-in attempts. Please try again later.');
      } else {
        setError(err?.message || 'Authentication failed. Please verify your credentials.');
      }

      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
  localStorage.removeItem("demoSession");

  try {
    await signOut(auth);
  } catch {}

  setUser(null);
  setUserProfile(null);
};

  const resetPassword = async (emailToReset: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, emailToReset);
      return true;
    } catch (err: any) {
      console.warn('Reset password notice:', err);
      if (err?.code === 'auth/operation-not-allowed') {
        setError(
          'Firebase: Error (auth/operation-not-allowed). Password sign-in is disabled in your Firebase project. Please enable the Email/Password sign-in method in your Firebase Console.'
        );
      } else {
        setError(err?.message || 'Could not send password reset email.');
      }
      return false;
    }
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    setLoading(true);
    if (userProfile) {
      const updated = { ...userProfile, role: targetRole };
      setUserProfile(updated);
      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid), { role: targetRole }, { merge: true });
        } catch (e) {
          console.warn('Role switch sync notice:', e);
        }
      }
    }
    setLoading(false);
  };

  const role: UserRole = userProfile?.role || 'EMPLOYEE';
  const isAdmin = role === 'ADMIN';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role,
        isAdmin,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        resetPassword,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
