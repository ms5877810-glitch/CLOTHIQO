import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  Mail,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

interface AdminLoginProps {
  onSuccess?: (user: any) => void;
  onLoginSuccess?: (user: any) => void;
  onBackToStore?: () => void;
  onCancel?: () => void;
  initialError?: string;
}

export default function AdminLogin({
  onBackToStore,
  onCancel,
  initialError,
}: AdminLoginProps = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  React.useEffect(() => {
    setError(initialError || '');
  }, [initialError]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (!auth) {
      setError('Authentication is unavailable.');
      return;
    }

    setLoading(true);

    try {
      /*
       * Login ONLY.
       *
       * AdminGateway listens for the Firebase auth-state change
       * and performs the users/{uid} role + active verification.
       */
      await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      // Do not authorize here.
      // Do not navigate here.
      // AdminGateway will detect the authenticated user.
    } catch (err: any) {
      console.error(
        'Firebase admin login error:',
        err?.code || err?.message
      );

      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  const handleBack =
    onBackToStore ||
    onCancel ||
    (() => navigate('/'));

  return (
    <div className="admin-login min-h-screen flex items-center justify-center py-12 px-4 bg-[#f7f5ee]">
      <div className="login-card relative w-full max-w-md mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-[#e8e2d5] shadow-xl">

        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#f0eae0]">
          <button
            type="button"
            onClick={handleBack}
            className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </button>

          <div className="flex items-center gap-1.5 text-[#555555] bg-[#f8f6f0] px-2.5 py-1 rounded-full text-[11px] font-semibold border border-[#ece7dc]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>CLOTHIQO Admin</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#111111] uppercase">
            CLOTHIQO
          </h1>

          <p className="text-xs font-extrabold text-[#777777] uppercase tracking-[3px] mt-1.5">
            ADMIN LOGIN
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className="space-y-4 text-left"
        >
          <div>
            <label
              htmlFor="adminEmail"
              className="block mb-1.5 text-xs font-bold text-[#333333] uppercase tracking-wider"
            >
              Email Address
            </label>

            <div className="relative">
              <input
                id="adminEmail"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="name@example.com"
                autoComplete="username"
                required
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[#d1cbbe] bg-[#fcfbf9] text-sm text-[#111111] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition"
              />

              <Mail className="w-4 h-4 text-[#888888] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label
              htmlFor="adminPassword"
              className="block mb-1.5 text-xs font-bold text-[#333333] uppercase tracking-wider"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="adminPassword"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#d1cbbe] bg-[#fcfbf9] text-sm text-[#111111] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition"
              />

              <Lock className="w-4 h-4 text-[#888888] absolute left-3.5 top-3.5" />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                className="absolute right-3.5 top-3.5 text-[#888888] hover:text-[#111111]"
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-black tracking-widest uppercase transition shadow-md disabled:opacity-50 flex items-center justify-center"
            >
              {loading
                ? 'LOGGING IN...'
                : 'LOGIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { AdminLogin };
