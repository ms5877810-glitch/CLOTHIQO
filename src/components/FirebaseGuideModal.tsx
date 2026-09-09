import React, { useState } from 'react';
import { X, Copy, Check, Shield, Database, Key, ExternalLink } from 'lucide-react';
import { isFirebaseConfigured, firebaseConfig } from '../lib/firebase';

interface FirebaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIRESTORE_RULES_TEXT = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn()
        && exists(
          /databases/$(database)/documents/admins/$(request.auth.uid)
        )
        && get(
          /databases/$(database)/documents/admins/$(request.auth.uid)
        ).data.role == "admin";
    }

    /* PRODUCTS */

    match /products/{productId} {

      // Customers can view products
      allow read: if true;

      // Only admins can create/update/delete products
      allow create, update, delete: if isAdmin();
    }


    /* ORDERS */

    match /orders/{orderId} {

      // Customers can create orders
      allow create: if true;

      // Only admins can view orders
      allow read: if isAdmin();

      // Only admins can update/delete orders
      allow update, delete: if isAdmin();
    }


    /* ADMINS */

    match /admins/{adminId} {

      // Only admins can read admin documents
      allow read: if isAdmin();

      // Do NOT allow frontend users to create admin accounts
      allow create, update, delete: if false;
    }
  }
}`;

const ENV_SNIPPET = `# Firebase Web App Configuration (clothiqo)
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="clothiqo.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="clothiqo"
VITE_FIREBASE_STORAGE_BUCKET="clothiqo.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"`;

export const FirebaseGuideModal: React.FC<FirebaseGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, type: 'rules' | 'env') => {
    navigator.clipboard.writeText(text);
    if (type === 'rules') {
      setCopiedRules(true);
      setTimeout(() => setCopiedRules(false), 2000);
    } else {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    }
  };

  const configured = isFirebaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in text-[#111111]">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-[#dddddd] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#dddddd] flex items-center justify-between bg-[#f8f5ef]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#111111]">
                Firebase Configuration & Admin Setup Guide
              </h3>
              <p className="text-xs text-[#666666]">
                Status: {configured ? (
                  <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Connected ({firebaseConfig.projectId})
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Environment Variables Pending
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#cccccc] hover:bg-black/5 flex items-center justify-center text-[#111111] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-[#333333] leading-relaxed">
          {/* Section 1: Environment Variables */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-[#111111] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#111111]" />
                <span>1. Where to put Firebase Configuration</span>
              </h4>
              <button
                onClick={() => copyToClipboard(ENV_SNIPPET, 'env')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#cccccc] hover:bg-[#f0ece1] text-[11px] font-semibold transition cursor-pointer"
              >
                {copiedEnv ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEnv ? 'Copied' : 'Copy Template'}</span>
              </button>
            </div>
            <p>
              In Google AI Studio, open the <strong>Settings</strong> panel (or create a <code className="bg-[#f0ece1] px-1 py-0.5 rounded text-black font-mono">.env</code> file) and add these 6 client variables. You can find them in your Firebase Console under <em>Project Settings &gt; General &gt; Your apps &gt; Web app</em>:
            </p>
            <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-3 rounded-xl overflow-x-auto font-mono text-[11px] leading-snug">
              {ENV_SNIPPET}
            </pre>
          </div>

          {/* Section 2: Firebase Auth setup */}
          <div className="space-y-2 border-t border-[#eeeeee] pt-5">
            <h4 className="font-extrabold text-sm text-[#111111] flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#111111]" />
              <span>2. Enable Email/Password in Firebase Authentication</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-[#444444]">
              <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Firebase Console</a> and select your project.</li>
              <li>Navigate to <strong>Build &gt; Authentication</strong> in the sidebar.</li>
              <li>Click the <strong>Sign-in method</strong> tab.</li>
              <li>Enable <strong>Email/Password</strong> (passwordless email link can remain disabled).</li>
            </ol>
          </div>

          {/* Section 3: Creating First Admin Account */}
          <div className="space-y-2.5 border-t border-[#eeeeee] pt-5">
            <h4 className="font-extrabold text-sm text-[#111111] flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>3. Creating the First Admin Account Securely</span>
            </h4>
            <p>
              To maintain rock-solid security without hardcoding passwords in client code, CLOTHIQO verifies admin privilege against the protected <code className="bg-[#f0ece1] px-1 py-0.5 rounded font-mono font-bold">admins/&#123;uid&#125;</code> collection in Firestore.
            </p>
            <div className="bg-[#f8f5ef] p-4 rounded-xl border border-[#dddddd] space-y-2">
              <p className="font-bold text-[#111111]">Step-by-step:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-[#333333]">
                <li>In <strong>Firebase Console &gt; Authentication &gt; Users</strong>, click <strong>Add user</strong>. Enter your email (e.g. <code className="font-mono text-black">admin@clothiqo.com</code>) and a strong password.</li>
                <li>Copy the generated <strong>User UID</strong> (e.g. <code className="font-mono text-black">v8K2L09q...</code>).</li>
                <li>Go to <strong>Build &gt; Firestore Database</strong>.</li>
                <li>Click <strong>Start collection</strong>:
                  <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-[#555555]">
                    <li>Collection ID: <strong className="text-black font-mono">admins</strong></li>
                    <li>Document ID: paste your <strong>User UID</strong> from Step 2</li>
                    <li>Field 1: <strong className="text-black font-mono">email</strong> (string) = <code className="text-black">admin@clothiqo.com</code></li>
                    <li>Field 2: <strong className="text-black font-mono">role</strong> (string) = <code className="text-black font-mono font-bold">admin</code></li>
                  </ul>
                </li>
                <li>Now you can immediately log in through the CLOTHIQO <strong className="text-black">/admin/login</strong> portal!</li>
              </ol>
            </div>
          </div>

          {/* Section 4: Firestore Security Rules */}
          <div className="space-y-2.5 border-t border-[#eeeeee] pt-5">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-[#111111] flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600" />
                <span>4. Firestore Security Rules (Already included in firestore.rules)</span>
              </h4>
              <button
                onClick={() => copyToClipboard(FIRESTORE_RULES_TEXT, 'rules')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#cccccc] hover:bg-[#f0ece1] text-[11px] font-semibold transition cursor-pointer"
              >
                {copiedRules ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRules ? 'Copied' : 'Copy Rules'}</span>
              </button>
            </div>
            <p>
              In Firebase Console under <strong>Firestore Database &gt; Rules</strong>, paste these rules (or deploy via Firebase CLI). They protect all product updates, order records, and admin roles:
            </p>
            <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-3 rounded-xl overflow-x-auto font-mono text-[11px] leading-snug max-h-52">
              {FIRESTORE_RULES_TEXT}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#dddddd] bg-[#f8f5ef] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-bold transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
