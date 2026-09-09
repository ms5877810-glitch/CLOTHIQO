import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { checkIsAdmin, onAuthStateListener, logoutAdminFromFirebase } from "../lib/firebase";

export default function AdminProtected({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateListener(async (user) => {
      if (user) {
        try {
          // Check users/{uid} for role === 'admin' && active === true
          const isAdmin = await checkIsAdmin(user.uid);
          if (isAdmin) {
            if (isMounted) {
              setAuthenticated(true);
              setLoading(false);
            }
            return;
          } else {
            // Not authorized: sign out immediately
            await logoutAdminFromFirebase();
            if (isMounted) {
              setAuthenticated(false);
              setLoading(false);
            }
            return;
          }
        } catch {
          if (isMounted) {
            setAuthenticated(false);
            setLoading(false);
          }
          return;
        }
      }

      if (isMounted) {
        setAuthenticated(false);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#f8f5ef] text-[#111111] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-semibold tracking-wide">Checking admin access...</div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

export { AdminProtected };
