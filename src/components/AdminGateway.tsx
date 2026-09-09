import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import AdminLogin from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface AdminGatewayProps {
  initialTab?: string;
}

type AuthStage =
  | 'loading'
  | 'signed_out'
  | 'authorized'
  | 'denied';

export default function AdminGateway({
  initialTab,
}: AdminGatewayProps = {}) {
  const navigate = useNavigate();

  const [authStage, setAuthStage] =
    useState<AuthStage>('loading');

  const [adminUser, setAdminUser] =
    useState<any>(null);

  useEffect(() => {
    if (!auth || !db) {
      console.error('Firebase Auth or Firestore is not initialized');
      setAuthStage('signed_out');
      return;
    }

    let mounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: User | null) => {
        if (!mounted) return;

        if (!user) {
          setAdminUser(null);
          setAuthStage('signed_out');
          return;
        }

        try {
          const userRef = doc(db!, 'users', user.uid);
          const snapshot = await getDoc(userRef);

          if (!mounted) return;

          const data = snapshot.exists()
            ? snapshot.data()
            : null;

          // Temporary safe diagnostics.
          console.log('Admin auth UID:', user.uid);
          console.log(
            'Admin document exists:',
            snapshot.exists()
          );
          console.log('Admin role:', data?.role);
          console.log('Admin active:', data?.active);

          const authorized =
            snapshot.exists() &&
            data?.role === 'admin' &&
            data?.active === true;

          if (!authorized) {
            await signOut(auth!);

            if (mounted) {
              setAdminUser(null);
              setAuthStage('denied');
            }

            return;
          }

          setAdminUser({
            uid: user.uid,
            email: user.email || '',
            role: 'admin',
          });

          setAuthStage('authorized');
        } catch (error) {
          console.error(
            'Admin Firestore verification error:',
            error
          );

          try {
            await signOut(auth!);
          } catch {}

          if (mounted) {
            setAdminUser(null);
            setAuthStage('denied');
          }
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }

    setAdminUser(null);
    setAuthStage('signed_out');
  };

  const showLogin = (error?: string) => (
    <AdminLogin
      initialError={error}
      onSuccess={(user) => {
        setAdminUser(user);
        setAuthStage('authorized');
      }}
      onLoginSuccess={(user) => {
        setAdminUser(user);
        setAuthStage('authorized');
      }}
      onBackToStore={() => navigate('/')}
      onCancel={() => navigate('/')}
    />
  );

  if (authStage === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f7f5ee] px-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl border border-[#e8e2d5] bg-white p-8 text-center shadow-lg">
          <ShieldCheck className="h-6 w-6" />

          <h2 className="text-lg font-black uppercase">
            CLOTHIQO ADMIN
          </h2>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#666]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying admin session...
          </div>
        </div>
      </div>
    );
  }

  if (authStage === 'signed_out') {
    return showLogin();
  }

  if (authStage === 'denied') {
    return showLogin('Access denied');
  }

  return (
    <AdminDashboard
      admin={adminUser}
      adminEmail={adminUser?.email}
      onLogout={handleLogout}
      onExit={() => navigate('/')}
      onOpenStorefront={() => navigate('/')}
    />
  );
}

export { AdminGateway };
