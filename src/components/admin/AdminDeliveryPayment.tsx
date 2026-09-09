import React, { useState, useEffect } from 'react';
import { DeliverySettings, PaymentSettings } from '../../types';
import {
  getDeliverySettings,
  saveDeliverySettings,
  getPaymentSettings,
  savePaymentSettings,
  DEFAULT_DELIVERY_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
} from '../../lib/firebase';
import {
  Truck,
  CreditCard,
  Save,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Smartphone,
  ShieldCheck,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface AdminDeliveryPaymentProps {
  mode?: 'all' | 'delivery' | 'payments';
  onSettingsUpdated?: () => void;
}

export const AdminDeliveryPayment: React.FC<AdminDeliveryPaymentProps> = ({
  mode = 'all',
  onSettingsUpdated,
}) => {
  const [delivery, setDelivery] = useState<DeliverySettings>(DEFAULT_DELIVERY_SETTINGS);
  const [payment, setPayment] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const [deliv, pay] = await Promise.all([
          getDeliverySettings(),
          getPaymentSettings(),
        ]);
        setDelivery(deliv);
        setPayment(pay);
      } catch (err: any) {
        console.warn('Settings load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await Promise.all([
        saveDeliverySettings(delivery),
        savePaymentSettings(payment),
      ]);
      setSuccessMsg('Delivery fees and payment settings saved successfully!');
      if (onSettingsUpdated) {
        onSettingsUpdated();
      }
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset delivery and payment settings to original defaults?')) {
      setDelivery(DEFAULT_DELIVERY_SETTINGS);
      setPayment(DEFAULT_PAYMENT_SETTINGS);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#777777] bg-white rounded-2xl border border-[#ece7dc]">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] flex items-center gap-2">
            {mode === 'payments' ? (
              <>
                <CreditCard className="w-5 h-5 text-emerald-800" />
                <span>Payment Gateways &amp; bKash Setup</span>
              </>
            ) : mode === 'delivery' ? (
              <>
                <Truck className="w-5 h-5 text-amber-900" />
                <span>Regional Delivery Charges</span>
              </>
            ) : (
              <>
                <Truck className="w-5 h-5 text-amber-900" />
                <span>Delivery Fees &amp; Checkout Payments</span>
              </>
            )}
          </h2>
          <p className="text-xs text-[#777777] mt-0.5">
            {mode === 'payments'
              ? 'Configure bKash numbers, transaction instructions, and Cash on Delivery methods'
              : mode === 'delivery'
              ? 'Configure regional shipping charges and estimated delivery timelines for inside/outside Dhaka'
              : 'Configure regional shipping charges, bKash merchant accounts, and customer payment methods'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl border border-[#d5cfc0] hover:bg-black/5 text-xs font-bold text-[#333333] transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Delivery Charges */}
        {(mode === 'all' || mode === 'delivery') && (
          <div className="bg-white p-6 rounded-2xl border border-[#ece7dc] shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#ece7dc]">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wide text-[#111111]">
                Nationwide Delivery Charges
              </h3>
              <p className="text-[11px] text-[#777777]">
                These rates are automatically calculated during customer checkout based on selected city
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Inside Dhaka */}
            <div className="p-4 rounded-2xl bg-[#faf8f4] border border-[#e8e2d5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-[#111111]">Inside Dhaka Division</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Standard Rate
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                  Delivery Fee (BDT ৳) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-[#555555]">৳</span>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    required
                    value={delivery.insideDhakaFee}
                    onChange={(e) => setDelivery({ ...delivery, insideDhakaFee: Number(e.target.value) || 0 })}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#d5cfc0] text-sm font-mono font-bold bg-white focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                  Estimated Delivery Timeline
                </label>
                <input
                  type="text"
                  value={delivery.estimatedInside}
                  onChange={(e) => setDelivery({ ...delivery, estimatedInside: e.target.value })}
                  placeholder="e.g. 24-48 Hours"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-white focus:outline-none focus:border-black"
                />
              </div>
            </div>

            {/* Outside Dhaka */}
            <div className="p-4 rounded-2xl bg-[#faf8f4] border border-[#e8e2d5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-[#111111]">Outside Dhaka (Nationwide)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Regional Rate
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                  Delivery Fee (BDT ৳) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-[#555555]">৳</span>
                  <input
                    type="number"
                    min="0"
                    max="1500"
                    required
                    value={delivery.outsideDhakaFee}
                    onChange={(e) => setDelivery({ ...delivery, outsideDhakaFee: Number(e.target.value) || 0 })}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#d5cfc0] text-sm font-mono font-bold bg-white focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                  Estimated Delivery Timeline
                </label>
                <input
                  type="text"
                  value={delivery.estimatedOutside}
                  onChange={(e) => setDelivery({ ...delivery, estimatedOutside: e.target.value })}
                  placeholder="e.g. 3-5 Days"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-white focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Section 2: Payment Methods (COD & bKash) */}
        {(mode === 'all' || mode === 'payments') && (
          <div className="bg-white p-6 rounded-2xl border border-[#ece7dc] shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#ece7dc]">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wide text-[#111111]">
                Payment Methods &amp; bKash Setup
              </h3>
              <p className="text-[11px] text-[#777777]">
                Control available checkout channels and configure your bKash payment verification parameters
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cash on Delivery (COD) Card */}
            <div className="p-4 rounded-2xl bg-[#faf8f4] border border-[#e8e2d5] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-xs uppercase text-[#111111]">Cash on Delivery (COD)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payment.codEnabled}
                    onChange={(e) => setPayment({ ...payment, codEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <p className="text-xs text-[#666666] leading-relaxed">
                Allow customers to pay physical cash upon package handover by delivery agents.
              </p>
            </div>

            {/* bKash Payment Card */}
            <div className="p-4 rounded-2xl bg-[#fff5f8] border border-[#fbd4e2] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#e2136e]" />
                  <span className="font-bold text-xs uppercase text-[#e2136e]">bKash Payment</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payment.bkashEnabled}
                    onChange={(e) => setPayment({ ...payment, bkashEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e2136e]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                    bKash Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={payment.bkashNumber}
                    onChange={(e) => setPayment({ ...payment, bkashNumber: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-[#f9c2d6] text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-[#e2136e]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                    Account Type
                  </label>
                  <select
                    value={payment.bkashType}
                    onChange={(e) => setPayment({ ...payment, bkashType: e.target.value as 'Personal' | 'Merchant' })}
                    className="w-full px-3 py-2 rounded-xl border border-[#f9c2d6] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-[#e2136e] cursor-pointer"
                  >
                    <option value="Personal">Personal (Send Money)</option>
                    <option value="Merchant">Merchant (Make Payment)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
                  Customer Instructions
                </label>
                <textarea
                  rows={2}
                  value={payment.bkashInstructions}
                  onChange={(e) => setPayment({ ...payment, bkashInstructions: e.target.value })}
                  placeholder="Instructions displayed to customers during checkout..."
                  className="w-full px-3 py-2 rounded-xl border border-[#f9c2d6] text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#e2136e]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-black uppercase tracking-wider transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Delivery & Payment Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
