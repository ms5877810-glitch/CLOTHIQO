import React, { useState, useEffect } from 'react';
import { CourierConfig } from '../../types';
import {
  getCourierSettings,
  saveCourierSettings,
  DEFAULT_COURIER_SETTINGS,
} from '../../lib/firebase';
import {
  Truck,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  ExternalLink,
  Layers,
  Send,
  Zap,
} from 'lucide-react';

interface AdminCourierProps {
  onSettingsUpdated?: () => void;
}

export const AdminCourier: React.FC<AdminCourierProps> = ({
  onSettingsUpdated,
}) => {
  const [config, setConfig] = useState<CourierConfig>(DEFAULT_COURIER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const loaded = await getCourierSettings();
        setConfig(loaded);
      } catch (err: any) {
        console.warn('Courier settings load notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await saveCourierSettings(config);
      setSuccessMsg('Courier integration configurations saved successfully!');
      if (onSettingsUpdated) {
        onSettingsUpdated();
      }
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save courier settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestDispatch = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/courier/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `TEST-${Date.now().toString().slice(-4)}`,
          provider: config.defaultProvider,
          customerName: 'CLOTHIQO Test Recipient',
          phone: '01700000000',
          address: 'Gulshan 2, Dhaka',
          total: 2190,
          courierConfig: config,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Integration Active: ${data.message} (Consignment: ${data.consignmentId})`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Courier probe failed',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Server-side courier service unreachable',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#777777] bg-white rounded-2xl border border-[#ece7dc]">
        Loading courier configurations...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-700" />
            <span>Courier Logistics Integration</span>
          </h2>
          <p className="text-xs text-[#777777] mt-0.5">
            Connect Steadfast, Pathao, Carrybee, and Manual in-house riders for automated order dispatch
          </p>
        </div>

        <button
          type="button"
          onClick={handleTestDispatch}
          disabled={testing}
          className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-xs font-bold text-blue-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>{testing ? 'Probing Gateway...' : `Test ${config.defaultProvider} Gateway`}</span>
        </button>
      </div>

      {/* Test result banner */}
      {testResult && (
        <div
          className={`p-4 text-xs rounded-2xl font-bold flex items-center gap-2 animate-in fade-in ${
            testResult.success
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Security callout */}
      <div className="p-4 rounded-2xl bg-[#faf8f4] border border-[#e8e2d5] text-xs text-[#555555] flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-[#111111]">Server-Side Security Notice:</strong> Courier API credentials are sent directly to the server backend when dispatching. Keys are never exposed to public storefront visitors or client bundle source maps.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Default Provider Selector */}
        <div className="bg-white p-6 rounded-2xl border border-[#ece7dc] shadow-sm space-y-4">
          <label className="font-bold text-xs uppercase text-[#111111] block">
            Primary Dispatch Partner
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['Steadfast', 'Pathao', 'Carrybee', 'Manual'] as const).map((prov) => (
              <button
                type="button"
                key={prov}
                onClick={() => setConfig({ ...config, defaultProvider: prov })}
                className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  config.defaultProvider === prov
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                    : 'border-[#d5cfc0] bg-[#faf8f4] text-[#444444] hover:border-black'
                }`}
              >
                <Truck className={`w-4 h-4 ${config.defaultProvider === prov ? 'text-blue-600' : 'text-[#777777]'}`} />
                <span>{prov}</span>
                {config.defaultProvider === prov && (
                  <span className="text-[9px] uppercase tracking-wider bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                    Default
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Steadfast Courier */}
          <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#ece7dc]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-xs uppercase text-[#111111]">Steadfast Courier</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.steadfast.enabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      steadfast: { ...config.steadfast, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#555555] block mb-1">
                  Steadfast API Key
                </label>
                <input
                  type="password"
                  value={config.steadfast.apiKey}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      steadfast: { ...config.steadfast, apiKey: e.target.value },
                    })
                  }
                  placeholder="Enter API Key from Steadfast portal..."
                  className="w-full px-3 py-2 rounded-xl border border-[#d5cfc0] font-mono text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#555555] block mb-1">
                  Steadfast Secret Key
                </label>
                <input
                  type="password"
                  value={config.steadfast.secretKey}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      steadfast: { ...config.steadfast, secretKey: e.target.value },
                    })
                  }
                  placeholder="Enter Secret Key from Steadfast portal..."
                  className="w-full px-3 py-2 rounded-xl border border-[#d5cfc0] font-mono text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* 2. Pathao Courier */}
          <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#ece7dc]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <h3 className="font-bold text-xs uppercase text-[#111111]">Pathao Courier</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.pathao.enabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      pathao: { ...config.pathao, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#555555] block mb-1">
                  Pathao Client ID
                </label>
                <input
                  type="text"
                  value={config.pathao.clientId}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      pathao: { ...config.pathao, clientId: e.target.value },
                    })
                  }
                  placeholder="Client ID from Pathao Merchant portal"
                  className="w-full px-3 py-2 rounded-xl border border-[#d5cfc0] font-mono text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#555555] block mb-1">
                  Pathao Store ID
                </label>
                <input
                  type="text"
                  value={config.pathao.storeId}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      pathao: { ...config.pathao, storeId: e.target.value },
                    })
                  }
                  placeholder="Store ID"
                  className="w-full px-3 py-2 rounded-xl border border-[#d5cfc0] font-mono text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* 3. Carrybee */}
          <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#ece7dc]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <h3 className="font-bold text-xs uppercase text-[#111111]">Carrybee Courier</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.carrybee.enabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      carrybee: { ...config.carrybee, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#555555] block mb-1">
                  Carrybee API Key
                </label>
                <input
                  type="password"
                  value={config.carrybee.apiKey}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      carrybee: { ...config.carrybee, apiKey: e.target.value },
                    })
                  }
                  placeholder="Carrybee merchant API key"
                  className="w-full px-3 py-2 rounded-xl border border-[#d5cfc0] font-mono text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#555555] block mb-1">
                  Client Code
                </label>
                <input
                  type="text"
                  value={config.carrybee.clientCode}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      carrybee: { ...config.carrybee, clientCode: e.target.value },
                    })
                  }
                  placeholder="Carrybee client code"
                  className="w-full px-3 py-2 rounded-xl border border-[#d5cfc0] font-mono text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* 4. Manual / In-House */}
          <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#ece7dc]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <h3 className="font-bold text-xs uppercase text-[#111111]">Manual / In-House Rider</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.manual.enabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      manual: { ...config.manual, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#555555] block mb-1">
                  Dispatch Rider Note
                </label>
                <textarea
                  rows={3}
                  value={config.manual.note}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      manual: { ...config.manual, note: e.target.value },
                    })
                  }
                  placeholder="Instructions for in-house delivery team..."
                  className="w-full px-3 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-black uppercase tracking-wider transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Courier Integration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
