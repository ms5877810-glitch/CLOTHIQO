import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  onAuthStateListener,
  checkIsAdmin,
  logoutAdminFromFirebase,
} from '../lib/firebase';
import { AdminUser } from '../types';
import AdminLogin from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface AdminGatewayProps {
  initialTab?: string;
}

export default function AdminGateway({ initialTab }: AdminGatewayProps = {}) {
  // STATE 1: Firebase auth state is still loading
  const [authStage, setAuthStage] = useState<
    'loading' | 'signed_out' | 'authorized' | 'denied'
  >('loading');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateListener(async (user) => {
      if (!isMounted) return;

      if (!user) {
        // STATE 2: No Firebase user is signed in -> Render AdminLogin
        if (isMounted) {
          setAdminUser(null);
          setAuthStage('signed_out');
        }
        return;
      }

      // STATE 3: User signed in via Firebase -> Check Firestore users/{user.uid}
      try {
        const isAdmin = await checkIsAdmin(user.uid);

        if (!isMounted) return;

        if (isAdmin) {
          setAdminUser({
            uid: user.uid,
            email: user.email || '',
            role: 'admin',
          });
          setAuthStage('authorized');
        } else {
          // If Firebase authentication succeeds but role/active verification fails:
          // signOut(auth) then return to the login form and show: "Access denied"
          await logoutAdminFromFirebase();
          if (isMounted) {
            setAdminUser(null);
            setAuthStage('denied');
          }
        }
      } catch (err) {
        console.warn('Admin authorization check failed:', err);
        await logoutAdminFromFirebase();
        if (isMounted) {
          setAdminUser(null);
          setAuthStage('denied');
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await logoutAdminFromFirebase();
    setAdminUser(null);
    setAuthStage('signed_out');
  };

  // STATE 1 — Firebase auth state is still loading:
  // Show a CLOTHIQO loading/verification screen.
  // Do NOT show Access denied.
  if (authStage === 'loading') {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#f7f5ee] text-[#111111] font-sans px-4">
        <div className="flex flex-col items-center gap-3 p-8 bg-white rounded-3xl border border-[#e8e2d5] shadow-lg max-w-sm w-full text-center">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-900 mb-1">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight text-[#111111]">
            CLOTHIQO ADMIN
          </h2>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#666666]">
            <Loader2 className="w-4 h-4 animate-spin text-amber-900" />
            <span>Verifying admin session...</span>
          </div>
        </div>
      </div>
    );
  }

  // STATE 2 — No Firebase user is signed in:
  // Render <AdminLogin />.
  // The login form must contain ONLY:
  // - Email
  // - Password
  // - Login
  // - Back to Store
  // Fields start empty.
  if (authStage === 'signed_out') {
    return (
      <AdminLogin
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
  }

  // If Firebase authentication succeeds but role/active verification fails:
  // Return to the login form and show: "Access denied"
  if (authStage === 'denied') {
    return (
      <AdminLogin
        initialError="Access denied"
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
  }

  // Authorized Admin -> Render <AdminDashboard />
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
