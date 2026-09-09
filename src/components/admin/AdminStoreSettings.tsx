import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Phone, Mail, MapPin, MessageSquare, Clock } from 'lucide-react';

export const AdminStoreSettings: React.FC = () => {
  const [storeName, setStoreName] = useState('CLOTHIQO Menswear');
  const [currency, setCurrency] = useState('BDT (৳)');
  const [phone, setPhone] = useState('+880 1700-000000');
  const [email, setEmail] = useState('support@clothiqo.com');
  const [whatsapp, setWhatsapp] = useState('+880 1700-000000');
  const [address, setAddress] = useState('Banani, Road 11, Dhaka 1213, Bangladesh');
  const [hours, setHours] = useState('Everyday 10:00 AM – 10:00 PM');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      'clothiqo_store_general_settings',
      JSON.stringify({ storeName, currency, phone, email, whatsapp, address, hours })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-[#ece7dc] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-900" />
            <span>Store Settings &amp; Contact Info</span>
          </h2>
          <p className="text-xs text-[#777777] mt-0.5">
            Manage general operations, customer helpline channels, and showroom address
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Store settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-[#ece7dc] shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
              Store Legal Name
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black font-semibold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
              Base Storefront Currency
            </label>
            <input
              type="text"
              disabled
              value={currency}
              className="w-full px-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#f2ede4] text-[#777777] font-mono cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
              Customer Support Phone
            </label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black font-medium"
              />
              <Phone className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
              Customer Support Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black font-medium"
              />
              <Mail className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
              WhatsApp Hotline
            </label>
            <div className="relative">
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black font-medium"
              />
              <MessageSquare className="w-4 h-4 text-emerald-700 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
              Operational Hours
            </label>
            <div className="relative">
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black font-medium"
              />
              <Clock className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase text-[#555555] block mb-1">
            Dispatch Hub / Flagship Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#d5cfc0] text-xs bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-black font-medium"
            />
            <MapPin className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-black uppercase tracking-wider transition shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
